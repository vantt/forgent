---
id: STR68
title: "`discovery.mjs`'s judge call can return prose instead of JSON when nested inside an already-running dispatched worker session, causing a spurious `awaiting-human` fail-safe park"
status: done
priority: P2
area: general
created: 2026-07-20
---

# Why

(phát hiện 2026-07-20, trong p50-workflow-induct Phase 3 case-study, item `tsk-5gc` trong `dogfood-fixture`) — `judgeDiscovery` (`src/intake/discovery.mjs`) spawn `claude -p {prompt} --model {model} ...` (theo `.fgos-runner.json`) và bắt buộc stdout `JSON.parse` được thành `{clear: boolean, ...}`; bất kỳ lỗi nào (exit khác 0, timeout, stdout không parse được) đều gộp vào cùng fail-safe `{clear:false, question: DEFAULT_UNCLEAR_QUESTION}` — đúng thiết kế "không bao giờ coi phán đoán không chắc là pass" (module's own fail-safe comment). Nhưng khi lệnh `claude -p` này được gọi TỪ BÊN TRONG một phiên Claude subagent đã đang chạy (dispatched worker), model con đôi khi trả lời bằng văn xuôi thay vì JSON thuần (tái hiện thủ công, read-only: `claude -p "Reply with exactly this JSON..." --model sonnet ...` trả về văn xuôi từ chối, không phải JSON) — item hoàn toàn rõ ràng (`power(base, exponent)`, linear, không mơ hồ) vẫn bị park `awaiting-human` oan, không phải vì item thật sự mơ hồ mà vì lớp gọi lồng-nhau không ổn định. Full evidence: `docs/history/p50-workflow-induct/reports/p50-workflow-induct-6.md` §6 (Root-cause diagnostic)

# Done when

...

# Notes

Migrated from the done/declined section of the legacy backlog. Original status: done.
