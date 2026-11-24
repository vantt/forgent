---
id: p-2lpsdtxnrd
title: "`fgos authority declare` must update an existing component row, and three authority render defects (component-authority, priority high; source: DOCOS lead 2026-11-24, blocks plan 261124-0837)"
status: done
priority: P1
area: component-authority
created: 2026-11-24
---

# Why

`fgos authority declare` only adds rows; for an existing row it refuses ("component already exists") and no verb edits one. Plan `261124-0837-docos-documentation-in-component-authority` must add `packages/documentation/` and the locate door's ownership to the row `document-identity` and move its status from designed to live. The owner chose to wait for this door, not edit the model by hand or add a side row. Three render defects were found the same day: the derived view on main fails `render --check` (9 door-count cells), `render --json` returns `written: []` although it writes, and the installed host writes into the main checkout when run from a linked worktree.

# Done when

declare (or a sibling verb) updates an existing row (add `paths`, add `owns`, change `status`) under the new-row checks, with no owner question when id and parent are unchanged; main's views pass `render --check`; render reports exactly the files it wrote. Plan 261124-0837 then resumes from phase 2.

# Notes

Full request: `plans/reports/secretary-261124-1425-docos-authority-declare-update.md`. Id minted by the DOCOS lead; not re-minted.

Closed 2026-11-24 by the DOCOS lead: delivered by plan `261124-1433-authority-declare-update`, closed on the owner's word (998a55353); `declare --update` is in release 71dd6eb7.
