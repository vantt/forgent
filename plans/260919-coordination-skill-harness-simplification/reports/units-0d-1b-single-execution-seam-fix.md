# Units 0D/1B — single execution seam repair

Date: 2026-09-21 (Asia/Ho_Chi_Minh)
Worktree: `/home/vantt/projects/forgentX/.claude/worktrees/coordination-skill-harness-simplification`
Branch: `coordination-skill-harness-simplification`
HEAD after sync with `main`: `7f7bec03a8d811e0d7e7fb22e5ea1ac2d83dfabe`

## Scope and checkout evidence

This report is a new implementer report for F-R01. The reviewer report
`units-0d-1b-independent-recheck-7.md` was not edited or deleted. No file was
staged and no commit was created.

The pre-repair fingerprint recorded by the reviewer was:

`71ae60c3084339738eb3d7977cc315e0628da4651fca402a2933472a0241352b`

The implementation-scope fingerprint after repair, before adding this report,
was:

`66e442cb1a29b7ace79dcee7355f6bff90e8259ff91a65bf19b1bc8f138daa01`

The checkout already contained the following dirty paths before this repair
and they were preserved: `bin/fgos.mjs`, `docs/architecture-manifest.json`,
`src/cli/command-registry.mjs`, `src/runner/coordination/session-engine.mjs`,
`src/runner/coordination/store.mjs`, `src/state/events.mjs`,
`src/verbs/coordination/close.mjs`, `src/verbs/coordination/run.mjs`,
`src/verbs/coordination/schema.mjs`, `src/verbs/coordination/show.mjs`,
`test/architecture.test.mjs`, `test/cli/coordination.test.mjs`,
`test/runner/coordination-recheck-discharge.test.mjs`, and
`test/runner/coordination-research-fan-out.test.mjs`.

The track's existing untracked paths were also preserved. Repair work added or
changed only the coordination action/run seam, its architecture proof, and the
existing Assignment caller-provenance contract needed to persist the canonical
fan-out payload; no store, sidecar, config, environment variable, dependency,
or persistent truth source was added.

Exact final `git status --short` path set:

```text
M bin/fgos.mjs
M docs/architecture-manifest.json
M src/cli/command-registry.mjs
M src/runner/coordination/session-engine.mjs
M src/runner/coordination/store.mjs
M src/runner/dispatch/assignment.mjs
M src/runner/dispatch/execution-contract.mjs
M src/state/events.mjs
M src/verbs/coordination/close.mjs
M src/verbs/coordination/run.mjs
M src/verbs/coordination/schema.mjs
M src/verbs/coordination/show.mjs
M test/architecture.test.mjs
M test/cli/coordination.test.mjs
M test/runner/coordination-recheck-discharge.test.mjs
M test/runner/coordination-research-fan-out.test.mjs
?? plans/260919-coordination-skill-harness-simplification/
?? src/runner/coordination/action-precondition.mjs
?? src/runner/coordination/actions-projector.mjs
?? src/runner/coordination/fan-out-payload.mjs
?? src/runner/coordination/legality-facts.mjs
?? src/verbs/coordination/actions.mjs
?? test/runner/coordination-actions-v1.test.mjs
?? test/runner/coordination-legality-facts.test.mjs
?? test/runner/coordination-stale-action-proof.test.mjs
```

The final source fingerprint is
`9f12e0194dd4875c5faf2472525810ff6c7723f4cae866c4cb7ea1534f1a8d59`.
It is the SHA-256 of porcelain-v2 status, staged/unstaged binary diffs, and
byte-sorted content digests under `bin/`, `docs/`, `src/`, `test/`, and the
track plan excluding both reviewer and implementer reports. No source/test
drift was observed after the test runs.

## Before/after call graph

Before:

```text
executeCoordinationActionUseCase
  -> executeCoordinationRunKernel
     -> executeUnderActionPrecondition
        -> action-only switch(kind)
           -> six *Locked mutation doors

runCoordinationUseCase
  -> validateCoordinationRequest
  -> executeCoordinationRunKernel
     -> separate raw steps loop
        -> six public mutation doors
```

After:

```text
executeCoordinationActionUseCase
  -> executeCoordinationRunKernel (action precondition)
     -> withSessionLock / reload manifest+events+definition
     -> project and compare actionKey/kind/target/input/driver
     -> composeCoordinationActionRequest
     -> validateCoordinationRequest (production validator)
     -> executeValidatedCoordinationStep(normalized step, held lock)
     -> existing locked session-engine/store mutation door
     -> authoritative event/Assignment/Run/RunResult

runCoordinationUseCase
  -> validateCoordinationRequest
  -> executeCoordinationRunKernel
     -> executeValidatedCoordinationStep(normalized step)
     -> existing public session-engine/store mutation door
     -> authoritative event/Assignment/Run/RunResult
```

`executeValidatedCoordinationStep` is the single implementation for operation,
authorize, disposition, human-turn, contribution, and fan-out handling. The
raw loop calls it at `src/verbs/coordination/run.mjs:654`; the semantic action
path calls the same function at `src/verbs/coordination/run.mjs:504`. Its
`lockContext` selects the existing lock-held door without duplicating the
family logic. Close remains on `executeCoordinationCloseKernel` and
`validateCoordinationCloseRequest`.

## Canonical action request mapping

`composeCoordinationActionRequest` is in
`src/verbs/coordination/actions.mjs:37`. It derives `coordinationId`,
`objective`, `protocolRef.id`, and `writerId` from the authoritative session
and validated caller/action precondition. It never accepts caller-selected
target bindings. The mapping is:

| Action | Canonical request steps |
|---|---|
| `dispatch-operation` | one `operation` step; operationId/actorId from descriptor target; objective/outputs and other portable inputs from action input |
| `authorize-and-dispatch` | `authorize` then `operation`; operation/node/actor binding from descriptor target; authorization fields from input; both execute in order while the same lock is held |
| `record-disposition` | one `disposition` step; targetRef from descriptor target; disposition/rationale/evidence from input |
| `record-human-turn` | one `human-turn` step; only schema-owned human-turn fields are composed; revision and recordedBy remain production-derived |
| `link-contribution` | one `contribution` step; assignmentId from descriptor target; contribution type/id/round/lineage from input |
| `fan-out` | one `fan-out` step; operationId from descriptor target; branch payload from input only after the lock-held precondition enforces an exact, duplicate-free, order-insensitive match with `target.allowedActorIds`; the composer sorts branches by actorId before production validation |

The composer rejects reserved target/binding fields in `inputPayload`, so an
action cannot override operation, actor, node, assignment, or target refs.
Unknown/malformed fields then fail through `validateCoordinationRequest`.
For fan-out, `assertExactFanOutActorCohort` compares the actual
`inputPayload.branches[].actorId` set with the projected descriptor cohort
before any Assignment mutation. Missing, extra, replaced, and duplicate
actors refuse with zero events/Assignments; the same exact set in another
order is accepted and canonicalized. `fan-out-payload.mjs` is the shared
pure normalizer used by the composer, initial cohort validation, persisted
Assignment provenance, and retry comparison.

## Retry fan-out repair

The retry/reconstruction path now applies the same exact-cohort check as the
initial action path. It normalizes every branch by actor, objective,
expectedOutputs, constraints, capabilities, fromAssignmentId, intent, and
taskKey, then compares the complete canonical array against the persisted
payload. The persisted payload is stored in the existing authoritative
`Assignment.provenance.inline.caller.coordination.fanOutPayload`; no sidecar
or second truth source was introduced.

The production stale-action proof covers subset, superset, substitution, and
duplicate retry cohorts, plus changing each of expectedOutputs, constraints,
capabilities, fromAssignmentId, intent, and taskKey. Every mismatch returns
`payload-conflict` before mutation. A same payload with reversed branch order
returns the authoritative idempotent result. If an old persisted Assignment
has no canonical fan-out payload, reconstruction fails closed as
`payload-conflict` rather than guessing.

The follow-up recheck also exposed two retry gaps and both are now closed:

- Dispatch-operation persists the complete production-normalized operation
  step, including optional fields and an explicit `omittedFields` marker for
  JSON-safe omitted/present semantics. Retry recomposes that step through
  `composeCoordinationActionRequest` and `validateCoordinationRequest`, then
  compares the complete canonical payload. The action key and action kind are
  persisted alongside it, so an unrelated Assignment cannot satisfy the
  retry.
- Fan-out persists that same action invocation identity and canonical full
  fan-out step on every branch. Reconstruction filters by the exact action key
  and kind, rejects duplicate actors, requires one Assignment per requested
  actor, requires the exact cohort, and fails closed when invocation
  provenance or per-branch canonical payload is absent. It no longer accepts
  cardinality or subset matches, nor assignments from another invocation.

