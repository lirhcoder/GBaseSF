/**
 * ClaudeService - Claude API 服务类
 * 负责调用Claude API生成SOQL查询
 */
public with sharing class ClaudeService {

    private static final String CLAUDE_API_ENDPOINT = 'https://api.anthropic.com/v1/messages';
    private static final String CLAUDE_MODEL = 'claude-3-5-sonnet-20241022';

    /**
     * 调用Claude API生成SOQL
     * @param userInput 用户输入
     * @param schemaInfo Schema信息JSON
     * @return 生成的SOQL查询
     */
    public static String generateSOQL(String userInput, String schemaInfo) {
        String apiKey = getApiKey();

        if (String.isBlank(apiKey)) {
            throw new ClaudeServiceException('Claude API Key未配置，请在Custom Metadata中配置AI_Config');
        }

        String prompt = buildPrompt(userInput, schemaInfo);
        String response = callClaudeAPI(apiKey, prompt);

        return extractSOQL(response);
    }

    /**
     * 构建提示词
     */
    private static String buildPrompt(String userInput, String schemaInfo) {
        return '你是一个Salesforce SOQL专家。根据用户的自然语言描述生成SOQL查询。\n\n' +
               '## 可用的对象和字段Schema:\n' +
               schemaInfo + '\n\n' +
               '## 规则:\n' +
               '1. 只生成SELECT查询，禁止任何DML操作\n' +
               '2. 只能查询Schema中定义的对象和字段\n' +
               '3. 查询结果限制最多100条 (LIMIT 100)\n' +
               '4. 如果用户提到"客户"或"公司"，对应Account对象\n' +
               '5. 如果用户提到"商机"，对应Opportunity对象\n' +
               '6. 如果用户提到"联系人"，对应Contact对象\n' +
               '7. 日期处理：\n' +
               '   - "本月" = THIS_MONTH\n' +
               '   - "上月" = LAST_MONTH\n' +
               '   - "今年" = THIS_YEAR\n' +
               '   - "最近N天" = LAST_N_DAYS:N\n' +
               '8. 金额单位默认为人民币，用户说"10万"表示100000\n\n' +
               '## 用户输入:\n' +
               userInput + '\n\n' +
               '## 输出格式:\n' +
               '只输出SOQL查询语句，不要任何解释或markdown格式。如果无法生成有效查询，输出: ERROR: 原因';
    }

    /**
     * 调用Claude API
     */
    private static String callClaudeAPI(String apiKey, String prompt) {
        HttpRequest req = new HttpRequest();
        req.setEndpoint(CLAUDE_API_ENDPOINT);
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/json');
        req.setHeader('x-api-key', apiKey);
        req.setHeader('anthropic-version', '2023-06-01');
        req.setTimeout(30000);

        Map<String, Object> requestBody = new Map<String, Object>{
            'model' => CLAUDE_MODEL,
            'max_tokens' => 500,
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

        if (res.getStatusCode() != 200) {
            throw new ClaudeServiceException('Claude API调用失败: ' + res.getStatusCode() + ' - ' + res.getBody());
        }

        return res.getBody();
    }

    /**
     * 从API响应中提取SOQL
     */
    private static String extractSOQL(String response) {
        Map<String, Object> responseMap = (Map<String, Object>) JSON.deserializeUntyped(response);
        List<Object> content = (List<Object>) responseMap.get('content');

        if (content == null || content.isEmpty()) {
            throw new ClaudeServiceException('Claude API返回内容为空');
        }

        Map<String, Object> firstContent = (Map<String, Object>) content[0];
        String text = (String) firstContent.get('text');

        if (String.isBlank(text)) {
            throw new ClaudeServiceException('无法从响应中提取查询');
        }

        text = text.trim();

        // 检查是否返回错误
        if (text.startsWith('ERROR:')) {
            throw new ClaudeServiceException(text);
        }

        // 清理可能的markdown格式
        text = text.replace('```sql', '').replace('```soql', '').replace('```', '').trim();

        return text;
    }

    /**
     * 获取API Key (从Custom Metadata)
     */
    private static String getApiKey() {
        // 优先从Custom Metadata获取
        try {
            List<AI_Config__mdt> configs = [
                SELECT API_Key__c
                FROM AI_Config__mdt
                WHERE DeveloperName = 'Claude_API'
                LIMIT 1
            ];

            if (!configs.isEmpty() && String.isNotBlank(configs[0].API_Key__c)) {
                return configs[0].API_Key__c;
            }
        } catch (Exception e) {
            System.debug('无法从Custom Metadata获取API Key: ' + e.getMessage());
        }

        // 备用：从Named Credential获取（如果配置了的话）
        // 这里返回空，让调用方处理
        return null;
    }

    /**
     * 自定义异常类
     */
    public class ClaudeServiceException extends Exception {}
}