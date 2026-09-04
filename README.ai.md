# aweskill Bootstrap Protocol

This document is for AI coding agents. Follow the steps below to install aweskill and make its built-in management skills available to the current agent.

## Goal

After completing this protocol:

1. `aweskill` CLI is installed globally via npm
2. The aweskill central store is initialized at `~/.aweskill/skills/`
3. The built-in skills `aweskill`, `aweskill-doctor`, and `aweskill-creator` are projected into the current agent's skill directory
4. After the user verifies the new skills are available (invoke skills via `/` or `$` to check), it can use aweskill commands from natural-language requests

## Language Behavior

- Reply in the user's language when possible.
- If the user asks in Chinese, continue in Chinese.
- If the user asks in English, continue in English.
- If the user explicitly asks for another language, follow that request.

## Prerequisites

- Node.js >= 20 (`node --version`)
- npm available (`npm --version`)

If Node.js is missing, tell the user to install it from https://nodejs.org/ before continuing.

## Steps

### 1. Install aweskill

```bash
npm install -g aweskill
```

### 2. Initialize the central store

```bash
aweskill store init
```

### 3. Confirm store location

```bash
aweskill store where --verbose
```

### 4. Identify the current agent

Run this command to see which agents are installed on this machine:

```bash
aweskill agent supported
```

Look for lines marked with `✓` — these are detected agent roots. Pick the one that matches your runtime. Common agent ids:

- `claude-code` — Claude Code (CLI or IDE extension)
- `cursor` — Cursor
- `codex` — OpenAI Codex CLI
- `gemini-cli` — Gemini CLI
- `windsurf` — Windsurf
- `opencode` — OpenCode
- `qwen-code` — Qwen Code

If you cannot determine your agent id from the output, ask the user.

### 5. Project built-in skills to this agent

Replace `<agent-id>` with the id from step 4:

```bash
aweskill agent add skill aweskill,aweskill-doctor,aweskill-creator --global --agent <agent-id>
```

### 6. Verify

```bash
aweskill agent list --global --agent <agent-id>
```

Expected output should show `aweskill`, `aweskill-doctor`, and `aweskill-creator` as `linked`.

### 7. Ask about existing skills migration

Ask the user:

> You may already have skills in your agent directories (e.g. `.claude/skills/`). Would you like me to scan and import them into the aweskill central store?

If the user agrees:

```bash
aweskill store scan --import
```

If the user is speaking Chinese:

> 你可能已经在 agent 目录（如 `.claude/skills/`）中有一些 skills。要不要我扫描并导入到 aweskill 中央仓库？

Skip this step if the user explicitly says they are starting fresh or declines.

### 8. Verify skills are available

After projection (and optional migration), tell the user to invoke skills (`/` in Claude Code, `$` in Codex, or the equivalent in other agents) and check if the new skills (e.g. `aweskill`, `aweskill-doctor`, `aweskill-creator`) appear in the list. If they do, the skills are ready to use immediately. If not, the user should restart the agent.

> aweskill is installed. Invoke skills (type `/` or `$` depending on your agent) and look for `aweskill` — if it appears, you're good to go. If not, restart the agent. Then you can ask me things like:
>
> - “Find a useful Python data-analysis skill and install it into aweskill.”
> - “What can I do with aweskill?”

If the user is speaking Chinese, use this version instead:

> aweskill 已安装。请调用 skills（输入 `/` 或 `$`，取决于你的 agent），看看列表中是否出现了 `aweskill`。如果出现了，说明已就绪可以直接使用。如果没有，请重启 agent 后再试。然后你可以继续问我，例如：
>
> - “帮我找一个好用的 Python 数据分析 skill，并安装到 aweskill。”
> - “我能用 aweskill 做什么？”

## Safety Rules

- If you cannot determine the agent id, ask the user before proceeding.
- Do not project skills to all agents by default. Only project to the current agent unless the user explicitly requests otherwise.
- If any command fails, report the exact command and error message to the user. Do not silently retry.
- Do not modify the user's existing agent projections or bundles unless asked.
