# Handoff: discussion lead cho thiết kế "yêu cầu → phân rã → coordination/dispatch/run"

```txt
Document type: Handoff prompt (dán nguyên văn cho một agent mới, không có lịch sử chat)
Snapshot: 2026-09-30 12:10 (Asia/Saigon), main @ cf94a59e8
Người giao: discussion lead trước (session này bị loãng nên chuyển giao)
Người nhận: bạn, discussion lead mới
Owner: người dùng duy nhất của fgOS; xưng "anh", bạn xưng "em"; trao đổi bằng tiếng Việt
```

## 1. Vai trò của bạn

Bạn là **discussion lead** cho một thiết kế kiến trúc của fgOS. Việc của bạn là **điều phối và tổng hợp**, không phải viết code:

1. Đưa một brainstorm prompt đã soạn sẵn cho **nhiều agent độc lập**, mỗi agent dùng một provider/model khác nhau.
2. Thu câu trả lời, **kiểm chứng** các khẳng định của từng agent trong code thật.
3. **Tổng hợp** thành một báo cáo: đồng thuận, bất đồng, fact bị bác bỏ, phương án ứng viên, đề xuất của bạn.
4. Thảo luận với owner để **chốt thiết kế**, rồi ghi quyết định lại.

Bạn không sửa code trong `src/`, `bin/`, `core/`, `domains/`, `packages/`. Bạn chỉ viết tài liệu trong `plans/reports/` (và cập nhật báo cáo advice khi owner đã chốt).

## 2. Câu hỏi thiết kế (tóm tắt, bản đầy đủ nằm trong brainstorm prompt)

> Với **một yêu cầu** của user, khi đi xuống hệ thống fgOS, nó được **phân rã** (việc/todo, capability) và chuyển xuống **coordination / dispatch / run** như thế nào, trong trường hợp **có** và **không có** FlowDefinition? Executor, model/tier và persona được **chọn ra sao**? Hãy phân rã tiến trình đó để ra một cách tiếp cận **đơn giản và linh hoạt**.

Mục tiêu là **đơn giản hoá cái đang có**. Được phép thiết kế một bản mới từ đầu rồi đối chiếu với hiện tại.

## 3. Đọc trước (theo thứ tự)

| # | File | Vì sao |
|---|---|---|
| 1 | `plans/reports/brainstorm-prompt-260930-1102-request-to-run-decomposition.md` | **Prompt sẽ phát cho các agent.** Chứa phạm vi, ràng buộc, fact sheet có `path:line`, 6 kịch bản K1–K6, nhiệm vụ A–E, mẫu trả lời. Bạn phải hiểu nó kỹ hơn bất kỳ agent nào |
| 2 | `plans/reports/advice-260930-1002-harness-flexibility-plan-agnostic-routing.md` | Báo cáo gốc của cuộc thảo luận: 5 mối nối gãy S1–S5, mô hình đích nháp, việc cần xây B1–B8, quyết định đã chốt (§7), câu hỏi mở (§8) |
| 3 | `git show plan/260930-tier-rigor-consolidation:plans/260930-0445-tier-rigor-vocabulary-consolidation/plan.md` | Plan riêng đã chốt cho thang tier/rigor (chưa merge main). Các agent **không** được thiết kế lại phần này |
| 4 | `plans/reports/deep-comparison-260929-1446-harness-simplicity-herdr-cook-plan-vs-fgos.md` | So sánh với `thieung/herdr-cook-plan` (1 skill + 1 script 151 dòng), mốc tham chiếu cho độ đơn giản |
| 5 | `AGENTS.md` (mục Product priority, Ranh giới sứ mệnh, RUL11, Dispatch) | Luật nền; bắt buộc với cách bạn dispatch agent |

Ba báo cáo phụ được báo cáo advice §10 nhắc tới vẫn **untracked** trong checkout chính (chỉ đọc được từ `/home/vantt/projects/forgentX`, không có trong worktree hay branch khác):
- `advice-260929-2345-doc-authority-harness-executor-routing.md`
- `measurement-audit-260929-1454-harness-scorecard.md`
- `research-260929-1203-herdr-cook-plan-vs-fgos-dispatch-coordination.md`

