# Phase 00 — Gom việc lane cũ đã xong (B, C, D)

Mốc M1, bước A (song song 01, 08) · Lane L0 (`feat/rununit-land`, phiên interactive) · Ước lượng 1d · Rủi ro: cao (file CRITICAL) · Red-team bắt buộc

## Context

- [protocol.md](protocol.md), [plan.md](plan.md).
- Báo cáo lane cũ (trên nhánh, đọc qua worktree): `dispatch-effort-model/plans/261014-1033-dispatch-operator-improvements/reports/lane-b-invocation-flags-261014-1051-dispatch-effort-model-warnings.md`, `dispatch-usage-limit/.../lane-c-261014-1051-usage-limit.md`, `dispatch-write-boundary/.../lane-d-261014-1045-dispatch-write-boundary.md`.
- Quyết định Lead #8, #9, #10 (brief 2026-10-14).

## Vì sao gom trước

Ba nhánh lane đã có code xanh/gần xanh trên `f69a446f0` (main hiện chỉ hơn 2 commit watchdog `5d18c357e`, `f59ba9701`). Chúng đụng chính các file R0-R2 sẽ sửa (`settlement.mjs`, `assignment-runner.mjs`, `run.mjs`, `bind.mjs`, `cli.mjs`). Gom trước một lần thì các đợt sau không phải rebase chồng lên nhánh dở. Gom = cherry-pick, không viết lại.

| Nhánh | Commit code lấy | Nội dung | Trạng thái test (theo báo cáo lane) |
|---|---|---|---|
| `feat/dispatch-usage-limit` (C) | `945f48006` | lượt cli-spawn exit≠0, không claim, câu hạn mức ở 5 dòng stderr cuối → `provider-limit` + `failure.cause: quota`; quarantine dùng `until` | `npm test` 7367, 0 fail |
| `feat/dispatch-write-boundary` (D) | `e9c946b39`, `54afd4665` | R0.4 confinement lấy từ backend đã chạy (`protected/prepared-invocation`); #8: mọi đường refuse correlated → warning (cli `strayWriteError`, settlement, `run-result.mjs` policy + `deriveEvidenceFloor`, `evaluateAttributionPolicy`), xoá `rollbackReadOnlyMutations` (0 caller) | **đỏ 4** ở `test/runner/operation-choice.test.mjs` |
| `feat/dispatch-effort-model` (B) | `9f34239e2`, `ef6fcb797` | effort render ở transport chung; `--effort` là override `bind()` trên `fgos run`; model drift thành `policy.provenance.modelDrift` | `npm test` 7308 pass, 0 fail |

Mô phỏng của validator (clone, cherry-pick C → D → B): không xung đột code, chỉ `CHANGELOG.md` xung đột (ở `e9c946b39`, `54afd4665`); sau đó `operation-choice.test.mjs` 148/152 pass, đúng 4 fail ở 1208/1329/2776/5302.

Xử lý từng commit ngoài 3 nhánh:

