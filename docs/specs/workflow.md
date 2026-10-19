---
area: workflow
updated: 2026-10-20
status: settled — owner duyệt 2026-10-19 12:32 (quyết định ở mục 17)
sources: [agent-workflow-model-owner-direction, workflow-design-intent-and-current-state, agent-workflow-model-council-settled, agent-workflow-model-council-reopen, agent-workflow-model-focused-round, agent-workflow-model-independent-review]
decisions: []
coverage: partial
---

# Spec: Workflow (guide, case, admission)

> **Trạng thái: Settled — owner duyệt spec 2026-10-19 12:32 ("duyệt spec"), quyết định D-ADR0070 (workflow guide + admission ledger; lane AGENT-WF).** Luật mang id `RUL-WF-n` của khu vực này. Các quyết định owner đã trả lời riêng lẻ trước đó được đánh dấu **owner 2026-10-19** (mục 17). D-ADR0070 (workflow guide + admission ledger) supersede một phần 0048 §2 và 0049 §4 của [runner.md](runner.md); 0048 §3 và 0049 §1–3 giữ nguyên. Spec khoá hành vi. **Đã cài trên main** bởi plan [workflow-case-ledger-and-admission](../../plans/261019-1238-workflow-case-ledger-and-admission/plan.md) (lane AGENT-WF; các merge `78b0921d2`, `c3f2567ab`, `b2017d58b`, `f5974213d`, 2026-10-19 đến 10-20): lõi F1–F7, F9, F11, F12; F13 và coding cutover (R2) chưa làm, ghi ở backlog. Hai chỗ cài khác chữ spec: `--activity` bắt buộc đi kèm `--case`; phép kiểm chéo writer id → attempt chưa xây, cửa kiểm reservation và case còn sống thay vào (mục 6, giao thức ngữ cảnh authority, bước 4). Mục 5.1 mô tả code trước cutover. Owner đã chọn ý tưởng tính năng 2026-10-19 12:35 ("đồng ý, chọn theo đề xuất"): F1–F7, F9, F11, F12 là lõi của cutover; F13 sau khi lõi land; F8, F14, F15, F16 hoãn; F10 không thuộc cutover này (mục 15).

Nguồn: hướng owner ([brief-261018-2235](../../plans/reports/brief-261018-2235-agent-workflow-model-owner-direction.md)); nghiên cứu bước 1 ([research-261018-2239](../../plans/reports/research-261018-2239-workflow-design-intent-and-current-state.md)); gói hội đồng đã settle (`unit-run-1792368757620-6e4020ea`); gói reopen trả lời Q1–Q6 (`unit-run-1792374387809-85a2ae93`); review độc lập ([review-261019-0930](../../plans/reports/review-261019-0930-agent-workflow-model-ba-spec.md)); vòng hội đồng tập trung vào phần Rust, đặt tên và cách mang ngữ cảnh case (`unit-run-1792383001628-8dbde4b4`, producer/2 cùng reviewer và red-team của nó); các câu trả lời của owner ngày 2026-10-19 lúc 08:46 và 12:20.

## 1. Mục đích và phạm vi

fgOS chạy nhiều domain (coding hôm nay; marketing, sản xuất video sau này), mỗi domain một kiểu kế hoạch. Owner muốn **agent** thông minh, linh hoạt theo tình huống trước mặt, còn **workflow** trở về đúng ý ban đầu: "một communication guide, một sơ đồ, hướng dẫn tác nghiệp cho một mảng business". Workflow dẫn đường và đặt ràng buộc; nó không phải kịch bản.

Hôm nay ngược lại: một Workflow là DAG các step mà Workflow runner thi hành như "sequencer duy nhất" (0049 §4), nên agent cứng. Quyết định 0049 đóng một lỗ hổng **authority** (ba sequencer chồng nhau), chưa bao giờ cân nhắc độ linh hoạt của agent. Spec này giữ phần authority đó và trả quyền chọn thứ tự về cho agent.

| Phần | Nội dung | Ai mang |
|---|---|---|
| (a) Hướng dẫn tác nghiệp | vai, mốc (milestone), sản phẩm trung gian, khi nào hỏi người, thế nào là xong | Workflow guide |
| (b) Ràng buộc | MUST, SHOULD có lý do, MAY instead | guide + khung được duyệt + guard nền tảng |
| (c) Thứ tự chạy | cái gì trước, cái gì song song | agent đề xuất từng lựa chọn; harness kiểm (c) theo (b) lúc admission và lần nữa tại điểm gây hiệu ứng |

**Workflow hiện tại đã đủ chưa?** Chưa, nhưng không xa. Đã có và giữ: bản ghi run có snapshot guide, event append-only và projection, khoá `advance` theo run, cổng consent đậu theo step, start/resume tách rời, ghế blind, kiểm write-chain cho wave, receipt verify của Unit, hai cửa. Còn thiếu: admission theo ledger, khung được duyệt với hạn mức cộng dồn, milestone gắn subject, sự kiện route/deviation, ràng buộc worktree để một case có ràng buộc không bị "lột" bằng một lời gọi đứng ngoài, và một ledger bền thật (hôm nay không fsync, bộ đọc bỏ qua dòng hỏng). Phải bỏ: dịch máy `--plan`, các trường runner chết trong `feature.yaml`, luật "một Unit hỏng thì cả run hỏng" ở mức case.

**Vì sao "không DSL" khi YAML đã là một DSL?** YAML là một *schema dữ liệu*. Cái bị từ chối là một DSL *tính toán* thứ hai bên trong nó: biểu thức sentry/predicate kiểu CMMN `when: <expr>` do engine diễn giải. Mỗi luật một guide khai là một dòng **gọi tên một kiểm tra đã có** (RUL-WF-7).

### 1.1 Spec này khoá gì, không khoá gì

| Khoá (hành vi, hợp đồng) | Không khoá |
|---|---|
| actor và phép tách authority (mục 3); thực thể và tên id (mục 4); từ vựng (mục 2) | bố cục trường YAML, tên file, tên module, nơi đặt module, khoá cấu hình |
| từ vựng quyết định MUST / SHOULD / MAY instead / unlisted / listed-routes-only | cách đánh vần flag CLI |
| hiệu lực bằng chứng (subject, digest) và L9 | số sáu của catalog như một con số vĩnh viễn |
| catalog MUST đóng cộng mục "unenforced" | ngôn ngữ cài admission (Node hay Rust) |
| N1 và giao thức ngữ cảnh authority (RUL-WF-11), bản ghi ràng buộc worktree (RUL-WF-27) | định dạng nội bộ của Event Store; tên và rank của hàng khoá |
| AdmissionPort do Execution Core sở hữu, Workflow cài (mục 5.2) | chữ ký cụ thể của port |
| đơn vị đếm của khung và trần seat launch giao cho Unit (RUL-WF-12) | auto-advance như một runtime thứ hai |
| `advance` theo Shape C (mục 5.4) | Work là engine, hoặc Work chỉ là projection |
| ledger JSONL được làm cứng tại chỗ (RUL-WF-24) | các phase cài đặt, Size 0/Size 1 như kiến trúc |
| đích supersede một phần: 0048 §2, 0049 §4 (mục 17) | đổi tên file (một bước L10 sau, đề xuất riêng) |
| ranh giới component diễn đạt bằng lời theo manifest (mục 5) | |
| các ví dụ mục 10 như ví dụ khái niệm | |

### 1.2 Bảng tra câu hỏi và quyết định của owner

| Owner hỏi / quyết | Ở đâu |
|---|---|
| 08:46 "đồng ý N1" | RUL-WF-11, mục 17 |
| 08:46 "không mời thêm" | mục 13 (lo ngại giữ thành R1, R3) |
| 08:46 "thêm mục ví dụ vào spec" | mục 10 |
| 08:46 "component boundary/authority" | mục 5 |
| 08:46 "tên runner.mjs anh không nghĩ workflow trong đó" | mục 2.1 |
| 08:46 "tác động tới `fgos run`" | mục 8 |
| 08:46 "có nên chuyển rust không" | mục 5.6 |
| 08:35 "đủ chưa, rework bao lớn" | mục 1, mục 9 |
| 12:20 "ok": N17 = Shape C | mục 5.4, RUL-WF-10, mục 7.4 |
| 12:20 "ok": tên "Playbook proposer" | mục 2.1 |
| 12:20 "ok": ghi file lồng từ worker bị giam thì từ chối, không relay | RUL-WF-11 |
| 12:20 "ok": N1 chỉ ràng hai cửa; ghi trong phiên nằm ngoài ledger; hook là ý tưởng tính năng | mục 1.3, F15 |
| 12:20 "ok": Event Store (F10) không thuộc cutover này; JSONL làm cứng tại chỗ | mục 5.5, RUL-WF-24 |
| "nhớ ghi nhận các note khi nào thay đổi" | mục 14 |

### 1.3 Giới hạn trung thực của N1 (owner 2026-10-19 đã chấp nhận)

N1 ràng **hai cửa thi hành** (`fgos run`, `fgos workflow start`). Nó **không** ràng lời gọi Edit/Write/Agent trong phiên của một agent tương tác: những ghi đó nằm ngoài ledger của case, chỉ còn approve door giữ ở lúc landing. Bằng chứng mở đầu của spec (chuỗi lead 6.4 bỏ qua luật văn xuôi) phần lớn là loại ghi trong phiên, nên **N1 không đóng sự cố đó**. Phương án đóng sau là một hook trước công cụ đọc bản ghi ràng buộc worktree (F15, mục 15), chỉ có ở Claude Code; không cài trong spec này. Cũng vậy: khung chỉ đếm dispatch đã được admit; một `fgos run` chỉ-đọc không gọi tên case thì không chặn được theo cấu trúc; một lời gọi vừa lột ngữ cảnh vừa nhắm worktree chưa từng bị ràng thì nằm ngoài tầm nhìn của ràng buộc (giam bwrap có thể vẫn chặn ghi).

## 2. Từ vựng

### 2.1 Tên các phần (N13 — owner 2026-10-19 chọn "Playbook proposer")

"Runner" hôm nay chỉ ba thứ khác nhau: vòng frontier của Work (`bin/fgos-runner.mjs`, `src/runner/loop.mjs`), Execution Core cộng dispatch (`src/runner/**`), và bộ lập lịch workflow (`src/workflow/runner.mjs`). Bản thân `src/workflow/runner.mjs` gói năm vai (helper ghế/handoff, vòng DAG, helper khoá, nguồn start, các verb của case). Owner nhận xét đúng.

**Quy ước:** trong từ vựng kiến trúc của spec này, từ *runner* đứng một mình không gọi tên vai trò hay component nào; khi trích dẫn tên cũ phải ghi rõ (Work driver loop / Execution Core / Playbook proposer). Các định danh vật lý đang sống — `bin/fgos-runner.mjs`, `src/runner/**`, `src/workflow/runner.mjs`, hàng khoá `runner`, nhánh cấu hình `runner.*`, `docs/specs/runner.md` — giữ nguyên cho tới một bước L10 riêng được owner duyệt. Chữ "sequencer" bị thu hồi cùng 0049 §4.

| Tên trong spec | Nghĩa | Chỗ ở hôm nay (tham khảo, không khoá) |
|---|---|---|
| **Workflow** (component) | sở hữu hai thực thể *guide* và *case*, và phép admission | `src/workflow/**` |
| **Workflow guide** | định nghĩa có phiên bản mà tác giả domain/core sửa | `core/workflows/*.yaml`, `domains/<d>/workflows/*.yaml`; schema `definition.mjs`, `steps.mjs`, `loader.mjs` |
| **Workflow case** | một lần chạy một guide; là ledger | `.fgos/workflow-runs/<id>/events.jsonl`, `store.mjs`, `ref-digests.mjs` |
| **Admission** | một *phép* của Workflow (không phải component): activity được đề xuất có hợp lệ ngay lúc này | chưa có |
| **AdmissionPort** | giao diện do Execution Core khai, Workflow cài, entry tiêm vào | chưa có |
| **Playbook proposer** (bộ đề xuất playbook) | bộ đề xuất của chính harness cho guide mà mọi điểm đều listed-routes-only; đề xuất qua admission, không bao giờ là cửa thi hành | `advanceWorkflowRun` hôm nay |
| **Case verbs** | start, status (projection), answer (gắn digest subject), resume, close (mới) | `fgos workflow start|status|answer|resume` |
| **Execution Core** | Unit, `bind()`, cửa `fgos run`, pattern, confinement, receipt verify | `src/runner/execution/**` |
| **Work driver loop** | vòng chọn Work item; không bao giờ chọn activity bên trong một case | `bin/fgos-runner.mjs`, `src/runner/loop.mjs` |

Tách `src/workflow/runner.mjs` theo năm vai là việc của commit viết lại vòng lặp (mục 9), không phải đổi tên riêng; đổi tên vật lý `src/runner/**` hay `fgos-runner` là ý tưởng F13.

### 2.2 Thuật ngữ mô hình

