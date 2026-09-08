# Independent Architecture Review — Agent Coordination và Team Cognitive / Group Thinking

Ngày review: 2026-09-05. Nội dung dưới đây lưu toàn bộ bản review trong hội thoại; các mô tả thao tác kiểm toán phản ánh lượt review trước khi tài liệu này được tạo.

**Executive verdict: FUNDAMENTAL REDESIGN — ở ranh giới authority, judgment và cách đưa soul vào execution. Không có nghĩa phải viết lại toàn bộ runtime.**

fgOS đã có một nền thực thi và lưu bằng chứng đáng giữ. Nhưng hệ hiện tại **chưa đạt “trong mềm, ngoài cứng”** theo chuẩn bạn đưa ra:

- Bên trong bị giới hạn bởi tập operation, actor, contribution và cách tính vòng; nhiều lựa chọn cần judgment trở thành thuộc tính cấu trúc.
- Bên ngoài chưa chặn được worker cùng quyền hệ điều hành đọc context ngoài grant, ghi ngoài phạm vi hoặc sử dụng identity của driver.
- Soul vẫn chủ yếu nằm ở phiên Lead bên ngoài. Đường chuyển doctrine/persona/context từ protocol xuống worker bị thiếu.
- Một số test đang bảo vệ chính những hành vi lệch vision, nên “test xanh” chưa phải bằng chứng kiến trúc đúng.

Tôi đánh giá working tree hiện tại, gồm các proposal chưa commit. Không sửa code/tài liệu, không vận hành skill fgOS/bee. Tôi chạy **12 file test tập trung, tất cả qua**, và một probe thuần đọc kiểm tra prompt renderer. Ba walkthrough dưới đây là truy vết code/test, không phải ba phiên gọi provider thật mới.

GitNexus MCP không khả dụng trong phiên này; sau khi đọc skill Exploring, tôi truy vết trực tiếp source/test.

---

**1. Findings theo severity**

**F1 — CRITICAL: Trust model hiện tại không đáp ứng yêu cầu “worker không tự mở quyền hoặc giả mạo identity”.**

Runner nói rõ worker chạy cùng quyền user; containment bằng chỉ dẫn và worktree, không phải sandbox. `read-only` được chấm và rollback sau thực thi. Đây là giới hạn được chủ ý chấp nhận, không phải suy đoán của reviewer. [assignment-runner.mjs:485](/home/vantt/projects/forgentX/src/runner/dispatch/assignment-runner.mjs:485)

Driver authority tại store là phép so sánh `authorizedBy.id === manifest.provenanceRoot.writerId`. Cửa request lại tạo driver identity từ `request.writerId`. Điều này kiểm tra tính nhất quán của nhãn, không xác thực người gọi. Worker có quyền đọc ledger và gọi CLI/import module vẫn nằm cùng trust class. [store.mjs:887](/home/vantt/projects/forgentX/src/runner/coordination/store.mjs:887), [run.mjs:422](/home/vantt/projects/forgentX/src/verbs/coordination/run.mjs:422)

Test còn xác nhận một caller trực tiếp có stamp hợp lệ, worktree hợp lệ và `isReadOnlyMode:false` được thực thi. [coordination-mutation-unlock.test.mjs:681](/home/vantt/projects/forgentX/test/runner/coordination-mutation-unlock.test.mjs:681)

**Hệ quả:** các bảo đảm identity, visibility, mutation và provenance hiện có chủ yếu giữ được khi caller tuân thủ cửa mediated. Chúng không đủ chống worker vượt quyền như chuẩn review này yêu cầu. Đây là thay đổi threat model cần quyết định kiến trúc, không thể giải bằng thêm câu “do not” trong prompt.

---

**F2 — HIGH: Soul không đi hết đường xuống worker.**

Prompt renderer chỉ đưa assignment/work/role, objective, context refs, expected outputs và nơi ghi report. Nó không render persona, constraints, mutation posture hay evidence requirements. [assignment.mjs:643](/home/vantt/projects/forgentX/src/runner/dispatch/assignment.mjs:643)

Runner gọi renderer ấy rồi chuyển `prompt`, `model`, `tier` sang executor; không chuyển resolved persona. Persona có trong policy/provenance nhưng chưa trở thành framing tại đường CLI này. [assignment-runner.mjs:843](/home/vantt/projects/forgentX/src/runner/dispatch/assignment-runner.mjs:843), [assignment-runner.mjs:917](/home/vantt/projects/forgentX/src/runner/dispatch/assignment-runner.mjs:917)

