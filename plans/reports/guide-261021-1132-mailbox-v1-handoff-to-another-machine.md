# Bàn giao mailbox cho máy khác: bắt đầu từ V1

Ngày 2026-10-21. Phiên `d50dc90b` ký G0 cùng chủ dự án rồi bàn giao. Người nhận không có lịch sử chat. Đọc theo thứ tự dưới đây.

## Trạng thái một câu

G0 đã ký (2026-10-20). Không có dòng mã nào. Việc kế tiếp là V1: crate thuần `fgos-mailbox-core`. V1 và V3 không chờ ai; V2, V4, V5 chờ các tiền đề của thành phần khác (bảng dưới).

## Đọc gì, theo thứ tự

1. `docs/platform/agent-mailbox/spec.md`: mục 14 (cái gì đã ký, thang V1–V7, quy tắc dừng), mục 5 (mô hình lõi), mục 17 (mọi quyết định của chủ dự án; đừng lật lại).
2. `plans/reports/research-261021-1132-mailbox-spec-second-panel-explanation.md`: phán quyết của hội đồng lần hai và lý do từng sửa đổi A1–A6, A10. Bản chép nguyên văn, không phải phê duyệt.
3. `plans/reports/research-261020-2140-mailbox-trusted-sender-print-mode-measurement.md`: số đo trusted-sender cho Codex (chỉ cho biết chiều).
4. Board: hàng `MAIL` ở `plans/261017-1313-fgos-platform-program-board/plan.md` và các dòng cùng tên trong `log.md`. Đọc board và `git pull` trước khi bắt đầu.

## V1: làm gì

Theo bảng ở mục 14: crate `fgos-mailbox-core` tại `packages/mailbox/rust/core`, chỉ phụ thuộc `serde`, thêm vào workspace `Cargo.toml`. Không I/O, thời gian và nguồn id là tham số. Lệnh chứng minh: `cargo test -p fgos-mailbox-core`.

Test bắt buộc (mục 11, "Core suite"; chỉ những mục không cần file hay tiến trình thứ hai):

- ví dụ phản biện A→B, B→C, C→A, A→B: độ sâu vẫn 0, phanh dừng chu trình là ngân sách phiên, trần cả đời, cửa sổ lăn hoặc hàng đợi;
- cặp kịch bản không có model: quota wake dừng ở tin thứ 6, độ sâu 8, trần wake cả đời 101;
- **effective wake**: một trường dẫn xuất tính lúc `send`, quota tiêu ở `send`, nudge và Stop drain chỉ đọc trường đó;
- bảng đăng ký bốn dòng (cùng head làm mới; `Record` khác trong khi head cũ `Alive` là xung đột; `Unknown` giữ nguyên; `Dead` thay thế và tăng generation một lần). Lõi nhận phán quyết `Alive/Dead/Unknown` làm đầu vào, không gọi `fgos_process`;
- thoát thân tin thù địch (thẻ đóng, khung giả, dòng chỉ dẫn giả), phân giải tên, claim/emit/finish với token, quét lười, giới hạn lần offer, bộ đếm từ chối có chặn.

Không tự đặt giá trị số: mọi số là khoá cấu hình (mục 12).

## Việc của thành phần khác (không thuộc mailbox, chưa ai nhận)

| Rung cần | Việc | Chủ |
|---|---|---|
| V2 | hàng `mailbox` (mutex, rank 80, scope repo) trong `packages/holder-lock/contracts/lock-registry.v1.json` và một dòng trong spec holder-lock | lane holder-lock |
| V4 | gốc ẩn của mailbox trong `BLIND_HIDDEN_ROOTS` (`src/runner/dispatch/confinement/resources.mjs`) và `docs/specs/confinement-authority.md` mục 9.2 | lane confinement |
| V5 | hàm Rust trả `.fgos` của **main checkout** cho mọi cwd; `resolve_target_root` (`apps/fgos/src/main.rs:123`) đi tới `.fgos` gần nhất nên không dùng được, vì mỗi linked worktree có `.fgos` riêng | lane host (`apps/fgos`), đã nhắn trên board |
| V5 | host xử lý route `hook` native cho kind `mailbox`, mọi kind khác vẫn sang legacy-node; mở rộng `commandIsKind` của `src/setup/agent-hooks.mjs` | lane host-invocation-routing |
| V3 hoặc V5 | `is_attempt_writer_id` export từ `fgos-session-identity` (hiện chỉ có `ATTEMPT_PREFIX = "att-"`) | lane session-identity |
| V7, Codex | dòng trusted-sender (ai khởi động head thì viết) và quy tắc dừng ở cuối V6 | lane runner/dispatch cho chỗ viết, chủ dự án cho quyết định |

