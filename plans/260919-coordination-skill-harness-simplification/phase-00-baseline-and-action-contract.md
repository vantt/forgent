# Phase 0 — Baseline, Drift Reconciliation, and `coordination-actions.v1`

Status: design complete; implementation and measurements not started
Date: 2026-09-19
Parent plan: `plans/260919-coordination-skill-harness-simplification/plan.md`
Architecture assessment:
`plans/reports/coordination-skill-harness-architecture-audit-260919-report.md`

## Purpose

This document is the implementation handoff for Phase 0 and the smallest
contract proposal needed to start Phase 1. It deliberately separates:

- facts proved against the current checkout;
- measurements an implementation agent must still reproduce;
- the read-only action projection contract;
- later write/composer work that is explicitly out of scope.

No coordination panel, plan-loop cell, or source edit is needed to execute
this phase. The work is sequential because every later unit depends on a
settled baseline and contract.

## Locked decisions

1. `CoordinationSession` and the immutable `FlowDefinition` snapshot remain
   the sole authority for legality, evidence, visibility, quorum, and close.
2. `coordination-actions.v1` is a read model. It describes legal choices but
   does not select, authorize, disposition, dispatch, or close anything.
3. The action projector must call or consume shared pure kernel evaluators.
   It may not duplicate graph traversal or encode protocol-specific operation
   names.
4. Semantic write commands come later and must compile one selected action
   into the existing validated `runCoordinationUseCase` or
   `closeCoordinationUseCase` boundary.
5. There is no state-changing `reveal` action. Visibility is derived state.
6. Plan-loop remains a coding-track facade, not the common core.
7. The current dirty checkout is evidence to reconcile, not content this
   track is authorized to discard or overwrite.

## Current-checkout evidence

Evidence was read from commit `81437fff` with an already-dirty working tree.
The audit did not modify source, skill, protocol, config, or tests.

### Repository drift since the architecture handoff

The handoff report says it created only two untracked documents. The current
checkout instead contains 13 tracked modified files with 445 insertions and
69 deletions, plus multiple untracked debug scripts/logs. The material tracked
changes include:

- `src/runner/coordination/session-engine.mjs`;
- `test/runner/coordination-recheck-discharge.test.mjs`;
- three projections of `fgos-plan-loop/SKILL.md`;
- both current/legacy coordination-session contracts;
- Agent Coordination portal/spec material, config, changelog, and root
  instructions.

The session-engine diff adds schema-3 causal remediation requirements for an
accepted finding: failed assignment -> successful work-product remediation ->
clean recheck. Those changes overlap this plan's action/status domain and must
be preserved and understood before any projector is written.

Gate: the first implementation agent must record the owner/purpose/status of
every dirty path and must not clean, stage, amend, or revert any of them.

### Public coordination surface

Current registered coordination subcommands are:

| Command | Current behavior | Phase 0 classification |
|---|---|---|
| `coordination run --file` | Validates a raw request and calls the existing engine doors synchronously. | Current compatibility/power-user door. |
| `coordination close --file` | Calls `closeCoordinationUseCase`; close is explicit and driver-authorized. | Current normal close authority. |
| `coordination show <id>` | Read-only replay/status projection. | Current descriptive view; input to the new projection. |
| `coordination chain <track>` | Read-only aggregation over `show`; `nextAction` is prose. | Current track convenience, not an action contract. |
| `coordination launch-master-loop` | Composes only the fixture's required first pass. | Existing specialized facade; not common core. |
| `coordination recover` | Session recovery surface with its own CAS-bound recommendation. | Existing precedent for stale-action protection; not merged into action projection. |

The command registry already includes `close` in the coordination subcommand
enum. Two CLI diagnostic strings in `bin/fgos.mjs` still list the known set
without `close`: the missing-subcommand message and the unknown-subcommand
message. This is current user-facing drift.

### Explicit-close truth

`runCoordinationUseCase` computes:

```text
explicitCloseRequested = request.close === true
  OR request.steps contains a step with type "close"
```

It calls `closeSessionByQuorum` only when that expression is true. A normal
`run` without either shape leaves the session active even if required work has
settled. `closeCoordinationUseCase` is a separate public use case and CLI door.

Therefore these are stale current-runtime claims and must be corrected:

- `fgos-plan-loop` says every `run` automatically attempts close;
- `fgos-plan-loop` says there is no separate close door;
- its close example uses only a `disposition` step, which cannot close the
  session under current `run.mjs` behavior.

Historical verification documents that accurately describe behavior at their
recorded commit must not be rewritten merely because current behavior changed.
They should be classified as historical evidence, not current guidance.

### Existing replay corpus

The local `.fgos/coordination/sessions` corpus currently contains 591 readable
session manifests:

| Schema | Count |
|---|---:|
| `1` | 581 |
| `3` | 10 |

