# Phase 05: the catalog and the one resolution (`resolveCollaboration`)

Depends on: 03 (effective `patterns`/`loops` shapes, `shippedCatalog()`), 04 (param tables, `resolveSeats` with floors). Blocks: 06, 08, 09. Effort: 9h. Risk: High (the central rule set of the spec; every later phase reads its output).

Run as (fgos-cook): two slices (5a catalog entries and validation, 5b `resolveCollaboration`). Activity `implement-item`, capability `code:implement`, pattern `reviewed` (by hand), rigor `high` (new contract, many refusal codes). Verify below. The old `presets.mjs` still exists after this phase and nothing calls the new module yet; phase 06 switches the callers and deletes `presets.mjs` (the only interval where two doors exist; they are in one case branch).

## Context links

- Spec sections 5.1-5.4 (entry, merge, reserved names, shipped), 7 (selection chain, swap floors, `selector-conflict`), 8 (validity, defaults, floors, bounds, refusal table), 9.1 (request forms), 10 (pin shape), S4-S9, S21.
- Today's `resolvePattern` (`src/runner/execution/patterns/presets.mjs:76-114`): shallow merge of caller params over preset params, no validation. `chosenPattern` (`run.mjs:366`): object, then `unit.pattern`, then string, then `solo`.
- Architecture: `src/runner/execution/patterns/` is domain, pure (no I/O); it may import `seat-resolver.mjs` and the loop `PARAMS`; it must not import `runner/dispatch/` (guard test). Digest hashing needs `canonicalJson` (`src/native/door.mjs:102`, infra), so the resolver returns the merged entry and phase 06 hashes it.

## Requirements

Module `src/runner/execution/patterns/catalog.mjs` (if it passes about 500 lines, split entry validation into `catalog-entries.mjs`; tests stay in one file), pure, with these exports:

