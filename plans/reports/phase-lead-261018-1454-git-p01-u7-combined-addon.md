# Git phase 01, step 7: combined addon

Implemented dormant `fgos-node-addon` (`cdylib`, Node-API 8) linking Git and Event Store, with exactly pinned napi/napi-derive/napi-build. Reused Lane A's PublicationPort, HolderAuthority, GitDriver and holder-lock; Event Store owns append, bounded read, identity, rotation, registration and validation. No production caller, release staging, activation or doctor registration was added. `impact-analysis: inactive` (no providers registered); history search found no previous addon implementation.

The process marker registers at module initialization: Linux abstract CLOEXEC socket keyed by pid/starttime; Windows non-inheritable Local mutex keyed by creation time; macOS CLOEXEC flock under the existing FGOS_STATE_ROOT/run. A physical copy fails with `git-addon-second-load`; another worker environment using the same library succeeds; children register independently. Only Linux was exercised.

`payload-root.mjs` now exposes its manifest locator. The loader checks confined paths, SHA-256, platform/architecture and Node-API before exposing either crate; it accepts staged-release and package-relative native-addon.json records. The helper executable comes from manifest entries.fgos, never Node's current executable. Linux Publication uses Lane A's helper-free borrowed-I/O path. Step 8 must synchronize the provisional record shape: components.nativeAddon `{path, digest, target: "linux-x64"|"win32-x64", napiVersion: 8}`; package manifests use that same components wrapper.

Node API: createGitPublication retains opaque Rust repository/seal authority until close and forwards typed operations through call(method,args); every public Git call refuses under the hot gate. createEventStore exposes the currently implemented identity, append, readInGate and rotate operations. It forwards capability guarantees and refuses non-Linux platforms before disk access. Full DAG read/seal/sync/export/import remain owned by subsequent Event Store phases, rather than invented here.

The full-suite CLI builds the addon under its queue even with FGOS_HOST_BIN supplied, writes a private development manifest, and preserves active-release metadata. The test helper verifies source fingerprints and binary digests before reusing prepared bytes; publication uses rename rather than overwriting a mapped library. All Cargo artifacts use `.fgos/runtime/phase-target`, including a private writable Cargo cache for this worker.

Verification:

- `cargo test --locked -p fgos-node-addon -p fgos-git -p fgos-event-store`: green; existing subprocess-harness entry remains ignored.
- `cargo clippy --locked -p fgos-node-addon -p fgos-git -p fgos-event-store --all-targets -- -D warnings`: green.
- `node --test test/git/*.test.mjs test/architecture.test.mjs`: 34 passed. Includes copied-load refusal, worker/child loads, staged/npm resolution, digest/ABI refusal, real append/read under withStateTx and real Git object/walk/CAS calls outside it. Node 24 rejects the literal directory argument `test/git/`, so the equivalent explicit file selection was used.
- Supplemental supervisor/runner suites were tried and had failures involving run-control, credential write-back, fixture cleanup and watchdog cleanup. No full-suite green or baseline attribution is claimed.

Cargo evidence: `.fgos/runtime/phase-target/addon-{rust-tests,clippy}.log`. Reproduce through `node test/helpers/git-addon.mjs --verify`. No git staging or commit was performed. MDView preview was attempted but its database is read-only in this worker.

Status: DONE_WITH_CONCERNS
Summary: Implemented and verified the combined dormant addon and thin Node route within step 7.
Concerns/Blockers: Lane A declares RepositoryConfig::ensure_fetch_mapping but provides no implementation; its exposed binding fails closed with git-publication-unavailable instead of creating a second policy owner. Coordinator follow-up is required in packages/git/rust/src/publication.rs. Windows/macOS markers need their platform runners. Program-board and CHANGELOG updates are outside this assignment's write scope; release/ABI registry integration remains steps 8–9.
Context refs:
- (none)
