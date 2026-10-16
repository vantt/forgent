# Phase 09: tích hợp, nghiệm thu trên herdr thật, landing

Lead làm.

## A. Tích hợp

1. Worktree `.claude/worktrees/tc-integration`, nhánh `terminal-control/integration` từ main sau 4.2. Đầu mỗi wave `git merge --ff-only main`; nếu 4.3 hoặc 4.4a đã land, rebase và giải xung đột chỉ ở `registrations.mjs`/`CHANGELOG.md`/docs (thêm dòng).
2. Merge theo thứ tự ở [plan.md](plan.md#phase-và-phụ-thuộc); test hẹp sau mỗi merge.
3. `cargo build -p fgos`; `env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN="$TARGET_DIR/debug/fgos" npm test`; `cargo test --workspace`; `cargo check -p fgos-terminal-control --target x86_64-pc-windows-msvc --target aarch64-apple-darwin`; `rg` tiêu chí 5.
4. Review độc lập một vòng (Opus) trên `main...terminal-control/integration`: luật 7.4, "core chỉ đóng pane do nó cấp", không đọc nhãn, một cửa herdr.

## B. Nghiệm thu trên herdr thật (máy anh, trong tab riêng tự tạo)

1. `cargo test -p fgos-terminal-control -- --ignored herdr_live` (P03 test 5).
2. Vector 7.4 trên herdr thật: lấp một tab nhóm tới giới hạn → pane kế mở tab mới cùng nhãn; không pane < min; không pane gốc rỗng.
3. Một round mỗi CLI (claude, codex, agy, pi, omp) qua `fgos run … --provider <herdr executor>` với release dev (`npm run fgos:dev`): settle đủ; panel 3 seat cùng nhóm vào cùng tab.
4. Ca lỗi: kill controller sau `allocate` → không ai đóng pane; `fgos doctor` `terminal-allocations` báo; restart herdr server giữa round → `carrier`/`unknown`, không đóng pane của server mới.
5. Ghi báo cáo (đường dẫn bằng `fgos convention path`): số đo, ảnh chụp layout (JSON `pane layout`), kết quả 5 CLI.

## C. Landing

1. Dừng writer dùng herdr ở ba workspace (round đang chạy xong hoặc dừng; pane rảnh đóng).
2. Merge ff vào main; build/stage/activate ba workspace; `fgos setup` (thư mục `stateRoot/terminal`, khoá `terminal` theo quy tắc project/global của P08).
3. `fgos doctor` ở ba workspace: `terminal-control`, `terminal-config`, `active-release-matches-checkout` pass.
4. Smoke: một `fgos run` herdr nhỏ; `/fgOS:terminal tsk-x` trong pane của anh.
5. Báo cáo landing, có ghi component-boundary đã đổi.

## Rollback

Revert merge, activate release trước. `stateRoot/terminal/` để nguyên hoặc xoá (cache record). Khoá `terminal` trong config: xoá tay nếu release trước từ chối khoá lạ (đã kiểm ở P08).

## Tiêu chí nghiệm thu

Tiêu chí 1–7 của [plan.md](plan.md#tiêu-chí-xong).
