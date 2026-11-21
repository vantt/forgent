---
id: STR41
title: "Per-tier executor + executor port hexagonal-lite (D a4fe4c2b): (a) config runner cho MỖI TIER khai e"
status: done
priority: P2
area: general
created: 2026-11-21
---

# Why

Per-tier executor + executor port hexagonal-lite (D a4fe4c2b): (a) config runner cho MỖI TIER khai executor riêng `{command, args}` — light/standard/heavy cắm CLI khác nhau trong CÙNG một lượt drain; tier không khai riêng rơi về executor chung (config cũ chạy nguyên, backward-compat); (b) dispatch nâng CTR009 từ "mẫu spawn" thành interface executor CÓ TÊN (CTR009 v2) với adapter — hôm nay đúng một adapter `cli-spawn` (argv, shell:false, hành xử giữ nguyên); adapter `rpc/app-server` (vd codex app-server giao tiếp RPC, không phải CLI) chỉ xây khi có nhu cầu cắm thật — mua cái TÊN của bậc trừu tượng, chưa mua bậc

# Done when

...

# Notes

Migrated from the done/declined section of the legacy backlog. Original status: done.
