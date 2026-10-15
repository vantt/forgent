# Phase 06: Lead tích hợp — full test, quiesce, drain, activate

Lead chính làm phase này. Agent 5.1 chỉ chuẩn bị runbook.

## Thứ tự

1. Nhánh 5.1 rebase lên main mới nhất. Nếu W1' (beacon trong hook) đã land: giữ try/catch quanh lời gọi resolve trong hook ([phase-00 §8](phase-00-design-and-review.md#8-hook)). Test hook ở cả hai cấu hình: hook dùng chung qua `core.hooksPath` tuyệt đối và hook copy/tương đối.
2. **Full suite trên đúng binary của nhánh:** `cargo build -p fgos` trong checkout tích hợp, rồi `FGOS_HOST_BIN=<đường tuyệt đối tới target/debug/fgos vừa build> npm test` (ngoài phiên agent, hoặc `env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID`). Không để `ensureHostBin` nhận một binary cũ chỉ vì nó chạy được `version`. Ghi commit + đường binary vào evidence.
3. **Quiesce** (bản đang active vẫn là bản cũ). Dừng nhận việc mới ở mọi writer: phiên Claude/Codex đang làm việc trên repo, `fgos run`/workflow runner, gateway (`fgos gateway stop`), runner nền, pane agy/pi/omp/shell trần. Không mở claim mới tới khi bước 6 xong.
4. **Drain mọi claim mở** (`.fgos/runtime/claims/*.json`), bằng bản cũ:
   - Chắc chắn đổi id: claim của nhánh pid cũ (shell trần, pane codex qua daemon, agy/pi/omp). Có thể đổi: id chuỗi của process mang cả `CODEX_THREAD_ID` lẫn `CLAUDE_CODE_SESSION_ID`. `writerId` luôn là chuỗi trong file nên không lọc theo kiểu được: drain hết. Hôm nay (2026-10-15) có 12 claim mở, 3 giữ bởi `"2548"`.
   - Mỗi claim: chủ của nó settle/return/release; không còn ai làm được thì `releaseClaim` với `adminReason` (qua `fgos unclaim` khi liveness cho phép) và ghi lý do.
   - Worktree đang mở có merge-base trước 5.1 (`git worktree list` + `git merge-base --is-ancestor <5.1-commit> <branch>`): catch-up trước khi ghi state.
5. Merge vào main (ff trong main checkout), build/stage/activate ngay (`fgctl`).
6. **Restart** mọi process sống lâu đã import module cũ hoặc giữ `FGOS_HOST_BIN` cũ (gateway, runner nền, phiên agent đang mở). Chạy `fgos doctor` qua shim: `active-release-matches-checkout` và `writer-identity-resolvable` pass. Kiểm lại thư mục claim rỗng rồi mới mở lại việc.
7. Commit đầu tiên ở main sau activate: hook chạy với binary mới (không còn `host-version-mismatch`).

## Rollback

Trước activate: revert merge. Sau activate, theo đúng thứ tự: quiesce → drain mọi claim **bằng bản mới** (resolver cũ có thể không còn nhận mình là chủ claim mới) → activate release trước (`previousArtifactDigest`) → restart process sống lâu → doctor.
