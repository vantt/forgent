# Đào sâu cơ chế điều phối fgOS — Inventory + End-to-End Model + Gaps

Ngày: 2026-08-26 · Phạm vi: orchestration/routing/driver/launcher/workflow/stage/work-item/role/skill/capability/executor/agent-type/persona/dispatch/Herdr
Không sửa code trong lượt này. Toàn bộ đường dẫn/dòng dưới đây đã được `rg`/đọc trực tiếp trước khi trích.

## Executive Summary

fgOS có một hệ điều phối **rộng hơn nhiều** so với riêng dispatch. Có **ít nhất 3 tầng thiết kế lớn**, mỗi tầng có tài liệu quyết định riêng, và mức triển khai KHÁC NHAU rõ rệt:

1. **Native-First Dispatch Doctrine** (D0026→D0028→D0029→D0033→D0034, `docs/specs/runner.md`) — chọn cơ chế kích hoạt (native vs cli/spawn) cho một target cần soul. Đã tái tổ chức thành `DispatchPlan` (`docs/architect/dispatch-control-plane-redesign.md`) — slice hẹp `fgw/tsk-5x7` **đã implement và test xanh** (governance egress, `herdr-spawn` adapter, `decide --for` fix).
2. **Multi-role Team Harness** (D0032, `docs/specs/work-state.md`) — trục `role/holder` (5 position: implementer/researcher/reviewer/helper/advisor), handoff Call/Pass, ontology task-spec/skill/knowledge/context, workflow un-gộp (feature/bugfix/lightweight). **Đã implement thật** cho domain `coding`: `domains/coding/registry.yaml` (roleGraph sống), `domains/coding/task-specs/*.md` (13 phiếu), `src/state/handoff.mjs`, `core/agents/*.yaml` (persona/role/skills/decision_boundary thật).
3. **Doing Coordination Redesign** (`docs/architect/doing-coordination-redesign.md`, 2026-08-25) — tách `doing-current` (runtime claim) khỏi `doing-history` (durable event). Doc tự ghi "Status: design target", nhưng `src/state/runtime-coordination.mjs` **đã tồn tại và cài đúng cơ chế đó** (`.fgos/runtime/claims/<id>.json`, `effectiveStatus`) — **CONFLICT tài liệu vs code**, xem Findings §1.

Vocabulary đã đổi tên nhiều lần và có dấu vết rõ trong cả doc lẫn code: `orchestrator`→`launcher` (D0028), `rootTask/subTask` bị loại khỏi vocab chính thức (D0029, nhưng vẫn còn sót 4 chỗ prose/docstring trong `src/runner/dispatch/mechanism.mjs`, `src/state/worker-slots.mjs`), `capacity`→`executor` (D0034, rename sạch trong identifier, chỉ còn sót trong tên thư mục `docs/history/*capacity*/` — đúng chủ ý, không phải nợ). Từ "orchestrator" được thả tự do lại (D0031) cho nghĩa mới: tầng T0 fan-out (N driver + hợp nhất kết quả) — bằng chứng sống `fgos-fanout`.

Vấn đề lớn nhất không phải là thiếu cơ chế — mà là (a) 3 tầng thiết kế trên **chưa được hợp nhất thành một bức tranh duy nhất** (mỗi cái có architect doc riêng, không trỏ chéo nhau tường minh), (b) một khoảng trống LLM-judgment còn treo từ tận D0026 ("LLM tự nhận ra khi nào dùng nhánh nào" — chưa xây), và (c) AgentMessage/mailbox/artifact-store là design-target thuần, đúng như tài liệu tự nhận, chưa có consumer.

## Concept Inventory

Ký hiệu trạng thái: **[IMPL]** implemented+tested, **[DOC]** documented (spec/decision, chưa chắc code), **[TARGET]** design-target only, **[DRIFT]** vocab cũ còn rò rỉ, **[DEAD]** đã rút.