| Thuật ngữ | Định nghĩa |
|---|---|
| **Milestone** | điều kiện có bằng chứng về một *subject* được khai. Trạng thái chiếu từ event: `unreached`, `achieved(subjectDigest)`, `stale(prior, current)`, `blocked(question)`. Nhiều milestone có thể cùng đúng. "Đã nhận yêu cầu" là một milestone; không có "bước 1". |
| **Subject** | tập artifact được khai của milestone (file, đường dẫn, cây của các đường dẫn đó, hoặc subject ngoài có tên) — không bao giờ là cả nhánh. |
| **Activity** | hành động nghiệp vụ có subject, milestone vào, output dự định, bằng chứng hoàn tất, hiệu ứng được phép. Chạy như một Unit hoặc một wave có giới hạn. Lặp lại là attempt mới, không viết lại lịch sử. |
| **Decision point** | điểm ở một milestone nơi các route được liệt kê: MUST, SHOULD + lý do, MAY instead, chính sách unlisted, cờ `listedRoutesOnly`. |
| **Approved frame** (khung được duyệt) | phạm vi và ngân sách đặt lúc duyệt: kết quả dự định, phạm vi và non-goal, hiệu ứng được phép và điểm consent, rigor floor, hạn mức theo đơn vị đếm được (RUL-WF-12). |
| **Reservation** | phần giữ chỗ admission tạo trước spawn: write path, worktree, bộ đếm khung, trần seat launch, ghế độc lập. Là runtime state cạnh ledger. |
| **Binding** | bản ghi "worktree này thuộc case này" (RUL-WF-27). |
| **Constrained case** | case đang mở có khung được duyệt và ít nhất một binding. |
| **Route / deviation event** | event ledger: decision point, route đã chọn (`should`, `may-instead`, `unlisted`), lý do khi bắt buộc, phiên bản guide, nối với kết quả. |
| **Receipt** | bằng chứng do người đánh giá có tên ghi: verify do harness chạy, verdict reviewer, câu trả lời gate. Văn xuôi của worker không bao giờ là receipt. |
| **Plan** | sản phẩm trung gian đầu vào (ak plan hoặc agent suy ra). Không cấp authority. |
| **Playbook** | guide mà các điểm đều listed-routes-only; MUST thật là độc lập, consent, phụ thuộc đầu vào (`council-lite`, `delphi`, `architecture-advisory`, `content-publish`). |
| **Playbook case / conductor case** | case do Playbook proposer lái / case do một agent điều phối (ví dụ `fgos-cook`) lái. Khác nhau ở cách giữ `advance` (mục 5.4). |
| **Bounded wave** | cam kết chọn-việc mà agent đã chọn thứ tự bên trong (`--units`); không bao giờ là cách hiểu cả case. |

### 2.3 Đối chiếu CMMN (mượn từ vựng, không mượn engine)

| CMMN | Ở đây | Ghi chú |
|---|---|---|
| Case | Workflow case | tồn tại không cần Work |
| Case plan model | Workflow guide | |
| Milestone | Milestone gắn subject | thêm digest và `stale` |
| Sentry (entry criterion) | entry milestone của activity | không có phần `if` dạng biểu thức |
| Exit criterion | **không dùng cho thành công**; thành công là "completion evidence" | exit criterion của CMMN là kết thúc |
| Discretionary task | activity eligible mà agent có thể chọn hoặc không | eligible ≠ bắt buộc |
| Human task | gate consent/input; operation `human-only` | |
| Applicability rule | cột "Why / Do NOT use when" của route table | văn xuôi cho người đọc |

## 3. Actor và quyền

Phép tách authority: **chọn / cho phép / thi hành / chấp nhận.**

| Actor | Chọn | Cho phép | Thi hành | Chấp nhận |
|---|---|---|---|---|
| Owner | duyệt khung, trả lời câu hỏi được gom | — | — | consent ở gate; merge qua approve door |
| Domain steward | duyệt diff guide (SHOULD/MAY); MUST giữ authority cao hơn | — | — | chấp nhận đề xuất thăng/giáng route |
| Agent điều phối (conductor, ví dụ `fgos-cook`) | **chọn** activity và route kế tiếp | — | gọi hai cửa, luôn gọi tên case | — |
| Workflow (case + admission) | không chọn thứ tự (trừ Playbook proposer ở điểm listed-routes-only) | **cho phép** và ghi | — | ghi receipt có còn hiệu lực với subject hiện tại hay không |
| Execution Core | ai làm / model / persona / cơ chế (`bind()`) | thực thi điểm chặn tại cửa và cổng ghi qua AdmissionPort | **thi hành** Unit, pattern, commit trong `writes`, chạy verify | — |
| Người đánh giá có tên | — | — | — | **chấp nhận**: receipt là một event |
| Worker | lập luận bên trong Unit | — | sửa file trong phạm vi | không bao giờ |

## 4. Shared Entities

Bản ghi mới gọi id **bằng tên**, không có trường `runId` trần: `caseId` (hoặc `workflowRunId`), `unitRunId`, `assignmentId`, `attemptId`. Trước đây `unit.json` mang `workflow: {runId, stepId, unitId}` chỉ để truy vết; liên kết nay là `{caseId, activity, reservationId}`, do harness ghi lúc admission (bản ghi cũ vẫn đọc được qua cùng một hàm chuẩn hoá).

| Entity | Nghĩa | Chủ | Ai chạm |
|---|---|---|---|
| Workflow guide | mục đích; vai và cạnh tham vấn; milestone với subject, loại bằng chứng, authority chấp nhận; activity; decision point; bảng MUST và mục unenforced; route table; mặc định khung; tiêu chí đóng | Workflow (schema); domain/core (nội dung) | agent đọc; case pin snapshot |
| Workflow case | khung, binding, reservation, route/deviation, gate answer gắn digest, receipt, projection milestone, close | Workflow | Execution Core qua AdmissionPort; Work qua con trỏ `workflowRunId` |
| Binding | `{caseId, generation, worktreeRoot, commonDir, ref, state}` theo danh tính gốc worktree | Workflow | cửa đọc qua port |
| Unit, Unit run | hợp đồng một lần thi hành; liên kết `{caseId, activity, reservationId}` | Execution Core | Workflow đọc receipt |
| Approved frame | xem 2.2 | Workflow | Execution Core nhận trần seat launch của Unit |
| Work item | bản ghi nghiệp vụ tuỳ chọn: status lifecycle, claim/return, slot, settlement, tail `delivered → retrospective → cleanup → done` | Work Lifecycle | trỏ tới case |
| Plan | đầu vào, không authority | tác giả | conductor đọc như artifact |

## 5. Ranh giới component và authority

### 5.1 Hôm nay (trước cutover; xem dòng "Đã cài" ở đầu spec)

- Hàng **Workflow** ghi "Domain-neutral step & Unit DAG scheduling … Single sequencer for plans, workflows, and multi-unit tasks"; hàng **Work Lifecycle** ghi "Does not own stage or sequencing (owned by Workflow runner)"; hàng **Execution Core**: authority cho ai làm/model/persona/cơ chế, cửa chạy duy nhất, posture confinement, cổng ghi kiểm chứng được.
- **Authority admission hôm nay không nằm ở đâu cả.** Thứ tự do vòng DAG (playbook) hoặc văn xuôi (mọi thứ khác); item coding do claim + step FSM; hook `dispatch-decide` chỉ quyết *cơ chế*.
- Liên kết `workflow` trong `unit.json` chỉ là provenance: cửa không đọc nó để cho hay từ chối gì.

### 5.2 Sau (điều spec khoá)

**Workflow** là authority duy nhất cho: (1) schema guide và snapshot được pin theo case; (2) ledger của case; (3) **admission**; (4) binding worktree và bộ đếm khung. Nó **không chọn thứ tự**. Nó cài AdmissionPort. Nó không bao giờ sở hữu ai làm/model/persona, cổng ghi tại điểm hiệu ứng, việc chạy verify, khoá, danh tính writer, merge hay status Work.

**Execution Core** giữ mọi thứ đang có và **sở hữu giao diện AdmissionPort**, không bao giờ sở hữu quyết định admission:
- port có ba phép hoặc tương đương: phân giải binding của worktree đích, admit một đề xuất, settle một reservation;
- `runUnit` nhận port qua options (cùng hình với cách nó đã nhận policy và đã từ chối trước `bind()` cho operation không khai);
- **mọi** caller `runUnit` có `writes` tiêm port **ngay khi land**: `bin/fgos.mjs` cho `fgos run`, Playbook proposer cho `fgos workflow start`, và các đường Work đang chạy hôm nay (Work driver loop, chọn operation, fanout, `fgos plan --validate`). Với đường Work, port là cài đặt thật của Workflow: tra binding của worktree claim, trả `unbound` khẳng định khi không case nào ràng — không stub. "Khi cutover coding" chỉ còn nghĩa: Unit của Work bắt đầu gọi tên case và activity;
- cài đặt port nhận tuỳ chọn **một lần giữ `advance` đang có**: có thì không bao giờ acquire lại (Playbook proposer gọi `runUnit` trong lúc giữ `advance` suốt đời); không có thì mỗi phép acquire `advance` thử một lần;
- **fail-closed theo cấu trúc:** Unit ghi file (`writes` khác rỗng) tới `runUnit` mà không có port là lỗi; ghi đứng riêng chỉ hợp lệ khi port trả **khẳng định** `unbound`; "thiếu adapter" không bao giờ là `unbound`;
- port được tiêm ở cửa phải **còn có mặt ở cổng ghi** (nơi kiểm lại consent gắn subject lúc hiệu ứng): spec khoá đường tiêm này, không giả định nó tự trôi qua stack; một port rơi mất trong lúc chạy ghế làm phép kiểm thứ hai thành vô hiệu;
- admission chạy **sau khi pattern được giải, trước `bind()`**, vì trần seat launch tính từ pattern.

Đặt admission vào Execution Core đã bị bác (cửa vừa chọn cơ chế vừa phán tính hợp lệ, trái Design Principle 7). Nới test A4 cho một module Workflow cũng bị bác (dạy Execution Core tên module Workflow, trái Design Principle 2).

**Work Lifecycle**: không sở hữu sequencing; authority thi hành và tiến độ của case trên ledger là Workflow; Work giữ status lifecycle, claim/return, slot, settlement và con trỏ `workflowRunId`. Step FSM coding vẫn là authority cho item coding tới cutover (N12).

### 5.3 Phân tầng và hai test phải giữ xanh

- Hướng phụ thuộc module một chiều: **Workflow → Execution Core**. Không file nào trong `src/runner/execution/**`, `src/runner/dispatch/**` hay barrel dispatch import gì từ `workflow/`; test A4 tại `test/architecture.test.mjs` (khối cấm import `workflow/` từ execution/dispatch) giữ nguyên.
- Theo thứ hạng manifest (entry 0 > use-case 1 > infra 2 > domain 3 > kernel 4): **predicate admission, projection và phần cài port ở infra hoặc thấp hơn**; **Playbook proposer và cửa ở use-case**; schema guide ở kernel.
- Mọi import mới mà schema kernel có thêm phải vào danh sách sáu file của test cô lập kernel `test/state/domain-registry-compiled.test.mjs` trong cùng thay đổi.
- A4 phía Work không đổi: ledger của case không phải state của Work.

### 5.4 Holder-lock: `advance` theo Shape C (owner 2026-10-19)

Hôm nay `advance` giữ suốt `advanceWorkflowRun` và kiêm "lease sống" của tiến trình lái tách rời (status báo `running` hay "stale" theo ngưỡng 30 giây; answer/resume chỉ từ chối tiến trình thứ hai khi nó bị giữ). Owner chọn **Shape C**:

