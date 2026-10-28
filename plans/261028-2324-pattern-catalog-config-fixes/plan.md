---
title: "Pattern catalog Part A: fixes from the HARDEN config review"
description: "Core fixes for the retired-key mechanism, the conversion and the doctor row, from plans/reports/review-261028-2257-harden-review-pattern-catalog-config.md"
status: pending
---

# Pattern catalog Part A: fixes from the HARDEN config review

Owner decision (2026-10-28, option A): fix the core group in a new small case. Frame: 8 dispatches, 4 writing, rigor standard. Base: main after `5d6e18827`. M3 and L3 to L7 (except L7, which falls out of S1) are out of scope; they become a separate item.

## Outcome

One retired-key detector driven by `RETIRED_CONFIG_KEYS`; no raw file read in the loader; a legacy JSON project with a retired key is told exactly what to edit; the conversion module has no dead branch, no test-only seam and no write around the config door; the printed global command is applicable; a hand-written `runner.loops` under marker 1 warns; two stale fallbacks in the resolver are gone.

## Non-goals

- No change to `packages/config` (Rust) or `migration.v1.json` (question Q1 of the review stays open; the JSON fix is a message, not a mechanism).
- No `x-fgos-retired` schema annotation, no `moved` migration table (the review's ideas section; owner's choice later).
- No docs/ change (the owner asked not to touch docs/ while DOC works).
- M3 (error origin of JS-only validations) and L3, L4, L5, L6 are a separate item.

## Slices (writing, sequential)

1. **Detector and loader** (review M1, M2, L7). In `src/runner/execution/patterns/retired-keys.mjs` one pure function takes dotted paths (or the patterns object) and returns `{key, replacement, instruction}` driven by `RETIRED_CONFIG_KEYS`; tuning keys (`maxRounds`, `checkersByRigor`) count as retired only under the entry `reviewed`; every other pattern holding them is a plain unknown key, not retired. All callers format from that result: `config.mjs` (`validateRunnerPatternsShape`), `catalog-entries.mjs` (`checkCatalog`), `retired-config-keys.mjs`, `registrations.mjs`, `runner-config-conversion.mjs`. Delete the per-caller `kind` branches and every `meta?.instruction ?? '<copy>'` fallback. In the loader, on a `ConfigDoorError` call `checkConfig({ projectRoot })` once, map its retired child paths through the one function and delete the raw `fsp.readFileSync` plus `parseYaml` re-read in `retired-config-keys.mjs` (this also removes the import cycle with `config.mjs`: the module returns data, `config.mjs` throws). Keep every error code and message text that a test pins, unless the pinned text was the wrong advice for the `panel` case.
2. **Conversion and doctor** (review H1, M4, M5, M6). `convertRunnerPatternsConfig`: for a `.json` target make no backup and do not call the door; return `blocked` with the per-key hand edits from the one detector and end with "edit `<file>`, then run `fgos config migrate`"; doctor `runner-patterns-config` uses the same text instead of "migrate the file format first". Remove the dead `facade.applyPatch ?? facade.patch` branch, the `patchDoor` flow switch (a writer can be injected without skipping the opening load check; or the test drives the real door with `FGOS_HOST_BIN`), the raw `copyFileSync` restore after the door wrote (report `converted` with the remaining validation error), the unreachable `globalPending` branch, the second hand-coded detector, and the plan jargon ("question U6 / Branch A") in user output. Make the backup copy just before the door call, after every pre-check that can block. The printed global command says to run it from a directory outside any fgOS project and prints the patch body; `inspectGlobalRunnerConfig` routes through the one detector. Doctor: when the project origins show `runner.loops.*` and the marker is below 2, warn "set `runner.patterns.seatBinding.schema` to 2 so older releases refuse this file".
3. **Resolver fallbacks and unknown pattern** (review L1, L2). `seat-resolver.mjs`: delete the dead `runnerConfig?.loops?.reviewed?.maxRounds` read and the `research-fan-out -> 4` special case (:406-412); the critical floor at :145 comes from the shipped catalog's `loops.reviewed.checkersByRigor` (passed in if the layering forbids the import), and `DEFAULT_CHECKERS_BY_RIGOR` is deleted so a config without the standard layer gets the standard floor (`reviewer, red-team, tester` for `critical`). `assertUnitAcceptOutcomes`: an unknown pattern throws `unknown-pattern` instead of being treated as `solo`; `resolveStart` returns its config so a start reads it once.

