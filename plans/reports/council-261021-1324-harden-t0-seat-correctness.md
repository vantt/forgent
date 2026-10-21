# HARDEN T0 — correctness and failure seat

Revision reviewed: `71ba43d80` (current `main`). I read the council brief and its required criteria, T0 plan/phase, baseline and test investigation, Process and component-boundary specs, contracts, the four Rust crates/contracts, `process-identity.mjs`, `unique-tmp-tag.mjs`, and the Phase-01 A–C Node sites. I ran read-only `git rev-parse`, `rg`, `find`, `wc`, and line-numbered source inspections. I did not run tests: the shared-machine brief permits focused tests, but the existing baseline already records the four-crate result and none of the findings below was safely reproducible without creating or killing processes/files. No workspace file was changed.

## Part A: target shape per component

### `fgos-process` + containment port

- **Authority.** The sole authority for tuple facts, identity-safe control, descriptor-mapped spawn, and OS process-domain observation/control; it never decides whether a caller may reclaim, delete, or signal.
- **Contract/ports.** N-API exposes `judge(record) -> alive|dead|unknown`, `observe(pid)`, `signalByIdentity(tuple, signal) -> sent|identity-mismatch|identity-unknown|not-found|denied|unsupported|failed`, `scan(filter)`, `domainIsEmpty -> empty|not-empty|unknown`, `domainKillAll -> ok|refused`, and containment `create/spawnIn/guarantee`. Keep `process-facts.judge.v1.json` and `containment.port.v1.json` as the common contract; do not weaken `unknown`.
- **Rust/Node boundary.** Use the owner-selected T0-owned in-process N-API loader. The Node client may marshal JSON-compatible input/output and map named Rust errors only: loader <=80 LOC, process client <=40 LOC, no `/proc`, `process.kill`, tuple judgment, cache, or policy in Node. No JS fallback: a missing/incompatible addon is a named `process-addon-unavailable` / `process-addon-contract-mismatch` failure.
- **Channel matrix and budget.** Activated release, npm bin, direct `node bin/fgos.mjs`, dev host, test runner, and Windows all load the same T0 artifact/contract version; the direct/dev/test channels stage or resolve their matching local artifact instead of borrowing the Git loader. Every supported release target ships it, including Windows. Warm `judge` p95 <=20 µs; fresh-process judge call p95 <=350 µs (including initialized T0 binding); no-fsync atomic replacement p95 <=100 µs. A host-route spawn remains cold-admin-only and must remain <=2 ms p95; it is forbidden in hot-lock and polling paths. Fsync durability is explicitly a millisecond class (see Q2), not disguised as a hot atomic write.
- **Delete list.** Delete `process-identity.mjs`’s readers/judge and `pidExists`; the private copies in run-lock, hold transport, fences, credential staging, and the obsolete coordination doctor code; move raw gateway/lock-fence/inside-directory signalling; retire duplicate Node verdict tests after one addon wiring proof exists. Delete only after each caller’s policy proof lands.
- **Doctor row.** Keep `process-containment`, owned by containment/Run Supervisor, not Process Facts alone. No process-fact setup default or extra doctor row.
- **Size target.** Node -250 to -400 including copies and duplicate tests, plus loader/client +120 maximum; Rust +0 to +150 only if paid by Node/test deletion; T0 net <=0.

### `host-runtime`

- **Authority.** A host-facing registry/contract and civil-time utility, not a process-control or durable-state authority.
- **Contract/ports.** Retain typed `OperationId`, catalog/snapshot, admission/grant/router refusal types, and civil-time parsing/formatting. `InvocationService` and external-process provider configuration are host execution surfaces and must name typed refusals rather than inherit T0 process APIs.
- **Rust/Node boundary.** No Node client is justified for a T0 primitive. Its host route descriptor is a packaging concern; Node budget is zero in T0.
- **T9 handoff.** `providers/external_process/*`, manifest/linking, `InvocationService`, lifecycle tracking, and provider spawning are **Host & Surface (T9)** concerns: they choose/invoke an external provider and own surface lifecycle, even though implemented in a Rust crate. Keep only contracts/catalog/civil-time at the low substrate boundary; do not make process/containment depend on this crate.
- **Delete list.** Do not delete T0 code here. Phase 07 must decide whether external-provider machinery is moved/re-homed; until then, do not treat a host-runtime route as the process binding.
- **Doctor rows.** `command-routes-drift` belongs to host-runtime/packaging; `rust-host-binary-present`, `rust-host-target-supported`, `legacy-node-payload-present`, and `active-release-matches-checkout` are packaging, not component health.
- **Size target.** T0: 0 Node / 0 Rust / 0 tests. A T9 move must pay for its own duplication removal.