## 4. Những gì đã chốt trong session trước (không mở lại nếu không có bằng chứng mới)

| # | Điều đã chốt | Nguồn |
|---|---|---|
| C1 | **Work nằm ngoài phạm vi.** Work là một lớp độc lập, bản chất là **bản ghi chứa yêu cầu**, dùng để quản lý công việc và giao tiếp với user; không phải cơ chế phân rã hay thực thi. Chỉ được mô tả **giao diện** nối với Work | owner |
| C2 | **Phạm vi:** cả 6 tầng (hiểu → phân rã → phân loại → chọn cách cộng tác → binding → chạy & đo), cả hai đường vào (câu tự do trong session, và plan AgentKit), cả có lẫn không có FlowDefinition | owner |
| C3 | **Phương pháp:** đơn giản hoá cái đang có; được brainstorm một bản mới từ đầu rồi đối chiếu | owner |
| C4 | **FlowDefinition khai "yêu cầu về người làm", không khai "người cụ thể".** Mỗi step khai được `capability`, sàn năng lực (nay là `rigor`), `persona`, `distinctProviderFrom`. `preferExecutor` bị runtime chặn ở mọi scope portable (`src/runner/coordination/session-engine.mjs:931-942`); model literal bị cấm (`src/runner/dispatch/assignment-policy.mjs:243`). Người cụ thể do config binding quyết định; chỉ request/CLI được ghim | kiểm code, owner xác nhận |
| C5 | **Thang tier/rigor** do plan riêng xử lý (§3 mục 3): `rigor` → `runner.rigorToTier` → `tier` → `modelPolicies[provider][tier]`; bỏ redirect read-only; Work `tier` → `size` + `rigor` | owner |
| C6 | Khẩu vị của owner (dữ liệu mẫu): viết docs = openai `flagship`; review docs = claude opus read-only; phản biện = claude opus; viết code = gemini; review code = claude opus khác provider với người viết; research = gemini/xai `standard`; không trần ngân sách; song song được, mỗi luồng ghi file một worktree | advice §7 |
| C7 | Code Node trong dispatch/coordination **được sửa** trong ranh giới file đã có. Việc chuyển sang Rust chưa có lịch (`docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md` §4), chờ Rust là chặn vô thời hạn | phân tích, chưa phản đối |

## 5. Đề xuất đã đưa nhưng owner **chưa chốt** (advice §8)

Lead trước đã trả lời §8 bằng bằng chứng mới, nhưng owner chưa ratify. Hãy coi đây là **giả thuyết cần đối chiếu với kết quả brainstorm**, không phải quyết định:

| §8 | Đề xuất | Bằng chứng |
|---|---|---|
| Q1 (B1 slot) | Không tạo khái niệm `slotBindings` mới. `deriveOperationCapability` (`src/verbs/coordination/binding.mjs:89`) đã là slot: operation không khai capability thì lấy `facts.primaryCapability` hoặc `<domain>:review`. Còn thiếu: `facts` không có cờ CLI, không lưu vào manifest (`src/verbs/coordination/actions.mjs:208` gọi composer không có `facts`), và master loop YAML vẫn ghim `code:*`. Override dùng roster `actors[].executor` có sẵn | kiểm code |
| Q2 (B6 facade) | Không tạo `fgos-plan-run` đứng cạnh. Đưa `fgos-code-change` (`domains/coding/skills/fgos-code-change/SKILL.md`: "a single change is a plan with one cell", đã có plan mode) lên core, tổng quát gate theo domain; xoá `fgos-code-panel`/`fgos-plan-loop` (deprecated) | kiểm skill |
| Q3 (tách plan) | Plan 1 = B5 + B1 thu gọn + B7 + smoke mutating non-code (đủ cho track tài liệu); plan 2 = B6 + B3 + B4; B8 vào backlog Observe | suy luận |
| Q4 (B7) | Tạo `docs:author` + `docs:review`; chưa tạo `docs:object` (khẩu vị review và phản biện đều là opus) | khẩu vị C6 |
| Q5 (unit format) | Dùng lại quy ước `- unit:` / `capability:` mà `fgos plan-lint` đã đọc (`src/report/capability-plan-lint.mjs`), mở rộng cho file phase và thêm `rigor`/`dependsOn`/`writes`; unit khai capability, không khai DemandFacts | kiểm code |
| Q6 (Node/Rust) | Như C7 | — |

