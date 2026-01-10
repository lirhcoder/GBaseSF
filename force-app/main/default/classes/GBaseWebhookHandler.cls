/**
 * GBaseWebhookHandler - REST endpoint for receiving callbacks from GBase API
 * Handles async processing completion notifications
 *
 * @author GBase Team
 * @version 1.0
 */
@RestResource(urlMapping='/gbase/callback')
global with sharing class GBaseWebhookHandler {

    /**
     * Handle POST callback from GBase API
     */
    @HttpPost
    global static void handleCallback() {
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;

        try {
            // Parse request body
            String requestBody = req.requestBody.toString();
            Map<String, Object> payload = (Map<String, Object>) JSON.deserializeUntyped(requestBody);

            String eventType = (String) payload.get('eventType');
            String jobId = (String) payload.get('jobId');
            String status = (String) payload.get('status');
            String meetingId = (String) payload.get('meetingId');

            // Process based on event type
            switch on eventType {
                when 'TRANSCRIPTION_COMPLETE' {
                    handleTranscriptionComplete(meetingId, jobId, payload);
                }
                when 'ANALYSIS_COMPLETE' {
                    handleAnalysisComplete(meetingId, jobId, payload);
                }
                when 'DOCUMENT_COMPLETE' {
                    handleDocumentComplete(meetingId, jobId, payload);
                }
                when 'PROCESSING_FAILED' {
                    handleProcessingFailed(meetingId, jobId, payload);
                }
                when else {
                    System.debug('Unknown event type: ' + eventType);
                }
            }

            // Publish Platform Event
            publishEvent(meetingId, jobId, eventType, status, requestBody);

            res.statusCode = 200;
            res.responseBody = Blob.valueOf('{"success": true}');

        } catch (Exception e) {
            System.debug('Webhook error: ' + e.getMessage());
            res.statusCode = 500;
            res.responseBody = Blob.valueOf('{"error": "' + e.getMessage() + '"}');
        }
    }

    /**
     * Handle transcription completion
     */
    private static void handleTranscriptionComplete(String meetingId, String jobId, Map<String, Object> payload) {
        String transcript = (String) payload.get('transcript');

        GBase_Meeting__c meeting = new GBase_Meeting__c(
            Id = meetingId,
            Status__c = 'Analyzing',
            Transcript__c = transcript
        );
        update meeting;
    }

    /**
     * Handle analysis completion
     */
    private static void handleAnalysisComplete(String meetingId, String jobId, Map<String, Object> payload) {
        Map<String, Object> analysis = (Map<String, Object>) payload.get('analysis');
        String summary = (String) analysis.get('summary');

        GBase_Meeting__c meeting = new GBase_Meeting__c(
            Id = meetingId,
            Status__c = 'Completed',
            Analysis_Result__c = JSON.serialize(analysis),
            Summary__c = summary
        );
        update meeting;
    }

    /**
     * Handle document generation completion
     */
    private static void handleDocumentComplete(String meetingId, String jobId, Map<String, Object> payload) {
        String documentType = (String) payload.get('documentType');
        String documentUrl = (String) payload.get('documentUrl');
        String fileName = (String) payload.get('fileName');

        // Create document record
        GBase_Document__c doc = new GBase_Document__c(
            Meeting__c = meetingId,
            Document_Type__c = documentType,
            Document_URL__c = documentUrl,
            File_Name__c = fileName,
            Generation_Status__c = 'Completed'
        );
        insert doc;
    }

    /**
     * Handle processing failure
     */
    private static void handleProcessingFailed(String meetingId, String jobId, Map<String, Object> payload) {
        String errorMessage = (String) payload.get('error');

        GBase_Meeting__c meeting = new GBase_Meeting__c(
            Id = meetingId,
            Status__c = 'Failed'
        );
        update meeting;

        // Log error for debugging
        System.debug('Processing failed for meeting ' + meetingId + ': ' + errorMessage);
    }

    /**
     * Publish Platform Event for real-time UI updates
     */
    private static void publishEvent(String meetingId, String jobId, String eventType, String status, String payload) {
        GBase_Meeting_Event__e event = new GBase_Meeting_Event__e(
            Meeting_Id__c = meetingId,
            Job_Id__c = jobId,
            Event_Type__c = eventType,
            Status__c = status,
            Payload__c = payload
        );

        Database.SaveResult result = EventBus.publish(event);
        if (!result.isSuccess()) {
            System.debug('Failed to publish event: ' + result.getErrors());
        }
    }
}
