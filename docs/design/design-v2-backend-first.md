# AIBill V2 后端优先版设计文档

> 编写日期：2026-06-20  
> 文档定位：V2 第一阶段可落地设计  
> 核心原则：后端权威、在线优先、前端乐观更新、有限离线能力

---

## 1. 版本目标

AIBill V1 是一个基于 React、PWA 和 IndexedDB 的本地记账应用。V2 第一阶段的目标不是立即实现完整的本地优先双向同步，而是先建立稳定的后端和云端数据能力：

- MySQL 成为用户数据的唯一权威来源。
- 业务校验、预算计算、搜索筛选等逻辑集中在后端。
- 前端主要负责输入、交互和数据展示。
- 联网时，所有正式数据通过 API 写入后端。
- 前端使用乐观更新保证记账操作足够迅速。
- 断网时仅支持暂存“新增账单”，联网后自动上传。
- IndexedDB 只保存待上传操作和少量接口缓存，不作为完整业务数据库。
- 支持将 V1 JSON 数据导入云端，也支持将云端数据导出到本地备份。

这一方案优先保证数据模型、后端业务规则和云端存储稳定，再根据真实需求逐步扩展离线编辑和完整同步。

---

## 2. 范围边界

### 2.1 V2 第一阶段包含

- Spring Boot 3 后端。
- MySQL 8 数据库。
- Flyway 数据库迁移。
- 用户注册、登录、刷新登录状态和退出。
- 默认预算分类初始化。
- 预算分类管理。
- 月度总预算和分类预算管理。
- 账单新增、编辑、删除、查询和分页。
- Dashboard 和预算统计由后端计算。
- 前端在线接入后端 API。
- 前端乐观更新。
- IndexedDB 离线新增账单队列。
- V1 JSON 导入。
- 云端数据导出为本地 JSON 备份。

### 2.2 V2 第一阶段不包含

- 完整 IndexedDB 数据副本。
- 离线编辑和离线删除。
- 通用 Push/Pull 双向同步引擎。
- 多设备同一账单冲突合并。
- 标签和账单标签关联。
- AI 后端代理。
- OCR、微信或支付宝账单导入。
- 多账本、家庭共享。
- Redis、消息队列和后台任务系统。
- AI 周报、月报和复杂分析。

---

## 3. 总体架构

```text
React PWA
├─ 页面、表单和交互
├─ 乐观更新
├─ IndexedDB 待上传队列
└─ 少量只读接口缓存
          |
          | HTTPS / JSON API
          v
Spring Boot 3
├─ 用户鉴权和权限隔离
├─ 业务校验
├─ 预算计算
├─ 查询、搜索和分页
├─ 数据导入导出
└─ 幂等写入
          |
          v
MySQL 8
└─ 唯一权威数据源
```

### 3.1 数据所有权

| 数据 | 权威来源 | 前端是否持久保存 |
|---|---|---|
| 用户账户 | MySQL | 仅保存必要登录状态 |
| 预算分类 | MySQL | 可缓存最近响应 |
| 月度预算 | MySQL | 可缓存最近响应 |
| 分类预算 | MySQL | 可缓存最近响应 |
| 正式账单 | MySQL | 可缓存最近响应 |
| 待上传账单 | 尚未进入 MySQL | 暂存在 IndexedDB |
| Dashboard 结果 | 后端实时计算 | 可缓存最近响应 |
| JSON 备份 | 用户本地文件 | 用户自行保管 |

MySQL 中的数据是最终结果。前端缓存丢失不会导致云端数据丢失；IndexedDB 中尚未上传的账单除外，因此待上传队列需要明确展示状态并提供重试能力。

---

## 4. 核心数据流程

### 4.1 联网新增账单

```text
1. 前端生成账单 UUID
2. 前端立即在页面中显示“保存中”账单
3. POST /api/v1/records
4. 后端校验并写入 MySQL
5. 后端返回正式账单
6. 前端替换乐观数据并显示“已保存”
7. 前端重新获取受影响月份的 Dashboard
```

