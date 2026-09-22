# Coordination Skill and Harness Simplification

Status: in progress — Phase 2 integrated at `main@5a02e81a`; Units I02/I03 integrated at `main@dca4efd5` (candidate `2681b389` + F-01/F-02 fix, origin/main not pushed); Unit I04 / Phase 3 is next
Created: 2026-09-19
Last Updated: 2026-09-22
Mode: high-risk
Primary assessment:
`plans/reports/coordination-skill-harness-architecture-audit-260919-report.md`

Detailed Phase 0 design:
`plans/260919-coordination-skill-harness-simplification/phase-00-baseline-and-action-contract.md`

Detailed Phase 2 design:
`plans/260919-coordination-skill-harness-simplification/phase-02-semantic-request-composers.md`

Phase 2 readiness audit:
`plans/260919-coordination-skill-harness-simplification/reports/phase-02-readiness-audit.md`

Integrated-track sources:

- `plans/260917-cold-resumable-coordination-dag/plan.md`
  (`implementation-track--cold-resumable-coordination-dag`, reference tip
  `fc259498`; forward-port required, not a merge-ready branch);
- `plans/260920-2217-dispatch-engine-hardening/plan.md` (Phases 05/08/09 plus
  the still-unmerged Phase 01 result-truth remainder).

## Execution model

This track is intentionally **not** executed through `fgos-plan-loop`, a
coordination cell chain, or any review/advisory panel. Those mechanisms are
part of the subject being simplified and would add cost before the shared
control boundary is proved.

The Lead owns audit and design inline. Implementation is handed to a cheaper
executor later as small, sequential units. Each unit must name one canonical
capability, exact files/symbols, invariants, tests, verification commands, and
stop conditions. The executor must run `dispatch decide` for that capability
immediately before execution; the plan never pins an executor, provider,
model, or tier.

No implementation unit may begin while the repository baseline is ambiguous.
The dirty-checkout reconciliation gate in the Phase 0 design is therefore the
first executable unit, not administrative cleanup.

The owner has required this track's planning/audit work to remain inline: no
panel, coordination cell, `fgos-plan-loop`, or external executor is used to
author this plan. The capability annotations below still govern later
independently executable implementation/review/test units; each executing
session runs `dispatch decide` immediately before its own unit.

## Integration ownership and baseline rule

This track is now the coordination point for the remaining work from the two
adjacent tracks above. It does **not** absorb their old branches wholesale or
rewrite their settled contracts:

- Phase 2 remains the semantic-composer implementation and must first land as
  one independently reviewed, clean commit range on current `main`.
- Dispatch hardening already merged through `main@a5b1535c` is baseline, not
  work to repeat. Remaining result-truth, Phase 05, Phase 08, and Phase 09 work
  is reconciled forward from post-Phase-2 `main`.
- The DAG branch is evidence and a porting source. Its worktree has been
  observed in an unfinished merge with kernel conflicts; no integration unit
  may resolve or merge that worktree. DAG capability is forward-ported onto a
  fresh branch from the shared integration baseline.
- Phase 3, dispatch-hardening completion, and DAG forward-port may execute on
  separate branches from the same baseline where their file sets permit it.
  None is declared complete until the combined integration gate passes.
- Dispatch-hardening Phase 09 is deliberately last: it moves the same
  Assignment/Run/Herdr boundaries Phase 3 and DAG consume, so doing it earlier
  would create avoidable semantic and merge churn.

## Cross-plan status accounting contract

The three related plans remain the durable human-readable execution record:

- this parent integration plan;
- `plans/260917-cold-resumable-coordination-dag/plan.md`;
- `plans/260920-2217-dispatch-engine-hardening/plan.md` and each affected
  `phase-NN-*.md` file.

No unit that implements, verifies, reviews, integrates, supersedes, or defers
work from one of these plans is complete until the same candidate updates every
affected plan/phase status. Status documentation is part of the unit's commit,
not a later cleanup task and not a separate track ledger.

Every affected status update must record, in a consistent visible section:

1. one explicit state: `not-started`, `in-progress`, `implemented`,
   `verified`, `integrated`, `superseded`, `deferred`, or `blocked`;
2. the exact unit/requirement covered (for example I02, DAG P05, or dispatch
   Phase 05 R6), without marking an entire phase complete for a partial result;
3. source branch, candidate SHA, base/integration SHA when known, and whether
   the change is merely implemented, independently reviewed, or merged;
4. direct verification evidence: commands, pass/fail/skip counts, report path,
   and any environmental limitation;
5. disposition of every remaining requirement: next unit, explicit deferment,
   superseding current-source evidence, or blocker/owner decision;
