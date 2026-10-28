# Review: pattern catalog Part A, the config side

Reviewer: code-reviewer for lead:HARDEN, 2026-10-28 (Asia/Saigon). Read-only. No tests run: `.fgos/runtime/tmp/harden-builds-ok` did not exist, so every finding below comes from reading the code end to end. Where a claim depends on Rust behaviour I could not run, it is marked "not run".

Diff reviewed: `git diff 5d6e18827^2 5d6e18827`. The merge's first parent is the cook branch, so `^1..` shows only board lines; `^2` is main. HEAD has not touched `src/` since the merge, so the line numbers below are the same on HEAD.

## Verdict: CHANGES

The schema, the standard, the marker and the snapshot hash are sound. The retired-key mechanism is not yet one door:

- Five code paths detect retired keys, and they give different answers for the same input.
- One of them reads the config file with raw fs.
- The conversion and doctor give advice that, for two realistic file states, leads to a further refusal.

## High

### H1. A legacy JSON file that holds a retired key has no printed way out

Files:
- `src/setup/runner-config-conversion.mjs:72-108,161-198`
- `src/setup/registrations.mjs:519-521,546-548`
- `src/runner/dispatch/config.mjs:207-209`

Scenario: a project still on `.fgos/config.json` holds `runner.patterns.reviewed: {maxRounds: 2}` or `runner.patterns.defaultRule`. Releases before Slice C merged the defaults into the file, and the plan's F-3 confirms this repository's tracked file held both.

1. Every runner read refuses. The v2 schema's `patternEntry` has `additionalProperties: false`.
2. `fgos setup` makes a backup, then shells out to `fgos config patch`. The write door refuses JSON (`config-format-legacy-json`), so setup reports `blocked` with the raw door text.
3. Doctor `runner-patterns-config` says "legacy JSON configuration format must be migrated first; migrate the file format first".
4. Migration does not help. `migrate.rs` `compare` -> `differences` reads the old bytes through `snapshot_with`, which validates against the v2 schema, so migrate should refuse the same retired key (code reading, not run). `packages/config/contracts/migration.v1.json` can only drop paths. It cannot move them.

Result: runner verbs are dead for that project. The only real fix is a hand edit of the JSON, and no output names it.

Scale: every unmigrated JSON project or global file from the default-writing era. On this machine, `.fgos/config.json` and `~/.fgos/config.json` are empty tombstones, so this machine is not affected.

Smallest fix (message only, no new mechanism):
- In `convertRunnerPatternsConfig`, when the target ends in `.json`, do not make a backup and do not call the door.
- Return `blocked`, with the per-key hand edits from `retiredKeysIn(parsed, targetPath)`. That list is already computed at :86 and then thrown away.
- End the message with: "edit `<file>`, then run `fgos config migrate`".
- Doctor uses the same text instead of "migrate the file format first".
- Data-only option: add `runner.patterns.defaultRule` to `migration.v1.json` `retired`, because its replacement really is "delete". Do not add the `reviewed.*` keys there, because that would drop user tuning. See question Q1.

## Medium

### M1. Retired keys are detected in five places, and they disagree

The five detectors:
1. `detectRetiredPatternKeys` (`src/runner/execution/patterns/retired-keys.mjs:43`)
2. Its re-wrapping in `retiredKeysIn` (`src/runner/dispatch/retired-config-keys.mjs:25`)
3. The refusal-path mapper plus raw file re-read (`retired-config-keys.mjs:91-187`)
4. The table lookup on `checkConfig` paths (`src/setup/registrations.mjs:525,551`)
5. Hand-coded prefix and key checks in the conversion (`runner-config-conversion.mjs:88-98,113-154,256-273`)

`validateRunnerPatternsShape` (`config.mjs:1284-1308`) and `checkCatalog` (`catalog-entries.mjs:378`) each wrap the detector again, with their own message templates. That makes at least six message templates for the same finding. `RETIRED_CONFIG_KEYS` drives none of the detection: every use carries a `meta?.instruction ?? '<copy of the table text>'` fallback.

