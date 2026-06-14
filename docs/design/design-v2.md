# AIBill V2 前后端详细设计文档

> 编写日期：2026-06-14
> 目标：在 V1 本地 PWA 的基础上，引入后端、账户、云同步和 AI 代理，为后续多设备、数据分析、固定支出、账单导入、AI 总结等功能打基础。

---

## 1. V2 定位

V1 是本地优先的个人记账工具，核心验证已经完成：

- 预算先行
- AI 记账
- 手动记账
- 分类预算
- 本地 IndexedDB
- JSON 备份
- PWA 手机使用

V2 不推翻 V1，而是在当前模型上补齐后端能力：

- 用户账户
- 云端数据存储
- 多设备同步
- AI 请求后端代理
- 后续扩展能力

V2 的产品原则：

- **预算仍然是核心**：继续回答“这个月还能花多少钱”。
- **账单仍然是原始数据**：不存储剩余预算，预算结果动态计算。
- **前端仍然可离线使用**：PWA + IndexedDB 保留。
- **后端作为云同步和能力中心**：登录、同步、AI、未来导入和分析都走后端。

---

## 2. 总体架构

### 2.1 架构选择

推荐采用：

```text
React PWA + IndexedDB
        |
        | HTTPS JSON API
        v
Spring Boot 3 API Server
        |
        | MyBatis Plus
        v
MySQL
```

V2 不建议把前端改成完全依赖网络的传统 Web App。记账是高频动作，用户在手机上随手记账时，离线可用很重要。

### 2.2 数据所有权

V2 采用“本地优先 + 云端同步”：

- 前端 IndexedDB 是本机可用副本。
- 后端 MySQL 是用户云端数据副本。
- V2.0 先采用在线 API 写入后端，IndexedDB 只缓存最近一次数据用于离线查看。
- V2.1 再升级为本地优先写入：用户在本地新增、编辑、删除数据后，先写 IndexedDB，再进入待同步队列。
- V2.1 网络可用时，前端将变更推送到后端，并拉取云端变更。
- V2.1 多设备冲突按统一规则解决。

### 2.3 模块边界

| 模块 | 前端职责 | 后端职责 |
|---|---|---|
| 账户 | 登录状态、Token 存储、登录页 | 注册、登录、刷新 Token、登出 |
| 账单 | V2.0 在线提交、离线查看；V2.1 本地优先写入 | 持久化、校验、权限隔离，V2.1 增加同步 |
| 预算分类 | V2.0 在线管理、离线查看；V2.1 本地优先写入 | 决定账单扣哪个预算，参与预算计算 |
| 标签 | V2.0 记录账单时选择/创建，离线查看；V2.1 本地优先写入 | 描述账单属性，不参与预算扣减，用于筛选和分析 |
| 预算 | V2.0 在线设置、前端缓存；V2.1 本地优先写入 | 持久化、接口校验、Dashboard Summary |
| AI | 输入、确认、保存 | API Key 保管、模型调用、解析兜底 |
| 备份 | 本地导入导出保留 | 云备份、恢复、迁移 |
| 分析 | 前端展示 | 后续生成统计、AI 总结 |

### 2.4 V2 分阶段裁剪

这份文档保留 V2 的长期蓝图，但实际落地必须拆成两个阶段。

**V2.0：在线云端版**

目标是先把前后端主链路跑通，不实现完整离线写入同步。

V2.0 包含：

- Spring Boot 3 后端
- MySQL 数据库
- 用户注册、登录、刷新 Token
- 注册后默认预算分类 seed
- 预算分类 API
- 标签 API
- 月预算 API
- 分类预算 API
- 账单 API
- Dashboard Summary API
- AI 后端代理
- V1 JSON 导入
- PWA 安装和在线使用

V2.0 中 IndexedDB 只负责：

- 缓存最近一次接口数据
- 支持离线查看
- 保留 PWA 打开速度

V2.0 暂不实现：

- 离线新增后自动同步
- `syncMutations`
- `sync_changes`
- `/sync/push`
- `/sync/pull`
- `lastChangeId`
- 多设备冲突解决
- 登录后本地数据自动合并

**V2.1：离线优先同步版**

V2.1 再补齐：

- IndexedDB 写入优先
- 本地变更队列
- Push/Pull 增量同步
- 同步幂等
- 软删除同步
- 多设备冲突策略
- 登录后本地数据合并

这样可以先交付可运行的“云端在线版”，再逐步增强离线同步，避免一开始被同步引擎拖住核心功能。

---

## 3. 技术栈

### 3.1 前端

| 项目 | 技术 | 说明 |
|---|---|---|
| 框架 | React + TypeScript + Vite | 继续沿用 V1 |
| 样式 | Tailwind CSS | 继续沿用 |
| 本地数据库 | Dexie.js + IndexedDB | 保留离线能力 |
| 状态管理 | Zustand | 继续沿用 |
| 表单 | React Hook Form + Zod | 继续沿用 |
| 路由 | React Router | 继续沿用 |
| PWA | vite-plugin-pwa | 继续沿用 |
| API Client | fetch 封装或 TanStack Query | V2 建议逐步引入 TanStack Query |

前端新增模块：

```text
src/
├─ api/
│  ├─ client.ts              # fetch 封装，统一鉴权和错误处理
│  ├─ authApi.ts
│  ├─ syncApi.ts
│  ├─ aiApi.ts
│  └─ backupApi.ts
├─ services/
│  ├─ sync/
│  │  ├─ syncQueue.ts        # 本地待同步队列
│  │  ├─ syncEngine.ts       # 推送/拉取/合并
│  │  └─ conflict.ts         # 冲突处理
│  └─ auth/
│     └─ tokenStorage.ts
└─ db/
   └─ migrations.ts          # IndexedDB V2 升级
```

### 3.2 后端

推荐技术栈：

| 项目 | 技术 | 说明 |
|---|---|---|
| Runtime | JDK 21 | Spring Boot 3 推荐使用，长期维护稳定 |
| 框架 | Spring Boot 3 | 生态成熟，适合长期扩展和部署 |
| 数据库 | MySQL 8.x | 部署普遍，运维资料多，适合个人项目长期维护 |
| ORM | MyBatis Plus | CRUD 效率高，SQL 可控，适合复杂查询逐步手写 |
| 鉴权 | JWT Access Token + Refresh Token | 适合 Web/PWA |
| 密码哈希 | Spring Security PasswordEncoder（BCrypt） | 先用成熟默认方案，后续可切 Argon2 |
| 参数校验 | Jakarta Validation | DTO 层校验 |
| API 文档 | springdoc-openapi | 生成 Swagger/OpenAPI 文档 |
| 日志 | SLF4J + Logback | Spring Boot 默认方案 |
| 测试 | JUnit 5 + Spring Boot Test | 后端集成测试标准组合 |
| 数据库迁移 | Flyway | 管理 MySQL DDL 版本 |
| 任务队列 | Redis + Spring Task / 后续 MQ | 后续 AI 总结、导入任务使用 |
| 部署 | Docker Compose 起步 | 本地和服务器一致 |

后端目录建议：

