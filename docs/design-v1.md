# AI 预算记账助手 — V1 技术设计文档

> 本文档用于指导 V1 编码实现，是开发过程中的唯一技术参考。
> 核心原则：**账单是原始数据，预算是计算结果**，不存储"剩余预算"字段。

---

## 1. 技术栈

| 层面 | 方案 | 说明 |
|------|------|------|
| **前端框架** | React 18 + TypeScript + Vite | 稳定、类型安全、构建快 |
| **样式方案** | Tailwind CSS | 原子化 CSS，开发效率高 |
| **UI 组件** | shadcn/ui | 基于 Radix UI，可定制、按需引入 |
| **本地数据库** | Dexie.js 4.x + IndexedDB | 结构化数据存储、支持索引和查询 |
| **状态管理** | Zustand | 轻量、无 boilerplate、与 Dexie 配合好 |
| **路由** | React Router v6 | SPA 路由 |
| **日期处理** | dayjs | 轻量、不可变、树摇友好 |
| **表单校验** | React Hook Form + Zod | 类型安全的表单验证 |
| **AI 接口** | 前端直连 LLM API（fetch） | V1 个人自用，API Key 存 localStorage |
| **移动端** | PWA（vite-plugin-pwa） | 支持添加到桌面、离线缓存 |
| **构建工具** | Vite | HMR 快速、打包体积小 |

### 关键决策说明

- **不用 Vue / Angular**：React 生态对 Dexie + Zustand + shadcn/ui 支持更成熟，团队也更熟悉。
- **不用后端**：V1 纯本地运行，无登录、无云同步。AI 请求从浏览器直连 LLM API。
- **不用 Electron / Capacitor**：V1 先做 PWA，够用。需要原生能力时 V2 再考虑。
- **不用 Redux Toolkit**：Zustand 足够，减少样板代码。
- **不用重型 UI 框架（Ant Design / Element Plus）**：shadcn/ui + Tailwind 更轻，适合定制预算进度条、颜色状态等。

---

## 2. 项目目录结构

```
src/
├─ app/
│  ├─ App.tsx                  # 应用入口，初始化 + 路由
│  └─ router.tsx               # 路由配置
│
├─ pages/
│  ├─ DashboardPage.tsx        # 首页 Dashboard
│  ├─ AddRecordPage.tsx        # 记账页（AI + 手动）
│  ├─ RecordsPage.tsx          # 账单列表页
│  ├─ BudgetPage.tsx           # 预算设置页
│  └─ SettingsPage.tsx         # 设置页
│
├─ components/
│  ├─ layout/
│  │  ├─ BottomNav.tsx         # 底部导航栏
│  │  ├─ TopBar.tsx            # 顶部栏（月份选择器）
│  │  └─ PageContainer.tsx     # 页面容器
│  ├─ dashboard/
│  │  ├─ BudgetSummary.tsx     # 本月剩余 / 今日建议可花
│  │  ├─ CategoryProgressList.tsx  # 分类进度列表
│  │  └─ BudgetAllocationHint.tsx  # 未分配 / 超分配提示
│  ├─ record/
│  │  ├─ AiInputBox.tsx        # AI 自然语言输入框
│  │  ├─ AiParseResultList.tsx # AI 解析结果确认列表
│  │  ├─ ManualForm.tsx        # 手动记账表单
│  │  └─ RecordCard.tsx        # 单条账单卡片
│  ├─ budget/
│  │  ├─ TotalBudgetInput.tsx  # 总预算设置
│  │  ├─ CategoryBudgetRow.tsx # 单条分类预算设置行
│  │  └─ BudgetProgressBar.tsx # 预算进度条（绿/黄/红）
│  ├─ records/
│  │  ├─ RecordGroup.tsx       # 按日期分组的账单组
│  │  └─ RecordActions.tsx     # 编辑 / 删除操作
│  ├─ settings/
│  │  ├─ DataManagement.tsx    # 导出 / 导入 / 清空
│  │  ├─ AiConfig.tsx          # AI API Key 配置
│  │  └─ CurrencySetting.tsx   # 货币单位设置
│  └─ common/
│     ├─ MonthPicker.tsx       # 月份选择器
│     ├─ ConfirmDialog.tsx     # 确认弹窗
│     ├─ EmptyState.tsx        # 空状态
│     └─ CategoryBadge.tsx     # 分类标签
│
├─ db/
│  ├─ index.ts                 # Dexie 实例初始化 + 版本控制
│  ├─ schema.ts                # 表结构定义 + 索引
│  └─ seed.ts                  # 首次启动数据初始化（预置分类）
│
├─ stores/
│  ├─ appStore.ts              # 全局状态（当前月份、空状态等）
│  ├─ recordStore.ts           # 账单数据读写
│  ├─ budgetStore.ts           # 预算数据读写
│  └─ settingsStore.ts         # 设置数据读写（封装 AppSettings 和 LocalSecrets，底层存储位置不同）
│
├─ services/
│  ├─ budget/
│  │  └─ calculator.ts         # 核心计算函数（纯函数）
│  ├─ record/
│  │  └─ recordService.ts      # 账单增删改查
│  ├─ ai/
│  │  ├─ prompt.ts             # AI Prompt 模板
│  │  ├─ aiClient.ts           # LLM API 调用封装
│  │  ├─ parseRecord.ts        # 调用 AI 解析入口
│  │  └─ normalize.ts          # 前端校验和规范化
│  └─ backup/
│     ├─ export.ts             # JSON 导出
│     └─ import.ts             # JSON 导入（全量覆盖）
│
├─ types/
│  └─ index.ts                 # 全部 TypeScript 类型定义
│
├─ utils/
│  ├─ date.ts                  # 日期工具函数
│  ├─ money.ts                 # 金额格式化
│  └─ id.ts                    # ID 生成
│
├─ hooks/
│  ├─ useCurrentMonth.ts       # 当前月份管理
│  ├─ useBudgetData.ts         # 预算数据聚合
│  └─ useRecords.ts            # 账单数据聚合
│
└─ main.tsx                    # Vite 入口
```

