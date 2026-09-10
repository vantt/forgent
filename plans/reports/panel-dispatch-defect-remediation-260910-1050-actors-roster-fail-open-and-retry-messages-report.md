# Panel dispatch defect remediation — kết quả thật

**Ngày:** 2026-09-10 · **Branch:** main · **Chưa commit** (để anh review)
**Bối cảnh:** các defect quan sát được trong hai lần chạy architecture-advisory panel
(`aap-260909-fgos-confinement-authority`, `aap-260909-2343-fgos-confinement-run2`).

---

## 0. Tóm tắt

| # | Defect | Kết quả | Test |
|---|---|---|---|
| A1 | Advisory agent không dùng được Bash trong dispatch | **KHÔNG sửa** (anh hoãn) — nhưng **root cause đã đính chính** | — |
| A2 | `actors[]` rơi im lặng về executor mặc định | **ĐÃ SỬA** | test mới, đã chứng minh fail-without-fix |
| A3 | `renderAssignmentPrompt` không nêu schema result | **ĐÃ ĐƯỢC SỬA TỪ TRƯỚC** (`tsk-5zim`) — doc cũ gây hiểu nhầm, đã sửa doc | có sẵn |
| A4 | Cảnh báo `gitnexus` spam mỗi dispatch | **THỬ RỒI REVERT** — đụng một quyết định đã có test; escalate cho anh | giữ nguyên xanh |
| A5 | Message lỗi retry vô dụng | **ĐÃ SỬA** | test cũ được siết chặt hơn |
| B1/B2 | maxRounds, prompt contamination | **CHƯA điều tra** — xem §6 | — |

**Suite:** 2 failure **có sẵn từ trước**, đã chứng minh bằng baseline (stash toàn bộ thay đổi
của em → vẫn đỏ đúng 2 cái đó). Không failure nào do em. Chi tiết §5.

---

## 1. A1 — root cause em đoán SAI, đã đính chính

**Em đã giao agent đi sai hướng.** Brief của em nói nguyên nhân là thứ tự `--tmpfs /tmp`
trong argv bwrap. Sai.

**Bằng chứng bác bỏ:** agent sonnet được dispatch qua executor `claude` — **không chạy dưới
bwrap** — và vẫn bị chặn Bash y hệt, với thông báo khác hẳn:

> nearly every `Bash` command... is being rejected immediately with "This command requires
> approval" — no prompt is reaching me... Only argument-free trivia (`echo`, `pwd`) succeeds.

**Nguyên nhân thật: lớp permission, không phải bwrap.** Sweep toàn bộ 17 executor:

| Executor | permission-mode | Bash được mở |
|---|---|---|
| `claude` | `acceptEdits` | **chỉ `git add`/`git commit`** |
| `claude-bwrap` | `acceptEdits` | không khai `--allowedTools` |
| `codex-bwrap`, `agy-bwrap` | — | không khai |

`acceptEdits` tự duyệt **sửa file**, nhưng **Bash vẫn cần approval** — ở headless `-p` thì
approval không bao giờ tới. Đó là lý do panel roles đêm qua chỉ đọc được bằng `Read`.
Cái `EROFS` scout báo là một lỗi *khác, hẹp hơn* (ghi vào `plans/`, bwrap chặn thật), bị
lẫn thành cùng một chuyện. Lead advisor báo đúng ngay từ đầu: *"Bash was permission-gated"*.

**Hệ quả lớn hơn, và đây là defect nặng nhất tìm được cả phiên:**
**không executor nào trong config làm được việc implement.** `code:implement` → prefer
`claude` → Bash chỉ có `git add`/`git commit` → **không chạy nổi một test**. Repo đang thiếu
hẳn một loại executor: *bị nhốt nhưng ghi được vào source*.

Anh đã quyết **hoãn** mọi thay đổi executor bwrap tới khi Confinement Authority có spec
confirm + probe đã commit. Không đụng gì. Ghi lại đây để lần sau không mò lại hướng tmpfs.

---

## 2. A2 — `actors[]` rơi im lặng (ĐÃ SỬA)

**Defect:** roster per-actor nằm trong **request body**, không nằm trong session. Request
resume quên `actors[]` → mọi actor rơi về executor mặc định, **không cảnh báo, không từ chối**.
Đã xảy ra thật: 3 vai advisory bị bind sang 3 executor confined khác nhau lại chạy hết trên
một executor mặc định có quyền ghi git.

