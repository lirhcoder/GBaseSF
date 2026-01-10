# Data Cloud Activator - 技术设计文档

> **版本**: 1.0
> **日期**: 2026-01-10
> **状态**: 设计阶段

---

## 1. 产品概述

### 1.1 定位
Data Cloud Activator 是一个帮助企业更高效地将数据接入 Salesforce Data Cloud (Data 360) 并激活数据价值的产品。

### 1.2 核心价值
| 价值主张 | 描述 | ROI |
|----------|------|-----|
| 加速数据接入 | 预置连接器 + 智能映射 | 实施时间 -40% |
| 提升数据质量 | AI 质量评分 + 自动修复建议 | 数据可用率 +25% |
| 扩展数据源 | Box, SharePoint 等连接器 | 数据源覆盖 +30% |
| 增强激活 | 实时触发 + 自定义 Action | 营销效率 +20% |

### 1.3 目标用户
| 用户角色 | 使用场景 | 关键需求 |
|----------|----------|----------|
| Data Architect | 设计数据流架构 | 快速映射、质量保障 |
| Marketing Ops | 构建客户画像 | 更多数据源、实时激活 |
| IT Admin | 管理集成 | 监控、错误处理 |
| CDO | 数据战略 | ROI 可视化 |

---

## 2. 系统架构

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Data Cloud Activator                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐ │
│  │   Source    │   │   Source    │   │   Source    │   │   Source    │ │
│  │    Box      │   │ SharePoint  │   │   Custom    │   │   S3/GCS    │ │
│  └──────┬──────┘   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘ │
│         │                 │                 │                 │         │
│         ▼                 ▼                 ▼                 ▼         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    Connector Layer (GBase)                        │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐              │  │
│  │  │  Box    │  │SharePt  │  │  MCP    │  │  File   │              │  │
│  │  │Connector│  │Connector│  │Connector│  │Connector│              │  │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘              │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                │                                        │
│                                ▼                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    Processing Layer                               │  │
│  │                                                                    │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │  │
│  │  │   Extract    │  │  Transform   │  │   Quality    │            │  │
│  │  │   Parser     │  │   Engine     │  │   Scorer     │            │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘            │  │
│  │                                                                    │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │  │
│  │  │   Schema     │  │    Field     │  │   AI Data    │            │  │
│  │  │   Detector   │  │   Mapper     │  │   Cleaner    │            │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘            │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                │                                        │
│                                ▼                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                  Data Cloud Integration Layer                     │  │
│  │                                                                    │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │  │
│  │  │  Ingestion   │  │   Bulk       │  │  Streaming   │            │  │
│  │  │  API Client  │  │   Uploader   │  │   Sender     │            │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘            │  │
│  │                                                                    │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │  │
│  │  │   OAuth      │  │   Schema     │  │   Job        │            │  │
│  │  │   Handler    │  │   Manager    │  │   Monitor    │            │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘            │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                │                                        │
└────────────────────────────────┼────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     Salesforce Data Cloud (Data 360)                     │
│                                                                          │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐ │
│  │   Data      │   │   Data      │   │  Calculated │   │  Activation │ │
│  │   Streams   │   │   Model     │   │   Insights  │   │   Targets   │ │
│  └─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 组件说明

| 层级 | 组件 | 职责 | 技术选型 |
|------|------|------|----------|
| Connector | Box Connector | Box 文件同步 | Box SDK + GBase v3.4.5 |
| Connector | SharePoint Connector | SharePoint 数据同步 | Graph API + GBase v3.4.5 |
| Connector | MCP Connector | 通用 MCP 工具接入 | MCP SDK |
| Connector | File Connector | S3/GCS 文件接入 | AWS/GCP SDK |
| Processing | Extract Parser | 文件解析 (PDF, Excel, etc) | GBase RAG Parser |
| Processing | Transform Engine | 数据转换 | Python + Pandas |
| Processing | Quality Scorer | 数据质量评估 | AI Model (Claude) |
| Processing | Schema Detector | 自动识别 Schema | Claude + Heuristics |
| Processing | Field Mapper | 智能字段映射 | Claude + Fuzzy Match |
| Processing | AI Data Cleaner | 数据清洗建议 | Claude |
| Integration | Ingestion API Client | Data Cloud API 封装 | REST Client |
| Integration | Bulk Uploader | 批量上传 | CSV + Multipart |
| Integration | Streaming Sender | 实时推送 | HTTP Streaming |
| Integration | OAuth Handler | 认证管理 | JWT Bearer Flow |
| Integration | Schema Manager | Schema YAML 管理 | OpenAPI Spec |
| Integration | Job Monitor | 任务监控 | Polling + Webhooks |

