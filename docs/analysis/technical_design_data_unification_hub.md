# Data Unification Hub 技术设计方案

> **版本**: 1.0
> **日期**: 2026-01-10
> **评分**: 7.7/10 (Priority #3)
> **状态**: 技术设计

---

## 一、产品概述

### 定位
**"轻量级 Salesforce 数据集成中枢"**

MuleSoft 的轻量替代方案，专注于中小规模 Salesforce 数据集成。

### 市场验证
| 数据点 | 数值 | 意义 |
|--------|------|------|
| 数据孤岛问题比例 | 81% IT 领导者 | 刚需验证 |
| MuleSoft 收购价格 | $6.5B | 市场规模验证 |
| 集成性能临界点 | 5-6 系统 | 产品定位机会 |
| 数字化转型挑战 | 98% 企业 | 持续需求 |

### 差异化定位
| 维度 | MuleSoft | Data Unification Hub |
|------|----------|---------------------|
| 目标客户 | 大型企业 | 中小企业 / 部门级 |
| 系统规模 | 10+ 系统 | 5-15 系统 |
| 部署时间 | 数周-数月 | 数天 |
| 价格 | 高 (企业级) | 中 (按需) |
| 学习曲线 | 陡峭 | 平缓 |

---

## 二、系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                      Data Unification Hub                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   Configuration UI                         │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐ │   │
│  │  │ Connection  │ │ Mapping     │ │ Sync Rules          │ │   │
│  │  │ Manager     │ │ Designer    │ │ Editor              │ │   │
│  │  └─────────────┘ └─────────────┘ └─────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   Orchestration Layer                      │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐ │   │
│  │  │ Sync        │ │ Conflict    │ │ Transformation      │ │   │
│  │  │ Scheduler   │ │ Resolver    │ │ Engine              │ │   │
│  │  └─────────────┘ └─────────────┘ └─────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   Connector Layer                          │   │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ │   │
│  │  │  SAP   │ │ Oracle │ │Workday │ │HubSpot │ │Shopify │ │   │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   Salesforce Layer                         │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐ │   │
│  │  │ Bulk API    │ │ Streaming   │ │ Metadata API        │ │   │
│  │  │ 2.0         │ │ API         │ │                     │ │   │
│  │  └─────────────┘ └─────────────┘ └─────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 三、连接器框架

### 3.1 连接器接口定义

```python
# Connector Interface

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import AsyncIterator, Any
from enum import Enum

class SyncDirection(Enum):
    SALESFORCE_TO_SOURCE = "sf_to_source"
    SOURCE_TO_SALESFORCE = "source_to_sf"
    BIDIRECTIONAL = "bidirectional"

class SyncMode(Enum):
    FULL = "full"
    INCREMENTAL = "incremental"
    CDC = "change_data_capture"

@dataclass
class ConnectionConfig:
    """连接配置"""
    connector_type: str
    credentials: dict
    options: dict = None

@dataclass
class SyncConfig:
    """同步配置"""
    direction: SyncDirection
    mode: SyncMode
    source_object: str
    target_object: str
    field_mappings: dict
    filters: dict = None
    schedule: str = None  # cron expression

@dataclass
class SyncResult:
    """同步结果"""
    success: bool
    records_processed: int
    records_created: int
    records_updated: int
    records_failed: int
    errors: list[dict]
    duration_seconds: float

class BaseConnector(ABC):
    """连接器基类"""

    def __init__(self, config: ConnectionConfig):
        self.config = config
        self._connection = None

    @abstractmethod
    async def connect(self) -> bool:
        """建立连接"""
        pass

    @abstractmethod
    async def disconnect(self):
        """断开连接"""
        pass

    @abstractmethod
    async def test_connection(self) -> bool:
        """测试连接"""
        pass

    @abstractmethod
    async def get_objects(self) -> list[dict]:
        """获取可用对象列表"""
        pass

    @abstractmethod
    async def get_object_schema(self, object_name: str) -> dict:
        """获取对象 schema"""
        pass

    @abstractmethod
    async def read_records(
        self,
        object_name: str,
        fields: list[str],
        filters: dict = None,
        last_modified_after: str = None
    ) -> AsyncIterator[dict]:
        """读取记录 (流式返回)"""
        pass

    @abstractmethod
    async def write_records(
        self,
        object_name: str,
        records: list[dict],
        operation: str = "upsert"
    ) -> dict:
        """写入记录"""
        pass

    @abstractmethod
    async def get_changes(
        self,
        object_name: str,
        since: str
    ) -> AsyncIterator[dict]:
        """获取变更 (CDC)"""
        pass
```

### 3.2 SAP 连接器实现

```python
# SAP Connector

from pyrfc import Connection as SAPConnection

class SAPConnector(BaseConnector):
    """SAP ECC/S4HANA 连接器"""

    OBJECT_MAPPINGS = {
        "Customer": {"bapi": "BAPI_CUSTOMER_GETLIST", "detail": "BAPI_CUSTOMER_GETDETAIL2"},
        "Material": {"bapi": "BAPI_MATERIAL_GETLIST", "detail": "BAPI_MATERIAL_GET_DETAIL"},
        "SalesOrder": {"bapi": "BAPI_SALESORDER_GETLIST", "detail": "BAPI_SALESORDER_GETDETAIL"},
        "PurchaseOrder": {"bapi": "BAPI_PO_GETITEMS", "detail": "BAPI_PO_GETDETAIL"},
        "Invoice": {"bapi": "BAPI_BILLINGDOC_GETLIST", "detail": "BAPI_BILLINGDOC_GETDETAIL"},
    }

    async def connect(self) -> bool:
        """连接 SAP"""
        try:
            self._connection = SAPConnection(
                ashost=self.config.credentials.get("host"),
                sysnr=self.config.credentials.get("system_number", "00"),
                client=self.config.credentials.get("client", "100"),
                user=self.config.credentials.get("username"),
                passwd=self.config.credentials.get("password"),
                lang=self.config.credentials.get("language", "EN")
            )
            return True
        except Exception as e:
            raise ConnectionError(f"SAP 连接失败: {e}")

    async def disconnect(self):
        """断开 SAP 连接"""
        if self._connection:
            self._connection.close()
            self._connection = None

    async def test_connection(self) -> bool:
        """测试 SAP 连接"""
        try:
            # 调用 RFC_PING
            result = self._connection.call("RFC_PING")
            return True
        except:
            return False

    async def get_objects(self) -> list[dict]:
        """获取可用 SAP 对象"""
        return [
            {"name": name, "label": name, "type": "table"}
            for name in self.OBJECT_MAPPINGS.keys()
        ]

    async def get_object_schema(self, object_name: str) -> dict:
        """获取 SAP 对象 Schema"""
        # 从 SAP Data Dictionary 获取表结构
        result = self._connection.call(
            "RFC_READ_TABLE",
            QUERY_TABLE=self._get_sap_table(object_name),
            FIELDS=[],
            OPTIONS=[],
            ROWCOUNT=0
        )

        fields = []
        for field in result.get("FIELDS", []):
            fields.append({
                "name": field["FIELDNAME"],
                "type": self._sap_type_to_common(field["TYPE"]),
                "length": field.get("LENGTH", 0),
                "description": field.get("FIELDTEXT", "")
            })

        return {"name": object_name, "fields": fields}

    async def read_records(
        self,
        object_name: str,
        fields: list[str],
        filters: dict = None,
        last_modified_after: str = None
    ) -> AsyncIterator[dict]:
        """读取 SAP 记录"""
        mapping = self.OBJECT_MAPPINGS.get(object_name)
        if not mapping:
            raise ValueError(f"不支持的对象: {object_name}")

        # 构建 SAP 查询选项
        options = []
        if filters:
            for field, value in filters.items():
                options.append({"TEXT": f"{field} EQ '{value}'"})

        if last_modified_after:
            options.append({"TEXT": f"ERDAT GE '{last_modified_after}'"})

        # 分批读取
        batch_size = 1000
        offset = 0

        while True:
            result = self._connection.call(
                "RFC_READ_TABLE",
                QUERY_TABLE=self._get_sap_table(object_name),
                FIELDS=[{"FIELDNAME": f} for f in fields],
                OPTIONS=options,
                ROWSKIPS=offset,
                ROWCOUNT=batch_size
            )

            data = result.get("DATA", [])
            if not data:
                break

            for row in data:
                yield self._parse_sap_row(row, fields)

            if len(data) < batch_size:
                break

            offset += batch_size

    async def write_records(
        self,
        object_name: str,
        records: list[dict],
        operation: str = "upsert"
    ) -> dict:
        """写入 SAP 记录"""
        results = {
            "success": 0,
            "failed": 0,
            "errors": []
        }

        for record in records:
            try:
                if operation == "insert" or operation == "upsert":
                    self._create_sap_record(object_name, record)
                elif operation == "update":
                    self._update_sap_record(object_name, record)

                results["success"] += 1

            except Exception as e:
                results["failed"] += 1
                results["errors"].append({
                    "record": record,
                    "error": str(e)
                })

        return results

    def _get_sap_table(self, object_name: str) -> str:
        """对象名到 SAP 表名映射"""
        table_mappings = {
            "Customer": "KNA1",
            "Material": "MARA",
            "SalesOrder": "VBAK",
            "PurchaseOrder": "EKKO",
            "Invoice": "VBRK"
        }
        return table_mappings.get(object_name)

    def _sap_type_to_common(self, sap_type: str) -> str:
        """SAP 类型转通用类型"""
        type_map = {
            "C": "string",
            "N": "number",
            "D": "date",
            "T": "time",
            "P": "decimal",
            "I": "integer",
            "F": "float"
        }
        return type_map.get(sap_type, "string")

    def _parse_sap_row(self, row: dict, fields: list[str]) -> dict:
        """解析 SAP 行数据"""
        wa = row.get("WA", "")
        # SAP 返回固定宽度字符串，需要按字段切分
        # 实际实现需要根据 FIELDS 元数据解析
        return {"raw": wa}
```

### 3.3 Workday 连接器

```python
# Workday Connector

import zeep
from zeep.transports import Transport

class WorkdayConnector(BaseConnector):
    """Workday HCM 连接器"""

    OBJECT_MAPPINGS = {
        "Worker": {
            "service": "Human_Resources",
            "operation": "Get_Workers"
        },
        "Organization": {
            "service": "Human_Resources",
            "operation": "Get_Organizations"
        },
        "JobProfile": {
            "service": "Human_Resources",
            "operation": "Get_Job_Profiles"
        },
        "Compensation": {
            "service": "Compensation",
            "operation": "Get_Compensation"
        }
    }

    def __init__(self, config: ConnectionConfig):
        super().__init__(config)
        self.tenant = config.credentials.get("tenant")
        self.client_id = config.credentials.get("client_id")
        self.client_secret = config.credentials.get("client_secret")
        self.refresh_token = config.credentials.get("refresh_token")
        self._access_token = None

    async def connect(self) -> bool:
        """获取 Workday OAuth Token"""
        token_url = f"https://wd2-impl-services1.workday.com/ccx/oauth2/{self.tenant}/token"

        async with aiohttp.ClientSession() as session:
            async with session.post(
                token_url,
                data={
                    "grant_type": "refresh_token",
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "refresh_token": self.refresh_token
                }
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    self._access_token = data["access_token"]
                    return True
                else:
                    raise ConnectionError(f"Workday 认证失败: {response.status}")

    async def get_object_schema(self, object_name: str) -> dict:
        """获取 Workday 对象 Schema"""
        # Workday 使用 Web Services，从 WSDL 获取 schema
        mapping = self.OBJECT_MAPPINGS.get(object_name)
        wsdl_url = f"https://wd2-impl-services1.workday.com/ccx/service/{self.tenant}/{mapping['service']}?wsdl"

        transport = Transport()
        transport.session.headers["Authorization"] = f"Bearer {self._access_token}"

        client = zeep.Client(wsdl_url, transport=transport)

        # 从 WSDL 提取类型定义
        return self._extract_schema_from_wsdl(client, object_name)

    async def read_records(
        self,
        object_name: str,
        fields: list[str],
        filters: dict = None,
        last_modified_after: str = None
    ) -> AsyncIterator[dict]:
        """读取 Workday 记录"""
        mapping = self.OBJECT_MAPPINGS.get(object_name)

        wsdl_url = f"https://wd2-impl-services1.workday.com/ccx/service/{self.tenant}/{mapping['service']}?wsdl"

        transport = Transport()
        transport.session.headers["Authorization"] = f"Bearer {self._access_token}"

        client = zeep.Client(wsdl_url, transport=transport)

        # 构建请求参数
        request_criteria = {}
        if filters:
            request_criteria.update(filters)
        if last_modified_after:
            request_criteria["Transaction_Log_Criteria"] = {
                "Transaction_Date_Range_Data": {
                    "Updated_From": last_modified_after
                }
            }

        # 分页读取
        page = 1
        page_size = 100

        while True:
            response_filter = {
                "Page": page,
                "Count": page_size
            }

            operation = getattr(client.service, mapping["operation"])
            response = operation(
                Request_Criteria=request_criteria,
                Response_Filter=response_filter
            )

            records = self._extract_records(response, object_name)
            for record in records:
                yield self._filter_fields(record, fields)

            if len(records) < page_size:
                break

            page += 1

    def _extract_records(self, response, object_name: str) -> list[dict]:
        """从 Workday 响应提取记录"""
        # 不同对象的响应结构不同
        data_key = f"{object_name}_Data"
        if hasattr(response, "Response_Data"):
            return [
                zeep.helpers.serialize_object(record)
                for record in getattr(response.Response_Data, data_key, [])
            ]
        return []
```

### 3.4 HubSpot 连接器

```python
# HubSpot Connector

import hubspot
from hubspot.crm.contacts import ApiException

class HubSpotConnector(BaseConnector):
    """HubSpot CRM 连接器"""

    OBJECT_MAPPINGS = {
        "Contact": "contacts",
        "Company": "companies",
        "Deal": "deals",
        "Ticket": "tickets",
        "Product": "products"
    }

    def __init__(self, config: ConnectionConfig):
        super().__init__(config)
        self.api_key = config.credentials.get("api_key")
        self.access_token = config.credentials.get("access_token")

    async def connect(self) -> bool:
        """初始化 HubSpot 客户端"""
        try:
            self._client = hubspot.Client.create(access_token=self.access_token)
            return True
        except Exception as e:
            raise ConnectionError(f"HubSpot 连接失败: {e}")

    async def test_connection(self) -> bool:
        """测试 HubSpot 连接"""
        try:
            self._client.crm.contacts.basic_api.get_page(limit=1)
            return True
        except:
            return False

    async def get_objects(self) -> list[dict]:
        """获取 HubSpot 对象列表"""
        return [
            {"name": name, "label": name, "type": "crm_object"}
            for name in self.OBJECT_MAPPINGS.keys()
        ]

    async def get_object_schema(self, object_name: str) -> dict:
        """获取 HubSpot 对象属性"""
        api_name = self.OBJECT_MAPPINGS.get(object_name)

        properties = self._client.crm.properties.core_api.get_all(
            object_type=api_name
        )

        fields = []
        for prop in properties.results:
            fields.append({
                "name": prop.name,
                "type": prop.type,
                "label": prop.label,
                "description": prop.description
            })

        return {"name": object_name, "fields": fields}

    async def read_records(
        self,
        object_name: str,
        fields: list[str],
        filters: dict = None,
        last_modified_after: str = None
    ) -> AsyncIterator[dict]:
        """读取 HubSpot 记录"""
        api_name = self.OBJECT_MAPPINGS.get(object_name)

        # 使用 Search API 支持过滤
        filter_groups = []

        if filters:
            filter_groups.append({
                "filters": [
                    {"propertyName": k, "operator": "EQ", "value": v}
                    for k, v in filters.items()
                ]
            })

        if last_modified_after:
            filter_groups.append({
                "filters": [{
                    "propertyName": "hs_lastmodifieddate",
                    "operator": "GTE",
                    "value": last_modified_after
                }]
            })

        after = None
        limit = 100

        while True:
            search_request = {
                "filterGroups": filter_groups,
                "properties": fields,
                "limit": limit
            }
            if after:
                search_request["after"] = after

            api_response = self._client.crm.contacts.search_api.do_search(
                public_object_search_request=search_request
            )

            for result in api_response.results:
                yield {
                    "id": result.id,
                    **result.properties
                }

            if not api_response.paging or not api_response.paging.next:
                break

            after = api_response.paging.next.after

    async def write_records(
        self,
        object_name: str,
        records: list[dict],
        operation: str = "upsert"
    ) -> dict:
        """写入 HubSpot 记录"""
        api_name = self.OBJECT_MAPPINGS.get(object_name)
        results = {"success": 0, "failed": 0, "errors": []}

        # 批量创建/更新
        batch_size = 100
        for i in range(0, len(records), batch_size):
            batch = records[i:i+batch_size]

            try:
                if operation in ["insert", "upsert"]:
                    inputs = [
                        {"properties": record}
                        for record in batch
                    ]
                    batch_input = {"inputs": inputs}

                    self._client.crm.contacts.batch_api.create(
                        batch_input_simple_public_object_input=batch_input
                    )

                results["success"] += len(batch)

            except ApiException as e:
                results["failed"] += len(batch)
                results["errors"].append({"batch": i, "error": str(e)})

        return results

    async def get_changes(
        self,
        object_name: str,
        since: str
    ) -> AsyncIterator[dict]:
        """获取 HubSpot 变更 (使用 lastmodifieddate 查询)"""
        async for record in self.read_records(
            object_name,
            ["*"],  # 所有字段
            last_modified_after=since
        ):
            yield {
                "type": "update",  # HubSpot 不区分创建/更新
                "record": record
            }
```

---

## 四、字段映射引擎

### 4.1 AI 智能映射

```python
# Intelligent Field Mapping

from anthropic import Anthropic
import json

class IntelligentFieldMapper:
    """AI 驱动的智能字段映射"""

    def __init__(self, anthropic_client: Anthropic):
        self.client = anthropic_client

    async def suggest_mappings(
        self,
        source_schema: dict,
        target_schema: dict,
        context: str = None
    ) -> list[dict]:
        """
        使用 AI 建议字段映射

        Args:
            source_schema: 源系统 schema
            target_schema: 目标系统 schema (通常是 Salesforce)
            context: 业务上下文 (可选)

        Returns:
            建议的映射列表
        """

        prompt = f"""你是一个数据集成专家。请根据以下源系统和目标系统的 schema，建议字段映射。

## 源系统 Schema
{json.dumps(source_schema, indent=2, ensure_ascii=False)}

## 目标系统 Schema (Salesforce)
{json.dumps(target_schema, indent=2, ensure_ascii=False)}

{f'## 业务上下文\n{context}' if context else ''}

请以 JSON 数组格式返回建议的映射，每个映射包含：
- source_field: 源字段名
- target_field: 目标字段名
- confidence: 置信度 (0-1)
- transformation: 需要的转换 (可选)
- reason: 映射理由

只返回 JSON，不要其他文字。"""

        message = self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2048,
            messages=[{"role": "user", "content": prompt}]
        )

        # 解析 JSON 响应
        response_text = message.content[0].text
        # 提取 JSON
        json_match = response_text
        if "```json" in response_text:
            json_match = response_text.split("```json")[1].split("```")[0]
        elif "```" in response_text:
            json_match = response_text.split("```")[1].split("```")[0]

        mappings = json.loads(json_match)

        # 验证并返回高置信度映射
        validated = []
        for mapping in mappings:
            if mapping.get("confidence", 0) >= 0.7:
                validated.append(mapping)

        return validated

    async def detect_transformations(
        self,
        source_field: dict,
        target_field: dict,
        sample_values: list
    ) -> dict:
        """检测所需的数据转换"""

        prompt = f"""分析以下字段映射，判断是否需要数据转换。

源字段: {json.dumps(source_field, ensure_ascii=False)}
目标字段: {json.dumps(target_field, ensure_ascii=False)}
示例值: {sample_values[:5]}

返回 JSON 格式：
{{
    "needs_transformation": true/false,
    "transformation_type": "类型",
    "transformation_code": "Python 代码"
}}"""

        message = self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}]
        )

        return json.loads(message.content[0].text)


