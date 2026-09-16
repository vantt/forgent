# Track: code-panel-multicell-facade

- **Plan:** [`plans/260915-code-panel-multicell-facade/plan.md`](file:///home/vantt/projects/code-panel-multicell-facade-p00/plans/260915-code-panel-multicell-facade/plan.md)
- **Track Branch:** `code-panel-multicell-facade`
- **Base Ref:** `45569ac3379445e93436524c1226159b3869265c` (immutable SHA from main after `tsk-1bh` landed)
- **Status:** Published to `main`
- **Capability:** `code:implement`
- **Current Cell:** `P05` ([`current-cell.md`](current-cell.md))

---

## 1. Context & Architecture Goal

This track delivers the **code-panel multi-cell facade**, making `fgos-code-panel` the single unified entry point for all coding work requiring review and red-team scrutiny:
1. **Direct single-cell requests:** preserve the existing `direct-single-cell` path with no plan bookkeeping ceremony (requests that merely cite or reference a plan/phase path in passing, cite a plan file as an edit target, or cite a plan path as background context while directing a run/resume verb at something else, stay direct-single-cell).
2. **Plan-driven multi-cell tracks:** recognize when a plan/phase path is the actual execution target (bare path, or an explicit run/resume/execute instruction directed at the plan/phase artifact itself), select `planned-multi-cell` mode, and delegate orchestration entirely to `fgos-plan-loop`.
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
- **Clean worktree separation & track tips:** Track base ref is `45569ac3379445e93436524c1226159b3869265c`. The active worktree is dedicated to `code-panel-multicell-facade--p00`. Track branch current tip is `91d35b4be8a3b4070d4f4f5b23d9bda68a0fb641` (includes merged engine fix P04 `d13570c4` / `ebeef714`). Note (2026-09-15): `main` has moved to `2c56eed8` (matching `test-suite-feedback-cost` track tip) since `BASE_REF` was recorded (recorded as an observation; outside this track's scope to investigate).
- **Durable paused-plan inventory recorded:** All paused/stopped tracks (`test-suite-feedback-cost`, `executor-policy-dispatch-seams`, etc.) are catalogued in [`proofs/baseline/paused-plans-inventory.md`](file:///home/vantt/projects/code-panel-multicell-facade-p00/docs/architect/agent-coordination/verification/code-panel-multicell-facade/proofs/baseline/paused-plans-inventory.md).
- **Test execution baseline established:** Baseline counts for focused/affected/full test runs captured in [`proofs/baseline/test-run-counts-baseline.md`](file:///home/vantt/projects/code-panel-multicell-facade-p00/docs/architect/agent-coordination/verification/code-panel-multicell-facade/proofs/baseline/test-run-counts-baseline.md) and full suite baseline in [`proofs/baseline/full-suite-baseline.md`](file:///home/vantt/projects/code-panel-multicell-facade-p00/docs/architect/agent-coordination/verification/code-panel-multicell-facade/proofs/baseline/full-suite-baseline.md) (6467 pass, 52 unique failing titles: 51 in `test/rust-host/*` + 1 in `test/cli/fgos-intake-4.test.mjs:318`, 9 skipped = 6528 total).

---

## 3. Explicit Ownership Boundary (R3)

| Domain Responsibility | Owner | Non-Owner | Invariant / Boundary |
|---|---|---|---|
| **User Input Recognition** | `fgos-code-panel` | `fgos-plan-loop` | User requests enter via `fgos-code-panel`. It inspects whether the input is a direct code change, a passing reference, an edit target, or an explicit plan/phase execution target. |
| **Mode Selection (R2)** | `fgos-code-panel` | `fgos-plan-loop` | Code-panel selects `direct-single-cell` vs `planned-multi-cell`. Yêu cầu mà `plan.md`/`phase-NN-*.md` (hoặc track referenced BY NAME như "resume the &lt;track&gt; track", "open the next cell for &lt;track&gt;", resolving to `plans/&lt;name&gt;/plan.md` hoặc registered coordination track — CE1) LÀ execution target (bare path, hoặc có verb run/resume/execute trỏ thẳng vào chính plan/track đó): giao việc điều phối nhiều cell cho `fgos-plan-loop`. Negation must be honored before verb matching: "don't run plans/X/plan.md yet, just fix src/foo.mjs" is `direct-single-cell` (CE2). When a request names a specific phase path as target ("run phase-01 of plans/X"), phase selection is not silently dropped: derive track, let plan-loop resolve next cell, and refuse (do not silently override) if the named phase disagrees with what chain opens next (CE3). Non-execution / inspection verbs directed at a plan ("review plans/X/plan.md", explain, summarize) stay `direct-single-cell` (CE4). An explicit run/resume/execute instruction naming ANY `plan.md`/`phase-NN-*.md`-shaped file outside `plans/` (e.g. "run this plan: docs/.../plan.md") is `planned-multi-cell`; the `plans/` path shape is a fast-path convenience, and only bare unqualified paths require a `plans/` location (CE5). Một request chỉ CITE plan path làm context/edit-target (sửa nội dung file plan như "fix typo in plans/X/plan.md", hoặc chạy/resume việc khác mà plan chỉ được nhắc tới để cung cấp bối cảnh như "run the focused tests listed in plans/X/phase-01.md against src/x.mjs" hay "resume my work on src/auth.mjs, context in plans/X/plan.md") vẫn là `direct-single-cell` — citation không tự động nâng thành execution target, và verb run/resume/execute phải trỏ THẲNG vào chính artifact plan/phase chứ không phải chỉ đồng xuất hiện với plan path trong khi bổ nghĩa cho đối tượng khác. Genuinely unresolved or ambiguous intent must be refused or ask for clarification, never silently guessed either way. |
| **Coding Test-Policy Overlay** | `fgos-code-panel` | `fgos-plan-loop` | Code-panel defines the 3-tier test policy (`FOCUSED_TESTS`, `AFFECTED_TESTS`, `FULL_TEST`, `FULL_TRIGGERS`) and passes it into cell dispatches. Generic plans do not require test policy fields. |
| **Track Lifecycle Orchestration** | `fgos-plan-loop` | `fgos-code-panel` | Plan-loop owns the generic track driver loop (`audit -> cell open -> review -> red-team -> fix -> close`). Code-panel never duplicates orchestration code. |
| **Session & Mutation Authority** | `CoordinationSession` runtime | Skills (`fgos-code-panel`, `fgos-plan-loop`) | `session-engine.mjs` and `standalone-master-coordination-loop.yaml` enforce mutation gating, CAS recovery, and quorum close. Skills compose requests; they never bypass engine doors. |
| **Generic / Non-Coding Tracks** | `fgos-plan-loop` | `fgos-code-panel` | Plan-loop can be called directly for tracks outside coding; it remains generic without `trackKind: code` branches. |

---

## 4. Product Gates & Phase Status

| Phase | Cell | Capability | Status | Exit Criteria |
|---|---|---|---|---|
| **00** | [Contract & baseline](p00.md) | `code:implement` | merged | `tsk-1bh` terminal-close proof + durable resume inventory + contract assertions; targeted proof |
| **01** | Facade hai mode | `code:implement` | merged | mode/delegation tests pass; projected skills in sync. Full-suite gate if mechanical triggers hit |
| **02** | Coding test-policy overlay | `code:implement` | merged | tier/reuse/escalation fixtures pass; targeted proof |
| **03** | Resume & compatibility | `code:implement` | merged | fresh-process + legacy + direct regressions pass. Full-suite gate if implementation exceeds skill prose |
| **04** | Fix orphaned authorization (engine bugfix) | `code:implement` | merged | mutation-verified regression tests pass; session-engine.mjs fix merged at `d13570c4` / `ebeef714`. Full-suite gate |
| **05** | [Live proof & rollout](p05.md) | `code:implement` | published-to-main | final integrated `npm test` gate passed on track `069e93cf` / tree `094be49654b757d62dee26ffad0c94acd047dbb3`, then on main merge commit `4386a835` / tree `c254e988199978b354b03386bf9e93a979c32297` |

---

## 5. Verification References

- Cell trace P00: [`p00.md`](file:///home/vantt/projects/code-panel-multicell-facade-p00/docs/architect/agent-coordination/verification/code-panel-multicell-facade/p00.md)
- Cell trace P05: [`p05.md`](p05.md)
- Current cell status: [`current-cell.md`](current-cell.md)
- Proof artifacts:
  - [`proofs/baseline/terminal-close-tsk-1bh-proof.txt`](file:///home/vantt/projects/code-panel-multicell-facade-p00/docs/architect/agent-coordination/verification/code-panel-multicell-facade/proofs/baseline/terminal-close-tsk-1bh-proof.txt)
  - [`proofs/baseline/paused-plans-inventory.md`](file:///home/vantt/projects/code-panel-multicell-facade-p00/docs/architect/agent-coordination/verification/code-panel-multicell-facade/proofs/baseline/paused-plans-inventory.md)
  - [`proofs/baseline/test-run-counts-baseline.md`](file:///home/vantt/projects/code-panel-multicell-facade-p00/docs/architect/agent-coordination/verification/code-panel-multicell-facade/proofs/baseline/test-run-counts-baseline.md)
  - [`proofs/baseline/full-suite-baseline.md`](file:///home/vantt/projects/code-panel-multicell-facade-p00/docs/architect/agent-coordination/verification/code-panel-multicell-facade/proofs/baseline/full-suite-baseline.md)