No schema-2 manifest is present in this checkout's local corpus. Tests and
fixtures must therefore cover schema 2 even though corpus comparison cannot.
The corpus is local evidence, not a portable repository fixture; the final
measurement command must accept an explicit corpus path and report absence
without silently passing.

### Instruction-size baseline

Current canonical runtime instruction sizes:

| Skill | Lines | Words |
|---|---:|---:|
| `core/skills/fgos-plan-loop/SKILL.md` | 752 | 5,122 |
| `core/skills/fgos-architecture-panel/SKILL.md` | 970 | 9,006 |
| `domains/coding/skills/fgos-code-panel/SKILL.md` | 914 | 7,049 |

These counts are reproducible denominators, not success by themselves.

## Drift matrix

| Claim/surface | Current source truth | Required Phase 0 action |
|---|---|---|
| Run closes automatically | False unless `close: true` or a `close` step is present. | Correct current runtime skills/contracts/how-to text only. |
| No separate close door | False; registry, CLI, and `closeCoordinationUseCase` exist. | Correct skill text and CLI diagnostics. |
| A `cell-closed` disposition closes | False; it records audit state only. | Replace with explicit close request/command guidance. |
| `chain.nextAction` is machine-actionable | False; it is prose assembled from `show`. | Preserve for compatibility; add typed projection separately. |
| `show` is the single legal-action derivation | False; it renders status and mirrors some private rules. | Move reusable pure derivations below both `show` and action view where necessary. |
| `reveal` should be a write verb | False under current FlowDefinition semantics. | Expose visibility as fact/blocker only. |
| Legacy replay is covered by local corpus alone | False; local corpus lacks schema 2. | Combine corpus snapshots with schema-specific fixtures. |

## Baseline measurement design

Add one repository script that produces a versioned JSON report plus a human
readable Markdown summary. The script must be deterministic for the same
checkout and input corpus; timestamps belong in envelope metadata and are
excluded from semantic comparison.

### Required inputs

- repository root;
- optional session-corpus root;
- fixed scenario manifest naming fixtures/commands;
- exact commit and dirty-state fingerprint;
- Node/npm versions and lockfile hash;
- canonical skill paths.

### Required outputs

```json
{
  "contractVersion": "coordination-baseline.v1",
  "source": {
    "commit": "...",
    "dirtyFingerprint": "sha256:...",
    "node": "...",
    "lockfileDigest": "sha256:..."
  },
  "skills": [
    {"path": "...", "bytes": 0, "words": 0, "lines": 0}
  ],
  "scenarios": [
    {
      "id": "...",
      "promptBytes": 0,
      "inputTokens": null,
      "outputTokens": null,
      "dispatchCount": 0,
      "sequentialWaves": 0,
      "durationMs": 0,
      "retryCount": 0,
      "evidenceOutcome": "verified|failed|no-evidence|unavailable"
    }
  ],
  "replay": {
    "corpusPresent": true,
    "sessionCount": 0,
    "bySchema": {},
    "semanticDigest": "sha256:...",
    "failures": []
  }
}
```

Token fields are `null`, never estimated, when a provider does not report
them. Prompt bytes remain mandatory. Secret-bearing prompt content must not be
written to the report; only byte counts and digests are retained.

### Scenario set

1. clean plan-loop-shaped session;
2. accepted finding -> remediation -> clean recheck;
3. clear architecture advisory;
4. architecture human turn and bounded reopen;
5. one each of RFC, NGT, and Delphi;
6. explicit close success and close refusal;
7. stale semantic action attempt (after Phase 1 exists).

Phase 0 may use deterministic fixtures instead of live provider calls for
control-flow counts. Provider latency/token baselines must be labelled
`unavailable` until a real run is deliberately authorized; do not fake them
from fixture duration.

## Legacy replay comparison

The comparison harness must never mutate the input corpus.

For each readable session:

1. copy it into an isolated temporary `.fgos` root, or enforce a read-only
   corpus mode;
2. replay and render normalized current state;
3. remove nondeterministic fields only through a checked-in allowlist;
4. hash canonical JSON with stable key ordering;
5. record schema, status, phase, quorum, assignment refs, authorizations,
   dispositions, contributions, human turns, and definition snapshot identity;
6. fail loudly on corruption or unsupported schema instead of omitting the
   session.

The before/after comparison is semantic, not raw-byte equality of implementation
objects. A checked-in fixture manifest pins expected digests for portable
fixtures. The local 591-session corpus may supplement that proof but cannot be
the only CI gate.

## Proposed contract: `coordination-actions.v1`

### Contract shape

