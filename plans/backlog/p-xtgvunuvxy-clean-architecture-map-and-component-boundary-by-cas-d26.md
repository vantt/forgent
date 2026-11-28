---
id: p-xtgvunuvxy
title: "Clean architecture-map.md and component-boundary.md: brief-card layout, merge the duplicate tables, move the content that belongs elsewhere, and write the one-line text for about 70 rows (docs, priority P2; source: ds-zfqskcns7j, owner via Miu, 2026-11-28)"
status: proposed
priority: P2
area: component-authority
created: 2026-11-28
---

# Why

`docs/platform/component-boundary.md` has about 1249 lines and 79 references to it; most of its Advisory section already has an owner in the component or contract ledger. `architecture-map.md` is generated from the model and needs the new layout.

# Done when

- `architecture-map.md` renders the layerings from `layers.yaml` in the layout set by the component-authority discussion (`ds-zfqskcns7j`, point 2).
- `component-boundary.md` is reduced to what is only there; duplicate tables are merged and the rest moves to the owning ledger or spec.
- Every component row has a one-line `summary` and the documents read from it.
- No broken link: the 79 references still resolve.

# Notes

Depends on step A (plan `261127-1247-component-authority-layerings`, held by the owner) for the `summary` field.
