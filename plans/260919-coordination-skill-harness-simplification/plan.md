# Coordination Skill and Harness Simplification

Status: proposed
Created: 2026-09-19
Mode: high-risk
Primary assessment:
`plans/reports/coordination-skill-harness-architecture-audit-260919-report.md`

Detailed Phase 0 design:
`plans/260919-coordination-skill-harness-simplification/phase-00-baseline-and-action-contract.md`

Detailed Phase 2 design:
`plans/260919-coordination-skill-harness-simplification/phase-02-semantic-request-composers.md`

Phase 2 readiness audit:
`plans/260919-coordination-skill-harness-simplification/reports/phase-02-readiness-audit.md`

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

## Goal

Replace oversized, drift-prone coordination skills with thin judgment
surfaces over a shared protocol-aware control layer, without weakening
CoordinationSession authority, FlowDefinition legality, evidence provenance,
provider diversity, or cold resume.

Deliver in this order:

1. shared control contracts and measurement;
2. plan-loop as the first consumer;
3. architecture-panel and generic panel/group-thinking surfaces;
4. code-panel after the shared coding-cell boundary has been proved.

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
- No scheduler, daemon, mailbox, peer-chat service, or second event log.
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
| Metrics unavailable from some providers | medium | prompt bytes and wall time are mandatory fallback denominators; unavailable token/cost is explicit |

## Likely touch areas

Exact symbols require impact analysis before editing. Expected areas:

- `src/verbs/coordination/{schema,run,show,chain,close}.mjs`
- new or existing coordination action/status/composer modules
- `src/runner/coordination/{session-engine,replay,read-evaluators}.mjs`
- `src/runner/definitions/{schema,protocol-loader}.mjs`
- prompt-template registry/rendering and Assignment provenance paths
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

## Outstanding questions

None block this plan. Whether an architecture `standard` profile should ship is
deliberately an empirical Phase 5 gate, not an assumption in the plan.
