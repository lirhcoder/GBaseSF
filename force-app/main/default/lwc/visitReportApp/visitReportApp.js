import { LightningElement, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import getRecentReports from '@salesforce/apex/VisitReportController.getRecentReports';

const COLUMNS = [
    { label: 'Report #', fieldName: 'Name', type: 'text' },
    {
        label: '訪問日',
        fieldName: 'Visit_Date__c',
        type: 'date',
        typeAttributes: {
            year: 'numeric',
            month: 'short',
            day: '2-digit'
        }
    },
    { label: '会社名', fieldName: 'Company_Name__c', type: 'text' },
    { label: '担当者', fieldName: 'Contact_Name__c', type: 'text' },
    {
        label: '商談金額',
        fieldName: 'Opportunity_Amount__c',
        type: 'currency',
        typeAttributes: { currencyCode: 'JPY' }
    },
    {
        type: 'action',
        typeAttributes: {
            rowActions: [
                { label: '表示', name: 'view' },
                { label: '編集', name: 'edit' }
            ]
        }
    }
];

export default class VisitReportApp extends LightningElement {
    @track currentTranscript = '';
    @track currentRecordId = null;
    @track recentReports = [];
    @track isLoadingReports = false;
    @track showRecentReports = true;

    columns = COLUMNS;
    wiredReportsResult;

    // Wire to get recent reports
    @wire(getRecentReports, { limitCount: 5 })
    wiredReports(result) {
        this.wiredReportsResult = result;
        if (result.data) {
            this.recentReports = result.data;
            this.isLoadingReports = false;
        } else if (result.error) {
            console.error('Error loading recent reports:', result.error);
            this.isLoadingReports = false;
        }
    }

    // Handle analyze event from voice input
    handleAnalyze(event) {
        const text = event.detail.text;
        if (text) {
            // Get the form component and trigger analysis
            const formComponent = this.template.querySelector('c-visit-report-form');
            if (formComponent) {
                formComponent.analyzeText(text);
            }
        }
    }

    // Handle transcript change from voice input
    handleTranscriptChange(event) {
        this.currentTranscript = event.detail.text;
    }

    // Handle save event from form
    handleSave(event) {
        const recordId = event.detail.recordId;
        this.currentRecordId = recordId;

        // Update preview with record ID for PDF generation
        const previewComponent = this.template.querySelector('c-report-preview');
        if (previewComponent) {
            previewComponent.setRecordId(recordId);
        }

        // Refresh recent reports
        this.refreshRecentReports();
    }

    // Handle preview event from form
    handlePreview(event) {
        const formData = event.detail.formData;

        // Update preview component
        const previewComponent = this.template.querySelector('c-report-preview');
        if (previewComponent) {
            previewComponent.setReportData(formData);
            if (this.currentRecordId) {
                previewComponent.setRecordId(this.currentRecordId);
            }
        }

        // Scroll to preview
        this.scrollToPreview();
    }

    // Handle new report button
    handleNewReport() {
        // Reset state
        this.currentRecordId = null;
        this.currentTranscript = '';

        // Reset components (would need to implement reset methods)
        this.dispatchEvent(new ShowToastEvent({
            title: '新規作成',
            message: '新しい報告書を作成できます',
            variant: 'info'
        }));

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Handle row action on recent reports
    handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;

        switch (actionName) {
            case 'view':
                this.viewReport(row.Id);
                break;
            case 'edit':
                this.editReport(row.Id);
                break;
            default:
                break;
        }
    }

    viewReport(recordId) {
        // Navigate to record page
        window.open(`/${recordId}`, '_blank');
    }

    editReport(recordId) {
        // Would load report into form for editing
        this.dispatchEvent(new ShowToastEvent({
            title: '編集機能',
            message: '編集機能は開発中です',
            variant: 'info'
        }));
    }

    // Refresh recent reports
    async refreshRecentReports() {
        this.isLoadingReports = true;
        await refreshApex(this.wiredReportsResult);
    }

    // Scroll to preview section
    scrollToPreview() {
        const previewElement = this.template.querySelector('c-report-preview');
        if (previewElement) {
            previewElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    // Getters
    get hasRecentReports() {
        return this.recentReports && this.recentReports.length > 0;
    }
}