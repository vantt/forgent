# Review: Git plan phase 01, Lane B (steps 7-11)

- Branch: `git/p01b-addon-release`, reviewed in the detached worktree `git-p01b-review`
- Range: `58a7b6f3b..d1d4ec7ee` (5 commits, 62 files, +2752/-69)
- Mode: read-only. I read every changed file against the phase-01 file, plan
  decisions D2-D7/D11, Git spec §4/§10/§12, holder-lock §7/§12, the
  packaging contracts and the AGENTS.md install/setup/doctor gate.
- Not run: the cargo and addon suites (they need a full workspace build in this
  worktree). Every finding below comes from reading the code, with the failing
  path traced by hand.

## Verdict

Two High findings block the merge. RepositoryConfig wedges permanently on an
ordinary transient failure. Every new release can no longer be activated on
windows-x64. The Medium findings should be fixed before landing step 14,
because they concern rollback and upgrade safety and doctor noise for
existing users. The rest of the lane matches the spec well: atomic fence,
one combined load, hot-gate refusal, additive manifest, `--locked` CI.

## Critical

None.

## High

### H1. A RepositoryConfig failure after `wal.begin` wedges the WAL with no recovery, and can leave `.git/config.lock` behind

`packages/git/rust/src/repository_config.rs:154-218`

- **What happens.** Record 0 (Intent) is installed at :154. Each later early
  return leaves a chain that never gets an outcome:
  - `create_new` on `config.lock` at :169 fails with `EEXIST` whenever a user
    `git config` or `git remote` is running at that moment;
  - `git config --file` fails at :184;
  - `config-change-stale` at :194 (the user edited `.git/config` between the
    snapshot and the attempt);
  - read-back fails at :218.

  Nothing implements recovery for `OperationKind::ConfigChange`: `rg
  ConfigChange packages/git/rust/src` finds no recover arm.
- **Consequences:**
  1. Every later `ensure_fetch_mapping` refuses with
     `config-change-recovery-required` (:110, :119).
  2. `scan.unresolved > 0`, so the `git-operation-journal` doctor check stays
     red forever.
  3. C5 refuses rollback to any release without `git-wal-v1` with
     `git-wal-pending` (`git_gate.rs:35`). A config-mapping hiccup blocks
     rollback.
  4. The paths at :184, :194 and :218 also leave the fgOS-created
     `config.lock` in place. Every later `git config`, `git remote add` or
     `git fetch` that writes config in the user's repository then fails
     with "could not lock config file". That breaks "preserve user config"
     (spec §3, §4).
- **Fix.**
  - Before TargetAttempt: remove the staging `config.lock`, but only after
    checking that it is our own file (dev and ino recorded at create), then
    append `Outcome::AbandonedBeforeAttempt`. Do this for every error
    return, for example with a scope guard.
  - `EEXIST` at :169 should become a typed, retryable `repo-config-busy`
    that is returned before `wal.begin`. Take the native lock first, then
    begin.
  - After TargetAttempt: add a ConfigChange recovery arm. If the live config
    contains every refspec of the intent, record `effectObservedOnly`;
    otherwise record `uncertain` and resolve the chain. Never leave it
    pending.
  - Add tests: native `config.lock` held, config edited mid-operation, and a
    staging failure. Each must leave a resolved chain and no `config.lock`.

### H2. windows-x64 releases claim `git-wal-v1`, but C5 and fence placement exist only on Linux, so no new release can be activated on Windows

`scripts/build-rust-distribution.mjs:428`, `packages/distribution/rust/src/git_gate.rs:47-63,132-135`, `packages/holder-lock/rust/src/tombstone.rs:82`

- **What happens.**
  - The release script adds `capabilities: ["git-wal-v1"]` unconditionally.
    `release-assets.yml` builds windows-x64 with this script.
  - In `admit`, `has_wal(manifest)` always runs `predecessor_scan`. On
    non-Linux, `fgctl internal quiesce-scan` returns `result: "unavailable"`
    (`holder-lock/rust/src/route.rs:569`), so activation is refused with
    `git-predecessor-writer-live: process scan unavailable or incomplete`.
  - Even past that point, `replace_held_file` returns a generic `io`
    `Unsupported`.
  - Windows is a supported activation platform today (CHANGELOG:20, where the
    "`fgctl` activation gate runs on Windows"; D11 names windows-x64 as a
    release target). So `fgctl init` and `fgctl upgrade` to any release built
    from this branch fail on Windows, under a misleading code. That breaks
    "fences never block a correct upgrade" and "refuse by name where
    unimplemented".