`task.contractTemplate` được schema chấp nhận, nhưng đường `dispatchDeclaredOperation` dựng contract từ tham số request, không đọc template đó. [definitions/schema.mjs:735](/home/vantt/projects/forgentX/src/runner/definitions/schema.mjs:735), [session-engine.mjs:2678](/home/vantt/projects/forgentX/src/runner/coordination/session-engine.mjs:2678)

Probe renderer của lượt này cho kết quả:

```text
includesPersona: false
includesConstraint: false
includesMutation: false
```

**Hệ quả:** `persona: "skeptical-reviewer"` có thể trông đúng trong request/provenance nhưng không làm worker nhận được skeptical-reviewer doctrine. Actor vẫn có intelligence của model và có thể tự đọc repo instructions; đó chưa phải soul được framework truyền đạt có chủ đích.

---

**F3 — HIGH: Completion đang quyết thay coordinator, đồng thời không bảo đảm review/fix đã hoàn tất về nghĩa.**

Có ba vấn đề kết hợp:

1. Quorum lấy **mọi actor trong manifest** làm required. Fixer chỉ có operation optional nhưng vẫn thiếu nếu chưa chạy. Test xác nhận first pass sạch không đóng được vì thiếu fixer. [session-engine.mjs:3411](/home/vantt/projects/forgentX/src/runner/coordination/session-engine.mjs:3411), [coordination-launch-master-loop.test.mjs:306](/home/vantt/projects/forgentX/test/verbs/coordination-launch-master-loop.test.mjs:306)
2. Với reviewer/red-team, recheck không có window không thuộc gating operations; first-pass result đủ thỏa actor. [session-engine.mjs:1462](/home/vantt/projects/forgentX/src/runner/coordination/session-engine.mjs:1462)
3. Sau mọi request, `run` tự thử đóng bằng quorum; không đòi quyết định `cell-closed`, không đọc severity/disposition để chứng minh không còn HIGH. [run.mjs:610](/home/vantt/projects/forgentX/src/verbs/coordination/run.mjs:610)

Vì vậy, một phiên có thể **không đóng khi không cần fix**, nhưng sau first pass và fixer đều thành công có thể **đóng trước request recheck tiếp theo**. Kết quả recheck cũng không mặc nhiên thay thế nghĩa của first-pass gating.

`cell-closed` trong tài liệu skill là một disposition được ghi lại, không phải điều kiện đóng mà engine cưỡng chế.

---

**F4 — HIGH: Code Panel/Plan Loop bị đứt ngay tại mutation forwarding; workaround prose không chữa được runtime truth.**

Schema nhận `mutation:"mutating"`, nhưng lời gọi `dispatchDeclaredOperation` trong `run` không truyền `step.mutation`; engine dùng mặc định read-only. [run.mjs:437](/home/vantt/projects/forgentX/src/verbs/coordination/run.mjs:437)

Test mutation tích cực gọi **trực tiếp engine**, nên không bắt được lỗi public request này. [coordination-mutation-unlock.test.mjs:248](/home/vantt/projects/forgentX/test/runner/coordination-mutation-unlock.test.mjs:248)

Code Panel và Plan Loop hướng dẫn Lead kiểm tra commit/test rồi coi kết quả `failed` là thành công cho disposition. Nhưng disposition không sửa RunResult mà quorum đọc. [Code Panel:67](/home/vantt/projects/forgentX/core/skills/fgos-code-panel/SKILL.md:67)

**Hệ quả:** Lead và ledger có hai cách hiểu thành công khác nhau. “Người thông minh biết bỏ qua lỗi harness” đang trở thành điều kiện vận hành sản phẩm.

---

**F5 — HIGH: “Adaptive coordinator” có tồn tại bên ngoài engine, nhưng public surface không cung cấp đủ hành động để nó thích nghi.**

Request chỉ có năm loại bước: `operation`, `fan-out`, `authorize`, `disposition`, `contribution`. Không có cửa tương ứng cho specialist authorization, retry, replacement, cancel hay aggregation validation. [schema.mjs:491](/home/vantt/projects/forgentX/src/verbs/coordination/schema.mjs:491)

Các primitive ấy phần lớn tồn tại ở engine, nhưng Lead phải viết adapter/import riêng để sử dụng. Headless dùng cùng `run`, nên không giải quyết khoảng trống này. [headless-adapter.mjs:51](/home/vantt/projects/forgentX/src/runner/coordination/headless-adapter.mjs:51)

