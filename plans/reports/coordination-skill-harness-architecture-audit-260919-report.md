# Coordination Skill and Harness Architecture Audit

Date: 2026-09-19  
Status: architecture assessment and recommendation  
Scope: `fgos-plan-loop`, `fgos-architecture-panel`, `fgos-code-panel`, generic
group-thinking/panel surfaces, CoordinationSession, FlowDefinition, and the
communication harness beneath them

## Executive conclusion

The current problem is not primarily verbose writing. Runtime skills have
become a second orchestration implementation: they mix user routing, protocol
semantics, request compilation, authority policy, provider configuration,
recovery, Git/worktree mechanics, testing doctrine, and role prompts. This
causes three coupled failures:

1. skill/runtime contract drift can make an apparently correct instruction do
   the wrong thing;
2. every Lead pays a large context tax before doing useful work, and dispatched
   actors receive repeated doctrine text;
3. correctness depends on an LLM reassembling identities, references, grants,
   and step ordering that the harness can derive mechanically.

The recommended architecture is:

```text
person / caller
  -> thin intent skill
  -> domain or use-case facade
  -> shared coordination control layer
       - typed status and legal-action projection
       - semantic request composers
       - protocol operation prompt/template resolution
  -> CoordinationSession + FlowDefinition kernel
  -> Dispatch -> Assignment -> Run -> RunResult/evidence
```

`fgos-plan-loop` should not be made the universal core for
`fgos-architecture-panel` and `fgos-code-panel`. It is a valuable first
consumer of the shared control layer and may provide the coding-cell mechanics
later reused by `fgos-code-panel`, but it contains coding-track concerns that
do not belong beneath an advisory architecture protocol. The common core is
one level lower than all three.

The target rule is:

> Skills make judgments. The control layer performs deterministic mechanics.
> The kernel enforces authority and evidence invariants.

## Evidence reviewed

The assessment used current source and canonical/current platform documents,
not only skill prose:

- `docs/platform/agent-coordination/vision.md`
- `docs/platform/agent-coordination/spec.md`
- `docs/platform/agent-coordination/contracts/flow-definition.md`
- `docs/platform/agent-coordination/contracts/coordination-session.md`
- `docs/platform/agent-coordination/proposals/semantic-cli-surface.md`
- `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md`
- `docs/platform/agent-coordination/architecture/group-thinking-trigger-surface.md`
- the group-cognition, RFC, nominal-group, Delphi, standalone master-loop, and
  architecture-advisory FlowDefinitions under `core/coordination-protocols/`
- `src/verbs/coordination/{run,show,chain,close,group-thinking-pack}.mjs`
- `src/runner/coordination/**`
- the canonical plan-loop, architecture-panel, group-thinking, panel, and
  code-panel skills

GitNexus graph tools were not exposed in this session. Execution-flow claims
were therefore checked through source imports, public use cases, contracts,
protocol definitions, and existing tests rather than a graph query.

## Current model: four related but distinct coordination shapes

### Work-attached group communication

The Team Communication proposal describes communication as a controlled
sequence:

```text
Work position
  -> legal Stage Operation
  -> Assignment
  -> Run
  -> RunResult
  -> driver chooses the next legal operation or engine verb
```

Its important reusable properties are:

- a role is not an executor;
- workers return structured artifacts rather than lifecycle authority;
- the driver verifies legality before acting on a recommendation;
- communication that affects a later decision must survive as Assignment /
  RunResult evidence, not terminal narration;
- Work remains the sole delivery lifecycle authority.

This is a communication/evidence model, not a universal panel topology.

### Declared group thinking

Group-thinking protocols add a declared CollaborationProtocol shape:

- stable roles and SessionActors;
- operations bound into phases;
- required versus driver-authorized activation;
- visibility windows and bounded context grants;
- typed contribution lineage;
- optional aggregation and specialist slots;
- bounded rounds and replayable evidence.

The shipped protocols are deliberately different:

