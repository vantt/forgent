# I03 - RunResult v2 And Attribution

**Capability:** `code:implement`, `code:test`
**Status:** planned

## Goal

Write native `RunResult` v2 for new runs, interpret existing result files
deterministically as legacy-derived v1, and separate execution, assessment,
confidence, attribution, and policy dimensions.

## File Lease

Primary lease:

- `src/runner/dispatch/assignment-runner.mjs`
- `src/runner/dispatch/operation-choice.mjs`
- `src/runner/dispatch/result-ladder.mjs`
- `src/runner/dispatch/worker-artifacts.mjs`
- `test/runner/assignment-runresult.test.mjs`
- `test/runner/operation-choice.test.mjs`

Expected new files:

- `src/runner/dispatch/run-result.mjs`
- `src/runner/dispatch/evidence-attribution.mjs`
- `test/runner/run-result-v2.test.mjs`
- `test/runner/evidence-attribution.test.mjs`

## Work

1. Add `normalizeRunResultV2` and `interpretRunResult` helpers.
2. Write new terminal results to the existing `runs/<n>/result.json` path
   with `contract: { id: "assignment-run-result", version: 2 }`.
3. Preserve legacy top-level `status` and `confidence` projections for callers
   that still read them.
4. Interpret legacy result files as `classification.provenance:
   "legacy-derived"` without rewriting their bytes.
5. Split evidence attribution from policy:
   - pre-existing dirt can be `excluded`;
   - post-run git dirt without positive observer is at most `correlated`;
   - adapter/confinement positive coverage may be `proven` only inside declared
     coverage;
   - policy refusal preserves execution and assessment facts.
6. Keep provider/resource failures distinct from reviewer/red-team findings.

## Acceptance

- `RunResult` v2 is the only terminal truth for new runs.
- A reviewer finding is `execution.completed` plus
  `assessment.findings`, not a provider crash.
- Timeout/crash/nonzero process exit map to typed failure families.
- Invalid or contradictory worker claims are preserved and refused; artifacts
  are not erased.
- Legacy files are read deterministically and not rewritten.
- Existing consumers that still read `status` and `confidence` continue to
  behave conservatively.

## Required Tests

- `node --test test/runner/run-result-v2.test.mjs`
- `node --test test/runner/evidence-attribution.test.mjs`
- `node --test test/runner/assignment-runresult.test.mjs`
- `node --test test/runner/operation-choice.test.mjs`

At least one test must assert byte preservation for a legacy result fixture.
