# S5/P07 - Continuation And Transfer

**Status:** PENDING ENGINE CONTRACT  
**Owner:** CoordinationSession schema/store/replay  
**Depends on:** S1-S4 proofs and named engine backlog items

## First-Profile Policy

A terminal parent refuses transfer. The write door returns
`transfer-unavailable` with remedy `open fresh session`, records the
`premature-close` hazard and contributes it to X11. This conservative policy
blocks S5 only; it does not block earlier recovery phases. BL1 must be rerun
after `tsk-5qj` closes.

## Future Transfer Contract

```text
prepare(parentRunId, childSpec, grant) -> prepared
gate(preparedId, evidence) -> gated-child
commit(gatedChildId) -> committed
```

The state machine is `prepared -> gated-child -> committed`, with typed
refusal from every edge. Every event carries parent event id, child Run id,
grant id, protocol version and invocation key. A fresh authority owns the
child; the parent never remains an implicit writer.

## Replay Rules

Replay Rule #5 remains: terminal state is absorbing. CP section 6 already
settles the first profile by refusing terminal transfer and appending no
post-terminal bookkeeping. Audit bookkeeping is not silently treated as a
transfer. A later profile must explicitly amend CP before adding any valid
post-terminal event class.

## Driver Replacement Door

Current caller must match trusted operator configuration. A human-turn
reference proves provenance but is single-use, consumed by `invocationKey` at
the write door and checked for duplicate use during replay. The first profile
permits recover/observe/collect/close only. Authorize, disposition and continue
require new authorization. Replay does not consult mutable config.

## Acceptance

Prove terminal refusal/remedy/hazard counting, prepared-gated-committed replay,
single-use grant, duplicate invocation refusal, wrong operator refusal,
out-of-scope action refusal and schema-1 replay parity.
