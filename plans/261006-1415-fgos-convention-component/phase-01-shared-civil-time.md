# Phase 01 — Gộp thuật toán ngày dân sự vào host-runtime

Trạng thái: pending · Công: 0.5d · Phụ thuộc: phase 00 được duyệt

## Bối cảnh

`convention` cần đổi một thời điểm sang `YYMMDD-HHMM` theo offset. Workspace không có crate thời gian (`rg chrono|time =` trong các `Cargo.toml` ra 0), và đã có bốn bản tự viết của cùng thuật toán. Thêm bản thứ năm vi phạm RUL11. Phase này gộp chúng thành một helper trong `fgos-host-runtime` (mọi crate đã phụ thuộc nó) trước khi crate mới ra đời.

Bốn bản hiện có (đã grep 2026-10-06):
- `apps/fgos/src/cli_presenter.rs:22` `format_iso8601` (xuôi), có test `test_format_iso8601_civil_date_table` `:259`.
- `packages/observe/rust/src/store_lock.rs:58` `format_iso_now` (xuôi, comment `:74`).
- `packages/observe/rust/src/scorecard.rs` `parse_iso_secs` (ngược, comment `:157`).
- `packages/observe/rust/src/time.rs` `midnight_millis` / `parse_timestamp_millis` (ngược, comment nói dùng lại thuật toán của scorecard).

## Yêu cầu

- Một module `packages/host-runtime/rust/src/civil_time.rs` với hàm thuần: ngày dân sự ↔ số ngày từ epoch, định dạng/parse RFC3339 có offset. Không I/O, không lấy offset local (việc đó thuộc phase 02 nếu Q9 chọn local).
- Bốn chỗ gọi dùng helper này; xoá thân thuật toán cũ. Output byte-identical với hiện tại (envelope `generated_at`, lock `ts`, cửa sổ thời gian của metrics).

## Files

Tạo: `packages/host-runtime/rust/src/civil_time.rs`.
Sửa: `packages/host-runtime/rust/src/lib.rs` (export), `apps/fgos/src/cli_presenter.rs`, `packages/observe/rust/src/store_lock.rs`, `packages/observe/rust/src/scorecard.rs`, `packages/observe/rust/src/time.rs`.
Xoá: bốn thân thuật toán ngày dân sự nói trên (gộp 4 → 1).

## Các bước

1. Cổng impact-analysis: `node bin/fgos.mjs tool query --capability impact-analysis --status present`. Lúc lập plan: GitNexus `present` nhưng index ở commit `b3346957a`, sau HEAD `6f043ee9d` 6 commit, tức **degraded/stale**. Chạy `node .gitnexus/run.cjs analyze` trước.
2. Chạy `impact({target, direction:"upstream"})` cho từng symbol: `format_iso8601`, `format_iso_now`, `parse_iso_secs`, `midnight_millis`, `parse_timestamp_millis`. Báo blast radius; cảnh báo anh nếu HIGH/CRITICAL. Đối chiếu bằng `rtk proxy rg -n '<symbol>'` vì index có thể thiếu.
3. Viết `civil_time.rs` + unit test dời từ `test_format_iso8601_civil_date_table` (giữ bảng case cũ, thêm case năm nhuận, trước 1970 nếu caller cần).
4. Thay bốn chỗ gọi; xoá thân cũ. Không đổi chữ ký công khai của `format_iso8601`/`format_iso_now` (caller khác giữ nguyên) trừ khi impact cho thấy chỉ một caller.
5. `cargo fmt --check`, `cargo clippy -p fgos-host-runtime -p fgos-observe -p fgos -- -D warnings` (UNPROVEN: repo có dùng `-D warnings` không; theo cấu hình CI hiện có).

## Kiểm chứng

- Hẹp trước: `cargo test -p fgos-host-runtime civil_time`, rồi `cargo test -p fgos-observe`, `cargo test -p fgos`.
- Rộng: `env -u CLAUDE_CODE_SESSION_ID npm test` (test Node bao phủ envelope `fgos.v1` và observe; `npm test` không hermetic trong phiên agent khi biến này còn).
- Tiêu chí 7 của plan: `rtk proxy rg -c 'Hinnant|civil' --glob '*.rs' packages apps` chỉ còn `civil_time.rs` (loại `target/`).
- `detect_changes()` trước commit chỉ chạm các symbol trên.

## Rủi ro

| Rủi ro | Khả năng × tác động | Giảm thiểu |
|---|---|---|
| Lệch một byte ở `generated_at` hoặc `data_hash` của envelope | Thấp × Cao (test golden/parity đỏ) | Giữ bảng test cũ; chạy cả `test/parity` qua `npm test`. |
| Sửa observe đụng việc đang chạy ở nhánh khác | Trung bình × Trung bình | Commit ngay khi xanh; kiểm `git log -3 -- packages/observe` trước khi bắt đầu. |

## Rollback

Revert một commit. Phase 02 phụ thuộc helper; nếu revert 01 sau khi 02 đã vào, revert 02 trước.

## Commit

`refactor(host-runtime): share one civil-date conversion across host and observe` (không ghi mã phase).

## Hiệu chỉnh sau red-team (2026-10-06)

Mục này **thắng** nội dung cũ của phase khi mâu thuẫn. Bằng chứng đã được lead tự đo lại (script hoặc `rtk proxy`), chi tiết ở bảng Red Team Review trong `plan.md`.

- **Có bảy bản, không phải bốn** (`rtk proxy rg -n -l 146097`, loại `target/`): `apps/fgos/src/cli_presenter.rs`, `packages/observe/rust/src/{time.rs,store_lock.rs,scorecard.rs}`, và ba bản plan bỏ sót: `packages/observe/rust/src/sources/claude_transcripts.rs:77`, `packages/observe/rust/src/metrics_cli/snapshot.rs:96-98`, `packages/distribution/rust/src/init.rs:413-415` (crate khác, ngoài bảng sở hữu file cũ).
- Phân loại từng bản (giống hệt hay khác ngữ nghĩa): `scorecard::parse_iso_secs` chỉ đọc 19 ký tự đầu và bỏ múi giờ, còn `time.rs` kiểm khoảng ngày và áp offset; gộp chúng vào một hàm có offset đổi kết quả đo cho timestamp có offset. Chỉ gộp các bản **chứng minh được giống hệt** bằng test; bản còn lại được liệt kê thành các "bản còn sống" kèm lý do, là việc riêng chưa lên lịch.
- **Tiêu chí 7 viết lại:** tìm hằng số thuật toán (`146097|719468`), không tìm chữ `Hinnant|civil`; tiêu chí nêu danh sách bản còn sống mong đợi sau phase.
- Thêm vào Files và phân tích tác động: `packages/distribution/rust/src/init.rs`, `claude_transcripts.rs`, `metrics_cli/snapshot.rs`.
