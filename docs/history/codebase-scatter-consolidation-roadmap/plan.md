# plan.md -- tsk-3wl5: codebase scatter consolidation roadmap

Mode: standard

No `CONTEXT.md` exists for this feature -- discovery's own verdict (`RESEARCH.md`
Round 1) was `clear`, which skips `exploring` by design (no gap needed a
person's judgment call), so there is no "## Locked decisions" table to cite
D-IDs from. Lane: this item's own `risk`/`tier` already read `standard`
(`fgos show tsk-3wl5 --json`); there is no prior recorded `Mode:` line or
session Orient handoff to reuse (the two cases `fgos-coding-planning` step
1's own direct-entry fallback actually covers), so Mode is set directly
from that `risk`/`tier` field as the most honest available signal, not a
guess.

## Approach

Chosen path: finish the per-file concern/pain measurement `RESEARCH.md`
started, rank by real pain (not raw line count), and write the ranking plus
the negative examples into this document -- exactly what the item's own
`verify` command checks for (`plan.md` exists, has a `## Ranked roadmap`
heading, and names `command-registry.mjs`). No code is touched; this item's
own boundary line says so explicitly ("Item này KHÔNG gom gì cả").

Alternatives rejected:
- **Also materialize each ranked file as a real child item at this gate**
  (`fgos-coding-planning` step 4's split path). Rejected: step 4 requires
  every child spec's `action` field to cite a real D-ID from this feature's
  `CONTEXT.md`, and none exists (see above) -- inventing one would be exactly
  the red flag the skill calls out ("inventing an `action` that cites a D-ID
  loosely... just to make a child spec well-formed"). The item's own `verify`
  command also does not require materialized children, only the document.
  See "Split decision" below for the resolution.
- **Rank purely by line count.** Rejected: the item's own text explicitly
  says pain, not size, drives the ranking (`command-registry.mjs` is the
  7th-largest file by lines but must NOT be consolidated), and
  `RESEARCH.md` Round 1 already measured churn/test-bloat/tool-breakage
  signals for exactly this reason.

Risk map:

| Component | Risk | What would prove it |
|---|---|---|
| Ranking driven by measured signal, not guesswork | Low -- every number below traces to a live `git log`/`grep`/`wc` run in this session or `RESEARCH.md` Round 1 | Cross-checked below, per file |
| No code edited | None -- this item's own boundary forbids it | `git status` at return time shows only `docs/history/codebase-scatter-consolidation-roadmap/` changed |
| Follow-on items not yet real | Low -- deliberate (see Split decision) | Each roadmap row names the file, the concern-split shape, and the file/kind/risk a future `fgos submit` should use |

Impact-analysis capability gate (`fgos tool query --capability impact-analysis
--status present`, run this session): GitNexus registered and `present` ->
posture is `full`. Not load-bearing here -- this item edits no symbols, so no
proof point in this plan leans on blast-radius evidence. Noted for the
record only.

`fgos graph --json` was checked; its `criticalPath`/`topUnblock` fields rank
existing *work items*, not source files, and no children are materialized at
this gate (see Split decision) -- so it has nothing to inform here. This is
not a skipped step, just a not-applicable one for a document-only pass-through.

## Shape

Survey scope: the 8 files the item names (`bin/fgos.mjs`,
`src/setup/registrations.mjs`, `src/runner/loop.mjs`, `src/state/store.mjs`,
`src/runner/merge.mjs`, `src/runner/worktree.mjs`,
`src/cli/command-registry.mjs`) plus the 9th file the per-file instructions
also cover, `src/intake/plan.mjs`. `src/runner/dispatch.mjs` is excluded --
owned and already split by `tsk-2uf-1` (merged to `main`; the barrel
re-export now sits at 61 lines).

Concern measurement (function inventory this session, on top of
`RESEARCH.md` Round 1's churn/test/function-count table):

| File | Lines | Dominant concentration | % of file |
|---|---|---|---|
| `bin/fgos.mjs` | 4215 | `runVerb` (line 991-3909): ONE function, a 60-case `switch(verb)` with every CLI verb's full logic inline (`add` 144 lines, `edit` 235 lines, `return` 311 lines, `setup` 114 lines, etc.) | 2919/4215 = **69%** |
| `src/intake/plan.mjs` | 1027 | `resolvePlan` (line 517-1027): one function carrying pass-through/decompose/ask-trigger branching | 511/1027 = **50%** |
| `src/state/store.mjs` | 1471 | `moveWork` (line 557-870): one function branching on every `to` status the work FSM allows | 313/1471 = **21%** |
| `src/runner/merge.mjs` | 1447 | `mergeRunnerItemLocked` (line 1100-1336): merge-under-lock mechanics | 236/1447 = **16%** |
| `src/runner/loop.mjs` | 1534 | `runOnce` (1106-1500, 394) + `dispatchClaimedItem` (750-1049, 299): two large functions, no single one dominates | 693/1534 = **45%** (split across 2) |
| `src/runner/worktree.mjs` | 1369 | No single function >10%; 33 functions spread across branch/checkout/resync/create/cleanup lifecycle stages | -- |
| `src/setup/registrations.mjs` | 2071 | No single function >5%; 59 top-level functions total -- 41 `check*`/`fix*` (33 check, 8 fix, not 1:1 paired) plus 18 shared registration/helper infrastructure (`registerCheck`, `registerFix`, `registerConfigDefault`, etc.) -- none over ~90 lines | -- |
| `src/cli/command-registry.mjs` | 1278 | Zero functions -- a single flat data table (~60 verb-entry objects), by its own file-header comment "Pure data only" | n/a (single concern by design) |

Two distinct scatter *shapes* showed up, and they call for different fixes:

1. **One mega-function hiding many concerns** (`bin/fgos.mjs`'s `runVerb`,
   `src/intake/plan.mjs`'s `resolvePlan`, to a lesser extent `store.mjs`'s
   `moveWork`) -- the same shape `dispatch.mjs` had before `tsk-2uf-1`. Fix:
   extract by concern into concern-named sibling files, keep the original
   path as a barrel re-export, same template `tsk-2uf-1` already proved
   (`src/runner/dispatch/{cli,config,mechanism,prepare,resolve,transport}.mjs`,
   96-832 lines each).
2. **Many small single-purpose functions with no topic grouping**
   (`registrations.mjs`'s 41 `check*`/`fix*` functions plus 18 shared
   registration/helper functions, `worktree.mjs`'s 33 lifecycle helpers)
   -- a "junk drawer", not a mega-function. Fix (when
   ranked high enough to act on): group by topic into sibling files (e.g.
   `registrations.mjs` splits along its own natural check-domains: git/shell,
   config, plugin/marketplace, docs/changelog/decision-index,
   worker-slots/gate-bypass/iron-law), not by extracting one function.

## Ranked roadmap

Ranked by real pain (churn from `RESEARCH.md` Round 1's `git rev-list
--count`, test-file fragmentation, confirmed tool breakage, and this
session's concern-concentration measurement above) -- not by raw line count.
One item per row; each is its own future `fgos submit`, never bundled.

| Rank | File | Churn (commits) | Pain evidence | Concern shape | Recommended split |
|---|---|---|---|---|---|
| 1 | `bin/fgos.mjs` | 358 (3.7x the next file) | GitNexus indexes **zero** `Function` symbols on this file even after a fresh reindex (this repo's own `CLAUDE.md`, tsk-38h) -- confirmed tool breakage, not suspicion. Test coverage fragmented into 22 separate `test/cli/fgos-*.test.mjs` files (12666 lines) instead of matching the file 1:1. `runVerb` is 69% of the file in one function. | Mega-function (60-case switch) | Split by verb family into `bin/fgos/<family>.mjs` (work-lifecycle, discovery/plan, pick/worktree-ops, merge/approve, read/report, setup/doctor/tool, session/goal/evolve), `bin/fgos.mjs` kept as a thin barrel dispatching to them -- same template as `tsk-2uf-1`'s `dispatch.mjs` split |
| 2 | `src/state/store.mjs` | 90 | 2nd-highest churn among real code (not counting `command-registry.mjs`'s data-table churn, disqualified below). Central to the work FSM -- every `moveWork` call touches every consumer of item state. `moveWork` alone is 21% of the file. | Mega-function inside an otherwise well-factored file (39 functions total) | Extract `moveWork`'s per-`to`-status branches into a status-family helper module (e.g. group `awaiting-approval`/`blocked`/`delivered` transitions), keep `moveWork` as the dispatcher |
| 3 | `src/runner/loop.mjs` | 63 | Largest single test file among the candidates (2017 lines, still 1:1 with the source file -- less fragmented than `fgos.mjs`, but the file itself is the runner's core dispatch loop, so a regression here has the widest blast radius of any file below rank 1) | Two large functions (`runOnce` 394 lines, `dispatchClaimedItem` 299 lines) plus wave-selection/reap/lock helpers | Split by phase: claim/dispatch mechanics vs. wave-selection/scheduling vs. lock/reap startup, keeping `runOnce`/`runWatch` as the public entry points |
| 4 | `src/setup/registrations.mjs` | 65 (2nd-highest churn of the 8 real-code candidates, after `bin/fgos.mjs`) | Most functions of any candidate (59: 33 `check*`, 8 `fix*`, 18 shared registration/helper infra), but the 41 `check*`/`fix*` ones are each already single-concern -- the scatter is file-level co-location, not function-level tangling, so this is lower urgency than rank 3 despite higher churn | Junk-drawer (many independent concerns, no topic grouping) | Group by check-domain into sibling files (git/shell, config, plugin/marketplace, docs/changelog/decision-index, worker-slots/gate-bypass/iron-law); `registerCheck`/`registerFix`/`registerConfigDefault` stay as the shared registration API |
| 5 | `src/runner/merge.mjs` | 49 | Moderate churn, moderate concentration (`mergeRunnerItemLocked` 16%); concerns span diff/review, decision-index-collision resolution, and merge-under-lock mechanics -- three genuinely different jobs sharing one file | Mixed (one large function + several distinct concern clusters) | Split decision-index-collision handling (`classifyDecisionIndexCollision`/`nextFreeDecisionId`/`renumberDecisionFile`/`resolveDecisionIndexConflict`/`autoResolveDecisionIndexCollision`) out first -- it is the most self-contained cluster; leave merge-lock mechanics for a later pass |
| 6 | `src/runner/worktree.mjs` | 36 (lowest of the real-code candidates) | Junk-drawer shape like `registrations.mjs` but lower churn; 33 functions across branch/ref helpers, checkout reclaim/relocate, resync, create/remove, cleanup | Junk-drawer | Group by lifecycle stage (branch/ref helpers, checkout reclaim, resync, create/remove/cleanup) when this file's churn rises enough to justify the move -- not urgent today |
| 7 | `src/intake/plan.mjs` | 8 (lowest of all 9 files by a wide margin) | Structurally the most concentrated file measured (`resolvePlan` is 50% of the file in one function) but **no live pain today** -- `RESEARCH.md` Round 1 already flagged this; churn this low means nobody is actually getting hurt by it yet | Mega-function, low urgency | Watch, do not act -- revisit if churn rises after `fgos-coding-planning`/`fgos-coding-validating` see more real traffic through `resolvePlan` |

## What NOT to consolidate

`src/cli/command-registry.mjs` (1278 lines, ~60 verb-entry objects, **zero
functions**) is the item's own required negative example (boundary #4:
"một file lớn mà chỉ có một concern... gom nó là chắp vá kiểu ngược"). Its
own file-header comment says it plainly: "Pure data only -- no imports of
verb logic... this file sits at the `kernel` layer." Its churn (122 commits)
is the 2nd-highest of any of the 9 files measured, but every sampled hit is
the same shape -- add one verb's manifest row when a new CLI verb ships.
High churn on a single-concern data table is healthy, expected activity, not
scatter. Splitting it would fragment one logical contract (the CLI's
machine-readable manifest) into arbitrary pieces for no readability or
blast-radius benefit -- excluded from the roadmap above, and excluded from
any future consolidation item.

## Split decision

Pass-through: this item produces the roadmap document above and creates no
work items itself. `fgos-coding-validating`'s single gate cannot materialize
the ranked rows as real children the normal way (step 4 requires each
child's `action` to cite a `CONTEXT.md` D-ID, and this feature has no
`CONTEXT.md` -- discovery's `clear` verdict skipped `exploring` by design).
This matches the item's own boundary line verbatim: "Item này KHÔNG gom gì
cả. Nó đo, xếp hạng, và đẻ ra các item con có thứ tự" is satisfied by the
ranked table itself specifying, per row, the file/concern-shape/split
approach a later `fgos submit` needs -- not by this gate manufacturing
placeholder child items with invented citations. Rank 1 (`bin/fgos.mjs`) is
concrete enough to submit as a real item today using this document's own
"Recommended split" cell as its description; ranks 2-6 the same, in order,
one at a time, never bundled (per RUL11 and the item's own boundary #3).
Rank 7 (`plan.mjs`) and the "What NOT to consolidate" file are explicitly
NOT submit candidates right now.

## Outstanding questions

None
