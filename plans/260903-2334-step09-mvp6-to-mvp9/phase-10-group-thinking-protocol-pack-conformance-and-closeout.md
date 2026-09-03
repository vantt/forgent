# Phase 10 - Group-Thinking Protocol Pack, Conformance, And Step 09 Closeout

## Objective

Build the reusable application layer outside core that exercises MVP6-MVP9
through public contracts.

## Cells

### P10.1 Pack Registry And Public Surface

- Index protocols by canonical FlowDefinition `metadata.id@version`; do not
  create a second protocol identity.
- Keep protocol definitions data-first.
- Define public request adapter and replay renderer boundaries.
- Build a thin `fgos-group-thinking` skill/surface that selects an explicit
  registered protocol, launches/resumes coordination, and renders public replay.
- Do not hide protocol semantics in skill prose.

### P10.2 RFC-Review-Lite Definition

- Independent objections before controlled reveal.
- Response and driver disposition with artifact-backed lineage.
- No general comments/thread service.

### P10.3 Nominal-Group-Lite Definition

- Private proposals, controlled sharing, clarification, and private rank
  contributions.
- No formal tally/winner semantics in this step.

### P10.4 Delphi-Feedback-Lite Definition

- Private inputs, mediated evidence-preserving aggregate artifact, and bounded
  next-round proposals.
- No claim of strong anonymity or statistical convergence.

P10.2-P10.4 run in parallel in separate fixture directories and may not edit
the shared registry or skill. They return definition/test artifacts to P10.5.

### P10.5 Integration And Usability Proof

- Register all three definitions through one writer.
- Prove the same request path works through CLI and headless entry points.
- Prove the skill cannot switch protocols silently, bypass grants, validate its
  own aggregate, authorize a specialist, or close a session directly.

## Pack Integration Gate

- Pack, conformance inputs, and skill are physically/authoritatively outside the
  Agent Coordination kernel.
- All protocol behavior is expressed by public declarations and engine
  contracts.

## Parallel Conformance Lanes

### P10.6 RFC-Review-Lite Conformance

- End-to-end independent review, reveal, response, disposition, replay, and
  resume proof.

### P10.7 Nominal-Group-Lite Conformance

- End-to-end private proposal, reveal, clarification, private rank capture, and
  replay proof without claiming tally semantics.

### P10.8 Delphi-Feedback-Lite Conformance

- End-to-end private input, mediated aggregate feedback, bounded next round,
  and replay proof without claiming strong anonymity/convergence.

### P10.9 Isolation, Security, And Authority Regression

- Unchanged Group Cognition fixture.
- Foreign refs, premature visibility, unauthorized aggregation/specialist,
  over-cap/race/recovery, terminal absorption, governance-final dispatch,
  evidence confidence, CLI/headless parity, and Work/export-boundary checks.

P10.6-P10.9 run in parallel after P10.5 and own separate evidence paths. They
do not edit canonical contracts.

### P10.10 Promotion And Closeout

- Read live test/evidence state from every lane; do not trust narration alone.
- Classify failures as implementation bug, contract ambiguity, shared missing
  primitive, fixture convenience, or explicitly out-of-scope authority.
- Promote implemented/proved semantics into canonical Agent Coordination and
  Team Cognition contracts/baseline.
- Update proposal status and verification indexes without claiming deferred
  vote/convergence/anonymization/topology capabilities.
- Run full suite and final change-scope review.

## Step 09 Exit Contract

- Three unlike protocols run with no protocol-specific kernel branch.
- Replay explains every visibility grant, aggregation validation, contribution
  lineage, and specialist authorization.
- Public CLI/headless surfaces preserve semantic parity.
- Isolation fixtures remain unchanged and green.
- No behavior depends on chat history or hidden driver-only prose.
- Every adaptive action is authorized, bounded, evidence-linked, and
  idempotent.
- No Work/Coding/git/worktree/merge/mutation authority moved into the substrate.

If a shared missing primitive is proven, do not hide it in the Protocol Pack or
skill. Leave Step 09 open with a named proposal and evidence. All other passing
conditions close Step 09 without automatically opening Step 10.
