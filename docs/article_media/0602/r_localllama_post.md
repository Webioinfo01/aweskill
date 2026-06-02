# r/LocalLLaMA Post

**标题**: AI agents managing their own skills: built a CLI tool for this

**正文**:

Most developer tools still assume "human" is the only operator. You read docs, install CLI, figure out where files go, copy commands from README, paste into terminal, check output, fix paths, then tell your AI coding agent the final state.

In an era where tools only面向 humans, this makes sense.

But current AI coding agents can already run commands, check files, follow project conventions, and fix local state anomalies. If a tool is meant for an agent, the better question isn't:

> How should a human use this CLI?

But:

> Can the agent operate this CLI itself?

That's the design philosophy behind `aweskill` — a CLI-first Skill package manager that AI agents can autonomously operate.

**What it does:**

- Provides a bootstrapping protocol (`README.ai.md`) that tells an agent how to install and initialize itself
- Built-in meta-skills: `aweskill` for management (search, install, update, bundle) and `aweskill-doctor` for repair (sync, clean, dedup, fix)
- Agent projection: map skills to specific agents (Claude Code, Codex, Cursor, etc.) from a central store

**Use cases I've found most useful:**

1. **Fresh agent setup**: Tell a new agent "install aweskill from README.ai.md" — it handles the rest
2. **Skill discovery**: "Find a useful Python data analysis skill" → agent searches, evaluates, installs
3. **Bundle creation**: "Create a frontend bundle with UI design, accessibility, testing skills" → agent assembles and projects
4. **State repair**: `aweskill-doctor` detects broken symlinks, duplicate skills, malformed frontmatter

**Why this matters:**

The right tool for AI agents should be:
- Scriptable via stable CLI
- Conservative on destructive operations
- Checkable before applying changes
- Verifiable after each operation
- Recoverable when local state drifts

`aweskill` is built around this model.

Full disclosure: I built this. It's part of the Webioinfo ecosystem (also includes aweshelf for session bookmarks, awescholar for literature discovery, etc.).

**GitHub**: https://github.com/mugpeng/aweskill
**Agent docs**: https://github.com/mugpeng/aweskill/blob/main/README.ai.md

Curious what others think — is this the right abstraction, or am I solving a problem that'll resolve itself as agents get more capable?

---

**Flair**: Tool / Project
**Format**: Self post (text)
