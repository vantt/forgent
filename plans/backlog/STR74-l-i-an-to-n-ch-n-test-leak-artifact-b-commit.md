---
id: STR74
title: Lưới an toàn chặn test-leak artifact bị commit (belt cho STR75, cắt cơ chế clobber STR65 nhanh)
status: done
priority: P2
area: general
created: 2026-07-21
---

# Why

(2026-07-21). Bổ sung `repo/.gitignore`: `output.txt`, `*-output.txt` (bọc họ fixture `worker-output.txt`/`synth-output.txt`/`coding-output.txt`), `.fgos/sessions.json` (ephemeral runtime, cùng lớp `.fgos/state.json` đã ignore); và `git rm --cached output.txt` (rác đang tracked từ `595db87`, không xoá logic). Chỉ là lưới — KHÔNG thay STR75 (fix gốc cô lập cwd); và không chặn được nếu code `git add` đúng tên file, chỉ chặn kiểu quét rộng `git add -A` (đúng cơ chế clobber STR65).

# Done when

...

# Notes

Migrated from the done/declined section of the legacy backlog. Original status: done.
