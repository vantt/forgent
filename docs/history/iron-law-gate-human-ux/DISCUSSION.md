# Iron Law gate — UX cho con người

Item neo: `tsk-1y6`

## 1. Trạng thái hiện tại

Vòng 1, vừa mở. Đã scout xong hiện trạng code + luật + doc; chưa có quyết
định nào chốt (§4 trống — đúng kỷ luật: D-ID chỉ mint khi một điểm đứng
vững qua hơn một vòng).

Đã xác nhận bằng nguồn thật, không suy đoán:

- Cổng Iron Law bắn ở **ba** nơi trong `bin/fgos.mjs`, logic copy-paste
  gần như nguyên văn: `approve` (~L3498), `sync-root` (~L4101), và
  `merge next`'s `wouldTripIronLaw` (~L2477).
- Cổng **không** phân biệt merge target. `approve` đã tính sẵn
  `rootBranchForIronLaw` (biết mình đang merge vào `fgw/<root>` hay
  trunk) nhưng vẫn chạy `classifyIronLaw` bất kể. `sync-root` cũng vậy:
  `targetBranch = item.parent ? branchNameFor(item.parent) :
  detectTrunk(repoRoot)`, gate chạy trước, không nhìn giá trị đó.
- **Không tồn tại** skill `/fgOS:approve`. `plugins/fgOS/skills/` có
  ask/answer/move/return/merge-next/merge-loop/... nhưng không có
  `approve/`. Vậy mà `merge-loop/SKILL.md` và `merge-next/SKILL.md` đều
  bảo người "run `/fgOS:approve <id> --acknowledge-iron-law` themselves".
  Slash-command đó không có thật → người buộc rớt xuống terminal.
- Luật cấm nằm ở RUL34/RUL37 (`docs/specs/runner.md`) + `merge-loop`
  §4a. Câu chữ thật: agent không được chạy cờ đó *"on this skill's own
  authority"*.
- Hạ tầng bypass đã có sẵn: `.fgos/config.json` → `gateBypass.level`
  (repo đang chạy `standard`), `src/state/gate-bypass.mjs`
  (`canAutoApprove`, `canAutoApproveMergedGate`), floor = HEAVY_KEYWORDS.
  `docs/explanation/gate-bypass-design.md` (D4) ghi rõ floor đó **cố ý**
  không bao giờ chạm Iron Law.

Đang chờ người trả lời 4 câu ở §5 (vòng 1).

## 2. Mục tiêu & đề bài

Cổng Iron Law hiện đúng về mặt an toàn nhưng sai về mặt trải nghiệm: khi
nó chặn, agent gom được bằng chứng và trình ra, nhưng rồi dừng lại và bắt
chính con người mở terminal gõ lệnh `approve`/`sync-root
--acknowledge-iron-law`. Người gõ xong thì gặp lỗi mà agent không nhìn
thấy (agent không chạy lệnh nên không có stdout/exit code), nên người lại
phải copy/paste lỗi ngược vào chat cho agent đọc — một vòng lặp thủ công
hoàn toàn không cần thiết. Người dùng đặt vấn đề: việc con người phải
*quyết định* là hợp lý, nhưng việc con người phải *thao tác* thì không —
"chỉ nhắc nhở con người là đủ rồi". Kèm theo hai hướng gợi mở (config để
tắt chức năng, hoặc field trên workitem để quyết định bypass) và một ràng
buộc bổ sung quan trọng: nếu bản merge đó không thật sự land lên `main`
thì không cần hỏi gì cả; chỉ khi land lên trunk mới nên hỏi. Câu hỏi thật
của đề bài vì thế không phải "có nên bỏ Iron Law không" mà là "cổng này
nên hỏi ở đâu, hỏi bao nhiêu lần, và ai được phép gõ phím sau khi người
đã quyết".

## 3. Vấn đề rõ / chưa rõ

