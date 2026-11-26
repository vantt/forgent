---
id: p-xz3rns7o52
title: "Backlog-to-ready pipeline as an independent, domain-agnostic workflow for portfolio backlog rows (supervision/work; source: owner via shaper of ds-ipvis4jkpc, 2026-11-26)"
status: proposed
priority: P1
area: work
created: 2026-11-26
---

# Why

Backlog rows with no discussion and no plan (for example p-l54vuzupa5, p-6sd4fslxv7, p-vyzy7isj3z, p-oq4hnkqyai)
never move by themselves. Work already has clarify, discover, plan and triage stages (`docs/platform/work-state/spec.md`
#12, #21, #26), but they run only for Work items and lean to coding. The owner (2026-11-26 11:16) asks to extract this
path from Work into an independent, domain-agnostic workflow that serves portfolio backlog rows. Source:
`plans/discussions/ds-ipvis4jkpc-release-chain-command/DISCUSSION.md` §3 row 3, and its decision that this pipeline is a separate topic.

# Done when

A settled discussion for this topic is handed to a planner.

# Notes

Backlog row → clarify on intake (rewrite a terse request so it is explicit, classify it) → triage against the managed
goals by goal priority → discover (facts into the discussion) → exploring only when discover is incomplete → planning
→ `ready`, run just in time: late enough that the codebase does not drift under the plan, early enough that a `ready`
plan waits when its turn in the delivery queue comes.

Interface: §3 row 15 of ds-ipvis4jkpc and its decisions that delivery intent is a `delivery` flag in plan frontmatter, that only plans flagged for delivery are admitted, and that this pipeline is a separate topic. The pipeline produces a `ready` plan carrying the `delivery`
flag. Open here: whether the delivery commitment can sit on a backlog row before any plan exists, and how "just in
time" is timed.
