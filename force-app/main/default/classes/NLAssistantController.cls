/**
 * NLAssistantController - 自然语言助手控制器
 * MVP版本：支持自然语言查询 Account, Opportunity, Contact
 */
public with sharing class NLAssistantController {

    /**
     * 处理用户的自然语言输入
     * @param userInput 用户输入的自然语言
     * @return QueryResult 查询结果
     */
    @AuraEnabled
    public static QueryResult processNaturalLanguage(String userInput) {
        QueryResult result = new QueryResult();

        try {
            // 1. 获取Schema信息
            String schemaInfo = getSchemaInfo();

            // 2. 调用Claude API生成SOQL
            String soqlQuery = ClaudeService.generateSOQL(userInput, schemaInfo);

            // 3. 验证SOQL安全性
            if (!isQuerySafe(soqlQuery)) {
                result.success = false;
                result.errorMessage = '生成的查询不安全，请重新描述您的需求';
                return result;
            }

            // 4. 执行查询
            result = executeQuery(soqlQuery);
            result.generatedQuery = soqlQuery;

        } catch (Exception e) {
            result.success = false;
            result.errorMessage = '处理失败: ' + e.getMessage();
        }

        return result;
    }

    /**
     * 获取支持的对象Schema信息
     */
    private static String getSchemaInfo() {
        Map<String, Object> schema = new Map<String, Object>();

        // Account Schema
        schema.put('Account', new Map<String, Object>{
            'label' => '客户/公司',
            'fields' => new Map<String, String>{
                'Id' => 'ID',
                'Name' => '客户名称',
                'Phone' => '电话',
                'Industry' => '行业',
                'BillingCity' => '城市',
                'BillingCountry' => '国家',
                'AnnualRevenue' => '年收入',
                'NumberOfEmployees' => '员工数',
                'CreatedDate' => '创建日期',
                'OwnerId' => '所有者ID'
            }
        });

        // Opportunity Schema
        schema.put('Opportunity', new Map<String, Object>{
            'label' => '商机',
            'fields' => new Map<String, String>{
                'Id' => 'ID',
                'Name' => '商机名称',
                'Amount' => '金额',
                'StageName' => '阶段',
                'CloseDate' => '预计成交日期',
                'Probability' => '成功率',
                'AccountId' => '关联客户ID',
                'CreatedDate' => '创建日期',
                'OwnerId' => '所有者ID'
            }
        });

        // Contact Schema
        schema.put('Contact', new Map<String, Object>{
            'label' => '联系人',
            'fields' => new Map<String, String>{
                'Id' => 'ID',
                'FirstName' => '名',
                'LastName' => '姓',
                'Name' => '姓名',
                'Email' => '邮箱',
                'Phone' => '电话',
                'Title' => '职位',
                'AccountId' => '关联客户ID',
                'CreatedDate' => '创建日期'
            }
        });

        return JSON.serialize(schema);
    }

    /**
     * 验证SOQL查询安全性
     */
    private static Boolean isQuerySafe(String soqlQuery) {
        if (String.isBlank(soqlQuery)) {
            return false;
        }

        String upperQuery = soqlQuery.toUpperCase().trim();

        // 只允许SELECT语句
        if (!upperQuery.startsWith('SELECT')) {
            return false;
        }

        // 禁止危险操作
        List<String> forbidden = new List<String>{
            'INSERT', 'UPDATE', 'DELETE', 'UPSERT', 'MERGE'
        };

        for (String keyword : forbidden) {
            if (upperQuery.contains(keyword)) {
                return false;
            }
        }

        // 只允许查询指定对象
        List<String> allowedObjects = new List<String>{
            'ACCOUNT', 'OPPORTUNITY', 'CONTACT'
        };

        Boolean hasAllowedObject = false;
        for (String obj : allowedObjects) {
            if (upperQuery.contains('FROM ' + obj)) {
                hasAllowedObject = true;
                break;
            }
        }

        return hasAllowedObject;
    }

    /**
     * 执行SOQL查询
     */
    private static QueryResult executeQuery(String soqlQuery) {
        QueryResult result = new QueryResult();

        try {
            List<SObject> records = Database.query(soqlQuery);

            result.success = true;
            result.recordCount = records.size();
            result.records = new List<Map<String, Object>>();

            // 转换为Map便于前端展示
            for (SObject record : records) {
                Map<String, Object> recordMap = new Map<String, Object>();
                Map<String, Object> fieldsMap = record.getPopulatedFieldsAsMap();

                for (String field : fieldsMap.keySet()) {
                    recordMap.put(field, fieldsMap.get(field));
                }

                result.records.add(recordMap);
            }

            // 提取字段名用于表头
            if (!records.isEmpty()) {
                result.fieldNames = new List<String>(records[0].getPopulatedFieldsAsMap().keySet());
            }

        } catch (Exception e) {
            result.success = false;
            result.errorMessage = '查询执行失败: ' + e.getMessage();
        }

        return result;
    }

    /**
     * 查询结果封装类
     */
    public class QueryResult {
        @AuraEnabled public Boolean success { get; set; }
        @AuraEnabled public String errorMessage { get; set; }
        @AuraEnabled public String generatedQuery { get; set; }
        @AuraEnabled public Integer recordCount { get; set; }
        @AuraEnabled public List<String> fieldNames { get; set; }
        @AuraEnabled public List<Map<String, Object>> records { get; set; }

        public QueryResult() {
            this.success = false;
            this.records = new List<Map<String, Object>>();
            this.fieldNames = new List<String>();
        }
    }
}