# Dispatch & Execution Engine Hardening

Status: PROPOSED — Phase 00 (decision gate) mở ngay; Phase 01–02 không bị gate, có thể bắt đầu song song với Phase 00. Created: 2026-09-20. Source: [`plans/reports/dispatch-execution-engine-architecture-review-260920.md`](../reports/dispatch-execution-engine-architecture-review-260920.md) (review @ `7853e4d7`).

## Nguyên tắc sắp xếp

Review liệt kê finding theo severity; plan này sắp xếp lại theo **nguyên nhân gốc × mức lộ diện trên path production hôm nay × dependency**, không theo nhóm reviewer. Ba luật:

1. **Path đang chạy thật trước path tiềm ẩn.** Result-truth (H4/H5) và admission/lock (C1/H1/H2/H3) chạy trên mọi Assignment hôm nay → Wave 1–2. Provider-capacity rotator (C2) chỉ kích hoạt khi có global account inventory (host này chưa có) → Wave 3, nhưng là **điều kiện tiên quyết** trước khi bật inventory.
2. **Sửa nền trước, sửa triệu chứng sau.** Typed error code (M2) và holder identity (H1) là tiền đề cho fix C1/H2/M1; atomic write (H3) là tiền đề cho "torn result.json → parked, không relaunch".
3. **Không mở scope ngoài diff nhỏ nhất đã nêu trong review**; refactor cấu trúc (tách file, gộp door) dồn vào Phase 09 và chỉ làm sau khi hành vi đã được khoá bằng test.

Mỗi phase = một ứng viên `fgos submit` độc lập; kết quả chấp nhận = test còn thiếu trong review §Test Gaps trở thành xanh + docs sửa đúng trạng thái.

## Quy tắc worktree (bắt buộc, mọi phase — quyết định 2026-09-21, tinh chỉnh 2026-09-21)

`main` là checkout dùng chung, đang có nhiều track khác chạy song song (đã va chạm thật ít nhất một lần: `session-engine.mjs` có 953 dòng chưa commit từ track `coordination-skill-harness-simplification` khi Phase 01 chạm tới). Không đoán được track khác có merge/commit giữa chừng hay không, nên **mọi phase của track này làm trong worktree riêng, dù file mục tiêu đang sạch hay không** — không còn ngoại lệ "file sạch thì sửa thẳng trên main".

Hai nguyên tắc:

1. **Mặc định — mỗi phase rẽ thẳng từ `main`, merge thẳng về `main` ngay khi xong, không chờ phase khác, không chờ cả track.** Áp dụng cho mọi phase KHÔNG đụng `session-engine.mjs` (hiện là 02, 04, 05, 06, 07, 08, 09 và phần R2/R3 đã xong của 01). Một phụ thuộc thật như 02→03→08 chỉ có nghĩa "Phase 03 chờ Phase 02 *đã nằm trên `main`*" rồi rẽ nhánh mới từ `main` — không phải nối nhánh vào nhau.
2. **Ngoại lệ — phase nào đụng `session-engine.mjs` thì nối tiếp trên cùng một nhánh**, vì cùng bị khoá chung bởi track ngoài trên cùng file, không có lý do tách nhánh cho từng phase riêng. Hiện tại là Phần R1/R4 của Phase 01 (đã xong, nhánh `dispatch-hardening-phase01-r1r4`, chưa merge) và Phase 03 (rẽ tiếp từ nhánh đó khi bắt đầu). Nhánh gộp này chờ track ngoài resolve rồi merge một lần.

