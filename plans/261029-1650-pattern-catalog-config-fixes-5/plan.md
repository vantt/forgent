---
title: "Pattern catalog config fixes, fifth round"
description: "Owner choice 2a and 3a (board line 12beb2eb0): doctor names file and line of a catalog error, and the two round-four Lows"
status: pending
---

# Pattern catalog config fixes, fifth round

Owner decision «2a 3a» (HARDEN plan decision 54, board `12beb2eb0`). COOK implements, HARDEN reviews. Review of record: `plans/reports/review-261029-1547-harden-review-config-fixes-round-four.md` (read it from the worktree; three Lows). Frame: 7 dispatches (2 read-only, 2 writing slices, 1 spare writing, 2 spare), rigor standard. Base: origin/main `12beb2eb0`.

## Outcome

(2a) `fgos doctor` row `runner-patterns-config` names the file and line of the field behind a pattern-catalog problem, using the runner's existing locator (`resolveOriginLocations` and the one attribution formatter in `config.mjs`), no new mechanism; the CHANGELOG sentence says file and line again for catalog errors. (3a) Each seat error in `seat-resolver.mjs` states its text once instead of `message` plus `detail`; `catalogLayersOf` is deleted together with the map- and string-shaped `layers` input of `checkCatalog` and `resolveLayer` that only tests use (every test caller moves to origins, L10).

## Decisions (the conductor's; each has a reversal condition)

- 3a seat text: the resolver builds each error from one place (a local helper taking the field path, the detail text and the code); `message` is derived from the label and the detail, `detail` is the same stored string, never a second literal. Every wording and code tests pin stays (`seat-resolver.test.mjs` about :80-86, the config mapping tests, unit admission, `workflow/checked`, catalog parameter validation). Reversal: none.
- 3a layers: `resolveLayer(origins, name, fieldPath)` accepts an origins array (or null) only; `checkCatalog` takes `origins` only; `catalogLayersOf` and its two tests are deleted (their behaviour is owned by the `resolveLayer` origins tests in `catalog.test.mjs` and the `runUnit` proof that a global-only custom pattern pins global); test callers that passed a scalar string or a map now pass a synthetic origins array of `{path, layer, file, line}`. The equality-with-shipped then project fallback in `resolveCollaboration` stays. Reversal: none.
- 2a: each `CollaborationError` raised by `checkCatalog` for a field carries the canonical `path` of the field (`runner.patterns.<name>[.<field>]`) beside its `source`; `checkCatalog` problems expose it; doctor maps each problem through `resolveOriginLocations(origins, [path], cwd)` (the locator behind `attributeRunnerConfigError`) and prints `runner config (<file:line>) <problem text>`; a problem whose path has no origin keeps today's text (source layer only), never the project file by default. The message text and `(source layer: …)` suffix stay for the runner path (`resolveCollaboration`), which does not use a file label. Reversal: if a path has no origin because the door cannot inventory it, fall back to the layer text.

## Out of scope

Q1, the two Lows of the first re-check, any change to `packages/config`, any docs/ change.

## Slices (writing, sequential)

1. **Seat text and layers input (3a)**: `src/runner/execution/seat-resolver.mjs`, `src/runner/dispatch/shipped-catalog.mjs`, `src/runner/execution/patterns/{catalog,catalog-entries}.mjs`, `src/setup/registrations.mjs` (the `checkCatalog` call only), their tests (`seat-resolver`, `dispatch-config-patterns`, `patterns/catalog`, `run`), the census.
2. **Doctor file and line (2a)**: `src/runner/execution/patterns/catalog-entries.mjs`, `src/setup/registrations.mjs`, `CHANGELOG.md`, tests (`patterns/catalog`, `setup/registrations`), the census.

## Acceptance

Focused owning tests and `test/architecture.test.mjs` per slice; at final integration `npm test` (only the three mailbox failures that fail on clean origin/main) and `cargo test --workspace`; census clean; one proof per behaviour: a doctor catalog error carries `file:line` for a project-only, a global-only and a no-origin case (with a negative control removing the mapping); every deleted test names the surviving owner or the removed behaviour.

## Rollback

Revert the two slice commits.
