# Agent Coordination Playbooks

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

Complete pre-rework input: [historical snapshot](../history/retired-engine/files/playbooks/README.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.

## Migration Status

This target directory preserves operational and bootstrap material from
`docs/architect/agent-coordination/playbooks/`. It is navigationally promoted,
but remains non-normative: contracts, architecture, decisions, and runtime
code own their respective claims.

## Playbooks

- [Coordination Operating Harness](coordination-operating-harness.md) defines
  coordinator/doer/reviewer/red-team roles, current-cell artifacts, token
  discipline, review gates, and live proof capture.
- [Master Multi-Agent Implementation Coordinator](prompts/master-coordinator.md)
  is an owner-retained manual engineering prompt, not a runtime sequencer or
  authority to bypass the registered execution/review doors.
- [Step 07 Design Discussion Handoff](../history/retired-engine/files/playbooks/prompts/step-07-design-discussion-handoff.md#literal-snapshot)
  preserves the earlier engine-design discussion; it is historical context.
- [MVP6+ Dogfood Handoff](../history/retired-engine/files/playbooks/mvp6-dogfood-handoff.md#literal-snapshot)
  preserves the old `fgos coordination` procedure, retired in 2180b4e72.
  It is not a current operating command or standalone execution door.
- Advisory cognitive references consumed by the registered skill:
  [coordinator companion](prompts/architecture-advisory-coordinator.md),
  [role doctrine](architecture-advisory-role-doctrine.md),
  [artifact templates](architecture-advisory-artifact-templates.md), and
  [quality rubric](architecture-advisory-evaluation-rubric.md).
  These supply judgment guidance, not a manual substitute for the registered
  architecture-advisory graph.

Playbooks explain how people and agents work. They do not define runtime
entities, lifecycle authority, or machine contracts.

## Runtime Boundary

Playbooks do not own runtime storage, gates or sequencing. The current
`fgos-architecture-panel` skill explicitly references the advisory companions
for cognitive quality (`core/skills/fgos-architecture-panel/SKILL.md:135-142`);
therefore it is false to say no production Skill may reference this directory.
Those references do not make historical runtime recipes executable support.

The production authoring sources are:

```txt
core/skills/                         # domain-agnostic runtime prose
core/task-specs/                     # domain-agnostic execution contracts
domains/<domain>/skills/             # domain-specific runtime prose
domains/<domain>/task-specs/         # domain-specific execution contracts
domains/<domain>/workflows/          # current workflow/protocol configuration
src/                                 # runtime implementation
```

Setup may materialize or distribute authored Skills into `.agents/skills/`,
`.claude/skills/`, or `plugins/fgOS/skills/`. Those runtime/distribution assets
remain separate from documentation playbooks.

## Bootstrap Role

The coordination harness exists for the period where humans must manually
coordinate independent coordinator, doer, reviewer, and red-team sessions:

```txt
human selects a prompt template
  -> agent reads verification/<track>/current-cell.md
  -> agent performs one bounded role
  -> agent records trace/evidence
```

This remains a manual engineering/review convention, not a prerequisite for
finishing an unimplemented CoordinationSession runtime. Current automated
execution uses Unit/CollaborationPattern and Workflow; manual recovery/debug
guidance must respect those owners.

## End-State Lifecycle

Current runtime execution goes through its code, Workflow definitions, Skills
and TaskSpecs. The registered advisory companions remain cognitive references;
do not infer they can be deleted without affecting those references.

The operating harness/master prompt remains current by owner decision.
Any future relocation or retirement requires its own liveness and consumer
check, not an assumption that the retired coordination engine will replace it.

The master coordinator prompt is retained while manual Codex/Agy-style
orchestration remains an active engineering need. Separate copy/paste prompts
for each subordinate role are optional fallback artifacts; the master prompt is
the normal entry point.
