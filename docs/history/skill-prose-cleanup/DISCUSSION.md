# Skill prose cleanup — DISCUSSION

Item: `tsk-56w`

## 1. Trạng thái hiện tại

Round 1 (quét thật kỹ, chưa hỏi câu nào cần chốt). Đã quét toàn bộ
`plugins/fgOS/skills/*/SKILL.md` (50 skill, không tính `_shared/`) bằng số
đo khách quan (số dòng, số block code nhúng >=3 dòng, số lần trích dẫn
`tsk-…`/`D-…`/`RUL…`/`STR…` không giải thích) cộng với đọc trực tiếp các
file nặng nhất. Đã xác minh lại kiến trúc mirror 3 tầng (xem §3) — hiểu sai
ban đầu (tưởng `plugins` và `.claude` phải byte-identical) đã được sửa
bằng cách đọc `test/skills/fgos-mirror.test.mjs`.

Ba pattern lỗi cụ thể, có bằng chứng, đã thấy rõ (chi tiết ở §7). Chưa
chốt D-ID nào (round 1, hard rule: không mint D-ID từ 1 vòng). Yêu cầu quy
trình mới từ người dùng (chưa D-ID hoá): tag một version trên `main` ngay
trước khi chuyển sang execute, đánh dấu mốc "trước khi sửa skill" để có
điểm so sánh/khôi phục.

Việc tiếp theo: người xem lại 3 nhóm lỗi + đề xuất giải pháp ở §7, xác nhận
phạm vi/độ ưu tiên, rồi mới khoá D-ID và viết CONTEXT.md.

## 2. Mục tiêu & đề bài

Skill của fgOS (`plugins/fgOS/skills/`, mirror qua `.agents/skills/` và
`.claude/skills/`) hiện dài và lẫn quá nhiều thứ không phải "prose thuần"
vào trong `SKILL.md`: có 2 skill nhúng hẳn một đoạn pseudocode dài (vòng
lặp có biến, điều kiện, nhãn `loop:`) ngay trong thân bài thay vì mô tả
bằng câu văn tự nhiên; có hàng chục skill lặp lại y hệt cùng một khối bash
9 dòng cho việc gọi `fgos` CLI; và gần như mọi skill dài đều rải các trích
dẫn kiểu `(tsk-2t9c D16)`, `(RUL45)` mà người đọc không tra cứu thì không
hiểu là cái gì, tại sao nó ở đó. Mục tiêu của tsk-56w: dọn ba loại này để
mỗi skill có mục tiêu rõ ràng ngay từ đầu, nội dung đủ chi tiết để làm đúng
nhưng không dài dòng, đọc được bằng mắt người (không phải bằng cách chạy
thử pseudocode), không có câu nào phải tra số quyết định mới hiểu nghĩa.
Việc này áp dụng cho toàn bộ tập skill fgOS — cả nhóm "core" (14 dev-skill
dùng chung 3 nơi) lẫn nhóm "coding"/CLI-wrapper (~35 skill chỉ có trong
`plugins/fgOS/skills`).

## 3. Vấn đề rõ / chưa rõ

