# Phase 07 — Docs, CHANGELOG, ghi chú di chuyển caller

Trạng thái: pending · Công: 0.5d · Phụ thuộc: phase 05, 06

## Bối cảnh

- `AGENTS.md`: thay đổi người dùng thấy → một dòng ở `## [Unreleased]` của `CHANGELOG.md` (dòng 8). L5 câu 6: sự thật spec đã chốt vào `docs/specs/<area>.md`.
- `docs/platform/component-boundary.md` §3: cập nhật bảng khi boundary đổi.

## Yêu cầu

- Spec `docs/platform/convention/spec.md`: trạng thái implemented, điền §Lịch sử quyết định với câu trả lời Q1-Q12 và commit của từng phase.
- Đổi dòng "proposed" thành "implemented" ở `docs/specs/reading-map.md`, `docs/specs/system-overview.md`, `docs/platform/component-boundary.md`.
- `CHANGELOG.md` `## [Unreleased]`: một dòng mô tả `fgos convention name|path|check`, check doctor `convention-conformance`, pre-commit chặn file mới sai, thư mục journal đã gộp.
- **Ghi chú di chuyển caller** (một mục trong spec, không phải file mới):
  - Giữ `src/runner/paths.mjs`: mọi caller của `resolveRepoRoot`, `resolveMainCheckoutRoot`, `resolveFgosDir`, `resolveLogsDir`, `resolveSkillRoot`, `resolveTaskSpecPath`, `resolveContentRoot` (phân giải root lưu trữ, không phải quy ước tài liệu); di chuyển khi host Rust sở hữu caller, không spawn tiến trình trên đường nóng.
  - Chuyển sang `convention`: pre-commit và doctor (phase 05). Không có JS nào hiện sinh tên report theo mẫu (đã grep `plans/reports` trong `src/`, `scripts/`): `scripts/measure-verify-cost.mjs:375` ghi một tên cố định lịch sử, `scripts/measure-p08-performance.mjs:121-127` ghi `plans/260910-1700-rust-host-r1-kernel/reports/p08-performance.json` (plan đó nay ở `archive/plans/`, đường ghi đã chết — ghi nhận, việc riêng), `scripts/test-select-promote.mjs:452` ghi ledger `.json` (không phải kind của convention). Không di chuyển script nào trong plan này.
  - Ngoài: `ak plan create`, hook ak/ck — giữ nguyên, `check` chấp nhận tên của `ak plan create`.
  - Hoãn: cấp phát id (phase 00 §Deferred), `branchNameFor` (ứng viên sau, theo Q5).

## Files

Sửa: `docs/platform/convention/spec.md`, `docs/specs/reading-map.md`, `docs/specs/system-overview.md`, `docs/platform/component-boundary.md`, `CHANGELOG.md`.
Xoá/gộp: không.

## Các bước

1. Đọc từng file trước khi sửa; sửa dòng tối thiểu.
2. Kiểm mọi liên kết và claim với source/test (path tồn tại, tên check, tên lệnh).
3. Chạy test drift docs nếu có (`rtk proxy rg -l 'reading-map' test`), doctor `doc-*` liên quan.
4. Mở `mdview` cho spec.

## Kiểm chứng

- Tiêu chí 11: `rtk proxy rg -n 'fgos convention' CHANGELOG.md` có dòng dưới `## [Unreleased]`.
- `node bin/fgos.mjs doctor` không có lỗi `doc-current-path-missing` mới.
- Toàn bộ: `env -u CLAUDE_CODE_SESSION_ID npm test`, `cargo test --workspace` (tiêu chí 12).
- Tiêu chí 1-11 chạy lại một lượt, ghi kết quả vào verification note của spec (không tạo report riêng trừ khi anh yêu cầu).

## Rủi ro

| Rủi ro | Khả năng × tác động | Giảm thiểu |
|---|---|---|
| `reading-map.md`/`component-boundary.md` đang bị plan H6 sửa | Trung bình × Thấp | Kiểm `git log -3` từng file trước; chỉ thêm/sửa một dòng. |

## Rollback

Revert commit docs.

## Commit

`docs(convention): record the convention component in specs, maps and changelog`

## Hiệu chỉnh sau red-team (2026-10-06)

Mục này **thắng** nội dung cũ của phase khi mâu thuẫn. Bằng chứng đã được lead tự đo lại (script hoặc `rtk proxy`), chi tiết ở bảng Red Team Review trong `plan.md`.

- Không sửa `docs/specs/reading-map.md` (xem Phase 00). Cập nhật trạng thái "implemented" ở `docs/platform/component-boundary.md` §4 và `docs/platform/README.md`.
