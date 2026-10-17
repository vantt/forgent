---
title: "Đợt A: lát bổ sung cho hình dạng config model/pool/account"
description: "Dọn config để mỗi họ một executor; đọc ô tier dạng model hoặc model@pool; đọc runner.llmAccounts chỉ để kiểm tra; thêm dispatch explain và các check doctor chỉ đọc. Không đổi lease, confinement hay prefer."
status: pending
priority: P1
effort: 19h
branch: plan/model-pool-config-additive-slice
tags: [runner, config, model-policies, llm-accounts, explain, doctor]
created: 2026-10-17
---

# Đợt A: lát bổ sung cho hình dạng config model/pool/account

- **Thực hiện:** mục 5.2 và 5.3 (đợt A, câu trả lời đợt 0) của
  [problem-261017-0022-model-tier-selection-misfit.md](../reports/problem-261017-0022-model-tier-selection-misfit.md).
- **Bằng chứng va chạm:** hai lần rà soát `rfc`
  (`unit-run-1792205702240-a1927d84`, `unit-run-1792206977582-39f8e89a`): đợt A
  không đụng file nào các plan `261016-*` đã đăng ký sẽ sửa, trừ ba file văn bản
  chung (`registrations.mjs`, `docs/specs/runner.md`, `CHANGELOG.md`).
- **Không phụ thuộc xu hướng Rust:** không plan Rust nào dời phần đọc config,
  `bind()`, `resolveTierModel` hay kho account; không file `.rs` nào đọc
  `modelPolicies`, `rigorToTier` hay `credentialSource` (grep 2026-10-17).
- **Quyết định của anh áp vào đây:** `executors` giữ nguyên là một khái niệm;
  mỗi họ một executor; ô tier là `model` hoặc `model@pool`, tách ở `@` cuối;
  account là `runner.llmAccounts.<pool>.<account>.credentialStore.<cli>`;
  `prefer` dạng `{family, invocation}` khi ghim (làm ở đợt C, không ở đây);
  không field `billing`; account nào cũng là thư mục store; tên pool không
  normalize, từ chối alias.
- **Impact-analysis:** GitNexus có mặt nhưng index có thể cũ. Executor chạy
  `node .gitnexus/run.cjs analyze` rồi `impact` trên `resolveTierModel`,
  `supportsPolicyTier`, `validateModelPoliciesShape`,
  `sanitizeGlobalModelPolicies`, `bind` trước khi sửa, và báo blast radius.
- **Component boundary:** không đổi.

## Khác với bản ghi trong report (đọc code ngày 2026-10-17)

| Report ghi | Thực tế | Plan làm |
|---|---|---|
| A3 trả về đúng hình dạng `providerAccountInventory` và gộp vào kho lease | Kho cũ đòi `kind` và `files` trên account (`provider-capacity.mjs:68-156`); thiết kế mới chuyển chúng về invocation, việc đó thuộc B2 | Bộ đọc `llmAccounts` chỉ phục vụ `explain` và doctor; lease không đọc nó cho tới B1 |
| A2 cho phép danh sách và `@pool` | Lease còn xoay account theo họ (`capacityProviderOf`, `account-pin.mjs:17`) cho tới B1 | Khi chạy, `bind()` chỉ dùng mục thuộc pool của họ; mục khác hiện trong `explain` với nhãn `pending-pool-routing` |
| Gộp claude cần sửa lỗi "gộp với `runner.executor`" | Red-team thấy lỗi đó không còn (`resolve.mjs:270-276`) | Phase 01 chứng minh bằng test trước, không sửa lỗi |
| Gemini thêm `--model {model}` | Ladder gemini dùng id kiểu agy (`gemini-3.8-flash-low`, `gemini-4-argon-high`) | Phase 01 chứng minh omp nhận các id này bằng một lần chạy thật; không nhận thì sửa ladder trong cùng phase |

## Phạm vi

Trong đợt A: dọn executor claude/glm, model cho gemini; bộ đọc ô tier; luật
"thiếu ô tier thì từ chối"; validator chỉ cho danh sách/`@` ở project config;
bộ đọc `llmAccounts` chỉ đọc; verb `fgos dispatch explain`; các check doctor
chỉ đọc; spec và CHANGELOG.

Ngoài (đợt B, C và item riêng): lease, state và quarantine theo pool; lọc
account theo store; `credentialStore` trên invocation và trong confinement;
bước dự phòng nguồn; `prefer` theo họ; chuyển global config; xoá
`runner.providers`; trần tier, luật lên tier, `maxTier` ở `assignment-policy`,
model của agent in-process.

## Phase và phụ thuộc

| Phase | Nội dung | Phụ thuộc | Giờ |
|---|---|---|---|
| [00](phase-00-preconditions.md) | Thay đổi config chưa commit của anh được commit; chụp baseline `dispatch decide` | — | 1 |
| [01](phase-01-config-one-executor-per-family.md) | Gộp `glm-herdr` vào `glm`, `claude-herdr` vào `claude`; `--model {model}` cho gemini | 00 | 4 |
| [02](phase-02-tier-cell-reader.md) | Bộ đọc ô tier, validator project/global, thiếu ô thì từ chối | 00 | 5 |
| [03](phase-03-llm-accounts-reader.md) | Bộ đọc `runner.llmAccounts` chỉ đọc, kiểm tên pool | 00 | 3 |
| [04](phase-04-explain-and-doctor.md) | `fgos dispatch explain`, check doctor, spec, CHANGELOG | 01, 02, 03 | 6 |

01, 02, 03 chạy song song được: 01 chỉ sửa `.fgos/config.json`; 02 sửa
`resolve.mjs`, `dispatch/config.mjs`, đoạn chọn model của `bind.mjs`; 03 là
file mới. 04 cần cả ba.

## Thứ tự commit và va chạm

- Mỗi phase là một hoặc vài commit nhỏ.
- Phase 04 tách riêng ba commit cho `src/setup/registrations.mjs`,
  `docs/specs/runner.md`, `CHANGELOG.md`, vì phase cuối của mọi plan
  `261016-*` cũng sửa ba file này.
- Không sửa `provider-capacity.mjs` (holder-lock P09), `confinement/*`,
  `assignment-runner.mjs` (run-supervisor P07–P09, terminal-mode P05–P06) hay
  `execution/run.mjs` (controller-death P02).

## Định nghĩa xong

- `npm test` xanh; mỗi hành vi mới có test thật, không switch test-only.
- `test/runner/execution/bind-committed-config.test.mjs` chứng minh mọi
  capability ở mọi rigor bind ra cùng executor, invocation và model như
  baseline của phase 00, trừ các thay đổi phase 01 ghi rõ.
- `fgos doctor` xanh trên config đã commit.
- `fgos dispatch explain` chạy được trên config đã commit và trên một config
  thử có `llmAccounts` cùng ô `model@pool`.
- Spec `docs/specs/runner.md` có rule mới cho ngữ pháp ô tier, luật thiếu ô,
  `llmAccounts` (chỉ đọc ở giai đoạn này), quy tắc một họ một executor;
  CHANGELOG có dòng `[Unreleased]`.

## Quyết định của anh trong plan này

- **26 capability trỏ `claude-herdr` (2026-10-17, anh chọn a):** chấp nhận
  thay đổi. Trong herdr, kết quả giữ nguyên. Ngoài herdr, hôm nay chúng bị từ
  chối vì `claude-herdr` chỉ có invocation herdr; sau phase 01 chúng chạy
  claude headless. Không ghim invocation herdr cho chúng.

## Outstanding questions

None