Đường agent-led công khai chỉ dispatch primary task. Primitive consult bên dưới giới hạn một specialist; typed deliberation lại đòi declared protocol. [run.mjs:340](/home/vantt/projects/forgentX/src/verbs/coordination/run.mjs:340), [session-engine.mjs:623](/home/vantt/projects/forgentX/src/runner/coordination/session-engine.mjs:623), [session-engine.mjs:4156](/home/vantt/projects/forgentX/src/runner/coordination/session-engine.mjs:4156)

**Hệ quả:** emergent coordination mới đạt mức thích nghi trong các vị trí đã dự kiến. Chưa có đường sản phẩm đủ rộng cho “phát hiện unknown mới → gọi đúng specialist → đổi cách phối hợp → dừng có lý do”.

Coordinator bên ngoài là agent có judgment; `run` là bộ thực thi request. Sai lệch nằm ở việc coi hai thứ đó đã hợp thành một sản phẩm điều phối hoàn chỉnh.

---

**F6 — HIGH: Visibility window vừa quá cứng về cấu trúc, vừa chưa đủ cứng về quyền đọc.**

Window trên binding `required` được schema chấp nhận nhưng **không gate dispatch**. Test xác nhận worker vẫn chạy khi window đóng. Link contribution sau đó có thể từ chối vì reasoning được tạo trước window. [coordination-visibility-window-fixture.test.mjs:712](/home/vantt/projects/forgentX/test/runner/coordination-visibility-window-fixture.test.mjs:712), [session-engine.mjs:4225](/home/vantt/projects/forgentX/src/runner/coordination/session-engine.mjs:4225)

`permits.sourceOperationRefs` không được dùng làm filter từng ref trong grant; runtime kiểm tra ownership cùng session và membership của context trong grant. [session-engine.mjs:1904](/home/vantt/projects/forgentX/src/runner/coordination/session-engine.mjs:1904), [session-engine.mjs:2608](/home/vantt/projects/forgentX/src/runner/coordination/session-engine.mjs:2608)

Với topology edge, context bị thay bằng đúng `[fromAssignmentId]`; context bổ sung của caller bị loại. [session-engine.mjs:2442](/home/vantt/projects/forgentX/src/runner/coordination/session-engine.mjs:2442)

**Hệ quả:** actor có thể thiếu thông tin chính đáng trong prompt, trong khi subprocess cùng quyền user vẫn có khả năng đọc file ngoài grant. Bảo vệ context được truyền không đồng nghĩa bảo vệ context có thể truy cập.

---

**F7 — HIGH: Aggregation đang gán nghĩa “consensus” cho kiểm tra cấu trúc, rồi buộc terminal phải consensus.**

`deriveDisclosures` coi `status === "blocked"` là dissent; mọi trạng thái khác cho `dissent:"none"`. Một reviewer hoàn thành báo cáo phản đối với `status:"done"` không tự trở thành dissent. [session-engine.mjs:3699](/home/vantt/projects/forgentX/src/runner/coordination/session-engine.mjs:3699)

Evaluator trả `consensus` khi coverage/disclosure/revision hợp lệ và không còn dissent do input khai báo chưa resolved. Nó không kiểm tra các lập luận có đồng thuận hay bản synthesis có bảo tồn phản biện. [aggregation-evaluator.mjs:323](/home/vantt/projects/forgentX/src/runner/team-cognition/aggregation-evaluator.mjs:323), [aggregation-evaluator.mjs:389](/home/vantt/projects/forgentX/src/runner/team-cognition/aggregation-evaluator.mjs:389)

Output artifact của aggregate còn là tham số optional; kiểm tra nguồn không tương đương kiểm tra bản tổng hợp. [session-engine.mjs:3814](/home/vantt/projects/forgentX/src/runner/coordination/session-engine.mjs:3814)

Khi aggregate được dùng để đóng, `qualified` và `no-consensus` đều bị từ chối. [session-engine.mjs:3606](/home/vantt/projects/forgentX/src/runner/coordination/session-engine.mjs:3606)

**Hệ quả:** một cuộc architecture review kết thúc rất tốt bằng “còn hai lựa chọn, chưa đủ bằng chứng quyết định” lại không có kết thúc bình thường qua surface này. Harness đang chọn mục đích tư duy thay coordinator.

Giới hạn phạm vi: bốn protocol trong pack hiện không khai báo `completion.aggregation`; không được nói chúng đã được bảo vệ bởi cơ chế này.

---

**F8 — HIGH: Binding resolution và cách đếm round biến giới hạn kỹ thuật thành phương pháp tư duy.**