```json
{
  "contractVersion": "coordination-actions.v1",
  "coordinationId": "coord_abc",
  "session": {
    "schemaVersion": "3",
    "status": "active",
    "phase": "phase-revision",
    "eventSeq": 17,
    "definitionRef": {"id": "...", "version": "..."},
    "definitionDigest": "sha256:..."
  },
  "snapshot": {
    "digest": "sha256:...",
    "actionSetDigest": "sha256:..."
  },
  "readyToClose": false,
  "blockers": [
    {
      "kind": "failed-gating-result-awaiting-disposition",
      "blocking": true,
      "targetRef": "asgn_...",
      "operationId": "review-candidate",
      "actorId": "reviewer"
    }
  ],
  "facts": {
    "visibilityWindows": [],
    "pendingDriverAuthorizations": [],
    "quorum": {}
  },
  "actions": [
    {
      "kind": "record-disposition",
      "actionKey": "sha256:...",
      "required": true,
      "target": {
        "targetRef": "asgn_...",
        "operationId": "review-candidate",
        "actorId": "reviewer"
      },
      "requiredInputs": ["disposition", "rationale"],
      "optionalInputs": ["evidenceRefs"],
      "allowedValues": {
        "disposition": ["accepted"]
      }
    }
  ]
}
```

### Field rules

- `contractVersion` versions the projection independently of session schema.
- `eventSeq` is the exact count/sequence position used to compute the view.
- `definitionDigest` comes from the immutable schema-3 snapshot when present;
  legacy sessions use the definition identity/digest already accepted by their
  compatibility path and must say how it was resolved.
- `snapshot.digest` hashes the normalized replay inputs that affect legality.
- `actionSetDigest` hashes ordered action descriptors before `actionKey` is
  added.
- `actionKey` hashes contract version, coordination id, event sequence,
  definition digest, action kind, exact target, and required/allowed input
  schema. It does not hash user-supplied judgment values not yet provided.
- `required` means the session cannot reach a legitimate close without some
  action in that blocker/action family. It does not mean the projector chooses
  which disposition or optional branch the driver should take.
- `blockers` explain why close or phase progress is unavailable. They must be
  typed; prose may be additive but is never the discriminant.
- `allowedValues` is emitted only when the immutable protocol/schema actually
  declares a closed vocabulary. Current free-form disposition fields stay
  free-form; `rechecks.dischargeOn` may narrow which values can discharge a
  particular failed gate but must not be misrepresented as a global
  disposition enum.
- `facts.visibilityWindows` reports derived visibility. No corresponding
  state-changing action kind exists.

### Initial action vocabulary

Only expose actions backed by current kernel/public use-case behavior:

| Action kind | Meaning | Judgment boundary |
|---|---|---|
| `dispatch-operation` | Dispatch a required or already-authorized operation. | Projector identifies the binding; driver supplies objective/context allowed by contract. |
| `authorize-and-dispatch` | Authorize one driver-authorized binding and dispatch it. | Projector never decides whether optional work should happen. |
| `fan-out` | Dispatch a declared fan-out binding. | Branch objectives/inputs remain caller choices within declared bounds. |
| `link-contribution` | Persist a validated contribution link. | Projector does not author the contribution. |
| `record-human-turn` | Record a person-attributed turn where protocol permits it. | Projector does not infer human intent or attribution. |
| `record-disposition` | Record a driver judgment against an owned ref. | Projector exposes any protocol-declared constraints; driver chooses and justifies. |
| `close` | Attempt explicit close when kernel prerequisites are satisfied. | Projector may say ready; only explicit driver action closes. |

`start` is intentionally not in a session action view because no session
exists yet. It belongs to the later semantic composer surface. Recovery keeps
its existing recommendation/apply contract until a separate design proves a
safe unification.

### Projector algorithm

The projector is a pure function over a fully loaded, validated input bundle:

```text
manifest + replayed events + immutable definition snapshot
  -> shared kernel facts/evaluators
  -> typed blockers
  -> legal action descriptors
  -> stable digests/action keys
```

I/O belongs in a use-case adapter that loads the manifest, events, and
definition once. The pure projector receives no filesystem paths and performs
no writes. `show` and `chain` consume this projection or the same lower pure
fact layer; neither may maintain a second interpretation.

### Non-policy proof obligations

The design is acceptable only if all hold:

1. Every projected write action can be translated to a current validated
   request/use-case call without inventing an engine operation.
2. For generated fixture states, executing each projected action is not
   refused for target/binding illegality when the action key is current.
3. Actions absent from the projection are refused by the kernel or are
   intentionally judgment-only choices documented as such.
4. No projector branch contains protocol ids or operation names such as
   `review-candidate`, `specialist`, or `revise-candidate`.
5. Visibility, quorum, recheck, disposition eligibility, and close readiness
   come from shared evaluators or the immutable definition, not copied rules.
6. A concurrent appended event invalidates the prior action key before any
   write reaches mutation.
