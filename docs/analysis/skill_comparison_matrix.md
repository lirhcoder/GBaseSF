# GBase Skill 最终对比矩阵

> **目的**: 帮助决策优先开发哪个 Skill
> **日期**: 2026-01-10
> **基于**: 5 份技术设计方案

---

## 一、总览对比

| Skill | 评分 | 市场验证 | 开发周期 | 收入潜力 | 推荐阶段 |
|-------|------|----------|----------|----------|----------|
| **Data Cloud Activator** | 8.8 | ⭐⭐⭐⭐⭐ | 4 周 | 高 | **Phase 1** |
| **Industry Cloud Accelerator** | 8.2 | ⭐⭐⭐⭐⭐ | 4 周 | 高 | **Phase 1** |
| **Data Unification Hub** | 7.7 | ⭐⭐⭐⭐⭐ | 4 周 | 中-高 | Phase 2 |
| **Agentforce Companion** | 7.6 | ⭐⭐⭐ | 4 周 | 高 (早期风险) | Phase 2 |
| **Revenue Intelligence** | 7.1 | ⭐⭐⭐⭐⭐ | 4 周 | 中 | Phase 3 |

---

## 二、多维度评估

### 2.1 市场机会评估

| 维度 | Data Cloud | Industry | Unification | Agentforce | Revenue |
|------|------------|----------|-------------|------------|---------|
| TAM (可寻址市场) | $13B | 60% 新客户 | $6.5B+ | $200B | 23% Apps |
| CAGR (年增长率) | 21.7% | 稳定高 | 稳定 | ~40% | 成熟 |
| 市场成熟度 | 成长期 | 成熟期 | 成熟期 | 萌芽期 | 成熟期 |
| 竞争激烈度 | 中 | 低-中 | 高 (MuleSoft) | 低 | 高 |
| **市场得分** | **9/10** | **8/10** | **7/10** | **8/10** | **6/10** |

### 2.2 买家分析

| 维度 | Data Cloud | Industry | Unification | Agentforce | Revenue |
|------|------------|----------|-------------|------------|---------|
| 主要买家 | CDO, CMO | 行业买家 | IT Director | CIO | Sales VP |
| 预算来源 | 数据预算 | 业务预算 | IT预算 | AI预算 | 销售预算 |
| 购买紧迫性 | 高 | 高 | 中-高 | 中 | 中 |
| 决策周期 | 2-4周 | 4-8周 | 4-6周 | 4-8周 | 2-4周 |
| ROI 可量化 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **买家得分** | **9/10** | **8/10** | **8/10** | **7/10** | **8/10** |

### 2.3 技术实现评估

| 维度 | Data Cloud | Industry | Unification | Agentforce | Revenue |
|------|------------|----------|-------------|------------|---------|
| 核心技术 | API集成 | RAG+LWC | 连接器框架 | MCP Server | RAG+NL2SQL |
| GBase 能力匹配 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 实现复杂度 | 中 | 中 | 高 | 中-高 | 中 |
| 依赖外部服务 | SF API | SF API | 多系统 | SF Agent API | SF API |
| 可复用性 | 高 | 中 | 高 | 高 | 高 |
| **技术得分** | **8/10** | **9/10** | **7/10** | **7/10** | **8/10** |

### 2.4 风险评估

| 风险类型 | Data Cloud | Industry | Unification | Agentforce | Revenue |
|----------|------------|----------|-------------|------------|---------|
| Salesforce 原生替代 | 中 | 低 | 中 | **高** | 中 |
| 市场采用不及预期 | 低 | 低 | 低 | **中-高** | 低 |
| 技术实现风险 | 低 | 低 | 中 | 中 | 低 |
| 定价压力 | 中 | 低 | **高** | 中 | 中 |
| 竞争威胁 | 中 | 低 | **高** | 低 | **高** |
| **风险得分** (低=好) | **3/10** | **2/10** | **5/10** | **6/10** | **5/10** |

### 2.5 战略价值评估

| 维度 | Data Cloud | Industry | Unification | Agentforce | Revenue |
|------|------------|----------|-------------|------------|---------|
| 品牌建设 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| 生态位卡位 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| 客户粘性 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| 交叉销售 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **战略得分** | **9/10** | **9/10** | **8/10** | **8/10** | **6/10** |

---

## 三、综合评分

### 计算公式
```
总分 = 市场机会(25%) + 买家分析(20%) + 技术实现(20%) + (10 - 风险)(20%) + 战略价值(15%)
```

### 最终排名

