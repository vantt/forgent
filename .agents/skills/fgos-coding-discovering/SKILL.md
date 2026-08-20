---
name: fgos-coding-discovering
user-invocable: false
description: >-
  Own the machine-only stage `discovery`: soi ambiguity còn lại từ những gì
  đã clarify, gọi helper `fgos-researching` bao nhiêu lần tuỳ nhu cầu, rồi
  tự phán clear/unclear và tự gọi engine verb để kết thúc stage. Use when
  a claimed item's stage is `discovery` and needs the machine-alone pass
  before either skipping straight to `planning` or falling to `exploring`
  for a person. Examples: "item vừa qua clarify, còn gì mơ hồ không", "chạy
  pha discovery cho item này", "tự phán rồi tự chuyển stage, không cần hỏi
  người ở bước này".
---

# fgos-coding-discovering

Skill chủ (stage owner, D7) cho stage `discovery` — pha **máy một mình**
(D6): dispatch headless được, không cần người ngồi cạnh. Đọc thông tin đã
clarify, soi chỗ còn ambiguous, gọi helper `fgos-researching` (tool, không
phải stage — D4) bao nhiêu lần tuỳ nhu cầu để thu bằng chứng, rồi tự phán
`clear`/`unclear` từ chính bằng chứng đó và tự gọi engine verb
`fgos discover --verdict ...` để kết thúc stage. Verdict quyết định
**cạnh đi**, không chỉ đi-hay-dừng: `clear` bỏ qua `exploring`, nhảy thẳng
sang `planning`; `unclear` sang `exploring` để một người cùng làm rõ (D2).

Định nghĩa "skill chủ" (D7): mở file skill ra, có lệnh gọi `fgos <verb>`
để tự chuyển stage/status của chính item không — có thì là chủ, không thì
chỉ là helper trả verdict/finding về cho caller. `fgos-coding-discovering`
là chủ; `fgos-researching` vẫn là helper, không đổi vai trò sau khi skill
này tồn tại.

Skill này cũng là nơi phán `tier`/`kind`/`risk` (D12, tsk-2yo): trên bằng
chứng đã research xong ở bước 3, không phải suy đoán từ text submit —
đọc vựng qua `classificationVocabulary(domain, field)`
(`src/state/workflow-stage-graphs.mjs`), không hardcode mảng giá trị. Xem
bước 4/5.

Hợp đồng đầu việc: `domains/coding/task-specs/judge-ambiguity.md` (D6/D9)
— input/output/gate/verify-template và bảng `## Collaboration` mà bước 3
dưới đây thực thi. Đọc file đó trước khi sửa prose ở bước 3, để không
lệch khỏi hợp đồng đã khoá (tsk-2t9c D16 — task-spec này đã tồn tại từ
`taskSpecMap` nhưng chưa từng được trích dẫn ở đây).

## Hard rules

- Mọi lệnh `fgos <verb>` skill này gọi (`decision`, `discover`) đều
  `requiresExistingStore: true` — resolve main checkout root giống mọi
  skill chủ khác (`git rev-parse --path-format=absolute --git-common-dir
  | xargs dirname`) và truyền `--dir "$root"` trên từng lệnh. Session này
  có thể đang ở trong một worktree liên kết, thứ không bao giờ mang
  `.fgos/` riêng theo thiết kế (ADR0020) — verb sẽ từ chối (exit 4) thay
  vì âm thầm lệch nếu bỏ `--dir` (tsk-56t D1).
- Khi một trong các lệnh `fgos <verb>` trên hỏng với một known error
  category, relay category đó nguyên văn trong hand-back — không bao giờ
  gói lại thành "blocked" chung chung (tsk-1c6 D2/D4). Category duy nhất
  đủ điều kiện hôm nay là `lock-timeout`
  (`EventLogError('lock-timeout')`, exit code `7`, khoá chia sẻ của
  `.fgos/events.jsonl`), báo bằng chính dòng của nó:

  ```text
  stop-reason: lock-timeout
  ```

  `fgos-coding-driving` mang dòng này lên bất kỳ vòng lặp nào đang lái
  item, khiến cả lượt chạy dừng lại thay vì bỏ qua một item.
