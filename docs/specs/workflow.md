---
area: workflow
updated: 2026-10-19
status: draft — đề xuất, chờ owner duyệt; chưa có hiệu lực
sources: [agent-workflow-model-owner-direction, workflow-design-intent-and-current-state, agent-workflow-model-council-settled, agent-workflow-model-council-reopen]
decisions: []
coverage: partial
---

# Spec: Workflow (guide, case, admission)

> **Trạng thái: bản nháp đề xuất (lane AGENT-WF), chưa được owner duyệt.** Mọi luật dưới đây mang id tạm `RUL-WF-n`; id thật được gán khi spec land. Khi spec này mâu thuẫn với [runner.md](runner.md) (quyết định 0048 §2, 0049 §4), runner.md vẫn là luật đang chạy cho tới khi owner duyệt và quyết định thay thế được ghi (mục 16).

Nguồn: hướng của owner ([brief-261018-2235](../../plans/reports/brief-261018-2235-agent-workflow-model-owner-direction.md)), nghiên cứu bước 1 ([research-261018-2239](../../plans/reports/research-261018-2239-workflow-design-intent-and-current-state.md)), gói khuyến nghị đã settle của hội đồng kiến trúc (`unit-run-1792368757620-6e4020ea`), gói reopen trả lời Q1–Q6 của owner (`unit-run-1792374387809-85a2ae93`, round 2, reviewer và red-team đều pass không còn finding), bản giải thích reopen (`unit-run-1792376216726-2b96d8a9`). Checkout được ghim khi viết: `af1f2db2b`.

## 1. Mục đích và phạm vi

fgOS chạy nhiều domain (coding hôm nay; marketing, sản xuất video sau này), mỗi domain một kiểu kế hoạch. Owner muốn **agent** thông minh, linh hoạt theo tình huống trước mặt, còn **workflow** trở về đúng ý ban đầu: "một communication guide, một sơ đồ, hướng dẫn tác nghiệp cho một mảng business". Workflow dẫn đường và đặt ràng buộc; nó không phải kịch bản.

Hôm nay ngược lại: một Workflow là DAG các step mà Workflow runner thi hành như "sequencer duy nhất" (0049 §4), nên agent cứng. Quyết định 0049 đóng một lỗ hổng **authority** (ba sequencer chồng nhau), chưa bao giờ cân nhắc độ linh hoạt của agent. Spec này giữ phần authority đó và trả quyền chọn thứ tự về cho agent.

Một workflow chứa ba thứ phải tách:

| Phần | Nội dung | Ai mang |
|---|---|---|
| (a) Hướng dẫn tác nghiệp | vai, mốc (milestone), sản phẩm trung gian, khi nào hỏi người, thế nào là xong | Workflow guide |
| (b) Ràng buộc | điều phải đúng (MUST), mặc định có lý do (SHOULD), phương án thay thế được duyệt (MAY instead) | Workflow guide + khung được duyệt + guard nền tảng |
| (c) Thứ tự chạy | cái gì trước, cái gì song song | Agent đề xuất từng lựa chọn; harness kiểm (c) theo (b) lúc admission và lần nữa tại điểm gây hiệu ứng |

**Workflow hiện tại đã đủ chưa?** Chưa, nhưng không xa. Đã có và giữ: bản ghi run bền có snapshot guide, event append-only và projection, khoá `advance` theo run, cổng consent đậu theo step, start/resume tách rời, ghế blind, chuyên biệt hoá ghế, kiểm write-chain cho wave, receipt verify của Unit, hai cửa. Còn thiếu: admission theo ledger, khung được duyệt với hạn mức cộng dồn, milestone gắn subject, sự kiện route/deviation, và ràng buộc authority để một case có ràng buộc không bị "lột" bằng một lời gọi đứng ngoài. Phải bỏ: dịch máy `--plan`, các trường runner chết trong `feature.yaml`, luật "một Unit hỏng thì cả run hỏng" ở mức case.

**Vì sao "không DSL" khi YAML đã là một DSL?** YAML là một *schema dữ liệu* (id, template, gate). Cái bị từ chối là một DSL *tính toán* thứ hai bên trong nó: biểu thức sentry/predicate kiểu CMMN `when: <expr>` do engine diễn giải. Guide vẫn khai báo; mỗi luật một guide khai là một dòng **gọi tên một kiểm tra đã có** (RUL-WF-7), không phải một biểu thức harness phải tính.

### 1.1 Spec này khoá gì, không khoá gì

| Khoá (hành vi, hợp đồng) | Không khoá |
|---|---|
| actor và phép tách authority (mục 3); thực thể (mục 4); từ vựng (mục 2) | bố cục trường YAML, tên file, tên module, nơi đặt module |
| từ vựng quyết định MUST / SHOULD / MAY instead / unlisted / listed-routes-only | cách đánh vần flag CLI |
| hiệu lực bằng chứng (subject, digest) và L9 | số sáu của catalog như một con số vĩnh viễn |
| catalog MUST đóng cộng mục "unenforced" | ngôn ngữ cài admission (Node hay Rust) |
| ràng buộc authority fail-closed (N1) | định dạng nội bộ của Event Store |
| đơn vị đếm của khung (Unit admission, seat launch) | auto-advance như một runtime thứ hai |
| đích supersede một phần: 0048 §2, 0049 §4 (mục 16) | Work là engine, hoặc Work chỉ là projection |
| ranh giới component (mục 5) diễn đạt bằng lời theo thứ hạng manifest | các phase cài đặt, Size 0/Size 1 như kiến trúc |
| các ví dụ mục 10 như ví dụ khái niệm | đổi tên file (là một bước L10 sau, đề xuất riêng) |

### 1.2 Bảng tra câu hỏi reopen của owner (2026-10-19 08:46)

| Câu owner | Trả lời ở |
|---|---|
| "đồng ý N1" | RUL-WF-11, mục 16 |
| "không mời thêm" | mục 13 (R1, R3 giữ lo ngại, không mời ghế) |
| "thêm mục ví dụ vào spec" | mục 10 |
| "cần xem xét kỹ component boundary/authority" | mục 5 |
| "tên runner.mjs anh không nghĩ workflow trong đó" | mục 2.1 |
| "cần xem tác động tới `fgos run`" | mục 8 |
| "có nên chuyển rust không" | mục 5.6 |
| "đủ chưa, rework bao lớn" (08:35) | mục 1, mục 9 |

## 2. Từ vựng

### 2.1 Tên các phần (N13)

"Runner" hôm nay chỉ ba thứ khác nhau: vòng frontier của Work (`bin/fgos-runner.mjs`, `src/runner/loop.mjs`), Execution Core cộng dispatch (`src/runner/**`, đặt tên trước khi P1 biến nó thành Execution Core), và bộ lập lịch workflow (`src/workflow/runner.mjs`). Bản thân `src/workflow/runner.mjs` không phải "workflow": nó gói năm thứ trong một file (helper ghế/handoff, vòng DAG, helper khoá, nguồn start, các verb của case). Workflow theo nghĩa owner (guide + ràng buộc) nằm ở schema và các YAML; bản ghi case nằm ở store. Owner nhận xét đúng.

**Quy ước của spec này: chữ "runner" không dành cho phần nào cả. Chữ "sequencer" bị thu hồi cùng 0049 §4.**

| Tên trong spec | Nghĩa | Chỗ ở hôm nay (tham khảo, không khoá) |
|---|---|---|
| **Workflow guide** | định nghĩa có phiên bản mà tác giả domain/core sửa | `core/workflows/*.yaml`, `domains/<d>/workflows/*.yaml`; schema ở `src/workflow/definition.mjs`, `steps.mjs`, `loader.mjs` |
| **Workflow case** | một lần chạy một guide; là ledger | `.fgos/workflow-runs/<id>/events.jsonl`, `src/workflow/store.mjs`, `ref-digests.mjs` |
| **Admission** | quyết định của Workflow case rằng một activity được đề xuất là hợp lệ *ngay lúc này* | chưa có; chỉ có mảnh: kiểm write-chain lúc start, đậu gate trong vòng lặp |
| **Playbook driver** | bộ đề xuất của chính harness cho guide mà mọi điểm đều listed-routes-only | `advanceWorkflowRun` hôm nay |
| **Case verbs** | start (mở case), status (projection), answer (trả lời gate gắn digest subject), resume, close (mới) | `fgos workflow start|status|answer|resume` |
| **Execution Core** | Unit, `bind()`, cửa `fgos run`, pattern, confinement, receipt verify | `src/runner/execution/**` |
| **Work driver loop** | vòng frontier trên Work item | `bin/fgos-runner.mjs`, `src/runner/loop.mjs` |

Đổi tên code và dời file **không** thuộc spec này; nếu làm, đó là một bước L10 (chuyển mọi caller, xoá đường cũ cùng đợt) đề xuất như một dòng RUL104 (tốt hơn, không to hơn) sau khi spec được duyệt (mục 14).

### 2.2 Thuật ngữ mô hình

