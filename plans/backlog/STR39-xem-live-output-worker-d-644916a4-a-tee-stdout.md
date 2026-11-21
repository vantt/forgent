---
id: STR39
title: "Xem live output worker (D 644916a4): (a) tee stdout/stderr của worker TỪNG CHUNK vào `.fgos/logs/<id"
status: done
priority: P2
area: general
created: 2026-11-21
---

# Why

Xem live output worker (D 644916a4): (a) tee stdout/stderr của worker TỪNG CHUNK vào `.fgos/logs/<id>.log` ngay khi đến — qua đúng cửa worker-log (một-cửa của worker-dispatch-log), giữ nguyên khối kết-cục cuối (timeout/hỏng-spawn vẫn bắt được, resolve trên exit không đổi) → `tail -f` thành cửa sổ xem live per-item, N worker song song không giẫm dòng nhau; (b) tùy chọn stream-json qua executor args trong config runner — thuần Host Adapter, zero code. File log live là chất nền cho chiều-ra của STR38 (UI tail + đẩy)

# Done when

...

# Notes

Migrated from the done/declined section of the legacy backlog. Original status: done.
