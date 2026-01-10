# Salesforce生态系统深度调研报告
## 商谈录音 → AI分析 → 提案书/PPT生成 → Salesforce同步

**调研日期**: 2026年1月10日  
**调研范围**: 日本市场 + 全球市场

---

## Executive Summary

经过深度调研，**确认市场空白存在**：在Salesforce生态系统中（日本及全球），目前**没有任何单一工具能够完成从会议录音到提案书/PPT自动生成的完整端到端工作流**。

市场现状呈现明显的"断层"：
- **前半段已成熟**：会议录音 → AI转写 → 结构化提取 → Salesforce同步（日本有bellSalesAI、JamRoll、amptalk、ACES Meet等多款成熟产品）
- **后半段已成熟**：Salesforce数据 → 模板化文档生成（Conga Composer、PDF Butler等）
- **关键缺失**：会议内容 → 提案书/PPT智能生成（**无产品覆盖**）

---

## 一、日本市场主要工具详细分析

### 1.1 会议录音 → Salesforce自动化工具

#### **bellSalesAI（ベルフェイス株式会社）**
| 项目 | 详情 |
|------|------|
| **AppExchange状态** | ✅ 已上架（2025/02/18最新版本） |
| **核心能力** | Salesforce入力作業自動化 - AI从商谈对话中提取结构化数据 |
| **工作流** | 商談会話 → AI構造化 → ボタン1つでSalesforce登録 |
| **特色功能** | • 对面商谈支持（智能手机APP录音）<br>• 自动生成サマリー和ネクストアクション<br>• 自动建议关联的Salesforce记录<br>• 高精度日语语音识别 |
| **客户案例** | LIFULL、みらいワークス、アイティフォー、タイミー、肥後銀行 |
| **文档生成能力** | ❌ 不支持提案书生成<br>❌ 不支持PPT生成 |

#### **JamRoll（株式会社Poetics → ナレッジワーク）**
| 项目 | 详情 |
|------|------|
| **AppExchange状态** | ❌ 未上架（独立SaaS，API集成） |
| **核心能力** | 商談解析AI - BANTCH自动提取 |
| **工作流** | Zoom/Teams/Meet → 録画・文字起こし → 要約・解析 → Salesforce自動入力 |
| **特色功能** | • BANTCH提取（Budget, Authority, Need, Timeline, Competition, Human resources）<br>• 要約カスタマイズ機能（通过prompt自定义）<br>• Salesforceマッピング機能（字段自定义映射）<br>• JamRoll Deal（AI自动判断案件进展） |
| **客户案例** | コニカミノルタQOLソリューションズ、Nstock、ラクスパートナーズ |
| **文档生成能力** | ❌ 不支持提案书生成<br>❌ 不支持PPT生成 |

#### **amptalk（amptalk株式会社）**
| 项目 | 详情 |
|------|------|
| **AppExchange状态** | ✅ 已上架 |
| **核心能力** | 電話・商談解析 - IP电话 + 在线会议的AI分析 |
| **工作流** | IP電話/Web会議 → 書き起こし・要約・解析 → Salesforce/HubSpot/Slack自動出力 |
| **特色功能** | • 独自AI声纹识别（无需事前登录）<br>• Salesforceマッピング機能<br>• amptalk assist（通过Teams聊天自然语言输入Salesforce）<br>• 对面商谈支持 |
| **定价** | amptalk assist: ¥1,900/账户/月（最低50账户） |
| **客户案例** | ROXX（back check）等 |
| **文档生成能力** | ❌ 不支持提案书生成<br>❌ 不支持PPT生成 |

#### **ACES Meet（株式会社ACES - 东大松尾研发）**
| 项目 | 详情 |
|------|------|
| **AppExchange状态** | ✅ Salesforce连携（非AppExchange原生） |
| **核心能力** | 商談解析クラウド - 录画・文字起こし・要約・解析 |
| **工作流** | Zoom/Meet/Teams → 自動録画・書き起こし → AI要約 → Salesforce活動履歴1クリック記録 |
| **特色功能** | • 话者分离<br>• 表情解析<br>• ChatGPT连携的AIまとめ機能<br>• 议事录テンプレート機能<br>• ACES Meet API（2025/08公开） |
| **技术背景** | SOTA水准音声認識アルゴリズム（独自开发） |
| **文档生成能力** | ❌ 不支持提案书生成<br>❌ 不支持PPT生成 |

