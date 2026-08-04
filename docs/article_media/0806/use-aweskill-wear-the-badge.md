# Use aweskill，Wear the Badge

![aweskill](../../../logo/hero1.png)

aweskill started as a skill manager. Install skills, project them into your agent, done. But somewhere along the way it became something else: a small hub of tools that distribute themselves through it.

The README now has a section called "Powered by aweskill." Four projects are in it. The section is short, but it points at the shape of a thing — a set of tools that share one distribution layer, cross-link each other, and are starting to recommend each other to their users.

This article is about that shape, and about the badge you can add to join it.

GitHub: [github.com/Webioinfo01/aweskill](https://github.com/Webioinfo01/aweskill)

## Who's Already Powered by aweskill

Three AI tools and one project collection, all shipping skills through aweskill.

**[aweswitch](https://github.com/Webioinfo01/aweswitch)** — the profile switcher. Launch isolated agent sessions with different API endpoints, tokens, and models, or apply a profile so `/model` works mid-session. It is aweskill's closest sibling: aweswitch handles *which endpoint*, aweskill handles *which skills*. (It just shipped real Windows support, too.)

**[aweshelf](https://github.com/Webioinfo01/aweshelf)** — the session bookmark manager. Bookmark, categorize, search, and resume Claude Code and Codex sessions, with the original profile restored on resume. aweswitch's `-c` and `-t` launch flags hand off to aweshelf automatically. The two compose: aweswitch launches, aweshelf remembers.

**[awescholar](https://github.com/Webioinfo01/awescholar)** — scientific literature discovery. An AI-agent-operable tool for searching, annotating, filtering, and reporting on academic papers. It is also aweskill-powered: its capabilities reach the agent through skills.

**[Awesome AI Meets Biology](https://github.com/Webioinfo01/Awesome-AI-Meets-Biology)** — a curated survey of AI applications in biology, bioinformatics, and biomedical research. Powered by awescholar, which is powered by aweskill — so the dependency chain reads right off the README.

## What "Powered by aweskill" Means

It is not a marketing tag. It means the project distributes its skills through aweskill, so a user installs once and the skill lands in every supported agent — Claude Code, Codex, Cursor, Gemini CLI, and the rest of the 47+. The project does not ship a per-agent installation guide. It ships a `SKILL.md`, and aweskill does the projecting.

That is the efficiency half. The other half is discovery. Each "Powered by aweskill" project links back to the hub, and the hub links to them. A user who installs aweswitch sees aweshelf. A user who finds awescholar sees the biology collection. The badge is what makes that link visible from the outside — from a GitHub README a stranger is scanning.

## Add the aweskill Badge to Your Project

If your project uses aweskill, you can add one of two badges to your README:

| Badge | Use |
|-------|-----|
| `aweskill-badge.svg` | Used by aweskill itself |
| `aweskill-badge2.svg` | For companion projects |

The companion badge is the one most projects want. Drop it into your README title:

```html
<a href="https://github.com/Webioinfo01/aweskill">
  <img src="https://raw.githubusercontent.com/Webioinfo01/aweskill/main/logo/aweskill-badge2.svg" alt="aweskill companion">
</a>
```

In a markdown heading, it looks like this:

```markdown
# My Project <a href="https://github.com/Webioinfo01/aweskill"><img src="https://raw.githubusercontent.com/Webioinfo01/aweskill/main/logo/aweskill-badge2.svg" alt="aweskill companion"></a>
```

That is the whole change. One link in your README. The badge sits next to your title, points at the hub, and signals to anyone browsing that your skills are installable through aweskill.

## Why Bother

Three reasons, in order of how often they pay off:

1. **Your users install your skill once.** aweskill projects it into whatever agent they run. You stop maintaining per-agent docs and "works in Claude Code" caveats. The badge tells them this is the case before they read the install section.

2. **The hub recommends you back.** aweskill's README lists powered projects. A user who came for aweswitch or aweshelf will see your project in the same section. The badge is the outward half of that link; the listing is the inward half. Together they form a small recommendation network.

3. **Good tools find each other.** The ecosystem is small enough that the projects already talk — aweswitch hands off to aweshelf, awescholar powers the biology collection. Wearing the badge makes you part of that conversation. The next sibling tool that gets built is more likely to compose with yours if it can see you.

## Try It

Add the badge, ship your skill through aweskill, and you are in. The install for users is one line:

```text
Read https://github.com/Webioinfo01/aweskill/blob/main/README.ai.md and follow it to install aweskill for this agent.
```

After that, your `SKILL.md` is reachable from any of the supported agents, and your README carries a link into a growing set of tools that do the same.

用起aweskill，戴上badge — use it, and show it.

## More from Webioinfo

aweskill is part of the [Webioinfo](https://www.webioinfo.top/) ecosystem:

- **[aweswitch](https://github.com/Webioinfo01/aweswitch)** — Agent profile switcher (Claude, Codex, OpenCode)
- **[aweshelf](https://github.com/Webioinfo01/aweshelf)** — AI coding session manager with profile-aware restoration
- **[awescholar](https://github.com/Webioinfo01/awescholar)** — Automated scientific literature discovery
