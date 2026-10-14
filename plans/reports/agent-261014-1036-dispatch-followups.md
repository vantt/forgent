# Dispatch follow-ups: probe verdict, sandboxed contract door, read-only prompt, decide --for, fgctl-init time limit

- Ngày: 2026-10-14 (Asia/Saigon)
- Worktree: `/home/vantt/projects/forgentX-worktrees/dispatch-followups`
- Nhánh: `fix/dispatch-followups` (từ main `59934a2d6`), chưa merge, chưa push
- Impact analysis: Degraded. GitNexus `present` nhưng index ở `b334695`, cũ hơn HEAD. `renderAssignmentPrompt` báo 0 caller, `accountProbeVerdict` báo "not found"; grep cho thấy caller thật lần lượt là `assignment-runner.mjs` và `runAccountProbe`. `runDispatchCli` mức LOW. Blast radius chưa được xác nhận bằng index.

## Việc 1: probe-account luôn kết luận `cli-fault`

**Nguyên nhân (đã chứng minh).** Classifier không khớp nhầm. Các hàng `confined: false` đúng là bị sandbox:

- Probe gắn `binding.posture: "read-only"` cho mọi round. `resolvePosture` (`src/runner/dispatch/confinement/policies.mjs`) trả về requirement `required`/`host-write-denied`, bất kể invocation có khai confinement hay không.
- Run dir của các round đó (`.fgos/assignments/asgn_cfcd0e10_…_op_007/010/016/028`, main checkout) đều có `protected/confinement-finalization/*.json` với `backend: local-bwrap-v1`.
- Invocation không khai sandbox (`pi-cli-<acct>`, `codex-cli-bypass-fgovn`) cũng không có private home. Credential env của chúng (`PI_CODING_AGENT_DIR`, `CODEX_HOME`) trỏ vào store trên host, store đó bị mount read-only, nên CLI chết trước khi trả lời. stderr thật: `EROFS: read-only file system, mkdir '/home/vantt/.pi/accounts/openai-tetcu72/settings.json.lock'`, và với codex là `failed to initialize in-process app-server client: Read-only file system (os error 30)`.
- Vì vậy outcome `sandbox` là đúng sự thật. Nhưng hàng đó không nói gì về account hay CLI, và nó kéo verdict thành `cli-fault`.

**Quyết định.** Hàng không sandbox vẫn được chạy và báo cáo, vì đó là thông tin thật: một dispatch read-only ghim vào invocation ấy sẽ hỏng y như vậy. Verdict chỉ đọc các hàng có invocation tự khai sandbox (`confined: true`). Mỗi hàng có thêm `inVerdict`. Thêm verdict `no-confined-cli` cho trường hợp không có hàng nào được tính.

**Thay đổi.** `accountProbeVerdict` và trường `inVerdict` trong `src/runner/dispatch/provider-account-probe.mjs`. Đã sửa RUL79 trong `docs/specs/runner.md`, mô tả trong `src/cli/command-registry.mjs`, và CHANGELOG Fixed.

**Test.** `test/runner/provider-account-probe.test.mjs`: có test mới dựng lại đúng hình dạng 2026-10-13 (hai hàng sandbox `ok`, hai hàng không sandbox `sandbox` → `healthy`), cộng `account-fault` và `no-confined-cli`. Test probe end-to-end khoá các hàng `inVerdict`. Đỏ trước (2 fail), xanh sau.

**Commit.** `360aced90` fix(dispatch): read the account probe verdict from sandboxed invocations only

**Để ngỏ.** Tên trường `confined` vẫn có nghĩa "invocation tự khai sandbox", không phải "round có bị sandbox không" (mọi round đều bị sandbox). Spec đã ghi rõ nghĩa này, nhưng chưa đổi tên trường.

## Việc 2: dispatch chỉ đọc vừa có sandbox vừa ghim provider

**Prior art.** Binding làm cho một run được sandbox đã có sẵn trên Assignment door. Một inline Assignment đã dùng nó rồi: account probe gắn `binding: { executor, invocation, posture: "read-only" }` cộng `cliOverride.preferInvocation` (`withProbeBinding`, commit `80cf7a8a6`). `resolvePostureInvocation` là hàm `bind()` dùng để chọn invocation có thể mang posture. RUL77 ghi rõ cửa này "does not exist yet" và giữ nguyên `bind()`.