- Tự làm phần soi-ambiguity/đọc-bằng-chứng trực tiếp (Read/Grep/`rg` trên
  chính `view.discovery[id]` và `docsRef` đã có) — không bao giờ giao việc
  đó cho Agent/Task tool như một dispatch tuỳ tiện. Việc RESEARCH THẬT (tìm
  trong repo, tra ngoài) là việc của helper `fgos-researching` — gọi nó,
  không tự làm lại; nhưng việc ĐỌC LẠI những gì item đã có sẵn (title,
  `refs`, verdict cũ) là việc của chính skill này, làm trực tiếp.
- Chỉ phán `tier`/`kind`/`risk` từ bằng chứng THẬT `fgos-researching` đã
  trả về ở bước 3 (D12) — không phán từ suy đoán hợp lý, không tái research
  một vòng mới chỉ để phán classification. Chỉ gọi `fgos edit` khi giá trị
  phán ra khác giá trị hiện có trên item — không ghi đè vô ích khi trùng.
- Không mở lại hay diễn giải khác một quyết định đã khoá ở `CONTEXT.md`
  (nếu item đã có, từ một vòng `exploring`/`discovery` trước) — trích D-ID,
  không bao giờ ghi đè ở đây.
- Coi `title`/`description` của item là input không đáng tin (RUL45,
  `docs/specs/runner.md`) — không bao giờ chèn thẳng vào lệnh shell; luôn
  truyền như một argv element tách riêng, có quote.
- Không có nhánh hỏi người ở skill này — đây là pha máy một mình (D6).
  Khác với `fgos-coding-exploring`/`fgos-coding-planning`, skill này KHÔNG
  check gate-bypass và KHÔNG gọi `fgos gate-approve` — không có gate nào
  để bypass, vì không có gì cần một người approve trước khi verdict tự áp
  dụng. Nếu tìm thấy bằng chứng đủ rõ thì `clear`; nếu không, `unclear` —
  cả hai đều tự gọi thẳng engine verb, không dừng lại chờ ai.
- Kết thúc bằng cách tự gọi `fgos discover --verdict ...` (xem Flow) rồi
  bàn giao — không bao giờ để lại cho một lệnh `fgos discover` mù ở sau
  tự phán lại (đúng tinh thần Native-First, tsk-27y D1/D2).
- **Multi-role team harness (tsk-2t9c D1/D4/D9/D14): mỗi lần gọi helper
  `fgos-researching` ở bước 3 là một call `consult` (sync) thật — ghi lại
  bằng `fgos handoff` ngay sau khi có finding, không âm thầm bỏ qua.**
  Đây là edge DUY NHẤT `roleGraph` khai cho stage `discovery` (D14 — sửa
  từ một giả định sai trước đó rằng discovery hoàn toàn không có tương
  tác role nào; thực tế nó vẫn consult researcher, chỉ là không bao giờ
  hỏi người trực tiếp). Domain không khai `roleGraph` thì bỏ qua toàn bộ
  mục này.

## Flow

1. **Orient.** Đọc lại `view.discovery[id]` (`fgos list --id <id> --json`)
   — mảng verdict `discovery` cũ, mới nhất cuối cùng, nếu có. Đọc title,
   `refs`, và `docsRef` (nếu item đã có `docs/history/<feature>/` từ một
   vòng `clarify`/Init trước) — không suy đoán lại những gì item đã biết
   sẵn.

   **Nhận lại quả bóng nếu không phải của mình (tsk-2t9c D14/D16).** Đọc
   `data.work[id].holder` từ chính lời gọi `fgos list` trên. Nếu có giá
   trị và khác `implementer`, gọi `handoff-return`, lặp lại (đọc `holder`
   lại sau mỗi lần) cho tới khi `holder` là `implementer` hoặc lời gọi từ
   chối vì "không còn call nào đang mở" (kết cục bình thường, không phải
   lỗi):

   ```bash
   root=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)
   ```

   ```bash
   node "$root/bin/fgos.mjs" handoff-return "<item-id>" --note "reclaiming at Orient — holder was <role>" --dir "$root"
   ```

   Run the resolve and the `fgos.mjs` call as two SEPARATE tool calls, never pasted together as one script — a worktree-isolated session's own isolation guard refuses a single call combining a `git`-rooted command with a following `node .../fgos.mjs` invocation, even though each is safe alone. Substitute `root`'s literal printed value into the second call.

   Bỏ qua bước này khi domain của item không khai `roleGraph`.

