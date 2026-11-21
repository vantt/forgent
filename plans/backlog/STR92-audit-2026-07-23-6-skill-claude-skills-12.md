---
id: STR92
title: "Audit 2026-07-23: 6 skill `.claude/skills/*` + 12 plugin `plugins/fgOS/skills/*` chưa tận dụng hết năng lực cơ học fgOS đã có sẵn"
status: done
priority: P2
area: general
created: 2026-07-23
---

# Why

(quét thật `node bin/fgos.mjs --help` (31 verb) + đọc toàn bộ 18 SKILL.md, đối chiếu). **Load-bearing nhất:** (1) `fgos-planning` (`SKILL.md:69-96`, bước "Approach" + "Decide the split") không hề gọi `fgos graph` — `src/state/graph-metrics.mjs`'s `criticalPath`/`greedyTopUnblock` tính sẵn thứ tự phụ thuộc dài nhất + xếp hạng unblock, nhưng skill tự đoán thứ tự bằng judgment thuần thay vì đọc từ graph. (2) Bước split (`SKILL.md:82-90`) tạo item con qua `parent` nhưng KHÔNG set `--footprint` — item vừa tách là cặp dễ đụng file nhau nhất, nhưng thiếu footprint thì `fgos conflicts` không có gì để so. (3) `fgos-exploring` khoá quyết định chỉ ghi vào `CONTEXT.md`, không bao giờ gọi `fgos decision --text "..."` (verb log-native, `bin/fgos.mjs:816-819`) — quyết định khoá ở đây KHÔNG xuất hiện trong `view.decisions`/`fgos list` cho bất kỳ ai đọc máy thay vì grep doc. **Nhẹ hơn:** (4) `plugins/fgOS/skills/graph/SKILL.md:4-9,48-53` mô tả thiếu — `graphMetrics()` trả về cả `criticalPath`/`topUnblock`/`staleBlocked` nhưng wrapper chỉ nhắc tới component/what-if, khiến agent theo skill này báo cáo thiếu đúng JSON nó vừa lấy về. (5) `fgos-routing`'s Orient (`SKILL.md:19-27`) chỉ đọc `list`/`ready`, chưa nhắc `triage`/`stale`/`rollup` dù mô tả skill có nhận câu hỏi "what should I work on next" mà `triage` trả lời trực tiếp. **Sạch, không cần sửa:** `fgos-validating`, `fgos-compounding`, `fgos-indexing`, cả 12 plugin verb-wrapper (verb/flag khớp đúng, không lệch tên). **Không phải gap (informational):** `init/discover/edit/rebuild/repair/review/approve/reject/catchup/evolve/session` chưa được skill nào nhắc tới — đây là verb admin/engine-internal hoặc dành cho người, không phải lỗ hổng.

# Done when

...

# Notes

Migrated from the done/declined section of the legacy backlog. Original status: done.
