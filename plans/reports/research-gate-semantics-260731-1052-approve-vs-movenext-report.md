# Research Report: Tách nghĩa GATE (approve-kết-quả) khỏi move-next (tsk-19j)

Ngày nghiên cứu: 2026-07-31. Item: tsk-19j.

## ⚠️⚠️ KẾT LUẬN CUỐI (round 9) — đọc CONTEXT.md, không phải report này, để lấy quyết định thật

Sau nhiều vòng thảo luận (bao gồm phản biện qua lại thật sự, không phải
đồng thuận vội), kết luận cuối là **D9 + D10**:

- **D9**: 1 skill "driver" dùng chung, nhận `id` + `ceiling`
  (stage-name hoặc status-đích), lặp qua nhiều stage cho 1 item tới khi
  chạm ceiling — `cook`/`pick`/discover-loop/planning-loop/execution-loop
  (herdr-plugin) ĐỀU LÀ driver này, chỉ khác nguồn `id` và giá trị `ceiling`.
  Không phải verb rời (D4, bỏ), không phải ceiling-trên-item (bị bác), không
  phải cook-specific flag (D8, bỏ).
- **D10**: driver này CHỈ được khẳng định đúng cho domain `coding` thật đang
  chạy — KHÔNG khẳng định tự động tổng quát cho domain tương lai (chưa có
  domain thứ 2 thật để kiểm chứng — FSM mới là tầng thật sự universal, driver
  chỉ universal trong phạm vi 1 loại work).

Toàn bộ D1-D10 + chi tiết cơ chế + bảng map 5 loop + câu hỏi mở còn lại nằm ở
`docs/history/gate-approve-vs-movenext-semantics/CONTEXT.md` — đó là nguồn
THẬT, cập nhật mới nhất. Report này (bên dưới) là nhật ký quá trình (round
1-5), giữ nguyên để đối chiếu, KHÔNG sửa lại.

## ⚠️ Round 5 update — đọc trước: phần lớn root cause round-3 đã được fix bởi task khác (done)

`tsk-ozl` + `tsk-2b0` (cả 2 done, phát hiện qua nhánh `tsk-4y5`) đã:

- Tách verb `fgos discover` (clarify-only)/`fgos plan` (decompose-only),
  hard-split, không dispatch theo stage nữa.
- Fix ĐÚNG bug round-3 (`resolveDiscovery` mù với CONTEXT.md): giờ có
  **trust signal content-based** — CONTEXT.md tồn tại+non-empty → bỏ qua
  LLM, `moveStage` thẳng. Áp dụng cả sync verb lẫn automated sweep.

**Nhưng tsk-ozl's CONTEXT.md tự nhận 3 gap chưa đóng — đây mới là scope thật
còn lại của tsk-19j:** (1) bản ghi approve TƯỜNG MINH vẫn thiếu (content-trust
là cơ học, khác "người đã nói có"), (2) verify vẫn là `FALLBACK_VERIFY`
placeholder khi skip-and-advance chạy, (3) decompose-side (`resolveDecompose`)
KHÔNG có skip-and-advance tương tự — vẫn luôn gọi LLM.

Toàn bộ D1-D6 bên dưới (round 1-4) giữ nguyên làm lịch sử/bằng chứng, nhưng
**D4/D5/D6 đã bị rút lại** (không cần verb/skill/ceiling-signal mới) —
thay bằng **D7/D8** trong CONTEXT.md
(`docs/history/gate-approve-vs-movenext-semantics/CONTEXT.md`, nguồn đầy đủ
và cập nhật nhất — đọc file đó trước khi bắt tay `fgos-coding-planning`, report này
giữ nguyên làm nhật ký quá trình, không sửa lại các round cũ).

## Executive Summary

Đề xuất của tsk-19j — tách "duyệt kết quả bước hiện tại" (ghi nhận, persist) ra
khỏi "có đi tiếp bước sau hay không" (cơ chế cơ học, environment-dependent) —
khớp với pattern đã chuẩn hoá ở cả hai nơi: workflow engine (Temporal HITL,
agentic-pattern "propose vs commit") và CI/CD (GitHub/GitLab/Azure DevOps
environment approval gates). Cả hai đều tách rõ: (1) approval là bản ghi bền,
độc lập audit trail; (2) tiếp tục pipeline là bước riêng đọc lại approval đó,
hành vi khác nhau tuỳ policy/environment.