**Sửa:** `src/verbs/coordination/run.mjs` — sau mỗi dispatch, nếu step có `targetActorId`
nhưng request không có entry tương ứng, ghi ra stderr, **nêu tên actor và executor thật đã
dùng**:

```
fgos: coordination step "req" targets actor "requester-actor" but this request declares no
actors[] entry for it — no per-actor executor/tier/persona was applied, so it dispatched on
"<executor>". The roster is per-request, not per-session: a resumed session must repeat
actors[] to keep its bindings.
```

Cảnh báo chứ không từ chối — bỏ `actors[]` là hợp lệ và đôi khi đúng ý người gọi.

**Blast radius:** thêm thuần, trong nhánh `step.type === 'operation'` của `runCoordinationUseCase`.
Không đổi contract, không đổi giá trị trả về, không đổi luồng.

**Test:** `test/verbs/coordination-group-thinking-pack.test.mjs` — ca âm đặt cạnh ca dương
sẵn có (cùng protocol, cùng steps, chỉ bỏ `actors[]`).

**Đã chứng minh fail-without-fix:** tạm vô hiệu điều kiện → **17/18 (fail 1)**; bật lại →
**18/18**. Assertion soi đúng *dòng cảnh báo*, không soi cả stderr — vì dòng log dispatch
quanh đó cũng in `executor=`, soi cả stderr sẽ pass nhầm (em đã mắc đúng lỗi này ở bản đầu
và đã siết lại).

---

## 3. A3 — đã được sửa từ trước; doc cũ mới là thứ sai

`renderAssignmentPrompt` **đã** nêu contract `agent-result.json` (`tsk-5zim` đóng rồi):
enum `status` render từ `ALLOWED_AGENT_CLAIM_STATUSES` — **cùng set mà `validateAgentResultClaim`
enforce**, nên prompt không drift khỏi validator; cộng `summary` bắt buộc; cộng cảnh báo
read-only settle `no-evidence` nếu thiếu report.

Đã xác nhận trong prompt dispatch thật đêm qua.

**Nghĩa là em đã dán tay câu schema vào 16 objective một cách thừa**, vì tin mục Known Gaps
đã cũ trong skill.

**Sửa:** `core/skills/fgos-architecture-panel/SKILL.md` — mục `tsk-1ed` đổi thành "closed by
`tsk-5zim`", nói rõ đừng viết tay nữa và tại sao (bản viết tay **có thể drift** khỏi validator,
đúng lý do mục đó tồn tại). Đã chạy `npm run build:skills`; render sang `.agents/` và
`plugins/fgOS/` (đúng luật render-target, không sửa tay).

---

## 4. A4 — thử rồi REVERT, escalate cho anh

**Defect có thật:** mỗi lần load config in cảnh báo `gitnexus`, nhiều lần mỗi process.

**Em đã thử sửa:** bỏ qua cảnh báo cho entry có `invocations[]` nhưng không có cái nào
`via:'cli'` — vì entry đó không có đường CLI dispatch nào cả.

**Bằng chứng của em:** `dispatch.mjs decide gitnexus` →
`{"mechanism":"in-process","mcpTool":"mcp__gitnexus__impact"}` — không bao giờ cli-spawn.

**Vì sao em revert:** `test/runner/dispatch.test.mjs:1726` có test **cố ý** khẳng định đúng
shape gitnexus **phải** warn, và nêu lý do trong chính tiêu đề: *"assignment-policy.mjs has
no command to extract for this shape"*. Bằng chứng của em cho thấy đường **CLI dispatch**
không tới được, nhưng **không bác** mối lo về `assignment-policy` mà test nêu.

Theo `.claude/rules/review-audit-self-decision.md`: một quyết định đã được verify bằng test
thì không lật vì một mối lo trừu tượng; và nếu audit đề nghị lật, phải trình bày rồi **chờ
người**. Nên em revert, để lại comment ghi rõ quan sát + ba lựa chọn, không tự quyết:

1. khai một `provider` trung thực cho entry đó;
2. thu hẹp cảnh báo về đúng shape có thể tới CLI dispatch;
3. cho cảnh báo bắn một lần mỗi process.

