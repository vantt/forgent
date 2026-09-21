# Independent recheck — Units 0D, 1A, 1B (round 2)

Date: 2026-09-21  
Scope: repair proposed by `units-0d-1b-recheck-discharge.md`  
Final verdict: **REQUEST CHANGES**

Current source and executable proof are authoritative. This report supersedes
the prior independent recheck at this path; it does not modify the implementer
discharge report.

## 1. Current HEAD, dirty state, and fingerprint

- Branch: `main`
- HEAD: `3d65657fb8c7b8eb5e377fa9cadbb7053390de0e`
- `origin/main`: `7853e4d7`; local HEAD includes unrelated dispatch-hardening commits.
- Staged paths: none.
- Tracked dirty: 29 paths, 1107 insertions, 1038 deletions at review start.
- Repair is distinguishable: legality/projector/precondition modules, coordination
  engine/store/verbs/tests, and this plan tree. Debug scripts, instruction
  projections, dispatch plans, and `.fgos` artifacts are unrelated dirt.
- Start porcelain SHA-256: `e57b6bd114be4ab76688b8b9e6f491ea097db0c0bc323fccc25dadf898e253da`.
- Start tracked-diff SHA-256: `3dcd17518fc791667066548d2a8d886105852b26fe4dfa2e8b3181de2a2b8f94`.
- `.fgos/main-checkout.lock` exists with session token
  `51f1216a-94bd-4207-b36b-d5a339eb7945`, timestamp 2026-09-21 00:10.
  No repair/test writer or open write fd was observed. Repair mtimes stopped at
  09:48 and the source fingerprints remained stable through the test runs.

The checkout is dirty but classifiable and stable, so this review is not BLOCKED.

## 2. Files reviewed

Required doctrine/contracts/plans were reread from the original charter,
including `AGENTS.md`, the reading map, coordination README/spec/vision,
coordination-session and flow-definition contracts, the track plan, Phase 00,
Phase 02, readiness audit, prior unit reports, the prior independent recheck,
and `units-0d-1b-recheck-discharge.md`.

Source authority reviewed:

- `src/runner/coordination/legality-facts.mjs`
- `src/runner/coordination/actions-projector.mjs`
- `src/runner/coordination/action-precondition.mjs`
- `src/runner/coordination/session-engine.mjs`
- `src/runner/coordination/store.mjs`
- `src/verbs/coordination/{actions,run,close,schema,show}.mjs`
- coordination CLI registry/entry point
- focused, repair-adjacent, concurrency, replay, close, and compatibility tests

## 3. GitNexus impact and freshness

`gitnexus status` reports the index **stale**: indexed commit `7853e4d`, current
commit `3d65657`. Impact is therefore partial and is not claimed current.

`detect-changes --scope compare --base-ref main` reports 29 files, 71 symbols,
6 affected processes, overall risk **HIGH**.

| Symbol | Result | Production reach |
|---|---|---|
| `evaluateLegalityFacts` | LOW/0 | index misses import edge; text confirms projector caller |
| `evaluateClosePrerequisites` | LOW/0 | same partial-index limitation |
| `projectCoordinationActions` | **HIGH**, 3 impacted | actions view, stale precondition, close flow |
| `showCoordinationActionsUseCase` | LOW, 1 | actions adapter |
| `executeUnderActionPrecondition` | LOW/0 | false-clean; text confirms close caller |
| `runCoordinationUseCase` | LOW, 10 | group-thinking, master-loop, headless adapters |
| `closeCoordinationUseCase` | LOW/0 | dynamic CLI reach missed |
| `validateCoordinationRequest` | **HIGH**, 15 | run door, setup checks, launchers |
| `validateCoordinationCloseRequest` | LOW/0 | close caller missed |
| `closeSessionByQuorumLocked` | LOW, 6 | close and run flows |

No CRITICAL graph result was returned. HIGH results affect action projection
and every raw coordination request consumer. Empty results are not treated as
unused because the index is stale and text search contradicts them.

## 4. Unit verdicts

| Unit | Verdict | Summary |
|---|---|---|
| 0D shared legality facts | **passed** | Kernel-local functions are thin disk adapters over shared pure classifiers; parity tests call real fixtures. |
| 1A `coordination-actions.v1` | **repairing** | Human-turn and contribution improved, but dispatch/authorize/fan-out/close descriptors and loud-failure behavior remain wrong. |
| 1B stale-action proof | **blocked** | Only keyed close is integrated at a production use-case door; callback tests are not production atomicity or recovery proof. |

## 5. Finding matrix

### R2-01

