# Phase 2 — Semantic Request Composers

Status: design ready; implementation blocked by the gate in this document
Date: 2026-09-20
Parent plan: `plans/260919-coordination-skill-harness-simplification/plan.md`
Readiness audit: `reports/phase-02-readiness-audit.md`

## Purpose

Phase 2 replaces hand-authored coordination request JSON for normal operation
with deterministic semantic request composers. It does not replace the raw
request door, the request validator, `CoordinationSession`, `FlowDefinition`,
or any kernel mutation path.

```text
caller judgment
  -> coordination-actions.v1 descriptor + actionKey
  -> semantic composer
  -> existing request object
  -> validateCoordinationRequest / validateCoordinationCloseRequest
  -> runCoordinationUseCase / closeCoordinationUseCase
  -> kernel rechecks identity, legality, evidence, and atomic precondition
```

The composer owns deterministic mechanics only. It never decides whether an
optional action should happen, which disposition is correct, whether a human
turn changes the decision, or whether a session is ready to close.

## Implementation gate

Implementation must not begin until all rows below are closed by current-source
proof and focused tests. A green test suite alone does not close the gate.

| Gate | Required proof | Current state |
|---|---|---|
| G1 action vocabulary | Every projected action maps to one existing request step/use case with the same required inputs and target semantics. `fan-out` and `link-contribution` must be projected only when executable. | **Blocked.** The projector detects a non-contract `fanOut` property and emits `link-contribution` before the backing Assignment exists. |
| G2 kernel legality parity | Status, action view, `show`, `chain`, and the write path use the same authoritative legality derivations. | **Blocked.** `evaluateVisibilityWindows` and `evaluateClosePrerequisites` are simplified parallel derivations; the adapter sometimes substitutes kernel-derived visibility, but the pure fallback remains divergent. |
| G3 authority | Every mutating semantic command proves the supplied writer is the session driver; omission is refused, not treated as anonymous success. | **Blocked.** `executeUnderActionPrecondition` compares identity only when an identity value is present, while several projected actions do not require one. |
| G4 atomic consumption seam | For every action-backed write, projection recheck and the existing mutation occur under one session lock without nested-lock deadlock or a check/use gap. | **Blocked.** Only `closeCoordinationUseCase` uses `closeSessionByQuorumLocked`; `runCoordinationUseCase` and its other engine doors acquire their own locks. `withEventsLock` is not reentrant in current source. |
| G5 durable idempotency | Same id/key plus same normalized payload is recoverable after a crash; same id/key plus different payload conflicts; mutation and durable consumption cannot split. | **Blocked.** `.action-keys.json` is a new sidecar written after mutation. Failure/crash between mutation and sidecar persistence is not generally recoverable; the test covers a close-specific reconstruction only. |
| G6 action contract settlement | Review report, source, tests, and public documentation agree on `record-human-turn`, specialist behavior, target shapes, and allowed inputs. | **Blocked.** The closeout report says human turns were protocol-scoped, while current source/tests intentionally expose them for every active session. |
| G7 replay/explicit close | Schemas 1/2/3 replay unchanged; raw `run --file` and public `close --file` remain compatible; close stays explicit. | Partially proved; retain as a regression gate during implementation. |
| G8 impact evidence | Refresh GitNexus to current HEAD and run upstream impact for every edited existing symbol. HIGH/CRITICAL results are reviewed before edits. | Blocked for new Units 0D–1B symbols because the index is stale at `81437fff`. Current stale-index results already mark `runCoordinationUseCase` and `validateCoordinationRequest` HIGH. |

The implementation gate is binary: G1–G6 and G8 must be closed before Unit
2A begins. G7 must remain green throughout the phase.

## Settled contracts

- `coordination-actions.v1` is a read model, not an authorization token by
  itself and not a policy engine.
- `CoordinationSession` and the bound `FlowDefinition` remain authoritative.
- All state-changing commands consume a current action descriptor and key,
  except `start`, which precedes session existence.
- `status` is read-only. `recover` retains its existing recommendation/apply
  contract and is not unified in Phase 2.
- `start` and action-backed commands compose the existing raw request shape and
  pass it through the current validator.
- Composers do not call store functions or session-engine mutators directly.
- There is no `reveal` command. Visibility is a derived fact.
- Raw `coordination run --file` and public `coordination close --file` remain.
- `show` and `chain` output do not silently change.
- Prompt-template resolution belongs to Phase 3 and is not a Phase 2 dependency.
- No new event log, scheduler, daemon, track ledger, config default, environment
  variable, expected directory, or external tool is introduced.

