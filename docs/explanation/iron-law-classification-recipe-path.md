---
authoritative_for: documented Iron Law classification recipe (verify-commit-and-iron-law.md) using a bare relative listWork('.fgos') path that silently returns an empty view instead of an error when run from a worktree, confirmed live during tsk-3hks
---

# A documented recipe's bare relative path silently returned "no items" instead of an error

`tsk-ri8` fixed a doc bug in
`domains/coding/skills/fgos-coding-implement/references/verify-commit-and-iron-law.md`
(and its three generated mirrors): the documented Iron Law classification
recipe resolved the store with a bare relative `listWork('.fgos')` — a path
that only resolves correctly when the calling process's cwd happens to be
the main checkout root.

## Confirmed live, not theoretical

Driving `tsk-3hks` on 2026-08-21: after an out-of-process worker committed
its change and returned, the driver ran this exact documented recipe from
the item's own linked worktree — the natural place a driver sits right
after an out-of-process dispatch returns, since the worker committed there.
Worktrees never carry their own `.fgos/` (ADR0020), so `listWork('.fgos')`
silently returned an empty view (`{work: {}}`) instead of erroring. The
visible symptom wasn't an obvious "wrong directory" message — it was a
confusing crash two calls later: `TypeError: Cannot read properties of
undefined (reading 'id')` inside `changedFiles`
(`src/runner/merge.mjs:219`), because `listWork(...).work[itemId]` had
silently resolved to `undefined`.

Landing in a session already primed by a real same-day `events.jsonl`
data-loss incident (`tsk-1vc`), this read as a second possible data-loss
event for several minutes before being traced back to a plain wrong-cwd
mistake in a documented one-liner.

A second failure mode was also confirmed: even passing an absolute
repo-root path instead of the `.fgos` subdirectory
(`listWork('/repo-root')`) reproduces the same silent-empty-result
failure — `paths(dir)` (`src/state/store.mjs`) joins `dir` directly with
`events.jsonl`/`state.json` rather than resolving a `.fgos` subdirectory
itself, so the exact-right argument shape is a `.fgos`-suffixed absolute
path, easy to get wrong copying the one-liner into a session that isn't
sitting in the main checkout.

## What shipped

The recipe now resolves an absolute main-checkout root explicitly —
`git rev-parse --path-format=absolute --git-common-dir` piped through
`dirname`, the same resolution every other skill in this repo already
uses — before calling `listWork`/`changedFiles`, instead of the bare
relative `.fgos` string. The fix applies to the canonical doc and all
three generated mirrors (`.agents/`, `.claude/`, `plugins/fgOS/` copies of
`fgos-coding-implement/references/verify-commit-and-iron-law.md`).

## Related, not duplicated

- [`tsk-3ys`](worker-prompt-iron-law-evidence-timing.md) — the deeper
  reason a driver ends up needing this exact retroactive-scramble recipe
  in the first place (the out-of-process worker prompt never mentioned
  Iron Law evidence at all). The same `tsk-3hks` drive hit both gaps.
- `tsk-2ew` (done, not detailed here) — fixed the analogous
  silent-empty-from-worktree failure for plugin-skill CLI wrappers via a
  missing `--dir` flag, a different code path (CLI, not this doc's direct
  `import`), so not the same fix surface.

The broader hardening idea raised alongside this fix — making
`listWork`/`paths()` fail loudly instead of silently returning an empty
view when `events.jsonl` doesn't exist at the resolved path — was
proposed for sizing, not decided or shipped as part of this item.
