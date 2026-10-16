# Phase 12: tích hợp, full test, dừng-toàn-bộ, activate 3 workspace, đặt hàng rào

Lead chính làm.

## A. Tích hợp

1. Worktree `.claude/worktrees/hl-integration`, nhánh `holder-lock/integration` từ main lúc bắt đầu P00. Đầu mỗi wave: `git merge --ff-only main`, không được thì rebase và báo các phase đang chạy.
2. Merge theo thứ tự P00 → P01 → P02 → P03 → P04 → P05 → P11 (docs) → P06 → P07 → P08 → P09 → P10 → P11 (check). Sau mỗi merge chạy test hẹp của phase đó trên nhánh tích hợp. Chỉ `Cargo.lock` được phép xung đột (sinh lại bằng `cargo build`); xung đột khác là vi phạm sở hữu file → trả về executor.
3. `cargo build -p fgos -p fgctl` trong worktree tích hợp (tuần tự hoá nếu dùng chung `CARGO_TARGET_DIR`).
4. **Full suite trên đúng binary:** `env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN="$TARGET_DIR/debug/fgos" npm test` (đường target qua biến shell); `cargo test --workspace`; `cargo check -p fgos-process -p fgos-holder-lock --target x86_64-pc-windows-msvc --target aarch64-apple-darwin`; `rg` xác nhận không còn đường v1 của 10 lock (tiêu chí 5 của plan.md). Ghi commit, binary, kết quả vào `reports/` của plan (tên lấy bằng `fgos convention path`).
5. Một vòng review độc lập (Opus, tối đa 2 vòng) trên `main...holder-lock/integration`: luật description, kiểm dừng-toàn-bộ, không còn đường v1.

## B. Landing dừng-toàn-bộ (quyết định A1)

1. **Dừng mọi writer:** phiên Claude/Codex trên forgentX, mdview, mcp-skill-hub; `fgos run`/workflow runner; `fgos gateway stop` ở mỗi workspace; runner nền; pane agy/pi/omp; đóng pane herdr rảnh.
2. Merge `holder-lock/integration` vào main bằng ff trong main checkout.
3. Cài `fgctl` mới, rồi build/stage/activate forgentX, mdview, mcp-skill-hub (cổng vector + probe ngữ nghĩa chạy ở mỗi lần activate).
4. Ở mỗi workspace: `fgos doctor --fix` cho `lock-fences` (kiểm dừng → đặt hàng rào → kiểm lại). Có blocker → dừng process đó rồi chạy lại.
5. `fgos doctor` qua shim ở cả ba: `active-release-matches-checkout`, `state-root`, `lock-kernel-semantics`, `lock-borrow-vectors`, `lock-fences` pass; `lock-holders` không có holder lạ.
6. Rebase các worktree đang mở lên main mới (nhánh cũ gặp hàng rào ở gateway/sessions/runner/dispatch sẽ báo lỗi to tiếng).
7. Mở lại việc. Ghi báo cáo landing.

## Rollback

- Trước bước B4: revert merge trên main, activate release trước ở ba workspace.
- Sau B4: dừng mọi writer; revert merge; activate release trước; gỡ hàng rào: `rm -r` các thư mục `TOMBSTONE` theo danh sách `fenceStatus` in ra, và ở mỗi thư mục ledger publish thêm một thế hệ copy thế hệ chặn kèm `releasedAt` (hoặc xoá thư mục ledger: anh đã chấp nhận xoá state làm lại). Ghi lại lệnh đã chạy.

## Tiêu chí nghiệm thu

Tiêu chí 9 của [plan.md](plan.md#tiêu-chí-xong); báo cáo có commit, binary, kết quả suite, doctor ba workspace.