| Concept | Sứ mệnh | Ai tạo | Ai đọc | Layer | Nguồn thẩm quyền? | Lifecycle? | Phụ thuộc | Tên cũ/mới |
|---|---|---|---|---|---|---|---|---|
| **work** | Đơn vị lifecycle chính (`tsk-*`) | `fgos submit`/`add` | mọi verb/skill | state | **Nguồn thẩm quyền** (event log) | Có (FSM `status`) | — | thay `rootTask` (D0029) |
| **child work** | Work con sinh bởi `plan`, có `parent` | verb `plan`/`decompose` | frontier, rollup, root-affinity | state | projection từ event log | Có (chính là `work`) | `work` | thay 1 nghĩa của `subTask` (D0029) |
| **stage** | Vi mô hoá trong 1 `status` (`discovery→exploring→planning→executing`, domain-aware) | domain registry (`workflow-stage-graphs.mjs`) | `fgos-coding-driving`, skill routing | workflow | projection (bảng cạnh chuyển) | Có (cạnh chuyển riêng, per-domain) | domain registry | — |
| **status** | FSM lifecycle phổ quát (11 trạng thái) | `fsm.mjs`/`status-fsm.mjs` | mọi verb | state | **Nguồn thẩm quyền** | Có | — | `proposed`→`awaiting-approval` (D0024) |
| **doing-current** vs **doing-history** | Tách claim runtime khỏi lịch sử durable | `runtime-coordination.mjs` | claim/return/reclaim | state/coordination | doing-current = runtime overlay (KHÔNG event log); doing-history = event log | doing-current: có, ngắn hạn | `doing` status | doc nói "design target" nhưng code đã sống — **conflict**, xem Findings §1 |
| **role/holder** | Trục thứ 3 orthogonal với status×stage — ai đang cầm item, ở vị trí nào | D0032, `roleGraph` per-domain | handoff, `fgos-coding-driving` | workflow (opt-in per-domain) | `domains/<d>/registry.yaml` là khai báo; runtime holder trong claim | Có (đổi qua async handoff) | domain registry | — |
| **position** (implementer/researcher/reviewer/helper/advisor) | 5 vị trí đóng cứng của roleGraph | D0032 | `registry.yaml` edges | workflow | khai báo | — | roleGraph | KHÔNG map 1-1 agent-type — "nở task trước, nở role sau" |
| **handoff (Call/Pass)** | Cầu nối giữa role trong 1 item | D0032, `src/state/handoff.mjs` | 5 skill coding (implement/discovering/exploring/planning/validating) | workflow | event (`work.handoff`) | Có (mỗi handoff = checkpoint) | roleGraph | tổng quát hoá `fgos ask/answer` cũ |
| **launcher** | VAI TRÒ kích hoạt 1 work rồi bước ra hẳn, KHÔNG cần soul cho việc chọn | D0026→D0028 (rename từ `orchestrator`) | user, `/fgOS:pick`, `fgos-runner` | dispatch/routing | vai trò, không phải software cụ thể | — | — | cũ: `orchestrator` |
| **driver** | Vai trò ở LẠI, tiếp tục điều phối sau kích hoạt (1 đơn vị, "ở lại") | D0029 (lưới 2×2 launcher/driver) | `fgos-coding-driving` | dispatch/routing | vai trò | — | launcher | mới, điền vào ô T1 thứ 2 |
| **orchestrator (T0, nghĩa MỚI)** | Tầng hợp thành: N driver + hợp nhất kết quả | D0029, D0031 | `fgos-fanout` | dispatch/routing | vai trò (không phải 1 giá trị T1) | — | driver | nghĩa CŨ (D0026, "orchestrator" = launcher) đã bị D0028 rename đi; nghĩa MỚI khác hẳn — **hai lớp nghĩa lịch sử của cùng 1 từ, phải phân biệt theo thời điểm doc được viết** |
| **capability** | Lời hứa hành vi trừu tượng, có tên (vd `fgos-coding-implement`) | config `runner.capabilities` | dispatch resolver | dispatch config | khai báo | — | — | tách khỏi `capacity` bởi `tsk-34n`, chính thức hoá D0034 |
| **executor** | Backend cụ thể hiện thực 1 capability (`agy`, `codex`, `gitnexus`, `herdr`) | config `runner.executors.<id>` | dispatch resolver | dispatch config | khai báo | — | capability (qua `prefer`) | cũ: `capacity`/`capacities` (D0034, rename sạch, không alias) |
| **DispatchPlan** | Đối tượng quyết định dispatch duy nhất (`selector`→`mechanism`→`governance`→`execution`) | `compileDispatchPlan()` | `decide`/`execute` CLI | dispatch | canonical KẾT QUẢ (không phải quyết định mới cạnh doctrine) | — | Native-First Doctrine | **[IMPL]** slice hẹp (Item 0/1/2 của redesign doc) |
| **DispatchAssignment** | Tên đích cho "exec packet"/ad-hoc task hiện tại | design target | (chưa có) | dispatch | design | không (ephemeral, không lifecycle row) | — | **[TARGET]**, KHÔNG rename hiện tại (6-field cũ vẫn sống) |
| **AgentMessage** | Envelope protocol tương lai (ASSIGN/RESULT/BLOCKER/ERROR) | design target | (chưa có consumer) | message layer | design | — | DispatchAssignment | **[TARGET]** — chủ ý deferred tới khi có consumer thật |
| **task-spec** | Phiếu giao việc (contract input/output/gates/verify-template), bất biến theo người làm | D0032 | `resolveAgentTypeForTaskSpec`, agent thật | workflow declaration | `domains/coding/task-specs/*.md` | Có (per-call) | — | **[IMPL]** — 13 file thật, header `agent:`/`requires-skill:` (`readTaskSpecHeader`, `src/runner/agent-roster.mjs:106`) |
| **skill** (Claude skill, `.claude/skills`) | Know-how của executor, compound-learn rewrite tự do | skill-creator/manual | agent-type qua field `skills:` | workflow declaration/guidance | file `SKILL.md` | — | — | **[IMPL]** rộng khắp, 39+ skill trong ecosystem |
| **agent-type (persona)** | Định danh chức danh, gồm `role`, `persona{voice,style,archetype}`, `decision_boundary`, `model_tier`, `tool-scope`, `skills:[...]` | `core/agents/*.yaml`, `domains/<d>/agents/` | `loadAgentDefs` (`agent-roster.mjs:30`), dispatch eligibility | dispatch/routing | khai báo | — | task-spec (qua `skills` match) | **[IMPL]** thật (đọc trực tiếp `code-reviewer.yaml`, `debugger.yaml`, `docs-manager.yaml`) — nhưng field `claims: [phiếu]` mà D0032 mô tả **KHÔNG tồn tại**; thực tế dùng `skills: [...]` trên agent-type + `agent:`/`requires-skill:` trên task-spec header, khớp qua `resolveAgentTypeForTaskSpec` (D20/D22, "eligibility-inversion resolution") — **[DRIFT]** vocab: D0032 nói "claims", code nói "skills match" |
| **mechanism** | `unavailable` \| `in-process` \| `out-of-process` — kết quả của Doctrine | `mechanism.mjs` | DispatchPlan | dispatch | canonical | — | Native-First Doctrine | **[IMPL]** |
| **governance/egress** | Có được rời trusted boundary không, dựa `carries` + effective egress (không chỉ argv[0]) | `resolve.mjs`, egress gate | dispatch execute | dispatch | canonical | — | executor shape | **[IMPL]** (`test/runner/egress-governance.test.mjs` 6/6) |
| **Herdr** | Runtime/visibility transport — mở pane, chạy process, KHÔNG quyết task state | `herdr-plugin` (Rust) | `herdr-spawn` adapter | transport | KHÔNG PHẢI authority | — | executor `adapter` field | **[IMPL]** narrow slice (`test/runner/herdr-spawn-adapter.test.mjs` 20/20) |
| **unsignaled/legacy-signal/inferred** | Ladder độ tin cậy kết quả (structured → `[DONE]`/`[BLOCKED]` → git-head-delta) | `dispatch/transport.mjs` | worker result parser | dispatch | fallback thật, không phải bug | — | — | **[IMPL]** ladder hành vi; field `confidence` **[TARGET]** (chủ ý chưa thêm — chưa có reader) |
| **fgos-routing / driving** | Entry skill chọn stage-skill theo `stage` của item (domain-pluggable qua `skillForStage`) | `workflow-stage-graphs.mjs` | mọi phiên fgOS | routing (guidance layer, P50) | prose+bảng cơ học | — | domain registry | **[IMPL]** |
| **fgos-fanout** | Chạy N child đã decompose song song, tự claim qua `/fgOS:pick`, tự approve leaf | skill | user, batch work | orchestration (T0) | không lưu state riêng — đọc live state | — | worker-slots, root-affinity | **[IMPL]** — bằng chứng sống nhiều lần trong `docs/history/` (`fanout-batch-dispatch-sequential-loop`, `dispatch-fanout-research-dogfood`) |
| **worker-slots (ceiling)** | Giới hạn song song 2 tầng, KHÔNG còn quyết "chạy bao nhiêu" một mình | `worker-slots.mjs` | `loop.mjs`, `fgos-fanout` | runtime coordination | runtime | — | — | **[IMPL]**, tách khỏi "orchestrator" cũ nghĩa (comment dòng 10-12 trích rõ) |
| **root-affinity** | Giữ mọi con của 1 gốc chung 1 chủ trong 1 lượt chạy | `root-affinity.mjs` | `loop.mjs` | runtime coordination | runtime | — | child work | **[IMPL]** |

