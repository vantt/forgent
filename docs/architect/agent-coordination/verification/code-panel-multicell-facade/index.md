# Track: code-panel-multicell-facade

- **Plan:** [`plans/260915-code-panel-multicell-facade/plan.md`](file:///home/vantt/projects/code-panel-multicell-facade-p00/plans/260915-code-panel-multicell-facade/plan.md)
- **Track Branch:** `code-panel-multicell-facade`
- **Base Ref:** `45569ac3379445e93436524c1226159b3869265c` (immutable SHA from main after `tsk-1bh` landed)
- **Status:** In-progress (Phase 00 Contract and Baseline active)
- **Capability:** `code:implement`
- **Current Cell:** `P00` ([`current-cell.md`](file:///home/vantt/projects/code-panel-multicell-facade-p00/docs/architect/agent-coordination/verification/code-panel-multicell-facade/current-cell.md))

---

## 1. Context & Architecture Goal

This track delivers the **code-panel multi-cell facade**, making `fgos-code-panel` the single unified entry point for all coding work requiring review and red-team scrutiny:
1. **Direct single-cell requests:** preserve the existing `direct-single-cell` path with no plan bookkeeping ceremony (requests that merely cite or reference a plan/phase path in passing stay direct-single-cell).
2. **Plan-driven multi-cell tracks:** recognize when a plan/phase path is the actual execution target OR an explicit run/resume instruction is given, select `planned-multi-cell` mode, and delegate orchestration entirely to `fgos-plan-loop`.
3. **Coding test-policy overlay:** attach the risk-aware 3-tier test policy (`focused`, `affected`, `full`) to coding cells so tests run efficiently and proofs are reused across identical Git trees and environments.
4. **Cold resumption:** allow a fresh process with zero chat history to resume an in-flight track directly from disk via `fgos-code-panel`.

```text
coding request
  -> fgos-code-panel
       -> direct request: existing single-cell code panel (direct-single-cell)
       -> plan/phase input: fgos-plan-loop track driver (planned-multi-cell)
            -> code-panel policy overlay per cell
            -> shared CoordinationSession / standalone-master-coordination-loop
```

---

## 2. Preconditions & Entry Conditions (Phase 00 Proof)

Phase 00 confirmed all track entry conditions before touching any implementation:
- **`tsk-1bh` engine fix landed:** Commit `9af6362c` (modifying [`src/runner/coordination/session-engine.mjs`](file:///home/vantt/projects/code-panel-multicell-facade-p00/src/runner/coordination/session-engine.mjs)) resolved stuck-failed quorum and stale authorization bugs. It is present in HEAD history (`git merge-base --is-ancestor 9af6362c HEAD`).
- **Terminal close verified:** The session blocked by `tsk-1bh` (`code-implementation-track-policy--p04`) retroactively closed cleanly (`status: "completed"`, `closed: true`) as recorded in commit `99812f28`. This verification relies explicitly on the already-committed trace `99812f28` rather than a fresh in-cell re-run; focused tests (130/130 pass) certify the underlying invariants directly.
- **Focused test suite green:** 130/130 coordination driver authorization and recovery tests pass (`proofs/baseline/terminal-close-tsk-1bh-proof.txt`).
- **Clean worktree separation:** Track base ref is `45569ac3379445e93436524c1226159b3869265c`. The active worktree is dedicated to `code-panel-multicell-facade--p00`.
- **Durable paused-plan inventory recorded:** All paused/stopped tracks (`test-suite-feedback-cost`, `executor-policy-dispatch-seams`, etc.) are catalogued in [`proofs/baseline/paused-plans-inventory.md`](file:///home/vantt/projects/code-panel-multicell-facade-p00/docs/architect/agent-coordination/verification/code-panel-multicell-facade/proofs/baseline/paused-plans-inventory.md).
- **Test execution baseline established:** Baseline counts for focused/affected/full test runs captured in [`proofs/baseline/test-run-counts-baseline.md`](file:///home/vantt/projects/code-panel-multicell-facade-p00/docs/architect/agent-coordination/verification/code-panel-multicell-facade/proofs/baseline/test-run-counts-baseline.md) and full suite baseline in [`proofs/baseline/full-suite-baseline.md`](file:///home/vantt/projects/code-panel-multicell-facade-p00/docs/architect/agent-coordination/verification/code-panel-multicell-facade/proofs/baseline/full-suite-baseline.md).

---

## 3. Explicit Ownership Boundary (R3)

| Domain Responsibility | Owner | Non-Owner | Invariant / Boundary |
|---|---|---|---|
| **User Input Recognition** | `fgos-code-panel` | `fgos-plan-loop` | User requests enter via `fgos-code-panel`. It inspects whether the input is a direct code change, a passing reference, or an explicit plan/phase execution target. |
| **Mode Selection (R2)** | `fgos-code-panel` | `fgos-plan-loop` | Code-panel selects `direct-single-cell` vs `planned-multi-cell`. A request that merely cites or references a plan/phase path in passing (e.g. "fix the bug described in plans/X/plan.md") without run/resume intent stays `direct-single-cell`. Planned mode requires the plan/phase path to be the actual execution target, OR an explicit run/resume instruction (e.g. "run/resume this implementation plan", "execute this track"). Genuinely unresolved or ambiguous intent must be refused or ask for clarification, never silently guessed either way. |
| **Coding Test-Policy Overlay** | `fgos-code-panel` | `fgos-plan-loop` | Code-panel defines the 3-tier test policy (`FOCUSED_TESTS`, `AFFECTED_TESTS`, `FULL_TEST`, `FULL_TRIGGERS`) and passes it into cell dispatches. Generic plans do not require test policy fields. |
| **Track Lifecycle Orchestration** | `fgos-plan-loop` | `fgos-code-panel` | Plan-loop owns the generic track driver loop (`audit -> cell open -> review -> red-team -> fix -> close`). Code-panel never duplicates orchestration code. |
| **Session & Mutation Authority** | `CoordinationSession` runtime | Skills (`fgos-code-panel`, `fgos-plan-loop`) | `session-engine.mjs` and `standalone-master-coordination-loop.yaml` enforce mutation gating, CAS recovery, and quorum close. Skills compose requests; they never bypass engine doors. |
| **Generic / Non-Coding Tracks** | `fgos-plan-loop` | `fgos-code-panel` | Plan-loop can be called directly for tracks outside coding; it remains generic without `trackKind: code` branches. |

---

## 4. Product Gates & Phase Status

| Phase | Cell | Capability | Status | Exit Criteria |
|---|---|---|---|---|
| **00** | [Contract & baseline](p00.md) | `code:implement` | in-progress | `tsk-1bh` terminal-close proof + durable resume inventory + contract assertions; targeted proof |
| **01** | Facade hai mode | `code:implement` | planned | mode/delegation tests pass; projected skills in sync. Full-suite gate if mechanical triggers hit |
| **02** | Coding test-policy overlay | `code:implement` | planned | tier/reuse/escalation fixtures pass; targeted proof |
| **03** | Resume & compatibility | `code:implement` | planned | fresh-process + legacy + direct regressions pass. Full-suite gate if implementation exceeds skill prose |
| **04** | Live proof & rollout | `code:implement` | planned | multi-cell / live resume / direct smoke pass; final integrated `npm test` gate. Full-suite gate |

---

## 5. Verification References

- Cell trace P00: [`p00.md`](file:///home/vantt/projects/code-panel-multicell-facade-p00/docs/architect/agent-coordination/verification/code-panel-multicell-facade/p00.md)
- Current cell status: [`current-cell.md`](file:///home/vantt/projects/code-panel-multicell-facade-p00/docs/architect/agent-coordination/verification/code-panel-multicell-facade/current-cell.md)
- Proof artifacts:
  - [`proofs/baseline/terminal-close-tsk-1bh-proof.txt`](file:///home/vantt/projects/code-panel-multicell-facade-p00/docs/architect/agent-coordination/verification/code-panel-multicell-facade/proofs/baseline/terminal-close-tsk-1bh-proof.txt)
  - [`proofs/baseline/paused-plans-inventory.md`](file:///home/vantt/projects/code-panel-multicell-facade-p00/docs/architect/agent-coordination/verification/code-panel-multicell-facade/proofs/baseline/paused-plans-inventory.md)
  - [`proofs/baseline/test-run-counts-baseline.md`](file:///home/vantt/projects/code-panel-multicell-facade-p00/docs/architect/agent-coordination/verification/code-panel-multicell-facade/proofs/baseline/test-run-counts-baseline.md)
  - [`proofs/baseline/full-suite-baseline.md`](file:///home/vantt/projects/code-panel-multicell-facade-p00/docs/architect/agent-coordination/verification/code-panel-multicell-facade/proofs/baseline/full-suite-baseline.md)
