# Step 10 - Coding Domain Adoption Of The Coordination Foundation

Document type: Proposal
Design status: Discussion
Implementation: Not started
Last reviewed: 2026-09-02
Canonical for: nothing until explicitly accepted
Original date: 2026-09-02
Scope: capture the discussion about bringing the existing coding domain onto
the Agent Coordination foundation after Step 09's group-thinking substrate
direction is settled — which parts are normalization of duplicate mechanisms,
which parts are new foundation capability the coding domain genuinely needs,
the seams between them, and a candidate step sequence — without opening the
Work-attached mutation gate before the proof ADR-010 §5 requires
Intent traceability: [Agent Coordination Intent Preservation Ledger](../agent-coordination/intent-preservation-ledger.md),
entries AC-I005, AC-I008, AC-I009; Vision V-012 (two unlike consumers)
Related: [Step 09 Group Thinking Substrate](step-09-group-thinking-substrate.md),
[Agent Coordination Vision](../agent-coordination/vision.md),
[ADR-007](../agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md),
[ADR-010](../agent-coordination/decisions/ADR-010-interactive-headless-parity-and-work-isolation.md),
[Work Integration](../agent-coordination/architecture/work-integration.md),
[Component Boundary Advisory](../component-boundary/component-boundary-advisory.md),
[Step 08 plan](../../../plans/260901-1542-step08-standalone-coordination/plan.md),
[Architecture Intent](../architecture-intent.md),
[Component Authority Boundary Map](component-authority-boundary-map.md)

Implementation note: nothing in this proposal is implemented. Step 08 has
closed all 8 phases. Step 09 now names the standalone group-thinking substrate
track; this Step 10 proposal must consume that substrate rather than reshape it
around coding-specific needs. This document records the coding-domain adoption
discussion so the next track does not have to be reconstructed from chat
history.

## 1. How To Read This Draft

This document uses three labels:

- **Observed** describes current repository behavior found by reading code
  and accepted documents on 2026-09-02.
- **Proposed** captures a candidate direction from the discussion.
- **Open** identifies a decision that still requires human review or proof.

Nothing labeled Proposed is an approved contract or plan. The
[Agent Coordination Vision](../agent-coordination/vision.md) is accepted authority
above this proposal. In particular, V-002 (Work is optional integration),
V-008 (domain augmentation), V-011 (small core), and V-012 (two unlike
consumers) constrain every idea below.

## 1.1 Progress Tracking

This proposal tracks discussion progress without pretending Step 10
implementation has started. Status values:

| Status | Meaning |
|---|---|
| `discussion-open` | Still being shaped in this proposal. |
| `draft-ready` | Clear enough to turn into a dedicated draft artifact, but not accepted architecture. |
| `waiting-step-08` | Must be reconciled after Step 08's final audit before acceptance or implementation. |
| `accepted-prerequisite` | Promoted into an accepted/canonical architecture document. |
| `implementation-ready` | Accepted prerequisite exists and the next implementation slice can plan against it. |

Current progress:

| Track | Status | Notes |
|---|---|---|
| Boundary map — architect-level authority guardrail | `draft-ready` | Now tracked in `component-authority-boundary-map.md`, parallel to Step 09 and Step 10. |
| Step 09 substrate dependency | `discussion-open` | Coding adoption should consume the standalone group-thinking substrate once accepted. |
| Step 10 implementation | `waiting-step-09` | Must wait for the relevant Step 09 primitive plus boundary guardrails; mutating work also waits for the ADR-010 live proof gate. |

## 2. Question This Step Answers

```txt
Once Step 08 delivers a domain-neutral coordination foundation,
what does it take to make the existing coding domain a real consumer of it —
without a second execution core, without moving Work lifecycle or git
authority into coordination, and without reopening ADR-010's mutation gate
ahead of its proof?
```

The discussion reached one headline answer, recorded here so it is not
re-derived:

**Proposed:** Step 08 completion is a necessary precondition, not a
sufficient one. The coding domain can consume the *read-only* layer of the
foundation immediately after Step 08. The *mutating* layer is blocked by a
named stop gate (ADR-010 §5; Step 08 plan "Locked Product Decisions"; ledger
AC-I009) whose lifting condition is exactly a coding-domain live proof. That
proof is therefore the middle of Step 10, not something that happens on its
own once Step 08 closes.

## 3. Dependency On Step 08

**Observed:** Step 08 has closed all 8 phases. The final Deferral Audit is now
the reconciliation source for what Step 08 deliberately delivered, deferred,
or proved out of scope.

