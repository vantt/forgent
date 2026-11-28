---
id: p-gyn72duyeg
title: "When to split a subcomponent and when to use a path exception: decide the rule, write it in the component-authority spec and enforce it at the declare door (component-authority, priority P2; source: owner via Miu, 2026-11-28)"
status: proposed
priority: P2
area: component-authority
created: 2026-11-28
---

# Why

The model has both subcomponents and path exceptions (CAS-D10), and nothing says which to use when. The choice is made case by case, so two similar cases end up modelled differently.

# Done when

- One rule in `docs/platform/component-authority/spec.md` that says when a part becomes a subcomponent and when a path exception is enough.
- `fgos authority declare` applies the rule: it refuses or warns by name when a declare breaks it.
- Existing rows that break the rule are fixed or carry a named exception.

# Notes

Prior art: CAS-D10 and CAS-D22 in `ds-zfqskcns7j`.
