# Git phase 06 unit 10: recovery and lock ownership

- A: ConfigChange now reconciles through the existing config writer/recovery under repo-config 80, without the peer-rank recovery leaf; both §5 rows document the exception; registry and scope validation are unchanged.
- B: Real ConfigChange SIGKILL probes now assert listPending, inspectOperation, terminal reconciliation, stable request digest and per-port replay; the complete twelve-kind real-interruption/compaction matrix is NOT implemented.
- H1: record_owned_index_lock is crate-private and test-only; its seven tests moved from the integration file into the native_lock unit module, eliminating the public artifact-adoption API.
- C/M1/L3: Production spawn-time index ownership is NOT implemented; borrowed Git execution exposes no pre-execution child-identity callback, and its implementation is outside scope at packages/holder-lock/rust/src/port.rs; the single-capture restriction remains unresolved for multi-child operations.
- D/M2: Empty hooks means no file-backed scope supplies a value; effective config follows Git precedence, ownership/removal and exact-old guards use only the common local config; isolated HOME tests preserve global hooks and reveal them after owned-local removal.
- M3: ConfigChange now records an optional WAL configSequence assigned under repo-config authority; hooks and fetch-mapping provenance use it, never directory mtimes or hand-built operation paths; ambiguous latest historical provenance refuses ownership and omitted fields preserve historical digests.
- M4: All remaining last().phase state checks in Publication, Refs and WAL now use last_state(); digest/sequence users retain last().
- L1: Quarantine checks the moved inode after rename; a substituted inode is restored with a no-overwrite hard link or retained with an inspection report; the final-recheck race regression passes.
- L2: Spec runbook documents the config write-to-ownership-capture crash window and its intentionally preserved residue.
- L4: Config provenance remains retained and scans remain bounded at 100,000 operations; no new cache or retention policy was introduced.
- L5: Declared Git floor is 2.53.0, above --fixed-value support at 2.30; no compatibility fallback is needed.
- Documentation: Git spec, WAL schema and changelog updated; the untracked unit-8 review is preserved unchanged; the program board remains outside scope.
- Prior art: Reused change_config, existing config recovery, WAL retained/scan/last_state, process facts and native quarantine; history identifies 3e0cc30af as the ownership/last_state introduction and 8afafb6f3 as the Recovery door introduction.
- Verification: cargo test -p fgos-git --test publication --test repository_config -- --test-threads=1 — 35 passed, 3 helper tests ignored directly but invoked by parent tests.
- Verification: cargo test -p fgos-git --lib native_lock::tests -- --test-threads=1 — 7 passed.
- Verification: cargo test -p fgos-git --test repository_config --lib -- --test-threads=1 — 40 library and 6 config tests passed before moving the seven native tests into the library.
- Verification: cargo test -p fgos-git --test native_lock --test repository_config --test refs_remote --test publication --lib -- --test-threads=1 — passed before the test relocation and sequence changes; refs_remote 16 passed; superseded config/publication checks reran above.
- Verification: cargo clippy -p fgos-git -p fgos-node-addon --all-targets -- -D warnings — passed.
- Verification: node --test --test-concurrency=1 test/git/recovery.test.mjs test/git/repository-config.test.mjs test/git/native-lock-repair.test.mjs test/architecture.test.mjs — 33 passed after final production changes.
- Verification: git diff --check — passed; impact-analysis: inactive, zero registered providers.
- Preview: mdview open /home/vantt/projects/forgent/.claude/worktrees/git-p06/docs/platform/git/spec.md failed with a readonly database error; no preview URL is available.
- Constraints: No full npm test, E3 run, git add, git commit, registry edit, lifecycle verb or outside-scope source mutation.

Status: BLOCKED
Summary: ConfigChange recovery and the scoped review fixes are implemented with focused tests passing. Recovery completion still requires production pre-execution child ownership and the full payload interruption/compaction matrix.
Concerns/Blockers: Extend write scope to packages/holder-lock/rust/src/port.rs for a safe pre-execution child-identity boundary; do not treat the fixture recorder or current coverage as production ownership evidence.
Context refs:
- (none)
