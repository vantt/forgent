---
title: "Đợt B2: invocation khai credentialStore {use, homeEnv, files}; confinement và driver bwrap cấp đúng store đó"
description: "Invocation tự khai store nó đọc, biến env trỏ tới private home và các file cần chép; request của Confinement Authority mang credentialStore thay resourceBindings; driver bwrap chép theo danh sách của invocation và gắn homeEnv. Không đổi lease, quarantine, llmAccounts hay global config."
status: pending
priority: P1
effort: 21h
branch: plan/model-pool-b2-credential-store
tags: [runner, confinement, bwrap, credential, model-pool]
created: 2026-10-19
---

# Đợt B2: `credentialStore {use, homeEnv, files}` trong confinement và driver bwrap

- **Thực hiện:** mục 5.2 (quyết định 6, 7) và 5.3 (dòng B2, câu trả lời đợt 0 số 3, 5, 7) của
  [problem-261017-0022-model-tier-selection-misfit.md](../reports/problem-261017-0022-model-tier-selection-misfit.md).
- **Bảng chương trình:** dòng MP-B2 của [program board](../261017-1313-fgos-platform-program-board/plan.md)
  (ready; 6.2, 6.3 đã land). Định dạng và cách làm theo [MP-A](../261017-1302-model-pool-config-additive-slice/plan.md).
- **Spec đọc trước:** [confinement-authority.md](../../docs/specs/confinement-authority.md) §6.5, §13.1, §13.2;
  [runner.md](../../docs/specs/runner.md) RUL75, RUL78, RUL80 và đoạn `runner.llmAccounts`.
- **Component boundary:** không đổi (driver bwrap vẫn không rẽ nhánh theo provider; chỉ đổi field nó đọc).
- **Impact-analysis:** GitNexus có mặt, index có thể cũ. Lead chạy `node .gitnexus/run.cjs analyze` rồi
  `impact` upstream trên các symbol ở phase 00 trước khi sửa, báo blast radius; kết quả 0 thì grep đối chiếu.

## Facts (đọc code 2026-10-19, main `3bce83943`)

**Đang có, B2 dùng lại:**

| Cái gì | Ở đâu | B2 làm gì |
|---|---|---|
| Inventory cũ: account có `credentialSource {kind, home, files}` hoặc `credentialSources {<cli>: …}` | `src/runner/dispatch/provider-capacity.mjs:65-156` | Giữ nguyên; lease vẫn đọc nó (đổi là việc B1/C) |
| Chọn store theo basename lệnh: `commandCli`, `credentialSourceForCli`, `providerCapacityForCommand` | `provider-capacity.mjs:193-229` | Thay khoá chọn bằng `credentialStore.use`; `providerCapacityForCommand` đổi thành `providerCapacityForInvocation` |
| Request đóng gói `providerCapacity` theo CLI | `confinement/request.mjs:465`; khoá cho phép `request.mjs:25-44` | Mang `invocation.credentialStore` thay `invocation.resourceBindings` (`request.mjs:422`) |
| Chép login vào private home | `drivers/bwrap.mjs:46-75` (`provisionSelectedCredential`), gọi ở `bwrap.mjs:533-537` | Chép theo `files` của invocation; chỉ chép khi invocation khai store |
| Gắn private home vào env qua `resourceBindings` chung | `bwrap.mjs:573-588` | Thay bằng gắn `homeEnv`; xoá vòng binding chung và kiểu `argument` (chỉ một test dùng) |
| Hàm chép an toàn (realpath, trong home, file thường, snapshot `agent.db`) | `provider-credential-renewal.mjs:150-190` `copyCredentialFiles` | Thêm tuỳ chọn bỏ qua file vắng; renewal vẫn dùng chế độ cũ |
| Grant `private-home` có sẵn trong hai policy built-in | `confinement/policies.mjs:41,58` | Không đổi; `assessBwrap` (`bwrap.mjs:200`) báo mismatch khi invocation khai store mà policy không cấp private-home |
| Gieo trust từ store của account được lease | `confinement/authority.mjs:1119`, `assignment-runner.mjs:2379-2381`, `herdr-round.mjs:283-289` | Chỉ đổi khoá chọn store (`use`); logic trust không đổi |
| Refresh-ahead và ghi ngược login | `assignment-runner.mjs:2090-2122`, `provider-credential-renewal.mjs:1142-1148` | Không đổi (đọc store của account, không đọc invocation) |
| `launchCandidateClis` (CLI mà executor có thể chạy, cho renewal và lazy probe) | `assignment-runner.mjs:184-193` | Đổi sang khoá `use` |
| Probe account: `via: lease` dựa vào `resourceBindings` | `provider-account-probe.mjs:57-77` | Đổi sang `credentialStore` |
| Doctor `confined-pane-accounts` dựa vào `resourceBindings` + `kind` | `src/setup/registrations.mjs:4440-4492`, đăng ký `:4707` | Đổi sang `credentialStore`, phủ mọi invocation khai store (không chỉ herdr-spawn), áp luật "chép file có mặt" |
| `fgos dispatch explain` | `src/runner/execution/explain.mjs:80` | In thêm `credentialStore.use` của invocation đã chọn |
| Plumbing `resourceBindings` qua resolve/transport/cli/assignment | `resolve.mjs:444,448`, `transport.mjs:271`, `cli.mjs:631,702`, `assignment-runner.mjs:2287` | Đổi thành `credentialStore` |

