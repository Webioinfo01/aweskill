# r/programming Post

**标题**: Letting AI agents manage their own development tools

**正文**:

I've been thinking about a fundamental mismatch in how we design developer tools for the AI agent era.

Most tools still assume a human is the sole operator. The workflow is: human reads docs → installs → configures → tells agent what happened. The human becomes the package manager.

But agents can already run commands, inspect files, and follow conventions. So if a tool is meant for agents, shouldn't it be designed for agent operation first?

I built `aweskill` around this idea — a CLI-first skill manager where the primary interface is a protocol for agents, not humans.

**The core idea:**

Give agents a bootstrapping document (`README.ai.md`) that tells them:
1. How to install themselves
2. How to set up their skill store
3. How to project skills to the current agent
4. How to verify everything works

After that, you don't memorize commands. You just say:

> "Find a good code review skill, install it, and enable it for this agent."

The agent searches, evaluates, installs, projects, and verifies — all autonomously.

**Two built-in meta-skills:**

- `aweskill` — search, install, update, bundle, agent projection
- `aweskill-doctor` — sync check, cleanup, dedup, repair broken skills

**The principle:**

Tools for AI agents should be:
- Scriptable (stable CLI)
- Conservative on destructive ops
- Checkable before applying
- Verifiable after each step
- Recoverable when state drifts

This is the model `aweskill` follows.

**Links:**
- GitHub: https://github.com/mugpeng/aweskill
- Agent guide: https://github.com/mugpeng/aweskill/blob/main/README.ai.md

Would love feedback — is this the right level of abstraction, or will agent capabilities make this unnecessary?

---

**Flair**: Discussion / Tool
**Format**: Self post (text)
**Best posting time**: Tue-Thu, 9-11 AM ET
