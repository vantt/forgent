---
id: ds-p4ne2byuez
title: "Authority declare updates an existing component row, plus three authority render defects"
status: settled
source:
  - p-2lpsdtxnrd
created: 2026-11-24
---

discussion: settled

The owner set this request to high priority on 2026-11-24 and had already chosen to wait for this door rather than edit the component model by hand or add a side row. The DOCOS lead's request is complete as written; it is seeded here unchanged so a planner can bind to it. Full request: `plans/reports/secretary-261124-1425-docos-authority-declare-update.md`.

## Hand-off to the planner

- **Outcome:** `fgos authority declare`, or a sibling verb on the same door, updates a component row that already exists (add `paths`, add `owns`, change `status`) under the same checks a new row passes. When the row's id and parent do not change, no owner question is needed.
- **Constraints:** extend through the existing door (L10); the checks a new row passes are the checks an update passes, not a lighter set. The shape (flag on declare or a sibling verb) is the planner's choice, stated in the plan with what was reused. Today's refusal is `component "<id>" already exists` in `packages/component-authority/rust/src/declare.rs`.
- **Non-goals:** changing a row's id or parent (that stays an owner question); any change to plan 261124-0837 itself.
- **Acceptance criteria:** (1) declare, or the sibling verb, updates an existing row's `paths`, `owns` and `status` under the new-row checks; (2) the derived views on main pass `fgos authority render --check` (today `docs/platform/component-boundary.md` is out of line: 9 door-count cells differ, for example convention 0 to 1, executor-model 9 to 10, fgos-gateway 0 to 1); (3) `fgos authority render --json` lists exactly the files it wrote (today it returns `written: []` although it rewrites `component-boundary.md`); (4) the installed host's `fgos authority render` run from a linked worktree writes into that worktree, not the main checkout (today it takes its project from the activation; `npm run fgos:dev` already writes correctly).
- **Unblocks:** plan `261124-0837-docos-documentation-in-component-authority`, which resumes from phase 2: it adds `packages/documentation/` and the locate door's ownership (worker, cache `.fgos/runtime/doc-locate/`, verbs `fgos doc locate|index`) to the row `document-identity` and moves its status from designed to live.
- **Open points:** none that block.
