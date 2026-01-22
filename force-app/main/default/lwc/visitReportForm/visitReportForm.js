import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import analyzeInput from '@salesforce/apex/VisitReportController.analyzeInput';
import saveVisitReport from '@salesforce/apex/VisitReportController.saveVisitReport';

export default class VisitReportForm extends LightningElement {
    @api recordId;

    @track formData = {
        visitDate: this.getTodayDate(),
        companyName: '',
        contactName: '',
        contactTitle: '',
        visitPurpose: '',
        discussionSummary: [],
        opportunityAmount: null,
        nextActions: [],
        expectedCloseDate: null,
        rawInput: ''
    };

    @track isLoading = false;
    @track loadingMessage = '';
    @track hasAnalysisResult = false;

    // Lifecycle
    connectedCallback() {
        this.formData.visitDate = this.getTodayDate();
    }

    // Public method to receive analyzed data from parent
    @api
    setAnalyzedData(data, rawInput) {
        this.hasAnalysisResult = true;
        this.formData = {
            ...this.formData,
            visitDate: data.visitDate || this.getTodayDate(),
            companyName: data.companyName || '',
            contactName: data.contactName || '',
            contactTitle: data.contactTitle || '',
            visitPurpose: data.visitPurpose || '',
            discussionSummary: data.discussionSummary || [],
            opportunityAmount: data.opportunityAmount || null,
            nextActions: data.nextActions || [],
            expectedCloseDate: data.expectedCloseDate || null,
            rawInput: rawInput || ''
        };
    }

    // Public method to trigger AI analysis
    @api
    async analyzeText(text) {
        if (!text || text.trim() === '') {
            return;
        }

        this.isLoading = true;
        this.loadingMessage = 'AI分析中... / Analyzing with AI...';

        try {
            const result = await analyzeInput({ inputText: text });
            this.setAnalyzedData(result, text);

            this.dispatchEvent(new ShowToastEvent({
                title: '成功',
                message: 'AI分析が完了しました',
                variant: 'success'
            }));
        } catch (error) {
            console.error('Analysis error:', error);
            this.dispatchEvent(new ShowToastEvent({
                title: 'エラー',
                message: error.body?.message || 'AI分析に失敗しました',
                variant: 'error'
            }));
        } finally {
            this.isLoading = false;
        }
    }

    // Event Handlers
    handleFieldChange(event) {
        const field = event.target.name;
        let value = event.target.value;

        // Handle currency field
        if (field === 'opportunityAmount') {
            value = value ? parseFloat(value) : null;
        }

        this.formData = {
            ...this.formData,
            [field]: value
        };
    }

    handleTextAreaChange(event) {
        const field = event.target.name;
        const value = event.target.value;

        // Convert text to array (split by newlines)
        const arrayValue = value
            .split('\n')
            .map(line => line.replace(/^[•\-\*]\s*/, '').trim())
            .filter(line => line !== '');

        this.formData = {
            ...this.formData,
            [field]: arrayValue
        };
    }

    async handleSave() {
        if (!this.validateForm()) {
            return;
        }

        this.isLoading = true;
        this.loadingMessage = '保存中... / Saving...';

        try {
            const reportData = JSON.stringify(this.formData);
            const recordId = await saveVisitReport({ reportData: reportData });

            this.recordId = recordId;

            this.dispatchEvent(new ShowToastEvent({
                title: '成功',
                message: '訪問報告が保存されました',
                variant: 'success'
            }));

            // Dispatch event to parent
            this.dispatchEvent(new CustomEvent('save', {
                detail: { recordId: recordId }
            }));
        } catch (error) {
            console.error('Save error:', error);
            this.dispatchEvent(new ShowToastEvent({
                title: 'エラー',
                message: error.body?.message || '保存に失敗しました',
                variant: 'error'
            }));
        } finally {
            this.isLoading = false;
        }
    }

    handlePreview() {
        // Dispatch event to show preview
        this.dispatchEvent(new CustomEvent('preview', {
            detail: { formData: this.formData }
        }));
    }

    // Validation
    validateForm() {
        const allValid = [...this.template.querySelectorAll('lightning-input')]
            .reduce((valid, input) => {
                input.reportValidity();
                return valid && input.checkValidity();
            }, true);

        if (!allValid) {
            this.dispatchEvent(new ShowToastEvent({
                title: '入力エラー',
                message: '必須項目を入力してください',
                variant: 'warning'
            }));
        }

        return allValid;
    }

    // Getters
    get discussionSummaryText() {
        if (Array.isArray(this.formData.discussionSummary)) {
            return this.formData.discussionSummary.map(item => '• ' + item).join('\n');
        }
        return this.formData.discussionSummary || '';
    }

    get nextActionsText() {
        if (Array.isArray(this.formData.nextActions)) {
            return this.formData.nextActions.map(item => '• ' + item).join('\n');
        }
        return this.formData.nextActions || '';
    }

    get isSaveDisabled() {
        return !this.formData.companyName || this.formData.companyName.trim() === '';
    }

    // Utility
    getTodayDate() {
        const today = new Date();
        return today.toISOString().split('T')[0];
    }
}