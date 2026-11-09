# Lead report: HARDEN T9 P17 kill wait and identity directory

Branch `harden/t9-p17-kill-wait-identity` (worktree `/home/vantt/projects/forgent-worktrees/harden-t9-p17-kill-wait-identity`), tip `05146a6b5`, pushed, rebased on origin/main. NOT landed: waits for OPC re-review (Git tree touched).

## Done
- The doctor row names an unreachable door (`warning: identity door unavailable (<err>)`) instead of reading it as an empty directory; the wiring test covers it through an injected door.
- Kill wait: `holderLock.killWaitMs()` added to the addon (returns the crate's `DEFAULT_KILL_WAIT_MS`); Node literal in `protocol.mjs` deleted; the three readers (`index.mjs`, `direct-launch.mjs`, `holder-lock-checks.mjs`) read `doorKillWaitMs()` from `driver.mjs`. The export name did not survive: a constant cannot be lazy, so every caller moved (L10).
- Identity directory: `shared::judge_directory` / `Cache::judge` in `packages/identity/rust/src/shared.rs`; addon `sessionIdentity.sharedDirectory(mainRoot)`; no new verb. Addon versions `holderLock` 2 and `sessionIdentity` 2, `combinedAbiMatches` requires them (an old addon fails by name).
- Deviation from the phase text (OPC, L10): the phase said P10 switches the doctor row; OPC asked for it in this change, so `identity-checks.mjs` now calls `identityDoor().sharedDirectory` and its cache parsing is deleted. P10 has nothing left to do for this row.
- An entry with no project id is not counted as another project's (documented on the field).
- Docs: one sentence each in `docs/platform/holder-lock/spec.md` and `docs/platform/identity/spec.md`. No CHANGELOG line (no user-visible change).

## Tests
- Red: crate tests were written with the function; the first run was a compile-level red that I did not record separately (honest gap).
- Crate: 6 new cases in `packages/identity/rust/tests/shared.rs` (no cache/no project, clean, dropped, foreign, no-project entry, shared handle). Node wiring: `test/holder-lock/kill-wait.test.mjs` (value equals crate constant, no literal in protocol.mjs), `test/util/session-identity.test.mjs` (door answer), `test/setup/identity-checks.test.mjs` (row retired its own parsing proof; kept one wiring proof through the real crate; owners of the cases: `tests/shared.rs`).
- Gate: cargo fmt, clippy -D warnings (identity, holder-lock, node-addon), msvc and aarch64-apple-darwin `cargo check` green; census scan 0 undeclared (regenerated); architecture, doc-health, citation-drift green; full `npm test` (before the doctor-row change): 8639 tests, 1 fail = the known V7n addendum. After the row change reran focused identity/setup/session/architecture/doc-health: green. Cargo test: `fgos_holder_lock borrow_io nested_pidns_recipient_is_killed_at_release` failed once under load, passes alone (flake; one doctor row test in identity-checks flaked once the same way, passes alone).
- OPC note 3: `writeSettleContext` itself does not call the door; `readLaunchSettings` and `prepareAcquire` do, and both already needed the addon (lock door). Full suite showed no checkout-only path failing.

## Size
Node: about -35 in src (protocol -3, identity-checks -20, rest ~0) ; Rust +~75 (crate +60, addon +15); tests about +60 (crate +85, Node doctor test -10, new kill-wait +20).

## Authority
- Kill wait (decision 12): was Node and Rust; now crate only, Node reads it through the addon.
- Shared-directory judgement: was doctor row parsing the crate's private cache; now crate judges, doctor shows. Open item for the identity crate: `FGOS_FILE.IDENTITY_DIRECTORY` now has one JS use, `src/identity/directory-store.mjs:15`, which still deletes the cache file in Node (a Node write to the crate's private file); belongs to the crate, not moved (not owned by this phase).
- `src/runner/lock-fence.mjs` has its own `KILL_WAIT_MS = 3000` (a different bound, the fence's); not touched, worth a look by T1 owner.

## Lessons
- A phase's "do not edit file X, P10 will" split left two doors for one decision until review; move the caller in the same change.
- The census guard needs `--write-census` after each commit touching listed files; run it before the first commit.
- Full-suite queue wait was long (other leads); start the full run early and keep edits out of the worktree until it ends.
