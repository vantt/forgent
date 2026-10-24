# Phase 04: loop param tables, seat rules, reserved ids, checker floors with provenance

Depends on: 01 (files in `loops/`), 03 (`LOOP_NAMES`, the `cfg.loops` tuning reads). Blocks: 05. Effort: 7h. Risk: Medium-High (the roster rules decide who reviews coding work).

Run as (fgos-cook): two slices (4a checker plan and reserved ids in `seat-resolver.mjs`; 4b param tables and the loop call shape). Activity `implement-item`, capability `code:implement`, pattern `reviewed` (by hand), rigor `high` for 4a (it changes which seats review coding work; hard to see wrong), `standard` for 4b. Verify per slice below.

## Context links

- Spec sections 8.1 (param table), 8.3 (floors, which code for a bad roster), 11 item 3 (reserved ids), 12 (red-team default, tunable), scenarios S7, S13, S14.
- Today: `seat-resolver.mjs` `checkerSeatsOf` (:107-121; exact-key `minCheckers` at :113, unconditional red-team at :116, `unknown-checker-seat` at :118), `checkDeclaredSeats` (:139-157), `declaredSeatsOf` (:159), `resolveSeats` (:193), `seatLaunchesOf` (:257), `VERIFY_SEAT` (:34), `capabilityEntriesOf` (:79, exact then `<prefix>:*`, already used for rigor).
- Prior art reused: `capabilityEntriesOf` for the lookup (no second walker); `VERIFY_SEAT` constant; `SeatResolutionError` with `.code`; the loops keep calling `resolveSeats` themselves, and keep the 4th `params` argument, so the loop tests and the dry-bind caller keep their shape.
- Scout fact 7: no test asserts `unknown-checker-seat` or `seat-multiplicity` by code today.

## Requirements

