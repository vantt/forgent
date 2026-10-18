# Phase 01: Publication port, foundation and Event Store handover

- **Depends on:** G0 signed (D-ADR0057). Nothing else.
- **Branches:** lane A `git/p01a-core`, lane B `git/p01b-addon`; worktrees `.claude/worktrees/git-p01a`, `git-p01b`. Lane B starts once lane A has pushed the crate skeleton and the public Rust API stubs (first commit of A).
- **Model / effort:** opus, rigor critical. Lane A 32h, lane B 22h.
- **Blocks:** phase 02, the Event Store plan.

## Context

- Spec §4 (Publication, C1, combined addon, CAS and pin ordering), §7 (driver), §10 (WAL), §12 (distribution, doctor, C5), §15 V-PUB, V-CAS, V-GC, V-PACK, second-load, E5; §19 re-check rows for M1, P-WAL-ID, V-CAS, P-SYM-HOOK.
- Event Store spec §3, §10 step 2 (seal publish), §14 (sharing), §17 (route), §21 (doctor rows).
- Scout: no crate, no addon, no Rust LockScope exist ([scout](../reports/scout-261018-0922-git-component-plan-census.md)).
- Publication takes no 20/40/50 and runs under the caller's event-seal 58 (spec §5 table), so this phase needs no Rust LockScope.

## Requirements

