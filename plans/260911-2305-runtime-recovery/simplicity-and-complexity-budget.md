# Simplicity Audit And Complexity Budget

**Scope:** runtime recovery detailed design  
**Principle:** simple means experienced complexity, not fewer paragraphs or
fewer safeguards.

## Essential Complexity We Must Keep

These facts come from the problem itself and cannot be removed without losing
correctness:

1. A Run can exist without a worker, and a worker can exist without a persisted
   locator after a crash.
2. A gateway restart creates a new worker incarnation; a name is not identity.
3. Two contenders can observe the same predecessor, so admission and settlement
   need fencing.
4. A terminal parent has different legal transitions from a live parent.
5. A replacement may inherit material and external effects from a failed Run.

The design is simple when these facts are represented once and composed,
without making every component understand all of them.

## Complexity Budget

| Rule | Budget | Enforcement |
|---|---|---|
| Application use cases | one `recover` orchestrator plus existing write doors | no `RecoveryManager`, supervisor or second state machine |
| Durable identities | `runId`/attempt, per-acquisition `controlEpoch`/token, adapter-proven resource incarnation, `invocationKey` | no conversation, timestamp, pane or model identity as authority |
| New event families | Run admission, launch intent/bind, park/refuse, transfer | no event for every observation; observations stay evidence |
| Read planning | ephemeral recommendation whose apply echoes snapshot/control epoch/action key | no durable plan-token authority in first profile |
| Ports | one per external authority boundary | no port wrapping pure functions or local data structures |
| Recovery actions | reattach, observe, collect, read-only takeover, park/refuse | no hidden retry loop and no automatic close |
| Policy locations | pure evaluators/planner | adapters never branch on product policy |
| Configuration | explicit operation/profile fields only | no ambient env var or inferred mutation semantics |

## Shape After The Audit

```text
CLI / protocol adapter
        |
        v
Recovery use case ----> pure evaluator/planner
        |
        +---- Run write door (the only mutation boundary)
        +---- Launch port ---- Herdr adapter
        +---- Evidence ports - workspace/process/effect adapters
```

The ports are not a new layer of orchestration. They are dependency inversion
points owned by the use case. A phase may add a port only when the dependency
crosses the process, gateway, filesystem or mutable clock boundary.

## Deliberate Non-Abstractions

- No generic checkpoint framework: Run admission and launch intent are the two
  recovery boundaries that already exist in the domain.
- No generic effect ledger: an operation's repeat declaration and attestation
  are enough for the first profile; unknown effects park.
- No workspace service: the writable profile consumes an issuer port and stays
  disabled until a real owner exists.
- No health store: process evidence is an adapter fact used by lock recovery;
  Run truth remains in the event log.
- No automatic phase handoff: cell completion is an existing session boundary;
  in-cell takeover is Run-level recovery.

## Review Questions For Every New Symbol

Before adding a class/module/event, answer:

1. Which essential fact does it represent?
2. Which existing owner cannot represent that fact without violating SRP?
3. Is it a domain rule, a port, an adapter, or a projection?
4. Can a pure function replace it?
5. What is the deletion test: which behavior becomes unsafe if it disappears?

If these answers are not explicit, the change is complexity without evidence.

## Acceptance Of Simplicity

The design passes this audit when a new engineer can trace one recovery request
from read snapshot to one write door without crossing more than one policy
evaluator, and can identify the authority for every identity and event in one
table. A shorter design that hides those authorities fails the audit.
