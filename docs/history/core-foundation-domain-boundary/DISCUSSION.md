---
type: discussion
title: Core-foundation vs domain-specific directory/module boundary (tsk-397)
tags: [architecture, module-boundary, domain, engine-vs-prose]
timestamp: 2026-08-17T10:16:00.000Z
status: open
---

# Core-foundation vs domain-specific directory/module boundary (tsk-397)

## 1. Trạng thái hiện tại

Round 19 tiếp (2026-08-19), D22: Sau khi làm xong việc dở dang round 18
(xem đoạn dưới), người đặt câu hỏi mới: đã gom DISPATCH thành 1 khái
niệm dùng chung (D21) rồi thì bố cục 3-tầng DISPATCH/ROUTING/DRIVING vẽ
ở §6 (xếp chồng, chạy 1→2→3) có đúng không. Trợ lý scout `dispatch.mjs`
tìm ra 2 điểm vào thật (`spawnWorker` root-spawn vs `decideDispatchMechanism`
in-session decide) — đề xuất DISPATCH là dịch vụ bị gọi lặp lại, không
phải tầng-chạy-1-lần. Người hỏi tiếp "root-spawn là gì" — trợ lý giải
thích + chỉ ra: session tương tác NGƯỜI tự mở KHÔNG đi qua root-spawn,
là 1 đường thứ 3 ngoài `dispatch.mjs`. Người hỏi tiếp: pick(1)/discover(2)/
exploring(3)/planning(4)/executing(5)/review(6) có phải mỗi cái là 1
ứng viên dispatch — trợ lý TRẢ LỜI SAI ban đầu ("stage-entry tự nó không
dispatch, chỉ dòng Collaboration mới dispatch"). **Người bác đúng**: "nếu
không phải thì thiết kế workflow/stage/task-spec/agent/skill dispatch
(bundle mix load) làm gì?" — trợ lý scout lại (`judge-ambiguity.md`/
`lock-decisions.md`/`implement-item.md` đều `position: implementer`),
nhận ra role (seat) và skill (D20's `requires-skill`) là 2 trục khác
nhau — `bundleForStage` (D14) đã sẵn cơ chế khớp CHO CẢ stage-entry, chỉ
là hôm nay no-op vì thiếu dữ liệu (`roleGraph` 1 role + chưa ai viết
`requires-skill` khác nhau). → **D22** (seq 20826): DISPATCH
eligibility-check là 1 cơ chế THỐNG NHẤT cho MỌI điểm cần role (stage-entry
VÀ dòng Collaboration), không riêng gì Collaboration. §6's subsection
DISPATCH được viết lại HOÀN TOÀN (diagram mới: session-origin 2 đường
song song → ROUTING → DRIVING với 1 điểm ELIG dùng chung cho cả
stage-entry lẫn Collaboration-row) — hợp nhất luôn subsection "Eligibility
declaration" cũ (D20) vào chung 1 chỗ thay vì tách riêng. 22/22 quyết
định đã chốt. Người xác nhận: "đồng ý, mãi mới thấy rõ chổ này."

Round 19 (2026-08-19): Làm nốt việc dở dang round 18 để lại. (1) D20 đã
đưa vào §6: thêm subsection mới "Eligibility declaration — đảo hướng
(D20/D21)" sau khối diagram DISPATCH, mô tả cụ thể trước/sau bằng bằng
chứng scout thật — `agents/*.yaml`'s `claims` field (`scripts/
project-agents.mjs:120-125,137-147`, validate + project vào frontmatter
`.claude/agents/*.md`) và doctor check `agent-claims-resolve`
(`src/setup/registrations.mjs:419-503`, đọc `docs/task-specs/<domain>/
*.md`) là code THẬT cần đảo hướng, không phải suy diễn. Thêm task
{#task-eligibility-inversion} vào §7 (D20/D21) liệt kê đúng 4 điểm chạm
thật: schema `agents/*.yaml` (`claims`→`skills`), `project-agents.mjs`
(validate+project), doctor check (đổi hướng resolve), và schema
task-spec (`assignable-to`/`requires-skill`, header 1-dòng hiện có ở
`docs/task-specs/coding/*.md` cần thêm field). (2) Rà lại TOÀN BỘ §6
prose (không chỉ vá điểm nhắc `claims`/tên tầng như round 18 làm dở) —
tìm đúng 1 chỗ còn stale thật: đoạn so sánh marketing-cockpit (dòng ~679
cũ) vẫn khen `claims` (PULL, tsk-2t9c D12) "đã đi xa hơn" marketing-
cockpit — mâu thuẫn trực tiếp với D20 vừa đảo ngược chính `claims` đó.
Đã viết lại đoạn này: nhận ra marketing-cockpit's field `skills:` trên
agent-type, dù KHÔNG được dispatch runtime nào truy vấn (PUSH,
hardcode), lại đúng SHAPE hơn `claims` — D20 hội tụ về đúng tên field đó
(`skills:`) nhưng nối nó vào dispatch runtime thật (D21), tạo mô hình
khác cả 2 tiền lệ: đúng shape của marketing-cockpit + đúng cơ chế
runtime-wired của tsk-2t9c. Còn lại: không tìm thêm chỗ nào khác trong
§6 cần sửa. (3) Phân tích 2 việc mở cũ, ĐỀ XUẤT (chưa khoá D-ID — mới 1
round, chưa qua vòng thứ 2 theo kỷ luật D4):
`agents/*.yaml`→`.claude/agents/*.md` render-pair NÊN giữ nguyên
top-level (`agents/`, không tách vào `domains/<name>/agents/`) — vì D20
tự nó làm agent-type identity domain-agnostic-by-thiết-kế (1 agent-type
đủ điều kiện qua `skills` chung xuyên domain, đúng ví dụ marketing-lead/
tech-lead-đều-làm-PM), khác hẳn skill/task-spec/knowledge vốn thật sự
thuộc về 1 domain; `doctrine` domain-scoped nên đánh dấu "cố ý CHƯA XÂY"
(cùng lớp với D15's phần treo có chủ đích) — chưa có nội dung doctrine
domain-thật nào (marketing vẫn `proposed`, chưa code) để thiết kế theo,
ép thiết kế bây giờ là suy diễn. Cả 2 đề xuất trình bày ở §6, CHỜ người
xác nhận trước khi mint D-ID. 21/21 quyết định đã chốt (không đổi round
này — thuần regenerate §6/§7, không quyết định mới).

Round 18 (2026-08-19, PHIÊN NÀY HẾT TOKEN — session sau đọc mục này để
resume): D20 (đảo hướng eligibility: agent-type chỉ khai soul+skill,
task-spec khai `assignable-to`/`requires-skill`, đảo ngược 1 phần D12
tsk-2t9c đã shipped) và D21 (rút "CASTING", 3 tầng dispatch map thẳng
vào `dispatch.mjs`/`fgos-routing`/`fgos-coding-driving` đã có tên) đã
chốt — ghi qua `fgos decision --id tsk-397` (seq 20796, 20797). 21/21
quyết định đã chốt. **Việc dở dang, session sau cần làm tiếp:**
(1) D20 chưa được phản ánh vào §6's design synthesis / §7's task list —
chỉ mới ghi ở §3/§4, chưa có task cụ thể cho việc sửa `agents/*.yaml`
schema (`claims`→`skills`) + task-spec schema (thêm `assignable-to`/
`requires-skill`); (2) 2 việc còn mở CŨ vẫn treo nguyên: `agents/*.yaml`→
`.claude/agents/*.md` render-pair đặt vào D7 hay tách riêng, và
`doctrine` domain-scoped (mở từ đầu chưa ai đề xuất); (3) §6 diagram còn
1 vài chỗ tên cũ ("DISPATCH" node label) đã sửa nhưng CHƯA rà lại toàn
bộ §6 prose để khớp 100% với D20/D21 (chỉ vá đúng những chỗ trực tiếp
nhắc `claims`/tên tầng, chưa đọc lại toàn bộ).

Round 17 (2026-08-19): Người chỉ ra thêm 1 việc còn mở: "workflow" chưa
có file định nghĩa riêng — chỉ là key lồng trong `registry.mjs`. → D18:
`domains/<name>/workflows/<name>.mjs`, mirror pattern aggregator D4 một
tầng sâu hơn. Người yêu cầu tham khảo kỹ marketing-cockpit's 33 workflow
file thật (không bắt chước mù quáng) — trợ lý scout, tìm ra 7/33 file
thật ra là khái niệm `template` (multi-item batch) chứ không phải
`workflow` (single-item), xác nhận đúng ranh giới D7 tsk-2t9c đã định
nghĩa từ trước. Trợ lý làm bảng so sánh field-by-field nhưng bác vội quá
nhiều — người sửa lại 3 chỗ (`rigor`/`cognitive_tier` đáng học ở cấp
task-spec; `approval_gates` đáng học như lớp cấu hình khai báo;
`stages` shape nên tách ergonomics-viết khỏi shape-runtime, không phải
copy nguyên) → D19. Thêm 1 mục "Ý tưởng học — chưa xây" vào §6 (giữ
escalation-threshold + signal-bus như tsk-2t9c's §VI, không mất khi
quên). 19/19 quyết định đã chốt.

Round 16 (2026-08-19): Người đặt câu hỏi làm rõ GATE của task-1 (ẩn dụ
"2 tấm biển, 1 cái hộp"), rồi tự đề xuất: đang dời hộp (`codingDomain`
sang `domains/coding/registry.mjs`) thì dọn biển luôn cùng lượt, để cái
GATE đó không còn cần thiết nữa (không còn 2 đường đọc thì không có gì
để so sánh phân kỳ). Trợ lý scout chính xác — chỉ 2 điểm đọc property
phẳng còn thật (`stage-fsm.mjs:94`, `plan.mjs:519`+`loop.mjs:1297` trùng
dòng) — nhỏ hơn hẳn giả định "4 file" trước đó. → D17 (seq 20772): gộp
task-3 vào task-1, GATE cũ thành moot, không cần verify riêng nữa. 17/17
quyết định đã chốt.

Round 15 (2026-08-19): Thuật ngữ "position" (dùng lẫn với "role" suốt
round 14) đã sweep sạch về "role" — khớp tên field thật trong code
(`roleGraph.roles`, `defaultRole`). Từ đó nảy ra thảo luận role vs
persona: role = seat cố định (data, check legality); persona = ai thật
sự ngồi vào seat đó (resolve riêng, D15). Kết luận: `human-advisor` đổi
tên thành `advisor` (D16, seq 20766) — gắn "human" vào TÊN role là dư
thừa, vì `awaiting-human` (status-fsm, có TRƯỚC roleGraph) + `ask`/
`answer` đã bắt trọn phần human-specific riêng rồi; role tự nó chưa bao
giờ nhất thiết "dành cho con người" — đó là do cơ chế `advise` gọi tới.
KHÔNG thêm eligibility-resolution mới — chỉ đổi tên, hành vi giữ nguyên
100%. 16/16 quyết định đã chốt.

Round 14 (2026-08-19): Sau D9-D12 (folder-layout đã ổn định), thảo luận
mở rộng sang tầng DISPATCH/COORDINATION — trả lời "khi không gian đã tách,
cơ chế nào điều phối việc thật giữa workflow/stage/taskSpec/skill/
role/agent-type". Kết quả (D13-D15, ghi qua `fgos decision --id
tsk-397`, seq 20756-20758):

- **D13 — kiến trúc 3 tầng dispatch/routing/driving**, nguyên lý tổ chức:
  soul/persona của một session KHÔNG hoán đổi được giữa chừng (khác
  skill/task-spec — chỉ là văn xuôi đọc lại tự do). DISPATCH (chọn AI,
  một lần, trước khi session tồn tại) → ROUTING (`fgos-routing`, chọn
  MÁY MÓC nào áp dụng, xuyên domain, chạy một lần trong session đã có
  persona cố định) → DRIVING (`fgos-<domain>-driving`, lặp qua nhiều
  stage, CÙNG một persona, load lại skill+taskSpec tự do mỗi stage).
  Bằng chứng thật: `fgos-coding-driving`'s ceiling mặc định là
  `status=='awaiting-approval'` — ĐÚNG chỗ tsk-2t9c D18 gắn async review
  handoff — driving đã dừng đúng lúc persona cần đổi, dù chưa ai đặt tên
  nguyên lý này trước đây.
- **D14 — `bundleForStage(domain, stage)` trả `{skill, taskSpec}` cùng
  lúc**, sống ở tầng DRIVING — đóng gap "skill hardcode path task-spec
  trong prose" (dòng 88/177/291 của `fgos-coding-implement`).
- **D15 — persona/agent-type resolve theo `(domain, stage, role)`**,
  không chỉ `(domain, role)` — team-hợp-tác trong 1 stage = chuỗi sync
  call (consult/assist, holder không đổi) từ 1 holder chính tới nhiều
  persona chuyên biệt, KHÔNG BAO GIỜ multi-holder cùng lúc; song song thật
  = decompose ra item con (`fgos-fanout`, đã có), không phải concurrency
  trên cùng 1 worktree. CỐ Ý CHƯA XÂY: liệu ranh giới stage (persona mặc
  định đổi dù cùng role, không có handoff tường minh) có nên cũng làm
  driving dừng — chưa có bằng chứng persona đa dạng thật để thiết kế theo.

So sánh `upstreams/marketing-cockpit`'s cách gán role→agent
(`workflow.md`'s `agents:`/`stages:` hardcode tên agent, PUSH, tác giả
quyết lúc viết) đã xác nhận: field `skills:` trên agent-type của họ chỉ
là catalog khai báo (đọc bởi người/LLM lúc thiết kế), KHÔNG được dispatch
mechanism nào truy vấn runtime — `claims` của tsk-2t9c (PULL, agent tự
khai eligibility) thực ra đã đi XA HƠN marketing-cockpit, không phải thứ
cần bắt kịp.

15/15 quyết định đã chốt. Còn mở thật: `agents/*.yaml`→`.claude/agents/*.md`
render-pair đặt vào D7 hay tách riêng (đề xuất chưa lock: mirror D7,
domain riêng có `domains/<name>/agents/`), và `doctrine` domain-scoped
(mở từ đầu, chưa ai đề xuất giải pháp cụ thể).

Round 12 (2026-08-18): Xác nhận `tsk-2t9c` ĐÃ MERGE VÀO MAIN (`e268376e`)
— không phải nhánh treo. `codingDomain` thật có 10+ field (§7 task-1 đã
cập nhật đủ danh sách). Trợ lý đề xuất drop task-3 (dispatcher wiring),
bị người bác: bugfix-workflow sắp landing thật, đây chính là lý do làm
domains/ split BÂY GIỜ để tránh migrate 2 lần → D10, task-3 giữ lại, đổi
khung ("làm sẵn seam" thay vì "sửa bug"). Thêm GATE bắt buộc vào task-1:
xác nhận dynamic import giữ đúng identity `workflows.feature.stages ===
codingDomain.stages` trước khi plan thật — nếu không giữ được, cơ chế
aggregator (D4) phải đổi shape. Còn treo: `roleGraph`/`taskSpecMap`/
`agents/*.yaml`→`.claude/agents/*.md` render-pair chưa có quyết định
placement cụ thể trong `domains/coding/` — cần tiếp tục hoà giải.

Round 11 (2026-08-17): **PHÁT HIỆN QUAN TRỌNG — thảo luận này đã bỏ sót
một thiết kế đã chốt VÀ đã triển khai thật trước đó: `tsk-2t9c`
(`docs/history/fgos-marketing-domain-foundation/`, 13 quyết định, wiring
code thật trong `fgos-coding-implement`/`discovering`/`exploring`/
`planning`/`validating`, có chạy end-to-end thật trên `tsk-ogx`).**
tsk-2t9c D10 đã khoá "four-layer ontology": task-spec (contract) / skill
(know-how) / knowledge (domain expertise) / context (fact tức thời) —
KHÁC và chính xác hơn ma trận 6-concern của thảo luận này. "task-spec"
đúng nghĩa (D6/D10) là hợp đồng theo TỪNG LOẠI việc (input/output/gates/
verify-template), một file/domain/loại-việc — hoàn toàn KHÁC "task" mà
trợ lý đã dùng xuyên suốt thảo luận này (field-schema work-item,
`EDITABLE_FIELDS`/`domainFields`). D8 (cả bản sai lẫn bản sửa lần 1) đều
dựa trên định nghĩa sai này. D9 ghi sửa lại — `docs/task-specs/coding/`
(13 file thật, machine-checked bởi `registrations.mjs`'s
`task-specs-resolve`) chuyển vào `domains/coding/task-specs/`, giữ đúng
tên gọi đã có. tsk-2t9c CÒN có `roleGraph` (trục role/holder) và
`taskSpecMap` trong registry entry của domain — 2 field registry.mjs của
thảo luận này (D3/D4) chưa từng tính tới. **Câu hỏi treo cho người:**
thảo luận này có nên coi tsk-2t9c là authoritative và chỉ tự giới hạn vào
câu hỏi folder-layout ĐẶT LÊN TRÊN thiết kế đó, hay cần hoà giải đầy đủ
2 thiết kế ngay trong phiên này?

Round 10 (2026-08-17): D8 SỬA LẠI ngay sau khi chốt sai — bản đầu (seq
19349) hiểu nhầm "task-specs" thành toàn bộ `docs/specs/`, di dời cả 12
file platform/core. Người sửa ngay: chỉ tạo mới `domains/<name>/specs/`
(rỗng, chờ domain tự viết task-spec riêng); `docs/specs/` giữ nguyên
100%, không đụng gì. Bản sửa ghi qua `fgos decision --id tsk-397` (seq
19351). Layout: 5/6 concern đối xứng đầy đủ (workflow/task-schema qua
registry.mjs, skill qua skills/, knowledge qua knowledge/, task-specs qua
specs/-khi-cần) — `harness` chủ đích chỉ core (D1/D5), `doctrine` vẫn mở.
D7 (skill canonical → `core/skills/`+`domains/*/skills/`) vẫn đứng, chốt
round 9 (seq 19342) — không đổi. D7 đòi cơ chế mới (assembly step trong
`skill-wrappers.mjs`) trước khi implement thật, việc cho
`fgos-coding-planning` xử lý, không phải discussion này.

Round 7 (2026-08-17): D6 sửa lại và chốt — ghi qua `fgos decision --id
tsk-397` (seq 19297), thay bản D6 đầu (SAI, lẫn context với knowledge).
`docs/history/` là context (thô, feature-scoped, share, không tag
domain) — giữ nguyên. Domain-knowledge (curated, do team bảo trì) là
khái niệm riêng, sống tại `domains/<name>/knowledge/`, co-located theo
tinh thần D3 — tiền lệ thật `/home/vantt/projects/beegog/expertise/`.
5/6 mối quan tâm giờ có hình dạng chốt (harness/workflow/task/skill/
knowledge); chỉ còn `doctrine` domain-scoped là mở thật (không giải được
bằng tag như knowledge, vì doctrine luôn-nạp chứ không tra-theo-yêu-cầu).
Layout (ASCII + mermaid, §6) đã đồng bộ theo D6 mới.

Round 6 (2026-08-17): tầng CODE+SKILL của boundary đã chốt — D3/D4/D5,
ghi qua `fgos decision --id tsk-397` (seq 19128-19130). Hình dạng cuối:
`domains/<name>/` là folder tự chứa (registry.mjs + skills/ đi cùng nhau)
ở top-level, mirror đúng cơ chế plugin thật đã có trong chính repo này
(`plugins/fgOS/` — tự chứa manifest + skills, thêm `dogfood-fixture`
không đụng gì bên trong `fgOS/`). `workflow-stage-graphs.mjs` chỉ còn là
aggregator quét `domains/*/registry.mjs` tự động — thêm domain không sửa
file có sẵn nào. `core` (bin/, src/, herdr-plugin/) KHÔNG di dời vật lý —
881 tham chiếu `bin/fgos.mjs` trong repo + fgOS đã cài global ở nhiều
project khác (mission 0035) khiến việc di dời phá vỡ diện rộng cho lợi
ích thuần biểu tượng; `.agents/skills/core/` là chỗ duy nhất rẻ đủ để gắn
nhãn core tường minh. Người mở rộng khung phân tích thành ma trận 6 mối
quan tâm (harness/workflow/task/knowledge/skill/doctrine) × {core,
domain} — 4/6 đã có hình dạng rõ (harness chỉ ở core theo D1; workflow/
task/skill đã chốt qua D2-D4); **knowledge và doctrine domain-scoped vẫn
là câu hỏi MỞ, chưa thiết kế** — không có tiền lệ trong code hiện tại,
cần quyết định có scope cho item này hay để lại khi marketing thật bắt
tay xây. Người vừa yêu cầu vẽ layout — xem diagram đầy đủ ở §6.

Round 5 (2026-08-17): D1 (share store) và D2 (top-level = port đóng,
`domainFields` = adapter mở) đã chốt và ghi qua `fgos decision --id
tsk-397` (seq 19058/19059). §6 đã regenerate cho tầng STATE (data layer)
— đây mới là MỘT lớp của hexagon (data/store), chưa phải toàn bộ
folder-layout. Còn mở: trục (b) engine-vs-prose (tiêu chí tách + duplicate
3 cây skill), và phần domain-specific của CODE (không chỉ data) — 4 điểm
nối STR89 đã định vị (registry/discovery.mjs+decompose.mjs/fgos-routing/
skill-bundle) chưa có quyết định thư mục cụ thể nào.

Round 4 (2026-08-17): người xác nhận mục tiêu thật của item — tổ chức
folder-layout để ranh giới rõ, dễ theo hexagonal/ports-adapters, dễ giữ
contract, dễ thêm/mở rộng, VÌ sẽ có thêm domain thật (không phải suy đoán
— STR52 backlog xác nhận domain "marketing" đã proposed). Scout tìm thấy
STR89 (done) đã định vị sẵn 4 điểm nối domain-specific cần mở
(registry/`discovery.mjs`+`decompose.mjs`/`fgos-routing`/skill-bundle
riêng) — đây chính là "ports" hexagon cần thiết kế quanh, không phải suy
diễn từ đầu. Người cũng sửa cách làm việc của trợ lý: khi có đủ chất liệu
để phân tích, phải tự phân tích và đề xuất — không hỏi ngược lại người mà
chưa đưa ra khuyến nghị. Áp dụng ngay: đã phân tích 3 tiêu chí người cho
(field-compatible, security/phân vùng, performance) cho câu hỏi mở của
STR52 (share store hay cài riêng) — cả 3 đều KHÔNG chặn share-store
(field-compat đã có hạ tầng `domainFields` sẵn, security không có gì phải
build vì chỉ cần filter theo `work.domain` có sẵn, performance đã chịu
tải thật 19K events/8.4MB với incremental-replay fast path) → khuyến nghị
**share store**, chờ người xác nhận khoá. Trục (b) engine-vs-prose vẫn có
tiền lệ thật từ `/home/vantt/projects/beegog/` (đã xác nhận round 2-3),
trục (a) giờ không còn "chỉ 1 domain thật" — có domain #2 (marketing)
thật đang chờ shape.

## 2. Mục tiêu & đề bài

Mục tiêu thật (chốt round 4, lời người): tổ chức lại folder-layout của
fgOS sao cho ranh giới RÕ, phù hợp tư duy hexagonal/ports-and-adapters
(port = hợp đồng cố định mọi domain phải tuân, adapter = phần domain tự
cắm vào), giữ được contract ổn định, và dễ THÊM domain mới/mở rộng —
không phải bài tập lý thuyết, vì fgOS có domain thật thứ hai đang chờ
(STR52: "marketing", proposed, đã có scope draft). Việc tách hai trục
(core-foundation vs domain-specific; engine vs skill/prose) là công cụ để
đạt mục tiêu đó, không phải mục tiêu tự thân. Tham khảo mô hình bee
upstream — nguồn thật đã xác nhận là `/home/vantt/projects/beegog/` (live
checkout v2.7.0: packages/bee-rs = rust core 1 crate/1 binary,
packages/bee = vendor payload, skills/ = 9-skill prose) — làm tiền lệ cho
trục engine-vs-prose; bản thân beegog không có multi-domain nên KHÔNG cho
tiền lệ trục core-foundation-vs-domain-specific — trục này phải tự thiết
kế dựa trên chất liệu thật của fgOS: STR52 (scope marketing) + STR89 (4
điểm nối domain-pluggable đã xác định: `DOMAINS` registry,
`discovery.mjs`/`decompose.mjs` retrofit, `fgos-routing` domain-aware,
skill-bundle riêng theo domain) + hạ tầng `work.domainFields` (đã xây sẵn
làm "infrastructure for a FUTURE domain", decision 0027 D6). Đây là item
thảo luận kiến trúc thuần tuý — không quyết định implement gì trong
chính item này — cần shaping/discovery trước khi khoá quyết định, rồi
handoff sang `fgos-coding-exploring`/`fgos-coding-planning` cho việc thực
thi thật.

## 3. Vấn đề rõ / chưa rõ

| # | Điểm | Trạng thái | Ghi chú |
|---|------|-----------|---------|
| 1 | Domain nào trong `DOMAINS` là domain sản xuất thật, có skill/harness riêng, cần một ranh giới domain-specific để phục vụ? | Rõ (scout) | Chỉ `coding` có skillMap thật + worktree-backed. `synthetic`, `triage`, `fixture-marketing` đều tự nhận là illustrative/disposable fixture trong chính comment của code — không skill nào từng load, không worktree/merge thật. |
| 2 | Mô hình bee upstream (packages/bee-rs/packages/bee/skills, decision 0025-rust-migration-strategy) có phải một hợp đồng sống với forgentX hiện tại không? | Rõ (scout) | Không. `docs/history/bee-to-fgos-rename/CONTEXT.md` D1 (chốt 2026-08-13, người trả lời trực tiếp): forgentX đã cô lập hoàn toàn khỏi bee, không còn interop sống, "anything learned from bee has already been internalized rather than depended on". Decision 0025 của forgentX là một quyết định khác hẳn (product-priority-order), không phải rust-migration-strategy. |
| 3 | Cây thư mục hiện tại đã có tách engine (code chạy được) khỏi skill/prose chưa? | Rõ một phần (scout) | Có JS engine (`bin/`, `src/`) + Rust engine riêng (`herdr-plugin/`, crate độc lập, song song `src/` chứ không lồng trong nó) tách khỏi ba cây skill: `.claude/skills/` (16, generated wrapper), `.agents/skills/` (16, nguồn canonical thật — CLAUDE.md tự ghi rõ), `plugins/fgOS/skills/` (~52, cây route theo plugin manifest, chứa cả wrapper theo-verb lẫn các skill `fgos-coding-*` cốt lõi). Prose đã tách khỏi code, nhưng đang nhân bản qua 3 cây thay vì 1 nguồn + render. |
| 4 | `upstreams/` (path item liệt kê để khảo sát) có tồn tại trong repo không? | Rõ (scout, sửa lại round 1) | Có, trong main checkout (`upstreams/bee/`, `upstreams/beegog/`, gitignored) — round 1 chỉ kiểm trong worktree cô lập nên báo sai "không tồn tại". Cả hai đều là bản CŨ hơn `/home/vantt/projects/beegog/` (live). |
| 5 | Doctrine layer (AGENTS.md/CLAUDE.md) đã có tiền lệ "luôn nạp vs nạp theo nhu cầu" nào gần với trục engine/skill chưa? | Rõ một phần (scout) | `docs/platform-foundations.md` L8 đã khoá placement test này CHO RIÊNG tầng doctrine (standing sheet vs reference nạp theo nhu cầu) — cùng tinh thần trục (b) nhưng chưa từng generalize ra toàn cây thư mục. |
| 6 | Ranh giới cụ thể core-foundation vs domain-specific nên nằm ở đâu? | Chưa rõ (nhưng không còn speculative) | STR52 (marketing, proposed) + STR89 (done, đã định vị 4 điểm nối domain-pluggable) là chất liệu thật để thiết kế ranh giới, xem #10/#11 dưới. Vẫn cần thiết kế cụ thể layout. |
| 7 | Engine vs skill/prose tách theo tiêu chí nào (ngôn ngữ? runtime-executable vs instruction-only? mức nạp?) | Chốt — D7 | `core/skills/` + `domains/*/skills/` là canonical AUTHORING; `.agents/skills/`, `.claude/skills/`, `plugins/fgOS/skills/` cả ba đều là render target (D7, mở rộng tsk-1qi D5). |
| 8 | Mô hình plugin/extension theo domain có đáng chi phí duy trì thêm một tầng tổ chức? | Chốt — D3/D12 | Đáng. Chi phí thấp hơn dự đoán ban đầu — không cần package/workspace riêng (folder đủ, D3), và cơ chế enforce ranh giới đã có sẵn trong repo (`architecture-manifest.json`, chỉ cần mở rộng thêm 1 rule, D12) chứ không phải xây từ đầu. |
| 9 | Nguồn so sánh bee/beegog thật nằm ở đâu, và nó có tiền lệ cho trục nào? | Rõ (scout + xác nhận người, round 2) | `/home/vantt/projects/beegog/` (live checkout, KHÁC repo-con `upstreams/beegog/` đã pull nhưng vẫn cũ) có đúng cấu trúc v2.7.0: `packages/bee-rs` (1 crate, 1 binary), `packages/bee` (vendor payload), `skills/` (9 skill, giảm từ 18/15). Không tìm thấy khái niệm multi-domain nào trong beegog (`grep -i "multi-domain\|DOMAINS\b"` không ra kết quả liên quan) — beegog là tiền lệ thật cho trục (b), KHÔNG phải tiền lệ cho trục (a). |
| 10 | Domain thật thứ hai có tồn tại/đang chờ không? | Rõ (scout, round 4) | Có — `docs/backlog.md` STR52: "Domain thứ hai THẬT: marketing", status `proposed`, nêu 2026-07-18. Người dùng có sẵn workflow marketing ở project khác, muốn điều phối qua fgOS. Câu hỏi scope gốc của STR52 (share store hay cài fgOS riêng) — xem #12. |
| 11 | Domain-specific cần mở những điểm nối nào trong code hiện tại? | Rõ (scout, round 4) | STR89 (done) định vị 4 điểm: (1) `DOMAINS` registry entry riêng cho domain mới (`src/state/workflow-stage-graphs.mjs`); (2) `discovery.mjs`/`decompose.mjs` retrofit — hiện hardcode literal stage-name của coding, cảnh báo sẵn trong comment `workflow-stage-graphs.mjs:29-34`; (3) `fgos-routing` domain-pluggable hoá — tự thú nhận hôm nay "the only domain this induction targets [is coding]"; (4) bộ skill nội dung riêng theo domain-extension, song song bộ coding. Thứ tự đã xác nhận: software-dev (coding) trước, marketing sau, không chặn nhau. |
| 12 | STR52's câu hỏi scope (share store hay cài fgOS riêng cho domain mới) — trả lời thế nào? | Chốt — D1 | (nội dung phân tích giữ nguyên, xem D1 ở §4) |
| 13 | Domain-specific code+skill nên tổ chức theo layout nào (nested trong cây có sẵn, hay folder riêng)? | Chốt — D3/D4 | `domains/<name>/` tự chứa, top-level, mirror `plugins/fgOS/`. Đề xuất nested đầu tiên (`.agents/skills/domains/coding` + `src/domains/coding` tách rời) bị người bác — "không phát triển được dạng plugin/extension". |
| 14 | Core (bin/, src/, herdr-plugin/) có nên di dời vào folder `core/` tường minh để đối xứng với `domains/` không? | Chốt — D5 (cập nhật bởi D7) | `bin/`, `src/`, `herdr-plugin/` KHÔNG di dời — 881 tham chiếu `bin/fgos.mjs` + external install (mission 0035) khiến chi phí lớn hơn hẳn lợi ích biểu tượng. Riêng SKILL thì có: canonical authoring chuyển hẳn sang `core/skills/` (D7) — rẻ hơn hẳn di dời `bin/`/`src/` vì không đụng path nào external project gọi trực tiếp, chỉ đổi chỗ maintainer sửa nguồn. |
| 15 | Áp ma trận 6 mối quan tâm (harness/workflow/task/knowledge/skill/doctrine) × {core, domain} — còn chỗ nào thiếu? | Rõ phần lớn | harness: chỉ core (D1). workflow/task/skill: đã chốt (D2-D4). knowledge: đã chốt (D6). **doctrine: vẫn mở** — không có cơ chế nạp-có-điều-kiện theo domain trong AGENTS.md/CLAUDE.md hôm nay. Round 19 đề xuất (chưa khoá D-ID): đánh dấu "cố ý CHƯA XÂY" cùng lớp D15 — chưa có nội dung doctrine domain-thật để thiết kế theo (marketing vẫn `proposed`). |
| 16 | `docs/history/<feature>/` có phải "knowledge" không? | Chốt — sửa lại (round 7) | KHÔNG — người chỉ ra `docs/history/` là **context** (biên bản thô, append-only, theo feature), không phải knowledge. "Knowledge" đúng nghĩa = domain-knowledge, curated, do team tự bảo trì — khác hẳn context. D6 (bản đầu, gắn tag `domain` lên `docs/history/`) SAI vì lẫn 2 khái niệm — đã thay bằng D6 mới. |
| 17 | Domain-knowledge (curated, private, do team tự bảo trì) nên sống ở đâu? | Chốt — D6 | `domains/<name>/knowledge/`, co-located cùng `skills/`, theo đúng tinh thần tự-chứa của D3. Tiền lệ thật: `/home/vantt/projects/beegog/expertise/` — hệ curated knowledge base thật (`knowledge.md` tự mô tả "craft vs project layers, harvesting from finished work, recorded trust, dated freshness, migration rot, retirement") — khác hẳn `docs/history/` (context thô). |
| 18 | `.agents/skills/core` có nên đổi thành `core/skills/` (bỏ dấu chấm, đối xứng `domains/`)? `.agents` và `.claude` có phải thin wrapper cả hai không? | Chốt — D7 | Có, nhưng không phải rename đơn thuần. `.agents/skills/*` là canonical THEO một quyết định TRƯỚC đó (tsk-1qi D5, `skill-wrappers.mjs` tự ghi rõ "the canonical, orchestrator-neutral skill source") — và `fgos setup` vendor NGUYÊN VĂN `.agents/skills/*` vào MỌI external project (`materializeSkillsIntoProject`), nên hình dạng bên ngoài (host project nhận được gì) không được đổi. D7: canonical AUTHORING chuyển sang `core/skills/` + `domains/*/skills/`; `.agents/skills/`, `.claude/skills/`, `plugins/fgOS/skills/` CẢ BA thành render target thật (thêm bước assembly trong `skill-wrappers.mjs`) — mở rộng quyết định tsk-1qi D5 (bối cảnh mới: `domains/` chưa tồn tại lúc đó), không đảo ngược nó. |
| 19 | Task-specs nên tách vào đâu? | SỬA LẠI LẦN 2 — D9 (round 11) | Cả bản D8 đầu (di dời toàn bộ `docs/specs/`) lẫn bản sửa lần 1 (định nghĩa task-specs = field-schema work-item) đều SAI. Người chỉ ra `docs/task-specs/coding/*.md` — 13 file THẬT ĐÃ TỒN TẠI, thuộc thiết kế đã chốt `tsk-2t9c` (D6/D10: task-spec = hợp đồng theo LOẠI việc, input/output/gates/verify-template — khác hẳn field-schema). Xem D9. |
| 20 | tsk-2t9c (`fgos-marketing-domain-foundation`) phủ những gì, và quan hệ với thảo luận này ra sao? | Rõ (scout round 11-12) | tsk-2t9c ĐÃ MERGE VÀO MAIN (`e268376e`) — không còn nằm trên nhánh riêng. `codingDomain` object thật hôm nay có 10+ field (stages/stepMap/transitions/skillMap/taskSpecMap/worktreeBacked/statusLabels/parkReason/classification/roleGraph + workflows/defaultWorkflow/workflowFor), không phải 4-5 field thảo luận này giả định. Người xác nhận: `bugfix` workflow (un-merge theo D7/D7a của tsk-2t9c, đang hoãn) sắp thật, không còn giả thuyết — đây chính là LÝ DO làm domains/ split BÂY GIỜ, trước khi code bugfix-workflow viết ra, để không phải migrate 2 lần. |
| 21 | Task-3 (dispatcher domain/workflow-aware) có nên drop khỏi scope thảo luận này không (trợ lý từng đề xuất drop)? | SỬA LẠI — D10 (round 12) | Trợ lý đề xuất drop vì tsk-2t9c đã chủ đích KHÔNG wiring dispatcher (lý do: chỉ 1 workflow đăng ký, wiring đổi 0 hành vi). Người bác: bugfix-workflow sắp landing thật — tiền đề "chỉ 1 workflow" sắp hết đúng. Task-3 GIỮ LẠI, đổi khung: không phải "sửa bug" mà "làm sẵn seam trước khi workflow thứ 2 tồn tại". |
| 22 | Sau khi không gian đã tách (D3-D10), cơ chế cross-boundary để đọc file/giao tiếp giữa core và domain là gì? | Chốt — D11 | `workflow-stage-graphs.mjs` ĐÃ có 13 hàm resolver (`getDomain`, `skillForStage`, `resolveWorkflow`, `roleGraphFor`, ...) — đây chính là "port" ở tầng DATA, không cần xây mới. Chỗ hổng duy nhất: `registrations.mjs` (dòng 407/424) tự ghép path thô `path.join('docs','task-specs',domainName,...)`, không qua resolver nào — sau khi D9 di dời task-specs, chỗ này vỡ trước tiên. D11 thêm `resolveTaskSpecPath(domain, specId)` để đóng nốt pattern đã có. |
| 23 | Layout nội bộ + cách kết nối module của `upstreams/pi` ("everything is a plugin") có bài học gì cho fgOS? | Chốt — D12 | Pi enforce ranh giới module bằng `package.json`'s `exports` map (path không khai = không import được, Node tự chặn) — cấp package thật, mỗi package trong workspace tự khai bề mặt công khai. fgOS là 1 package, không workspace — chuyển sang mô hình pi tốn hơn hẳn. NHƯNG fgOS đã có tương đương: `docs/architecture-manifest.json` + `test/architecture.test.mjs` (5 layer kỹ thuật: entry/use-case/infra/domain/kernel, import chỉ được xuống tầng sâu hơn, ngược tầng = test đỏ). Bài học thật: mở rộng cơ chế ĐÃ CÓ này thêm 1 rule domain-siloing, không xây cơ chế mới kiểu pi. **Lưu ý naming va chạm:** layer `"domain"` trong manifest là khái niệm DDD kỹ thuật, KHÔNG liên quan `DOMAINS` (coding/marketing) của toàn thảo luận này — cùng từ, 2 nghĩa khác nhau, cùng tồn tại trong 1 repo. |
| 24 | Sau khi domain có N workflow, mỗi workflow N stage, mỗi stage N task-spec — cơ chế điều phối (dispatch) thật là gì, ai chủ động? | Chốt — D13 | 3 tầng: DISPATCH (chọn persona, 1 lần, trước khi session tồn tại) → ROUTING (`fgos-routing`, chọn máy móc domain nào, xuyên domain, 1 lần/session) → DRIVING (`fgos-<domain>-driving`, lặp qua stage, CÙNG persona). Nguyên lý tổ chức: soul không hoán đổi giữa chừng session — khác skill/task-spec (văn xuôi, đọc lại tự do). Bằng chứng: `fgos-coding-driving` ceiling mặc định = `awaiting-approval`, ĐÚNG lúc async review handoff (D18 tsk-2t9c) fire — driving đã dừng đúng chỗ persona cần đổi từ trước, chỉ chưa ai gọi tên nguyên lý. |
| 25 | Skill có cần thiết phải hardcode load task-spec không, hay nên tách? | Chốt — D14 | Không nên hardcode trong prose (3 chỗ ở `fgos-coding-implement` dòng 88/177/291 đã hardcode literal path). `bundleForStage(domain, stage)` trả `{skill, taskSpec}` cùng lúc, sống ở tầng DRIVING (D13) — `skillMap`/`taskSpecMap` đã nằm cạnh nhau cùng object, cùng key stage, hàm này chỉ bọc lại dữ liệu có sẵn. |
| 26 | Agent-type/persona/team-collab đặt vào đâu trong cơ chế dispatch, và "2 flow nối tiếp" (PO+BA rồi Tech-Lead+SWE+Tester) có cần 2 workflow riêng? | Chốt — D15 | Không cần 2 workflow. Persona resolve theo `(domain, stage, role)` thay vì chỉ `(domain, role)` — cùng roleGraph, cùng role (`implementer`), khác persona theo cụm stage. Team-hợp-tác = chuỗi sync call (holder không đổi, D8) tới nhiều persona, KHÔNG multi-holder cùng lúc; song song thật = decompose ra item con (`fgos-fanout`, có sẵn). **[Round 19: câu so sánh marketing-cockpit gốc ở đây đã LỖI THỜI so với D20 — xem §6 subsection "Eligibility declaration" cho bản đã sửa; tóm tắt: `claims` không phải "đi xa hơn", D20 đã đảo ngược chính hướng đó.]** CỐ Ý CHƯA XÂY: ranh giới stage-đổi-persona-ngầm có nên cũng dừng driving — chưa có bằng chứng đa dạng persona thật. |
| 27 | Workflow definition sống ở đâu — có file riêng không, hay chỉ là key lồng trong registry.mjs? | Chốt — D18 | Chưa có file riêng hôm nay (chỉ `codingDomain.workflows.feature`, reference-sharing với top-level field, D7a). `domains/<name>/workflows/<name>.mjs` là nơi ở chính thức mới — `registry.mjs` thành aggregator cho map `workflows` của chính nó, mirror D4 một tầng sâu hơn. |
| 28 | `agents/*.yaml`→`.claude/agents/*.md` render-pair (như skill's D7) nên tách vào `domains/<name>/agents/` hay giữ nguyên top-level `agents/`? | Chưa rõ (đề xuất round 19, chờ xác nhận) | Scout thật: `scripts/project-agents.mjs` chiếu `agents/*.yaml` (SOURCE_DIR top-level) → `.claude/agents/*.md` (TARGET_DIR), độc lập hoàn toàn cơ chế skill-wrapper. Đề xuất: GIỮ top-level — D20 làm agent-type identity domain-agnostic-by-thiết-kế (1 agent-type đủ điều kiện xuyên domain qua `skills` dùng chung), khác skill/task-spec/knowledge vốn thật sự thuộc sở hữu 1 domain (lý do D3's tự-chứa không áp dụng ở đây). Xem §6. |
| 29 | Diagram 3-tầng DISPATCH/ROUTING/DRIVING (D13) có bố cục đúng không — và stage-entry (discover/exploring/planning/executing) có phải ứng viên dispatch như dòng Collaboration không? | Chốt — D22 | KHÔNG đúng ở 2 điểm: (1) session-origin có 2 đường ngang hàng (root-spawn CHỈ runner-không-người, người tự mở session là đường khác NGOÀI `dispatch.mjs`), không chỉ 1; (2) stage-entry LÀ ứng viên dispatch, dùng CHUNG phép khớp `requires-skill`/`skills` (D20) với dòng Collaboration — nhìn no-op hôm nay chỉ vì thiếu dữ liệu (1 role xuyên mọi stage, chưa ai viết `requires-skill` khác nhau), không phải khác cơ chế. Xem §6 diagram mới. |

## 4. Quyết định đã chốt

| D-ID | Quyết định | Lý do |
|------|-----------|-------|
| D1 | Domain share MỘT store/event-log của fgOS — không cài fgOS riêng cho domain mới (trả lời câu hỏi scope của STR52). | Field-compat đã có sẵn hạ tầng `work.domainFields.<domain>.*` (decision 0027 D6, xây trước cho "future domain"); security không có gì phải xây — chỉ filter theo `work.domain` (scalar) khi cần; performance đã chịu tải thật (`.fgos/events.jsonl` 19,037 events/8.4MB, 1 domain, `replay.mjs` có incremental+snapshot fast path, không phải linear replay toàn bộ). |
| D2 | Field top-level là "port" đóng (core sở hữu, `EDITABLE_FIELDS` 22 key cố định, `store.mjs:275`, `edit` từ chối mọi key ngoài set); `domainFields.<domain>.*` là "adapter" mở duy nhất — domain ghi tự do không đụng core. Field domain-local mặc định vào `domainFields`; chỉ lên top-level nếu cần nghĩa giống nhau + đọc giống nhau ở MỌI domain. | `store.mjs:275/307-310`: `edit` hard-reject key ngoài `EDITABLE_FIELDS`. Thêm field top-level mới = sửa core, ảnh hưởng mọi domain; thêm field trong `domainFields` = không đụng core. |
| D3 | Domain code+skill sống trong folder tự chứa `domains/<name>/` (registry.mjs + skills/ đi cùng nhau), top-level, không nested trong `.agents/skills/`/`src/` có sẵn. | Mirror cơ chế plugin thật đã có (`plugins/fgOS/`: manifest + skills tự chứa, thêm `dogfood-fixture` không đụng `fgOS/`). Đề xuất nested đầu (`.agents/skills/domains/coding` tách rời `src/domains/coding`) bị bác vì vẫn rải một domain qua 2 cây + cần sửa aggregator bằng tay — không phải hình dạng plugin/extension thật. |
| D4 | `workflow-stage-graphs.mjs` chỉ còn là aggregator quét `domains/*/registry.mjs` tự động (directory scan), không phải import list sửa tay. | Điều kiện để D3 thật sự "pluggable" — thêm domain không được đụng file domain khác hay aggregator, giống hệt cách thêm `dogfood-fixture` không đụng `fgOS/`. |
| D5 | Core (`bin/`, `src/`, `herdr-plugin/`) giữ nguyên vị trí top-level — KHÔNG di dời vào folder `core/` để đối xứng với `domains/`. Chỉ `.agents/skills/core/` (sau khi domain skill dọn ra `domains/*/skills/`) được gắn nhãn tường minh. | Grep: 881 tham chiếu `bin/fgos.mjs` trong `.md`/`.mjs` toàn repo (mọi action step skill, docs, test); fgOS đã cài global ở nhiều project khác (mission 0035) gọi thẳng path đó — di dời phá vỡ diện rộng cho lợi ích thuần biểu tượng, vì `domains/` tồn tại đã làm "không phải domains/" tự nhiên đọc là core. |
| D6 | Domain-knowledge (curated, private, do team tự bảo trì) sống co-located tại `domains/<name>/knowledge/` — KHÔNG phải tag `domain` gắn lên `docs/history/` (bản đầu SAI, đã thay). `docs/history/<feature>/` là **context** (thô, append-only, theo feature) — giữ nguyên chỗ, không đổi. | Sửa theo người: knowledge ≠ context. Tiền lệ thật `/home/vantt/projects/beegog/expertise/` — hệ curated knowledge base có `knowledge.md` tự mô tả "harvesting from finished work, recorded trust, dated freshness, migration rot, retirement" — một hệ bảo trì chủ động, khác hẳn log thô. Theo tinh thần tự-chứa D3, domain-knowledge thuộc về folder riêng của domain đó. |
| D7 | Canonical skill-source AUTHORING chuyển sang `core/skills/` + `domains/<name>/skills/`; `.agents/skills/`, `.claude/skills/`, `plugins/fgOS/skills/` cả BA trở thành render target thật (thêm bước assembly trong `skill-wrappers.mjs`) — KHÔNG đổi thứ `fgos setup` vendor vào external project. | Mở rộng (không đảo ngược) quyết định trước đó tsk-1qi D5 (`skill-wrappers.mjs` tự ghi "`.agents/skills/*` is the canonical, orchestrator-neutral skill source") — bối cảnh mới: `domains/` (D3) chưa tồn tại lúc D5 đó chốt. `.agents/skills/*` được `fgos setup`'s `materializeSkillsIntoProject` vendor NGUYÊN VĂN vào MỌI external project — hình dạng/nội dung bên ngoài phải giữ nguyên byte-identical; chỉ chỗ maintainer sửa nguồn đổi. |
| D8 | ~~Task-specs tách khỏi `docs/specs/` chung vào `core/specs/` (toàn bộ 12 file) + `domains/<name>/specs/`~~ — **SAI 2 LẦN, xem D9.** | (giữ lại làm lịch sử — nội dung không còn đúng, D9 thay thế hoàn toàn định nghĩa "task-specs".) |
| D9 | "Task-spec" đúng nghĩa là khái niệm của `tsk-2t9c` (D6/D10): hợp đồng theo LOẠI việc (input/output/gates/verify-template), một file/domain/loại-việc — KHÔNG phải field-schema work-item. `docs/task-specs/coding/*.md` (13 file thật, machine-checked bởi `registrations.mjs`'s `task-specs-resolve`) chuyển vào `domains/coding/task-specs/`, giữ nguyên tên "task-specs" (không đổi thành "specs"). | Người chỉ ra folder `docs/task-specs/coding/` đã tồn tại thật — thảo luận này bỏ sót toàn bộ `tsk-2t9c` (13 quyết định đã chốt + code đã wiring thật) trong suốt các round trước. D8 (cả 2 bản) sai vì dựa trên định nghĩa "task-specs" tự chế, chưa từng đọc tsk-2t9c. Còn treo: `roleGraph`/`taskSpecMap` trong registry.mjs (D3/D4 của thảo luận này) chưa tính tới — chờ người quyết định mức hoà giải. |
| D10 | Task-3 (dispatcher domain/workflow-aware wiring) GIỮ LẠI trong scope §7 — đảo ngược đề xuất drop của chính trợ lý (round 12). | Bugfix-workflow (un-merge `feature`/`bugfix`/`lightweight` theo D7/D7a tsk-2t9c, đang hoãn) sắp landing thật, không còn giả thuyết — tiền đề tsk-2t9c dùng để hoãn wiring dispatcher (chỉ 1 workflow đăng ký, wiring đổi 0 hành vi) sắp hết đúng. Lý do sâu hơn để làm domains/ split NGAY: code bugfix-workflow viết ra ở đâu phụ thuộc `codingDomain` đang sống ở đâu lúc đó — split trước khi code đó viết ra thì nó không bao giờ chạm `workflow-stage-graphs.mjs` cũ, tránh migrate 2 lần. |
| D11 | Mở rộng pattern resolver-function đã có của `workflow-stage-graphs.mjs` sang cross-boundary FILE lookup — thêm `resolveTaskSpecPath(domain, specId)`, `registrations.mjs` gọi hàm này thay vì tự ghép `path.join('docs','task-specs',domainName,...)`. | Người: sau khi không gian đã tách hoàn toàn, việc quan trọng tiếp theo là cơ chế đọc file/giao tiếp cross-boundary. Scout: `workflow-stage-graphs.mjs` đã có 13 hàm resolver cho DATA (`getDomain`, `skillForStage`, ...) — pattern port đã tồn tại. `registrations.mjs` là chỗ DUY NHẤT còn tự ghép path thô, bỏ qua pattern — sau D9 di dời task-specs, đây là chỗ vỡ đầu tiên nếu không sửa. |
| D12 | Mở rộng `docs/architecture-manifest.json` + `test/architecture.test.mjs` thêm 1 rule domain-siloing: core không import domain cụ thể nào, `domains/<name>/` không import `domains/<other>/` — tái dùng nguyên cơ chế one-directional-import đã chứng minh cho 5 layer kỹ thuật. | So sánh `upstreams/pi` ("everything is a plugin"): pi enforce ranh giới bằng `package.json`'s `exports` map (path không khai = Node tự chặn import) — cấp package thật, cần workspace. fgOS là 1 package, không workspace — chuyển hẳn sang mô hình pi tốn hơn hẳn cái đang có. fgOS đã có tương đương thật: architecture-manifest + test đỏ khi import ngược layer. Bài học từ pi không phải "xây cơ chế mới" mà "mở rộng cơ chế đã có sang trục domain". |
| D13 | Kiến trúc 3 tầng dispatch/routing/driving. DISPATCH (`src/runner/dispatch.mjs`, `buildAgentTypeExecutor`, tsk-3sw — chọn persona, MỘT LẦN, trước khi session tồn tại) → ROUTING (`fgos-routing`, xuyên domain, chọn máy móc nào áp dụng, chạy MỘT LẦN trong session đã có persona cố định) → DRIVING (`fgos-<domain>-driving`, lặp qua stage, CÙNG persona, load lại skill+taskSpec tự do mỗi stage). | Nguyên lý tổ chức: soul/persona một session KHÔNG hoán đổi giữa chừng — khác skill/task-spec (văn xuôi đọc lại tự do). Bằng chứng thật, không phải suy diễn: `fgos-coding-driving` ceiling mặc định = `status=='awaiting-approval'`, ĐÚNG trạng thái tsk-2t9c D18 gắn async review handoff (holder đổi, D8) — driving đã dừng đúng lúc persona cần đổi từ trước khi nguyên lý này được đặt tên. Sync/async (D8) không phải lựa chọn API tuỳ tiện — cùng ràng buộc soul-không-hoán-đổi, đã mã hoá đúng sẵn. |
| D14 | `bundleForStage(domain, stage)` trả `{skill, taskSpec}` cùng lúc, sống ở tầng DRIVING (D13) — đóng gap skill hardcode literal path task-spec trong prose. | `skillMap`/`taskSpecMap` đã nằm cạnh nhau, cùng object `codingDomain`, cùng key theo stage — hàm này chỉ bọc lại dữ liệu sẵn có, không phải dữ liệu mới. Task-spec (khung sườn/hợp đồng) nên được máy móc tầng khung sườn resolve, không phải nằm rải rác hardcode bên trong skill (lớp da). |
| D15 | Persona/agent-type resolve theo `(domain, stage, role)`, không chỉ `(domain, role)`. Team-hợp-tác trong 1 stage = chuỗi sync call (consult/assist, D8, holder không đổi) từ 1 holder chính tới nhiều persona chuyên biệt — KHÔNG multi-holder cùng lúc; song song thật = decompose ra item con (`fgos-fanout`, có sẵn), không phải concurrency trên cùng 1 worktree. | Người: "flow triển khai 1 feature có thể là nối tiếp của 2 flow" (PO+BA lúc discovery/exploring, Tech-Lead+SWE+Tester lúc planning) không cần 2 workflow riêng — cùng roleGraph, cùng role (`implementer`), khác persona theo cụm stage; field key thêm không tốn gì hôm nay (1 persona chung cho mọi stage) nhưng mở cửa cho sau. So sánh marketing-cockpit: `skills:` trên agent-type của họ chỉ là catalog thiết-kế-thời, KHÔNG dispatch runtime nào truy vấn — `claims` (pull, tsk-2t9c) đã đi xa hơn họ. CỐ Ý CHƯA XÂY: ranh giới stage-đổi-persona-ngầm có nên cũng dừng driving — chưa đủ bằng chứng persona đa dạng thật (cùng kỷ luật grow-tasks-before-roles giữ roleGraph đóng ở 5 role, D10 tsk-2t9c). **[Hướng khớp eligibility đã đảo ngược, xem D20 — task-spec khai cần gì, không phải agent-type khai claim gì; `(domain, stage, role)` key ở đây vẫn đúng, chỉ đổi CÁCH agent-type được xác định đủ điều kiện.]** |
| D16 | Đổi tên role `human-advisor` → `advisor` trong `roleGraph.roles` (và các edge `to: 'human-advisor'`) — khớp hình dạng đặt tên của 4 role còn lại (tên seat thuần, không gắn persona). KHÔNG thêm cơ chế eligibility-resolution mới nào. | Người: gắn "human" vào tên role là dư thừa — `awaiting-human` (status-fsm, có TRƯỚC roleGraph) + `ask`/`answer` (verb pair, có lịch sử riêng) đã bắt trọn phần human-specific rồi, role không cần nói lại lần nữa. Reason `advise` vẫn máy móc resolve qua `fgos ask`/`answer` → `awaiting-human`, bất kể role tên gì — role tự nó chưa bao giờ nhất thiết phải "dành cho con người", đó là do cơ chế `advise` gọi tới, không phải do role đặt tên. (Trợ lý ban đầu hiểu ngược hướng phản hồi của người, đã tự sửa lại sau khi người làm rõ.) |
| D17 | Gộp task-3 (dispatcher wiring, D10) vào task-1 (registry split, D3/D4) — làm chung 1 lượt, không tách 2 lượt riêng. Scout chính xác: chỉ 2 điểm đọc property phẳng còn thật — `stage-fsm.mjs:94` (`domain.transitions.some(...)`) và `plan.mjs:519`+`loop.mjs:1297` (cùng 1 dòng trùng lặp, `domain.stages?.includes('decompose')`). Cả 2 đổi sang đọc qua `resolveWorkflow(domain, kind)`. GATE identity của round 12 (task-1) NAY MOOT — không còn 2 đường đọc để so sánh phân kỳ. | Người: đang dời hộp (`codingDomain`) rồi thì dọn biển luôn cùng lượt, để không đụng `stage-fsm.mjs` (module test dày đặc nhất repo) 2 lần riêng biệt — đúng lý luận D10 đã dùng ("dời trước khi code mới viết ra, tránh migrate 2 lần") áp thêm 1 bước. Phát hiện thêm khi scout: `resolveWorkflow` đã export nhưng CHƯA được gọi từ bất kỳ file nào bên ngoài `workflow-stage-graphs.mjs` — nên việc gộp này cũng là lần đầu hàm đó thật sự được dùng. |
| D18 | `domains/<name>/workflows/<workflow-name>.mjs` là nơi ở CHÍNH THỨC của workflow definition — `registry.mjs` chỉ còn là aggregator cho map `workflows` của CHÍNH NÓ, mirror lại đúng pattern aggregator của D4 (một tầng sâu hơn). `feature` VẪN định nghĩa bằng reference-sharing với field top-level của domain trong `registry.mjs` (giữ nguyên kỷ luật identity D7a); `bugfix`/`lightweight` (khi viết ra) thành file ĐỘC LẬP thật dưới `workflows/`, không đụng file của `feature`. | Người chỉ ra: "workflow" chưa có file riêng nào — chỉ là key lồng trong `registry.mjs`. Ổn khi chỉ có 1 workflow (reference-sharing, 0 dữ liệu thêm) nhưng `bugfix`/`lightweight` cần graph ĐỘC LẬP thật (không share reference) — nếu để nguyên trong `registry.mjs`, sẽ phình to y hệt vấn đề `workflow-stage-graphs.mjs` từng gặp trước khi tách domain. Cùng lý luận thời điểm D10/D17: tách trước khi code bugfix-workflow viết ra, tránh migrate 2 lần. |
| D19 | Định dạng TÁC GIẢ VIẾT workflow-file tách khỏi HÌNH DẠNG RUNTIME. `domains/<name>/workflows/<name>.mjs` viết theo 1 block gộp mỗi stage (dễ đọc, học ergonomics của marketing-cockpit), NORMALIZE lúc load thành các map runtime hiện có (`stepMap`/`skillMap`/`taskSpecMap`/`transitions`, tách riêng, cùng key theo stage) — API `skillForStage`/`resolveWorkflow` KHÔNG đổi. | Người sửa lại 3 chỗ trợ lý bác vội trong bảng so sánh field-by-field: (1) `rigor`/`cognitive_tier` ĐÁNG học — đặt ở HEADER task-spec (mịn hơn cả workflow-level của họ), vì 1 stage cụ thể có thể cần rigor khác tier chung của item; (2) `approval_gates` ĐÁNG học — như 1 LỚP CẤU HÌNH khai báo nằm TRÊN cơ chế status/CTR005 sẵn có, không thay thế; (3) so sánh `stages` shape không phải chuyện copy list phẳng của họ — là tách RIÊNG ergonomics-viết (1 khối gộp mỗi stage, dễ đọc) khỏi shape-runtime (các map tách rời fgOS đã có, mọi resolver phụ thuộc, không đổi). |
| D20 | Đảo hướng khai báo eligibility. Agent-type CHỈ khai `soul` (persona) + `skills` (năng lực của chính nó) — KHÔNG còn `claims: [task-spec-ids]`. Task-spec khai `assignable-to: [tên agent cụ thể]` HOẶC tối thiểu `requires-skill: [...]`. Eligibility = khớp giữa cái task-spec CẦN và cái agent-type CÓ, không phải danh sách agent-type tự liệt kê. | Người bác thẳng model `claims` của tsk-2t9c D12 (đã code thật, đã merge) — thêm 1 task-spec mới theo model cũ phải sửa MỌI agent-type liên quan (chi phí N×M); theo model mới thì KHÔNG đụng agent-type nào, chỉ khai task-spec cần skill gì. Khớp đúng ví dụ cũ "marketing-lead và tech-lead đều làm được PM" — cả 2 tự nhiên đủ điều kiện qua skill `pm` chung, không cần liệt kê tay ở 2 nơi. Đây là ĐẢO NGƯỢC thật 1 phần D12 đã shipped — cần việc thực thi riêng ngoài scope discussion này. |
| D21 | 3 tầng dispatch (D13) map THẲNG vào 3 cơ chế fgOS ĐÃ CÓ TÊN, ĐÃ BUILD — không phải khái niệm mới. DISPATCH = chính `src/runner/dispatch.mjs` (mở rộng theo D20 để resolve `agentType` qua khớp-skill thay vì đọc config tĩnh). ROUTING = chính `fgos-routing`. DRIVING = chính `fgos-coding-driving`. Rút lại đề xuất đổi tên "CASTING". | Người: đã có concept quan trọng (routing, driver) thì dùng, chế thêm từ mới không hay. Xem lại: `dispatch.mjs` đã có sẵn `buildAgentTypeExecutor(baseExecutor, agentType)` — 1 chỗ ĐÃ CHỜ SẴN để nhận `agentType` — D20 chỉ nâng cấp CÁCH giá trị đó được resolve, không phải thêm 1 tầng song song. Đóng góp thật của mô hình 3 tầng là gọi tên ĐÚNG THỨ TỰ 3 cơ chế có sẵn ghép lại, và LÝ DO (soul không hoán đổi giữa chừng session) — không phải phát minh khái niệm mới. |
| D22 | DISPATCH's eligibility-check là 1 CƠ CHẾ THỐNG NHẤT, xảy ra ở MỌI điểm cần role — không chỉ dòng Collaboration. Stage-entry (`bundleForStage`, D14, role CHÍNH) và dòng Collaboration (consult/assist/review/advise, role PHỤ) đều khớp qua CÙNG phép match D20 (`requires-skill`/`assignable-to` của task-spec ↔ `skills` của agent-type) — khác nhau chỉ ở task-spec NÀO đang được khớp. Stage-entry nhìn như no-op hôm nay CHỈ VÌ `roleGraph` có 1 role xuyên mọi stage + chưa ai viết `requires-skill` khác nhau cho từng task-spec — KHÔNG PHẢI vì cơ chế khác dòng Collaboration. Session-origin cũng có 2 đường ngang hàng dẫn vào CÙNG 1 downstream ROUTING/DRIVING: root-spawn (`spawnWorker`, chỉ runner-không-người) HOẶC người tự mở Claude Code trực tiếp (hoàn toàn ngoài code `dispatch.mjs`). | Người bác bỏ đúng phát biểu sai của trợ lý ("stage transition tự nó KHÔNG dispatch") bằng câu hỏi ngược: "nếu không phải thì thiết kế workflow/stage/task-spec/agent/skill dispatch (bundle mix load) làm gì?". Scout xác nhận `judge-ambiguity.md`/`lock-decisions.md`/`implement-item.md` đều `position: implementer` (role đứng yên mọi stage hôm nay) — nhưng role (seat, `roleGraph`) và skill (năng lực, `requires-skill` D20) là 2 TRỤC khác nhau; `bundleForStage`'s task-spec riêng mỗi stage, một khi mang `requires-skill` (D20), khiến stage-entry trở thành 1 phép khớp dispatch THẬT, chỉ suy biến thành no-op hôm nay vì thiếu đa dạng persona/skill, không phải khác biệt thiết kế. |

## 5. Q&A log

- 2026-08-17 — Round 1 scout: đọc `src/state/workflow-stage-graphs.mjs`
  (`DOMAINS`), `docs/history/bee-to-fgos-rename/CONTEXT.md`,
  `docs/platform-foundations.md` L1/L2/L8, cây thư mục top-level +
  `.claude/skills` + `.agents/skills` + `plugins/fgOS/skills` +
  `herdr-plugin/src`. Không tìm thấy `upstreams/` hay
  `docs/decisions/0025-rust-migration-strategy.md` trong repo này
  (SAI — chỉ tìm trong worktree cô lập, xem round 2).
- 2026-08-17 — Round 2 Q&A: người chỉ ra round 1 sai — `upstreams/`
  CÓ tồn tại trong main checkout. Scout tìm thấy `upstreams/bee/` (snapshot
  nhẹ skills/+AGENTS.md, nguồn "forgent-workshop", bee v1.18.3,
  2026-07-28) và `upstreams/beegog/` (git clone `github.com/vantt/beegog`,
  1.7.10-rc @ 05a131f, 2026-07-21) — cả hai đều CŨ hơn cấu trúc v2.7.0 item
  mô tả (không có `packages/bee-rs`). Người pull `upstreams/beegog` lên
  bản mới nhất — vẫn không thấy `packages/`, skill giảm còn 15 (mất
  bee-context-locking/bee-herding/bee-qualifying) nhưng chưa tới rust-core.
  Người hỏi "upstream/bee là project gì" — trả lời: `bee` và `beegog` là
  MỘT project (không phải hai), chỉ khác cơ chế capture (`bee` = trích
  định kỳ từ workshop sống, `beegog` = git clone của repo đã push). Người
  hỏi "project nào đang có code tận v2.7?" — tìm thấy
  `/home/vantt/projects/beegog/` (live checkout riêng, khác
  `upstreams/beegog/`), xác nhận có `packages/bee-rs` (1 crate `bee`, 1
  binary), `packages/bee` (vendor payload: prompts/, hooks/, statusline/,
  agents/*.tmpl, AGENTS.block.md), `skills/` (9 skill), và
  `docs/decisions/0025-rust-migration-strategy.md` — khớp đúng mô tả của
  item. Grep "multi-domain"/"DOMAINS\b" trong beegog không ra kết quả liên
  quan — beegog không có khái niệm multi-domain. Người xác nhận: dùng
  `/home/vantt/projects/beegog/` làm nguồn so sánh cho phần còn lại của
  thảo luận.
- 2026-08-17 — Round 3 Q&A: người sửa lại mục tiêu thảo luận cho trợ lý —
  "mục tiêu là tổ chức folder-layout để rõ boundary, dễ hexagon, dễ
  contract, dễ thêm, dễ mở rộng, vì còn có thêm domain". Ghi nhận: đây
  KHÔNG phải giả định — có domain thật thứ hai đang chờ (xem round 4).
- 2026-08-17 — Round 4 Q&A: scout `docs/backlog.md` tìm STR52 (marketing
  domain, proposed) + STR89 (done, domain-pluggable seams). Trợ lý hỏi
  ngược người câu hỏi scope của STR52 (share store hay cài riêng) mà
  KHÔNG tự phân tích trước — người phản hồi: đây là việc trợ lý phải tự
  làm advisor, đưa ra 3 tiêu chí cân nhắc (field-compat, security,
  performance) và mặc định share nếu giải được hết. Trợ lý scout
  `src/state/work.mjs` (`validateDomainFields`, dòng 699-740) và
  `src/state/store.mjs`/`replay.mjs` (incremental fast path) + kiểm tra
  `.fgos/events.jsonl` thật (19,037 events/8.4MB) — cả 3 tiêu chí đều
  không chặn share-store. Khuyến nghị: share store — chờ người khoá.
- 2026-08-17 — Round 5a Q&A: người hỏi chi tiết "domain đã ghi field
  riêng ở vùng riêng chưa, common field ở top-level hay không cần chia vì
  2 domain không thể cùng tác động 1 workitem?" Trợ lý xác nhận qua code
  (`work.mjs:674-683`): `domainFields` đã shape đúng `{ [domainName]:
  {...} }`, common field đã ở top-level tách biệt, `work.domain` là
  scalar (không phải set) nên đúng — không có ca 2 domain cùng sở hữu 1
  item, đã đúng cấu trúc từ đầu.
- 2026-08-17 — Round 5b Q&A: người hỏi "vậy ghi domainFields hay
  top-level đều ổn cả?" Trợ lý SỬA — không đúng: top-level là
  `EDITABLE_FIELDS` (`store.mjs:275`), một Set 22 key CỐ ĐỊNH, `edit`
  hard-reject key lạ (`store.mjs:307-310`) — domain không tự thêm được
  field top-level mới (cần sửa core). `domainFields` mới là chỗ mở tự do
  duy nhất. Người nói "ok ghi" → D1+D2 chốt, ghi qua `fgos decision`.
- 2026-08-17 — Round 6a Q&A: người hỏi "cuối cùng thì suggest structure
  như thế nào?" Trợ lý đưa layout đầu tiên: giữ nguyên mọi cây có sẵn,
  chỉ tách `DOMAINS` registry thành file riêng + fix dispatcher. Người
  phản hồi "như cũ rồi, đâu khác gì?" — đúng: layout đó không tạo ranh
  giới THƯ MỤC, chỉ dựa naming convention (`fgos-coding-*`).
- 2026-08-17 — Round 6b Q&A: trợ lý sửa — đề xuất nested
  `.agents/skills/domains/coding` + `src/domains/coding` tách rời. Người
  bác: "nếu làm vậy thì không phát triển được dạng plugin/extension".
  Scout tìm ra tiền lệ thật trong chính repo: `plugins/fgOS/`
  (`.claude-plugin/plugin.json` + `skills/` tự chứa, đăng ký qua 1 dòng
  `marketplace.json`, thêm `dogfood-fixture` không đụng `fgOS/`) — áp
  đúng cơ chế đó cho domain → D3/D4.
- 2026-08-17 — Round 6c Q&A: người hỏi "đặt core vào cùng bối cảnh xem"
  (core có nên có folder riêng đối xứng `domains/` không). Scout: 881
  tham chiếu `bin/fgos.mjs` toàn repo + external install (mission 0035)
  → di dời phá vỡ diện rộng, không đáng — D5. Người hỏi tiếp "nếu cả
  core, domain đều có harness/workflow/task/knowledge/skill/doctrine thì
  cấu trúc thế nào?" — trợ lý map 6 mối quan tâm × {core, domain}: 4/6 đã
  có hình dạng (harness/workflow/task/skill), 2/6 mở (knowledge,
  doctrine) — chưa có tiền lệ domain-scoped trong code hiện tại.
- 2026-08-17 — Round 6d: người yêu cầu "vẽ layout đi" → diagram đầy đủ ở
  §6, D3/D4/D5 ghi qua `fgos decision`.
- 2026-08-17 — Round 7 Q&A: người hỏi "sao không vẽ ascii layout" → thêm
  cây thư mục dạng `text` (không chỉ mermaid). Người hỏi tiếp "trong từng
  domain không có workflow/task-specs/knowledge à?" — trợ lý sửa: workflow
  đã có (registry.mjs), task-specs cũng ĐÃ có trong CÙNG file
  (`fieldSchema`), riêng spec dạng văn xuôi (BA-grade) nên ở
  `docs/specs/` (shared, không lồng domains/) để giữ `reading-map.md` là
  1 điểm tra cứu duy nhất; knowledge lúc này chưa có tiền lệ, đề xuất D6
  bản đầu (tag `domain` lên `docs/history/`). Người chỉ ra core cũng
  không đối xứng — trợ lý bảo vệ D5 (881 ref), thêm bảng ánh xạ
  concern→path cho core thay vì di dời. Người yêu cầu vẽ lại ascii —
  redraw đủ 6 concern cho cả core lẫn domain. **Người sửa lại D6 bản đầu:
  `docs/history/` là CONTEXT (thô, theo feature), không phải knowledge —
  domain-knowledge là khái niệm KHÁC, curated riêng của team.** Trợ lý
  scout `/home/vantt/projects/beegog/expertise/` (chưa xem trước đó) —
  tìm thấy hệ curated knowledge-base thật với `knowledge.md` tự mô tả
  đúng khái niệm người muốn (harvesting/trust/freshness/retirement, khác
  hẳn raw log) → D6 mới: `domains/<name>/knowledge/`, co-located.
- 2026-08-17 — Round 8 Q&A: người hỏi "`.agents/skills/core` thành
  `core/skills/` được không? `.agents` và `.claude` là thin wrapper?"
  Trợ lý scout `src/setup/skill-wrappers.mjs` — tìm ra `.agents/skills/*`
  là canonical theo một quyết định TRƯỚC (tsk-1qi D5), và `fgos setup`
  vendor nguyên văn `.agents/skills/*` vào MỌI external project
  (`materializeSkillsIntoProject`) — không phải rename đơn giản. Trợ lý
  đề xuất: canonical AUTHORING chuyển sang `core/skills/` +
  `domains/*/skills/`, cả 3 cây cũ thành render target thật (thêm bước
  assembly), giữ nguyên hình dạng bên ngoài host project nhận được. Người
  xác nhận "ừ ghi D7 đi" → D7 chốt.
- 2026-08-17 — Round 9 Q&A: người nói "tôi muốn tách các task-specs từ
  docs/spec vào từng domain folder và core folder riêng luôn" — đảo ngược
  trực tiếp đề xuất trước của trợ lý (giữ `docs/specs/` chung cho
  `reading-map.md`). Trợ lý scout `docs/specs/` — cả 12 file hiện có đều
  là spec core/platform, không file nào business-spec riêng domain nào →
  D8 (SAI): toàn bộ chuyển `core/specs/`, `domains/*/specs/` khởi tạo rỗng.
- 2026-08-17 — Round 10 Q&A: người sửa ngay "sai, không di dời
  docs/specs/*.md, chỉ di dời task-specs only" — trợ lý đã hiểu nhầm
  "task-specs" thành toàn bộ khu `docs/specs/`. Đọc lại đúng ngữ cảnh
  round 7: task-specs = spec của RIÊNG concern `task`, không phải mọi
  spec nền tảng. D8 sửa lại: `docs/specs/` giữ nguyên 100%, chỉ thêm mới
  `domains/<name>/specs/` cho task-spec riêng của domain.
- 2026-08-17 — Round 11 Q&A: người hỏi "em có biết mình có folder
  `docs/task-specs/coding/*.md`? cái này là move vào task-specs trong
  domain coding." Trợ lý scout — tìm thấy 13 file thật, machine-checked
  bởi `registrations.mjs`'s `task-specs-resolve`, thuộc thiết kế đã chốt
  `tsk-2t9c` (`docs/history/fgos-marketing-domain-foundation/`, 13 quyết
  định, code đã wiring thật). D10 của tsk-2t9c khoá "four-layer ontology"
  (task-spec/skill/knowledge/context) — task-spec đúng nghĩa là hợp đồng
  theo LOẠI việc, không phải field-schema work-item mà trợ lý hiểu nhầm
  từ round 7. D9 (thảo luận này) sửa lại theo đúng định nghĩa gốc; câu
  hỏi treo cho người: hoà giải registry.mjs (D3/D4, chưa có
  `roleGraph`/`taskSpecMap`) với tsk-2t9c ở mức nào.
- 2026-08-17/18 — Round 12 Q&A: người xác nhận muốn hoà giải đầy đủ ("cần
  xem cả 2 luôn vì anh có ý định reconstruct"). Trợ lý scout xác nhận
  `tsk-2t9c` đã MERGE VÀO MAIN (`e268376e`), liệt kê đủ 10+ field thật của
  `codingDomain`, tìm thêm render-pair thứ 2 chưa biết (`agents/*.yaml` →
  `.claude/agents/*.md`, cơ chế `claims`). Trợ lý phân tích chủ động (theo
  đúng phản hồi "advisor, not mechanical worker" — tự nghiên cứu/đề xuất
  trước khi hỏi) và đề xuất DROP task-3 (dispatcher wiring), lý do:
  tsk-2t9c đã chủ đích hoãn việc này vì chỉ 1 workflow đăng ký. Người bác
  ngay: bugfix-workflow sắp landing thật, tiền đề "chỉ 1 workflow" sắp
  hết đúng, và chính đó là lý do làm domains/ split BÂY GIỜ để không phải
  migrate 2 lần → D10, task-3 giữ lại, đổi khung.
- 2026-08-18 — Round 13 Q&A: người yêu cầu tổng hợp toàn cục — trợ lý recap
  D1-D10 + việc còn mở. Người giới thiệu thêm nguồn so sánh mới:
  `upstreams/pi` ("everything is a plugin"). Trợ lý scout, tìm cơ chế
  extension-là-package-thật + `exports` map enforce (Node tự chặn import
  path không khai). Người làm rõ ưu tiên: folder/package không quan trọng
  (cả 2 chỉ là cách isolate footprint) — quan trọng là tách bạch HOÀN
  TOÀN core/domain, rồi tới cơ chế cross-boundary file/communication. →
  D11 (resolver function `resolveTaskSpecPath`, mở rộng pattern 13 hàm đã
  có). Người yêu cầu thêm: học layout nội bộ + module-connection của pi.
  Trợ lý scout `packages/agent`'s `exports` field thật, rồi tìm ra fgOS
  ĐÃ CÓ cơ chế tương đương (`architecture-manifest.json` +
  `architecture.test.mjs`) — chỉ cần mở rộng, không xây mới → D12. Người
  xác nhận "Đồng ý" — D11+D12 chốt.
- 2026-08-19 — Round 14 Q&A (ultrathink, nhiều lượt): người hỏi "domain
  đã có N workflow, mỗi workflow N stage, mỗi stage N taskSpec — cơ chế
  điều phối thật là gì, ai chủ động?", dặn tham khảo (không bắt chước)
  marketing-cockpit. Trợ lý scout `orchestration/delegation.yaml` (PUSH,
  orchestrator dispatch), `agents/seo-specialist.md` (`skills:` list —
  nhìn tưởng multi-skill repertoire), rồi phát hiện quan trọng: field
  `skills:` đó KHÔNG được bất kỳ dispatch mechanism nào truy vấn — chỉ là
  catalog thiết-kế-thời, gán agent→stage vẫn 100% hardcode trong
  `workflow.md`. Kết luận: `claims` (pull) của tsk-2t9c đã đi XA HƠN
  marketing-cockpit, không phải thứ cần bắt kịp. Người hỏi tiếp "skill có
  cần thiết hardcode load task-spec?" — trợ lý xác nhận (đọc dòng
  88/177/291 của `fgos-coding-implement`) đúng là hardcode literal path,
  đề xuất doctor-check thay vì sửa cơ chế. Người chỉnh sửa framing sâu
  hơn: "workflow/stage/taskSpec là khung sườn/hợp đồng/chữ ký của việc,
  skill+persona là lớp da giúp việc chất hơn" và nêu ràng buộc cứng
  "MỘT SESSION KHÔNG THỂ ĐỔI SOUL GIỮA CHỪNG". Trợ lý ultrathink, xác
  nhận qua code thật (`dispatch.mjs`'s `buildAgentTypeExecutor`,
  `fgos-coding-driving`'s ceiling mặc định = `awaiting-approval` — ĐÚNG
  lúc async review handoff D18 fire) → D13 (kiến trúc 3 tầng) + D14
  (`bundleForStage`). Người mở rộng vision: 1 flow có thể là 2 flow nối
  tiếp (PO+BA rồi Tech-Lead+SWE+Tester) — trợ lý brainstorm, kết luận
  không cần 2 workflow, chỉ cần persona resolve theo `(domain, stage,
  role)` → D15, người xác nhận "đồng ý vụ (domain, stage, role)".
- 2026-08-19 — Round 15-18 (rút gọn, chi tiết đủ ở §1 mỗi round): sweep
  "position"→"role" xuyên file (round 15). `human-advisor`→`advisor`
  (D16), trợ lý hiểu ngược 1 lần rồi tự sửa sau khi người làm rõ (round
  15-16). Ẩn dụ "2 biển 1 hộp" cho GATE task-1, người tự đề xuất dọn biển
  cùng lượt dời hộp → D17, gate cũ thành moot (round 16). Người chỉ ra
  workflow chưa có file riêng → D18 (`domains/<name>/workflows/`); scout
  33 workflow file thật của marketing-cockpit, xác nhận 7/33 là
  `template` chứ không phải `workflow`; trợ lý bác vội 3 field trong bảng
  so sánh, người sửa lại cả 3 (rigor cấp task-spec, approval_gates như
  lớp cấu hình, tách ergonomics-viết khỏi shape-runtime) → D19, thêm mục
  "Ý tưởng chưa xây" cho escalation-threshold + signal-bus (round 17).
- 2026-08-19 — Round 18 Q&A: người bác thẳng model `claims:
  [task-spec-ids]` của tsk-2t9c D12 — muốn agent-type chỉ khai soul+skill,
  task-spec khai `assignable-to`/`requires-skill` thay vì ngược lại → D20.
  Người hỏi thêm: tầng "DISPATCH" (D13) và `dispatch.mjs` thật có phải 2
  thứ không — trợ lý đề xuất đổi tên "CASTING". Người bác: đã có
  routing/driver rồi, đừng chế thêm — trợ lý xem lại, xác nhận cả 3 tầng
  đều map thẳng vào cơ chế đã có tên (`dispatch.mjs`/`fgos-routing`/
  `fgos-coding-driving`), rút "CASTING" → D21.
- 2026-08-19 — Round 19, tiếp tục việc dở dang round 18: scout code thật
  cho D20 (`scripts/project-agents.mjs` dòng 120-125/137-147,
  `src/setup/registrations.mjs` dòng 419-503 `checkAgentClaimsResolve`,
  `docs/task-specs/coding/implement-item.md` header shape, `agents/
  fgos-placeholder.yaml`, `roleGraph.roles` trong
  `workflow-stage-graphs.mjs:406`). Viết subsection "Eligibility
  declaration — đảo hướng" mới vào §6, sửa lại đoạn so sánh
  marketing-cockpit còn khen `claims` cũ (stale so với D20), thêm task
  {#task-eligibility-inversion} vào §7. Rà toàn bộ §6 còn lại — không
  tìm thêm chỗ stale nào khác. Phân tích 2 việc mở cũ (render-pair
  placement, doctrine domain-scoped), đề xuất hướng cho cả 2, CHƯA khoá
  D-ID — chờ người xác nhận round sau.
- 2026-08-19 — Round 19 tiếp, D22: người hỏi bố cục 3-tầng
  DISPATCH/ROUTING/DRIVING (§6) có đúng không sau khi D21 gom DISPATCH
  thành 1 khái niệm. Trợ lý scout `dispatch.mjs` 2 điểm vào (`spawnWorker`
  root-spawn dòng 1693, `decideDispatchMechanism` in-session decide dòng
  1275-1329) — đề xuất DISPATCH là dịch vụ lặp lại, không phải tầng-1-lần.
  Người hỏi "root-spawn là gì" — trợ lý phân biệt root-spawn (chỉ
  runner-không-người) vs người tự mở session (ngoài `dispatch.mjs`).
  Người hỏi tiếp pick/discover/exploring/planning/executing/review có
  phải mỗi cái 1 ứng viên dispatch — trợ lý trả lời SAI ("stage-entry
  không dispatch"). Người bác: "nếu không phải thì thiết kế
  workflow/stage/task-spec/agent/skill dispatch (bundle mix load) làm
  gì?" — trợ lý scout lại 3 task-spec header (`position: implementer`
  cả 3), nhận ra role≠skill là 2 trục, `bundleForStage` (D14) đã có cơ
  chế khớp cho CẢ stage-entry, chỉ no-op vì thiếu dữ liệu → D22 (seq
  20826, ghi qua `fgos decision --id tsk-397`). Người xác nhận: "đồng ý,
  mãi mới thấy rõ chổ này."

## 6. Thiết kế đã chốt {#design}

fgOS tổ chức folder-layout theo mô hình hexagonal: **core = port đóng,
dùng chung mọi domain; `domains/<name>/` = adapter tự chứa, mỗi domain
một folder, thêm domain mới không đụng file nào có sẵn.** Đây không phải
suy diễn lý thuyết — mirror đúng cơ chế plugin đã chạy thật trong chính
repo này (`plugins/fgOS/`: manifest + skills tự chứa, thêm
`dogfood-fixture` không đụng gì bên trong `fgOS/`).

Layout thư mục thật, đủ 6 mối quan tâm cho cả core lẫn domain:

```text
forgentX/
│
│ ── CORE (port đóng — dùng chung mọi domain, KHÔNG di dời vật lý, D5) ──
│
├── bin/                                  # harness
├── src/
│   ├── state/
│   │   ├── stage-fsm.mjs                 # workflow — FSM cơ học domain-agnostic
│   │   ├── status-fsm.mjs                # workflow — FSM cơ học domain-agnostic
│   │   ├── work.mjs                      # task — EDITABLE_FIELDS (22 key cố định, D2)
│   │   └── workflow-stage-graphs.mjs     # workflow — AGGREGATOR (D4)
│   │                                     #   trước: chứa cả codingDomain (~390 dòng) inline
│   │                                     #   sau:   quét domains/*/registry.mjs, build DOMAINS tự động
│   └── intake/{discovery,plan}.mjs       # workflow — dispatcher, sửa đọc DOMAINS[item.domain] thay vì hardcode
├── herdr-plugin/                         # harness — Rust engine
├── core/
│   └── skills/                           # ★ D7 — canonical AUTHORING (thay .agents/skills/core/)
│       ├── fgos-routing/  fgos-clarifying/  fgos-researching/
│       └── fgos-unlock/   fgos-fanout/      fgos-indexing/   distill/
├── docs/
│   ├── specs/                            # ★ D8 SỬA LẠI — GIỮ NGUYÊN, KHÔNG di dời (bản D8 đầu sai, đã sửa).
│   │   │                                 #   12 file platform/core (work-state, runner, distribution, ...)
│   │   │                                 #   ở đúng chỗ cũ; core's task-contract đã tự tài liệu hoá bằng
│   │   │                                 #   CODE (EDITABLE_FIELDS, D2), không cần file spec riêng ở đây.
│   │   └── reading-map.md                # không đổi
│   ├── decisions/                        # knowledge — quyết định nền tảng, domain-agnostic (craft, không phải domain)
│   └── history/                          # CONTEXT, không phải knowledge (sửa round 7) — thô, append-only,
│                                         #   theo feature, giữ nguyên chỗ, share, KHÔNG gắn tag domain
├── AGENTS.md / CLAUDE.md                 # doctrine — luôn nạp, KHÔNG phân domain (❓ vẫn mở, chưa có
│                                         #   cơ chế nạp-có-điều-kiện theo domain)
│
│ ── DOMAINS (adapter mở — mỗi domain 1 folder tự chứa, D3) ──
│
├── domains/                              # ★ MỚI — top-level
│   ├── coding/
│   │   ├── registry.mjs                  # workflow (stages/stepMap/transitions/skillMap)
│   │   │                                 #   + task-specs (fieldSchema — CÙNG file, work.mjs đọc
│   │   │                                 #   domain?.fieldSchema từ đây, D2)
│   │   ├── skills/                       # skill — canonical AUTHORING (D7), di dời từ .agents/skills/
│   │   │   ├── discovering/  exploring/  planning/  validating/
│   │   │   └── implement/    shaping/    driving/    compounding/
│   │   ├── knowledge/                    # ★ D6 — curated domain-knowledge, riêng của team, co-located
│   │   │   # (KHÁC docs/history/ — knowledge được bảo trì chủ động, context thì thô/append-only)
│   │   │   # tiền lệ thật: /home/vantt/projects/beegog/expertise/ (knowledge.md tự mô tả
│   │   │   # harvesting/trust/dated-freshness/retirement — một hệ bảo trì, không phải log)
│   │   └── specs/                        # ★ D8 — RỖNG hôm nay; chờ BA spec riêng của coding-domain
│   │       # task (data thật): domainFields.coding.* — sống trong .fgos/events.jsonl, không phải file
│   │
│   └── marketing/                        # ★ tương lai (STR52) — thêm vào đây, KHÔNG sửa gì trong coding/
│       ├── registry.mjs
│       ├── skills/
│       └── specs/                        # ★ D8 — spec business trước khi có code (luật AGENTS.md)
│
├── .agents/skills/                       # ★ D7 — render target (trước: canonical, tsk-1qi D5). Hình dạng/nội
│                                         #   dung KHÔNG đổi (vẫn được fgos setup vendor nguyên văn vào
│                                         #   external project) — chỉ nguồn sinh ra nó đổi (assembly step mới)
├── .claude/skills/                       # render target (không đổi cơ chế — vẫn generate, nay từ core/skills/+domains/*/skills/)
└── plugins/fgOS/skills/                  # render target (không đổi cơ chế — mirror plugins/fgOS/ tự nó)
```

```mermaid
flowchart TB
    subgraph CORE["core (port đóng — mọi domain dùng chung, KHÔNG di dời — D5)"]
        direction LR
        harness_core["<b>harness</b><br/>bin/, src/, herdr-plugin/<br/><i>domain không có harness riêng</i>"]
        workflow_core["<b>workflow</b><br/>stage-fsm.mjs, status-fsm.mjs<br/>+ workflow-stage-graphs.mjs<br/><i>(aggregator, D4)</i>"]
        task_core["<b>task</b><br/>EDITABLE_FIELDS<br/>(store.mjs:275, D2)"]
        skill_core["<b>skill</b><br/>core/skills/ (canonical, D7)<br/>fgos-routing, fgos-clarifying, ...<br/><i>.agents/.claude/plugins = render targets</i>"]
        knowledge_core["<b>knowledge</b><br/>docs/decisions/ (craft, domain-agnostic)"]
        context_core["<i>(context ≠ knowledge)</i><br/>docs/history/&lt;feature&gt;/<br/>shared, KHÔNG gắn domain — D6"]
        doctrine_core["<b>doctrine</b> ❓<br/>AGENTS.md / CLAUDE.md<br/>(luôn nạp, mọi domain)"]
    end

    subgraph DOMAINS["domains/ (adapter mở — mỗi domain tự chứa, D3)"]
        direction LR
        subgraph CODING["domains/coding/"]
            direction TB
            wf_c["workflow<br/>registry.mjs"]
            tk_c["task<br/>domainFields.coding.*"]
            sk_c["skill<br/>skills/ (8 skill,<br/>di dời từ .agents/skills/)"]
            kn_c["<b>knowledge</b><br/>knowledge/ — curated,<br/>co-located (D6)"]
            dc_c["doctrine ❓"]
        end
        subgraph MARKETING["domains/marketing/ (STR52, chưa xây)"]
            direction TB
            wf_m["workflow<br/>registry.mjs"]
            tk_m["task<br/>domainFields.marketing.*"]
            sk_m["skill<br/>skills/"]
        end
    end

    workflow_core -. "quét domains/*/registry.mjs<br/>tự động (D4, không sửa tay)" .-> wf_c
    workflow_core -.-> wf_m
    task_core -- "domainFields là 1 trong 22 key" --> tk_c
    task_core -.-> tk_m
```

**Quy tắc đặt field/code (D2-D4):** cần cùng nghĩa + cùng cách đọc ở MỌI
domain → core (sửa `EDITABLE_FIELDS`/aggregator, ảnh hưởng mọi domain,
cân nhắc kỹ). Chỉ một domain cần → `domains/<name>/` (registry.mjs cho
workflow, `domainFields.<name>.*` cho task, `skills/` cho skill) — không
đụng core, domain khác không thấy/không bị ảnh hưởng.

**Core KHÔNG di dời vật lý (D5).** `bin/`, `src/`, `herdr-plugin/` giữ
nguyên vị trí — 881 tham chiếu `bin/fgos.mjs` toàn repo + external
install (mission 0035) khiến di dời phá vỡ diện rộng cho lợi ích thuần
biểu tượng. Chỉ `.agents/skills/core/` được gắn nhãn tường minh (rẻ,
không có external path phụ thuộc).

**Domain-knowledge ≠ context (D6, sửa lại round 7).** `docs/history/` là
CONTEXT — biên bản thô, append-only, theo feature — giữ nguyên chỗ, share,
KHÔNG gắn tag `domain`. "Knowledge" đúng nghĩa là curated, do team chủ
động bảo trì (harvest, đánh giá độ tin cậy, hết hạn/rút khi lỗi thời) —
tiền lệ thật là `/home/vantt/projects/beegog/expertise/`. Domain-knowledge
sống co-located tại `domains/<name>/knowledge/`, cùng tinh thần tự-chứa
với `skills/` (D3).

**Còn mở (❓ trong diagram):** chỉ còn `doctrine` domain-scoped — chưa có
cơ chế nạp-có-điều-kiện theo domain nào trong AGENTS.md/CLAUDE.md hôm
nay, và tagging (cách D6 giải cho knowledge) không áp dụng được cho thứ
luôn-nạp. Trục
engine-vs-prose ở tầng SKILL đã tự nhiên giải quyết qua D3 (skill sống
trong `domains/<name>/skills/` hoặc `.agents/skills/core/`, không còn là
câu hỏi tách riêng) — phát hiện round 5: 3 cây skill cũ (`.agents/skills`,
`.claude/skills`, `plugins/fgOS/skills`) KHÔNG phải trùng lặp, mà là 1
nguồn canonical + N target render (đúng cơ chế beegog tự dùng cho chính
nó) — không cần sửa cơ chế render, chỉ cần domain skill di dời đúng chỗ
trong nguồn canonical trước khi render.

**Còn mở, ĐỀ XUẤT round 19 (chưa khoá D-ID, chờ người xác nhận):**

- `agents/*.yaml`→`.claude/agents/*.md` render-pair NÊN giữ nguyên
  top-level `agents/` (KHÔNG tách vào `domains/<name>/agents/`, khác
  hẳn skill/task-spec/knowledge). Lý do: D20 (subsection trên) làm
  agent-type identity domain-agnostic-BY-THIẾT-KẾ — 1 agent-type đủ
  điều kiện xuyên domain qua `skills` dùng chung (đúng ví dụ
  marketing-lead/tech-lead-đều-làm-PM, round 14), không thuộc sở hữu 1
  domain duy nhất theo cách `skills/`/`task-specs/`/`knowledge/` của 1
  domain thuộc sở hữu domain đó. Tách agent-type vào
  `domains/<name>/agents/` sẽ ép 1 agent-type đa-domain phải chọn "nhà"
  giả tạo, hoặc nhân bản file — không mirror đúng D3's lý do tự-chứa
  (self-contained vì thật sự chỉ 1 domain dùng).
- `doctrine` domain-scoped NÊN đánh dấu "cố ý CHƯA XÂY" — cùng lớp với
  phần treo có chủ đích của D15 (chờ bằng chứng thật, không thiết kế
  trước). Lý do: chưa có nội dung doctrine domain-thật nào tồn tại để
  thiết kế theo (`marketing` vẫn `proposed`, chưa có `AGENTS.md`/
  `CLAUDE.md` riêng nào cần nạp-có-điều-kiện) — ép thiết kế bây giờ là
  suy diễn không có chất liệu, khác hẳn 5 mối quan tâm còn lại đều có
  tiền lệ/nhu cầu thật (STR52/STR89/tsk-2t9c) để dựa vào.

### Tầng DISPATCH/ROUTING/DRIVING — điều phối workflow/stage/taskSpec/skill/persona (D13-D15, D20-D22, sắp lại round 19)

Ranh giới không gian (D1-D12) trả lời "cái gì sống ở đâu". Phần này trả
lời "khi item thật chạy, ai làm gì, theo thứ tự nào, ai chủ động".
Nguyên lý tổ chức duy nhất: **soul (persona của một session) không hoán
đổi được giữa chừng session** — khác skill/task-spec, chỉ là văn xuôi đọc
lại tự do bất cứ lúc nào.

**Sửa lại bố cục (round 19, D22) — 2 phát hiện làm đổi hình dạng diagram
cũ (từng vẽ DISPATCH/ROUTING/DRIVING như 3 tầng xếp chồng, chạy 1→2→3
tuần tự):**

1. **Session-origin có 2 đường ngang hàng, không chỉ 1.** DISPATCH's
   root-spawn (`spawnWorker`, `dispatch.mjs:1693`, gọi từ `loop.mjs`) CHỈ
   xảy ra khi runner-KHÔNG-người tự tạo worktree + spawn hẳn 1 process
   headless mới. Khi NGƯỜI tự mở Claude Code (mặc định hay `claude
   --agent X`) — như chính phiên thảo luận này — KHÔNG đi qua 1 dòng code
   nào của `dispatch.mjs` cả; người tự quyết định persona. Cả 2 đường đều
   nộp lại CÙNG 1 tiền đề cho ROUTING (session đã persona-cố-định,
   `hasLiveTaskAccess` tự nhiên đúng) — ROUTING không cần biết session tới
   từ đường nào.
2. **DISPATCH không phải "tầng chạy 1 lần rồi thôi" — nó là dịch vụ bị
   gọi LẶP LẠI, từ NHIỀU điểm, dùng CHUNG 1 phép khớp (D20/D22).** Có 2
   loại điểm gọi, cả 2 đều khớp `requires-skill`/`assignable-to` (task-spec)
   ↔ `skills` (agent-type) — chỉ khác NGUỒN task-spec:
   - **Stage-entry** (role CHÍNH): mỗi lần DRIVING vào 1 stage mới,
     `bundleForStage(domain, stage)` (D14) nạp task-spec CỦA STAGE ĐÓ.
     Task-spec đó (sau D20) mang `requires-skill` riêng — phải khớp lại
     với `skills` của agent-type ĐANG chạy.
   - **Dòng Collaboration** (role PHỤ): consult/assist/review/advise
     trong bảng Collaboration của MỖI task-spec — mỗi dòng gọi 1 role
     khác (researcher/helper/reviewer/advisor), khớp `requires-skill`
     của CHÍNH interaction đó.
   Hôm nay stage-entry NHÌN như no-op (không quan sát được dispatch nào)
   — scout xác nhận `judge-ambiguity.md`/`lock-decisions.md`/
   `implement-item.md` đều `position: implementer` — nhưng đó là do (a)
   `roleGraph` chỉ 1 role xuyên mọi stage, (b) chưa ai viết
   `requires-skill` khác nhau cho từng task-spec — KHÔNG phải vì cơ chế
   khác dòng Collaboration. Khi 1 trong 2 điều đó thay đổi (persona đa
   dạng thật — D15's phần chưa xây; hoặc `requires-skill` viết thật —
   D20's task {#task-eligibility-inversion}), stage-entry sẽ TỰ NHIÊN bắt
   đầu dispatch quan sát được, không cần sửa cơ chế gì thêm.

```mermaid
flowchart TB
    subgraph ORIGIN["Session-origin -- 2 đường ngang hàng (D22)"]
        direction LR
        rootspawn["root-spawn<br/>spawnWorker (dispatch.mjs)<br/>CHỈ runner-không-người"]
        humanlaunch["người tự mở Claude Code<br/>(mặc định / --agent X)<br/>NGOÀI code dispatch.mjs"]
    end

    ORIGIN -->|"session đã persona-cố-định"| ROUTING

    subgraph ROUTING["ROUTING -- fgos-routing (1 lần/session)"]
        r1["chọn máy móc domain nào áp dụng<br/>KHÔNG gọi DISPATCH (chỉ Skill(), trong-session)"]
    end

    ROUTING --> DRIVING

    subgraph DRIVING["DRIVING -- fgos-&lt;domain&gt;-driving (lặp qua stage)"]
        stageEntry["Stage-entry (role CHÍNH)<br/>bundleForStage(domain, stage) -- D14"]
        collabRow["Dòng Collaboration (role PHỤ)<br/>consult / assist / review / advise"]
    end

    stageEntry --> ELIG
    collabRow --> ELIG

    subgraph ELIG["DISPATCH eligibility-check -- THỐNG NHẤT (D20/D22)"]
        match["requires-skill / assignable-to (task-spec)<br/>khớp skills (agent-type)"]
    end

    ELIG -->|"khớp -- cùng agent-type"| stay["Ở NGUYÊN in-process<br/>(hôm nay: LUÔN đúng cho stage-entry,<br/>role=implementer mọi stage)"]
    ELIG -->|"không khớp / cần role khác"| handoff["Dispatch thật:<br/>sync (holder không đổi) hoặc<br/>async (holder đổi)"]

    stay --> DRIVING
    handoff -->|"sync -- xong, driving TIẾP TỤC"| DRIVING
    handoff -.->|"async -- driving DỪNG,<br/>quay lại như 1 session-origin mới"| ORIGIN
```

**Team-hợp-tác trong 1 stage (D15):** chuỗi sync call (consult/assist,
holder không đổi) từ 1 holder chính tới nhiều persona chuyên biệt —
KHÔNG BAO GIỜ multi-holder cùng lúc trên 1 item (worktree/branch chỉ 1
writer). Song song thật = decompose ra item con (`fgos-fanout`, đã có),
không phải concurrency trên cùng 1 item.

**"2 flow nối tiếp" không cần 2 workflow (D15):** persona mặc định đổi
theo cụm stage (PO+BA lúc discovery/exploring → Tech-Lead+SWE+Tester lúc
planning) qua key `(domain, stage, role)` — cùng roleGraph, cùng
role (`implementer`), khác persona. Field key thêm không tốn gì hôm
nay (1 persona chung mọi stage) — chỉ mở cửa cho sau. (Round 19, D22:
đây chính xác là "stage-entry eligibility-check" ở diagram trên — persona
mặc định đổi = kết quả `ELIG` trả về "không khớp", tự nhiên kích hoạt
`handoff`, không cần cơ chế riêng.)

**Eligibility declaration — đảo hướng (D20):** tsk-2t9c D12 (đã ship)
trả lời "agent-type nào đủ điều kiện" bằng model `claims` — 2 chỗ chạm
code thật đã scout: `scripts/project-agents.mjs`'s `validateDefinition`
(dòng 120-125, chấp nhận `claims` optional trên `agents/<name>.yaml`) +
`projectAgentMarkdown` (dòng 137-147, chép `claims` vào frontmatter
`.claude/agents/<name>.md`); `src/setup/registrations.mjs`'s doctor check
`agent-claims-resolve` (dòng 419-503) đối chiếu từng `claims` ID với
`docs/task-specs/<domain>/*.md`. Vấn đề: agent-type TỰ LIỆT KÊ từng
task-spec ID nó nhận — thêm 1 task-spec mới cần sửa MỌI agent-type liên
quan (N×M), không giải thích được ví dụ "marketing-lead và tech-lead đều
làm được PM" (round 14) trừ khi cả 2 tự liệt kê tay cùng 1 ID ở 2 file
riêng. D20 đảo hướng: agent-type CHỈ khai cái NÓ CÓ (`soul` = `role`/
`persona`/`decision_boundary` đã có + `skills` MỚI, KHÔNG còn `claims`);
task-spec khai cái NÓ CẦN (`assignable-to: [...]` hiếm/ghim cứng, hoặc
`requires-skill: [...]` thường). D22 mở rộng: phép khớp này áp dụng cho
CẢ stage-entry (task-spec chính) LẪN dòng Collaboration (task-spec phụ)
— không riêng gì Collaboration như bản D20 gốc ngụ ý.

```mermaid
flowchart LR
    subgraph OLD["Cũ (tsk-2t9c D12, đã ship) -- N×M"]
        direction TB
        at_old["agent-type A<br/>claims: [spec-1, spec-2]"]
        ts_old1["task-spec spec-1"]
        ts_old2["task-spec spec-2"]
        at_old -->|"tự liệt kê ID"| ts_old1
        at_old -->|"tự liệt kê ID"| ts_old2
    end
    subgraph NEW["Mới (D20/D22) -- match tại DISPATCH, mọi điểm cần role"]
        direction TB
        at_new["agent-type A<br/>skills: [pm, code-review]"]
        ts_new1["task-spec shape-plan (stage-entry)<br/>requires-skill: [pm]"]
        ts_new2["task-spec review-item (Collaboration row)<br/>requires-skill: [code-review]"]
        at_new -.->|"skill-match, DISPATCH (D22)"| ts_new1
        at_new -.->|"skill-match, DISPATCH (D22)"| ts_new2
    end
```

4 điểm chạm code thật liệt kê ở đoạn trên là scope của task
{#task-eligibility-inversion} §7 — chưa đổi gì thêm sau D22, D22 chỉ mở
rộng PHẠM VI áp dụng của cùng 1 cơ chế, không thêm điểm chạm code mới.

**So sánh marketing-cockpit (tham khảo, không bắt chước — cập nhật round
19 theo D20):** `agents/*.md` của họ có field `skills:` (catalog
multi-skill) nhưng KHÔNG được bất kỳ dispatch mechanism nào truy vấn
runtime — gán agent→stage 100% hardcode trong `workflow.md` (PUSH, tác
giả quyết lúc viết). fgOS's `claims` (tsk-2t9c D12, PULL, agent-type tự
liệt kê `[task-spec-ids]`) từng được coi là "đi xa hơn" marketing-
cockpit vì có runtime thật — nhưng D20 đã đảo ngược chính hướng đó: SAI
hướng khai báo (agent liệt kê ID của task-spec là N×M maintenance) không
phải là "đi xa hơn", chỉ là đi khác. D20 hội tụ về đúng TÊN field
marketing-cockpit đã dùng (`skills:`, năng lực của CHÍNH agent-type,
không phải danh sách ID bên ngoài) nhưng nối nó vào dispatch runtime
thật (D21/D22 mở rộng `dispatch.mjs`) — kết quả là một mô hình khác cả 2
tiền lệ: đúng SHAPE của marketing-cockpit + đúng CƠ CHẾ runtime-wired mà
tsk-2t9c đã xây.

**Cố ý CHƯA XÂY (D15):** liệu ranh giới stage-đổi-persona-ngầm (cùng
role, persona mặc định khác, không có handoff tường minh) có nên
cũng làm driving dừng — chưa có bằng chứng persona đa dạng thật để thiết
kế theo, cùng kỷ luật grow-tasks-before-roles giữ `roleGraph` đóng ở 5
role (D10 tsk-2t9c). (Round 19, D22: câu hỏi này giờ có câu trả lời CƠ
CHẾ sẵn — diagram trên đã tự nhiên trả lời "có" nếu `ELIG` trả về "không
khớp" — chỉ còn thiếu DỮ LIỆU thật để quan sát, không thiếu thiết kế.)

### Ý tưởng học từ marketing-cockpit — CHƯA XÂY, ghi nhận để không quên (round 17)

So sánh field-by-field 33 workflow file thật của marketing-cockpit (round
17) — hầu hết field KHÔNG đáng học (đã có tương đương tốt hơn hoặc đã
chủ đích bỏ từ tsk-2t9c, xem D18/D19's ghi chú). Nhưng 2 ý CÓ giá trị,
CHƯA có tương đương trong fgOS hôm nay, cố ý CHƯA xây (giống tinh thần
"treo có chủ đích" §VI của chính tsk-2t9c):

- **Escalation-threshold cho collaboration interaction.** Ví dụ thật của
  người dùng: 1 interaction (vd `review`) thất bại N lần liên tiếp →
  TỰ ĐỘNG (nhưng KHÔNG bắt buộc) escalate sang `advise`/human, thay vì
  lặp vô hạn hoặc để agent tự judge mỗi lần. Chỗ đặt tự nhiên khi xây:
  thêm 1 cột/field vào bảng Collaboration của task-spec (D6/D10 tsk-2t9c
  đã có bảng trigger→call, đây chỉ thêm 1 field `retry-threshold` cho
  1 row). `callstackCap` hiện có (roleGraph) KHÔNG phải cái này — đó là
  giới hạn ĐỘ SÂU lồng call, không phải đếm số lần LẶP LẠI cùng 1
  interaction.
- **`emits`/`listens_for` (signal bus) cho việc điều phối xuyên
  workflow/domain.** Đã là "treo có chủ đích" của chính tsk-2t9c (§VI
  #3: "hoãn tới fan-out use-case thật"). Ghi nhận LẠI Ở ĐÂY (không phải
  chỉ 1 dòng trong file cũ của họ) vì người dùng muốn có nơi bền để nhớ
  — khi domain thứ hai (marketing) thật sự cần điều phối chéo domain,
  đây là chỗ quay lại đọc trước khi tự nghĩ lại từ đầu.

Cả 2 mục này KHÔNG phải task trong §7 — chưa đủ bằng chứng/nhu cầu thật
để thiết kế cụ thể, chỉ ghi nhận vị trí sẽ đặt khi thời điểm tới.

## 7. Danh mục hạng mục / task {#tasks}

### {#task-domain-registry-split} Tách `DOMAINS` registry thành aggregator + per-domain file

- **Mục tiêu (cập nhật round 16, D17 — gộp task-3 vào đây):** tách
  `codingDomain` — object thật hôm nay có 10+ field
  (`stages`/`stepMap`/`transitions`/`skillMap`/`taskSpecMap`/
  `worktreeBacked`/`statusLabels`/`parkReason`/`classification`/
  `roleGraph` + `workflows`/`defaultWorkflow`/`workflowFor`) ra
  `domains/coding/registry.mjs` NGUYÊN VẸN, không cắt bớt field nào;
  `workflow-stage-graphs.mjs` chỉ còn quét `domains/*/registry.mjs` để
  build `DOMAINS`, giữ nguyên `synthetic`/`triage`/`fixture-marketing`
  (fixture, ở lại core). **CÙNG MỘT LƯỢT** (không tách task riêng nữa),
  xoá luôn 2 điểm đọc property phẳng còn sót — đây là TOÀN BỘ danh sách
  thật, đã scout chính xác, không phải suy đoán:
  1. `src/state/stage-fsm.mjs:94` — `domain.transitions.some((edge) =>
     edge.from === from && edge.to === to)` → đổi sang đọc qua
     `resolveWorkflow(domain, item.kind).transitions`.
  2. `src/intake/plan.mjs:519` VÀ `src/runner/loop.mjs:1297` — CÙNG một
     dòng bị trùng lặp ở 2 file: `domain.stages?.includes('decompose')
     && planningStage !== 'decompose' ? 'decompose' : undefined` → đổi
     cả 2 chỗ sang đọc qua `resolveWorkflow(domain, item.kind).stages`.
  Sau khi xong, KHÔNG còn consumer nào đọc `codingDomain.stages`/
  `.transitions` trực tiếp — chỉ còn đúng 1 đường đọc
  (`resolveWorkflow`), property phẳng cũ trở thành thừa (có thể xoá
  hẳn khỏi `codingDomain`'s public shape ở một bước sau, ngoài scope
  discussion này).
- **★ GATE cũ (round 12) NAY ĐÃ MOOT, không cần verify nữa (D17):**
  gate gốc hỏi "dynamic import có giữ identity `workflows.feature.stages
  === codingDomain.stages` không" — câu hỏi đó chỉ có ý nghĩa khi CÓ 2
  đường đọc cùng tồn tại. Sau khi xoá 2 điểm đọc phẳng ở trên, chỉ còn 1
  đường đọc duy nhất (`resolveWorkflow`) — không có gì để so sánh phân
  kỳ nữa, nên không cần test identity riêng.
- **§6 excerpt áp dụng:** khối `workflow` trong diagram + quy tắc
  aggregator D4.
- **D-ID áp dụng:** D3, D4, D10, D17.
- **Quan hệ:** nên làm TRƯỚC code bugfix-workflow (D10) — độc lập với
  task skill-migration bên dưới, có thể làm song song. KHÔNG còn task-3
  riêng — đã gộp vào đây (D17).
- **Verify nháp:** `test/state/domain-fields.test.mjs`,
  `test/e2e/fixture-marketing-domain.test.mjs`, mọi test đụng `DOMAINS`
  export vẫn xanh không đổi; test hiện có của `stage-fsm.mjs` (module
  test dày đặc nhất repo) không hồi quy sau khi đổi dòng 94; test mới:
  đăng ký 1 workflow thứ hai giả lập, xác nhận `stage-fsm.mjs`/
  `plan.mjs`/`loop.mjs` chọn đúng graph theo `resolveWorkflow(item)`
  thay vì mặc định `domain.transitions`/`domain.stages`; test cho
  `taskSpecMap`/`roleGraph` (test hiện có của tsk-2t9c) không hồi quy.

### {#task-coding-skill-migration} Di dời 8 skill `fgos-coding-*` vào `domains/coding/skills/`, 7 skill còn lại vào `core/skills/`

- **Mục tiêu:** hiện thực D3+D7 cho tầng skill — di dời
  `fgos-coding-{discovering,exploring,planning,validating,implement,
  shaping,driving,compounding}` từ `.agents/skills/` sang
  `domains/coding/skills/`; 7 skill domain-agnostic còn lại
  (`fgos-routing`, `fgos-clarifying`, `fgos-researching`, `fgos-unlock`,
  `fgos-fanout`, `fgos-indexing`, `distill`) sang `core/skills/`. Hai nơi
  này trở thành nguồn canonical AUTHORING mới (D7) — `.agents/skills/`
  không còn là nơi sửa tay.
- **§6 excerpt áp dụng:** khối `skill` trong cả CORE và CODING subgraph.
- **D-ID áp dụng:** D3, D7.
- **Quan hệ:** phụ thuộc task {#task-skill-assembly-mechanism} tồn tại
  trước (hoặc song song) — nếu di dời trước khi assembly-step sẵn sàng,
  `.agents/skills/` (và mọi thứ generate từ nó) sẽ trống cho tới khi cơ
  chế mới chạy.
- **Verify nháp:** mọi `/fgOS:*` slash-command action step vẫn resolve
  đúng skill sau khi đổi path; golden-file/snapshot test cho wrapper
  pointer nếu có.

### {#task-skill-assembly-mechanism} Thêm bước assembly vào `skill-wrappers.mjs`/`build-skill-wrappers.mjs`

- **Mục tiêu:** hiện thực D7 — `skill-wrappers.mjs` (và
  `scripts/build-skill-wrappers.mjs`) hiện đọc trực tiếp
  `.agents/skills/*` để sinh wrapper; thêm bước MỚI đứng trước: lắp ráp
  `.agents/skills/*` từ `core/skills/*` + `domains/*/skills/*` (copy hoặc
  symlink), rồi mới chạy generate-wrapper như cũ. `materializeSkillsIntoProject`
  (vendor vào external project) phải chạy SAU bước lắp ráp, không đổi gì
  ở phía external project nhận được.
- **§6 excerpt áp dụng:** dòng `.agents/skills/` trong ASCII tree — "★ D7
  — render target ... chỉ nguồn sinh ra nó đổi".
- **D-ID áp dụng:** D7.
- **Quan hệ:** phải xong TRƯỚC hoặc CÙNG lúc với task di dời skill ở
  trên, nếu không `.agents/skills/` sẽ mồ côi giữa chừng.
- **Verify nháp:** test coexistence/setup hiện có
  (`test/e2e/coexistence-canary.test.mjs` và tương đương cho
  `materializeSkillsIntoProject`) phải xanh KHÔNG ĐỔI — bằng chứng hình
  dạng external-project-facing không đổi; thêm test mới cho riêng bước
  assembly (input `core/skills/`+`domains/*/skills/` → output
  `.agents/skills/` đúng nội dung mong đợi).

### {#task-domain-specs-folder} Tạo `domains/coding/specs/` + `domains/marketing/specs/` rỗng

- **Mục tiêu:** hiện thực D8 (bản sửa) — CHỈ tạo thư mục
  `domains/coding/specs/` và `domains/marketing/specs/`, rỗng, làm chỗ
  chờ khi domain đó có task-spec riêng (BA-grade, hợp đồng field
  work-item của domain đó) cần viết ra. `docs/specs/` KHÔNG đụng tới —
  12 file hiện có (work-state, runner, distribution, ...) giữ nguyên
  chỗ, không phải một phần scope của item này.
- **§6 excerpt áp dụng:** dòng `specs/` trong `domains/coding/` và
  `domains/marketing/` của ASCII tree.
- **D-ID áp dụng:** D8.
- **Quan hệ:** độc lập, không phụ thuộc task nào khác — chỉ là tạo thư
  mục trống, không di dời/sửa file có sẵn nào.
- **Verify nháp:** `git status` sau khi tạo chỉ hiện thư mục mới (rỗng,
  hoặc `.gitkeep` nếu cần), không có file `docs/specs/*` nào bị đổi.

### ~~{#task-dispatcher-workflow-aware}~~ — ĐÃ GỘP vào {#task-domain-registry-split} (D17, round 16)

Giữ anchor cũ làm lịch sử. Nội dung thật (danh sách 2 điểm đọc phẳng cần
sửa, lý do, verify) nay nằm trong task-1 ở trên — làm 1 lượt thay vì 2
lượt riêng, để chỉ đụng `stage-fsm.mjs` (module test dày đặc nhất repo)
đúng 1 lần.

### {#task-taskspec-path-resolver} Thêm `resolveTaskSpecPath(domain, specId)`, sửa `registrations.mjs` gọi qua hàm này

- **Mục tiêu:** hiện thực D11 — thêm hàm resolver mới vào
  `workflow-stage-graphs.mjs` (cùng chỗ 13 hàm hiện có), trả về path thật
  của 1 task-spec theo domain (`domains/<domain>/task-specs/<specId>.md`
  sau D9, không phải `docs/task-specs/<domain>/...` cũ); sửa 2 chỗ trong
  `registrations.mjs` (dòng 407, 424) đang tự ghép `path.join` thô để gọi
  hàm này thay vì hardcode.
- **§6 excerpt áp dụng:** không có sẵn — cần bổ sung vào §6 khi diagram
  regenerate lần tới (dòng resolver-function trong khối `workflow`).
- **D-ID áp dụng:** D11.
- **Quan hệ:** phụ thuộc task {#task-domain-registry-split} (vị trí
  `domains/<domain>/task-specs/` phải tồn tại thật trước khi resolver có
  gì để trỏ tới) và D9 (định nghĩa đích path).
- **Verify nháp:** 2 doctor check hiện có của tsk-2t9c
  (`task-specs-resolve`, `agent-claims-resolve`) vẫn PASS sau khi đổi path
  — đây là bằng chứng resolver đúng, không chỉ code compile được.

### {#task-architecture-manifest-domain-silo} Mở rộng `architecture-manifest.json` + `architecture.test.mjs` thêm rule domain-siloing

- **Mục tiêu:** hiện thực D12 — thêm 1 rule mới bên cạnh rule
  one-directional-layer đã có: file trong `core/` không được import từ
  bất kỳ `domains/<name>/` cụ thể nào; file trong `domains/<name>/` không
  được import từ `domains/<other>/`. Mọi giao tiếp cross-domain phải qua
  hàm resolver của core (D11) hoặc qua data (`work.domain`/`DOMAINS`), không
  bao giờ import thẳng file của domain khác.
- **§6 excerpt áp dụng:** không có sẵn — cần bổ sung vào §6.
- **D-ID áp dụng:** D12.
- **Quan hệ:** nên làm SAU khi `domains/` thật sự tồn tại (task 1+2) —
  rule domain-siloing không có gì để kiểm nếu chưa có domain thứ hai
  hoặc chưa tách folder.
- **Verify nháp:** thêm 1 fixture-import cố tình vi phạm rule (domain A
  import domain B), xác nhận `architecture.test.mjs` đỏ đúng lỗi mới;
  suite hiện có (5 layer cũ) không hồi quy.

### {#task-bundle-for-stage} Thêm `bundleForStage(domain, stage)`, sửa skill bỏ hardcode task-spec path

- **Mục tiêu:** hiện thực D14 — thêm hàm resolver mới vào
  `workflow-stage-graphs.mjs` (cùng chỗ 13 hàm hiện có), trả `{skill,
  taskSpec}` cùng lúc từ `skillMap`/`taskSpecMap` (đã cùng object, cùng
  key stage). `fgos-<domain>-driving` gọi hàm này MỘT LẦN mỗi
  stage-entry, hand cả 2 xuống session đang active. Sửa `fgos-coding-
  implement`'s SKILL.md (dòng 88/177/291) bỏ literal path hardcode, thay
  bằng tham chiếu tới bundle đã resolve.
- **§6 excerpt áp dụng:** khối tầng DRIVING trong diagram dispatch mới.
- **D-ID áp dụng:** D14.
- **Quan hệ:** phụ thuộc task {#task-domain-registry-split} (registry
  đã tách) và D9 (task-spec đã ở `domains/coding/task-specs/`).
- **Verify nháp:** test mới cho `bundleForStage` (input domain+stage →
  output {skill, taskSpec} đúng); grep `docs/task-specs/coding/`/
  `domains/coding/task-specs/` literal citations trong mọi SKILL.md phải
  về 0 sau khi sửa (trừ nơi cố ý còn giữ làm tài liệu).

### {#task-persona-key-extension} Mở rộng persona/agent-type resolution key thành `(domain, stage, role)`

- **Mục tiêu:** hiện thực D15 — nơi nào đang/sẽ resolve agent-type cho
  một `(role, task-spec)` work-order (layer DISPATCH, `src/runner/
  dispatch.mjs` + tương lai `claims`-matching) nhận thêm tham số `stage`
  vào key tra cứu, không chỉ `domain`+`role`. Hôm nay là no-op (1
  persona chung mọi stage) — chỉ cần đúng SHAPE của key, chưa cần dữ
  liệu persona đa dạng thật.
- **§6 excerpt áp dụng:** khối tầng DISPATCH trong diagram dispatch mới.
- **D-ID áp dụng:** D15.
- **Quan hệ:** độc lập, có thể làm bất cứ lúc nào — không phụ thuộc
  task nào khác, vì hôm nay không đổi hành vi.
- **Verify nháp:** test xác nhận key cũ `(domain, role)` vẫn resolve
  đúng qua wrapper mới (không hồi quy); KHÔNG cần test cho đa dạng
  persona thật — đó là phần cố ý chưa xây (D15's "chờ bằng chứng").

### {#task-eligibility-inversion} Đảo hướng eligibility: `agents/*.yaml` claims→skills, task-spec thêm assignable-to/requires-skill

- **Mục tiêu:** hiện thực D20/D21 — đảo hướng khai báo eligibility ở
  đúng 4 điểm chạm code thật đã scout (round 18-19, không phải suy
  đoán):
  1. Schema `agents/<name>.yaml`: bỏ field `claims: [task-spec-ids]`
     (optional, tsk-2t9c D12); thêm field `skills: [...]` MỚI (list
     năng lực của chính agent-type, cùng tinh thần `role`/`persona` đã
     có, không phải danh sách ID bên ngoài).
  2. `scripts/project-agents.mjs`: `validateDefinition` (dòng 120-125)
     đổi validate `claims` → validate `skills` (cùng kỷ luật shape:
     list string không rỗng, giống `tool-scope`); `projectAgentMarkdown`
     (dòng 137-147) đổi chép `claims` → chép `skills` vào frontmatter
     `.claude/agents/<name>.md`.
  3. Schema task-spec (`docs/task-specs/<domain>/*.md`, hoặc
     `domains/<domain>/task-specs/*.md` nếu task-domain-registry-split
     +D9 đã xong trước): thêm field `assignable-to: [...]` (optional,
     ghim cứng tên agent cụ thể) và/hoặc `requires-skill: [...]` vào
     dòng header 1-dòng hiện có (`domain: coding | stage: executing |
     position: implementer`, ví dụ `implement-item.md:3` — cũng là
     chỗ cần sweep `position`→`role` theo D16, cùng lượt).
  4. `src/setup/registrations.mjs`: `checkAgentClaimsResolve`/
     `extractClaimsFromYamlText`/`allTaskSpecIds` (dòng 419-503, doctor
     check `agent-claims-resolve`) đổi hướng resolve — kiểm mọi
     `requires-skill` của task-spec có ÍT NHẤT 1 agent-type nào đó
     `skills` khớp, và mọi `assignable-to` trỏ tới agent-type có thật
     (tên check gợi ý đổi thành `task-spec-eligibility-resolve` hoặc
     tương đương, để phản ánh đúng hướng resolve mới).
  5. `src/runner/dispatch.mjs`: mở rộng (D21) để `agentType` trong
     `buildAgentTypeExecutor` resolve qua skill-match thay vì đọc
     `claims` tĩnh — điểm chạm DISPATCH thật của toàn bộ đảo hướng này.
- **§6 excerpt áp dụng:** subsection "Eligibility declaration — đảo
  hướng (D20/D21, round 19)" + mermaid so sánh cũ/mới trong khối đó.
- **D-ID áp dụng:** D20, D21, D22 (D22: phép khớp `requires-skill` phải
  áp dụng cho task-spec CHÍNH của stage — không chỉ task-spec của dòng
  Collaboration — để stage-entry dispatch thật sự quan sát được).
- **Quan hệ:** độc lập với {#task-domain-registry-split} (không đụng
  `codingDomain`/`registry.mjs`) — có thể làm song song; NẾU
  task-domain-registry-split + D9 (di dời `docs/task-specs/coding/` →
  `domains/coding/task-specs/`) đã xong trước, bước 3 sửa file ở vị trí
  mới thay vì `docs/task-specs/coding/`.
- **Verify nháp:** `test/scripts/project-agents.test.mjs` (test hiện có
  cho `validateDefinition`/`projectAgentMarkdown`) cập nhật cho `skills`
  thay `claims`, vẫn xanh; `test/setup/checks.test.mjs` cập nhật cho
  doctor check đổi hướng; grep `claims:` trong mọi `agents/*.yaml` phải
  về 0 sau khi sửa; `fgos doctor` chạy sạch trên repo thật (không còn
  agent-type nào rơi vào "không đủ điều kiện" ngoài ý muốn so với hành
  vi `claims` cũ — cần 1 bước đối chiếu thủ công trước khi xoá `claims`
  hẳn, vì đây là đảo ngược hành vi đã ship, không phải thêm mới thuần
  tuý).

**Việc CHƯA đủ hình dạng để thành task riêng:** knowledge/doctrine
domain-scoped (câu hỏi mở #15, §3 — round 19 đề xuất đánh dấu "cố ý
CHƯA XÂY", chờ xác nhận, xem §6), ranh giới stage-đổi-persona-ngầm có
nên dừng driving (D15's phần cố ý chưa xây), `agents/*.yaml`→
`.claude/agents/*.md` render-pair placement — round 19 đề xuất GIỮ
NGUYÊN top-level `agents/` (xem §6), chờ người xác nhận trước khi khoá
D-ID và coi là "đã có hình dạng".
