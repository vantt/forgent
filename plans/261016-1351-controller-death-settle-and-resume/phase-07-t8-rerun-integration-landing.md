# Phase 07: tích hợp, chạy lại T8 làm nghiệm thu, landing

Lead làm.

## A. Tích hợp

1. Worktree `.claude/worktrees/cd-integration`, nhánh `controller-death/integration` từ main sau 6.3. Đầu mỗi wave `git merge --ff-only main`.
2. Merge theo thứ tự ở [plan.md](plan.md#phase-và-phụ-thuộc); test hẹp sau mỗi merge.
3. `cargo test --workspace`; `env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN=<build> npm test`.
4. Review độc lập một vòng (Opus) trên `main...controller-death/integration`: resume không chạy lại, CAS của recover giữ, không nhánh test trong code, handler signal.

## B. Chạy lại T8 (máy anh, CLI thật, release dev qua `npm run fgos:dev`)

Cùng cách làm T8 §2 (tác vụ read-only `sleep 50` ×N, `--rigor low`, route herdr `claude-herdr`/`claude-herdr-bwrap`, route cli `deepseek`/`pi-cli-bwrap-openrouter`, launch `setsid nohup`, kill ~25 s sau khi launch, chỉ kill pid mình tạo). Script đặt ở `.fgos/runtime/tmp/t8-rerun/`.

| Ca | Kỳ vọng sau 6.2–6.4 |
|---|---|
| hA, cA | pass, đủ file (như T8) |
| hB, cB (SIGKILL controller) | worker sống tới xong; attempt settle bởi supervisor (`result.json`, `exit.json`, receipt, receipt bước); home dọn sau khi agent xong, không trước; pane `release`; `inspect` → `awaiting-resume`; `recover` → `adopt` hoặc không cần; `--resume` → không `runs/02`, `unit-summary.json` có |
| hC, cC (SIGTERM controller) | controller ghi `cancel` → receipt `cancelled` trong `cancelWaitMs`, exit 143; unit `awaiting-resume`; `--resume` → attempt mới (vì `cancelled` không phải pass) với `supersedesRunId` |
| hD, cD (SIGKILL + `--timeout 2m`) | deadline thi hành ở 2 phút: receipt `timeout`, cháu chết, pane `retain`; settle `timeout` |

Thêm: `legacy-attempts-stuck --fix` trên 6 attempt kẹt của T8 gốc (bảng T8 §4.1) → settle hoặc lý do giữ.

Báo cáo (đường dẫn qua `fgos convention path --json </dev/null`): bảng tám ca so với T8 §1, id run, thời gian, pane/home quan sát mỗi 15 s.

## C. Landing (dừng toàn bộ)

1. Ba workspace: dừng mọi writer.
2. Merge ff vào main; build/stage/activate ba workspace; `fgos setup </dev/null`.
3. `fgos doctor </dev/null`: `legacy-attempts-stuck`, `units-awaiting-resume`, `run-attempts-stuck`, `active-release-matches-checkout` pass/warn đúng.
4. Smoke: một `fgos run` + Ctrl-C + `--resume`.
5. Báo cáo landing, ghi `No component-boundary change`.

## Rollback

Revert merge, activate release 6.3.

## Tiêu chí nghiệm thu

Tiêu chí 1–7 của [plan.md](plan.md#tiêu-chí-xong); bảng B đạt đủ tám ca.
