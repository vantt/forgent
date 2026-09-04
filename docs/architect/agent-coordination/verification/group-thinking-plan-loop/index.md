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
| P01 | R1-R9 (mutation unlock, kernel) | done (P01.1 closed and merged, 4 fix rounds) |
| P02 | R1-R8 (chain verb, pack registration) | done (P02.1 closed and merged) |
| P03 | live proof + skill | R1-R4 done (skill authored, closed, merged); R5-R7 paused, needs user decision |

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
| P01.1 | **done** | Coordinator | merged into `group-thinking-plan-loop` (Doer `8b24c8a2`, Fixer R1-R4) | closed |
| P02.1 | **done** | Coordinator | merged into `group-thinking-plan-loop` (Doer `42af6508`, Fixer `a39a920f`) | closed |
| P03.1 | **R1-R4 done**, R5-R7 paused | Coordinator | merged into `group-thinking-plan-loop` (Doer `362be7e9`, Fixer `2eb5a203`) | R5 needs user decision |

## Wave 1 — closed and integration-verified

Both P01.1 and P02.1 closed and merged into `group-thinking-plan-loop`.
P01.1 (the plan's one kernel cell) went through 4 real fix rounds — see
its own trace file's "Close (Coordinator)" section for the full history:
a forged-stamp bypass, a confusion-of-authority/ticket-reuse bypass, a
consulted-and-verified trust-boundary reframe (kongming, independently
re-checked against source), and a small overclaim correction.

A real cross-cell integration bug surfaced at the mandatory post-merge
focused regression: P02.1's own `--cwd` CLI tests assumed `--cwd`
relocates `.fgos/` session storage to the named worktree — true only
before P01.1's R8 fix landed. Traced the real code
(`bin/fgos.mjs`'s coordination case always passes `repoRoot` explicitly,
independent of `--cwd`; `store.mjs`'s `resolveCoordinationPaths` uses
`opts.repoRoot` when present, never re-deriving it from `cwd`) — `--cwd`
genuinely only affects `ctx.cwd` (which matters for R3's own
worktree-vs-main-checkout distinction), never where `.fgos/` bookkeeping
lands. Fixed (`0f1de244`), merged, re-verified: 718/718 pass at the main
checkout with zero known-false-positive noise (the worktree-path
substring quirk only triggers when run from inside a
`.claude/worktrees/` path, which the main checkout is not). This same
fix pass also independently re-confirmed a documented, pre-existing gap:
`src/verbs/coordination/run.mjs` never forwards a request step's
`mutation` field to the engine — the mutation-unlock mechanism has zero
live CLI/data-input reachable surface today, exactly as P01.1's own
Red-Team already found and documented; Phase 3's own skill work is
expected to close this wiring gap for real.

Filed `tsk-2bu` (fgOS backlog) for the separate, pre-existing
`rollbackReadOnlyMutations`-has-zero-callers gap found during P01.1's
own red-team review — not fixed in this track (out of scope), tracked
there instead.

Full test suite re-run once at the merged track tip: 5604/5614 pass, 4
failures = exactly the 4 known baseline items (one intermittent
external-network live-executor test now names `glm-cli` instead of
`codex-cli` — same class, expected). Zero new regressions. Wave 1 is
genuinely, fully verified complete. Wave 2 (P03.1) opened.

## P01.1 disposition (kernel cell — HIGH red-team finding)

Reviewer APPROVE (0H/0M/1L). Red-Team REJECT (1 HIGH): a caller
importing the exported `PROTOCOL_OPERATION_STAMP_PREFIX` and calling
`buildAssignment`+`executeAssignment` directly (bypassing
`session-engine.mjs` entirely) could self-forge the "engine-reserved"
stamp and produce a real mutating file write with none of R1/R2/R3's
checks ever running — genuinely new attack surface from this cell.
Accepted; fixer-p01-1 dispatched to re-verify R2/R3 at the actual
dispatch-layer execution point (defense in depth), not merely hide the
stamp constant. Full disposition in P01.1.md's own "Coordinator
Disposition (P01.1)" section.

## P02.1 close

Both Reviewer and Red-Team APPROVE on the post-fix recheck (F1 HIGH + F2
MEDIUM genuinely fixed, verified against real seeded fixtures beyond what
either original attack covered). 174/174 focused tests pass. Merged into
`group-thinking-plan-loop`. Phase 02 is fully done (its only cell).

## P01.1 Coordinator independent verification (before dispatching Reviewer/Red-Team)

- Re-ran focused command in the Doer's worktree: 659/660 pass — matches
  Doer's claim exactly (the 1 fail is the same known worktree-path
  false-positive in `coordination-static.test.mjs`; excluding that file:
  658/658 clean).