---

## 3. 技术规格

### 3.1 Data Cloud API 集成

#### 3.1.1 认证流程

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│  GBase   │────▶│ Connected App│────▶│  Data Cloud  │
│ Activator│     │   (OAuth)    │     │    API       │
└──────────┘     └──────────────┘     └──────────────┘
      │                                       │
      │  1. Request JWT Token                 │
      │ ─────────────────────────────────────▶│
      │                                       │
      │  2. Access Token                      │
      │ ◀─────────────────────────────────────│
      │                                       │
      │  3. API Calls with Token              │
      │ ─────────────────────────────────────▶│
      │                                       │
```

**OAuth Scopes 需求**:
- `cdp_ingest_api` - 访问 Ingestion API
- `api` - 访问和管理数据
- `refresh_token` - 离线访问

#### 3.1.2 Ingestion API 集成

**Streaming 模式** (近实时, ~3分钟处理):
```python
# Streaming Ingestion 示例
class DataCloudStreamingClient:
    def __init__(self, instance_url: str, access_token: str):
        self.base_url = f"{instance_url}/api/v1/ingest"
        self.headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }

    def stream_records(self, source_api_name: str, object_name: str, records: list):
        """
        推送记录到 Data Cloud
        限制: 单次请求 <= 200KB
        """
        url = f"{self.base_url}/sources/{source_api_name}/{object_name}"
        payload = {"data": records}

        response = requests.post(url, json=payload, headers=self.headers)
        return response.json()
```

**Bulk 模式** (大批量, CSV 上传):
```python
# Bulk Ingestion 示例
class DataCloudBulkClient:
    def __init__(self, instance_url: str, access_token: str):
        self.base_url = f"{instance_url}/api/v1/ingest"
        self.headers = {"Authorization": f"Bearer {access_token}"}

    def create_job(self, source_api_name: str, object_name: str, operation: str = "upsert"):
        """创建批量任务"""
        url = f"{self.base_url}/jobs"
        payload = {
            "object": f"{source_api_name}__{object_name}",
            "operation": operation,
            "contentType": "CSV"
        }
        response = requests.post(url, json=payload, headers=self.headers)
        return response.json()["id"]

    def upload_data(self, job_id: str, csv_content: str):
        """上传 CSV 数据"""
        url = f"{self.base_url}/jobs/{job_id}/batches"
        headers = {**self.headers, "Content-Type": "text/csv"}
        response = requests.put(url, data=csv_content, headers=headers)
        return response.status_code == 201

    def close_job(self, job_id: str):
        """关闭任务开始处理"""
        url = f"{self.base_url}/jobs/{job_id}"
        payload = {"state": "UploadComplete"}
        response = requests.patch(url, json=payload, headers=self.headers)
        return response.json()
```

### 3.2 数据源连接器

#### 3.2.1 Box Connector (GBase v3.4.5 已有)

```python
from gbase.connectors import BoxConnector

class BoxDataCloudConnector:
    def __init__(self, box_config: dict, dc_client: DataCloudClient):
        self.box = BoxConnector(box_config)
        self.dc = dc_client

    def sync_folder(self, folder_id: str, target_object: str):
        """
        同步 Box 文件夹到 Data Cloud
        """
        files = self.box.list_files(folder_id)

        for file in files:
            # 1. 下载并解析文件
            content = self.box.download(file.id)
            parsed = self.parse_file(content, file.type)

            # 2. 质量评分
            quality = self.quality_scorer.score(parsed)

            # 3. 转换为 Data Cloud 格式
            records = self.transform(parsed, target_object)

            # 4. 推送到 Data Cloud
            self.dc.stream_records(target_object, records)

        return {"synced_files": len(files)}
```

#### 3.2.2 SharePoint Connector (GBase v3.4.5 已有)

```python
from gbase.connectors import SharePointConnector