Quy trình mỗi phase (nhóm 1 — mặc định):
1. `git worktree add .claude/worktrees/dispatch-hardening-phaseNN-<slug> -b dispatch-hardening-phaseNN-<slug> <main HEAD hiện tại>`.
2. Symlink `node_modules` từ checkout chính vào worktree mới trước khi chạy test (hook `.ckignore` chặn Bash gọi thẳng tên `node_modules` trong lệnh — nhờ user chạy một dòng `ln -s` qua `!` prefix).
3. Làm việc, test, commit toàn bộ trong worktree đó — **bao gồm cả cập nhật phase file và `plan.md` của track này**: sửa ngay trong worktree, commit cùng đợt với code, không sửa `plan.md`/phase file trực tiếp trên `main` bao giờ (kể cả chỉ là ghi trạng thái — xem sự cố dưới).
4. Test xanh → merge nhánh đó vào `main` ngay (không đợi gì thêm). **Trước khi merge**: chạy `git status` đầy đủ trên `main` (không giới hạn path), không giả định HEAD chưa đổi — checkout dùng chung, track khác có thể đã commit lên `main` trong lúc mình làm.
5. `git worktree remove` + xoá nhánh.

Quy trình nhóm 2 (chuỗi `session-engine.mjs`): rẽ nhánh mới từ nhánh trước đó trong chuỗi (không rẽ từ `main`), làm việc/test/commit như trên, nhưng KHÔNG merge riêng lẻ — giữ nguyên trên nhánh chờ tới khi track ngoài resolve, rồi merge một lần cho cả chuỗi.

Nhánh Phase 01 R2/R3 là ngoại lệ đã xảy ra trước quyết định này (làm thẳng trên `main`, đã merge sẵn vì lúc đó file sạch) — không hồi tố, chỉ áp dụng từ Phase 02 trở đi.

### Sự cố 2026-09-21 (suýt mất dữ liệu, đã khôi phục — bài học, không phải work item)

Lúc ghi bản "tinh chỉnh 2 nguyên tắc" ở trên, em sửa `plan.md` **trực tiếp trên `main`** (đúng loại thao tác quy tắc này giờ cấm) và chỉ chạy `git status --short -- plans/260920-2217-dispatch-engine-hardening/plan.md` (giới hạn đúng path đó) trước khi commit — không thấy được rằng một track khác (`immediate-test-feedback-reduction`) đang commit trực tiếp lên `main` cùng lúc, đẩy HEAD tiến từ `a74a265a` lên `852171c2`. `git commit` build trên đúng HEAD mới đó nhưng index đã lẫn trạng thái xoá 44 file của track kia — commit bị lộn thành "xoá 45 file không liên quan". Phát hiện ngay, khôi phục bằng `git checkout 852171c2 -- .` + lấy lại đúng diff `plan.md` từ commit lỗi + `git commit --amend`, xác minh diff cuối cùng chỉ còn đúng 1 file. Không có gì mất; track kia không bị ảnh hưởng.

Hai điều rule ở trên đã sửa để việc này không lặp lại: (a) mọi sửa `plan.md`/phase file của track này đi qua worktree như code, không còn ngoại lệ "chỉ là doc thì sửa thẳng"; (b) `git status` trước khi git-write trên `main` luôn đầy đủ, không giới hạn path.

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
| 08 | [Operability/CLI surface + doctor](phase-08-operability-cli-doctor.md) | 4 | M11, M9(b,c), M16, L3, L10 | VERIFIED (ac19f6d1); RV-01/RV-02 remediated; acceptance gate verified (full suite exit 0, 80/80 stress pass, 85 logs) | dispatch-operability follow-up |
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

## Integration Cross-Reference and Coordination Track Accounting

- **Unified Integration Plan:** `plans/260919-coordination-skill-harness-simplification/plan.md`
- **Date:** 2026-09-24
- **Dispatch Hardening Phased Integration:**
  - Phase 01 R1/R4/R5 (Result truth & settlement CAS) integrated as Units **I02** and **I03** (`main@4362bfec`).
  - Phase 05 remainder (Cross-provider redirect governance & PlacementPolicy binding) integrated as Unit **I06** (`main@3bab9b99`).
  - Phase 08 (Operability/CLI surface & doctor) tracked under Unit **I07** (implementation) and **I08** (verification).
  - Phase 09 (Boundary placement & simplification) tracked under Unit **I12** (blocked on I11 approval).