class FieldTransformer:
    """字段转换器"""

    BUILTIN_TRANSFORMATIONS = {
        "uppercase": lambda x: x.upper() if x else x,
        "lowercase": lambda x: x.lower() if x else x,
        "trim": lambda x: x.strip() if x else x,
        "date_iso": lambda x: datetime.strptime(x, "%Y%m%d").isoformat() if x else x,
        "date_us": lambda x: datetime.strptime(x, "%m/%d/%Y").isoformat() if x else x,
        "phone_e164": lambda x: f"+{re.sub(r'[^0-9]', '', x)}" if x else x,
        "boolean_yn": lambda x: x.upper() == "Y" if x else False,
        "decimal_2": lambda x: round(float(x), 2) if x else 0.0,
    }

    def __init__(self):
        self.custom_transformations = {}

    def register_transformation(self, name: str, func):
        """注册自定义转换"""
        self.custom_transformations[name] = func

    def apply(self, value, transformation: str):
        """应用转换"""
        if transformation in self.BUILTIN_TRANSFORMATIONS:
            return self.BUILTIN_TRANSFORMATIONS[transformation](value)
        elif transformation in self.custom_transformations:
            return self.custom_transformations[transformation](value)
        else:
            # 尝试作为 Python 表达式执行 (危险，生产环境需要沙箱)
            return eval(f"lambda x: {transformation}")(value)

    def apply_mapping(
        self,
        source_record: dict,
        field_mappings: list[dict]
    ) -> dict:
        """应用完整映射"""
        target_record = {}

        for mapping in field_mappings:
            source_field = mapping["source_field"]
            target_field = mapping["target_field"]
            transformation = mapping.get("transformation")

            value = source_record.get(source_field)

            if transformation:
                value = self.apply(value, transformation)

            target_record[target_field] = value

        return target_record
