# SEAT-TRIM follow-up A: conversion removal

## Removed

Net on tracked files: 81 insertions, 3,094 deletions (21 files).

Node source:
- `src/setup/seat-binding-conversion.mjs` (296 lines) renamed to `src/setup/tier-ladder-comment.mjs` (about 35 lines). Kept: `ladderCommentLines`, plus `refreshTierLadderComment` (the `$comment` refresh; no backup now, it is documentation only). Dropped: `convertRunnerConfig`, `convertProjectConfigFile`, bare-verb/mini/rigor reports, backup path.
- `bin/fgos.mjs`: setup calls `refreshTierLadderComment` instead of the conversion; output line only when refreshed; unused `discoverWorkflows` import removed. Result field is `tierLadderComment` (was `seatBindingConversion`).
- `src/setup/seat-binding-checks.mjs`: `checkSeatBindingConfig` reduced to the ladder-comment compare; `checkSeatBindingDrain` and `openWorkflowRuns` deleted; imports pruned.
- `src/setup/registrations.mjs`: `seat-binding-drain` row and import removed; `seat-binding-config` description updated; the project `rigorToTier` dead-key message now says delete the key.
- `src/runner/dispatch/config.mjs`: `assertProjectConverted` (and both call sites), `refuseGlobalSeatBindingKeys` removed; `config-not-converted` code removed; the validator's `rigorToTier` message now says delete the key and declare `tier`. `dropRetiredGlobalKeys` kept, comment says why (owner's global `runner.rigorToTier`).
- `docs/architecture-manifest.json`: file renamed.

Tests and fixtures (each names its owner or says behaviour removed):
- `seat-binding-conversion.test` (425): conversion behaviour removed. Live cases (stale `$comment` refresh, fresh setup writes marker, no seat key in global) now owned by new `test/setup/tier-ladder-comment.test.mjs` (4 tests).
- `seat-binding-fence.test` (173): pre-seat release refusing converted configs; behaviour removed.
- `seat-binding-checks.test` (154): config marker/rigorToTier rows and drain rows removed behaviour; the `$comment` row case is owned by `tier-ladder-comment.test`.
- `cli/unconverted-project-refusal.test` (106): refusal at every door removed.
- `config-seat-binding-layers.test`: 3 of 5 tests dropped (project refused by name, no-marker refusal, direct-file rigorToTier; the last is owned by `dispatch.test` "loadRunnerConfig refuses a runner config that still carries rigorToTier", message assertion updated). Kept: global `rigorToTier` ignored and file untouched, fresh bootstrap, defaults.
- Fixtures `test/fixtures/seat-binding-config/forgentx-runner.json` (1410) and `global-runner.json` (288) deleted, no other user.
- `checks.test`: `seat-binding-drain` removed from the expected row list.
- `test/suite-baseline.json` regenerated (3 lines).

Docs: `docs/specs/seat-binding.md` (section 9 rewritten as done plus what stays live; dated note in section 15; E3/E5 and pointers fixed), how-to doctor table (config row rewritten, drain row removed), setup-doctor registry list, `CHANGELOG.md` [Unreleased] (three entries rewritten to the new truth). `distribution.md` lists neither row, no change.

## Drain row decision: removed
It only gated landing the release (spec 9.1). It protected nothing live: resuming a pre-seat unit run on new code is refused as `record-predates-seat-binding` by the runner regardless of any doctor row, and history stays readable via `legacy-seat-read.mjs` (untouched). No pre-seat release is active anywhere, so a live pre-seat controller cannot exist.

## What an unconverted config does now
- Project config with `runner.rigorToTier`: refused by `validateRunnerConfigShape` ("declares retired rigorToTier ... delete the key and declare tier ..."), also reported by doctor's dead-key row. Proof: `test/runner/dispatch.test.mjs`.
- Project config with no `patterns.seatBinding.schema` marker: accepted (the validator never required it).
- Global `rigorToTier`: still dropped in memory with the one-line notice.

## Verification
- Touched files run alone (own env, own CARGO_TARGET_DIR): `tier-ladder-comment` + `config-seat-binding-layers` 7/7 pass; `checks`, `architecture`, `dispatch`, `seat-binding-dry-bind`, `registrations` 482/482 pass.
- Full `npm test` NOT completed: I started it, then SEAT asked for no full runs during landing; I stopped it and killed its processes. Needs a full run after "land done" (suite guard: baseline already regenerated, `scripts/test-proof-inventory.mjs --write-baseline`: 593 files, 8022 tests). No Rust changed.

## Open questions
- Old pre-seat `config.json.pre-seat-binding-*` backups may exist in workspaces; nothing deletes them.
- `seat-binding-config` row is now nearly always green (ladder comment only); owner may prefer folding it away later (id kept to avoid a doctor-row rename).

Status: DONE_WITH_CONCERNS
Summary: Conversion, drain row, fence and refusal code and tests removed; ladder-comment refresh kept in `tier-ladder-comment.mjs`.
Concerns: full `npm test` not run (stopped on SEAT's request).
