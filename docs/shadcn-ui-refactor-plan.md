# AIBill 使用 shadcn/ui 重构 UI 的实施方案

## 1. 结论

AIBill 建议使用 **shadcn/ui + Tailwind CSS + Lucide React** 作为新的 UI 基础。

这里不需要把 Radix UI 当成另一个需要单独选型的组件库来使用。实际开发时，我们主要使用 shadcn/ui 生成到项目里的组件；当某些复杂组件需要弹窗、菜单、选择器、Tabs 等可访问性交互能力时，shadcn/ui 会在内部使用 Radix UI。

推荐组合如下：

| 用途 | 推荐方案 | 说明 |
| --- | --- | --- |
| UI 组件 | shadcn/ui | 组件源码会生成到项目中，方便改成自己的设计 |
| 样式系统 | Tailwind CSS 4 | 当前项目已经在使用，迁移成本低 |
| 图标 | Lucide React | 替换当前 emoji 图标，视觉更统一 |
| 底层交互 | Radix UI | 由 shadcn/ui 间接使用，通常不需要直接写 Radix |

## 2. 为什么当前项目适合 shadcn/ui

当前项目是一个移动优先的预算记账 PWA，页面已经有比较明确的业务结构，但 UI 仍然偏“手写 Tailwind 原型”。

项目现状：

- 已经使用 Vite、React、TypeScript、Tailwind CSS 4。
- 页面和组件主要集中在 `src/pages` 和 `src/components`。
- 目前按钮、卡片、输入框、弹窗、底部导航都在业务组件里直接手写 className。
- `ConfirmDialog`、`Toast`、`BottomNav`、表单控件等组件可以优先标准化。
- 构建时主包已经有体积提示，因此不适合一次性引入视觉很重的大型 UI 库。

shadcn/ui 的优势是：它不是把一个黑盒组件库装进来，而是把组件源码放进 `src/components/ui`。这很适合 AIBill 这种需要长期打磨视觉细节的个人财务产品。

## 3. 目标效果

这次重构不只是“换组件”，而是建立一个可持续扩展的 UI 基础。

目标：

- 统一按钮、输入框、卡片、弹窗、标签、进度条等基础视觉。
- 替换重复的 Tailwind className，减少页面里的样式噪音。
- 改善移动端触控体验。
- 改善弹窗、菜单、选择器等组件的键盘操作和无障碍能力。
- 让 AIBill 拥有自己的设计语言，而不是直接照搬 shadcn/ui 默认样式。
- 为后续深色模式、桌面端布局优化、主题色切换留下空间。

## 4. 推荐目录结构

建议新增和调整以下结构：

```txt
src/
  components/
    ui/                 # shadcn/ui 生成的基础组件
      button.tsx
      card.tsx
      input.tsx
      textarea.tsx
      select.tsx
      dialog.tsx
      alert-dialog.tsx
      badge.tsx
      progress.tsx
      tabs.tsx
      skeleton.tsx
      separator.tsx
    common/             # 业务通用组件
    layout/             # 布局组件
    record/
    records/
    budget/
    dashboard/
    settings/
  lib/
    utils.ts            # cn 工具函数，shadcn/ui 会使用
```

原则：

- `components/ui` 只放基础 UI 原子组件。
- `components/common` 放和业务有关、但跨页面复用的组件，例如 EmptyState、MonthPicker、TagSelector。
- 页面组件不要直接堆大量按钮、卡片、输入框样式，优先组合 `components/ui`。

## 5. 安装与初始化步骤

### 5.1 增加路径别名

shadcn/ui 推荐使用 `@` 指向 `src`。

需要修改 `vite.config.ts`：

