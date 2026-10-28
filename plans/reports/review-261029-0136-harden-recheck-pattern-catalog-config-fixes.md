# Re-check: fixes to the pattern catalog config review

Reviewer: code-reviewer for lead:HARDEN, 2026-10-29 (Asia/Saigon). Read-only. Source of findings: `plans/reports/review-261028-2257-harden-review-pattern-catalog-config.md`. Commits checked: cd41723a1, 33e8310ee, e29e82dd0, 512e63f4a, d28e347c7, 5e3860a26, 7bb8f3efa, on main at a85c7d14f.

## Verdict: CHANGES

Most of the fixes close their findings. Three problems remain:

1. A regression in the M5 fix. `fgos setup` no longer prints any global guidance for the most common retired global key (`runner.patterns.reviewed.maxRounds`). It prints none for `research-fan-out-gated` either. Only `defaultRule` still works, and that is the only case the new test covers.
2. The shipped checker floor reaches admission but not execution. `runReviewed` reads it from a hook that no production caller sets, and the tests inject that hook. Together with the 7bb8f3efa fallback, a table that lacks a high or critical row then silently takes the `standard` row.
3. The 33e8310ee shape-sniffing heuristic is copied into three places. With some pattern names it misreads the input: one name hard-fails every run, and another lets doctor pass while the runner refuses.

## Evidence base

- **Focused tests.** I ran the nine test files the commits touched through `runChosenTests`. Result: 283 pass, 0 fail. The run printed no ERROR lines.
- **Negative controls.** I ran two scratch probes through the same runner, as files under the session scratchpad. They used temporary HOME and project directories and never touched the repository. The quoted results below come from those runs.

## Per-finding status

| Finding | Status | Evidence |
|---|---|---|
| H1. Legacy JSON with a retired key has no printed exit | FIXED (setup and doctor) | `src/setup/runner-config-conversion.mjs:52-68,117-124`: a `.json` target returns `blocked` with no backup and no door call, and lists the per-key edits. It ends with "edit `<file>`, then run `fgos config migrate`". Doctor uses the same text (`src/setup/registrations.mjs:521,548,574,577,583`). Probe: a JSON file with `reviewed.maxRounds` produced "runner.patterns.reviewed.maxRounds was retired; use runner.loops.reviewed.maxRounds instead; edit …/config.json, then run `fgos config migrate`". Residuals: runner verbs on such a project still print the raw door text (`config-schema project:config.json:1:66 runner.patterns.reviewed (additionalProperties)`), and the wording problem in N5 below. Q1 (does migrate accept the file once it has been edited) is still unverified. |
| M1. Five retired-key detectors that disagree | PARTIAL | Concrete wrong result closed: tuning detection is now limited to `reviewed` (`src/runner/execution/patterns/retired-keys.mjs:77-108,166-223`). Probe: `patterns.panel: {maxRounds: 3}` and `my-pat: {loop: reviewed, maxRounds: 2}` now get `config-schema … (additionalProperties)`, not `config-key-retired`. The consolidation is not done (see N3). |
| M2. Loader re-reads the config with raw fs | FIXED | The raw re-read is gone. `checkDoorRefusalsForRetiredKeys` calls `checkConfig({ projectRoot })` once (`src/runner/dispatch/config.mjs:204-233`). Residual (Low): a project-file location now prints as the door label `project:config.yaml:4:32` rather than a path, while global prints `~/.fgos/config.yaml`. The deleted code mapped both to real paths, and doctor still does (`registrations.mjs:500-515`). |
| M4. Dead branch, test seam, restore, unreachable branch, backup litter, swallowed error, plan jargon | FIXED, with residuals | Gone: `applyPatch ?? patch`, the restore `copyFileSync`, `globalPending`, the swallowing second detector and the "U6" text. The opening load check now always runs (`:85-91`). `patchDoor` now only swaps the writer, which is the shape the review allowed. The backup is taken after every pre-check (`:178-182`). Residual (Low): a door refusal still leaves one backup per `fgos setup` run, and the test now asserts that it does (`test/setup/runner-config-conversion.test.mjs`, "stops and reports blocked…"). Example: a project blocked by a global retired key gains a backup on every setup run. |
| M5. The printed global command cannot be applied from inside the project | PARTIAL, with regression | The wording now says "from a directory outside any fgOS project", and the patch body is printed (`runner-config-conversion.mjs:283-291`, `bin/fgos.mjs:4755-4765`). The notice no longer fires for tuning or gated keys (N1). If the tuning branch ever did fire, its patch would only unset the entry (N2). |
| M6. Hand-written `runner.loops` without marker 2 | FIXED | Doctor warns when project origins show `runner.loops.*` and the project marker is absent or below 2 (`registrations.mjs:615-623`). Four cases are covered in `test/setup/registrations.test.mjs`. |
| L1. Seat resolver config fallbacks | PARTIAL | `DEFAULT_CHECKERS_BY_RIGOR`, the `research-fan-out -> 4` line and the config `maxRounds` read are deleted (`src/runner/execution/seat-resolver.mjs:409-418`). The shipped floor is passed in only from `resolveCollaboration` (`src/runner/execution/patterns/catalog.mjs:488-521`). The executing loop never receives it (N4). |
| L2. Unknown pattern treated as `solo` | FIXED | `src/workflow/case-start.mjs:247-262` refuses `unknown-pattern`. A start now reads the config once, or twice with `--seats`, because `bin/fgos.mjs:2317` calls `preflightWorkflowSeats` and then the start, and each calls `resolveStart`. It used to read it three times. |
| L7. Import cycle | FIXED | `config.mjs` no longer imports `retired-config-keys.mjs`. That module imports only `retired-keys.mjs`. |

