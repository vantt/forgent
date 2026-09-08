# Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation

Document type: Proposal
Design status: Discussion
Implementation: Not started for the proposed architecture; existing substrate is partially implemented
Last reviewed: 2026-09-06
Canonical for: nothing until explicitly accepted and promoted
State class: State — current conceptual recommendation; independent review remains historical evidence

## Reading context and authority

Current investigation status and next steps:
[Chat progress and handoff](coordination-envelope-progress.md).

Read [Reading Map](../../specs/reading-map.md), [Runner spec](../../specs/runner.md),
[Agent Coordination Vision](../agent-coordination/vision.md),
[Intent Preservation Ledger](../agent-coordination/intent-preservation-ledger.md), and
[System Vision: Trong Mem Ngoai Cung](../system-vision-trong-mem-ngoai-cung.md) first.

Inputs:

- [Independent review, 2026-09-05](../../../plans/reports/review-260905-agent-coordination-trong-mem-ngoai-cung.md).
- Repository source/contracts inspected on 2026-09-06.
- [Foundation baseline](../agent-coordination/architecture/coordination-foundation-baseline.md),
  [FlowDefinition contract](../agent-coordination/contracts/flow-definition.md),
  [CoordinationSession contract](../agent-coordination/contracts/coordination-session.md).
- [Raw master-coordination prompt](../agent-coordination/playbooks/prompts/master-coordinator.md),
  [Architecture Advisory proposal](architecture-advisory-panel.md), and
  [Plan Loop proposal](group-thinking-plan-loop.md).

This is an architecture recommendation, not an accepted decision, implementation
plan, or permission to change existing contracts. The structured debate below is
one advisor's adversarial analysis, not a newly dispatched independent agent
panel. Source and test source were inspected; no new tests or live provider runs
were performed for this analysis. GitNexus tools were unavailable in the review
session, so source navigation was direct.

**Recommendation:** choose capability-envelope + coordinator-owned deliberation
as the target; retain FlowDefinition as an optional coordination method over the
same execution substrate. Preserve the operating intelligence of a good master
prompt while enforcing consequential actions at a real authority boundary.

## 1. Working Understanding

The question is not graph versus prompt. It is who may decide what, on which
evidence, and where that authority is enforced.

A capable coordinator must understand and reframe a problem, choose specialists
and methods, progress independent work while a question is parked, request
unexpected investigation or recheck, and finish honestly with a recommendation,
dissent, or insufficient evidence. Runtime must bound and record those actions
without deciding the sequence of good thinking.

The accepted Vision already makes a predeclared protocol optional. The target
must support real multi-agent dispatch, per-role executor/provider/model/tier/
persona selection, independent-first work, controlled reveal, bounded specialist
recruitment, dissent, recheck, and cold resume. It must serve Code Panel, Plan
Loop, RFC review, research, Delphi/NGT, and Architecture Advisory through shared
primitives rather than a separate engine per use case.

One correction to the historical review: F4 is no longer accurate at its exact
forwarding point. `src/verbs/coordination/run.mjs` now forwards `step.mutation` to
`dispatchDeclaredOperation`. This does not establish end-to-end mutation
correctness; no new execution proof was run. Keep the historical review intact.

## 2. Root causes from the review

| Root cause | Findings | Architectural implication |
|---|---|---|
| Method description doubles as legality | F3, F5, F8, F10 | Actors, bindings, windows, and contribution types limit thinking |
| Contract authority differs from process authority | F1, F6 | API refusal cannot contain a worker with direct access to the same resources |
| Operating intelligence lacks a complete delivery path | F2 | Persona provenance does not prove worker receipt of doctrine |
| Execution, evidence, agreement, and completion are conflated | F3, F7 | Finished reports become agreement; sufficient actors become a reason to stop |
| Durable execution lacks durable decision context | F11, F12 | Resume lacks rationale, obligations, and content-pinned baselines |
| Public actions expose less than underlying capability | F5, F9 | Coordinators need workarounds or private adapters |

Direct source anchors:

