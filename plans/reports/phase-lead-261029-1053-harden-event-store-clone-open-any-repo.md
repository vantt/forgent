# HARDEN: event_store_clone::open opens any repository

Branch harden/event-store-clone-open-any-repo, worktree harden-es-open, commit a3a2ea694 (not pushed). Net +86/-22 over 5 files (census json +27/-... is generated; real code: -9 lines in open(), +63 test).

## Change
- event_store_clone.rs: fence probe and store-exists probe deleted; doc comment says None only outside a repository.
- mailbox_sync.rs: doc comment of publish() only (no guard line). packages/identity/rust/src/shared.rs: LogDoor::open doc no longer says "not migrated".
- apps/fgos/tests/cli_tests.rs: one new test identity_register_in_a_repository_without_a_fence_or_a_store_mints_the_store (git init + commit, no fence, no store; register; store.json exists, one session-published event).
- packages/git/contracts/mutation-census.v1.json regenerated (test file is scanned).

## Behaviour of mailbox_sync publish()
| case | before | after | evidence |
|---|---|---|---|
| (i) no fence, no store | None, nothing | would open and sync (fetch, creates fgos/events/locks and sync.json) | sync.rs:262-296,346: acquire_seal creates locks, opportunistic writes sync.json, fetch_refs always runs |
| (ii) fence, no store | opens, syncs, may fetch | same | open() unchanged for it; test apps/fgos/tests/mailbox_sync_child.rs:46 (fence, no store, pushes) green |
| (iii) store present | opens | same | cli_tests identity_register_publishes... and mailbox_routes sync-child test green |

## Guard decision: none added
Case (i) cannot reach publish() in production. The only spawner of the child is start_sync in mailbox_hook.rs:187-210, which already returns before spawning unless the main checkout has the fence file or layout.store() exists (same probe, own copy, comment at :195 says why: child would end before recording an attempt). Only a hand-run `fgos hook mailbox-sync --dir X` in an unfenced storeless repo now fetches and creates the sync dir; before it was a no-op. The guard ES suggested (skip when store absent) would break (ii), as predicted. An equivalent guard would be the old probe, so I did not add one; the hook gate already is that probe.
Follow-up for MAIL/ES (not done, MAIL owns the files): the hook gate still uses the legacy fence, so a post-cutover project with no store yet never starts the sync child until something appends. Rule (a) applied there too would mean dropping the fence half of that probe, but it would start syncing (network) in new projects, a behaviour change the owner should pick. Note publish_heads now mints the store for such a project only when the child runs.

## Node paths
src/event-store/native.mjs uses the addon (openStore, sync, sealIfDue, maintenance via loadNativeAddon); seal-coalescing, maintenance and verbs/events/sync go through it. No import of the Rust wiring open(); grep shows event_store_clone referenced only by identity_log.rs and mailbox_sync.rs. Unaffected; no Node tests run.

## Retired tests
None. No test asserted "unmigrated means None" (grep for unmigrated/never migrated finds only the hook test mailbox_routes.rs:1725, which tests the hook gate, unchanged and green). The behaviour is removed from open().

## Verification
- cargo test -p fgos: all suites pass (28, 42, 8, 32, 2 tests; new test included, cli_tests 42 total).
- cargo clippy -p fgos --all-targets -D warnings: clean.
- cargo check -p fgos for x86_64-pc-windows-msvc and aarch64-apple-darwin: both installed, both clean.
- git-one-door-scan: 0 undeclared sites; census staged.
- Did not verify the new test fails on the old code by running it (reasoning: old open returned None, so no store).

## Docs lines needed (docs/ frozen, not edited)
- docs/specs for Event Store / identity shared directory: "the clone opens for any repository; the store is minted by the first append; the .fgos/events fence no longer gates the host opener."
- Mailbox spec (sync child start condition): still states fence-or-store gate at the hook; unchanged, but flag the follow-up above.
- CHANGELOG [Unreleased]: "identity registration works in projects created after the Event Store cutover (no .fgos/events fence)".

Status: DONE_WITH_CONCERNS
