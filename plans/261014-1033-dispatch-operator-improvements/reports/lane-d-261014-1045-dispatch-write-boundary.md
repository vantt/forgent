# Lane D — ranh giới ghi (đề xuất 6, 8)

Status: DONE_WITH_CONCERNS cho phạm vi hội đồng một-cửa giao (bước 1 + bước 2/đề xuất 8); đề xuất 6 chờ owner (Q4). npm test: xem mục "Kết quả sau hội đồng một-cửa".

**DỪNG theo lệnh Lead 12:58 (anh vantt yêu cầu).** Trạng thái tại thời điểm dừng:
- Đã commit trên nhánh: `e9c946b39` (bước 1, confinement label), `54afd4665` (bước 2, đề xuất 8) + 4 commit docs trước đó. Không merge, không push.
- Chưa commit, giữ trong worktree: cập nhật báo cáo này và `plans/261014-1045-dispatch-write-boundary/plan.md` (mục sau hội đồng).
- `npm test` toàn bộ (khởi chạy trước lệnh dừng, `env -u CLAUDE_CODE_SESSION_ID`, HEAD `54afd4665`): **đỏ** — tests 7371, pass 7292, fail 4, skipped 10. Không sửa gì thêm vì đang dừng.

### 4 test đỏ trong full suite (đều `test/runner/operation-choice.test.mjs`) — chưa sửa

Cả 4 khoá hợp đồng cũ "lượt read-only làm đổi checkout → failed, không tiến Work", tức đúng hành vi hội đồng đã đổi. Nhưng chúng lộ một hệ quả **vượt ngoài lượt dispatch** mà báo cáo hội đồng không nêu rõ: cổng **tiến Work** (driver loop / operation-choice) cũng đọc kết quả đó.

| Test (dòng) | Trước | Bây giờ |
|---|---|---|
| `driver loop runOnce: validate-plan modifying dirty-before plan.md fails closed and does not advance Work` (1208, assert 1244) | Work ở `planning`, quay lại `shape-plan` | **Work tiến sang `executing`** dù lượt validate-plan (read-only) đã sửa `plan.md` có sẵn |
| `Step 06 executing.scout-blast-radius mutating repository state fails closed and stops driver execution` (1329, assert 1374) | confidence `failed`, driver dừng | confidence `reported` (driver không dừng) |
| `Finding 2: executeAssignment fails closed on read-only validate-plan mutations without running automatic rollback` (2776, assert 2834) | status `failed` | status `done` (phần "không rollback" vẫn đúng) |
| `R6/G3: cross-pass re-derivation reads a persisted mutatedDirtyBeforeFiles fact...` (5302, assert 5344) | `validation-failed-do-not-advance-work` | `validation-no-evidence-do-not-advance-work` (Work vẫn KHÔNG tiến) |

Đánh giá (lane): 3 dòng sau là hệ quả dự kiến của "correlated → warning". Dòng đầu là điểm cần owner/Lead quyết: trong một worktree đơn-người-ghi do chính Work sở hữu, "validator sửa plan rồi báo pass" nay được tiến Work, chỉ còn cảnh báo. Đó đúng là "rủi ro tồn dư chấp nhận" của hội đồng, nhưng áp vào cổng tiến Work chứ không chỉ vào lượt dispatch. Phương án lane thấy được (chưa làm):
- A. Theo đúng hội đồng: sửa 4 test sang hợp đồng mới (thêm kiểm `warnings`), chấp nhận Work tiến kèm cảnh báo.
- B. Giữ cảnh báo ở tầng dispatch, nhưng cổng tiến Work (operation-choice) không tiến khi kết quả read-only có cảnh báo `read-only-mutation-correlated`/`mutated-dirty-before-correlated` → không tiến, không refuse (giống nhánh `no-evidence`). Không tạo lại false-refusal cho round, chỉ chặn tiến Work.
Lane nghiêng B (giữ đúng tinh thần hội đồng cho lượt chạy, không bỏ bảo vệ Work), nhưng đây là quyết định đụng contract tiến Work → chờ Lead/owner.
Worktree: `/home/vantt/projects/forgentX-worktrees/dispatch-write-boundary`, nhánh `feat/dispatch-write-boundary` (rebase lên main b0d9fa192, 12:26; `fix/credential-phase-02-doctor-scan` đã vào main. Việc 2 `af132275b` "run a read-only contract sandboxed on a named provider" vẫn chỉ ở `fix/dispatch-followups`, chưa vào main → đề xuất 6 vẫn chờ). 3 test trong file test lane chạy lại trên b0d9fa192: 2 đỏ, 1 xanh như trước.
Council lane: `architecture-advisory` 2 lần (`wf-run-1791949058825-3690e98f`, `wf-run-1791949750327-0f2d735b`), cả hai dừng ở critique — xem dưới. Plan: [plans/261014-1045-dispatch-write-boundary/plan.md](../../261014-1045-dispatch-write-boundary/plan.md).

