# Re-check, round two: pattern catalog config fixes

Reviewer: code-reviewer for lead:HARDEN, 2026-10-29 (Asia/Saigon). Read-only. The findings checked are N1 to N9 from `plans/reports/review-261029-0136-harden-recheck-pattern-catalog-config-fixes.md`. Commits checked: 8aa8963f1, 0fc858f24 and 3aa9859f3, on main at efd06c9cf.

## Verdict: PASS

Both blockers from round one are closed.

- **N1 (regression).** `fgos setup` now prints the global notice for every retired family.
- **N4 (test-only input).** The executing loop now gets the shipped checker floor from `run.mjs`. The fallback to the `standard` row is limited to rigors ranked below `standard`, and a probe with the hook removed refuses the run.

N2 and N5 to N9 are fixed. N3 is partial: detection now goes through one function, but that function still lists the retired keys by hand in its object branch and keeps two dead branches. That gap and the new findings below are all Low. None of them blocks landing; they are follow-ups.

## Evidence base

- **Focused tests.** I ran the nine test files these commits touched through `runChosenTests`, plus `test/runner/execution/loops/index.test.mjs`. Result: 327 tests, 327 pass, 0 fail.
- **The one ERROR line did not come from the tests.** It reported 73 files added under `.fgos/assignments/` in the main checkout. Those files belong to two unit runs (`unit-run-1793244365551-523cbf32`, started 10:26, and `unit-run-1793244470431-b33b2788`). The `unit.json` of the first run shows a real `fgos run` from the COOK lane: objective "Read …/cook-fix3-relock-brief.md and follow it exactly", worktree `forgent-worktrees/cook-config-fixes-3`. That run happened in the main checkout while my run was going. None of the files came from the test files.
- **Negative controls.** I ran two probe files through the same runner, under `/tmp/claude-1000/-home-vantt-projects-forgent/8e8e56bb-00a0-4158-ad04-ec29cabf8204/scratchpad/r2/`, using temporary HOME and project directories:
  - `/tmp/claude-1000/-home-vantt-projects-forgent/8e8e56bb-00a0-4158-ad04-ec29cabf8204/scratchpad/r2/probe-r2.test.mjs`
  - `/tmp/claude-1000/-home-vantt-projects-forgent/8e8e56bb-00a0-4158-ad04-ec29cabf8204/scratchpad/r2/probe-r2b.test.mjs`

  The output is in `/tmp/claude-1000/-home-vantt-projects-forgent/8e8e56bb-00a0-4158-ad04-ec29cabf8204/scratchpad/r2/probe.log`. The repository was not touched.

## Per-finding status

