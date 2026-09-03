# Track: step-09-mvp3-to-mvp5

Plan: `plans/260903-1049-step09-mvp3-to-mvp5/plan.md`
Branch: `step-09-mvp3-to-mvp5`
Base ref: `52a1db76` (HEAD of `main` at track start; `main` had just absorbed
the closed `step-09-group-thinking-mvp1-mvp2` track via merge commit
`52a1db76` itself)
Test command: `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/**/*.test.mjs'`

## Preservation

`git status` at track start (before branch creation) showed a dirty tree,
all pre-existing and unrelated to this plan (left untouched, not committed
by this track): `.agentkit/`, `.claude/agents/*.md` (AgentKit installation
files), `.fgos/events/*.jsonl` (runtime event log artifacts),
`docs/architect/component-boundary/tmp/` (scratch/working draft).

## Baseline

`FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/**/*.test.mjs'` run at
BASE_REF, exit code 1. Full log:
`/tmp/claude-1000/-home-vantt-projects-forgentX/c38dea78-cbe1-41cc-a3c8-53e1dbea5ee9/scratchpad/baseline-test-run.log`
(scratchpad, not committed — see proofs/ for the durable copy once made).
1 known baseline failure, unrelated to this track's surfaces
(`src/runner/coordination/**`, `src/runner/definitions/**`,
`core/coordination-protocols/**`, `src/verbs/coordination/**`):

| # | Test | File | Cause class |
|---|---|---|---|
| 1 | ask/answer round-trip on a genuinely legacy durable-doing item (no claim) | `test/cli/fgos-intake-4.test.mjs:318` | assertion, unrelated (fgos ask/answer, seq-count drift) |

This list may only shrink; any new failure beyond it blocks cell close.
5159 tests, 5152 pass, 1 fail, 6 skipped, duration ~155s.

Note: the predecessor track's baseline (`step-09-group-thinking-mvp1-mvp2/index.md`)
recorded 8 known failures; 7 of those (e2e pr-gate/self-improve wording,
4 intake/plan.test.mjs assertions, the herdr-spawn live-timeout item) are
absent from this run — either fixed upstream or environment-dependent
(the herdr-spawn live timeout in particular is expected to be intermittent,
not a permanent fix). Only the fgos-intake-4 seq-drift failure persisted.
This shrink is recorded as evidence per protocol; it is not this track's
own work.

## Phase / Requirement Matrix

| Phase | MVP | Requirements | Status |
|---|---|---|---|
| 00 | Intake | R1-R4 | done |
| 01 | MVP3 | R1-R8 (see phase file) | done |
| 02 | MVP4 | R1-Rn (see phase file) | missing |
| 03 | Config | R1-Rn (see phase file) | missing |
| 04 | MVP5 | R1-Rn (see phase file) | missing |

## Active Cell

None.

## Next Action

Prepare P02.1 (Phase 02 — MVP4 thin surface launcher).

## Cell Log

| Cell | Requirements | Status | Commit |
|---|---|---|---|
| P00.1 | Phase 00 R1, R2, R3, R4 (closes Phase 00) | done | `95f7971c` |
| P01.1 | Phase 01 R1-R8 (closes Phase 01) | done | pending |

## Phase 01 Status

**CLOSED.** R1-R8 via P01.1, one cell (no split needed). Handoff-first
review (R1) dispositioned each of R2-R8 individually against the closed
MVP1/MVP2 track's own proof (`P03.1.md`): R3, R5, R7, R2's
artifact-revision-link half, R6, and 3 of R8's 5 negative-semantics cases
(missing authorization, reused invocation key, terminal-session-at-engine-
level) accepted unchanged, no source touched, cited directly.

