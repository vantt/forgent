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

Vòng 4 (2026-08-25). **Ba D-ID đầu tiên đã mint** (D1/D2/D3, §4) — đều là
những điểm đã giữ nguyên qua vòng 2→3→4 không bị lật, kèm ba lời gọi
`fgos decision --id tsk-5x7` thật (seq 4/5/6). §6 đã regenerate lần đầu.

Vòng 4 người dùng chọn **phá tương thích, thiết kế lại đúng từ đầu**: đổi
`exec packet`→`DispatchAssignment`, `TASK`→`ASSIGN`, bỏ id `<scope>#p<n>`
thay bằng typed prefix (`asgn_`/`msg_`/`run_`), bỏ hẳn parse
`[DONE]`/`[BLOCKED]` từ stdout, bắt buộc `ArtifactRef` cho mọi dữ liệu nặng.
Phiên đã **đo giá phá tương thích thật trước khi bàn** (không suy đoán): cả
`exec packet` lẫn id `<scope>#p<n>` có **0 dòng code** — chúng là quyết định
đã khoá nhưng CHƯA BAO GIỜ được xây (`tsk-2t6` D4 tự gác lại B2), nên đổi
tên gần như miễn phí; `[DONE]`/`[BLOCKED]` chỉ có **2 điểm code thật**
(`cli.mjs:541-542`) + 3 file prose canonical (mirror thành 7); `carries`
thì NGƯỢC LẠI — đã xây thật và đang gác trong `resolve.mjs:243-258` với
enum sống `EXECUTOR_CARRIES = ['user-text','repo-content']`, khớp 1:1 với
`governance.carries` người dùng đề xuất nên tái dùng được ngay, miễn phí.

Bốn đổi tên của vòng 4 **chưa mint** (mới đứng đúng một vòng, hard rule cấm
mint từ một câu trả lời) — nằm ở §3 hàng 15-18. Một điểm phiên **không đồng
ý hoàn toàn** và đã nêu bằng chứng ngược: bỏ SẠCH fallback stdout (§3 hàng
18) — không phải phản đối structured RESULT, mà phản đối việc bỏ đường lùi
khi worker là CLI agent bên thứ ba mà fgOS không ép được nó tuân schema.

