Role: Constraint Advocate (Phase 6 — second pass, against the finished
shaped candidates)
Author: codex-bwrap / openai-codex / gpt-5.6-terra / analytical
Dispatch: prompts/constraint-advocate-phase6.md -> runs/asgn_..._op_010/01
Revision: v1
Written: 2026-09-11 (Run settled; transcribed by coordinator 2026-09-12)

Full advisor output (primary record):
`.fgos/assignments/asgn_runtime_recovery_panel_coordinator_op_010/runs/01/agent-report.md`

## Overall ranking

1. **Shared: standalone Team-Dispatch admission remains an unfenced
   launch surface — HIGH; effects irreversible.**
2. **Gateway-change: Herdr becomes the authoritative stateful execution
   ledger keyed only by `workId` — HIGH; conditionally irreversible.**
3. **Baseline conservative: `run.json` v1 field-add can silently change
   legacy-reader behavior — MEDIUM; conditionally irreversible.**
4. **Long-horizon: reserved S1-S4 fields can fossilize unexercised schema
   semantics — LOW to MEDIUM; reversible before reliance.**

## Shared finding — all candidates

### 1. Unfenced standalone Team-Dispatch admission can create duplicate live effects (HIGH; irreversible for effects)

The confirmed `executeAssignment` path allocates attempts from directory
state without atomic admission. If any candidate leaves that path outside
the durable identity/fence it claims, two callers for one Assignment can
each launch a worker. A result fence, gateway lookup, recovery handle, or
future continuation seam cannot undo a duplicated prompt, provider charge,
external write, or worker-side effect. Not a one-time migration window —
affects every concurrent standalone invocation until the Assignment-scoped
admission boundary is authoritative. Candidate attachment: baseline closes
it only if `executeAssignment` is truly the sole launch site; gateway-
change does not specify a Node admission migration and leaves a local
duplicate-admission race even if Herdr fences starts; long-horizon's
reserved envelope is insufficient unless it governs both current paths.
**This is the top-ranked shared risk, not a per-candidate footnote.**

## Baseline conservative / system-shaper

### 1. `run.json` field-add under v1 can silently alter legacy-reader behavior (MEDIUM; conditionally irreversible)

Real blast radius: every current reader that treats field absence as
semantic state rather than ignoring unknown fields. Such a reader may
select a legacy branch for old records but a different branch for newly
emitted v1-shaped records — no version boundary to refuse or select a
compatibility path. Becomes HIGH if field absence controls settlement or
admission authority. **F7 is therefore load-bearing, not cosmetic.**
Reversible before consumers act; not reversible once a reader has already
settled/superseded/recovered under the wrong belief.

### 2. Deterministic Herdr naming depends on unverified duplicate-name behavior (MEDIUM; effects conditionally irreversible)

If `herdr agent start <existing-name>` reuses/replaces rather than
rejects, a duplicate start can attach to or disrupt a live pane. F3 is the
material operational gate.

## Gateway-change / alternative-shaper

### 1. Herdr becomes a stateful authority without complete ownership or split-brain rules (HIGH; conditionally irreversible)

Decisive failure, concretely stated: Node's durable Run/attempt ledger can
say A is active while Herdr reports B as the single active agent for the
same `workId` after restart/partial index write/stale status/recovery
race. Trusting Herdr can reattach to a wrong attempt or accept a
superseded worker's result; overriding it can launch a second worker.
**Neither repair authority is defined.** Every Herdr execution/recovery
now depends on a durable, available, correctly reconciled gateway ledger;
an outage/state loss becomes a cross-process authority dispute.

### 2. `workId` as sole gateway identity can make attempt lineage unrepresentable (HIGH if retries share IDs; otherwise MEDIUM)

Where multiple Runs/retries exist for one work, Herdr cannot prove which
descendant Node intends to recover — an identity-model mismatch that
amplifies the shared admission gap.

## Long-horizon seams / specialist candidate

### 1. Disabled reserved fields can become dead, unverified schema with authority-like meaning (LOW to MEDIUM; reversible before reliance)

Direct risk: schema fossilization — writers serialize fields with no
enabled consumer, readers preserve/display without validation, a later
feature mistakes presence for grant/quiescence-proof/material-capture/
transfer-eligibility. Low while fields are descriptive and write doors
refuse the capabilities they reference; rises to medium through mixed-
version rollout if writers/adapters give reserved fields divergent
meanings before an exercising profile adds conformance proof. Accumulated
compatibility debt, not an immediate duplicate-effect hazard.

### 2. Broad common envelope expands mixed-profile interpretation risk (MEDIUM; conditionally irreversible)

Unifying both paths is necessary for the shared finding, but existing
standalone directories and session-ledger records need explicit
classification so legacy absence isn't silently read differently across
components. Every pre-rollout resumable Run is within the interpretation
surface (no count evidenced); remains below the admission fence because
safe behavior can park/refuse rather than emit an effect.

## Concerns considered and not raised

P06/P07: not active migration hazards while kept disabled/refused —
require later gates and proofs. `absent-proven` availability alone: not
separately ranked — parking on unavailable proof can be safe, the gateway
authority shift is the deeper risk. Baseline `withEventsLock`: subsumed
by the shared finding and its load-bearing sole-launch-site claim. Generic
schema growth: not raised — the long-horizon concern is specific to
future authority-like facts never exercised.
