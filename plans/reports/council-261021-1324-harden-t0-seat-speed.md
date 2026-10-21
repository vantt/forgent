# HARDEN T0 council — seat "speed and weight" (axes C and D)

Main `71ba43d80` (`git rev-parse --short HEAD`), 2026-10-21 13:30–14:10 Asia/Saigon, second machine (`fg-server2`, 24 CPUs, ext4 on NVMe, bwrap 0.11.1, load 2.6–15 while measuring). Read-only seat; the only file written is this report. Brief: `plans/reports/council-261021-1324-harden-t0-council-brief.md`.

**What I read, every line:** `packages/process/rust/**` (src 5 334, tests 2 279, both contracts), `packages/host-runtime/rust/**` (src 6 302, tests 2 037 + fixture 224, `command-routes.json`, annotations), `packages/canonical-json/rust/**` (+ vectors), `packages/durable-file/rust/**`; Node: `src/runner/dispatch/process-identity.mjs`, `src/util/unique-tmp-tag.mjs`, every §A/§B/§C site of phase 01 (line numbers re-checked on `71ba43d80`; the only drift found: §A #12 is now `assignment-runner.mjs:920-926`, §A #9's `kill(pid,0)` at `registrations.mjs:5509-5511` belongs to `deadOwnedConfinementDirs` / row `confinement-orphaned-resources-reaped`, not to `confinement-backend-registry-readable`), the five T0 Node test files, `test/rust-host/{internal-routes,help-routes,command-routes}.test.mjs` heads, `test/state/hot-lock-host-judge.test.mjs`, the T0 doctor rows in `src/setup/registrations.mjs` and `src/setup/run-supervisor-checks.mjs:99-124`, the addon loader `src/git/native.mjs` and `packages/git/node-addon/src/{lib,single_load}.rs`, and the Rust consumers of the T0 primitives (`holder-lock/driver/flock.rs`, `git/driver.rs`, `run-supervisor/route.rs`).

**What I ran** (throwaway, under `/tmp/fgos-work/harden-t0-speed/`, data files on ext4 under `~/.cache/fgos-work/`, removed afterwards; raw output in `rust-bench.txt`, `node-bench.txt` there):
- a release-profile Rust binary linking `fgos-process`, `fgos-durable-file`, `fgos-canonical-json` (`bench/src/main.rs`), 579 processes in `/proc`;
- `node node-bench.mjs`: 20 fresh processes loading the activated release addon (`~/.local/state/fgos/releases/sha256:ffe66288…/libexec/native/fgos.node`, 11 361 880 bytes), warm N-API call floor, the Node leaf judge;
- no `fgos …` command and no test file was run; no `npm test`.

## 0. Measured numbers this report decides from

| Call | p50 | p95 | Where it is paid |
|---|---:|---:|---|
| `facts::judge_here(record)` (Rust, live or dead) | 5.2 µs | 5.3 µs | every Rust judge: domain `is_empty`, `pgroup_*`, `native_lock.rs` |
| `facts::judge(record, &observer, &table)` with the observer read once | 2.6 µs | 2.7 µs | the same work without re-reading host/boot/ns |
| `facts::observer()` alone (gethostname + `/proc/sys/kernel/random/boot_id` + readlink `/proc/self/ns/pid`) | 2.5 µs | 2.6 µs | re-run inside every `judge_here` and every `identity_of` |
| `facts::observe(pid)` (`/proc/<pid>/stat`) | 2.6 µs | 2.7 µs | |
| `Record::from_json` + `judge_here` (the shape an in-process door would run) | 5.6 µs | 5.6 µs | Q1 |
| Node leaf `judge(record)` (`process-identity.mjs:126`, `localObserver()` per call) | 7.2 µs | 8.8 µs | hot-lock waiter loop today |
| Node leaf `judge` with the observer cached | 3.7 µs | 3.9 µs | |
| Node `pidExists` (`kill(pid,0)`) | 0.3 µs | 0.3 µs | |
| warm N-API call `addon.versions()` (JSON object out) | 11.6 µs | 12.8 µs | the floor of any binding call that returns an object |
| cold `require(fgos.node)` (dlopen + init marker) | 489 µs | 505 µs | once per Node process |
| cold first N-API call after dlopen | 45 µs | 46 µs | once per process |
| sha256 of the 11.4 MB release addon (`native.mjs:52`) | 8.1 ms | 8.2 ms | once per Node process today (75 ms on the 86 MB debug addon in the suite) |
| `fgos internal process-observe` route (baseline) | 1.33 ms | 1.50 ms | one spawn per call |
| `containment::select` cold, fresh process (`containment/linux.rs:44-62`, spawns bwrap) | 1.77–2.12 ms | | once per process that builds a `GitDriver` or probes `supervise` |
| `containment::select` warm, same process | 1–3 µs | | |
| `git --version` bare / under `bwrap --unshare-pid --as-pid-1` (the git driver's `spawn_in`, `git/driver.rs:1172-1195`) | 0.56 ms / 1.98 ms | 0.65 / 2.14 ms | +1.4 ms per git child, 5–6 children per CLI call |
| `Command::spawn(/bin/true)` / `spawn_with_fds` (fork + pre_exec) / `spawn_mapped` (posix_spawn) | 285 / 372 / 300 µs | 349 / 444 / 330 µs | small parent; the fork penalty grows with heap size |
| `signal_by_identity` (pidfd + judge, mismatch path) | 6.0 µs | 7.8 µs | |
| `facts::lock_holders(dev,ino)` / `locked_fds(dev,ino,None)` / `file_users` (every pid) | 5.9 / 5.9 / 5.8 ms | 6.9 ms | holder-lock fallbacks (`flock.rs:196,368,459`), git `native_lock.rs` |
| `facts::lock_holders_among(dev,ino,[1 pid])` | 18 µs | 18 µs | the borrow hot path (`flock.rs:458`) |
| `facts::relations()` (one `openat`+read per pid) | 1.45 ms | 1.53 ms | `flock.rs:266` fallback when the creation mark is older than `pid_max/4e6` s = 1.05 s on this machine (`pid_max` 4 194 304) |
| `facts::creation_mark()` / `created_since(fresh)` | 1.3 / 4.8 µs | | every borrow |
| `facts::scan` (status, exe, cwd, cmdline; +environ) | 6.3 / 7.8 ms | 6.9 / 7.9 ms | `quiesce-scan` route, stop-everything |
| `domain_is_empty(LinuxGate)` / `LinuxPgroup` live leader / `LinuxPgroup` dead leader (`live_rows` full pass) | 5.4 µs / 5.4 µs / 2.0 ms | | gate watch; best-effort driver only |
| `durable_file::replace_durably` / `_with_mode` / `install_once` (ext4) | 10.30 / 10.29 / 10.49 ms | 10.7 ms | file fsync 5.1 ms + directory fsync 5.1 ms |
| write tmp + rename, no fsync (the Node no-fsync class) | 13.8 µs | 33.6 µs | |
| write tmp + fsync(file) + rename (the Node "durable" class as written today) | 5.14 ms | 5.22 ms | |
| write tmp + fsync(file) + rename + fsync(dir) | 10.30 ms | 10.49 ms | = `replace_durably` |
| write tmp + fsync(file) + link (create-only, no dir fsync) | 5.26 ms | 5.32 ms | `fences.mjs:328-343` |
| `canonical_json` small / 200 keys (Rust) | 0.4 / 14.7 µs | | Node twins: 2.0 / 171 µs (baseline) |

## Part A — target shape per component

### A.1 `fgos-process` (Process Facts & Control + Containment port)

1. **Authority.** The one judge of a recorded process tuple (`alive | dead | unknown`), the one way to signal a process by identity, the one way to spawn with an explicit fd map, and the one process domain per attempt (`create / spawn_in / is_empty / kill_all / guarantee`). Every other layer, Rust or Node, asks it; none keeps a copy.
2. **Contract and ports.** Rust: `facts::{judge, judge_here, observe, identity_of, self_identity, creation_mark, created_since, relations, lock_holders, lock_holders_among, locked_fds, file_users, scan, file_key}`, `control::{spawn_with_fds, signal_by_identity, take_inherited, arm_parent_death_signal}`, `mapped::spawn_mapped`, `containment::{select, ContainmentDriver, SpawnSpec, Guarantee}`, `{domain_watch, domain_is_empty, domain_kill_all}`; error names stay as they are (`SignalOutcome::{Sent,NotFound,IdentityMismatch,IdentityUnknown,Denied,Unsupported,Failed}`, `ContainmentError::name()` ∈ `unsupported-platform | driver-unavailable | spawn-failed | namespace-unavailable | invalid-bwrap-prefix | io`). Node (Q1, in-process binding): five exports and nothing else — `judge(record) → 'alive'|'dead'|'unknown'`, `holderLiveness(record) → 'dead'|'held'` (the spec §3 adapter, moved into the door), `selfRecord() → {host,bootId,pidNs,pid,startTime}`, `observe(pid) → {kind,startTime?,cause?}` (what `process-observe` returns today), `signalByIdentity(tuple, sig) → outcome name`; plus, for the stop-everything and home-cleanup cold paths, `scan(filter)`. Route kept for cold admin paths only: `fgos internal process-observe` (already in the holder-lock crate, `holder-lock/rust/src/route.rs:477-505`) until the binding ships on every channel, then deleted (L10).
3. **Rust/Node boundary and Node budget.** Rust decides everything above. Node keeps: the loader (shared with the Git addon, one file, ≤ 40 lines of T0-specific code: contract-version check + named refusal), `process-identity.mjs` reduced to the thin re-export of the five calls (≤ 40 lines, no `/proc` read, no `kill(0)` decision), and `pidExists` only where a caller needs a non-deciding existence fact (`gateway-control.mjs:66-72` wait loop) — 0 deciding lines in Node. `uniqueTmpTag` (13 lines) stays Node: it is a name, not a decision.
4. **Delete list** (details in the Delete table): `process-identity.mjs:27-147` (the twin judge, `/proc` reads, observer, stat parser); `run-lock.mjs:34-42,69-71`; `hold-transport.mjs:51-58` (liveness half); `fences.mjs:97-105` (T1 confirms); `lock-fence.mjs:46-81` (judge + bare-pid signal); `stop-processes-inside.mjs:21-23,64-71` (bare-pid kills); `provider-credential-renewal.mjs:704-708`; `registrations.mjs:5990-6142` (row, fix and mtime branch); `hot-lock.mjs:57-94` (route judge + TTL cache); the route client `src/holder-lock/driver.mjs:269-292` and the route body `holder-lock/rust/src/route.rs:474-505` + contract `internal-route.process-observe.v1.json` once the binding is on every channel; in the crate: `facts::kcmp_same_file` (`platform/linux.rs:414-419`, no production caller), `facts::start_time` (`facts.rs:254-259`, no production caller), `containment/linux.rs:305-338` (`StatRow`/`read_stat`/`live_rows`, replaced by `facts::relations` and the one stat parser); tests: the verdict cases of `test/runner/process-identity.test.mjs` and `test/runner/run-lock-identity.test.mjs`, `test/state/hot-lock-host-judge.test.mjs` (route wiring of a mechanism that goes).
5. **Doctor rows kept.** One: `process-containment` (`registrations.mjs:2339-2343` → `run-supervisor-checks.mjs:109-124`), T0 component health (driver, level, escapes). The binding's "loads and matches the contract version" condition merges into the packaging row `legacy-node-payload-present` (the payload and its addon are one shipped component), not a new row.
6. **Size target.** Rust: −60 (one stat parser, `live_rows` gone, two dead functions) + binding exports ≈ +120 ⇒ ≈ +60, paid by Node −420 (sites above) and tests −250 (two Node files retired, one deleted, `help-routes` rewritten). Layer Δ for this component ≈ −600.

### A.2 `host-runtime`

1. **Authority.** The host's invocation kernel: the route table contract (`command-routes.json`, `command-route-annotations.json`), the operation catalog, the admission → select → grant → invoke → record pipeline, and the civil-time helpers the native verbs share.
2. **Contract and ports.** `contracts::{OperationId, HostInvocation, OperationRequest, ProviderOutcome, ProviderError, ProviderDescriptor, OperationDescriptor, RegistrySnapshot, JsonOutcome}`, `registry::build_snapshot`, `operation_provider_router::select` (`SelectionRefused::{MissingBinding, AmbiguousBinding, IncompatibleContract, DisallowedHostKind, WrongInvocationMode}`), `authority_gate::{CallerAdmission, ProviderGrant}`, `invocation_service::{InvocationService, OperationProvider, EventSink, NoopEventSink, InvocationLifecycleRecord, InvocationTerminalState, LifecycleTracker}`, `civil_time::*`. Consumers today: `apps/fgos`, `apps/fgos-gateway`, `session-identity`, `convention`, `work-state`, `observe`, `distribution`, `run-result` (symbol census in §B, S5).
3. **Rust/Node boundary.** No Node client exists or should: Node reads `command-routes.json` only in `scripts/export-command-selectors.mjs` (producer) and tests. Node budget 0.
4. **Delete list.** `providers/external_process/**` (2 586 lines: manifest, registry/linker, frame codec, bound-invocation supervisor, adapter), the `[[bin]] fixture-echo-process` (`Cargo.toml:6-8`, `tests/fixtures/external-provider/echo_process.rs`, 224 lines), its three tests (1 799 lines), the `serde_yaml` and `sha2` dependencies they alone pull in (`Cargo.toml:15-16`), the `EchoProvider`/`ECHO_PROVIDER_DESCRIPTOR` registration in the production host (`apps/fgos/src/main.rs:105,225`) and the `test.fixture.echo` catalog entry (`catalog.rs:62-72`) — the echo provider survives only as `#[cfg(test)]` inside the crate (its 5 in-crate pipeline tests and `two_projectors.rs` use it). Doctor: `command-routes-drift` (`registrations.mjs:5281-5285`) — see A.2.5.
5. **Doctor rows kept.** None as T0 component health. `command-routes-drift` checks that a source checkout's `src/cli/command-registry.mjs` still matches the committed `command-routes.json`; it is skipped in a release tree (`:5232-5237`), spawns a node script per doctor run, and its condition is already owned by `test/rust-host/command-routes.test.mjs` (`all COMMAND_REGISTRY selectors appear exactly once…`). It belongs to the build, not to doctor: delete the row, keep the test (condition kept, see the Doctor table). The four packaging rows (`rust-host-binary-present`, `rust-host-target-supported`, `legacy-node-payload-present`, `active-release-matches-checkout`) are T9/Packaging and stay, reviewed there.
6. **Size target.** Rust −2 760 src, tests −1 800, fixture −224; two crate dependencies fewer; net ≈ −4 800.

**Is anything in `host-runtime` a T9 Host & Surface concern?** Yes, three things, and I would hand them to phase 07 rather than touch them here: (a) the external-process provider subsystem is an unused extension mechanism for the host surface (plugin providers over JSON-RPC frames) — if the owner wants it at all it is T9, today it is weight (S5); (b) `command-routes.json` is the Host & Surface route table (73 `legacy-cli` + 6 `native` selectors), generated from `src/cli/command-registry.mjs`: the data is T9's, the file lives in this crate only because `apps/fgos` includes it; (c) `authority_gate` is admission for the host surface (host kind, policy id), not a T0 primitive. What is a real T0 primitive here: the pure router, the contracts/types, and `civil_time` (a leaf used by observe, convention, distribution, the CLI presenter).

### A.3 `canonical-json`

1. **Authority.** The bytes of a JSON value under RFC 8785 (UTF-16 key order, ES number formatting via `ryu_js`), for every persisted digest.
2. **Contract and ports.** `canonical_json(&Value) -> Result<String, NonFiniteNumber>`, `canonical_line` (+ one LF). Vectors: `contracts/vectors/canonical.v1.json` (18 vectors), run by the crate (`lib.rs:67-86`) and by `test/event-store/canonical-vectors.test.mjs:7-13` through its own reference implementation.
3. **Rust/Node boundary and budget.** Rust is the authority; **Node keeps one implementation** (not zero) because the measured N-API call floor (11.6 µs) is 5× the Node small-object cost (2.0 µs) and the twins' callers are cold (one digest per run/proof): a round trip to Rust buys nothing in speed and would make the small case slower. The Node copy is allowed exactly one file (`src/runner/dispatch/proof-helpers.mjs:11-23` is the natural owner, 13 lines) and must pass the crate's vector file in a Node wiring test. Node budget: 13 lines + 1 test.
4. **Delete list.** `effective-execution-contract.mjs:39-48`, `recovery-planner.mjs:69-74`, `reconciliation-planner.mjs:24`, `trust-store.mjs:379-385` (`sortedJson` builds an object, then `JSON.stringify` — same bytes), `scripts/measure-coordination-baseline.mjs:28-37`, `scripts/build-rust-distribution.mjs:37-47` — all collapse onto the one Node leaf after the byte-equality run (phase 01 §C rule). Rust: `packages/distribution/rust/src/verify.rs:46-76` (`to_canonical_json`: UTF-8 key order + `n.to_string()`) moves onto the crate (in-process, no N-API) once the corpus proof passes.
5. **Doctor rows kept.** None (a pure function has no machine state).
6. **Size target.** Rust −30, Node −40, tests +15 (the Node leaf gets the crate's vector file as its proof) ⇒ ≈ −55.

### A.4 `durable-file`

1. **Authority.** How a record becomes durable on disk: temp file, file fsync, rename-over or link-once, directory fsync, with the effect reported on every error (`InstallError{installed, temporary}`).
2. **Contract and ports.** `replace_durably`, `replace_durably_with_mode`, `replace_durably_observed`, `install_once`, `install_once_with_mode`, `install_with`, `install_ordered`, `sync_directory`, `sync_directories`; `Installed::{Created, AlreadyExists}`. Two classes only: **replace** and **create-only**; both always durable (file + directory fsync = 10.3 ms here).
3. **Rust/Node boundary and budget.** Rust decides the class; Node, through the binding, calls `replaceDurably(dir, name, bytes, mode?)` and `installOnce(dir, name, bytes, mode?)` for the sites whose class the crate covers (Q2 table). The no-fsync class stays Node, on purpose: 14 µs vs 10 300 µs, and its records are rebuilt or re-read by their readers. Node budget after the move: one helper per no-fsync writer may remain (DRY'd onto `uniqueTmpTag`), zero durable writers in Node.
4. **Delete list.** `run-lock.mjs:75-85,225-235,250-261` (`writeFsyncedTemp` + the two link publishers), `proof-helpers.mjs:86-126` (both publishers), `case-bindings.mjs:97-112,121-131`, `case-runtime.mjs:20-31`, `provider-capacity.mjs:367-380`, `provider-credential-renewal.mjs:105-120`; Rust: `packages/distribution/rust/src/init.rs:535-549` (the exact `replace_durably` shape, Packaging). Not deleted (class not covered or durability not wanted): `trust-store.mjs:77-83` (mode-preserving), `skill-wrappers.mjs:75-84` (copy), the 14 no-fsync sites, `workflow/store.mjs:112-120` (append), the Rust twins `supervise.rs:258-264`, `adopt.rs:225-233`, `supervise/windows.rs:83-91`, `holder-lock/route/hold.rs:42-46`, `predecessor.rs:122-133` (IPC and heartbeat files: no fsync wanted), `git/repository_config.rs:493-497` (its own WAL class).
5. **Doctor rows kept.** None.
6. **Size target.** Rust −10 (init.rs), Node −110, tests ±0 (each moved site keeps its one concurrency proof; the crate's `concurrent_writers_have_exactly_one_winner` already owns the link race) ⇒ ≈ −120.

## Part B — findings (lens: C fast, D light)

Severity per proposal §2.2; **reproduced** = measured above or confirmed with `rg` on `71ba43d80`.

| id | axis | sev | status | where | what goes wrong, when | fix shape (what it replaces) |
|---|---|---|---|---|---|---|
| S1 | C | Medium | reproduced | `packages/process/rust/src/facts.rs:242-245` (`judge_here`), `platform/mod.rs:62-74` (`observer`, `identity_of`), `platform/linux.rs:64-77,358-391,395-412` | Every judge re-reads the observer: gethostname + `boot_id` file + `readlink /proc/self/ns/pid` = 2.5 µs of the 5.2 µs call (48%). In the whole-table scans (`locked_fds(None)`, `lock_holders`, `file_users`) the same three reads run once **per pid** (579 × 2.5 µs ≈ 1.5 ms of 5.9 ms). In `pgroup_kill`/`tree_kill` they run per target per round. | Read the observer once per operation: `judge_here` and `identity_of` take `&Observer` from a per-process `OnceLock` for boot id and pid namespace (neither changes during a process's life; hostname stays live, it is the cheap one). Replaces the per-call reads; no new type (`Observer` and `judge(record,&observer,&table)` already exist, `facts.rs:206-245`). Expected: judge 5.2 → ~2.8 µs, full scans −25%. Keep the "identity before descriptor table" order in `locked_fds` (`linux.rs:368`, it pins the pid for the later signal) — the saving is the three reads, not the stat read. |
| S2 | C | Medium | reproduced | `packages/process/rust/src/containment/linux.rs:44-62` (`pidns_usable`), callers `packages/git/rust/src/driver.rs:282` (`GitDriver::new`), `packages/run-supervisor/rust/src/route.rs:108` (doctor probe), `supervise/unix.rs:146-149` | A real `bwrap --unshare-user --unshare-pid … /bin/true` runs once per **process** (OnceLock is per process): 1.77–2.12 ms cold. Every Node process that opens a `GitDriver` through the addon pays it (every CLI call that reads git, ≈3 450 times in one suite run), and every git child then runs inside `bwrap --unshare-pid --as-pid-1`: 1.98 ms vs 0.56 ms bare, i.e. +1.4 ms × 5–6 git calls ≈ +8 ms per CLI call, ≈ 4% of a 250 ms call, plus 2 ms for the probe. | T0 owns the probe and the selection, not the git policy. In T0: expose the already-existing unprobed constructor path (`BwrapPidns::new`, `linux.rs:72-74`) through `SelectEnv` as "driver by name, no probe" so a caller that only needs read-only git plumbing does not probe; and record the probe result once per boot in the state root (a file keyed by boot id + bwrap path + mtime — this is an *addition*, listed under "proposed additions", owner's choice). Whether read-only git children need a PID namespace at all is the Git/OPC lane's question (`driver.rs:1165-1195` sends every non-borrowed git through `spawn_in`); handed over with these numbers. |
| S3 | C/D | Medium | reproduced | `containment/linux.rs:305-338` (`StatRow`, `read_stat`, `live_rows`), `:355-369` (`members`), `:425-462` (`pgroup_kill` loop) | A second "one pass over the process table" exists beside `facts::relations()` (`platform/linux.rs:91-99,224-255`): `live_rows` uses `fs::read_to_string` per pid and the third stat parser; `domain_is_empty(LinuxPgroup dead leader)` costs 2.0 ms per poll, `pgroup_kill` runs `members()` up to 10 times plus `remember_tree` (another pass) per round. Only the best-effort driver pays (no user namespace), so cold on this machine. | `live_rows` → `facts::relations()` (1.45 ms, same facts: pid, ppid, pgrp, start), `StatRow.start_time` from the one parser (S4). Replaces `read_stat`/`live_rows` (−34 lines). |
| S4 | D/E | Low | reproduced | `facts.rs:441-464,521-526` (`proc_stat_fields`, `parse_relation`, `parse_proc_stat`), `platform/linux.rs:231-255` (field 38 by a fresh split), `containment/linux.rs:314-325` (`read_stat`), Node `process-identity.mjs:38-44`, `lock-fence.mjs:48-57`, `fences.mjs:412-421`, `setup/holder-lock-checks.mjs:430` | Three Rust readers of `/proc/<pid>/stat` fields in one crate and four Node copies. `parse_proc_stat` is the public one and is consumed by `session-identity/proc_tree.rs` (T1). | One `StatRow { state, ppid, pgrp, start_time, exit_signal }` parser in `facts` used by `observe`, `read_relation_and_leader` and the containment driver; the Node copies go with the Q1 move. |
| S5 | D | Medium | reproduced (`rg`, see §0 census) | `packages/host-runtime/rust/src/providers/external_process/{mod,manifest,registry,frame_codec,adapter,bound_invocation_supervisor}.rs` (2 586 lines), `providers/builtin.rs:16-169`, `Cargo.toml:6-8,15-16`, `apps/fgos/src/main.rs:105,225`, `catalog.rs:62-72` | No production caller outside the crate uses any `ExternalProcess*`, `FrameCodec`, `ExternalManifest` or `BoundInvocationSupervisor` symbol (`rg` over `packages apps -g '*.rs'` minus the crate: only `apps/fgos/src/main.rs`, and only for `EchoProvider`). The production host registers the **test fixture** echo provider and ships the `test.fixture.echo` operation with `allowed_host_kinds: ["cli","remote","test"]`; the `fixture-echo-process` binary is built by every workspace build; `serde_yaml` and `sha2` are dependencies of this crate only for the dead subsystem. 4 600 lines (48% of the crate's src+tests) carry nothing. | Delete the module, the fixture bin, its three tests and the two dependencies; make `EchoProvider` `#[cfg(test)]` and drop it from `COMPOSITION_PROVIDERS` and `CATALOG` (the catalog test `catalog.rs:101-112` then counts 6). If the owner wants external providers later, they are a T9 feature and return through `providers/` as a whole, not as dormant code. |
| S6 | C | High | reproduced | `packages/durable-file/rust/src/lib.rs:169-296` (one write path, always file fsync + directory fsync), consumers `packages/terminal-control/rust/src/store.rs:116,141`, `event-store/src/{seal.rs:94,sync.rs:524,receipt.rs:40,83,identity.rs:180,199,fsio.rs:76}`, `git/wal.rs:1208,1236,1406` | 10.3 ms per record on this NVMe. The crate has no cheaper class, so every caller that merely wants an atomic rename pays 500–750× the no-fsync cost. Nothing in the crate is wasted (one `sync_file_range` prelude, one file fsync, one directory fsync — the minimum for a durable rename), so the finding is about **which sites may use it** (Q2 below): today's Rust callers are all records whose loss after a crash would be a correctness bug (WAL, seals, hwm, identity) — right. The Node "durable" class as written costs 5.1 ms (file fsync only, no directory fsync): a crash after the rename can lose the rename itself; moving those sites onto the crate is a +5 ms correctness gain, not a regression. | No crate change. Q2 decides per class; the gate-5 risk is only in moving a no-fsync site onto the crate, which this report refuses for all 14 of them. |
| S7 | D | Medium | reproduced (baseline §3) | `test/rust-host/help-routes.test.mjs:1-50,…` | 119 s for 28 cases because each case runs `scripts/run-rust-dev-host.mjs` (stage host + payload ≈ 4.2 s). The behaviour (every route kind answers `--help --json` through the host, unknown selectors fail closed) is observable by spawning `FGOS_HOST_BIN` directly, the way `internal-routes.test.mjs` does (28 spawns, 0.4 s). | Rewrite the file to spawn the host directly; keep one case through the dev door (the dev-door's own behaviour, if nothing else proves it). Replaces 119 s with ≈1 s. |
| S8 | D | Low | reproduced | `test/runner/process-identity.test.mjs` (80 lines), `test/runner/run-lock-identity.test.mjs:1-50` (6 cases), `test/process/process-facts-vectors.test.mjs:72-125` | The verdict table is proven three times in Node and once in Rust (`judge_vectors.rs`). The three **policy** cases (`process-identity.test.mjs:199-202,233-237`, `run-lock-identity.test.mjs:45-49`: unknown/no-pid never reclaimed, caller fact short-circuits) have no Rust owner and must move first (phase 01). | After Q1: the Rust `judge_vectors.rs` + one Node wiring test in `process-facts-vectors.test.mjs` own verdicts; the policy "unknown → held" moves into the door's `holderLiveness` and gets a Rust vector row; the caller-fact short-circuit disappears with the `isAlive` parameter (the door observes). Retire 2 files, keep the 3 `acquireRunControl` cases. |
| S9 | C/D | Low | reproduced | `src/state/hot-lock.mjs:57-94` (`observeViaHost`, `liveReadings`, `HOST_OBSERVE_TTL_MS`), `src/holder-lock/driver.mjs:269-292`, `holder-lock/rust/src/route.rs:474-505`, contract `internal-route.process-observe.v1.json`, `test/state/hot-lock-host-judge.test.mjs` (94 lines) | A route spawn (1.33 ms) per judged holder on Windows, cached for 250 ms, with the explicit rule "a cached reading may keep a record, never reclaim one". With the in-process door the Windows creation time is one N-API call (≤ 15 µs), the cache and its rule go, the route and its test go. | Delete with Q1 (L10: the binding replaces the route; nothing keeps both). |
| S10 | D | Low | reproduced (`rg`) | `platform/linux.rs:414-419` (`kcmp_same_file`), `facts.rs:254-259` (`start_time`), `facts.rs:530` re-exports | No production caller (`kcmp_same_file` only its own test `linux.rs:538-559`; `start_time` only in `holders_multiprocess.rs`). `flock.rs:74` says "kcmp need not be available": the design chose not to depend on it. | Delete both and the kcmp half of `kernel_table_and_fdinfo_agree_on_the_locker_stamp` (keeps the fdinfo/table half, which `own_lock_token`/`lock_table_entries` still need). |
| S11 | D/E | Medium | reproduced | `src/setup/registrations.mjs:5990-6142` | 153 lines: a third liveness judge (`kill(0)` + `/proc/<pid>` **mtime** as a start-time fingerprint, `:6057-6071`), a row and a fix for `claim.json` files that nothing writes (`rg -ln "claim\.json" src packages apps bin` → only this file). Runs on every doctor. | Delete row, fix and helpers; close `p-3c7681b8` with it (phase 01 §A #10, baseline §5). |
| S12 | C | Low | inferred (measure: time `fgos doctor --json` with and without the row) | `registrations.mjs:5281-5285` → `:5238-5243` | `command-routes-drift` spawns `node scripts/export-command-selectors.mjs --check` on every doctor run, in a source checkout only, to compare two files in the repo. Repo consistency is a test's job; the condition is already proven by `test/rust-host/command-routes.test.mjs`. | Delete the row (gate 8: fewer rows, condition kept by the named test). |
| S13 | C | Low | inferred (reproduce: `strace -c` on a `fgos version`) | `apps/fgos/src/main.rs:222-243,355-364` | Every native verb builds the snapshot, registers 8 providers and a tokio current-thread runtime per process. Microseconds; `fgos version` is 0.9 ms end to end (baseline). Not worth a change — recorded so nobody chases it. | none |
| S14 | C | Low | reproduced (numbers) | `src/git/native.mjs:49-54` | The release addon is hashed in every Node process: 8.1 ms (11.4 MB) in production, 75 ms (86 MB debug) in the suite. The T0 binding **must not** add a second verification of the same file: one loader, one identity check per process. (The re-hash itself is the GIT lane's fix, out of scope.) | Q1 loader rule below. |
| S15 | D | Low | reproduced | `src/runner/dispatch/run-lock.mjs:75-85`, `proof-helpers.mjs:86-126`, `fences.mjs:324-343`, `case-bindings.mjs:97-112,121-131`, `case-runtime.mjs:20-31`, `provider-capacity.mjs:367-380`, `provider-credential-renewal.mjs:105-120`, `workflow/store.mjs:112-120`; temp-name shapes: `.tmp-<pid>-<ts>-<rand>` (4 files), `<file>.<pid>.tmp` (2), `<file>.tmp.<ts>` (3, `attestation-store.mjs:184,212,312` — **pid-less**, two processes in the same ms collide), `uniqueTmpTag` (5) | Eight hand-written "fsync-then-rename/link" helpers and four temp-name conventions; `skill-wrappers.mjs:32,95-97` even has readers that must recognise one of the shapes. | Durable classes move onto the crate (Q2); the no-fsync writers keep one Node helper each but all take their temp name from `uniqueTmpTag` (fixes the pid-less `attestation-store` names). |

### Q1 — the in-process binding (owner-decided); loader shape, channel matrix, budgets

**Loader shape.** One loader, the existing `src/git/native.mjs:27-70`, extended by the Git lane to also hand out the T0 exports (the combined addon already links `fgos-process` through `fgos-holder-lock`, `node-addon/Cargo.toml:16`); T0 owns only (a) the five exports in `node-addon/src/` (a `process.rs` beside `git.rs`), (b) a contract-version field in `versions()` (`node-addon/src/lib.rs:17-30` reports `git` and `eventStore`; add `process`), and (c) the fail-closed refusal names in the thin client: `process-door-unavailable` (no addon on this channel), `process-door-contract-mismatch`. **No JS fallback** anywhere (owner 10:01). Rules the measurements impose: load lazily on first call (dlopen 0.49 ms + 45 µs first call is paid once, but a `fgos --help` must not pay it); never a second file hash (S14); main thread only — `single_load.rs:19-33` registers one abstract-socket marker per process and refuses a second load by name (`git-addon-second-load`), so a worker thread that `require`s the addon is refused; no production code uses `worker_threads` today (`rg` finds only `src/util/unique-tmp-tag.mjs`), so the rule costs nothing now and must be stated in the client.

**Channel matrix** (what the loader finds, `native.mjs:28-43`, `distribution/rust/src/manifest.rs:80-87`):

| Channel | Addon available? | T0 behaviour |
|---|---|---|
| activated release (`manifest.components.nativeAddon`) | yes, linux-x64 and win32-x64 | binding |
| npm `bin.fgos` | only if the package ships `native-addon.json` + the addon for the target (`native.mjs:38`); owner decision says it will | binding; without it, named refusal, no leaf |
| direct `node bin/fgos.mjs` outside an activated project | no descriptor → `git-addon-not-shipped` today | named refusal `process-door-unavailable`; the cold admin verbs (doctor, fence, gateway stop) keep the host route |
| dev host (`npm run fgos:dev`) | yes (the door builds the addon) | binding |
| test runner | yes (`ensureGitAddon` stages the debug addon; 75 ms hash per process until GIT fixes it) | binding |
| Windows (win32-x64) | yes | binding; replaces `observeViaHost` (S9) |
| macOS / other targets | no addon, and no approved host target either (`registrations.mjs:5263-5267` approves two targets) | not a supported channel today: refuse by name |

**Absolute budgets per call class** (p50 / p95 on a quiet machine; today's numbers in §0):

| Class | Budget | Why this number |
|---|---|---|
| `judge(record)`, `holderLiveness(record)` warm | ≤ 12 µs / ≤ 25 µs | Rust judge 5.2 µs (2.8 after S1) + the measured N-API floor for an object in / string out (versions() with a JSON object out is 11.6 µs; a string-out call is less). The hot-lock waiter polls every 10 ms (`hot-lock.mjs:34`), so 12 µs is 0.1% of the interval; it is 2–3× today's Node leaf (3.7–7.2 µs), and that trade is accepted by the owner decision. |
| `observe(pid)`, `selfRecord()` | ≤ 12 µs / ≤ 25 µs | same floor; `selfRecord` is called once per process by every writer (`hot-lock.mjs:110-120`, `cancel-registry.mjs:16`). |
| `signalByIdentity(tuple)` | ≤ 20 µs / ≤ 40 µs | pidfd open + judge + send = 6 µs + the floor. |
| `replaceDurably` / `installOnce` through the binding | ≤ 10.4 ms / ≤ 11 ms on this disk; binding overhead ≤ 30 µs | the fsyncs dominate; the budget is "no slower than the crate called from Rust". |
| `scan(filter)` (cold paths only) | ≤ 10 ms | 6.3–7.8 ms today for 579 pids; never under a hot lock. |
| cold load, first call in a process | ≤ 1 ms excluding file verification; verification ≤ 10 ms and shared with Git (one hash, or an identity check) | dlopen 0.49 ms + 45 µs; sha256 8.1 ms today. |
| host route (cold admin paths) | ≤ 2 ms per spawn | 1.33 ms today; only doctor, `fgos lock fence`, gateway stop, stop-everything may spawn. |

Guard: the budgets are absolute, so "p95 ≤ 2× identity mint" (proposal §4.3) is not the yardstick for the hot classes; it stays the yardstick for the route.

### Q2 — per atomic-write class: does `durable-file` cover it, what is gained or lost

| Class (phase 01 §B) | Sites on `71ba43d80` | Cost today | On the crate | Covered? | Durability wanted? | Decision |
|---|---|---|---|---|---|---|
| create-only, durable (file fsync + link + dir fsync) | `run-lock.mjs:225-235`, `:250-261`; `proof-helpers.mjs:86-110` | ≈10.3 ms (they already fsync the directory, `run-lock.mjs:234,259`, `proof-helpers.mjs:108`) | `install_once` 10.5 ms | yes, same class, same cost | yes (lock generations, release/abort markers, immutable proofs) | move; keep each site's two-contender proof |
| create-only, file fsync only | `fences.mjs:324-343` (fence epochs), `case-bindings.mjs:97-112` (`wx` + fsync + `fsyncDir` → actually durable: 10 ms class) | 5.3 ms / 10.3 ms | `install_once` | yes | fences: T1 decides (R4 deletes them); bindings: yes | bindings move (and gain "name appears only complete", which `wx` lacks); fences wait for T1 |
| replace, durable | `proof-helpers.mjs:112-126` (file + dir fsync = 10.3 ms), `case-bindings.mjs:121-131` (10.3 ms), `case-runtime.mjs:20-31` (5.1 ms), `provider-capacity.mjs:367-380` (5.1 ms), `provider-credential-renewal.mjs:105-120` (5.1 ms, mode 0o600 — the crate's default) | 5.1–10.3 ms | `replace_durably` 10.3 ms | yes | yes: proofs, bindings, case ledger ("hardened in place", component-boundary row), lease ledger, credential copies | move; the three 5.1 ms sites gain the directory fsync (+5 ms each, per write, cold paths) |
| replace, no fsync (14 sites: `run.mjs:51`, `visibility-session.mjs:90`, `recover.mjs:196`, `reconciliation-planner.mjs:264,329`, `attestation-store.mjs:184,212,312`, `main-checkout-activity.mjs:95`, `worktree.mjs:234`, `unit-summary.mjs:195`, `hold-transport.mjs:235-241`, `store.mjs:217-219`, `hot-lock.mjs:309-315`) | 14–34 µs | 10 300 µs (×300–750) | class not in the crate | **no**: progress/visibility/cache/IPC records that readers rebuild or re-read; the hot-lock `tx.writeText` is inside the critical section (WORK-owned anyway) | stay Node; unify the temp name on `uniqueTmpTag` (S15) |
| mode-preserving | `trust-store.mjs:77-83` | 22 µs | crate filters by umask and never reads the target's mode (`lib.rs:116-130,191-199`) | no | n/a | stays |
| copy-then-rename | `skill-wrappers.mjs:75-84` | — | not a class of the crate | no | no | stays |
| append + fsync (ledger) | `workflow/store.mjs:112-120` | — | not a class (no rename) | no | yes, as is | stays |
| Rust twins | `supervise.rs:258-264,500` (heartbeat, every tick), `adopt.rs:225-233`, `supervise/windows.rs:83-91`, `hold.rs:42-46`, `predecessor.rs:122-133` | no fsync | would be 10 ms | class not in the crate | no (heartbeat, adopt marker, two IPC request files, a lock-held record whose loss is harmless: if the machine dies the processes it names die too) | stay; `distribution/init.rs:535-549` is the exact `replace_durably` shape → move (Packaging, phase 07 if not now) |

Gained by the moves: one implementation of the two durable classes, the directory fsync the three 5.1 ms sites lack, `InstallError.installed/temporary` on failure instead of a bare throw. Lost: nothing measurable (cold paths). The crate itself needs no new class: a "no-fsync replace" in `durable-file` would be a third class with no durability, i.e. a mechanism added beside the door for callers that do not want the door — refused under RUL104.

### Q3 — `unknown` per §A site, from this lens (owner of the policy)

| # | site | fields | today | `unknown` → | lives in | cost after move |
|---|---|---|---|---|---|---|
| 2 | `run-lock.mjs:34-42,69-71` | full tuple | `kill(0)` + adapter | held (never reclaimed) | **door** (`holderLiveness`, the spec §3 adapter) | 0.3 µs + 7 µs → ≤ 12 µs |
| 3 | `hold-transport.mjs:51-58,146-153` | own unreaped child | `exitCode`/`signalCode` + `kill(0)` | n/a: an unreaped own child cannot be reused; the libuv fact is exact | caller (T1); drop `pidAlive` | − |
| 5 | `lock-fence.mjs:46-81` | pid + startTime + cmdline | Node judge then bare `kill` | `IdentityUnknown` → refuse by name, send nothing | door returns the outcome; caller maps `IdentityUnknown` → `lock-fence-holder-unknown` | 20 µs per holder |
| 6 | `stop-processes-inside.mjs:21-74` | scan rows | `/proc` scan then bare `kill`, 1.5 s reuse window | a row without a tuple (`unreadable`) is never signalled | door: `scan` + `signalByIdentity`; the exclusion set (self, parent) stays the caller's (`include_self:false` + ppid filter) | 6–8 ms per cleanup (cold) |
| 7 | `provider-credential-renewal.mjs:704-708` | pid only | `kill(0)`, EPERM = alive | `judge({pid})` → Live without a recorded start time is `Unknown` (`facts.rs:233-237`) → keep | caller (keep on unknown) | 12 µs |
| 8 | `gateway-control.mjs:177,239,287-311` | `{pid, port, startedAt, logPath, binaryPath}` | `pidExists` + bare SIGTERM/SIGKILL | add `startTime` to the entry (format change, one release of reading old entries); an entry without it → `IdentityUnknown` → refuse to kill, say so | caller policy, door outcome | cold |
| 9 | `registrations.mjs:5509-5511` (`deadOwnedConfinementDirs`) | marker pid only | `kill(0)` | unknown → keep | caller | doctor only |
| 10 | `registrations.mjs:5990-6142` | — | mtime fingerprint | delete | — | −153 lines, −1 row |
| 11 | `session.mjs:477` | pid only | `pidExists` | unknown → keep (today a live reused pid also keeps) | caller | 12 µs per entry |
| 12 | `assignment-runner.mjs:920-926` | staged pid only | `isProcessAlive` | unknown → keep (SEAT carry) | caller | 12 µs |
| 13 | `hot-lock.mjs:57-99` | full tuple | Node judge, Windows via route + TTL cache | unchanged (`unknown` holds); the observer injection and the cache disappear | door | 12 µs per poll instead of 7 µs (Linux) / 1.33 ms (Windows) |
| 14 | `transport.mjs:366-377`, `provider-credential-probe.mjs:113`, `holder-lock/index.mjs:451-459` | pgid of an own child | `kill(-pid)` | transport and probe kill while the child handle is unreaped (pid reserved, pgid = leader pid): no reuse window, keep; `sweepProcessGroup` runs after the child is gone (reuse possible) and is the non-`holders` legacy branch of a route that already exists (`sweepRequest`, `index.mjs:431-437`): delete with the fences under R4 (T1) | caller | − |

Old records: one read path (`Record::from_json`, `facts.rs:90-114`) already reads `processStartTime`, numeric start times, `unknown-boot`; nothing else is needed for the compatibility decision.

### Q5 — the six doctor rows

| Row | Kind | Keep? | Cost per doctor run |
|---|---|---|---|
| `process-containment` | T0 component health (driver, level, escapes of the port) | yes, the one T0 row | 1 host spawn + 1 bwrap probe ≈ 3.5 ms |
| `rust-host-binary-present` | packaging | yes (T9 review) | stat |
| `rust-host-target-supported` | packaging | yes (T9) | none |
| `legacy-node-payload-present` | packaging; absorbs the binding's "addon present, target and contract match" condition | yes (T9) | stat |
| `active-release-matches-checkout` | packaging (source checkout only) | yes (T9) | hashes the payload tree — the slowest of the six; T9 measures |
| `command-routes-drift` | repo consistency, not health | **delete** (S12); `test/rust-host/command-routes.test.mjs` owns the condition | 1 node spawn ≈ 150–250 ms |

## Migration table (Node part | what it decides | move or not | reason | order | Node budget after)

| Node part | decides | move? | reason | order | budget after |
|---|---|---|---|---|---|
| `process-identity.mjs:27-147` judge, observer, stat parser, `/proc` reads | liveness verdict | **move** (binding) | twin of the crate's judge; owner decision | 1 | ≤ 40 lines: re-exports + named refusals |
| `process-identity.mjs:69-77` `pidExists` | existence fact only | keep where it is a non-deciding wait (`gateway-control.mjs:66-72`), delete as a judge input | not a decision; 0.3 µs | 1 | 9 lines |
| `process-identity.mjs:154-158` `resolveHolderLiveness` | dead vs held | **move** into the door (`holderLiveness`) | it is the spec §3 policy, the one "unknown → held" rule | 1 | 0 |
| `run-lock.mjs:34-42,69-71` | liveness | delete (import the door) | second judge | 1 (SEAT carry for the re-exports) | 2 re-export lines until SEAT lands |
| `hot-lock.mjs:57-99` | liveness + Windows cache | delete, call the door | route spawn under a hot path; the only way Windows judges today | 1 | `judgeHotRecord` = 1 line |
| `lock-fence.mjs:46-81` | judge + signal | **move** (`signalByIdentity`) | bare-pid signal with a check-then-kill window | 2 | 10 lines of outcome mapping |
| `stop-processes-inside.mjs` | scan + kill | **move** (`scan` + `signalByIdentity`) | bare-pid kill, 1.5 s reuse window | 2 | 25 lines (exclusion set, grace loop) |
| `hold-transport.mjs:51-58` | own-child liveness | delete `pidAlive` | the child handle is exact | T1 | 0 |
| `fences.mjs:97-105,412-421` | liveness, parent pid | delete | R4 deletes fences | T1 | 0 |
| `gateway-control.mjs:292,307` | signal | **move** (`signalByIdentity`) + entry gains `startTime` | bare pid; registry format change | 2 | 15 lines |
| `provider-credential-renewal.mjs:704-708`, `session.mjs:477`, `registrations.mjs:5509-5511`, `assignment-runner.mjs:920-926` | keep/reap by pid | call `judge`, keep on unknown | policy stays the caller's | 2 (carry list for #12, #9) | 1 line each |
| `registrations.mjs:5990-6142` | dead | delete | nothing writes `claim.json` | 1 | 0 |
| `driver.mjs:269-292` + route + contract + `hot-lock-host-judge.test.mjs` | Windows observe | delete | replaced by the binding | 3 (after the channel matrix is green) | 0 |
| the 5 Node canonical twins + 2 scripts | digest bytes | collapse onto one Node leaf (`proof-helpers.mjs:11-23`), proven by the crate's vectors | N-API floor 11.6 µs > Node 2.0 µs; byte equality is the contract | 2 | 13 lines + 1 test |
| 9 Node durable writers (Q2) | durability | **move** (binding `replaceDurably`/`installOnce`) | same class, same or better cost | 2 | 0 durable writers |
| 14 Node no-fsync writers | atomic replace | keep; temp name from `uniqueTmpTag` | 14 µs vs 10 ms | 2 | one 6-line helper per owner module (or a shared leaf — T5's choice) |
| `trust-store.mjs:77-83`, `skill-wrappers.mjs:75-84` | mode / copy | keep | class not covered | — | as is |
| `unique-tmp-tag.mjs` | a name | keep | not a decision | — | 13 lines |

## Delete list (with the evidence that nothing needs it)

| Item | Evidence |
|---|---|
| `host-runtime/src/providers/external_process/**`, `tests/{external_process_tests,external_provider_manifest_and_registry,external_process_router_integration}.rs`, `tests/fixtures/external-provider/echo_process.rs`, `[[bin]] fixture-echo-process`, deps `serde_yaml`, `sha2` | `rg -l 'ExternalProcess|BoundInvocationSupervisor|FrameCodec|ExternalManifest|external_process' apps packages -g '*.rs' -g '!packages/host-runtime/**'` → only `apps/fgos/src/main.rs` (which uses `EchoProvider`, not external_process); `sha2`/`serde_yaml` used only in `manifest.rs:326`, `registry.rs:12`, `manifest.rs:495` |
| `EchoProvider` in production (`main.rs:105,225`), `test.fixture.echo` in `CATALOG` (`catalog.rs:62-72`) | no route selector maps to it (`command-route-annotations.json` lists 6 operations, none `test.*`); `fgos-gateway` registers only `DISTRIBUTION_BUILD_SHOW_DESCRIPTOR` (`remote_invocation.rs:25`) |
| `registrations.mjs:5990-6142` row + fix + `processStartFingerprint` | `rg -ln "claim\.json" src packages apps bin` → only `registrations.mjs`; baseline: the row passes with no message field |
| `registrations.mjs:5281-5285` `command-routes-drift` + `checkCommandRoutesDrift` | condition owned by `test/rust-host/command-routes.test.mjs:26-40`; the row skips itself outside a source checkout (`:5232-5237`) |
| `facts::kcmp_same_file`, `facts::start_time` | `rg -F 'kcmp_same_file' packages apps -g '*.rs' -g '!packages/process/**'` → none; `facts::start_time` → none outside tests |
| `containment/linux.rs:305-338` (`StatRow`, `read_stat`, `live_rows`) | replaced by `facts::relations` + the one parser (S3/S4); `members()` is the only consumer |
| `hot-lock.mjs:57-94`, `driver.mjs:269-292`, `route.rs:474-505`, `internal-route.process-observe.v1.json`, `test/state/hot-lock-host-judge.test.mjs` | the binding is the one door on Windows too; `rg -n 'process-observe' src test packages` → these files and `hot-lock.mjs` only |
| `test/runner/process-identity.test.mjs`, verdict half of `test/runner/run-lock-identity.test.mjs` | duplicates of `judge_vectors.rs` + `process-facts-vectors.test.mjs` (Tests table) |
| the 6 Node canonical twins and `verify.rs:46-76` | one Node leaf + the crate; proven by `canonical.v1.json` (18 vectors) — after the corpus run |
| the 9 Node durable writers, `distribution/init.rs:535-549` | Q2 |
| `src/holder-lock/index.mjs:451-459` `sweepProcessGroup` | the non-`holders` branch of a route that exists (`:431-449`); T1 under R4 |

## Doctor table (every fail/warn condition of the T0 rows and the row that keeps it)

| Row | Condition | Kept by |
|---|---|---|
| `process-containment` | no host binary / host did not report / `unsupported` → fail; `best-effort` on Linux → warn; `best-effort` on macOS → info; `kernel` → pass | `process-containment` (unchanged) |
| `rust-host-binary-present` | binary missing / not executable → fail; no release and no dev checkout → pass-skip | same row (T9) |
| `rust-host-target-supported` | platform not in the two approved targets → fail | same row (T9) |
| `legacy-node-payload-present` | root/entry escapes the release → fail; file missing → fail | same row (T9), plus the new condition "nativeAddon present for this target and `versions().process` matches the T0 contract" merged here (names the row it merges into) |
| `active-release-matches-checkout` | payload files newer than the activation → fail; the six skip reasons → pass | same row (T9) |
| `command-routes-drift` | routes file differs from the registry → fail; script absent → pass-skip | **`test/rust-host/command-routes.test.mjs`** (`all COMMAND_REGISTRY selectors appear exactly once…`, `checkCommandRoutes`) — a build/test condition, row deleted |
| `coordination-abandoned-claims` | dead claims → fail; stale unknown → fail | **removed with the mechanism** (nothing writes the files) |
| `confinement-orphaned-resources-reaped` (`:5453-5467`, judges liveness at `:5509-5511`) | dead-owned dirs / empty shells / loose roots → fail | same row, judging through the door (T5 file, carry list) |

Row count for T0 after: 1 health row (T0) + 4 packaging rows; −2 rows, 0 conditions lost.

## Tests table

| Behaviour | Owning proof (after) | Today's duplicates / notes |
|---|---|---|
| judge verdict table (11 rules, 27 vectors) | `packages/process/rust/tests/judge_vectors.rs:74-104` | Node: `test/process/process-facts-vectors.test.mjs:59-70` (keep as the one Node wiring proof through the binding), `test/runner/process-identity.test.mjs:188-231` (retire), `test/runner/run-lock-identity.test.mjs:21-49` (retire) |
| `unknown`/no-pid is never reclaimed; a record without a pid is held | one new vector row in `process-facts.judge.v1.json` + `judge_vectors.rs` (Rust owner of the moved policy) | today only Node: `process-identity.test.mjs:233-237`, `run-lock-identity.test.mjs:45-49`, `process-facts-vectors.test.mjs:72-78` — move first, then retire |
| caller fact `isAlive=false` short-circuits | **removed with the parameter** (the door observes) | `process-identity.test.mjs:199-202` retire, naming the removal |
| a zombie is dead to the judge though `kill(0)` succeeds | `signal_identity.rs:81-95` (`a_zombie_gate_counts_as_an_empty_domain`) | Node `process-facts-vectors.test.mjs:135-157` (real zombie, 10 s wait loop: time-based) → retire after the binding, the Rust test owns it |
| `acquireRunControl` reclaim by identity | `test/runner/run-lock-identity.test.mjs:56-110` (keep the 3 cases) | — |
| Windows creation time judged in process | the Rust `judge_vectors.rs` (platform table) + the binding wiring test on win32 | `test/state/hot-lock-host-judge.test.mjs` (route) → delete with the route |
| unique temp names across threads | `test/util/unique-tmp-tag.test.mjs` | — |
| canonical bytes | `canonical-json/src/lib.rs:67-86` (crate) + `test/event-store/canonical-vectors.test.mjs:17-21` as the Node leaf's wiring proof (point it at the one Node leaf instead of its private `canonical`) | the 5 Node twins have no proof of their own today |
| durable install/replace semantics | `durable-file/tests/{install,creation_modes}.rs` (10 tests) | each moved Node site keeps its one two-contender proof; nothing else |
| help routing through the host | `test/rust-host/help-routes.test.mjs` rewritten to spawn `FGOS_HOST_BIN` (S7) | 119 s → ≈1 s; one dev-door case stays |
| internal routes answer one line, protocol mismatch exits 3 | `test/rust-host/internal-routes.test.mjs` (0.4 s) | — |
| route table ↔ registry consistency | `test/rust-host/command-routes.test.mjs` | the doctor row (deleted) |
| containment drivers (real bwrap, pgroup, timeout, fast exit) | `containment_{bwrap,pgroup,spawn_timeout}.rs` | time-based waits inside: `wait_until` polls (`POLL` 10 ms) with deadlines — event-driven enough; `containment_bwrap.rs:173,181,190` use fixed `sleep(300–500 ms)` to prove "keeps beating / stopped beating": acceptable, bounded |
| host-runtime pipeline (deadline, cancel, admission, grant, crash, parked, pruning) | in-crate tests `invocation_service.rs:940-1373` + `two_projectors.rs` | the three external-process test files go with the module |
| T0 doctor rows | `test/setup/run-supervisor-checks.test.mjs` (`process-containment`), `test/setup/active-release-drift-check.test.mjs`, `test/rust-host/release-targets.test.mjs`, `test/setup/checks.test.mjs` | `test/setup/doctor-coordination-checks.test.mjs` cases for `coordination-abandoned-claims` retire with the row |

## Proposed additions (owner's pick; each names problem, evidence, benefit)

1. **Per-boot cache of the bwrap probe.** Problem: 1.8–2.1 ms per process (S2), ≈3 450 processes per suite run ≈ 7 s CPU, and 2 ms of every CLI call. Evidence: §0. Benefit: the probe runs once per boot per bwrap binary; the cache key (boot id from the T0 door, bwrap path+mtime) makes a stale answer impossible across reboots or bwrap upgrades. It is a new file in the state root, hence an addition.
2. **A `--no-probe`/named-driver path in `SelectEnv`.** Problem: callers that only spawn read-only git plumbing pay the namespace probe. Evidence: `driver.rs:282`. Benefit: the Git/OPC lane can choose per operation without T0 changing the port contract. Smaller than (1), covers less.

## Overlap with the other seats (read after writing; nothing above was changed to match them)

- **S2 ↔ simplicity S-E8** (per-process bwrap probe). Same site, same callers. One number differs: S-E8 carries the test investigation's "~20 ms" per bwrap spawn; that figure is the suite-wide mean over every `bwrap` child (git children included, under load 30). Measured directly here, the probe itself is 1.65 ms (bwrap `/bin/true`) and `containment::select` cold is 1.77–2.12 ms; the per-CLI-call cost is probe + 5–6 git children in a namespace ≈ 10 ms. Use the measured numbers for the budget table.
- **S5 ↔ simplicity S-D1** (echo fixture in the production host, `RouterPolicy`, `kcmp_same_file`, `start_time`) and **S-E7** (the pasted drain loops in `bound_invocation_supervisor.rs`): S5 deletes the whole module S-E7 would fold, so S-E7 becomes moot if S5 is accepted; S-D1 lists the two dead functions I list in S10.
- **S11/S12 ↔ correctness F-D1, simplicity S-G3/S-A3** (dead coordination row with the mtime judge): agreed by all three seats; delete.
- **A.3 ↔ correctness F-A5, simplicity S-A1** (a canonical twin emits `undefined`/holes): they prove the bytes differ today; this report adds the speed reason **not** to route the twins through N-API (floor 11.6 µs > Node 2.0 µs) and to collapse them onto one Node leaf proven by the crate's vectors. The corpus proof both seats ask for still gates any deletion.
- **Q2 ↔ correctness Q2 table**: identical class verdicts (replace-durable and create-only move; no-fsync, mode-preserving, copy, WORK-owned stay). This report adds the per-site cost today vs after (§Q2) and the finding that three "durable" Node sites lack the directory fsync (F-A4 is the correctness side of the same fact).
- **S-E1/S-E2/S-E3 (simplicity)** cover the Node copies my migration table moves; no disagreement on order.
- **Simplicity S-C1** (three "a thousand fast exits" loops, 1 000 spawns each on every `cargo test`): in my lens too and missed above — adopted as a test-cost item for the Tests table: keep one loop of 100 in `containment_bwrap.rs` (the namespace race is the one that mattered, 2026-10-18 fast-exit decision), cut the other two to the first iteration.

## Rejected hypotheses (checked, found fine)

- "`host-runtime`'s pipeline costs something per CLI call." Rejected: `fgos version` is 0.9 ms end to end (baseline); the runtime build, snapshot and 8 registrations are microseconds (S13).
- "`durable-file` fsyncs more than a durable rename needs." Rejected: one file fsync, one directory fsync, `sync_file_range` only starts writeback early (`lib.rs:228-243`); no double sync, no sync on the error path beyond the effect reported.
- "`facts::scan` is dead code." Rejected: `fgos internal quiesce-scan` uses it (`holder-lock/rust/src/route.rs:568` `mod quiesce`, `ScanFilter` imported there and in `git/worktree.rs`).
- "`spawn_with_fds` forks the Node heap on every borrow." Rejected: holder-lock borrows through `spawn_mapped` (posix_spawn, `port.rs:899,1008`); measured 300 µs vs 372 µs for the fork path with a small parent.
- "The bwrap probe runs per call." Rejected: `OnceLock` per process and path (`linux.rs:45-48`); it is per process (S2).
- "Moving the Node canonical twins to Rust makes them faster." Rejected for small objects: the N-API floor (11.6 µs) exceeds the Node cost (2.0 µs); only the 200-key case would win (171 → ≈30 µs) and no hot path builds one.
- "The Rust judge is faster than the Node leaf." Rejected: 5.2 µs vs 3.7–7.2 µs; the binding will be 2–3× slower per call than today's leaf and is still 0.1% of the waiter interval — fine, but the budget must be stated absolutely (Q1), not as "faster".
- "`lock_holders` (5.9 ms) is on the borrow hot path." Rejected: the hot path is `creation_mark` + `created_since` + `lock_holders_among` (1.3 + 4.8 + 18 µs); the full scan is the fallback after a borrow longer than `pid_max/4e6` s ≈ 1.05 s here (`platform/linux.rs:105-110`), where `relations()` (1.45 ms) + `lock_holders_among` over the post-mark pids runs, not the 5.9 ms scan.
- "`DomainWatch`, `WatchTrace`, `reason()` are Windows-only dead weight on Linux." Rejected: `holder-lock/predecessor.rs` and `port.rs` consume them on every platform (trace in the predecessor report).
- "`Record::from_json` accepting float pids / numeric start times is a correctness hole." Not my axis; the tests at `facts.rs:574-591` pin it; left to the correctness seat.
- "`windows_job.rs` (1 104 lines) compiles on Linux for nothing." Rejected: the pure part (`decide`, `tree_from`, `orphans_since`, `read_id_list`, 240 lines) is tested on every platform on purpose (`windows_job.rs:12-14`); the OS part is `#[cfg(windows)]`.
- "`containment::select` is called inside the hot-lock critical section." Rejected: the Node guard `hot-guard.mjs:36-40` bans `child_process` there, and no Node path reaches `select` without a spawn.

```text
Status: DONE
Summary: Measured every T0 hot and cold path on this machine and set absolute budgets for the owner-decided in-process door; the biggest weight is host-runtime's unused external-process subsystem (4 600 lines, two deps, a test fixture registered in the production host), the biggest speed items are the per-process bwrap probe plus git-under-bwrap (≈10 ms of every CLI call) and the observer re-read inside every Rust judge (48% of its cost); durable-file is correct and should take only the 9 Node sites that already pay for durability, never the 14 no-fsync sites.
Concerns/Blockers: S2's cure beyond the T0-side option is a Git/OPC decision (every git child in a PID namespace); the bwrap-probe cache is an addition and needs the owner's pick; numbers were taken at load 2.6–15 on a shared machine (upper bounds).
```