```ts
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

需要修改 `tsconfig.app.json`：

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

同时需要安装 Node 类型：

```bash
npm install -D @types/node
```

### 5.2 初始化 shadcn/ui

执行：

```bash
npx shadcn@latest init
```

建议选择：

- framework：Vite
- style：New York
- base color：Neutral 或 Slate
- css file：`src/index.css`
- components alias：`@/components`
- utils alias：`@/lib/utils`
- ui alias：`@/components/ui`

如果初始化工具识别 Tailwind CSS 4 时有提示，优先按照 shadcn/ui 当前 CLI 的推荐配置执行。

### 5.3 首批安装组件

建议第一批添加这些组件：

```bash
npx shadcn@latest add button card input textarea select dialog alert-dialog badge progress tabs skeleton separator
```

后续如果需要 Toast，建议再添加：

```bash
npx shadcn@latest add sonner
```

图标建议安装：

```bash
npm install lucide-react
```

## 6. AIBill 的设计系统建议

不要只使用 shadcn/ui 默认样式。应该在它的基础上调整成 AIBill 自己的视觉。

### 6.1 品牌气质

AIBill 是预算记账应用，视觉应该是：

- 清爽，不压迫。
- 数据感明确。
- 对“超支、接近预算、安全”有清楚的状态表达。
- 移动端手感柔和，有卡片层次。

### 6.2 推荐颜色

当前项目已有：

```css
--color-primary: #6366f1;
--color-primary-dark: #4f46e5;
--color-budget-green: #22c55e;
--color-budget-yellow: #eab308;
--color-budget-red: #ef4444;
```

建议继续保留预算状态色，但把基础 UI 色值改造成 shadcn/ui 的 token 体系，例如：

- `primary`：用于主按钮、当前导航、关键操作。
- `muted`：用于次级背景、空状态、说明文字。
- `destructive`：用于删除、清空数据、导入覆盖等危险操作。
- `success / warning / danger`：用于预算状态。

### 6.3 圆角与阴影

建议：

- 普通按钮：`rounded-xl`
- 卡片：`rounded-2xl`
- 弹窗：`rounded-2xl`
- 底部导航主按钮：圆形或胶囊形
- 阴影克制使用，只在浮层、底部导航、重点卡片上使用

### 6.4 移动端尺寸

移动端点击区域建议至少 44px 高。

因此：

- 主按钮高度建议 44px - 48px。
- 输入框高度建议 44px。
- 底部导航按钮区域保持清晰。
- 弹窗底部按钮不要太小，避免误触。

## 7. 分阶段重构计划

不要一次性重写全部页面。建议按下面顺序推进。

### 阶段 1：UI 基建

目标：先把 shadcn/ui 跑通，不影响业务。

任务：

- 配置 `@` 路径别名。
- 初始化 shadcn/ui。
- 新增 `src/lib/utils.ts`。
- 添加首批基础组件。
- 保持现有页面暂不大改。
- 执行 `npm run build` 确认项目可构建。

验收标准：

- 项目能正常启动。
- `npm run build` 通过。
- `src/components/ui` 中存在基础组件。

### 阶段 2：替换基础控件

优先处理最重复、收益最高的部分。

建议顺序：

1. `Button`
2. `Card`
3. `Input`
4. `Textarea`
5. `Select`
6. `Badge`
7. `Progress`

重点文件：

- `src/components/record/ManualForm.tsx`
- `src/components/record/AiInputBox.tsx`
- `src/components/budget/TotalBudgetInput.tsx`
- `src/components/budget/CategoryBudgetRow.tsx`
- `src/components/dashboard/BudgetSummary.tsx`
- `src/components/dashboard/CategoryProgressList.tsx`

验收标准：

- 页面视觉更统一。
- 业务逻辑不变。
- 表单提交、校验、金额输入仍然正常。

### 阶段 3：替换弹窗和危险操作

当前 `src/components/common/ConfirmDialog.tsx` 是手写弹窗，建议替换为 shadcn/ui 的 `AlertDialog`。

适合使用 `AlertDialog` 的场景：

- 删除记录。
- 清空数据。
- 导入数据覆盖。
- 删除标签。
- 重置预算。

收益：

- 自动获得更好的焦点管理。
- 支持 Esc 关闭。
- 更符合无障碍语义。
- 统一危险操作样式。

验收标准：

- 弹窗打开后焦点进入弹窗。
- 取消、确认行为正确。
- 危险按钮统一使用 destructive 样式。

### 阶段 4：替换底部导航图标

当前 `BottomNav` 使用 emoji 图标，不同系统显示会不一致。

建议使用 Lucide React：

| 页面 | 当前含义 | 推荐图标 |
| --- | --- | --- |
| 首页 | 总览 | `Home` |
| 账单 | 记录列表 | `ReceiptText` |
| 记账 | 新增 | `Plus` |
| 预算 | 预算管理 | `ChartPie` 或 `WalletCards` |
| 设置 | 设置 | `Settings` |

目标：

- 导航图标风格统一。
- 当前激活状态更清楚。
- 中间记账按钮可以保留突出样式。

验收标准：

- 底部导航在移动端显示稳定。
- active 状态明确。
- 不再依赖 emoji。

### 阶段 5：重构页面卡片与数据状态

这一阶段开始让 AIBill 真正“变漂亮”。

重点页面：

- `src/pages/DashboardPage.tsx`
- `src/pages/BudgetPage.tsx`
- `src/pages/RecordsPage.tsx`
- `src/pages/AddRecordPage.tsx`
- `src/pages/SettingsPage.tsx`

建议：

- Dashboard 使用统一的 `Card` 承载总预算、已花费、剩余、分类进度。
- Budget 页面使用 `Card + Progress + Badge` 表达各分类预算状态。
- Records 页面使用统一的记录卡片样式。
- Settings 页面使用分组卡片，而不是一长串裸元素。
- 空状态统一使用 `EmptyState`，内部可组合 shadcn/ui 的 `Button`。

验收标准：

- 主要页面的卡片风格统一。
- 预算状态颜色一致。
- 空状态、加载状态、错误状态有统一表现。

### 阶段 6：桌面端布局优化

当前布局偏移动端，`PageContainer` 使用 `max-w-lg`，桌面端空间利用不足。

建议：

- 移动端保持单列。
- 平板和桌面端可以使用更宽容器。
- Dashboard 可以在桌面端变成双列数据卡片。
- Records 和 Budget 可以在桌面端提供更舒展的列表区域。

示例策略：

```tsx
<main className="mx-auto w-full max-w-lg px-4 md:max-w-3xl lg:max-w-5xl">
  {children}
