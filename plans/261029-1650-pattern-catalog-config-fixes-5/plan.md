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

## Amendments adopted after the lock-and-validate pass (binding; they replace the matching text above)

Source: the report of unit run `unit-run-1793266874888-7b5ed84b` (producer/1). Use symbols and current names, not the old line numbers.

**Slice 1.**
- Seat text: keep `SeatResolutionError(message, code = 'invalid-seats', options = {})` and its object-second-argument form unchanged (other sites in `seat-resolver.mjs` and `catalog-entries.mjs` use the ordinary message and code form). Inside `checkDeclaredSeats` one local helper stores the detail once and builds the message. Keep the relative `at` independent of the displayed path: an unknown key has metadata `[i].<key>` but the message stays `<label>[i] has unknown key ...`; an invalid id calls `assertSeatId(value, '')` once and trims the leading space. All nine codes, messages and relative paths stay stable. Own the nine cases in `seat-resolver.test.mjs`; no copy of the matrix at the other boundaries (one wiring case in `unit.test.mjs` only if no boundary proof exists).
- Layers: delete the first `catalogLayersOf` test and its helper import; convert the second (split-field origins and pin attribution) to `resolveLayer(origins, 'reviewed')` and rename it for what it proves (a global bad loop and a project promise report global for the offending field, the valid split pattern pins project). Keep `run uses the loaded origins` as the one run proof. Replace every `checkCatalog` `layers` input with `origins` in `catalog.test.mjs`: the census is the map callers at about :153, :175, :187, :201, :225, :250, :267, :286, :345 and :851, the array caller at about :474 (rename it), the scalar callers at about :875 and :893 (synthesize origins), using the canonical offending field path, the declared layer, a `file` of `project:config.yaml` or `global:config.yaml` and a line; a missing-invariant case maps to its container. Record that the map and scalar inputs of `resolveLayer` were removed (its assertions at about :2170-2171). Update the JSDoc of `checkCatalog` (`options.layers` to `options.origins`), drop the shipped-catalog header mention and its unused `RESERVED_PATTERN_NAMES` import, and replace `layerSource = origins ?? layers` in `catalog-entries.mjs`. Do not edit production callers that already pass origins.
- Run without mandatory edits: `run.test.mjs`, `unit.test.mjs`, `test/workflow/core-workflow-seats.test.mjs`, `convention/seat-id.test.mjs`, `test/architecture.test.mjs`. (`workflow/checked` means `src/workflow/checked.mjs`; there is no test file of that name.)

**Slice 2.**
- Add an optional `options.path` to `CollaborationError` without changing its constructor, factory or argument-order compatibility (the Proxy form stays). Set the canonical path at every catalog problem construction, `checkParamDomain` included. In `checkRunnerPatternsConfig`, adapt each problem with `new RunnerConfigError(p.message, { code: p.code, path: p.path })`, call `attributeRunnerConfigError(adapter, origins, cwd)` and use its message, or `p.message` when no location is found. The existing formatter's output (`runner config (<locations> <subpath>) <text>`) is kept; no second formatter, no import of dispatch config into the domain, no second config read; no `config.mjs` change.
- Path inventory (canonical, from the field, never parsed from a message): retired key = the finding key; reserved name = `runner.patterns.<name>`; malformed entry = the pattern root; unknown entry key = pattern plus the key; malformed defaults or invariants = the section container; changed shipped loop or promise = `.loop` or `.promise`; invariant removal = `.invariants` when empty, else `.invariants.<param>` (or its `.atLeast` or `.fixed` member for a malformed or changed value); missing custom promise or loop = `.promise` or `.loop`; unknown defaults or invariants parameter = `.<section>.<param>`; invalid invariant form = `.invariants.<param>`; invalid `atLeast` or `fixed` = `.invariants.<param>.atLeast` or `.fixed`, indexed when an item is identified; domain maxRounds, rebuttal, minCheckers and roleTasks = the actual value path (`.fixed` under invariants, `[i]` for an identified checker, the target key for an identified role task); declared-seat errors = the seats value path plus `err.at`; seat cardinality errors = the seats container (`.fixed` when it is the invariant). A path may name an absent field; the locator then uses the nearest ancestor or yields none and doctor keeps the layer text. Runner messages, codes, `source` and the layer suffix stay.
- Tests: `patterns/catalog.test.mjs` owns path selection across the inventory (nested seat `at`, invariant `.fixed`, a missing field, a container error, a retired key) and keeps code, source and text assertions; `test/setup/registrations.test.mjs` gets one table-driven wiring proof for project-only, global-only and no-origin (an unknown defaults key reaches `checkCatalog`; the no-origin case removes every matching ancestor and descendant); the producer shows the mapping-removed negative control in its summary. Update `CHANGELOG.md` and regenerate the census for each slice's commit.
