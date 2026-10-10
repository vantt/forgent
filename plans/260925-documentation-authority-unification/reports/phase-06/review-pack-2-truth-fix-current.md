# Targeted truth-fix current evidence

Review mode: ordinary
Author session: codex-session:1@2026-10-10
Pack commit: e4ff8b44e733ffc85d446d97b6dba6d41d9b9417
Receipt commit: 007edbbe75e19a35eb79c90ec626ca352d1d0b76

Exact scope: 21 corrected sections, 19 pending retired-source successors, 14 pending corrected receipts and 25 unchanged ordinal witnesses. No seeds, mutations or new approval. Native unit digests and raw shown-text hashes are separate; verdict tables use native source/target digests, and receipts use all seven required fields.

## Current section: docs/platform/agent-coordination/architecture/dispatch-control-plane.md#routing-identities

Lines 75-110; shown SHA256 c7634d6197f50b6174b05b60d0164fac0837a06cce0efe17c6cd71abdf38c720. Ledger status verified. 

Code evidence: src/runner/dispatch/resolve.mjs:33-66; src/runner/dispatch/config.mjs:1007-1017; src/runner/dispatch/config.mjs:1223-1235; src/runner/dispatch/resolve.mjs:25-66; src/runner/dispatch/resolve.mjs:255-309. Evidence commit a4e132ccd01e2b20a0e6c874ec5b4d6fbb5781e2.

````text
## Routing Identities

The dispatch core recognizes exactly two target identities. No other name
resolves a Run target.

```txt
capability   — abstract behavior promise, bound only by
               runner.capabilities.<capability>.prefer;
               executor for[] declarations do not bind this selector
executor-id  — explicit concrete implementation override, naming a
               runner.executors.<id> entry directly
```

`purpose` is not a third identity. It is compatibility terminology for
capability. The `--for <purpose>` CLI flag and the `purpose`/`for` parameter
names threaded through `src/runner/dispatch/plan.mjs` and
`src/runner/dispatch/resolve.mjs` (`resolveExecutorAndOverrides`) name capability
values. `resolveExecutorIdForPurpose` is not a current exported resolver.
`compileDispatchPlan()`'s `selector.type: 'purpose'` is the compatibility
selector label. It does not create a third conceptual route identity.
The [earlier normalization plan](../../../history/dispatch-core-contract-normalization/plan.md)
is dated migration context, not an assertion that its remaining helpers ship.

`job` is not a routing identity. ADR-004 reserves the term for a possible
future scheduler; where it appears (e.g. in logs), it names a caller's
execution-request label, never a target this control plane resolves against.
A `Run` (see the [Assignment/Run/RunResult Contract](../contracts/assignment-run-runresult.md))
is one concrete execution attempt for an Assignment — it is not a job or
operation identity either.

Work, workflow, stage, operation, taskSpec, skill, and protocol context are
component-outer. A caller in that layer may derive a capability or an
explicit executor-id from them before entering this control plane; none of
them becomes a third resolvable identity inside dispatch core. See
Component-Outer Boundary Note below.
````

## Current section: docs/platform/agent-coordination/architecture/dispatch-control-plane.md#component-internal-ownership

Lines 262-302; shown SHA256 c77c9ac742680d242e27e938cb4639de2fedbad83731cea9bc7804b207bd9734. Ledger status verified. 

Code evidence: test/runner/dispatch-reconciliation-import-graph.test.mjs:434-443; src/runner/dispatch/assignment-runner.mjs:500-528; src/runner/dispatch/assignment-runner.mjs:1419-1438; src/runner/dispatch/resolve.mjs:25-66; src/runner/dispatch/resolve.mjs:255-309. Evidence commit a4e132ccd01e2b20a0e6c874ec5b4d6fbb5781e2.

```text
## Component-Internal Ownership

The Dispatch And Execution Engine owns exactly these authorities. No other
component performs any of them; this control plane performs none of the
Component-Outer Boundary Note's responsibilities.

1. **Request normalizer (design)** — the normalized target/policy/provenance
   boundary is proposed; current inputs are the compiler options above.
2. **Capability binding resolver** — `resolveExecutorAndOverrides` binds literal
   executor IDs/defaults or capability `prefer`; aliases and executor `for[]`
   inform capability labels separately in `resolveCapabilityDetailsFromHints`
   (`resolve.mjs:25-66,255-278`), not this binding resolver.
3. **Executor registry resolver** — resolves a literal executor-id to its
   concrete invocation/tool/agent shape (`resolveExecutorConfig`).
4. **Policy resolver** — `resolveAssignmentDispatchPolicy`; owns supported
   provider/model/rigor/tier derivation and provenance, not a `mergePolicyStack`.
5. **Governance resolver** — checks egress/provider/executor/content
   constraints (cross-provider gate, `allowCrossProvider`, `carries`).
6. **Mechanism resolver** — decides in-process/out-of-process/unavailable
   and MCP/tool handback (`decideDispatchMechanism`,
   `decideExecutorDispatchMechanism`).
7. **DispatchPlan compiler** — `compileDispatchPlan()` joins the legacy
   dispatch decisions. Unit execution first obtains its binding through
   `bind()`; assignment-runner revalidates that binding and compiles the
   governed execution plan. The domain harness owns neither choice.
8. **Run runtime/adapters** — creates, launches, observes, settles, and
   retries a Run without choosing semantic operation
   (`assignment-runner.mjs`, `transport.mjs`, `herdr-round.mjs`).

Forbidden dependencies for all eight:

- no `Work` lifecycle mutation (`pick`, `return`, `claim`, `take`): enforced by boundary grep tests (`test/runner/dispatch-reconciliation-import-graph.test.mjs`). Work driving orchestration lives exclusively in Work Driver (`src/runner/loop.mjs`, `src/runner/fanout-batch.mjs`);
- no event store append (`appendEvent`): audit dispatch logging is isolated to `src/runner/dispatch-log.mjs` outside dispatch core;
- no semantic Workflow/domain operation lookup in the strictly decoupled dispatch core. Work-layer lookups belong to `src/runner/work-compat.mjs` and `src/runner/operation-choice.mjs`; caller-derived hints enter the compiler. Historical compatibility re-exports and an `infra` manifest label are not current ownership proof. See boundary tests at `test/runner/dispatch-reconciliation-import-graph.test.mjs:434-443`.
- no semantic operation choice;
- no direct protocol/skill/domain executor launch;
- no RunResult confidence decision (owned by the Run Result Evaluator);
- no provider/model selection outside the policy resolver (item 4);
- no second private executor-launch path for a domain or coordinating harness.
  The retired `cohort-planner.mjs` is not a current exception or authority.
```

## Current section: docs/platform/agent-coordination/architecture/evidence-and-results.md#confidence-boundaries

Lines 58-67; shown SHA256 6cff376c1fa1fc8451e0d19f7d115af7ae2c09e93391779725325ece8c5f8b5d. Ledger status verified. 

Code evidence: src/runner/dispatch/run-result.mjs:1245-1330; src/runner/dispatch/evidence-attribution.mjs:31-83; src/runner/dispatch/run-result.mjs:149-160; src/runner/dispatch/run-result.mjs:290-302; src/runner/dispatch/run-result.mjs:1250-1285; src/runner/dispatch/agent-result-claim-contract.mjs:52-90. Evidence commit a4e132ccd01e2b20a0e6c874ec5b4d6fbb5781e2.

```text
## Confidence Boundaries

- Worker self-report alone cannot produce externally verified confidence (src/runner/dispatch/run-result.mjs:1276-1285).
- Exit code zero cannot satisfy missing semantic outputs: the evidence floor still requires the appropriate worker report or external delta (src/runner/dispatch/run-result.mjs:1250-1285).
- Pre-existing dirty files cannot count as changes produced by the Run (src/runner/dispatch/evidence-attribution.mjs:55-70).
- RunResult records with another Run's identity are rejected (src/runner/dispatch/run-result.mjs:153-157,295-299). This is not a worker-claim runId check: agent-result-claim-contract.mjs:52-90 validates claim shape without that identity check. Delta attribution uses the current Run's pre/post state; it is not a general age-based stale-evidence validator.
- Read-only output may remain `reported`; the runtime gates this by assignment.mutation === read-only, not an unstamped TaskSpec permission (src/runner/dispatch/assignment.mjs:938-940; run-result.mjs:1276-1285).
- Mutating success requires post-run external evidence appropriate to the claim (src/runner/dispatch/run-result.mjs:1276-1285).
- Missing required reports/deltas yield `no-evidence` under the evidence floor (src/runner/dispatch/run-result.mjs:1276-1285); corrupt result records fail closed separately (run-result.mjs:1305-1333).
```

## Current section: docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#2-production-ladder-semantics

Lines 68-92; shown SHA256 54250d75257d50afab4cbf4617ddc95bdd2c21fd3fa9d39300f5d2041f3f2163. Ledger status verified. 

Code evidence: src/runner/dispatch/liveness.mjs:211-302; src/runner/dispatch/herdr-round.mjs:341-359; src/runner/recovery.mjs:105-112. Evidence commit a4e132ccd01e2b20a0e6c874ec5b4d6fbb5781e2.

```text
## 2. Production Ladder Semantics

The order and behavior in `src/runner/dispatch/liveness.mjs` are ported:
1. Worker result file beats all runtime readings; it still requires normalization.
2. Blocked beats timeout in the ladder, but the Herdr adapter maps `blocked` to `worker-timeout` (`herdr-round.mjs:346-357`); the recovery matrix may retry it (`src/runner/recovery.mjs:105-107`). Answering the existing question without retry is the proposed correction, not current end-to-end behavior.
3. Death requires consecutive absent readings (default 3); unknown/present reset.
4. Absolute ceiling follows truth/blocked/death and is not reduced by blind time.
5. Idle/stale evaluation subtracts blind time; working is progress even with
   zero stdout. Screen reads are requested at the stale boundary, and an early
   credential probe also runs after fifteen seconds of non-working idle time
   (`liveness.mjs:267-299`). Thus screen reads are not stale-only.

A requested screen is the second stage of the sample, not another death read.
`evaluateLadder` emits `provider-limit` for credential/quota screen matches.
Its pane fate is `keep-always`; `paused-limit` remains a recognized alias.
Operator destructive intent is separate and guarded. Pane idleness does not
prove Run completion.

Zero output is a fact orthogonal to outcome. A 35-minute zero-output incident can
be timed-out-ceiling, as dogfood P08 records; it is not renamed timed-out-idle.
Handshake timeout with unknown delivery is not proof of launch failure.
The ladder supplies the matching screen line, not a parsed retryAfter timestamp.
An adapter may parse a known provider reset format, preserving the original line;
otherwise retryAfter is absent. RetryAfter only schedules inspection.
```

## Current section: docs/platform/agent-coordination/architecture/runtime-recovery-design.md#4-recovery-choice

Lines 85-99; shown SHA256 e7ae12b12502e13a7f0c85957cde6f74db8ad080528b788bb0d2296869c5f805. Ledger status open. Cancellation/budget precedence is proposed, not implemented: cancel is explicitly unsupported before reconciliation scans results.

Code evidence: src/runner/dispatch/recovery-planner.mjs:118-173; src/runner/dispatch/recovery-planner.mjs:243-316; src/runner/dispatch/run-lock.mjs:306-412; src/runner/dispatch/herdr-reconcile.mjs:351-357; src/runner/dispatch/reconcile-cli-spawn.mjs:38-47. Evidence commit a4e132ccd01e2b20a0e6c874ec5b4d6fbb5781e2.

```text
## 4. Recovery Choice

| Situation | Action | Identity retained |
|---|---|---|
| Worker result available | Normalize/store, publish only if eligible | Original Run. |
| Observer lost, worker still working | Inspect/reattach/wait | Same Run and Assignment. |
| Worker cannot continue | Reconcile effects and writers, then eligible replacement Run | Same Assignment and unit objective. |
| Cell accepted, next cell begins | Consuming track/domain transition; outside dispatch recovery | Track acceptance history, if the consuming harness records it. |

Proposed cancellation/budget rule: result collection would remain available after
budget exhaustion or cancellation, without admitting another execution; a new
intent would require a new request. This is not implemented cancellation precedence:
current Herdr/cli reconciliation returns `cancel-unsupported` before scanning
results (`herdr-reconcile.mjs:351-355`, `reconcile-cli-spawn.mjs:38-47`).
```

## Current section: docs/platform/agent-coordination/architecture/runtime-recovery-design.md#6-local-concurrency-and-durability

Lines 125-167; shown SHA256 0dbc105ed07e7650ce5578efc360ef95ff64fb445697018ffdc0674e76aa4bb2. Ledger status verified. 

Code evidence: src/runner/dispatch/run-lock.mjs:306-412; src/runner/dispatch/assignment-runner.mjs:895-945; src/runner/dispatch/settlement.mjs:420-445; src/runner/dispatch/proof-helpers.mjs:73-125. Evidence commit a4e132ccd01e2b20a0e6c874ec5b4d6fbb5781e2.

```text
## 6. Local Concurrency And Durability

Control acquisition must not reclaim a live process merely because TTL expired.
Holder identity is `{hostId, bootId, pid, processStartTime}` of the process doing
control, not a guessed Rust parent. Unknown liveness is not dead. A dead holder
may leave a remotely queued command: successor first reconciles pending control.

Implemented (Phase 02 H1, `src/runner/dispatch/run-lock.mjs`): holder identity
is `{id, pid, bootId, processStartTime, host}` (`buildRunControlHolder`,
`host` in place of this section's `hostId`), and `resolveHolderLiveness`
encodes the reclaim decision above as a table — a live pid, a pid whose
liveness cannot be disproven (unreadable `/proc/<pid>/stat`), or a pre-H1
holder record with no `processStartTime` to cross-check all resolve to
`held`, never `dead`; only a genuinely dead pid, a pid reused by a different
process (`processStartTime` mismatch), or a `bootId` predating the current
boot resolve to `dead`.

Recommended local implementation for safe reclaim without unlink races:
one per-scope lock directory containing immutable generation records and
token-specific release markers. Contenders publish generation `g+1` only after
`g` is released or its exact process identity is proven dead. Exactly one wins
exclusive publication. Never unlink/overwrite an earlier generation during
acquire/release, so a delayed release cannot delete its successor. A live holder
never self-recognizes a second concurrent acquisition as reentrant. Generation
records are retained with the runtime/session artifacts; compaction is offline
only after the scope is quiescent.

The proposed durability profile requires a fully written/fsynced temp file in
the same directory, atomic non-overwriting publication and directory fsync.
It calls for temp+rename+directory fsync under the owning lock for replacement.
Those are design requirements; the implementation's best-effort directory
fsync and other limits are stated below, not silently promoted to guarantees.
Current terminal `result.json` is published by `publishImmutableProof`
(`settlement.mjs:434`), not the mutable writer. `run.json`, the
effective-execution-contract projection and bookkeeping markers use their
mutable/marker writers. An unreadable existing result refuses relaunch rather
than overwriting evidence. The proof helper fsyncs the file, hard-links it
without overwrite, treats `EEXIST` as an existing proof and rethrows other link
errors; directory fsync is best-effort (`proof-helpers.mjs:73-125`).
A dedicated unsupported-filesystem diagnostic/doctor probe is a design
requirement, not an implemented check. No distributed lease, background
renewal service or TTL-only takeover is required by this local design.
```

## Current section: docs/platform/agent-coordination/architecture/runtime-recovery-design.md#9-implementation-slices-and-gates

Lines 221-233; shown SHA256 a97b6824a78bccd5d981579af8ec52780b4a25716ac104b144c71080e1b94403. Ledger status verified. 

Code evidence: src/runner/dispatch/confinement/authority.mjs:1589-1610; src/runner/dispatch/assignment-runner.mjs:1550-1595; src/runner/dispatch/recovery-planner.mjs:243-316; src/runner/dispatch/herdr-reconcile.mjs:351-361. Evidence commit a4e132ccd01e2b20a0e6c874ec5b4d6fbb5781e2.

```text
## 9. Implementation Slices And Gates

| Slice | Scope | Exit evidence; dependency | Status (2026-09-14) |
|---|---|---|---|
| S0 | Freeze fixtures for existing ladder, budgets, retry/recheck, context and close behavior | Existing Node suites green; capture known deficiencies without marking them solved. | **Implemented** — P00 |
| S1 | Versioned Run admission, strict publish fencing and local lock/reclaim | Concurrent admission and every pre-launch crash window; no two winners. Node first. | **Implemented** — P01 (`run-lock.mjs`) |
| S2 | Herdr launch reconciliation, handle guard, pending-control reconciliation, material capture | Reattach/observe/reconcile through the public door; isolated or read-only takeover only. Launch identity uses `runId` plus persisted `launchCommandId` (`fgos-<runId>-<launchCommandId>`); duplicate-name refusal and no resurrection after close require adapter proof. | **Partial** — Herdr launch reconciliation exists in `herdr-reconcile.mjs`; the proposed RunHandle/scope guard, pending-control reconciliation and RecoveryMaterial capture are not implemented as that contract. Writable partial-edit takeover remains deferred (`herdr-reconcile.mjs:356-357`). |
| S3 | Eligible fallback through compiler and confinement | Same Assignment, bounded attempts, unknown effects park; depends on S1/S2 for takeover. | **Implemented** — P03 (`recovery.mjs`) |
| S4 | Pure snapshot/planner + show | Can develop beside S1-S3 using recorded facts; no claim of automatic repair. | **Implemented** — P04 (pure evaluators) + P05 (standalone `dispatch recover`) |
| S5 | Retired coordination-session recovery/continuation | Full dated record remains in the historical snapshot; no current coordination recover door is claimed. | Retired in 2180b4e72 |
| S6 | Additional runtime/operation adapters and optional checkpoint support | Capability-specific proof before enabling; no promise all adapters ship with S2. | **Not implemented** — out of this track's scope |
| S7 | Rust writer port | Same fixtures for all supported Node semantics, sole writer and recovery compatibility. | **Not implemented** — separate track (see the `rust-host-r1-kernel` track) |
```

## Current section: docs/platform/agent-coordination/contracts/assignment-run-runresult.md#dispatch-operability-addendum

Lines 249-281; shown SHA256 f31f0d25e068b35187511d62dcc6962dd779b16ad87832803ae3da867a30e362. Ledger status verified. 

Code evidence: src/runner/dispatch/assignment-runner.mjs:1550-1595; src/runner/dispatch/run-result.mjs:1245-1330; src/runner/execution/run.mjs:331-340; src/runner/dispatch/run-result.mjs:350-385; src/runner/dispatch/run-result.mjs:546-566. Evidence commit a4e132ccd01e2b20a0e6c874ec5b4d6fbb5781e2.

```text
### Dispatch Operability Addendum

The dispatch-operability design track
(`archive/plans/260914-dispatch-operability-evidence-attribution/`) records RunResult
v2 interpretation and read-only Dispatch runtime inspection while preserving
`result.json` as the one terminal RunResult location:

- `RunResult` remains the only immutable terminal truth for a Run.
- `RunObservation` is a mutable read projection for in-flight, ambiguous, or
  incomplete facts; it cannot settle, retry, cancel, authorize, or clear a
  guard.
- `ProviderOutcome` is a host-invocation wrapper, not Run truth.
- `agent-result.json` becomes `agent-result-claim.v2`, a worker claim consumed
  by the normalizer, never independent proof.
- Current normalization defaults to RunResult v3 and also supports v4
  (`run-result.mjs:350-351,557-563`); v2 is the historical interpretation
  recorded by this design addendum, not the current default. Execution,
  assessment, confidence, failure, policy, delivery and provenance stay separate.
- Historical v1 results are interpreted deterministically as `legacy-derived`
  and are not rewritten on read.
- A v2 result whose compatibility `status`/`confidence` disagrees with its
  classification is `contract-corrupt` and fails closed.

The archived design record is
`archive/plans/260914-dispatch-operability-evidence-attribution/contracts/run-result-and-observation.md`;
it is historical design evidence, not a second live authority overriding code.
The implementation proof for this slice is
`test/runner/dispatch-operability-production-door.test.mjs`, which exercises
the production Assignment door, public inspect CLI, historical/replayed result
interpretation, and negative reconciliation routes. Reconciliation remains
guard/projection repair only; it does not recover, retry, relaunch, resume,
reattach, reassign, take over, admit, cancel, kill, or signal execution.
```