1. `CollaborationError(code, message, { source })`.
2. `checkCatalog({ shipped, effective, layers? })` returns the merged entries and a list of problems. It checks, per spec 5.2: a layer's override of a shipped name keeps `loop` and `promise` and does not drop an `atLeast` element or change/remove a `fixed` (`pattern-invariant-weakened`, naming the source layer when `layers` is given); a custom name carries `promise` and `loop`; every key of `defaults` and `invariants` is a param the final loop reads (`param-unknown`); `defaults` values pass the domain check (below); `invariants` exactly one form per param and the form fits the param (`atLeast` only for list params); seats pass `checkDeclaredSeats` including reserved ids and the loop's cardinality; `roleTasks` targets are seats or kinds the loop has; reserved names `seatBinding` and `defaultRule` are not pattern names; an entry holding both the retired and the catalog shape is a config error.
3. `loopOf(name, { effective })` returns the loop or null.
4. `resolveCollaboration({ unit, selectors: { callerObject, callerString, activityUnit }, request, inCase, reason, runnerConfig, shipped, layers? })` returns `{ loop, params, seats, roleTasks, launchBound, entry, pin }`. It does, in order:
   - Selection (7.1): chain callerObject, `unit.pattern`, callerString, activityUnit, shipped `solo`; the **baseline** is the chain without the request. Two **explicit** selectors (the first three) naming different catalog names refuse `selector-conflict`; the same name, or one explicit selector beside the activity unit, does not. An explicit selector differing from a non-null `activityUnit.pattern` in a case needs `reason` (`request-reason-required`; none needed outside a case) and the activity pattern's invariants become floors on the result (`atLeast` unioned, `fixed` equal, a loop that does not read the invariant's param refuses `pattern-invariant-weakened` naming the activity pattern).
   - Carrier validity (8.1): unknown key on any carrier (request, Unit, step template or caller object, activity unit, config pattern) refuses `param-unknown`; a value outside its domain refuses `param-invalid` (`maxRounds` a positive integer, `minCheckers` a list of `CHECKER_SEATS` names, `rebuttal` a boolean, `seats` through `checkDeclaredSeats`, `roleTasks` a map of text); a request carrying `roleTasks` refuses `param-not-requestable`.
   - Request normalization (9.1): the request is `{ params?, scalars? }` as phase 08 builds it. A scalar is typed by the loop's `PARAMS` once the baseline loop is known (`maxRounds` a decimal integer literal, `rebuttal` exactly `true` or `false`; an empty value, `1.5`, `abc`, a list-, map- or seats-typed key refuse `param-invalid`; values are not trimmed). The same key twice, in scalars or across both forms, refuses `param-request-conflict`.
   - Defaults (8.2), the more specific value replaces: request > selector params (caller object or step template) > `unit.seats` (the `seats` key only) > activity default (only when the baseline is the activity unit) > pattern default > `runner.loops.<loop>` config default > the loop built-in. Record the winning slot per param.
   - Floors (8.3): union the pattern invariants (and on a swap the activity's) with the request and the defaults for `minCheckers`; a `fixed` invariant must equal the effective value or the caller's value refuses `pattern-invariant-weakened`. A `minCheckers` request below any floor is a minimum: unioned, never a refusal.
   - Bounds (8.4): `runner.loops.<loop>.bounds.<param>` is checked against the effective value only when its winning slot is `request`, refusing `param-out-of-bounds`; a declaration that wins is never clamped.
   - Seats and launches: call `resolveSeats` and `seatLaunchesOf` with the loop, the effective params and the floors; `launchBound` is the launch count.
   - Output `pin` per spec section 10 minus `digest` (`requested`, `baseline`, `pattern {name, layer}`, `effective {loop, params, seats, postures, roleTasks, launchBound}`, `provenance {params, checkers}` where checkers come from `checkerPlanOf`). `layer` is `layers[name]` when given; when the caller has none (an injected config) it is `shipped` if the merged entry equals the shipped entry, else `project`.
5. One refusal code per case exactly as the spec's table 8.5; all raised as `CollaborationError` or `SeatResolutionError` before any admission.

## Files (writes)

- `src/runner/execution/patterns/catalog.mjs` (new; optional `catalog-entries.mjs`)
- `test/runner/execution/patterns/catalog.test.mjs` (new owning proof; a new module, so a new file is allowed)
- `docs/architecture-manifest.json` (new module, layer `domain`), `packages/git/contracts/mutation-census.v1.json` (regenerate)
- Fixtures: a project-declared **non-coding** pattern (capability `business:*`/`docs:*`, config only) in the test file itself; no shared fixture edit.

## Steps

1. 5a: entry checks and `loopOf`; load the shipped data through the test's own call to the real `shippedCatalog()` (phase 03), not a copy, so the test proves the standard file.
2. 5b: the chain, request, defaults, floors, bounds, pin. Keep every function pure; take `shipped` and `layers` as arguments.
3. Tests, one per behavior, each titled in plain words and naming why no existing test proves it:
   - S4 a project-declared non-coding pattern resolves with no JS change; shipped `reviewed` with plain defaults resolves for `--pattern reviewed`.
   - S5 override of a shipped name merges per key and need not carry `promise`/`loop`; a project adds a name, replaces a shipped default, tightens an invariant; dropping an `atLeast` element, changing a `fixed`, changing a shipped `loop` each refuse `pattern-invariant-weakened` naming the source; `research-fan-out-gated` is `unknown-pattern`; reserved name as a pattern name and a both-shapes entry are config errors.
   - S6 a pattern default `maxRounds: 1` replaces the loop default and a request raises it to 3 inside bounds; explicit pattern B beside an activity declaring A does not inherit A's params; competing `unit.seats` and request `seats` resolve to one declared winner.
   - S8 `param-unknown` on each of the five carriers (one case per carrier); `maxRounds` 0, 1.5, "abc" refuse `param-invalid`; `roleTasks` in a request refuses `param-not-requestable`; scalar typing and conflict cases of 9.1.
   - S9 (application) request outside bounds refuses `param-out-of-bounds`; a shipped or activity default outside the bounds runs unclamped; absent bounds never refuse.
   - S21 `--pattern solo` against an activity declaring `code-change` refuses `pattern-invariant-weakened` naming `code-change`; `--pattern rfc` against it runs with the activity invariants unioned.
   - Chain order, `selector-conflict` for two explicit different names, and "falls to solo" when everything is empty (the half of S2 that is the Core's).
4. `git grep -n "resolvePattern\|PRESETS" -- src` still lists the old module and its importers (run.mjs, unit-summary.mjs, legacy-seat-read.mjs, loops/index.mjs, presets.test.mjs; seat-resolver.mjs no longer imports it after phase 04); phase 06 owns removing them.
5. Census and manifest.

## Verify

`node scripts/run-tests.mjs test/runner/execution/patterns/catalog.test.mjs test/runner/execution/seat-resolver.test.mjs test/runner/dispatch-config-patterns.test.mjs test/architecture.test.mjs`. No full gate (nothing calls the module yet).

## Risks and mitigations

| Risk | L x I | Mitigation |
|---|---|---|
| per-entry deep merge lets a stray key from one layer survive | M x M | `checkCatalog` validates the merged entry against the final loop (spec RR-P9); a case in S5 |
| a second merge semantics appears in the resolver | L x H | the resolver never merges layers; it receives the effective value and the shipped layer and only compares |
| `layers` unavailable for injected configs makes `pin.layer` approximate | M x L | stated rule above; the pin's authority is `digest` (phase 06), not `layer` |
| the module grows past review size | M x L | split rule in Requirements |
| provenance classes for non-invariant checker contributions are not in the spec | M x L | phase 04 decision; unresolved question U3 |

## Rollback

Revert; nothing calls the module yet.

## Acceptance (owned here)

S4, S5, S6, S8, S9 (application), S21, and the Core half of S2, all in `test/runner/execution/patterns/catalog.test.mjs`. Wiring of S4 into dry-bind is phase 06.