## Judgement on the chosen behaviour change

The change: on the project or global file path, a `reviewed` entry that holds both catalog fields and tuning fields reports `config-key-retired`.

- **Is there a printed way out?** Yes. Probe (`reviewed: {loop: reviewed, maxRounds: 2}` in the project YAML) printed `project:config.yaml:4:32: runner.patterns.reviewed.maxRounds was retired; use runner.loops.reviewed.maxRounds instead.`
  - The message names the exact child key and where it moves to.
  - Following it leaves `reviewed: {loop: reviewed}`, which is a valid partial override.
  - For YAML, `fgos setup` also converts it with the tool. `hasModern` unsets only the child keys (`runner-config-conversion.mjs:148-172`).
  - The H1 concern does not apply here.
- **Is the message correct and actionable?** Yes, with two caveats:
  - Only the first retired child is reported per run. With both `maxRounds` and `checkersByRigor`, the user fixes one, runs again, and gets the second.
  - It recreates the M1 complaint that the same input gets a different code depending on the door. The named-file `--config` path throws a plain "cannot combine pattern catalog fields with retired loop tuning" error with no code (probe `d-named-mixed`).

  The smaller and more consistent option is to delete the `mixed` classification. Both paths would then emit one `config-key-retired` per tuning key. That removes code and does not add any (RUL104).

## Check of 7bb8f3efa (standard-row fallback)

- **Order.** `configured[rigor] → shipped[rigor] → configured.standard → shipped.standard` (`seat-resolver.mjs:136-153`). Where the shipped table is passed in, a project's `standard` row never shadows a shipped high or critical row, which is correct. Through the door, the configured table is merged with the standard and so always holds the `standard`, `high` and `critical` rows. On that path the fallback only fills `low`, which is the intended fix.
- **Can it pick a wrong row?** Yes, when the shipped table is absent, which is always the case in `runReviewed` (N4). A table without a `critical` row then gets the `standard` row with no error. Probe: `checkerPlanOf({rigor: 'critical'}, {loops: {reviewed: {checkersByRigor: {standard: ['reviewer']}}}}, {})` returned `reviewer`. Before this commit the same call threw `missing checkersByRigor`.
  - The comment "low, or one a project did not declare" names that second case as intended.
  - Falling back upward to `standard` is safe only for rigors ranked below `standard`. Limit the fallback to `RIGOR_RANK[rigor] < RIGOR_RANK.standard`.
