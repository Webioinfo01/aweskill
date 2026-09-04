<div align="center">
  <img src="./logo.png" alt="aweskill" width="760">
  <h1>aweskill：面向 AI Agents 的 Skill 包管理器 <a href="https://github.com/Webioinfo01/aweskill"><img src="https://raw.githubusercontent.com/Webioinfo01/aweskill/main/logo/aweskill-badge.svg" alt="aweskill"></a></h1>
  <p><strong>以 CLI 为核心的 Skill 包管理器，AI agent 也能自己调用和维护。</strong></p>
  <p>在 Codex、Claude Code、Cursor、Gemini CLI、Qwen Code、Windsurf 等工具之间安装、更新、打包并投影 skills。</p>
  <p><strong>一套 CLI，在 Ubuntu、macOS 和 Windows 上命令完全一致。</strong></p>
  <p>
    <a href="./README.md">English</a> ·
    <strong>简体中文</strong> ·
    <a href="https://aweskill.webioinfo.top/">官网</a> ·
    <a href="https://we.webioinfo.top/">Webioinfo</a>
  </p>
  <p>
    <a href="https://ko-fi.com/mugpeng"><img src="https://img.shields.io/badge/Ko--fi-Buy%20me%20a%20coffee-FF5E5B?style=flat-square&logo=ko-fi&logoColor=white" alt="Ko-fi"></a>
  </p>
  <p>
    <a href="https://github.com/Webioinfo01/aweskill/releases"><img src="https://img.shields.io/badge/version-0.4.2-7C3AED?style=flat-square" alt="Version"></a>
    <a href="https://github.com/Webioinfo01/aweskill"><img src="https://img.shields.io/badge/node-%E2%89%A520-0EA5E9?style=flat-square" alt="Node"></a>
    <a href="https://github.com/Webioinfo01/aweskill/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MPL--2.0-22C55E?style=flat-square" alt="License"></a>
    <a href="https://aweskill.webioinfo.top/"><img src="https://img.shields.io/badge/website-aweskill.webioinfo.top-7C3AED?style=flat-square" alt="Website"></a>
  </p>
  <p>
    <img src="https://img.shields.io/badge/status-beta-c96a3d?style=flat-square" alt="Status">
    <img src="https://img.shields.io/badge/agents-47_supported-0ea5a4?style=flat-square" alt="Supported agents">
    <img src="https://img.shields.io/badge/projection-symlink-1f2328?style=flat-square" alt="Projection mode">
    <img src="https://img.shields.io/badge/platform-ubuntu%20%7C%20macOS%20%7C%20windows-334155?style=flat-square" alt="Platform">
    <img src="https://img.shields.io/npm/dt/aweskill?style=flat-square" alt="npm downloads">
    <img src="https://img.shields.io/github/stars/Webioinfo01/aweskill?style=flat-square" alt="GitHub stars">
    <img src="https://img.shields.io/badge/platform-local%20CLI-334155?style=flat-square" alt="Local CLI">
  </p>
</div>


> 像 npm 管理包一样管理本地 AI Agent Skills：一次安装，多 Agent 复用。

`aweskill` 是一个本地 Skill 包管理器，用来在 Codex、Claude Code、Cursor、Gemini CLI、Qwen Code、Windsurf、OpenCode 等 AI agents 之间安装、更新、组织和复用 skills。

它可以帮助开发者查找、安装、更新、打包、查重、备份并复用 skills。

你不需要再把同一套 `SKILL.md` 文件夹手动复制到每个工具里。`aweskill` 会把 `~/.aweskill/skills/` 作为唯一中央仓库，再通过 `symlink`、junction 或受管 `copy`，把选中的 skill 投影到每个 agent 需要的目录。

