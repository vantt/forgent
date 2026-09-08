# Architecture Advisory Panel

Status: PLANNED, not started | Created: 2026-09-05 | Owner: maintainer

Execution track: `architecture-advisory-panel`

## Read This First - Trong Mem, Ngoai Cung

This plan is governed by
[System Vision: Trong Mem Ngoai Cung](../../docs/architect/system-vision-trong-mem-ngoai-cung.md).
Read it before opening any cell.

```text
Outside hard:
  contract, state, authority, capability, visibility, bounds, evidence, replay

Inside soft:
  soul, prose, doctrine, judgment, role posture, collaboration, explanation
```

The most important failure to avoid is building an impressive harness that
cannot advise well. A long list of schemas, events, gates, and tests does not
create understanding, reframing, useful disagreement, intellectual honesty, or
clear explanation. The manual `master-coordinator` playbook already proves that
one strong operating prompt can coordinate real agents effectively before the
runtime formalizes every move.

Therefore this track MUST prove the soft inside first. No cell may:

- treat a role name, artifact schema, or FlowDefinition node as a substitute for
  role doctrine and judgment;
- move empathy, materiality judgment, reframing, alternative quality, debate
  style, recommendation calibration, or explanation into kernel enums;
- call a protocol conformance pass sufficient when the panel is less useful to
  a person than the manual playbook;
- collapse real role dispatch into one model pretending to be a panel;
- hardcode provider/model choices into a portable protocol;
- use "the runtime cannot express it" as a reason to weaken the advisory
  behavior before proving the actual boundary.

Every cell review asks both questions:

```text
Does the outside stay hard enough to trust and reproduce?
Does the inside stay soft enough to understand, adapt, disagree, and advise?
```

Authority entering the plan:

- [Architecture Advisory Panel proposal](../../docs/architect/proposals/architecture-advisory-panel.md)
- [Step 09 Group Thinking Substrate](../../docs/architect/proposals/step-09-group-thinking-substrate.md)
- [Agent Coordination Vision](../../docs/architect/agent-coordination/vision.md)
- [CoordinationSession Contract](../../docs/architect/agent-coordination/contracts/coordination-session.md)
- [FlowDefinition Contract](../../docs/architect/agent-coordination/contracts/flow-definition.md)
- [`fgos-code-panel`](../../.agents/skills/fgos-code-panel/SKILL.md)
- [Group Thinking user guide](../../docs/how-to/use-fgos-group-thinking.md)
- [`docs/specs/runner.md`](../../docs/specs/runner.md), especially the
  CoordinationSession and Work-isolation sections

## Goal

Ship a living advisory capability, then give it the smallest hard shell needed
to run safely and reproducibly. The capability must advise a person on a
software-system architecture question whether the initial input is already
specific or still ambiguous. The panel must investigate before asking,
preserve independent candidate generation and dissent, explain a grounded
recommendation, and support a bounded post-recommendation Decision Dialogue in
which the person retains final authority.

The manual `master-coordinator` playbook proved that strong prose, role posture,
and coordinator judgment can produce excellent group behavior before the
runtime knows how to name every move. This track follows that evidence. It first
authors and proves the Architecture Panel's soul as a manual operating pattern;
only then does it identify which behavior deserves a hard contract. The final
deliverable includes the proven doctrine/playbook/skill, a registered protocol,
and only those runtime extensions that the living proof shows are necessary.

## Product Gates