Mỗi tiền đề phải được chủ của nó chấp nhận. Chủ từ chối là lý do mở lại thiết kế (spec mục 14).

## Chỉ nằm trên máy `d50dc90b`, không có trong git

- Bộ chạy đo còn lại: `.fgos/runtime/tmp/mailbox-probe7` (đo tiêm lệnh), `mailbox-probe8` (vòng lặp), `mailbox-probe9` (trusted-sender), tổng khoảng 4,5 MB, gồm lệnh chạy, chỉ dẫn, thân tin và kết quả thô. Kết quả đã nằm trong báo cáo; chỉ cần bộ chạy khi muốn đo lại. Sáu thư mục probe còn lại (khoảng 229 MB, gồm bản sao thư mục nhà Codex) đã xoá ngày 2026-10-21, không còn gì cần chuyển từ đó.
- Đầu ra thô của hội đồng: `.fgos/assignments/unit-run-1792504271864-ec79d45e` (tổng hợp) và `...-11102d7d` (giải thích). Bản giải thích đã chép vào repo ở mục 2 phía trên.
- Fixture hook cho V3: **không còn gì để chuyển.** Bộ cũ chỉ có ba payload `Stop` mỗi CLI và đã bị xoá cùng các probe; V3 ghi lại từ đầu trên máy nhận bằng đúng phiên bản CLI đã kiểm (Claude Code 2.1.303 hoặc 2.1.304, Codex 0.162.1, agy 1.4.2), gồm cả `PostToolUse`, rồi xoá id phiên đầy đủ và đường dẫn nhà trước khi đưa vào test.

## Ràng buộc đã nêu từ chủ dự án

- Tin của agent khác không bao giờ mang quyền của người dùng. Lõi không có I/O. Component authority và boundary là mối quan tâm hàng đầu: một thẩm quyền, một nguồn.
- Luôn sắp xếp để mã kiểm chứng được sớm nhất (thang V1–V7).
- Không in khoá, token, giá trị trong `.fgos/secrets.local.env`; so sánh bằng băm.
- Khi chạy CLI để đo: bỏ mọi biến `HERDR_*`, không in id phiên đầy đủ, dọn tmux và thư mục nháp.
- Trước khi giao việc ra ngoài lượt: `fgos dispatch decide ...`; đừng tự quyết cơ chế.
- Commit chỉ thêm đường dẫn rõ ràng; trong checkout chung có thể có thay đổi chưa commit của người khác (`AGENTS.md`, `.claude/settings.json` ở máy này) mà đừng đụng.
- Dòng `CHANGELOG.md [Unreleased]` đến ở V7; doctor check tối thiểu cũng ở V7 (quyết định của chủ dự án).

## Còn mở

1. `codex queue` khi Codex đang bận: chưa đo (S0).
2. Q16 ở mục 16 của spec: hình dạng của khoá tin cậy `inbound.<class>` chưa quyết.
3. Bố cục git lạ (submodule, bare repo kèm worktree) chưa kiểm cho hàm tìm `.fgos` main checkout.
4. Tồn dư nhỏ từ các phép đo trên máy `d50dc90b`, nằm ngoài repo trong thư mục nhà của từng CLI: transcript, hội thoại agy, file phiên pi và omp, và pane herdr `w6:p4S` còn hiện id phiên thăm dò. Các thư mục probe lớn đã xoá (2026-10-21); phần này chưa dọn vì chủ dự án chưa yêu cầu.
5. Lỗi thiết kế workflow `architecture-advisory` (chỉ dẫn "xuất JSON thô" lẫn sang reviewer và red-team qua `{objective}`) đã báo lane Seat Binding, chưa sửa.
