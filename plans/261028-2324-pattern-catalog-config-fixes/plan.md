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