The production stale-action proof covers changed and omitted
dispatch-operation fields, zero-mutation conflicts, exact/reordered fan-out
idempotency, subset, superset, substitution, duplicate, mixed-invocation and
partial-cohort rejection. Omitted fields that the production validator
normalizes to the same empty value (for example omitted `contextRefs` versus
`[]`) remain idempotent; omitted fields whose normalized value is absent versus
present conflict.

### FRR-1B-003 — authorize-and-dispatch whole-action retry

`authorize-and-dispatch` now persists one canonical action invocation for the
logical two-step action. After `composeCoordinationActionRequest` has produced
the production request, the action door canonicalizes the complete
`composed.steps` array once and passes the same `actionKey`, `kind`, and
`normalizedSteps` object to both the authorize and operation executions. The
operation Assignment therefore carries the authorize step and operation step,
not only the final operation step.

On retry, `executeUnderActionPrecondition` requires the matching
`operation-authorized` event and the Assignment that consumed its authorization
ID. Production retries require the persisted action key, kind, and non-empty
whole-action `normalizedSteps`; the retry is recomposed and passed through the
production validator before canonicalization. The canonical arrays are then
compared as a complete value. Missing, corrupt, or mismatched invocation
provenance fails closed; there is no production fallback to the old
intersection comparator. The legacy comparator remains only for synthetic
low-level fixtures that do not provide the production composer.

The production test matrix changes each authorization-step field and each
operation-step field independently, tests omitted present optional fields, and
asserts `payload-conflict` with unchanged event and Assignment directories.
Fields whose omission production-normalizes to the same value remain
idempotent by contract. Exact same normalized payload remains idempotent.

## Lock lifetime and identity

`executeUnderActionPrecondition` acquires the existing session lock at
`action-precondition.mjs:181`, reloads authoritative manifest/events and the
bound definition, recomputes the projection, compares action key/kind/target/
required inputs/allowed values/driver, composes and validates the request, and
invokes the shared executor before returning the lock owner. The lock is not
released between stale comparison and authoritative mutation. The locked
executor receives `paths` and the one `releaseLock` callback; it does not call
the public door and therefore does not reacquire the non-reentrant events
lock.

For non-close actions, caller `writerId` is mandatory and is compared directly
with `manifest.provenanceRoot.writerId` at `action-precondition.mjs:219-224`.
There is no fallback to the manifest when the caller omits it. Close continues
to require caller `authorizedBy.id`; it is not synthesized from `writerId`.

## Authoritative idempotency reconstruction

- Operation and fan-out retries reconstruct existing Assignment/Run records
  and authoritative assignment-created/result-linked events.
- Authorization retry reads the persisted `operation-authorized` event when
  the append is idempotent; it never reports an unpersisted second payload.
- Disposition retry reconstructs the authoritative disposition record.
- Human-turn retry reconstructs the recorded turn and its byte-derived
  SHA-256 revision.
- Contribution retry reconstructs the contribution linkage, assignment/run,
  artifact revision, lineage, and visibility-window evidence.

The stale-action proof exercises same-key/same-payload idempotency,
same-key/different-payload conflict, concurrent writers, crash-after-
authoritative-mutation retry, and confirms no `.action-keys.json` sidecar.
The production fan-out action proof additionally exercises missing actor,
foreign actor, replacement, duplicate actor, order-insensitive exact-set
acceptance, zero-mutation refusal, and retry idempotency.

## Architecture guard with teeth

`test/architecture.test.mjs` now checks the graph rather than only the
contents of `actions.mjs`. It requires the production action composer and
validator, requires one `executeValidatedCoordinationStep` implementation with
both raw/action callers, rejects action-only locked-mutator switches inside
`executeCoordinationRunKernel`, and rejects duplicate raw/action write-family
switches.

The deliberate broken fixture keeps `actions.mjs` clean, makes both doors call
`executeCoordinationRunKernel`, and places an action-only `switch(kind)` with a
`dispatchDeclaredOperationLocked` call inside that kernel. The guard fails it
for both “action-only locked-mutator switch” and “duplicate write-family
switches”. A separate fixture removes the production composer call and is
rejected as well.

## Tests and exact results