Concrete wrong result: `retired-keys.mjs:75-109` classifies any pattern name that holds `maxRounds` or `checkersByRigor` as retired, with replacement `runner.loops.<name>`.
- A named-file config (`loadRunnerConfig`, `config.mjs:243`) holding `patterns.panel: {maxRounds: 3}` is refused with `config-key-retired ... use runner.loops.panel instead`. Following that advice gives `unknown key "maxRounds". Allowed keys: bounds` (`config.mjs:1426`).
- A custom `my-pat: {loop: reviewed, maxRounds: 2}` is told to "move tuning to runner.loops.my-pat". That is not a loop name.
- The project-file door path (`checkDoorRefusalsForRetiredKeys`) only treats `reviewed` this way, so the same input gets a different code depending on the door.
- `panel.maxRounds` was never a valid key. The old `ALLOWED_PATTERNS_KEYS` allowed only `defaultRule|reviewed|seatBinding`, so this misclassifies a plain unknown key as retired.

Smallest fix:
- One pure function in `retired-keys.mjs`, driven by `RETIRED_CONFIG_KEYS`, that takes dotted paths and returns `{key, replacement, instruction}`.
- Restrict the tuning detection to `reviewed`, which is what the table lists.
- Every caller formats from that one result.
- Delete the per-caller `kind` branches and the `?? '...'` fallbacks.

### M2. The loader reads the config file with raw fs, though the door already gives the child path

File: `src/runner/dispatch/retired-config-keys.mjs:120-185` (`fsp.readFileSync` plus `parseYaml` at :139).

Why the re-read exists: a merged-value refusal for `runner.patterns.reviewed` has no child key, and the merged entry also holds the standard's `promise`/`loop`, so it looks like a mixed-shape entry.

The door already answers this per file. `checkConfig` judges each source over the standard alone (`packages/config/rust/src/doctor.rs:283-300`) and emits `config-unknown-key` at `runner.patterns.reviewed.maxRounds` (`doctor.rs:192`). Doctor `registrations.mjs:525` already relies on that.

The re-read also rebuilds paths by hand:
- `HOME/.fgos/<name>` for `global:`/`machine:`
- `projectRoot/.fgos/<name>` for `project:`
- `path.join(projectRoot, r.file)` for anything else

For an unknown label, the lookup silently falls through to the generic message.

Smallest fix: on a `ConfigDoorError`, call `checkConfig({ projectRoot: dir })` once, map its retired paths through the one function from M1, and delete :120-185. This removes about 90 lines and the second reader.

### M3. A JS-only error in the global file is reported against the project's `.fgos`

File: `src/runner/dispatch/config.mjs:218`, `validateRunnerConfigShape(cfg, \`${path.join(dir, '.fgos')} runner\`)` on the merged value.

Several rules exist only in JS, not in the schema:
- `bounds` min > max, or a bound on a parameter the loop does not read (`config.mjs:1452-1475`)
- non-cumulative `checkersByRigor` (:1433-1446)
- an unknown key under `defaults` (`patternEntry.defaults` in the schema has no `additionalProperties: false`)
- reserved names, empty `roleTasks` text, and the gated name

Example: `~/.fgos/config.yaml` with `runner.loops.reviewed.bounds.maxRounds: {min: 5, max: 2}` passes the door. The JS validator then throws `runner config (/proj/.fgos runner loops.reviewed.bounds.maxRounds) min (5) must be <= max (2)`. That names the wrong file. Doctor has the same problem: `validateRunnerLoopsShape(effectiveLoops, 'runner.loops')` names no file at all.

Plan rule 9 ("attribute an error to the offending field's origin") is met for `checkCatalog` but not here.

Smallest fix:
- Add `runner.patterns` and `runner.loops` to the `origins` list of the one `readConfig` call at :206.
- Have the validators throw with the failing dotted path, and let the loader add `origins[path].file:line`.
- Optionally, add `additionalProperties: false` to `patternEntry.defaults` in the schema. The door would then name the file itself, and the JS `ALLOWED_DEFAULT_KEYS` copy (:1338) could go.

