# Tổng hợp brainstorm: yêu cầu → phân rã → coordination/dispatch/run

```txt
Document type: Synthesis report (discussion lead)
Snapshot: 2026-09-30 16:20 (Asia/Saigon), main @ 5aed82c52
Prompt: plans/reports/brainstorm-prompt-260930-1102-request-to-run-decomposition.md
Handoff: plans/reports/handoff-260930-1210-harness-routing-discussion-lead.md
Status: v2.3 — Q0 chốt: mô hình gọn; tách hai tầng: 3 Pattern cộng tác (+ preset) vs Workflow nhiều bước; luật phân biệt; Q8 chốt (giữ mọi dạng thảo luận; bỏ engine chỉ khi chúng chạy tốt trên mô hình gọn); Q9 chốt (supersede ADR-006 §6); (architecture advisor là ca nghiệm thu thu hồi engine); §4b chấm lại theo §0 (lead + kongming độc lập: gọn 3,9–4,0 > P-A 3,2–3,3 > P-B loại); bake-off sửa; F26–F30; §0 kết quả mong muốn + tiêu chí mới (G1–G6, 8 tiêu chí); Q0 engine vs mô hình gọn (bake-off trước); mức 4 override làm rõ; hình chạy tổng thể + plan vs Workflow + (b) quyền sở hữu plan.md đã chốt; Workflow tách khỏi Work đã chốt; bảng thuật ngữ đã chốt ở §6 D0; 3 câu trả lời (2 family: claude, openai). Chưa có gemini/xai; cập nhật tiếp nếu owner gửi thêm.
Lịch sử: v0 12:29 (sonnet + openai bản 12:20) → v1 16:20 (thêm fable; openai bản sửa 12:39)
```

## 0. Kết quả mong muốn và tiêu chí chấm (đề xuất lại, owner đồng ý 2026-09-30 23:15)

Thay cho §3 của prompt gốc. Lý do đổi: (1) kết quả gốc chỉ nói "chọn đúng người" (tầng binding) trong khi chỗ đau thật là phần chạy quá nặng và không tới xong (§6.6 prompt; F13; Q0); (2) ưu tiên sản phẩm #1 Ship Faster và #2 Release con người không có tiêu chí nào; (3) "đơn giản" chỉ đo bề mặt, không đo máy móc bên dưới; (4) điều kiện đạt/không đạt bị trộn với tiêu chí so sánh; (5) bản gốc ngầm giả định luôn có Lead.

### 0.1 Kết quả mong muốn

Anh, hoặc một project/business workflow dùng fgOS, đưa vào **một yêu cầu** ở bất kỳ dạng nào (câu tự do, plan bất kỳ, hay lệnh chạy một Workflow của domain) thì:

1. **Đi tới kết quả đã kiểm chứng nhanh**, chi phí điều phối nhỏ so với chính công việc, không nghi lễ.
2. **Tự chạy tới xong**: chỉ dừng hỏi người ở cổng thật sự cần; câu hỏi gom thành bộ; phần việc không phụ thuộc vẫn chạy; chạy được cả khi không có người/Lead (headless).
3. **Đúng người làm, review thật sự độc lập**: mỗi phần việc do đúng người theo khẩu vị cấu hình **một lần**, đổi cho một lần chạy bằng **một câu nói**; review khác provider, finding được xử lý chứ không đóng dấu.
4. **Mỗi lần chạy kết thúc rõ ràng, có bằng chứng** (xong / chờ người / lỗi có lý do); không lần chạy nào treo hay vô hình.
5. **Người/agent lạ đọc được**: vì sao người này làm, việc đang ở đâu, bước tiếp là gì.

Người yêu cầu **không viết gì ngoài nội dung việc**: không định nghĩa quy trình riêng, không file request, không ghim hạ tầng. Đúng cho **mọi domain**, không chỉ code.

Ngoài phạm vi: thiết kế lại thang tier/rigor (plan riêng); nội bộ lớp Work (chỉ giao diện); tính năng Pattern cộng tác chưa có người dùng thật (panel ẩn danh, delphi…).

### 0.2 Điều kiện bắt buộc (đạt/không đạt — không đạt thì loại phương án)

| # | Điều kiện | Nguồn |
|---|---|---|
| G1 | Mọi lần chạy (inline, subagent, process ngoài) nằm trong một Observe case và có RunResult | Observe trước (advice §2) |
| G2 | Plan, Workflow, Pattern cộng tác không ghim executor/provider/model/tier | C4, plan-lint |
| G3 | Một đường cho mỗi năng lực: cái mới thay cái cũ thì xoá trong cùng bước, không alias | single path |
| G4a | Chạy được headless (không người, không Lead) | D-ADR0035 |
| G4b | Chạy được một Workflow domain không phải code có cổng người (vd marketing) — kiểm trong plan tách Workflow; docs chỉ đủ cho bake-off | D-ADR0035; kongming §7.7 |
| G5 | Không làm yếu ràng buộc độc lập (khác provider) hay governance | §6.6, C4 |
| G6 | **Không bao giờ đổi người làm lặng lẽ**: mọi lệch khỏi khẩu vị/override (hết quota, governance, không còn candidate khác provider) có lý do trong provenance; không có người thay hợp lệ thì dừng và báo, không tự hạ | owner 23:16; bài học `readOnlyRedirects` (F3) |

### 0.3 Tiêu chí so sánh (theo thứ tự ưu tiên; mỗi tiêu chí có chỉ số đo trong bake-off)

| # | Tiêu chí | Câu hỏi | Chỉ số | Mốc so sánh |
|---|---|---|---|---|
| 1 | **Nhanh, nhẹ** (Ship Faster) | Điều phối tốn bao nhiêu so với công việc? | **Lead-active**: số lệnh + số quyết định Lead / unit, thời gian Lead chờ giữa hai lệnh; số vòng × phút fixer; số run phụ. **Không dùng wall time** (wall ≈ worker: 140 vs 137 phút — kongming E1) | **cả phase tài liệu cũ: 6 session, 25 run, ~6 h session-time, không session nào đóng**; một session: 10 run / 3 vòng / 137 phút worker / ~12 lệnh Lead; một cell hôm nay ~8 lệnh `fgos coordination` |
| 2 | **Ít phải canh** (Release con người) | Người phải xen vào bao nhiêu lần? | số lần can thiệp / yêu cầu; câu hỏi có gom; cổng người có chặn việc độc lập | K3 hôm nay: Lead dẫn tay từng bước |
| 3 | **Đúng người** | Mỗi vai có do đúng executor/tier/persona anh muốn? | tỉ lệ khớp khẩu vị (assignment thực chạy đúng khẩu vị hoặc override / tổng); số lệch có lý do; số lệch không lý do (đích 0) | hôm nay: `code:review` → openai, redirect opus → openai, persona `code-reviewer` cho mọi reviewer |
| 4 | **Chất lượng và kết thúc** (DoD) | Review có thật? Lần chạy có tới xong? | tỉ lệ finding được chấp nhận; số lần reviewer cho qua < 3 phút với 0 finding; tỉ lệ run tới trạng thái cuối; resume được sau crash | 0/6 session đóng; 512/606 kẹt `active` |
| 5 | **Đơn giản — bề mặt và máy móc** | Phải hiểu bao nhiêu? Bên dưới bao nhiêu bộ phận chuyển động? | số khái niệm phải hiểu; số nơi chứa khẩu vị (đích 1); số state machine + dòng code trên đường chạy | herdr-cook-plan: 1 skill + 151 dòng |
| 6 | **Linh hoạt** | Thêm domain/Workflow, đổi khẩu vị, override có phải viết code? | số việc cần sửa code (đích 0); cùng plan chạy ở project khác với khẩu vị khác | — |
| 7 | **Minh bạch** | Trả lời được "vì sao người này", "đang ở đâu, bước tiếp là gì"? | mọi binding có chuỗi provenance; trạng thái + bước tiếp đọc bằng một lệnh | câu hỏi L5 cho người lạ |
| 8 | **Chuyển đổi** | Làm theo bước nhỏ? Xoá được bao nhiêu? | mỗi bước tự chạy được; tỉ lệ dòng xoá / dòng thêm (xoá nhiều là điểm cộng) | — |

"Đúng người" xếp trước "Chất lượng" vì nó là điều kiện để review thật (đúng opus, khác provider) và là ý định gốc của cuộc thảo luận. "Đo được" của bản gốc thành G1; "Tường minh" gộp vào "Minh bạch".

Hệ quả: §4 (chấm P-A/P-Y/P-B theo 5 tiêu chí cũ) và đánh giá lại trong Q0 cần **chấm lại theo bộ này** — việc tiếp theo.

## 1. Bảng tham gia