---

## 3. 数据库设计（Dexie.js）

### 3.1 表结构

```typescript
// db/schema.ts

const db = new Dexie('AIBill')

db.version(1).stores({
  categories:       'id, name, budgetable, archived, order',
  monthlyBudgets:   'id, &month',
  categoryBudgets:  'id, &[month+categoryId], month, categoryId',
  records:          'id, date, categoryId, type, source, [categoryId+date], [type+date]',
})
```

| 表名 | 主键 | 索引 | 说明 |
|------|------|------|------|
| categories | `id` | `name`, `budgetable`, `archived`, `order` | 分类表 |
| monthlyBudgets | `id` | `&month`（唯一） | 月度总预算 |
| categoryBudgets | `id` | `&[month+categoryId]`（联合唯一）, `month`, `categoryId` | 分类预算 |
| records | `id` | `date`, `categoryId`, `type`, `source`, `[categoryId+date]`, `[type+date]` | 账单记录 |

### 3.2 唯一约束说明

| 表 | 约束 | 说明 |
|----|------|------|
| `monthlyBudgets.month` | 唯一 | 同一月份只能有一条总预算记录 |
| `categoryBudgets[month+categoryId]` | 联合唯一 | 同一月份同一分类只能有一条预算记录 |

### 3.3 预置数据

```typescript
// db/seed.ts

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-food',       name: '餐饮',     icon: '🍽️',  order: 1,  budgetable: true,  archived: false },
  { id: 'cat-transport',  name: '交通',     icon: '🚇',   order: 2,  budgetable: true,  archived: false },
  { id: 'cat-study',      name: '学习',     icon: '📚',   order: 3,  budgetable: true,  archived: false },
  { id: 'cat-entertain',  name: '娱乐',     icon: '🎮',   order: 4,  budgetable: true,  archived: false },
  { id: 'cat-fitness',    name: '健身',     icon: '💪',   order: 5,  budgetable: true,  archived: false },
  { id: 'cat-daily',      name: '日用品',    icon: '🧴',   order: 6,  budgetable: true,  archived: false },
  { id: 'cat-social',     name: '恋爱/社交', icon: '💕',   order: 7,  budgetable: true,  archived: false },
  { id: 'cat-other',      name: '其他',     icon: '📦',   order: 8,  budgetable: true,  archived: false },
  // 系统内置收入分类（不在普通列表中展示给用户）
  { id: 'income',         name: '收入',     icon: '💰',   order: -1, budgetable: false, system: true, archived: false },
]
```

---

## 4. 类型定义

