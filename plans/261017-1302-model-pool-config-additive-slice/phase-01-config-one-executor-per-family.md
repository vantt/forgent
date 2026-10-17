---
phase: 1
title: "Config: mỗi họ một executor, model cho gemini"
status: pending
effort: 4h
---

# Phase 01: mỗi họ một executor

## Bối cảnh

- `glm` và `glm-herdr` cùng `providerModel: "z-ai"`, cùng harness `pi`, cùng
  account openrouter; chỉ khác transport. Không capability nào trỏ
  `glm-herdr`; 21 capability trỏ `glm`.
- `claude-herdr` khai `providerModel: "claude"` và có đúng một invocation
  herdr (`claude-herdr-bwrap`). `claude` không khai `providerModel` (họ suy ra
  từ `supports.providerFamilies: ["claude"]`) và chỉ có invocation cli. 26
  capability trỏ `claude-herdr`.
- Mô tả của `claude-herdr` nói nó tách ra vì `claude` "bị gộp với
  `runner.executor` và mất invocation". Red-team đọc
  `src/runner/dispatch/resolve.mjs:270-276` và thấy entry được trả về nguyên
  vẹn.
- Hai invocation gemini (omp) không truyền `--model {model}`, nên
  `modelPolicies.gemini` không có tác dụng.

## Việc làm

1. **Chứng minh lỗi gộp không còn.** Thêm test vào
   `test/runner/execution/bind-committed-config.test.mjs`: executor `claude`
   có thêm một invocation herdr thì `bind()` trong herdr trả về invocation đó,
   và invocation cli vẫn còn. Test đỏ thì dừng phase, báo lại, không sửa code
   resolve ở đây.
2. **Glm:** chuyển invocation `pi-herdr-openrouter` từ `glm-herdr` sang
   `glm`; xoá `glm-herdr`.
3. **Claude:** thêm `providerModel: "claude"` và invocation
   `claude-herdr-bwrap` (y nguyên) vào `claude`; đổi 26 entry `prefer` từ
   `claude-herdr` sang `claude`, giữ nguyên dạng (chuỗi hay object); xoá
   `claude-herdr`.
4. **Gemini:** thêm `--model`, `{model}` vào `args` của hai invocation omp.
   Chạy một lần thật ở mỗi tier có model khác nhau
   (`fgos run "trả lời OK" --provider gemini --rigor <r>`). omp không nhận id
   nào thì sửa ô đó trong `modelPolicies.gemini` sang id omp nhận, và ghi id cũ
   với id mới vào báo cáo phase.

## Kiểm chứng

- So với baseline phase 00:
  - trong herdr, mọi capability ra cùng mechanism, invocation, tier, model;
  - ngoài herdr, chỉ 26 capability từng trỏ `claude-herdr` đổi từ "từ chối"
    sang claude cli; liệt kê đủ 26 dòng trong báo cáo phase;
  - gemini ra model theo ladder thay vì model của profile.
- `node --test test/runner/execution/bind-committed-config.test.mjs` xanh.
- `fgos doctor` xanh.

## Rủi ro

- **Trung bình.** Đổi executor cho 26 capability. Hoàn tác bằng revert commit.
- Anh đã chọn chấp nhận việc 26 capability chạy claude headless khi ở ngoài
  herdr (plan.md, "Quyết định của anh"); không ghim invocation herdr cho chúng.