| Agent | Provider/model | Cách chạy | File | Đủ mẫu? | Chất lượng kiểm fact |
|---|---|---|---|---|---|
| claude-sonnet | claude / sonnet-5.5 | owner tự chạy; có `dispatch-runs/claude/1790745191212` (`execute` thường, Observe không đọc, run.json kẹt `running`) | 12:15 | Đủ heading; trace K3/K5 ngắn | Thấp: tự khai "Bash bị chặn giữa chừng", nhiều mục [fact-sheet] |
| openai-gpt-5.6-sol | openai / gpt-5.6-sol (ngoài `modelPolicies`, chạy ngoài fgOS) | owner tự chạy; **sửa lại 12:39** | 12:20 → 12:39 | Đủ | Tốt; nhưng bản 12:39 dựa vào `AssignmentPlan` **không tồn tại** (F25) |
| claude-fable | claude / fable-5.1 (Claude Code, chỉ đọc) | owner tự chạy | 12:32 | Đủ | **Cao nhất**: 11 chỗ sửa fact sheet, đa số đã kiểm là đúng; có số liệu store thật |
| _(chưa có)_ | gemini, xai | — | — | — | — |

Lead không dispatch lượt nào (owner chọn tự chạy). Hai family claude chiếm 2/3 → độ đa dạng góc nhìn còn thiếu; xem §8.

## 2. Fact đã kiểm

| # | Khẳng định | Ai nêu | Kết quả | Bằng chứng |
|---|---|---|---|---|
| F1 | `src/runner/dispatch/**` ~59k dòng | fact sheet §6.1 | **Sai**: 32.047 (59–60k là cả `src/runner/**`). coordination 20.692, definitions 2.009 | `wc -l` (openai, fable đúng) |
| F2 | Master loop ghim `code:implement/review`; `distinctProviderFrom.strength: preferred` | sonnet | Đúng | `standalone-master-coordination-loop.yaml:109,125-128,137-140` |
| F3 | Config route `code:review` → openai; `execute` → claude; `review` không `prefer`. Khẩu vị "review code = opus" chưa hề có trong config | openai, fable | Đúng. Thêm `readOnlyRedirects` claude→openai (`assignment-runner.mjs:1428-1433`): opus review bị chặn **hai** tầng | `.fgos/config.json` `runner.capabilities`, `placementPolicy` |
| F4 | Persona chỉ là tên chèn prompt; `core/agents/*.yaml` chỉ cho roster `{name, skills}` | openai, fable | Đúng — đóng câu hỏi mở của handoff §5 | `assignment.mjs:713-765`; `agent-roster.mjs:1-52` |
| F5 | Mọi role `reviewer` mặc định persona `code-reviewer` (cả khi review docs) | fable | Đúng | `assignment-policy.mjs:388-391` |
| F6 | `work-product` thiếu `facts.primaryCapability` → `unbound` | sonnet | Đúng | `binding.mjs:94-99` |
| F7 | **`facts` không có producer nào**: `coordination start` không nhận/truyền; nhánh `facade-primary` là code chết; `domain` không bao giờ tới → luôn rơi về `review` | fable | Đúng (mạnh hơn fact sheet và đề xuất Q1 cũ) | `bin/fgos.mjs` khối start chỉ truyền `actors`; `start.mjs:55-66`; `actions.mjs:196-220` |
| F8 | Roster `--actors` ở `start` không theo sang bước sau; `--executor` bước sau tắt mọi computed binding của bước đó | fable | Đúng | `composers.mjs:52-54,434` |
| F9 | **DAG mode chỉ nhận bước read-only** → 15 area ghi file = 15 session mở tay | fable | Đúng | `dag-request-compiler.mjs:65` |
| F10 | `distinctProviderFrom` bỏ qua vai chưa bind (phụ thuộc thứ tự) | openai | Đúng | `binding.mjs:112-133` |
| F11 | Observe không đọc `.fgos/dispatch-runs/`; có đọc `.fgos/assignments` và transcript claude | cả ba | Đúng | `run-result/rust/src/lib.rs:330-337`; `observe/rust/src/sources/claude_transcripts.rs` |
| F12 | `metrics harness` đếm protocol sai: đọc `core/protocols/*.json` (không tồn tại) và `session.json.protocol.id` (field thật là `definitionRef.id`) → luôn 0 | fable | Đúng | `observe/rust/src/metrics_cli/harness.rs:226-250`; `ls core/protocols` lỗi |
| F13 | Store session: 602 session có `session.json` (606 thư mục), **512 `active`**, 27 `completed`, 57 `partial`; ~115 là test rò (`test.*`, `some-def`); 152 agent-led; delphi/nominal/rfc/group-cognition dùng **0** lần | fable (602) | Đúng (số hôm nay 606) | đếm `session.json` trong `.fgos/coordination/sessions` |
| F14 | `executors.xai.for` chứa `review`, `code:review` → `decide --for review` có thể ra xai, trái doc catalog | fable [suy luận] | Config đúng; hành vi `decide` chưa chạy thử | `.fgos/config.json` `runner.executors.*.for` |
| F15 | Nơi chứa khẩu vị bị sót trong fact sheet: `model_tier` của `core/agents/*.yaml` → `scripts/project-agents.mjs` `DEFAULT_MODELS {light,standard,heavy}` (comment "matches runner.models", thứ plan tier sẽ xoá); `feature.yaml` `preferExecutor: claude` | fable | Đúng | `scripts/project-agents.mjs:47-53`; `domains/coding/workflows/feature.yaml:65` |
| F16 | `fallbackExecutors`: doc/comment "reserved-not-executed" nhưng runtime có Provider Capacity Rotator | openai | Đúng là drift (doc cũ) | `assignment-policy.mjs:404-410` vs `assignment-runner.mjs:1069,1768` |
| F17 | K3 (phase 6) chưa authorize, bị chặn phase 4–5; phase file chưa liệt kê area | openai | Đúng | nhánh `plan/260925-documentation-authority-unification` `plan.md:254,271-273` |
| F18 | Mặc định `code:implement` sót | fact sheet | Đúng, nhưng chỉ trong `buildConfinementRequest` (chọn confinement) | `assignment-runner.mjs:2378` |
| F19 | `steps[].capabilities` là field contract, không phải khoá routing | openai | Đúng | `session-engine.mjs:278-290` |
| F20 | Chặn `preferExecutor` ở scope portable | fact sheet | Đúng | `session-engine.mjs:925-942` |
| **F25** | "Mở rộng `AssignmentPlan` hiện có" làm canonical graph | openai (bản 12:39) | **Sai: không có symbol/khái niệm `AssignmentPlan`** trong `src/`, `packages/`, `docs/`. Gần nhất là `compileDispatchPlan` — plan dispatch của **một** assignment, không phải đồ thị | `rg AssignmentPlan` rỗng; `assignment-runner.mjs:1376` |
| F26 | Mutating qua `executeAssignment` **bắt buộc** protocol-operation stamp trỏ tới operation `work-product` của một CoordinationProtocol thật, rồi mới kiểm posture worktree; stamp tự nhận forgeable nên posture mới là cổng thật. Mô hình gọn (và D4 bỏ stamp) phải thay cổng này bằng posture + `bind()` và **supersede ADR-006 §6 tường minh** | lead + kongming | Đúng | `assignment-runner.mjs:521-560`; `execution-contract.mjs:11-33,139-160,317-326` |
| F27 | `assignment.json.provenance` **không ghi chuỗi binding** (vì sao executor này) → nguyên nhân rubber-stamp §6.6 (`strength: preferred` hay `--executor` tay) không truy được từ store; tiêu chí Minh bạch hôm nay ≈ 1. Hệ quả đo được: reviewer gemini = doer, 2,7 phút `done` / 3,0 phút `no-evidence`; red-team xai **6/6** `failed` dù finding được accept | kongming E3 | Đúng (provenance chỉ có `kind`, `contractPolicyVersion`, …) | `.fgos/assignments/asgn_pi_lead_phase01_op_002/assignment.json` |
| F28 | `rigorToTier` **chưa tồn tại** trên main (0 lượt trong `src/`); plan tier chưa merge → bake-off dùng `minTier` hôm nay | kongming E6 | Đúng | `rg rigorToTier src` rỗng |
| F29 | `executeAssignment` có 4 caller (`cli.mjs` execute --assignment / --contract, `operation-choice.mjs` Work loop, `session-engine.mjs:403`) → "một cửa" đã đúng ở tầng assignment; engine chỉ là một trong bốn người gọi | kongming E5 | [fact kongming, lead chưa kiểm từng dòng] | grep `executeAssignment(` |
| F30 | Mốc §6.6 "~150 phút / 3 vòng / ~10 run" chỉ là **1/6 session** của phase; cả phase = 6 session, 25 run, ~6 h | kongming E1–E2 | Đúng (6 session, 25 assignment `phase01`) | `.fgos/coordination/sessions/documentation-authority-unification--phase-01*`; `.fgos/assignments/*phase01*` |