```typescript
// types/index.ts

// ========== 分类 ==========

interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  order: number;
  archived?: boolean;    // 是否归档（停用）
  system?: boolean;      // 是否系统内置（如收入），不允许删除和编辑
  budgetable: boolean;   // 是否参与预算设置和计算（收入分类为 false）
}

// ========== 月度总预算 ==========

interface MonthlyBudget {
  id: string;
  month: string;             // "2026-06"
  totalBudget: number;       // 月总预算
  monthlyIncome?: number;    // 月收入（可选，仅统计展示）
  createdAt: string;         // ISO 时间戳
  updatedAt: string;         // ISO 时间戳
}

// ========== 分类预算 ==========

interface CategoryBudget {
  id: string;
  categoryId: string;
  month: string;             // "2026-06"
  amount: number;            // 该分类本月预算金额
  createdAt: string;
  updatedAt: string;
}

// ========== 账单记录 ==========

interface RecordItem {
  id: string;
  title: string;
  amount: number;            // 必须 > 0
  categoryId: string;        // 支出关联普通分类；收入统一使用 "income"
  type: 'expense' | 'income';
  date: string;              // "2026-06-09"
  note?: string;
  source: 'manual' | 'ai';
  createdAt: string;         // ISO 时间戳
  updatedAt: string;         // 编辑时更新
}

// ========== AI 解析结果（未入库） ==========

interface ParsedRecordItem {
  title: string;
  amount: number;            // 必须 > 0
  categoryId?: string;
  categoryName: string;      // AI 识别的分类名称
  type: 'expense' | 'income';
  date: string;              // "2026-06-09"
  confidence: number;        // 置信度 0-1
  rawText?: string;          // 原始输入文本片段
}

// ========== 全局设置（存入 IndexedDB / 参与 JSON 导出） ==========

interface AppSettings {
  currency: 'CNY';
  defaultMonthBudget?: number;  // 新建月份时的默认总预算
  aiProvider?: string;          // AI 服务商
  aiModel?: string;             // AI 模型
}

// ========== 本地敏感设置（仅存 localStorage，不参与 JSON 导出） ==========

interface LocalSecrets {
  aiApiKey?: string;            // API Key，仅存 localStorage，不导出
}

// ========== 预算计算结果（只读） ==========

interface BudgetSummary {
  month: string;
  totalBudget: number;
  totalExpense: number;
  remaining: number;
  isOverspent: boolean;
  todaySuggested: number | null; // 当前月份显示今日建议，历史月份为 null
  monthlySurplus?: number;      // 历史月份显示当月结余
}

interface CategoryBudgetStatus {
  categoryId: string;
  categoryName: string;
  budget: number;
  spent: number;
  remaining: number;
  usageRate: number;           // 0-1（展示时乘以 100）
  status: 'normal' | 'warning' | 'overspent';
}

// ========== JSON 导入导出格式（不含 API Key） ==========

interface ExportData {
  app: 'AIBill';
  version: string;              // "1.0.0"
  exportedAt: string;           // ISO 时间戳
  data: {
    categories: Category[];
    monthlyBudgets: MonthlyBudget[];
    categoryBudgets: CategoryBudget[];
    records: RecordItem[];
    settings: AppSettings;      // 不含 aiApiKey
  };
}
```

---

## 5. 核心计算函数

> 这些函数全部是**纯函数**：输入数据 → 返回计算结果，不读数据库、不改页面状态。