- [Assignment runner](../../../src/runner/dispatch/assignment-runner.mjs) explicitly
  documents same-user trust and post-execution read-only grading/rollback.
- [Prompt renderer](../../../src/runner/dispatch/assignment.mjs) renders the basic
  objective/context/output packet; this is not a complete soul delivery contract.
- [Session engine](../../../src/runner/coordination/session-engine.mjs),
  `classifySessionQuorum`, takes the manifest actor roster as required;
  aggregation-based close requires `consensus`.
- [Public run](../../../src/verbs/coordination/run.mjs) automatically attempts close.
- [Store](../../../src/runner/coordination/store.mjs), `assertDriverIdentity`, compares
  writer identity strings; session `maxRounds` uses Assignment count.
- [Chain](../../../src/verbs/coordination/chain.mjs) selects the latest active session
  and derives a hint; it does not reconstruct plan rationale.

A new Architecture Advisory graph alone would add another method to the same
misplaced boundaries. The review calls for responsibility redesign, not wholesale
replacement of proven execution machinery.

## 3. Proposed hard/soft boundary

| Layer | Responsibility |
|---|---|
| Hard invariants | Authenticated principals; attenuating grants; isolation; visibility; bounds; provenance; evidence integrity; mutation exclusivity; lifecycle authority |
| Soft coordination judgment | Understand/reframe, select methods/specialists, assess findings, choose the next step, judge sufficiency and propose closure |
| Reusable cognitive doctrine | Independent-first, challenge assumptions, preserve dissent, investigate-before-ask, distinguish fact/inference, recheck after changes |
| Use-case playbook | Role postures, heuristics, outputs, and defaults for Code Panel, Plan Loop, RFC, research, Delphi/NGT, Advisory |
| Derived evidence/replay view | Who acted, who saw what, outstanding obligations, reviewed candidate, decision-to-evidence links |

Doctrine may instantiate a hard commitment without becoming kernel logic in its
entirety. “Usually seek two independent views” is doctrine. “This candidate needs
two separate assessments before acceptance” is an obligation when the authority
owner adopts it. “Do not reveal either draft before first-pass submissions” is a
visibility constraint. Whether to debate afterward or recruit a specialist is
judgment.

A coordinator may change method but cannot waive an obligation locked by higher
authority. Runtime must distinguish:

1. Has execution ended?
2. Does evidence satisfy source/revision/verification requirements?
3. Do participants agree?
4. Should deliberation end, or should a deliverable be accepted?

No universal quorum answers all four.

## 4. Three architecture families

| Family | Coordination structure | Adaptation | Strength | Main limitation |
|---|---|---|---|---|
| A — Incremental FlowDefinition | Graph/binding remains primary | Branches, repeatable invocation identities, bounded extension regions | Lowest migration distance; declared methods remain inspectable | Unexpected cases may require graph edits |
| B — Capability envelope + coordinator-owned deliberation | Envelope owns legality; coordinator owns method | New bounded assignments, grants, and obligation instances from evidence | Broad reuse without a graph per use case | Requires sound isolation and durable memory |
| C — Programmable master prompt + minimal broker | Prompt/skill and session documents own most structure | Master calls a small set of protected tools | Closest to raw master prompt; low authoring cost | Recovery and obligation logic can be duplicated in playbooks |

### A. Improve FlowDefinition incrementally

Retain FlowDefinition and CoordinationSession. Address individual invocations,
not the first matching binding. Derive completion from applicable obligations,
not every declared actor. Require explicit close. Separate read grants from graph
position and assignment counts from cognitive rounds. Expose retry, replacement,
cancel, and specialist actions publicly. Complete role-packet delivery and
executor/provider/model/tier/persona binding, including fan-out.

A generic deliberate/observe/choose graph can provide bounded extension regions.
If most useful work moves into those regions, however, the graph is no longer
the actual coordination structure: A is converging toward B.

### B. Capability envelope with coordinator-owned deliberation

The coordinator is an agent with soul, memory, and delegated process authority.
It proposes consequential actions; runtime validates and executes them. A new
investigation does not require a predeclared cognitive operation. Its execution
contract identifies principal, resources, outputs, context, budget, capabilities,
and obligations.

