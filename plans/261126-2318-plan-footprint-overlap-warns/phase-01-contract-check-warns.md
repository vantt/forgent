# Phase 1: the contract check warns on cross-plan overlap

## Inputs

- `plan.md` of this plan: Outcome, "Decisions this plan takes" (warning text), acceptance criterion 1.
- `plans/discussions/ds-yf3vnbidi6-plan-footprint-overlap/DISCUSSION.md` §6 (D1).
- `scripts/plan-contract-check.mjs`: `collisions` (`:62`, returns `{a, b, shared}`), `activeOverlaps` (`:319-324`),
  `main` (`:350-390`), the same-wave rule (`:157-167`).
- `test/scripts/plan-contract-check.test.mjs`: `two ready plans with overlapping footprints are flagged by --all`
  (`:111`) and `cross-plan overlap is an error when ready and a warning when running` (`:226`).

## Files this phase may write

- `scripts/plan-contract-check.mjs`
- `test/scripts/plan-contract-check.test.mjs`

## Steps

1. Make `activeOverlaps` return the shared entries too: `[{ a, b, shared }]` with plan dir names, keeping the
   truncation and dropped-claim throws of `collisions` as they are.
2. In `main --plan`: every cross-plan pair touching the checked plan becomes a warning for any status, text
   `footprint overlaps another active plan <other> on <shared entries, comma separated>`. Delete the
   `ready`-is-error branch; no flag keeps it.
3. In `main --all`: replace the `ERROR active plans A and B have overlapping footprints` line with
   `WARN active plans A and B share <entries>`; a pair no longer makes the exit code non-zero.
4. Update the header comment and any JSDoc that says overlap is an error for `ready`.
5. Tests, in the owning file: rewrite the two cross-plan tests into one titled for the behaviour ("cross-plan
   overlap is a warning naming the other plan and the shared paths, for ready and running plans alike"): a `ready`
   plan beside a `running` one and two `ready` plans each exit 0 and print the `WARN` with both names and the
   shared path; `--all` exits 0 with one `WARN` per pair. Keep the truncation/dropped-claim test and the same-wave
   test unchanged (criterion 3).

## Verify

`node scripts/run-tests.mjs test/scripts/plan-contract-check.test.mjs` passes, and
`node scripts/plan-contract-check.mjs --all` exits 0 on the current tree (it may print `WARN` lines).

## Rollback

`git revert` the phase commit; the old error comes back with its tests.
