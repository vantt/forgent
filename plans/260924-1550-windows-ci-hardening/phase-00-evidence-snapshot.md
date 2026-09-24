# Phase 00 — Fresh evidence snapshot

## Context

`plan.md` § Where things stand. The categorization below is from CI run
`35975484603` (`e2fc7754` on `main`, 2026-09-24), downloaded via:

```sh
jobid=$(gh run view 35975484603 --repo vantt/forgent --json jobs \
  -q '.jobs[]|select(.name=="test (windows-latest)")|.databaseId')
gh run view 35975484603 --repo vantt/forgent --log --job "$jobid" > win-log.txt
```

524 `✖` lines total. Top assertion-text buckets (many span multiple unrelated
files — this is a first pass, not a final cluster map):

```text
176  Expected values to be strictly equal
 11  Cannot read properties of undefined (reading 'status')
  8  /Iron Law/ regex mismatch
  7  Unexpected end of JSON input
  7  /explicitly forbidden/ regex mismatch
  7  Expected values to be strictly deep-equal
  6  Expected "actual" to be strictly unequal to: 0
  5  The expression evaluated to a falsy value
  4  One process must win initial execution
  3  /not committed at the main checkout's HEAD/ regex mismatch
  3  quarantine/ must contain quarantined candidate
  2  Command failed: node bin/fgos.mjs topic register ... --purpose-slug worktree-reclaim
  2  the refusal tells the caller how to proceed
  2  /runner-sourced item/ regex mismatch
  2  /not clean/ regex mismatch
  2  stderr must report lock-held
  2  Sibling process must get idempotent outcome
  2  Missing expected exception (WorktreeError)
  2  Init must succeed: ... filename syntax incorrect
  1  Cannot read properties of undefined (reading 'branchHeadAtReturn')
  1  Cannot read properties of undefined (reading 'accounts')
  1  WorkValidationError: unknown id "guard-dep-item"
  3  WorktreeError: refusing to reclaim checkout ... uncommitted changes
  2  TrustStoreError: agy trust seed refused ... not itself trusted
  N  retargetMember: refusing to run from ... linked worktree
     (+ a long tail of 1-off messages not yet extracted)
```

Phases 01–04 below claim the buckets they have real evidence for. Everything
else is Phase 05's job.

## Requirements

1. Re-run this exact download against the CURRENT `main` HEAD (not
   `e2fc7754` — more commits may have landed since, including from this
   plan's own earlier phases if run out of order).
2. Re-run the categorization script (the `awk`/`sed`/`sort`/`uniq -c` pipeline
   above, or equivalent) and diff the bucket list against this file's numbers.
3. For any bucket that shrank to 0 that a later phase still claims, mark that
   phase's cluster already-closed instead of re-investigating it.
4. For any NEW bucket that appears (not listed above), triage it into an
   existing phase if it fits, or open a new phase file (`phase-06-...`) with
   the same structure as this plan's other phases.
5. Update `plan.md`'s phase table with the refreshed failure-count estimates.

## Files

- Reads only: no source changes in this phase.
- Writes: this file (append re-run results with the run ID and date), and
  `plan.md`'s phase table (refreshed counts).

## Validation

The refreshed bucket list accounts for every `✖` line in the fresh log (no
silent drop of a category), and every subsequent phase's "Est. failures"
column in `plan.md` is sourced from this phase's most recent run, not the
original 2026-09-24 numbers once this phase has run at least once.

## Risks

Windows CI wall-clock is long (~20-30 min per run) and `full-results-windows-latest`
artifact retention is 14 days — re-download before it expires, or this phase
has to burn a fresh CI run just to get the log back.

## Re-run Results (2026-09-24, run `35978159337`, HEAD `42934bf3`)

Downloaded from GitHub Actions:
- Run ID: `35978159337`
- Job ID: `107563441839` (`test (windows-latest)`)
- Commit: `42934bf3` (`docs(plans): add Windows CI hardening plan for the post-fix long tail`)
- All other platforms green (`macos-latest`, `ubuntu-latest`, `cargo test`, `external consumer proof`, `compare`).

Total `✖` lines: 524 (unchanged from initial estimate, as `42934bf3` only added documentation).

### Refreshed Bucket Counts

```text
176  Expected values to be strictly equal
 35  work "<id>" not found (dominant root-cause symptom across approve/return/sync-root/take)
 13  test/runner/coordination-phase2-concurrency.test.mjs (Unit 2E family)
 11  Cannot read properties of undefined (reading 'status')
 11  /Iron Law/ regex mismatch
  9  quarantine/ must contain quarantined candidate (fgctl-stage.test.mjs)
  7  Unexpected end of JSON input
  7  /explicitly forbidden/ regex mismatch
  7  Expected values to be strictly deep-equal
  6  Expected "actual" to be strictly unequal to: 0
  6  retargetMember: refusing to run from ... linked worktree
  5  The expression evaluated to a falsy value
  5  /runner-sourced item/ regex mismatch
  4  One process must win initial execution
  4  WorktreeError: refusing to reclaim checkout ... uncommitted changes
  3  Command failed: node bin/fgos.mjs topic register ... --purpose-slug worktree-reclaim
  3  /not committed at the main checkout's HEAD/ regex mismatch
  3  /not clean/ regex mismatch
  2  the refusal tells the caller how to proceed
  2  stderr must report lock-held
  2  Sibling process must get idempotent outcome
  2  Missing expected exception (WorktreeError)
  2  stage must succeed: io error: The filename, directory name, or volume label syntax is incorrect. (os error 123)
  2  TrustStoreError: agy trust seed refused ... not itself trusted
  1  Cannot read properties of undefined (reading 'branchHeadAtReturn')
  1  Cannot read properties of undefined (reading 'accounts')
  1  WorkValidationError: unknown id "guard-dep-item"
```

### Top Failing Test Files

```text
 53  test/cli/fgos-return.test.mjs
 41  test/cli/fgos-merge.test.mjs
 29  test/runner/herdr-spawn-adapter.test.mjs
 23  test/cli/fgos-claim.test.mjs
 18  test/cli/fgos-claim-2.test.mjs
 17  test/rust-host/fgctl-init.test.mjs
 15  test/e2e/runner-loop.test.mjs
 14  test/rust-host/fgctl-upgrade.test.mjs
 13  test/runner/coordination-phase2-concurrency.test.mjs (Phase 01)
 12  test/cli/fgos-move.test.mjs
 11  test/cli/fgos-iron-law-gate.test.mjs
 11  test/runner/worktree.test.mjs (Phase 02)
 10  test/runner/github-adapter.test.mjs
 10  test/runner/merge.test.mjs
  9  test/rust-host/fgctl-stage.test.mjs (Phase 03)
 55  test/cli/fgos-approve-* (cumulative)
  6  test/runner/promote-engine.test.mjs (Phase 02)
```

No bucket has shrunk to 0 yet. Phase 01–04 remain active with refreshed counts.

