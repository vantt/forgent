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

Vòng 2 (2026-08-25). Vòng 1 scout xong hai finding sống + quét backlog/
doctrine, đặt hai câu hỏi mở đầu (vocabulary reconciliation + phạm vi thảo
luận). Người dùng trả lời cả hai trong vòng 2, đầy đủ và có lý lẽ riêng:
`mechanism` phải là canonical output của 0026/0033 (không phải quyết định
mới), `launcher` đi vào `plan.caller`/`plan.launcher` chứ không phải
`mechanism`, `selector.type` dùng `work` (khớp 0029's rename rootTask→work)
thay vì resurrect rootTask/subTask, và scope được MỞ RỘNG thành 8 pha dưới
tên "Dispatch semantic control plane + Herdr-ready orchestration" (thêm hẳn
Herdr orchestration làm pha 6 thay vì để riêng). Đã xác minh thêm hai điều
bằng scout (không phải suy đoán): (a) `mechanism.mjs`'s
`decideDispatchMechanism`/`decideExecutorDispatchMechanism` ĐÃ LÀ triển khai
thuần/đúng của 0026/0033 hôm nay — Phase 1 thật sự "thin" như người dùng
muốn, không cần viết lại logic mechanism, chỉ cần bọc nó vào object
`DispatchPlan` + sửa bug `decide --for`; (b) `capacity`→`executor` KHÔNG
CÒN LÀ giả định "nếu" — đã có quyết định thật (`D-ADR0034`, `tsk-225`,
`docs/history/capacity-naming-rename/CONTEXT.md`) đổi tên toàn bộ
`capacity`/`capacities` (code + config) thành `executor`/`executors`, xác
nhận `.fgos/config.json`'s `runner.executors` hôm nay CHÍNH LÀ khái niệm
"capacity" của 0026/0029, không phải một field khác. Chưa có D-ID nào mint
— câu trả lời vòng 2 chưa "giữ qua hơn một vòng" theo hard rule, cần một
vòng nữa xác nhận trước khi mint. Một câu hỏi mới nổi ra từ chính đề xuất mở
rộng scope của người dùng: Herdr-as-transport (pha 6/7) có consumer thật
nào đang chờ không, hay vẫn là tầm nhìn chưa có ai cần (§3 hàng 11).

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
| 6 | `DispatchPlan`/`selector`/`kind` có xung đột với vocabulary ĐÃ KHOÁ (launcher/rootTask/subTask/capacity→executor, D-ADR0026/0029/0033/0034) không? | **Hội tụ vòng 2, chưa mint** | Người dùng chốt: `mechanism` PHẢI LÀ canonical output của 0026/0033, không phải quyết định mới cạnh nó — xác minh khớp code thật: `decideDispatchMechanism`/`decideExecutorDispatchMechanism` (`mechanism.mjs:42,82`) đã là triển khai thuần của đúng 4 quy tắc đó, Phase 1 chỉ cần bọc, không viết lại. `launcher` (vai trò, KHÔNG cần soul) đi vào `plan.caller`/`plan.launcher`, không phải `mechanism`. `rootTask`/`subTask` KHÔNG resurrect — 0029 đã thay bằng `work`/`child work`, khớp `selector.type=work`. `capacity` KHÔNG "nếu rename" nữa — đã CHỐT rename thành `executor` (`D-ADR0034`, `tsk-225`) — `runner.executors` hôm nay chính là khái niệm capacity của 0026. Còn treo: cần một vòng nữa giữ nguyên trước khi mint D-ID (hard rule: không mint từ một câu trả lời). |
| 7 | `two-layer-dispatch` (`tsk-2t6`, done) đã khoá 18 D-ID về L1/L2 + capacity ad-hoc packet — note có giẫm lên D-ID nào ở đó không? | **CHƯA RÕ — cần đọc lại nếu đi sâu Phase 2+** | Chưa đọc hết `docs/history/two-layer-dispatch/DISCUSSION.md` (163.9K) trong vòng này — chỉ đọc §1. Nếu phạm vi vòng này đi tới Phase 2 (`DispatchPlan` module thật), cần đối chiếu D-ID ở đó trước khi mint D-ID mới có nguy cơ trùng/lật. |
| 8 | `dispatch-concept-boundary` (`tsk-5td`, done, 18 D-ID) đã khoá gather/judge/orchestrator→launcher — `AgentMessage.message_type` (TASK/ACK/PROGRESS/...) có đụng khái niệm nào ở đó không? | **CHƯA RÕ** | Chưa đối chiếu chi tiết — cần nếu Phase 3 (protocol decoupling) được chọn làm việc thật. |
| 9 | Phase 3/6/7 (AgentMessage schema, artifact-based handoff, mailbox/Herdr) có consumer thật nào hôm nay không, hay cùng dạng YAGNI-chờ-consumer như `tsk-6db` (Native-First Phase 5, "deferred, no concrete consumer yet") và `tsk-2ld` (RPC/app-server adapter, "research/discovery scope only")? | **CHƯA RÕ — cần người quyết** | Chưa thấy bằng chứng có provider nào hôm nay THẬT SỰ cần JSON-mode/event-stream thay vì prompt/stdout — `coding-worker-contract.md`'s `[DONE]`/`[BLOCKED]` token vẫn là hợp đồng sống duy nhất. Repo có xu hướng khoá rõ "deferred, YAGNI, chưa có consumer cụ thể" cho đúng dạng việc này (`tsk-6db`) thay vì xây trước. |
| 10 | Phạm vi thảo luận vòng này: đi hết 8 pha của note, hay khoanh trước vào phần đã xác minh sống + rẻ (Finding #1, #3 — hàng 1-2 ở trên), để phần đầu cơ (AgentMessage/mailbox/Herdr) chờ một vòng riêng có consumer thật? | **Người dùng chọn: đi hết, dưới tên "Dispatch semantic control plane + Herdr-ready orchestration"** | Người dùng mở rộng scope thành 8 pha thật (DispatchPlan canonical → AgentMessage schema → protocol abstraction → structured result → artifact store → Herdr orchestration → mailbox/broker → governance egress), thứ tự triển khai rõ. Herdr được đưa vào SỚM hơn đề xuất gốc của note (pha 6/9 thay vì "optional, chưa quyết"), với ràng buộc rõ: Herdr là runtime adapter, KHÔNG BAO GIỜ quyết định task/review/blocker/artifact state — AgentMessage + fgOS state transition mới có quyền đó. Chưa trả lời trực tiếp câu hỏi "có consumer thật không" — xem hàng 11 mới. |
| 11 | Herdr-as-transport (pha 6/7 mới) có consumer thật đang chờ không, hay vẫn là tầm nhìn chưa ai cần (cùng dạng YAGNI `tsk-6db` đã tự khoá)? | **Rõ — consumer thật, cùng xây trong scope này** | Người dùng xác nhận: consumer là chính người dùng khi đang làm việc, muốn TEST/theo dõi/trace agent đang làm gì lúc dispatch — thay vì bật agent mới qua stdin/stdout mù, bật qua Herdr để thấy nó chạy trên pane thật. Hệ quả kiến trúc quan trọng: khi Herdr đứng pane lên, A (caller) KHÔNG CÒN LÀ tiến trình cha trực tiếp của B (worker) — A không spawn B, không đọc stdout của B đồng bộ — nên cần một **protocol ổn định để A/B trao đổi khi A không sở hữu tiến trình B**. Đây chính là động lực thật, cụ thể, đứng sau việc tách AgentMessage khỏi giả định "A spawn B, đọc stdout" — không phải đầu cơ. |
| 12 | `AgentMessage.payload`/`message_id` có phải phát minh từ đầu, hay đã có hình dạng tương đương bị khoá ở nơi khác? | **CHƯA RÕ — phát hiện chồng lấn nặng, cần người quyết trước khi viết schema** | `two-layer-dispatch` (`tsk-2t6`) đã khoá **D18**: gói dispatch ad-hoc tên chính thức là **"exec packet"** (không phải cell/job/errand), với **SÁU field bắt buộc**: id gói · mục tiêu một câu · đầu vào phải đọc · ranh giới (không được chạm/ghi gì) · hình dạng kết quả mong đợi · hợp đồng trả về — và id shape khoá cứng `<scope>#p<n>` (D6b, `#` cố ý phá `ID_PATTERN` để không bao giờ bị nhầm work item). `AgentMessage.payload` (`action/scope/verify`) và `message_id` (`msg_...`) của note trùng lặp Ý ĐỊNH gần như 1:1 với "exec packet" đã khoá — nhưng KHÔNG cùng field name/id format. Cần chốt: `AgentMessage` là envelope RỘNG HƠN (routing/correlation/lifecycle/observability) BỌC quanh một "exec packet" làm `payload` của nó (không phát minh field payload mới, tái dùng sáu ô đã khoá), hay là hai khái niệm cố tình khác nhau? |
| 13 | `governance.egress`/`egressTarget` của note có trùng field nào đã khoá không? | **CHƯA RÕ — hai chỗ chồng lấn tiềm năng** | (a) `dispatch-concept-boundary` (`tsk-5td`) đã khoá **D9**: event `capacity.dispatch` phải ghi CẢ HAI `provider` (nhãn tự khai) VÀ `command` (lệnh thật spawn) — đúng gap glm-style mà note gọi là "egress ẩn", chỉ khác tên field và khác chỗ áp (audit log vs. một field mới trên DispatchPlan). (b) Cùng discussion khoá **D15**: `capacity` đã khai `carries` — tập ĐÓNG các loại nội dung nó ĐƯỢC PHÉP nhận (`user-text`, `repo-content`; `secrets` không bao giờ hợp lệ) — là trục "được phép mang gì", còn note's `egress.content` là trục "lần dispatch NÀY đang mang gì". Có thể bổ sung nhau (khai declare vs khai per-call) chứ không nhất thiết trùng — cần người quyết có tái dùng `carries` làm tập giá trị hợp lệ cho `egress.content` không. |
| 14 | Trục `mechanism`/`kind` của note có đụng khung bảy tầng đã khoá (D10, `tsk-5td`) không? | **Rõ — không đụng, chỉ cần đối chiếu tên khi viết code** | D10 khoá khung bảy tầng T0-T4+TG+TD (`orchestrator`/`launcher`|`driver`/`work`|`errand`→`exec packet`/`capacity`→`executor`/`capability`|`tool`|`kind`|`executor`/gate/`mechanism`). D16 đã đổi giá trị mechanism từ `native`/`cli-spawn` sang đúng `in-process`/`out-of-process` — khớp 100% với code thật hôm nay (`mechanism.mjs`). D17 khoá T1 chỉ có `launcher`/`driver` — khớp đề xuất `plan.caller`/`plan.launcher` của người dùng. Không có xung đột giá trị, chỉ cần khi viết `DispatchPlan` module thật thì đặt tên field đúng theo khung này (vd không tự bịa từ `orchestrator` cho một nghĩa khác). |

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

- **2026-08-25, vòng 2** — Người dùng trả lời cả hai câu hỏi vòng 1.
  (a) `DispatchPlan.mechanism` = canonical output của 0026/0033 rules qua
  `compileDispatchPlan()`, không phải decision mới; `launcher`→
  `plan.caller`/`plan.launcher`; `rootTask`/`subTask` không resurrect, dùng
  `selector.type=work|purpose|executor|adHocAgent`; `capacity` nếu đã rename
  sang `executor` thì không dùng lại làm primary field; `reasonCodes` giữ
  trace rule nào thắng (vd `native-first.rule-2.live-task-access`,
  `native-first.0033.cli-spawn-shaped`). (b) Scope MỞ RỘNG thành 8 pha dưới
  tên "Dispatch semantic control plane + Herdr-ready orchestration": (1)
  DispatchPlan canonical + fix `decide --for`, (2) AgentMessage schema V1,
  (3) protocol abstraction (prompt-stdout-v1 là MỘT protocol, không phải
  protocol duy nhất), (4) structured RESULT/BLOCKER/ERROR normalization +
  legacy `[DONE]`/`[BLOCKED]` fallback, (5) artifact store V1
  (`.fgos/artifacts/<id>/...`, filesystem-backed), (6) Herdr orchestration
  (runtime adapter, KHÔNG quyết định task/review/blocker/artifact state),
  (7) mailbox/broker (`.fgos/messages/{inbox,outbox,dead-letter}`), (8)
  governance egress metadata thay `command!=claude`. Phiên scout lại và xác
  nhận: `mechanism.mjs` đã đúng thuần 0026/0033 hôm nay (Phase 1 thật sự
  thin); `capacity`→`executor` đã CHỐT thật (`D-ADR0034`/`tsk-225`), không
  còn là giả định "nếu"; và phát hiện Herdr đã có tích hợp thật
  (gateway/dashboard/automation, `tsk-31v`) nhưng KHÁC bề mặt với
  "AgentMessage qua Herdr transport" — đặt thành câu hỏi mới (§3 hàng 11).

- **2026-08-25, vòng 3** — Người dùng trả lời câu hỏi Herdr-consumer: chính
  người dùng, lúc đang làm việc, muốn test/theo dõi/trace agent đang chạy —
  bật qua Herdr để thấy trên pane thay vì stdin/stdout mù, và điều đó cần
  một protocol ổn định cho A/B trao đổi khi A không spawn B trực tiếp. Phiên
  đọc thêm D-ID table của hai discussion đã `done` (`two-layer-dispatch`
  D1-D18, `dispatch-concept-boundary` D1-D18) để đối chiếu trước khi để
  AgentMessage/governance đi xa hơn — phát hiện ba chồng lấn nặng cần người
  quyết: (1) "exec packet" (D18, `tsk-2t6`) đã khoá đúng sáu field bắt buộc
  + id shape `<scope>#p<n>` cho một gói dispatch ad-hoc — gần như cùng ý
  định với `AgentMessage.payload`/`message_id` của note, chưa rõ có nên tái
  dùng làm payload shape thay vì phát minh field mới; (2) `provider`+
  `command` dual-audit (D9, `tsk-5td`) đã là fix đã thiết kế cho đúng gap
  glm mà note gọi "egress ẩn" — cần đối chiếu tên field; (3) `carries` (D15,
  `tsk-5td`) đã khoá tập nội dung ĐƯỢC PHÉP mang — có thể là tập giá trị hợp
  lệ cho `egress.content` của note. Khung bảy tầng (D10/D16/D17,
  `tsk-5td`) xác nhận KHÔNG đụng đề xuất của người dùng (`in-process`/
  `out-of-process`, `launcher`/`driver` hai giá trị đều khớp).

## 6. Thiết kế đã chốt {#design}

(chưa có gì để tổng hợp — chưa D-ID nào ổn định qua hơn một vòng. Sẽ viết
lại toàn phần một khi §4 có D-ID đầu tiên.)

## 7. Danh mục hạng mục / task {#tasks}

(chưa chia — chờ §6 có hình dạng cụ thể)
