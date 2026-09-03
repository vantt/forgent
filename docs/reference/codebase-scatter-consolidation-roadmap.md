---
authoritative_for: codebase scatter consolidation roadmap, RUL11-ranked file consolidation candidates, what not to consolidate
---

# Codebase scatter consolidation roadmap

`tsk-3wl5` applied `docs/explanation/rul11-tum-lum-doctrine.md`'s
principle beyond `src/runner/dispatch.mjs` (already split by `tsk-2uf-1`):
measured every large file in `src/`+`bin/` for real scatter (concern
concentration, churn, confirmed tool breakage), ranked by real pain — not
raw line count — and produced a one-file-per-future-item roadmap. This
item **surveyed only** — it changed no code; each rank below is meant to
become its own future `fgos submit`, never bundled with another.

## Two scatter shapes, two different fixes

1. **Mega-function hiding many concerns** (`bin/fgos.mjs`'s `runVerb`,
   `src/intake/plan.mjs`'s `resolvePlan`, `store.mjs`'s `moveWork`) — the
   same shape `dispatch.mjs` had before `tsk-2uf-1`. Fix: extract by
   concern into concern-named sibling files, keep the original path as a
   barrel re-export (`docs/reference/dispatch-module-boundaries.md` is the
   template).
2. **Many small single-purpose functions with no topic grouping**
   (`registrations.mjs`'s 41 `check*`/`fix*` functions, `worktree.mjs`'s
   33 lifecycle helpers) — a "junk drawer," not a mega-function. Fix: group
   by topic into sibling files, not extract-one-function.

## Ranked roadmap

| Rank | File | Churn (commits) | Pain evidence | Shape | Recommended split |
|---|---|---|---|---|---|
| 1 | `bin/fgos.mjs` | 358 (3.7x the next file) | GitNexus indexes **zero** `Function` symbols on this file even after a fresh reindex (`CLAUDE.md`, `tsk-38h`) — confirmed tool breakage. Test coverage fragmented into 22 separate `test/cli/fgos-*.test.mjs` files. `runVerb` alone is 69% of the file. | Mega-function (60-case switch) | Split by verb family into `bin/fgos/<family>.mjs` (work-lifecycle, discovery/plan, pick/worktree-ops, merge/approve, read/report, setup/doctor/tool, session/goal/evolve); keep `bin/fgos.mjs` as a thin barrel |
| 2 | `src/state/store.mjs` | 90 | 2nd-highest real-code churn; central to the work FSM — every `moveWork` call touches every consumer of item state; `moveWork` is 21% of the file | Mega-function inside an otherwise well-factored file | Extract `moveWork`'s per-`to`-status branches into a status-family helper module, keep `moveWork` as dispatcher |
| 3 | `src/runner/loop.mjs` | 63 | The runner's core dispatch loop — widest blast radius of any file below rank 1 | Two large functions (`runOnce` 394 lines, `dispatchClaimedItem` 299 lines) | Split by phase: claim/dispatch mechanics vs. wave-selection/scheduling vs. lock/reap startup |
| 4 | `src/setup/registrations.mjs` | 65 | Most functions of any candidate (59), but the 41 `check*`/`fix*` ones are each already single-concern — scatter is file-level co-location, not tangling, so lower urgency than rank 3 despite higher churn | Junk-drawer | Group by check-domain (git/shell, config, plugin/marketplace, docs/changelog/decision-index, worker-slots/gate-bypass/iron-law) |
| 5 | `src/runner/merge.mjs` | 49 | Moderate churn/concentration; three genuinely different jobs share one file (diff/review, decision-index-collision resolution, merge-under-lock mechanics) | Mixed | Split decision-index-collision handling out first (most self-contained cluster); leave merge-lock mechanics for later |
| 6 | `src/runner/worktree.mjs` | 36 (lowest of the real-code candidates) | Junk-drawer like rank 4 but lower churn; 33 functions across branch/ref/checkout/resync/create/cleanup | Junk-drawer | Group by lifecycle stage — not urgent today |
| 7 | `src/intake/plan.mjs` | 8 (lowest of all 9 files) | Most structurally concentrated file measured (`resolvePlan` is 50% of the file) but **no live pain today** — churn this low means nobody is actually hurt by it yet | Mega-function, low urgency | Watch, do not act — revisit if churn rises |

## What NOT to consolidate

`src/cli/command-registry.mjs` (1278 lines, ~60 verb-entry objects, **zero
functions**) is the item's own required negative example. Its own
file-header comment: "Pure data only." Churn is the 2nd-highest of any of
the 9 files measured, but every hit is the same shape — add one verb's
manifest row when a new CLI verb ships. High churn on a single-concern
data table is healthy activity, not scatter — splitting it would fragment
one logical contract into arbitrary pieces for no benefit. A large file
with one genuine concern is not a consolidation candidate; only a large
file mixing multiple concerns is.

## Status as of this synthesis

None of the ranked rows have been acted on yet — no `tsk-3wl5`-descended
child item exists. `bin/fgos.mjs` (rank 1) has grown further since
measurement, from 4215 lines to (as of this synthesis) roughly 4990 —
still an open, and now larger, first candidate for a future `fgos submit`
using this document's own "Recommended split" cell as its description.