**Proposed:** keep the authority map as a parallel architect-level
prerequisite, not a child step of coding adoption. The
[Component Authority Boundary Map](component-authority-boundary-map.md)
classifies ownership and forbidden dependencies before Step 10 implementation
starts. Mutating adoption remains blocked by the ADR-010 gate and depends on
the Step 08 proofs for crash recovery and concurrent-mutating-actor refusal.

**Observed, explicitly out of Step 08 scope and therefore *not* delivered:**

- consumer migration for the current Workflow runtime (the FlowDefinition
  adapter is additive and read-only);
- AdhocTask and hybrid planning materialization;
- Work-attached mutating coordination;
- domain worktree allocation, merge, or Work transition inside
  `src/runner/coordination/**`.

## 4. Current Coding-Domain Reality

### 4.1 Coding already sits on the shared execution core

**Observed:** since Team Dispatch V1 Steps 02–06, coding Stage Operations
lower to `Assignment -> DispatchPlan -> Run -> RunResult` through
`buildAssignment` / `executeAssignment`. The coding harness
`domains/coding/harness/enrich-and-validate-contract.mjs` (ADR-007) already
exists for agent-led inline contracts attached to Work. So "moving coding
onto the new architecture" is not a runtime replacement. What coding lacks is
the *session* layer Step 08 adds: CoordinationSession ledger, topology,
cohort allocation, session-wide budgets, and session recovery.

### 4.2 Two doors, one shared function

**Observed:** coding has two Work-attached doors:

- **Interactive:** `fgos-coding-driving` (prose loop) → stage skill → engine
  verb (`fgos discover` / `fgos plan` / `fgos return`). Secondary
  operations such as `validate-plan` reach `bin/fgos.mjs plan` →
  `chooseStageOperation` → `executeDriverOperationChoice` →
  `executeAssignment`. The Implement step calls
  `node src/runner/dispatch.mjs decide --work <id>`.
- **Headless:** `src/runner/loop.mjs` → `chooseStageOperation` →
  `executeDriverOperationChoice` for `dispatch: 'assignment'` choices, and
  `spawnWorker` (own worktree, own goal-check) for the executing-stage
  primary operation.

Both doors converge on `executeDriverOperationChoice`
(`src/runner/dispatch/operation-choice.mjs`). This is the single most useful
fact for Step 10: changing the interior of that function's `assignment`
branch changes both doors at once, which is the ADR-010 parity property for
free.

### 4.3 Session engine already accepts `workRef`, nothing uses it

**Observed:** both `openStandaloneSession` and
`openDeclaredProtocolSession` accept `workRef` (read-only, contract-approved).
No caller passes it. `createSessionAssignment` builds inline contracts only
and does not pass `work` into the build, so the ADR-007 harness never runs on
the session path. `buildReadOnlyContract` hard-codes `mutation: 'read-only'`
and restricts roles to `READ_ONLY_ROLES`. The ledger has no workspace/isolation
reference field yet (the contract permits one; P06 R7 adds the refusal).

### 4.4 Inventory of duplicate mechanisms (the "tùm lum" list, RUL11)

**Observed:** the following pairs each implement one responsibility twice.
The Step 10 sequence in §8 is derived directly from this list.

| # | Responsibility | Mechanism A | Mechanism B | Note |
|---|---|---|---|---|
| D1 | Drive one Work item through its lifecycle | `fgos-coding-driving` SKILL.md (prose, interactive) | `src/runner/loop.mjs` (code, headless) | Two implementations of one loop; no test can catch drift between them. |
| D2 | Execute the executing-stage primary operation | `spawnWorker` + worktree + goal-check (`loop.mjs`) | Assignment path (`executeAssignment`) used by every secondary operation | `implement-item` produces no RunResult / evidence record on the headless path. |
| D3 | Enforce the role graph (edges, `callstackCap`) | `src/state/handoff.mjs` on Work events, plus skill-prose reclaim | CoordinationSession `topology.edges` / `maxRounds` (Step 08) | Same rule class, two enforcement points. |
| D4 | Concurrency ceiling | worker-slots / claim-port / main-checkout-lock | `aggregateBounds.maxConcurrency` (Step 08) | Neither knows about the other. |
| D5 | Fan-out | `fgos-fanout` (prose spawning Agents that run `/fgOS:pick`; known worktree-pin race) and `loop.mjs` batch dispatch | `dispatchResearchFanOut` (Step 08, session) | Child-Work fan-out and session fan-out are different things, but the prose orchestrator is the weakest of the three. |
| D6 | Coding evidence interpretation | `interpretAssignmentRunResult` inside `src/runner/dispatch/operation-choice.mjs` (2260 lines; diff refs, verify refs, scoped-subtask undeclared-file rules) | Group Cognition synthesis evidence rules (`session-engine.mjs`) | Coding-specific evidence policy lives under a foundation directory. |
| D7 | Coding git core placement | `src/runner/{worktree,merge,iron-law-gate}.mjs`, `src/verbs/merge/*`, `src/state/{graph-harness,cleanup-harness,drift-status}.mjs` | — | One component scattered across three trees; advisory §18.5 names it Coding Repository Integration Core. |
| D8 | Collaboration record | `fgos handoff` → role/holder Work events | session `actor-bound` / `assignment-created` events | Must not become two copies of one truth. |

