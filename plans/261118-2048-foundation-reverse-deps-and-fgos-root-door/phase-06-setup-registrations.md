# Phase 06: setup registrations through the door

Wave 6. Depends on 5 (plan 261118-1847, account lease, is done, so nothing else is awaited). Capability `code:implement`. Effort 0.1d.

## Requirements

- Swap its three hand joins (`registrations.mjs:175, 329, 2264` on `ee31debfa`; re-grep on the current base) to
  `fgosDirFromRoot` from `src/util/fgos-file-registry.mjs`.
- Manifest: delete its debt entry from the "join .fgos onto a project root" row.
- Regenerate the Git mutation census and commit it with the phase.

## Proof

`checkDoors` (a stale debt entry fails); the setup tests that already cover the three call sites stay green.

## Validation

`node --test test/architecture.test.mjs test/setup/**` through the repo test runner.

## Risk and rollback

Low. Rollback: revert the commit; the debt entry returns with it.
