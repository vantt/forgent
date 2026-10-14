# Lane A — log và kết quả của `dispatch execute`

Trạng thái: **làm theo kết luận hội đồng một-cửa** (`reports/council-261014-1231-dispatch-one-door-conclusion.md`, mục "Cập nhật sau hội đồng" của brief lane A). Phần "Trước hội đồng" bên dưới giữ làm lịch sử; chỗ nào mâu thuẫn thì mục "Sau hội đồng" thắng.

- Worktree: `/home/vantt/projects/forgentX-worktrees/dispatch-log-result`, nhánh `feat/dispatch-log-result`, rebase lên main `f69a446f0`.
- Commit: `cec1452a8` feat(run) plan/work provenance; `9fc8af4b2` docs(cli) sửa mô tả cờ dispatch. Không merge, không push.

## Sau hội đồng một-cửa

### #1/#2 — log → provenance plan/work trên Assignment

- Bỏ hướng execute tự ghi `dispatch log` (patch `.fgos/runtime/tmp/lane-a-dispatch-execute-log.patch` KHÔNG áp, test đỏ cũ đã xoá). Không thêm verb.
- Cửa chuẩn `fgos run` nhận `--plan <dir|plan.md>` và `--work <id>`:
  - `unit.json` ghi `plan` (đường dẫn tương đối checkout chứa plan, main hoặc worktree của run; tuyệt đối nếu ngoài cả hai) và `workId`.
  - Mỗi Assignment: `provenance.plan`, và `workId` — field Assignment sẵn có, đã chảy tới RunResult (`workId`) và `run-meta.v1` (`assignment-runner.mjs:1879,2636,2760`). Không đổi schema RunResult.
  - Từ chối trước khi có run: plan thiếu `plan.md`; work item không tồn tại (kiểm ở `bin/fgos.mjs` qua `listWork`, vì `run.mjs` bị guard A4 cấm import `src/state/**`). Resume giữ plan/work ban đầu, truyền lại khi resume bị từ chối.
- Prior art dùng lại: field `workId` của Assignment/RunResult; khuôn từ chối-trước-khi-có-run của `stanceOptions`/`resolveUnitInputs`. Thiếu: chưa có khoá plan nào trước đây. Run theo Workflow sinh từ plan (`fgos workflow start --plan`) đã có liên kết gián tiếp qua `workflow.id = plan/<slug>`; không đụng.
- Không làm `execute --contract --plan`: Doer có ghi file đi qua `fgos run`; `--contract` chỉ read-only và đang chờ af132275b (bước 0) — tránh va.

### #3 — câu báo cáo cuối = `agentClaim.summary`

- Không code mới: `runUnit` đã trả `results[].runResult.agentClaim.summary` (claim v2). Đã khoá ở tầng Assignment từ trước (`test/runner/assignment-dispatch.test.mjs:2270`); thêm một test đầu-cuối ở tầng `fgos run` (`run-plan-work-provenance.test.mjs`, ca cuối). Nguyên nhân lặp hai lần giữ như mục "Trước hội đồng" 3(b).

### #2 help — chỉ sửa chỗ sai

`fgos dispatch --help` ghi `for`, `work`, `executor`, `assignment` là "only" của verb khác trong khi `execute` cũng đọc chúng (cli.mjs `flagValue('--for')` ở đường thô, `--work`/`--executor` ở `--contract`/`--assignment`, `--assignment`). Sửa đúng phạm vi, không thêm hướng dẫn dùng cửa thô, không đụng AGENTS.md:167 / `executor-dispatch-fallback.md` (bước 3 của Lead).

### Test

- Đỏ trước: `test/runner/execution/run-plan-work-provenance.test.mjs` 5 fail / 2 pass (2 ca pass là đặc tả hành vi đã có: không cờ → không ghi; `agentClaim.summary`); 2 ca CLI mới trong `test/cli/run-verb.test.mjs` đỏ với `bin/fgos.mjs` của HEAD.
- Xanh: 7/7 + 6/6; `test/runner/execution/*` + `test/cli/run-verb|command-registry|fgos-help` 226/226.
- `npm test` toàn bộ: exit 0 (`env -u CLAUDE_CODE_SESSION_ID npm test` trên `9fc8af4b2`): tests 7372, pass 7297, fail 0, cancelled 0, skipped 10.

### Rủi ro

