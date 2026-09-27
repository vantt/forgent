# Review Unit I08b: REQUEST CHANGES

Reviewer role: `code:review` (independent, adversarial). Candidate: `0e93dcfdeb126015bcd122c07be61ffb072892b7`, branch `coordination-skill-harness-i08b-remediation`.

## 1. Identity & Lineage

- Candidate Commit: `0e93dcfdeb126015bcd122c07be61ffb072892b7` (parent `8cf39c47` = merge of `42934bf3` into I08 `4e9de195`)
- Chứa 4e9de195 (I08 candidate): [x] Có (`merge-base --is-ancestor` exit 0)
- Chứa 42934bf3 (origin/main): [x] Có (exit 0)
- Worktree: `.claude/worktrees/coordination-skill-harness-i08b-remediation`, working tree sạch; `git diff --check` (worktree + `4e9de195..HEAD`) sạch.
- Main checkout: vẫn ở `main@6f3fb903`, không có commit/merge mới. `M AGENTS.md`, `M CLAUDE.md`, các file untracked vẫn còn. Có thêm dirty state mới xuất hiện sau khi phiên bắt đầu: `docs/history/**` (5 file) và việc đổi tên `plans/260825-1841-knowledge-registry/` → `knowledge-and-documentation-engine/`. Các file này không nằm trong diff I08b và có nội dung không liên quan đến dispatch, nên nhiều khả năng do một phiên khác tạo ra, không phải doer. Xem mục Câu hỏi còn mở.

## 2. Kết quả Đánh giá 5 Khiếm khuyết

| Finding | Mô tả | Đánh giá Code & Probe | Kết quả |
|---|---|---|---|
| F4 (HIGH) | Execute unregistered fail closed | Base (`4e9de195`): compat `execute ghost-executor` **spawn thật `claude`**, exit 0 (đã tái hiện). Candidate: public door và compat door đều trả exit 1, `{"errorClass":"executor-not-found"}`, đồng bộ giữa hai door. Kiểm tra biên: probe `executeAssignment` (không có work) với config chỉ có global `executor`, và global + registry khác, cả hai đều chạy worker thật (`ran`) trên base lẫn candidate, nên implicit fallback được bảo toàn. Test cũ `dispatch.test.mjs:3702` đã đổi sang assert fail-closed, có ghi chú contract. | PASS (xem N1, N3, N4) |
| F5 (HIGH) | Canonicalize redirect provider family | Cả 3 điểm (`assignment-runner.mjs` source/target/provenance) đều dùng `normalizeProviderFamily(deriveProviderFamily(e, cmd), cmd)`. Mutation test: gỡ fix (revert file về `8cf39c47`) thì test F5 **fail**, nên test có giá trị thật. Probe `claude`-decl + `codex`-cmd cho ra `openai-codex`, bị gate `redirect.cross-provider-not-permitted` chặn. `openai` và `openai-codex` cùng ra `openai-codex`, tức cùng family. | PASS cho defect đã nêu (có residual N5) |
| F6 (MEDIUM)| resolveHerdrBin trim & precedence | `transport.mjs:95` đúng công thức. Probe: opts `"  custom-bin  "` → `custom-bin`; env padded → `env-bin`; opts thắng env; opts toàn khoảng trắng thì rơi về env. | PASS |
| F7 (MEDIUM)| expectedRunId validation on result.json | `interpretRunResult(…, {expectedRunId})` đã có mặt ở show-run, watch (gián tiếp qua `readRunSnapshot`), herdr reconcile, cli-spawn reconcile, settle-receipt/settle-failed, resume, runtime-inspection, session-engine, coordination show. Probe `run_imposter` so với `run_genuine`: `contractCorrupt/resultCorrupt: true`, snapshot `settled:false`, herdr reconcile trả `status:'corrupt'`. Nhánh settle khi gặp result corrupt rơi xuống `commitRunSettlement`, vốn dùng hard-link bất biến (EEXIST), nên không bao giờ ghi đè hoặc settle thành công. | PASS cho case runId giả (residual N6, N7) |
| F10 (MEDIUM)| reconcile plan action validation exit 4 | `reconcile plan --run X` (không `--action`) và `--run X --action clear-cwd-lock` đều trả exit 4 kèm message hướng dẫn, trong repo không có cwd lock. Guard có ở 3 tầng (bin, use case, planner). Lưu ý: nhánh `--run` không `--action` **trên base đã trả exit 4 sẵn**. Bare `reconcile plan` vẫn trả exit 0 `blocked: no cwd lock exists`, và điều này **đúng spec** (`docs/specs/runner.md:21`: `clear-cwd-lock` là action mặc định). Mô tả F10 trong report I08 đã viết sai; phần thực sự được sửa là tổ hợp `--run/--assignment` + `clear-cwd-lock`. | PASS (N8: sửa lại mô tả trong report I08) |

