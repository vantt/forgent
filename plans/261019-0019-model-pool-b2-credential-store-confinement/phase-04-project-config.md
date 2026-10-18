# Phase 04: config forgentX khai store; chạy thật

Config sau phase này phải chạy được với **cả** release cũ đang active lẫn code B2: giữ `resourceBindings` và
`env[homeEnv]` (xoá ở phase 06).

## Context

- `.fgos/config.json` executors `openai`, `glm`, `deepseek`, `gemini`, `xai` (claude không có account, không đổi).
- Kết quả phase 00 bước 4, 5.

## Yêu cầu

1. **Mỗi invocation confined có account** khai `credentialStore`:

   | CLI | `use` | `homeEnv` | `files` |
   |---|---|---|---|
   | codex | `codex` | `CODEX_HOME` | bỏ trống (mặc định `auth.json`) |
   | pi (openai, openrouter) | `pi` | `PI_CODING_AGENT_DIR` | `auth.json`, `models-store.json`, `settings.json`, `trust.json`, `bin/fd` |
   | omp (gemini) | `omp` | `PI_CODING_AGENT_DIR` | `agent.db`, `config.yml` |
   | omp (xai) | `omp` | `PI_CODING_AGENT_DIR` | `agent.db`, `config.yml`, `models.db` |

   Danh sách lấy từ inventory global hiện tại (đúng những file đang được chép), không thêm bớt.
2. **Gộp trùng theo account:** `pi-cli-bwrap-tetnu|fgovn|tetcu72` → một `pi-cli-bwrap` (account đến từ lease;
   hậu tố hôm nay đã không quyết định account).
3. **Đổi id còn mang tên account** (invocation confined): `codex-herdr-fgovn`→`codex-herdr`,
   `omp-gemini-tetcu72`→`omp-herdr`, `omp-cli-bwrap-gemini-tetcu72`→`omp-cli-bwrap`, `omp-cli-bwrap-vantt`→
   `omp-cli-bwrap`, `omp-herdr-vantt`→`omp-herdr`, `pi-herdr-openrouter`→`pi-herdr`,
   `pi-cli-bwrap-openrouter`→`pi-cli-bwrap`. Sửa 3 pin gemini và 21 pin glm trong `prefer` theo id mới.
4. **Invocation không confined theo account** (`codex-cli-bypass-fgovn`, `pi-cli-<account>`, `omp-cli-vantt`,
   `pi-cli-openrouter`): xoá nếu phase 00 bước 5 không thấy caller; còn caller thì giữ, ghi lý do.
5. **Bỏ `OPENROUTER_API_KEY`** khỏi `env` các invocation pi openrouter nếu phase 00 bước 4 qua (key ở
   `auth.json` của store, đã nằm trong danh sách chép). Không qua: giữ, ghi câu hỏi mở 1.

## File

`.fgos/config.json`; test đọc config đã commit: `test/runner/execution/bind-committed-config.test.mjs`,
`test/runner/dispatch-policy-baseline-snapshot.test.mjs`, `test/runner/dispatch.test.mjs:1993`,
`test/runner/provider-adapter.test.mjs:256,384`, `test/runner/herdr-provider-invocations.test.mjs`,
`test/runner/execution/run-provider-failover.test.mjs`, `test/runner/execution/bind.test.mjs` (nếu đọc id).

## Bước

1. Thêm test: với config đã commit, mọi invocation có `credentialStore` thì `use === commandCli(command)` và
   `homeEnv` bằng tên env của binding cũ (chứng minh hành vi không đổi trong giai đoạn hai field).
2. Sửa config theo 1-5. Fixture test đổi id theo bảng; baseline snapshot ghi rõ dòng nào đổi vì sao.
3. So `fgos dispatch explain` mọi capability với baseline phase 00: cùng family, mechanism, model; invocation
   chỉ khác tên theo bảng 3.
4. **Chạy thật** (`npm run fgos:dev -- run "<prompt ngắn chỉ đọc>" --provider <id>`), mỗi cái một round:
   codex `codex-cli-bwrap`; deepseek `pi-cli-bwrap` (không key trong env); xai `omp-cli-bwrap`; một pane herdr
   (`pi-herdr` hoặc `omp-herdr`, không dùng account `fgovn` vì lane TRUST). Ghi `unitRunId`, kết quả, và danh
   sách file trong private home (từ attestation hoặc marker, không giá trị).
5. Xác nhận release cũ đang active vẫn chạy với config mới: `fgos dispatch decide --for review` và một round
   thật bằng `fgos` thường.

## Rủi ro / rollback

- Đổi id làm hỏng pin nào bị sót → `bind()` từ chối. Giảm: grep id cũ trên toàn repo trước commit; bước 3.
- Release cũ gặp invocation gộp/đổi tên: chỉ đổi tên, vẫn có `resourceBindings` → chạy như cũ (bước 5 chứng minh).
- Revert commit config.
