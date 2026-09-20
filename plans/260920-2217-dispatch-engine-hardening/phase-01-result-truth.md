# Phase 01 — Result truth: no false success

Wave 1 · Gate: none (L6 chờ D3) · Findings: H4, H5, M4, M14, L6, L7. Context: review §H4/H5/M4/M14, Phụ lục 5.

Nhỏ nhất, giá trị cao nhất: hai consumer quyết "thành công" hôm nay bỏ qua fail-closed của RunResult v2. Diff tổng ≈ 20 dòng code + tests.

## Status — 2026-09-21

**R2, R3 xong** (commit `26f53318`, 868 test qua mọi file chạm `buildDispatchResult`/`normalizeRunResultV2`/`agentClaim`/reconcile/recovery). **R1, R4 BLOCKED** — cả hai nằm trong `session-engine.mjs`, file đang có diff 953 dòng (171 thêm/782 xoá) chưa commit từ track `coordination-skill-harness-simplification` (phase-02-semantic-request-composers). Sửa đè lên refactor 782-dòng-xoá đang dở là rủi ro thật (mất trắng nếu track kia reset/rebase, không cứu được vì chưa ai commit). **Chờ track đó commit/đóng, hoặc anh quyết cách khác** (xem cuối file). R5/R6 chưa làm (R5 phụ thuộc D3 đã quyết nhưng chưa triển khai; R6 dời sang Phase 04 cùng attestation).

Khi sửa R3 (M4), phát hiện một gap tiền tồn tại ngoài phạm vi review gốc: `claimInvalid` được tính ở cả hai settle call site nhưng **chưa bao giờ được truyền vào** `normalizeRunResultV2` — "fails closed on malformed/invalid agent-result.json" (Step 04 §5.2) trước đây chỉ đúng *tình cờ*, qua field `.status` của claim giả mạo. Đã vá cùng lúc (nằm trong commit `26f53318`): truyền `claimInvalid` ở cả hai call site + thêm nhánh confidence-classification cho `claimInvalid` trong `run-result.mjs`.

## Requirements

- R1 **[BLOCKED — session-engine.mjs in-flight]** Evaluator (session-engine) chỉ chấp nhận RunResult đã qua `interpretRunResult`; `contractCorrupt === true` → failed.
- R2 **[DONE]** `verifiedSha` chỉ khi `status === 0` và outcome không `timeout/failed`.
- R3 **[DONE]** Không synthesize worker claim; basis `valid-agent-result-claim` chỉ khi có file claim thật. (Mở rộng: `claimInvalid` nay được truyền đúng vào `normalizeRunResultV2` ở cả hai call site — xem Status ở trên.)
- R4 **[BLOCKED — session-engine.mjs in-flight]** Evaluator resolve report path qua `resolveWorkerArtifactPath`, không hardcode `agent-report.md`.
- R5 **[chưa làm]** (sau D3, đã quyết: ghi `result.superseded.json`) superseded controller's late result ghi file thay vì refuse thẳng.
- R6 **[dời sang Phase 04]** Attribution: khai `attributionVersion:'correlation-only'` trong RunResult tới khi attestation được nối.

## Files

- `src/runner/coordination/session-engine.mjs:275-284, 304-316` (R1), `:4088-4090` (R4)
- `src/runner/dispatch/result-ladder.mjs:58` (R2)
- `src/runner/dispatch/assignment-runner.mjs:2689-2694, 2820, 3045` + `run-result.mjs:381-383, 485-490` (R3); `:2410-2414, 2712-2716` (R5); `:2648, 3017` (R6)
- Tests: `test/runner/run-result-v2.test.mjs`, `test/runner/assignment-runresult.test.mjs`, `test/runner/dispatch.test.mjs` (ladder), `test/runner/coordination-*.test.mjs` (quorum với corrupt file)

## Steps

1. `impact` cho `readLinkedRunResultFromDisk`, `findLatestRunResult`, `buildDispatchResult`, `normalizeRunResultV2`; ghi blast radius.
2. R1: bọc `JSON.parse(raw)` bằng `interpretRunResult`; test: file `classification.execution.status:failed` + compat `done/verified` → `classifySessionQuorum` cho failed.
3. R2: thêm điều kiện; test `[DONE]` + `status:1` / `'timeout'` → không `verifiedSha`.
4. R3: pass `agentClaim: null`; giữ summary dưới `runnerNote`; test no-claim run → `agentClaim` null, basis không có `valid-agent-result-claim`.
5. R4: dùng `resolveWorkerArtifactPath`; test herdr-spawn `outbox/report-1.md` pass revision check.
6. R5/R6 theo quyết định.
7. Docs: `assignment-run-runresult.md` §Addendum (giữ "fails closed" vì giờ đúng), §Confidence (receipt grade, D6), §Evidence Freshness (`proven` reserved), Negative test #16.

## Validation

`node --test` các file trên; sau đó `npm test` ngoài session. Test gaps review #9 xanh.

## Risk / rollback

R1 có thể làm một số session cũ có `result.json` v1 → `legacy-derived` (đã hỗ trợ). R2 có thể làm `fgos return` chạy verify nhiều hơn (đúng ý). Rollback từng R độc lập.

## R1/R4 blocked — cần anh quyết

Ba lựa chọn, không tự chọn thay anh vì đây là git-write trên file người khác đang sửa dở:

1. **Chờ** track `coordination-skill-harness-simplification` commit/đóng phase-02, rồi mở lại R1/R4.
2. **Hỏi trực tiếp** ai đang giữ track đó (nếu là phiên khác của anh) để họ commit checkpoint, hoặc cho phép em sửa trên đúng bản họ đang có (`git stash`/coordinate qua họ, không tự ý).
3. Nếu track đó đã **bỏ dở/không còn hiệu lực**, anh xác nhận để em `git checkout -- src/runner/coordination/session-engine.mjs` khôi phục về bản sạch trước khi sửa R1/R4 — **destructive, cần anh xác nhận rõ ràng trước khi em chạy**.
