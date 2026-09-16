# I04 - dispatch.runtime.inspect

**Capability:** `code:implement`, `code:test`, `docs:update`
**Status:** planned

## Goal

Expose one Dispatch-owned read operation, `dispatch.runtime.inspect`, with CLI
projection `fgos dispatch inspect` accepting exactly one typed selector:
`--run`, `--assignment`, or `--cwd`.

## File Lease

Primary lease:

- `src/verbs/dispatch/show-run.mjs`
- `src/cli/command-registry.mjs`
- `bin/fgos.mjs`
- `test/cli/command-registry.test.mjs`
- `test/cli/fgos-help.test.mjs`

Expected new files:

- `src/verbs/dispatch/inspect.mjs`
- `src/runner/dispatch/runtime-inspection.mjs`
- `test/runner/dispatch-runtime-inspect.test.mjs`
- `test/cli/dispatch-inspect.test.mjs`

Docs:

- `docs/specs/runner.md`
- `docs/architect/agent-coordination/contracts/assignment-run-runresult.md`
- `CHANGELOG.md`

## Work

1. Add selector validation with exactly one of `run`, `assignment`, `cwd`.
2. Implement read ports that compose:
   - run repository lookup across Assignment-owned runs and dispatch-runs;
   - assignment run history and current-run derivation from admission facts;
   - cwd aggregate facts including locks, active/history matches, workspace
     observations, and guard/projection conflicts;
   - coordination ownership hints only as read projection.
3. Return `RunObservation` plus `RunResult` when available.
4. Return all duplicate run-id candidates before deciding ambiguity; never
   first-match-wins.
5. Add recovery-authority hints only when subject ownership is unique.
6. Prove the use case imports no recovery apply, adapter launch, process kill,
   or Git mutation modules.

## Acceptance

- Zero selectors and multiple selectors are validation failures.
- Host/CLI routing passes only `operationId/effect/payload`; selector authority
  is resolved inside Dispatch inspection.
- Duplicate Run ids return `inspectionStatus: "ambiguous"` with all candidate
  locations.
- Assignment inspection derives current run from admission/supersession facts,
  not numeric attempt order.
- Cwd inspection returns aggregate facts, not a single guessed run.
- Inspection never calls, forwards, or authorizes recovery.

## Required Tests

- `node --test test/runner/dispatch-runtime-inspect.test.mjs`
- `node --test test/cli/dispatch-inspect.test.mjs`
- `node --test test/cli/command-registry.test.mjs`

Include a static import/call test that fails if inspect depends on recovery
apply, adapter launch, process kill/signal, or Git mutation modules.