Chưa kiểm: `strength: preferred` có đúng là nguyên nhân rubber-stamp §6.6 (cần log session).

## 3. Ma trận đồng thuận / bất đồng

### 3.1 Theo tầng

| Tầng | Đồng thuận (3/3) | Bất đồng |
|---|---|---|
| 1 Hiểu | Agent phán đoán | — |
| 2 Phân rã | Agent phân rã, máy lint (id, chu trình, `writes` giao nhau, không ghim hạ tầng); plan và yêu cầu tự do sinh **cùng một dạng Unit** | — |
| 3 Phân loại | Không để 8 DemandFacts là field runtime thứ hai; `rigor` là yêu cầu của unit | **D1** khai gì: `capability` trực tiếp (openai, fable `domain:verb` có fallback `verb`) ↔ facts `kind/domain/mutates` (sonnet) |
| 4 Cộng tác | Ba mẫu là đủ; red-team/objector là một vai trong mẫu review, không phải mẫu riêng; FlowDefinition không có đường riêng | **D0 điểm hội tụ**: Unit (fable) ↔ step list có vai (sonnet) ↔ canonical graph trước binding (openai). **D2** ai chọn mẫu: rule trong config (fable) ↔ máy theo `applies` trong mẫu (sonnet) ↔ agent (openai) |
| 5 Binding | Một binder tất định + provenance; khẩu vị chỉ trong config; FlowDefinition không chứa executor/model/tier; không tạo `docs:*` trong catalog chỉ để routing; persona chỉ ảnh hưởng prompt và cần nội dung thật | **D5** override vs ràng buộc độc lập. **D6** persona: khẩu vị thuần (sonnet) ↔ vai khai là yêu cầu + config khai khẩu vị (openai, fable). **D9** tier theo capability (fable, xem §7 Q1) |
| 6 Chạy & đo | Một cửa chạy Observe đọc được; xoá `dispatch-runs`; ghi file phải trong worktree | **D4/D8** solo & inline: mọi việc (cả inline) thành Assignment + RunResult qua `executeAssignment` (openai, fable) ↔ solo = session 1 node, inline để nguyên (sonnet) |

### 3.2 Chín câu hỏi của prompt

| # | sonnet | openai | fable | Kết |
|---|---|---|---|---|
| 1 Phân rã | agent + lint; cùng unit | như vậy | như vậy | ✅ |
| 2 capability vs facts | facts → máy suy | capability trực tiếp | capability `domain:verb`; facts→capability là ánh xạ 1-1 qua `serves` nên là bản sao | 2/3 trực tiếp |
| 3 Chọn mẫu | máy (`applies`) | agent | rule config, override có lý do | ❌ D2 |
| 4 FlowDefinition | step/role/rigor/distinct/human gate | graph/role/capability/rigor/gate | **unit list** + gate người; persona khi bước đòi | ≈ nội dung; khác về *bản chất* (D0) |
| 5 Thư viện mẫu | ~5 | 3 (`solo/review/fanout`) | 3 (`solo/reviewed/panel`) | 2/3 ba mẫu |
| 6 Persona | khẩu vị trên role | semantic trên step, mặc định config | vai khai = yêu cầu, `capabilities[cap].persona` = khẩu vị | 2/3 lai |
| 7 `docs:*` | không tách | không tách | key config tuỳ chọn có fallback, không vào catalog | ✅ (bác Q4 handoff) |
| 8 Solo ghi file | session 1 node | Assignment/Run door | mẫu `solo` qua cùng engine và `executeAssignment`; điều kiện ghi = "cwd là linked worktree", không cần protocol stamp | 2/3 cùng cửa assignment |
| 9 Xoá trước | pin `code:*`, redirect, portable `prefer*`… | `form`, `dispatch-runs`, `purpose`… | (a) 6 dòng pin master loop (b) `facts`/`agent-led` (c) `dispatch-runs` (d) `preferExecutor`+`executors.for`+default `claude` (e) DemandFacts+matcher+`form` | ✅ bổ sung nhau; fable xếp theo lợi/chi phí |

### 3.3 Đóng góp riêng đáng giữ

- **fable — hai nghĩa của "FlowDefinition"**: 13 protocol hiện có đều là *mẫu cộng tác trong một unit*; chưa có business flow nào. Business flow thật = danh sách unit khai sẵn + cổng người. Tách tên này làm sạch D0.
- **fable — cảnh báo E1**: chi phí §6.6 (~10 run, ~150 phút) đến từ vòng lặp và nghi lễ driver, không từ binding. Đề xuất **bake-off** 2 area: engine vs Lead + subagent.
- **fable — `mechanism` do `bind()` trả**, Lead là một candidate như mọi executor → thay phán đoán Q0 bằng quy tắc.
- **openai — K3 ledger**: mỗi cặp author/reviewer trả reviewed commit + digests + *ledger delta*; một writer áp tuần tự và chạy conservation sau **mỗi** commit.
- **openai — smoke 2 area song song**, kiểm cả findings→fix, pass, policy refusal, đóng session.
- **sonnet — `distinct` bắt buộc** cho review output ghi file; không thoả thì park (§6.6).

## 4. Phương án ứng viên

| | **P-A: Unit → mẫu → một binder → một cửa (gom 3 bản)** | **P-Y: Lead điều phối bằng prose + primitive `run --ask` (fable, đường lui)** | **P-B: Vá tối thiểu** |
|---|---|---|---|
| Ý chính | Unit chung; 3 mẫu chạy bằng engine coordination hiện có; `bind()` một chỗ ở cửa chạy; mọi Ask = Assignment + RunResult | Mẫu chạy bằng Lead (như herdr-cook-plan); engine chỉ dùng cho Workflow | Chỉ bỏ pin master loop, persist capability, thêm khẩu vị docs |
| Đơn giản | 4 (6 danh từ: Unit, Pattern cộng tác, Workflow, Ask, Taste, Run) | 3 (ad-hoc gọn, nhưng hai sequencer) | 2 (vẫn ~10 nơi quyết executor, F-bảng fable) |
| Linh hoạt | 5 | 4 | 3 |
| Tường minh | 5 (`bind --explain`) | 5 | 2 |
| Đo được | 4–5 (cần RunResult inline) | 3 (Observe phải học cách nhóm mới) | 3 |
| Chuyển đổi | 3–4, theo bước | 2 | 5 |
| Trace K3 | 15 unit `docs:write` rigor high + 1 unit ledger `dependsOn` cả 15; `reviewed`; author openai flagship, reviewer claude opus readonly khác provider; mỗi area một worktree trả ledger delta | Lead mở 15 subagent/`run --ask` theo prose | Mở tay 15 session `start --capability docs:write --cwd <wt>` |

P-B **là bước 1 của P-A** (cả ba agent đồng ý). P-Y chỉ chọn nếu bake-off cho thấy nghi lễ engine vẫn quá đắt.

## 4b. Chấm lại theo §0 (2026-09-30 23:30) — lead + kongming độc lập

Hai bản chấm độc lập: lead (Opus 5.5) và kongming (claude-fable-5.1, chỉ đọc, không đọc bản của lead; báo cáo đầy đủ: [rescoring-260930-2320-kongming-request-to-run-options.md](rescoring-260930-2320-kongming-request-to-run-options.md)). Bảng §4 (5 tiêu chí cũ) giữ để đối chiếu, **không còn dùng để quyết**.

### Gate

| Gate | P-A (engine) | Mô hình gọn | P-B (vá) |
|---|---|---|---|
| G1 Observe + RunResult | đạt có ĐK (RunResult inline chưa có — chung mọi phương án; xoá `dispatch-runs`) | đạt có ĐK (như P-A + `unitId` trên assignment để Observe nhóm theo unit) | **không đạt** (giữ `dispatch-runs`) |
| G2 không ghim | đạt (sau bỏ 6 dòng `policy.capability` + `feature.yaml:65`) | đạt | đạt có ĐK (`preferExecutor`, `executors.for`, redirect còn) |
| G3 một đường | đạt có ĐK (request tự sinh là lớp **thêm**; phải cấm request tay, xoá `agent-led`, DemandFacts, `dispatch-runs`) | đạt có ĐK (**engine "đóng băng" = đường thứ hai cho panel** → cần tiêu chí thu hồi đếm được + mốc ngày; `loop.mjs` stage sequencer rút về Workflow run) | **không đạt** |
| G4a headless | đạt có ĐK (15 unit ghi file = 15 session vì DAG read-only, F9) | đạt có ĐK (**phải thay cổng stamp, F26**) | yếu |
| G5 độc lập | đạt (`required`) | đạt có ĐK (loop `reviewed` tự áp `independentOf`; supersede ADR-006 §6) | **không đạt** (`preferred`) |
| G6 không đổi lặng lẽ | đạt có ĐK (gom redirect + rotator vào `bind()`) | đạt có ĐK (dễ hơn: primitive là entry duy nhất) | **không đạt** (redirect + default `claude`) |