## 3. Kết quả Test Tự Chạy

Mọi lần chạy đều dùng `env -u CLAUDE_CODE_SESSION_ID` (tránh leak session vào test), trên Node v24.18.0.

- Focused matrix (10 file) + file regression: **237/237 pass**, tức 10 file focused = **232 pass** (doer ghi 178, là số cũ của I08, xem N9).
- Governance operability suite: **9/9 pass**; `dispatch-operability`: 11/11.
- Regression tests cho F4–F10: **5/5 pass**; mutation test F5 xác nhận test phát hiện được lỗi.
- Affected suite (53 file dispatch/herdr/assignment/run-result/placement/provider/coordination-session + architecture + regression): **1439 pass, 0 fail, 1 skip**. Có 1 mục "fail" là do em glob nhầm `dispatch-assignment-id-claim-concurrency.helper.mjs` (file helper, không phải test), không phải hồi quy.

## 4. Findings cần xử lý

- **N1 (MEDIUM): thay đổi contract không được yêu cầu, `DispatchError extends RunnerConfigError`** (`dispatch-error.mjs`).
  - Hệ quả: mọi `DispatchError` giờ kế thừa `category: 'validation'` (probe: `categoryOf` = `validation` → exit 4, trong khi base là `unexpected`). Ngữ nghĩa `instanceof RunnerConfigError` cũng đổi ở `session-engine.mjs:539/4420` (unlink `dispatch.claim`, bất biến H2), `cohort-planner.mjs:166/631` (nuốt lỗi thành governance-ineligible/abort), và `assignment-runner.mjs:2227`.
  - Blast radius hôm nay: em đã kiểm tra và thấy chấp nhận được. Runner loop xử lý theo `errorClass` trước khi dùng `categoryOf`. Các `DispatchError` bị unlink claim đều là lỗi pre-launch. Tuy vậy, parity giữa hai door **không cần** đổi hierarchy (compat door serialize qua `instanceof DispatchError`), và test regression lại pin chính thay đổi này (`err instanceof RunnerConfigError`).
  - Yêu cầu: revert hierarchy. Nếu cần exit code/category riêng thì set tường minh trên instance.
