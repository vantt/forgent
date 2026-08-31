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
| P02 | R5–R6 | missing | P02.2 | — |
| P02 | R7–R8 | missing | P02.3 | — |
| P03 | R1–R2 | missing | P03.1 | — |
| P03 | R3 | missing | P03.2 | — |
| P03 | R4–R6 | missing | P03.3 | — |

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

## Active Cell

None. P02.1 closed 2026-08-31 (commit `0fdd61d9`).

## Next Action

Prepare cell P02.2 (R5-R6: interpretation reads stamped fields instead of
operation-id switching; G3 dirty-before persistence) — per plan.md's own
"land R1-R4 first, prove goldens, then R5-R8" ordering, now that P02.1's
goldens are proven.
