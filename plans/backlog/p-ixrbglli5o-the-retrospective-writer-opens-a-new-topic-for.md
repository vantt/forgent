---
id: p-ixrbglli5o
title: The retrospective writer opens a new topic for almost every item
status: proposed
priority: P2
area: documentation
created: 2026-11-06
---

# Why

The registry holds 479 topics for 479 documents. `fgos-coding-knowledge` reserves a slot per item; it should grow or re-attest an existing document by default and reserve a new slot only when a person asks. Blocker found by the panel red-team: an item that only leaves material has no completion path, because `checkRetrospectiveContent` (`src/state/cleanup-harness.mjs:361–458`) accepts only a non-engine decision, a linked existing document or a registry attestation; a probe of a material-only item returned `ok:false`. Owner 2026-11-06: open it, on condition that this path is found first ([outcome](../plans/reports/council-261106-2216-docos-h2-document-identity-architecture-panel-outcome.md), [write door 6.4](platform/documentation/subcomponents/write-door/spec.md#64-the-retrospective-writer)).

# Done when

A material-only retrospective item reaches cleanup through a named, existing evidence path, without weakening the gate or manufacturing a decision; the writer grows or re-attests by default and reserves only on a person's request; new active topics per retrospective item are counted before and after

# Notes

Migrated from the legacy backlog table. Original status: proposed.
