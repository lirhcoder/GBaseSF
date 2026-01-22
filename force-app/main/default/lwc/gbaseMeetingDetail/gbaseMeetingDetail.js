import { LightningElement, api, wire, track } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { subscribe, unsubscribe, onError } from 'lightning/empApi';

import triggerMeetingAnalysis from '@salesforce/apex/GBaseApiService.triggerMeetingAnalysis';
import generateProposal from '@salesforce/apex/GBaseApiService.generateProposal';
import generatePpt from '@salesforce/apex/GBaseApiService.generatePpt';
import getDocuments from '@salesforce/apex/GBaseMeetingController.getDocuments';

import MEETING_TITLE from '@salesforce/schema/GBase_Meeting__c.Meeting_Title__c';
import MEETING_DATE from '@salesforce/schema/GBase_Meeting__c.Meeting_Date__c';
import DURATION from '@salesforce/schema/GBase_Meeting__c.Duration_Minutes__c';
import STATUS from '@salesforce/schema/GBase_Meeting__c.Status__c';
import AUDIO_URL from '@salesforce/schema/GBase_Meeting__c.Audio_URL__c';
import TRANSCRIPT from '@salesforce/schema/GBase_Meeting__c.Transcript__c';
import SUMMARY from '@salesforce/schema/GBase_Meeting__c.Summary__c';
import ANALYSIS from '@salesforce/schema/GBase_Meeting__c.Analysis_Result__c';

const FIELDS = [MEETING_TITLE, MEETING_DATE, DURATION, STATUS, AUDIO_URL, TRANSCRIPT, SUMMARY, ANALYSIS];

const DOC_COLUMNS = [
    { label: 'Document Type', fieldName: 'Document_Type__c', type: 'text' },
    { label: 'File Name', fieldName: 'File_Name__c', type: 'text' },
    { label: 'Status', fieldName: 'Generation_Status__c', type: 'text' },
    {
        label: 'Download',
        fieldName: 'Document_URL__c',
        type: 'url',
        typeAttributes: { label: 'Download', target: '_blank' }
    }
];

export default class GbaseMeetingDetail extends LightningElement {
    @api recordId;
    @track meeting = {};
    @track documents = [];
    @track isProcessing = false;
    @track statusMessage = '';

    wiredMeetingResult;
    wiredDocumentsResult;
    subscription = {};
    channelName = '/event/GBase_Meeting_Event__e';
    documentColumns = DOC_COLUMNS;
    activeSections = ['info', 'summary'];

    @wire(getRecord, { recordId: '$recordId', fields: FIELDS })
    wiredMeeting(result) {
        this.wiredMeetingResult = result;
        if (result.data) {
            this.meeting = {
                Meeting_Title__c: getFieldValue(result.data, MEETING_TITLE),
                Meeting_Date__c: getFieldValue(result.data, MEETING_DATE),
                Duration_Minutes__c: getFieldValue(result.data, DURATION),
                Status__c: getFieldValue(result.data, STATUS),
                Audio_URL__c: getFieldValue(result.data, AUDIO_URL),
                Transcript__c: getFieldValue(result.data, TRANSCRIPT),
                Summary__c: getFieldValue(result.data, SUMMARY),
                Analysis_Result__c: getFieldValue(result.data, ANALYSIS)
            };
            this.updateStatusFromMeeting();
        } else if (result.error) {
            console.error('Error loading meeting:', result.error);
        }
    }

    @wire(getDocuments, { meetingId: '$recordId' })
    wiredDocuments(result) {
        this.wiredDocumentsResult = result;
        if (result.data) {
            this.documents = result.data;
        }
    }

    connectedCallback() {
        this.subscribeToPlatformEvent();
    }

    disconnectedCallback() {
        this.unsubscribeFromPlatformEvent();
    }

    subscribeToPlatformEvent() {
        const messageCallback = (response) => {
            const payload = response.data.payload;
            if (payload.Meeting_Id__c === this.recordId) {
                this.handlePlatformEvent(payload);
            }
        };

        subscribe(this.channelName, -1, messageCallback).then(response => {
            this.subscription = response;
        });

        onError(error => {
            console.error('EMP API error:', error);
        });
    }

    unsubscribeFromPlatformEvent() {
        unsubscribe(this.subscription, () => {});
    }