class SharePointDataCloudConnector:
    def __init__(self, sp_config: dict, dc_client: DataCloudClient):
        self.sp = SharePointConnector(sp_config)
        self.dc = dc_client

    def sync_list(self, site_id: str, list_id: str, target_object: str):
        """
        同步 SharePoint List 到 Data Cloud
        """
        items = self.sp.get_list_items(site_id, list_id)

        # 1. 自动检测 Schema
        schema = self.schema_detector.detect(items)

        # 2. 映射到 Data Cloud 对象
        mapping = self.field_mapper.auto_map(schema, target_object)

        # 3. 转换并推送
        records = self.transform(items, mapping)
        self.dc.bulk_upload(target_object, records)

        return {"synced_items": len(items)}
```

#### 3.2.3 通用 MCP Connector

```python
from mcp import MCPClient

class MCPDataCloudConnector:
    def __init__(self, mcp_server_url: str, dc_client: DataCloudClient):
        self.mcp = MCPClient(mcp_server_url)
        self.dc = dc_client

    def register_tools(self):
        """注册 MCP 工具"""
        return [
            {
                "name": "ingest_to_data_cloud",
                "description": "Ingest data into Salesforce Data Cloud",
                "parameters": {
                    "object_name": {"type": "string"},
                    "records": {"type": "array"}
                }
            },
            {
                "name": "query_data_cloud",
                "description": "Query data from Data Cloud",
                "parameters": {
                    "sql": {"type": "string"}
                }
            }
        ]
```

### 3.3 数据质量评分

#### 3.3.1 评分维度

| 维度 | 权重 | 检查项 |
|------|------|--------|
| 完整性 | 30% | 必填字段填充率、关键字段空值率 |
| 准确性 | 25% | 格式验证、范围验证、业务规则 |
| 一致性 | 20% | 跨字段一致性、历史一致性 |
| 唯一性 | 15% | 主键唯一性、重复记录检测 |
| 时效性 | 10% | 数据更新频率、过期数据占比 |

#### 3.3.2 质量评分实现

```python
class DataQualityScorer:
    def __init__(self, claude_client):
        self.claude = claude_client

    def score(self, data: list, schema: dict) -> QualityReport:
        """
        对数据进行质量评分
        """
        report = QualityReport()

        # 1. 完整性检查
        report.completeness = self._check_completeness(data, schema)

        # 2. 准确性检查
        report.accuracy = self._check_accuracy(data, schema)

        # 3. 一致性检查
        report.consistency = self._check_consistency(data)

        # 4. 唯一性检查
        report.uniqueness = self._check_uniqueness(data, schema)

        # 5. 时效性检查
        report.timeliness = self._check_timeliness(data)

        # 6. 计算总分
        report.total_score = (
            report.completeness * 0.30 +
            report.accuracy * 0.25 +
            report.consistency * 0.20 +
            report.uniqueness * 0.15 +
            report.timeliness * 0.10
        )

        # 7. AI 生成修复建议
        report.recommendations = self._generate_recommendations(report)

        return report

    def _check_completeness(self, data: list, schema: dict) -> float:
        """检查数据完整性"""
        required_fields = [f for f, props in schema.items() if props.get("required")]

        total_checks = len(data) * len(required_fields)
        filled = 0

        for record in data:
            for field in required_fields:
                if record.get(field) is not None and record.get(field) != "":
                    filled += 1

        return (filled / total_checks * 100) if total_checks > 0 else 0

    def _generate_recommendations(self, report: QualityReport) -> list:
        """使用 AI 生成修复建议"""
        prompt = f"""
        数据质量报告:
        - 完整性: {report.completeness}%
        - 准确性: {report.accuracy}%
        - 一致性: {report.consistency}%
        - 唯一性: {report.uniqueness}%
        - 时效性: {report.timeliness}%

        问题列表:
        {report.issues}

        请生成具体的修复建议，按优先级排序。
        """

        response = self.claude.complete(prompt)
        return self._parse_recommendations(response)
