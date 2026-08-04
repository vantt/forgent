# Claim-lock cho clarify/decompose

**Trạng thái:** IMPLEMENTED (2026-07-28). §3a–§3d, §7, và §5.1 (statusAtAsk,
resume-target field) đã code + test. §5.2 (`--via herdr`) đã code. §3e/§6
(session-close threshold, herdr dispatch) vẫn ngoài phạm vi như đã chốt ở §4.

**Files:** `src/state/fsm.mjs` (2 edge mới: `doing->todo`, `awaiting-human->doing`),
`src/state/store.mjs` (`claimTrigger`/`statusAtAsk` stamping, `answerAwaiting`
dynamic resume target), `src/state/replay.mjs` (fold + `from!=='awaiting-human'`
guard), `bin/fgos.mjs` (`pick` guard loosen + branch-reuse generalize + `--via`,
`ask` statusAtAsk capture), `src/intake/{discovery,decompose}.mjs` (statusAtAsk +
§3b release call), `src/runner/anti-loop.mjs` (executing-phase-only visit
counting — see below), `.claude/skills/fgos/{fgos-exploring,fgos-planning,
fgos-validating}/SKILL.md` (+ `.agents/` mirror) — commit-before-discover hard
rule (§3d). Tests across `test/state/*`, `test/intake/*`, `test/runner/
anti-loop.test.mjs`, `test/cli/fgos.test.mjs`. `npm test`: full suite green.

