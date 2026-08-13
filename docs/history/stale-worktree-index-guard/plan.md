# Plan: stale-worktree-index guard (tsk-2u5)

Mode: high-risk

Flag count against `fgos-routing`'s Mode gate: **public contracts** (the
`.githooks/pre-commit` change fires for every `git commit` in every
`fgw/*` worktree across every session — the closest thing this repo has
to a universal contract) and **existing covered behavior** (extends
`.githooks/pre-commit`, `installGitHooks`, and the
`resyncClaimWorktree`-adjacent reflog pattern, all of which already carry
tests: `test/scripts/install-git-hooks.test.mjs`,
`test/runner/worktree.test.mjs`,
`test/e2e/main-checkout-lock-hook-worktree-commit.test.mjs`) — 2 flags,
which alone would read `standard`. Overridden to **high-risk** by the
hard-gate flag **data loss**: the whole point of this item is closing a
silent, already-occurred data-loss failure mode (commit `2cb6519e`
reverted 405+2838 lines across 21 files), and the fix sits directly on
the commit path every session goes through. `weak proof around the area`
does NOT apply — real test coverage already exists for every module this
touches (cited above), so no proof point below leans on an unproven area.

## Impact-analysis posture

`fgos tool query --capability impact-analysis --status present` → 1
provider (`gitnexus`, `present`) → **full** posture (checked fresh during
`fgos-coding-exploring`, same session). The blast-radius proof points below
lean on this being accurate.

## Approach

**Chosen path**: exactly the mechanism locked in `CONTEXT.md` D1-D5 — a
read-only detection guard added to the existing `.githooks/pre-commit`
(D1/D2), a separate `fgos resync-worktree` repair verb that does the
actual reset+reapply (D3), and a standalone fix to `installGitHooks` so
every worktree's copy of the hook stays current (D4). No proactive
merge-time resync (D5, explicitly excluded).

**Alternatives rejected** (per `CONTEXT.md`'s own locked reasoning, cited
here rather than re-argued):
- In-hook auto-repair instead of a separate verb — rejected per D2/D3: a
  reset+reapply that fails partway inside the hook strands the agent's
  only copy of its change in a temp patch with no clear next step.
- A worktree-scoped `core.hooksPath` override instead of editing the
  shared `.githooks/pre-commit` — rejected per D1: verified to silently
  disable the existing `.fgos`-deletion guard (tsk-56u), which reads the
  same shared config.
- Proactive resync of sibling worktrees at merge time — rejected per D5:
  contradicts `createDetachedMergeWorktree`'s own documented decision and
  races a live session.

### Risk map