## Kết quả sau hội đồng một-cửa (2026-10-14, nhánh rebase lên main f69a446f0)

Phạm vi theo mục "Cập nhật sau hội đồng một-cửa" của brief lane D. Impact GitNexus báo CRITICAL cho `settleRunOutcome`, `classifyEvidenceToOutcomeFacts`, `watchWritesOutsideWorkspace` (index cũ, b334695) — đúng các đường hội đồng giao sửa; cổng là `npm test` toàn bộ. `detect_changes` so với main: chỉ các symbol dự kiến.

### Bước 1 — `RunResult.confinement` ghi backend thật (`e9c946b39`)
- Nguyên nhân (proven, đọc code + test đỏ): `settlement.mjs` so mode `'confined'` không tồn tại (`CONFINEMENT_MODES` = required/preferred/unconfined) và requirement không tới settlement → luôn `null`.
- Sửa: `ranConfinementBackend(runDir, launchCommandId, attestation)` đọc bản ghi `protected/prepared-invocation/<launchCommandId>.json` mà Confinement Authority publish (cả cửa cli-spawn supervisor lẫn herdr), `type: none` → null; không có bản ghi thì dùng attestation `outcome: enforced` của dispatch (cửa herdr/legacy: `executeAssignment` truyền `rawResult.attestation`).
- Test: `test/runner/run-result-confinement-label.test.mjs` (bwrap → `'bwrap'`; backend none dù mode required → null; attestation enforced/unconfined). Đỏ 2/3 trước sửa, xanh sau.
- Spec RUL84, CHANGELOG. UNPROVEN: chưa chạy lại một lượt bwrap thật end-to-end để thấy `confinement: "bwrap"` trong result.json (test dùng bản ghi đúng shape Authority publish).

### Bước 2 — đề xuất 8: correlated → cảnh báo (`54afd4665`)
Mọi đường từ chối (RT2-3) và cách xử lý:

| Đường | Trước | Sau |
|---|---|---|
| `cli.mjs` `strayWriteError` (cửa CLI) + `work-dispatch.mjs` (cửa Work) | throw `worktree-fail`/`wrote-outside-workspace` | `strayWriteWarning` → `result.warnings[{code:'stray-write-correlated', level, basis, repoRoot, paths}]` + stderr |
| `settlement.mjs` `classifyEvidenceToOutcomeFacts` (read-only + changedFiles/mutated dirty) | `failed` + refuse `read-only-mutation` | settlement gọi `evaluateAttributionPolicy` (trước đây 0 caller); correlated → `RunResult.warnings`; chỉ `proven` → refuse |
| `run-result.mjs` policy dự phòng (`mutated-dirty-before-files`, `read-only-mutation`) | refuse | bỏ (settlement là chỗ quyết duy nhất) |
| `run-result.mjs` `deriveEvidenceFloor` (sàn khi đọc lại, `operation-choice.mjs:386-415`) — **ngoài danh sách RT2-3, lane tìm thêm** | read-only + changedFiles → failed, hạ outcome đã settle | bỏ nhánh đó |
| `evidence-attribution.mjs` `evaluateAttributionPolicy` | refuse trên correlated | warning `read-only-mutation-correlated` / `mutated-dirty-before-correlated` / `outside-write-scope-correlated`; refuse `read-only-mutation` / `outside-write-scope` chỉ cho `proven` |
| `assignment-runner.mjs` `rollbackReadOnlyMutations` (0 caller, `git reset --soft` trên cwd) | code chết nguy hiểm | xoá |

Test:
- `test/runner/dispatch-stray-write-attribution.test.mjs` (end-to-end): cửa CLI phiên khác ghi main → status 0 + warning `plans/`; worker ghi lạc vào main (ca agy) → status 0 + warning `misplaced.mjs` (rủi ro tồn dư chấp nhận); cửa Assignment phiên khác commit giữa lượt read-only (tái hiện `wf-run-1791954133905-844903ed`) → execStatus `completed`, failure null, policy allow, outcome ok, warning `read-only-mutation-correlated`, result.json đọc lại và sàn bằng chứng vẫn ok.
- `test/runner/evidence-attribution.test.mjs`: correlated → warning; **giữ test từ chối cho ghi đã chứng minh** (proven read-only, proven ngoài write scope).
- Test cũ khoá hành vi từ chối được sửa theo hợp đồng mới (không nới): `dispatch-production-call-sites` (ca agy → warning, ca ở trong workspace → không warning), `assignment-dispatch` (commit trong lượt read-only → không refuse, có warning, không rollback), `assignment-runresult` (dirty có sẵn bị đổi → warning, evidence vẫn ghi).
- Spec RUL85, CHANGELOG.

