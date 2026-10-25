# Test home isolation

## Seam chosen
`test/helpers/process-tmp-root.mjs`, which every test file imports first (595 files). It now also gives the process an empty home inside its temp root: `HOME` and `USERPROFILE` point at `<tmp root>/home`. The facade's default global directory is `os.homedir()/.fgos`, so every test that reads config through it sees an empty global directory unless it sets its own (`withHome`, an explicit `globalDir`, `writeGlobalConfig`). HOME is a real OS input; no production code, env switch or flag was added.

Why not the others: `withHome` covers one file; `buildTestEnv` only covers runner-spawned processes and runs `cargo` with that env (a fake HOME there breaks the toolchain), and a file run directly with `node --test` would stay exposed; `writeGlobalConfig` is a per-test writer. The process-level seam covers direct runs, the runner and every child that inherits env.

What the empty home keeps for tests that need the real machine:
- git identity: `GIT_CONFIG_GLOBAL` points at the real `~/.gitconfig` when it exists and the variable is unset.
- Rust toolchain: `CARGO_HOME` / `RUSTUP_HOME` point at the real ones when they exist (the first attempt without this broke 25 cargo-building tests).
- state root: `<home>/.local/state/fgos` is pre-created with mode 0700, because the git door refuses a group-writable state root and a missing one is created group-writable under umask 002.

## Files changed
- `test/helpers/process-tmp-root.mjs`: the seam above.
- `test/setup/blind-steps-proven-pools-check.test.mjs`: seeds the file-local bwrap registry with the existing `seedFileLocalBwrapRegistry` fixture. It used to pass only because the real `~/.fgos/confinement-backends.json` names bwrap; with any other home the blind pool resolved to nothing and the check said "not applicable". This is the intent the fixture's own comment states (a machine that never ran setup behaves like one that did). No assertion changed.

## Isolation proof
Fake HOME = `.fgos/runtime/tmp/fakehome` holding a global config with `gateway.token` (dummy) and no `private/` directory. The runner stages the Rust door with the process env, so `CARGO_HOME` / `RUSTUP_HOME` were set to the real ones for the runs below.
- 80 config/doctor/setup/cli test files, fake HOME, before the change: 210 failures. After: 4 (3 in blind-steps, fixed afterwards as above; 1 known red `node-version-and-git`).
- `checks-doctor-config` alone, fake HOME: 41 pass, 1 fail (the known red `node-version-and-git`).
- Final affected set (12 files: checks-doctor-config, blind-steps, dispatch-confinement-p05, native-addon, run-borrowed-git, run-tests, worktree-create/remove, config facade/config-door, checks, config-checks) with fake HOME and with the real HOME: identical, 213 pass; the only fail is the known red.
- Caveat: the real `~/.fgos` was migrated in part at 21:18 (`private/accounts.yaml`, `gateway-token` exist), so the real-HOME run alone no longer shows the gap; the fake-HOME run is the proof.

## Full `npm test` (one pass, after the final commit)
8647 tests, 8521 pass, 28 fail. Same 28 as the previous report, no new red, none missing:
- Reads this repo's unmigrated project config (7): dispatch-operability (2), dispatch-governance-operability (1), capability-plan-lint (1), test-select-mutate (1), dispatch-i08b-remediation (1), checks-doctor-config `node-version-and-git` (1). Left alone; not cured by this change.
- Pre-existing on origin/main (18): dispatch-confinement-backend-p03 (1), check-decision-citation-drift (1), fgctl-upgrade (14), fgctl-init-download-sources (2).
- Product gap, other lane (2): the two `run.test.mjs` inline-lead tests. Untouched.
- The runner's "leaked into .fgos store" error lists only `git-addon/.../source-digest` (door staging) and my own log file kept inside `.fgos/runtime/tmp`; not test leaks.

An earlier full pass (before the CARGO_HOME fix and the blind-steps fixture) showed 39 fails; the 11 extra were all caused by this change and are fixed: 6 cargo-toolchain, 3 state-root permissions (dispatch-confinement-p05), 3 blind-steps (one of which overlaps the baseline count differently). That pass was superseded by the final one above.

## Observation (not changed)
With umask 002 and a fresh home, the default state root is created group-writable and the git door then refuses it (`untrusted-driver-directory`, "run fgos doctor --fix"). Doctor repairs it, so it may be by design; worth an owner look as a first-run friction on group-umask machines.