7. Legacy schema behavior is unchanged; the view may describe it but does not
   reinterpret it as schema 3.

If obligation 3 cannot be stated precisely without domain judgment, expose a
typed fact/blocker and omit the proposed action. Do not move judgment into the
projector to make the API look complete.

## Implementation units

These are sequential handoff units, not coordination cells.

### Unit 0A — Reconcile repository baseline

- unit: classify and fingerprint the dirty checkout without modifying it
- capability: `code:review`
- files: `git status`, all current tracked diffs, untracked artifact inventory
- output: checked-in Phase 0 baseline report section naming ownership/status
  of every path and a reproducible dirty fingerprint
- verify: a second run produces the same fingerprint when the tree is
  unchanged
- stop if: any dirty file's ownership cannot be established or another
  process is still modifying the checkout

### Unit 0B — Correct explicit-close drift

- unit: align current runtime guidance and CLI diagnostics with explicit close
- capability: `code:implement`
- likely files: `bin/fgos.mjs`, canonical runtime skills, current contracts,
  focused CLI/static drift tests, `CHANGELOG.md`
- invariants: no historical verification rewrite; raw `run --file`
  compatibility unchanged; only explicit close closes
- verify: focused CLI tests prove `run` without close remains active, both
  explicit close shapes work, help/error known-subcommand lists include close
- stop if: source behavior differs from the explicit-close evidence above

### Unit 0C — Add reproducible baseline/replay measurement

- unit: implement the deterministic measurement and replay comparison harness
- capability: `code:implement`
- likely files: a new `scripts/` module, portable fixture manifest, focused
  script tests, generated report under this plan's `reports/`
- invariants: corpus is read-only; absence is explicit; token fields are not
  estimated; normalization allowlist is version-controlled
- verify: run twice against the same fixtures and compare semantic output;
  mutation test changes one replay-relevant field and changes/fails digest
- stop if: the harness needs to write into the source corpus

### Unit 0D — Extract shared pure legality facts

- unit: expose the minimum pure evaluator boundary needed by both status and
  action projection
- capability: `code:refactor`
- likely symbols: current replay/quorum/phase/visibility/authorization
  evaluators plus private mirrors in `show.mjs`
- invariants: no behavior change; no filesystem I/O in new pure functions;
  no second definition loader
- verify: existing `show`, `chain`, quorum, visibility, recheck, specialist,
  and human-turn tests remain byte/semantic equivalent
- stop if: extraction requires changing a locked law or session event schema

### Unit 1A — Implement read-only action projection

- unit: implement `coordination-actions.v1` as a pure projector and read-only
  use case
- capability: `code:implement`
- likely files: new coordination action-view module, a thin status use case,
  schema/contract tests; exact names require impact analysis
- invariants: no writes, no dispatch, no protocol-specific ids, stable output,
  explicit legacy behavior
- verify: table/property tests cover fresh, pending required, failed finding,
  disposition, remediation, recheck, visibility, specialist, human turn,
  ready-close, close-refused, corruption, and schema mismatch states
- stop if: an action cannot be derived without driver judgment

### Unit 1B — Add stale-action binding tests

- unit: prove action keys are single-snapshot preconditions
- capability: `code:test`
- invariants: no time-only entropy in keys; identical state produces identical
  key; any legality-relevant appended event invalidates it
- verify: concurrent-event and payload-conflict tests fail before mutation
- stop if: the write path cannot atomically compare the event sequence under
  the existing session lock; redesign before adding semantic verbs

## Required impact analysis before source edits

The repository requires upstream GitNexus impact analysis before editing any
function/class/method. GitNexus was not exposed to the audit session, so no
symbol impact result is claimed here. Each implementation agent must run it
for the exact symbols it will edit and warn before proceeding on HIGH or
CRITICAL risk.

Minimum expected targets:

- `runCoordinationUseCase`;
- `closeCoordinationUseCase`;
- `showCoordinationUseCase`;
- `chainCoordinationUseCase`;
- `evaluateSessionQuorum` and phase/visibility evaluators actually selected
  during extraction;
- CLI coordination dispatch and command-registry entry.

## Phase 0 exit gate

Phase 0 is complete only when:

- dirty checkout ownership is reconciled and fingerprinted;
- current guidance and CLI diagnostics agree with explicit close;
- a reproducible baseline/measurement report exists;
- portable legacy replay comparison passes for schemas 1, 2, and 3;
- the local corpus result is recorded separately when available;
- `coordination-actions.v1` has contract tests or executable fixtures proving
  the non-policy obligations above;
- no semantic write verb or prompt-template resolver has been implemented.

At that point the owner reviews the contract. Only after acceptance should an
implementation agent begin semantic composers.

Baseline Report: [Phase 00 Dirty Checkout Baseline](reports/phase-00-dirty-checkout-baseline.md)
