import { LightningElement, wire, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { refreshApex } from '@salesforce/apex';
import { subscribe, unsubscribe, onError } from 'lightning/empApi';
import getMeetings from '@salesforce/apex/GBaseMeetingController.getMeetings';

const COLUMNS = [
    {
        label: 'Meeting Title',
        fieldName: 'Meeting_Title__c',
        type: 'text',
        sortable: true
    },
    {
        label: 'Date',
        fieldName: 'Meeting_Date__c',
        type: 'date',
        typeAttributes: {
            year: 'numeric',
            month: 'short',
            day: '2-digit'
        },
        sortable: true
    },
    {
        label: 'Duration (min)',
        fieldName: 'Duration_Minutes__c',
        type: 'number'
    },
    {
        label: 'Status',
        fieldName: 'Status__c',
        type: 'text',
        cellAttributes: {
            class: { fieldName: 'statusClass' }
        }
    },
    {
        label: 'Account',
        fieldName: 'accountName',
        type: 'text'
    },
    {
        type: 'action',
        typeAttributes: { rowActions: [
            { label: 'View', name: 'view' },
            { label: 'Analyze', name: 'analyze' }
        ]}
    }
];

export default class GbaseMeetingList extends NavigationMixin(LightningElement) {
    @track meetings = [];
    @track isLoading = true;
    columns = COLUMNS;
    wiredMeetingsResult;
    subscription = {};
    channelName = '/event/GBase_Meeting_Event__e';

    @wire(getMeetings)
    wiredMeetings(result) {
        this.wiredMeetingsResult = result;
        if (result.data) {
            this.meetings = result.data.map(meeting => ({
                ...meeting,
                accountName: meeting.Account__r ? meeting.Account__r.Name : '',
                statusClass: this.getStatusClass(meeting.Status__c)
            }));
            this.isLoading = false;
        } else if (result.error) {
            console.error('Error loading meetings:', result.error);
            this.isLoading = false;
        }
    }

    get hasMeetings() {
        return this.meetings && this.meetings.length > 0;
    }

    connectedCallback() {
        this.subscribeToPlatformEvent();
    }

    disconnectedCallback() {
        this.unsubscribeFromPlatformEvent();
    }

    subscribeToPlatformEvent() {
        const messageCallback = (response) => {
            console.log('Platform Event received:', response);
            // Refresh the list when a meeting event is received
            refreshApex(this.wiredMeetingsResult);
        };

        subscribe(this.channelName, -1, messageCallback).then(response => {
            this.subscription = response;
            console.log('Subscribed to platform event:', this.channelName);
        });

        onError(error => {
            console.error('EMP API error:', error);
        });
    }

    unsubscribeFromPlatformEvent() {
        unsubscribe(this.subscription, response => {
            console.log('Unsubscribed from platform event');
        });
    }

    getStatusClass(status) {
        switch(status) {
            case 'Completed':
                return 'slds-text-color_success';
            case 'Failed':
                return 'slds-text-color_error';
            case 'Transcribing':
            case 'Analyzing':
                return 'slds-text-color_weak';
            default:
                return '';
        }
    }

    handleNewMeeting() {
        this[NavigationMixin.Navigate]({
            type: 'standard__objectPage',
            attributes: {
                objectApiName: 'GBase_Meeting__c',
                actionName: 'new'
            }
        });
    }

    handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;

        switch(actionName) {
            case 'view':
                this.navigateToRecord(row.Id);
                break;
            case 'analyze':
                this.dispatchEvent(new CustomEvent('analyze', {
                    detail: { meetingId: row.Id }
                }));
                break;
        }
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
}