## Current section: docs/platform/agent-coordination/decisions/ADR-006-assignment-provenance-and-contract-snapshot.md#decision

Lines 33-73; shown SHA256 73de1c83930c66622cb0c813e1d5eac7d247ef016bf64850ad155b01ab2414f3. Ledger status verified. 

Code evidence: src/runner/execution/run.mjs:331-340; src/runner/dispatch/assignment-normalizer.mjs:95-144; src/runner/dispatch/execution-contract.mjs:180-240; src/runner/dispatch/assignment-normalizer.mjs:164-188; src/runner/dispatch/execution-contract.mjs:337-384. Evidence commit a4e132ccd01e2b20a0e6c874ec5b4d6fbb5781e2.

```text
## Decision

1. **Three current provenance kinds, one execution path.** Declared and inline
   builders stamp `contractPolicyVersion`, `normalizerVersion` and validator
   provenance (`assignment.mjs:456-459,663-666`). The Unit door separately writes
   `provenance.kind: unit-run` with its Unit-run context (`execution/run.mjs:334-338`);
   do not assert every kind has the declared builder's identical shape.
   - `declared`: Workflow step/operation/TaskSpec validation and normalization.
   - `inline`: foundation contract validation, the applicable registered domain
     harness and caller provenance.
   - `unit-run`: the Unit execution door and its computed binding/admission.
2. **Normalizer stamps the snapshot.** At build time the normalizer stamps
   `mutation` (`read-only | mutating`) and `evidence.required`
   (`reported | verified`) onto the immutable Assignment. Declared operations
   use operation tables with role/mutation-derived fallbacks for unmapped
   operations (`assignment-normalizer.mjs:95-124`); inline contracts must declare
   mutation/evidence explicitly. Missing required inline values fail validation.
3. **Interpretation reads the Assignment, not the operation id.** Result
   confidence gating, mutation policy, and post-advance behavior are driven by
   Assignment fields. Declared `resultKind` and optional `onAdvance` use the
   normalizer tables, with advisory/work-product fallback from mutation
   (`assignment-normalizer.mjs:120-143`). These are not arbitrary accepted
   inline-contract fields.
4. **Validated inline fields.** `objective`, `contextRefs`, `constraints`,
   `expectedOutputs`, `mutation`, `evidence`, required `role` and `budget`;
   optional `capabilities`, `supports`, `contractTemplate` and narrow `policy`.
   Budget requires positive integer `timeoutMs` and `maxRuns`; optional `tokens`
   is telemetry, not an enforced limit (`execution-contract.mjs:345-346,371-382`);
   inline policy accepts only
   `tier`, not a full PolicyPatch. Caller fields are validated separately
   (`execution-contract.mjs:180-240,295-340`). Unknown fields are rejected.
5. **Same execution governance.** Declared, inline and Unit-run requests
   converge on Assignment execution and Run/RunResult normalization rather than
   private dispatch or stores that bypass governance.
6. **Current mutation admission, not the retired first slice.** Generic inline mutation validation still requires the reserved protocol-operation stamp (`execution-contract.mjs:327-334`, `assignment-normalizer.mjs:173-175`), but the engine that produced that stamp was retired. The current Unit-run mutating door uses the worktree and recomputed-binding checks described in docs/specs/runner.md:3057. Do not present the dormant stamp path as a current general session-runtime door.

7. **Retire the standalone read-only heuristic.** Once no declared caller
   passes `workId: null`, the `missionId || workId === null => read-only`
   clauses are removed; read-only status comes only from the stamped
   `mutation` field.
```

## Current section: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#62-selector

Lines 183-201; shown SHA256 5438778e2e47a3b8b1ae4508b5d31eb532f2250e72471fc8bb045249ba64304d. Ledger status verified. 

Code evidence: src/runner/dispatch/plan.mjs:80-93; src/runner/dispatch/plan.mjs:444-461; src/runner/dispatch/cli.mjs:1081-1098; src/runner/execution/run.mjs:395-416. Evidence commit a4e132ccd01e2b20a0e6c874ec5b4d6fbb5781e2.

```text
### 6.2 Selector

The selector is caller input, not the mechanism result.

Allowed selector types:

- `work` - dispatch decision for a lifecycle work item.
- `purpose` - dispatch decision for a named capability/purpose.
- `executor` - dispatch decision for a concrete executor id.
- `assignment` - dispatch decision for an actual Assignment or its id.
- `adHocAgent` - dispatch decision for a runtime-composed agent assignment.

Do not add `nativeTask` as a selector. Native/in-process is an output mechanism, not an input category.

Legacy `decide --for` resolves a purpose first; `execute --for` is refused.
Execution uses the resolved executor ID positionally (`dispatch/cli.mjs:1081-1096`).
The Node Execution Core uses `bind()`; the Rust host does not directly call this
JavaScript resolver. Do not equate this proposal with every host representation.
```

## Current section: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#72-policy-resolution-before-dispatchplan

Lines 252-309; shown SHA256 fa0931df22b0c3241d4b8629f862c9299f7157357028c85aef26bc1fb227f6d3. Ledger status verified. 

Code evidence: src/runner/dispatch/assignment-policy.mjs:334-380; src/runner/dispatch/assignment-policy.mjs:195-245; src/runner/dispatch/plan.mjs:444-461; src/runner/dispatch/assignment-policy.mjs:220-243; src/runner/dispatch/assignment-policy.mjs:380-388; src/runner/dispatch/assignment-policy.mjs:457-466; src/runner/rigor.mjs:4-21. Evidence commit a4e132ccd01e2b20a0e6c874ec5b4d6fbb5781e2.

````text
### 7.2 Policy Resolution Before DispatchPlan

Team dispatch adds one layer before `DispatchPlan`: an effective execution
policy resolver.

```txt
stage operation + role + persona + work + assignment + human override
  -> effective dispatch policy
  -> DispatchPlan
  -> governance
  -> transport
```

This policy resolver must not become a second dispatch mechanism. It prepares
the selector and execution hints that the existing dispatch resolver already
understands.

Canonical specificity order:

```txt
Global defaults
-> Domain defaults
-> Workflow defaults
-> Stage defaults
-> Stage operation / taskSpec defaults
-> Role defaults
-> Persona defaults
-> Work-item policy
-> Assignment explicit policy
-> Human / CLI explicit override
-> Governance gate
```

Different fields resolve differently:

| Field family | Rule |
|---|---|
| Constraints | operation constraints override the assignment-skills base (`assignment-policy.mjs:459-462`), not a union |
| Provider / executor preference | highest-specificity wins |
| Fallback executors | only the most specific declared list is recorded; reserved-not-executed here, with no broader append (`assignment-policy.mjs:380-388`) |
| Tier / rigor | strongest required tier wins |
| Model name | resolve from provider/model policy after effective provider and tier are known |
| Literal model name | assignment or human/CLI override only |
| Governance / egress | final gate, never bypassed by policy |

Example:

```txt
operation reviewer requires rigor=standard
operation validate-plan prefers persona=code-reviewer
work.rigor=critical raises the effective rigor
assignment prefers executor=claude
governance checks effective egress
```

The current compiled plan exposes policy-derived `tier`, `model`, `providerModel`, `provenance` and `policy` alongside the resolved `invocation`; there is no `DispatchPlan.execution` wrapper.
The workflow does not need to hardcode a provider to prove team coordination.
````

## Current section: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#73-recommended-v1-provider-policy-for-coding-feature-flow

Lines 310-337; shown SHA256 c3b100684b202fdb32e4617eea7f7189e363712124574625c545c8076eb50f88. Ledger status open. Dated proof recommendations remain historical; no live defaults or bindings are supplied by the table.

Code evidence: src/runner/dispatch/assignment-policy.mjs:334-380; src/runner/dispatch/assignment-policy.mjs:195-245; src/runner/dispatch/plan.mjs:444-461; src/runner/dispatch/resolve.mjs:255-309. Evidence commit a4e132ccd01e2b20a0e6c874ec5b4d6fbb5781e2.

```text
### 7.3 Recommended V1 Provider Policy For Coding Feature Flow

Historical recommendations for the first proof, not current config defaults or
globally required execution order. The table's `pi`, `agy-cli` and old model
names are dated examples. Current checked project configuration declares
`claude`, `glm`, `gitnexus`, `herdr`, `openai`, `gemini`, `xai`, `deepseek`,
`claude-herdr`, `glm-herdr`; coding implementation prefers `gemini` with the
named invocation `agy-herdr-mucdong`. Effective global/project merge and
binding, not this table, decide a live request.

The table records dated proof recommendations only. It supplies neither current
defaults nor live bindings; use effective configuration and binding for execution.

| Stage | Operation | Preferred execution | Rationale |
|---|---|---|---|
| planning | `shape-plan` | `claude` / Claude `sonnet` | plan synthesis and tradeoff writing are the current stable default path |
| planning | `resolve-question` | `pi` / OpenAI-Codex `gpt-5.5` | independent consult benefits from provider diversity; `pi` has a verified JSON cli-spawn path |
| planning | `scout-blast-radius` | `gitnexus`, then `pi` if synthesis is needed | graph/tool evidence should precede model judgment |
| planning | `validate-plan` | `claude` / `sonnet`, raise to `opus` for critical work | review/proving should be evidence-first and may need stronger rigor |
| executing | `implement-item` | dated `agy-cli` / Gemini example | original proof recommendation; not the current project executor id or headless-path claim |
| executing | `review-item` | `claude` / `sonnet`, raise to `opus` for critical work | separate reviewer from implementation provider where possible |
| executing | `fix-verify-red` | `claude` for diagnosis, `agy-cli` for bounded edits | root-cause work and mechanical fix work have different execution needs |
| executing | `scoped-subtask` | `agy-cli` or `pi` | bounded helper work should use a cheaper/fast executor when evidence gates are clear |

The original cli-spawn-first proof restriction is historical. Current transport
selection follows configuration/bind and the authorized proof track; Herdr
visibility does not become semantic completion evidence.
```

## Current section: docs/platform/agent-coordination/architecture/group-thinking-trigger-surface.md#surface-taxonomy

Lines 70-84; shown SHA256 2f690c59d8ac5122e508a0bdc48506848eb48e12d90c356cbc9e8f14b607bab2. Ledger status verified. 

Code evidence: core/skills/fgos-panel/SKILL.md:43-110; src/runner/execution/patterns/presets.mjs:6-44; core/workflows/architecture-advisory.yaml:8-84; core/skills/fgos-panel/SKILL.md:36-59. Evidence commit a4e132ccd01e2b20a0e6c874ec5b4d6fbb5781e2.

```text
## Surface Taxonomy

This candidate map reflects the current routes in `core/skills/fgos-panel/SKILL.md:45-59`; it is not yet the skill's linked authority. The skill still links the legacy docs/architect taxonomy at lines 36-39. Repointing that consumer belongs to the authorized link cutover, not this truth pass. The current execution owners below are Workflow/CollaborationPattern owners, not a second sequencer; the former protocol-id mapping is historical.

| Requested use case | Selected surface | Current execution owner |
|---|---|---|
| Architecture advice or architectural coding design | architecture-panel / coding-design-panel | architecture-advisory Workflow via fgos-architecture-panel |
| Independent feedback or reflection review | independent-feedback / reflection-review | delphi Workflow |
| Option or strategy comparison | option-comparison / strategy-options | nominal-group Workflow |
| Complex dialectical sense-making | group-cognition | group-cognition Workflow |
| Proposal or business review | proposal-review / business-review | rfc preset, reviewed pattern with red-team |
| One bounded advice request | consult | consult preset, solo advisor |
| Independent research branches | research-fan-out | research-fan-out preset, panel of three |
| Explicit implementation/change/fix request | code-change-panel | fgos-run; advice alone cannot authorize this route |
```

## Current section: docs/platform/agent-coordination/architecture/protocol-model.md#compatibility

Lines 103-115; shown SHA256 21a1dd556a8c10fcc2a3b8aa2149152bacf605c97661681fdc5d3cfd20a1c276. Ledger status verified. 

Code evidence: src/workflow/steps.mjs:40-86; src/state/domain-registry.mjs:244-258; domains/coding/workflows/feature.yaml:12-140; src/runner/dispatch/execution-contract.mjs:180-240; src/workflow/steps.mjs:43-85. Evidence commit a4e132ccd01e2b20a0e6c874ec5b4d6fbb5781e2.

```text
## Compatibility

`taskSpecForStep` selects the primary normalized `step.operations` entry (or the
first); `skillForStep` reads `step.skill` separately and falls back to a declared
status skill (`src/workflow/steps.mjs:52-63`). Neither projects both values from
an operation. Compatibility remains a projection, not permission to weaken the
mandatory declared-operation, transition or evidence constraints. The existing
`operationsForStep`/`isLegalStepMove` projections preserve declared legality
(`steps.mjs:44-45,67-85`); they do not restore the retired Work-stage or engine.

The exact normalized contract is defined in
[Workflow Stage Operation Contract](../contracts/workflow-stage-operation.md).
```

## Current section: docs/platform/agent-coordination/architecture/protocol-model.md#domain-augmentation

Lines 120-128; shown SHA256 cc89a329f26ff91efa2d1a150592feab41c24260d32fcc3f4e1aa4f5d989e39f. Ledger status verified. 

Code evidence: src/workflow/steps.mjs:40-86; src/state/domain-registry.mjs:244-258; domains/coding/workflows/feature.yaml:12-140; src/runner/dispatch/execution-contract.mjs:180-240; src/workflow/steps.mjs:43-85. Evidence commit a4e132ccd01e2b20a0e6c874ec5b4d6fbb5781e2.

```text
## Domain Augmentation

Domains and organizations may add knowledge, doctrine, Skills, declared
Workflow definitions/operations and domain harnesses, planning validators,
resource/isolation analysis, evidence policy, roles, souls and quality criteria.
The foundation introduces a shared extension seam only after at least two unlike
consumers prove the common responsibility.
```

## Current section: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#7-agent-result-schema

Lines 171-210; shown SHA256 2f4a6f53fd826569ac2e5e3580a8e8469df16367656a6e25968e6443074fb53a. Ledger status verified. 

Code evidence: src/runner/dispatch/run-result.mjs:1245-1330; src/runner/dispatch/agent-result-claim-contract.mjs:5-30; src/runner/dispatch/agent-result-claim-contract.mjs:52-90. Evidence commit a4e132ccd01e2b20a0e6c874ec5b4d6fbb5781e2.

````text
## 7. Agent Result Schema

`agent-result.json` is the worker's structured claim. It is not proof by
itself.

Minimal v2 reviewer claim (reviewer/red-team and recheck contexts require
`assessment.verdict`; agent-result-claim-contract.mjs:5-30,81-85):

```json
{
  "contract": { "id": "agent-result-claim", "version": 2 },
  "status": "done",
  "summary": "One concise result sentence.",
  "findings": [],
  "evidenceRefs": [],
  "assessment": { "verdict": "pass" }
}
```

Allowed status values:

| Status | Meaning |
|---|---|
| `done` | The worker believes the assignment objective is complete. |
| `blocked` | The worker could not complete because a named blocker remains. |
| `failed` | The worker attempted the assignment and produced an error or invalid output. |
| `no-evidence` | The worker can report context but cannot support a completion claim. |

Required fields by status:

| Status | Required fields |
|---|---|
| `done` | `summary`; read-only acceptance requires a companion worker report artifact, not just `evidenceRefs`; mutating acceptance requires appropriate external delta evidence. See run-result.mjs:1276-1285 and assignment.mjs:881-898. |
| `blocked` | `summary`; `blocker`; `evidenceRefs` when any evidence exists. |
| `failed` | `summary`; `error`. |
| `no-evidence` | Non-empty `summary`; there is no additional reason field in the validator (`agent-result-claim-contract.mjs:9-15,67-85`). |

`nextRecommendedOperation` is a proposed optional extension, not a current
validated schema field or a field the Work-layer caller presently consumes.
````

## Current section: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#8-runresult-confidence

Lines 211-227; shown SHA256 7aa709fd3f5866327701b3f8c010b77cc7f3db49e7fa7fbbfb7e8db8baf1782e. Ledger status verified. 

Code evidence: src/runner/dispatch/run-result.mjs:1245-1330; src/runner/dispatch/run-result.mjs:1250-1285. Evidence commit a4e132ccd01e2b20a0e6c874ec5b4d6fbb5781e2.

```text
## 8. RunResult Confidence

RunResult status and confidence are control-plane judgments.

Confidence ladder:

| Confidence | Meaning | Allowed use |
|---|---|---|
| `verified` | Structured claim plus post-run external evidence such as a new commit, new changed file, test artifact, or verified result file. | May feed lifecycle decisions that require proof. |
| `reported` | A blocked claim, even without a companion report; or a read-only done claim with a worker report; or a failed findings verdict with a report and exit 0 (`run-result.mjs:1261-1278`). | May feed driver judgment, but should not close mutating work; status remains separate from confidence. |
| `inferred` | Post-run external evidence exists but no structured claim exists. | May be surfaced for inspection; driver should avoid automatic lifecycle movement. |
| `no-evidence` | Process settled without proof. | Must not advance Work. |
| `failed` | Timeout, nonzero exit, signal, invalid claim, read-only mutation, or a failed claim not qualifying for the reported findings branch (`run-result.mjs:1250-1271`). | Must not advance Work; an explicit failure is not always failed confidence. |

The driver must treat `done/no-evidence` as not done. It may retry, ask for a
proper artifact, or route to a different legal operation.
```

## Current section: docs/platform/agent-coordination/vocabulary/canonical-concepts.md#stance

Lines 172-175; shown SHA256 bfd0de71c4c8d55d7859fb955fdf4bdf63e468cf2ca6a8f092ed4a7c8a35a86d. Ledger status open. Passive panel stance measurement is implemented and checked; only the broader cognitive/session-state stance entity remains unimplemented design vocabulary.

Code evidence: src/state/work.mjs:445-467; src/runner/execution/run.mjs:331-340; src/workflow/runner.mjs:419-428; src/runner/execution/patterns/role-tasks.mjs:58-72; src/runner/execution/unit-summary.mjs:17-28. Evidence commit a4e132ccd01e2b20a0e6c874ec5b4d6fbb5781e2.

```text
### Stance

A temporary argumentative viewpoint. Passive panelist stance measurement is implemented: `stanceOptions` elicits an optional choice/confidence claim, and the Unit summary validates it (`src/runner/execution/patterns/role-tasks.mjs:61-70`, `unit-summary.mjs:17-28`); it does not affect pass/fail. A broader cognitive/session-state stance entity or routing identity remains design vocabulary, not a shipped SessionActor model.
```

## Current section: docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#12-dialogue-response-dialogue-responsemd

Lines 705-769; shown SHA256 de3f2594907ef074f8ff3d533092b268c38653ffaeb50379149afc0256d91ce9. Ledger status verified. 

Code evidence: core/workflows/architecture-advisory.yaml:8-84; core/skills/fgos-architecture-panel/SKILL.md:17-37; core/skills/fgos-architecture-panel/SKILL.md:113-142. Evidence commit a4e132ccd01e2b20a0e6c874ec5b4d6fbb5781e2.

