# plan — tsk-60r4: review cụm merge tsk-2t9c + vệ tinh (2026-08-16)

Mode: **standard** — 2 flags (existing covered behavior: fix có thể đụng
`src/setup/registrations.mjs`/`test/setup/checks.test.mjs` đã cover; weak
proof: nghi vấn 5 nói thẳng handoff/roleGraph chưa dogfood sau khi hợp
nhất với tsk-in1). Không có hard-gate flag: item chủ yếu đọc-xác-minh,
fix kỳ vọng là doc/registry nhỏ.

impact-analysis: **full** (gitnexus `present` — kèm caveat vô điều kiện
của CLAUDE.md gate: zero-result đáng ngờ phải cross-check bằng rg).

## Nguồn sự thật

- Item description: 5 nghi vấn đánh số + quy tắc hành động (bug thật →
  fix + npm test + decision; không phải bug → ghi lý do trong báo cáo;
  không mở rộng scope ngoài cụm 5 item).
- `docs/history/tsk-60r4/RESEARCH.md` round 1: artifacts đã xác nhận tồn
  tại; merge commits `e268376e` (tsk-2t9c), `5236eb10` (tsk-3vk),
  `2a15a63d` (tsk-ogx); phát hiện thêm **collision số decision 0032** (2
  file cùng prefix trong `docs/decisions/` — file multi-role (nay `0033`) là của
  chính tsk-2t9c, nên nằm trong scope cụm này, không phải mở rộng).

## Approach

Một lượt audit tuần tự: đọc bằng chứng trước, phán từng nghi vấn, chỉ sửa
khi là bug thật. Alternatives bị loại: (a) fan-out subagent cho từng nghi
vấn — bị loại vì 5 nghi vấn chia sẻ cùng bộ bằng chứng (diff 3 merge
commit), đọc một lần rẻ hơn 5 lần; (b) fix-trước-đọc-sau — bị loại vì
đúng yêu cầu item: "xác minh thật, đừng tin mù".

### Thứ tự thực hiện

1. **Đọc bằng chứng** (read-only): 4 file
   `docs/history/fgos-marketing-domain-foundation/`, decision
   multi-role team harness (nay `0033-multi-role-team-harness...`),
   `fgos show tsk-2t9c` (D1-D18), diff
   3 merge commit — tập trung 5 file resolve tay: `CHANGELOG.md`,
   `bin/fgos.mjs`, `docs/specs/distribution.md`,
   `src/setup/registrations.mjs`, `test/setup/checks.test.mjs`.
2. **Phán 6 nghi vấn** (5 của item + collision 0032 từ RESEARCH.md):

   | # | Nghi vấn | Cách xác minh |
   |---|---|---|
   | 1 | iron-law-evidence.md thiếu cho tsk-2t9c | Contract tsk-5t3 (07-30) có TRƯỚC merge; đọc contract + iron-law-gate xem evidence file bắt buộc lúc nào (return-time hay approve-time), có check hồi tố nào không |
   | 2 | Thiếu verb đóng duplicate-of-parent | Đọc status-fsm/wontfix path + đếm tần suất dùng thật (events); phán YAGNI |
   | 3 | 5 file conflict resolve tay | Đọc nội dung cuối trên main: registerCheck ids không sót/lặp, CHANGELOG bullets không lặp, bảng #7/#7b distribution.md khớp format, so với nhánh nguồn (`git show` từng side) |
   | 4 | Title tsk-3ki cắt cụt | Đọc event tạo item (submit text gốc) — title field bị cắt hay text gốc đã thế |
   | 5 | handoff/roleGraph × kind/via chưa dogfood | Đọc `src/runner/dispatch.mjs` chỗ 2 nhánh cùng đụng; chạy targeted tests (handoff + dispatch + setup checks); ghi nhận bằng chứng dogfood thật: chính drive này đã gọi `fgos handoff`/`handoff-return`/call-summary trên main code sau merge |
   | 6 | Collision 2 file decision 0032 | Xác nhận cả 2 được tạo ở 2 nhánh song song; fix = đánh số lại file sau (multi-role → 0033) + cập nhật mọi cross-ref (`rg "0032"` toàn repo) |

3. **Fix những gì là bug thật** — dự kiến từ bằng chứng hiện có: chỉ #6
   (collision) chắc chắn là bug thật; #3 có thể lộ sót/lặp entry; các
   nghi vấn còn lại nhiều khả năng là "chấp nhận được, ghi lý do". Không
   fix gì ngoài cụm.
4. **Verify + báo cáo**: `npm test` xanh; báo cáo tổng hợp tại
   `plans/reports/` theo naming convention; mỗi nghi vấn một verdict +
   lý do/fix; `fgos decision` cho mỗi fix thật.

### Risk map

| Component | Rủi ro | Proof point (validating) |
|---|---|---|
| Rename decision 0033 + cross-refs | light — rename file + sửa link | `rg` không còn ref mồ côi tới tên file cũ sau fix; npm test |
| Registry/CHANGELOG dedup (#3) | light — chỉ sửa nếu tìm thấy sót/lặp | đọc trực tiếp + `npm test` (checks.test.mjs cover registry) |
| dispatch.mjs interaction (#5) | medium — 2 nhánh cùng sửa 1 file, chưa dogfood chung | targeted test: `node --test test/runner/` handoff/dispatch; bằng chứng live: các lệnh handoff của chính drive này chạy OK trên main sau merge (callThreads tsk-60r4 đã ghi) |

## Split

Không split — một lượt audit + fixes nhỏ là một mảnh việc thật
(pass-through). Verify của item đã thật: `npm test`.

## Assumptions

- A1: "Không mở rộng scope ngoài cụm 5 item" cho phép fix collision 0032
  vì file multi-role (nay `0033`) là artifact của chính tsk-2t9c (RESEARCH.md
  round 1) — không phải scope mới.
- A2: Báo cáo đặt ở `plans/reports/` (naming convention của repo) là
  artifact judgment, không cần test riêng.

## Outstanding questions

None
