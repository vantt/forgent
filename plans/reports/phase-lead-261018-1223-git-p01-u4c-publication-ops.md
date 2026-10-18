# Git phase 01, unit 4c: Publication authority checkpoint

Stopped under the brief's explicit instruction to report a missing holder-lock capability without editing that crate. No production implementation changed. The bounded borrow I/O prerequisite works; this finding does not reopen the historical streaming/control or suspended-start-barrier requests.

## Requirement → implementation → evidence

- Live opaque event-seal authority (Git §5, §10 C2; holder-lock §5 inode rule) → `Handle` keeps its file private and exposes only `name()`, `path()` and `declare_domain()`. `acquire` checks the locked description against the path once (`port.rs:551`). The common Unix `borrowed_command` checks exclusive mode but does not repeat that identity check (`port.rs:653`). `run_borrowed_io` therefore cannot itself establish that an old handle still represents the current serialization resource.
- Borrower verification without exposing the descriptor → `borrowed_check(&File, path, annotation, slot)` already implements the device/inode and kernel checks (`port.rs:876`), but an adapter holding `&Handle` cannot call it on the private file. Name/path equality and a fresh `probe` do not establish identity of that description. Reopening the path would check a different description. Git should not inspect private process descriptors or introduce a helper/alias/hook execution mechanism to circumvent this boundary.
- Real behavior → an OS-temp probe acquired an exclusive event-seal handle, renamed the lock file, acquired another exclusive event-seal handle at the original path, and successfully ran `git --version` through `run_borrowed_io` with the original handle while the successor was still held. Both handles reported identical names and paths. Output: `successor acquired replacement inode; old opaque handle still borrowed git successfully: git version 2.53.0`. The probe moved only its own temporary lock file, never a product lock. This is a stale-resource identity probe, not a claim that normal holder-lock acquisition replaces files.

The probe was a temporary `packages/git/rust/examples/publication_authority_probe.rs`, run with `CARGO_TARGET_DIR=.fgos/runtime/phase-target cargo run --locked -p fgos-git --example publication_authority_probe`, then removed. Reproduce its decisive sequence using public holder-lock APIs:

```rust
let resource = Resource::new("event-seal", temp.join("seal.lock"));
let first = match acquire(&resource, Mode::Ex, Wait::Try, 2000) {
    Acquire::Acquired(h) => h, other => panic!("{other:?}"),
};
std::fs::rename(&resource.path, temp.join("retained-original.lock")).unwrap();
let successor = match acquire(&resource, Mode::Ex, Wait::Try, 2000) {
    Acquire::Acquired(h) => h, other => panic!("{other:?}"),
};
assert_eq!(first.name(), successor.name());
assert_eq!(first.path(), successor.path());
// With successor still alive, run_borrowed_io(&first, &spec, &io) succeeds:
// spec: argv=[absolute_git, "--version"], cwd=temp, clear_env=true,
//       env=empty BTreeMap, stdio=BorrowStdio::Null.
// io: stdin=[], stdout_limit=4096, stderr_limit=4096,
//     deadline=Instant::now()+Duration::from_secs(10).
// Observed outcome.exit=Some(0), stdout="git version 2.53.0\n".
release(first);
release(successor);
```

Needed upstream capability: holder-lock-owned validation of an opaque acquired exclusive handle against the current lock resource, without exposing its fd. It can extend the existing borrow door to refuse stale/replaced resources before spawning, with a non-spawning validation entry usable before WAL Intent, or provide an equivalent validated borrowing abstraction. Reuse its existing `same_file`/borrower checks. Its API and implementation belong to holder-lock; no change there was attempted. Predecessor admission in `acquire` already exists and does not need replacement. No new registry row is requested.

## Validation and handoff

Both required baseline gates passed with private `CARGO_TARGET_DIR=.fgos/runtime/phase-target`: `cargo test --locked -p fgos-git -p fgos-durable-file` (33 tests: 24 Git unit, 3 Git contract, 6 durable-file) and `cargo clippy --locked -p fgos-git -p fgos-durable-file --all-targets -- -D warnings`. These validate unchanged foundations, not completed Publication operations. No new CAS/crash/remote conformance is claimed. `impact-analysis: inactive` (zero providers). History searches for `same_file` and `borrowed_check` lead to `1afc7973f`; the existing acquisition and borrower checks are the reusable prior art.

Event Store interface remains the preliminary `Publication` trait in `packages/git/rust/src/lib.rs`; no operational implementation or frozen handover is supplied. All requested step-6 operations remain: object writes, stop-set walks, ordered pin/WAL/target CAS and delete, remote results, object/ref directory durability, live authority/admission adapters, recovery and receipt materialization. Existing WAL recovery and compaction remain intact. Resume after opaque-handle validation is available, then execute the real repository/crash vectors. No git add/commit or registry/lifecycle mutation was run. Board/spec/changelog updates are outside the authorized write scope; the coordinator owns them. The report path is the exact path supplied in the brief (the convention query generated the same slug with the current minute).

Status: BLOCKED
Summary: The bounded I/O borrow works, but the opaque holder-lock API cannot validate a held handle against a replaced lock inode before Intent or spawning. A real temporary-lock probe admitted a successor and still successfully borrowed Git through the stale handle.
Concerns/Blockers: Needed holder-lock validation is outside this unit's write scope and that crate is explicitly forbidden to edit.
Context refs:
- docs/platform/git/spec.md §5, §10 C2 and rule 4a
- docs/platform/holder-lock/spec.md §5, §8
- packages/holder-lock/rust/src/port.rs:172, 551, 653, 689, 876
- packages/git/rust/src/wal.rs:769
- plans/reports/phase-lead-261018-1216-git-p01-u4b-holder-lock-borrow-io.md