| Thuật ngữ | Định nghĩa |
|---|---|
| **Milestone** | một điều kiện có bằng chứng về một *subject* được khai. Trạng thái chiếu từ event: `unreached`, `achieved(subjectDigest)`, `stale(prior, current)`, `blocked(question)`. Nhiều milestone có thể cùng đúng. "Đã nhận yêu cầu" là một milestone; không có "bước 1". |
| **Subject** | tập artifact được khai của milestone (file, đường dẫn, cây của các đường dẫn đó, hoặc một subject ngoài có tên) — không bao giờ là cả nhánh. |
| **Activity** | một hành động nghiệp vụ có nghĩa: subject, milestone vào (entry), output dự định, bằng chứng hoàn tất, hiệu ứng được phép. Chạy như một Unit hoặc một wave có giới hạn. Lặp lại là một attempt mới, không viết lại lịch sử. |
| **Decision point** | điểm ở một milestone nơi các route được liệt kê: MUST, SHOULD + lý do, MAY instead, chính sách unlisted, cờ `listedRoutesOnly`. |
| **Approved frame** (khung được duyệt) | phạm vi và ngân sách đặt lúc duyệt: kết quả dự định, phạm vi và non-goal, hiệu ứng được phép và điểm consent, rigor floor, hạn mức theo đơn vị đếm được (RUL-WF-12). |
| **Reservation** | phần giữ chỗ admission tạo ra trước khi spawn: write path, bộ đếm khung, ghế độc lập. |
| **Route / deviation event** | một event trong ledger: decision point, route đã chọn (`should`, `may-instead`, `unlisted`), lý do khi bắt buộc, phiên bản guide, rồi nối với kết quả. |
| **Receipt** | bằng chứng do người đánh giá có tên ghi: receipt verify do harness chạy, verdict của reviewer, câu trả lời gate của người. Văn xuôi của worker không bao giờ là receipt. |
| **Plan** | một sản phẩm trung gian đầu vào (ak plan, hoặc agent suy từ guide): kết quả, quyết định, phụ thuộc thật, thứ tự gợi ý. Không cấp authority nào. |
| **Playbook** | một guide mà phần lớn điểm là listed-routes-only, MUST thật là độc lập, consent và phụ thuộc đầu vào (`council-lite`, `delphi`, `architecture-advisory`, `content-publish`). Không phải scheduler thứ hai. |
| **Bounded wave** | một cam kết chọn-việc mà agent đã chọn thứ tự bên trong (`--units`); được kiểm trước bởi cửa batch; không bao giờ là cách hiểu cả case. |
| **Constrained case** | một Workflow case đang mở có khung được duyệt và ràng buộc worktree/nhánh (RUL-WF-11). |

### 2.3 Đối chiếu CMMN (mượn từ vựng, không mượn engine)

| CMMN | Ở đây | Ghi chú |
|---|---|---|
| Case | Workflow case | tồn tại không cần Work (0049 đã cho phép) |
| Case plan model | Workflow guide | |
| Milestone | Milestone gắn subject | thêm digest và `stale` |
| Sentry (entry criterion) | entry milestone của activity | không có phần `if` dạng biểu thức (RUL-WF-25) |
| Exit criterion | **không dùng cho thành công**; thành công là "completion evidence" | exit criterion của CMMN là kết thúc, dễ lẫn với hoàn tất |
| Discretionary task | activity đủ điều kiện mà agent có thể chọn hoặc không | eligible ≠ bắt buộc |
| Human task | gate consent/input; operation `human-only` | |
| Applicability rule | cột "Why / Do NOT use when" của route table | văn xuôi cho người đọc, không phải biểu thức |

## 3. Actor và quyền

Phép tách authority: **chọn / cho phép / thi hành / chấp nhận.**

| Actor | Chọn | Cho phép | Thi hành | Chấp nhận |
|---|---|---|---|---|
| Owner | duyệt khung, trả lời câu hỏi được gom | — | — | consent ở gate; merge qua approve door |
| Domain steward (owner hoặc người được uỷ) | duyệt diff guide (SHOULD/MAY); MUST giữ authority cao hơn | — | — | chấp nhận đề xuất thăng/giáng route |
| Agent điều phối (conductor, ví dụ `fgos-cook`) | **chọn** activity và route kế tiếp | — | gọi hai cửa | — |
| Workflow case (harness) | không chọn thứ tự (trừ Playbook driver ở điểm listed-routes-only) | **cho phép** (admission) và ghi | — | ghi receipt có còn hiệu lực với subject hiện tại hay không |
| Execution Core | ai làm / model / persona / cơ chế (`bind()`) | thực thi điểm chặn tại cửa và tại cổng ghi | **thi hành** Unit, pattern, commit trong `writes`, chạy verify | — |
| Người đánh giá có tên (receipt verify, reviewer, gate) | — | — | — | **chấp nhận**: receipt là một event |
| Worker | lập luận bên trong Unit | — | sửa file trong phạm vi | không bao giờ: outbox của worker không phải gate event, không phải consent, không phải hoàn tất |

## 4. Shared Entities

| Entity | Nghĩa | Chủ | Ai chạm |
|---|---|---|---|
| Workflow guide | mục đích; vai và cạnh tham vấn; milestone với subject, loại bằng chứng, authority chấp nhận; activity; decision point; bảng MUST (mỗi dòng gọi tên guard) và mục unenforced; route table; mặc định khung; tiêu chí đóng | Workflow (schema); domain/core (nội dung) | agent đọc; harness pin snapshot |
| Workflow case | một yêu cầu dưới một guide được pin: khung, reservation, route/deviation, gate answer gắn digest, receipt, projection milestone, close | Workflow | Execution Core (xin admission), Work (con trỏ `workflowRunId`) |
| Activity | xem 2.2 | Workflow (định nghĩa trong guide) | Execution Core chạy nó như Unit |
| Unit, Unit run | hợp đồng dữ liệu của một lần thi hành; bản ghi `unit.json` mang `{runId, activity, reservationId}` do harness ghi lúc admission | Execution Core | Workflow case đọc receipt |
| Approved frame | xem 2.2 | Workflow case | Execution Core rút seat launch từ reservation |
| Work item | bản ghi nghiệp vụ tuỳ chọn: status lifecycle, claim/return, slot, settlement, tail phổ quát `delivered → retrospective → cleanup → done` | Work Lifecycle | trỏ tới case qua `workflowRunId` |
| Plan | đầu vào, không authority | tác giả (người hoặc agent) | conductor đọc như artifact |

## 5. Ranh giới component và authority (câu hỏi owner Q1, Q4)

### 5.1 Hôm nay

- Hàng **Workflow** ghi "Domain-neutral step & Unit DAG scheduling … Single sequencer for plans, workflows, and multi-unit tasks".
- Hàng **Work Lifecycle** ghi "Does not own stage or sequencing (owned by Workflow runner)".
- Hàng **Execution Core**: authority duy nhất cho ai làm/model/persona/cơ chế, cửa chạy duy nhất, posture confinement, cổng ghi kiểm chứng được; cấm phụ thuộc `src/state/**`.
- **Authority admission hôm nay không nằm ở đâu cả.** Thứ tự và tính hợp lệ của một case do vòng DAG quyết (cho playbook) hoặc do văn xuôi (driver skill, `coordination-driver.md`) cho mọi thứ khác; item coding do claim + step FSM; hook `dispatch-decide` chỉ quyết *cơ chế* cho lời gọi Agent trong phiên.
- Liên kết `workflow: {runId, stepId, unitId}` trong `unit.json` (195/534 bản ghi) chỉ là provenance: `run.mjs` không đọc nó để cho hay từ chối gì.

### 5.2 Sau (điều spec khoá)

**Workflow (gọi là "Workflow case" trong spec)** là authority duy nhất cho:
1. schema guide và snapshot được pin theo case;
2. ledger của case: khung, reservation, route/deviation, gate answer gắn digest subject, receipt, projection milestone, close;
3. **admission**: activity được đề xuất có hợp lệ ngay lúc này theo ledger và catalog đóng hay không.

Nó **không chọn thứ tự**. Nó sở hữu luật ràng buộc fail-closed (N1), ràng buộc worktree/nhánh của case, và bộ đếm khung (chỉ sống trong ledger, chỉ đổi dưới khoá `advance` theo reserve-then-release). Nó vẫn là bên dùng Execution Core (nhờ thi hành Unit) và Git. Nó không bao giờ sở hữu ai làm/model/persona, cổng ghi tại điểm hiệu ứng, việc chạy verify, khoá, danh tính writer, merge hay status Work.

**Execution Core** giữ mọi thứ đang có, cộng đúng hai nghĩa vụ, đều ở chỗ nó đã sở hữu:
- (a) cửa phân giải ngữ cảnh authority của người gọi; khi ngữ cảnh chỉ tới một constrained case đang mở, cửa xin admission từ Workflow case **trước** `bind()`/spawn và từ chối Unit ghi file không có admission;
- (b) đường launch mang ngữ cảnh case vào worker để cửa lồng nhau kế thừa; cổng ghi kiểm lại consent gắn subject tại điểm hiệu ứng.

Execution Core sở hữu **điểm chặn và sự lan truyền**, không bao giờ sở hữu **luật admission**. Đặt admission vào Execution Core đã bị bác: cửa sẽ vừa chọn cơ chế vừa phán tính hợp lệ, hai loại quyết định trong một component (Design Principle 7), và kéo schema guide vào Execution Core.

**Work Lifecycle**: "không sở hữu sequencing; authority thi hành và tiến độ của một case trên ledger là Workflow case; Work giữ status lifecycle, claim/return, slot, settlement và con trỏ `workflowRunId`". Step FSM của coding vẫn là authority cho item coding cho tới cutover coding (N12); spec không mô tả nó như thể đã là ledger.

### 5.3 Phân tầng không vòng (Design Principle 2)

Theo thứ hạng manifest được test cưỡng chế (entry 0 > use-case 1 > infra 2 > domain 3 > kernel 4; caller không được có hạng cao hơn target):
- cửa `fgos run` và Playbook driver ở use-case; cổng ghi (kiểm lại consent) ở infra;
- vì admission được gọi từ cả use-case lẫn infra, **ledger, projection và predicate admission nằm ở infra hoặc thấp hơn, không bao giờ ở use-case**; schema guide giữ ở kernel;
- admission không import gì ở use-case; cửa không import Playbook driver; không có vòng `run ↔ workflow`;
- mọi import mới mà schema kernel có thêm (milestone, activity, catalog) phải vào danh sách file của test cô lập kernel trong cùng thay đổi;
- A4 không đổi: ledger của case không phải state của Work.

### 5.4 Holder-lock: `advance` chỉ là mutex admission (N17)

Hôm nay `advance.lock` giữ suốt cả lời gọi `advanceWorkflowRun` và kiêm luôn "lease sống" của driver tách rời: status báo `running` hay "stale, chạy resume" dựa vào nó (ngưỡng 30 giây), và answer/resume tách rời chỉ từ chối driver thứ hai khi nó đang bị giữ. Reserve-then-release (N6) làm vỡ vai thứ hai: nếu driver nhả `advance` khi Unit đang chạy, status báo run idle sau 30 giây và resume đẻ driver thứ hai cạnh driver thứ nhất.