```

---

## 五、冲突解决引擎

### 5.1 冲突检测与解决

```python
# Conflict Resolution Engine

from dataclasses import dataclass
from enum import Enum
from typing import Callable
import hashlib

class ConflictType(Enum):
    DUPLICATE_KEY = "duplicate_key"
    FIELD_VALUE_MISMATCH = "field_value_mismatch"
    MISSING_REQUIRED = "missing_required"
    TYPE_MISMATCH = "type_mismatch"
    REFERENTIAL_INTEGRITY = "referential_integrity"

class ResolutionStrategy(Enum):
    SOURCE_WINS = "source_wins"
    TARGET_WINS = "target_wins"
    NEWEST_WINS = "newest_wins"
    MERGE = "merge"
    MANUAL = "manual"
    AI_DECIDE = "ai_decide"

@dataclass
class Conflict:
    conflict_type: ConflictType
    source_record: dict
    target_record: dict
    field: str = None
    description: str = None

@dataclass
class Resolution:
    strategy: ResolutionStrategy
    resolved_value: any
    confidence: float
    reason: str

class ConflictResolver:
    """冲突解决器"""

    def __init__(self, anthropic_client=None):
        self.anthropic = anthropic_client
        self.default_strategies = {
            ConflictType.DUPLICATE_KEY: ResolutionStrategy.NEWEST_WINS,
            ConflictType.FIELD_VALUE_MISMATCH: ResolutionStrategy.SOURCE_WINS,
            ConflictType.MISSING_REQUIRED: ResolutionStrategy.SOURCE_WINS,
            ConflictType.TYPE_MISMATCH: ResolutionStrategy.MANUAL,
            ConflictType.REFERENTIAL_INTEGRITY: ResolutionStrategy.MANUAL
        }

    def detect_conflicts(
        self,
        source_record: dict,
        target_record: dict,
        schema: dict
    ) -> list[Conflict]:
        """检测冲突"""
        conflicts = []

        for field in schema.get("fields", []):
            field_name = field["name"]
            source_val = source_record.get(field_name)
            target_val = target_record.get(field_name)

            # 值不匹配
            if source_val != target_val and source_val is not None and target_val is not None:
                conflicts.append(Conflict(
                    conflict_type=ConflictType.FIELD_VALUE_MISMATCH,
                    source_record=source_record,
                    target_record=target_record,
                    field=field_name,
                    description=f"源值 '{source_val}' vs 目标值 '{target_val}'"
                ))

            # 缺少必填字段
            if field.get("required") and source_val is None:
                conflicts.append(Conflict(
                    conflict_type=ConflictType.MISSING_REQUIRED,
                    source_record=source_record,
                    target_record=target_record,
                    field=field_name,
                    description=f"必填字段 '{field_name}' 为空"
                ))

            # 类型不匹配
            if source_val is not None:
                expected_type = field.get("type")
                if not self._check_type(source_val, expected_type):
                    conflicts.append(Conflict(
                        conflict_type=ConflictType.TYPE_MISMATCH,
                        source_record=source_record,
                        target_record=target_record,
                        field=field_name,
                        description=f"期望类型 {expected_type}，实际类型 {type(source_val).__name__}"
                    ))

        return conflicts

    def resolve(
        self,
        conflict: Conflict,
        strategy: ResolutionStrategy = None
    ) -> Resolution:
        """解决冲突"""
        strategy = strategy or self.default_strategies.get(
            conflict.conflict_type,
            ResolutionStrategy.MANUAL
        )

        if strategy == ResolutionStrategy.SOURCE_WINS:
            return Resolution(
                strategy=strategy,
                resolved_value=conflict.source_record.get(conflict.field),
                confidence=1.0,
                reason="采用源系统值"
            )

        elif strategy == ResolutionStrategy.TARGET_WINS:
            return Resolution(
                strategy=strategy,
                resolved_value=conflict.target_record.get(conflict.field),
                confidence=1.0,
                reason="保留目标系统值"
            )

        elif strategy == ResolutionStrategy.NEWEST_WINS:
            source_time = conflict.source_record.get("_modified_at", "")
            target_time = conflict.target_record.get("_modified_at", "")

            if source_time >= target_time:
                return Resolution(
                    strategy=strategy,
                    resolved_value=conflict.source_record.get(conflict.field),
                    confidence=0.9,
                    reason=f"源系统更新时间 ({source_time}) 较新"
                )
            else:
                return Resolution(
                    strategy=strategy,
                    resolved_value=conflict.target_record.get(conflict.field),
                    confidence=0.9,
                    reason=f"目标系统更新时间 ({target_time}) 较新"
                )

        elif strategy == ResolutionStrategy.MERGE:
            return self._merge_values(conflict)

        elif strategy == ResolutionStrategy.AI_DECIDE:
            return self._ai_resolve(conflict)

        else:
            return Resolution(
                strategy=ResolutionStrategy.MANUAL,
                resolved_value=None,
                confidence=0.0,
                reason="需要人工处理"
            )

    def _ai_resolve(self, conflict: Conflict) -> Resolution:
        """使用 AI 解决冲突"""
        if not self.anthropic:
            return Resolution(
                strategy=ResolutionStrategy.MANUAL,
                resolved_value=None,
                confidence=0.0,
                reason="AI 服务不可用"
            )

        prompt = f"""作为数据集成专家，请帮助解决以下数据冲突：

字段: {conflict.field}
冲突类型: {conflict.conflict_type.value}
描述: {conflict.description}

源系统值: {conflict.source_record.get(conflict.field)}
目标系统值: {conflict.target_record.get(conflict.field)}

源记录上下文: {json.dumps(conflict.source_record, ensure_ascii=False)[:500]}
目标记录上下文: {json.dumps(conflict.target_record, ensure_ascii=False)[:500]}

请返回 JSON 格式：
{{
    "resolved_value": "建议的值",
    "confidence": 0.0-1.0,
    "reason": "解决理由"
}}"""

        message = self.anthropic.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=500,
            messages=[{"role": "user", "content": prompt}]
        )

        result = json.loads(message.content[0].text)

        return Resolution(
            strategy=ResolutionStrategy.AI_DECIDE,
            resolved_value=result["resolved_value"],
            confidence=result["confidence"],
            reason=result["reason"]
        )

    def _check_type(self, value, expected_type: str) -> bool:
        """检查类型兼容性"""
        type_checks = {
            "string": lambda x: isinstance(x, str),
            "number": lambda x: isinstance(x, (int, float)),
            "integer": lambda x: isinstance(x, int),
            "boolean": lambda x: isinstance(x, bool),
            "date": lambda x: isinstance(x, str),  # 简化处理
            "datetime": lambda x: isinstance(x, str),
        }
        return type_checks.get(expected_type, lambda x: True)(value)