Resolver chọn binding đầu tiên theo `operationId + actorId`; không chọn theo node thực sự người gọi muốn thực hiện. [session-engine.mjs:1018](/home/vantt/projects/forgentX/src/runner/coordination/session-engine.mjs:1018)

Delphi phải tạo `propose-round1` và `propose-round2` thành operation khác nhau chính vì giới hạn đó. [group-thinking-delphi-feedback-lite.yaml:23](/home/vantt/projects/forgentX/core/coordination-protocols/group-thinking-delphi-feedback-lite.yaml:23)

`maxRounds` toàn session so sánh với `manifest.assignmentRefs.length`, giống bộ đếm Assignment. [store.mjs:768](/home/vantt/projects/forgentX/src/runner/coordination/store.mjs:768)

**Hệ quả:** một vòng có ba chuyên gia bị tính thành ba vòng. Proposal advisory dự kiến bảy round và tối đa 18 Assignment không thể được hiểu theo nghĩa round mà proposal mô tả nếu đưa nguyên các bound vào runtime.

Cần phân biệt thêm: graph không phải một FSM nghiêm ngặt đang thực thi toàn bộ `transitions`. Dispatch chủ yếu tra binding và các gate cụ thể; thứ tự request do caller đưa. Hệ đang cứng ở vocabulary/binding nhưng không tự bảo đảm mọi quan hệ trước–sau mà hình graph gợi ra.

---

**F9 — HIGH: Portability giữ được executor/tier một phần, nhưng làm mất lựa chọn model và policy của fan-out.**

Declared protocol từ chối `--model` và `actors[].model` vì PolicyPatch không có đường chuyển model override. [run.mjs:146](/home/vantt/projects/forgentX/src/verbs/coordination/run.mjs:146)

Actor xuất hiện trong fan-out bị từ chối override persona/executor/model/tier ở request; cohort planner quyết allocation. [run.mjs:400](/home/vantt/projects/forgentX/src/verbs/coordination/run.mjs:400)

Executor và tier riêng cho operation actor có thật; provider/model có thể được suy ra từ config. Nhưng đó chưa phải toàn bộ khả năng chọn executor/provider/model/tier/persona theo role mà mục tiêu sản phẩm đòi hỏi.

Không pin vendor vào portable protocol là lựa chọn hợp lý. Thiếu kênh deployment/request binding đầy đủ là vấn đề riêng, không phải cái giá tất yếu của portability.

---

**F10 — MEDIUM: Typed contribution bảo tồn artifact, nhưng buộc mọi reasoning muốn có lineage phải mang cấu trúc protocol.**

Contribution cần declared operation stamp, một visibility window, settled RunResult có revision pin và type nằm trong `allowedTypes`. Không có window thì không được contribution, kể cả reasoning không có nhu cầu privacy. [session-engine.mjs:4181](/home/vantt/projects/forgentX/src/runner/coordination/session-engine.mjs:4181), [session-engine.mjs:4202](/home/vantt/projects/forgentX/src/runner/coordination/session-engine.mjs:4202)

Phần đúng: nội dung reasoning vẫn nằm trong artifact, không bị ép hết vào event fields.

Phần sai: để lưu một objection/clarification đơn giản, tác giả phải chuẩn bị đủ operation, binding, window và contribution type. Kernel đang sở hữu vocabulary tư duy, thay vì chỉ bảo vệ tác giả, nguồn, revision và quyền chia sẻ.

---

**F11 — MEDIUM: Plan Loop resume được execution, chưa thay thế được bộ nhớ judgment của master prompt.**

`chain` liệt kê các session theo prefix, chọn session active mới nhất và đưa hint từ pending authorizations/quorum. Nó không đọc plan requirements, dependencies, baseline, scope/base commit hay requirement-to-proof matrix. [chain.mjs:130](/home/vantt/projects/forgentX/src/verbs/coordination/chain.mjs:130)

Do đó, claim “mọi thứ index/current-cell/cell trace từng giữ đã map vào ledger” chưa được chứng minh. [group-thinking-plan-loop.md:145](/home/vantt/projects/forgentX/docs/architect/proposals/group-thinking-plan-loop.md:145)

Fresh process biết **đã gọi ai**, nhưng chưa chắc biết **vì sao chọn cell này, điều gì chưa được giải, proof nào đáp ứng requirement nào, và khi nào phải đổi kế hoạch**.

