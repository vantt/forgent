# Phase 00 - Canonical Contracts And Dispatch Prerequisites

## Objective

Promote only the maintainer-approved Step 08 decisions into canonical surfaces,
then correct the existing dispatch policy defects that would make heterogeneous
provider/model/tier evidence false. No CoordinationSession runtime is created
in this phase.

## Requirements

- **R1 Canonical decisions.** Create accepted ADRs for: (a)
  CoordinationSession as V1 recovery root, one-way session-to-Assignment
  membership, local gitignored state, direct mission-lite cutover, and Mission
  deferred-preserved; (b) versioned FlowDefinition with typed Workflow and
  CoordinationProtocol profiles; (c) interactive/headless capability parity
  plus domain-owned Work isolation. Do not edit ADR-006/007 in place. Each ADR
  records rejected alternatives and exact compatibility posture.
- **R2 Contracts and architecture.** Add accepted contracts for
  CoordinationSession persistence/recovery and FlowDefinition/profile schemas;
  update runtime, protocol, dispatch-control-plane, work-integration, system
  context, architecture/contract indexes, and Agent Coordination portal so no
  accepted page still calls these boundaries unresolved. Exact schemas must
  include versions, ids, references, bounds, status/event vocabulary, topology,
  profile discriminator, PolicyPatch provenance, and forbidden fields.
- **R3 Vocabulary and area spec.** Canonically define Phase, SessionActor,
  Persona, and Stance; state Role=seat=responsibility position and reserve
  `Participant` for the event-log process concept. Add the CoordinationSession,
  definition discovery, dispatch-policy, persistence, CLI, and Work boundary to
  `docs/specs/runner.md`; update reading map/pointers as required.
- **R4 Decision reconciliation.** Correct Step 07's stale Phase 02 status,
  annotate the Step 08 proposal with canonical extraction links, preserve all
  AC-I001..009 entries, and create the track's initial intent proof matrix. No
  proposal text becomes normative merely by relabeling.
- **R5 Tier bridge.** Add a direct policy-tier resolver for
  `lightweight|standard|creative|analytical|critical` against
  `runner.modelPolicies.<provider>`, while preserving existing Work-tier
  `light|standard|heavy -> policy tier` behavior and existing
  `modelForTier()` callers. Assignment policy must use the direct bridge and
  must not catch/erase unsupported provider/tier errors.
- **R6 Executor/provider truth.** Resolve `preferExecutor` to a registered
  executor before deriving provider/model. Provider family comes from that
  executor's configured `providerModel` (explicit `claude` default only for a
  registered executor without the field), not from executor id. Unknown
  executor and unsupported provider/tier fail before launch. Governance checks
  the resolved provider family and selected executor as distinct fields.
- **R7 Policy result/provenance.** Effective Assignment policy persists each
  resolved field as `{value, source:{scope,id}}` or an equivalent versioned
  machine-readable form for executor, provider, model, tier, persona,
  visibility, constraints, and governance. Preserve a compatibility projection
  for current callers during this phase; do not force protocol scopes before
  Phase 03.
- **R8 Provider capability validation.** Runner config accepts partial
  provider policy-tier maps and exposes a pure `supportsPolicyTier` query.
  Invalid model strings and references to absent provider tables reject at
  config load or resolve as appropriate. It never probes credentials or infers
  support from executable availability.
- **R9 Human CLI wire.** `dispatch execute --assignment` and
  `dispatch execute --contract` accept `--executor <registered-id>` plus the
  existing `--model` and `--tier`; contract execution forwards all three as
  `cliOverride` and forwards optional Work context through the existing harness
  path. `--executor` maps only to `cliOverride.preferExecutor`; it does not add
  executor/provider/model fields to the inline execution contract. Reject
  duplicate/conflicting flags and unknown executors before launch.
- **R10 Fallback posture.** Keep `fallbackExecutors` parseable for compatibility
  but mark it explicitly `reserved-not-executed` in policy/contract docs and
  persisted resolution. Never imply automatic failover, never silently select
  index 1, and correct `domains/coding/workflows/feature.yaml`'s stale `pi`
  identifier to a registered id or remove the unused fallback after checking
  intended behavior. Automatic failover remains out of scope.
- **R11 Baseline and live proof.** Record configured executor/provider/tier
  inventory without secrets. Execute the same bounded read-only inline contract
  once with `codex-cli` and once with `glm-cli` through `--executor`; prove
  Assignment policy, DispatchPlan, Run, RunResult, provider/model/tier, and
  governance provenance are accurate. Missing binary/credential is a stop gate,
  not permission to mock live evidence.

## Files

Create canonical docs under:

- `docs/architect/agent-coordination/decisions/ADR-008-*.md` through the minimum
  number of new accepted ADRs needed for R1;
- `docs/architect/agent-coordination/contracts/coordination-session.md`;
- `docs/architect/agent-coordination/contracts/flow-definition.md`.

Modify as needed:

- `docs/architect/agent-coordination/{README.md,intent-preservation-ledger.md}`;
- `docs/architect/agent-coordination/{architecture,contracts,vocabulary}/**`;
- `docs/architect/agent-coordination/proposals/step-08-standalone-coordination-protocols.md` only for extraction/status pointers;
- `docs/specs/{reading-map.md,runner.md}`;
- `plans/260831-1637-step07-inline-assignment-mvp/plan.md` stale status only;
- `src/runner/dispatch/{assignment-policy,resolve,config,cli,assignment-runner}.mjs` and barrel exports;
- `src/setup/registrations.mjs`, `domains/coding/workflows/feature.yaml`,
  `.fgos/config.json`, and `CHANGELOG.md` only where R5-R10 require.

Do not create `src/runner/coordination/**`, alter Work lifecycle code, add a
provider router, add protocol config, or change executor command templates.

## Tests First

- Extend `test/runner/assignment-policy.test.mjs` for direct policy tiers,
  executor-to-provider derivation, field sources, monotonic CLI tier, unknown
  executor, unsupported tier, and governance rejection.
- Extend `test/runner/dispatch.test.mjs` for partial provider tables and
  Work-tier compatibility.
- Extend `test/runner/assignment-dispatch.test.mjs` or the existing CLI test
  owner for both execution doors and conflicting/unknown flags.
- Extend `test/setup/registrations.test.mjs` for recognized executor ids and
  reserved fallback semantics.
- Add doc/schema fixture tests only where repository precedent supports them;
  canonical docs also require link/metadata checks.

Focused commands:

```bash
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test \
  test/runner/assignment-policy.test.mjs \
  test/runner/dispatch.test.mjs \
  test/runner/assignment-dispatch.test.mjs \
  test/setup/registrations.test.mjs
node src/runner/dispatch.mjs decide --for smoke --needs-soul --has-live-task-access
npm test
```

## Proofs And Exit

- Accepted docs contain no unresolved choice needed by Phase 01.
- Existing Work-tier tests are unchanged in meaning.
- Unsupported executor/provider-tier combinations fail before spawn with named
  executor, provider, and tier.
- Live codex/glm records prove the policy path, not only technical executor
  viability.
- Deferral Audit records Mission, automatic fallback, scoring/router,
  organization overlays, telemetry, and Work mutation as preserved/deferred.

## Risks / Rollback

Dispatch is self-hosted and high blast radius. P00.2/P00.3 must run GitNexus
impact before every symbol edit, keep `decide` bootable, and use one Doer.
Preserve compatibility projections until all current tests pass; revert the
dispatch cells independently from the canonical documentation cell.