### M4. The conversion module carries dead branches, a test-only seam and raw writes around the door

File: `src/setup/runner-config-conversion.mjs`.

- **Dead branch, :170-177.** `facade.applyPatch ?? facade.patch` does not exist. `src/config/facade.mjs` exports no write entry, and the addon `config` namespace has none either (`packages/git/node-addon/src/config.rs`). Every real run goes through `resolveActiveHostBin` and `fgos config patch`.
- **Test-only seam, :59-66 and :162.** `options.patchDoor` changes the flow, not just the writer. It also skips the opening `loadRunnerConfigForDir` check. That is a test-only branch, which AGENTS.md L5 rules out. The writer can be injected without skipping the check, or the test can drive the real door with `FGOS_HOST_BIN`.
- **Restore around the door, :215.** `fs.copyFileSync(backupPath, targetPath)` rewrites the file after the door committed, outside its lock and revision check. The door validates the whole snapshot, so the only way to get here is a JS-only validation failure (M3), or another writer in between whose bytes would be lost. Smaller and safer: keep the door's write and report `converted` together with the remaining validation error.
- **Unreachable branch, :203-213.** `globalPending`: the error is a `RunnerConfigError`, never a `ConfigDoorError`. Also, a retired key in the global file makes the door refuse the project write before this point (proven by the module's own test "handles retired keys in both ... blocked").
- **Backup litter, :104-108.** The backup is made before the gated/modern conflict check (:117-125) and before the door call. Every `fgos setup` on a blocked project, including every JSON project (H1), leaves another `.pre-patterns-catalog-<ts>` file. Move the copy to just before the door call, after every pre-check that can block.
- **Second detector, :84-93.** It swallows `retiredKeysIn`'s mixed-shape error whenever `reviewed` has tuning, even when the throw came from a different entry.
- **Plan jargon in user output, :186.** The message says "question U6 requires Branch A conversion". The stable-artifacts rule rules out plan ids in code and output.

### M5. A project fixed in the old global order cannot apply the printed global command

Files:
- `runner-config-conversion.mjs:248-284`
- `bin/fgos.mjs:4026-4036`
- `packages/config/rust/src/write.rs:383-406`

Scenario: both the project file and the global file hold retired keys.
1. Setup reports the project `blocked`, because the door validates project over global.
2. Setup prints `fgos config patch <patch-file> --global --reason ...`.
3. Run inside that project, the global write is validated by `snapshot_with(ctx, &req.roots, "global", bytes)`. Those roots include the project file, which still holds its retired keys, so the global write is refused too (code reading, not run).

The way out is to run the global patch from a directory with no project config, then run `fgos setup` again. That is not printed. The `<patch-file>` content is not printed either, although the edit list is already in `notice.edits`.

Smallest fix: wording only. Say "from a directory outside any fgOS project", and print the patch body (the `unset`/`set` items) that `inspectGlobalRunnerConfig` already knows.

Also: `inspectGlobalRunnerConfig` (:256-273) matches any refusal under `runner.patterns.reviewed` and advises "move runner.patterns.reviewed to runner.loops.reviewed", even for an unrelated error such as `reviewed.loop: bogus`. Route it through the M1 function.

### M6. Hand-written `runner.loops` without marker 2 is silently ignored by an older release

Evidence:
- Old schema `urn:fgos:config-schema:runner:v1`: `runner` has no `additionalProperties: false` and no `loops`.
- The old `validateRunnerConfigShape` (`5d6e18827^2:src/runner/dispatch/config.mjs:1485`) has no allowlist of top-level keys.

The fence (SC-R3/R4) depends on marker 2, and the conversion bumps the marker only when it finds a retired key (`runner-config-conversion.mjs:99-101,156`).

Scenario: a project with no `patterns` key in its file, which is the normal case after Slice C, runs `fgos config set runner.loops.reviewed.maxRounds 1`. A worktree or machine still on the older release reads the file without refusing, ignores `loops`, and runs 2 rounds. A catalog entry, by contrast, is still refused by the old `ALLOWED_PATTERNS_KEYS`, so only `loops` leaks.

Smallest fix, no new row: inside `runner-patterns-config`, when the project origins show `runner.loops.*` and the marker is below 2, warn "set `runner.patterns.seatBinding.schema` to 2 so older releases refuse this file". The origins are already read at :588-592. Alternatively, put that sentence in the `@fgos:doc` of `runner.loops` in the standard.

## Low

### L1. The author's weak spot 3 points at the wrong file

`loops/reviewed.mjs:143,174` reads only `params?.maxRounds ?? DEFAULT_MAX_ROUNDS`. The fallbacks that still read config are in `src/runner/execution/seat-resolver.mjs`:

- **:412.** `params?.maxRounds ?? runnerConfig?.loops?.reviewed?.maxRounds ?? 2`. The only caller, `catalog.mjs:498`, always passes resolved params that include `maxRounds` (`catalog.mjs:395-410`), so the config read is dead. So is the `'research-fan-out' -> 4` special case at :406: it compares a pattern name with the loop.
- **:145-146.** `runnerConfig?.loops?.reviewed?.checkersByRigor || DEFAULT_CHECKERS_BY_RIGOR`. The code default at :40-45 has `critical: [reviewer, red-team]`, but the standard (`core/config-standard/runner.yaml:820`) has `[reviewer, red-team, tester]`. Any config without the standard layer, such as the named-file `--config` door or an injected config, gets a weaker critical floor.

Fix:
- Delete the runnerConfig read and the `research-fan-out` line at :406-412.
- At :145, use `shippedCatalog().loops.reviewed.checkersByRigor` as the floor source, or pass it in, and delete `DEFAULT_CHECKERS_BY_RIGOR`.

### L2. `assertUnitAcceptOutcomes` treats an unknown pattern name as `solo`

File: `src/workflow/case-start.mjs:248-257`.

- `?? (['solo','reviewed','panel','debate'].includes(pattern) ? pattern : 'solo')` copies `LOOP_NAMES` by hand.
- It turns a typo such as `reviwed` into "acceptOutcomes requires a reviewed template" instead of `unknown-pattern`.
- `loopOf` already resolves shipped names through the effective config, so the fallback only matters for injected configs.

Fix: `const loop = loopOf(pattern, { effective: runnerConfig }); if (loop === null) throw unknown-pattern`.

Related: `resolveStart` (:186), `preflightWorkflowSeats` (:223) and `prepareWorkflowRun` (:296) each read the config, so a start reads it three times. Return the config from `resolveStart`.

### L3. Reserved names and parameter lists are copied by hand

- `RESERVED_PATTERN_NAMES` is declared twice: `config.mjs:1310` and `catalog-entries.mjs:375`.
- The same names are deleted inline in `shipped-catalog.mjs:50-51`, `capability-plan-lint.mjs:71`, `registrations.mjs:667,717` and `catalog-entries.mjs:463-464`.
- `validateRunnerLoopsShape` hard-codes the rigor order (`config.mjs:1434`; use `RIGOR_VALUES`).
- It also hard-codes the bounded parameters, `loopName === 'reviewed' ? ['maxRounds'] : []` (:1452), and the per-loop keys (:1423), which copy the loop `PARAMS` tables (`loops/index.mjs:18-23`).

Fix: export one frozen name set from `retired-keys.mjs`, and derive the bounded parameters from `paramTableOf(loop)`.

### L4. `catalogLayersOf` makes a second door read for each run

Files: `run.mjs:776`, after `loadRunnerConfigForDir` at :625; `shipped-catalog.mjs:36-90`.

- The two reads can see different config revisions, so the pin's `layer` and the effective value can disagree.
- The returned map mixes three key spaces in one object: pattern names, `runner.patterns.x.y`, and `x.y`.
- The sub-path "first wins unless project" rule (:81) keeps `shipped` over a later `global`.

Fix: fold `runner.patterns` into the loader's single `origins` request (also needed for M3) and compute the layers from that one result.

### L5. Doctor `runner-patterns-config` fails on any finding in a JSON file

File: `registrations.mjs:516-548`.

Any finding in a JSON file fails this row, including the Config row `config-format-legacy-json`, which already fails in its own row with the exact migrate command (`packages/config/contracts/doctor-rows.v1.json:36-40`). The result is double reporting with weaker advice.

Fix: drop the JSON branch and let the Config row own it.

### L6. `capability-plan-lint` skips the unknown-pattern check when the catalog cannot be read

File: `src/report/capability-plan-lint.mjs:58-73,507`.

`try { shippedCatalog() } catch { {} }` plus `knownPatterns.size > 0` means the check is silently off when the addon is missing. Let the error propagate.

### L7. New import cycle between `config.mjs` and `retired-config-keys.mjs`

`config.mjs:36` imports `retired-config-keys.mjs`, which imports `RunnerConfigError` from `config.mjs:9`. It works today because nothing uses the import at the top level. The M2 fix removes the reason for the cycle: the pure function returns data, and `config.mjs` throws.

## Checked and fine

- Keys are declared once, in `core/config-schema/runner.schema.yaml` and `core/config-standard/runner.yaml`. `$id` is bumped to v2, every new node has a `description`, and `patterns` carries `x-fgos-merge: deep`.
- Marker: the schema `enum [1, 2]`, the standard writes 2, and `READABLE_SEAT_BINDING_SCHEMA_VERSIONS` reads 1 and 2.
- `snapshotRunnerConfig` hashes `loops` (`run.mjs:162`).
- `shippedCatalog()` reads only through `readStandardValue('runner')`, with no YAML parsing of its own.
- `patterns/catalog*.mjs` and `retired-keys.mjs` import no infra, so they are pure.
- A retired key in the global file, on the door path, names `~/.fgos/config.yaml:<line>:<col>` (`retired-config-keys.mjs:100-103`).
- The conversion never writes the global file. Its writes go through `fgos config patch` with `--reason`, and the patch format matches `unix_verbs.rs:124-160`.
- Doctor registers no `--fix` for `runner-patterns-config`, so it cannot loosen a floor.
- Precedence of project over global over standard comes from the Config door merge. No JavaScript merge exists.
- `checkCatalog` errors carry the source layer.
- `assertUnitAcceptOutcomes` runs at start (`case-start.mjs:188`) and at advance (`runner.mjs:356`).

## Ideas that would add a mechanism (owner's choice, not part of the fixes)

- **Moves in the migration table.** `migration.v1.json` would gain `moved: [{from, to}]`, so `fgos config migrate` carries `runner.patterns.reviewed.*` to `runner.loops.reviewed.*`. Reason: H1 has no tool-driven exit for JSON files. Benefit: older JSON projects convert in one command instead of by hand. Cost: a CFG-owned Rust change.
- **An `x-fgos-retired` schema annotation.** The Rust validator would name the retired child path and its replacement. Reason: M1 and M2 exist because the door cannot say which key is retired. Benefit: all the JS detection collapses into data. Cost: a CFG-owned schema-language change (plan CFG point 7).

## Unresolved questions

- **Q1.** Does `fgos config migrate` refuse a legacy JSON file holding `runner.patterns.reviewed.maxRounds`, as `migrate.rs` `compare` -> `snapshot_with` on the old bytes suggests? Would adding a path to `retired` let migrate go ahead, or does the old-bytes read refuse first? One run on a scratch project settles H1's fix shape.
- **Q2.** During a real upgrade, does `fgos setup` run after the new release is activated? `resolveActiveHostBin({ cwd })` (`runner-config-conversion.mjs:179`) shells out to the activated host. If setup runs first, the older host's v1 schema refuses the `runner.loops` write and the conversion reports `blocked`.
- **Q3.** For a parent-path violation (`runner.patterns.reviewed`, `additionalProperties`), the Rust snapshot attributes the file to the first origin under that path (`snapshot.rs:426-436`). Is it guaranteed to be the project or global layer and never the standard? If it can be the standard, `checkDoorRefusalsForRetiredKeys` falls through to the generic message. M2's fix removes this dependency either way.