**Found during implementation, fixed in the same slice (not in the original
design above):** `src/runner/anti-loop.mjs`'s `visitCount`/
`visitsSinceLastHumanEvent` counted every `todo->doing` move lifetime,
regardless of stage — before this plan that was equivalent to "executing-phase
dispatch attempts only" (pick/take were frontier-only), but §3a's loosened
guard lets a clarify/decompose-phase claim through the same door, which would
have silently eaten into the SAME `MAX_VISITS` budget real executing retries
draw from. Fixed by scoping both counters to only count a `doing`-move that
lands while the item's stage already equals its domain's Execute-mapped stage
(mirrors frontier.mjs's own eligibility check). Confirmed via code review
+ user decision to fix rather than defer.

## 1. Vấn đề (verified, không phải đoán)

Item còn `stage: clarify`/`decompose` luôn có `status: 'todo'` — không claim nào
tồn tại cho nó. Pull door (`take`/`pick`) chỉ khoá mutual-exclusion khi item đã
ở `stage: executing` (`bin/fgos.mjs:1186`, `:1253` — check `readyWork()`, tức
frontier, tức executing-only per `frontier.mjs`).

Hệ quả: `/fgOS:cook` (attended, người ngồi cùng qua Socratic `fgos-exploring`)
và `fgos-runner --watch`'s CLARIFY SWEEP/DECOMPOSE SWEEP (`src/runner/loop.mjs:
959-1006`, tự gọi judge model mỗi tick ~5s) **có thể cùng gọi
`resolveDiscovery`/`resolveDecompose` trên CÙNG một id** nếu cả hai tiến trình
cùng chạy trên một backlog. `.fgos/events.lock` (STR35) đảm bảo không hỏng dữ
liệu (CAS an toàn), nhưng không ngăn đua NGỮ NGHĨA: runner's judge sweep có thể
advance stage bằng phán đoán máy TRƯỚC KHI người ngồi trong `cook` kịp duyệt gate
CONTEXT.md — công sức Socratic của người bị bỏ qua.

Thêm lý do thứ 2 (lộ ra khi thiết kế, không kém quan trọng): viết
`CONTEXT.md`/`plan.md` thẳng lên main trong lúc discover/exploring/planning
cản merge (nhiều phiên ghi/commit đồng thời lên main) — nên giai đoạn này
CŨNG cần chạy trong worktree riêng, không chỉ giai đoạn executing.

## 2. Ràng buộc kiến trúc đã xác nhận (đọc code + luật thật, không suy đoán)

- **L10 (`docs/platform-foundations.md`) — add-through-not-alongside.** Hành vi
  mới phải mở rộng QUA `moveWork`/`moveStage` hiện có, không mở cửa ghi song
  song. Tiền lệ: `awaiting-human` là `moveWork` wrapper
  (`putInAwaiting`/`answerAwaiting`, `store.mjs:486-498`); `pick` bản thân nó
  cũng là 1 verb mới thêm sau, tái dùng nguyên logic `take` bên trong — tiền lệ
  cho việc mở rộng 1 verb hiện có thay vì bịa verb song song.
- **status (`fsm.mjs`) và stage (`stage.mjs`) là HAI TRỤC ĐỘC LẬP.**
  `todo→doing` hợp lệ bất kể stage — cái chặn hiện tại là guard cứng ở tầng
  verb (`bin/fgos.mjs`), KHÔNG phải luật FSM.
- **[Lộ ra lúc code, không có trong thiết kế gốc] §3b/§5.1 cần 2 edge FSM
  MỚI**, không chỉ field additive: `{from:'doing', to:'todo'}` (release
  không-cần-reason, cửa §3b dùng) và `{from:'awaiting-human', to:'doing'}`
  (resume giữ claim, cửa §5.1 dùng — trước đây `awaiting-human` chỉ thoát về
  `todo`). Cả hai đã thêm vào `TRANSITIONS` (`fsm.mjs`), test đầy đủ.
- **`claimActor` chỉ fold khi `to === 'doing'`** (`replay.mjs:65-68`) — tái
  dùng được, không cần field mới.
- **`resolveDiscovery`/`resolveDecompose` không check `work.status`** (grep
  xác nhận rỗng) — claim `doing` không làm gãy `fgos discover` hiện tại.
- **Runner sweep chỉ đụng `status === 'todo'`** (R15, `loop.mjs:984,1004`) —
  item đã claim tự động bị sweep bỏ qua, không cần logic loại trừ mới.
- **`pick`'s worktree-reuse hiện dựa vào `status==='blocked'`**, không dựa
  vào việc branch `fgw/<id>` có tồn tại hay không — đây là chỗ phải tổng quát
  hoá (xem §3c).
- **Nợ "đa-tiến-trình" ADR0010 (mục 1, `architecture-map.md:556-558`) đã CHỐT
  và đã GIẢI** (gate "trước STR6", STR6 nay `done`; `.fgos/events.lock` STR35
  giải lớp hỏng-dữ-liệu). Gap ở đây khác lớp (ngữ nghĩa, không phải toàn vẹn
  dữ liệu) — chưa từng được đặt tên trước plan này.

## 3. Thiết kế cuối (chốt)

### 3a. Claim mở rộng — 1 verb duy nhất: `pick`

Không cần verb mới, không cần chọn giữa `take`/`pick`. Vì giai đoạn
discover/exploring/planning giờ CŨNG cần worktree (lý do cản-merge, §1), claim
ở clarify/decompose và claim ở executing là CÙNG một thao tác: claim + dựng
worktree — đúng việc `pick` đã làm.

Nới guard ở `pick`'s nhánh `--id` tường minh: cho phép claim 1 item
`status:'todo'` bất kể stage (không chỉ frontier/executing). Cùng
`moveWork(dir, {id, to:'doing', expectedStatus:'todo', actor:'session'})` — CAS,
lock, claimActor stamp y hệt cơ chế hiện có, không path mới. (`take` giữ
nguyên, không đổi — vẫn hữu ích cho domain không cần worktree, ngoài phạm vi
coding hôm nay.)

Đây cũng là hành vi `fgos-routing/SKILL.md` dòng 43-45 VỐN ĐÃ MÔ TẢ (verify sai
so với code ở lượt trước) — sửa guard này làm tài liệu đó ĐÚNG TRỞ LẠI.

### 3b. Release khi stage sang `executing` — Option 1 (CHỐT)

`resolveDiscovery`/`resolveDecompose` (`src/intake/{discovery,decompose}.mjs`),
khi tự đẩy stage → `executing`, gọi thêm
`moveWork(dir, {id, to:'todo', expectedStatus:'doing'})` — cùng cửa `moveWork`,
2 event (stage-move + status-release) trong cùng phạm vi lock. `pick` giữ
nguyên hình dạng đơn giản ("claim = todo + frontier"), trách nhiệm release đặt
đúng nơi quyết định stage đã đủ điều kiện sang executing.

### 3c. Worktree-reuse tổng quát hoá (theo tồn tại branch, không theo status)

`pick`'s logic hôm nay: `status==='blocked' && branchExists(...)` → gắn lại
branch cũ; còn lại → LUÔN `createWorktree` mới. Đổi điều kiện gắn-lại thành
**`branchExists(...)` một mình** (bỏ điều kiện status) — bao trọn 3 trường hợp:
- branch chưa có → tạo mới (như hôm nay).
- branch có + `status:'blocked'` → retake sau reject (như hôm nay, không đổi).
- branch có + `status:'todo'` (MỚI) → item vừa được §3b release từ khúc
  discover/planning — `pick` lại gắn ĐÚNG vào worktree cũ, thấy
  `CONTEXT.md`/`plan.md` đã commit sẵn.

### 3d. Mô hình 2 khúc (chốt theo yêu cầu user)

- **Khúc A — discover + fgos-exploring + fgos-planning + fgos-validating.**
  1 claim (`pick`, §3a), chạy trong `fgw/<id>`. **Hard rule mới:** phiên PHẢI
  commit `CONTEXT.md`/`plan.md` lên branch TRƯỚC KHI gọi `fgos discover` (điểm
  kích hoạt release ở §3b) — nếu không, khúc B gắn vào worktree không có gì đã
  lưu. Thêm vào `fgos-exploring`/`fgos-planning`/`fgos-validating`'s hard rules,
  cùng khuôn "one commit per item" `fgos-code-implement` đã có.
- **Ranh giới** = đúng lúc `fgos discover` đẩy stage sang `executing` + tự
  release (§3b). Item về `status:'todo'`, `stage:'executing'`, branch
  `fgw/<id>` đã có sẵn plan.
- **Khúc B — fgos-code-implement.** `pick <id>` lại (§3a+3c gắn đúng worktree cũ),
  implement, verify, `fgos return`.

### 3e. Đóng phiên giữa 2 khúc — TUỲ CHỌN, quyết định NGOÀI cơ chế (chốt)

Cơ chế release/reclaim (§3b+3c) an toàn để gọi `pick <id>` lại **bất kỳ lúc
nào** sau release — CÙNG phiên gọi tiếp ngay, hay phiên MỚI hoàn toàn gọi sau,
mechanically GIỐNG HỆT nhau (CLI không biết và không cần biết ai/khi nào gọi).
Nên: **quyết định "đóng phiên hay chạy tiếp" là quyết định NGOÀI fgOS**, dựa
trên mức dùng context của phiên hiện tại (user's ngưỡng: <50% chạy tiếp ngay
trong cùng phiên, ≥60% nên đóng, phiên mới nhận khúc B) — không hard-code
ngưỡng vào `cook`/skill nào.

Lý do không mechanize trong `cook` tự thân: chưa xác nhận có tool nào cho phép
1 phiên đang chạy tự đọc % context CHÍNH NÓ giữa chừng. Cái user ĐÃ có
(statusline JS tự viết, đọc session limit) là 1 tiến trình NGOÀI phiên (chạy
qua hook input riêng của Claude Code, không phải tool agent tự gọi được) — vai
trò tự nhiên của nó là giám sát TỪ NGOÀI (herdr đọc statusline của từng pane
con rồi quyết định đóng pane/mở pane mới), không phải agent tự soi chính nó.

**Chừa sẵn (không implement hôm nay):** checkpoint ở ranh giới khúc A/B
(§3b+3c) đã đủ tự chứa, đủ an toàn, không cần biết "ai/khi nào" gọi `pick`
lại — đây CHÍNH LÀ chỗ để herdr (đọc statusline pane con, thấy ≥60%) cắm vào
sau: đóng pane hiện tại, mở pane mới, tự gõ `/fgOS:pick <id>`. Không cần
API/tool mới nào từ fgOS phía này — chỉ cần herdr tự quyết bên ngoài.

## 4. Phạm vi KHÔNG làm trong plan/PBI này

- Không chạm `frontier()`/`readyWork()` shape (vẫn executing-only, D1 "cửa pull
  không mở tập riêng" giữ nguyên).
- Không giải lại nợ ADR0010 mục 1 (đã giải, ngoài phạm vi).
- Không xây lease/liveness kiểu STR27 fleet — vẫn single-repo, CAS đủ.
- Không mechanize ngưỡng context% vào `cook` — quyết định đóng/tiếp phiên ở
  ngoài (herdr/người), §3e.
- Không thiết kế reclaim-policy khác biệt theo `claimTrigger` (§6) — để dành,
  PBI riêng khi cần thật.

## 5. Câu hỏi còn mở (ĐÃ GIẢI — xem "Trạng thái" ở đầu file)

1. **[GIẢI, field name = `statusAtAsk`]** `answerAwaiting`'s resume-target
   (`store.mjs:496`, hard-code `to:'todo'`
   hôm nay): nếu `fgos ask`/`answer` xảy ra giữa khúc A lúc item đang
   `doing`, item bị rớt về `todo` trần sau khi answer — mất claim. Đã chốt
   hướng: đọc "status trước ask" từ 1 field additive mới trên sự kiện `ask`
   (cùng khuôn `parentSnapshotAtAsk`) — CẦN đặt tên field + xác nhận vị trí
   patch trong `store.mjs`/`fsm.mjs` trước khi code.
2. Tên cờ stamp `claimTrigger` (§6): `--via herdr` — đã tạm chốt, xác nhận lại
   lúc code.

## 6. Addendum — herdr (semi-auto dispatch qua agent-pane)

herdr không phải "runner nhẹ hơn/headless" — là bộ mở-pane giới hạn song song
(≤4 pane), dùng ở giai đoạn đầu vì `fgos-runner` chạy invisible, khó theo
dõi/debug. Human **luôn ở gần** (giám sát ≤4 pane, trả lời khi rảnh tới) —
ATTENDED-VỚI-ĐỘ-TRỄ, không phải unattended.

- herdr tự gõ `/fgOS:cook <id>` hoặc `/fgOS:pick <id>` (theo id có sẵn — herdr
  hiếm khi tự mô tả task tự do, chỉ người submit mới dùng free-text). **`cook`
  cần thêm bước nhận diện:** nếu `$ARGUMENTS` trùng 1 id đã tồn tại
  (`fgos list --json`), bỏ qua submit, đẩy thẳng id vào queue; nếu không, coi
  như free-text, submit như hôm nay — additive, không đổi hành vi cũ. (Việc
  riêng, nhỏ, có thể sửa `plugins/fgOS/skills/cook/SKILL.md` độc lập với plan
  claim-lock này.)
- Pane đứng chờ ở gate KHÔNG phải hang — là hành vi thiết kế đúng của `cook`
  (hỏi thật, chờ thật); human ở gần, thấy, trả lời khi tới.
- Claim-lock (§3a-3d) cần NGAY vì lý do này — ≤4 pane cook/pick song song trên
  cùng backlog là tình huống đua THẬT, hàng ngày, không phải edge case hiếm.
- Nếu SAU NÀY herdr chạy pane thật sự không ai theo dõi (vd ban đêm) — không
  được tự gõ `cook`/mở `fgos-exploring` trực tiếp (treo vĩnh viễn ở gate, 3
  skill này không có "Headless" section như `fgos-code-implement`); phải đổi sang
  `fgos discover <id> --json` (headless-safe, đúng cái runner sweep đã làm).

## 7. Addendum — `claimTrigger` (tách khỏi `claimActor`)

- **Field mới, KHÔNG đè `claimActor`.** `claimActor` (`human`/`session`) giữ
  nguyên nghĩa hiện có (`loop.mjs:381` reclaim-guard, `return`'s branch-source
  check phụ thuộc đúng 2 giá trị đó). Thêm `claimTrigger` — optional string,
  cưỡi CÙNG event `to:'doing'`, additive, cùng khuôn
  `parentSnapshotAtAsk`/`headAtTake`.
- **Không phải enum đóng** — chỉ validate non-empty khi có mặt (khuôn
  `docsRef`/`reason`), tránh khoá schema `work.mjs` vào danh sách dispatcher
  biết trước.
- **Cách gắn:** `pick`'s `actor` giữ khoá cứng `'session'` (D3, không đụng);
  thêm cờ optional `--via herdr` chỉ stamp `claimTrigger`, không chạm
  CAS/precondition.
- **Dùng ngay:** `fgos list`/`fgos stale` phân biệt claim nào herdr mở — audit,
  không phải safety mechanism (human luôn ở gần theo §6, không cần
  reclaim-tự-động).
- **Để dành:** reclaim-policy khác theo trigger — PBI riêng khi cần thật.
