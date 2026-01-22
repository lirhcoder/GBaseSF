import { LightningElement, api, track } from 'lwc';

export default class MeetingAnalysisPanel extends LightningElement {
    @api analysisData;
    @track editMode = false;
    @track activeSection = 'summary';
    @track editingField = null;
    @track editedData = {};

    // Meeting type options
    meetingTypeOptions = [
        { label: '顧客訪問', value: 'visit' },
        { label: '電話会議', value: 'phone' },
        { label: 'ビデオ会議', value: 'video' },
        { label: 'その他', value: 'other' }
    ];

    // Sentiment options
    sentimentOptions = [
        { label: 'ポジティブ', value: 'positive' },
        { label: '中立', value: 'neutral' },
        { label: 'ネガティブ', value: 'negative' }
    ];

    // Stage options
    stageOptions = [
        { label: '初回接触', value: 'prospecting' },
        { label: '要件確認', value: 'qualification' },
        { label: 'ニーズ分析', value: 'needs_analysis' },
        { label: '提案', value: 'proposal' },
        { label: '交渉', value: 'negotiation' },
        { label: '受注', value: 'closed_won' },
        { label: '失注', value: 'closed_lost' }
    ];

    // Participant role options
    participantRoleOptions = [
        { label: '顧客側', value: 'customer' },
        { label: '自社側', value: 'our_side' }
    ];

    // Section definitions
    get sections() {
        return [
            { name: 'summary', label: '概要', icon: 'utility:summary' },
            { name: 'participants', label: '参加者', icon: 'utility:groups' },
            { name: 'discussion', label: '議論内容', icon: 'utility:comments' },
            { name: 'painpoints', label: '顧客の課題', icon: 'utility:warning' },
            { name: 'opportunity', label: '商談', icon: 'utility:money' },
            { name: 'actions', label: 'ToDo', icon: 'utility:task' },
            { name: 'risks', label: 'リスク', icon: 'utility:error' }
        ];
    }

    // Computed properties for data display
    get data() {
        return this.analysisData || {};
    }

    get hasParticipants() {
        return this.data.participants && this.data.participants.length > 0;
    }

    get customerParticipants() {
        if (!this.data.participants) return [];
        return this.data.participants.filter(p => p.role === 'customer');
    }

    get ourParticipants() {
        if (!this.data.participants) return [];
        return this.data.participants.filter(p => p.role === 'our_side' || p.role !== 'customer');
    }

    get hasDiscussionPoints() {
        return this.data.keyDiscussionPoints && this.data.keyDiscussionPoints.length > 0;
    }

    get hasPainPoints() {
        return this.data.customerPainPoints && this.data.customerPainPoints.length > 0;
    }

    get hasRequirements() {
        return this.data.customerRequirements && this.data.customerRequirements.length > 0;
    }

    get hasQuestions() {
        return this.data.questionsAsked && this.data.questionsAsked.length > 0;
    }

    get hasOpportunity() {
        return this.data.opportunity && (this.data.opportunity.amount || this.data.opportunity.stage);
    }

    get opportunityAmount() {
        if (this.data.opportunity && this.data.opportunity.amount) {
            return new Intl.NumberFormat('ja-JP', {
                style: 'currency',
                currency: this.data.opportunity.currency_x || 'JPY',
                minimumFractionDigits: 0
            }).format(this.data.opportunity.amount);
        }
        return '-';
    }

    get opportunityProbability() {
        return this.data.opportunity?.probability || 0;
    }

    get probabilityClass() {
        const prob = this.opportunityProbability;
        if (prob >= 70) return 'probability-high';
        if (prob >= 40) return 'probability-medium';
        return 'probability-low';
    }

    get hasActions() {
        return this.data.nextActions && this.data.nextActions.length > 0;
    }

    get actionsWithIndex() {
        if (!this.data.nextActions) return [];
        return this.data.nextActions.map((action, index) => ({
            ...action,
            index: index,
            priorityClass: this.getPriorityClass(action.priority),
            priorityLabel: this.getPriorityLabel(action.priority)
        }));
    }

    get hasRisks() {
        return this.data.risks && this.data.risks.length > 0;
    }

    get hasCompetitors() {
        return this.data.competitors && this.data.competitors.length > 0;
    }

    get sentimentIcon() {
        switch (this.data.sentiment) {
            case 'positive': return 'utility:smiley_and_people';
            case 'negative': return 'utility:dislike';
            default: return 'utility:dash';
        }
    }

