# Land retained candidates in doctor: stopped, no release command exists

Date 2026-10-21, branch `git/followups`. Nothing implemented; no product file touched.

## Finding: no operator-runnable release exists today

The task says to stop and report if no existing verb releases a retained candidate. Evidence:

- The only release path is `GitLand.recover({ operationId, consumerAcknowledgement })`, called from `acknowledgeLand` (`src/runner/merge.mjs:1315`) and `src/workflow/runner.mjs:627`. Both run inside merge verbs, right after Work records its decision.
- `fgos --help` lists no verb that calls it. `fgos merge` has only `list|next`. `fgos dispatch recover` is for standalone Runs. `fgos worktree gc` spares worktrees it does not own as session entries and does not touch Land pins or the WAL.
- `fgos doctor --fix` (`git-land-recovery`, `fixLandRecovery`, `src/setup/git-checks.mjs:119`) only calls `Recovery.reconcile`. Its own comment says candidates "stay until Work acknowledges them".
- The acknowledgement string (`work-decision:<id>:<seq>`) names a Work decision. A copy-paste command would have to invent the string or a new verb (for example `fgos land release <id> --ack ...`), which this task forbids.

## Second finding: the data is not exposed either

`Recovery.list_pending` (`packages/git/rust/src/recovery.rs:81`) returns only operations with `!terminal`. A Land that succeeded or abandoned and has an unreleased candidate is terminal, so it is not listed. `git-operation-journal` counts only the same pending set. Doctor therefore cannot see a retained candidate without a Rust read-side change (list terminal Land chains whose candidate pin still exists, plus candidate path and age). The spec (§ retention, "consumer acknowledgement debt") says doctor reports this debt, so the read side is the intended place, but it is more than 30 lines and outside "only if data not already exposed" minimal scope.

## What is needed to proceed (owner decision)

1. Release command: choose one.
   a. Report-only with the manual procedure stated as "needs Work's acknowledgement; release happens when the Work lane resumes the sweep" (no copy-paste command; deviates from the acceptance text).
   b. Add a minimal operator verb that calls `recover` with an explicit `--ack <string>` (new door, extends scope).
2. Authorize the Rust read-side addition (terminal Land chains with a retained candidate: operation id, candidate path/ref, WAL timestamp) feeding the existing `git-land-recovery` row as a check beside its fix (reuse, no parallel scanner).
3. Spec open list: record the sweep as deferred until the Work acknowledgement reader exists (not yet written).

Status: NEEDS_CONTEXT
