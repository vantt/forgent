# Holder-lock phase 00: contracts, registry, vectors, two empty crates

## Prior-art check

`git log -S'flock' -S'FGOS_STATE_ROOT' --oneline`: **not run, sandbox denied `git log`** (every `git`/`cargo`/`ls`/`grep` call needed approval; only `node --version` ran). Phase file's own prior-art note stands (no earlier shared holder-lock; generation ledger kept for run control). Lead should rerun the command.

## Files changed

Contracts (`packages/holder-lock/contracts/`):
- `holder-lock.port.v1.json`: six operations, results (`acquired|held|timeout|unavailable`, `held.reason` = `kernel-lock-held|predecessor-domain-not-empty`), guarantee shape + per-driver levels.
- `predecessor.v1.json`: `<lockFile>.predecessor.json` record per domain kind, release rule, acquire algorithm, `killWaitMs` (default 2000, `lock.predecessorKillWaitMs`).
- `internal-route.lock-fd.v1.json`: argv, fd 3, one-line stdout, exit codes (0/2/3/10/11/12/70).
- `internal-route.state-root.v1.json`, `internal-route.quiesce-scan.v1.json`, `internal-route.lock-borrow-vectors.v1.json`: same envelope (`v`, `protocol`, `result`) and exit-code scheme.
- `lock-registry.v1.json` + `lock-registry.schema.v1.json`: 20 rows (the phase table, with `activation`/`install`/`observe` split into three rows) plus a `ranks` table (rank -> allowed kinds) from the design rank table.
- `state-root.vectors.v1.json`: 18 vectors (FGOS_STATE_HOME, XDG, HOME, USERPROFILE, sandbox HOME + FGOS_STATE_ROOT, empty/whitespace, Windows components).

`packages/process/contracts/process-facts.judge.v1.json`: 11 rule rows (8 + 3) and 29 vectors; every row covered, including N4 (observer outside init namespace, record without `pidNs` -> `unknown`, for both would-be-alive and would-be-dead worlds), zombie `Z` and `X`, record without pid (missing/null/string/0), anchor dead/alive/unknown, plus control vectors.

Crates: `packages/process/rust` (`fgos-process`) and `packages/holder-lock/rust` (`fgos-holder-lock`): `Cargo.toml` (workspace version/edition, no dependencies) + `src/lib.rs` with empty doc-commented `pub mod` blocks. Root `Cargo.toml` has both members; `Cargo.lock` has two hand-written entries (alphabetical, no deps).

Test: `test/holder-lock/registry-contract.test.mjs` (node:test, no deps; includes a small validator for the schema subset).

## What the test covers

Registry validates against schema (and schema rejects a 4.2 lock without fence); unique names; rank exists and kind fits the rank table; documented rank ordering; every 4.2 lock has a fence, ledger-dir => blocking-generation, file locks => tombstone, only `full-suite` is `none` and says why; machine/run scopes; judge vectors cover every row of both tables, include N4 and Z/X, names unique, vector result equals its row's result except `control-*`.

## Test results

- `node --test test/holder-lock/registry-contract.test.mjs`: **not run, sandbox denied** (also `node --check`). Written carefully but unobserved.
- `cargo check -p fgos-process -p fgos-holder-lock`: **not run, sandbox denied**. `Cargo.lock` was edited by hand because cargo could not run; Lead should run cargo once and keep whatever diff it produces (expected: none).

## Deviations / judgment calls

- Registry `owner` enum includes `6.2` (the phase table gives `attempt` owner 6.2; phase prose says `4.2|4.3|4.4`).
- 4.4 rows (`activation`, `install`, `observe`): `v3Path`, `v1Shape`, `fence` null (decided by the 4.4 plan); `v1Path` is the Rust source file. Scope guessed: activation repo, install machine, observe repo (phase table says "repo/machine" without a split).
- `v1Shape` for gateway, runner, sessions, reconcile, advance not read line by line: `full-suite` and `recovery` verified as `wx`; `advance` assumed `wx` (comment mentions a lock file with no pid yet); gateway/runner/sessions/reconcile assumed `link` per the design's shape table. The cutover fence test runs real v1 code, so a wrong label cannot hide a bug there, but P04 should correct the label if wrong.
- v3 paths of repo locks are `<fgosDir>/locks/<name>.lock`, machine ones `<lockRoot>/...`, run ones in the run dir; the phase gave only the pattern. `recovery` v3 file is `<runDir>/recovery.lock` (v1 was `.recovery.lock`).
- `FGOS_STATE_ROOT` placed first in the state-root resolution order (pinned wins), blank values ignored by trim, matching `store.rs` `resolve_machine_release_store_root`. Design does not state the precedence of the pin explicitly.
- `guarantee.levels` per driver: macOS `exclusion/borrow` = `kernel` (A2: X2 measured); `kernel-unmeasured` stays in the enum for a driver without a measurement.
- Exit-code numbers, `--predecessor` flag and `--exclude-pid`/`--root` flags of the routes are my choices; the phase listed only the flags `--protocol/--try/--wait-ms/--kill-wait-ms/--shared-try/--borrowed-check/--guarantee`.

## Unresolved questions

- Does `fgctl`/`quiesce-scan` need a JSON-lines streaming mode for large process tables? Contract uses one JSON object.
- 4.4 lock scopes (above) need confirmation by the 4.4 plan.