### `canonical-json`

- **Authority.** Canonical RFC-8785-compatible JSON bytes and canonical newline framing.
- **Contract/ports.** `canonical_json(Value)` and `canonical_line(Value)`; reject non-finite/out-of-JSON input with a named serialization error. Sort by UTF-16, as implemented at `packages/canonical-json/rust/src/lib.rs:46-58`.
- **Rust/Node boundary.** The T0 addon exposes one serializer/digest primitive; Node client <=20 LOC. No local `stable`, `sortedJson`, or recursive `canonicalJson` remains once its corpus proof passes.
- **Delete list.** Delete only twins proven byte-equal on their real corpus. The release manifest producer/verifier move together or stay Packaging; `effective-execution-contract` and `proof-helpers` do not move as a pair because they disagree about `undefined` (`effective-execution-contract.mjs:39-47`, `proof-helpers.mjs:11-23`). Retire the Node reference implementation only when the addon wiring proof owns the shared vector behavior.
- **Doctor row.** None; canonical serialization has no environment readiness state.
- **Size target.** Node -50 to -100 after proven twins; Rust 0 to +40 binding; tests -20 to -40 after keeping one vector/wiring proof.

### `durable-file`

- **Authority.** Atomic durable replace/install in a caller-owned trusted directory, reporting whether a name was installed and whether an error happened before or after installation.
- **Contract/ports.** `replace_durably`, `replace_durably_with_mode`, `install_once`, `install_once_with_mode`, and `sync_directory`; preserve `InstallError { installed, temporary }`. The existing implementation already rejects path traversal, uses create-new temp files, syncs file and directory, and preserves post-install ambiguity at `packages/durable-file/rust/src/lib.rs:179-295`.
- **Rust/Node boundary.** A thin addon client (<=30 LOC) selects only `replace-durable` or `create-only-durable`; it must not silently turn replace into create-only, remove fsync, or infer a target mode.
- **Delete list.** Replace Node helpers only for durable-replace and, where contract owners explicitly accept directory fsync, create-only. Do not delete mode-preserving, no-fsync, copy-then-rename, WORK-owned, or move-aside helpers merely to centralize them.
- **Doctor row.** None; no config/setup is needed for a leaf filesystem primitive.
- **Size target.** Node -60 to -120 from supported helpers; Rust +0 to +40 binding; no net-new tests—move crash-boundary cases down to crate tests.

## Part B: findings

### F-A1 — gateway stop can signal an unrelated reused PID

- **Axis/severity/evidence:** A/B, **High**, inferred (therefore not rated Critical). Reproduce with a process-binding test that writes an old gateway registry whose `pid` is a live fixture but whose recorded OS `startTime` is deliberately wrong; `stopGateway` must return `identity-mismatch` and fixture must receive no signal.
- **Evidence:** `src/runner/gateway-control.mjs:225-231` records only `pid` and wall-clock `startedAt`; `:287-315` uses `pidExists` then `process.kill(pid, SIGTERM/SIGKILL)`; `src/runner/dispatch/process-identity.mjs:114-146` and `packages/process/rust/src/platform/linux.rs:176-218` already provide the necessary tuple and safe identity semantics.
- **Failure:** after gateway crash/registry persistence and PID reuse, `fgos gateway stop` can terminate an unrelated process. A live reused PID also makes status falsely say `running` at `:331-339`.
- **Fix shape:** record a full process tuple at successful spawn, use `signalByIdentity`, and treat legacy pid-only records as `IdentityUnknown`: leave registry intact and report the remediation, never signal. This replaces bare-PID start/status/stop logic; no second signal path.

### F-A2 — gateway registry write is non-atomic and not durable