- **Conductor case:** `advance` giữ cho đúng một lần reserve hoặc một lần release/settle (reserve-then-release).
- **Playbook case:** Playbook proposer giữ `advance` **suốt đời** vòng lặp của nó; sống/chết của proposer = có người giữ `advance` (như hôm nay, test hiện có giữ nguyên). Đây là **thu hẹp công khai** của reserve-then-release và của song song qua cửa riêng (mục 7.4) cho playbook case.
- Hệ quả của C, chấp nhận có chủ đích: không ai ngoài proposer admit được vào một playbook case đang sống. Mọi dispatch **gọi tên một playbook case đang sống từ bên trong Unit của chính case đó** (ghi hay chỉ-đọc, `fgos run` hay `workflow start` mở case con) bị **từ chối theo tên** (`playbook-case-admits-via-proposer-only`), không chờ — chờ sẽ là vô hạn, vì proposer giữ `advance` trong lúc chờ chính Unit ấy. Dispatch chỉ-đọc lồng không gọi tên case là đứng riêng và không tính vào khung (mục 1.3). Không thêm hàng khoá nào; rank `advance` (80) không đổi. Không playbook nào hôm nay lồng cửa, nhưng doctrine `core/skills/_shared/coordination-driver.md` còn dạy worker gọi cửa: bản viết lại doctrine đó phải theo luật này.
- **`answer` không bao giờ append ledger trực tiếp.** Nó (1) ghi file gate-answer như runtime state (độc quyền theo step, mang digest subject, bất biến sau khi tiêu), rồi (2) thử lấy `advance` một lần: lấy được → append event `gate.answer` và nhả (conductor case; hoặc playbook case không có proposer sống — khi đó đẻ đúng một proposer); bị giữ → trả về, và proposer đang giữ `advance` append event đó ở lần đọc lại kế tiếp (sau mỗi settle và một lần có giới hạn trước khi thoát), **trước** khi hành động theo câu trả lời. Câu trả lời tới ngay lúc proposer thoát được lần `resume` sau nhặt từ file.
- **`status` và `resume` theo loại case.** Playbook case: `running` = có người giữ `advance` (như hôm nay); `resume` đẻ proposer chỉ khi không ai giữ. Conductor case: `running` = còn reservation sống (attempt còn sống); không báo stale, không gợi ý resume chỉ vì `advance` trống; `resume` trên conductor case không đẻ tiến trình lái nào — nó chỉ nhặt file gate-answer chưa ghi vào ledger.
- **Proposer chết không phải là reservation được giải phóng.** Agent và supervisor có thể sống lâu hơn tiến trình điều khiển; reservation ghi file chỉ nhả sau khi attempt/miền chứa im lặng hoặc custody đã settle; proposer kế tiếp nhận các unit run còn sống trước khi thay việc của chúng.
- Bọc proposer thành một attempt dưới Run Supervisor (Shape B) bị bác: attempt lồng attempt, giam lồng giam; giữ làm ý tưởng F14.

### 5.5 Lưu trữ ledger, Event Store, Session Identity

- **Ledger giữ là JSONL dưới `advance` trong cutover này (owner 2026-10-19).** Không đăng ký consumer Event Store, không đổi rank. Làm cứng tại chỗ: append fsync trước khi nhả `advance`; bộ đọc từ chối (fail closed, điều kiện có tên, ví dụ `workflow-ledger-corrupt`) với mọi dòng không rỗng hỏng — hôm nay nó bỏ qua *mọi* dòng hỏng, nên hỏng giữa file làm `seq` trùng; chỉ một dòng cuối chưa kết thúc mới được khôi phục, và chỉ dưới `advance` trong một đường khôi phục tường minh.
- **Nếu F10 được chọn về sau** (owner đã định hình): chỉ *lịch sử bền* của case (mở, binding, route/deviation, gate answer có digest, receipt, milestone, close) được append, **sau** đoạn `advance` ngắn; **không re-rank**; reservation và binding sống **không bao giờ** thành event (chúng là runtime state, vô nghĩa trên máy khác).
- **Session Identity**: không đổi; không mang và không cấp authority; không trường danh tính Rust mới, không đổi envelope.

### 5.6 Có nên chuyển Rust? (N14)

**Không** cho predicate admission, projection và Playbook proposer trong spec này. **Có** cho những gì đã là Rust bên dưới: mutex `advance` (holder-lock), sống/chết process (Process Facts), custody attempt và lọc env (Run Supervisor); Event Store chỉ nếu F10 được chọn.

- Design Principle 4 nói về nền tảng toàn hệ: sự thật kernel một authority. Admission là quyết định đọc schema guide, chuẩn hoá `writes`, hỏi `bind()`; các cộng tác viên đều Node. Port riêng nó thêm một đường nối khác ngôn ngữ trên mọi lời gọi cửa mà không thêm bảo đảm nào, vì các bảo đảm N1 cần (khoá, holder sống, danh tính, append) chính là sự thật nền Rust đã cung cấp.
- RUL104 (tốt hơn, không to hơn): rework mục 9 là đổi hình bên trong `src/workflow` và một cửa; thêm đổi ngôn ngữ nhân đôi bề mặt cutover.
- Khi cửa Execution Core chuyển Rust, **đánh giá lại** nơi đặt admission theo ranh giới port/custody thật, chi phí gọi đo được và việc dùng chung schema. Ngôn ngữ một mình không bao giờ kích hoạt việc dời. Một cửa Rust có thể dùng một port policy Node.

## 6. Business Rules

- **RUL-WF-1 (workflow mang hướng dẫn và ràng buộc; agent sinh thứ tự; harness kiểm).** Guide mang (a) và (b). Agent điều phối đề xuất (c) từng lựa chọn một. Harness admit theo trạng thái đã ghi và kiểm lại tại điểm hiệu ứng. Thứ tự sinh từ điều kiện milestone, không từ số bước.

- **RUL-WF-2 (milestone, không phải số bước; eligible ≠ bắt buộc; song song không cần khai).** Mỗi activity khai milestone vào và milestone nó tạo. Activity có mọi milestone vào `achieved` là eligible; agent chọn chạy hay không. Hai activity eligible có reservation rời nhau chạy đồng thời mà không ai khai song song (giới hạn cho playbook case: mục 5.4).

- **RUL-WF-3 (bẫy danh sách đánh số).** Tác giả viết flow tự nhiên. Khi chuyển thành guide, mỗi cặp bước liền kề được phân loại: *phụ thuộc đầu vào*, *consent*, *độc lập*, *an toàn tài nguyên*, *khuyến nghị tiết kiệm có lý do*, hay *thói quen viết*. Bốn loại đầu thành MUST (khi có guard) hoặc entry milestone; loại năm thành SHOULD + lý do; thói quen bị bỏ. Danh sách đánh số chỉ còn là mô tả đường SHOULD cho người đọc.

- **RUL-WF-4 (từ vựng quyết định, theo RFC 2119).** **MUST / MUST NOT**: nghĩa vụ cứng có lý do, subject, kiểm tra và authority chấp nhận; giữ bằng guard máy hoặc người đánh giá có verdict là event. **SHOULD**: route khuyến nghị kèm lý do; đi khác thì ghi lý do; hỏi người chỉ khi ngưỡng khung nói vậy. **MAY instead**: phương án thay đã duyệt; ghi lựa chọn, không đòi giải thích. Phép thử: "nếu agent đi đường kia, ta có muốn biết vì sao không?" Có → SHOULD; không → MAY instead.

- **RUL-WF-5 (route không có trong danh sách).** Được phép với lời biện minh được ghi, trừ khi điểm mang `listedRoutesOnly`. Vẫn qua mọi MUST, rigor floor, consent, phạm vi ghi và khung; không tự đặt executor hay nới khung. `listedRoutesOnly` là cờ có authority **trên decision point** (không trên milestone, không trong route table — ở đó chỉ là tài liệu) (N9). Projection không bao giờ loại đường đề xuất unlisted (N11).

- **RUL-WF-6 (không có guard thì không có MUST).** Nghĩa vụ cứng không gọi tên được guard máy hay người đánh giá có verdict là event thì viết là SHOULD và liệt kê trong mục **unenforced** của guide.

- **RUL-WF-7 (catalog đóng cho MUST do guide khai; N10).** Sáu primitive khởi đầu:

  | Primitive | Kiểm cái gì |
  |---|---|
  | `milestone-reached` | milestone trước `achieved` cho digest *hiện tại* của subject (không phải cả nhánh) |
  | `human-consent` | câu trả lời gate có approve, gắn digest subject lúc duyệt, kiểm lại khi hiệu ứng xảy ra |
  | `verify-receipt` | verify do harness chạy trên đúng cây/đường dẫn; `verifiedSha` tự khai của worker không phải receipt (0052) |
  | `write-scope-isolation` | `writes` trong khung, rời mọi reservation sống của cùng case; không phủ render slot, quota API hay lease account |
  | `independence-blind` | kiểm trên ledger rằng output ghế đồng cấp không đọc được với activity sau |
  | `frame-allowance` | bộ đếm được giữ chỗ trước spawn, gồm dispatch của conductor và wave lồng |

  Đánh giá ngữ nghĩa trở thành một activity mà receipt verdict được kiểm. Guard nền tảng (G2, floor và khoá persona của `bind()`, `writes` + commit do harness, cổng mutation trong linked worktree, confinement, gate consent và op `human-only`, approve door với Iron Law và verify sau merge, transition lifecycle) được **tham chiếu, không chép lại**. Primitive thứ bảy là một dòng ý tưởng tính năng, không bao giờ là biểu thức YAML.

- **RUL-WF-8 (chủ sở hữu ràng buộc).** Ba tầng: guard nền tảng (code), dòng MUST của domain (guide), giới hạn riêng của case (khung). Tầng hẹp chỉ *thêm* ràng buộc. Hai luật cứng mâu thuẫn thì hành động bị chặn, nêu tên cả hai.

- **RUL-WF-9 (một ledger).** Case là một Workflow run; tồn tại không cần Work. Case pin snapshot guide lúc mở; run đang chạy giữ snapshot khi guide đổi; thay đổi hợp đồng giữa chừng có chủ đích là hành vi của steward, ghi thành event. Sự thật để khởi động lại không cần chat: JSONL + guide được pin + khung còn lại; mọi file tiếp nối khác chỉ là view (L3).

- **RUL-WF-10 (admission theo trạng thái đã ghi; N6 với ngoại lệ Shape C).** Conductor case: admission giữ chỗ (`writes`, worktree, bộ đếm khung, trần seat launch, ghế độc lập) dưới `advance`, rồi nhả khoá; thi hành ngoài khoá; settle append receipt dưới `advance`. Playbook case: cùng các phép đó, nhưng chạy bên trong lần giữ `advance` suốt đời của proposer (mục 5.4). Hai reservation không thể chồng `writes` hay tiêu đôi khung. Không có giao thức CAS. Lời từ chối nêu tên điều kiện chưa thoả; đó là câu trả lời cho agent, không phải câu hỏi cho owner.

- **RUL-WF-11 (ràng buộc authority fail-closed trên dispatch ghi file; N1 — owner 2026-10-19 08:46; giao thức ngữ cảnh — owner 2026-10-19 12:20).** Dispatch ghi file trong một constrained case bị từ chối trừ khi mang authority đã kiểm của case. Giao thức:
  1. **Mỏ neo là ledger, không phải biến môi trường.** Mọi worktree mà activity của case được phép ghi đều có binding (RUL-WF-27). Cửa từ chối trước `bind()` một dispatch ghi file nhắm worktree đã bị ràng mà không mang authority của chính case đó.
  2. **Kiểm hội (conjunctive), không phải "gợi ý đầu tiên thắng".** Gom mọi tín hiệu có: tham chiếu case tường minh, ngữ cảnh case do cửa đặt trong env launch, binding của worktree đích (và, chỉ ở phía host, danh tính attempt). Mọi tín hiệu khác rỗng phải chỉ tới một case đang mở và thống nhất một `caseId`, hoặc được giải thích bằng reservation cha→con đã admit. Mâu thuẫn → `authority-context-conflict`. Id không biết, sai dạng, mơ hồ hay đã đóng trên lời gọi ghi → `authority-context-invalid`, không bao giờ rơi về đứng riêng. Thứ tự ưu tiên chỉ chọn ứng viên để tra; không bao giờ vượt binding đích hay reservation cha. Gọi tên một case hợp lệ khác vẫn cần reservation sống của case đó phủ worktree và `writes`.
  3. **Worktree đã ràng mà không có danh tính dùng được thì từ chối** (`bound-worktree-requires-case-authority`): env bị lột, conductor quên, executor chạy daemon — như nhau. Đứng trong thư mục không phải là admission. Env bị lột không dựng lại được attempt id.
  4. **Phân giải chạy ở cửa phía host.** Tra danh tính attempt (writer id → attempt → unit run → bản ghi Unit → reservation) chỉ là phép kiểm chéo phía host; hai trợ giúp chuẩn cho worker là tham chiếu tường minh và ngữ cảnh do cửa đặt.
  5. **Ngữ cảnh case do cửa đặt, không bao giờ kế thừa.** Cửa ghi id case và reservation vào env launch *từ reservation đã admit*; mọi biến case kế thừa bị lọc bỏ như biến phiên đang bị lọc (nếu không, worker của case A mở case B sẽ trao biến của A cho worker của B). Với executor không truyền env, id case đi cạnh writer id trong cấu hình được tiêm. Không đổi hợp đồng Rust.
  6. **Dispatch ghi file lồng từ một worker bị giam bị từ chối theo tên** (owner 2026-10-19). Worker bị giam thấy ledger chỉ-đọc (gốc `ro`) hoặc bị che hẳn (ghế blind); một view rỗng hay chỉ-đọc không bao giờ là `unbound`. Worker cần một writer con thì xin conductor. Dispatch chỉ-đọc lồng không bị ảnh hưởng. Relay phía host là ý tưởng F16, không cài.
  7. Unit đứng riêng hợp lệ khi port trả `unbound` khẳng định cho worktree đích và không tín hiệu nào chỉ tới case. Dispatch chỉ-đọc không bị N1 ràng; chỉ dispatch đã admit mới tính vào khung; conductor skill có nghĩa vụ gọi tên case ở mọi dispatch, kể cả chỉ-đọc — đây là luật của skill, không phải guard (mục 1.3).
  8. Playbook lồng, wave lồng và fallback provider tiêu khung cha, không nới được.

