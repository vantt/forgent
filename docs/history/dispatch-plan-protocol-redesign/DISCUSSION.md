# DISCUSSION — DispatchPlan / AgentMessage protocol redesign

Item: `tsk-5x7`. Nguồn: bản phân tích của Codex (gpt-5.5 high) đọc trực tiếp
`src/runner/dispatch/*`, đề xuất tách dispatch thành DispatchPlan (routing) +
AgentMessage (control) + Artifact (data) + State store (sự thật task) +
Transport (adapter pluggable). Liên quan: `tsk-2y7` (**supersededBy** item
này — cross-provider gate blind spot), `tsk-fli`, `tsk-9tu`, `tsk-5ym`,
`tsk-492`, `tsk-2ld`, `tsk-62w`, `tsk-5fn` (các finding dispatch mở khác,
chưa rõ cái nào gấp vào đây). Doctrine đã khoá liên quan:
`docs/specs/runner.md` §0026 (Native-First Dispatch Doctrine:
launcher/rootTask/subTask/capacity), §0029 (sửa từ vựng 0026), §0033
(capacity cli-spawn-shaped luôn thắng); `docs/history/two-layer-dispatch`
(`tsk-2t6`, **done**); `docs/history/dispatch-concept-boundary` (`tsk-5td`,
**done**, 18 D-ID khoá gather/judge/orchestrator→launcher);
`docs/history/dispatch-activation-and-handoff-redesign` (`tsk-2uf` +
children, **retrospective**, driver/worker split + `prepareDispatch`).

## 1. Trạng thái hiện tại