| Phase | Name | Depends on | Exit condition |
|---|---|---|---|
| 00 | [Read-only dispatch readiness](phase-00-read-only-dispatch-readiness.md) | Entry conditions | Every executor/mechanism pair admitted to the advisory roster has a live-proven confinement envelope; unsafe pairs are excluded. |
| 01 | [Advisory soul and manual proof](phase-01-advisory-soul-and-manual-proof.md) | Phase 00 | One self-contained playbook, role doctrine, and artifact prose run successfully on real clear and unclear architecture questions and help a person decide without panel-runtime changes. |
| 02 | [Capability-fit audit](phase-02-capability-fit-audit.md) | Phase 01 | Every behavior observed in the manual proof is classified as soul/prose, reusable skill behavior, existing hard primitive, or a proved hard gap. |
| 03 | [Minimal hard shell and protocol](phase-03-minimal-hard-shell-and-protocol.md) | Phase 02 | Only proved safety/replay gaps are implemented; a registered protocol preserves rather than replaces the manual advisory behavior. |
| 04 | [Production skill and Decision Dialogue](phase-04-production-skill-and-dialogue.md) | Phase 03 | The proven playbook becomes a usable skill with rich role prose, examples, recovery guidance, and the same advisory quality through the real protocol. |
| 05 | [Comparative proof and promotion](phase-05-comparative-proof-and-promotion.md) | Phase 04 | Manual and product paths are compared on real cases; the product retains the soul while adding replayable evidence, safety, and resume. |

## Dependency Shape

```text
Phase 00: establish a hard read-only execution boundary for proof agents
       ↓
Phase 01: author soul/doctrine and prove it manually
       ↓
Phase 02: observe behavior and audit hard/soft placement
       ↓
Phase 03: add only the minimum hard shell + protocol
       ↓
Phase 04: project the proven intelligence into a production skill
       ↓
Phase 05: compare manual and product behavior, then promote
```

This track is intentionally sequential. The soft operating intelligence must
exist and work before the hard shell is designed around it. Phase 02 prevents
the plan from hardening judgment that belongs in prose or leaving safety that
belongs in the kernel as a prompt convention. Phase 03 mechanizes only the
settled boundary. Phase 04 keeps the skill rich rather than reducing it to a
thin protocol selector. Phase 05 explicitly checks that mechanization did not
make the advisors less capable, less humane, or more likely to ask prematurely.

## Execution Cells

| Cell | Phase | Objective | Ready after | Primary lease |
|---|---|---|---|---|
| P00.1 | 00 | Compare and prove provider-native, executor, and OS/filesystem read-only envelopes; use disposable checkouts only as attack targets; admit only safe executor/mechanism pairs. | Entry conditions | `readonly-dispatch` |
| P01.1 | 01 | Author the manual coordinator playbook, role doctrine, artifact templates, and evaluation rubric. | P00.1 | `panel-soul` |
| P01.2 | 01 | Run and review the clear-input manual proof with real independently routed agents. | P01.1 | `panel-proof-clear` |
| P01.3 | 01 | Run the unclear-input + Decision Dialogue manual proof and revise the soul artifacts once. | P01.2 | `panel-soul`, `panel-proof-unclear` |
| P02.1 | 02 | Produce the observed-behavior inventory and hard/soft placement matrix with executable capability probes. | P01.3 | `placement-audit` |
| P03.1 | 03 | Add trusted external-input/human-decision provenance and any other proved shared blocker. | P02.1 | `coordination-contract` |
| P03.2 | 03 | Define artifact envelopes, the portable protocol, pack registration, and conformance tests. | P03.1 | `panel-protocol` |
| P04.1 | 04 | Author the production skill and role/task prose; generate every projection. | P03.2 | `panel-skill` |
| P04.2 | 04 | Add the narrow launcher/status/dialogue surface and worked requests without duplicating engine authority. | P04.1 | `panel-surface` |
| P05.1 | 05 | Run focused conformance, authority/security, crash/resume, and heterogeneous dispatch proof. | P04.2 | `panel-conformance` |
| P05.2 | 05 | Run manual-vs-product comparative live proof, close findings, promote docs, and close the track. | P05.1 | `panel-proof-final` |

One active cell at a time. P01.2 and P01.3 are deliberately sequential because
the unclear case must consume the corrected playbook from the clear case.
Current source has no trusted external-human input/decision door, so P03.1 is
expected to contain at least that capability. It may close no-op on this point
only if P02.1 proves that the execution base acquired an equivalent trusted
door after this plan was written. Other proposed kernel work remains conditional.

## Exact Artifact Locations