Số RUL: main tới RUL80, `fix/dispatch-followups` giữ RUL81; lane dùng RUL84/85 để tránh đụng lane A–C — Lead đánh lại số khi merge nếu cần.

## Quan sát về chuyện nhiều cửa (ghi nhanh cho hội đồng một-cửa)

Cùng câu hỏi "executor có ghi ra ngoài chỗ được giao không" được trả lời bằng BA cơ chế khác nhau tùy cửa — proven bằng đọc code trên main 88315d5de:

| Cửa | Đo gì | Mức bằng chứng | Hậu quả |
|---|---|---|---|
| `execute <agent> --for <cap>` (`executeExecutorCli`, `src/runner/dispatch/cli.mjs:785/883`) | snapshot tập path dirty của **repo root** ngoài workspace, trước/sau lượt (`watchWritesOutsideWorkspace`, cli.mjs:143) | không phân mức; mọi path mới dirty = lỗi | throw `worktree-fail` / `wrote-outside-workspace`, bỏ cả lượt |
| Work door (`spawnWorker`, `src/runner/work-dispatch.mjs:169/265`) | y hệt trên (import cùng hàm) | như trên | như trên |
| Assignment door: `execute --contract`, `execute --assignment`, Workflow unit (`executeAssignment`, `assignment-runner.mjs:2100`; `settlement.mjs:656`) | dirty của **cwd của chính lượt** (workspace), không nhìn repo root | `attributeWorkspaceChanges` có mức proven/correlated/excluded | chỉ chặn `read-only-mutation`, `mutated-dirty-before-files`; ghi lạc ra main checkout **không bị phát hiện** |
| `evaluateAttributionPolicy` (`evidence-attribution.mjs`, mã `outside-workspace-change-correlated`) | — | — | **0 caller production** (chỉ test) — policy đã thiết kế nhưng chưa nối |

Hệ quả:
- Cửa CLI/Work từ chối nhầm (ca thật bên dưới); cửa Assignment thì bỏ sót hẳn loại lỗi mà guard 819a61e55 sinh ra để bắt (agy ghi 6 file vào main). Không cửa nào đúng cả hai chiều.
- Mô hình mức bằng chứng (proven chỉ khi có attestation của confinement trong coverage) đã có ở `evidence-attribution.mjs`, nhưng cửa CLI không dùng; nếu một cửa duy nhất thì một chỗ đo + một policy là đủ.
- Confinement cũng lệch theo cửa (RUL77): `execute --for` không lease account nên chỉ chạy được unconfined; `--contract` lease account nhưng unconfined; Workflow unit lease + confined (`host-write-denied` hoặc `workspace-write` cả workspace). Lượt viết (Doer) vì vậy luôn unconfined → câu hỏi "ghi ra ngoài" chỉ trả lời được bằng quan sát, không bằng sandbox.
- Mount workspace cũng lệch theo cửa (proven, đọc code): cửa Assignment truyền `workspaceRoot: effectiveCwd` (`assignment-runner.mjs:2712`); cửa CLI/Work không truyền → `cli.mjs:822` `workspaceRoot ?? root` → `confinement/resources.mjs:310` mount rw **cả main checkout** cho lượt confined `workspace-write` qua cửa này (critique council phát hiện, lane xác nhận). Chưa có ca thật (lượt viết qua `execute --for` hiện chạy unconfined).
- `writes:` của unit chỉ quyết rỗng/không rỗng (`bind.mjs:139`), không thu hẹp mount; đề xuất 6 (docs-only confined) cần đúng chỗ này ở cửa nào còn sống sau hội đồng.

## Đề xuất 8 — báo nhầm "ghi ra ngoài workspace"

Nguyên nhân (proven, ca thật): Doer turn 11 (`execute openai --for execute`, prompt `.fgos/runtime/tmp/doer-turn-11.md`) chạy 09:30–10:01 ngày 2026-10-14 trong `/home/vantt/projects/forgentX-phase00-documentation-authority-unification`; kết quả `.fgos/runtime/tmp/doer-turn-11.out.json` = `worktree-fail`, nêu 3 file `plans/261007-1700-provider-credential-rotation-safety/reports/code-review-261014-{0935,0945,1000}-*.md`, mtime 09:31/09:48/09:56 — báo cáo của phiên code-review credential, khác plan, ghi vào main. File 0930 (mtime 09:25, trước lượt) bị loại đúng. Bộ kiểm tra không phân biệt tiến trình ghi.

