# P07 - CLI Harness Responsibility Audit

**Capability:** `code:review`

**Depends on:** P06

## Purpose

Account for the remaining cost concentrated behind
`test/cli/helpers/fgos-cli-harness.mjs` and turn the largest safe opportunities
into implementation-ready follow-up candidates, per TFC-D09 and TFC-D13.

This is an audit cell. It does not refactor `bin/fgos.mjs`, move behavior tests,
or change harness execution.

## Read First

`decision-lock.md`, `reports/green-baseline.md`, all pilot reports,
`test/cli/helpers/fgos-cli-harness.mjs`, `bin/fgos.mjs`,
`src/verbs/`, `test/cli/`, `test/verbs/`, RUL37 in `docs/specs/runner.md`, and
the test-consolidation history.

## File Lease

- Add: `reports/cli-harness-responsibility-audit.md`
- Add: machine-readable inventory artifacts under this plan's `reports/`
- Must not edit: `src/**`, `bin/**`, `test/**`, `package*.json`, CI, skills, or
  product documentation

## Requirements

R1. Inventory every harness `run()` call site and every helper that invokes it;
record file, test/cluster, verb, setup operations, and available timing evidence.

R2. Classify each execution into exactly one primary responsibility:
`process-contract`, `git/process-integration`, `business/use-case-behavior`,
`fixture-construction`, or `unknown`. Secondary tags may be recorded but may not
hide the primary count.

R3. For `business/use-case-behavior`, trace the actual guard/use-case source and
identify whether a direct test surface already exists. Similar names or exit
codes are not sufficient.

R4. For `process-contract`, name the boundary being proved: parsing, environment,
cwd/dir resolution, exit/category mapping, stdout/stderr/envelope, lock/PID,
signal/timeout, or another explicit process property.

R5. For Git-backed cases, distinguish business logic that can move down from the
real Git transport, rollback, worktree, conflict, persistence, and concurrency
proofs that must remain.

R6. Produce counts and measured/estimated cost by responsibility. Label static
call-site counts, JUnit duration, process tracing, and extrapolation separately;
never present their sum as a measured wall-clock saving.

R7. Name the minimum representative CLI doors that must remain for every
candidate cluster. Preserve distinct `approve`, `merge next`, `sync-root`,
GitHub, rollback, and durable-write boundaries where their mechanisms differ.

R8. Select exactly two highest-value bounded candidate clusters using measured
cost, common-guard confidence, implementation size, and boundary risk. Each
candidate must include files, symbols, tests retained/moved, expected work
removed, verification command, rollback, and canonical capability.

R9. Decide whether each candidate needs only existing use-case/guard tests or
requires a callable CLI core. `runCli(argv, ctx)` may be recommended only after
checking committed Rust-host release posture; uncommitted packaging documents
are evidence to ignore, not authority.

R10. Reconcile the inventory total with the harness call-site population and
explain every `unknown`. Unknown cases stay subprocess-backed and cannot be
counted as savings.

## Adversarial Checks

- Parameterized rows counted as fewer executions when they still call `run()`.
- One test assigned to multiple primary categories to inflate totals.
- A same-message assertion incorrectly treated as a common guard.
- Process, Git, or persistence boundaries removed to reach a target count.
- Static `run(` matches mistaken for runtime subprocess measurements.
- Legacy-node deprecation inferred from the user's uncommitted docs.

## Verification

```sh
npm test
git diff --check
```

Additionally, the report's category totals must reproduce from its retained
machine-readable inventory, and every selected candidate's named files/symbols
must exist at the audited SHA.

## Acceptance

Every harness execution is accounted for or explicitly `unknown`; category and
cost totals are reproducible; preserved process/Git boundaries are named; two
and only two bounded candidates are implementation-ready; no source/test/harness
behavior changed.

## Risks And Rollback

Risk is an attractive but unsupported consolidation target. Reject any candidate
without a common guard or preserved-boundary map. This docs-only cell rolls back
unsupported conclusions, never earlier accepted pilot implementations.

## Handoff

P08 receives the complete inventory, two candidate packets, and the callable-CLI
decision. It may authorize a new follow-up plan, but it may not start either
candidate inside this track.
