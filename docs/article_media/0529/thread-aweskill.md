---
delay_ms: 3000
---

Most dev tools still assume the human is the operator.

You read docs, install CLIs, copy commands, fix paths, then explain the result to your AI agent.

But if the agent can edit your repo and run tests — why can't it manage its own tools?

![aweskill](/Users/peng/Desktop/Project/product/aweskill/logo.png)

---

The old workflow when a coding agent needs a Skill:

Find it. Download. Locate the directory. Place SKILL.md. Restart.

Manageable once. Messy when you use Codex, Claude Code, Cursor, Gemini CLI side by side.

The human becomes the package manager.

---

aweskill flips this. It gives agents a bootstrap protocol:

"Read README.ai.md and install aweskill for this agent."

That's enough. The agent checks Node.js, installs aweskill, initializes the store, detects the runtime, and projects the built-in Skills.

![demo](/Users/peng/Desktop/Project/product/aweskill/docs/article_media/image/aweskill-agent-install-demo.png)

---

After bootstrap, you say things like:

"Find a good code-review Skill, install it, and enable it for this agent."

The agent searches, inspects results, runs the install, projects the Skill, and verifies it.

No manual folder work. No guessing where each agent stores its Skills.

---

7 things your agent can do with aweskill:

1. Bootstrap a fresh agent
2. Find and install Skills by conversation
3. Build project bundles
4. Check for updates
5. Repair broken Skills
6. Migrate between agents
7. Back up before risky changes

---

The key design principles:

- Conservative: agent asks before guessing
- Inspectable: dry-run reports before applying changes
- Recoverable: backups before destructive actions
- Documented for both humans AND agents

The agent diagnoses and prepares. The human approves.

---

Why this matters:

The best tools for AI agents should be scriptable, inspectable, and recoverable.

aweskill is built around that model. README.ai.md for bootstrap. aweskill-doctor for repair.

Skill management should not stay trapped in manual folder work.

---

Part of the Webioinfo ecosystem:

- aweskill — Skill package manager
- awescholar — Scientific literature discovery
- aweshelf — Session bookmark manager
- aweswitch — Agent profile switcher
- aweteam — AI coding team coordinator

All agent-operable. All CLI-first.

---

Try it. Ask your agent:

"Read README.ai.md from the aweskill repo and install aweskill for this agent."

Then: "Find a useful testing Skill and install it."

Your agent is no longer just using Skills. It can help manage them.

aweskill.webioinfo.top