```

---

## 六、同步调度器

### 6.1 调度引擎

```python
# Sync Scheduler

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from dataclasses import dataclass
from enum import Enum
import asyncio

class SyncStatus(Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    PAUSED = "paused"

@dataclass
class SyncJob:
    id: str
    name: str
    connector_config: ConnectionConfig
    sync_config: SyncConfig
    status: SyncStatus = SyncStatus.PENDING
    last_run: str = None
    next_run: str = None
    last_result: SyncResult = None

class SyncScheduler:
    """同步调度器"""

    def __init__(self, connector_factory, salesforce_client):
        self.scheduler = AsyncIOScheduler()
        self.connector_factory = connector_factory
        self.sf_client = salesforce_client
        self.jobs: dict[str, SyncJob] = {}
        self.running_syncs: dict[str, asyncio.Task] = {}

    def start(self):
        """启动调度器"""
        self.scheduler.start()

    def stop(self):
        """停止调度器"""
        self.scheduler.shutdown()

    def add_sync_job(self, job: SyncJob) -> str:
        """添加同步任务"""
        self.jobs[job.id] = job

        if job.sync_config.schedule:
            # 定时任务
            self.scheduler.add_job(
                self._execute_sync,
                CronTrigger.from_crontab(job.sync_config.schedule),
                args=[job.id],
                id=job.id,
                name=job.name
            )

        return job.id

    def remove_sync_job(self, job_id: str):
        """移除同步任务"""
        if job_id in self.jobs:
            del self.jobs[job_id]

        try:
            self.scheduler.remove_job(job_id)
        except:
            pass

    def pause_sync_job(self, job_id: str):
        """暂停同步任务"""
        if job_id in self.jobs:
            self.jobs[job_id].status = SyncStatus.PAUSED
            self.scheduler.pause_job(job_id)

    def resume_sync_job(self, job_id: str):
        """恢复同步任务"""
        if job_id in self.jobs:
            self.jobs[job_id].status = SyncStatus.PENDING
            self.scheduler.resume_job(job_id)

    async def trigger_sync(self, job_id: str) -> SyncResult:
        """手动触发同步"""
        return await self._execute_sync(job_id)

    async def _execute_sync(self, job_id: str) -> SyncResult:
        """执行同步"""
        job = self.jobs.get(job_id)
        if not job:
            raise ValueError(f"任务不存在: {job_id}")

        if job.status == SyncStatus.RUNNING:
            raise RuntimeError(f"任务正在运行: {job_id}")

        job.status = SyncStatus.RUNNING
        start_time = datetime.now()

        try:
            # 创建连接器
            connector = self.connector_factory.create(job.connector_config)
            await connector.connect()

            # 执行同步
            result = await self._run_sync(connector, job.sync_config)

            job.status = SyncStatus.COMPLETED
            job.last_result = result

        except Exception as e:
            result = SyncResult(
                success=False,
                records_processed=0,
                records_created=0,
                records_updated=0,
                records_failed=0,
                errors=[{"error": str(e)}],
                duration_seconds=(datetime.now() - start_time).total_seconds()
            )
            job.status = SyncStatus.FAILED
            job.last_result = result

        finally:
            job.last_run = start_time.isoformat()
            await connector.disconnect()

        return result

    async def _run_sync(
        self,
        connector: BaseConnector,
        config: SyncConfig
    ) -> SyncResult:
        """执行具体同步逻辑"""
        start_time = datetime.now()
        stats = {
            "processed": 0,
            "created": 0,
            "updated": 0,
            "failed": 0,
            "errors": []
        }

        # 获取字段映射
        field_mapper = FieldTransformer()

        # 根据同步方向执行
        if config.direction in [SyncDirection.SOURCE_TO_SALESFORCE, SyncDirection.BIDIRECTIONAL]:
            await self._sync_to_salesforce(connector, config, field_mapper, stats)

        if config.direction in [SyncDirection.SALESFORCE_TO_SOURCE, SyncDirection.BIDIRECTIONAL]:
            await self._sync_from_salesforce(connector, config, field_mapper, stats)

        return SyncResult(
            success=stats["failed"] == 0,
            records_processed=stats["processed"],
            records_created=stats["created"],
            records_updated=stats["updated"],
            records_failed=stats["failed"],
            errors=stats["errors"],
            duration_seconds=(datetime.now() - start_time).total_seconds()
        )

    async def _sync_to_salesforce(
        self,
        connector: BaseConnector,
        config: SyncConfig,
        mapper: FieldTransformer,
        stats: dict
    ):
        """同步到 Salesforce"""
        # 确定增量点
        last_modified = None
        if config.mode == SyncMode.INCREMENTAL:
            last_modified = self._get_last_sync_time(config.source_object)

        # 读取源数据
        source_fields = [m["source_field"] for m in config.field_mappings]

        batch = []
        batch_size = 200  # Salesforce Bulk API 限制

        async for record in connector.read_records(
            config.source_object,
            source_fields,
            config.filters,
            last_modified
        ):
            # 转换字段
            sf_record = mapper.apply_mapping(record, config.field_mappings)
            batch.append(sf_record)
            stats["processed"] += 1

            if len(batch) >= batch_size:
                result = await self._upsert_to_salesforce(
                    config.target_object,
                    batch
                )
                stats["created"] += result.get("created", 0)
                stats["updated"] += result.get("updated", 0)
                stats["failed"] += result.get("failed", 0)
                stats["errors"].extend(result.get("errors", []))
                batch = []

        # 处理剩余
        if batch:
            result = await self._upsert_to_salesforce(config.target_object, batch)
            stats["created"] += result.get("created", 0)
            stats["updated"] += result.get("updated", 0)
            stats["failed"] += result.get("failed", 0)

    async def _upsert_to_salesforce(
        self,
        object_name: str,
        records: list[dict]
    ) -> dict:
        """Upsert 到 Salesforce"""
        # 使用 Bulk API 2.0
        job_info = self.sf_client.bulk2.insert(
            object_name,
            records,
            batch_size=2000
        )

        # 等待完成并获取结果
        result = self.sf_client.bulk2.get_job_results(job_info["id"])

        return {
            "created": result.get("records_created", 0),
            "updated": result.get("records_updated", 0),
            "failed": result.get("records_failed", 0),
            "errors": result.get("errors", [])
        }
```

---

## 七、配置 UI (LWC)

### 7.1 连接管理器

```javascript
// connectionManager.js
import { LightningElement, track } from 'lwc';
import testConnection from '@salesforce/apex/DataUnificationController.testConnection';
import saveConnection from '@salesforce/apex/DataUnificationController.saveConnection';
import getConnections from '@salesforce/apex/DataUnificationController.getConnections';

export default class ConnectionManager extends LightningElement {
    @track connections = [];
    @track selectedConnector = null;
    @track isLoading = false;
    @track showModal = false;

    connectorOptions = [
        { label: 'SAP ECC/S4HANA', value: 'sap' },
        { label: 'Oracle ERP', value: 'oracle' },
        { label: 'Workday', value: 'workday' },
        { label: 'HubSpot', value: 'hubspot' },
        { label: 'Shopify', value: 'shopify' },
        { label: 'Microsoft Dynamics', value: 'dynamics' },
        { label: 'NetSuite', value: 'netsuite' }
    ];

    connectedCallback() {
        this.loadConnections();
    }

    async loadConnections() {
        this.isLoading = true;
        try {
            this.connections = await getConnections();
        } finally {
            this.isLoading = false;
        }
    }

    handleNewConnection() {
        this.showModal = true;
        this.selectedConnector = null;
    }

    handleConnectorChange(event) {
        this.selectedConnector = event.detail.value;
    }

    get credentialFields() {
        const fieldSets = {
            sap: [
                { name: 'host', label: 'SAP Host', type: 'text', required: true },
                { name: 'system_number', label: 'System Number', type: 'text', required: true },
                { name: 'client', label: 'Client', type: 'text', required: true },
                { name: 'username', label: 'Username', type: 'text', required: true },
                { name: 'password', label: 'Password', type: 'password', required: true }
            ],
            workday: [
                { name: 'tenant', label: 'Tenant ID', type: 'text', required: true },
                { name: 'client_id', label: 'Client ID', type: 'text', required: true },
                { name: 'client_secret', label: 'Client Secret', type: 'password', required: true },
                { name: 'refresh_token', label: 'Refresh Token', type: 'password', required: true }
            ],
            hubspot: [
                { name: 'access_token', label: 'Access Token', type: 'password', required: true }
            ],
            shopify: [
                { name: 'shop_name', label: 'Shop Name', type: 'text', required: true },
                { name: 'api_key', label: 'API Key', type: 'password', required: true },
                { name: 'api_secret', label: 'API Secret', type: 'password', required: true }
            ]
        };
        return fieldSets[this.selectedConnector] || [];
    }

    async handleTestConnection() {
        const credentials = this.collectCredentials();
        this.isLoading = true;

        try {
            const result = await testConnection({
                connectorType: this.selectedConnector,
                credentialsJson: JSON.stringify(credentials)
            });

            if (result.success) {
                this.showToast('成功', '连接测试通过', 'success');
            } else {
                this.showToast('失败', result.message, 'error');
            }
        } finally {
            this.isLoading = false;
        }
    }

    async handleSaveConnection() {
        const credentials = this.collectCredentials();
        const connectionName = this.template.querySelector('[data-id="connection-name"]').value;

        this.isLoading = true;

        try {
            await saveConnection({
                name: connectionName,
                connectorType: this.selectedConnector,
                credentialsJson: JSON.stringify(credentials)
            });

            this.showToast('成功', '连接已保存', 'success');
            this.showModal = false;
            this.loadConnections();

        } catch (error) {
            this.showToast('错误', error.body?.message || '保存失败', 'error');
        } finally {
            this.isLoading = false;
        }
    }

    collectCredentials() {
        const credentials = {};
        this.credentialFields.forEach(field => {
            const input = this.template.querySelector(`[data-id="${field.name}"]`);
            if (input) {
                credentials[field.name] = input.value;
            }
        });
        return credentials;
    }
}
```

### 7.2 映射设计器

```javascript
// mappingDesigner.js
import { LightningElement, api, track } from 'lwc';
import getSourceSchema from '@salesforce/apex/DataUnificationController.getSourceSchema';
import getSalesforceSchema from '@salesforce/apex/DataUnificationController.getSalesforceSchema';
import suggestMappings from '@salesforce/apex/DataUnificationController.suggestMappings';

export default class MappingDesigner extends LightningElement {
    @api connectionId;
    @api sourceObject;
    @api targetObject;

    @track sourceFields = [];
    @track targetFields = [];
    @track mappings = [];
    @track isLoading = false;

    async connectedCallback() {
        await this.loadSchemas();
    }

    async loadSchemas() {
        this.isLoading = true;

        try {
            const [sourceSchema, targetSchema] = await Promise.all([
                getSourceSchema({ connectionId: this.connectionId, objectName: this.sourceObject }),
                getSalesforceSchema({ objectName: this.targetObject })
            ]);

            this.sourceFields = sourceSchema.fields.map(f => ({
                label: `${f.name} (${f.type})`,
                value: f.name,
                description: f.description || ''
            }));

            this.targetFields = targetSchema.fields.map(f => ({
                label: `${f.name} (${f.type})`,
                value: f.name,
                required: f.required || false
            }));

        } finally {
            this.isLoading = false;
        }
    }

    async handleAutoMap() {
        this.isLoading = true;

        try {
            const suggestions = await suggestMappings({
                connectionId: this.connectionId,
                sourceObject: this.sourceObject,
                targetObject: this.targetObject
            });

            this.mappings = suggestions.map(s => ({
                id: `${s.source_field}_${s.target_field}`,
                sourceField: s.source_field,
                targetField: s.target_field,
                transformation: s.transformation || '',
                confidence: s.confidence,
                reason: s.reason
            }));

            this.showToast('AI 映射', `建议了 ${this.mappings.length} 个映射`, 'success');

        } catch (error) {
            this.showToast('错误', error.body?.message || 'AI 映射失败', 'error');
        } finally {
            this.isLoading = false;
        }
    }

    handleAddMapping() {
        this.mappings = [...this.mappings, {
            id: `new_${Date.now()}`,
            sourceField: '',
            targetField: '',
            transformation: '',
            confidence: 1.0,
            reason: '手动添加'
        }];
    }

    handleRemoveMapping(event) {
        const id = event.target.dataset.id;
        this.mappings = this.mappings.filter(m => m.id !== id);
    }

    handleMappingChange(event) {
        const id = event.target.dataset.id;
        const field = event.target.dataset.field;
        const value = event.detail.value;

        this.mappings = this.mappings.map(m => {
            if (m.id === id) {
                return { ...m, [field]: value };
            }
            return m;
        });
    }

    @api
    getMappings() {
        return this.mappings.filter(m => m.sourceField && m.targetField);
    }
}
```

---

## 八、部署架构

```yaml
# docker-compose.yml

version: '3.8'

services:
  data-unification-hub:
    build: ./data-unification-hub
    ports:
      - "8083:8083"
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - SALESFORCE_CLIENT_ID=${SALESFORCE_CLIENT_ID}
      - SALESFORCE_CLIENT_SECRET=${SALESFORCE_CLIENT_SECRET}
      - REDIS_URL=redis://redis:6379
      - POSTGRES_URL=postgresql://postgres:password@postgres:5432/datahub
    depends_on:
      - redis
      - postgres
    networks:
      - gbase-network

  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data
    networks:
      - gbase-network

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=datahub
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - gbase-network

volumes:
  redis-data:
  postgres-data:

networks:
  gbase-network:
    driver: bridge
```

---

## 九、MVP 开发计划

### Week 1: 连接器框架
| Day | 任务 | 交付物 |
|-----|------|--------|
| 1-2 | 连接器接口设计 + 工厂模式 | BaseConnector |
| 3-4 | SAP 连接器实现 | SAPConnector |
| 5 | HubSpot 连接器实现 | HubSpotConnector |

### Week 2: 映射与转换
| Day | 任务 | 交付物 |
|-----|------|--------|
| 1-2 | AI 智能映射 | IntelligentFieldMapper |
| 3-4 | 转换引擎 | FieldTransformer |
| 5 | 冲突解决 | ConflictResolver |

### Week 3: 同步引擎
| Day | 任务 | 交付物 |
|-----|------|--------|
| 1-2 | 调度器实现 | SyncScheduler |
| 3-4 | Salesforce Bulk API 集成 | SF Writer |
| 5 | 增量同步逻辑 | CDC Handler |

### Week 4: UI 与部署
| Day | 任务 | 交付物 |
|-----|------|--------|
| 1-2 | LWC 连接管理器 | connectionManager |
| 3-4 | LWC 映射设计器 | mappingDesigner |
| 5 | 部署与文档 | AppExchange 包 |

---

## 十、成功指标

### 业务指标
| 指标 | 目标 | 测量方式 |
|------|------|----------|
| 集成部署时间 | <3 天 | 客户反馈 |
| 数据一致性 | >99% | 对账报告 |
| 维护成本降低 | -40% | ROI 计算 |

### 技术指标
| 指标 | 目标 | 测量方式 |
|------|------|----------|
| 同步吞吐量 | >10K 记录/分钟 | 性能测试 |
| 错误率 | <0.1% | 监控日志 |
| 系统可用性 | 99.9% | 监控告警 |

---

## 参考资料

- [Salesforce Bulk API 2.0](https://developer.salesforce.com/docs/atlas.en-us.api_asynch.meta/api_asynch/)
- [SAP RFC Guide](https://help.sap.com/docs/SAP_NETWEAVER_AS_ABAP)
- [Workday Web Services](https://community.workday.com/sites/default/files/file-hosting/productionapi/)
- [HubSpot CRM API](https://developers.hubspot.com/docs/api/crm/contacts)