ID: R2-01  
Severity: **CRITICAL**  
Category: stale-action atomicity / production authority  
Affected unit: 1B  
Affected contract: every action-backed production mutation must reload,
reproject, validate, and mutate under one existing session lock.  
Source evidence: codebase-wide search finds
`executeUnderActionPrecondition` imported/called only by
`src/verbs/coordination/close.mjs`. `runCoordinationUseCase` does not consume
action keys. Operation, authorize, fan-out, contribution, human-turn, and
disposition still mutate through independently locking paths.  
Test evidence: the two-OS-process test calls the seam with a callback that
appends `actor-bound`. The test titled “production mutator integration:
dispatch-operation” creates assignment files and appends JSON directly. The
human-turn test calls `recordHumanTurnLocked` directly. Only close uses a real
public production use case.  
Why current proof is insufficient: callbacks and direct locked helpers do not
prove a production command cannot validate outside the lock or reacquire the
non-reentrant lock. The required shared seam is absent from five write families.  
Required fix: add one production semantic action door, or lock-aware paths in
the existing run use case, for every projected mutation, using existing
`*Locked` kernel mutators inside the seam. Exercise those actual doors in the
two-process, throw-release, and stale-before-mutation tests.  
Blocks Phase 2 implementation: **yes**

### R2-02

ID: R2-02  
Severity: **CRITICAL**  
Category: durable idempotency / crash recovery  
Affected unit: 1B  
Affected contract: mutation committed then process dies before response must
recover for every family without a second truth store.  
Source evidence: `action-precondition.mjs` still accepts an arbitrary
`mutationFn` and reconstructs payloads heuristically. Dispatch reconstruction
records only `objective`; disposition omits `evidenceRefs`; contribution omits
anchors/responds-to/assignment binding; fan-out compares only actor/objective.
No production run door uses this recovery code.  
Test evidence: non-close retries are produced by hand-written callback events;
there is no kill/crash after an actual operation, authorize, fan-out,
contribution, human-turn, or disposition use case commits.  
Why current proof is insufficient: same action key with a different omitted
optional field can be returned as already applied, and a production crash path
has not been demonstrated. Absence of `.action-keys.json` closes the second
store issue but not durable recovery.  
Required fix: reconstruct and compare the complete normalized payload from
authoritative Assignment/Run/RunResult/events for every family, then prove
process-death recovery through each production door with no duplicate effect.  
Blocks Phase 2 implementation: **yes**

### R2-03

ID: R2-03  
Severity: **HIGH**  
Category: action descriptor / request-schema mismatch  
Affected unit: 1A  
Affected contract: descriptors must compose current raw requests without
inventing inputs.  
Source evidence: both dispatch descriptors declare `objective` required and
`expectedOutputs` optional, while `validateOperationStep` requires non-empty
`expectedOutputs`. `authorize-and-dispatch` requires only
`authorizedBy, objective`; the raw authorize step forbids `authorizedBy` and
requires `authorizationId`, `invocationKey`, and `reason`. Close advertises
`dissentingActorIds` and `aggregationId`, while
`validateCoordinationCloseRequest` normalizes neither field.  
Test evidence: tests validate hand-built requests that supply fields outside
the descriptor; they do not compose each action from descriptor target plus
declared inputs and then execute it through the kernel.  
Why current proof is insufficient: Phase 2 composer output can fail the raw
validator before reaching the kernel, or silently drop advertised close data.  
Required fix: align each descriptor exactly with the current request surface,
including compound authorize+dispatch semantics, and add descriptor-driven
validation plus kernel-acceptance fixtures.  
Blocks Phase 2 implementation: **yes**

### R2-04

ID: R2-04  
Severity: **HIGH**  
Category: fan-out target authority  
Affected unit: 1A  
Affected contract: no caller topology expansion; exact operation/actor cohort.  
Source evidence: the projector derives `allowedActorIds` by filtering the
entire `spec.actors` roster for sibling topology edges, not by the selected
operation's graph bindings or cohort planner allocations.
`dispatchResearchFanOut` later requires an allocation for every branch and
dispatches the same `operationId` to each branch actor.  
Test evidence: the fixture permits `worker-fan-2` and `worker-contrib` for
`op-fan` even though only `worker-fan-1` is bound to `op-fan`; it proves only
shape validation, not kernel acceptance.  
Why current proof is insufficient: the descriptor authorizes actors bound to
other operations and can direct a composer into kernel refusal/topology
expansion.  
Required fix: derive the exact legal branch actor set from current kernel
cohort/allocation and operation bindings. If it is not safely derivable, do not
emit fan-out. Prove the composed request through the production fan-out door.  
Blocks Phase 2 implementation: **yes**

### R2-05

ID: R2-05  
Severity: **HIGH**  
Category: close parity  
Affected unit: 0D / 1A  
Affected contract: action `readyToClose` must agree with the real close kernel.  
Source evidence: `evaluateClosePrerequisites` blocks whenever a definition
declares aggregation and no/latest non-consensus aggregation exists. The real
`closeSessionByQuorumLocked` checks aggregation only when the caller supplies
`aggregationId`; omitting it preserves the legacy quorum close path. The close
descriptor lists aggregation as optional.  
Test evidence: no side-by-side test invokes projection and the close kernel for
aggregation absent, non-consensus omitted, and non-consensus explicitly named.  
Why current proof is insufficient: the action view can block a close the
kernel accepts, violating bidirectional close parity.  
Required fix: choose and document one current contract, then make projector and
kernel use the same rule and assert both directions against the real close
door. Preserve explicit caller close.  
Blocks Phase 2 implementation: **yes**