One genuine gap closed: `recordDriverDisposition` (`store.mjs`) had no
check that a disposition's `targetRef`/`evidenceRefs` resolve to a ref this
session actually owns (`P00.1.md`'s Carried-Forward Gap #9, and the phase
file's own named Tests-First bullet). Added `assertDispositionRefOwnedBySession`,
mirroring `session-engine.mjs`'s existing `assertRefsOwnedBySession`
pattern (existence-based, not naming-convention — the class of bug this
track's predecessor repeatedly found and fixed), with 4 new
mutation-verified tests.

Two more R8 negative cases (unknown target, stale/nonexistent artifact ref)
were already engine-proven but had no door-level (CLI/request) test; 2 new
tests added to `test/verbs/coordination-run-driver-steps.test.mjs` — outside
Phase 01's literal Files list, Coordinator-confirmed acceptable since
P03.2 itself established that file as the door-level test home for this
exact surface.

Deferred, with reasoning, not fixed: R2's prior-finding/verdict lineage
stays artifact-revision-scoped/best-effort (already ruled on by P03.1's own
Coordinator, MEDIUM-3 — not re-litigated, no new evidence); R8's
terminal-session case has no door-level test because it is structurally
unreachable through `run.mjs`'s current open-once/close-once control flow
without a resume door (Phase 04/MVP5's own future work, per `P00.1.md`
Gap #17).

Reviewer round (APPROVE, 1 LOW — stale line-number citations in the new
door-level test file, cosmetic, tests genuinely exist and cover the
claims) run in parallel with Red-Team round (APPROVE, 2 LOW — one
corroborating the same stale-citation finding independently, one noting
the trace's stated reasoning for closing gap #9 vs. deferring gap #8 was
asymmetric even though the underlying calls are both correct). 0 HIGH,
0 MEDIUM from either round; all 7 Red-Team attacks (bypass, over-refusal,
under-refusal/naming-convention-class, test vacuity, R2 re-litigation,
terminal-session reachability, scope escape, lock discipline) held. No fix
round required — 3 LOW findings recorded as follow-up, not blocking close.

Retry (`run-retried`) machinery untouched throughout — zero diff.
`group-cognition-framework.yaml` untouched. No Work/git/coding-domain
mutation path touched. Full suite: 5165 tests, 5158 pass, 1 fail — exactly
the track's recorded baseline (`test/cli/fgos-intake-4.test.mjs:318`); no
new failure. Focused glob (`test/runner/coordination*.test.mjs`) 314/314.

Next: P02.1 (Phase 02 — MVP4, thin surface launcher).

## Phase 00 Status

**CLOSED.** R1-R4 via P00.1. Froze the real, source-verified MVP1/MVP2 shape
(not the discussion proposal) into
`docs/architect/agent-coordination/verification/step-09-mvp3-to-mvp5/P00.1.md`:
fixture id/version, authorization event shape, assignment provenance shape,
context grant behavior, artifact ref behavior, and bounds behavior, each
cited to file+line and cross-checked against live source
(`standalone-master-coordination-loop.yaml`, `run.mjs`, `show.mjs`) rather
than trusting docs alone. All 18 predecessor "Forward Notes" entries plus 2
thin-launcher-readiness gaps classified by relevance to this plan's phases
(00/01-MVP3/02-MVP4/03-Config/04-MVP5) and severity (blocker /
design-decision-needed / pure-forward-note) — zero blockers. All 5 of
plan.md's Entry Conditions confirmed satisfied with direct evidence,
including git-log confirmation `group-cognition-framework.yaml` carries
exactly one commit (`833888ba`) since Step 08.

Went through 1 Reviewer round (APPROVE WITH CONCERNS: 1 MEDIUM + 4 LOW, all
citation-precision — a quote mis-attributed to `index.md` that was actually
the fixture's own header comment, plus off-by-one line citations and minor
quoting/rounding imprecisions) run in parallel with 1 Red-Team round
(APPROVE WITH CONCERNS: 1 MEDIUM + 2 LOW — Entry Condition 5's justification
overclaimed "every round ended in CONFIRMED-RESOLVED" when two predecessor
findings, Phase 01's `cohort-planner.mjs` HIGH and Phase 02's P02.1 MED-2,
were actually deliberately deferred and carried forward, not resolved; both
gaps were already correctly captured in the Carried-Forward Gaps table, so
this was a self-certification overclaim in the prose only, not a dropped
gap). No HIGH from either round. Both MEDIUMs + all 6 LOWs fixed by a single
Fixer pass (docs-only, single file); Reviewer-recheck and Red-Team-recheck
both ran in parallel against the combined post-fix text and independently
re-derived every corrected citation from live source — both APPROVE, all 8
findings CONFIRMED-RESOLVED, no new issue introduced.

No source under `src/`, `core/`, or `test/` touched. No predecessor
(`step-09-group-thinking-mvp1-mvp2`) verification file touched. Docs-only
cell throughout; full suite not required (Tests First: `git diff --check`
only, exit 0 before and after fix).

Next: P01.1 (Phase 01 — MVP3, recheck lineage and driver disposition
hardening/acceptance).