```text
server/
├─ src/main/java/com/aibill/
│  ├─ AibillApplication.java
│  ├─ common/
│  │  ├─ config/
│  │  ├─ exception/
│  │  ├─ response/
│  │  ├─ security/
│  │  └─ validation/
│  ├─ auth/
│  ├─ user/
│  ├─ budgetcategory/
│  │  ├─ controller/
│  │  ├─ service/
│  │  ├─ mapper/
│  │  ├─ entity/
│  │  ├─ dto/
│  │  └─ vo/
│  ├─ tag/
│  │  ├─ controller/
│  │  ├─ service/
│  │  ├─ mapper/
│  │  ├─ entity/
│  │  ├─ dto/
│  │  └─ vo/
│  ├─ budget/
│  ├─ record/
│  │  ├─ controller/
│  │  ├─ service/
│  │  ├─ mapper/
│  │  ├─ entity/
│  │  ├─ dto/
│  │  └─ vo/
│  ├─ setting/
│  ├─ sync/
│  ├─ ai/
│  └─ backup/
├─ src/main/resources/
│  ├─ application.yml
│  ├─ application-dev.yml
│  └─ db/migration/
├─ src/test/java/com/aibill/
├─ Dockerfile
└─ pom.xml
```

### 3.3 Monorepo 建议

V2 推荐改成 monorepo：

```text
AIBill/
├─ apps/
│  ├─ web/                 # 当前 React PWA
│  └─ api/                 # Spring Boot 3 后端
├─ packages/
│  ├─ shared/              # 前端共享类型、校验 schema、工具函数
│  └─ config/              # tsconfig/eslint 等
├─ docs/
└─ docker-compose.yml
```

如果暂时不想迁移目录，也可以先增加 `server/`，等后端稳定后再整理成 monorepo。

---

## 4. 数据模型设计

### 4.1 关键设计原则

1. 所有用户数据必须带 `userId`。
2. 所有可同步数据使用客户端生成 UUID，方便离线新增。
3. 删除采用软删除 `deletedAt`，方便多端同步删除。
4. 金额使用 MySQL `decimal(12,2)` 和 Java `BigDecimal`，不要用浮点数。
5. 月份字段使用 `YYYY-MM` 字符串，日期字段使用 `YYYY-MM-DD` 字符串。
6. 时间戳使用 MySQL `datetime(3)`，应用层统一按 `Asia/Shanghai` 或 UTC 处理。
7. 预算结果不入库，只存预算配置和账单原始数据。
8. 每条账单只能关联一个 `budgetCategoryId`，用于预算扣减。
9. 每条账单可以关联多个 `tagId`，标签不参与预算扣减，只参与筛选、分析和 AI 总结。

### 4.2 核心业务规则

以下是预算分类与标签的核心规则，后端实现时必须遵守：

1. 每条支出账单必须有且只有一个 `budgetCategoryId`。
2. 支出账单的 `budgetCategoryId` 必须指向 `budgetable = true` 的预算分类。
3. 收入账单的 `budgetCategoryId` 必须指向 `systemKey = income` 的系统预算分类。
4. 每条账单可以有 0 个或多个标签。
5. 标签不参与预算扣减。
6. Dashboard 和预算页面只按 `budgetCategoryId` 统计。
7. Analysis 页面才按 `tagId` 统计。
8. 删除账单时，`record_tags` 也要软删除。
9. 归档标签不影响历史账单展示，但不能用于新增账单。
10. 归档预算分类不影响历史账单展示，但不能用于新增支出账单。
11. 创建/更新账单和维护 `record_tags` 必须在同一个事务中完成。如果 `record_tags` 写入失败，账单创建也要回滚。
12. 编辑账单时，前端提交完整 `tagIds`，后端将该账单原有 `record_tags` 软删除，再创建新的 `record_tags`（整体替换策略）。

### 4.3 MySQL 表总览

| 表 | 说明 |
|---|---|
| users | 用户 |
| auth_sessions | 登录会话和 Refresh Token |
| user_settings | 用户设置 |
| budget_categories | 预算分类 |
| monthly_budgets | 月度总预算 |
| category_budgets | 分类预算 |
| records | 账单记录 |
| tags | 标签 |
| record_tags | 账单标签关联 |
| sync_devices | 同步设备（V2.1） |
| sync_changes | 同步变更日志（V2.1） |
| sync_mutation_receipts | 同步幂等回执（V2.1） |
| ai_parse_logs | AI 解析日志 |
| import_jobs | 后续账单导入任务 |

---

## 5. 数据库表设计

### 5.1 users

```sql
create table users (
  id char(36) primary key,
  email varchar(255) not null unique,
  phone varchar(32) null unique,
  password_hash varchar(255) not null,
  nickname varchar(64),
  timezone varchar(64) not null default 'Asia/Shanghai',
  status varchar(32) not null default 'active',
  created_at datetime(3) not null default current_timestamp(3),
  updated_at datetime(3) not null default current_timestamp(3) on update current_timestamp(3),
  deleted_at datetime(3) null
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;
```

说明：

- V2.0 只做邮箱 + 密码，`email` 必填且唯一。
- `phone` 暂不使用，保留为后续手机号登录扩展字段。
- 手机号登录、微信登录可以留到后续。

### 5.2 auth_sessions

```sql
create table auth_sessions (
  id char(36) primary key,
  user_id char(36) not null,
  refresh_token_hash varchar(255) not null,
  device_name varchar(128),
  user_agent text,
  ip_address varchar(64),
  expires_at datetime(3) not null,
  revoked_at datetime(3) null,
  created_at datetime(3) not null default current_timestamp(3),
  updated_at datetime(3) not null default current_timestamp(3) on update current_timestamp(3),
  constraint fk_auth_sessions_user foreign key (user_id) references users(id)
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create index idx_auth_sessions_user_id on auth_sessions(user_id);
```

说明：

- Access Token 短期有效，例如 15 分钟。
- Refresh Token 长期有效，例如 30 天。
- Refresh Token 只存 hash，不明文入库。

### 5.3 user_settings

```sql
create table user_settings (
  user_id char(36) primary key,
  currency varchar(8) not null default 'CNY',
  default_month_budget decimal(12,2),
  ai_provider varchar(32) not null default 'deepseek',
  ai_model varchar(64) not null default 'deepseek-v4-flash',
  created_at datetime(3) not null default current_timestamp(3),
  updated_at datetime(3) not null default current_timestamp(3) on update current_timestamp(3),
  constraint fk_user_settings_user foreign key (user_id) references users(id)
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;
```

说明：

- V2 仍然只支持 CNY 展示，但表结构预留扩展。
- 用户自己的 AI Key 不建议放前端。V2 推荐由服务端统一配置平台 Key。

### 5.4 budget_categories

```sql
create table budget_categories (
  id char(36) primary key,
  user_id char(36) not null,
  name varchar(64) not null,
  icon varchar(32),
  color varchar(32),
  sort_order integer not null default 0,
  budgetable tinyint(1) not null default 1,
  system tinyint(1) not null default 0,
  system_key varchar(32),
  archived tinyint(1) not null default 0,
  created_at datetime(3) not null default current_timestamp(3),
  updated_at datetime(3) not null default current_timestamp(3) on update current_timestamp(3),
  deleted_at datetime(3) null,
  version integer not null default 1,
  active_key varchar(64) generated always as (
    if(deleted_at is null, 'active', id)
  ) stored,
  constraint ck_budget_categories_system_key check (
    (system = 1 and system_key is not null)
    or
    (system = 0 and system_key is null)
  ),
  constraint fk_budget_categories_user foreign key (user_id) references users(id)
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create index idx_budget_categories_user_id on budget_categories(user_id);
create unique index uq_budget_categories_user_system_key
  on budget_categories(user_id, system_key, active_key);
create unique index uq_budget_categories_user_name_active
  on budget_categories(user_id, name, active_key);
```

说明：

