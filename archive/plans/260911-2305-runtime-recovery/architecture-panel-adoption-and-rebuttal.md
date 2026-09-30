# Architecture Panel Adoption And Rebuttal

**Input:** `architecture-panel/`  
**Decision date:** 2026-09-12  
**Purpose:** apply the panel result to the design without accepting claims
blindly.

## Panel findings accepted

| Finding | Action |
|---|---|
| Standalone `executeAssignment` has an unfenced attempt allocation | S1 owner is now explicitly `executeAssignment` for both session and standalone callers. The design names the existing `withEventsLock`/`appendEventLocked` primitive and exclusive-create requirement. |
| `runId` is not currently threaded into Herdr naming | S2 now calls this a required plumbing change, not an existing property. |
| Herdr duplicate-name behavior is unverified | S2 requires a live probe for reject/reuse/replace behavior; no local assumption is allowed. |
| Legacy v1 field absence may be load-bearing | S1 now requires `assignment-run.v2` and fail-closed legacy recovery. |
| Durable plan-token store is unnecessary for first profile | S4 uses an ephemeral recommendation; apply echoes snapshot/control epoch/action key for write-door CAS. |
| The standalone path is a real admission surface | S1 now distinguishes one logical Run contract from the existing session-event and standalone Run-file persistence owners. |
| Gateway `absent-proven` is unavailable today | S2 ships reattach/observe/park only; replacement launch remains externally gated. |
| Gateway-authority alternative violates fgOS authority law | Rejected; Herdr remains evidence/transport, never Run truth. |

## Panel claims rejected or corrected

### Generation/incarnation is not an open product question

The panel synthesis incorrectly reopened this. The source prompt and
architecture decision lock explicitly settle `generation` for fencing and
`incarnation` for worker-resource identity. The system-shaper's proposal to
drop them is a baseline-departure proposal, not an unresolved ambiguity. We
retain both fields.

### Zero ports is not the simplicity target

The panel's recommended candidate collapses all ports into existing symbols.
That is only valid where a real local seam already exists. Hexagonal design
requires named dependency boundaries for gateway, workspace and effect
evidence, even if the first implementation injects a small object rather than
creating a new framework. The adopted rule is **minimum ports at external
authority boundaries**, not zero ports.

### A second `handle.json` is not needed

The panel candidate adds `handle.json` beside the existing
`visibility.json`. The adjusted design uses `visibility.json` as the single
binding-evidence record. Authority remains Run write-door state plus Herdr
`agentSession.value`; neither visibility nor pane locator can authorize
replacement.

### The panel's `run.json` v1 field-add is not adopted

The panel candidate proposed a silent v1 field-add. The adjusted design keeps a
version boundary (`assignment-run.v2`) and fails closed for legacy records,
because admission and settlement semantics are load-bearing. This is a small
schema boundary, not a new abstraction.

### S2 replacement launch cannot be called ready

The panel is correct that current `agentGet(name)` cannot prove absence. The
design therefore distinguishes ready reattach/observe/park from replacement
launch blocked by gateway contract. No deterministic name workaround is
accepted.

## Resulting phase status

| Phase | Status after adoption |
|---|---|
| S0 | READY |
| S1 | READY FOR IMPLEMENTATION after standalone race fixture and v2 legacy-read proof |
| S2 reattach/observe/park | READY WITH EXTERNAL DEPENDENCY (Herdr probe) |
| S2 replacement launch | DESIGN BLOCKED by gateway lookup/absent-proof contract |
| S3 | READY WITH EXTERNAL DEPENDENCY on S1/S2 records |
| S4 | READY FOR IMPLEMENTATION; no PlanTokenStore |
| P06 writable | DISABLED PROFILE |
| S5 transfer | DESIGN BLOCKED by CP section 6/backlog |
| P08 | PENDING all accepted evidence |

F6 is now closed negatively: the existing coordination request vocabulary does
not target a standalone parked Run. The design adds no second authority; P04's
public recovery door is placed beside `dispatch show-run`.

## Gateway clarification

Runtime Recovery does not start or depend on an fgOS web gateway. Herdr is
reached through the existing `herdr-agent.mjs` CLI adapter. A future socket
adapter is optional and is not an authority.

## Why this remains simple

The panel's useful simplification is adopted where it reduces accidental
complexity: no durable plan-token authority and no second lock implementation.
The essential complexity is retained where removing it would make correctness
unprovable: standalone admission fencing, Run generation, worker incarnation,
gateway reconciliation and explicit effect evidence.
