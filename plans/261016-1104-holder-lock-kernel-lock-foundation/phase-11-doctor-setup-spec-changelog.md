# Phase 11: doctor, setup, spec, component boundary, reading-map, CHANGELOG

Wave 2–3. Nhánh `holder-lock/p11-doctor-docs`, worktree `.claude/worktrees/hl-p11`. Phụ thuộc: spec/docs bắt đầu ngay khi P00 xong; check gắn code sau P02, P03, P04. Là chủ duy nhất của các file dùng chung bên dưới (cổng cài đặt trong AGENTS.md).

## Doctor (đăng ký trong `src/setup/registrations.mjs`, thân check ở module mới)

| Check | Làm gì | Kết quả |
|---|---|---|
| `lock-kernel-semantics` | Với mỗi thư mục lock (`<fgosDir>/locks`, `<lockRoot>`): hỏi `--guarantee` qua route; thêm một probe hai process thật (acquire EX ở con, probe ở cha) trên chính mount đó | In `{driver, exclusion, borrow, holders}`. `kernel` → pass; `kernel-unmeasured` (macOS) → pass kèm ghi chú X2; `legacy-v1` (không có driver: Windows ở 4.2) → **warn** "chạy giao thức v1, chờ driver 4.4"; `none` (fs mạng) → fail có tên. Không bao giờ fail chỉ vì nền |
| `lock-borrow-vectors` | Gọi `fgos internal lock-borrow-vectors` | Vector đỏ → **fail** (kongming M4). Driver `none`/`legacy-v1` → không áp dụng |
| `lock-holders` | Với mỗi lock 4.2 trong registry: `holders()`; holder không phải process fgOS (cmdline không có entry fgOS, không phải con trực tiếp đang chạy `runBorrowed` của một holder fgOS) → warn kèm pid/cmdline | `unlistable` → info. Monitor bwrap của attempt (kongming N1) chưa xuất hiện ở 4.2; luật đó thêm ở 6.2 |
| `lock-cutover` | Trạng thái từng họ (`v1`/`fenced`/`active`), sàn workspace và máy, process cũ còn sống | `fenced` lâu > 10 phút → warn. **Fix** = `fgos lock cutover --all` (engine P04, có quiescence; không fix được thì in lệnh và lý do) |
| `state-root` | In `stateRoot`, `lockRoot`, nguồn (env/XDG/HOME/ghim); kiểm Node và host ra cùng giá trị | Lệch → fail |
| `provider-capacity-lock-stale` (có sẵn, [`registrations.mjs:2242-2268`](../../src/setup/registrations.mjs)) | Họ `machine-ledgers` đã bật → không áp dụng (ledger không còn là mutex); chưa bật → hành vi cũ | Xoá hẳn ở phase 13 |

Setup: `fgos setup` tạo `<lockRoot>` (0700) và `<fgosDir>/locks` (đăng ký trong registry setup, cùng chỗ các thư mục setup khác tạo). Không thêm config default mới (không có khoá cấu hình nào ở 4.2).

## Docs

- Tạo `docs/platform/holder-lock/spec.md` (Lead D1): cổng 6.0 + bảng driver/mức; luật description 6.1.1 (8 điểm, vector bắt buộc, không có chế độ tắt mượn); kind; registry (trỏ tới file contract, không chép bảng); `LockScope` + lịch trace → cảnh báo → ném; cutover hai pha + sàn; state root; route nội bộ; "Lịch sử quyết định" (r1–r4, kongming M4/M5/N6, Lead D1–D9).
- Tạo `docs/platform/process/spec.md`: facts (bảng phán + vector), control phần 4.2, cổng trung lập OS, phần gate để 6.2.
- `docs/platform/component-boundary.md` §4: thêm hai dòng "Process Facts & Control (L0)" và "Holder-lock (L1)" (quyết định duy nhất, không bao giờ, phụ thuộc, nguồn), theo r4 §4.2; ghi Session Identity không cấp quyền lock (đã có).
- `docs/specs/reading-map.md`: thêm hai spec, `src/holder-lock/`, `packages/holder-lock/`, `packages/process/`.
- `docs/specs/distribution.md` dòng 71: thêm 5 check mới vào danh sách check đã đăng ký; ghi `lockProtocol` manifest + sàn ở phần activation.
- `docs/specs/runner.md`: chỉ sửa câu mô tả dispatch lock cwd (kernel lock sau cutover); lệch TTL cũ để 4.5.
- `CHANGELOG.md` `## [Unreleased]`: dòng của P06–P10 (văn bản trong từng phase), cộng: Added `fgos lock cutover`; Added 5 check doctor; Added sàn `lockProtocol` ở `fgctl` và vector mượn lúc activate; Changed host đặt `FGOS_STATE_ROOT` cho payload và dispatch ghim cho process con.

## File sở hữu

| Hành động | File |
|---|---|
| tạo | `src/setup/holder-lock-checks.mjs`, `test/setup/holder-lock-checks.test.mjs` |
| sửa | `src/setup/registrations.mjs`, `test/setup/checks.test.mjs` (danh sách id) |
| tạo | `docs/platform/holder-lock/spec.md`, `docs/platform/process/spec.md` |
| sửa | `docs/platform/component-boundary.md`, `docs/specs/reading-map.md`, `docs/specs/distribution.md`, `docs/specs/runner.md`, `CHANGELOG.md` |

## Test

`env -u ... FGOS_HOST_BIN=<build> node --test test/setup/holder-lock-checks.test.mjs test/setup/checks.test.mjs`; check chạy thật trên thư mục tạm: `lock-kernel-semantics` pass trên ext4/tmpfs; `lock-borrow-vectors` pass; `lock-holders` thấy một process lạ giữ lock (test mở fd bằng `flock` util-linux) → warn; `lock-cutover` hiện đúng ba trạng thái. Doc: `fgos convention check` trên file mới; link trong spec bấm được.

## Tiêu chí nghiệm thu

Năm check có trong `fgos doctor --json` với mức bảo đảm; `checks.test.mjs` cập nhật; spec trả lời được sáu câu L5 cho người lạ.

## Rollback

Revert commit; check mới chỉ đọc (trừ fix của `lock-cutover`, đi qua engine có revert).
