---
type: explanation
title: 0017 — Miễn trừ pre-release cho RUL11 (viết lại nhật ký tại chỗ)
tags: []
timestamp: 2026-07-27T00:00:00.000Z
source_capture_ids: []
date: 2026-07-27
status: accepted
source_decisions: [2accc216, 80fe8e83]
supersedes: []
relates_specs: [work-state]
---

# 0017 — Miễn trừ pre-release cho RUL11 (viết lại nhật ký tại chỗ)

## Bối cảnh

`RUL11` (`docs/specs/work-state.md:886`, D-ID `feed7428`) cấm tường minh: "Nhật ký
đã commit bất khả xâm phạm — không bao giờ migration ghi đè". Luật này nằm trong
một spec, không phải một decision record — nó không có file riêng mang khoá
`superseded_by` để trỏ ngược.

STR46 đổi tên trường `actor` (và các trường phái sinh: `claimActor`, khoá `actor`
trong `settlements[]`, `payload.predicted.actor`) thành `role`/`claimRole` trên
sự kiện đã commit. Ba kho `.fgos` mang dữ liệu cũ: kho sống dùng chung giữa mọi
worktree, kho `dogfood-fixture` (git-theo-dõi trong chính repo sản phẩm), và kho
`fgos-test-drive`. Không viết lại các kho này thì replay sẽ đọc vĩnh viễn hai tên
cho cùng một trường.

## Quyết định

Ghi nhận một **miễn trừ pre-release** cho `RUL11`: trong lúc sản phẩm còn chưa
phát hành, một thao tác migration được phép **viết lại tại chỗ** (ghi đè
`events.jsonl`, không phải append sự kiện bù) thay vì tuân thủ tuyệt đối
"không bao giờ migration ghi đè".

- **Phạm vi (coverage).** Miễn trừ bao trùm cả BA kho `.fgos` liệt ở trên: kho
  sống dùng chung, kho `dogfood-fixture`, và kho `fgos-test-drive`. Cả ba cùng
  nằm trong phạm vi được phép viết lại — không phân biệt kho nào "quan trọng
  hơn" kho nào.
- **Lát cắt (slicing) là chuyện khác, tách bạch khỏi phạm vi.** Slice nào của
  STR46 thực sự thi hành việc viết lại cho kho nào là một quyết định lịch trình,
  không phải một quyết định phạm vi, và nó đã bị dời hai lần: kho sống được dời
  sang bước merge (vì nó dùng chung qua symlink giữa mọi worktree đang sống, và
  viết lại lúc mã còn trên nhánh chưa merge sẽ mở cửa sổ hỏng), rồi kho
  `fgos-test-drive` theo sau khi write-guard được đo là từ chối mọi đường dẫn nằm
  ngoài worktree. Một bản ghi vĩnh viễn không được kế thừa một quyết định lịch
  trình còn đang di chuyển — nên bản ghi này chỉ khoá PHẠM VI, không khoá SLICE
  nào viết kho nào lúc nào.
- **Hết hiệu lực (lapse).** Miễn trừ này **hết hiệu lực khi sản phẩm lên
  v1.0.0**. Từ mốc đó, `RUL11` áp dụng đầy đủ trở lại không ngoại lệ — không có
  mốc thì "đang còn xây" sẽ thành một cái cớ vĩnh viễn.
- **Không bao gồm.** Miễn trừ này **không** bao trùm
  `repo/test/fixtures/phase1-events.jsonl` — file đã commit, header tự khai
  "NEVER regenerated or hand-edited", và mang một khẳng định bất biến riêng tại
  `test/state/backward-compat.test.mjs:245` ("the fixture file itself is never
  modified by any test in this suite"). File này không mang trường `actor` nên
  không có gì để đổi; nó bị loại rõ ràng để một script quét theo mẫu
  `**/events.jsonl` không vô tình chạm vào nó.

Vì `RUL11` là một luật trong spec chứ không phải một decision record, cách
supersede đúng là: bản ghi này mang `supersedes: []` (không có id nào để trỏ),
và chính dòng `RUL11` trong `docs/specs/work-state.md` được sửa để trích dẫn
ngược lại bản ghi này — văn xuôi làm việc mà `superseded_by` sẽ làm nếu mục tiêu
là một decision record.

## Hệ quả

- **Replay không còn đọc hai tên cho một trường.** Sau khi viết lại và
  `fgos rebuild`, mọi bản chiếu dựng từ log chỉ còn thấy `role`/`claimRole`.
- **Miễn trừ có hạn, không phải giấy phép vĩnh viễn.** Sau v1.0.0, mọi migration
  tương lai quay lại nghĩa vụ append-không-đè của `RUL11` như hôm nay.
- **`phase1-events.jsonl` giữ nguyên vai trò chuẩn nghiệm thu tương thích ngược**
  — nó không bị đưa vào bất kỳ lần viết lại nào, kể cả lần này.
- Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