| 排名 | Skill | 市场 | 买家 | 技术 | 风险 | 战略 | **总分** |
|------|-------|------|------|------|------|------|----------|
| **1** | **Data Cloud Activator** | 9 | 9 | 8 | 7 | 9 | **8.45** |
| **2** | **Industry Cloud Accelerator** | 8 | 8 | 9 | 8 | 9 | **8.35** |
| 3 | Data Unification Hub | 7 | 8 | 7 | 5 | 8 | **7.05** |
| 4 | Agentforce Companion | 8 | 7 | 7 | 4 | 8 | **6.85** |
| 5 | Revenue Intelligence | 6 | 8 | 8 | 5 | 6 | **6.55** |

---

## 四、决策建议

### 推荐方案 A: 双轨并行 (推荐)

同时启动 **Data Cloud Activator** + **Industry Cloud Accelerator**

**理由**:
1. 两者评分接近且互补
2. Data Cloud 占领增长市场，Industry 验证垂直模式
3. 4 周后可验证两个市场假设
4. 资源可复用 (RAG 引擎、SF 集成)

**资源分配**:
- Data Cloud Activator: 2 名开发
- Industry Cloud Accelerator: 2 名开发
- 共享: API 集成、UI 组件

### 推荐方案 B: 聚焦突破

只启动 **Data Cloud Activator**

**理由**:
1. 评分最高 (8.45)
2. 市场最确定 ($900M ARR, 21.7% CAGR)
3. Salesforce 战略重点，生态机会大
4. 交叉销售潜力最大

**风险**:
- 单一产品依赖
- 错过行业垂直机会

### 不推荐现阶段启动

1. **Agentforce Companion** - 市场太早期，Salesforce 政策不确定
2. **Revenue Intelligence** - 竞争太激烈，差异化不足

---

## 五、实施路线图

### Phase 1 (Month 1-2): MVP 验证

```
Week 1-4: 开发 Data Cloud Activator MVP
         + Industry Cloud Accelerator MVP (如选方案 A)

目标:
- 3 个数据连接器 (Box, SharePoint, 自定义)
- 数据质量评分 MVP
- 制造业知识库 MVP (如选方案 A)
- 获得 2-3 个 POC 客户
```

### Phase 2 (Month 3-4): 产品完善

```
- 完善 Phase 1 产品
- 启动 Data Unification Hub (如验证成功)
- AppExchange 上架准备
```

### Phase 3 (Month 5-6): 规模扩展

```
- 正式 AppExchange 上架
- 启动 Revenue Intelligence (如有需求)
- 评估 Agentforce Companion (观察市场)
```

---

## 六、关键成功因素

### Data Cloud Activator
1. 与 Salesforce Data Cloud 团队建立关系
2. 快速获得 1-2 个成功案例
3. 差异化定位于"激活层"而非"替代品"

### Industry Cloud Accelerator
1. 选对第一个行业 (建议制造业)
2. 深入理解行业术语和流程
3. 获得行业标杆客户

### 共同关键
1. AppExchange Security Review 通过
2. 建立 Salesforce Partner 关系
3. 营销材料和案例准备

---

## 七、下一步行动

### 立即 (本周)
- [ ] 决定采用方案 A 或 B
- [ ] 组建开发团队
- [ ] 联系潜在 POC 客户

### 短期 (2 周内)
- [ ] 完成技术栈选型
- [ ] 搭建开发环境
- [ ] 制定详细开发计划
- [ ] 开始 Salesforce Partner 申请

### 中期 (1 月内)
- [ ] MVP 开发完成
- [ ] POC 客户试用
- [ ] 收集反馈迭代

---

## 八、文件索引

| 文件 | 描述 |
|------|------|
| `technical_design_data_cloud_activator.md` | Data Cloud Activator 技术方案 |
| `technical_design_industry_cloud_accelerator.md` | Industry Cloud Accelerator 技术方案 |
| `technical_design_data_unification_hub.md` | Data Unification Hub 技术方案 |
| `technical_design_agentforce_companion.md` | Agentforce Companion 技术方案 |
| `technical_design_revenue_intelligence_assistant.md` | Revenue Intelligence 技术方案 |
| `market_first_analysis.md` | 市场分析报告 |
| `skill_proposals_v2.md` | Skill 方案 v2.0 |
| `progress.md` | 项目进度日志 |

---

## 决策确认

请选择:

- [ ] **方案 A**: 双轨并行 (Data Cloud + Industry)
- [ ] **方案 B**: 聚焦 Data Cloud Activator
- [ ] **其他**: 请说明

选择后，我将生成详细的项目启动计划。
