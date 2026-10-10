# Agent Coordination Verification

```txt
Document type: Collection index
Audience: Maintainer, implementation agent and independent reviewer
Purpose: Preserve current contracts and explicitly distinguish unimplemented design from retired engine history
Design status: Candidate
Implementation: Section-specific; proposal schemas and dated findings are not blanket implementation claims
Provenance: Restored from 7880fbc74b07c3667ebaa61f2b0561b5d80471b5 after independent liveness review
Writer type: Human + agent coauthor
Canonical for: The current subject and design boundaries stated in this file; not retired engine authority
Use this when: Reading the surviving contract, its implementation limits or current proposals
Do not use this for: Reinstating the retired coordination engine or treating proposal details as shipped behavior
Last reviewed: Pending independent liveness re-review
Related:
- docs/platform/agent-coordination/README.md
- docs/specs/runner.md
Supersedes: Incorrect whole-file retirement or over-removal only
Superseded by: None for the surviving current subject
Added in candidate: Liveness evidence and explicit implementation/proposal distinction
```

Complete pre-rework input: [historical snapshot](../history/retired-engine/files/verification/README.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.

## Evidence Sets

These are dated physical evidence collections, not proof that every tested runtime still exists or that the files were re-verified. Step 08 CoordinationSession/FlowDefinition and all three Step 09 session-protocol collections are historical engine evidence. Other collections also require their individual dates, commits and current owners: old code-panel/plan-loop proof is not proof that removed facades still ship. All payload bytes remain unchanged.

| Collection | Reading location |
|---|---|
| architecture-advisory-panel | [architecture-advisory-panel](architecture-advisory-panel/) |
| code-implementation-track-policy | [code-implementation-track-policy](code-implementation-track-policy/) |
| code-panel-multicell-facade | [code-panel-multicell-facade](code-panel-multicell-facade/) |
| confinement-authority-implementation | [confinement-authority-implementation](confinement-authority-implementation/) |
| coordination-envelope | [coordination-envelope](coordination-envelope/) |
| dispatch-operability-implementation | [dispatch-operability-implementation](dispatch-operability-implementation/) |
| executor-policy-dispatch-seams | [executor-policy-dispatch-seams](executor-policy-dispatch-seams/) |
| group-thinking-plan-loop | [group-thinking-plan-loop](group-thinking-plan-loop/) |
| runtime-recovery | [runtime-recovery](runtime-recovery/) |
| rust-host-r1-kernel | [rust-host-r1-kernel](rust-host-r1-kernel/) |
| step-07-mvp | [step-07-mvp](step-07-mvp/) |
| step-08-standalone-coordination | [step-08-standalone-coordination](step-08-standalone-coordination/) |
| step-09-group-thinking-mvp1-mvp2 | [step-09-group-thinking-mvp1-mvp2](step-09-group-thinking-mvp1-mvp2/) |
| step-09-mvp3-to-mvp5 | [step-09-mvp3-to-mvp5](step-09-mvp3-to-mvp5/) |
| step-09-mvp6-to-mvp9 | [step-09-mvp6-to-mvp9](step-09-mvp6-to-mvp9/) |
| team-dispatch-v1 | [team-dispatch-v1](team-dispatch-v1/) |
| visibility-herdr | [visibility-herdr](visibility-herdr/) |

The current runtime owners are dispatch Assignment/Run/RunResult, Unit/CollaborationPattern and Workflow. Their current documents and the historical engine snapshots are linked from the area portal. A transcript, pane state or passing old proof does not establish current implementation authority.

## Verification Boundary

Verification establishes conformance at a point in time; it does not define
architecture or change a contract. New proof should separately identify:

- deterministic unit/integration scenarios;
- negative and adversarial scenarios;
- actual live provider/executor scenarios;
- requirement-to-code/test/evidence traceability;
- unrelated/pre-existing failures;
- the exact proof date, commit and configuration.
