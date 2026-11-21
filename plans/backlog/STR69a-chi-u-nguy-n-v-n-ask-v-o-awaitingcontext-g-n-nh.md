---
id: STR69a
title: Chiếu nguyên văn `ask` vào `awaitingContext` (gần như free, dọn đường STR70a)
status: done
priority: P2
area: general
created: 2026-07-21
---

# Why

— tách từ STR69 (2026-07-21, per `docs/history/gate-dialogue-continuity/CONTEXT.md`'s locked decisions). Dữ liệu ĐÃ lưu sẵn: `gates[id].ask` (`repo/src/state/replay.mjs:130-132`), và `computeAwaitingContext` (`repo/src/state/awaiting-context.mjs:49-73`) đã đọc đúng `view.gates[id]` để tính `changedSinceAsk` nhưng bỏ qua `ask` nằm ngay cạnh. Không dữ liệu mới, không verb/event/contract mới, KHÔNG đụng STR61's own "material" decision. Bước đầu tiên của cụm, làm trước STR70a.

# Done when

...

# Notes

Migrated from the done/declined section of the legacy backlog. Original status: done.