| Component | How risky | Proof point (for `fgos-coding-validating`) |
|---|---|---|
| `.githooks/pre-commit` detection guard (D1/D2) | **High** — fires on every commit in every `fgw/*` worktree; a false-positive refuse blocks all work in that worktree; a false-negative silently lets the exact bug through | Run the real failure sequence in a disposable temp repo (force-move a branch ref from outside a checked-out worktree, per `2cb6519e`'s own reproduction) and confirm the hook refuses; also confirm a normal, non-stale commit is unaffected |
| `fgos resync-worktree` verb (D3) | **Medium** — a bug here (e.g. `apply --index` failing to detect a real conflict) could silently corrupt the tree it's meant to fix | Exercise all 3 outcomes against a real git repo: clean resync, refuse-on-conflict (patch preserved), refuse-on-stray-dirt |
| `.fgos/` re-strip after `reset --hard` (bundled into D3) | **Medium** — this is a pre-existing bug in `resyncClaimWorktree` itself, not new code; fixing it wrong could leave `.fgos/` visible in a worktree, violating ADR0020 | Confirm `.fgos/` is absent from the worktree's working tree immediately after the new verb's `reset --hard` step |
| `installGitHooks` absolute-path fix (D4) | **Low** — isolated, well-tested function; the risk is under-scoping the fix (e.g. missing `fgos doctor`'s `mainCheckoutHookWired` read-path, which must still recognize an absolute path as "wired") | `npm test -- test/scripts/install-git-hooks.test.mjs` plus a manual check that `mainCheckoutHookWired` still returns `true` against the new absolute value |

### Files likely touched

- `.githooks/pre-commit` — new detection guard, ordered before
  `stagedFgosDeletions`
- `bin/fgos.mjs` — new `resync-worktree` verb wiring
- `src/runner/worktree.mjs` — new resync-worktree implementation
  (patch-extract/reset/re-strip/apply), reusing `lastSyncedCommit`
- `src/setup/git-hooks.mjs` — `installGitHooks` absolute-path fix (D4),
  correct the now-wrong doc comment above it
- `test/e2e/main-checkout-lock-hook-worktree-commit.test.mjs` (or a new
  sibling e2e test) — real-repo reproduction of the stale-index sequence
- `test/scripts/install-git-hooks.test.mjs` — extend for the absolute-path
  assertion
- New test file for the `resync-worktree` verb (naming left to whichever
  child implements it, matching existing `test/runner/*.test.mjs`
  convention)

### Order

No `fgos graph --what-if` ordering signal applies here — `tsk-2u5` has no
existing deps or children yet, and the graph is currently reporting the
global work-graph shape (691 nodes, `tsk-2u5` sits alone in its own
component), not a per-candidate signal for pieces that don't exist yet.
Ordering below is by direct dependency instead: the hook guard (D1/D2)
names the `fgos resync-worktree` verb (D3) in its own refuse message, so
the verb should exist and be tested before the hook guard is wired to
reference it live. The `installGitHooks` fix (D4) has no dependency
either way and can land independently, before, after, or in parallel.

## Split

Two independently workable pieces. `installGitHooks`'s absolute-path bug
is a self-contained, low-risk fix with no relation to the detection/
repair mechanism's own risk profile — bundling it into the high-risk
piece would make an unrelated one-line fix wait on the harder piece's own
proof, and would make the high-risk piece's own review noisier for no
reason. The detection guard and the repair verb stay together: the guard
is not safely testable/deployable without the verb it tells the user to
run.

```json
[
  {
    "title": "Fix installGitHooks to write an absolute core.hooksPath",
    "verify": "node --test test/scripts/install-git-hooks.test.mjs",
    "action": "D4: installGitHooks (src/setup/git-hooks.mjs:81) must write an absolute path to the main checkout's .githooks/, not the relative .githooks string, since each worktree carries its own frozen on-disk copy of the hook",
    "footprint": ["src/setup/git-hooks.mjs", "test/scripts/install-git-hooks.test.mjs"],
    "kind": "task",
    "risk": "light"
  },
  {
    "title": "Add stale-worktree-index detection guard and fgos resync-worktree repair verb",
    "verify": "node --test test/e2e/main-checkout-lock-hook-worktree-commit.test.mjs test/runner/worktree.test.mjs",
    "action": "D1/D2/D3: read-only stale-index detection in .githooks/pre-commit (refuse fail-closed, never auto-mutate) plus a separate fgos resync-worktree verb that performs the actual patch-extract/reset/re-strip/apply repair, including the bundled .fgos/ re-strip fix for resyncClaimWorktree's own reset --hard",
    "footprint": [".githooks/pre-commit", "bin/fgos.mjs", "src/runner/worktree.mjs", "test/e2e/main-checkout-lock-hook-worktree-commit.test.mjs", "test/runner/worktree.test.mjs"],
    "kind": "task",
    "risk": "high"
  }
]
```

## Concrete cases to prove against

Depth matched to `high-risk` for the second piece, lighter for the first:

- **Piece 1 (installGitHooks)**: fresh repo with no `core.hooksPath` set;
  repo that already has a different custom `core.hooksPath` (must still
  skip, unchanged behavior); repo that already has the correct absolute
  value (idempotent, no-op).
- **Piece 2 (guard + verb)**:
  - Empty/boundary: worktree exactly at its branch's tip (no-op, allowed
    to commit normally).
  - Existing behavior that must not regress: a normal commit in a
    worktree that was never touched by an external force-move must be
    completely unaffected (this is the majority case — every ordinary
    session commit).
  - The actual failure being guarded: branch force-moved from outside
    (`git branch -f`) while a worktree has it checked out, then a
    narrowly-staged commit attempted from that worktree — must refuse.
  - Partial failure: `fgos resync-worktree` where `git apply --index`
    hits a real conflict — must refuse, preserve the patch file, and
    report its path (never leave the tree half-reset).
  - Stray dirt: untracked/unstaged changes present beyond what's staged —
    must refuse per D3, never guess a merge.
  - Concurrent access: two sessions never share a worktree by design
    (each `fgw/<id>` worktree belongs to one claim), so no new concurrency
    case beyond what `resyncClaimWorktree` already handles for the
    reattach path.

## Assumptions

- Stray untracked/unstaged dirt at commit time is uncommon enough in
  practice that D3's "refuse on any stray dirt" rule does not make the
  repair verb rarely usable. This is `CONTEXT.md`'s own flagged open
  question — pinned here as an assumption for the plan rather than
  re-asked, since answering it needs real session data `fgos-coding-validating`
  is better positioned to gather (or accept as an acknowledged limitation)
  than to block planning on.

## Outstanding questions

None
