# Architect-Level Proposals

```txt
Document type: Collection index
Audience: Human reviewer, architect, maintainer, agent
Purpose: Preserve mapped source text for independent conservation review
Design status: Candidate
Implementation: Source snapshot retained; current implementation truth not certified
Provenance: docs/architect/proposals/README.md at fb046210539cbcbe8ca1dab254763f5e78c573d2; blob 48a80d339a1f676a56153bac6677895e0d4eb377
Writer type: Agent draft writer
Canonical: No
Canonical for: Nothing; non-canonical candidate conservation carrier
Use this when: Reviewing source carriage, placement, intent and provenance
Do not use this for: Current authority, implementation proof or cutover approval
Last reviewed: Pending independent review
Related:
- docs/architect/proposals/README.md
Supersedes: None; legacy source remains intact
Superseded by: None
```

Added in candidate: Candidate carriage; Keep the map collection-index as a candidate snapshot. Its active list is historical source wording and will not describe the final live/history split; navigation owner owes reviewed update, no silent rewrite now. Original source metadata and text follow. Physical relative-link destinations alone are rebased to the same repository paths. Units with inherited missing links are preserved as literal fenced source text, without substituting another design or changing any assertion. Source metadata is provenance, not candidate authority.

Source relationship: [original source](../../architect/proposals/README.md).


Document type: Index
Design status: Discussion
Implementation: Not started unless each proposal says otherwise
Last reviewed: 2026-09-02

This folder holds proposals whose scope crosses one architecture area. A file
staying here means it is still a proposal, not accepted architecture. Once
accepted, extract the settled design into the relevant architect-level or
area-specific canonical document and leave the proposal as history.

Area-specific proposals stay under that area's own `proposals/` folder until
their scope crosses the area boundary.

## Active Proposals

- [Coordination Capability Envelope](coordination-capability-envelope.md) —
  discussion following the independent review: three architecture families,
  hard/soft boundaries, recommendation, migration responsibilities, and probes;
  not an accepted architecture or implementation plan.
- [Step 09: Group Thinking Substrate](step-09-group-thinking-substrate.md)
- [Architecture Advisory Panel](architecture-advisory-panel.md) — the next
  Group Thinking use case after `fgos-code-panel`: investigate and frame a
  software-system problem, deliberate on architectures, advise a person, and
  support a bounded decision dialogue.
- [Step 10: Coding Domain Adoption Of The Coordination Foundation](step-10-coding-domain-adoption.md)
- [Component Authority Boundary Map](component-authority-boundary-map.md)

## Handoff Prompts

- [Step 09 / Step 10 Replan Handoff Prompt](../agent-coordination/history/proposals-redesigns/step-09-step-10-replan-handoff-prompt.md)

## Added in candidate: Candidate collection routes

The historical active list above is preserved. This navigation lists the other
candidate files in this collection without changing their acceptance status:

- [architecture-advisory-panel](architecture-advisory-panel.md).
- [component-authority-boundary-map](component-authority-boundary-map.md).
- [coordination-capability-envelope](coordination-capability-envelope.md).
- [coordination-dispatch-contract](coordination-dispatch-contract.md).
- [coordination-envelope-probe-contract](coordination-envelope-probe-contract.md).
- [coordination-worker-provider-boundary](coordination-worker-provider-boundary.md).
- [dispatch-control-plane-redesign](dispatch-control-plane-redesign.md).
- [documentation-system-unification](documentation-system-unification.md).
- [doing-coordination-redesign](doing-coordination-redesign.md).
- [knowledge-registry-redesign](knowledge-registry-redesign.md).
- [step-09-group-thinking-substrate](step-09-group-thinking-substrate.md).
- [step-10-a0-coding-domain-boundary-facade-plan](step-10-a0-coding-domain-boundary-facade-plan.md).
- [step-10-coding-domain-adoption](step-10-coding-domain-adoption.md).
- [visibility-and-interactive-contact-herdr-spawn](visibility-and-interactive-contact-herdr-spawn.md).

For authoring, read [document types](../governance.md#3-document-types),
[metadata](../governance.md#5-metadata),
[link discipline](../governance.md#11-linking-discipline), and the
[proposal shape](../documentation/architecture/documentation-system-design.md#67-proposal).
Collection membership grants no design or implementation authority.