#### **Allganize Japan（Alli LLM App Market）**
| 项目 | 详情 |
|------|------|
| **产品形态** | 生成AI・LLMアプリプラットフォーム |
| **核心能力** | 多种预置LLM应用 + 自定义应用构建 |
| **Salesforce相关功能** | • 议事录作成 → BANTC自动提取<br>• Salesforce自動登録<br>• 商談ページ作成<br>• BI Agent（Salesforce数据分析） |
| **实际效果** | 月103小时业务时间削减（自社案例） |
| **文档生成能力** | ❌ 无提案书/PPT自动生成功能 |

---

### 1.2 文档生成工具（Salesforce AppExchange）

#### **Conga Composer（全球领先）**
| 项目 | 详情 |
|------|------|
| **AppExchange状态** | ✅ 全球AppExchange领导者 |
| **核心能力** | 模板化文档生成 - 从Salesforce数据自动填充 |
| **支持格式** | Word、Excel、PowerPoint、PDF、HTML、CSV |
| **支持文档类型** | 见积书、请求书、纳品书、提案书、契约书等 |
| **定价** | $20 USD/用户/月起（10用户起） |
| **关键限制** | ⚠️ **只能从Salesforce现有数据生成**<br>❌ **不能从会议内容直接提取生成** |

#### **PDF Butler（日本市场）**
| 项目 | 详情 |
|------|------|
| **AppExchange状态** | ✅ 已上架（日本市场专注） |
| **核心能力** | Salesforce专用文档自动生成 |
| **支持格式** | PDF、Word、Excel、PowerPoint、CSV、Email |
| **模板方式** | Word/Excel/PowerPoint模板 + Salesforce数据自动插入 |
| **定价** | ¥1,900/用户/月（极具价格竞争力） |
| **特色** | 30日無料トライアル、SIGN Butler电子签名连携 |
| **关键限制** | ⚠️ **模板驱动，需预先设计**<br>❌ **不能从会议内容智能生成** |

#### **Office File Creator**
| 项目 | 详情 |
|------|------|
| **AppExchange状态** | ✅ 已上架（2025/04/20最新版本） |
| **核心能力** | 帳票出力 - Excel/Word/PowerPoint/PDF |
| **特点** | 可使用现有Excel/Word/PowerPoint文件作为模板 |

#### **Industries Document Generation（Salesforce OmniStudio）**
| 项目 | 详情 |
|------|------|
| **类型** | Salesforce原生功能（Industries Cloud） |
| **支持格式** | Word (.docx)、PowerPoint (.pptx)、PDF、HTML |
| **工作方式** | Token嵌入模板 → Data Mapper映射 → OmniScript生成 |
| **适用行业** | 金融、保险、通信等重度文档行业 |
| **关键限制** | ⚠️ **需要复杂配置**<br>❌ **不支持会议内容智能提取** |

---

## 二、全球市场主要工具

### 2.1 Conversation Intelligence平台

#### **Gong.io**
| 项目 | 详情 |
|------|------|
| **AppExchange状态** | ✅ 已上架 |
| **核心能力** | Revenue Intelligence Platform - 对话分析与洞察 |
| **功能** | • 通话录音・转写・分析<br>• 话术比率、情绪分析、竞品提及检测<br>• Deal风险预警<br>• 与Salesforce双向数据同步 |
| **用户规模** | 84,000+付费用户、2,000+客户 |
| **日本市场** | 无日语本地化，使用有限 |
| **文档生成能力** | ❌ **不支持提案书/PPT生成** |

#### **Chorus（ZoomInfo）**
| 项目 | 详情 |
|------|------|
| **核心能力** | Conversation Intelligence - 销售通话分析 |
| **Salesforce集成** | ✅ 支持 |
| **文档生成能力** | ❌ **不支持提案书/PPT生成** |

---

### 2.2 Salesforce原生AI能力

#### **Agentforce for Media（2025年7月发布）** ⭐ 最接近需求
| 项目 | 详情 |
|------|------|
| **核心能力** | **広告提案スキル** - 提案書・ピッチ資料の自動作成 |
| **工作流** | 商談情報 → アカウント・商談サマリー作成 → プロダクト抽出 → 提案書ドラフト作成 |
| **效果声称** | 提案書作成時間：数日〜数週間 → **数分** |
| **关键限制** | ⚠️ **仅限媒体行业**<br>⚠️ **未整合会议录音功能** |

