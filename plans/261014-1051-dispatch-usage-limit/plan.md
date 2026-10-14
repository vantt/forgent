# Nhận diện hết hạn mức (usage limit) ở cửa dispatch

Status: **blocked — chờ kết luận council một-cửa** (Lead, 2026-10-14 10:45: không sửa code production tới khi Lead báo kết quả). Nhánh `feat/dispatch-usage-limit`. Plan cha: [dispatch-operator-improvements](../261014-1033-dispatch-operator-improvements/plan.md), lane C.

Council: [council-261014-1051-usage-limit.md](../261014-1033-dispatch-operator-improvements/reports/council-261014-1051-usage-limit.md). Báo cáo lane: [lane-c-261014-1051-usage-limit.md](../261014-1033-dispatch-operator-improvements/reports/lane-c-261014-1051-usage-limit.md).

## Nguyên nhân (proven)

- Lượt thật 2026-10-13 (`.fgos/runtime/tmp/doer-turn-07.out.json`): codex hết hạn mức, exit 1, HEAD đã tiến. `fgos dispatch execute` vẫn thoát 0 (`src/runner/dispatch/cli.mjs` case `execute` chỉ đặt exitCode khi throw). JSON trả `outcome: "unsignaled"` kèm head before/after. `result-ladder.mjs` hướng dẫn caller suy ra hoàn thành từ việc nhánh tiến, nên Lead đọc thành xong.
- Cửa Assignment/Unit (`settlement.mjs`) chỉ nâng exit khác 0 thành `provider-limit` khi gặp câu credential chết. Câu hạn mức rơi xuống `nonzero-process-exit` (đo ở `asgn_lead_cold_resumable_dag_op_062`). Vì vậy `run.mjs` không xoay account, không đi candidate kế. Decision 0050 tự ghi: "cli-spawn không có phát hiện limit nên headless không fallback".
- Prior art dùng lại được:
  - `classifyProviderCapacityFault` + `parseQuotaResetWindowMs` / `parseQuotaResetClockTime` (quarantine `quota-limit` tạm thời);
  - `AUTH_FAILURE_PATTERNS` (mẫu module không import, đọc 5 dòng cuối);
  - xoay account rồi candidate kế (0058);
  - danh sách màn hình herdr `DEFAULT_USAGE_LIMIT_PATTERNS`.
- `git log -S'usage limit'`: chưa từng có bộ phát hiện cho cli-spawn bị gỡ đi.

## Phase 1 — đúng với mọi hình dạng cửa (làm ngay khi được mở khoá)

1. Thêm module thuần `src/runner/dispatch/provider-quota-failure.mjs`, sibling của `provider-auth-failure.mjs`:
   - `QUOTA_LIMIT_PATTERNS`: chỉ câu codex đã đo, neo `^ERROR:`;
   - `matchQuotaLimitLine(text, { tailLines: 5 })`;
   - chuyển hai parser reset sang đây (re-export từ `provider-capacity.mjs`).
2. `settlement.mjs`: exit khác 0, không timeout, không claim, không có câu auth, có câu quota ở đuôi → `provider-limit` với `cause: 'quota'` cùng `retryAt` (chỉ khi provider ghi giờ). Rotation/fallback ở `run.mjs` chạy được mà không cần sửa.
3. `classifyProviderCapacityFault`: xoá regex OpenAI quét toàn stderr, gọi classifier chung. Hành vi đổi theo hướng an toàn.
4. `result-ladder.mjs`: exit khác 0 mà không có token thì không còn `unsignaled` (`nonzero-process-exit`, giữ head before/after, thêm `branchAdvanced`). Câu quota → provider-limit/quota/retryAt.
5. Spec `docs/specs/runner.md`: decision mới thay câu "cli-spawn không có phát hiện limit" của 0050. Thêm một dòng `## [Unreleased]` vào CHANGELOG. Sửa `core/skills/_shared/executor-dispatch-fallback.md` (exit khác 0 vẫn có một dòng JSON, `retryAt`/basis) rồi `npm run build:skills`.

## Phase 2 — phụ thuộc kết luận một-cửa (chưa quyết)

- Envelope và tên trường (`failure.cause` + `failure.retryAt` trong RunResult; `providerLimit{}` hay field top-level trong JSON của execute; hay hai trục `completion` / `providerDisposition` của panelist-2).
- Mã thoát của `execute`: khác 0 chung, hay một category mới đăng ký trong `EXIT_CODES`. Không dùng 75 khi chưa đăng ký. Cần test cửa Rust giữ nguyên mã.
- Mốc đủ-điều-kiện của run cạn (tên trường, phạm vi) lưu ở unit record và hiện trong status/stale.

## Ngoài phạm vi (item riêng theo RUL11)

- Tự hẹn chạy lại: trạng thái park bền có `notBefore` do runner Workflow/Execution sở hữu. Cần spec trước.
- Đường credential quét toàn stderr trong `provider-capacity.mjs:1194-1199`.

## Test

Test đỏ đã viết, chưa commit theo lệnh Lead. Cả hai nằm trong worktree lane:

- `test/runner/execution/run-provider-failover.test.mjs`: "a usage limit on a headless round moves the seat to another account and records when to retry". Đỏ: `execution-failure`, không xoay.
- `test/runner/dispatch.test.mjs`: hai test `buildDispatchResult` (usage limit thì provider-limit + retryAt; câu chữ ở xa trong log của lượt thành công thì không khớp). Đỏ: `unsignaled`.

Hai test này đang ghim shape `providerLimit{}` và `failure.retryAt`, mà shape lại phụ thuộc Phase 2. Khi một-cửa chốt phải đổi tên trường cho khớp.

## Acceptance

- Lượt codex cli-spawn hết hạn mức: Unit xoay sang account khác, run.json ghi `provider-limit` / `quota` / `retryAt`. `execute` không còn trả `unsignaled` và không thoát 0.
- `npm test` xanh (chạy với `env -u CLAUDE_CODE_SESSION_ID`).

## Rủi ro / rollback

- Mới có một mẫu câu codex (đo theo giờ). Dạng reset theo ngày/tuần chưa đo, nên account cạn có thể bị thử lại mỗi giờ.
- Parser giờ phụ thuộc múi giờ máy.
- Resume sau commit dở chưa kiểm.
- Rollback: revert commit; không có migration dữ liệu.
