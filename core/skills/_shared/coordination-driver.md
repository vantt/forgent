# Shared Fragment: Coordination Driver Discipline

This shared doctrine defines the domain-neutral operational loop for coordinating multi-agent sessions across the fgOS runtime. It establishes the driver discipline for observing session state, choosing the next activity, verifying evidence, and performing explicit session termination without embedding domain-specific mechanics.

Every coordination facade loads this fragment and supplies concrete values for the hook slots defined below.

---

## 1. The Generic Driver Cycle

A driver executes a deterministic, evidence-grounded control loop over one or more iterations:

```text
observe(status)
  -> choose (activity + route)
  -> dispatch (naming the case)
  -> verify evidence
  -> disposition
  -> adapt (revise / recheck / retry / ask human)
  -> explicit close or continue
  -> continuity artifact
```

### Step 1: Observe (`status`)

Derive state only from the runtime's inspection doors:
- A Workflow case: `fgos workflow status <caseId>`. It is a projection of the case ledger: milestones with the digest of their subject (`achieved`, `stale`, `blocked`, `unreached`), eligible activities, listed routes plus the unlisted path, frame left, open gates, live reservations, bindings, and whether the case can close. For a conductor case, `running` means a reservation is live; there is no process to wait for.
- A single `fgos run` Unit: read its record under `.fgos/assignments/<unitRunId>/`.
- Rebuild context from that record and the facade's continuity artifact. Never from chat narration, private memory or an old assumption. A fresh driver must resume cold from the status and the continuity artifact alone.

### Step 2: Choose (the agent judges, the harness enforces)

Which activity next, by which route, is the driver's judgment. The guide gives direction: its routes are `should` (the default, deviate with a reason), `may-instead` (an allowed alternative) and `unlisted` (anything else, allowed with a recorded reason unless the guide closes the decision point to listed routes). Mechanical rules (entry milestones, consent bound to the approved artifact, disjoint writes, the approved frame, the seat-launch ceiling) belong to the harness: it admits or refuses by name when the Unit is dispatched.
- A refusal is an answer, not a question for the owner. Read its code and condition, re-observe, and change the proposal (another activity, a narrower write scope, wait for the live reservation) or stop. Do not retry the same proposal.
- Never ask a person to choose a route the guide already permits.

### Step 3: Dispatch (always name the case)

Dispatch through one of the two doors, and when the work belongs to a case, name it, read-only Units included:
- `fgos run "<prompt>" --case <caseId> --activity <activityId> [--route should|may-instead|unlisted] [--reason <text>] [--writes <paths> --worktree <path>]` - one Unit. `--activity` is required with `--case`. A read-only run that names no case is standalone and uncounted; a run that writes needs a worktree no case owns, or the case's authority.
- `fgos workflow start <workflow>|--units <file>` - planned work, one step per Unit (a Playbook case); `fgos workflow resume` and `fgos workflow answer` continue it. A child run nested under your conductor case: `fgos workflow start ... --case <parentCaseId>` (its frame is charged to the parent first).
- Parallel work needs no declaration. Dispatch Units with disjoint write scopes; overlapping reservations are refused and a busy case is retryable.

Run `fgos dispatch decide` before any dispatch out of the current turn.

Case boundaries (what the harness cannot do for you):
- A Playbook case (of a workflow such as `council-lite`) is advanced only by its own proposer. Never admit into it with `--case`, and a worker running inside a Playbook Unit never calls a door naming that case. Both are refused.
- A worker confined to a sandbox never dispatches a writer. If it needs one, it asks the conductor, who dispatches it.
- Edits you make in your own session (Edit, Write, a subagent) are outside the ledger; the case does not see them. The approve door still guards landing.
- Close a conductor case with `fgos workflow close <caseId>` when its closure milestones hold and no consent gate is parked. A Playbook case closes itself when it completes with a pass; a failed, blocked or parked case stays open.

Ask a person only when the case cannot go on without them: a consent gate the guide marks human, an ambiguity about the request itself, a frame that must be widened, or repeated refusals across distinct approaches. Put the questions together and use the decision-question template (`decision-question.md`); work that does not depend on the answer keeps going.

### Step 4: Verify Evidence