账单 UUID 由客户端预先生成。请求超时后使用同一个 UUID 重试，后端不得重复创建账单。

### 4.2 断网新增账单

```text
1. 前端生成账单 UUID
2. 将新增操作写入 IndexedDB pendingMutations
3. 页面显示“待上传”
4. 网络恢复后按创建顺序上传
5. 后端成功保存后删除对应待上传操作
6. 刷新账单列表和 Dashboard
```

第一阶段仅允许离线新增账单。离线编辑、删除、调整预算时，前端应提示用户联网后操作。

### 4.3 新设备登录

```text
1. 用户登录
2. 前端请求分类、预算、账单和 Dashboard
3. 后端直接从 MySQL 返回数据
4. 前端展示并按需缓存最近响应
```

新设备不需要从旧设备获取数据，也不需要执行设备间合并。

### 4.4 Dashboard 查询

```text
GET /api/v1/dashboard?month=2026-06
        |
        v
后端查询预算和账单并完成计算
        |
        v
返回总预算、支出、剩余预算和分类进度
```

离线时可以展示上一次缓存的 Dashboard，但必须显示缓存时间和待上传账单数量，避免用户误认为数据是实时结果。

---

## 5. 技术栈

### 5.1 前端

| 用途 | 技术 |
|---|---|
| 框架 | React + TypeScript + Vite |
| 样式 | Tailwind CSS |
| 状态管理 | Zustand |
| 表单与校验 | React Hook Form + Zod |
| 路由 | React Router |
| PWA | vite-plugin-pwa |
| API 状态 | TanStack Query，或第一阶段使用统一 fetch 封装 |
| 离线队列 | Dexie.js + IndexedDB |

### 5.2 后端

| 用途 | 技术 |
|---|---|
| Runtime | JDK 21 |
| 框架 | Spring Boot 3 |
| 数据访问 | MyBatis Plus |
| 数据库 | MySQL 8 |
| 数据库迁移 | Flyway |
| 鉴权 | Spring Security + JWT Access Token + Refresh Token |
| 参数校验 | Jakarta Validation |
| API 文档 | springdoc-openapi |
| 测试 | JUnit 5 + Spring Boot Test |
| 部署 | Docker Compose + Nginx |

V2 第一阶段不引入 Redis。前后端采用同域部署，降低 Cookie、CORS 和安全配置的复杂度。

---

## 6. 数据库设计原则

1. 所有用户业务数据都必须包含 `user_id`。
2. 所有用户数据查询都必须同时按业务 ID 和 `user_id` 查询。
3. 账单 ID 使用客户端生成的 UUID，实现安全重试和幂等写入。
4. 金额使用 `decimal(12,2)`，Java 使用 `BigDecimal`，API 使用字符串传输金额。
5. 月份使用 `char(7)` 保存 `YYYY-MM`。
6. 账单日期使用 MySQL `date`。
7. 服务端时间使用 `datetime(3)`，应用层统一使用 UTC，展示时转换为用户时区。
8. 预算剩余值、预算使用率等派生结果不入库，由后端动态计算。
9. 收入与支出都使用正数金额，通过 `type` 区分方向。
10. 预算分类优先归档而不是删除，保证历史账单可以正常展示。
11. 账单采用软删除，正常查询必须过滤 `deleted_at is null`。
12. 表结构变更必须通过新增 Flyway 迁移脚本完成，不直接修改生产数据库。

---

## 7. 数据库表总览

| 表 | 说明 |
|---|---|
| `users` | 用户账户 |
| `auth_sessions` | Refresh Token 会话 |
| `user_settings` | 用户设置 |
| `budget_categories` | 预算分类 |
| `monthly_budgets` | 月度总预算 |
| `category_budgets` | 分类月预算 |
| `records` | 收入和支出账单 |

第一阶段只需要以上 7 张表。离线待上传队列属于前端 IndexedDB，不需要对应的 MySQL 表。

---

## 8. MySQL 表结构

