---
id: p-jz2d2oid2m
title: "The component authority model owns the documentation code that locate added, and the boundary views are rendered from it (documentation, priority P1; owner decision 2026-11-24)"
status: proposed
priority: P1
area: documentation
created: 2026-11-24
---

# Why

Locate through pkm added code (`packages/documentation/`, the `fgos doc` wiring, a doctor group, the `docLocate`
config namespace, an index worker process and a runtime cache) that no row of `packages/component-authority/model/`
owns. The `document-identity` row still says `designed` with docs paths only, and its parent `documentation` says
it must not own code execution or runtime state mutation. `docs/platform/component-boundary.md` is rendered from that
model, so it cannot be fixed by hand. The owner asked on 2026-11-24 to do this as its own plan, because the
integration may raise several problems.

# Done when

Every file locate added maps to one model row through `fgos authority declare`; the conflict with `documentation`'s
`mustNotOwn` is resolved on purpose; `fgos authority render --check` and the architecture test pass; the rendered
views name the locate port, the pkm adapter, the `fgos doc locate|index` verbs, the worker and its cache. The plan is
`plans/261124-0837-docos-documentation-in-component-authority/plan.md`.

# Notes

Split out of phase 7 of `plans/261122-2217-docos-pkm-locate-door/`.
