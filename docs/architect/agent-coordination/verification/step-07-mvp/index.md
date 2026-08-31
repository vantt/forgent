# Track: step-07-mvp

Document type: Verification
Design status: N/A
Implementation: Active
Last reviewed: 2026-08-31
Canonical for: step-07-mvp track status board

Plan: `plans/260831-1637-step07-inline-assignment-mvp/plan.md`
BRANCH: `step-07-mvp`
BASE_REF: `c425fe6e7dce8db683cbc92fd0bb61d6245fca6b` (main, 2026-08-31)
Test command: `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/**/*.test.mjs'`

## Known Baseline Failures (recorded before Cell 1)

Full run, 2026-08-31, exit 1. 9 failing tests total.

| Test | File | Cause |
|---|---|---|
| `import một chiều xuống: không file nào import ngược lên tầng trên` | `test/architecture.test.mjs:134` | G1 — `assignment-runner.mjs` imports `src/intake/plan.mjs`. Fixed by Phase 01 R1 (this plan's own target, not a pre-existing unrelated gap). |
| `resolvePlan skips the risk-heavy gate when the verdict cites a real locked decision...` | `test/intake/plan.test.mjs:953` | G2 — `resolvePlan` `.fgos` basename assumption. Separate item per plan.md, not in this plan's scope. |
| `resolvePlan skips requiring a verdict...mode "tiny"` | `test/intake/plan.test.mjs:1198` | G2, same cause. |
| `resolvePlan skips for mode "small" too...` | `test/intake/plan.test.mjs:1215` | G2, same cause. |
| `resolvePlan caller-supplied decompose verdict: an uncovered locked-decision path...` | `test/intake/plan.test.mjs:1588` | G2, same cause. |
| `ask/answer round-trip on a genuinely legacy durable-doing item...` | `test/cli/fgos-intake-4.test.mjs:318` | G7 — known flake, ask/answer round-trip. Not in this plan's scope. |
| `e2e pr-gate (a) runner item full loop...` | `test/e2e/pr-gate.test.mjs` | G4 — verify-skip via `branchHeadAtReturn` (security-relevant, separate item). |
| `e2e self-improve loop full contract (D1-D17)...` | `test/e2e/self-improve-loop.test.mjs:325` | G4, same cause (`verify skipped: the merged tree is identical...`). |
| `herdr-spawn adapter (LIVE): dispatch a real agy-herdr interactiveMode executor...` | `test/runner/herdr-spawn-adapter.test.mjs:562` | Environment — live test needs real herdr binaries, unavailable in this session. Unrelated to plan scope (herdr-spawn work is explicitly deferred until interactive+cli-spawn proofs close, per plan.md mechanism/driver priority). |

Baseline list may only shrink (G1's entry is expected to close once P01.1
lands; G2/G4/G7/herdr-live stay open, out of this plan's scope, and must not
grow).

## Unrelated Working-Tree State At Track Start

Noted, not touched by this track: `.agentkit/`, `.claude/agents/*.md`,
`.fgos/events/*.jsonl`, `plans/reports/reviewer-cell-6-6-...-report.md`
(untracked, pre-existing before branch creation).

## Phase / Requirement Matrix

| Phase | Req | Status | Cell | Evidence |
|---|---|---|---|---|
| P01 | R1 (G1) | done | P01.1 | `P01.1.md`, commit `07f2d943` |
| P01 | R2 (G6) | done | P01.1 | `P01.1.md`, commit `07f2d943` |
| P01 | R3 (G5) | done | P01.2 | `P01.2.md`, commit `d97837d3` |
| P01 | R4 | done | P01.2 | `P01.2.md`, commit `d97837d3` |
| P01 | R5 | done | P01.2 | `P01.2.md`, commit `d97837d3` |
| P02 | R1–R4 | done | P02.1 | `P02.1.md`, commit `0fdd61d9` |
| P02 | R5 | done | P02.2 | `P02.2.md`, commit `d2df76cc` |
| P02 | R6 (G3) | done | P02.3 | `P02.3.md`, commit `b262ced1` |
| P02 | R7 | done | P02.4 | `P02.4.md`, commit `cfe60bfb` |
| P02 | R8 | missing | P02.5 | — |
| P03 | R1–R2 | missing | P03.1 | — |
| P03 | R3 | missing | P03.2 | — |
| P03 | R4–R6 | missing | P03.3 | — |

Cell split deviates from plan.md's suggested "P02.2 (R5+R6), P02.3
(R7+R8)" — Coordinator split R5/R6 into separate cells (P02.2, P02.3)
after reading `interpretAssignmentRunResult`/`findLatestAssignmentRunResult`
directly: ~420 and ~300 lines respectively, carrying explicit
tamper-detection/monotonic-re-derivation security invariants; bundling R5's
broad dispatch-key rewrite with R6's narrow dirty-before-persistence fix in
one cell risked one change masking a regression in the other. R7/R8 shift
to P02.4. Total cell count for Phase 02 rises from 3 to 4; this is a
tactical cell-sizing decision within Coordinator authority, not a scope
change to the plan's requirements.

## ADR Traceability

Populated in Phase 03 per plan requirement R6.

## Follow-Ups (Out Of Scope, Logged For Later Phases)

- Run-attempt-dir allocation race (`assignment-runner.mjs:618-634`):
  `readdirSync`/`existsSync`/`mkdirSync({recursive:true})` is not atomic;
  two concurrent `executeAssignment()` calls could claim the same `runs/NN`
  dir and silently mix evidence. Pre-existing, found by P01.1 Red-Team
  (RT-2, LOW, deferred). Fix direction: `mkdirSync` without `recursive`,
  retry next number on `EEXIST`. Pick up whenever a future phase next
  touches this function.
- `loop.mjs`'s planning sweep still computes its own plan-verdict directly
  (`resolveContentRoot` + `readFileSync` + `planVerdictFromPlanMd`, from
  Cell P01.2) instead of consuming `executeDriverOperationChoice`'s new
  `outcome.verdictPayload` field (P02.2's `onAdvance` wiring, which is
  correct in isolation but currently dead output on the real end-to-end
  path). Found by P02.2 Review (MEDIUM-2, deferred). Consolidate once
  R6/R7/R8 have finished changing this same interpretation surface, so the
  consolidation isn't redone mid-phase.
- P02.1's `RESULT_KIND_BY_OPERATION`/`EVIDENCE_REQUIRED_BY_OPERATION`
  tables stamp the same `resultKind` for `scout-blast-radius`/
  `resolve-question` (`advisory`) and for `fix-verify-red`/`scoped-subtask`
  (`work-product`), forcing P02.2's `interpretAssignmentRunResult` to add
  `operation` as a compound secondary key for those four branches — R5's
  ADR-006 §3 intent ("replacing `operation === ...` branches") is only
  fully realized for 2 of 6. Found by P02.2 Review (MEDIUM-3, accepted as
  a design trade-off, not reopened since P02.1 is already closed/verified).
  Widen the tables for finer-grained `resultKind` values if a future phase
  wants full realization.
- `findLatestAssignmentRunResult`'s two cross-pass callers
  (`chooseStageOperation`) never receive the real, disk-persisted
  `resultKind`/`mutation`/`evidence` fields it already reads during its own
  filter step — `interpretAssignmentRunResult` re-derives them fresh via
  `fallbackResultKindForOperation` instead. Found by P02.2 Red-Team
  (MEDIUM-4). Currently zero live impact (deterministic re-derivation
  matches the persisted value under the one existing `normalizerVersion`);
  becomes a real staleness risk the first time `assignment-normalizer.mjs`'s
  tables gain a second version. Fix direction: have
  `findLatestAssignmentRunResult` attach a `{resultKind, mutation,
  evidence}` slice (never the whole raw `assignment.json`) onto its
  returned `runResult` as `.assignment`. Deferred rather than fixed now
  because it touches the return shape of the codebase's highest
  tamper-detection-sensitivity function for a presently zero-impact issue.

## Active Cell

None. P02.4 closed 2026-08-31 (commit `cfe60bfb`). R7 done — this cell
grew substantially beyond its original scope: R7's own files, plus 3
rounds of finding-and-fixing the same "raw read-back bypasses the
normalizer" bug class at 4 locations (`operation-choice.mjs`,
`mission-lite.mjs`, `cli.mjs`, and finally the structurally-correct root
cause in `assignment-runner.mjs`'s `executeAssignment` itself). 2 Review
rounds, 2 Red-Team rounds, all found real issues, all fixed and
re-verified. Phase 02 now R1-R7 done; only R8 (P02.5) remains.

## Next Action

Prepare cell P02.5 (R8: mission-lite migration onto the inline path,
stop copying assignment.json/result JSON into `.fgos/missions/`,
`validateAssignmentLegality` accepting inline-shaped Assignments — the
piece this cell's own split explicitly deferred).