## Architecture and trust boundary

### Read path

```text
coordination status <id>
  -> showCoordinationActionsUseCase
  -> load manifest/events/bound definition
  -> authoritative shared legality facts
  -> coordination-actions.v1 in fgos.v1 envelope
```

### Mutation path

```text
semantic command
  -> parse caller-owned judgment fields
  -> load the named action descriptor
  -> acquire existing session lock
  -> reload manifest/events/bound definition
  -> recompute authoritative action view
  -> exact-match actionKey, eventSeq, target, input schema, driver identity
  -> compose existing request object
  -> validate existing request schema
  -> invoke the existing lock-aware run/close use case
  -> persist success through the existing authoritative session log
  -> return fgos.v1 outcome
```

There must be one lock-aware use-case boundary. A composer that validates under
the lock and then calls today's separately-locking `runCoordinationUseCase`
after releasing it is forbidden. Calling that use case while holding the lock
is also forbidden until the nested-lock behavior is explicitly made safe.

### Caller-owned fields

The caller still decides:

- whether to authorize an optional operation;
- bounded objective text and expected outputs;
- optional evidence/context refs within the descriptor's allowed set;
- disposition value and rationale;
- human-turn content reference and attribution;
- the explicit decision to attempt close.

### Derived or forbidden fields

The caller cannot provide or override:

- coordination/session identity after selecting the action;
- definition identity/version/digest;
- node, operation, actor, specialist-slot, or Assignment binding carried by
  the descriptor;
- action-key internals, event sequence, or input schema;
- driver identity independent of the session writer;
- context outside owned/granted refs;
- visibility state, close readiness, mutation authority, or topology;
- a disposition vocabulary not declared by the applicable protocol rule;
- engine-minted `protocol-operation:` provenance.

## Public command matrix

| Command | Backing action | State | Existing door |
|---|---|---|---|
| `coordination start` | none; no session exists | designable | `validateCoordinationRequest` then `runCoordinationUseCase` |
| `coordination operation` | `dispatch-operation` | blocked by G2/G4 | request step `operation` |
| `coordination authorize-and-dispatch` | `authorize-and-dispatch` | blocked by G2–G4 | request step `authorize` (which authorizes and dispatches) |
| `coordination fan-out` | `fan-out` | blocked by G1/G4 | request step `fan-out` |
| `coordination contribution` | `link-contribution` | blocked by G1/G4 | request step `contribution` |
| `coordination human-turn` | `record-human-turn` | blocked by G4/G6 | request step `human-turn` |
| `coordination disposition` | `record-disposition` | blocked by G2–G4 | request step `disposition` |
| `coordination close` | `close` | closest to ready; blocked by G3/G5 | `validateCoordinationCloseRequest` then `closeCoordinationUseCase` |
| `coordination status` | none; read-only projection | designable after G2/G6 | `showCoordinationActionsUseCase` |
| `coordination recover` | existing recovery action contract | unchanged | existing recovery use case |

No specialist-specific public verb is added in Phase 2. If a specialist-bound
operation cannot be represented safely by the settled `authorize-and-dispatch`
descriptor, it remains unavailable rather than gaining a direct engine escape
hatch.

## Command contracts

### `coordination start`

- Intent: open a new agent-led or declared-protocol session and optionally run
  only the explicitly requested initial required operations.
- Required inputs: `kind`, `coordination-id`, `writer-id`, `objective`; for a
  declared protocol, `protocol-id`; for agent-led, the current primary-task
  fields required by `validateCoordinationRequest`.
- Caller fields: bounded objective, protocol selection already made by the
  skill/facade, actor policy overrides through existing trusted channels,
  aggregate bounds, partial policy, and explicit initial steps.
- Derived fields: definition version from the resolved definition; normalized
  request shape; deterministic step labels and task keys.
- Forbidden overrides: definition content, topology, authority, implicit
  optional authorization, implicit disposition, or implicit close.
- Id rule: caller supplies a stable coordination id for retry. The normalized
  start payload is hashed; same id/same payload resumes, while same id/different
  payload is a conflict under existing session identity checks.
- Compatibility: emits the current `agent-led` or `declared-protocol` request
  and calls `validateCoordinationRequest` and `runCoordinationUseCase`.