````text
## 12. Dialogue Response — `dialogue/<n>-response.md`

Optional manual response trace. Registered gates/continuation remain with
Workflow; no companion-directory crash-recovery guarantee is asserted.

**Why this exists.** An optional manual response trace can help a successor
understand whether a person was answered and which artifact supports the reply.
It is not the retired Dialogue Turn Protocol's fourth runtime layer, and the
registered Workflow does not guarantee crash recovery of these companion files.
The registered graph remains framing, shaping, critique, synthesis, explanation
and the human close gate (`core/workflows/architecture-advisory.yaml:8-84`).

It is also the layer where authority leaks. The response is produced under the
driver's authorization, and naming that authorization here is what makes it
checkable later that the panel did what it was permitted to do and not more.

When the owner chooses this manual convention, even a short cited response is
useful. A missing companion file is not a current Workflow completion failure.

```text
# Dialogue Response <n>

<provenance header — the role that authored the response. For a clarification
this is normally the lead advisor; for a reopen it is whichever advisors ran>

Responds to: human/<n>-person.md
Reading applied: dialogue/<n>-impact.md
Authorized by: dispositions.md § <D-id> — <the authorization in one line>

## What The Panel Says Back

<the actual response, in the person's vocabulary. If it defends a claim, it
cites the artifact the claim rests on; if it concedes, it says so plainly>

## What Ran To Produce This

<none — answered from existing artifacts | the actors dispatched, with their
run records. "None" is a legitimate and common answer for a clarification>

## What Changed As A Result

Artifacts revised: <path and revision, or: none>
Recommendation: <unchanged | changed, and how>

## What Did Not Change, And Why

<the conclusions this turn left standing. Stating these is what stops one
comment from being remembered later as having overturned more than it did>

## Still Open After This Turn

<or: nothing — the turn is closed>
```

**Bad fill.** A response with no `Authorized by` line, which means either the
authorization was never recorded or the panel answered on its own initiative —
both are findings for a red-team. A response that quietly exceeds its
authorization: authorized to answer a clarification, it also revises the
recommendation. A response that answers the impact assessment's reading rather
than the person's actual words — the tell is that it never quotes or cites
`human/<n>-person.md`. Under the chosen manual convention, an undocumented reply
loses traceability; this rubric concern is not a registered runtime acceptance gate.

---
````

## Current section: docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#what-this-rubric-deliberately-does-not-measure

Lines 391-405; shown SHA256 3357fa8a8a6f2670aed4737be57a566d0d12724e54456719f0abe00f62a786ac. Ledger status verified. 

Code evidence: core/workflows/architecture-advisory.yaml:8-84; core/skills/fgos-architecture-panel/SKILL.md:17-37; core/skills/fgos-architecture-panel/SKILL.md:113-142. Evidence commit a4e132ccd01e2b20a0e6c874ec5b4d6fbb5781e2.

```text
## What This Rubric Deliberately Does Not Measure

- **Length or polish.** A short session that reached a good decision beats a long
  one that reached the same decision more impressively.
- **Whether the person took the recommendation.** They hold the authority. A
  session where they decided against the panel, for reasons the panel helped them
  articulate, is a success.
- **Whether the panel agreed with itself.** Preserved disagreement is a feature.
- **Volume of alternatives.** Three real candidates beat six with three escorts.
- **Protocol conformance.** This manual quality rubric is not a runtime
  conformance gate. The architecture-advisory Workflow and skill already ship
  (`core/workflows/architecture-advisory.yaml`, `core/skills/fgos-architecture-panel/SKILL.md`).
  Compare advice quality on the same case without treating this rubric as a
  required score the registered runtime must pass; conformance alone is not quality.
```

## Current section: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#how-to-read-this

Lines 31-67; shown SHA256 c144e4d23f2510628dc27d36ae9f01413092f329c18136aaf02279f61b7a0bb2. Ledger status verified. 

Code evidence: core/workflows/architecture-advisory.yaml:8-84; core/skills/fgos-architecture-panel/SKILL.md:17-37; core/skills/fgos-architecture-panel/SKILL.md:113-142. Evidence commit a4e132ccd01e2b20a0e6c874ec5b4d6fbb5781e2.

```text
## How To Read This

This document is the panel's operating intelligence. It is written as doctrine —
posture, heuristics, worked examples — rather than as a schema, and that is
deliberate. A role name plus a list of expected output fields does not produce
good advice. It produces an agent that fills in the fields.

Each role below carries seven things:

- **Purpose** — the one job. If the role does everything else well and misses
  this, it failed.
- **Posture** — the stance it takes toward the problem, the person, and the
  other roles. Posture is what stops a critic from becoming a shaper and a
  shaper from becoming a salesman.
- **What to notice** — the specific signals this role is responsible for
  catching, which nobody else is looking for.
- **Judgment heuristics** — the rules of thumb that make the difference between
  a competent and an excellent instance of this role.
- **Anti-patterns** — the characteristic failures, named, so a reviewer can
  point at one.
- **Handoff shape** — what it produces, for whom, and what must not be in it.
- **Examples** — at least one concrete good output and one concrete bad output.
  The bad examples are not strawmen; they are the outputs these roles actually
  produce when under-specified, and several are recognizably the kind of thing
  a capable model writes when it is trying to be helpful.

The worked examples use the vnflow EOD/intraday evolution question. They do not
include a worked mdview desktop-shell ownership case. Using a concrete case is
intentional — invented examples drift toward the abstract, and abstraction is
exactly what this document exists to resist.

The [coordinator companion](prompts/architecture-advisory-coordinator.md) is a
cognitive reference, not an operating-rules owner. The registered skill and
Workflow own execution, routing and gates. Optional manual artifact shapes are
in [templates](architecture-advisory-artifact-templates.md); quality judgment is
in [the rubric](architecture-advisory-evaluation-rubric.md).
```

## Retired successor: claim_d1ce767a2e3239b22d2e9fc6649dd9a5

docs/platform/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-8 -> docs/platform/agent-coordination/architecture/dispatch-control-plane.md#routing-identities

Native source digest: 212ffb52fe719fef01a51f585286aedd6792e48d063ada3a2663933e7c2593ec

Native target digest: 9346bcff67d284b8b32d0fbdc8b35e9da446a76e5f244fc7e6c89d68c958d671

Source witness commit: d23045c2de83e3508fda8fd2580b43ece2e1e046 (stored reviewed source witness); raw shown source SHA256 212ffb52fe719fef01a51f585286aedd6792e48d063ada3a2663933e7c2593ec; raw shown target SHA256 c7634d6197f50b6174b05b60d0164fac0837a06cce0efe17c6cd71abdf38c720.

Disposition move; status pending. The committed reviewer rejected this specific binding: [changed older binding] architecture/dispatch-control-plane.md#unheaded-block-8 -> architecture/dispatch-control-plane.md#routing-identities (move): Old routing-identities block unheaded-block-8 moves to anchor routing-identities, whose code block at lines 81-83 keeps executors.<id>.for[] as a resolution step contradicted by resolve.mjs:255-266. The corrected current successor at docs/platform/agent-coordination/architecture/dispatch-control-plane.md#routing-identities now states the code-checked boundary in Routing Identities; evidence: src/runner/dispatch/resolve.mjs:25-66; src/runner/dispatch/resolve.mjs:255-309. The disposition move and carriage carrier stay unchanged. This is a pending current-text rebinding, not a new file move, retirement or inherited approval. The source claim ID/digest and its accepted complete historical carriage are retained; the full shown target digest is renewed and requires independent targeted review.

### Genuine historical source

```text
`purpose` is not a third identity. It is compatibility terminology for
capability. The `--for <purpose>` CLI flag and the `purpose`/`for` parameter
names threaded through `src/runner/dispatch/plan.mjs` and
`src/runner/dispatch/resolve.mjs` (`resolveExecutorIdForPurpose`,
`resolveExecutorAndOverrides(cfg, executorIdOrPurpose)`) all name a capability
value, resolved against the same `runner.capabilities` catalog an explicit
capability selector would use. `compileDispatchPlan()`'s
`selector.type: 'purpose'` denotes a capability-shaped request, not a separate
ontology; nothing downstream branches on `purpose` as a concept distinct from
capability. Renaming these call sites internally is compatibility work
(tracked as Slice D/E in the normalization plan above), not a semantic
change — `--for`, `--work`, and `--assignment` stay supported at the CLI/API
adapter layer.
```

### Current target

````text
## Routing Identities

The dispatch core recognizes exactly two target identities. No other name
resolves a Run target.

```txt
capability   — abstract behavior promise, bound only by
               runner.capabilities.<capability>.prefer;
               executor for[] declarations do not bind this selector
executor-id  — explicit concrete implementation override, naming a
               runner.executors.<id> entry directly
```

`purpose` is not a third identity. It is compatibility terminology for
capability. The `--for <purpose>` CLI flag and the `purpose`/`for` parameter
names threaded through `src/runner/dispatch/plan.mjs` and
`src/runner/dispatch/resolve.mjs` (`resolveExecutorAndOverrides`) name capability
values. `resolveExecutorIdForPurpose` is not a current exported resolver.
`compileDispatchPlan()`'s `selector.type: 'purpose'` is the compatibility
selector label. It does not create a third conceptual route identity.
The [earlier normalization plan](../../../history/dispatch-core-contract-normalization/plan.md)
is dated migration context, not an assertion that its remaining helpers ship.

`job` is not a routing identity. ADR-004 reserves the term for a possible
future scheduler; where it appears (e.g. in logs), it names a caller's
execution-request label, never a target this control plane resolves against.
A `Run` (see the [Assignment/Run/RunResult Contract](../contracts/assignment-run-runresult.md))
is one concrete execution attempt for an Assignment — it is not a job or
operation identity either.

Work, workflow, stage, operation, taskSpec, skill, and protocol context are
component-outer. A caller in that layer may derive a capability or an
explicit executor-id from them before entering this control plane; none of
them becomes a third resolvable identity inside dispatch core. See
Component-Outer Boundary Note below.
````

## Retired successor: claim_2ff575998d2ae90d5ecc1a2d414d078d

docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#2-production-ladder-semantics -> docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#2-production-ladder-semantics

Native source digest: dbaf1434220173d1544ccc02f9daa13ca9f87453ace7ad899ef0b8167d758b97

Native target digest: 18a8113ca28a3e4eb1d70e5a4599b354a57fa5bdf38e1addce71c5a4ad8c3713

Source witness commit: d23045c2de83e3508fda8fd2580b43ece2e1e046 (stored reviewed source witness); raw shown source SHA256 870fa30fefb1f699690eeec5b3ba9973bd32fedfd1eff755b1f26adc9b92692d; raw shown target SHA256 54250d75257d50afab4cbf4617ddc95bdd2c21fd3fa9d39300f5d2041f3f2163.

Disposition move; status pending. The committed reviewer rejected this specific binding: [changed older binding] architecture/executor-health-and-fallback.md#2-production-ladder-semantics -> architecture/executor-health-and-fallback.md#2-production-ladder-semantics (move): Moved to section 2 anchor whose line 72 do not retry on blocked is contradicted by herdr-round.mjs:344-357; other ladder content is true. The corrected current successor at docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#2-production-ladder-semantics now states the code-checked boundary in 2. Production Ladder Semantics; evidence: src/runner/dispatch/herdr-round.mjs:341-359; src/runner/recovery.mjs:105-112. The disposition move and carriage carrier stay unchanged. This is a pending current-text rebinding, not a new file move, retirement or inherited approval. The source claim ID/digest and its accepted complete historical carriage are retained; the full shown target digest is renewed and requires independent targeted review.

### Genuine historical source

```text
## 2. Production Ladder Semantics

The order and behavior in `src/runner/dispatch/liveness.mjs` are ported:
1. Worker result file beats all runtime readings; it still requires normalization.
2. Blocked beats timeout: answer the existing question, do not retry.
3. Death requires consecutive absent readings (default 3); unknown/present reset.
4. Absolute ceiling follows truth/blocked/death and is not reduced by blind time.
5. Only stale evaluation reads screen; working itself is progress even with zero
   stdout, and blind intervals are subtracted from idle duration.

A screen request is a second stage of the same sample, not another death reading.
Keep all failure panes by default. Paused-limit survives automated closeAlways;
operator destructive intent is separate and guarded. Never infer Run completion
from agent_status or pane idleness.

Zero output is a fact orthogonal to outcome. A 35-minute zero-output incident can
be timed-out-ceiling, as dogfood P08 records; it is not renamed timed-out-idle.
Handshake timeout with unknown delivery is not proof of launch failure.
The ladder supplies the matching screen line, not a parsed retryAfter timestamp.
An adapter may parse a known provider reset format, preserving the original line;
otherwise retryAfter is absent. RetryAfter only schedules inspection.
```

### Current target

```text
## 2. Production Ladder Semantics

The order and behavior in `src/runner/dispatch/liveness.mjs` are ported:
1. Worker result file beats all runtime readings; it still requires normalization.
2. Blocked beats timeout in the ladder, but the Herdr adapter maps `blocked` to `worker-timeout` (`herdr-round.mjs:346-357`); the recovery matrix may retry it (`src/runner/recovery.mjs:105-107`). Answering the existing question without retry is the proposed correction, not current end-to-end behavior.
3. Death requires consecutive absent readings (default 3); unknown/present reset.
4. Absolute ceiling follows truth/blocked/death and is not reduced by blind time.
5. Idle/stale evaluation subtracts blind time; working is progress even with
   zero stdout. Screen reads are requested at the stale boundary, and an early
   credential probe also runs after fifteen seconds of non-working idle time
   (`liveness.mjs:267-299`). Thus screen reads are not stale-only.

A requested screen is the second stage of the sample, not another death read.
`evaluateLadder` emits `provider-limit` for credential/quota screen matches.
Its pane fate is `keep-always`; `paused-limit` remains a recognized alias.
Operator destructive intent is separate and guarded. Pane idleness does not
prove Run completion.

Zero output is a fact orthogonal to outcome. A 35-minute zero-output incident can
be timed-out-ceiling, as dogfood P08 records; it is not renamed timed-out-idle.
Handshake timeout with unknown delivery is not proof of launch failure.
The ladder supplies the matching screen line, not a parsed retryAfter timestamp.
An adapter may parse a known provider reset format, preserving the original line;
otherwise retryAfter is absent. RetryAfter only schedules inspection.
```

## Retired successor: claim_d283a70392cc071ee19d103f77228841

docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-6 -> docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#2-production-ladder-semantics

Native source digest: 3cf3dc60ee31fd5df6ab2864b92ed1f3bdc96982df814f65c4afb545b4458957

Native target digest: 18a8113ca28a3e4eb1d70e5a4599b354a57fa5bdf38e1addce71c5a4ad8c3713

Source witness commit: d23045c2de83e3508fda8fd2580b43ece2e1e046 (stored reviewed source witness); raw shown source SHA256 3cf3dc60ee31fd5df6ab2864b92ed1f3bdc96982df814f65c4afb545b4458957; raw shown target SHA256 54250d75257d50afab4cbf4617ddc95bdd2c21fd3fa9d39300f5d2041f3f2163.

Disposition move; status pending. The committed reviewer rejected this specific binding: [changed older binding] architecture/executor-health-and-fallback.md#unheaded-block-6 -> architecture/executor-health-and-fallback.md#2-production-ladder-semantics (move): Ladder items moved to section 2 anchor, which keeps the blocked do not retry claim contradicted by herdr-round.mjs:344-357. The corrected current successor at docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#2-production-ladder-semantics now states the code-checked boundary in 2. Production Ladder Semantics; evidence: src/runner/dispatch/herdr-round.mjs:341-359; src/runner/recovery.mjs:105-112. The disposition move and carriage carrier stay unchanged. This is a pending current-text rebinding, not a new file move, retirement or inherited approval. The source claim ID/digest and its accepted complete historical carriage are retained; the full shown target digest is renewed and requires independent targeted review.

### Genuine historical source

```text
The order and behavior in `src/runner/dispatch/liveness.mjs` are ported:
1. Worker result file beats all runtime readings; it still requires normalization.
2. Blocked beats timeout: answer the existing question, do not retry.
3. Death requires consecutive absent readings (default 3); unknown/present reset.
4. Absolute ceiling follows truth/blocked/death and is not reduced by blind time.
5. Only stale evaluation reads screen; working itself is progress even with zero
   stdout, and blind intervals are subtracted from idle duration.
```

### Current target

```text
## 2. Production Ladder Semantics

The order and behavior in `src/runner/dispatch/liveness.mjs` are ported:
1. Worker result file beats all runtime readings; it still requires normalization.
2. Blocked beats timeout in the ladder, but the Herdr adapter maps `blocked` to `worker-timeout` (`herdr-round.mjs:346-357`); the recovery matrix may retry it (`src/runner/recovery.mjs:105-107`). Answering the existing question without retry is the proposed correction, not current end-to-end behavior.
3. Death requires consecutive absent readings (default 3); unknown/present reset.
4. Absolute ceiling follows truth/blocked/death and is not reduced by blind time.
5. Idle/stale evaluation subtracts blind time; working is progress even with
   zero stdout. Screen reads are requested at the stale boundary, and an early
   credential probe also runs after fifteen seconds of non-working idle time
   (`liveness.mjs:267-299`). Thus screen reads are not stale-only.

A requested screen is the second stage of the sample, not another death read.
`evaluateLadder` emits `provider-limit` for credential/quota screen matches.
Its pane fate is `keep-always`; `paused-limit` remains a recognized alias.
Operator destructive intent is separate and guarded. Pane idleness does not
prove Run completion.

Zero output is a fact orthogonal to outcome. A 35-minute zero-output incident can
be timed-out-ceiling, as dogfood P08 records; it is not renamed timed-out-idle.
Handshake timeout with unknown delivery is not proof of launch failure.
The ladder supplies the matching screen line, not a parsed retryAfter timestamp.
An adapter may parse a known provider reset format, preserving the original line;
otherwise retryAfter is absent. RetryAfter only schedules inspection.
```

## Retired successor: claim_0a52ec5fcc2abb5870b350b23451da43

docs/platform/agent-coordination/architecture/protocol-model.md#unheaded-block-14 -> docs/platform/agent-coordination/architecture/protocol-model.md#compatibility

Native source digest: 4173ec263ab82dbec1cc0138083b9a13debc8821030f94a08e26c81680068e0c

Native target digest: 7a6f9fa240fe911d210c903743ef5ea8a41beddd2ad5bd0898c2fc524a4ea4ba

Source witness commit: d23045c2de83e3508fda8fd2580b43ece2e1e046 (stored reviewed source witness); raw shown source SHA256 4173ec263ab82dbec1cc0138083b9a13debc8821030f94a08e26c81680068e0c; raw shown target SHA256 21a1dd556a8c10fcc2a3b8aa2149152bacf605c97661681fdc5d3cfd20a1c276.

Disposition move; status pending. The committed reviewer rejected this specific binding: [changed older binding] architecture/protocol-model.md#unheaded-block-14 -> architecture/protocol-model.md#compatibility (move): retired-unit successor now at compatibility (lines 103-103): that anchor still carries the inaccurate statement that skill compatibility projection derives from step.operations while skillForStep reads step.skill (src/workflow/steps.mjs:50-52) The corrected current successor at docs/platform/agent-coordination/architecture/protocol-model.md#compatibility now states the code-checked boundary in Compatibility; evidence: src/workflow/steps.mjs:43-85. The disposition move and carriage carrier stay unchanged. This is a pending current-text rebinding, not a new file move, retirement or inherited approval. The source claim ID/digest and its accepted complete historical carriage are retained; the full shown target digest is renewed and requires independent targeted review.

### Genuine historical source

```text
This compatibility path remains mandatory for Work-attached declared workflows.
Adding an agent-led path must not weaken or reinterpret it.
```