- `detect_changes` báo **high**: chạm `dispatchBound`/`runRole` (9 luồng). Thay đổi chỉ là spread có điều kiện; không cờ thì Assignment/unit.json byte như cũ. Index GitNexus stale (b334695) — đã cross-check bằng grep: caller của `runUnit` là `bin/fgos.mjs` và `src/workflow/runner.mjs`, không truyền option mới.
- `provenance.plan` là key mới trong `provenance` của Assignment unit-run (hội đồng duyệt "plan/work provenance id on the Assignment"). Normalizer/validator không chặn key lạ trong `provenance` của unit-run (test xanh trên đường thật).

### Còn để ngỏ

- Phụ thuộc bước 0 (af132275b, chờ owner) mà hội đồng ghi cho lane A: phần đã làm không đụng `--contract`, nên không chờ; nếu owner muốn `execute --contract` cũng mang plan thì làm sau af132275b.
- Đọc theo plan: chưa có lệnh liệt kê run theo plan (`unit.json.plan` đọc được bằng file). Không thêm verb khi chưa được yêu cầu.

## Trước hội đồng (lịch sử)

## Mục 1 — log tự động sau `execute`

### Prior art (proven)

- `log` tách khỏi execute **có chủ đích**: commit `f4d6fb708` (R1, 2026-09-26) chuyển `logExecutorDispatch` ra `src/runner/dispatch-log.mjs` và ghi vào `docs/platform/component-boundary.md`: Dispatch And Execution Engine "strictly forbids Work lifecycle mutation (`pick`/`return`) and event append". Có test khoá: `test/runner/dispatch-reconciliation-import-graph.test.mjs` cấm `appendEvent` và import `dispatch-log` trong `src/runner/dispatch/**`.
- Event `executor.dispatch` là log của Work: khoá bằng `id` work item (`--id` bắt buộc). Người đọc duy nhất trong code: `src/runner/attestation-guard.mjs` (lọc theo `payload.id`). Đường runner loop (`spawnWorker`) đã tự ghi event này (`src/runner/loop.mjs:1107`) — tức là "ghi log ở lớp ghép, không ở dispatch core" đã có tiền lệ.
- `core/skills/_shared/executor-dispatch-fallback.md` Step B.5 còn nhắc `classifyDispatchConfidence` — hàm này không còn trong `src/` (doc cũ, ngoài phạm vi lane).

### Động cơ (proven)

Lead chạy Doer bằng đường thô `fgos dispatch execute openai --for execute --prompt-file … --cwd <worktree plan> --repo-root <main>` (transcript phiên `a4954387`, turn 03–12). Lượt chạy theo plan không có work item, nên `log --id` không có giá trị đúng để điền; Lead không ghi log lượt nào.

### Thiết kế (trong patch, chưa áp)

Giữ ranh giới của `f4d6fb708`: dispatch core vẫn không append event.
- `log` nhận `--plan <planDir>` thay cho/kèm `--id`; ghi `payload.planDir` (đường dẫn tương đối main checkout), từ chối thư mục không tồn tại.
- `execute` (đường thô) nhận `--work <id>` / `--plan <dir>`: lớp ghép `src/runner/dispatch.mjs` (đã sở hữu `log`) tự ghi `executor.dispatch` khi lượt kết thúc — `outcome` `done|failed`, `errorClass` khi throw; không có hai cờ này thì không ghi gì (giữ hành vi cũ). Core chỉ thêm một hook `onExecuteSettled` tiêm từ ngoài (giống `resolveWork`), lỗi hook không đổi kết quả dispatch.
- Tên `planDir` chứ không `plan`: `logExecutorDispatch` đã có tham số `plan` (dispatch plan chứa governance).

## Mục 2 — help

Chưa làm (là text trong `src/cli/command-registry.mjs` + usage `cli.mjs`, tính là production). Nội dung dự kiến phụ thuộc kết luận một-cửa: nếu giữ thiết kế mục 1 thì help nói "`execute --work|--plan` tự ghi log; không có thì chạy `dispatch log … --id|--plan`". Lưu ý va chạm: registry đã có property `plan` nghĩa "reconcile apply: JSON plan" — cần mô tả hai nghĩa hoặc đổi cờ thành `--plan-dir`.

## Mục 3 — câu báo cáo cuối của Doer (brief đã sửa: không thêm `finalMessage`)

Bản `finalMessage` em đã viết trước khi brief đổi: đã gỡ hết, không commit.