FlowDefinition remains useful for a deliberately selected stable method. It may
supply sequencing/defaults or additional commitments, but is not the mandatory
language of deliberation. Method changes never expand the envelope implicitly.

### C. Programmable master prompt with a minimal tool broker

A versioned master prompt uses protected tools to dispatch bounded workers,
read/publish granted artifacts, checkpoint, park/resume, and propose closure or
mutation. The broker protects execution, authority, and evidence. Review logic,
tracking, and synthesis mostly remain in skill/documents.

Unlike B, C has less shared coordination state with operational meaning. This
keeps it small but pushes obligation tracking, invalidation, and cold resume into
each playbook. Adding all those shared mechanisms to the broker converges on B.

All three require real containment for the malicious-worker requirement. Fewer
schemas do not remove the trust-boundary cost.

## 5. Comparative walkthrough and trade-offs

| Scenario | A — Improved Flow | B — Envelope | C — Master + broker |
|---|---|---|---|
| Code Panel | Doer then review/red-team; conditional fixer/recheck; candidate obligations gate close | Seal candidate; dispatch two independent reviews; recruit specialist or fix from findings | Master follows the same method through tools; playbook owns candidate/review tracking |
| Multi-phase Plan Loop | Graph governs cell method; track documents retain dependencies/proof; new scope may need flow revision | Memory holds requirements/dependencies; coordinator chooses cells and selectively invalidates affected proof | Closest to raw master; depends on index/current-cell quality and checkpoint discipline |
| Initially unclear Advisory | Requires investigation/reframe loops and usable specialist extension | Investigate competing hypotheses, change framing, then select RFC/NGT/review when useful | Natural prompt behavior; fresh masters may lack sufficient recorded rationale |
| Crash/resume | Restore invocation, graph version, grants, obligations; reasoning memory still needed | Replay effects, load checkpoint at event cursor, reconcile unknown outcomes, then choose next step | Restore receipts/documents; larger risk of missing or mismatched checkpoints |
| Malicious/overreaching worker | Graph cannot protect filesystem; broker/isolation still required | Attenuated worker grant; no coordinator credential, ledger write, or sibling access | Same protection required as B; no inherited bypass tools |

B examples at the judgment boundary:

- Code Panel discovers an unexpected compatibility concern. The coordinator
  recruits a read-only specialist with only relevant context. After a fix, old
  reviews remain historical but cannot certify the new candidate.
- A later Plan Loop phase disproves an earlier assumption. The coordinator records
  why prior proof no longer satisfies a requirement and reopens only affected
  work, without resetting the track.
- Advisory evidence points to CI rather than orchestration. The coordinator
  abandons the new-orchestrator hypothesis, records why, and investigates the
  actual bottleneck.

| Additional use case | Specific doctrine | Shared substrate |
|---|---|---|
| RFC review | Proposal, objections, responses, amendments | Bounded assignments, reveal, revision lineage |
| Research | Question decomposition, source comparison, contradiction resolution | Context grants, evidence refs, specialist, budget |
| Delphi | Private first pass, controlled feedback, reassessment | Sealed submissions, filtered publication, invocation lineage |
| NGT | Independent idea generation, clarification, ranking | Artifacts, controlled reveal, optional validator/scorer |
| Advisory | Investigation, reframing, alternatives, decision dialogue | Same primitives plus separate human authority |

Delphi anonymity needs its own assurance definition: removing identity metadata
does not prove that prose/content cannot identify an author.

| Criterion | A | B | C |
|---|---|---|---|
| Initial migration cost | Lowest | Medium–high | Low UX cost; containment remains substantial |
| Unanticipated method | Limited by extension surface | Natural inside envelope | Natural in prompt |
| Authority/effect audit | Good with real containment | Good with real containment | Good if broker has no bypass |
| Rationale resume | Must be added | Central design element | Playbook-dependent |
| Cross-domain reuse | Risk of multiplying graphs | High | Risk of duplicated skill logic |
| Rigidity recurrence | Growing graph | Cognitive semantics absorbed into envelope/actions | Templates become mandatory ceremony |

