# Paused & Stopped Plans Inventory (Requirement R4)

Recorded: 2026-09-15  
Base Reference: `45569ac3379445e93436524c1226159b3869265c`  
Authority: `plans/260915-code-panel-multicell-facade/phase-00-contract-and-baseline.md` (R4)

This inventory records every currently paused, in-progress, or completed plan under `plans/` with an open cell-status table or active execution state. Reconstructed from live, fresh commands run directly against the filesystem, git repository, and coordination engine (`fgos coordination chain <track> --json`, `fgos coordination show <session> --json`, `git rev-parse`, `git log`). It provides a durable, cold-resumable snapshot so a fresh process can determine the exact next cell and resumption path without relying on ephemeral chat context.

---

## 1. Active & Paused Plans Inventory Table

| Plan Path | Status Marker | Current / Next Cell | Coordination Chain / Session ID | Last Merged Commit / Branch Tip | Worktree & Git Cleanliness | Valid Proofs |
|---|---|---|---|---|---|---|
| `plans/260915-0455-test-suite-feedback-cost/` | `PAUSED (OOM contention)` (in-flight on worktree branches) | **P02** (P00 & P01 merged into track; P02 branch active) | `cells: []` (run outside `.fgos/coordination/sessions/` via manual worktrees) | Track tip: `2c56eed8` (synced main). P02 tip: `456bff9b` (synced track). Last merged cell commit: `bd56ae02` (P01) | Worktrees: `test-suite-feedback-cost-track`, `...-p00`, `...-p01`, `...-p02`. All clean except expected `target` symlink build artifact | P00 hermetic writer proof (`8376385c`), P01 portable test runner proof (`bd56ae02`), checkpoint 1 full-suite run (`4149bd31`) |
| `plans/260915-executor-policy-dispatch-seams/` | `Cell-00 merged to track; next: cell-01` | **cell-01** (Phase 01 dispatch decision matrix; cell-00 merged) | `executor-policy-dispatch-seams--cell-00` (status: `partial`, phase: `partially-complete`, cell-00 closed) | Track tip: `3bc87899` (post-merge verification). Cell-00 commit `c6a2a57c` merged into track at `282fd62e`, track synced main at `48a01a20` | Worktree `/home/vantt/projects/executor-policy-dispatch-seams-track` on branch `track/executor-policy-dispatch-seams`. Clean | Baseline snapshot harness passing (46/46). Doer, reviewer, and red-team completed; fixer omitted per partialPolicy; tree-identical proof certified |
| `plans/260914-dispatch-operability-evidence-attribution/` | `Implementation in progress` | **I05** (I01–I04 merged into track, I05 active/next) | `dispatch-operability-implementation--i05b` (status: `active`, phase: `running`, activeCell: `i05b`) | Cell branch tip: `50d4009e`. Track branch `implementation-track--dispatch-operability-evidence-attribution` tip: `3c58bafc` (synced main). I01-I04 merged | Worktree on branch `dispatch-operability-implementation--i05`. Clean | I01–I04 verification traces green. I05 retry produce-candidate commit `50d4009e` addresses red-team TOCTOU and active-Run findings |
| `plans/260915-code-implementation-track-policy/` | `COMPLETE / DONE` (all cells P01-P05 merged to main) | **Closed / All Done** (predecessor track to `code-panel-multicell-facade`) | `code-implementation-track-policy--p01` through `--p05` (P04 retroactively closed via `9af6362c`; P05 closed at `99fb5632`) | `45569ac3` (full track merge commit to `main`) | Worktree merged and cleaned up; worktree `code-panel-multicell-facade-p00` branched from tip | Complete proof traces for P01-P05 under `docs/architect/agent-coordination/verification/code-implementation-track-policy/` |
| `plans/260915-code-panel-multicell-facade/` | `APPROVED — in-progress` | **P00** (Contract và baseline, currently active) | `code-panel-multicell-facade--p00` | Base ref `45569ac3379445e93436524c1226159b3869265c` | Worktree `/home/vantt/projects/code-panel-multicell-facade-p00` on branch `code-panel-multicell-facade--p00`. Docs/evidence-only cell | Terminal close proof for `tsk-1bh` verified (130/130 pass); full-suite baseline captured (6467 pass, 52 fail) |

---

## 2. Explanation of Branch `code-panel-multicell-facade--p04`