Spec khoá: **`advance` là mutex admission, giữ cho đúng một lần reserve hoặc release.** Sống/chết của driver tách rời là một sự thật riêng, đọc từ custody attempt của driver (Run Supervisor sở hữu attempt) hoặc từ một lease theo run thứ hai đăng ký trong holder-lock — không bao giờ suy từ `advance`. Chọn cơ chế nào thuộc làn holder-lock (chủ registry). Rank của `advance` (80) không đổi trong spec này.

### 5.5 Session Identity và Event Store

- **Session Identity**: không đổi hàng; nó không mang và không cấp authority. Mỏ neo fail-closed là ledger, không phải biến môi trường (RUL-WF-11).
- **Event Store**: chưa có hàng trong bản đồ ranh giới; component đã trên main (crate + facade Node ngủ, manifest consumer rỗng); spec của nó hiện không nhắc workflow run và coi claim/lease là runtime state ngoài store. Spec này ghi **dòng chảy event của Workflow case là consumer dự kiến (N15)**, có điều kiện; cho tới khi chọn, ledger vẫn là JSONL hiện có dưới khoá `advance`.

### 5.6 Có nên chuyển Rust? (N14)

**Không** cho luật admission, projection và Playbook driver trong spec này. **Có** cho những gì đã hoặc sẽ là Rust bên dưới chúng: mutex `advance` (holder-lock), sống/chết process để nhả reservation của holder chết (Process Facts), custody attempt và đường env mang ngữ cảnh case vào worker (Run Supervisor), lớp append/seal/read bền của ledger (Event Store, khi N15 được chọn).

Lý do:
- Design Principle 4 nói về *nền tảng toàn hệ*: sự thật kernel một authority (danh tính, terminal, khoá, process). Admission là quyết định use-case đọc schema guide của domain, chuẩn hoá `writes`, hỏi `bind()` — trên tầng nền; các cộng tác viên của nó đều Node. Port riêng admission đặt một đường nối khác ngôn ngữ trên mọi lời gọi cửa mà không thêm bảo đảm nào, vì các bảo đảm N1 cần (khoá được giữ, holder còn sống, danh tính, append bền) chính là những sự thật nền Rust đã cung cấp.
- RUL104 (tốt hơn, không to hơn): rework ở mục 9 là đổi hình bên trong `src/workflow` và một cửa; chồng thêm đổi ngôn ngữ nhân đôi bề mặt trong cùng cutover và acceptance battery phải chứng minh hai việc một lúc.
- Lỗ bền thật duy nhất (store append `seq = length + 1` không fence riêng, an toàn hôm nay chỉ nhờ khoá `advance`) là việc của Event Store, không phải của logic admission.

Điều kiện đảo: nếu chính cửa của Execution Core chuyển sang Rust, admission đi theo trong cùng thay đổi đó (L10), vì cửa là điểm chặn và bản port không được vắt qua ranh giới. Spec không khoá ngôn ngữ; đây là cách hội đồng đọc Design Principle 4, không phải quyết định build.

## 6. Business Rules

- **RUL-WF-1 (workflow mang hướng dẫn và ràng buộc; agent sinh thứ tự; harness kiểm).** Guide mang (a) và (b). Agent điều phối đề xuất (c) từng lựa chọn một. Harness admit mỗi đề xuất theo trạng thái đã ghi (guide được pin, khung, bằng chứng milestone gắn subject) và kiểm lại tại điểm hiệu ứng. Thứ tự sinh ra từ điều kiện milestone, không bao giờ từ số bước.

- **RUL-WF-2 (milestone, không phải số bước; đủ điều kiện ≠ bắt buộc; song song không cần khai).** Mỗi activity khai milestone vào và milestone nó tạo ra. Activity có mọi milestone vào đang `achieved` là *eligible*; agent chọn chạy hay không. Hai activity eligible có reservation rời nhau chạy đồng thời mà không ai phải khai song song.

- **RUL-WF-3 (bẫy danh sách đánh số).** Tác giả cứ viết flow tự nhiên (văn xuôi, danh sách). Khi chuyển thành guide, với mỗi cặp bước liền kề phải phân loại thứ tự là: *phụ thuộc đầu vào*, *consent*, *độc lập*, *an toàn tài nguyên*, *khuyến nghị tiết kiệm có lý do*, hay *thói quen viết*. Bốn loại đầu thành MUST (khi có guard) hoặc entry milestone; loại thứ năm thành SHOULD + lý do; thói quen bị bỏ. Danh sách đánh số được giữ lại chỉ như mô tả đường SHOULD cho người đọc, không bao giờ như luật.

- **RUL-WF-4 (từ vựng quyết định tại một decision point, theo RFC 2119).**
  - **MUST / MUST NOT**: nghĩa vụ cứng có lý do, subject, kiểm tra và authority chấp nhận; giữ bằng guard máy hoặc người đánh giá có tên mà verdict là một event; không lời giải thích nào vượt được.
  - **SHOULD**: route khuyến nghị kèm lý do; đi khác thì ghi lý do; chỉ hỏi người khi ngưỡng trong khung nói vậy.
  - **MAY instead**: phương án thay thế đã duyệt ở cùng điểm; ghi lựa chọn, không đòi giải thích.
  - Phép thử SHOULD với MAY instead: "nếu agent đi đường kia, ta có muốn biết vì sao không?" Có → SHOULD; không → MAY instead.

- **RUL-WF-5 (route không có trong danh sách).** Được phép với lời biện minh được ghi, *trừ* khi điểm đó mang `listedRoutesOnly`. Route unlisted vẫn qua mọi MUST, rigor floor, consent, phạm vi ghi và khung; không bao giờ tự đặt ra executor hay nới khung. Cờ `listedRoutesOnly` là cờ có authority trên decision point và admission nhìn thấy nó; bản sao trong route table chỉ là tài liệu (N9). Projection các activity eligible không bao giờ loại đường đề xuất unlisted; admission vẫn chạy mọi MUST trên nó (N11).

- **RUL-WF-6 (không có guard thì không có MUST).** Một nghĩa vụ cứng không gọi tên được guard máy nào, cũng không gọi tên được người đánh giá có verdict là event, thì được viết là SHOULD và liệt kê trong mục **unenforced** của guide. Khoảng trống cưỡng chế lộ ra lúc viết, không bị che bằng lời hứa.

- **RUL-WF-7 (catalog đóng cho MUST do guide khai; N10).** Guide chỉ khai MUST trỏ tới một kiểm tra máy trong catalog đóng. Khởi đầu sáu primitive:

  | Primitive | Kiểm cái gì |
  |---|---|
  | `milestone-reached` | milestone trước đã `achieved` cho digest *hiện tại* của subject được khai (không phải cả nhánh) |
  | `human-consent` | câu trả lời gate có approve, gắn digest subject lúc duyệt, kiểm lại khi hiệu ứng xảy ra |
  | `verify-receipt` | verify do harness chạy trên đúng cây/đường dẫn; `verifiedSha` tự khai của worker không phải receipt (0052) |
  | `write-scope-isolation` | `writes` trong phạm vi khung, rời mọi reservation đang sống của cùng case; không phủ render slot, quota API hay lease account |
  | `independence-blind` | kiểm trên ledger rằng output của ghế đồng cấp không đọc được với activity sau |
  | `frame-allowance` | bộ đếm được giữ chỗ trước spawn, gồm cả dispatch của chính conductor và wave lồng |

  Đánh giá ngữ nghĩa ("kiến trúc gọn") trở thành một activity mà receipt verdict của reviewer/người được kiểm. Guard nền tảng (G2 cấm ghim hạ tầng; floor và khoá persona của `bind()`; `writes` + commit do harness; cổng mutation trong linked worktree; confinement; gate consent và op `human-only`; approve door với Iron Law và verify sau merge; transition lifecycle khi dùng Work) giữ trong code và được **tham chiếu, không chép lại**. Primitive thứ bảy là một dòng RUL104 (tốt hơn, không to hơn), không bao giờ là một biểu thức YAML. Con số sáu là điểm khởi đầu, không phải luật đóng băng.

- **RUL-WF-8 (chủ sở hữu ràng buộc: một chiều tra, một đường admission).** Ba tầng: guard nền tảng (code), dòng MUST của domain (guide, mỗi dòng gọi tên guard hoặc người đánh giá), giới hạn riêng của case (khung). Tầng hẹp hơn chỉ *thêm* ràng buộc, không bao giờ bớt. Hai luật cứng mâu thuẫn thì hành động bị chặn, nêu tên cả hai luật.

- **RUL-WF-9 (một ledger).** Một case là một Workflow run trong store hiện có; tồn tại không cần Work. Case pin snapshot guide lúc mở; run đang chạy giữ snapshot của nó khi guide đổi. Một thay đổi hợp đồng giữa chừng có chủ đích là hành vi của steward, kèm đánh giá hệ quả, được ghi như một event. Sự thật để khởi động lại không cần chat: JSONL + guide được pin + khung còn lại; file tiếp nối nào khác chỉ là view (L3).

- **RUL-WF-10 (admission theo trạng thái đã ghi; reserve-then-release; N6).** Admission giữ chỗ (`writes`, bộ đếm khung, ghế độc lập) dưới khoá `advance` hiện có, rồi nhả khoá; thi hành tiếp diễn ngoài khoá; settle append receipt. Hai reservation không thể chồng `writes` hay tiêu đôi khung. Không có giao thức CAS kiểu `expectedSeq` (không tồn tại và sẽ là một bổ sung lớn). Một lời từ chối nêu tên điều kiện chưa thoả để agent tự thích nghi; đó là câu trả lời cho agent, không phải câu hỏi cho owner.

