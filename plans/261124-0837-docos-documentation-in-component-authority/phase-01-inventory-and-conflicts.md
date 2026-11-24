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
