# Platform Foundations

```txt
Document type: Platform foundations
Audience: Human reviewer, architect, maintainer, agent
Purpose: Route readers through locked platform laws and durable constraints
Design status: Draft
Implementation status: Partial
Canonical: Yes, after review
Owner: Platform documentation
Source type: Promoted anchor from docs/platform-foundations.md and docs/specs/platform-foundations.md
Last reviewed: 2026-09-13
Related:
- docs/platform/README.md
- docs/platform/vision.md
- docs/platform-foundations.md
- docs/specs/platform-foundations.md
```

## 1. Purpose

This is the target platform-docs anchor for fgOS foundations. The full legacy law text remains in `docs/platform-foundations.md` during migration.

Use this document to know which laws exist, when they apply, and where to read the full wording.

## 2. Authority

Platform laws are durable constraints. Changing a law requires superseding its decision record; do not silently edit the old rationale away.

During migration:

- this file is the target reader entry;
- `docs/platform-foundations.md` remains the full source text;
- `docs/specs/platform-foundations.md` remains the generated/curated spec projection.

## 3. Law Summary

| Law | Summary | Full source |
| --- | --- | --- |
| L1 | Durable data declares whether it is log or state. | `docs/platform-foundations.md` |
| L2 | Memory has lower mechanical layers and higher learning layers. | `docs/platform-foundations.md` |
| L3 | JSONL/event changesets are truth; databases are rebuildable views unless a named threshold supersedes this. | `docs/platform-foundations.md` |
| L4 | Routing depends on the audience of each interface; there is no one global routing model. | `docs/platform-foundations.md` |
| L5 | Definition of done is the six-question stranger-agent test. | `docs/platform-foundations.md` |
| L6 | Platform maturity uses the F0-F5 ladder and needs real evidence. | `docs/platform-foundations.md` |
| L7 | Run complete, merge complete, and durable are different states. | `docs/platform-foundations.md` |
| L8 | Always-loaded doctrine follows placement, transport, and anchor-suite rules. | `docs/platform-foundations.md` |
| L9 | A single work item has separate run, merge, and durability completion levels. | `docs/platform-foundations.md` |
| RUL11 | Tùm lum is not “heavy”; when the system is messy, consolidate boundaries and contracts. | `docs/platform-foundations.md`, `docs/specs/platform-foundations.md` |

## 4. Design Gate

Before accepting a platform design, check:

| Question | Why |
| --- | --- |
| Is the artifact log or state? | Prevents ambiguous durability. |
| Which component owns the authority? | Prevents hidden ownership drift. |
| Which contract is touched? | Keeps boundaries explicit. |
| What proves done? | Keeps results reproducibly verifiable. |
| What learning remains? | Keeps the platform compounding. |

## 5. Component Boundary Link

If a law-driven change affects component ownership or authority boundaries, also update `docs/platform/component-boundary.md` or record `No component-boundary change`.

## 6. Related Docs

| Need | Read |
| --- | --- |
| Full law text | `docs/platform-foundations.md` |
| Spec projection | `docs/specs/platform-foundations.md` |
| Platform vision | `vision.md` |
| Component map | `component-boundary.md` |
