# Phase 06 — Một dòng trong `AGENTS.md`

Trạng thái: pending · Công: 0.25d · Phụ thuộc: phase 03 (lệnh tồn tại); phase sửa `AGENTS.md` của Plan A đã merge

## Bối cảnh

- Synthesis §4.2: 40/46 tên report tuần 41 được đọc sẵn trong brief của lead; §7 H2: "`AGENTS.md` giữ một dòng trỏ vào lệnh". Văn xuôi không định nghĩa mẫu (mẫu chỉ ở Rust), chỉ trỏ tới cửa sinh.
- `AGENTS.md` lúc lập plan có thay đổi chưa commit do công cụ sinh (`git status`: `M AGENTS.md`); Plan A sửa file này trước. Không sửa song song.

## Yêu cầu

- Thêm đúng một dòng (vị trí cụ thể chọn sau khi đọc bản `AGENTS.md` đã có thay đổi của Plan A; đề xuất gần mục "Before touching code"). Nội dung đề xuất:
  "Tên và vị trí report, plan, journal (kể cả tên đặt trong brief giao cho agent khác): lấy từ `fgos convention name|path --json`, không tự dựng; `fgos convention check` chặn file mới sai ở pre-commit."
- Không chép mẫu `{type}-{YYMMDD-HHMM}-{slug}.md` vào `AGENTS.md` (một nguồn).
- Dòng nhắc cả brief vì brief là kênh thắng thế (V18).

## Files

Sửa: `AGENTS.md`.
Xoá/gộp: không có quy tắc tên cũ trong `AGENTS.md` để xoá (đã grep: không có `YYMMDD`, không có mẫu report). Khối GitNexus/MDView do công cụ sinh không đụng.

## Các bước

1. `git log -3 -- AGENTS.md`: xác nhận phase của Plan A đã vào; `git diff AGENTS.md` sạch (không có thay đổi công cụ chưa commit). Nếu chưa, dừng.
2. Thêm dòng; không đổi dòng khác.
3. Kiểm `CLAUDE.md` import `@AGENTS.md` (dòng 4-6) nên không cần sửa `CLAUDE.md`.

## Kiểm chứng

- Tiêu chí 10: `rtk proxy rg -c 'fgos convention' AGENTS.md` = 1.
- Nếu `AGENTS.md` có test câu chữ hoặc bộ instruction-composition (`src/setup/instruction-composition.mjs`), chạy test liên quan: `rtk proxy rg -l 'AGENTS.md' test | head` rồi `node --test` các file đó.
- `git diff --stat` chỉ một file, +1 dòng.

## Rủi ro

| Rủi ro | Khả năng × tác động | Giảm thiểu |
|---|---|---|
| Hook ak/ck vẫn chèn `## Naming` mâu thuẫn; dòng này thành tiếng nói thứ tư | Cao × Trung bình | Ngoài phạm vi sửa hook. Cơ chế (lệnh + pre-commit) là lớp chính; hiệu quả đo ở H4 (UNPROVEN). |
| Xung đột merge với Plan A | Trung bình × Thấp | Cổng ở bước 1. |

## Rollback

Revert commit một dòng.

## Commit

`docs(agents): point naming of reports, plans and journals at the convention command`

## Hiệu chỉnh sau red-team (2026-10-06)

Mục này **thắng** nội dung cũ của phase khi mâu thuẫn. Bằng chứng đã được lead tự đo lại (script hoặc `rtk proxy`), chi tiết ở bảng Red Team Review trong `plan.md`.

- Thêm đúng một hàng neo vào `test/docs/agents-doctrine-anchors.test.mjs` (bộ test neo luật L8 mà Plan A Phase 06 tạo) cho dòng mới; thêm file đó vào Files. Bỏ điều kiện cũ "`M AGENTS.md` trong `git status`" (nay đã sạch).
- Dòng luật nói thêm: các agent chạy song song phải đặt **slug khác nhau** (tên chỉ có độ phân giải phút và không có bước kiểm tồn tại, nên bốn reviewer cùng `type`, cùng slug, cùng phút nhận cùng một đường dẫn và ghi đè nhau; hôm nay có 5 nhóm cùng phút trong `plans/reports`). Không thêm mã cho việc này.
- Phase này chạy sau dấu hiệu hoàn tất cơ học của Plan A (xem Plan A Phase 06), không dựa vào `git log`.
