import { LightningElement, api, track } from 'lwc';

export default class VoiceInput extends LightningElement {
    @api existingText = '';
    @track transcript = '';
    @track interimTranscript = '';
    @track isListening = false;
    @track selectedLanguage = 'ja-JP';
    @track errorMessage = '';

    // New: Transcript segments with timestamps
    @track transcriptSegments = [];
    @track isEditMode = true; // Default to edit mode
    @track isPlaying = false;
    @track currentTime = 0;
    @track duration = 0;
    @track hasAudioRecording = false;
    @track seekStep = 5; // Seek step in seconds (1 or 5)

    recognition = null;
    isSpeechSupported = false;
    hasPermission = false;

    // Audio recording
    mediaRecorder = null;
    audioChunks = [];
    audioBlob = null;
    audioUrl = null;
    audioElement = null;
    recordingStartTime = null;
    segmentStartTime = null; // Track when current speech segment started

    languageOptions = [
        { label: '日本語', value: 'ja-JP' },
        { label: '中文 (普通话)', value: 'zh-CN' },
        { label: 'English (US)', value: 'en-US' },
        { label: 'English (UK)', value: 'en-GB' }
    ];

    connectedCallback() {
        this.transcript = this.existingText || '';
        this.initSpeechRecognition();
    }

    disconnectedCallback() {
        if (this.recognition) {
            this.recognition.stop();
        }
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
        if (this.audioUrl) {
            URL.revokeObjectURL(this.audioUrl);
        }
    }

    initSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (SpeechRecognition) {
            this.isSpeechSupported = true;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = this.selectedLanguage;

            this.recognition.onresult = (event) => {
                let interim = '';
                let final = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const result = event.results[i];
                    if (result.isFinal) {
                        final += result[0].transcript;
                    } else {
                        interim += result[0].transcript;
                    }
                }

                // Track when interim results first appear (start of speech)
                // Subtract buffer to account for recognition delay (~1.5s typical latency)
                if (interim && !this.segmentStartTime) {
                    const rawTime = this.recordingStartTime
                        ? (Date.now() - this.recordingStartTime) / 1000
                        : 0;
                    // Go back 1.5 seconds to catch the beginning of speech
                    // Speech recognition typically has 1-2 second latency
                    this.segmentStartTime = Math.max(0, rawTime - 1.5);
                }

                if (final) {
                    // Use the segment start time (when speech began), not end time
                    // Keep full precision (not rounded to seconds)
                    const timestamp = this.segmentStartTime ??
                        (this.recordingStartTime ? (Date.now() - this.recordingStartTime) / 1000 : 0);

                    // Add segment with timestamp
                    this.transcriptSegments = [
                        ...this.transcriptSegments,
                        {
                            id: `seg-${Date.now()}`,
                            text: final.trim(),
                            timestamp: timestamp,
                            speaker: this.detectSpeaker(final)
                        }
                    ];

                    // Reset segment start time for next segment
                    this.segmentStartTime = null;

                    this.transcript = this.getFullTranscript();
                    this.dispatchTranscriptChange();
                }
                this.interimTranscript = interim;
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.isListening = false;

                switch (event.error) {
                    case 'audio-capture':
                        this.errorMessage = 'マイクにアクセスできません。マイクが接続されているか、ブラウザにマイクの使用許可を与えているか確認してください。';
                        break;
                    case 'not-allowed':
                        this.errorMessage = 'マイクの使用が許可されていません。ブラウザの設定でマイクの使用を許可してください。';
                        break;
                    case 'network':
                        this.errorMessage = 'ネットワークエラーが発生しました。インターネット接続を確認してください。';
                        break;
                    case 'no-speech':
                        this.isListening = true;
                        return;
                    case 'aborted':
                        this.errorMessage = '録音が中断されました。';
                        break;
                    default:
                        this.errorMessage = `音声認識エラー: ${event.error}`;
                }
            };