## 6. Structured debate

| Objection | Response | Unresolved concern |
|---|---|---|
| A to B: soft sequence lets the coordinator forget review | Hard obligations preserve required review; soft sequence allows different ways to fulfill it | Obligation creation/waiver authority must be explicit |
| B to A: every unknown needs a graph author | A can offer bounded extension regions | Predeclaring every specialty/operation preserves the original problem |
| C to B: envelope is a workflow engine under another name | Actions describe effects, not reframe/debate/Delphi enums | Use cases may steadily demand cognitive fields in kernel schemas |
| B to C: Markdown resume loses obligations | C can retain checkpoints and trustworthy receipts | Prose-only obligations cannot reliably prevent omission |
| A/C to B: added complexity has not proved faster shipping | Measure consuming-project authoring effort, human intervention, and output quality | No equal-budget live comparison yet |
| All: containment reduces provider portability | Adapters declare proven capabilities and refuse incompatible grants | Some providers/hosts cannot satisfy the requested envelope |
| All: the coordinator can still judge incorrectly | Runtime protects sources and rights; doctrine/review improve judgment | No architecture proves arbitrary semantic conclusions correct |

B's most important rigidity failure mode is a general policy language that
absorbs the whole cognitive method. If adding a counterfactual critic requires a
kernel schema change, the boundary has drifted.

## 7. Recommendation and reversal conditions

Choose B as the target, use A's corrections to preserve current capability, and
use C's prompt/skill experience as the coordinator-facing operating surface.
These are not three execution engines.

Compared with the current harness, B permits unanticipated bounded work without
graph authoring. Compared with a raw prompt, it subjects that work to authority,
budget, isolation, evidence, and durable execution controls. This is a conceptual
responsibility advantage; quality and operating-cost advantage remain empirical.

Reverse or narrow the recommendation if:

- Real use cases fit a few reusable flows naturally without kernel edits or
  recurring escape hatches: A may be sufficient as the target.
- A minimal broker plus artifacts matches B on resume, omission, and integration
  effort across unlike use cases: C may be sufficient.
- An adapter cannot enforce isolation: narrow supported deployment, not the
  meaning of secure containment.
- Multiple agents do not improve quality enough for their cost: reduce default
  fan-out rather than treating team size as a product achievement.

The proposed threat model changes the accepted
[Routing Handoff Contract](../../routing-handoff-contract.md). Acceptance requires
explicit reconciliation/supersession of affected decisions and contracts, not
silently relabeling existing same-user execution. No locked law is changed here.

## 8. Conceptual model

### Coordinator soul

Soul carries mission, doctrine, judgment heuristics, uncertainty handling,
specialist selection, and recovery practice. Each worker receives a resolved role
packet: objective, posture, must-read context, constraints, actual rights,
expected evidence, and output destination. Persist the packet content/hash and
provenance. This proves delivery, not comprehension or compliance.

Role names are open labels; rights never derive from a role name. Runtime prose
must be packaged under its runtime owner, not loaded from documentation playbooks.

### Capability envelope

The envelope bounds resource/data scope, permitted executor/provider/model,
tier/cost, Assignment count, concurrency, delegation depth, mutation/integration,
disclosure, non-waivable obligations, active execution budget, deadline, and
grant expiry. These clocks and counters are distinct.

The coordinator chooses inside the envelope and cannot rewrite its root grant.
Accounting is aggregate across child work, retries, and related sessions when
funded by the same budget authority; splitting work must not reset limits.

### Authority grants

A grant has an authenticated issuer, recipient, resource, actions, limits, and
expiry. Subgrants only attenuate authority. The coordinator cannot bypass the
broker through ambient control-store/config access. Workers receive no coordinator
credential. Human decisions enter through a separately authenticated source;
worker prose saying “human approved” creates no rights.

Isolation must actually enforce the boundary. Worktrees and identity-string
checks are insufficient. Tests executing worker-produced code also run within an
appropriate boundary. Runtime, privileged configuration, and operator remain
trusted; this is not protection against a compromised host administrator.

