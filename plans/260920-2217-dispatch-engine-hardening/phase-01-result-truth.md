# Phase 01 — Result truth: no false success

Wave 1 · Gate: none (L6 chờ D3) · Findings: H4, H5, M4, M14, L6, L7. Context: review §H4/H5/M4/M14, Phụ lục 5.

Nhỏ nhất, giá trị cao nhất: hai consumer quyết "thành công" hôm nay bỏ qua fail-closed của RunResult v2. Diff tổng ≈ 20 dòng code + tests.

## Status — 2026-09-22

**R1, R2, R3, R4, R5 ĐÃ HOÀN TẤT VÀ TÍCH HỢP TRÊN LOCAL `main`** (commit `dca4efd5`, candidate `2681b389` kèm F-01 CAS hardening cho mọi writer, origin/main chưa push). R2, R3 tích hợp từ commit `26f53318`. R1, R4 và R5 được hợp nhất qua kế hoạch tích hợp thống nhất `plans/260919-coordination-skill-harness-simplification/plan.md` (Units I02 & I03). Nhánh `dispatch-hardening-phase01-r1r4` (commit `9049e611`) đã được supersede hoàn toàn. R6 dời sang Phase 04 cùng attestation.

Khi sửa R3 (M4), phát hiện một gap tiền tồn tại ngoài phạm vi review gốc: `claimInvalid` được tính ở cả hai settle call site nhưng **chưa bao giờ được truyền vào** `normalizeRunResultV2` — "fails closed on malformed/invalid agent-result.json" (Step 04 §5.2) trước đây chỉ đúng *tình cờ*, qua field `.status` của claim giả mạo. Đã vá cùng lúc (nằm trong commit `26f53318`): truyền `claimInvalid` ở cả hai call site + thêm nhánh confidence-classification cho `claimInvalid` trong `run-result.mjs`.

Khi sửa R1, hai test có fixture tự mâu thuẫn bị lộ ra (không phải bug của fix): `coordination-session-engine.test.mjs` giả định `readLinkedRunResultFromDisk` trả nguyên văn byte một `result.json` v1 thô, và `coordination-research-fan-out.test.mjs` có 3 fixture chỉ patch field `confidence` top-level thành `'verified'` mà không patch `classification.confidence.level` theo — đúng dạng bất nhất `contract-corrupt` được thiết kế để bắt. Cả hai đã sửa lại fixture cho đúng, chi tiết trong message commit `9049e611`.

## Requirements

- R1 **[DONE — tích hợp trên `coordination-integration-i02-result-truth`]** Evaluator (session-engine) chỉ chấp nhận RunResult đã qua `interpretRunResult`; `contractCorrupt === true` → failed.
- R2 **[DONE trên main]** `verifiedSha` chỉ khi `status === 0` và outcome không `timeout/failed`.
- R3 **[DONE trên main]** Không synthesize worker claim; basis `valid-agent-result-claim` chỉ khi có file claim thật. (Mở rộng: `claimInvalid` nay được truyền đúng vào `normalizeRunResultV2` ở cả hai call site — xem Status ở trên.)
- R4 **[DONE — tích hợp trên `coordination-integration-i02-result-truth`]** Evaluator resolve report path qua `resolveWorkerArtifactPath`, không hardcode `agent-report.md`.
- R5 **[DONE — tích hợp trên `coordination-integration-i02-result-truth`]** (theo D3, đã quyết: ghi `result.superseded.json`) Superseded controller's late normalized result ghi file non-authoritative `result.superseded.json` thay vì refuse thẳng, không ghi đè `result.json` authoritative và không gọi `markRunSettled`.
  - *Conflict & Concurrency Contract (I02-REV-01)*:
    1. **Non-authoritative diagnostic status**: `result.superseded.json` được cô lập hoàn toàn khỏi session engine (`readLinkedRunResultFromDisk`, `findLatestRunResult`), quorum evaluation, replay và close session.
    2. **Publication atomicity**: Xuất bản qua `publishMutableProjection` (POSIX `fs.renameSync` từ temp file duy nhất `.tmp-${pid}-${now}-${rand}` kèm fsync), đảm bảo không bao giờ có partial / torn reads dưới concurrency.
    3. **Same-payload retry determinism**: Hai OS process stale chạy retry cùng ghi một payload chuẩn hóa sẽ hội tụ đơn định (deterministic convergence) về cùng biểu diễn byte.
    4. **Conflicting late payloads**: Hai OS process stale ghi các payload khác nhau giải quyết theo atomic last-writer-wins mà không làm hỏng file (valid JSON).
    5. **Authoritative immutability**: Authoritative `result.json` (do fresher controller ghi) không bao giờ bị bất kỳ stale writer nào ghi đè hay biến đổi.
    6. **Two-OS-process proof**: Chứng minh bằng test thực tế với 2 tiến trình Node độc lập chạy song song (`test/runner/assignment-dispatch.test.mjs`).
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

## R1/R4 & R5 — Reconciled and Integrated

**Status:** INTEGRATED into local `main` (commit `dca4efd5`, candidate `2681b389` + F-01/F-02 fix; `origin/main` at `ad8dbaf0` not pushed pending re-review) via unified integration plan `plans/260919-coordination-skill-harness-simplification/plan.md` (Units I02 and I03).
**Date:** 2026-09-22.
**Reconciliation details:**
- R1 (`interpretRunResult` evaluator routing on on-disk result readers) and R4 (`resolveWorkerArtifactPath` in `aggregationSourceFrom`) from `9049e611` were forward-reconciled with post-Phase-2 `session-engine.mjs`.
- R5 (late superseded normalized work product preservation as non-authoritative `result.superseded.json`, immutable protection of authoritative `result.json`, and atomic run-lock settlement CAS) was fully implemented in `assignment-runner.mjs` and `run-lock.mjs`.
- F-01 resolution: Every production authoritative `result.json` writer (including provider-capacity refusal, failure settlement, and receipt-backed reconciliation) is routed through atomic CAS `commitRunSettlement()` with `settleRunControl` and immutable hard-link publication (`publishImmutableProof`). Stale writers publish only `result.superseded.json`. Added two-process barrier race proof for reconciliation in `assignment-dispatch.test.mjs`.
- Branch `dispatch-hardening-phase01-r1r4` (commit `9049e611`) is superseded by the integrated candidate.
