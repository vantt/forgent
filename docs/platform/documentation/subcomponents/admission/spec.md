# Documentation Admission Specification

```txt
Document type: BA-grade subcomponent specification
Audience: Human reviewer, maintainer, implementation agent, documentation agent
Purpose: Define how a change that opens or moves documentation authority is admitted: by an independent reviewer inside a frame the owner approved, with the owner asked only for what falls outside it
Design status: Draft, split out of the documentation area spec on 2026-11-12 and rewritten from the per-topic owner approval of 2026-11-07 to a reviewer inside an approved frame. Not signed. The questions of section 11 are decided (owner, 2026-11-12).
Implementation: Not started. The doors it checks at exist (the registry store door, fgos doc reserve, doc promote, supersede, path-move); the reviewer run, the frame record and the checks do not
Canonical: No (becomes canonical when signed)
Provenance: Sections 6.7 and 6.8 of the documentation area spec as of 2026-11-07; the owner's objection the same day that asking him for every new topic is wrong; the frame defaults the owner approved on 2026-11-12 (document identity, section 13, question 3)
Writer type: Agent draft writer
Canonical for: Nothing yet; once signed, which effects need admission, who decides them, the frame, and the admission record
Use this when: A change would create a topic, an area, a sub-area or an active document, move authority, or change an axis value set
Do not use this for: Growing an existing section (no admission), or the checks a document passes (doc-checks)
Last reviewed: 2026-11-12
Related:
- docs/platform/documentation/spec.md
- docs/platform/documentation/subcomponents/document-identity/spec.md
- docs/platform/documentation/subcomponents/write-door/spec.md
- docs/platform/work-state/contracts/knowledge-registry.md
- plans/reports/council-261106-2216-docos-h2-document-identity-architecture-panel-outcome.md
```

Read with: [documentation area spec](../../spec.md) (the map), [document identity](../document-identity/spec.md), [write door](../write-door/spec.md), [knowledge-registry contract](../../../work-state/contracts/knowledge-registry.md), [panel outcome](../../../../../plans/reports/council-261106-2216-docos-h2-document-identity-architecture-panel-outcome.md).

## 1. Current Summary

The 2026-11-06 architecture panel found at least seven paths in current code that create or move documentation authority with no admission: a registered topic is active at once, split successors are active, refusal messages steer writers to split, the bootstrap script registers documents directly active, the role guard does not close the set, supersede accepts an unaccepted successor, and path-move checks only path safety.

This subcomponent closes them by **effect**: whatever verb carries it, a change that opens or moves authority passes admission at the door that records it. Admission is decided by **an independent reviewer inside a frame the owner approved once**. The owner is asked only when a proposal falls outside the frame, the reviewer and the proposer disagree, or a top-level area or a core value is at stake; those questions come in batches. The owner gets a digest of what was admitted and can reverse any of it.

Growing an existing section needs no admission.

## 2. Scope

### 2.1. In scope

- The effects that need admission and the door that records each (section 6.1).
- The reviewer, the frame and the owner's batch (6.2 to 6.4).
- The admission record and the checks at the doors (6.5).
- Reversal (6.6).

### 2.2. Out of scope

