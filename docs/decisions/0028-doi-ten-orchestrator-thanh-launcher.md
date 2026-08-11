---
type: explanation
title: 0028 — Đổi tên pinned term `orchestrator` thành `launcher`
tags: []
timestamp: 2026-08-08T00:00:00.000Z
source_capture_ids: []
date: 2026-08-08
status: accepted
supersedes: [0026]
superseded_by: [0031]
relates_specs: [runner]
---

# 0028 — Đổi tên pinned term `orchestrator` thành `launcher`

## Bối cảnh

`0026` đặt tên **orchestrator** cho vai trò: tiến trình/cơ chế QUYẾT ĐỊNH
kích hoạt 1 rootTask, đứng nó lên, rồi bước ra hoàn toàn — logic chọn "item
nào tiếp theo" giữ THUẦN CƠ HỌC, không cần soul; soul chỉ vào cuộc SAU KHI
vai trò này đã quyết định kích hoạt rootTask nào (`0026`'s chính văn: "Vai
trò orchestrator KHÔNG CẦN soul").

Tên này sai nghĩa ngành: "orchestrator" trong ngành (Airflow, Temporal,
Kubernetes) chỉ định 1 tiến trình điều phối NHIỀU đơn vị theo thời gian,
duy trì liên hệ liên tục trong lúc chạy (dependency graph, retry, giám sát,
fan-in). Vai trò `0026` mô tả làm NGƯỢC LẠI: chọn đúng 1 item bằng logic cơ
học, đứng nó lên, rồi bước ra hoàn toàn — không điều phối gì thêm sau đó.
Gọi vai trò này là "orchestrator" là hứa quá: người đọc đi tìm logic điều
phối vốn không tồn tại trong vai trò này.

Người dùng chốt tên thay thế là **launcher** (2026-08-08), sau khi so sánh
4 ứng viên: launcher/invoker/activator/commander.

## Quyết định

Đổi pinned term `orchestrator` → `launcher` xuyên suốt prose fgOS tự sở
hữu (decision doc, `docs/history/*`, `docs/how-to/*`, comment trong
`src/runner/*.mjs`, và mọi chỗ khác dùng từ này theo đúng nghĩa vai trò
`0026` mô tả — kiểm từng chỗ, không đổi hàng loạt mù). KHÔNG đổi:
`herdr-plugin/src/**/*.rs`'s `PaneOrchestrator` (khái niệm Rust khác hẳn —
trait mở/focus terminal pane, dùng từ đúng, giữ nguyên), `docs/distillery/**`
(trích dẫn verbatim từ nguồn upstream), `plans/reports/**` (bản ghi lịch
sử, không sửa ngược).

Record này chỉ supersede TÊN GỌI của `0026`, không phải thiết kế/logic của
vai trò đó — 4 quy tắc chọn cơ chế dispatch, khái niệm rootTask/subTask/
capacity, và kế hoạch triển khai 5 pha trong `0026` giữ nguyên, chỉ đổi
nhãn "orchestrator" thành "launcher" mọi nơi nó xuất hiện.

Từ "orchestrator" sau khi giải phóng được ĐỂ DÀNH cho mục đích khác, CHƯA
gán nghĩa trong record này — ứng viên đã bàn (chưa chốt): tầng điều phối
N đơn vị chạy đồng thời + hợp nhất kết quả (`fgos-fanout`,
`fgos-runner --watch`). Một item sau này claim nghĩa mới cho từ này, nếu
cần.

## Hệ quả

- `0026` không sửa tại chỗ — vẫn đúng nguyên văn lịch sử của phần thiết kế
  (4 quy tắc dispatch, rootTask/subTask/capacity, kế hoạch 5 pha), chỉ đổi
  từ "orchestrator" thành "launcher" trong chính văn của nó (đây là phần
  ĐANG được rename, không phải phần bị đóng băng — khác với trường hợp
  `0006`/`0024` nơi `0006` giữ nguyên 100% chữ nghĩa cũ). `0026` nhận thêm
  `superseded_by: 0028` trong frontmatter, đúng khuôn STR72 trỏ-ngược-bắt-buộc.
- 6 skill (`.claude/skills/` + mirror `.agents/skills/`, 12 file) đang trỏ
  tới `docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-
  cli-spawn.md` bằng đường dẫn — **filename của `0026` không đổi**, nên 12
  file này không cần sửa gì (đường dẫn vẫn đúng, chỉ nội dung 0026 trỏ tới
  đã đổi từ vựng bên trong).
- Test guard (`test/docs/launcher-vocabulary-guard.test.mjs`) chống tái
  phạm: fail khi "orchestrator" xuất hiện trong prose fgOS tự sở hữu ngoài
  allowlist trên.

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