- V1 的 `income` 分类在 V2 中建议仍然作为系统预算分类。
- 客户端可以继续用固定业务含义 `systemKey = 'income'`。
- 不建议强行保留字符串 id `income` 作为数据库主键。V2 可使用 UUID 字符串，但 API 返回时提供 `systemKey`。
- 如果为了迁移简单，也可以让系统收入分类 id 继续为 `income`，但长期不如 UUID 干净。
- 同一用户下未删除的预算分类名称建议唯一，避免记账筛选和预算设置出现两个同名分类。
- `system = 1` 时 `system_key` 必须非空；`system = 0` 时 `system_key` 必须为空，后端 service 也要重复校验。
- 预算分类决定一笔账单从哪个预算中扣除，不等同于标签。

### 5.5 monthly_budgets

```sql
create table monthly_budgets (
  id char(36) primary key,
  user_id char(36) not null,
  month char(7) not null,
  total_budget decimal(12,2) not null default 0,
  monthly_income decimal(12,2),
  created_at datetime(3) not null default current_timestamp(3),
  updated_at datetime(3) not null default current_timestamp(3) on update current_timestamp(3),
  deleted_at datetime(3) null,
  version integer not null default 1,
  constraint ck_monthly_budgets_total_budget check (total_budget >= 0),
  constraint fk_monthly_budgets_user foreign key (user_id) references users(id)
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create unique index uq_monthly_budgets_user_month
  on monthly_budgets(user_id, month);
```

说明：

- 月预算属于配置类数据，V2.0 直接更新即可，不需要软删除后重建多条记录。
- `deleted_at` 保留给 V2.1 同步 tombstone 使用，但唯一约束仍按 `user_id + month` 固定。

### 5.6 category_budgets

```sql
create table category_budgets (
  id char(36) primary key,
  user_id char(36) not null,
  budget_category_id char(36) not null,
  month char(7) not null,
  amount decimal(12,2) not null default 0,
  created_at datetime(3) not null default current_timestamp(3),
  updated_at datetime(3) not null default current_timestamp(3) on update current_timestamp(3),
  deleted_at datetime(3) null,
  version integer not null default 1,
  constraint ck_category_budgets_amount check (amount >= 0),
  constraint fk_category_budgets_user foreign key (user_id) references users(id),
  constraint fk_category_budgets_budget_category foreign key (budget_category_id) references budget_categories(id)
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create index idx_category_budgets_user_month on category_budgets(user_id, month);
create unique index uq_category_budgets_user_month_category
  on category_budgets(user_id, month, budget_category_id);
```

说明：

- `budget_category_id` 不能引用收入预算分类。该规则在服务层校验。
- 只能给 `budgetable = true` 的预算分类设置预算。
- 分类预算同样属于配置类数据，V2.0 更新原记录即可，不做“删除后重建多条 active 记录”的复杂模型。

### 5.7 records

```sql
create table records (
  id char(36) primary key,
  user_id char(36) not null,
  budget_category_id char(36) not null,
  title varchar(128) not null,
  amount decimal(12,2) not null,
  type varchar(16) not null,
  record_date date not null,
  note text,
  source varchar(16) not null default 'manual',
  occurred_at datetime(3) null,
  client_created_at datetime(3) null,
  client_updated_at datetime(3) null,
  created_at datetime(3) not null default current_timestamp(3),
  updated_at datetime(3) not null default current_timestamp(3) on update current_timestamp(3),
  deleted_at datetime(3) null,
  version integer not null default 1,
  constraint ck_records_amount check (amount > 0),
  constraint ck_records_type check (type in ('expense', 'income')),
  constraint ck_records_source check (source in ('manual', 'ai', 'import', 'recurring')),
  constraint fk_records_user foreign key (user_id) references users(id),
  constraint fk_records_budget_category foreign key (budget_category_id) references budget_categories(id)
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create index idx_records_user_date on records(user_id, record_date desc);
create index idx_records_user_budget_category_date on records(user_id, budget_category_id, record_date desc);
create index idx_records_user_type_date on records(user_id, type, record_date desc);
create index idx_records_user_updated_at on records(user_id, updated_at);
create index idx_records_user_client_updated_at on records(user_id, client_updated_at);
```

字段说明：

| 字段 | 说明 |
|---|---|
| record_date | 账单归属日期，例如 2026-06-09 |
| occurred_at | 具体发生时间，可选。V2 可以先用 created_at 展示时间 |
| client_created_at | 客户端实际创建时间，V2.1 离线同步使用 |
| client_updated_at | 客户端实际修改时间，V2.1 冲突判断使用 |
| created_at | 服务端创建时间 |
| updated_at | 服务端最后更新时间，用于服务端排序和同步日志 |
| deleted_at | 软删除时间 |

业务规则：

- `amount > 0`
- 收入记录必须关联系统收入预算分类。
- 支出记录不能关联系统收入预算分类。
- 收入不参与预算扣减。
- 标签通过 `record_tags` 关联，不写在 `records` 表中。

### 5.8 tags

```sql
create table tags (
  id char(36) primary key,
  user_id char(36) not null,
  name varchar(64) not null,
  color varchar(32),
  sort_order integer not null default 0,
  system tinyint(1) not null default 0,
  archived tinyint(1) not null default 0,
  created_at datetime(3) not null default current_timestamp(3),
  updated_at datetime(3) not null default current_timestamp(3) on update current_timestamp(3),
  deleted_at datetime(3) null,
  version integer not null default 1,
  active_key varchar(64) generated always as (
    if(deleted_at is null, 'active', id)
  ) stored,
  constraint fk_tags_user foreign key (user_id) references users(id)
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create index idx_tags_user_id on tags(user_id);
create unique index uq_tags_user_name_active
  on tags(user_id, name, active_key);
```

说明：

- 标签描述消费属性，不参与预算扣减。
- 同一用户下未删除标签名称唯一。
- 系统标签不能删除；归档标签不再出现在新增账单选择中，历史账单仍可展示。
- V2.0 可以不预置大量标签，优先支持用户按需创建。
- 后端对标签名称统一做 `trim()` 处理，不能为空，最长 64 字符。同一用户下未删除标签名称唯一。

### 5.9 record_tags

```sql
create table record_tags (
  id char(36) primary key,
  user_id char(36) not null,
  record_id char(36) not null,
  tag_id char(36) not null,
  created_at datetime(3) not null default current_timestamp(3),
  deleted_at datetime(3) null,
  version integer not null default 1,
  active_key varchar(64) generated always as (
    if(deleted_at is null, 'active', id)
  ) stored,
  constraint fk_record_tags_user foreign key (user_id) references users(id),
  constraint fk_record_tags_record foreign key (record_id) references records(id),
  constraint fk_record_tags_tag foreign key (tag_id) references tags(id)
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create index idx_record_tags_user_record on record_tags(user_id, record_id);
create index idx_record_tags_user_tag on record_tags(user_id, tag_id);
create unique index uq_record_tags_user_record_tag_active
  on record_tags(user_id, record_id, tag_id, active_key);
```

说明：

- 一笔账单可以有多个标签。
- `record_tags` 只影响筛选和分析，不影响预算扣减。
- 使用独立 UUID 主键，方便 V2.1 同步和软删除。
- 查询账单 tags 时，必须同时过滤 `record_tags.deleted_at is null` 和 `tags.deleted_at is null`，否则软删除的标签关联会被查出来。

### 5.10 sync_devices（V2.1）

```sql
create table sync_devices (
  id char(36) primary key,
  user_id char(36) not null,
  device_name varchar(128),
  platform varchar(64),
  last_synced_at datetime(3) null,
  created_at datetime(3) not null default current_timestamp(3),
  updated_at datetime(3) not null default current_timestamp(3) on update current_timestamp(3),
  constraint fk_sync_devices_user foreign key (user_id) references users(id)
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create index idx_sync_devices_user_id on sync_devices(user_id);
```

