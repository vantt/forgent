# Bản chốt thiết kế: Multi-role Team Harness & Marketing-Cockpit Absorption

> Bằng chứng distill của 24 vòng thảo luận (2026-08-15, item `tsk-2t9c`),
> người dùng duyệt từng cụm qua các vòng và duyệt bản distill này ở vòng
> 21 (D13 bổ sung ở vòng 24). Nguồn chi tiết: `DISCUSSION.md` (Q&A log
> + §6 synthesis), `CONTEXT.md` (bảng 13 quyết định), `plan.md` (spec 3
> mảnh triển khai, chi tiết per-file).
> Mỗi D-ID dưới đây có bản ghi máy tương ứng qua `fgos decision`
> (event seq ghi kèm) — ba nguồn phải luôn khớp nhau.

## Hành trình

Xuất phát từ yêu cầu so sánh cơ chế điều phối fgOS vs marketing-cockpit
(2 scout haiku + phản biện fable, vòng 1–2), thảo luận mở rộng thành
thiết kế **core harness tổng quát cho team agent đa role** — absorption
cockpit trở thành *khách hàng đầu tiên* của harness thay vì mục tiêu duy
nhất. Hội tụ lần 1 ở vòng 8 (D1–D8; exploring + planning đã chạy), người
dùng dừng trước implement rồi đào sâu thêm 16 vòng ra D9–D13, và
planning chi tiết per-file (vòng 22).

## I. Kiến trúc nền (D1 seq 18029, D3 seq 18031)

- **Mechanism vs Policy**: harness (cơ học) chỉ gác legality + ghi sự
  thật vào event log + đánh thức đúng vai — *không bao giờ phán đoán*.
  Soul (agent-type) hiểu vai trò, hiểu vấn đề, biết cần ai support — *tự
  chọn* edge hợp lệ. Route bậy → REFUSED kèm danh sách edge hợp lệ
  (chặn và dạy tại chỗ).
- **Ba trục trực giao trên work item**: `status` (lifecycle phổ quát, 11
  trạng thái — giữ nguyên) × `stage` (thuộc workflow đã chọn) ×
  `role/holder` (mới, opt-in per-domain qua `roleGraph`).
- **Ba tầng điều phối không giẫm nhau**: Router/Driver (who/what-next —
  `fgos-routing`, `fgos-coding-driving`) / Guard (legality — FSM +
  roleGraph + gates) / Dispatch (executor nào chạy —
  `src/runner/dispatch.mjs` decide/execute, một cửa).

## II. Handoff — trái tim của tính uyển chuyển (D4 seq 18032, D8 seq 18070, D5 seq 18058)

- **Hai loại handoff**: **Call** (round-trip, bóng về người gửi) với 4
  reason do người dùng định nghĩa: `advise` / `assist` (tay chân) /
  `review` (phản biện) / `consult` (chuyên môn) — tổng quát hoá
  `fgos ask/answer` sẵn có. **Pass** (chuyển giao một chiều theo stage).
  Ranh giới: cùng item → handoff; khác item/cây → signal.
- **Call lồng được, trần callstack** (mặc định 3, config override — con
  số cụ thể do planning quyết, người dùng chốt nguyên tắc vòng 5).
- **Ghi log hai mức (D8)**: async call = handoff event đầy đủ, holder
  đổi; sync call trong-session (subagent) = một event `call-summary`
  gọn, holder giữ nguyên. Invariant: *holder chỉ đổi qua async handoff*.
  Mỗi handoff = một checkpoint hạt mịn tự nhiên (context snapshot trong
  event + worktree commit cho artifact) — không cần checkpoint machinery
  riêng như cockpit.
- **Gate hard/soft (D5)**: hard một-chiều ⟺ side effect vượt ranh giới
  item/worktree (merge main CTR005, publish ra ngoài, terminal
  done/wontfix, cleanup đã xoá worktree; vùng hậu-merge một chiều —
  rework = item mới). Mọi gate nội bộ item = soft: quay lại được nhưng
  *bắt buộc ghi reason* → rework thành tín hiệu compound-learn. Áp
  nguyên xi cho marketing (publish = hard, editorial approval = soft).

## III. Cấu trúc khai báo (D6 18059, D7 18060, D9 18110, D10 18189, D12 18232, D13 18242)

- **Hierarchy: domain → N workflow → item (D7)**. Coding đang gộp 1
  workflow (bằng chứng gồng: discovery-verdict skip là nhánh vá; luật
  bug-prove-cause khác bản chất feature; docs/chore chịu ceremony thừa)
  — un-gộp thành `feature` (graph hiện tại, default) / `bugfix` /
  `lightweight`. Selector tái dùng `kind` qua map `workflowFor` có
  default; item cũ fold về default, không migration. Phân biệt đóng
  đinh: **workflow** = shape lifecycle MỘT item; **template**
  (`fgos expand`) = composition NHIỀU item thành cây.
