# Phase 08 - MVP8 Deliberation Memory

## Objective

Persist typed reasoning lineage across rounds without creating a general
message/thread/mailbox subsystem.

## Candidate Contract

Allowed contribution types:

```text
proposal | objection | response | clarification | rank | specialist-request
```

Operation results declare `contributions.allowedTypes[]`. The session links a
contribution using `deliberation-contribution-linked` with contribution type,
Assignment/Run/artifact provenance, anchors, response lineage, round key,
visibility-window provenance, and timestamp.

## Cells

### P08.1 Contribution Model And Validation

- Define closed MVP8 contribution enums and typed lineage validator.
- Require immutable artifact backing and real Assignment/Run provenance.
- Reject undeclared contribution types, dangling anchors/responses, cycles,
  foreign-session refs, and operation/type mismatch.
- Do not add recipient, delivery, unread, mutable status, or arbitrary body.

### P08.2 Session Ledger, Replay, And Visibility

- Append and replay contribution links without copying artifact content.
- Enforce MVP6 window/context legality when a later Assignment receives a
  contribution artifact.
- Let existing `driver-disposition-recorded.targetRef` target a contribution.
- Derive open/resolved views from immutable links and dispositions rather than
  mutating contribution status.

### P08.3 Method-Shaped Proofs

- RFC chain: proposal -> objection -> response -> driver disposition.
- Nominal-Group chain: private proposal -> controlled reveal -> clarification
  -> private rank contribution.
- Delphi chain: private proposal -> mediated aggregate artifact -> next-round
  proposal.
- Prove replay works without chat history or hidden driver prose.

## Exit

- Contribution lineage is durable, bounded by declared operation types, and
  visibility-controlled.
- Existing disposition remains driver-owned.
- No AgentMessage/mailbox semantics entered core.