```typescript
// services/budget/calculator.ts

/**
 * 计算某月份的总支出金额
 */
function getMonthlyExpense(records: RecordItem[], month: string): number

/**
 * 计算某月份某分类的支出金额
 */
function getCategoryExpense(
  records: RecordItem[],
  month: string,
  categoryId: string
): number

/**
 * 计算本月剩余金额
 * 如果剩余 < 0，返回 0 并标记超支
 */
function getMonthlyRemaining(
  totalBudget: number,
  monthlyExpense: number
): { remaining: number; isOverspent: boolean }

/**
 * 计算分类剩余金额
 */
function getCategoryRemaining(
  budget: number,
  spent: number
): number

/**
 * 计算今日建议可花金额
 * 公式：剩余金额 / 包含今天在内的本月剩余天数
 * 当前月返回计算值，历史月份返回 null
 */
function getTodaySuggestedAmount(
  remaining: number,
  month: string,    // 当前查看的月份 "2026-06"
  today: string     // 实际今天的日期 "2026-06-09"
): number | null

/**
 * 获取包含今天在内的本月剩余天数
 * 例：6月9日 → 30 - 9 + 1 = 22
 */
function getRemainingDaysInCurrentMonth(today: string): number

/**
 * 计算月份进度
 * 公式：当天日期 / 本月总天数
 * 例：6月9日 → 9 / 30 = 0.3
 */
function getMonthProgress(today: string): number

/**
 * 根据使用率和月份进度判断预算状态
 */
function getBudgetStatus(
  usageRate: number,   // 0-1
  monthProgress: number // 0-1
): 'normal' | 'warning' | 'overspent'

/**
 * 计算总预算与分类预算合计的差异
 * 返回未分配金额（正）或超分配金额（负）
 */
function getBudgetAllocationDiff(
  totalBudget: number,
  categoryBudgets: CategoryBudget[]
): { diff: number; type: 'unallocated' | 'exact' | 'overspent' }

/**
 * 获取某月份所有分类的预算状态列表
 */
function getCategoryBudgetStatuses(
  categories: Category[],
  categoryBudgets: CategoryBudget[],
  records: RecordItem[],
  month: string
): CategoryBudgetStatus[]

/**
 * 获取某月份的完整预算摘要
 */
function getBudgetSummary(
  monthlyBudget: MonthlyBudget | null,
  categoryBudgets: CategoryBudget[],
  records: RecordItem[],
  categories: Category[],
  month: string,       // 当前查看的月份
  today: string        // 实际今天的日期
): {
  summary: BudgetSummary | null;
  categoryStatuses: CategoryBudgetStatus[];
  allocationDiff: { diff: number; type: 'unallocated' | 'exact' | 'overspent' } | null;
}
```

### 计算示例

```
输入：
  month = "2026-06"
  totalBudget = 3700
  records = [午饭18, 地铁4, 买书36, 电影45, ...]
  today = "2026-06-09"
  isCurrentMonth = true

输出：
  totalExpense = 1340
  remaining = 2360
  isOverspent = false
  todaySuggested = 2360 / 22 ≈ 107
  monthProgress = 0.3

  餐饮：budget=1500, spent=680, remaining=820,  usageRate=0.45, status='normal'
  娱乐：budget=400,  spent=145, remaining=255,  usageRate=0.36, status='normal'
  学习：budget=300,  spent=199, remaining=101,  usageRate=0.66, status='warning' (0.66 > 0.3+0.2)
```

---

## 6. 页面设计

### 6.1 底部导航设计

V1 底部导航共 5 个入口，中间"记账"按钮使用醒目主色调，与其他 4 个普通 Tab 区分：

```
┌─────────────────────────────────┐
│                                 │
│         （页面内容区域）           │
│                                 │
├───┬──────┬────────┬──────┬──────┤
│ 🏠│ 📋   │   ➕   │  📊  │  ⚙️  │
│首页│ 账单  │  记账  │ 预算  │ 设置 │
└───┴──────┴────────┴──────┴──────┘
```

| 图标 | 标签 | 路由 | 样式 |
|------|------|------|------|
| 🏠 | 首页 | `/` | 普通 |
| 📋 | 账单 | `/records` | 普通 |
| ➕ | 记账 | `/add` | 主色大按钮，居中 |
| 📊 | 预算 | `/budget` | 普通 |
| ⚙️ | 设置 | `/settings` | 普通 |

### 6.2 页面总览（编号已顺延）

| 页面 | 路由 | 角色 |
|------|------|------|
| DashboardPage | `/` | 预算概览，最常打开 |
| AddRecordPage | `/add` | 记账入口（AI + 手动） |
| RecordsPage | `/records` | 账单列表与编辑 |
| BudgetPage | `/budget` | 预算设置与查看 |
| SettingsPage | `/settings` | 数据管理、AI 配置 |

### 6.3 DashboardPage

**读取数据**：
- 当前月份（来自月份选择器）
- `monthlyBudgets` 表
- `categoryBudgets` 表
- `records` 表（当前月份）
- `categories` 表

**数据流**：
```
records → getMonthlyExpense() → 本月已花
monthlyBudget + 本月已花 → getMonthlyRemaining() → 本月剩余 + 是否超支
本月剩余 → getTodaySuggestedAmount() → 今日建议可花
categories + categoryBudgets + records + month → getCategoryBudgetStatuses() → 分类进度列表
```