6. the exact next eligible action and dependency gate;
7. `last verified` date and the source revision against which the statement was
   checked.

Rules:

- Never use a bare `DONE`, `CLOSED`, or `PASS` when only a subset is complete.
- Historical evidence is preserved; append/correct current status rather than
  rewriting old verification as if it ran on the new baseline.
- A forward-port updates both the receiving integration plan and the source
  plan whose requirement it consumes, with a pointer between them.
- A superseded requirement needs direct current-source/test evidence; silence
  or branch age is not a disposition.
- A merged commit without synchronized plan status is integration-incomplete
  and does not unlock its dependent unit.
- Reviewers must compare plan statuses with Git ancestry, current source, and
  independently run tests; implementer narration alone is not proof.
- Status remains documentation projected from Git/source/test truth. Do not add
  a status database, event log, scheduler, daemon, or track-state file.

## Goal

Replace oversized, drift-prone coordination skills with thin judgment
surfaces over a shared protocol-aware control layer, without weakening
CoordinationSession authority, FlowDefinition legality, evidence provenance,
provider diversity, or cold resume.

Deliver in this order:

1. shared control contracts and measurement;
2. semantic composers and a clean post-Phase-2 integration baseline;
3. result-truth reconciliation, prompt-template resolution, dispatch
   governance/operability completion, and cold-resumable DAG forward-port;
4. combined authority/replay/concurrency verification, then dispatch boundary
   simplification;
5. plan-loop as the first consumer;
6. architecture-panel and generic panel/group-thinking surfaces;
7. code-panel after the shared coding-cell boundary has been proved.

Plan-loop is not assumed to be the universal core. The plan explicitly tests
whether shared behavior belongs below it and keeps coding-only mechanics out of
architecture advisory.

## Locked architectural direction

- Skills own judgment and user-facing intent interpretation.
- A shared control layer owns deterministic coordination mechanics.
- CoordinationSession and FlowDefinition remain the only authority for legal
  execution, evidence, visibility, and close.
- Semantic commands are request composers over the existing use cases, never a
  second engine or state store.
- No raw request JSON is required in normal plan-loop/panel operation.
- No autonomous command may accept/reject a finding, authorize optional work,
  or close a session without an explicit driver action.
- Prompt/doctrine content is loaded per operation, not wholesale per skill.
- Coding worktree/test/merge rules remain outside the domain-neutral core.
- Existing session replay and legacy raw-request compatibility remain valid.

## Non-goals

- No new Work lifecycle or Mission/track persistence entity.
- No daemon, mailbox, peer-chat service, general-purpose scheduler, or second
  event log. The bounded request-scoped, read-only DAG ready-frontier scheduler
  already proved by the adjacent DAG track is the sole scheduler exception and
  must reuse the current Assignment/dispatch doors.
- No arbitrary dynamic mutation of a session's FlowDefinition graph.
- No provider/model selection ontology in skills.
- No redesign of Assignment, Run, or RunResult.
- No attempt to make every protocol use the same cognitive role roster.
- No deletion of deep doctrine or historical verification; only remove it from
  always-loaded runtime instructions.
- No code-panel rewrite before plan-loop and architecture-panel prove the
  shared seams.

## Success measures

### Correctness

- A session's actionable status is derived from replay plus its immutable
  definition snapshot.
- Every state-changing semantic command reaches the existing validated
  run/close use cases.
- A caller cannot provide a target or binding that disagrees with the action
  token/status snapshot without a loud stale/conflict refusal.
- Explicit close is the sole normal close action; stale auto-close claims are
  removed from runtime skills and current contract docs.
- Legacy raw request sessions replay identically before and after the change.

### Skill quality

- `fgos-plan-loop` and `fgos-architecture-panel` each fit within 1,500 words;
  target 800–1,200 words.
- Neither skill embeds full request JSON, field-by-field schema copies,
  source-line citations, or executor incident history.
- A cold Lead can resume from one status command plus the task/plan artifact,
  without prior chat narration.

### Performance

- Record baseline and post-change prompt bytes/tokens, dispatch count,
  sequential waves, retries, no-evidence outcomes, and wall time.
- Reduce Lead-side coordination instruction tokens by at least 60% for both
  plan-loop and architecture-panel.
- Do not increase dispatch count or sequential-wave count for an equivalent
  protocol execution.
- Operation workers receive only their own prompt packet and granted task
  context, not the full coordinator doctrine.

## Architecture

