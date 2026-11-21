---
id: STR48
title: Kênh attention/push ("cần bạn") như một subsystem có delivery-semantics
status: proposed
priority: P2
area: general
created: 2026-11-21
---

# Why

— tách từ STR46 vì chiều-ra chủ động KHÔNG phải bolt-on mà là hệ con riêng, đòn bẩy UX cao nhất + rủi ro cao nhất. Phải chốt 5 thuộc tính: **at-least-once** (item chờ lâu chắc chắn người được ping, không rơi), **dedup** (một gate không ping N lần), **routing** (người/thiết bị/kênh nào), **ack** (đã xem chưa), **escalation** (không đáp trong ngưỡng → ping lại / đổi kênh / đổi người). Sống ở **CONSUMER daemon** (poll data_hash STR37 / tail log STR39 + giữ kênh outbound), **core fgOS vẫn passive** — đây là chỗ hiện thực hoá "không bị động" mà lõi KHÔNG mọc organ push nội tại. Đứng trên STR46 (contract in/out), STR39 (log substrate), STR37 (poll rẻ). Reference pattern: airemote notify (at-least-once, watcher-fed) trên herdr-gateway; herdr `notification.show`.

# Done when

Một spec kênh attention nêu rõ 5 thuộc tính (at-least-once/dedup/routing/ack/escalation); một "cần bạn" thật của item chờ-người được giao ĐÚNG-MỘT-LẦN tới người, có ack, không đáp trong ngưỡng thì escalate đúng — chứng minh trên item thật, core không thêm trạng thái push nội tại

# Notes

Migrated from the legacy backlog table. Original status: proposed.