    get sentimentLabel() {
        switch (this.data.sentiment) {
            case 'positive': return 'ポジティブ';
            case 'negative': return 'ネガティブ';
            default: return '中立';
        }
    }

    get sentimentClass() {
        return `sentiment-badge sentiment-${this.data.sentiment || 'neutral'}`;
    }

    get engagementScoreClass() {
        const score = this.data.engagementScore || 0;
        if (score >= 7) return 'score-high';
        if (score >= 4) return 'score-medium';
        return 'score-low';
    }

    get meetingTypeLabel() {
        const type = this.data.meetingType;
        const option = this.meetingTypeOptions.find(o => o.value === type);
        return option ? option.label : type;
    }

    // Helper methods
    getPriorityClass(priority) {
        switch (priority) {
            case 'high': return 'priority-high';
            case 'low': return 'priority-low';
            default: return 'priority-medium';
        }
    }

    getPriorityLabel(priority) {
        switch (priority) {
            case 'high': return '高';
            case 'low': return '低';
            default: return '中';
        }
    }

    // Initialize edited data when entering edit mode
    connectedCallback() {
        this.initEditedData();
    }

    initEditedData() {
        if (this.analysisData) {
            this.editedData = JSON.parse(JSON.stringify(this.analysisData));
        }
    }

    // Event handlers
    handleSectionClick(event) {
        const section = event.currentTarget.dataset.section;
        this.activeSection = this.activeSection === section ? '' : section;
    }

    isSectionActive(sectionName) {
        return this.activeSection === sectionName;
    }

    // Edit mode toggle
    toggleEditMode() {
        if (!this.editMode) {
            // Entering edit mode - copy data
            this.initEditedData();
        }
        this.editMode = !this.editMode;
    }

    // Field editing handlers
    handleFieldChange(event) {
        const field = event.target.dataset.field;
        const value = event.target.value;

        if (this.editMode) {
            this.editedData = {
                ...this.editedData,
                [field]: value
            };
        }

        this.dispatchEvent(new CustomEvent('update', {
            detail: { field, value }
        }));
    }

    handleBasicFieldChange(event) {
        const field = event.target.dataset.field;
        const value = event.target.value;

        this.editedData = {
            ...this.editedData,
            [field]: value
        };
    }

    handleOpportunityFieldChange(event) {
        const field = event.target.dataset.field;
        let value = event.target.value;

        // Handle number fields
        if (field === 'amount' || field === 'probability') {
            value = value ? parseFloat(value) : null;
        }

        this.editedData = {
            ...this.editedData,
            opportunity: {
                ...this.editedData.opportunity,
                [field]: value
            }
        };
    }

    handleListItemChange(event) {
        const field = event.target.dataset.field;
        const index = parseInt(event.target.dataset.index, 10);
        const value = event.target.value;

        if (this.editedData[field] && Array.isArray(this.editedData[field])) {
            const newList = [...this.editedData[field]];
            newList[index] = value;
            this.editedData = {
                ...this.editedData,
                [field]: newList
            };
        }
    }

    handleAddListItem(event) {
        const field = event.currentTarget.dataset.field;
        if (!this.editedData[field]) {
            this.editedData[field] = [];
        }
        this.editedData = {
            ...this.editedData,
            [field]: [...this.editedData[field], '']
        };
    }

    handleRemoveListItem(event) {
        const field = event.currentTarget.dataset.field;
        const index = parseInt(event.currentTarget.dataset.index, 10);

        if (this.editedData[field] && Array.isArray(this.editedData[field])) {
            const newList = this.editedData[field].filter((_, i) => i !== index);
            this.editedData = {
                ...this.editedData,
                [field]: newList
            };
        }
    }

    handleActionItemChange(event) {
        const index = parseInt(event.target.dataset.index, 10);
        const field = event.target.dataset.actionfield;
        const value = event.target.value;

        if (this.editedData.nextActions && this.editedData.nextActions[index]) {
            const newActions = [...this.editedData.nextActions];
            newActions[index] = {
                ...newActions[index],
                [field]: value
            };
            this.editedData = {
                ...this.editedData,
                nextActions: newActions
            };
        }
    }

    handleAddActionItem() {
        const newAction = {
            action: '',
            owner: '',
            dueDate: '',
            priority: 'medium',
            status: 'pending'
        };

        this.editedData = {
            ...this.editedData,
            nextActions: [...(this.editedData.nextActions || []), newAction]
        };
    }