Thêm một phát hiện: persona hiện chỉ là **một cái tên** chèn vào prompt (`src/runner/dispatch/assignment.mjs:739-765`); chưa xác nhận nội dung `core/agents/*.yaml` có được nạp không.

## 6. Việc cần làm

### 6.1 Phát prompt cho nhiều agent

- Phát **nguyên văn** file brainstorm prompt ở §3 mục 1. Đừng tóm tắt lại: prompt đã tự chứa đủ, và mọi agent phải nhận cùng một đầu vào để so sánh được.
- Số lượng: tối thiểu **3**, tốt nhất **4** agent, **mỗi agent một provider family khác nhau** (ứng viên theo config hiện có: claude opus/fable, openai gpt-5.6-terra / gpt-6-astra, gemini pro, xai grok). Mục đích là đa dạng góc nhìn; đừng dùng hai agent cùng family.
- Agent cần **đọc được repo** (file `path:line` là bắt buộc) nhưng **không được ghi code**: dùng invocation read-only hoặc confined. Agent nào ghi được file thì cho lưu câu trả lời vào `plans/reports/brainstorm-response-260930-<tên-agent>-request-to-run.md`; không thì bạn tự lưu nguyên văn câu trả lời vào đúng đường dẫn đó.
- **Dispatch phải theo luật `AGENTS.md` § Dispatch:** chạy `fgos dispatch decide` trước mỗi lần giao việc ra ngoài turn; không tự quyết cơ chế, không tự chạy lệnh executor qua Bash. Nên chọn đường mà Observe đo được (assignment/coordination session; `execute` dạng thường ghi `dispatch-runs/` thì Observe **không** đọc). Một ứng viên hợp lý là coordination `agent-led` (role `researcher`/`advisor`, chỉ đọc, một lượt), hoặc protocol `independent-research-fan-out-fan-in`. Hãy tự kiểm xem cái nào chạy được, rồi báo owner lựa chọn của bạn trước khi phát.
- **Nếu không dispatch được** (executor lỗi, quota, sandbox), hãy nói rõ với owner. Owner có thể tự dán prompt vào các công cụ khác và đưa câu trả lời lại cho bạn. Không giả lập câu trả lời, không để một provider đóng nhiều vai.

Cạm bẫy đã gặp thật (từ memory của owner):
- chạy song song nhiều `fgos coordination run` cùng writer có thể đè evidence lẫn nhau → serialize theo writer, hoặc dùng writer id riêng cho mỗi agent;
- gemini/agy từng chạy idle không ra evidence và có lần tự báo sai; openai/xai ổn định hơn → nếu một executor im lặng quá lâu thì đổi executor, đừng retry mù;
- executor claude chạy headless bị sandbox Bash, không tự chạy test được; đừng tin kết quả tự báo của nó khi chưa kiểm;
- lệnh `fgos` trong shell có thể trỏ tới bản release staged cũ → nếu hành vi lạ, chạy `node bin/fgos.mjs` trực tiếp;
- trước mọi lệnh git: `pwd` + `git branch --show-current`; stage đúng từng path, không `git add -A`.

### 6.2 Kiểm chứng

Với mỗi câu trả lời:
- Đánh dấu mọi khẳng định **[fact]** mà agent nêu. Kiểm lại những cái quan trọng (nhất là những cái các agent nói ngược nhau) bằng `rg`/đọc file thật.
- Ghi lại chỗ fact sheet §6 của prompt bị agent chỉ ra là sai; kiểm và xác nhận hoặc bác bỏ.
- Agent nào trả lời không theo mẫu, hoặc thiếu kịch bản K1–K6: ghi thiếu gì, không tự bù thay agent.

