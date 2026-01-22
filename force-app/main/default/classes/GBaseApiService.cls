/**
 * GBaseApiService - Core service for communicating with GBase AI API
 * Handles meeting analysis, document generation, and async callbacks
 *
 * @author GBase Team
 * @version 1.0
 */
public with sharing class GBaseApiService {

    // Named Credential for GBase API (configured in Setup)
    private static final String NAMED_CREDENTIAL = 'callout:GBase_API';
    private static final Integer TIMEOUT_MS = 120000; // 120 seconds max

    /**
     * Trigger meeting analysis - uploads audio and starts async processing
     * @param meetingId - Salesforce record ID of GBase_Meeting__c
     * @param audioUrl - Pre-signed URL of the audio file
     * @return String - GBase Job ID for tracking
     */
    @AuraEnabled
    public static String triggerMeetingAnalysis(String meetingId, String audioUrl) {
        try {
            // Build request body
            Map<String, Object> requestBody = new Map<String, Object>{
                'meetingId' => meetingId,
                'audioUrl' => audioUrl,
                'callbackUrl' => getCallbackUrl(),
                'options' => new Map<String, Object>{
                    'language' => 'ja',
                    'generateProposal' => true,
                    'generatePpt' => true
                }
            };

            // Make HTTP callout
            HttpResponse response = makePostRequest('/v1/meetings', JSON.serialize(requestBody));

            if (response.getStatusCode() == 202 || response.getStatusCode() == 200) {
                Map<String, Object> result = (Map<String, Object>) JSON.deserializeUntyped(response.getBody());
                String jobId = (String) result.get('jobId');

                // Update meeting record with job ID
                updateMeetingStatus(meetingId, jobId, 'Transcribing');

                return jobId;
            } else {
                throw new GBaseApiException('API returned status ' + response.getStatusCode() + ': ' + response.getBody());
            }
        } catch (Exception e) {
            // Update meeting status to Failed
            updateMeetingStatus(meetingId, null, 'Failed');
            throw new AuraHandledException('Failed to trigger analysis: ' + e.getMessage());
        }
    }

    /**
     * Get meeting analysis result
     * @param gbaseJobId - GBase Job ID
     * @return Map<String, Object> - Analysis result
     */
    @AuraEnabled(cacheable=true)
    public static Map<String, Object> getMeetingAnalysis(String gbaseJobId) {
        try {
            HttpResponse response = makeGetRequest('/v1/meetings/' + gbaseJobId + '/analysis');

            if (response.getStatusCode() == 200) {
                return (Map<String, Object>) JSON.deserializeUntyped(response.getBody());
            } else {
                throw new GBaseApiException('Failed to get analysis: ' + response.getBody());
            }
        } catch (Exception e) {
            throw new AuraHandledException('Error fetching analysis: ' + e.getMessage());
        }
    }

    /**
     * Trigger proposal document generation
     * @param meetingId - Salesforce record ID
     * @return String - Document generation job ID
     */
    @AuraEnabled
    public static String generateProposal(String meetingId) {
        return generateDocument(meetingId, 'proposal');
    }

    /**
     * Trigger PPT generation
     * @param meetingId - Salesforce record ID
     * @return String - Document generation job ID
     */
    @AuraEnabled
    public static String generatePpt(String meetingId) {
        return generateDocument(meetingId, 'ppt');
    }

    /**
     * Generic document generation method
     */
    private static String generateDocument(String meetingId, String docType) {
        try {
            Map<String, Object> requestBody = new Map<String, Object>{
                'meetingId' => meetingId,
                'documentType' => docType,
                'callbackUrl' => getCallbackUrl()
            };

            HttpResponse response = makePostRequest('/v1/meetings/' + meetingId + '/documents', JSON.serialize(requestBody));

            if (response.getStatusCode() == 202 || response.getStatusCode() == 200) {
                Map<String, Object> result = (Map<String, Object>) JSON.deserializeUntyped(response.getBody());
                return (String) result.get('jobId');
            } else {
                throw new GBaseApiException('Document generation failed: ' + response.getBody());
            }
        } catch (Exception e) {
            throw new AuraHandledException('Error generating document: ' + e.getMessage());
        }
    }

    /**
     * Make POST request to GBase API
     */
    private static HttpResponse makePostRequest(String endpoint, String body) {
        HttpRequest req = new HttpRequest();
        req.setEndpoint(NAMED_CREDENTIAL + endpoint);
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/json');
        req.setTimeout(TIMEOUT_MS);
        req.setBody(body);

        // Add API Key from Custom Setting
        String apiKey = getApiKey();
        if (String.isNotBlank(apiKey)) {
            req.setHeader('X-API-Key', apiKey);
        }

        Http http = new Http();
        return http.send(req);
    }

    /**
     * Make GET request to GBase API
     */
    private static HttpResponse makeGetRequest(String endpoint) {
        HttpRequest req = new HttpRequest();
        req.setEndpoint(NAMED_CREDENTIAL + endpoint);
        req.setMethod('GET');
        req.setHeader('Content-Type', 'application/json');
        req.setTimeout(TIMEOUT_MS);

        // Add API Key from Custom Setting
        String apiKey = getApiKey();
        if (String.isNotBlank(apiKey)) {
            req.setHeader('X-API-Key', apiKey);
        }

        Http http = new Http();
        return http.send(req);
    }

    /**
     * Get API Key from Custom Setting
     */
    private static String getApiKey() {
        GBase_Settings__c settings = GBase_Settings__c.getInstance();
        return settings != null ? settings.API_Key__c : null;
    }

    /**
     * Get callback URL for async responses
     */
    private static String getCallbackUrl() {
        GBase_Settings__c settings = GBase_Settings__c.getInstance();
        if (settings != null && String.isNotBlank(settings.Callback_URL__c)) {
            return settings.Callback_URL__c;
        }
        return URL.getOrgDomainUrl().toExternalForm() + '/services/apexrest/gbase/callback';
    }

    /**
     * Update meeting record status
     */
    private static void updateMeetingStatus(String meetingId, String jobId, String status) {
        GBase_Meeting__c meeting = new GBase_Meeting__c(
            Id = meetingId,
            Status__c = status
        );
        if (jobId != null) {
            meeting.GBase_Job_Id__c = jobId;
        }
        update meeting;
    }

    /**
     * Custom exception for GBase API errors
     */
    public class GBaseApiException extends Exception {}
}