- **RUL-WF-12 (khung được duyệt và đơn vị đếm).** Khung đặt lúc duyệt (`validateApprove` với coding, `workflow start` với một case, chấp nhận plan với `fgos-cook`). Đơn vị đếm: (a) **Unit admission**: `dispatches`, `mutatingDispatches`; (b) **seat launch**: mỗi lần một ghế được launch, qua mọi vòng pattern và mọi lần thử fallback provider/account. Admission giữ **một lần** trần seat launch của Unit (ghế mỗi vòng × `maxRounds` × trần fallback mỗi ghế) và **giao trần đó cho Unit** như một bound cạnh `timeoutMs`/`maxRounds`; vòng launch ghế dừng ở trần; settle ghi số đã dùng và `frame-exhausted` một lần. **Execution Core không ghi ledger giữa chừng.** Cạn trần thì launch đang chờ không xảy ra; ghế giữ kết cục đã có (provider-limit giữ `fallbackExhausted`; vòng reviewed không launch được producer kế tiếp kết thúc ở đánh giá cuối). Từ `blocked` không dùng cho cạn khung. Sau crash, số dùng chưa chắc vẫn giữ là reserved. Số còn lại không biết thì từ chối dispatch ghi file kế tiếp. Khung mang `rigorFloor`, không `rigorCeiling` (N7; RUL95 (later sources only raise rigor)). Không trần tiền khi lượng dùng không đo được.

- **RUL-WF-13 (milestone gắn subject; N2).** Subject là tập artifact được khai, không phải nhánh. Bằng chứng không bị ảnh hưởng vẫn hiệu lực; thành tựu lịch sử được giữ; hiệu lực tính lại khi subject đổi (`stale`). Digest hiện tại không biết thì fail closed chỉ cho milestone đó. L9 giữ tách: Unit pass, đã tích hợp, đã merge, bền.

- **RUL-WF-14 (consent gắn subject).** Consent chỉ từ câu trả lời gate hoặc approve door. Event approval mang digest artifact lúc duyệt; lúc dùng so lại, lệch thì từ chối. Subject là artifact được duyệt, không phải markdown câu trả lời. Câu trả lời thứ hai không thay được approval đã tiêu (hôm nay file gate-answer bị ghi đè và bộ digest coi nó bất biến; cả hai đổi). Câu trả lời thông tin không thoả cổng consent; im lặng không cấp gì.

- **RUL-WF-15 (receipt verify).** Receipt verify do harness chạy, gắn đúng đường dẫn đã test. Tích hợp là subject mới cần receipt riêng.

- **RUL-WF-16 (độc lập trên ledger; N4).** MUST độc lập là kiểm trên ledger rằng output ghế đồng cấp không đọc được với activity sau. Khi cách mã hoá máy duy nhất là một pattern/wave với ghế blind, việc **đóng gói** đó bắt buộc: admission từ chối dạng không đóng gói và từ chối Unit sau có tham chiếu handoff tới output ghế blind. Admission không theo dõi việc đọc file của worker chỉ-đọc.

- **RUL-WF-17 (hiệu ứng ngoài; N5).** Xác nhận hiệu ứng ngoài (đã đăng, đã phát hành) nằm ngoài catalog: viết là unenforced hoặc receipt của người đánh giá có tên. "MUST NOT publish trước consent trên đúng bản copy này" cưỡng chế được; "đã đăng" thì không. Với coding, approve door cộng `mergedSha` là quan sát landing và vẫn là authority merge.

- **RUL-WF-18 (playbook là guide; không scheduler thứ hai; N3).** Mọi case có một cách hiểu admission. Playbook proposer tự đề xuất SHOULD duy nhất tại điểm listed-routes-only, *vẫn qua admission*. Với bảy playbook thảo luận, thứ tự quan sát được giống hệt hôm nay; khác biệt là bản ghi. MUST độc lập và consent của playbook giữ là MUST cho tới khi được phân loại lại có lý do và có authority.

- **RUL-WF-19 (findings là kết cục, không phải thất bại của case).** Milestone chẩn đoán chấp nhận `findings`; milestone giao hàng cần `pass` cộng receipt hiện hành. "Một Unit ngoài `acceptOutcomes` làm hỏng cả run" chỉ còn bên trong wave đã khai nó.

- **RUL-WF-20 (khi nào hỏi người).** Chỉ khi: thiếu ý định hoặc uỷ quyền thật; mâu thuẫn MUST không hoà giải được; điểm listed-routes-only không route nào khớp; điểm consent; hoặc giới hạn sắp bị vượt (số deviation trước khi hỏi là hạn mức khung). Câu hỏi được gom theo mẫu câu hỏi quyết định; nhánh bị chặn đậu, việc độc lập đã uỷ quyền chạy tiếp.

- **RUL-WF-21 (học từ deviation).** Route/deviation là event ledger. Retrospective so case tương đương theo kết quả đã verify, rework (bao lâu một milestone thành `stale`), số lần ngắt, thời gian/chi phí, sự cố luật. **Tần suất một mình không bao giờ thăng route.** Agent đề xuất diff guide kèm case dẫn và case ngược; steward chấp nhận trong phạm vi uỷ quyền; thay đổi MUST giữ authority cao hơn; run đang chạy giữ guide được pin.

- **RUL-WF-22 (plan là đầu vào).** Plan không cấp authority. Số phase không bao giờ thành MUST; phụ thuộc thật được phân loại theo RUL-WF-3. Dịch máy `--plan` bị thu hồi.

- **RUL-WF-23 (Work là vòng đời nghiệp vụ tuỳ chọn; N12).** Khi case ở trên ledger, authority thi hành và tiến độ là Workflow. Step FSM coding là authority cho item coding tới cutover; cutover chuyển mọi consumer và xoá đường cũ trong một thay đổi (L10).

- **RUL-WF-24 (một cửa ghi ledger, ledger làm cứng tại chỗ).** Mọi lần ghi ledger đi qua đúng một cửa giữ `advance`; file gate-answer và bản ghi binding là runtime state cạnh ledger, không phải lời ghi ledger; append fsync trước khi nhả `advance`; bộ đọc fail closed trên dòng hỏng không rỗng (mục 5.5). Ledger không được khai là consumer Event Store ở spec nào cho tới khi F10 được chọn.

- **RUL-WF-25 (không DSL luật).** Guide là schema dữ liệu khai báo; mọi luật là một dòng gọi tên một kiểm tra đã có. Không biểu thức nào do harness diễn giải.

- **RUL-WF-26 (nội dung tối thiểu của guide).** Mục đích; vai và cạnh tham vấn; milestone với subject, loại bằng chứng, authority chấp nhận; activity với milestone vào, output, hiệu ứng được phép; bảng MUST (mỗi dòng một guard) và mục unenforced; route table (lý do SHOULD, MAY instead, "không dùng khi"); chính sách unlisted theo điểm; mặc định khung và ngưỡng hỏi người; bằng chứng đóng. Guide được bắt đầu nhỏ. Tác giả: owner và agent qua hội đồng kiến trúc, hoặc lượt intake phân loại từng cặp theo RUL-WF-3.

- **RUL-WF-27 (bản ghi binding worktree).** Binding là bản ghi **theo danh tính gốc worktree** (realpath → thiết bị + inode của gốc, như lease `dispatch-cwd`; không theo thư mục con hay cwd tuỳ ý), mang `{caseId, generation, worktreeRoot, commonDir, ref, state}`; nhánh được ghi như trường kiểm toán, không có bản ghi nhánh độc quyền riêng (git đã từ chối checkout một nhánh hai nơi).
  - **Một tên file** theo danh tính worktree. Vòng đời dưới `advance` của case: tạo độc quyền với `state: pending` bên trong + fsync → event `binding` trên ledger + fsync → đổi `state` thành `committed` bằng ghi-tạm-rồi-đổi-tên đè **cùng tên**. Chỉ chủ (khớp `caseId` + `generation`) được ghi đè. Cửa đọc đúng một file. Tạo độc quyền là mutex liên-case; không cần hàng khoá mới.
  - **Thiếu bản ghi = `unbound`** (đường nóng không quét ledger). Bản ghi của case khác đang mở → `worktree-already-bound` (từ chối, không chờ). `pending` khi chưa chắc case còn sống, bản ghi hỏng, hay `generation` lệch → từ chối, không bao giờ `unbound`. Đối chiếu binding với ledger là **đường sửa chữa** (`doctor`/dựng lại view), không ở đường nóng.
  - Ràng lúc start, ở **mọi reservation ghi file**, và khi harness tạo worktree cho Unit trong lúc chạy. Không còn câu "binding rộng bằng `writes`": điều kiện là *không có worktree nào mà activity của case được ghi lại không bị ràng*.
  - Gỡ ràng chỉ sau khi attempt im lặng và chỉ đúng `generation` khớp, để một lần dọn trễ không xoá chủ mới. `close` khi còn attempt sống giữ nguyên độc quyền.
  - Binding là **view dựng lại được** từ ledger (L3); chỗ đặt do plan chọn.

- **RUL-WF-28 (case lồng).** Trừ khung cha là **một đoạn riêng** dưới `advance` của cha (ghi reservation vào ledger cha, nhả), **rồi** mới mở case con; không bao giờ giữ hai `advance` (cùng rank) trong một scope. Case con không mở được thì hoàn khung cha một cách idempotent. Với playbook cha đang sống, case con mở từ bên trong Unit của nó bị từ chối theo tên (mục 5.4); không có đường chờ.

## 7. Luồng (Behaviors)

### 7.1 Mở case

Người gọi `workflow start` trên một guide (hoặc conductor mở case trên guide của domain sau khi đọc plan). Case ghi: snapshot guide, khung (mặc định guide, thu hẹp theo yêu cầu, không nới), binding các worktree đã biết, milestone `request-received` achieved với digest yêu cầu. Trả `caseId` ngay; playbook case có proposer chạy tách rời.

### 7.2 Một chu kỳ admission (conductor case)

1. **Quan sát**: agent đọc `status` (projection): milestone, route liệt kê eligible, đường unlisted, khung còn lại.
2. **Đề xuất**: agent chọn activity và route (`should` / `may-instead` / `unlisted` + lý do khi cần), gọi một trong hai cửa **có gọi tên case**.
3. **Cửa**: giải pattern; phân giải ngữ cảnh authority qua port (RUL-WF-11); từ chối nếu không hợp lệ.
4. **Admission** (dưới `advance`, ngắn): entry milestone với digest hiện tại, consent cho hiệu ứng, MUST độc lập, `writes` rời mọi reservation sống, binding worktree, khung đủ; giữ chỗ; ghi event route/reservation, fsync; nhả khoá.
5. **Thi hành**: `bind()`, pattern, confinement; vòng launch ghế dừng ở trần được giao; commit trong `writes`; verify; cổng ghi kiểm lại consent qua cùng port.
6. **Settle** (dưới `advance`, ngắn): append receipt, số seat launch đã dùng, `frame-exhausted` nếu chạm trần; nhả reservation; projection tính lại.
7. **Thích nghi**: agent đọc lại projection và chọn tiếp.

### 7.3 Song song

Conductor case: hai activity eligible có reservation rời nhau (path, worktree, ghế) và khung đủ được admit lần lượt dưới khoá ngắn rồi chạy đồng thời. Trong một wave, Unit chung chuỗi write-base giữ thứ tự; chỉ Unit không có chuỗi base giữa chúng mới được giữ chỗ cùng lúc. Playbook case: song song chỉ trong những gì proposer tự admit.

### 7.4 Đậu một câu hỏi

Điểm consent, mâu thuẫn MUST, hay giới hạn sắp vượt làm nhánh `blocked(question)`; câu hỏi vào bộ gom. **Conductor case:** các activity eligible khác vẫn được admit qua lời gọi cửa riêng; `answer` ghi file gate-answer, lấy `advance` một lần và append `gate.answer`. **Playbook case (Shape C, thu hẹp công khai):** chỉ proposer admit; trong lúc proposer sống, không ai khác admit được; `answer` ghi file gate-answer, thấy `advance` bị giữ thì trả về; proposer append `gate.answer` ở lần đọc lại kế tiếp rồi mới hành động theo nó (mục 5.4). Câu trả lời consent gắn digest subject; câu trả lời thông tin không mở cổng consent.

### 7.5 Đóng case

`close` từ chối khi milestone kết thúc `stale` hoặc gate consent còn đậu. Đóng khi còn attempt sống không gỡ binding (RUL-WF-27).

**Playbook case tự đóng khi xong (owner 2026-10-19).** Khi một Playbook case chạy tới `workflow.complete` với kết cục `pass`, chính proposer đang giữ `advance` append `case.closed` theo đúng luật của `close` (cùng một hàm: từ chối khi milestone kết thúc `stale`, gỡ binding của attempt đã im lặng, giữ và nêu tên phần còn lại); một case không đóng được vì luật đó vẫn mở. Case fail, blocked hoặc đậu ở gate giữ mở, để `resume` và `answer` còn hoạt động. **Conductor case chỉ đóng bằng `fgos workflow close`**: không có tiến trình nào biết khi nào nó xong.

