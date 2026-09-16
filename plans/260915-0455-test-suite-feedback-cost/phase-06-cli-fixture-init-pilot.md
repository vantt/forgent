# P06 - CLI Fixture Initialization Pilot

**Capability:** `code:refactor`

**Depends on:** P05

## Purpose

Determine whether selected CLI tests can avoid a subprocess-only `fgos init`
fixture cost while preserving the exact preconditions they require, per TFC-D06.

## Read First

`decision-lock.md`, `reports/green-baseline.md`,
`test/cli/helpers/fgos-cli-harness.mjs`, the production init path, and three
representative CLI files selected from current profile evidence.

## File Lease

- May edit: `test/cli/helpers/fgos-cli-harness.mjs`
- May add: a bounded fixture helper and `reports/fixture-init-pilot.md`
- May edit: exactly the three pilot test files when an explicit opt-in is safer
  than changing the shared default
- Must not edit: production init behavior, init/pre-init/startup-contract tests,
  or broad CLI test bodies

## Requirements

R1. Register a pre-mutation threshold from P02 noise and measure the same three
   files before changing fixture setup.
R2. Compare real in-process initialization with one process-local template-copy
   strategy; do not assume either is equivalent.
R3. Preserve a fresh directory/state per case, writer isolation, defaults,
   coexistence manifest, view/event shape, and any required Git HEAD notice.
R4. Keep CLI bootstrap for tests that prove init, pre-init refusal, idempotency,
   startup output, or process boundary.
R5. Prefer explicit pilot opt-in if changing `tmpCwd()` globally cannot be proven
   from the three-file experiment.
R6. Measure wall time, process-tree CPU where valid, and harness-scoped spawn
   count before/after without attributing unrelated prior pilots.

## Adversarial Checks

- Template state reused mutably between cases.
- Missing defaults or initialization side effects hidden by existing helpers.
- Agent-session writer pin lost in the new path.
- Git and non-Git fixtures treated as equivalent.
- Three green files used to justify an unmeasured suite-wide helper switch.

## Verification

Run the three pilot files and dedicated fixture-equivalence tests, then:

```sh
npm test
```

## Acceptance

The report shows both candidate strategies, precondition equivalence, retained
raw timings, and an `expand`, `revise`, or `stop` verdict. No shared-default
rollout occurs unless the experiment directly proves it and the measured gain
exceeds the pre-registered threshold.

## Risks And Rollback

Risk is a fast fixture with missing initialization semantics or shared mutable
state. Revert the experimental helper/default and retain the comparative `stop`
report when R3/R4 or the threshold cannot be met.

## Handoff

Commit only the bounded winning pilot, or revert the experiment and commit a
`stop` report when neither strategy clears the bar. P07 consumes the report,
not an optimistic estimate.
