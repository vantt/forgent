# Phase 2 Readiness Audit

Date: 2026-09-20  
Scope: Units 0B–1B and readiness for semantic request composers  
Verdict: design ready; implementation blocked

## Repository state

- Branch: `main`
- HEAD: `7853e4d7d6881665fb57e2a5d730428ae4e96486`
- Upstream: `origin/main` at the same commit when audited.
- Worktree: dirty; no staged paths were reported by `git status --short`.
- Tracked diff: 27 modified paths, 997 insertions and 251 deletions.
- Untracked material includes the whole current track, Units 0C–1B source/tests,
  generated instruction/event artifacts, and numerous pre-existing debug scripts.
- Stable audit fingerprint during reassessment:
  - porcelain-v2/untracked listing: `7f43642717a0155a8c707e5c8be94c775f6075cf72dfed95ae010152e0800bb0`
  - tracked binary diff: `dd601ef00c396c09756edeb277c9e119c4c231457e6e7d7dd7ab042072086ee8`
- `.fgos/main-checkout.lock` remains present and names live PID `2052156`, but
  its timestamp is 14:59 and the last observed scope write was
  `src/verbs/coordination/close.mjs` at 16:06. The tree was unchanged through
  repeated hashes and had no scope write for at least 20 minutes before this
  audit continued. This is recorded as a stale live-PID lock, not a claim that
  the checkout is clean.
- Pre-existing unrelated material was preserved. No debug artifact was edited,
  deleted, staged, reset, or committed.

The earlier dirty-baseline report was taken at `81437fff`; it is historical,
not the current checkpoint. Current HEAD and dirty hashes above supersede it
for this audit.

## Unit status

| Unit | Intended outcome | Current implementation | Tests checked now | Open findings | Status |
|---|---|---|---|---|---|
| 0B | explicit-close alignment | `run` closes only for `close: true` or a `close` step; public `close --file`; disposition alone does not close; registry/diagnostics and three plan-loop projections align | Focused CLI and mirror tests pass | No contract blocker found. Historical verification was not rewritten. | **passed** |
| 0C | deterministic measurement/replay harness | Versioned harness, schema 1/2/3 fixtures, read-only corpus checks, loud corrupt/unsupported results, null provider tokens, semantic mutation tests | Current harness suite passes, including unsupported/corrupt and assignment/run-retried sensitivity | Local corpus remains supplemental; measured vs declared fixture counts are now distinguished. | **passed** |
| 0D | shared pure legality facts | Pure module exists and `show` consumes one extracted binding helper | Current purity/unit/chain tests pass | Visibility and close evaluators are simplified parallel derivations; parity with kernel is not established for cohort/provenance/recheck/aggregation edges. | **repairing** |
| 1A | `coordination-actions.v1` | Pure projector, read adapter, CLI `actions` door, stable keys; no hardcoded protocol ids | Current action suite passes | `fan-out` descriptor backing is absent; contribution timing/inputs do not match the existing request; human-turn scope contradicts closeout narration; some legality relies on simplified facts. | **repairing** |
| 1B | stale-action binding | Session-lock precondition seam; production close integration; two-process race and failure injection tests | Current stale-action suite passes | Authority is optional when identity is omitted; other production write doors are not integrated atomically; post-mutation `.action-keys.json` creates crash/durability gap and a new side store. | **blocked** |

Focused verification result during this audit: **122 tests passed, 0 failed**
across CLI coordination, chain, measurement, legality facts, action projection,
stale-action proof, architecture, and skill mirrors. Passing tests do not
override the contract findings above.

## Finding and blocker matrix

### F-01

- Severity: HIGH
- Category: kernel legality parity
- Affected unit: 0D/1A
- Affected contract: FlowDefinition visibility/quorum and explicit close
- Evidence: `evaluateVisibilityWindows` accepts a set of settled operation ids,
  while kernel `deriveVisibilityWindowState` evaluates bound actors,
  replacement lineage, reserved operation provenance, and on-disk results.
  `evaluateClosePrerequisites` separately reconstructs partial/quorum,
  required-operation, and aggregation rules.
- Current fix status: unverified/unfinished
- Verification still required: generated-state parity tests against the kernel,
  including multi-actor same-operation, same-actor multi-node, replacement,
  failed/recheck, aggregation, and partial-policy cases
- Blocks Phase 2 implementation: yes
- Blocks Phase 2 design: no

### F-02

- Severity: HIGH
- Category: action vocabulary/request-shape mismatch
- Affected unit: 1A
- Affected contract: `coordination-actions.v1`
- Evidence: `fan-out` projection depends on `opDef.fanOut`, which is not a
  current FlowDefinition operation field. `link-contribution` is emitted while
  a required operation is still undispatched and requests `turnId` rather than
  the existing required `contributionId`, `assignmentId`, and `roundKey` shape.
- Current fix status: open
- Verification still required: every action descriptor must compose and pass
  the current request validator, then be accepted/refused only by current
  kernel state rather than descriptor mismatch
- Blocks Phase 2 implementation: yes
- Blocks Phase 2 design: no

### F-03

- Severity: HIGH
- Category: driver authority
- Affected unit: 1B
- Affected contract: session writer/driver authority
- Evidence: `executeUnderActionPrecondition` rejects a mismatched identity only
  if `authorizedBy`/`writerId` is present. Several projected mutation actions
  require only objective/content fields, so omission is not rejected at this
  seam.
- Current fix status: open
- Verification still required: production-door tests proving absent, foreign,
  and second identity channels are refused for every mutation family
- Blocks Phase 2 implementation: yes
- Blocks Phase 2 design: no

### F-04