```text
fgos-panel / fgos-plan-loop / fgos-architecture-panel / fgos-code-panel
                         |
                         v
              coordination control layer
              - projectActionView()
              - semantic request composers
              - prompt template resolver
                         |
                         v
        runCoordinationUseCase / closeCoordinationUseCase
                         |
                         v
       CoordinationSession + FlowDefinition + Dispatch runtime
```

The names above are illustrative until implementation impact analysis. The
boundary is the commitment; exact module and symbol names are implementation
details.

## Phase 0 — Baseline, drift inventory, and contract reconciliation

### Objective

Establish a measurable baseline and remove false assumptions before building a
new facade.

### Work

1. Inventory current public coordination commands, request step types, and
   engine use cases from the command registry and source.
2. Identify every current-source claim that `run` always auto-closes or that
   no explicit close door exists. Classify each as current contract,
   historical verification, or stale runtime guidance; update only current
   sources.
3. Reconcile CLI help/error strings with the registered `close` command.
4. Capture baselines for representative runs:
   - one clean plan-loop cell;
   - one plan-loop cell with accepted finding, revision, and recheck;
   - one clear architecture-panel case;
   - one architecture-panel dialogue reopen;
   - one generic RFC/NGT/Delphi protocol.
5. Record prompt bytes, skill words, dispatch count, sequential waves,
   durations, retries, and evidence outcome. Record token usage when the
   provider returns it; otherwise mark it unavailable and retain prompt bytes
   as the reproducible denominator.

### Proof

- focused CLI/use-case tests for explicit close and help registry;
- a checked-in measurement report and reproducible measurement command;
- a zero-behavior-change replay comparison over the legacy session corpus.

### Exit

No current runtime skill or current contract tells a caller that close is
implicit when it is not. Baseline metrics exist before optimization begins.

### Detailed handoff

The evidence already established, remaining measurements, proposed
`coordination-actions.v1` boundary, and implementation-ready units are in
`phase-00-baseline-and-action-contract.md`. That document is authoritative for
Phase 0 execution details; this plan remains the cross-phase architecture and
ordering contract.

## Phase 1 — Typed coordination action view

### Objective

Give machines a single replay-derived answer to “what is legal next?” without
letting the projection make a driver judgment.

### Contract

Add a versioned read model resembling:

```json
{
  "contractVersion": "coordination-actions.v1",
  "coordinationId": "...",
  "phase": "...",
  "readyToClose": false,
  "blockers": [],
  "actions": [
    {
      "kind": "authorize-and-dispatch",
      "actionKey": "sha256:...",
      "nodeId": "phase-revision",
      "operationId": "revise-candidate",
      "targetActorId": "fixer",
      "requiredInputs": ["reason", "contextRefs"]
    }
  ]
}
```

Rules:

- derived only from current replay, definition snapshot, and existing pure
  evaluators;
- `actionKey` binds the projection to the session event sequence/definition
  digest so stale actions refuse;
- describes legal choices but never chooses one;
- distinguishes “legal”, “required”, “optional”, and “blocked”;
- returns protocol-owned disposition vocabulary and close blockers;
- exposes compact output by default and replay detail only on request;
- shared by `status`, `chain`, and later facades—no second derivation.

### Cases

- fresh session;
- required operation not dispatched;
- failed finding awaiting disposition;
- accepted finding awaiting remediation;
- remediation awaiting one or both rechecks;
- visibility window closed/open;
- specialist slot available/unauthorized/exhausted;
- human-turn recorded with reopen budget available/exhausted;
- ready-to-close and close-refused states;
- corrupt or schema-version-mismatched session;
- stale action after a concurrent event append.

### Exit

A cold caller can select an exact legal action without parsing prose or
guessing ids. No write path is added in this phase.

## Phase 2 — Semantic request composers and CLI surface

### Objective

Replace hand-authored request JSON for normal operation while preserving the
raw `run --file` compatibility/power-user door.

### Commands

Implement only verbs backed by real kernel actions:

- `coordination start`
- `coordination operation`
- `coordination authorize-and-dispatch`
- `coordination fan-out`
- `coordination contribution`
- `coordination human-turn`
- `coordination disposition`
- `coordination close`
- `coordination recover` (retain/currently implemented)
- `coordination status`

Do not add a standalone `reveal` write verb. Visibility windows open from
persisted evidence and are reported by `status`; a request cannot declare a
derived window open.

### Safety

- Every write command requires session driver identity through the existing
  authority checks.
- Mutating operation/fan-out paths require explicit `--cwd` and retain the
  existing worktree/mutation rules.
- Commands consume an `actionKey` or equivalent event-sequence precondition
  from the action view when selecting a replay-dependent target.
- The composer generates deterministic command/authorization/invocation ids;
  callers may supply stable ids for retry but may not silently change payload.
