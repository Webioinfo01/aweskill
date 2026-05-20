# Aweskill Doctor UX Refactor & Consolidation

## Context

Currently, `aweskill doctor` has 4 technically well-isolated subcommands: `clean`, `dedup`, `fix-skills`, and `sync`. While the technical boundaries are clear, there is conceptual overlap and unnecessary cognitive load for users:

1. **Mental Model Overlap**: `clean` (removes store junk) and `dedup` (removes store duplicate skills) both conceptually "clean up the central store" from a user's perspective.
2. **Semantic Inconsistency**: Agent-side junk cleanup is currently implemented via `sync --remove-suspicious`, whereas store-side junk cleanup is its own command (`clean`).

## Action Items

- [ ] **Unify or group Store Cleanup actions (`clean` + `dedup`)**
  - Consider merging `dedup` into `clean` (e.g., `doctor clean --include-duplicates`), or grouping them under a unified interactive cleanup prompt.
  - Evaluate if `dedup` should remain separate but be discoverable via a broader health check.

- [ ] **Address naming inconsistency for Agent-side cleanup**
  - Review `doctor sync --remove-suspicious`.
  - Consider allowing `doctor clean --agent <id>` to clean unmanaged/suspicious files in agent directories, leaving `sync` strictly for repairing and updating valid projections.

- [ ] **Explore a universal "One-Click" Doctor experience**
  - Running `aweskill doctor` (without subcommands) should perform a global, read-only health check across the store, bundles, and all agent projections.
  - Output a consolidated summary: "Found 2 duplicates, 1 broken projection, 3 malformed SKILL.md files".
  - Allow a unified `aweskill doctor --apply` or an interactive prompt to fix all identified issues in one go.
