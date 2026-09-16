# Handoff - Bin-Local State Verb Use-Case Extraction

Recommended next track: `test-suite-feedback-cost-state-verb-usecases`

Capability: `code:refactor`

Source packet: P07 candidate `bin-local-state-verb-usecase-extraction`

## Objective

Move business/use-case behavior currently trapped behind selected
`bin/fgos.mjs` CLI cases into narrow callable use-case modules, while preserving
CLI subprocess tests for parser, envelope, cwd/env resolution, and process error
mapping.

This is not authorization for a global `runCli(argv, ctx)`.

## First Hotspot

Start with the state/intake/read-side cluster named by P07:

- `test/cli/fgos-stage.test.mjs`
- `test/cli/fgos-stage-2.test.mjs`
- `test/cli/fgos-stage-3.test.mjs`
- `test/cli/fgos-edit.test.mjs`
- `test/cli/fgos-edit-2.test.mjs`
- `test/cli/fgos-edit-3.test.mjs`
- `test/cli/fgos-read.test.mjs`
- `test/cli/fgos-read-2.test.mjs`
- `test/cli/fgos-read-3.test.mjs`
- `test/cli/fgos-read-4.test.mjs`
- `test/cli/fgos-read-5.test.mjs`

P07 counted 259 static business/use-case call sites in these named files and
identified existing direct test surfaces for part of the logic. Treat P02's
file-duration total as orientation, not a measured saving.

## Candidate Symbols

CLI cases to extract narrowly:

- `discover`
- `plan`
- `edit`
- `move`
- `graph`
- `stale`
- `workflow`
- `gate-check`

Existing cores to preserve or wrap:

- `resolveDiscovery`
- `resolvePlan`
- `editWork`
- `moveWork`
- `graphMetrics`
- `staleDoingAdvisory`

Match the existing `src/verbs/merge/*` convention: use-case functions accept a
context object and parsed options. Do not make them read `process.cwd()`,
`process.env`, or raw argv.

## Preserved Doors

Keep subprocess-backed tests for:

- one parser/envelope/error-category smoke per affected verb;
- cwd and `--dir` resolution;
- env/config behavior for `discover` and `plan`;
- malformed flag JSON and user-facing stderr/stdout shape;
- every existing Git/process-integration test outside this state/read-side
  cluster.

## Required Baseline And Proof

Before mutation, rebuild dependencies and record focused timing for:

```sh
cargo build --release --workspace
npm ci
node --test \
  test/intake/discovery.test.mjs \
  test/intake/plan.test.mjs \
  test/state/store.test.mjs \
  test/state/graph-metrics.test.mjs \
  test/state/runtime-coordination.test.mjs
node --test \
  test/cli/fgos-stage.test.mjs \
  test/cli/fgos-stage-2.test.mjs \
  test/cli/fgos-stage-3.test.mjs \
  test/cli/fgos-edit.test.mjs \
  test/cli/fgos-edit-2.test.mjs \
  test/cli/fgos-edit-3.test.mjs \
  test/cli/fgos-read.test.mjs \
  test/cli/fgos-read-2.test.mjs \
  test/cli/fgos-read-3.test.mjs \
  test/cli/fgos-read-4.test.mjs \
  test/cli/fgos-read-5.test.mjs
```

After mutation, repeat the focused commands, then run:

```sh
npm test
git diff --check
```

Run GitNexus `impact` before editing production symbols and `detect_changes`
before commit when `.gitnexus/run.cjs` is available. If unavailable, record the
exact failure and do a manual scoped diff audit.

## Acceptance

Each moved assertion must name the production use-case or guard it now exercises
directly. Each affected verb must retain at least one subprocess smoke for the
CLI adapter boundary. The final report must distinguish reduced subprocess
execution from mere source cleanup.

## Rollback

Revert the extracted use-case modules and restore the affected `bin/fgos.mjs`
cases. Keep new direct tests only when they still exercise exported production
symbols after rollback.