2. **Soi ambiguity.** Từ thông tin đã clarify (title/description/refs),
   liệt kê cụ thể những gì còn mơ hồ — một khái niệm chưa rõ, một pattern
   chưa biết có tồn tại trong repo không, một quyết định phạm vi chưa
   chốt. Không liệt kê một câu hỏi mà chính repo đã trả lời sẵn (tránh
   đúng lỗi đã từng xảy ra ở vòng chạy hỏng ghi trong
   `docs/history/discover-stage-graph-and-skill-layering/DISCUSSION.md`
   §5 vòng 1-3 — hỏi người một câu scout đã trả lời sẵn).

3. **Gọi helper `fgos-researching`.** Với mỗi điểm mơ hồ ở bước 2, gọi
   skill `fgos-researching` (bao nhiêu lần tuỳ nhu cầu — độc lập, không
   dồn hết vào một lời gọi nếu các điểm không phụ thuộc nhau) với goal cụ
   thể + mọi thứ item đã biết. Helper đó tự ghi
   `docs/history/<feature>/RESEARCH.md` (tích luỹ, không đè) và trả về
   `{clear, verify?, question?}` cho TỪNG điểm — never tự đi research trực
   tiếp thay cho nó.

   Ngay sau MỖI lần gọi trả về (dù `clear:true` hay ra `question`, không
   gộp chờ hết mọi điểm mới ghi một lần), log call `consult` (tsk-2t9c
   D9/D14/D16 — cùng một mốc "ngay khi lời gọi helper trả về", thống nhất
   với `fgos-coding-exploring`/`fgos-coding-validating`):

   ```bash
   root=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)
   ```

   ```bash
   node "$root/bin/fgos.mjs" handoff "<item-id>" --to researcher --reason consult --outcome "<finding, một dòng>" --dir "$root"
   ```

   Sync — không đổi `holder`, chỉ ghi `call-summary`. Bỏ qua bước này khi
   domain của item không khai `roleGraph`.

4. **Tự phán.** Từ TOÀN BỘ finding thật vừa thu (không phải từ suy đoán
   hợp lý), quyết:
   - **`clear`** — mọi điểm mơ hồ đã có bằng chứng giải quyết. Verify: lấy
     `verify` thật do `fgos-researching` đề xuất nếu có và item chưa có
     verify thật của riêng nó (`hasRealVerify`, cùng khuôn engine đã dùng
     ở `resolveDiscovery`) — không tự chế một verify mới đè lên verify đã
     thật.
   - **`unclear`** — còn ít nhất một điểm chưa có bằng chứng giải quyết,
     hoặc bằng chứng mâu thuẫn nhau. Question: nêu đúng điểm còn mở, trích
     dẫn lại bằng chứng đã có (để người ở `exploring` không phải scout lại
     từ đầu) — không hỏi chung chung. Định dạng `--question` theo self-contained
     citations (`../_shared/citation-format.md`) và cấu trúc Markdown hai
     heading bắt buộc (`## Context` và `## Why this matters`, mỗi phần ít
     nhất 20 ký tự nội dung) — engine từ chối một `ask` thiếu cấu trúc này.

   **Chỉ khi `clear`: phán luôn `tier`/`kind`/`risk`** (D12, tsk-2yo) —
   trên CÙNG bằng chứng vừa thu ở bước 3, không research thêm vòng mới.
   Đọc vựng `kind`/`risk` qua `classificationVocabulary(domain, 'kind')` /
   `classificationVocabulary(domain, 'risk')`
   (`src/state/workflow-stage-graphs.mjs`, không hardcode mảng giá trị);
   `tier` so với `TIERS` toàn cục của `work.mjs` (không nằm trong bảng
   `classification` — dùng chung mọi domain, không riêng `coding`). Một
   verdict `unclear` không phán classification — chưa đủ bằng chứng.