Vòng 2-3 (giữ lại để đọc mạch): vòng 1 scout xong hai finding sống + quét backlog/
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
| 12 | `AgentMessage.payload`/`message_id` có phải phát minh từ đầu, hay đã có hình dạng tương đương bị khoá ở nơi khác? | **Rõ — chồng lấn có thật, và giá đổi tên gần bằng 0** | `two-layer-dispatch` (`tsk-2t6`) đã khoá **D18**: gói dispatch ad-hoc tên chính thức "exec packet", **SÁU field bắt buộc** (id · mục tiêu một câu · đầu vào phải đọc · ranh giới · hình dạng kết quả mong đợi · hợp đồng trả về), id shape `<scope>#p<n>` (D6b). Vòng 4 người dùng chọn đổi tên thành `DispatchAssignment` + typed id `asgn_`. **Đo giá thật:** `grep -rn "exec packet\|execPacket" src/ bin/` → **0 hit**; `<scope>#p<n>` → **0 hit**. Cả hai là quyết định đã khoá mà CHƯA BAO GIỜ xây — chính `tsk-2t6` D4 tự gác B2 lại, D9 đặt điều kiện AND để mở lại và điều kiện (b) chưa bao giờ thoả. Nên đây không phải "phá tương thích" mà là **đổi tên một thứ chưa tồn tại**; sáu ô nội dung của D18 vẫn được giữ nguyên ý nghĩa, chỉ đổi nhãn (`goal`→`objective`, `boundary`→`scope`, v.v.). |
| 13 | `governance.egress`/`carries` của note có trùng field nào đã khoá không? | **Rõ — `carries` đã XÂY THẬT và khớp 1:1, tái dùng được ngay** | (a) **D15** (`tsk-5td`) không chỉ khoá trên giấy: `EXECUTOR_CARRIES = Object.freeze(['user-text','repo-content'])` (`config.mjs:364`) và gate thật ở `resolve.mjs:243-258` — một executor khai `carries:"user-text"` sẽ TỪ CHỐI một dispatch mang `repo-content` **trước khi spawn**. `execute --carries <class>` đã là flag CLI sống (`cli.mjs:929`). Người dùng đề xuất `governance.carries:["repo-content"]` — trùng khớp enum sống, tái dùng miễn phí, không phát minh vocabulary mới. Hôm nay chưa executor nào trong `.fgos/config.json` khai `carries` nên gate đang ngủ, nhưng cơ chế thì đã có. (b) **D9** (`tsk-5td`) đã thiết kế đúng fix cho gap glm: audit ghi CẢ `provider` (nhãn tự khai) LẪN `command` (lệnh thật) — khớp `egress.declared_provider` vs `effective_target` người dùng đề xuất, chỉ khác chỗ áp (audit event vs field trên message). |
| 15 | Đổi `exec packet`→`DispatchAssignment`, `TASK`→`ASSIGN` | **Hội tụ vòng 4, CHƯA MINT (mới một vòng)** | Lý do người dùng đưa ra đứng vững: "exec packet" thiên về transport/process, còn thứ nó mô tả là *một phần việc được giao*; `TASK` dễ lẫn với `work item`/`tsk-` (và 0029 đã bỏ `rootTask`/`subTask` chính vì lẫn lộn tương tự). Giá đổi = 0 dòng code (hàng 12). |
| 16 | Bỏ id `<scope>#p<n>`, thay bằng typed prefix `asgn_`/`msg_`/`run_` | **Hội tụ vòng 4, CHƯA MINT** | D6b chọn `#` **cố ý** để id gói không bao giờ hợp lệ với `ID_PATTERN` (`work.mjs:24`) — bảo đảm bằng CẤU TRÚC. Typed prefix cũng đạt cùng mục tiêu (`asgn_01K...` không khớp `/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/` vì có `_` và chữ hoa) nhưng đọc được và grep được hơn. Scout: `runId`/`run_id` = **0 hit** trong `src/` → không va chạm khái niệm nào đang sống. |
| 17 | `ArtifactRef` bắt buộc cho dữ liệu nặng, artifact store `.fgos/artifacts/` | **Hội tụ vòng 4, CHƯA MINT** | Greenfield hoàn toàn: `artifactRef\|ArtifactRef\|artifact://` = **0 hit** trong `src/`; `.fgos/` chưa có thư mục `artifacts/`. Không đụng gì đang sống. Ăn khớp với ưu tiên #2 "Release con người" (driver không phải nuốt diff/log dài vào conversation mới biết kết quả). |
| 18 | Bỏ HẲN parse `[DONE]`/`[BLOCKED]`, không giữ fallback | **CHƯA RÕ — phiên KHÔNG đồng ý hoàn toàn, có bằng chứng ngược** | Đồng ý phần structured RESULT là đích đến. Không đồng ý phần **bỏ sạch đường lùi**, vì worker là CLI agent BÊN THỨ BA (agy/gemini, codex, claude) — fgOS *nhờ* nó tuân schema qua prompt, không *ép* được. Bằng chứng repo đã tự thừa nhận điều này: `cli.mjs:546` đã có sẵn trạng thái thứ ba `outcome:'unsignaled'` kèm `headBefore`/`headAfter` — tức fgOS ĐÃ phải thiết kế đường "worker không nói gì dùng được, đọc git state làm sự thật" vì ca đó có thật. Bỏ fallback mà không thay bằng gì thì một worker không tuân sẽ cho **zero** kết quả thay vì một kết quả suy giảm nhưng dùng được. Đề nghị: giữ thang ba nấc `structured RESULT` → `stdout token` → `git-state/unsignaled`, và nấc dưới ghi rõ `confidence`/`source` để đo được bao nhiêu % worker thật sự tuân — đo trước, gỡ sau khi số liệu cho phép. |
| 14 | Trục `mechanism`/`kind` của note có đụng khung bảy tầng đã khoá (D10, `tsk-5td`) không? | **Rõ — không đụng, chỉ cần đối chiếu tên khi viết code** | D10 khoá khung bảy tầng T0-T4+TG+TD (`orchestrator`/`launcher`|`driver`/`work`|`errand`→`exec packet`/`capacity`→`executor`/`capability`|`tool`|`kind`|`executor`/gate/`mechanism`). D16 đã đổi giá trị mechanism từ `native`/`cli-spawn` sang đúng `in-process`/`out-of-process` — khớp 100% với code thật hôm nay (`mechanism.mjs`). D17 khoá T1 chỉ có `launcher`/`driver` — khớp đề xuất `plan.caller`/`plan.launcher` của người dùng. Không có xung đột giá trị, chỉ cần khi viết `DispatchPlan` module thật thì đặt tên field đúng theo khung này (vd không tự bịa từ `orchestrator` cho một nghĩa khác). |