    handlePlatformEvent(payload) {
        this.statusMessage = payload.Message__c || payload.Status__c;

        if (payload.Status__c === 'Completed' || payload.Status__c === 'Failed') {
            this.isProcessing = false;
            refreshApex(this.wiredMeetingResult);
            refreshApex(this.wiredDocumentsResult);

            if (payload.Status__c === 'Completed') {
                this.showToast('Success', 'Processing completed!', 'success');
            } else {
                this.showToast('Error', payload.Message__c || 'Processing failed', 'error');
            }
        }
    }

    updateStatusFromMeeting() {
        const status = this.meeting.Status__c;
        if (status === 'Transcribing' || status === 'Analyzing') {
            this.isProcessing = true;
            this.statusMessage = `${status}...`;
        } else {
            this.isProcessing = false;
        }
    }

    // Getters
    get formattedDate() {
        if (this.meeting.Meeting_Date__c) {
            return new Date(this.meeting.Meeting_Date__c).toLocaleDateString();
        }
        return '';
    }

    get isAnalyzing() {
        return this.isProcessing ||
               this.meeting.Status__c === 'Transcribing' ||
               this.meeting.Status__c === 'Analyzing';
    }

    get canGenerateDocuments() {
        return this.meeting.Status__c === 'Completed' && !this.isProcessing;
    }

    get disableDocumentButtons() {
        return !this.canGenerateDocuments;
    }

    get hasSummary() {
        return !!this.meeting.Summary__c;
    }

    get hasTranscript() {
        return !!this.meeting.Transcript__c;
    }

    get hasAnalysis() {
        return !!this.meeting.Analysis_Result__c;
    }

    get hasDocuments() {
        return this.documents && this.documents.length > 0;
    }

    get showStatusBanner() {
        return this.isProcessing || this.statusMessage;
    }

    get statusBannerClass() {
        let baseClass = 'slds-notify slds-notify_alert slds-theme_alert-texture slds-m-bottom_medium';
        if (this.meeting.Status__c === 'Failed') {
            return baseClass + ' slds-theme_error';
        } else if (this.meeting.Status__c === 'Completed') {
            return baseClass + ' slds-theme_success';
        }
        return baseClass + ' slds-theme_info';
    }

    get statusIcon() {
        switch(this.meeting.Status__c) {
            case 'Completed': return 'utility:success';
            case 'Failed': return 'utility:error';
            default: return 'utility:info';
        }
    }

    get statusBadgeClass() {
        switch(this.meeting.Status__c) {
            case 'Completed': return 'slds-theme_success';
            case 'Failed': return 'slds-theme_error';
            case 'Transcribing':
            case 'Analyzing': return 'slds-theme_warning';
            default: return 'slds-badge_inverse';
        }
    }

    // Event Handlers
    async handleStartAnalysis() {
        if (!this.meeting.Audio_URL__c) {
            this.showToast('Error', 'Please upload an audio file first', 'error');
            return;
        }

        this.isProcessing = true;
        this.statusMessage = 'Starting analysis...';

        try {
            await triggerMeetingAnalysis({
                meetingId: this.recordId,
                audioUrl: this.meeting.Audio_URL__c
            });
            this.showToast('Success', 'Analysis started!', 'success');
            refreshApex(this.wiredMeetingResult);
        } catch (error) {
            console.error('Error starting analysis:', error);
            this.showToast('Error', error.body?.message || 'Failed to start analysis', 'error');
            this.isProcessing = false;
        }
    }

    async handleGenerateProposal() {
        this.isProcessing = true;
        this.statusMessage = 'Generating proposal...';

        try {
            await generateProposal({ meetingId: this.recordId });
            this.showToast('Success', 'Proposal generation started!', 'success');
        } catch (error) {
            console.error('Error generating proposal:', error);
            this.showToast('Error', error.body?.message || 'Failed to generate proposal', 'error');
            this.isProcessing = false;
        }
    }

    async handleGeneratePpt() {
        this.isProcessing = true;
        this.statusMessage = 'Generating PPT...';

        try {
            await generatePpt({ meetingId: this.recordId });
            this.showToast('Success', 'PPT generation started!', 'success');
        } catch (error) {
            console.error('Error generating PPT:', error);
            this.showToast('Error', error.body?.message || 'Failed to generate PPT', 'error');
            this.isProcessing = false;
        }
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
}