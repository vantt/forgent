---
phase: 1
title: Skip live runtime directories in the leak check
status: done
---

# Phase 1: Skip live runtime directories in the leak check

Capability: `code:implement`.

## Inputs

- `plans/discussions/ds-ti2vip43kp-run-tests-fgos-leak-check/DISCUSSION.md` (outcome,
  constraints, acceptance).
- `scripts/run-tests.mjs`: `DERIVED_FGOS_FILES` (around line 428), `snapshotFgos`
  (around line 437), `diffFgosSnapshots`, and the two `allowedFgosMutations =
  DERIVED_FGOS_FILES` defaults (around lines 517 and 756).
- `test/scripts/run-tests.test.mjs`: section "`.fgos` Store Leak Guardrail Tests"
  (around lines 805-967), the owning proof of the leak check.

## Files it may write

- `scripts/run-tests.mjs`
- `test/scripts/run-tests.test.mjs`

## Steps

1. In `scripts/run-tests.mjs`, replace `DERIVED_FGOS_FILES` with an exported
   `LIVE_FGOS_DIRS`: the relative paths `runtime/land`, `runtime/mailbox`,
   `observe/records`, `logs`, `cache` (built with `path.join`). Its comment says why:
   other heads and the running land write these while a run is going, so a change there
   is not a test leak; `cache` also holds the derived state view.
2. In `snapshotFgos`'s walk, skip a directory whose path relative to `.fgos` equals an
   entry of `LIVE_FGOS_DIRS` (exact relative path, not a bare name). The running land's
   `land-*.log.partial` lives in `runtime/land`, so it is covered; confirm that by the
   test, not by a separate pattern.
3. Change both `allowedFgosMutations` defaults to an empty `Set`. Keep the parameter: it
   is the caller's door for exact-file exemptions and has its own test.
4. In `test/scripts/run-tests.test.mjs`:
   - Rewrite "tolerates a rewrite of the derived state view but still fails other cache
     changes" into one test of the new behavior: during a run, add or change a file in
     each of `runtime/land` (a `land-1-2-3.log.partial`), `runtime/mailbox`
     (`mail-taken`), `observe/records`, `logs` (`invocation-faults.jsonl`) and `cache`
     (`state.json` rewrite); assert status 0 and `fgosDiff.leaked === false`. In the same
     test, a second run that writes `runtime/other/leak.json` fails with status 1 and
     names that path. Title it by behavior, e.g. "the leak check ignores live runtime
     directories other sessions write but still fails a file left elsewhere".
   - Extend "snapshotFgos captures files in .fgos including observe/, excluding secrets"
     only if needed to show that `observe/friction` is still captured while
     `observe/records` is not.
   - Update the import from `../../scripts/run-tests.mjs` if it names the retired
     constant (it does not today).
   - The `cache/other.json` failure case is retired: the owner's list removes that
     behavior. Say so in the commit message.

## Verify

```bash
node scripts/run-tests.mjs test/scripts/run-tests.test.mjs
```

Pass: exit 0, and the existing leak tests ("fails with exit 1 and reports error when test
suite leaks a file into .fgos", "fails when a test leaks into .fgos/observe/ store",
"permits allowed mutations without failing the suite") are still green unchanged.

## Rollback

Revert the phase's single commit; both files return to the base commit's content.
