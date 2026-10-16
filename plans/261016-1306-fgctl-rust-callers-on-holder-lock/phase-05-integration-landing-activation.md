# Phase 05: tích hợp, full test, dừng-toàn-bộ, cài `fgctl` mới, activate 3 workspace, đặt hàng rào

Lead làm. Kết thúc phase này mở khoá landing của 4.3.

## A. Tích hợp

1. Worktree `.claude/worktrees/rc-integration`, nhánh `rust-callers/integration` từ main sau khi 4.2 land. Đầu mỗi wave `git merge --ff-only main`; không được thì rebase và báo các phase đang chạy.
2. Merge P00 → P01 → P02 → P03 → P04. Sau mỗi merge chạy test hẹp của phase đó. Chỉ `Cargo.lock` và hai hunk rời của `test/rust-host/fgctl-init-activation.test.mjs` (P01, P02) được phép xung đột.
3. `cargo build -p fgos -p fgctl` (target qua biến `CARGO_TARGET_DIR`, tuần tự hoá nếu dùng chung với track khác).
4. Full suite trên đúng binary: `env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN="$TARGET_DIR/debug/fgos" npm test`; `cargo test --workspace`; `cargo check -p fgos-distribution -p fgos-observe -p fgctl --target x86_64-pc-windows-msvc --target aarch64-apple-darwin`; `rg` theo tiêu chí 3 của [plan.md](plan.md#tiêu-chí-xong). Ghi commit, binary, kết quả vào báo cáo (đường dẫn lấy bằng `fgos convention path`).
5. Review độc lập một vòng (Opus) trên `main...rust-callers/integration`: description không rò sang `run_tail`, thứ tự D3, không còn đường v1 (trừ nhánh D2 có chủ đích).

## B. Bằng chứng hàng rào với code v1 thật (trước khi cài `fgctl` mới)

Trên workspace tạm + `FGOS_STATE_HOME` tạm, dùng binary **đang cài** (`which fgctl`, trên máy này `~/.local/bin/fgctl`; `fgos` của activation hiện tại):
1. Chạy `placeFences` (qua `fgos doctor --fix` build từ nhánh tích hợp, trỏ vào workspace tạm).
2. `fgctl init` cũ → thất bại (activation hoặc install tombstone); `fgos observe case …` cũ → `observe-lock-timeout` sau ~5 s. Ghi mã thoát và stderr vào báo cáo; nếu có lời gọi treo không timeout thì dừng landing, sửa hàng rào.

## C. Landing dừng-toàn-bộ

1. Dừng mọi writer ở forgentX, mdview, mcp-skill-hub (phiên agent, `fgos run`, workflow runner, `fgos gateway stop`, runner nền, pane agy/pi/omp).
2. Merge `rust-callers/integration` vào main bằng ff trong main checkout.
3. Cài `fgctl` mới: `cargo build --release -p fgctl`, giữ bản cũ thành `fgctl.pre-rust-callers` cạnh nó (để đối chứng B nếu cần), chép bản mới đè lên đường `which -a fgctl` trả về; `which -a fgctl` chỉ còn một.
4. Build/stage/activate release mới ở ba workspace bằng `fgctl` mới (cổng vector + probe ngữ nghĩa của 4.2 chạy mỗi lần).
5. Mỗi workspace: `fgos doctor --fix` cho `lock-fences` (kiểm dừng → đặt hàng rào → kiểm lại). `install` (phạm vi máy) đặt một lần ở workspace đầu; hai workspace sau báo đã có.
6. `fgos doctor` qua shim ở cả ba: `active-release-matches-checkout`, `lock-fences`, `lock-kernel-semantics`, `lock-borrow-vectors`, `state-root` pass; `lock-holders` không có holder lạ.
7. Xoá `fgctl.pre-rust-callers`. Mở lại việc. Ghi báo cáo landing (commit, ba activation id, kết quả doctor), kèm "No component-boundary change".
8. Báo Lead của 4.3: điều kiện landing main checkout đã thoả.

## Rollback

- Trước C5: revert merge trên main; chép lại `fgctl.pre-rust-callers`; activate release trước ở ba workspace.
- Sau C5: như trên, thêm `rm -r` ba thư mục tombstone theo danh sách `fenceStatus` (activation, observe ở mỗi workspace; install một lần dưới `stateRoot`). Lock mới dưới `.fgos/locks/` để nguyên (file rỗng, vô hại).

## Tiêu chí nghiệm thu

Tiêu chí 1–6 của [plan.md](plan.md#tiêu-chí-xong); báo cáo có bằng chứng B và doctor ba workspace.
