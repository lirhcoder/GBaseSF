import { LightningElement, track, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import transcribeAudio from '@salesforce/apex/WhisperAPIService.transcribeAudio';
import isConfigured from '@salesforce/apex/WhisperAPIService.isConfigured';

export default class AudioUploader extends LightningElement {
    @api language = 'ja';

    @track isConfigured = false;
    @track selectedFile = null;
    @track fileName = '';
    @track fileSize = '';
    @track isUploading = false;
    @track isTranscribing = false;
    @track uploadProgress = 0;
    @track transcriptionResult = '';
    @track audioDuration = 0;
    @track errorMessage = '';

    // Audio playback
    @track audioUrl = null;
    @track isPlaying = false;

    // Chunked processing state
    @track needsChunking = false;
    @track totalChunks = 0;
    @track currentChunk = 0;
    @track chunkProgress = '';

    // File constraints
    // Salesforce Apex heap limit: 6MB synchronous
    // Base64 encoding adds ~33%, so we need to keep chunks under 3MB
    // WAV at 16kHz mono 16-bit = 32KB/sec, so 60sec = ~2MB
    maxChunkSize = 3 * 1024 * 1024; // 3MB per chunk for Apex processing
    maxTotalSize = 100 * 1024 * 1024; // 100MB max total file size
    chunkDurationSeconds = 60; // 1 minute per chunk
    targetSampleRate = 16000; // Whisper prefers 16kHz, also reduces file size
    acceptedFormats = '.mp3,.wav,.m4a,.webm,.ogg,.flac,.mp4';

    connectedCallback() {
        this.checkConfiguration();
    }

    async checkConfiguration() {
        try {
            this.isConfigured = await isConfigured();
        } catch (error) {
            console.error('Error checking Whisper configuration:', error);
            this.isConfigured = false;
        }
    }

    get hasFile() {
        return this.selectedFile !== null;
    }

    get hasTranscription() {
        return this.transcriptionResult && this.transcriptionResult.length > 0;
    }

    get canTranscribe() {
        return this.hasFile && !this.isTranscribing && this.isConfigured;
    }

    get uploadStatusText() {
        if (this.isTranscribing) {
            if (this.needsChunking && this.totalChunks > 1) {
                return `文字起こし中... (${this.currentChunk}/${this.totalChunks})`;
            }
            return '音声を文字起こし中...';
        }
        if (this.isUploading) {
            return 'アップロード中...';
        }
        return '';
    }

    get formattedDuration() {
        if (!this.audioDuration) return '';
        const minutes = Math.floor(this.audioDuration / 60);
        const seconds = Math.floor(this.audioDuration % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    get dropZoneClass() {
        return this.hasFile ? 'drop-zone has-file' : 'drop-zone';
    }

    get playerLabel() {
        return this.isPlaying ? '再生中...' : 'クリックでプレビュー';
    }

    get transcribeButtonLabel() {
        if (this.isTranscribing) {
            if (this.needsChunking && this.totalChunks > 1) {
                return `処理中 ${this.currentChunk}/${this.totalChunks}...`;
            }
            return '文字起こし中...';
        }
        if (this.needsChunking) {
            return `文字起こし開始 (${this.totalChunks}分割)`;
        }
        return '文字起こし開始';
    }

    get isTranscribeDisabled() {
        return !this.canTranscribe;
    }

    get showChunkingInfo() {
        return this.needsChunking && this.totalChunks > 1;
    }

    get chunkProgressStyle() {
        const percent = this.totalChunks > 0 ? (this.currentChunk / this.totalChunks) * 100 : 0;
        return `width: ${percent}%`;
    }

    // File selection
    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    // Drag and drop handlers
    handleDragOver(event) {
        event.preventDefault();
        event.currentTarget.classList.add('drag-over');
    }

    handleDragLeave(event) {
        event.currentTarget.classList.remove('drag-over');
    }

    handleDrop(event) {
        event.preventDefault();
        event.currentTarget.classList.remove('drag-over');

        const files = event.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    processFile(file) {
        // Validate file type
        const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/mp4', 'audio/m4a',
                           'audio/webm', 'audio/ogg', 'audio/flac', 'video/mp4'];
        if (!validTypes.includes(file.type) && !this.isValidExtension(file.name)) {
            this.showToast('エラー', 'サポートされていないファイル形式です。MP3, WAV, M4A, WebM, OGG, FLACファイルをアップロードしてください。', 'error');
            return;
        }

        // Check max total size
        if (file.size > this.maxTotalSize) {
            const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
            this.showToast('エラー', `ファイルが大きすぎます（${fileSizeMB}MB）。最大100MBまでです。`, 'error');
            return;
        }

        this.selectedFile = file;
        this.fileName = file.name;
        this.fileSize = this.formatFileSize(file.size);
        this.errorMessage = '';
        this.transcriptionResult = '';
        this.needsChunking = false;
        this.totalChunks = 0;

        // Check if chunking is needed
        if (file.size > this.maxChunkSize) {
            this.needsChunking = true;
            // Estimate chunks based on file size (rough estimate)
            this.totalChunks = Math.ceil(file.size / this.maxChunkSize);
        }

        // Create audio URL for preview
        if (this.audioUrl) {
            URL.revokeObjectURL(this.audioUrl);
        }
        this.audioUrl = URL.createObjectURL(file);

        // Get audio duration and recalculate chunks
        const audio = new Audio(this.audioUrl);
        audio.addEventListener('loadedmetadata', () => {
            this.audioDuration = audio.duration;
            // Recalculate chunks based on duration
            if (this.needsChunking) {
                this.totalChunks = Math.ceil(audio.duration / this.chunkDurationSeconds);
            }
        });
    }

    isValidExtension(fileName) {
        const ext = fileName.toLowerCase().split('.').pop();
        return ['mp3', 'wav', 'm4a', 'webm', 'ogg', 'flac', 'mp4'].includes(ext);
    }

    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1024 / 1024).toFixed(2) + ' MB';
    }

    // Audio playback
    handlePlayPause() {
        const audio = this.template.querySelector('audio');
        if (audio) {
            if (this.isPlaying) {
                audio.pause();
            } else {
                audio.play();
            }
            this.isPlaying = !this.isPlaying;
        }
    }

    handleAudioEnded() {
        this.isPlaying = false;
    }

    // Remove file
    handleRemoveFile() {
        if (this.audioUrl) {
            URL.revokeObjectURL(this.audioUrl);
        }
        this.selectedFile = null;
        this.fileName = '';
        this.fileSize = '';
        this.audioUrl = null;
        this.audioDuration = 0;
        this.transcriptionResult = '';
        this.errorMessage = '';
        this.isPlaying = false;
        this.needsChunking = false;
        this.totalChunks = 0;
        this.currentChunk = 0;

        // Reset file input
        const fileInput = this.template.querySelector('input[type="file"]');
        if (fileInput) {
            fileInput.value = '';
        }
    }

    // Transcription
    async handleTranscribe() {
        if (!this.selectedFile) return;

        this.isTranscribing = true;
        this.errorMessage = '';
        this.currentChunk = 0;

        try {
            if (this.needsChunking) {
                // Process large file in chunks
                await this.transcribeInChunks();
            } else {
                // Process small file directly
                await this.transcribeSingleFile();
            }
        } catch (error) {
            console.error('Transcription error:', error);
            this.errorMessage = error.body?.message || error.message || '文字起こし中にエラーが発生しました';
            this.showToast('文字起こし失敗', this.errorMessage, 'error');
        } finally {
            this.isTranscribing = false;
        }
    }

    // Transcribe a single small file
    async transcribeSingleFile() {
        const base64Data = await this.readFileAsBase64(this.selectedFile);

        const result = await transcribeAudio({
            base64Audio: base64Data,
            fileName: this.fileName,
            language: this.language
        });

        if (result.success) {
            this.transcriptionResult = result.text;
            this.audioDuration = result.duration || this.audioDuration;

            this.showToast('文字起こし完了', '音声が正常にテキストに変換されました', 'success');
            this.dispatchTranscriptionComplete(result.text, result.duration, result.language);
        } else {
            this.errorMessage = result.errorMessage;
            this.showToast('文字起こし失敗', result.errorMessage, 'error');
        }
    }

    // Transcribe large file in chunks
    async transcribeInChunks() {
        console.log('Starting chunked transcription...');

        // Decode audio file to AudioBuffer
        const arrayBuffer = await this.selectedFile.arrayBuffer();
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();

        let audioBuffer;
        try {
            audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        } catch (decodeError) {
            console.error('Audio decode error:', decodeError);
            throw new Error('音声ファイルのデコードに失敗しました。ファイルが破損している可能性があります。');
        }

        const originalSampleRate = audioBuffer.sampleRate;
        const numberOfChannels = audioBuffer.numberOfChannels;
        const totalDuration = audioBuffer.duration;

        // Calculate actual chunks based on duration
        this.totalChunks = Math.ceil(totalDuration / this.chunkDurationSeconds);
        console.log(`Audio: ${totalDuration}s, ${originalSampleRate}Hz, ${numberOfChannels}ch, ${this.totalChunks} chunks`);
        console.log(`Will downsample to ${this.targetSampleRate}Hz for smaller file size`);

        const transcriptions = [];

        for (let i = 0; i < this.totalChunks; i++) {
            this.currentChunk = i + 1;
            const startTime = i * this.chunkDurationSeconds;
            const endTime = Math.min((i + 1) * this.chunkDurationSeconds, totalDuration);

            console.log(`Processing chunk ${i + 1}/${this.totalChunks}: ${startTime}s - ${endTime}s`);

            // Extract chunk from audio buffer
            const chunkBuffer = this.extractAudioChunk(audioBuffer, startTime, endTime, originalSampleRate, numberOfChannels);

            // Convert to WAV blob with downsampling to 16kHz
            const wavBlob = this.audioBufferToWav(chunkBuffer, originalSampleRate, numberOfChannels, this.targetSampleRate);
            console.log(`Chunk ${i + 1} WAV size: ${(wavBlob.size / 1024).toFixed(1)}KB`);

            // Check if still too large
            if (wavBlob.size > this.maxChunkSize) {
                console.warn(`Chunk ${i + 1} is still too large (${(wavBlob.size / 1024 / 1024).toFixed(2)}MB), may fail`);
            }

            // Convert to base64
            const base64Data = await this.blobToBase64(wavBlob);

            // Send to Whisper API
            const chunkFileName = `chunk_${i + 1}_${this.fileName.replace(/\.[^/.]+$/, '')}.wav`;

            try {
                const result = await transcribeAudio({
                    base64Audio: base64Data,
                    fileName: chunkFileName,
                    language: this.language
                });

                if (result.success) {
                    transcriptions.push({
                        index: i,
                        startTime: startTime,
                        text: result.text
                    });
                    console.log(`Chunk ${i + 1} transcribed: ${result.text.substring(0, 50)}...`);
                } else {
                    console.error(`Chunk ${i + 1} failed:`, result.errorMessage);
                    transcriptions.push({
                        index: i,
                        startTime: startTime,
                        text: `[エラー: ${result.errorMessage}]`
                    });
                }
            } catch (chunkError) {
                console.error(`Chunk ${i + 1} error:`, chunkError);
                transcriptions.push({
                    index: i,
                    startTime: startTime,
                    text: `[処理エラー]`
                });
            }
        }

        // Close audio context
        await audioContext.close();

        // Combine all transcriptions
        this.transcriptionResult = transcriptions
            .sort((a, b) => a.index - b.index)
            .map(t => t.text)
            .join('\n\n');

        this.showToast('文字起こし完了', `${this.totalChunks}個のセグメントを処理しました`, 'success');
        this.dispatchTranscriptionComplete(this.transcriptionResult, totalDuration, this.language);
    }

    // Extract a chunk from AudioBuffer
    extractAudioChunk(audioBuffer, startTime, endTime, sampleRate, numberOfChannels) {
        const startSample = Math.floor(startTime * sampleRate);
        const endSample = Math.min(Math.floor(endTime * sampleRate), audioBuffer.length);
        const chunkLength = endSample - startSample;

        // Create array to hold channel data
        const channelData = [];
        for (let ch = 0; ch < numberOfChannels; ch++) {
            const fullChannelData = audioBuffer.getChannelData(ch);
            const chunkData = new Float32Array(chunkLength);
            for (let i = 0; i < chunkLength; i++) {
                chunkData[i] = fullChannelData[startSample + i];
            }
            channelData.push(chunkData);
        }

        return { channelData, length: chunkLength };
    }

    // Convert AudioBuffer data to WAV format with optional resampling
    audioBufferToWav(chunkBuffer, originalSampleRate, numberOfChannels, targetSampleRate = null) {
        const { channelData, length } = chunkBuffer;
        const outputSampleRate = targetSampleRate || originalSampleRate;

        // For simplicity, convert to mono if stereo
        let monoData;
        if (numberOfChannels === 1) {
            monoData = channelData[0];
        } else {
            // Mix down to mono
            monoData = new Float32Array(length);
            for (let i = 0; i < length; i++) {
                let sum = 0;
                for (let ch = 0; ch < numberOfChannels; ch++) {
                    sum += channelData[ch][i];
                }
                monoData[i] = sum / numberOfChannels;
            }
        }

        // Resample if needed
        let resampledData = monoData;
        if (targetSampleRate && targetSampleRate !== originalSampleRate) {
            resampledData = this.resampleAudio(monoData, originalSampleRate, targetSampleRate);
        }

        // Convert Float32 to Int16
        const int16Data = new Int16Array(resampledData.length);
        for (let i = 0; i < resampledData.length; i++) {
            const s = Math.max(-1, Math.min(1, resampledData[i]));
            int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        // Create WAV file
        const wavBuffer = this.createWavFile(int16Data, outputSampleRate);
        return new Blob([wavBuffer], { type: 'audio/wav' });
    }

    // Resample audio data using linear interpolation
    resampleAudio(inputData, inputSampleRate, outputSampleRate) {
        const ratio = inputSampleRate / outputSampleRate;
        const outputLength = Math.floor(inputData.length / ratio);
        const outputData = new Float32Array(outputLength);

        for (let i = 0; i < outputLength; i++) {
            const inputIndex = i * ratio;
            const indexFloor = Math.floor(inputIndex);
            const indexCeil = Math.min(indexFloor + 1, inputData.length - 1);
            const fraction = inputIndex - indexFloor;

            // Linear interpolation
            outputData[i] = inputData[indexFloor] * (1 - fraction) + inputData[indexCeil] * fraction;
        }

        return outputData;
    }

    // Create WAV file from Int16 PCM data
    createWavFile(int16Data, sampleRate) {
        const numChannels = 1; // mono
        const bitsPerSample = 16;
        const byteRate = sampleRate * numChannels * bitsPerSample / 8;
        const blockAlign = numChannels * bitsPerSample / 8;
        const dataSize = int16Data.length * 2; // 2 bytes per sample
        const fileSize = 36 + dataSize;

        const buffer = new ArrayBuffer(44 + dataSize);
        const view = new DataView(buffer);

        // RIFF header
        this.writeString(view, 0, 'RIFF');
        view.setUint32(4, fileSize, true);
        this.writeString(view, 8, 'WAVE');

        // fmt chunk
        this.writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true); // chunk size
        view.setUint16(20, 1, true); // audio format (PCM)
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, byteRate, true);
        view.setUint16(32, blockAlign, true);
        view.setUint16(34, bitsPerSample, true);

        // data chunk
        this.writeString(view, 36, 'data');
        view.setUint32(40, dataSize, true);

        // Write PCM data
        const offset = 44;
        for (let i = 0; i < int16Data.length; i++) {
            view.setInt16(offset + i * 2, int16Data[i], true);
        }

        return buffer;
    }

    writeString(view, offset, string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }

    // Convert Blob to base64
    blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(blob);
        });
    }

    readFileAsBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                // Remove data URL prefix to get pure base64
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
        });
    }

    dispatchTranscriptionComplete(text, duration, language) {
        this.dispatchEvent(new CustomEvent('transcriptioncomplete', {
            detail: { text, duration, language }
        }));
    }

    // Use transcription
    handleUseTranscription() {
        if (this.transcriptionResult) {
            this.dispatchEvent(new CustomEvent('usetranscription', {
                detail: { text: this.transcriptionResult }
            }));
        }
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({
            title,
            message,
            variant
        }));
    }

    disconnectedCallback() {
        if (this.audioUrl) {
            URL.revokeObjectURL(this.audioUrl);
        }
    }
}
