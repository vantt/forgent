---
id: wf-nested-frame-refund
title: "Trả phần frame chưa dùng của case con về case cha khi case con đóng. Hiện nay: lúc mở case con (nest"
status: proposed
priority: P2
area: workflow-case-ledger-and-admission
created: 2026-11-21
---

# Why

Trả phần frame chưa dùng của case con về case cha khi case con đóng. Hiện nay: lúc mở case con (nested case hoặc wave `--units` trong một case), case cha trích trước **toàn bộ** frame của case con (`reserveParentFrame`, `src/workflow/case-frame.mjs`; dispatches, mutatingDispatches, seat launches) và chỉ hoàn lại khi case con **không mở được** (`refundParentFrame`, idempotent theo reservation id). Case con xong mà mới dùng một phần thì phần dư mất. Cách làm dự kiến (không thêm cơ chế mới): khi case con có `case.closed` (playbook tự đóng lúc pass, conductor qua `fgos workflow close`), một sự kiện hoàn trên sổ case cha ghi phần dư = frame trích trước − frame case con đã dùng (lấy từ projection của case con), dưới `advance` của case cha, idempotent theo reservation id; status của case cha thấy `frameRemaining` tăng lại. Không hoàn khi case con hỏng/bị chặn/còn mở.

# Done when

Case cha không còn dừng hỏi người vì hết frame oan; phần hoàn có trên sổ, đếm lại được từ projection; một lần hoàn cho mỗi case con

# Notes

Migrated from the legacy backlog table. Original status: proposed (hoãn, owner 2026-10-20 09:44: làm khi có case thật hết frame vì phần dư bị giữ; chưa có case lồng nào chạy thật).
