---
id: p-peokivdmox
title: "`fgos authority locate` finds a component row by meaning through pkm (hybrid BM25 plus embedding), not only by name, alias and word overlap (component-authority, priority high; source: owner via the manual supervisor, 2026-11-24)"
status: proposed
priority: P1
area: component-authority
created: 2026-11-24
---

# Why

`packages/component-authority/rust/src/lib.rs` ranks a locate query by text only. `docs/platform/component-authority/spec.md` line 145 already records the intent to integrate pkm once the Documentation H2 search is done, and `fgos doc locate` is live in `packages/documentation`. A caller who describes a component in other words than its name or aliases gets no row.

# Done when

`authority locate` ranks rows by meaning with the same hybrid search `fgos doc locate` uses, and the questions below are answered in the plan's discussion.

# Open questions for the shaper

- Scope: locate only, or also the duplicate check of `declare`.
- Layer: may component-authority depend on documentation, or must the shared search sit in a lower layer (design principle 2, strict bottom-up).
- Relation to plan `261124-0837-docos-documentation-in-component-authority`: that plan only declares the docos code in the model and does not change how locate ranks.

# Notes

Request came by mail from the manual supervisor at the owner's order. Not started.
