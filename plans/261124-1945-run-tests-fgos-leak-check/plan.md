---
contract: plan-v1
title: "The leak check of run-tests ignores live runtime directories"
status: draft
priority: P2
blockedBy: []
footprint:
  - scripts/run-tests.mjs
  - test/scripts/run-tests.test.mjs
  - plans/261124-1945-run-tests-fgos-leak-check/
base: d63657180011c633a806048e63aa7f576ef3bece
source:
  - plans/discussions/ds-ti2vip43kp-run-tests-fgos-leak-check/DISCUSSION.md
  - p-s6te2445rb
created: 2026-11-24
---

# The leak check of run-tests ignores live runtime directories

## Outcome

The `.fgos` leak check in `scripts/run-tests.mjs` (`snapshotFgos` before and after a run,
compared by `diffFgosSnapshots`) no longer fails a run because of files that other heads
write into live runtime directories while the run is going, and still fails a run when a
test really leaves a file anywhere else in `.fgos`.

Why: three lands went red with 0 test failures, each only because of live files in
`observe/records`, `runtime/mailbox/mail-taken`, `logs/invocation-faults.jsonl` and
`runtime/land/land-*.log.partial` (discussion, Evidence).

## Acceptance criteria

1. With a live file added during a run under each of `runtime/land` (including a
   `land-*.log.partial`), `runtime/mailbox`, `observe/records`, `logs` and `cache`, the
   run's `fgosDiff.leaked` is `false` and its status is 0. Proof: a test in
   `test/scripts/run-tests.test.mjs`.
2. A file a test leaves in any other `.fgos` path (for example `observe/friction/`,
   `dispatch-runs/`, `runtime/other/`) still fails the run with status 1 and is named in
   the log. Proof: the existing leak tests in the same file, still green.
3. `node scripts/run-tests.mjs test/scripts/run-tests.test.mjs` exits 0.

## Non-goals

- Changing which tests run, or the land gates.
- Touching any script other than `scripts/run-tests.mjs`.
- Any env switch or flag that turns the check off (AGENTS.md, L5 question 5).

## Prior art

`git log -S'DERIVED_FGOS_FILES'` shows commit 7443ae2db added the one existing exemption,
`DERIVED_FGOS_FILES = {cache/state.json}`, passed as the default `allowedFgosMutations`.
This plan reuses the same door (the snapshot and diff in `scripts/run-tests.mjs`) and
extends it from one exact file to a fixed list of live directories. Because the owner's
list excludes all of `cache`, the single-file exemption becomes redundant and is retired
in the same change (L10): one exclusion list, not two.

## Authority map

`fgos authority locate` returns no model row that owns `scripts/run-tests.mjs`: it is
repository test tooling, and the only top match is `runner` by name, which is the
execution runner, not this script. The change adds no component, door, contract or
decision kind; it replaces one constant inside an existing script, so the table has no
rows. The replacement inside the script: survivor `LIVE_FGOS_DIRS`; retired
`DERIVED_FGOS_FILES`, both in `scripts/run-tests.mjs`.

| New thing | Model row | Note |
|---|---|---|

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Skip live runtime directories in the leak check](phase-01-skip-live-runtime-dirs.md) | - | scripts/run-tests.mjs, test/scripts/run-tests.test.mjs | 1 | draft |

One phase, one wave: the whole change is one constant, one walk filter and one test file.
No integration phase is needed because there is only one branch; the phase's own verify
is the full gate for its footprint. Checked with `node scripts/plan-contract-check.mjs`
and `fgos resource-check --plan`.

## Owner questions

None.

## Risks and rollback

- **A real leak into an excluded directory now passes.** A test that writes into
  `cache`, `logs`, `observe/records`, `runtime/land` or `runtime/mailbox` of the real
  checkout is no longer caught. This is the trade the owner chose; the existing test
  "tolerates a rewrite of the derived state view but still fails other cache changes"
  loses its second half (`cache/other.json` failing) because that behavior is removed by
  the owner's list, not weakened. Tests still run with a per-run temp root, so their own
  fixtures do not reach the real `.fgos`.
- **Prefix match too wide.** Matching `logs` by name could skip a nested directory called
  `logs` elsewhere. Mitigation: match the relative path from `.fgos` root exactly
  (`runtime/land`, not any `land`), proven by the test's "other path still fails" case
  using `runtime/other/`.
- **Rollback:** revert the phase's single commit.

## Outstanding questions

None