### 7.6 Khởi động lại không cần chat

Tiến trình lái mới đọc JSONL + guide được pin + khung còn lại + file gate-answer chưa ghi vào ledger; nhận các unit run còn sống trước khi thay việc của chúng. Playbook case: một proposer duy nhất được bảo đảm bởi việc giữ `advance` suốt đời; resume/answer đồng thời chỉ cho đúng một proposer. Conductor case: không có tiến trình lái để khởi động lại; conductor đọc `status` và tiếp tục; `resume` chỉ nhặt file gate-answer (mục 5.4).

### 7.7 Vòng học

Retrospective đọc route/deviation event → agent đề xuất diff guide kèm bằng chứng và phản chứng → steward chấp nhận → guide có phiên bản mới; case đang chạy giữ bản cũ.

## 8. Tác động lên `fgos run` và `fgos workflow start`

| Trường hợp | Sau thay đổi |
|---|---|
| `fgos run` đứng riêng; port trả `unbound` cho worktree đích; không tín hiệu case | **Không đổi.** |
| `fgos run` chỉ-đọc, gọi tên case | admit không giữ `writes`; tính vào `dispatches`; MUST độc lập vẫn áp |
| `fgos run` chỉ-đọc, không gọi tên case | không chặn được, không tính vào khung (mục 1.3); conductor skill có nghĩa vụ gọi tên |
| `fgos run --writes` của conductor trong phiên owner | gọi tên case ở mọi dispatch; quên tên mà nhắm worktree bị ràng → `bound-worktree-requires-case-authority` trước `bind()` |
| `fgos run --writes` lồng từ worker **bị giam** | **từ chối theo tên** (owner 2026-10-19); worker xin conductor; dispatch chỉ-đọc lồng không đổi |
| dispatch ghi file với tín hiệu mâu thuẫn hoặc case đã đóng/không biết | `authority-context-conflict` / `authority-context-invalid` |
| `fgos workflow start <playbook>` đứng riêng | mở playbook case; Playbook proposer giữ `advance` suốt đời, đề xuất SHOULD duy nhất qua admission; thứ tự quan sát được giống hệt; mọi run đã lưu là playbook nên đây là đường **không được hồi quy** |
| `fgos workflow start --units` | giữ như cam kết chọn-việc kiểm trước. Đứng riêng: case của chính nó. Trong conductor case: wave lồng tiêu khung cha (RUL-WF-28). "Một Unit hỏng → hỏng" chỉ còn nếu wave khai nó |
| `fgos workflow start --plan` | **thu hồi** (L10); `fgos-cook` đọc ak plan như artifact và mở case trên guide coding |
| dispatch gọi tên một playbook case đang sống từ bên trong Unit của nó (ghi hay chỉ-đọc, kể cả mở case con) | **từ chối theo tên** `playbook-case-admits-via-proposer-only` (giá của Shape C, R8) |
| Skill trong phiên lái Work item (RUL94 (a Work driver step runs as a Unit)) và các đường Work khác gọi `runUnit` có `writes` | tiêm port thật ngay khi land; không case nào ràng worktree claim → port trả `unbound`, chạy như trước; tới cutover coding mới gọi tên case và activity |
| Edit/Write/Agent trong phiên khi case đang mở | **ngoài ledger** (owner 2026-10-19 chấp nhận); hook `dispatch-decide` chỉ quyết cơ chế; approve door giữ landing; hook đọc binding là F15 |
| Chi tiêu dưới cửa (vòng pattern, ghế, fallback) | trần seat launch giao cho Unit; settle ghi một lần |
| `fgos workflow answer` khi proposer sống | ghi file gate-answer, thử `advance` một lần, thấy bị giữ thì trả về; proposer append `gate.answer`; không đẻ proposer thứ hai |
| `fgos workflow status` / `resume` trên conductor case | `running` khi còn reservation sống; không gợi ý resume; `resume` chỉ nhặt file gate-answer |
| `fgos workflow operations` / `status` | `operations` thay bằng `status` là projection; thêm `close` (F6) |

**Không đổi tại hai cửa:** vẫn là hai cửa thi hành duy nhất; `bind()` là bên duy nhất chọn ai/model/persona; `writes` + commit do harness; approve door là authority merge; policy confinement phía đọc không đổi; flag không bị spec khoá.

## 9. Kích thước rework — thông tin, không phải plan

| Phần | Xử lý |
|---|---|
| schema guide (`definition.mjs` 499, `steps.mjs` 86, `loader.mjs` 141) | mở rộng vừa: milestone, activity, dòng MUST gọi primitive, decision point, khung, đóng |
| store + digest (`store.mjs` 325, `ref-digests.mjs` 49) | đổi vừa: event kind mới; fold milestone; digest phủ gate answer; **làm cứng**: fsync, bộ đọc fail closed, đường khôi phục dòng cuối |
| vòng `advanceWorkflowRun` (~400 dòng) | **viết lại** thành Playbook proposer đề xuất qua admission; tách `src/workflow/runner.mjs` theo vai trong cùng commit |
| admission + binding (mới, infra) | predicate, cài AdmissionPort, bản ghi binding có generation |
| khoá, nguồn start, verb (~600 dòng) | giữ, sửa nhỏ: bỏ `--plan`; start ghi khung + binding; answer ghi file gate-answer rồi thử `advance` một lần; status/resume phân biệt conductor và playbook case; close mới. Shape C giữ nguyên cách giữ `advance` của playbook |
| `plan-source.mjs` 134 | **xoá** (L10) cùng test và đoạn dạy trong skill |
| `src/runner/execution/run.mjs` 1191 | khai AdmissionPort; nhận port qua options; từ chối Unit ghi file khi thiếu port; admission sau giải pattern, trước `bind()`; trần seat launch như bound |
| confinement/adapters | env case do cửa đặt, biến kế thừa bị lọc; cấu hình tiêm cho executor không truyền env; port còn có mặt ở cổng ghi. Không đổi Rust |
| các caller `runUnit` của đường Work (Work driver loop, chọn operation, fanout, `fgos plan --validate`) | thêm một việc: tiêm port thật ngay khi land; hành vi không đổi khi không case nào ràng worktree claim |
| `bind`, patterns, commit, merge | không đổi |
| 7 YAML playbook (444 dòng) | không đổi ngữ nghĩa; thêm phần đầu nêu MUST và khung |
| `feature.yaml` (168), `content-publish.yaml` (40) | mục 10.2, 10.3 |
| test | test A4 và test cô lập kernel giữ xanh; test runner/units nhắm lại; test playbook thảo luận pass nguyên; battery mục 11 thành test mới |

**Tổng:** vừa và tập trung. Không có cutover Event Store, không đổi registry khoá, không đổi Rust. Phần duy nhất **không đo được** là cutover coding (R2).

## 10. Ví dụ minh hoạ trước → sau

> **Tên trường trong các phác thảo chỉ để minh hoạ. Spec không khoá bố cục YAML.** Điều được khoá là hành vi quan sát được mô tả sau mỗi phác thảo.

### 10.1 `core/workflows/council-lite.yaml`

**Trước** (47 dòng): một step `discussion`, một unit `deliberate` (`capability: delphi:propose`, `pattern: panel`, `blind: true`, ba roleTask panelist + synthesizer, contextRefs tới ba file posture). Vòng DAG chờ Unit, ghi `workflow.complete`. Thứ tự "ý kiến blind trước tổng hợp" nằm trong pattern panel; không gì trong run nói *vì sao*.

**Sau** (phác thảo):

```yaml
id: council-lite
kind: playbook            # mọi decision point listedRoutesOnly trừ khi điểm đó nói khác
milestones:
  - id: request-received   # subject: văn bản yêu cầu
  - id: positions-settled  # subject: ba report panelist
  - id: verdict-settled    # subject: report synthesizer
activities:
  - id: deliberate
    entry: [request-received]
    produces: [positions-settled, verdict-settled]
    unit:                  # giữ nguyên template hôm nay
      capability: delphi:propose
      pattern: panel
      blind: true
      contextRefs: [core/agents/council-assumptions.yaml, core/agents/council-ship-maintain.yaml, core/agents/council-feedback-loops.yaml]
      params: { members: 3, roleTasks: { panelist-1: ..., panelist-2: ..., panelist-3: ..., synthesizer: ... } }
must:
  - id: independent-positions
    guard: independence-blind      # đóng gói một Unit panel với ghế blind là bắt buộc
    subject: positions-settled
    reason: một ghế đã đọc ý kiến ghế khác thì không còn là một lăng kính độc lập
closure: [verdict-settled]
frameDefaults: { dispatches: 1, mutatingDispatches: 0, seatLaunchesPerDispatch: 4, fallbackPerSeat: 2 }
```

**Một run sau thay đổi:** `workflow start council-lite` mở playbook case; Playbook proposer giữ `advance`, đề xuất `deliberate`; admission giữ 1 dispatch và trần 4 × 2 = 8 seat launch giao cho Unit; Execution Core chạy đúng Unit panel đó; settle ghi receipt, số launch đã dùng, `positions-settled` và `verdict-settled` achieved với digest report; close thành công; proposer nhả `advance`.

**Khác biệt quan sát được:** status hiện milestone kèm digest; run **không thể** tái tạo bằng ba `fgos run` tuần tự cộng lời thứ tư đọc chúng, vì `independence-blind` biến Unit panel đóng gói thành dạng duy nhất được admit; câu trả lời gate thứ hai không thay câu đã tiêu; khung từ chối dispatch ghi file. **Không đổi:** template, file posture, roleTask, ghế blind, start tách rời, cách giữ `advance`, ý nghĩa tám run đã lưu.

### 10.2 `domains/coding/workflows/feature.yaml`

**Trước** (168 dòng): sáu step (discovery, exploring có gate người, planning, executing, integrate, approval gate), mỗi step mang *hai* từ vựng: Work lifecycle (`phase`, `skill`, `operations`; `transitions`, `aliases`, `statusSkills`) và runner (`units`, `dependsOn`, `gate`, `kind: integrate`). Runner chưa bao giờ chạy file này; item coding đi qua nó bằng Work step FSM.

**Phân loại cặp liền kề** (RUL-WF-3):

| Cặp | Loại | Kết quả |
|---|---|---|
| discovery → exploring | khuyến nghị có lý do | SHOULD khi discovery thấy mơ hồ; MAY instead → planning khi phán `clear` |
| exploring → planning | phụ thuộc đầu vào | planning cần `decisions-locked` |
| planning → executing | consent + receipt | MUST: verdict validate-plan và consent `validateApprove` gắn digest artifact quyết định |
| executing → integrate → approval | receipt + consent | MUST: receipt con trên đường dẫn đã test, receipt tích hợp trên cây tích hợp (subject mới), consent gắn cây đó; merge ở approve door |
| review-item, scout-blast-radius, resolve-question, scoped-subtask, fix-verify-red | — | không là step: activity eligible khi milestone vào đúng |

**Sau** (phác thảo; phần lifecycle **tách ra, không xoá** — N12, N16):