- Same id + same normalized payload is idempotent; same id + different payload
  is an explicit conflict.
- The composer calls the existing request validator and use case; it does not
  invoke store/session-engine mutation functions directly.

### Exit

All representative Phase 0 sessions can be operated without request files,
with byte-equivalent session semantics and explicit close.

## Phase 2A — Post-Phase-2 integration baseline and result truth

### Objective

Turn the independently approved Phase 2 candidate into the single baseline
from which Phase 3, dispatch completion, and DAG forward-port branch. Close the
remaining RunResult truth gap before any new consumer depends on quorum or
replay evidence.

### Gates

- **Satisfied:** independent review approved exact Phase 2 candidate
  `43fdd378` for Phase 3 readiness: current local `main` is its ancestor,
  focused verification reported 138 pass / 0 fail, and no unresolved
  contract/authority/atomicity finding remains. The only dirty tracked path is
  this concurrent planning update, not Phase 2 implementation drift.
- **Satisfied:** approved Phase 2 candidate `43fdd378` merged without conflict
  into `main` at `5a02e81a` (first parent `a5b1535c`), with a tree
  byte-identical to the approved candidate, then pushed to `origin/main`.
- **Satisfied (Unit I02):** Re-evaluated commit `9049e611` from branch
  `dispatch-hardening-phase01-r1r4` against post-Phase-2 source. Forward-ported
  evaluator `interpretRunResult` routing (R1) and dynamic artifact path
  resolution `resolveWorkerArtifactPath` in `aggregationSourceFrom` (R4 / M14).
- **Satisfied (Unit I02):** Implemented Phase 01 R5: late normalized output of
  superseded controllers is preserved as non-authoritative
  `result.superseded.json`, protecting authoritative `result.json` and refusing
  authoritative settlement without discarding completed worker work product.

### Invariants

- `interpretRunResult` remains the only acceptance interpretation for linked
  RunResult evidence.
- Corrupt or internally inconsistent RunResult evidence fails closed and
  cannot satisfy quorum, close readiness, DAG dependency settlement, or
  reviewer/red-team success.
- Report/artifact paths resolve through current provenance helpers, never a
  hardcoded filename.
- No result-truth repair weakens Phase 2 driver identity, action-key atomicity,
  explicit-close, or schema 1/2/3 replay compatibility.
- `result.superseded.json` is strictly non-authoritative: it is never consumed by
  `classifySessionQuorum`, `closeSessionByQuorum`, or `replaySession`.

### Exit

Post-Phase-2 `main` baseline reconciled with Phase 01 result truth;
focused coordination, RunResult, replay, stale-action, and concurrency tests
pass (11 suites, 312 tests passing, 0 failing); all following branches start
from this verified integration baseline. Detailed integration report:
[integration-i02-result-truth.md](reports/integration-i02-result-truth.md).

## Phase 3 — Operation prompt-template registry and resolver

### Objective

Make FlowDefinition's existing `task.contractTemplate` reference useful so
role doctrine no longer has to live in the coordinator skill.

### Design

1. Define a registry/discovery model for template ids at project, domain, and
   core scopes, following existing precedence without allowing a lower-trust
   project template to widen organization policy.
2. Resolve one template for the exact operation at dispatch time.
3. Render only bounded variables supplied by the validated semantic action:
   objective, artifact/context refs, expected outputs, role, constraints, and
   evidence contract.
4. Persist template identity, version/digest, and rendered prompt digest in the
   Assignment/dispatch provenance already available for prompt templates; do
   not invent a second event log.
5. Snapshot or otherwise pin enough content to make retry/replay attribution
   deterministic when a template changes.
6. Treat missing/ambiguous templates as loud configuration faults with setup /
   doctor registration if new installed assets or config are introduced.

### Guardrails

- Template text cannot grant authority, mutation, context, budget, or
  visibility beyond the engine contract.
- Portable FlowDefinitions continue to name requirements, not executor/model
  pins.
- A template may refine cognitive instructions and artifact shape; it cannot
  alter graph legality.
- Existing definitions with no resolvable template retain an explicit legacy
  objective path during migration.

### Exit

At least one plan-loop operation and two unlike advisory operations resolve
real templates through the same mechanism, proving the seam is not
coding-specific.

## Phase 3A — Dispatch governance and operability completion

### Objective

Finish the still-relevant work from dispatch-hardening Phase 05 and Phase 08
without folding dispatch policy into coordination composers or prompt
templates.

### Phase 05 reconciliation

1. Revalidate R5 against current provider/model resolution. Design a distinct
   model lookup from provider-family governance only if current source still
   conflates them; do not introduce an abstraction solely to satisfy stale
   prose.
