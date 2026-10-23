# Phase 19: Architecture guards for config reads

Depends on 18. Suggested executor: sonnet. Shared files: `test/architecture.test.mjs` (YAML section was phase 03's), `docs/architecture-manifest.json`.

## Design

- **Node read guard.** Generalise the write guard instead of adding a second lexer: `findConfigFileWrites` (`test/architecture.test.mjs:1340`) becomes `findConfigFileAccesses(source, { kinds })` over the same `lexSource` shape/code views; `kinds: write` is today's test (tests), `kinds: read` finds `readFileSync`, `readFile`, `existsSync`, `statSync`, `openSync`, `createReadStream`, `access*` calls whose first argument names (literally or through a name bound in the same block) `config.json`, `config.yaml`, `accounts.yaml` or `gateway-token`. Scope: `src`, `bin`, `scripts`, `core`. Allowed: `src/config/facade.mjs` only (it does not read files at all after phase 07, so the allowlist is empty except messages: a string that merely mentions the name is not a call and is not flagged). `--config <path>` readers pass a variable and are not matched, by design (C6).
- **Tests side:** the existing write guard stays; add `kinds: read` for `test` with the helper allowed (reads go through `readProjectConfig`), so the format switch stays one place.
- **Rust guard.** A test in the same file scans tracked `.rs` files (outside `packages/config/` and fixtures) for the literals `"config.json"`, `"config.yaml"`, `"accounts.yaml"`, `"gateway-token"` used in `join`/`read_to_string`/`File::open` calls; the allowlist is empty after phase 16. **Shell guard:** `scripts/*.sh` and `.githooks/*` do not mention `config.json` in a read position (`grep`, `cat`, `sed`, `jq`).
- **Self-tests** like the existing ones: the guard catches each way to read the file (`fs.readFileSync(path.join(d,'.fgos','config.json'))`, a bound name, `fs.promises.readFile`, template literal, `existsSync`) and ignores comments, strings, other file names and the facade.
- **Manifest:** rows for `src/config/shared-config-file.mjs` and `global-config.mjs` removed, `facade.mjs` row verified `kernel` (phase 07), `src/config/machine-config.mjs` gone.

## Steps

1. Merge `origin/main`; write the guard cases first (they fail on a scratch copy that still reads), then the guard; run `node scripts/run-tests.mjs` for the architecture file only through the launcher.
2. Prove the YAML guard (phase 03) and these two run in the same file without sharing state.

## Owning proof

`test/architecture.test.mjs` is the one owner of "no config read outside the facade" (Node, Rust, shell).

## Risk / rollback

Risk: false positives on unrelated `config.json` files (the `.bee` tool, `tsconfig`): the regex keeps `CONFIG_FILE_NAME`'s exclusions (`:1296`). Rollback: revert; the guards are test-only.
