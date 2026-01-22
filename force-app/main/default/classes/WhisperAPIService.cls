/**
 * Whisper API Service Class
 * Handles communication with OpenAI's Whisper API for audio transcription
 *
 * @author GBase SF Integration
 * @date 2025
 */
public with sharing class WhisperAPIService {

    // API Configuration
    private static final String API_ENDPOINT = 'https://api.openai.com/v1/audio/transcriptions';
    private static final String MODEL = 'whisper-1';
    // Apex heap limit is 6MB synchronous. Base64 adds ~33% overhead.
    // Practical limit is ~4MB to account for multipart form overhead
    private static final Integer MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB

    /**
     * Transcription result wrapper
     */
    public class TranscriptionResult {
        @AuraEnabled public Boolean success;
        @AuraEnabled public String text;
        @AuraEnabled public String language;
        @AuraEnabled public Decimal duration;
        @AuraEnabled public String errorMessage;
    }

    /**
     * Transcribe audio file using Whisper API
     * @param base64Audio Base64 encoded audio file content
     * @param fileName Original file name with extension
     * @param language Optional language hint (e.g., 'zh', 'ja', 'en')
     * @return TranscriptionResult containing the transcribed text
     */
    @AuraEnabled
    public static TranscriptionResult transcribeAudio(String base64Audio, String fileName, String language) {
        TranscriptionResult result = new TranscriptionResult();

        try {
            // Validate input
            if (String.isBlank(base64Audio)) {
                result.success = false;
                result.errorMessage = 'Audio data is empty';
                return result;
            }

            // Decode and check file size
            Blob audioBlob = EncodingUtil.base64Decode(base64Audio);
            if (audioBlob.size() > MAX_FILE_SIZE) {
                result.success = false;
                Decimal sizeMB = Decimal.valueOf(audioBlob.size()) / (1024 * 1024);
                result.errorMessage = 'ファイルサイズが制限を超えています。現在: ' + sizeMB.setScale(2) + 'MB、制限: 4MB。Salesforceのメモリ制限により、大きなファイルは処理できません。ファイルを圧縮または分割してください。';
                return result;
            }

            // Get API key
            String apiKey = getApiKey();
            if (String.isBlank(apiKey)) {
                result.success = false;
                result.errorMessage = 'OpenAI API Key is not configured. Please set up OpenAI_API_Settings__mdt.';
                return result;
            }

            // Determine content type from file extension
            String contentType = getContentType(fileName);

            // Build multipart form data
            String boundary = '----WebKitFormBoundary' + String.valueOf(DateTime.now().getTime());

            // Create the multipart body
            String bodyHeader = '--' + boundary + '\r\n' +
                'Content-Disposition: form-data; name="file"; filename="' + fileName + '"\r\n' +
                'Content-Type: ' + contentType + '\r\n\r\n';

            String bodyModel = '\r\n--' + boundary + '\r\n' +
                'Content-Disposition: form-data; name="model"\r\n\r\n' +
                MODEL;

            String bodyLanguage = '';
            if (String.isNotBlank(language)) {
                bodyLanguage = '\r\n--' + boundary + '\r\n' +
                    'Content-Disposition: form-data; name="language"\r\n\r\n' +
                    language;
            }

            String bodyResponseFormat = '\r\n--' + boundary + '\r\n' +
                'Content-Disposition: form-data; name="response_format"\r\n\r\n' +
                'verbose_json';

            String bodyFooter = '\r\n--' + boundary + '--\r\n';

            // Combine all parts
            Blob headerBlob = Blob.valueOf(bodyHeader);
            Blob footerBlob = Blob.valueOf(bodyModel + bodyLanguage + bodyResponseFormat + bodyFooter);

            // Concatenate blobs: header + audio + footer
            String headerEncoded = EncodingUtil.base64Encode(headerBlob);
            String audioEncoded = base64Audio;
            String footerEncoded = EncodingUtil.base64Encode(footerBlob);

            // For Salesforce HTTP callout, we need to use a different approach
            // Using HttpRequest with blob body
            Blob bodyBlob = combineBlobs(headerBlob, audioBlob, footerBlob);

            HttpRequest req = new HttpRequest();
            req.setEndpoint(API_ENDPOINT);
            req.setMethod('POST');
            req.setHeader('Authorization', 'Bearer ' + apiKey);
            req.setHeader('Content-Type', 'multipart/form-data; boundary=' + boundary);
            req.setTimeout(120000); // 2 minutes timeout
            req.setBodyAsBlob(bodyBlob);

            Http http = new Http();
            HttpResponse res = http.send(req);

            if (res.getStatusCode() == 200) {
                Map<String, Object> responseMap = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());

                result.success = true;
                result.text = (String) responseMap.get('text');
                result.language = (String) responseMap.get('language');

                Object durationObj = responseMap.get('duration');
                if (durationObj != null) {
                    if (durationObj instanceof Decimal) {
                        result.duration = (Decimal) durationObj;
                    } else if (durationObj instanceof Integer) {
                        result.duration = Decimal.valueOf((Integer) durationObj);
                    }
                }

            } else {
                result.success = false;
                result.errorMessage = 'API Error: ' + res.getStatusCode() + ' - ' + res.getBody();
            }

        } catch (Exception e) {
            result.success = false;
            result.errorMessage = 'Exception: ' + e.getMessage();
            System.debug('Whisper API Error: ' + e.getMessage() + '\n' + e.getStackTraceString());
        }

        return result;
    }

    /**
     * Combine multiple blobs into one
     */
    private static Blob combineBlobs(Blob header, Blob content, Blob footer) {
        String headerHex = EncodingUtil.convertToHex(header);
        String contentHex = EncodingUtil.convertToHex(content);
        String footerHex = EncodingUtil.convertToHex(footer);

        String combinedHex = headerHex + contentHex + footerHex;

        return EncodingUtil.convertFromHex(combinedHex);
    }

    /**
     * Get content type from file extension
     */
    private static String getContentType(String fileName) {
        if (String.isBlank(fileName)) {
            return 'audio/mpeg';
        }

        String ext = fileName.toLowerCase();
        if (ext.endsWith('.mp3')) {
            return 'audio/mpeg';
        } else if (ext.endsWith('.mp4') || ext.endsWith('.m4a')) {
            return 'audio/mp4';
        } else if (ext.endsWith('.wav')) {
            return 'audio/wav';
        } else if (ext.endsWith('.webm')) {
            return 'audio/webm';
        } else if (ext.endsWith('.ogg')) {
            return 'audio/ogg';
        } else if (ext.endsWith('.flac')) {
            return 'audio/flac';
        }

        return 'audio/mpeg';
    }

    /**
     * Get API key from Custom Metadata
     */
    private static String getApiKey() {
        try {
            List<OpenAI_API_Settings__mdt> settings = [
                SELECT API_Key__c
                FROM OpenAI_API_Settings__mdt
                WHERE DeveloperName = 'Default'
                LIMIT 1
            ];

            if (!settings.isEmpty() && String.isNotBlank(settings[0].API_Key__c)) {
                return settings[0].API_Key__c;
            }
        } catch (Exception e) {
            System.debug('Error retrieving OpenAI API key: ' + e.getMessage());
        }

        return '';
    }

    /**
     * Check if Whisper API is configured
     */
    @AuraEnabled(cacheable=true)
    public static Boolean isConfigured() {
        return String.isNotBlank(getApiKey());
    }
}