Thêm nữa, wall-time tính từ `manifest.createdAt`, mặc định một giờ. Park để chờ người qua ngày có thể resume đọc được nhưng không dispatch tiếp được. [schema.mjs:75](/home/vantt/projects/forgentX/src/runner/coordination/schema.mjs:75), [session-engine.mjs:2009](/home/vantt/projects/forgentX/src/runner/coordination/session-engine.mjs:2009)

---

**F12 — HIGH về integrity: Definition không được pin theo nội dung.**

Session giữ `{id, version}` và các cửa quan trọng tải lại definition rồi so version. Thay nội dung mà giữ id/version không bị phát hiện bằng cơ chế này. [schema.mjs:47](/home/vantt/projects/forgentX/src/runner/coordination/schema.mjs:47), [session-engine.mjs:1872](/home/vantt/projects/forgentX/src/runner/coordination/session-engine.mjs:1872)

Điều đó có thể đổi cohort, window, binding hoặc bỏ aggregation requirement của một session đang tồn tại. Contract cũng ghi nhận đúng giới hạn này. [coordination-session.md:402](/home/vantt/projects/forgentX/docs/architect/agent-coordination/contracts/coordination-session.md:402)

**Hệ quả:** version provenance chưa đủ bảo đảm fresh process resume cùng legality envelope cũ, kể cả thay đổi là vô tình.

---

**2. Ba walkthrough**

**Walkthrough A — Concrete code change qua Code Panel**

Tình huống: sửa một hàm parser để từ chối input rỗng, thêm regression test.

| Câu hỏi | Hành vi thực tế |
|---|---|
| Judgment ở đâu? | Lead viết objective, xác định test, đọc diff, đánh giá finding và quyết định cần fix. Worker phán đoán trong phạm vi objective. |
| Coordinator tự chọn gì? | Nội dung nhiệm vụ, executor/tier của từng operation actor, disposition, có gửi authorization hay không. |
| Cấu trúc định trước gì? | Roster doer/reviewer/red-team/fixer và sáu operation. Không có investigation/specialist operation trong fixture. |
| Actor nhận context gì? | Objective riêng, role, các Assignment ID từ `$ref`, expected outputs và đường dẫn result. Không tự nhận persona/doctrine hay nội dung upstream report. |
| Runtime enforce gì? | Binding/role, authorization một lần, một số context grants, bounds, evidence grading và quorum. |
| Prose hứa gì? | Independent review + red-team; chỉ fix khi cần; clean recheck trước close; Lead xác minh test. |
| Lệch happy path? | Mutation bị mất ở public door; không cần fix vẫn thiếu fixer; khi cần fix, template recheck dùng `$ref:revise` nhưng authorization không cấp ref ấy nên bị từ chối. |

Lỗi grant trong template có thể đối chiếu trực tiếp: authorization thiếu `grantedContextRefs`, operation recheck lại mang context revision. [Code Panel:219](/home/vantt/projects/forgentX/core/skills/fgos-code-panel/SKILL.md:219), [session-engine.mjs:2608](/home/vantt/projects/forgentX/src/runner/coordination/session-engine.mjs:2608)

**Kết luận walkthrough:** intelligence đủ tốt của Lead có thể phát hiện và sửa request, nhưng đường sản phẩm chuẩn chưa thực hiện đáng tin cậy ngay cả một code change đơn giản.

---

**Walkthrough B — Plan nhiều phase qua Plan Loop**

Tình huống: phase 1 định nghĩa contract, phase 2 triển khai, phase 3 integration validation; phase 2 phát hiện giả định phase 1 sai.

| Câu hỏi | Hành vi thực tế |
|---|---|
| Judgment ở đâu? | Toàn bộ audit, chia cell, đánh giá dependency, reframe và lựa chọn phase tiếp theo nằm ở Lead. |
| Coordinator tự chọn gì? | Cell mới, scope/objective, disposition, request fix; có thể mở session khác trong giới hạn công cụ ngoài engine. |
| Cấu trúc định trước gì? | Mỗi cell dùng lại master-loop fixture. `chain` không diễn giải plan; session terminal không reopen. |
| Actor nhận context gì? | Chỉ phần Lead ghi vào objective/context refs/expected outputs. Không có cơ chế tự dựng role packet tương đương raw master prompt. |
| Runtime enforce gì? | Execution/evidence từng session, authorization/idempotency và giới hạn; không enforce phase dependency hay một active cell trên toàn track. |
| Prose hứa gì? | Resume lạnh, audit → cell → review → fix → close, không quên requirements. |
| Lệch happy path? | Lead phải tự xác định phase nào mất hiệu lực, lưu rationale và mở work tiếp theo. `chain` không khôi phục được thông tin chưa từng ghi; session đợi quá wall-time không tiếp tục dispatch được. |