- Severity: CRITICAL
- Category: stale-action atomicity/TOCTOU
- Affected unit: 1B
- Affected contract: atomic action consumption
- Evidence: only `closeCoordinationUseCase` currently reaches a locked kernel
  variant. `runCoordinationUseCase` and its operation/authorize/fan-out/
  contribution/human-turn/disposition paths are not called through a shared
  lock-aware use case. Current `withEventsLock` is not reentrant, despite the
  closeout report claiming a recursion-depth fix.
- Current fix status: open
- Verification still required: real production-door, two-OS-process tests for
  every action family under one lock boundary; no arbitrary callback stand-in
- Blocks Phase 2 implementation: yes
- Blocks Phase 2 design: no

### F-05

- Severity: CRITICAL
- Category: idempotency durability
- Affected unit: 1B
- Affected contract: same-id retry/conflict and no-new-store constraint
- Evidence: `.action-keys.json` is written after the mutation callback. A crash
  or persistence failure can commit the authoritative mutation without its
  idempotency record. The special recovery branch reconstructs only a terminal
  close shape and does not prove all mutations. The sidecar is a new persisted
  truth surface outside the session event log.
- Current fix status: open
- Verification still required: remove the second truth source or prove
  authoritative-log reconstruction for every command, with crash injection
  after mutation and before response
- Blocks Phase 2 implementation: yes
- Blocks Phase 2 design: no

### F-06

- Severity: MEDIUM
- Category: report/source drift
- Affected unit: 1A
- Affected contract: human-turn availability
- Evidence: closeout F7 says human turns were scoped to explicit protocol
  declarations. Current projector and test named `F-02` intentionally expose
  `record-human-turn` for every active session. The current kernel treats the
  turn as session-level infrastructure.
- Current fix status: contract decision/documentation reconciliation required
- Verification still required: settle the public action contract to current
  kernel behavior or narrow kernel/projector together; update reports/tests
- Blocks Phase 2 implementation: yes, because public command availability changes
- Blocks Phase 2 design: no

### F-07

- Severity: MEDIUM
- Category: definition binding/replay compatibility
- Affected unit: 1A/1B
- Affected contract: action key definition digest
- Evidence: action projection uses the schema-3 snapshot digest when present,
  but falls back to definition metadata digest or a hash of `{id,version}`.
  The accepted kernel already discloses the systemic same-version content-drift
  exposure for legacy/current definition consumers.
- Current fix status: inherited limitation, not newly closed
- Verification still required: explicit schema 1/2/3 compatibility tests and
  no claim that an `{id,version}` hash is a content pin
- Blocks Phase 2 implementation: yes until key semantics are documented and
  tested; it does not require redesigning legacy schemas
- Blocks Phase 2 design: no

### F-08

- Severity: LOW
- Category: report/document precision
- Affected unit: 0B–1B
- Affected contract: closeout evidence
- Evidence: closeout claims all findings resolved, recursive locking fixed, and
  Phase 2 fully ready; current source contradicts those claims.
- Current fix status: superseded by this readiness audit
- Verification still required: none before design; update closeout status when
  implementation findings are repaired
- Blocks Phase 2 implementation: no independently; underlying findings do
- Blocks Phase 2 design: no

## Fixes verified versus unverified

Verified now:

- explicit close behavior and public close door;
- `cell-closed` disposition does not close;
- CLI registry/help includes `close` and `actions`;
- three plan-loop projections are byte-identical;
- deterministic measurement, read-only fixture handling, schema 1/2/3 fixture
  coverage, loud corrupt/unsupported behavior, and null token values;
- stable action keys for identical projected state;
- stale event/definition/target invalidation in the test seam;
- current two-process test yields one winner;
- production close invokes the precondition seam.

Unverified or disproved:

- one shared authoritative legality definition for show/chain/action/write;
- complete and request-valid action vocabulary;
- mandatory driver identity at the precondition seam;
- atomic integration for production writes other than close;
- generic crash-safe same-key idempotency;
- no second persisted truth source;
- closeout's claim that human-turn projection was protocol-scoped;
- closeout's claim that lock reentrancy was implemented in `src/state/events.mjs`.

## Impact analysis

GitNexus CLI was available, but the index is stale at `81437fff` while current
HEAD is `7853e4d7`. Results that exist remain useful warnings:

- `runCoordinationUseCase`: HIGH, 26 upstream symbols, 10 direct callers;
- `validateCoordinationRequest`: HIGH, 33 upstream symbols, 8 direct callers;
- `validateCoordinationCloseRequest`: LOW, one direct caller;
- `closeCoordinationUseCase`: LOW in the stale index.

New symbols `projectCoordinationActions`, `showCoordinationActionsUseCase`,
`executeUnderActionPrecondition`, and `closeSessionByQuorumLocked` were absent
from the stale index, so their risk is UNKNOWN. Phase 2 implementation must
refresh the index and report HIGH/CRITICAL blast radius before edits.

## Readiness verdict

- Phase 2 design ready: **yes**. The detailed design is complete and contains
  explicit per-command contracts, trust boundaries, compatibility rules,
  tests, units, capabilities, and stop conditions.
- Phase 2 implementation ready: **no**.
- Exact missing gate: close F-01 through F-07, refresh impact analysis, and
  rerun the focused gate suite. Zero open contract/authority/atomicity blocker
  is required; zero bugs is not.

## Recommended next action

Run only Unit `2G0` from the Phase 2 design: reconcile the action vocabulary
against existing request schemas, replace simplified legality with a single
kernel-authoritative fact boundary, require driver identity, and provide one
lock-aware production use-case seam without `.action-keys.json` as a second
truth store. Then perform independent `code:review` and rerun this readiness
audit before any semantic CLI implementation.
