# Phase 04 — Live proof và rollout

Lease: `facade-live-proof` | Vào được sau: P03

## Mục tiêu

Đo end-to-end rằng facade vận hành được plan nhiều cell và thực sự giảm lãng phí test trước khi mở lại các kế hoạch đang chờ.

## Requirements

R1. Dùng track fixture ít nhất hai cell:

- cell A thay đổi hẹp, chỉ focused/affected;
- cell B chạm một full trigger và phải chạy full;
- giữa hai cell phải dừng process rồi resume bằng fresh code-panel invocation.

R2. Trace phải ghi role, command, duration, tree hash, environment fingerprint, result và reuse/escalation reason.

R3. Reviewer và red-team độc lập thật; mutation chỉ ở role được phép; close dùng quorum engine.

R4. Full suite chạy không quá một lần trên cùng final tree/environment. Final
integration bắt buộc sync latest `main` vào track trước, resolve tại track,
chạy full proof tại đó, rồi mới merge track ra `main`. Nếu post-merge tree hash
và environment fingerprint không đổi, phải reuse proof; không chạy full lần
hai chỉ vì commit SHA khác.

R5. Chạy thêm một direct single-cell live smoke để chứng minh facade không làm đường ngắn đắt hơn.

R6. Sau proof xanh, inventory P00 được cập nhật bằng lệnh resume cụ thể cho từng plan đang tạm dừng.

R7. Nếu `main` tiến thêm hoặc merge/conflict resolution làm đổi tree/environment,
không fix trực tiếp trên `main`. Sync lại vào track, resolve/fix, chạy proof cho
state mới rồi merge lại. Trace phải ghi lý do proof cũ stale.

## Files

- Add: `docs/architect/agent-coordination/verification/code-panel-multicell-facade/proofs/p04/**`
- Add/Edit: `docs/architect/agent-coordination/verification/code-panel-multicell-facade/{index.md,current-cell.md,p04.md}`
- Add: `plans/260915-code-panel-multicell-facade/reports/track-closeout.md`
- Edit: `plans/260915-code-panel-multicell-facade/plan.md` (status/evidence only)
- Edit: `CHANGELOG.md` only if rollout evidence exposes a user-visible correction
- Must not edit: source implementation except through a recorded accepted finding/fix round for P04's own scoped fixture

## Steps

1. Chạy fixture multi-cell qua `fgos-code-panel`, lưu hai cell traces.
2. Kill/restart ở checkpoint đã chọn và resume không truyền chat context.
3. Chạy direct single-cell smoke.
4. Merge latest `main` vào track; resolve mọi conflict trong track worktree.
5. Chạy `npm test` đúng một lần trên final integrated track tree và lưu
   `testedSha`, tree hash, environment fingerprint.
6. Merge track ra `main`; so sánh post-merge tree/environment với proof ở bước
   5. Nếu giống, record proof reuse và không chạy test lại.
7. Nếu khác, quay lại bước 4 với latest `main`; không vá hoặc chứng nhận trực
   tiếp trên một untested main tree.
8. So sánh baseline P00: số full runs, tổng thời gian test, duplicate commands và failures phát hiện.
9. Viết closeout, regenerate projections/index cần thiết, cập nhật `CHANGELOG.md`.
10. Với từng plan bị dừng, ghi `current cell`, `next command/action`, `coordination id`, và condition còn thiếu; chỉ sau đó tuyên bố sẵn sàng tiếp tục.

## Validation

- Hai traces tái lập được và dẫn tới terminal closed track.
- Fresh resume không duplicate work.
- Full-suite count đáp ứng R4.
- Post-merge main tree hoặc reuse đúng proof của identical track tree, hoặc đã
  quay lại vòng sync/test; không tồn tại main tree được chứng nhận bằng proof
  của một tree khác.
- `npm test` xanh.
- Closeout trả lời rõ hiệu suất tốt hơn bao nhiêu, không chỉ nói “đã tối ưu”.
- Một phiên mới đọc plan + closeout có thể tiếp tục plan thật mà không hỏi lại lịch sử buổi sáng.

## Verification

```sh
node --test test/setup/skill-wrappers.test.mjs test/skills/fgos-mirror.test.mjs test/architecture.test.mjs
env -u CLAUDE_CODE_ENTRYPOINT -u CLAUDECODE -u CLAUDE_CODE_SSE_PORT npm test
test "$(git rev-parse "${TESTED_SHA}^{tree}")" = "$(git rev-parse "${MAIN_INTEGRATED_SHA}^{tree}")"
```

## Rollback

Nếu live proof fail, giữ các plan đang dừng và disable planned facade; direct code-panel cùng standalone plan-loop vẫn là fallback rõ ràng.
