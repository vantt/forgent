# Constraint Advocate — Phase 5 candidate second pass

## Verdict

**NOT READY for an unqualified implementation handoff.** The baseline-conservative candidate is the only candidate that can become ready on the smallest credible path, but it must first close and prove the shared Assignment-scoped admission boundary. The gateway-change candidate has an additional authority/split-brain defect that makes it unsuitable as the first implementation profile. The long-horizon candidate is not an executable recovery profile; its reserved structure is acceptable only as non-authorizing, versioned, and unadvertised metadata.

“Ready” below means ready to implement a bounded, evidence-preserving recovery profile. It does not mean that automatic replacement, shared-writable takeover, terminal transfer, or broad effect replay may be advertised.

## Cross-candidate sink: one unfenced admission surface

**Magnitude: HIGH. Reversibility: code is reversible; duplicate prompts, provider spend, pane/process creation, and worker-side external effects are not.**

The live `executeAssignment` path historically allocated `runs/NN` by scanning directories and creating recursively. If two callers can reach it concurrently, each can launch a worker. A result/CAS fence only chooses the authoritative result after the effect; a deterministic resource name or gateway lookup also arrives too late to make the earlier duplicate effect disappear.

This is shared by all candidates unless the *actual* write door for both CoordinationSession-originated and standalone Team-Dispatch-V1 calls atomically publishes exactly one complete Run before adapter I/O. The required proof is a two-process, injected-crash F-f-style test through the production door, not a unit test of a new helper. It must cover initial admission, idempotent same-retry admission, competing retry tuples, retry-vs-cancel/result-link ordering, and stale controller settlement.

Mitigation: the S1/P01 v2 design is directionally sufficient if `executeAssignment` is proven to be the sole Assignment-launch boundary; publication must be exclusive/same-filesystem/fsynced, directory presence must never define admission, and locks must not span adapter I/O. Schema-1 remains on its legacy behavior and cannot silently opt into exact-retry recovery.

Residual: a process may remain live or unknown after controller failure; safe behavior is observe/park, not another launch. This residual is acceptable only when it is displayed as a typed status rather than hidden as a retry.

## Candidate: baseline conservative / system-shaper

### 1. v1 `run.json` field-add is a migration trap

**Magnitude: MEDIUM, rising to HIGH if any legacy reader uses field absence to decide admission, settlement, or replay. Reversibility: conditionally irreversible once a legacy reader has made a state transition from the new shape.**

Keeping `contract: assignment-run.v1` while adding `phase` and `supersedesRunId` gives old readers no protocol boundary on which to refuse or select compatibility behavior. The population is every existing reader of live and retained Run records, not merely a one-time migration. A field-absence branch can silently choose a different legacy path for newly emitted records.

Mitigation: do not ship the field-add form unless a complete reader audit and mixed-version fixtures prove unknown fields are ignored for all authority decisions. Prefer the specified `assignment-run.v2` writer profile: schema-1 records are read-only for recovery and fail closed when recovery fields are absent. New writers must never rewrite legacy records on read.

Residual: legacy runs remain inspectable through their declared legacy projection, but are not recoverable under v2 guarantees. That is safe and must be stated plainly.

### 2. Herdr name is correlation, not proof of resource identity

**Magnitude: MEDIUM; effects conditionally irreversible.** Deterministic `runId` naming improves lookup but does not prove that the returned pane/process is the submitted resource. An untested `herdr agent start <existing-name>` behavior (reuse, replace, or reject) can turn a retry into a pane hijack.

Mitigation: require a live production-door probe for duplicate-name semantics and adapter-proven resource incarnation before reattach/control. Persist the binding before prompt delivery; crash windows with missing/ambiguous binding park. Keep replacement disabled without `absent-proven`.

### 3. Inspection portability and RunResult compatibility are not optional polish

**Magnitude: MEDIUM. Reversibility: mostly reversible, but a nonportable diagnostic can induce an unsafe human action.** A filesystem-only `show` leaves a fresh operator unable to distinguish an admitted-but-unbound Run, a legacy Run, corrupt authoritative state, and a repairable projection. Nor may a new handle/receipt be treated as a normalized `RunResult` or as acceptance evidence.

Mitigation: `show-run` must be read-only and project contract/revision, Run phase, delivery tri-state, current control epoch, adapter capability, evidence provenance, and typed park/refusal. It must work without a live gateway and never refresh or mutate state. Corrupt authoritative Run/control data fails closed; missing diagnostic projections are repairable. Normalize a result only through the existing result/evaluator boundary, retaining superseded results as evidence and preserving schema-1 RunResult behavior.

**Baseline disposition:** **NOT READY** until the common-launch-site proof, reader audit/version decision, duplicate-name live probe, and production-door concurrency/crash tests are green. Once those gates pass, this is the least-risk first profile.

## Candidate: gateway-change / alternative-shaper

### 1. Herdr becomes an authority and creates a split-brain repair problem

**Magnitude: HIGH. Reversibility: conditionally irreversible.** If Herdr is the stateful execution ledger keyed by `workId`, Node can say attempt A is current while Herdr reports B as active after restart, stale index data, partial persistence, or a recovery race. Trusting Herdr may attach to a superseded worker; overriding it can create another worker. Neither source has a defined repair owner.

