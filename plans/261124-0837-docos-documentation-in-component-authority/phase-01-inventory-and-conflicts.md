# Phase 1: Inventory and conflicts

## Context

Facts F1-F6 of plan.md. The model is changed only through `fgos authority declare`; this phase writes nothing in it.

## Files it writes

This plan's directory only (the inventory table in this file's "As built" section).

## Steps

1. `fgos authority model` and `fgos authority render --check` on current main: record whether the views are clean
   before any change, so a later failure is attributable.
2. For each path in F5, `fgos authority locate "<path and what it does>"` and the architecture test's mapping: record
   which row owns it today (or none).
3. Read the component-authority spec on `status` values, `mustNotOwn`, `exceptions` and how a child's ownership meets
   its parent's `mustNotOwn`; find how another area that runs a worker or writes a cache is modelled (for example
   `observe`, `event-store`).
4. Write the inventory: path, owner today, owner wanted, conflict, and the declare row each needs.

## Validation

The inventory lists every F5 path; each conflict names the rule of the spec it meets.

## Risk

The views may already be unclean on main because of the other lead's work: report it to that lead, do not fix it.

## As built (2026-11-24)

- **Views on main are not clean before this plan.** `fgos authority render --check` (dev host, origin/main at
  `430cb42ba`) refuses: `component-boundary.md` differs from the model. `fgos authority render` changes 9 rows, all in
  the door-count column (for example `convention` 0 → 1, `executor-model` 9 → 10, `fgos-gateway` 0 → 1): door rows
  were added without a render. This belongs to the component-authority-doors lead. The render reports
  `written: []` even when it rewrites the file. Phase 3 renders anyway, so the drift is regenerated there.
- **Plain `fgos authority render` from a linked worktree writes into the main checkout**, because the installed host
  resolves the project from the activation. Phase 3 runs it through `npm run fgos:dev` inside the worktree.

| Path (F5) | Owner today | Owner wanted | Conflict | Row change needed |
|---|---|---|---|---|
| `packages/documentation/` (crate `rust/`, `third-party/pkm/`) | none; `locate` matches `documentation` by name only | `document-identity` | none; other crates are paths of their row (F4) | add the path to `document-identity` |
| `apps/fgos/src/wiring/doc_locate.rs`, `apps/fgos/src/wiring/doctor/documentation.rs` | none | none | no row maps `apps/fgos/` wiring today | none; named in `owns` text only |
| `core/config-standard/docLocate.yaml`, `core/config-schema/docLocate.schema.yaml` | none | none | no row maps `core/config-standard/` | none; `docLocate` namespace named in `owns` |
| Index worker (`fgos doc index run`), cache `.fgos/runtime/doc-locate/`, machine model folder, Observe kind `fgos.doc.locate` | none | `document-identity` (`owns`) | parent `documentation` `mustNotOwn: runtime state mutation, code execution`; the spec and code treat `mustNotOwn` as prose, with no rule for how a child meets it | `owns` lines; status `designed` → `live` |

**Found and since resolved:** at the time of this inventory `fgos authority declare` added rows only and refused an
existing component ("component \"document-identity\" already exists"). The verb now takes `--update` for an
existing component row, so phase 2 has its door.
