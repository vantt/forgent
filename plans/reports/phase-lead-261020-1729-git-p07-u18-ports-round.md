# Git phase 07, unit 18: ports round after the sub-lane merge

Worktree `git/p07-switch` at `8eafe949d` plus this working tree; nothing is staged or committed. The setup/hooks lane's files (`src/setup/*`, `.githooks/*`, `src/holder-lock/*`, `src/workflow/*`) were not edited. All six items are done.

## 1. Regression: `approve --no-wait` waited ~5 s

**Cause (traced with `strace -f -e execve`).** Before Land's prepare tried the merge slot, a no-wait approve opened about 30 Inspect ports. Each port:
- re-hashed the 84 MB addon (`loadNativeAddon`, about 60 ms);
- re-probed Git config (`var GIT_CONFIG_*`, `config --list`, `rev-parse --show-object-format`).

Unit 16's reader migrations multiplied these. The slot was tried only inside `port.prepare`, after `declareLandFiles`, `changedFiles` and the checkpoint precheck.

**Fixes:**
- Item 4 (below).
- `landRunnerItem` with `lockWaitMs === 0` now probes the destination's merge slot (`holder-lock` `probe`, a shared try closed at once) before any read, and refuses with the same `lock-held` MergeError. Land's own try is still the decision; the probe only refuses early.
- One `lockHeld` helper now builds that error for the probe, the prepare refusal and the publish refusal.

**Timing:** the refusal went from 4.7–5.6 s to 1.1–1.4 s. The test is unchanged. What remains is approve's own gate reads before Land.

## 2. Item 4: addon verification once per file identity

`src/git/native.mjs` keeps a per-process map from the file to `digest:dev:ino:size:mtimeNs`:
- The bytes are hashed on first load, and again on any stat change or a different manifest digest.
- Every other check (descriptor, path containment, target/napi, ABI) still runs on every call.

## 3. Item 5: the test launcher never stages an inherited host

- `ensureGitAddon` builds the host from the checkout (`ensureHostBin({ ...env, FGOS_HOST_BIN: '' })`).
- `gitAddonSourceDigest` now fingerprints every Cargo workspace member (parsed from `Cargo.toml`), which includes `apps/fgos` and `packages/distribution`.
- The helper's "staged host changed" comparison with the inherited `FGOS_HOST_BIN` is removed. That comparison forced a rebuild whenever a release host was exported.

`test/git/legacy-event-adapter` now passes in this session, which exports a release `FGOS_HOST_BIN`.

## 4. New Inspect operations (spec §3, dated unit-18 paragraph)

