/**
 * Test class for GBaseWebhookHandler
 */
@isTest
private class GBaseWebhookHandlerTest {

    @TestSetup
    static void setupTestData() {
        Account acc = new Account(Name = 'Test Account');
        insert acc;

        GBase_Meeting__c meeting = new GBase_Meeting__c(
            Meeting_Title__c = 'Test Meeting',
            Meeting_Date__c = DateTime.now(),
            Account__c = acc.Id,
            Status__c = 'Transcribing',
            GBase_Job_Id__c = 'job_123'
        );
        insert meeting;
    }

    @isTest
    static void testTranscriptionComplete() {
        GBase_Meeting__c meeting = [SELECT Id FROM GBase_Meeting__c LIMIT 1];

        Map<String, Object> payload = new Map<String, Object>{
            'eventType' => 'TRANSCRIPTION_COMPLETE',
            'jobId' => 'job_123',
            'meetingId' => meeting.Id,
            'status' => 'success',
            'transcript' => 'This is the transcribed text from the meeting.'
        };

        RestRequest req = new RestRequest();
        req.requestBody = Blob.valueOf(JSON.serialize(payload));
        req.httpMethod = 'POST';
        RestContext.request = req;
        RestContext.response = new RestResponse();

        Test.startTest();
        GBaseWebhookHandler.handleCallback();
        Test.stopTest();

        // Verify meeting was updated
        meeting = [SELECT Status__c, Transcript__c FROM GBase_Meeting__c WHERE Id = :meeting.Id];
        System.assertEquals('Analyzing', meeting.Status__c, 'Status should be Analyzing');
        System.assert(meeting.Transcript__c.contains('transcribed text'), 'Transcript should be saved');
    }

    @isTest
    static void testAnalysisComplete() {
        GBase_Meeting__c meeting = [SELECT Id FROM GBase_Meeting__c LIMIT 1];

        Map<String, Object> analysis = new Map<String, Object>{
            'summary' => 'Meeting summary here',
            'painPoints' => new List<String>{'Pain 1', 'Pain 2'}
        };

        Map<String, Object> payload = new Map<String, Object>{
            'eventType' => 'ANALYSIS_COMPLETE',
            'jobId' => 'job_123',
            'meetingId' => meeting.Id,
            'status' => 'success',
            'analysis' => analysis
        };

        RestRequest req = new RestRequest();
        req.requestBody = Blob.valueOf(JSON.serialize(payload));
        req.httpMethod = 'POST';
        RestContext.request = req;
        RestContext.response = new RestResponse();

        Test.startTest();
        GBaseWebhookHandler.handleCallback();
        Test.stopTest();

        meeting = [SELECT Status__c, Summary__c, Analysis_Result__c FROM GBase_Meeting__c WHERE Id = :meeting.Id];
        System.assertEquals('Completed', meeting.Status__c, 'Status should be Completed');
        System.assertEquals('Meeting summary here', meeting.Summary__c, 'Summary should be saved');
    }

    @isTest
    static void testDocumentComplete() {
        GBase_Meeting__c meeting = [SELECT Id FROM GBase_Meeting__c LIMIT 1];

        Map<String, Object> payload = new Map<String, Object>{
            'eventType' => 'DOCUMENT_COMPLETE',
            'jobId' => 'doc_456',
            'meetingId' => meeting.Id,
            'status' => 'success',
            'documentType' => 'Proposal',
            'documentUrl' => 'https://storage.gbase.ai/docs/proposal.docx',
            'fileName' => 'Proposal_2026.docx'
        };

        RestRequest req = new RestRequest();
        req.requestBody = Blob.valueOf(JSON.serialize(payload));
        req.httpMethod = 'POST';
        RestContext.request = req;
        RestContext.response = new RestResponse();

        Test.startTest();
        GBaseWebhookHandler.handleCallback();
        Test.stopTest();

        List<GBase_Document__c> docs = [SELECT Document_Type__c, Document_URL__c FROM GBase_Document__c WHERE Meeting__c = :meeting.Id];
        System.assertEquals(1, docs.size(), 'Should have one document');
        System.assertEquals('Proposal', docs[0].Document_Type__c, 'Document type should match');
    }

    @isTest
    static void testProcessingFailed() {
        GBase_Meeting__c meeting = [SELECT Id FROM GBase_Meeting__c LIMIT 1];

        Map<String, Object> payload = new Map<String, Object>{
            'eventType' => 'PROCESSING_FAILED',
            'jobId' => 'job_123',
            'meetingId' => meeting.Id,
            'status' => 'failed',
            'error' => 'Audio file corrupted'
        };

        RestRequest req = new RestRequest();
        req.requestBody = Blob.valueOf(JSON.serialize(payload));
        req.httpMethod = 'POST';
        RestContext.request = req;
        RestContext.response = new RestResponse();

        Test.startTest();
        GBaseWebhookHandler.handleCallback();
        Test.stopTest();

        meeting = [SELECT Status__c FROM GBase_Meeting__c WHERE Id = :meeting.Id];
        System.assertEquals('Failed', meeting.Status__c, 'Status should be Failed');
    }
}