## 4. Quyết định đã chốt

_Append-only. Mỗi D-ID chỉ mint sau khi đã đứng qua **hơn một vòng** không
bị lật, kèm một lời gọi `fgos decision --id tsk-5x7` thật._

| D-ID | Quyết định | Lý do | Vòng nêu → chốt |
|---|---|---|---|
| **D1** | **`DispatchPlan.mechanism` là output canonical của Native-First Dispatch Doctrine (0026 rules 1-4, thu hẹp bởi 0033), không phải một quyết định mới đứng cạnh nó.** `launcher`/`driver` đi vào `plan.caller` (vai trò T1, D17 `tsk-5td`), không vào `mechanism`. `selector.type` dùng `work` (0029 đã thay `rootTask`/`subTask` bằng `work`/`child work`), không resurrect từ vựng cũ. `capacity` không dùng làm primary field — `D-ADR0034`/`tsk-225` đã rename `capacity`→`executor` toàn bộ code+config, `runner.executors` hôm nay CHÍNH LÀ khái niệm đó. `reasonCodes` giữ trace rule nào thắng. | Xác minh sống: `mechanism.mjs`'s `decideDispatchMechanism`/`decideExecutorDispatchMechanism` đã là triển khai thuần của đúng 4 quy tắc 0026/0033, không có drift phải dọn ⇒ Phase 1 thật sự *thin*: chỉ bọc kết quả có sẵn, không viết lại logic. Tạo tầng mechanism thứ hai = hai nguồn sự thật (doctrine trong `docs/specs` vs planner trong code). | 1 → 4 (`fgos decision` seq 4) |
| **D2** | **Scope là "Dispatch semantic control plane + Herdr-ready orchestration" — 8 pha, không khoanh hẹp vào 2 bug đã xác minh sống.** Thứ tự: (1) DispatchPlan canonical + fix `decide --for`, (2) AgentMessage schema V1, (3) protocol abstraction, (4) structured RESULT/BLOCKER/ERROR, (5) artifact store V1, (6) Herdr orchestration làm runtime adapter, (7) mailbox/broker, (8) governance egress metadata. | Người dùng chọn mở rộng thay vì khoanh hẹp, có lý do thật đứng sau (D3) chứ không phải đầu cơ. Ràng buộc cứng đi kèm: **Herdr KHÔNG BAO GIỜ quyết định** task/review/blocker/artifact state — chỉ AgentMessage + fgOS state transition có quyền đó. | 2 → 4 (`fgos decision` seq 5) |
| **D3** | **Consumer thật của Herdr-as-transport là chính người dùng khi đang làm việc** — muốn test/theo dõi/trace agent đang chạy trên pane thật thay vì stdin/stdout mù. Hệ quả kiến trúc: khi Herdr đứng pane lên, **A (caller) không còn là tiến trình cha trực tiếp của B (worker)** — A không spawn B, không đọc stdout của B đồng bộ. | Đó là lý do thật, cụ thể, đứng sau việc tách AgentMessage khỏi giả định "A spawn B rồi đọc stdout" — không phải YAGNI kiểu `tsk-6db`. Scout xác nhận đây là bề mặt MỚI: Herdr đã có tích hợp thật (`fgos gateway` `tsk-31v`, `herdrOrchestrator`, MCP surface) nhưng tất cả là REST/dashboard/automation-trigger, khác hẳn "giao AgentMessage qua Herdr-managed runtime/session". | 3 → 4 (`fgos decision` seq 6) |

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