- **N2 (LOW-MEDIUM): phân loại lỗi bằng regex trên message.** `cli.mjs` map sang `governance-refused` qua `/governance gate rejected/`, `/cross-provider/`, `/governance/`. Cách này dễ vỡ khi message đổi, và `/governance/` quá rộng. Nên dùng `err.code` (ví dụ `redirect.cross-provider-not-permitted` đã có sẵn code).
- **N3 (LOW): comment cũ mâu thuẫn với code mới.** `cli.mjs:~687-694` vẫn ghi "a named `executorIdArg` that resolves to nothing NEVER throws here, silently falling through to the global executor". Comment này sẽ dẫn stranger agent (L5) sai hướng; cần sửa theo contract F4 mới.
- **N4 (LOW): nhánh chết.** `if (!work && mechanism === 'unavailable')` không bao giờ chạy vì `decideExecutorDispatchMechanism` chỉ trả `in-process`/`out-of-process`. Nên xoá hoặc giải thích lý do giữ.
- **N5 (MEDIUM, bắt buộc sửa; đã đổi sau khi anh xác nhận claude/pi chạy được GLM):** provider family dùng cho governance phải là **vendor nhận prompt**, tức giá trị `providerModel` khai báo. Command chỉ là harness, chỉ dùng làm fallback khi không khai báo gì.
  - Config thật chứng minh điều này: `glm` = CLI `claude` + `z-ai`; `deepseek` = CLI `pi` + `deepseek`; `openai` có các invocation `pi`; executor `pi` (trong global config) = `openai-codex`.
  - Hàm `normalizeProviderFamily` hiện có trả `'pi'` mỗi khi command là `pi`, **bỏ qua khai báo** (`provider-adapter.mjs:84`). Fix F5 giờ dẫn chính đường redirect đi qua hàm này, nên executor `pi` (khai `openai-codex`) bị canonicalize thành `pi`.
  - Probe: `deepseek`+`pi` → `pi`; `openai`+`pi` → `pi`. Hai executor khác vendor chạy qua `pi` sẽ bị coi là **cùng family**, nên redirect giữa chúng lọt qua mà không cần `crossProvider`. Đây đúng là loại bypass của F5, chỉ ở dạng mới. Ngược lại, codex → executor `pi` (cùng openai) lại bị chặn nhầm.
  - "Command" lấy từ `entry.command ?? executorId`. Tức là dùng **tên executor** làm command, còn `invocations[].command` (nơi config thật khai báo CLI) thì không được đọc tới. Vì vậy câu "canonicalize dựa trên command thật" trong report của doer không đúng với thực tế.
  - Case "spoof" trong test F5 (`claude`-decl + `codex`-cmd → `openai-codex`) pin đúng quy tắc sai là command thắng khai báo. Theo quy tắc khai báo-trước thì case đó ra `claude`.
  - Yêu cầu: dùng khai báo-trước một cách nhất quán (`providerModel`/`provider` → canonical alias; chỉ khi không khai báo mới suy từ command). `pi` là harness, không phải vendor. Viết lại test F5 theo đúng quy tắc này, thêm case `pi`+`deepseek` so với `pi`+`openai` phải bị coi là cross-provider. Nếu muốn phát hiện khai báo sai (ví dụ `codex` CLI khai `claude`) thì đó là việc của cảnh báo trong `doctor`/lúc validate config, không phải của hàm canonicalize.
- **N6 (MEDIUM): F7 mới đóng một nửa.** Report I08 mô tả F7 là "mismatched `runId` **or non-standard status**". Probe `{runId: genuine, status: 'totally-bogus'}` vẫn được chấp nhận (`legacy-derived`, không corrupt). Cần sửa, hoặc hoãn một cách tường minh kèm ledger.
- **N7 (MEDIUM, bắt buộc sửa; đã investigate xong): bypass bằng cách bỏ trống `runId`.** Result legacy `{status:'success'}` không có `runId` vẫn settle (`settled:true`) dù có `expectedRunId` (điều kiện `rawObj.runId && …` tại `run-result.mjs`).
  - Writer: writer chính thức duy nhất là `commitRunSettlement` → `publishImmutableProof`. Nó ghi v2, mà `validateRunResultV2` bắt buộc có `runId`. Không có production writer nào tạo result thiếu `runId`.
  - Reader: mọi reader (show-run/watch, herdr và cli-spawn reconcile, settle/resume, runtime-inspection; reconcile collect-result và repair-projection đi qua inspection) đều dùng `interpretRunResult`. Chỉ cần sửa một chỗ là phủ hết.
  - Dữ liệu thật: quét 1003 file `result.json` trong `.fgos` và `~/.fgos`: 78 file v2, 925 file v1 có `runId`, **0 file thiếu `runId`**, 0 file mismatch.
  - Yêu cầu: khi có `expectedRunId` thì thiếu `runId` được tính là corrupt (`run-id-missing`). Khi không truyền `expectedRunId` thì giữ nguyên độ khoan dung legacy. Cần cập nhật fixture test (`test/runner/assignment-runresult.test.mjs`, `assignment.test.mjs`) nếu chúng đang truyền `expectedRunId` với result không có `runId`.