| Finding | Status | Evidence |
|---|---|---|
| N1. No global setup notice for tuning or gated keys | FIXED | `inspectGlobalRunnerConfig` calls `facade.checkConfig({ projectRoot, globalDir })` (`src/setup/runner-config-conversion.mjs:272`). That call reports per-child paths such as `runner.patterns.reviewed.maxRounds@global:config.yaml`. The function also reads the machine snapshot with origins (`:305`). Probes (each returns a notice that names the right key): `g-tuning`, `g-cbr`, `g-gated`, `g-default`, `g-mixed` and `g-tuning+gated`. In round one, `g-tuning` and `g-gated` returned `null`. A clean global file (`g-clean`) and a project-only retired key (`p-only`) return `null`, so the filter does not raise false global notices. `bin/fgos.mjs:4023` passes `{ projectRoot: repoRoot, globalDir }`. |
| N2. Patch body deleted values | FIXED | Each tuning key now gets a `set` on the replacement and an `unset` of the child key only. Probe `g-mixed` (`reviewed: {loop, promise, maxRounds}`) gave `[{set: runner.loops.reviewed.maxRounds, value: "<value>"}, {unset: runner.patterns.reviewed.maxRounds}]`, so the catalog fields survive. Values are filled in when the snapshot succeeds: `g-gated` gave `value: {loop: panel, promise: p}`. Otherwise the patch uses a `<value>` placeholder and prints the copy-first warning (`:395`). A collision with an existing replacement produces a "reconcile manually" edit and no `set` (`:332-344`; probe `g-tuning+dest`). If someone applies a `<value>` placeholder unedited, the door's schema refuses it, because a string is not an integer, list or object. So nothing is silently lost. |
| N3. Retired-key detection not one door | PARTIAL | Done: `retired-config-keys.mjs` and its manifest row are deleted, and no reference to it is left in `src`, `bin`, `test` or the manifest. `assertNoRetiredKeys` is deleted, so the second named-file pass is gone. The `mixed`/`kind`/`hasMaxRounds`/`baseMessage` fields are gone. Every caller, doctor included (`src/setup/registrations.mjs:527,556`), now calls `detectRetiredPatternKeys`. The dotted-path branch is table-driven (`retired-keys.mjs:28-40`). Not done: see F1. |
| N4. Shipped floor only reached tests | FIXED | Details in the "N4 production path and fallback limit" section below. `run.mjs:1582` passes `shippedCatalog().loops?.reviewed?.checkersByRigor` in the hooks to `runLoop`, which passes the hooks through (`loops/index.mjs:85`). `reviewed.mjs:179` reads only `hooks.shippedCheckersByRigor`; the `params` and `cfg` fallbacks are deleted. The module-level test wrappers and the fake `low` fixture row are gone (`test/runner/execution/seat-resolver.test.mjs`, `test/runner/execution/loops/reviewed.test.mjs`). |
| N5. JSON advice for a mixed entry said the whole key was retired | FIXED | Probe: `formatLegacyJsonAdvice` for `reviewed: {loop, promise, maxRounds}` now prints `runner.patterns.reviewed.maxRounds was retired; use runner.loops.reviewed.maxRounds instead`. A named file with both tuning keys gets one `config-key-retired` error that names both keys (probe `mixed` in probe-r2b). |
| N6. Shape-sniffing heuristic in three places | FIXED (residual in F3) | The sniffing is deleted from `checkCatalog` (`catalog-entries.mjs:362-366`), from `config.mjs` and with the wrapper module. Doctor passes `shipped.patterns` and the patterns map (`registrations.mjs:608`). Negative control: projects with a pattern named `loop`, `loops`, `patterns` or `runner` now load, resolve through `resolveCollaboration` without error, and pass doctor. In round one, `loop` hard-failed every resolution. The round-one disagreement is gone too: a pattern named `loops` with a bad default (`n6-loops-bad`) is now refused by both the loader and doctor (`passed: false`, "default parameter "bogus" is not read by loop "reviewed""). In round one, doctor was green while the loader refused. |
| N7. Finding codes in code comments | FIXED | The `// H1:` and `// M6:` comments now state the invariant instead (`runner-config-conversion.mjs:118`, `registrations.mjs:621`). A grep of the added lines of all three commits for `N#`/`M#`/`H#`/`L#`/`Q#`/`U#`/`tsk-`/`D-ADR`/phase finds nothing. |
| N8. Test seam in `resolveStart` | FIXED | `resolveStart` is no longer exported (`src/workflow/case-start.mjs:139`). It always calls `loadRunnerConfigForDir(mainRoot)` (`:186`). `prepareWorkflowRun` no longer returns `runnerConfig` (`:339`). The test is renamed to "prepareWorkflowRun loads runner config from disk exactly once", and its injection block is deleted (`test/workflow/workflow-runner.test.mjs:1678`). |
| N9. Orphaned JSDoc | FIXED | The `loadRunnerConfigForDir` doc block now sits directly above that function (`src/runner/dispatch/config.mjs:235-243`). |

## N4 production path and fallback limit

**The proof uses a real production path.**

- The new test "runUnit launches critical reviewed seats with shipped floor when injected config lacks checker rows" (`test/runner/execution/run-case-admission.test.mjs:508`) calls `runUnit` with `options.runnerConfig`.
- `options.runnerConfig` is a documented production input (`run.mjs:505`, "Runner config the caller already resolved (e.g. from `--config <path>`)"). Production code sets it: `src/runner/operation-choice.mjs` passes `runnerConfig: cfg`.
- `snapshotRunnerConfig` copies that config into the unit record without merging the standard rows (`run.mjs:152-163`). So the loop gets a config with no `checkersByRigor`, and only the hook supplies the floor.
- The test injects nothing into the hooks. The seats it asserts (producer, reviewer, red-team, tester) come from `run.mjs:1582`.
- **Negative control.** The same config and a `critical` unit through `runLoop` without the hook refuses: `configuration-error | missing checkersByRigor for rigor "critical"`. With the hook it passes, with the same four seats.

**The round-one bypasses are closed.** Supplying the floor as `params.shippedCheckersByRigor` or `cfg.shippedCheckersByRigor` is now refused with the same error, because those reads are gone.

