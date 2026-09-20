# Dispatch & Execution Engine Hardening

Status: PROPOSED — Phase 00 (decision gate) mở ngay; Phase 01–02 không bị gate, có thể bắt đầu song song với Phase 00. Created: 2026-09-20. Source: [`plans/reports/dispatch-execution-engine-architecture-review-260920.md`](../reports/dispatch-execution-engine-architecture-review-260920.md) (review @ `7853e4d7`).

## Nguyên tắc sắp xếp

Review liệt kê finding theo severity; plan này sắp xếp lại theo **nguyên nhân gốc × mức lộ diện trên path production hôm nay × dependency**, không theo nhóm reviewer. Ba luật:

1. **Path đang chạy thật trước path tiềm ẩn.** Result-truth (H4/H5) và admission/lock (C1/H1/H2/H3) chạy trên mọi Assignment hôm nay → Wave 1–2. Provider-capacity rotator (C2) chỉ kích hoạt khi có global account inventory (host này chưa có) → Wave 3, nhưng là **điều kiện tiên quyết** trước khi bật inventory.
2. **Sửa nền trước, sửa triệu chứng sau.** Typed error code (M2) và holder identity (H1) là tiền đề cho fix C1/H2/M1; atomic write (H3) là tiền đề cho "torn result.json → parked, không relaunch".
3. **Không mở scope ngoài diff nhỏ nhất đã nêu trong review**; refactor cấu trúc (tách file, gộp door) dồn vào Phase 09 và chỉ làm sau khi hành vi đã được khoá bằng test.

Mỗi phase = một ứng viên `fgos submit` độc lập; kết quả chấp nhận = test còn thiếu trong review §Test Gaps trở thành xanh + docs sửa đúng trạng thái.

## Phases

| # | Phase | Wave | Findings | Gate | Owning track / plan |
|---|---|---|---|---|---|
| 00 | [Decision gate + docs truth pass](phase-00-decision-gate-and-docs-truth.md) | 1 | M13, doc corrections "stays proposed", 6 câu hỏi D1–D6 | user | this plan |
| 01 | [Result truth — no false success](phase-01-result-truth.md) | 1 | H4, H5, M4, M14, L6 (sau D3), L7 | — | dispatch-operability follow-up |
| 02 | [Admission/lock foundation](phase-02-admission-lock-foundation.md) | 1 | M2, H1, H3, L1 | — | runtime-recovery follow-up |
| 03 | [Single live worker per Run](phase-03-single-live-worker.md) | 2 | C1, H2, H13, M1, M9(a), M15(a), L2 | Phase 02 | runtime-recovery follow-up |
| 04 | [Confinement attestation + secrets](phase-04-confinement-attestation-secrets.md) | 2 | H9 (regression), H11, H10 (sau D2), M8 (sau D4), L9 | D2, D4 cho 2 mục | confinement-authority follow-up |
| 05 | [Policy/plan governance coherence](phase-05-policy-governance-coherence.md) | 3 | H6, H12, M5, M6, M7, M12, L4 | D1 cho H6(b); phối hợp executor-policy-dispatch-seams cho M5 | executor-policy-dispatch-seams |
| 06 | [Provider capacity rotator](phase-06-provider-capacity-rotator.md) | 3 | C2, H8, M6 (vocabulary), H3 (state.json) | **phải xong trước khi bật global account inventory** | account-rotator (plan status stale, cần cập nhật) |
| 07 | [Herdr adapter, trust store, supervisor tee](phase-07-herdr-trust-supervisor.md) | 3 | H7, M3, M15(b,c), L11 | — | dispatch (herdr adapter) |
| 08 | [Operability/CLI surface + doctor](phase-08-operability-cli-doctor.md) | 4 | M11, M9(b,c), M16, L3, L10 | — | dispatch-operability follow-up |
| 09 | [Boundary placement + simplification](phase-09-boundary-simplification.md) | 4 | M10, L5, L8, L12, L13 + tách file | Phase 01–08 xong (hành vi đã khoá test) | this plan; **có component-boundary change** |

## Dependencies

```txt
P00 (decisions) ──► P04(H10, M8-bypass) / P05(H6b) / P01(L6)
P01 ─ independent
P02 ─► P03 ─► (P07 H13 shares control-token door with P03)
P04 ─ independent of P02/P03 (đọc receipt, không đụng lock)
P05 ─ independent; M5 chờ quyết của chủ plan executor-policy-dispatch-seams
P06 ─ gate ngoài: bật inventory. Dùng M2 code từ P02 cho lease-refusal.
P08 ─ sau P03 (reasonCode của reconcile/recover dùng chung vocab M2)
P09 ─ cuối cùng
```

## Acceptance criteria (toàn plan)

- Không còn path nào spawn worker thứ hai cho một Run chưa settle (test #1, #2, #3, #5 trong review §Test Gaps xanh).
- Không consumer nào chấp nhận `contract-corrupt` hoặc token `[DONE]` làm thành công (test #9 xanh).
- Attestation `completed` trên assignment door ghi `enforced`+backend đúng; launch envelope không chứa secret (test #8 xanh).
- Rotator: quota fault có `until`, classifier scoped theo provider, lock reclaim được (test #6 xanh) — trước khi bật inventory.
- Mọi doc claim trong review §Documentation Corrections đã đổi sang trạng thái đúng (`implemented`/`partial`/`proposed`/`reserved-not-executed`).
- `npm test` xanh (chạy ngoài session, env `CLAUDE_CODE_SESSION_ID` unset).

## Component boundary

Phase 00–08: **No component-boundary change** (sửa hành vi bên trong ranh giới đã công bố). Phase 09: có thay đổi placement (`fanoutBatchExecutorCli` → Work Driver; `executorIdForWork`/`buildPrompt(workItem)` ra khỏi dispatch core) — phải cập nhật `docs/platform/component-boundary.md` khi thi công.

## Impact analysis posture

`fgos tool query --capability impact-analysis --status present` — GitNexus present trên máy này nhưng index đã ghi nhận stale/zero-symbol cho file lớn (`bin/fgos.mjs`); mỗi phase phải chạy `impact` cho symbol sửa + cross-check grep, ghi `impact-analysis: degraded` nếu index sau HEAD.

## Reports

Ghi vào `plans/260920-2217-dispatch-engine-hardening/reports/phase-NN-<slug>-report.md` sau mỗi phase.