```text
Manual soul source:
  docs/architect/agent-coordination/playbooks/prompts/architecture-advisory-coordinator.md
  docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md
  docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md
  docs/architect/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md

Production protocol and skill:
  core/coordination-protocols/architecture-advisory-panel-v1.yaml
  core/skills/fgos-architecture-panel/SKILL.md
  .agents/skills/fgos-architecture-panel/SKILL.md
  .claude/skills/fgos-architecture-panel/SKILL.md
  plugins/fgOS/skills/fgos-architecture-panel/SKILL.md

Examples and user docs:
  docs/how-to/use-fgos-architecture-panel.md
  docs/how-to/coordination-examples/architecture-advisory-panel-*.json

Track evidence:
  docs/architect/agent-coordination/verification/architecture-advisory-panel/index.md
  docs/architect/agent-coordination/verification/architecture-advisory-panel/current-cell.md
  docs/architect/agent-coordination/verification/architecture-advisory-panel/P*.md
  docs/architect/agent-coordination/verification/architecture-advisory-panel/proofs/<cell-id>/
  plans/260905-architecture-advisory-panel/reports/<role>-<cell>-<timestamp>.md
```

Artifact content defaults to prose templates embedded in the production skill,
with conformance tests parsing the worker's `agent-result.json`. P02.1 may
instead select `core/task-specs/<name>.md` for reusable task prose or an Agent
Coordination contract path for a genuinely hard envelope. There is currently no
artifact-schema registry and `contractTemplate` is only an unresolved string;
P02.1 must not pretend otherwise or invent a new top-level registry without a
separate accepted ownership decision.

## Default Role Routing

The portable protocol declares roles, capabilities, and minimum tiers only.
For declared-protocol requests, the session request may bind `executor`,
`tier`, and `persona` per actor; it cannot bind `actors[].model` today. The
actual model is derived from the selected executor's `providerModel` and tier
through `modelPolicies`. P01.1 records configured executors and the derived
models, then applies this policy:

| Role | Cognitive need | Default tier | Diversity posture |
|---|---|---|---|
| external driver | Authorization, disposition, bounds, and human handoff | critical | Persistent coordinator; never authors panel interpretation |
| lead advisor | Intent interpretation, question discipline, and human-facing explanation | critical | Independently dispatched graph actor |
| context investigator | Broad evidence retrieval and falsification | standard or analytical | May share provider with lead; fresh execution |
| system shaper | Deep architecture synthesis | analytical | Prefer executor/provider family A |
| alternative shaper | Different priors and solution-class search | analytical | Prefer executor/provider family B |
| constraint advocate | Operations/security/migration reasoning | analytical | Prefer a third binding when available |
| architecture critic | Cross-proposal attack | analytical | Must not inherit a shaper's private context |
| synthesizer | Whole-ledger integration and explanation | critical | Use strongest derived model; sees only granted artifacts |
| independent red-team | Falsification and authority attack | analytical or critical | Prefer executor/provider family distinct from synthesizer |
| specialist | Named bounded expertise | tier required by slot | Bound only after driver authorization |

Selection order per actor is: use a P00.1-proven executor/confinement pair, satisfy the
declared minimum tier, prefer provider-family diversity, respect configured
policy and budget, then fall back to another safe pair on the same provider,
and finally the same pair in a fresh isolated assignment. The
derived provider/model and whether tier materially changes it are recorded.

Concrete model overrides are never guessed or passed to declared-protocol
actors. P00.1 reads project/global configuration and CLI help, records the
resolved roster in the track index, and uses the shared dispatch doors. It
records which tier mappings are material on the execution base; current
configuration observations are evidence, not permanent product law. If fewer
than two safe executor/provider bindings exist, heterogeneous
proof parks with an actionable environment gap; other soul work may continue.

## Proof Cases And Human Boundary

- P01.2 clear case uses `/home/vantt/projects/mdview`: decide whether the
  experimental native desktop shell should remain a thin client of the existing
  single-daemon registry/render/search authority or acquire local ownership.
