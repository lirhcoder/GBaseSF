import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import askQuestion from '@salesforce/apex/GBaseAPIController.askQuestion';
import searchKnowledge from '@salesforce/apex/GBaseAPIController.searchKnowledge';

// Labels for different languages
const LABELS = {
    zh: {
        inputLabel: '请输入您的问题',
        inputPlaceholder: '例如：产品有哪些定价方案？',
        askButton: '提问',
        clearButton: '清除',
        loading: '正在查询知识库...',
        answerLabel: '回答',
        sourcesLabel: '来源',
        suggestedLabel: '相关问题',
        relatedLabel: '相关知识',
        copySuccess: '已复制到剪贴板',
        errorTitle: '查询错误'
    },
    en: {
        inputLabel: 'Enter your question',
        inputPlaceholder: 'e.g., What are the pricing plans?',
        askButton: 'Ask',
        clearButton: 'Clear',
        loading: 'Searching knowledge base...',
        answerLabel: 'Answer',
        sourcesLabel: 'Sources',
        suggestedLabel: 'Suggested Questions',
        relatedLabel: 'Related Knowledge',
        copySuccess: 'Copied to clipboard',
        errorTitle: 'Query Error'
    },
    ja: {
        inputLabel: 'ご質問を入力してください',
        inputPlaceholder: '例：料金プランについて教えてください',
        askButton: '質問する',
        clearButton: 'クリア',
        loading: 'ナレッジベースを検索中...',
        answerLabel: '回答',
        sourcesLabel: '出典',
        suggestedLabel: '関連する質問',
        relatedLabel: '関連知識',
        copySuccess: 'クリップボードにコピーしました',
        errorTitle: 'クエリエラー'
    }
};

export default class GbaseKnowledgePanel extends LightningElement {
    @api recordId; // Case ID, Account ID, etc. when embedded in record page
    @api objectApiName; // Object type when embedded

    @track userQuestion = '';
    @track answer = '';
    @track answerContentType = 'markdown'; // 'markdown', 'structured', 'plain'
    @track sources = [];
    @track suggestedQuestions = [];
    @track relatedKnowledge = [];
    @track isLoading = false;
    @track errorMessage = '';
    @track selectedLanguage = 'zh';

    // Session ID for tracking conversations
    sessionId = '';

    // Language options for selector
    get languageOptions() {
        return [
            { label: '中文', value: 'zh' },
            { label: 'English', value: 'en' },
            { label: '日本語', value: 'ja' }
        ];
    }

    // Current labels based on selected language
    get labels() {
        return LABELS[this.selectedLanguage] || LABELS.zh;
    }

    // Getters for template labels
    get inputLabel() { return this.labels.inputLabel; }
    get inputPlaceholder() { return this.labels.inputPlaceholder; }
    get askButtonLabel() { return this.labels.askButton; }
    get clearButtonLabel() { return this.labels.clearButton; }
    get loadingText() { return this.labels.loading; }
    get answerLabel() { return this.labels.answerLabel; }
    get sourcesLabel() { return this.labels.sourcesLabel; }
    get suggestedLabel() { return this.labels.suggestedLabel; }
    get relatedLabel() { return this.labels.relatedLabel; }

    // Computed properties
    get hasAnswer() {
        return this.answer && this.answer.length > 0;
    }

    get hasSources() {
        return this.sources && this.sources.length > 0;
    }

    get hasSuggestedQuestions() {
        return this.suggestedQuestions && this.suggestedQuestions.length > 0;
    }

    get hasRelatedKnowledge() {
        return this.relatedKnowledge && this.relatedKnowledge.length > 0;
    }

    get hasError() {
        return this.errorMessage && this.errorMessage.length > 0;
    }

    get isAskDisabled() {
        return !this.userQuestion || this.userQuestion.trim().length === 0 || this.isLoading;
    }

    get isClearDisabled() {
        return !this.userQuestion && !this.answer;
    }

    // Lifecycle hooks
    connectedCallback() {
        this.sessionId = this.generateSessionId();
    }

    // Generate unique session ID
    generateSessionId() {
        const prefix = this.recordId ? `sf-${this.objectApiName}-${this.recordId}` : 'sf-standalone';
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        return `${prefix}-${timestamp}-${random}`;
    }

    // Event handlers
    handleQuestionChange(event) {
        this.userQuestion = event.target.value;
        this.errorMessage = '';
    }

    handleKeyUp(event) {
        if (event.key === 'Enter' && !this.isAskDisabled) {
            this.handleAsk();
        }
    }

    handleLanguageChange(event) {
        this.selectedLanguage = event.detail.value;
    }

    handleClear() {
        this.userQuestion = '';
        this.answer = '';
        this.sources = [];
        this.suggestedQuestions = [];
        this.relatedKnowledge = [];
        this.errorMessage = '';
    }

    handleSuggestedClick(event) {
        const question = event.currentTarget.dataset.question;
        this.userQuestion = question;
        this.handleAsk();
    }

    handleRelatedClick(event) {
        const title = event.currentTarget.dataset.title;
        this.userQuestion = title;
        this.handleAsk();
    }

    async handleCopyAnswer() {
        try {
            await navigator.clipboard.writeText(this.answer);
            this.showToast('Success', this.labels.copySuccess, 'success');
        } catch (error) {
            console.error('Copy failed:', error);
        }
    }

    // Main ask function
    async handleAsk() {
        if (!this.userQuestion || this.userQuestion.trim().length === 0) {
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';
        this.answer = '';
        this.sources = [];

        try {
            const result = await askQuestion({
                question: this.userQuestion,
                language: this.selectedLanguage,
                sessionId: this.sessionId,
                recordId: this.recordId
            });

            const parsed = JSON.parse(result);

            this.answer = parsed.answer || '';
            this.answerContentType = parsed.contentType || 'markdown';

            // Process sources with relevance percentage
            this.sources = (parsed.sources || []).map(source => ({
                ...source,
                relevancePercent: Math.round((source.relevance || 0) * 100) + '%'
            }));

            this.suggestedQuestions = parsed.suggestedQuestions || [];
            this.relatedKnowledge = parsed.relatedKnowledge || [];

        } catch (error) {
            console.error('Error calling GBase API:', error);
            this.errorMessage = error.body?.message || error.message || 'Unknown error occurred';
            this.showToast(this.labels.errorTitle, this.errorMessage, 'error');
        } finally {
            this.isLoading = false;
        }
    }

    // Search knowledge base
    async performSearch(query) {
        try {
            const result = await searchKnowledge({
                query: query,
                language: this.selectedLanguage
            });
            return JSON.parse(result);
        } catch (error) {
            console.error('Search error:', error);
            return { results: [] };
        }
    }

    // Toast notification helper
    showToast(title, message, variant) {
        const evt = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        });
        this.dispatchEvent(evt);
    }
}