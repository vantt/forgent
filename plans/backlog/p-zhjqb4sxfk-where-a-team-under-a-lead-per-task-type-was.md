---
id: p-zhjqb4sxfk
title: "Where \"a team under a lead per task type\" was settled is not found; today a lead leads one plan, not one task type (workflow, priority medium; source: the workflow-engine discussion's open point, owner via Miu, 2026-11-21)"
status: proposed
priority: P2
area: workflow
created: 2026-11-21
---

# Why

The owner's understanding is that a task type such as code-implement or bug-fix is carried out by a team that a lead manages, with a persona, skills and a workflow. The scan confirmed persona, skills and workflow as settled (D-ADR0070 (a workflow is a guide plus a case ledger, soft inside and hard outside), D-ADR0072 (who sits a seat is chosen only by bind()), D-ADR0073 (the workflow, case, unit, pattern and run vocabulary) and D-ADR0076 (Work is the surface)), but found no decision for "one team under a lead per task type": `core/agents/lead.yaml` leads one plan, and docs/platform/workflow/spec.md §7.8 has a conductor case driven by `fgos-cook`. See docs/discussions/workflow-engine/DISCUSSION.md §3.

# Done when

Either the earlier discussion or decision is found and cited in that discussion, or the owner settles it and the decision goes into the workflow spec's decision history. No mechanism is built under this row.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