- Success: standard `fgos.v1` envelope containing coordination id, bound
  definition, phase, steps, and next status door.
- Refusals: invalid protocol, writer mismatch, existing-id payload conflict,
  schema validation, dispatch refusal, or mutation/worktree refusal.
- Tests: deterministic request composition; same-id retry/conflict; no optional
  authorization/close; raw request equivalence; schemas 1/2/3 resume behavior.

`start` is not a natural-language preset router. The calling skill/facade owns
protocol selection.

### `coordination operation`

- Intent: execute one currently projected required or already-authorized
  operation.
- Action: exact `dispatch-operation` descriptor.
- Required CLI inputs: `id`, `action-key`, `writer-id`, `objective`, and the
  descriptor-required expected outputs once G1 settles that schema.
- Derived: session, node, operation, target actor, authorization id if present,
  definition, step label, provenance, and permitted mutation posture.
- Caller may provide: bounded objective, expected outputs, constraints,
  capabilities, and context refs allowed by the descriptor.
- Caller may not provide: target actor/node/operation/authorization binding.
- Request: one declared-protocol `operation` step composed into the existing
  request shape and validated by `validateCoordinationRequest`.
- Mutation: `mutating` is accepted only if the descriptor and existing kernel
  path satisfy all four current conditions: operation step, `work-product`,
  explicit linked-worktree `--cwd` that is not main, engine provenance, and
  execution with `isReadOnlyMode: false`. The composer duplicates none of
  these checks.
- Retry: deterministic task key from session/action/logical invocation;
  same-id/same-payload returns the existing result; different payload conflicts.
- Refusals: stale key, identity mismatch, context/grant violation, illegal
  mutation, definition drift/corruption, or kernel refusal.
- Tests: read-only and mutating positive cases; main-checkout refusal; actor/
  operation override refusal; concurrent same-key writers; crash/retry.

### `coordination authorize-and-dispatch`

- Intent: the driver elects to run one optional operation.
- Action: exact `authorize-and-dispatch` descriptor.
- Required inputs: `id`, `action-key`, `writer-id`, objective, reason; context
  refs are optional and bounded by the descriptor/window.
- Derived: node, operation, target actor or settled specialist binding,
  deterministic `authorizationId`, `invocationKey`, and step label.
- Forbidden: caller-selected binding, visibility assertion, alternative driver,
  or context outside owned/granted refs.
- Request: one existing `authorize` step; the existing run path performs both
  authorization and dispatch.
- Retry: ids are deterministic for the same logical invocation. Same payload
  is already-applied/idempotent; different payload is `payload-conflict`.
- Refusals: window closed, invocation cap, slot unavailable/expired, stale
  key, writer mismatch, ownership violation, or kernel refusal.
- Tests: optional choice never automatic; window closed/open; cap exhausted;
  same-key concurrency; foreign context; specialist-bound case only if G1
  proves the action descriptor fully binds it.

### `coordination fan-out`

- Intent: dispatch a kernel-supported fan-out whose branch set is legal now.
- Action: `fan-out`; command is unavailable until G1 defines a real descriptor
  from current kernel facts rather than a non-schema `fanOut` property.
- Required inputs after G1: `id`, `action-key`, `writer-id`, and branch
  objectives/expected outputs for the descriptor-bound actor set.
- Derived: operation, allowed actors, node/phase binding, labels, and task keys.
- Forbidden: extra actors, duplicate actors, topology expansion, per-branch
  mutation, or per-branch policy channels the existing kernel lacks.
- Request: existing `fan-out` step, validated then passed to
  `runCoordinationUseCase`.
- Retry: branch ids/task keys deterministic by action and actor; all branches
  retain current dispatch semantics; partial failure is reported, never
  rewritten as success.
- Tests: exact cohort, missing/extra/duplicate actor refusals, two-writer race,
  partial dispatch result, and replay equivalence.

### `coordination contribution`

- Intent: link one typed contribution backed by an already-settled Assignment.
- Action: `link-contribution`; unavailable until G1 projects a descriptor only
  after the backing Assignment/run/artifact exists.
- Required inputs: `id`, `action-key`, `writer-id`, `contribution-id`, type,
  round key; assignment id is descriptor-derived.
- Caller fields: contribution id, declared contribution type, round key,
  anchors/responds-to within owned lineage.