**Trạng thái:** không đổi hành vi. Test gitnexus xanh trở lại.

---

## 5. A5 — message retry (ĐÃ SỬA)

**Trước:** `steps[0].authorizationId must be a non-empty string` — không nói gì về ngữ nghĩa
retry. Em mất một vòng vì chính message này đêm qua.

**Sau:**

```
steps[0].authorizationId is required for an "authorize" step. It names this grant and seeds
the dispatch's default taskKey, so RETRYING a driver-authorized operation needs a FRESH
authorizationId and invocationKey — reusing the previous attempt's ids re-presents the same
task instead of a new run.
```

`invocationKey` cũng được bổ sung tương tự. **Chỉ đổi message** — không đổi cái gì được chấp
nhận hay từ chối.

**Test:** `test/verbs/coordination-run-driver-steps.test.mjs` có test pin nguyên văn message
cũ → gãy. Em **không nới test**: giữ nguyên ý định của nó ("một refusal riêng cho mỗi field
thiếu") và **siết thêm** — pattern giờ bắt buộc message phải chứa hướng dẫn retry, nên wording
không thể âm thầm tụt về dạng trần. 59/59 xanh.

---

## 6. Chưa làm

- **B1 (`maxRounds` không nâng được khi rerun hợp lệ)** và **B2 (phát hiện prompt
  contamination)** — chưa điều tra. Agent bị chặn hoàn toàn nên không có gì; em ưu tiên sửa
  A2/A5 bằng chính session này. Cả hai vẫn là câu hỏi mở.

## 7. Việc phát sinh, không sửa (chỉ báo)

- **2 test đỏ có sẵn từ trước, KHÔNG phải do em** — đã chứng minh bằng baseline (stash cả 6
  file → vẫn đỏ đúng 2 cái):
  - `buildCandidateInventory against the real committed .fgos/config.json` (`test/runner/cohort-planner.test.mjs`)
  - `CLI run against the real repo root, with the checked-in baseline, exits 0` (`test/scripts/check-decision-citation-drift.test.mjs`)
- **`glm-cli executor (LIVE)`** đỏ một lần trong một lượt chạy, xanh ở lượt khác — test gọi
  provider thật, nhiều khả năng do môi trường/quota. Không liên quan thay đổi của em.
- **Test để lại rác:** `docs/.tutorials-hidden-for-test/` xuất hiện untracked sau khi chạy
  suite — test pollution, có thể liên quan tới failure `check-decision-citation-drift`.
- **`npm test` in `[exited with code 0]` qua wrapper dù có failure** — exit code thật là 1
  (bắt riêng mới thấy). Đáng để ý nếu có CI nào đọc nhầm.

## 8. Files đã đổi

```
M core/skills/fgos-architecture-panel/SKILL.md      (A3 doc, + render .agents/ plugins/)
M src/runner/dispatch/config.mjs                    (A4: chỉ comment, hành vi giữ nguyên)
M src/verbs/coordination/run.mjs                    (A2 fix)
M src/verbs/coordination/schema.mjs                 (A5 message)
M test/verbs/coordination-group-thinking-pack.test.mjs   (A2 test mới)
M test/verbs/coordination-run-driver-steps.test.mjs      (A5 test siết chặt)
```

Chưa commit, chưa push, không tạo branch.

## 9. Câu hỏi còn treo

1. A4 chọn phương án nào trong ba cái ở §4?
2. Defect "không executor nào implement được" (§1) có mở work item riêng không? Nó chặn mọi
   lần muốn giao việc code cho agent.
3. 2 test đỏ có sẵn — có muốn em điều tra không? Chúng đỏ trước khi em đụng vào.
4. B1/B2 có làm tiếp không?

```
Status: DONE_WITH_CONCERNS
Summary: A2 và A5 đã sửa + test chứng minh; A3 hoá ra đã sửa từ trước, chỉ doc sai, đã sửa doc;
A4 revert vì đụng quyết định đã có test, escalate cho anh; A1 hoãn theo ý anh nhưng root cause
đã đính chính (lớp permission, không phải bwrap).
Concerns: 2 test đỏ có sẵn từ trước; không executor nào chạy được việc implement; B1/B2 chưa làm.
```
