import { LightningElement, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import analyzeMeeting from '@salesforce/apex/VisitReportController.analyzeMeeting';
import saveMeetingAnalysis from '@salesforce/apex/VisitReportController.saveMeetingAnalysis';

export default class MeetingRecorder extends LightningElement {
    // State management
    @track currentStep = 'input'; // 'input', 'analyzing', 'result', 'saved'
    @track activeTab = 'voice'; // 'voice', 'text', 'upload'
    @track isLoading = false;
    @track loadingMessage = '';

    // Input data - separate for each tab
    @track voiceTranscript = '';      // For voice recording tab
    @track textTranscript = '';       // For text input tab
    @track uploadTranscript = '';     // For upload tab
    @track selectedLanguage = 'ja';
    @track textEditMode = true; // Start in edit mode for empty state

    // Analysis result
    @track analysisResult = null;

    // Save result
    @track savedRecordId = null;
    @track savedTaskIds = [];

    // Language options
    languageOptions = [
        { label: '日本語', value: 'ja' },
        { label: '中文', value: 'zh' },
        { label: 'English', value: 'en' }
    ];

    // Tab definitions
    get tabs() {
        return [
            {
                name: 'voice',
                label: 'リアルタイム録音',
                icon: 'utility:voice',
                active: this.activeTab === 'voice',
                tabClass: this.activeTab === 'voice' ? 'slds-tabs_default__item slds-is-active' : 'slds-tabs_default__item'
            },
            {
                name: 'text',
                label: 'テキスト入力',
                icon: 'utility:edit',
                active: this.activeTab === 'text',
                tabClass: this.activeTab === 'text' ? 'slds-tabs_default__item slds-is-active' : 'slds-tabs_default__item'
            },
            {
                name: 'upload',
                label: '音声アップロード',
                icon: 'utility:upload',
                active: this.activeTab === 'upload',
                tabClass: this.activeTab === 'upload' ? 'slds-tabs_default__item slds-is-active' : 'slds-tabs_default__item'
            }
        ];
    }

    // Computed properties
    get isInputStep() {
        return this.currentStep === 'input';
    }

    get isAnalyzingStep() {
        return this.currentStep === 'analyzing';
    }

    get isResultStep() {
        return this.currentStep === 'result';
    }

    get isSavedStep() {
        return this.currentStep === 'saved';
    }

    get isVoiceTab() {
        return this.activeTab === 'voice';
    }

    get isTextTab() {
        return this.activeTab === 'text';
    }

    get isUploadTab() {
        return this.activeTab === 'upload';
    }

    // Get current transcript based on active tab
    get currentTranscript() {
        switch (this.activeTab) {
            case 'voice': return this.voiceTranscript;
            case 'text': return this.textTranscript;
            case 'upload': return this.uploadTranscript;
            default: return '';
        }
    }

    get canAnalyze() {
        return this.currentTranscript && this.currentTranscript.trim().length > 10;
    }

    get isAnalyzeDisabled() {
        return !this.canAnalyze;
    }

    get analyzeButtonLabel() {
        return this.isLoading ? '分析中...' : 'AI 分析開始';
    }

    get hasSavedTasks() {
        return this.savedTaskIds && this.savedTaskIds.length > 0;
    }

    get savedTaskCount() {
        return this.savedTaskIds ? this.savedTaskIds.length : 0;
    }

    get transcriptLength() {
        return this.textTranscript ? this.textTranscript.length : 0;
    }

    get hasTranscriptText() {
        return this.textTranscript && this.textTranscript.trim().length > 0;
    }

    get isTextEditMode() {
        // Always show edit mode if there's no text
        return this.textEditMode || !this.hasTranscriptText;
    }

    get textEditButtonLabel() {
        return this.textEditMode ? '閲覧モード' : '編集';
    }

    get textEditButtonIcon() {
        return this.textEditMode ? 'utility:preview' : 'utility:edit';
    }

    get textEditButtonVariant() {
        return this.textEditMode ? 'brand' : 'neutral';
    }

    // Format transcript text for display
    get formattedTranscriptLines() {
        if (!this.textTranscript) return [];

        const lines = this.textTranscript.split('\n');
        return lines.map((line, index) => {
            const trimmed = line.trim();
            let className = 'transcript-line';

            // Detect headers/sections
            if (trimmed.startsWith('【') && trimmed.includes('】')) {
                className = 'transcript-line transcript-header';
            }
            // Detect numbered sections
            else if (/^[0-9]+[.、．]/.test(trimmed)) {
                className = 'transcript-line transcript-section';
            }
            // Detect speaker lines
            else if (/^[・\-•]/.test(trimmed)) {
                className = 'transcript-line transcript-bullet';
            }
            // Detect dialog/quotes
            else if (trimmed.startsWith('「') || trimmed.startsWith('『')) {
                className = 'transcript-line transcript-dialog';
            }
            // Empty line becomes a spacer
            else if (trimmed === '') {
                className = 'transcript-line transcript-spacer';
            }

            return {
                id: `line-${index}`,
                text: line || '\u00A0', // Non-breaking space for empty lines
                className: className
            };
        });
    }

    get progressSteps() {
        const steps = [
            { label: '入力', value: 'input', class: 'step' },
            { label: '分析', value: 'analyzing', class: 'step' },
            { label: '結果', value: 'result', class: 'step' },
            { label: '保存', value: 'saved', class: 'step' }
        ];

        const stepOrder = ['input', 'analyzing', 'result', 'saved'];
        const currentIndex = stepOrder.indexOf(this.currentStep);

        return steps.map((step, index) => ({
            ...step,
            class: index < currentIndex ? 'step completed' :
                   index === currentIndex ? 'step active' : 'step'
        }));
    }

    // Demo data for Japanese business meeting
    demoMeetingText = `【会議記録】
日時：2025年1月22日（水）14:00〜15:30
場所：株式会社山田製作所 本社会議室
出席者：
・山田製作所：鈴木部長（製造部）、田中課長（情報システム部）、佐藤主任（購買部）
・当社：営業部 高橋、技術部 渡辺

【会議の目的】
製造ライン管理システムの導入提案および要件ヒアリング

【議事内容】

1. 現状の課題について（鈴木部長より）
「現在、製造ラインの稼働状況は紙ベースで管理しており、リアルタイムでの把握が困難です。月末の集計作業に毎回3日程度かかっており、この工数を削減したいと考えています。また、品質管理においても、不良品発生時のトレーサビリティに課題があります。」

2. システム要件について（田中課長より）
「既存の基幹システム（SAP）との連携が必須条件となります。また、現場作業員がタブレットで簡単に入力できるUIが重要です。セキュリティ面では、ISO27001に準拠した運用が求められます。」

3. 予算・スケジュールについて（佐藤主任より）
「今期の設備投資予算として3,000万円を確保しています。来年4月の新製造ライン稼働に合わせて、3月末までに本稼働させたいと考えています。」

4. 当社からの提案（高橋より）
弊社のクラウド型製造管理システム「SmartFactory」をご提案。主な特徴：
・リアルタイムダッシュボードによる稼働状況の可視化
・SAP連携モジュール標準搭載
・タブレット対応の直感的なUI
・ISO27001認証取得済みのクラウド基盤

概算費用：初期導入費 800万円、月額利用料 50万円

5. 技術的な質問への回答（渡辺より）
・データ移行期間：約2週間
・カスタマイズ対応：要件に応じて可能
・サポート体制：24時間365日対応

【顧客の反応・温度感】
鈴木部長は導入に前向きな姿勢。特にリアルタイム可視化機能に強い関心を示された。田中課長はSAP連携の詳細について追加資料を希望。佐藤主任は競合他社（ABCシステムズ）の提案も検討中とのこと。

【懸念事項・リスク】
・競合ABCシステムズが価格面で攻勢をかけている可能性
・3月末納期はタイトなスケジュール
・現場への教育・定着に時間がかかる可能性

【次回アクション】
1. SAP連携の技術仕様書を来週月曜日までに送付（担当：渡辺）
2. 類似業種の導入事例資料を準備（担当：高橋）
3. 正式見積書の作成・提出（担当：高橋、期限：1月29日）
4. 次回訪問：2月5日（水）10:00〜 デモンストレーション実施予定

【所感】
受注確度は60%程度と見込む。競合対策として、価格よりも導入実績とサポート体制の優位性をアピールする方針。鈴木部長がキーマンであり、次回デモで確実に好印象を与えることが重要。`;

    // Event Handlers
    handleTabClick(event) {
        const tabName = event.currentTarget.dataset.tab;
        this.activeTab = tabName;
    }

    handleLoadDemoData() {
        this.textTranscript = this.demoMeetingText;
        this.textEditMode = false; // Switch to view mode to show formatted text
        this.showToast('デモデータ入力完了', 'サンプルの会議記録が入力されました', 'success');
    }

    handleToggleTextEditMode() {
        this.textEditMode = !this.textEditMode;
    }

    handleTextareaChange(event) {
        this.textTranscript = event.target.value;
    }

    handleLanguageChange(event) {
        this.selectedLanguage = event.detail.value;
    }

    handleTranscriptChange(event) {
        if (event.detail && event.detail.text !== undefined) {
            // From voiceInput component
            this.voiceTranscript = event.detail.text;
        }
    }

    handleVoiceAnalyze(event) {
        // Triggered from voiceInput component's analyze button
        if (event.detail && event.detail.text) {
            this.voiceTranscript = event.detail.text;
            this.startAnalysis();
        }
    }

    async startAnalysis() {
        if (!this.canAnalyze) {
            this.showToast('注意', '10文字以上の会議内容を入力してください', 'warning');
            return;
        }

        this.currentStep = 'analyzing';
        this.isLoading = true;
        this.loadingMessage = 'AIが会議内容を分析中...';

        try {
            const result = await analyzeMeeting({
                transcriptText: this.currentTranscript,
                language: this.selectedLanguage
            });

            this.analysisResult = this.transformResult(result);
            this.currentStep = 'result';

            this.showToast('分析完了', 'AIが会議内容の分析を完了しました', 'success');

        } catch (error) {
            console.error('Analysis error:', error);
            this.currentStep = 'input';
            this.showToast('分析失敗', error.body?.message || '後でもう一度お試しください', 'error');
        } finally {
            this.isLoading = false;
        }
    }

    transformResult(result) {
        // Transform the Apex result to a format suitable for the UI
        return {
            // Basic info
            meetingDate: result.meetingDate || this.getTodayDate(),
            meetingType: result.meetingType || 'visit',
            durationMinutes: result.durationMinutes || 0,
            meetingLocation: result.meetingLocation || '',

            // Company
            companyName: result.companyName || '',
            companyIndustry: result.companyIndustry || '',

            // Participants
            participants: result.participants || [],

            // Content
            meetingPurpose: result.meetingPurpose || '',
            keyDiscussionPoints: result.keyDiscussionPoints || [],
            customerPainPoints: result.customerPainPoints || [],
            customerRequirements: result.customerRequirements || [],
            questionsAsked: result.questionsAsked || [],

            // Opportunity
            opportunity: result.opportunity || {
                amount: null,
                stage: '',
                probability: 0,
                expectedCloseDate: ''
            },

            // Actions
            nextActions: result.nextActions || [],
            followUpDate: result.followUpDate || '',

            // Risks
            risks: result.risks || [],
            competitors: result.competitors || [],

            // Sentiment
            sentiment: result.sentiment || 'neutral',
            engagementScore: result.engagementScore || 5,

            // Summary
            summary: result.summary || '',
            tags: result.tags || [],

            // Raw data
            rawTranscript: this.currentTranscript
        };
    }

    handleResultUpdate(event) {
        // Update analysis result from child component edits
        const { field, value } = event.detail;
        if (field === 'all') {
            // Replace entire analysis result with edited data
            this.analysisResult = { ...value };
        } else if (field && this.analysisResult) {
            this.analysisResult = {
                ...this.analysisResult,
                [field]: value
            };
        }
    }

    async handleSave() {
        if (!this.analysisResult) {
            return;
        }

        this.isLoading = true;
        this.loadingMessage = 'CRMに保存中...';

        try {
            const saveData = JSON.stringify(this.analysisResult);
            const result = await saveMeetingAnalysis({ analysisData: saveData });

            this.currentStep = 'saved';
            this.savedRecordId = result.visitReportId;
            this.savedTaskIds = result.taskIds || [];

            this.showToast(
                '保存完了',
                `訪問レポートと ${this.savedTaskIds.length} 件のToDoが作成されました`,
                'success'
            );

        } catch (error) {
            console.error('Save error:', error);
            this.showToast('保存失敗', error.body?.message || '後でもう一度お試しください', 'error');
        } finally {
            this.isLoading = false;
        }
    }

    handleBackToEdit() {
        this.currentStep = 'result';
    }

    handleNewMeeting() {
        // Reset everything for a new meeting
        this.currentStep = 'input';
        this.voiceTranscript = '';
        this.textTranscript = '';
        this.uploadTranscript = '';
        this.textEditMode = true;
        this.analysisResult = null;
        this.savedRecordId = null;
        this.savedTaskIds = [];
    }

    handleViewRecord() {
        if (this.savedRecordId) {
            // Navigate to the record
            window.open(`/${this.savedRecordId}`, '_blank');
        }
    }

    // Utility methods
    getTodayDate() {
        return new Date().toISOString().split('T')[0];
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        }));
    }

    // Audio transcription handler
    handleAudioTranscription(event) {
        if (event.detail && event.detail.text) {
            this.uploadTranscript = event.detail.text;
            this.showToast('文字起こし完了', '音声がテキストに変換されました。「AI分析開始」をクリックして続行', 'success');

            // Optionally auto-start analysis
            // this.startAnalysis();
        }
    }
}