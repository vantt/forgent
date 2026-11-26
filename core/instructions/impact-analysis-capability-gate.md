---
id: impact-analysis-capability-gate
kind: procedure
owner: core
scope: repo
mode: append
specificity: 10
title: Impact-Analysis Capability Gate
description: Query the impact-analysis capability before treating the GitNexus rules as binding - inactive, degraded or full posture, and how to resolve more than one registered target
lifecycle: live
valid_from: 2026-11-26
related:
  - "[[dispatch-decide-door]]"
---

## Impact-analysis capability gate

The GitNexus "Always Do" / "Never Do" rules below assume GitNexus is
present on this machine. Before treating them as binding — and before
`fgos-coding-planning`/`fgos-coding-validating`/`fgos-coding-implement`
decide how much
impact-analysis evidence a plan's verify/test scope needs — query the
capability instead of assuming the tool. The answer is the same one a
dispatch gets, and the tool is probed live on every call:

```bash
fgos dispatch decide --for impact-analysis --json
```

- **`configured: false`** — Inactive: skip impact-analysis evidence in
  verify/test scope; note `impact-analysis: inactive` in the plan/verify
  note. Not a gap.
- **`mechanism: "unavailable"` (`reasonCodes` `tool.missing`,
  `tool.unprobeable` or `tool.unnamed`), or `stale: true`** —
  Degraded: run every other required check, mark that proof weak, and name
  the gap plainly (e.g. "GitNexus registered but not present on this
  machine — blast radius not confirmed", or "GitNexus present but its
  index is behind the current HEAD — blast radius may be stale"). A
  present tool only means it is installed, never that its index
  is fresh or intact — a suspicious zero-result or "not found"
  answer from an impact-analysis tool is worth a quick grep/rg cross-check
  before being trusted, regardless of what `fgos dispatch decide` reports.
- **`mechanism: "in-process"` without `stale`** — Full: the MUST rules below apply exactly
  as written. A `full` posture still is not a guarantee of complete
  per-file coverage: a genuinely fresh, non-stale index can still carry
  zero indexed symbols for one large/complex file (confirmed on
  `bin/fgos.mjs`, 5000+ lines, zero indexed `Function` symbols even
  immediately after a fresh reindex), a distinct mechanism from staleness
  that the cross-check line above already covers unconditionally.

**Multi-target resolution:** if the active impact-analysis providers tool errors because more than one target/repo is registered and needs disambiguation (e.g. "multiple ... indexed" / "not found"), never guess and never reuse any display string quoted in that error -- it is not guaranteed to be a valid value to pass back in. Instead, look at that same MCP servers own tool list for a listing/discovery tool (name suggests enumeration -- list/search/discover), call it to read back the exact registered identifiers, and match this project by a stable field it reports (an absolute path/scan-root, never a human-readable label) before retrying with that exact identifier.

This gate is prose the agent reads, never compiled logic — GitNexus is
the first registered provider for `impact-analysis`, not the only one
this gate can ever recognize. The block below regenerates from
GitNexus's own template on `gitnexus analyze`; edit this gate section
when the policy changes, never the rules inside the block.