**Phương án thắng rõ, nên em làm luôn.** `execute --contract <file> --executor <id> --for <capability có confinement required>`.

- Đúng RUL77: posture thuộc capability.
- Không đổi hành vi caller cũ: không có `--for` thì contract vẫn unconfined, read-only bằng lời dặn, nên reviewer chạy test suite vẫn chạy được.
- Không đụng `bind()`.
- Tái dùng nguyên đường mà probe đã chứng minh.

Hai phương án bị loại:

- (a) Tự sandbox mọi contract read-only theo `mutation`: đổi hành vi mọi caller hiện có, và contract không có capability để nói chạy thế nào.
- (b) Cho Workflow unit ghim executor: phải sửa `bind()`, thứ dùng chung với mọi Workflow binding.

**Thay đổi.**

- `contractPostureBinding` trong `src/runner/dispatch/cli.mjs`. Invocation lấy theo `prefer` của capability cho executor đó; nếu không có thì là invocation cli đầu tiên có backend mà máy này chạy được. Hàm từ chối trước khi claim Assignment id với các mã: `capability-not-confined`, `capability-not-registered`, `posture-unavailable`, `executor-required`.
- Gỡ lệnh từ chối `--contract --for` khi có `--executor`.
- `withProbeBinding` đổi tên thành `withReadOnlyBinding` và được dùng chung.
- Sửa doctrine `core/skills/_shared/capability-matching.md` và `executor-dispatch-fallback.md`, rồi chạy `npm run build:skills`.
- Thêm RUL81 vào `docs/specs/runner.md` (RUL77 trỏ tới nó), sửa mô tả `--for` trong registry, thêm CHANGELOG Added.

**Test.** `test/runner/dispatch-contract-confined.test.mjs`: chọn invocation, giữ `prefer`, bốn đường từ chối, và CLI từ chối mà không tạo `.fgos/assignments`. Đỏ trước (export chưa có), xanh sau.

**Chạy thật (openai, main checkout `.fgos/assignments`).** Cùng một contract:

| Run | Lệnh | Confinement | Kết quả |
|---|---|---|---|
| `asgn_2468395_op_009` | không `--for` | finalization `backend: none` | |
| `asgn_2468395_op_010` | `--for code:review` | `local-bwrap-v1` | `pass`/`reported` |

Run `op_010` có binding `{openai, codex-cli-bwrap, read-only}`, lease account `tetnu`, claim được ghi ở `worker-output/outbox`.

**Commit.** `af132275b` feat(dispatch): run a read-only contract sandboxed on a named provider when it names a confined capability

**Để ngỏ.** Trường `confinement` ở cấp đầu của RunResult luôn là `null` với run qua Assignment door, kể cả khi run đã bị sandbox (`op_010`, các round probe). Muốn biết run có sandbox hay không thì phải đọc `protected/confinement-finalization/`. Đã ghi vào RUL81 là "Not built", chưa sửa.

## Việc 3: prompt của `--contract` làm agent hiểu sai chuyện ghi outbox

**Nguyên nhân (đã chứng minh bằng dispatch thật).** `renderAssignmentPrompt` (`src/runner/dispatch/assignment.mjs`) in "Write structured JSON to …/agent-result.json" và "report … REQUIRED", rồi ngay bên dưới lại in "Write scope: (none - read-only)". Run thật `asgn_2468395_op_008` (`execute --contract … --executor openai`): Codex trả lời đúng task, rồi viết: "The assignment's required result paths conflict with its explicit read-only, no-write-scope contract, so I will not create those artifacts." Kết quả là `inconclusive`/`no-evidence`. Pane brief (`brief.mjs`) nhúng nguyên prompt này, nên cũng bị.

**Thay đổi.** Assignment read-only có thêm dòng: "This operation is read-only: change nothing in the workspace. Your result files are the exception: they sit outside the workspace and writing them is required, not a breach of read-only." Write scope đổi thành "none in the workspace (read-only); your result files are still required". Sửa cả `renderEffectiveContractSummary` để hai chỗ cùng câu chữ. Thêm CHANGELOG Fixed.

**Test.** `test/runner/assignment.test.mjs` khoá chính xác hai dòng trên, câu cũ không còn, và assignment ghi file thì không có dòng read-only. `test/runner/dispatch-brief.test.mjs` khoá rằng pane brief giữ các dòng đó. Đỏ trước, xanh sau.

