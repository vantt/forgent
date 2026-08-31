# Agent Coordination Playbooks

Document type: Index
Design status: N/A
Implementation: Active
Last reviewed: 2026-08-31
Canonical for: engineering bootstrap and manual fallback procedures only

## Playbooks

- [Coordination Operating Harness](coordination-operating-harness.md) defines
  coordinator/doer/reviewer/red-team roles, current-cell artifacts, token
  discipline, review gates, and live proof capture.
- [Master Multi-Agent Implementation Coordinator](prompts/master-coordinator.md)
  is the one-entry prompt that resumes a track, opens cells, delegates role
  work, enforces independent review/red-team gates, and closes proven cells.
- [Step 07 Design Discussion Handoff](prompts/step-07-design-discussion-handoff.md)
  restores the unresolved Step 07 architecture context in a fresh chat without
  treating proposals as accepted or starting implementation.

Playbooks explain how people and agents work. They do not define runtime
entities, lifecycle authority, or machine contracts.

## Runtime Boundary

Nothing under this directory is a production dependency of agent coordination.
Runtime code, workflow/protocol configuration, Skills, and TaskSpecs must not
load or reference these playbooks.

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

This is useful while the CoordinationSession/AdhocTask/protocol runtime is not
capable of orchestrating the same process itself. It may also remain useful as
a manual recovery/debug procedure.

## End-State Lifecycle

After runtime coordination is implemented and verified:

- normal use goes through code, protocol/workflow config, Skills, and TaskSpecs;
- `playbooks/prompts/` is not read during execution;
- deleting or archiving the playbook must not change product behavior;
- retain it only as a manual fallback or a generic engineering procedure;
- move it to repository-wide engineering documentation if it is reused for
  unrelated features;
- archive it under history when self-hosted coordination has replaced the
  bootstrap process and the fallback is no longer needed.

The master coordinator prompt is retained while manual Codex/Agy-style
orchestration remains an active engineering need. Separate copy/paste prompts
for each subordinate role are optional fallback artifacts; the master prompt is
the normal entry point.
