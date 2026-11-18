# Phase 06: setup registrations through the door

Wave 6. Depends on 5 and on plan 261118-1847 (account lease) being done, because 1847 holds
`src/setup/registrations.mjs`. Capability `code:implement`. Effort 0.1d.

## Requirements

- Add `src/setup/registrations.mjs` to this plan's frontmatter footprint (the supervisor confirms 1847 is done first).
- Swap its three hand joins (`registrations.mjs:176, 330, 2291` on base `5fd22aa1d`; re-grep on the current base) to
  `fgosDirFromRoot` from `src/util/fgos-file-registry.mjs`.
- Manifest: delete its debt entry from the "join .fgos onto a project root" row.

## Proof

`checkDoors` (a stale debt entry fails); the setup tests that already cover the three call sites stay green.

## Validation

`node --test test/architecture.test.mjs test/setup/**` through the repo test runner.

## Risk and rollback

Low. Rollback: revert the commit; the debt entry returns with it.