- **2026-08-25, vòng 4** — Người dùng chọn **phá tương thích, thiết kế lại
  đúng từ đầu**, không bị ràng buộc bởi tên/shape cũ: `exec packet` →
  `DispatchAssignment` (tên cũ thiên transport/process-oriented); `TASK` →
  `ASSIGN` (tránh lẫn với `work item`); id `<scope>#p<n>` → typed prefix
  (`tsk_`/`asgn_`/`msg_`/`run_`); bỏ parse `[DONE]`/`[BLOCKED]`, bắt buộc
  structured RESULT; artifact handoff bắt buộc qua `ArtifactRef`; prompt
  contract trở thành thứ *sinh ra từ* `DispatchAssignment` chứ không phải
  protocol gốc; Herdr = transport/orchestration, không là state authority.
  Nghiêng về Option B cho stdout (agent ghi `.fgos/outbox/<message_id>.json`,
  stdout chỉ còn human log) để không phải scrape terminal đoán task done.
  Phiên **đo giá phá tương thích trước khi bàn**: `exec packet` = 0 hit
  code, `<scope>#p<n>` = 0 hit, `runId`/`ArtifactRef`/`artifact://` = 0 hit
  → gần như miễn phí, vì `tsk-2t6` D4 đã tự gác B2 và chưa bao giờ xây;
  `[DONE]`/`[BLOCKED]` = 2 điểm code + 3 file prose canonical; NGƯỢC LẠI
  `carries` đã xây thật (`EXECUTOR_CARRIES`, gate `resolve.mjs:243-258`,
  flag `execute --carries`) và khớp 1:1 đề xuất `governance.carries`.
  Phiên **không đồng ý một điểm** và nêu bằng chứng ngược: bỏ SẠCH fallback
  stdout (§3 hàng 18) — `cli.mjs:546` đã có sẵn `outcome:'unsignaled'` +
  `headBefore`/`headAfter`, tức repo đã phải thiết kế đường lùi vì ca
  worker-không-tuân là có thật; đề nghị thang ba nấc có đo `confidence`
  thay vì bỏ hẳn. Mint D1/D2/D3 (những điểm đã giữ qua 2→3→4).

## 6. Thiết kế đã chốt {#design}

_Viết lại toàn phần mỗi khi một D-ID làm đổi hình dạng thiết kế. Bản này:
sau D1/D2/D3 (vòng 4). Độ chín ghi rõ từng mục — phần lớn nội dung dưới đây
**chưa mint**._

### 6.1 Năm lớp, và ranh giới giữa chúng [KHOÁ — D1/D2/D3]

Thiết kế đứng trên một mệnh đề: **mỗi lớp chỉ được là sự thật của đúng một
thứ**, và không lớp nào được suy ra sự thật của lớp khác.

| Lớp | Là sự thật của | Không bao giờ được quyết |
|---|---|---|
| **DispatchPlan** | route: ai làm, cơ chế nào, provider/model nào, policy nào | nội dung việc, kết quả việc |
| **AgentMessage** | control-plane: giao việc, hỏi, chặn, trả kết quả, review | trạng thái lifecycle của work item |
| **ArtifactRef / artifact store** | dữ liệu nặng: commit, diff, test report, log | ý nghĩa của dữ liệu đó |
| **State store (`.fgos/`)** | **sự thật duy nhất** về work status | cách một dispatch được route |
| **Transport** | cách message đi tới nơi (stdio/mailbox/HTTP/MCP/Herdr) | bất cứ thứ gì mang nghĩa |

Ràng buộc sắc nhất, từ D2/D3: **Herdr nằm ở hàng Transport, không hàng State
store.** Herdr biết pane nào sống, tiến trình nào chết, terminal nào đang
chạy gì — nhưng "task xong chưa", "review qua chưa", "blocker gỡ chưa" chỉ
đến từ AgentMessage cộng với fgOS state transition. Không map trạng thái
Herdr 1:1 sang trạng thái task.

### 6.2 Vì sao AgentMessage phải tồn tại [KHOÁ — D3]

Không phải vì JSON đẹp hơn prose. Vì một sự kiện cụ thể: **khi Herdr đứng
pane lên, A không còn là cha của B.** Mô hình dispatch hôm nay giả định
ngầm rằng caller spawn worker rồi đọc stdout của chính tiến trình con đó —
toàn bộ `[DONE]`/`[BLOCKED]`, toàn bộ `outcome:'unsignaled'` đều dựa trên
giả định ấy. Bỏ giả định đó đi thì cần một kênh trao đổi không phụ thuộc
quan hệ cha-con tiến trình. Đó là AgentMessage.