- **Axis/severity/evidence:** A/B, **Medium**, inferred. Reproduce using an injectable filesystem/checkpoint test that faults after truncating/writing `gateway.json`, then restart/status: the result must preserve a named recoverable state rather than lose or corrupt the gateway handle.
- **Evidence:** `src/runner/gateway-control.mjs:121-132` writes the registry directly with `writeFileSync`; a detached process is already started at `:210-222`, and registry publication happens later at `:225-261`.
- **Failure:** process death, ENOSPC, or power loss can leave a partial/missing registry for a still-running detached gateway. The next start may launch a second gateway or status may falsely say not running. The existing fail-closed reader only helps after the corruption is observed (`:102-118`).
- **Fix shape:** move this replace-durable record onto `durable-file` after the process tuple is collected, and add recovery behavior for the unavoidable spawn-to-record crash window. It replaces the direct write, rather than adding a parallel registry format.

### F-A3 — directory cleanup has an unbounded PID-reuse kill window

- **Axis/severity/evidence:** A/B, **High**, inferred. Reproduce with an injectable process table/signal port: scan returns an in-directory tuple; replace that PID before signal; assert `IdentityMismatch` and no signal to replacement.
- **Evidence:** `src/runner/dispatch/stop-processes-inside.mjs:33-52` scans numeric PIDs and excludes only `process.pid`/`process.ppid`; `:60-72` then sends bare TERM and, after up to 1.5 seconds, KILL. The safe primitive is available at `packages/process/rust/src/platform/linux.rs:176-218`.
- **Failure:** a scanned process can exit and its PID be reused before either signal, killing an unrelated process. A host-route scan also changes what “self/parent” means, so the present implicit exclusion cannot survive migration unchanged.
- **Fix shape:** move scan plus identity-safe signals into `fgos-process`; define exclusion by the caller’s supplied protected tuples (not ambient Node parent), and return unreadable/unknown views without killing them. This replaces both local `/proc` inspection and raw signals.

### F-A4 — Node “durable” publications can report success after directory-sync failure

- **Axis/severity/evidence:** A/B, **Medium**, inferred. Reproduce by dependency-injecting/forcing directory `fsync` failure after successful link/rename, then assert returned status is failure-with-effect—not success.
- **Evidence:** `src/runner/dispatch/run-lock.mjs:108-126` swallows directory `fsync` failures; `:225-235` and `:247-260` report publication success afterward. `src/runner/dispatch/proof-helpers.mjs:73-125` has the same best-effort directory sync for immutable and mutable proof publication. In contrast, `packages/durable-file/rust/src/lib.rs:283-295` returns an `InstallError` with `installed: Some(...)` if directory sync fails.
- **Failure:** on I/O failure/full disk or power loss, a caller can receive successful durable publication even though name durability was not acknowledged; a generation/receipt can disappear after a crash and produce false success/recovery ambiguity.
- **Fix shape:** route the declared durable classes through `durable-file` and preserve its post-effect error. Reclassify any intentionally non-durable projection explicitly; do not retain a helper named/presented as durable that ignores its final durability boundary.

### F-A5 — one canonical JSON twin emits bytes that are not JSON for `undefined`

- **Axis/severity/evidence:** A/F, **Medium**, inferred. Reproduce with `canonicalJson({a: undefined})`: current bytes are `{"a":undefined}`, whereas JSON serialization omits object `undefined`; compare digest with the serialized/persisted document.
- **Evidence:** `src/runner/dispatch/effective-execution-contract.mjs:39-47` keeps every key and interpolates recursive `JSON.stringify(undefined)`; its hash is persisted as dispatch/config provenance at `:270-271`. The supposed twin filters those members at `src/runner/dispatch/proof-helpers.mjs:18-22`; other twins have their own semantics at `recovery-planner.mjs:69-74` and `reconciliation-planner.mjs:24-25`.
- **Failure:** equivalent JS state can receive a digest over invalid/non-persisted bytes, making provenance unverifiable or unequal across producer/reader paths.
- **Fix shape:** do not migrate this twin by name. First constrain inputs to JSON values or codify an explicit undefined-elision contract and prove persisted corpus equality; then use `fgos-canonical-json` for that single contract. This replaces both differing serializers only if all consumers move.

### F-D1 — retired coordination doctor implementation and proof are still present