```yaml
id: coding/feature
kind: guide
#-- Phần Work lifecycle: GIỮ tới cutover coding; được đọc hôm nay bởi schema steps cho Work driver loop,
#-- chọn operation và kiểm operation hợp lệ của Assignment. Chỉ bỏ các trường runner trên mỗi step.
steps:
  - { id: discovery, phase: discover, skill: fgos-coding-discovering, operations: [ ...giữ nguyên... ] }  # bỏ units
  - { id: exploring, phase: discover, skill: fgos-coding-exploring,   operations: [ ...giữ nguyên... ] }  # bỏ dependsOn, units, gate
  - { id: planning,  phase: plan,     skill: fgos-coding-planning,    operations: [ ...giữ nguyên... ] }  # bỏ dependsOn, units
  - { id: executing, phase: execute,  skill: fgos-coding-implement,   operations: [ ...giữ nguyên... ] }  # bỏ dependsOn, units
  # hai step chỉ-của-runner 'integrate' và 'approval' bị bỏ: không phase, không skill, không operation, chưa từng chạy
transitions: [ {from: discovery, to: exploring}, {from: discovery, to: planning}, {from: exploring, to: planning}, {from: planning, to: executing} ]
aliases: { decompose: planning }
statusSkills: { retrospective: { skill: fgos-coding-knowledge, taskSpec: compound-learn } }
#-- Phần guide: THÊM cạnh phần lifecycle; chưa reader nào dùng cho tới cutover
milestones:
  - id: request-received
  - id: decisions-locked   # subject: artifact quyết định; chấp nhận: consent gate hoặc verdict discovery 'clear'
  - id: plan-validated     # subject: plan.md; chấp nhận: verdict validate-plan (reviewed) + consent validateApprove
  - id: child-verified     # subject: các đường dẫn đã test của con; chấp nhận: verify-receipt
  - id: integrated         # subject: cây tích hợp; chấp nhận: verify-receipt (subject mới)
  - id: approved           # subject: digest cây tích hợp; chấp nhận: consent người
  - id: merged             # guard nền tảng: approve door + mergedSha; không thuộc sáu primitive
activities:                # mỗi activity gọi tên operation nó sẽ thay lúc cutover
  - { id: judge-ambiguity, operation: discovery/judge-ambiguity, entry: [request-received], produces: [decisions-locked], effects: none }
  - { id: lock-decisions,  operation: exploring/lock-decisions,  entry: [request-received], produces: [decisions-locked], effects: none }
  - { id: shape-plan,      operation: planning/shape-plan,       entry: [decisions-locked], produces: [plan-validated],  effects: none }
  - { id: validate-plan,   operation: planning/validate-plan,    entry: [decisions-locked], produces: [plan-validated],  effects: none, unit: { pattern: reviewed } }
  - { id: implement-item,  operation: executing/implement-item,  entry: [plan-validated],   produces: [child-verified],  effects: writes, unit: { pattern: reviewed } }
  - { id: review-item,     operation: executing/review-item,     entry: [child-verified],   produces: [],                effects: none }   # findings là kết cục
  - { id: fix-verify-red,  operation: executing/fix-verify-red,  entry: [plan-validated],   produces: [child-verified],  effects: writes }
  - { id: integrate,       operation: none,                      entry: [child-verified],   produces: [integrated],      effects: writes, unit: { kind: integrate } }
  # resolve-question, scout-blast-radius, scoped-subtask: cùng dạng, entry theo milestone tương ứng
decisions:
  - { at: request-received, should: judge-ambiguity, reason: "một lượt máy rẻ hơn người; nó phán clear/unclear", mayInstead: [lock-decisions] }
  - { at: decisions-locked, should: [shape-plan, validate-plan], reason: "plan đã validate là khung các con chạy dưới đó", mayInstead: [scout-blast-radius] }
  - { at: plan-validated, should: "implement-item cho mỗi con với writes rời nhau", reason: "pattern reviewed bắt hồi quy trước tích hợp", mayInstead: [fix-verify-red, scoped-subtask] }
  - { at: approved, listedRoutesOnly: true }     # cờ có authority chỉ ở decision point
must:
  - { id: no-writes-outside-unit, guard: write-scope-isolation, note: "guard nền tảng, tham chiếu không chép lại" }
  - { id: child-receipt,          guard: verify-receipt, subject: child-verified }
  - { id: integration-receipt,    guard: verify-receipt, subject: integrated, reason: "test trên cây con không chứng minh gì về cây tích hợp (L9)" }
  - { id: consent-before-merge,   guard: human-consent,  subject: approved,   reason: "duyệt cây A không phải duyệt cây B" }
unenforced:
  - { id: tasteful-architecture, becomes: "receipt verdict của review-item", note: "đánh giá ngữ nghĩa là verdict của người đánh giá" }
frameDefaults: { mutatingDispatches: <đặt lúc duyệt từ plan>, seatLaunchesPerDispatch: <tính từ pattern>, fallbackPerSeat: 2, deviationsBeforeAsk: 2 }
closure: [approved]
```

**Một run sau thay đổi (`fgos-cook` trên một ak plan, conductor case):** skill đọc toàn bộ plan, mở case trên `coding/feature` với khung cỡ theo plan; đề xuất `implement-item` cho con API và con docs cùng lúc (gọi tên case) — admission giữ `writes` rời nhau, ràng hai worktree, hai dispatch ghi file; cả hai chạy đồng thời; receipt con docs đưa `child-verified` lên achieved *chỉ cho đường dẫn docs*, nên commit docs không làm receipt con API thành `stale`; `review-item` trả `findings` — case ghi lại, không gì thất bại; `fix-verify-red` được admit; `integrate` tạo subject mới cần receipt riêng; `approved` là consent gắn cây đó; merge là approve door. Phase đánh số 3 chỉ phụ thuộc phase 1 chạy cạnh phase 2. Conductor thử `fgos run --writes` cho con thứ ba nhắm worktree đã ràng mà không gọi tên case → bị từ chối.

**Không đổi:** taskSpec, skill, bảng status Work, approve door, tail; registry biên dịch và `domainSteps()` (discovery, exploring, planning, executing) tới cutover; kiểm operation hợp lệ của Assignment.

**Reader phải đi theo khi bỏ trường runner:** test hợp đồng advisory đọc `steps[].units[]` của validate-plan và implement-item (chuyển hai template sang fixture của test hoặc sang activity); test cô lập kernel (danh sách file chỉ thêm đúng import mới); test domain-registry và doctor check compiled-domain vẫn trả bốn step.

### 10.3 `domains/marketing/workflows/content-publish.yaml` (ngắn)

**Trước:** chuỗi `brief → draft → approval (gate) → publish`; gate người mặc định consent; publish ghi `content/published/**`.

**Sau:** milestone `brief-ready`, `draft-reviewed`, `copy-approved`, `publish-recorded`. Brief → draft là **SHOULD** ("nghiên cứu khán giả giảm rework"), **MAY instead** đi thẳng draft khi cập nhật nhỏ. MUST `human-consent` gắn **digest của đúng bản copy** trước activity publish; MUST `write-scope-isolation` trên Unit publish cục bộ. "Nội dung đã lên kênh ngoài" là dòng **unenforced** (RUL-WF-17). Sửa copy sau khi duyệt làm `copy-approved` thành `stale`; publish bị từ chối tới khi duyệt lại.

## 11. Acceptance battery

### 11.1 Kịch bản quan sát được

1. **Hai writer va nhau**: bị từ chối lúc giữ chỗ, không phải phát hiện ở approve.
2. **Worker tự nhận đã được duyệt**: consent chỉ từ gate answer hoặc approve door.
3. **Test pass trên cây cũ**: receipt gắn đường dẫn đã test; tích hợp là subject mới.
4. **Artifact đã duyệt bị đổi**: so digest lúc dùng thì từ chối.
5. **Fallback cạn hạn mức**: khung gồm dispatch của conductor và wave lồng; số còn lại không biết thì từ chối dispatch ghi file; câu hỏi quyết định được gom.
6. **Route unlisted vi phạm MUST**: đề xuất được; hành động vi phạm bị từ chối.
7. **Gate đậu một nhánh của conductor case**: activity eligible khác vẫn được admit qua lời gọi riêng.
8. **Findings không kèm giao hàng**: không case nào hỏng vì một Unit findings.
9. **Khởi động lại không chat**: sự thật là JSONL + guide + khung; nhận unit run còn sống. Playbook case: `status` báo `running` khi có người giữ `advance`. Conductor case: `status` báo `running` khi còn reservation sống dù `advance` trống quá 30 giây, không gợi ý resume; `resume` không đẻ tiến trình lái.
10. **Guide đổi giữa run**: run giữ snapshot.
11. **Lột ngữ cảnh**: conductor trong phiên owner, và worker có shell con đã unset mọi biến, mỗi bên `fgos run --writes` nhắm worktree đã ràng mà không gọi tên case: cả hai bị từ chối trước `bind()` chỉ nhờ binding; executor không truyền env nhận id case do cửa đặt qua cấu hình tiêm.
12. **Không hồi quy playbook**: `council-lite` sinh cùng Unit, ghế blind, thứ tự như tám run đã lưu; bốn ghế launch dưới trần 4 × `fallbackPerSeat`.
13. **Cạn seat launch**: ghế giữ provider-limit với `fallbackExhausted`; settle ghi `frame-exhausted` một lần; bộ đếm khớp ledger; không ghi ledger giữa chừng.
14. **Một proposer**: resume/answer đồng thời cho đúng một proposer; `answer` lúc proposer sống không append ledger; event `gate.answer` xuất hiện trên ledger trước khi proposer hành động theo câu trả lời; câu trả lời lúc proposer đậu không bị bỏ rơi.
15. **`feature.yaml` hai phần**: biên dịch; `domainSteps` trả bốn step; test cô lập kernel pass; test advisory chạy hai template từ activity hoặc fixture.
16. **Hai case ràng một worktree** (kể cả qua hai cách viết đường dẫn): case thứ hai bị `worktree-already-bound`.
17. **Crash giữa các bước binding** (sau `pending`, sau event, trước đổi tên): không bao giờ ra `unbound`; dọn trễ không xoá binding thế hệ mới.
18. **Case lồng** không mở được: khung cha được hoàn, không bao giờ hai `advance` trong một scope.
19. **Ghi lồng từ worker bị giam**: `fgos run --writes` bên trong một ghế bị giam bị từ chối theo tên; `fgos run` chỉ-đọc lồng vẫn chạy.
20. **Tín hiệu mâu thuẫn / case đã đóng**: từ chối với `authority-context-conflict` / `authority-context-invalid`.
21. **Ledger hỏng giữa file**: bộ đọc fail closed với điều kiện có tên; chỉ dòng cuối chưa kết thúc được khôi phục trong đường khôi phục tường minh.
22. **Proposer bị giết khi worker còn sống**: reservation không được nhả; proposer kế tiếp nhận unit run.
23. **Gọi tên playbook case từ bên trong Unit của nó**: `fgos run` (ghi hoặc chỉ-đọc) và `workflow start` gọi tên case đó từ một worker của case bị từ chối ngay với `playbook-case-admits-via-proposer-only`, không treo.
24. **Đường Work có port**: một bước Work driver (RUL94 (a Work driver step runs as a Unit)) có `writes`, worktree claim không bị case nào ràng → port trả `unbound`, bước chạy như trước; cùng bước thiếu port → bị từ chối.
25. **Proposer gọi `runUnit` khi đang giữ `advance`**: admit và settle dùng lần giữ đó, không tự từ chối.
26. **Binding một tên file**: hai case tạo binding đồng thời cho một worktree → đúng một thắng; worktree chưa từng ràng (không có file) → `unbound` mà không quét ledger.

### 11.2 Nghĩa vụ chứng minh cho plan

Test A4 xanh, không import `workflow/` từ execution/dispatch; Unit ghi file thiếu port bị từ chối; ghi đứng riêng chỉ qua với `unbound` khẳng định. Port tiêm ở `fgos run` được quan sát ở cổng ghi trong dispatch lồng. Mọi caller `runUnit` có `writes` hôm nay (cửa, proposer, đường Work) tiêm port thật ngay khi land; đường Work-step có test "có port, `unbound`, chạy như trước". Biến case trong env của controller không bao giờ tới worker mà cửa không admit vào case đó. Thứ tự playbook giữ nguyên trên mọi run đã lưu. Append fsync trước khi nhả `advance`.

## 12. Giữ / đổi / thu hồi

| Giữ | Đổi | Thu hồi cùng cutover (L10) |
|---|---|---|
| hợp đồng Unit; `bind()` và khoá persona; pattern và preset; task-spec; roleGraph; store run và snapshot; khoá `advance` (Shape C); start/resume tách rời; đậu gate; consent vs input; approve door; hai cửa; Work lifecycle | Workflow run: từ kê thứ tự sang admit activity do agent chọn; ledger làm cứng tại chỗ; Execution Core khai AdmissionPort; doctrine driver (`coordination-driver.md`): phán route là của agent, cơ học và cưỡng chế là của harness; 0048 §2 và 0049 §4 bị supersede một phần | dịch máy `--plan`; "một Unit hỏng → cả run hỏng" như luật case; trường runner chết trong `feature.yaml`; cách đọc "coding chạy trên DAG runner" |

**Không đề xuất:** engine CMMN hay XML; dịch vụ policy; chấm điểm hay thăng route tự động; editor trực quan; DSL workflow hay ngôn ngữ predicate; bắt buộc có Work; cửa CLI thứ ba hay `fgos coordination`; CAS `expectedSeq`; cơ sở dữ liệu milestone; trần tiền khi không đo được; adapter marketing/video; port Rust admission/projection; component mới cho admission; framework admission tổng quát; allowlist import tên module workflow; token authority trong env; trường danh tính Rust mới; vòng import giữa cửa và proposer; cutover Event Store hay re-rank khoá trong lane này; hàng khoá lease mới cho proposer; coi thư mục attempt là Event Store stream; dùng lại `blocked` cho cạn khung; ghế chuyên gia ngoài.

## 13. Rủi ro còn lại

