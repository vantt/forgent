# Brief: Land latency budget (owner decision)

Date: 2026-10-20 06:53 Asia/Saigon. Session `ac420727` (second machine). Evidence: host E3 run of commit `fdb4fdf59` against `origin/main`, two interleaved runs each, idle host, `powersave` governor; lead report `phase-lead-261020-0537-git-p06b-typed-operation-perf.md`.

## What is happening

The owner-set E3 budgets (`plans/261018-0914-git-component-fgos-git/e3-budgets.md`) give two typed operations a ratio against today's code on the same fixture:

| Operation | Budget (p95 ratio) | main | after the spawn work (`fdb4fdf59`) |
|---|---|---|---|
| ScopedCommit vs `commitUnitWork` | ≤ 1.5 | 1.62 / 1.58 | **1.46 / 1.35 — passes** |
| Land prepare + publish vs `mergeRootIntoMainCas` | ≤ 1.2 | 8.62 / 7.78 | **6.63 / 6.42 — fails** |

Land p95 is about 1.43–1.46 s; today's merge path is about 0.22 s. Prepare is about 0.77 s, publish about 0.60 s (p50).

## Cause

Land does what the old merge path does not: it builds the candidate in an isolated detached worktree, pins source/target/candidate, writes a durable WAL with fsync barriers, takes three locks in the R30 order, checks the own-file-set clean gate twice, and records recovery fingerprints so that every crash point is recoverable (57 kill points tested). That costs 100 Git spawns against 23 today.

Measured per spawn on this host: uncontained 3.1 ms, borrowed 3.7 ms, **contained (bwrap pid namespace) 10.8 ms**. About 65 of Land's spawns are contained, so containment alone is about 0.5 s (37%) of Land. All Git spawns together are about 0.82 s (60%); WAL writes, fsync barriers and lock checks are the remaining 0.54 s. Even with free containment Land would be about 4.6× today's path. Batching further cannot reach 1.2× without removing a safety property.

## Options

| Option | Cost | Result |
|---|---|---|
| **A. Keep every safety property; replace the Land ratio with an absolute budget p95 ≤ 1.6 s on this host class, and keep the ratio as a reported number.** Then one follow-up to cut containment (see C). | Spec/budget edit only. | Phase 07 can proceed. Land adds about 1.2 s per landed unit, once per unit, not per commit — small next to an agent run that takes minutes. |
| B. Keep 1.2× and fund a new backend (in-process Git or a long-lived Git helper) plus operation-scoped containment. | Large: new design, review, cross-platform proof; days to weeks; may still miss because of the fsync floor. | Blocks phase 07 until done. |
| C. Operation-scoped containment: one contained domain per operation instead of one per Git child, for read-only children inside an already held custody. | Medium: Process/holder-lock design change, its own review. | About −0.4 to −0.5 s on Land (to ~0.95 s, ~4.3×). Still above 1.2×. Useful together with A. |
| D. Weaken Land toward the old path (fewer pins, no candidate isolation, fewer barriers). | Small code change. | Loses crash recoverability that the reviews required. Not recommended. |

## Recommendation

**A, with C recorded as a follow-up idea (RUL104: add only if the owner picks it).** Reasons: priority order puts correctness (DoD) below Ship Faster, but the extra 1.2 s is paid once per landed unit while the safety it buys removes whole classes of stuck or corrupted landings that today cost human time. ScopedCommit, which runs on every commit, already passes its budget.

## Scope of the answer

This decides the Land latency budget for phase 07 (runner Land switches to the typed port) on Linux. It does not change ScopedCommit's budget, the publication CAS budgets, or any safety property. Option C, if chosen, becomes its own unit after phase 07 starts.