#### **Einstein GPT / Einstein Conversation Insights**
| 项目 | 详情 |
|------|------|
| **类型** | Salesforce生成AI功能 |
| **Sales Cloud能力** | • 邮件自动生成<br>• 通话摘要<br>• Next Action建议 |
| **关键限制** | ❌ **不支持提案书/PPT完整生成** |

---

## 三、AI PPT生成工具（独立市场）

以下工具**均不与Salesforce/会议录音集成**：

| 工具名 | 特点 | Salesforce集成 | 会议集成 |
|--------|------|----------------|----------|
| **イルシル** | 1,000+日本模板、日语优化 | ❌ | ❌ |
| **Gamma** | 文字→演示文稿、设计自动优化 | ❌ | ❌ |
| **Canva** | Magic Presentation、丰富模板 | ❌ | ❌ |
| **Beautiful.ai** | 设计自动最适化 | ❌ | ❌ |
| **SlidesGPT/SlidesAI** | GPT驱动的PPT生成 | ❌ | ❌ |

---

## 四、关键市场空白分析

### 完整工作流程缺失对比

| 工作流阶段 | 可用工具 | 是否覆盖 |
|------------|----------|----------|
| ① 会议录音 | bellSalesAI、JamRoll、amptalk、ACES Meet、Gong | ✅ 完全覆盖 |
| ② AI转写 | 上述所有工具 | ✅ 完全覆盖 |
| ③ 结构化提取（BANTC等） | JamRoll、bellSalesAI、amptalk | ✅ 完全覆盖 |
| ④ Salesforce同步 | 上述所有工具 | ✅ 完全覆盖 |
| ⑤ **提案书内容智能生成** | **无** | ❌ **市场空白** |
| ⑥ **PPT自动生成** | **无** | ❌ **市场空白** |
| ⑦ 模板化文档生成 | Conga、PDF Butler | ✅ 覆盖（但需预存数据） |

### 用户当前必须执行的手动步骤

```
当前工作流（需人工介入）：
┌─────────────────┐
│ 1. 商谈会议     │
└────────┬────────┘
         ▼
┌─────────────────┐
│ 2. bellSalesAI/ │ ← 自动化
│    JamRoll录音  │
└────────┬────────┘
         ▼
┌─────────────────┐
│ 3. AI转写/提取  │ ← 自动化
└────────┬────────┘
         ▼
┌─────────────────┐
│ 4. Salesforce   │ ← 自动化
│    自动同步     │
└────────┬────────┘
         ▼
┌─────────────────┐
│ 5. 人工查看     │ ← ⚠️ 手动
│    会议摘要     │
└────────┬────────┘
         ▼
┌─────────────────┐
│ 6. 人工起草     │ ← ⚠️ 手动（1-2小时）
│    提案书大纲   │
└────────┬────────┘
         ▼
┌─────────────────┐
│ 7. 人工制作PPT  │ ← ⚠️ 手动（2-4小时）
│    或使用AI工具 │
└────────┬────────┘
         ▼
┌─────────────────┐
│ 8. 上传至       │ ← 手动
│    Salesforce   │
└─────────────────┘
```

### 目标工作流（端到端自动化）

```
目标工作流（完全自动化）：
┌─────────────────┐
│ 1. 商谈会议     │
└────────┬────────┘
         ▼
┌─────────────────┐
│ 2. 自动录音     │ ← 自动化
│    AI转写/分析  │
└────────┬────────┘
         ▼
┌─────────────────┐
│ 3. AI提取关键   │ ← 自动化
│    客户需求/痛点│
└────────┬────────┘
         ▼
┌─────────────────┐
│ 4. AI生成提案书 │ ← 🆕 新能力
│    基于会议内容 │
└────────┬────────┘
         ▼
┌─────────────────┐
│ 5. AI生成PPT    │ ← 🆕 新能力
│    专业模板套用 │
└────────┬────────┘
         ▼
┌─────────────────┐
│ 6. 一键同步     │ ← 自动化
│    Salesforce   │
└─────────────────┘

预估时间节省：每商谈 3-6 小时 → 15分钟
```

---

## 五、竞争定位建议

### 独特价值主张

**"唯一连接会议智能与文档生成的解决方案"**

- 填补 Conversation Intelligence（JamRoll/bellSalesAI/Gong）与 Document Generation（Conga/PDF Butler）之间的空白
- 从会议内容**智能生成**提案书，而非仅从Salesforce字段**模板填充**