| # | Trạng thái | Nội dung |
|---|---|---|
| 1 | Rõ | Kiến trúc mirror thật sự (không phải "3 bản phải giống hệt nhau"): `.agents/skills/<name>/SKILL.md` là **nguồn thật** cho 14 dev-skill (`fgos-clarifying`, `fgos-coding-*` [7 skill], `fgos-fanout`, `fgos-indexing`, `fgos-researching`, `fgos-routing`, `fgos-unlock`) + `distill`. `.claude/skills/<name>/SKILL.md` là **wrapper sinh tự động** (`npm run build:skills`, có test `test/skills/fgos-mirror.test.mjs` khoá) — chỉ 3 dòng "đọc file kia". `plugins/fgOS/skills/<name>/SKILL.md` (chỉ 14 dev-skill, không có `distill`) là **bản copy tay đầy đủ**, KHÔNG sinh tự động — test hiện tại chủ động bỏ qua việc so khớp nó (comment trong file test: "this leg is UNCHANGED... a full byte-identical copy... hand-maintained"). |
| 2 | Rõ | Vì #1, mọi lần sửa prose 1 trong 14 dev-skill phải sửa tay ở CẢ `.agents/skills` LẪN `plugins/fgOS/skills` — không có cơ chế tự đồng bộ, tự nó là rủi ro lệch khi làm cleanup này. |
| 3 | Rõ | `plugins/fgOS/skills` còn ~35 skill CLI-wrapper (answer/approve/ask/.../unlock) không tồn tại ở `.agents`/`.claude` — nhóm này không bị double-maintenance, chỉ sửa 1 chỗ. |
| 4 | Rõ | 2 skill nhúng pseudocode thật (không phải ví dụ lệnh CLI ngắn): `fgos-coding-driving` (khối "text" 133 dòng, có nhãn `loop:`, biến, điều kiện) và `fgos-fanout` (khối "text" 88 dòng, cùng dạng). Đây đúng là thứ tsk-56w mô tả là "embed script trực tiếp trong SKILL.md". |
| 5 | Rõ | 23/~35 skill CLI-wrapper lặp lại y hệt cùng 1 khối bash 9 dòng ("fgos CLI fallback (tsk-1no D3)") — danh sách đủ: answer, ask, approve, check, cleanup-next, conflicts, discover, goal, graph, list, merge-list, merge-next, move, pick, plan, ready, return, rollup, show, stale, submit, triage, unlock. `_shared/` đã có tiền lệ đúng kiểu cần (citation-format.md, coding-worker-contract.md, executor-dispatch-fallback.md — skill khác trỏ `../_shared/<file>.md` thay vì chép lại). |
| 6 | Rõ | Trích dẫn ID trần (không giải thích) rải khắp: `fgos-coding-exploring` 25 lần `tsk-…`, `fgos-coding-planning` 25, `fgos-coding-driving` 22, `fgos-coding-validating` 21, `fgos-coding-implement` 14, `pick` 11, `fgos-routing` 6 `tsk-…` + 5 `RUL…`, `approve` 4 `RUL…`. Ví dụ thật: "declares its relation, no default, tsk-1lv-1", "(RUL45)", "tsk-2t9c D16" — không câu nào tự giải thích ID đó nghĩa là gì, người đọc buộc phải tra `fgos show <id>` mới hiểu. Tổng cộng quét được ≥267 lần trích `tsk-…` toàn bộ 50 file. |
| 7 | Rõ | Skill dài KHÔNG đồng nghĩa với dở/dư thừa: đọc trực tiếp `fgos-coding-exploring` (558 dòng) cho thấy phần lớn nội dung là chi tiết cơ chế thật (reclaim-the-ball loop, quy tắc hỏi Socratic 3 điều kiện, gate-check capability) — không phải lặp/thừa. Nếu cắt độ dài một cách máy móc (theo số dòng) sẽ mất tác dụng skill, đúng như người dùng cảnh báo. Vấn đề thật ở đây là mật độ trích dẫn ID trần (#6) làm câu văn khó đọc hơn, không phải bản thân độ dài. |
| 8 | Rõ | Có tiền lệ nội bộ đã dùng đúng mô hình "SKILL.md ngắn + references/*.md" ngay trong repo này: `.agents/skills/distill/` có sẵn `references/` và `scripts/` riêng, không nhúng gì vào SKILL.md. 49/50 skill còn lại (kể cả 14 dev-skill "core") không có thư mục `references/` nào — mọi thứ dồn hết vào 1 file. |
| 9 | Rõ (yêu cầu người dùng, chưa D-ID) | Trước khi chuyển bất kỳ item con nào của tsk-56w sang stage thực thi (execute), phải tạo một tag/version ở `main` đánh dấu đúng thời điểm skill bắt đầu bị sửa — để có mốc so sánh/khôi phục nếu sửa làm hỏng tác dụng skill. |
| 10 | Chưa rõ | `ui-spec` (chỉ có ở `.claude/skills/ui-spec`, 339 dòng, có `references/`/`templates/`/`tools/` riêng) không phải skill fgOS — có tính vào phạm vi tsk-56w không, hay loại hẳn? (Nghiêng về loại, vì mô tả gốc của tsk-56w chỉ nói "skill fgOS".) |
| 11 | Chưa rõ | Giải pháp cho #4 (pseudocode 133/88 dòng): viết lại thành văn xuôi có đánh số bước (giống cách `fgos-coding-exploring`'s Flow đang làm) HAY tách nguyên khối pseudocode đó ra một `references/algorithm.md` riêng, SKILL.md chỉ tóm tắt + trỏ tới? Hai hướng khác nhau về việc "còn giữ pseudocode ở đâu đó hay bỏ hẳn". |
| 12 | Chưa rõ | Giải pháp cho #6 (trích dẫn ID trần): xoá hẳn ID số, chỉ giữ lý do bằng câu văn thường — hay giữ ID kèm theo một mệnh đề lý do ngắn ngay sau (ví dụ "tsk-2t9c D16 — vì lệnh reclaim có thể lồng 2 lớp")? Ảnh hưởng tới việc truy vết quyết định về sau (docs/decisions/index.md, `fgos show`). |
| 13 | Chưa rõ | Có sửa `.agents/skills`+`plugins/fgOS/skills` cùng lúc trong 1 task/child, hay tách thành 2 bước tuần tự (sửa nguồn trước, đồng bộ copy tay sau) để giảm diff review mỗi lần? |

## 4. Quyết định đã chốt

*(chưa có — round 1, chưa D-ID nào giữ ổn định qua >1 vòng)*

## 5. Q&A log

- **2026-08-18T16:43Z** — Quét mở đầu (không phải Q&A, không có câu hỏi
  nào được hỏi). Lệnh quét: đếm dòng + block code nhúng + trích dẫn ID
  trần trên toàn bộ `plugins/fgOS/skills/*/SKILL.md` (script scan, xem
  §7 nguồn số liệu), đọc trực tiếp `fgos-coding-driving`, `fgos-fanout`,
  `fgos-coding-exploring`, các skill CLI-wrapper nhỏ (answer/ask/conflicts/
  merge-list/move/pick/ready/return/rollup/show/stale/unlock), và
  `test/skills/fgos-mirror.test.mjs` để xác minh kiến trúc mirror thật.
- Người dùng, giữa phiên: nhắc phải ghi tài liệu ngay khi quét/tìm ra giải
  pháp, không dồn tới cuối — đã áp dụng (file này được viết ngay sau vòng
  quét đầu, chưa chờ hội tụ).
- Người dùng, giữa phiên: nhắc phải cẩn thận kỹ càng vì cắt sai sẽ mất tác
  dụng skill/prose, và trước khi execute phải tag version ở `main` đánh
  dấu mốc trước khi sửa — ghi nhận ở §3 mục 9.

## 6. Thiết kế đã chốt

*(chưa viết — chờ §3 mục 11/12/13 ngã ngũ trước khi tổng hợp thiết kế
cuối; viết sớm lúc này sẽ phải viết lại ngay khi #11/#12 đổi hướng)*

## 7. Danh mục hạng mục / task (nháp, chưa khoá)

### {#task-pseudocode-driving} fgos-coding-driving: bỏ pseudocode nhúng
- **Vấn đề**: `SKILL.md` có 1 khối fenced-code 133 dòng (gộp 2 block liền
  kề) viết dạng thuật toán thật (biến `shownItemOnce`, nhãn `loop:`, rẽ
  nhánh `if/else` lồng nhau) thay vì mô tả bằng câu văn. Trộn thêm trích
  dẫn trần `tsk-2t9c D16` ngay giữa dòng code.
- **Đề xuất**: viết lại toàn bộ đoạn này thành các bước đánh số trong
  "## Flow" — đúng văn phong "Flow" hiện `fgos-coding-exploring` đang dùng
  cho logic tương đương phức tạp (chọn skill theo stage, đọc state tươi,
  điều kiện dừng) mà không cần code fence. Không tạo `references/` riêng
  cho việc này trừ khi bước 4 (đo lại) cho thấy văn xuôi hoá vẫn còn dài
  quá ngưỡng đọc được.
- Phụ thuộc: #11 ngã ngũ trước (văn xuôi hoá hay tách references/).
- Verify nháp: `npm test -- test/skills/fgos-mirror.test.mjs` xanh (không
  đổi ứng xử máy đọc) + review thủ công không còn fenced code >=3 dòng
  trong file.

### {#task-pseudocode-fanout} fgos-fanout: bỏ pseudocode nhúng
- **Vấn đề**: giống hệt task trên, khối "text" 88 dòng, nhãn `loop:`,
  trích dẫn trần `(D4)`.
- **Đề xuất**: cùng cách tiếp cận với `fgos-coding-driving` — văn xuôi hoá
  theo đúng 1 khuôn để 2 skill không lệch văn phong sau khi sửa.
- Phụ thuộc: nên làm cùng lúc/ngay sau task driving để giữ nhất quán văn
  phong; không bắt buộc cùng 1 child task.

### {#task-cli-fallback-dedupe} Gom khối "fgos CLI fallback" về `_shared/`
- **Vấn đề**: 23 file lặp y hệt 1 khối bash 9 dòng, chỉ khác tên verb.
- **Đề xuất**: tạo `plugins/fgOS/skills/_shared/fgos-cli-fallback.md` chứa
  khối mẫu (tham số hoá bằng chỗ trống `<verb-cmd>`), 23 file wrapper chỉ
  còn 1 dòng trỏ `../_shared/fgos-cli-fallback.md` kèm verb cụ thể — đúng
  mô hình `_shared/citation-format.md` đang dùng.
- Verify nháp: diff trước/sau — mỗi wrapper vẫn còn đủ lệnh gọi đúng verb
  của nó (grep tên verb trong file sau khi sửa), tổng số dòng
  `plugins/fgOS/skills/*/SKILL.md` giảm ròng.

### {#task-bare-citation-cleanup} Dọn trích dẫn ID trần
- **Vấn đề**: xem §3 mục 6 — ID trần rải khắp, đậm nhất ở 5 skill core
  (exploring/planning/driving/validating/implement) + routing + approve +
  pick.
- **Đề xuất**: chờ §3 mục 12 ngã ngũ (xoá hẳn ID hay giữ ID+lý do ngắn)
  trước khi định hình task. Nhiều khả năng tách theo từng skill (mỗi core
  skill 1 child) vì mỗi file cần đọc hiểu ngữ cảnh riêng để không xoá nhầm
  lý do thật đằng sau — không thể làm bằng tìm/thay máy móc.

### {#task-scope-decision} Xác nhận phạm vi & mốc trước-khi-sửa
- **Vấn đề**: #13 (đồng bộ .agents+plugins) và #9 (yêu cầu tag version)
  chưa có quyết định cụ thể.
- **Đề xuất**: 1 quyết định thủ tục, chốt trước khi mở bất kỳ child task
  thực thi nào: (a) mỗi core-skill fix sửa `.agents/skills` trước, review
  xong mới copy tay sang `plugins/fgOS/skills` trong cùng commit; (b)
  `git tag` (tên gợi ý: `pre-skill-prose-cleanup-tsk-56w`) trên `main` tại
  SHA hiện tại trước khi item con đầu tiên vào `executing`.