- **RUL-WF-11 (ràng buộc authority fail-closed trên dispatch ghi file; N1 — owner chấp nhận 2026-10-19 08:46).** Một dispatch ghi file bên trong một constrained case đang mở bị từ chối trừ khi nó mang authority đã được kiểm của case đó. Bỏ trống liên kết là bị từ chối, không phải được tự do ad-hoc.
  - **Mỏ neo là ledger, không phải biến môi trường.** Lúc start, case ràng buộc worktree và nhánh nó được phép ghi; mỗi reservation nêu write path. Cửa từ chối, *trước* `bind()`, một dispatch ghi file nhắm vào worktree/nhánh đang bị ràng buộc với một constrained case mở mà không gọi tên case đó — bất kể môi trường người gọi nói gì.
  - **Trợ giúp phân giải** (không cái nào được tin một mình, vì shell con của worker có thể unset mọi biến kế thừa và một số executor chỉ giữ biến được tiêm tường minh), theo thứ tự: tham chiếu case tường minh của người gọi; danh tính attempt của người gọi (writer id do gate cấp, phân giải tới bản ghi unit và liên kết workflow của nó); ngữ cảnh case harness đặt vào env launch.
  - **Hai loại người gọi.** Worker bên trong một Unit của case: kế thừa ngữ cảnh qua env launch (và qua cấu hình tiêm cho executor không truyền env). Conductor skill trong phiên tương tác của owner: không gate nào launch nó, nên nó gọi tên case (id trả về từ `workflow start`) ở mọi dispatch ghi file; ràng buộc worktree bắt chỗ bỏ sót.
  - Unit đứng riêng vẫn hợp lệ khi không có constrained case nào là ngữ cảnh authority của người gọi *và* worktree đích không bị case nào ràng buộc. Dispatch chỉ-đọc không bị N1 ràng buộc; nếu chạy trong một case thì vẫn tính vào khung và vẫn chịu MUST độc lập.
  - Playbook lồng, wave lồng và fallback provider tiêu khung của case cha và không thể nới nó.
  - Ràng buộc worktree phải rộng ít nhất bằng `writes` được phép của khung, nếu không cửa không thấy được chỗ bỏ sót (R1).

- **RUL-WF-12 (khung được duyệt và đơn vị đếm).** Khung được đặt lúc duyệt (`validateApprove` với coding, `workflow start` với một case, chấp nhận plan với `fgos-cook`). Đơn vị đếm:
  - (a) **Unit admission** qua cửa: `dispatches`, `mutatingDispatches`;
  - (b) **seat launch**: mỗi lần một ghế được launch, qua mọi vòng pattern và mọi lần thử fallback provider/account.

  Vòng pattern (`maxRounds`) và lần thử fallback trong một ghế bị giới hạn bởi chính Unit và chuỗi candidate; mỗi launch chúng gây ra là một seat launch. Lúc admission, case giữ chỗ trần seat launch của Unit, tính từ pattern nó sẽ chạy (ghế mỗi vòng × `maxRounds` × trần fallback mỗi ghế lấy từ khung); Execution Core rút một đơn vị cho mỗi seat launch. Cạn thì launch đang chờ không xảy ra; ghế giữ kết cục đã có (kết quả provider-limit giữ `fallbackExhausted`; một vòng reviewed không launch được producer kế tiếp kết thúc ở đánh giá cuối của nó); case ghi `frame-exhausted` như event riêng. Từ `blocked` **không** bị dùng cho cạn khung. Số còn lại không biết thì từ chối dispatch ghi file kế tiếp. Khung mang `rigorFloor`, không bao giờ `rigorCeiling`; nguồn sau chỉ nâng rigor (N7; RUL95 (later sources only raise rigor)). Không có trần tiền khi lượng dùng không đo được. Dispatch của chính conductor và case lồng đều tính.

- **RUL-WF-13 (milestone gắn subject; N2).** Subject của milestone là tập artifact được khai, không phải nhánh. Bằng chứng không bị ảnh hưởng vẫn còn hiệu lực; thành tựu lịch sử được giữ; hiệu lực được tính lại khi subject đổi (`stale(prior, current)`). Digest hiện tại không biết thì fail closed *chỉ cho milestone đó*. L9 giữ tách: Unit pass, đã tích hợp, đã merge, bền là bốn sự thật khác nhau.

- **RUL-WF-14 (consent gắn subject).** Consent chỉ đến từ câu trả lời gate hoặc approve door. Event approval mang digest artifact lúc duyệt; lúc dùng so lại, lệch thì từ chối. Subject là artifact được duyệt, không phải markdown câu trả lời. Một câu trả lời thứ hai không thay được approval đã tiêu. Câu trả lời mang tính thông tin không thoả cổng consent; im lặng không cấp gì.

- **RUL-WF-15 (receipt verify).** Receipt verify do harness chạy, gắn với đúng các đường dẫn đã test. Tích hợp là một subject mới cần receipt riêng: test trên cây con không chứng minh gì về cây đã tích hợp.

- **RUL-WF-16 (độc lập trên ledger; C4, N4).** MUST độc lập là kiểm trên ledger rằng output của ghế đồng cấp không đọc được với activity sau. Khi cách mã hoá máy duy nhất là một pattern hoặc một wave với ghế blind, việc **đóng gói** đó là bắt buộc cho MUST ấy: admission từ chối dạng không đóng gói, và từ chối một Unit sau có tham chiếu handoff tới output của ghế blind. Admission không theo dõi việc đọc file của worker chỉ-đọc (policy confinement vẫn cho đọc host); cưỡng chế nằm ở việc từ chối dispatch, không ở việc chặn đọc.

- **RUL-WF-17 (hiệu ứng ngoài; C5, N5).** Xác nhận hiệu ứng ngoài (đã đăng, đã phát hành) nằm ngoài catalog máy: viết là unenforced hoặc là receipt của người đánh giá có tên; không trình bày như `verify-receipt`. "MUST NOT publish trước consent trên đúng bản copy này" thì cưỡng chế được (consent + digest + `writes` của Unit publish cục bộ); "đã đăng" thì không. Với coding, approve door cộng `mergedSha` là quan sát landing và vẫn là authority merge (guard nền tảng, không thuộc sáu primitive).

- **RUL-WF-18 (playbook là guide; không scheduler thứ hai; C3, N3).** Mọi Workflow case có một cách hiểu admission. Playbook là guide có các điểm listed-routes-only; Playbook driver tự đề xuất SHOULD duy nhất tại những điểm đó, *vẫn qua admission* theo trạng thái hiện tại. Với bảy playbook thảo luận, thứ tự quan sát được giống hệt hôm nay; khác biệt là bản ghi (khung, reservation, milestone, receipt). MUST độc lập và consent của playbook giữ là MUST cho tới khi được phân loại lại có lý do và có authority.

- **RUL-WF-19 (findings là kết cục, không phải thất bại của case).** Milestone chẩn đoán chấp nhận `findings`; milestone giao hàng cần `pass` cộng receipt hiện hành. "Một Unit ngoài `acceptOutcomes` làm hỏng cả run" bị thu hồi như luật của case; nó chỉ còn bên trong một wave đã khai nó.

- **RUL-WF-20 (khi nào hỏi người).** Chỉ khi: thiếu ý định hoặc thiếu uỷ quyền thật; mâu thuẫn MUST không hoà giải được; điểm listed-routes-only không route nào khớp; điểm consent; hoặc một giới hạn sắp bị vượt (số deviation trước khi hỏi là một hạn mức của khung). Câu hỏi được gom theo mẫu câu hỏi quyết định; nhánh bị chặn đậu lại, việc độc lập đã được uỷ quyền tiếp tục chạy.

- **RUL-WF-21 (học từ deviation).** Route và deviation là event trong ledger hiện có. Retrospective so các case tương đương theo kết quả đã verify, rework (bao lâu một milestone trở `stale` sau đó), số lần ngắt, thời gian/chi phí và sự cố luật. **Tần suất một mình không bao giờ thăng một route.** Agent đề xuất diff guide kèm các case được dẫn và các case ngược; domain steward chấp nhận trong phạm vi uỷ quyền; thay đổi MUST giữ authority cao hơn; run đang chạy giữ guide được pin. Không có thăng hạng tự động, không có dịch vụ chấm điểm.

- **RUL-WF-22 (plan là đầu vào).** Plan (ak plan hay do agent suy ra) không cấp authority. Số phase không bao giờ thành thứ tự MUST; phụ thuộc thật được phân loại theo RUL-WF-3. Dịch máy plan thành DAG (`--plan`) bị thu hồi.

- **RUL-WF-23 (Work là vòng đời nghiệp vụ tuỳ chọn; N12).** Work giữ status lifecycle (gồm tail 0027), claim/return, slot, settlement. Khi một case ở trên ledger, authority thi hành và tiến độ của nó là Workflow case. Step FSM coding hôm nay vẫn là authority cho item coding cho tới cutover coding; cutover chuyển mọi consumer và xoá đường cũ trong một thay đổi (L10).

- **RUL-WF-24 (một cửa ghi ledger).** Mọi lần ghi ledger đi qua đúng một cửa giữ khoá `advance` (store hôm nay append không fence riêng). Khoá `advance` chỉ là mutex admission (mục 5.4).

- **RUL-WF-25 (không DSL luật).** Guide là schema dữ liệu khai báo. Mọi luật guide khai được là một dòng gọi tên một kiểm tra đã có (primitive catalog, guard nền tảng, hoặc người đánh giá có tên). Không biểu thức nào do harness diễn giải.

- **RUL-WF-26 (nội dung tối thiểu của một guide).** Mục đích; vai và cạnh tham vấn; milestone với subject, loại bằng chứng và authority chấp nhận; activity với milestone vào, output và hiệu ứng được phép; bảng MUST (mỗi dòng một guard) và mục unenforced; route table với lý do SHOULD, phương án MAY instead và "không dùng khi"; chính sách unlisted theo điểm; mặc định khung và ngưỡng hỏi người; bằng chứng đóng. Guide được phép bắt đầu nhỏ. Tác giả: owner và agent cùng viết qua hội đồng kiến trúc, hoặc một lượt intake đọc văn xuôi/danh sách của tác giả và phân loại từng cặp liền kề theo RUL-WF-3.

## 7. Luồng (Behaviors)

### 7.1 Mở case