The local branch `code-panel-multicell-facade--p04` (tip commit `b16dd524621cbf97690663e9764f9ede286583be`, "fix(coordination): supersede orphaned authorization with newer consumed siblings") is **not an unexplained stray branch**. It is this SAME track's own parallel engine-bugfix cell (`session-engine.mjs` orphaned-authorization fix), dispatched independently and concurrently with P00–P03 per [`plans/260915-code-panel-multicell-facade/phase-04-fix-orphaned-authorization.md`](file:///home/vantt/projects/code-panel-multicell-facade-p00/plans/260915-code-panel-multicell-facade/phase-04-fix-orphaned-authorization.md). It will integrate into the track alongside the facade deliverables before final rollout.

---

## 3. Detailed Per-Plan Status & Resumption Guidance

### A. `plans/260915-0455-test-suite-feedback-cost/`
- **Plan Document:** [`plans/260915-0455-test-suite-feedback-cost/plan.md`](file:///home/vantt/projects/code-panel-multicell-facade-p00/plans/260915-0455-test-suite-feedback-cost/plan.md)
- **Current P-cell:** **P02** (`phase-02-green-baseline-and-profile.md`).
- **Live Branch Tips & Commits:**
  - Track branch `test-suite-feedback-cost`: tip `2c56eed8c40325db6113bbcac84fa17bb6457e92` ("merge: sync main into track before P02 resume").
  - P00 branch `test-suite-feedback-cost--p00`: tip `8376385c1de8fe0713f506aa9efcb7224ebbe0a8` (merged into track).
  - P01 branch `test-suite-feedback-cost--p01`: tip `bd56ae029b674e21f8092b0095461cb9653f5fa2` (merged into track).
  - P02 branch `test-suite-feedback-cost--p02`: tip `456bff9bd844855d83721022fd7db8616cf6bc76` ("merge: sync track (incl. main) into P02 before resuming baseline"), following `bbbbe1fc` ("docs(test-suite-feedback-cost): record P02 pause status (OOM contention)").
- **Coordination Status:**
  - `fgos coordination chain test-suite-feedback-cost --json` returns `cells: []`.
  - Operated directly via dedicated git worktrees rather than declared `.fgos/coordination/sessions/` records.
- **Resumption Action for Fresh Process:**
  - Switch to worktree `/home/vantt/projects/test-suite-feedback-cost-p02`.
  - Run the 3 isolated baseline samples + profile per P02 brief.
  - Merge P02 into `test-suite-feedback-cost-track`, then open P03.

---

### B. `plans/260915-executor-policy-dispatch-seams/`
- **Plan Document:** [`plans/260915-executor-policy-dispatch-seams/plan.md`](file:///home/vantt/projects/code-panel-multicell-facade-p00/plans/260915-executor-policy-dispatch-seams/plan.md)
- **Current / Next Cell:** **cell-01** (`phase-01-dispatch-decision-matrix.md`). Cell-00 (`phase-00-baseline-snapshot.md`) has closed and merged into the track.
- **Live Branch Tips & Merged Commits:**
  - Track branch `track/executor-policy-dispatch-seams`: tip `3bc878994a09f78aa375555f82e1e3e7a3f89503` ("chore(executor-policy-dispatch-seams--cell-00): post-merge verification").
  - Cell-00 branch `executor-policy-dispatch-seams--cell-00`: tip `c6a2a57c53b121c2d3ff5d99c319a92b00963300` ("Fix promptDelivery default, resourceBindings shape, and dead confinement branch in baseline snapshot test").
  - Merge commit into track: `282fd62e2bba7a7ea960ba3c109a0e4d5b363376` ("merge(executor-policy-dispatch-seams--cell-00): land Phase 00 baseline snapshot harness").
  - Main-to-track sync commit: `48a01a20f28c6c03fab7e7a4a7b45197e861f85e` ("merge(executor-policy-dispatch-seams): sync main into track").
- **Live Coordination Engine Status:**
  - Session ID: `executor-policy-dispatch-seams--cell-00`
  - Manifest location: `.fgos/coordination/sessions/executor-policy-dispatch-seams--cell-00/session.json`
  - Status: `partial`, phase: `partially-complete`
  - Quorum (`fgos coordination show executor-policy-dispatch-seams--cell-00 --json`):
    - `completed`: `doer` (`asgn_lead_executor_policy_dispatch_seams_op_005`), `reviewer` (`asgn_lead_executor_policy_dispatch_seams_op_006`), `red-team` (`asgn_lead_executor_policy_dispatch_seams_op_008`)
    - `missing`: `fixer` (permitted by `partialPolicy.allowedOmissions: ["fixer"]`)
    - `failed`: `[]`, `late`: `[]`, `replaced`: `[]`
  - `fgos coordination chain executor-policy-dispatch-seams --json` reports `activeCell: null`, `nextAction: null` (cell-00 closed).
- **Resumption Action for Fresh Process:**
  - Cell-00 is complete, merged, and post-merge verified. Open Phase 01 (`phase-01-dispatch-decision-matrix.md`) on `track/executor-policy-dispatch-seams`.

---

### C. `plans/260914-dispatch-operability-evidence-attribution/`
- **Plan Document:** [`plans/260914-dispatch-operability-evidence-attribution/plan.md`](file:///home/vantt/projects/code-panel-multicell-facade-p00/plans/260914-dispatch-operability-evidence-attribution/plan.md)
- **Current / Next Cell:** **I05** (I01 through I04 are completed and merged into track; I05 is next and currently active).
- **Live Branch Tips & Merged Commits:**
  - Track branch `implementation-track--dispatch-operability-evidence-attribution`: tip `3c58bafc020a49c1e6cbfe7fcfb3a189885a47cb` ("merge: sync dispatch-operability-implementation track with main", synced with main `45569ac3`).
  - Cell branch `dispatch-operability-implementation--i05`: tip `50d4009e8d17734d96ea5e0f72a83aeaf70ef4f3` ("fix(dispatch): close reconcile TOCTOU gap at writer parity, wire active-Run gate").
- **Live Coordination Engine Status:**
  - Session IDs: `dispatch-operability-implementation--i05` and active retry session `dispatch-operability-implementation--i05b`.
  - `fgos coordination chain dispatch-operability-implementation --json`:
    - `activeCell`: `i05b`
    - `nextAction`: "Cell \"i05b\" (session \"dispatch-operability-implementation--i05b\") has 3 declared operation(s) still awaiting driver authorization: phase-revision/revise-candidate, phase-recheck/reviewer-recheck, phase-recheck/red-team-recheck."
  - Session `dispatch-operability-implementation--i05b` status: `active`, phase: `running`.
- **Resumption Action for Fresh Process:**
  - Settle / complete session `dispatch-operability-implementation--i05b`, authorize reviewer and red-team rechecks on `50d4009e`, and merge I05 into the track branch upon clean close.

---

### D. `plans/260915-code-implementation-track-policy/`
- **Plan Document:** [`plans/260915-code-implementation-track-policy/plan.md`](file:///home/vantt/projects/code-panel-multicell-facade-p00/plans/260915-code-implementation-track-policy/plan.md)
- **Status:** **COMPLETE / DONE** (all cells P01–P05 merged to `main`).
- **Track Merge Commit:** `45569ac3379445e93436524c1226159b3869265c` ("merge(code-implementation-track-policy): land the full track (P01-P05)") on `main`.
- **Coordination Status:**
  - Sessions `code-implementation-track-policy--p01` through `--p05` fully accounted for.
  - P04 retroactively closed via fixed engine commit `9af6362c` (recorded in `99812f28`).
  - P05 merged at `99fb5632`, and the entire track merged into `main` at `45569ac3`.
- **Resumption Action for Fresh Process:**
  - None required: track is closed, merged, and archived. Predecessor to `code-panel-multicell-facade`.

---

## 4. Survey of Other Historical Tracks

| Plan / Track | Location | Status | Summary of State |
|---|---|---|---|
| `260905-architecture-advisory-panel` | `plans/260905-architecture-advisory-panel/plan.md` | `PLANNED, not started` | Pre-implementation plan for advisory panel. No active worktrees or coordination sessions. |
| `260910-1243-confinement-authority-implementation` | `plans/260910-1243-confinement-authority-implementation/plan.md` | `COMPLETE` | P00-P08 all merged to branch, merged to main in commit `0f501a77`. |
| `260911-2305-runtime-recovery` | `plans/260911-2305-runtime-recovery/plan.md` | `CLOSED` | P00-P08 all merged to main. |
| `260914-dispatch-operability-evidence-attribution` (Design) | `plans/260914-dispatch-operability-evidence-attribution/plan.md` | `READY` (design closed) | Design cells D00-D06 all merged to main at `1cb448a6`. Implementation track continues under `dispatch-operability-implementation` (I05 active). |
| `260910-1700-rust-host-r1-kernel` | `plans/260910-1700-rust-host-r1-kernel/plan.md` | `COMPLETE` | P00-P16 all merged to main at `817ac7f3`. |
| Packaging-Distribution Rollout (`pd-*`) | `docs/platform/packaging-distribution/code-panel-rollout-plan.md` | `DONE` | Packets P1-P9 merged to main. Residual `pd-*` worktrees exist on disk as completed references or preview checkouts. |