1. `resolveSeats({ loop, params, floors, unit, runnerConfig })` and `seatLaunchesOf({ loop, params, floors, unit, runnerConfig })` take a loop name, not a pattern. `floors` is `{ minCheckers: [{ name, source }] }` supplied by the resolver of phase 05 (a pattern invariant, or the activity pattern's on a swap); absent means none. The loops pass the already-expanded params (the union of invariants is inside `params.minCheckers`), so a loop never needs `floors`.
2. One checker plan, `checkerPlanOf(unit, runnerConfig, { requested, floors })`, returns `[{ seat, contributions }]` and replaces `checkerSeatsOf` (delete it; callers: `seat-resolver.mjs` itself and the tests at `seat-resolver.test.mjs:51`, `reviewed.test.mjs:21` named `resolveCheckers`; re-grep). Contributions: `rigor:<level>`, `capability:<key>`, `code:default-red-team`, `pattern-invariant:<name>`, `request`, and `param:<slot>` for a non-request winner of the `minCheckers` param (the spec's list has no class for a non-invariant pattern/selector default; see unresolved question U3).
3. Capability `minCheckers` is read exact key, then `<prefix>:*` (reusing `capabilityEntriesOf`), first defined wins, `[]` counts as defined and clears the default. The shipped default `{ code: [red-team], 'code:*': [red-team] }` (`DEFAULT_CAPABILITY_MIN_CHECKERS`, same key walk) applies only when no config entry along the walk defines `minCheckers`. The unconditional branch at `:116` is deleted. `business:*` and `docs:*` never get red-team from the default. The result is always unioned with `checkersByRigor[effective rigor]` and the floors; a request adds, never removes.
4. `checkersByRigor` is read from `runnerConfig.loops.reviewed` (phase 03 moved the read); built-in `DEFAULT_CHECKERS_BY_RIGOR` stays as the fallback.
5. `checkDeclaredSeats` refuses the ids `verify` and `verifier` (`RESERVED_SEAT_IDS`, built from `VERIFY_SEAT`) with code `param-invalid`, in every declaration (`unit.seats`, `params.seats`). Existing seat-shape codes keep their names (`invalid-seats`, `invalid-seat-id`, `duplicate-seat`, `invalid-seat-role`, `invalid-seat-tier`).
6. An unknown checker name is `param-invalid` (code `unknown-checker-seat` is retired).
7. Roster rule for a declared reviewed roster: a required checker role is missing and its contributions include a `pattern-invariant:*` source gives `pattern-invariant-weakened` naming that source; a missing role with no such contribution, or an extra role, gives `seat-multiplicity` (existing; the exact match is not retired).
8. Each loop module exports `PARAMS`, its param table: `solo { seats }`, `reviewed { maxRounds (integer >= 1, scalar, requestable), minCheckers (checker list, requestable), seats, roleTasks (declaration-only) }`, `panel { seats, roleTasks }`, `debate { seats, roleTasks, rebuttal (boolean, scalar, requestable) }`. `loops/index.mjs` exports `paramTableOf(loop)`. Built-in defaults are exported constants (`DEFAULT_MAX_ROUNDS = 2` in `reviewed.mjs`, rebuttal on in `debate.mjs`) that the resolver of phase 05 uses as the last link of the default chain. The loops stop reading `cfg.loops.reviewed.maxRounds` (config defaults are resolved upstream): `reviewed.mjs:113,144` read `params?.maxRounds ?? DEFAULT_MAX_ROUNDS`; `seatLaunchesOf` likewise.

## Files (writes)

4a:
- `src/runner/execution/seat-resolver.mjs`
- `test/runner/execution/seat-resolver.test.mjs` (owning proof for S7, S13, S14)
- `test/runner/execution/loops/reviewed.test.mjs` (the `resolveCheckers` cases at :21-55 move to the new function or are retired in favor of the seat-resolver proofs; name the owner in the commit)
4b:
- `src/runner/execution/loops/{solo,reviewed,panel,debate,index}.mjs`
- `src/runner/execution/run.mjs` (two call sites only: `resolveSeats` at :703 and `seatLaunchesOf` at :726 take `{ loop, params }` from `resolvePattern(...)` for now; phase 06 replaces them)
- `test/runner/execution/loops/{solo,reviewed,panel,debate,index}.test.mjs` (call shape and the `maxRounds` default cases)
- `docs/architecture-manifest.json` (no new file here), `packages/git/contracts/mutation-census.v1.json` (regenerate)

## Steps

1. 4a: add `RESERVED_SEAT_IDS`, `DEFAULT_CAPABILITY_MIN_CHECKERS`, `checkerPlanOf`; rewrite the reviewed branch of `resolveSeats` on the plan (it already builds seats from names; add contributions and the roster-code rule). Keep `requiresDistinctFamilies` untouched.
2. 4a tests (names state the behavior in plain words, none carries a plan or decision code): request below a rigor floor is unioned and lists `rigor:high`; request below a capability floor keeps red-team for `code:implement`; `unit.seats` lacking red-team for a plan with a `pattern-invariant:code-change` floor refuses `pattern-invariant-weakened`; a reviewed roster missing a loop-required role with no invariant refuses `seat-multiplicity`; `verify` and `verifier` refused in `unit.seats` and `params.seats`; a solo unit declaring `verify` refuses; red-team default with no config for `code:implement`, none for `business:advise`; `code:*` prefix entry `[reviewer]` replaces the default; an exact `code:implement` entry beats the prefix; `[]` clears it; the plain `code` key resolves by exact key only.
3. 4b: add `PARAMS` and the constants; change the four `resolveSeats` calls to the loop-name shape; `index.mjs` exports `paramTableOf`; fix `run.mjs` call sites.
4. Re-grep for `resolveSeats(` and `seatLaunchesOf(`: callers at HEAD are 4 loops, `run.mjs:703`, `run.mjs:726`, the re-export `execution/case-admission-port.mjs:19`, and tests (`git grep -n "resolveSeats(\|seatLaunchesOf(" -- src test`).
5. Census, then both slices' verify.

## Verify

- 4a: `node scripts/run-tests.mjs test/runner/execution/seat-resolver.test.mjs test/runner/execution/loops/reviewed.test.mjs`
- 4b: `node scripts/run-tests.mjs test/runner/execution/loops/solo.test.mjs test/runner/execution/loops/reviewed.test.mjs test/runner/execution/loops/panel.test.mjs test/runner/execution/loops/debate.test.mjs test/runner/execution/loops/index.test.mjs test/runner/execution/seat-resolver.test.mjs test/runner/execution/run.test.mjs test/runner/execution/run-case-admission.test.mjs test/setup/seat-binding-dry-bind.test.mjs test/architecture.test.mjs`
- No Rust. Full `npm test` at phase 06.

## Risks and mitigations

| Risk | L x I | Mitigation |
|---|---|---|
| behavior change 1: an explicit `minCheckers` omitting red-team no longer gets it added for `code:*` | H x M | by design (spec 12); CHANGELOG line in phase 12; doctor information in phase 09 |
| behavior change 2: a `<prefix>:*` `minCheckers` entry now applies | M x M | by design; same lines |
| red-team default costs a checker at standard rigor and a family at high | M x M | spec RT-9; no mitigation in code |
| contribution provenance disagrees with what runs | L x H | single plan function feeds both the roster and the provenance; test asserts roster names equal plan names |
| deleting `checkerSeatsOf` misses an importer | L x L | `git grep` at slice time; import-time failure |

## Rollback

Revert 4b then 4a. Neither changes stored records or config.

## Acceptance (owned here)

S7, S13, S14 in `test/runner/execution/seat-resolver.test.mjs`. The `pattern-invariant-weakened` case for a config pattern's own seats is phase 05's (catalog validation).