| Id | Rủi ro / việc mở | Ai |
|---|---|---|
| R1 | Giao thức ngữ cảnh authority đã đặc tả, chưa chứng minh: port có mặt ở cả hai cửa và cổng ghi; kiểm hội; từ chối worktree đã ràng không danh tính; lọc biến kế thừa; binding có generation sống qua crash ở mọi ranh giới; close khi attempt sống; từ chối ghi lồng từ worker bị giam; tiêm id case cho executor không truyền env; hai cách viết đường dẫn ra một binding | plan (nghĩa vụ chứng minh) |
| R2 | Cutover coding từ Work step FSM sang ledger: hai authority trong giai đoạn chuyển nếu không xoá đường cũ cùng đợt; kích thước chưa đo được | plan sau duyệt |
| R3 | Guide marketing và video bắt đầu với mục unenforced dài | steward domain |
| R4 | Ledger hôm nay không fsync và bộ đọc bỏ qua dòng hỏng (có thể `seq` trùng); sửa tại chỗ trong plan | plan |
| R5 | Fold projection phải tất định khi replay | plan |
| R6 | N13–N17 và R1 đã có ba panelist, một synthesizer, một critique; ghế reviewer của critique chết vì lỗi provider; gói tập trung có một reviewer pass và hai lượt red-team | — |
| R7 | Hạn mức khung chỉ ở đơn vị cưỡng chế được; tiền chưa bị máy giới hạn | — |
| R8 | Giá của Shape C (quyết định owner 12:20), không phải lỗi spec: (1) không ai ngoài proposer admit được vào playbook case đang sống; (2) mọi dispatch gọi tên playbook case từ bên trong Unit của nó — kể cả chỉ-đọc, kể cả mở case con — bị từ chối theo tên, vì chờ sẽ là vô hạn. Doctrine `coordination-driver.md` (worker gọi cửa) phải theo khi viết lại | chấp nhận có chủ đích (owner); viết lại doctrine: làn COOK |
| R9 | Ghi lồng từ worker bị giam bị từ chối; worker playbook cần writer con phải đi qua conductor cho tới khi có relay | chấp nhận có chủ đích (owner) |
| R10 | `visibility.json` báo `unconfined` trong khi launcher là bwrap; consumer tin nó sẽ phán sai. Đóng khi `visibility.json` khớp launcher cho cả ghế bị giam và không bị giam | làn Execution Core |
| Mở | Header `docs/platform/event-store/spec.md` còn ghi "Not started" trong khi ES 06 đã trên main | làn Event Store |

## 14. Điều kiện đảo quyết định

Mỗi dòng: ai quyết, **tín hiệu quan sát được** sẽ mở lại, và nếu mở thì đổi sang gì. Không dòng nào tự đảo; mở lại là một câu hỏi quyết định gửi owner (hoặc làn được nêu), kèm bằng chứng.

| Mục | Ai quyết | Mở lại khi (tín hiệu quan sát được) | Đổi sang |
|---|---|---|---|
| N1 — dispatch ghi file trong case bị ràng fail-closed | owner 2026-10-19 | run thật trong một thời gian dài không có va chạm chéo lời gọi nào và không vượt khung nào chỉ với luật đóng gói một wave | chỉ kiểm tại điểm hiệu ứng, đóng gói MUST chéo lời gọi vào một wave (bất đồng P2-no-admission) |
| S1 — N1 chỉ ràng hai cửa; ghi trong phiên ngoài ledger | owner 2026-10-19 | một sự cố có ghi trong phiên vào worktree đã ràng mà approve door không bắt, hoặc owner chọn F15 | hook trước công cụ đọc binding, từ chối Edit/Write/Agent vào worktree đã ràng khi phiên không gọi tên case (Claude Code) |
| R1 — ghi lồng từ worker bị giam bị từ chối | owner 2026-10-19 | worker playbook thường xuyên phải quay về conductor để có writer con, đo bằng số lần từ chối theo tên, hoặc owner chọn F16 | relay phía host nhận đề xuất từ worker và admit thay nó |
| R1 — binding chỉ theo worktree, nhánh là trường kiểm toán | hội đồng (mặc định) | một sự cố mà việc git từ chối checkout hai nơi không chặn được (ví dụ `git branch -f`, HEAD tách rời ghi vào nhánh của case) | thêm bản ghi danh tính nhánh độc quyền (bất đồng R1-branch-record) |
| R1 — tra attempt id chỉ là kiểm chéo phía host | hội đồng (mặc định) | có reader cho attempt id và giam nhìn được ledger | đưa vào thứ tự chuẩn cho worker |
| N13 — "Playbook proposer"; "runner" đứng một mình không gọi tên gì | owner 2026-10-19 | owner đổi ý khi duyệt; hoặc owner muốn spec khoá nơi đặt module | "Playbook driver"; hoặc đổi tên vật lý theo một bước L10 (F13) |
| N14 — admission/projection/proposer giữ Node; AdmissionPort do Execution Core sở hữu | hội đồng (mặc định) | cửa Execution Core chuyển Rust, **hoặc** chi phí gọi port đo được đáng kể trên đường nóng | *đánh giá lại* nơi đặt theo ranh giới port/custody, chi phí và việc dùng chung schema; ngôn ngữ một mình không kích hoạt |
| N14 — port thay vì nới test A4 | hội đồng (mặc định) | port không truyền được tới cổng ghi mà không làm nặng mọi chữ ký giữa đường | nới test A4 cho đúng một leaf admission (đã bị bác, ghi làm phương án hai) |
| N15/F10 — ledger giữ JSONL, không Event Store trong cutover này | owner 2026-10-19 | một sự cố cho thấy JSONL đã làm cứng dưới `advance` mất hay đảo lịch sử case, **hoặc** owner chọn F10 | lịch sử bền của case vào Event Store, append sau đoạn `advance` ngắn, không re-rank; reservation và binding không bao giờ thành event |
| F10 shape — append sau đoạn, không re-rank | owner 2026-10-19 | append sau đoạn chứng minh để lại khoảng hở lịch sử mà không đóng được bằng đối chiếu | append trong đoạn với re-rank `advance` (làn holder-lock, còn vướng rank seal) — bất đồng N15-substrate |
| N17 — Shape C | owner 2026-10-19 | một bên thứ ba cần admit vào playbook case đang sống, **hoặc** các dispatch gọi tên playbook case từ bên trong Unit của nó phải được admit, đo bằng số lần từ chối `playbook-case-admits-via-proposer-only` hay việc chờ/từ chối thật | Shape A: hàng lease proposer đăng ký trong scope riêng, `advance` ngắn cho mọi case; làn holder-lock đặt tên và rank; Shape A mất hiệu lực nếu làn đó không nhận hàng |
| N17 hệ quả — dispatch gọi tên playbook case từ bên trong Unit của nó bị từ chối | theo owner 2026-10-19 (Shape C) | như dòng N17 | hết hiệu lực cùng Shape C; dưới Shape A các dispatch đó được admit qua đoạn `advance` ngắn |
| Luật `answer` — không append trực tiếp; file gate-answer + thử `advance` một lần | hội đồng (mặc định, theo RUL-WF-24 và Shape C) | nếu N17 chuyển sang Shape A, hoặc một sự cố câu trả lời nằm trong file mà không bao giờ lên ledger | dưới Shape A: `answer` append dưới `advance` ngắn như mọi lời ghi khác |
| Port nhận lần giữ `advance` đang có | hội đồng (mặc định) | nếu N17 chuyển sang Shape A (proposer không còn giữ suốt đời) | bỏ tuỳ chọn; mỗi phép acquire một lần |
| RUL-WF-27 — tạo độc quyền một tên file là mutex liên-case, không hàng khoá | làn holder-lock (authority "ai giữ tài nguyên nào") | làn holder-lock đòi binding là hàng trong registry, **hoặc** filesystem đích không có tạo độc quyền nguyên tử | hàng lease theo worktree trong registry holder-lock |
| RUL-WF-27 — thiếu bản ghi = `unbound`; đối chiếu ledger chỉ ở đường sửa chữa | hội đồng (mặc định) | một sự cố binding bị mất mà case vẫn mở, khiến một ghi đứng riêng lọt vào worktree của case | đối chiếu ledger trên đường nóng cho các worktree có case mở (cần chỉ mục ngược riêng) |
| RUL-WF-28 — trừ khung cha trong đoạn riêng, rồi mới mở case con | luật rank của holder-lock (không thể giữ hai khoá cùng rank trong một scope) | không có | — |
| N17 — bác custody attempt cho proposer (Shape B) | hội đồng (mặc định) | proposer cần adopt/probe như một attempt và chi phí giam lồng được chấp nhận | F14 |
| S6 — trần seat launch giao cho Unit, settle một lần | hội đồng (mặc định) | trần giao trước không giữ được khung qua crash hay fallback dài (bộ đếm lệch ledger) | rút từng seat launch qua port (Execution Core ghi ledger giữa chừng) |
| N10 — catalog MUST đóng, sáu primitive | hội đồng (mặc định) | nhiều hơn vài domain mỗi bên cần một primitive riêng | dạng mở; trước đó mỗi primitive mới là một dòng ý tưởng tính năng |
| N5 — hiệu ứng ngoài unenforced hoặc người đánh giá | hội đồng (mặc định) | một primitive quan sát adapter được chọn và đo (F8) | publish/release thành milestone thật |
| N3 — playbook là guide listed-routes-only, không scheduler thứ hai | hội đồng (mặc định) | một playbook cần route thay thế thật ở một điểm (đo bằng deviation bị từ chối lặp lại) | bỏ `listedRoutesOnly` ở đúng điểm đó với SHOULD + lý do; không bao giờ thêm scheduler |
| N9 — `listedRoutesOnly` chỉ có authority trên decision point | hội đồng (mặc định) | không có | — |
| N2 — subject là tập artifact, không phải nhánh | hội đồng (mặc định) | một subject không khai được thành tập artifact (đo bằng milestone `stale` sai) | subject ngoài có tên với người đánh giá |
| N4 — độc lập trên ledger, đóng gói bắt buộc | hội đồng (mặc định) | có cách mã hoá máy khác cho độc lập ngoài một pattern/wave | bỏ ép đóng gói cho MUST đó |
| N6 — reserve-then-release cho conductor case | hội đồng (mặc định), thu hẹp cho playbook bởi N17 | nếu N17 chuyển sang Shape A | áp đều cho mọi case |
| N7 — `rigorFloor`, không `rigorCeiling` | hội đồng (mặc định) | không có (theo luật rigor chỉ tăng) | — |
| N8 — case không có Work là một Workflow run, dùng `advance`; không khoá thứ ba | hội đồng (mặc định) | không có | — |
| N11 — projection không loại đường đề xuất unlisted | hội đồng (mặc định) | không có (luật unlisted của owner) | — |
| N12/N16 — Work tuỳ chọn; `feature.yaml` giữ phần lifecycle tới cutover | hội đồng (mặc định) | cutover coding land | xoá phần lifecycle trong cùng thay đổi (L10) |
| Không pilot trước engine | hội đồng (mặc định) | owner muốn giao hàng bắt đầu bằng các đối tượng nhỏ trước khi nối admission (bất đồng P2-pilot-first) | đổi trình tự giao hàng, không đổi mô hình |
| Bác CMMN đầy đủ | hội đồng (mặc định) | nhu cầu trao đổi hay công cụ với bên ngoài được chứng minh | engine CMMN |
| D-ADR0070 (workflow guide + admission ledger) — supersede một phần 0048 §2, 0049 §4 | owner 2026-10-19 (duyệt spec 12:32) | bằng chứng mới cho thấy agent chọn thứ tự làm mất authority mà 0049 đã đóng (ví dụ hai bên cùng quyết thứ tự cho một case) | một record mới supersede D-ADR0070 (workflow guide + admission ledger); không sửa tại chỗ |
| R10 — theo dõi `visibility.json` | làn Execution Core | `visibility.json` khớp launcher cho cả hai loại ghế | đóng mục |

## 15. Ý tưởng tính năng (RUL104 (tốt hơn, không to hơn) — owner đã chọn 2026-10-19 12:35)