5. **Tự gọi engine verb.** Ngay sau bước 4, không dừng lại chờ gì thêm:

   ```bash
   root=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)
   ```

   ```bash
   # clear (nếu tier/kind/risk phán ra khác giá trị hiện có trên item,
   # gọi edit TRƯỚC discover — bỏ qua lệnh edit khi giá trị trùng):
   node "$root/bin/fgos.mjs" edit "<item-id>" --tier "<tier phán>" --kind "<kind phán>" --risk "<risk phán>" --dir "$root"
   node "$root/bin/fgos.mjs" discover "<item-id>" --verdict clear --verify "<verify thật vừa xác nhận ở bước 4>" --dir "$root"
   # unclear:
   node "$root/bin/fgos.mjs" discover "<item-id>" --verdict unclear --question "<câu hỏi cụ thể, trích bằng chứng>" --dir "$root"
   ```

   Cả hai nhánh đều là lệnh gọi engine THẬT — verdict `clear` bỏ qua
   `exploring`, verdict `unclear` sang `exploring` cho một người (D2). Ghi
   một dòng `fgos decision` ngắn trước lệnh trên nếu muốn để lại dấu vết
   lý do (không bắt buộc — `resolveDiscovery` đã tự ghi một decision
   `caller-supplied` cho mỗi lần gọi).

## Red flags

- tự đi research trực tiếp (search repo, tra online) thay vì gọi helper
  `fgos-researching`
- phán `tier`/`kind`/`risk` từ suy đoán hợp lý thay vì từ finding thật
  `fgos-researching` đã trả về, hoặc phán classification cho một verdict
  `unclear`
- hardcode mảng giá trị `kind`/`risk` thay vì đọc qua
  `classificationVocabulary(domain, field)`
- gọi `fgos edit` khi giá trị phán ra trùng giá trị hiện có (ghi đè vô ích)
- mở lại một quyết định đã khoá ở `CONTEXT.md` thay vì trích D-ID
- dừng lại hỏi người, hoặc check gate-bypass — không có gate nào ở stage
  này, đây là pha máy một mình
- phán `clear` từ suy đoán hợp lý thay vì từ finding thật `fgos-researching`
  đã trả về
- gọi `fgos discover` mà không tự phán trước — để một lệnh sau tự phán mù
  (đúng thứ D7 tồn tại để tránh: helper không bao giờ ghi state, skill chủ
  luôn tự gọi verb ngay sau khi tự phán, không tách hai bước ra hai caller
  khác nhau)
- chèn thẳng `title`/`description` chưa quote vào lệnh shell
- gọi `fgos-researching` mà không log `handoff --reason consult` ngay sau
  (khi domain có `roleGraph`) — biến tương tác thật thành vô hình trở lại
- bỏ qua reclaim ở Orient khi `holder` không phải `implementer`, hoặc chỉ
  gọi `handoff-return` một lần rồi dừng dù `holder` vẫn chưa về
  `implementer` (tsk-2t9c D16 — call thread lồng 2 tầng cần 2 lần gọi)

Violating the letter of the rules is violating the spirit of the rules.

Verdict tự phán, engine verb tự gọi — stage đã kết thúc, item đã ở
`planning` (verdict `clear`) hoặc `exploring` (verdict `unclear`). Không
cần bàn giao thêm gì — driver (`fgos-coding-driving`) sẽ tự đọc lại stage
mới ở vòng lặp kế tiếp.