Người gọi `workflow start` trên một guide (hoặc conductor mở case trên guide của domain sau khi đọc plan). Case ghi: snapshot guide, khung (mặc định của guide, thu hẹp theo yêu cầu, không nới), ràng buộc worktree/nhánh, milestone `request-received` achieved với digest của yêu cầu. Trả id case ngay; driver (nếu là playbook) chạy tách rời.

### 7.2 Một chu kỳ admission

1. **Quan sát**: agent đọc `status` (projection): milestone achieved/stale/blocked, route liệt kê eligible, đường đề xuất unlisted, khung còn lại.
2. **Đề xuất**: agent chọn một activity và route (`should` / `may-instead` / `unlisted` + lý do khi cần).
3. **Admission** (dưới `advance`, ngắn): kiểm entry milestone với digest hiện tại, consent cần cho hiệu ứng, MUST độc lập, `writes` rời mọi reservation sống, khung đủ; giữ chỗ; ghi event route/reservation; nhả khoá. Từ chối thì nêu điều kiện chưa thoả.
4. **Thi hành**: Execution Core chạy Unit (bind, pattern, confinement), rút seat launch từ reservation, commit trong `writes`, chạy verify.
5. **Settle** (dưới `advance`, ngắn): append receipt; nhả reservation; projection tính lại milestone.
6. **Thích nghi**: agent đọc lại projection và chọn tiếp — có thể đi khác SHOULD (ghi lý do) hoặc đề xuất unlisted.

### 7.3 Song song

Hai activity eligible có reservation rời nhau (write path, ghế) và khung đủ cho cả hai được admit lần lượt dưới khoá ngắn, rồi chạy đồng thời. Trong một wave, Unit chung chuỗi write-base giữ thứ tự (nhánh sau dựng trên nhánh trước); chỉ Unit không có chuỗi base giữa chúng mới được giữ chỗ cùng lúc.

### 7.4 Đậu một câu hỏi

Một điểm consent, mâu thuẫn MUST, hoặc giới hạn sắp vượt làm nhánh đó `blocked(question)`. Câu hỏi vào bộ câu hỏi gom. Các activity eligible khác vẫn được admit qua các lời gọi cửa riêng (không mutex toàn cục). Trả lời consent gắn digest subject; trả lời thông tin không mở cổng consent.

### 7.5 Đóng case

`close` từ chối khi milestone kết thúc đang `stale` hoặc một gate consent còn đậu. Đóng thành công ghi event close; Work (nếu có) tiếp tục tail riêng của nó.

### 7.6 Khởi động lại không cần chat

Driver mới đọc JSONL + guide được pin + khung còn lại. Một driver duy nhất được đảm bảo bởi sự thật sống/chết riêng của driver (mục 5.4), không phải bởi `advance`.

### 7.7 Vòng học

Retrospective đọc route/deviation event của các case tương đương → agent đề xuất diff guide (thăng MAY instead hoặc unlisted thành SHOULD, giáng SHOULD hay thất bại) kèm bằng chứng và phản chứng → steward chấp nhận → guide có phiên bản mới; case đang chạy giữ bản cũ.

## 8. Tác động lên `fgos run` và `fgos workflow start` (câu hỏi owner Q3)

| Trường hợp | Sau thay đổi |
|---|---|
| `fgos run` đứng riêng, không case nào là ngữ cảnh, worktree đích không bị ràng buộc | **Không đổi.** |
| `fgos run` chỉ-đọc trong một case đang mở | admit không giữ chỗ `writes`; vẫn tính vào `dispatches` của khung; MUST độc lập vẫn áp (đọc output ghế blind bị từ chối) |
| `fgos run --writes` trong một constrained case — worker trong một Unit của case | phải gọi tên case + activity (kế thừa qua env launch, hoặc qua attempt id); admission giữ chỗ trước spawn; bản ghi unit mang run/activity/reservation do harness ghi |
| `fgos run --writes` trong một constrained case — conductor trong phiên owner | conductor gọi tên case tường minh ở mọi dispatch ghi file; quên tên mà nhắm worktree bị ràng buộc → bị từ chối tại cửa trước `bind()` |
| bất kỳ dispatch ghi file nhắm worktree/nhánh bị một case mở ràng buộc mà không gọi tên case | **bị từ chối** (env bị lột, daemon executor, hay conductor quên — như nhau) |
| `fgos workflow start <playbook>` đứng riêng | mở case với khung mặc định của guide; Playbook driver đề xuất SHOULD duy nhất qua admission; thứ tự quan sát được giống hệt; 89/89 run đã lưu là playbook nên đây là đường **không được hồi quy** |
| `fgos workflow start --units` | giữ như cam kết chọn-việc được kiểm trước. Đứng riêng: là case của chính nó. Trong một constrained case: là wave lồng, tiêu khung cha, không nới, `writes` giữ chỗ với reservation sống của cha. "Một Unit hỏng → hỏng" chỉ còn nếu wave khai nó |
| `fgos workflow start --plan` | **thu hồi** cùng cutover (L10); `fgos-cook` đọc ak plan như artifact và mở case trên guide coding |
| Skill trong phiên lái một Work item (`fgos plan --validate`, Work driver loop, RUL94 (a Work driver step runs as a Unit)) | không đổi cho tới cutover coding: authority là claim + step FSM. Lời gọi Agent/Task trong phiên mà ghi workspace khi một case đang mở thì nằm **ngoài** ledger của case đó; hook `dispatch-decide` quyết cơ chế, không quyết admission; approve door vẫn là guard landing |
| Playbook lồng (Unit gọi `workflow start <playbook>` trong một constrained case) | case con gắn với reservation của cha; tiêu khung cha (trừ lúc admission case con); không nới; milestone là của riêng nó |
| Chi tiêu dưới cửa (vòng pattern, ghế, fallback provider) | đếm bằng seat launch rút từ reservation của Unit (RUL-WF-12); cạn ghi `frame-exhausted`, giữ kết cục sẵn có |
| `fgos workflow operations` / `status` | `operations` (đọc định nghĩa, nhưng `coordination-driver.md` dạy như thể theo run) được thay bằng `status` là projection trạng thái case; thêm `close`. Cả hai là dòng RUL104 (tốt hơn, không to hơn) owner có thể bác |

**Không đổi tại hai cửa:** hai cửa vẫn là hai cửa thi hành duy nhất; `bind()` vẫn là bên duy nhất chọn ai/model/persona; `writes` + commit do harness giữ nguyên; approve door vẫn là authority merge; policy confinement phía đọc không đổi. Cách đánh vần flag không bị spec khoá.

## 9. Kích thước rework (câu hỏi owner Q5) — thông tin, không phải plan

Đo tại `af1f2db2b`. Đây là ước lượng hình dạng để owner cân nhắc, không phải phase.

| Phần | Hôm nay | Xử lý |
|---|---|---|
| schema guide (`definition.mjs` 499, `steps.mjs` 86, `loader.mjs` 141) | DAG steps/units | mở rộng vừa: milestone, activity, dòng MUST gọi primitive, decision point, mặc định khung, đóng; steps/units/gate giữ làm dạng playbook |
| store + digest (`store.mjs` 325, `ref-digests.mjs` 49) | event + fold | đổi vừa: event kind mới; fold milestone theo subject; digest phủ gate answer (hôm nay bị bỏ qua). Fold phải thuần và có test |
| vòng `advanceWorkflowRun` (~400 dòng) | DAG tuần tự | **viết lại** thành Playbook driver đề xuất qua admission; mảnh lớn nhất |
| khoá, nguồn start, verb (~600 dòng) | | giữ, sửa nhỏ: bỏ `--plan`; start ghi khung + ràng buộc worktree; status trả projection và đọc sống/chết driver riêng; answer gắn digest; thêm close; tách sống/chết driver chạm mọi verb tách rời |
| `plan-source.mjs` 134 | | **xoá** (L10) cùng test và đoạn dạy `--plan` trong skill |
| `units-source`, `integrate`, `seats`, … | | không đổi hoặc chạm nhẹ |
| `src/runner/execution/run.mjs` 1191 | cửa | một bổ sung trên đường nóng, fail-closed: phân giải case, kiểm ràng buộc worktree, gọi admission, ghi liên kết, rút seat launch |
| confinement/adapters | env launch | mang ngữ cảnh case cạnh biến độ sâu dispatch; thêm vào cấu hình tiêm cho executor không truyền env; kiểm lại consent tại cổng ghi qua một port admission tầng infra. Không đổi hợp đồng Rust |
| `bind`, patterns, commit, merge, Work driver loop, operation-choice | | không đổi |
| 7 YAML playbook thảo luận (444 dòng) | | không đổi ngữ nghĩa; thêm phần đầu nêu MUST mà thứ tự đang mã hoá và mặc định khung |
| `feature.yaml` (168) | hai từ vựng | rework thật, hai phần (N16, mục 10.2) |
| `content-publish.yaml` (40) | | nhỏ (mục 10.3) |
| test (`test/workflow` 4089 dòng) | | test runner/units nhắm lại sang ngữ nghĩa admission; test playbook thảo luận phải pass nguyên (lưới chống hồi quy); battery mục 11 thành test mới; ba test đọc trực tiếp `feature.yaml`/schema kernel được nêu trong mục 10.2 |

**Tổng:** vừa và tập trung — khoảng một phần ba `src/workflow` viết lại (vòng lặp, store), một phần ba mở rộng (schema, verb, tách sống/chết), một phần ba không chạm; Execution Core chạm ở một cửa, một cổng và một tham số launch. Phần duy nhất **không đo được** là cutover coding từ Work step FSM sang ledger, vì phụ thuộc cách viết `fgos-cook` (R2).

## 10. Ví dụ minh hoạ trước → sau (câu hỏi owner Q6)

> **Tên trường trong các phác thảo dưới đây chỉ để minh hoạ. Spec không khoá bố cục YAML.** Điều được khoá là hành vi quan sát được mô tả sau mỗi phác thảo.

### 10.1 `core/workflows/council-lite.yaml`