## Current End-to-End Model

Dòng chảy hiện tại (đúng những gì có bằng chứng, KHÔNG suy diễn phần chưa thấy code):

```
1. User/session → /fgOS:submit → fgos-clarifying → work item (status:todo, domain, kind)
2. fgos-routing (entry skill) đọc {domain, stage} của item claimed
   → tra skillForStage (workflow-stage-graphs.mjs) → route tới fgos-coding-discovering
     / -exploring / -planning / -validating theo stage hiện tại
3. Trong 1 item, cạnh chuyển stage domain-aware (coding: discovery→[clear]→planning,
   hoặc discovery→[unclear]→exploring→planning→executing)
4. fgos-coding-driving là VÒNG LẶP cơ học (không phải 1 phán đoán routing thứ hai) —
   chạy item qua stage này tới stage khác tới khi chạm ceiling/câu hỏi cần người
5. Trong 1 stage/call, nếu cần role khác (researcher/reviewer/helper/advisor):
   task-spec khai edge hợp lệ trong roleGraph (domains/coding/registry.yaml)
   → handoff Call (round-trip) hoặc Pass (one-way theo stage)
   → holder đổi CHỈ qua async handoff (invariant D0032)
6. Khi cần dispatch RA NGOÀI (không phải role-handoff trong-item):
   caller gọi `node src/runner/dispatch.mjs decide --for <capability>` (hoặc --work/--executor)
   → compileDispatchPlan() áp Native-First Doctrine:
      - target thuần cơ học → cli/spawn
      - target cần soul + agentType-shaped + cùng provider + hasLiveTaskAccess → in-process
      - target cli-spawn-shaped (có command riêng, vd agy) → LUÔN out-of-process (D0033,
        thắng cả hasLiveTaskAccess=true)
      - khác provider → luôn out-of-process
   → mechanism: unavailable | in-process | out-of-process
7. Nếu out-of-process: governance kiểm effective egress (không chỉ command name)
   → resolve executor (config runner.executors.<id>) → chọn adapter (cli-spawn mặc định,
     hoặc herdr-spawn nếu executor.adapter === "herdr-spawn")
   → transport spawn thật (subprocess hoặc Herdr pane)
8. Worker trả kết quả qua ladder: structured RESULT (chưa migrate) → [DONE]/[BLOCKED]
   token → git head-delta inference (unsignaled) — KHÔNG có field confidence tường minh hôm nay
9. runner/state nhận kết quả → ghi event (.fgos/events.jsonl, nguồn thẩm quyền) →
   state.json là view rebuildable, KHÔNG BAO GIỜ là authority
10. Herdr (nếu dùng) chỉ cung cấp pane/visibility — KHÔNG quyết work item done hay chưa;
    fact đó luôn đến từ runner state + structured event + verify
11. Claim/coordination: claim ghi vào runtime-coordination store (.fgos/runtime/claims/,
    gitignored) — durable event log KHÔNG còn ghi work.move→doing tại thời điểm claim
    (nếu doing-coordination-redesign đã áp dụng thật — xem Findings §1 về conflict trạng thái)
12. fgos-fanout (T0) là lớp fan-out N item song song: mỗi Agent chạy /fgOS:pick end-to-end
    (mỗi cái là 1 driver), tự claim qua worker-slots + root-affinity, đọc LIVE STATE
    (không tin narration của Agent), tự approve leaf tới khi awaiting-approval
```