**状态处理**：
| 情况 | 展示内容 |
|------|----------|
| 当月有预算 | 完整仪表盘 |
| 当月无预算 | 空状态引导"先设置本月预算" |
| 历史月有预算 | 显示数据，"今日建议可花"改为"当月结余" |
| 历史月无预算 | 空状态引导"手动设置预算"或"使用默认预算" |
| 当月无账单 | 正常显示预算，各分类进度 0% |

### 6.4 AddRecordPage

**两种模式**：

**AI 记账**：
```
用户输入 → 点击"智能识别"
    → parseNaturalLanguageRecord(input, categories)
    → 返回 ParsedRecordItem[]
    → 展示确认列表
    → 用户修改/确认
    → 批量转换为 RecordItem 写入 IndexedDB
    → 跳转首页
```

**手动记账**：
```
打开手动表单
    → 填写 金额 / 分类 / 类型 / 日期 / 备注
    → 前端校验（金额 > 0，分类必选）
    → 写入 IndexedDB
    → 跳转首页
```

### 6.5 RecordsPage

**读取数据**：当前月份的 `records`，支持月份切换。

**功能**：
- 按日期降序分组展示
- 每条显示：标题、金额、分类名称（附颜色/图标）、类型标识
- 点击展开操作：编辑、删除
- 按分类下拉筛选

**编辑**：打开编辑弹窗，修改后 `updatedAt` 更新。
**删除**：二次确认后删除，预算自动重新计算。

### 6.6 BudgetPage

**读取数据**：当前月份的 `monthlyBudget`、`categoryBudgets`、`categories`。

**操作**：
- 修改月总预算 → 更新或创建 `MonthlyBudget`
- 修改分类预算 → 更新或创建 `CategoryBudget`
- **实时计算并展示**：分类合计、未分配 / 超分配
- 添加自定义分类（V1 允许用户添加）
- 归档分类（不可删除有账单的分类）

### 6.7 SettingsPage

| 功能 | 实现方式 |
|------|----------|
| 导出 JSON | 组装 ExportData（不含 API Key）→ 触发 Blob 下载 |
| 导入 JSON | 读文件 → 校验格式 → 二次确认 → 全量覆盖 IndexedDB |
| 清空数据 | 二次确认 → 清空所有表 → 重新 seed 分类 |
| AI API Key | 仅存 localStorage（LocalSecrets），不参与 JSON 导出 |
| AI 模型选择 | localStorage 读写 |
| 货币单位 | IndexedDB 读写（AppSettings），参与 JSON 导出 |

---

## 7. AI 模块设计

### 7.1 模块职责

```
services/ai/
├─ prompt.ts           # 构建发送给 LLM 的 Prompt 字符串
├─ aiClient.ts         # 封装 fetch 调用 LLM API（仅 POST JSON）
├─ parseRecord.ts      # 对外暴露的入口函数
└─ normalize.ts        # 前端校验和规范化 AI 返回结果
```

### 7.2 调用流程

```
parseRecord(input, categories, today)
  → prompt.ts 构建 Prompt（含分类列表、关键词映射、当前日期）
  → aiClient.ts 调用 LLM API
  → 得到 JSON 字符串
  → JSON.parse
  → normalize.ts 校验和规范化
  → 返回 ParsedRecordItem[]
```

### 7.3 Prompt 模板

```typescript
// services/ai/prompt.ts

function buildPrompt(input: string, categories: Category[], today: string): string {
  return `当前日期：${today}

你是一个消费记录解析助手。请将用户的自然语言输入解析为结构化的消费记录。

分类仅限以下选项：${categories.filter(c => c.budgetable).map(c => c.name).join('、')}、收入

分类关键词映射：
- 餐饮：早餐、午饭、晚饭、外卖、食堂、奶茶、咖啡、零食、水果、饮料、面包
- 交通：地铁、公交、打车、滴滴、共享单车、高铁、机票、加油、停车
- 学习：书、课程、会员、教程、考试、资料、付费知识、网课、文具
- 娱乐：电影、游戏、聚会、KTV、视频会员、音乐、旅游、景点、桌游
- 健身：健身房、游泳、运动装备、私教、瑜伽、羽毛球、球拍
- 日用品：纸巾、洗发水、牙膏、洗衣液、生活用品、收纳、家居
- 恋爱/社交：约会、礼物、请客、聚餐、红包、鲜花
- 收入：工资、兼职、退款、红包收入、理财、奖金、补贴
- 其他：无法判断的消费