**Kết luận walkthrough:** Plan Loop là convention xâu chuỗi session cộng thao tác của Lead. Nó chưa thay thế trọn vẹn operational intelligence và durable reasoning của master prompt.

---

**Walkthrough C — Architecture question chưa rõ qua Group Thinking**

Tình huống: “Deploy đang chậm; có nên thêm một orchestrator mới?”

Đường hiện có gần nhất là RFC review: convene → propose → hai objector → authorized response. Nhưng trước khi review một RFC, cần xác định deploy chậm do kiến trúc, CI, tổ chức hay cách dùng công cụ.

| Câu hỏi | Hành vi thực tế |
|---|---|
| Judgment ở đâu? | Lead phải chọn phương pháp, điều tra/reframe trước hoặc tự nhúng yêu cầu ấy vào objective của operation có sẵn. |
| Coordinator tự chọn gì? | Prompt từng operation, routing được hỗ trợ, grant và thời điểm response; các hành động khác cần đi xuống engine hoặc mở protocol/session khác. |
| Cấu trúc định trước gì? | Proposer, hai objector, response và visibility windows. Group Thinking surface yêu cầu protocol được chọn tường minh; không tự chọn theo vấn đề. |
| Actor nhận context gì? | Objective/ref của request. `contractTemplate: rfc-review-lite-*` chưa tự nạp doctrine. |
| Runtime enforce gì? | Authorized reveal sau nguồn bắt buộc, contribution lineage/type và quorum; không chứng minh đề xuất đã hiểu đúng vấn đề. |
| Prose hứa gì? | Advisory proposal mới hứa investigate-before-ask, alternative framing, selective reopen và decision dialogue. Đây chưa phải capability đã ship. |
| Lệch happy path? | Cần specialist chưa dự kiến, thêm framing round hoặc chờ human decision: surface hiện tại thiếu các cửa cần thiết. Nếu dùng aggregation và còn dissent hợp lệ, terminal bị chặn. |

Proposal advisory có những doctrine tốt, nhưng đồng thời ấn định số postures, chín phase, bảy round và một lần sửa synthesis. Các điều đó cần được đánh giá như **method defaults có thể điều chỉnh**, không nên mặc nhiên nâng thành legality. [architecture-advisory-panel.md:215](/home/vantt/projects/forgentX/docs/architect/proposals/architecture-advisory-panel.md:215)

**Kết luận walkthrough:** hệ đã hỗ trợ choreography của một vài phương pháp nhóm; chưa chứng minh có thể tiếp nhận một vấn đề chưa rõ và tự chọn, kết hợp, thay đổi phương pháp trong quyền đã cấp.

---

**3. Hard đúng chỗ / Hard sai chỗ / Soft đúng chỗ / Soft nhưng cần hard**

| Phân loại | Những gì thuộc nhóm này |
|---|---|
| **Hard đúng chỗ** | Assignment/Run identity; idempotent authorization consumption; lock-held bounds; session membership; malformed/foreign evidence refusal; revision pin; retry giữ lịch sử; terminal write serialization. |
| **Hard sai chỗ** | Mọi actor thành required; window khiến optional operation thành completion gate; consensus-only close; round = Assignment; first-binding resolution; một specialist ở agent-led; contribution bắt buộc graph/window; thiếu model override. |
| **Soft đúng chỗ** | Hiểu/reframe vấn đề; chọn specialist và phương pháp; phản biện; đánh giá finding; cân nhắc đủ bằng chứng; chấp nhận dissent; giải thích và hỏi người. |
| **Soft nhưng cần hard** | Worker không ghi ngoài quyền; không đọc sibling ngoài grant; không giả driver/human; không sửa ledger/config/definition để mở quyền; review gắn đúng candidate revision; bằng chứng hoàn tất không chỉ dựa vào câu disposition. |

“Có giới hạn” là đúng. “Kernel tự chọn ý nghĩa của một vòng, một kết thúc tốt hoặc một sự đồng thuận” là chuyện khác.

---

**4. Bản đồ authority và judgment**