Thêm hai ca thật trong chính council của lane (proven, evidence trong `fgos workflow status`):
- Lần 1, critique reviewer (openai, read-only): `read-only-mutation` vì phiên lane commit báo cáo + ghi test vào worktree đích lúc nó chạy; evidence ghi `level: correlated, basis: pre-post-git-snapshot` mà vẫn refuse → cửa Assignment cũng refuse trên correlated.
- Lần 2, critique reviewer: stderr `wrote outside its workspace ... plans/261014-1033-dispatch-operator-improvements/reports/` — báo cáo các lane khác ghi vào main. Bộ chặn làm hỏng chính council bàn về nó.

Ca thật thứ tư (Lead chuyển, lane xác minh bằng `fgos workflow status wf-run-1791954133905-844903ed`): bước framing (claude-herdr, read-only, cwd = main checkout, không có worktree riêng) → `policy-refusal` `read-only-mutation`; evidence `gitBefore 81e07602c` → `gitAfter e7f02ed09` (`gitBeforeSource: pre-launch`), `changedFiles` = 5 báo cáo `plans/261007-1700-provider-credential-rotation-safety/reports/code-review-261014-{0930,0935,0945,1000,1010}-*.md`. Reflog main: `e7f02ed09` là commit của phiên khác lúc 12:03:38 (`docs(report): add the independent reviews ...`). Cơ chế (proven, đọc code): `computeChangedFiles` (`settlement.mjs:207`) gộp `git diff gitBefore..gitAfter` của cwd vào `changedFiles` → HEAD dịch chuyển do commit của người khác bị tính là đột biến của lượt read-only (`settlement.mjs:291`). Khác hình dạng với ca CLI (file dirty ngoài workspace): ở đây là commit vào chính checkout lượt đang đọc.

Phát hiện phụ (proven, đọc code): `rollbackReadOnlyMutations` (`assignment-runner.mjs:276`) chạy `git reset --soft gitBefore` rồi gỡ file "mới" trong cwd của lượt — nếu được gọi trong ca trên sẽ lùi commit của phiên khác trên main. Hiện **0 caller** (chỉ có định nghĩa); main vẫn ở `e7f02ed09`, 5 file còn nguyên. Code chết nguy hiểm: plan đề xuất xoá cùng phase 1.

Test tái hiện (CHƯA commit theo lệnh Lead): `test/runner/dispatch-stray-write-attribution.test.mjs`, đã sửa theo 2 finding của reviewer council (worker commit thay đổi tracked thay vì chỉ ghi file ignore; attestation store riêng của fixture, không ghi `~/.local/state`):
- `a file another session writes into the main checkout ... is not blamed` — **đỏ** (`worktree-fail`, `strayPaths: ['plans/']`).
- `a worker that leaves its workspace untouched while files appear in the main checkout is refused` — xanh (giữ bảo vệ lớp agy).
- `a commit another session lands in a read-only round's checkout is not the round's mutation` (cửa Assignment, `executeAssignment` + `validate-plan`, tái hiện ca thứ tư) — **đỏ** (`read-only-mutation`, `changedFiles: ['plans/other/reports/code-review.md']`).

Thiết kế: plan (bộ phân loại chung; từ chối chỉ khi proven hoặc chữ ký ghi lạc "workspace không delta + ngoài có path mới"; còn lại `warnings[]` trong kết quả).

## Đề xuất 6 — Doer docs-only chạy confined

Prior art: policy `workspace-write` (`confinement/policies.mjs:45`) mount rw cả workspace; không có grant hẹp hơn workspace; `writes:` chỉ quyết posture (`bind.mjs:139`). `fix/dispatch-followups` (Việc 2) chưa merge → không code. Thiết kế (plan): thu hẹp `writes:` (không capability/mode mới, theo RUL77) = kiểm footprint sau lượt (ship trước Việc 2 được) + mount hẹp theo tiền tố glob (sau Việc 2).

## Council — ghi chú chất lượng

- Không có synthesis đã review / explanation / close gate (workflow `failed` ở critique cả 2 lần). Quyết định trong plan do lane chốt từ shaping (3 ghế mù claude/openai/gemini + synthesizer xai), critique producer và báo cáo reviewer.
- Kết quả mỗi ghế ghi `confinement: null`; reviewer lần 2 gặp `EROFS` khi ghi `~/.local/state` → có vẻ đã chạy confined. UNPROVEN: trường `confinement` trong run result không phản ánh posture thật.

## Còn để ngỏ

- Kết luận hội đồng một-cửa: cửa nào còn, gọi bộ phân loại ở đâu, cửa Assignment có thêm snapshot repo root không.
- `fix/dispatch-followups` merge (điều kiện phase 3–4).
- Câu hỏi chủ: Doer docs-only confined tự commit hay Lead commit (gom khi mở phase 4).
