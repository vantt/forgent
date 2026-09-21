# Phase 01 — Result truth: no false success

Wave 1 · Gate: none (L6 chờ D3) · Findings: H4, H5, M4, M14, L6, L7. Context: review §H4/H5/M4/M14, Phụ lục 5.

Nhỏ nhất, giá trị cao nhất: hai consumer quyết "thành công" hôm nay bỏ qua fail-closed của RunResult v2. Diff tổng ≈ 20 dòng code + tests.

## Status — 2026-09-21

**R2, R3 xong trên `main`** (commit `26f53318`, 868 test). **R1, R4 xong nhưng CHƯA MERGE** — `session-engine.mjs` ở `main` vẫn còn diff 953 dòng chưa commit từ track `coordination-skill-harness-simplification`, nên thay vì sửa đè lên đó, việc được làm trong một **worktree cô lập**: `.claude/worktrees/dispatch-hardening-phase01-r1r4` (nhánh `dispatch-hardening-phase01-r1r4`, rẽ từ `main`@`3d65657f`, commit `9049e611`, 476 test coordination xanh). Track kia hoàn toàn không bị đụng tới. **Merge vào `main` là bước riêng, chờ track kia commit/đóng** (xem cuối file) — git sẽ tự chặn an toàn nếu merge lúc `session-engine.mjs` vẫn còn uncommitted ở checkout chính, không có rủi ro mất dữ liệu ở bước merge. R5/R6 chưa làm (R5 phụ thuộc D3 đã quyết nhưng chưa triển khai; R6 dời sang Phase 04 cùng attestation).

Khi sửa R3 (M4), phát hiện một gap tiền tồn tại ngoài phạm vi review gốc: `claimInvalid` được tính ở cả hai settle call site nhưng **chưa bao giờ được truyền vào** `normalizeRunResultV2` — "fails closed on malformed/invalid agent-result.json" (Step 04 §5.2) trước đây chỉ đúng *tình cờ*, qua field `.status` của claim giả mạo. Đã vá cùng lúc (nằm trong commit `26f53318`): truyền `claimInvalid` ở cả hai call site + thêm nhánh confidence-classification cho `claimInvalid` trong `run-result.mjs`.

Khi sửa R1, hai test có fixture tự mâu thuẫn bị lộ ra (không phải bug của fix): `coordination-session-engine.test.mjs` giả định `readLinkedRunResultFromDisk` trả nguyên văn byte một `result.json` v1 thô, và `coordination-research-fan-out.test.mjs` có 3 fixture chỉ patch field `confidence` top-level thành `'verified'` mà không patch `classification.confidence.level` theo — đúng dạng bất nhất `contract-corrupt` được thiết kế để bắt. Cả hai đã sửa lại fixture cho đúng, chi tiết trong message commit `9049e611`.

## Requirements

- R1 **[DONE — nhánh `dispatch-hardening-phase01-r1r4`, chưa merge]** Evaluator (session-engine) chỉ chấp nhận RunResult đã qua `interpretRunResult`; `contractCorrupt === true` → failed.
- R2 **[DONE trên main]** `verifiedSha` chỉ khi `status === 0` và outcome không `timeout/failed`.
- R3 **[DONE trên main]** Không synthesize worker claim; basis `valid-agent-result-claim` chỉ khi có file claim thật. (Mở rộng: `claimInvalid` nay được truyền đúng vào `normalizeRunResultV2` ở cả hai call site — xem Status ở trên.)
- R4 **[DONE — nhánh `dispatch-hardening-phase01-r1r4`, chưa merge]** Evaluator resolve report path qua `resolveWorkerArtifactPath`, không hardcode `agent-report.md`.
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

## R1/R4 — chờ merge vào main

R1/R4 đã xong và test xanh, nằm cô lập trên nhánh `dispatch-hardening-phase01-r1r4` (worktree `.claude/worktrees/dispatch-hardening-phase01-r1r4`, commit `9049e611`), không đụng gì tới track `coordination-skill-harness-simplification`. Merge vào `main` cần một trong hai điều kiện, anh chọn:

1. **Chờ** track kia commit/đóng phase-02 trước — sau đó merge nhánh này vào `main` là thao tác bình thường, xung đột (nếu có, vì cả hai đụng `session-engine.mjs`) resolve qua git 3-way merge thật, không phải đoán ý người khác trên working tree thô.
2. Nếu track kia đã **bỏ dở/không còn hiệu lực**, anh xác nhận để em `git checkout -- src/runner/coordination/session-engine.mjs` khôi phục checkout chính về sạch, rồi merge nhánh này vào `main` ngay — **bước khôi phục là destructive trên checkout chính, cần anh xác nhận rõ ràng trước khi em chạy**.

Dọn dẹp sau merge: `git worktree remove .claude/worktrees/dispatch-hardening-phase01-r1r4` và xoá nhánh `dispatch-hardening-phase01-r1r4`.
