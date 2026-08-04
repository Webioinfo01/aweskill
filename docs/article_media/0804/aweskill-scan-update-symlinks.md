# aweskill: One Workflow, a Reminder, and Smarter Symlinks

![aweskill](../../../logo/hero1.png)

A few months ago, aweskill grew three things at once: a unified way to scan and import skills, a quiet reminder when a new version is out, and a way to make projection symlinks survive nested git worktrees. None of them are loud releases. None of them are "Windows support." All of them came from real user friction.

This article is about those three.

GitHub: [github.com/Webioinfo01/aweskill](https://github.com/Webioinfo01/aweskill)

## The Imports Were Two Commands by Accident

The shortest distance between "I have a folder full of skills" and "they live in my store" used to be two commands. First you `aweskill store import` to bring them in. Then you `aweskill store scan` to discover anything new. People got them mixed up. People also asked what the difference was, often.

The difference was small. `import` walked the agent directories you pointed it at and copied skills in. `scan` walked the same directories and *reported* what it found. The natural follow-up question was "why are these two commands?" The honest answer in v0.3.4 was: because they were written at different times by different people, and the boundaries drifted.

v0.3.5 collapsed them into one.

### `aweskill store scan --import`

The new shape is one command with a flag:

```bash
aweskill store scan --import
```

The scan walks the agent directories, finds `SKILL.md` files, reports them, and — with `--import` — copies or symlinks the keepers into `~/.aweskill/skills/`. The standalone `store import` command is gone. `--link-source` and `--track-source` are gone. `--keep-source` now clearly means "keep the original file in place instead of replacing it with a symlink."

The new contract is: *scan* is the only verb for "look at agent directories," and `--import` is the only flag for "and bring them in." One command, one shape, no parallel vocabulary to remember.

A practical aside. The deletion was bigger than the addition — the kind of cleanup that is only possible when the old shape is fully replaced, not deprecated-with-a-warning. The CLI surface shrinks. The help text shrinks. The tests shrink. Everything downstream gets simpler without losing capability.

The agent picked up the same change. `README.ai.md` and the aweskill skill now describe one workflow. The "scan" and "import" terms are no longer taught as two different things.

## The Update Reminder That Does Not Nag

Software that does not tell you about new versions feels abandoned. Software that nags you to update every five minutes feels like a phone OS. v0.3.7 picked the middle path.

### After each command, quietly check

`aweskill` now checks the npm registry for a newer version after each command, throttled to once per day. If a newer version exists, a single line is printed after the command output finishes:

```
$ aweskill find review
…
A new version of aweskill is available: 0.3.8 (you have 0.3.7). Run `aweskill self-update` to upgrade.
```

That is the entire interaction. No popups. No prompt. No "do you want to update now?" The check runs alongside the command, so there is no extra wait. The worst case is one extra line a moment after the real result lands.

Without the throttle, every command would hit the registry and the reminder would fire on every keystroke — the same nag-OS feeling v0.3.7 is trying to avoid. The check is also the kind of thing users want to turn off, so the env var is `AWESKILL_NO_UPDATE_CHECK=1` for that.

### The pinned-version section is gone

Both READMEs used to recommend installing a specific version: `npm install -g aweskill@0.3.5`. The idea was that a fresh install should land on something known. The reality in 2026 is that npm's default is the latest, and the pinned recommendation told people to install *stale* versions on purpose. v0.3.7 removed the recommendation. Install the latest. Let the reminder tell you when a newer one is out.

This is the kind of decision that looks small in a changelog and large in user experience. The default install is now the right install. The user no longer has to remember to "unpin" anything.

## The Symlink That Survived the Worktree

This one is the most technical of the three, but the user-facing symptom is simple: a projection that works in the main repo sometimes dangles in a nested git worktree.

> Thanks to [Kang-chen](https://github.com/kang-chen) for opening [PR #13](https://github.com/Webioinfo01/aweskill/pull/13) — the original patch landed the `AWESKILL_ABSOLUTE_SYMLINKS=1` env var and the focused tests. v0.3.8 builds on top of it by promoting the env var to a discoverable `--absolute` flag.

### The shape of the bug

`aweskill` projects skills into agent directories via symlinks. By default, the symlinks use *relative* targets — which is the right choice for a portable projection. A relative target works on any machine, in any CI, as long as the relative depth from the agent directory to the store is the same.

A nested git worktree changes that depth. The projection that worked in the main checkout is now one level too shallow in the worktree. The symlink resolves to a path that does not exist. The skill is technically installed but the agent cannot find it.

v0.3.8 adds an opt-in escape hatch: `aweskill agent add … --absolute` (or the corresponding env var as the global default). With absolute targets, the symlink points directly at the local `~/.aweskill/skills/…` path, regardless of how deep the worktree is.

### The tradeoff, written down

Absolute targets hard-code the local user's `~/.aweskill` path. They are right for one machine with one user and many worktrees. They are wrong for any kind of cross-machine or CI scenario, where the relative target is the only safe default. The README and DESIGN.md now state this explicitly:

> Absolute targets hard-code the machine's `~/.aweskill` path and dangle across machines/CI, so relative stays the right default for shared projections.

The default does not change. Most users will never need `--absolute`. The users who do need it — people running nested worktrees on one machine — now have a discoverable flag instead of an env var they would only find by reading the source.

## What the Agent Now Does Better

Each of the three changes flows through the `aweskill` skill the agent uses to manage the tool itself.

| User says | Skill runs |
|---|---|
| "Bring in the skills from this repo." | `aweskill store scan --import` (was: two commands) |
| "Is there a new version?" | the post-command reminder surfaces it on its own |
| "Update aweskill." | `aweskill self-update` (no manual "unpin") |
| "Project this skill into a nested worktree." | `aweskill agent add … --absolute` |

The first row is the one the agent used to hesitate on. "Should I run `import` or `scan`?" was a real question in v0.3.4. In v0.3.5 the answer is always "run `scan --import`." The agent does not have to think about which verb means which.

The second row is the one the user notices without asking. The reminder is a small, quiet nudge that does not require any user action. Combined with the removed pinned-version install, the experience of "stay current" is now fully automatic on the default install.

The third row is a niche fix for a real edge case. Most users will never see it. The ones who do — nested-worktree users — will find the flag because the docs point at it.

## Why These Three Together

They look like three unrelated changes. They are not.

Each one is a friction-reduction release:

- **v0.3.5** removes a vocabulary split (`import` vs `scan`) and a flag split (`--link-source` vs `--track-source` vs `--keep-source`). The new shape is one command and one flag.
- **v0.3.7** removes the cognitive load of "is there a new version?" and the install footgun of "did I pin to the wrong release?" The default is now the right answer.
- **v0.3.8** removes the worktree breakage for a specific audience by promoting an env var to a discoverable flag. The default stays safe; the escape hatch is reachable.

None of them are headline features. None of them are "AI agent does X for you." They are the kind of changes a mature tool makes when it stops chasing new features and starts paying down the small debts.

The cross-cutting theme is: *make the default do the right thing.* The default `scan` imports. The default install gets the latest. The default symlink target is portable. Each user who never touches a flag is using the tool correctly, by accident, because the default is right.

That is what "small releases" look like when the larger project is healthy. The Windows story is a separate article. This one is about the rest of the surface area that quietly got better.

## Try Them

The three are already in v0.3.8. If you have an older install, the new version will tell you so the next time you run any command:

```bash
aweskill find review
```

If a newer version exists, the reminder fires. Run:

```bash
aweskill self-update
```

And you are on the latest. From there:

```bash
# The unified scan-and-import
aweskill store scan --import

# The worktree escape hatch, when you need it
aweskill agent add skill pr-review --global --agent codex --absolute
```

Three commands. Each one is the answer to a question that used to be more complicated.

That is the whole release.

## More from Webioinfo

aweskill is part of the [Webioinfo](https://www.webioinfo.top/) ecosystem:

- **[aweswitch](https://github.com/mugpeng/aweswitch)** — Agent profile switcher (Claude, Codex, OpenCode)
- **[aweshelf](https://github.com/Webioinfo01/aweshelf)** — AI coding session manager with profile-aware restoration
- **[awescholar](https://github.com/Webioinfo01/awescholar)** — Automated scientific literature discovery
