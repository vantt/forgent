# Phase 09: tích hợp, T8 herdr chạy lại, 5 CLI thật, landing

Lead làm.

## A. Tích hợp

1. Worktree `.claude/worktrees/tm-integration`, nhánh `terminal-mode/integration` từ main sau 6.2 + 6.5. Đầu mỗi wave `git merge --ff-only main`.
2. Merge theo thứ tự ở [plan.md](plan.md#phase-và-phụ-thuộc); test hẹp sau mỗi merge.
3. `cargo test --workspace`; `env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN=<build> npm test`; `rg` tiêu chí 6.
4. Review độc lập một vòng (Opus) trên `main...terminal-mode/integration`: M3 (chỉ uid), `SCM_RIGHTS` + CLOEXEC, scrub ở gate, không còn quyết định nào trong controller, S2.

## B. Nghiệm thu trên herdr thật (máy anh, tab riêng)

1. 12.3 ba ca với herdr thật (tiêu chí 2).
2. T8 herdr chạy lại (executor `claude-herdr`, invocation `claude-herdr-bwrap`, tác vụ `sleep 50` ×3, read-only), qua `npm run fgos:dev -- run …`: hA (không kill) pass; hB (SIGKILL controller) và hC (SIGTERM) → worker xong, settle đủ, pane `release`, home còn tới khi agent xong rồi được dọn, `inspect` không còn `running/bound`; hD (`--timeout 2m`, ×4) → dừng ở 2 phút, receipt `timeout`, pane `retain`. Kiểm không pane mồ côi (`herdr pane list`).
3. Một round mỗi CLI (claude, codex, agy, pi, omp) qua `fgos run … --provider <herdr executor>`: brief giao đúng một lần, settle đủ; panel 3 seat cùng `groupKey` cùng tab.
4. Env agent mỗi CLI: `FGOS_SESSION_ID=att-…`, không id của cha (codex: theo kết luận P01).
5. Báo cáo (đường dẫn qua `fgos convention path --json </dev/null`).

## C. Landing (dừng toàn bộ)

1. Ba workspace: dừng mọi writer, round herdr chạy xong, đóng pane rảnh.
2. Với release 6.2: `fgos doctor --fix </dev/null` (sweep) tới khi `run-attempts-stuck` sạch; dọn home bản 1 có `paneId` (không còn worker sống sau khi dừng) bằng reaper của release 6.2 một lần; kiểm không còn marker bản 1.
3. Merge ff vào main; build/stage/activate ba workspace; `fgos setup </dev/null`.
4. `fgos doctor </dev/null` ba workspace: `herdr`, `runtime-socket-dir`, `run-attempts-stuck`, `writer-identity-resolvable`, `active-release-matches-checkout` pass.
5. Smoke: một `fgos run` herdr nhỏ, một `fgos run` cli nhỏ.

## Rollback

Như plan.md: sweep bằng release 6.3 trước, revert, activate release 6.2.

## Tiêu chí nghiệm thu

Tiêu chí 1–7 của [plan.md](plan.md#tiêu-chí-xong).
