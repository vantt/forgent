---
id: p-4b7dd2ed
title: "`fgos-coding-exploring/SKILL.md` đòi commit CONTEXT.md lên nhánh `fgw/<id>` trước khi gọi `fgos disc"
status: proposed
priority: P2
area: general
created: 2026-07-28
---

# Why

`fgos-coding-exploring/SKILL.md` đòi commit CONTEXT.md lên nhánh `fgw/<id>` trước khi gọi `fgos discover` ("uncommitted CONTEXT.md invisible tới phiên re-claim sau"), nhưng `.gitignore:45` loại trừ TOÀN BỘ `/docs/history/` — CONTEXT.md không bao giờ commit được như luật đòi. Phát hiện dogfood thật (decision 0018, scenario `expr-eval-chain`, item `tsk-1wd`, 2026-07-28) khi chạy làm-rõ thật lần đầu qua `fgos-coding-exploring`. **Đã fix tại `fgw/tsk-1wd` (commit `ffd211a`)** — un-ignore `/docs/history/` (+3 path liên đới cùng gốc). **Đã xác minh lại + đóng vòng qua fgOS (tsk-2gw, 2026-08-21)**: `.gitignore` hiện tại (main) xác nhận không còn loại trừ `docs/history/` (`git check-ignore` sạch trên `docs/history/*/CONTEXT.md`/`plan.md`/`RESEARCH.md`, tự động hoá tại `test/setup/gitignore-docs-history-not-excluded.test.mjs`); bằng chứng sống thêm cùng đêm: `tsk-1i3`'s own `CONTEXT.md`/`plan.md`/`RESEARCH.md` commit sạch lên `fgw/tsk-1i3` không trở ngại gì.

# Done when

`.gitignore` và luật commit của `fgos-coding-exploring` nhất quán với nhau — hoặc bỏ `/docs/history/` khỏi `.gitignore` (cho phép commit CONTEXT.md thật), hoặc sửa luật skill để không đòi commit (đổi nơi lưu / chấp nhận local-only tường minh); chọn một, áp dụng, dogfood xác nhận CONTEXT.md sống sót qua một lượt re-claim — **ĐÃ ĐẠT, xem tsk-2gw**

# Notes

Migrated from the legacy backlog table. Original status: proposed.