            this.recognition.onend = () => {
                if (this.isListening) {
                    try {
                        this.recognition.start();
                    } catch (e) {
                        this.isListening = false;
                    }
                }
            };
        } else {
            this.isSpeechSupported = false;
        }
    }

    // Simple speaker detection based on patterns
    detectSpeaker(text) {
        // Look for common speaker indicators in Japanese/Chinese/English
        const speakerPatterns = [
            /^([\u4e00-\u9fa5\u3040-\u309f\u30a0-\u30ff]+)[:：]/,  // Japanese/Chinese name followed by colon
            /^([A-Za-z\s]+)[:：]/,  // English name followed by colon
            /^【(.+?)】/,  // Square brackets
            /^「(.+?)」/   // Japanese quotes at start
        ];

        for (const pattern of speakerPatterns) {
            const match = text.match(pattern);
            if (match) {
                return match[1].trim();
            }
        }
        return null;
    }

    async handleStartRecording() {
        if (this.recognition && !this.isListening) {
            this.errorMessage = '';

            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                this.hasPermission = true;

                // Setup MediaRecorder for audio capture
                this.audioChunks = [];
                this.mediaRecorder = new MediaRecorder(stream);

                this.mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        this.audioChunks.push(event.data);
                    }
                };

                this.mediaRecorder.onstop = () => {
                    this.audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                    if (this.audioUrl) {
                        URL.revokeObjectURL(this.audioUrl);
                    }
                    this.audioUrl = URL.createObjectURL(this.audioBlob);
                    this.hasAudioRecording = true;

                    // Setup audio element for playback
                    this.setupAudioPlayer();
                };

                // Start recording
                this.mediaRecorder.start(1000); // Collect data every second
                this.recordingStartTime = Date.now();
                this.segmentStartTime = null;

            } catch (permissionError) {
                console.error('Microphone permission denied:', permissionError);
                this.errorMessage = 'マイクの使用が許可されていません。ブラウザの設定でマイクの使用を許可してください。';
                return;
            }

            try {
                this.recognition.lang = this.selectedLanguage;
                this.recognition.start();
                this.isListening = true;
                this.interimTranscript = '';
            } catch (e) {
                console.error('Failed to start recognition:', e);
                this.errorMessage = `録音の開始に失敗しました: ${e.message}`;
            }
        }
    }

    handleStopRecording() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            this.isListening = false;
            this.interimTranscript = '';

            // Calculate duration from recording time
            if (this.recordingStartTime) {
                this.duration = (Date.now() - this.recordingStartTime) / 1000;
            }

            // Stop audio recording
            if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
                this.mediaRecorder.stop();
                // Stop all tracks
                this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
            }
        }
    }

    setupAudioPlayer() {
        // Use setTimeout to ensure DOM is updated after hasAudioRecording becomes true
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        setTimeout(() => {
            this.audioElement = this.template.querySelector('.audio-element');
            console.log('setupAudioPlayer', {
                audioElement: !!this.audioElement,
                audioUrl: this.audioUrl,
                audioBlob: this.audioBlob ? `${this.audioBlob.size} bytes, type: ${this.audioBlob.type}` : null
            });

            if (this.audioElement && this.audioUrl) {
                this.audioElement.src = this.audioUrl;
                this.audioElement.load();

                this.audioElement.onloadedmetadata = () => {
                    console.log('Audio metadata loaded, duration:', this.audioElement.duration);
                    // Only update duration if it's a valid number
                    const audioDuration = this.audioElement.duration;
                    if (isFinite(audioDuration) && !isNaN(audioDuration)) {
                        this.duration = audioDuration;
                    }
                    // Otherwise keep the calculated duration from recording time
                };

                this.audioElement.oncanplay = () => {
                    console.log('Audio can play');
                };

                this.audioElement.ontimeupdate = () => {
                    this.currentTime = this.audioElement.currentTime;
                    this.highlightCurrentSegment();
                };

                this.audioElement.onended = () => {
                    this.isPlaying = false;
                    this.currentTime = 0;
                };

                this.audioElement.onerror = (e) => {
                    console.error('Audio error:', e.target.error);
                    if (e.target.error) {
                        console.error('Error code:', e.target.error.code, 'message:', e.target.error.message);
                    }
                };
            } else {
                console.warn('setupAudioPlayer: audioElement or audioUrl missing');
            }
        }, 100);
    }

    highlightCurrentSegment() {
        // Find and highlight the segment being played
        const segments = this.template.querySelectorAll('.transcript-segment');
        segments.forEach(seg => {
            const timestamp = parseFloat(seg.dataset.timestamp);
            const nextSeg = seg.nextElementSibling;
            const nextTimestamp = nextSeg ? parseFloat(nextSeg.dataset.timestamp) : this.duration;

            if (this.currentTime >= timestamp && this.currentTime < nextTimestamp) {
                seg.classList.add('segment-active');
            } else {
                seg.classList.remove('segment-active');
            }
        });
    }

    handleSegmentClick(event) {
        // Don't seek if in edit mode
        if (this.isEditMode) return;

        const timestamp = parseFloat(event.currentTarget.dataset.timestamp);

        // Re-query audio element
        if (!this.audioElement) {
            this.audioElement = this.template.querySelector('.audio-element');
        }

        if (this.audioElement && this.audioUrl && !isNaN(timestamp)) {
            // Ensure source is set
            if (!this.audioElement.src) {
                this.audioElement.src = this.audioUrl;
                this.audioElement.load();
            }

            this.audioElement.currentTime = timestamp;
            if (!this.isPlaying) {
                this.audioElement.play()
                    .then(() => {
                        this.isPlaying = true;
                    })
                    .catch(err => {
                        console.error('Play error:', err);
                    });
            }
        }
    }

    handlePlayPause() {
        // Re-query audio element in case it wasn't found initially
        if (!this.audioElement) {
            this.audioElement = this.template.querySelector('.audio-element');
        }

        // Debug logging
        console.log('handlePlayPause called', {
            hasAudioElement: !!this.audioElement,
            audioUrl: this.audioUrl,
            audioBlob: this.audioBlob,
            hasAudioRecording: this.hasAudioRecording
        });

        if (!this.audioElement) {
            this.errorMessage = '音声プレーヤーが見つかりません';
            return;
        }

        if (!this.audioUrl) {
            this.errorMessage = '音声データがありません';
            return;
        }

        // Ensure source is set
        if (!this.audioElement.src || this.audioElement.src === '' || this.audioElement.src === window.location.href) {
            console.log('Setting audio source:', this.audioUrl);
            this.audioElement.src = this.audioUrl;
            this.audioElement.load();
        }

        if (this.isPlaying) {
            this.audioElement.pause();
            this.isPlaying = false;
        } else {
            // Clear previous error
            this.errorMessage = '';

            this.audioElement.play()
                .then(() => {
                    this.isPlaying = true;
                })
                .catch(err => {
                    console.error('Play error details:', err.name, err.message);
                    // Show more specific error message
                    if (err.name === 'NotAllowedError') {
                        this.errorMessage = '再生がブロックされました。もう一度クリックしてください。';
                    } else if (err.name === 'NotSupportedError') {
                        this.errorMessage = 'この音声形式はサポートされていません。';
                    } else {
                        this.errorMessage = `再生に失敗しました: ${err.message}`;
                    }
                });
        }
    }

    // Seek backward by seekStep seconds
    handleSeekBackward() {
        if (!this.audioElement) {
            this.audioElement = this.template.querySelector('.audio-element');
        }
        if (this.audioElement) {
            this.audioElement.currentTime = Math.max(0, this.audioElement.currentTime - this.seekStep);
            this.currentTime = this.audioElement.currentTime;
        }
    }

    // Seek forward by seekStep seconds
    handleSeekForward() {
        if (!this.audioElement) {
            this.audioElement = this.template.querySelector('.audio-element');
        }
        if (this.audioElement) {
            const maxTime = this.duration || this.audioElement.duration || 0;
            this.audioElement.currentTime = Math.min(maxTime, this.audioElement.currentTime + this.seekStep);
            this.currentTime = this.audioElement.currentTime;
        }
    }

    // Set seek step to 1 second
    handleSetSeekStep1() {
        this.seekStep = 1;
    }

    // Set seek step to 5 seconds
    handleSetSeekStep5() {
        this.seekStep = 5;
    }

    handleClear() {
        this.transcript = '';
        this.interimTranscript = '';
        this.transcriptSegments = [];
        this.hasAudioRecording = false;
        this.segmentStartTime = null;
        this.duration = 0;
        this.currentTime = 0;
        this.isPlaying = false;
        if (this.audioUrl) {
            URL.revokeObjectURL(this.audioUrl);
            this.audioUrl = null;
        }
        this.audioBlob = null;
        this.audioElement = null;
        this.dispatchTranscriptChange();
    }

    handleLanguageChange(event) {
        this.selectedLanguage = event.detail.value;
        if (this.recognition) {
            this.recognition.lang = this.selectedLanguage;
        }
    }

    // Toggle edit mode
    handleToggleEditMode() {
        this.isEditMode = !this.isEditMode;
    }

    handleTranscriptChange(event) {
        this.transcript = event.target.value;
        this.dispatchTranscriptChange();
    }

    // Handle segment text edit
    handleSegmentEdit(event) {
        const segmentId = event.target.dataset.segmentId;
        const newText = event.target.value;

        this.transcriptSegments = this.transcriptSegments.map(seg => {
            if (seg.id === segmentId) {
                return { ...seg, text: newText };
            }
            return seg;
        });

        this.transcript = this.getFullTranscript();
        this.dispatchTranscriptChange();
    }

    // Handle timestamp adjustment
    handleTimestampAdjust(event) {
        const segmentId = event.currentTarget.dataset.segmentId;
        const adjustment = parseFloat(event.currentTarget.dataset.adjust);

        this.transcriptSegments = this.transcriptSegments.map(seg => {
            if (seg.id === segmentId) {
                const newTimestamp = Math.max(0, seg.timestamp + adjustment);
                return { ...seg, timestamp: newTimestamp };
            }
            return seg;
        });
    }

    // Play from a specific timestamp (used in edit mode)
    handlePlayFromTimestamp(event) {
        event.stopPropagation(); // Prevent segment click event
        const timestamp = parseFloat(event.currentTarget.dataset.timestamp);

        if (!this.audioElement) {
            this.audioElement = this.template.querySelector('.audio-element');
        }

        console.log('handlePlayFromTimestamp', { timestamp, hasAudioElement: !!this.audioElement, audioUrl: this.audioUrl });

        if (!this.audioElement || !this.audioUrl) {
            this.errorMessage = '音声データがありません';
            return;
        }

        if (isNaN(timestamp)) {
            return;
        }

        // Ensure source is set
        if (!this.audioElement.src || this.audioElement.src === '' || this.audioElement.src === window.location.href) {
            this.audioElement.src = this.audioUrl;
            this.audioElement.load();
        }

        this.errorMessage = '';
        this.audioElement.currentTime = timestamp;
        this.audioElement.play()
            .then(() => {
                this.isPlaying = true;
            })
            .catch(err => {
                console.error('Play error:', err.name, err.message);
                if (err.name === 'NotAllowedError') {
                    this.errorMessage = '再生がブロックされました。もう一度クリックしてください。';
                } else {
                    this.errorMessage = `再生に失敗: ${err.message}`;
                }
            });
    }

    // Handle direct timestamp input
    handleTimestampChange(event) {
        const segmentId = event.target.dataset.segmentId;
        const inputValue = event.target.value;

        // Parse MM:SS.s format
        const match = inputValue.match(/^(\d+):(\d+)(?:\.(\d))?$/);
        if (match) {
            const mins = parseInt(match[1], 10);
            const secs = parseInt(match[2], 10);
            const tenths = match[3] ? parseInt(match[3], 10) / 10 : 0;
            const newTimestamp = mins * 60 + secs + tenths;

            this.transcriptSegments = this.transcriptSegments.map(seg => {
                if (seg.id === segmentId) {
                    return { ...seg, timestamp: Math.max(0, newTimestamp) };
                }
                return seg;
            });
        }
    }

    // Delete a segment
    handleDeleteSegment(event) {
        const segmentId = event.currentTarget.dataset.segmentId;
        this.transcriptSegments = this.transcriptSegments.filter(seg => seg.id !== segmentId);
        this.transcript = this.getFullTranscript();
        this.dispatchTranscriptChange();
    }

    // Add a new segment manually
    handleAddSegment() {
        const newSegment = {
            id: `seg-${Date.now()}`,
            text: '',
            timestamp: this.currentTime || 0,
            speaker: null
        };
        this.transcriptSegments = [...this.transcriptSegments, newSegment];
    }

    handleAnalyze() {
        if (this.transcript) {
            if (this.isListening) {
                this.handleStopRecording();
            }

            this.dispatchEvent(new CustomEvent('analyze', {
                detail: {
                    text: this.transcript,
                    segments: this.transcriptSegments
                }
            }));
        }
    }

    dispatchTranscriptChange() {
        this.dispatchEvent(new CustomEvent('transcriptchange', {
            detail: {
                text: this.transcript,
                segments: this.transcriptSegments
            }
        }));
    }

    getFullTranscript() {
        return this.transcriptSegments.map(seg => seg.text).join(' ').trim();
    }

    // Format timestamp as MM:SS.s (with tenths of seconds for precision)
    formatTimestamp(seconds, showTenths = false) {
        if (isNaN(seconds) || seconds === null || !isFinite(seconds)) return '--:--';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const tenths = Math.floor((seconds % 1) * 10);

        const base = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        return showTenths ? `${base}.${tenths}` : base;
    }

    // Format for segment timestamps (show tenths)
    formatSegmentTimestamp(seconds) {
        return this.formatTimestamp(seconds, true);
    }

    // Getters for template
    get statusLabel() {
        return this.isListening ? '録音中...' : '待機中';
    }

    get statusClass() {
        return this.isListening ? 'slds-badge_inverse' : '';
    }

    get startButtonVariant() {
        return this.isListening ? 'neutral' : 'success';
    }

    get isNotListening() {
        return !this.isListening;
    }

    get hasNoText() {
        return !this.transcript || this.transcript.trim() === '';
    }

    get hasText() {
        return this.transcript && this.transcript.trim().length > 0;
    }

    get hasError() {
        return this.errorMessage && this.errorMessage.length > 0;
    }

    get hasSegments() {
        return this.transcriptSegments && this.transcriptSegments.length > 0;
    }

    get editModeButtonLabel() {
        return this.isEditMode ? '完了' : '編集';
    }

    get editModeButtonIcon() {
        return this.isEditMode ? 'utility:check' : 'utility:edit';
    }

    get editModeButtonVariant() {
        return this.isEditMode ? 'brand' : 'border';
    }

    get playPauseIcon() {
        return this.isPlaying ? 'utility:pause' : 'utility:play';
    }

    get playPauseLabel() {
        return this.isPlaying ? '一時停止' : '再生';
    }

    get seekBackwardLabel() {
        return `-${this.seekStep}秒`;
    }

    get seekForwardLabel() {
        return `+${this.seekStep}秒`;
    }

    get seekStep1Variant() {
        return this.seekStep === 1 ? 'brand' : 'neutral';
    }

    get seekStep5Variant() {
        return this.seekStep === 5 ? 'brand' : 'neutral';
    }

    get formattedCurrentTime() {
        return this.formatTimestamp(this.currentTime);
    }

    get formattedDuration() {
        return this.formatTimestamp(this.duration);
    }

    get displaySegments() {
        return this.transcriptSegments.map(seg => ({
            ...seg,
            formattedTime: this.formatSegmentTimestamp(seg.timestamp),
            speakerLabel: seg.speaker || '話者',
            hasSpeaker: !!seg.speaker
        }));
    }

    // Format transcript text into paragraphs for display
    get formattedParagraphs() {
        if (!this.transcript) return [];

        const lines = this.transcript.split('\n');
        return lines.map((line, index) => {
            const trimmed = line.trim();
            let className = 'paragraph-normal';

            // Detect headers/sections (starts with 【 or numbers like 1. or ・)
            if (trimmed.startsWith('【') || /^[0-9]+[.、．]/.test(trimmed)) {
                className = 'paragraph-header';
            }
            // Detect speaker lines (contains ：or : after name)
            else if (/^[^：:]{1,20}[：:]/.test(trimmed)) {
                className = 'paragraph-speaker';
            }
            // Detect bullet points
            else if (trimmed.startsWith('・') || trimmed.startsWith('-') || trimmed.startsWith('•')) {
                className = 'paragraph-bullet';
            }

            return {
                id: `para-${index}`,
                text: line,
                className: className
            };
        }).filter(p => p.text.trim() !== '');
    }

    clearError() {
        this.errorMessage = '';
    }
}