2. Complete R6's cross-provider redirect contract: schema, validation,
   provenance, refusal behavior, and compatibility for pool entries must be
   explicit before accepting `crossProvider:true`.
3. Resolve R7 with the settled `executor-policy-dispatch-seams` authority:
   retain a used PlacementPolicy binder or delete genuinely dead shadow
   machinery and its obsolete tests/docs. Do not create two selection
   authorities.
4. Complete R8 by moving the adapter registry to a leaf only after impact
   analysis proves the import-cycle cut preserves adapter registration and
   setup/doctor discovery.

### Phase 08 reconciliation

- Add typed dispatch refusal reason codes and the public dispatch
  decide/execute/log surface while retaining the documented Node entry alias.
- Normalize `--run`/`--run-id`, validation exits, watch/inspection vocabulary,
  and not-found behavior without changing coordination CLI contracts.
- Register every new public command and any config/env/tool assumption in the
  command registry, setup merge, and doctor checks.
- Measure polling/backoff changes; do not merge a latency regression hidden as
  an operability cleanup.

### Ordering

Phase 08 begins only after Phase 2 is integrated because both modify
`bin/fgos.mjs`, `src/cli/command-registry.mjs`, changelog, and registries.
Phase 05 remainder may run alongside Phase 3 after the common baseline, but
any change to Assignment policy/provenance must be included in Phase 3's
template-provenance integration tests.

### Exit

There is one provider-family/governance vocabulary, one redirect authority,
discoverable public dispatch operations, and setup/doctor coverage for every
new operational dependency. No coordination action or template can bypass the
resolved dispatch policy.

## Phase 3B — Cold-resumable coordination DAG forward-port

### Objective

Recover the useful, previously completed DAG capability onto current source
without merging the stale/conflicted branch or restoring an obsolete kernel
execution path.

### Source and scope

- Use committed reference tip `fc259498` and its P00–P07 verification as
  evidence/porting input, not merge authority.
- Forward-port immutable DAG declaration/fingerprint, request equivalence,
  replay-derived node state, dynamic ready frontier, show/chain projection,
  recovery, and migration proof.
- Retain the locked scope: read-only individual operation nodes only. No
  mutating DAG node, fan-out DAG node, daemon, new lifecycle, or new store.

### Required adaptation

- Every node executes through the post-Phase-2 validated execution seam and
  current Assignment/dispatch runtime.
- Scheduler code may determine admission order only; it cannot decide driver
  authorization, kernel legality, action-key freshness, mutation authority,
  template authority, or close readiness.
- DAG-created Assignments use Phase 3 template resolution and current dispatch
  governance/provenance; they do not render prompts through a parallel path.
- Reconcile schema, store, replay, `run`, `show`, `chain`, and recovery changes
  semantically. Never select conflict sides mechanically.
- Legacy schema 1/2 sessions replay unchanged; schema-new sessions fail safely
  under an older binary; corrupt DAG/RunResult evidence fails closed.

### Exit

The fixed proof graph `produce -> {review, red-team}` runs with real concurrent
read-only dispatch, survives cold resume, exposes deterministic derived state,
and cannot settle descendants or close on corrupt/refused evidence.

## Phase 3C — Combined integration gate

### Objective

Prove Phase 2, result truth, Phase 3 templates, dispatch completion, and DAG are
one coherent runtime before moving boundaries or rewriting consumers.

### Proof matrix

- semantic command -> action key -> composer -> validator -> kernel ->
  Assignment -> template resolution -> dispatch policy -> RunResult;
- DAG node follows the same path, with no alternate mutation/dispatch door;
- identical retry is idempotent; changed action/event/definition/target/input
  refuses before mutation or external dispatch;
- two OS writers serialize deterministically for every state-changing semantic
  family; DAG concurrency affects only independent read-only nodes;
- explicit close remains required and refuses while any DAG dependency,
  finding, recheck, or evidence requirement is unsettled;
- raw `run --file`, `close --file`, legacy replay, `show`, `chain`, and retained
  aliases remain compatible;
- setup/doctor, command registry, architecture manifest, generated projections,
  focused suites, replay corpus, and full-suite baseline all agree.

### Exit

One recorded integration SHA passes the matrix with no unresolved
contract/authority/atomicity/replay blocker. Phase 4 and Phase 3D branch only
from this SHA.

## Phase 3D — Dispatch boundary simplification

### Objective

Execute dispatch-hardening Phase 09 only after behavior and consumers are
locked, preserving behavior while moving code to its documented owner.

### Work