**Trước** (47 dòng): một step `discussion`, một unit `deliberate` (`capability: delphi:propose`, `pattern: panel`, `blind: true`, ba roleTask panelist + một synthesizer, contextRefs tới ba file posture). Vòng DAG thấy step ready, chờ Unit, ghi `workflow.complete`. Thứ tự "ý kiến blind trước tổng hợp" được giữ bởi pattern panel bên trong một Unit; không gì trong run nói *vì sao*.

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

**Một run sau thay đổi:** `workflow start council-lite` mở case với khung trên; Playbook driver đề xuất `deliberate` (route liệt kê duy nhất ở `request-received`); admission giữ 1 dispatch, 4 × 2 = 8 seat launch và tập ghế độc lập; Execution Core chạy đúng Unit panel đó, rút một seat launch cho mỗi panelist và một cho synthesizer; receipt đưa `positions-settled` và `verdict-settled` lên `achieved` với digest report; close thành công.

**Khác biệt quan sát được:** status hiện milestone kèm digest; run **không thể** tái tạo bằng ba lời gọi `fgos run` tuần tự cộng lời thứ tư đọc chúng, vì MUST `independence-blind` biến Unit panel đóng gói với ghế blind thành dạng duy nhất được admit — dispatch không đóng gói đầu tiên bị từ chối, và một Unit sau có tham chiếu handoff tới output ghế blind cũng vậy; câu trả lời gate thứ hai không thay câu đã tiêu; khung từ chối dispatch ghi file. **Không đổi:** template, ba file posture, roleTask, ghế blind, start tách rời, ý nghĩa tám run council-lite đã lưu.

### 10.2 `domains/coding/workflows/feature.yaml`

**Trước** (168 dòng): sáu step (discovery, exploring có gate người, planning, executing, integrate, approval gate), mỗi step mang *hai* từ vựng: từ vựng Work lifecycle (`phase`, `skill`, `operations` với taskSpec/role/reason/dispatch/skills/policy; `transitions`, `aliases`, `statusSkills`) và từ vựng runner (`units`, `dependsOn`, `gate`, `kind: integrate`). Runner **chưa bao giờ** chạy file này (0/89 run); item coding đi qua nó bằng Work step FSM. Bốn transition đã mã hoá lựa chọn (discovery → exploring *hoặc* planning) nhưng cách đánh số step đọc như thứ tự.

**Phân loại cặp liền kề** (RUL-WF-3):

| Cặp | Loại | Kết quả |
|---|---|---|
| discovery → exploring | khuyến nghị có lý do | SHOULD khi discovery thấy mơ hồ người phải chốt; MAY instead → planning khi discovery phán `clear` (đã là hai transition hôm nay) |
| exploring → planning | phụ thuộc đầu vào | planning cần `decisions-locked` |
| planning → executing | consent + receipt | MUST: verdict validate-plan và consent `validateApprove`; gate "Lock decisions for this item?" là consent gắn digest artifact quyết định |
| executing → integrate → approval | receipt + consent | MUST: receipt verify của con trên đường dẫn đã test, rồi receipt tích hợp trên cây tích hợp (subject mới), rồi consent gắn cây đó; merge vẫn ở approve door |
| review-item, scout-blast-radius, resolve-question, scoped-subtask, fix-verify-red | — | không bao giờ là step: là activity eligible bất cứ khi nào milestone vào của chúng đúng, như `operations` hôm nay đã nói |

**Sau** (phác thảo; phần lifecycle **tách ra, không xoá** — N12, N16):

```yaml
id: coding/feature
kind: guide
#-- Phần Work lifecycle: GIỮ tới cutover coding; được đọc hôm nay bởi schema steps cho Work driver,
#-- chọn operation và kiểm operation hợp lệ của Assignment. Chỉ bỏ các trường runner trên mỗi step. ---
steps:
  - { id: discovery, phase: discover, skill: fgos-coding-discovering, operations: [ ...giữ nguyên... ] }  # bỏ units
  - { id: exploring, phase: discover, skill: fgos-coding-exploring,   operations: [ ...giữ nguyên... ] }  # bỏ dependsOn, units, gate
  - { id: planning,  phase: plan,     skill: fgos-coding-planning,    operations: [ ...giữ nguyên... ] }  # bỏ dependsOn, units
  - { id: executing, phase: execute,  skill: fgos-coding-implement,   operations: [ ...giữ nguyên... ] }  # bỏ dependsOn, units
  # hai step chỉ-của-runner 'integrate' và 'approval' bị bỏ: không phase, không skill, không operation, chưa từng chạy
transitions: [ {from: discovery, to: exploring}, {from: discovery, to: planning}, {from: exploring, to: planning}, {from: planning, to: executing} ]
aliases: { decompose: planning }
statusSkills: { retrospective: { skill: fgos-coding-knowledge, taskSpec: compound-learn } }
#-- Phần guide: THÊM cạnh phần lifecycle; chưa reader nào dùng cho tới cutover ---
milestones:
  - id: request-received
  - id: decisions-locked   # subject: artifact quyết định; chấp nhận: consent gate hoặc verdict discovery 'clear'
  - id: plan-validated     # subject: plan.md; chấp nhận: verdict validate-plan (reviewed) + consent validateApprove
  - id: child-verified     # subject: các đường dẫn đã test của con; chấp nhận: verify-receipt
  - id: integrated         # subject: cây tích hợp; chấp nhận: verify-receipt (subject mới)
  - id: approved           # subject: digest cây tích hợp; chấp nhận: consent người; listedRoutesOnly
  - id: merged             # guard nền tảng: approve door + mergedSha; không thuộc sáu primitive
activities:                # mỗi activity gọi tên operation nó sẽ thay lúc cutover, để hai phần không trôi khỏi nhau
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
  - { at: approved, listedRoutesOnly: true }
must:
  - { id: no-writes-outside-unit, guard: write-scope-isolation, note: "guard nền tảng, tham chiếu không chép lại" }
  - { id: child-receipt,          guard: verify-receipt, subject: child-verified }
  - { id: integration-receipt,    guard: verify-receipt, subject: integrated, reason: "test trên cây con không chứng minh gì về cây tích hợp (L9)" }
  - { id: consent-before-merge,   guard: human-consent,  subject: approved,   reason: "duyệt cây A không phải duyệt cây B" }
unenforced:
  - { id: tasteful-architecture, becomes: "receipt verdict của review-item", note: "đánh giá ngữ nghĩa là verdict của người đánh giá, không phải MUST máy" }
frameDefaults: { mutatingDispatches: "theo số con của plan", seatLaunchesPerDispatch: "theo pattern (reviewed, maxRounds 2, hai checker = 6)", fallbackPerSeat: 2, deviationsBeforeAsk: 2 }
closure: [approved]
```

**Một run sau thay đổi (`fgos-cook` trên một ak plan):** skill đọc toàn bộ plan và các chỉnh sửa, mở case trên `coding/feature` với khung cỡ theo plan (`writes` được phép, số con, attempt); đề xuất `implement-item` cho con API và con docs cùng lúc — admission giữ `writes` rời nhau và hai dispatch ghi file, cả hai chạy đồng thời; receipt của con docs đưa `child-verified` lên achieved *chỉ cho đường dẫn docs*, nên commit docs không làm receipt của con API thành `stale`; `review-item` trên con API trả `findings` — case ghi lại, không gì thất bại; `fix-verify-red` được đề xuất và admit; `integrate` tạo subject mới cần receipt riêng; `approved` là consent gắn cây đó; merge là approve door. Một phase đánh số 3 mà chỉ phụ thuộc phase 1 chạy cạnh phase 2. Conductor thử `fgos run --writes` đứng riêng cho con thứ ba mà không gọi tên case → bị từ chối (RUL-WF-11).

**Không đổi:** taskSpec, skill, bảng status của Work item, approve door, tail `delivered → retrospective → cleanup → done`; registry đã biên dịch và `domainSteps()` (discovery, exploring, planning, executing) cho tới cutover; kiểm operation hợp lệ của Assignment.

**Những reader phải đi theo** (để bỏ trường runner không làm gãy gì): một test hợp đồng advisory đọc `steps[].units[]` của validate-plan và implement-item (chuyển hai template đó sang fixture của test hoặc sang activity); test cô lập kernel liệt kê các file schema được phép phụ thuộc (phải thêm đúng import mới); test domain-registry và doctor check compiled-domain phải vẫn trả bốn step trên.

### 10.3 `domains/marketing/workflows/content-publish.yaml` (ngắn)

**Trước:** chuỗi bốn step `brief → draft → approval (gate) → publish`; gate người mặc định consent; publish ghi `content/published/**`.

**Sau:** milestone `brief-ready`, `draft-reviewed`, `copy-approved`, `publish-recorded`. Brief → draft là **SHOULD** ("nghiên cứu khán giả giảm rework"), **MAY instead** đi thẳng draft khi cập nhật nhỏ. MUST `human-consent` gắn **digest của đúng bản copy** trước activity publish; MUST `write-scope-isolation` trên Unit publish cục bộ. "Nội dung đã thật sự lên kênh ngoài" là dòng **unenforced** (hoặc receipt của người đánh giá có tên) — catalog không nhìn thấy hiệu ứng ngoài repo (RUL-WF-17). Sửa copy sau khi duyệt làm `copy-approved` thành `stale` và publish bị từ chối cho tới khi duyệt lại.

## 11. Acceptance battery (kịch bản quan sát được)