### Current target

```text
## Compatibility

`taskSpecForStep` selects the primary normalized `step.operations` entry (or the
first); `skillForStep` reads `step.skill` separately and falls back to a declared
status skill (`src/workflow/steps.mjs:52-63`). Neither projects both values from
an operation. Compatibility remains a projection, not permission to weaken the
mandatory declared-operation, transition or evidence constraints. The existing
`operationsForStep`/`isLegalStepMove` projections preserve declared legality
(`steps.mjs:44-45,67-85`); they do not restore the retired Work-stage or engine.

The exact normalized contract is defined in
[Workflow Stage Operation Contract](../contracts/workflow-stage-operation.md).
```

## Retired successor: claim_e415506235b575bc5eb32b225a758f5b

docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#62-selector -> docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#62-selector

Native source digest: 29ff28ddd20131ed5005890937b9ad9fa2928b73bd2ff3d818e09f2515f6cda1

Native target digest: f74896a55ec95145a488a4d4f78d23c0498357b944441ca192f35ecb38247d3a

Source witness commit: d23045c2de83e3508fda8fd2580b43ece2e1e046 (stored reviewed source witness); raw shown source SHA256 80b21f08495c23ab630f543454b41a6f7256e2841b01d6401b3e237368f1eb68; raw shown target SHA256 5438778e2e47a3b8b1ae4508b5d31eb532f2250e72471fc8bb045249ba64304d.

Disposition move; status pending. The committed reviewer rejected this specific binding: [changed older binding] proposals/dispatch-control-plane-redesign.md#62-selector -> proposals/dispatch-control-plane-redesign.md#62-selector (move): Successor 62-selector to 62-selector (183-183): section 6.2 lines 197-200 claim execute --for is capability-aware (cli.mjs:1081-1093 refuses it) and attribute bind() to a Rust-host door (bind is Node run.mjs:404). The corrected current successor at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#62-selector now states the code-checked boundary in 6.2 Selector; evidence: src/runner/dispatch/cli.mjs:1081-1098; src/runner/execution/run.mjs:395-416. The disposition move and carriage carrier stay unchanged. This is a pending current-text rebinding, not a new file move, retirement or inherited approval. The source claim ID/digest and its accepted complete historical carriage are retained; the full shown target digest is renewed and requires independent targeted review.

### Genuine historical source

```text
### 6.2 Selector

The selector is caller input, not the mechanism result.

Allowed selector types:

- `work` - dispatch decision for a lifecycle work item.
- `purpose` - dispatch decision for a named capability/purpose.
- `executor` - dispatch decision for a concrete executor id.
- `adHocAgent` - dispatch decision for a runtime-composed agent assignment.

Do not add `nativeTask` as a selector. Native/in-process is an output mechanism, not an input category.

Current implementation note: `execute --for` already resolves through the
capability-aware path that honors `capabilities.<name>.prefer`.
`decide --for` still uses the older `for` scan. Item 0 below exists to
remove that split.
```

### Current target

```text
### 6.2 Selector

The selector is caller input, not the mechanism result.

Allowed selector types:

- `work` - dispatch decision for a lifecycle work item.
- `purpose` - dispatch decision for a named capability/purpose.
- `executor` - dispatch decision for a concrete executor id.
- `assignment` - dispatch decision for an actual Assignment or its id.
- `adHocAgent` - dispatch decision for a runtime-composed agent assignment.

Do not add `nativeTask` as a selector. Native/in-process is an output mechanism, not an input category.

Legacy `decide --for` resolves a purpose first; `execute --for` is refused.
Execution uses the resolved executor ID positionally (`dispatch/cli.mjs:1081-1096`).
The Node Execution Core uses `bind()`; the Rust host does not directly call this
JavaScript resolver. Do not equate this proposal with every host representation.
```

## Retired successor: claim_d245d70ae94106a208d95b6bfa6b6152

docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#72-policy-resolution-before-dispatchplan -> docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#72-policy-resolution-before-dispatchplan

Native source digest: 487d6dc9830b4078de9fcf7e7f1ce51780128d71b448e9e6da14721302c36222

Native target digest: 1b8bad3a28b92a56bcefee746276e3cabf955f0361653f49b152dd5b720d5dd0

Source witness commit: d23045c2de83e3508fda8fd2580b43ece2e1e046 (stored reviewed source witness); raw shown source SHA256 1452c1a4d07dcdef3dee5adf0a4e824f29aa08c03440f6b9ba4c23def2d01d20; raw shown target SHA256 fa0931df22b0c3241d4b8629f862c9299f7157357028c85aef26bc1fb227f6d3.

Disposition move; status pending. The committed reviewer rejected this specific binding: [changed older binding] proposals/dispatch-control-plane-redesign.md#72-policy-resolution-before-dispatchplan -> proposals/dispatch-control-plane-redesign.md#72-policy-resolution-before-dispatchplan (move): Successor 72-policy-resolution-before-dispatchplan to 72-policy-resolution-before-dispatchplan (252-252): section 7.2 uses retired minTier (lines 300, 302), unioned constraints (assignment-policy.mjs:459-462 overrides) and appended fallbacks (assignment-policy.mjs:380-388 reserved-not-executed). The corrected current successor at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#72-policy-resolution-before-dispatchplan now states the code-checked boundary in 7.2 Policy Resolution Before DispatchPlan; evidence: src/runner/dispatch/assignment-policy.mjs:220-243; src/runner/dispatch/assignment-policy.mjs:380-388; src/runner/dispatch/assignment-policy.mjs:457-466; src/runner/rigor.mjs:4-21. The disposition move and carriage carrier stay unchanged. This is a pending current-text rebinding, not a new file move, retirement or inherited approval. The source claim ID/digest and its accepted complete historical carriage are retained; the full shown target digest is renewed and requires independent targeted review.

### Genuine historical source

````text
### 7.2 Policy Resolution Before DispatchPlan

Team dispatch adds one layer before `DispatchPlan`: an effective execution
policy resolver.

```txt
stage operation + role + persona + work + assignment + human override
  -> effective dispatch policy
  -> DispatchPlan
  -> governance
  -> transport
```

This policy resolver must not become a second dispatch mechanism. It prepares
the selector and execution hints that the existing dispatch resolver already
understands.

Canonical specificity order:

```txt
Global defaults
-> Domain defaults
-> Workflow defaults
-> Stage defaults
-> Stage operation / taskSpec defaults
-> Role defaults
-> Persona defaults
-> Work-item policy
-> Assignment explicit policy
-> Human / CLI explicit override
-> Governance gate
```

Different fields resolve differently:

| Field family | Rule |
|---|---|
| Constraints | union, then fail closed if unsatisfied |
| Provider / executor preference | highest-specificity wins |
| Fallback executors | preserve ordered list from the most specific layer, with broader fallbacks appended if useful |
| Tier / rigor | strongest required tier wins |
| Model name | resolve from provider/model policy after effective provider and tier are known |
| Literal model name | assignment or human/CLI override only |
| Governance / egress | final gate, never bypassed by policy |

Example:

```txt
role reviewer requires minTier=standard
operation validate-plan prefers persona=code-reviewer
work risk=high raises minTier=critical
assignment prefers executor=claude
governance checks effective egress
```

The resulting `DispatchPlan.execution` carries the concrete model and adapter.
The workflow does not need to hardcode a provider to prove team coordination.
````

### Current target

````text
### 7.2 Policy Resolution Before DispatchPlan

Team dispatch adds one layer before `DispatchPlan`: an effective execution
policy resolver.

```txt
stage operation + role + persona + work + assignment + human override
  -> effective dispatch policy
  -> DispatchPlan
  -> governance
  -> transport
```

This policy resolver must not become a second dispatch mechanism. It prepares
the selector and execution hints that the existing dispatch resolver already
understands.

Canonical specificity order:

```txt
Global defaults
-> Domain defaults
-> Workflow defaults
-> Stage defaults
-> Stage operation / taskSpec defaults
-> Role defaults
-> Persona defaults
-> Work-item policy
-> Assignment explicit policy
-> Human / CLI explicit override
-> Governance gate
```

Different fields resolve differently:

| Field family | Rule |
|---|---|
| Constraints | operation constraints override the assignment-skills base (`assignment-policy.mjs:459-462`), not a union |
| Provider / executor preference | highest-specificity wins |
| Fallback executors | only the most specific declared list is recorded; reserved-not-executed here, with no broader append (`assignment-policy.mjs:380-388`) |
| Tier / rigor | strongest required tier wins |
| Model name | resolve from provider/model policy after effective provider and tier are known |
| Literal model name | assignment or human/CLI override only |
| Governance / egress | final gate, never bypassed by policy |

Example:

```txt
operation reviewer requires rigor=standard
operation validate-plan prefers persona=code-reviewer
work.rigor=critical raises the effective rigor
assignment prefers executor=claude
governance checks effective egress
```

The current compiled plan exposes policy-derived `tier`, `model`, `providerModel`, `provenance` and `policy` alongside the resolved `invocation`; there is no `DispatchPlan.execution` wrapper.
The workflow does not need to hardcode a provider to prove team coordination.
````

## Retired successor: claim_f0b558c805f1b274d2df72fb6083acfb

docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#73-recommended-v1-provider-policy-for-coding-feature-flow -> docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#73-recommended-v1-provider-policy-for-coding-feature-flow

Native source digest: 62560b47d9fa2b2476a7fa7e720d96e46041d6fe047e76c8bb14ca498a5f9487

Native target digest: cdcee4bf1cc904e4d7fc101b37de8008fbe974562c3bcc2ab782690fef29913b

Source witness commit: d23045c2de83e3508fda8fd2580b43ece2e1e046 (stored reviewed source witness); raw shown source SHA256 cd9de33daa61bb3db13511d578b67cac710e59aa73e6ae7bc0ded6d020e03221; raw shown target SHA256 c3b100684b202fdb32e4617eea7f7189e363712124574625c545c8076eb50f88.

Disposition move; status pending. The committed reviewer rejected this specific binding: [changed older binding] proposals/dispatch-control-plane-redesign.md#73-recommended-v1-provider-policy-for-coding-feature-flow -> proposals/dispatch-control-plane-redesign.md#73-recommended-v1-provider-policy-for-coding-feature-flow (move): Successor 73-recommended-v1-provider-policy-for-coding-feature-flow to 73-recommended-v1-provider-policy-for-coding-feature-flow (310-310): section 7.3 lines 313-314 tell readers to use the historical table as defaults, contradicting its own historical label (pi and agy-cli are not registered executors). The corrected current successor at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#73-recommended-v1-provider-policy-for-coding-feature-flow now states the code-checked boundary in 7.3 Recommended V1 Provider Policy For Coding Feature Flow; evidence: src/runner/dispatch/resolve.mjs:255-309. The disposition move and carriage carrier stay unchanged. This is a pending current-text rebinding, not a new file move, retirement or inherited approval. The source claim ID/digest and its accepted complete historical carriage are retained; the full shown target digest is renewed and requires independent targeted review.

### Genuine historical source

```text
### 7.3 Recommended V1 Provider Policy For Coding Feature Flow

Use these as defaults for the first team-dispatch proof, not permanent hard
bindings.

| Stage | Operation | Preferred execution | Rationale |
|---|---|---|---|
| planning | `shape-plan` | `claude` / Claude `sonnet` | plan synthesis and tradeoff writing are the current stable default path |
| planning | `resolve-question` | `pi` / OpenAI-Codex `gpt-5.5` | independent consult benefits from provider diversity; `pi` has a verified JSON cli-spawn path |
| planning | `scout-blast-radius` | `gitnexus`, then `pi` if synthesis is needed | graph/tool evidence should precede model judgment |
| planning | `validate-plan` | `claude` / `sonnet`, raise to `opus` for critical work | review/proving should be evidence-first and may need stronger rigor |
| executing | `implement-item` | `agy-cli` / Gemini `gemini-3.6-flash-medium` | current repo config already pins `fgos-coding-implement` to the stable headless agy path |
| executing | `review-item` | `claude` / `sonnet`, raise to `opus` for critical work | separate reviewer from implementation provider where possible |
| executing | `fix-verify-red` | `claude` for diagnosis, `agy-cli` for bounded edits | root-cause work and mechanical fix work have different execution needs |
| executing | `scoped-subtask` | `agy-cli` or `pi` | bounded helper work should use a cheaper/fast executor when evidence gates are clear |

Do not use `agy-herdr`, `codex-herdr`, or other interactive Herdr paths as the
authority for the first team proof. They can be tried later as visibility
adapters after cli-spawn assignment execution and evidence handling are stable.
```

### Current target

```text
### 7.3 Recommended V1 Provider Policy For Coding Feature Flow

Historical recommendations for the first proof, not current config defaults or
globally required execution order. The table's `pi`, `agy-cli` and old model
names are dated examples. Current checked project configuration declares
`claude`, `glm`, `gitnexus`, `herdr`, `openai`, `gemini`, `xai`, `deepseek`,
`claude-herdr`, `glm-herdr`; coding implementation prefers `gemini` with the
named invocation `agy-herdr-mucdong`. Effective global/project merge and
binding, not this table, decide a live request.

The table records dated proof recommendations only. It supplies neither current
defaults nor live bindings; use effective configuration and binding for execution.

| Stage | Operation | Preferred execution | Rationale |
|---|---|---|---|
| planning | `shape-plan` | `claude` / Claude `sonnet` | plan synthesis and tradeoff writing are the current stable default path |
| planning | `resolve-question` | `pi` / OpenAI-Codex `gpt-5.5` | independent consult benefits from provider diversity; `pi` has a verified JSON cli-spawn path |
| planning | `scout-blast-radius` | `gitnexus`, then `pi` if synthesis is needed | graph/tool evidence should precede model judgment |
| planning | `validate-plan` | `claude` / `sonnet`, raise to `opus` for critical work | review/proving should be evidence-first and may need stronger rigor |
| executing | `implement-item` | dated `agy-cli` / Gemini example | original proof recommendation; not the current project executor id or headless-path claim |
| executing | `review-item` | `claude` / `sonnet`, raise to `opus` for critical work | separate reviewer from implementation provider where possible |
| executing | `fix-verify-red` | `claude` for diagnosis, `agy-cli` for bounded edits | root-cause work and mechanical fix work have different execution needs |
| executing | `scoped-subtask` | `agy-cli` or `pi` | bounded helper work should use a cheaper/fast executor when evidence gates are clear |

The original cli-spawn-first proof restriction is historical. Current transport
selection follows configuration/bind and the authorized proof track; Herdr
visibility does not become semantic completion evidence.
```

## Retired successor: claim_e95c422ac5e33683c4e657f55a540496

docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-40 -> docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#62-selector

Native source digest: 4bd5619af16c5af92c73c6d5a88ff22c8b1dfdde3298ba450703e150d2b83d7f

Native target digest: f74896a55ec95145a488a4d4f78d23c0498357b944441ca192f35ecb38247d3a

Source witness commit: d23045c2de83e3508fda8fd2580b43ece2e1e046 (stored reviewed source witness); raw shown source SHA256 4bd5619af16c5af92c73c6d5a88ff22c8b1dfdde3298ba450703e150d2b83d7f; raw shown target SHA256 5438778e2e47a3b8b1ae4508b5d31eb532f2250e72471fc8bb045249ba64304d.

Disposition move; status pending. The committed reviewer rejected this specific binding: [changed older binding] proposals/dispatch-control-plane-redesign.md#unheaded-block-40 -> proposals/dispatch-control-plane-redesign.md#62-selector (move): Successor unheaded-block-40 to 62-selector (183-183): section 6.2 lines 197-200 claim execute --for is capability-aware (cli.mjs:1081-1093 refuses it) and attribute bind() to a Rust-host door (bind is Node run.mjs:404). The corrected current successor at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#62-selector now states the code-checked boundary in 6.2 Selector; evidence: src/runner/dispatch/cli.mjs:1081-1098; src/runner/execution/run.mjs:395-416. The disposition move and carriage carrier stay unchanged. This is a pending current-text rebinding, not a new file move, retirement or inherited approval. The source claim ID/digest and its accepted complete historical carriage are retained; the full shown target digest is renewed and requires independent targeted review.

### Genuine historical source

```text
- `work` - dispatch decision for a lifecycle work item.
- `purpose` - dispatch decision for a named capability/purpose.
- `executor` - dispatch decision for a concrete executor id.
- `adHocAgent` - dispatch decision for a runtime-composed agent assignment.
```

### Current target

```text
### 6.2 Selector

The selector is caller input, not the mechanism result.

Allowed selector types:

- `work` - dispatch decision for a lifecycle work item.
- `purpose` - dispatch decision for a named capability/purpose.
- `executor` - dispatch decision for a concrete executor id.
- `assignment` - dispatch decision for an actual Assignment or its id.
- `adHocAgent` - dispatch decision for a runtime-composed agent assignment.

Do not add `nativeTask` as a selector. Native/in-process is an output mechanism, not an input category.

Legacy `decide --for` resolves a purpose first; `execute --for` is refused.
Execution uses the resolved executor ID positionally (`dispatch/cli.mjs:1081-1096`).
The Node Execution Core uses `bind()`; the Rust host does not directly call this
JavaScript resolver. Do not equate this proposal with every host representation.
```

## Retired successor: claim_ab8a87d8a586e83cc0df72070e1c438f

docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-42 -> docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#62-selector

Native source digest: 7f4a913cd40a582883a10dce9a4fcab6023b655dd4ab28fc88a4ae43d0c0f717

Native target digest: f74896a55ec95145a488a4d4f78d23c0498357b944441ca192f35ecb38247d3a

Source witness commit: d23045c2de83e3508fda8fd2580b43ece2e1e046 (stored reviewed source witness); raw shown source SHA256 7f4a913cd40a582883a10dce9a4fcab6023b655dd4ab28fc88a4ae43d0c0f717; raw shown target SHA256 5438778e2e47a3b8b1ae4508b5d31eb532f2250e72471fc8bb045249ba64304d.

Disposition move; status pending. The committed reviewer rejected this specific binding: [changed older binding] proposals/dispatch-control-plane-redesign.md#unheaded-block-42 -> proposals/dispatch-control-plane-redesign.md#62-selector (move): Successor unheaded-block-42 to 62-selector (183-183): section 6.2 lines 197-200 claim execute --for is capability-aware (cli.mjs:1081-1093 refuses it) and attribute bind() to a Rust-host door (bind is Node run.mjs:404). The corrected current successor at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#62-selector now states the code-checked boundary in 6.2 Selector; evidence: src/runner/dispatch/cli.mjs:1081-1098; src/runner/execution/run.mjs:395-416. The disposition move and carriage carrier stay unchanged. This is a pending current-text rebinding, not a new file move, retirement or inherited approval. The source claim ID/digest and its accepted complete historical carriage are retained; the full shown target digest is renewed and requires independent targeted review.

### Genuine historical source

```text
Current implementation note: `execute --for` already resolves through the
capability-aware path that honors `capabilities.<name>.prefer`.
`decide --for` still uses the older `for` scan. Item 0 below exists to
remove that split.
```

### Current target

```text
### 6.2 Selector

The selector is caller input, not the mechanism result.

Allowed selector types:

- `work` - dispatch decision for a lifecycle work item.
- `purpose` - dispatch decision for a named capability/purpose.
- `executor` - dispatch decision for a concrete executor id.
- `assignment` - dispatch decision for an actual Assignment or its id.
- `adHocAgent` - dispatch decision for a runtime-composed agent assignment.

Do not add `nativeTask` as a selector. Native/in-process is an output mechanism, not an input category.

Legacy `decide --for` resolves a purpose first; `execute --for` is refused.
Execution uses the resolved executor ID positionally (`dispatch/cli.mjs:1081-1096`).
The Node Execution Core uses `bind()`; the Rust host does not directly call this
JavaScript resolver. Do not equate this proposal with every host representation.
```