| # | Ý tưởng | Vấn đề thật (bằng chứng) | Lợi ích | Owner chọn (2026-10-19) |
|---|---|---|---|---|
| F1 | Projection milestone gắn subject (digest; gate và receipt gắn hash) | `dependsOn` chỉ thấy step xong; duyệt A không phải duyệt B; bộ digest bỏ qua gate answer | route thích nghi không dùng bằng chứng cũ; một fold trong store sẵn có | **chọn** — lõi của cutover này |
| F2 | Khung với hạn mức cộng dồn, trần seat launch giao cho Unit | hạn mức mỗi Unit reset khi conductor mở thêm Unit | tự chủ có giới hạn qua retry, fallback, wave lồng | **chọn** — lõi của cutover này |
| F3 | AdmissionPort + giao thức ngữ cảnh authority + binding (N1, luật owner đã chấp nhận) | run id tuỳ chọn là đúng kiểu hỏng của chuỗi 6.4 | authority kế thừa thành thật; vẫn hai cửa | **chọn** — lõi của cutover này |
| F4 | Event route/deviation; SHOULD/MAY có cấu trúc | không bản ghi nào nối mặc định, lý do, kết quả | audit và học không cần dịch vụ chấm điểm | **chọn** — lõi của cutover này |
| F5 | "Không guard, không MUST" với mục unenforced | MUST văn xuôi đã trượt ba lần | khoảng trống lộ lúc viết | **chọn** — lõi của cutover này |
| F6 | `status` như projection, verb `close` | case thích nghi không có "mọi step xong" | một chỗ đọc điều gì hợp lệ bây giờ | **chọn** — lõi của cutover này |
| F7 | Reserve-then-release cho conductor case | giữ `advance` suốt thi hành cấm song song | song song-khi-eligible không cần CAS | **chọn** — lõi của cutover này |
| F8 | Primitive quan sát adapter cho hiệu ứng ngoài | sáu guard không thấy ngoài repo | publish/release thành milestone thật; **hoãn** | **hoãn** — mở lại theo điều kiện ở mục 14 |
| F9 | Thu hồi `--plan`, trường runner chết, "một Unit hỏng → hỏng case" | hai mô hình một từ; dịch `writes` rỗng không an toàn | ít trường, một mô hình | **chọn** — lõi của cutover này |
| F10 | Lịch sử bền của case vào Event Store (hình dạng owner đã định ở mục 5.5) | JSONL không fsync, không chia sẻ máy | bền và lịch sử liên máy không dời lease; **không thuộc cutover này** | **không thuộc cutover này** (owner 2026-10-19 12:20) |
| F11 | Làm cứng JSONL tại chỗ (fsync, bộ đọc fail closed) | bộ đọc bỏ qua mọi dòng hỏng, `seq` trùng | đúng bằng chứng, không substrate mới — owner đã chọn cho cutover này | **chọn** — lõi của cutover này |
| F12 | Tách `src/workflow/runner.mjs` theo vai trong commit viết lại | một file năm vai | đọc và review dễ; không tốn thêm | **chọn** — lõi của cutover này |
| F13 | Đổi tên vật lý `fgos-runner` / `src/runner/**` | "runner" chỉ ba thứ | dễ tìm; một bước L10 sau | **sau khi lõi land** — một bước L10 riêng |
| F14 | Proposer như attempt có giám sát (Shape B) | không adopt/probe được proposer | đổi lại một loại launch không phải agent và giam lồng | **hoãn** — mở lại theo điều kiện ở mục 14 |
| F15 | Hook trước công cụ (Edit/Write) đọc binding | ghi trong phiên nằm ngoài ledger (mục 1.3) | đóng lớp sự cố 6.4 cho Claude Code; codex/pi/omp/agy không có hook | **hoãn** — mở lại theo điều kiện ở mục 14 |
| F16 | Relay phía host cho dispatch lồng từ worker bị giam | gốc chỉ-đọc và mặt nạ tmpfs làm admission trong worker bất khả | worker playbook có writer con không qua conductor | **hoãn** — mở lại theo điều kiện ở mục 14 |

## 16. Bất đồng được giữ nguyên (không lấy trung bình)

| Nhãn | Người giữ | Lập trường | Vị trí của spec |
|---|---|---|---|
| P2-no-admission | panelist 2 | không có bước admission; chỉ kiểm tại điểm hiệu ứng; đóng gói MUST chéo vào một wave; xây admission chỉ khi pilot thấy trượt | bác như hợp đồng production (owner chấp nhận N1); giữ làm áp lực khống chế; không tuyên bố panelist 2 đồng ý |
| P2-pilot-first | panelist 2 | pilot khung-văn-xuôi trước engine | owner gặp ở plan |
| P2-coding-cutover | panelist 2 vs panelist 1, 3 | dời coding sang ledger là cutover có rủi ro | N12, N16; R2 |
| P3-corrections | panelist 3 | flag run tuỳ chọn, CAS, stale toàn nhánh, auto-advance, `rigorCeiling` | bác hoặc thu hẹp; không tuyên bố đồng ý |
| P3-catalog-count | panelist 3 vs panelist 1, 2 | đóng băng sáu primitive vs catalog mở | N10 |
| N15-substrate | panelist 1 (và framing) | Event Store là substrate dự định, re-rank khoảng 65 với reservation và event trong một đoạn | hoãn, không bỏ; owner đã chọn hình append-sau-đoạn nếu F10 mở |
| N15-no-events-for-reservations | panelist 2 | reservation không bao giờ là event; không bao giờ re-rank | được nhận làm luật tách của F10 |
| N17-shape-A | producer vòng tập trung (khuyến nghị A); panelist 3 (hàng lease rank 15 là cơ chế duy nhất) | lease proposer đăng ký, `advance` ngắn cho mọi case, lời N17 "không bao giờ suy từ `advance`" giữ đúng | owner chọn C; A là điều kiện đảo ở mục 14 |
| N13-driver-vs-proposer | panelist 1, 3, synthesizer, critique | giữ "Playbook driver" | owner chọn "Playbook proposer" |
| R1-branch-record | panelist 1, 3 | bản ghi danh tính nhánh độc quyền riêng | không làm vòng này; trường kiểm toán; điều kiện đảo ở mục 14 |
| R1-aid-2 | panelist 1, 3 (giữ, phía host) vs panelist 2 (bỏ) | tra attempt id trong thứ tự chuẩn | chỉ là kiểm chéo phía host |
| R1-relay | panelist 2, 3 | relay ghi lồng về host | owner chọn từ chối; relay là F16 |

## 17. Lịch sử quyết định

### D-ADR0070 (workflow guide + admission ledger) — Workflow là guide + ledger admission; agent chọn thứ tự; supersede một phần 0048 §2 và 0049 §4

- **Trạng thái:** **Settled (owner 2026-10-19 12:32, "duyệt spec").** Record chính thức ở "Lịch sử quyết định" của [runner.md](runner.md); mục này là bản tóm tắt trong spec khu vực.
- **Bối cảnh:** 0049 đóng authority sprawl bằng cách để Workflow runner vừa giữ bản ghi vừa *quyết thứ tự*. Phần thứ hai lấy phán đoán về thứ tự khỏi agent, trái với tầm nhìn "trong mềm, ngoài cứng" (2026-09-05) và hướng owner 2026-10-18. Bằng chứng: `coding/feature` chưa từng chạy trên runner; mọi run đã lưu là playbook; chuỗi lead 6.4 cho thấy luật chỉ-văn-xuôi bị bỏ qua ba lần, còn luật máy giữ được.
- **Quyết định:**
  1. **0048 §2** ("driver không tự lập lịch, giao trọn cho Workflow runner") **thành:** agent đề xuất, Workflow case admit và ghi. Driver vẫn không tự merge, không tự cưỡng chế; nó chọn route.
  2. **0049 §4** ("Workflow runner là sequencer duy nhất") **thành:** Workflow là authority duy nhất cho **admission và bản ghi tiến độ**, không phải bên chọn thứ tự. Chữ "sequencer" bị thu hồi.
  3. **Giữ nguyên:** 0048 §3 (consent cần `--approve`); 0049 §1–3 (Work không có stage, Workflow không cần Work, A4).
  4. Mô hình RUL-WF-1 … RUL-WF-28 và các mặc định N1–N17 dưới đây.
- **Hình thức:** record D-ADR0070 (workflow guide + admission ledger) trong "Lịch sử quyết định" của runner.md; 0048/0049 không bị sửa tại chỗ, chỉ mang một dòng trỏ tới D-ADR0070 (workflow guide + admission ledger).

### Các mặc định có tên

| Id | Mặc định | Trạng thái |
|---|---|---|
| N1 | ràng buộc authority fail-closed trên dispatch ghi file trong constrained case (RUL-WF-11) | **owner 2026-10-19** (08:46) |
| N2 | subject = tập artifact được khai | hội đồng; settled cùng quyết định mục 17 |
| N3 | playbook = guide listed-routes-only + tự đề xuất SHOULD duy nhất; không scheduler thứ hai | hội đồng; settled cùng quyết định mục 17 |
| N4 | độc lập trên ledger; đóng gói bắt buộc khi là cách mã hoá duy nhất | hội đồng; settled cùng quyết định mục 17 |
| N5 | hiệu ứng ngoài: unenforced hoặc người đánh giá | hội đồng; settled cùng quyết định mục 17 |
| N6 | reserve-then-release dưới `advance` cho conductor case; không CAS | hội đồng; settled cùng quyết định mục 17; thu hẹp cho playbook case bởi N17 |
| N7 | `rigorFloor`, không `rigorCeiling` | hội đồng; settled cùng quyết định mục 17 |
| N8 | case không có Work là một Workflow run, dùng `advance`; không khoá thứ ba | hội đồng; settled cùng quyết định mục 17 |
| N9 | `listedRoutesOnly` là cờ có authority trên decision point | hội đồng; settled cùng quyết định mục 17 |
| N10 | catalog đóng sáu primitive khởi đầu; guard nền tảng tham chiếu | hội đồng; settled cùng quyết định mục 17 |
| N11 | projection không loại đường đề xuất unlisted | hội đồng; settled cùng quyết định mục 17 |
| N12 | Work tuỳ chọn; FSM coding giữ tới cutover | hội đồng; settled cùng quyết định mục 17 |
| N13 | từ vựng mục 2.1; "runner" đứng một mình không gọi tên gì; **"Playbook proposer"** | tên proposer: **owner 2026-10-19** (12:20); phần còn lại: hội đồng; settled cùng quyết định mục 17 |
| N14 | predicate admission, projection và phần cài port ở Node, tầng infra hoặc thấp hơn; Playbook proposer và cửa ở use-case; AdmissionPort do Execution Core sở hữu; nền Rust bên dưới. (Sửa câu tóm tắt N14 của gói reopen, vốn xếp proposer vào infra hoặc thấp hơn; vị trí của §5.3 bản nháp trước vốn đã đúng.) | hội đồng; settled cùng quyết định mục 17 |
| N15 / F10 | ledger giữ JSONL làm cứng tại chỗ; Event Store không thuộc cutover này; nếu F10 mở: append sau đoạn, không re-rank, reservation/binding không thành event | **owner 2026-10-19** (12:20) |
| N16 | `feature.yaml` giữ phần lifecycle tới cutover, thêm phần guide, chỉ xoá trường runner chết | hội đồng; settled cùng quyết định mục 17 |
| N17 | Shape C: proposer giữ `advance` suốt đời cho playbook case; conductor case giữ theo từng admission; thu hẹp N6/§5.4/§7.4 công khai | **owner 2026-10-19** (12:20) |
| R1 | giao thức ngữ cảnh RUL-WF-11; ghi lồng từ worker bị giam bị từ chối theo tên, không relay | từ chối: **owner 2026-10-19** (12:20); phần còn lại: hội đồng; settled cùng quyết định mục 17 |
| S1 | N1 chỉ ràng hai cửa; ghi trong phiên ngoài ledger; hook là F15 | **owner 2026-10-19** (12:20) |
| Ý tưởng tính năng | F1–F7, F9, F11, F12 chọn (lõi của cutover); F13 sau khi lõi land; F8, F14, F15, F16 hoãn với điều kiện mở ở mục 14; F10 không thuộc cutover này | **owner 2026-10-19** (12:35, "đồng ý, chọn theo đề xuất") |

## 18. Pointers

- Ranh giới component: [../platform/component-boundary.md](../platform/component-boundary.md) (hàng Workflow, Work Lifecycle, Execution Core, Holder-lock — bản sửa nháp đi cùng spec này).
- Spec chủ hiện hành của Workflow và Execution Core: [runner.md](runner.md) (0047, 0048, 0049, RUL84 (one write-scope matcher), RUL89 (workflow start --units), RUL94 (a Work driver step runs as a Unit), RUL95 (dispatch takes generic inputs only)).
- Lifecycle Work và tail phổ quát: [work-state.md](work-state.md) (0027).
- Luật nền: [../platform-foundations.md](../platform-foundations.md) (L1, L3, L5, L9, L10).
- Holder-lock: [../platform/holder-lock/spec.md](../platform/holder-lock/spec.md); Event Store: [../platform/event-store/spec.md](../platform/event-store/spec.md); Run Supervisor: [../platform/run-supervisor/spec.md](../platform/run-supervisor/spec.md); Session Identity: [../platform/session-identity/spec.md](../platform/session-identity/spec.md).
- Test phải giữ xanh: `test/architecture.test.mjs` (khối cấm import `workflow/` từ execution/dispatch), `test/state/domain-registry-compiled.test.mjs` (cô lập kernel).
- Code hiện tại (tham khảo, không khoá): `src/workflow/` (`definition.mjs`, `steps.mjs`, `loader.mjs`, `store.mjs`, `ref-digests.mjs`, `runner.mjs`, `integrate.mjs`, `units-source.mjs`, `plan-source.mjs`), `src/runner/execution/` (`run.mjs`, `unit.mjs`, `bind.mjs`, `patterns/`), `src/runner/dispatch/` (`adapters.mjs`, `cwd-lock.mjs`, `assignment-runner.mjs`, `confinement/`), `core/workflows/*.yaml`, `domains/coding/workflows/feature.yaml`, `domains/marketing/workflows/content-publish.yaml`, `core/skills/_shared/coordination-driver.md`.
- Báo cáo: `plans/reports/brief-261018-2235-agent-workflow-model-owner-direction.md`, `plans/reports/research-261018-2239-workflow-design-intent-and-current-state.md`, `plans/reports/review-261019-0930-agent-workflow-model-ba-spec.md`, `.fgos/assignments/unit-run-1792368757620-6e4020ea/` (settled), `.fgos/assignments/unit-run-1792374387809-85a2ae93/` (reopen), `.fgos/assignments/unit-run-1792383001628-8dbde4b4/` (vòng tập trung).