| Commit | Lấy? | Lý do |
|---|---|---|
| lane A `cec1452a8` (provenance plan/work trên Unit run), `9fc8af4b2` (help `--assignment`) | Không | lane A đóng; provenance Work trên runUnit trái hướng "Work là bên dùng"; `--assignment` bị xoá ở 06 |
| lane A `f9606262e`, `3ee2271ad` (chỉ báo cáo lane A) | Có | chỉ là docs, giữ lịch sử điều tra |
| `af132275b` | Không | owner cấm |
| `360aced90`, `5d8b7cdb1` | Không cần | đã có trên main dưới dạng `53d92958a`, `dca2e62da` (patch khác nhưng cùng nội dung, theo quyết định Lead #10) |
| `7cd8aa177` (tách test fgctl-init download) | Không | main đã tách bằng `6d900c7aa`; ngoài phạm vi |
| `b00360ebe`, `e210bb725` | Không cần | `git cherry` cho thấy đã có trên main (`8249fc9a6`, `b0d9fa192`) |

## Requirements

1. Ba nhánh vào main theo thứ tự C → D → B, `npm test` xanh sau mỗi nhánh.
2. 4 test đỏ của lane D được giải bằng **phương án B** (Lead tự quyết, xem dưới), không nới test.
3. Đánh số lại rule spec: RUL84 → **RUL82** (confinement là backend đã chạy), RUL85 → **RUL83** (snapshot nói cái gì đổi, không nói ai đổi: correlated = warning); RUL81 để trống vì tên đó đang được hội đồng dùng cho `af132275b` đã bỏ. Đoạn spec của B/C (không có số RUL) giữ nguyên chỗ.
4. Thay đổi chưa commit trong worktree lane B, D (`git status`: báo cáo lane, `plans/261014-1045-dispatch-write-boundary/plan.md`) lấy bằng patch.
5. Plan cũ `plans/261014-1033-dispatch-operator-improvements/plan.md`, `plans/261014-1045-dispatch-write-boundary/plan.md`, `plans/261014-1051-dispatch-usage-limit/plan.md`: status `superseded by plans/261014-1400-two-doors-one-rununit`, một dòng link; không xoá.

### Lead tự quyết trong plan: Work không tiến khi kết quả read-only có cảnh báo correlated

Lane D tìm ra hệ quả hội đồng chưa nêu: sau #8, cổng tiến Work (`operation-choice.mjs`) đọc kết quả read-only đã hạ refuse → warning và cho Work tiến (`validate-plan` sửa `plan.md` rồi pass → Work sang `executing`). Chọn **B**: dispatch giữ warning (không refuse lượt), còn Work — bên dùng — không tiến khi kết quả read-only mang `read-only-mutation-correlated` hoặc `mutated-dirty-before-correlated`. Work dùng **reason riêng** `validation-correlated-mutation-do-not-advance-work` (cùng `stop: true`, `canAdvanceEdge: false` như nhánh no-evidence ở `operation-choice.mjs:823-840`), không gộp vào `validation-no-evidence-do-not-advance-work`, để operator vẫn thấy tín hiệu "có thay đổi lạ" (red-team R-M1, Lead #9). Lý do: khớp quyết định #5 (Work tự quyết từ RunResult), giữ bảo vệ stale-plan của Work, không tạo lại false-refusal ở tầng dispatch. A (cho Work tiến kèm cảnh báo) bỏ vì làm mất bảo vệ đã có test khoá mà không ai yêu cầu.

## Files

Sở hữu: mọi file trong diff của 3 nhánh; `src/runner/operation-choice.mjs` (chỉ nhánh tiến Work cho kết quả read-only); `test/runner/operation-choice.test.mjs` (4 test); `docs/specs/runner.md`; `CHANGELOG.md`; 3 file plan cũ.
Chỉ đọc: worktree lane cũ.

## Bước

1. Tạo worktree `rununit-land` (protocol). Cherry-pick thêm `f9606262e 3ee2271ad` (docs lane A). `git cherry-pick 287ecf483 945f48006 3ca3b9cb7` (C). Giải xung đột nếu có, `npm test`.
2. Cherry-pick D: `04e7b4c47 2bcc4006f 292be0f48 5bbfa5123 e9c946b39 54afd4665`; áp patch chưa commit của worktree D. `npm test` → kỳ vọng đúng 4 đỏ ở `operation-choice.test.mjs` (dòng 1208/1329/2776/5302 theo báo cáo D). Nếu đỏ khác: dừng, báo Lead.
3. Viết thay đổi B cho Work-advance. Test đỏ trước, 4 test cũ đổi kỳ vọng có chủ đích (liệt kê trong báo cáo, kèm lý do):
   - test 1 (`:1208`): Work vẫn ở `planning`, có `warnings`;
   - test 2 (`:1329`): driver dừng, không tiến;
   - test 3 (`:2776`): `status` theo hợp đồng mới, Work không tiến, không rollback;
   - test 4 (`:5302`, tên hiện là "...correctly reports failed, not silently downgraded to no-evidence"): kỳ vọng thành reason `validation-correlated-mutation-do-not-advance-work`. Vẫn đúng tinh thần tên test (không bị hạ thành no-evidence). Đổi tên test thành "...reports a correlated mutation and does not advance Work, not silently downgraded to no-evidence"; lý do ghi trong báo cáo: phía Work giữ tín hiệu riêng, còn dispatch không còn tự kết luận `failed` từ bằng chứng correlated (RUL83).
   Sửa `operation-choice.mjs` cho xanh.
4. Cherry-pick B: `9f34239e2 b294c06ce 905aafc57 ef6fcb797 93c20ddfd`; áp patch chưa commit của worktree B. Xung đột dự kiến: `settlement.mjs` (`withLaunchProvenance` của B vs `ranConfinementBackend`/warnings của D), `run-result.mjs`, `assignment-runner.mjs`, `cli.mjs`, `CHANGELOG.md`, `docs/specs/runner.md`. Giải bằng cách giữ cả hai hành vi; chạy focused: `test/runner/dispatch-execute-effort.test.mjs test/runner/run-result-confinement-label.test.mjs test/runner/dispatch-stray-write-attribution.test.mjs test/runner/evidence-attribution.test.mjs test/runner/execution/run-provider-failover.test.mjs test/runner/provider-auth-failure.test.mjs`, rồi `npm test`.
5. Đánh số RUL (req 3), sửa 3 plan cũ (req 5), CHANGELOG giữ các dòng của 3 lane dưới `## [Unreleased]`.
6. Review độc lập và red-team. Đòn tối thiểu:
   - đọc riêng từng hunk tự merge ở `settlement.mjs`/`assignment-runner.mjs`/`run-result.mjs`/`cli.mjs` để tìm xung đột ngữ nghĩa giữa `withLaunchProvenance` (B) và `ranConfinementBackend` + warnings (D);
   - lượt có lease mà hết hạn mức vẫn ra `provider-limit` sau khi D hạ refuse (C × D);
   - `--effort` + warning correlated cùng lúc vẫn đủ field trong RunResult.
   Merge ff-only. Lead commit thư mục plan đã cập nhật nếu có.

## Test / validation

- Focused như bước 4 + `test/runner/operation-choice.test.mjs`.
- `env -u CLAUDE_CODE_SESSION_ID npm test; echo "exit=$?"` → exit 0 trên nhánh và trên main sau merge.
- Kiểm `rg -n "rollbackReadOnlyMutations" src` → 0 kết quả; `rg -n "mode === 'confined'" src/runner/dispatch/settlement.mjs` → 0.

## Rủi ro + rollback

- Giải xung đột sai ở `settlement.mjs` (CRITICAL, 9 luồng): mỗi nhánh một lượt `npm test`; review đọc riêng hunk xung đột. Rollback: revert từng commit của nhánh cuối cùng vào.
- `54afd4665` đổi `work-dispatch.mjs` (D7) sang warning: chấp nhận, D7 được viết lại ở 09.
- UNPROVEN (lane D): chưa có lượt bwrap thật ghi `confinement: "bwrap"`; đóng ở cổng G-M1 (ca 1).

## Xong khi

- 3 nhánh nằm trên main; 4 test operation-choice khoá "Work không tiến khi read-only có cảnh báo correlated"; `npm test` main exit 0; spec có RUL82/RUL83; 3 plan cũ trỏ sang plan này.