## Decisions added after the read-only lock pass

- Backup policy: the backup copy is made only immediately before the door call, after every pre-check. A refusal by the door itself keeps its backup (a test pins that for a global retired key); a refusal before the door (legacy JSON, gated/modern conflict) leaves none. "Blocked setup leaves no backup" below means pre-check refusals.
- The mixed-shape classification stays: an entry holding catalog fields and retired tuning is a plain config error ("cannot combine pattern catalog fields with retired loop tuning", pinned at `test/runner/dispatch-config-patterns.test.mjs:333,461`), distinct from pure retired tuning (`config-key-retired`, "runner.patterns.reviewed.maxRounds was retired", pinned at :363,476). The one detector returns both kinds; only the formatting is shared.
- `acceptOutcomes` on a known non-reviewed pattern keeps its message ("requires a reviewed template", pinned at `test/workflow/workflow-runner.test.mjs:1649,1655`); only a name the catalog does not know becomes `unknown-pattern`.
- Slice 3's line numbers: the research-fan-out branch starts at `seat-resolver.mjs:405`, the config `maxRounds` read at :412, the critical floor at :145.
- The review report lives only in the shared checkout (`/home/vantt/projects/forgent/plans/reports/review-261028-2257-harden-review-pattern-catalog-config.md`); briefs name that path.

## Acceptance

- `npm test` green, `cargo test --workspace` unchanged (no Rust change), census clean.
- A test per behaviour: `panel: {maxRounds: 3}` in a named config is an unknown key with no retired advice; a `.json` project with `reviewed.maxRounds` gets a blocked result naming the edit, makes no backup file and calls no door; blocked setup leaves no backup; a project-file refusal for a retired key names the file without the loader reading it a second time; marker-1 project with `runner.loops` warns in doctor; `acceptOutcomes` with a typo pattern is `unknown-pattern`; the critical floor includes `tester` with no standard layer.
- Behaviours that deleted tests proved keep one named owner.

## Risks

| Risk | Mitigation |
|---|---|
| a test pins the old wrong advice for `panel` | retire it with the named owner of the corrected behaviour; say so in the summary |
| `checkConfig` is slower than the raw read on the refusal path | it runs only after a refusal |
| layering forbids the shipped-catalog import in `seat-resolver.mjs` | pass the floor in from the caller |

## Rollback

Revert the three slice commits; nothing else depends on them.

## Amendments adopted after the validate-plan pass (binding; they replace the matching text above)

Source: `validation-report.md` in this directory. Slices stay sequential: S1, S2, S3, each valid on its own.

**S1.**
- Frame conflict resolved by the conductor: the Config door returns paths, never values, so a source-local "also holds catalog fields" answer does not exist without a Config change (out of scope). Decision: where the whole object is in hand (named-file input at `config.mjs:243`, `checkCatalog`) the detector keeps both classifications (mixed shape: plain config error "cannot combine pattern catalog fields with retired loop tuning"; pure tuning: `config-key-retired`). At the door path (a project or global file refused by the door) a `reviewed` entry holding tuning is reported as `config-key-retired` with the advice to move it to `runner.loops.reviewed`; the mixed-shape message is not produced there. The door-path mixed test (`dispatch-config-patterns.test.mjs` about :461) is rewritten to assert the refusal, the code, the file and the advice, and the summary names that change. Reversal condition: if the owner wants the distinct message at the door, keep one read of the offending file through a Config-owned inspection API (a CFG item), not raw fs.
- The detector returns a structured result: `code`, classification, entry name, key, replacement, instruction; callers add file, label and layer formatting; throws move into `config.mjs`; no import back from `config.mjs`. Update `assertNoRetiredKeys` and its use at `config.mjs:243`, and the refusal mapper at `config.mjs:208`, in the same slice. The conversion caller migrates to the new return contract in this slice.
- `catalog-entries.mjs` skips `maxRounds` and `checkersByRigor` unconditionally for every pattern (about :423): remove the skip for non-reviewed entries so the key is reported `param-unknown` with no `runner.loops.<name>` advice, and do not report a second error for reviewed tuning the detector already owns.
- The message-preservation exception is: advice that wrongly classifies tuning under any non-reviewed pattern as retired. Reviewed mixed-versus-pure codes and the pinned substrings stay. Correct pin references: mixed shape = direct message `:333`, named-file non-retired code `:363`, project-file message and code `:461`; pure retired = direct `:328`, named-file advice `:353`, project-file child-key message and code `:476`.
- Tests: `dispatch-config-patterns.test.mjs` (named input, YAML project and global paths, unrelated errors still reported as themselves, `panel.maxRounds` unknown key, one refusal-door wiring proof), `execution/patterns/catalog.test.mjs`, and `setup/runner-config-conversion.test.mjs` only if the helper contract changes. `test/architecture.test.mjs` is a guard; do not loosen it.

