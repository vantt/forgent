# Architecture Advisory Coordinator Prompt

```txt
Document type: Guide / runbook
Audience: Human reviewers, maintainers, documentation agents
Purpose: Retain cognitive coordinator guidance consumed by the registered advisory skill
Design status: Accepted at atomic cutover
Implementation: Cognitive companion only; registered Workflow owns execution and human gates
Provenance: `docs/architect/agent-coordination/playbooks/prompts/architecture-advisory-coordinator.md` at `947dc310396071a4d530216d5c06d05993d63bf5`
Writer type: Documentation maintainer
Canonical for: The stated document scope; source implementation limits remain explicit
Use this when: Maintaining advisory interpretation, evidence, dissent and owner boundaries
Do not use this for: Replaying historical commands, selecting executors/models or bypassing the registered skill
Last reviewed: No current review date recorded; retained source dates are historical
Related:
- docs/platform/agent-coordination/history/retired-engine/files/playbooks/prompts/master-coordinator.md
- docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md
- docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md
Supersedes: None; the retained source records the historical design
Superseded by: None
Carriage note: Promotion metadata only; source claims and implementation are not re-decided here
```

2026-11-03 cutover note: The legacy runner citation above is a historical coordinate, not a post-cutover link. Prepared successors: `docs/platform/runner/decisions/h-aabefc85f0c9.md`.
## Runtime Boundary

This companion is cognitive reference, not a standalone manual runtime. `core/skills/fgos-architecture-panel/SKILL.md:17-24` starts only the registered architecture-advisory definitions; config/bind owns routing and Workflow owns execution and human gates. The same skill explicitly keeps this prompt and the three companions for cognitive quality, not historical routing/API support (`core/skills/fgos-architecture-panel/SKILL.md:135-142`).

## Cognitive Use

Keep the person’s request verbatim. Distinguish interpretation, evidence, alternatives, constraints and dissent. Attribute each advisor’s statements; a recommendation does not authorize implementation, Work claiming, approval or merge. Preserve unanswered questions and reversal triggers rather than presenting consensus as proof. These boundaries follow `core/skills/fgos-architecture-panel/SKILL.md:26-35,124-133`.

Read the [role doctrine](../architecture-advisory-role-doctrine.md) for reasoning posture, [artifact templates](../architecture-advisory-artifact-templates.md) for why evidence and dissent have explicit places, and [evaluation rubric](../architecture-advisory-evaluation-rubric.md) for substantive quality criteria. Use the registered skill for executable operation; this page supplies no alternate launch or model-selection instructions.

## Historical Manual Prompt

The complete prior manual prompt, input examples, roster and retirement proposal are [preserved verbatim](../../history/retired-engine/files/playbooks/prompts/architecture-advisory-coordinator.md#literal-snapshot). They are dated history, not current APIs or safety proof. The former coordination engine was retired in `2180b4e72701bb090288af8fe8021008d9d42079`; `docs/specs/runner.md` recorded that retirement in its historical CoordinationSession section.

## Upstream Execution Door Transition

Upstream removed the raw `dispatch execute` door (decision 0062 in
`docs/platform/runner/decisions/h-36d872fbb0e5.md#0062-xoá-cửa-thô-dispatch-là-tầng-thấp-fanout-về-tầng-work-thay-phần-purpose-door-của-rul68-2-tầng-dispatch-và-phần-mỗi-cửa-một-lane-posture-của-rul77-posture-belongs-to-the-capability`). Its out-of-process invocation now uses a read-only
Unit: `fgos run "$(cat <immutable prompt file>)" --provider <safe-executor-id>
--capability review --json` (no `--writes`), from the actor's cwd.
This records the upstream public-door change within the current quality
companion; the preserved manual runtime recipe remains historical.
