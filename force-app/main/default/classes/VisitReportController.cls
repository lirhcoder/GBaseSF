/**
 * Visit Report Controller
 * Main controller for Visit Report LWC components
 *
 * @author GBase SF Integration
 * @date 2025
 */
public with sharing class VisitReportController {

    /**
     * Analyze input text using AI and return structured data
     * @param inputText Raw text from voice or typed input
     * @return ClaudeAPIService.VisitReportData Structured visit report data
     */
    @AuraEnabled(cacheable=false)
    public static ClaudeAPIService.VisitReportData analyzeInput(String inputText) {
        return ClaudeAPIService.analyzeVisitContent(inputText);
    }

    /**
     * Save or update a Visit Report record
     * @param reportData JSON string containing visit report data
     * @return Id The ID of the created/updated record
     */
    @AuraEnabled
    public static Id saveVisitReport(String reportData) {
        try {
            Map<String, Object> data = (Map<String, Object>) JSON.deserializeUntyped(reportData);

            Visit_Report__c report = new Visit_Report__c();

            // Check if updating existing record
            if (data.containsKey('id') && data.get('id') != null) {
                report.Id = (Id) data.get('id');
            }

            // Set fields
            if (data.containsKey('visitDate') && data.get('visitDate') != null) {
                report.Visit_Date__c = Date.valueOf((String) data.get('visitDate'));
            }

            report.Company_Name__c = (String) data.get('companyName');
            report.Contact_Name__c = (String) data.get('contactName');
            report.Contact_Title__c = (String) data.get('contactTitle');
            report.Visit_Purpose__c = (String) data.get('visitPurpose');

            // Handle discussion summary (convert list to string)
            if (data.containsKey('discussionSummary')) {
                Object summaryObj = data.get('discussionSummary');
                if (summaryObj instanceof List<Object>) {
                    List<Object> summaryList = (List<Object>) summaryObj;
                    List<String> summaryStrings = new List<String>();
                    for (Object item : summaryList) {
                        summaryStrings.add('• ' + String.valueOf(item));
                    }
                    report.Discussion_Summary__c = String.join(summaryStrings, '\n');
                } else if (summaryObj instanceof String) {
                    report.Discussion_Summary__c = (String) summaryObj;
                }
            }

            // Handle opportunity amount
            if (data.containsKey('opportunityAmount') && data.get('opportunityAmount') != null) {
                Object amountObj = data.get('opportunityAmount');
                if (amountObj instanceof Decimal) {
                    report.Opportunity_Amount__c = (Decimal) amountObj;
                } else if (amountObj instanceof Integer) {
                    report.Opportunity_Amount__c = Decimal.valueOf((Integer) amountObj);
                } else if (amountObj instanceof String) {
                    report.Opportunity_Amount__c = Decimal.valueOf((String) amountObj);
                }
            }

            // Handle next actions (convert list to string)
            if (data.containsKey('nextActions')) {
                Object actionsObj = data.get('nextActions');
                if (actionsObj instanceof List<Object>) {
                    List<Object> actionsList = (List<Object>) actionsObj;
                    List<String> actionStrings = new List<String>();
                    for (Object item : actionsList) {
                        actionStrings.add('• ' + String.valueOf(item));
                    }
                    report.Next_Actions__c = String.join(actionStrings, '\n');
                } else if (actionsObj instanceof String) {
                    report.Next_Actions__c = (String) actionsObj;
                }
            }

            // Handle expected close date
            if (data.containsKey('expectedCloseDate') && data.get('expectedCloseDate') != null) {
                String closeDateStr = (String) data.get('expectedCloseDate');
                if (String.isNotBlank(closeDateStr) && closeDateStr != 'null') {
                    report.Expected_Close_Date__c = Date.valueOf(closeDateStr);
                }
            }

            // Store raw input and AI analysis
            report.Raw_Input__c = (String) data.get('rawInput');
            report.AI_Analysis__c = JSON.serialize(data);

            // Try to link to existing Account
            if (String.isNotBlank(report.Company_Name__c)) {
                List<Account> accounts = [
                    SELECT Id FROM Account
                    WHERE Name LIKE :('%' + report.Company_Name__c + '%')
                    LIMIT 1
                ];
                if (!accounts.isEmpty()) {
                    report.Account__c = accounts[0].Id;
                }
            }

            upsert report;
            return report.Id;

        } catch (Exception e) {
            throw new AuraHandledException('Error saving report: ' + e.getMessage());
        }
    }

    /**
     * Get a Visit Report by ID
     * @param recordId The ID of the Visit Report
     * @return Visit_Report__c The Visit Report record
     */
    @AuraEnabled(cacheable=true)
    public static Visit_Report__c getVisitReport(Id recordId) {
        return [
            SELECT Id, Name, Visit_Date__c, Company_Name__c, Contact_Name__c,
                   Contact_Title__c, Visit_Purpose__c, Discussion_Summary__c,
                   Next_Actions__c, Opportunity_Amount__c, Expected_Close_Date__c,
                   Raw_Input__c, AI_Analysis__c, Account__c, Account__r.Name,
                   Contact__c, Contact__r.Name, CreatedDate, LastModifiedDate
            FROM Visit_Report__c
            WHERE Id = :recordId
            LIMIT 1
        ];
    }

    /**
     * Get recent Visit Reports
     * @param limitCount Number of records to return
     * @return List<Visit_Report__c> List of recent Visit Reports
     */
    @AuraEnabled(cacheable=true)
    public static List<Visit_Report__c> getRecentReports(Integer limitCount) {
        if (limitCount == null || limitCount <= 0) {
            limitCount = 10;
        }

        return [
            SELECT Id, Name, Visit_Date__c, Company_Name__c, Contact_Name__c,
                   Visit_Purpose__c, Opportunity_Amount__c, CreatedDate
            FROM Visit_Report__c
            ORDER BY CreatedDate DESC
            LIMIT :limitCount
        ];
    }

    /**
     * Generate PDF content for a Visit Report
     * @param recordId The ID of the Visit Report
     * @return String Base64 encoded PDF content
     */
    @AuraEnabled
    public static String generatePDF(Id recordId) {
        try {
            PageReference pdfPage = Page.VisitReportPDF;
            pdfPage.getParameters().put('id', recordId);

            Blob pdfBlob;
            if (Test.isRunningTest()) {
                pdfBlob = Blob.valueOf('Test PDF Content');
            } else {
                pdfBlob = pdfPage.getContentAsPDF();
            }

            return EncodingUtil.base64Encode(pdfBlob);
        } catch (Exception e) {
            throw new AuraHandledException('Error generating PDF: ' + e.getMessage());
        }
    }

    /**
     * Search for Accounts by name
     * @param searchTerm The search term
     * @return List<Account> Matching accounts
     */
    @AuraEnabled(cacheable=true)
    public static List<Account> searchAccounts(String searchTerm) {
        if (String.isBlank(searchTerm) || searchTerm.length() < 2) {
            return new List<Account>();
        }

        String searchPattern = '%' + searchTerm + '%';
        return [
            SELECT Id, Name, Industry, BillingCity
            FROM Account
            WHERE Name LIKE :searchPattern
            ORDER BY Name
            LIMIT 10
        ];
    }

    /**
     * Search for Contacts by name
     * @param searchTerm The search term
     * @param accountId Optional Account ID to filter contacts
     * @return List<Contact> Matching contacts
     */
    @AuraEnabled(cacheable=true)
    public static List<Contact> searchContacts(String searchTerm, Id accountId) {
        if (String.isBlank(searchTerm) || searchTerm.length() < 2) {
            return new List<Contact>();
        }

        String searchPattern = '%' + searchTerm + '%';

        if (accountId != null) {
            return [
                SELECT Id, Name, Title, Email, AccountId, Account.Name
                FROM Contact
                WHERE (Name LIKE :searchPattern OR Title LIKE :searchPattern)
                AND AccountId = :accountId
                ORDER BY Name
                LIMIT 10
            ];
        } else {
            return [
                SELECT Id, Name, Title, Email, AccountId, Account.Name
                FROM Contact
                WHERE Name LIKE :searchPattern OR Title LIKE :searchPattern
                ORDER BY Name
                LIMIT 10
            ];
        }
    }

    /**
     * Analyze meeting transcript using AI and return comprehensive structured data
     * @param transcriptText Raw transcript text from voice or typed input
     * @param language Language code (ja, zh, en)
     * @return Map<String, Object> Comprehensive meeting analysis data
     */
    @AuraEnabled(cacheable=false)
    public static Map<String, Object> analyzeMeeting(String transcriptText, String language) {
        if (String.isBlank(transcriptText)) {
            throw new AuraHandledException('Transcript text cannot be empty');
        }

        try {
            String prompt = buildMeetingAnalysisPrompt(transcriptText, language);
            ClaudeAPIService.ClaudeResponse response = sendClaudeMessage(prompt);

            if (!response.success) {
                throw new AuraHandledException('AI Analysis failed: ' + response.errorMessage);
            }

            return parseMeetingAnalysisResponse(response.content);
        } catch (AuraHandledException e) {
            throw e;
        } catch (Exception e) {
            throw new AuraHandledException('Meeting analysis failed: ' + e.getMessage());
        }
    }

    /**
     * Build comprehensive meeting analysis prompt
     */
    private static String buildMeetingAnalysisPrompt(String transcriptText, String language) {
        String langPrompt = language == 'zh' ? '请用中文回答。' : (language == 'en' ? 'Please respond in English.' : '日本語で回答してください。');

        return langPrompt + '\n\n' +
               'あなたは営業会議の分析アシスタントです。以下の会議の記録から詳細な構造化情報を抽出してください。\n\n' +
               '会議記録:\n' + transcriptText + '\n\n' +
               '以下の情報をJSON形式で返してください。情報が見つからない場合はnullまたは空の配列を使用してください:\n' +
               '{\n' +
               '  "meetingDate": "会議日 (YYYY-MM-DD形式、見つからない場合は今日の日付)",\n' +
               '  "meetingType": "会議タイプ (visit/call/online/other)",\n' +
               '  "durationMinutes": 会議時間（分、数値）,\n' +
               '  "meetingLocation": "会議場所",\n' +
               '  "companyName": "顧客会社名",\n' +
               '  "companyIndustry": "業界",\n' +
               '  "participants": [{"name": "参加者名", "title": "役職", "role": "role"}],\n' +
               '  "meetingPurpose": "会議目的",\n' +
               '  "keyDiscussionPoints": ["要点1", "要点2"],\n' +
               '  "customerPainPoints": ["課題1", "課題2"],\n' +
               '  "customerRequirements": ["要件1", "要件2"],\n' +
               '  "questionsAsked": ["質問1", "質問2"],\n' +
               '  "opportunity": {"amount": 金額, "stage": "ステージ", "probability": 確率, "expectedCloseDate": "YYYY-MM-DD"},\n' +
               '  "nextActions": [{"action": "アクション内容", "owner": "担当者", "dueDate": "YYYY-MM-DD"}],\n' +
               '  "followUpDate": "次回フォローアップ日 (YYYY-MM-DD)",\n' +
               '  "risks": ["リスク1", "リスク2"],\n' +
               '  "competitors": ["競合1", "競合2"],\n' +
               '  "sentiment": "positive/neutral/negative",\n' +
               '  "engagementScore": エンゲージメントスコア（1-10）,\n' +
               '  "summary": "会議の要約（2-3文）",\n' +
               '  "tags": ["タグ1", "タグ2"]\n' +
               '}\n\n' +
               '重要: JSONのみを返してください。説明や追加のテキストは不要です。';
    }

    /**
     * Send message to Claude API (wrapper method)
     */
    private static ClaudeAPIService.ClaudeResponse sendClaudeMessage(String prompt) {
        ClaudeAPIService.ClaudeResponse result = new ClaudeAPIService.ClaudeResponse();

        try {
            // Get API key from Custom Metadata
            List<Claude_API_Settings__mdt> settings = [
                SELECT API_Key__c FROM Claude_API_Settings__mdt
                WHERE DeveloperName = 'Default' LIMIT 1
            ];

            if (settings.isEmpty() || String.isBlank(settings[0].API_Key__c)) {
                result.success = false;
                result.errorMessage = 'Claude API Key is not configured. Please set up Claude_API_Settings__mdt.';
                return result;
            }

            String apiKey = settings[0].API_Key__c;

            HttpRequest req = new HttpRequest();
            req.setEndpoint('https://api.anthropic.com/v1/messages');
            req.setMethod('POST');
            req.setHeader('Content-Type', 'application/json');
            req.setHeader('x-api-key', apiKey);
            req.setHeader('anthropic-version', '2023-06-01');
            req.setTimeout(120000);

            Map<String, Object> requestBody = new Map<String, Object>{
                'model' => 'claude-3-haiku-20240307',
                'max_tokens' => 4096,
                'messages' => new List<Map<String, String>>{
                    new Map<String, String>{ 'role' => 'user', 'content' => prompt }
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
     * Parse meeting analysis JSON response
     */
    private static Map<String, Object> parseMeetingAnalysisResponse(String jsonResponse) {
        try {
            String cleanJson = jsonResponse;
            if (cleanJson.contains('```json')) {
                cleanJson = cleanJson.substringAfter('```json').substringBefore('```');
            } else if (cleanJson.contains('```')) {
                cleanJson = cleanJson.substringAfter('```').substringBefore('```');
            }
            cleanJson = cleanJson.trim();

            return (Map<String, Object>) JSON.deserializeUntyped(cleanJson);
        } catch (Exception e) {
            throw new AuraHandledException('Failed to parse AI response: ' + e.getMessage());
        }
    }

    /**
     * Save meeting analysis to CRM (creates Visit Report and Tasks)
     * @param analysisData JSON string containing meeting analysis data
     * @return Map<String, Object> Contains visitReportId and taskIds
     */
    @AuraEnabled
    public static Map<String, Object> saveMeetingAnalysis(String analysisData) {
        Map<String, Object> result = new Map<String, Object>();
        List<Id> taskIds = new List<Id>();

        try {
            Map<String, Object> data = (Map<String, Object>) JSON.deserializeUntyped(analysisData);

            // Create Visit Report record
            Visit_Report__c report = new Visit_Report__c();

            // Set date
            String meetingDate = (String) data.get('meetingDate');
            if (String.isNotBlank(meetingDate)) {
                try {
                    report.Visit_Date__c = Date.valueOf(meetingDate);
                } catch (Exception e) {
                    report.Visit_Date__c = Date.today();
                }
            } else {
                report.Visit_Date__c = Date.today();
            }

            // Basic info
            report.Company_Name__c = (String) data.get('companyName');
            report.Visit_Purpose__c = (String) data.get('meetingPurpose');

            // Get first participant as contact
            List<Object> participants = (List<Object>) data.get('participants');
            if (participants != null && !participants.isEmpty()) {
                Map<String, Object> firstParticipant = (Map<String, Object>) participants[0];
                report.Contact_Name__c = (String) firstParticipant.get('name');
                report.Contact_Title__c = (String) firstParticipant.get('title');
            }

            // Build discussion summary from key points
            List<Object> keyPoints = (List<Object>) data.get('keyDiscussionPoints');
            if (keyPoints != null && !keyPoints.isEmpty()) {
                List<String> pointStrings = new List<String>();
                for (Object point : keyPoints) {
                    pointStrings.add('• ' + String.valueOf(point));
                }
                report.Discussion_Summary__c = String.join(pointStrings, '\n');
            }

            // Summary
            report.Summary__c = (String) data.get('summary');

            // Sentiment
            report.Sentiment__c = (String) data.get('sentiment');

            // Risks
            List<Object> risks = (List<Object>) data.get('risks');
            if (risks != null && !risks.isEmpty()) {
                List<String> riskStrings = new List<String>();
                for (Object risk : risks) {
                    riskStrings.add('• ' + String.valueOf(risk));
                }
                report.Risks__c = String.join(riskStrings, '\n');
            }

            // Transcript
            report.Transcript__c = (String) data.get('rawTranscript');

            // Opportunity data
            Map<String, Object> opportunity = (Map<String, Object>) data.get('opportunity');
            if (opportunity != null) {
                Object amountObj = opportunity.get('amount');
                if (amountObj != null) {
                    if (amountObj instanceof Decimal) {
                        report.Opportunity_Amount__c = (Decimal) amountObj;
                    } else if (amountObj instanceof Integer) {
                        report.Opportunity_Amount__c = Decimal.valueOf((Integer) amountObj);
                    }
                }

                String closeDate = (String) opportunity.get('expectedCloseDate');
                if (String.isNotBlank(closeDate)) {
                    try {
                        report.Expected_Close_Date__c = Date.valueOf(closeDate);
                    } catch (Exception e) {
                        // Ignore invalid date
                    }
                }
            }

            // Build next actions string
            List<Object> nextActions = (List<Object>) data.get('nextActions');
            if (nextActions != null && !nextActions.isEmpty()) {
                List<String> actionStrings = new List<String>();
                for (Object action : nextActions) {
                    if (action instanceof Map<String, Object>) {
                        Map<String, Object> actionMap = (Map<String, Object>) action;
                        String actionText = (String) actionMap.get('action');
                        if (String.isNotBlank(actionText)) {
                            actionStrings.add('• ' + actionText);
                        }
                    } else {
                        actionStrings.add('• ' + String.valueOf(action));
                    }
                }
                report.Next_Actions__c = String.join(actionStrings, '\n');
            }

            // Store full AI analysis
            report.AI_Analysis__c = analysisData;

            // Try to link to existing Account
            if (String.isNotBlank(report.Company_Name__c)) {
                List<Account> accounts = [
                    SELECT Id FROM Account
                    WHERE Name LIKE :('%' + report.Company_Name__c + '%')
                    LIMIT 1
                ];
                if (!accounts.isEmpty()) {
                    report.Account__c = accounts[0].Id;
                }
            }

            insert report;
            result.put('visitReportId', report.Id);

            // Create Task records for next actions
            if (nextActions != null && !nextActions.isEmpty()) {
                List<Task> tasks = new List<Task>();
                for (Object action : nextActions) {
                    Task t = new Task();
                    t.WhatId = report.Id;
                    t.OwnerId = UserInfo.getUserId();
                    t.Status = 'Not Started';
                    t.Priority = 'Normal';

                    if (action instanceof Map<String, Object>) {
                        Map<String, Object> actionMap = (Map<String, Object>) action;
                        t.Subject = (String) actionMap.get('action');

                        String dueDate = (String) actionMap.get('dueDate');
                        if (String.isNotBlank(dueDate)) {
                            try {
                                t.ActivityDate = Date.valueOf(dueDate);
                            } catch (Exception e) {
                                t.ActivityDate = Date.today().addDays(7);
                            }
                        } else {
                            t.ActivityDate = Date.today().addDays(7);
                        }
                    } else {
                        t.Subject = String.valueOf(action);
                        t.ActivityDate = Date.today().addDays(7);
                    }

                    if (String.isNotBlank(t.Subject)) {
                        tasks.add(t);
                    }
                }

                if (!tasks.isEmpty()) {
                    insert tasks;
                    for (Task t : tasks) {
                        taskIds.add(t.Id);
                    }
                }
            }

            result.put('taskIds', taskIds);
            return result;

        } catch (Exception e) {
            throw new AuraHandledException('Error saving meeting analysis: ' + e.getMessage());
        }
    }
}