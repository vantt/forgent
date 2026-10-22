# Phase 01: One config fixture helper; every hand-written config write moves to it

Lands first. Depends on phase 00. Suggested executor: sonnet (mechanical, high volume).

## Context

104 test files write `.fgos/config.json` or `~/.fgos/config.json` by hand (spike G5; Config spec section 13 "Tests"). When config becomes YAML (Slice C), each would need editing. One helper makes that a one-file change. Reuse before adding: product `writeSharedConfig` (`src/config/shared-config-file.mjs:105`, writes `JSON.stringify(config, null, 2)` plus newline, creates `.fgos/`) and `sharedConfigFilePath` (`:19`) are the existing door; four test helpers already wrap a write (`test/helpers/failover-fixture.mjs:151,161`, `test/helpers/workflow-fixture-repo.mjs:89`, `test/cli/helpers/fgos-cli-harness.mjs:502,553,1130`) and keep their own signature but call the new helper inside.

Census so far (executor re-runs and records exact numbers in the commit message): 121 files mention the literal `config.json`; a conservative grep finds about 85 files with a write call or a path variable bound to it; 29 read call sites parse it back (read sites are Slice C work, counted here only so Slice C has the number).

## Files it may touch

- Create `test/helpers/config-fixture.mjs`, `test/helpers/config-fixture.test.mjs`.
- Edit test files and test helpers only on the lines that write config (plus one import line each). No other test edit, no rename, no reformatting, no test added or removed elsewhere.
- Do not touch `src/**`.

## Helper contract

```
projectConfigPath(dir)            // <dir>/.fgos/config.json today
globalConfigPath(home)            // <home>/.fgos/config.json today
writeProjectConfig(dir, value)    // creates .fgos/, serializes value
writeGlobalConfig(home, value)
writeRawProjectConfig(dir, text)  // deliberately malformed or exact-bytes content
writeRawGlobalConfig(home, text)
```

- `value` is a plain object, never text. Serialization lives in one function inside the helper. It calls product `writeSharedConfig` for the project and global writers (same layout under `home`), so one door produces the bytes; the raw writers use `fs.writeFileSync` on the helper's path function.
- Per-site serialization variants (minified `JSON.stringify(x)`, `null, 2`, with or without final newline) are not preserved: before converting, grep for tests that read the file back as text or compare bytes (`readFileSync(.*config.json` without `JSON.parse`); those few sites keep a raw write and are listed in the helper test as the known exceptions.
- No env switch, no flag, no mode argument. The format knob is a module-level constant pair (`CONFIG_FILE_NAME`, `serialize`) changed once in Slice C.

## Steps

1. Merge `origin/main`. Post one board log line (lane CFG, to TEST) naming the batches below and that edits are config-write lines only.
2. Census script in scratch (`.fgos/runtime/tmp/config-census.sh`): list files by form (a) inline `path.join(..., '.fgos', 'config.json')` write, (b) path variable then write, (c) `writeSharedConfig`, (d) raw malformed text (`'{ not json'`, `'{}'`), (e) global (home dir) writes, (f) reads. Save counts.
3. Write helper and its test. Owning proof (one test file, one behaviour): "a config written by the helper is read back, equal, by the product reader `readSharedConfig` for both scopes, and a raw write reaches the reader byte-for-byte (a malformed one throws the reader's parse error)". No second copy of reader cases (design principle 8).
4. Convert in batches, one commit each, in this order so a collision with TEST costs little: `test/helpers/*` and `test/cli/helpers/*` (wrappers first, so their many callers need no edit), `test/setup` (18 files), `test/runner` (26), `test/cli` and `test/e2e`, then the rest (`run-supervisor`, `workflow`, `scripts`, `git`, `verbs`, `state`, `config`, `holder-lock`, `fixtures`, `event-store`, `direct`).
   Conversion forms, applied by hand per file, never by an unreviewed global regex:
   - `fs.writeFileSync(path.join(X, '.fgos', 'config.json'), JSON.stringify(V[, null, 2]))` becomes `writeProjectConfig(X, V)`; if `.fgos` was created by a preceding `mkdirSync` used for other files, leave that line.
   - home-dir variant becomes `writeGlobalConfig`.
   - literal text becomes `writeRaw*`.
   - a path variable that is also used for `existsSync`, `rmSync` or reads is rebuilt from `projectConfigPath`.
5. Before each batch: `git fetch`, merge main, `git diff --name-only origin/main...` for files TEST changed; skip those, list them in the commit body, convert after the next merge.
6. After the last batch, run the census again. Acceptance command: `rg -n "writeFileSync\([^)]*config\.json|writeFile\([^)]*config\.json" test --glob '!test/helpers/config-fixture.mjs'` shows only the listed known exceptions. Record the final count in the commit message.

## Owning proof per behaviour

| Behaviour | Owner |
|---|---|
| Helper writes what the product reads (both scopes, raw text) | `test/helpers/config-fixture.test.mjs` |
| Every converted test still passes | its own file, unchanged assertions |
| No test weakened | diff review: each hunk touches only the write line and imports; retired tests: none |

## Validation

1. `node --test test/helpers/config-fixture.test.mjs`.
2. After each batch, `node --test <the batch's files>` (a directory per command; for `test/runner` use `node --test test/runner/<file>` for the converted files, in chunks of 10).
3. Final gate for this phase, alone, with `free -g` checked first: `npm test` (background, observe exit, read `$?` on the next statement). `test/suite-baseline.json` "tests" count must equal the previous count plus the helper test's cases (the duplicate-test guard must stay green).

## Risk

| Risk | Mitigation |
|---|---|
| TEST lane edits the same file mid-batch | merge main per batch, skip in-flight files, post board line first |
| Byte-sensitive test breaks after reserialization | step 3 grep for byte readers; those sites keep raw writes and are listed |
| A conversion silently changes which directory is written (relative vs absolute) | helper takes the same `dir`/`home` argument the old line had; no new path math |
| A test used a malformed write to prove a doctor failure and `{}` is now valid YAML later | raw writers keep exact text; Slice C reviews each raw site |

## Rollback

`git revert` the batch commits (independent of each other). The helper and its test are new files; the product is untouched.