**Tiền lệ (git log -S):** `5a42bc376` (09-11) private-home→`CODEX_HOME` cho codex bwrap; `569f72d3b` (09-11, H-1)
từng copy `auth.json` Codex vào private home của **mọi** executor, sửa bằng allowlist — B2 giữ bài học này:
chỉ chép khi invocation khai store. `ec6a0745d` (rotator slice 1) đưa credential vào inventory; `1f911229f`
(10-13, RUL80) thêm store theo CLI, khoá là basename lệnh; `cfd670c43` áp posture lên herdr mà quên binding
(§13.1 "vì sao từng bị quên"). `a7dedce62`/`e95abe177` (MP-A) thêm `llmAccounts` chỉ đọc và `explain`.
Không có Rust nào đọc `resourceBindings`/`credentialSource` (grep `*.rs` 2026-10-19).

**Thiếu (B2 làm):** field `credentialStore` trên invocation và validator của nó; khoá chọn store tường minh;
`homeEnv`; danh sách file trên invocation với luật "chép file có mặt, không có file nào thì từ chối".

**Sai lệch so với report:**

| Report ghi | Thực tế | Plan làm |
|---|---|---|
| Ví dụ deepseek/pi: `files: ["settings.json"]`, key nằm trong `settings.json` | Store `~/.pi/accounts/openrouter`: key nằm ở `auth.json` (khoá `openrouter`); `settings.json` chỉ có theme/model mặc định | `files` của pi gồm `auth.json`; phase 00 chứng minh pi đọc key từ store |
| B2 thay `env` và `resourceBindings` | `~/.fgos/config.json` có 13 `resourceBindings` trong executors global; mdview, mcp-skill-hub mỗi project 24; release cũ cần chúng | Đọc song song: invocation không khai `credentialStore` thì suy từ `resourceBindings` cũ (một hàm, C xoá). Config forgentX giữ field cũ tới khi release B2 active (phase 06) |
| B2 nằm sau run-supervisor P07-P09, terminal-mode P05-P06 | 6.2, 6.3 đã land 10-18; 6.4 merged chưa activate | Không còn chặn. GIT 04 đang sửa `run.mjs` (B2 không chạm); `assignment-runner.mjs` có thể va nhỏ |

## Phạm vi

**Trong B2:** `invocation.credentialStore {use, homeEnv, files?}` (validator, plumbing, request, driver bwrap,
probe, doctor, explain); chuẩn hoá cũ→mới tại một hàm; config forgentX khai store cho mọi invocation confined,
gộp các invocation confined trùng theo account, đổi id còn mang tên account; bỏ biến key trong `env` khi CLI
đọc key từ store; spec, CHANGELOG; dọn field cũ trong config forgentX sau khi active.

**Để lại:**
- **B1:** lease/state/quarantine theo pool; lọc account theo `use` **trước** khi lease (hôm nay account thiếu
  store hoặc thiếu mọi file bị từ chối muộn ở `credential-provisioning`); `llmAccounts` làm nguồn lease; suy
  `kind`/layout từ `use` thay vì từ account; pin `pool/account`; thiếu ô tier thì từ chối.
