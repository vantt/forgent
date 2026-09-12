# Runtime Recovery Design Audit

**Audit mode:** iterative self-review against the architecture lock, detailed
design, phase briefs and simplicity budget  
**Date:** 2026-09-12

**Panel reconciliation:** [architecture-panel-adoption-and-rebuttal.md](architecture-panel-adoption-and-rebuttal.md)

## Criteria

Every phase must have one mutation owner, concrete ports only at external
boundaries, normal/crash transitions, typed unknown/refuse/park outcomes,
executable acceptance, explicit non-goals and no hidden authority in an
adapter, timestamp or name.

## Results

| Phase | Result | Reason |
|---|---|---|
| S0/P00 | READY | baseline-only, no mutation |
| S1/P01 | DESIGN APPROVED | append-only generation guard, staged admission, control token and exact retry transaction reviewed |
| S2/P02L default cli-spawn | DESIGN READY; HUMAN HOLD | local contract now names protected artifact layout, launch envelope, evaluator baseline, adapter receipt, confinement finalization and typed unsupported capabilities |
| S2/P02H Herdr bwrap observe/park | ARCHITECTURE READY; WORKER-COMMAND SEAM REQUIRED; HUMAN HOLD | Herdr must start Authority-prepared bwrap command; conversation correlation separated from resource incarnation; pre-bind ambiguity parks |
| S2/P02H automatic replacement launch | BLOCKED BY GATEWAY CONTRACT | current `agentGet(name)` cannot prove `absent-proven`; no local workaround is safe |
| S3/P03 | READY PRE-DELIVERY ONLY | post-delivery repeat gated by missing filtered-confinement coverage |
| S4/P04-P05-P05S | DESIGN APPROVED | explicit apply expectations and separate standalone/session doors |
| P06 writable | DISABLED PROFILE | requires real grant issuer and lineage evidence; read-only path is independent |
| S5/P07 transfer | BLOCKED BY ENGINE BACKLOG | CP terminal refusal is already settled |
| P08 closeout | PENDING | depends on accepted implementation evidence |

## Finding Closure

- **A01 addressed:** Assignment admission mutex and Run control epoch/token are
  distinct; no async I/O is protected by a synchronous mutex.
- **A02 addressed:** `agentSession` is correlation; resource incarnation must
  be adapter-proven or control parks.
- **A03 addressed:** initial, session retry and standalone retry ordering plus
  schema-2 exact retry declaration are explicit.
- **A04 addressed:** only fresh not-requested->pending transition launches;
  pre-bind ambiguity reconciles or parks, never duplicates.
- **A05 addressed:** apply echoes snapshot/control epoch/action key.
- **A06 addressed:** manifest leases/dependencies split P04, P05 and P05S and
  core closeout no longer waits for P06/P07.
- **A07 addressed:** post-delivery repeat remains parked on current bwrap.
- **A08 addressed:** P05S owns session recovery separately from P05 dispatch.
- **R-02 narrowed:** reattach/observe/park is ready; automatic replacement
  launch is explicitly blocked by the missing gateway authority contract.
- **R-03 closed:** S3 defines provider derivation, attestation branches and
  typed park outcomes.
- **R-04 closed:** S4 re-reads caller-supplied snapshot hash and control epoch at the existing
  write door; no second token authority exists.
- **F6 closed negatively:** parked standalone Runs are observed through
  `dispatch show-run`; recovery belongs to a future `dispatch recover` door,
  not `coordination run`.
- **R-05 narrowed:** CP section 6 already settles terminal refusal; engine
  backlog still gates continuation implementation.
- **R-06 remains profile-gated by design:** writable takeover stays disabled;
  isolated/read-only recovery does not depend on inherited-edit evaluation.

## Simplicity Check

No recovery manager, health store, checkpoint framework, generic effect ledger
or implicit workspace authority is required. It adds only the control
epoch/token whose lifetime genuinely differs from Run attempt, and requires
adapter-proven resource incarnation rather than misusing conversation identity.
Observations remain evidence, and
mutations remain behind existing write doors.

Exact first-profile shapes and ownership are frozen in
[implementation-contract-catalog.md](implementation-contract-catalog.md). The
local `cli-spawn` profile's detailed contract is
[phase-designs/cli-spawn-local-contract.md](phase-designs/cli-spawn-local-contract.md);
other files should link to it instead of restating its schemas.

## Post-panel verdict

The earlier A01-A08 delta passed. The omitted default `cli-spawn` lifecycle
reopened the **core design gate** for P02L, and that local contract is now ready
after Astra re-review. P02H is architecturally ready for Assignment-owned Herdr workers to
consume the Confinement Authority-prepared bwrap command, with implementation
required to add/prove the arbitrary worker-command seam; Herdr remains
transport/failure detector, not Run truth. Implementation is still not started
and remains on human hold. Herdr automatic replacement launch, post-delivery
repeat, writable takeover and continuation remain gated.
