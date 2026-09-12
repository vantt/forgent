Role: Specialist — long-horizon-continuation-designer (bounded question)
Author: codex-bwrap / openai-codex / gpt-5.6-terra / analytical
Authorized via specialist-answer-slot (specialistAuthorizationId
spec-auth-long-horizon-1) + authorize step (auth-specialist-long-horizon-1)
Dispatch: prompts/specialist-long-horizon.md -> runs/asgn_..._op_008/01
Revision: v1
Written: 2026-09-11 (Run settled; transcribed by coordinator 2026-09-12)

Full advisor output (primary record):
`.fgos/assignments/asgn_runtime_recovery_panel_coordinator_op_008/runs/01/agent-report.md`

## The third alternative: long-horizon writable/continuation (bounded)

Does NOT implement P06 writable takeover or S5/P07 continuation transfer.
Locks identity/ownership seams in S1-S4 now so those profiles can be added
through their declared write doors later, instead of retrofitting identity
after recovery behavior has already shipped.

### Lock now in S1-S4

**S1** — a single admitted-Run identity envelope for BOTH current execution
paths: `{runId, assignmentId, retryId/admissionKey, predecessorRunId,
payloadDigest, dispatchPlanDigest, generation, incarnation, workspaceRef?}`.
`workspaceRef?` is correlation only, never implicit ownership; a
`workspaceGrantRef?` is reserved on the replacement/takeover envelope, not
a general Assignment mutation, not write permission. Mostly a standard
answer (RunHandle/detailed-design already name most fields); situational
because the scout found two unintegrated mechanisms — the same durable
admission tuple and fencing must govern BOTH the CoordinationSession path
and the standalone Team-Dispatch path, not remain a timestamp/name-derived
exception on the second. If deferred: P06 must reopen admission identity,
retry linearization, replacement lineage; P07 must separately reconcile
child/import Run references against a different attempt scheme.

**S2** — `runId` as the adapter's durable launch identity; a versioned
launch record with `runId`, launch-request digest, gateway `agentSession`,
worker incarnation, locator state, optional lookup name (deterministic
name derived FROM `runId`, an aid, never authority). Reserve on
RunHandle/recovery material: writer role (driver/observer/replacement),
source Run IDs, material reference, workspace identity, optional grant
reference — descriptive/revalidation only, cannot authorize control
without a future workspace-grant issuer + quiescence proof. Repo-specific
required decision: thread `runId` through the real active route into
`herdr-round.mjs`, replacing `workId`+`Date.now()`. If deferred: P06
reopens the launch-record schema, adapter reconciliation signature,
locator migration, standalone wiring — risking a migration period where
legacy handle identity can't be joined to workspace lineage.

**S3** — keep effect boundary separate from workspace authority. Lock now:
declared `repeatMode`, declared outcome-affecting sinks, required dedup
identity per sink, evidence refs/outcomes (`proven|unknown`). Reserve
recovery material as immutable evidence (base digest, captured workspace
manifest, artifacts attributed to source Runs, writer-quiescence
coverage/proof, explicit capture omissions) — outside acceptance/quorum
truth, never a generic checkpoint/effect ledger. Standard contract
reservation (RunHandle already defines RecoveryMaterialV1). Situational:
P06's cumulative inherited-edit evaluator needs source attribution and
merge-base/material lineage, not only a replacement diff — if S3 ships
only a boolean-like fallback, writable takeover later must redesign the
capture/effect boundary and backfill unprovable old Runs.

**S4** — lock the snapshot/typed-plan interfaces to carry references, not
authority: current Run identity/generation/incarnation; recovery
status/evidence refs; workspace/grant availability as a typed fact;
material/lineage availability; continuation/transfer eligibility as a
typed unavailable/refusal fact. Planner may recommend park/recover/
observe/typed-refusal; must NOT mint workspace grants, choose a child
session, consume driver provenance, or append transfer events — existing
write doors revalidate the snapshot token/generation/grant at mutation
time. Reserve correlation fields for future continuation
(`parentEventId`, `parentCoordinationId`, `childRunId`, `grantId`,
`invocationKey`, `protocolVersion`) — meaningful only under a CP §6-amended
transfer event class; their presence must NOT permit terminal-parent
transfer now (AD-05's `transfer-unavailable` + premature-close hazard
stay current behavior). Situational: the scout could not confirm a single
existing `legalNext` evaluator (logic interleaved in mutating doors) —
long-horizon sizing should lock one pure evaluator output/schema plus
read/write parity now, not assume a transfer layer can bolt onto inline
mutation decisions later. If deferred: P07 reopens replay/versioning,
post-terminal event treatment, parent-child idempotency, public-plan
authority — not merely adds fields.

### Reopen later, deliberately (not built now)

The P06 workspace-grant repository/issuer, cross-Assignment workspace lock
scope, grant lifetime/consumption store, quiescence implementation,
merge-base resolver, material evaluator algorithm. No CP §6 amendment, no
post-terminal mutation events, no child sessions, no import-manifest
staging, no parent-scope freeze, no child budget allocation, no
prepare/gate/commit. Profile-specific work with its own proofs and gates.

### Adjacent risk (one, per the role's bounded mandate)

Not a missing reserved field — **preserving two identity/locking
regimes**. If S1/S2 declare the new envelope only for CoordinationSession
while the standalone Team-Dispatch/Herdr route keeps unlocked attempt
allocation and timestamp-derived launch names, later P06/P07 have no
trustworthy common predecessor identity at their integration point. Treat
unifying that path as a prerequisite to claiming the long-horizon seams
are actually locked.

### Effect on the other two candidates

Does not change the baseline-conservative or gateway-change conclusions.
It makes their deferral cost explicit: baseline can still defer these
seams but must acknowledge the named reopen/migration work; gateway-change
can still solve the `absent-proven` evidence gap, but gateway work alone
does not repair standalone Run identity/admission wiring.

---

**Coordinator note, corrected by the Phase 6 critic (proposals/
architecture-critic.md, Attack 4).** This coordinator originally called
this a "convergent finding across 4 independent sources." The critic
attacked that framing directly and it landed: this is a **citation
cascade, not independent re-derivation** — the specialist, system-shaper,
and constraint-advocate all had `scout-report.md` in their own reading
list, so agreeing with it is not the same as four independently arriving
at the same conclusion from separate evidence. Corrected framing: **one
real finding (the scout's), repeated without contradiction by three
readers who all trusted the same source** — a meaningfully weaker claim
than "convergence," though still not nothing: nobody who read the scout
report found reason to dispute it, and the constraint advocate's Phase 6
pass independently re-derives it as the single top-ranked shared risk
across all three candidates (not merely citing the scout, but reasoning
about its candidate-attachment consequences). The synthesizer should
treat this as one well-supported, unrebutted finding, not as
multi-source-triangulated fact.