1. **Hai writer sẵn sàng va nhau**: bị từ chối lúc giữ chỗ (RUL-WF-10, -11), không phải phát hiện ở approve.
2. **Worker tự nhận đã được duyệt**: consent chỉ từ gate answer hoặc approve door; outbox worker không bao giờ là gate event.
3. **Test pass trên cây cũ**: receipt verify gắn đường dẫn đã test; tích hợp là subject mới.
4. **Artifact đã duyệt bị đổi**: event approval mang digest lúc duyệt; so lúc dùng thì từ chối; gắn markdown câu trả lời là sai subject.
5. **Fallback làm cạn hạn mức**: bộ đếm khung gồm dispatch của conductor và wave lồng; số còn lại không biết thì từ chối dispatch ghi file; một câu hỏi quyết định được gom và đậu.
6. **Route unlisted vi phạm MUST**: route đề xuất được; hành động vi phạm bị từ chối ở admission bất kể lý do.
7. **Gate đậu một nhánh**: các activity eligible khác vẫn được admit qua lời gọi cửa riêng.
8. **Findings không kèm giao hàng**: milestone chẩn đoán chấp nhận findings; giao hàng cần pass + receipt hiện hành; không case nào hỏng vì một Unit findings.
9. **Driver khởi động lại không có chat**: sự thật là JSONL + guide được pin + khung còn lại; một driver duy nhất.
10. **Guide đổi giữa run**: run giữ snapshot; thay đổi giữa chừng có chủ đích là hành vi steward kèm đánh giá hệ quả.
11. **Lột ngữ cảnh**: conductor trong phiên owner đã mở case, và worker trong một Unit của case mà shell con đã unset mọi biến kế thừa, mỗi bên gọi `fgos run --writes` nhắm worktree của case mà không gọi tên case: cả hai bị từ chối tại cửa trước `bind()`, nêu điều kiện chưa thoả, chỉ nhờ ràng buộc ledger; một worker codex trong case gọi tên case qua cấu hình được tiêm thì được admit.
12. **Không hồi quy playbook**: `workflow start council-lite` sau thay đổi sinh cùng Unit, cùng ghế blind, cùng thứ tự với tám run đã lưu, có thêm milestone và khung trong bản ghi; bốn ghế đều launch dưới reservation 4 × `fallbackPerSeat`.
13. **Cạn seat launch trong một ghế**: chuỗi provider/account trong Execution Core cạn số seat launch đã giữ: ghế giữ kết quả provider-limit với `fallbackExhausted`, không reservation mới xuất hiện, ledger ghi `frame-exhausted`, bộ đếm khung khớp ledger.
14. **Driver tách rời nhả `advance`**: driver nhả `advance` sau khi giữ chỗ trong lúc Unit chạy: status báo `running` (không stale), resume từ chối đẻ driver thứ hai khi driver thứ nhất còn sống.
15. **`feature.yaml` hai phần**: thêm phần guide cạnh phần lifecycle được giữ vẫn biên dịch; `domainSteps` trả discovery, exploring, planning, executing; test cô lập kernel pass với danh sách file chỉ thêm đúng import schema đã thêm; test hợp đồng advisory chạy hai template từ activity hoặc fixture riêng.

## 12. Giữ / đổi / thu hồi

| Giữ | Đổi | Thu hồi cùng cutover (L10) |
|---|---|---|
| hợp đồng Unit; `bind()` 5 mức và khoá persona; pattern solo/reviewed/panel và preset; task-spec; roleGraph; store run bền và snapshot; khoá `advance`; start/resume tách rời; đậu gate cục bộ; consent vs input; approve door; hai cửa; Work lifecycle gồm tail phổ quát | Workflow run: từ kê thứ tự case sang admit activity do agent chọn và chấp nhận bằng chứng milestone gắn subject; doctrine driver (`coordination-driver.md`): phán route là của agent, cơ học lập lịch và cưỡng chế là của harness, `workflow operations` thay bằng projection trạng thái; 0048 §2 và 0049 §4 bị supersede một phần (mục 16) | dịch máy `--plan` và `plan-source`; "một Unit hỏng → cả run hỏng" như luật case (chỉ còn trong wave khai nó); trường runner chết trong `feature.yaml` (`units`, `dependsOn`, `gate`, `kind: integrate`); cách đọc "coding chạy trên DAG runner" |

**Không đề xuất:** engine CMMN hay XML; dịch vụ policy; chấm điểm hay thăng route tự động; editor trực quan; DSL workflow tổng quát hay ngôn ngữ predicate; bắt buộc có Work; cửa CLI thứ ba hay `fgos coordination`; CAS `expectedSeq`; cơ sở dữ liệu milestone; trần tiền khi không đo được; adapter marketing/video; port Rust admission/projection trong spec này; component mới cho admission; vòng import giữa cửa và Playbook driver; đổi tên file trong spec; biến authority do gate cấp trong hợp đồng Rust; coi thư mục attempt của unit-run là một Event Store stream; dùng lại `blocked` cho cạn khung.

## 13. Mở / hoãn và rủi ro còn lại

| Id | Rủi ro / việc mở | Ai |
|---|---|---|
| R1 | Phân giải ngữ cảnh authority: ràng buộc worktree phải rộng bằng `writes` được phép của khung; executor không truyền env cần cấu hình tiêm; tra từ attempt id tới bản ghi unit có dữ liệu nhưng chưa có reader. (Lo ngại của ghế "session-identity/confinement" đã rút lời mời, giữ ở đây.) | review spec |
| R2 | Cutover coding từ Work step FSM sang ledger: hai authority trong giai đoạn chuyển nếu consumer không chuyển và đường cũ không xoá cùng đợt; kích thước chưa đo được (phụ thuộc `fgos-cook`) | plan sau duyệt |
| R3 | Guide marketing và video sẽ bắt đầu với mục unenforced dài (hiệu ứng ngoài, quyền); đây là thông tin cho owner, không phải lý do xây engine hay mời ghế | steward domain |
| R4 | Ledger hôm nay là append Node dưới `advance`; writer nào đi vòng khoá có thể xen seq. Ở cutover N15, `advance` (rank 80) không thể giữ qua một append Event Store (rank 70): re-rank hoặc fence-sau-khi-nhả là dòng của làn holder-lock và Event Store; trước khi chọn, ledger không được khai là consumer của Event Store ở spec nào | làn holder-lock, Event Store |
| R5 | Fold projection phải tất định khi replay; giữ thuần và có test, nếu không `stale`/`achieved` trôi khỏi sự thật | plan sau duyệt |
| R6 | Panelist 1–3 chưa review critique, gói settled hay bản reopen; N13–N17 chưa qua panelist nào, chỉ qua một reviewer và một red-team | review spec |
| R7 | Hạn mức khung chỉ ở đơn vị cưỡng chế được; tiền chưa bị máy giới hạn cho tới khi đo được lượng dùng | — |
| Mở | Header `docs/platform/event-store/spec.md` còn ghi "Implementation status: Not started" trong khi ES 06 đã trên main | làn Event Store |

**Điều kiện đảo ngược** (đã settle, giữ nguyên):
- đảo N1 sang chỉ-kiểm-tại-cửa nếu run thật cho thấy không va chạm chéo lời gọi và không vượt khung trong một thời gian dài chỉ với luật một-wave;
- đảo catalog đóng (N10) sang dạng mở chỉ khi nhiều hơn vài domain mỗi bên cần một primitive riêng;
- đảo N5 khi một primitive quan sát adapter được chọn và đo;
- đảo lập trường không-pilot (bất đồng P2-pilot-first) nếu owner muốn giao hàng bắt đầu bằng các đối tượng Size 1 trước khi nối admission (đổi trình tự, không đổi mô hình);
- đảo bác bỏ CMMN đầy đủ chỉ khi có nhu cầu trao đổi/công cụ với bên ngoài được chứng minh;
- đảo N14 khi cửa Execution Core chuyển Rust, trong cùng thay đổi;
- đảo N15 nếu chủ spec Event Store loại workflow run khỏi phạm vi hoặc từ chối re-rank `advance` (khi đó ledger cần dòng fence riêng — câu hỏi RUL104 (tốt hơn, không to hơn));
- nếu review thấy ràng buộc worktree/nhánh không thể rộng bằng `writes` của khung, một biến case do gate cấp trong hợp đồng session-identity và run-supervisor là phương án thay, và phần chạm Rust phải được đếm vào mục 9;
- lựa chọn lease của N17 (dòng khoá thứ hai hay custody attempt) chỉ do làn holder-lock đảo.

## 14. Ý tưởng tính năng (RUL104 (tốt hơn, không to hơn) — owner chọn; chưa cái nào được uỷ quyền)

| # | Ý tưởng | Vấn đề thật (bằng chứng) | Lợi ích |
|---|---|---|---|
| F1 | Projection milestone gắn subject trên `events.jsonl` (digest đường dẫn/artifact; gate và receipt gắn hash) | `dependsOn` chỉ thấy step xong; lỗ `verifiedSha` của 0052; duyệt A không phải duyệt B; `ref-digests` bỏ qua gate answer | route thích nghi mà không dùng bằng chứng cũ; một fold trong store hiện có, không dịch vụ milestone |
| F2 | Khung được duyệt với hạn mức cộng dồn, kiểm lúc admission trên cả hai cửa | `timeoutMs` và `maxRounds` mỗi Unit reset khi conductor mở thêm Unit; `aggregateBounds` đã xoá cùng engine cũ | tự chủ có giới hạn qua retry, fallback, wave lồng; khoá + bộ đếm JSONL sẵn có |
| F3 | Ngữ cảnh authority fail-closed trên dispatch ghi file trong constrained case (N1, owner đã chấp nhận về luật) | run id tuỳ chọn là đúng kiểu hỏng của chuỗi lead 6.4 | authority kế thừa trở thành thật; vẫn hai cửa |
| F4 | Event kind route/deviation; SHOULD có lý do và MAY instead có cấu trúc trong schema guide | không bản ghi nào nối mặc định, lý do và kết quả; thứ tự thói quen bị mã hoá thành `dependsOn` | audit và học retrospective không cần dịch vụ chấm điểm |
| F5 | Luật viết "không guard, không MUST" với mục unenforced mỗi guide | MUST văn xuôi đã trượt ba lần trong 6.4 | khoảng trống cưỡng chế lộ lúc viết; chỉ là quy ước tài liệu |
| F6 | `status` như projection trạng thái case, và verb `close` | case thích nghi không có "mọi step xong"; `coordination-driver.md` dạy một lookup như thể theo run nhưng thật ra đọc định nghĩa | một chỗ đọc "điều gì hợp lệ bây giờ"; close từ chối khi milestone kết thúc stale hoặc gate đậu |
| F7 | Admission reserve-then-release | giữ `advance` suốt thi hành cấm song song việc eligible | song song-khi-eligible của owner mà không giao thức CAS mới |
| F8 | Primitive quan sát adapter cho hiệu ứng ngoài (đã đăng, đã phát hành) | sáu guard không thấy hiệu ứng ngoài repo | biến publish/release thành milestone thật; **hoãn, không thuộc spec này** |
| F9 | Thu hồi `--plan`/`plan-source` và trường runner chết của `feature.yaml`; thu hồi "một Unit hỏng → hỏng case" | hai mô hình trong một từ; dịch `writes` rỗng không an toàn; một Unit xấu giết nhánh độc lập | ít trường hơn, một mô hình; xoá L10 cùng cutover |
| F10 | Dòng event của Workflow case thành stream type đăng ký trong Event Store (N15) | ledger append `seq = length + 1` không fence riêng | fence/seal/chia sẻ mà không thêm store thứ hai; **chi phí:** phải re-rank `advance` dưới 70 trước (dòng registry của làn holder-lock) |
| F11 | Lease sống/chết riêng cho Playbook driver tách rời, hoặc đọc từ custody attempt (N17) | `advance` mang hai nghĩa hôm nay | làm N6 khả thi mà không báo nhầm run stale |
| F12 | Ngữ cảnh case trong env launch và cấu hình tiêm cho executor, như trợ giúp phân giải | chỉ có biến độ sâu dispatch và liên kết provenance; một số executor mất cả cái đó | worker gọi tên case không cần flag; mỏ neo fail-closed vẫn là ràng buộc ledger |
| F13 | Đổi tên code theo N13 như một bước L10 sau | "runner" chỉ ba thứ; `src/workflow/runner.mjs` gói năm vai | người đọc và agent không nhầm; **chỉ sau** khi spec được duyệt |

