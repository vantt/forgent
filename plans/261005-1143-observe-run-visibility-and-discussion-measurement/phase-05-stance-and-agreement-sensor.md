---
phase: 5
title: "Stance and agreement sensor"
status: completed
priority: P2
effort: "1.25d"
dependencies: [4]
---

# Phase 5: Stance and agreement sensor

Execution gate: owner explicitly requested all remaining phases on 2026-10-05,
superseding the foundation-only gate. Passive measurement only; no dissent gate.


## Overview

A passive sensor: each panelist states a stance among declared options; Observe computes agreement per unit. It never blocks and never fails a seat. This is the measurement the 2026-10-04 council experiment asked for before any dissent gate (porting-log row `agreement-sensor-passive`).

## Requirements

- Functional: a panelist may return `stance: { choice, confidence }` in its result claim; `choice` is one of the options declared for the question, or `other`.
- Functional: options are declared per question: `fgos workflow start <id> --request ... --stance-options "a|b|c"` (stored with the workflow run, passed to the unit as `stanceOptions`) or the same unit param for `fgos run`. A static template cannot hold them because the question arrives as free text (`src/workflow/runner.mjs:39-41`).
- Functional: the unit summary (phase 4) carries each final seat's stance, extracted by the Node writer from the settled `result.json` `agentClaim` (already validated and hashed), never from outbox files whose location varies per seat.
- Functional: `metrics discussions` shows per unit `stances`, `stancesMissing`, `stancesInvalid`, `agreement` (largest group share) and `genuineSplit` (no option reaches 2/3 of seats); a unit with no options reads `unmeasured`.
- Non-functional: a malformed or missing stance is recorded, **never** a refusal: `settlement.mjs:224-231, 491-499` fails a seat on an invalid claim, so the contract change is documentation plus tolerance, not new validation.

## Architecture

D2. The claim validator (`src/runner/dispatch/agent-result-claim-contract.mjs`) already accepts unknown fields; the change documents the optional `stance` and adds a tolerant extractor in `unit-summary.mjs` that returns `{choice, confidence}` or `{invalid: reason}`. The brief for panelists gets the options and "end with your stance" through the existing role-task mechanism (`src/runner/execution/patterns/role-tasks.mjs`, `params.roleTasks`). Agreement is computed in the Rust read side from the summary's stances.

## Related Code Files

- Modify: `src/runner/dispatch/agent-result-claim-contract.mjs` (document only, plus test that stance never changes validity), `src/runner/execution/unit-summary.mjs`, `src/runner/execution/patterns/role-tasks.mjs`, `src/workflow/definition.mjs` and `bin/fgos.mjs` (`--stance-options` on `workflow start`), `packages/run-result/rust/src/unit_summary.rs`, `packages/observe/rust/src/metrics_cli/discussions.rs`, `docs/specs/runner.md`, `docs/specs/observe.md`, `docs/distillery/porting-log.md` (row `agreement-sensor-passive`: record the deviation from the `STANCE:` line design and why), `CHANGELOG.md`.

## Implementation Steps

1. Prior-art: read the porting-log rows `agreement-sensor-passive` and `panel-dissent-agreement-gate` and the 2026-10-04 A/B reports for the thresholds; quote them in the spec, do not restate from memory. Note the review condition they set (many runs) is outside this plan's acceptance.
2. Tolerant extractor with tests: valid stance, wrong type, choice not in options (recorded invalid), missing; claim validity unchanged in every case.
3. `--stance-options` plumbing and the panelist brief text; verify the options appear in a real panelist `brief-N.md`.
4. Rust agreement computation with fixtures: unanimous, 2-1, 1-1-1, no options, missing stance.
5. Live: one panel (3 seats) from mdview with `--stance-options`; compute the ratio by hand and compare.
6. Spec, porting-log, CHANGELOG.

## Success Criteria

- [x] Live panel `unit-run-1791219961331-276f364c`: three valid `no-gate` votes, hand/native agreement 3/3 = 1, genuineSplit false.
- [x] Without options reads `unmeasured`; malformed stance is counted `invalid` and the seat still passes (real CLI-prompt/settlement regression).
- [x] Existing no-stance workflow behavior remains covered and passes the integrated workflow suite.

Evidence: [`observe-discussion-measurement-261005.md`](../reports/observe-discussion-measurement-261005.md); initial blocked panel is preserved as partial evidence, not counted as three valid votes.

## Risk Assessment

- Open-ended questions have no options and will read `unmeasured`; accepted and stated, no semantic clustering.
- Models may ignore the instruction: `stancesMissing` keeps the ratio honest.
- Signal it broke: `stancesMissing` above half on live runs; response: brief wording, not the sensor.