- **Ontology 4 tầng (D6 + D10)**: **task-spec** (phiếu giao việc —
  contract: input/output/gates/verify-template; bất biến theo người làm)
  / **skill** (know-how — của executor, compound-learn rewrite tự do) /
  **knowledge** (chuyên môn domain — coding phần lớn nằm trong model
  weights, marketing là tài sản file thật của cockpit) / **context**
  (bối cảnh instance — chính là refs/docsRef/docs/CONTEXT.md/memory sẵn
  có, không xây gì mới). Lợi ích tách đã kiểm chứng: `review-item` có 3
  executor ngay hôm nay (người + /code-review + reviewer-agent tương
  lai); engine chỉ parse được contract (sự cố tsk-59a: contract `Mode:`
  chôn trong skill prose, đổi văn phong gãy regex engine); tần suất đổi
  khác nhau cần mức gate khác nhau; có-phiếu-trước-có-tay-nghề-sau khi
  port cockpit. Nói thật cả case không đáng tách: 1 executor vĩnh viễn,
  không engine coupling → A-lite không tách đại trà.
- **Collaboration trigger (D9)**: mỗi task-spec bắt buộc có bảng
  trigger-prose per call-edge, per (workflow × stage) — *khi nào gọi,
  reason gì, tới ai, bóng về mang gì*. Đây là câu trả lời cho "làm sao
  agent biết khi nào nên hỏi gì và hỏi ai". Prototype đã chạy thật ở
  dạng ngầm: filter material/grounded/answerable của exploring = trigger
  advise; description của fgos-researching = trigger consult. Phân công
  runtime: **prose dạy — soul quyết — guard chặn**; lệch pattern hiện ra
  ở compound-learn qua call-summary/handoff events.
- **Position vs Agent-type (D10 + D12)**: roleGraph đóng ở **5
  position** (implementer / researcher / reviewer / helper /
  human-advisor) — nguyên tắc *nở task trước, nở role sau*
  (security-auditor = Reviewer + phiếu `audit-security`, không phải role
  mới). Chức danh (PO/PM/TechLead/SE/Tester) = **agent-type definition
  sẵn có** (`.claude/agents/*.md`), khai eligibility bằng đúng **một
  field frontmatter `claims: [phiếu]`** — positions suy ra từ phiếu.
  Không roster file, không humans registry, không agent-pools: pool size
  = worker-slots sẵn có; spawn-on-demand = runner/dispatch sẵn có; thẩm
  quyền human = pull-door verbs sẵn có (approve/answer do người chạy).
  PM cổ điển đã được máy hoá (frontier/triage/stale/merge) — đúng nghĩa
  ưu tiên #2 "release con người". Coding có ~13 phiếu: 6 phiếu stage của
  implementer + 7 phiếu call-target.
- **Binding soul↔role (D11 seq 18229)**: role là thuộc tính *per-item*,
  không phải ghế team. Cross-item: nhiều soul cùng position chạy song
  song (parallel claims sẵn có). Trong item: call nhắm `(position,
  phiếu)` → rơi vào frontier như work-order nhỏ → session mang
  agent-type có phiếu đó trong `claims` tự claim (**pull**, không
  push-assign), claim event ghi (sessionId, agent-type); **sticky trong
  một call-thread** (vòng sau về đúng soul giữ context); **targeted
  call** (`--to-soul`) là ngoại lệ có chủ đích, ghi event cho
  compound-learn soi. Soul instance là runtime record sinh lúc claim —
  không phải config. Solo mode thoái hoá êm: một soul mang nhiều
  agent-type, self-review vẫn hữu hình trong log.

- **Artifact-schema (D13 seq 18242)**: ép schema tách đôi — **harness**
  cấp validator + chokepoint (validate TRƯỚC dispatch để không đẻ item con
  mồ côi; lỗi trả về machine-readable để agent tự sửa; luôn có đường soft
  ghi reason, không chặn cứng), **schema là domain data** khai cạnh
  task-spec. Cockpit ship 41 file JSON-Schema draft-07 chia hai họ:
  declaration (~8: agent/skill/workflow/runtime — học ngay ở mảnh ③ dạng
  doctor check) và artifact (~33: brief/slot/calendar/persona/
  brand-profile — đi cùng port marketing). KHÔNG làm artifact-schema cho
  coding: artifact coding là văn xuôi, không phải structured data. Việc
  cockpit thường xuyên sai schema là bằng chứng ỦNG HỘ gate cơ học cho
  structured data do LLM sinh, đồng thời cảnh báo enforcement không có
  đường sửa thì item kẹt.

## IV. Trình tự triển khai (D2 seq 18030)

