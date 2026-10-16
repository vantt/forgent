# Phase 12: tích hợp, T8 cli chạy lại, CI ba nền, landing

Lead làm.

## A. Tích hợp

1. Worktree `.claude/worktrees/rs-integration`, nhánh `run-supervisor/integration` từ main sau 4.2 (và 4.3 trước khi merge P09). Đầu mỗi wave `git merge --ff-only main`; xung đột với 6.5 (cùng `cleanup.mjs`, `dispatch/cli.mjs`) giải theo ghi chú ở plan.md.
2. Merge theo thứ tự ở [plan.md](plan.md#phase-và-phụ-thuộc); test hẹp sau mỗi merge.
3. `cargo build -p fgos`; `cargo test --workspace`; `cargo check -p fgos-process -p fgos-run-supervisor -p fgos-agent-protocol --target x86_64-pc-windows-msvc --target aarch64-apple-darwin`; `env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN=<build> npm test`; `rg` tiêu chí 5.
4. `gh workflow run process-containment.yml --ref run-supervisor/integration`; ghi run id và kết quả ba nền.
5. Review độc lập một vòng (Opus) trên `main...run-supervisor/integration`: thứ tự 9.4, luật description, M1–M3, ma trận adopt, không IPC, không settle ở controller.

## B. Nghiệm thu thật (máy anh)

1. T8 cli chạy lại với executor thật (route của T8: `pi-cli-bwrap-openrouter`, tác vụ `sleep 50` ×3, read-only), qua `npm run fgos:dev -- run …`: cA (không kill), cB (SIGKILL controller), cC (SIGTERM controller), cD (SIGKILL + `--timeout 2m`, tác vụ 4 lần). Kỳ vọng: cA pass; cB, cC worker sống tới xong, settle đủ file, home dọn, `inspect` không còn `running/bound`; cD deadline thi hành ở 2 phút, receipt `timeout`.
2. Supervisor SIGKILL trong một run thật → `fgos run` kế tiếp adopt, settle từ outbox, không chạy lại model.
3. Ghi báo cáo (đường dẫn qua `fgos convention path --json </dev/null`): bảng kết quả, số đo scan adopt, mức chứa từng nền.

## C. Landing (dừng toàn bộ)

1. Ba workspace (forgentX, mdview, mcp-skill-hub): dừng mọi `fgos run`, workflow, gateway; chờ round đang chạy xong.
2. **Với release cũ**: chạy `fgos doctor --fix` phần credential homes + reaper một lần để dọn mọi home bản 1 của cli (D8); kiểm `/tmp/fgos-confinement` (và `FGOS_CONFINEMENT_TEMP_ROOT` nếu đặt) không còn marker bản 1 không `paneId`.
3. Merge ff vào main; build/stage/activate ba workspace; `fgos setup </dev/null` (thư mục socket runtime, khoá `dispatch.gateKillGraceMs` ghi ở config project).
4. `fgos doctor </dev/null` ở ba workspace: `process-containment`, `runtime-socket-dir`, `run-attempts-stuck`, `run-supervisor-route`, `gate-kill-grace`, `lock-holders`, `active-release-matches-checkout` pass.
5. Smoke: một `fgos run` cli nhỏ ở mỗi workspace.
6. Báo cáo landing, ghi component-boundary đã đổi.

## Rollback

Trước khi deactivate: chạy `fgos internal adopt --scan` (release 6.2) cho tới khi `run-attempts-stuck` sạch. Revert merge, activate release trước. Home bản 2 còn sót: release cũ giữ chúng (không hiểu `contract: 2`), dọn tay theo danh sách doctor của release 6.2 lấy trước khi rollback.

## Tiêu chí nghiệm thu

Tiêu chí 1–7 của [plan.md](plan.md#tiêu-chí-xong); B1–B2 đạt.