Before accepting any worker contribution or finding, independently inspect the declared output artifact(s):
- The driver must directly verify the existence, format, and substantive correctness of the produced artifact.
- Never rely on worker self-narration, conversational claims, or ungrounded status summaries.
- **Caveat Rule:** A result carrying a caveat (such as non-attributable execution or a recheck-required flag) must **never** be treated as valid acceptance or sign-off evidence. Caveats block session completion and require an uncaveated re-execution.

### Step 5: Disposition

When an inspection or advisory operation reports findings, the driver must record an explicit disposition for each finding:
- `accepted`: The finding is valid and requires corrective action or revision.
- `rejected`: The finding is demonstrated to be invalid or inapplicable, backed by recorded rationale.
- `deferred`: The finding is valid but explicitly deferred out of current scope, permitted only when allowed by facade disposition criteria.

Dispositions are recorded in the continuity artifact (Step 8).

### Step 6: Adapt (Revise, Recheck, Retry, Ask Human)

Based on dispositions and evidence outcomes:
- **Revise:** Authorize and dispatch revision operations within the declared adaptation bounds.
- **Recheck:** Every accepted finding requires an independent recheck operation to confirm remediation. A finding is never discharged by driver disposition alone.
- **Retry / Reopen:** When transient failures occur or bounded dialogue reopening is permitted, dispatch retry or follow-up turns within protocol limits.
- **Ask Human:** Only for the triggers listed in Step 3. A harness refusal is not one of them. Ask in the decision-question template (`decision-question.md`; batching per AGENTS.md priority #2) and never stall work that does not depend on the answer.

### Step 7: Explicit Close or Continue

- **Continue:** If further declared operations or authorized rechecks remain, cycle back to Step 1 (Observe).
- **Explicit Close:** When all declared steps have settled, all findings are dispositioned, all required rechecks confirm resolution, and close prerequisites are satisfied, record the closeout summary and rationale in the continuity artifact and report the result.
- **Explicit Close Law:** Closing is a deliberate driver decision. A session never terminates automatically merely because operations finished. Quorum and prerequisite checks fail closed.

### Step 8: Continuity Artifact

Record the iteration summary, session identifier, verified evidence identifiers, dispositions, and deferred items into the facade's designated continuity artifact before completing the turn.

---

## 2. Facade Hook Slots

Every consuming facade must explicitly define the following hook values:

| Hook Slot | Definition | Responsibility |
|---|---|---|
| `unit of iteration` | The discrete quantum of work executed in one cycle. | Facade defines what opens, runs, and completes as one coordinated unit. |
| `open inputs` | The source specifications and parameters used to initialize the session: (a) the iteration's declared result kind, work-product or advisory; (b) exactly one primary canonical capability; (c) any binding inputs the control layer requires, when the facade has them. | Facade supplies (a)–(c). The discipline reads (a) to select evidence and close rules, treats (b) and (c) as pass-through data, never derives or chooses them itself, and never names an executor, model, tier, or persona. |
| `evidence verification` | The domain-specific verification rules applied to outputs. | Domain policy defines how artifacts and execution evidence are confirmed before acceptance. |
| `disposition criteria` | Rules governing finding acceptance, rejection, and deferral. | Facade specifies which findings can be deferred versus which strictly require remediation. |
| `adaptation bounds` | Finite limits on revision rounds, rechecks, and retries. | Facade caps maximum remediation attempts before escalation or abort. |
| `human-escalation triggers` | Specific conditions requiring human intervention. | Facade defines thresholds for pausing autonomy and batching operator questions. |
| `close criteria` | Conditions that must be certified before issuing explicit close. | Facade specifies required proof levels, quorum confirmation, and sign-offs. |
| `after-close action` | Downstream actions executed following verified session completion. | Domain policy defines post-close integration, asset delivery, or cleanup. |
| `continuity artifact` | The durable file or document tracking progress across iterations. | Facade names the persistent record used for cold resumption. |

---

## 3. Core Operating Invariants

1. **Replay and Status Authority:** Session status is derived strictly from the append-only event log and definition snapshot. The driver never maintains private, uncommitted state.
2. **Deterministic Preconditions:** The harness refuses an inadmissible proposal with a named code; the driver re-observes instead of retrying blind.
3. **Driver Identity Continuity:** The driver identity established at session creation stays the same on all follow-up actions.
4. **Independent Proof:** Dispatched workers perform task execution. The driver independently verifies evidence before certifying any result.
5. **Explicit Close:** Sessions remain active until the driver explicitly closes them after quorum and prerequisite checks pass.