- **One owning test?** Yes. `test/runner/execution/seat-resolver.test.mjs:223` replaces the old "throws" test rather than adding a second one. Two gaps:
  - It does not pin the important ordering, that shipped `high` beats configured `standard`.
  - The module fixture at `:13-16` adds a `low: ['reviewer']` row that the shipped catalog does not have. Every test that uses the wrapped helpers therefore runs against a floor that production never builds.

## New findings

### N1 (Medium, regression). `fgos setup` prints no global notice for a retired `reviewed` tuning key or the gated name

- **Where:** `src/setup/runner-config-conversion.mjs:254-296`.
- **Cause:** `inspectGlobalRunnerConfig` now passes each `readMachineConfig` refusal path through `detectRetiredPatternKeys`. For `reviewed: {maxRounds: 3}`, the door's only refusal is at the parent path. Probe: `[{"id":"config-schema","path":"runner.patterns.reviewed","file":"global:config.yaml"}]`. The detector returns `[]` for `runner.patterns.reviewed`, so the function returns `null`. `research-fan-out-gated: {loop: panel}` is schema-valid, so `readMachineConfig` does not refuse at all, and the result is `null` again.
- **Before e29e82dd0:** the prefix match on `runner.patterns.reviewed` did fire for the tuning case.
- **Scenario:** a user's `~/.fgos/config.yaml` holds the pre-Slice-C default `runner.patterns.reviewed.maxRounds: 2`. `fgos setup` in any project prints no global guidance. Runner verbs and doctor still name the key, so a way out exists, but the M5 fix's main purpose is lost.
- **Why the test missed it:** the only test asserts a `defaultRule` global file.
- **Dead code:** the `tuning` and `gated` branches at `:275-282` cannot be reached through this door.
- **Fix:** use `checkConfig` here, which reports per-source child paths, the same way the loader already does. That leaves one door, removes the dead branches, and needs one test with a `reviewed.maxRounds` global file.

### N2 (Medium). The printed global patch body deletes the user's values instead of moving them

- **Where:** `runner-config-conversion.mjs:275-282`.
- **Problem:** the edit text says "move runner.patterns.reviewed to runner.loops.reviewed" and "rename … research-fan-out-gated to … research-fan-out". The patch body holds only `{unset: …}` items.
- **Scenario:** once N1 is fixed so the branch fires, a user who applies the printed patch loses their global `maxRounds` and `checkersByRigor`, or their whole gated pattern entry. A mixed global `reviewed` entry would also lose its catalog fields, because the whole key is unset.
- **Fix:** either emit `set` items with the values (the parsed global file is available, or `checkConfig` origins give positions), or print the body as a template and say in plain words that the values must be copied first.

### N3 (Medium). Retired-key detection is still not one door

The table does not drive detection:

- `detectRetiredPatternKeys` hard-codes each key twice: once in the string branches (`retired-keys.mjs:50-121`) and once in the object branches (`:137-223`). It looks up the table only for the instruction text.
- Doctor still runs its own exact-match table lookup with its own message template (`registrations.mjs:526-529,552-555`). It misses child paths such as `runner.patterns.research-fan-out-gated.loop`, which the detector's prefix match accepts.
- The named-file `--config` path runs the detector twice with two templates: `assertNoRetiredKeys` (`config.mjs:239-254`), then again in `validateRunnerPatternsShape` (`:1341`).

Dead output left behind:

- The `kind`, `hasMaxRounds` and `hasCheckersByRigor` fields have no reader.
- `retiredKeysIn` (`src/runner/dispatch/retired-config-keys.mjs`) now only wraps and re-exports for two callers.
- `formatLegacyJsonAdvice` reads `r.baseMessage` (`runner-config-conversion.mjs:64`), but `retiredKeysIn` never sets that field, so the `??` fallback always runs.

Fix: as in the original M1.

- One table-driven function that maps a dotted path to `{key, replacement, instruction}`.
- Every caller, doctor included, formats from it.
- Delete the unused fields, the wrapper module and the second named-file pass.

### N4 (Medium). The shipped floor is wired only into tests, not the run path

- **Where:** `src/runner/execution/loops/reviewed.mjs:177` reads `hooks.shippedCheckersByRigor ?? params.shippedCheckersByRigor ?? cfg.shippedCheckersByRigor`. No production code sets any of the three. The production call is `run.mjs:1572` → `loops/index.mjs:85`, and it passes only `runRole`, `verify`, `history` and `hasLaunchRoom`.
- **How the tests pass:** 7bb8f3efa made the failing loop tests pass by adding the hook in `test/runner/execution/loops/index.test.mjs:54` and `test/runner/execution/run-case-admission.test.mjs:322`, and `reviewed.test.mjs` wraps `runReviewed` to add it. That is a test-only input, which AGENTS.md L5 forbids: "fix production code or the fixture instead".
- **Probes:**
  - `runReviewed(unit, {}, {runRole})` throws `missing checkersByRigor for rigor "standard"`.
  - With a configured table that lacks `critical`, the run takes the `standard` row silently (see the 7bb8f3efa section).
- **Practical exposure is narrow but real.** Door-loaded configs carry full rows. The exposure is injected configs, and legacy-decoded snapshots (`src/runner/execution/legacy-seat-read.mjs:181-191`) whose stored `patterns.reviewed` lacks a row.
- **The changelog line overclaims.** It says "a config with no standard layer now gets the standard `critical` checker floor", which holds for admission only.
- **Fix:** pass `shippedCatalog().loops.reviewed.checkersByRigor` once from `run.mjs` into the hooks, and delete the `params` and `cfg` fallbacks. Then drop the test wrappers and the fake `low` fixture row.

### N5 (Low). JSON advice for a mixed entry says the whole `reviewed` key was retired

Probe (`config.json` with `reviewed: {loop, promise, maxRounds}`) printed `runner.patterns.reviewed was retired; move tuning to runner.loops.reviewed`. A user who reads "was retired" may delete their catalog override. The cause is that the `mixed` finding is formatted with the retired-key template. It goes away if the `mixed` classification is dropped, as the behaviour-change section suggests.

### N6 (Low to Medium). Shape-sniffing heuristic copied three times

- **Where:** 33e8310ee added `!('loop' in x.patterns || 'promise' in x.patterns)` at `config.mjs:242`, `retired-config-keys.mjs:18` and `catalog-entries.mjs:362-378`. It guesses whether the input is a runner object or a patterns map. The commit title says "typed boundaries", but the code sniffs the input's shape.
- **Probe, pattern named `loop`:** with the `{patterns: map}` shape that `catalog.mjs:81` passes, `checkCatalog` reads the whole map as one pattern named `patterns`. It reports `custom pattern "patterns" must declare a valid "loop"…`. With `throwOnError`, every `resolveCollaboration` in that project fails, naming a pattern that does not exist.
- **Probe, pattern named `loops`:** this one predates the commit. With a bad default, doctor `runner-patterns-config` returned `passed: true, "valid and cumulative"`, while `loadRunnerConfigForDir` refused the same file (`contains unknown key "bogus"`). Doctor is green while every runner verb fails.
- **Fix:** every caller passes the patterns map itself, at one typed boundary (`catalog.mjs:80` already computes it). Delete the sniffing in all three places.

### N7 (Low). Finding codes in code comments