日期规则：无日期默认为当天，支持"今天"、"昨天"、"前天"、"6月9日"、"2026-06-09"格式。
金额必须为正数。
如果用户输入中没有明确包含金额的消费或收入记录，请返回空数组 []。

用户输入：${input}

请只返回 JSON 数组，不包含任何其他文字。`
}
```

### 7.4 前端校验规范

```typescript
// services/ai/normalize.ts

function normalizeParsedItems(
  raw: unknown[],
  categories: Category[]
): ParsedRecordItem[] {
  // 1. 过滤非对象、空值
  // 2. 确保 amount > 0，否则丢弃
  // 3. 确保 type 为 expense | income
  // 4. 收入记录统一 categoryName = "收入"
  // 5. 匹配 categoryName → 已有分类，匹配失败归入"其他"
  // 6. 确保 date 为 YYYY-MM-DD，无效则默认当天
  // 7. confidence 缺失时默认为 0.5
  // 8. 返回规范化后的 ParsedRecordItem[]
}
```

### 7.5 安全兜底

| 场景 | 处理 |
|------|------|
| AI 返回非 JSON | 提示解析失败，不清空输入框 |
| AI 返回空数组 `[]` | 提示"未识别到有效账单" |
| AI 返回的金额 <= 0 | 丢弃该条，其余正常展示 |
| AI 返回的分类不存在 | 归入"其他" |
| AI 返回的日期无效 | 默认为当天 |
| 网络请求失败 | 提示"网络异常，请重试" |
| API Key 未配置 | 提示"请先在设置页配置 API Key" |

---

## 8. 开发阶段

### 第 1 阶段：项目初始化

**优先级**：P0

**目标**：技术栈就绪，能运行、能导航。

**任务清单**：
- [P0] `npm create vite@latest` 创建 React + TS 项目
- [P0] 配置 Tailwind CSS
- [P0] 安装 shadcn/ui（初始化）
- [P0] 安装 Dexie.js、Zustand、React Router、dayjs、React Hook Form、Zod
- [P1] 安装 vite-plugin-pwa（配置可稍后做）
- [P0] 搭建 5 个页面骨架（空页面 + 路由）
- [P0] 搭建底部导航栏（BottomNav）
- [P0] 搭建顶部栏（TopBar + 月份选择器）
- [P0] 确认 HMR 正常、路由跳转正常

**验证方式**：`npm run dev` 能启动，5 个 Tab 可以互相点击跳转。

---

### 第 2 阶段：数据库和初始化

**优先级**：P0

**目标**：Dexie 表就绪，首次启动自动创建预置分类。

**任务清单**：
- [P0] 定义所有 TypeScript 类型（`types/index.ts`）
- [P0] 初始化 Dexie 实例（`db/index.ts`）
- [P0] 定义表结构 + 索引（`db/schema.ts`）
- [P0] 编写 seed 数据（`db/seed.ts`）
- [P0] 编写首次启动逻辑：检测数据是否为空 → 预置分类 → 创建收入系统分类
- [P0] 编写 `App.tsx` 启动时检测逻辑

**验证方式**：在浏览器中打开 DevTools → Application → IndexedDB → 确认表结构和预置分类已写入。

---

### 第 3 阶段：预算核心

**优先级**：P0

**目标**：能设置预算、能查看预算状态。

**任务清单**：
- [P0] 编写所有核心计算函数（`services/budget/calculator.ts`）
- [P0] 编写 `store/budgetStore.ts`（读写 monthlyBudgets + categoryBudgets）
- [P0] 编写 `BudgetPage.tsx` 页面
  - [P0] 月总预算输入
  - [P0] 分类预算列表（可编辑每个分类的预算金额）
  - [P0] 分类预算合计 + 未分配 / 超分配提示
  - [P1] + 添加分类按钮
- [P0] 实现月份切换时预算数据的加载

**验证方式**：设置总预算 3700，给各分类分配预算，验证差额计算正确。切换月份，验证数据独立。

---

### 第 4 阶段：手动记账和账单列表

**优先级**：P0

**目标**：能记一笔、能看到账单列表、能编辑删除。

