---
type: plan
item: tsk-598
timestamp: 2026-07-28T16:10:00.000Z
status: draft
---

# tsk-598 — plan

CONTEXT.md: `docs/history/return-approve-scoped-clean-tree/CONTEXT.md` (D1-D3).

## Mode

**standard.**

Flags counted (per fgos-coding-planning's mechanical gate):
- public contracts — yes: `return`/`approve` are the fgOS CLI's own verbs;
  this changes when they refuse (their observable contract).
- existing covered behavior — yes: `test/runner/merge.test.mjs`
  (`isWorkingTreeClean`/`isFgosOnlyStatusLine` unit tests) and
  `test/cli/fgos.test.mjs` (`return`/`approve` verb tests) already cover
  the code this touches.
- auth / data model / audit-security / external systems / cross-platform /
  multi-domain / weak-proof-area — no.

2 flags, no hard-gate flag, no story-sized behavior beyond a scoped bug
fix → **standard**, not tiny/small (2 real call sites, signature change on
a shared primitive, 2 test files) and not high-risk (no hard-gate flag
trips, mechanism it depends on already exists per D1/D2).

## Graph check

`fgos graph --json`: tsk-598 has no `deps`, is not on `criticalPath`, and
does not appear in `topUnblock` — no other item's ordering depends on this
one landing first or last. No split candidate to compare via `--what-if`.

## Approach

**Chosen:** add one shared, pure filter primitive in `src/runner/merge.mjs`
that both call sites reuse, each supplying its own already-locked
`own-file-set` source (D2/D3). No new module — `merge.mjs` already owns
`isWorkingTreeClean`/`isFgosOnlyStatusLine`, the exact functions being
narrowed.

**Rejected alternative:** a brand-new module (e.g.
`src/runner/own-file-set.mjs`). Rejected — the filter is a small, pure
function tightly coupled to `isFgosOnlyStatusLine`'s existing line-parsing
logic; splitting it out would separate two things that must stay in sync
(the `.fgos/`-exclusion rule and the new own-file-set rule both operate on
the same porcelain line) without reducing real complexity (YAGNI/KISS).

**Rejected alternative:** change `isWorkingTreeClean`'s default behavior
(no explicit "unfiltered" path). Rejected — a default of `null` (meaning
"reject everything outside `.fgos/`", i.e. today's strict behavior) is the
fail-safe direction: a future caller that forgets to pass an own-file-set
gets the OLD strict behavior, never a silent free pass.

### Files touched

- `src/runner/merge.mjs` — `isFgosOnlyStatusLine` gains an optional
  `ownFileSet` parameter (a `Set<string>` or `null`); a line only counts as
  "ignorable" when it is `.fgos/`-only OR (`ownFileSet` is set AND every
  path on the line is outside `ownFileSet`) — i.e. inverted from today's
  "blocks": a status line now blocks `return`/`approve` only when it is
  NOT `.fgos/`-only AND (`ownFileSet` is `null` OR the line's path IS in
  `ownFileSet`). `isWorkingTreeClean(repoRoot, ownFileSet)` threads the new
  parameter through unchanged otherwise (approve's call site).
- `bin/fgos.mjs`:
  - local `isWorkingTreeClean(cwd, ownFileSet)` (~line 100) — same
    parameter threaded through, same subtree pathspec scoping kept as-is
    (unrelated to this item, STR60 dogfood-fixture concern).
  - `return`'s main-source branch (~line 1377-1392): reorder so `head =
    currentHead(cwd)` is computed BEFORE the clean-tree check (today it is
    computed after); build `ownFileSet` from
    `changedFilesSince(cwd, item.headAtTake, head)` ∪ `item.footprint`
    (D2/D3), pass it into the clean check.
  - `approve`'s runner-source branch (~line 1663-1670): reuse the
    `changedFiles(repoRoot, item)` array already computed for the Iron Law
    check (~line 1601) — do not recompute; union with `item.footprint`,
    pass into `isMainTreeClean`.
- `src/runner/frozen-judge.mjs` — export the existing local `normalizePath`
  (line 39) instead of adding a second copy; `merge.mjs` imports it for
  building `ownFileSet` (D2's "union" needs both sides normalized the same
  way `frozenJudgeHits` already normalizes `footprint`).
- `test/runner/merge.test.mjs` — unit cases for the new `ownFileSet`
  parameter (see Proof below).
- `test/cli/fgos.test.mjs` — integration cases for `return` and `approve`
  (see Proof below).

### Risk map

| component | risk | proof point |
|---|---|---|
| `isFgosOnlyStatusLine`'s inverted "ignorable" logic (still must catch `.fgos/` paths AND new own-file-set paths, never conflate the two) | standard | unit test: `.fgos/`-only line ignored regardless of `ownFileSet`; non-`.fgos/` line outside `ownFileSet` ignored; non-`.fgos/` line inside `ownFileSet` blocks |
| `return`'s reordered `head` computation (moving a `git rev-parse HEAD` call earlier) | low | existing `return` integration tests in `test/cli/fgos.test.mjs` must stay green unmodified — reorder is behavior-preserving for every path that doesn't touch `ownFileSet` |
| default (`ownFileSet = null`) staying fail-safe (strict) for any caller that omits it | low | unit test: calling `isWorkingTreeClean`/`isFgosOnlyStatusLine` with no `ownFileSet` reproduces today's exact whole-tree-blocks-on-anything behavior |
| footprint-declared item: uncommitted-but-in-footprint path still blocks (D2/D3) | standard | integration test: item with `footprint` set, a footprint path dirty/untracked but not yet committed → return/approve still blocks |

## Proof to carry into `fgos-coding-validating`

Concrete cases the plan commits to proving (validating's reality check
runs these, or confirms equivalents already exist):

1. Unrelated dirty/untracked file (path outside `ownFileSet` entirely) →
   `return` and `approve` both succeed (the tsk-352 / tsk-veg repro
   shape).
2. Same path both in the item's committed diff AND currently dirty again
   (real conflict) → both verbs still block, same error shape as today.
3. No `ownFileSet` passed (defensive default) → both verbs reproduce
   today's exact whole-tree-blocks behavior — regression guard for any
   future caller.
4. Item WITH `footprint` declared, a footprint path dirty/untracked but
   never committed → still blocks (D2/D3's footprint protection).
5. Existing `return`/`approve` test suites (`test/cli/fgos.test.mjs`,
   `test/runner/merge.test.mjs`) stay green unmodified apart from the new
   cases above — the reorder and signature change must not change any
   currently-passing assertion's outcome.

Verify command: `npm test` (full suite — state + cli + runner + e2e, per
AGENTS.md's definition of done; this item changes shared CLI-verb
behavior, so the narrower `node --test test/runner/merge.test.mjs
test/cli/fgos.test.mjs` during iteration is not sufficient on its own for
"done").

## Split decision

No split. One honest piece of work: 2 files change (plus 2 test files),
both direct instances of the same locked D1-D3 design, no independent
sub-piece that could land or be reviewed on its own. `fgos graph` confirms
nothing else in the graph depends on ordering here.
