/**
 * Test class for GBaseApiService
 */
@isTest
private class GBaseApiServiceTest {

    @TestSetup
    static void setupTestData() {
        // Create test account
        Account acc = new Account(Name = 'Test Account');
        insert acc;

        // Create test meeting
        GBase_Meeting__c meeting = new GBase_Meeting__c(
            Meeting_Title__c = 'Test Meeting',
            Meeting_Date__c = DateTime.now(),
            Account__c = acc.Id,
            Status__c = 'Pending'
        );
        insert meeting;
    }

    @isTest
    static void testTriggerMeetingAnalysis_Success() {
        // Setup mock
        Test.setMock(HttpCalloutMock.class, new GBaseApiMock(200, '{"jobId": "job_123"}'));

        GBase_Meeting__c meeting = [SELECT Id FROM GBase_Meeting__c LIMIT 1];

        Test.startTest();
        String jobId = GBaseApiService.triggerMeetingAnalysis(meeting.Id, 'https://example.com/audio.mp3');
        Test.stopTest();

        System.assertEquals('job_123', jobId, 'Job ID should match');

        // Verify meeting was updated
        meeting = [SELECT GBase_Job_Id__c, Status__c FROM GBase_Meeting__c WHERE Id = :meeting.Id];
        System.assertEquals('job_123', meeting.GBase_Job_Id__c, 'Meeting should have job ID');
        System.assertEquals('Transcribing', meeting.Status__c, 'Status should be Transcribing');
    }

    @isTest
    static void testTriggerMeetingAnalysis_Failure() {
        // Setup mock for failure
        Test.setMock(HttpCalloutMock.class, new GBaseApiMock(500, '{"error": "Server error"}'));

        GBase_Meeting__c meeting = [SELECT Id FROM GBase_Meeting__c LIMIT 1];

        Test.startTest();
        try {
            GBaseApiService.triggerMeetingAnalysis(meeting.Id, 'https://example.com/audio.mp3');
            System.assert(false, 'Should have thrown exception');
        } catch (AuraHandledException e) {
            System.assert(e.getMessage().contains('Failed to trigger analysis'), 'Should contain error message');
        }
        Test.stopTest();

        // Verify meeting status is Failed
        meeting = [SELECT Status__c FROM GBase_Meeting__c WHERE Id = :meeting.Id];
        System.assertEquals('Failed', meeting.Status__c, 'Status should be Failed');
    }

    @isTest
    static void testGetMeetingAnalysis_Success() {
        Test.setMock(HttpCalloutMock.class, new GBaseApiMock(200, '{"summary": "Test summary", "painPoints": ["Pain 1"]}'));

        Test.startTest();
        Map<String, Object> result = GBaseApiService.getMeetingAnalysis('job_123');
        Test.stopTest();

        System.assertEquals('Test summary', result.get('summary'), 'Summary should match');
    }

    @isTest
    static void testGenerateProposal_Success() {
        Test.setMock(HttpCalloutMock.class, new GBaseApiMock(202, '{"jobId": "doc_456"}'));

        GBase_Meeting__c meeting = [SELECT Id FROM GBase_Meeting__c LIMIT 1];

        Test.startTest();
        String jobId = GBaseApiService.generateProposal(meeting.Id);
        Test.stopTest();

        System.assertEquals('doc_456', jobId, 'Document job ID should match');
    }

    @isTest
    static void testGeneratePpt_Success() {
        Test.setMock(HttpCalloutMock.class, new GBaseApiMock(202, '{"jobId": "ppt_789"}'));

        GBase_Meeting__c meeting = [SELECT Id FROM GBase_Meeting__c LIMIT 1];

        Test.startTest();
        String jobId = GBaseApiService.generatePpt(meeting.Id);
        Test.stopTest();

        System.assertEquals('ppt_789', jobId, 'PPT job ID should match');
    }

    /**
     * Mock class for HTTP callouts
     */
    private class GBaseApiMock implements HttpCalloutMock {
        private Integer statusCode;
        private String responseBody;

        public GBaseApiMock(Integer statusCode, String responseBody) {
            this.statusCode = statusCode;
            this.responseBody = responseBody;
        }

        public HttpResponse respond(HttpRequest req) {
            HttpResponse res = new HttpResponse();
            res.setStatusCode(statusCode);
            res.setBody(responseBody);
            res.setHeader('Content-Type', 'application/json');
            return res;
        }
    }
}