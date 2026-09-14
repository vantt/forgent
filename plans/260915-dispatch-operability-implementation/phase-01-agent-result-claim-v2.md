# I01 - Agent Result Claim v2

**Capability:** `code:implement`, `code:test`
**Status:** planned

## Goal

Define `agent-result-claim.v2` as one contract source used by both worker-facing
prompt text and `agent-result.json` validation. This cell must not change
RunResult semantics beyond consuming the richer claim shape as input evidence.

## File Lease

Primary lease:

- `src/runner/dispatch/assignment.mjs`
- `src/runner/dispatch/brief.mjs`
- `src/runner/dispatch/worker-artifacts.mjs`
- `test/runner/assignment.test.mjs`
- `test/runner/dispatch-brief.test.mjs`

Expected new file:

- `src/runner/dispatch/agent-result-claim-contract.mjs`
- `test/runner/agent-result-claim-contract.test.mjs`

Do not edit:

- `src/runner/dispatch/assignment-runner.mjs` beyond imports necessary to
  consume the new validator.
- `src/verbs/dispatch/recover.mjs`
- `src/verbs/coordination/recover.mjs`

## Work

1. Introduce a pure contract module that exports:
   - contract id/version: `agent-result-claim`, version `2`;
   - allowed statuses: `done`, `blocked`, `failed`, `no-evidence`;
   - schema/validation function;
   - prompt snippet generator from the same field definition;
   - helpers for reviewer/red-team/recheck assessment requirements.
2. Update `validateAgentResultClaim` to delegate to the contract module while
   preserving legacy inputs as legacy claim input, not terminal truth.
3. Update `renderAssignmentPrompt` and `renderBrief` to render the generated
   claim instructions.
4. Keep legacy flat `agent-result.json` and outbox `result-<round>.json`
   discovery behavior byte-compatible.

## Acceptance

- Prompt text and validator are proven to derive from the same contract
  definition.
- Reviewer/red-team/recheck claims require `assessment.verdict`.
- `blocked` requires `blocker`; `failed` requires `error`; `summary` is always
  required.
- Claims remain untrusted input; no proof or RunResult is produced by this
  cell alone.
- Legacy claim input remains accepted or rejected exactly by documented legacy
  interpretation rules; it is not silently upgraded to v2 proof.

## Required Tests

- `node --test test/runner/agent-result-claim-contract.test.mjs`
- `node --test test/runner/assignment.test.mjs`
- `node --test test/runner/dispatch-brief.test.mjs`

Add tests that fail if a new required field is added to the validator but not
to prompt rendering, or vice versa.
