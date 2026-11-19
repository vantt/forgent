# Phase 9: A role take is never read as two holders

## Context (cause proven 2026-11-19, board eefb7e01a)
Miu's 10:29 rotation failed `identity-unavailable` / `ambiguous`. `session answered` -> `identity_take` ->
`packages/identity/rust/src/directory.rs` `register_in` stores the new holder (~833) and then strips the old one
(~850-861), two durable fsynced writes 0.82 s apart on the real disk, under the identity-directory lock. `resolve`
(~1605) scans lock-free and saw both. `src/session-rotation/rotate.mjs` polls every 1 s once `answered.json` exists and
`identityHolder` (`src/session-host/head-start.mjs` ~70-87) throws on `ambiguous`. Pre-existing (since 9a491ac12), not
phase 2.

## Design (decided by lead:OPC, Identity owner)
Keep store-then-strip (zero holders would read as "role gone" to every consumer, and a crash would lose the role).
Keep the common read lock-free.
1. `resolve`: only when the lock-free scan yields `ambiguous` for a role, take the identity-directory lock (the one
   `register_in` holds across both writes) with a bounded wait (about 5 s) and rescan once; the answer is then exact.
   Still ambiguous under the lock = real corruption, returned as today.
2. Defence in depth: `identityHolder` / `rotate.mjs` treat `ambiguous` as transient until the rotation's deadline.

## Tests
- Identity (`packages/identity/rust/tests/directory.rs`): a writer paused between store and strip while holding the
  lock; a concurrent resolve returns exactly one holder once the writer finishes, never `ambiguous`. A lone lock-free
  resolve does not touch the lock.
- Rotation (`test/session-rotation/rotate.test.mjs`): a holder poll that sees `ambiguous` once, then one holder,
  completes the rotation.

## Validation
`cargo test -p fgos-identity`, consumers that call resolve (`cargo test -p fgos-run-supervisor`), clippy -D warnings,
fmt, msvc + darwin check; `node scripts/run-tests.mjs test/session-rotation/rotate.test.mjs test/session-host/head-start.test.mjs`.
lead:OPC reviews the Identity lines.