| # | Điểm | Trạng thái | Ghi chú |
|---|------|-----------|---------|
| 1 | Gate bắn 3 nơi, code lặp 3 lần | Rõ | `bin/fgos.mjs` ~L2477 / ~L3498 / ~L4101 |
| 2 | Gate không nhìn merge target | Rõ | Cả `approve` lẫn `sync-root` đã có sẵn biến target nhưng không dùng để rẽ nhánh |
| 3 | `/fgOS:approve` không tồn tại | Rõ | Nguồn trực tiếp của "phải copy/paste vào terminal" |
| 4 | Luật cấm là về *thẩm quyền* hay về *thao tác*? | **Chưa rõ** | RUL34/RUL37 nói "on this skill's own authority"; doc explanation lý giải là cần "second, independent party actually looking at it" — nói về ai NHÌN, không nói ai GÕ |
| 5 | "Chỉ hỏi khi về main" — đánh đổi tần suất vs độ nặng | **Chưa rõ** | Dời hết gate về ranh giới trunk giảm số lần hỏi, nhưng làm mỗi lần hỏi to hơn (xem §5 Q4) |
| 6 | "Config để tắt" nghĩa là tắt hẳn hay hạ cấp thành cảnh báo? | **Chưa rõ** | Q2 |
| 7 | Field bypass trên workitem — ai set, lúc nào? | **Chưa rõ** | Q3; nếu agent tự set được thì gate mất nghĩa |
| 8 | Có nên tái dùng `gateBypass.level` không? | **Chưa rõ** | Đâm thẳng vào D4 floor của gate-bypass-design.md |

## 4. Quyết định đã chốt

*(trống — chưa điểm nào đứng vững qua hơn một vòng)*

| D-ID | Quyết định | Lý do | Vòng chốt |
|------|-----------|-------|-----------|

## 5. Q&A log

### 2026-08-15 — vòng 1 (mở)

**Người dùng (đề bài gốc):** "cải thiện acknowledge-iron-law để hỗ trợ con
người, hiện nay agent cứ hỏi chổ này, hỏi người approve là được, nó bắt
chính người phải chạy lệnh là không cần thiết, và khi humn chạy thì có
những error agent không tự bắt nên người cũng phải copy/paste vào
terminal, nên quy trình này quá phiền phức. hãy thảo luận thêm. chỉ nhắc
nhở con người là đủ rồi. ux phải tốt lên. có thể cho config để tắt chức
năng, hoặc workitem có field để quyết định bypass"

**Người dùng (bổ sung, cùng vòng):** "thêm là nếu không merge về main thì
không cần hỏi đâu, khi nào về main mới nên hỏi."

**Agent — scout (kết quả ở §1), rồi hỏi lại 4 câu:**

- Q1 — Ranh giới "agent gõ hộ": người trả lời "approve" trong chat là đủ
  để agent tự chạy lệnh (tự đọc exit code, tự sửa lỗi cơ học, tự retry)?
  Hay vẫn muốn agent trình lệnh và người xác nhận từng lần?
- Q2 — "Config để tắt" là tắt hẳn cổng (Iron Law biến mất), hay giữ cổng
  nhưng đổi từ chặn-cứng sang nhắc-rồi-đi-tiếp có ghi log?
- Q3 — Field bypass trên workitem: ai được set và lúc nào? Nếu agent tự
  set được lúc submit/implement thì cổng mất hết ý nghĩa.
- Q4 — Ràng buộc "chỉ hỏi khi về main": chấp nhận việc lần hỏi cuối cùng
  nặng hơn (gộp nhiều leaf, nhiều module, bằng chứng rải rác) không? Đây
  đúng tình cảnh `tsk-2sj`/`tsk-51m` đang mắc trong backlog.

*(chờ trả lời)*

## 6. Thiết kế đã chốt {#design}

*(chưa có — §3 còn 5 điểm chưa rõ, chưa đủ hình để tổng hợp)*

## 7. Danh mục hạng mục / task {#tasks}

*(chưa có — chờ §6 thành hình)*