- P01.3 unclear case uses `/home/vantt/projects/vnflow`: start from the symptom
  "EOD and intraday evolution is becoming difficult" and determine whether the
  right decision is to keep separate pipelines with shared contracts, introduce
  one pluggable pipeline abstraction, or reframe the problem elsewhere.
- Before dispatch, the person confirms each question is genuinely undecided.
  If either is already settled, that proof cell parks and requests one replacement
  real project/question; it never substitutes `fgos-test-drive` or a fake case.
- The clear and unclear cases must be genuine decisions, not seeded answers
  designed to make the panel pass.
- A real person must interact at the Decision Dialogue boundary. When no person
  is available, the cell parks at one consolidated request naming the packet,
  the exact needed interaction, and all work that can continue independently.
  A scripted fake-human answer cannot close the requirement.
- The person's rubric assessment is recorded before Reviewer and Red-Team see
  it. The evaluator is not the session driver.
- Product proofs pin the exact fgOS binary/source revision and record requested
  and actual actor routing in the proof directory.

## Cell Trace Contract

Before P00.1, create the verification directory, `index.md`, and
`current-cell.md`. For every cell:

1. `current-cell.md` stays under 100 lines and names Objective, Must Read,
   Requirements, Files, Do Not Touch, role roster, exact commands, and stop
   gates.
2. `P<NN>.<k>.md` owns the proof matrix, Doer result, Reviewer findings,
   Red-Team attacks, driver dispositions, fix/recheck history, tests, changed
   paths, and commit.
3. Large logs and immutable session artifacts live under `proofs/<cell-id>/`;
   reports link them rather than pasting them.
4. Reviewer and Red-Team receive the same immutable candidate revision and do
   not see each other's first-pass output.
5. Accepted findings are fixed by a separate Fixer assignment and both roles
   recheck the integrated result.
6. The coordinator updates `index.md`, clears `current-cell.md`, and records the
   commit before opening the next cell.

## Stop Gates

Stop the active cell, preserve evidence, and request one consolidated decision
only when:

- Phase 01 exposes a product-policy choice that materially changes the advisory
  doctrine and evidence cannot settle it;
- no real human interaction is available for a proof that specifically requires
  human decision authority;
- fewer than two safe executor/provider bindings make the heterogeneous proof
  impossible after configuration has been inspected;
- Phase 02 proves a HIGH/CRITICAL shared-kernel change outside the active file
  lease; split and review it before protocol work;
- a proposed artifact schema would encode advisory judgment rather than safety,
  provenance, or replay;
- a concurrent track owns the same lease;
- focused or full tests introduce a failure beyond the recorded baseline.

Do not stop merely because one optional specialist is unavailable, one
non-material unknown remains, or a protocol-only phase needs no source change.

## Entry Conditions

- Preferred start: merge the completed `group-thinking-plan-loop` branch into
  `main`, then create `architecture-advisory-panel` from that descendant. Until
  then, the track may branch from a commit containing `22b26333` plus the
  committed version of this plan. Never start from current `main`, which is 54
  commits behind and lacks the required plan-loop/code-panel surface. Record
  the actual immutable `BASE_REF` in the verification index.
- Step 09 MVP0-9 and the Group Thinking Protocol Pack are present and green.
- `fgos-code-panel` remains the concrete-code-change use case; this track does
  not absorb or modify its responsibilities.
- The proposal remains `Design status: Discussion` until the Phase 01 manual
  proof and Phase 02 hard/soft placement audit have settled the operating shape.
- A baseline focused coordination suite and full `npm test` result are captured
  before runtime implementation.
- Any concurrent track owning `src/runner/coordination/**`,
  `src/runner/definitions/**`, `src/verbs/coordination/**`, the protocol pack,
  or CLI coordination wiring must be closed or assigned a non-overlapping file
  lease before a cell opens.

## Plan-Level Invariants

- Work remains optional and read-only context. No panel operation may claim,
  move, approve, merge, or otherwise mutate a Work item.
