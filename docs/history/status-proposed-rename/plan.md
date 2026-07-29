# tsk-66l — Kế hoạch: đổi `proposed` → `awaiting-approval`

## Mode

**high-risk.** Đếm cờ áp dụng (theo `CONTEXT.md` D1-D6):

| Cờ | Áp dụng? | Vì sao |
|---|---|---|
| data model | có | đổi giá trị enum lõi của state machine (`work.status`), 1 trong 7 giá trị hợp lệ theo schema |
| audit/security | có | migration ghi đè trực tiếp log audit đã commit (`events.jsonl`), dưới miễn trừ RUL11 — chạm nguyên tắc append-only |
| public contracts | có | `status`/`outcome.actual.outcome` là machine contract công khai (mọi consumer đọc `.status === 'proposed'` phải đổi cùng lúc) |
| existing covered behavior | có | 239 chỗ / 30+ file test đang assert giá trị cũ (`test/state/*`, `test/e2e/*`, `test/cli/*`) |
| multi-domain | có | FSM chung domain-agnostic — `test/e2e/synthetic-domain.test.mjs` chứng minh domain `synthetic` cũng đi qua đúng giá trị này |

5 cờ, gồm cờ hard-gate (audit/security) → **high-risk** theo đúng ngưỡng (4+ cờ, hoặc bất kỳ hard-gate flag nào).

## Approach

**Hướng chọn:** một commit atomic duy nhất làm đồng thời: (a) đổi tên giá trị enum trong source (`src/`, `bin/fgos.mjs`), (b) cập nhật toàn bộ test suite kỳ vọng giá trị mới, (c) viết + chạy migration script ghi-đè-tại-chỗ cho 3 kho `.fgos` trong phạm vi 0019, (d) một decision record MỚI supersede thuật ngữ của 0006 (không sửa 0006 tại chỗ — theo quy ước "Changing a locked law supersedes its decision ID" của `AGENTS.md`), (e) full `npm test` xanh trước khi return.

**Vì sao 1 commit atomic, không tách item con:**
- Source rename và log migration PHẢI đáp cùng lúc — nếu tách, trạng thái trung gian (source đã đổi nhưng log chưa migrate, hoặc ngược lại) sẽ đỏ test suite ngay, không có "trạng thái trung gian nào chạy được" để làm item riêng hợp lệ.
- `fgos graph --what-if tsk-66l` cho thấy item này không nằm trên `criticalPath` (path: tsk-4fu→tsk-56t→tsk-1an→...), chỉ unblock transitively 1 item (`tsk-u8w`) — không có áp lực song song hoá để tách nhỏ lấy `topUnblock` cao hơn.

**Phương án bị loại (đã khoá ở CONTEXT.md, trích dẫn lại, không mở lại):**
- Thêm field hiển-thị-riêng (statusLabel/hint) — loại theo D6, vá triệu chứng.
- Giữ `proposed` vĩnh viễn + shim dịch 2 chiều trong `replay.mjs` — loại theo D4, vì miễn trừ 0019 làm rewrite rẻ hơn một shim sống mãi.
- Đổi tên gắn nghĩa "merge" (`awaiting-merge`) — loại theo D1, sai bản chất domain-agnostic.

**Thứ tự thực hiện (trong 1 commit, tuần tự khi verify):**
1. Migration script trước (đọc/ghi 3 kho `.fgos` theo field path cụ thể — KHÔNG blind string-replace) — viết + dry-run trên bản sao trước khi chạm kho thật.
2. Đổi enum trong source (`src/state/*`, `bin/fgos.mjs`) cùng lúc với bước 1 xác nhận migrate đúng, để không có cửa sổ nào source/log lệch nhau.
3. Cập nhật test suite (239 chỗ, 30+ file) theo enum mới.
4. Cập nhật docs: decision record mới supersede 0006 (thuật ngữ, không phải FSM edges), `docs/specs/work-state.md` Data Dictionary #4/O4.
5. Chạy migration thật trên 3 kho phạm vi (kho sống, `dogfood-fixture`, `fgos-test-drive`) — xác nhận `test/fixtures/phase1-events.jsonl` KHÔNG đổi 1 byte.
6. `fgos rebuild` + full `npm test` xanh.

## Risk map

| Thành phần | Rủi ro | Điểm chứng minh (cho fgos-validating) |
|---|---|---|
| Migration script đúng field-path, không blind replace | CAO | Dry-run diff trên bản sao kho thật trước khi ghi kho thật; xác nhận CHỈ field `status`/`work.move.to`/`work.move.from`/`outcome.actual.outcome` đổi — text tự do (title/description) chứa chữ "proposed" không bị đụng |
| Migration đủ cả 3 kho, đúng phạm vi 0019 | CAO | Checklist tường minh: kho sống dùng chung, `dogfood-fixture/`, `fgos-test-drive` (cần xác định đường dẫn thật — mở ở `CONTEXT.md` "câu hỏi mở"); `test/fixtures/phase1-events.jsonl` byte-diff = rỗng |
| Source + test rename đủ 239 chỗ / 30+ file | TRUNG BÌNH | `rg -n "'proposed'" src bin test` đếm trước/sau — kỳ vọng 0 chỗ còn lại ngoài text mô tả lịch sử (comment/docs nhắc tên cũ có chủ đích); `npm test` toàn bộ xanh |
| Hash/revision ổn định sau rewrite | TRUNG BÌNH | `fgos rebuild` xong, so `data_hash`/view trước-sau trên cùng 1 trạng thái logic — theo đúng tinh thần `test/e2e/rebuild-determinism.test.mjs` đã có |
| Decision record mới supersede đúng 0006 | THẤP | Đọc lại `docs/decisions/0006-*.md` sau khi thêm record mới — xác nhận 0006 không bị sửa tại chỗ, chỉ được trích dẫn ngược (đúng khuôn 0019 đã làm với RUL11) |

## Verify

Theo đúng verdict `fgos discover` đã phán (`clear`, không tự ý đổi ở đây):

```
npm test && npm run cli -- list | head -10
```

## Split

**Không tách.** Một mảnh việc trung thực duy nhất — lý do ở mục Approach trên (atomicity giữa source/log/test, không có trạng thái trung gian nào chạy được để làm item độc lập).

## Câu hỏi còn mở (kế thừa từ CONTEXT.md, chưa cần chặn kế hoạch)

- Đường dẫn thật của kho `fgos-test-drive` — cần xác định trước khi viết migration script thật (thuộc bước Execute, không chặn việc approve plan này).
- Có cần 1 test migration riêng (giống `test/state/backward-compat.test.mjs`) khoá hành vi replay sau rewrite hay không — quyết định cụ thể để `fgos-validating` cân nhắc khi chứng minh tính khả thi.