```

### 3.4 智能字段映射

#### 3.4.1 自动映射算法

```python
class IntelligentFieldMapper:
    def __init__(self, claude_client):
        self.claude = claude_client

    def auto_map(self, source_schema: dict, target_dmo: str) -> dict:
        """
        自动映射源 Schema 到 Data Cloud DMO
        """
        # 1. 获取目标 DMO Schema
        target_schema = self._get_dmo_schema(target_dmo)

        # 2. 使用 AI 进行语义匹配
        mappings = self._ai_semantic_match(source_schema, target_schema)

        # 3. 使用模糊匹配补充
        mappings = self._fuzzy_match_supplement(source_schema, target_schema, mappings)

        # 4. 计算置信度
        mappings = self._calculate_confidence(mappings)

        return mappings

    def _ai_semantic_match(self, source: dict, target: dict) -> dict:
        """使用 Claude 进行语义匹配"""
        prompt = f"""
        源字段:
        {json.dumps(source, indent=2)}

        目标 Data Cloud 字段:
        {json.dumps(target, indent=2)}

        请匹配源字段到目标字段，返回 JSON 格式:
        {{
            "source_field_name": {{
                "target_field": "target_field_name",
                "confidence": 0.95,
                "transform": "none|uppercase|date_format|..."
            }}
        }}

        考虑:
        1. 字段名称相似性
        2. 数据类型兼容性
        3. 语义含义
        4. 常见业务字段模式 (如 email, phone, name)
        """

        response = self.claude.complete(prompt)
        return json.loads(response)
```

### 3.5 实时激活触发

#### 3.5.1 事件驱动架构

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Data Cloud │────▶│   GBase     │────▶│   Target    │
│  Streaming  │     │  Activator  │     │   Systems   │
│   Event     │     │   Engine    │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   Actions   │
                    ├─────────────┤
                    │ • Webhook   │
                    │ • Flow      │
                    │ • Marketing │
                    │ • Custom    │
                    └─────────────┘
```

#### 3.5.2 触发器实现

```python
class ActivationEngine:
    def __init__(self, config: dict):
        self.triggers = {}
        self.actions = {}

    def register_trigger(self, trigger_config: dict):
        """注册激活触发器"""
        trigger = Trigger(
            name=trigger_config["name"],
            condition=trigger_config["condition"],  # SQL-like condition
            actions=trigger_config["actions"]
        )
        self.triggers[trigger.name] = trigger

    def process_event(self, event: dict):
        """处理来自 Data Cloud 的事件"""
        for trigger in self.triggers.values():
            if self._evaluate_condition(trigger.condition, event):
                for action in trigger.actions:
                    self._execute_action(action, event)

    def _execute_action(self, action: Action, event: dict):
        """执行激活动作"""
        if action.type == "webhook":
            self._send_webhook(action.config, event)
        elif action.type == "flow":
            self._trigger_flow(action.config, event)
        elif action.type == "marketing_cloud":
            self._trigger_mc_journey(action.config, event)
        elif action.type == "custom":
            self._execute_custom(action.config, event)
```

---

## 4. 数据模型

### 4.1 配置数据模型

```yaml
# connector_config.yaml
connectors:
  - name: "box_documents"
    type: "box"
    config:
      client_id: "${BOX_CLIENT_ID}"
      client_secret: "${BOX_CLIENT_SECRET}"
      folder_id: "123456789"
    target:
      object: "Document__c"
      mapping_mode: "auto"  # auto | manual

  - name: "sharepoint_customers"
    type: "sharepoint"
    config:
      tenant_id: "${SP_TENANT_ID}"
      client_id: "${SP_CLIENT_ID}"
      site_id: "site-guid"
      list_id: "list-guid"
    target:
      object: "Customer__c"
      mapping:
        "Title": "Name"
        "Email": "Email__c"
        "Phone": "Phone__c"

# data_cloud_config.yaml
data_cloud:
  instance_url: "https://your-instance.salesforce.com"
  connected_app:
    client_id: "${DC_CLIENT_ID}"
    private_key_path: "/path/to/private.key"
    username: "integration@company.com"

  ingestion_api:
    source_name: "GBase_Activator"

  objects:
    - name: "Customer__c"
      key_field: "Email__c"
      mode: "upsert"

    - name: "Document__c"
      key_field: "ExternalId__c"
      mode: "upsert"
```

### 4.2 Schema 定义 (OpenAPI 格式)

```yaml
# schema/customer.yaml
openapi: 3.0.0
info:
  title: Customer Schema
  version: 1.0.0

components:
  schemas:
    Customer:
      type: object
      required:
        - id
        - email
      properties:
        id:
          type: string
          description: External unique identifier
        email:
          type: string
          format: email
        firstName:
          type: string
        lastName:
          type: string
        phone:
          type: string
        company:
          type: string
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time
```

---

## 5. 部署架构

### 5.1 部署选项

| 选项 | 适用场景 | 优点 | 缺点 |
|------|----------|------|------|
| GBase Cloud | 标准部署 | 快速、托管 | 数据出境 |
| 客户云 (AWS/Azure) | 数据合规 | 数据本地 | 需要运维 |
| 混合部署 | 大企业 | 灵活 | 复杂 |