| Protocol | Actors | Bindings | Control character |
|---|---:|---:|---|
| Group Cognition Framework | 8 | 9 required | six fixed cognitive phases, isolated exploration then convergence |
| RFC Review Lite | 4 | 4 required + 1 authorized | proposal, two isolated objections, controlled response |
| Nominal Group Lite | 4 | 6 required + 2 authorized | private proposals, controlled sharing/clarification, private ranks |
| Delphi Feedback Lite | 3 | 6 required | two bounded rounds around a mediated aggregate |
| Architecture Advisory Panel | 8 static + specialist slot | 5 required + 9 authorized | deep shaping, critique, synthesis, red-team, explanation, human dialogue |
| Standalone Master Loop | 4 | 3 required + 3 authorized | mutating candidate, independent review/red-team, revision and recheck |

These are not variants of one plan-loop. They share a coordination kernel but
have different cognitive and authority semantics.

### Plan-loop

Plan-loop is a Work-independent coding-track controller built around chained
cell sessions. It additionally owns or coordinates:

- plan/phase selection;
- isolated Git worktrees;
- mutating Doer/Fixer operations;
- proof tiers and test baselines;
- review/red-team disposition and repair;
- explicit close, merge, cleanup, and track closeout.

Those are valid domain/use-case concerns. They are not a domain-neutral
foundation for advisory panels.

### Architecture advisory

Architecture advisory needs mechanisms plan-loop does not:

- independent proposal visibility;
- controlled reveal;
- contribution lineage;
- optional bounded specialists;
- evidence-preserving synthesis and dissent;
- real human-turn provenance;
- bounded dialogue reopen.

Conversely, it must not inherit plan-loop's worktree, mutation, testing, merge,
or cell-integration semantics.

## Quantitative bloat

Current canonical runtime instructions have the following size:

| Surface | Lines | Words |
|---|---:|---:|
| `fgos-plan-loop` | 752 | 5,122 |
| `fgos-architecture-panel` | 970 | 9,006 |
| `fgos-code-panel` | 914 | 7,049 |
| architecture role doctrine | 1,607 | 13,240 |
| architecture coordinator playbook | 833 | 7,106 |

The architecture-panel skill also requires operation-specific doctrine to be
embedded across the dispatch boundary because a worker in another project
cannot read fgOS-relative doctrine paths. The same knowledge is therefore paid
for in the Lead context and again in worker prompts.

The three projection copies are currently byte-identical. That prevents
projection drift today, but it does not reduce runtime tokens or the
maintenance cost of an oversized canonical source.

## Correctness findings

### P0: explicit-close contract drift

Current `runCoordinationUseCase` closes only when the request explicitly sets
`close: true` or includes a `close` step. A separate `fgos coordination close`
door also exists.

Plan-loop and group-thinking still state that every `run` automatically closes
and that no separate close door exists. Plan-loop's close example records only
a `cell-closed` disposition through `run`; that is no longer a close request.
The result can be a session that the skill considers complete but the kernel
still records as active.

The CLI registry names `close`, while some CLI usage/error strings omit it.
This is a concrete demonstration that duplicated operational truth in prose,
comments, help text, and skills is already drifting.

### P0: public-boundary escape hatches

`fgos-architecture-panel` reaches group thinking through a `node -e` import of
an internal module rather than a stable public CLI command. Specialist
authorization still requires a direct `authorizeSpecialistSlot` engine call
because the request/CLI surface lacks the operation.

These gaps force a skill that claims to use one public door to retain private
implementation knowledge.

### P1: opaque `contractTemplate`

FlowDefinition operations carry useful `task.contractTemplate` identifiers,
but current implementation only validates and stores the string. There is no
runtime resolver that turns an operation's template id into a versioned,
operation-specific prompt packet.

This missing layer explains why role doctrine and artifact instructions have
migrated into giant skills and hand-composed `objective` strings. The schema
already contains the right reference point; the harness does not yet make it
real.

### P1: status is descriptive, not actionable

`show` exposes replay and `chain` exposes `pendingDriverAuthorizations`, but
`chain.nextAction` is prose. There is no stable machine contract containing:

- `readyToClose`;
- typed blockers;
- the legal next actions;
- the exact target/binding/ref identities each action must use;
- required versus optional inputs;
- allowed disposition values from the protocol snapshot.