    handleRemoveActionItem(event) {
        const index = parseInt(event.currentTarget.dataset.index, 10);
        const newActions = this.editedData.nextActions.filter((_, i) => i !== index);
        this.editedData = {
            ...this.editedData,
            nextActions: newActions
        };
    }

    // Save changes
    handleSaveEdits() {
        // Dispatch update event with all edited data
        this.dispatchEvent(new CustomEvent('update', {
            detail: { field: 'all', value: this.editedData }
        }));
        this.editMode = false;
    }

    handleCancelEdits() {
        this.initEditedData();
        this.editMode = false;
    }

    handleSave() {
        // If in edit mode, apply changes first
        if (this.editMode) {
            this.handleSaveEdits();
        }
        this.dispatchEvent(new CustomEvent('save'));
    }

    handleBack() {
        this.dispatchEvent(new CustomEvent('back'));
    }

    // Getters for edit mode data
    get editableData() {
        return this.editMode ? this.editedData : this.data;
    }

    get editableKeyDiscussionPoints() {
        const points = this.editMode ? this.editedData.keyDiscussionPoints : this.data.keyDiscussionPoints;
        if (!points) return [];
        return points.map((point, index) => ({ value: point, index }));
    }

    get editablePainPoints() {
        const points = this.editMode ? this.editedData.customerPainPoints : this.data.customerPainPoints;
        if (!points) return [];
        return points.map((point, index) => ({ value: point, index }));
    }

    get editableRequirements() {
        const reqs = this.editMode ? this.editedData.customerRequirements : this.data.customerRequirements;
        if (!reqs) return [];
        return reqs.map((req, index) => ({ value: req, index }));
    }

    get editableRisks() {
        const risks = this.editMode ? this.editedData.risks : this.data.risks;
        if (!risks) return [];
        return risks.map((risk, index) => ({ value: risk, index }));
    }

    get editableActions() {
        const actions = this.editMode ? this.editedData.nextActions : this.data.nextActions;
        if (!actions) return [];
        return actions.map((action, index) => ({
            ...action,
            index,
            priorityClass: this.getPriorityClass(action.priority),
            priorityLabel: this.getPriorityLabel(action.priority)
        }));
    }

    get editButtonLabel() {
        return this.editMode ? '編集をキャンセル' : '編集';
    }

    get editButtonIcon() {
        return this.editMode ? 'utility:close' : 'utility:edit';
    }

    get editButtonVariant() {
        return this.editMode ? 'destructive' : 'neutral';
    }

    // Getters for opportunity edit fields
    get editedOpportunityAmount() {
        return this.editedData.opportunity?.amount || '';
    }

    get editedOpportunityStage() {
        return this.editedData.opportunity?.stage || '';
    }

    get editedOpportunityProbability() {
        return this.editedData.opportunity?.probability || '';
    }

    get editedOpportunityCloseDate() {
        return this.editedData.opportunity?.expectedCloseDate || '';
    }

    // Editable participants list
    get editableParticipants() {
        const participants = this.editMode ? this.editedData.participants : this.data.participants;
        if (!participants) return [];
        return participants.map((p, index) => ({
            ...p,
            index
        }));
    }

    // Editable competitors list
    get editableCompetitors() {
        const competitors = this.editMode ? this.editedData.competitors : this.data.competitors;
        if (!competitors) return [];
        return competitors.map((c, index) => ({ value: c, index }));
    }

    // Participant handlers
    handleAddParticipant() {
        const newParticipant = {
            name: '',
            title: '',
            role: 'customer'
        };
        this.editedData = {
            ...this.editedData,
            participants: [...(this.editedData.participants || []), newParticipant]
        };
    }

    handleRemoveParticipant(event) {
        const index = parseInt(event.currentTarget.dataset.index, 10);
        const newParticipants = this.editedData.participants.filter((_, i) => i !== index);
        this.editedData = {
            ...this.editedData,
            participants: newParticipants
        };
    }

    handleParticipantChange(event) {
        const index = parseInt(event.target.dataset.index, 10);
        const field = event.target.dataset.pfield;
        const value = event.target.value;

        if (this.editedData.participants && this.editedData.participants[index]) {
            const newParticipants = [...this.editedData.participants];
            newParticipants[index] = {
                ...newParticipants[index],
                [field]: value
            };
            this.editedData = {
                ...this.editedData,
                participants: newParticipants
            };
        }
    }
}