</main>
```

验收标准：

- 移动端不退化。
- 桌面端不再显得过窄。
- 底部导航在桌面端是否保留，需要根据产品定位决定。

## 8. 组件替换映射

| 当前组件 / 写法 | 建议替换为 | 优先级 |
| --- | --- | --- |
| 手写 `<button>` | `Button` | 高 |
| 手写输入框 | `Input` / `Textarea` | 高 |
| 原生 select | `Select` | 中 |
| 手写白色卡片 | `Card` | 高 |
| `ConfirmDialog` | `AlertDialog` | 高 |
| emoji nav icon | Lucide React icons | 高 |
| 手写预算进度条 | `Progress` 或保留自定义增强 | 中 |
| 状态文字 | `Badge` | 中 |
| 加载占位 | `Skeleton` | 中 |
| 页面 tab / 类型切换 | `Tabs` | 中 |

## 9. 编码规范建议

### 9.1 页面不直接写复杂样式

页面组件应该更像“业务编排”，不要到处出现长串 className。

不推荐：

```tsx
<button className="w-full rounded-xl bg-indigo-500 px-4 py-3 text-sm font-medium text-white shadow-sm hover:bg-indigo-600">
  保存
</button>
```

推荐：

```tsx
<Button className="w-full">
  保存
</Button>
```

### 9.2 使用 variant 表达语义

按钮不要只靠颜色判断含义。

推荐：

```tsx
<Button>保存</Button>
<Button variant="secondary">取消</Button>
<Button variant="destructive">删除</Button>
```

### 9.3 业务组件可以继续封装

不是所有东西都要直接用 shadcn/ui。

例如可以封装：

- `BudgetStatusBadge`
- `MoneyInput`
- `RecordCard`
- `CategoryBudgetCard`
- `PageHeader`
- `AppBottomNav`

这些业务组件内部再组合 shadcn/ui。

## 10. 风险与注意事项

### 10.1 不要一次性大改所有页面

一次性重构容易引入表单、预算计算、记录编辑等业务回归问题。

建议每完成一个阶段都运行：

```bash
npm run build
```

如果有条件，再手动检查：

- 新增一条支出。
- 编辑一条记录。
- 删除一条记录。
- 设置总预算。
- 设置分类预算。
- 导出和导入数据。
- AI 解析记账输入。

### 10.2 注意包体积

当前项目构建时主 chunk 已经偏大。shadcn/ui 本身不是一个整体打包的大组件库，但新增 Radix 组件、图标、Toast 等依赖后仍然需要关注体积。

建议：

- 只添加当前需要的 shadcn 组件。
- Lucide 图标按需 import。
- 不要一次性添加整套组件。
- 后续可考虑路由级懒加载。

### 10.3 注意中文编码

当前部分源码在 PowerShell 输出中出现中文乱码，但不一定代表文件本身有问题。重构时应避免因为编辑器编码导致中文文案变坏。

建议统一使用 UTF-8 保存。

## 11. 建议的第一轮实际改造清单

第一轮不要追求“全项目换皮”，建议只做这些：

1. 配置 shadcn/ui。
2. 添加 `button card input textarea alert-dialog badge progress separator`。
3. 替换 `ConfirmDialog` 为 `AlertDialog`。
4. 替换 `BottomNav` 的 emoji 为 Lucide 图标。
5. 替换 `ManualForm` 中的按钮和输入框。
6. 替换 Dashboard 的核心卡片。
7. 执行 `npm run build`。

这一轮完成后，项目会明显从“原型感”变成“有设计系统的应用”，但业务风险仍然可控。

## 12. 推荐执行顺序

```txt
配置 alias
  ↓
初始化 shadcn/ui
  ↓
添加基础组件
  ↓
建立 AIBill 设计 token
  ↓
替换 Button / Card / Input
  ↓
替换 ConfirmDialog
  ↓
替换 BottomNav 图标
  ↓
重构 Dashboard / Budget 页面
  ↓
优化桌面端布局
  ↓
补充加载态、空状态、错误态
```

## 13. 官方参考

- shadcn/ui Vite 安装文档：https://ui.shadcn.com/docs/installation/vite
- shadcn/ui 组件文档：https://ui.shadcn.com/docs/components
- Radix UI Primitives：https://www.radix-ui.com/primitives
- Lucide React：https://lucide.dev/guide/packages/lucide-react

## 14. 最终建议

对 AIBill 来说，最合适的路线是：

> 使用 shadcn/ui 作为 UI 基础设施，然后在它生成的源码上改出 AIBill 自己的产品风格。

也就是说，不要把 shadcn/ui 当成“最终视觉答案”，而是把它当成一套可靠的 UI 骨架。AIBill 真正的设计感应该来自预算卡片、金额层级、状态颜色、移动端交互和数据表达方式。