**P-B rớt G1, G3, G5, G6 → loại.**

### Tám tiêu chí (1–5)

| # | Tiêu chí | P-A lead / kongming | Gọn lead / kongming | P-B lead / kongming | Lý do chính (hợp nhất) |
|---|---|---|---|---|---|
| 1 | Nhanh, nhẹ | 2 / 3 | 4 / 4 | 1 / 2 | P-A: ~3–5 lệnh Lead/unit, disposition mỗi vòng; gọn: 1 lệnh/unit, Lead không đứng giữa các vòng. Tiết kiệm chủ yếu đến từ **pattern**, phần còn lại từ bỏ nghi lễ |
| 2 | Ít phải canh | 3 / 3 | 4 / 4 | 1 / 1 | disposition là driver action của engine (≥1 can thiệp/vòng finding); gọn: 0 can thiệp bình thường, 1 khi hết vòng hoặc không candidate |
| 3 | Đúng người | 5 / 4 | 5 / 4 | 2 / 2 | cùng `bind()`; kongming trừ 1 vì lối vòng `--executor` từng step/`actors[]` còn tới S3 — **lead nhận 4/4** |
| 4 | Chất lượng & kết thúc | 3 / 3 | 3 / 4 | 2 / 2 | P-A có replay/recovery thật nhưng tới trạng thái cuối thực đo 27/602 (close-quorum ≥5 lý do từ chối); gọn: terminal = hàm return, finding là outcome không phải failure, **resume sau crash phải tự xây** |
| 5 | Đơn giản (bề mặt + máy móc) | 2 / 2 | 4 / 4 | 1 / 1 | P-A ~12 khái niệm để hiểu một lần chạy, 20,7k dòng coordination trên đường chạy, request tự sinh **giấu** không bớt; gọn: ~5 khái niệm, code mới ~1,5–2k dòng |
| 6 | Linh hoạt | 5 / 4 | 3 / 4 | 2 / 2 | P-A: pattern mới = YAML nhưng schema 8 step kind khó tới mức chưa ai viết business flow; gọn: pattern mới = code nhưng 3 là đủ (D3) — **lead nhận 4/4** |
| 7 | Minh bạch | 4 / 4 | 5 / 4 | 2 / 2 | cùng `bind --explain`; P-A có sẵn `coordination status --detail`; gọn cần `fgos run status` mới — **lead nhận 4/4**. Hôm nay ≈ 1 (F27) |
| 8 | Chuyển đổi | 3 / 3 | 3 / 4 | 3 / 3 | gọn: bước 1 tự chạy, xoá/thêm ≈ 10:1 tiềm năng, trừ vì xoá dồn về cuối và 57 test gắn session-engine |

### Tổng có trọng số

| Trọng số | P-A | Mô hình gọn | P-B |
|---|---|---|---|
| lead: 1–4 ×2, 5–8 ×1 | 40/60 = **3,33** | 47/60 = **3,92** | 20/60 = 1,67 |
| kongming: 1–2 ×3, 3–4 ×2, 5 ×1,5, 6–8 ×1 | **3,17** | **4,00** | 1,97 |

Hai bản độc lập **cùng thứ hạng**, cách nhau ≤ 0,16 điểm. Độ nhạy (kongming): P-A có auto-driver → 3,38; gọn thua chất lượng ở bake-off (tiêu chí 4 xuống 2) → 3,72. **Thứ hạng chỉ đảo nếu mô hình gọn rớt gate**: G3 (không có tiêu chí thu hồi engine) hoặc G5 (cửa mutating mở không qua `bind()`).

Điểm chắc từ tĩnh (không cần bake-off): 5, 8, gate. Điểm phỏng đoán cần bake-off: 1, 2, 4.

### Sửa bake-off (theo kongming §5, lead đồng ý)

1. **Đo đúng biến.** Nhánh engine hôm nay = master loop có red-team bắt buộc + `preferred`; so với `reviewed` không objector + `required` thì chênh là **pattern**, không phải engine. Cách rẻ nhất: nhánh engine ghim roster `actors[]` để reviewer khác provider (giả lập `required`), và chạy nhánh gọn **hai lần** (có objector — đồng hình với red-team — và không objector).
2. **Chỉ số**: Lead-active (lệnh, quyết định, chờ) và số vòng × phút fixer; wall chỉ để đối chiếu (§0 tiêu chí 1 đã sửa).
3. **Thêm hai ca**: kill driver giữa vòng 2 rồi resume (tiêu chí 4); chỉ một provider có invocation read-only để ép G6 (phải dừng + báo, không tự hạ).
4. Dùng `minTier` hôm nay (F28), ghi rõ; không chờ plan tier.

### Lập trường sau chấm lại

**Mô hình gọn**, với ba điều kiện bắt buộc để qua gate: (a) thay cổng stamp của `executeAssignment` bằng posture + `bind()`, supersede ADR-006 §6 tường minh (F26); (b) **tiêu chí thu hồi engine đếm được + mốc ngày**, không "đóng băng chờ xem" (G3); (c) mọi RunResult ghi file có `provenance.binding` (doctor check) để cửa mutating không bị gọi vòng qua `bind()`.

Biến thể kongming đề xuất (§8 báo cáo của nó): xoá engine cùng track, `panel` = loop song song + tổng hợp. **Đã điều chỉnh 23:40 theo owner** (xem §7 Q8): "0 người dùng" là do harness chưa ổn định, không phải không có nhu cầu — architecture advisor là use case thật đầu tiên. Vì vậy tiêu chí thu hồi engine (G3) = **architecture advisor chạy được trên mô hình gọn với cùng bảo đảm**, không phải đếm lượt dùng.

## 5. Đối chiếu với đề xuất chưa chốt (handoff §5)

| §8 | Đề xuất cũ | Kết luận | Lý do |
|---|---|---|---|
| Q1 slot | Không `slotBindings`; `deriveOperationCapability` + persist `facts` | **Xác nhận hướng, sửa cơ chế**: bỏ `facts` (không có producer, F7); `coordination start --capability`, lưu manifest, mọi node đọc lại. Khoá = `domain:verb` fallback `verb` | F7, F8; cả ba bỏ `slotBindings` |
| Q2 facade | Đưa `fgos-code-change` lên core; xoá 2 skill deprecated | **Xác nhận** | 3/3 |
| Q3 tách plan | Plan 1 = B5+B1+B7+smoke | **Sửa**: bước 1 = S1 bốn việc (§6) + smoke 2 area + bake-off; B7 bỏ | F17: P6 chưa authorize |
| Q4 `docs:*` | Tạo `docs:author/review` trong catalog | **Bác một nửa**: không vào catalog với `serves`; chỉ là **key config** `docs:write`/`docs:review` có fallback | 3/3 không tách catalog; fable: tách = một dòng dữ liệu |
| Q5 unit format | Mở rộng `- unit:` của plan-lint sang phase file + `rigor/dependsOn/writes` | **Xác nhận**, field chốt: `id, objective, capability, rigor, writes, dependsOn, pattern?` (không có `overrides`: plan không ghim hạ tầng; override nằm trên lần chạy — xem mức 4) | 3/3 |
| Q6 Node/Rust | Sửa Node trong ranh giới file | **Xác nhận** | 3/3 |
| Persona chưa rõ | — | **Đóng**: chỉ là tên (F4, F5) | |

## 6. Đề xuất của lead

**Lập trường về engine đã đổi (2026-09-30 23:05) — xem mục Q0 ngay trước "Bước 1".** Lead ban đầu chọn P-A (gom vào engine coordination) theo đa số advisor; sau thảo luận với owner, lead nghiêng về **mô hình gọn** và để bake-off quyết. Các chốt D0–D7 và mọi quyết định bên dưới (Unit, `bind()`, bảng 5 mức, thuật ngữ, Workflow tách khỏi Work, override) **không phụ thuộc** lựa chọn engine và giữ nguyên:

- **D0 → hội tụ ở Unit** (theo fable). **Thuật ngữ thống nhất (owner chốt 2026-09-30 22:20–22:25): một khái niệm = một tên, dùng cho toàn hệ thống (code, YAML, docs, skill, thảo luận); không có "tên nội bộ" khác "tên thảo luận".**

  | Khái niệm | Tên duy nhất (VN / EN, cả trong code) | Tên cũ phải xoá |
  |---|---|---|
  | Một phần việc | Unit | cell, step (của plan), dòng Product Gate |
  | Cách làm xong **một** unit — mọi vai cùng làm trên **một sản phẩm** (cùng `writes`, cùng worktree), lặp tới khi đạt | **Pattern cộng tác / `CollaborationPattern`** — đúng **3**: `solo`, `reviewed` (1 producer + danh sách checker + verify + vòng ≤ N), `panel` (N độc lập song song + tổng hợp); mỗi cái có **preset có tên** với tham số cố định (vd `consult` = `solo` vai advisor; `research-fan-out` = `panel` n=3 + tổng hợp; `rfc` = `reviewed` N người phản biện 1 vòng; `code-change` = `reviewed` với reviewer + tester + objector) | `FlowDefinition`, `CoordinationProtocol`, "protocol", Protocol Pack |
  | Dạng thảo luận nhiều bước (delphi, nominal group, group cognition, architecture panel, business discussion…) | **Workflow** (định nghĩa như workflow domain; mỗi bước dùng một Pattern cộng tác; "ai thấy gì" = đầu vào khai báo của bước) | "13 file YAML đều là Pattern cộng tác" (sai, sửa 2026-09-30 23:48) |
  | Một lần chạy một `CollaborationPattern` cho một unit | coordination session | — |
  | Nhiều unit theo thứ tự + cổng người (vd coding `feature`, marketing brief→viết→duyệt→xuất bản) — định nghĩa theo domain | **Workflow** (`domains/<domain>/workflows/*.yaml`) | Flow, FlowDefinition profile `Workflow`, "quy trình nghiệp vụ" |
  | Một lần chạy một Workflow (đang ở bước nào, cổng người nào đang chờ) | **Workflow run** | stage của Work item |
  | Bản ghi yêu cầu, giao tiếp user, board, status lifecycle | **Work** — tuỳ chọn; **dùng** Workflow run qua tham chiếu, không sở hữu Workflow | stage như field của Work |

  **`FlowDefinition` là gì hôm nay và vì sao xoá được** [fact]: là `kind` của vỏ YAML/IR (`src/runner/definitions/schema.mjs:1-20`, `KIND = 'FlowDefinition'`) với hai profile. (1) profile `CoordinationProtocol`: cả 13 file `core/coordination-protocols/*.yaml` — đây chính là Pattern cộng tác. (2) profile `Workflow`: không có file YAML nào; chỉ có `projectWorkflowToFlowDefinition` (`src/runner/definitions/workflow-adapter.mjs`) chiếu workflow Work sang vỏ này, và **người dùng duy nhất là một doctor check** (`src/setup/registrations.mjs:3595-3700`); runtime Work đọc thẳng `src/state/workflow-stage-graphs.mjs`, không qua vỏ. Vậy nghĩa thứ hai không có consumer runtime.

  Hướng đổi (thuộc plan triển khai, không làm bây giờ): YAML khai thẳng `kind: CollaborationPattern`, bỏ lớp `profile`; thư mục `core/collaboration-patterns/`; `validateFlowDefinition` → validator `CollaborationPattern`; xoá profile `Workflow` của vỏ cũ và `workflow-adapter.mjs` (chỉ là bản chiếu cho doctor; định dạng Workflow thật là YAML của domain — xem quyết định Workflow bên dưới); `protocolRef` → tham chiếu `CollaborationPattern`; contract `docs/architect/agent-coordination/contracts/flow-definition.md` đổi tên theo. Khoảng 20 file `src/` và ~800 lượt nhắc trong docs/core/domains/packages cần đổi — không alias, không giữ tên cũ (luật single path).

- **Workflow tách khỏi Work (owner chốt 2026-09-30 22:38).** Bằng chứng khởi điểm: fgOS đã có domain workflow (`domains/<domain>/registry.yaml` + `workflows/*.yaml`: stage có thứ tự, operation có `role`/`reason`/`dispatch: human-only`; nạp bởi `src/state/workflow-stage-graphs.mjs`; `domains/marketing/` có nhưng rỗng), nhưng nó đang nằm trong Work engine (stage là field của Work item). Quyết định:
  - **Workflow** là lớp độc lập: định nghĩa theo domain + **Workflow run** (trạng thái một lần chạy). Hệ thống chạy được Workflow **không cần Work**.
  - **Work** (khớp C1) chỉ còn: bản ghi yêu cầu, giao tiếp user, board, status lifecycle; **dùng** Workflow run qua tham chiếu (request coordination đã có `workRef` làm điểm nối).
  - Mỗi bước Workflow sinh Unit (hoặc là cổng người); thực thi Unit vẫn một đường: Unit → `CollaborationPattern` → `bind()` → coordination session.
  - Phân tầng: `Work (tuỳ chọn) → Workflow run (tuỳ chọn) → Unit → CollaborationPattern → coordination session → assignment/RunResult`. Prompt tự do: không Work, không Workflow. Plan AgentKit: unit từ phase file, Work tuỳ chọn. Quy trình marketing tự động: Workflow, không cần Work. Item trên board: Work + Workflow `coding/feature`.
  - **Một runner duy nhất cho Workflow run**: rút phần tuần tự stage khỏi `src/runner/loop.mjs`; coordination session chỉ chạy **một** unit. Không để hai sequencer (rủi ro E1 của fable) — phải kiểm khi lập plan.
  - Chưa kiểm: engine hiện tại chạy được domain không phải coding end-to-end không (tên stage coding và verb `discover`/`plan` còn rải trong code).

- **Hình chạy tổng thể (owner tạm đồng ý 2026-09-30 22:45).** Bốn đường vào, hội tụ ở Unit; Workflow là tầng tuần tự bước duy nhất:

  ```text
  Work (tuỳ chọn) ── bản ghi yêu cầu · board · status; trỏ tới cái đang chạy bên dưới
     │
  ┌─ prompt tự do ────► Lead hiểu + viết Unit[]            (agent phán đoán)
  ├─ plan AgentKit ───► đọc unit khai sẵn trong phase file  (máy đọc)
  ├─ plan dạng khác ──► Lead đọc plan, viết Unit[]          (agent phán đoán)
  └─ Workflow ────────► Workflow run: đang ở bước nào
                          │ mỗi bước ──► sinh Unit[]  ─────────────┐
                          │ hoặc cổng người ──► park, chờ trả lời   │
                          ▲                                         │
                          └── bước xong (RunResult) → sang bước sau ┘
                                        │
                  máy lint: id, dependsOn, writes không giao, không ghim hạ tầng
                                        │
                                     Unit[]   ◄── điểm hội tụ
                                        │
                  CollaborationPattern (unit ghi rõ, nếu không thì rule config)
                                        │
                        vai ──► bind() ──► executor · tier · persona · cơ chế
                                        │
             chạy inline / in-process / out-of-process (ghi file: mỗi unit một worktree)
                                        │
                        RunResult ──► Observe (và báo ngược lên Workflow run / Work)
  ```

- **AgentKit plan và Workflow: giống ở hình dạng, khác ở nguồn (owner chốt 2026-09-30 22:52).**

  | | AgentKit plan | Workflow |
  |---|---|---|
  | Dùng | **một lần**, cho một việc | **nhiều lần**, mọi việc cùng loại trong domain |
  | Chứa | **nội dung cụ thể** (area, file, tiêu chí) | **hình dạng** (bước, loại việc, cổng người); nội dung điền lúc chạy |
  | Unit | khai **sẵn, cụ thể** trong phase file (`- unit:`) | **khuôn** unit trên bước (capability, rigor, pattern); objective từ đầu vào/bước trước |
  | Thứ tự / cổng người | bảng phase + `blockedBy` / authorize từng phase | thứ tự bước trong YAML / bước `human-only` |

  Xử lý:
  - Cả hai đi **cùng một runner tuần tự bước** (Workflow run) và cùng một đường từ Unit trở xuống; không có runner riêng cho plan.
  - **Chạy một phase**: không mở Workflow run — đọc unit của phase rồi chạy. **Chạy nhiều phase liên tiếp**: driver dịch plan thành định nghĩa bước (phase → bước, `blockedBy` → thứ tự, authorize → cổng người) và mở một Workflow run; khác Workflow domain chỉ ở chỗ định nghĩa dùng một lần.
  - Cả hai không khai executor/model; không cần Work.
  - **Quyền sở hữu `plan.md` = (b):** `plan.md` vẫn do người/tool `ak` quản; fgOS **chỉ đọc** bảng phase/authorize, **không ghi** vào plan. Workflow run chỉ ghi tiến độ chạy của chính nó vào store (JSONL, L3). Lý do: plan là tài liệu của AgentKit, fgOS không chiếm quyền sở hữu; tránh hai nơi cùng giữ sự thật.