- Derived: operation, Assignment, Run, artifact revision, visibility window,
  and `linkedBy` driver identity.
- Forbidden: caller-supplied Assignment/operation binding, artifact revision,
  window-open claim, or foreign lineage refs.
- Request: existing `contribution` step and validator.
- Retry: same contribution id/content is a no-op; changed content conflicts.
- Tests: contribution type declaration, settled backing evidence, window
  ordering, dangling/foreign lineage, retry/conflict, concurrency.

### `coordination human-turn`

- Intent: record one real person-attributed external turn.
- Action: `record-human-turn` after G6 settles whether availability is all
  active sessions or a narrower contract.
- Required inputs: `id`, `action-key`, `writer-id`, turn id/ordinal, channel,
  artifact ref, external ref, and person attribution.
- Caller fields: human content artifact and attribution, plus prior-turn refs.
- Derived: `recordedBy`; realpath containment; artifact revision from bytes.
- Forbidden: caller-supplied revision, driver-as-person, panel actor as person,
  or out-of-workspace artifact.
- Request: existing `human-turn` step.
- Retry: identical turn is no-op; same turn id or external ref with changed
  content conflicts.
- Tests: ordinal continuity, external-ref uniqueness, symlink/path escape,
  identity separation, response ordering, concurrent writers.

### `coordination disposition`

- Intent: record the driver's explicit judgment on one owned target.
- Action: exact `record-disposition` descriptor.
- Required inputs: `id`, `action-key`, `writer-id`, disposition, rationale.
- Caller fields: disposition/rationale and allowed evidence refs.
- Derived: target ref, applicable operation/actor, `authorizedBy`, and any
  target-scoped `allowedValues`.
- Forbidden: replacing the target, globalizing one operation's `dischargeOn`,
  or treating rationale prose as policy.
- Request: existing `disposition` step.
- Retry: same target/id/payload is no-op; changed payload conflicts.
- Tests: free-form legacy value, target-scoped schema-3 discharge value,
  foreign/dangling ref, remediation/recheck chain, identity, concurrency.

### `coordination close`

- Intent: explicitly attempt terminal close.
- Action: exact `close` descriptor.
- Required inputs: `id`, `action-key`, `writer-id`; optional dissent refs only
  where the existing contract accepts them.
- Derived: bound definition, aggregation requirement/latest eligible record,
  current quorum, target session, and driver identity.
- Forbidden: ready flag, desired terminal status, partial-policy override, or
  caller-selected aggregation verdict.
- Request: existing close request, validated by
  `validateCoordinationCloseRequest`, then `closeCoordinationUseCase`.
- Retry: terminal same-payload close is already-applied; different writer or
  payload conflicts. The durable result must be reconstructed from
  authoritative log state, not a best-effort sidecar.
- Tests: success/refusal, wrong identity, aggregation gate, stale concurrent
  event, two writers, crash after terminal event, and `cell-closed` no-close.

### `coordination status`

- Intent: stable public read door for `coordination-actions.v1`.
- Inputs: session id; optional `--detail` and `--replay`.
- Default output: compact session identity/status/phase, contract version,
  event sequence, readiness, typed blockers, and actions. Detail/replay adds
  facts or existing replay data without changing default `show`/`chain`.
- Output: standard `fgos.v1` envelope; no prose parsing required.
- Effects: no mutation, dispatch, external effect, cache, or sidecar.
- Errors: missing/corrupt session, unknown schema/action-contract version,
  definition mismatch/unresolvable snapshot.
- Tests: output version/envelope, compact/detail stability, corruption,
  schemas 1/2/3, deterministic repeated reads, zero filesystem changes.

### `coordination recover`

No Phase 2 composition change. Keep the existing read recommendation and
CAS-bound apply path, action vocabulary, expiry, and already-applied behavior.
Status may link to recovery information but must not reinterpret its action key.

## Deterministic identifiers and idempotency

- Human-facing stable ids are accepted only where the existing schema already
  accepts them and are validated before composition.
- Derived ids use a versioned canonical hash over command kind, coordination
  id, current action key, descriptor target, and normalized caller-owned
  payload. No clock, randomness, path-dependent value, or prose serialization
  order enters the logical id.
- `authorizationId`, `invocationKey`, task keys, step labels, contribution
  linkage ids, and command ids each have a documented namespace and length.
