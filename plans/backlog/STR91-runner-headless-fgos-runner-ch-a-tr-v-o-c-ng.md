---
id: STR91
title: Runner headless (`fgos-runner`) chưa trỏ vào cùng nguồn skill với phiên tương tác — hoàn thiện phần "agent-type + tự nạp skill" mà STR49 để treo
status: done
priority: P2
area: general
created: 2026-07-23
---

# Why

(thảo luận 2026-07-23) — `dispatch.mjs`/`prompt-templates.mjs` (STR49, done) đã tách prompt thành template + bảng tra kind/tier/domain→file, nhưng dòng backlog STR49 tự ghi: "Agent-type + tự nạp skill" trong Story vẫn là hướng tương lai, chưa nằm trong CoS đã chốt vòng này. Prompt runner hôm nay (`worker-prompt-default.txt`) vẫn nhồi toàn văn Goal/Description/Worktree/Verify, không trỏ tới skill file nào. Việc: mở rộng bảng tra của `prompt-templates.mjs` để render prompt MỎNG ("bạn là agent-type X, load skill tại `repo/skills/<stage>/SKILL.md`" — cùng skill file mà STR89/STR90 dùng cho domain/stage đó), subprocess `claude -p` tự đọc skill trong chính worktree nó đang đứng (đã có checkout). Giữ nguyên 2 điều kiện khoá của STR49 (substitution thuần `{placeholder}`, không template-engine có logic; golden-file test). Kết quả cuối: `fgos-runner` (headless, spawn subprocess) và `/fgOS:pick` (interactive, STR90) HỘI TỤ vào đúng MỘT nguồn skill — khác nhau đúng một chỗ: ai nạp prompt (subprocess mới hay chính phiên đang mở).

# Done when

...

# Notes

Migrated from the done/declined section of the legacy backlog. Original status: done.