- **Unit I07 (Dispatch Hardening Phase 08 Operability/CLI Surface & Doctor) Accounting:**
  - Evaluated candidate `439a1fb078418edff7628555c4b6cb9f4015e4e6` approved in independent review (0 blocker, 0 high, 113 focused passing).
  - Synchronized candidate `6a638752` integrated locally; remote synchronized candidate `261ed7ea01765db6c9fa87afddfa8f3e259be1ea` approved for integration; fast-forwarded `main` to `261ed7ea`.
  - Integration status: INTEGRATED AT `261ed7ea`; post-merge verification completed on `6f3fb9038fd66cd9943972a321eed2ba98587fab` (178/178 focused pass; 559/560 dispatch/herdr pass, 728/728 coordination pass, 0 candidate regressions).
- **Unit I08 (Dispatch Hardening Phase 08 Verification) Accounting:**
  - Implementation/verification base: `6f3fb9038fd66cd9943972a321eed2ba98587fab`.
  - Candidate branch: `coordination-skill-harness-i08-dispatch-verification`.
  - Status: `VERIFIED at main@ac19f6d1`.
  - Stop condition: `CLEARED (base defects F4/F5 remediated in I08b; RV-01/RV-02 remediated in candidate 132d3777 + ac19f6d1)`.
  - Remediations:
    * I08b (`ba8f6a9dca8c84ba1561ab5802e2c89a2010446c`): F4, F5, F6, F7, F10 resolved.
    * Governance Denylist Remediation (`132d377794ee02da702ff12d91cfa1c1545bb275` + docs tip `ac19f6d1e868c53b2bc59a2c9642ee0e37e7eb08`): RV-01 & RV-02 resolved via shared canonical provider vocabulary across direct and redirect gates.
  - Acceptance Gate Re-verification Evidence:
    * Full suite: Run 3 reached exit code 0 (`7647 pass, 0 fail, 8 skipped, 68 todo`; duration 364s). Runs 1 and 2 had timing threshold exceedances, classified as timing instability (LOW debt).
    * Isolated stress testing: 10/10 pass on `coordination-phase2-concurrency.test.mjs` (160/160 pass, 0 fail); 10/10 pass on `dispatch.test.mjs` (3870/3870 pass, 0 fail).
    * Parallel load stress testing: 10/10 iterations pass with 6 suites running concurrently (60/60 suite executions exit 0, 0 fail).
    * Baseline comparison on exact `26a1038e` worktree: confirmed clean (dispatch 387 pass exit 0; coord 16 pass exit 0).
    * Evidence inventory: 85 logs total on disk (83 manifest-hashed verification logs on `ac19f6d1` + 2 baseline comparison logs on `26a1038e`) in `scratch/i08-reverification/`.
    * Durable artifacts: `plans/260920-2217-dispatch-engine-hardening/reports/phase-08-i08-acceptance-gate-reverification-manifest.json` and `phase-08-i08-acceptance-gate-reverification-summary.md`.
    * Known LOW follow-up debts: Set<string> canonicalization in checkProviderDisallowed helper, PlacementPolicy shadow gate raw providerModel comparison, test cleanup finally blocks, N10 adapter selection disentanglement.
  - R7 receipt latency benchmark: 40 trials, min 31ms, median 38ms, p95 47ms, max 51ms vs baseline p95 46ms (threshold <= 146ms; PASS).
  - Measurement artifact: `plans/260920-2217-dispatch-engine-hardening/reports/i08-receipt-latency-measurement.json`.
  - Report: `plans/260920-2217-dispatch-engine-hardening/reports/phase-08-i08-dispatch-verification-report.md`.