| Operation | Git | Consumer |
|---|---|---|
| `diff` / `diffText` sides: `before`+`after`, `before`+`index`, `before`+`worktree`, `index`+`worktree` (Rust `DiffSides`) | `diff [--cached] <commit>` / `diff` | test-select (staged, unstaged), test-proof-inventory |
| `diffText` `paths` (canonical literal, `--literal-pathspecs`) and `context` | `--unified=<n> -- <paths>` | test-proof-inventory |
| `status` `ignoreSubmodules: 'dirty'` (Rust `Submodules`) | `--ignore-submodules=dirty` | settlement `safeGitStatusFiles` |
| `commitTime(revision)` | `log -1 --format=%ct <oid> --` | claim-liveness |
| `countCommits(include, exclude?)` | `rev-list --count` | observe |
| `unmatchedCommitCount(upstream, head)` | `rev-list --count --cherry-pick --right-only --no-merges` | drift-status, cleanup-harness |
| `trackedPaths` (paged) | `ls-files -z --cached --full-name` | observe |
| `remoteUrl(remote)` | the existing redacted `remote_url` | promote-report |
| Rust `GitDriver::open_at(path)` | — | observe, `git_grant`, distribution (u16's needsWrite) |

- `diff`'s Rust signature now takes `DiffSides`, and `status` takes `Submodules`. Every caller was moved in the same change: land, refs, worktree, inspect, event-store `legacy_import`, the addon and the tests.
- **Reused, not added:** `mergeTree` (unit 14) for promote-preflight; `remote_url` (Publication trait); `prepare_directories` for state-root creation.
- **Decision (init/version):** `GitDriver::new` creates an absent state root through `prepare_directories`, the same preparation as the `git-driver-directories` fix (spec §10, dated paragraph). An existing root is only checked. `fgos version` (Node) and the Rust host show `oid[..12]`. There is no abbreviation operation.

## 5. Readers moved (census rows closed)

**Node, all raw reads deleted:**
- `src/cli/version.mjs`
- `src/runner/attestation-guard.mjs` (`resolveCommit` + `ancestry`; a failed ancestry read is still a mismatch)
- `src/state/cleanup-harness.mjs` (one lazily opened port threaded through the recursion)
- `src/state/tool-registry.mjs`
- `src/runner/claim-liveness.mjs`
- `src/runner/promote-preflight.mjs` (`mergeTree`; the detail names the conflicted paths)
- `src/state/drift-status.mjs`
- `src/runner/dispatch/settlement.mjs`

**Manifest:** these files moved to `infra` as approved: attestation-guard, tool-registry, cleanup-harness, cleanup-pool (it imports the harness), cli/version. `test/architecture.test.mjs` passes.

**Scripts:**
- `scripts/test-select.mjs`: the parsers `parseNameStatusZ`/`parsePathListZ` are deleted, and `exec` injection is removed from `collectChangedPaths`/`runSelected`/`runShadow`.
- `scripts/test-proof-inventory.mjs`: the `readPatch` seam defaults to Inspect.
- `scripts/test-select-promote-report.mjs`.

**Rust:**
- `packages/distribution/rust/src/{workspace,lib,git_grant}.rs`
- `packages/observe/rust/src/sources/repo.rs`, `metrics_cli/harness.rs`

**Deleted:** `findCheckoutPath` in `src/runner/worktree.mjs`, which had no caller (u16 needsWrite).

**Still open, with reasons:**
- `fgos-shell-integration.sh`: a shell function has no door.
- `scripts/lib/test-git-config-guard.mjs`: gate decision.
- `packages/herdr-fgos-common/rust/src/fgos.rs:348`: a census row owned by `herdr-dashboard` / `apps/fgos-gateway`, not this round.

## Changed assertions (behaviour still proven)

| File | Old | New | Why |
|---|---|---|---|
| `test/cli/fgos-version.test.mjs` | equals `rev-parse --short HEAD` | equals `rev-parse HEAD`.slice(0, 12) | owner decision (12 hex) |
| `test/runner/promote-preflight.test.mjs` | detail matches `/<<<<<<</` | detail matches `/conflicts in: seed\.txt$/` | `mergeTree` names conflicted paths; reason `merge-conflict` unchanged |
| `test/distribution/native-addon.test.mjs` (builder) | host supplied via inherited `FGOS_HOST_BIN`, staged bytes equal it | inherited `FGOS_HOST_BIN` set to a different file; fake cargo builds the host; staged bytes equal the cargo-built host | item 5 contract; every other assertion unchanged |
| `test/scripts/test-proof-inventory.test.mjs` (2) | `exec:` injection | `readPatch:` injection | same parser inputs and expectations |

## Retired tests

- `parseNameStatusZ` ×4 (M/A/D rows, rename, space/backslash, empty) are now proven by:
  - test-select's real-repo `collectChangedPaths` tests (committed/staged/unstaged/untracked, rename, delete);
  - the new "a staged rename yields both halves";
  - Rust `inspect_real_repositories_byte_paths_pages_and_optional_locks` for byte paths.
- `parsePathListZ` ×3 (untracked shape, node_modules/target exclusion, substring kept) are now proven by the new real-repo test "untracked node_modules/target worktree symlinks are not reported…".

## New tests

- **Rust:** `packages/git/rust/tests/inspect.rs` `inspect_checkout_diffs_counts_index_listing_and_an_absent_state_root`. It covers:
  - every diff side, with renames, and a tree refused as a checkout side;
  - `diffText` with paths and context 0, and a glob refused;
  - `status` IgnoreDirty against a dirty submodule;
  - `commitTime`, `countCommits`, and `unmatchedCommitCount` with a cherry-pick;
  - paged `trackedPaths` and `remoteUrl`;
  - an absent state root created at 0700 with hooks at 0500.
- **Node:**
  - test-select: two tests (above);
  - test-proof-inventory: "reads the work tree against the base commit for the scoped files only";
  - native-addon: "the staged addon digest covers every workspace member…".

## Verification

**Node** ran through a scratch wrapper. It sets umask 077, unsets `FGOS_HOST_BIN`, runs `ensureGitAddon`, sets `FGOS_STATE_ROOT`/`FGOS_TEST_FIXTURE_ROOT` under `/tmp/fgos-work/u18` (mode 700), then runs `node --test <files>`.

| Batch | Files | Result |
|---|---|---|
| A | architecture, cleanup-harness, cleanup-pool, tool-registry, cli version ×2, claim-liveness, promote-preflight, drift-status, merge-quoted-paths, scripts test-select / test-proof-inventory / promote-report | 258 tests. One failure, my own fixture expectation, fixed and rerun green. |
| B | `test/git/*`, direct merge-gate, merge-target-slot-multiprocess, attestation-guard, merge, merge-land, promote-engine, land-vs-manual-commit, assignment-runresult, claim-port, worktree, session, paths, postland-drift, cli fgos-merge / fgos-tool, scripts knowledge-migration / test-timing | 624 tests, 30 failures. All 30 are `EROFS` on `~/.local/state/fgos/attestations` in assignment-runresult, the environmental set u16 recorded on HEAD. Every `safeGitStatusFiles` test passes, including the submodule-dirt one. The no-wait tests pass in 1.1 s and 3.2 s, and legacy-event-adapter passes. |
| C | native-addon, worktree-create/remove, migrate-cutover-grant, setup checks, loop, decision-kind, retro-pool, test-select-mutate | 76 failures, broken down below. native-addon is now 6/6. |
| Final | architecture, hot-lock-known-exec-sites, test-select, test-proof-inventory, promote-preflight, attestation-guard, version ×2, cleanup-harness, worktree | 252/252 |

Batch C's failures:
- loop.test: confined-worker / bwrap, as in u14.
- The mutate integration test: read-only main `.git`, as in u17.
- The native-addon builder test before its update.
- `setup/checks` "leaf-notify-drift…": `git-fence-missing` from an unfenced `initRepo` fixture. It is not on a path this diff touches, and it is still an open row in u17's census.

**Rust:**
- Tests: `FGOS_STATE_ROOT=/tmp/fgos-work/u18/rstate cargo test --locked --no-fail-fast -p fgos-node-addon -p fgos-git -p fgos-event-store -p fgos-observe -p fgos-distribution -p fgos` gave 116 suites, 608 passed, 3 failed. All three are environmental:
  - `quiesce_scan_lists_a_process_working_in_the_workspace`: the route answers `unavailable` inside this PID namespace; `apps/` is untouched.
  - The two `workspace::tests` tests. Run in parallel, store.rs's test `remove_var("FGOS_STATE_ROOT")`s process-wide, so the driver falls back to this sandbox's read-only `~/.local/state/fgos`. Run alone with the pinned root (`cargo test -p fgos-distribution --lib workspace::`), they pass 4/4.
- Clippy: `cargo clippy --locked -p fgos-node-addon -p fgos-git -p fgos-event-store -p fgos-observe -p fgos-distribution -p fgos --all-targets -- -D warnings` is clean.

**Also:**
- `git diff --check` is clean.
- Impact analysis was not run (GitNexus not queried in this confined session). The cross-check was `rg` over every caller of `status`/`diff`/`diff_text`, `findCheckoutPath`, `parseNameStatusZ`/`parsePathListZ`, the `exec` seams and `NoParentDir`.
- Not run: full `npm test`, E3, lifecycle verbs.
- **Needs the outer host:** loop.test, the mutate integration test, the confined-worker suites, assignment-runresult's attestation writes, and the parallel distribution and quiesce Rust tests.

## Docs

- `docs/platform/git/spec.md`:
  - §3 Inspect row;
  - a unit-18 paragraph;
  - §10 driver state root;
  - §13 outer-scripts residue (two raw reads left).
- `CHANGELOG.md` `[Unreleased]` has three lines:
  - version shows 12 hex, and the state root is created when absent;
  - no-wait refuses at once;
  - u17's three lines: knowledge-migration, the nightly mutation run, distill.

## Ideas (owner choice, not done; RUL104)

**Per-port config re-probe.** Every Inspect port re-runs `resolve_repo` per call, which costs about five Git spawns: `var` ×2, `config --list` ×2, `rev-parse --show-object-format`.
- Problem: about 1 s of approve's remaining no-wait time is these probes.
- Benefit: a per-port cached `RepoHandle`, revalidated by the existing config-identity key, would cut every multi-read verb's latency.

Status: DONE_WITH_CONCERNS
Summary: The no-wait refusal now probes the merge slot before any read, and addon verification runs once per file identity (4.7–5.6 s → ~1.2 s). Inspect gained checkout-side diffs, diffText paths/context, submodule-dirt status, commit time/counts, the index listing and remoteUrl, and every reader row they unblock moved off raw Git (version shows 12 hex; the driver creates an absent state root).
Concerns/Blockers: Environmental failures need the outer host (EROFS attestations, bwrap/confined-worker loop and mutate tests, PID-namespace quiesce scan, parallel env race in the distribution tests). `setup/checks` leaf-notify-drift fails on a pre-existing unfenced fixture. herdr-fgos-common stays a census row for its own apps.
