/**
 * Claude API Service Class
 * Handles communication with Anthropic's Claude API for AI text analysis
 *
 * @author GBase SF Integration
 * @date 2025
 */
public with sharing class ClaudeAPIService {

    // API Configuration
    private static final String API_ENDPOINT = 'https://api.anthropic.com/v1/messages';
    private static final String API_VERSION = '2023-06-01';
    private static final String MODEL = 'claude-3-haiku-20240307'; // Cost-effective model for structured extraction

    /**
     * Wrapper class for API response
     */
    public class ClaudeResponse {
        public Boolean success;
        public String content;
        public String errorMessage;
        public Integer tokensUsed;
    }

    /**
     * Wrapper class for parsed visit report data
     */
    public class VisitReportData {
        @AuraEnabled public String visitDate;
        @AuraEnabled public String companyName;
        @AuraEnabled public String contactName;
        @AuraEnabled public String contactTitle;
        @AuraEnabled public String visitPurpose;
        @AuraEnabled public List<String> discussionSummary;
        @AuraEnabled public Decimal opportunityAmount;
        @AuraEnabled public List<String> nextActions;
        @AuraEnabled public String expectedCloseDate;
    }

    /**
     * Analyze visit report content using Claude API
     * @param inputText The raw text input from the user (voice transcription or typed text)
     * @return VisitReportData Structured data extracted from the input
     */
    @AuraEnabled(cacheable=false)
    public static VisitReportData analyzeVisitContent(String inputText) {
        if (String.isBlank(inputText)) {
            throw new AuraHandledException('Input text cannot be empty');
        }

        String prompt = buildAnalysisPrompt(inputText);
        ClaudeResponse response = sendMessage(prompt);

        if (!response.success) {
            throw new AuraHandledException('AI Analysis failed: ' + response.errorMessage);
        }

        return parseAnalysisResponse(response.content);
    }

    /**
     * Build the analysis prompt for Claude
     */
    private static String buildAnalysisPrompt(String inputText) {
        return 'あなたは営業報告書の分析アシスタントです。以下の営業担当者の訪問記録から構造化された情報を抽出してください。\n\n' +
               '入力テキスト:\n' + inputText + '\n\n' +
               '以下の情報をJSON形式で返してください。情報が見つからない場合はnullを使用してください:\n' +
               '{\n' +
               '  "visit_date": "訪問日 (YYYY-MM-DD形式、見つからない場合は今日の日付)",\n' +
               '  "company_name": "顧客会社名",\n' +
               '  "contact_name": "担当者名",\n' +
               '  "contact_title": "担当者役職",\n' +
               '  "visit_purpose": "訪問目的 (簡潔に)",\n' +
               '  "discussion_summary": ["商談内容の要点1", "要点2", "要点3"],\n' +
               '  "opportunity_amount": 商談金額（数値、なければnull）,\n' +
               '  "next_actions": ["次のアクション1", "アクション2"],\n' +
               '  "expected_close_date": "予想成約日 (YYYY-MM-DD形式、なければnull)"\n' +
               '}\n\n' +
               '重要: JSONのみを返してください。説明や追加のテキストは不要です。';
    }

    /**
     * Send message to Claude API
     */
    private static ClaudeResponse sendMessage(String prompt) {
        ClaudeResponse result = new ClaudeResponse();

        try {
            // Get API key from Custom Metadata
            String apiKey = getApiKey();

            if (String.isBlank(apiKey)) {
                result.success = false;
                result.errorMessage = 'Claude API Key is not configured. Please set up Claude_API_Settings__mdt.';
                return result;
            }

            HttpRequest req = new HttpRequest();
            req.setEndpoint(API_ENDPOINT);
            req.setMethod('POST');
            req.setHeader('Content-Type', 'application/json');
            req.setHeader('x-api-key', apiKey);
            req.setHeader('anthropic-version', API_VERSION);
            req.setTimeout(120000); // 2 minutes timeout

            // Build request body
            Map<String, Object> requestBody = new Map<String, Object>{
                'model' => MODEL,
                'max_tokens' => 2048,
                'messages' => new List<Map<String, String>>{
                    new Map<String, String>{
                        'role' => 'user',
                        'content' => prompt
                    }
                }
            };

            req.setBody(JSON.serialize(requestBody));

            Http http = new Http();
            HttpResponse res = http.send(req);

            if (res.getStatusCode() == 200) {
                Map<String, Object> responseMap = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
                List<Object> contentList = (List<Object>) responseMap.get('content');

                if (contentList != null && !contentList.isEmpty()) {
                    Map<String, Object> firstContent = (Map<String, Object>) contentList[0];
                    result.content = (String) firstContent.get('text');
                    result.success = true;

                    // Get token usage
                    Map<String, Object> usage = (Map<String, Object>) responseMap.get('usage');
                    if (usage != null) {
                        result.tokensUsed = (Integer) usage.get('input_tokens') + (Integer) usage.get('output_tokens');
                    }
                }
            } else {
                result.success = false;
                result.errorMessage = 'API Error: ' + res.getStatusCode() + ' - ' + res.getBody();
            }
        } catch (Exception e) {
            result.success = false;
            result.errorMessage = 'Exception: ' + e.getMessage();
        }

        return result;
    }

    /**
     * Parse Claude's JSON response into VisitReportData
     */
    private static VisitReportData parseAnalysisResponse(String jsonResponse) {
        VisitReportData data = new VisitReportData();

        try {
            // Clean up the response - remove any markdown code blocks
            String cleanJson = jsonResponse;
            if (cleanJson.contains('```json')) {
                cleanJson = cleanJson.substringAfter('```json').substringBefore('```');
            } else if (cleanJson.contains('```')) {
                cleanJson = cleanJson.substringAfter('```').substringBefore('```');
            }
            cleanJson = cleanJson.trim();

            Map<String, Object> parsed = (Map<String, Object>) JSON.deserializeUntyped(cleanJson);

            data.visitDate = (String) parsed.get('visit_date');
            data.companyName = (String) parsed.get('company_name');
            data.contactName = (String) parsed.get('contact_name');
            data.contactTitle = (String) parsed.get('contact_title');
            data.visitPurpose = (String) parsed.get('visit_purpose');

            // Handle discussion summary array
            List<Object> summaryList = (List<Object>) parsed.get('discussion_summary');
            if (summaryList != null) {
                data.discussionSummary = new List<String>();
                for (Object item : summaryList) {
                    data.discussionSummary.add(String.valueOf(item));
                }
            }

            // Handle opportunity amount
            Object amountObj = parsed.get('opportunity_amount');
            if (amountObj != null) {
                if (amountObj instanceof Decimal) {
                    data.opportunityAmount = (Decimal) amountObj;
                } else if (amountObj instanceof Integer) {
                    data.opportunityAmount = Decimal.valueOf((Integer) amountObj);
                } else if (amountObj instanceof String) {
                    String amountStr = ((String) amountObj).replaceAll('[^0-9.]', '');
                    if (String.isNotBlank(amountStr)) {
                        data.opportunityAmount = Decimal.valueOf(amountStr);
                    }
                }
            }

            // Handle next actions array
            List<Object> actionsList = (List<Object>) parsed.get('next_actions');
            if (actionsList != null) {
                data.nextActions = new List<String>();
                for (Object item : actionsList) {
                    data.nextActions.add(String.valueOf(item));
                }
            }

            data.expectedCloseDate = (String) parsed.get('expected_close_date');

        } catch (Exception e) {
            throw new AuraHandledException('Failed to parse AI response: ' + e.getMessage() + '. Raw response: ' + jsonResponse);
        }

        return data;
    }

    /**
     * Get API key from Custom Metadata
     */
    private static String getApiKey() {
        try {
            List<Claude_API_Settings__mdt> settings = [
                SELECT API_Key__c
                FROM Claude_API_Settings__mdt
                WHERE DeveloperName = 'Default'
                LIMIT 1
            ];

            if (!settings.isEmpty() && String.isNotBlank(settings[0].API_Key__c)) {
                return settings[0].API_Key__c;
            }
        } catch (Exception e) {
            System.debug('Error retrieving API key: ' + e.getMessage());
        }

        // Fallback: Try to get from a Named Credential or return empty
        return '';
    }
}