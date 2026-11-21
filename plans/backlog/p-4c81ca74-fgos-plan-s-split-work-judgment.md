---
id: p-4c81ca74
title: "`fgos plan`'s split-work judgment (`buildDecomposePrompt`, `src/intake/plan.mjs`, cơ chế LLM thật qu"
status: proposed
priority: P2
area: general
created: 2026-07-28
---

# Why

`fgos plan`'s split-work judgment (`buildDecomposePrompt`, `src/intake/plan.mjs`, cơ chế LLM thật qua nested `claude -p` — không phải mechanical) chỉ nhận title/kind/risk/verify/refs/deps — KHÔNG BAO GIỜ đọc `work.description` (đầy đủ, không cắt) VÀ KHÔNG BAO GIỜ đọc `docsRef`-trỏ CONTEXT.md/plan.md mà `fgos-coding-exploring`/`fgos-coding-planning` vừa khoá. Phát hiện dogfood thật (decision 0018, item `tsk-1wd`, 2026-07-28): `title` bị cắt giữa câu lúc submit (dừng ngay trước phần evaluate/evaluateExpr/precedence); split-work model chỉ thấy tiêu đề cụt, tự bịa kiến trúc AST (`parse(tokens)` → `evaluate(ast)`) hoàn toàn khác 3 hàm đã khoá trong CONTEXT.md (`tokenize`→`evaluate(tokens)`→`evaluateExpr(string)`, không AST). `discovery.mjs` (stage `discovery`) có cùng lỗ hổng gốc (không đọc docsRef), CHƯA sửa ở đây — chỉ split-work judgment được reproduce+fix trực tiếp. **Đã fix tại `fgw/tsk-1wd`**: `buildDecomposePrompt` giờ nhận thêm `description` đầy đủ + nội dung CONTEXT.md/plan.md (đọc best-effort qua `docsRef`, không lỗi nếu thiếu); test suite 1463/1463 xanh sau sửa. 3 con sai (`tsk-1wd-1/2/3`, đã tạo trước khi phát hiện) được sửa tay qua `fgos edit` để khớp lại plan đã khoá.

# Done when

`buildDecomposePrompt` (đã fix) + xét áp cùng pattern cho `buildDiscoveryPrompt`/`discovery.mjs` (chưa fix, cùng lỗ hổng); dogfood xác nhận một item nested-decision (CONTEXT.md/plan.md có nội dung khác title) nhận split-work verdict khớp quyết định đã khoá, không tự bịa kiến trúc khác

# Notes

Migrated from the legacy backlog table. Original status: proposed.