### 8.1 users

```sql
create table users (
  id char(36) primary key,
  email varchar(255) not null,
  password_hash varchar(255) not null,
  nickname varchar(64) null,
  timezone varchar(64) not null default 'Asia/Shanghai',
  status varchar(16) not null default 'active',
  created_at datetime(3) not null default current_timestamp(3),
  updated_at datetime(3) not null default current_timestamp(3)
    on update current_timestamp(3),
  deleted_at datetime(3) null,
  constraint uq_users_email unique (email),
  constraint ck_users_status check (status in ('active', 'disabled'))
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;
```

说明：

- 第一阶段使用邮箱和密码登录。
- 密码只保存 BCrypt 或 Argon2 哈希，不保存明文。
- 删除账户时使用 `deleted_at`，实际数据清理可以后续增加独立流程。

### 8.2 auth_sessions

```sql
create table auth_sessions (
  id char(36) primary key,
  user_id char(36) not null,
  refresh_token_hash varchar(255) not null,
  device_name varchar(128) null,
  user_agent varchar(512) null,
  ip_address varchar(64) null,
  expires_at datetime(3) not null,
  revoked_at datetime(3) null,
  created_at datetime(3) not null default current_timestamp(3),
  updated_at datetime(3) not null default current_timestamp(3)
    on update current_timestamp(3),
  constraint fk_auth_sessions_user
    foreign key (user_id) references users(id)
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create index idx_auth_sessions_user_id
  on auth_sessions(user_id);

create index idx_auth_sessions_expires_at
  on auth_sessions(expires_at);
```

说明：

- Access Token 建议 15 分钟过期，只保存在前端内存。
- Refresh Token 建议 30 天过期，通过 `HttpOnly + Secure + SameSite=Lax` Cookie 传输。
- 数据库只保存 Refresh Token 的哈希。
- 退出登录时将当前会话设置为已撤销。

### 8.3 user_settings

```sql
create table user_settings (
  user_id char(36) primary key,
  currency varchar(8) not null default 'CNY',
  created_at datetime(3) not null default current_timestamp(3),
  updated_at datetime(3) not null default current_timestamp(3)
    on update current_timestamp(3),
  constraint fk_user_settings_user
    foreign key (user_id) references users(id),
  constraint ck_user_settings_currency
    check (currency in ('CNY'))
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;
```

第一阶段只支持人民币。后续增加新的用户设置时，通过 Flyway 新增字段。

### 8.4 budget_categories

```sql
create table budget_categories (
  id char(36) primary key,
  user_id char(36) not null,
  name varchar(64) not null,
  icon varchar(32) null,
  color varchar(32) null,
  sort_order int not null default 0,
  budgetable tinyint(1) not null default 1,
  system_category tinyint(1) not null default 0,
  system_key varchar(32) null,
  archived tinyint(1) not null default 0,
  created_at datetime(3) not null default current_timestamp(3),
  updated_at datetime(3) not null default current_timestamp(3)
    on update current_timestamp(3),
  constraint fk_budget_categories_user
    foreign key (user_id) references users(id),
  constraint ck_budget_categories_system_key check (
    (system_category = 1 and system_key is not null)
    or
    (system_category = 0 and system_key is null)
  )
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create index idx_budget_categories_user_archived_order
  on budget_categories(user_id, archived, sort_order);

create unique index uq_budget_categories_user_system_key
  on budget_categories(user_id, system_key);
```

业务规则：

- 每个用户注册后自动创建默认分类。
- 收入分类为系统分类，`system_key = 'income'`、`budgetable = 0`。
- 系统分类不能通过普通接口删除、归档或改变业务含义。
- 普通分类名称在同一用户下应保持唯一，由 Service 层校验。
- 已归档分类可以显示历史账单，但不能用于新增支出。

### 8.5 monthly_budgets

