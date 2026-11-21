---
id: STR93
title: "`fgos-exploring` không đọc lại phán quyết đã lưu của `judgeDiscovery` trước khi tự phán lại clarity; nhãn \"decompose early/late\" của `fgos-routing` trùng tên ngẫu nhiên với `judgeDecompose`, nên đổi cho rõ"
status: done
priority: P2
area: general
created: 2026-07-23
---

# Why

(audit 2026-07-23, tiếp nối STR50/induction). **Việc chính (load-bearing):** `judgeDiscovery` (`src/intake/discovery.mjs:129-157`) trả `{clear, question?, verify?}`, lưu vào `view.discovery[id]` qua `addDiscovery` (`:187`) — nhưng `fgos-exploring/SKILL.md` không hề đọc lại discovery record này trước khi tự đặt câu hỏi Socratic từ đầu; `fgos-routing`'s "Precedence" (`:85-95`) chỉ coi judge là trọng tài khi TRANH CHẤP, không phải input đầu vào cho suy luận — hệ quả: skill có thể tự sinh câu hỏi khác, mâu thuẫn với câu hỏi máy đã hỏi, tốn vòng hỏi-người thừa. **Việc phụ (naming, bounded, không đổi hành vi/FSM):** `fgos-routing`'s routing table dùng nhãn "decompose, early" / "decompose, late" — trùng tên ngẫu nhiên với `judgeDecompose` (khác trục hoàn toàn: routing table quyết route tới `fgos-planning` hay `fgos-validating`; `judgeDecompose` quyết pass-through/split/need-human/invalid — xác nhận không phải cùng một giá trị tính ra, chỉ trùng chữ). **Người dùng chốt 2026-07-23:** đổi nhãn thành **"decompose — shaping"** (→ `fgos-planning`) / **"decompose — proving"** (→ `fgos-validating`), khớp cách STR50's case-study đã mô tả (decompose(planning→validating)), không đổi stage data value `decompose`.

# Done when

...

# Notes

Migrated from the done/declined section of the legacy backlog. Original status: done.
