---
id: STR51
title: "Skill LLM-assist trước `submit`: nhận text tự do kiểu \"thêm vào backlog: làm X\", chạy một LLM đơn gi"
status: done
priority: P2
area: general
created: 2026-07-18
---

# Why

Skill LLM-assist trước `submit`: nhận text tự do kiểu "thêm vào backlog: làm X", chạy một LLM đơn giản để gợi ý phân loại (tier/kind/domain/risk) rồi mới gọi `fgos submit`/`add` với field đã điền — thay vì chỉ có `classify.mjs` cơ học (đếm từ khoá) và `--domain` thủ công (fold-về-coding nếu bỏ qua, `domains.mjs:81-90`) như hiện nay. Không phạm RUL42 (STANCE trí-tuệ-giao-việc — picker cơ học vĩnh viễn) (runner) (stance STR42, decision `f69951df`): đi qua đúng cửa field-trên-item — skill TỰ GHI field đã suy luận qua verb chuẩn, giống hệt một người tự tay truyền `--domain`/`--risk`, không phải orchestrator/picker gọi LLM trong vòng chọn-giao. Cân nhắc khi thiết kế: `submit` hôm nay không có flag override cho tier/kind/risk (chỉ `add` có) — có thể cần thêm override flags cho `submit`, hoặc skill route qua `add`. Khác STR8 (intent-scoring — chấm priority SAU khi item đã tồn tại, dùng graph metrics) và khác p50-workflow-induct's own domain-classifier decision (domain-classifier thông minh, deferred tới khi có domain thứ hai thật) — STR51 rộng hơn decision đó (gồm cả tier/kind/risk, không chỉ domain) và là một SKILL client-side, không phải thay đổi trong picker/orchestrator. Nêu ra 2026-07-18 trong lúc bàn p50-workflow-induct; không thuộc scope STR50. **Chốt 2026-07-18 (bàn cùng ngày với STR50): gộp vào Phase 2 (skill authoring) của p50-workflow-induct thay vì tách phase riêng — thiết kế đúng (skill ở tầng gọi trước submit, không sửa lõi) không đụng external-provider vào core code nên không đổi mode `standard` của STR50.**

# Done when

...

# Notes

Migrated from the done/declined section of the legacy backlog. Original status: done.
