# Cell 6.final — Consolidate Step 6

Status: done
Date opened: 2026-08-31
Date closed: 2026-08-31

## Scope

Part A: full audit of Step 6 (Cells 6.0-6.6) against
step-06-work-attached-team-adoption.md §2-§9. Part B: close the
executing-stage live-proof gap if still open. See `trace/current-cell.md`.

## Part A — Traceability table

### §2 Prerequisites

| Requirement | Closed by | Status |
|---|---|---|
| Step 04 complete | `trace/index.md` Step-1-5 matrix rows 03/04, both `done` | done |
| Step 05 complete for `planning.validate-plan` | `trace/index.md` row 05, `done for planning.validate-plan` | done |
| `fgos doctor` Team Dispatch checks pass (`task-specs-resolve`, `agent-claims-resolve`, `domain-workflow-operations-coverage`, dispatch-decide-hook wired, config not stale) | Re-verified live in this cell: `node bin/fgos.mjs doctor --json` — all 5 checks `passed: true` (`config-not-stale`, `task-specs-resolve`, `agent-claims-resolve`, `dispatch-decide-hook-wired`, `domain-workflow-operations-coverage`) | done |
| Existing primary Work path remains green | `trace/index.md` "primary path" row (`test/e2e/runner-loop.test.mjs` 15/15, `test/state/handoff.test.mjs` 18/18) — the row's original 3-failure BLOCKED note was the trigger for Cell 6.0, closed there; this cell's own full battery re-run (below) confirms 304/304 green | done |

### §3 Slices' acceptance criteria

| Slice | Acceptance criteria | Closed by | Status |
|---|---|---|---|
| 6.1 Planning validate-plan | one real planning item runs reviewer Assignment; `reported`/conservative-stop result; no direct Work lifecycle move inside the Assignment | Cell 6.3 live smoke: real out-of-process `claude` subprocess against `tsk-5ka`, verdict `READY`, `confidence: reported`, item stayed `todo`/`planning` immediately after the run (driver-side `wontfix` happened afterward via a separate engine verb) | done |
| 6.2 Executing review-item | review Assignment reads diff/verify evidence refs; reviewer writes findings/verdict; driver routes by verdict (approve / reject-to-fix / stop); review result alone does not merge | Fake-executor: Cell 6.0 (verdict-routing reconciliation) + Cell 6.4 (audit, +1 Herdr-neutrality test) + `test/runner/loop.test.mjs` "Step 06" REJECT/APPROVED-pass/APPROVED-fail/no-evidence scenarios (see §6 below). LIVE: this cell's Part B — real `review-item` Assignment via `dispatch.mjs decide`/`execute` against throwaway `tsk-1br`, real diff (`fgw/tsk-1br@09f4a59d`) + real verify (`21b27a40`), verdict `APPROVED`, `confidence: reported`, evidenceRefs tied to the real diff/verify refs, no lifecycle verb (`return`/`approve`) fired inside the Assignment per the executor's own transcript | done |
| 6.3 Executing scout-blast-radius | researcher Assignment writes blast-radius report; degraded/inactive posture explicit; driver treats report as `reported` not `verified`; implementation still requires normal verify/return | Cell 6.5: audit found + fixed one real gap (posture-evidence check now requires an explicit state token plus a cross-check mention for degraded/inactive, closing the "stale index silently treated as full coverage" failure mode) | done |
| 6.4 Executing scoped-subtask | helper Assignment declares expected touched files; helper result must be `verified`; driver refuses undeclared/overlapping files; child Work still preferred for independent lifecycle | Cell 6.6: built `expectedFiles` declaration + undeclared-file refusal + overlap-with-caller-edits refusal (via `dirtyBefore` snapshot). Documented residual carried forward (not new): the mechanism is built and tested but **inert** — no real driver caller yet populates `choice.expectedFiles` for a live dispatch, so `scoped-subtask` is not "used" in Cell 6.3/this-cell's live sense. This does not block §8 (§8's item 2 only requires one of `review-item`/`scout-blast-radius`, satisfied by `review-item` in Part B) | done, with a pre-existing documented residual (not a new gap) |

### §4 Governance Rules

