---
authoritative_for: fgos-coding-planning pass-through action/footprint sync, worker prompt empty Directive, --action flag on fgos edit
---

# A pass-through (non-split) item's worker prompt used to render an empty `Directive`

`tsk-3hp` closed a real, confirmed-live cold-pickup risk: `fgos-coding-
planning` never synced `action`/`footprint` for a pass-through (non-
split) item before dispatching it to `fgos-coding-implement`, leaving the
worker prompt's `Directive` and `Files to read first` sections rendering
as `(none)`.

## The gap, and how it was structurally invisible before this fix

`action` was only ever set through the `decompose` verb for split
children (per an earlier decision, D1 of `tsk-3xd`) — a pass-through item
never went through that path, so its `action`/`footprint` stayed
`undefined`. `fgos-coding-planning`'s own `verify-sync-and-gap.md`
defined a sync step for the `verify` field, but no equivalent step for
`action`/`footprint`.

## Confirmed live

Driving `tsk-577p`: `buildPrompt(work)` rendered `"# Directive\n(none)"`
and `"# Files to read first\n(none)"` because both fields were
`undefined`. The driving session had to notice this gap itself and
manually run `fgos edit --footprint` pointing at `plan.md` before
dispatching, so the worker — especially an out-of-process executor with
no conversational context — had a real path into `plan.md` instead of
only the item's raw description. Named as a real cold-pickup risk against
`coding-worker-contract.md`'s own Layer 1 rule 3 (a worker must refuse
when missing context) — the danger being a worker that does **not**
refuse and instead silently guesses from the description alone.

## What shipped

`fgos-coding-planning`'s `verify-sync-and-gap.md` gained a footprint-sync
step for **every** pass-through item, not just split ones — pointing at
`plan.md` plus the files already named in the plan's own Approach
section, the same way `verify` was already synced. Alongside this,
`--action` was added to `fgos edit`'s own settable-field list
(`bin/fgos.mjs`), making the workaround the driving session previously
had to improvise (editing `--footprint` by hand) an officially supported
path for `action` too.