**任务清单**：
- [P0] 编写 `store/recordStore.ts`（CRUD 操作）
- [P0] 编写 `AddRecordPage.tsx` 手动记账部分
  - [P0] 金额输入 + 分类选择 + 类型选择 + 日期 + 备注
  - [P0] React Hook Form + Zod 校验
  - [P0] 保存逻辑（写入 records 表）
- [P0] 编写 `RecordsPage.tsx`
  - [P0] 按日期分组降序展示
  - [P0] 每条显示标题、金额、分类
  - [P0] 编辑弹窗（预填数据，更新后 updatedAt 更新）
  - [P0] 删除（二次确认）
  - [P1] 按分类筛选
  - [P0] 月份切换

**验证方式**：手动记 3-5 条账单 → 确认账单页按日期分组展示正确 → 编辑 → 确认数据已更新 → 删除 → 确认数据已移除。

---

### 第 5 阶段：首页 Dashboard

**优先级**：P0

**目标**：最核心的预算概览页面就绪。

**任务清单**：
- [P0] 编写 `useBudgetData.ts` hook（聚合所有计算）
- [P0] 编写 `BudgetSummary.tsx` 组件（本月剩余、今日建议可花/当月结余）
- [P0] 编写 `CategoryProgressList.tsx` 组件（分类列表 + 进度条）
  - [P0] 绿/黄/红颜色规则
  - [P0] 显示名称、已花、预算、比例
- [P0] 编写 `BudgetAllocationHint.tsx` 组件（未分配/超分配提示）
- [P0] 月份切换逻辑
- [P1] 空状态处理

**验证方式**：记几笔账单后回到首页，确认剩余金额减少、分类进度正确、颜色规则正确、月份切换正常。

---

### 第 6 阶段：AI + 备份 + PWA

**优先级**：P0（AI 记账和备份）/ P1（PWA）

**目标**：AI 记账能跑通、数据能备份恢复、能添加到桌面。

**任务清单**：
- [P0] 编写 AI 模块（`services/ai/`）
  - [P0] `prompt.ts`
  - [P0] `aiClient.ts`（封装 fetch 请求）
  - [P0] `normalize.ts`（前端校验）
  - [P0] `parseRecord.ts`（对外入口）
- [P0] 编写 `AddRecordPage.tsx` AI 记账部分
  - [P0] AI 输入框
  - [P0] 解析结果展示列表（支持修改分类、删除条目）
  - [P0] 置信度 < 0.7 标记"请确认"
  - [P0] 确认保存按钮（批量写入）
- [P0] 编写备份模块（`services/backup/`）
  - [P0] `export.ts`：组装 ExportData → Blob 下载
  - [P0] `import.ts`：读文件 → 校验 → 全量覆盖
- [P0] 编写 `SettingsPage.tsx`
  - [P0] 导出 / 导入 / 清空
  - [P0] AI API Key 配置
  - [P1] 货币单位设置
- [P1] 配置 vite-plugin-pwa
  - [P1] manifest.json
  - [P1] Service Worker 缓存策略
  - [P1] 添加到桌面功能

**验证方式**：
- AI 记账：输入"午饭18，地铁4" → 确认结果正确 → 保存 → 首页数据更新
- 导出：下载 JSON 文件 → 确认内容完整
- 导入：清空数据 → 导入 → 确认数据恢复
- PWA：确认能添加到桌面、离线时能打开

---

## 9. V1 不做事项

- ❌ 不放后端服务（纯前端 + IndexedDB）
- ❌ 不做登录注册
- ❌ 不做云同步
- ❌ 不做微信/支付宝账单导入
- ❌ 不做截图识别记账
- ❌ 不做多账户管理
- ❌ 不做信用卡/负债管理
- ❌ 不做图表分析（饼图、柱状图、趋势图）
- ❌ 不做多账本
- ❌ 不做家庭共享
- ❌ 不做复杂相对日期解析（"上周五""上个月"）
- ❌ 不做数据合并导入（仅全量覆盖）
- ❌ 不做分类删除（仅归档）
- ❌ 不做 AI 后端代理（V1 API Key 存 localStorage，仅个人自用）
- ❌ 不做 Electron / Capacitor 打包
- ❌ 不做 Token 计费展示
- ❌ 不做多语言国际化

---

## 10. 开发注意事项

### 10.1 预算必须动态计算