### Context/evidence grants

Separate permission to read, permission to publish, and eligibility to cite an
artifact as evidence for an assertion. Independent-first uses separate packets/
snapshots and sealed submissions. Reveal is a recorded grant effect.

Knowledge already revealed cannot be revoked from model context. Later work
retains exposure history; a new independent assessment requires a fresh execution
with an appropriately restricted packet.

### Bounded action vocabulary

| Effect category | Conceptual actions |
|---|---|
| Execution | Dispatch, retry, cancel, replace |
| Access | Grant/revoke, reveal |
| Durable record | Submit artifact, checkpoint, assessment, evidence reference |
| Commitment | Record/resolve obligation within delegated authority |
| Lifecycle | Park, resume, propose close |
| Integration | Propose an effect to its authorized resource owner |

Investigate, challenge, synthesize, and reframe remain task prose/doctrine, not
kernel operation enums. All execution still lowers through Assignment → Dispatch
→ Run → RunResult. Resolved executor/provider/model/tier/persona binding applies
per Assignment, including fan-out. Provenance distinguishes requested/configured
routing from observed backend identity when actual model attestation is absent.

### Durable deliberation memory

Keep two layers consistent with platform Log/State laws:

- Immutable log: actions, grants, results, artifact versions, checkpoint history.
- Current state: understanding, assumptions, open questions, alternatives,
  commitments, requirement-to-proof mapping, and rationale for the next step.

The current view references its sources; it does not rewrite history. A checkpoint
stores decision rationale sufficient for handoff, not every internal thought.
Only changes to authority, effects, commitments, or evidence truth require typed
records. Conversation can be prose, artifacts, or mediated messages as appropriate.

### Replay/resume

Replay execution/grants/obligations, load a checkpoint with its event cursor and
content-pinned versions, reconcile uncertain runs/effects, then let the new
coordinator choose a next step. Replay reconstructs history; it does not promise
identical future model judgment.

A coordinator lease/epoch prevents two resumed processes from simultaneously
controlling the session. Idempotency prevents duplicate consumption/application;
external exactly-once effects are not promised where the target cannot support
them. Unknown outcomes require reconciliation before retry.

Parked time consumes no active execution budget when nothing runs, while deadline
and grant expiry remain effective. Resume does not replenish spent budget.

### Mutation, evidence, and completion

Workers produce candidates in granted workspaces. The resource owner checks
scope, revision, and evidence before integration. A new candidate means prior
assessments no longer satisfy obligations for the current candidate; the old
records remain valid historical evidence.

Closing coordination does not merge, approve, or transition Work. Work retains
its own lifecycle authority. Runtime validates evidence structure and required
attestations; it does not infer agreement or correctness from process success.

## 9. Migration path preserving proven capability

This is a responsibility map, not a multi-phase implementation plan.

| Existing substrate | Proposed treatment |
|---|---|
| Assignment/Dispatch/Run/RunResult | Keep one execution path |
| Work-independent CoordinationSession | Keep identity/recovery root; no placeholder Work |
| Retry/recheck, history, idempotency, lock-held bounds | Keep; prove through public paths |
| FlowDefinition | Narrow to optional method/constraint representation; preserve Workflow consumers |
| Authorization/mutation gates | Elevate to authenticated grants tied to execution isolation |
| Visibility windows | Elevate to disclosure/read-grant primitives referenceable by a graph |
| Specialist slots | Generalize to bounded recruitment without predeclaring each specialty |
| Persona/policy resolution | Complete delivery and per-assignment binding, including fan-out |
| Typed contributions | Separate generic artifact lineage from optional cognitive taxonomy |
| Aggregation evaluator | Narrow to structural/evidence validation; agreement is a sourced assertion |
| Quorum and auto-close | Replace with explicit close plus applicable obligations; remove roster-based completion |
| chain/show | Keep projections; add memory/checkpoint refs; hints are not planners |
| Fixed phase/round counts and posture rosters | Move to doctrine/playbook unless explicitly adopted as a commitment |
| Definition id/version | Add content pins including dependencies affecting legality or packets |
| Prose workarounds contradicting RunResult | Remove when runtime paths are corrected; preserve one execution truth |

