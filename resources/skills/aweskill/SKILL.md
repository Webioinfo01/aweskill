---
name: aweskill
description: "Use when managing aweskill store, bundle, and agent workflows that are not repair-first: routine commands, bundle template work, multi-agent or multi-scope projection planning, recover flows, skill migration, install/remove/configure tasks. 中文触发词：技能管理、导入技能、投影技能、启用/禁用技能、安装/移除技能、bundle、agent、aweskill、高级技能管理、recover、技能迁移。"
---

# Aweskill

Use `aweskill` CLI directly. Do not add wrapper scripts unless the CLI is missing a needed capability.

## Intent Router

Match the user's intent to a task domain, then follow the workflow below.

| User intent | Domain | First command |
|---|---|---|
| "Find a skill for X", "search skills", "install from GitHub" | Source Lifecycle | `aweskill find <query>` |
| "Scan and import local skills", "what's in the store", "remove a skill from the store" | Store Work | `aweskill store list --verbose` |
| "Create a bundle", "add skills to a bundle", "show bundle contents" | Bundle Work | `aweskill bundle list --verbose` |
| "Give Codex skill X", "project a bundle to Cursor", "remove a projection" | Projection Work | `aweskill agent list --verbose` |
| "Update a skill", "refresh skills", "更新技能" | Source Lifecycle | `aweskill update --check` |
| "Update aweskill itself", "upgrade the CLI" | Self-Update | `aweskill self-update --check` |
| "Make me a skill", "turn this workflow into a skill", "做一个技能" | Authoring | Hand off to `$aweskill-creator` |
| "Something is broken", "skill not showing up", "duplicate skills" | Escalate | Hand off to `$aweskill-doctor` |

## First-Time Setup

If `aweskill` is not installed or the store is not initialized, run the full bootstrap:

1. Install the CLI: `npm install -g aweskill`
2. Initialize the central store: `aweskill store init`
3. Confirm the store location: `aweskill store where --verbose`
4. Project built-in skills to the current agent: `aweskill agent add skill aweskill,aweskill-doctor --global --agent <current-agent-id>`
5. Verify: `aweskill agent list --global --agent <current-agent-id>` — both skills should show as `linked`
6. Tell the user to invoke skills (`/` or `$`, depending on the agent) and check if the new skills appear. If they do, the skills are ready to use. If not, ask the user to restart the agent.

If `aweskill` is already installed but the store is not initialized, start from step 2.
If the store is initialized but skills are not projected, start from step 4.

## Core Rules

Inspect before mutating:

1. Run a read-only inspection command first.
2. Confirm scope: `--global` or `--project [dir]`.
3. Confirm target agent with `--agent` when the command touches projections.
4. Run the mutating command only after the current state is clear.
5. Re-run inspection after mutation to verify the result.

For complex changes, also decide:

- Whether the source of truth should remain the central store, a bundle, or an existing agent root.
- Whether the task is single-scope or truly needs both `--global` and `--project`.
- Whether the task is single-agent or should be applied agent-by-agent with explicit `--agent`.

## Workflows

### Source Lifecycle

Use when the task is about searching upstream sources, installing tracked skills, or refreshing them.

```bash
# Search upstream providers
aweskill find <query>
aweskill find <query> --local              # search local store only
aweskill find <query> -p <provider>        # limit to one provider (skills-sh, sciskill, local)
aweskill find <query> -l <number>          # limit results (default 10)
aweskill find <query> --domain <domain>    # sciskill domain filter
aweskill find <query> --stage <stage>      # sciskill stage filter

# Install from GitHub, local path, or sciskill ID
aweskill install <source>
aweskill install <source> --skill <name>   # install one skill from a multi-skill source
aweskill install <source> --list           # list downloadable skills without installing
aweskill install <source> --all            # install all skills from the source
aweskill install <source> --ref <ref>      # git branch or tag (GitHub sources only)
aweskill install <source> --as <name>      # install under a different name
aweskill install <source> --override       # overwrite existing skills

# Check tracked skills for updates
aweskill update --check

# Refresh tracked skills
aweskill update [skill...]
aweskill update --source <source>          # only update skills from a source
aweskill update --override                 # discard local changes and overwrite
```

Decision order:

1. `find` when the source is not yet known.
2. `install` when the source is known and the skill should enter the central store.
3. `update --check` when the user wants visibility before change.
4. `update` when the skill is already tracked and should be refreshed.

### Store Work

Use when the task is about existing local skills that need to be brought into or managed inside the central store.

```bash
# See what's in the central store
aweskill store list --verbose

# Inspect one managed skill
aweskill store show <skill>

# Scan agent skill directories (dry-run: only discover)
aweskill store scan
aweskill store scan --verbose                  # show skill names and paths
aweskill store scan --project                  # scan project scope only
aweskill store scan --agent claude             # scan specific agent only

# Scan and import discovered skills
aweskill store scan --import                   # import all discovered skills (replaces with symlinks)
aweskill store scan --import --override        # overwrite existing files
aweskill store scan --import --keep-source     # keep originals instead of replacing with symlinks
aweskill store scan --import --verbose         # import with detailed output

# Remove a skill from the central store
aweskill store remove <skill>

# Backup and restore
aweskill store backup [archive]
aweskill store backup --skills-only            # exclude bundles
aweskill store restore <archive>
aweskill store restore <archive> --override    # replace existing skills
```

