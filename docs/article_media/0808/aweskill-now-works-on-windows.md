# aweskill: Now Works on Windows

![aweskill](../../../logo/hero1.png)

I am on Windows. I open a fresh `cmd.exe` and type `aweskill find review`. The tool runs. I pick a skill, run `aweskill install owner/repo`, and… `spawn ENOENT`. The npm shim for the agent cannot launch. I try `aweskill self-update` and watch it die the same way. I check the agent's `SKILL.md` I just installed and the name and description are blank — frontmatter gone. I close the laptop, get coffee, and tell my agent:

> "aweskill is broken on Windows. Figure out why and fix it."

When I came back, the install worked, the update worked, the `SKILL.md` showed its name and description, and the agent had a one-paragraph summary of what it changed. The `agent add` flow that worked on macOS for months now worked on Windows. Same command, same result, both shells.

GitHub: [github.com/Webioinfo01/aweskill](https://github.com/Webioinfo01/aweskill)

## Bugs Fixed

v0.4.0 ships a focused set of Windows fixes — each one bites the user on the first run, and each one has a direct fix:

**Bug 1: `npm` and `tar` were assumed.** `self-update` spawned `npm` directly, but on Windows `npm` is a `.cmd` shim and modern Node refuses to spawn `.cmd` shims without a shell wrapper; the sciskill archive download called `unzip`, which Windows does not ship. Fix: `self-update` now goes through the shell on Windows (real `.exe`s like `git` are unaffected), and the archive download picks the extractor per platform — `tar -xf` on Windows 10+ (built in), `unzip` on macOS/Linux, where the system `tar` cannot read `.zip`.

**Bug 2: `SKILL.md` frontmatter disappeared.** The skill-doc parser expected Unix line endings, so CRLF files silently dropped all frontmatter — name and description were gone, and `find --local` showed blank entries. Fix: the parser now accepts CRLF; LF-native platforms see no change.

**Bug 3: Windows CI flaked on a strict readlink assertion.** Windows `readlink` appends a trailing backslash to directory symlink targets. Fix: the test was normalized; the Windows CI matrix is green.

The docs get a cleanup too: both READMEs and the aweskill skill drop the dedicated Windows chapter and state cross-platform support inline, with a `ubuntu | macOS | windows` badge. The one command-behavior difference that does remain — the junction fallback to managed copy in `agent add` — now lives as a single line under "Projection Work."

## A Day on Windows

It is Wednesday. You are on a Windows machine with `cmd.exe` open in one window and PowerShell in another. You are an agent user; the agent does most of the heavy lifting.

**9:00 AM.** First-time install of aweskill:

```cmd
npm install -g aweskill
aweskill -v
```

The install works. You ask the agent to bootstrap itself per `README.ai.md`. The agent runs `aweskill store init`, `aweskill store where --verbose`, `aweskill agent supported`, then `aweskill agent add skill aweskill,aweskill-doctor --global --agent <agent-id>`. Every shell-out lands cleanly: `npm` spawns through the shell wrapper, no `ENOENT`, no `unzip: not found`.

**10:30 AM.** You want a code-review skill. You tell the agent:

> "Find a good code-review skill, install it into aweskill, and enable it for this agent."

The agent runs `aweskill find review`, picks one, runs `aweskill install owner/repo`. The skill lands in `~/.aweskill/skills/`. The agent runs `aweskill agent add skill pr-review --global --agent <agent-id>` to project it. `aweskill show pr-review` reports the name and description correctly — frontmatter parsed, CRLF or not.

**1:00 PM.** You notice a new version is out. You tell the agent:

> "Update aweskill."

The agent runs `aweskill self-update`. Behind the scenes, npm is now launched through the shell on Windows, so the `.cmd` shim resolves and the install completes. The new version is in place.

**3:00 PM.** You decide to import a couple of skills from a Windows-checkout repo you have been working on. You tell the agent:

> "Scan the current repo for skills and import the ones that look useful."

The agent runs `aweskill store scan --import`. The scan finds every `SKILL.md`, including the ones saved with CRLF endings. Frontmatter is intact. Import succeeds. `aweskill list` shows the new entries with the right names.

**5:00 PM.** You are done. Five commands, all run by the agent, all worked first try on a fresh `cmd.exe`. You never installed `unzip`. You never saw `spawn ENOENT`. You never had to explain to the agent why a freshly installed skill had no name.

## What the Agent Now Reaches on Windows

The skill picked up the same power on Windows that it already had on macOS and Linux: full self-service of the tool itself. Before v0.4.0, the agent had Windows-shaped holes in its toolbelt — `self-update` failed, sciskill downloads failed, freshly installed skills showed up blank. After v0.4.0:

| You say | The skill runs |
|---|---|
| "Update aweskill." | `aweskill self-update` (spawns npm through shell on Windows) |
| "Import the skills from this repo." | `aweskill store scan --import` (CRLF frontmatter parsed) |
| "Show me what I just installed." | `aweskill show <name>` (no more blank frontmatter) |
| "Find a code-review skill." | `aweskill find review` |
| "Install owner/repo." | `aweskill install owner/repo` (sciskill uses bsdtar on Windows) |
| "Project aweskill to Codex." | `aweskill agent add skill aweskill --global --agent codex` |

Same commands, same verbs, same expected output. Windows is not a special case in the agent's vocabulary anymore.

## The Same Experience

For Windows users, the flow is now identical to macOS. Install. Use. Update. The shell is `cmd.exe` instead of `zsh`, the npm shim resolves through `PATHEXT` instead of the shebang, and nothing else changes. `aweskill find` does the same thing it does everywhere else. So does `install`, `agent add`, `store scan --import`, `self-update`, and `show`. Same config, same store at `~/.aweskill/skills/`, same projection layout.

That sameness extends to the aweskill skill. Windows users get the same natural-language interface that macOS and Linux users have had since v0.2.x. The skill reads the same `README.ai.md`, walks through the same bootstrap protocol, and runs the same `aweskill` commands. The agent does not need a separate "Windows mode" — it picks the right shell wrapper, the right archive extractor, the right frontmatter normalizer, and the user just sees a CLI that works.

> "Update aweskill and import any new skills from this repo."

That prompt works the same way on a Windows laptop as it does on a Mac. The agent runs `aweskill self-update` (npm shim resolves on Windows, no `ENOENT`), then `aweskill store scan --import` (CRLF frontmatter parsed correctly). The setup is a task. The agent does tasks. So I gave the task to the agent.

## Why v0.4.0?

The version bump from 0.3.8 to 0.4.0 is intentional. The 0.3.x line was "Windows is supported in theory; here are the caveats." The 0.4.0 line is "Windows is supported; the caveats are gone." The npm spawn fix alone would justify the bump — `self-update` is a critical path, and it was completely broken on a default Windows install. Add the sciskill extraction, the CRLF frontmatter, and the test normalization, and you have a release that closes the chapter on Windows-as-afterthought.

The README had been carrying a dedicated "Windows" section since the early days. v0.4.0 deletes it. Not because Windows is now identical to every other platform — the junction-vs-symlink detail is real, and it is documented under "Projection Work" — but because the *commands* are now identical. The user no longer needs special instructions to use `aweskill` on Windows. They just use it.

## Try It on Windows

```cmd
npm install -g aweskill
aweskill -v
aweskill store init
```

Open a new terminal if `npm install -g` says you need to. The `aweskill -v` after install confirms the CLI is reachable. `aweskill store init` creates `~/.aweskill/`. From there, the same commands work everywhere:

```cmd
aweskill find review
aweskill install owner/repo
aweskill agent add skill pr-review --global --agent codex
aweskill self-update
```

No `unzip` to install. No manual CRLF fix on the `SKILL.md` you just checked out. No `spawn ENOENT` on `self-update`. No dedicated Windows chapter to read.

That is the whole Windows experience now. Same config, same command, same `aweskill` skill, same agent managing it for you.

## More from Webioinfo

aweskill is part of the [Webioinfo](https://www.webioinfo.top/) ecosystem:

- **[aweswitch](https://github.com/mugpeng/aweswitch)** — Agent profile switcher (Claude, Codex, OpenCode); now cross-platform
- **[aweshelf](https://github.com/Webioinfo01/aweshelf)** — AI coding session manager with profile-aware restoration
- **[awescholar](https://github.com/Webioinfo01/awescholar)** — Automated scientific literature discovery