Old sessions retain historical semantics under their definitions/policies. Never
replay old evidence as though it had new containment or completion guarantees.
Public-path corrections and role-packet delivery can be evaluated independently
of the final family choice. No new Mission entity or Work lifecycle authority is
implicitly introduced by this proposal.

## 10. Smallest experiments before implementation planning

The [Minimal Probe Contract](coordination-envelope-probe-contract.md) specifies
the first Code Panel experiment, pass/fail evidence, substrate gaps, and boundaries
with the concurrent Advisory track. As of 2026-09-06, that track records P00.1,
P01.1, and P01.2 complete and is parked before P01.3. Its read-only executor
allowlist is useful new evidence, but does not establish sibling-read or credential
isolation. Reconcile findings at its P02 capability-fit audit before production
P03 scope is fixed; this proposal does not change that track's authority or status.

| Probe | Minimal exercise | Evaluation condition |
|---|---|---|
| Unexpected coordination | Code Panel discovers a specialty absent from its graph; no graph/kernel edits during execution | Real specialist dispatch, correct recheck target, no authority expansion |
| Soul delivery and routing | At least two real roles with different packets and bindings | Inspect delivered packets, routing provenance, and task-appropriate outputs; fake executors are not cognitive proof |
| Independence/reveal | Canary data in sibling report, ledger, config, and ungranted context; worker actively seeks it | Access denied before reveal; only authorized subset readable afterward |
| Authority/mutation attack | Forge writer, edit definition, self-grant, follow symlink, call bypass tool | No expanded rights, altered control truth, or out-of-scope writes |
| Close semantics | Clean first pass, fix requiring recheck, dissent, missing evidence | No fake fixer; no early deliverable acceptance; advisory may finish honestly with dissent |
| Crash around effects | Kill before/after dispatch, before result linkage, after candidate creation; resume fresh | No duplicate consumption/application; unknowns reconciled; rationale and obligations recover |
| Cross-use-case reuse | Code Panel and unclear Advisory use the same public actions | Only doctrine/playbook/context change; no new kernel cognitive operation |
| Equal-budget A/B/C comparison | Same small case set, provider budget, independent evaluators | Compare quality, omissions, human intervention, cost, and authoring effort |

Run probes in an isolated external consuming project, not only in fgOS's own dev
checkout. Multi-agent quality superiority remains unproven until measured.

Decisive question:

> Can a new coordinator invent a coordination method the graph author did not
> anticipate, without exceeding authority or bounds?

B's design answer is yes: create a new prose task, choose an allowed specialist,
grant narrow context, spend remaining budget, and preserve existing obligations.
Needing a graph edit fails adaptability. Needing ambient shell/control-store
access fails the hard boundary. This answer remains a probe obligation, not a
claim of shipped capability.

## 11. Human decisions and recommended defaults

| Decision | Recommended default |
|---|---|
| Worker trust class | Workers may err or be prompt-injected; privileged runtime/config/operator are trusted |
| Target family | B; optional FlowDefinition, prompt/skill operating surface |
| Who may waive commitments? | Their issuing authority or superior; coordinator only when explicitly delegated |
| Must Advisory reach consensus? | No; permit qualified recommendation, dissent, insufficient evidence |
| Product decision authority | Human; distinguish recommendation from acceptance |
| Adapter cannot enforce required isolation | Refuse that execution; never silently downgrade guarantees |
| Specialist recruitment autonomy | Within granted scope/budget/capability; no self-added tool class or data scope |
| Direct peer communication | Not required by default; start with mediated artifacts and add channels when probes justify them |
| Park/resume budget | Separate active budget and deadline; resume never resets consumption |
| Kernel investment before proof | Minimum needed for probes; no large schema or Advisory phase graph yet |

The first choices to settle are the worker trust boundary and authority to change
obligations. Together they let the coordinator change its method while runtime
still knows exactly what it must refuse.
