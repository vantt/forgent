# Event Store phase 08 — review fixes

- H1: Restore only explicit ordinary Git refusals/rejection with unchanged HEAD; recovery and unknown codes preserve Git-owned bytes and name the operation. Typed-envelope regression coverage added.
- H2: Select bounded per-attempt IDs from retained/compacted WAL outcomes; replace unfenced stale imports under event-seal with observed-OID CAS. Real rejected-then-retried baseline-only test added behind Git 05's existing export gate.
- H3: Fresh/unborn layouts pass; unfenced retired layouts warn with `fgos events migrate`; fenced disagreement/coexistence fails.
- M1: Unfenced truth comes from HEAD. Publication verifies the computed sealed data tree, every local/mirror legacy ref, and the dry-run commit identity before deletion.
- M2: Use 100,000-entry tree pages; routine admission/read lists consumer roots plus prior-import-discovered porting roots. Full discovery stays in migration/layout diagnosis; retained import names are hints, never event truth.
- M3: Append v4 porting lines to the sole historical log; test the exported log through the production reader. Ambiguous multiple destinations refuse. Section 18 maps export paths back to their original locations.
- M4: Once ScopedCommit exists, unexpected quiesce refusal fails with the host requirement; only the exact documented PID-namespace refusal skips. Coordinator host gate still requires zero skips.
- L1: Require `committed` and moved HEAD.
- L2: Check reports computed commit/data-tree OIDs and create/reuse/stale-replacement action without installing objects. Pure hash calculation is checked against real Publication identity.
- L3: Authenticate main root before quiesce/setup repairs.
- L4: Match exact historical event patterns; retain unrelated union rules; delete attributes when the removed rule was its only content.
- L5: Pass the selected Event Store configuration into the doctor's prepared store.
- L6: Convert missing/malformed pins into layout problems and reuse the shared fence validator for sealDigest/fromCommit. Missing-object, digest and coexistence regressions added.
- L7: Invoke Git's existing `recover_publications` under event-seal before publication/reuse; that door releases/compacts settled retained pins, including interrupted releases.
- L8: Reject Windows device names, colon, invalid characters, trailing dot/space in export/import paths; portable-path tests added.

Git 05's baseline-only fence restriction is removed. Reused Inspect, Publication, WAL, fence validation, setup fixes and production reducers; no new configuration, dependencies, Git subprocess adapter, mocks or test-only production branches. No out-of-scope edits, staging or commits. The supplied review remains unchanged. `impact-analysis: inactive` (no registered providers).

Verification commands:

```sh
cargo test --locked -p fgos-event-store --lib --test legacy_import --test legacy_reader --test reader_review_regressions
cargo clippy --locked -p fgos-event-store -p fgos-node-addon --all-targets -- -D warnings
node --test --test-concurrency=1 test/event-store/migrate.test.mjs test/event-store/rollback-export.test.mjs test/event-store/migrate-cutover-grant.test.mjs test/event-store/export-legacy-parity.test.mjs test/setup/event-store-checks.test.mjs test/architecture.test.mjs
git diff --check
```

Rust: 26 passing; clippy clean. Final Node: 58 tests, 56 passed, zero failed, two Git-05-export-gated skips. The broader run exposed an obsolete multi-porting success fixture; it now covers an explicit ambiguity refusal and the corrected export tests passed. Full `npm test` is intentionally reserved for the coordinator. MDView preview was attempted but its database is read-only in this environment.

Status: DONE_WITH_CONCERNS
Summary: Implemented the review fixes and updated the migration/rollback contract and focused regression coverage.
Concerns/Blockers: Git 05 is absent from this checkout, so its two real-hook tests remain gated; the coordinator must integrate Git 05 and require zero skips on the host before cutover.
