---
title: "RunResult: classification là đường đọc duy nhất + ghi usage"
status: completed
priority: P1
created: 2026-09-29
blockedBy: [260929-1501-metrics-friction-rust-native]
blocks: [260930-0335-measure-runresult-classification-impact, 260929-1703-baseline-friction-producers]
---

# Plan: RunResult — `classification` single path + `usage`

Nguồn: [plan Observe](../260929-1501-metrics-friction-rust-native/plan.md) (Validation Session 1, quyết định 5; Session 4, tách plan) · [architecture review 20/9](../reports/dispatch-execution-engine-architecture-review-260920.md) (H4, H5, "3 ladder")

## Outcome

Mọi quyết định của dispatch và coordination **dựa trên RunResult** (quorum, recheck, revise, retry, legality, driver loop, show/report) đọc kết quả run qua **một đường duy nhất**: `runOutcome()`, dựng trên `interpretRunResult(result).classification`. Classification gồm `execution.status`, `assessment.verdict`, `policy.disposition`, `confidence.level`, `failure` và `outcome.category`. Nhờ vậy:
- reviewer bác **không còn bị gộp** chung với lỗi hạ tầng;
- Observe đo được #3 (review pass vòng đầu) và #4 (fail do hạ tầng hay do verdict) chính xác, không còn phải ước lượng;
- RunResult ghi thêm `usage` (token), để đo chi phí cho executor không phải Claude.

**Ngoài phạm vi:** ladder token của `execute` (`result-ladder.mjs`, H5 `[DONE]` → `verifiedSha`) và evaluator `classifyDispatchResult`. Hai ladder này không đọc RunResult; nếu cần thì làm ở plan riêng. <!-- Red Team #15 -->

## Phát hiện làm thay đổi cách làm (quyết định D1: **đã chốt D1-A**, 2026-09-29)

