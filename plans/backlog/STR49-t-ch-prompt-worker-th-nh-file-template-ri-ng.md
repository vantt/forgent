---
id: STR49
title: Tách prompt worker thành file template riêng + registry agent-type
status: done
priority: P2
area: general
created: 2026-07-18
---

# Why

(thảo luận 2026-07-18): `buildPrompt` (dispatch.mjs) hiện hard-code chuỗi trong code — tune câu chữ phải sửa code; tách ra file template versioned trong repo để review/diff/tune prompt như tài liệu. Chọn template qua **bảng tra cơ học** kind/tier/domain → file (cùng họ bảng tra tier→model, hợp RUL42 (STANCE trí-tuệ-giao-việc — picker cơ học vĩnh viễn) (runner) — không LLM trong vòng chọn; cùng hướng STR41 per-tier executor + STR18 domain registry). Prompt mỏng thành: định danh vai (agent type) + trỏ skill cần dùng + data item — worker chạy trong worktree của repo nên **tự nạp được skill** từ thư mục skill của repo. **Hai điều kiện giữ từ thiết kế hiện tại:** (1) substitution vẫn `{placeholder}` string-replace thuần, KHÔNG template engine có logic — giữ guarantee `shell:false` + prompt đoán-trước-được; (2) template là artifact có golden-file test (item mẫu → prompt kỳ vọng). Log dispatch (STR32/STR39) ghi kèm tên + hash template đã dùng để trace "worker sai vì prompt version nào"

# Done when

...

# Notes

Migrated from the done/declined section of the legacy backlog. Original status: done.