- Same logical id plus same normalized payload returns the authoritative
  existing result or `already-applied`; it does not dispatch again.
- Same logical id plus different normalized payload returns
  `payload-conflict` before mutation.
- A stale action is refused before mutation even when its derived id has never
  been consumed.
- Idempotency truth must live in/reconstruct from authoritative session and
  Assignment/Run records. Phase 2 adds no `.action-keys.json`-style ledger.

## Error taxonomy

| Category | Meaning |
|---|---|
| `validation` | CLI/input/request schema is malformed or missing. |
| `not-found` | Session/action/owned ref does not exist. |
| `unsupported-version` | Session schema or action contract is unknown. |
| `corrupt-log` | Manifest/events/snapshot cannot be replayed honestly. |
| `unauthorized` | Writer is absent or not the session driver. |
| `stale-action-key` | Event sequence, definition, target, or current legal action differs. |
| `payload-conflict` | A logical id/key was already used with different normalized input. |
| `refusal` | Input is valid but current kernel legality/evidence rejects the action. |
| `already-applied` | Same logical action and payload already completed. |
| `partial` | Existing fan-out semantics report a partial dispatch result. |
| `internal` | Invariant or durable-write failure; never relabelled success. |

## Compatibility and migration

- `fgos coordination run --file` remains unchanged and documented as the raw
  compatibility/power-user door.
- `fgos coordination close --file` remains through the compatibility window.
- `show`, `chain`, and `recover` retain their output contracts.
- Semantic commands are additive. Availability is explicit per action kind and
  session schema; unsupported legacy operations refuse rather than guess.
- Legacy sessions replay unchanged. Schema-specific projection differences are
  descriptive and never upgrade schema-1/2 semantics to schema 3.
- No migration rewrites manifests, event logs, snapshots, or historical proof.

## Setup/doctor assessment

Phase 2 requires no new config, environment variable, template registry,
directory, tool, or installed asset. Therefore it needs no setup merge or
doctor registry entry. If implementation introduces any such dependency, stop
the unit and add the distribution design/registration work before code. Prompt
templates remain Phase 3.

## Exact current modules and symbols

These names are verified against the current checkout. New Units 0D–1B symbols
have UNKNOWN graph impact because the GitNexus index is stale; refresh it
before implementation.

| Responsibility | Current symbol/module | Impact evidence |
|---|---|---|
| raw request validation | `validateCoordinationRequest`, `src/verbs/coordination/schema.mjs` | HIGH: 33 upstream symbols on stale index |
| close request validation | `validateCoordinationCloseRequest`, same module | LOW: one direct caller on stale index |
| raw run use case | `runCoordinationUseCase`, `src/verbs/coordination/run.mjs` | HIGH: 26 upstream symbols, 10 direct callers |
| explicit close use case | `closeCoordinationUseCase`, `src/verbs/coordination/close.mjs` | LOW in stale index; current source has since changed |
| action read door | `showCoordinationActionsUseCase`, `src/verbs/coordination/actions.mjs` | UNKNOWN: absent from stale index |
| pure projector | `projectCoordinationActions`, `src/runner/coordination/actions-projector.mjs` | UNKNOWN: absent from stale index |
| action precondition | `executeUnderActionPrecondition`, `src/runner/coordination/action-precondition.mjs` | UNKNOWN: absent from stale index |
| shared facts | `evaluateLegalityFacts`, `evaluateClosePrerequisites`, `src/runner/coordination/legality-facts.mjs` | UNKNOWN: absent from stale index |
| kernel visibility | `deriveVisibilityWindowState`, `src/runner/coordination/session-engine.mjs` | refresh required |
| kernel quorum/close | `evaluateSessionQuorum`, `closeSessionByQuorumLocked` | refresh required; locked close symbol absent from stale index |
| current write doors | `dispatchDeclaredOperation`, `authorizeDeclaredOperation`, `dispatchResearchFanOut`, `linkSessionContribution`, `recordConsultDisposition` | refresh required; composers must not call these directly |
| CLI registry/dispatch | `COMMAND_REGISTRY`; coordination branch in `bin/fgos.mjs` | file-level integration; refresh before edits |

Any HIGH or CRITICAL refreshed result must be reported before editing.

## Implementation units

Each unit is independently executable and has exactly one canonical capability.

### Unit 2G0 — Close the implementation gate

- unit: repair and prove G1–G6 without adding semantic commands
  capability: code:refactor