### 4.5 Foundation-vs-coding classification debt

**Observed:** advisory §18 identifies several current code clusters that are
used heavily by coding-domain workflows and therefore *look* coding-specific,
but are actually broader platform or foundation machinery. Step 10 must not
start by moving all of them under Coding Domain merely because coding is the
first serious consumer.

| # | Current cluster | Candidate owner | Why it matters for Step 10 |
|---|---|---|---|
| F1 | Work State And Event Store Kernel (`src/state/events.mjs`, replay/store/registry) | Platform core / Work Lifecycle substrate | Event-store/log/replay is the truth substrate for many components, not coding-domain behavior. Coding consumes it through Work and evidence records. |
| F2 | Claim And Runtime Occupancy Coordination (`claim-port`, `runtime-coordination`, `worker-slots`, main-checkout lock) | Shared runtime occupancy / Work Driver support | Coding uses it for worktrees and runner pressure today, but other Work-backed domains also need claim/occupancy semantics. |
| F3 | Work Driver And Automation Engine (`loop`, `operation-choice`, stage pool selectors, recovery/anti-loop) | Work Driver / Domain Workflow Interpreter | It chooses ready work and legal operations; coding supplies workflow declarations, but the automation driver should not become Coding Domain Core or CoordinationSession progress. |
| F4 | Coding Repository Integration Core (`worktree`, `merge`, drift, cleanup, iron-law gate, repo adapters) | Coding Domain Core | This one really is coding-specific: branch/worktree/merge/technical approval must not leak into generic Work Lifecycle. |
| F5 | Setup, Doctor, And Distribution Health | Platform support infrastructure | New domains, protocols, binaries, and config defaults must register with setup/doctor instead of creating hidden prerequisites. |
| F6 | Gateway And External Interface Control Plane | Host And Surface Layer | Gateway/REST/MCP/Herdr expose surfaces and process control; they are not lifecycle, coordination, or coding truth. |
| F7 | Knowledge, Learning, And Documentation Registry | Platform learning/documentation component | Coding currently drives much of retrospective learning, but the registry and indexing model are reusable across domains. |

**Proposed rule:** Step 1 classifies by authority and reason-to-change before
any physical move. Current paths under `src/runner`, `src/state`, or `src/verbs`
are implementation history, not ownership. A cluster becomes Coding Domain only
when its model depends on repository/code-change semantics; event logs,
runtime occupancy, setup/doctor, host surfaces, and learning registries are
 platform-core, platform-support, or host-surface components even if coding is
 the first heavy user. The Component Authority Boundary Map separates
 **platform layer** (`platform-core`, `platform-support`, `domain`,
 `host-surface`) from
 **component category** (`foundation-engine`, `integration-engine`,
 `support-infrastructure`, `domain-component`, `adapter/surface`) so
 "foundation" does not become a vague synonym for "not coding-specific."

## 5. Architectural Stance

**Proposed:** coding does not "migrate onto" Agent Coordination. Coding is a
domain component that *consumes* four platform engines
([advisory §10](../component-boundary/component-boundary-advisory.md)):

- Work Lifecycle Engine owns Work identity, status/stage, claim/return, human
  gates, and Work verbs (ADR-001).
- Agent Coordination Engine owns CoordinationSession, Assignment membership,
  topology, cohort, budgets, recovery, and synthesis inputs (ADR-008).
- Dispatch And Execution Engine owns executor/provider/model/tier/mechanism
  under governance (dispatch-control-plane).
- Run Result Evaluator owns confidence over one Assignment Run. Coding supplies
  evidence adapters and policy inputs; it does not compute final confidence
  outside that evaluator.

Coding keeps: repo scope and footprint, worktree/branch/isolation policy,
merge and catch-up, technical approval, code verification doctrine, and
coding evidence policy (Coding Repository Integration Core).

