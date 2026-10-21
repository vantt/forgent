---
phase: 02
title: "The door: T0 loader leaf, addon namespaces, versions, npm descriptor, H8"
status: pending
depends_on: [01]
parallel: "may run in parallel with phase 01 and phase 04 (disjoint files); phase 03 and 05 start after this phase merges; steps 2b/2c settled by OQ-2 (a) and OQ-3 (c), owner 17:43"
effort: ~1.5d
net_size: "Node −33 / Rust +185 / tests −170 (estimate)"
---

# Phase 02 — The door

## Context

[plan.md](plan.md) Facts ("The combined addon and its loader", "H8", "The npm channel", "Architecture guards"); arbitration D1, D2, Part A rows for `fgos-process`, `canonical-json`, `durable-file`; red-team "hidden addition 3" (import-graph trap) and speed S14 (never a second hash of the same file). Owner decision 2 (in-process binding with T0's own loader; the cold paths may keep the route until the door ships on every channel).

## Requirements

- One loader leaf owned by T0, `src/native/door.mjs` (new directory, kebab-case; layer `infra` in `docs/architecture-manifest.json`, so it may import `src/run-supervisor/payload-root.mjs` (infra) and nothing above). It does what `src/git/native.mjs:27-73` does today (descriptor, target and Node-API check, one hash per process per file identity, one `require`, `versions()` check) for every namespace, and exposes the addon lazily: nothing is loaded at import time; the first door call loads. It never imports `native-handover.mjs` (the pin at `test/architecture.test.mjs:1288-1296` stays true) and never imports anything from `src/holder-lock/` or `src/state/`.
- `src/git/native.mjs` keeps every export it has (`nativeHelperExe`, `nativeError`, `withNativeLocks`, `loadNativeAddon`) and the same error names (`git-addon-unavailable`, `git-addon-not-shipped`, `git-addon-second-load`), but `loadNativeAddon` calls the leaf and only adds the Git handover registration (:64). Its `test/git/native-load.test.mjs` cases (`:22, :26, :35, :41, :102`) stay the owning proofs of loading and verification and are extended, not duplicated.
- `src/runner/dispatch/process-identity.mjs` becomes the thin client with the **six door exports** `judge(record)`, `observe(pid)`, `selfRecord()`, `signalByIdentity(record, signal)`, `scan(filter)`, `resolveHolderLiveness(record)`; no `/proc` read, no `process.kill`, no cache, no vector logic. `resolveHolderLiveness(record)` is `judge(record) === 'dead' ? 'dead' : 'held'` (the one P1 adapter; the `isAlive` parameter is removed: the door observes). **In this phase the file also keeps the six legacy names as one-line door-backed forwarders** so that the nine production importers and the test importers still link until phase 3 moves them (red-team FM-02/AD-03/Scope-F4): `getBootId() = selfRecord().bootId ?? 'unknown-boot'`, `getProcessStartTime(pid) = observe(pid).kind === 'live' ? observe(pid).startTime : null`, `getPidNs() = selfRecord().pidNs`, `pidExists(pid) = observe(pid).kind !== 'absent'`, `localObserver()`/`observeProcess(pid)` as thin maps of `selfRecord`/`observe`. The budget **≤ 60 lines, exactly 6 exports** is the done-when of phase 3 (which deletes the forwarders with their last importer), not of this phase. Loader errors are named and carry the next step: `process-door-unavailable: <cause>`, `process-door-not-shipped: onboard this project with fgctl init`; the thin client maps the leaf's `git-addon-unavailable`/`git-addon-not-shipped` codes (unchanged for Git's tests) to these two at its boundary, and the leaf's own exports (`replaceDurably`, `installOnce`, `canonicalJson`) keep the leaf's codes. No JS fallback of any kind.
- The addon exports three namespaces (`process`, `durableFile`, `canonicalJson`) from three new modules in `packages/git/node-addon/src/`, named like the existing `git.rs`/`event_store.rs`, each calling `check()` first and mapping errors through `error()` (`lib.rs:11-16`). `versions()` reports `process` (`process-facts-judge` v1 from `packages/process/contracts/process-facts.judge.v1.json:2`), `durableFile` (the crate version) and `canonicalJson` (the vector contract version); it stops re-parsing the envelope schema per call (compute once in a `OnceLock`; red-team disagreement 1 measured 11.6 µs of that).
- `process` namespace, synchronous, never throwing on a judgement. **Exact JSON shapes** (red-team FM-04/AD-04/Sec-F2/Scope-F3: the Rust `Observed` carries only a start time, `facts.rs:169-178`; `ProcView` nests `tuple`, `facts.rs:479-500`; the quiesce route's JSON, `route.rs:715-722`, lacks `exe`, `host`, `bootId`, `pidNs`; `control::signal_by_identity` needs a full `ProcTuple` and `out_of_scope` refuses a tuple whose `host` or `pid_ns` differs, `control.rs:121-131`):
  - `judge(record) → 'alive'|'dead'|'unknown'` (`facts::Record::from_json` + `judge_here`; a record without `host` or `pidNs` is judged by the table's own rules for missing fields).
  - `observe(pid) → {kind:'live', host, bootId?, pidNs, pid, startTime} | {kind:'absent'} | {kind:'zombie'} | {kind:'unreadable', cause}` — a live observation is the **full tuple**, built from `facts::identity_of` (`platform/mod.rs:69-74`) plus the observer, so a caller can store it as a record and signal it later.
  - `selfRecord() → {host,bootId?,pidNs,pid,startTime}` (`facts::self_identity`, cached per process in a `OnceLock`; `bootId` absent where the platform has none).
  - `signalByIdentity(record, 'term'|'kill'|'int') → 'sent'|'not-found'|'identity-mismatch'|'identity-unknown'|'denied'|'unsupported'|'failed'`. Record-to-tuple rule, the same as the judge table's missing-field rules so there is one rule set: `host` absent → the observer's host; `pidNs` absent → the observer's namespace when the observer is in the initial namespace, else `'identity-unknown'`; `bootId` absent → not compared; `startTime` absent or `pid` not a positive integer → `'identity-unknown'`. The addon runs `judge` before signalling and the Rust driver re-judges under the pidfd (`platform/linux.rs:199`). This is what lets a hot record (`hot-lock.v1.json:18`, no `host`) and a gateway record be signalled.
  - `scan(filter) → [{pid, tuple: {host,bootId?,pidNs,pid,startTime} | null, exe, cwd, cmdline, unreadable: [...]}] | 'unsupported'` — one flat view per `ProcView`, `tuple` null when the identity could not be read (never dropped), `exe` as the kernel reports it (the caller strips ` (deleted)` as `stop-processes-inside.mjs:26` does today).
  No wrapper for containment or domain calls (D4).
- `durableFile` namespace: `replaceDurably(dir, name, bytes, mode)` and `installOnce(dir, name, bytes, mode)` returning `'created'|'already-exists'`, or throwing an error whose message names the step and carries `installed` (`'created'|'already-exists'|'none'`). `mode` is explicit at every call site (the crate's default is `0o600`, `durable-file/src/lib.rs:86, :147`; Node's `openSync(..., 'w')` default is `0o666 & ~umask`): the Node wrapper has no default. The wrapper **always unlinks `error.temporary` before rethrowing** (no Node caller inspects a temp today; `writeFileAtomic` removes its own, `provider-credential-renewal.mjs:117`), so no `.durable-file-*.tmp` with secret bytes survives a failed credential write (red-team Sec-F6); the error message still names the step.
- `canonicalJson(value)`: **exact semantics**, because N-API's `serde_json::Value` conversion (napi 2.16.17, `bindgen_runtime/js_values/object.rs:46-47`, `serde.rs:53-58, :104-108, :147-174`) silently drops `undefined` object members, throws `InvalidArg` for a top-level `undefined`, an array hole, a function or a non-finite number, and hits `todo!()` for `BigInt` (red-team Scope-F2): the Node wrapper first runs `JSON.stringify(value)` as a guard (it throws on `BigInt` and cycles) and maps any `InvalidArg` to `canonical-json-not-json`; `undefined` members are dropped, which is `proof-helpers.mjs:18-22`'s rule, and the crate refuses `NaN`/`Infinity` by name. The contract sentence in the spec says exactly this: "a value that is not JSON is refused by name; an `undefined` member is absent, as `JSON.stringify` makes it". Consequence for phase 5: `effective-execution-contract.mjs:39-48`, which keeps `undefined` members in its bytes, is a contract change and goes to the parent plan's phase 07 (H11) without a corpus run.
- Node re-exports with budgets: `src/native/door.mjs` exports `loadNativeAddon(options)`, `nativeDoor()` (the lazy own-release addon), `canonicalJson`, `replaceDurably`, `installOnce` — 5 exports, ≤ 100 lines including the moved loader. The 6-export, 60-line budget applies to `process-identity.mjs`.
- Import-graph and architecture guards change **deliberately**, each in its own commit: `ALLOWED_BUILTINS` gains `'module'` (`dispatch-reconciliation-import-graph.test.mjs:106-108`); `EXPECTED_CLOSURE` gains `src/native/door.mjs` and `src/run-supervisor/payload-root.mjs` (:192-243); `docs/architecture-manifest.json` gains the row `src/native/door.mjs: infra`. The `SIGNAL_ZERO_PROBE` exemption (:142-151) is removed in phase 3, once `provider-capacity.mjs:579` no longer calls `process.kill(x, 0)`.
- The npm channel (D2): OQ-2 answered (a), owner 17:43: not supported; T0 builds no npm route (H14 to T9).
- H8: per OQ-3 (c) (owner 17:43), T0 only moves the existing per-process verification into the leaf; the cross-process fix is handed to T9 with H13.
- Per-process verification key in the leaf (criteria 2 and 3 for every channel, Sec-F1): `${artifactDigest}:${entry.digest}:${dev}:${ino}:${size}:${mtimeNs}:${ctimeNs}` — `ctimeNs` and the manifest digest are added to today's key (`native.mjs:50`), and the addon path is refused when it is a symlink (as `verify.rs:151` does).

## GIT lane review conditions (2026-10-21 17:55, approved with these)

1. **Same payload rule for the door.** `src/git/native.mjs:29-35` accepts a manifest only when its `components.legacyNode.root` realpath equals `OWN_PAYLOAD_ROOT`, else it falls back to `native-addon.json`. The leaf's lookup order (`FGOS_HOST_BIN` → `resolveActiveHostBin({cwd})` → `native-addon.json`) keeps that check on **both** host lookups: the cwd's activation is not the running payload's release, so a dev host or an older-release payload in a project activated at another release must never load that release's addon.
2. **One addon per process, one memo.** The leaf keeps the single loaded `{file, addon}`. `loadNativeAddon({descriptor})` naming the same file returns it; a different file is refused by name (`git-addon-second-load`) **before** `require`, not by the socket after `dlopen`. Script consumers that pass an explicit descriptor keep working: `scripts/git/e3-bench.mjs`, the power-loss driver, `store-increment-worker`, `forge-probe`, `scripts/git-addon.mjs`, `scripts/lib/git-ports.mjs`, `src/event-store/native.mjs` `loaderOptions`. One `native-load.test.mjs` case: door first, then Git with the same descriptor gives the same object; with another file, a named refusal.
3. **Whoever loads first, Git still sees its facts.** `nativeHelperExe(addon)` (the `helperExes` WeakMap, set from manifest `entries.fgos`) and `registerGitHandover` must hold when the door loaded the addon before any Git call: set `helperExes` inside the leaf, or derive it in Git's wrapper from the leaf's memo. Handover stays registered lazily on the first Git call (`withNativeLocks`).
4. **`versions()` stays fail-closed** for the `git`/`eventStore` fields with the same text `git-addon-unavailable: combined addon ABI mismatch`. The per-process key adds `ctimeNs` and the manifest digest; symlinks are refused.
5. **Census and one-door after the move:** run `node scripts/git-one-door-scan.mjs --write-census` and doctor `git-mutation-one-door`; smoke-load the script consumers (`node scripts/git-addon.mjs`, `node scripts/git/e3-bench.mjs --help` or one quick row).

Coordination: GIT's M3 lead touches `src/setup/git-checks.mjs` and the Rust Recovery/Inspect read side, which does not overlap this phase; GIT warns before touching `packages/git/node-addon/src/git.rs`.

## Files

**Create**
- `src/native/door.mjs` (≤ 100 lines).
- `packages/git/node-addon/src/process.rs` (~90 lines), `packages/git/node-addon/src/durable_file.rs` (~40), `packages/git/node-addon/src/canonical_json.rs` (~15).

**Modify**
- `packages/git/node-addon/src/lib.rs` (:2-6 modules, :18-31 `versions()`), `packages/git/node-addon/Cargo.toml` (direct deps `fgos-process`, `fgos-durable-file`, `fgos-canonical-json`), `Cargo.lock`.
- `src/git/native.mjs` (:1-73 → wrapper over the leaf; the `verified` Map, `require`, hashing and manifest lookup move out).
- `src/runner/dispatch/process-identity.mjs` (158 → ≤ 60 lines).
- `test/runner/dispatch-reconciliation-import-graph.test.mjs` (:106-108, :192-243).
- `docs/architecture-manifest.json` (one row; SEAT touches this file: tell SEAT).
- `test/git/native-load.test.mjs` (`:22` also asserts `versions().process/durableFile/canonicalJson`; `:41` also proves the leaf's named errors; `:102` proves the npm-relative descriptor for the three namespaces).
- `scripts/run-tests.mjs:131-155` `buildTestEnv`: call `ensureGitAddon(childEnv, REPO_ROOT)` after `ensureHostBin`, so `test:canary`, `test:related`, `test:select:coverage-map` and single-file runs get the staged manifest the door needs (red-team Scope-F5: today only the `isMainModule` block at `:586-590` stages it, and `ensureHostBin` alone yields `target/debug/fgos`, for which `releasePayloadManifest` finds no manifest).
- `test/process/process-facts-vectors.test.mjs`: the 27-vector loop (:66-70) and the seven `resolveHolderLiveness` cases (:72-125) and the zombie case (:135-157) are replaced by: one wiring case "the door judges one live and one unknown vector as the table says" (owner of the table stays `packages/process/rust/tests/judge_vectors.rs:73-104`); the kept case "a record without a pid is held, never dead" (:72, the owning proof of policy P1); one new wiring case "signalByIdentity refuses a reused pid with identity-mismatch and sends nothing" (Rust owner `signal_identity.rs:44-57`); `localObserver` case (:127) becomes "selfRecord names this host, boot and namespace". The `isAlive` parameter cases (:95, :103, :121) are retired as behaviour removed.
- `test/runner/run-lock-identity.test.mjs`: retire `:36-74` (self-consistency and six verdict/policy cases; verdicts owned by `judge_vectors.rs`, policy by `process-facts-vectors.test.mjs:72`); keep `:76-110` (three `acquireRunControl` cases); its import at `:17` moves to `selfRecord`.
- Test importers keep working through the forwarders in this phase; phase 3 migrates them with the production importers: `test/setup/holder-lock-checks.test.mjs:33, :302` and `test/cli/fgos-lock-fence.test.mjs:214-215` read a **child's** start time (`getProcessStartTime(gate.pid)`, `getProcessStartTime(child.pid)`) and must use `observe(child.pid).startTime`, never `selfRecord()` (red-team Scope-F4); `test/setup/lock-record-checks.test.mjs:11`, `test/setup/run-supervisor-checks.test.mjs:28`, `test/runner/provider-capacity.test.mjs:29`, `test/run-supervisor/legacy-sweep.test.mjs:12` use `selfRecord()` where the pid is `process.pid` and `observe(pid)` otherwise; `test/runner/custody-successor-admission.test.mjs:71, :99, :190, :242` import `localObserver` and `getProcessStartTime` by URL and move to `selfRecord`/`observe` the same way (missed by the first draft).
- `src/setup/holder-lock-checks.mjs:26` and `src/run-supervisor/legacy-sweep.mjs:11` import `judge` unchanged; verify they pass no `observe` option (`rg -n "judge\(" src/setup/holder-lock-checks.mjs src/run-supervisor/legacy-sweep.mjs`), else drop it.
- `packages/git/contracts/mutation-census.v1.json` (regenerated).
- `CHANGELOG.md` `[Unreleased]`: the npm channel ships the addon descriptor; `process-identity` judges through the Rust crate.

**Delete**
- `test/runner/process-identity.test.mjs` (80 lines, whole file): `:31, :36, :47, :52, :57, :66, :71` are verdict duplicates owned by `judge_vectors.rs`; `:42` ("isAlive=false short-circuits") is behaviour removed with the parameter; `:76` ("no pid → held") is owned by `process-facts-vectors.test.mjs:72`.
- In `process-identity.mjs`: the Node bodies of `getBootId`, `getProcessStartTime`, `getPidNs`, `pidExists`, `localObserver`, `observeProcess`, `parseProcStat` and `judge` (:27-147). The six legacy **names** stay as forwarders until phase 3 deletes them.

**Tests to retire** (each names its owner): listed above under `process-facts-vectors`, `run-lock-identity`, `process-identity.test.mjs`.

## Steps

1. **2a, Rust.** Add the three modules and deps; `versions()` once-computed; `cargo build -p fgos-node-addon`; `cargo test -p fgos-node-addon` (add one in-crate test per namespace only if no Node wiring case covers it; the wiring cases below do).
2. **2a, Node.** Create `src/native/door.mjs` by moving `native.mjs:27-63` and generalising the `versions()` check to the five fields; `nativeDoor()` memoises the own-release addon, resolved in this order: `releasePayloadManifest(process.env.FGOS_HOST_BIN)`, then `releasePayloadManifest(resolveActiveHostBin({ cwd: process.cwd() }).bin)` (so `node bin/fgos.mjs` inside an activated workspace finds its release; `src/util/host-bin-path.mjs:69-98`), then `native-addon.json`; loaded on first call. Rewrite `native.mjs` as the wrapper. Rewrite `process-identity.mjs` (six door exports plus the six forwarders). Run the five files of the Verification section with phase 1's one-file command.
3. **2a, guards.** Commit the import-graph and manifest edits separately with the reason in the message ("the door loads the addon through node:module; the leaf and payload-root join the reconcile closure").
4. **2b, npm channel.** OQ-2 answered (a), owner 17:43: no npm route in T0. The door refuses on the npm and direct-`node` channels with `process-door-not-shipped: onboard this project with fgctl init`; prove that one refusal in `test/git/native-load.test.mjs`. Hand-off H14 (retire the npm channel) goes to T9/Packaging.
5. **2c, H8: removed.** OQ-3 answered (c), owner 17:43, superseding OQ-1 (a). The leaf keeps today's per-process verification (`native.mjs:49-53` moved as is, `ctimeNs` added to the per-process key), loaded lazily on the first door call. No `activation.json` field, no `init.rs` edit. H8 and H13 go to T9/Packaging as one item: each CLI call verifies the release once.
6. Regenerate the census; run the focused tests, then `npm test` once in the worktree; write the lead report with Δ-lines.

## Verification (exact)

- `cargo build --locked -p fgos-node-addon && cargo test -p fgos-node-addon`
(One-file runs use the `runSelectedTests` one-liner of phase 1.)
- `test/git/native-load.test.mjs`
- `test/process/process-facts-vectors.test.mjs test/runner/run-lock-identity.test.mjs`
- `test/runner/dispatch-reconciliation-import-graph.test.mjs test/architecture.test.mjs`
- `node scripts/git-one-door-scan.mjs --write-census && git diff --stat packages/git/contracts/mutation-census.v1.json`
- `rg -n "/proc/|process\.kill" src/runner/dispatch/process-identity.mjs src/native/door.mjs` → nothing. (The ≤ 60 lines / 6 exports budget is checked at the end of phase 3.)
- `node scripts/test-select-coverage-map.mjs` and `npm run test:canary` reach the door (the `buildTestEnv` change): run `test/process/process-facts-vectors.test.mjs` through `runSelectedTests` with `buildTestEnv(process.env)` only, no `FGOS_ACTIVE_MANIFEST_PATH` inherited.
- Cost check (recorded for phase 8): warm `judge` p95 ≤ 25 µs, `selfRecord` ≤ 5 µs after the first call, `signalByIdentity` ≤ 100 µs, first load ≤ 1 ms excluding verification (speed seat Q1 table).

## Net size

Node: leaf +100, `native.mjs` −45, `process-identity.mjs` −90 (forwarders +8 until phase 3), `run-tests.mjs` +2 → ≈ −33. Rust: addon modules and `versions()` +160 (step 2c `init.rs` +25 removed by OQ-3 (c), owner 17:43) → ≈ +160 (the increase this layer accepts for the owner-decided binding; paid by the Node deletions, see plan.md "Sum of the estimates"). Tests: `process-identity.test.mjs` −80, `process-facts-vectors` −95, `run-lock-identity` −40, `native-load` +20 (the 2c cases removed with OQ-3 (c); one npm-channel refusal case), guards +4, wiring +6 → ≈ −170.

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| The reconcile closure's runtime probe (`import-graph.test.mjs:282-300`) sees `node:module` as a loaded builtin and refuses it | H × L | That is why `ALLOWED_BUILTINS` gains `module` deliberately; the probe never loads the `.node` because the door is lazy and reconcile never judges in the probe. |
| `single_load` refuses a second load when a test stages two addon copies | M × M | One leaf, one `require` per file identity; `native-load.test.mjs:26` already owns this behaviour and keeps passing. |
| A Windows `selfRecord()` has no `bootId` and a caller writes `undefined` | H × H (RT-M5) | Phase 3 writes `bootId ?? 'unknown-boot'` at `direct-launch.mjs:131`; the Rust reader `Record::from_json` (`facts.rs:90-114`) skips `unknown-boot` on judge. |
| OQ-1 (a) needs re-activation to take effect | H × L | Phase 8's landing re-activates every workspace. |
| SEAT also edits `docs/architecture-manifest.json` | M × L | One added row; the later lane rebases. |

## Rollback

Revert the phase's commits; `native.mjs` returns to its former body and `process-identity.mjs` to the Node leaf. No on-disk format changes except OQ-1 (a)'s optional field, which the previous release ignores.

## Done when

The door loads on the activated-release, dev-host and test channels (proven by `native-load.test.mjs`, and by `buildTestEnv` for the selective runners), the six door exports plus the six forwarders are in `process-identity.mjs`, the guards are edited deliberately, retired tests name their owners, 2c is implemented with the GIT criteria proven, and 2b is recorded as blocked on OQ-2 (or done, if answered).

## Lead brief essentials

Delete list: `process-identity.mjs:27-147`, `test/runner/process-identity.test.mjs`, the verdict cases named above. Find the owning test before writing a new one (`judge_vectors.rs`, `signal_identity.rs`, `native-load.test.mjs`). Δ-lines per language in the report. Report only what you saw yourself. The leaf never imports `native-handover.mjs`, `holder-lock/*` or `state/*`. Report name from `fgos convention name --json` under `plans/reports/`. Tell GIT/ES and Packaging on the board before merge.