**This also answers Q2 from round one.** `--config <path>` is a real production path where `checkersByRigor` arrives without the full set of rows. Before 3aa9859f3, such a run passed admission and then failed in the loop. It now runs with the shipped floor.

**The fallback is limited to rigors below `standard`.** `seat-resolver.mjs:147` sets `fallbackStandard = (RIGOR_RANK[rigor] ?? Infinity) < RIGOR_RANK.standard`. `RIGOR_RANK` is `low: 1, standard: 2, high: 3, critical: 4` (`src/runner/rigor.mjs:6-11`). An unknown rigor gets `Infinity`, so it does not fall back either.

Probe with a config that has only a `standard` row:

| Rigor | Without shipped table | With shipped table |
|---|---|---|
| low | `reviewer` (fallback to the `standard` row) | `reviewer` |
| standard | `reviewer` | `reviewer` |
| high | `configuration-error` | `reviewer, red-team` |
| critical | `configuration-error` | `reviewer, red-team, tester` |

**Tests.** The ordering gap from round one is now pinned by "shipped high row beats configured standard row for high rigor" (`seat-resolver.test.mjs`). The error for `high` and `critical` is asserted in the renamed fallback test. Both live in the module's owning file, so there is no second copy.

## New findings

### F1 (Low). The detector's object branch still repeats the retired-key table, and two branches are dead

The claim of "one table-driven detector" holds only for dotted paths.

**Keys listed by hand.** In `src/runner/execution/patterns/retired-keys.mjs:89-108`, the object branch names each retired key by hand: `defaultRule`, `RETIRED_GATED_NAME`, `reviewed.maxRounds` and `reviewed.checkersByRigor`. `catalog-entries.mjs:418` holds a third hard-coded copy (`name === 'reviewed' && (key === 'maxRounds' || key === 'checkersByRigor')`).

- **Failure scenario:** someone adds a nested retired key to `RETIRED_CONFIG_KEYS`, for example a future `runner.patterns.panel.foo`.
  - The door paths would report it.
  - The named-file `--config` path (`validateRunnerPatternsShape`), `checkCatalog`, the YAML conversion and the JSON advice would not. Those four inspect objects.
  - `checkCatalog` would report it as an unknown key instead of a retired one.
- **Fix:** walk each table key's segments after `runner.patterns.` against the object. That replaces the hand-written lines with one loop.

**Dead code.**

- The `Array.isArray(input)` branch (`:56-71`) has no caller. Every caller passes either a dotted string or a patterns map.
- The "objects directly keyed by full path" branch (`:110-115`) has no caller either. It only matches a pattern literally named `runner.patterns.defaultRule`.
- `RETIRED_GATED_NAME` was newly exported by 8aa8963f1 (`:4`) and nothing imports it.

**Small leftovers.**

- Five call sites still each build their own "`<key>` was retired; …" sentence: `config.mjs:220`, `config.mjs:1330`, `catalog-entries.mjs:377`, `runner-config-conversion.mjs:65` and `registrations.mjs:530,559`. Doctor rebuilds the instruction from `replacement` instead of using the table's `instruction`. The texts happen to match today.
- The comment "Reserved names and both-shapes check" (`catalog-entries.mjs:382`) still names the classification that was dropped.

### F2 (Low). `coverageNote` prints a false statement on every global notice

- **Where:** `runner-config-conversion.mjs:404` sets `coverageNote: 'A schema-valid gated entry coexisting with a configuration refusal will be reported after fixing current errors and running setup again.'` on every notice. `bin/fgos.mjs:4756` prints it.
- **Why it is false:** the round-one text was written when only `readMachineConfig` was consulted. Since the switch to `checkConfig`, that case is reported on the first run.
  - Probe `g-tuning+gated`: a refused `reviewed.maxRounds` next to a schema-valid gated entry. The notice lists both edits on the first run.
  - The author's own test case 6 asserts the same thing (`test/setup/runner-config-conversion.test.mjs`, "global config inspection detects all four retired key families…").
- **Scenario:** a user with only a global `defaultRule` reads that something may be reported later and runs setup again for nothing.
- **Fix:** delete the field and its two render lines.

**Related.** When every tuning key collides with an existing replacement (probe `g-tuning+dest`), the notice still prints the `fgos config patch … --global` command with `patch body: []`. That tells the user to apply an empty patch. Omit the command and the body when `patch` is empty.

### F3 (Low). One shape guess was added back, and two dead inputs remain

