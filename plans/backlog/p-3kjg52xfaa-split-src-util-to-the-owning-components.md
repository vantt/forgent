---
id: p-3kjg52xfaa
title: "Split src/util/ to the components that own its files (component-authority, priority P2; source: ds-zfqskcns7j CAS-D19, owner via Miu, 2026-11-28)"
status: proposed
priority: P2
area: component-authority
created: 2026-11-28
---

# Why

`src/util/` holds code of many components with no owner of its own, and the layering checks cannot place its files.

# Done when

- Every file under `src/util/` belongs to one component, and moves to or is referenced from it.
- No new shared bucket replaces it (L10).
- Callers are moved in the same change and the old path is removed.

# Notes

Depends on step A (every file under `coverage.roots` has exactly one owner, CAS-D17).
