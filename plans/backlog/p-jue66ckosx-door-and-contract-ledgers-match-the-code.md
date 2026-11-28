---
id: p-jue66ckosx
title: "The door ledger and the contract ledger match the code: a check fails when a declared door or consumer has no real code edge, and the present mismatches are fixed (component-authority, priority P2; source: owner via Miu, 2026-11-28)"
status: proposed
priority: P2
area: component-authority
created: 2026-11-28
---

# Why

The door ledger and the contract ledger are written by hand in the model. A door or consumer can be declared while no code edge supports it, and nothing reports it.

# Done when

- A check reports each declared door or consumer that has no real code edge (an import, a crate dependency or a contract reference).
- The existing mismatches are listed and fixed, or carry a named exception.
- The check runs where the other model checks run and fails on a new mismatch.

# Notes

Related: the layering checks of plan `261127-1247-component-authority-layerings` (report-only first, the component-authority discussion (`ds-zfqskcns7j`)).