The LLM therefore reconstructs an action from narrative and manually copies
identities—the same semantic error surface the new CLI is meant to remove.

### P1: semantic CLI proposal is partly stale and partly over-shaped

The proposal correctly recommends semantic request generators over a second
engine. However, its implementation status and core-fix list lag the checkout:
explicit close and parts of discharge semantics already exist.

It also proposes a `reveal` verb, while current visibility windows open as a
derived fact from settled operation evidence; there is no reveal event to
write. Adding a reveal command would either be a no-op or introduce a second
authority that conflicts with FlowDefinition. The surface should be derived
from actual kernel actions, not a desired verb count.

### P1: volatile deployment policy lives in skills

Architecture-panel embeds specific executor names, model mappings, confinement
recipes, timeout behavior, and historical incidents. Those are valuable
operational facts, but they belong in dispatch/config/setup/doctor and focused
runbooks—not in the always-loaded cognitive instruction for every panel.

### P1: no performance contract

The runtime captures duration for Runs, but these products have no explicit
quality/performance budget for:

- prompt bytes/tokens by operation;
- session input/output tokens and cost where providers expose them;
- number of dispatches and sequential waves;
- retry/no-evidence rate;
- time to first useful artifact;
- p50/p95 cell or panel completion time;
- skill and doctrine context loaded before the first dispatch.

Without denominators, shortening a skill can look successful while session
latency and repeated worker context remain unchanged.

## Alternatives

### A. Make plan-loop the common core

Advantages:

- already proven on real multi-cell implementation tracks;
- has a strong review/red-team/fix/recheck loop;
- could directly feed code-panel.

Reasons not selected:

- imports coding-track semantics below advisory consumers;
- cannot naturally express visibility, contribution, specialist, and dialogue
  behavior;
- encourages architect-panel to look like an implementation cell;
- violates the Vision boundary that coding-specific planning and Git behavior
  remain domain augmentation.

Plan-loop remains a first-class consumer and a possible shared coding-cell
facade for code-panel, not the universal coordination core.

### B. Build a shared protocol-aware coordination control layer

Selected.

This layer performs only domain-neutral mechanics:

- load the immutable session definition snapshot;
- derive current phase/quorum/visibility/authorization facts;
- project typed legal next actions;
- compose and validate one semantic request;
- resolve operation prompt templates with provenance;
- call the existing run/close engine use cases;
- return structured outcome and recovery guidance.

It does not choose a disposition, invent a protocol step, weaken a gate, merge
code, or decide which architecture is best.

### C. Rewrite each skill independently

Fastest locally, but rejected as the end state. It would duplicate request
composition, status interpretation, prompt packaging, and recovery across
plan-loop, architect-panel, code-panel, and generic panel presets. Drift would
return in a smaller-looking form.

### D. Put all intelligence into FlowDefinition YAML

Rejected. FlowDefinition correctly owns legal topology and portable policy; it
does not and should not own user routing, domain judgment, Git integration, or
large role doctrine. `contractTemplate` should reference prompt assets, not
turn YAML into a prompt archive.

## Recommended responsibility map

| Concern | Owner |
|---|---|
| Session identity, append-only events, authority, quorum, visibility legality, evidence lineage | CoordinationSession kernel |
| Declared actors/roles/operations/graph/policy bounds | FlowDefinition |
| Assignment/Run/RunResult and executor governance | Dispatch/runtime |
| Typed status, legal-action projection, deterministic ids, semantic request composition | shared coordination control layer |
| Operation-specific prompt packet and artifact contract | versioned template registry/resolver |
| Natural-language route to a use-case preset | `fgos-panel` / specialist entry skill |
| Plan/cell selection, worktree/test/merge policy | plan-loop coding-track facade |
| Architecture judgment and dialogue classification | architecture-panel facade and role packets |
| Single-change implementation UX | code-panel facade, reusing coding-cell mechanics where they genuinely match |

## Target budgets

Initial budgets should be treated as ratchets and revised only with measured
evidence:

- entry/runtime skill: at most 1,500 words, target 800–1,200;
- no embedded full coordination request JSON;
- no source-line-number citations in runtime instructions;
- no executor/model/confinement incident catalogue in runtime skills;
- one protocol operation loads only its own prompt packet;
- default status payload contains typed summary/actions, with replay detail
  behind an explicit verbose/detail option;
- plan-loop and panel reports include dispatch count, sequential-wave count,
  duration, retry count, and prompt-byte/token measurements where available.

These are product-performance constraints, not style targets.

## Decision and falsification criteria

The current recommendation is “shared control layer beneath sibling facades.”
It should be rejected or revised if implementation proof shows any of these:

1. legal next actions cannot be derived from persisted session state plus the
   immutable FlowDefinition snapshot without embedding domain judgment;
2. operation templates cannot be resolved without introducing a second
   protocol authority or replay ambiguity;
3. plan-loop and architecture-panel require incompatible action contracts even
   after domain-specific fields stay in their facades;
4. the control layer adds more caller-visible concepts or token cost than the
   raw request surface it replaces;
5. a thin skill loses quality under adversarial evaluation because essential
   cognitive doctrine was removed rather than delivered to the relevant role.

If those falsifiers do not occur, this layer is the honest common core. The
implementation plan is in
`plans/260919-coordination-skill-harness-simplification/plan.md`.

## Cold-session handoff

This section is the durable restart point for a new agent with no chat
history.

### Read in this order

1. `AGENTS.md` and `docs/specs/reading-map.md`.
2. This report, especially **Executive conclusion**, **Correctness findings**,
   and **Decision and falsification criteria**.
3. `plans/260919-coordination-skill-harness-simplification/plan.md`.
4. Before implementation, re-read the current Agent Coordination area spec
   and the exact source/contracts named by the phase being started.

### What is settled

- The problem is architectural duplication and contract drift, not merely
  writing style or file length.
- Do not assume plan-loop is the common core. Treat it as the first demanding
  consumer and as a possible coding-cell facade shared with code-panel.
- The candidate common core is below all panels: typed action/status
  projection, semantic request composition, and operation-local prompt
  template resolution.
- FlowDefinition and CoordinationSession remain the authority. Skills and
  facades may interpret intent and make judgments but may not duplicate graph,
  visibility, quorum, evidence, or close semantics.
- Architecture-panel must not inherit worktree, mutation, test, merge, or cell
  mechanics from plan-loop.
- Do not add verbs to satisfy a predetermined list. In particular, do not add
  a state-changing `reveal` verb while reveal remains a derived visibility
  fact rather than a kernel action.
- Do not rewrite code-panel until plan-loop and architecture-panel have proved
  the shared seams.

### What remains deliberately open

- Exact module, symbol, and CLI names; these require impact analysis against
  the implementation at the time of change.
- Whether architecture advisory needs a separate smaller `standard` protocol;
  Phase 5 makes this an evidence gate, not a design assumption.
- The exact template registry precedence and storage form, provided it cannot
  widen authority and retains immutable provenance.
- Numerical latency/cost targets beyond the initial 60% Lead-instruction-token
  reduction; Phase 0 must establish the baseline first.

### Repository checkpoint at handoff

- This review created only this report and the linked plan. No source, skill,
  protocol, test, config, setup, doctor, or changelog file was changed.
- Both files are intentionally untracked until the owner decides how to enter
  the implementation workflow.
- GitNexus graph/impact tools were unavailable in the session that produced
  this assessment. Before editing any symbol, the next session must run the
  repository-required upstream impact analysis and report any HIGH/CRITICAL
  blast radius.
- The first implementation activity is **Phase 0**, not semantic verb work:
  reconcile current close behavior and stale guidance, capture baseline
  quality/performance evidence, and prove legacy replay is unchanged.
- Do not begin from the older semantic-CLI proposal as if it were current
  truth. Reconcile it against the command registry, run/close use cases,
  immutable session snapshot, and current tests first.

### Immediate next-session deliverable

Produce the Phase 0 baseline/drift report and the smallest contract proposal
for `coordination-actions.v1`. Stop before implementation if that proposal
cannot demonstrate that its actions are a projection of kernel legality rather
than a second policy engine.
