# GBase Meetings 测试计划 (手顺)

## 测试概述

本测试计划用于验证 GBase Meetings Salesforce 应用的所有功能是否正常工作。

**预计测试时间:** 30-45 分钟
**测试环境:** Salesforce Developer Edition Org (DevOrg)

---

## 前置准备

### 1. 登录 Salesforce
- [ ] 打开浏览器，访问 Salesforce 登录页面
- [ ] 使用 DevOrg 凭据登录
- [ ] 确认进入 Lightning Experience 界面

### 2. 配置 API Key (可选 - 如需测试 API 调用)
- [ ] 点击右上角齿轮图标 → **Setup**
- [ ] 在 Quick Find 中搜索 "Custom Settings"
- [ ] 找到 **GBase API Settings** → 点击 **Manage**
- [ ] 点击 **New** 或 **Edit**
- [ ] 填写 `API_Key__c` 值 (从 GBase 获取)
- [ ] 点击 **Save**

---

## 测试用例

### TC-01: Lightning App 访问测试

**目的:** 验证 GBase Meetings 应用可以正常访问

**步骤:**
1. [ ] 点击左上角 App Launcher (九宫格图标)
2. [ ] 在搜索框中输入 "GBase"
3. [ ] 点击 **GBase Meetings** 应用

**预期结果:**
- [ ] 应用成功打开
- [ ] 导航栏显示 Home、GBase Meetings、GBase Documents 标签页

---

### TC-02: Custom Object - 创建会议记录

**目的:** 验证 GBase Meeting 对象可以正常创建记录

**步骤:**
1. [ ] 点击 **GBase Meetings** 标签页
2. [ ] 点击 **New** 按钮
3. [ ] 填写以下字段:
   - Meeting Title: `销售演示会议 - 测试客户`
   - Meeting Date: `今天的日期`
   - Status: `Scheduled`
   - Duration (Minutes): `60`
   - Audio URL: `https://example.com/audio/test.mp3`
   - Account: (选择一个现有客户，如没有先创建一个)
4. [ ] 点击 **Save**

**预期结果:**
- [ ] 记录成功创建
- [ ] 自动跳转到记录详情页面
- [ ] Analysis Status 自动设置为 "Not Started"

---

### TC-03: Validation Rules 测试

**目的:** 验证数据验证规则正常工作

#### 3.1 Audio URL 格式验证
1. [ ] 编辑刚创建的会议记录
2. [ ] 将 Audio URL 改为 `http://example.com/audio.mp3` (非 https)
3. [ ] 点击 Save

**预期结果:**
- [ ] 显示错误: "Audio URL must start with https://"

#### 3.2 Duration 正数验证
1. [ ] 将 Audio URL 改回 https 开头的 URL
2. [ ] 将 Duration 改为 `-10`
3. [ ] 点击 Save

**预期结果:**
- [ ] 显示错误: "Duration must be a positive number"

#### 3.3 Meeting Date 验证
1. [ ] 将 Duration 改回正数 (如 60)
2. [ ] 将 Meeting Date 改为明天的日期
3. [ ] 点击 Save

**预期结果:**
- [ ] 显示错误: "Meeting date cannot be in the future"

#### 3.4 修正并保存
1. [ ] 将 Meeting Date 改为今天或之前的日期
2. [ ] 确保所有字段都有效
3. [ ] 点击 Save

**预期结果:**
- [ ] 记录成功保存

---

### TC-04: List Views 测试

**目的:** 验证预设的列表视图正常工作

**步骤:**
1. [ ] 进入 GBase Meetings 标签页
2. [ ] 点击列表视图下拉菜单，依次测试:

| 视图名称 | 预期结果 |
|---------|---------|
| All Meetings | 显示所有会议记录 |
| My Meetings | 仅显示当前用户创建的记录 |
| Pending Analysis | 显示 Analysis Status = Pending 的记录 |
| Completed Meetings | 显示 Status = Completed 的记录 |
| Recent Meetings | 显示最近 30 天的记录 |

**预期结果:**
- [ ] 所有 5 个列表视图都可以访问
- [ ] 每个视图按预期筛选数据

---

### TC-05: Flow 自动化测试

**目的:** 验证会议完成后自动触发分析状态更新

**步骤:**
1. [ ] 打开之前创建的会议记录
2. [ ] 确保记录有:
   - Audio URL (https 开头)
   - Analysis Status = "Not Started"
3. [ ] 编辑记录，将 **Status** 改为 `Completed`
4. [ ] 点击 Save
5. [ ] 刷新页面

**预期结果:**
- [ ] **Analysis Status** 自动变为 "Pending"

---

### TC-06: Lightning Component 测试

**目的:** 验证自定义 LWC 组件正常显示