Validation Session 1 của plan Observe chốt: "`status` execution-only: reviewer bác thì là `done` + `verdict: fail`". Khi scout code (2026-09-29) thì thấy:
- `classification` **đã là sự thật chuẩn** của RunResult v2 (`src/runner/dispatch/run-result.mjs`). Reviewer bác được ghi là `execution.status = completed` + `assessment.verdict = findings`.
- `status` và `confidence` chỉ là **phép chiếu legacy** (`projectLegacyStatus`, `run-result.mjs:39-84`). Phép chiếu này gộp `findings` vào `failed`, và đó chính là nguồn gốc của sự nhập nhằng.
- `interpretRunResult()` (`run-result.mjs:566`) đọc ba loại record:
  - record **v1** (không có `contract`): suy ra classification từ `status` (`delivery.mode: legacy-derived`, dòng ~757-799);
  - record **v2**: đi qua `validateRunResultV2`, mà validator này kiểm "status đã lưu = phép chiếu", tức cần `projectLegacyStatus` (dòng 237-253, 657);
  - contract khác: coi là corrupt.

  Vì vậy dữ liệu cũ không cần migrate, **nhưng** phép chiếu phải được giữ lại dưới dạng đóng băng trong validator v2 (Red Team #5).
- Còn một producer thứ hai `classifyRunEvidence()` (`settlement.mjs:222-294`) tự sinh `status`/`confidence` theo cách riêng; `operation-choice` dùng nó lúc đọc để **hạ cấp** kết quả giả mạo. Có thêm một producer thứ ba đã chết là `classificationForSettlement` (`assignment-runner.mjs:147`). Đây là "3 ladder" mà review 20/9 đã chỉ ra.

| Phương án | Nội dung | Đánh giá |
|---|---|---|
| **D1-A (đã chốt)** | Bỏ `status`/`confidence` legacy khỏi RunResult mới. Mọi consumer đọc `classification` qua `runOutcome`. `classifyRunEvidence` được gộp thành bước tạo classification, chỉ còn một producer | Single path; nghĩa **giống hệt** quyết định 5 của anh; không phải duy trì hai trường song song |
| D1-B | Giữ `status` nhưng đổi phép chiếu: `findings` → `done` | Vẫn còn hai trường, hai nghĩa; mỗi consumer mới lại phải chọn đọc cái nào |

## Consumer cần chuyển (grep 2026-09-29, bổ sung sau red-team)

<!-- Red Team #7: bảng cũ thiếu show.mjs, disclosure, destructure. Phase 2 bước 2 rà lại theo symbol và đối chiếu với con số "53 chỗ" của plan Observe -->

| File:dòng | Đang đọc | Quyết định gì |
|---|---|---|
| `src/runner/coordination/session-engine.mjs:3330-3332` | `runResult.status/confidence` (có gate R7 `confidence === 'verified'`) | Gom các run fail của session |
| `session-engine.mjs:3689-3702` | `status`/`confidence` làm **disclosure id** (`deriveDisclosures`) | Kiểm độ phủ `requiredDisclosures` của aggregation (contract của protocol) |
| `session-engine.mjs:4005` | `status/confidence` | Bỏ qua run fail khi tổng hợp (satisfied sớm nhất) |
| `src/runner/coordination/legality-facts.mjs:221,226,286,300,407-409` | `payload.status` (code chết), `runResult.status/confidence` | Legality: run nào được coi là đã hoàn tất hợp lệ; kích hoạt recheck/revise |
| `src/runner/dispatch/operation-choice.mjs:398-430` | `classifyRunEvidence` hạ cấp `.status/.confidence` | Chặn giả mạo khi đọc lại |
| `operation-choice.mjs:1701-1770,1929,2028,2093-2102` | destructure `status`/`confidence` | Chọn stage operation tiếp theo (`fix-verify-red`, `scoped-subtask`, …) |
| `src/runner/loop.mjs` (tìm `outcome.runResult?.status`; log ~1572) | `outcome.runResult?.status` | Dừng vòng lặp driver |
| `src/verbs/coordination/run.mjs:359-360` → `:1020` | `runResult.status/confidence` được chép vào `step.status` (`summarizeDispatch`), rồi đếm `settledFailed` | Báo cáo DAG của `coordination run` |
| `src/verbs/coordination/show.mjs:416-417` | `runResult.status ?? (settled ? 'done' : null)` | Hiển thị node (v3 không có `status` thì mọi node thành `done`) |
| `src/runner/dispatch/{assignment-runner,settlement}.mjs` | `classifyRunEvidence`, `classificationForSettlement` (chết) | Producer thứ hai và thứ ba |

## Bảng ngữ nghĩa consumer (chốt sau red-team, không để người implement tự chọn)

<!-- Red Team #4 -->

| Consumer | Đọc | Ngữ nghĩa |
|---|---|---|
| legality `classifyOperationAssignment`, `hasAcceptedDispositionRemediation`, `branchSatisfiedAtSeq`; session-engine 4005 | `satisfied` (`category === 'ok'`) | `findings` / `blocked` / `policy` / `infra` / `corrupt` đều **chưa satisfied**. Lần reviewer bác vẫn kích hoạt recheck/revise như hiện nay |
| session-engine 3330 (gom lỗi fan-in); `run.mjs` `settledFailed` | `category` | Tách `infra`+`corrupt` khỏi `verdict`/`policy`/`blocked`. Đây là chỗ **cố ý đổi**: reviewer bác không còn được đếm là lỗi hạ tầng |
| dissent `blocked` | `category === 'blocked'` | Giữ nguyên nghĩa |
| operation-choice (chọn operation) | `runOutcome(…, { evidenceFloor })` | Như hiện nay, nhưng trên classification đã hạ cấp |
| loop (dừng driver) | `satisfied` / `category` | Dừng khi chưa satisfied, giữ hành vi hiện tại |
| show / report | `category` + `verdict` + `evidence` | Chỉ hiển thị, không bao giờ mặc định là `done` |

## Phases

| # | Phase | Effort | Phụ thuộc | Trạng thái |
|---|---|---|---|---|
| 1 | [Characterization tests cho từng consumer](phase-01-characterization-tests.md) | 1.5d | — | completed |
| 2 | [Chuyển consumer sang `classification`](phase-02-migrate-consumers-to-classification.md) | 2d | 1 | completed |
| 3 | [Một producer: bỏ phép chiếu legacy, gộp `classifyRunEvidence` (Node)](phase-03-single-producer-drop-legacy-projection.md) | 1.5d | 2 | completed (C1 + C2) |
| 4 | [Ghi `usage` từ output của adapter](phase-04-capture-usage.md) | 1d | parser: —; nối producer: sau C1 | completed |
| 5 | [Source Observe (Rust) đọc v3 + usage](phase-05-observe-source-reads-v3.md) | 1d | 3, 4 + Observe F2, F4 | completed |
<!-- Phase 6 (đo lường sau merge) đã tách thành plan riêng: plans/260930-0335-measure-runresult-classification-impact -->

**Thứ tự làm** (một worktree, một agent, tuần tự):
1. Phase 1.
2. Phase 4, phần parser (file mới, không đụng file nào khác).
3. Phase 2.
4. Phase 3 C1.
5. Nối parser usage vào producer (bước 3 của phase 4).
6. Phase 3 C2.
7. Phase 5 (chờ cổng Observe).
8. Merge.
9. Phase 6.

**Song song với plan Observe:** plan này chạy trên worktree riêng, còn plan Observe (F4, F6–F8) chạy trên `main`. Hai bên chỉ cùng sửa `loop.mjs` (conflict nhỏ, xử lý khi sync `main`) và code Rust của phase 5 (phase 5 chờ Observe commit trước).

## Phụ thuộc chéo plan

- **blockedBy plan Observe, chỉ ở phase 5.** Phase 1–4 **không chờ** Observe.
  - **5a** (port luật `deriveOutcome` sang Rust): chờ crate `packages/run-result/rust` (F2) được commit lên `main`. F2 đã `done` nhưng code còn nằm chưa commit trong main checkout.
  - **5b** (nối scorecard): chờ F4 được commit lên `main`.
  - **Không chờ M4.** Baseline "trước" ở phase 6 được tính lại từ các `result.json` cũ trên đĩa bằng cùng `deriveOutcome`, nên không cần baseline JSON của Observe. <!-- Red Team #11; Validation Session 5 -->
  - `src/report/dispatch-confidence.mjs` bị plan Observe xoá, nên không nằm trong phạm vi plan này.
- **blocks plan Producer:** producer `run:` cần classification sạch để biết run nào fail do hạ tầng.

## Môi trường làm việc

Toàn bộ plan được làm trong **worktree riêng**, không làm trong main checkout dùng chung. Lý do:
- plan Observe đang cook trên `main` và cũng sửa `loop.mjs` và `packages/*/rust`;
- phase 5 phải chờ Observe, nên cần một branch giữ code sẵn sàng mà chưa vào `main`.

- **Branch:** `plan/260929-runresult-classification`
- **Worktree:** `~/projects/forgentX-runresult-classification` (một worktree duy nhất cho cả plan)
- **Dựng worktree:** tự động, là bước 0 của phase 1 (`/ak:cook` tự làm; idempotent). Các bước:
  1. Commit thư mục plan này lên `main` trước, vì `git worktree add` chỉ mang theo trạng thái đã commit. Chỉ stage đúng thư mục plan, không kéo theo các file đang sửa dở khác.
  2. `git worktree add -b plan/260929-runresult-classification ~/projects/forgentX-runresult-classification main`. Không bao giờ checkout branch ngay trong main checkout.
  3. Symlink `node_modules` và `target/` từ main checkout sang worktree ngay sau khi tạo; thiếu thì test fail hàng loạt.
- **Khi làm việc:**
  - Một agent làm tuần tự trong worktree này. Không chạy hai agent cùng lúc trong một worktree, vì chúng dùng chung git index.
  - Kiểm `pwd` trước mỗi thao tác git, vì cwd hay lệch về main checkout.
  - Commit ngay khi verify xanh.
  - Chạy `npm test` với `CLAUDE_CODE_SESSION_ID` đã unset.
  - Test CLI bằng `node bin/fgos.mjs` của worktree, không dùng hàm `fgos` trong shell (có thể trỏ tới bản đã stage cũ).
- **Sync `main` vào branch** (anh chốt: `git merge main` vào branch, không rebase):
  - làm định kỳ, ít nhất mỗi khi `main` có commit của plan Observe, và luôn làm trước phase 5a, 5b và trước khi merge ra;
  - sau mỗi lần sync, chạy lại `npm test`.
- **Merge ra `main`: một lần duy nhất, khi phase 1–5 đều xong** (anh chốt).
  - Sync `main` lần cuối, chạy toàn bộ test, rồi merge.
  - Commit C2 (writer v3) phải còn là một commit riêng trong lịch sử, để `git revert <C2>` là đường lùi.
  - Sau merge: restage và kiểm digest (`fgctl status` / `fgos doctor`). Phase 6 chạy sau đó.
- **Dọn dẹp:** dọn worktree sau khi merge ra `main`.

## Acceptance

- Không còn chỗ nào trong `src/` đọc `.status` / `.confidence` (kể cả qua destructure hay `??`) trên giá trị RunResult để ra quyết định hoặc hiển thị. Test quét **cấu trúc** trên toàn `src/` xác nhận điều này.
- Mọi gate legality/quorum dùng `satisfied` theo bảng ngữ nghĩa consumer. Test cấp session "findings → revise → recheck" xanh.
- Record corrupt và record có classification bị sửa tay đều fail-closed (`category: 'corrupt'`, hoặc bị hạ bởi `evidenceFloor`).
- RunResult mới không có trường `status`/`confidence`; contract `assignment-run-result` lên v3. Validator v3 bác record có `outcome.category` lệch với `deriveOutcome(classification)`.
- `interpretRunResult` rẽ nhánh v1 / v2 (validator đóng băng) / v3; record v1 và v2 đọc đúng như trước.
- `classifyRunEvidence` và `classificationForSettlement` bị xoá. `projectLegacyStatus*` không còn writer hay consumer nào; chỉ còn bản đóng băng private trong validator v2.
- Merge ra `main` một lần, khi phase 1–5 đều xong; branch được sync `main` định kỳ. Writer v3 (C2) là commit riêng, và code chỉ có C1 đọc được v3, nên `git revert <C2>` an toàn. Restage và kiểm digest sau merge.
- Characterization test của phase 1 (fixture từ dạng record có thật) đều xanh. Riêng các case có chủ đích đổi hành vi được liệt kê kèm lý do, khớp với bảng ngữ nghĩa consumer.
- `pi` (cộng qua các turn) và `codex-cli` (`totalTokens`) có `usage` trong RunResult. `claude` ghi `usage: null, source: "transcript"` (token lấy qua transcript của Observe). herdr ghi `usage: null` kèm lý do.
- Observe:
  - `metrics harness` tính #4 từ `classification.outcome.category` (D2-A; không còn nhóm `unclassified` cho run mới);
  - #3 dùng công thức "vòng đầu" đã định nghĩa ở phase 6, hoặc giữ `estimate` kèm lý do;
  - có báo cáo trước/sau dùng **cùng** một luật phân nhóm.
- Logic phân nhóm sống **chỉ ở `deriveOutcome`** (Node và bản Rust của nó). Producer dùng nó để ghi, validator v3 và `evidenceFloor` dùng nó để kiểm. Khoá bằng fixture chung.
- Chạy `npm test`, `cargo test --workspace`, gitnexus `impact` trước khi sửa, và `detect_changes()` trước commit.

## Quyết định D2: một định nghĩa #4 (infra hay verdict). **Đã chốt D2-A**, 2026-09-29; bổ sung sau red-team

Hiện có hai chỗ suy ra "run này fail do hạ tầng hay do verdict":
- Node `runOutcome().infraFailure` (phase 2), dùng để ra quyết định dispatch/coordination;
- Observe F4, tự phân nhóm `execFailed` / `verdictFail` / `policyRefused` / `ok`, dùng để đo.

Nếu để hai bản logic sống song song thì trái với single path, và hai bên có thể lệch nhau mà không ai biết.

| Phương án | Nội dung | Đánh giá |
|---|---|---|
| **D2-A (đã chốt)** | Producer v3 ghi luôn `classification.outcome = { category: ok\|infra\|verdict\|policy\|blocked, ... }` một lần. Node `runOutcome` đọc field này. Observe cũng đọc field này. Chỉ record v1/v2 cũ mới cần suy ra theo **luật đã đóng băng** (dữ liệu lịch sử không đổi), khoá bằng fixture chung | Logic sống chỉ ở một nơi. Nhưng **đổi một quyết định trong plan Observe** ("`failure.origin` chỉ suy ra trong source `run-result`"). Plan Observe cần một dòng decision khi F8 chạy |
| D2-B | Giữ hai bản; dùng fixture chung để giữ chúng khớp nhau | Không đụng plan Observe, nhưng vẫn có hai logic sống |

**Bổ sung sau red-team (anh chốt 2026-09-29):**
- Luật phân nhóm đổi thứ tự thành execution/`failure.family` → policy → `needs-input` → verdict. `confidence` không phải input phân nhóm (Red Team #1; luật đầy đủ ở phase 2).
- `category` là **cache được kiểm**, không phải nguồn sự thật: validator v3 bác record lệch, và `runOutcome` giữ ngưỡng hạ cấp theo evidence (Red Team #2).
- Tiêu chí cũ "record v3 không bị suy ra lại ở bất kỳ phía nào" được thay bằng "chỉ `deriveOutcome` được phân nhóm; việc kiểm lại bằng `deriveOutcome` là ngoại lệ tường minh".

## Rủi ro

- **Đổi hành vi quorum/recheck/revise của session đang chạy.** Characterization test khoá hành vi cũ, và bảng ngữ nghĩa chốt chỗ nào đổi. Số session `active` cần đếm lại trước khi merge: plan cũ ghi 216, red-team thấy 512. Ghi rõ trong CHANGELOG.
- **Binary cũ đọc v3 thì coi là corrupt, và resume ném `result-corrupt`.** Xử lý: reader (C1) đứng trước writer (C2) trong lịch sử; restage ngay sau merge; rollback bằng `git revert <C2>`.
- **Chạy song song với plan Observe (đang cook trên `main`).** `loop.mjs` bị cả hai plan sửa: plan Observe sửa chỗ gọi friction, plan này sửa chỗ dừng vòng lặp (dòng ~945, **số dòng sẽ lệch**, nên tìm theo `outcome.runResult?.status`). Xử lý conflict khi sync `main` vào branch.
- ~~`result-linked` event mang `payload.status`~~: **sai**. Schema chỉ nhận `{assignmentId, runId}`, và 0/936 event có `status`. Nhánh ở `legality-facts.mjs:221` là code chết và bị xoá ở phase 2 (Red Team #9).

## Câu hỏi mở

1. ~~D1~~ **Đã chốt D1-A**. Lý do của anh: fgOS hiện chỉ có anh dùng, và chỉ để phát triển chính fgOS, nên không cần backward compat.
2. ~~`run.mjs:1020`~~ **Đã trả lời**: `step.status` chính là `runResult.status`, được chép ở `run.mjs:359`. Đã thêm vào bảng consumer.

## Validation Log

### Session 1 — 2026-09-29 (verification lúc tạo plan)
- Claims checked: 16
  - 5 symbol: `normalizeRunResultV2`, `validateRunResultV2`, `interpretRunResult`, `projectLegacyStatus` (`run-result.mjs`), `classifyRunEvidence` (`settlement.mjs`). Cả 5 được xác nhận.
  - 11 dòng consumer trong bảng: đã đọc từng dòng.
- Verified: 16 | Failed: 0 | Unverified: 0.
- Phát hiện thêm:
  - `run.mjs:359` chép `runResult.status` vào `step.status` (consumer thứ 12). Đã thêm.
  - `herdr-plugin/src` không đọc `status` của `result.json` (grep rỗng), nên rủi ro "tool ngoài đọc status" chỉ còn ở source `run-result` của Observe (phase 5).
- `ak plan validate`: OK.
- **D1 = A** (anh chốt 2026-09-29): bỏ `status`/`confidence` legacy; mọi consumer đọc `classification`; contract v3; không backward compat (fgOS hiện chỉ một người dùng, dùng để phát triển chính fgOS). Propagate: phase 3 bỏ nhánh D1-B.

### Session 2 — 2026-09-29
- Anh chốt **D1-A**. Phase 3 đã bỏ nhánh D1-B; acceptance và câu hỏi mở đã được cập nhật.
- Rà lại toàn plan: không còn nhánh "nếu chọn D1-A/B". Không còn câu hỏi mở.

### Session 3 — 2026-09-29 (khớp với plan Observe sau red-team)
- Đọc Red Team Review (15 finding) cùng Session 5 của plan Observe. Các thay đổi đụng quyết định cũ (friction best-effort, tìm host env → manifest → fault, store shard theo writer, Work không đọc friction) **đều do anh chốt** trong phiên đó.
- Đã chỉnh plan này:
  1. Sửa source Observe **ngay trong phase 3**, không để khoảng hở khi `status` biến mất.
  2. v3 ghi `adapter`/`role`/`durationMs` (red-team #11: Observe đang phải đoán các field này).
  3. `loop.mjs`: tìm theo pattern thay vì số dòng, và rebase trước khi merge.
- Mở thêm **D2** (một định nghĩa #4). Đề xuất D2-A.
- Chưa sửa plan Observe (đang cook). Cần làm sau: dòng "RunResult status/usage" trong mục "Không thuộc plan này" vẫn ghi "đổi nghĩa status / 53 chỗ", và cần thêm `blocks` ở frontmatter.

### Session 4 — 2026-09-29
- Anh chốt **D2-A**: producer v3 ghi `classification.outcome.category` một lần; Node `runOutcome` và Observe cùng đọc field này; record cũ đi qua luật đóng băng `deriveLegacyOutcome` (Node + bản Rust), khoá bằng fixture chung `test/fixtures/run-outcome/legacy-derivation.json`.
- Đã propagate sang phase 2, 3, 5 và acceptance.
- **Cần làm ở plan Observe** (sau khi cook xong, gộp vào decision record F8): thay dòng "Suy ra `failure.origin` chỉ trong source `run-result`" bằng "category do producer RunResult ghi (v3); source chỉ suy cho record cũ theo luật đóng băng dùng chung fixture". Cùng lúc sửa dòng "RunResult status/usage" (D1-A) và thêm `blocks`.
- Rà lại toàn plan: không còn chỗ nào mô tả hai phía tự phân nhóm, và không còn quyết định mở.

## Red Team Review

### Session — 2026-09-29
**Reviewers:** Security/Data-integrity (Fact Checker), Failure Mode (Flow Tracer), Assumption Destroyer (Scope Auditor). Tier Full, 5 phase.
**Findings:** 15 sau khi gộp từ 28 finding thô (15 accepted, 0 rejected)
**Severity breakdown:** 6 Critical, 6 High, 3 Medium
**Quyết định của anh:** áp dụng cả 15; D2-A: category là cache được kiểm; claude usage lấy từ transcript của Observe.

| # | Finding | Severity | Disposition | Applied To |
|---|---------|----------|-------------|------------|
| 1 | Luật D2-A xét `confidence` trước policy/verdict nên xếp reviewer bác / refuse vào `infra`; thiếu luật cho `needs-input` | Critical | Accept | P2, P3, D2, fixture |
| 2 | `outcome.category` tin thẳng; cấm suy lại nên mất lớp chặn giả mạo | Critical | Accept (D2-A bổ sung) | P2, P3, D2, Acceptance |
| 3 | Record corrupt giữ classification thô, nên `runOutcome` không fail-closed | Critical | Accept | P2, Acceptance |
| 4 | `findings` trong legality là tín hiệu kích hoạt recheck/revise, `!infraFailure` sẽ chấp nhận run bị bác | Critical | Accept | Bảng ngữ nghĩa, P1, P2 |
| 5 | v2 đi qua validator cần `projectLegacyStatus`, không phải nhánh legacy | Critical | Accept | P3, Phát hiện, Acceptance |
| 6 | Không có rollback; binary cũ đọc v3 thành corrupt | Critical | Accept | P3 (merge A/B), Rủi ro |
| 7 | Bảng consumer thiếu show.mjs, disclosure id, đọc qua destructure, report | High | Accept | Bảng consumer, P2 |
| 8 | Regex source-scan bỏ sót `!==`/confidence/destructure và mọi thứ ngoài `src/runner` | High | Accept | P2, Acceptance |
| 9 | `payload.status` của `result-linked` không tồn tại (code chết) | High | Accept | P2, Rủi ro |
| 10 | Nguồn usage sai: pi theo từng turn, claude cli không có stream-json, codex chỉ có tổng / stderr không tin được | High | Accept (claude: transcript) | P4, Acceptance |
| 11 | So sánh trước/sau khác định nghĩa; baseline ở M4 chứ không phải M2; #3 chưa định nghĩa | High | Accept | P5, Phụ thuộc chéo |
| 12 | Enum adapter sai (bwrap là confinement); `durationMs ?? 0` | Medium | Accept | P3 |
| 13 | `settlement:729/738` không phải `run.json`; `agentClaim` tự dựng; producer chết `classificationForSettlement` | Medium | Accept | P3 |
| 14 | Ma trận P1 thiếu `needs-input`, v1, `failure`, text verdict | Medium | Accept | P1 |
| 15 | P4 không độc lập với P3; Outcome ghi quá phạm vi (H5 `result-ladder`) | Medium | Accept | P4, Outcome, Phases |

Ghi chú: phần đếm dữ liệu thật (1028 `result.json`, 925 v1, 101–106 v2, 936 `result-linked`, 512 session `active`) là do reviewer đếm. Phase 1 đếm lại và dán số vào plan.

### Whole-Plan Consistency Sweep
- Files reread: plan.md, phase-01 … phase-05.
- Decision deltas checked: 9. Gồm: thứ tự luật `deriveOutcome`; category là cache được kiểm; fail-closed với corrupt; bảng ngữ nghĩa consumer; đọc theo version v1/v2/v3; merge A/B; nguồn usage (claude lấy qua transcript); baseline M4; enum adapter/confinement.
- Reconciled stale references: 8. Gồm: M2 → M4; bỏ rủi ro `payload.status`; bỏ "record v3 không bị suy ra lại"; regex `src/runner/**` → quét cấu trúc trên `src/`; "lấy tổng ở event cuối" → cộng qua các turn; `cli/herdr/bwrap` → `adapter` + `confinement`; "làn 4 độc lập (khác file)"; "claude (stream-json)" trong Acceptance.
- Còn giữ có chủ đích:
  - Validation Session 1–4 là log lịch sử, không sửa lại;
  - dòng D2 nhắc `infraFailure` vẫn đúng: field này vẫn còn và được suy từ `category`.
- Unresolved contradictions: 0.
- Việc cần làm ở plan Observe (tiếp nối Session 4): thêm `blocks: [260929-1703-runresult-classification-single-path]`; dòng "RunResult status/usage" đổi sang D1-A + D2-A (luật mới); ghi rằng source `run-result` dùng `deriveOutcome` chung fixture.

### Validation Session 5 — 2026-09-29 (điều chỉnh để làm song song)
- Anh chốt:
  - làm trên worktree riêng;
  - sync `main` vào branch (merge, không rebase);
  - chỉ merge ra `main` một lần, khi đã làm xong hết.
- Thay đổi:
  1. Tách phần Rust (source Observe đọc v3) ra **phase 5 mới**, có cổng chờ Observe F2 (5a) và F4 (5b). Phase 1–4 không chờ Observe.
  2. Bỏ cổng M4: baseline "trước" tính lại từ record cũ trên đĩa (phase 6).
  3. Gộp hai lần merge A/B thành một lần merge; giữ writer v3 là commit riêng (C2) để làm đường lùi.
  4. Đổi tên phase đo lường thành phase 6, chạy sau merge.
  6. Bỏ `dispatch-confidence.mjs` (plan Observe xoá file này).
- Rà lại toàn plan: các chỗ "merge A/B", "M4", "rebase" và "phase 5 = đo" chỉ còn trong log lịch sử (Validation Session 1–4, Red Team Review). Unresolved contradictions: 0.
- Việc cần làm ở plan Observe (bổ sung): nên gom phần phân nhóm #4 của F4 vào một hàm duy nhất, để phase 5b chỉ phải thay hàm đó.

### Validation Session 6 — 2026-09-29
- Anh chốt: **một worktree**, làm tuần tự. Bỏ làn B và worktree phụ, vì chỉ lợi được khoảng 1 ngày mà phải thêm branch, lần merge và agent cần phối hợp.
- Phase 4 (parser) được xếp ngay sau phase 1; bước nối vào producer nằm giữa C1 và C2 của phase 3.
- Song song vẫn giữ ở cấp plan: plan này chạy trên worktree riêng, plan Observe chạy trên `main`.
- Dựng worktree đưa vào bước 0 của phase 1 (anh hỏi), để `/ak:cook` tự chuẩn bị khi bắt đầu.