- The panel never receives git or implementation authority.
- The external driver remains outside `spec.actors[]` and owns adaptive
  operation authorization.
- The lead advisor is a separately dispatched actor. It authors interpretation,
  DecisionRequest, and DialogueImpactAssessment artifacts through its own
  Assignment/RunResult; the driver only authorizes and dispositions them.
- The person owns architecture decision authority. Driver disposition and
  aggregation validation are not substitutes for a human decision.
- Original human input, panel interpretation, advisory recommendation, and
  human decision remain separate immutable artifacts or events.
- Independent shapers cannot see sibling proposals before the declared cohort
  settles.
- Every synthesis preserves missing/failed actors, source revisions, dissent,
  unresolved objections, and uncertainty.
- Selective reopen uses predeclared bounded operations and append-only
  revisions. No `addSessionEdge`, arbitrary runtime graph mutation, or deletion
  of earlier evidence is allowed.
- Clarification does not consume a reopen cycle; material changes do.
- The launcher stays thin. It may select and populate a protocol request but
  may not reimplement visibility, aggregation, authority, bounds, or replay.
- The skill stays rich. It owns advisory doctrine, role posture, judgment
  heuristics, recovery behavior, human-facing explanation, and examples.
- A contract may enforce legality, provenance, and bounds; it may not substitute
  for understanding, reframing, deliberation quality, or explanatory judgment.
- Every role separation is real dispatch, not one model simulating a panel.
  Each declared-protocol actor is independently bindable to `executor`, `tier`,
  and `persona`; provider/model is derived and preserved in RunResult.
- Portable protocol policy may express capability and minimum-tier requirements
  but never hardcode a host-specific executor/model. Concrete selection belongs
  to the session request and governed dispatch policy.

## Shared File Leases

| Lease | Authorized scope | Cells |
|---|---|---|
| `track-state` | `docs/architect/agent-coordination/verification/architecture-advisory-panel/{index.md,current-cell.md}` | All cells, serially |
| `readonly-dispatch` | `docs/architect/agent-coordination/verification/architecture-advisory-panel/{P00.1.md,proofs/P00.1/**}`; `.fgos/config.json`, `src/setup/checks.mjs`, the exact existing config-default owner proved by P00.1, matching dispatch/setup tests, and `CHANGELOG.md` only when the selected product mechanism requires them | P00.1 |
| `panel-soul` | the four exact playbook/doctrine/template/rubric paths in Exact Artifact Locations | P01.1, P01.3 |
| `panel-proof-clear` | `verification/architecture-advisory-panel/P01.2.md`, `proofs/P01.2/**`, matching reports | P01.2 |
| `panel-proof-unclear` | `verification/architecture-advisory-panel/P01.3.md`, `proofs/P01.3/**`, matching reports | P01.3 |
| `placement-audit` | proposal, `P02.1.md`, `proofs/P02.1/**`, matching reports | P02.1 |
| `coordination-contract` | exact schema/store/replay/session/request symbols listed by P02.1 impact analysis; their contracts/tests; no protocol/skill files | P03.1 |
| `panel-protocol` | protocol YAML, selected artifact templates/task specs, pack JSON, protocol/definition tests, `P03.2.md` | P03.2 |
| `panel-skill` | `core/skills/fgos-architecture-panel/**` and generated `.agents`/`.claude`/plugin projections; projection tests | P04.1 |
| `panel-surface` | narrow verbs/CLI wiring if proved necessary, how-to/examples, surface tests, changelog | P04.2 |
| `panel-conformance` | `P05.1.md`, `proofs/P05.1/**`, conformance/recovery tests and reports | P05.1 |
| `panel-proof-final` | `P05.2.md`, `proofs/P05.2/**`, canonical promotions, indexes, final docs/changelog | P05.2 |

No two live cells may hold the same lease. `CHANGELOG.md` belongs only to the
first phase that introduces user-visible behavior and Phase 05 may amend that
same entry during final promotion.