### 5.11 sync_changes（V2.1）

```sql
create table sync_changes (
  id bigint primary key auto_increment,
  user_id char(36) not null,
  entity_type varchar(32) not null,
  entity_id char(36) not null,
  operation varchar(16) not null,
  version integer not null,
  snapshot json null,
  changed_at datetime(3) not null default current_timestamp(3),
  device_id char(36),
  constraint ck_sync_changes_operation check (operation in ('create', 'update', 'delete')),
  constraint fk_sync_changes_user foreign key (user_id) references users(id)
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create index idx_sync_changes_user_id_id on sync_changes(user_id, id);
create index idx_sync_changes_entity on sync_changes(entity_type, entity_id);
```

说明：

- 用自增 `id` 作为云端同步游标。
- 客户端保存 `lastChangeId`，下次只拉取之后的变更。
- `snapshot` 保存本次变更后的实体快照；删除时至少保存 `{ "id": "...", "deletedAt": "..." }`，便于前端合并 tombstone。

### 5.12 sync_mutation_receipts（V2.1）

```sql
create table sync_mutation_receipts (
  id char(36) primary key,
  user_id char(36) not null,
  device_id char(36) not null,
  client_mutation_id char(36) not null,
  status varchar(32) not null,
  result_change_id bigint null,
  created_at datetime(3) not null default current_timestamp(3),
  constraint fk_sync_mutation_receipts_user foreign key (user_id) references users(id),
  constraint uq_sync_mutation_receipts_user_device_mutation
    unique (user_id, device_id, client_mutation_id)
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;
```

说明：

- V2.1 的 `/sync/push` 必须幂等。
- 客户端网络超时后可能重复提交同一个 mutation，后端通过 `client_mutation_id` 去重。
- 重复请求命中回执表时，应直接返回上一次处理结果，不能重复创建账单。

### 5.13 ai_parse_logs

```sql
create table ai_parse_logs (
  id char(36) primary key,
  user_id char(36) not null,
  input_text text not null,
  model varchar(64) not null,
  status varchar(32) not null,
  item_count integer not null default 0,
  error_message text,
  prompt_tokens integer,
  completion_tokens integer,
  created_at datetime(3) not null default current_timestamp(3),
  constraint fk_ai_parse_logs_user foreign key (user_id) references users(id)
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create index idx_ai_parse_logs_user_created_at on ai_parse_logs(user_id, created_at desc);
```

说明：

- 不建议长期保存完整 AI 返回原文，除非用户明确同意。
- `input_text` 后续也可以改为脱敏或只保存摘要。

### 5.14 import_jobs

```sql
create table import_jobs (
  id char(36) primary key,
  user_id char(36) not null,
  source varchar(32) not null,
  status varchar(32) not null default 'pending',
  file_name varchar(255),
  total_count integer,
  success_count integer,
  failed_count integer,
  error_message text,
  created_at datetime(3) not null default current_timestamp(3),
  updated_at datetime(3) not null default current_timestamp(3) on update current_timestamp(3),
  constraint fk_import_jobs_user foreign key (user_id) references users(id)
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;
```

说明：

- V2.0 可以先不实现账单文件导入。
- 预留给 V2.1 的微信/支付宝账单导入。

---

## 6. MyBatis Plus 设计草案

### 6.1 后端分层约定

每个业务模块按以下结构组织：

```text
record/
├─ controller/
│  └─ RecordController.java
├─ service/
│  ├─ RecordService.java
│  └─ impl/RecordServiceImpl.java
├─ mapper/
│  └─ RecordMapper.java
├─ entity/
│  ├─ RecordEntity.java
│  └─ RecordTagEntity.java
├─ dto/
│  ├─ CreateRecordRequest.java
│  └─ UpdateRecordRequest.java
└─ vo/
   └─ RecordVO.java
```

约定：

- `entity` 对应数据库表。
- `dto` 接收请求参数，并使用 Jakarta Validation 校验。
- `vo` 返回给前端，字段命名使用 camelCase。
- `mapper` 只做数据库访问。
- `service` 负责业务规则、权限隔离、事务。
- 复杂查询优先写 XML SQL，简单 CRUD 使用 MyBatis Plus。

### 6.2 公共实体字段

```java
public abstract class BaseEntity {
    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;
    private Integer version;
}
```

MyBatis Plus 配置建议：

```yaml
mybatis-plus:
  configuration:
    map-underscore-to-camel-case: true
  global-config:
    db-config:
      id-type: assign_uuid
```

### 6.3 RecordEntity 示例

```java
@Data
@TableName("records")
public class RecordEntity {
    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    private String userId;
    private String budgetCategoryId;
    private String title;
    private BigDecimal amount;
    private String type;
    private LocalDate recordDate;
    private String note;
    private String source;
    private LocalDateTime occurredAt;
    private LocalDateTime clientCreatedAt;
    private LocalDateTime clientUpdatedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;
    private Integer version;
}
```

### 6.4 RecordMapper 示例

```java
@Mapper
public interface RecordMapper extends BaseMapper<RecordEntity> {
    List<RecordEntity> selectByMonth(
        @Param("userId") String userId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );
}
```

XML 示例：

```xml
<select id="selectByMonth" resultType="com.aibill.record.entity.RecordEntity">
  select *
  from records
  where user_id = #{userId}
    and deleted_at is null
    and record_date between #{startDate} and #{endDate}
  order by record_date desc, created_at desc
</select>
```

### 6.4.1 RecordTagEntity 示例

```java
@Data
@TableName("record_tags")
public class RecordTagEntity {
    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    private String userId;
    private String recordId;
    private String tagId;
    private LocalDateTime createdAt;
    private LocalDateTime deletedAt;
    private Integer version;
}
```

### 6.4.2 BudgetCategoryEntity 示例

```java
@Data
@TableName("budget_categories")
public class BudgetCategoryEntity {
    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    private String userId;
    private String name;
    private String icon;
    private String color;
    private Integer sortOrder;
    private Boolean budgetable;
    private Boolean system;
    private String systemKey;
    private Boolean archived;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;
    private Integer version;
}
```

### 6.4.3 TagEntity 示例

```java
@Data
@TableName("tags")
public class TagEntity {
    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    private String userId;
    private String name;
    private String color;
    private Integer sortOrder;
    private Boolean system;
    private Boolean archived;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;
    private Integer version;
}
```

### 6.5 Service 规则

`RecordService` 必须集中校验：

- `amount > 0`
- `budgetCategoryId` 属于当前用户
- 收入必须使用系统收入预算分类
- 支出不能使用系统收入预算分类
- `tagIds` 必须属于当前用户，归档标签不能用于新增账单
- 更新和删除必须带 `userId` 条件
- 删除只更新 `deletedAt`，不物理删除
- 删除账单时，同时软删除关联的 `record_tags`

事务要求：

- 创建/更新账单和维护 `record_tags` 必须在同一个 `@Transactional` 事务中完成。
- 如果 `record_tags` 写入失败，账单创建必须回滚。
- 更新账单时，标签采用"整体替换"策略：将原有 `record_tags` 软删除，再创建新的 `record_tags`。

示例：

