# Slice C landing C, wave 1C: Rust consumers and hooks (phases 16, 17, D's phase 14)

Branch `cfg/slice-c-c-rust`, two commits (28de422a3 Rust consumers, 5a7b9558e hooks). Not pushed or merged.

## Decision needed (G-C3 breached): dependency cost of fgos-config in the gateway and the dashboard

Both builds grow past the 20% build-time threshold. Measured cold `cargo build --release --jobs 4`, CPU user+sys (wall time was unusable: machine load average 60+ from other lanes):

| Binary | CPU before | CPU after | Cargo tree lines | Lock packages |
|---|---|---|---|---|
| apps/fgos-gateway | 215 s | 376 s (+75%) | 582 -> 684 | 289 -> 330 |
| herdr-dashboard | 80 s | 187 s (+133%) | 251 -> 277 | 190 -> 229 |

The lock growth is the validator chain (`jsonschema` and its dependencies, plus `fgos-yaml-doc`, durable-file, holder-lock, canonical-json, identity), i.e. the crate list D5 already accepted; the build-time threshold is what is breached. The gateway needs `fgos-config` by design (D14), so that part is inherent. The dashboard pays only because `herdr-fgos-common` now depends on it.

- What is happening: reading config through the one door pulls the validator into two binaries that did not have it.
- Cause: `fgos-config` bundles the schema validator; no leaf split exists.
- Options: (A) accept (default, done): one door, cost is a one-time cold build; (B) leaf crate split of `fgos-config` into a reader without the validator (Idea I1): lower cost, a second reading door and a bundle-digest question; (C) dashboard reads through the `fgos` CLI: no dependency, a process spawn per poll tick.
- Recommendation: A. Warm incremental builds are unaffected; B is a new mechanism for a one-time cost.
- Scope: reversible per crate (`git revert 28de422a3` restores the old readers).

Left as built (A) so the branch is complete; the coordinator may overrule. `cargo deny` on the gateway: advisory output identical before and after (the same 9 entries of backlog p-7e41b0d3: 6 vulnerability/unsound, 1 unmaintained, 1 yanked, counted from `cargo deny check advisories`); no new advisory.

## Phase 16 + D's phase 14 (commit 28de422a3)

- `packages/config/rust/src/machine.rs`: one new door `project_snapshot(root, lookup)` (global dir from `$HOME`, class from the confined marker; the crate still reads no environment itself). `Segment` re-exported from the crate. One test in `tests/machine_view.rs`.
- Gateway `gateway.rs`: port, bind and the Cloudflare Access pair from `machine::snapshot` (Unconfined); token from `machine::token::read(~/.fgos)`; `GlobalConfigFile`, `GatewaySection`, `DEFAULT_PORT`, `DEFAULT_BIND` and the `NotFound`/`Io`/`Parse`/`MissingToken` variants deleted (the standard supplies the defaults). Missing token file is `Token(path, "missing")`, other refusals carry mode/shape/symlink; text says `fgos doctor --fix`. The "both cf-access fields or neither" rule stays in the gateway. Doctor failure for the missing file already exists (`machine::unready`, token-missing). Strings naming `~/.fgos/config.json` rewritten (`gateway.rs`, `cf_access.rs`).
- `herdr-fgos-common/settings.rs`: `read_settings` and `read_web_dashboard_settings` through `project_snapshot`; raw-text `parse_*` functions removed; refusal outcome tested (all toggles off, static serving on).
- `herdr-dashboard/main.rs`: duplicate `read_herdr_orchestrator_toggles` and `HerdrOrchestratorToggles` deleted; uses `settings::read_settings`/`OrchestratorSettings`; the five duplicate reader tests retired (owner: settings.rs tests); end-to-end tests write YAML and point `HOME` at an empty directory. `[patch.crates-io]` lines added, lock refreshed.
- `work-state/lib.rs`: `gateBypass.level` from the snapshot; legacy `gate-bypass.json` only when the level's provenance is `standard`; refused, invalid or no `HOME` -> `off`. Behaviour change (the plan's C8): an invalid level in the config used to fall through to the legacy file, now it is `off`.
- Callers checked with rg: `load_gateway_config` (gateway.rs `run`, tests), `read_settings`/`read_web_dashboard_settings` (dashboard main.rs:495, gateway.rs `run`), `read_gate_bypass_level` (work-state only), `parse_settings`/`parse_web_dashboard_settings` (no caller outside settings.rs). `rg config\.json` in the touched Rust: only fixtures/comments of other crates remain.