**Chạy lại thật.** `asgn_2468395_op_009` ra `pass`/`reported`. Agent viết: "write the required read-only review artifacts outside this worktree". Worktree không bị ghi.

**Commit.** `5d8b7cdb1` fix(dispatch): tell a read-only worker its result files are still to be written

## Việc 4: `dispatch decide --for` in ra usage

**Không tái hiện được** với các dạng có tài liệu, nên không sửa gì. Các lệnh đã chạy từ worktree, tất cả exit 0 và trả JSON:

- `node bin/fgos.mjs dispatch decide --for code-review`, thêm `--needs-soul`, thêm `--has-live-task-access`, thêm cả hai
- `decide --needs-soul --for code-review`
- `decide --for code:review`
- `node src/runner/dispatch.mjs decide --for code-review --needs-soul --has-live-task-access`
- `fgos dispatch decide --for code-review` (có và không có cờ)
- Chạy từ cwd ở worktree khác (`advisory-capability-completion`, main checkout) bằng bin của worktree này
- Chạy bằng bin của main từ worktree này

Chỉ có các trường hợp sau ra usage hoặc lỗi:

- `decide --for` thiếu giá trị: in usage, exit 4 (đúng).
- `decide --for=code-review`: in usage. Dạng `=` không được hỗ trợ: `flagValue` chỉ đọc `--for <v>`. Có thể đây là nguồn của báo cáo cũ, nhưng UNPROVEN.
- `decide --for --needs-soul`: `--needs-soul` bị nuốt làm giá trị, vẫn trả JSON.
- cwd `/tmp`: lỗi "must run inside a git repository".
- Bin của nhánh `advisory-capability-completion` (cũ hơn): từ chối config vì có `credentialSources`. Đây là caveat RUL80 đã biết, không phải usage.

## Việc 5: `test/rust-host/fgctl-init.test.mjs` vượt trần 600 giây

**Đo.** Chạy riêng (`--test-reporter=spec`): 33 test, 32 pass, 1 skip, 593 giây. Hook `before` gần như không tốn thời gian. Mười sáu test, mỗi test 25–77 giây; mỗi test đó stage một release thật qua `fgctl init`. Nặng nhất:

| Thời gian | Test |
|---|---|
| 77 s | download: pin with a tag re-acquires (teammate flow) |
| 62 s | download: `--from` beats `FGCTL_FROM` beats `FGCTL_VERSION` |
| 46 s | download: tag without the leading v |
| 40 s | download: `FGCTL_VERSION` |
| 39 s | download: committed pin beats latest |
| 36 s | Item 3 idempotent re-run |
| 33 s | R11 fresh project |
| 32 s | launchers |
| 31 s | P7 atomic publish |
| ... | ... |

**Quyết định: chia file, không nâng trần.** Chi phí là việc thật, không phải treo. Chia file giữ được watchdog 600 giây có nghĩa, và hai file chạy song song nên `npm test` nhanh hơn. Nâng trần chỉ che chuyện file tiếp tục phình ra. `FILE_TIMEOUT_OVERRIDES_MS` vẫn rỗng.

**Thay đổi.**

- 9 test `download:` cùng helper của chúng chuyển sang `test/rust-host/fgctl-init-download.test.mjs`.
- Fixture release, `runFgctl`, `runShim`, `waitForProcess` chuyển sang `test/rust-host/fgctl-init-fixture.mjs`.
- `fgctl-init.test.mjs` giữ 22 test.
- Đã so dòng (sort + diff): mọi thân test giữ nguyên, chỉ khác dòng trống, comment mục và `waitForProcess` đã chuyển chỗ.
- Sửa docs trỏ tới test download: `docs/platform/packaging-distribution/spec.md`, `verification/install-and-release-proof.md`.

**Test.** Hai file chạy song song: 33 test, 32 pass, 0 fail, 1 skip. Wall 299 giây; tổng thời gian test của mỗi file khoảng 295 và 299 giây.

**Commit.** `7cd8aa177` test(fgctl): split the download tests of fgctl init into their own file

## Trạng thái giữ lại của việc 2 và việc 3 (theo phiên điều phối, 2026-10-14)

Lead yêu cầu tạm dừng code của việc 2 và việc 3, chờ hội đồng xem lại chuyện dispatch có nhiều cửa chạy. Yêu cầu này đến sau khi cả hai đã được commit. Em giữ nguyên các commit này, không revert, và không thêm code nào cho hai việc nữa. Lúc nhận yêu cầu, nhánh chưa merge.