- Move Work lifecycle behavior out of dispatch core.
- Separate Assignment settlement, CLI-spawn reconciliation, confinement
  authority, and Herdr reconciliation behind compatibility exports.
- Unify brief/result paths and carry the already-resolved template/provenance
  contract rather than inventing a second prompt path.
- Update component-boundary documentation and import-graph tests for every
  moved responsibility.
- Keep each Phase 09 requirement independently revertible; no large-bang file
  split.

### Exit

The combined Phase 3C behavior and test results remain unchanged across the
refactor, and dispatch core no longer owns Work-stage judgment or duplicated
settlement/prompt mechanics.

## Phase 4 — Rewrite plan-loop as the first consumer

### Objective

Prove the shared control layer on the most operationally demanding current
consumer, while keeping coding-track mechanics in a plan-loop facade.

### Keep in plan-loop

- choosing the next plan cell;
- interpreting plan/phase scope and verification requirements;
- judging reviewer/red-team findings;
- deciding whether to authorize a fix;
- worktree/test/merge/cleanup policy;
- explicit human escalation rules.

### Remove from plan-loop

- raw open/fix/close JSON;
- schema field copies and source-line citations;
- manual generation of authorization/invocation ids;
- manual target-assignment lookup;
- copied quorum, visibility, recheck, and close rules;
- repeated actor roster in each request;
- generic recovery mechanics;
- volatile executor/model/confinement history.

### Harness boundary

Create a plan-loop/coding-cell facade only for domain-specific mechanics:

- validate/create/reuse an isolated worktree;
- select cell inputs and verification tier;
- call semantic coordination commands;
- verify produced git/test evidence;
- merge and clean up only under Lead authority after explicit close.

It must not create a second track ledger. Track status remains a query over
sessions plus the plan artifact.

### Exit

- skill within budget;
- clean, fix/recheck, crash/resume, stale-action, and explicit-close cases pass;
- Phase 0 plan-loop scenarios show at least 60% Lead instruction-token
  reduction with no weaker evidence or extra dispatch wave.

## Phase 5 — Rewrite architecture-panel and generic panel surfaces

### Objective

Prove the same control/template layer works for a structurally unlike,
read-only, human-dialogue group-thinking consumer.

### Work

1. Move per-role packets out of the runtime skill into operation templates.
2. Move executor/confinement registration facts into dispatch config,
   setup/doctor checks, and a focused operator runbook.
3. Replace internal `node -e` pack invocation with a public semantic CLI
   surface.
4. Add a real public specialist-authorization composer if the kernel action is
   retained; eliminate the direct engine escape hatch.
5. Make human-turn and bounded-reopen actions appear in the typed action view.
6. Keep architecture judgment, turn classification, and disposition authority
   in the Lead/role packets—not in the action projector.
7. Keep `fgos-panel` as natural-language preset routing and
   `fgos-group-thinking` as the registered-protocol gate; neither duplicates
   graph semantics.

### Panel depth experiment

Do not silently reduce the nine-role protocol for speed. Measure two explicit
profiles/cases first:

- current deep/full protocol;
- a candidate standard protocol with a smaller critical path.

Compare decision quality, dissent retention, factual error, dispatch/wave
count, wall time, and prompt tokens on a fixed evaluation corpus. A standard
profile may ship only if it remains a separate registered protocol/preset with
clear selection triggers; it must not conditionally skip required bindings in
the full protocol through skill prose.

### Exit

- architecture-panel skill within budget;
- every actor receives only its own packet and granted evidence;
- specialist/human-turn/reopen/close operate through public doors;
- adversarial tests preserve premature-reveal, authority, dissent, and reopen
  caps;
- at least 60% Lead instruction-token reduction without a quality regression.

## Phase 6 — Rewrite code-panel after the shared coding seam is proven

### Objective

Make code-panel a small single-change facade, reusing plan-loop's coding-cell
mechanics only where the semantics are genuinely identical.

### Work

- route planned multi-cell mode to plan-loop by reference;
- use the shared coding-cell facade for direct single-cell mode;
- retain code-panel-specific mode selection and proof policy only;
- delete duplicated open/fix/close JSON, worktree recipe, roster, and recovery
  prose;
- keep explicit implementation authority distinct from advisory
  `coding-design-panel` routing.

### Exit

Code-panel no longer contains a second copy of the plan-loop orchestration and
does not capture advisory-only requests.

## Phase 7 — Contract, migration, distribution, and closeout

### Work

1. Version the action/status contract and semantic CLI output.
2. Preserve raw `run --file` and legacy replay behavior for the documented
   compatibility window.