**步骤:**
1. [ ] 打开任意 GBase Meeting 记录详情页
2. [ ] 观察页面布局

**预期结果:**
- [ ] 页面正常加载
- [ ] 显示 Related Lists (GBase Documents)
- [ ] 如果配置了 Record Page，应显示自定义组件

---

### TC-07: GBase Document 创建测试

**目的:** 验证关联文档对象可以正常创建

**步骤:**
1. [ ] 在 GBase Meeting 记录详情页
2. [ ] 滚动到 Related Lists 区域
3. [ ] 找到 **GBase Documents** 相关列表
4. [ ] 点击 **New**
5. [ ] 填写:
   - Document Type: `Meeting Minutes`
   - File Name: `测试会议纪要.pdf`
   - Document URL: `https://example.com/docs/minutes.pdf`
   - Generation Status: `Generated`
6. [ ] 点击 Save

**预期结果:**
- [ ] 文档记录成功创建
- [ ] 自动关联到当前 Meeting 记录
- [ ] 在 Related List 中显示

---

### TC-08: Reports 测试

**目的:** 验证预设报表正常运行

**步骤:**
1. [ ] 点击 App Launcher → 搜索 "Reports"
2. [ ] 在 Folders 中找到 **GBase Meeting Reports**
3. [ ] 依次运行以下报表:

| 报表名称 | 测试步骤 |
|---------|---------|
| Meetings by Status | 点击运行，验证按状态分组显示 |
| Meetings This Month | 点击运行，验证显示本月数据 |
| Meetings by Account | 点击运行，验证按客户分组并显示时长合计 |

**预期结果:**
- [ ] 所有 3 个报表都能成功运行
- [ ] 数据正确分组和汇总
- [ ] 显示之前创建的测试数据

---

### TC-09: Dashboard 测试

**目的:** 验证仪表板正常显示

**步骤:**
1. [ ] 在 Reports 应用中，切换到 **Dashboards** 标签
2. [ ] 找到 **GBase Meeting Dashboards** 文件夹
3. [ ] 点击 **Meeting Analytics** 仪表板

**预期结果:**
- [ ] 仪表板成功加载
- [ ] 显示 3 个组件:
  - [ ] 甜甜圈图: Meetings by Status
  - [ ] 条形图: Meetings by Account
  - [ ] 表格: Recent Meetings

---

### TC-10: Permission Set 测试

**目的:** 验证权限集配置正确

**步骤:**
1. [ ] 进入 Setup → Permission Sets
2. [ ] 找到并查看 **GBase Meetings User**
3. [ ] 确认包含:
   - [ ] GBase_Meeting__c: Read, Create, Edit
   - [ ] GBase_Document__c: Read
   - [ ] GBase Meetings App Visibility
   - [ ] Tab Visibility for GBase objects
4. [ ] 查看 **GBase Meetings Admin**
5. [ ] 确认包含完整的 CRUD 权限和 Custom Setting 访问

**预期结果:**
- [ ] 两个 Permission Set 都存在
- [ ] 权限配置符合预期

---

## 清理测试数据 (可选)

如需清理测试数据:
1. [ ] 删除创建的 GBase Document 测试记录
2. [ ] 删除创建的 GBase Meeting 测试记录
3. [ ] 或保留数据用于后续演示

---

## 测试总结

| 测试用例 | 状态 | 备注 |
|---------|------|------|
| TC-01: Lightning App 访问 | ☐ Pass / ☐ Fail | |
| TC-02: 创建会议记录 | ☐ Pass / ☐ Fail | |
| TC-03: Validation Rules | ☐ Pass / ☐ Fail | |
| TC-04: List Views | ☐ Pass / ☐ Fail | |
| TC-05: Flow 自动化 | ☐ Pass / ☐ Fail | |
| TC-06: Lightning Component | ☐ Pass / ☐ Fail | |
| TC-07: GBase Document | ☐ Pass / ☐ Fail | |
| TC-08: Reports | ☐ Pass / ☐ Fail | |
| TC-09: Dashboard | ☐ Pass / ☐ Fail | |
| TC-10: Permission Set | ☐ Pass / ☐ Fail | |

**测试日期:** ____________
**测试人员:** ____________
**总体结果:** ☐ 通过 / ☐ 需修复

---

## 已知问题和限制

1. **API 集成:** 实际 GBase API 调用需要有效的 API Key
2. **Record Page:** 如果自定义 Record Page 未激活，需要在 Setup 中手动激活
3. **Dashboard Running User:** Dashboard 使用指定用户运行，确保该用户有权限

---

## 问题反馈

如发现问题，请记录:
- 问题描述
- 复现步骤
- 截图 (如适用)
- 期望行为 vs 实际行为