```sql
create table monthly_budgets (
  id char(36) primary key,
  user_id char(36) not null,
  month char(7) not null,
  total_budget decimal(12,2) not null default 0.00,
  monthly_income decimal(12,2) null,
  created_at datetime(3) not null default current_timestamp(3),
  updated_at datetime(3) not null default current_timestamp(3)
    on update current_timestamp(3),
  constraint fk_monthly_budgets_user
    foreign key (user_id) references users(id),
  constraint uq_monthly_budgets_user_month
    unique (user_id, month),
  constraint ck_monthly_budgets_total
    check (total_budget >= 0),
  constraint ck_monthly_budgets_income
    check (monthly_income is null or monthly_income >= 0)
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;
```

同一个用户同一个月份只有一条总预算配置。更新预算时修改原记录，不通过删除后重建实现。

### 8.6 category_budgets

```sql
create table category_budgets (
  id char(36) primary key,
  user_id char(36) not null,
  budget_category_id char(36) not null,
  month char(7) not null,
  amount decimal(12,2) not null default 0.00,
  created_at datetime(3) not null default current_timestamp(3),
  updated_at datetime(3) not null default current_timestamp(3)
    on update current_timestamp(3),
  constraint fk_category_budgets_user
    foreign key (user_id) references users(id),
  constraint fk_category_budgets_category
    foreign key (budget_category_id) references budget_categories(id),
  constraint uq_category_budgets_user_month_category
    unique (user_id, month, budget_category_id),
  constraint ck_category_budgets_amount
    check (amount >= 0)
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create index idx_category_budgets_user_month
  on category_budgets(user_id, month);
```

业务规则：

- 分类必须属于当前用户。
- 分类必须满足 `budgetable = 1`。
- 收入分类不能设置分类预算。
- 同一用户、月份和分类只能有一条记录。

### 8.7 records

```sql
create table records (
  id char(36) primary key,
  user_id char(36) not null,
  budget_category_id char(36) not null,
  title varchar(128) not null,
  amount decimal(12,2) not null,
  type varchar(16) not null,
  record_date date not null,
  note text null,
  source varchar(16) not null default 'manual',
  client_created_at datetime(3) null,
  created_at datetime(3) not null default current_timestamp(3),
  updated_at datetime(3) not null default current_timestamp(3)
    on update current_timestamp(3),
  deleted_at datetime(3) null,
  constraint fk_records_user
    foreign key (user_id) references users(id),
  constraint fk_records_category
    foreign key (budget_category_id) references budget_categories(id),
  constraint ck_records_amount
    check (amount > 0),
  constraint ck_records_type
    check (type in ('expense', 'income')),
  constraint ck_records_source
    check (source in ('manual', 'ai', 'import'))
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create index idx_records_user_date
  on records(user_id, record_date desc);

create index idx_records_user_category_date
  on records(user_id, budget_category_id, record_date desc);

create index idx_records_user_type_date
  on records(user_id, type, record_date desc);

create index idx_records_user_deleted_updated
  on records(user_id, deleted_at, updated_at);
```

业务规则：

- `id` 由客户端生成 UUID。相同用户重复提交相同 ID 时，后端返回已存在记录，不重复创建。
- 支出账单必须使用当前用户未归档、可预算的分类。
- 收入账单必须使用当前用户 `system_key = 'income'` 的系统分类。
- 金额必须大于 0。
- 删除账单时设置 `deleted_at`，不立即物理删除。
- 正常列表、Dashboard 和预算统计必须排除已删除账单。
- 修改和删除账单时必须同时按 `id + user_id` 查询。

---

## 9. Flyway 迁移规划

迁移文件放置在：

```text
server/src/main/resources/db/migration/
```

建议第一阶段使用以下文件：

```text
V1__create_users_and_auth_sessions.sql
V2__create_user_settings.sql
V3__create_budget_tables.sql
V4__create_records.sql
V5__add_initial_indexes.sql
```

规则：

- 已经在共享数据库执行过的迁移文件不得修改。
- 表结构变化通过新增更高版本的 SQL 完成。
- 开发初期可以清空本地测试数据库重建，但生产环境必须保留完整迁移历史。
- Flyway 只管理数据库结构和必要的固定数据，不负责导入用户账单。
- 默认分类在用户注册事务中由后端创建，不写成全局 Flyway Seed。

