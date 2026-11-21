---
id: STR70a
title: Checkpoint distillate + record chốt 3-phần lên gate (fgOS core, KHÔNG bị chặn)
status: proposed
priority: P2
area: general
created: 2026-07-21
---

# Why

— nửa không-vướng của STR70 (tách 2026-07-21, per `docs/history/gate-dialogue-continuity/CONTEXT.md`'s locked decisions). Verb non-transitioning ghi distillate {câu hỏi diễn giải lại, options + trục so sánh, leaning + lý do quote nguyên văn người, đã-loại, còn-treo} lên `gates[id]`, LWW, chiếu qua `awaitingContext`; verb DÙNG CHUNG người/agent — nhưng ĐIỀU KIỆN TIÊN QUYẾT là fold `actor` vào gate record (hiện `gates[id]` chỉ giữ `ask`/`answer`/`parentSnapshotAtAsk`, KHÔNG actor — `repo/src/state/replay.mjs:126-134`) để phân biệt note-người vs tóm-tắt-agent. Record bền lúc chốt nở thành CẤU TRÚC 3 phần: vì-sao / mốc-trao-đổi / đánh-đổi (không còn `reason` một dòng). Tiền lệ verb non-transitioning đã có: `decision`/`outcome` (`repo/docs/platform/work-state/spec.md`, "Decision Verb" and "Outcome Recording"). Đều là fact bền hợp core, KHÔNG lật STR46's own foundational decision.

# Done when

`awaitingContext` mang distillate + record 3-phần; `actor` chiếu vào gate phân biệt được nguồn; distillate human-overridable, chỉ `answer` authoritative

# Notes

Migrated from the legacy backlog table. Original status: proposed.
