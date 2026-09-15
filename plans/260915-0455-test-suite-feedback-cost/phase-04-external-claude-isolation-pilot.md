# P04 - External Claude Isolation Pilot

**Capability:** `code:implement`

**Depends on:** P03

## Purpose

Remove unintended real-Claude execution from tests that are not proving the
Claude integration boundary, and measure the isolated effect, per TFC-D06.

## Read First

`decision-lock.md`, `reports/green-baseline.md`,
`docs/history/npm-test-cpu-real-claude-spawns/`, setup test helpers, and the
eight candidate sites listed in the advisory report.

## File Lease

- May edit: only candidate setup/doctor test files confirmed to reach the
  Claude registry path
- May edit: shared setup test env helper when impact analysis proves it is the
  narrower single source
- May add: `reports/external-claude-pilot.md`
- Must not edit: setup/doctor production code or tests intentionally exercising
  a fake/real Claude command

## Requirements

R1. Trace every candidate to the external spawn before editing; reject false
   positives explicitly.
R2. Use the existing `NO_CLAUDE_ENV`/nonexistent-command seam while preserving
   all other environment inputs.
R3. Prove the test still reaches and asserts its intended setup/doctor behavior.
R4. Measure each affected file before and after; distinguish the directly
   measured result from aggregate estimates.
R5. Add a regression guard that makes accidental real provider execution fail
   closed where the existing harness can express it.

## Adversarial Checks

- `setup --help` or `uninstall` falsely counted as registry execution.
- Blocking Claude also bypassing the actual check under test.
- HOME/PATH/config behavior lost while swapping env.
- A newly added setup/doctor test inheriting the real provider again.

## Verification

Run each affected test file directly, then:

```sh
npm test
```

## Acceptance

Every edited site has a traced external path and retained before/after timing;
focused and full tests are green; intentionally provider-facing tests remain;
the report returns `expand`, `revise`, or `stop` without claiming unmeasured
savings.

## Risks And Rollback

Risk is suppressing the check being tested along with the external process. Any
site that cannot satisfy R1-R3 stays unchanged; revert only that candidate and
record it as rejected rather than weakening the whole pilot.

## Handoff

Record confirmed/rejected candidates and measured savings. P05 starts from the
integrated post-pilot baseline but reports selector value separately.
