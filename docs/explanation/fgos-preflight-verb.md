---
authoritative_for: why the fgos preflight verb was added, and why it is retired from the product CLI (it stays a repo-only npm script)
---

# `fgos preflight` is retired; the three checks stay as repo scripts

**Retired.** `fgos preflight` no longer exists: the verb answers "unknown verb" (exit 4).
It ran `npm run build:skills` and two `scripts/` checks in whatever directory it stood in;
inside a linked worktree that wrote `.fgos/instructions/effective/repo.json` and left the
worktree stuck, and nothing outside its own test ever called it. The checks are about this
repository's own files, so they belong in this repository's scripts, not in the product CLI.

For this repository run `npm run check:before-merge`. It chains the three checks the verb ran:

- **mirror-sync-diff**: `npm run build:skills`; any uncommitted change under `.claude/skills/`
  or `plugins/fgOS/skills/` afterwards is drift. The owning proof is `test/skills/fgos-mirror.test.mjs`.
- **decision-citation-drift**: `scripts/check-decision-citation-drift.mjs`
  (proof: `test/scripts/check-decision-citation-drift.test.mjs`).
- **backlog-reconciliation**: `scripts/check-backlog-reconciliation.mjs`.

## Why the checks exist

`tsk-4e1` added the verb because the three checks each ran in seconds but were only
read after the slow `npm test` finished, right before merge, when a caught error costs
most. Two same-day incidents showed it: a skill sync that missed one of three required
mirrors, and a bare `"D5"` citation that violated the decision-citation rule. The script
chain keeps that early feedback without a product verb.

It was never meant to be a blocking git hook: a hard-blocking hook creates pressure to reach
for `--no-verify`, which would open a bypass door for the `.fgos` invariants the pre-commit
hook already protects.