---

## 10. API 设计

统一前缀：

```text
/api/v1
```

统一响应：

```json
{
  "data": {},
  "error": null
}
```

错误响应：

```json
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "金额必须大于 0",
    "fieldErrors": {
      "amount": "金额必须大于 0"
    }
  }
}
```

### 10.1 账户 API

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/auth/register` | 注册并初始化默认分类 |
| POST | `/auth/login` | 登录 |
| POST | `/auth/refresh` | 刷新 Access Token |
| POST | `/auth/logout` | 撤销当前会话 |
| GET | `/auth/me` | 获取当前用户 |

### 10.2 预算分类 API

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/budget-categories` | 查询分类 |
| POST | `/budget-categories` | 新增分类 |
| PUT | `/budget-categories/{id}` | 修改分类 |
| POST | `/budget-categories/{id}/archive` | 归档分类 |
| POST | `/budget-categories/{id}/restore` | 恢复分类 |

### 10.3 预算 API

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/budgets/{month}` | 获取某月总预算和分类预算 |
| PUT | `/budgets/{month}` | 设置某月总预算 |
| PUT | `/budgets/{month}/categories/{categoryId}` | 设置分类预算 |
| DELETE | `/budgets/{month}/categories/{categoryId}` | 清除分类预算 |

### 10.4 账单 API

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/records` | 分页查询账单 |
| GET | `/records/{id}` | 查询单条账单 |
| POST | `/records` | 新增账单，支持幂等重试 |
| POST | `/records/batch` | 批量上传离线新增账单 |
| PUT | `/records/{id}` | 编辑账单，仅在线使用 |
| DELETE | `/records/{id}` | 删除账单，仅在线使用 |

查询参数示例：

```text
GET /api/v1/records?month=2026-06&type=expense&categoryId=uuid&keyword=午饭&page=1&pageSize=20
```

新增账单请求：

```json
{
  "id": "6e7cbbad-50be-49be-8f93-55f07ea8f9ac",
  "title": "午饭",
  "amount": "18.00",
  "type": "expense",
  "budgetCategoryId": "category-uuid",
  "recordDate": "2026-06-20",
  "note": "",
  "source": "manual",
  "clientCreatedAt": "2026-06-20T04:30:00.000Z"
}
```

批量上传时每条账单独立返回结果。已存在的相同 ID 返回成功，业务校验失败的账单保留在本地队列并展示错误原因。

### 10.5 Dashboard API

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/dashboard?month=2026-06` | 获取 Dashboard 汇总 |

返回示例：

```json
{
  "data": {
    "month": "2026-06",
    "totalBudget": "3700.00",
    "totalExpense": "1268.50",
    "remaining": "2431.50",
    "isOverspent": false,
    "todaySuggested": "221.05",
    "categoryBudgets": [
      {
        "categoryId": "uuid",
        "categoryName": "餐饮",
        "budget": "1000.00",
        "spent": "420.00",
        "remaining": "580.00",
        "usageRate": "0.4200",
        "status": "normal"
      }
    ]
  },
  "error": null
}
```

### 10.6 备份 API

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/backup/import-v1` | 导入 V1 JSON |
| GET | `/backup/export` | 导出当前用户全部云端数据 |

导入必须在单个数据库事务中完成。任何一条数据校验失败时整次导入回滚，不能留下半截数据。

---

## 11. Dashboard 计算规则

后端负责统一计算，前端不重复实现业务计算逻辑。

```text
totalExpense = 当月所有未删除支出账单之和
remaining = totalBudget - totalExpense
categorySpent = 当月指定预算分类的未删除支出账单之和
categoryRemaining = categoryBudget - categorySpent
usageRate = categoryBudget > 0 ? categorySpent / categoryBudget : 0
```

当前月的每日建议支出：

