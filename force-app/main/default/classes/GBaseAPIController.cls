/**
 * @description Apex Controller for GBase Support API Integration
 * @author GBase Integration Team
 * @date 2025
 */
public with sharing class GBaseAPIController {

    // API Endpoint - Update this to your Mock API URL
    // For local development: http://localhost:3000
    // For Heroku: https://your-app.herokuapp.com
    private static final String API_ENDPOINT = 'https://610056c56b21.ngrok-free.app';

    // Timeout settings (in milliseconds)
    private static final Integer TIMEOUT = 30000;

    /**
     * @description Send a question to GBase Support API and get AI-generated answer
     * @param question The user's question
     * @param language Language code (zh, en, ja)
     * @param sessionId Session identifier for conversation tracking
     * @param recordId Salesforce record ID (optional)
     * @return JSON string containing the API response
     */
    @AuraEnabled
    public static String askQuestion(String question, String language, String sessionId, String recordId) {
        try {
            // Validate input
            if (String.isBlank(question)) {
                throw new AuraHandledException('Question cannot be empty');
            }

            // Build request body
            Map<String, Object> requestBody = new Map<String, Object>{
                'question' => question,
                'language' => String.isBlank(language) ? 'zh' : language,
                'sessionId' => String.isBlank(sessionId) ? generateSessionId() : sessionId
            };

            // Add Salesforce context if available
            if (String.isNotBlank(recordId)) {
                requestBody.put('sfRecordId', recordId);
                requestBody.put('sfUserName', UserInfo.getName());
            }

            // Make HTTP request
            HttpRequest req = new HttpRequest();
            req.setEndpoint(API_ENDPOINT + '/api/chat');
            req.setMethod('POST');
            req.setHeader('Content-Type', 'application/json');
            req.setHeader('Accept', 'application/json');
            req.setTimeout(TIMEOUT);
            req.setBody(JSON.serialize(requestBody));

            Http http = new Http();
            HttpResponse res = http.send(req);

            // Handle response
            if (res.getStatusCode() == 200) {
                return res.getBody();
            } else {
                String errorMsg = 'API Error: ' + res.getStatusCode() + ' - ' + res.getStatus();
                System.debug(LoggingLevel.ERROR, errorMsg);
                System.debug(LoggingLevel.ERROR, 'Response Body: ' + res.getBody());
                throw new AuraHandledException(errorMsg);
            }

        } catch (CalloutException e) {
            String errorMsg = 'Connection Error: ' + e.getMessage();
            System.debug(LoggingLevel.ERROR, errorMsg);
            throw new AuraHandledException(errorMsg);
        } catch (Exception e) {
            System.debug(LoggingLevel.ERROR, 'Unexpected Error: ' + e.getMessage());
            throw new AuraHandledException(e.getMessage());
        }
    }

    /**
     * @description Search the GBase knowledge base
     * @param query Search query string
     * @param language Language code (zh, en, ja)
     * @return JSON string containing search results
     */
    @AuraEnabled
    public static String searchKnowledge(String query, String language) {
        try {
            if (String.isBlank(query)) {
                throw new AuraHandledException('Search query cannot be empty');
            }

            // Build URL with query parameters
            String encodedQuery = EncodingUtil.urlEncode(query, 'UTF-8');
            String encodedLanguage = EncodingUtil.urlEncode(
                String.isBlank(language) ? 'zh' : language,
                'UTF-8'
            );
            String endpoint = API_ENDPOINT + '/api/knowledge/search?q=' + encodedQuery + '&language=' + encodedLanguage;

            // Make HTTP request
            HttpRequest req = new HttpRequest();
            req.setEndpoint(endpoint);
            req.setMethod('GET');
            req.setHeader('Accept', 'application/json');
            req.setTimeout(TIMEOUT);

            Http http = new Http();
            HttpResponse res = http.send(req);

            if (res.getStatusCode() == 200) {
                return res.getBody();
            } else {
                throw new AuraHandledException('Search Error: ' + res.getStatusCode());
            }

        } catch (CalloutException e) {
            throw new AuraHandledException('Connection Error: ' + e.getMessage());
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    /**
     * @description Get FAQ list from GBase
     * @param language Language code
     * @param category Optional category filter
     * @return JSON string containing FAQ list
     */
    @AuraEnabled
    public static String getFAQList(String language, String category) {
        try {
            String endpoint = API_ENDPOINT + '/api/faq?language=' +
                EncodingUtil.urlEncode(String.isBlank(language) ? 'zh' : language, 'UTF-8');

            if (String.isNotBlank(category)) {
                endpoint += '&category=' + EncodingUtil.urlEncode(category, 'UTF-8');
            }

            HttpRequest req = new HttpRequest();
            req.setEndpoint(endpoint);
            req.setMethod('GET');
            req.setHeader('Accept', 'application/json');
            req.setTimeout(TIMEOUT);

            Http http = new Http();
            HttpResponse res = http.send(req);

            if (res.getStatusCode() == 200) {
                return res.getBody();
            } else {
                throw new AuraHandledException('FAQ Error: ' + res.getStatusCode());
            }

        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    /**
     * @description Get list of supported languages
     * @return JSON string containing language options
     */
    @AuraEnabled(cacheable=true)
    public static String getSupportedLanguages() {
        try {
            HttpRequest req = new HttpRequest();
            req.setEndpoint(API_ENDPOINT + '/api/languages');
            req.setMethod('GET');
            req.setHeader('Accept', 'application/json');
            req.setTimeout(TIMEOUT);

            Http http = new Http();
            HttpResponse res = http.send(req);

            if (res.getStatusCode() == 200) {
                return res.getBody();
            } else {
                throw new AuraHandledException('Languages Error: ' + res.getStatusCode());
            }

        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    /**
     * @description Check API health status
     * @return Boolean indicating if API is available
     */
    @AuraEnabled
    public static Boolean checkAPIHealth() {
        try {
            HttpRequest req = new HttpRequest();
            req.setEndpoint(API_ENDPOINT + '/api/health');
            req.setMethod('GET');
            req.setTimeout(5000); // 5 second timeout for health check

            Http http = new Http();
            HttpResponse res = http.send(req);

            return res.getStatusCode() == 200;

        } catch (Exception e) {
            System.debug(LoggingLevel.WARN, 'API Health Check Failed: ' + e.getMessage());
            return false;
        }
    }

    /**
     * @description Generate a unique session ID
     * @return String session ID
     */
    private static String generateSessionId() {
        return 'sf-' + UserInfo.getUserId() + '-' + System.currentTimeMillis();
    }
}