- **N8 (LOW): sửa mô tả F10 trong report I08.** Bare `reconcile plan` trả exit 0 là đúng spec, không phải defect.
- **N9 (LOW): số liệu bằng chứng không khớp.** Focused "178/178" là số của I08 (thực tế 232 cho 10 file). Affected "1410 pass" thấp hơn I08 (1455) 45 test mà không giải thích. Report ghi `watch.mjs` được sửa nhưng diff không đụng tới file này (được bao phủ gián tiếp). Cần cập nhật số liệu thật trong report, `plan.md` ×2 và phase-08.

## 5. Accounting & Documentation Check

- `plans/260919-coordination-skill-harness-simplification/plan.md`: header và block Unit I08b đầy đủ (capability, depends-on, branch, worktree, base-sha, scope). Số liệu verification cần sửa theo N9.
- `plans/260920-2217-dispatch-engine-hardening/plan.md`: dòng Phase 08 và block accounting I08b có mặt. Mô tả F10/F7 cần khớp lại theo N6/N8/N9.
- `phase-08-operability-cli-doctor.md`: status I07/I08/I08b nhất quán, liệt kê đủ report.
- `phase-08-i08b-base-remediation-report.md`: có đủ nhưng dính N9. Nó cũng mô tả N1 như một thành tựu ("establishing parity") trong khi parity không cần đến thay đổi này.
- `CHANGELOG.md`: F4 là thay đổi hành vi mà user nhìn thấy (`dispatch execute <unregistered>` từ exit 0 sang exit 1), nhưng `## [Unreleased]` chưa có dòng nào (gate "Install/setup/doctor" trong AGENTS.md). Cần bổ sung.

## 6. Kết luận & Khuyến nghị

- Verdict: **REQUEST CHANGES.** Không có blocker HIGH: hai lỗi HIGH F4/F5 đã được sửa thật, có test và mutation test chứng minh, và không có hồi quy trên 1439 test. Lý do request changes là thay đổi contract không cần thiết (N1), F7 mới đóng một phần (N6), và bằng chứng/accounting sai số liệu (N9). Tất cả đều nhỏ và sửa nhanh được.
- Việc doer cần làm: revert N1; sửa N2/N3/N4; **N5** (canonical family theo khai báo-trước, `pi` là harness, viết lại test F5); **N7** (thiếu `runId` khi có `expectedRunId` thì tính là corrupt); sửa N6 (hoặc hoãn tường minh có ledger); cập nhật số liệu thật (N9) và thêm dòng CHANGELOG; sửa lại mô tả F10 (N8).
- Lưu ý: sau khi xét N5, F5 **chưa được đóng thật**. Probe chuẩn thì pass, nhưng quy tắc canonicalize sai và tạo ra bypass mới qua `pi`.
- Sau khi sửa xong: re-review nhanh (chỉ cần diff delta), rồi integrate I08b → rebase I08 → re-verify I08 → mở I11.

## Câu hỏi còn mở

1. Dirty state mới trên main (`docs/history/**` ×5 và việc đổi tên thư mục plan knowledge-registry, mtime 17:56 ngày 24/09) có phải của anh hoặc một phiên khác không? Chúng không thuộc diff I08b.
2. (Đã chốt) N5: anh xác nhận claude/pi có thể chạy GLM, nên khai báo `providerModel` thắng command.
3. (Đã chốt) N7: đã investigate, không có writer hay dữ liệu nào thiếu `runId`, nên fail closed an toàn.

---

# Re-review delta `0e93dcfd..0617c6e4`: APPROVE

Ngày 2026-09-24, 21:30. Candidate `0617c6e41ebec1aa8e73065eac69cd5eb9684343`.

