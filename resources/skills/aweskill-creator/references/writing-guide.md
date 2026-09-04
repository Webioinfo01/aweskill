# Skill Writing Guide

How to write a SKILL.md that triggers reliably and teaches well. Read this before drafting; return to it while iterating.

## Trigger Descriptions

The `description` in the frontmatter is the primary trigger signal. Agents match skills on it before anything else, and models tend to *under*-trigger, so write it a little pushy:

- Say **what** the skill does and **when** it should fire, including the user phrasings that should activate it.
- Include trigger words in every language your users speak (e.g. both English and 中文触发词).
- Prefer concrete nouns from the domain over generic verbs.

Weak: `How to build a dashboard for internal data.`

Strong: `How to build a fast dashboard for internal data. Use whenever the user mentions dashboards, data visualization, internal metrics, or wants to display any company data — even if they don't explicitly say "dashboard". 中文触发词：仪表盘、数据看板、内部指标展示。`

The skill `name` must be lowercase kebab-case, 1–64 characters, and match its directory name.

## Progressive Disclosure

Skill content loads in three layers; respect them:

1. **Metadata** (name + description) is always in context — keep it short.
2. **SKILL.md body** loads when the skill triggers — target under 500 lines.
3. **Bundled files** (`references/`, `scripts/`, `assets/`) are read on demand.

When the body grows long, split domain detail into `references/` files and point to them from the body: "if the target is AWS, read `references/aws.md` before proceeding."

## Writing Style

- Use the imperative form: "Read the file before editing."
- Explain *why* a rule matters when the reason is not obvious; models follow guidance better when they understand it. A need for all-caps MUSTs is usually a sign the rule needs a better explanation, not louder enforcement.
- Examples beat rules. If the skill produces structured output, include a literal example of the format. If a specific tool should be used, show the call.

## Test Prompts

After drafting, write 2–3 realistic prompts — the kind a user would actually type, with concrete file paths, casual phrasing, even typos. Share them with the user before running.

For each prompt:

1. Make sure the skill is projected (`aweskill agent add skill <name> --global --agent <id>`); restart the agent if the skill does not appear.
2. Run the prompt in a fresh turn. Let the description trigger the skill, or force-load it if the agent supports that.
3. Review the result *and* the trace with the user. Busywork (re-reading files, throwaway scripts, going in circles) means the skill is over-prescribing — cut guidance rather than adding rules.

## The Improve Loop

- **Generalize from feedback.** The skill must work on inputs nobody has seen. If an issue resists targeted edits, reframe the guidance instead of layering constraints; overfit rules make skills worse over time.
- **Keep it lean.** Delete guidance that is not pulling its weight and rerun the tests to confirm nothing breaks.
- **Look for repeated work.** If every test run reinvents the same helper script, bundle it under `scripts/` and point the skill at it. Write it once.

## Mechanics Checklist

Before finishing a skill:

- [ ] Frontmatter parses with a valid `name` (matches the directory) and a trigger-oriented `description` — `aweskill doctor fix-skills --skill <name>` reports nothing actionable.
- [ ] Body under ~500 lines; detail lives in `references/`.
- [ ] Test prompts pass in fresh turns without force-loading.
- [ ] The skill is projected to at least one agent and the user confirmed it appears.