8aa8963f1 removed the sniffing from `checkCatalog`, but it added `const shippedPatterns = shipped?.patterns ?? shipped;` to `resolveCollaboration` (`src/runner/execution/patterns/catalog.mjs:81`).

- All five production callers pass the full `shippedCatalog()`: `run.mjs:775`, `workflow/runner.mjs:379`, `case-start.mjs:232`, `dry-bind.mjs:77` and `seat-binding-checks.mjs:61`.
- So the `?? shipped` branch only serves a caller that passes the map itself. That is the same "guess which shape you got" pattern N6 asked to remove.
- No user-named pattern reaches it today, because the shipped map is fixed. That is why this is Low.

`options.shippedCheckersByRigor` in `resolveCollaboration` (`catalog.mjs:489`, added in 512e63f4a) has no caller in `src`, `bin` or `test`. It is the admission-side twin of the `params`/`cfg` fallbacks that 3aa9859f3 deleted from the loop. Delete both the fallback and the option.

### F4 (Low). The old string signature of `inspectGlobalRunnerConfig` is kept only for two tests

- **Where:** `runner-config-conversion.mjs:260-263` still accepts a bare `globalDir` string and then uses `process.cwd()` as `projectRoot`. The only production caller passes the object form (`bin/fgos.mjs:4023`). The string form is used only by two older tests (`test/setup/runner-config-conversion.test.mjs:233,390`).
- **Why it matters:**
  - This breaks L10: move every caller and delete the old path.
  - Those two tests now run `checkConfig` against whatever checkout the test process starts in, which is the real forgent repository. Their result therefore depends on that repository's own `.fgos` config.
- **Scenario:** a project-file refusal in the repository's own config is concurrently edited by another lane. `checkConfig` then throws, and these tests run on refusal data instead of findings.
- **Fix:** switch both tests to `{ projectRoot: projectDir, globalDir }`, then delete the string branch.

### F5 (Low). One test now duplicates another, and one refusal can repeat

**Duplicate proof (design principle 8).** "checkCatalog detects retired tuning when a custom pattern named patterns exists" (`test/runner/execution/patterns/catalog.test.mjs:292`) existed to prove that the sniffing did not misread a pattern named `patterns`. With the sniffing deleted, it now feeds the plain map. It asserts the same behaviour as "checkCatalog reports config-key-retired for reviewed mixing catalog fields with retired tuning" just above it. Retire it, or fold its one extra assertion (that a pattern named `patterns` is kept in `entries`) into that test.

**Repeated line.** The loader's combined error can name the same key twice. Probe `p-two`: `runner.patterns.reviewed.checkersByRigor` was reported at `4:46` and again at `4:64`, because `checkConfig` reports the key and its `.standard` child.

- **Cause:** `checkDoorRefusalsForRetiredKeys` dedupes on the whole message, and the message includes the position (`config.mjs:211-224`).
- **Fix:** dedupe on `key` plus file.

## Confirmed left open on purpose (not re-reported)

M3, L3–L6 and Q1 are unchanged, as agreed. The same goes for the two Lows: the project file location label, and the one backup per setup run when the door refuses. The test "handles retired keys in both project and global scopes…" still asserts that backup.

## Unresolved questions

- **Q1 (carried over, not re-run).** Does `fgos config migrate` accept a legacy JSON file once the retired keys have been edited by hand?
- **Q4.** Should F1's table-driven object walk also replace the hard-coded skip at `catalog-entries.mjs:418`? That needs `checkCatalog` to ask the leaf module "is `<pattern>.<key>` a retired path?". A one-line export would do it, but it widens the leaf module's API, and that is a choice for the owner.
- **Q5.** Should a real `fgos run` be allowed to execute in the main checkout while a lane runs `runChosenTests` there? The leak check reports that run's files as a suite leak. This is coordination with COOK, not a defect in these commits.

Status: DONE
Summary: Verdict PASS. N1, N2 and N4 to N9 are fixed, with negative controls that confirm N1, N4 and N6. The N4 floor runs through a real production `runUnit` path, and the fallback covers only rigors below `standard`. N3 is partial and four more Low follow-ups were found (F1–F5); the focused tests are 327 of 327 green.
Concerns/Blockers: The single ERROR line in the focused run is a leak report caused by a concurrent COOK-lane `fgos run` in the main checkout (two unit runs under `.fgos/assignments/`), not by these commits or their tests.
