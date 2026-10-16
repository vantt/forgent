# Phase 12: tích hợp, full test, quiesce, merge, activate 3 workspace, cutover

Lead chính làm. Executor phase khác không chạy runbook này.

## A. Tích hợp

1. Worktree `.claude/worktrees/hl-integration`, nhánh `holder-lock/integration` tạo từ main lúc bắt đầu P00. Trước mỗi wave: `git merge --ff-only main` nếu được, không thì `git rebase main` và báo các phase đang chạy rebase.
2. Merge từng nhánh phase vào `holder-lock/integration` theo thứ tự: P00 → P01 → P02 → P03 → P05 → P04 → P11 (docs) → P06 → P07 → P08 → P09 → P10 → P11 (check). Sau **mỗi** merge chạy test hẹp của phase đó (lệnh trong phase file) trên nhánh tích hợp. Xung đột chỉ được phép ở `Cargo.lock` (sinh lại bằng `cargo build`); xung đột khác = vi phạm sở hữu file → trả phase về executor.
3. Build: `cargo build -p fgos -p fgctl` trong worktree tích hợp (`CARGO_TARGET_DIR` riêng của worktree nếu dùng chung target với worktree khác thì tuần tự hoá).
4. **Full suite trên đúng binary:** `env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN="$PWD/<target-dir>/debug/fgos" npm test` (biến đường dẫn target qua biến shell, không gõ literal). Thêm `cargo test --workspace` và `cargo check -p fgos-process -p fgos-holder-lock --target x86_64-pc-windows-msvc --target aarch64-apple-darwin`. Ghi commit + đường binary + kết quả vào `plans/261016-1104-holder-lock-kernel-lock-foundation/reports/` (tên lấy bằng `fgos convention path`).
5. Review độc lập một vòng (Opus reviewer, tối đa 2 vòng) trên diff `main...holder-lock/integration`, tập trung: luật description, phân loại payload cũ/mới của quiescence, đường v1 giữ nguyên văn.

## B. Landing (máy anh, một người dùng)

1. **Quiesce** mọi writer của fgOS trên máy: phiên Claude/Codex trên forgentX, mdview, mcp-skill-hub; `fgos run`/workflow runner; `fgos gateway stop` ở mỗi workspace; runner nền; pane agy/pi/omp. Đóng pane herdr rảnh.
2. **Catch-up worktree đang mở** (`git worktree list`) để `npm test` của chúng không treo ở hàng đợi full-suite cũ (P08 rủi ro): rebase lên main mới sau bước 3, hoặc ghi chú dùng `FGOS_FULL_SUITE_QUEUE=off`.
3. Merge `holder-lock/integration` vào main bằng ff trong main checkout (không `update-ref` từ worktree khác; không checkout nhánh trong main checkout).
4. Cài `fgctl` mới trước (để sàn và vector có hiệu lực), rồi build/stage/activate forgentX; `fgos doctor` qua shim: `active-release-matches-checkout`, `state-root`, `lock-kernel-semantics`, `lock-borrow-vectors` pass.
5. Activate cùng release ở **mdview** và **mcp-skill-hub** (họ máy dùng chung `lockRoot`), doctor ở cả hai.
6. **Cutover**, từng họ, ở từng workspace (họ máy chỉ một lần cho máy): `fgos lock cutover repo-files`, `dispatch-cwd`, rồi `machine-files`, `machine-ledgers`. Mỗi lần: pha 1 → pha 2 (đợi process cũ thoát; restart process sống lâu: gateway, runner nền, phiên agent đang mở) → bật. Họ `dispatch-cwd` chỉ bật khi đủ điều kiện D9.
7. `fgos doctor` ở cả ba: `lock-cutover` = `active` cho mọi họ, `lock-holders` không có holder lạ. Commit đầu tiên ở main sau đó chạy hook bình thường.
8. Ghi kết quả (họ, thời điểm, process cũ đã chờ) vào báo cáo landing.

## Rollback

- **Trước bước 6:** họ chưa bật; revert merge trên main + activate release trước (`previousArtifactDigest`, sàn chưa ghi nên `fgctl` cho phép).
- **Sau khi một họ bật:** quiesce → `fgos lock cutover <family> --revert` ở mọi workspace đã bật → chờ engine báo xong (không còn process v3 giữ) → chỉ được về release ≥ R-dual (chính release này): sàn đã ghi, `fgctl` từ chối thấp hơn (r4 §6.8 bước 6). Muốn về hẳn trước 4.2: gỡ file sàn bằng tay sau khi mọi họ đã revert và đã quét sạch process v3 — bước tay, ghi vào báo cáo.

## Tiêu chí nghiệm thu

Tiêu chí 8–9 của [plan.md](plan.md#tiêu-chí-xong-đo-được); báo cáo có commit, binary, kết quả suite, trạng thái họ ở ba workspace.