- (a) Lead lấy câu báo cáo từ đâu (proven): `json.load(doer-turn-NN.out.json)['data']['stdout']` rồi cắt đuôi (thậm chí tìm `'\ncodex'` trong stdout), cộng `tail -5 doer-turn-NN.err.log` trong cùng lệnh.
- (b) Vì sao thấy hai lần (proven, `doer-turn-10.*`): `codex exec` tự in câu cuối vào **cả hai** luồng — trong transcript stderr (`codex\n<câu>\ntokens used\n110,891`) và một lần nữa ra stdout. `execute` tee cả stdout lẫn stderr của worker vào stderr của mình (chủ đích, tsk-129 / STR39 live tee), nên `err.log` có câu đó hai lần. `data.stdout` chỉ chứa câu đó **một lần** (494 ký tự, đúng câu cuối); `data.stderr` chứa thêm một bản trong transcript 700 KB. Không có adapter fgOS nào in lại. Spec runner.md (mục live tee) chốt "không có nhánh code nào phân biệt định dạng output" cho tee — bỏ tee stdout theo từng CLI sẽ trái luật đó và làm mất live view của CLI stream trên stdout (pi `--mode json`).
- (c) Dùng lại chuẩn claim/RunResult: **chưa làm, cần kết luận một-cửa**. Lý do đường thô không vào được chuẩn claim: đường `--contract` (đi qua `executeAssignment` → RunResult.agentClaim) luôn read-only; `mutation: "mutating"` bị từ chối trừ khi mang stamp của engine (`execution-contract.mjs:327`, ADR-006 §6). Doer của Lead sửa file và commit, nên đường thô `execute --for execute` là cửa operator duy nhất cho việc ad-hoc có ghi — và nó không có claim, không RunResult, không log. Hai hướng thấy được: cho đường thô xin claim v2 (chèn `renderAgentResultClaimInstructions` vào prompt, đọc `agent-result.json` trong run dir mà visibility session đã mở, trả `agentClaim` cùng shape RunResult) — nhưng đó là thêm field vào output thô; hoặc mở cửa `--contract` cho mutating của operator — đụng ADR-006. Cả hai là câu hỏi của hội đồng, không tự quyết.

## Nhận xét về chuyện nhiều cửa (cho hội đồng)

| Cửa | Kết quả trả về | Bản ghi bền | Log `executor.dispatch` | Ghi được không | Confinement |
|---|---|---|---|---|---|
| `execute <exec> --for <cap>` (thô) | `{mechanism,status,signal,stdout,stderr,tier,model,attestation,outcome,headBefore,headAfter,provider,command}` | chỉ `run.json` của visibility session (`.fgos/assignments/asgn-<exec>-<ts>/runs/01/`, `workId: null`, không lưu stdout) | không; phải gọi `log --id` tay | có (theo capability) | theo capability/invocation; lượt của Lead: `unconfined` opt-out |
| `execute --contract` | RunResult (agentClaim v2) | assignment.json + runs/result.json | không | chỉ read-only (ADR-006 §6) | read-only bằng lời dặn, không sandbox (`readOnlyDoors`, cli.mjs) |
| `execute --assignment` | RunResult | có | không | theo assignment | theo assignment |
| Workflow unit (`fgos workflow start --units` / `fgos run`) | RunResult | có | — (chưa kiểm) | `writes: []` chạy sandbox | sandbox + login account |
| herdr round | ad-hoc: stdout = file report; assignment: outbox result + receipt | receipt + outbox | không | có | bwrap private-home |
| runner loop `spawnWorker` | kết quả adapter | worker log | **tự ghi** (loop.mjs:1107) | có | theo executor |

Điểm rút ra: (1) chuẩn output (claim v2 → RunResult) và log Work chỉ có ở các cửa có Work/Assignment; cửa thô — cửa duy nhất operator dùng được cho việc ad-hoc có ghi — rơi ra ngoài cả hai. (2) Log `executor.dispatch` gắn chặt với Work item, không có khoá cho việc theo plan. (3) Cùng một lượt chạy có ba "bản ghi" khác nhau tuỳ cửa (run.json rỗng, RunResult, event log), không cửa nào có đủ cả ba.

## Còn để ngỏ

- Áp hay bỏ patch mục 1 tuỳ kết luận một-cửa (nếu cửa thô bị gộp vào đường Assignment thì log nên đi theo RunResult, patch có thể bỏ).
- Mục 2, 3(c) chờ kết luận.