| Rule | Closed by | Status |
|---|---|---|
| Do not allow Assignment execution to bypass `dispatch decide` | `dispatch-decide-hook-wired` doctor check (PreToolUse hook) + AGENTS.md's own Dispatch rule; operationally followed in both Cell 6.3's and this cell's live smokes (`decide` always called before `execute`) | done |
| Do not let CLI override model/provider bypass egress governance | Cell 6.3 red-team attack class (2): `--has-live-task-access` cannot escalate mechanism choice — `mechanism.mjs:42-45,64`, config wins for cli-spawn-shaped executors regardless of the flag, confirmed against a real live run | done |
| Do not trust Herdr pane status | Cell 6.3 §6 scenario ("Herdr/visibility fields do not affect confidence") for `validate-plan`; Cell 6.4 added the matching test for `review-item`'s structurally distinct interpretation branch | done |
| Do not advance Work from `inferred` unless human/driver explicitly accepts evidence in a later hardened rule | §5's Evidence Requirements table names a `reported`/`verified` floor for every operation, never `inferred`; Cell 6.2's 5-round hardening campaign (companion-report-only classification, claimSha256+content compare, dispatchedRuns manifest, settle-bound re-derivation, monotonic floor) closes the exploits that would have let a weaker signal masquerade as evidence | done |
| Do not auto-retry more than once without a new reason | Confirmed by code inspection (not a dedicated test — there is no retry code path to test negatively): `executeAssignment` is called exactly once per driver pass at each of its 3 call sites (`operation-choice.mjs:2058`, `cli.mjs:903`, `mission-lite.mjs:321`); no internal loop wraps it. A second attempt structurally requires a distinct new external driver pass (a "new reason"), never an automatic in-process retry | done |

### §5 Evidence Requirements (all 6 operation rows)

| Operation | Min confidence | Additional requirement | Closed by |
|---|---|---|---|
| `validate-plan` | `reported` | verdict + feasibility matrix artifact | Cells 6.1-6.3; live-proven in Cell 6.3 (`agent-result.json` verdict `READY`, `feasibilityMatrix: []`) |
| `review-item` | `reported` | approve/reject findings tied to diff/verify refs | Cells 6.0/6.4 (fake-executor) + this cell's Part B (live-proven: verdict `APPROVED`, `confidence: reported`, `evidenceRefs` tied to real `diff:`/`verify:` refs) |
| `scout-blast-radius` | `reported` | named files/symbols + search/graph posture | Cell 6.5 (posture-evidence hardening) |
| `resolve-question` | `reported` | direct answer, citations, remaining uncertainty | Pre-Step-6 infrastructure (`operation-choice.mjs:1858-1909`, `resolve-question-missing-report-artifact`/`resolve-question-insufficient-evidence` gates), not a Step 6 adoption Slice — §3 only names 4 ops for real-workflow rollout; this op's evidence gate exists and is exercised by the shared `operation-choice.mjs`/`test/runner/operation-choice.test.mjs` test suite from Steps 02-05 |
| `scoped-subtask` | `verified` | changed files/commit + verify evidence | Cell 6.6 |
| `fix-verify-red` | `verified` | changed files + rerun failing verify | Pre-Step-6 infrastructure (`operation-choice.mjs:1921`+), reconfirmed still correctly branching in Cell 6.6 ("fix-verify-red's previously-shared branch split out byte-identical") |

### §6 Tests (all 7 scenarios)

| Scenario | Closed by (test) |
|---|---|
| planning validate-plan happy path | Cell 6.1 |
| planning validate-plan no-evidence stop | Cell 6.2 |
| executing review-item reject routes to fix operation | Cell 6.0 — `test/runner/loop.test.mjs` "driver loop runOnce: executing review-item with REJECT verdict on existing candidate routes to fix operation (Finding P2 fix)" |
| executing scout-blast-radius report does not mutate Work | `test/runner/loop.test.mjs` "Step 06 executing-stage scout-blast-radius operation choice runs through runOnce loop safely without mutating Work" |
| scoped-subtask requires changed-file evidence | Cell 6.6 |
| governance-blocked executor returns a stop, not success | `test/runner/operation-choice.test.mjs` "Step 06 governance-blocked or failed executor returns a stop without advancing Work" |
| Herdr/visibility fields do not affect confidence | Cell 6.3 (`validate-plan`) + Cell 6.4 (`review-item`, structurally distinct branch) |

### §8 Adoption Completion Criteria

"At least two real Work-attached operations used": item 1 (read-only, `validate-plan`) — Cell 6.3 live smoke. Item 2 (executing-stage, `review-item` or `scout-blast-radius`) — was NOT yet satisfied in the live sense before this cell (confirmed by grepping `.fgos/assignments/` before Part B: only `validate-plan` assignments existed, for `tsk-5ka` and 3 negative-case fixtures — no `review-item`/`scout-blast-radius`/`scoped-subtask` assignment of any kind). Closed in this cell's Part B: one real `review-item` reviewer Assignment dispatched through the actual out-of-process pipeline against throwaway `tsk-1br` (`stage: executing`), with command transcript, assignment/run/result files, driver decision, and final Work state all preserved (see Part B below). **Status: done, both items satisfied.**