### Self-Update

Use when the task is about updating the aweskill CLI tool itself, or when the installed CLI behaves differently from the repo code.

```bash
# Check current vs latest npm version
aweskill self-update --check

# Update from npm registry (stable)
aweskill self-update

# Check latest dev branch commit
aweskill self-update --dev --check

# Build and install from GitHub dev branch
aweskill self-update --dev
```

If the user reports that the installed `aweskill` doesn't match what they expect from the repository:

1. Check which binary is active: `which aweskill`
2. Check installed version vs npm latest: `aweskill self-update --check`
3. If dev branch is needed: `aweskill self-update --dev --check && aweskill self-update --dev`
4. If the issue persists, inspect the installed `dist/index.js` or global package target to confirm which code is actually running.

### Bundle Work

Use when the task is about organizing reusable skill sets before projecting them into agents.

```bash
# See bundles
aweskill bundle list --verbose

# Create a bundle
aweskill bundle create <name>

# Add or remove skills
aweskill bundle add <bundle> <skills>
aweskill bundle remove <bundle> <skills>

# Inspect a bundle
aweskill bundle show <name>

# Delete a bundle
aweskill bundle delete <name>

# Import a built-in bundle template
aweskill bundle template import <name>
```

### Projection Work

Use when the task is about applying central-store skills or bundles into agent roots.

```bash
# See supported agents
aweskill agent supported

# Inspect projected agent state
aweskill agent list [--global|--project [dir]] [--agent <id>] --verbose

# Project a skill or bundle
aweskill agent add skill <name> --global --agent <id>
aweskill agent add bundle <name> --project [dir] --agent <id>
aweskill agent add skill <name> --global --agent <id> --force  # replace duplicates/foreign targets

# Remove a managed projection
aweskill agent remove skill <name> --global --agent <id>
aweskill agent remove skill <name> --global --agent <id> --force  # also remove duplicates/foreign targets

# Temporarily hide a skill from one agent (config toggle; projections kept)
aweskill agent disable skill <name> --agent <id>

# Restore a hidden skill (removes the config toggle)
aweskill agent enable skill <name> --agent <id>

# Recover one agent root into copied directories
aweskill agent recover --global --agent <id>
```

> **Codex shared roots:** Codex reads skills from its own `~/.codex/skills` AND the shared `~/.agents/skills` (plus repo-level `.agents/skills`). `agent list --agent codex` shows the shared entries in a read-only `shared` section with duplicate and hidden annotations. `agent add`/`remove` only touch `~/.codex/skills`; when a skill also lives in a shared root, aweskill prints a note. To truly hide a skill from Codex without touching other agents, use `agent disable skill` (writes `[[skills.config]]` into `~/.codex/config.toml`); Codex ignores project-layer toggles, so `disable`/`enable` operate at user scope only.

> **Windows note:** projections are normally symlinks (macOS/Linux) or junctions (Windows). When a junction cannot be created, aweskill silently falls back to a managed **copy** — a snapshot of the central store. In copy mode, `aweskill store update <skill>` does **not** auto-propagate into agent directories; re-project with `aweskill agent add skill <name> --global --agent <id> --force` if an updated skill is not reflected.

For scope-sensitive or multi-agent projection:

1. Decide whether target should be `--global` or `--project [dir]`.
2. Run `aweskill agent supported` if agent IDs are uncertain.
3. Use `aweskill agent list` before projecting.
4. Apply changes one scope at a time unless the user explicitly wants multi-scope rollout.
5. Re-run `aweskill agent list --verbose` to verify the result.

## Escalation to Doctor

Hand off to `$aweskill-doctor` when the symptom matches one of these categories:

| Symptom | Doctor workflow |
|---|---|
| `agent list` shows `broken` | Projection is Broken |
| `agent list` shows `duplicate` or `matched` | Duplicate Skills Exist |
| `agent list` shows `suspicious` or `new` | Store Has Suspicious Files |
| `store list` or `doctor clean` reports suspicious entries | Store Has Suspicious Files |
| `doctor fix-skills` reports malformed frontmatter | SKILL.md Frontmatter is Malformed |
| User says "skill not showing up" | Agent Cannot See a Skill |
| User asks to "repair", "clean", "deduplicate", or "sync" | Run inspection first, then follow the matching symptom workflow |

Do NOT escalate for CLI version mismatches or self-update issues — handle those in the Self-Update workflow above.

## References

- `references/common-flows.md` — common day-to-day command sequences
- `references/command-map.md` — fast route from user intent to CLI command