**Coding trước** (quyết định người dùng, đảo đề xuất marketing-first ban
đầu): coding đã chứa đủ 4 tương tác call ở dạng ngầm — chỉ nâng thành
move hữu hình, không phát minh tương tác mới:

| Reason | Tương tác ngầm hiện có |
|---|---|
| consult | `fgos-researching` gọi giữa exploring/planning |
| review | `code-review` / vòng approve-reject |
| assist | subagent fanout (`fgos-fanout`, Agent tool) |
| advise | `fgos ask`/`answer` + `awaiting-human` |

Thứ tự: ① role-axis + handoff đáp lên graph đơn hiện tại → ② un-gộp
coding thành 3 workflow → ③ task-spec A-lite (~13 phiếu, chạy song song
①② được) → ④ marketing (DOMAINS entry + port + template + judge-gate).

## V. Kết luận so sánh marketing-cockpit (vòng fable, vẫn đứng vững)

**Lấy về fgOS**: 39 skills + 30 task-spec (tài sản chính); signal →
biểu diễn lại thành event typed-payload + projection theo consumer
cursor trên `.fgos/events.jsonl` (KHÔNG store thứ hai; phần engine thật
duy nhất là frontier signal-readiness cho fan-out tới item chưa tồn tại
— *hoãn* tới use-case thật); 25 workflow → phân về template stamper
(`fgos expand`) hoặc per-item workflow tuỳ cái; 5 loại quality-gate →
skill sau `fgos gate` CLI mỏng (chờ câu hỏi #7).

**Quy tắc port tách-bốn** cho một task yaml của cockpit: schema/gates →
task-spec; process-steps → nguyên liệu seed skill; frameworks/formulas →
knowledge; studio/brand → context.

**Cockpit bỏ khi vào fgOS**: `run.yaml` per-run (source-of-truth kép —
event-sourced work item thay thế, phải giết đầu tiên); run FSM riêng
(status FSM 11 trạng thái của fgOS bao trùm, có awaiting-human vs
awaiting-approval vs retrospective mà cockpit không phân biệt); bộ 3
file routing/delegation/priority (protocol-not-engine, prose-enforced là
liability — 1 DOMAINS entry engine-enforced thay thế); phần lớn
checkpoint machinery (có free từ event log + worktree commit); adapter
đa nền tảng (scope cut ghi nhận tường minh — fgOS Claude-native trước).

## VI. Treo có chủ đích (không phải quên)

1. **#7 — Judge-gate (LLM-graded rubric) có tính là "proof" theo luật L5
   DoD không?** Rủi ro sắc nhất: nếu không chấp nhận, mọi item marketing
   rơi về `awaiting-human`, frontier nghẽn ở người, ưu tiên #2 sụp đúng
   domain vừa thêm. Quyết tường minh ở lượt marketing.
2. **#15 — Team overlay trên domain** (2 team cùng domain khác shape) —
   YAGNI, chưa xây.
3. **Signal bus** — hoãn tới fan-out use-case thật (vd brand-voice
   invalidation).
4. **Scheduler** — cron ngoài gọi `fgos add` trước; trigger primitive
   chỉ khi cron chứng minh thiếu.
5. **Human modeling đa người** — pull-door verbs đủ cho tới khi có team
   nhiều người thật.

## VII. Trạng thái máy tại thời điểm distill

- Item `tsk-2t9c` — stage `planning`, branch `fgw/tsk-2t9c`, dừng trước
  validating theo lệnh người dùng. Chưa item con, chưa dòng code.
- 13 D-ID khớp ở 3 nơi: event log (seq 18029, 18030, 18031, 18032,
  18058, 18059, 18060, 18070, 18110, 18189, 18229, 18232, 18242), bảng §4
  `DISCUSSION.md`, bảng Locked decisions `CONTEXT.md`.
- `plan.md` (chi tiết, 380+ dòng): lane high-risk (4 flags), roleGraph
  draft coding, **phân tích gate setup/config/doctor từng mảnh** (①②
  không thêm config key nào — `callstackCap` ở DOMAINS thay vì
  `.fgos/config.json` để né lớp lỗi present-but-unarmed; ③ thêm 2 doctor
  check), bảng file×thay-đổi từng mảnh, risk map 7 mục có proof point,
  ma trận test (10 + 7 + 3), spec 3 mảnh dạng `normalizeChild`.
- Hai bẫy đã ghi thành dòng riêng trong plan: `src/state/handoff.mjs`
  phải có row trong `docs/architecture-manifest.json` (không thì
  `test/architecture.test.mjs` đỏ), và file đó phải PURE (cap/depth do
  caller truyền — khuôn `hasWorkerSlotRoom({ceiling})`).

## VIII. Bước kế tiếp

`fgos-coding-validating` → single gate → materialize 3 children ở stage
`executing` → implement mảnh ① rồi ② (③ song song) → children merge về
parent → parent merge main → submit các item marketing trên harness đã
chứng minh.
