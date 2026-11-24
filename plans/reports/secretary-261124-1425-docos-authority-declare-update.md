# Request from the DOCOS lead: let `fgos authority declare` update an existing component row

Source: DOCOS lead (design-lap), 2026-11-24, backlog item `p-2lpsdtxnrd`. No row of that id exists on main yet (checked at HEAD 9a6cae2ca), so the lead's row is probably still unlanded; do not mint a second id for the same request.

Blocks: plan `261124-0837-docos-documentation-in-component-authority`, which resumes from phase 2 once this is done.

## What is needed

`fgos authority declare`, or a sibling verb on the same door, must update a component row that already exists:
add `paths`, add `owns`, change `status`, under the same checks a new row passes. When the row's id and parent do not change, no owner question is needed.

Today declare only adds. For an existing row it refuses with `component "document-identity" already exists` (`packages/component-authority/rust/src/declare.rs`), and no verb edits an existing row.

Why: the plan above must add `packages/documentation/` and the locate door's ownership (the worker, the cache `.fgos/runtime/doc-locate/`, the verbs `fgos doc locate|index`) to the row `document-identity`, then move its status from designed to live. The owner chose to wait for this door rather than edit the model by hand or add a side row.

## Three defects found the same day, same component

1. `docs/platform/component-boundary.md` on origin/main (430cb42ba) disagrees with the model. `fgos authority render --check` refuses it. Running render changes 9 rows, all in the door-count column (for example convention 0 to 1, executor-model 9 to 10, fgos-gateway 0 to 1). Door rows were added without a re-render.
2. `fgos authority render --json` returns `written: []` although it did rewrite `component-boundary.md`.
3. `fgos authority render` run by the installed host from a linked worktree writes into the main checkout, because the host takes its project from the activation. `npm run fgos:dev` inside the worktree writes to the worktree correctly.

## Done means

- declare (or its sibling verb) updates an existing row with the new-row checks.
- The derived views on main pass `render --check`.
- render reports exactly the files it wrote.
- Report back so plan 261124-0837 continues from phase 2.

Evidence: phase 1 "As built" of plan 261124-0837.
