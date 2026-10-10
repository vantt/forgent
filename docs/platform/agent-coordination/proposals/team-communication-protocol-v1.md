# Team Communication Protocol V1

```txt
Document type: Proposal
Audience: Maintainer, implementation agent and independent reviewer
Purpose: Preserve current contracts and explicitly distinguish unimplemented design from retired engine history
Design status: Candidate
Implementation: Section-specific; proposal schemas and dated findings are not blanket implementation claims
Provenance: Restored from 7880fbc74b07c3667ebaa61f2b0561b5d80471b5 after independent liveness review
Writer type: Human + agent coauthor
Canonical for: The current subject and design boundaries stated in this file; not retired engine authority
Use this when: Reading the surviving contract, its implementation limits or current proposals
Do not use this for: Reinstating the retired coordination engine or treating proposal details as shipped behavior
Last reviewed: Pending independent liveness re-review
Related:
- docs/platform/agent-coordination/README.md
- docs/specs/runner.md
Supersedes: Incorrect whole-file retirement or over-removal only
Superseded by: None for the surviving current subject
Added in candidate: Liveness evidence and explicit implementation/proposal distinction
```

Complete pre-rework input: [historical snapshot](../history/retired-engine/files/proposals/team-communication-protocol-v1.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.

## 1. Purpose

Team Dispatch V1 needs a communication protocol, but it must stay smaller than
a mailbox, daemon, or second lifecycle system.

This proposal retains communication doctrine for Work-attached coding activity.
The early standalone prototype was retired; current standalone execution uses
Unit/CollaborationPattern or Workflow. A predeclared Workflow is not required
for every bounded Unit request, but validated contracts and governance remain.

The protocol defines how roles communicate while `Work` remains the lifecycle
authority:

```txt
Work position
  -> recorded workflowStep
    -> legal step operations
      -> selected Assignment
        -> one Run
          -> one RunResult
            -> driver chooses the next legal operation or engine verb
```

The protocol is not a meeting scheduler. It is the set of rules that make one
role's message usable by another role without trusting terminal text or agent
say-so as proof.

## 2. Non-Negotiable Boundaries

```txt
Work is lifecycle authority.
Mission is reserved/deferred vocabulary, not a current team-envelope runtime.
workflowStep records Work's position.
Step operations are declared semantic actions, not a second Stage Protocol engine.
Assignment is a semantic request.
Run is a runtime attempt.
RunResult is normalized result plus evidence.
Herdr is visibility only.
```

Do not introduce `Job` in V1. `Job` remains reserved for a future queue,
scheduler, lease, cancellation, or worker-pool design.

Do not let an Assignment mutate Work lifecycle state by itself. Work moves only
through existing engine verbs such as `fgos discover`, `fgos plan`, `fgos
return`, `fgos ask`, `fgos answer`, and approval/merge verbs.

## 3. Roles

The coding domain starts with the roles already declared in the role graph:

| Role | Responsibility | Typical operation family |
|---|---|---|
| `implementer` | Owns the current Work item, edits repo state, invokes engine verbs, and coordinates legal sub-calls. | `judge-ambiguity`, `shape-plan`, `implement-item`, `fix-verify-red` |
| `researcher` | Gathers evidence and facts. It may read repo context, run approved research tools, or inspect docs. | `resolve-question`, `scout-blast-radius` |
| `reviewer` | Finds correctness, feasibility, regression, and test risks. | `validate-plan`, `review-item` |
| `helper` | Performs an independent scoped piece whose footprint does not collide with the driver's active edit surface. | `scoped-subtask` |
| `advisor` | Answers product, scope, priority, or human-intent questions that cannot be settled from machine evidence. | `answer-question`, selected `advise` interactions |

Role is not executor. A reviewer can run on Codex, Claude, agy, pi, or a future
executor if policy and governance allow it.

Role is not Workflow step owner. A step owner may dispatch an Assignment to
another role while Work remains at the same `workflowStep`.

## 4. Communication Modes

The role graph's `mode` field has protocol meaning:

| Mode | Meaning | Lifecycle effect | Required evidence |
|---|---|---|---|
| `sync` | Bounded contribution; caller continues at the same Workflow step. | `work.call-summary` records the call; holder is untouched. | The role-call record alone is not RunResult proof; executed Assignments require their normal evidence. |
| `async` | Role handoff governed by the current role graph. | `work.handoff` records holder change and checkpoint; it does not itself invent a status transition. | Actual handoff/answer context plus any independently required execution evidence. |

`src/state/store.mjs:1497-1562` chooses the event from the matched edge's mode,
not a caller override. Sync call summaries do not consume the async callstack.

`async` does not mean a new Work item. It becomes Work only when the request
needs independent lifecycle, approval, merge, or backlog visibility.

## 5. Workflow Step Operation Selection

`src/workflow/steps.mjs:70-85` provides
`operationsForStep(wf, stepId, { defaultRole })`; the domain wrapper
`src/state/domain-registry.mjs:254-257` also accepts
`operationsForStep(domain, step, kind)`. Both are current APIs; do not call the
domain wrapper historical merely because the Workflow helper has another signature.

Selection rules:

1. Prefer the primary operation when the current step's owner work is still
   the next required action.
2. Choose a secondary operation when a bounded role contribution would unblock
   the step without creating lifecycle-bearing child work.
3. Create child Work only when the contribution needs its own claim, branch,
   verify, approval, merge, or backlog visibility.
4. Route discovery unresolved ambiguity to `exploring`; discovery must not ask
   the human directly.
5. Refuse operations marked `dispatch: human-only` from cli-spawn assignment
   execution.
6. Refuse synthetic compatibility operations from runtime dispatch unless their
   task-spec file resolves and the caller explicitly accepts compatibility
   dispatch.

Examples:

| Stage | Situation | Operation |
|---|---|---|
| `discovery` | Need machine evidence for ambiguity. | `resolve-question` to `researcher`, then owner decides `clear` or `unclear`. |
| `planning` | Plan is written and needs proof before the edge to executing. | `validate-plan` to `reviewer`. |
| `planning` | A symbol's blast radius is unknown. | `scout-blast-radius` to `researcher`. |
| `executing` | Implementation needs a separate non-overlapping edit. | `scoped-subtask` to `helper`. |
| `executing` | Returned diff needs independent review. | `review-item` to `reviewer`. |
| `executing` | Review or verify reports a concrete red issue. | `fix-verify-red` to `implementer`. |

## 6. Assignment Message Contract

Every assignment prompt must provide the worker with enough information to
produce a usable result without learning fgOS internals.

Required prompt fields:

```txt
Assignment: <assignmentId>
Work: <workId or (none)>
Stage operation: <stage>.<operation>
Role: <role>
Task-spec: <task-spec path>
Objective: <bounded request>
Context refs:
- <ref>
Expected outputs:
- <output>
Result artifact:
- Write structured JSON to the effective claim path supplied in the prompt.
- Read-only: also write the required companion agent-report.md beside the claim.
- Mutating: a human-readable report is optional; required external evidence remains.
```

The prompt must say that the worker should not call Work lifecycle verbs unless
the task-spec explicitly says the worker is the lifecycle driver. Ordinary
Assignment workers return artifacts; the driver interprets them.

The prompt must pass refs, not embedded large docs, diffs, transcripts, or
secrets.

## 7. Agent Result Schema

`agent-result.json` is the worker's structured claim. It is not proof by
itself.

Minimal v2 reviewer claim (reviewer/red-team and recheck contexts require
`assessment.verdict`; agent-result-claim-contract.mjs:5-30,81-85):

```json
{
  "contract": { "id": "agent-result-claim", "version": 2 },
  "status": "done",
  "summary": "One concise result sentence.",
  "findings": [],
  "evidenceRefs": [],
  "assessment": { "verdict": "pass" }
}
```

Allowed status values:

| Status | Meaning |
|---|---|
| `done` | The worker believes the assignment objective is complete. |
| `blocked` | The worker could not complete because a named blocker remains. |
| `failed` | The worker attempted the assignment and produced an error or invalid output. |
| `no-evidence` | The worker can report context but cannot support a completion claim. |

Required fields by status:

| Status | Required fields |
|---|---|
| `done` | `summary`; read-only acceptance requires a companion worker report artifact, not just `evidenceRefs`; mutating acceptance requires appropriate external delta evidence. See run-result.mjs:1276-1285 and assignment.mjs:881-898. |
| `blocked` | `summary`; `blocker`; `evidenceRefs` when any evidence exists. |
| `failed` | `summary`; `error`. |
| `no-evidence` | Non-empty `summary`; there is no additional reason field in the validator (`agent-result-claim-contract.mjs:9-15,67-85`). |

`nextRecommendedOperation` is a proposed optional extension, not a current
validated schema field or a field the Work-layer caller presently consumes.

## 8. RunResult Confidence

RunResult status and confidence are control-plane judgments.

Confidence ladder:

| Confidence | Meaning | Allowed use |
|---|---|---|
| `verified` | Structured claim plus post-run external evidence such as a new commit, new changed file, test artifact, or verified result file. | May feed lifecycle decisions that require proof. |
| `reported` | A blocked claim, even without a companion report; or a read-only done claim with a worker report; or a failed findings verdict with a report and exit 0 (`run-result.mjs:1261-1278`). | May feed driver judgment, but should not close mutating work; status remains separate from confidence. |
| `inferred` | Post-run external evidence exists but no structured claim exists. | May be surfaced for inspection; driver should avoid automatic lifecycle movement. |
| `no-evidence` | Process settled without proof. | Must not advance Work. |
| `failed` | Timeout, nonzero exit, signal, invalid claim, read-only mutation, or a failed claim not qualifying for the reported findings branch (`run-result.mjs:1250-1271`). | Must not advance Work; an explicit failure is not always failed confidence. |

The driver must treat `done/no-evidence` as not done. It may retry, ask for a
proper artifact, or route to a different legal operation.

## 9. Handoff Versus Assignment

Use `handoff` when the interaction is a short role-axis record around work the
current session already performed or directly observed.

Use Assignment when:

- another executor, provider, role, or tool performs the action;
- the result will be read by a later driver turn;
- the result needs Run/RunResult evidence;
- the interaction may fail independently;
- a read-only consult/review needs an artifact rather than a one-line summary.

`handoff` remains useful for visibility and role-holder truth. It is not enough
evidence for a Team Dispatch operation once the result influences a lifecycle
decision.

## 10. Coding-Domain Workflow Step Operations

### 10.1 Discovery

Discovery is machine-alone.

Allowed behavior:

- owner reads existing Work context;
- owner consults researcher helpers for evidence;
- owner logs consult interactions;
- owner chooses `clear` or `unclear`;
- `clear` can route to planning;
- `unclear` routes to exploring.

Forbidden behavior:

- asking the human directly;
- parking as `awaiting-human`;
- treating a helper's unsupported answer as proof;
- opening a new Work item just to answer a bounded evidence question.

### 10.2 Exploring

Exploring is the human-adjacent decision-locking stage.

Allowed behavior:

- advisor interaction for material, grounded, answerable product questions;
- researcher consult for repo or external facts;
- lock decisions into CONTEXT.md.

Exploring may ask a human. It should ask only after machine evidence has been
gathered and the question is self-contained.

### 10.3 Planning

Planning has two main operation families:

- `shape-plan` by implementer;
- `validate-plan` by reviewer.

The current coding Workflow already declares `shape-plan` and reviewer
`validate-plan`; adopting a future Step 05 is not a prerequisite for that
operation (`domains/coding/workflows/feature.yaml:64-100`).

`validate-plan` is a real reviewer-role operation when dispatched through
Assignment. Prose that says validating is only an implementer function must be
reconciled before driver adoption.

### 10.4 Executing

Executing has the richest team protocol:

- implementer owns the main edit path;
- researcher may answer blast-radius or API/pattern questions;
- helper may take independent scoped work;
- reviewer may review returned diffs or candidate fixes;
- advisor handles product/scope questions that exceed locked decisions.

The implementer remains responsible for Work lifecycle. Helper/reviewer
assignments return artifacts and recommendations unless explicitly promoted to
child Work.

## 11. Coordination Operating Harness

Multi-agent implementation benefits from a durable operating harness:

```txt
trace/index.md
trace/current-cell.md
trace/<cell>.md
prompt templates
review and red-team gates
live proof capture
```

This harness is documented in
[coordination-operating-harness.md](../playbooks/coordination-operating-harness.md). It is
supporting engineering practice, not Step 07 runtime infrastructure and not a
lifecycle system. Its job is to keep coordinator, doer, reviewer, and red-team
sessions aligned while preserving token budget and proof traceability.

The harness should be used where it reduces implementation drift, but dogfooding
it is not a runtime dependency gate for current Unit/Workflow execution.

## 12. Standalone Read-Only Coordination

The former session-engine runtime path is historical. Current standalone execution uses Unit/CollaborationPattern, not that protocol profile. The manual operating harness in section 11 remains current by owner decision.

## 13. Acceptance Criteria For V1 Protocol

The protocol is ready for driver adoption when:

- every runtime assignment receives an explicit result artifact path;
- malformed or missing structured claims cannot produce `verified` or
  `reported`;
- dirty-before files cannot be counted as post-run evidence;
- read-only operations can return `reported` only through worker artifacts;
- mutating operations require post-run external evidence;
- stage skills agree on when Assignment is used versus direct invocation;
- `validate-plan` role prose is consistent across skill and task-spec docs;
- discovery remains machine-alone.