```text
todaySuggested = max(remaining, 0) / 当月剩余天数（包含今天）
```

历史月份返回 `todaySuggested = null`。未来月份没有实际支出时可以返回预算配置，但不计算每日建议支出。

Dashboard 计算必须有单元测试覆盖，包括：

- 无预算、无账单。
- 有预算、无账单。
- 正常支出。
- 超支。
- 收入不扣减预算。
- 已删除账单不参与统计。
- 已归档分类的历史账单仍参与历史月份统计。

---

## 12. 前端 IndexedDB 设计

IndexedDB 不保存完整业务数据，只保存离线队列和可丢弃缓存。

### 12.1 待上传操作

```typescript
interface PendingMutation {
  id: string
  entityType: 'record'
  operation: 'create'
  entityId: string
  payload: CreateRecordPayload
  status: 'pending' | 'uploading' | 'failed'
  retryCount: number
  lastError?: string
  createdAt: string
  updatedAt: string
}
```

Dexie Schema：

```typescript
db.version(2).stores({
  pendingMutations: 'id, entityType, operation, entityId, status, createdAt',
  viewCache: 'key, updatedAt',
})
```

### 12.2 接口缓存

```typescript
interface ViewCache<T> {
  key: string
  data: T
  updatedAt: string
}
```

缓存只用于断网查看最近结果，可以随时清除。建议第一阶段只缓存：

- 当前月份 Dashboard。
- 最近一页账单。
- 当前预算分类。
- 当前月份预算配置。

### 12.3 队列上传规则

- 应用启动、恢复网络和用户主动点击重试时触发上传。
- 同一时刻只运行一个队列上传任务。
- 按 `createdAt` 顺序批量上传。
- 网络错误保留队列并增加 `retryCount`。
- 业务校验错误标记为 `failed`，由用户修改或删除待上传账单。
- 401 时先刷新登录状态；刷新失败则暂停队列并要求重新登录。
- 上传成功后删除待上传项，并刷新对应月份的账单和 Dashboard。

---

## 13. 前端状态展示

账单需要区分以下状态：

| 状态 | 展示建议 |
|---|---|
| `saving` | 保存中 |
| `saved` | 已保存 |
| `pending` | 待上传 |
| `failed` | 上传失败，点击处理 |

全局可以显示简洁的同步状态：

```text
已同步
2 条待上传
同步失败
当前离线
```

离线 Dashboard 应显示：

```text
离线数据 · 更新于 10:35
另有 2 笔账单等待上传，当前预算可能不是最新结果
```

---

## 14. V1 数据迁移

V1 数据包括：

- `categories`
- `monthlyBudgets`
- `categoryBudgets`
- `records`
- `settings`

导入流程：

```text
1. 用户登录 V2
2. 上传 V1 JSON
3. 后端校验文件格式
4. 建立旧分类 ID 到新 UUID 的映射
5. 转换预算和账单分类 ID
6. 在单个事务中写入 MySQL
7. 返回导入数量和错误报告
8. 前端重新请求云端数据
```

导入规则：

- V1 的 `income` 映射到当前用户的收入系统分类。
- V1 普通分类创建为对应预算分类。
- V1 金额转换为 `BigDecimal`，保留两位小数。
- 重复导入前必须要求用户选择取消或覆盖；第一阶段不做智能合并。
- 覆盖导入前，后端应先生成一份可下载的当前云端备份。

---

## 15. 安全和权限

- 生产环境强制 HTTPS。
- Refresh Token 使用 HttpOnly Cookie，Access Token 不写入 localStorage。
- 密码使用 BCrypt 或 Argon2。
- 所有 DTO 都由后端校验，不能信任前端数据。
- 所有业务查询必须包含当前登录用户的 `user_id`。
- 禁止仅凭资源 UUID 查询、编辑或删除数据。
- 导入文件限制大小，并校验所有字段和关联关系。
- 日志不得输出密码、Token、Cookie 或完整备份内容。
- 登录、注册和备份导入接口应增加基本限流。
- MySQL 生产账号只授予应用所需权限，不使用 root 账号连接。