**Lane A: crate `fgos-git` at `packages/git/rust`**
1. **Private CLI driver.** Resolves `git` once per process. It has two spawn primitives and no other: a direct spawn inside a Process containment domain, and holder-lock `run_borrowed` for a child that must carry a borrowed lock; the one-door scan (phase 07) accepts either only when called from `driver.rs`. Every call gets `--no-replace-objects`, `-c core.fsmonitor=false`, `-c gc.auto=0`, `-c maintenance.auto=false`, `--end-of-options` before revisions, and a scrubbed env: every inherited `GIT_*` removed, then explicit typed overrides only. Worker-supplied `GIT_ALTERNATE_OBJECT_DIRECTORIES`, `GIT_REPLACE_REF_BASE` and config-env injection are refused by name. Non-Remote calls set `GIT_NO_LAZY_FETCH=1` and `--no-lazy-fetch`; Inspect calls add `--no-optional-locks`; every diff adds `--no-ext-diff --no-textconv`. Where no containment driver answers `Empty`, a killed or timed-out call reports `containment-unproven` (spec §5). Output is streamed or bounded (64 MiB path lists, 50 MiB diff); overflow is a typed refusal. Stderr is bounded and redacted.
2. **Config that runs commands (spec §4: no inherited external commands).** A per-repo preflight (cached per process, re-read when a config file's identity changes) reads effective config with origins and refuses by name any key that would run a command inside a non-Remote operation unless RepositoryConfig provenance records it: `filter.*.{clean,smudge,process}`, `diff.external`, `diff.*.textconv`, `merge.*.driver`, `gpg.program` with signing on, `include.path`/`includeIf`, `credential.helper`, `url.*.insteadOf`, `remote.*.{uploadpack,receivepack}`, `core.sshCommand`. Publication transport runs with `-c protocol.allow=never` plus an explicit allow for the configured remote's scheme, and `core.sshCommand` reset to the trusted default. V-TRUST covers each key.
3. **Git floor, numeric and probed.** `packages/git/contracts/git-floor.v1.json` names the minimum version that has `--no-lazy-fetch`, `git hook run` and the `update-ref --no-deref` behaviour measured on 2.53.0; E5 fixes the number. At first use per process the driver probes, on a throwaway repo under the state root, that the trusted empty hooks location suppresses `reference-transaction` and that no-lazy-fetch is honoured; below the floor or on a failed probe every operation refuses by name. CI pins the Git version it tests.
4. **Env contexts:** `Scrubbed` (runner calls) and `HookContext` (keeps Git-supplied index/worktree/gitdir). Only the driver constructs them. Hook context is used from phase 05.
5. **RepoHandle and layout:** canonical common dir, trusted main root (G-002), object format (SHA-1/SHA-256). Detect shallow, alternates and promisor layouts before invocation; an operation that would need an unavailable object refuses naming the layout feature and keeping Git's error. Outside a repository `resolveRepo` returns `notARepository`.
6. **Oid, RefName, ExpectedTip** validation: full direct refs only, object-format aware, `Absent` distinct from an OID.
7. **Durable file primitive, one door.** The no-overwrite install already exists twice (`packages/run-supervisor/rust/src/publish.rs:20-51` `publish_once`; `packages/terminal-control/rust/src/store.rs:154`). Extract it into a leaf crate `fgos-durable-file` at `packages/durable-file/rust` (no fgOS dependencies) with an explicit durability result (a failed directory fsync is reported, never ignored); install by `renameat2(RENAME_NOREPLACE)` (Linux), `link` + `unlink` (macOS; a surviving temp is an orphan), `MoveFileExW` without replace (Windows); checked writes (a short write or `EFBIG` leaves a temp, never a record). Move both existing callers to it in the same change (L10).
8. **File WAL** at `<common-dir>/fgos/git/operations/<operation-id>/`, opened by directory fd with `O_NOFOLLOW`; a root that is a symlink, not owned by the user, or group/world-writable is refused. Versioned records with canonical digest and predecessor digest, installed through `fgos-durable-file`; record dir and parent fsynced; new ancestor dirs fsynced before the first record is acknowledged. Record 0 binds request digest and canonical resource set (`operation-id-conflict` on mismatch). The loser of record *n* stops before any effect. **TargetAttempt** precedes every irreversible effect; a chain with a TargetAttempt and no outcome is never re-effected. Parse, hash, version or chain error is `corrupt`, never empty. No TTL; no deletion of unknown evidence. Recovery acts only on paths and refs derivable from record 0's resource set and live Git state (registration, refs); a mismatch is `recovery-required`, never an action at a recorded path alone.
9. **Publication operations:** `writeBlob`, `writeTree` (literal entries/modes/OIDs, `mktree -z`), `writeCommit` (tree, ordered parents, explicit identity and date, message), `readRef` (symbolic-or-direct fact), `readObject` (`cat-file --batch`, typed), `walkCommits(tips, cursor, bounds)` (both parents, visited set, bounded continuation; crossing a shallow boundary returns `shallow-history-incomplete`), `compareAndSwap(ref, expected, next, operationId)`, `fetchRefs`, `pushRefs`.
10. **CAS order, no optimization (spec §4, §10):** Intent → write objects → fsync each loose-object fan-out dir written and `objects/` → pin `refs/fgos/git-operations/<id>/candidate` by exact-old CAS → read-back → fsync the pin's ref dir chain (and the `packed-refs` dir, or `reftable/`) → durable `prepared` → durable TargetAttempt → single-ref `update-ref --no-deref <ref> <next> <expected>` → read-back (symbolic fact and value) → fsync the target's ref dir chain → receipt. Hooks are disabled with a trusted empty `core.hooksPath`: an fgOS-owned empty directory under the state root (mode 0500, checked empty per call) unless the runtime probe of requirement 3 proved `/dev/null` on this Git. Never a multi-ref transaction.
11. **Namespace grants:** own `events`, `local-events`, `branch-events`, one-time `legacy`; mirrors written only by fetch with `+` mirror refresh; `git-operations` pins reserved to Git. Push only own events and the authorized legacy ref, never force, never mirrors, local or branch streams, or pins.
12. **Recovery for PublicationCas:** every row of the §10 recovery table that applies without a checkout, including raw multi-ref residue and a retained `<ref>.lock` (preserved, never unlinked by age or PID). Receipts carry `durability.processCrash` until E1 passes.
13. **Read-only facts for doctor and `fgctl`:** `listPending`, `inspectOperation`, retained bytes, oldest unresolved; a bounded scan reports `incomplete`, never clear; records that cannot be attributed are listed.

**Lane B: addon, Node facade, packaging, activation, doctor**
14. **Addon crate** `fgos-node-addon` at `packages/git/node-addon/` (cdylib; `napi`, `napi-derive`, `napi-build` pinned exactly). Modules: `git.rs` and an empty `event_store.rs` slot the Event Store plan fills. **Single load:** at module init the library registers a process-scoped, non-inherited marker keyed by pid and process start time (Linux: bind an abstract Unix socket with `SOCK_CLOEXEC`; macOS: `flock` a file under `<stateRoot>/run/` opened `O_CLOEXEC`; Windows: a named mutex in the `Local\` namespace, handle not inheritable). A copy loaded from another path fails to register and refuses every call with `git-addon-second-load`; a second N-API environment of the same library (a worker thread) sees its own static already set and is allowed; a child process registers its own marker. The addon receives the fgOS helper executable path from the manifest, never `current_exe` (which is `node`).
15. **One resolver for the addon, reused, no new env variable.** Extend `src/run-supervisor/payload-root.mjs` (already the payload-manifest locator) to return the manifest; `src/git/native.mjs` calls it. Cases: staged release (`<release>/manifest.json`, two levels above `libexec/legacy-node/`, `scripts/build-rust-distribution.mjs:8-9`, `:290`); dev build (the dev manifest candidate `payload-root.mjs:26` already accepts, and the dev host's existing manifest pointer, `scripts/run-rust-dev-host.mjs:98-112`); npm package (package-relative `native-addon.json`, prebuilt per target, digest-checked; Event Store §23.2 item 9 needs both channels). `scripts/run-tests.mjs` builds the addon and writes the dev manifest before the suite, also when `FGOS_HOST_BIN` is set. A missing or wrong addon is `git-addon-unavailable` before any mutation.
16. **Node facade** `src/git/`: typed wrappers only, no policy. Because a Rust spawn is invisible to the Node `child_process` exec guard, every facade call that can spawn git refuses with `exec-under-hot-lock` when `hotLockDepth()` (`src/state/hot-lock.mjs:58`) is above zero (spec §4: no Git under state 60). Rows in `docs/architecture-manifest.json`.
17. **Manifest:** add `components.nativeAddon` to `docs/platform/packaging-distribution/contracts/release-manifest.md` first, then `manifest.rs` (optional with `serde(default)` until phase 07), every `ComponentsInfo` constructor and the runtime projection (`canonical.rs:131`, `verify.rs:356`, `:428`, `:579`, `lib.rs:70`, `:88`, `:297`), `tests/schema_golden.rs`, `verify.rs` checks (digest, target, napi version, crate checksums from `Cargo.lock`), `scripts/build-rust-distribution.mjs` (stage the `.node`, `capabilities: ["git-wal-v1"]`). Targets come from `src/util/release-targets.mjs` (linux-x64, windows-x64); no new target. `ci.yml` and `release-assets.yml` build with `--locked` and run `cargo deny check` (advisories, sources, bans; crates.io only) with a new `deny.toml`; the release digest of the `.node` is compared with a second, independent build job.
18. **Registry and fence (D6).** The registry schema (`lock-registry.schema.v1.json`) gains owner `git` and a list form for fenced legacy paths, so the `activation` row keeps the 4.4 legacy path and adds the old v3 path; `fences.mjs` and its tests (`test/holder-lock/registry-contract.test.mjs`, `fences-rust-locks.test.mjs`) follow; `src/setup/holder-lock-checks.mjs:377` and `packages/distribution/rust/tests/activation_lock_multiprocess.rs` move to the new path. New row `repo-config` (D7). **The new `fgctl` places the fence itself**, inside the activation critical section of the first WAL-capable activation: it takes the old `activation.lock` and the new `activation-v2.lock`, unlinks the old lock file under the hold, and places the tombstone directory with a Rust tombstone primitive added to `fgos-holder-lock` (same `TOMBSTONE` format as `fences.mjs`). An older `fgctl` either finds the old lock held or meets `EISDIR` afterwards. No doctor fix or quiesce is needed for this fence.
19. **C5 in `fgctl`:** `fgctl` links `fgos-git` read-only. Before publishing an activation (init, upgrade, rollback) it refuses a candidate without `git-wal-v1` while the WAL holds an unresolved record (`git-wal-pending`), when the scan is incomplete or corrupt (`git-wal-unreadable`), when the activation fence is missing (`git-fence-missing`), and when `fgos internal quiesce-scan` finds a live process of a release without `git-wal-v1` (`git-predecessor-writer-live`). Rollback goes only through the new `fgctl`; the tombstone is never removed by hand while the WAL is non-empty. Registered in `docs/platform/packaging-distribution/contracts/activation-binding.md`.
20. **RepositoryConfig.ensureFetchMapping** (only this operation now), under `repo-config` 80, writing the Event Store mirror refspecs, never a push refspec; WAL payload `ConfigChange` with an exact-old config value check.
21. **Doctor** (bodies `src/setup/git-checks.mjs`, rows in `src/setup/registrations.mjs`): `git-component-compatible` (the one ABI row, Git floor and probe results, contracts, single load), `git-trust-topology`, `git-operation-journal`, `git-native-locks` (detect only), `git-publication-refspecs`, `git-durability-capability`. All read-only.
22. **Setup fix** `git-wal-dir`: create `<common-dir>/fgos/git/operations` (0700) and check writability; registered through `registerFix`. No config default is added.
23. **CHANGELOG** `[Unreleased]`: the addon, the manifest key, the activation-lock move and its fence (an older `fgctl` now stops with `EISDIR`), the new doctor checks, the refusal of command-running repository config inside Git operations.

## Interface handed to the Event Store

Rust (in-process for `fgos-event-store`), mirrored one-to-one by the addon's `git` facade:

```text
resolve_repo(path) -> Repo | NotARepository | Refused{cause}
write_blob(repo, bytes) -> Oid
write_tree(repo, entries: [{name, mode, oid}]) -> Oid
write_commit(repo, tree, parents: [Oid], identity, message) -> Oid
read_ref(repo, RefName) -> {Absent | Direct(Oid) | Symbolic(target)}
read_object(repo, Oid, expected_type) -> Bytes | Missing | LayoutRefusal | Error
walk_commits(repo, tips, cursor, bounds) -> {commits, next_cursor, complete: bool}
compare_and_swap(repo, RefName, expected: Absent|Oid, next: Oid, operation_id) -> Receipt
fetch_refs(repo, remote, refspecs) / push_refs(repo, remote, [(local, remote)]) -> Receipt
ensure_fetch_mapping(repo, remote, refspecs, operation_id) -> Receipt
```

- `Receipt` is spec §2 (`localEffect.publicationState`, `attribution`, `durability`, `remote`). A lost CAS returns `stale` with the actual tip; the Event Store retries only with a **new** operation id bound to the new expected value (spec §10 rule 4), which is its unchanged §10 retry.
- `compare_and_swap` must be called under the caller's `event-seal` 58; the port takes no lock and spawns git only outside `state` 60 (exec guard unchanged).
- Event Store keeps every protocol decision (manifests, parent order, coverage, retries). Git computes no event union.
- Doctor: Event Store registers no second ABI row; its Git floor comes from `git-component-compatible`.

## Steps

0. **Owner input (blocks step 13 only).** The proposal [`e3-budgets.md`](./e3-budgets.md) exists in this plan directory (starting numbers from the DC baseline and Event Store §17). Ask the owner to edit it, set its status line to owner-set, and commit it before any measurement. Coding does not wait.
1. Lane A: crate skeleton, `Cargo.toml` member, public API stubs, contracts dir `packages/git/contracts/` (receipt, result codes, WAL record schema, port list, Git floor).
2. Lane A: `fgos-durable-file` extraction, moving `publish_once` and the terminal-control store to it.
3. Lane A: driver, env contexts, config preflight, floor probe; NUL parsers; ceilings; containment wiring through `fgos-process`.
4. Lane A: RepoHandle, layout detection, Oid/RefName.
5. Lane A: WAL (records, install, fsyncs, TargetAttempt, root trust, recovery reader) with fault injection through an injected filesystem trait, never an env switch.
6. Lane A: Publication operations and the CAS order of requirement 10; recovery rows; doctor facts.
7. Lane B: addon crate and single-load marker; resolver in `payload-root.mjs`; Node facade; `run-tests.mjs` addon build; architecture manifest rows.
8. Lane B: manifest contract text, then `manifest.rs` and every constructor, `verify.rs`, staging, `deny.toml`, CI with `--locked` and the independent digest job.
9. Lane B: registry schema and rows, fences, Rust tombstone primitive, `fgctl` activation-lock move with the in-section fence, C5 checks.
10. Lane B: `ensureFetchMapping`, doctor checks, setup fix, CHANGELOG.
11. Docs: holder-lock spec (§7 rows, §12 fence placed by `fgctl`), packaging contracts, Git spec "Implementation status" line.
12. Vector tests below; opus code review on both lanes; resolve findings.
13. E3 publication workloads on ext4 against the owner-set `e3-budgets.md`. A failed budget stops the handover and reopens Q1 (spec §4 reversal trigger).
14. **Landing:** install the new `fgctl` on both machines from the release, then activate forgentX, mdview and mcp-skill-hub one at a time (the first WAL-capable activation of each workspace places its fence, requirement 18); doctor green; board row; handover note to the Event Store plan lead. The Event Store may write its first WAL record only after every workspace on both machines reports the fence.

## Files

| Action | File |
|---|---|
| create | `packages/git/rust/**`, `packages/git/contracts/**`, `packages/git/node-addon/**`, `packages/durable-file/rust/**`, `deny.toml` |
| create | `src/git/index.mjs`, `src/git/native.mjs`, `src/setup/git-checks.mjs` |
| create | `test/git/publication.test.mjs`, `test/git/native-load.test.mjs`, `test/setup/git-checks.test.mjs`, `test/helpers/git-addon.mjs`, `apps/fgctl/tests/git_wal_activation_gate.rs` |
| edit | `Cargo.toml` (members, workspace deps), `Cargo.lock` |
| edit | `packages/run-supervisor/rust/src/publish.rs`, `packages/terminal-control/rust/src/store.rs` (move to `fgos-durable-file`) |
| edit | `packages/distribution/rust/src/{manifest,verify,init,canonical,lib}.rs`, `packages/distribution/rust/tests/{schema_golden,activation_lock_multiprocess}.rs` |
| edit | `packages/holder-lock/rust/src/` (tombstone primitive), `packages/holder-lock/contracts/lock-registry.v1.json`, `lock-registry.schema.v1.json`, `src/holder-lock/fences.mjs`, `src/setup/holder-lock-checks.mjs`, `test/holder-lock/registry-contract.test.mjs`, `test/holder-lock/fences-rust-locks.test.mjs` |
| edit | `src/run-supervisor/payload-root.mjs`, `scripts/build-rust-distribution.mjs`, `scripts/run-rust-dev-host.mjs`, `scripts/run-tests.mjs`, `.github/workflows/ci.yml`, `.github/workflows/release-assets.yml`, `package.json` (`files`) |
| edit | `src/setup/registrations.mjs`, `docs/architecture-manifest.json`, `CHANGELOG.md` |
| edit | `docs/platform/packaging-distribution/contracts/release-manifest.md`, `activation-binding.md`, `docs/platform/holder-lock/spec.md` (§7, §12), `docs/platform/git/spec.md` (status line only) |
| owner edit | `plans/261018-0914-git-component-fgos-git/e3-budgets.md` (proposal exists) |

## Validation

```bash
cargo test --locked -p fgos-git -p fgos-node-addon -p fgos-durable-file -p fgos-distribution -p fgctl -p fgos-holder-lock -p fgos-run-supervisor -p fgos-terminal-control
cargo clippy -p fgos-git -p fgos-node-addon -p fgos-durable-file -p fgos-distribution --all-targets -- -D warnings
cargo fmt --all -- --check
cargo deny check
node --test test/git/publication.test.mjs test/git/native-load.test.mjs test/setup/git-checks.test.mjs test/holder-lock/registry-contract.test.mjs test/holder-lock/fences-rust-locks.test.mjs test/holder-lock/fences-main-door.test.mjs
env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN=<p01 build> npm test
```

Vector tests that must exist and pass (real temporary repos, barriers by injected filesystem/fault points, no sleeps):
- **V-PUB:** HEAD/index/tree/main lock unchanged from a linked worktree; DAG with both parents; installed `reference-transaction` hook never fires; symbolic owned ref refused at preflight and at read-back; direct-to-symbolic substitution between preflight and CAS changes nothing outside `refs/fgos/*`; `refs/replace/*` does not change reads.
- **V-CAS (publication):** competing exact-old, absent and delete; packed refs; one winner; kill between pin and target on `files` and `reftable`; raw multi-ref residue recovered through the WAL; TargetAttempt without outcome never reissued, including after ABA; retained `<ref>.lock` never unlinked.
- **V-GC:** `gc`, `repack -a -d`, `pack-refs --all` keep pins; unprepared objects never acknowledged.
- **V-CRASH (publication boundaries)** and **V-TRUST (publication part):** poisoned `GIT_*`, symlinked common dir, `.git` file pointing elsewhere, a symlinked or world-writable WAL root, each command-running config key of requirement 2, a planted WAL record naming a path outside its resource set.
- **P-WAL-ID and M1 on the implementation:** three requesters, same and different digest, different resource set; one transition writer; loser stops at `EEXIST`.
- **E5 floor probes:** no-lazy-fetch on every non-Remote operation in a promisor clone; shallow and alternates refusals by name; SHA-256 repo; hostile ref names; below-floor Git refused; failed hooks probe falls back to the owned empty dir.
- **V-PACK (part) and second load:** staged release and npm channel with the addon; ABI/target/digest mismatch refused; a copy at another path refused; a worker thread loading the same path allowed; a nested `fgos` child process loads normally; no PATH fallback.
- **C5:** `fgctl` refuses a manifest without `git-wal-v1` while a pending record exists, with the fence missing, and with a live old-release writer; an old `fgctl` build meets `EISDIR` (or the held old lock during placement).
- **Syscall order trace** (`strace -f -e trace=fsync,fdatasync,renameat2,link,rename`) of one CAS shows: object dirs fsync → pin CAS → pin dir chain fsync → `prepared` → TargetAttempt → target CAS → target dir chain fsync → receipt. Kept as E1's precondition.

## Risk

| Risk | L × I | Mitigation / signal and response |
|---|---|---|
| First N-API addon: toolchain, cross-target builds, Node ABI | High × Medium | napi-rs pinned; CI on linux-x64 and windows-x64; Node-API version in the manifest. A red windows-x64 build blocks phase 07 (the release that makes the addon required), not this phase. |
| E3 budget fails for the combined addon | Low × High | Measured before the Event Store builds on it. Any workload above budget stops the handover; owner decides on Q1. |
| Config preflight refuses a legitimate project setting (an LFS filter) | Medium × Medium | Named refusal points to RepositoryConfig provenance; the owner allow-lists it once per repo. |
| A machine keeps an old `fgctl` on PATH | Medium × High | Landing step 14 installs `fgctl` on both machines before activation; C5 checks the fence; the Event Store waits for every fence. |
| `renameat2` unsupported on a filesystem | Low × Medium | `link`+`unlink` detected at runtime; `git-durability-capability` prints which. |

## Rollback

Additive and dormant: no production caller writes through the port until the Event Store ships. Revert the merge and reactivate the previous release **through the new `fgctl`**, which runs C5 (refuses while WAL records are pending). The tombstone stays; an older `fgctl` is not used again. A WAL with records is never deleted.
