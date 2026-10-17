---
phase: 4
title: "fgos dispatch explain, check doctor, spec, CHANGELOG"
status: done
effort: 6h
---

# Phase 04: `explain` và doctor

## Bối cảnh

- `fgos dispatch` hiện có `show-run`, `inspect`, `watch`, `recover`,
  `reconcile`, `decide`, `probe-account`; verb được đăng ký trong
  `src/cli/command-registry.mjs`.
- `checkModelPolicyTierCoverage` (`src/setup/registrations.mjs:736`) đòi đủ
  mọi tier mà `rigorToTier` sinh ra cho mỗi họ.
- AGENTS.md: thay đổi người dùng thấy được phải có dòng trong
  `CHANGELOG.md` `[Unreleased]`; check mới đăng ký qua registry của doctor.

## Việc làm

1. **Verb `fgos dispatch explain --for <capability> [--rigor <r>] [--json]`.**
   Gọi `bind()` như `decide`, rồi in theo thứ tự:
   - họ đã chọn và lý do (mục `prefer` nào);
   - tier và nguồn của tier (rigor, override, `maxTier`);
   - ô tier đầy đủ từ `resolveTierCandidates`, mỗi mục gắn nhãn `used`,
     `fallback-same-pool` hoặc `pending-pool-routing` (pool khác họ, chờ B1);
   - executor và invocation đã chọn;
   - account của pool theo kho cũ, và theo `llmAccounts` nếu có, gắn nhãn
     `declared` hoặc `missing`.
   Không lease, không spawn, không ghi file.
2. **Check doctor mới**, mỗi check một hàm trong `registrations.mjs`:
   - `executor-family-unique`: hai executor agent cùng họ (`providerModel`,
     hoặc họ suy ra) thì fail, nêu tên cả hai.
   - `model-policy-pools`: ô có `@pool` mà pool không có trong `llmAccounts`
     thì warn. Chỉ chạy khi config có ít nhất một `@`.
   - `llm-accounts-shape`: mọi `problems` của `readLlmAccounts` thì fail.
   - `llm-accounts-vs-legacy`: lệch giữa kho cũ và kho mới thì warn. Chỉ chạy
     khi `llmAccounts` tồn tại.
   - `global-model-policies-portable`: ô là mảng hoặc chứa `@` trong
     `~/.fgos/config.json` thì fail, vì bản cũ sẽ vỡ hoặc chạy sai model.
3. **Spec** `docs/specs/runner.md`: một rule mới, ghi
   - ngữ pháp ô tier (chuỗi hoặc mảng, `@` cuối, pool mặc định là họ);
   - ở đợt này, khi chạy chỉ dùng mục thuộc pool của họ;
   - thiếu ô thì từ chối `model-tier-missing` (nếu phase 02 đã làm);
   - `llmAccounts` chỉ được đọc để kiểm tra, lease vẫn dùng
     `runner.providers`;
   - quy tắc một họ một executor;
   - các check doctor mới.
4. **CHANGELOG** `[Unreleased]`: một dòng cho `dispatch explain`, một dòng cho
   các check doctor, một dòng cho ô tier dạng danh sách trong project config.

Ba sửa đổi ở `registrations.mjs`, `docs/specs/runner.md`, `CHANGELOG.md` đi
thành ba commit riêng.

## Kiểm chứng

- Test verb `explain` trên config đã commit và trên fixture có
  `llmAccounts` cùng ô `["deepseek-v4-flash@deepseek-api",
  "deepseek/deepseek-v4-flash"]`.
- Test từng check doctor ở cả trạng thái pass và fail, dùng fixture thật,
  không switch test-only.
- `fgos doctor` xanh trên config đã commit; chạy qua
  `npm run fgos:dev -- doctor` để dùng code trong working tree.
- `npm test` xanh.

## Kết quả (2026-10-17)

- `src/runner/execution/explain.mjs` (hàm thuần, tầng infra, gọi `bind()`); `bin/fgos.mjs`
  nạp config không ghi (`loadRunnerConfigFromDir`) và phát hiện herdr qua
  `detectHerdrPresent`, vì `run.mjs` ở tầng use-case. Đăng ký trong
  `command-registry.mjs`.
- Năm check đặt trong `src/setup/model-pool-checks.mjs` (giống
  `workflow-pool-independence.mjs`), `registrations.mjs` chỉ đăng ký; danh sách id
  check ở `distribution.md` hàng 7, bảng how-to doctor và `checks.test.mjs` cập nhật
  cùng commit.
- `fgos doctor` qua `npm run fgos:dev`: năm check mới đều pass trên config đã
  commit; 11 check khác đỏ từ trước, không liên quan.
- `explain` làm lộ một hành vi cũ: `fgos-coding-implement` headless vẫn ghim invocation
  pane `omp-gemini-tetcu72` với transport `cli` (pin của capability-prefer; đã ghi
  ngoài phạm vi trong `plan.md`).
- Spec: RUL102 trong `docs/specs/runner.md`; ghi luật thiếu ô vẫn rơi về như cũ
  (bước từ chối của phase 02 chờ anh).

## Rủi ro

- **Thấp đến trung bình:** chỉ đọc. Xung đột văn bản với phase cuối của các
  plan `261016-*`, xử lý bằng commit nhỏ.