## Retired successor: claim_29768201e6d5a5c215e3a7e4a25873c3

docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-64 -> docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#72-policy-resolution-before-dispatchplan

Native source digest: 9ef8c86adc6b48a1b019c1597695d4ec0f546ae79f52d4f819025bac1bcd464c

Native target digest: 1b8bad3a28b92a56bcefee746276e3cabf955f0361653f49b152dd5b720d5dd0

Source witness commit: d23045c2de83e3508fda8fd2580b43ece2e1e046 (stored reviewed source witness); raw shown source SHA256 9ef8c86adc6b48a1b019c1597695d4ec0f546ae79f52d4f819025bac1bcd464c; raw shown target SHA256 fa0931df22b0c3241d4b8629f862c9299f7157357028c85aef26bc1fb227f6d3.

Disposition move; status pending. The committed reviewer rejected this specific binding: [changed older binding] proposals/dispatch-control-plane-redesign.md#unheaded-block-64 -> proposals/dispatch-control-plane-redesign.md#72-policy-resolution-before-dispatchplan (move): Successor unheaded-block-64 to 72-policy-resolution-before-dispatchplan (252-252): section 7.2 uses retired minTier (lines 300, 302), unioned constraints (assignment-policy.mjs:459-462 overrides) and appended fallbacks (assignment-policy.mjs:380-388 reserved-not-executed). The corrected current successor at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#72-policy-resolution-before-dispatchplan now states the code-checked boundary in 7.2 Policy Resolution Before DispatchPlan; evidence: src/runner/dispatch/assignment-policy.mjs:220-243; src/runner/dispatch/assignment-policy.mjs:380-388; src/runner/dispatch/assignment-policy.mjs:457-466; src/runner/rigor.mjs:4-21. The disposition move and carriage carrier stay unchanged. This is a pending current-text rebinding, not a new file move, retirement or inherited approval. The source claim ID/digest and its accepted complete historical carriage are retained; the full shown target digest is renewed and requires independent targeted review.

### Genuine historical source

```text
The resulting `DispatchPlan.execution` carries the concrete model and adapter.
The workflow does not need to hardcode a provider to prove team coordination.
```

### Current target

````text
### 7.2 Policy Resolution Before DispatchPlan

Team dispatch adds one layer before `DispatchPlan`: an effective execution
policy resolver.

```txt
stage operation + role + persona + work + assignment + human override
  -> effective dispatch policy
  -> DispatchPlan
  -> governance
  -> transport
```

This policy resolver must not become a second dispatch mechanism. It prepares
the selector and execution hints that the existing dispatch resolver already
understands.

Canonical specificity order:

```txt
Global defaults
-> Domain defaults
-> Workflow defaults
-> Stage defaults
-> Stage operation / taskSpec defaults
-> Role defaults
-> Persona defaults
-> Work-item policy
-> Assignment explicit policy
-> Human / CLI explicit override
-> Governance gate
```

Different fields resolve differently:

| Field family | Rule |
|---|---|
| Constraints | operation constraints override the assignment-skills base (`assignment-policy.mjs:459-462`), not a union |
| Provider / executor preference | highest-specificity wins |
| Fallback executors | only the most specific declared list is recorded; reserved-not-executed here, with no broader append (`assignment-policy.mjs:380-388`) |
| Tier / rigor | strongest required tier wins |
| Model name | resolve from provider/model policy after effective provider and tier are known |
| Literal model name | assignment or human/CLI override only |
| Governance / egress | final gate, never bypassed by policy |

Example:

```txt
operation reviewer requires rigor=standard
operation validate-plan prefers persona=code-reviewer
work.rigor=critical raises the effective rigor
assignment prefers executor=claude
governance checks effective egress
```

The current compiled plan exposes policy-derived `tier`, `model`, `providerModel`, `provenance` and `policy` alongside the resolved `invocation`; there is no `DispatchPlan.execution` wrapper.
The workflow does not need to hardcode a provider to prove team coordination.
````

## Retired successor: claim_3bffcfe4496d0fec611c2d4cdfbf9149

docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-66 -> docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#73-recommended-v1-provider-policy-for-coding-feature-flow

Native source digest: 2412915baaeaf954feeedcf5626584850738338e31925686869b456a495cf773

Native target digest: cdcee4bf1cc904e4d7fc101b37de8008fbe974562c3bcc2ab782690fef29913b

Source witness commit: d23045c2de83e3508fda8fd2580b43ece2e1e046 (stored reviewed source witness); raw shown source SHA256 2412915baaeaf954feeedcf5626584850738338e31925686869b456a495cf773; raw shown target SHA256 c3b100684b202fdb32e4617eea7f7189e363712124574625c545c8076eb50f88.

Disposition move; status pending. The committed reviewer rejected this specific binding: [changed older binding] proposals/dispatch-control-plane-redesign.md#unheaded-block-66 -> proposals/dispatch-control-plane-redesign.md#73-recommended-v1-provider-policy-for-coding-feature-flow (move): Successor unheaded-block-66 to 73-recommended-v1-provider-policy-for-coding-feature-flow (310-310): section 7.3 lines 313-314 tell readers to use the historical table as defaults, contradicting its own historical label (pi and agy-cli are not registered executors). The corrected current successor at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#73-recommended-v1-provider-policy-for-coding-feature-flow now states the code-checked boundary in 7.3 Recommended V1 Provider Policy For Coding Feature Flow; evidence: src/runner/dispatch/resolve.mjs:255-309. The disposition move and carriage carrier stay unchanged. This is a pending current-text rebinding, not a new file move, retirement or inherited approval. The source claim ID/digest and its accepted complete historical carriage are retained; the full shown target digest is renewed and requires independent targeted review.

### Genuine historical source

```text
| Stage | Operation | Preferred execution | Rationale |
|---|---|---|---|
| planning | `shape-plan` | `claude` / Claude `sonnet` | plan synthesis and tradeoff writing are the current stable default path |
| planning | `resolve-question` | `pi` / OpenAI-Codex `gpt-5.5` | independent consult benefits from provider diversity; `pi` has a verified JSON cli-spawn path |
| planning | `scout-blast-radius` | `gitnexus`, then `pi` if synthesis is needed | graph/tool evidence should precede model judgment |
| planning | `validate-plan` | `claude` / `sonnet`, raise to `opus` for critical work | review/proving should be evidence-first and may need stronger rigor |
| executing | `implement-item` | `agy-cli` / Gemini `gemini-3.6-flash-medium` | current repo config already pins `fgos-coding-implement` to the stable headless agy path |
| executing | `review-item` | `claude` / `sonnet`, raise to `opus` for critical work | separate reviewer from implementation provider where possible |
| executing | `fix-verify-red` | `claude` for diagnosis, `agy-cli` for bounded edits | root-cause work and mechanical fix work have different execution needs |
| executing | `scoped-subtask` | `agy-cli` or `pi` | bounded helper work should use a cheaper/fast executor when evidence gates are clear |
```

### Current target

```text
### 7.3 Recommended V1 Provider Policy For Coding Feature Flow

Historical recommendations for the first proof, not current config defaults or
globally required execution order. The table's `pi`, `agy-cli` and old model
names are dated examples. Current checked project configuration declares
`claude`, `glm`, `gitnexus`, `herdr`, `openai`, `gemini`, `xai`, `deepseek`,
`claude-herdr`, `glm-herdr`; coding implementation prefers `gemini` with the
named invocation `agy-herdr-mucdong`. Effective global/project merge and
binding, not this table, decide a live request.

The table records dated proof recommendations only. It supplies neither current
defaults nor live bindings; use effective configuration and binding for execution.

| Stage | Operation | Preferred execution | Rationale |
|---|---|---|---|
| planning | `shape-plan` | `claude` / Claude `sonnet` | plan synthesis and tradeoff writing are the current stable default path |
| planning | `resolve-question` | `pi` / OpenAI-Codex `gpt-5.5` | independent consult benefits from provider diversity; `pi` has a verified JSON cli-spawn path |
| planning | `scout-blast-radius` | `gitnexus`, then `pi` if synthesis is needed | graph/tool evidence should precede model judgment |
| planning | `validate-plan` | `claude` / `sonnet`, raise to `opus` for critical work | review/proving should be evidence-first and may need stronger rigor |
| executing | `implement-item` | dated `agy-cli` / Gemini example | original proof recommendation; not the current project executor id or headless-path claim |
| executing | `review-item` | `claude` / `sonnet`, raise to `opus` for critical work | separate reviewer from implementation provider where possible |
| executing | `fix-verify-red` | `claude` for diagnosis, `agy-cli` for bounded edits | root-cause work and mechanical fix work have different execution needs |
| executing | `scoped-subtask` | `agy-cli` or `pi` | bounded helper work should use a cheaper/fast executor when evidence gates are clear |

The original cli-spawn-first proof restriction is historical. Current transport
selection follows configuration/bind and the authorized proof track; Herdr
visibility does not become semantic completion evidence.
```

## Retired successor: claim_f07d01d9479baf2c23835b14f4038768

docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-67 -> docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#73-recommended-v1-provider-policy-for-coding-feature-flow

Native source digest: 5bf2f51a1882af2dbf452174845056de8d783ab64fa05f66a1511bd59eedb8d2

Native target digest: cdcee4bf1cc904e4d7fc101b37de8008fbe974562c3bcc2ab782690fef29913b

Source witness commit: d23045c2de83e3508fda8fd2580b43ece2e1e046 (stored reviewed source witness); raw shown source SHA256 5bf2f51a1882af2dbf452174845056de8d783ab64fa05f66a1511bd59eedb8d2; raw shown target SHA256 c3b100684b202fdb32e4617eea7f7189e363712124574625c545c8076eb50f88.

Disposition move; status pending. The committed reviewer rejected this specific binding: [changed older binding] proposals/dispatch-control-plane-redesign.md#unheaded-block-67 -> proposals/dispatch-control-plane-redesign.md#73-recommended-v1-provider-policy-for-coding-feature-flow (move): Successor unheaded-block-67 to 73-recommended-v1-provider-policy-for-coding-feature-flow (310-310): section 7.3 lines 313-314 tell readers to use the historical table as defaults, contradicting its own historical label (pi and agy-cli are not registered executors). The corrected current successor at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#73-recommended-v1-provider-policy-for-coding-feature-flow now states the code-checked boundary in 7.3 Recommended V1 Provider Policy For Coding Feature Flow; evidence: src/runner/dispatch/resolve.mjs:255-309. The disposition move and carriage carrier stay unchanged. This is a pending current-text rebinding, not a new file move, retirement or inherited approval. The source claim ID/digest and its accepted complete historical carriage are retained; the full shown target digest is renewed and requires independent targeted review.

### Genuine historical source

```text
Do not use `agy-herdr`, `codex-herdr`, or other interactive Herdr paths as the
authority for the first team proof. They can be tried later as visibility
adapters after cli-spawn assignment execution and evidence handling are stable.
```

### Current target

```text
### 7.3 Recommended V1 Provider Policy For Coding Feature Flow

Historical recommendations for the first proof, not current config defaults or
globally required execution order. The table's `pi`, `agy-cli` and old model
names are dated examples. Current checked project configuration declares
`claude`, `glm`, `gitnexus`, `herdr`, `openai`, `gemini`, `xai`, `deepseek`,
`claude-herdr`, `glm-herdr`; coding implementation prefers `gemini` with the
named invocation `agy-herdr-mucdong`. Effective global/project merge and
binding, not this table, decide a live request.

The table records dated proof recommendations only. It supplies neither current
defaults nor live bindings; use effective configuration and binding for execution.

| Stage | Operation | Preferred execution | Rationale |
|---|---|---|---|
| planning | `shape-plan` | `claude` / Claude `sonnet` | plan synthesis and tradeoff writing are the current stable default path |
| planning | `resolve-question` | `pi` / OpenAI-Codex `gpt-5.5` | independent consult benefits from provider diversity; `pi` has a verified JSON cli-spawn path |
| planning | `scout-blast-radius` | `gitnexus`, then `pi` if synthesis is needed | graph/tool evidence should precede model judgment |
| planning | `validate-plan` | `claude` / `sonnet`, raise to `opus` for critical work | review/proving should be evidence-first and may need stronger rigor |
| executing | `implement-item` | dated `agy-cli` / Gemini example | original proof recommendation; not the current project executor id or headless-path claim |
| executing | `review-item` | `claude` / `sonnet`, raise to `opus` for critical work | separate reviewer from implementation provider where possible |
| executing | `fix-verify-red` | `claude` for diagnosis, `agy-cli` for bounded edits | root-cause work and mechanical fix work have different execution needs |
| executing | `scoped-subtask` | `agy-cli` or `pi` | bounded helper work should use a cheaper/fast executor when evidence gates are clear |

The original cli-spawn-first proof restriction is historical. Current transport
selection follows configuration/bind and the authorized proof track; Herdr
visibility does not become semantic completion evidence.
```

## Retired successor: claim_15cac2a9bbfbbffc9af1c2dc16b5415a

docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#7-agent-result-schema -> docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#7-agent-result-schema

Native source digest: b62841ac251963f3384c9cb2db74e6c3df5579d39869c29fe4a96fa25b5dd47a

Native target digest: 8c063fe72e95edc2dc765531eb12e520d28afac9f0fee9dc309f221b3e95b15f

Source witness commit: d23045c2de83e3508fda8fd2580b43ece2e1e046 (stored reviewed source witness); raw shown source SHA256 2f53bb9660924f94b45a8be4d630ec157d9f1396de174f8be57841a0bc95e458; raw shown target SHA256 2f4a6f53fd826569ac2e5e3580a8e8469df16367656a6e25968e6443074fb53a.

Disposition move; status pending. The committed reviewer rejected this specific binding: [changed older binding] proposals/team-communication-protocol-v1.md#7-agent-result-schema -> proposals/team-communication-protocol-v1.md#7-agent-result-schema (move): identity 7-agent-result-schema moved to 7-agent-result-schema: target anchor carries defective text: section 7 minimal schema and field table are partly not true now: no-evidence requires only a non-empty summary in agent-result-claim-contract.mjs CLAIM_FIELD_RULES (no reason field), and nextRecommendedOperation appears nowhere in src, packages, apps, bin, core or domains The corrected current successor at docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#7-agent-result-schema now states the code-checked boundary in 7. Agent Result Schema; evidence: src/runner/dispatch/agent-result-claim-contract.mjs:5-30; src/runner/dispatch/agent-result-claim-contract.mjs:52-90. The disposition move and carriage carrier stay unchanged. This is a pending current-text rebinding, not a new file move, retirement or inherited approval. The source claim ID/digest and its accepted complete historical carriage are retained; the full shown target digest is renewed and requires independent targeted review.

### Genuine historical source

````text
## 7. Agent Result Schema

`agent-result.json` is the worker's structured claim. It is not proof by
itself.

Minimal schema:

```json
{
  "status": "done",
  "summary": "One concise result sentence.",
  "findings": [],
  "evidenceRefs": [],
  "nextRecommendedOperation": null
}
```

Allowed status values:

| Status | Meaning |
|---|---|
| `done` | The worker believes the assignment objective is complete. |
| `blocked` | The worker could not complete because a named blocker remains. |
| `failed` | The worker attempted the assignment and produced an error or invalid output. |
| `no-evidence` | The worker can report context but cannot support a completion claim. |

Required fields by status:

| Status | Required fields |
|---|---|
| `done` | `summary`; at least one `evidenceRefs` entry or a companion `agent-report.md` for read-only work; external git/artifact evidence for mutating work. |
| `blocked` | `summary`; `blocker`; `evidenceRefs` when any evidence exists. |
| `failed` | `summary`; `error`. |
| `no-evidence` | `summary`; reason why evidence is absent. |

Optional `nextRecommendedOperation` may name another legal stage operation, but
it is only a recommendation. The driver must verify legality before acting.
````

### Current target

````text
## 7. Agent Result Schema

`agent-result.json` is the worker's structured claim. It is not proof by
itself.

Minimal v2 reviewer claim (reviewer/red-team and recheck contexts require
`assessment.verdict`; agent-result-claim-contract.mjs:5-30,81-85):

```json
{
  "contract": { "id": "agent-result-claim", "version": 2 },
  "status": "done",
  "summary": "One concise result sentence.",
  "findings": [],
  "evidenceRefs": [],
  "assessment": { "verdict": "pass" }
}
```

Allowed status values:

| Status | Meaning |
|---|---|
| `done` | The worker believes the assignment objective is complete. |
| `blocked` | The worker could not complete because a named blocker remains. |
| `failed` | The worker attempted the assignment and produced an error or invalid output. |
| `no-evidence` | The worker can report context but cannot support a completion claim. |

Required fields by status:

| Status | Required fields |
|---|---|
| `done` | `summary`; read-only acceptance requires a companion worker report artifact, not just `evidenceRefs`; mutating acceptance requires appropriate external delta evidence. See run-result.mjs:1276-1285 and assignment.mjs:881-898. |
| `blocked` | `summary`; `blocker`; `evidenceRefs` when any evidence exists. |
| `failed` | `summary`; `error`. |
| `no-evidence` | Non-empty `summary`; there is no additional reason field in the validator (`agent-result-claim-contract.mjs:9-15,67-85`). |

`nextRecommendedOperation` is a proposed optional extension, not a current
validated schema field or a field the Work-layer caller presently consumes.
````

## Retired successor: claim_742532532aa9e696db78cb285b8b2178

docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-32 -> docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#7-agent-result-schema

Native source digest: 546c59ef10ff886d2fd256b488c6193c117c59d5e82632dbb8c14b30cd072efc

Native target digest: 8c063fe72e95edc2dc765531eb12e520d28afac9f0fee9dc309f221b3e95b15f

Source witness commit: d23045c2de83e3508fda8fd2580b43ece2e1e046 (stored reviewed source witness); raw shown source SHA256 546c59ef10ff886d2fd256b488c6193c117c59d5e82632dbb8c14b30cd072efc; raw shown target SHA256 2f4a6f53fd826569ac2e5e3580a8e8469df16367656a6e25968e6443074fb53a.

Disposition move; status pending. The committed reviewer rejected this specific binding: [changed older binding] proposals/team-communication-protocol-v1.md#unheaded-block-32 -> proposals/team-communication-protocol-v1.md#7-agent-result-schema (move): identity unheaded-block-32 moved to 7-agent-result-schema: target anchor carries defective text: section 7 minimal schema and field table are partly not true now: no-evidence requires only a non-empty summary in agent-result-claim-contract.mjs CLAIM_FIELD_RULES (no reason field), and nextRecommendedOperation appears nowhere in src, packages, apps, bin, core or domains The corrected current successor at docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#7-agent-result-schema now states the code-checked boundary in 7. Agent Result Schema; evidence: src/runner/dispatch/agent-result-claim-contract.mjs:5-30; src/runner/dispatch/agent-result-claim-contract.mjs:52-90. The disposition move and carriage carrier stay unchanged. This is a pending current-text rebinding, not a new file move, retirement or inherited approval. The source claim ID/digest and its accepted complete historical carriage are retained; the full shown target digest is renewed and requires independent targeted review.

### Genuine historical source

```text
Optional `nextRecommendedOperation` may name another legal stage operation, but
it is only a recommendation. The driver must verify legality before acting.
```

### Current target

````text
## 7. Agent Result Schema

`agent-result.json` is the worker's structured claim. It is not proof by
itself.

Minimal v2 reviewer claim (reviewer/red-team and recheck contexts require
`assessment.verdict`; agent-result-claim-contract.mjs:5-30,81-85):

