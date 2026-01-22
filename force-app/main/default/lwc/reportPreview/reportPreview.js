import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import generatePDF from '@salesforce/apex/VisitReportController.generatePDF';

export default class ReportPreview extends LightningElement {
    @api recordId;
    @track reportData = null;
    @track isLoading = false;

    // Set report data from parent
    @api
    setReportData(data) {
        this.reportData = data;
    }

    // Set record ID for PDF generation
    @api
    setRecordId(id) {
        this.recordId = id;
    }

    // Download PDF
    async handleDownloadPDF() {
        if (!this.recordId) {
            this.dispatchEvent(new ShowToastEvent({
                title: '警告',
                message: 'PDFをダウンロードするには、まず報告書を保存してください。',
                variant: 'warning'
            }));
            return;
        }

        this.isLoading = true;

        try {
            const base64PDF = await generatePDF({ recordId: this.recordId });

            // Convert base64 to blob and download
            const byteCharacters = atob(base64PDF);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'application/pdf' });

            // Create download link
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `VisitReport_${this.reportData?.companyName || 'Report'}_${this.formatDateForFilename()}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            this.dispatchEvent(new ShowToastEvent({
                title: '成功',
                message: 'PDFがダウンロードされました',
                variant: 'success'
            }));
        } catch (error) {
            console.error('PDF generation error:', error);
            this.dispatchEvent(new ShowToastEvent({
                title: 'エラー',
                message: error.body?.message || 'PDF生成に失敗しました',
                variant: 'error'
            }));
        } finally {
            this.isLoading = false;
        }
    }

    // Getters
    get hasData() {
        return this.reportData && this.reportData.companyName;
    }

    get isDownloadDisabled() {
        return !this.recordId || this.isLoading;
    }

    get formattedVisitDate() {
        if (!this.reportData?.visitDate) return 'N/A';
        try {
            const date = new Date(this.reportData.visitDate);
            return date.toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (e) {
            return this.reportData.visitDate;
        }
    }

    get formattedCloseDate() {
        if (!this.reportData?.expectedCloseDate) return '';
        try {
            const date = new Date(this.reportData.expectedCloseDate);
            return date.toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (e) {
            return this.reportData.expectedCloseDate;
        }
    }

    get contactDisplay() {
        const name = this.reportData?.contactName || '';
        const title = this.reportData?.contactTitle || '';
        if (name && title) {
            return `${name} (${title})`;
        }
        return name || 'N/A';
    }

    get formattedAmount() {
        if (!this.reportData?.opportunityAmount) return 'N/A';
        return new Intl.NumberFormat('ja-JP', {
            style: 'currency',
            currency: 'JPY'
        }).format(this.reportData.opportunityAmount);
    }

    get hasOpportunityAmount() {
        return this.reportData?.opportunityAmount != null;
    }

    get discussionItems() {
        if (!this.reportData?.discussionSummary) return [];
        if (Array.isArray(this.reportData.discussionSummary)) {
            return this.reportData.discussionSummary;
        }
        return this.reportData.discussionSummary
            .split('\n')
            .map(line => line.replace(/^[•\-\*]\s*/, '').trim())
            .filter(line => line !== '');
    }

    get actionItems() {
        if (!this.reportData?.nextActions) return [];
        if (Array.isArray(this.reportData.nextActions)) {
            return this.reportData.nextActions;
        }
        return this.reportData.nextActions
            .split('\n')
            .map(line => line.replace(/^[•\-\*]\s*/, '').trim())
            .filter(line => line !== '');
    }

    // Utility
    formatDateForFilename() {
        const now = new Date();
        return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    }
}