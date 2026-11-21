---
id: p-26c4a4fd
title: "`pick` (`bin/fgos.mjs`, case `'pick'`, ~dòng 1248-1303) tạo worktree mới cho MỌI item (root lẫn leaf"
status: proposed
priority: P2
area: general
created: 2026-07-28
---

# Why

`pick` (`bin/fgos.mjs`, case `'pick'`, ~dòng 1248-1303) tạo worktree mới cho MỌI item (root lẫn leaf) luôn fork từ `currentHead(repoRoot)` (main) — KHÔNG có phân biệt leaf-vs-root base-branch như `review`/`approve` đã có sẵn: `approve` cho leaf (`resolveRoot(id) !== id`) merge branch con vào `fgw/<rootId>` qua ephemeral worktree đứng trên `fgw/<rootId>`, KHÔNG BAO GIỜ main trực tiếp (`bin/fgos.mjs:1704-1721`); `review` cũng diff leaf so với `branchNameFor(rootId)`, không phải trunk (`bin/fgos.mjs:1525-1532`, comment tự ghi "leaf-vs-root split"). `pick` không áp cùng pattern này. Phát hiện dogfood thật (decision 0018, item `tsk-1wd`→`tsk-1wd-3`, 2026-07-28): `tsk-1wd-3` (`evaluateExpr`, `deps: ["tsk-1wd-2"]`, `parent: tsk-1wd`) cần `import` cả `tokenize.mjs` (từ `tsk-1wd-1`) lẫn `evaluate.mjs` (từ `tsk-1wd-2`), nhưng nhánh `fgw/tsk-1wd-3` (fork từ main) không có file nào của hai anh em — vì cả hai còn ở `fgw/tsk-1wd-1`/`fgw/tsk-1wd-2` riêng, CHƯA approve/merge vào `fgw/tsk-1wd`, và dù có approve rồi thì `pick` vẫn fork `tsk-1wd-3` từ main chứ không phải từ `fgw/tsk-1wd`. Đúng model đã có ở `approve`/`review`: integration LUÔN đi qua cha (`fgw/<rootId>`), không bao giờ sibling-to-sibling, không bao giờ main cho tới khi root tự merge. Workaround thủ công: `approve` từng con xong theo `deps` order rồi `git merge fgw/<rootId>` vào worktree con tiếp theo trước khi code.

# Done when

`pick` áp cùng leaf-vs-root logic `resolveRoot`/`branchNameFor(rootId)` đã có ở `review`/`approve`: fork worktree của một leaf từ `fgw/<rootId>` (branch cha) thay vì main; dogfood xác nhận một chain nhiều con phụ thuộc nhau (`deps`) build được liên tục qua `pick` mà không cần merge tay

# Notes

Migrated from the legacy backlog table. Original status: proposed.
