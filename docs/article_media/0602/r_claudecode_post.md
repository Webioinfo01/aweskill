# r/ClaudeCode Post

**标题**: Made a skill manager that Claude Code can operate autonomously

**正文**:

Hey Claude Code community!

I built `aweskill` — a CLI-first skill manager designed so that Claude Code (and other AI coding agents) can manage their own skills without human intervention.

**How it works:**

Give Claude Code this instruction:

```
Read https://github.com/mugpeng/aweskill/blob/main/README.ai.md
and install aweskill for this agent following the guide.
```

Claude Code reads the guide, executes the steps, and sets itself up — installing the CLI, initializing the skill store, projecting skills, and verifying everything works.

**After setup, you can just say:**

> "Find a good test skill and install it."

Claude Code will search, evaluate results, install the best match, project it to itself, and report back what it did.

**Built-in skills:**

- `aweskill` — search, install, update, bundle management
- `aweskill-doctor` — diagnose and repair broken/duplicate skills

**Why this matters for Claude Code users:**

- No manual file copying or directory guessing
- Skills live in a central store, projected to each agent
- Updates propagate automatically — one update, all agents see it
- State repair is automated — `aweskill-doctor` handles broken symlinks, malformed frontmatter, etc.

**Links:**
- GitHub: https://github.com/mugpeng/aweskill
- Agent-specific guide: https://github.com/mugpeng/aweskill/blob/main/README.ai.md

Full disclosure: I built this. Would love feedback from actual Claude Code users — does this solve a real pain point, or is it something you'd rather handle manually?

---

**Flair**: Tool / Resource
**Format**: Self post (text)