- **B3:** bước `source-rotation`.
- **C:** xoá `resourceBindings`/`env` store khỏi `~/.fgos/config.json` và config của mdview, mcp-skill-hub; xoá
  nhánh suy-từ-cũ trong code và vòng `commandCli`; `prefer` theo họ; xoá `runner.providers`.
- **TRUST:** account `fgovn` thiếu trust forgentX (`terminal:blocked:trust-dialog`). B2 chỉ đổi khoá chọn
  store cho bước gieo trust (`use` thay basename, cùng giá trị với config hiện tại), không đổi kết quả.
- **Không làm:** invocation không confined dùng `credentialStore` (validator từ chối; xem quyết định 4).

## Quyết định (đã chốt trong plan, báo owner)

1. **Một hàm chuẩn hoá** `credentialStoreOf(invocation)` trong `provider-capacity.mjs` cạnh `commandCli`: trả
   `credentialStore` đã khai; không khai mà có binding `private-home`→env thì suy `{use: commandCli(command),
   homeEnv: <tên env>}`; không có gì thì `null`. Mọi chỗ đọc đi qua nó. C xoá nhánh suy.
2. **Chỉ chép login khi invocation có store** (khai hoặc suy). Lease có mà invocation không khai store thì không
   chép gì (bài học H-1, `569f72d3b`). Với config hiện tại kết quả không đổi.
3. **Luật chép file (quyết định 6 của owner) áp chung:** danh sách = `credentialStore.files` nếu có, không thì
   danh sách của account (`home-files`) hoặc `["auth.json"]` (`codex-home`). Chép file có mặt; không file nào có
   mặt thì từ chối `credential-provisioning` (`credential-store-empty`). File có mặt nhưng là symlink ra ngoài
   home, không phải file thường, hay đường dẫn có `..` vẫn từ chối như cũ. Thay "thiếu một file thì từ chối" của
   §13.1; spec ghi supersede.
4. **`credentialStore` chỉ hợp lệ trên invocation có confinement backend.** Invocation không confined đọc store
   tại chỗ qua `env` như cũ; B2 không thiết kế đường đó.
5. **Field cũ cùng tồn tại trên một invocation thì `credentialStore` thắng:** driver đặt `env[homeEnv]` bằng
   private home, ghi đè giá trị cũ; binding `private-home` cũ bị bỏ qua. Không refuse, để release cũ còn đọc được
   cùng file config tới khi active.
6. **`confinement-request.v1` giữ tên contract**, đổi field (`resourceBindings`→`credentialStore`): người dùng
   duy nhất, attestation cũ không đọc field này. Phase 01 kiểm lại.
7. **Không thêm check doctor mới;** sửa `confined-pane-accounts` (giữ id) để đọc store mới.

## Phase và phụ thuộc

| Phase | Nội dung | Phụ thuộc | Giờ | File chính |
|---|---|---|---|---|
| [00](phase-00-preconditions.md) | Baseline, impact, chứng minh tiền đề (key pi trong store, invocation không confined không còn caller, release cũ bỏ qua key lạ) | — | 2 | không sửa code |
| [01](phase-01-contract-and-normalizer.md) | `credentialStoreOf`, validator, request, plumbing | 00 | 5 | `provider-capacity.mjs`, `config.mjs`, `confinement/request.mjs`, `resolve.mjs`, `transport.mjs`, `cli.mjs`, `assignment-runner.mjs` |
| [02](phase-02-bwrap-driver.md) | Driver: gắn `homeEnv`, luật chép, mismatch khi thiếu grant; xoá binding chung | 01 | 4 | `drivers/bwrap.mjs`, `provider-credential-renewal.mjs` (chỉ `copyCredentialFiles`) |
| [03](phase-03-probe-doctor-explain.md) | Probe account, doctor `confined-pane-accounts`, explain | 01 | 3 | `provider-account-probe.mjs`, `registrations.mjs`, `execution/explain.mjs` |
| [04](phase-04-project-config.md) | Config forgentX: khai store, gộp trùng, đổi id, bỏ key env; test config đã commit; chạy thật | 02, 03 | 4 | `.fgos/config.json`, test config đã commit |
| [05](phase-05-spec-and-changelog.md) | Spec, RUL mới, CHANGELOG, reading-map nếu cần | 04 | 2 | `docs/specs/confinement-authority.md`, `docs/specs/runner.md`, `CHANGELOG.md` |
| [06](phase-06-post-activation-cleanup.md) | Sau khi release B2 active ở forgentX: xoá `resourceBindings`/`env[homeEnv]` khỏi config forgentX | 05 + activation | 1 | `.fgos/config.json`, một test |

