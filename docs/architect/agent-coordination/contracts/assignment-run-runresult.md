# Assignment, Run, And RunResult Contract

Document type: Contract
Design status: Accepted
Implementation: Partial
Last reviewed: 2026-09-11
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

### Run Phases And Admission

A Run is the unit of admission: it is the one record that says "this attempt
is allowed to exist". Every runtime-layer concern (RunHandle, continuation
planning, executor fallback) reads and references Run; none of them admits an
attempt on its own.

Phases, in order:

| Phase | Meaning | Must hold before entering |
|---|---|---|
| `admitted` | Run record durably written: `runId`, `assignmentId`, `attempt`, resolved DispatchPlan. | No runtime resource exists yet. `runId` is the launch identity used to reconcile crashes and orphaned runtimes; it is deterministic per (Assignment, attempt). |
| `launched` | The runtime adapter created a runtime resource (pane, process, job). | An admitted Run. A runtime found without an admitted Run is an orphan: reconcile it by `runId`, never adopt it as a new Run. |
| `bound` | The RunHandle binding (locator + owner) is durably recorded. | Launched. Binding is written before any non-idempotent prompt or input is delivered. |
| `delivered` | The work prompt/input reached the worker. | Bound. Delivery is a tri-state fact: `not-sent`, `sent`, `unknown`. A request sent without acknowledgment is `unknown`, never "launch failed". |
| `settled` | A normalized RunResult or an explicit failure record exists. | Any earlier phase; crash windows settle as explicit failure with the phase reached. |

Admission rules:

- At most one un-settled Run per Assignment. A new Run is legal only after the
  prior Run is settled or superseded through a declared supersession event
  (`run-retried` in CoordinationSession; standalone dispatch records the
  equivalent event before the new Run is admitted).
- `attempt` never resets on coordinator restart, candidate change, or
  executor fallback. Attempt budget is counted against the Assignment.
- A missing or lost RunHandle never grants a new admission. Recovery reads
  worker result first, then RunHandle, then classifies, and only then asks for
  a new Run through this admission rule.
- Cancellation requested is a fact about intent, not proof the worker stopped.
  A cancelled Run still settles through its late result if one arrives.

Three guarantees, kept distinct:

- **Control fencing** — one controller per un-settled Run. Implemented with
  the repository's existing exclusive-create lock pattern (holder identity,
  expiry, stale-by-pid). Observers hold no lock. A controller that lost the
  lock may not deliver input, terminate, or write Run/RunHandle state.
- **Result fencing** — a superseded Run loses the right to publish the
  Assignment's authoritative result (`result-linked` after `run-retried`).
  Its late result is still stored and validated: it may prove an effect
  already happened.
- **Effect protection** — deduplication or isolation at the place the effect
  occurs. Owned by the operation contract and its adapter. Run promises no
  exactly-once external effect; a stopped worker does not mean its effects
  are absent.

Implementation status: deterministic `runId` before spawn and `run-retried`
supersession are implemented (`src/runner/dispatch/assignment-runner.mjs`,
CoordinationSession store/replay). Durable `admitted` before launch, the
`bound`/`delivered` phases, the standalone supersession event, and the
per-Run controller lock are not implemented; they are specified here so
[RunHandle](../architecture/run-handle.md),
[Continuation Planner](../architecture/coordination-continuation-recovery.md),
and [Executor Fallback](../architecture/executor-health-and-fallback.md) share
one admission authority instead of each inventing its own.

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
- RunResult persistence failure not reported as success;
- crash after `admitted` before `launched`: reconcile finds no runtime, admits
  no duplicate;
- crash after `launched` before `bound`: orphan runtime reconciled by `runId`;
- delivery `unknown` never classified as launch failure;
- second controller on an un-settled Run refused;
- coordinator restart does not reset `attempt`;
- superseded Run's late result stored and validated, never accepted as the
  Assignment's authoritative result.

Implementation-era detail remains in [Step 03](../roadmap/team-dispatch-v1/step-03-assignment-runresult.md)
and [Step 04](../roadmap/team-dispatch-v1/step-04-assignment-runresult-hardening.md).