**正确做法**：
```
删除一笔支出 → 重新 sum records → 预算自然增加
修改一笔支出金额 → 重新 sum records → 预算自然更新
```

**错误做法**：
```
删除一笔支出 → 把 amount 加回 remaining
修改一笔支出金额 → 计算新旧差额 → 调整 remaining
```

### 10.2 收入不参与预算

- `type = 'income'` 的记录在 `getMonthlyExpense()` 中不会被统计
- 收入记录的 `categoryId` 固定为 `"income"`
- 首页不展示收入在预算进度中
- 收入仅在账单列表可见

### 10.3 月份切换的数据隔离

- 每月总预算独立：`monthlyBudgets` 表以 `month` 唯一
- 每月分类预算独立：`categoryBudgets` 表以 `month + categoryId` 联合唯一
- 每月账单独立：`records` 表通过 `date` 字段筛选月份
- 切换月份时，所有计算函数传入对应的 `month` 参数

### 10.4 AI 解析不自动入库

- AI 返回结果存入组件本地状态（`ParsedRecordItem[]`）
- 用户必须手动点击"确认保存"后才写入 IndexedDB
- AI 不直接操作数据库

---

## 11. 错误处理与提示规范

### 11.1 全局规则

- 所有用户操作成功/失败后，统一通过 Toast 提示用户
- 加载中状态用骨架屏或 loading spinner 表示
- 操作按钮在请求完成前不可重复点击（禁用状态）

### 11.2 成功提示

| 场景 | Toast 文案 | 附加行为 |
|------|-----------|----------|
| 账单保存成功 | "已保存" | 跳转首页 |
| 账单修改成功 | "已更新" | 关闭编辑弹窗 |
| 账单删除成功 | "已删除" | 刷新列表 |
| AI 记账保存成功 | "已保存 N 条账单" | 跳转首页 |
| 预算设置成功 | "预算已更新" | 无 |
| 数据导出成功 | "已导出" | 触发文件下载 |
| 数据导入成功 | "数据已恢复" | 刷新首页 |
| 数据清空成功 | "数据已清空" | 刷新首页 |

### 11.3 失败/异常提示

| 场景 | Toast 文案 | 附加行为 |
|------|-----------|----------|
| 数据库写入失败 | "保存失败，请重试" | 记录错误到 console |
| 数据库读取失败 | "数据加载失败，请刷新页面" | 显示重试按钮 |
| 导入文件格式错误 | "文件格式错误，数据未变更" | 不清除已有数据 |
| 导入文件版本不兼容 | "文件版本不兼容，请使用同版本备份" | 终止导入 |
| AI 网络请求失败 | "网络异常，请重试" | 不清空输入框 |
| AI 解析返回非 JSON | "AI 解析失败，请重试或使用手动记账" | 保留输入框内容 |
| AI 返回空数组 `[]` | "未识别到有效账单，请补充金额信息" | 保留输入框内容 |
| 金额不合法（<= 0 或空） | "请输入有效金额" | 禁止保存，表单高亮 |
| API Key 未配置 | 弹窗提示"请先在设置页配置 API Key" | 可跳转设置页 |
| API Key 格式错误 | "API Key 格式不正确，请检查" | 无 |
| 月份切换时无预算 | "该月份还未设置预算" | 显示引导按钮 |
| 未设置总预算时记账 | "请先设置本月预算" | 跳转预算页 |

### 11.4 确认弹窗

以下操作需要二次确认弹窗：

| 场景 | 弹窗文案 |
|------|----------|
| 删除账单 | "确定删除这条账单吗？删除后预算会自动重新计算。" |
| 清空所有数据 | "确定清空所有数据吗？该操作不可恢复。建议先导出备份。" |
| 导入 JSON 恢复 | "导入会覆盖当前本地数据，建议先导出备份。确定继续吗？" |

### 11.5 空状态规范

| 场景 | 展示内容 |
|------|----------|
| 首页无预算 | 居中显示"开始使用 → 先设置本月预算"，底部按钮跳转预算页 |
| 当月无账单 | 显示"还没有账单，记一笔吧"，按钮跳转记账页 |
| 历史月份无数据 | 显示"该月份暂无数据" |
| 筛选结果为空 | 显示"没有符合条件的账单" |
| 分类列表无可用分类 | 显示"暂无分类，请先添加" |
