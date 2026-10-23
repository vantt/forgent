# Phase 18: Fixture helper flip, every test moved, `src/config/*` deleted

Depends on 10-17. Suggested executor: sonnet (haiku for batches of mechanical test moves); **independent sonnet review**; opus after a failed attempt. Message `lead:TEST` before starting (board row: CFG only replaces config writes with the helper; this phase changes more where strictness forces it). Re-estimate from phase 09's census; stop and report if it exceeds 20h.

## Context

`test/architecture.test.mjs:1363` already forces every test write of `config.json` through `test/helpers/config-fixture.mjs` (48 lines, imports `writeSharedConfig`). The spec's G5 promise: "the format switch is one change in the helper".

## Files it may touch

`test/helpers/config-fixture.mjs` and `config-fixture.test.mjs`, every test file phase 09's census lists (writes through the helper, raw reads, direct imports of `src/config/*`: `loop-rununit`, `claim-capacity-race`, `claim-port`, `merge`, `knowledge-attest-gate`, `bin-discovery`, `setup-checks-harness`, ...), `src/config/shared-config-file.mjs` and `global-config.mjs` (deleted), `test/config/shared-config-file.test.mjs` and `global-config.test.mjs` (deleted).

## Design

- **The flip (C20):** `writeProjectConfig(dir, value)` and `writeGlobalConfig(home, value)` write `config.yaml` containing `# @fgos:v1`, a blank line and the value as JSON text (valid `strict-config` YAML); `projectConfigPath`/`globalConfigPath` name `config.yaml`; `writeRaw*` keep writing exactly the given text (malformed fixtures); new `readProjectConfig(dir)`, `readGlobalConfig(home)` (parse through `parseYaml`, JSON.parse-compatible) and `plainConfig(value)` (deep copy to ordinary objects for `deepEqual`). A fixture that is refused by the snapshot is **fixed to be a valid config** (complete the executor, remove the stray key, declare the intended refusal in a test that asserts the refusal); no assertion is weakened, no switch is added.
- **Tests moved by class** (counts from phase 09): raw readers use the read helpers; tests that assert bytes of the file assert the new file; tests of `shared-config-file` and `global-config` are retired with their behaviour, each case mapped in the commit to its new owner (`facade.test.mjs`, B's goldens) or "removed": reading `{}` for a missing file -> standard; throws on invalid JSON -> `config-parse`; command-list filtering -> schema refusal; `describeConfigAwareness` -> removed (C13).
- **Deleted source:** `src/config/shared-config-file.mjs`, `global-config.mjs`; `src/config/` then holds `facade.mjs` only; `docs/architecture-manifest.json` rows for the two files go in phase 19.

## Steps

1. Merge `origin/main`; flip the helper; run `node scripts/run-tests.mjs` per directory (`test/runner`, `test/setup`, `test/state`, `test/verbs`, `test/workflow`, `test/cli`, `test/e2e`, `test/scripts`, `test/git`, `test/run-supervisor`, `test/config`, rest) sequentially, `free -g` before each, exit code read on the next statement; fix per directory in separate commits.
2. `rg -n "readSharedConfig|readSharedConfigOrEmpty|loadGlobalConfig|writeSharedConfig|writeGlobalConfig|mergeWithGlobalConfig|sharedConfigFilePath" src bin scripts test --glob '*.{mjs,cjs}'` finds nothing; delete the two modules and their tests.
3. Full `npm test` once, sequentially; the 18 known red cases (p-5d2e1c9a) are the baseline and not made worse; update `test/suite-baseline.json` only through its owner's procedure (TEST lane).

## Owning proofs

Every moved test keeps its owner; behaviour removed is named in commits.

## Risk

| Risk | L x I | Mitigation |
|---|---|---|
| Churn bigger than estimated | H x M | census first; stop rule at 20h; parallel agents per directory |
| A test passed only because the fixture was invalid and tolerated | M x M | each refusal fixed in the fixture, never silenced; review reads the diff for weakened assertions |
| TEST lane collision | M x M | message first; they land second and rebase |

## Rollback

Revert the commits of the phase together with 10-17 (the deleted modules return).