- **Axis/severity/evidence:** D/E, **Low**, inferred from current production callers. `rg -n "claim\\.json" src packages apps bin` finds only `src/setup/registrations.mjs:6012,6107`; the other hits are tests. `src/setup/registrations.mjs:5991-6144` still scans/deletes an unreachable retired coordination shape using `/proc` mtime at `:6057-6070`, and `test/setup/doctor-coordination-checks.test.mjs:47-97` preserves it.
- **Failure:** dead liveness code remains another non-authoritative judge and an unneeded doctor row/fix; its mtime fingerprint contradicts the Process specification’s prohibition at `docs/platform/process/spec.md:42,71`.
- **Fix shape:** delete the check, fix, mtime helper, and its owning tests together. No replacement test is needed because the production behavior is removed.

## Required A-site mapping / migration table

| Node part | fields / today | move? and `unknown` mapping | owner/order | Node budget after |
|---|---|---|---|---|
| `run-lock.mjs:34-71` | pid + tuple; signal-0 wrapper | Yes; caller maps unknown to held | Process client; SEAT re-export first | re-export only until SEAT |
| `hold-transport.mjs:51-80` | pid from own helper/work-dir name | Yes; unknown keeps work-dir | Process door; T1 transport follows | 0 liveness logic |
| `fences.mjs:97,415` | pid/start-time | Yes; unknown refuses fence/reclaim | Process door; T1 | 0 |
| `lock-fence.mjs:50-78` | pid/start/cmdline | Yes; `IdentityUnknown` refuses, mismatch does not signal | `signalByIdentity`; T1 | client call only |
| `stop-processes-inside.mjs:21-72` | scanned pid/exe/cwd | Yes; unreadable/unknown is kept and reported | Process scan/control; T5 | 0 |
| credential staging `:702-708` | PID in name | Yes; unknown means keep | Process verdict + caller policy | 0 |
| `gateway-control.mjs:177,287-315` | registry pid plus wall time | Yes; old record unknown means do not signal | Process control; T0 | thin client only |
| `registrations.mjs:5356-5430` | **current code has no liveness** | No process migration; phase inventory was stale | Keep as confinement config until T5/doctor review | n/a |
| `registrations.mjs:5991-6144` | dead retired claim shape | Delete; no mapping | T0 now | 0 |
| `session.mjs:477` | pid only | Yes; missing tuple -> unknown/keep, never reclaim by PID | Process policy; T1 | client call only |
| `assignment-runner.mjs:920-947` | PID parsed from staging name | Carry list; unknown keeps staging | post-SEAT | re-export/client only |
| `hot-lock.mjs:53-100` | full tuple; cache on Windows | Yes; Rust judgment only; unknown stays held; no spawn | T0 binding before hot path | client call only |
| `index.mjs:451-459`, `transport.mjs:367-376`, credential probe `:106-121` | own-child pgid | Do not generalize PID signal; use domain only while identity is live, otherwise refuse | Process containment; T1/T5 | explicit domain port |

## Atomic-write class decision (Q2)

| Class | `durable-file` coverage | decision / durability and mode |
|---|---|---|
| replace, durable | Yes: `replace_durably` | Move. Gains file+parent fsync and post-effect error; target gets default 0600 unless explicit mode is selected. |
| replace, no fsync | No | Do not move: existing 20–40 µs class would become 10–15 ms. Keep only an explicitly non-durable primitive, not a fake durable call. |
| mode-preserving | No | Do not move: `*_with_mode` still applies umask and does not preserve existing mode; trust/credential stores must retain their exact mode. |
| create-only | Yes: `install_once`, but durable | Preserve exclusive semantics. Move only where directory fsync is contractually wanted; otherwise retain `link`/`wx` and one two-contender proof. |
| copy-then-rename | No | Do not move until readers and temp-name visibility contract are intentionally changed. |
| WORK-owned / move-aside | Out of scope / no | Leave alone except a separately reproduced High/Critical issue. |

## Delete list

| Candidate | evidence nothing needs old path | disposition |
|---|---|---|
| coordination abandoned-claims check/fix/mtime + doctor tests | production `rg` has only its own two reads; coordination engine is retired | delete together |
| Node verdict cases in `process-identity.test.mjs` and `run-lock-identity.test.mjs` | phase inventory and current tests duplicate judge vectors; retain policy and run-control tests | retire after Rust vector + one addon wiring proof own verdicts |
| private `isProcessAlive` / `pidAlive` copies | `rg "process.kill("` identifies copies listed in mapping table; process door replaces them | delete when each policy proof lands |
| canonical twins | `rg` locates five dispatch twins plus two scripts; bytes differ today | **do not delete yet**; corpus proof is required |
| `confinement-backend-registry-readable` liveness copy | recheck shows no PID/liveness at `registrations.mjs:5356-5430` | rejected as stale inventory, not a deletion candidate |

