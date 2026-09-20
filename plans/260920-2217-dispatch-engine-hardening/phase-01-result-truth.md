# Phase 01 — Result truth: no false success

Wave 1 · Gate: none (L6 chờ D3) · Findings: H4, H5, M4, M14, L6, L7. Context: review §H4/H5/M4/M14, Phụ lục 5.

Nhỏ nhất, giá trị cao nhất: hai consumer quyết "thành công" hôm nay bỏ qua fail-closed của RunResult v2. Diff tổng ≈ 20 dòng code + tests.

## Requirements

- R1 Evaluator (session-engine) chỉ chấp nhận RunResult đã qua `interpretRunResult`; `contractCorrupt === true` → failed.
- R2 `verifiedSha` chỉ khi `status === 0` và outcome không `timeout/failed`.
- R3 Không synthesize worker claim; basis `valid-agent-result-claim` chỉ khi có file claim.
- R4 Evaluator resolve report path qua `resolveWorkerArtifactPath`, không hardcode `agent-report.md`.
- R5 (sau D3) superseded controller's late result ghi `result.superseded.json`, không link.
- R6 Attribution: khai `attributionVersion:'correlation-only'` trong RunResult tới khi attestation được nối (hoặc nối attestation từ Phase 04).

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
