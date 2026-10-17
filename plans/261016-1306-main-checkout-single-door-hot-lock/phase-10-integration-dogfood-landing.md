# Phase 10: tích hợp, full test, dogfood, dừng-toàn-bộ, activate, hàng rào

Lead làm. Điều kiện vào: 4.4a P05 đã xong (`fgctl` mới activate ở forgentX, mdview, mcp-skill-hub).

## A. Tích hợp

1. Worktree `.claude/worktrees/md-integration`, nhánh `main-door/integration` từ main sau 4.2. Trước wave 2 rebase lên main có 4.4a (P08 cần).
2. Merge theo thứ tự ở [plan.md](plan.md#phase-và-phụ-thuộc). Sau mỗi merge chạy test hẹp của phase đó. Từ sau P04: full suite phải xanh.
3. `cargo build -p fgos -p fgctl` (target qua biến shell `CARGO_TARGET_DIR`).
4. `env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN="$TARGET_DIR/debug/fgos" npm test`; `cargo test --workspace`; `rg` tiêu chí 4; benchmark tiêu chí 5. Ghi vào báo cáo (đường dẫn bằng `fgos convention path`).
5. Review độc lập một vòng (Opus) trên `main...main-door/integration`: bất biến vùng găng nóng, thứ tự hạng, một commit của P04, không còn đường v1.

## B. Dogfood bắt buộc (bù quyết định "ném ngay" thay M5)

Một ngày làm việc thật trên forgentX với release build từ nhánh tích hợp, **trước** landing (activate dev qua `npm run fgos:dev` hoặc stage/activate tạm trong một clone, không đặt hàng rào ở workspace thật): `fgos take/pick/return/approve/sync-root`, workflow runner, checkpoint. Mọi `exec-under-hot-lock`, `hot-lock-reentry`, `lock-order-violation` → sửa trong phase sở hữu file, chạy lại suite. Báo cáo liệt kê lỗi đã gặp (hoặc "không gặp").

## C. Landing dừng-toàn-bộ

1. Kiểm `which -a fgctl` → một bản, là bản của 4.4a.
2. Dừng mọi writer ở ba workspace (phiên agent, `fgos run`, workflow runner, `fgos gateway stop`, runner nền, pane). Không còn process giữ `events.lock`/`claims.lock` v1 (`ls`, `lock-status` cũ).
3. Merge `main-door/integration` vào main (ff trong main checkout).
4. Build/stage/activate ba workspace (cổng vector + probe của 4.2 chạy).
5. Mỗi workspace: `fgos doctor --fix` cho `lock-fences` (kiểm dừng → tombstone main-checkout, merge-slot mọi ref, events.lock, claims.lock, porting → kiểm lại).
6. `fgos doctor` qua shim ở ba workspace: `active-release-matches-checkout`, `lock-fences`, `lock-borrow-vectors`, `lock-kernel-semantics`, `lock-record-unreadable`, `main-checkout-hook-wired` pass; `lock-holders` không holder lạ.
7. Smoke: `fgos take` một item thử → `return`; commit tay ở main (hook qua); `fgos lock-status`.
8. Rebase các worktree đang mở lên main mới (hook nhánh cũ từ chối commit ở main, worker không bị ảnh hưởng).
9. Báo cáo landing (commit, activation id, kết quả doctor, bằng chứng hàng rào v1).

## Rollback

- Trước C5: revert merge, activate release trước ở ba workspace.
- Sau C5: dừng writer; revert; activate release trước; `rm -r` tombstone theo `fenceStatus`; xoá `.fgos/locks/state.hot`, `porting-events.hot` nếu còn. Event log/claim file không đổi định dạng.

## Tiêu chí nghiệm thu

Tiêu chí 1–6 của [plan.md](plan.md#tiêu-chí-xong); báo cáo dogfood và landing.