### 5.2 GBase Cloud 部署

```
┌─────────────────────────────────────────────────────────────┐
│                       GBase Cloud                            │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Activator  │  │   Worker    │  │   Monitor   │         │
│  │    API      │  │   Nodes     │  │   Service   │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
│         │                │                │                  │
│         ▼                ▼                ▼                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    Message Queue                      │   │
│  │                     (RabbitMQ)                        │   │
│  └──────────────────────────────────────────────────────┘   │
│         │                                                    │
│         ▼                                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    Database                           │   │
│  │              (PostgreSQL + Redis)                     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                   Salesforce Data Cloud                       │
└──────────────────────────────────────────────────────────────┘
```

### 5.3 容器化部署

```yaml
# docker-compose.yml
version: '3.8'

services:
  activator-api:
    image: gbase/data-cloud-activator:latest
    ports:
      - "8080:8080"
    environment:
      - DC_INSTANCE_URL=${DC_INSTANCE_URL}
      - DC_CLIENT_ID=${DC_CLIENT_ID}
      - REDIS_URL=redis://redis:6379
      - RABBITMQ_URL=amqp://rabbitmq:5672
    depends_on:
      - redis
      - rabbitmq

  worker:
    image: gbase/data-cloud-activator:latest
    command: python worker.py
    environment:
      - DC_INSTANCE_URL=${DC_INSTANCE_URL}
      - DC_CLIENT_ID=${DC_CLIENT_ID}
      - RABBITMQ_URL=amqp://rabbitmq:5672
    deploy:
      replicas: 3

  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data

  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "15672:15672"
    volumes:
      - rabbitmq-data:/var/lib/rabbitmq

volumes:
  redis-data:
  rabbitmq-data:
```

---

## 6. API 设计

### 6.1 REST API

#### 6.1.1 连接器管理

```
POST   /api/v1/connectors              # 创建连接器
GET    /api/v1/connectors              # 列表连接器
GET    /api/v1/connectors/{id}         # 获取连接器详情
PUT    /api/v1/connectors/{id}         # 更新连接器
DELETE /api/v1/connectors/{id}         # 删除连接器
POST   /api/v1/connectors/{id}/test    # 测试连接
POST   /api/v1/connectors/{id}/sync    # 触发同步
```

#### 6.1.2 数据质量

```
POST   /api/v1/quality/analyze         # 分析数据质量
GET    /api/v1/quality/reports         # 获取质量报告
GET    /api/v1/quality/reports/{id}    # 获取报告详情
POST   /api/v1/quality/fix             # 执行修复建议
```

#### 6.1.3 字段映射

```
POST   /api/v1/mapping/auto            # 自动映射
GET    /api/v1/mapping/{connector_id}  # 获取映射
PUT    /api/v1/mapping/{connector_id}  # 更新映射
POST   /api/v1/mapping/validate        # 验证映射
```

#### 6.1.4 同步任务

```
GET    /api/v1/jobs                    # 列表任务
GET    /api/v1/jobs/{id}               # 任务详情
GET    /api/v1/jobs/{id}/logs          # 任务日志
POST   /api/v1/jobs/{id}/retry         # 重试任务
DELETE /api/v1/jobs/{id}               # 取消任务
```

### 6.2 API 示例

#### 创建 Box 连接器

```bash
curl -X POST https://api.gbase.ai/activator/v1/connectors \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sales Documents",
    "type": "box",
    "config": {
      "client_id": "xxx",
      "client_secret": "yyy",
      "folder_id": "123456789"
    },
    "target": {
      "data_cloud_object": "Document__c",
      "key_field": "ExternalId__c",
      "mapping_mode": "auto"
    },
    "schedule": {
      "type": "interval",
      "interval_minutes": 60
    }
  }'
```

#### 响应

```json
{
  "id": "conn_abc123",
  "name": "Sales Documents",
  "type": "box",
  "status": "active",
  "last_sync": null,
  "next_sync": "2026-01-10T17:00:00Z",
  "created_at": "2026-01-10T16:00:00Z"
}
```

---

## 7. 安全设计

### 7.1 认证与授权

