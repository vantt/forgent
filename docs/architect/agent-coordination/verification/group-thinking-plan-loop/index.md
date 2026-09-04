# Track: group-thinking-plan-loop

Plan: `plans/260904-2329-group-thinking-plan-loop/plan.md`
Branch: `group-thinking-plan-loop`
Base ref: `7914e807c83ae753fdfa82896be74a5b7c1f42cf` (main HEAD at track start)
Test command: `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/**/*.test.mjs'`
Focused command (Wave 1): `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/runner/coordination-*.test.mjs' 'test/verbs/coordination-*.test.mjs' 'test/runner/dispatch-*.test.mjs' 'test/runner/assignment-dispatch.test.mjs' 'test/architecture.test.mjs' 'test/cli/coordination.test.mjs'`

## Deviation from generic master-coordinator.md protocol

Wave 1 runs P01.1 and P02.1 concurrently in isolated worktrees per plan.md's
own Master Coordination Contract point 8 and Parallel Execution Map
(MAX_PARALLEL_CELLS: 2). This intentionally relaxes generic rule 4
("at most one cell is active") — plan.md is the approved, higher-authority
document for this track and explicitly requires the parallelism, with a
proven zero-file-overlap Shared-File Lease Rule. Both cells get their own
`<cell-id>.md` trace and `current-cell-<cell-id>.md` contract instead of a
single shared `current-cell.md`.

## Entry Conditions — confirmed

- main HEAD (7914e807) descends from 856eeaf1 (step-09-mvp6-to-mvp9 merge) — confirmed via `git log`.
- `docs/how-to/use-fgos-group-thinking.md` exists on main.
- No other track's index/current-cell claims `src/runner/coordination/**`,
  `src/runner/dispatch/**`, or `src/verbs/coordination/**` — this is the
  first cell under `docs/architect/agent-coordination/verification/`.

## Audit (fresh track — everything missing until proven)

| Phase | Requirement | Status |
|---|---|---|
| P01 | R1-R9 (mutation unlock, kernel) | missing |
| P02 | R1-R8 (chain verb, pack registration) | missing |
| P03 | live proof + skill | missing (blocked on P01+P02 close) |

## Corrections found during cell preparation (grounded, not assumed)

- Phase 01's R6b/R6c text says `src/cli.mjs`. That file does not exist.
  The real path is `src/runner/dispatch/cli.mjs` — confirmed call sites at
  lines 957 and 1129 (`grep -n "executeAssignment(" src/runner/dispatch/cli.mjs`).
  Also confirmed: `src/runner/dispatch/operation-choice.mjs:2198` calls
  `executeAssignment(assignment, opts)` with no explicit `isReadOnlyMode`
  key — R6c's investigation is real, not hypothetical.
- R8 bug confirmed exactly: `src/runner/coordination/store.mjs`,
  `resolveCoordinationPaths()` (lines 48-59) computes `root` correctly
  (line 50-55) but keys `fgosDir` on raw `cwd` at line 56
  (`fgosDirFromRoot(cwd)` should be `fgosDirFromRoot(root)`).
  Grep of every `fgosDirFromRoot(` call site under
  `src/runner/coordination/**` and `src/runner/dispatch/**`: only
  `store.mjs:56` is wrong; `cli.mjs` (7 sites) and `assignment-runner.mjs:573`
  all correctly pass `root`. No sibling bug found — R8's scope is exactly
  this one line.
- `buildReadOnlyContract` confirmed at `session-engine.mjs:189`;
  `PROTOCOL_OPERATION_STAMP_PREFIX` at line 156; `runExecutorAttempt` at
  line 280, its `executeAssignment` call at line 281 (not 280-282 as the
  phase file estimated — off by one, re-verify exact line before editing).

## Baseline

Full suite run at track start (`FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/**/*.test.mjs'`),
exit code 1. Known baseline failures (4, all pre-existing, unrelated to
this track's files):

1. `test/cli/fgos-intake-4.test.mjs:318` — "ask/answer round-trip on a
   genuinely legacy durable-doing item (no claim)" — pre-existing state
   machine gap, unrelated to coordination/dispatch.
2. `test/report/enduser-index.test.mjs:187` — "fgos docs-index tolerates
   a missing quadrant dir" — docs-index reporting, unrelated.
3. `test/runner/codex-cli-glm-cli-live-executors.test.mjs:50` —
   "codex-cli executor (LIVE)" — external dependency failure (codex-cli
   usage limit hit against the real service, not a code defect).
4. `test/setup/coordination-doctor-check.test.mjs:42` —
   "coordination-example-requests-valid" — pre-existing example-request
   fixture validation gap in `group-thinking-nominal-group-lite-resume-request.json`/
   `group-thinking-rfc-review-lite-resume-request.json` (a placeholder
   token string fails the safe-charset check), unrelated to mutation
   unlock or chain verb.

This list may only shrink. Any NEW failure blocks close for the cell
that introduced it.

## Active cells

| Cell | Status | Owner | Worktree | Next action |
|---|---|---|---|---|
| P01.1 | in-progress | Doer (running) | `.claude/worktrees/agent-ab7ff2ac5eda7a106` / `worktree-agent-ab7ff2ac5eda7a106` | doer |
| P02.1 | review-needed | Coordinator | `.claude/worktrees/agent-a1cf5464f865986fb` / `worktree-agent-a1cf5464f865986fb` @ `42af6508` | reviewer+red-team (dispatching, parallel) |

## Known non-blocking environment finding (repo-wide, not this track's scope)

`test/runner/coordination-static.test.mjs`'s `FORBIDDEN_IMPORT_SUBSTRINGS`
check matches the literal string "worktree" against each import's fully
RESOLVED ABSOLUTE PATH, not the specifier — so it false-fails whenever the
checkout itself lives under a `.claude/worktrees/agent-*`-style path (this
repo's own dispatch convention). Confirmed independently by the
Coordinator: fails in the P02.1 worktree, passes cleanly (2/2) at the main
checkout. Not caused by any cell in this track. Worth a standalone repo
bug fix (match against the specifier or a path relative to repo root
instead) — out of scope for this track's own cells; the Coordinator
verifies each cell's full-suite run from the MAIN checkout going forward
to avoid this false signal, and will file it as a backlog item separately
from this track's own coordination.

## Next action

P01.1 Doer still running. P02.1 verified by Coordinator, dispatching
independent Reviewer + Red-Team in parallel now.
current-cell contracts: `current-cell-P01.1.md`, `current-cell-P02.1.md`.
Cell traces: `P01.1.md`, `P02.1.md`.
