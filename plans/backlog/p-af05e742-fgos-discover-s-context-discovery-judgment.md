---
id: p-af05e742
title: "`fgos discover`'s context-discovery judgment (`buildDiscoveryPrompt`, `src/intake/discovery.mjs:113-"
status: proposed
priority: P2
area: general
created: 2026-07-28
---

# Why

`fgos discover`'s context-discovery judgment (`buildDiscoveryPrompt`, `src/intake/discovery.mjs:113-137`) đòi model "đề xuất một lệnh `verify` chạy được thật" nhưng KHÔNG đưa bất kỳ thông tin cwd/cấu trúc thư mục repo nào vào prompt (chỉ title/description/refs/deps/graph-context/QA history) — model không thể biết verify chạy từ đâu (`goal-check.mjs`: `spawn(item.verify, {cwd: repoRoot của worktree})`) hay một feature nằm trong nested package (vd `dogfood-fixture/`, có `test/` + `package.json` riêng) cần prefix path. Phát hiện dogfood thật (decision 0018, item `tsk-1wd`, 2026-07-28, `fgos-coding-validating`): verdict `clear=true` gắn `verify: "node --test test/expr/*.test.mjs"`, chạy từ cwd thật ra `no matches found` (exit 1) vì thiếu prefix `dogfood-fixture/`. Systemic — tái diễn cho BẤT KỲ item nào có file trong subdirectory/nested package, không riêng cách diễn đạt item này.

# Done when

`buildDiscoveryPrompt` (và anh em split-work judgment tương tự nếu có) đưa vào prompt đủ ngữ cảnh cwd/layout để model đề xuất `verify` đúng path chạy-được — vd cây thư mục top-level + package.json con nào tồn tại; test dogfood chứng minh một item nested-package nhận `verify` đúng ngay từ discover, không cần sửa tay sau ở `fgos-coding-validating`

# Notes

Migrated from the legacy backlog table. Original status: proposed.
