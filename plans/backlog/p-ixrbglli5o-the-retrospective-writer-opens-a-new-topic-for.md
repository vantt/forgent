---
id: p-ixrbglli5o
title: "A core write door adds evidence to the unit that already carries a claim; the retrospective writer is its first caller (documentation, H2 build step 2)"
status: proposed
priority: P2
area: documentation
created: 2026-11-06
---

# Why

The registry holds 479 topics for 479 documents: `fgos-coding-knowledge` reserves a slot per item, so almost every
retrospective item opens a new topic and the corpus grows by copies. Owner 2026-11-06: open it, on condition that a
material-only item gets a completion path first, because `checkRetrospectiveContent`
(`src/state/cleanup-harness.mjs:361-458`) accepts only a non-engine decision, a linked existing document or a registry
attestation, and a probe of a material-only item returned `ok:false`
([panel outcome](../reports/council-261106-2216-docos-h2-document-identity-architecture-panel-outcome.md)).

Owner 2026-11-24 ([documentation spec](../../docs/platform/documentation/spec.md) section 4 step 2 and its decision
history): this is not a writer-specific path. Step 2 builds a **general write door in the core**; the retrospective writer
is its first caller. Locate through pkm (step 1, landed in efb1f5af3) is what lets the door find the unit.

# Done when

1. A write door in the core takes a drafted claim, finds the unit that already carries it through `fgos doc locate`, and
   adds the evidence (a link to the work item and its decision or incident) to that unit; it refines the claim's
   statement only when the item changed it ([write door 6.4](../../docs/platform/documentation/subcomponents/write-door/spec.md#64-the-retrospective-writer)).
2. Creating a new file is not done by the door: it files an admission request that waits for admission's decision.
3. The retrospective writer (`fgos-coding-knowledge`) calls that door and no longer reserves a slot per item; it opens a
   slot only when a person asks.
4. The cleanup gate accepts either the added evidence or the admission handoff, so a material-only item reaches cleanup
   through a named path, without weakening the gate or manufacturing a decision.
5. An always-loaded pointer line points every agent at the door.
6. New active topics per retrospective item are counted before and after, on real items.

# Notes

Scope rewritten 2026-11-24 by the DOCOS lead for the owner's decision of that day (general door, not a writer path).
Plan `261113-0124-docos-retrospective-claim-units` is a draft written before that decision and around the old build
order; it is re-planned for the general door before it can be set ready. The admission subcomponent itself (H2 step 4)
is out of scope: here the request is only filed and waits.