```java
@Transactional
public RecordVO createRecord(String userId, CreateRecordRequest request) {
    validateAmount(request.getAmount());
    BudgetCategoryEntity budgetCategory =
        budgetCategoryService.getOwnedBudgetCategory(userId, request.getBudgetCategoryId());
    validateRecordBudgetCategoryRule(request.getType(), budgetCategory);
    tagService.validateOwnedTags(userId, request.getTagIds());

    RecordEntity entity = new RecordEntity();
    entity.setUserId(userId);
    entity.setBudgetCategoryId(budgetCategory.getId());
    entity.setTitle(request.getTitle().trim());
    entity.setAmount(request.getAmount());
    entity.setType(request.getType());
    entity.setRecordDate(request.getRecordDate());
    entity.setSource(request.getSource());
    recordMapper.insert(entity);
    recordTagService.replaceRecordTags(userId, entity.getId(), request.getTagIds());
    // V2.1 开启离线同步后，再追加 syncChangeService.append(...)
    return recordConverter.toVO(entity, budgetCategory);
}
```

### 6.6 数据迁移

数据库迁移使用 Flyway：

```text
src/main/resources/db/migration/
├─ V1__init_auth_tables.sql
├─ V2__init_core_business_tables.sql
├─ V3__init_ai_and_import_tables.sql
└─ V4__init_sync_tables.sql        # V2.1 再添加，不纳入 V2.0
```

不要依赖 MyBatis Plus 自动建表；生产和本地都通过 Flyway 管理 DDL。

V2.0 只执行前三类迁移：

- `V1__init_auth_tables.sql`
- `V2__init_core_business_tables.sql`
- `V3__init_ai_and_import_tables.sql`

`sync_devices`、`sync_changes`、`sync_mutation_receipts` 对应 `V4__init_sync_tables.sql`，等 V2.1 开始做离线同步时再创建，避免 V2.0 后端提前维护暂时不用的同步 service。

---

## 7. 后端 API 设计

### 7.1 通用约定

Base URL：

```text
/api/v1
```

鉴权：

```text
Authorization: Bearer <accessToken>
```

响应格式：

```json
{
  "data": {},
  "error": null
}
```

错误格式：

```json
{
  "data": null,
  "error": {
    "code": "RECORD_AMOUNT_INVALID",
    "message": "金额必须大于 0"
  }
}
```

### 7.2 Auth API

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/auth/register` | 注册 |
| POST | `/auth/login` | 登录 |
| POST | `/auth/refresh` | 刷新 Token |
| POST | `/auth/logout` | 登出当前设备 |
| GET | `/auth/me` | 当前用户 |

登录返回：

```json
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "nickname": "AIBill User"
    },
    "accessToken": "..."
  },
  "error": null
}
```

说明：

- `refreshToken` 不通过 JSON 返回。
- 后端登录成功后通过 `Set-Cookie` 写入 httpOnly Cookie。
- Cookie 属性：`HttpOnly; Secure; SameSite=Lax; Path=/api/auth/refresh`。
- 前端只把 `accessToken` 保存在内存中。

### 7.3 Records API

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/records?month=2026-06` | 查询月账单 |
| GET | `/records?month=2026-06&tagId=xxx` | 按标签筛选月账单（V2.0 可选支持） |
| GET | `/records/:id` | 查询单条 |
| POST | `/records` | 新增 |
| PATCH | `/records/:id` | 编辑 |
| DELETE | `/records/:id` | 软删除 |

新增账单：

```json
{
  "id": "client-generated-uuid",
  "title": "午饭",
  "amount": "18.00",
  "type": "expense",
  "budgetCategoryId": "uuid",
  "tagIds": ["tag-uuid-1", "tag-uuid-2"],
  "recordDate": "2026-06-14",
  "note": "",
  "source": "manual"
}
```

服务端校验：

- `amount > 0`
- `recordDate` 合法
- `budgetCategoryId` 属于当前用户
- 收入只能使用收入预算分类
- 支出不能使用收入预算分类
- `tagIds` 均属于当前用户，归档标签不能用于新增账单

返回账单示例：

```json
{
  "data": {
    "id": "uuid",
    "title": "和女朋友吃火锅",
    "amount": "168.00",
    "type": "expense",
    "budgetCategory": {
      "id": "uuid",
      "name": "恋爱/社交"
    },
    "tags": [
      { "id": "tag-uuid-1", "name": "约会" },
      { "id": "tag-uuid-2", "name": "餐饮" },
      { "id": "tag-uuid-3", "name": "火锅" }
    ],
    "recordDate": "2026-06-14",
    "source": "manual"
  },
  "error": null
}
```

### 7.4 Budget Categories API

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/budget-categories` | 查询预算分类 |
| POST | `/budget-categories` | 新增预算分类 |
| PATCH | `/budget-categories/:id` | 编辑预算分类 |
| POST | `/budget-categories/:id/archive` | 归档预算分类 |
| POST | `/budget-categories/:id/restore` | 恢复预算分类 |

规则：

- 系统预算分类不能归档、删除、改为普通分类。
- 有历史账单的预算分类只归档，不物理删除。
- 新账单预算分类选择只展示未归档分类。
- 预算分类参与预算扣减，标签不参与预算扣减。

### 7.5 Tags API

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/tags` | 查询标签 |
| POST | `/tags` | 新增标签 |
| PATCH | `/tags/:id` | 编辑标签 |
| POST | `/tags/:id/archive` | 归档标签 |
| POST | `/tags/:id/restore` | 恢复标签 |

规则：

- 同一用户下未删除标签名称唯一。
- 系统标签不能删除。
- 归档标签不再出现在新增账单的标签选择中。
- 历史账单仍显示归档标签。
- 标签只用于筛选、分析和 AI 总结，不参与预算扣减。
- 标签名称必须 `trim()` 后校验，不能为空，最长 64 字符。
- 同一用户下未删除标签名称不区分大小写唯一（通过唯一索引保证）。

### 7.6 Budget API

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/budgets/monthly?month=2026-06` | 查询月预算 |
| PUT | `/budgets/monthly/:month` | 设置月总预算 |
| GET | `/budgets/categories?month=2026-06` | 查询分类预算 |
| PUT | `/budgets/categories/:month` | 批量保存分类预算 |
| GET | `/budgets/summary?month=2026-06` | 服务端预算摘要，V2.0 首页必需 |

说明：

- V2.0 后端必须提供 `/budgets/summary`，用于在线版首页直接展示。
- 前端仍保留本地预算计算函数，作为离线展示和测试对照。

返回示例：

```json
{
  "data": {
    "month": "2026-06",
    "totalBudget": "3700.00",
    "totalExpense": "1340.00",
    "remaining": "2360.00",
    "isOverspent": false,
    "todaySuggested": "107.27",
    "monthlySurplus": null,
    "allocationDiff": {
      "diff": "0.00",
      "type": "exact"
    },
    "budgetCategoryStatuses": [
      {
        "budgetCategoryId": "uuid",
        "budgetCategoryName": "餐饮",
        "budget": "1500.00",
        "spent": "680.00",
        "remaining": "820.00",
        "usageRate": 0.4533,
        "status": "normal"
      }
    ]
  },
  "error": null
}
```

字段约定：

- 金额字段通过字符串返回，避免前后端浮点精度问题。
- `usageRate` 使用 number，范围通常为 `0` 到 `1`，超预算时可以大于 `1`。
- 当前月份返回 `todaySuggested`；历史月份返回 `monthlySurplus`，`todaySuggested` 为 `null`。
- `budgetCategoryStatuses` 只按 `records.budget_category_id` 统计，不按标签统计，避免一笔账单被多个标签重复扣预算。
- `totalExpense` 是当前月份所有 `type = expense` 且 `deleted_at is null` 的 `records` 金额总和。即使一笔账单有多个标签，`totalExpense` 也只加一次，不受标签数量影响。

### 7.7 Settings API

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/settings` | 查询设置 |
| PATCH | `/settings` | 更新设置 |

