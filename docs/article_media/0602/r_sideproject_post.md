# r/SideProject Post (Showoff Saturday)

**标题**: [Showoff Saturday] aweskill — a skill manager designed for AI agents to operate themselves

**正文**:

Hey r/SideProject!

I built `aweskill` — a CLI-first skill package manager where the primary user is an AI coding agent, not a human.

**The problem I was solving:**

When you use multiple AI coding tools (Claude Code, Codex, Cursor, Gemini CLI, Windsurf, etc.), each has its own skill/plugin directory structure. You end up manually copying files, managing symlinks, and hoping the next agent has a similar layout. You become the package manager.

**The solution:**

`aweskill` gives agents a protocol (`README.ai.md`) they can follow autonomously:

```
Read https://github.com/mugpeng/aweskill/blob/main/README.ai.md
and install aweskill for this agent following the guide.
```

A competent agent can execute this entirely on its own — install, initialize, project skills, verify.

**What agents can do after setup:**

- "Find a useful Python data analysis skill" → searches, evaluates, installs
- "Create a frontend bundle with design, testing, accessibility skills" → assembles and activates
- "Check if my skills need updates" → dry-run check, then applies with approval
- "Fix any broken or duplicate skills" → diagnoses, reports, applies with backup

**Built-in tools:**

- `aweskill` — management (search, install, update, bundle)
- `aweskill-doctor` — repair (sync, clean, dedup, fix)

**Philosophy:**

Tools for AI agents should be:
- Fully scriptable via CLI
- Conservative on destructive operations
- Checkable before applying changes
- Verifiable after each step
- Recoverable when things break

**Links:**
- GitHub: https://github.com/mugpeng/aweskill
- Live docs: https://aweskill.webioinfo.top/
- Agent guide: https://github.com/mugpeng/aweskill/blob/main/README.ai.md

It's also part of a small ecosystem I'm building (Webioinfo) — includes session bookmarking (aweshelf), literature discovery (awescholar), and more.

**Feedback welcome!** What do you think — is agent-first tool design the right direction, or am I over-engineering something that'll resolve naturally?

---

**Flair**: Showoff Saturday
**Format**: Self post (text)
**Best posting time**: Saturday, 10 AM - 2 PM ET
