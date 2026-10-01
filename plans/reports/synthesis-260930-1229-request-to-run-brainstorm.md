# Tổng hợp brainstorm: yêu cầu → phân rã → coordination/dispatch/run

```txt
Document type: Synthesis report (discussion lead)
Snapshot: 2026-09-30 16:20 (Asia/Saigon), main @ 5aed82c52
Prompt: plans/reports/brainstorm-prompt-260930-1102-request-to-run-decomposition.md
Handoff: plans/reports/handoff-260930-1210-harness-routing-discussion-lead.md
Status: v3.2 — bộ plan track đã lập (§7b); §7d góc nhìn layer/authority (L0–L7, A1–A7, 5 điều chỉnh owner duyệt, tiêu chí 'đóng một mối authority'); §7b lộ trình track (P1 Lõi thực thi … P5) + việc lẻ; §7c bài học engine; plan T đã sửa (D19, D20; commit 9a2cef1cd trên nhánh T); X gộp vào plan bind(); §6c đối chiếu plan tier T: T chạy trước, track này chờ T ở phần code; T cần thêm sàn `capabilities.<cap>.rigor`; Q2 đã được T phủ; §6b đối chiếu plan X (readonly redesign): không chặn bước 1, nên gom với bind(); sửa D5/bước 1/F16; thống nhất tên red-team (bỏ objector); Q6 chốt (persona khoá không bị thay, không có 'thêm' ở V1); checker theo rigor; Q1, Q2 chấp nhận; Q4 chốt red-team bắt buộc cho code (lead rút đề xuất); Q0 chốt: mô hình gọn; tách hai tầng: 3 Pattern cộng tác (+ preset) vs Workflow nhiều bước; luật phân biệt; Q8 chốt (giữ mọi dạng thảo luận; bỏ engine chỉ khi chúng chạy tốt trên mô hình gọn); Q9 chốt (supersede ADR-006 §6); (architecture advisor là ca nghiệm thu thu hồi engine); §4b chấm lại theo §0 (lead + kongming độc lập: gọn 3,9–4,0 > P-A 3,2–3,3 > P-B loại); bake-off sửa; F26–F30; §0 kết quả mong muốn + tiêu chí mới (G1–G6, 8 tiêu chí); Q0 engine vs mô hình gọn (bake-off trước); mức 4 override làm rõ; hình chạy tổng thể + plan vs Workflow + (b) quyền sở hữu plan.md đã chốt; Workflow tách khỏi Work đã chốt; bảng thuật ngữ đã chốt ở §6 D0; 3 câu trả lời (2 family: claude, openai). Chưa có gemini/xai; cập nhật tiếp nếu owner gửi thêm.
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
| F16 | `fallbackExecutors`: doc/comment "reserved-not-executed" nhưng runtime có Provider Capacity Rotator | openai | Đúng là drift; **nhưng nhánh rotator là code chết trong config hiện tại** (chỉ chạy khi lease `refused`, cần `runner.providers.*.accounts`, không config nào khai — plan X ràng buộc 4) | `assignment-policy.mjs:404-410` vs `assignment-runner.mjs:1069,1768` |
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
| 4 Cộng tác | Ba mẫu là đủ; red-team là một vai trong mẫu review, không phải mẫu riêng; FlowDefinition không có đường riêng | **D0 điểm hội tụ**: Unit (fable) ↔ step list có vai (sonnet) ↔ canonical graph trước binding (openai). **D2** ai chọn mẫu: rule trong config (fable) ↔ máy theo `applies` trong mẫu (sonnet) ↔ agent (openai) |
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

1. **Đo đúng biến.** Nhánh engine hôm nay = master loop có red-team bắt buộc + `preferred`; so với `reviewed` không red-team + `required` thì chênh là **pattern**, không phải engine. Cách rẻ nhất: nhánh engine ghim roster `actors[]` để reviewer khác provider (giả lập `required`), và chạy nhánh gọn **hai lần** (có red-team — đồng hình với red-team — và không red-team).
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
  | Checker phản biện đối kháng trong `reviewed` | **red-team** (một tên duy nhất, owner chốt 2026-10-01 00:08) | "objector" (tên fable dùng) |
  | Cách làm xong **một** unit — mọi vai cùng làm trên **một sản phẩm** (cùng `writes`, cùng worktree), lặp tới khi đạt | **Pattern cộng tác / `CollaborationPattern`** — đúng **3**: `solo`, `reviewed` (1 producer + danh sách checker + verify + vòng ≤ N), `panel` (N độc lập song song + tổng hợp); mỗi cái có **preset có tên** với tham số cố định (vd `consult` = `solo` vai advisor; `research-fan-out` = `panel` n=3 + tổng hợp; `rfc` = `reviewed` N người phản biện 1 vòng; `code-change` = `reviewed` với reviewer + tester + red-team (luôn bật)) | `FlowDefinition`, `CoordinationProtocol`, "protocol", Protocol Pack |
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
- **D2 → rule mặc định trong config** (đổi so với v0): "review nhiều hay ít" là khẩu vị nên phải là dữ liệu (lập luận của fable). Mặc định: có `writes` + rigor ≥ standard → `reviewed`; `critical` → thêm red-team; còn lại `solo`. Unit/user override bằng `pattern:`.
- **D3 → 3 mẫu `solo`, `reviewed` (red-team: **luôn bật cho code** theo Q4; domain khác chờ owner), `panel`.** **Bổ sung 23:48 (owner đồng ý tách hai tầng):** 13 file YAML hiện có chia hai loại — (1) **preset của một pattern**: master loop → `reviewed` + red-team; declared-consult → `solo`; research fan-out → `panel` (gated = `panel` + cổng lộ trước tổng hợp); rfc chain / review-lite → `reviewed` N người phản biện 1 vòng; (2) **Workflow nhiều bước**: delphi (chain, feedback-lite), nominal group (chain, lite), group cognition, architecture panel (v1, standard). **Luật phân biệt:** mọi vai cùng làm trên **một sản phẩm**, cùng worktree, lặp tới khi đạt → Pattern; nhiều sản phẩm nối nhau, bước sau lấy kết quả bước trước làm đầu vào mới, hoặc có cổng người → Workflow. Ví dụ coding implement producer + reviewer + tester + red-team = **Pattern `reviewed`** (preset `code-change`): checker list [reviewer khác provider, tester, red-team luôn bật (Q4)]; phần chạy test suite là **lệnh verify tất định** của pattern, không cần một agent; chỉ khi tester **viết** test như một sản phẩm riêng (TDD) thì thành unit riêng `dependsOn` trong cùng bước. Lifecycle coding (discovery → planning → implement → merge approval) mới là Workflow `coding/feature`, trong đó bước implement dùng preset `code-change`. Nguyên nhân engine nặng: gộp hai tầng (làm một unit; tuần tự nhiều bước) vào một cơ chế. Delphi/nominal/rfc/group-cognition (0 lần dùng, F13) → đánh dấu experimental, không gom lúc này.
- **D4/D8 → mọi Ask thành Assignment + RunResult qua `executeAssignment`, kể cả inline** (`mechanism: inline`) — **đổi so với v0** (2/3 agent; F11 cho thấy transcript chỉ có với claude, còn Observe cần RunResult để nhóm theo unit). Điều kiện ghi file = cwd là linked worktree (`resolveMutatingCwdPosture` đã có), bỏ phụ thuộc protocol stamp.
- **D5 → bảng ưu tiên của fable**: override một lần (lưu trên manifest lần chạy, scope theo unit/vai, áp mọi vòng) → yêu cầu của unit/vai → khẩu vị config → không còn gì thì inline (có Lead) / lỗi rõ (headless). Không mặc định `claude`. `readOnly` (posture confinement — cơ chế do plan X quyết, xem §6b; không phải "invocation read-only") và `independentOf` là **bộ lọc**; override vi phạm độc lập thì từ chối trừ khi override nói rõ chấp nhận. Governance phủ quyết cuối.
- **Cơ chế chạy do `bind()` trả** (bổ sung 19:35 sau thảo luận với owner):

  | | inline | in-process | out-of-process |
  |---|---|---|---|
  | Ai làm | Lead, trong lượt của nó | subagent qua Agent/Task tool của Lead (hoặc MCP tool) | process CLI riêng qua coordination/assignment |
  | Context | chung với Lead | mới, sạch | mới, sạch |
  | Model | cố định = model session | chọn trong cùng host (tham số `model` của Agent tool) | `modelPolicies[provider][tier]` |
  | Provider | = Lead | = Lead | bất kỳ |
  | Song song / chỉ-đọc ép được / độc lập khác provider | không / không / không | có / tool-scope / không | có / invocation read-only / có |

  Quy tắc: (1) candidate khác provider Lead → out-of-process; (2) cùng provider nhưng vai cần context sạch (review, red-team), tier khác session, hoặc song song → in-process, `bind()` trả `model`; (3) cùng provider, **tier session ≥ sàn**, vai không cần độc lập → inline. Cả ba đều ghi RunResult (D4/D8).
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
  - **Executor không có mức 3:** việc chỉ nêu yêu cầu; ai làm là khẩu vị hoặc override. Trong `prefer[]`, candidate đầu qua bộ lọc thắng, các candidate sau là fallback. Fallback **khi hết quota hiện chưa chạy được** (nhánh cần `runner.providers.*.accounts`, không config nào khai — plan X ràng buộc 4); trigger quota do plan X quyết.
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
1. **Bake-off** (việc đầu tiên): 2 area tài liệu, engine hiện tại (roster ghim reviewer khác provider) vs primitive + `reviewed` chạy hai lần (có/không red-team), cùng một Observe case; đo Lead-active; thêm ca resume và ca no-candidate (xem §4b). Cần một primitive tối thiểu `run --unit --role` bọc `executeAssignment` + `bind()` bản nhỏ đủ cho khẩu vị docs.
2. Sửa không phụ thuộc engine, làm ngay: config `docs:write.prefer=[openai]`, `docs:review.prefer=[claude/claude-cli-bwrap]` (+ `confinement: required, host-write-denied`; không dùng `claude-cli-readonly` — xem §6b), sửa `code:review.prefer` → claude (F3); `prefer` luôn kèm invocation vì `readOnlyRedirects` còn sống (plan tier dời việc xoá sang follow-on — lệch C5); sửa `metrics harness` đọc `definitionRef.id` (F12) để bake-off đo đúng.
3. **Chỉ khi engine thắng bake-off** mới làm các sửa engine của S1 fable: bỏ `policy.capability` khỏi master loop + `red-team-candidate` → `driver-authorized`; `coordination start --capability` lưu manifest, `composeActionRequest` đọc lại cho mọi node; close-check trước merge.

Bản cũ của bước 1 (trước 23:05, giữ để không mất chi tiết): **Bước 1 = S1 của fable (bốn việc) + hai bổ sung:**
1. Bỏ `policy.capability` khỏi master loop; `red-team-candidate` → `driver-authorized`.
2. `coordination start --capability`, lưu manifest; `composeActionRequest` đọc lại cho mọi node (thay `facts` chết).
3. Config: `docs:write.prefer=[openai]`, `docs:review.prefer=[claude/claude-cli-bwrap]` (+ `confinement: required, host-write-denied`; không dùng `claude-cli-readonly` — xem §6b), và sửa `code:review.prefer` → claude (F3). **Lưu ý:** `plan.md` của plan tier nay ghi "readOnlyRedirects dời sang plan follow-on" — **lệch với C5 của handoff** (C5 ghi "bỏ redirect"). Chừng nào redirect còn, bước read-only chọn claude vẫn bị đổi sang openai trừ khi ghim invocation tường minh; vì vậy `prefer` phải luôn kèm invocation, hoặc bước 1 tự xoá redirect.
4. Close-check trước merge; sửa `metrics harness` đọc `definitionRef.id` (F12).
5. *(bổ sung)* Smoke **2 area song song** (openai) trong một Observe case.
6. *(bổ sung)* **Bake-off** cùng 2 area bằng Lead + subagent (fable E1) → quyết P-A hay P-Y trước khi đầu tư S2–S6.

Các bước sau (theo fable): S2 override bền + `solo` + xoá `agent-led`/`dispatch-runs`; S3 một binder (sau khi plan tier merge, cùng file); S4 unit trong phase file + driver chung, xoá DemandFacts; S5 persona + RunResult inline; S6 `panel`.

**Plan riêng, xếp sau bước 1 và sau plan tier: tách Workflow khỏi Work** (xem quyết định Workflow ở trên). Phạm vi: Workflow definition + Workflow run store (JSONL, L3) + một runner tuần tự bước và cổng người; stage `discovery/exploring/planning/executing` trở thành các bước của Workflow `coding/feature`; Work chỉ giữ status board + tham chiếu Workflow run; kiểm Workflow chạy được domain không phải coding (smoke marketing). Quy mô đã đếm: 32 file import `workflow-stage-graphs.mjs`, 24 file đọc `item.stage` (gồm dispatch `assignment-runner.mjs`, `operation-choice.mjs`), Rust `work-state`.

## 6b. Đối chiếu với plan X — `260930-1235-readonly-invocation-redesign` (2026-10-01 00:10)

X nằm trên nhánh `plan/260930-tier-rigor-consolidation` (đọc bằng `git show`, không đụng nhánh), `blockedBy` plan tier, **chưa có phase**, bước kế là brainstorm bảo mật. Mục tiêu X: xoá `readOnlyRedirects` + `placement-policy.mjs`; bước chỉ-đọc không đổi executor lặng lẽ; read-only không ghi repo/host nhưng vẫn ghi artifact của run; hết quota claude không để review nằm chờ người. X có 9 ràng buộc đã chứng minh bằng file:line.

### Quan hệ

| Chủ đề | X | Thiết kế này | Quan hệ |
|---|---|---|---|
| Không đổi người lặng lẽ | mục tiêu chính | G6 | **cùng nguyên tắc**; X là một phần việc để đạt G6 |
| Read-only là gì | câu hỏi mở; ràng buộc 1–3: cờ CLI không đủ, `confinement` khai ở invocation chỉ là metadata, bwrap chỉ chạy khi `capabilities.<cap>.confinement` yêu cầu | D5 ghi "bộ lọc `readOnly` = chỉ nhận invocation read-only của chính executor" | **thiết kế này sai theo bằng chứng của X** → sửa D5: read-only là **posture** (confinement) resolve một chỗ lúc spawn; cơ chế do X quyết, `bind()` chỉ tiêu thụ |
| Fallback khi hết quota | ràng buộc 4: nhánh fallback là **code chết** (cần `runner.providers.*.accounts`, không config nào khai) | bảng 5 mức: "`prefer[]` candidate sau là fallback kể cả khi hết quota"; F16 | **thiết kế này dựa trên thứ chưa chạy** → đánh dấu phụ thuộc X (trigger quota do X quyết); sửa F16 |
| Chọn invocation cho fallback | ràng buộc 5: chọn ở `assignment-runner.mjs:2318-2353`, pin primary đi theo sang executor mới | `bind()` chọn executor + invocation + provenance cho mọi candidate | **cùng chỗ code** → nên gom: fallback cũng đi qua `bind()` |
| Redirect tác động thật ở đâu | ràng buộc 6: actor không bind hoặc ghim claude (vd capability `review` của advisory panel) | bước 1 đổi `code:review.prefer` → claude | **đổi này làm redirect tác động mạnh hơn** → bắt buộc kèm invocation pin. Đã kiểm: invocation trong `prefer` đi tới `cliOverride.preferInvocation` (`binding.mjs:311` → `composers.mjs:65,73` → `run.mjs:126,138`) nên `hasExplicitInvocationPin` đúng → redirect không đè (đường coordination) |
| Project khác | ràng buộc 7: redirect mặc định `claude → claude-reviewer`; nhiều project không có `executors.claude` → cần doctor quét | mission #1 | X giữ đúng; thiết kế này phải thừa kế doctor check đó |
| Luật read-only thứ hai | ràng buộc 8: `provider-adapter.mjs:356-369`; `executeExecutorCli`/`runDispatchCli` không qua `isReadOnlyAssignment` | mô hình gọn xoá `dispatch-runs` / `execute` thường | **mô hình gọn giảm scope X**: hai đường bypass đó biến mất |
| `distinctProviderFrom` | ràng buộc 9: chỉ kiểm lúc bind; không được biến `preferred` thành `required` (ở tầng dispatch, lặng lẽ) | D7: `required` cho review output ghi file | **không mâu thuẫn** nếu đổi tường minh ở pattern/config (thiết kế này), không lặng lẽ trong dispatch; ghi rõ khi lập plan |
| In-process | ngoài scope X | K1: reviewer claude chạy in-process | **khoảng trống**: read-only in-process = tool-scope của agent type — luật read-only thứ ba; cần gom vào cùng khái niệm posture |

### Có phải chờ nhau không

- **Bước 1 (ca nghiệm thu mô hình gọn + sửa không phụ thuộc engine): không chờ X.** Chạy được hôm nay nếu: mọi bước review ghim invocation tường minh; invocation đó là **confined** (`claude-cli-bwrap`) và capability tương ứng khai `confinement: required, host-write-denied` (như `review`, `code:review` đang có) — **không dùng `claude-cli-readonly`** (vẫn chạy `acceptEdits`, ghi được file — plan tier finding #3; X ràng buộc 1–2).
- **`bind()` một chỗ + primitive (các bước sau): nên gom với X**, không làm hai lần trên cùng code (`resolve.mjs`, `assignment-runner.mjs:1431-1455, 2318-2353`, `placement-policy.mjs`). Nếu X làm riêng trên code hiện tại rồi mô hình gọn viết lại đường fallback/redirect → làm hai lần (RUL11).
- X vẫn `blockedBy` plan tier; thiết kế này cũng xếp `bind()` sau plan tier → hai cái cùng mốc bắt đầu, thuận để gom.

### Điều chỉnh X — **owner chốt 2026-10-01: gộp X vào plan `bind()`** (đã ghi vào `plans/260930-1235-readonly-invocation-redesign/plan.md` trên nhánh T, commit `9a2cef1cd`)

1. **Đích của X đặt trong `bind()`**: read-only là một posture/bộ lọc do `bind()` áp, có provenance; fallback (quota) cũng chọn qua `bind()`. Không vá tiếp `placement-policy.mjs`/khối redirect rồi xoá sau.
2. **Trả lời câu hỏi brainstorm của X theo hướng nhất quán với thiết kế này**: read-only = OS confinement resolve một chỗ lúc spawn (primary + fallback + resume); in-process = tool-scope — cùng khái niệm posture.
3. **Thu hẹp scope X**: bỏ việc vá `executeExecutorCli`/`runDispatchCli` (ràng buộc 8) vì mô hình gọn xoá hai đường đó.
4. **Trigger quota**: quyết trong X; thiết kế này dùng kết quả cho `prefer[]` fallback và G6.
5. Hai cách tổ chức: (a) X thành một phase của plan `bind()` + primitive (gom hẳn); (b) X giữ plan riêng nhưng đổi đích như (1) và chạy ngay trước bước `bind()`. **Lead nghiêng (a)** — cùng code, cùng mốc, ít lần sửa nhất.

### Sửa trong thiết kế này (đã áp)

- D5: `readOnly` là posture confinement do X quyết, không phải "invocation read-only".
- Bước 1: `docs:review.prefer=[claude/claude-cli-bwrap]` + capability `docs:review` khai `confinement: required, host-write-denied`; bỏ `claude-cli-readonly`.
- Bảng 5 mức / F16: fallback theo quota **chưa chạy được** hôm nay; phụ thuộc X.

## 6c. Đối chiếu với plan tier T — `260930-0445-tier-rigor-vocabulary-consolidation` (2026-10-01 00:20)

T nằm trên nhánh `plan/260930-tier-rigor-consolidation` (worktree `~/projects/forgentX-tier-rigor-consolidation`), `status: pending`, 4 phase tuần tự (5–6 ngày), `blocks` plan X. Nhánh T có 4 commit (chỉ tài liệu plan) và đang **sau main 24 commit**; từ merge-base, main **không** đổi gì ở `src/runner/**`, `src/verbs/coordination/**`, `core/coordination-protocols/**`, `.fgos/config.json` — chỉ đổi file brainstorm prompt (`cf94a59e8`).

### T làm gì mà thiết kế này dựa vào

| Thứ T giao | Thiết kế này dùng ở đâu |
|---|---|
| `rigor` thay `minTier`; bảng `runner.rigorToTier` (khoá bắt buộc, setup/doctor) | bảng 5 mức, cột tier; mức 0 `rigor = standard`; mức 3 `rigor` của unit/step |
| một resolver `resolveTierModel` + `deriveProviderFamily` | chuỗi tier duy nhất; `bind()` gọi nó |
| field `tier` ở PolicyPatch scope actor/assignment/cli (override chỉ nâng) | mức 4 override tier (sau này gom vào `overrides[{scope}]`) |
| xoá `runner.models`, `rigorOverrides`, bridge, shadow | giảm số nơi quyết model → tiền đề của G6 và tiêu chí 3 |
| `core/agents/*.yaml`: `model_tier` → `rigor`; `scripts/project-agents.mjs` qua `resolveTierModel` (phase 1 + 3) | **Q2 đã được T phủ** (xem sửa bên dưới) |
| Work `tier` → `size` + `rigor` | unit từ Work mang `rigor`; Workflow tách khỏi Work làm sau, không xung đột |

### Có phải chờ nhau không

- **T không chờ thiết kế này.** T là nền; nên chạy trước.
- **Thiết kế này chờ T ở phần code**: `bind()` + primitive + cổng mutating (Q9) + ca nghiệm thu đều sửa `assignment-runner.mjs`, `assignment-policy.mjs`, `resolve.mjs`, `.fgos/config.json` — đúng các file T sửa ở cả 3 phase (T tự ghi "các phase chạy tuần tự vì cùng sửa các file này"). Làm song song = xung đột merge chắc chắn. F28: `rigorToTier` chưa có trên main.
- **Làm được ngay, không đụng T:** sửa `metrics harness` đọc `definitionRef.id` (F12, Rust Observe); viết plan triển khai cho track này; thiết kế ca nghiệm thu.
- **Thứ tự đề xuất:** T → (X gom vào) plan `bind()` + primitive + cổng mutating + ca nghiệm thu → plan tách Workflow khỏi Work → plan đổi tên thuật ngữ toàn hệ thống.

### Điều chỉnh T — **owner đồng ý 2026-10-01; lead đã sửa plan T** trên nhánh `plan/260930-tier-rigor-consolidation`, commit `9a2cef1cd` (D19: sàn `capabilities.<cap>.rigor` + **xoá cả khối `capabilities.*.overrides`** vì sau phase 1 chỉ còn `tier`/`model`, không config nào dùng, và `overrides.model` là model ghi cứng; D20: bỏ mục sửa prompt; Validation Session 3). Việc triển khai T do agent khác làm.

1. **Thêm `capabilities.<cap>.rigor` (Q1, owner đã chấp nhận)** vào phase 2 của T: một scope sàn chỉ-nâng trong chuỗi merge, cùng thang `rigor`; validator + doctor. Đây là điều chỉnh **bắt buộc** duy nhất.
2. **Bỏ mục phase 4 sửa brainstorm prompt §6.4**: main đã làm việc này ở `cf94a59e8`; giữ lại chỉ gây xung đột merge trên một bản ghi lịch sử.
3. Không cần đổi phạm vi khác. Phần T sửa trong engine (schema FlowDefinition, `session-engine.mjs`, `composers.mjs`, 13 YAML `minTier`→`rigor`) một phần sẽ bị mô hình gọn thay sau, nhưng: engine là thứ đang chạy hôm nay; `rigor` trên step là dữ liệu sống sót khi biểu diễn lại thành preset/Workflow; phần bỏ đi nhỏ. Không nên trì hoãn T để tránh phần này.
4. T giữ tên cũ (`FlowDefinition`, `DemandFacts`…) — đổi tên thuộc plan riêng; T chỉ nên tránh **viết tài liệu mới** quanh các tên sắp bỏ khi có thể (vd `docs/specs/runner.md` D9 nói `rigor` trên "step của Pattern cộng tác" thay vì "step FlowDefinition").

### Sửa trong thiết kế này (đã áp)

- **F15 / Q2**: fable và lead ghi "plan tier chưa phủ `model_tier`" — **đã lỗi thời**: bản T sau red team (`b8df6f780`) đã đưa `scripts/project-agents.mjs` và `core/agents/*.yaml` (`model_tier` → `rigor`) vào phase 1 và 3. Q2 thu hẹp lại: phần còn lại của thiết kế này chỉ là `bind()` trả `model` cho Agent tool khi chạy in-process (thuộc plan `bind()`, không thuộc T).

## 7. Bộ câu hỏi cho owner (một lượt)

0. ~~Q0 engine hay mô hình gọn~~ — **owner chốt 2026-09-30 23:52: mô hình gọn.** Bake-off không còn để quyết lựa chọn; giữ lại làm **ca nghiệm thu + đo mốc** (Lead-active, can thiệp, chất lượng, resume, no-candidate) để chứng minh mô hình gọn đạt G1–G6 và không thua engine, đồng thời là số liệu nền cho Observe.

1. ~~Sàn tier theo capability~~ — **owner chấp nhận 2026-09-30 23:58**: thêm `capabilities.<cap>.rigor` (sàn, cùng thang, chỉ nâng) vào chuỗi merge; đưa vào plan tier như một mục nhỏ (chạm C5 có chủ đích). Bản gốc câu hỏi: 1. **Sàn tier theo capability — chạm quyết định đã chốt C5.** Khẩu vị của anh nói theo loại việc ("review = opus", "research = standard"), nhưng `rigorToTier` là bảng toàn cục; muốn "review luôn opus" thì chỉ còn cách khai `rigor` cao trong YAML mẫu, tức khẩu vị quay lại YAML. Fable đề xuất thêm một scope `capabilities.<cap>.rigor` (sàn, cùng thang, chỉ nâng) vào chuỗi merge đã có. **Em đề xuất: nhận**, đưa vào plan tier như một mục nhỏ. Lựa chọn khác: giữ C5 nguyên, chấp nhận pattern khai rigor.
2. ~~`model_tier`~~ — **owner chấp nhận 2026-09-30 23:58**; **cập nhật 2026-10-01 00:20:** T (bản sau red team) đã phủ phần `model_tier` → `rigor` + `project-agents.mjs` qua `resolveTierModel` (phase 1, 3) — không cần sửa T; phần còn lại (`bind()` trả `model` cho Agent tool in-process) thuộc plan `bind()` (§6c). Bản gốc câu hỏi: 2. **`model_tier` trong `core/agents/*.yaml`** là đường chọn model thứ hai (qua `scripts/project-agents.mjs`, dựa vào `runner.models` sắp bị xoá), plan tier **chưa phủ** (F15). **Em đề xuất: thêm vào plan tier** (vì plan đó xoá `runner.models`, không làm thì gãy), **kèm thay thế**: subagent in-process lấy model từ `bind()` (tham số `model` của Agent tool, tra `modelPolicies.claude[tier]`), không từ agent YAML. Chỉ xoá mà không thay thì đường in-process mất cách chọn model. Lựa chọn khác: để S5 ở đây.
3. **Bake-off engine vs Lead + subagent** trên 2 area trước khi làm S2+. Tốn thêm một lượt smoke; đổi lại biết chắc nên gom engine hay đi đường gọn kiểu herdr-cook-plan. **Em đề xuất: làm.**
4. ~~Red-team cho code~~ — **owner chốt 2026-09-30 23:58: red-team BẮT BUỘC cho code; lead rút đề xuất "tuỳ chọn".** Lead đã đọc sai chính bằng chứng của mình: red-team `failed` 6/6 là **lỗi phân loại** (finding bị ghi thành failure — đang sửa trong plan RunResult classification), không phải red-team vô ích; ngược lại, red-team là checker duy nhất tìm ra finding thật được chấp nhận ở mọi vòng, trong khi reviewer cùng provider đóng dấu (F27). Chi phí thật nhỏ: red-team 6–9 phút/vòng so với producer 22–30 phút/vòng (`.fgos/assignments/asgn_pi_lead_phase01_op_00{1,3,4,6,7,9}`). Nguyên tắc owner: không đạt thì phát hiện càng sớm càng tốt. Hệ quả thiết kế: preset `code-change` = reviewer (khác provider) + red-team **luôn bật** + verify; reviewer và red-team đều chỉ đọc nên **chạy song song** để không cộng thời gian; finding là outcome, không phải failure. Còn mở: có áp cùng mặc định "red-team luôn bật" cho mọi output ghi file ở domain khác (docs…) không — lead nghiêng có, vì cùng nguyên tắc; chờ owner. Bản gốc câu hỏi: 4. **Red-team cho code**: giữ bắt buộc như hiện nay, hay thành red-team tuỳ chọn (tự bật ở `rigor: critical`) giống mọi domain? **Em đề xuất: tuỳ chọn**, vì §6.6 cho thấy chi phí vòng lặp; review khác provider bắt buộc đã giữ chất lượng nền. **Bổ sung 2026-10-01 00:04 (owner):** checker của `reviewed` cấu hình **theo rigor** — đây là khẩu vị (mức 1–2 config), không phải YAML pattern. Dạng đề xuất:

   ```yaml
   patterns:
     reviewed:
       checkersByRigor:          # mức cao ⊇ mức thấp (chỉ cộng dồn)
         low:      [reviewer]
         standard: [reviewer]
         high:     [reviewer, red-team]
         critical: [reviewer, red-team]   # + vòng tối đa / sàn tier cao hơn nếu cần
   capabilities:
     code:implement:
       minCheckers: [reviewer, red-team]  # sàn riêng: code luôn có red-team (Q4)
       verify: npm test
   ```
   - Checker thực tế = `checkersByRigor[rigor]` ∪ `capabilities[cap].minCheckers`; override một lần **không** đụng danh sách checker ở V1 (nhất quán Q6).
   - Docs/marketing (owner còn lưỡng lự): **không cần luật riêng theo domain** — rigor quyết. Mặc định bảng trên: red-team bật từ `high`. K3 (docs, rigor high) → có red-team; việc docs thường (standard) → không. Owner đổi ý chỉ cần sửa bảng.
   - Luật D2 cũ "`critical` → thêm red-team" được thay bằng bảng này (một nơi duy nhất).
5. **Plan tài liệu**: bước 1 chỉ build + smoke trên area mẫu. Chạy phase thật cần anh authorize P4 (P6 còn chặn bởi P4–P5). Anh định authorize P4 ngay khi S1 xong, hay chờ thêm? (Không chặn việc build.)

6. ~~Persona Workflow khoá có bị override đè không~~ — **owner đồng ý 2026-10-01 00:04 (bản gọn): persona do Workflow khoá KHÔNG bị override một lần thay; `bind()` từ chối với thông báo rõ ("persona khoá bởi Workflow X; muốn góc nhìn khác thì sửa Workflow hoặc chạy thêm một unit review riêng"). Không làm tính năng "override thêm checker" ở V1** (chưa có ca thật; YAGNI). Chi phí: một phép kiểm trong `bind()`; lợi ích: không lặng lẽ phá ngữ nghĩa bước của Workflow (cùng loại lỗi G6). Persona không khoá (chỉ khẩu vị mức 1–2) override thay bình thường. Bối cảnh: fable xếp override (mức 4) trên vai do Workflow khai (mức 3) nên người khởi chạy thay được `brand-guardian`; openai: persona khoá không thay được.

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

## 7b. Lộ trình track và việc lẻ (owner duyệt hướng 2026-10-01 00:20–10:00)

"Plan `bind()`" là tên tạm trước đây; tên chính thức trong lộ trình: **P1 Lõi thực thi**.

**Bộ plan đã lập (2026-10-01, `/ak:plan --parallel`):** plan tổng [`plans/261001-0327-request-to-run-track/`](../261001-0327-request-to-run-track/plan.md) + P1 [`…-p1-execution-core`](../261001-0327-request-to-run-p1-execution-core/plan.md), P2 [`…-p2-runnable-plans`](../261001-0327-request-to-run-p2-runnable-plans/plan.md), P3 [`…-p3-workflow-separate-from-work`](../261001-0327-request-to-run-p3-workflow-separate-from-work/plan.md), P4 [`…-p4-discussion-patterns-engine-retirement`](../261001-0327-request-to-run-p4-discussion-patterns-engine-retirement/plan.md), P5 [`…-p5-terminology-sweep`](../261001-0327-request-to-run-p5-terminology-sweep/plan.md). Lập ở mức phase; phase 1 mỗi plan con là "làm tươi"; sóng song song + bảng sở hữu file trong từng plan.

```text
T  Tier/rigor (plan riêng, agent khác đang làm — worktree ~/projects/forgentX-tier-rigor-p01 đã mở phase 1)
 └► P1 Lõi thực thi ──┬► P2 Plan chạy được
                      └► P3 Workflow tách khỏi Work ──► P4 Dạng thảo luận + thu hồi engine ──► P5 Quét thuật ngữ
```

| Plan | Giao | Xoá | Quyết định dùng | Nghiệm thu |
|---|---|---|---|---|
| T | `rigor → rigorToTier → tier → model`; một resolver; sàn `capabilities.<cap>.rigor` (D19) | ~10 khái niệm tier; khối `capabilities.*.overrides` | C5, Q1, Q2 | của T |
| P1 Lõi thực thi | Unit; `bind()` một chỗ (bảng 5 mức, provenance, G6); primitive `fgos run --unit --role`; cổng ghi file (Q9); read-only posture + fallback quota (gộp X); 3 Pattern cộng tác bằng code nhỏ (`reviewed` với `checkersByRigor`, red-team luôn bật cho code); override có scope; RunResult inline; khẩu vị docs | `readOnlyRedirects`, `placement-policy.mjs`, protocol stamp, `dispatch-runs`/`execute` thường, default `claude`, `preferExecutor`, `executors.for`, persona default `code-reviewer` | D1–D7, Q0, Q4, Q6, Q9, X, G1–G6 | **Ca 1**: 2 area docs song song (Lead-active, resume, no-candidate) |
| P2 Plan chạy được | unit trong phase file; driver chung "chạy phase N" mọi domain; prompt tự do ra cùng Unit | DemandFacts, matcher, `form`, `fgos-code-panel`, `fgos-plan-loop`, gate chỉ-code của `fgos-code-change` | D0, (b) `plan.md` | chạy thật một phase plan tài liệu (khi owner authorize — Q5) |
| P3 Workflow tách khỏi Work | Workflow + Workflow run (JSONL) + một runner; plan nhiều phase = Workflow run; `coding/feature` thành Workflow; Work chỉ tham chiếu | tuần tự stage trong `loop.mjs`; `stage` là field Work; profile `Workflow` + `workflow-adapter.mjs` | Q7, quyết định Workflow | smoke Workflow marketing có cổng người (G4b) |
| P4 Dạng thảo luận + thu hồi engine | 12 dạng thảo luận → preset pattern / Workflow; tên `CollaborationPattern` trong code | engine coordination (~21k dòng) sau khi mọi dạng qua nghiệm thu; `FlowDefinition`, `CoordinationProtocol`, Protocol Pack, "objector" | Q8, D3 bổ sung | **Ca 2** architecture advisor → **ca 3** business discussion → các dạng còn lại |
| P5 Quét thuật ngữ | docs/spec dùng một tên mỗi khái niệm | ~800 lượt tên cũ | bảng thuật ngữ | guard test chặn tên cũ |

- P1 chờ T merge (cùng file dispatch). P2 và P3 cần P1; **P2 trước** vì mở use case đang kẹt; P3 sau hoặc gối đầu. P4 cần P1 + P3.
- Mỗi plan: nhánh riêng, mỗi phase một worktree merge vào nhánh plan, xong hết mới merge `main`. Plan con lập chi tiết **khi tới lượt** (kết quả nghiệm thu plan trước có thể đổi plan sau). Một **plan tổng** (umbrella) sẽ giữ bảng này + trạng thái.

**Việc lẻ, ngoài track, làm ngay song song (owner chọn cách b — lead soạn prompt, agent khác làm, 2026-10-01 10:00):**
- [prompt-261001-0955-fix-observe-harness-protocol-count.md](prompt-261001-0955-fix-observe-harness-protocol-count.md) — F12.
- [prompt-261001-0955-fix-test-fixture-store-leak.md](prompt-261001-0955-fix-test-fixture-store-leak.md) — bổ sung prompt gốc chưa ai làm (`plans/260930-0335-measure-runresult-classification-impact/fix-test-fixture-leak-prompt.md`); không đụng session thật đang treo (bằng chứng nền).
- Là **điều kiện cần trước ca nghiệm thu 1**. Hai việc không đụng file của nhau, không phải chờ nhau (mỗi agent một worktree; prompt 1 kiểm bằng fixture tạm vì prompt 2 đổi số liệu store). Xung đột thật duy nhất: prompt 2 với T trên file test dispatch/coordination — giữ diff nhỏ, merge `main` sớm; T merge `main` trước mỗi phase.

## 7d. Góc nhìn layer/component authority (owner duyệt 2026-10-01 10:20)

Nguồn: [layer-authority-map-261001-1020-request-to-run-track.md](layer-authority-map-261001-1020-request-to-run-track.md) (dựng từ code thật, main @ `e36f21c92`). Bảy layer thuộc fgOS (L0–L5, L7) + L6 executor nằm ngoài fgOS + các thành phần ngang.

### Các layer hôm nay (trên → dưới)

| Layer | Thành phần (code thật) | Quy mô | Authority hôm nay | Đích sau track (plan nào đóng) |
|---|---|---|---|---|
| **L0 Bề mặt kích hoạt** | prompt tự do trong session Claude Code; 58 skill `/fgOS:*` (`plugins/fgOS/skills`); skill kit `ak:*`; CLI `fgos` 73 verb (`bin/fgos.mjs`); herdr gateway REST/MCP/dashboard (`herdr-plugin`); daemon `fgos-runner --watch`; hook harness (`.claude/hooks`, PreToolUse ép `dispatch decide`) | `bin/fgos.mjs` 5.155 dòng; `herdr-plugin` ~12,5k dòng Rust | ai/cái gì khởi động một việc | giữ; mọi đường vào hội tụ về Unit (P2) — prompt, plan, Workflow, board |
| **L1 Host và định tuyến lệnh** | Rust host (`fgctl`, release manifest → `components.legacyNode.entry` = `bin/fgos.mjs`); kernel `packages/host-runtime/rust` (`operation_provider_router`, `authority_gate`, `invocation_service`, provider external-process); `src/cli/command-registry.mjs` | host-runtime ~8,3k dòng Rust; catalog native hiện 3 operation **đọc** (`distribution.build.show`, `work.gate-bypass.show`, `observe.metrics`) | operation fgOS nào do component nào (Rust native hay Node) xử lý — **không** chọn agent | không đổi trong track; primitive/`bind()` của P1 thiết kế theo hợp đồng operation của kernel này (điều chỉnh 5) để sau chuyển sang Rust không thiết kế lại |
| **L2 Doctrine / điều phối bằng prose** | `core/skills` (12), `domains/coding/skills` (11), `core/skills/_shared/*` (capability-matching Q0–Q2, executor-dispatch-fallback, catalog), `fgos-routing`, `fgos-coding-driving`, `fgos-code-change`, `fgos-panel` | prose, Lead (LLM) thi hành | hiểu yêu cầu, phân rã, chọn capability/pattern, inline hay dispatch, **dẫn vòng lặp** — authority nằm trong prose | P2: phân rã ra **Unit** (hợp đồng dữ liệu), driver chung; doctrine chỉ còn hướng dẫn hiểu + phân rã; vòng lặp rời prose sang code pattern (P1) và Workflow run (P3) |
| **L3 Work** | `src/state` (work, store, replay, stage-fsm, `workflow-stage-graphs`, frontier…), `src/verbs/state`, `src/intake`, merge (`src/runner/merge.mjs` + `src/verbs/merge`), worktree/claim/main-checkout-lock, Work runner `src/runner/loop.mjs`, fan-out; `domains/*/workflows/*.yaml`, `registry.yaml`; Rust `work-state` (đọc) | state 12,7k + intake 2,1k + merge 3,9k + runner lõi ~5k dòng Node; Rust 1,3k | bản ghi yêu cầu, status/board, lifecycle **và** tuần tự stage của workflow domain | P3: Work chỉ còn bản ghi/board/lifecycle; tuần tự bước + cổng người → **Workflow run** (một runner) |
| **L4 Coordination** | `src/verbs/coordination`, `src/runner/coordination` (`session-engine.mjs` 4.778 dòng), `src/runner/definitions` (FlowDefinition), team-cognition/deliberation; 13 YAML `core/coordination-protocols`; Rust `coordination-state` (đọc) | 6,1k + 14,6k + 2k + 0,9k dòng | phiên cộng tác (vai, pha, visibility, authorize, disposition, close); tự bind executor (`binding.mjs`) | P4: không còn là runtime riêng — dạng thảo luận thành preset Pattern cộng tác (P1) hoặc Workflow (P3); engine thu hồi khi mọi dạng qua nghiệm thu |
| **L5 Dispatch và thực thi** | `src/runner/dispatch`: decide/mechanism; plan/resolve/assignment-policy (chọn executor + tier); `executeAssignment` (cửa chạy, 4 caller); transport/adapter/provider-adapter; confinement; provider-capacity; execution-contract; `dispatch-runs` legacy; `src/verbs/dispatch` | 32k + 0,8k dòng | ai làm, model nào, chạy ở đâu, cách ly, ghi kết quả | T + P1: **một** `bind()` (bảng 5 mức, provenance, G6), **một** cửa chạy (primitive qua `executeAssignment`), read-only là posture; **không phụ thuộc L3** (điều chỉnh 1) |
| **L6 Executor** (ngoài fgOS) | CLI claude / codex / agy / pi; pane herdr; bwrap | — | làm việc thật | chỉ được gọi qua cửa chạy của L5 |
| **L7 Lưu trữ** | `.fgos/events.jsonl` + `state.json` (Work); `.fgos/assignments/*/runs` (RunResult); `.fgos/coordination/sessions`; `.fgos/dispatch-runs` (legacy); `.fgos/observe` | — | sự thật (luật L3 nền tảng: truth ở JSONL) | P1: RunResult một nơi, xoá `dispatch-runs`; P3: thêm store Workflow run; việc lẻ: chặn test rò |
| **Ngang** | config runner (`.fgos/config.json`, global); setup/doctor/distribution (`src/setup` 9,3k + Rust distribution 4,9k); **Observe** (Rust 5,1k, đọc L7); knowledge/doc registry | — | khẩu vị, cài đặt, đo | khẩu vị một nơi (bảng 5 mức); mọi khoá mới qua setup/doctor |

### Chồng chéo authority (đã kiểm trong code)

| # | Vấn đề | Bằng chứng | Plan đóng |
|---|---|---|---|
| A1 | "Ai làm, model nào" rải trên L2, L4, L5 + config | §2 F3–F8; §6 bảng 5 mức | T (tier) + P1 (executor/persona) + P2 (phần prose) + P4 (phần L4) |
| A2 | "Tuần tự bước" có 3 sequencer: L3 (stage FSM + `loop.mjs`), L4 (pha/DAG session), L2 (skill dẫn vòng lặp bằng prose) | `src/state/stage-fsm.mjs`, `loop.mjs`; `session-engine.mjs`, `dag-scheduler.mjs`; SKILL.md | P1 (vòng lặp pattern thành code) + P3 (Workflow run) + P4 |
| A3 | Nhiều cửa chạy ở L5: `executeAssignment` (4 caller), `execute` thường → `dispatch-runs`, `execute --contract`, Agent tool in-process qua hook | F9, F29 | P1 |
| **A4** | **Dispatch (L5) đọc thẳng workflow/stage của Work (L3)** — trái ranh giới đã ghi ("Dispatch … strictly forbids … direct workflow/stage/skill lookups in core", `docs/platform/component-boundary.md` §4) | 4 file dispatch import `src/state/workflow-stage-graphs.mjs`: `assignment-runner.mjs:57`, `operation-choice.mjs:20`, `cli.mjs:21`, `assignment.mjs:51`; `config.mjs`, `cli.mjs` import state Work | P1 (lõi mới không import + guard) + P3 (cắt phần cũ) |
| A5 | Herdr hai vai: bề mặt (L0) và transport thực thi (L5/L6 pane) | `herdr-plugin`; invocation `*-herdr-*` | P1 phase read-only |
| A6 | Hai bộ định tuyến ở L1 (kernel Rust và Node command-registry); writer migration `planned` | `docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md` §4 | không đóng trong track; P1 tuân hợp đồng operation |
| A7 | Nhiều store, không rõ một writer/entity; test rò vào store thật | F13 | hai việc lẻ + P1 |

### Năm điều chỉnh (owner duyệt 2026-10-01 10:20)

1. **A4 vào P1**: lõi thực thi mới (`bind()`, primitive) **không import** `workflow-stage-graphs` hay state Work; guard test kiến trúc một chiều chặn L5 → L3. Phần dispatch cũ còn import do P3 cắt nốt khi stage rời Work.
2. **Tiêu chí "xong" của mọi plan con**: plan **đóng hẳn một mối authority** — sau plan, layer chính của nó có **đúng một chủ** cho mối quan tâm đó; cập nhật `docs/platform/component-boundary.md` (hoặc nguồn chi tiết của nó); có guard test chặn rò ngược. Không "đánh bóng từng layer" trước — L4 và một phần L2 sẽ bị bỏ/chuyển.
3. **A5 vào phase read-only của P1**: quyết pane herdr là transport có confinement hay không dùng cho vai read-only.
4. **A7** do hai việc lẻ + P1 (RunResult một nơi, xoá `dispatch-runs`) đóng.
5. **A6**: primitive và `bind()` thiết kế theo hợp đồng operation của kernel Rust (request/outcome contract, authority policy), để khi chuyển writer sang Rust không phải thiết kế lại.

### Lộ trình nhìn theo layer

| Plan | Layer chính | Mối authority phải đóng (tiêu chí xong) |
|---|---|---|
| T | L5 + config | "model mạnh tới đâu": một chuỗi `rigor → rigorToTier → tier → modelPolicies` |
| P1 Lõi thực thi | L5 (+ config, L7) | "ai làm" một chỗ (`bind()`); "chạy qua cửa nào" một cửa; read-only một posture; L5 không phụ thuộc L3 (lõi mới) |
| P2 Plan chạy được | L2 → dữ liệu | "phân rã thành gì": Unit là hợp đồng dữ liệu duy nhất cho mọi đường vào |
| P3 Workflow tách khỏi Work | L3 | "tuần tự bước + cổng người": một Workflow run; Work chỉ bản ghi/board; L5 hết import L3 |
| P4 Dạng thảo luận + thu hồi engine | L4 | L4 không còn là runtime riêng |
| P5 Thuật ngữ | ngang | một tên mỗi khái niệm |

## 7c. Vì sao engine nặng, và bài học (thảo luận owner 2026-09-30 23:52)

- Engine **không vô nghĩa**: phần nền (`executeAssignment`, claim id nguyên tử, `admitRunAttempt`, posture worktree, RunResult/Observe, `distinctProviderFrom`, governance) được mô hình gọn dùng lại; engine là **đặc tả chạy được** cho các dạng thảo luận (Q8); lần chạy thật của nó là bằng chứng để quyết đúng hôm nay. Thứ bỏ là lớp điều phối ở giữa.
- Vì sao nặng: xây trước cho ca khó nhất (thảo luận nhiều pha, ép visibility, replay/resume) rồi để ca đơn giản đi chung; gộp hai tầng (làm một unit + tuần tự nhiều bước) vào một cơ chế; xây cộng dồn không xoá (mỗi vòng review thêm một lớp bảo vệ — đúng điều RUL11 cảnh báo; agent, kể cả lead, có xu hướng trả lời "làm cho đúng" bằng cách thêm); xây trước khi có người dùng thật; đo lường đến muộn.
- Bài học áp cho track này: **làm gọn trước, đo ngay**; chỉ thêm máy móc khi một ca thật thất bại trên bản gọn, có số liệu; **mỗi lần thêm phải xoá được cái gì đó**; ca khó (architecture advisor) là bài nghiệm thu, không phải lý do để mọi ca gánh chi phí của nó.

## 8. Câu hỏi còn mở

- **Đa dạng góc nhìn**: 2/3 câu trả lời là claude. Nếu gemini/xai có góc nhìn khác (nhất là về P-Y), tổng hợp sẽ cập nhật; nếu anh không chạy thêm, em coi 3 bản là đủ vì đồng thuận khung đã rõ.
- `strength: preferred` có đúng là nguyên nhân rubber-stamp §6.6 — cần đọc log session `documentation-authority-unification--phase-01*`.
- Store session nhiễm: 512 `active`, ~115 test rò (F13) — nên thành một work item riêng (dọn + chặn test ghi store thật).
- Drift doc `fallbackExecutors` (F16); `decide --for review` có ra xai không (F14) — nhỏ, tách riêng.
- `dispatch-runs/claude/1790745191212` kẹt `running`.