Conditional scope is not permission to improvise. Before P00.1 touches product
configuration, `current-cell.md` must replace "the exact existing
config-default owner" and "matching tests" with literal paths found by the
setup/config audit. Before P02.1 closes, it must amend the
`coordination-contract` row with the literal source, contract, and test paths
approved for P03.1. P03.1 cannot open while that row still contains a symbolic
scope. Every other cell similarly expands "matching reports/tests" to literal
paths in `current-cell.md` before its first edit; paths outside that frozen list
require a reviewed lease amendment.

## Verification Strategy

Focused suite after every implementation cell:

```sh
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test \
  'test/runner/coordination-*.test.mjs' \
  'test/verbs/coordination-*.test.mjs' \
  'test/cli/coordination.test.mjs' \
  'test/architecture.test.mjs'
```

Full suite at the baseline, after any Phase 03 kernel change, after Phase 04,
and at final close:

```sh
npm test
```

Known starting baseline from the completed `group-thinking-plan-loop` track is
four failures: legacy durable-doing ask/answer, missing-quadrant docs-index,
live codex usage-limit, and invalid placeholder characters in two resume
examples. P00.1 reruns and records the exact current baseline; the list may only
shrink. Any new failure blocks close.

Relative links use this exact read-only command with changed Markdown paths as
arguments:

```sh
node -e 'const fs=require("fs"),p=require("path");let b=[];for(const f of process.argv.slice(1)){const s=fs.readFileSync(f,"utf8");for(const m of s.matchAll(/\[[^\]]*\]\(([^)#]+)(?:#[^)]*)?\)/g)){const x=m[1];if(!/^[a-z]+:/i.test(x)&&!fs.existsSync(p.resolve(p.dirname(f),x)))b.push(`${f} -> ${x}`)}}if(b.length){console.error(b.join("\n"));process.exit(1)}' <files>
```

After adding/updating end-user docs, run `fgos docs-index` and include
`docs/enduser-docs-index.json` in the owning cell.

Every changed symbol receives GitNexus upstream impact analysis before editing.
Before each commit, `detect_changes()` must confirm the affected symbols and
execution flows match the active cell's lease.

## Non-Goals And Deferrals

- No vote tallying, weighted scoring, or prose-parsed consensus.
- No anonymization or pseudonymous identity layer.
- No arbitrary runtime topology overlay or peer invitation.
- No cross-session grants, Mission grouping, persistent council membership, or
  driver handoff.
- No automatic implementation-plan generation or code execution from inside
  the panel.
- No general chat, inbox, unread state, or mutable comment threads.
- No UI/dashboard in this track; CLI/headless parity and durable state come
  first.

## Done Means

1. A specific input skips unnecessary framing and asks no ceremonial question.
2. An ambiguous input triggers autonomous investigation and framing before any
   human question.
3. A user question is emitted only for a proved material, user-only gap and is
   consolidated into one explainable Decision Request.
4. Candidate architectures are independently produced, then revealed and
   debated through typed contributions.
5. The Decision Packet passes evidence-preserving aggregation and independent
   recheck without hiding dissent or stale revisions.
6. Clarification is answered without reopening; material context, a requested
   alternative, and a requested composition selectively reopen the right phase.
7. A trusted external-input/human-decision door refuses a driver-authored
   artifact presented as a human decision. P03.1 cannot downgrade this to skill
   prose without an explicit plan revision approved by the person.
8. Bounds, crash/resume, CLI/headless parity, Work isolation, and unchanged
   isolation-heavy fixtures are proven.
9. A real project outside `forgentX` completes one advisory dialogue and records
   a real human decision or honest `decision-deferred` result.
10. Canonical contracts, user documentation, changelog, and verification index
    all point to the same implemented behavior.
11. An independent qualitative comparison shows that the productized panel did
    not regress the manual playbook's understanding, alternative quality,
    willingness to revise, dissent preservation, or usefulness to the person.
12. One real session dispatches at least two roles through distinct safe
    executor/provider bindings, demonstrates a material tier-derived model
    choice where the executor supports it, and records actual
    executor/provider/model/tier provenance in RunResult evidence.