- `git diff --stat 86d0106c..HEAD` (the cell's OWN commit only) confirms
  zero touches to any Do-Not-Touch/P02.1-lease path
  (`bin/fgos.mjs`, `src/cli/command-registry.mjs`, `test/cli/**`,
  `core/protocol-packs/group-thinking.json`, `src/verbs/coordination/chain.mjs`,
  `src/verbs/coordination/launch-master-loop.mjs`) — confirmed by an
  explicit `git diff --stat` scoped to those exact paths returning empty.
- This is the plan's only kernel-touching cell — per plan.md's Master
  Coordination Contract point 7, it gets the SAME rigor step-09 required:
  independent Reviewer + Red-Team, fix rounds until both APPROVE, no
  shortcut for diff size.
- Full suite re-run independently by the Coordinator (background job
  complete): 5577/5588 pass, 4 failures = exactly the 3 known baseline
  items (`fgos-intake-4`, `enduser-index`, `coordination-doctor-check`)
  plus the known worktree-path false positive
  (`coordination-static.test.mjs`). The external `codex-cli-glm-cli-live-executors`
  baseline item did not fail this run (network-dependent, expected to be
  intermittent). Zero new regressions confirmed independently.

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

## Track status (2026-09-05) — natural completion point, stop gate on R5

Every cell this Coordinator can drive autonomously is closed and merged:

- **P01.1 (kernel mutation-unlock)**: done. 4 real fix rounds, each
  independently reviewed and red-teamed: a forged-stamp bypass, a
  confusion-of-authority/ticket-reuse bypass, a Round-2 fix found to be
  a no-op (led to consulting `kongming` and independently re-verifying
  this repo's own pre-existing, locked trust-boundary decision — see
  `docs/specs/runner.md` decision 0035), and a small overclaim
  correction (an unrelated, pre-existing dead-code gap, filed
  separately as `tsk-2bu`).
- **P02.1 (chain verb + pack registration)**: done. 1 real fix round
  (per-cell fault isolation + an import-check bypass), reviewed clean.
- **Wave 1 integration**: a real cross-cell bug surfaced at the
  mandatory post-merge regression (P02.1's `--cwd` tests assumed
  pre-R8 semantics) — found, fixed, merged. Full suite: 5604/5614,
  exactly the 4 known pre-existing baseline failures, zero new
  regressions.
- **P03.1 (fgos-plan-loop skill), R1-R4**: done. 1 real fix round
  (missing persona-diversity demonstration), reviewed clean.
- **P03.1, R5-R7 (the live proof)**: PAUSED, not attempted. R5 requires
  mutating a SEPARATE real project
  (`/home/vantt/projects/fgos-test-drive`, which has genuine
  in-progress work already on it) and killing real OS processes; that
  project currently has only ONE executor configured (`claude`), not
  the cross-provider setup R5 requires. This matches
  master-coordinator.md's own named stop gate verbatim ("a live proof
  needs a configured executor that is absent") and was also weighed as
  a hard-to-reverse, cross-system action warranting the user's own
  go-ahead rather than an unattended run. Full reasoning in
  `P03.1.md`'s own "Coordinator note on R5".

**Next action for the user**: decide (a) whether to configure a second/
third real executor on `fgos-test-drive` (or a different, disposable
host project instead) and (b) give explicit go-ahead to run R5's live
proof there — kill-and-resume test included. Once that's decided, resume
this track (`fgos-plan-loop`'s own skill, now merged and live, or this
same master-coordinator.md prompt) to execute R5-R7 and formally
complete the plan.

current-cell contracts: `current-cell-P01.1.md`, `current-cell-P02.1.md`,
`current-cell-P03.1.md`. Cell traces: `P01.1.md`, `P02.1.md`, `P03.1.md`.
