---
phase: 02
title: "The door: T0 loader leaf, addon namespaces, versions, npm descriptor, H8"
status: pending
depends_on: [01]
parallel: "may run in parallel with phase 01 and phase 04 (disjoint files); phase 03 and 05 start after this phase merges; step 2c implements OQ-1 (a), owner 16:20"
effort: ~1.5d
net_size: "Node −30 / Rust +160 / tests −180 (estimate)"
---

# Phase 02 — The door

## Context

[plan.md](plan.md) Facts ("The combined addon and its loader", "H8", "The npm channel", "Architecture guards"); arbitration D1, D2, Part A rows for `fgos-process`, `canonical-json`, `durable-file`; red-team "hidden addition 3" (import-graph trap) and speed S14 (never a second hash of the same file). Owner decision 2 (in-process binding with T0's own loader; the cold paths may keep the route until the door ships on every channel).

## Requirements

- One loader leaf owned by T0, `src/native/door.mjs` (new directory, kebab-case; layer `infra` in `docs/architecture-manifest.json`, so it may import `src/run-supervisor/payload-root.mjs` (infra) and nothing above). It does what `src/git/native.mjs:27-73` does today (descriptor, target and Node-API check, one hash per process per file identity, one `require`, `versions()` check) for every namespace, and exposes the addon lazily: nothing is loaded at import time; the first door call loads. It never imports `native-handover.mjs` (the pin at `test/architecture.test.mjs:1288-1296` stays true) and never imports anything from `src/holder-lock/` or `src/state/`.
- `src/git/native.mjs` keeps every export it has (`nativeHelperExe`, `nativeError`, `withNativeLocks`, `loadNativeAddon`) and the same error names (`git-addon-unavailable`, `git-addon-not-shipped`, `git-addon-second-load`), but `loadNativeAddon` calls the leaf and only adds the Git handover registration (:64). Its `test/git/native-load.test.mjs` cases (`:22, :26, :35, :41, :102`) stay the owning proofs of loading and verification and are extended, not duplicated.
- `src/runner/dispatch/process-identity.mjs` becomes the thin client: **≤ 60 lines, exactly 6 exports** `judge(record)`, `observe(pid)`, `selfRecord()`, `signalByIdentity(record, signal)`, `scan(filter)`, `resolveHolderLiveness(record)`; no `/proc` read, no `process.kill`, no cache, no vector logic. `resolveHolderLiveness(record)` is `judge(record) === 'dead' ? 'dead' : 'held'` (the one P1 adapter; the `isAlive` parameter is removed: the door observes). Loader errors are named and carry the next step: `process-door-unavailable: <cause>`, `process-door-not-shipped: onboard this project with fgctl init`. No JS fallback of any kind.
- The addon exports three namespaces (`process`, `durableFile`, `canonicalJson`) from three new modules in `packages/git/node-addon/src/`, named like the existing `git.rs`/`event_store.rs`, each calling `check()` first and mapping errors through `error()` (`lib.rs:11-16`). `versions()` reports `process` (`process-facts-judge` v1 from `packages/process/contracts/process-facts.judge.v1.json:2`), `durableFile` (the crate version) and `canonicalJson` (the vector contract version); it stops re-parsing the envelope schema per call (compute once in a `OnceLock`; red-team disagreement 1 measured 11.6 µs of that).
- `process` namespace, synchronous, never throwing on a judgement: `judge(record) → 'alive'|'dead'|'unknown'` (`facts::Record::from_json` + `judge_here`), `observe(pid) → {kind, startTime?, cause?}`, `selfRecord() → {host,bootId,pidNs,pid,startTime}` (`facts::self_identity`, cached per process in a `OnceLock`; `bootId` absent where the platform has none), `signalByIdentity(record, 'term'|'kill'|'int') → 'sent'|'not-found'|'identity-mismatch'|'identity-unknown'|'denied'|'unsupported'|'failed'`, `scan(filter) → views | 'unsupported'` (`facts::scan`, the shape the quiesce route already serialises). No wrapper for containment or domain calls (D4).
- `durableFile` namespace: `replaceDurably(dir, name, bytes, mode?)` and `installOnce(dir, name, bytes, mode?)` returning `'created'|'already-exists'`, or throwing an error whose message names the step and carries `installed` (`'created'|'already-exists'|'none'`) and `temporary` (phase 5 changes the Rust `Display`; this phase passes the fields through). `canonicalJson(value)` returns the string or throws `canonical-json-not-json` for `undefined` members, array holes and non-finite numbers (the N-API `serde-json` conversion already refuses the first two; the crate refuses the third by name).
- Node re-exports with budgets: `src/native/door.mjs` exports `loadNativeAddon(options)`, `nativeDoor()` (the lazy own-release addon), `canonicalJson`, `replaceDurably`, `installOnce` — 5 exports, ≤ 100 lines including the moved loader. The 6-export, 60-line budget applies to `process-identity.mjs`.
- Import-graph and architecture guards change **deliberately**, each in its own commit: `ALLOWED_BUILTINS` gains `'module'` (`dispatch-reconciliation-import-graph.test.mjs:106-108`); `EXPECTED_CLOSURE` gains `src/native/door.mjs` and `src/run-supervisor/payload-root.mjs` (:192-243); `docs/architecture-manifest.json` gains the row `src/native/door.mjs: infra`. The `SIGNAL_ZERO_PROBE` exemption (:142-151) is removed in phase 3, once `provider-capacity.mjs:579` no longer calls `process.kill(x, 0)`.
- The npm channel (D2): the release build already makes the descriptor; this phase adds the producer for the package channel as a step of the existing script, not a new mechanism: `scripts/build-rust-distribution.mjs` gains `--npm-descriptor <payloadRoot>` which writes `native-addon.json` (`{components: {nativeAddon}, entries: {fgos}}`, the shape `native.mjs:38` already reads) beside the payload and copies the addon to `libexec/native/fgos.node` under it; `package.json` `files` gains `native-addon.json` and `libexec/native`. Direct `node bin/fgos.mjs` outside a release and without the descriptor refuses by name, as Git does today. macOS is not a release target (`packages/distribution/rust/src/manifest.rs:80-87`).
- H8 (step 2c): implement the answer to OQ-1. Until it is answered, the leaf keeps today's once-per-process hash (`native.mjs:49-53` moved as is) and the door is lazy, so a process that never judges pays nothing.
- Cross-process verification criteria, whatever OQ-1 decides: fail closed on digest mismatch; any change of dev, ino, size, mtime or ctime of the `.node` invalidates; nothing is trusted across a different `artifactDigest`.

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
- `scripts/build-rust-distribution.mjs` (`--npm-descriptor`), `package.json` (`files`).
- `test/process/process-facts-vectors.test.mjs`: the 27-vector loop (:66-70) and the seven `resolveHolderLiveness` cases (:72-125) and the zombie case (:135-157) are replaced by: one wiring case "the door judges one live and one unknown vector as the table says" (owner of the table stays `packages/process/rust/tests/judge_vectors.rs:73-104`); the kept case "a record without a pid is held, never dead" (:72, the owning proof of policy P1); one new wiring case "signalByIdentity refuses a reused pid with identity-mismatch and sends nothing" (Rust owner `signal_identity.rs:44-57`); `localObserver` case (:127) becomes "selfRecord names this host, boot and namespace". The `isAlive` parameter cases (:95, :103, :121) are retired as behaviour removed.
- `test/runner/run-lock-identity.test.mjs`: retire `:36-74` (self-consistency and six verdict/policy cases; verdicts owned by `judge_vectors.rs`, policy by `process-facts-vectors.test.mjs:72`); keep `:76-110` (three `acquireRunControl` cases); its import at `:17` moves to `selfRecord`.
- `test/setup/holder-lock-checks.test.mjs:33`, `test/setup/lock-record-checks.test.mjs:11`, `test/setup/run-supervisor-checks.test.mjs:28`, `test/runner/provider-capacity.test.mjs:29`, `test/cli/fgos-lock-fence.test.mjs:214`, `test/run-supervisor/legacy-sweep.test.mjs:12`: replace `getBootId/getPidNs/getProcessStartTime` with `selfRecord()` fields (same values on Linux).
- `src/setup/holder-lock-checks.mjs:26` and `src/run-supervisor/legacy-sweep.mjs:11` import `judge` unchanged; verify they pass no `observe` option (`rg -n "judge\(" src/setup/holder-lock-checks.mjs src/run-supervisor/legacy-sweep.mjs`), else drop it.
- `packages/git/contracts/mutation-census.v1.json` (regenerated).
- `CHANGELOG.md` `[Unreleased]`: the npm channel ships the addon descriptor; `process-identity` judges through the Rust crate.

**Delete**
- `test/runner/process-identity.test.mjs` (80 lines, whole file): `:31, :36, :47, :52, :57, :66, :71` are verdict duplicates owned by `judge_vectors.rs`; `:42` ("isAlive=false short-circuits") is behaviour removed with the parameter; `:76` ("no pid → held") is owned by `process-facts-vectors.test.mjs:72`.
- In `process-identity.mjs`: `getBootId`, `getProcessStartTime`, `getPidNs`, `pidExists`, `localObserver`, `observeProcess`, `parseProcStat`, the Node `judge` body (:27-147).

**Tests to retire** (each names its owner): listed above under `process-facts-vectors`, `run-lock-identity`, `process-identity.test.mjs`.

## Steps

1. **2a, Rust.** Add the three modules and deps; `versions()` once-computed; `cargo build -p fgos-node-addon`; `cargo test -p fgos-node-addon` (add one in-crate test per namespace only if no Node wiring case covers it; the wiring cases below do).
2. **2a, Node.** Create `src/native/door.mjs` by moving `native.mjs:27-63` and generalising the `versions()` check to the five fields; `nativeDoor()` memoises the own-release addon (`releasePayloadManifest(process.env.FGOS_HOST_BIN)` then `native-addon.json`), loaded on first call. Rewrite `native.mjs` as the wrapper. Rewrite `process-identity.mjs`. Run `node scripts/run-tests.mjs test/git/native-load.test.mjs test/process/process-facts-vectors.test.mjs test/runner/run-lock-identity.test.mjs test/runner/dispatch-reconciliation-import-graph.test.mjs test/architecture.test.mjs`.
3. **2a, guards.** Commit the import-graph and manifest edits separately with the reason in the message ("the door loads the addon through node:module; the leaf and payload-root join the reconcile closure").
4. **2b, npm descriptor.** Add `--npm-descriptor`, the `files` entries, and a `native-load.test.mjs:102` extension that builds the descriptor into a temp payload root and loads the three namespaces through it. Message Packaging/T9 and GIT on the board before merge.
5. **2c, H8.** OQ-1 answered (a) by the owner 16:20 ("đúng một trường tùy chọn trong activation.json"): add the optional field writer in `packages/distribution/rust/src/init.rs` (`publish_activation_file`, :518-530; field `nativeAddonIdentity: {artifactDigest, dev, ino, size, mtimeNs, ctimeNs}`), its reader in the leaf via `hostBinFromActivation`'s path (`src/util/host-bin-path.mjs:41`), and the trust rule; prove with one `native-load.test.mjs` case "a recorded identity skips the hash; a changed ctime hashes again; a changed digest refuses". On (b) or (c): implement as answered. Record the decision in the process spec (phase 6).
6. Regenerate the census; run the focused tests, then `npm test` once in the worktree; write the lead report with Δ-lines.

## Verification (exact)

- `cargo build --locked -p fgos-node-addon && cargo test -p fgos-node-addon`
- `node scripts/run-tests.mjs test/git/native-load.test.mjs`
- `node scripts/run-tests.mjs test/process/process-facts-vectors.test.mjs test/runner/run-lock-identity.test.mjs`
- `node scripts/run-tests.mjs test/runner/dispatch-reconciliation-import-graph.test.mjs test/architecture.test.mjs`
- `node scripts/git-one-door-scan.mjs --write-census && git diff --stat packages/git/contracts/mutation-census.v1.json`
- Budget check: `wc -l src/runner/dispatch/process-identity.mjs` ≤ 60; `rg -c "^export" src/runner/dispatch/process-identity.mjs` = 6; `rg -n "/proc/|process\.kill" src/runner/dispatch/process-identity.mjs src/native/door.mjs` → nothing.
- Cost check (recorded for phase 8): warm `judge` p95 ≤ 25 µs, `selfRecord` ≤ 5 µs after the first call, `signalByIdentity` ≤ 100 µs, first load ≤ 1 ms excluding verification (speed seat Q1 table).

## Net size

Node: leaf +90, `native.mjs` −45, `process-identity.mjs` −98, script +25, `package.json` +2 → ≈ −30. Rust: +160 (addon modules, `versions()`, deps). Tests: `process-identity.test.mjs` −80, `process-facts-vectors` −95, `run-lock-identity` −40, `native-load` +25, guards +4, wiring +6 → ≈ −180.

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

The door loads on the activated-release, dev-host and test channels (proven by `native-load.test.mjs`), the npm descriptor is produced by the script and loads in a temp payload root, `process-identity.mjs` is within budget with six exports, the guards are edited deliberately, retired tests name their owners, 2c is implemented or recorded as blocked on OQ-1 with the chosen behaviour (c) in place.

## Lead brief essentials

Delete list: `process-identity.mjs:27-147`, `test/runner/process-identity.test.mjs`, the verdict cases named above. Find the owning test before writing a new one (`judge_vectors.rs`, `signal_identity.rs`, `native-load.test.mjs`). Δ-lines per language in the report. Report only what you saw yourself. The leaf never imports `native-handover.mjs`, `holder-lock/*` or `state/*`. Report name from `fgos convention name --json` under `plans/reports/`. Tell GIT/ES and Packaging on the board before merge.