Rust lines (`git diff --numstat 9a0656382..HEAD -- '*.rs'`): total 403 added, 363 removed (tests included). Source (non-test) added: gateway.rs 60 (cap 60), settings.rs 25, work-state 27, dashboard 2, machine.rs 20, config lib.rs 2: 136 gross (phase 16 four crates 54 against cap 60; D14 gateway 60 against cap 60; helper 22 in the crate).

## Phase 17 (commit 5a7b9558e)

- `.githooks/pre-commit`: `configCheckRefusal` runs `<host> config check` (cwd the committing toplevel, the hook's timeout and kill signal, via a `hostStdout` shared with `identityData`) when `.fgos/config.yaml` or `.fgos/config.json` is staged, unconditionally (before the at-home gate). Refuses on a `fail` row that names the project file (file, position, path, fix; no value) and says it checks the working-tree file. A machine-level fail row (an unset token file) does not refuse: an empty-home run showed `config-machine-files` failing on a clean file. No host, a host that predates the verb, or any non-`config check` answer: warning, commit continues.
- `LOCK_FILES`: `project-config` and `global-config` rows. The scan test now asserts the scanned rows equal the registry minus the three rows without a file (no such coverage test existed); counts "of 20 locks" -> 22.
- `dispatch-decide-hook.mjs`: blocks (exit 2, ids and `fgos config check` in the message) when `decideExecutorCli` throws `isConfigRefusal` or a `RunnerConfigError` with a `config-*` code; every other failure stays fail-open; header updated. Hook tests now run with an empty `HOME` (they read the machine global config too).
- Mutation census regenerated in both commits (the pre-commit census check requires it).

## Verification

- `cargo test`: gateway 88, herdr-dashboard 88+36+1, `-p fgos-config -p fgos-work-state -p herdr-fgos-common` all green. Clippy `-D warnings` clean for config, work-state, herdr-fgos-common and the gateway. herdr-dashboard clippy fails on 3 errors in `src/layout.rs` that are identical on the untouched baseline (not mine, outside ownership).
- Node: `node scripts/run-tests.mjs` on holder-lock-checks, pre-commit-config-check (new, 4 cases, real host), main-checkout-lock-hook(s), root-file-guard-hook, dispatch-decide-hook: 45 of 46 pass.
- The one failing test is the new `blocks (exit 2) when the project config is refused` in `test/scripts/dispatch-decide-hook.test.mjs`. It needs the runner loaders on the facade (phases 10-11, other lane): today `decide` on a broken project config does not throw (the old loader writes a default and goes on). Proven separately with a temporary, reverted shim that made `decideExecutorCli` call `readConfig`: the hook exited 2 with the `config-*` ids. Re-run this file after the loaders merge.
- Not done: the live `fgos gateway start/status/stop` check (needs the rollout's stage 1, phase 15/21); plan status rows and CHANGELOG (docs closeout, phase 23).

## Notes for the merge

- `packages/git/contracts/mutation-census.v1.json` is regenerated in my commits; other lanes will conflict on it: regenerate with `node scripts/git-one-door-scan.mjs --write-census` after the merge, never take either side. The scan reports 5 undeclared Node sites that are not from this lane.
- After the loaders merge, the dispatch hook blocks every Agent call on a machine whose global `~/.fgos/config.json` still holds `gateway.token` or `runner.llmAccounts` (seen during the shim run: `config-key-in-wrong-file`). Activation must come after the machine migration (phases 20-21), as the plan orders it.
- The unconfined machine snapshot in the gateway also reads and validates `private/accounts.yaml`; a broken accounts file would stop the gateway. Kept per the plan.