Soi code fgOS hiện tại (`bin/fgos.mjs`, `src/intake/discovery.mjs`,
`.claude/skills/fgos-coding-exploring|planning|routing/SKILL.md`) cho thấy: fgOS **đã
làm đúng một nửa** — skill-embedded Gate (approve CONTEXT.md/plan.md) không tự
áp move (`fgos-routing` D8: "stage transitions are always the engine's own
machine judgment, never applied by this skill"). Nhưng nửa còn lại — ghi nhận
bền cho **approve thủ công** (không qua bypass) — **không tồn tại**: chỉ
nhánh auto-approve gọi `fgos decision`, nhánh người tự tay approve thì không
ghi gì cả. Và cơ chế move thật (`resolveDiscovery`/`resolveDecompose`, gọi qua
`fgos discover`) **conflate phán-xét (judge) với áp-dụng (move) trong cùng một
lệnh, không tách được, không có tham số environment/mode** — đúng cái user mô
tả là vấn đề.

**Finding sâu nhất (round 3), có bằng chứng dòng code trực tiếp, không suy
đoán:** `judgeDiscovery`/`buildDiscoveryPrompt` (`src/intake/discovery.mjs`)
**không bao giờ đọc CONTEXT.md** — không import `fs`/`path`, không có hàm
`readLockedContext` như `decompose.mjs` đã có sẵn cho `judgeDecompose`. Nghĩa
là dù người approve CONTEXT.md đàng hoàng, engine gọi `fgos discover` vẫn
**tự phán lại từ đầu, chỉ dựa description gốc**, hoàn toàn không biết
CONTEXT.md/approval đó tồn tại. Đây là root cause CỤ THỂ hơn hẳn "conflate
judge+move" ở round 1 — vá ghi-nhận-approve (#3) mà không dạy
`resolveDiscovery` đọc lại tín hiệu đó thì bản ghi chỉ nằm làm audit trail
chết, không đổi hành vi move-next. Chi tiết + hướng vá tối thiểu (có tiền lệ
sẵn trong `decompose.mjs`, không phải kiến trúc mới) ở phần "Đào sâu round 3"
bên dưới.

## Research Methodology

- Nguồn: đọc trực tiếp source code + skill docs trong repo (không giới hạn số
  lần đọc — đây là research nội bộ, không phải web).
- External: 3 WebSearch calls (giới hạn theo skill: tối đa 5).
- Search terms: "human-in-the-loop workflow approval state transition 2025",
  "CI/CD manual approval gate record decision", "state machine guard condition
  vs transition action".

## Key Findings

### 1. Hiện trạng code fgOS — 2 tầng "gate" khác nhau, dễ nhầm

Repo có **hai cơ chế khác tên nhưng đều gọi là "gate"**:

- **`awaiting-human` gate** (`fgos ask`/`fgos answer`, `view.gates[id]` fold ở
  `src/state/replay.mjs:162-191`) — câu hỏi/trả lời khi cần người quyết một
  điều cụ thể giữa chừng. Đã có ghi nhận bền (`ask`, `answer`,
  `rationale`/`alternatives`/`source`).
- **Skill-embedded confirmation Gate** (`fgos-coding-exploring`/`fgos-coding-planning`'s
  "Approve CONTEXT.md?"/"Approve plan.md?") — đúng đối tượng tsk-19j đang nói
  tới. Cơ chế: `gate-bypass.mjs`'s `canAutoApprove` quyết auto-pass hay hỏi.

### 2. Tách move-next khỏi gate — ĐÃ CÓ một phần, chỉ chưa hoàn chỉnh

`fgos-coding-exploring/SKILL.md` bước 4 (Hand off) nói thẳng: *"Locking decisions
here never decides the item's next edge... this skill never adds one, never
removes one, and never applies the move itself."* `fgos-coding-planning/SKILL.md`
Gate section: *"The mode decision reached in step 2 does not, by itself, move
the item anywhere... the engine is still the only thing that validates and
applies that move."* `fgos-routing/SKILL.md` D8: *"stage transitions are
always the engine's own machine judgment, never applied by this skill or any
other skill in this layer."*

⇒ Nguyên tắc user đề xuất ("gate = duyệt kết quả, move-next = feature cơ học
riêng") **đã là chủ ý thiết kế hiện tại ở tầng skill**. Vấn đề không phải là
thiết kế sai từ đầu — mà là **thực thi chưa trọn** (xem #3, #4).

### 3. Lỗ hổng thật: approve thủ công KHÔNG được ghi nhận

`fgos-coding-exploring/SKILL.md` dòng 174-184, `fgos-coding-planning/SKILL.md` dòng 147-158:

- Nhánh `true` (auto-approve): gọi `fgos decision --text "auto-approved..."`
  → có bản ghi bền, có audit trail (D3).
  ​
- Nhánh `false` (hỏi người): skill hỏi "Approve CONTEXT.md before planning?"
  — nhưng **không có bước nào gọi `fgos decision` hay bất kỳ verb ghi nào sau
  khi người trả lời "có"**. Câu trả lời chỉ tồn tại trong chat, y hệt lỗ hổng
  gate-dialogue-continuity (STR70a, đã biết, `docs/history/gate-dialogue-
  continuity/CONTEXT.md`) — nhưng đây là **một bề mặt khác** (skill-embedded
  Gate, không phải `awaiting-human`), **chưa có item nào track riêng lỗ này**.

⇒ Đây chính là ý "thông tin duyệt cũng cần được ghi nhận" của tsk-19j —
**xác nhận là gap thật, có bằng chứng dòng code cụ thể**, không phải suy đoán.

### 4. move-next thật (`fgos discover`) — conflate judge + move, không tham số hoá theo môi trường

`bin/fgos.mjs:871-884` (`case 'discover'`) gọi thẳng `resolveDiscovery`/
`resolveDecompose`. Trong `src/intake/discovery.mjs:231-271`
(`resolveDiscovery`):

```js
const verdict = judgeDiscovery(work, cfg, view);   // (a) phán xét
addDiscovery(dir, { id, ...verdict });
...
if (verdict.clear) {
  moveStage(dir, { id, to: 'decompose', ... });    // (b) áp dụng move — CÙNG LỆNH
  return { outcome: 'clear', id, verdict };
}
```

Không có cách nào gọi "chỉ judge, ghi lại verdict, không move" rồi sau đó ở
một session/environment khác gọi riêng "move-next nếu đã judge pass" — hai
việc **luôn đi cùng nhau trong một lệnh, một lần gọi**. `resolveDecompose`
(`src/intake/plan.mjs:279+`) cùng pattern.

⇒ Đây là đúng cái user mô tả: "việc có đi qua bước kế tiếp hay không là một
feature cơ học khác, đặt ở cuối tiến trình" — **hiện KHÔNG tách được**, vì
kết quả judge không phải là field bền độc lập mà `discover` có thể đọc lại từ
một lần gọi trước để quyết "move hay không" mà không phán-xét lại.

### 5. External pattern — xác nhận hướng đề xuất là đúng, có tiền lệ

- **Propose vs Commit** (Mastra/agentic-patterns, Temporal HITL 2025-2026):
  tách "đề xuất hành động, lưu vào durable store, trình review" khỏi "commit —
  thực thi thật, có idempotency key + precondition check". Nguyên văn:
  *"the agent should not be the final authority on whether its own proposed
  action is safe"* — tương ứng: gate (duyệt) không nên tự quyết luôn move.
- **CI/CD environment approval gate** (GitHub/GitLab/Azure DevOps): approval
  luôn là **bản ghi bền, tách khỏi pipeline log** — *"approvals recorded as
  annotations on the Application"*, *"machine-generated records tied to
  changes: PR approvals, ... policy decisions (pass/fail)"*. Việc pipeline có
  tiếp tục hay không đọc lại record đó, hành vi phụ thuộc **environment
  protection rule** — đúng ý "tùy môi trường mà move-next hoạt động khác
  nhau" của user.
- **UML state machine — guard condition vs transition action**: guard (điều
  kiện cho phép transition) và action (việc transition làm) là hai khái niệm
  tách bạch theo lý thuyết chuẩn; *"decouple the state machine from
  underlying business logic by creating proper abstractions"*.

Không tìm thấy nguồn nào phản bác hướng tách này — mọi nguồn đều coi tách
approve-record khỏi continue-mechanism là best practice, không phải lựa chọn
tranh cãi.

## So sánh hiện trạng vs đề xuất

| | Hiện trạng fgOS | Đề xuất tsk-19j | Khoảng cách |
|---|---|---|---|
| Gate = duyệt kết quả bước hiện tại | Đúng về Ý ĐỊNH (skill docs nói rõ), nhưng auto-approve mới ghi bền; approve thủ công KHÔNG ghi | Approve nào cũng phải ghi | Cần thêm 1 write-call sau nhánh `false` khi người trả lời có |
| move-next = feature cơ học riêng, cuối tiến trình | Chủ ý thiết kế đúng ở tầng skill (D8), nhưng cơ chế thật (`resolveDiscovery`/`resolveDecompose`) conflate judge+move trong 1 lệnh | Đọc lại 1 gate-đã-duyệt rồi move, không phán-xét lại | `fgos discover` cần tách 2 pha hoặc thêm field bền lưu verdict để đọc lại |
| move-next hành vi khác theo môi trường (plan-only vs full-pipeline) | Không có khái niệm "môi trường" trong move — mọi lần gọi `discover` đều move nếu clear | Environment/mode quyết move có chạy tiếp hay dừng lại ở ghi-nhận | Chưa có cơ chế nào tương đương — cần thiết kế mới, không phải sửa nhỏ |
| auto-approve/auto-pass tách biệt move-next | `gate-bypass.mjs` đã đúng: chỉ quyết "có hỏi hay không", record riêng (`fgos decision`), không tự move | Giống hệt user mô tả | Không có gap — phần này ĐÃ đúng, chỉ cần user biết để khỏi lo |

## Implementation Recommendations

Không tự ý mở rộng scope — đây là báo cáo research cho tsk-19j, còn ở stage
`clarify`. Khuyến nghị hướng cho `fgos-coding-exploring` (khi item này được claim):

1. **Vá lỗ hổng #3 trước, rẻ nhất, không đổi contract**: thêm bước ghi
   `fgos decision --text "CONTEXT.md/plan.md approved (manual)"` ngay sau khi
   người trả lời "có" ở nhánh `false` — cùng khuôn `decision` non-transitioning
   verb đã có sẵn (tiền lệ D5, `docs/specs/work-state.md:647-651`), không mở
   verb mới.
2. **Việc tách judge/move của `resolveDiscovery`/`resolveDecompose` (#4) là
   scope lớn hơn hẳn** — đụng vào cơ chế lõi `fgos discover`, ảnh hưởng mọi
   domain qua `workflow-stage-graphs.mjs`. Nên để `fgos-coding-planning` (không phải
   `fgos-coding-exploring`) đánh giá — đúng ranh giới "implementation/architecture
   thuộc planning, không thuộc exploring" mà chính `fgos-coding-exploring/SKILL.md`
   dòng 27-29 đã tự giới hạn.
3. **Khái niệm "environment/mode quyết move-next"** hoàn toàn chưa có tiền lệ
   trong code (đã rà — không tìm thấy field nào tương đương). Đây là quyết
   định thiết kế mới thật sự, không phải bug — cần `fgos-coding-planning` cân nhắc
   độ lớn (có thể cần tách item con).

## Đào sâu thêm (round 2) — trả lời một phần Q1/Q2 cũ, xác nhận Q3 vẫn mở

### Claim-lock §3a/§3b/§3c — đã có SẴN một trục "môi trường" khác nhau, nhưng KHÔNG liên quan tới việc move có tự chạy hay không

`docs/specs/runner.md:163-171` (claim-release, claim-lock §3b), cùng
`docs/specs/work-state.md:971` (§3a):

- `pick <id>` (§3a) claim một item ở BẤT KỲ stage nào (kể cả `clarify`/
  `decompose`) miễn `status: 'todo'` — không kiểm frontier như `take`. Khi
  claim, status thành `doing`.
- Khi root chuyển `decompose → executing` (bên trong `resolveDecompose`,
  xem round 1), NẾU một claim `pick` đang sống ở `doing` tại thời điểm đó,
  item được **tự động thả về `todo`** (§3b) — để phiên khác (hay cùng phiên)
  `pick <id>` lại, tái dùng CÙNG worktree/branch, cho pha `executing` (§3c).

⇒ Đây **đã** là cơ chế "cùng item, claim lại ở môi trường khác nhau cho pha
khác nhau" — nhưng nó chỉ điều phối **ai giữ session/worktree**, hoàn toàn
KHÔNG điều phối "move có tự chạy hay không". Move (`decompose → executing`)
vẫn LUÔN chạy ngay trong `resolveDecompose`, bất kể có ai đang pick giữ hay
không — release chỉ là dọn dẹp SAU KHI move đã xảy ra, không phải điều
kiện để move xảy ra. Trả lời một phần Q2 cũ: "đóng process" (kịch bản
planning-only) và "claim lại rồi move on" (kịch bản full-pipeline) **không
có tiền lệ code nào tương ứng** — §3b chỉ giải quyết chuyện claim, chưa bao
giờ giải quyết chuyện "có nên move".

### `workflow-stage-graphs.mjs` — edges tĩnh, không có tham số môi trường nào cả

Đọc toàn bộ `src/state/workflow-stage-graphs.mjs` (domain registry `coding`/
`synthetic`): mỗi domain khai báo `stages`, `stepMap`, `transitions` (mảng
`{from, to}` CỐ ĐỊNH), `skillMap`. Không có field nào kiểu `mode`,
`environment`, `autoAdvance`, hay điều kiện runtime nào trên một edge — toàn
bộ là dữ liệu tĩnh đọc một lần lúc khai báo domain.

⇒ Xác nhận chắc chắn (không còn là suy đoán): **không tồn tại bất kỳ hook
điểm nào** trong registry hiện tại để một edge "chờ ai đó bật move-next" thay
vì tự động — muốn có, phải thêm field mới vào domain registry (vd
`transitions[].autoAdvance: boolean` hay tương tự) VÀ dạy `resolveDiscovery`/
`resolveDecompose` đọc field đó trước khi gọi `moveStage`. Đây xác nhận
round 1: **không phải một patch nhỏ, là một quyết định kiến trúc mới thật
sự** — không có phần nào tái dùng được từ registry hiện tại ngoài việc thêm
field lên cùng chỗ.

## Đào sâu thêm (round 3) — finding chính: gate approval và judge thật KHÔNG CÙNG tín hiệu

### 3.1 `judgeDiscovery` KHÔNG BAO GIỜ đọc CONTEXT.md — khác hẳn `judgeDecompose`, đây là bằng chứng, không phải suy đoán

Đối chiếu trực tiếp hai file:

- `src/intake/plan.mjs:36-38` có hàm riêng `readLockedContext(repoRoot,
  docsRef)` — đọc `CONTEXT.md`/`plan.md` thật từ đĩa qua `work.docsRef`.
  `resolveDecompose` (dòng 330-331) gọi nó rồi truyền `lockedContext` vào
  `judgeDecompose` → `buildDecomposePrompt` (dòng 85-88) đưa NGUYÊN VĂN nội
  dung file đó vào prompt LLM.
- `src/intake/discovery.mjs` — **import list (dòng 25-30) không có `fs` hay
  `path`**, không có hàm `readLockedContext` tương đương, và
  `buildDiscoveryPrompt` (dòng 77-151) chỉ ráp từ `work.description`,
  `work.refs`, `work.deps`, `view.gates[id]` (MỘT cặp ask/answer mới nhất,
  không phải lịch sử), và `view.discovery[id]` (lịch sử verdict cũ). **Không
  một dòng nào đọc `work.docsRef` hay nội dung CONTEXT.md.**

⇒ Hệ quả thật, không phải giả thuyết: khi một người chạy `fgos-coding-exploring`
đàng hoàng — scout kỹ, hỏi-đáp Socratic nhiều vòng, viết CONTEXT.md đầy đủ,
được người dùng bấm "Approve CONTEXT.md" — rồi skill gọi `fgos discover <id>`
(theo đúng flow `/fgOS:cook` bước 2 mô tả), thì `resolveDiscovery` bên trong
**phán lại HOÀN TOÀN ĐỘC LẬP**, chỉ dựa vào `description` gốc lúc submit +
MỘT cặp hỏi-đáp gần nhất — **không hề biết CONTEXT.md tồn tại, không hề biết
người vừa duyệt gì**. Công sức Socratic + quyết định đã khoá trong CONTEXT.md
hoàn toàn không ảnh hưởng gì tới việc engine có thật sự cho item rời `clarify`
hay không, hay tới cái `verify` command cuối cùng được gắn khi rời `clarify`
(dòng 198-201: `verify` lấy từ `verdict.verify` — LLM tự đề xuất, không phải
từ CONTEXT.md).

Đây chính là **root cause cụ thể hơn hẳn** cho cả nhánh #3 (approve thủ công
không ghi) lẫn nhánh #4 (judge+move conflate) ở round 1: dù có vá #3 (ghi
`fgos decision` khi người approve) thì bản ghi đó **vẫn không ai đọc lại** —
`resolveDiscovery` không có chỗ nào tra cứu nó trước khi tự phán lại từ đầu.
Vá #3 mà không sửa `discovery.mjs` đọc lại tín hiệu approve thì bản ghi chỉ
nằm đó làm audit trail, không thay đổi hành vi move-next một chút nào —
đúng cái user phàn nàn "chưa làm rõ được gì, chưa kích hoạt quyết định gì".

### 3.2 Sửa khả thi, có tiền lệ SẴN CÓ trong cùng codebase — không phải kiến trúc mới từ số 0

`readLockedContext`/`lockedContext` đã là pattern chạy thật trong
`decompose.mjs`. Vá tối thiểu cho `discovery.mjs`: (a) import `fs`/`path`
giống `decompose.mjs`, (b) copy nguyên `readLockedContext`, (c) truyền
`lockedContext` vào `buildDiscoveryPrompt` giống hệt `buildDecomposePrompt`
đã làm — KHÔNG cần sửa contract `resolveDiscovery`'s call site
(`bin/fgos.mjs:871-884` chỉ gọi `resolveDiscovery(dir, id, cfg, 'session')`,
việc đọc file xảy ra BÊN TRONG hàm, giống `resolveDecompose` đã chứng minh
không đổi chữ ký verb). Đây là fix rẻ, có khuôn mẫu chạy thật để soi, không
phải thiết kế mới.

**Nhưng chỉ đọc CONTEXT.md thôi vẫn chưa "đọc lại approval"** — CONTEXT.md
là văn bản tự do, mô hình vẫn phải tự suy diễn lại "cái này đã được duyệt
chưa" từ prose, không có field boolean nào chắc chắn. Muốn thật sự tắt
việc re-judge khi đã có người approve, cần CẢ HAI: (i) vá #3 (ghi nhận
approve thủ công thành field/record bền, không chỉ audit-trail mờ) VÀ (ii)
dạy `resolveDiscovery` kiểm field đó TRƯỚC KHI gọi `judgeDiscovery` — nếu đã
approve, `moveStage` thẳng, bỏ qua LLM re-judge hoàn toàn (giống cách
`gate-bypass.mjs`'s `canAutoApprove` đã bỏ qua CÂU HỎI của skill-embedded
Gate — cần một cơ chế tương tự nhưng ở tầng engine, bỏ qua JUDGE chứ không
phải bỏ qua câu hỏi).

### 3.3 `/fgOS:cook` — "môi trường" gần nhất đã tồn tại, nhưng ngầm, không phải field khai báo

`plugins/fgOS/skills/cook/SKILL.md` bước 2 cho thấy: **ai gọi `fgos discover
<id>` sau khi Gate được duyệt là do SESSION/SKILL layer chủ động quyết**,
không phải engine tự động. `/fgOS:cook` (môi trường "full-pipeline"): sau khi
người approve CONTEXT.md, TỰ GỌI `fgos discover <id>` ngay trong cùng bước —
tương đương "move-next auto-chạy" user mô tả. Một session chạy
`fgos-coding-exploring` ĐƠN LẺ (không qua cook): skill hand-off cho `fgos-routing`
(dòng 138-147 `fgos-coding-exploring/SKILL.md`), và **không có bước nào tự gọi
`discover`** — người phải tự tay gọi `/fgOS:discover <id>` sau đó (có thể ở
session khác hẳn) — tương đương "chỉ ghi nhận, dừng lại" user mô tả cho môi
trường planning-only.

⇒ Trả lời một phần Q1 (round 2 để mở): "môi trường" **hiện đã tồn tại dưới
dạng ẨN — là SKILL nào đang chạy (`cook` vs standalone `fgos-coding-exploring`)**,
không phải field cấu hình tường minh nào trên item/registry. Cook luôn move;
standalone luôn dừng, chờ tay. Đây là bằng chứng thật cho hướng thiết kế
(field tường minh hoá thứ đã tồn tại ngầm), không phải bịa từ đầu — nhưng
cũng lộ rủi ro: **hành vi phụ thuộc skill nào người gọi**, chưa phải thuộc
tính của chính item hay engine, nên hai skill có thể lệch nhau nếu chỉ một
bên được cập nhật.

## Round 4 — Tổng hợp + thảo luận giải pháp, quyết định đã khoá

Sau 3 vòng đào, đã tổng hợp thành khung giải pháp 4 phần khớp đúng mô hình
gốc của tsk-19j, thảo luận trực tiếp với user, và khoá quyết định qua
`fgos decision` (xem `view.decisions["tsk-19j"]` — D1-D4 dưới đây là bản tóm,
CONTEXT.md ở `docs/history/gate-approve-vs-movenext-semantics/CONTEXT.md` là
nguồn đầy đủ, đã gắn `docsRef` lên item).

### Khung giải pháp (A/B/C/D)

- **A — Gate ghi nhận duyệt bền:** vá nhánh approve thủ công (hiện không ghi
  gì, chỉ auto-approve mới ghi) bằng field có cấu trúc trong `gates[id]`.
- **B — Move-next đọc lại gate đã duyệt, bỏ judge:** `resolveDiscovery`/
  `resolveDecompose` không tự phán lại nếu gate đã approved — tin thẳng
  người, `verify` phải đến từ chính lúc approve, không phải LLM tự sinh.
- **C — auto-approve/auto-pass (`gate-bypass.mjs`) đã đúng, giữ nguyên,
  không đụng.**
- **D — Môi trường quyết move-next chạy hay dừng:** rút thành 1 primitive
  dùng chung (verb/skill `move-next` mới) thay vì field per-domain trên
  registry — current-stage skill chỉ gọi "move-next", không cần biết bước
  sau là gì; primitive tự đọc gate-approved (A/B) + tín hiệu môi trường để
  tự quyết dừng hay áp dụng transition đã đăng ký sẵn.

### Quyết định đã khoá (D1-D4, qua `fgos decision`)

| ID | Quyết định | Vì sao |
|---|---|---|
| D1 | Approve record = field có cấu trúc trong `gates[id]` (không chỉ text trong decision log) | Tra nhanh, không phải parse text giòn; cùng khuôn `ask`/`answer`/`statusAtAsk` đã có |
| D2 | Scope = làm trọn A+B+D trong 1 plan qua `fgos-coding-planning`, không chỉ vá nhỏ round-1 | User chọn tường minh, ưu tiên nhìn trọn trước khi code |
| D3 | Đã approved → bỏ HẲN LLM judge; `verify` phải do exploring/planning tự đề xuất lúc approve | User chọn "bỏ hẳn LLM" thay vì "vẫn gọi LLM chỉ để lấy verify" |
| D4 | Move-next = primitive dùng chung mới (verb/skill), KHÔNG sửa `workflow-stage-graphs.mjs` | Khớp finding round 3 (cook vs standalone lệch nhau); tránh rủi ro sửa registry dùng chung mọi domain |
| D5 | Ceiling = TÊN STAGE tuyệt đối (`FGOS_MOVE_NEXT_CEILING=<stage>`, so rank qua `domain.stages` có sẵn), thay hẳn mô hình continue/stop nhị phân | Validate bằng `/fgOS:discover` (đã là ceiling="1 bước") vs `/fgOS:cook` (ceiling="hết mức") — cùng 1 tham số. Số bước tương đối bị loại: cook đã hardcode tên stage rồi (không domain-portable thật), và có cạnh nhảy thẳng clarify→executing khiến "số bước" không ổn định |
| D6 | `move-next` chỉ áp đúng 1 transition/lần gọi — vòng lặp tới ceiling do session/skill đang chạy tự làm (cook's Drain-the-queue có sẵn) | Khớp `fgos-routing` D8 (verb chỉ áp transition, không routing) — tránh trùng logic |

### Câu hỏi mở, giao lại `fgos-coding-planning` (chi tiết đầy đủ trong CONTEXT.md §3)

- **Q-approve-field-shape:** field D1 là object hay 2 field rời
  (`contextApproved`/`planApproved`)? Có cần phân biệt actor (người vs
  bypass) hay chỉ dùng cho nhánh thủ công (bypass đã có record riêng)?
- **Q-skip-judge-blast-radius:** automated runner sweep
  (`docs/specs/runner.md:96-136`, clarify/decompose-sweep) gọi CÙNG
  `resolveDiscovery`/`resolveDecompose` cho MỌI item `todo` ở đúng stage,
  KHÔNG qua gate approve nào — D3 (bỏ judge khi approved) chỉ áp dụng nhánh
  có field D1; sweep vẫn phải judge bình thường khi field vắng mặt.
  `fgos-coding-planning` cần xác nhận 2 nhánh không lẫn nhau.
- **Q-verb-call-sites:** 5 chỗ gọi cần sửa đồng bộ theo D4 — 4 stage-skill
  (`fgos-coding-exploring`/`planning`/`validating`/`executing`) + `/fgOS:cook` bước
  2. `fgos-coding-validating`/`fgos-coding-implement` chưa được scout trong research này —
  cần đọc trước khi shape plan.

## Unresolved Questions (round 1-3, giữ nguyên để đối chiếu)

1. "Môi trường" trong đề xuất user cụ thể là gì trong fgOS thật — session
   Claude Code loại nào (`fgos take` vs `fgos pick`?), hay là `--dir`/worktree
   khác nhau, hay là config field mới? **Vẫn mở** — round 2 xác nhận claim-lock
   §3a/§3b/§3c (pick/release/re-pick) là trục "ai giữ session" gần nhất hiện
   có, nhưng nó KHÔNG mang nghĩa "môi trường quyết move" — không thể tái dùng — session
   Claude Code loại nào (`fgos take` vs `fgos pick`?), hay là `--dir`/worktree
   khác nhau, hay là config field mới? **Vẫn mở** — round 2 xác nhận claim-lock
   §3a/§3b/§3c (pick/release/re-pick) là trục "ai giữ session" gần nhất hiện
   có, nhưng nó KHÔNG mang nghĩa "môi trường quyết move" — không thể tái dùng
   thẳng, chỉ là tham khảo gần nhất. Chưa đủ để `fgos-coding-planning` thiết kế field
   cụ thể.
2. ~~Khi move-next "chỉ ghi nhận... đóng process" — "đóng process" nghĩa là
   gì với claim-lock §3b?~~ **Đã trả lời một phần (round 2):** §3b hiện chỉ
   release claim SAU KHI move đã xảy ra — không có khái niệm "move bị hoãn,
   giữ nguyên `doing` chờ môi trường khác quyết move". Câu hỏi còn lại thu hẹp
   thành: nếu thêm `autoAdvance`-kiểu field, item ở trạng thái "đã duyệt nhưng
   chưa move" nên giữ `status: doing` (ai đó đang cầm) hay thả về `todo` ngay
   (frontier vẫn thấy được nhưng chưa quaed)? Đây là quyết định mới, không
   phải suy ra từ §3b hiện tại.
3. Có nên giữ một verdict/judge cache (bền) để lần `discover` sau đọc lại
   thay vì phán xét lại từ đầu — hay luôn phán xét lại nhưng chỉ áp dụng
   move nếu đủ điều kiện môi trường? **Vẫn mở, round 2 không đụng tới** — hai
   lựa chọn có chi phí LLM-call và rủi ro stale-verdict khác nhau, chưa có
   bằng chứng đo được cái nào đáng. Lưu ý: `view.discovery["<id>"]` (array
   verdict, đọc qua `fgos list`) đã là kho bền cho verdict `judgeDiscovery` —
   option "giữ cache" có thể tái dùng field NÀY thay vì thêm field mới, nếu
   `resolveDiscovery` được tách để đọc verdict mới nhất từ đó thay vì luôn
   gọi `judgeDiscovery` lại. Chưa xác minh `judgeDecompose` có kho tương đương
   hay không — cần `fgos-coding-planning` kiểm khi thiết kế.
4. **Mới (round 2):** thêm field kiểu `transitions[].autoAdvance` vào
   `workflow-stage-graphs.mjs` là thay đổi SCHEMA của registry dùng chung cho
   MỌI domain (`coding`, `synthetic`, và domain tương lai) — cần xác nhận có
   phá vỡ `test/architecture.test.mjs`'s "one-way-down import" check hay giả
   định nào khác đang test riêng registry này hay không trước khi
   `fgos-coding-planning` chốt shape field.
5. **Mới (round 3), câu hỏi thiết kế cụ thể cần `fgos-coding-planning` chốt:** khi
   dạy `resolveDiscovery` bỏ qua `judgeDiscovery` nếu đã có approve ghi nhận
   (fix 3.2) — bỏ qua HOÀN TOÀN (chỉ `moveStage`, không gọi LLM, không có
   `verify` do model đề xuất — vậy `verify` lấy từ đâu, CONTEXT.md không có
   field verify riêng biệt dễ trích) hay vẫn gọi `judgeDiscovery` nhưng TRUYỀN
   THÊM tín hiệu "đã approve" vào prompt để nó tự tin hơn (rẻ hơn về logic,
   nhưng vẫn tốn một lời gọi LLM mỗi lần, và vẫn có thể judge unclear dù người
   đã approve — mâu thuẫn ngược lại)? Round 3 không đủ bằng chứng để chọn,
   cả hai đều có tiền lệ một phần (`gate-bypass.mjs` bỏ hẳn câu hỏi = hướng 1;
   `readLockedContext` đưa thêm ngữ cảnh vào prompt = hướng 2).
6. **Mới (round 3):** `/fgOS:cook` và standalone `fgos-coding-exploring` hiện lệch
   hành vi (move-next auto vs thủ công) mà KHÔNG có test nào khoá sự lệch đó
   lại — nếu về sau ai sửa `cook`'s bước 2 mà quên sửa hướng dẫn tương đương
   cho standalone (hay ngược lại), hai "môi trường" trôi xa nhau âm thầm.
   Cần `fgos-coding-planning` cân nhắc: có nên rút hành vi "gọi discover sau approve"
   RA KHỎI riêng `cook`, đưa vào một field/verb chung mà cả hai đường đều gọi
   — đúng tinh thần "move-next là 1 feature cơ học dùng chung" user đề xuất,
   thay vì mỗi skill tự cài logic riêng.

## Sources

- [Human-in-the-Loop Approval Workflows | Temporal](https://temporal.io/blog/human-in-the-loop-approvals)
- [Human-in-the-Loop Approval Framework - Pattern](https://www.agentic-patterns.com/patterns/human-in-loop-approval-framework/)
- [Human-in-the-Loop: Where to Put Approval in Agents and Workflows | Mastra Blog](https://mastra.ai/blog/hitl-where-to-put-approval-in-agents-and-workflows)
- [How to Implement Manual Approval Gates Between Environments in ArgoCD](https://oneuptime.com/blog/post/2026-02-26-argocd-manual-approval-gates/view)
- [CI/CD Approval Gates for Regulated Pipelines | Rutagon](https://rutagon.com/insights/ci-cd-approval-gates-regulated-systems/)
- [Where Do Approval Gates Fit Within a Modern CI/CD Workflow?](https://www.devopstraininginstitute.com/blog/where-do-approval-gates-fit-within-a-modern-cicd-workflow)
- [Guard Condition - an overview | ScienceDirect Topics](https://www.sciencedirect.com/topics/computer-science/guard-condition)
- [State Machine Diagram Deep Dive: Transitions & Guards for Embedded](https://www.archimetric.com/state-machine-diagram-deep-dive-transitions-guards-embedded/)

## Code References

- `bin/fgos.mjs:871-884` (`case 'discover'`)
- `src/intake/discovery.mjs:231-271` (`resolveDiscovery`)
- `src/intake/plan.mjs:279+` (`resolveDecompose`)
- `src/state/gate-bypass.mjs` (`canAutoApprove`, `readGateBypassLevel`)
- `.claude/skills/fgos-coding-exploring/SKILL.md:138-184` (Hand off + Gate)
- `.claude/skills/fgos-coding-planning/SKILL.md:122-165` (Gate)
- `.claude/skills/fgos-routing/SKILL.md:128-138` (D8 precedence)
- `docs/history/gate-dialogue-continuity/CONTEXT.md` (bề mặt `awaiting-human`
  gate khác — KHÔNG cùng bề mặt với tsk-19j, tránh nhầm khi đọc lại)
- `docs/specs/runner.md:163-171` (claim-release §3b, round 2)
- `docs/specs/work-state.md:971` (`pick` §3a, round 2)
- `src/state/workflow-stage-graphs.mjs` (toàn file — domain registry, edges
  tĩnh, không có field môi trường, round 2)
- `src/intake/discovery.mjs:1-30,77-151` (import list + `buildDiscoveryPrompt`
  — KHÔNG đọc CONTEXT.md, round 3, finding chính)
- `src/intake/plan.mjs:36-38,80-88,330-331` (`readLockedContext`,
  `buildDecomposePrompt`, call site — tiền lệ đối chứng, round 3)
- `plugins/fgOS/skills/cook/SKILL.md:57-105` (bước 2 — nơi duy nhất chủ động
  gọi `fgos discover` sau Gate approve, round 3)