```json
{
  "contract": { "id": "agent-result-claim", "version": 2 },
  "status": "done",
  "summary": "One concise result sentence.",
  "findings": [],
  "evidenceRefs": [],
  "assessment": { "verdict": "pass" }
}
```

Allowed status values:

| Status | Meaning |
|---|---|
| `done` | The worker believes the assignment objective is complete. |
| `blocked` | The worker could not complete because a named blocker remains. |
| `failed` | The worker attempted the assignment and produced an error or invalid output. |
| `no-evidence` | The worker can report context but cannot support a completion claim. |

Required fields by status:

| Status | Required fields |
|---|---|
| `done` | `summary`; read-only acceptance requires a companion worker report artifact, not just `evidenceRefs`; mutating acceptance requires appropriate external delta evidence. See run-result.mjs:1276-1285 and assignment.mjs:881-898. |
| `blocked` | `summary`; `blocker`; `evidenceRefs` when any evidence exists. |
| `failed` | `summary`; `error`. |
| `no-evidence` | Non-empty `summary`; there is no additional reason field in the validator (`agent-result-claim-contract.mjs:9-15,67-85`). |

`nextRecommendedOperation` is a proposed optional extension, not a current
validated schema field or a field the Work-layer caller presently consumes.
````

## Retired successor: claim_3817494a9443f5b9be5b1b3aa22613ad

docs/platform/agent-coordination/architecture/protocol-model.md#unheaded-block-15 -> docs/platform/agent-coordination/architecture/protocol-model.md#compatibility

Native source digest: 4173ec263ab82dbec1cc0138083b9a13debc8821030f94a08e26c81680068e0c

Native target digest: 7a6f9fa240fe911d210c903743ef5ea8a41beddd2ad5bd0898c2fc524a4ea4ba

Source witness commit: 96a13ab21670e1f5d9748c02cd615ea5598b53f5^ (recomputed from genuine parent of retirement commit); raw shown source SHA256 4173ec263ab82dbec1cc0138083b9a13debc8821030f94a08e26c81680068e0c; raw shown target SHA256 21a1dd556a8c10fcc2a3b8aa2149152bacf605c97661681fdc5d3cfd20a1c276.

Disposition supersede; status pending. The committed reviewer rejected this specific binding: [new successor] architecture/protocol-model.md#unheaded-block-15 -> architecture/protocol-model.md#compatibility (supersede): retired-unit successor now at compatibility (lines 103-103): that anchor still carries the inaccurate statement that skill compatibility projection derives from step.operations while skillForStep reads step.skill (src/workflow/steps.mjs:50-52) The corrected current successor at docs/platform/agent-coordination/architecture/protocol-model.md#compatibility now states the code-checked boundary in Compatibility; evidence: src/workflow/steps.mjs:43-85. The disposition supersede and carriage carrier stay unchanged. This is a pending current-text rebinding, not a new file move, retirement or inherited approval. The source claim ID/digest and its accepted complete historical carriage are retained; the full shown target digest is renewed and requires independent targeted review.

### Genuine historical source

```text
This compatibility path remains mandatory for Work-attached declared workflows.
Adding an agent-led path must not weaken or reinterpret it.
```

### Current target

```text
## Compatibility

`taskSpecForStep` selects the primary normalized `step.operations` entry (or the
first); `skillForStep` reads `step.skill` separately and falls back to a declared
status skill (`src/workflow/steps.mjs:52-63`). Neither projects both values from
an operation. Compatibility remains a projection, not permission to weaken the
mandatory declared-operation, transition or evidence constraints. The existing
`operationsForStep`/`isLegalStepMove` projections preserve declared legality
(`steps.mjs:44-45,67-85`); they do not restore the retired Work-stage or engine.

The exact normalized contract is defined in
[Workflow Stage Operation Contract](../contracts/workflow-stage-operation.md).
```

## Retired successor: claim_1f29a0c78fd1c3b7572bd0327faeea7f

docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-42 -> docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#62-selector

Native source digest: 4bd5619af16c5af92c73c6d5a88ff22c8b1dfdde3298ba450703e150d2b83d7f

Native target digest: f74896a55ec95145a488a4d4f78d23c0498357b944441ca192f35ecb38247d3a

Source witness commit: 96a13ab21670e1f5d9748c02cd615ea5598b53f5^ (recomputed from genuine parent of retirement commit); raw shown source SHA256 4bd5619af16c5af92c73c6d5a88ff22c8b1dfdde3298ba450703e150d2b83d7f; raw shown target SHA256 5438778e2e47a3b8b1ae4508b5d31eb532f2250e72471fc8bb045249ba64304d.

Disposition supersede; status pending. The committed reviewer rejected this specific binding: [new successor] proposals/dispatch-control-plane-redesign.md#unheaded-block-42 -> proposals/dispatch-control-plane-redesign.md#62-selector (supersede): Successor unheaded-block-42 to 62-selector (183-183): section 6.2 lines 197-200 claim execute --for is capability-aware (cli.mjs:1081-1093 refuses it) and attribute bind() to a Rust-host door (bind is Node run.mjs:404). The corrected current successor at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#62-selector now states the code-checked boundary in 6.2 Selector; evidence: src/runner/dispatch/cli.mjs:1081-1098; src/runner/execution/run.mjs:395-416. The disposition supersede and carriage carrier stay unchanged. This is a pending current-text rebinding, not a new file move, retirement or inherited approval. The source claim ID/digest and its accepted complete historical carriage are retained; the full shown target digest is renewed and requires independent targeted review.

### Genuine historical source

```text
- `work` - dispatch decision for a lifecycle work item.
- `purpose` - dispatch decision for a named capability/purpose.
- `executor` - dispatch decision for a concrete executor id.
- `adHocAgent` - dispatch decision for a runtime-composed agent assignment.
```

### Current target

```text
### 6.2 Selector

The selector is caller input, not the mechanism result.

Allowed selector types:

- `work` - dispatch decision for a lifecycle work item.
- `purpose` - dispatch decision for a named capability/purpose.
- `executor` - dispatch decision for a concrete executor id.
- `assignment` - dispatch decision for an actual Assignment or its id.
- `adHocAgent` - dispatch decision for a runtime-composed agent assignment.

Do not add `nativeTask` as a selector. Native/in-process is an output mechanism, not an input category.

Legacy `decide --for` resolves a purpose first; `execute --for` is refused.
Execution uses the resolved executor ID positionally (`dispatch/cli.mjs:1081-1096`).
The Node Execution Core uses `bind()`; the Rust host does not directly call this
JavaScript resolver. Do not equate this proposal with every host representation.
```

## Retired successor: claim_df2c20fabb1be2139694a4220887c87f

docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-44 -> docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#62-selector

Native source digest: 7f4a913cd40a582883a10dce9a4fcab6023b655dd4ab28fc88a4ae43d0c0f717

Native target digest: f74896a55ec95145a488a4d4f78d23c0498357b944441ca192f35ecb38247d3a

Source witness commit: 96a13ab21670e1f5d9748c02cd615ea5598b53f5^ (recomputed from genuine parent of retirement commit); raw shown source SHA256 7f4a913cd40a582883a10dce9a4fcab6023b655dd4ab28fc88a4ae43d0c0f717; raw shown target SHA256 5438778e2e47a3b8b1ae4508b5d31eb532f2250e72471fc8bb045249ba64304d.

Disposition supersede; status pending. The committed reviewer rejected this specific binding: [new successor] proposals/dispatch-control-plane-redesign.md#unheaded-block-44 -> proposals/dispatch-control-plane-redesign.md#62-selector (supersede): Successor unheaded-block-44 to 62-selector (183-183): section 6.2 lines 197-200 claim execute --for is capability-aware (cli.mjs:1081-1093 refuses it) and attribute bind() to a Rust-host door (bind is Node run.mjs:404). The corrected current successor at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#62-selector now states the code-checked boundary in 6.2 Selector; evidence: src/runner/dispatch/cli.mjs:1081-1098; src/runner/execution/run.mjs:395-416. The disposition supersede and carriage carrier stay unchanged. This is a pending current-text rebinding, not a new file move, retirement or inherited approval. The source claim ID/digest and its accepted complete historical carriage are retained; the full shown target digest is renewed and requires independent targeted review.

### Genuine historical source

```text
Current implementation note: `execute --for` already resolves through the
capability-aware path that honors `capabilities.<name>.prefer`.
`decide --for` still uses the older `for` scan. Item 0 below exists to
remove that split.
```

### Current target

```text
### 6.2 Selector

The selector is caller input, not the mechanism result.

Allowed selector types:

- `work` - dispatch decision for a lifecycle work item.
- `purpose` - dispatch decision for a named capability/purpose.
- `executor` - dispatch decision for a concrete executor id.
- `assignment` - dispatch decision for an actual Assignment or its id.
- `adHocAgent` - dispatch decision for a runtime-composed agent assignment.

Do not add `nativeTask` as a selector. Native/in-process is an output mechanism, not an input category.

Legacy `decide --for` resolves a purpose first; `execute --for` is refused.
Execution uses the resolved executor ID positionally (`dispatch/cli.mjs:1081-1096`).
The Node Execution Core uses `bind()`; the Rust host does not directly call this
JavaScript resolver. Do not equate this proposal with every host representation.
```

## Retired successor: claim_69b011aac8a371496f54e1c681286bfd

docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-32 -> docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-33

Native source digest: eb3336c5f0bc349a94bf04af7437d8fd2eefcf6e62208fe4a904b90187900a96

Native target digest: 4e1c2461b173b04586958e31079f42f54ec11bf937385817b3c4d55eb289ff18

Source witness commit: a4e132ccd01e2b20a0e6c874ec5b4d6fbb5781e2 (stored reviewed source witness); raw shown source SHA256 eb3336c5f0bc349a94bf04af7437d8fd2eefcf6e62208fe4a904b90187900a96; raw shown target SHA256 4e1c2461b173b04586958e31079f42f54ec11bf937385817b3c4d55eb289ff18.

Disposition supersede; status pending. Pending successor accounting under A13 shape and the explicit A22 authorization: the authorized section correction in f4bc8027ff2ef34b7c7c1b084330b62fdcbc353f replaces the former unit with this code-checked counterpart. Every claim remains accounted; unchanged whole-source historical carriage retains the old text. Source/target shown texts and native digests are pinned; independent targeted review is required with no approval carry.

### Genuine historical source

```text
| Status | Required fields |
|---|---|
| `done` | `summary`; read-only acceptance requires a companion worker report artifact, not just `evidenceRefs`; mutating acceptance requires appropriate external delta evidence. See run-result.mjs:1276-1285 and assignment.mjs:881-898. |
| `blocked` | `summary`; `blocker`; `evidenceRefs` when any evidence exists. |
| `failed` | `summary`; `error`. |
| `no-evidence` | `summary`; reason why evidence is absent. |
```

### Current target

```text
| Status | Required fields |
|---|---|
| `done` | `summary`; read-only acceptance requires a companion worker report artifact, not just `evidenceRefs`; mutating acceptance requires appropriate external delta evidence. See run-result.mjs:1276-1285 and assignment.mjs:881-898. |
| `blocked` | `summary`; `blocker`; `evidenceRefs` when any evidence exists. |
| `failed` | `summary`; `error`. |
| `no-evidence` | Non-empty `summary`; there is no additional reason field in the validator (`agent-result-claim-contract.mjs:9-15,67-85`). |
```

## Retired successor: claim_424bbeb8e8fe53a80b03440fb53ae248

docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-35 -> docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-36

Native source digest: 09432ca4e37e6469053ef9ae2f7931a444dd0b05c9d58a2fe25d34daede483f6

Native target digest: 21cfbd22dd0b30278cfb44f38652360d02071c1a40a437cf07a59415fc28e29e

Source witness commit: a4e132ccd01e2b20a0e6c874ec5b4d6fbb5781e2 (stored reviewed source witness); raw shown source SHA256 09432ca4e37e6469053ef9ae2f7931a444dd0b05c9d58a2fe25d34daede483f6; raw shown target SHA256 21cfbd22dd0b30278cfb44f38652360d02071c1a40a437cf07a59415fc28e29e.

Disposition supersede; status pending. Pending successor accounting under A13 shape and the explicit A22 authorization: the authorized section correction in f4bc8027ff2ef34b7c7c1b084330b62fdcbc353f replaces the former unit with this code-checked counterpart. Every claim remains accounted; unchanged whole-source historical carriage retains the old text. Source/target shown texts and native digests are pinned; independent targeted review is required with no approval carry.

### Genuine historical source

```text
Confidence ladder:

| Confidence | Meaning | Allowed use |
|---|---|---|
| `verified` | Structured claim plus post-run external evidence such as a new commit, new changed file, test artifact, or verified result file. | May feed lifecycle decisions that require proof. |
| `reported` | Structured claim plus a worker-produced report for read-only consult/review work. | May feed driver judgment, but should not close mutating work. |
| `inferred` | Post-run external evidence exists but no structured claim exists. | May be surfaced for inspection; driver should avoid automatic lifecycle movement. |
| `no-evidence` | Process settled without proof. | Must not advance Work. |
| `failed` | Timeout, nonzero exit, signal, invalid schema, or explicit failure. | Must not advance Work. |
```

### Current target

```text
Confidence ladder:

| Confidence | Meaning | Allowed use |
|---|---|---|
| `verified` | Structured claim plus post-run external evidence such as a new commit, new changed file, test artifact, or verified result file. | May feed lifecycle decisions that require proof. |
| `reported` | A blocked claim, even without a companion report; or a read-only done claim with a worker report; or a failed findings verdict with a report and exit 0 (`run-result.mjs:1261-1278`). | May feed driver judgment, but should not close mutating work; status remains separate from confidence. |
| `inferred` | Post-run external evidence exists but no structured claim exists. | May be surfaced for inspection; driver should avoid automatic lifecycle movement. |
| `no-evidence` | Process settled without proof. | Must not advance Work. |
| `failed` | Timeout, nonzero exit, signal, invalid claim, read-only mutation, or a failed claim not qualifying for the reported findings branch (`run-result.mjs:1250-1271`). | Must not advance Work; an explicit failure is not always failed confidence. |
```

## Corrected receipt: claim_c184e4b1b804109a870238397b1e5c0d

Previous rejected identity: claim_2aa3c23733d8b93963a053ffb0fe88e9

docs/platform/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-10; class candidate-native-content; native digest b053393c73b2fe8eecad5f35e7cb87c2e6a31830b02fec1c22fb6aad1ea85013; shown-text digest b053393c73b2fe8eecad5f35e7cb87c2e6a31830b02fec1c22fb6aad1ea85013.

Current evidence (commit a4e132ccd01e2b20a0e6c874ec5b4d6fbb5781e2): src/runner/dispatch/resolve.mjs:25-66 [2049c05b94a245826c0b630ab22305369cab4301]; src/runner/dispatch/resolve.mjs:255-309 [2049c05b94a245826c0b630ab22305369cab4301].

The reviewer must recompute evidenceDigest from the committed receipt currentEvidence object and include it in the seventh verdict column, using the existing JSON serialization/hash contract.

````text
```txt
capability   — abstract behavior promise, bound only by
               runner.capabilities.<capability>.prefer;
               executor for[] declarations do not bind this selector
executor-id  — explicit concrete implementation override, naming a
               runner.executors.<id> entry directly
```
````

## Corrected receipt: claim_c70a8a1ffd7d36e49b31d6296cc31356

Previous rejected identity: claim_682a5f07ad5939ff2de7ff33df5c4d0d

docs/platform/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-29; class candidate-native-content; native digest 1caa4692d9e293493a1d62621aaf6d38a4f18bbfb6ca354dcfae2aadaf132710; shown-text digest 1caa4692d9e293493a1d62621aaf6d38a4f18bbfb6ca354dcfae2aadaf132710.

Current evidence (commit a4e132ccd01e2b20a0e6c874ec5b4d6fbb5781e2): src/runner/dispatch/resolve.mjs:25-66 [2049c05b94a245826c0b630ab22305369cab4301]; src/runner/dispatch/resolve.mjs:255-309 [2049c05b94a245826c0b630ab22305369cab4301].

The reviewer must recompute evidenceDigest from the committed receipt currentEvidence object and include it in the seventh verdict column, using the existing JSON serialization/hash contract.

```text
1. **Request normalizer (design)** — the normalized target/policy/provenance
   boundary is proposed; current inputs are the compiler options above.
2. **Capability binding resolver** — `resolveExecutorAndOverrides` binds literal
   executor IDs/defaults or capability `prefer`; aliases and executor `for[]`
   inform capability labels separately in `resolveCapabilityDetailsFromHints`
   (`resolve.mjs:25-66,255-278`), not this binding resolver.
3. **Executor registry resolver** — resolves a literal executor-id to its
   concrete invocation/tool/agent shape (`resolveExecutorConfig`).
4. **Policy resolver** — `resolveAssignmentDispatchPolicy`; owns supported
   provider/model/rigor/tier derivation and provenance, not a `mergePolicyStack`.
5. **Governance resolver** — checks egress/provider/executor/content
   constraints (cross-provider gate, `allowCrossProvider`, `carries`).
6. **Mechanism resolver** — decides in-process/out-of-process/unavailable
   and MCP/tool handback (`decideDispatchMechanism`,
   `decideExecutorDispatchMechanism`).
7. **DispatchPlan compiler** — `compileDispatchPlan()` joins the legacy
   dispatch decisions. Unit execution first obtains its binding through
   `bind()`; assignment-runner revalidates that binding and compiles the
   governed execution plan. The domain harness owns neither choice.
8. **Run runtime/adapters** — creates, launches, observes, settles, and
   retries a Run without choosing semantic operation
   (`assignment-runner.mjs`, `transport.mjs`, `herdr-round.mjs`).
```

## Corrected receipt: claim_7158d119de266633a36b11d20e5691ca

Previous rejected identity: claim_ed1015c8067fc73022c6207480b7be6c

docs/platform/agent-coordination/architecture/evidence-and-results.md#unheaded-block-9; class candidate-native-content; native digest 5e9b2ae62fe7b6f3018ff335c99a951584349e79eda9afcfbe82847b011001c2; shown-text digest 5e9b2ae62fe7b6f3018ff335c99a951584349e79eda9afcfbe82847b011001c2.

Current evidence (commit a4e132ccd01e2b20a0e6c874ec5b4d6fbb5781e2): src/runner/dispatch/run-result.mjs:149-160 [a08dc676045d3775598287963ff8c157b5fabcba]; src/runner/dispatch/run-result.mjs:290-302 [a08dc676045d3775598287963ff8c157b5fabcba]; src/runner/dispatch/run-result.mjs:1250-1285 [a08dc676045d3775598287963ff8c157b5fabcba]; src/runner/dispatch/agent-result-claim-contract.mjs:52-90 [20c9d63d1e0795bb4860ef1298037cc467d92095].

The reviewer must recompute evidenceDigest from the committed receipt currentEvidence object and include it in the seventh verdict column, using the existing JSON serialization/hash contract.

```text
- Worker self-report alone cannot produce externally verified confidence (src/runner/dispatch/run-result.mjs:1276-1285).
- Exit code zero cannot satisfy missing semantic outputs: the evidence floor still requires the appropriate worker report or external delta (src/runner/dispatch/run-result.mjs:1250-1285).
- Pre-existing dirty files cannot count as changes produced by the Run (src/runner/dispatch/evidence-attribution.mjs:55-70).
- RunResult records with another Run's identity are rejected (src/runner/dispatch/run-result.mjs:153-157,295-299). This is not a worker-claim runId check: agent-result-claim-contract.mjs:52-90 validates claim shape without that identity check. Delta attribution uses the current Run's pre/post state; it is not a general age-based stale-evidence validator.
- Read-only output may remain `reported`; the runtime gates this by assignment.mutation === read-only, not an unstamped TaskSpec permission (src/runner/dispatch/assignment.mjs:938-940; run-result.mjs:1276-1285).
- Mutating success requires post-run external evidence appropriate to the claim (src/runner/dispatch/run-result.mjs:1276-1285).
- Missing required reports/deltas yield `no-evidence` under the evidence floor (src/runner/dispatch/run-result.mjs:1276-1285); corrupt result records fail closed separately (run-result.mjs:1305-1333).
```