### 潜在市场策略

| 策略 | 描述 | 优劣势 |
|------|------|--------|
| **独立构建** | 完整构建录音→提案书→PPT→Salesforce全流程 | ✅ 完全控制<br>❌ 开发周期长 |
| **集成bellSalesAI/JamRoll** | 利用其API获取会议数据，专注文档生成层 | ✅ 快速上市<br>⚠️ 依赖第三方 |
| **AppExchange原生** | 作为Conga/PDF Butler的"智能前端"，增加AI生成能力 | ✅ 利用现有生态<br>⚠️ 需要合作 |
| **与Agentforce集成** | 利用Salesforce Agentforce框架，构建行业通用的"提案书生成Agent" | ✅ 未来趋势<br>⚠️ Salesforce平台依赖 |

### 日本市场差异化要点

1. **日本语特化**：高精度日语语音识别 + 日语提案书模板
2. **業界別テンプレート**：制造业、IT、金融等行业专用提案书格式
3. **日本式ビジネス慣習対応**：议事录・提案书・稟議書的日本式格式
4. **対面商談対応**：智能手机录音（bellSalesAI/JamRoll已验证需求）

---

## 六、定价参考

| 产品 | 定价 | 备注 |
|------|------|------|
| bellSalesAI | 非公开 | 需个别咨询 |
| JamRoll | 非公开 | 需个别咨询 |
| amptalk assist | ¥1,900/账户/月（50账户起） | 仅对话输入功能 |
| Conga Composer | $20 USD/用户/月起（10用户起） | 文档生成 |
| PDF Butler | ¥1,900/用户/月 | 日本市场最低价 |
| Gong | 非公开（个别报价） | 企业级价格 |

**建议定价区间**：$30-60 USD/用户/月

- 高于纯转写工具（体现文档生成价值）
- 低于Gong等完整Conversation Intelligence平台
- 对标Conga + 会议智能的组合价值

---

## 七、Agentforce发展趋势分析

### Salesforce AI战略方向

Salesforce于2025年明确推进**Agentforce**战略，从"个人生产力提升"转向"组织级数字劳动力"：

1. **Agentforce for Media**（2025/07）：已实现广告行业的**提案書・ピッチ資料自動作成**
2. **AI商談Search**（サンブリッジ提供）：从过去商谈中AI检索类似案例，辅助提案
3. **活動自動登録**：从メモ/录音自动生成Salesforce活动记录

### 启示

- Salesforce正在逐步向"会议→提案书"自动化方向发展
- 但目前仅限**特定行业**（媒体）和**部分功能**（活动记录）
- **通用行业的完整"会议→提案书→PPT"自动化仍是空白**

---

## 八、结论与建议

### 市场机会确认

| 验证维度 | 结论 |
|----------|------|
| 市场空白存在 | ✅ 确认：无端到端解决方案 |
| 日本市场需求验证 | ✅ 确认：bellSalesAI/JamRoll/amptalk采用证明 |
| 技术可行性 | ✅ 确认：各组件技术成熟 |
| 竞争壁垒 | ✅ 确认：无直接竞争对手 |
| Salesforce战略契合 | ✅ 确认：符合Agentforce发展方向 |

### 下一步建议

1. **日本企业验证**：与具体行业（IT、制造业、金融）的日本企业验证需求细节
2. **原型开发**：JamRoll/bellSalesAI API → LLM提案书生成 → PPT模板套用 → Salesforce附件上传
3. **Salesforce合作**：探索ISV Partner项目、AppExchange上架路径
4. **SI渠道**：与日本Salesforce实施伙伴建立分销合作

---

## 附录：工具详细链接

| 工具 | 链接 |
|------|------|
| bellSalesAI | https://bell-face.com/product/bellsalesai/ |
| JamRoll | https://jamroll.poetics.co.jp/ |
| amptalk | https://amptalk.co.jp/ |
| ACES Meet | https://meet.acesinc.co.jp/ |
| Conga Composer | https://appexchange.salesforce.com/appxListingDetail?listingId=a0N300000016b7FEAQ |
| PDF Butler | https://pdfbutler.jp/ |
| Gong | https://appexchange.salesforce.com/appxListingDetail?listingId=a0N3A00000FeGgcUAF |
| ナレッジワーク | https://knowledgework.cloud/ |
| Allganize | https://www.allganize.ai/ja/ |

---

*本报告基于2026年1月公开信息整理，市场情况可能随时变化。*
