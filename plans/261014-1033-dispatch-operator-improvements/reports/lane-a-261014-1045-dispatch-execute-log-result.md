# Lane A — log và kết quả của `dispatch execute`

Trạng thái: **dừng ở bước test đỏ** theo chỉ thị Lead 2026-10-14 (hội đồng "một cửa" đang chạy, không sửa code production). Chưa có commit code. Thiết kế mục 1 đã viết xong và chạy xanh trước khi dừng; bản sửa được cất thành patch, chưa áp.

- Worktree: `/home/vantt/projects/forgentX-worktrees/dispatch-log-result`, nhánh `feat/dispatch-log-result` (từ main `88315d5de`).
- Test đỏ (chưa commit, theo chỉ thị): `test/runner/dispatch-execute-log.test.mjs` — 7 fail / 1 pass trên code hiện tại.
- Patch production đã cất: `/home/vantt/projects/forgentX/.fgos/runtime/tmp/lane-a-dispatch-execute-log.patch` (210 dòng, `src/runner/dispatch.mjs`, `src/runner/dispatch/cli.mjs`, `src/runner/dispatch-log.mjs`). Với patch áp vào: test mới 8/8 xanh; `dispatch.test`, `dispatch-reconciliation-import-graph.test`, `dispatch-production-call-sites.test`, `dispatch-execute-for-capability.test` 434/434 xanh. `npm test` toàn bộ: **chưa chạy** (dừng trước bước đó).

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
- `npm test` toàn bộ chưa chạy.