### 7.8 AI API

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/ai/parse-records` | 自然语言解析账单 |

请求：

```json
{
  "input": "工资6000，午饭18，地铁4",
  "today": "2026-06-14"
}
```

响应：

```json
{
  "data": {
    "items": [
      {
        "title": "工资",
        "amount": "6000.00",
        "budgetCategoryId": "income-budget-category-uuid",
        "budgetCategoryName": "收入",
        "tagNames": ["工资"],
        "type": "income",
        "date": "2026-06-14",
        "confidence": 0.95
      }
    ]
  },
  "error": null
}
```

后端职责：

- 读取用户预算分类和标签。
- 构建 Prompt。
- 调用 DeepSeek/OpenAI 兼容接口。
- 解析 JSON。
- 做 normalize。
- 记录 ai_parse_logs。
- 不直接写入账单表。

AI 解析字段约定：

```json
{
  "title": "和女朋友吃火锅",
  "amount": "168.00",
  "budgetCategoryName": "恋爱/社交",
  "tagNames": ["约会", "餐饮", "火锅", "晚餐"],
  "type": "expense",
  "date": "2026-06-14",
  "confidence": 0.95
}
```

Normalize 规则：

- `budgetCategoryName` 必须映射到一个预算分类。
- 支出只能映射到 `budgetable = true` 的预算分类。
- 收入统一映射到系统收入预算分类。
- `tagNames` 是建议标签，不参与预算扣减。
- V2.0 不建议 AI 自动创建新标签，避免生成大量近义脏标签。
- 前端确认页展示建议标签，用户确认保存时再选择已有标签或创建新标签。
- AI 单条账单最多返回 5 个 `tagNames`，超过时取置信度最高的 5 个。
- `tagName` 长度限制 1-20 字符，超出的自动截断。
- 重复 `tagNames` 自动去重。

### 7.9 Sync API（V2.1）

本节属于 V2.1。V2.0 暂不实现 Sync API，只实现在线 CRUD API 和本地缓存。

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/sync/push` | 上传本地变更 |
| GET | `/sync/pull?since=123` | 拉取云端变更 |
| POST | `/sync/full` | 首次全量同步 |

`POST /sync/push`：

```json
{
  "deviceId": "uuid",
  "changes": [
    {
      "entityType": "record",
      "operation": "create",
      "clientMutationId": "uuid",
      "data": {
        "id": "uuid",
        "title": "午饭",
        "amount": "18.00",
        "type": "expense",
        "budgetCategoryId": "uuid",
        "recordDate": "2026-06-14",
        "source": "manual",
        "clientCreatedAt": "2026-06-14T12:00:00.000Z",
        "clientUpdatedAt": "2026-06-14T12:00:00.000Z"
      }
    }
  ]
}
```

响应：

```json
{
  "data": {
    "accepted": ["clientMutationId"],
    "rejected": [],
    "serverChanges": [],
    "lastChangeId": 456
  },
  "error": null
}
```

幂等要求：

- `clientMutationId` 必须由客户端生成并持久化。
- 后端必须写入 `sync_mutation_receipts`。
- 同一用户、同一设备、同一个 `clientMutationId` 重复 push 时，必须返回第一次处理结果，不能重复执行 create/update/delete。

`GET /sync/pull?since=123`：

```json
{
  "data": {
    "changes": [
      {
        "changeId": 124,
        "entityType": "record",
        "operation": "update",
        "entityId": "uuid",
        "version": 2,
        "data": {}
      }
    ],
    "lastChangeId": 456
  },
  "error": null
}
```

`data` 来源：

- `sync_changes.snapshot` 保存变更快照，pull 时直接返回。
- delete 变更至少返回 `{ "id": "...", "deletedAt": "..." }`。
- 如果后续不保存完整 snapshot，则必须保证删除实体仍能返回 tombstone，否则前端无法合并删除。

### 7.10 Analysis API（V2.2）

标签分析不纳入 V2.0。V2.0 只把 `tags` 和 `record_tags` 数据结构打好，后续再做分析页面。

V2.0 Records API 可选支持 `tagId` 筛选；V2.2 再做完整 Analysis API。

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/analysis/tags?month=2026-06` | 按标签统计消费 |
| GET | `/analysis/tags/:tagId/records?month=2026-06` | 查询某标签下的账单 |

返回示例：

```json
{
  "data": {
    "month": "2026-06",
    "items": [
      {
        "tagId": "uuid",
        "tagName": "餐饮",
        "amount": "263.00",
        "recordCount": 5
      },
      {
        "tagId": "uuid",
        "tagName": "约会",
        "amount": "168.00",
        "recordCount": 1
      }
    ]
  },
  "error": null
}
```

说明：

- 分析 API 按标签统计，不影响预算。
- 一笔账单有多个标签时，会出现在多个标签统计中，这是分析视角，不是预算扣减。
- 预算页面和 Dashboard Summary 仍只按 `budgetCategoryId` 统计。

---

## 8. V2.1 同步设计

本章属于 V2.1，不纳入 V2.0 首批开发范围。V2.0 只做在线 API 和本地缓存，不支持离线新增后自动同步。

### 8.1 前端 IndexedDB V2 新增字段

现有表建议新增同步字段：

```typescript
interface SyncFields {
  syncStatus?: 'synced' | 'pending' | 'conflict'
  deletedAt?: string
  version?: number
  lastSyncedAt?: string
}
```

新增本地表：

```typescript
interface SyncMutation {
  id: string
  entityType: 'budgetCategory' | 'monthlyBudget' | 'categoryBudget' | 'record' | 'tag' | 'recordTag' | 'settings'
  entityId: string
  operation: 'create' | 'update' | 'delete'
  payload: unknown
  createdAt: string
  retryCount: number
  lastError?: string
}

interface SyncMeta {
  key: 'lastChangeId' | 'deviceId'
  value: string
}
```

Dexie V2 schema 示例：

```typescript
db.version(2).stores({
  budgetCategories: 'id, name, budgetable, archived, order, syncStatus, deletedAt, updatedAt',
  monthlyBudgets: 'id, &month, syncStatus, deletedAt, updatedAt',
  categoryBudgets: 'id, &[month+budgetCategoryId], month, budgetCategoryId, syncStatus, deletedAt, updatedAt',
  records: 'id, date, budgetCategoryId, type, source, syncStatus, deletedAt, updatedAt, [budgetCategoryId+date], [type+date]',
  tags: 'id, name, archived, syncStatus, deletedAt, updatedAt',
  recordTags: 'id, recordId, tagId, [recordId+tagId], syncStatus, deletedAt',
  settings: 'key, updatedAt, syncStatus',
  syncMutations: 'id, entityType, entityId, operation, createdAt',
  syncMeta: 'key',
})
```

设置数据示例：

```typescript
{
  key: 'appSettings',
  currency: 'CNY',
  defaultMonthBudget: 3700,
  aiProvider: 'deepseek',
  aiModel: 'deepseek-v4-flash',
  updatedAt: '2026-06-14T12:00:00.000Z'
}
```

说明：

- Dexie schema 的第一个字段是主键，settings 表不能继续用 `currency` 当主键。
- V2.0 如果只做在线版，也可以先不升级 settings 表，等 V2.1 同步设置时再迁移。

### 8.2 同步流程

启动 App：

```text
1. 加载本地 IndexedDB
2. 如果未登录，只使用本地模式
3. 如果已登录：
   3.1 刷新 Access Token
   3.2 push 本地待同步变更
   3.3 pull 云端增量变更
   3.4 合并到 IndexedDB
   3.5 刷新页面数据
