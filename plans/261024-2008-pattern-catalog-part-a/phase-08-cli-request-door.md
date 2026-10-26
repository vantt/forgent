# Phase 08: the request door: `--params`, `--param`, `--reason`, activity-unit wiring

Depends on: 02 (`activityUnitOf`), 06 (`runUnit` accepts `options.request` and `options.activityUnit`). Blocks: 10. Effort: 5h. Risk: Medium.

Run as (fgos-cook): one slice. Activity `implement-item`, capability `code:implement`, pattern `reviewed` (by hand), rigor `standard`. Parallel-safe with phase 07 (no shared file; this phase must not edit `run.mjs`).

## Context links

- Spec sections 9.1 (door, parsing rules, resume refusal), 8.5 (`param-request-conflict`, `request-reason-required`), scenarios S10 and the S1 wiring.
- Today: `fgos run` handler `bin/fgos.mjs:2798-2958` (flags, `caseFlagsGiven` :2912, resume refusal for `--case` :2917, `createCaseAdmissionPort` :2933, `runUnit` call :2936-2957); `REPEATABLE_FLAGS = ['context-ref', 'param']` (`bin/fgos.mjs:566`); `parseLockParams` (`src/runner/lock-fence.mjs:28`) is the `k=v` idiom on `fgos lock fence`; verb registry `src/cli/command-registry.mjs:1484-1501` and its drift guards.
- Prior art reused: the repeatable `--param` flag and the idiom; `--reason` stays the existing case-only flag.

## Requirements

1. New pure module `src/runner/execution/run-request.mjs`: `requestFromFlags({ params, param })` returns `{ params?: object, scalars: [{ key, raw }] }`. `--params` must parse to a plain JSON object (anything else: `param-invalid`). Each `--param` splits on the **first** `=`; a missing `=`, an empty key or an empty value is `param-invalid`; the bare flag form (`--param` with no value, which the parser stores as `true`) is `param-invalid`; values are not trimmed or coerced. A key given twice in `--param`, or in both forms, is `param-request-conflict` (argv order never decides). Typing the scalars against the loop's param table is the Core's (phase 05); this module never sees a loop.
2. `bin/fgos.mjs`: `--params`/`--param` beside `--resume` are refused as `--case` already is; the request is passed as `options.request`, never as a caller object and never into the pattern selector. Errors from `requestFromFlags` surface as `RunnerConfigError` with the code and `phase: 'pre-admission'`, like the Core's.
3. When `caseRef` is present, `bin/fgos.mjs` calls `activityUnitOf({ mainRoot: portRoot, caseId, activity })` and passes the result as `options.activityUnit`; the port gains nothing.
4. `--reason` requirement is the Core's rule (phase 05/06): a request or a differing explicit selector with a case and no reason refuses `request-reason-required`; standalone runs need none.
5. `fgos run` help, the command registry and the Rust-host help routes list `--params`, `--param`, `--reason` (with a case) and document the pin and `selector-conflict`; the drift guards stay green. No new verb.

## Files (writes)

- `src/runner/execution/run-request.mjs` (new), `bin/fgos.mjs`, `src/cli/command-registry.mjs`
- `docs/architecture-manifest.json` (new module, `domain`), `packages/git/contracts/mutation-census.v1.json`
- Tests: `test/runner/execution/run-request.test.mjs` (new; owns the parse, split and conflict rules), `test/cli/run-verb.test.mjs` and `test/cli/fgos-case-doors.test.mjs` (CLI wiring), `test/cli/fgos-manifest.test.mjs`, `test/cli/subcommand-flag-drift.test.mjs`, `test/cli/fgos-verb-help-json.test.mjs`, `test/rust-host/help-routes.test.mjs` (flag drift guards; run them, edit only what drifts)

## Steps

1. Write `run-request.mjs` and its test: the cases of 9.1 (split on first `=`; empty value; `1.5` and `abc` are not this module's, they are typed later; repeated key; same key through both forms; `--params` array refused).
2. Edit the handler; update the registry entry (`pattern` description: a catalog name, not "preset"; add `params`, `param` (array), `reason`).
3. Wiring proofs (one per boundary, no copies of the cases): in `test/cli/run-verb.test.mjs` a `--param` plus `--params` conflict reaches the user as `param-request-conflict`, and `--param` beside `--resume` is refused, and a standalone request runs without a reason; in `test/cli/fgos-case-doors.test.mjs` a request with a case and no `--reason` refuses `request-reason-required` (a bogus case id works: resolution refuses before admission) and one proof that a real conductor case dispatch with no selector reaches the Core with the activity's unit (the S1 wiring; use the cheapest harness, `test/workflow/confined-nested-write.test.mjs:34` shows a spawned `fgos run --case`; if no CLI-level case fixture can host it in one file, park it as unresolved question U5 rather than skipping it silently).
4. Census, manifest.

## Verify

`node scripts/run-tests.mjs test/runner/execution/run-request.test.mjs test/cli/run-verb.test.mjs test/cli/fgos-case-doors.test.mjs test/cli/fgos-manifest.test.mjs test/cli/subcommand-flag-drift.test.mjs test/cli/fgos-verb-help-json.test.mjs test/rust-host/help-routes.test.mjs`. No full gate.

## Risks and mitigations

| Risk | L x I | Mitigation |
|---|---|---|
| the repeatable parser turns a value starting with `--` into a bare flag | L x M | parse test; the error says to quote or use `--params` |
| `activityUnitOf` called before the case exists throws | L x M | returns null for a missing case (phase 02); admission names the refusal |
| the registry and the Rust host help drift | M x L | the four guards run in the verify |
| an agent sends a request without a reason in a case | M x L | refused by name with the one-line fix in the message |

## Rollback

Revert; the flags disappear and the door inherits only the activity unit.

## Acceptance (owned here)

S10: parsing, splitting, conflicts in `test/runner/execution/run-request.test.mjs` (the lowest layer; the spec table names `test/cli/run-verb.test.mjs` as owner, so that file keeps only the behaviors visible through the verb: resume refusal, standalone without reason, one conflict wiring); the reason reaching the `route` event is phase 06's proof. S1 wiring in `test/cli/fgos-case-doors.test.mjs`.