### §9 Rollback

"Disable operation-aware driver selection and fall back to primary stage skill path; do not delete stored assignment/run evidence." Confirmed still structurally correct by code inspection: `operation-choice.mjs`'s default path (no `secondaryOperation`/`requestedSecondaryOp` set) always resolves `primaryOp` → `dispatch: 'direct-stage-skill'` (lines 657, 799-822, 912-929) — the pre-Team-Dispatch primary path is the unconditional fallback, not something rollback needs to build. No code path in `src/runner/dispatch/*.mjs` or `src/runner/loop.mjs` deletes `.fgos/assignments/` evidence. **Status: holds.**

## Part B — Executing-stage live smoke

**Confirmed still missing before this cell:** grepped every `assignment.json` under `.fgos/assignments/` — 4 existed, all `operation: "validate-plan"` (`tsk-5ka` from Cell 6.3, plus 3 negative-case fixtures `tsk-fail-op`/`tsk-no-ev`/`tsk-ready-op`). No `review-item`/`scout-blast-radius`/`scoped-subtask` assignment existed anywhere, confirming the gap flagged by the coordinator was real, not already accidentally satisfied.

**Recipe run, mirroring Cell 6.3's exact pattern:**

1. Committed a throwaway `plan.md` at `docs/history/cell-6-final-review-item-live-smoke/` on `main` (`b8bfca2b`).
2. `node bin/fgos.mjs add --title "Cell 6.final live smoke: throwaway item for executing.review-item" --kind docs --risk light --verify true --stage executing --docs-ref docs/history/cell-6-final-review-item-live-smoke/ ...` → created `tsk-1br` directly at `stage: executing` (mirrors Cell 6.3's "create directly at the target stage" pattern for `planning`).
3. `node bin/fgos.mjs pick tsk-1br` → claimed the item and created its isolated worktree/branch `fgw/tsk-1br` (`.claude/worktrees/tsk-1br-5Qmtbl`) — required here (unlike Cell 6.3, which never made a real commit) because §8 item 2 needs a **real candidate diff**, and this repo's pre-commit hook refuses a commit directly on a `fgw/*` branch from the main checkout, only from its own worktree.
4. Inside the worktree: committed one real, small, low-risk change (`docs/history/cell-6-final-review-item-live-smoke/candidate-note.md`, commit `09f4a59d`) — the real candidate diff.
5. Ran the item's own declared real verify command (`true`, exit 0) and committed its real result to `verify-result.txt` (commit `21b27a40`).
6. `node bin/fgos.mjs edit tsk-1br --refs "diff:fgw/tsk-1br@09f4a59d,verify:docs/history/cell-6-final-review-item-live-smoke/verify-result.txt@21b27a40"` — attached both real evidence refs to the Work item.
7. Built the real Assignment via the repo's own `buildAssignment` (`src/runner/dispatch/assignment.mjs`, imported read-only from a throwaway scratchpad script — no edits to any `dispatch/*.mjs` file) for `{work: tsk-1br, stage: executing, operation: review-item}`, then persisted it once to `.fgos/assignments/asgn_tsk_1br_review_item_001/assignment.json` — the same immutable-input contract Cell 6.3 used.
8. `node src/runner/dispatch.mjs decide --assignment asgn_tsk_1br_review_item_001 --has-live-task-access` → `{"mechanism":"out-of-process","configured":true,"executorId":"claude"}`.
9. Per AGENTS.md's Dispatch rule, ran through `dispatch.mjs execute`, never a hand-rolled command: `node src/runner/dispatch.mjs execute --assignment asgn_tsk_1br_review_item_001 --has-live-task-access --cwd <worktree> --repo-root <repo-root>` — spawned a real, out-of-process `claude` CLI subprocess. At dispatch time it correctly resolved to the scoped `claude-reviewer` executor profile (per Cell 6.3 Fix Round 1/2's `isReadOnlyAssignment` gate — `review-item` is role `reviewer`), never the full worker `claude` profile. Exit code 0.
10. `node bin/fgos.mjs move tsk-1br --to wontfix` — parked the throwaway item through the normal engine verb (no direct state edit).
11. Regression battery (below) — 304/304, 0 fail.