| Tầng | Quyền/judgment dự kiến | Thực tế hiện tại |
|---|---|---|
| **User** | Objective, scope, budget, quyền mutation và quyết định sản phẩm | Chủ yếu truyền qua phiên Lead/request; chưa có primitive trusted human decision cho advisory. |
| **Coordinator/Lead** | Hiểu tình hình, đổi cách phối hợp, cấp hành động trong envelope, quyết định dừng | Có judgment thật nhưng ở ngoài engine; public action set hẹp; identity là writer string; auto-close có thể vượt trước judgment. |
| **Actor** | Investigation, implementation, critique, synthesis; đề xuất hành động tiếp | Được dispatch thành execution riêng, nhưng role packet thiếu soul/context; process authority có thể rộng hơn Assignment authority. |
| **Runtime** | Xác thực quyền, giới hạn execution, bảo vệ evidence/visibility/replay | Enforce mạnh tại API/store đối với caller tuân thủ; chưa có containment tương ứng cho worker. Đồng thời quyết cả một số cognitive semantics. |
| **Resume process** | Khôi phục cả tiến độ và rationale đủ để tiếp tục | Khôi phục tốt execution facts đã ghi; không tự khôi phục judgment chưa được lưu, và definition chưa content-pinned. |

Ranh giới cần chất vấn nhất là **actor process ↔ runtime authority**. Hiện hai bên tách về khái niệm nhưng chưa tách tương ứng về quyền thực thi.

---

**5. Accidental rigidity**

Những chỗ harness đang quyết thay agent hoặc buộc agent phục vụ mô hình của harness:

1. Tất cả actor phải hoàn thành, kể cả optional fixer.
2. Operation optional có visibility window trở thành completion obligation.
3. Tự đóng sau request, chưa chờ quyết định đủ/thiếu của coordinator.
4. Chỉ `consensus` mới đóng được khi bật aggregation.
5. Số Assignment được gọi là số round.
6. Một operation/actor lặp ở node khác không được address độc lập.
7. Topology lấy incoming edge đầu tiên và ép context về một upstream Assignment.
8. Contribution cần operation/window/type định trước.
9. Agent-led chỉ có một specialist; các khả năng thích nghi khác bị đẩy xuống API nội bộ.
10. Model override của declared protocol và policy override fan-out bị chặn.
11. Public operation steps chạy tuần tự, không có điểm judgment tự động giữa các kết quả trong cùng request.
12. Wall-time tiếp tục trôi khi phiên chờ người.
13. Group Thinking entry yêu cầu caller biết protocol ID trước khi bắt đầu.
14. Proposal advisory có nguy cơ biến phương pháp tư vấn thành phase/artifact ceremony bắt buộc.

Không phải mọi graph đều sai. Graph hữu ích khi người dùng **chọn một phương pháp có cấu trúc**. Sai lệch là để các giới hạn của biểu diễn ấy quyết định khả năng tư duy của nền tảng.

---

**6. Unsafe softness**

1. “Worker không sửa repo/main/config/ledger” còn phụ thuộc quyền và sự tuân thủ của subprocess.
2. “Reviewer không đọc draft của nhau” chưa có enforcement filesystem tương ứng.
3. “Chỉ driver authorize” kiểm tra identity string, chưa có caller authentication.
4. “Protocol đã pin” dựa id/version, chưa giữ nguyên nội dung.
5. “Recheck đúng revision” chưa bắt buộc target revision đầy đủ ở mẫu Code Panel/Plan Loop.
6. “Không còn HIGH, test xanh rồi mới close” nằm ở Lead prose; quorum không chứng minh điều đó.
7. “Aggregation bảo tồn dissent” phụ thuộc cách dissent được khai báo; hoàn tất một báo cáo phản đối có thể bị hiểu là không dissent.
8. “Human đã quyết định” chưa có boundary riêng trong advisory runtime.

Điểm 7 không đòi kernel hiểu ngôn ngữ tự nhiên. Nó đòi kernel không gắn nhãn nhận thức mạnh hơn dữ liệu thực sự chứng minh.

---

**7. Raw master-coordination prompt so với engine hiện tại**