- **D1 → unit khai `capability` dạng `domain:verb`**, binder tra `capabilities[domain:verb]` rồi fallback `capabilities[verb]`. Xoá DemandFacts, matcher, `form`. (sonnet `kind+domain` là cùng thông tin đổi tên.)
- **D2 → rule mặc định trong config** (đổi so với v0): "review nhiều hay ít" là khẩu vị nên phải là dữ liệu (lập luận của fable). Mặc định: có `writes` + rigor ≥ standard → `reviewed`; `critical` → thêm objector; còn lại `solo`. Unit/user override bằng `pattern:`.
- **D3 → 3 mẫu `solo`, `reviewed` (objector tuỳ chọn, `driver-authorized`), `panel`.** **Bổ sung 23:48 (owner đồng ý tách hai tầng):** 13 file YAML hiện có chia hai loại — (1) **preset của một pattern**: master loop → `reviewed` + objector; declared-consult → `solo`; research fan-out → `panel` (gated = `panel` + cổng lộ trước tổng hợp); rfc chain / review-lite → `reviewed` N người phản biện 1 vòng; (2) **Workflow nhiều bước**: delphi (chain, feedback-lite), nominal group (chain, lite), group cognition, architecture panel (v1, standard). **Luật phân biệt:** mọi vai cùng làm trên **một sản phẩm**, cùng worktree, lặp tới khi đạt → Pattern; nhiều sản phẩm nối nhau, bước sau lấy kết quả bước trước làm đầu vào mới, hoặc có cổng người → Workflow. Ví dụ coding implement producer + reviewer + tester + red-team = **Pattern `reviewed`** (preset `code-change`): checker list [reviewer khác provider, tester, objector ở rigor critical]; phần chạy test suite là **lệnh verify tất định** của pattern, không cần một agent; chỉ khi tester **viết** test như một sản phẩm riêng (TDD) thì thành unit riêng `dependsOn` trong cùng bước. Lifecycle coding (discovery → planning → implement → merge approval) mới là Workflow `coding/feature`, trong đó bước implement dùng preset `code-change`. Nguyên nhân engine nặng: gộp hai tầng (làm một unit; tuần tự nhiều bước) vào một cơ chế. Delphi/nominal/rfc/group-cognition (0 lần dùng, F13) → đánh dấu experimental, không gom lúc này.
- **D4/D8 → mọi Ask thành Assignment + RunResult qua `executeAssignment`, kể cả inline** (`mechanism: inline`) — **đổi so với v0** (2/3 agent; F11 cho thấy transcript chỉ có với claude, còn Observe cần RunResult để nhóm theo unit). Điều kiện ghi file = cwd là linked worktree (`resolveMutatingCwdPosture` đã có), bỏ phụ thuộc protocol stamp.
- **D5 → bảng ưu tiên của fable**: override một lần (lưu trên manifest lần chạy, scope theo unit/vai, áp mọi vòng) → yêu cầu của unit/vai → khẩu vị config → không còn gì thì inline (có Lead) / lỗi rõ (headless). Không mặc định `claude`. `readOnly` và `independentOf` là **bộ lọc**; override vi phạm độc lập thì từ chối trừ khi override nói rõ chấp nhận. Governance phủ quyết cuối.
- **Cơ chế chạy do `bind()` trả** (bổ sung 19:35 sau thảo luận với owner):

  | | inline | in-process | out-of-process |
  |---|---|---|---|
  | Ai làm | Lead, trong lượt của nó | subagent qua Agent/Task tool của Lead (hoặc MCP tool) | process CLI riêng qua coordination/assignment |
  | Context | chung với Lead | mới, sạch | mới, sạch |
  | Model | cố định = model session | chọn trong cùng host (tham số `model` của Agent tool) | `modelPolicies[provider][tier]` |
  | Provider | = Lead | = Lead | bất kỳ |
  | Song song / chỉ-đọc ép được / độc lập khác provider | không / không / không | có / tool-scope / không | có / invocation read-only / có |

  Quy tắc: (1) candidate khác provider Lead → out-of-process; (2) cùng provider nhưng vai cần context sạch (review, objector), tier khác session, hoặc song song → in-process, `bind()` trả `model`; (3) cùng provider, **tier session ≥ sàn**, vai không cần độc lập → inline. Cả ba đều ghi RunResult (D4/D8).
- **Tier/model chỉ còn một chuỗi**: `rigor → rigorToTier → tier → modelPolicies[provider][tier]`, cho cả out-of-process lẫn in-process. Đầu vào merge chỉ-nâng: `rigor` unit/step, override `--tier`/`actors[].tier`, và (nếu Q1 được nhận) `capabilities.<cap>.rigor`. Inline không phải một đường chọn model mà là điều kiện "tier session ≥ sàn".
- **Năm mức tuỳ biến executor / tier / persona** (bổ sung 22:05 sau thảo luận với owner). Xếp từ thấp (fallback) lên cao (thắng); mỗi thuộc tính lấy giá trị ở mức cao nhất có khai, mức 0 chỉ dùng khi mức 1–4 đều trống:

  | Mức | Tầng | Executor (+ invocation) | Tier | Persona |
  |---|---|---|---|---|
  | 0 | Mặc định hệ thống | inline nếu có Lead / lỗi rõ nếu headless (không mặc định `claude`) | `rigor = standard` (vẫn đi qua `rigorToTier`) | không có (prompt không có mục Persona) |
  | 1 | Khẩu vị global `~/.fgos/config.json` | `capabilities[domain:verb].prefer[]` → fallback `capabilities[verb].prefer[]` — **đã có** (`prefer`) | `rigorToTier` (khoá bắt buộc, `fgos setup` cài, `doctor` kiểm — plan tier); sàn `capabilities[cap].rigor` — **đề xuất, Q1** | `capabilities[cap].persona` — **đề xuất, chưa có** |
  | 2 | Khẩu vị project `.fgos/config.json` (đè global theo từng key) | như mức 1 | như mức 1 | như mức 1 |
  | 3 | Yêu cầu của việc (Unit / Pattern cộng tác / Workflow) | **không bao giờ** | `rigor` (sàn) | vai do step/Workflow khai |
  | 4 | Override một lần (request / CLI / lời user) — lưu trên **manifest lần chạy** | `overrides[{scope}].executor/invocation` | `overrides[{scope}].tier` (chỉ nâng) | `overrides[{scope}].persona` |

  **Mức 4 — override một lần** (bổ sung 2026-09-30 23:00 sau thảo luận với owner): lựa chọn "ai làm / mạnh tới đâu" do **người khởi chạy** nêu cho **riêng lần chạy này**; không sửa config, lần sau quay về khẩu vị mức 1–2.
  - Hai cửa, cùng ghi một chỗ: lời user trong prompt ("lần này review bằng gpt" — Lead dịch thành dữ liệu) hoặc CLI/request. Dạng:

    ```yaml
    overrides:                         # trên manifest LẦN CHẠY, không trong plan, không trong config
      - scope: { unit: fix-null, role: reviewer }   # hoặc chỉ role (mọi unit), hoặc cả lần chạy
        executor: openai
        tier: flagship                 # chỉ nâng
        persona: security-reviewer
    ```
  - Sống hết lần chạy, **kể cả các vòng sửa/recheck** (sửa bug F8: roster `--actors` hôm nay chỉ áp bước đầu).
  - Giới hạn: tier chỉ nâng; vẫn qua bộ lọc `independentOf`/`readOnly` (vi phạm thì từ chối trừ khi ghi rõ chấp nhận); governance vẫn phủ quyết; không đè persona Workflow khoá (nếu Q6 theo đề xuất); provenance ghi `override`.
  - **Người viết plan không bao giờ khai override** (plan-lint cấm ghim hạ tầng); chỉ người khởi chạy.
  - Override lặp lại cùng kiểu nhiều lần = tín hiệu nên sửa khẩu vị (về sau Observe có thể đề xuất — B8).
  - Gom từ hiện trạng: `--executor` (áp cả session, tắt computed binding của bước), `actors[]` (chỉ ở `start`, không theo sang bước sau), `--tier` (không scope theo vai) → **một** field `overrides` có scope, lưu bền trên lần chạy.

  Áp trên mọi mức, không ai vượt: bộ lọc `readOnly` + `independentOf` (override vi phạm thì từ chối trừ khi ghi rõ chấp nhận); governance phủ quyết cuối.

  Ba ngoại lệ về cách thắng:
  - **Tier lấy giá trị lớn nhất, không theo "mức cao đè":** `rigor = max(rigor mức 3, sàn mức 1–2) ?? standard`; `tier = max(rigorToTier[rigor], override mức 4)`; `model = modelPolicies[provider][tier]`. Không mức nào hạ được sàn.
  - **Executor không có mức 3:** việc chỉ nêu yêu cầu; ai làm là khẩu vị hoặc override. Trong `prefer[]`, candidate đầu qua bộ lọc thắng, các candidate sau là fallback (kể cả khi hết quota).
  - **Persona mức 3 vs 4 còn tranh chấp:** persona do Workflow khoá (vd `brand-guardian`) — lead đề xuất override **không** đè được (xem §7 Q6).

  Hiện trạng persona để đối chiếu: chỉ có mức 4 (`actors[].persona`), mức 3 (`preferPersona` trong YAML) và một mặc định cứng `code-reviewer` cho mọi role `reviewer` (`assignment-policy.mjs:388-391`); config chưa có field persona; persona chỉ là tên (F4, F5).