Vòng 1 (2026-08-25). Vừa mở, đã scout xong hai việc trước khi hỏi gì: (a)
xác minh sống hai claim cụ thể nhất trong note gốc, (b) quét backlog +
docs/history để tìm chồng lấn/xung đột với doctrine đã khoá. Chưa có D-ID
nào. Đang chờ người dùng quyết định phạm vi vòng này (§3 hàng "phạm vi
thảo luận").

## 2. Mục tiêu & đề bài

Note gốc muốn cải tiến triệt để cơ chế dispatch của forgentX theo hướng
tường minh hơn, nhanh hơn, và flexible hơn khi dùng tool ngoài hoặc đẩy việc
giữa nhiều agent provider (Claude, Codex, AGY, pi, OpenRouter, và tương lai
mailbox/Herdr/RPC), bằng cách tách rõ năm lớp: DispatchPlan (quyết định
route/thực thi), AgentMessage (control message giữa agent), Artifact (dữ
liệu lớn/work product), State store (sự thật về task), và Transport
(CLI/stdout, HTTP, MCP, mailbox, Herdr, RPC...). Note liệt kê bảy finding cụ
thể trên code thật (từ lệch `decide --for` với `capabilities.*.prefer`, đến
cross-provider governance nhìn sai chỗ, đến protocol bị khoá cứng vào
prompt/stdout), một khái niệm `selector` để caller chỉ đích trước khi
planner resolve executor thật, một hướng đổi governance từ "chặn
cross-provider" sang "bắt khai báo egress", một schema `AgentMessage` V1, và
một kế hoạch tám pha (characterization test → DispatchPlan → protocol
decoupling → adapter v2 → invocation protocol field → artifact-based
handoff → mailbox/Herdr optional → tối ưu tốc độ).

## 3. Vấn đề rõ / chưa rõ

| # | Câu hỏi / điểm | Trạng thái | Ghi chú |
|---|---|---|---|
| 1 | Finding #1 (`decide --for` lệch `capabilities.*.prefer`) còn đúng trên code thật không? | **Rõ — xác minh sống** | `decideExecutorCli` (`src/runner/dispatch/cli.mjs:685`) gọi thẳng `resolveExecutorIdForPurpose` (raw scan `executor.for`), KHÔNG qua `resolveExecutorAndOverrides` (đọc `capabilities.<name>.prefer`, `resolve.mjs:195`). Chạy sống: `node src/runner/dispatch.mjs decide --for fgos-coding-implement` → `{"mechanism":"unavailable","configured":false}`, dù `.fgos/config.json` có `capabilities.fgos-coding-implement.prefer:"agy"`. |
| 2 | Finding #3 (cross-provider gate mù với env override) còn đúng trên code thật không? | **Rõ — xác minh sống** | `resolve.mjs:322`: `if (executorEntry && !resolvedViaAgentType && !CLAUDE_CLI_COMMANDS.includes(executor.command) && executorEntry.allowCrossProvider !== true)` — điều kiện chỉ nhìn `executor.command`, không nhìn `env`/`ANTHROPIC_BASE_URL`. Executor `glm` giữ `command:"claude"` nên `CLAUDE_CLI_COMMANDS.includes("claude")===true` → gate không bao giờ chạm tới, bất kể egress thật đi đâu. Đây đúng là gap `tsk-2y7` đã ghi — item đó đã `supersededBy: tsk-5x7`. |
| 3 | `execute --work <id>` có tồn tại chưa (Phase 5/Selector "work")? | **Rõ — chưa có** | `case 'execute'` (`cli.mjs:904-953`) chỉ nhận `--prompt`/`--prompt-file`, không có nhánh `--work`. `case 'decide'` (`cli.mjs:955-973`) THÌ ĐÃ có `--work`/`--stage` từ lâu. Đây chính là gap `tsk-fli` đang mở, khớp thẳng vào "selector.type=work" của note. |
| 4 | `selector.type` (work/purpose/executor/adHocAgent) có phải khái niệm mới, hay là đặt tên cho cái đã tồn tại rời rạc? | **Rõ — phần lớn đã tồn tại rời rạc** | `decide <executorId>` = executor selector, `decide --for <purpose>` = purpose selector, `decide --work <id>` = work selector — cả ba đã là nhánh CLI riêng biệt hôm nay (`cli.mjs:628-701`). `adHocAgent`/`needsSoul` cũng đã có nhánh riêng (`needsSoul` param, dòng 692). Note đề xuất GOM bốn nhánh này thành một object `selector` tường minh — là một formalize/refactor có cơ sở, không phải phát minh cơ chế mới. |
| 5 | `DispatchPlan` có phải khái niệm mới, hay là mở rộng của cái `decide` đã trả về hôm nay? | **Rõ — là mở rộng** | `decide` hôm nay đã trả `{mechanism, executorId?, agentType?, mcpTool?, configured}` (`cli.mjs:698-727`). `DispatchPlan` trong note thêm `selector`, `capability`, `kind`, `invocation`, `handback`, `model`, `governance`, `reasonCodes` — cùng một chỗ, chỉ giàu hơn. |
| 6 | `DispatchPlan`/`selector`/`kind` có xung đột với vocabulary ĐÃ KHOÁ (launcher/rootTask/subTask/capacity, D-ADR0026/0029/0033) không? | **CHƯA RÕ — cần người quyết** | 0026/0029 đã khoá: capacity là "đơn vị functional/helper hẹp", KHÁC subTask (rootTask đệ quy); quy tắc chọn native-vs-cli/spawn áp y hệt cho cả hai theo 4 tiêu chí (soul cần không, cùng provider không, có native tương ứng không, config có ép cli/spawn không — 0033 thu hẹp lại). Note không nhắc tới capacity/rootTask/subTask/launcher một lần nào — `kind: "agent"\|"tool"` (đã có ở `config.mjs:338`) là một trục KHÁC (bản chất executor: agent thật hay tool thuần), không phải trục capacity-vs-subTask. Cần chốt: `DispatchPlan.mechanism` có PHẢI LÀ chính "kết quả 4 quy tắc 0026/0033" được đặt tên lại, hay là một quyết định khác nằm cạnh nó? |
| 7 | `two-layer-dispatch` (`tsk-2t6`, done) đã khoá 18 D-ID về L1/L2 + capacity ad-hoc packet — note có giẫm lên D-ID nào ở đó không? | **CHƯA RÕ — cần đọc lại nếu đi sâu Phase 2+** | Chưa đọc hết `docs/history/two-layer-dispatch/DISCUSSION.md` (163.9K) trong vòng này — chỉ đọc §1. Nếu phạm vi vòng này đi tới Phase 2 (`DispatchPlan` module thật), cần đối chiếu D-ID ở đó trước khi mint D-ID mới có nguy cơ trùng/lật. |
| 8 | `dispatch-concept-boundary` (`tsk-5td`, done, 18 D-ID) đã khoá gather/judge/orchestrator→launcher — `AgentMessage.message_type` (TASK/ACK/PROGRESS/...) có đụng khái niệm nào ở đó không? | **CHƯA RÕ** | Chưa đối chiếu chi tiết — cần nếu Phase 3 (protocol decoupling) được chọn làm việc thật. |
| 9 | Phase 3/6/7 (AgentMessage schema, artifact-based handoff, mailbox/Herdr) có consumer thật nào hôm nay không, hay cùng dạng YAGNI-chờ-consumer như `tsk-6db` (Native-First Phase 5, "deferred, no concrete consumer yet") và `tsk-2ld` (RPC/app-server adapter, "research/discovery scope only")? | **CHƯA RÕ — cần người quyết** | Chưa thấy bằng chứng có provider nào hôm nay THẬT SỰ cần JSON-mode/event-stream thay vì prompt/stdout — `coding-worker-contract.md`'s `[DONE]`/`[BLOCKED]` token vẫn là hợp đồng sống duy nhất. Repo có xu hướng khoá rõ "deferred, YAGNI, chưa có consumer cụ thể" cho đúng dạng việc này (`tsk-6db`) thay vì xây trước. |
| 10 | Phạm vi thảo luận vòng này: đi hết 8 pha của note, hay khoanh trước vào phần đã xác minh sống + rẻ (Finding #1, #3 — hàng 1-2 ở trên), để phần đầu cơ (AgentMessage/mailbox/Herdr) chờ một vòng riêng có consumer thật? | **CHƯA RÕ — câu hỏi mở đầu, cần người quyết trước khi đi tiếp** | Ưu tiên sản phẩm của repo (README/AGENTS.md): Ship Faster > Release con người > DoD > Polish; và ranh giới sứ mệnh D-ADR0035 nói fgOS không tồn tại để tự phát triển chính nó — dogfood chỉ là cần thiết trong lúc xây, không phải mục tiêu. Hai finding đã xác minh sống (#1, #3) là sửa lỗi cụ thể phục vụ mission #1/#2 thật (dispatch đúng theo config đã khai, governance đúng theo egress thật) — phần AgentMessage/mailbox/Herdr đầu cơ hơn, cần cân nhắc có phải "tiện cho fgOS tự dev" (mission #3, không phải lý do fgOS tồn tại) hay có consumer thật đang chờ. |

## 4. Quyết định đã chốt

(chưa có D-ID nào — vòng 1)

## 5. Q&A log

- **2026-08-25, vòng 1** — Phiên (thay mặt Codex's note) mở discussion, claim
  `tsk-5x7`, scout sống hai finding cụ thể nhất (decide --for lệch prefer;
  cross-provider gate mù env), quét backlog tìm bảy item dispatch mở liên
  quan (`tsk-fli`, `tsk-9tu`, `tsk-5ym`, `tsk-492`, `tsk-2ld`, `tsk-62w`,
  `tsk-5fn`) và ba cụm doctrine/discussion đã khoá liên quan
  (0026/0029/0033, `two-layer-dispatch`, `dispatch-concept-boundary`,
  `dispatch-activation-and-handoff-redesign`). Chưa hỏi người dùng câu nào —
  đang trình bày phân tích trước khi hỏi (§3 hàng 10 là câu hỏi mở đầu).

## 6. Thiết kế đã chốt {#design}

(chưa có gì để tổng hợp — chưa D-ID nào ổn định qua hơn một vòng. Sẽ viết
lại toàn phần một khi §4 có D-ID đầu tiên.)

## 7. Danh mục hạng mục / task {#tasks}

(chưa chia — chờ §6 có hình dạng cụ thể)
