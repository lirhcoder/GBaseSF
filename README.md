# GBase Meetings - Salesforce Integration

GBase x Salesforce 集成项目，为销售团队提供智能会议分析功能。

## 项目概述

GBase Meetings 是一个 Salesforce Lightning 应用，集成 GBase AI 的会议分析能力，帮助销售团队：
- 自动分析销售会议录音
- 生成会议纪要和行动项
- 跟踪客户关系和销售机会

## 功能特性

### Custom Objects
- **GBase Meeting** - 会议记录管理
- **GBase Document** - AI生成的文档管理

### Lightning Components
- Meeting List - 会议列表视图
- Meeting Detail - 会议详情页面
- Meeting Analyzer - AI 分析触发器

### 自动化
- Record-Triggered Flow: 会议完成时自动触发分析
- Platform Events: 实时状态更新

### 报表和仪表板
- Meetings by Status - 按状态分组的会议报表
- Meetings by Account - 按客户分组的会议报表
- Meeting Analytics Dashboard - 会议分析仪表板

## 项目结构

```
gbase-meetings/
├── force-app/main/default/
│   ├── applications/     # Lightning App
│   ├── classes/          # Apex Classes
│   ├── dashboards/       # Dashboards
│   ├── flows/            # Flows
│   ├── lwc/              # Lightning Web Components
│   ├── objects/          # Custom Objects
│   ├── permissionsets/   # Permission Sets
│   ├── reports/          # Reports
│   └── tabs/             # Custom Tabs
├── docs/
│   ├── research/         # 市场调研和分析报告 (HTML)
│   └── analysis/         # 技术设计文档 (Markdown)
└── config/               # 配置文件
```

## 部署

### 前置条件
- Salesforce CLI (sf)
- 已授权的 Salesforce Org

### 部署命令

```bash
# 部署所有组件
sf project deploy start --source-dir force-app --target-org YOUR_ORG_ALIAS

# 仅部署特定组件
sf project deploy start --source-dir force-app/main/default/classes --target-org YOUR_ORG_ALIAS
```

## 配置

### API 配置
1. 进入 Setup > Custom Settings > GBase API Settings
2. 点击 Manage
3. 添加 API_Key__c 值

### Remote Site Setting
已配置 `https://api.gbase.ai` 为远程站点

## 开发阶段

- [x] Phase 1: Custom Objects & Fields
- [x] Phase 2: Apex Classes & Platform Events
- [x] Phase 3: Lightning Components & App
- [x] Phase 4: Permission Sets & Validation Rules
- [x] Phase 5: Reports, Dashboards & Flows

## 文档

查看 `docs/` 目录获取详细的市场调研和技术设计文档。

## License

Copyright (c) 2025 GBase
