# Industry Cloud Accelerator 技术设计方案

> **版本**: 1.0
> **日期**: 2026-01-10
> **评分**: 8.2/10 (Priority #2)
> **状态**: 技术设计

---

## 一、产品概述

### 定位
**"制造业/零售业 Salesforce 的 AI 知识助手"**

### 市场验证
| 数据点 | 数值 | 意义 |
|--------|------|------|
| 行业云新客户占比 | 60% | Salesforce 增长引擎 |
| Financial Services Cloud 留存提升 | 20% | ROI 可量化 |
| Manufacturing Cloud 需求预测提升 | 18% | 行业价值验证 |
| 垂直 ISV 融资 | nCino $44M+ | 商业模式验证 |

### 目标行业 (Phase 1)
**制造业** - 供应链知识密集、GBase 可差异化

---

## 二、系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                    Industry Cloud Accelerator                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   User Interface Layer                     │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐ │   │
│  │  │ LWC Widget  │ │ Slack Bot   │ │ Mobile Lightning   │ │   │
│  │  └─────────────┘ └─────────────┘ └─────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   Query Processing Layer                   │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐ │   │
│  │  │ Intent      │ │ Context     │ │ Industry Term       │ │   │
│  │  │ Classifier  │ │ Extractor   │ │ Resolver            │ │   │
│  │  └─────────────┘ └─────────────┘ └─────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   RAG Engine Layer                         │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐ │   │
│  │  │ Industry    │ │ Hybrid      │ │ Citation            │ │   │
│  │  │ Embeddings  │ │ Retrieval   │ │ Generator           │ │   │
│  │  └─────────────┘ └─────────────┘ └─────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   Knowledge Layer                          │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌────────────────┐   │   │
│  │  │ Product      │ │ Compliance   │ │ Supplier        │   │   │
│  │  │ Knowledge    │ │ Documents    │ │ Database        │   │   │
│  │  └──────────────┘ └──────────────┘ └────────────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Salesforce Integration Layer                  │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌────────────────┐   │   │
│  │  │ Manufacturing│ │ Account/     │ │ Case/Service   │   │   │
│  │  │ Cloud API    │ │ Product API  │ │ Cloud API      │   │   │
│  │  └──────────────┘ └──────────────┘ └────────────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 三、Salesforce Manufacturing Cloud API 集成

### 3.1 核心对象模型

```
Manufacturing Cloud Objects:
├── Account                    # 标准 Account + 制造业扩展
├── SalesAgreement             # 销售协议
├── SalesAgreementProduct      # 协议产品明细
├── AccountForecast            # 客户预测
├── AccountProductForecast     # 产品级预测
├── AccountProductPeriodForecast  # 期间预测
├── VisitExecution             # 现场访问
├── Rebate                     # 返利管理
└── AdvancedAccountForecast    # 高级预测 (Spring '26)
```

### 3.2 关键 API 端点

```python
# Manufacturing Cloud REST API Endpoints

class ManufacturingCloudClient:
    """Manufacturing Cloud API 客户端"""

    def __init__(self, access_token: str, instance_url: str):
        self.access_token = access_token
        self.instance_url = instance_url
        self.base_url = f"{instance_url}/services/data/v66.0"
        self.headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }

    # 销售协议查询
    def get_sales_agreements(self, account_id: str) -> dict:
        """获取客户的销售协议"""
        query = f"""
            SELECT Id, Name, Account.Name, Status, StartDate, EndDate,
                   TotalAmount, (
                       SELECT Product2.Name, Quantity, UnitPrice
                       FROM SalesAgreementProducts
                   )
            FROM SalesAgreement
            WHERE AccountId = '{account_id}'
            ORDER BY StartDate DESC
        """
        return self._soql_query(query)

    # 预测数据查询
    def get_account_forecast(self, account_id: str, period: str = "Monthly") -> dict:
        """获取客户预测数据"""
        query = f"""
            SELECT Id, Account.Name, PeriodStartDate, PeriodEndDate,
                   ForecastQuantity, ForecastAmount, ActualQuantity, ActualAmount
            FROM AccountProductPeriodForecast
            WHERE AccountId = '{account_id}'
            AND ForecastPeriod = '{period}'
            ORDER BY PeriodStartDate DESC
            LIMIT 12
        """
        return self._soql_query(query)

    # 供应商绩效查询
    def get_supplier_performance(self, supplier_id: str) -> dict:
        """获取供应商绩效数据"""
        query = f"""
            SELECT Id, Name,
                   On_Time_Delivery_Rate__c,
                   Quality_Score__c,
                   Response_Time__c,
                   Total_Orders__c,
                   Defect_Rate__c
            FROM Account
            WHERE Id = '{supplier_id}'
            AND RecordType.DeveloperName = 'Supplier'
        """
        return self._soql_query(query)

    def _soql_query(self, query: str) -> dict:
        """执行 SOQL 查询"""
        url = f"{self.base_url}/query"
        params = {"q": query}
        response = requests.get(url, headers=self.headers, params=params)
        return response.json()
```

### 3.3 OmniStudio 集成 (推荐方式)

```python
# OmniStudio Integration Procedure 调用

class OmniStudioClient:
    """OmniStudio 集成客户端"""

    def __init__(self, access_token: str, instance_url: str):
        self.access_token = access_token
        self.instance_url = instance_url

    def execute_integration_procedure(
        self,
        procedure_name: str,
        input_data: dict
    ) -> dict:
        """
        执行 Integration Procedure

        Args:
            procedure_name: IP 名称 (如 "Manufacturing_GetProductSpecs")
            input_data: 输入参数
        """
        url = f"{self.instance_url}/services/apexrest/vlocity_cmt/v2/integrationprocedure/{procedure_name}"

        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }

        response = requests.post(url, json=input_data, headers=headers)
        return response.json()

    # 预置的制造业 Integration Procedures
    def get_product_specifications(self, product_id: str) -> dict:
        """获取产品规格详情"""
        return self.execute_integration_procedure(
            "Manufacturing_GetProductSpecs",
            {"productId": product_id}
        )

    def get_compliance_documents(self, product_id: str, region: str) -> dict:
        """获取合规文档"""
        return self.execute_integration_procedure(
            "Manufacturing_GetComplianceDocs",
            {"productId": product_id, "region": region}
        )

    def get_supplier_catalog(self, category: str) -> dict:
        """获取供应商目录"""
        return self.execute_integration_procedure(
            "Manufacturing_GetSupplierCatalog",
            {"category": category}
        )
```

---

## 四、行业知识 RAG 引擎

### 4.1 行业专用嵌入模型

```python
# Industry-Specific Embedding with Domain Adaptation

from sentence_transformers import SentenceTransformer
import torch

class ManufacturingEmbedder:
    """制造业领域专用嵌入器"""

    def __init__(self, base_model: str = "all-MiniLM-L6-v2"):
        self.model = SentenceTransformer(base_model)
        self.industry_vocab = self._load_industry_vocabulary()

    def _load_industry_vocabulary(self) -> dict:
        """加载制造业术语词典"""
        return {
            # 生产术语
            "OEM": "Original Equipment Manufacturer 原始设备制造商",
            "MRP": "Material Requirements Planning 物料需求计划",
            "BOM": "Bill of Materials 物料清单",
            "WIP": "Work In Progress 在制品",
            "JIT": "Just In Time 准时制生产",
            "Kanban": "看板管理",
            "Lean": "精益生产",
            "Six Sigma": "六西格玛质量管理",

            # 质量术语
            "PPAP": "Production Part Approval Process 生产件批准程序",
            "FMEA": "Failure Mode and Effects Analysis 失效模式与影响分析",
            "SPC": "Statistical Process Control 统计过程控制",
            "AQL": "Acceptable Quality Level 可接受质量水平",
            "NCR": "Non-Conformance Report 不合格报告",
            "CAPA": "Corrective and Preventive Action 纠正与预防措施",

            # 供应链术语
            "MOQ": "Minimum Order Quantity 最小订购量",
            "Lead Time": "交货周期",
            "Safety Stock": "安全库存",
            "Incoterms": "国际贸易术语",
            "3PL": "Third Party Logistics 第三方物流",

            # 合规术语
            "ISO 9001": "质量管理体系认证",
            "IATF 16949": "汽车行业质量管理体系",
            "RoHS": "有害物质限制指令",
            "REACH": "化学品注册评估授权限制",
            "CE": "欧洲合格认证",
            "UL": "美国安全认证"
        }

    def expand_query(self, query: str) -> str:
        """扩展查询中的行业术语"""
        expanded = query
        for abbr, full in self.industry_vocab.items():
            if abbr.lower() in query.lower():
                expanded = f"{query} ({full})"
                break
        return expanded

    def encode(self, texts: list[str], expand: bool = True) -> torch.Tensor:
        """编码文本为向量"""
        if expand:
            texts = [self.expand_query(t) for t in texts]
        return self.model.encode(texts, convert_to_tensor=True)
```

### 4.2 混合检索策略

```python
# Hybrid Retrieval for Manufacturing Knowledge

from elasticsearch import Elasticsearch
import numpy as np

class ManufacturingRetriever:
    """制造业知识混合检索器"""

    def __init__(
        self,
        es_client: Elasticsearch,
        embedder: ManufacturingEmbedder,
        vector_store
    ):
        self.es = es_client
        self.embedder = embedder
        self.vector_store = vector_store

        # 知识分类权重
        self.category_weights = {
            "product_specs": 1.2,      # 产品规格优先
            "compliance_docs": 1.1,     # 合规文档次之
            "supplier_info": 1.0,       # 供应商信息
            "case_studies": 0.9,        # 案例研究
            "general_kb": 0.8           # 通用知识
        }

    def hybrid_search(
        self,
        query: str,
        salesforce_context: dict,
        top_k: int = 10
    ) -> list[dict]:
        """
        混合检索：关键词 + 语义 + Salesforce 上下文

        Args:
            query: 用户查询
            salesforce_context: Salesforce 上下文 (Account, Product 等)
            top_k: 返回结果数
        """

        # 1. 关键词检索 (BM25)
        keyword_results = self._keyword_search(query, top_k * 2)

        # 2. 语义检索 (Vector)
        expanded_query = self.embedder.expand_query(query)
        vector_results = self._vector_search(expanded_query, top_k * 2)

        # 3. Salesforce 上下文增强
        context_boost = self._get_context_boost(salesforce_context)

        # 4. 融合排序
        combined = self._reciprocal_rank_fusion(
            keyword_results,
            vector_results,
            context_boost
        )

        return combined[:top_k]

    def _keyword_search(self, query: str, k: int) -> list[dict]:
        """Elasticsearch BM25 检索"""
        body = {
            "query": {
                "multi_match": {
                    "query": query,
                    "fields": [
                        "title^3",
                        "content^2",
                        "product_name^2",
                        "category",
                        "tags"
                    ],
                    "type": "best_fields"
                }
            },
            "size": k
        }
        results = self.es.search(index="manufacturing_kb", body=body)
        return [
            {
                "id": hit["_id"],
                "score": hit["_score"],
                "content": hit["_source"]
            }
            for hit in results["hits"]["hits"]
        ]

    def _vector_search(self, query: str, k: int) -> list[dict]:
        """向量语义检索"""
        query_vector = self.embedder.encode([query])[0]
        results = self.vector_store.similarity_search(
            query_vector,
            k=k
        )
        return results

    def _get_context_boost(self, sf_context: dict) -> dict:
        """根据 Salesforce 上下文生成 boost 因子"""
        boost = {}

        # Account 行业分类
        if "Industry" in sf_context:
            boost["industry"] = sf_context["Industry"]

        # Product 相关性
        if "Product2Id" in sf_context:
            boost["product_id"] = sf_context["Product2Id"]

        # Case 类型
        if "CaseType" in sf_context:
            boost["case_type"] = sf_context["CaseType"]

        return boost

    def _reciprocal_rank_fusion(
        self,
        keyword_results: list,
        vector_results: list,
        context_boost: dict,
        k: int = 60
    ) -> list[dict]:
        """
        Reciprocal Rank Fusion 融合算法
        Score = Σ 1/(k + rank_i)
        """
        scores = {}

        # 关键词结果排名
        for rank, result in enumerate(keyword_results):
            doc_id = result["id"]
            scores[doc_id] = scores.get(doc_id, 0) + 1 / (k + rank + 1)

        # 向量结果排名
        for rank, result in enumerate(vector_results):
            doc_id = result["id"]
            scores[doc_id] = scores.get(doc_id, 0) + 1 / (k + rank + 1)

        # 上下文 boost
        for doc_id, score in scores.items():
            category = self._get_doc_category(doc_id)
            scores[doc_id] *= self.category_weights.get(category, 1.0)

        # 排序返回
        sorted_docs = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        return [{"id": doc_id, "score": score} for doc_id, score in sorted_docs]
```

### 4.3 答案生成与引用

```python
# Answer Generation with Citations

from anthropic import Anthropic

class ManufacturingAnswerGenerator:
    """制造业知识问答生成器"""

    def __init__(self, anthropic_client: Anthropic):
        self.client = anthropic_client

        self.system_prompt = """你是一个专业的制造业知识助手，服务于 Salesforce 用户。

你的职责是：
1. 准确回答关于产品规格、供应商、合规要求的问题
2. 始终引用来源文档
3. 使用专业但易懂的语言
4. 如果不确定，明确说明

回答格式：
- 直接回答问题
- 提供相关细节
- 标注引用来源 [1], [2] 等
- 如有需要，建议下一步行动"""

    def generate_answer(
        self,
        query: str,
        retrieved_docs: list[dict],
        salesforce_context: dict
    ) -> dict:
        """
        生成带引用的答案

        Returns:
            {
                "answer": str,
                "citations": list[dict],
                "confidence": float,
                "suggested_actions": list[str]
            }
        """

        # 构建上下文
        context_str = self._build_context(retrieved_docs, salesforce_context)

        # 生成答案
        message = self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            system=self.system_prompt,
            messages=[{
                "role": "user",
                "content": f"""基于以下信息回答问题：

## Salesforce 上下文
{self._format_sf_context(salesforce_context)}

## 知识库检索结果
{context_str}

## 用户问题
{query}

请用中文回答，并标注引用来源。"""
            }]
        )

        answer_text = message.content[0].text

        # 解析引用
        citations = self._extract_citations(answer_text, retrieved_docs)

        # 计算置信度
        confidence = self._calculate_confidence(retrieved_docs)

        # 建议行动
        suggested_actions = self._suggest_actions(query, salesforce_context)

        return {
            "answer": answer_text,
            "citations": citations,
            "confidence": confidence,
            "suggested_actions": suggested_actions
        }

    def _build_context(self, docs: list[dict], sf_context: dict) -> str:
        """构建检索上下文"""
        context_parts = []
        for i, doc in enumerate(docs[:5]):  # 最多 5 个来源
            context_parts.append(f"""
[来源 {i+1}] {doc.get('title', 'Unknown')}
类型: {doc.get('category', 'Unknown')}
内容: {doc.get('content', '')[:500]}...
""")
        return "\n".join(context_parts)

    def _format_sf_context(self, sf_context: dict) -> str:
        """格式化 Salesforce 上下文"""
        if not sf_context:
            return "无"

        parts = []
        if "AccountName" in sf_context:
            parts.append(f"客户: {sf_context['AccountName']}")
        if "ProductName" in sf_context:
            parts.append(f"产品: {sf_context['ProductName']}")
        if "CaseNumber" in sf_context:
            parts.append(f"Case: {sf_context['CaseNumber']}")

        return "\n".join(parts) if parts else "无"

    def _calculate_confidence(self, docs: list[dict]) -> float:
        """计算答案置信度"""
        if not docs:
            return 0.0

        # 基于检索分数
        top_score = docs[0].get("score", 0)
        if top_score > 0.9:
            return 0.95
        elif top_score > 0.7:
            return 0.8
        elif top_score > 0.5:
            return 0.6
        else:
            return 0.4
```

---

## 五、Salesforce LWC 界面

### 5.1 知识问答组件

```javascript
// manufacturingKnowledgeAssistant.js
import { LightningElement, api, wire, track } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import askQuestion from '@salesforce/apex/ManufacturingKnowledgeController.askQuestion';

// Account Fields
import ACCOUNT_NAME from '@salesforce/schema/Account.Name';
import ACCOUNT_INDUSTRY from '@salesforce/schema/Account.Industry';

export default class ManufacturingKnowledgeAssistant extends LightningElement {
    @api recordId;
    @api objectApiName;

    @track query = '';
    @track isLoading = false;
    @track answer = null;
    @track citations = [];
    @track confidence = 0;
    @track suggestedQuestions = [];
    @track error = null;

    // 获取当前记录上下文
    @wire(getRecord, {
        recordId: '$recordId',
        fields: [ACCOUNT_NAME, ACCOUNT_INDUSTRY]
    })
    record;

    get accountName() {
        return getFieldValue(this.record.data, ACCOUNT_NAME);
    }

    get accountIndustry() {
        return getFieldValue(this.record.data, ACCOUNT_INDUSTRY);
    }

    // 预设问题
    get presetQuestions() {
        return [
            { label: '产品规格查询', icon: 'utility:description' },
            { label: '供应商信息', icon: 'utility:company' },
            { label: '合规文档', icon: 'utility:approval' },
            { label: '质量标准', icon: 'utility:check' }
        ];
    }

    handleQueryChange(event) {
        this.query = event.target.value;
    }

    handlePresetClick(event) {
        const preset = event.currentTarget.dataset.label;
        this.query = this._expandPreset(preset);
        this.handleAsk();
    }

    async handleAsk() {
        if (!this.query.trim()) return;

        this.isLoading = true;
        this.error = null;

        try {
            const context = {
                recordId: this.recordId,
                objectApiName: this.objectApiName,
                accountName: this.accountName,
                accountIndustry: this.accountIndustry
            };

            const result = await askQuestion({
                query: this.query,
                contextJson: JSON.stringify(context)
            });

            const parsed = JSON.parse(result);
            this.answer = parsed.answer;
            this.citations = parsed.citations || [];
            this.confidence = parsed.confidence || 0;
            this.suggestedQuestions = this._generateFollowUps(parsed);

        } catch (error) {
            this.error = error.body?.message || '查询失败，请重试';
            console.error('Knowledge query error:', error);
        } finally {
            this.isLoading = false;
        }
    }

    get confidenceClass() {
        if (this.confidence >= 0.8) return 'confidence-high';
        if (this.confidence >= 0.5) return 'confidence-medium';
        return 'confidence-low';
    }

    get confidenceLabel() {
        if (this.confidence >= 0.8) return '高置信度';
        if (this.confidence >= 0.5) return '中置信度';
        return '低置信度 - 建议人工确认';
    }

    _expandPreset(preset) {
        const expansions = {
            '产品规格查询': `请告诉我 ${this.accountName} 的主要产品规格参数`,
            '供应商信息': `${this.accountName} 的供应商资质和绩效如何？`,
            '合规文档': `${this.accountName} 产品需要哪些合规认证？`,
            '质量标准': `${this.accountName} 产品的质量标准和检验要求是什么？`
        };
        return expansions[preset] || preset;
    }

    _generateFollowUps(result) {
        // 基于答案生成后续问题
        return [
            '有相关的技术文档吗？',
            '类似产品还有哪些？',
            '竞品对比如何？'
        ];
    }
}
```

### 5.2 HTML 模板

```html
<!-- manufacturingKnowledgeAssistant.html -->
<template>
    <lightning-card title="制造业知识助手" icon-name="custom:custom14">

        <!-- 输入区域 -->
        <div class="slds-p-horizontal_medium">
            <div class="slds-grid slds-gutters slds-wrap">

                <!-- 预设问题 -->
                <div class="slds-col slds-size_1-of-1 slds-m-bottom_small">
                    <div class="slds-button-group" role="group">
                        <template for:each={presetQuestions} for:item="preset">
                            <lightning-button
                                key={preset.label}
                                label={preset.label}
                                icon-name={preset.icon}
                                data-label={preset.label}
                                onclick={handlePresetClick}
                                class="slds-m-right_x-small">
                            </lightning-button>
                        </template>
                    </div>
                </div>

                <!-- 问题输入 -->
                <div class="slds-col slds-size_1-of-1">
                    <lightning-input
                        type="text"
                        label="您的问题"
                        placeholder="例如：这个产品的最大承重是多少？"
                        value={query}
                        onchange={handleQueryChange}
                        onkeyup={handleKeyUp}>
                    </lightning-input>
                </div>

                <!-- 提交按钮 -->
                <div class="slds-col slds-size_1-of-1 slds-m-top_small">
                    <lightning-button
                        variant="brand"
                        label="查询"
                        onclick={handleAsk}
                        disabled={isLoading}>
                    </lightning-button>
                </div>
            </div>
        </div>

        <!-- 加载状态 -->
        <template if:true={isLoading}>
            <div class="slds-p-around_medium slds-align_absolute-center">
                <lightning-spinner alternative-text="查询中..."></lightning-spinner>
            </div>
        </template>

        <!-- 错误信息 -->
        <template if:true={error}>
            <div class="slds-p-around_medium">
                <div class="slds-notify slds-notify_alert slds-alert_error" role="alert">
                    <span class="slds-assistive-text">错误</span>
                    <span>{error}</span>
                </div>
            </div>
        </template>

        <!-- 答案区域 -->
        <template if:true={answer}>
            <div class="slds-p-around_medium answer-container">

                <!-- 置信度标签 -->
                <div class="slds-m-bottom_small">
                    <lightning-badge label={confidenceLabel} class={confidenceClass}></lightning-badge>
                </div>

                <!-- 答案内容 -->
                <div class="slds-text-body_regular answer-text">
                    <lightning-formatted-rich-text value={answer}></lightning-formatted-rich-text>
                </div>

                <!-- 引用来源 -->
                <template if:true={citations.length}>
                    <div class="slds-m-top_medium">
                        <h3 class="slds-text-title_caps">参考来源</h3>
                        <ul class="slds-list_dotted">
                            <template for:each={citations} for:item="citation">
                                <li key={citation.id}>
                                    <a href={citation.url} target="_blank">{citation.title}</a>
                                    <span class="slds-text-color_weak"> - {citation.source}</span>
                                </li>
                            </template>
                        </ul>
                    </div>
                </template>

                <!-- 后续问题建议 -->
                <template if:true={suggestedQuestions.length}>
                    <div class="slds-m-top_medium">
                        <h3 class="slds-text-title_caps">相关问题</h3>
                        <template for:each={suggestedQuestions} for:item="sq">
                            <lightning-button
                                key={sq}
                                label={sq}
                                variant="neutral"
                                onclick={handleFollowUp}
                                data-question={sq}
                                class="slds-m-right_x-small slds-m-bottom_x-small">
                            </lightning-button>
                        </template>
                    </div>
                </template>
            </div>
        </template>

    </lightning-card>
</template>
```

---

## 六、知识库管理

### 6.1 知识导入 Pipeline

```python
# Knowledge Ingestion Pipeline

from dataclasses import dataclass
from enum import Enum
from typing import Generator
import hashlib

class KnowledgeCategory(Enum):
    PRODUCT_SPECS = "product_specs"
    COMPLIANCE_DOCS = "compliance_docs"
    SUPPLIER_INFO = "supplier_info"
    CASE_STUDIES = "case_studies"
    GENERAL_KB = "general_kb"

@dataclass
class KnowledgeDocument:
    id: str
    title: str
    content: str
    category: KnowledgeCategory
    metadata: dict
    embedding: list[float] = None

class ManufacturingKnowledgeIngester:
    """制造业知识导入器"""

    def __init__(
        self,
        embedder: ManufacturingEmbedder,
        vector_store,
        es_client
    ):
        self.embedder = embedder
        self.vector_store = vector_store
        self.es = es_client

    def ingest_salesforce_products(self, sf_client) -> int:
        """导入 Salesforce 产品知识"""
        count = 0

        # 查询产品数据
        products = sf_client.query("""
            SELECT Id, Name, ProductCode, Description, Family,
                   Technical_Specs__c, Compliance_Info__c,
                   (SELECT Id, ContentDocument.Title, ContentDocument.LatestPublishedVersion.VersionData
                    FROM ContentDocumentLinks)
            FROM Product2
            WHERE IsActive = true
        """)

        for product in products["records"]:
            # 产品基本信息
            doc = KnowledgeDocument(
                id=f"product_{product['Id']}",
                title=f"产品: {product['Name']}",
                content=self._build_product_content(product),
                category=KnowledgeCategory.PRODUCT_SPECS,
                metadata={
                    "product_id": product["Id"],
                    "product_code": product.get("ProductCode"),
                    "family": product.get("Family"),
                    "source": "salesforce_product2"
                }
            )

            self._index_document(doc)
            count += 1

            # 附件文档
            for attachment in product.get("ContentDocumentLinks", {}).get("records", []):
                attach_doc = self._process_attachment(attachment, product)
                if attach_doc:
                    self._index_document(attach_doc)
                    count += 1

        return count

    def ingest_supplier_data(self, sf_client) -> int:
        """导入供应商知识"""
        count = 0

        suppliers = sf_client.query("""
            SELECT Id, Name, Description, Industry, Website,
                   On_Time_Delivery_Rate__c, Quality_Score__c,
                   Certifications__c, Products_Supplied__c
            FROM Account
            WHERE RecordType.DeveloperName = 'Supplier'
        """)

        for supplier in suppliers["records"]:
            doc = KnowledgeDocument(
                id=f"supplier_{supplier['Id']}",
                title=f"供应商: {supplier['Name']}",
                content=self._build_supplier_content(supplier),
                category=KnowledgeCategory.SUPPLIER_INFO,
                metadata={
                    "supplier_id": supplier["Id"],
                    "industry": supplier.get("Industry"),
                    "quality_score": supplier.get("Quality_Score__c"),
                    "source": "salesforce_supplier"
                }
            )

            self._index_document(doc)
            count += 1

        return count

    def ingest_compliance_documents(self, document_urls: list[str]) -> int:
        """导入合规文档 (PDF, Word 等)"""
        count = 0

        for url in document_urls:
            # 下载并解析文档
            content = self._parse_document(url)

            # 分块处理
            chunks = self._chunk_document(content, chunk_size=500, overlap=50)

            for i, chunk in enumerate(chunks):
                doc = KnowledgeDocument(
                    id=f"compliance_{hashlib.md5(url.encode()).hexdigest()}_{i}",
                    title=f"合规文档: {self._extract_title(url)}",
                    content=chunk,
                    category=KnowledgeCategory.COMPLIANCE_DOCS,
                    metadata={
                        "source_url": url,
                        "chunk_index": i,
                        "source": "compliance_document"
                    }
                )

                self._index_document(doc)
                count += 1

        return count

    def _index_document(self, doc: KnowledgeDocument):
        """索引单个文档"""
        # 生成嵌入
        doc.embedding = self.embedder.encode([doc.content])[0].tolist()

        # 向量存储
        self.vector_store.add(
            ids=[doc.id],
            embeddings=[doc.embedding],
            metadatas=[doc.metadata],
            documents=[doc.content]
        )

        # Elasticsearch 索引 (用于关键词搜索)
        self.es.index(
            index="manufacturing_kb",
            id=doc.id,
            document={
                "title": doc.title,
                "content": doc.content,
                "category": doc.category.value,
                **doc.metadata
            }
        )

    def _build_product_content(self, product: dict) -> str:
        """构建产品知识内容"""
        parts = [
            f"产品名称: {product['Name']}",
            f"产品编码: {product.get('ProductCode', 'N/A')}",
            f"产品系列: {product.get('Family', 'N/A')}",
            f"产品描述: {product.get('Description', 'N/A')}",
        ]

        if product.get("Technical_Specs__c"):
            parts.append(f"技术规格: {product['Technical_Specs__c']}")

        if product.get("Compliance_Info__c"):
            parts.append(f"合规信息: {product['Compliance_Info__c']}")

        return "\n".join(parts)

    def _build_supplier_content(self, supplier: dict) -> str:
        """构建供应商知识内容"""
        parts = [
            f"供应商名称: {supplier['Name']}",
            f"行业: {supplier.get('Industry', 'N/A')}",
            f"描述: {supplier.get('Description', 'N/A')}",
            f"准时交货率: {supplier.get('On_Time_Delivery_Rate__c', 'N/A')}%",
            f"质量评分: {supplier.get('Quality_Score__c', 'N/A')}",
            f"认证: {supplier.get('Certifications__c', 'N/A')}",
            f"供应产品: {supplier.get('Products_Supplied__c', 'N/A')}",
        ]
        return "\n".join(parts)

    def _chunk_document(
        self,
        content: str,
        chunk_size: int = 500,
        overlap: int = 50
    ) -> list[str]:
        """文档分块"""
        chunks = []
        start = 0

        while start < len(content):
            end = start + chunk_size
            chunk = content[start:end]

            # 尝试在句子边界分割
            if end < len(content):
                last_period = chunk.rfind('。')
                if last_period > chunk_size // 2:
                    chunk = chunk[:last_period + 1]
                    end = start + last_period + 1

            chunks.append(chunk)
            start = end - overlap

        return chunks
```

---

## 七、多语言支持

### 7.1 多语言查询处理

```python
# Multilingual Query Processing

from langdetect import detect
import opencc

class MultilingualProcessor:
    """多语言查询处理器 - 跨国制造企业场景"""

    def __init__(self):
        # 简繁转换器
        self.s2t = opencc.OpenCC('s2t')  # 简体转繁体
        self.t2s = opencc.OpenCC('t2s')  # 繁体转简体

        # 行业术语多语言映射
        self.term_mappings = {
            "en": {
                "quality control": ["品质管控", "质量控制", "品質管理"],
                "bill of materials": ["物料清单", "BOM", "材料表"],
                "lead time": ["交期", "交货周期", "納期"],
                "specification": ["规格", "规格书", "スペック"],
            },
            "zh": {
                "物料清单": ["BOM", "bill of materials", "部品表"],
                "交货周期": ["lead time", "delivery time", "リードタイム"],
            },
            "ja": {
                "品質管理": ["quality control", "QC", "质量管理"],
                "納期": ["lead time", "delivery date", "交货期"],
            }
        }

    def detect_language(self, text: str) -> str:
        """检测语言"""
        try:
            lang = detect(text)
            # 映射到主要语言代码
            if lang in ["zh-cn", "zh-tw"]:
                return "zh"
            return lang
        except:
            return "en"  # 默认英文

    def normalize_query(self, query: str) -> str:
        """标准化查询 (统一使用简体中文)"""
        # 繁体转简体
        return self.t2s.convert(query)

    def expand_multilingual(self, query: str) -> list[str]:
        """
        多语言查询扩展
        用于制造业跨国场景 - 同一术语可能用不同语言表达
        """
        lang = self.detect_language(query)
        expanded = [query]

        # 查找术语映射
        for term, translations in self.term_mappings.get(lang, {}).items():
            if term.lower() in query.lower():
                for translation in translations:
                    expanded.append(query.replace(term, translation))

        return list(set(expanded))

    def translate_response(self, response: str, target_lang: str) -> str:
        """
        翻译响应到目标语言
        简化实现 - 实际应调用翻译 API
        """
        if target_lang == "zh-tw":
            return self.s2t.convert(response)
        # 其他语言翻译需要调用外部 API
        return response
```

---

## 八、部署架构

### 8.1 Salesforce 部署

```xml
<!-- sfdx-project.json -->
{
    "packageDirectories": [
        {
            "path": "force-app",
            "default": true
        }
    ],
    "namespace": "gbase",
    "sourceApiVersion": "66.0"
}

<!-- package.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>ManufacturingKnowledgeController</members>
        <name>ApexClass</name>
    </types>
    <types>
        <members>manufacturingKnowledgeAssistant</members>
        <name>LightningComponentBundle</name>
    </types>
    <types>
        <members>Manufacturing_Knowledge_Permission</members>
        <name>PermissionSet</name>
    </types>
    <version>66.0</version>
</Package>
```

### 8.2 GBase 后端部署

```yaml
# docker-compose.yml

version: '3.8'

services:
  industry-accelerator:
    build: ./industry-accelerator
    ports:
      - "8082:8082"
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - SALESFORCE_CLIENT_ID=${SALESFORCE_CLIENT_ID}
      - SALESFORCE_CLIENT_SECRET=${SALESFORCE_CLIENT_SECRET}
      - ELASTICSEARCH_URL=http://elasticsearch:9200
      - CHROMADB_URL=http://chromadb:8000
    depends_on:
      - elasticsearch
      - chromadb
    networks:
      - gbase-network

  elasticsearch:
    image: elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    volumes:
      - es-data:/usr/share/elasticsearch/data
    networks:
      - gbase-network

  chromadb:
    image: chromadb/chroma:latest
    volumes:
      - chroma-data:/chroma/chroma
    networks:
      - gbase-network

volumes:
  es-data:
  chroma-data:

networks:
  gbase-network:
    driver: bridge
```

---

## 九、MVP 开发计划

### Week 1: 基础架构
| Day | 任务 | 交付物 |
|-----|------|--------|
| 1-2 | Salesforce Manufacturing Cloud API 集成 | API 客户端 |
| 3-4 | 知识库 Schema 设计 + ES 索引 | 索引模板 |
| 5 | 嵌入模型集成 + 向量存储 | RAG 基础 |

### Week 2: RAG 引擎
| Day | 任务 | 交付物 |
|-----|------|--------|
| 1-2 | 混合检索实现 | 检索器 |
| 3-4 | 答案生成 + 引用 | 生成器 |
| 5 | 行业术语扩展 | 术语库 |

### Week 3: Salesforce 集成
| Day | 任务 | 交付物 |
|-----|------|--------|
| 1-2 | LWC 组件开发 | UI 组件 |
| 3-4 | Apex Controller | API 层 |
| 5 | 上下文集成 | 联动功能 |

### Week 4: 测试与部署
| Day | 任务 | 交付物 |
|-----|------|--------|
| 1-2 | 知识导入脚本 | 数据管道 |
| 3-4 | 集成测试 | 测试报告 |
| 5 | AppExchange 打包 | 安装包 |

---

## 十、成功指标

### 业务指标
| 指标 | 目标 | 测量方式 |
|------|------|----------|
| 首次解决率 | +15% | Service Cloud 报表 |
| 报价准备时间 | -30% | 用户调研 |
| 知识查询满意度 | >85% | 应用内评分 |

### 技术指标
| 指标 | 目标 | 测量方式 |
|------|------|----------|
| 查询响应时间 | <2s | 监控日志 |
| 检索准确率 | >80% | 人工评测 |
| 系统可用性 | 99.5% | 监控告警 |

---

## 参考资料

- [Manufacturing Cloud Developer Guide](https://developer.salesforce.com/docs/atlas.en-us.manufacturing_cloud_dev_guide.meta/manufacturing_cloud_dev_guide/)
- [OmniStudio Integration Procedures](https://developer.salesforce.com/docs/atlas.en-us.omnistudio.meta/omnistudio/os_integration_procedures.htm)
- [RAG Best Practices](https://www.anthropic.com/index/retrieval-augmented-generation)