## Corrected receipt: claim_091368258f4931d473b31d516b89c947

Previous rejected identity: claim_c38d4d6fc5810bbfaa8c4a72237f4ad6

docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-8; class candidate-native-content; native digest 1c0a4a5d251c3061179f8bc7e7edf2dabcd89b552c6c17f5c497c01934647448; shown-text digest 1c0a4a5d251c3061179f8bc7e7edf2dabcd89b552c6c17f5c497c01934647448.

Current evidence (commit a4e132ccd01e2b20a0e6c874ec5b4d6fbb5781e2): src/runner/dispatch/herdr-round.mjs:341-359 [2a31f0e1bd7eb571f1fbe130fbc8c2a399772074]; src/runner/recovery.mjs:105-112 [a2272b4a665b8d366932129cd91fd5f3b6f4014f].

The reviewer must recompute evidenceDigest from the committed receipt currentEvidence object and include it in the seventh verdict column, using the existing JSON serialization/hash contract.

```text
The order and behavior in `src/runner/dispatch/liveness.mjs` are ported:
1. Worker result file beats all runtime readings; it still requires normalization.
2. Blocked beats timeout in the ladder, but the Herdr adapter maps `blocked` to `worker-timeout` (`herdr-round.mjs:346-357`); the recovery matrix may retry it (`src/runner/recovery.mjs:105-107`). Answering the existing question without retry is the proposed correction, not current end-to-end behavior.
3. Death requires consecutive absent readings (default 3); unknown/present reset.
4. Absolute ceiling follows truth/blocked/death and is not reduced by blind time.
5. Idle/stale evaluation subtracts blind time; working is progress even with
   zero stdout. Screen reads are requested at the stale boundary, and an early
   credential probe also runs after fifteen seconds of non-working idle time
   (`liveness.mjs:267-299`). Thus screen reads are not stale-only.
```

## Corrected receipt: claim_1ecdf78c605a84acd3cc9e32cfb55b17

Previous rejected identity: claim_9f33a05cb18260b107f84fedb23e43e6

docs/platform/agent-coordination/architecture/group-thinking-trigger-surface.md#unheaded-block-8; class candidate-native-content; native digest 3b351ebe037306b9ffbae3548788db1f0264229081e9ecc843a2527ad842a844; shown-text digest 3b351ebe037306b9ffbae3548788db1f0264229081e9ecc843a2527ad842a844.

Current evidence (commit a4e132ccd01e2b20a0e6c874ec5b4d6fbb5781e2): core/skills/fgos-panel/SKILL.md:36-59 [4cac45e1e900ad4078a5323dc4511771c661c3ad].

The reviewer must recompute evidenceDigest from the committed receipt currentEvidence object and include it in the seventh verdict column, using the existing JSON serialization/hash contract.

```text
This candidate map reflects the current routes in `core/skills/fgos-panel/SKILL.md:45-59`; it is not yet the skill's linked authority. The skill still links the legacy docs/architect taxonomy at lines 36-39. Repointing that consumer belongs to the authorized link cutover, not this truth pass. The current execution owners below are Workflow/CollaborationPattern owners, not a second sequencer; the former protocol-id mapping is historical.
```

## Corrected receipt: claim_aa0e400354f9f0b2a32e90249880fa78

Previous rejected identity: claim_67986b1f7f6936bd5f59616ff9673066

docs/platform/agent-coordination/architecture/protocol-model.md#unheaded-block-14; class candidate-native-content; native digest c8463e48e9ef816b0cfbc19d1f67f93ab9cbc9205cacf2c1342758bf4849c651; shown-text digest c8463e48e9ef816b0cfbc19d1f67f93ab9cbc9205cacf2c1342758bf4849c651.

Current evidence (commit a4e132ccd01e2b20a0e6c874ec5b4d6fbb5781e2): src/workflow/steps.mjs:43-85 [90c81d9d050c8494ba92c3b64c92a0b83a50ba15].

The reviewer must recompute evidenceDigest from the committed receipt currentEvidence object and include it in the seventh verdict column, using the existing JSON serialization/hash contract.

```text
`taskSpecForStep` selects the primary normalized `step.operations` entry (or the
first); `skillForStep` reads `step.skill` separately and falls back to a declared
status skill (`src/workflow/steps.mjs:52-63`). Neither projects both values from
an operation. Compatibility remains a projection, not permission to weaken the
mandatory declared-operation, transition or evidence constraints. The existing
`operationsForStep`/`isLegalStepMove` projections preserve declared legality
(`steps.mjs:44-45,67-85`); they do not restore the retired Work-stage or engine.
```

## Corrected receipt: claim_0e3108e30bde66b9c650906df3fa1ac4

Previous rejected identity: claim_1f1b240d7141fa749fe2cc481a832166

docs/platform/agent-coordination/architecture/runtime-recovery-design.md#unheaded-block-28; class candidate-native-content; native digest 05b63ae72bb5df95d3b060a075c93ecb1a35b8c31b61cbb72d7a3bfbd4d3d455; shown-text digest 05b63ae72bb5df95d3b060a075c93ecb1a35b8c31b61cbb72d7a3bfbd4d3d455.

Current evidence (commit a4e132ccd01e2b20a0e6c874ec5b4d6fbb5781e2): src/runner/dispatch/herdr-reconcile.mjs:351-361 [6ded05f28a310963ed7ceccbf794a50b42780a75].

The reviewer must recompute evidenceDigest from the committed receipt currentEvidence object and include it in the seventh verdict column, using the existing JSON serialization/hash contract.

```text
| Slice | Scope | Exit evidence; dependency | Status (2026-09-14) |
|---|---|---|---|
| S0 | Freeze fixtures for existing ladder, budgets, retry/recheck, context and close behavior | Existing Node suites green; capture known deficiencies without marking them solved. | **Implemented** — P00 |
| S1 | Versioned Run admission, strict publish fencing and local lock/reclaim | Concurrent admission and every pre-launch crash window; no two winners. Node first. | **Implemented** — P01 (`run-lock.mjs`) |
| S2 | Herdr launch reconciliation, handle guard, pending-control reconciliation, material capture | Reattach/observe/reconcile through the public door; isolated or read-only takeover only. Launch identity uses `runId` plus persisted `launchCommandId` (`fgos-<runId>-<launchCommandId>`); duplicate-name refusal and no resurrection after close require adapter proof. | **Partial** — Herdr launch reconciliation exists in `herdr-reconcile.mjs`; the proposed RunHandle/scope guard, pending-control reconciliation and RecoveryMaterial capture are not implemented as that contract. Writable partial-edit takeover remains deferred (`herdr-reconcile.mjs:356-357`). |
| S3 | Eligible fallback through compiler and confinement | Same Assignment, bounded attempts, unknown effects park; depends on S1/S2 for takeover. | **Implemented** — P03 (`recovery.mjs`) |
| S4 | Pure snapshot/planner + show | Can develop beside S1-S3 using recorded facts; no claim of automatic repair. | **Implemented** — P04 (pure evaluators) + P05 (standalone `dispatch recover`) |
| S5 | Retired coordination-session recovery/continuation | Full dated record remains in the historical snapshot; no current coordination recover door is claimed. | Retired in 2180b4e72 |
| S6 | Additional runtime/operation adapters and optional checkpoint support | Capability-specific proof before enabling; no promise all adapters ship with S2. | **Not implemented** — out of this track's scope |
| S7 | Rust writer port | Same fixtures for all supported Node semantics, sole writer and recovery compatibility. | **Not implemented** — separate track (see the `rust-host-r1-kernel` track) |
```

## Corrected receipt: claim_d04f3528ac32bc6a0a67ecc6153e7879

Previous rejected identity: claim_f549746262cbe0bc8566ba7d02276a01

docs/platform/agent-coordination/decisions/ADR-006-assignment-provenance-and-contract-snapshot.md#unheaded-block-5; class candidate-native-content; native digest d09a8989b69759b769951f393428fd895fc22f0583d212568e684c0016fbaaa7; shown-text digest d09a8989b69759b769951f393428fd895fc22f0583d212568e684c0016fbaaa7.

Current evidence (commit a4e132ccd01e2b20a0e6c874ec5b4d6fbb5781e2): src/runner/dispatch/execution-contract.mjs:337-384 [ac3a26083e375666764c7c722d615c308032e99b].

The reviewer must recompute evidenceDigest from the committed receipt currentEvidence object and include it in the seventh verdict column, using the existing JSON serialization/hash contract.

```text
1. **Three current provenance kinds, one execution path.** Declared and inline
   builders stamp `contractPolicyVersion`, `normalizerVersion` and validator
   provenance (`assignment.mjs:456-459,663-666`). The Unit door separately writes
   `provenance.kind: unit-run` with its Unit-run context (`execution/run.mjs:334-338`);
   do not assert every kind has the declared builder's identical shape.
   - `declared`: Workflow step/operation/TaskSpec validation and normalization.
   - `inline`: foundation contract validation, the applicable registered domain
     harness and caller provenance.
   - `unit-run`: the Unit execution door and its computed binding/admission.
2. **Normalizer stamps the snapshot.** At build time the normalizer stamps
   `mutation` (`read-only | mutating`) and `evidence.required`
   (`reported | verified`) onto the immutable Assignment. Declared operations
   use operation tables with role/mutation-derived fallbacks for unmapped
   operations (`assignment-normalizer.mjs:95-124`); inline contracts must declare
   mutation/evidence explicitly. Missing required inline values fail validation.
3. **Interpretation reads the Assignment, not the operation id.** Result
   confidence gating, mutation policy, and post-advance behavior are driven by
   Assignment fields. Declared `resultKind` and optional `onAdvance` use the
   normalizer tables, with advisory/work-product fallback from mutation
   (`assignment-normalizer.mjs:120-143`). These are not arbitrary accepted
   inline-contract fields.
4. **Validated inline fields.** `objective`, `contextRefs`, `constraints`,
   `expectedOutputs`, `mutation`, `evidence`, required `role` and `budget`;
   optional `capabilities`, `supports`, `contractTemplate` and narrow `policy`.
   Budget requires positive integer `timeoutMs` and `maxRuns`; optional `tokens`
   is telemetry, not an enforced limit (`execution-contract.mjs:345-346,371-382`);
   inline policy accepts only
   `tier`, not a full PolicyPatch. Caller fields are validated separately
   (`execution-contract.mjs:180-240,295-340`). Unknown fields are rejected.
5. **Same execution governance.** Declared, inline and Unit-run requests
   converge on Assignment execution and Run/RunResult normalization rather than
   private dispatch or stores that bypass governance.
6. **Current mutation admission, not the retired first slice.** Generic inline mutation validation still requires the reserved protocol-operation stamp (`execution-contract.mjs:327-334`, `assignment-normalizer.mjs:173-175`), but the engine that produced that stamp was retired. The current Unit-run mutating door uses the worktree and recomputed-binding checks described in docs/specs/runner.md:3057. Do not present the dormant stamp path as a current general session-runtime door.
```

## Corrected receipt: claim_91bec036d1df34df7924809fa939ae59

Previous rejected identity: claim_dda1473c66642b13b3d87ae99112bbe9

docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-8; class candidate-native-content; native digest 0530d671094f0f95ccdfb47f4ccaf57ca23dd14d81dea229521dff2780f55241; shown-text digest 0530d671094f0f95ccdfb47f4ccaf57ca23dd14d81dea229521dff2780f55241.

Current evidence (commit a4e132ccd01e2b20a0e6c874ec5b4d6fbb5781e2): core/workflows/architecture-advisory.yaml:8-84 [b410140108c30e0617bfe1ca9993dcd069cc99d1].

The reviewer must recompute evidenceDigest from the committed receipt currentEvidence object and include it in the seventh verdict column, using the existing JSON serialization/hash contract.

```text
The worked examples use the vnflow EOD/intraday evolution question. They do not
include a worked mdview desktop-shell ownership case. Using a concrete case is
intentional — invented examples drift toward the abstract, and abstraction is
exactly what this document exists to resist.
```

## Corrected receipt: claim_6cd9705f2760c29f75a66f4eecb4046a

Previous rejected identity: claim_234030992ffddc4c851737f160598406

docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-45; class candidate-native-content; native digest bd60334f471ae1b0a64ab99250dce208e670359f72a4edee670f4fe1bc0507bb; shown-text digest bd60334f471ae1b0a64ab99250dce208e670359f72a4edee670f4fe1bc0507bb.

Current evidence (commit a4e132ccd01e2b20a0e6c874ec5b4d6fbb5781e2): src/runner/dispatch/cli.mjs:1081-1098 [490ccb1893634f830278ebf608f3549f98d31897]; src/runner/execution/run.mjs:395-416 [98ab4b4c2124285530c3ff676e6eb2864c6baef2].

The reviewer must recompute evidenceDigest from the committed receipt currentEvidence object and include it in the seventh verdict column, using the existing JSON serialization/hash contract.

```text
Legacy `decide --for` resolves a purpose first; `execute --for` is refused.
Execution uses the resolved executor ID positionally (`dispatch/cli.mjs:1081-1096`).
The Node Execution Core uses `bind()`; the Rust host does not directly call this
JavaScript resolver. Do not equate this proposal with every host representation.
```

## Corrected receipt: claim_241d8e8d42387c28dc30179f1bad66cb

Previous rejected identity: claim_69b011aac8a371496f54e1c681286bfd

docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-33; class candidate-native-content; native digest 4e1c2461b173b04586958e31079f42f54ec11bf937385817b3c4d55eb289ff18; shown-text digest 4e1c2461b173b04586958e31079f42f54ec11bf937385817b3c4d55eb289ff18.

Current evidence (commit a4e132ccd01e2b20a0e6c874ec5b4d6fbb5781e2): src/runner/dispatch/agent-result-claim-contract.mjs:5-30 [20c9d63d1e0795bb4860ef1298037cc467d92095]; src/runner/dispatch/agent-result-claim-contract.mjs:52-90 [20c9d63d1e0795bb4860ef1298037cc467d92095].

The reviewer must recompute evidenceDigest from the committed receipt currentEvidence object and include it in the seventh verdict column, using the existing JSON serialization/hash contract.

```text
| Status | Required fields |
|---|---|
| `done` | `summary`; read-only acceptance requires a companion worker report artifact, not just `evidenceRefs`; mutating acceptance requires appropriate external delta evidence. See run-result.mjs:1276-1285 and assignment.mjs:881-898. |
| `blocked` | `summary`; `blocker`; `evidenceRefs` when any evidence exists. |
| `failed` | `summary`; `error`. |
| `no-evidence` | Non-empty `summary`; there is no additional reason field in the validator (`agent-result-claim-contract.mjs:9-15,67-85`). |
```

## Corrected receipt: claim_cac936814ecd91348f05fc00c22b785d

Previous rejected identity: claim_7f0c45d81af34cef52d8a3c35ed31aaf

docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-34; class candidate-native-content; native digest b82381ad2bd1e6aaf44a30dec3392f6f835858834be3be8b4fe6849e8bf25b0d; shown-text digest b82381ad2bd1e6aaf44a30dec3392f6f835858834be3be8b4fe6849e8bf25b0d.

Current evidence (commit a4e132ccd01e2b20a0e6c874ec5b4d6fbb5781e2): src/runner/dispatch/agent-result-claim-contract.mjs:5-30 [20c9d63d1e0795bb4860ef1298037cc467d92095]; src/runner/dispatch/agent-result-claim-contract.mjs:52-90 [20c9d63d1e0795bb4860ef1298037cc467d92095].

The reviewer must recompute evidenceDigest from the committed receipt currentEvidence object and include it in the seventh verdict column, using the existing JSON serialization/hash contract.

```text
`nextRecommendedOperation` is a proposed optional extension, not a current
validated schema field or a field the Work-layer caller presently consumes.
```

## Corrected receipt: claim_0b372cfd0ef95d2afd339badfe67ea0a

Previous rejected identity: claim_0b372cfd0ef95d2afd339badfe67ea0a

docs/platform/agent-coordination/vocabulary/canonical-concepts.md#stance; class candidate-native-content; native digest 880c39ba956eea4e56074fa44cb88a6c771452f58d9bfa0404834d63f40ee470; shown-text digest bfd0de71c4c8d55d7859fb955fdf4bdf63e468cf2ca6a8f092ed4a7c8a35a86d.

Current evidence (commit a4e132ccd01e2b20a0e6c874ec5b4d6fbb5781e2): src/runner/execution/patterns/role-tasks.mjs:58-72 [7f7097b6f580c000e5b3f8c358b71b9a5fe8cf14]; src/runner/execution/unit-summary.mjs:17-28 [67b0d90161d6a5fac28c9889bce1023a0643c6ff].

The reviewer must recompute evidenceDigest from the committed receipt currentEvidence object and include it in the seventh verdict column, using the existing JSON serialization/hash contract.

```text
### Stance

A temporary argumentative viewpoint. Passive panelist stance measurement is implemented: `stanceOptions` elicits an optional choice/confidence claim, and the Unit summary validates it (`src/runner/execution/patterns/role-tasks.mjs:61-70`, `unit-summary.mjs:17-28`); it does not affect pass/fail. A broader cognitive/session-state stance entity or routing identity remains design vocabulary, not a shipped SessionActor model.
```

## Corrected receipt: claim_8448a27d29416253fd0105f943bc9b82

Previous rejected identity: claim_0326d4bce87b812bde7a5c3c87f096c6

docs/platform/agent-coordination/vocabulary/canonical-concepts.md#unheaded-block-26; class candidate-native-content; native digest fa955fd843b1e5476c55fa41c58ce988c9a2ed21d12405880b77767052038fdf; shown-text digest fa955fd843b1e5476c55fa41c58ce988c9a2ed21d12405880b77767052038fdf.

Current evidence (commit a4e132ccd01e2b20a0e6c874ec5b4d6fbb5781e2): src/runner/execution/patterns/role-tasks.mjs:58-72 [7f7097b6f580c000e5b3f8c358b71b9a5fe8cf14]; src/runner/execution/unit-summary.mjs:17-28 [67b0d90161d6a5fac28c9889bce1023a0643c6ff].

The reviewer must recompute evidenceDigest from the committed receipt currentEvidence object and include it in the seventh verdict column, using the existing JSON serialization/hash contract.

```text
A temporary argumentative viewpoint. Passive panelist stance measurement is implemented: `stanceOptions` elicits an optional choice/confidence claim, and the Unit summary validates it (`src/runner/execution/patterns/role-tasks.mjs:61-70`, `unit-summary.mjs:17-28`); it does not affect pass/fail. A broader cognitive/session-state stance entity or routing identity remains design vocabulary, not a shipped SessionActor model.
```

## Unchanged ordinal witness: claim_57f26b5acbd6bb500ca353f84f486488

docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-41 -> #unheaded-block-42. Native digest 538e8cefb7885ba1fd52c8a4b9dc39cdd9b13edc851f8b83dd1b48a0670fd4c8; ancestry ["Team Communication Protocol V1","10. Coding-Domain Workflow Step Operations","10.1 Discovery"]; retained committed report 947f6169e826564b6e00bafb8a0535ec2ff6f0ea. This is proof re-confirmation, not a new source judgment or an approval on changed text.

### Source

```text
Allowed behavior:

- owner reads existing Work context;
- owner consults researcher helpers for evidence;
- owner logs consult interactions;
- owner chooses `clear` or `unclear`;
- `clear` can route to planning;
- `unclear` routes to exploring.
```