- **D6 → vai khai là yêu cầu (vd `brand-guardian`), `capabilities[cap].persona` là khẩu vị**; persona có nội dung thật; bỏ default `code-reviewer`, `implied-by-persona`, `model_tier`.
- **D7 → `independentOf` bắt buộc** với vai review output ghi file; không thoả → park. Doctor check "mỗi capability chỉ-đọc có ≥ 2 provider family có invocation read-only".

### Q0 — chạy Pattern cộng tác bằng engine coordination hay mô hình gọn (câu hỏi trung tâm, thêm 2026-09-30 23:05)

**Khởi nguồn:** owner hỏi "không sinh JSON có giúp nhẹ đi không? mô hình điều phối có vẻ quá phức tạp". Trả lời: tự sinh request JSON chỉ đỡ việc người viết; engine bên dưới vẫn nguyên, chỉ bị giấu.

**Bằng chứng mô hình điều phối hiện quá nặng:**
- Quy mô: ~21k dòng coordination (`src/runner/coordination` + `src/verbs/coordination`) + ~32k dòng dispatch; so với `thieung/herdr-cook-plan` 1 skill + 1 script 151 dòng (`plans/reports/deep-comparison-260929-1446-harness-simplicity-herdr-cook-plan-vs-fgos.md`).
- Nghi lễ: request có 8 loại step (`operation`, `fan-out`, `authorize`, `disposition`, `contribution`, `human-turn`, `specialist-authorize`, `close` — `src/verbs/coordination/schema.mjs`), cộng actionKey, driver authorize, legality facts, actions projector; Lead gọi 5–8 lệnh cho **một** thay đổi (fable K1).
- Kết quả thật (§6.6 prompt): 3 vòng, ~10 run, ~150 phút cho một phase tài liệu; không session nào đóng.
- Store (F13): 512/606 session kẹt `active`.
- Phần phức tạp nhất không ai dùng: delphi, nominal, rfc, group-cognition = 0 lần; architecture panel 8 (F13).
- Fable E1: chi phí đến từ vòng lặp + nghi lễ driver, **không** từ binding. Tức phần đã thiết kế kỹ nhất (chọn người làm) không phải phần gây nặng; phần gây nặng là **engine chạy Pattern cộng tác**.
- Phát hiện kèm theo: tự sinh request JSON (thiết kế P-A) vẫn giữ nguyên engine; hôm nay K3 cần ~15 file request viết tay (F8, F9) và khẩu vị bị chép vào từng file.

**Phần thật sự cần vs phần là nghi lễ:**

| Thật sự cần cho mục tiêu | Nghi lễ, có thể bỏ |
|---|---|
| `bind()` chọn executor/tier/persona theo khẩu vị | request JSON 8 loại step |
| Một cửa chạy ghi RunResult cho Observe | actionKey, driver authorize từng bước |
| Worktree cho việc ghi file | legality facts, actions projector |
| Review khác provider, tối đa N vòng sửa | session state machine cho một việc đơn giản |
| Tuần tự bước + cổng người (Workflow run) | 13 Pattern cộng tác, phần lớn không dùng |

**Mô hình gọn (P-Y của fable, cụ thể hoá):**

```text
Unit ──► fgos run --unit <u> --role <vai>
            = bind() + chạy (inline / in-process / out-of-process) + ghi RunResult
```
- **Một primitive**: mỗi vai của một unit = một lần gọi. Gần đủ sẵn: `executeAssignment` đã ghi assignment + RunResult mà Observe đọc (F11).
- **Ba Pattern cộng tác = ba vòng lặp nhỏ** gọi primitive: `solo` (1 lần); `reviewed` (author → reviewer khác provider → có finding thì author sửa, ≤ 2 vòng); `panel` (N lần song song → tổng hợp). Viết bằng **code nhỏ dùng chung** cho cả khi có Lead lẫn headless (để tất định), không để Lead chạy bằng prose.
- **Workflow run** vẫn cần state riêng (tuần tự bước, park ở cổng người) vì business workflow phải chạy không người canh.
- **Engine coordination đóng băng**, chỉ còn cho Pattern cộng tác thật sự cần ép luật ai thấy gì (panel ẩn danh); vẫn không ai dùng thì xoá.
- Giữ nguyên: bảng 5 mức, `bind()`, Unit, Workflow tách khỏi Work, thuật ngữ, override. Chỉ đổi "chạy Pattern cộng tác bằng gì".

**Cái giá:**
- Kém tất định hơn nếu Lead chạy vòng lặp bằng prose → chữa bằng vòng lặp code nhỏ dùng chung.
- Mất các bảo đảm engine đang có (ẩn kết quả giữa thành viên panel, authorize từng bước) — phần lớn hiện gần như không được dùng.
- Chi phí chuyển đổi lớn nếu đi tới cùng (đóng băng rồi xoá phần lớn coordination); theo RUL11 quy mô không là lý do giữ cái rối.

**Đánh giá lại phương án (§4):** P-A giữ điểm "Đơn giản 4" chỉ ở bề mặt người dùng; tính cả engine thì thấp hơn. Mô hình gọn: đơn giản cao nhất, linh hoạt ngang, tường minh ngang (cùng `bind()`), đo được ngang (cùng `executeAssignment`), chi phí chuyển đổi cao ở phần xoá nhưng phần xây mới nhỏ.

**Lập trường lead** (đã chấm lại ở §4b, bake-off sửa theo §4b): nghiêng về **mô hình gọn**; quyết bằng **bake-off, làm trước mọi đầu tư khác**: chạy cùng 2 area tài liệu bằng (1) engine hiện tại và (2) primitive + vòng lặp `reviewed`; so trong cùng một Observe case: wall time, số lần người can thiệp, số finding thật được chấp nhận, chất lượng đầu ra. Mô hình gọn không thua về chất lượng → đi đường gọn, viết lại S2–S6 theo hướng đó.

**Bước 1 (sắp lại 23:05 theo Q0): bake-off trước, chỉ làm những sửa không phụ thuộc engine.**
1. **Bake-off** (việc đầu tiên): 2 area tài liệu, engine hiện tại (roster ghim reviewer khác provider) vs primitive + `reviewed` chạy hai lần (có/không objector), cùng một Observe case; đo Lead-active; thêm ca resume và ca no-candidate (xem §4b). Cần một primitive tối thiểu `run --unit --role` bọc `executeAssignment` + `bind()` bản nhỏ đủ cho khẩu vị docs.
2. Sửa không phụ thuộc engine, làm ngay: config `docs:write.prefer=[openai]`, `docs:review.prefer=[claude/claude-cli-readonly]`, sửa `code:review.prefer` → claude (F3); `prefer` luôn kèm invocation vì `readOnlyRedirects` còn sống (plan tier dời việc xoá sang follow-on — lệch C5); sửa `metrics harness` đọc `definitionRef.id` (F12) để bake-off đo đúng.
3. **Chỉ khi engine thắng bake-off** mới làm các sửa engine của S1 fable: bỏ `policy.capability` khỏi master loop + `red-team-candidate` → `driver-authorized`; `coordination start --capability` lưu manifest, `composeActionRequest` đọc lại cho mọi node; close-check trước merge.

Bản cũ của bước 1 (trước 23:05, giữ để không mất chi tiết): **Bước 1 = S1 của fable (bốn việc) + hai bổ sung:**
1. Bỏ `policy.capability` khỏi master loop; `red-team-candidate` → `driver-authorized`.
2. `coordination start --capability`, lưu manifest; `composeActionRequest` đọc lại cho mọi node (thay `facts` chết).
3. Config: `docs:write.prefer=[openai]`, `docs:review.prefer=[claude/claude-cli-readonly]`, và sửa `code:review.prefer` → claude (F3). **Lưu ý:** `plan.md` của plan tier nay ghi "readOnlyRedirects dời sang plan follow-on" — **lệch với C5 của handoff** (C5 ghi "bỏ redirect"). Chừng nào redirect còn, bước read-only chọn claude vẫn bị đổi sang openai trừ khi ghim invocation tường minh; vì vậy `prefer` phải luôn kèm invocation, hoặc bước 1 tự xoá redirect.
4. Close-check trước merge; sửa `metrics harness` đọc `definitionRef.id` (F12).
5. *(bổ sung)* Smoke **2 area song song** (openai) trong một Observe case.
6. *(bổ sung)* **Bake-off** cùng 2 area bằng Lead + subagent (fable E1) → quyết P-A hay P-Y trước khi đầu tư S2–S6.

Các bước sau (theo fable): S2 override bền + `solo` + xoá `agent-led`/`dispatch-runs`; S3 một binder (sau khi plan tier merge, cùng file); S4 unit trong phase file + driver chung, xoá DemandFacts; S5 persona + RunResult inline; S6 `panel`.

