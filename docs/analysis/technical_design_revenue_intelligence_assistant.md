# Revenue Intelligence Assistant 技术设计方案

> **版本**: 1.0
> **日期**: 2026-01-10
> **评分**: 7.1/10 (Priority #5)
> **状态**: 技术设计

---

## 一、产品概述

### 定位
**"让销售数据产生洞察"**

销售知识问答 + 销售数据智能分析。

### 市场验证
| 数据点 | 数值 | 意义 |
|--------|------|------|
| Sales 类 AppExchange 占比 | 23.44% | 最大类别 |
| 验证竞品 | Clari, Groove, LeanData | 市场已验证 |
| 销售工具 ROI | 可量化 | 买家愿意付费 |

### 差异化定位

| 竞品 | 定位 | 我们的差异化 |
|------|------|--------------|
| Clari | 收入预测 | 不直接竞争预测 |
| Gong | 对话智能 | 不做通话分析 |
| ZoomInfo | 数据增强 | 不做第三方数据 |
| **我们** | **销售知识问答** | **RAG + NL Query** |

核心价值：
1. 产品知识库 - 销售快速查询产品信息
2. 竞品情报 - 竞品对比、应对策略
3. 案例检索 - 相似客户成功案例
4. 销售数据问答 - 自然语言查询 CRM 数据

---

## 二、系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                  Revenue Intelligence Assistant                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   User Interface Layer                     │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐ │   │
│  │  │ LWC Sales   │ │ Slack Bot   │ │ Mobile              │ │   │
│  │  │ Console     │ │             │ │ Lightning           │ │   │
│  │  └─────────────┘ └─────────────┘ └─────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   Query Understanding Layer                │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐ │   │
│  │  │ Intent      │ │ Entity      │ │ Query               │ │   │
│  │  │ Classifier  │ │ Extractor   │ │ Router              │ │   │
│  │  └─────────────┘ └─────────────┘ └─────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│  ┌────────────────────────────┬─────────────────────────────┐   │
│  │     Knowledge RAG          │      Data Query Engine       │   │
│  │  ┌─────────────────────┐   │   ┌─────────────────────┐   │   │
│  │  │ Product Knowledge   │   │   │ NL to SOQL          │   │   │
│  │  │ Competitor Intel    │   │   │ Converter           │   │   │
│  │  │ Case Studies        │   │   └─────────────────────┘   │   │
│  │  │ Sales Playbooks     │   │   ┌─────────────────────┐   │   │
│  │  └─────────────────────┘   │   │ Query Optimizer     │   │   │
│  │  ┌─────────────────────┐   │   └─────────────────────┘   │   │
│  │  │ RAG Engine          │   │   ┌─────────────────────┐   │   │
│  │  └─────────────────────┘   │   │ Result Formatter    │   │   │
│  └────────────────────────────┴───┴─────────────────────────┘   │
│                              │                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   Salesforce Integration                   │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌────────────────┐   │   │
│  │  │ Sales Cloud  │ │ Reports &    │ │ Einstein       │   │   │
│  │  │ API          │ │ Dashboards   │ │ Analytics      │   │   │
│  │  └──────────────┘ └──────────────┘ └────────────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 三、查询理解层

### 3.1 意图分类器

```python
# Intent Classification for Sales Queries

from enum import Enum
from anthropic import Anthropic
import json

class SalesQueryIntent(Enum):
    # 知识查询类
    PRODUCT_INFO = "product_info"           # 产品信息查询
    COMPETITOR_INTEL = "competitor_intel"   # 竞品情报
    CASE_STUDY = "case_study"               # 成功案例
    SALES_PLAYBOOK = "sales_playbook"       # 销售策略/话术
    PRICING = "pricing"                     # 定价信息
    FAQ = "faq"                             # 常见问题

    # 数据查询类
    PIPELINE_STATUS = "pipeline_status"     # 管道状态
    DEAL_DETAILS = "deal_details"           # 商机详情
    ACCOUNT_INFO = "account_info"           # 客户信息
    QUOTA_ATTAINMENT = "quota_attainment"   # 配额完成情况
    FORECAST = "forecast"                   # 预测
    ACTIVITY = "activity"                   # 活动统计

    # 操作类
    UPDATE_RECORD = "update_record"         # 更新记录
    CREATE_TASK = "create_task"             # 创建任务
    SCHEDULE_MEETING = "schedule_meeting"   # 安排会议

    # 其他
    GENERAL = "general"                     # 通用问题

class SalesIntentClassifier:
    """销售查询意图分类器"""

    def __init__(self, anthropic_client: Anthropic):
        self.client = anthropic_client

        self.intent_descriptions = {
            SalesQueryIntent.PRODUCT_INFO: "产品功能、规格、优势等信息",
            SalesQueryIntent.COMPETITOR_INTEL: "竞品对比、竞争分析、应对策略",
            SalesQueryIntent.CASE_STUDY: "客户成功案例、参考案例",
            SalesQueryIntent.SALES_PLAYBOOK: "销售话术、异议处理、最佳实践",
            SalesQueryIntent.PRICING: "价格、折扣、套餐信息",
            SalesQueryIntent.FAQ: "常见问题解答",
            SalesQueryIntent.PIPELINE_STATUS: "销售管道、商机阶段、金额统计",
            SalesQueryIntent.DEAL_DETAILS: "具体商机的详细信息",
            SalesQueryIntent.ACCOUNT_INFO: "客户/账户的详细信息",
            SalesQueryIntent.QUOTA_ATTAINMENT: "配额完成率、业绩统计",
            SalesQueryIntent.FORECAST: "收入预测、完成预期",
            SalesQueryIntent.ACTIVITY: "拜访、电话、邮件等活动统计",
        }

    async def classify(
        self,
        query: str,
        context: dict = None
    ) -> dict:
        """
        分类查询意图

        Returns:
            {
                "primary_intent": str,
                "secondary_intent": str | None,
                "confidence": float,
                "entities": dict,
                "needs_clarification": bool
            }
        """

        prompt = f"""分析以下销售人员的查询，判断其意图。

查询: "{query}"

{f'上下文: {json.dumps(context, ensure_ascii=False)}' if context else ''}

可能的意图类型:
{json.dumps({i.value: d for i, d in self.intent_descriptions.items()}, ensure_ascii=False, indent=2)}

请返回 JSON 格式:
{{
    "primary_intent": "主要意图",
    "secondary_intent": "次要意图或 null",
    "confidence": 0.0-1.0,
    "entities": {{
        "product_name": "提到的产品",
        "competitor_name": "提到的竞品",
        "account_name": "提到的客户",
        "time_range": "时间范围",
        "amount": "金额"
    }},
    "needs_clarification": true/false,
    "clarification_question": "如果需要澄清，提出的问题"
}}

只返回 JSON，不要其他文字。"""

        message = self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=500,
            messages=[{"role": "user", "content": prompt}]
        )

        result = json.loads(message.content[0].text)

        return {
            "primary_intent": SalesQueryIntent(result["primary_intent"]),
            "secondary_intent": SalesQueryIntent(result["secondary_intent"]) if result.get("secondary_intent") else None,
            "confidence": result.get("confidence", 0.8),
            "entities": result.get("entities", {}),
            "needs_clarification": result.get("needs_clarification", False),
            "clarification_question": result.get("clarification_question")
        }
```

### 3.2 查询路由器

```python
# Query Router

class SalesQueryRouter:
    """查询路由器 - 决定使用 RAG 还是 Data Query"""

    def __init__(
        self,
        classifier: SalesIntentClassifier,
        rag_engine,
        data_query_engine
    ):
        self.classifier = classifier
        self.rag = rag_engine
        self.data_query = data_query_engine

        # 意图到处理器的映射
        self.intent_handlers = {
            # 知识类 -> RAG
            SalesQueryIntent.PRODUCT_INFO: self._handle_knowledge_query,
            SalesQueryIntent.COMPETITOR_INTEL: self._handle_knowledge_query,
            SalesQueryIntent.CASE_STUDY: self._handle_knowledge_query,
            SalesQueryIntent.SALES_PLAYBOOK: self._handle_knowledge_query,
            SalesQueryIntent.PRICING: self._handle_knowledge_query,
            SalesQueryIntent.FAQ: self._handle_knowledge_query,

            # 数据类 -> NL to SOQL
            SalesQueryIntent.PIPELINE_STATUS: self._handle_data_query,
            SalesQueryIntent.DEAL_DETAILS: self._handle_data_query,
            SalesQueryIntent.ACCOUNT_INFO: self._handle_data_query,
            SalesQueryIntent.QUOTA_ATTAINMENT: self._handle_data_query,
            SalesQueryIntent.FORECAST: self._handle_data_query,
            SalesQueryIntent.ACTIVITY: self._handle_data_query,
        }

    async def route(self, query: str, context: dict = None) -> dict:
        """
        路由查询到适当的处理器

        Returns:
            {
                "intent": str,
                "handler": str,
                "result": dict
            }
        """
        # 1. 分类意图
        classification = await self.classifier.classify(query, context)

        # 2. 检查是否需要澄清
        if classification["needs_clarification"]:
            return {
                "intent": classification["primary_intent"].value,
                "handler": "clarification",
                "result": {
                    "needs_clarification": True,
                    "question": classification["clarification_question"]
                }
            }

        # 3. 路由到处理器
        intent = classification["primary_intent"]
        handler = self.intent_handlers.get(intent, self._handle_general)

        result = await handler(query, classification, context)

        return {
            "intent": intent.value,
            "handler": handler.__name__,
            "entities": classification["entities"],
            "result": result
        }

    async def _handle_knowledge_query(
        self,
        query: str,
        classification: dict,
        context: dict
    ) -> dict:
        """处理知识类查询"""
        intent = classification["primary_intent"]

        # 根据意图选择知识库
        knowledge_category = {
            SalesQueryIntent.PRODUCT_INFO: "products",
            SalesQueryIntent.COMPETITOR_INTEL: "competitors",
            SalesQueryIntent.CASE_STUDY: "case_studies",
            SalesQueryIntent.SALES_PLAYBOOK: "playbooks",
            SalesQueryIntent.PRICING: "pricing",
            SalesQueryIntent.FAQ: "faq"
        }.get(intent, "general")

        result = await self.rag.query(
            question=query,
            category=knowledge_category,
            context=context
        )

        return {
            "type": "knowledge",
            "answer": result["answer"],
            "citations": result["citations"],
            "confidence": result["confidence"]
        }

    async def _handle_data_query(
        self,
        query: str,
        classification: dict,
        context: dict
    ) -> dict:
        """处理数据类查询"""
        result = await self.data_query.execute(
            query=query,
            entities=classification["entities"],
            context=context
        )

        return {
            "type": "data",
            "data": result["data"],
            "visualization": result.get("visualization"),
            "soql": result.get("soql")  # 用于调试
        }

    async def _handle_general(
        self,
        query: str,
        classification: dict,
        context: dict
    ) -> dict:
        """处理通用查询"""
        # 同时尝试 RAG 和数据查询
        rag_result = await self.rag.query(query, context=context)

        return {
            "type": "general",
            "answer": rag_result["answer"],
            "citations": rag_result.get("citations", [])
        }
```

---

## 四、销售知识 RAG

### 4.1 销售知识库结构

```python
# Sales Knowledge Base

from dataclasses import dataclass
from enum import Enum
from typing import List

class KnowledgeCategory(Enum):
    PRODUCTS = "products"
    COMPETITORS = "competitors"
    CASE_STUDIES = "case_studies"
    PLAYBOOKS = "playbooks"
    PRICING = "pricing"
    FAQ = "faq"
    OBJECTIONS = "objections"
    INDUSTRY = "industry"

@dataclass
class SalesKnowledgeDocument:
    id: str
    title: str
    content: str
    category: KnowledgeCategory
    tags: List[str]
    metadata: dict
    embedding: list[float] = None

class SalesKnowledgeIngester:
    """销售知识导入器"""

    def __init__(self, embedder, vector_store, es_client):
        self.embedder = embedder
        self.vector_store = vector_store
        self.es = es_client

    async def ingest_product_catalog(self, sf_client) -> int:
        """导入产品目录"""
        products = sf_client.query_all("""
            SELECT Id, Name, ProductCode, Description, Family,
                   Features__c, Benefits__c, Use_Cases__c,
                   Target_Audience__c, Competitive_Advantages__c
            FROM Product2
            WHERE IsActive = true
        """)

        count = 0
        for product in products["records"]:
            doc = SalesKnowledgeDocument(
                id=f"product_{product['Id']}",
                title=product["Name"],
                content=self._build_product_content(product),
                category=KnowledgeCategory.PRODUCTS,
                tags=[product.get("Family", "")],
                metadata={
                    "product_id": product["Id"],
                    "product_code": product.get("ProductCode"),
                    "family": product.get("Family")
                }
            )
            await self._index_document(doc)
            count += 1

        return count

    async def ingest_competitor_intel(self, competitor_docs: list) -> int:
        """导入竞品情报"""
        count = 0
        for doc_data in competitor_docs:
            doc = SalesKnowledgeDocument(
                id=f"competitor_{doc_data['competitor_name']}_{count}",
                title=f"竞品分析: {doc_data['competitor_name']}",
                content=doc_data["content"],
                category=KnowledgeCategory.COMPETITORS,
                tags=[doc_data["competitor_name"]],
                metadata={
                    "competitor": doc_data["competitor_name"],
                    "analysis_date": doc_data.get("date"),
                    "analyst": doc_data.get("analyst")
                }
            )
            await self._index_document(doc)
            count += 1

        return count

    async def ingest_case_studies(self, sf_client) -> int:
        """导入成功案例"""
        # 从 ContentDocument 或自定义对象获取
        cases = sf_client.query_all("""
            SELECT Id, Name, Account__c, Account__r.Name, Account__r.Industry,
                   Challenge__c, Solution__c, Results__c, Testimonial__c,
                   Products_Used__c, Deal_Size__c
            FROM Case_Study__c
            WHERE Status__c = 'Published'
        """)

        count = 0
        for case in cases["records"]:
            doc = SalesKnowledgeDocument(
                id=f"case_{case['Id']}",
                title=f"案例: {case['Name']}",
                content=self._build_case_content(case),
                category=KnowledgeCategory.CASE_STUDIES,
                tags=[
                    case.get("Account__r", {}).get("Industry", ""),
                    *case.get("Products_Used__c", "").split(";")
                ],
                metadata={
                    "account_name": case.get("Account__r", {}).get("Name"),
                    "industry": case.get("Account__r", {}).get("Industry"),
                    "deal_size": case.get("Deal_Size__c"),
                    "products": case.get("Products_Used__c")
                }
            )
            await self._index_document(doc)
            count += 1

        return count

    async def ingest_objection_handlers(self, objections: list) -> int:
        """导入异议处理话术"""
        count = 0
        for obj in objections:
            doc = SalesKnowledgeDocument(
                id=f"objection_{count}",
                title=f"异议处理: {obj['objection']}",
                content=f"""
## 常见异议
{obj['objection']}

## 应对策略
{obj['response']}

## 关键要点
{obj.get('key_points', '')}

## 示例话术
{obj.get('example_script', '')}
""",
                category=KnowledgeCategory.OBJECTIONS,
                tags=obj.get("tags", []),
                metadata={
                    "objection_type": obj.get("type"),
                    "effectiveness": obj.get("effectiveness_score")
                }
            )
            await self._index_document(doc)
            count += 1

        return count

    def _build_product_content(self, product: dict) -> str:
        """构建产品知识内容"""
        parts = [
            f"# {product['Name']}",
            f"产品编码: {product.get('ProductCode', 'N/A')}",
            f"产品系列: {product.get('Family', 'N/A')}",
            "",
            "## 产品描述",
            product.get("Description", "暂无描述"),
            "",
            "## 核心功能",
            product.get("Features__c", "暂无信息"),
            "",
            "## 客户价值",
            product.get("Benefits__c", "暂无信息"),
            "",
            "## 典型用例",
            product.get("Use_Cases__c", "暂无信息"),
            "",
            "## 目标客户",
            product.get("Target_Audience__c", "暂无信息"),
            "",
            "## 竞争优势",
            product.get("Competitive_Advantages__c", "暂无信息"),
        ]
        return "\n".join(parts)

    def _build_case_content(self, case: dict) -> str:
        """构建案例内容"""
        account = case.get("Account__r", {})
        parts = [
            f"# 客户成功案例: {case['Name']}",
            "",
            f"**客户**: {account.get('Name', 'N/A')}",
            f"**行业**: {account.get('Industry', 'N/A')}",
            f"**项目规模**: {case.get('Deal_Size__c', 'N/A')}",
            f"**使用产品**: {case.get('Products_Used__c', 'N/A')}",
            "",
            "## 客户挑战",
            case.get("Challenge__c", "暂无信息"),
            "",
            "## 解决方案",
            case.get("Solution__c", "暂无信息"),
            "",
            "## 实施成果",
            case.get("Results__c", "暂无信息"),
            "",
            "## 客户反馈",
            case.get("Testimonial__c", "暂无反馈"),
        ]
        return "\n".join(parts)

    async def _index_document(self, doc: SalesKnowledgeDocument):
        """索引文档"""
        # 生成嵌入
        doc.embedding = self.embedder.encode([doc.content])[0].tolist()

        # 向量存储
        self.vector_store.add(
            ids=[doc.id],
            embeddings=[doc.embedding],
            metadatas=[{
                "category": doc.category.value,
                "tags": ",".join(doc.tags),
                **doc.metadata
            }],
            documents=[doc.content]
        )

        # Elasticsearch 索引
        self.es.index(
            index="sales_knowledge",
            id=doc.id,
            document={
                "title": doc.title,
                "content": doc.content,
                "category": doc.category.value,
                "tags": doc.tags,
                **doc.metadata
            }
        )
```

### 4.2 销售 RAG 引擎

```python
# Sales RAG Engine

class SalesRAGEngine:
    """销售知识 RAG 引擎"""

    def __init__(
        self,
        embedder,
        vector_store,
        es_client,
        anthropic_client
    ):
        self.embedder = embedder
        self.vector_store = vector_store
        self.es = es_client
        self.anthropic = anthropic_client

    async def query(
        self,
        question: str,
        category: str = None,
        context: dict = None,
        top_k: int = 5
    ) -> dict:
        """
        查询销售知识库

        Returns:
            {
                "answer": str,
                "citations": list,
                "confidence": float,
                "related_products": list
            }
        """
        # 1. 混合检索
        docs = await self._hybrid_search(question, category, top_k)

        # 2. 生成答案
        answer = await self._generate_answer(question, docs, context)

        # 3. 提取相关产品
        related_products = self._extract_related_products(docs)

        return {
            "answer": answer["text"],
            "citations": answer["citations"],
            "confidence": answer["confidence"],
            "related_products": related_products
        }

    async def _hybrid_search(
        self,
        query: str,
        category: str = None,
        top_k: int = 5
    ) -> list:
        """混合检索"""
        # 向量检索
        query_embedding = self.embedder.encode([query])[0].tolist()

        vector_filter = {}
        if category:
            vector_filter["category"] = category

        vector_results = self.vector_store.query(
            query_embeddings=[query_embedding],
            n_results=top_k * 2,
            where=vector_filter if vector_filter else None
        )

        # 关键词检索
        es_query = {
            "query": {
                "bool": {
                    "must": {
                        "multi_match": {
                            "query": query,
                            "fields": ["title^3", "content^2", "tags"],
                            "type": "best_fields"
                        }
                    }
                }
            },
            "size": top_k * 2
        }

        if category:
            es_query["query"]["bool"]["filter"] = {"term": {"category": category}}

        es_results = self.es.search(index="sales_knowledge", body=es_query)

        # RRF 融合
        combined = self._rrf_fusion(vector_results, es_results)

        return combined[:top_k]

    async def _generate_answer(
        self,
        question: str,
        docs: list,
        context: dict
    ) -> dict:
        """生成答案"""
        # 构建上下文
        context_str = "\n\n".join([
            f"[来源 {i+1}] {doc['title']}\n{doc['content'][:800]}"
            for i, doc in enumerate(docs)
        ])

        sf_context = ""
        if context:
            if "account_name" in context:
                sf_context += f"当前客户: {context['account_name']}\n"
            if "opportunity_name" in context:
                sf_context += f"当前商机: {context['opportunity_name']}\n"
            if "stage" in context:
                sf_context += f"销售阶段: {context['stage']}\n"

        prompt = f"""你是一个专业的销售知识助手。请根据以下知识库内容回答销售人员的问题。

{f'## 当前上下文\n{sf_context}\n' if sf_context else ''}

## 知识库内容
{context_str}

## 销售人员问题
{question}

请:
1. 准确回答问题，使用知识库中的信息
2. 使用专业但易懂的语言
3. 标注引用来源 [1], [2] 等
4. 如果知识库信息不足以完全回答，请明确说明
5. 如果有相关的销售建议，请一并提供

用中文回答。"""

        message = self.anthropic.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}]
        )

        answer_text = message.content[0].text

        # 提取引用
        citations = self._extract_citations(answer_text, docs)

        # 计算置信度
        confidence = self._calculate_confidence(docs, answer_text)

        return {
            "text": answer_text,
            "citations": citations,
            "confidence": confidence
        }

    def _rrf_fusion(self, vector_results, es_results, k: int = 60) -> list:
        """Reciprocal Rank Fusion"""
        scores = {}

        # 处理向量结果
        for i, (doc_id, doc) in enumerate(zip(
            vector_results["ids"][0],
            vector_results["documents"][0]
        )):
            scores[doc_id] = scores.get(doc_id, 0) + 1 / (k + i + 1)

        # 处理 ES 结果
        for i, hit in enumerate(es_results["hits"]["hits"]):
            doc_id = hit["_id"]
            scores[doc_id] = scores.get(doc_id, 0) + 1 / (k + i + 1)

        # 排序并返回
        sorted_ids = sorted(scores.keys(), key=lambda x: scores[x], reverse=True)

        # 获取文档内容
        results = []
        for doc_id in sorted_ids:
            # 从 ES 获取完整文档
            doc = self.es.get(index="sales_knowledge", id=doc_id)
            results.append({
                "id": doc_id,
                "title": doc["_source"]["title"],
                "content": doc["_source"]["content"],
                "category": doc["_source"]["category"],
                "score": scores[doc_id]
            })

        return results
```

---

## 五、自然语言数据查询

### 5.1 NL to SOQL 转换器

```python
# Natural Language to SOQL Converter

class NLToSOQLConverter:
    """自然语言转 SOQL"""

    def __init__(self, anthropic_client, sf_client):
        self.anthropic = anthropic_client
        self.sf = sf_client

        # 缓存 Schema
        self._schema_cache = {}

    async def convert(
        self,
        nl_query: str,
        entities: dict = None,
        context: dict = None
    ) -> dict:
        """
        转换自然语言为 SOQL

        Returns:
            {
                "soql": str,
                "explanation": str,
                "objects_used": list
            }
        """
        # 1. 获取相关 Schema
        relevant_objects = await self._identify_relevant_objects(nl_query)
        schemas = await self._get_schemas(relevant_objects)

        # 2. 生成 SOQL
        soql_result = await self._generate_soql(nl_query, schemas, entities, context)

        # 3. 验证 SOQL
        validated = await self._validate_soql(soql_result["soql"])

        if not validated["valid"]:
            # 尝试修复
            soql_result = await self._fix_soql(
                soql_result["soql"],
                validated["error"],
                schemas
            )

        return {
            "soql": soql_result["soql"],
            "explanation": soql_result["explanation"],
            "objects_used": relevant_objects
        }

    async def _identify_relevant_objects(self, query: str) -> list:
        """识别相关的 Salesforce 对象"""
        # 常见销售对象
        sales_objects = {
            "Opportunity": ["商机", "deal", "opportunity", "机会", "项目"],
            "Account": ["客户", "account", "公司", "企业"],
            "Contact": ["联系人", "contact", "负责人"],
            "Lead": ["线索", "lead", "潜在客户"],
            "Task": ["任务", "task", "活动", "待办"],
            "Event": ["事件", "event", "会议", "拜访"],
            "Quote": ["报价", "quote", "报价单"],
            "Contract": ["合同", "contract"],
            "Product2": ["产品", "product"],
            "User": ["用户", "销售", "rep", "代表"]
        }

        query_lower = query.lower()
        relevant = []

        for obj, keywords in sales_objects.items():
            if any(kw in query_lower for kw in keywords):
                relevant.append(obj)

        # 默认包含 Opportunity
        if not relevant:
            relevant = ["Opportunity"]

        return relevant

    async def _get_schemas(self, objects: list) -> dict:
        """获取对象 Schema"""
        schemas = {}

        for obj in objects:
            if obj not in self._schema_cache:
                desc = getattr(self.sf, obj).describe()
                self._schema_cache[obj] = {
                    "name": obj,
                    "fields": [
                        {
                            "name": f["name"],
                            "label": f["label"],
                            "type": f["type"],
                            "referenceTo": f.get("referenceTo", [])
                        }
                        for f in desc["fields"]
                        if f["type"] not in ["address", "location"]  # 排除复杂类型
                    ][:50]  # 限制字段数量
                }

            schemas[obj] = self._schema_cache[obj]

        return schemas

    async def _generate_soql(
        self,
        query: str,
        schemas: dict,
        entities: dict,
        context: dict
    ) -> dict:
        """生成 SOQL"""
        schema_str = json.dumps(schemas, ensure_ascii=False, indent=2)

        # 构建上下文
        context_hints = []
        if context:
            if "user_id" in context:
                context_hints.append(f"当前用户 ID: {context['user_id']}")
            if "account_id" in context:
                context_hints.append(f"当前客户 ID: {context['account_id']}")

        if entities:
            if entities.get("time_range"):
                context_hints.append(f"时间范围: {entities['time_range']}")
            if entities.get("account_name"):
                context_hints.append(f"提到的客户: {entities['account_name']}")

        prompt = f"""你是一个 Salesforce SOQL 专家。请将以下自然语言查询转换为 SOQL。

## 可用对象 Schema
{schema_str}

## 上下文信息
{chr(10).join(context_hints) if context_hints else '无'}

## 用户查询
{query}

请返回 JSON 格式:
{{
    "soql": "SELECT ... FROM ... WHERE ...",
    "explanation": "查询说明"
}}

注意:
1. 使用正确的字段 API 名称
2. 日期函数使用 SOQL 语法 (THIS_MONTH, LAST_N_DAYS:30 等)
3. 聚合查询使用 GROUP BY
4. 如需关联查询，使用正确的关系名称

只返回 JSON。"""

        message = self.anthropic.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=500,
            messages=[{"role": "user", "content": prompt}]
        )

        result = json.loads(message.content[0].text)
        return result

    async def _validate_soql(self, soql: str) -> dict:
        """验证 SOQL 语法"""
        try:
            # 尝试执行带 LIMIT 1 的查询
            test_soql = soql.rstrip(";")
            if "LIMIT" not in test_soql.upper():
                test_soql += " LIMIT 1"

            self.sf.query(test_soql)
            return {"valid": True}

        except Exception as e:
            return {"valid": False, "error": str(e)}

    async def _fix_soql(self, soql: str, error: str, schemas: dict) -> dict:
        """修复 SOQL 错误"""
        prompt = f"""以下 SOQL 查询有错误，请修复:

SOQL: {soql}
错误: {error}

可用 Schema:
{json.dumps(schemas, ensure_ascii=False)}

请返回修复后的 SOQL (只返回 SOQL，不要其他文字)。"""

        message = self.anthropic.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=300,
            messages=[{"role": "user", "content": prompt}]
        )

        fixed_soql = message.content[0].text.strip()

        return {
            "soql": fixed_soql,
            "explanation": "已自动修复 SOQL 语法错误"
        }


class SalesDataQueryEngine:
    """销售数据查询引擎"""

    def __init__(self, converter: NLToSOQLConverter, sf_client, anthropic_client):
        self.converter = converter
        self.sf = sf_client
        self.anthropic = anthropic_client

    async def execute(
        self,
        query: str,
        entities: dict = None,
        context: dict = None
    ) -> dict:
        """
        执行自然语言数据查询

        Returns:
            {
                "data": list,
                "summary": str,
                "visualization": dict | None,
                "soql": str
            }
        """
        # 1. 转换为 SOQL
        conversion = await self.converter.convert(query, entities, context)
        soql = conversion["soql"]

        # 2. 执行查询
        try:
            result = self.sf.query_all(soql)
            records = result["records"]
        except Exception as e:
            return {
                "data": [],
                "summary": f"查询执行失败: {e}",
                "soql": soql
            }

        # 3. 生成摘要
        summary = await self._generate_summary(query, records)

        # 4. 建议可视化
        visualization = self._suggest_visualization(query, records)

        return {
            "data": records,
            "total_count": result["totalSize"],
            "summary": summary,
            "visualization": visualization,
            "soql": soql
        }

    async def _generate_summary(self, query: str, records: list) -> str:
        """生成数据摘要"""
        if not records:
            return "未找到符合条件的数据。"

        # 简化记录用于摘要
        sample = records[:10]
        sample_str = json.dumps(sample, ensure_ascii=False, default=str)[:2000]

        prompt = f"""根据以下数据，用一段话回答用户的问题。

用户问题: {query}

查询结果 (共 {len(records)} 条):
{sample_str}

请用简洁的中文回答，包含关键数字和洞察。"""

        message = self.anthropic.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=300,
            messages=[{"role": "user", "content": prompt}]
        )

        return message.content[0].text

    def _suggest_visualization(self, query: str, records: list) -> dict | None:
        """建议可视化类型"""
        if not records:
            return None

        query_lower = query.lower()

        # 趋势类
        if any(kw in query_lower for kw in ["趋势", "变化", "走势", "历史"]):
            return {"type": "line", "x_field": "CloseDate", "y_field": "Amount"}

        # 分布类
        if any(kw in query_lower for kw in ["分布", "比例", "占比", "构成"]):
            return {"type": "pie", "category_field": "StageName", "value_field": "Amount"}

        # 对比类
        if any(kw in query_lower for kw in ["对比", "比较", "排名", "top"]):
            return {"type": "bar", "x_field": "Name", "y_field": "Amount"}

        # 默认表格
        return {"type": "table"}
```

---

## 六、LWC 组件

### 6.1 销售助手组件

```javascript
// revenueIntelligenceAssistant.js
import { LightningElement, api, track, wire } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import askSalesQuestion from '@salesforce/apex/RevenueIntelligenceController.askQuestion';

export default class RevenueIntelligenceAssistant extends LightningElement {
    @api recordId;
    @api objectApiName;

    @track query = '';
    @track isLoading = false;
    @track result = null;
    @track error = null;
    @track conversationHistory = [];

    // 快捷查询
    quickQueries = [
        { label: '本月管道金额', query: '本月的销售管道总金额是多少？' },
        { label: '预测完成率', query: '本季度预测完成率如何？' },
        { label: '产品介绍', query: '介绍一下我们的核心产品' },
        { label: '竞品对比', query: '与主要竞品相比我们有什么优势？' },
        { label: '相似案例', query: '有没有类似行业的成功案例？' },
        { label: '异议处理', query: '客户说价格太贵怎么回应？' }
    ];

    handleQueryChange(event) {
        this.query = event.target.value;
    }

    handleQuickQuery(event) {
        this.query = event.currentTarget.dataset.query;
        this.handleSubmit();
    }

    async handleSubmit() {
        if (!this.query.trim()) return;

        this.isLoading = true;
        this.error = null;

        // 添加到对话历史
        this.conversationHistory.push({
            type: 'user',
            content: this.query,
            timestamp: new Date().toISOString()
        });

        try {
            const context = this.buildContext();

            const response = await askSalesQuestion({
                query: this.query,
                contextJson: JSON.stringify(context)
            });

            const parsed = JSON.parse(response);

            this.result = parsed;

            // 添加助手回复到历史
            this.conversationHistory.push({
                type: 'assistant',
                content: parsed.answer || parsed.summary,
                citations: parsed.citations,
                data: parsed.data,
                timestamp: new Date().toISOString()
            });

            // 清空输入
            this.query = '';

        } catch (error) {
            this.error = error.body?.message || '查询失败';
        } finally {
            this.isLoading = false;
        }
    }

    buildContext() {
        const context = {
            recordId: this.recordId,
            objectApiName: this.objectApiName
        };

        // 根据当前页面添加上下文
        if (this.objectApiName === 'Opportunity') {
            context.opportunity_id = this.recordId;
        } else if (this.objectApiName === 'Account') {
            context.account_id = this.recordId;
        }

        return context;
    }

    get hasData() {
        return this.result?.data && this.result.data.length > 0;
    }

    get showVisualization() {
        return this.result?.visualization && this.result.visualization.type !== 'table';
    }

    get dataColumns() {
        if (!this.result?.data?.length) return [];

        const firstRecord = this.result.data[0];
        return Object.keys(firstRecord)
            .filter(key => key !== 'attributes')
            .map(key => ({
                label: key,
                fieldName: key,
                type: 'text'
            }));
    }
}
```

---

## 七、MVP 开发计划

### Week 1: 查询理解
| Day | 任务 | 交付物 |
|-----|------|--------|
| 1-2 | 意图分类器 | SalesIntentClassifier |
| 3-4 | 查询路由器 | SalesQueryRouter |
| 5 | 实体提取 | EntityExtractor |

### Week 2: 知识 RAG
| Day | 任务 | 交付物 |
|-----|------|--------|
| 1-2 | 知识库结构 + 导入 | SalesKnowledgeIngester |
| 3-4 | RAG 引擎 | SalesRAGEngine |
| 5 | 答案生成 + 引用 | Answer Generator |

### Week 3: 数据查询
| Day | 任务 | 交付物 |
|-----|------|--------|
| 1-2 | NL to SOQL | NLToSOQLConverter |
| 3-4 | 查询执行 + 摘要 | SalesDataQueryEngine |
| 5 | 可视化建议 | Visualization |

### Week 4: 集成与部署
| Day | 任务 | 交付物 |
|-----|------|--------|
| 1-2 | LWC 组件 | revenueIntelligenceAssistant |
| 3-4 | Apex Controller | RevenueIntelligenceController |
| 5 | 部署与文档 | AppExchange 包 |

---

## 八、成功指标

### 业务指标
| 指标 | 目标 | 测量方式 |
|------|------|----------|
| 销售准备时间 | -40% | 用户调研 |
| 新人上手时间 | -30% | 培训反馈 |
| 用户满意度 | >85% | NPS 调查 |

### 技术指标
| 指标 | 目标 | 测量方式 |
|------|------|----------|
| 查询响应时间 | <3s | 监控日志 |
| SOQL 转换准确率 | >90% | 手动评测 |
| 知识检索准确率 | >85% | 人工评测 |

---

## 参考资料

- [Salesforce Sales Cloud API](https://developer.salesforce.com/docs/atlas.en-us.api.meta/api/)
- [SOQL Reference](https://developer.salesforce.com/docs/atlas.en-us.soql_sosl.meta/soql_sosl/)
- [LWC Developer Guide](https://developer.salesforce.com/docs/component-library/documentation/en/lwc)