> **项目网站：**[aweskill.webioinfo.top](https://aweskill.webioinfo.top/) — 包含安装指南和 Agent 兼容性概览。

## 快速开始

`aweskill` 的推荐路径很简单：CLI 只安装一次，先把内置管理 skills 装给 agent，之后就让 agent 用自然语言来日常操作 aweskill。

### 1. 安装 aweskill

如果你正在 Codex、Claude Code、Cursor 等编码 agent 里工作，直接把安装整个交给它——agent 会自动完成 CLI 安装、store 初始化和内置 skills 投影。装完调用 skills（Claude Code 输入 `/`，Codex 输入 `$`）确认新 skills 已出现；没出现的话重启 agent 即可。

可以直接对 agent 说：

```text
读取 https://github.com/Webioinfo01/aweskill/blob/main/README.ai.md 并按照说明为当前 agent 安装 aweskill。
```

不在编码 agent 里、想自己动手的话，用 npm 全局安装（需要 [Node.js](https://nodejs.org/) 20 及以上），再初始化中央仓库，命令收在下面的折叠块里。

包主页：[npmjs.com/package/aweskill](https://www.npmjs.com/package/aweskill)

<details>
<summary>安装与引导的 CLI 命令</summary>

```bash
# 安装 aweskill 并初始化中央仓库
npm install -g aweskill
aweskill store init

# 看一下 aweskill store 在哪里
aweskill store where --verbose
```

</details>

<details>
<summary>其他安装方式：仓库直装、GitHub dev 分支、本地开发、打包产物</summary>

```bash
# 直接从当前仓库安装
npm install
npm run build
npm install -g .

# 从 GitHub 安装开发版（dev 分支包含开发中的改动，可能不稳定）
npm install -g Webioinfo01/aweskill#dev

# 本地开发模式
npm install
npm link
aweskill --help

# 用打包产物安装
npm install
npm pack
npm install -g ./aweskill-<version>.tgz
```

</details>

### 2. 给 agent 装上管理能力

刚手动装好 aweskill 的话，还差一步：把三个内置管理 skills 投影给当前 agent——`aweskill` 管日常操作、`aweskill-doctor` 管诊断修复、`aweskill-creator` 管创作（各自覆盖范围见[内置 Agent Skills](#内置-agent-skills)）。让 AI agent 安装的，这一步会自动完成。

可以直接对 agent 说：

```text
查看支持的 agent id，然后把 aweskill、aweskill-doctor、aweskill-creator 投影到 codex 的全局 skills 目录。
```

<details>
<summary>等价的 CLI 命令</summary>

```bash
# 查看支持的 agent id
aweskill agent supported

# 把内置管理 skills 投影给当前 agent
aweskill agent add skill aweskill,aweskill-doctor,aweskill-creator --global --agent codex

# 确认当前投影状态
aweskill agent list --global --agent codex
```

</details>

把 `codex` 换成你正在使用的 agent id。

### 3. 开始用自然语言驱动 aweskill

到此为止，日常使用不需要记命令：把意图直接告诉 agent，它会进入对应的 aweskill 工作流。下面是六个常见场景，每个场景先用自然语言说清意图和结果；想手动执行 CLI 或核对具体行为时，再展开等价的命令。

#### 收编已有的 skills

如果你已经在 Claude Code、Codex 等工具里积累了一些 skills，可以让 aweskill 扫描这些目录，把未托管的 skills 收进中央仓库，作为之后的唯一事实来源。扫描默认只发现、不改动，确认结果后再导入；导入后原目录默认替换为指向中央仓库的软链接，也可以选择保留原始文件。

可以直接对 agent 说：

```text
把我 Claude Code 里已有的 skills 收进 aweskill 统一管理。
```

<details>
<summary>等价的 CLI 命令</summary>

```bash
# 扫描 agent skill 目录（只发现，不导入）
aweskill store scan

# 扫描并导入所有发现的 skill
aweskill store scan --import

# 扫描并导入，显示详细输出
aweskill store scan --import --verbose

# 扫描并导入，覆盖已有的 skill
aweskill store scan --import --override

# 扫描并导入，保留原始文件（不替换为软链接）
aweskill store scan --import --keep-source

# 只扫描特定 agent
aweskill store scan --import --agent claude
```

</details>

#### 查找、安装并保持更新

想找新 skill 时，让 agent 同时搜索 skills.sh 和 sciskillhub.org，也可以只搜本地中央仓库：远程结果带可直接安装的 source，本地结果直接给出 skill 路径。安装时 aweskill 会记录来源，之后一条命令就能检查或刷新更新，而你在中央仓库里的本地修改始终被保护。安装或更新前，可以用 `store show` 先看一眼 skill 内容。

可以直接对 agent 说：

```text
找一个蛋白质组学相关的 skill 装上；再检查已装的 skill 有没有来源更新。
```

<details>
<summary>等价的 CLI 命令</summary>

```bash
# 同时搜索 skills.sh 和 sciskillhub.org
aweskill find protein

# 只搜索一个 provider
aweskill find protein --provider sciskill

# 搜索本地中央仓库并查看命中的 skill 路径
aweskill find review --local

# 查看一个本地 skill 的摘要
aweskill store show paper-review

# 输出完整 markdown 或只输出路径
aweskill store show paper-review --raw
aweskill store show paper-review --path

# 安装一个从 skills.sh 发现到的 GitHub 风格 source
aweskill store install owner/repo

# 从 sciskillhub.org 安装一个科研 skill
aweskill store install sciskill:open-source/research/lifesciences-proteomics

# 只检查已追踪安装是否有更新，不改文件
aweskill store update --check

# 按已记录来源刷新一个已追踪 skill
aweskill store update lifesciences-proteomics
```

</details>

#### 制作一个新 skill

制作 skill 和安装 skill 走的是同一套生命周期：脚手架进中央仓库、迭代、校验、投影，满意后再发布。

可以直接对 agent 说：

```text
帮我做一个论文评审的 skill：搭好脚手架、写好触发描述，然后投影给 Codex。
```

<details>
<summary>等价的 CLI 命令</summary>

```bash
# 写新 skill 之前，先查一下是否已有类似 skill
aweskill find review
aweskill find review --local

# 新建一个带合法 SKILL.md frontmatter 和 references/ 的 skill 脚手架
aweskill store create paper-review --description "Use when reviewing academic papers, checking citations, or summarizing manuscripts. 中文触发词：论文评审、审稿、文献总结。"

# 起草内容：编辑生成的 SKILL.md 正文（位于
# ~/.aweskill/skills/paper-review/SKILL.md），按需在 references/ 下加文档

# 校验 frontmatter（默认 dry-run，不会改文件）
aweskill doctor fix-skills --skill paper-review

# 投影并迭代；投影是 symlink，中央仓库里的修改即时生效
aweskill agent add skill paper-review --global --agent codex
```

</details>

几点说明：

- 投影好内置 `aweskill-creator` skill 后，直接对 agent 说"帮我做一个 xx skill"即可——它会访谈你、查重、脚手架、起草、用真实 prompt 测试、校验并投影
- 仓库专用、要随 git 共享的 skill，用 `aweskill store create my-skill --dir <repo>/.agents/skills` 直接建在仓库里，之后各机器用 `aweskill store install <path>` 收进中央仓库
- 要发布时，把成品目录拷进独立 git 仓库，别人就能用 `aweskill install owner/repo` 安装
- 创建的 skill 不做来源追踪（同 `scan --import`），`store update` 永远不会覆盖你的修改

#### 把常用 skills 组成 bundle

当同一批 skills 总是一起用——比如一个项目的技术栈、一个团队的标准工作流——可以把它们组成 bundle，之后整组投影、整组移除，不必逐个点名。bundle 保存在 `~/.aweskill/bundles/*.yaml`，也可以放进 git 与团队共享。

可以直接对 agent 说：

```text
新建一个 backend bundle，把 api-design 和 db-schema 加进去。
```

<details>
<summary>等价的 CLI 命令</summary>

```bash
# 创建一个可复用 bundle
aweskill bundle create backend

# 给 bundle 添加多个 skill
aweskill bundle add backend api-design,db-schema

# 查看 bundle 内容
aweskill bundle show backend
```

</details>

#### 把 skill 投影到目标 agent

中央仓库里的 skill 只有投影到 agent 的技能目录才会生效——投影状态就是启用状态。可以按单个 skill、多个 skill 或整个 bundle，投影到指定 agent 或所有检测到的 agent；投影默认是 symlink，中央仓库里的修改即时生效。想停用某个投影用 `agent remove`；哪天不想再让 aweskill 托管，`agent recover` 会把软链接还原为完整目录。

可以直接对 agent 说：

```text
把 backend bundle 投影到 Codex 和 Cursor。
```

<details>
<summary>等价的 CLI 命令</summary>

```bash
# 把一个 skill 投影到检测到的全局 agent 目录
aweskill agent add skill biopython

# 把多个 skill 投影到指定 agent 的全局目录
aweskill agent add skill biopython,scanpy --global --agent codex

# 把整个 bundle 投影到所有检测到的全局 agent
aweskill agent add bundle backend --global --agent all

# 把托管 symlink 恢复为完整目录
aweskill agent recover --global --agent codex
```

</details>

#### 体检、修复与备份

用久了本地状态难免漂移：投影断链、条目重复、可疑文件、frontmatter 损坏。这些交给 doctor 系列命令——它们默认都是 dry run，加 `--apply` 才会真正修改，改写或移动前还可以先备份原文件。中央仓库整体随时可以用 `store backup` 归档、用 `store restore` 恢复。

可以直接对 agent 说：

```text
先检查 Codex 下有没有 broken 或 duplicate skill，不要立即修改。
```

<details>
<summary>等价的 CLI 命令</summary>

```bash
# 查看中央仓库位置和目录统计
aweskill store where --verbose

# 备份当前 store
aweskill store backup

# 恢复备份归档
aweskill store restore ~/Downloads/aweskill-backup.tar.gz

# 查看 agent 条目分类
aweskill agent list

# 清理中央仓库里的可疑条目
aweskill doctor clean

# 把中央仓库里的重复 skill 移到 dup_skills
aweskill doctor dedup --apply

# 在移动到 dup_skills 前先备份重复 skill
aweskill doctor dedup --apply --backup

# 在改写前先备份异常的 SKILL.md
aweskill doctor fix-skills --apply --backup

# 先看某个 agent 下有哪些可修项
aweskill doctor sync --global --agent codex

# 修复某个 agent 下的 broken / duplicate / matched 条目
aweskill doctor sync --global --agent codex --apply

# 只有显式指定时才删除 suspicious agent 条目
aweskill doctor sync --global --agent codex --apply --remove-suspicious
```

`aweskill doctor fix-skills` 会报告两类结果：

- 真修复项：`missing-closing-delimiter` 补上 frontmatter 缺失的结束分隔线，`invalid-yaml` 用可恢复字段和正文重建损坏 frontmatter，`added-frontmatter` 在文件直接从正文开始时补最小 frontmatter，`normalized-name` 恢复可用的规范 skill 名称，`normalized-description` 用正文第一句恢复可用描述。
- 信息项：`normalized-required-permissions` 报告可规范化为标准列表形式的权限，`preserved-unknown-fields` 报告核心字段之外的 frontmatter 字段，`removed-empty-fields` 报告可删除的空数组、空对象或空标量值。

详细说明与修复前后示例见 [docs/fix-skills-categories.md](docs/fix-skills-categories.md)。

</details>

## 为你的项目添加 aweskill badge

如果你的项目使用了 aweskill 并且想要表示支持，可以在 README 中添加以下 badge：

| Badge | 用途 |
|-------|------|
| `aweskill-badge.svg` | aweskill 自身使用 |
| `aweskill-badge2.svg` | 供 companion 项目使用 |

以 `aweskill-badge2.svg` 为例：

```html
<a href="https://github.com/Webioinfo01/aweskill">
  <img src="https://raw.githubusercontent.com/Webioinfo01/aweskill/main/logo/aweskill-badge2.svg" alt="aweskill companion">
</a>
```

放在 README 标题中，例如：

```markdown
# My Project <a href="https://github.com/Webioinfo01/aweskill"><img src="https://raw.githubusercontent.com/Webioinfo01/aweskill/main/logo/aweskill-badge2.svg" alt="aweskill companion"></a>
```

## FAQ

### 为什么用 aweskill，它适合谁？

`aweskill` 适合这些开发者和团队：同时使用多个 AI agent，维护可复用的 `SKILL.md`、agent 指令或工作流，并且希望用一个本地唯一事实来源来管理 skills，而不是把同一批目录重复复制到各个工具里。它尤其适合这样一种现实场景：问题不只是“怎么分发”，还包括长期使用后出现的 broken projections、重复 skills、suspicious entries、失效链接，以及损坏的 `SKILL.md` frontmatter 该怎么诊断和修复。

- **一个中央仓库**：所有本地 skills 统一放在 `~/.aweskill/skills/`
- **find / install / update 闭环**：可以从 [skills.sh](https://skills.sh/)、[sciskillhub.org](https://sciskillhub.org/)、GitHub 风格 source 和本地路径发现、安装并追踪更新 skills
- **多 agent 投影**：同时服务 Codex、Claude Code、Cursor、Gemini CLI、Qwen Code、Windsurf、OpenCode 等工具
- **面向真实本地混乱状态的 doctor 工作流**：处理 broken projections、重复条目、可疑文件、frontmatter 异常，以及 agent 目录和中央仓库之间的漂移
- **bundle 组织方式**：按项目、团队、工作流或 agent 组织可复用 skill 集合
- **托管启用/停用模型**：通过按需投影实现插拔，而不是手动把目录复制到每个工具里
- **提供可被 agent 调用的管理、修复与创作 skills**：让 AI agent 能根据自然语言请求运行 `aweskill`、`aweskill-doctor` 和 `aweskill-creator` 工作流
- **本地维护与恢复能力**：备份、恢复、查重、清理、同步修复都在同一个本地 CLI 流程里完成

<details>
<summary>更多 FAQ</summary>

### aweskill 把 skills 存在哪里？

`aweskill` 把托管的 skills 存在 `~/.aweskill/skills/`。

### aweskill 能在 Claude Code 和 Codex 之间共享 skills 吗？

可以。`aweskill` 会维护一份中央 skill 副本，再把它投影到每个 agent 需要的 skill 目录。

### 投影的 skill 在 git worktree 里能正常用吗？

默认情况下 `aweskill` 写的是**相对** symlink，它只能在创建时所处的目录深度上解析。如果你把投影的 skill 提交进 git，再 checkout 到嵌套更深的 git worktree 里，相对目标就可能悬空（dangling）。执行 `aweskill agent add … --absolute`（或设置 `AWESKILL_ABSOLUTE_SYMLINKS=1` 让它成为默认），即可写入**绝对** symlink 目标，它在任意深度都能解析，因此同一份提交进 git 的投影在主 checkout 和嵌套 worktree 里都能生效。注意代价：绝对目标会写死当前机器的 `~/.aweskill` 路径，因此在 home 目录不同的另一台机器或 CI 上会悬空——只在同一台机器上、同一份 checkout 被复用到不同深度（如嵌套 git worktree）时才用它。

### aweskill 支持 Cursor 和 Gemini CLI 吗？

支持。`aweskill` 支持 Cursor、Gemini CLI 以及许多其他 AI agents 的 skill 投影。

### aweskill 是 local-first 吗？

是。`aweskill` 在你的本机管理 skills，不需要托管服务。

### AI agent 能直接调用 aweskill 吗？

可以。`aweskill` 内置了 `aweskill`、`aweskill-doctor` 和 `aweskill-creator` 管理 skills；安装或投影这些 skills 后，AI agent 可以根据自然语言请求，通过运行 aweskill 命令来搜索、安装、更新、打包、修复、去重、清理、同步、投影或制作 skills。

### 当本地 skill 状态变乱时，aweskill 的差异点是什么？

`aweskill` 不只负责 install 和 project，也提供本地状态漂移后的修复路径：

- **`doctor sync`**：检查或修复 broken、duplicate、matched、new、suspicious 等 agent 条目
- **`doctor clean`**：在受管区域里找出不规范的非 store 文件，避免越积越多
- **`doctor dedup`**：帮助处理重复 skill，不要求你直接盲删
- **`doctor fix-skills`**：修复损坏的 `SKILL.md` frontmatter，并可先备份原文件
- **`agent list` 作为 dry-run 视图**：先看修复状态，再决定是否应用修改

### aweskill 怎么处理 find、install 和 update？

`aweskill` 把本地 orchestration 和带来源追踪的 skill 生命周期放在一起：

- **Find**：用一条命令同时搜索 [skills.sh](https://skills.sh/)、[sciskillhub.org](https://sciskillhub.org/) 或本地中央仓库
- **Install**：从 GitHub 风格 source、本地路径或 `sciskill:<skill-id>` 标识安装到中央仓库
- **Update**：按记录的来源刷新 tracked install，同时保护中央仓库里的本地修改
- **Project**：把同一批托管 skill 投影到 Codex、Claude Code、Cursor、Gemini CLI 等 agent

### `scan` 和 `install` 有什么区别？

两个命令都会把 skill 加入中央仓库，但用途不同：

| | `store scan --import` | `store install` |
|---|---|---|
| **主要用途** | 从 agent 目录批量发现 | 从 GitHub、本地路径或 sciskill 安装单个 skill |
| **来源追踪** | 无（一次性导入） | 有（自动记录，支持 `update`） |
| **核心参数** | `--override`、`--verbose`、`--scope`、`--agent` | `--skill`、`--all`、`--ref`、`--as` |
| **典型命令** | `aweskill store scan --import` | `aweskill store install owner/repo` |

初始设置时用 `scan --import` — 从已有 agent 目录发现并导入 skill。后续管理用 `install` — 安装单个 skill 并记录来源以便更新。

</details>

## 对比

| 能力维度 | [`sciskill`](https://github.com/sciskillhub/sciskill) | [`Skills Manager`](https://github.com/jiweiyeah/Skills-Manager) | [`skillfish`](https://github.com/knoxgraeme/skillfish) | [`vercel-labs/skills`](https://github.com/vercel-labs/skills) | [`skills-manage`](https://github.com/iamzhihuix/skills-manage) | aweskill 如何实现 |
|---|---|---|---|---|---|---|
| 单一中央本地 skill 仓库 | ✗ | ✓ | ✗ | ✗ | ✓ | 把所有托管 skills 放在 `~/.aweskill/skills/`，作为唯一事实来源 |
| registry / catalog 发现能力 | ✓ | ✗ | ✓ | ✓ | ✓ | 用 `aweskill find` 搜索 [skills.sh](https://skills.sh/)、[sciskillhub.org](https://sciskillhub.org/) 或本地中央仓库 |
| GitHub 风格仓库导入/安装 | ✗ | ✗ | ✓ | ✓ | ✓ | 从 GitHub 风格 source 和 `sciskill:<skill-id>` 导入到中央仓库 |
| 本地路径导入/安装 | ✗ | ✗ | ✗ | ✓ | ✗ | 从本地路径导入到中央仓库 |
| 按记录来源追踪更新 | ✗ | ✗ | ✓ | ✓ | ✗ | 记录 source 元数据，再用 `aweskill update` 刷新，同时保护中央仓库里的本地修改 |
| 多 agent 按需插拔投影 | ✗ | ✓ | ✓ | ✓ | ✓ | 通过 `symlink`、junction 或受管 `copy`，把中央仓库里的 skills 投影到各 agent 目录 |
| bundle / manifest / collection 分组 | ✗ | ✗ | ✓ | ✗ | ✓ | 用 bundle 按项目、团队、工作流或 agent 组织可复用 skill 集合 |
| 可被 agent 直接调用的管理 skills | ✗ | ✗ | ✗ | ✗ | ✗ | 内置 `aweskill`、`aweskill-doctor` 和 `aweskill-creator` skills，让 AI agents 可根据自然语言请求运行 aweskill 工作流 |
| 本地维护与恢复能力 | ✗ | ✗ | ✗ | ✗ | ✗ | CLI 内置 backup、restore、dedup、clean、sync、fix-skills 和 recover 工作流 |

这里的 `sciskill` 指的是 `sciskillhub` 下的公开 registry 元数据仓库，不是本地 skill 管理 CLI。

当你的核心问题不只是”装一个 skill”，而是”长期维护一套可复用、可更新、可恢复、可跨 agent 复用，而且出问题后还能诊断和修复的本地 skills 资产”时，`aweskill` 更合适。

## 内置 Agent Skills

`aweskill` 最适合的用法，是先让你的编码 agent 能直接操作它。

建议先把内置的 `aweskill`、`aweskill-doctor` 和 `aweskill-creator` skills 投影给当前 agent：

- `aweskill` 负责日常操作，例如 `find`、`install`、`update`、`bundle` 和 `agent add`
- `aweskill-doctor` 负责修复优先的工作流，例如 `doctor sync`、`doctor clean`、`doctor dedup`、`doctor fix-skills` 和 `agent recover`
- `aweskill-creator` 负责创作工作流：用 `store create` 新建 skill 脚手架、起草内容、测试、校验并投影
- 如果不先投影这些 skill，agent 当然也能直接跑 shell 命令，但它不会自带这些面向 aweskill 的操作指引，也就不容易稳定地从自然语言请求进入合适的工作流

<details>
<summary>把内置 skills 安装进中央仓库</summary>

```bash
aweskill store install resources/skills/aweskill
aweskill store install resources/skills/aweskill-doctor
aweskill store install resources/skills/aweskill-creator
```

</details>

skill 目录结构与设计原则见 [docs/DESIGN.md](docs/DESIGN.md)。

## 核心模型

`aweskill` 会把 `~/.aweskill/skills/` 作为唯一技能中央仓库，用 bundle 组织可复用 skill 集合，再把选中的 skill 投影到各个 agent 的技能目录。投影后的文件系统状态本身就是启用状态。

## 支持范围

当前支持的 agent：

`adal`、`amp`、`antigravity`、`augment`、`bob`、`claude-code`、`cline`、`codebuddy`、`command-code`、`continue`、`codex`、`copilot`、`cortex`、`crush`、`cursor`、`deepagents`、`droid`、`firebender`、`gemini-cli`、`github-copilot`、`goose`、`iflow-cli`、`junie`、`kilo`、`kilo-code`、`kimi-cli`、`kiro-cli`、`kode`、`mcpjam`、`mistral-vibe`、`mux`、`neovate`、`openclaw`、`openclaude-ide`、`openhands`、`opencode`、`pi`、`pochi`、`qoder`、`qwen-code`、`replit`、`roo`、`trae`、`trae-cn`、`warp`、`windsurf`、`zencoder`

关键目录：

- 中央仓库：`~/.aweskill/skills/`
- 重复项暂存区：`~/.aweskill/dup_skills/`
- 备份根目录：`~/.aweskill/backup/`
- dedup 备份目录：`~/.aweskill/backup/dedup/`
- fix-skills 备份目录：`~/.aweskill/backup/fix_skills/`
- Bundle 文件：`~/.aweskill/bundles/*.yaml`
- 内置 skill：`resources/skills/aweskill/`、`resources/skills/aweskill-doctor/`

发现与安装来源：

- [skills.sh](https://skills.sh/) 现在作为社区 skill 发现源使用，可能返回可直接安装的 GitHub 风格 source，也可能返回只能跳转查看上游安装说明的 discover-only 条目
- [sciskillhub.org](https://sciskillhub.org/) 现在作为科研和技术类 skill registry 使用，提供可安装的 `sciskill:<skill-id>` source
- 本地中央仓库也可以作为 `local` provider 搜索，读取 `~/.aweskill/skills/*/SKILL.md`
- `aweskill find` 默认同时搜索 `skills.sh` 和 `sciskill`，按规范化后的名字合并结果；`--limit` 会先按 provider 分别生效，再做合并去重；用 `--local` 或 `--provider local` 可只搜索本地中央仓库
- `aweskill store install` 当前支持本地路径、GitHub source 和 `sciskill:<skill-id>` 标识

## 命令面

核心命令：`store init`、`store where`、`store scan`、`bundle create`、`agent add`、`doctor clean`

高频搜索和 tracked-source 流程也提供顶层命令：`aweskill find`、`aweskill install`、`aweskill update`。

<details>
<summary>全部命令</summary>

| 命令 | 说明 |
| --- | --- |
| `aweskill self-update [--dev] [--check]` | 更新 aweskill CLI 本身；默认从 npm 更新，`--dev` 从 GitHub dev 分支构建，`--check` 仅显示版本不更新 |
| `aweskill store init [--scan] [--verbose]` | 初始化 `~/.aweskill` 布局 |
| `aweskill store create <name> [--description <description>] [--dir <dir>]` | 新建一个 skill 脚手架，带合法的 `SKILL.md` frontmatter 和 `references/`，默认创建到中央仓库，也可用 `--dir` 指定目录做仓库内创作 |
| `aweskill store where [--verbose]` | 显示 `~/.aweskill` 位置，并汇总核心 store 目录 |
| `aweskill store backup [archive] [--skills-only]` | 归档中央仓库；默认同时包含 skills 和 bundles |
| `aweskill store restore <archive> [--override] [--skills-only]` | 从备份归档或已解包目录恢复 |
| `aweskill store scan [--global\|--project [dir]] [--agent <agent>] [--import] [--override] [--keep-source] [--verbose]` | 扫描支持的 agent skill 目录；加上 `--import` 会把发现的 skill 导入中央仓库 |
| `aweskill store find <query> [--provider <skills-sh\|sciskill\|local>] [--local] [--limit <n>] [--domain <domain>] [--stage <stage>]` | 默认搜索 `skills.sh` 和 `sciskill`，也可用 `--local` / `--provider local` 只搜索本地中央仓库；远程结果输出可安装 `source` 或 discover-only 提示，本地结果输出 skill 路径和 `store show` 提示 |
| `aweskill store install <source> [--list] [--skill <name>] [--all] [--ref <ref>] [--as <name>] [--override]` | 从本地路径、GitHub source 或 `sciskill:<skill-id>` 安装 skill 到中央仓库，并为后续 `store update` 建立追踪记录 |
| `aweskill store update [skill...] [--check] [--prune] [--source <source>] [--override] [--verbose]` | 从已记录的 source 检查或刷新 tracked skill，并把中央仓库中的副本当作受保护的本地状态；`--prune` 会清理本地已删除 skill 的追踪记录 |
| `aweskill store list [--verbose]` | 列出中央仓库中的 skill |
| `aweskill store show <skill> [--summary\|--raw\|--path]` | 默认输出中央仓库 skill 的摘要，也可以输出完整 `SKILL.md` 或只输出 `SKILL.md` 路径 |
| `aweskill store remove <skill> [--force]` | 从中央仓库删除一个 skill，并同步清理该 skill 的 tracked lock 记录 |
| `aweskill bundle list [--verbose]` | 列出 bundle |
| `aweskill bundle create <name>` | 创建 bundle |
| `aweskill bundle add <bundle> <skill>` | 向 bundle 增加一个或多个 skill |
| `aweskill bundle remove <bundle> <skill>` | 从 bundle 移除一个或多个 skill |
| `aweskill bundle show <name>` | 查看 bundle 内容 |
| `aweskill bundle template list [--verbose]` | 列出内置 bundle 模板 |
| `aweskill bundle template import <name>` | 把内置模板复制到本地仓库 |
| `aweskill agent supported` | 列出全部支持的 agent id，用 `✓` / `x` 标记 global 安装状态，并显示已检测到的 global skills 路径 |
| `aweskill agent add bundle\|skill ...` | 把托管 skill 投影到 agent 目录 |
| `aweskill agent remove bundle\|skill ... [--force]` | 删除托管投影 |
| `aweskill agent list [--global\|--project [dir]] [--agent <agent>] [--verbose]` | `doctor sync` 的只读 dry-run 视图：检查 `linked`、`broken`、`duplicate`、`matched`、`new`、`suspicious` 状态；省略 `--agent` 时，先输出当前 scope 检测到的 agent 集合，再输出分组结果 |
| `aweskill agent recover` | 把托管 symlink 恢复为完整目录 |
| `aweskill doctor sync [--apply] [--remove-suspicious] [--global\|--project [dir]] [--agent <agent>] [--verbose]` | 默认 dry run；加上 `--apply` 修复 broken 并重连 duplicate / matched，`--apply --remove-suspicious` 额外删除 suspicious；省略 `--agent` 时，先输出当前 scope 检测到的 agent 集合 |
| `aweskill doctor clean [--apply] [--skills-only] [--bundles-only] [--verbose]` | 按 `skills` / `bundles` 分组查找不规范的 store 条目，并可选清理 |
| `aweskill doctor dedup [--apply] [--backup] [--delete]` | 查找重复 skill，并可选移动或删除；`--backup` 会先复制到 `~/.aweskill/backup/dedup/` |
| `aweskill doctor fix-skills [--apply] [--backup] [--include-info] [--skill <skill>] [--verbose]` | 检查 `SKILL.md` frontmatter 异常；真修复项包括补结束分隔线、重建无效 YAML、补 frontmatter、规范 name 和 description；`--backup` 会在改写前先复制原文件到 `~/.aweskill/backup/fix_skills/`，`--include-info` 会附带不改写的信息项，`--apply` 只会改写真修复项 |

</details>

<details>
<summary>find 输出与 --domain / --stage 过滤细则</summary>

`aweskill find` 会优先输出 `aweskill store install` 能直接使用的 `source`。如果 provider 返回的是 `smithery.ai` 这类仅供发现的 source，结果仍会显示，但 `aweskill` 会明确标注它不支持直接安装，并提示你去对应的 `skills.sh` 页面查看上游安装说明。本地搜索结果不会输出安装命令，而是输出 skill 路径和 `aweskill store show <skill>` 提示。默认同时搜索两个远程 provider 时，`--limit` 按 provider 分别生效，再做合并去重。

`--domain` 和 `--stage` 只适用于 sciskill。若和 `--provider skills-sh` 一起传入，`aweskill` 现在会直接报错，而不是忽略过滤条件。对 sciskill 使用这两个参数时，传入值必须与对应枚举完全一致，包括空格和大小写；非法值也会直接报错，并列出允许值。

**`--domain` 可用值**

| 值 | 含义 |
| --- | --- |
| `Agricultural Sciences` | 农业科学 |
| `Chemical Sciences` | 化学科学 |
| `Computational Sciences` | 计算科学 |
| `General Research` | 通用研究 |
| `Life Sciences` | 生命科学 |
| `Mathematical and Statistical Sciences` | 数理统计 |
| `Medical and Health Sciences` | 医学健康 |
| `Physical Sciences` | 物理科学 |

**`--stage` 可用值**

| 值 | 含义 |
| --- | --- |
| `Study Design` | 研究设计 |
| `Data / Sample Acquisition` | 数据/样本采集 |
| `Data Processing` | 数据处理 |
| `Data Analysis and Modeling` | 分析建模 |
| `Validation and Interpretation` | 验证与解释 |
| `Visualization and Presentation` | 可视化展示 |
| `Writing and Publication` | 写作发表 |

</details>

## 贡献

如果你想参与开发，请看 [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)。

如果你想了解命令模型和文件系统设计约束，请看 [docs/DESIGN.md](docs/DESIGN.md)。

那里现在集中说明了：

- 开发流程与测试要求

`docs/DESIGN.md` 集中说明了：

- 设计取舍
- bundle 文件格式
- 投影模型
- 内置 skill 结构与设计原则

欢迎提交文档改进、测试补充和小而聚焦的功能改进。

如果你希望使用一个独立于本仓库、可直接分享给其他用户的技能归档集合，可以参考 [oh-my-skills](https://github.com/mugpeng/oh-my-skills)。它是一个单独维护的备份仓库，用来存放可分发的 bundle 和整库快照归档。

## 相关工具

### 同类 Skill 管理器

- [sciskill](https://github.com/sciskillhub/sciskill)：公开的 registry 元数据仓库，追踪带有有效 `SKILL.md` 的 GitHub skills，发布可发现的汇总索引。
- [Skills Manager](https://github.com/jiweiyeah/Skills-Manager)：桌面化的多 AI 编码助手技能管理器，适合可视化组织、同步和分享 skill。
- [skillfish](https://github.com/knoxgraeme/skillfish)：偏 CLI 的 skill 管理工具，强调安装、更新和跨 agent 同步。
- [vercel-labs/skills](https://github.com/vercel-labs/skills)：开放的 agent skills CLI 和生态入口，对 `SKILL.md` 包约定影响很大。
- [skills-manage](https://github.com/iamzhihuix/skills-manage)：基于 Tauri 的桌面应用，提供中央仓库、市场浏览、GitHub 导入、集合管理和按平台安装。

### 其他有用的 AI Skill 工具

- [cc-switch](https://github.com/farion1231/cc-switch)：面向 Claude Code、Codex、Gemini CLI、OpenCode 等工具的一站式桌面管理器。
- [SkillClaw](https://github.com/AMAP-ML/SkillClaw)：代理式 skill 进化系统，通过本地代理捕获真实会话，通过本地或对象存储同步 skills，并可进化共享 skill 库。
- [SkillNexus](https://github.com/skyseraph/SkillNexus)：全生命周期 AI skill 工作室，支持生成、测试、评估、进化和排序 skills。
- [Vibe-Skills](https://github.com/forYourHealth111-pixel/Vibe-Skills)：一体化 AI skills 包和工具，编排专家 Skills、验证和持久上下文。

## 支持的 Agent

支持 47 个 agent，包括：

**Claude Code** · **Cursor** · **Windsurf** · **Codex** · **GitHub Copilot** · **Gemini CLI** · **OpenCode** · **Goose** · **Amp** · **Roo Code** · **Kiro CLI** · **Kilo Code** · **Trae** · **Cline** · **Antigravity** · **Droid** · **Augment** · **OpenClaw** · **CodeBuddy** · **Command Code** · **Crush** · **Kode** · **Mistral Vibe** · **Mux** · **OpenClaude IDE** · **OpenHands** · **Qoder** · **Qwen Code** · **Replit** · **Trae CN** · **Neovate** · **AdaL**

<details>
<summary>所有支持的 agent</summary>

| Agent | 全局路径 | 项目路径 |
| --- | --- | --- |
| `adal` | `~/.adal/skills/` | `<project>/.adal/skills/` |
| `amp` | `~/.agents/skills/` | `<project>/.agents/skills/` |
| `antigravity` | `~/.gemini/antigravity/skills/` | `<project>/.gemini/antigravity/skills/` |
| `augment` | `~/.augment/skills/` | `<project>/.augment/skills/` |
| `bob` | `~/.bob/skills/` | `<project>/.bob/skills/` |
| `claude-code` | `~/.claude/skills/` | `<project>/.claude/skills/` |
| `cline` | `~/.cline/skills/` | `<project>/.cline/skills/` |
| `codebuddy` | `~/.codebuddy/skills/` | `<project>/.codebuddy/skills/` |
| `command-code` | `~/.commandcode/skills/` | `<project>/.commandcode/skills/` |
| `continue` | `~/.continue/skills/` | `<project>/.continue/skills/` |
| `codex` | `~/.codex/skills/` | `<project>/.codex/skills/` |
| `copilot` | `~/.copilot/skills/` | `<project>/.copilot/skills/` |
| `cortex` | `~/.snowflake/cortex/skills/` | `<project>/.cortex/skills/` |
| `crush` | `~/.config/crush/skills/` | `<project>/.config/crush/skills/` |
| `cursor` | `~/.cursor/skills/` | `<project>/.cursor/skills/` |
| `deepagents` | `~/.deepagents/agent/skills/` | `<project>/.deepagents/agent/skills/` |
| `droid` | `~/.factory/skills/` | `<project>/.factory/skills/` |
| `firebender` | `~/.firebender/skills/` | `<project>/.firebender/skills/` |
| `gemini-cli` | `~/.gemini/skills/` | `<project>/.gemini/skills/` |
| `github-copilot` | `~/.copilot/skills/` | `<project>/.copilot/skills/` |
| `goose` | `~/.goose/skills/` | `<project>/.goose/skills/` |
| `iflow-cli` | `~/.iflow/skills/` | `<project>/.iflow/skills/` |
| `junie` | `~/.junie/skills/` | `<project>/.junie/skills/` |
| `kilo` | `~/.kilocode/skills/` | `<project>/.kilocode/skills/` |
| `kiro-cli` | `~/.kiro/skills/` | `<project>/.kiro/skills/` |
| `kilo-code` | `~/.kilocode/skills/` | `<project>/.kilocode/skills/` |
| `kimi-cli` | `~/.kimi/skills/` | `<project>/.kimi/skills/` |
| `kode` | `~/.kode/skills/` | `<project>/.kode/skills/` |
| `mcpjam` | `~/.mcpjam/skills/` | `<project>/.mcpjam/skills/` |
| `mistral-vibe` | `~/.vibe/skills/` | `<project>/.vibe/skills/` |
| `mux` | `~/.mux/skills/` | `<project>/.mux/skills/` |
| `neovate` | `~/.neovate/skills/` | `<project>/.neovate/skills/` |
| `openclaw` | `~/.openclaw/skills/` | `<project>/.openclaw/skills/` |
| `openclaude-ide` | `~/.openclaude/skills/` | `<project>/.openclaude/skills/` |
| `openhands` | `~/.openhands/skills/` | `<project>/.openhands/skills/` |
| `opencode` | `~/.opencode/skills/` | `<project>/.opencode/skills/` |
| `pi` | `~/.pi/agent/skills/` | `<project>/.pi/agent/skills/` |
| `pochi` | `~/.pochi/skills/` | `<project>/.pochi/skills/` |
| `qoder` | `~/.qoder/skills/` | `<project>/.qoder/skills/` |
| `qwen-code` | `~/.qwen/skills/` | `<project>/.qwen/skills/` |
| `replit` | `-` | `<project>/.agent/skills/` |
| `roo` | `~/.roo/skills/` | `<project>/.roo/skills/` |
| `trae` | `~/.trae/skills/` | `<project>/.trae/skills/` |
| `trae-cn` | `~/.trae-cn/skills/` | `<project>/.trae-cn/skills/` |
| `warp` | `~/.warp/skills/` | `<project>/.warp/skills/` |
| `windsurf` | `~/.codeium/windsurf/skills/` | `<project>/.codeium/windsurf/skills/` |
| `zencoder` | `~/.zencoder/skills/` | `<project>/.zencoder/skills/` |

</details>

## 赞助与支持

如果 aweskill 帮到了你，欢迎支持一下：

- ⭐ 给项目点个 Star — 让更多人看到它。
- ☕ [Ko-fi](https://ko-fi.com/mugpeng) — 请我喝杯咖啡。
- 💬 微信 — 扫描下方收款码。

<p align="center">
  <img src="assets/images/wechat-pay.jpg" alt="微信收款码" width="240">
</p>

> aweskill 是免费开源的，你的支持让它持续维护下去 — 谢谢。

## 开发

环境搭建、测试、代码风格请参考 [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)。设计原则和命令语义请参考 [docs/DESIGN.md](docs/DESIGN.md)。

## Awesome 软件生态

aweskill 是一个不断壮大的 "awesome" 工具家族中的技能管理器 — 围绕 AI 编程 agent 打造，local-first、可被 agent 直接操作。

### CLI 工具

- **[aweskill](https://aweskill.webioinfo.top/)** — CLI 优先的技能包管理器，支持 47+ AI 编程 agent。
- **[aweswitch](https://github.com/Webioinfo01/aweswitch)** — Claude Code、Codex、OpenCode 的 agent 配置切换器。
- **[awerouter](https://github.com/mugpeng/awerouter)** — 智能路由器，用结构信号把请求分给 Flash 或 Pro 模型，减少不必要的模型开销。
- **[aweshelf](https://github.com/Webioinfo01/aweshelf)** — 收藏、分类、恢复 AI 编程会话，还能搭配 aweswitch 实现保存配置，一键启动。
- **[aweshare](https://github.com/wehuman01/aweshare)** — 通过自建 Hub 共享本地 Ollama/vLLM，或国产厂商 coding plan，或已授权的 OpenAI/Anthropic 帐号订阅，实现 token 的共享经济。
- **[awewarm](https://github.com/wehuman01/awewarm)** — 订阅窗口保持器，让 AI 编程套餐的窗口持续激活，无论是本地设置，还是通过远程连接的服务器。
- **[awescholar](https://github.com/Webioinfo01/awescholar)** — AI agent 可自主执行的科学文献发现与策展，搜索、标注、筛选和报告学术论文。

### 桌面应用

- **[awedot](https://awedot.wehuman.top/)** — 悬浮球驻留屏幕边缘，实时追踪当前 AI 会话；一键收藏、随时恢复，并可搭配 aweswitch 固定 agent 配置（比如用 GLM 模型启动）。

### Project Collections

- **[Awesome AI Meets Biology](https://github.com/Webioinfo01/Awesome-AI-Meets-Biology)** — AI 在生物学、生物信息学和生物医学研究中应用的精选综述。由 awescholar 驱动。
- **[Awesome AI Virtual Tumor](https://github.com/Webioinfo01/Awesome-AI-Virtual-Tumor)** — 面向虚拟肿瘤建模与仿真的前沿 AI 系统精选合集：静态模型、动态模型、agent、基准与综述。

## 许可证

本项目使用 [MPL-2.0](./LICENSE)。