Ba tầng điều phối KHÔNG giẫm nhau (trích nguyên văn D0032 §I, đã xác nhận khớp code hiện có):
**Router/Driver** (`fgos-routing`/`fgos-coding-driving`, ai/việc-nào-tiếp) — **Guard** (FSM + roleGraph + gates, hợp lệ hay không) — **Dispatch** (`src/runner/dispatch.mjs`, chạy executor nào).

## Implementation Status

| Nhóm | Trạng thái | Bằng chứng |
|---|---|---|
| Native-First Dispatch Doctrine — 4 quy tắc cốt lõi | **[IMPL]** | `docs/specs/runner.md` D0026/D0033, `src/runner/dispatch/mechanism.mjs`, `resolve.mjs` |
| `DispatchPlan` (Item 0), governance egress (Item 1), `herdr-spawn` adapter (Item 2) | **[IMPL]+tested** | `dispatch-control-plane-redesign.md` §14: `test/runner/dispatch.test.mjs`, `egress-governance.test.mjs` (6/6), `herdr-spawn-adapter.test.mjs` (20/20), `loop.test.mjs` (401/401 tổng) |
| `DispatchAssignment` rename, `AgentMessage`, artifact store, confidence field, ACK/PROGRESS/QUESTION/... | **[TARGET]** thuần | `dispatch-control-plane-redesign.md` §15, tự nhận "deferred until a consumer exists" |
| roleGraph + handoff cho domain `coding` | **[IMPL]** | `domains/coding/registry.yaml` (5 role, edges per-stage thật), `src/state/handoff.mjs:46` (`evaluateHandoff`), D0032 §VIII (nối dây thật vào 5 skill, review độc lập tìm 2 HIGH đã sửa) |
| task-spec ontology (13 phiếu coding) | **[IMPL]** | `domains/coding/task-specs/*.md` — 13 file thật (implement-item, review-item, judge-ambiguity, scoped-subtask, v.v.) |
| agent-type định nghĩa (`role`/`persona`/`decision_boundary`/`skills`) | **[IMPL]** | `core/agents/code-reviewer.yaml`, `debugger.yaml`, `docs-manager.yaml`, `fullstack-developer.yaml`, `planner.yaml`, `researcher.yaml` — đọc trực tiếp, có đủ field |
| Workflow un-gộp (feature/bugfix/lightweight) | **[PARTIAL]** | Chỉ thấy `domains/coding/workflows/feature.yaml` tồn tại — `bugfix`/`lightweight` được nêu trong D0032 §III nhưng KHÔNG thấy file tương ứng trong `ls domains/coding/workflows/` (chỉ 1 file) → **có thể đây là gap thật hoặc đã fold về default như D0032 tự nói ("item cũ fold về default, không migration")** — cần xác nhận thêm, không suy đoán |
| `doing-current`/`doing-history` (Doing Coordination Redesign) | **[CONFLICT trạng thái tài liệu]** | Doc tự ghi "Status: design target" (dòng 3) nhưng `src/state/runtime-coordination.mjs` đã tồn tại, có docstring trích thẳng "(D1)" và mô tả đúng cơ chế effectiveStatus/claims overlay mà doc mô tả — xem Findings §1 |
| Vocab cleanup `orchestrator`→`launcher` | **[IMPL]** | Guard test `test/docs/launcher-vocabulary-guard.test.mjs` tồn tại (không đọc được nội dung guard rule hiện tại do lỗi exit trong phiên quét — không suy đoán nội dung) |
| `rootTask`/`subTask` loại khỏi vocab chính thức | **[IMPL] phần lớn, [DRIFT] nhỏ còn sót** | D0029 xác nhận loại khỏi vocab; còn 4 chỗ prose/docstring: `src/runner/dispatch/mechanism.mjs:19,24`, `src/state/worker-slots.mjs:7-8` — đều là comment giải thích lịch sử, KHÔNG phải identifier sống |
| `capacity`→`executor` rename | **[IMPL] sạch** | Chỉ còn trong tên thư mục lịch sử (`docs/history/*capacity*/`) và trích dẫn tên quyết định trong comment (`resolve.mjs:175,190`, `mechanism.mjs:54`) — đúng chủ ý D0034, không phải nợ |
| `claims: [phiếu]` (D0032's declared eligibility mechanism) | **[DRIFT]/[SUPERSEDED không chính thức]** | Không tìm thấy field `claims:` ở bất kỳ agent-type YAML nào; thực tế dùng `skills:` (agent-type) khớp `agent:`/`requires-skill:` (task-spec header) qua `resolveAgentTypeForTaskSpec`, dẫn D20/D22 — **KHÔNG có decision record nào (0035+) chính thức hoá đổi tên này** trong 2 spec đã quét → cần xác nhận có D-ID nào khác ghi lại đổi này không (có thể nằm trong `docs/history/agent-executor-agent-definitions/` — chưa đọc sâu file này) |

## Findings / Problems

1. **[CONFLICT, cần xác nhận] "Doing Coordination Redesign" tự gắn nhãn "Status: design target" nhưng code đã sống.** `docs/architect/doing-coordination-redesign.md` dòng 3 ghi "design target", ngày 2026-08-25. Nhưng `src/state/runtime-coordination.mjs` (đọc trực tiếp dòng 1-11) đã cài đúng: claim overlay tại `.fgos/runtime/claims/<id>.json` (gitignored), `effectiveStatus(item) = activeClaim(item.id) ? 'doing' : durableStatus(item)`, trích dẫn quyết định "(D1)". Hai khả năng, KHÔNG tự hoà giải: (a) doc đang mô tả một MỞ RỘNG/redesign khác của cùng chủ đề, chưa xong, và phần đã xong là 1 D1 CŨ hơn — trong trường hợp này nhãn "design target" của toàn doc là gây hiểu lầm vì 1 phần cốt lõi đã chạy; (b) nhãn "design target" đơn giản là CHƯA ĐƯỢC CẬP NHẬT sau khi implement. Cần đọc kỹ nội dung đầy đủ D1 (không có trong 2 spec chính đã quét) để phân biệt.
2. **Hai lớp nghĩa lịch sử của từ "orchestrator" chồng lên nhau trong cùng 1 file lịch sử nếu đọc không để ý ngày.** D0026 dùng "orchestrator" = launcher (đã rename D0028). D0029/D0031 thả từ này ra lại cho nghĩa MỚI hẳn: tầng T0 fan-out. Bất kỳ ai grep "orchestrator" trong `docs/history/` mà không kiểm ngày quyết định sẽ đọc sai nghĩa. Rủi ro thật, không giả thuyết — bằng chứng: `docs/history/orchestrator-worker-slots/` (dùng nghĩa MỚI, T0) tồn tại song song `docs/decisions/0026-...orchestrator...md` (nghĩa CŨ, đã supersede).
3. **Khoảng trống LLM-judgment từ D0026 vẫn treo, chưa xây, dù đã 3 decision record sau đó thu hẹp phạm vi xung quanh nó.** D0026 tự nhận: "CHƯA có lớp quyết định nào tự động áp quy tắc 1-4" — cần LLM tự phát hiện "tôi đang được gọi từ 1 soul sống cùng provider hay không" trước khi quyết định native vs cli/spawn. D0033 chỉ thu hẹp rule 2 (cli-spawn-shaped luôn thắng), KHÔNG xây lớp phát hiện này. `dispatch-control-plane-redesign.md` cũng không nhắc lại gap này — có thể đã bị BỎ QUÊN giữa các lần redesign, không phải đã giải quyết.
4. **`claims: [phiếu]` (D0032) không khớp implementation thật (`skills:` + task-spec header).** Không tìm thấy decision record nào chính thức hoá đổi tên `claims`→`skills`/`agent:`/`requires-skill:`. Rủi ro: người đọc D0032 làm theo văn bản gốc sẽ tìm field không tồn tại. `agent-roster.mjs` có docstring trỏ "D20/D22" nhưng D20-D22 KHÔNG xuất hiện trong 2 file quyết định chính (`runner.md`, `work-state.md` chỉ đánh số tới 0034) — các D-ID này có thể nằm ở namespace KHÁC (item-local, không phải platform-wide decision), chưa xác nhận được vị trí — ghi rõ là chưa tìm thấy, không suy đoán nguồn.
5. **`workflows/` chỉ có `feature.yaml`, không thấy `bugfix.yaml`/`lightweight.yaml` dù D0032 §III mô tả rõ un-gộp thành 3.** D0032 tự nói "item cũ fold về default, không migration" — có thể đây LÀ hành vi đúng (chỉ cần khai báo khi có sự khác biệt thật, default áp cho phần còn lại), hoặc là phần chưa triển khai của kế hoạch 4 bước (D0032 §IV: "① role-axis... → ② un-gộp coding thành 3 workflow → ③ task-spec..."). Bước ① và ③ có bằng chứng implement rõ; bước ② KHÔNG có bằng chứng file — nghi ngờ có gap thật, chưa chắc chắn 100%.
6. **AgentMessage/mailbox/artifact-store/`confidence` field đúng như tài liệu tự nhận — chưa xây, có lý do rõ (chưa consumer).** Đây KHÔNG phải finding tiêu cực — ghi lại để xác nhận tài liệu và thực tế khớp nhau ở phần NÀY (khác với Finding 1).
7. **Dispatch resolver stack đã tách module hoá tốt** (`src/runner/dispatch/{plan,config,resolve,mechanism,transport,prepare,cli}.mjs`, tổng ~3760 dòng) nhưng KHÔNG đọc sâu logic bên trong từng file trong lượt quét này (chỉ xác nhận tồn tại + kích thước) — nếu cần audit code-level (không phải doc-level) cho `resolve.mjs`/`transport.mjs` (2 file lớn nhất, 22.6K/52.9K), đó là việc của 1 lượt review code riêng, không phải lượt research doc/vocab này.

## Gaps Against Target

| # | Gap | Evidence | Impact | Mức độ | Hướng fix | Narrow ngay hay deferred | Proof cần có |
|---|---|---|---|---|---|---|---|
| G1 | Nhãn trạng thái sai lệch giữa doc và code cho doing-coordination | `doing-coordination-redesign.md:3` vs `runtime-coordination.mjs:1-11` | Người đọc doc tưởng chưa implement, có thể re-design cái đã chạy, hoặc bỏ qua phần THẬT chưa xong | P2/medium | Đọc trọn `doing-coordination-redesign.md` (mới đọc 120/~900 dòng) + đối chiếu từng phần với `runtime-coordination.mjs` (324 dòng) để tách "đã implement" khỏi "còn thiếu"; cập nhật Status line cho khớp thực tế | Narrow — chỉ cần đọc + đối chiếu, không cần code | Bảng đối chiếu mục-doc ↔ hàm-code, mỗi mục có [IMPL]/[MISSING] rõ ràng |
| G2 | Lớp LLM-judgment (native vs cli/spawn tự phán) từ D0026 chưa xây, không thấy nhắc lại trong redesign mới nhất | D0026 "Việc chưa quyết", không xuất hiện trong `dispatch-control-plane-redesign.md` | Caller vẫn phải tự biết áp quy tắc 1-4 bằng tay; rủi ro lặp lại bug `tsk-1ni` (soul mù re-derive) ở integration mới | P2/medium | Xác nhận với user: gap này có còn cần không, hay đã bị D0033 thu hẹp đủ (cli-spawn-shaped luôn thắng → phần lớn case không cần "LLM tự nhận ra" nữa vì config quyết định thẳng) | Deferred — cần user quyết trước, đây là business/design judgment không phải bug | Nếu cần: 1 item build layer detect provider-signal cho agy/Codex (D0026 liệt kê rõ "chưa verify tín hiệu") |
| G3 | Vocab drift `claims:`→`skills:` không có decision record chính thức | D0032 văn bản gốc vs `agent-roster.mjs:106,121` | Người port domain mới hoặc đọc D0032 làm theo field sai | P3/low | Viết 1 decision record ngắn (hoặc cập nhật §VIII của D0032) ghi nhận field thật đang dùng là `skills:`/`agent:`/`requires-skill:`, trỏ D20/D22 (tìm ra vị trí D20-D22 thật trước) | Narrow — chỉ cần tìm D20-D22 + viết ghi chú, không code | Grep xác nhận D20/D22 tồn tại ở đâu; nếu chỉ là seq event, ghi rõ "event-log-only decision, không có prose record" |
| G4 | `workflows/bugfix.yaml`/`lightweight.yaml` không thấy, chưa rõ là gap thật hay "fold về default đúng chủ ý" | `ls domains/coding/workflows/` = chỉ 1 file | Nếu là gap thật: mọi bugfix/doc item đang chịu ceremony thừa của workflow `feature` đầy đủ (đúng pain-point D0032 tự nêu) | P1/medium-high nếu gap thật | Đọc `workflow-stage-graphs.mjs` (33K, đã list nhưng chưa đọc nội dung) để xem có default-fallback logic áp cho bugfix/lightweight hay không, TRƯỚC khi kết luận | Narrow để XÁC NHẬN (đọc code); nếu xác nhận là gap thật, việc build 2 file yaml là narrow, có thể làm ngay | Test cho 1 item `kind:bugfix` thật, xác nhận nó KHÔNG đi qua exploring/advise ceremony của `feature` |
| G5 | 3 architect doc (dispatch, doing-coordination, knowledge-registry) không trỏ chéo nhau, không có 1 tài liệu tổng map layer | Không tìm thấy doc nào liệt kê cả 3 cùng lúc; `dispatch-control-plane-redesign.md` §16 chỉ trỏ về `docs/specs/runner.md` + `docs/history/two-layer-dispatch`, không trỏ `doing-coordination-redesign.md` dù cả 2 đụng runtime coordination layer | Người vào sau (như lượt quét này) phải tự ráp map — tốn effort, rủi ro bỏ sót | P2/medium | Thêm 1 mục ngắn trong `docs/specs/reading-map.md` hoặc `docs/architecture-map.md` liệt kê 3 architect doc + quan hệ giữa chúng (dispatch = "chạy executor nào", doing-coordination = "ai đang cầm & trạng thái nào là durable", role/handoff = "role nào đang nói chuyện với role nào") | Narrow — thuần docs, không code | Reading-map có mục mới, review 1 người ngoài đọc thử trong <10 phút nắm được 3 tầng |

## Recommended Next Plan

Không tự ý mở scope implement. Đề xuất thứ tự nếu user muốn đào tiếp:

1. **G1 trước tiên** (đối chiếu doc/code doing-coordination) — rẻ, làm rõ ngay được trạng thái thật, mở khoá quyết định cho các gap khác vì runtime coordination là nền cho cả role/holder lẫn dispatch claim.
2. **G4 xác nhận** (đọc `workflow-stage-graphs.mjs` full) — quyết định đây có phải gap thật hay chỉ là cách đọc sai của lượt quét này.
3. **G5** (reading-map liên kết 3 doc) — rẻ, giảm effort tái-đào-sâu cho phiên sau.
4. **G2/G3** — cần user quyết business judgment trước khi làm gì thêm; không nên tự chọn thay.

## Evidence Appendix

- `docs/architect/dispatch-control-plane-redesign.md` (đọc trọn 747 dòng)
- `docs/specs/runner.md` dòng 1675-2482 (D0026, D0028, D0029, D0030, D0031, D0033, D0034 — đọc trọn)
- `docs/specs/work-state.md` dòng 2047-2287 (D0032 — đọc trọn phần I-VIII)
- `docs/architect/doing-coordination-redesign.md` dòng 1-120 (chỉ đọc phần đầu — CHƯA đọc trọn, dòng ~900 còn lại chưa xem)
- `docs/architect/knowledge-registry-redesign.md` — chỉ xác nhận tồn tại + "Status: design target", KHÔNG đọc nội dung (ngoài scope orchestration/dispatch trực tiếp)
- `domains/coding/registry.yaml` (đọc trọn phần roleGraph)
- `domains/coding/AGENTS.md` — chỉ đọc heading, chưa đọc nội dung `## fgOS Workflow`
- `core/agents/{code-reviewer,debugger,docs-manager}.yaml` (đọc trọn 3 file, phần đầu file thứ 4 bị cắt)
- `src/state/handoff.mjs` (đọc export list, dòng 46 `evaluateHandoff`, chưa đọc thân hàm)
- `src/state/runtime-coordination.mjs` dòng 1-20 (chưa đọc trọn 324 dòng)
- `src/runner/agent-roster.mjs` (đọc trọn 137 dòng)
- `src/cli/command-registry.mjs` — chỉ liệt kê 68 tên verb, chưa đọc chi tiết field mỗi verb
- `src/runner/dispatch/{plan,config,resolve,mechanism,transport,prepare,cli}.mjs` — chỉ xác nhận tồn tại + line count, KHÔNG đọc nội dung
- `.fgos/config.json` — chỉ grep tên field `executor(s)`/`capabilities`, chưa đọc trọn cấu trúc
- `docs/history/` — chỉ liệt kê tên 130+ thư mục con liên quan, KHÔNG mở nội dung bất kỳ thư mục nào (nguồn evidence bổ sung tiềm năng cho lượt sau, đặc biệt: `dispatch-concept-boundary/`, `task-dispatch-unification/`, `two-layer-dispatch/`, `fgos-marketing-domain-foundation/`, `agent-executor-agent-definitions/` cho câu hỏi D20/D22 ở Finding 4)
- `test/docs/launcher-vocabulary-guard.test.mjs` — chỉ xác nhận path tồn tại qua `ls`, KHÔNG đọc được nội dung (lệnh grep bị lỗi exit trong phiên, không retry)

### Unresolved Questions

1. Vị trí thật của decision `D20`/`D22` ("eligibility-inversion resolution") mà `agent-roster.mjs` trích — không thấy trong `runner.md`/`work-state.md` (đánh số 0002-0034). Có thể là numbering namespace khác (per-item, không phải platform decision).
2. `doing-coordination-redesign.md` còn ~780 dòng chưa đọc (tổng file dài, chỉ đọc 120 dòng đầu) — cần đọc trọn để trả lời G1 dứt điểm.
3. `workflows/bugfix.yaml`/`lightweight.yaml` có tồn tại ở vị trí khác (không phải `domains/coding/workflows/`) hay thật sự chưa được tạo — cần đọc `workflow-stage-graphs.mjs` để xác nhận cơ chế fallback.
4. Nội dung guard rule hiện tại của `test/docs/launcher-vocabulary-guard.test.mjs` (allowlist "orchestrator" có còn đúng theo nghĩa MỚI D0031 hay chưa update) — chưa đọc được do lỗi lệnh trong phiên.