| Khả năng | Raw master prompt | Native path hiện tại |
|---|---|---|
| Audit và chia cell | Có hướng dẫn cụ thể, dựa requirements và evidence | Lead phải bổ sung; chain không làm việc này |
| Role packet | Có scope/base, Must Read, test, ownership, report path | Renderer cơ bản; persona/template chưa thành doctrine |
| Research bổ sung | Có Researcher cho unknown có giới hạn | Master-loop fixture không có slot ấy; surface thiếu recruitment |
| Điều chỉnh fix/recheck | Lead disposition và chọn nhánh theo findings | Chọn được optional bindings đã có, nhưng quorum/close lệch nghĩa |
| Parallel review/red-team | Cho phép với immutable scope/base | Các operation steps tuần tự; fan-out có kênh policy khác |
| Cold resume | Index/current-cell/proof matrix chứa rationale | Ledger tốt về execution; mapping từ requirements/judgment chưa đầy đủ |
| Provider diversity | Phụ thuộc host/tool | Executor/tier binding và provenance là tiến bộ thật; model còn thiếu |
| Trust và evidence | Nhiều nguyên tắc bằng prose | Có guard/store/evidence thật, nhưng chưa containment chống worker |
| Chi phí dùng phương pháp mới | Viết/chỉnh operating prose | Ngoài consult đơn giản, thường phải thêm protocol graph và wiring |

Raw prompt cũng có rigidity: một active cell, role set hẹp và các gate cố định. Nó không phải chuẩn hoàn hảo. Tuy nhiên, native path hiện tại **chưa bảo tồn được đầy đủ intelligence mà raw prompt đã thể hiện**, dù đã bổ sung bằng chứng thực thi tốt hơn.

---

**8. Những capability phải giữ**

- Một đường thực thi chung `Assignment → Dispatch → Run → RunResult`.
- Work-independent coordination; không tạo backlog giả để hỏi ý kiến agent.
- Phân biệt retry với recheck và giữ nguyên bằng chứng cũ.
- Authorization có identity/provenance, idempotency và chống double-consumption tại cửa mediated.
- Lock-held budget/concurrency checks và replay qua process restart.
- Evidence grading không lấy exit zero làm semantic success; revision pin và kiểm tra nguồn.
- Executor/tier selection riêng từng operation actor, kèm provenance.
- Optional declared protocol và project/domain/core discovery.
- Reasoning content nằm trong artifact, ledger giữ ref/lineage.
- External coordinator giữ judgment, không bắt buộc trở thành actor trong worker graph.

Các capability này là lý do không nên “đập đi xây lại” toàn bộ code. Phần cần thiết kế lại là cách ghép chúng thành một hệ có soul và một trust envelope đúng nghĩa.

---

**9. Những giả định chưa thể chứng minh từ repo**

- Nhóm nhiều agent tạo chất lượng quyết định cao hơn một agent mạnh với cùng ngân sách.
- Persona được áp dụng ở tất cả provider bằng cơ chế ngoài renderer đã đọc.
- Các executor thực tế cùng đạt một mức confinement/independence.
- Provider/model được khai báo tương ứng chính xác backend đã chạy ngoài provenance config.
- Một phiên mới chỉ cần `chain/show` là khôi phục được toàn bộ rationale của track.
- Doctrines advisory mới đã được chứng minh trên câu hỏi kiến trúc thật.
- Các test mang tên “live” đều là live LLM: test launcher đã đọc dùng `writeFakeExecutorConfig`, nên chứng minh subprocess/runtime wiring, không chứng minh cognitive quality.
- Phạm vi audit này bao phủ mọi dạng concurrent tampering hoặc mọi failure của provider.

Không có cơ sở gọi Group Thinking hiện tại là vô dụng; cũng chưa có cơ sở gọi nó là một đội tư duy thích nghi đã được chứng minh.

---

**10. Năm câu hỏi kiến trúc quan trọng nhất cho brainstorm tiếp theo**

1. **Worker thuộc trust class nào?** Nếu worker có thể bị prompt injection hoặc hành động sai, boundary nào thực sự ngăn nó lấy quyền driver, đọc sibling và sửa evidence?

2. **Semantic action tối thiểu mà coordinator được đề xuất là gì?** Một Lead có thể gọi investigation, challenge, specialist, recheck hoặc đổi cách phối hợp trong envelope hiện có mà không phải author một protocol graph mới hay không?

3. **Soul được đóng gói và truyền tới actor bằng gì?** Làm sao chứng minh worker nhận đủ doctrine, context, quyền và posture, đồng thời giữ quyền tự suy nghĩ thay vì chỉ điền output form?

4. **“Đã hoàn tất công việc”, “đủ bằng chứng”, “có đồng thuận” và “nên dừng” thuộc các authority nào?** Một kết quả còn dissent hoặc chưa đủ bằng chứng có được hoàn tất một cách trung thực không?

5. **Fresh process phải resume những gì ngoài execution facts?** Requirement, candidate revision, unresolved question, rationale chọn phương pháp và điều kiện đổi hướng được giữ ở đâu mà không biến ledger thành mô hình của mọi tương tác?