| Việc | Commit | Có thể chạm vào kết luận của hội đồng |
|---|---|---|
| 3 | `5d8b7cdb1` fix(dispatch): tell a read-only worker its result files are still to be written | Câu chữ sửa trong `renderAssignmentPrompt`. Prompt này dùng chung cho cửa `--contract`, cho Assignment door nói chung, và được nhúng vào pane brief của herdr round. Vì vậy câu "result files are still required" áp cho mọi cửa read-only đi qua prompt này, không riêng `--contract`. |
| 2 | `af132275b` feat(dispatch): run a read-only contract sandboxed on a named provider when it names a confined capability | Thêm một lối vào trên cửa `--contract` (`--for <confined capability>`), không thêm door mới. Run vẫn đi qua `executeAssignment` với binding mà Workflow unit và account probe đã dùng. Dù vậy, về mặt người dùng, đây là thêm một tổ hợp cờ. Nếu hội đồng muốn gộp cửa, có thể revert riêng commit này; nó không phụ thuộc commit nào khác trên nhánh, ngoài việc đổi tên `withProbeBinding` thành `withReadOnlyBinding`. |

Hội đồng có thể dùng các bằng chứng sau:

- Hai run thật trên cùng một contract:
  - `asgn_2468395_op_009`: không `--for`, finalization ghi backend `none`.
  - `asgn_2468395_op_010`: có `--for code:review`, chạy `local-bwrap-v1`, lease account `tetnu`.
- Lần tái hiện việc 3: `asgn_2468395_op_008`. Agent từ chối ghi file kết quả vì prompt ghi "Write scope: none".
- Trường `confinement` ở cấp đầu của RunResult là `null` cho mọi run qua Assignment door, kể cả khi run đã bị sandbox. Đây là một khác biệt nữa về output giữa các cửa.

Muốn merge việc 1, 4, 5 mà không lấy việc 2 và 3 thì phải lấy từng commit, vì nhánh xếp theo thứ tự:

1. `360aced90` (việc 1)
2. `5d8b7cdb1` (việc 3)
3. `af132275b` (việc 2)
4. `7cd8aa177` (việc 5)

`7cd8aa177` chỉ đụng `test/rust-host/` và docs packaging. `360aced90` và `af132275b` cùng sửa `CHANGELOG.md`, `docs/specs/runner.md` và `src/cli/command-registry.mjs`, nhưng ở các dòng khác nhau, nên cherry-pick riêng sẽ gặp conflict nhẹ ở `CHANGELOG.md`. Điểm này UNPROVEN: em chưa thử cherry-pick.

## npm test

`env -u CLAUDE_CODE_SESSION_ID npm test` trong worktree, ở HEAD `7cd8aa177`: **7328 test, 7253 pass, 0 fail, 10 skip, 65 todo, exit 0**. Không file nào bị watchdog 600 giây cắt.

Lần chạy đầu cũng ra 0 fail nhưng exit 1, vì guard rò rỉ `.fgos` bắt được chính file log em ghi vào `.fgos/runtime/tmp/npm-test.log` trong lúc suite chạy. Đây là lỗi chỗ đặt log của em, không phải test. Lần chạy thứ hai ghi log ra scratchpad, exit 0.

Có warning `failed to ensure host binary: spawnSync cargo ENOENT`: trong môi trường này không có cargo, nên suite dùng `target/` symlink về main.

## Câu hỏi còn mở

1. Có đổi tên trường `confined` trong kết quả probe để khỏi bị đọc thành "round có bị sandbox không" không? (việc 1)
2. Có cho trường `confinement` ở cấp đầu của RunResult mang backend thật của run qua Assignment door không? (việc 2)
3. Có hỗ trợ cú pháp `--flag=value` cho `dispatch` không? (việc 4)

No component-boundary change: các thay đổi chỉ dùng door và binding đã có.

Status: DONE
Summary: Việc 1, 2, 3 và 5 đã sửa, mỗi việc một commit trên `fix/dispatch-followups`, và `npm test` xanh. Việc 2 tự quyết (một phương án thắng rõ: `--contract --executor --for <confined capability>`). Việc 4 không tái hiện được nên không sửa; chưa merge, chưa push.