- Finding the owner of content: [document identity](../document-identity/spec.md), locate.
- Generating proposals for structural change: the observer of [document identity 8.5](../document-identity/spec.md#85-self-improvement). It sends its proposals here.
- Proof that a person typed an answer (section 6.7).

## 3. Entry Points And Triggers

| Trigger | Entry |
|---|---|
| The write door requests a creation after locate returned `none-above-threshold` | an admission request with the locate result attached |
| The observer opens a proposal item | an admission request with the proposal's evidence attached |
| A door that records an effect receives a write | the check of 6.5 |

## 4. Actors And Access

| Actor | May | May not |
|---|---|---|
| Proposer (write door, observer) | Request admission with evidence | Admit its own request |
| Reviewer | Decide requests inside the frame; record the decision; escalate | Decide outside the frame; review a request it proposed; run in the proposer's session or on the proposer's model |
| Owner | Approve the frame; decide escalated requests in batches; reverse an admission | — |
| Recording door (registry store door, `fgos doc reserve`, promote, supersede, path-move) | Refuse a write that lacks a valid admission record | Decide admission |

## 5. Concepts

- **Effect.** What a change does to authority, independent of the verb that carries it.
- **Frame.** The scope and budget the owner approved, inside which the reviewer decides alone.
- **Admission record.** The proof attached to an admitted write: who reviewed, under which frame, against which request.
- **Escalation.** A request the reviewer sends to the owner's batch.

## 6. Behaviors And Operations

### 6.1. Effects that need admission

Each effect passes admission at the existing door that records it, for new events only. Replay of events already recorded is unchanged, and no enum is tightened inside replay.

| Effect | Door that records it | Admission |
|---|---|---|
| A user topic is created, split or renamed | registry store door, `fgos topic`; `scripts/knowledge-bootstrap.mjs` | reviewer inside the frame; with `area` closed (document identity 5.7) this comes only from the observer, never from a writer naming a new topic |
| A sub-area is opened | the area's overview document and the registry | reviewer inside the frame |
| A top-level area is opened | its area spec and overview; the area value list | owner |
| A slot is opened with a role | `fgos doc reserve` | the role must map to a `question` value (document identity 7.2); no reviewer needed |
| A document starts `active` | registry reducer, `scripts/knowledge-bootstrap.mjs` | refused for a new document; `active` is reached only by `doc promote` |
| Authority moves to a successor | registry `doc supersede` | the successor must already be `active` |
| A document moves across area, sub-area or holder | registry `doc path-move`; Convention for platform paths | reviewer inside the moves budget; owner beyond it |
| A register value is added, aliased or retired | the register (a `lookup` document or an external register) | reviewer, listed in the digest |
| An identifier kind or a `question` value is added or removed | domain profile or this spec's core | owner |

Not admission: a writer id prefix, the mere existence of a decision id, or a locate verdict.

### 6.2. The reviewer

The reviewer is an agent run started through the normal execution door (`fgos run`), never the proposer itself:

- a different session from the proposer;
- a different model from the proposer's, when more than one is available; the run's recorded executor and model are the evidence;
- it reads the request, its evidence (the locate result or the observer's measurements), and the frame;
- it answers `admit`, `refuse` with a reason, or `escalate` with a reason.

Escalation is required when the request is outside the frame, when the reviewer disagrees with the proposer on a point the request depends on, or when the effect is listed for the owner in 6.1.

### 6.3. The frame

The owner approves the frame once; changing it is an owner decision. Defaults approved on 2026-11-12:

| Budget | Default |
|---|---|
| New topics or sub-areas inside existing areas | up to 5 per week |
| Section moves across areas or sub-areas | up to 20 per week |
| Register value additions | unlimited, listed in the weekly digest |
| Anything else in 6.1 marked owner | always escalated |

A week is counted per project.

### 6.4. The owner's batch and the digest

Escalated requests wait in one batch. When the batch is presented, each request is one question in the decision-question template (`core/skills/_shared/decision-question.md`). The batch is asked through the existing ask door on one work item (`fgos ask` / `fgos answer`), so a hanging question blocks only that item, not the writers.

The digest lists, per week, everything the reviewer admitted: the effect, the evidence, the reviewer run. It is the owner's view of what changed without having been asked.

### 6.5. The admission record and the checks at the doors

An admitted write carries `admission: { reviewRunId, proposer, frame }`:

- `reviewRunId`: the reviewer's unit run, whose record shows its session, executor and model;
- `proposer`: the request's origin (the write door's locate entry, or the observer's proposal item);
- `frame`: the frame version the reviewer applied, or `owner` for an escalated request, with the work item that carried the owner's answer.

The recording door refuses the write unless:

1. the record is present and names a review run that answered `admit` (or an owner answer that approved);
2. the review run's session and model differ from the proposer's;
3. the record has not been used for a different effect (one admission, one use).

The check runs in the store door before append, never in the replay reducer. Old events without `admission` replay unchanged.

Refusal messages name the way forward: grow the candidates locate returned, or request admission. They never tell a writer to split, rename or create a topic.

### 6.6. Reversal

The owner may reverse any admission from the digest. Reversal runs through the inverse door with lineage: a topic is merged back or retired, a moved section is moved back, a register value is retired with an alias to what replaced it. A reversal is itself recorded with the owner's answer as its admission.

### 6.7. Declared limit

fgOS has no proof of a person: the Identity spec leaves out human accounts, and `fgos answer --approve` can be typed by any session. What this subcomponent proves is that every admitted write has a review run by a different session and model inside an approved frame, and that every owner-level effect has an approved answer on a work item a person can find. It does not prove that a person typed that answer. The same limit holds for `doc promote`. Closing it needs the Identity owner.

### 6.8. Alternatives rejected

- **The owner approves every new topic** (the 2026-11-07 draft): it makes the owner wait on every write, against product priority 2 ("release people"). Replaced by the frame.
- **A `proposed` topic status**: its activation, replay, merge and reader meaning are not written, and the reader leak in `src/report/enduser-index.mjs` already shows how an unaccepted state reaches readers.
- **A writer-prefix gate (`att-*`)**: an id prefix is not authorization.
- **A reviewed batch file of admitted topics**: a second registry beside the event store.

## 7. Rules And Invariants

1. **Admission by effect.** Any change that opens or moves authority passes admission at the door that records it, whatever verb carries it.
2. **Never self-admitted.** The reviewer is never the proposer's session or model.
3. **Inside the frame or escalated.** The reviewer decides alone only inside the frame.
4. **The owner is asked in batches.** Never per write.
5. **Old events replay as they are.**
6. **Refusals point to growing.** No refusal steers a writer to create structure.

## 8. Contracts Owned

- The effect table (6.1) and who decides each effect.
- The admission record `admission: { reviewRunId, proposer, frame }` and the door checks (6.5).
- The frame and its defaults (6.3).

## 9. Contracts Consumed

| Contract | Owner | Use |
|---|---|---|
| `fgos run` and unit-run records | [runner](../../../runner/spec.md) | the reviewer run and its session, executor and model |
| `fgos ask` / `fgos answer` | work state | the owner's batch |
| Registry doors and lineage | [knowledge-registry contract](../../../work-state/contracts/knowledge-registry.md) | where records are checked; reversal |
| Locate result, observer proposals | [document identity](../document-identity/spec.md) | evidence |
| Decision-question template | `core/skills/_shared/decision-question.md` | the owner's batch |

## 10. Edge Cases

- **Only one model available.** The reviewer runs in a different session on the same model, and the record says so; the digest flags it.
- **The reviewer run fails.** The request stays pending; the writer keeps its material and does not wait.
- **The weekly budget is spent.** Further requests of that kind escalate to the owner's batch.
- **A retrospective item cannot be parked** (`status-fsm.mjs` has no edge from `retrospective` to `awaiting-human`). Its creation request is its own item; the retrospective item keeps its material and moves on.

## 11. Open Questions

1. **The area value list as a machine-readable file.** *Decided 2026-11-12: as recommended.* The effect "a top-level area is opened" needs a list the doors can check, and the 2026-11-12 decision on document identity question 4 says such lists are machine-readable and test-kept, never derived from prose. Recommendation: one small file in the project instance, owned by document identity, checked against the existence of each area's overview document.
2. **Digest cadence and channel.** *Decided 2026-11-12: as recommended.* Recommendation: weekly, as one generated document plus a line in the owner's mailbox.

## 12. Implementation Alignment

| Behavior | Status | Next action |
|---|---|---|
| Effect table and door checks | planned | admission phase |
| Reviewer run | planned | through `fgos run` with a review prompt |
| Frame record | decided defaults | store the frame version with the project instance |
| Refusal texts | planned | the four strings in `src/state/knowledge-registry.mjs` (lines 182, 202, 248, 534) and `bin/fgos.mjs:1591` |
| Active-on-create refused | planned | registry reducer and bootstrap |

## 13. Verification

| Behavior | Owning proof |
|---|---|
| The door refuses a write without a valid record | a case per door in the registry's owning test |
| A self-review is refused | one case in the same test |
| Old events replay unchanged | the existing replay test, extended by one old event |
| Escalation outside the frame | a case in the admission use case's test |

## 14. Related Files

- [Documentation area spec](../../spec.md)
- [Document identity](../document-identity/spec.md)
- [Write door](../write-door/spec.md)
- [Knowledge-registry contract](../../../work-state/contracts/knowledge-registry.md)
- [Panel outcome](../../../../../plans/reports/council-261106-2216-docos-h2-document-identity-architecture-panel-outcome.md)

## 15. Decision History Summary

- 2026-11-06, architecture panel and owner: admission first, through doors that already exist; a missed lookup never grants create.
- 2026-11-07, lead draft: a new topic needs an approved owner answer naming it.
- 2026-11-07, owner: asking him for every new topic is wrong. The lead proposed an independent reviewer inside an approved frame, with the owner asked only beyond it.
- 2026-11-12, owner: frame defaults approved (document identity, question 3); the documentation area is split into subcomponents and admission becomes this spec, written to the reviewer-and-frame model.
- 2026-11-12, owner: section 11 accepted: the area value list is one machine-readable file in the project instance, owned by document identity and checked against each area's overview document; the digest is weekly, as one generated document plus a line in the owner's mailbox.
