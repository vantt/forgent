---
phase: 06
title: "Identity door after SEAT, one depth counter, proc_tree.rs onto fgos-process, T0's post-SEAT carry list"
status: pending
depends_on: [05]
parallel: "none (SEAT landed 2026-10-22 02:48, so the gate is open; shares hot-lock.mjs, door.mjs and the boundary with its neighbours)"
effort: ~1d
net_size: "Node −215 / Rust +7 / tests −320 (estimate)"
---

# Phase 06 — Identity door, one counter, T0 carry list

> **Rename on main (IDENT, `9fdaac9ba`, 2026-10-22 14:18):** `packages/session-identity` is now `packages/identity`, crate `fgos-session-identity` is `fgos-identity`, the operation id `session-identity.resolve` is `identity.writer` (policy id `identity.read`), and the Session Identity spec is merged into §7a of `docs/platform/identity/spec.md`. The verb `fgos identity` and its `{id, source}` answer are unchanged. This phase uses the new names; the integration branch merges main before this phase starts (census, `Cargo.lock` and the touched specs are regenerated or resolved there), and the IDENT lane is told before the door export lands.

## Context

[plan.md](plan.md) Facts ("Identity", "T0 carry list") and D-T1-7; arbitration §2.2 (identity shape), §3 rows S-3, S-E10 (with the red-team's test-owner correction: `facts.rs:562-581`, not `linux.rs`), S-E6 (one counter), H19 second half (SEAT's `state-lock-held.mjs` is the third counter), H21/H22 not here. T0's [phase 7](../261021-1547-harden-t0-process-facts-door/phase-07-post-seat-carry-list.md) is folded in as the last section (that file now points here).

## Requirements

### The identity door