| 层级 | 机制 | 说明 |
|------|------|------|
| API 访问 | OAuth 2.0 / API Key | 客户认证 |
| Data Cloud | JWT Bearer Flow | 服务认证 |
| 数据源 | 各平台 OAuth | Box/SharePoint 认证 |
| 内部服务 | mTLS | 服务间通信 |

### 7.2 数据安全

| 方面 | 措施 |
|------|------|
| 传输加密 | TLS 1.3 |
| 存储加密 | AES-256 |
| 密钥管理 | AWS KMS / Azure Key Vault |
| 数据隔离 | 租户级隔离 |
| 审计日志 | 全操作日志 |

### 7.3 合规

| 标准 | 状态 |
|------|------|
| SOC 2 Type II | 依赖 GBase Cloud |
| GDPR | 支持 (数据处理协议) |
| HIPAA | 可配置 |
| ISO 27001 | 依赖 GBase Cloud |

---

## 8. 监控与运维

### 8.1 监控指标

| 类别 | 指标 | 告警阈值 |
|------|------|----------|
| 可用性 | API 成功率 | < 99% |
| 延迟 | API P99 延迟 | > 2s |
| 同步 | 同步成功率 | < 95% |
| 同步 | 同步延迟 | > 15min |
| 质量 | 平均质量分 | < 70 |
| 资源 | CPU 使用率 | > 80% |
| 资源 | 内存使用率 | > 85% |

### 8.2 日志结构

```json
{
  "timestamp": "2026-01-10T16:30:00Z",
  "level": "INFO",
  "service": "activator",
  "trace_id": "abc123",
  "connector_id": "conn_xyz",
  "event": "sync_completed",
  "details": {
    "records_processed": 1500,
    "records_success": 1495,
    "records_failed": 5,
    "duration_ms": 12500
  }
}
```

---

## 9. 实施计划

### 9.1 MVP 范围 (4 周)

| 周 | 交付物 |
|----|--------|
| Week 1 | Data Cloud API 集成 (OAuth + Ingestion) |
| Week 2 | Box Connector + 基础同步 |
| Week 3 | 质量评分 MVP + 自动映射 |
| Week 4 | UI Dashboard + 文档 |

### 9.2 MVP 功能清单

| 功能 | MVP | v1.0 | v2.0 |
|------|-----|------|------|
| Box Connector | ✅ | ✅ | ✅ |
| SharePoint Connector | ❌ | ✅ | ✅ |
| 自动 Schema 检测 | ✅ | ✅ | ✅ |
| AI 字段映射 | 基础 | 完整 | 完整 |
| 质量评分 | 基础 | 完整 | 完整 |
| AI 修复建议 | ❌ | ✅ | ✅ |
| 实时激活 | ❌ | ❌ | ✅ |
| 自定义连接器 | ❌ | ❌ | ✅ |

### 9.3 团队配置

| 角色 | 人数 | 职责 |
|------|------|------|
| Tech Lead | 1 | 架构设计、技术决策 |
| Backend Dev | 2 | API、连接器、集成 |
| AI/ML Engineer | 1 | 质量评分、字段映射 |
| QA | 1 | 测试、文档 |

---

## 10. 风险与缓解

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| Data Cloud API 变更 | 中 | 高 | 抽象层隔离、版本兼容 |
| 大数据量性能问题 | 中 | 中 | 分批处理、异步队列 |
| AI 映射准确率不足 | 中 | 中 | 人工确认、反馈学习 |
| 认证 Token 过期 | 低 | 中 | 自动刷新、监控告警 |
| 客户数据合规 | 低 | 高 | 区域部署、加密存储 |

---

## 附录

### A. Data Cloud API 参考

- [Ingestion API Guide](https://developer.salesforce.com/docs/data/data-cloud-int/guide/c360-a-ingestion-api.html)
- [Query Connect API](https://developer.salesforce.com/blogs/2025/08/boost-data-cloud-integrations-with-the-new-query-connect-api)
- [Zero Copy Partner Network](https://www.salesforce.com/data/connectivity/zero-copy/)

### B. 相关 GBase 能力

- Box Connector (v3.4.5)
- SharePoint Connector (v3.4.5)
- RAG Parser
- MCP Server

### C. 术语表

| 术语 | 说明 |
|------|------|
| DLO | Data Lake Object (数据湖对象) |
| DMO | Data Model Object (数据模型对象) |
| DSO | Data Source Object (数据源对象) |
| CDP | Customer Data Platform |
| Data 360 | Data Cloud 新名称 (2025.10) |
