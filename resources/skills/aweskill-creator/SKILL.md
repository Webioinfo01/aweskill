---
name: aweskill-creator
description: "Use when creating, authoring, or improving a skill: scaffold a new skill, draft SKILL.md content, write trigger descriptions, test with realistic prompts, iterate wording, turn a repeated workflow from the current conversation into a reusable skill, or customize an installed skill. 中文触发词：制作技能、创建技能、新建skill、写一个技能、把这段流程做成技能、技能创作、改进技能、改进触发词、定制已安装技能。"
---

# Aweskill Creator

The creative loop is yours; the mechanics belong to the aweskill CLI. You interview, draft, test, and revise. The CLI guarantees valid scaffolding, frontmatter, and lifecycle. Read `references/writing-guide.md` before drafting skill prose.

## The Loop

1. **Capture intent.** If the current conversation already shows a workflow worth capturing, extract it from history first (tools used, step order, corrections, input/output formats). Confirm gaps with the user before drafting: what should the skill enable, when should it trigger, what output format, which examples pin the behavior down.
2. **Check for existing skills first.** Run `aweskill find <query>` and `aweskill store list --verbose`. Reuse, fork, or improve an existing skill before writing a new one.
3. **Scaffold.** Run `aweskill store create <name> --description "<trigger description>"`. The command validates the name, checks for conflicts, and writes a valid SKILL.md skeleton with `references/`.
4. **Draft the body.** Fill the skeleton following `references/writing-guide.md`. Keep the body under ~500 lines; move detail into `references/` files and link them from the body.
5. **Project and test.** Run `aweskill agent add skill <name> --global --agent <agent-id>`, then try 2–3 realistic test prompts in fresh turns. Projections are symlinks: edits to the central-store copy go live immediately, so you can iterate without re-projecting.
6. **Validate the mechanics.** Run `aweskill doctor fix-skills --skill <name>` (dry-run). Fix anything actionable before finishing.
7. **Improve and repeat.** Generalize feedback instead of layering rules, cut guidance that is not pulling its weight, rerun the test prompts. Stop when changes stop helping.
8. **Finish.** Group it with `aweskill bundle add <bundle> <name>`, or publish it: copy the skill directory into its own git repo so others can `aweskill install owner/repo`.

## Where the Skill Lives

| Skill type | Create with |
|---|---|
| Personal, used across agents | `aweskill store create <name>` (central store) |
| Repo-specific, shared through git | `aweskill store create <name> --dir <repo>/.agents/skills` |

Repo-specific skills stay in the repo; bring one into a machine's central store later with `aweskill store install <path>`.

## Editing an Existing Managed Skill

Installed projections are symlinks to `~/.aweskill/skills/<name>/`. Edit the central-store copy directly — every agent projection updates instantly. `aweskill update` protects those local edits unless `--override` is passed. Keep the original `name` and directory name; do not fork a skill into `<name>-v2` when improving it.

## Escalation

Hand off to `$aweskill-doctor` when projections break or duplicates appear after repeated create/project cycles, and to `$aweskill` for routine install, bundle, and projection work outside authoring.

## References

- `references/writing-guide.md` — trigger descriptions, progressive disclosure, writing style, test prompts, and the improve loop
