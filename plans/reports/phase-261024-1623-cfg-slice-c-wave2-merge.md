# Config cutover, Slice C wave 2 merge (fixes, registrations, bin into cfg/slice-c-c)

Merged in order: `cfg/slice-c-c-fixes` (clean), `cfg/slice-c-c-registrations`, `cfg/slice-c-c-bin`. The only textual conflict was `packages/git/contracts/mutation-census.v1.json` (both later merges): took one side, regenerated with `node scripts/git-one-door-scan.mjs --write-census`. No design disagreement. The `seat-binding-config` row stays removed; `registrations.mjs` / `checks.mjs` merged without conflict (bin lane touched only the row and the import name).

## Integration fixes (class d, found by the merged tree)
- `docs/architecture-manifest.json`: `src/setup/config-checks.mjs` had no row (architecture test "đủ sổ" and the one-way import test red). Added as `domain`.
- `test/setup/config-checks.test.mjs`: wrote `.fgos/config.json` by hand, refused by the "config has one test door" guard; now uses `writeRawProjectConfig` / `projectConfigPath`.
- L10 cleanup: removed `DEFAULT_WORKTREE_SETUP_COMMANDS`, `readWorktreeSetupCommands`, `readSharedConfigOrEmpty` from `src/config/shared-config-file.mjs` (no importer left anywhere).
- Kept on purpose: `loadRunnerConfig(path)` and `DEFAULT_RUNNER_CONFIG` (about 30 test files import them; no src caller but the barrel). The aliases `loadRunnerConfigFromDir` / `ensureRunnerConfigForDir` were already gone from both lanes' result (rg: none).

## Proof
`cargo test --jobs 4 -p fgos-config`: green (33 result lines, 0 failed). Node: the requested set (104 files, isolated HOME per file, 4 parallel; parallel runs trip the `.fgos` leak guard on exit code only, so verdict is read from each file's `fail` count), then the 11 red files plus controls re-run sequentially in this tree and in a clean `origin/main` worktree (removed). After the fixes: architecture, config-checks, registrations, checks: 131 pass, 0 fail.
Green: all other files, including dispatch-decide-hook, tier-cell, worker-slots, fgos-setup, checks-setup-idempotent, config/*.

## Reds by class
(a) fixture still assumes an unconfigured/lenient project (phase 18):
- `test/runner/dispatch-confinement-p05.test.mjs` (3): herdr executor fixture lacks `kind`; schema refuses, check skips.
- `test/runner/dispatch-execute-effort.test.mjs` (3): fixture replaces executors; the standard's `capabilities.advise` still names `claude-cli-bwrap`.
- `test/setup/model-pool-checks.test.mjs` (5): same replaced-executors cause plus the standard's tier cells.
- `test/setup/agent-cli-trust-check.test.mjs` (1): fake empty `.git` directory; the door needs a real repository (`config-trusted-root-unresolved`).
- `test/setup/visibility-checks.test.mjs` (2): accounts written to the global config (`config-key-in-wrong-file`); belong in the accounts file.
- `test/setup/dir-resolution.test.mjs` (1): expects `doctor --fix` to write `.fgos/config.json` at the main checkout; that writer is retired (setup writes `config.yaml`, asserted later in the same file).
- `test/setup/uninstall-wiring-3.test.mjs` (1): expects setup to create `.fgos/config.json` (ENOENT); now `config.yaml`.

(b) reads this repo's unmigrated config (phase 21):
- `test/runner/dispatch-governance-operability.test.mjs` (1): `config-key-out-of-scope project:config.json gateway.port`.
- `test/runner/dispatch-i08b-remediation.test.mjs` (1): `executeExecutorCli` default cwd is the repo; its config is refused before the DispatchError.
- `test/setup/checks-doctor-config.test.mjs` (1): `node-version-and-git` reads the repo config.

(c) pre-existing on origin/main (same 3 fail there):
- `test/setup/blind-steps-proven-pools-check.test.mjs` (3).

(d) real regressions from the merge: the two integration fixes above, both fixed; none left.

## Node lines net for the slice so far
`git diff --shortstat $(git merge-base origin/main HEAD) HEAD -- src bin scripts`: 50 files, +688 / -1689 = net -1001. With `test`: 115 files, +1610 / -3455 = net -1845.