```mermaid
flowchart LR
  subgraph HT["hôm nay — A là cha của B"]
    A1[caller A] -->|spawn| B1[worker B]
    B1 -->|stdout token| A1
  end
  subgraph HD["với Herdr — A không spawn B"]
    A2[caller A] -->|ASSIGN| MB[(kênh message)]
    MB --> H[Herdr: dựng/đánh thức pane]
    H --> B2[worker B trên pane thật]
    B2 -->|RESULT / BLOCKER| MB
    MB --> A2
    B2 -.->|người dùng nhìn thấy| EYE([anh theo dõi trực tiếp])
  end
```

### 6.3 DispatchPlan — thin, không phải tầng quyết định thứ hai [KHOÁ — D1]

`compileDispatchPlan()` **không tự phán** cơ chế. Nó gọi đúng thứ đã có
(`decideDispatchMechanism`/`decideExecutorDispatchMechanism`, triển khai
thuần của 0026 rules 1-4 thu hẹp bởi 0033) rồi đóng gói kết quả lại kèm
ngữ cảnh. Hình dạng (field name chưa mint):

```
selector   { type: work|purpose|executor|adHocAgent, value }
caller     { role: launcher|driver }        ← T1, D17 tsk-5td
mechanism  in-process | out-of-process | unavailable   ← D16 tsk-5td
executorId capability  invocation{via,adapter,protocol}  model
governance { carries, egress }
reasonCodes [ "native-first.rule-2...", "native-first.0033.cli-spawn-shaped" ]
```

`reasonCodes` là chỗ trả lời "vì sao ra kết quả này" mà hôm nay không có —
quan trọng vì mechanism là *dẫn xuất*, và một dẫn xuất không giải thích
được thì không debug được.

### 6.4 Bốn đổi tên của vòng 4 [HỘI TỤ — chưa mint]

`DispatchAssignment` (thay `exec packet`), `ASSIGN` (thay `TASK`), typed id
`asgn_`/`msg_`/`run_` (thay `<scope>#p<n>`), `ArtifactRef` bắt buộc. Sáu ô
nội dung của D18 (`tsk-2t6`) **giữ nguyên ý nghĩa**, chỉ đổi nhãn:
`id`→`assignment_id`, `goal`→`objective`, `boundary`→`scope`,
`expected shape`→`deliverable`, `return contract`→`return_contract`.
Giá đo được: 0 dòng code phải sửa (cả hai khái niệm chưa từng được xây).

### 6.5 Thang kết quả — điểm còn tranh luận [HỞ]

Đích đến (structured RESULT/BLOCKER/ERROR) đã đồng thuận. Chỗ chưa thống
nhất là có giữ đường lùi không. Lập luận của phiên: worker là CLI agent bên
thứ ba, fgOS *nhờ* nó tuân schema chứ không *ép* được; `cli.mjs:546` đã có
sẵn `outcome:'unsignaled'` chính vì ca không-tuân là có thật. Đề nghị thang
ba nấc, nấc dưới ghi rõ nguồn/độ tin, đo tỉ lệ tuân trước khi gỡ:

```
structured RESULT (mailbox/NDJSON)   → confidence: reported
stdout token [DONE]/[BLOCKED]        → confidence: legacy-signal
git state (headBefore/headAfter)     → confidence: inferred
```

### 6.6 Cái gì tái dùng được ngay, miễn phí [KHOÁ — bằng chứng code]

- `carries` — `EXECUTOR_CARRIES = ['user-text','repo-content']` đã sống,
  gate đã chạy (`resolve.mjs:243-258`), flag `execute --carries` đã có.
  `governance.carries` của thiết kế mới dùng thẳng, không phát minh enum.
- `provider` + `command` dual-audit (D9 `tsk-5td`) — đúng fix cho gap
  glm-style, khớp `egress.declared_provider` vs `effective_target`.
- `mechanism` values `in-process`/`out-of-process` (D16) — khớp code thật.

## 7. Danh mục hạng mục / task {#tasks}

(chưa chia — §6 vừa có hình dạng đầu tiên, nhưng §6.4/§6.5 còn chưa mint và
§6.5 còn đang tranh luận. Chia việc sau khi hai mục đó đứng qua một vòng
nữa.)