This overturns the established boundary that Herdr observations are evidence, while Run/CoordinationSession write doors decide truth. `workId` alone also cannot represent retry lineage when multiple Runs exist for the same Work.

Mitigation: do not select this candidate as first profile. If reconsidered, Herdr needs durable attempt/run identity, availability/durability ownership, explicit Node-vs-gateway reconciliation precedence, loss/restart recovery, and tests that demonstrate no split-brain repair produces a duplicate launch. It still does not replace Node-side atomic admission.

### 2. Gateway availability and inspection become a production dependency

**Magnitude: MEDIUM to HIGH. Reversibility: operationally costly.** A gateway state migration, outage, or incompatible deployed version can prevent correct recovery and make CLI inspection misleading or unavailable. Production proof requires gateway restart, index-loss/partial-write, stale status, same-work/different-attempt, and permission-denied cases through the real CLI/gateway boundary.

Mitigation: maintain local durable Run truth and a portable read-only inspection projection; gateway loss must produce `park`/`unsupported`, never inferred absence or a replacement launch. Setup/doctor must check any new gateway/state requirement and configuration precedence must remain global-aware/project-overrides-global.

**Gateway-change disposition:** **NOT READY; do not hand off as the first implementation candidate.** Its unsolved split-brain authority is a sink-the-decision risk independent of the shared admission gap.

## Candidate: long-horizon writable/continuation seams

### 1. Reserved authority-shaped fields can fossilize into unverified schema

**Magnitude: LOW to MEDIUM while disabled; HIGH if presence is later mistaken for a grant, quiescence proof, material acceptance, or transfer authorization. Reversibility: reversible before reliance, conditionally irreversible after mixed-version writers emit divergent meanings.**

Reserving lineage, workspace, grant, material, or continuation correlation fields is not itself a capability. The danger is that readers display/preserve them without validation and later code treats their existence as permission.

Mitigation: every reserved field must be versioned, descriptive/revalidation-only, and paired with a typed current-profile refusal. No field may authorize writable takeover, continuation, prompt delivery, settlement, or terminal-parent transfer. Keep P06/P07 disabled/refused until their issuer, quiescence, lineage evaluator, replay transaction, and dedicated proof gates exist.

### 2. Corrupt/legacy state classification must precede any common-envelope rollout

**Magnitude: MEDIUM. Reversibility: conditionally irreversible if an old directory/locator is adopted as a new authority fact.** Existing standalone `runs/NN`, schema-1 session projections, and possible corrupt partial artifacts cannot be inferred into a common envelope. Migration-on-read risks fabricating admission, handle binding, or material provenance.

Mitigation: profile selection is owned and explicit: legacy records remain legacy/read-only; unknown version, foreign writer, partial authoritative record, or ambiguous live binding returns a typed refusal/park. Only complete new v2 records participate in recovery. No dual writer; legacy visibility is one-way and reads do not write.

### 3. Documentation/spec promotion can accidentally advertise disabled power

**Magnitude: MEDIUM. Reversibility: wording is reversible, user/operator behavior induced by it may not be.** Describing reserved fields as “supporting takeover/transfer” without the profile qualifier would conflict with actual capability gates and invite unsafe operational expectations.

Mitigation: promote only settled facts to the canonical runtime-recovery/RunHandle/RunResult contracts. Use normative wording such as “disabled,” “refused,” “unsupported,” and “park” for P06/P07, and state the proof needed for any future enablement. The P08 matrix must compare published claims against executed evidence; docs/doctor closeout cannot convert a warning or schema presence into enabled capability.

**Long-horizon disposition:** **NOT READY as an implementation handoff.** It may be selectively added after the shared v2 admission/migration profile is proven, but default is do-not-add because unused authority-shaped schema has a real compatibility cost.

## Concerns considered and not raised as separate vetoes

- Writable takeover itself is not a current blocker because the first profile refuses it; it becomes blocking only if a path claims shared-CWD mutation without grant, quiescence, and inherited-result evaluation.
- Terminal transfer is not a current migration hazard while terminal-parent transfer remains refused.
- Lack of `absent-proven` is not independently fatal for an observe/reattach/park profile; it is fatal only if replacement is advertised or attempted.
- Corrupt diagnostic projections alone do not block rollout when authoritative state fails closed and the projection is explicitly repairable.

## Required handoff gates

1. Prove both current caller classes funnel through the single Assignment admission writer; run production-door two-caller/crash tests.
2. Adopt and fixture the v2/legacy profile split; audit all Run readers and retain schema-1/RunResult compatibility tests.
3. Obtain the live Herdr duplicate-name, incarnation, restart, and ambiguous-binding probes; keep replacement disabled without absence proof.
4. Ship portable, read-only inspection with typed legacy/corrupt/park outcomes.
5. At closeout, run focused proofs plus `npm test`, setup/doctor checks for new dependencies, schema-1 replay audit, and documentation/capability-matrix wording audit.

Until all gates applicable to a candidate are satisfied, its status must remain **NOT READY**, not “ready with caveats.”
