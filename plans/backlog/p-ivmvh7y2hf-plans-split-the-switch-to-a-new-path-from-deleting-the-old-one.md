---
id: p-ivmvh7y2hf
title: "Plans split the switch to a new path from deleting the old one, and a deletion estimate counts the tests it retires (planning, priority medium; source: owner, 2026-11-22 18:40, lesson from s6a phase 21)"
status: proposed
priority: P2
area: planning
created: 2026-11-22
---

# Why

Plan 261118-1341-s6a-execution-tier-rust put two jobs into phase 21: moving production callers onto the Rust door, and deleting the old Node code. Its estimate of "about one more day" counted only production importers. It missed about 170 test files that test the deleted modules directly, each of which must name the Rust test that now owns its behaviour (design principle 8), so the real cost was 3 to 4 days. The user value came from the switch alone. The owner chose to stop after the switch (option B, 2026-11-22 18:23) and moved the deletion to p-24xw2cwdvo. The owner asked at 18:40 that this lesson be kept.

# Done when

The planning skill (core/skills/fgos-coding-planning and the shared plan contract) says:
1. When a plan replaces a mechanism, the switch to the new path and the deletion of the old path are separate phases, each with its own acceptance line. The plan states whether it may close after the switch, with the deletion opened as an item (L10).
2. A deletion phase's estimate counts the modules, the tests that import them, and the replacement proofs each retired test must name.

The rendered skills are rebuilt, and a validating check or a skill test catches a replacement plan whose single phase carries both jobs.

# Notes

Evidence: lead:S6A's owner question at about 18:20 on 2026-11-22, and lead:SUPERVISOR's lesson note to the owner.
