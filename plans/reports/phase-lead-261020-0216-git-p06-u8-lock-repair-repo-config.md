# Git phase 06 unit 8

Implemented dormant Rust, combined-addon and Node APIs for native index-lock repair and RepositoryConfig hooks operations. No production callers moved; no commit was made.

Native repair uses the existing checkout exclusion and shared process-identity judge. WAL ownership binds the operation, exact producer-owned descriptor/inode, contents/state and live child tuple. Repair quarantines only a matching artifact after proven death and an immediate recheck; unknown/live/substituted artifacts remain intact with inspection reports. Land, ScopedCommit, Sync and SafeRestore native index-lock refusals name `repairNativeIndexLock`. Tests demonstrate quarantine followed by successful SafeRestore recovery, inode/content races, dangling links, interrupted repair and preservation of an occupied quarantine destination. Historical/unrecorded artifacts cannot be adopted by repair; Node cannot assert ownership.

Hooks operations extend the existing fetch-mapping config writer, using LockScope repo-config 80, native config.lock, the existing private draft, stamp-validated config facts and ConfigChange WAL. Empty slots are filled with an absolute path; custom/unproven paths are preserved and reported. Removal requires successful provenance plus the exact old value. Guards run again after TargetAttempt immediately before replacement. Recovery observes effects without replay and quarantines exact dead-writer staging residue. The driver's command-line safety hooks override is excluded from stored hooks facts. Historical ConfigChange records retain their digests.

Validation (Linux):

```sh
cargo test -p fgos-git -p fgos-node-addon
cargo test -p fgos-git --lib --test native_lock --test repository_config
cargo test -p fgos-git --test native_lock --test repository_config
cargo clippy -p fgos-git -p fgos-node-addon --all-targets -- -D warnings
node --test test/git/repository-config.test.mjs test/git/native-lock-repair.test.mjs test/git/land.test.mjs test/git/land-recovery.test.mjs test/git/safe-restore.test.mjs test/git/scoped-commit.test.mjs test/git/sync.test.mjs test/architecture.test.mjs
git diff --check
```

All passed. The final focused Rust run passed 10 tests; its one directly ignored helper is invoked by the real SIGKILL recovery test. The final Node/architecture run passed 95/95. The crate suite includes existing Land/SafeRestore crash matrices and fetch-mapping compatibility tests; the standalone addon test binary prints missing Node-API host-symbol diagnostics but exits successfully, and Node tests exercise the real addon. No full npm test or E3 ran. Impact-analysis: inactive (zero providers).

Updated WAL schema, architecture manifest, Git spec and changelog. Prior art reused: phase-01 RepositoryConfig writer and its recovery fixes (`d1d4ec7ee`, `af932e76c`); existing WAL, checkout authority and process facts. General Recovery completion and GitHub adapter work remain the next unit; setup/doctor caller migration remains phase 07. The program board was read and kept outside this assignment's explicit write scope. MDView preview failed because its database is read-only.

Status: DONE
Summary: Added dormant native lock quarantine/inspection and owned hooks configuration APIs with guarded WAL recovery and passing focused verification.
Context refs:
- (none)
