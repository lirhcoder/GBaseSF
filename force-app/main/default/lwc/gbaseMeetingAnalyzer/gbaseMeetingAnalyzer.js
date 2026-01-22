import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';
import { updateRecord } from 'lightning/uiRecordApi';

import triggerMeetingAnalysis from '@salesforce/apex/GBaseApiService.triggerMeetingAnalysis';

import ID_FIELD from '@salesforce/schema/GBase_Meeting__c.Id';
import AUDIO_URL_FIELD from '@salesforce/schema/GBase_Meeting__c.Audio_URL__c';

export default class GbaseMeetingAnalyzer extends NavigationMixin(LightningElement) {
    @api recordId;
    @track audioUrl = '';
    @track isSubmitting = false;
    @track processingMessage = 'Saving...';

    savedRecordId;

    handleUrlChange(event) {
        this.audioUrl = event.target.value;
    }

    handleUploadFinished(event) {
        const uploadedFiles = event.detail.files;
        if (uploadedFiles && uploadedFiles.length > 0) {
            // Get the Content Document ID and construct URL
            const documentId = uploadedFiles[0].documentId;
            this.audioUrl = `/sfc/servlet.shepherd/document/download/${documentId}`;
            this.showToast('Success', 'File uploaded successfully!', 'success');
        }
    }

    async handleSuccess(event) {
        this.savedRecordId = event.detail.id;
        this.processingMessage = 'Updating audio URL...';

        try {
            // Update the audio URL on the record
            if (this.audioUrl) {
                const fields = {};
                fields[ID_FIELD.fieldApiName] = this.savedRecordId;
                fields[AUDIO_URL_FIELD.fieldApiName] = this.audioUrl;

                await updateRecord({ fields });
            }

            // Trigger analysis if audio URL is provided
            if (this.audioUrl) {
                this.processingMessage = 'Starting analysis...';
                await triggerMeetingAnalysis({
                    meetingId: this.savedRecordId,
                    audioUrl: this.audioUrl
                });
                this.showToast('Success', 'Meeting saved and analysis started!', 'success');
            } else {
                this.showToast('Success', 'Meeting saved successfully!', 'success');
            }

            this.isSubmitting = false;

            // Navigate to the record page
            this.navigateToRecord(this.savedRecordId);

        } catch (error) {
            console.error('Error:', error);
            this.showToast('Error', error.body?.message || 'An error occurred', 'error');
            this.isSubmitting = false;

            // Still navigate to record even if analysis failed
            this.navigateToRecord(this.savedRecordId);
        }
    }

    handleError(event) {
        this.isSubmitting = false;
        console.error('Form error:', event.detail);
    }

    handleCancel() {
        // Navigate back to list
        this[NavigationMixin.Navigate]({
            type: 'standard__objectPage',
            attributes: {
                objectApiName: 'GBase_Meeting__c',
                actionName: 'list'
            }
        });
    }

    navigateToRecord(recordId) {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: recordId,
                objectApiName: 'GBase_Meeting__c',
                actionName: 'view'
            }
        });
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
}