```

本地新增账单：

```text
1. 写 records 表
2. 写 syncMutations 表
3. 页面立即更新
4. 后台触发 sync push
```

### 8.3 冲突策略

V2.1 初版采用简单策略：

| 场景 | 处理 |
|---|---|
| 不同设备编辑不同记录 | 直接合并 |
| 不同设备编辑同一记录 | `clientUpdatedAt` 较新的覆盖 |
| 一端删除，一端编辑 | 删除优先，除非编辑的 `clientUpdatedAt` 晚于删除时间 |
| 分类被归档后仍有历史账单 | 历史账单正常展示 |
| 分类被归档后另一端新增该分类账单 | 服务端拒绝，前端提示选择新分类 |

后续可升级为字段级冲突或冲突确认界面。

### 8.4 首次登录后的数据合并

用户已经在 V1 本地使用，V2 登录后需要处理本地数据。

V2.0 不做登录后自动合并，采用显式迁移：

- 用户在设置页导出 V1 JSON。
- 登录 V2 云端账户。
- 上传 V1 JSON。
- 后端校验并导入。
- 前端重新拉取云端数据。

V2.1 再考虑登录后自动检测本地未同步数据并合并。

推荐流程：

```text
用户登录成功
  |
  |-- 云端为空：上传本地全部数据
  |
  |-- 云端不为空：弹窗询问
        1. 合并本地和云端数据
        2. 用云端覆盖本地
        3. 先导出本地备份
```

V2.1 最稳妥的默认：

- 新用户：上传本地数据到云端。
- 老用户：默认拉取云端，并提示本地有未同步数据时先导出备份。

---

## 9. AI 后端代理设计

### 9.1 为什么 V2 必须后端代理

V1 的 API Key 存 localStorage，只适合个人本地用。V2 一旦部署给手机或多设备使用，前端直连 AI 会有问题：

- Key 暴露
- 无法统一限流
- 无法记录调用成本
- 无法更换模型
- 无法做 Prompt 版本管理

### 9.2 AI Provider 配置

后端 `.env`：

```text
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=xxx
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
DEEPSEEK_MODEL=deepseek-v4-flash
```

后端 `AiService` 需要抽象 provider：

```java
public interface AiProvider {
    List<ParsedRecordItem> parseRecords(String input, AiParseContext context);
}
```

### 9.3 Prompt 版本管理

建议后端维护：

```text
ai/
├─ prompts/
│  ├─ ParseRecordPromptV1.java
│  └─ ParseRecordPromptV2.java
├─ providers/
│  ├─ DeepSeekProvider.java
│  └─ OpenAiCompatibleProvider.java
└─ normalizers/
   └─ ParsedRecordNormalizer.java
```

AI 日志中记录：

- model
- promptVersion
- status
- itemCount
- token 用量
- 错误原因

---

## 10. 预算计算归属

V2 推荐继续让前端保留纯函数计算，同时后端也实现同一套计算逻辑。

原因：

- 前端离线时也能计算预算。
- 后端需要为未来月报、周报、推送提醒提供计算能力。
- 前后端分别实现同一套计算规则，并用测试用例对齐结果。

建议维护一组跨端一致的计算用例：

```text
docs/test-cases/budget-calculation.json
web/src/services/budget/calculator.ts
server/src/main/java/com/aibill/budget/service/BudgetCalculator.java
```

---

## 11. 安全设计

### 11.1 鉴权

- Access Token：15 分钟过期。
- Refresh Token：30 天过期。
- Refresh Token 存服务端 hash。
- V2.0 强制同域部署：`https://aibill.example.com` 提供前端静态文件，`/api` 反向代理到 Spring Boot。
- Refresh Token 使用 `httpOnly + Secure + SameSite=Lax` Cookie。
- Access Token 只存内存，不写入 localStorage 或 IndexedDB。
- 刷新页面后，前端调用 `/auth/refresh` 获取新的 Access Token。

不建议在 V2.0 中支持跨域 Cookie、多域部署或把 Refresh Token 存到 localStorage，这些分支会增加实现复杂度和安全风险。

### 11.2 权限隔离

所有查询必须带 `userId` 条件：

```java
LambdaQueryWrapper<RecordEntity> wrapper = Wrappers.lambdaQuery(RecordEntity.class)
    .eq(RecordEntity::getId, recordId)
    .eq(RecordEntity::getUserId, currentUserId)
    .isNull(RecordEntity::getDeletedAt);
```

禁止只按 id 查询用户数据。

### 11.3 数据校验

服务端必须重复校验，不相信前端：

- 金额必须合法。
- 月份格式必须合法。
- 日期格式必须合法。
- 分类必须属于当前用户。
- 系统分类不能被普通接口修改。
- 收入/支出分类规则必须校验。

### 11.4 AI 限流

V2.0 建议：

- 每用户每分钟最多 20 次 AI 解析。
- 每用户每天最多 300 次 AI 解析。
- 单次输入长度限制 1000 字。

---

## 12. 部署设计

### 12.1 本地开发

```yaml
services:
  mysql:
    image: mysql:8.4
    environment:
      MYSQL_DATABASE: aibill
      MYSQL_USER: aibill
      MYSQL_PASSWORD: aibill
      MYSQL_ROOT_PASSWORD: root
    ports:
      - "3306:3306"
    command:
      - --character-set-server=utf8mb4
      - --collation-server=utf8mb4_unicode_ci
      - --default-time-zone=+08:00
    volumes:
      - mysqldata:/var/lib/mysql

  redis:
    image: redis:7
    ports:
      - "6379:6379"

volumes:
  mysqldata:
```

V2.0 如果不用队列，可以先不启动 Redis。

### 12.2 生产部署

推荐最低配置：

- 1 台国内云服务器
- Docker Compose
- Nginx 反向代理
- MySQL 容器或云数据库
- HTTPS 证书

部署结构：

```text
https://aibill.example.com        -> web 静态文件
https://aibill.example.com/api    -> Spring Boot 3 API
```

同域部署的好处：

- Cookie 鉴权简单。
- PWA 访问更稳定。
- 避免 CORS 复杂度。

---

## 13. V1 到 V2 迁移方案

### 13.1 数据兼容

V1 导出格式：

```json
{
  "app": "AIBill",
  "version": "1.0.0",
  "data": {
    "categories": [],
    "monthlyBudgets": [],
    "categoryBudgets": [],
    "records": [],
    "settings": {}
  }
}
```

V2 后端提供导入接口：

```text
POST /api/v1/backup/import-v1
```

导入流程：

```text
1. 用户登录
2. 上传 V1 JSON
3. 后端校验
4. V1 分类 id 映射到 V2 预算分类 id
5. 写入 MySQL
6. 返回导入结果
7. 前端拉取全量同步
```

### 13.2 分类 ID 映射

V1 可能使用字符串 id：

- `cat-food`
- `cat-transport`
- `income`

V2 使用 `budget_categories` 和 UUID 后，需要建立导入映射：

```text
oldCategoryId -> newBudgetCategoryId
```

账单和分类预算导入时按映射替换：

- `records.categoryId` → `records.budgetCategoryId`
- `categoryBudgets.categoryId` → `categoryBudgets.budgetCategoryId`

V1 没有标签体系，导入后 `record_tags` 为空。后续可以让用户手动补标签，或由 AI 分析建议标签。

不要在导入时根据旧分类自动创建标签。比如旧分类"餐饮"转成预算分类后，不要又自动给所有餐饮账单加"餐饮"标签，否则可能和用户真实意图不一致。

### 13.3 V2 首次启动 Seed

注册新用户后，服务端自动创建默认预算分类：

- 餐饮
- 交通
- 学习
- 娱乐
- 健身
- 日用品
- 恋爱/社交
- 其他
- 收入（systemKey = income）

