# Plan — tsk-469: bootstrap CHANGELOG.md thủ công

Mode: tiny

## Scope

Chỉ `tsk-469` (chặng 1 của lộ trình §6.4 DISCUSSION.md). `tsk-3ip` (chặng 2)
là task anh em độc lập, không thuộc phạm vi plan này.

## Approach

Một mảnh việc duy nhất, không cần chia nhỏ — 4 bước cơ học, đã liệt kê đầy
đủ trong description của item và trong DISCUSSION.md §7
(`#task-manual-changelog-bootstrap`). Không cần `fgos graph --what-if`: chỉ
một mảnh, không có lựa chọn thứ tự nào để so sánh.

Quyết định đã khoá, trích dẫn thẳng (không CONTEXT.md riêng — description
của item đã mang D-ID trực tiếp từ DISCUSSION.md):
- D-tsk12m-A: `CHANGELOG.md` ở repo root, chuẩn Keep a Changelog.
- D-tsk12m-C: entry mới vào `## [Unreleased]`; cắt-release là việc khác,
  ngoài phạm vi.

Rủi ro: thấp (risk: light trên item). Rủi ro thật duy nhất là sai chuỗi
heading `## [Unreleased]` — task `tsk-3ip` (chặng 2, song song) parse đúng
chuỗi này, nên verify command đã ghim `grep -qF` để bắt lỗi ký tự chính xác.

impact-analysis: full (GitNexus present) — không áp dụng: footprint chỉ có
`CHANGELOG.md`/`AGENTS.md`, không sửa symbol code nào, không có blast
radius để đo.

## Shape

1. Tạo `CHANGELOG.md` ở repo root — header nêu rõ Keep a Changelog +
   SemVer, khối `## [Unreleased]` với 4 mục con Added/Changed/Fixed/Removed
   (rỗng), rồi `## [0.1.0]` liệt kê mặt hiện có tính tới hôm nay: cài đặt/
   setup/doctor/uninstall, 2 bin entry (`fgos`, `fgos-runner`), CLI 49 verb.
   Không liệt kê lịch sử từng item nội bộ.
2. Thêm một câu vào mục "Install/setup/doctor gate" đã có sẵn trong
   `AGENTS.md`, hỏi: thay đổi này người dùng có thấy không, nếu có thì
   thêm dòng vào `## [Unreleased]` của CHANGELOG.md.

Không có case biên cần phác thêm — đây là tạo file tĩnh, không có input
động, không có concurrent access, không có partial-failure path.

## Outstanding questions

None
