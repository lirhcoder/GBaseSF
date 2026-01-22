/**
 * @description Test class for GBaseAPIController
 */
@isTest
private class GBaseAPIControllerTest {

    /**
     * @description Mock HTTP response class
     */
    private class MockHttpResponse implements HttpCalloutMock {
        private Integer statusCode;
        private String body;

        public MockHttpResponse(Integer statusCode, String body) {
            this.statusCode = statusCode;
            this.body = body;
        }

        public HttpResponse respond(HttpRequest req) {
            HttpResponse res = new HttpResponse();
            res.setStatusCode(this.statusCode);
            res.setBody(this.body);
            res.setHeader('Content-Type', 'application/json');
            return res;
        }
    }

    /**
     * @description Test successful chat request
     */
    @isTest
    static void testAskQuestionSuccess() {
        // Mock response
        String mockResponse = '{"answer":"This is a test answer","sources":[{"title":"Test Source","id":"kb-001","relevance":0.95}],"suggestedQuestions":["Question 1","Question 2"]}';
        Test.setMock(HttpCalloutMock.class, new MockHttpResponse(200, mockResponse));

        Test.startTest();
        String result = GBaseAPIController.askQuestion('What is GBase?', 'en', 'test-session', null);
        Test.stopTest();

        // Verify result
        System.assertNotEquals(null, result, 'Result should not be null');
        Map<String, Object> parsed = (Map<String, Object>) JSON.deserializeUntyped(result);
        System.assertEquals('This is a test answer', parsed.get('answer'), 'Answer should match');
    }

    /**
     * @description Test chat request with empty question
     */
    @isTest
    static void testAskQuestionEmptyQuestion() {
        Test.startTest();
        try {
            GBaseAPIController.askQuestion('', 'en', 'test-session', null);
            System.assert(false, 'Should have thrown exception');
        } catch (AuraHandledException e) {
            System.assertEquals('Question cannot be empty', e.getMessage(), 'Error message should match');
        }
        Test.stopTest();
    }

    /**
     * @description Test search knowledge
     */
    @isTest
    static void testSearchKnowledgeSuccess() {
        String mockResponse = '{"query":"pricing","results":[{"id":"kb-002","title":"Pricing Plans","relevance":0.9}],"total":1}';
        Test.setMock(HttpCalloutMock.class, new MockHttpResponse(200, mockResponse));

        Test.startTest();
        String result = GBaseAPIController.searchKnowledge('pricing', 'en');
        Test.stopTest();

        System.assertNotEquals(null, result, 'Result should not be null');
        Map<String, Object> parsed = (Map<String, Object>) JSON.deserializeUntyped(result);
        System.assertEquals('pricing', parsed.get('query'), 'Query should match');
    }

    /**
     * @description Test FAQ list
     */
    @isTest
    static void testGetFAQListSuccess() {
        String mockResponse = '{"faqs":[{"id":"faq-001","question":"What is GBase?","answer":"GBase is..."}],"total":1}';
        Test.setMock(HttpCalloutMock.class, new MockHttpResponse(200, mockResponse));

        Test.startTest();
        String result = GBaseAPIController.getFAQList('en', null);
        Test.stopTest();

        System.assertNotEquals(null, result, 'Result should not be null');
    }

    /**
     * @description Test get supported languages
     */
    @isTest
    static void testGetSupportedLanguages() {
        String mockResponse = '{"languages":[{"code":"en","name":"English"},{"code":"zh","name":"中文"}]}';
        Test.setMock(HttpCalloutMock.class, new MockHttpResponse(200, mockResponse));

        Test.startTest();
        String result = GBaseAPIController.getSupportedLanguages();
        Test.stopTest();

        System.assertNotEquals(null, result, 'Result should not be null');
    }

    /**
     * @description Test API health check - success
     */
    @isTest
    static void testCheckAPIHealthSuccess() {
        String mockResponse = '{"status":"ok"}';
        Test.setMock(HttpCalloutMock.class, new MockHttpResponse(200, mockResponse));

        Test.startTest();
        Boolean result = GBaseAPIController.checkAPIHealth();
        Test.stopTest();

        System.assertEquals(true, result, 'Health check should return true');
    }

    /**
     * @description Test API health check - failure
     */
    @isTest
    static void testCheckAPIHealthFailure() {
        Test.setMock(HttpCalloutMock.class, new MockHttpResponse(500, 'Server Error'));

        Test.startTest();
        Boolean result = GBaseAPIController.checkAPIHealth();
        Test.stopTest();

        System.assertEquals(false, result, 'Health check should return false on error');
    }

    /**
     * @description Test API error handling
     */
    @isTest
    static void testAPIErrorHandling() {
        Test.setMock(HttpCalloutMock.class, new MockHttpResponse(500, 'Internal Server Error'));

        Test.startTest();
        try {
            GBaseAPIController.askQuestion('test question', 'en', 'test-session', null);
            System.assert(false, 'Should have thrown exception');
        } catch (AuraHandledException e) {
            System.assert(e.getMessage().contains('API Error'), 'Should contain API Error message');
        }
        Test.stopTest();
    }
}