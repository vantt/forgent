# Assignment, Run, And RunResult Contract

Document type: Contract
Design status: Accepted
Implementation: Partial
Last reviewed: 2026-08-31
Canonical for: semantic requests, runtime attempts, normalized results, and evidence

## Assignment

Assignment is an immutable semantic request. It should identify:

- Assignment ID and schema version;
- optional Work/context reference;
- operation and Role;
- objective and bounded inputs;
- constraints and mutation policy;
- expected outputs and evidence requirements;
- dispatch policy inputs;
- result/artifact destination contract;
- creation timestamp and caller provenance.

Assignment construction has two accepted provenance classes:

1. a declared Stage Operation and TaskSpec;
2. an agent-proposed inline execution contract validated by foundation policy
   and any selected domain harness.

[ADR-006](../decisions/ADR-006-assignment-provenance-and-contract-snapshot.md)
accepts how both classes converge: every Assignment carries
`provenance.kind = declared | inline` with policy/normalizer versions and the
validator chain, and the normalizer stamps `mutation` and `evidence.required`
onto the immutable snapshot. Result interpretation reads those fields rather
than switching on the operation id. The minimum inline field set is listed in
ADR-006; in the first slice inline contracts are read-only only and carry no
session reference. Implementation of the inline class and the stamped snapshot
has not started; the declared-operation path remains the only implemented
general builder until then.

Assignment does not contain attempt status as lifecycle truth. Retry does not
rewrite the Assignment.

## Run

Run is one execution attempt for one Assignment. It should identify:

- Run ID and Assignment reference;
- resolved DispatchPlan/executor/mechanism;
- start/settlement timestamps;
- process/transport metadata;
- result and artifact refs;
- exit/timeout/launch failure details;
- evidence snapshot boundaries needed for post-run comparison.

One Assignment may have multiple Runs. Prior attempts remain immutable evidence.

## RunResult

RunResult is the normalized outcome for one Run. It should identify:

- Run and Assignment refs;
- normalized status and confidence;
- worker claim and structured result ref;
- accepted/rejected evidence refs and reasons;
- artifacts and expected-output checks;
- verification commands/results when applicable;
- failure classification;
- timestamps and normalizer provenance.

## Confidence

The exact vocabulary may evolve, but these boundaries are mandatory:

- verified confidence requires independently checkable required evidence;
- reported confidence is allowed only when the operation permits analytical or
  advisory output without external verification;
- no-evidence cannot satisfy evidence-required success;
- malformed, stale, or cross-context evidence cannot raise confidence;
- process success cannot substitute for semantic success.

## Evidence Freshness

Mutating operations must distinguish pre-existing state from changes attributable
to the Run. Evidence checks should use pre/post snapshots, git state, artifact
timestamps/hashes, expected-file rules, or equivalent operation-specific proof.

## Work Boundary

Assignment, Run, and RunResult may reference Work and inform its driver. None is
authorized to move Work status/stage, accept, approve, claim, return, or merge.

## Required Negative Tests

- missing or malformed worker result;
- exit zero with absent expected output;
- stale result artifact;
- evidence belonging to another Assignment/Run;
- dirty-before file claimed as new output;
- mutating claim with no post-run delta;
- dispatch rejection before launch;
- timeout/non-zero exit with misleading success text;
- retry preserving prior Run and evidence;
- RunResult persistence failure not reported as success.

Implementation-era detail remains in [Step 03](../roadmap/team-dispatch-v1/step-03-assignment-runresult.md)
and [Step 04](../roadmap/team-dispatch-v1/step-04-assignment-runresult-hardening.md).
