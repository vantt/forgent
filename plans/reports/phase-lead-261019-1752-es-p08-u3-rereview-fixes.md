# Event Store phase 08 — re-review fixes

- High-1: Under event-seal, authenticate local/mirror observations before recovery or local CAS, then recheck after recovery; published conflicts refuse unchanged with the fenced-main/owner recovery. Check plans agree. Real stale/matching-mirror regressions pass, including byte-unchanged local refs.
- Medium-1: Select and return the attempt ID under event-seal; keep it separate from the strict tracked fence. Section 21 documents quiesce exclusion and Git's final known-ID arbitration; the real-process scan test requires the host PID namespace.
- Medium-2: `commitCalled` separates restorable filesystem failures from Git-owned commit outcomes; preserve the HEAD guard and name Git records only after a commit call. Added a real empty-directory obstruction regression gated on Git 05.
- Low-1: Removed the JS hasher; Rust shares import file mapping, tree traversal and commit identity with publication and returns dry-run OIDs through the addon. Added one small read-only Git driver primitive; SHA-1/SHA-256 tests prove no object installation, and migration identities match real publication.
- Low-2: Retained serialized outcome tags because this checkout's reachable Git Outcome enum lacks CommitRejected; adding it is Git 05's ownership. Section 21 documents the fail-closed committed-then-manually-reset case.
- Low-3: No new setting; documented fixed consumer roots plus previous-import discoveries and the doctor warning guard. A tracked custom/intake/porting/events.jsonl warning regression passes.
- Low-4: Validate successful cutover from committed status and result.oid without opening the WAL after commit.

Reused Git Inspect/Publication, existing command input, tree traversal, seal recovery and ScopedCommit; no new configuration, dependency, Git writer, mock or test-only branch. Checked the restore allow-list against git/p05-commit-sync at c696892b9: recovery/unknown codes still fail closed. Impact-analysis: inactive (zero registered providers). No staging or commits. The supplied re-review is unchanged. Report path follows the explicit assignment (the convention door returned the current-time variant).

Verification:

```sh
cargo test --locked -p fgos-event-store --lib --test legacy_import --test legacy_reader --test reader_review_regressions
cargo test --locked -p fgos-git --lib read_only_hash_object_does_not_install_bytes
cargo clippy --locked -p fgos-event-store -p fgos-node-addon -p fgos-git --all-targets -- -D warnings
node --test --test-concurrency=1 test/event-store/migrate.test.mjs test/event-store/rollback-export.test.mjs test/event-store/migrate-cutover-grant.test.mjs test/event-store/export-legacy-parity.test.mjs test/setup/event-store-checks.test.mjs test/architecture.test.mjs
node --test --test-concurrency=1 test/event-store/migrate-cutover-grant.test.mjs test/event-store/rollback-export.test.mjs
cargo test --locked -p fgos-event-store --test legacy_import
node --test --test-concurrency=1 --test-name-pattern='published stale|matching local|real import is deterministic' test/event-store/migrate.test.mjs
git diff --check
```

Rust: 26 Event Store tests and one Git test pass; clippy clean. Broad Node run: 58 passed, one fence-metadata serialization failure, three gated skips. Fixed that failure by separating attempt metadata from the fence; targeted rerun: two passed, four gated skips (including the newly added pre-commit failure regression). Final mirror/identity rerun: three passed, no skips. All broad-run tests now have passing evidence except the four explicitly gated checks. Full npm test intentionally not run. MDView preview failed because its database is read-only.

Status: DONE_WITH_CONCERNS
Summary: Addressed all seven re-review findings within the authorized scope and verified the available focused Rust/Node behavior.
Concerns/Blockers: Coordinator must integrate Git 05 and run the three real ScopedCommit tests plus concurrent-migrate quiesce proof on the host with zero skips before cutover.