```txt
Work driver / Workflow interpreter (one engine, two doors — see §8 step 7)
  └─ selects a legal declared Stage Operation
       (domains/coding/workflows/feature.yaml remains the hard constraint)
       ├─ primary operation      → stage skill / implementer actor
       └─ collaboration operation
            ├─ opens Work-attached CoordinationSession
            │    workRef = <id>  (read-only context, never authority)
            │    actors/topology/bounds only
            ├─ asks Assignment Builder to freeze the declared operation
            │    work + stage + operation + TaskSpec provenance
            ├─ coding harness enriches/rejects before dispatch
            │    scope, evidence policy, footprint/isolation advice,
            │    opaque workspaceRef when mutation is later allowed
            ├─ Assignment → DispatchPlan → Run → RunResult     ← same core
            ├─ Run Result Evaluator applies generic + coding evidence inputs
            └─ session outcome = non-driving evidence (ADR-007 §3)
                 → driver chooses the next existing Work verb
```

Three consequences:

1. **Workflow stays the coding runtime authority.** FlowDefinition remains a
   read-only projection shared with CoordinationProtocol for validation. A
   Workflow-runtime migration is reconsidered only when a second domain
   needs something the Workflow model cannot express. This is the direct
   application of product priority #1 (AGENTS.md, D-ADR0030): do not spend
   fgOS-internal refactor effort that does not make a consuming project ship
   faster.
2. **Coding's consult / review / research / validate / scout operations become
   sessions, but declared operation construction stays outside the session
   engine.** The Work driver chooses the legal operation; the Assignment
   Builder freezes it; the session ledger records membership/topology/bounds.
3. **`scoped-subtask` is AdhocTask-lite.** A helper runs inside the session
   with its own Assignment, no Work id, no new persisted entity (V-011).
   AdhocTask proper is reconsidered only if session + Assignment refs prove
   insufficient — the same deferral logic already applied to AgentMessage
   (Step 08 human decision 5).

## 6. Seams

**Proposed.** Lettered so later documents can reference them.