## Identity

- `0617c6e4` là con trực tiếp của `0e93dcfd`, nên lineage chứa cả `4e9de195` và `42934bf3` như trước. Worktree sạch, `git diff --check` sạch.
- Main vẫn ở `6f3fb903`.

## Findings

| Finding | Kết quả | Bằng chứng (probe độc lập) |
|---|---|---|
| N1 | RESOLVED | `DispatchError extends Error`. `instanceof RunnerConfigError` = false, `categoryOf` = `unexpected` (giống base). |
| N2 | RESOLVED (còn fallback regex) | Có code `governance.disallowed-provider/-executor`, `governance.cross-provider-not-permitted`; map theo `err.code` trước, regex chỉ còn là fallback. Không chặn merge. |
| N3/N4 | RESOLVED | Comment đã khớp contract F4; nhánh `unavailable` đã bị xoá. |
| N5 | RESOLVED | Vendor lấy theo khai báo: `deepseek`+`pi` → `deepseek`; `openai`+`pi` → `openai-codex`; `z-ai`+`claude` → `z-ai`; `claude`+`codex` → `claude`. Chỉ khi không khai báo mới suy từ command, và command lấy từ `invocations[].command`. Test F5 đã viết lại theo quy tắc này. |
| N6 | RESOLVED | `status:'totally-bogus'` → corrupt `non-standard-status`. Quét 1003 result thật: legacy chỉ có `done` 570 / `failed` 285 / `no-evidence` 70, **0 file** vi phạm whitelist. |
| N7 | RESOLVED | Thiếu `runId` khi có `expectedRunId` → corrupt `run-id-missing`. Khi không truyền `expectedRunId` thì vẫn giữ độ khoan dung legacy. |
| N8/N9 | RESOLVED | Mô tả F10 và số liệu (232 / 5 / 1439) đã sửa. |
| CHANGELOG | RESOLVED | Có dòng `Changed` mô tả thay đổi exit code của F4. |
| F4/F10 hồi quy | OK | `execute ghost-executor` → exit 1 ở cả public door và compat door (`executor-not-found`); `reconcile plan --run r1` → exit 4. |

## Test tự chạy

- Focused 10 file: **232/232**.
- Regression F4–F10: **5/5**.
- Affected mở rộng (dispatch/herdr/assignment/coordination, cộng `test/setup/*` và `provider*`): **2050 pass, 0 fail, 1 skip**.

## Finding mới (LOW-MEDIUM, không chặn merge, ghi thành follow-up)

- **N10: `normalizeProviderFamily` đang gánh hai nghĩa: vendor (dùng cho governance) và harness (dùng để chọn ProviderAdapter).**
  - Sau N5, `getProviderAdapter('openai','pi')` trả `CodexProviderAdapter` và `('deepseek','pi')` trả `BaseProviderAdapter`, thay vì `PiProviderAdapter`. Probe `renderProviderInvocation` với `toolIntent` cho thấy **mất `--tools`** (base: `applied-via-tools`, candidate: `unsupported`).
  - Tác động production hôm nay: **không có**. Consumer production duy nhất là `resolveVerifiedProviderArgs` (`transport.mjs:203`), chỉ chạy cho family `claude` và rơi về legacy args khi kết quả khác. `doctor` (`executor-profile-warnings`) trên config thật của anh (project và `~/.fgos`) cho kết quả giống hệt base.
  - Đề xuất follow-up trước khi mở rộng lộ trình ProviderAdapter (design.md §3.5) sang harness khác claude: chọn adapter theo harness (command/invocation), còn vendor chỉ quyết định biến thể (ví dụ GLM qua claude). Thêm test cho `pi`+`deepseek` phải giữ `--tools`.

## Verdict

**APPROVE để integrate vào main.** Bước tiếp theo: integrate I08b → rebase I08 → re-verify I08 → mở I11. Ghi N10 vào backlog/ledger của track.
