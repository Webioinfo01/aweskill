# r/ArtificialIntelligence Post

**标题**: AI agents that manage their own tools: a practical approach

**正文**:

I've been exploring a question: if AI coding agents can already run commands, inspect files, and fix errors, why do we still design tools that require human intervention for setup and maintenance?

I built `aweskill` to test this idea — a skill manager where the primary interface is a protocol for agents, not humans.

**The concept:**

Instead of humans installing and configuring tools for agents, agents install and configure tools for themselves.

The bootstrapping document (`README.ai.md`) tells an agent:
1. Check environment (Node.js, npm)
2. Install the tool
3. Initialize its skill store
4. Identify itself and project skills
5. Verify everything works

**What this enables:**

- **Autonomous discovery**: "Find a useful Python skill" → agent searches and installs
- **Bundle assembly**: "Create a frontend development bundle" → agent assembles relevant skills
- **State maintenance**: `aweskill-doctor` detects and repairs broken configurations
- **Cross-agent portability**: Skills live centrally, projected to any agent on demand

**Design principles:**

Tools for AI agents should be:
- Fully automatable (stable CLI)
- Safe for autonomous operation (conservative on destructive ops)
- Transparent (checkable before applying, verifiable after)
- Recoverable (backup before major changes)

**Links:**
- GitHub: https://github.com/mugpeng/aweskill
- Agent documentation: https://github.com/mugpeng/aweskill/blob/main/README.ai.md

Would love to hear thoughts — is this the right direction for AI tooling, or will agents eventually handle this without specialized infrastructure?

---

**Flair**: Discussion / Application
**Format**: Self post (text)
**Best posting time**: Mon-Fri, 8-10 AM ET or 2-4 PM ET