## 15. Bất đồng được giữ nguyên (không lấy trung bình)

| Id | Người giữ | Lập trường | Vị trí của spec |
|---|---|---|---|
| P2-no-admission | panelist 2 | không có bước admission; chỉ kiểm tại điểm hiệu ứng; MUST chéo lời gọi được đóng gói vào một wave theo luật guide; chỉ xây admission khi pilot cho thấy trượt | bị bác như hợp đồng production (owner đã chấp nhận N1); giữ làm áp lực khống chế (không ngôn ngữ predicate, không DB milestone, không cửa thứ ba). Sự đồng ý của panelist 2 **không** được tuyên bố. Mở lại nếu một guide domain rút mọi MUST về đóng gói wave + sổ khung mà run thật không có va chạm chéo lời gọi |
| P2-pilot-first | panelist 2 | hỏi owner có muốn pilot khung-văn-xuôi có giới hạn trước khi làm engine | không hỏi ở đây; trình tự giao hàng nằm ngoài vòng thiết kế; owner gặp lựa chọn này ở plan |
| P2-coding-cutover | panelist 2 vs panelist 1, 3 | coding đã chạy state map; dời coding sang ledger là cutover có rủi ro | N12, N16; rủi ro R2, không phải ngã rẽ thiết kế |
| P3-corrections | panelist 3 | flag `--workflow-run` tuỳ chọn, CAS `expectedSeq`, stale toàn nhánh, auto-advance cho playbook, `rigorCeiling` | mỗi điểm bị bác hoặc thu hẹp (N1, N6, N2, N3, N7); panelist 3 chưa phản hồi, sự đồng ý không được tuyên bố |
| P3-catalog-count | panelist 3 vs panelist 1, 2 | đóng băng sáu primitive vs catalog mở các choke point có sẵn | N10: catalog đóng cho MUST do guide khai, sáu để khởi đầu; guard nền tảng ngoài catalog |
| new: placement | producer reopen (không có panelist) | N13, N14, N15, N16, N17 dựa trên bằng chứng repo cộng một reviewer và một red-team | ghi rõ là các khẳng định được review ít nhất; owner không mời thêm ghế |

## 16. Lịch sử quyết định

### (đề xuất) — Workflow là guide + ledger admission; agent chọn thứ tự; supersede một phần 0048 §2 và 0049 §4

- **Trạng thái:** **proposed — decision ID được gán khi owner duyệt.** Chưa có hiệu lực; 0048 và 0049 vẫn là luật đang chạy.
- **Bối cảnh:** 0049 đóng authority sprawl (ba sequencer chồng nhau) bằng cách để Workflow runner vừa giữ bản ghi vừa *quyết thứ tự*. Phần thứ hai lấy phán đoán về thứ tự khỏi agent, trái với tầm nhìn "trong mềm, ngoài cứng" (2026-09-05) và với hướng owner 2026-10-18. Bằng chứng: `coding/feature` chưa từng chạy trên runner (0/89 run); mọi run đã lưu là playbook; chuỗi lead 6.4 cho thấy luật chỉ-văn-xuôi bị bỏ qua ba lần, còn luật máy giữ được.
- **Quyết định đề xuất:**
  1. **0048 §2** ("driver không tự lập lịch, giao trọn cho Workflow runner") **thành:** agent đề xuất, Workflow case admit và ghi. Driver vẫn không tự merge và không tự cưỡng chế; nó chọn route.
  2. **0049 §4** ("Workflow runner là sequencer duy nhất") **thành:** Workflow case là authority duy nhất cho **admission và bản ghi tiến độ**, không phải bên chọn thứ tự. Chữ "sequencer" bị thu hồi.
  3. **Giữ nguyên:** 0048 §3 (consent cần `--approve`); 0049 §1–3 (Work không có stage, Workflow không cần Work, A4).
  4. Mô hình của spec này (RUL-WF-1 … RUL-WF-26) và các mặc định có tên N1–N17.
- **Hình thức:** một decision ID mới trong "Lịch sử quyết định" của spec chủ, không bao giờ sửa 0048/0049 tại chỗ.

### Các mặc định có tên (tham chiếu)

| Id | Mặc định | Trạng thái |
|---|---|---|
| N1 | ràng buộc authority fail-closed trên dispatch ghi file trong constrained case (RUL-WF-11) | **owner chấp nhận 2026-10-19 08:46** |
| N2 | subject = tập artifact được khai (RUL-WF-13) | đề xuất |
| N3 | playbook = guide listed-routes-only + tự đề xuất SHOULD duy nhất; không scheduler thứ hai (RUL-WF-18) | đề xuất |
| N4 | độc lập trên ledger; đóng gói bắt buộc khi đó là cách mã hoá duy nhất (RUL-WF-16) | đề xuất |
| N5 | hiệu ứng ngoài: unenforced hoặc người đánh giá (RUL-WF-17) | đề xuất |
| N6 | reserve-then-release dưới `advance`; không CAS (RUL-WF-10) | đề xuất |
| N7 | khung mang `rigorFloor`, không `rigorCeiling` (RUL-WF-12) | đề xuất |
| N8 | case không có Work là một Workflow run, dùng `advance`; không khoá thứ ba | đề xuất |
| N9 | `listedRoutesOnly` là cờ có authority trên decision point (RUL-WF-5) | đề xuất |
| N10 | catalog đóng sáu primitive khởi đầu; guard nền tảng tham chiếu (RUL-WF-7) | đề xuất |
| N11 | projection không bao giờ loại đường đề xuất unlisted (RUL-WF-5) | đề xuất |
| N12 | Work là bản ghi nghiệp vụ tuỳ chọn; FSM coding giữ tới cutover (RUL-WF-23) | đề xuất |
| N13 | từ vựng mục 2.1; "runner" không dành cho phần nào | đề xuất |
| N14 | admission/projection/Playbook driver giữ Node ở tầng infra hoặc thấp hơn; nền Rust bên dưới (mục 5.6) | đề xuất |
| N15 | dòng event case thành stream Event Store, có điều kiện re-rank `advance` (F10) | đề xuất, dòng chéo làn |
| N16 | `feature.yaml` giữ phần lifecycle tới cutover, thêm phần guide, chỉ xoá trường runner chết (mục 10.2) | đề xuất |
| N17 | `advance` chỉ là mutex admission; sống/chết driver là sự thật riêng (mục 5.4) | đề xuất, dòng chéo làn |

## 17. Pointers

- Ranh giới component: [../platform/component-boundary.md](../platform/component-boundary.md) (hàng Workflow, Work Lifecycle, Execution Core, Holder-lock — bản sửa nháp đi cùng spec này).
- Spec chủ hiện hành của Workflow và Execution Core: [runner.md](runner.md) (0047, 0048, 0049, RUL84 (one write-scope matcher), RUL89 (workflow start --units), RUL94 (a Work driver step runs as a Unit), RUL95 (dispatch takes generic inputs only)).
- Lifecycle Work và tail phổ quát: [work-state.md](work-state.md) (0027).
- Luật nền: [../platform-foundations.md](../platform-foundations.md) (L1, L3, L5, L9, L10).
- Holder-lock: [../platform/holder-lock/spec.md](../platform/holder-lock/spec.md); Event Store: [../platform/event-store/spec.md](../platform/event-store/spec.md); Run Supervisor: [../platform/run-supervisor/spec.md](../platform/run-supervisor/spec.md); Session Identity: [../platform/session-identity/spec.md](../platform/session-identity/spec.md).
- Code hiện tại (tham khảo, không khoá): `src/workflow/` (`definition.mjs`, `steps.mjs`, `loader.mjs`, `store.mjs`, `ref-digests.mjs`, `runner.mjs`, `units-source.mjs`, `plan-source.mjs`), `src/runner/execution/` (`run.mjs`, `unit.mjs`, `bind.mjs`, `patterns/`), `core/workflows/*.yaml`, `domains/coding/workflows/feature.yaml`, `domains/marketing/workflows/content-publish.yaml`, `core/skills/_shared/coordination-driver.md`.
- Báo cáo hội đồng: `plans/reports/brief-261018-2235-agent-workflow-model-owner-direction.md`, `plans/reports/research-261018-2239-workflow-design-intent-and-current-state.md`, `.fgos/assignments/unit-run-1792368757620-6e4020ea/` (settled), `.fgos/assignments/unit-run-1792374387809-85a2ae93/` (reopen, round 2), `.fgos/assignments/unit-run-1792376216726-2b96d8a9/` (giải thích reopen).