`src/setup/runner-config-conversion.mjs:117` (`// H1: …`) and `src/setup/registrations.mjs:615` (`// M6: …`). The stable-artifacts rule rules out audit labels in code. State the invariant instead.

### N8 (Low). Test-only seam and a single-read proof that needs it

- **Seam:** d28e347c7 exports `resolveStart` and adds a `params.runnerConfig` input (`src/workflow/case-start.mjs:139,186`). It also adds `runnerConfig` to the return value of `prepareWorkflowRun`. No production caller passes or reads either one: `case-verbs.mjs:87,125` destructure without it.
- **Test:** `test/workflow/workflow-runner.test.mjs:1678` proves the single read partly through that injection. Its last block, a fresh `prepareWorkflowRun` that reads once, is the real proof and is enough by itself.
- **Fix:** drop the `params.runnerConfig` input and the extra return field, and keep the last block.

### N9 (Low). Orphaned JSDoc

`config.mjs:192-199` documents `loadRunnerConfigForDir`. The new function was inserted between that comment and the function, so the comment now sits above `checkDoorRefusalsForRetiredKeys`.

## M3 and L3–L6: confirmed untouched

| Finding | State on main |
|---|---|
| M3 | Unchanged. `config.mjs:262` still requests origins only for `runner.modelPolicies` and `runner.rigorToTier`. The merged-value label `${dir}/.fgos runner` is unchanged. Probe `g-gated` shows the known symptom: a gated key in the global file is reported against `<project>/.fgos runner`. |
| L3 | Unchanged. `RESERVED_PATTERN_NAMES` is still declared at both `config.mjs:1353` and `catalog-entries.mjs:381`. |
| L4 | Unchanged. `run.mjs:776` still calls `catalogLayersOf(mainRoot)`, a second door read. |
| L5 | Structure unchanged: any JSON finding still fails the row. Its message text was swapped to `formatLegacyJsonAdvice` as part of H1, not as a partial L5 fix. Note that the richer text makes the double reporting with the Config row larger. |
| L6 | Unchanged. `capability-plan-lint.mjs:58-65` still has `try { shippedCatalog() } catch { {} }`. |

None of these is half-done.

## Recommended order

1. **N1 + N2 together.** Move `inspectGlobalRunnerConfig` to `checkConfig`, emit a moving patch body, and add one test with a global `reviewed.maxRounds`.
2. **N4.** Pass the shipped floor from `run.mjs`, delete the fallbacks, and remove the test hook injection and the fake `low` row. Also restrict the 7bb8f3efa fallback to rigors below `standard`.
3. **N3 + N5.** One table-driven detector, and drop `mixed`.
4. **N6, N7, N8, N9.** Small deletions.

## Unresolved questions

- **Q1 (carried over).** Does `fgos config migrate` accept a legacy JSON file once the retired keys have been edited by hand? The H1 advice depends on it. I did not run it, because it needs the activated host with the v2 schema.
- **Q2.** Is the exposure in N4 limited to injected configs and legacy snapshots, or does a path exist where the configured `checkersByRigor` arrives without a full set of rows? One example would be a project that sets the table with replace semantics. If such a path exists, N4 rises to High.
- **Q3.** Should a pattern named `loop`, `loops`, `promise` or `runner` be reserved by the schema instead? That would make N6 moot, but it is a schema change owned by CFG.

Status: DONE_WITH_CONCERNS
Summary: H1, M2, M4, M6, L2 and L7 are fixed. M1, M5 and L1 are partial: the M5 fix lost the global setup notice for tuning and gated keys, and the shipped floor reaches tests but not the run path. The chosen behaviour change for mixed entries gives a correct, actionable way out. M3 and L3–L6 are untouched.
Concerns/Blockers: Verdict is CHANGES because of N1 (a regression) and N4 (a test-only input path, which AGENTS.md L5 rules out). The focused tests are green: 283 of 283 pass.
