# Phase lead report: HARDEN T0 phase 2, the door

Branch `harden/t0-p02-door` (base `23f5263b8`). Two commits: `812468ce0` guards, `8339c7259` the door. Not pushed, not merged.

## What changed per step

- **2a Rust.** New `packages/git/node-addon/src/{process,durable_file,canonical_json}.rs`, three `#[napi(namespace = ...)]` groups (`addon.process.{judge,observe,selfRecord,signalByIdentity,scan}`, `addon.durableFile.{replaceDurably,installOnce}`, `addon.canonicalJson.canonicalJson`). Direct deps added to `Cargo.toml` (`Cargo.lock` +3). `versions()` is computed once in a `OnceLock` and now reports `process` (1, from the judge vectors file), `durableFile` (crate version) and `canonicalJson` (1). `judge` and `signalByIdentity` take an optional record: a missing record is `unknown` / `identity-unknown`, never a throw (callers pass `undefined` today). The record-to-tuple rule for the signal is the judge table's missing-field rule; the driver re-judges under the pidfd (no second judge in the addon, it would be a redundant copy).
- **2a Node.** New `src/native/door.mjs` (89 lines): the loader moved out of `src/git/native.mjs` and generalised to the five-field `versions()` check. `src/git/native.mjs` is now the Git wrapper (handover registration, `nativeError`, `withNativeLocks`, re-exported `nativeHelperExe`). `src/runner/dispatch/process-identity.mjs` is the thin client: six door exports plus the legacy forwarders (`getBootId`, `getProcessStartTime`, `getPidNs`, `pidExists`, `localObserver`, `observeProcess`); 35 lines, no `/proc`, no `process.kill`. The client maps `git-addon-unavailable` / `git-addon-not-shipped` to `process-door-unavailable: <cause>` / `process-door-not-shipped: onboard this project with fgctl init`.
- **2a guards** (own commit `812468ce0`): `ALLOWED_BUILTINS` + `module`; `EXPECTED_CLOSURE` + `src/native/door.mjs`, `src/run-supervisor/payload-root.mjs`; manifest row `src/native/door.mjs: infra`.
- **2b.** No npm route. The door refuses by name on the npm channel; one case in `native-load.test.mjs` proves it (and proves the door does not load another payload's release).
- **2c.** Not implemented, as OQ-3 (c) says. Per-process verification moved as is, key now `artifactDigest:digest:dev:ino:size:mtimeNs:ctimeNs`, symlinked addon refused, loaded lazily. No `activation.json` field, no `init.rs` edit.
- `scripts/run-tests.mjs` `buildTestEnv` calls `ensureGitAddon` after `ensureHostBin`. CHANGELOG `[Unreleased]` one line. Census regenerated in the same commit as the hashed-file edits.

## GIT conditions and their proof

1. Same payload rule on both host lookups: `ownRelease()` in the leaf covers `FGOS_HOST_BIN` and the cwd activation alike. Proof: `native-load.test.mjs` "staged release and npm-relative manifests ..." now runs the door in a copied payload while `FGOS_HOST_BIN` names the staged checkout's host (another payload); it loads the payload's own descriptor, and after the descriptor is removed it refuses `process-door-not-shipped` instead of loading the other release.
2. One addon, one memo: "the door and Git share one addon, one helper and one memo; a different file is refused by name before it is required" (same descriptor gives the same object through door and Git; a file that is not even an addon gets `git-addon-second-load`, which only a refusal before `require` can give).
3. Door first, Git still sees its facts: "Git sees its helper and handover when the door loaded the addon first" (child process; same object, `nativeHelperExe` equal). `helperExes` lives in the leaf; handover is registered by Git's `loadNativeAddon` / `withNativeLocks`.
4. `versions()` fail-closed: same text `combined addon ABI mismatch`; the existing resolver-refusal case still passes; ctime, digest key and symlink refusal in the "door refuses a symlinked addon ..." case.
5. Census and one-door: `node scripts/git-one-door-scan.mjs --write-census` (0 undeclared, census diff +22/-18, committed); doctor `git-mutation-one-door` passed via `npm run fgos:dev -- doctor --json` ("no Git writer outside the fgos-git driver (944 files scanned...)"); `node scripts/git-addon.mjs` exit 0; `node scripts/git/e3-bench.mjs --help` printed usage. `e3-bench.mjs load-probe` with a hand-made descriptor got through addon load and reached `GitPublication` construction (the helper was passed) but failed on my hand-made repo fixture (`git-fence-missing`), so no full row ran.

## Retired tests and their new owners

- `test/runner/process-identity.test.mjs` (deleted): verdicts -> `packages/process/rust/tests/judge_vectors.rs`; the `isAlive=false` case: behaviour removed with the parameter; "no pid -> held" -> `process-facts-vectors.test.mjs`.
- `process-facts-vectors.test.mjs`: the 27-vector loop -> `judge_vectors.rs` (one wiring case kept); the vector-file meta test ("every rule has a vector", not named in the phase) -> `judge_vectors.rs` `every_rule_in_the_table_is_pinned_by_at_least_one_vector`; seven `resolveHolderLiveness` cases -> `judge_vectors.rs` plus the kept no-pid policy case; `isAlive` cases -> behaviour removed; real-zombie case -> `signal_identity.rs` `a_zombie_gate_counts_as_an_empty_domain`; `localObserver` case -> "selfRecord names ..."; added wiring case for `signalByIdentity` (Rust owner `signal_identity.rs:44-57`).
- `run-lock-identity.test.mjs`: the self-consistency case and six verdict/policy cases retired (owners as above); the three `acquireRunControl` cases kept, import moved to `selfRecord`.

## Δ lines against base (`git diff --numstat 23f5263b8 HEAD`)

- Node (src + scripts): +130 / -214 = -84 (door +89, native.mjs -51, process-identity -123, run-tests +2, hot-lock 0).
- Rust (node-addon src): +239 / -10 = +229 (process.rs 161 after rustfmt, durable_file.rs 46, canonical_json.rs 11, lib.rs +11); `Cargo.toml` +3.
- Tests: +96 / -275 = -179.

## Commands I ran and what I saw

- `cargo build --locked -p fgos-node-addon`: first failed (`Cargo.lock` needed update), then `cargo build --offline` updated it; later `--locked` builds finished clean. `cargo test -p fgos-node-addon`: 0 tests (Node-API symbol noise on stderr), no warnings after making the modules `pub mod`; `cargo clippy -p fgos-node-addon` finished.
- `/tmp/fgos-work/p02-run.sh` (stage addon, `node --test`): `test/git/native-load.test.mjs` 13 pass, 1 skip (Windows); `test/process/process-facts-vectors.test.mjs`, `test/runner/run-lock-identity.test.mjs`, `test/runner/dispatch-reconciliation-import-graph.test.mjs`, `test/architecture.test.mjs` all pass; `test/git/one-door.test.mjs`, `e3-census`, `architecture` and import-graph again after the final edits: 62 pass, 0 fail.
- Importer set (hot-lock-host-judge, hot-lock-multiprocess, holder-lock-checks, fgos-lock-fence, legacy-sweep, lock-record-checks, run-supervisor-checks, custody-successor-admission, provider-capacity, cancel-registry, direct-cutover): 140 pass, 1 fail at first (below), 1 skip; after the fix hot-lock-host-judge passes.
- Wider: `test/distribution/*`, git one-door/e3-census/lock-handover/refs/inspect/write-scope-parity, setup/git-checks, event-store/facade: 69 pass. `test/state/hot-lock*`, `test/runner/run-lock*`, gateway-control, session, `test/holder-lock/*`: all pass except `test/holder-lock/fences-rust-locks.test.mjs` (4 fail: `fgctl binary must exist at .../release/fgctl`, a release build I did not make; unrelated to this change, not re-run on base).
- `buildTestEnv(process.env)` with no `FGOS_*` host variables inherited, `process-facts-vectors` through `runSelectedTests`: 4 pass, status 0.
- `rg -n "/proc/|process\.kill" src/runner/dispatch/process-identity.mjs src/native/door.mjs`: no match.
- Cost (debug addon, one run): first load 63.8 ms of which 60.1 ms is the sha256 of the 87 MB debug addon, `require` 1.0 ms, first `versions()` 0.4 ms; warm p95 over 2000 calls: judge 13.0 us, selfRecord 1.8 us, signalByIdentity (mismatch) 18.1 us, observe 11.6 us.

## Deviations and findings

- `nativeHelperExe` is a sixth export of the leaf (plan budget said five): condition 3 needs the helper map set inside the leaf, and Git's wrapper re-exports it. Leaf is 89 lines.
- `src/state/hot-lock.mjs` (phase 3's file): one line moved, `observeViaHost` now calls `pidExists` inside its `try`. Without it, the door refusing (unrunnable `FGOS_HOST_BIN`) made `observeViaHost` throw and broke `hot-lock-host-judge.test.mjs` "a host that cannot be run leaves a live pid unjudged"; the result is the same `unreadable` answer.
- `hot-lock.mjs` `judgeHotRecord(..., {observe})` still passes a custom observer to the forwarder `judge`, which now ignores it (Linux behaviour unchanged since `hotObserver` returns `observeProcess` there; the win32 simulation tests still pass because the real children judge the same). Phase 3 removes that path.
- The `scan` view also carries `env` (the filter's `envKeys` subset) so the filter option is not dead; not in the phase's list of fields.
- `canonicalJson`: an `undefined` inside an array is refused by name (N-API cannot represent it), an `undefined` object member is absent.

## Not done

- Full `npm test` and `cargo test --workspace` (the big lead runs them); no test of `fences-rust-locks` (needs a release build).
- Warm-cost check for release builds (debug numbers only); phase 8 should record release numbers.
- Board line for GIT/ES and Packaging (SEAT touches `docs/architecture-manifest.json`: one added row) and hand-offs H8/H13/H14 not posted; plan status/board not edited.
- `e3-bench.mjs` full row not run (see condition 5).

## Follow-up: two regressions found by the full `npm test` (fixed in a third code commit)

Cargo targets for this follow-up are on ext4 (`/home/vantt/projects/forgent-worktrees/harden-t0-p02-target`); the earlier `/tmp` target of this branch was deleted.

1. **`run-test-canary.test.mjs` wrapper overhead (14 446 ms median).** Root cause: my `buildTestEnv` change ran `ensureGitAddon` (cargo build twice, hash and byte-compare of the 87 MB addon, source-digest walk) on every call, and the canary test calls it per injected run. Fix in `scripts/run-tests.mjs`: `stageDoorManifest` stages once per process, and not at all when the caller's env already names this checkout's staged manifest (the way `ensureHostBin` returns early when `FGOS_HOST_BIN` runs). Seen: the case passes with the staged env (1484 ms for 10 runs) and with no `FGOS_*` host variables (1992 ms), `run-tests.test.mjs` and `test-select-coverage-map.test.mjs` still pass. The test was right.
2. **`test-select-mutate.test.mjs` `relatedRuns 1 !== 2`.** Root cause, reproduced by running `test/direct/fgos-edit.test.mjs` in a detached worktree of HEAD: `process-door-not-shipped`. The door (GIT condition 1) refuses a release whose payload is another checkout, and `runRelatedCaptured` passed `buildTestEnv()` of the main checkout to tests running in the throwaway worktree. The store's hot lock now needs the door, so the baseline run was red and classified `infra-error`. Fix in `scripts/test-select-mutate.mjs`: `runRelatedCaptured` stages the checkout's own release (`ensureGitAddon(env, cwd)`, Cargo target defaulting to the main checkout's), and `unlinkSharedDirs` removes that staged directory and the empty `.fgos` directories before the guarded removal (without that the removal refused with `worktree-ignored-bytes-preserved`). The test was right; the door's refusal is the intended behaviour. Seen: `test-select-mutate.test.mjs` 29 pass.
   - The `worktree-cwd-unreadable pid=... comm="systemd"` lines are not from the door: they are printed by the Git driver's Rust worktree code (`packages/git/rust/src/worktree.rs`, tested in `test/git/worktree.test.mjs`) when a worktree is removed, and are not produced by `scan`. They accompany the git worktree create/remove that this test performs; I did not run the base to compare, so I cannot say whether the base prints them too.