### R2-06

ID: R2-06  
Severity: **HIGH**  
Category: driver identity  
Affected unit: 1B  
Affected contract: one writer identity channel matching
`manifest.provenanceRoot.writerId`.  
Source evidence: `resolveDriverIdentity` accepts `inputPayload.authorizedBy`,
`precondition.authorizedBy`, `inputPayload.writerId`, or
`precondition.writerId`. Raw run schema says top-level `writerId` is the single
channel and rejects step-level `authorizedBy`.  
Test evidence: seam tests alternate between precondition `writerId` and payload
`authorizedBy`; no negative test rejects the second channel.  
Why current proof is insufficient: matching multiple channels is still a
second identity surface even when mismatch is rejected.  
Required fix: select the existing request contract's single channel per public
door, derive it once, and reject every alternate channel. Test absent, foreign,
and duplicate-channel cases through production doors.  
Blocks Phase 2 implementation: **yes**

### R2-07

ID: R2-07  
Severity: **HIGH**  
Category: fail-loud determinism  
Affected unit: 1A / 1B  
Affected contract: corrupt or unsupported state must fail loudly.  
Source evidence: both `showCoordinationActionsUseCase` and
`executeUnderActionPrecondition` catch every per-window
`deriveVisibilityWindowState` exception and silently replace it with
`open:false`; the precondition also swallows quorum/phase errors.  
Test evidence: no corruption test asserts projection/precondition rejection
instead of a closed window or degraded facts.  
Why current proof is insufficient: corruption becomes a plausible legal
projection instead of a diagnosed failure, so callers cannot distinguish
“closed” from “could not evaluate.”  
Required fix: propagate categorized corruption/unsupported/definition errors;
only degrade errors explicitly declared safe by contract. Add
mutation-sensitive negative tests.  
Blocks Phase 2 implementation: **yes**

### Non-blocking observations

- 0D materially improved: session-engine classifiers are thin filesystem
  adapters over the pure shared functions, not independent algorithms.
- Human-turn descriptor now matches the raw human-turn schema.
- Contribution allowed values are intersected with the closed request enum.
- `.action-keys.json` is absent; no new ledger/store/event log was introduced.
- Raw run, public close, recover CAS, schemas 1/2/3, explicit close, and
  non-self-closing dispositions remain green in focused/adjacent tests.
- The previous fan-out timing failure is green after the test threshold change.

## 6. Tests run and exact results

Required focused command: **131 pass, 0 fail, 0 skipped**, duration
`16976.637324ms`.

Repair-adjacent command covering driver authorization, visibility fixture,
recheck discharge, aggregation, legacy schemas, quorum/recovery, and recover:
**206 pass, 0 fail, 0 skipped**, duration `41632.544301ms`.

Full `npm test`: **7151 pass, 0 fail, 9 skipped**, 27 suites / 7160 tests,
duration `460285.35877ms`.

`git diff --check`: run after report write; result recorded at handoff.

## 7. Evidence quality

Green suite quality is strong for legacy replay, explicit close, shared
legality fixtures, and close atomicity. It is weak for the approval-critical
non-close seam: test names claim production integration while their bodies use
callbacks, direct file appends, or locked helpers. There is no real
two-process race or crash-after-commit through production operation,
authorization, fan-out, contribution, disposition, or human-turn use cases.

The implementer discharge report's “all findings discharged” conclusion is
not supported by current source/test topology.

## 8. Phase 2 design ready

**yes.** The Phase 2 design already states the required one-source legality,
descriptor, authority, lock, retry, replay, and explicit-close gates.

## 9. Phase 2 implementation ready

**no.** Open CRITICAL/HIGH findings remain.

## 10. Exact remaining gate

Close R2-01 through R2-07, refresh GitNexus against the final working tree,
then rerun focused, repair-specific, and full suites from one stable
fingerprint. Approval requires production-door two-process and crash recovery
proof for every write family, not callback substitutes.

## 11. Recommended next action

Do not begin Phase 2 composers. First wire all semantic action writes into one
lock-aware production seam, make the descriptor vocabulary exactly compose the
current request schemas and kernel targets, reconcile aggregation close parity,
and collapse driver identity to one channel. Then add the missing production
concurrency/crash tests and request another independent recheck.

## 12. Final verdict

**REQUEST CHANGES**

Unit 0D is acceptable. Units 1A and 1B still contain contract, authority,
atomicity, durable-retry, and close-parity blockers. A green suite does not
override those source-level gaps.
