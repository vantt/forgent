---
phase: 3
title: "Bộ đọc runner.llmAccounts, chỉ đọc"
status: done
effort: 3h
---

# Phase 03: bộ đọc `llmAccounts`

## Bối cảnh

- Kho account hiện là `runner.providers.<provider>.accounts`, chỉ đọc từ
  `~/.fgos/config.json`, validate ở `provider-capacity.mjs:68-156`, và bị từ
  chối nếu nằm trong project config (`:56-66`).
- Thiết kế mới: `runner.llmAccounts.<pool>.<account>` gồm
  `credentialStore: { <cli>: <đường dẫn> }`, cộng `label` và `disabled` tuỳ
  chọn; chỉ ở global.
- `src/` không có chỗ nào đọc `llmAccounts`, nên bản cũ bỏ qua khoá này.
- Lease chưa đọc kho mới cho tới đợt B1. `provider-capacity.mjs` thuộc
  holder-lock P09, nên phase này không sửa file đó.

## Việc làm

1. **File mới** `src/runner/dispatch/llm-accounts.mjs`:
   `readLlmAccounts(runnerConfig)` trả về
   `{ pools: { <pool>: { accounts: { <id>: { label, disabled, stores: { <cli>: <path> } } } } }, problems: [...] }`.
   - Mở `${HOME}` như kho cũ đang làm.
   - Không ném lỗi; mọi sai sót nằm trong `problems` để doctor và `explain`
     đọc.
2. **Kiểm tra trong bộ đọc:**
   - tên pool chứa `@`;
   - tên pool là alias của `normalizeProviderFamily`
     (`src/runner/dispatch/provider-adapter.mjs:82-101`), ví dụ `codex`,
     `openai-codex`, `glm`, `agy`;
   - account không có store nào;
   - đường dẫn store không phải chuỗi.
3. **Project config:** `llmAccounts` trong project config là một problem
   `project-llm-accounts`, đúng như luật của kho cũ.
4. **Đối chiếu kho cũ:** `compareWithLegacyInventory(runnerConfig)` liệt kê
   account có trong kho cũ mà thiếu ở kho mới và ngược lại, với khoá state
   tương ứng (pool `openai` ứng với provider cũ `openai-codex`). Dùng cho
   doctor ở phase 04.

## Kiểm chứng

- Test mới `test/runner/llm-accounts.test.mjs`: config hợp lệ; tên
  pool có `@`; tên alias; account rỗng; `llmAccounts` trong project; đối chiếu
  với kho cũ có lệch hai chiều.
- `npm test` xanh. Không test nào của `provider-capacity` đổi.

## Kết quả (2026-10-17)

- `src/runner/dispatch/llm-accounts.mjs`: `readLlmAccounts(runnerConfig, { projectConfig })`,
  `compareWithLegacyInventory`, `legacyStateKey`. Dùng lại `expandCredentialHome`
  (`provider-credential-probe.mjs`), `normalizeProviderFamily` và
  `providerAccountInventory`; không sửa `provider-capacity.mjs`.
- Alias: tên không phải họ nào của config (khoá `modelPolicies`, `providerModel`)
  nhưng chuẩn hoá trùng một họ (`codex`, `openai-codex`, `glm`, `agy`). Báo
  kèm tên họ nên dùng.
- Validator runner không chặn khoá lạ ở cấp `runner`, nên bản cũ bỏ qua
  `llmAccounts` như giả định.
- Trên config thật của máy (chưa có `llmAccounts`): 6 account cũ đều ở
  `onlyLegacy`; 0 problem.
- Đối chiếu theo khoá state cũ: kho cũ khai account OpenRouter dưới `z-ai` và
  `deepseek`; theo thiết kế mới chúng thuộc pool `openrouter`, nên doctor ở
  phase 04 sẽ báo chúng lệch cho tới khi anh khai `llmAccounts`.

## Rủi ro

Thấp. File mới, không ai gọi ngoài phase 04.