3. Update current platform spec/contracts, how-to docs, skill canonical
   sources, generated projections, and `CHANGELOG.md` for user-visible CLI /
   skill behavior.
4. Register new installed assets/config with setup merge and doctor if Phase 3
   introduces them.
5. Add drift tests:
   - documented commands equal command registry;
   - runtime skills contain no raw request JSON;
   - semantic action kinds map to real kernel actions;
   - every referenced contract template resolves;
   - generated skill projections are byte-identical to canonical sources;
   - stale auto-close language is absent from current sources.
6. Run focused coordination suites, protocol conformance suites, projection /
   packaging tests, replay corpus, and full `npm test`.
7. Publish before/after performance and quality results.

### Exit

A cold agent can operate plan-loop and architecture-panel from thin skills,
typed status, and operation-local prompt packets. No required operational truth
depends on copying a large JSON payload or remembering chat history.

## Integrated implementation units and capabilities

Each block is independently executable and has exactly one canonical capability.
Executor/provider/model/tier selection remains an execution-time decision.

- unit: I00 — independently review Phase 2 candidate `43fdd378` (complete)
  capability: code:review
  depends-on: current local `main` known
  stop: candidate drift, dirty worktree, or unresolved BLOCKER/HIGH
- unit: I01 — integrate approved Phase 2 and record the shared baseline (complete)
  capability: execute
  depends-on: I00 approved
  stop: `main` changes during integration or tree is not clean
- unit: I02 — reconcile Phase 01 result-truth commit `9049e611` and R5 (integrated at `main@dca4efd5`, candidate `2681b389` + F-01/F-02 fix)
  capability: code:implement
  depends-on: I01
  status: integrated
  candidate-sha: `2681b389` (plus settlement authority & alternate writer CAS hardening)
  integrated-sha: `dca4efd5` (merge of `2681b389`)
  origin-status: `origin/main` at `ad8dbaf0` (not pushed)
  findings-resolved: I02-REV-01, I02-REV-02, I02-REV-03, I02-REV-04, F-01 (Settlement Authority / Alternate Writers), F-02 (Cross-Plan Status Synchronization)
  stop: current RunResult path contradicts the old patch or authority is ambiguous
- unit: I03 — verify result truth, replay, quorum, and stale-action compatibility (integrated at `main@dca4efd5`)
  capability: code:test
  depends-on: I02
  status: integrated
  integrated-sha: `dca4efd5`
  origin-status: `origin/main` at `ad8dbaf0` (not pushed)
  verification: 11 suites, 317 tests pass / 0 fail (doer matrix); 75 pass in assignment-dispatch.test.mjs
  stop: corrupt evidence can settle or close
- unit: I04 — implement Phase 3 template registry/resolver/provenance
  capability: code:implement
  depends-on: I01
  stop: a template can widen authority or requires an unresolved setup contract
- unit: I05 — independently review Phase 3 trust boundary and migration
  capability: code:review
  depends-on: I04
  stop: unresolved template authority/provenance finding
- unit: I06 — complete dispatch-hardening Phase 05 remainder
  capability: code:implement
  depends-on: I01
  stop: provider/placement authority decision is not settled
- unit: I07 — implement dispatch-hardening Phase 08 operability/doctor
  capability: code:implement
  depends-on: I01
  stop: command/setup/doctor contract cannot be made consistent
- unit: I08 — verify dispatch governance, CLI, doctor, and performance gates
  capability: code:test
  depends-on: I06 and I07
  stop: redirect/governance bypass or measured latency regression
- unit: I09 — forward-port DAG declaration, replay, scheduler, and projections
  capability: code:implement
  depends-on: I02, I04, and I06
  stop: port requires an alternate engine/store or weakens action/driver authority
- unit: I10 — test DAG migration, cold resume, concurrency, and corrupt evidence
  capability: code:test
  depends-on: I09
  stop: schema 1/2 replay changes or corrupt evidence settles a node
- unit: I11 — independently review combined Phase 2/3/dispatch/DAG runtime
  capability: code:review
  depends-on: I03, I05, I08, and I10
  stop: any contract/authority/atomicity/replay blocker remains
- unit: I12 — refactor dispatch boundaries in small reversible Phase 09 cells
  capability: code:refactor
  depends-on: I11 approved
  stop: behavior or test projection differs from the I11 baseline
- unit: I13 — verify import graph, compatibility, performance, and full suite
  capability: code:test
  depends-on: I12
  stop: consumer behavior or full-suite baseline regresses

Parallelism is limited deliberately:

```text
I00 -> I01 -> I02 -> I03 -------------------------------+
          +-> I04 -> I05 -------------------------------+--> I11 -> I12 -> I13 -> Phase 4
          +-> I06 -----+                                |
          +-> I07 -----+-> I08 -------------------------+
                       I02 + I04 + I06 -> I09 -> I10 ----+
```

I04, I06, and I07 may proceed in parallel only from the identical I01
baseline. I09 waits for result truth, template resolution, and dispatch policy
because it consumes all three. Documentation-only preparation may proceed
earlier, but no unit may claim implementation completion before its dependency
gate.

## Risk map

| Risk | Level | Proof point |
|---|---|---|
| Action projection becomes a second policy engine | high | property/negative tests compare every projected action against kernel refusal/acceptance; projector remains read-only |
| Stale action races with another writer | high | event-sequence/digest-bound action key and concurrency tests |
| Prompt resolver changes effective authority | high | template cannot modify execution contract; provenance/digest tests and malicious-template attacks |
| Legacy replay or session close changes | high | before/after corpus replay plus 583-session migration evidence where available |
| Plan-loop facade creates a second lifecycle ledger | high | status reconstructed only from plan + session logs; static and behavioral tests forbid new persisted track state |
| Skill shrink removes useful judgment | high | fixed-case quality eval and adversarial review of role outputs before deletion |
| Architecture “standard” profile launders a shallow panel as full | high | distinct protocol/preset identity and explicit selection rules; never dynamic omission from the full graph |
| Semantic verbs multiply maintenance surface | medium | one shared composer/action contract; registry-to-doc drift test |
| Template/project override becomes prompt injection | high | trust-tier/narrowing policy, immutable provenance, malicious override tests |
| Stale DAG branch restores an obsolete execution/store seam | high | forward-port from clean baseline; semantic conflict resolution; no merge of conflicted worktree |
| Dispatch provider/redirect policy diverges from Assignment provenance | high | one provider-family vocabulary, explicit cross-provider schema, combined dispatch-plan tests |
| Phase 09 refactor races ahead of active consumers | high | Phase 3C/I11 gate before any boundary move; behavior projection must remain identical |
| Corrupt RunResult satisfies DAG/quorum/close | high | `interpretRunResult`-only acceptance plus corrupt-evidence replay and close-refusal tests |
| Metrics unavailable from some providers | medium | prompt bytes and wall time are mandatory fallback denominators; unavailable token/cost is explicit |

## Likely touch areas

Exact symbols require impact analysis before editing. Expected areas:

- `src/verbs/coordination/{schema,run,show,chain,close}.mjs`
- new or existing coordination action/status/composer modules
- `src/runner/coordination/{session-engine,replay,read-evaluators}.mjs`
- `src/runner/definitions/{schema,protocol-loader}.mjs`
- prompt-template registry/rendering and Assignment provenance paths
- `src/runner/dispatch/{assignment-runner,assignment-policy,resolve,plan,cli,config,transport}.mjs`
- dispatch runtime inspection, reconciliation, confinement, Herdr, provider
  capacity, setup/doctor, and component-boundary modules
- DAG declaration/compiler/scheduler plus coordination schema/store/replay,
  reconciled against current kernel rather than copied from the old branch
- `src/cli/command-registry.mjs` and `bin/fgos.mjs`
- `core/coordination-protocols/**`
- canonical `core/skills/fgos-{plan-loop,architecture-panel,panel,group-thinking}`
- `domains/coding/skills/fgos-code-panel`
- setup/doctor only if new config/assets are required
- coordination, CLI, protocol-conformance, projection, packaging, and replay
  tests
- platform Agent Coordination specs/contracts/how-to docs and changelog

## Verification strategy

Each phase receives focused positive, refusal, concurrency/idempotency, and
cold-resume tests. Final verification must include:

```sh
npm test
```

plus a version-controlled measurement command/report and the session replay
corpus comparison. Skill changes additionally require positive and negative
behavioral fixtures; word-count reduction alone is not proof of comprehension
or quality.

## Outstanding questions and explicit gates

- Phase 2 candidate `43fdd378` is independently approved. I01 must still stop
  if the candidate or current `main` changes before integration; a newer
  candidate requires a fresh review.
- Dispatch Phase 05 R5/R6/R7 are design gates, not mechanical leftovers:
  provider lookup separation, `crossProvider:true`, and PlacementPolicy
  ownership must be settled against current source before I06 edits them.
- Phase 01 R5 must be implemented or discharged with direct current-source
  evidence during I02; old plan narration is insufficient.
- Whether an architecture `standard` profile should ship remains an empirical
  Phase 5 consumer gate, not an assumption in this plan.
- No outstanding question permits Phase 09/I12 to start before combined review
  I11 approves the integrated runtime.