---

## 16. 后端模块建议

```text
server/
├─ src/main/java/com/aibill/
│  ├─ AibillApplication.java
│  ├─ common/
│  │  ├─ exception/
│  │  ├─ response/
│  │  ├─ security/
│  │  └─ validation/
│  ├─ auth/
│  ├─ user/
│  ├─ category/
│  ├─ budget/
│  ├─ record/
│  ├─ dashboard/
│  └─ backup/
├─ src/main/resources/
│  ├─ application.yml
│  ├─ application-dev.yml
│  └─ db/migration/
├─ src/test/java/com/aibill/
├─ Dockerfile
└─ pom.xml
```

第一阶段直接在项目根目录增加 `server/`，暂不进行 Monorepo 目录重构。

---

## 17. 开发阶段

### 阶段 A：后端最小闭环

- 初始化 Spring Boot。
- 配置 MySQL、MyBatis Plus 和 Flyway。
- 实现注册、登录、刷新和当前用户接口。
- 注册时创建用户设置和默认分类。
- 实现预算分类、月预算、分类预算 API。
- 实现账单 CRUD 和幂等新增。
- 实现 Dashboard API。
- 编写核心业务测试。

验收：

```text
注册 → 登录 → 查看默认分类 → 设置预算 → 新增账单 → 查看 Dashboard
```

### 阶段 B：前端在线接入

- 增加 API Client 和统一错误处理。
- 增加登录页面和登录状态恢复。
- 分类、预算、账单和 Dashboard 改为调用后端。
- 增加乐观新增账单。
- 暂时保留 V1 JSON 导出，避免迁移过程中丢失数据。

### 阶段 C：有限离线能力

- 增加 `pendingMutations`。
- 支持离线新增账单。
- 支持恢复网络后批量上传。
- 增加待上传和失败状态展示。
- 增加少量 Dashboard 和账单缓存。

### 阶段 D：迁移和备份

- 实现 V1 JSON 导入。
- 实现云端 JSON 导出。
- 验证导出文件可以重新导入。
- 增加覆盖导入前备份和事务回滚。

### 阶段 E：后续增强

在线版稳定后，再按实际需求选择：

- AI 后端代理。
- 标签体系。
- 离线编辑和删除。
- 更完整的数据同步。
- 统计分析。
- 自动账单导入。

---

## 18. 第一阶段验收标准

1. 用户可以注册、登录、退出，并在刷新页面后恢复登录状态。
2. 不同用户之间的数据完全隔离。
3. 用户可以设置月预算和分类预算。
4. 用户可以新增、编辑、删除和查询账单。
5. Dashboard 由后端计算，结果与账单和预算一致。
6. 相同账单 UUID 重试不会重复创建数据。
7. 联网记账时页面立即响应，并正确处理服务端失败。
8. 断网时可以新增账单并显示待上传状态。
9. 网络恢复后待上传账单可以进入 MySQL。
10. 新设备登录后可以查看云端数据。
11. V1 JSON 可以完整导入，失败时不会写入半截数据。
12. 云端数据可以导出为本地 JSON，并通过恢复测试。
13. 所有数据库结构变化都有对应 Flyway 迁移。

---

## 19. 最终决策摘要

V2 第一阶段采用以下明确决策：

- **MySQL 是唯一权威数据源。**
- **后端负责业务逻辑、校验、统计和数据存储。**
- **前端负责交互和展示，通过乐观更新保证速度。**
- **IndexedDB 只保存离线新增队列和可丢弃缓存。**
- **第一阶段不实现完整双向同步。**
- **离线能力从“离线新增账单”开始，而不是一次覆盖所有操作。**
- **新设备直接从后端读取数据。**
- **本地备份通过云端 JSON 导出实现。**

这套设计既保留了高频记账需要的快速体验，也维持了清晰的前后端职责和统一的数据来源，并为后续扩展完整同步、AI 和分析能力留下空间。
