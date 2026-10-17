---
title: "Đợt A: lát bổ sung cho hình dạng config model/pool/account"
description: "Sửa test vỡ khi gemini chuyển sang omp; dọn config để mỗi họ một executor; đọc ô tier dạng model hoặc model@pool; đọc runner.llmAccounts chỉ để kiểm tra; thêm dispatch explain và các check doctor chỉ đọc; rigor do capability khai thì nâng trần tier. Không đổi lease, confinement hay prefer."
status: pending
priority: P1
effort: 33h
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
| Gemini thêm `--model {model}` | Ladder gemini dùng id kiểu agy (`gemini-3.8-flash-low`, `gemini-4-argon-high`) | Đã giải ở phase 05: chạy thật cho thấy omp khớp cả bốn id sang `gemini-3.8-flash` / `gemini-4-argon`; ladder giữ nguyên |

## Phạm vi

Trong đợt A: dọn executor claude/glm, model cho gemini; bộ đọc ô tier; luật
"thiếu ô tier thì từ chối"; validator chỉ cho danh sách/`@` ở project config;
bộ đọc `llmAccounts` chỉ đọc; verb `fgos dispatch explain`; các check doctor
chỉ đọc; spec và CHANGELOG.

Cũng trong đợt A (gom thêm 2026-10-17):
- sửa 35 test vỡ khi gemini chuyển từ agy sang omp (phase 05);
- rigor do capability khai thì nâng trần tier của capability đó, và kiểm hai
  bộ tính tier `bind()` / `assignment-policy` (phase 06). Gom từ brief
  `brief-261017-1350-capability-tier-cap.md` (commit `f84fcc02e`), đã xoá.

Ngoài (đợt B, C và item riêng): lease, state và quarantine theo pool; lọc
account theo store; `credentialStore` trên invocation và trong confinement;
bước dự phòng nguồn; `prefer` theo họ, và việc luật transport chưa coi ghim
invocation trong `prefer` của capability là ghim (`advise` ghim
`claude-cli-bwrap` nhưng trong herdr vẫn chạy pane); chuyển global config; xoá
`runner.providers`; luật lên tier; model của agent in-process; restage release
để nhóm test `rust-host` chạy được.

## Phase và phụ thuộc

| Phase | Nội dung | Phụ thuộc | Giờ | Trạng thái |
|---|---|---|---|---|
| [00](phase-00-preconditions.md) | Commit config của anh; chụp baseline `bind()` | — | 1 | xong |
| [05](phase-05-gemini-omp-tests.md) | Sửa 35 test vỡ khi gemini chuyển sang omp; thêm `--model {model}` cho gemini | 00 | 3 | xong |
| [01](phase-01-config-one-executor-per-family.md) | Gộp `claude-herdr` vào `claude`; bỏ `glm-herdr` | 00, 05 | 4 | xong |
| [02](phase-02-tier-cell-reader.md) | Bộ đọc ô tier, validator project/global, thiếu ô thì từ chối | 05 | 5 | xong (bước từ chối chờ anh) |
| [03](phase-03-llm-accounts-reader.md) | Bộ đọc `runner.llmAccounts` chỉ đọc, kiểm tên pool | 05 | 3 | xong |
| [04](phase-04-explain-and-doctor.md) | `fgos dispatch explain`, check doctor, spec, CHANGELOG | 01, 02, 03 | 6 | chờ |
| [06](phase-06-capability-tier-cap.md) | Rigor của capability nâng trần tier; kiểm hai bộ tính tier | 02, 04 | 5 | chờ |

Thứ tự: 05 trước tiên, để main xanh lại; rồi commit 01; 02 và 03 song song;
04; cuối cùng 06, vì 06 sửa đoạn tính tier ngay trên đoạn chọn model của 02 và
dùng `explain` của 04.

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
