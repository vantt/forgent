---
id: p-73d99989
title: "[NGHIÊM TRỌNG — rủi ro mất dữ liệu thật]"
status: proposed
priority: P2
area: general
created: 2026-07-28
---

# Why

`reclaimOrphanedCheckout` (`src/runner/worktree.mjs:130-161`) force-remove (`git worktree remove --force`) BẤT KỲ checkout nào đang tồn tại của một branch, không hề kiểm tra checkout đó có thật sự "orphaned" (bị bỏ hoang) hay đang là một session/worktree SỐNG đang được dùng. `createWorktree` gọi hàm này bất cứ khi nào `branchExists(...)===true` (nhánh "reused"). `approve` cho một leaf item tạo ephemeral worktree đứng trên `fgw/<rootId>` để merge (`createWorktree(repoRoot, rootId, {})`, `bin/fgos.mjs:1721`) — NẾU `fgw/<rootId>` đã có checkout sống (chính là worktree người/phiên đang đứng làm việc thật), lệnh `approve` một CON sẽ ÂM THẦM XOÁ SẠCH worktree của CHA đang sống, không cảnh báo, không hỏi. Phát hiện dogfood thật (decision 0018, item `tsk-1wd`, 2026-07-28): chạy `approve tsk-1wd-1` (một leaf), worktree gốc `/tmp/fgos-worktrees/tsk-1wd-lVclki` — nơi cả phiên này đang đứng làm việc `tsk-1wd` từ đầu — biến mất ngay sau lệnh, phát hiện tình cờ lúc `ls /tmp/fgos-worktrees/` để tìm file khác. May mắn: mọi commit đã nằm trên `fgw/tsk-1wd` (8 commit, xác nhận nguyên vẹn qua `git log`) nên không mất code thật, chỉ mất thư mục checkout (khôi phục ngay bằng `git worktree add` mới). Nếu phiên CHƯA commit tại thời điểm đó, đây sẽ là mất trắng thật.

# Done when

`reclaimOrphanedCheckout` phải phân biệt được checkout thật-sự-orphan (không tiến trình nào sống trong đó, ví dụ tra registry phiên như `approve`'s multi-session guard đã làm ở chỗ khác, `bin/fgos.mjs:1591-1617`) với checkout đang có phiên/session sống — chỉ force-remove trường hợp đầu; dogfood xác nhận `approve` một leaf KHÔNG xoá worktree gốc đang có phiên sống, kể cả khi branch cha đó "reused"

# Notes

Migrated from the legacy backlog table. Original status: proposed.
