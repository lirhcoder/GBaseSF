import { LightningElement, track } from 'lwc';
import processNaturalLanguage from '@salesforce/apex/NLAssistantController.processNaturalLanguage';

export default class NlAssistant extends LightningElement {
    @track messages = [];
    @track userInput = '';
    @track isLoading = false;

    messageIdCounter = 0;

    // クイック例
    examples = [
        'すべての顧客を表示',
        '今月の商談一覧',
        '東京の取引先責任者を探す',
        '金額10万円以上の商談'
    ];

    // 入力変更処理
    handleInputChange(event) {
        this.userInput = event.target.value;
    }

    // Enterキー処理
    handleKeyUp(event) {
        if (event.keyCode === 13 && this.userInput.trim()) {
            this.handleSend();
        }
    }

    // 例をクリック
    handleExampleClick(event) {
        this.userInput = event.target.dataset.value;
        this.handleSend();
    }

    // メッセージ送信
    async handleSend() {
        if (!this.userInput.trim() || this.isLoading) {
            return;
        }

        const userQuery = this.userInput.trim();
        this.userInput = '';

        // ユーザーメッセージを追加
        this.addMessage(userQuery, true);

        // バックエンド処理を呼び出す
        this.isLoading = true;

        try {
            const result = await processNaturalLanguage({ userInput: userQuery });

            if (result.success) {
                this.addMessage(
                    'クエリ完了',
                    false,
                    result.generatedQuery,
                    result.records,
                    result.fieldNames,
                    result.recordCount
                );
            } else {
                this.addMessage(result.errorMessage || '処理に失敗しました。再試行してください', false);
            }
        } catch (error) {
            console.error('Error:', error);
            this.addMessage('システムエラー: ' + (error.body?.message || error.message || '不明なエラー'), false);
        } finally {
            this.isLoading = false;
            this.scrollToBottom();
        }
    }

    // メッセージをリストに追加
    addMessage(text, isUser, query = null, records = null, fieldNames = null, recordCount = 0) {
        // recordsをtableRows形式に変換（LWCテンプレートは計算プロパティアクセスをサポートしていない）
        let tableRows = [];
        if (records && records.length > 0 && fieldNames) {
            tableRows = records.map((record, rowIndex) => ({
                id: `row-${rowIndex}`,
                cells: fieldNames.map((field, colIndex) => ({
                    key: `cell-${rowIndex}-${colIndex}`,
                    value: record[field] !== undefined ? record[field] : ''
                }))
            }));
        }

        const message = {
            id: ++this.messageIdCounter,
            text: text,
            isUser: isUser,
            query: query,
            fieldNames: fieldNames,
            recordCount: recordCount,
            hasRecords: records && records.length > 0,
            tableRows: tableRows,
            containerClass: `message-container ${isUser ? 'user-message' : 'ai-message'}`,
            bubbleClass: `message-bubble ${isUser ? 'user-bubble' : 'ai-bubble'}`
        };

        this.messages = [...this.messages, message];
        this.scrollToBottom();
    }

    // 一番下までスクロール
    scrollToBottom() {
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        setTimeout(() => {
            const chatContainer = this.template.querySelector('.chat-messages');
            if (chatContainer) {
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
        }, 100);
    }

    // 初期ウェルカムメッセージ
    connectedCallback() {
        this.addMessage(
            'こんにちは！Salesforce AIアシスタントです。自然言語でクエリしたいデータを入力してください。例：「今月の金額が10万円以上の商談を表示」',
            false
        );
    }
}