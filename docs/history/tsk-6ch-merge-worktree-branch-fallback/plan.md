# tsk-6ch — plan

Mode: tiny

1 lane flag applies: **existing covered behavior** —
`test/runner/worktree.test.mjs`/`test/runner/merge.test.mjs` already cover
`createDetachedMergeWorktree`'s call chain (`docs/history/
tsk-6ch-merge-worktree-branch-fallback/CONTEXT.md` scout evidence). No
auth, authorization, data-model, audit/security, external-system,
public-contract, cross-platform, or validation-removal concern — a couple
of files, one direct task, decisions already fully specified by the
item's own description — stays `tiny`.

## Approach

**Chosen path:** `createDetachedMergeWorktree` takes `id` instead of the
pre-formatted `branch` string, so it can call `createBranchRef(repoRoot,
id, { baseRef: 'main' })` as a fallback when `branchExists` is false,
instead of throwing — mirroring `loop.mjs`'s own early-creation call
(`createBranchRef(repoRoot, rootId, { baseRef: 'main' })`,
`worktree.mjs:696`) for the case where that early call never ran
(CONTEXT.md's "why the throw fires in practice"). After the fallback
creates the ref, the function proceeds exactly as it does today (`git
rev-parse`, `git worktree add --detach`, `finishWorktreeSetup`) — the
branch now exists, so nothing downstream changes.

`withMergeEphemeralWorktree` (the function's one caller,
`worktree.mjs:764-766`) already computes `branch = branchNameFor(id)` and
has `id` in scope — its own call site changes from
`createDetachedMergeWorktree(repoRoot, branch)` to
`createDetachedMergeWorktree(repoRoot, id)`; `branchNameFor` moves inside
`createDetachedMergeWorktree` itself, next to the `createBranchRef` call it
now needs to make with the same `id`.

**Alternatives rejected:**
- Deriving `id` back out of `branch` inside `createDetachedMergeWorktree`
  (e.g. stripping the `fgw/` prefix) — rejected: `branchNameFor` is a
  one-way formatter (CONTEXT.md), and reversing it re-implements a second,
  parallel copy of that mapping for no benefit over just passing `id`
  through, which the one caller already has in scope.
- Calling `createBranchRef` with `baseRef: detectTrunk(repoRoot)` instead
  of the literal `'main'` — rejected: `detectTrunk` lives in `merge.mjs`,
  which already imports from `worktree.mjs`; importing it back would open
  a fresh circular dependency between the two modules for a value
  `loop.mjs`'s own early-creation call (the precedent this fallback
  exists to backstop) already hardcodes as `'main'` (CONTEXT.md scout
  evidence).
- Fixing this at every `withMergeEphemeralWorktree` call site individually
  (`bin/fgos.mjs`'s `approve`/catch-up/`return` verbs) instead of inside
  `createDetachedMergeWorktree` itself — rejected: the fallback belongs
  exactly once, at the one place that currently throws; every caller
  benefits automatically and none of them need their own copy of the
  branch-does-not-exist handling.

**Files touched:**
- `src/runner/worktree.mjs` — `createDetachedMergeWorktree`'s signature
  and body; `withMergeEphemeralWorktree`'s one call site.
- `test/runner/worktree.test.mjs` — new case for the fallback, plus a
  regression case confirming existing (branch-already-exists) behavior is
  unchanged.

**Order:** `fgos graph --json` reports `tsk-6ch` as its own isolated
1-item component (no deps, no dependents) — no `criticalPath`/`topUnblock`
ordering applies. One piece, no internal ordering beyond touching
`worktree.mjs` before running its own updated tests.

## Risk map

| Component | Risk | Proof point |
|---|---|---|
| `createDetachedMergeWorktree` fallback | Low | New test: calling it (via `withMergeEphemeralWorktree`) for an `id` whose `fgw/<id>` branch does not exist yet succeeds — the branch gets created from `main`, the ephemeral worktree stands up at that tip, no throw. |
| Existing branch-exists path | Low | Regression test: calling it for an `id` whose branch already exists behaves exactly as before (worktree checked out at the branch's current tip, not reset to `main`) — `createBranchRef`'s own idempotency (CONTEXT.md scout evidence) is what guarantees this, not new logic in this item. |
| Every `withMergeEphemeralWorktree` caller (`bin/fgos.mjs` approve/catch-up/return, `promote-engine.mjs`) | Low | GitNexus `impact(createDetachedMergeWorktree, upstream)`: `risk: LOW`, 1 direct caller (`withMergeEphemeralWorktree`, same file), 1 affected module (`Runner`) — CONTEXT.md. No caller's own call site needs editing; the signature change is internal to `worktree.mjs`. |

**Impact-analysis posture:** full (GitNexus `present`, freshly queried
2026-08-10 — CONTEXT.md).

## Shape

One honest piece — no split. Single function fix plus its own test
coverage, already fully specified by the item's description.

Concrete cases to prove against (matches the item's own `verify`,
`node --test test/runner/worktree.test.mjs`):
- Branch missing: `createDetachedMergeWorktree`/`withMergeEphemeralWorktree`
  no longer throws — it creates `fgw/<id>` from `main` and stands up the
  detached checkout there.
- Branch already exists: behavior unchanged (checkout at the branch's real
  current tip, no reset to `main`).
- `finishWorktreeSetup` (`.fgos/` strip, dependency provisioning) still
  runs on the fallback path exactly as it does today — nothing about the
  fallback skips it.

## Assumptions

- Fallback `baseRef` is the literal `'main'`, matching `loop.mjs`'s own
  early-creation call (`worktree.mjs:696`) — not `detectTrunk`
  (`promote-engine.mjs`'s deliberately different choice for its own flow,
  `docs/history/promote-to-component/CONTEXT.md` D1). Not material to this
  item's own scope (an internal fallback default, not a product decision),
  so pinned here rather than raised as a question — `fgos-coding-validating`'s
  reality gate can flag it if the assumption turns out unproven.
- `id` values never collide with an existing `branchNameFor` mapping
  ambiguity — already true today (`branchNameFor` is a pure `fgw/${id}`
  formatter used unconditionally everywhere in this module); this item
  does not change that mapping, only which function receives `id` versus
  the pre-formatted `branch` string.

## Outstanding questions

None