02 và 03 chạy song song được (không chung file). Mọi phase khác tuần tự.

## Va chạm

- `src/setup/registrations.mjs`, `CHANGELOG.md`, `docs/specs/runner.md`: file chung trên bảng; commit riêng, nhỏ.
- `assignment-runner.mjs`: GIT 04/COOK có thể sửa; diff B2 chỉ 3 chỗ (`:188-191`, `:2287`, `:2379-2381`).
- `provider-capacity.mjs`: B1 sẽ viết lại phần lease; B2 chỉ sửa `:193-229`. B2 land trước B1.
- Không sửa `run.mjs`, lock, `llm-accounts.mjs`, `~/.fgos/config.json`, config của project khác.

## Ma trận test

| Mức | Gì | Ở đâu |
|---|---|---|
| Unit | `credentialStoreOf` (khai/suy/null); validator (shape, từ chối khi không confined, files sai, `homeEnv` sai); chọn store theo `use` khác basename lệnh | test mới `test/runner/credential-store.test.mjs`; `test/runner/provider-per-cli-credential-sources.test.mjs` |
| Unit driver | `homeEnv` trỏ private home; chép file có mặt; không file nào → `credential-store-empty`; symlink ra ngoài vẫn từ chối; không khai store → không chép dù có lease; thiếu grant private-home → mismatch | `test/runner/dispatch-confinement-backend-p03.test.mjs`, `dispatch-confinement-credential-hygiene.test.mjs` |
| Tích hợp | Config chỉ có field cũ (dạng global/mdview) chạy y như trước; config có cả hai thì store mới thắng; probe/doctor/explain | `provider-account-probe.test.mjs`, `test/setup/visibility-checks.test.mjs`, `test/runner/execution/explain.test.mjs`, `herdr-provider-invocations.test.mjs` |
| Config đã commit | Mọi capability bind ra cùng mechanism/executor; invocation đổi id ghi rõ; `use` bằng basename lệnh với mọi invocation hiện có | `test/runner/execution/bind-committed-config.test.mjs`, `dispatch-policy-baseline-snapshot.test.mjs` |
| E2E thật | Một round confined thật mỗi CLI: codex (cli), pi openrouter không có key trong env, omp (xai hoặc gemini), một pane herdr | `npm run fgos:dev -- run …`, phase 04 |

## Định nghĩa xong

- `npm test` xanh trừ các lỗi đã biết của main (3 git-floor 2.34, `fences-v1-tombstone`); chạy lại với
  `CLAUDE_CODE_SESSION_ID` bỏ đặt trước khi gọi là hồi quy.
- Big lead chạy mọi test import module bị sửa:
  `git grep -l -e provider-capacity.mjs -e confinement/request.mjs -e drivers/bwrap.mjs -e provider-account-probe.mjs -e setup/registrations.mjs -e dispatch/config.mjs -e dispatch/resolve.mjs -e dispatch/transport.mjs -e dispatch/cli.mjs -e assignment-runner.mjs -e execution/explain.mjs -e provider-credential-renewal.mjs -- test`
  (đưa vào mảng, kiểm số file, không dùng biến zsh không quote), rồi full `npm test`.
- `fgos doctor` (qua `npm run fgos:dev -- doctor`) xanh trên config đã commit.
- Bốn round thật ở phase 04 `completed-pass`, private home có đúng file đã khai, không file nào ngoài danh sách.
- Spec và CHANGELOG cập nhật; không `resourceBindings` nào còn trong `src/` ngoài nhánh suy của `credentialStoreOf`.

## Rollback

Mỗi phase là commit riêng, revert được độc lập. Config phase 04 vẫn giữ field cũ nên revert code 01-03 không làm
hỏng config; release cũ chạy được với config phase 04. Phase 06 revert = khôi phục field cũ.

## Câu hỏi còn mở

1. (Chỉ khi phase 00 thất bại) pi không đọc key OpenRouter từ `auth.json` của store khi không có
   `OPENROUTER_API_KEY`: owner ghi key vào store (việc tay người), hay giữ biến key trong `env` của invocation
   pi tới B1. Mặc định nếu không ai trả lời: giữ biến, ghi vào báo cáo phase.
