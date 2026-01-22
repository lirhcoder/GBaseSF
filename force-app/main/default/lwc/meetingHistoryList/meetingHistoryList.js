import { LightningElement, wire, track } from 'lwc';
import { refreshApex } from '@salesforce/apex';
import { NavigationMixin } from 'lightning/navigation';
import getRecentReports from '@salesforce/apex/VisitReportController.getRecentReports';

export default class MeetingHistoryList extends NavigationMixin(LightningElement) {
    @track reports = [];
    @track isLoading = true;
    @track error = null;
    @track selectedReportId = null;

    // Pagination
    @track pageSize = 10;
    @track totalRecords = 0;

    // Wire adapter result for refresh
    wiredReportsResult;

    @wire(getRecentReports, { limitCount: '$pageSize' })
    wiredReports(result) {
        this.wiredReportsResult = result;
        this.isLoading = true;

        if (result.data) {
            this.reports = result.data.map(report => this.transformReport(report));
            this.totalRecords = result.data.length;
            this.error = null;
        } else if (result.error) {
            this.error = result.error.body?.message || 'レポートの読み込み中にエラーが発生しました';
            this.reports = [];
        }

        this.isLoading = false;
    }

    transformReport(report) {
        return {
            id: report.Id,
            name: report.Name,
            companyName: report.Company_Name__c || '不明',
            contactName: report.Contact_Name__c || '-',
            visitDate: report.Visit_Date__c,
            visitPurpose: report.Visit_Purpose__c || '-',
            opportunityAmount: report.Opportunity_Amount__c,
            formattedAmount: this.formatCurrency(report.Opportunity_Amount__c),
            createdDate: this.formatDate(report.CreatedDate),
            meetingType: report.Meeting_Type__c,
            sentiment: report.Sentiment__c,
            sentimentClass: this.getSentimentClass(report.Sentiment__c),
            sentimentIcon: this.getSentimentIcon(report.Sentiment__c)
        };
    }

    formatCurrency(amount) {
        if (!amount) return '-';
        return new Intl.NumberFormat('ja-JP', {
            style: 'currency',
            currency: 'JPY',
            minimumFractionDigits: 0
        }).format(amount);
    }

    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }

    getSentimentClass(sentiment) {
        switch (sentiment) {
            case 'positive': return 'sentiment-positive';
            case 'negative': return 'sentiment-negative';
            default: return 'sentiment-neutral';
        }
    }

    getSentimentIcon(sentiment) {
        switch (sentiment) {
            case 'positive': return 'utility:smiley_and_people';
            case 'negative': return 'utility:dislike';
            default: return 'utility:dash';
        }
    }

    get hasReports() {
        return this.reports && this.reports.length > 0;
    }

    get emptyMessage() {
        return '会議記録がありません';
    }

    // Event handlers
    handleRowClick(event) {
        const reportId = event.currentTarget.dataset.id;
        this.selectedReportId = reportId;

        // Navigate to record detail
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: reportId,
                objectApiName: 'Visit_Report__c',
                actionName: 'view'
            }
        });
    }

    handleRefresh() {
        this.isLoading = true;
        refreshApex(this.wiredReportsResult)
            .finally(() => {
                this.isLoading = false;
            });
    }

    handleLoadMore() {
        this.pageSize += 10;
    }

    handleViewAll() {
        this[NavigationMixin.Navigate]({
            type: 'standard__objectPage',
            attributes: {
                objectApiName: 'Visit_Report__c',
                actionName: 'list'
            },
            state: {
                filterName: 'Recent'
            }
        });
    }

    // Dispatch event to parent to load a specific report
    handleLoadReport(event) {
        event.stopPropagation();
        const reportId = event.currentTarget.dataset.id;

        this.dispatchEvent(new CustomEvent('loadreport', {
            detail: { reportId }
        }));
    }
}