- **Unit I08b (Remediation of I08 Base Defects F4, F5, F6, F7, F10) Accounting:**
  - Capability: `code:implement`.
  - Depends-on: Unit I08.
  - Status: `integrated at main@ba8f6a9d` (post-landing verified: 486/486 pass).
  - Integration Candidate Merge Commit: `98f501be41756dc80d691cbf63ffeb4cd617fb30` (candidate `d4e052a6` merged into `origin/main@4ad0b8ca`).
  - Branch: `coordination-skill-harness-i08b-remediation`.
  - Worktree: `.claude/worktrees/coordination-skill-harness-i08b-remediation`.
  - Base Lineage: Candidate I08 `4e9de19541f2acde2380ff4f78147e389385e95c` + Evaluated Candidate `0617c6e41ebec1aa8e73065eac69cd5eb9684343` + `origin/main@4ad0b8ca6576252be01159fcf5853c966ba54743` (synchronized candidate `d4e052a6`, merge commit `355f9dbd`).
  - Defects Remediated:
    * F4 (HIGH): Explicit unregistered executor fail-closed with exit code 1 (`DispatchError('executor-not-found')`) across public CLI, compat door, and `executeExecutorCli`. Restored `DispatchError extends Error`; parity achieved via JSON serialization. Preserved implicit resolution for work item dispatches. Pinned tests updated.
    * F5 (HIGH): Canonicalize provider family with declared vendor precedence using `normalizeProviderFamily(deriveProviderFamily(entry, command), command)` in redirect checks and provenance recording in `dispatch-plan.json`. Permits intra-family redirects without `crossProvider: true` and blocks cross-family spoofing.
    * F6 (MEDIUM): Added `.trim()` and preserved precedence for caller option over environment variable in `resolveHerdrBin()`.
    * F7 (MEDIUM): Extended `expectedRunId` and closed vocabulary verification across all intake doors (`run-result.mjs`, `show-run.mjs`, `herdr-round.mjs`, `assignment-runner.mjs`, `runtime-inspection.mjs`, `session-engine.mjs`, `show.mjs`; `watch.mjs` covered indirectly via `show-run.mjs`). Mismatched/missing `runId` with `expectedRunId` or non-standard status flags `contract-corrupt` / `resultCorrupt: true` and prevents settling.
    * F10 (MEDIUM): Bare `reconcile plan` returns exit 0 by design (runner.md:21); defect was `--run` or `--assignment` without action (or with `clear-cwd-lock`) returning 0 instead of 4. Validate `--action` requirement up front before evaluating CWD lock, returning exit code 4 (validation error).
  - Follow-up Ledger: N10 (LOW-MEDIUM: disentangle vendor boundary from adapter selection in ProviderAdapter before expanding beyond Claude harness).
  - Verification: 5/5 dedicated regression tests pass (`test/runner/dispatch-i08b-remediation.test.mjs`); 184 pass across 10 focused test files (189 with regression); root dispatch suite: 387 pass; affected matrix (53 files): 1456 pass, 0 fail, 1 skip; full suite (`npm test`): 7603 pass, 0 fail, 8 skip, 65 todo (389.6s); post-merge candidate regressions: exactly 0; `git diff --check origin/main...HEAD` clean.
  - Report: `plans/260920-2217-dispatch-engine-hardening/reports/phase-08-i08b-base-remediation-report.md`.
- **Unit I09 (Cold-Resumable Read-Only Coordination DAG) Accounting:**
  - Forward-ports DAG capability onto current runtime, consuming Phase 01 result-truth and Phase 05 dispatch governance.
  - Integration status: VERIFIED. Integrated at `1ca4023c`, post-merge verification satisfied at `main@f63f7e7d` following REV-15 timing fix at `60132825` (538/538 pass across 16-suite focused matrix; 3 consecutive timing reruns 129/129 pass; candidate regressions = 0; D2/D3 in `fgos-approve.test.mjs` confirmed pre-existing baseline defect).
  - Follow-up finding `I09-REV-15` (candidate test timing regression in `coordination-r5-hard-budgets.test.mjs`) resolved and verified on current main baseline.
  - 14 focused suites pass (538 passed / 0 failed, `git diff --check` clean).
  - Unit **I10 status: INTEGRATED AND VERIFIED at main@605d26fe** (carried through `main@26a1038e` and `main@ac19f6d1`).
  - Unit **I11 status: INTEGRATED at main@3d706b89** (candidate code `9cf843b6fbb786923992f9deb2f70deb447620a2`, synchronized merge `3d706b8901bb8787f8c6c9b35641b9a4acaeea3b`; reviewer APPROVE ratified; post-merge verification satisfied: 155/155 focused rerun pass, full suite 7652 pass exit 0; candidate regressions = 0; awaiting Track Manager final VERIFIED declaration; Unit I12 remains strictly BLOCKED).