**Driver path used, and why:** identical shape to Cell 6.3 — `decide` resolved `out-of-process`, so `dispatch.mjs execute` drove a real, separate `claude` CLI subprocess end to end rather than the Doer acting as reviewer directly.

**Artifacts captured**, all under `.fgos/assignments/asgn_tsk_1br_review_item_001/`:

- `assignment.json`
- `runs/01/run.json`
- `runs/01/dispatch-plan.json`
- `runs/01/agent-result.json` (+ `agent-report.md`)
- `runs/01/evidence.json`
- `runs/01/result.json` (+ `exit.json`, `stdout.log`, `stderr.log`)

**Driver outcome:**

- `agent-result.json`: `status: "done"`, `verdict: "APPROVED"`, `summary`: candidate is a throwaway docs-only smoke item added purely to give the live-smoke pipeline a real diff; verify ran the item's declared `true` command and passed; no code/contract touched. `evidenceRefs: ["diff:fgw/tsk-1br@09f4a59d", "verify:docs/history/cell-6-final-review-item-live-smoke/verify-result.txt@21b27a40"]` — both real, tied to the actual committed evidence, not synthetic markers.
- `result.json`: `status: "done"`, `confidence: "reported"` — matches §5's `review-item` minimum-confidence requirement exactly.
- `evidence.json`: `gitBefore === gitAfter` (both `21b27a40...`), `changedFiles: []` — the reviewer Assignment made no repo mutation of its own, consistent with `review-item`'s reviewer-only contract.
- Executor: `claude-reviewer` (confirmed scoped-profile resolution live, not just in fake-executor tests) via `cli-spawn`, `provider=claude`, `model=sonnet`, `tier=standard`.
- Reviewer's own stdout: "No lifecycle verbs (`return`/`approve`) were called — this assignment's task-spec doesn't name this reviewer role as the lifecycle driver." — confirms the acceptance-criteria requirement that a review result alone does not merge/advance Work; the driver-side `wontfix` move (step 10) happened afterward, separately, through the normal engine verb.
- Work item final state: `tsk-1br` at `status: wontfix`, `stage: executing` (confirmed via `fgos show tsk-1br`).

**No genuine new bug surfaced.** The scoped `claude-reviewer` executor resolution (Cell 6.3 Fix Round 1/2) worked correctly on this live `review-item` dispatch exactly as its own fake-executor tests predicted; no STOP condition triggered.

**Non-blocking housekeeping note:** the `fgw/tsk-1br` worktree/branch created for this cell (`.claude/worktrees/tsk-1br-5Qmtbl`) was left in place after parking the item, rather than force-removed — `git worktree list` shows this repo already carries a large number of similar unreaped worktrees from other concurrent cells/agents in this session, so leaving one more is consistent with the environment's existing pattern (and this repo has its own documented "orphaned-worktree-reclaim" mechanism for exactly this class of cleanup, out of this cell's scope to invoke).

## Regression battery

```
node --test test/runner/operation-choice.test.mjs test/runner/loop.test.mjs \
  test/runner/assignment-runresult.test.mjs test/runner/assignment-dispatch.test.mjs \
  test/e2e/runner-loop.test.mjs test/cli/fgos-stage.test.mjs
```

tests 304, pass 304, fail 0, cancelled 0, skipped 0 (matches Cell 6.6's final count exactly — no regression from the new live dispatch).

## Step 6 overall verdict

Step 6 (Cells 6.0-6.6 + 6.final) is **done**. Every §2-§9 requirement in
step-06-work-attached-team-adoption.md traces to a closed cell, a named
test, or a direct code citation (Part A table above); no genuinely new
open item was found beyond the one gap already flagged by the coordinator
(§8 item 2's live proof), which this cell's Part B closes. The one
pre-existing documented residual — `scoped-subtask`'s `expectedFiles`
mechanism being built/tested but not yet exercised by any real driver
caller (Cell 6.6) — does not block §8 (item 2 is satisfied by
`review-item` alone) and is not a new finding; it is carried forward
as-is, unchanged by this cell.

Both Adoption Completion Criteria items are now satisfied with real,
out-of-process, non-fake-executor evidence:

1. read-only — `planning.validate-plan` (Cell 6.3, `tsk-5ka`).
2. executing-stage — `executing.review-item` (this cell, `tsk-1br`).

## Status

done — Part A traceability table complete (§2-§9), Part B live smoke run
and closed with no new bugs, full regression battery green (304/304).
Step 6 verdict: done, no unresolved blockers. Recorded to
`trace/index.md`'s Cell Registry by the coordinator.
