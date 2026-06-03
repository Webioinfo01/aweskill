# HarnessKit 调研与启发

**调研时间**：2026-06-03
**参考仓库**：[RealZST/HarnessKit](https://github.com/RealZST/HarnessKit)
**当前版本**：HarnessKit 1.5.2 / aweskill 0.3.6

---

## 一、HarnessKit 核心架构速览

| 模块 | 文件 | 大小 | 职责 |
|---|---|---|---|
| `models.rs` | `crates/hk-core/src/models.rs` | ~18KB | 统一扩展模型、权限模型、审计模型、配置作用域 |
| `adapter/` | `crates/hk-core/src/adapter/` | 8 个文件 | AgentAdapter trait + 8 个 Agent 实现 |
| `deployer.rs` | `crates/hk-core/src/deployer.rs` | ~110KB | 跨 Agent 部署引擎，格式转换核心 |
| `store.rs` | `crates/hk-core/src/store.rs` | ~114KB | SQLite 持久化，扩展注册表、Kit 追踪 |
| `marketplace.rs` | `crates/hk-core/src/marketplace.rs` | ~60KB | skills.sh + Smithery 市场集成 |
| `scanner.rs` | `crates/hk-core/src/scanner.rs` | ~108KB | 18 条安全审计规则，信任评分引擎 |
| `kits/` | `crates/hk-core/src/kits/` | — | Kit 打包、部署、追踪 |

**技术栈**：Rust workspace（4 crates: hk-core / hk-cli / hk-desktop / hk-web）+ TypeScript/Vite 前端

---

## 二、Agent-first CLI 设计

### 2.1 数据模型

HarnessKit 把 CLI 当作 **第五种独立扩展类型**（`ExtensionKind::Cli`），与 Skill/MCP/Plugin/Hook 并列。

```rust
pub enum ExtensionKind { Skill, Mcp, Plugin, Hook, Cli }

pub struct Extension {
    pub id: String,
    pub kind: ExtensionKind,
    pub name: String,
    pub description: String,
    pub source: Source,
    pub agents: Vec<String>,
    pub tags: Vec<String>,
    pub pack: Option<String>,
    pub permissions: Vec<Permission>,
    pub enabled: bool,
    pub trust_score: Option<u8>,
    pub cli_meta: Option<CliMeta>,       // 仅 kind=Cli 时填充
    pub install_meta: Option<InstallMeta>,
    pub scope: ConfigScope,
}

pub struct CliMeta {
    pub binary_name: String,             // 命令名，如 "hk"
    pub binary_path: Option<String>,     // 二进制安装路径
    pub install_method: Option<String>,  // npm / cargo / 二进制
    pub credentials_path: Option<String>,// 凭证文件路径
    pub version: Option<String>,
    pub api_domains: Vec<String>,        // 调用的 API 域名（安全审计用）
}
```

**关键设计**：CLI 元数据通过 `Option<CliMeta>` 嵌入到通用 Extension 中，共享同一套生命周期（安装、启用、禁用、审计、更新），但拥有类型专属的子集。

### 2.2 CLI 的特殊处理：PATH 注入

HarnessKit 发现 GUI Agent（Antigravity、Windsurf）启动时 **不继承 shell 的 $PATH**，导致 MCP server 用相对命令名找不到。解决方案：

```rust
// Adapter trait 方法
fn needs_path_injection(&self) -> bool { false }

// AntigravityAdapter 和 WindsurfAdapter 覆盖为 true
// deployer.rs 中：如果 needs_path_injection() == true
// → 解析 bare command 为绝对路径
// → 注入 PATH 到 MCP 配置的环境变量块
```

**测试保障**：
```rust
#[test]
fn test_needs_path_injection_invariants() {
    assert!(by_name["antigravity"].needs_path_injection());
    assert!(by_name["windsurf"].needs_path_injection());
    for name in ["claude","codex","gemini","cursor","copilot","opencode"] {
        assert!(!by_name[name].needs_path_injection());
    }
}
```

### 2.3 对 aweskill 的启发

| 启发点 | 说明 | 优先级 |
|---|---|---|
| **扩展模型泛型化** | 当前 aweskill 的 skill 模型较单一，可升级为泛型 Extension + kind 区分，为 CLI/MCP/Plugin 预留空间 | 🔴 高 |
| **CLI 元数据声明** | 每个 CLI 类型 skill 应声明：binary_name、version、api_domains、credentials_path | 🔴 高 |
| **GUI Agent 环境隔离** | 如果 aweskill 部署的 CLI 被 GUI Agent 调用，需要考虑 PATH 注入或绝对路径解析 | 🟡 中 |

---

## 三、Plugin 和 MCP 扩展管理

### 3.1 MCP 管理：跨格式转换引擎

HarnessKit 的 MCP 管理不是简单的"复制配置文件"，而是 **统一解析 → 格式转换 → 写入**：

| Agent | MCP 配置格式 | Enum 值 |
|---|---|---|
| Claude / Gemini / Cursor / Antigravity | `{"mcpServers": {...}}` | `McpFormat::McpServers` |
| Copilot (VS Code) | `{"servers": {...}}` | `McpFormat::Servers` |
| Codex | TOML `[mcp_servers.<name>]` | `McpFormat::Toml` |
| OpenCode | `{"mcp": {...}}` (tagged union) | `McpFormat::Opencode` |

**核心流程**：
1. 从源 Agent 读取 MCP 配置 → 解析为统一的 `McpServerEntry {command, args, env}`
2. 根据目标 Agent 的 `McpFormat` 生成适配后的配置
3. 写入目标 Agent 的原生目录

**项目级 MCP**：每个 Agent 可声明 `project_mcp_config_relpath()`，支持项目独立的 `.mcp.json`。

### 3.2 Plugin 管理：VS Code 生态深度集成

| 字段 | 说明 |
|---|---|
| `uri` | VS Code pluginUri（如 `file:///...`），用于在 VS Code 状态 store 中定位插件 |
| `path` | 插件本地安装路径 |
| `installed_at` / `updated_at` | 精确时间戳，从 registry 文件读取而非文件系统推测 |

**关键设计**：
- Copilot 和 Cursor 都是 VS Code 分支，插件存储在 VS Code 的 global storage 中
- HarnessKit 通过读取 VS Code 的 `state.vscdb`（SQLite）和 `extensions.json` 来发现插件
- 启用/禁用插件时，需要修改 VS Code 的 `globalStorage` 中的状态文件

### 3.3 Hook 管理：事件翻译系统

```rust
pub enum HookFormat {
    ClaudeLike,  // {"hooks": {"Event": [{...}]}
    Cursor,      // {"version": 1, "hooks": {"event": [{...}]}
    Copilot,     // {"version": 1, "hooks": {"event": [{"type": "command", ...}]}
    Windsurf,    // {"hooks": {"event": [{...}]}
    None,
}
```

`hook_events.rs` 集中管理事件翻译映射：
- Claude 的 `on_chat_started` ↔ Codex 的 `on_session_start`
- 部署时自动翻译，用户无感知

### 3.4 对 aweskill 的启发

| 启发点 | 说明 | 优先级 |
|---|---|---|
| **MCP 格式转换** | 增加 `aweskill mcp` 子命令，支持从 Smithery 浏览安装，自动适配各 Agent 格式 | 🟡 中 |
| **Hook 事件翻译表** | 如果未来支持 Hook 管理，需要集中管理事件名称映射 | 🟢 低 |
| **插件发现** | 对于 VS Code 系 Agent（Cursor、Copilot），需要读取其状态 store 而非简单扫描目录 | 🟢 低 |

---

## 四、统一扩展模型（Extension Model）

### 4.1 HarnessKit 的泛型设计

```
Extension {
  // === 通用字段（所有扩展类型共享）===
  id: String,
  kind: ExtensionKind,           // Skill | Mcp | Plugin | Hook | Cli
  name: String,
  description: String,
  source: Source,                // origin(Git/Registry/Agent/Local) + url + version + commit_hash
  agents: Vec<String>,           // 已部署的 Agent 列表
  tags: Vec<String>,
  pack: Option<String>,          // 所属套装（来自同一仓库的扩展自动分组）
  permissions: Vec<Permission>,  // 五维权限
  enabled: bool,
  trust_score: Option<u8>,       // 0-100，安全审计结果
  scope: ConfigScope,            // Global | Project{name, path}

  // === 类型专属字段（Option 包装，仅对应类型填充）===
  cli_meta: Option<CliMeta>,
  install_meta: Option<InstallMeta>,
}
```

### 4.2 五维权限模型

```rust
pub enum Permission {
    FileSystem { paths: Vec<String> },
    Network   { domains: Vec<String> },
    Shell     { commands: Vec<String> },
    Database  { engines: Vec<String> },
    Env       { keys: Vec<String> },
}

// 权限合并（去重）
pub fn merge_permissions(target: &mut Vec<Permission>, source: &[Permission])
```

### 4.3 安全审计模型

```rust
pub struct AuditResult {
    pub extension_id: String,
    pub findings: Vec<AuditFinding>,
    pub trust_score: u8,
    pub audited_at: DateTime<Utc>,
}

pub struct AuditFinding {
    pub rule_id: String,
    pub severity: Severity,    // Low(3分) / Medium(8分) / High(15分) / Critical(25分)
    pub message: String,
    pub location: String,      // 精确到文件行号
}

pub enum TrustTier {
    Safe(80-100), LowRisk(60-79), NeedsReview(0-59)
}
```

### 4.4 对 aweskill 的启发

| 启发点 | 说明 | 优先级 |
|---|---|---|
| **升级 Extension 模型** | 当前 aweskill 的 skill 数据结构较简单，建议升级为泛型模型，kind 字段区分类型，类型专属数据用 Option 包装 | 🔴 高 |
| **五维权限声明** | 在 SKILL.md 或 manifest 中引入权限声明规范，用户安装前可见 | 🔴 高 |
| **权限合并去重** | 同一扩展部署到多个 Agent 时，权限需合并去重 | 🟡 中 |
| **安全审计引擎** | 18 条静态分析规则 + 信任评分，`aweskill audit <skill>` | 🔴 高 |

---

## 五、Adapter 模式：跨 Agent 适配

### 5.1 Trait 设计

```rust
pub trait AgentAdapter: Send + Sync {
    fn name(&self) -> &str;
    fn base_dir(&self) -> PathBuf;
    fn detect(&self) -> bool;
    fn skill_dirs(&self) -> Vec<PathBuf>;
    fn mcp_config_path(&self) -> PathBuf;
    fn hook_config_path(&self) -> PathBuf;
    fn plugin_dirs(&self) -> Vec<PathBuf>;
    fn plugin_config_path(&self) -> PathBuf;

    // 格式声明
    fn hook_format(&self) -> HookFormat { HookFormat::ClaudeLike }
    fn mcp_format(&self) -> McpFormat { McpFormat::McpServers }

    // 特殊处理
    fn needs_path_injection(&self) -> bool { false }
    fn translate_hook_event(&self, event: &str) -> Option<String> { Some(event.to_string()) }

    // 全局配置发现（Agent 面板用）
    fn global_rules_files(&self) -> Vec<PathBuf> { vec![] }
    fn global_memory_files(&self) -> Vec<PathBuf> { vec![] }
    fn global_settings_files(&self) -> Vec<PathBuf> { vec![] }
    fn global_subagent_files(&self) -> Vec<PathBuf> { vec![] }
    fn global_workflow_files(&self) -> Vec<PathBuf> { vec![] }

    // 项目级配置发现
    fn project_rules_patterns(&self) -> Vec<String> { vec![] }
    fn project_memory_patterns(&self) -> Vec<String> { vec![] }
    fn project_settings_patterns(&self) -> Vec<String> { vec![] }
    fn project_subagent_patterns(&self) -> Vec<String> { vec![] }
    fn project_ignore_patterns(&self) -> Vec<String> { vec![] }
    fn project_workflow_patterns(&self) -> Vec<String> { vec![] }

    // 项目级扩展扫描
    fn project_markers(&self) -> Vec<ProjectMarker> { vec![] }
    fn project_skill_dirs(&self) -> Vec<String> { vec![] }
    fn project_skill_read_dirs(&self) -> Vec<String> { vec![] }
    fn project_mcp_config_relpath(&self) -> Option<String> { None }
    fn project_hook_config_relpath(&self) -> Option<String> { None }
    fn project_plugin_dirs(&self) -> Vec<String> { vec![] }

    // 作用域解析（全局 vs 项目）
    fn mcp_config_path_for(&self, scope: &ConfigScope) -> Option<PathBuf>
    fn hook_config_path_for(&self, scope: &ConfigScope) -> Option<PathBuf>
    fn skill_dir_for(&self, scope: &ConfigScope) -> Option<PathBuf>
}
```

**30+ 个方法，大部分有合理的默认实现**，新增 Agent 只需 override 非默认的部分。

### 5.2 项目标记（ProjectMarker）

```rust
pub enum ProjectMarker {
    Dir(&'static str),   // 如 ".claude"、".opencode"
    File(&'static str),  // 如 ".mcp.json"、"opencode.json"
}
```

每个 Adapter 声明自己的 marker，项目发现时只要 **任意一个 marker 匹配** 就认为该项目属于该 Agent。

### 5.3 对 aweskill 的启发

| 启发点 | 说明 | 优先级 |
|---|---|---|
| **引入 Adapter trait** | 当前 47 个 Agent 的配置映射表会随功能增长而膨胀，用 trait 解耦每个 Agent 的适配逻辑 | 🔴 高 |
| **默认实现 + override** | 大部分方法返回默认值（空 vec / ClaudeLike 格式），只有差异点需要 override | 🟡 中 |
| **项目标记机制** | 用 Dir/File marker 自动发现项目归属，而非硬编码路径列表 | 🟡 中 |

---

## 六、配置作用域（ConfigScope）

```rust
pub enum ConfigScope {
    Global,
    Project { name: String, path: String },
}

// scope_key() 提供稳定标识（Project 只依赖 path，不依赖 name）
pub fn scope_key(&self) -> String
```

每个扩展、每个配置文件都绑定到一个 scope：
- **全局技能** vs **项目技能** 独立管理
- Kit 安装时选择目标项目
- 审计时按 scope 过滤

### 对 aweskill 的启发

| 启发点 | 说明 | 优先级 |
|---|---|---|
| **项目级作用域** | 当前 aweskill 是全局 store + 投射到各 agent，可引入 `--project` 参数实现项目隔离 | 🟡 中 |
| **scope_key 稳定性** | Project scope 的 key 只依赖 path，不依赖 name，改名不影响追踪 | 🟢 低 |

---

## 七、来源追踪（SourceOrigin）

```rust
pub enum SourceOrigin {
    Git,      // git clone
    Registry, // 从 skills.sh / Smithery 安装
    Agent,    // 从 Agent 原生目录扫描发现
    Local,    // 本地目录
}

pub struct Source {
    pub origin: SourceOrigin,
    pub url: Option<String>,
    pub version: Option<String>,
    pub commit_hash: Option<String>,
}
```

**关键价值**：
- Kit 安装的扩展与市场来源在扩展列表中 **合并显示**，始终知道出处
- 来源追踪让 `aweskill update` 能精准判断哪些需要更新（Registry/Git 来源可检查远程，Agent/Local 来源不可）

---

## 八、Kit 系统

### 8.1 数据模型

```
Kit {
  id, name, description, zip_path, created_at, updated_at
}

KitAsset {
  kit_id, extension_id, asset_name, position
}

KitConfigFile {
  kit_id, agent, category, source_path, source_file_name, position
}

SyncRecord {
  id, kit_id, project_path, agent_name, written_paths[], synced_at
}
```

### 8.2 关键设计

- Kit 打包内容：skills + MCP servers + rules + memory 文件
- 安装时选择目标 Agent，HarnessKit 自动写入正确位置
- SQLite 追踪每个 Kit 部署到了哪些项目，`Kit remove` 精准清理
- 导出为 `.hk-kit.zip`，导入一键完成

### 8.3 对 aweskill 的启发

| 启发点 | 说明 | 优先级 |
|---|---|---|
| **bundle → Kit 升级** | 当前 aweskill bundle 只打包 skills，升级为 Kit 可打包 rules + memory + MCP | 🟡 中 |
| **部署追踪** | SQLite 记录每个 Kit 的部署位置，清理时精准删除 | 🟡 中 |
| **格式规范** | `.hk-kit.zip` 包含 `kit.json` 清单，可设计 `aweskill-kit.zip` 标准 | 🟡 中 |

---

## 九、原位管理（In-Place Management）

| 操作 | HarnessKit 做法 | aweskill 做法 |
|---|---|---|
| 部署技能 | 直接写入 Agent 原生目录 | symlink 投射 |
| 启用/禁用 | 文件重命名（`skill-name/` → `_disabled/skill-name/`） | 类似 |
| 卸载 | 删除写入的文件，其他文件不动 | 删除 symlink |
| 锁死风险 | 无（直接操作原生目录） | 无（symlink 不复制内容） |

**共同点**：都不复制技能内容到中央仓库，中央 store 只存源文件。

---

## 十、优先级路线图

### 🔴 高优先级（3 个月内）

| # | 任务 | 参考文件 | 说明 |
|---|---|---|---|
| 1 | **升级 Extension 模型** | `models.rs` §Extension | 泛型模型 + kind 区分 + Option 专属字段 |
| 2 | **引入五维权限模型** | `models.rs` §Permission | FileSystem/Network/Shell/Database/Env |
| 3 | **安全审计引擎** | `scanner.rs` | 18 条规则 + 信任评分 + 精确到行号 |
| 4 | **引入 Adapter trait** | `adapter/mod.rs` | 解耦 47 个 Agent 的适配逻辑 |

### 🟡 中优先级（3-6 个月）

| # | 任务 | 参考文件 | 说明 |
|---|---|---|---|
| 5 | **MCP 市场集成** | `marketplace.rs` | Smithery API + 跨格式转换 |
| 6 | **项目级作用域** | `store.rs` §ConfigScope | `--project` 参数 + 项目隔离 |
| 7 | **Kit 升级** | `kits/` | bundle → Kit，打包 rules+memory |
| 8 | **来源追踪** | `models.rs` §Source | Git/Registry/Agent/Local 四来源 |

### 🟢 低优先级（6 个月+）

| # | 任务 | 参考文件 | 说明 |
|---|---|---|---|
| 9 | **Hook 事件翻译** | `adapter/hook_events.rs` | 跨 Agent 事件名称映射 |
| 10 | **GUI Agent PATH 注入** | `adapter/mod.rs` §needs_path_injection | 检测并处理环境隔离 |
| 11 | **VS Code 插件发现** | `adapter/copilot.rs` / `windsurf.rs` | 读取 state.vscdb |

---

## 十一、关键代码引用

| 模块 | 路径 | 核心内容 |
|---|---|---|
| 统一模型 | `crates/hk-core/src/models.rs` | Extension / Permission / Audit / ConfigScope / CliMeta |
| Adapter trait | `crates/hk-core/src/adapter/mod.rs` | AgentAdapter trait + 8 个实现 + 测试 |
| 部署引擎 | `crates/hk-core/src/deployer.rs` | 跨 Agent 部署 + 格式转换 + 递归复制 |
| 市场集成 | `crates/hk-core/src/marketplace.rs` | skills.sh + Smithery API + 缓存 |
| 安全审计 | `crates/hk-core/src/scanner.rs` | 18 条规则 + 信任评分 |
| 持久化 | `crates/hk-core/src/store.rs` | SQLite schema + Kit 追踪 + 扩展注册 |
| 服务层 | `crates/hk-core/src/service.rs` | 业务逻辑编排 |
| 清理/消毒 | `crates/hk-core/src/sanitize.rs` | 安装前文件消毒 |

---

## 十二、总结

HarnessKit 的核心价值不在于"管理更多类型"，而在于它用 **Adapter 模式 + 泛型扩展模型 + 五维权限系统** 构建了一个可扩展的 Agent 扩展管理框架。

**aweskill 的差异化优势**：
- 47 个 Agent 的覆盖（HarnessKit 仅 8 个）
- CLI-first 定位，轻量级
- npm 分发，生态友好

**aweskill 的进化方向**：
- 从 "Skill 管理器" → "Agent 扩展平台"
- 核心抓手：安全审计（差异化最强） + Kit 升级（复用性最强） + Adapter 模式（架构最健康）