| Seam | What | Where | Status today |
|---|---|---|---|
| A | Work-attached session bridge: Work driver opens a session with `workRef`, actor/topology/bounds, then records one-way membership. The session engine does **not** resolve Workflow, Stage, operation, merge, branch, or lifecycle authority. | Work Driver + `src/runner/coordination/session-engine.mjs` | `workRef` accepted, no Work-attached caller |
| B | Declared Assignment handoff: Work driver passes `{work, stage, operation}` to Assignment Builder; Assignment Builder creates declared provenance and appends membership through the session ledger. This is not an inline `supports:` workaround. | Work Driver + `src/runner/dispatch/assignment.mjs` + session store | Session assignments are inline only today |
| C | Harness preflight extension (ADR-007 §Consequences: extend this function's I/O, do not add seams): `footprint`, `isolation: shared \| isolated`, opaque `workspaceRef`, coding evidence policy inputs. | `domains/coding/harness/enrich-and-validate-contract.mjs` + ledger field | Harness is read-only-only and returns no workspace/resource data |
| D | roleGraph → session topology: registry edges (`from`, `to`, `reason`, `mode`) and `callstackCap` map onto `topology.edges` with `intents` / `maxRounds` / `maxTaskDepth`; `handoff.mjs` remains the holder truth on Work events; ledger references, never copies. | `domains/coding/registry.yaml`, `src/state/handoff.mjs`, session manifest | Two enforcement points (D3) |
| E | Evidence adapter bridge: coding-specific git/verify/artifact interpretation feeds Run Result Evaluator; session result refs and synthesis return to the Work driver as non-driving evidence; `onAdvance` verdict derivation stays in the driver. | Run Result Evaluator + Coding Domain Evidence Adapter + Work Driver | Coding evidence is concentrated in `operation-choice.mjs`; session results not wired |
| F | Git/isolation authority stays in Coding Repository Integration Core; the coding driver provisions worktrees per mutating actor and hands opaque refs to the ledger; engine refuses two mutating actors on one ref. | `src/runner/worktree.mjs`, `merge.mjs`, `src/verbs/merge/*` | Unchanged authority; no ledger integration |
| G | One change point for both doors: the `assignment` branch of `executeDriverOperationChoice` calls the Work-driver/session bridge for collaboration operations, keeping the return shape `{executed, runResult, verdictPayload, canAdvanceEdge, stop}`. | `src/runner/dispatch/operation-choice.mjs` as current entry, later Work Driver | `loop.mjs` and `bin/fgos.mjs` both call it |
| H | In-process Run mechanism: when the caller itself performs an Assignment, Dispatch/Run Runtime still records a Run and the Run Result Evaluator settles it from external evidence. This is a runtime mechanism, not a CoordinationSession feature. | Dispatch And Execution Engine + Run Result Evaluator | No minimum Run record for caller-performed work |

Two hazards attached to the seams:

- **D4 must be reconciled before Work-attached session fan-out ships:** a session's
  `maxConcurrency` must never exceed the Work runtime's worker-slot ceiling,
  or two mechanisms each believe they are the cap.
- **D8 must be decided before Seam D ships:** Work event = holder truth;
  session ledger = collaboration evidence; no field copied between them.

## 7. Foundation Capabilities Coding Requires That Standalone Never Did

**Proposed.** Roughly seven tenths of Step 10 is normalization. The remaining
three tenths is genuinely new capability, concentrated below. Standalone
proofs never needed these because every Step 08 proof is read-only.

| # | Capability | Why standalone did not need it | Lands in (§8) |
|---|---|---|---|
| N1 | Mutating Assignment inside a session: lift `buildReadOnlyContract`'s `mutation: read-only` and `READ_ONLY_ROLES` restriction for `evidence.required: verified` contracts; reuse `classifyRunEvidence`'s existing git-delta / dirty-before path | all Step 08 actors are read-only | step 5 |
| N2 | Session Assignments with **declared** provenance: `createSessionAssignment` builds inline only; coding's operations are declared Stage Operations with TaskSpecs. Decision: Work driver + Assignment Builder create the declared Assignment (`work`, `stage`, `operation`, ADR-006 provenance), while the session store records membership. Do not make CoordinationSession a Workflow interpreter. | standalone has no Stage | step 2 (needs a small ADR or contract note) |
| N3 | **In-process Run mechanism:** when `dispatch decide` returns `in-process` or `unavailable`, the caller may perform the work, but Dispatch/Run Runtime still records a Run and Run Result Evaluator settles it from real evidence. Without it, steps 6–7 hold only for headless and ADR-010 parity is not reached | standalone always dispatches a subprocess | ownership fixed in step 1; exact shape before step 6 |
| N4 | Domain evidence adapter seam: coding-specific evidence collection/interpretation feeds the Run Result Evaluator. Justified by two real consumers (coding review-item evidence; Group Cognition synthesis). New ADR; ADR-007 is not edited in place | Step 08 evidence rules live in the engine | step 3; must precede step 5 |
| N5 | Ledger accepts and persists the opaque `workspaceRef` the harness returns, and routes it into the P06 R7 refusal | P06 adds refusal only | step 5 |
| N6 | Concurrency/occupancy port: first Work-attached read-only slice inherits the host Work slot; fan-out or mutation must consult an external slot provider (coding: worker-slots) instead of treating `aggregateBounds.maxConcurrency` as an independent ceiling | standalone has no competing runtime | step 4 before fan-out/mutation |
| N7 | Session pause for a human: coding has `dispatch: human-only` operations and `fgos ask`. The CoordinationSession contract forbids "waiting on human" as a manifest status; it must be inferred from events. An event kind for park/resume is needed; replay already covers resume | standalone proofs never park | step 4 |
| N8 | Work Driver verb shared by both doors (e.g. `fgos drive <id> --ceiling <stage:\|status:>`) | not foundation; Work Driver component | step 7 |

## 8. Candidate Step Sequence

**Proposed.** Ordered by two criteria: never open the ADR-010 §5 gate earlier
than its proof, and leave visible value for a consuming project at each stop,
not only internal tidiness.

| Step | Name | Closes | Depends on | Value class |
|---|---|---|---|---|
| 1 | Boundary and substrate readiness gate: consume the parallel Component Authority Boundary Map and the relevant accepted Step 09 group-thinking primitive; no runtime code, no file moves. | F1-F7 authority classification, D7 proposed ownership, Q7 draft layout direction, Step 09 dependency | Component Authority Boundary Map + accepted Step 09 slice | prerequisite |
| 2 | Work-attached read-only `validate-plan` session only: Seams A, B, E, G for the single reviewer operation; both doors (`fgos plan --validate`, `fgos-runner --once`); golden Workflow tests unchanged; session engine remains lifecycle-blind. | first proof of N2 | 1 | **direct**: reviewer validation gains provenance/recovery without widening scope |
| 3 | Coding evidence evaluator home: extract coding-specific RunResult interpretation from `operation-choice.mjs` into the coding domain behind the N4 seam; new ADR; keep Run Result Evaluator as final confidence owner. | D6 | 1 (can run after or beside 2, but must close before 5) | indirect |
| 4 | Expand read-only collaboration sessions: `review-item`, `scout-blast-radius`, `resolve-question`; roleGraph → topology; `handoff.mjs` stays holder truth; add park/resume events and reconcile worker-slots vs session concurrency before any fan-out. | D3, D4, D8, N6, N7 | 2, 3 | **direct**: reviewer/consult get cohort diversity, provenance, recovery |
| 5 | **Mutating live proof — the ADR-010 §5 gate itself:** Seams C, F; N1, N5. Scenario: one executing item; implementer + helper (`scoped-subtask`) concurrently in distinct worktrees; reviewer read-only; overlapping footprint refused before Assignment creation; crash mid-run then resume without duplicate; merge only through `approve`; transition only through `fgos return`. Exit: AC-I009 → implemented; gate lifted by a **new** ADR, ADR-010 untouched | — | 2, 3, 4, P06 R3/R7 | required for V-012 |
| 6 | Executing path onto Assignment: `implement-item` becomes a mutating verified Assignment; goal-check becomes an evidence adapter; `spawnWorker` loses its reason to exist as a second core; in-process/manual-caller execution uses the Dispatch/Run Runtime mechanism from N3. | D2 | 5, N3 shape decided | indirect (removes false-success surface) |
| 7 | One Work Driver, two doors: `fgos-coding-driving` loop + `loop.mjs` driver logic → one engine (N8); skills become thin launchers; `fgos-fanout` calls the driver's batch dispatch instead of spawning Agents; interactive = driver with an operator attached | D1, D5 | 6, N3 | **direct**: "release con người" (priority #2); interactive/headless identical capability |
| 8 | Physical placement (optional): `operation-choice` → driver; domain loader → domains; git core → under coding domain; first Rust candidate per the migration note | D7 | 7 | optional |

### 8.1 Boundary Map Input Shape

The parallel Component Authority Boundary Map should produce ownership
documents, not a file move and not accepted runtime authority. The minimum
useful output is:

1. **Component, Bounded-Context, And Authority Map.** Records each component's
   authority, state, ports, adapters, forbidden dependencies, and layer:
   foundation, platform support, domain, integration, host/surface, or plugin.
   Draft artifact:
   [Component Authority Boundary Map](component-authority-boundary-map.md).
2. **Foundation-vs-coding extraction matrix.** Classifies F1-F7 above and names
   which currently-coding-used modules are reusable foundation/platform
   components versus Coding Domain Core.
3. **Node repo-layout overlay.** Extends the `apps/` + `packages/` direction
   from `component-boundary/repo-layout-vision.md` to Node as a proposal, not an implementation:
   thin app entrypoints stay thin; reusable authority-owning logic lives behind
   package/component facades; existing paths remain until a later movement
   slice has contract tests.
4. **Migration constraint.** Physical layout must express the authority map, not
   create it. Moving a module under `packages/domains/coding` only means coding
   owns it if the accepted authority map says coding owns that behavior.

Candidate Node layout vocabulary for that overlay:

```txt
apps/
  cli/                    # thin fgos / fgos-runner entrypoints, if moved later

packages/
  work-core/
    work-lifecycle/       # Work state, status/stage, claim/return, Work verbs
    work-driver/          # ready selection, operation choice, automation loop
    runtime-occupancy/    # worker slots, checkout locks, resource pressure
  agent-coordination/
    agent-coordination/   # CoordinationSession, topology, team cognition
    dispatch-execution/   # DispatchPlan, Run runtime, executor adapters
    run-result-evaluator/ # evidence collection, confidence, RunResult
  domain-registry/        # domain/workflow/task-spec loading and validation
  domains/coding/         # Coding Domain Core + product/design, cook, bugfix, small-change policy
  setup-doctor/           # config/default/check registration
  host-surfaces/          # gateway/API/plugin/Herdr adapters
  learning-docs/          # retrospective knowledge and docs registry
```

This vocabulary is deliberately not a required tree for Step 10. It is the
shape the Component Authority Boundary Map should draft and later accepted
boundary documents should accept, revise, or reject.

**Proposed non-goals for Step 10:**

- no AdhocTask entity (see §5 consequence 3);
- no Workflow-runtime migration onto FlowDefinition;
- no Mission, AgentMessage, `purpose` routing, marketplace, telemetry
  backend;
- no merge/branch/Work-transition API inside `src/runner/coordination/**`
  (ADR-010 §4 holds regardless of step 5's outcome);
- no editing of ADR-007 or ADR-010 in place; new decisions get new ADRs.

**Proposed cut rule if scope must shrink:** cut step 8 first, then split step
7 into "driver engine" and "fan-out onto driver". Do not cut steps 3 and 4;
they are what keeps step 5 and step 7 from collapsing.

## 9. Business Cases For Live Proof

Retained from Step 07 §15 and refined:

- **Read-only consult in coding (step 2):** a `validate-plan` reviewer
  session on a real item, run once through `fgos plan --validate` and once
  through `fgos-runner --once`, must produce semantically equivalent session
  records after visibility-field normalization.
- **Debate proof deferred from Step 07 §15.3** ("should coding planning
  validation run as a reviewer Assignment or stay same-session?") is answered
  by step 2's design, not debated again.
- **Mutating proof (step 5):** exactly the scenario in §8 row 5. It is the
  proof ADR-010 §5 names; it is not a demo.

## 10. Open Questions

1. **Q1 — `fgos handoff` after Step 10:** does it remain the write door for
   collaboration records, or become a projection from the session ledger onto
   Work events? (Decides D8; blocks Seam D.)
2. **Q2 — concurrency ceiling:** first read-only `validate-plan` slice should
   inherit the host Work slot and set session concurrency at 1. Before fan-out
   or mutation, should `aggregateBounds.maxConcurrency` be clamped by
   worker-slots through N6, or should Work-attached sessions always borrow
   slots from the host Work driver? (Decides D4; blocks step 4 fan-out/mutation.)
3. **Q3 — N3, in-process Run mechanism:** ownership is Dispatch/Run Runtime,
   not CoordinationSession. What is the minimum Run record for "the caller did
   it itself" that does not degrade into self-report? Candidate: the driver
   opens the Assignment before acting and the evidence adapter (git delta
   scoped to the attempt, verify output) settles it afterward, the same way
   `classifyRunEvidence` treats a subprocess. Must be decided before step 6.
4. **Q4 — declared vs inline for Work-attached session Assignments (N2):**
   recommended declared via Work Driver + Assignment Builder. Needs an ADR or
   contract note because the CoordinationSession store currently creates
   inline Assignments itself.
5. **Q5 — entry timing:** strictly after P07.2, or allow step 4 (evidence
   evaluator, separate files) to start after P06?
6. **Q6 — whether step 7 is one step or two** (driver engine first, then
   fan-out onto the driver). The fan-out half carries the known worktree-pin
   race; splitting may be safer.
7. **Q7 — Node repo-layout:** should the Component Authority Boundary Map only
   produce authority classification, or also accept a Node-side `apps/` +
   `packages/` overlay now? Recommended: draft the overlay there, then
   accept/revise/reject it after Step 09/Step 10 needs stabilize; forbid
   physical moves until the component has a facade and contract tests, matching
   `node-to-rust-component-migration.md`.

## 11. Intent Traceability

| Intent | Effect of this proposal | Must-not-preclude |
|---|---|---|
| AC-I005 (domain customization) | Coding becomes the second real consumer of the harness seam; N4 adds a Run Result Evaluator evidence-adapter seam justified by two consumers | seam count grows only with proven consumers; no plugin SDK |
| AC-I008 (interactive/headless parity) | Seam G and step 7 extend parity from coordination to the Work driver; N3 is owned by Dispatch/Run Runtime so parity is not headless-only | no interactive-only or headless-only capability without naming the gap |
| AC-I009 (domain-owned Work isolation) | Step 5 is the named proof; Seams C/F keep isolation, merge, transition in the domain | `src/runner/coordination/**` never gains merge/branch/transition API |
| V-012 (two unlike consumers) | Step 10 is the coding half of the claim after Step 09 proves the standalone group-thinking substrate; if coding needs a separate core after step 6, the foundation boundary was not found | one execution core |

Every implementation phase derived from this proposal must close with the
ledger's Deferral Audit template.

## 12. Discussion Log

- **2026-09-02** — Initial discussion. Conclusions: (a) Step 08 done is
  necessary, not sufficient; read-only adoption is ready, mutating adoption
  is the gate's own proof; (b) coding consumes engines, does not migrate
  runtime; (c) eight-step sequence with the duplicate-mechanism inventory
  (§4.4) as its derivation; (d) three-tenths of the work is new foundation
  capability (§7), N3 being the least visible and most decisive. Nothing
  decided; Q1–Q6 open.
- **2026-09-02** — Review update after architecture discussion. Changes:
  (a) authority moved out of `CoordinationSession` for Work/Stage/operation
  selection — Work Driver and Assignment Builder own declared Work operation
  construction; (b) first read-only slice narrowed to `validate-plan` only;
  (c) coding evidence adapter / Run Result Evaluator boundary moved before the
  mutating live proof; (d) N3 renamed as an in-process Run mechanism owned by
  Dispatch/Run Runtime, not a CoordinationSession feature; (e) the component
  authority map became an implementation gate, not optional cleanup.
- **2026-09-02** — Follow-up on component boundary and repo layout. Human
  confirmed Step 1 must happen first because advisory §18 names several
  foundation/platform clusters that coding currently uses heavily and can make
  look coding-specific. Added F1-F7 classification debt, expanded Step 1 into
  an authority-and-layout gate, and recorded a Node `apps/` + `packages/`
  overlay as proposal-only direction until facades and contract tests exist.
- **2026-09-02** — Progress tracking update. Human confirmed this is an
  independent architecture discussion, not coding implementation. Split Step 1
  into Step 1A (draft authority/layout map, may start during Step 08) and Step
  1B (promote accepted map after Step 08 P07.2 final audit). Step 2+ remains
  blocked on Step 1B.
- **2026-09-02** — Step 1A draft artifact created. Added a separate draft
  Component, Bounded-Context, And Authority Map covering F1-F8 cluster
  classification, Coding Domain Core ownership, Work-attached coding
  collaboration authority chain, draft ports, Node `apps/` + `packages/`
  overlay direction, and Step 1B promotion checklist. It is proposal-only and
  not accepted architecture.
- **2026-09-02** — Coding feature split discussion. The Step 1A draft now
  treats today's `feature` workflow as overloaded and proposes two coding
  flows: an upstream product/requirement/design/shape flow (name open) and a
  downstream implementation-oriented `cook` workflow. The upstream flow's
  output becomes the `cook` input through domain-owned cross-flow routing.
  Simple item treatment was still open at this point: direct `cook`, a separate
  lightweight workflow, or a forced upstream pass had not yet been resolved.
- **2026-09-02** — Planning vocabulary split. Human clarified there are two
  meanings of planning: product/design planning (requirements, architecture,
  design decisions, implementation shape, high-level sequence) belongs to the
  upstream product/design flow, whose name remains open because `define` is
  useful but not yet satisfying; execution planning (detailed task split, order
  of work, verification/resource plan to move fast and stably) belongs inside
  `cook` and should be machine-owned by default, without a human gate unless a
  missing product/design decision or explicit risk threshold appears.
- **2026-09-02** — Define is escalation, not default. Human clarified the
  upstream flow is only needed when an item is heavy or ambiguous enough to
  require discussion and detailed design. Simple or already-detailed items
  should not pass through the upstream product/design flow; they route directly
  to `cook` when a readiness check proves requirement, acceptance, verify, and
  footprint are sufficient.
- **2026-09-02** — Coordination rings preservation. Human flagged that if the
  four rings stay only a responsibility vocabulary and never become one shared
  engine/contract spine, implementation will drift from the intended model.
  Step 1A now records a proposed orchestration spine: common request envelope,
  ring handoff contract, authority check, state/evidence reference, and
  next-ring decision across Orchestrator, Launcher, Router/Driver, and
  Dispatcher, without collapsing all authorities into one module or into Agent
  Coordination.
- **2026-09-02** — Agent Coordination docs organization pressure. Human noted
  that current `docs/architect/agent-coordination/` organization is large and
  authority-oriented, while component-boundary discussion needs a clearer
  internal boundary view. Step 1A now records a recommendation to add a
  boundary overlay/index before any physical file move, so adjacent platform
  components such as Dispatch, Run Result Evaluation, Work Driver integration,
  and Host/Visibility are not mistaken for Agent Coordination Engine internals.
- **2026-09-02** — Parent-child hierarchy clarification. Human clarified that
  component parentage should be explicit because it affects both physical
  placement and contract dependency. Follow-up clarification: authority must
  still belong to exactly one component; parentage is for responsibility
  grouping and tightly coupled runtime collaboration among related subcomponents.
  Step 1A now records a draft hierarchy for Platform Core, Agent Coordination,
  Work Core, and Coding Domain, plus a rule that physical
  nesting permits dependency through child contracts but does not transfer
  authority from the child component to its parent. The shorthand rule is:
  parent-child = responsibility grouping + runtime coupling + placement hint;
  dependency = explicit contract direction, never inferred from nesting.
- **2026-09-02** — Step 1A artifact structure cleanup. Human flagged that
  `component-authority-boundary-map.md` had become ad hoc because new
  ideas were appended as the discussion evolved. The artifact was reorganized
  around the shorthand rule above: status, organizing formula, vocabulary,
  classification axes, parent-child responsibility map, authority ownership,
  contract dependency matrix, cluster classification, coding domain flows,
  driver/router/rings, collaboration chain, ports, layout overlay, scan
  findings, promotion checklist, and documentation overlay pressure.
- **2026-09-02** — Step 1A open-item reconciliation. Human clarified: use
  `Agent Coordination` as the umbrella name instead of `Agent Coordination
  Foundation`; `Work Core` is acceptable; Work Driver is a child responsibility
  under Work Core; Domain Registry is accepted as a general runtime definition
  loader, distinct from setup/distribution config; the upstream
  product/design flow name remains open; and the small-change path is not yet
  clear enough to call a full workflow.
- **2026-09-02** — Step renumbering and substrate separation. Human clarified
  the Master Coordination Prompt proof is not Coding Domain adoption; it is a
  standalone test of Agent Coordination's group-thinking capability with no
  Work dependency. Step 09 was split into the Group Thinking Substrate track,
  Coding Domain Adoption moved to Step 10, and the component authority map was
  promoted to a parallel architect-level guardrail rather than a child of
  coding adoption.