## Doctor table (Q5)

| Current row/condition | surviving owner and condition |
|---|---|
| `process-containment`: no driver/unsupported vs best-effort | keep under Run Supervisor/containment; unsupported fails, best-effort warning must remain |
| `rust-host-binary-present`: missing/non-executable host | keep Packaging |
| `rust-host-target-supported`: unsupported OS/arch | keep Packaging |
| `legacy-node-payload-present`: manifest target missing | keep Packaging |
| `active-release-matches-checkout`: activation differs from checkout | keep Packaging as warning/fail exactly as today |
| `command-routes-drift`: descriptors/annotations differ | keep host-runtime/Packaging |
| `confinement-backend-registry-readable`: missing/malformed/schema-invalid registry | keep Confinement (T5), including safe `--fix`; no liveness condition exists now |
| `coordination-abandoned-claims`: dead/unknown retired claim | delete row and fix; no live production condition is lost |

## Tests table

| Behaviour | owning proof after move | duplication / retirement |
|---|---|---|
| judge truth table, including zombie/namespace/anchor/PID reuse | `packages/process/rust/tests/judge_vectors.rs` over shared contract | retire duplicate Node verdict cases; keep one `test/process` addon wiring vector |
| caller policy (`unknown -> held/keep/refuse`) | one test in each caller owner: hot-lock, gateway, session, credential cleanup, staging cleanup | move policy cases before retiring `process-identity`/run-lock wrapper cases |
| identity signal refuses reused PID | process crate signal test plus one Node binding proof | add red/green test for gateway, lock-fence, and inside-directory migration; no raw-kill duplicate |
| create-only concurrency | `durable-file` test only when crate owns site; otherwise current owning caller test | each retained link/`wx` site gets two contenders/one winner |
| durable post-rename fsync error | `packages/durable-file/rust/tests/install.rs` | retire Node best-effort durable-helper cases after callers use crate |
| canonical bytes | `canonical-json` vector test + one addon wiring proof | `test/event-store/canonical-vectors.test.mjs:6-34` is a second reference implementation; retire/move only after its event-store hash behavior has a named Rust owner |
| host command routes | one host route descriptor proof | reduce `test/rust-host/help-routes.test.mjs` repeated dev-host spawning; baseline reports 28 dev-door spawns/119.3s, so unit cases should be lower-layer |
| retired coordination claims | none | delete `test/setup/doctor-coordination-checks.test.mjs` cases with mechanism |

## Rejected hypotheses

- The phase-01 statement that `confinement-backend-registry-readable` judges marker PID liveness is stale: current `checkConfinementBackendRegistryReadable` only validates file/schema at `src/setup/registrations.mjs:5356-5386`.
- `durable-file` is not an unsafe replacement primitive: it rejects non-literal names, uses create-new temporary files, syncs file and parent, and preserves post-install ambiguity (`packages/durable-file/rust/src/lib.rs:179-295`). The problem is unsupported/no-fsync/mode-preserving contracts, not its core write ordering.
- The Rust process signal path on Linux is not a bare-PID equivalent: it opens a pidfd, rejudges identity, and returns mismatch/unknown before signaling (`packages/process/rust/src/platform/linux.rs:176-218`). The remaining concern is callers bypassing it.
- `unique-tmp-tag.mjs` is not a collision finding: it includes PID, worker-thread id, timestamp, and random bytes (`src/util/unique-tmp-tag.mjs:1-13`).
- The Phase-01 claim that production never writes `claim.json` holds for `src/packages/apps/bin`; test fixtures intentionally write it, so deleting the retired test together with implementation is required.

## Proposed additions (owner choice only)

None. The proposed changes replace existing unsafe/duplicate paths and doctor/tests; they do not add product capability.

Status: DONE_WITH_CONCERNS
Summary: T0 has a viable Rust-first target, but raw PID control and non-durable gateway/Node publication paths must be closed before the layer can claim safety.
Concerns/Blockers: The required in-process addon loader/channel matrix is a cross-lane Git/ES packaging change; unsupported canonical corpus equivalence must block deletion, not be assumed.
