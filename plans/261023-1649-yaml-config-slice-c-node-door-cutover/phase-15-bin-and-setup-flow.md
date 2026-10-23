# Phase 15: `bin/fgos.mjs`, the setup flow, the `bin` cache, the tier-ladder module

Depends on 11, 13, 14. Suggested executor: sonnet. Shared file `bin/fgos.mjs` (COOK, 6.2, 4.3-R rows): post first; this phase edits it alone. Impact analysis on `refreshGlobalBinCache`, `resolveFgosBin`, `refreshTierLadderComment`.

## Context

`bin/fgos.mjs` still holds 8 reader sites (`:1278,1315,3969` explicit `--config`; `:1452,1728,1823,2421,2439,2546,2685,2689,3323`), the setup flow (`:4043` tier-ladder refresh, `:4048,4051` `ensureSharedConfigDefaults` for the project and the global file, `:4072` `runFixes`, `:4709,4716` messages) and two account texts (`:2318,2896`). The `bin.globalFgosPath` cache is written by `refreshGlobalBinCache` into `~/.fgos/config.json` through `writeGlobalConfig` (`bin-discovery.mjs:108-121`, the last of the five `JSON.stringify` writers) and read by `resolveFgosBin` (`:89`) and by the shell wrapper (`scripts/fgos-shell-integration.sh:52`, a `grep` of the JSON key).

## Files it may touch

`bin/fgos.mjs`, `src/setup/bin-discovery.mjs`, `src/setup/tier-ladder-comment.mjs` and `test/setup/tier-ladder-comment.test.mjs` (deleted), `scripts/fgos-shell-integration.sh`, `core/config-schema/bin.schema.yaml` (deleted) with its line in `packages/config/rust/src/bundle.rs` and the crate tests that list it (`registry_defaults.rs`, `golden_schema.rs` completeness; phase 00 names them), `test/setup/bin-discovery.test.mjs`, `test/scripts/fgos-shell-integration.test.mjs`, the setup tests that read the setup envelope (`test/setup/checks-setup-*.test.mjs`).

## Design

- **Readers:** the explicit `--config` sites read with `loadRunnerConfig(path)` (C6); the others use `readConfig`/`loadRunnerConfigForDir` with the outcome of phase 00's table; `:2689` (`projectConfig` for `explainCapability`) is dropped with the `projectConfig` parameter (phase 10).
- **Setup flow (C10):** for the project root and for `os.homedir()/.fgos`, `initConfigFile` when no `config.yaml`/`config.json` exists; nothing else is written; the setup envelope's `addedKeys` fields and `tierLadderComment` are removed (their consumers are the setup tests and the message at `:4709`), the message at `:4716` says `created .fgos/config.yaml`. `runFixes` still runs (D's `create-machine-files`, doctor fixes).
- **`bin` cache (C11):** `refreshGlobalBinCache` writes `~/.fgos/runtime/bin-cache.json` (`{ "globalFgosPath": "<abs>" }`) with `replaceDurably` (mode 0600) only when the value differs, deleting the file when nothing resolves; `resolveFgosBin` reads it; the shell wrapper `grep`s the same key in the new file (still no `node` spawn on the hot path). A stale `bin` key in an existing global file stays untouched and is reported by D's `config-unknown-key` warning once the schema is gone. The doctor row that checks the cache keeps its id.
- **Deleted:** `tier-ladder-comment.mjs` and its test (C18: the behaviour is removed; the doc lines are D's `refresh-docs`), `ladderCommentLines` users are gone since phase 13.

## Steps

1. Merge `origin/main`; edit `bin-discovery.mjs` and the shell wrapper first, with their tests (the shell test writes the new cache file instead of a global config key); then `bin/fgos.mjs`.
2. Setup flow tests: a fresh temp project and `HOME`: setup creates a header-only `.fgos/config.yaml` and `~/.fgos/config.yaml` (no standard value in either), a second run changes nothing; with an existing legacy `config.json` setup creates nothing and doctor says `config-format-legacy-json`.
3. `rg -n "readSharedConfig|writeSharedConfig|ensureSharedConfigDefaults|refreshTierLadderComment|ensureRunnerConfigForDir|loadRunnerConfigFromDir" bin` finds nothing; `rg -n "config\.json" scripts/fgos-shell-integration.sh` finds nothing; run `node --test test/setup test/scripts test/cli` sequentially.

## Owning proofs

`init` behaviour: phase 05; setup flow wiring: the case above; cache read and write: the moved `bin-discovery` test; shell reader: the moved shell test.

## Risk / rollback

Risk: a machine whose setup has not run keeps `bin` in config and loses the fast path until its next setup/doctor fix (L x L: the wrapper falls through to the live `PATH` probe, as designed). Rollback: revert the commit; the cache writer returns to the global file (valid before stage activation only).