**Plan riêng, xếp sau bước 1 và sau plan tier: tách Workflow khỏi Work** (xem quyết định Workflow ở trên). Phạm vi: Workflow definition + Workflow run store (JSONL, L3) + một runner tuần tự bước và cổng người; stage `discovery/exploring/planning/executing` trở thành các bước của Workflow `coding/feature`; Work chỉ giữ status board + tham chiếu Workflow run; kiểm Workflow chạy được domain không phải coding (smoke marketing). Quy mô đã đếm: 32 file import `workflow-stage-graphs.mjs`, 24 file đọc `item.stage` (gồm dispatch `assignment-runner.mjs`, `operation-choice.mjs`), Rust `work-state`.

## 7. Bộ câu hỏi cho owner (một lượt)

0. ~~Q0 engine hay mô hình gọn~~ — **owner chốt 2026-09-30 23:52: mô hình gọn.** Bake-off không còn để quyết lựa chọn; giữ lại làm **ca nghiệm thu + đo mốc** (Lead-active, can thiệp, chất lượng, resume, no-candidate) để chứng minh mô hình gọn đạt G1–G6 và không thua engine, đồng thời là số liệu nền cho Observe.

1. **Sàn tier theo capability — chạm quyết định đã chốt C5.** Khẩu vị của anh nói theo loại việc ("review = opus", "research = standard"), nhưng `rigorToTier` là bảng toàn cục; muốn "review luôn opus" thì chỉ còn cách khai `rigor` cao trong YAML mẫu, tức khẩu vị quay lại YAML. Fable đề xuất thêm một scope `capabilities.<cap>.rigor` (sàn, cùng thang, chỉ nâng) vào chuỗi merge đã có. **Em đề xuất: nhận**, đưa vào plan tier như một mục nhỏ. Lựa chọn khác: giữ C5 nguyên, chấp nhận pattern khai rigor.
2. **`model_tier` trong `core/agents/*.yaml`** là đường chọn model thứ hai (qua `scripts/project-agents.mjs`, dựa vào `runner.models` sắp bị xoá), plan tier **chưa phủ** (F15). **Em đề xuất: thêm vào plan tier** (vì plan đó xoá `runner.models`, không làm thì gãy), **kèm thay thế**: subagent in-process lấy model từ `bind()` (tham số `model` của Agent tool, tra `modelPolicies.claude[tier]`), không từ agent YAML. Chỉ xoá mà không thay thì đường in-process mất cách chọn model. Lựa chọn khác: để S5 ở đây.
3. **Bake-off engine vs Lead + subagent** trên 2 area trước khi làm S2+. Tốn thêm một lượt smoke; đổi lại biết chắc nên gom engine hay đi đường gọn kiểu herdr-cook-plan. **Em đề xuất: làm.**
4. **Red-team cho code**: giữ bắt buộc như hiện nay, hay thành objector tuỳ chọn (tự bật ở `rigor: critical`) giống mọi domain? **Em đề xuất: tuỳ chọn**, vì §6.6 cho thấy chi phí vòng lặp; review khác provider bắt buộc đã giữ chất lượng nền.
5. **Plan tài liệu**: bước 1 chỉ build + smoke trên area mẫu. Chạy phase thật cần anh authorize P4 (P6 còn chặn bởi P4–P5). Anh định authorize P4 ngay khi S1 xong, hay chờ thêm? (Không chặn việc build.)

6. **Persona do Workflow khoá có bị override một lần đè không?** Fable: override thắng; openai: persona đã khoá không đè được. **Em đề xuất: không đè** — đó là yêu cầu nghiệp vụ (mức 3), không phải khẩu vị; muốn đổi thì sửa Workflow.

7. ~~Quy trình nghiệp vụ nằm ở đâu~~ — **đã chốt 22:38**, xem quyết định Workflow ở §6.

8. ~~Panel: giữ engine hay chuyển sang mô hình gọn~~ — **owner chốt 2026-09-30 23:45: các dạng thảo luận là năng lực phải giữ, không dạng nào bị bỏ theo engine; engine chỉ là phương tiện. Bỏ engine khi và chỉ khi mọi dạng thảo luận chạy trên mô hình gọn "tốt đẹp, nhẹ nhàng, đúng pattern, nhanh lẹ, ít tốn kém"** — tức đạt G1–G6 và không thua engine ở tiêu chí 1 (nhanh), 2 (ít canh), 4 (chất lượng, gồm bảo đảm độc lập và lộ theo pha) trong ca nghiệm thu. Bối cảnh (23:40): Owner cho biết: số "0 người dùng" (F13) **không** phản ánh nhu cầu mà do harness chưa ổn định nên chưa đưa panel vào dùng; ứng viên thật đầu tiên là **software architect advisor** (`fgos-architecture-panel`, protocol `architecture-advisory-panel-v1` / `-standard-v1`), tiếp theo là **thảo luận vấn đề business**. → Rút lại lập luận "0 người dùng nên xoá" ở §4b.
   - Cấu trúc thật của architecture panel [fact, `core/coordination-protocols/architecture-advisory-panel-standard-v1.yaml`]: chuỗi pha framing → shaping (3 đề xuất độc lập song song: system / alternative / constraint) → critique → synthesis → explanation → dialogue-reopen (người hỏi lại); `visibilityWindows` quy định pha nào được thấy kết quả pha nào; `specialistSlots` gọi chuyên gia khi cần; nhiều bước `driver-authorized`.
   - Nhìn bằng khái niệm đã chốt: đây là **một Workflow** (pha = bước, dialogue-reopen = cổng người), mỗi pha là unit chạy bằng `panel`/`solo`, và **visibility = đầu vào khai báo của mỗi bước** (bước critique nhận 3 đề xuất; 3 bước shaping chỉ nhận kết quả framing → độc lập theo cấu tạo vì chạy song song với context sạch). Specialist = unit tuỳ chọn do driver kích hoạt.
   - **Phạm vi phải chuyển:** mọi dạng thảo luận trong `core/coordination-protocols/` — mỗi dạng thành **preset pattern** hoặc **Workflow** theo D3 bổ sung 23:48 (architecture advisory panel v1 + standard, declared consult, research fan-out/fan-in + gated, delphi, nominal group, RFC review lite, group cognition, …) — mỗi dạng được biểu diễn lại bằng Workflow + unit + đầu vào khai báo, hoặc owner tự quyết bỏ riêng từng dạng; lead không được bỏ dạng nào.
   - **Thứ tự nghiệm thu:** architecture advisor (ứng viên thật đầu tiên) → business discussion (kèm G4b) → các dạng còn lại.
   - **Em đề xuất (giữ):** **dùng architecture advisor làm ca nghiệm thu thứ hai** cho mô hình gọn (sau bake-off docs). Engine chỉ bị thu hồi khi architecture advisor chạy trên mô hình gọn với cùng bảo đảm: đề xuất vòng đầu độc lập, lộ kết quả theo pha, người hỏi lại được, replay được. Không đạt → giữ engine cho panel, ghi rõ lý do (tức P-A cục bộ cho panel). Business discussion là ca thứ ba và cũng là ca G4b (Workflow không phải code, có cổng người).
   - Ràng buộc kèm: vai có ràng buộc visibility **không bao giờ chạy inline** (Lead thấy hết); phải in-process/out-of-process với context sạch.
   - Chưa kiểm: engine hiện có ép visibility ở mức hệ thống file (confinement) hay chỉ ở mức context được đưa vào prompt — quyết định mức bảo đảm mô hình gọn cần đạt.

9. ~~Supersede ADR-006 §6~~ — **owner đồng ý 2026-09-30 23:40**: bỏ protocol stamp; cổng ghi file = posture worktree (`resolveMutatingCwdPosture`) + đi qua `bind()` (có `provenance.binding`). Supersede phải ghi tường minh trong plan triển khai (decision record trong spec area tương ứng), không sửa ADR tại chỗ.

Những gì em **tự quyết**, không hỏi: D0–D7 ở §6; bác `AssignmentPlan` (F25); Workflow marketing chỉ smoke trong plan tách Workflow, không xây domain marketing thật trước tenant.

## 8. Câu hỏi còn mở

- **Đa dạng góc nhìn**: 2/3 câu trả lời là claude. Nếu gemini/xai có góc nhìn khác (nhất là về P-Y), tổng hợp sẽ cập nhật; nếu anh không chạy thêm, em coi 3 bản là đủ vì đồng thuận khung đã rõ.
- `strength: preferred` có đúng là nguyên nhân rubber-stamp §6.6 — cần đọc log session `documentation-authority-unification--phase-01*`.
- Store session nhiễm: 512 `active`, ~115 test rò (F13) — nên thành một work item riêng (dọn + chặn test ghi store thật).
- Drift doc `fallbackExecutors` (F16); `decide --for review` có ra xai không (F14) — nhỏ, tách riêng.
- `dispatch-runs/claude/1790745191212` kẹt `running`.