- dependencies: Units 0D–1B current source
- output: one authoritative legality boundary, settled action vocabulary,
  mandatory driver identity, and a lock-aware existing-use-case seam with no
  post-mutation sidecar gap
- stop if: closure requires a new event/store, changes a locked law, or changes
  legacy replay semantics
- verify: focused projector/kernel parity, identity, failure-injection, and
  two-process tests; refreshed GitNexus impact

### Unit 2A — Composer core

- unit: implement pure descriptor-to-existing-request composers and canonical ids
  capability: code:implement
- dependencies: 2G0
- output: no I/O module producing validated raw request/close request objects
- stop if: any composer needs a direct store/session-engine mutation call
- verify: table/property tests for derived/forbidden fields and deterministic ids

### Unit 2B — Start and status

- unit: add the non-action `start` composer and read-only `status` use case
  capability: code:implement
- dependencies: 2A
- output: additive public use cases with standard envelopes
- stop if: start becomes a preset router or status changes show/chain output
- verify: start retry/conflict; compact/detail status; schemas 1/2/3; no effects

### Unit 2C — Action-backed semantic use cases

- unit: add operation, authorize-and-dispatch, fan-out, contribution,
  human-turn, disposition, and close composers over the lock-aware use cases
  capability: code:implement
- dependencies: 2A, G1 availability for each verb
- output: only safely backed verbs; a blocked verb stays unavailable
- stop if: atomicity requires releasing the session lock before mutation
- verify: per-command positive/refusal/idempotency cases

### Unit 2D — CLI registration and compatibility

- unit: wire available semantic commands into registry/help/CLI without
  changing raw doors
  capability: code:implement
- dependencies: 2B, 2C
- output: command registry, CLI dispatch, envelopes, diagnostics, changelog
- stop if: setup/doctor dependency appears without registration design
- verify: registry/help parity, access classification, raw run/close compatibility

### Unit 2E — Concurrency and replay proof

- unit: add focused negative, crash, two-process, replay, and mutation tests
  capability: code:test
- dependencies: 2D
- output: schema 1/2/3 fixtures plus real two-writer proof for every mutation family
- stop if: a passing test relies on arbitrary callbacks instead of production doors
- verify: focused suites, measurement harness before/after, full `npm test`

### Unit 2F — Independent contract review

- unit: review Phase 2 against authority, atomicity, replay, explicit close,
  mutation rule, and compatibility gates
  capability: code:review
- dependencies: 2E
- output: finding matrix and approval/refusal; no implementation mutation
- stop if: any HIGH/CRITICAL finding remains open
- verify: source evidence, refreshed impact/detect-changes, adversarial probes

## Verification commands

```sh
node --test \
  test/cli/coordination.test.mjs \
  test/runner/coordination-actions-v1.test.mjs \
  test/runner/coordination-stale-action-proof.test.mjs \
  test/runner/coordination-legality-facts.test.mjs \
  test/runner/coordination-baseline-measurement.test.mjs

node scripts/measure-coordination-baseline.mjs \
  --output plans/260919-coordination-skill-harness-simplification/reports/phase-02-post-implementation-measurement.json

npm test
```

Before each source-edit unit, refresh GitNexus and run upstream impact for its
exact existing symbols. Before closeout, run `detect_changes` against `main`.

## Definition of Done

- All implementation gates are closed with current-source evidence.
- Every shipped semantic mutation consumes a current action and preserves the
  action's target/input boundary atomically through the existing use case.
- Driver identity is mandatory and kernel-rechecked.
- Same-id retry/conflict behavior survives process crash without a new ledger.
- Raw run/close, show, chain, recover, and legacy replay remain compatible.
- Four-condition mutation rule remains kernel-owned and proven.
- Status is deterministic, versioned, compact by default, and effect-free.
- Focused, concurrency, replay, measurement, and full test suites pass.
- User-visible commands are documented and recorded in `CHANGELOG.md`.

## Non-goals

- Prompt templates or template registry (Phase 3).
- A `reveal` write action.
- Specialist, aggregation, cancellation, retry, or recovery redesign.
- A new policy engine, event kind, store, idempotency ledger, scheduler, daemon,
  or track state.
- Natural-language preset selection.
- Worktree allocation, merge, or test policy in the shared control layer.
- Rewriting historical verification or migrating legacy session logs.
