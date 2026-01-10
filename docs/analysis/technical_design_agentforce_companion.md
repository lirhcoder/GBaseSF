# Agentforce Companion 技术设计方案

> **版本**: 1.0
> **日期**: 2026-01-10
> **评分**: 7.6/10 (Priority #4)
> **状态**: 技术设计

---

## 一、产品概述

### 定位
**"让 Agentforce 更强大"**

补充 Agentforce 缺失的能力，而非替代。

### 市场验证
| 数据点 | 数值 | 意义 |
|--------|------|------|
| Agentic AI 市场 (2034) | $200B | 巨大增长空间 |
| CIO Agentic AI 计划 | 96% 计划 2 年内使用 | 需求确认 |
| AgentExchange Apps | 55 → 122 (2025) | 生态成长 |
| AI 预算用于 Agentic AI | 30% | 预算验证 |

### 补充定位 (基于 Agentforce 真实限制)

| Agentforce 限制 | Companion 补充 | 价值 |
|-----------------|----------------|------|
| 60 秒执行超时 | 长流程后台执行 | 复杂任务完成 |
| 20 Agent 限制 | Agent 编排层 | 突破限制 |
| MCP 刚起步 (GA Feb 2026) | 成熟 MCP 工具集 | 提前获得能力 |
| 数据质量依赖 | 数据预处理 + RAG | 提升 Agent 准确性 |
| "自信犯错" 问题 | Knowledge Grounding | 降低幻觉 |

---

## 二、系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                      Agentforce Companion                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   MCP Server Layer                         │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐ │   │
│  │  │ Salesforce  │ │ Knowledge   │ │ Long-Running        │ │   │
│  │  │ MCP Tools   │ │ MCP Tools   │ │ Task Tools          │ │   │
│  │  └─────────────┘ └─────────────┘ └─────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   Orchestration Layer                      │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐ │   │
│  │  │ Agent       │ │ Task Queue  │ │ State               │ │   │
│  │  │ Router      │ │ Manager     │ │ Manager             │ │   │
│  │  └─────────────┘ └─────────────┘ └─────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   Knowledge Layer                          │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐ │   │
│  │  │ RAG         │ │ Fact        │ │ Citation            │ │   │
│  │  │ Engine      │ │ Checker     │ │ Generator           │ │   │
│  │  └─────────────┘ └─────────────┘ └─────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   Analytics Layer                          │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐ │   │
│  │  │ Performance │ │ Usage       │ │ Cost                │ │   │
│  │  │ Tracker     │ │ Analytics   │ │ Optimizer           │ │   │
│  │  └─────────────┘ └─────────────┘ └─────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Salesforce Integration Layer                  │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌────────────────┐   │   │
│  │  │ Agent API    │ │ Streaming    │ │ Platform       │   │   │
│  │  │              │ │ API          │ │ Events         │   │   │
│  │  └──────────────┘ └──────────────┘ └────────────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 三、MCP Server 实现

### 3.1 Salesforce MCP Tools

```python
# Salesforce MCP Server

from mcp.server import Server
from mcp.types import Tool, TextContent
from simple_salesforce import Salesforce
import json

class SalesforceMCPServer:
    """Salesforce MCP 工具服务器"""

    def __init__(self, sf_client: Salesforce):
        self.sf = sf_client
        self.server = Server("salesforce-companion")
        self._register_tools()

    def _register_tools(self):
        """注册所有工具"""

        # SOQL 查询
        @self.server.tool("salesforce_query")
        async def query_salesforce(soql: str) -> str:
            """
            Execute a SOQL query against Salesforce.

            Args:
                soql: The SOQL query string

            Returns:
                JSON string of query results
            """
            try:
                result = self.sf.query_all(soql)
                return json.dumps({
                    "success": True,
                    "total_size": result["totalSize"],
                    "records": result["records"][:100]  # 限制返回数量
                }, ensure_ascii=False, default=str)
            except Exception as e:
                return json.dumps({"success": False, "error": str(e)})

        # 记录创建
        @self.server.tool("salesforce_create")
        async def create_record(object_name: str, fields: dict) -> str:
            """
            Create a new record in Salesforce.

            Args:
                object_name: The Salesforce object API name
                fields: Dictionary of field values

            Returns:
                JSON with created record ID or error
            """
            try:
                result = getattr(self.sf, object_name).create(fields)
                return json.dumps({
                    "success": True,
                    "id": result["id"]
                })
            except Exception as e:
                return json.dumps({"success": False, "error": str(e)})

        # 记录更新
        @self.server.tool("salesforce_update")
        async def update_record(object_name: str, record_id: str, fields: dict) -> str:
            """
            Update an existing record in Salesforce.

            Args:
                object_name: The Salesforce object API name
                record_id: The record ID to update
                fields: Dictionary of field values to update

            Returns:
                JSON with success status or error
            """
            try:
                getattr(self.sf, object_name).update(record_id, fields)
                return json.dumps({"success": True, "id": record_id})
            except Exception as e:
                return json.dumps({"success": False, "error": str(e)})

        # 记录删除
        @self.server.tool("salesforce_delete")
        async def delete_record(object_name: str, record_id: str) -> str:
            """
            Delete a record from Salesforce.

            Args:
                object_name: The Salesforce object API name
                record_id: The record ID to delete

            Returns:
                JSON with success status or error
            """
            try:
                getattr(self.sf, object_name).delete(record_id)
                return json.dumps({"success": True, "id": record_id})
            except Exception as e:
                return json.dumps({"success": False, "error": str(e)})

        # 描述对象
        @self.server.tool("salesforce_describe")
        async def describe_object(object_name: str) -> str:
            """
            Get metadata about a Salesforce object.

            Args:
                object_name: The Salesforce object API name

            Returns:
                JSON with object fields and metadata
            """
            try:
                desc = getattr(self.sf, object_name).describe()
                fields = [
                    {
                        "name": f["name"],
                        "label": f["label"],
                        "type": f["type"],
                        "required": not f["nillable"] and not f["defaultedOnCreate"]
                    }
                    for f in desc["fields"]
                ]
                return json.dumps({
                    "success": True,
                    "name": desc["name"],
                    "label": desc["label"],
                    "fields": fields
                }, ensure_ascii=False)
            except Exception as e:
                return json.dumps({"success": False, "error": str(e)})

        # 搜索 (SOSL)
        @self.server.tool("salesforce_search")
        async def search_salesforce(search_term: str, objects: list = None) -> str:
            """
            Search Salesforce using SOSL.

            Args:
                search_term: The term to search for
                objects: Optional list of objects to search in

            Returns:
                JSON with search results
            """
            try:
                if objects:
                    object_clause = ", ".join([f"{obj}(Id, Name)" for obj in objects])
                else:
                    object_clause = "Account(Id, Name), Contact(Id, Name), Opportunity(Id, Name)"

                sosl = f"FIND {{{search_term}}} IN ALL FIELDS RETURNING {object_clause}"
                result = self.sf.search(sosl)

                return json.dumps({
                    "success": True,
                    "results": result["searchRecords"]
                }, ensure_ascii=False, default=str)
            except Exception as e:
                return json.dumps({"success": False, "error": str(e)})

        # 报表执行
        @self.server.tool("salesforce_run_report")
        async def run_report(report_id: str, filters: dict = None) -> str:
            """
            Run a Salesforce report and get results.

            Args:
                report_id: The report ID
                filters: Optional filter values

            Returns:
                JSON with report data
            """
            try:
                report = self.sf.restful(
                    f"analytics/reports/{report_id}",
                    method="POST",
                    data=json.dumps({"reportMetadata": {"reportFilters": filters or []}})
                )

                # 简化结果
                fact_map = report.get("factMap", {})
                aggregates = fact_map.get("T!T", {}).get("aggregates", [])

                return json.dumps({
                    "success": True,
                    "report_id": report_id,
                    "aggregates": aggregates,
                    "row_count": len(fact_map)
                }, ensure_ascii=False, default=str)
            except Exception as e:
                return json.dumps({"success": False, "error": str(e)})

    def get_tools(self) -> list[Tool]:
        """获取所有可用工具"""
        return [
            Tool(
                name="salesforce_query",
                description="Execute a SOQL query against Salesforce to retrieve records",
                input_schema={
                    "type": "object",
                    "properties": {
                        "soql": {
                            "type": "string",
                            "description": "The SOQL query string"
                        }
                    },
                    "required": ["soql"]
                }
            ),
            Tool(
                name="salesforce_create",
                description="Create a new record in Salesforce",
                input_schema={
                    "type": "object",
                    "properties": {
                        "object_name": {"type": "string"},
                        "fields": {"type": "object"}
                    },
                    "required": ["object_name", "fields"]
                }
            ),
            Tool(
                name="salesforce_update",
                description="Update an existing Salesforce record",
                input_schema={
                    "type": "object",
                    "properties": {
                        "object_name": {"type": "string"},
                        "record_id": {"type": "string"},
                        "fields": {"type": "object"}
                    },
                    "required": ["object_name", "record_id", "fields"]
                }
            ),
            Tool(
                name="salesforce_delete",
                description="Delete a Salesforce record",
                input_schema={
                    "type": "object",
                    "properties": {
                        "object_name": {"type": "string"},
                        "record_id": {"type": "string"}
                    },
                    "required": ["object_name", "record_id"]
                }
            ),
            Tool(
                name="salesforce_describe",
                description="Get metadata about a Salesforce object",
                input_schema={
                    "type": "object",
                    "properties": {
                        "object_name": {"type": "string"}
                    },
                    "required": ["object_name"]
                }
            ),
            Tool(
                name="salesforce_search",
                description="Search Salesforce using full-text search",
                input_schema={
                    "type": "object",
                    "properties": {
                        "search_term": {"type": "string"},
                        "objects": {"type": "array", "items": {"type": "string"}}
                    },
                    "required": ["search_term"]
                }
            ),
            Tool(
                name="salesforce_run_report",
                description="Run a Salesforce report",
                input_schema={
                    "type": "object",
                    "properties": {
                        "report_id": {"type": "string"},
                        "filters": {"type": "object"}
                    },
                    "required": ["report_id"]
                }
            )
        ]

    async def run(self, transport):
        """启动 MCP 服务器"""
        await self.server.run(transport)
```

### 3.2 Knowledge MCP Tools

```python
# Knowledge Grounding MCP Tools

from mcp.server import Server
from mcp.types import Tool
import json

class KnowledgeMCPServer:
    """知识增强 MCP 工具服务器"""

    def __init__(self, rag_engine, fact_checker):
        self.rag = rag_engine
        self.fact_checker = fact_checker
        self.server = Server("knowledge-companion")
        self._register_tools()

    def _register_tools(self):
        """注册知识工具"""

        # RAG 查询
        @self.server.tool("knowledge_query")
        async def query_knowledge(
            question: str,
            context: dict = None,
            max_sources: int = 5
        ) -> str:
            """
            Query the knowledge base with RAG.

            Args:
                question: The question to answer
                context: Optional Salesforce context (Account, Case, etc.)
                max_sources: Maximum number of sources to include

            Returns:
                JSON with answer and citations
            """
            try:
                result = await self.rag.query(
                    question=question,
                    context=context,
                    top_k=max_sources
                )

                return json.dumps({
                    "success": True,
                    "answer": result["answer"],
                    "citations": result["citations"],
                    "confidence": result["confidence"]
                }, ensure_ascii=False)

            except Exception as e:
                return json.dumps({"success": False, "error": str(e)})

        # 事实核查
        @self.server.tool("fact_check")
        async def check_facts(
            statement: str,
            knowledge_sources: list = None
        ) -> str:
            """
            Verify a statement against knowledge base.

            Args:
                statement: The statement to verify
                knowledge_sources: Optional specific sources to check against

            Returns:
                JSON with verification result
            """
            try:
                result = await self.fact_checker.verify(
                    statement=statement,
                    sources=knowledge_sources
                )

                return json.dumps({
                    "success": True,
                    "verified": result["verified"],
                    "confidence": result["confidence"],
                    "supporting_evidence": result["evidence"],
                    "contradictions": result["contradictions"]
                }, ensure_ascii=False)

            except Exception as e:
                return json.dumps({"success": False, "error": str(e)})

        # 文档搜索
        @self.server.tool("document_search")
        async def search_documents(
            query: str,
            document_types: list = None,
            date_range: dict = None
        ) -> str:
            """
            Search internal documents and files.

            Args:
                query: Search query
                document_types: Filter by document types (pdf, docx, etc.)
                date_range: Filter by date range

            Returns:
                JSON with matching documents
            """
            try:
                results = await self.rag.search_documents(
                    query=query,
                    types=document_types,
                    date_range=date_range
                )

                return json.dumps({
                    "success": True,
                    "documents": [
                        {
                            "id": doc["id"],
                            "title": doc["title"],
                            "type": doc["type"],
                            "snippet": doc["snippet"],
                            "url": doc.get("url"),
                            "score": doc["score"]
                        }
                        for doc in results
                    ]
                }, ensure_ascii=False)

            except Exception as e:
                return json.dumps({"success": False, "error": str(e)})

        # 获取相似案例
        @self.server.tool("find_similar_cases")
        async def find_similar_cases(
            case_description: str,
            limit: int = 5
        ) -> str:
            """
            Find similar past cases based on description.

            Args:
                case_description: Description of the current case
                limit: Maximum number of cases to return

            Returns:
                JSON with similar cases and resolutions
            """
            try:
                cases = await self.rag.find_similar(
                    content=case_description,
                    category="cases",
                    limit=limit
                )

                return json.dumps({
                    "success": True,
                    "similar_cases": [
                        {
                            "case_number": c["case_number"],
                            "subject": c["subject"],
                            "resolution": c["resolution"],
                            "similarity": c["score"]
                        }
                        for c in cases
                    ]
                }, ensure_ascii=False)

            except Exception as e:
                return json.dumps({"success": False, "error": str(e)})

    def get_tools(self) -> list[Tool]:
        """获取所有知识工具"""
        return [
            Tool(
                name="knowledge_query",
                description="Query the knowledge base for answers with citations",
                input_schema={
                    "type": "object",
                    "properties": {
                        "question": {"type": "string"},
                        "context": {"type": "object"},
                        "max_sources": {"type": "integer", "default": 5}
                    },
                    "required": ["question"]
                }
            ),
            Tool(
                name="fact_check",
                description="Verify a statement against the knowledge base",
                input_schema={
                    "type": "object",
                    "properties": {
                        "statement": {"type": "string"},
                        "knowledge_sources": {"type": "array", "items": {"type": "string"}}
                    },
                    "required": ["statement"]
                }
            ),
            Tool(
                name="document_search",
                description="Search internal documents and files",
                input_schema={
                    "type": "object",
                    "properties": {
                        "query": {"type": "string"},
                        "document_types": {"type": "array", "items": {"type": "string"}},
                        "date_range": {"type": "object"}
                    },
                    "required": ["query"]
                }
            ),
            Tool(
                name="find_similar_cases",
                description="Find similar past cases with resolutions",
                input_schema={
                    "type": "object",
                    "properties": {
                        "case_description": {"type": "string"},
                        "limit": {"type": "integer", "default": 5}
                    },
                    "required": ["case_description"]
                }
            )
        ]
```

---

## 四、长流程任务引擎

### 4.1 任务队列系统

```python
# Long-Running Task Engine

from dataclasses import dataclass
from enum import Enum
from typing import Callable, Any
import asyncio
import uuid
import json
from datetime import datetime
import redis.asyncio as redis

class TaskStatus(Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class TaskPriority(Enum):
    LOW = 0
    NORMAL = 1
    HIGH = 2
    URGENT = 3

@dataclass
class LongRunningTask:
    id: str
    name: str
    description: str
    handler: str  # Handler function name
    params: dict
    status: TaskStatus = TaskStatus.PENDING
    priority: TaskPriority = TaskPriority.NORMAL
    created_at: str = None
    started_at: str = None
    completed_at: str = None
    result: Any = None
    error: str = None
    progress: float = 0.0
    progress_message: str = None

class LongRunningTaskEngine:
    """长流程任务引擎 - 突破 Agentforce 60 秒限制"""

    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        self.handlers: dict[str, Callable] = {}
        self.running_tasks: dict[str, asyncio.Task] = {}

    def register_handler(self, name: str, handler: Callable):
        """注册任务处理器"""
        self.handlers[name] = handler

    async def submit_task(
        self,
        name: str,
        handler: str,
        params: dict,
        priority: TaskPriority = TaskPriority.NORMAL
    ) -> str:
        """
        提交长流程任务

        Returns:
            任务 ID，可用于查询状态
        """
        task_id = str(uuid.uuid4())

        task = LongRunningTask(
            id=task_id,
            name=name,
            description=f"Long-running task: {name}",
            handler=handler,
            params=params,
            priority=priority,
            created_at=datetime.now().isoformat()
        )

        # 保存到 Redis
        await self.redis.hset(
            f"task:{task_id}",
            mapping={
                "data": json.dumps(task.__dict__, default=str),
                "status": task.status.value
            }
        )

        # 加入队列
        await self.redis.zadd(
            "task_queue",
            {task_id: priority.value}
        )

        return task_id

    async def get_task_status(self, task_id: str) -> dict:
        """获取任务状态"""
        data = await self.redis.hget(f"task:{task_id}", "data")
        if not data:
            return {"error": "Task not found"}

        task_dict = json.loads(data)
        return {
            "id": task_id,
            "status": task_dict.get("status"),
            "progress": task_dict.get("progress", 0),
            "progress_message": task_dict.get("progress_message"),
            "result": task_dict.get("result"),
            "error": task_dict.get("error")
        }

    async def cancel_task(self, task_id: str) -> bool:
        """取消任务"""
        if task_id in self.running_tasks:
            self.running_tasks[task_id].cancel()
            del self.running_tasks[task_id]

        await self._update_task_status(task_id, TaskStatus.CANCELLED)
        return True

    async def start_worker(self):
        """启动任务工作器"""
        while True:
            try:
                # 从队列获取任务
                result = await self.redis.zpopmax("task_queue")
                if not result:
                    await asyncio.sleep(1)
                    continue

                task_id = result[0][0]
                await self._execute_task(task_id)

            except Exception as e:
                print(f"Worker error: {e}")
                await asyncio.sleep(5)

    async def _execute_task(self, task_id: str):
        """执行任务"""
        data = await self.redis.hget(f"task:{task_id}", "data")
        if not data:
            return

        task_dict = json.loads(data)

        # 更新状态为运行中
        task_dict["status"] = TaskStatus.RUNNING.value
        task_dict["started_at"] = datetime.now().isoformat()
        await self.redis.hset(f"task:{task_id}", "data", json.dumps(task_dict))

        try:
            handler = self.handlers.get(task_dict["handler"])
            if not handler:
                raise ValueError(f"Unknown handler: {task_dict['handler']}")

            # 创建进度回调
            async def update_progress(progress: float, message: str = None):
                task_dict["progress"] = progress
                task_dict["progress_message"] = message
                await self.redis.hset(f"task:{task_id}", "data", json.dumps(task_dict))

            # 执行任务
            result = await handler(
                **task_dict["params"],
                progress_callback=update_progress
            )

            # 更新完成状态
            task_dict["status"] = TaskStatus.COMPLETED.value
            task_dict["completed_at"] = datetime.now().isoformat()
            task_dict["result"] = result
            task_dict["progress"] = 1.0

        except Exception as e:
            task_dict["status"] = TaskStatus.FAILED.value
            task_dict["completed_at"] = datetime.now().isoformat()
            task_dict["error"] = str(e)

        await self.redis.hset(f"task:{task_id}", "data", json.dumps(task_dict, default=str))

    async def _update_task_status(self, task_id: str, status: TaskStatus):
        """更新任务状态"""
        data = await self.redis.hget(f"task:{task_id}", "data")
        if data:
            task_dict = json.loads(data)
            task_dict["status"] = status.value
            await self.redis.hset(f"task:{task_id}", "data", json.dumps(task_dict))
```

### 4.2 预置任务处理器

```python
# Pre-built Task Handlers

class TaskHandlers:
    """预置的长流程任务处理器"""

    def __init__(self, sf_client, anthropic_client):
        self.sf = sf_client
        self.anthropic = anthropic_client

    async def bulk_data_update(
        self,
        object_name: str,
        query: str,
        update_fields: dict,
        progress_callback=None
    ) -> dict:
        """
        批量数据更新 - 可能需要几分钟

        Args:
            object_name: Salesforce 对象
            query: SOQL 查询定位要更新的记录
            update_fields: 更新的字段值
        """
        # 查询记录
        records = self.sf.query_all(query)
        total = records["totalSize"]
        updated = 0
        errors = []

        for i, record in enumerate(records["records"]):
            try:
                getattr(self.sf, object_name).update(
                    record["Id"],
                    update_fields
                )
                updated += 1
            except Exception as e:
                errors.append({"id": record["Id"], "error": str(e)})

            # 更新进度
            if progress_callback and i % 10 == 0:
                await progress_callback(
                    (i + 1) / total,
                    f"已更新 {updated}/{total} 条记录"
                )

        return {
            "total": total,
            "updated": updated,
            "errors": errors
        }

    async def complex_report_generation(
        self,
        report_config: dict,
        output_format: str = "pdf",
        progress_callback=None
    ) -> dict:
        """
        复杂报告生成 - 聚合多个数据源

        Args:
            report_config: 报告配置
            output_format: 输出格式
        """
        sections = report_config.get("sections", [])
        results = []

        for i, section in enumerate(sections):
            if progress_callback:
                await progress_callback(
                    i / len(sections),
                    f"处理第 {i+1}/{len(sections)} 部分: {section['name']}"
                )

            # 执行查询
            if section["type"] == "soql":
                data = self.sf.query_all(section["query"])
                results.append({
                    "name": section["name"],
                    "data": data["records"]
                })

            elif section["type"] == "aggregate":
                # 聚合计算
                agg_data = await self._calculate_aggregates(section)
                results.append({
                    "name": section["name"],
                    "data": agg_data
                })

        # 生成报告
        if progress_callback:
            await progress_callback(0.9, "生成报告文件...")

        report_url = await self._generate_report_file(results, output_format)

        return {
            "report_url": report_url,
            "sections_count": len(sections),
            "format": output_format
        }

    async def ai_data_enrichment(
        self,
        object_name: str,
        query: str,
        enrichment_prompt: str,
        target_field: str,
        progress_callback=None
    ) -> dict:
        """
        AI 数据增强 - 使用 LLM 丰富数据

        Args:
            object_name: 对象名
            query: SOQL 查询
            enrichment_prompt: AI 增强提示
            target_field: 目标字段
        """
        records = self.sf.query_all(query)
        total = records["totalSize"]
        enriched = 0
        errors = []

        for i, record in enumerate(records["records"]):
            try:
                # 调用 AI 生成内容
                message = self.anthropic.messages.create(
                    model="claude-sonnet-4-20250514",
                    max_tokens=500,
                    messages=[{
                        "role": "user",
                        "content": enrichment_prompt.format(**record)
                    }]
                )

                ai_content = message.content[0].text

                # 更新记录
                getattr(self.sf, object_name).update(
                    record["Id"],
                    {target_field: ai_content}
                )
                enriched += 1

            except Exception as e:
                errors.append({"id": record["Id"], "error": str(e)})

            if progress_callback and i % 5 == 0:
                await progress_callback(
                    (i + 1) / total,
                    f"已增强 {enriched}/{total} 条记录"
                )

            # 避免 API 限流
            await asyncio.sleep(0.5)

        return {
            "total": total,
            "enriched": enriched,
            "errors": errors
        }

    async def multi_step_workflow(
        self,
        workflow_definition: dict,
        progress_callback=None
    ) -> dict:
        """
        多步骤工作流执行

        Args:
            workflow_definition: 工作流定义
        """
        steps = workflow_definition.get("steps", [])
        results = {}

        for i, step in enumerate(steps):
            if progress_callback:
                await progress_callback(
                    i / len(steps),
                    f"执行步骤 {i+1}/{len(steps)}: {step['name']}"
                )

            step_type = step["type"]

            if step_type == "query":
                results[step["name"]] = self.sf.query_all(step["soql"])

            elif step_type == "create":
                # 使用之前步骤的结果
                fields = self._resolve_references(step["fields"], results)
                result = getattr(self.sf, step["object"]).create(fields)
                results[step["name"]] = result

            elif step_type == "update":
                fields = self._resolve_references(step["fields"], results)
                record_id = self._resolve_references(step["record_id"], results)
                getattr(self.sf, step["object"]).update(record_id, fields)
                results[step["name"]] = {"success": True}

            elif step_type == "approval":
                # 提交审批
                results[step["name"]] = await self._submit_for_approval(
                    step["record_id"],
                    step.get("comments", "")
                )

            elif step_type == "email":
                # 发送邮件
                results[step["name"]] = await self._send_email(
                    step["template_id"],
                    self._resolve_references(step["recipient"], results)
                )

        return {
            "workflow_id": workflow_definition.get("id"),
            "steps_completed": len(steps),
            "results": results
        }

    def _resolve_references(self, value, results: dict):
        """解析结果引用，如 ${step1.records[0].Id}"""
        if isinstance(value, str) and value.startswith("${"):
            # 解析引用
            ref = value[2:-1]  # 去掉 ${ 和 }
            parts = ref.split(".")

            current = results
            for part in parts:
                if "[" in part:
                    # 数组访问
                    key, index = part.split("[")
                    index = int(index.rstrip("]"))
                    current = current[key][index]
                else:
                    current = current[part]

            return current

        elif isinstance(value, dict):
            return {k: self._resolve_references(v, results) for k, v in value.items()}

        return value
```

### 4.3 MCP 长流程工具

```python
# Long-Running Task MCP Tools

from mcp.server import Server
from mcp.types import Tool

class LongRunningMCPServer:
    """长流程任务 MCP 服务器"""

    def __init__(self, task_engine: LongRunningTaskEngine):
        self.engine = task_engine
        self.server = Server("long-running-companion")
        self._register_tools()

    def _register_tools(self):
        """注册长流程工具"""

        @self.server.tool("submit_long_task")
        async def submit_task(
            task_name: str,
            task_type: str,
            params: dict
        ) -> str:
            """
            Submit a long-running task for background execution.

            Args:
                task_name: Human-readable task name
                task_type: Task type (bulk_update, report_generation, ai_enrichment, workflow)
                params: Task parameters

            Returns:
                Task ID for status checking
            """
            try:
                task_id = await self.engine.submit_task(
                    name=task_name,
                    handler=task_type,
                    params=params
                )

                return json.dumps({
                    "success": True,
                    "task_id": task_id,
                    "message": f"任务已提交，ID: {task_id}。使用 check_task_status 查询进度。"
                })

            except Exception as e:
                return json.dumps({"success": False, "error": str(e)})

        @self.server.tool("check_task_status")
        async def check_status(task_id: str) -> str:
            """
            Check the status of a long-running task.

            Args:
                task_id: The task ID returned from submit_long_task

            Returns:
                Task status, progress, and result if completed
            """
            try:
                status = await self.engine.get_task_status(task_id)
                return json.dumps(status, ensure_ascii=False, default=str)

            except Exception as e:
                return json.dumps({"success": False, "error": str(e)})

        @self.server.tool("cancel_task")
        async def cancel_task(task_id: str) -> str:
            """
            Cancel a running or pending task.

            Args:
                task_id: The task ID to cancel

            Returns:
                Cancellation result
            """
            try:
                result = await self.engine.cancel_task(task_id)
                return json.dumps({
                    "success": result,
                    "message": "任务已取消" if result else "取消失败"
                })

            except Exception as e:
                return json.dumps({"success": False, "error": str(e)})

    def get_tools(self) -> list[Tool]:
        """获取长流程工具列表"""
        return [
            Tool(
                name="submit_long_task",
                description="Submit a long-running task (batch updates, reports, AI enrichment, workflows) that may take more than 60 seconds",
                input_schema={
                    "type": "object",
                    "properties": {
                        "task_name": {"type": "string", "description": "Human-readable task name"},
                        "task_type": {
                            "type": "string",
                            "enum": ["bulk_data_update", "complex_report_generation", "ai_data_enrichment", "multi_step_workflow"],
                            "description": "Type of task to execute"
                        },
                        "params": {"type": "object", "description": "Task-specific parameters"}
                    },
                    "required": ["task_name", "task_type", "params"]
                }
            ),
            Tool(
                name="check_task_status",
                description="Check the status and progress of a long-running task",
                input_schema={
                    "type": "object",
                    "properties": {
                        "task_id": {"type": "string"}
                    },
                    "required": ["task_id"]
                }
            ),
            Tool(
                name="cancel_task",
                description="Cancel a running or pending task",
                input_schema={
                    "type": "object",
                    "properties": {
                        "task_id": {"type": "string"}
                    },
                    "required": ["task_id"]
                }
            )
        ]
```

---

## 五、Agent 分析与优化

### 5.1 性能追踪

```python
# Agent Performance Analytics

from dataclasses import dataclass
from datetime import datetime, timedelta
import statistics

@dataclass
class AgentInvocation:
    agent_id: str
    agent_name: str
    invocation_id: str
    user_id: str
    start_time: datetime
    end_time: datetime
    success: bool
    tool_calls: list[dict]
    tokens_used: int
    cost: float
    error: str = None

class AgentAnalytics:
    """Agent 性能分析"""

    def __init__(self, storage):
        self.storage = storage

    async def log_invocation(self, invocation: AgentInvocation):
        """记录 Agent 调用"""
        await self.storage.insert("agent_invocations", invocation.__dict__)

    async def get_performance_metrics(
        self,
        agent_id: str = None,
        time_range: timedelta = timedelta(days=7)
    ) -> dict:
        """
        获取 Agent 性能指标

        Returns:
            {
                "total_invocations": int,
                "success_rate": float,
                "avg_duration": float,
                "avg_tokens": float,
                "total_cost": float,
                "error_breakdown": dict
            }
        """
        start_time = datetime.now() - time_range

        query = {
            "start_time": {"$gte": start_time}
        }
        if agent_id:
            query["agent_id"] = agent_id

        invocations = await self.storage.find("agent_invocations", query)

        if not invocations:
            return {"message": "No data available"}

        # 计算指标
        total = len(invocations)
        successes = sum(1 for i in invocations if i["success"])
        durations = [
            (datetime.fromisoformat(i["end_time"]) -
             datetime.fromisoformat(i["start_time"])).total_seconds()
            for i in invocations
        ]
        tokens = [i["tokens_used"] for i in invocations]
        costs = [i["cost"] for i in invocations]

        # 错误分析
        errors = {}
        for i in invocations:
            if i.get("error"):
                error_type = i["error"].split(":")[0]
                errors[error_type] = errors.get(error_type, 0) + 1

        return {
            "total_invocations": total,
            "success_rate": successes / total if total > 0 else 0,
            "avg_duration_seconds": statistics.mean(durations) if durations else 0,
            "median_duration_seconds": statistics.median(durations) if durations else 0,
            "avg_tokens": statistics.mean(tokens) if tokens else 0,
            "total_cost": sum(costs),
            "avg_cost_per_invocation": statistics.mean(costs) if costs else 0,
            "error_breakdown": errors,
            "time_range_days": time_range.days
        }

    async def get_tool_usage_stats(
        self,
        agent_id: str = None,
        time_range: timedelta = timedelta(days=7)
    ) -> dict:
        """获取工具使用统计"""
        start_time = datetime.now() - time_range

        query = {"start_time": {"$gte": start_time}}
        if agent_id:
            query["agent_id"] = agent_id

        invocations = await self.storage.find("agent_invocations", query)

        tool_stats = {}
        for inv in invocations:
            for call in inv.get("tool_calls", []):
                tool_name = call.get("tool_name")
                if tool_name:
                    if tool_name not in tool_stats:
                        tool_stats[tool_name] = {
                            "count": 0,
                            "successes": 0,
                            "total_duration": 0
                        }

                    tool_stats[tool_name]["count"] += 1
                    if call.get("success"):
                        tool_stats[tool_name]["successes"] += 1
                    tool_stats[tool_name]["total_duration"] += call.get("duration", 0)

        # 计算成功率和平均时长
        for tool_name, stats in tool_stats.items():
            stats["success_rate"] = stats["successes"] / stats["count"] if stats["count"] > 0 else 0
            stats["avg_duration"] = stats["total_duration"] / stats["count"] if stats["count"] > 0 else 0

        return tool_stats

    async def identify_optimization_opportunities(
        self,
        agent_id: str
    ) -> list[dict]:
        """
        识别优化机会

        Returns:
            优化建议列表
        """
        metrics = await self.get_performance_metrics(agent_id)
        tool_stats = await self.get_tool_usage_stats(agent_id)

        recommendations = []

        # 1. 成功率低
        if metrics.get("success_rate", 1) < 0.9:
            recommendations.append({
                "type": "reliability",
                "priority": "high",
                "message": f"Agent 成功率仅 {metrics['success_rate']*100:.1f}%，建议检查常见错误",
                "action": "review_errors",
                "details": metrics.get("error_breakdown", {})
            })

        # 2. 响应时间过长
        if metrics.get("avg_duration_seconds", 0) > 30:
            recommendations.append({
                "type": "performance",
                "priority": "medium",
                "message": f"平均响应时间 {metrics['avg_duration_seconds']:.1f}s，考虑优化",
                "action": "optimize_duration"
            })

        # 3. 工具成功率低
        for tool_name, stats in tool_stats.items():
            if stats["success_rate"] < 0.8:
                recommendations.append({
                    "type": "tool_reliability",
                    "priority": "medium",
                    "message": f"工具 {tool_name} 成功率仅 {stats['success_rate']*100:.1f}%",
                    "action": "fix_tool",
                    "tool": tool_name
                })

        # 4. 成本优化
        if metrics.get("avg_tokens", 0) > 5000:
            recommendations.append({
                "type": "cost",
                "priority": "low",
                "message": f"平均 Token 使用 {metrics['avg_tokens']:.0f}，考虑优化提示词",
                "action": "optimize_prompts"
            })

        return recommendations
```

---

## 六、Salesforce 集成组件

### 6.1 Apex Controller

```java
// AgentforceCompanionController.cls

public with sharing class AgentforceCompanionController {

    private static final String COMPANION_API_URL = 'https://api.gbase.com/agentforce-companion';

    /**
     * 调用 MCP 工具
     */
    @AuraEnabled
    public static String invokeTool(String toolName, String paramsJson) {
        try {
            Map<String, Object> params = (Map<String, Object>) JSON.deserializeUntyped(paramsJson);

            HttpRequest req = new HttpRequest();
            req.setEndpoint(COMPANION_API_URL + '/tools/' + toolName);
            req.setMethod('POST');
            req.setHeader('Content-Type', 'application/json');
            req.setHeader('Authorization', 'Bearer ' + getAccessToken());
            req.setBody(JSON.serialize(params));
            req.setTimeout(60000);

            Http http = new Http();
            HttpResponse res = http.send(req);

            if (res.getStatusCode() == 200) {
                return res.getBody();
            } else {
                return JSON.serialize(new Map<String, Object>{
                    'success' => false,
                    'error' => 'HTTP ' + res.getStatusCode() + ': ' + res.getBody()
                });
            }

        } catch (Exception e) {
            return JSON.serialize(new Map<String, Object>{
                'success' => false,
                'error' => e.getMessage()
            });
        }
    }

    /**
     * 提交长流程任务
     */
    @AuraEnabled
    public static String submitLongTask(String taskName, String taskType, String paramsJson) {
        try {
            Map<String, Object> requestBody = new Map<String, Object>{
                'task_name' => taskName,
                'task_type' => taskType,
                'params' => JSON.deserializeUntyped(paramsJson)
            };

            HttpRequest req = new HttpRequest();
            req.setEndpoint(COMPANION_API_URL + '/tasks/submit');
            req.setMethod('POST');
            req.setHeader('Content-Type', 'application/json');
            req.setHeader('Authorization', 'Bearer ' + getAccessToken());
            req.setBody(JSON.serialize(requestBody));
            req.setTimeout(30000);

            Http http = new Http();
            HttpResponse res = http.send(req);

            return res.getBody();

        } catch (Exception e) {
            return JSON.serialize(new Map<String, Object>{
                'success' => false,
                'error' => e.getMessage()
            });
        }
    }

    /**
     * 查询任务状态
     */
    @AuraEnabled
    public static String getTaskStatus(String taskId) {
        try {
            HttpRequest req = new HttpRequest();
            req.setEndpoint(COMPANION_API_URL + '/tasks/' + taskId + '/status');
            req.setMethod('GET');
            req.setHeader('Authorization', 'Bearer ' + getAccessToken());
            req.setTimeout(10000);

            Http http = new Http();
            HttpResponse res = http.send(req);

            return res.getBody();

        } catch (Exception e) {
            return JSON.serialize(new Map<String, Object>{
                'success' => false,
                'error' => e.getMessage()
            });
        }
    }

    /**
     * 知识查询 (RAG)
     */
    @AuraEnabled
    public static String queryKnowledge(String question, String contextJson) {
        try {
            Map<String, Object> requestBody = new Map<String, Object>{
                'question' => question,
                'context' => String.isNotBlank(contextJson)
                    ? JSON.deserializeUntyped(contextJson)
                    : new Map<String, Object>()
            };

            HttpRequest req = new HttpRequest();
            req.setEndpoint(COMPANION_API_URL + '/knowledge/query');
            req.setMethod('POST');
            req.setHeader('Content-Type', 'application/json');
            req.setHeader('Authorization', 'Bearer ' + getAccessToken());
            req.setBody(JSON.serialize(requestBody));
            req.setTimeout(30000);

            Http http = new Http();
            HttpResponse res = http.send(req);

            return res.getBody();

        } catch (Exception e) {
            return JSON.serialize(new Map<String, Object>{
                'success' => false,
                'error' => e.getMessage()
            });
        }
    }

    /**
     * 获取 Agent 分析数据
     */
    @AuraEnabled
    public static String getAgentAnalytics(String agentId, Integer days) {
        try {
            String endpoint = COMPANION_API_URL + '/analytics/agent';
            if (String.isNotBlank(agentId)) {
                endpoint += '/' + agentId;
            }
            endpoint += '?days=' + (days != null ? days : 7);

            HttpRequest req = new HttpRequest();
            req.setEndpoint(endpoint);
            req.setMethod('GET');
            req.setHeader('Authorization', 'Bearer ' + getAccessToken());
            req.setTimeout(15000);

            Http http = new Http();
            HttpResponse res = http.send(req);

            return res.getBody();

        } catch (Exception e) {
            return JSON.serialize(new Map<String, Object>{
                'success' => false,
                'error' => e.getMessage()
            });
        }
    }

    private static String getAccessToken() {
        // 从 Custom Metadata 或 Named Credential 获取
        GBase_Settings__mdt settings = GBase_Settings__mdt.getInstance('Default');
        return settings.API_Key__c;
    }
}
```

---

## 七、MVP 开发计划

### Week 1: MCP 基础
| Day | 任务 | 交付物 |
|-----|------|--------|
| 1-2 | Salesforce MCP Tools 实现 | SalesforceMCPServer |
| 3-4 | Knowledge MCP Tools 实现 | KnowledgeMCPServer |
| 5 | MCP 服务器集成测试 | 测试报告 |

### Week 2: 长流程引擎
| Day | 任务 | 交付物 |
|-----|------|--------|
| 1-2 | 任务队列系统 | LongRunningTaskEngine |
| 3-4 | 预置任务处理器 | TaskHandlers |
| 5 | Long-Running MCP Tools | LongRunningMCPServer |

### Week 3: 分析与优化
| Day | 任务 | 交付物 |
|-----|------|--------|
| 1-2 | 性能追踪系统 | AgentAnalytics |
| 3-4 | 优化建议引擎 | Recommendations |
| 5 | 分析仪表板 | Dashboard |

### Week 4: 集成与部署
| Day | 任务 | 交付物 |
|-----|------|--------|
| 1-2 | Apex Controller | AgentforceCompanionController |
| 3-4 | LWC 组件 | UI 组件 |
| 5 | 部署与文档 | AppExchange 包 |

---

## 八、成功指标

### 业务指标
| 指标 | 目标 | 测量方式 |
|------|------|----------|
| Agent 任务完成率 | +40% | 分析数据 |
| Agent 准确率 | +25% | 用户反馈 |
| 部署时间 | -50% | 客户反馈 |

### 技术指标
| 指标 | 目标 | 测量方式 |
|------|------|----------|
| MCP 工具响应时间 | <2s | 监控日志 |
| 长任务成功率 | >95% | 任务统计 |
| 系统可用性 | 99.9% | 监控告警 |

---

## 九、风险与缓解

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| Salesforce 原生提供类似功能 | 中 | 高 | 持续差异化，专注 Salesforce 不做的领域 |
| MCP 标准变化 | 低 | 中 | 跟踪标准进展，快速适配 |
| Agentforce 采用不及预期 | 中 | 中 | 产品线多元化，不过度依赖单一产品 |

---

## 参考资料

- [Salesforce Agent API](https://developer.salesforce.com/docs/einstein/genai/guide/agent-api.html)
- [MCP Specification](https://modelcontextprotocol.io/specification)
- [Agentforce Documentation](https://help.salesforce.com/s/articleView?id=sf.agentforce.htm)