All commands ran in this worktree. Final results:

| Command | Exit | Result |
|---|---:|---|
| `node --test test/cli/coordination.test.mjs test/verbs/coordination-chain.test.mjs test/runner/coordination-baseline-measurement.test.mjs test/runner/coordination-legality-facts.test.mjs test/runner/coordination-actions-v1.test.mjs test/runner/coordination-stale-action-proof.test.mjs test/architecture.test.mjs test/skills/fgos-mirror.test.mjs` | 0 | 130 pass, 0 fail, 0 skipped; duration 353700.321336 ms |
| `node --test test/runner/coordination-driver-authorization.test.mjs test/runner/coordination-recheck-discharge.test.mjs test/runner/coordination-recheck-disposition.test.mjs test/runner/coordination-research-fan-out.test.mjs test/verbs/coordination-run-driver-steps.test.mjs` | 0 | 172 pass, 0 fail |
| `node --test test/architecture.test.mjs` | 0 | 12 pass, 0 fail |
| `node --test test/runner/coordination-stale-action-proof.test.mjs test/runner/coordination-actions-v1.test.mjs` | 0 | 46 pass, 0 fail |
| `node --test test/verbs/coordination-group-thinking-pack.test.mjs test/architecture.test.mjs test/runner/coordination-stale-action-proof.test.mjs` | 0 | 52 pass, 0 fail |
| `node --test test/architecture.test.mjs test/cli/coordination.test.mjs test/verbs/coordination-chain.test.mjs test/runner/coordination-legality-facts.test.mjs test/runner/coordination-actions-v1.test.mjs test/runner/coordination-stale-action-proof.test.mjs test/runner/coordination-driver-authorization.test.mjs test/runner/coordination-recheck-discharge.test.mjs test/runner/coordination-recheck-disposition.test.mjs test/runner/coordination-research-fan-out.test.mjs test/verbs/coordination-run-driver-steps.test.mjs` | 0 | 289 pass, 0 fail, 0 skipped |
| `npm test -- --test-reporter=dot` | 0 | 7,262 tests; 7,253 pass; 0 fail; 9 skipped; 0 cancelled; 0 todo |
| `git diff --check` | 0 | clean |

The first full-suite attempt before the compatibility warning was restored
had 7,246 pass and one failure in
`coordination-group-thinking-pack.test.mjs`; the final full suite above is
green after restoring that existing warning in the shared executor.

## Self-review answers

1. No action-only mutation switch remains. The only action switch is the
   canonical request composer in `actions.mjs`; write-family execution is in
   the one shared step executor.
2. Raw run and action execution call the exact same
   `executeValidatedCoordinationStep` implementation.
3. Production action execution calls `composeCoordinationActionRequest`, which
   calls `validateCoordinationRequest`, and executes the returned normalized
   `steps`; it does not validate a throwaway object.
4. Missing `writerId` fails `unauthorized`; it is never filled from the
   manifest. Foreign writer IDs fail the same comparison.
5. The existing session lock spans reload, projection, stale comparison,
   canonical composition/validation, and authoritative mutation.
6. The held-lock executor calls only lock-aware doors and passes the existing
   lock owner callback; it does not nest the public mutation door. Exceptions
   unwind through the existing lock wrapper.
7. Retry results are reconstructed from manifest/events, Assignment/Run
   records, persisted human-turn bytes/revision, contribution lineage/window
   evidence, or terminal events—not a sidecar.
8. The architecture fixture catches the exact “move the second engine into
   `run.mjs`” defect, and the final architecture test passes.

The required self-review search still finds the expected shared-kernel
references in `run.mjs` and the lock-aware implementations in the existing
session engine/store. Those are not action-only implementations: the raw loop
and action path both call `executeValidatedCoordinationStep`; the action
composer switch only constructs canonical request steps.

## Remaining known risks

GitNexus was stale/partial for this linked worktree: the indexed main-repo
graph could not resolve the branch's `executeCoordinationRunKernel` symbol and
returned truncated CRITICAL/broad impact data for the action use case. Source
and production tests were used as current authority; no claim is made that the
stale graph is a precise branch-current impact report.

The existing dispatch/e2e harness is intentionally slow; the final full suite
took approximately 11.4 minutes. No new risk, store, lock, sidecar, or
configuration surface was introduced by this repair.

No stage/commit was performed. The reviewer report remains unchanged.
