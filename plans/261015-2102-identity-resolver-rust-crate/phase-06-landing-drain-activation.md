# Phase 06: Lead tích hợp — full test, merge, drain, activate

Lead chính làm phase này. Agent 5.1 chỉ chuẩn bị runbook.

## Thứ tự

1. Nhánh 5.1 rebase lên main mới nhất. Nếu W1' (beacon trong hook) đã land: giữ try/catch quanh lời gọi resolve trong hook ([phase-00 §8](phase-00-design-and-review.md#8-hook)).
2. `npm test` đầy đủ trên nhánh tích hợp, xanh (luật L5; ngoài phiên agent hoặc với `env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID`).
3. **Drain trước activate** (bản đang active vẫn là bản cũ):
   - Liệt kê claim mở: `.fgos/runtime/claims/*.json`, xem `writerId`.
   - Drain **mọi** claim mở. Chắc chắn đổi id: `writerId` là số (nhánh pid cũ: shell trần, pane codex qua daemon, agy/pi/omp). Có thể đổi: id chuỗi của process mang cả `CODEX_THREAD_ID` lẫn `CLAUDE_CODE_SESSION_ID` (thứ tự mới). Hôm nay (2026-10-15) có 12 claim mở, 3 giữ bởi `"2548"`.
   - Mỗi claim: chủ của nó settle/return/release bằng bản cũ; không còn ai làm được thì `releaseClaim` với `adminReason` (qua `fgos unclaim` khi liveness cho phép) và ghi lý do.
   - Worktree đang mở có merge-base trước 5.1 (`git worktree list` + `git merge-base --is-ancestor <5.1-commit> <branch>`): catch-up trước khi ghi state, vì `bin/fgos.mjs` của chúng còn resolver Node cũ.
   - Không mở claim mới từ shell trần/pane codex trong khoảng drain → activate.
4. Merge vào main (ff trong main checkout), build/stage/activate ngay (`fgctl`), rồi `fgos doctor` qua shim: `active-release-matches-checkout` và `writer-identity-resolvable` pass.
5. Commit đầu tiên ở main sau activate: hook chạy với binary mới (kiểm `host-version-mismatch` không còn).

## Rollback

Trước activate: revert merge. Sau activate: activate lại release trước (`previousArtifactDigest`), drain lại các claim lấy dưới id mới.