### Unchanged target

```text
Allowed behavior:

- owner reads existing Work context;
- owner consults researcher helpers for evidence;
- owner logs consult interactions;
- owner chooses `clear` or `unclear`;
- `clear` can route to planning;
- `unclear` routes to exploring.
```

## Unchanged ordinal witness: claim_78524c36c6f57c543377be47620d748c

docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-42 -> #unheaded-block-43. Native digest b343cb615e796f69b45669066da04a200bb366f9071bba646a4b1a546a9ce565; ancestry ["Team Communication Protocol V1","10. Coding-Domain Workflow Step Operations","10.1 Discovery"]; retained committed report 947f6169e826564b6e00bafb8a0535ec2ff6f0ea. This is proof re-confirmation, not a new source judgment or an approval on changed text.

### Source

```text
Forbidden behavior:

- asking the human directly;
- parking as `awaiting-human`;
- treating a helper's unsupported answer as proof;
- opening a new Work item just to answer a bounded evidence question.
```

### Unchanged target

```text
Forbidden behavior:

- asking the human directly;
- parking as `awaiting-human`;
- treating a helper's unsupported answer as proof;
- opening a new Work item just to answer a bounded evidence question.
```

## Unchanged ordinal witness: claim_242208b542d4bb24c84796f43f775d4a

docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-43 -> #unheaded-block-44. Native digest 8be1c52fac778e783278a3fa17f78a4cf05b675f7111d46bc5930dd19a2bce63; ancestry ["Team Communication Protocol V1","10. Coding-Domain Workflow Step Operations","10.2 Exploring"]; retained committed report 947f6169e826564b6e00bafb8a0535ec2ff6f0ea. This is proof re-confirmation, not a new source judgment or an approval on changed text.

### Source

```text
Exploring is the human-adjacent decision-locking stage.
```

### Unchanged target

```text
Exploring is the human-adjacent decision-locking stage.
```

## Unchanged ordinal witness: claim_88cf23510b37d2048b1a578efc2ebb10

docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-44 -> #unheaded-block-45. Native digest 6c2c64a1d48e2d1dca430f0811e612771eda3379e19731d984b3c5ea8b042013; ancestry ["Team Communication Protocol V1","10. Coding-Domain Workflow Step Operations","10.2 Exploring"]; retained committed report 947f6169e826564b6e00bafb8a0535ec2ff6f0ea. This is proof re-confirmation, not a new source judgment or an approval on changed text.

### Source

```text
Allowed behavior:

- advisor interaction for material, grounded, answerable product questions;
- researcher consult for repo or external facts;
- lock decisions into CONTEXT.md.
```

### Unchanged target

```text
Allowed behavior:

- advisor interaction for material, grounded, answerable product questions;
- researcher consult for repo or external facts;
- lock decisions into CONTEXT.md.
```

## Unchanged ordinal witness: claim_abb60eb206ce120877cc9c06f826ab57

docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-45 -> #unheaded-block-46. Native digest 6e5cc24269ba7cf4ebfdf5bb8062990d284cd999b1d8462e36c55d28713910f2; ancestry ["Team Communication Protocol V1","10. Coding-Domain Workflow Step Operations","10.2 Exploring"]; retained committed report 947f6169e826564b6e00bafb8a0535ec2ff6f0ea. This is proof re-confirmation, not a new source judgment or an approval on changed text.

### Source

```text
Exploring may ask a human. It should ask only after machine evidence has been
gathered and the question is self-contained.
```

### Unchanged target

```text
Exploring may ask a human. It should ask only after machine evidence has been
gathered and the question is self-contained.
```

## Unchanged ordinal witness: claim_a6f71d465ebccd696428b94ff6f664af

docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-46 -> #unheaded-block-47. Native digest 14807360bce011d160261d7194fbcc2cf445f6a0722f072d50101af54d78d3b9; ancestry ["Team Communication Protocol V1","10. Coding-Domain Workflow Step Operations","10.3 Planning"]; retained committed report 947f6169e826564b6e00bafb8a0535ec2ff6f0ea. This is proof re-confirmation, not a new source judgment or an approval on changed text.

### Source

```text
Planning has two main operation families:
```

### Unchanged target

```text
Planning has two main operation families:
```

## Unchanged ordinal witness: claim_6b4789439adfb6eb3b05c85b7ed8f7e0

docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-47 -> #unheaded-block-48. Native digest f40aa8cbca5552bcf674388b44a555d1c431f1abab5c218961744a0c77968db0; ancestry ["Team Communication Protocol V1","10. Coding-Domain Workflow Step Operations","10.3 Planning"]; retained committed report 947f6169e826564b6e00bafb8a0535ec2ff6f0ea. This is proof re-confirmation, not a new source judgment or an approval on changed text.

### Source

```text
- `shape-plan` by implementer;
- `validate-plan` by reviewer.
```

### Unchanged target

```text
- `shape-plan` by implementer;
- `validate-plan` by reviewer.
```

## Unchanged ordinal witness: claim_8b79ab2d01c7ce85912eb9f0a25bf3ea

docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-49 -> #unheaded-block-50. Native digest 999fd62d2ac5bba2d830abbc5aa0e3057ed2a35f727a9ef390bdffe41c60714e; ancestry ["Team Communication Protocol V1","10. Coding-Domain Workflow Step Operations","10.3 Planning"]; retained committed report 947f6169e826564b6e00bafb8a0535ec2ff6f0ea. This is proof re-confirmation, not a new source judgment or an approval on changed text.

### Source

```text
`validate-plan` is a real reviewer-role operation when dispatched through
Assignment. Prose that says validating is only an implementer function must be
reconciled before driver adoption.
```

### Unchanged target

```text
`validate-plan` is a real reviewer-role operation when dispatched through
Assignment. Prose that says validating is only an implementer function must be
reconciled before driver adoption.
```

## Unchanged ordinal witness: claim_e16b56644d520a0fe0a4cd6b40c2459a

docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-50 -> #unheaded-block-51. Native digest 62f1292eb44e2dd4af3c1ccde7a1a7247ae0febf11739444e8b377e233d40a1b; ancestry ["Team Communication Protocol V1","10. Coding-Domain Workflow Step Operations","10.4 Executing"]; retained committed report 947f6169e826564b6e00bafb8a0535ec2ff6f0ea. This is proof re-confirmation, not a new source judgment or an approval on changed text.

### Source

```text
Executing has the richest team protocol:
```

### Unchanged target

```text
Executing has the richest team protocol:
```

## Unchanged ordinal witness: claim_a86887b78fbc23319db13f3bf4816dd8

docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-51 -> #unheaded-block-52. Native digest 3db147178920207776ed26ad024fdfc3cb509d1839901116d0693f322f8f6bca; ancestry ["Team Communication Protocol V1","10. Coding-Domain Workflow Step Operations","10.4 Executing"]; retained committed report 947f6169e826564b6e00bafb8a0535ec2ff6f0ea. This is proof re-confirmation, not a new source judgment or an approval on changed text.

### Source

```text
- implementer owns the main edit path;
- researcher may answer blast-radius or API/pattern questions;
- helper may take independent scoped work;
- reviewer may review returned diffs or candidate fixes;
- advisor handles product/scope questions that exceed locked decisions.
```

### Unchanged target

```text
- implementer owns the main edit path;
- researcher may answer blast-radius or API/pattern questions;
- helper may take independent scoped work;
- reviewer may review returned diffs or candidate fixes;
- advisor handles product/scope questions that exceed locked decisions.
```

## Unchanged ordinal witness: claim_fad0d749adc5ef611ee344c16b7c661e

docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-52 -> #unheaded-block-53. Native digest 3c902b0dddbee64c10302bbe2fa05b431d4ee1236b7c925bf4ba6d10a1859962; ancestry ["Team Communication Protocol V1","10. Coding-Domain Workflow Step Operations","10.4 Executing"]; retained committed report 947f6169e826564b6e00bafb8a0535ec2ff6f0ea. This is proof re-confirmation, not a new source judgment or an approval on changed text.

### Source

```text
The implementer remains responsible for Work lifecycle. Helper/reviewer
assignments return artifacts and recommendations unless explicitly promoted to
child Work.
```

### Unchanged target

```text
The implementer remains responsible for Work lifecycle. Helper/reviewer
assignments return artifacts and recommendations unless explicitly promoted to
child Work.
```

## Unchanged ordinal witness: claim_f7388f36e2422375b8acf615e169e8c3

docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-40 -> #unheaded-block-41. Native digest dce623d34c1aae45bf2a55698fd5befa24dafd26b62ff898bf34fee1e683896a; ancestry ["Team Communication Protocol V1","10. Coding-Domain Workflow Step Operations","10.1 Discovery"]; retained committed report 947f6169e826564b6e00bafb8a0535ec2ff6f0ea. This is proof re-confirmation, not a new source judgment or an approval on changed text.

### Source

```text
Discovery is machine-alone.
```

### Unchanged target

```text
Discovery is machine-alone.
```

## Unchanged ordinal witness: claim_007ac529305107d794a6aa0752c8fa85

docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-29 -> #unheaded-block-30. Native digest 17e9dc29da21e0e2df5f6e5e004fbe6b74a1cc0c9d34284c1dcdddc41e3e048c; ancestry ["Team Communication Protocol V1","7. Agent Result Schema"]; retained committed report 96a13ab21670e1f5d9748c02cd615ea5598b53f5. This is proof re-confirmation, not a new source judgment or an approval on changed text.

### Source

```text
Allowed status values:
```

### Unchanged target

```text
Allowed status values:
```

## Unchanged ordinal witness: claim_9797e67aadf80be198afbc69817c9ea2

docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-31 -> #unheaded-block-32. Native digest 9ef607d56f86c6bc94be4ced0016146ed19fb944f589fc01ce349378ad84a384; ancestry ["Team Communication Protocol V1","7. Agent Result Schema"]; retained committed report 96a13ab21670e1f5d9748c02cd615ea5598b53f5. This is proof re-confirmation, not a new source judgment or an approval on changed text.

### Source

```text
Required fields by status:
```

### Unchanged target

```text
Required fields by status:
```

## Unchanged ordinal witness: claim_d645da105a558068961c06e1d47aa9ee

docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-30 -> #unheaded-block-31. Native digest 5c43b0ba58e8b4ea86373ea1aae4b7c01a96ac7a88d4738a8e84814ca4b1b93d; ancestry ["Team Communication Protocol V1","7. Agent Result Schema"]; retained committed report 96a13ab21670e1f5d9748c02cd615ea5598b53f5. This is proof re-confirmation, not a new source judgment or an approval on changed text.

### Source

```text
| Status | Meaning |
|---|---|
| `done` | The worker believes the assignment objective is complete. |
| `blocked` | The worker could not complete because a named blocker remains. |
| `failed` | The worker attempted the assignment and produced an error or invalid output. |
| `no-evidence` | The worker can report context but cannot support a completion claim. |
```

### Unchanged target

```text
| Status | Meaning |
|---|---|
| `done` | The worker believes the assignment objective is complete. |
| `blocked` | The worker could not complete because a named blocker remains. |
| `failed` | The worker attempted the assignment and produced an error or invalid output. |
| `no-evidence` | The worker can report context but cannot support a completion claim. |
```

## Unchanged ordinal witness: claim_50cc0ff73dabd1642950365f358125c2

docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-34 -> #unheaded-block-35. Native digest f9a43ac823ac553c41f0f8734a247e9e88404201676f68476f9b003961fd475f; ancestry ["Team Communication Protocol V1","8. RunResult Confidence"]; retained committed report 96a13ab21670e1f5d9748c02cd615ea5598b53f5. This is proof re-confirmation, not a new source judgment or an approval on changed text.

### Source

```text
RunResult status and confidence are control-plane judgments.
```

### Unchanged target

```text
RunResult status and confidence are control-plane judgments.
```

## Unchanged ordinal witness: claim_34284834ad2dd8f5a0fc5a924b8196a5

docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-36 -> #unheaded-block-37. Native digest 9b769b73c2920816c9da55624eb71f9c6704bb633a32db6a0ba27d71aaef2e6a; ancestry ["Team Communication Protocol V1","8. RunResult Confidence"]; retained committed report 96a13ab21670e1f5d9748c02cd615ea5598b53f5. This is proof re-confirmation, not a new source judgment or an approval on changed text.

### Source

```text
The driver must treat `done/no-evidence` as not done. It may retry, ask for a
proper artifact, or route to a different legal operation.
```

### Unchanged target

```text
The driver must treat `done/no-evidence` as not done. It may retry, ask for a
proper artifact, or route to a different legal operation.
```

## Unchanged ordinal witness: claim_b602d530010f3b2f66ef5485bbff5bcb

docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-37 -> #unheaded-block-38. Native digest 45448dcaa1ce69055f61288526e27178ab68b9657ad3c6ea0471592547570269; ancestry ["Team Communication Protocol V1","9. Handoff Versus Assignment"]; retained committed report 96a13ab21670e1f5d9748c02cd615ea5598b53f5. This is proof re-confirmation, not a new source judgment or an approval on changed text.

### Source

```text
Use `handoff` when the interaction is a short role-axis record around work the
current session already performed or directly observed.
```

### Unchanged target

```text
Use `handoff` when the interaction is a short role-axis record around work the
current session already performed or directly observed.
```

## Unchanged ordinal witness: claim_c37da632abaadd051eff58492f71c8c7

docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-38 -> #unheaded-block-39. Native digest 5e110b497e1da92942a6973ad6b43884d4085ad25ae9ee9a6d23c44d8c63b6bd; ancestry ["Team Communication Protocol V1","9. Handoff Versus Assignment"]; retained committed report 96a13ab21670e1f5d9748c02cd615ea5598b53f5. This is proof re-confirmation, not a new source judgment or an approval on changed text.

### Source

```text
Use Assignment when:

- another executor, provider, role, or tool performs the action;
- the result will be read by a later driver turn;
- the result needs Run/RunResult evidence;
- the interaction may fail independently;
- a read-only consult/review needs an artifact rather than a one-line summary.
```

### Unchanged target

```text
Use Assignment when:

- another executor, provider, role, or tool performs the action;
- the result will be read by a later driver turn;
- the result needs Run/RunResult evidence;
- the interaction may fail independently;
- a read-only consult/review needs an artifact rather than a one-line summary.
```

## Unchanged ordinal witness: claim_c52e0d7342545a9365e507c17a99e946

docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-39 -> #unheaded-block-40. Native digest d804ea47af68c0aa6bcdc1058abb3dd934cfe47cfbc766e23bbed4772b98ad1f; ancestry ["Team Communication Protocol V1","9. Handoff Versus Assignment"]; retained committed report 96a13ab21670e1f5d9748c02cd615ea5598b53f5. This is proof re-confirmation, not a new source judgment or an approval on changed text.

### Source

```text
`handoff` remains useful for visibility and role-holder truth. It is not enough
evidence for a Team Dispatch operation once the result influences a lifecycle
decision.
```

### Unchanged target

```text
`handoff` remains useful for visibility and role-holder truth. It is not enough
evidence for a Team Dispatch operation once the result influences a lifecycle
decision.
```

## Unchanged ordinal witness: claim_f4f513bfd7ca5fd9708005243a624f95

docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-53 -> #unheaded-block-54. Native digest 99fd2729268c130f3b988b8833fb4ec10dedeb48094339156e687cba619bebb3; ancestry ["Team Communication Protocol V1","11. Coordination Operating Harness"]; retained committed report 96a13ab21670e1f5d9748c02cd615ea5598b53f5. This is proof re-confirmation, not a new source judgment or an approval on changed text.

### Source

```text
Multi-agent implementation benefits from a durable operating harness:
```

### Unchanged target

```text
Multi-agent implementation benefits from a durable operating harness:
```

## Unchanged ordinal witness: claim_b165c6ca3702ce5335599867e447ae55

docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-54 -> #unheaded-block-55. Native digest 3136bedc9eac77f08874328886bc22baa033ea44009227abad3fe36e05878c8f; ancestry ["Team Communication Protocol V1","11. Coordination Operating Harness"]; retained committed report 96a13ab21670e1f5d9748c02cd615ea5598b53f5. This is proof re-confirmation, not a new source judgment or an approval on changed text.

### Source

````text
```txt
trace/index.md
trace/current-cell.md
trace/<cell>.md
prompt templates
review and red-team gates
live proof capture
```
````

### Unchanged target

````text
```txt
trace/index.md
trace/current-cell.md
trace/<cell>.md
prompt templates
review and red-team gates
live proof capture
```
````

## Unchanged ordinal witness: claim_8b6511ceef7788eaaecfbe1c17de0ccf

docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-55 -> #unheaded-block-56. Native digest 68cb00b63900ec23e263a0a39ed605cf5e1f2a3a841467c8632d7f06e99f4264; ancestry ["Team Communication Protocol V1","11. Coordination Operating Harness"]; retained committed report 96a13ab21670e1f5d9748c02cd615ea5598b53f5. This is proof re-confirmation, not a new source judgment or an approval on changed text.

### Source

```text
This harness is documented in
[coordination-operating-harness.md](../playbooks/coordination-operating-harness.md). It is
supporting engineering practice, not Step 07 runtime infrastructure and not a
lifecycle system. Its job is to keep coordinator, doer, reviewer, and red-team
sessions aligned while preserving token budget and proof traceability.
```

### Unchanged target

```text
This harness is documented in
[coordination-operating-harness.md](../playbooks/coordination-operating-harness.md). It is
supporting engineering practice, not Step 07 runtime infrastructure and not a
lifecycle system. Its job is to keep coordinator, doer, reviewer, and red-team
sessions aligned while preserving token budget and proof traceability.
```

## Unchanged ordinal witness: claim_033a7b790516e8618c276525412173f8

docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-58 -> #unheaded-block-59. Native digest 734cc0979352c1a8d01a9e6c05a6fd4d544665459d9c6bdc8a3e71b9622321d5; ancestry ["Team Communication Protocol V1","13. Acceptance Criteria For V1 Protocol"]; retained committed report 96a13ab21670e1f5d9748c02cd615ea5598b53f5. This is proof re-confirmation, not a new source judgment or an approval on changed text.

### Source

```text
The protocol is ready for driver adoption when:
```

### Unchanged target

```text
The protocol is ready for driver adoption when:
```

## Unchanged ordinal witness: claim_6ed12fe83f43ad052bbcde7a88beee1d

docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-59 -> #unheaded-block-60. Native digest aaded8bcb540dd65483aeec1913efc98975a6a30b92a0e1dbcd6505a5f03e4ae; ancestry ["Team Communication Protocol V1","13. Acceptance Criteria For V1 Protocol"]; retained committed report 96a13ab21670e1f5d9748c02cd615ea5598b53f5. This is proof re-confirmation, not a new source judgment or an approval on changed text.

### Source

```text
- every runtime assignment receives an explicit result artifact path;
- malformed or missing structured claims cannot produce `verified` or
  `reported`;
- dirty-before files cannot be counted as post-run evidence;
- read-only operations can return `reported` only through worker artifacts;
- mutating operations require post-run external evidence;
- stage skills agree on when Assignment is used versus direct invocation;
- `validate-plan` role prose is consistent across skill and task-spec docs;
- discovery remains machine-alone.
```

### Unchanged target

```text
- every runtime assignment receives an explicit result artifact path;
- malformed or missing structured claims cannot produce `verified` or
  `reported`;
- dirty-before files cannot be counted as post-run evidence;
- read-only operations can return `reported` only through worker artifacts;
- mutating operations require post-run external evidence;
- stage skills agree on when Assignment is used versus direct invocation;
- `validate-plan` role prose is consistent across skill and task-spec docs;
- discovery remains machine-alone.
```