- **Fix.** Pick one:
  - (a) Emit `git-wal-v1` only for targets where the WAL, the fence and the
    quiesce scan exist (linux-x64 today). Gate the capability through
    `src/util/release-targets.mjs`, the one target table. `admit` then
    treats a Windows candidate as a non-WAL candidate.
  - (b) Keep the capability, but have `admit` refuse up front with a named
    `git-wal-unsupported-platform` and record an owner decision that phase 01
    deliberately stops Windows activation.

  Option (a) matches D1 ("ports land dormant") and D11 ("Windows required
  from the phase 07 release").

## Medium

### M1. Crate checksums are compared with the verifier's own compiled `Cargo.lock` at every trusted manifest read, which turns any future napi bump into an upgrade and rollback block

`packages/distribution/rust/src/manifest.rs:110-113,130,299-319`

- **What happens.**
  - `validate_v1_invariants` runs `validate_native_addon_invariant`, which
    requires `addon.crate_checksums == native_addon_crate_checksums()`. That
    value is the `include_str!` of the verifier's own build-time
    `Cargo.lock`.
  - Suppose napi is bumped in release N+1. The fgctl from release N (built
    with the old lock) rejects N+1's manifest: upgrade blocked.
  - The fgctl from N+1 rejects every older addon-carrying release: rollback
    blocked.
  - Any host binary reading a manifest built from a different lockfile also
    rejects it.
  - The release-manifest contract says checksums "attest declared build
    inputs". The attestation belongs to the build, not to a later
    verifier's lockfile.
- **Fix.**
  - Check checksum equality against `Cargo.lock` at staging and in CI, where
    `nativeAddonComponent` already reads it.
  - In the verifier, check only the shape: exactly the three crate names,
    `name@semver` keys, 64-hex values.
  - If cross-version binding is wanted, compare against an additive
    allowlist of accepted toolchain checksums, never against exactly one.

### M2. Nothing enforces the fence except a new-fgctl activation that changes the digest

`packages/distribution/rust/src/init.rs:785,827,1349`; `git_gate.rs:132-140`

- **What happens.**
  - An old fgctl can activate a `git-wal-v1` release: it ignores the unknown
    `capabilities` field and takes the old `activation.lock`. No fence gets
    placed.
  - The idempotent re-run paths of `init` and `upgrade` (same digest already
    active) take the guard and run `run_tail` without `publish_and_tail`. So
    running the new fgctl again later never places the fence either.
  - Nothing in the WAL-writing runtime (`Wal::open`, the `GitPublication`
    constructor, `initialize_git_wal`) checks for the fence.
  - Landing step 14 depends on "every listed workspace reports the fence".
    Today only doctor detects it, and the doctor fix refuses to act.
- **Fix.**
  - Call `git_gate::admit` (or at least `fence_legacy` when the active
    manifest has `git-wal-v1`) in the idempotent paths.
  - Add a cheap runtime refusal, `git-fence-missing`, in the first WAL-open
    door when the workspace's `.fgos/locks/activation.lock` is not the
    `fgos git` tombstone. It is one `is_tombstone` call, and it closes the
    old-fgctl-activated case before any WAL record exists.

### M3. Doctor turns red on channels that never run fgctl, with no fix

`src/setup/holder-lock-checks.mjs:582-584`; `src/setup/git-checks.mjs:12-29`; `package.json` `files`

- **What happens.**
  - `lock-fences`: `tombstoneState` returns `absent` for a missing
    `.fgos/locks/activation.lock`, which counts as not fenced. So the npm
    global channel and `node bin/fgos.mjs` checkouts now fail with
    `git-fence-missing`, and the fix declines ("only the new fgctl may
    place").
  - The six `git-*` rows all go through `loadNativeAddon`, and nothing writes
    the npm `native-addon.json`. D4 / req 15 says "npm package ships prebuilt
    addons, digest-checked", but `package.json` `files` has no `.node` and no
    `native-addon.json`, and no packaging step produces one. So every row
    fails with `git-addon-unavailable` on that channel.
  - In this phase the addon is optional (release-manifest §8, M10 later).
    Red rows that cannot be fixed are friction for existing users. AGENTS.md
    gate: "never hardcode an assumption about which install level is active".
- **Fix.**
  - Report `absent` + no WAL + no fgctl activation as passing (nothing to
    fence).
  - Either ship the npm prebuilt addon as D4 requires, or have the git rows
    report `info: addon not shipped on this channel until M10` when no
    descriptor exists. Keep red for a descriptor that is present but wrong.

### M4. New behaviour lacks tests (L5 Q5)

There are no tests for:

- `admit` through `publish_and_tail`: a pending WAL with a non-WAL candidate
  is refused; a live predecessor payload is refused; an unavailable scan is
  refused; the first WAL activation places the fence and a rollback keeps it;
- the idempotent paths;
- RepositoryConfig failure paths (H1);
- the Windows refusal (H2).

`git_gate.rs` has only a `check_wal` unit test, and
`activation_lock_multiprocess.rs:189` tests the tombstone primitive directly.

### M5. The "one ABI row" does not check contract versions; `versions()` reports the addon's own package version for both crates

`packages/git/node-addon/src/lib.rs:17-21`; `src/setup/git-checks.mjs:17`

- **What happens.** `"git"` and `"eventStore"` are both
  `env!("CARGO_PKG_VERSION")` of `fgos-node-addon`, so they cannot differ.
  `git-component-compatible` checks only `napi === 8` and the floor. D3 lists
  "contract versions" (and single load, digest, target) as evidence of this
  row. Digest, target and single load are implied by a successful load.
  Contract versions are not checked at all.
- **Fix.** Have each crate export its contract versions (Git port, receipt
  and WAL record versions; Event Store contract version). Return them from
  `versions()`, and compare them in the row with what the manifest or the
  facade expects.

## Low

1. **CHANGELOG contradicts itself** (`CHANGELOG.md:13`). The line says the
   "Node binding and doctor/setup integration are still pending", while the
   line above says both are registered. Req 23 also asks for entries on the
   addon and the manifest key, and on an older fgctl now stopping with
   `EISDIR`. Neither appears.
2. **`activation-binding.md:118` overstates who runs C5.** It says
   `publish_and_tail` is "shared by init, upgrade and repair/rollback".
   Repair and the idempotent paths do not call it (see M2).
3. **Git spec still says no RepositoryConfig row exists.** The §5 lock table
   row at `docs/platform/git/spec.md:198` and open item 3 in §18 (:634) say
   so. The holder-lock spec was updated; these two were not.
4. **`payload-root.mjs:18` comment no longer matches the code.** It still
   says the locator never reads active-release variables. The new
   `releasePayloadManifest` reads `FGOS_ACTIVE_MANIFEST_PATH`. This is
   correctly limited to dev manifests with `legacyNode.root === '.'` whose
   `entries.fgos` resolves to this payload, but the comment should say so.
5. **macOS marker bypasses the shared state-root resolution**
   (`single_load.rs:94`). It reads `FGOS_STATE_ROOT` directly instead of
   using holder-lock `state_root` (design principle 1). The refusal is named,
   which is acceptable for a platform that is not a target.
6. **DRY:**
   - the library name and addon record are duplicated in
     `scripts/run-tests.mjs` `ensureGitAddon` instead of reusing
     `nativeAddonLibraryName` / `nativeAddonComponent`;
   - the old activation path is hard-coded in `init.rs`, `git_gate.rs:131`
     and `fences.mjs:216` instead of read from the registry's `v1Path`;
   - the repo-config lock path is hard-coded in `repository_config.rs:79`;
   - the kill wait `2000` is a literal instead of `DEFAULT_KILL_WAIT_MS`.
7. **Doctor cost and precision:**
   - each of the six rows loads the addon and runs `inspectGit` again, which
     re-runs the Git floor probes (git spawns) six times per doctor run;
   - descriptions are just the id (`registrations.mjs:6629`);
   - `inspect_git` hardcodes the remote `origin` (`git.rs:194`);
   - native-lock detection looks only in the common dir (`index.lock` is per
     worktree) and uses `exists()`, which follows symlinks.
8. **`RepositoryConfig` error codes are untyped.** Every refusal maps to
   `ResultCode::RecoveryRequired`, retryable false
   (`repository_config.rs:10`), so invalid input and a busy lock both look
   like recovery-required to callers.
9. **`GitPublication::new` blocks Node and ignores its helper**
   (`git.rs:52-58`).
   - It acquires `event-seal` itself, with up to a 5 s blocking wait on the
     Node main thread, instead of borrowing the caller's held seal (D5's
     External handover is phase 02). A caller that already holds the seal
     in-process waits 5 s and then gets `publication-borrow-unavailable`.
   - `_helper` is stored but never used.
   - The port is dormant now; note this for phase 02.
10. **Predecessor-writer proof is a heuristic** (`git_gate.rs:86-100`): the
    nearest ancestor `manifest.json` of any absolute argv entry decides. It
    fails closed, but it falsely refuses:
    - a `fgos-gateway` built under a checkout's `target/release`;
    - relative-path `node bin/fgos.mjs` invocations;
    - any activation started from inside a PID-namespace sandbox.

    The refusal message should name the pid and argv so the operator knows
    what to stop.
11. **`admit` builds a `GitDriver` for every activation** (`git_gate.rs:117`).
    That includes non-git workspaces and non-WAL candidates. A missing `git`
    on PATH, or an untrusted state root, then refuses activation as
    `git-wal-unreadable`, and the call creates `git-empty-hooks` as a side
    effect. Only resolve the repository when `<workspace>/.git` exists.
12. **`cargo-deny.toml:4` keeps the ignore reason in a TOML comment.** Use
    `{ id = "RUSTSEC-2024-0449", reason = "..." }` so the reason shows in
    the audit output.
13. **CI cost and coverage:**
    - `ci.yml` now calls the full `release-assets.yml` matrix, so every CI
      run does two Windows and two Linux release builds;
    - `compare-addon` compares the two raw build outputs, not the staged
      `libexec/native/fgos.node` against the manifest digest.

    Acceptable, but worth a note on the board.
14. **`run-tests.mjs` now always sets `FGOS_HOST_BIN` to the dev-built host**
    (:512), even when an activated host resolves. The suite therefore always
    exercises the working tree's host. This seems intended for the addon
    manifest tie. It is not product code and adds no env switch.

## Checked and conforming

- **Addon-less payload digests are unchanged.** `capabilities` and
  `components.nativeAddon` are `skip_serializing_if` empty or none,
  `historical_release_without_addon_still_verifies` covers it, and every
  `ComponentsInfo` constructor was updated.
- **Dual load fails closed.**
  - Linux uses an abstract `CLOEXEC` socket keyed by pid and start time; a
    second physical copy throws `git-addon-second-load` at load (test
    `native-load.test.mjs:24`).
  - A worker thread shares the static; a child process registers its own
    marker.
  - The helper path comes from the manifest `entries.fgos`, never
    `current_exe`.
- **No spawn inside the hot gate.** Every facade method and `close` call
  `outsideGate()`. Event Store append and read run under the hot section
  without a child (test :45-55). There is no exec-guard exception.
- **Old fgctl is stopped on Linux.**
  - The new door takes `activation-v2.lock` and then the old lock, and fails
    if the old lock is held.
  - `renameat2(RENAME_EXCHANGE)` swaps the held file for a prepared
    `TOMBSTONE` directory, with fsyncs, so an old door sees the held inode
    or `EISDIR` and never a gap.
  - Rollback keeps the fence, and the 4.4 installation-path fence stays.
  - Node `placeFences` skips the fgctl-managed path (test added).
- **RepositoryConfig success path preserves user config.**
  - The write is additive only, limited to the two allowed mirror refspecs
    (never a push refspec), from a byte snapshot.
  - File permissions are copied, the native `config.lock` excludes
    concurrent Git writers, a raw edit is detected, and the change is read
    back.
  - Provenance, including the effective URL, lives only in the WAL record
    (`fetch_mapping_provenance`).
  - The failure paths are H1.
- **Doctor and setup are registered per the AGENTS.md gate:** six
  read-only rows and two fixes, no config default, and the inventory in
  `setup-doctor-registry.md` is test-checked.
- **No test-only branch or env switch in product code.**
  `FGOS_ACTIVE_MANIFEST_PATH` already exists (exported by the host,
  `apps/fgos/src/legacy_exec.rs:103`). `run-tests.mjs` builds the addon as
  req 15 asks.
- **CI:**
  - `--locked` on every cargo build, test and clippy;
  - `cargo deny check advisories bans sources` with crates.io only;
  - one advisory ignore, with its reason;
  - an independent, cache-free addon build whose digest is compared per
    target;
  - deterministic `/Brepro` linking on Windows.
- **Registry rows match D6 and D7.** `repo-config` is a rank-80 mutex,
  owner `git`, fence none. `activation` has two `v1Path` entries; the
  schema accepts owner `git`.

Status: DONE_WITH_CONCERNS
Summary: Lane B mostly conforms (atomic fence, single load, hot gate, additive manifest, locked CI). Two High findings block the merge: RepositoryConfig wedges the WAL and can leave `.git/config.lock` behind on transient failures, and windows-x64 releases claim `git-wal-v1` but cannot pass Linux-only C5/fence admission. Five Medium findings cover cross-version checksum binding, unenforced fence placement, doctor red on the npm and dev channels, missing tests and the ABI row's version evidence.