**S2.**
- Doctor never calls `convertRunnerPatternsConfig` (it can write). One shared read-only inspection and formatting path produces the per-key hand edits for a `.json` file from the file's own parsed content (conversion already parses its target). Keep the cause identifier `config-format-legacy-json` (pinned at `runner-config-conversion.test.mjs:389`) and correct the advice to edit-then-migrate in every migrate-first branch (`registrations.mjs` about :519-522, :546-548, :572-582); rewrite the pin at `test/setup/registrations.test.mjs:823-836`.
- `bin/fgos.mjs` about :4747-4753 rebuilds global advice from file, edits and command and ignores `notice.message`: update that formatter too, so the outside-any-project instruction and the patch body appear in both the JSON data and the human output.
- After a successful door write return `converted` with written paths, the backup and a named remaining-validation diagnostic that setup prints; never restore old bytes; test that a newer file is never overwritten. A real door refusal stays `blocked`, `written` empty, original bytes intact, backup kept.
- Marker warning: request `origins: ['runner.patterns', 'runner.loops']` in the project `readConfig` (about :566-570); warn when the project origin of the marker is below 2 or absent while project `runner.loops.*` fields exist (the shipped standard supplies 2 and would hide it). Test project marker 1, absent, 2, and global-only loops with no project warning. Doctor tests live in `test/setup/registrations.test.mjs` (there is no `runner-patterns-config` test file).

**S3.**
- Floor: add a distinct resolver input `shippedCheckersByRigor`, filled from `shipped.loops.reviewed.checkersByRigor` at an existing boundary that may read it (`resolveCollaboration` already receives shipped data), threaded through `checkerPlanOf` options, `resolveSeats`, `seatLaunchesOf` and `resolveCollaboration`, and through `runReviewed`'s direct `resolveSeats` call (`loops/reviewed.mjs:177`). Never put the rigor table in `options.floors.minCheckers`. A configured rigor row wins; the injected shipped row is used only when absent; if both lack the row, a configuration error. No addon read in a pure module, no copied fallback table; delete `DEFAULT_CHECKERS_BY_RIGOR` and fix its test import (`loops/reviewed.test.mjs:12`) and the critical independence expectation (`:498-506`: critical includes tester; high unchanged).
- `seat-resolver.test.mjs:123` (`seatLaunchesOf({pattern:'research-fan-out'}) === 4`): the unresolved-alias special case is removed; the admission-count proof uses a resolved panel loop with explicit seats and still gets four; the named research-fan-out launch bound is owned by the existing `catalog.test.mjs` launch-bound cases. Add a non-default `cfg.maxRounds` with no params case proving the deleted config fallback stays deleted.
- `assertUnitAcceptOutcomes`: after a null `loopOf`, throw `new RunnerConfigError(message, {code: 'unknown-pattern'})`; keep the known non-reviewed message (`workflow-runner.test.mjs:1649,1655`); no hand-kept list of shipped names. "A start reads the config once" is bounded: each `resolveStart` loads once and both callers reuse it internally; the CLI preflight and start still call it separately (out of scope).