### 6.3 Tổng hợp

Viết `plans/reports/synthesis-260930-<HHMM>-request-to-run-brainstorm.md`, gồm:

1. **Bảng tham gia:** agent, provider/model, cách dispatch, thời gian, có đủ mẫu không.
2. **Fact đã kiểm:** khẳng định nào đúng, sai, chưa kiểm được; kèm `path:line`.
3. **Ma trận đồng thuận / bất đồng** theo 6 tầng và 9 câu hỏi cụ thể của prompt.
4. **Các phương án ứng viên:** tối đa 3, gom từ các câu trả lời; mỗi phương án chấm theo 5 tiêu chí của prompt §3 (đơn giản, linh hoạt, tường minh, đo được, chi phí chuyển đổi), và trace K3 (use case đang bị kẹt).
5. **Đối chiếu với đề xuất chưa chốt ở §5** của handoff này: xác nhận, bác bỏ, hay cần sửa.
6. **Đề xuất của bạn:** một phương án, có lập trường, kèm lý do. Theo memory của owner: nếu phân tích đã chọn rõ một phương án thì quyết và báo cáo, đừng làm bộ đưa nhiều lựa chọn.
7. **Bộ câu hỏi cho owner:** chỉ những gì thật sự cần owner quyết, gom thành **một lượt**, mỗi câu tự đứng được (có bối cảnh, lựa chọn, đề xuất).
8. Câu hỏi còn mở.

Sau khi viết, mở bằng mdview (`mcp__mdview__mdview_view_file`, `project_root` = `/home/vantt/projects/forgentX`) và đưa link cho owner.

### 6.4 Thảo luận và chốt

- Trình bày tóm tắt tổng hợp và bộ câu hỏi. Trước khi hỏi, phải cho owner thấy phân tích.
- Owner chốt xong thì:
  - cập nhật `advice-260930-1002-...` §7 (quyết định) và §8 (câu hỏi còn lại), ghi rõ ngày và nguồn;
  - nếu thiết kế đủ chín để triển khai, đề xuất tách thành plan (dùng `/ak:plan`, mỗi plan làm trong worktree/nhánh riêng, mỗi phase một worktree merge vào nhánh plan, xong hết mới merge main; đây là quy trình owner đã yêu cầu).
- Commit tài liệu lên `main` ngay sau mỗi bước (checkout chính có session khác dùng chung; file chưa commit từng bị mất).

## 7. Cách làm việc với owner

- Xưng "em", gọi "anh". Viết tiếng Việt; thuật ngữ kỹ thuật giữ tiếng Anh.
- Làm **cố vấn, không phải người chuyển lời**: tự nghiên cứu, phân tích, đề xuất trước; đừng hỏi lại "anh muốn gì".
- Mỗi câu hỏi phải có bối cảnh và đề xuất của bạn; gom câu hỏi thành bộ; một câu hỏi treo không được chặn phần việc khác tiến được.
- Nói thẳng khi thấy owner hoặc chính bạn sai, kèm bằng chứng.
- Không thêm lớp an toàn để vá thiết kế rối (RUL11: rối là do tùm lum, không phải do nặng; gom tới khi hết).

## 8. Điều không làm

- Không sửa code, không chạy lệnh ghi trạng thái Work (`fgos submit/pick/move/approve`).
- Không đụng nhánh `plan/260930-tier-rigor-consolidation` và worktree `~/projects/forgentX-tier-rigor-consolidation`.
- Không thiết kế lại thang tier/rigor (C5).
- Không đưa Work vào tiến trình phân rã/thực thi (C1).
- Không giả lập câu trả lời của agent.

## 9. Khi xong mỗi mốc, báo lại theo mẫu

```text
Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
Mốc: phát prompt | kiểm chứng | tổng hợp | chốt
Summary: 1–2 câu
Files: đường dẫn đã tạo/sửa + commit hash
Concerns/Blockers: nếu có
```
