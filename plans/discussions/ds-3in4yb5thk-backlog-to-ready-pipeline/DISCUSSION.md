---
id: ds-3in4yb5thk
title: "Backlog-to-ready pipeline: an independent, domain-agnostic workflow that brings portfolio backlog rows to a ready plan just in time"
status: open
source:
  - p-xz3rns7o52
created: 2026-11-26
---

discussion: open

## Seed

Opened by the supervisor on the owner order of 2026-11-26 11:16, relayed by the shaper of ds-ipvis4jkpc (D10). Read the source backlog row and `plans/discussions/ds-ipvis4jkpc-release-chain-command/DISCUSSION.md` §3 rows 3 and 15, D5, D6, D10 first. Park owner questions in the question store instead of waiting on them.

- **Outcome:** a domain-agnostic workflow, extracted from Work, that takes a portfolio backlog row through clarify on intake, triage against the managed goals by goal priority, discover into the discussion, exploring only when discover is incomplete, and planning, to a `ready` plan carrying the `delivery` flag, timed just in time.
- **Interface (fixed by ds-ipvis4jkpc):** the pipeline produces a `ready` plan with the `delivery` flag (D5, D6); the release-chain admission consumes it.
- **Open:** whether the delivery commitment can sit on a backlog row before any plan exists; how "just in time" is timed; which Work stages (`docs/platform/work-state/spec.md` #12, #21, #26) are reused versus moved.