- `packages/git/node-addon/Cargo.toml`: `fgos-session-identity = { path = "../../session-identity/rust" }` (one path dependency; `Cargo.lock` updated). New `packages/git/node-addon/src/session_identity.rs` (≈ 35 lines): `#[napi(namespace = "sessionIdentity")] fn resolve(fgos_dir: Option<String>) -> Result<Value>` over `fgos_session_identity::resolve_current(fgos_dir.as_deref().map(Path::new))` returning `{ id, source }` (the Node process is the caller, so `resolve_current`'s own pid is right); `fn mint_attempt(attempt: String) -> Result<String>` over `mint_attempt_writer_id`, mapping `InvalidAttemptId` to an error whose message starts with `invalid-attempt-id`. `lib.rs` gains `pub mod session_identity;` and `"sessionIdentity": 1` in `versions()`; `src/native/door.mjs:61` checks it.
- **Layering (red-team scope F5):** `src/util/session-identity.mjs` is `kernel` (`docs/architecture-manifest.json:204`) and `src/native/door.mjs` is `infra` (`:31`); a kernel file may not import an infra one (`test/architecture.test.mjs:142-165`), and `src/state/event-log.mjs` (kernel, `:28` imports `resolveWriterIdentity`) keeps `session-identity.mjs` in the kernel. So the two leaf files of the door move down: `src/native/door.mjs` and `src/run-supervisor/payload-root.mjs` become `kernel` in the manifest (both import only Node builtins and `src/util/host-bin-path.mjs`, itself kernel at `:203`; `payload-root.mjs`'s other importers, `src/event-store/consumers.mjs`, `src/setup/git-checks.mjs`, `src/seat-binding/client.mjs`, are above it). Two manifest rows; `test/architecture.test.mjs` runs in this phase.
- `src/util/session-identity.mjs` (238 → ≤ 70, 4 exports): `resolveWriterIdentity(fgosDir)` → `nativeDoor().sessionIdentity.resolve(fgosDir ? path.resolve(fgosDir) : null)`, no cache (`:124-144, :174` go), door failures → `WriterIdentityError('host-missing', <cause with the next step>)`; `mintAttemptWriterId(attemptId)` → validates the string as today (`:186-188`), calls the door, maps `invalid-attempt-id`; the `{ bin, fgosDir }` option goes with its one caller `src/runner/dispatch/assignment-runner.mjs:1892` (`mintAttemptWriterId(launchCommandId)`); `probeIdentity(bin, fgosDir)` keeps the exec for the doctor (`registrations.mjs` `checkWriterIdentityResolvable`, `:6262-6320`), with `classifyExecError` reduced to `host-missing`, `host-version-mismatch`, `host-error` (D-T1-7); `IDENTITY_ENV_KEYS` goes (its only use was the cache key; the contract pins the order in `session-identity.resolve.v1.json`; `test/util/session-identity.test.mjs:85` retires with it); `stateLockHeld` and `identity-in-lock` go.
- Owner decision 10 (checkout channel): from a checkout `resolveWriterIdentity` now throws `host-missing` naming `npm run fgos:dev`; the hook already resolves through `fgos identity` (phase 2).

### One depth counter (S-E6, H19)

- Delete `src/util/state-lock-held.mjs`. `src/state/hot-lock.mjs:27` import, `:313` `noteLockHeld()`, `:324` `noteLockReleased()` go (`enterHotLock` at `:312` already counts). Its test importers (`grep -rl state-lock-held test`): `test/seat-binding/{client,exec-budget}.test.mjs` and `test/util/session-identity.test.mjs` move to `hotLockDepth`/`enterHotLock` from `hot-guard.mjs`; `test/state/hot-lock-known-exec-sites.test.mjs` is deleted in phase 4; `test/state/hot-lock-multiprocess.test.mjs:261` sits inside TEST's range (`:249-298`, owner decision 11) and is replaced by TEST's F1 batch (`cb60c7842`), which is this phase's **precondition** (plan.md Phases table); if that batch is not on main when phase 6 starts, the lead asks TEST on the board for that one import line. `src/runner/dispatch/provider-capacity.mjs:14, :428, :432`: the note goes; the provider-state lock's critical section never spawns and the only exec that asked was the identity resolver (now in process) and Seat Binding, which is not called under that lock — the lead confirms with `rg -n "seatBinding|createSeatBindingClient" src/runner/dispatch/provider-capacity.mjs` → nothing, and records it. `src/seat-binding/client.mjs:18, :119`: `stateLockHeld()` → `hotLockDepth() > 0` from `src/holder-lock/hot-guard.mjs` (the one counter; the `seat-binding-in-lock` refusal keeps its name and meaning: a host exec under the hot mutex). `test/runner/dispatch-reconciliation-import-graph.test.mjs:231` (`src/util/state-lock-held.mjs` in the closure) updated deliberately.

### `proc_tree.rs` onto `fgos-process` (S-E10)

- `packages/process/rust/src/facts.rs`: `Relation` (`:356-368`) gains `session: u32` and `tty_nr: i64` (fields 6 and 7 of `/proc/<pid>/stat`, which `parse_stat` at `:462-470` already walks past); `relation_of(pid)` already exists since phase 2 (the `selfChain` reader); the tests at `:562-581` gain `session` and `tty_nr` assertions on the existing line and `relation_of(ProcId(std::process::id()))` reads this process.
- `packages/session-identity/rust/Cargo.toml` adds `fgos-process = { path = "../../process/rust" }` (bottom-up: identity above process; `docs/platform/component-boundary.md:77` "depends only on `fgos-host-runtime`" → "on `fgos-host-runtime` and `fgos-process`"). `packages/session-identity/rust/src/proc_tree.rs`: delete `parse_proc_stat` (`:22-30`), `ProcFsTree` (`:33-42`) and the tests (`:83-114`); the Linux driver becomes `impl ProcessTree for FactsTree { fn stat(&self, pid) { facts::relation_of(ProcId(pid)).map(|r| ProcStat { ppid: r.parent, session: r.session, tty_nr: r.tty_nr }) } }`; `ProcStat`, `ProcessTree`, `SessionOnlyTree`, `UnreadableTree`, `os_process_tree` stay (≈ 60 lines). Owning proofs: `facts.rs:562-581` for the parser; `packages/session-identity/rust/tests/golden.rs:110` (`tree_cases_follow_the_golden_vectors`) for the rule.
- Specs: `docs/platform/process/spec.md:112` ("Two `/proc` readers remain … the Session Identity process-tree adapter and the Observe store lock reader") → the Session Identity adapter now reads through this crate; the readers still outside it are Observe's store lock reader (T3) and the run supervisor's two `/proc/<pid>/stat` parsers (`packages/run-supervisor/rust/src/gate/unix.rs:646`, `supervise/terminal.rs:269`, T4; recorded for the parent plan's phase 05); `docs/platform/session-identity/spec.md:48` (`proc_tree.rs` reads the OS) → reads through `fgos-process`; `:54-63` (§5 Node facade): the door, no cache, no in-lock rule, the error list `host-missing`, `host-version-mismatch`, `host-error` (probe only), `invalid-attempt-id`; `:83` limit removed; `:87` doctor unchanged; §8 gains a dated entry. `docs/platform/component-boundary.md:77` updated; `docs/specs/reading-map.md:53` (facade description) updated.

### T0's post-SEAT carry list (folded; the T0 phase file points here)

Re-verified on `e94b1618d` (SEAT moved the lines; symbols are the authority):

- `src/runner/dispatch/run-lock.mjs:34` (the `isProcessAlive` forwarder, ≈ 8 lines, before the kept `buildRunControlHolder`) and `:52` (`resolveHolderLiveness` re-export) deleted; `fsyncFileBestEffort`/`fsyncDirBestEffort` stay.
- `src/runner/dispatch/assignment-runner.mjs:76, :83`: import `resolveHolderLiveness` from `./process-identity.mjs`; the staging judge at `:898` (`if (isProcessAlive(stagedPid))`) becomes `resolveHolderLiveness({ pid: stagedPid }) === 'dead'` with the directory removed only on `dead` (T0's P1: an `unknown` holder keeps the staging directory); `isProcessAlive` import removed; `canonicalJson` at `:118` unchanged (from `proof-helpers.mjs`).
- `src/runner/execution/run.mjs:56-57` `writeJsonAtomic` and `src/runner/execution/unit-summary.mjs:189`: the temp name from `uniqueTmpTag()` (`src/util/unique-tmp-tag.mjs`); no-fsync class stays Node.
- `apps/fgos/src/main.rs`: no edit (recorded, as T0 expected).
- Close criterion of T0's phase 01: `rg -n "export\s+(function\s+|\{[^}]*\b)(isProcessAlive|resolveHolderLiveness|pidExists|canonicalJson|getBootId|getProcessStartTime|getPidNs)\b" src` → only `process-identity.mjs` (`resolveHolderLiveness`), the one re-export in `proof-helpers.mjs` and `effective-execution-contract.mjs:39` (H11).
- The parent plan's phase 01 "Constraints" (carry list done) and T0's phase 7 file get the done line; the board row too.

### Tests

- `test/util/session-identity.test.mjs` (320 lines): keep `:90` (writerId format floor), `:97` rewritten as one door wiring case over the env vectors (no fresh process per case needed: set env, call, compare; `golden.rs:93` owns the rule), `:169` (no fgos dir → no registry), `:181` and `:189` (tree rule through the door; `golden.rs:110` owns it), `:211` rewritten for `probeIdentity` ("the doctor probe finds the activation's host without `FGOS_HOST_BIN`"), `:235` rewritten ("without the addon the resolver is `host-missing` and names the dev door"), `:315` (unresolved names the Node process); **retire** `:85` (cache key; removed), `:128` and `:148` (cache behaviour; removed), `:280` (no exec under a lock; removed), `:302` (the verb's argv and env; the resolver no longer execs); **rewrite, not retire,** `:248` against `probeIdentity` (a hung host → `host-error`, a non-JSON answer → `host-error`, never cached: `writer-identity-doctor-check.test.mjs:42-60` covers only the mismatch and missing cases, red-team scope F8). ≈ −130.
- `test/state/identity-before-lock.test.mjs` (175) deleted: the behaviour "resolve before the lock because the resolver spawns" is removed; the live guard against spawning under the hot mutex stays owned by `test/state/hot-lock-guard.test.mjs`.
- `test/session-identity/attempt-writer-id.test.mjs:24, :58`: through the door (no `needsHost`); `:40, :53` unchanged.
- `test/runner/assignment-*.test.mjs`: the staging wiring case "unknown keeps the staging directory" is added only if `rg -n "staging" test/runner/assignment-layout.test.mjs test/runner/assignment-dispatch.test.mjs` finds none (T0 phase 7).
- `packages/session-identity/rust/src/proc_tree.rs:83-114` tests retired (owner: `facts.rs:562-581`); `golden.rs` unchanged.

## Files

**Create**: `packages/git/node-addon/src/session_identity.rs` (+35). **Modify**: `packages/git/node-addon/{Cargo.toml,src/lib.rs}`, `Cargo.lock`, `src/native/door.mjs` (one line), `docs/architecture-manifest.json` (two rows: `door.mjs`, `payload-root.mjs` → kernel), `test/seat-binding/{client,exec-budget}.test.mjs`, `src/util/session-identity.mjs`, `src/state/hot-lock.mjs` (3 lines), `src/runner/dispatch/{provider-capacity.mjs,assignment-runner.mjs,run-lock.mjs}`, `src/seat-binding/client.mjs`, `src/runner/execution/{run.mjs,unit-summary.mjs}`, `packages/process/rust/src/facts.rs`, `packages/session-identity/rust/{Cargo.toml,src/proc_tree.rs}`, `docs/platform/{session-identity/spec.md,process/spec.md,component-boundary.md}`, `docs/specs/reading-map.md`, the tests named, `test/runner/dispatch-reconciliation-import-graph.test.mjs`, `packages/git/contracts/mutation-census.v1.json`, `test/suite-baseline.json`, `CHANGELOG.md` ("the writer identity resolves in process; `fgos identity` stays for people and the doctor"). **Delete**: `src/util/state-lock-held.mjs` (23), `test/state/identity-before-lock.test.mjs` (175), `proc_tree.rs:22-42, 83-114`, `run-lock.mjs:34-42, :52`, `session-identity.mjs` exec/cache/classification (`:18, :22, :32-37, :70-86` reduced, `:124-144, :174, :197-226`). **Tests to retire**: the list above, each with its owner.

## Steps

1. Rust: `facts.rs` (`Relation` fields, `relation_of`, tests), `proc_tree.rs` driver swap, `session_identity.rs`, `lib.rs`, Cargo; `cargo test -p fgos-process -p fgos-session-identity -p fgos-node-addon`; clippy; `cargo fmt`.
2. The facade; the counter; the SEAT client; the T0 carry sites; the import-graph closure.
3. Tests; the baseline; the census; CHANGELOG; the specs and boundary; DOC told; the board (MAIL announcement of the public Rust additions).
4. Report: Δ table, test-cost line, `resolveWriterIdentity` p50 (door) against the baseline's 1.41 ms spawn / 0.9 µs cached, T0 carry list closed.

## Verification (exact)

- `cargo test --workspace` green; `cargo clippy --workspace --all-targets -- -D warnings`.
- One-file runs: `test/util/session-identity.test.mjs test/session-identity/attempt-writer-id.test.mjs test/setup/writer-identity-doctor-check.test.mjs test/state/hot-lock-tx.test.mjs test/state/hot-lock-multiprocess.test.mjs test/state/hot-lock-guard.test.mjs test/runner/dispatch-reconciliation-import-graph.test.mjs test/runner/assignment-layout.test.mjs test/runner/assignment-dispatch.test.mjs test/runner/assignment-runresult.test.mjs test/runner/execution/run.test.mjs test/runner/execution/unit-summary.test.mjs test/runner/run-lock-identity.test.mjs test/seat-binding/*.test.mjs test/runner/provider-capacity*.test.mjs`.
- `wc -l src/util/session-identity.mjs` ≤ 70; `rg -n "execFileSync|spawnSync" src/util/session-identity.mjs` → only inside `probeIdentity`; `rg -n "state-lock-held|noteLockHeld|stateLockHeld|identity-in-lock|IDENTITY_ENV_KEYS" src bin test` → nothing; `rg -n "rfind\(\x27\)\x27\)" packages/process/rust/src packages/holder-lock/rust/src packages/session-identity/rust/src packages/convention/rust/src` → `facts.rs` only; `rg -n "isProcessAlive|resolveHolderLivenessByIdentity" src` → nothing; `rg -n "\.\$\{process\.pid\}\.\$\{" src/runner/execution` → nothing; `test/architecture.test.mjs` green.

## Net size

Node −215 (`session-identity.mjs` −170, `state-lock-held.mjs` −23, `hot-lock.mjs` −3, `provider-capacity.mjs` −3, `seat-binding/client.mjs` ±0, `run-lock.mjs` −12, `assignment-runner.mjs` −2, `run.mjs`/`unit-summary.mjs` ±0). Rust +7 (`session_identity.rs` +35, `lib.rs` +2, `proc_tree.rs` −28, `facts.rs` +2 for the two fields, Cargo +2; `relation_of` was phase 2's). Tests −320 (`identity-before-lock` −175, `session-identity.test` −130, `proc_tree.rs` tests −30, `facts.rs` tests +6, `attempt-writer-id` ±0, `seat-binding` tests ±0, `import-graph` −1, staging wiring +8 if missing).

## Test-cost line

Added ≤ 1, retired 6 cases + 1 file + 3 Rust unit tests. Host spawns removed: every `session-identity.test` case that ran `fgos identity` in a fresh process (≈ 12 spawns), `identity-before-lock` (10 ms polls, a fresh process per write path), `attempt-writer-id:24,58` (the route spawn). New spawns: none. CLI-call cost pasted.

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| A caller relied on the identity cache's per-process stability (two calls, two answers) | L × M | The rule is a pure function of env, `/proc` tree and the registry file; `golden.rs` proves it; `:315` and the env wiring case call twice and compare. |
| The provider-state lock's note protected a Seat Binding exec | L × M | The lead's grep (requirements) is recorded; if a call is found, `withProviderStateLock` wraps `fn` in `enterHotLock()` instead (the child-process guard then applies too, which is the intent). |
| The addon's new crate dependency grows the Windows build | L × L | `fgos-session-identity` is 564 lines and pure; the cross-platform workflow builds it. |
| SEAT-TRIM edits `src/seat-binding/client.mjs` in the same window | M × L | SEAT-TRIM is held; the board row names the file. |

## Rollback

Revert the phase's commits; the exec and the third counter return. No on-disk format changes.

## Done when

The facade is ≤ 70 lines over the door; one counter; `proc_tree.rs` reads through `fgos-process`; T0's carry list and the parent phase 01 constraint are marked done; the specs say so; DOC and MAIL told; the Δ table in the report.
