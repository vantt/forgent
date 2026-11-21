---
id: STR60
title: "Bug thật: `fgos return`'s working-tree-cleanliness check (`isFgosOnlyStatusLine`, `bin/fgos.mjs`/`src/runner/merge.mjs`) chỉ loại trừ status line có tiền tố `.fgos/` literal"
status: done
priority: P2
area: general
created: 2026-07-18
---

# Why

— tìm ra qua dogfood STR59 (cell `fgos-sample-testbed-2`, 2026-07-18): khi cwd nằm trong một thư mục con của repo git thật (vd `repo/dogfood-fixture/`, không phải root), `git status` báo path theo dạng `<subdir>/.fgos/...` (tương đối với git top-level thật), không phải `.fgos/...` — nên exclusion không bao giờ khớp, và `return` liên tục từ chối "working tree not clean" dù state store của chính nó vừa tự sinh ra. Workaround đã dùng (không sửa source fgOS): commit kèm luôn các file `.fgos/*` tự sinh của fixture trong cùng commit với code change. **Mở rộng phát hiện (cell `fgos-sample-testbed-5`, item `divide`, cùng ngày):** gate này KHÔNG chỉ vướng bởi leftover `.fgos/*` — `isWorkingTreeClean` scan `git status` của TOÀN BỘ repo thật (`repo/`), không giới hạn trong cwd/subdirectory đang chạy, nên BẤT KỲ file nào khác trong `repo/` đang uncommitted (ví dụ `docs/backlog.md` do orchestrator sửa song song) cũng chặn `return` y hệt. Phạm vi bug rộng hơn ban đầu: không phải riêng `.fgos/` path-prefix, mà là toàn bộ cleanliness-check chưa cwd-scope đúng cho một fixture nằm trong subdirectory

# Done when

...

# Notes

Migrated from the done/declined section of the legacy backlog. Original status: done.