---

## 14. 开发阶段规划

### 阶段 A：纯后端最小闭环

目标：先不碰前端同步，把 Spring Boot 在线云端版主链路跑通。

任务：

- Spring Boot 3 项目启动。
- MySQL + Flyway。
- MyBatis Plus 基础配置。
- 注册 / 登录 / refresh / me。
- 注册后自动 seed 默认预算分类。
- budget-categories 查询和管理。
- tags 查询和管理。
- records CRUD。
- records CRUD 支持 `budgetCategoryId` 和 `tagIds`。
- monthly budget / category budget API。
- dashboard summary API。
- Swagger/OpenAPI 文档。

验收：

- 用 Swagger 或 Postman 可以完整跑通：
  注册 → 登录 → 查看默认预算分类 → 设置预算 → 新增账单 → 查看 dashboard。
- 收入/支出分类规则在后端生效。
- 账单金额、日期、月份校验在后端生效。
- 所有业务查询都带 `userId` 隔离。

### 阶段 B：前端在线接 API

目标：浏览器登录后可以完整使用在线版 AIBill。

任务：

- 登录页。
- apiClient。
- authStore。
- Access Token 内存管理。
- `/auth/refresh` 启动恢复登录态。
- 预算分类、标签、预算、账单页面改为调用 API。
- Dashboard 使用后端 summary。
- IndexedDB 仅缓存最近一次接口数据，用于离线查看。

验收：

- 用户可以在浏览器中登录/登出。
- 登录后可以完成设置预算、记账、查看首页、查看账单。
- 刷新页面后能通过 refresh cookie 恢复登录态。
- 断网时可以查看最近一次缓存数据，但不承诺离线新增同步。

### 阶段 C：AI 后端代理

目标：前端不再保存 AI API Key。

任务：

- 后端 AI provider。
- `/ai/parse-records`。
- AI 日志。
- 后端 normalize。
- 前端 AI 记账改为请求后端。
- 设置页移除本地 API Key 配置或改成模型选择。

验收：

- 前端不再需要 API Key。
- AI 解析仍返回待确认列表。
- AI 解析结果包含 `budgetCategoryName` 和 `tagNames`。
- AI 不自动写入账单。
- 未配置后端 AI Key、网络异常、非 JSON、空数组等错误有清晰提示。

### 阶段 D：V1 数据迁移

目标：已有本地数据可以迁移到云端。

任务：

- 上传 V1 JSON。
- 后端校验导入文件。
- 分类 ID 映射。
- V1 分类映射到 V2 预算分类。
- V1 账单导入后默认不生成标签。
- 写入 MySQL。
- 导入结果报告。
- 前端导入后刷新云端数据。

验收：

- V1 导出的 JSON 能导入 V2。
- 导入后预算、账单、分类一致。
- 导入失败不写入半截数据。
- 分类 ID 映射正确，收入分类规则正确。

### 阶段 E：离线同步（V2.1）

目标：在线版稳定后，再实现本地优先同步。

任务：

- IndexedDB 增加同步字段。
- `syncMutations` 本地表。
- `sync_changes` 云端表。
- `sync_mutation_receipts` 幂等表。
- `/sync/push`。
- `/sync/pull`。
- `lastChangeId`。
- snapshot/tombstone 合并。
- 基于 `clientUpdatedAt` 的冲突策略。

验收：

- 离线新增账单，恢复网络后能同步到后端。
- 另一个设备登录后能拉取到变更。
- 重复 push 同一个 `clientMutationId` 不会重复创建数据。
- 删除同步后其他设备能正确删除本地记录。
- 同一条记录多端编辑时按冲突策略处理。

---

## 15. V2.0 范围边界

V2.0 必做：

- 后端项目
- MySQL
- 用户注册登录
- 默认预算分类 seed
- 预算分类 API
- 标签 API
- 预算 API
- 账单 API
- 账单支持 `budgetCategoryId` 和 `tagIds`
- Dashboard Summary API
- 前端登录态
- 前端在线接 API
- IndexedDB 最近数据缓存和离线查看
- AI 后端代理
- V1 数据迁移入口
- PWA 保留

V2.0 不建议同时做：

- 完整离线写入同步
- `syncMutations`
- `sync_changes`
- `/sync/push`
- `/sync/pull`
- `lastChangeId`
- 多设备冲突解决
- 后台自动同步
- 微信/支付宝账单导入
- OCR 截图识别
- 多账本
- 家庭共享
- 复杂图表
- 推送通知
- 自动固定支出
- AI 周报/月报
- 标签分析页
- 标签消费趋势

完整离线同步放到 V2.1；导入、OCR、多账本、AI 周报等功能适合放到 V2.2 以后。

### 15.1 V2.0 开发优先级

虽然文档里把 tags 放 V2.0，但实际开发顺序不要让标签拖住主链路。先保证"设置预算 → 新增账单 → Dashboard 预算变化"这个闭环跑通。

**P0：必须先做（闭环主链路）**

- 用户注册登录
- 默认预算分类 seed
- budget-categories API
- monthly budget API
- category budget API
- records CRUD（含 `budgetCategoryId`）
- dashboard summary API

**P1：紧接着做（标签基础能力）**

- tags API
- record_tags
- records CRUD 支持 `tagIds`
- 账单返回 tags

**P2：后面做（增强功能）**

- AI 返回 `tagNames`
- 标签管理页完善
- 按标签筛选账单（`tagId` 查询参数）
- Analysis API

---

## 16. 风险与取舍

### 16.1 同步复杂度

风险：本地优先同步比普通 CRUD 难。

取舍：V2.0 先做在线云端版，只保留 IndexedDB 缓存和离线查看。完整离线写入同步放到 V2.1，避免同步细节拖慢前后端主链路。

### 16.2 账户系统安全

风险：Refresh Token、Cookie、跨域、XSS 都需要注意。

取舍：V2.0 固定同域部署，Refresh Token 使用 httpOnly + Secure + SameSite=Lax Cookie，Access Token 只存内存。

### 16.3 金额精度

风险：前端 number 和后端 BigDecimal 可能不一致。

取舍：API 层金额用字符串传输，例如 `"18.00"`。前端展示和输入仍可用 number，但写入 API 前转成 decimal string。

### 16.4 分类 ID 迁移

风险：V1 使用字符串 id，V2 使用 UUID 后需要映射。

取舍：后端导入时统一映射，前端同步后使用新 UUID。短期可保留 oldId 字段辅助排查。

---

## 17. 推荐下一步

建议先做一个 V2 技术验证分支：

```text
feat/v2-backend-bootstrap
```

第一批 P0：纯后端最小闭环（主链路）

1. 后端 Spring Boot 3 初始化
2. MySQL + MyBatis Plus + Flyway
3. 注册 / 登录 / refresh / me
4. 注册后自动 seed 默认预算分类
5. budget-categories 查询
6. records CRUD，只支持 `budgetCategoryId`
7. monthly budget / category budget API
8. dashboard summary API

验收方式：用 Swagger 或 Postman 跑通”注册 → 登录 → 查看默认预算分类 → 设置预算 → 新增账单 → 查看 dashboard”。

第二批 P1：标签基础能力

1. tags API
2. record_tags
3. records CRUD 支持 `tagIds`
4. 账单返回 tags

验收方式：用 Swagger 或 Postman 跑通”新增/编辑账单时选择标签 → 查询账单返回 tags → 按标签筛选账单”。

第一批跑通后进入第二批，两批都跑通后再进入”前端在线接 API”。同步引擎等在线版稳定后放到 V2.1。
