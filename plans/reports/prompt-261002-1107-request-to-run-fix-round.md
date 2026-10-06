# Prompt: vòng sửa chung P1–P4 của track request-to-run — làm xanh, làm thật, chứng minh bằng lần chạy thật

Dán phần dưới dòng `---` cho agent thực thi. Mở agent ở `/home/vantt/projects/forgentX`. **Executor: claude hoặc codex** (không dùng gemini/agy — lượt P1–P4 trước báo "accepted" cho những thứ chưa từng chạy).

---

## Bối cảnh (discussion lead đã kiểm chứng, 2026-10-02 11:07)

Track: `plans/261001-0327-request-to-run-track/plan.md`. P1–P4 đã merge `main` (`191d75c42`), mọi phase ghi `done`, nhưng **kết quả không khớp tiêu chí xong**:

1. **Suite đỏ.** Trước P1 (`dc677ac16` + fixes, 2026-10-01): 7858 pass / 0 fail. Sau P1–P3: 180 fail. Sau P4: **6393 pass / 34 fail** (13 file: `dispatch.test.mjs` 14, `dispatch-governance-provider-denylist` 4, `assignment` 3, `dispatch-governance-operability` 2, `assignment-provenance` 2, `observe-contracts-fixtures` 2, và 1 mỗi file: `effective-execution-contract`, `dispatch-reconciliation`, `dispatch-r9-performance-cache`, `dispatch-i08b-remediation`, `dispatch-confinement-authority`, `assignment-runresult`, `assignment-policy`). Đáng lo nhất: **5 × "Missing expected rejection"** ở governance — có thể là lỗ hổng an toàn, không phải test cũ.
2. **P3b lách guard thay vì làm thật.** Work vẫn còn `stage` (`src/state/replay.mjs` xử lý `work.stage`, `item.stage`; `src/state/workflow-stage-graphs.mjs`, `stage-fsm.mjs`, verb `src/verbs/state/stage.mjs` còn, ~10 module import). Guard "dispatch không import `src/state/**`" đạt được bằng **chép cứng đồ thị stage domain coding 3 lần** (`src/runner/dispatch/operation-choice.mjs`, `assignment.mjs`, `cli.mjs` — commit `ad9a23a9f`); `cli.mjs` tự viết lại bộ đọc event Work; `assignment-runner.mjs` **mất kiểm tra "operation không hợp lệ cho stage"**. Hệ quả đã thấy: `unknown operation "resolve-question" for stage "planning"`.
3. **Không có lần chạy thật nào.** Mọi store (checkout chính + worktree): 0 `unit.json`, 0 `.fgos/workflow-runs/*`. Nhưng báo cáo nghiệm thu P1 ca 1 (số liệu "12 lệnh → 1", "~45 phút" không có run id), P3 smoke marketing, P4 ca 3 ("mọi bước ghi event vào `.fgos/workflow-runs/<id>/events.jsonl`") đều ghi "Accepted". P1 phase 6 tick "Spike đạt (báo cáo)" nhưng **không có báo cáo spike herdr**. P4 ca 2 ghi "verified" trong commit nhưng **không có file báo cáo**.
4. **Test bị xoá ngoài engine** (cần xác minh có chính đáng không): `test/runner/run-result-consumers.characterization.test.mjs`, `cohort-planner.test.mjs`, `cohort-planner-purity.test.mjs`, `group-cognition-framework.test.mjs`. Tổng 79 file test bị xoá giữa `a59f95eff` và `main`.

Phần có thực chất, **giữ**: `src/runner/execution/{bind,run,unit}.mjs`, `patterns/{solo,reviewed,panel,presets}.mjs`, `src/workflow/**`, `core/workflows/*.yaml`, skill `fgos-run`, outcome `provider-limit`, không còn `unit-runs`/`readOnlyRedirects`/`placement-policy`. Không revert P1–P4.

Mốc tham chiếu engine cũ: tag **`pre-engine-retirement`** (`13f7f01fd`, cuối P4 phase 5). Backup session cũ: `.fgos/backups/coordination-sessions-backup.tar.gz` (307 session).

## Việc, theo thứ tự

Làm trong worktree riêng: `git worktree add ../forgentX-r2r-fix -b fix/request-to-run-round main`; symlink `node_modules` **và** `target`. Mọi test chạy `env -u CLAUDE_CODE_SESSION_ID`. Không commit ở checkout chính khi suite đang chạy.

### A. Governance và an toàn trước (chặn mọi việc khác)
- 5 "Missing expected rejection" + `dispatch-confinement-authority` + `dispatch-governance-*`: tìm commit làm mất chặn (`git log -S` / bisect giữa `dc677ac16` và `main`). Hành vi chặn là **contract đúng** trừ khi plan ghi rõ bỏ nó → sửa code, không sửa test.
- Đối chiếu **ledger bất biến an toàn** của P4 phase 1 (`plans/261001-0327-request-to-run-p4-discussion-patterns-engine-retirement/plan.md`): mỗi gate engine cũ (`assertMutatingDispatchAllowed`, `assertNoPortableExecutorPin`, `READ_ONLY_ROLES`, visibility, protocol stamp) phải có chủ mới **có test**, hoặc dòng "retire có owner duyệt". Thiếu → bổ sung hoặc báo.

### B. Làm lại P3b cho thật (`plans/261001-0327-request-to-run-p3-workflow-separate-from-work/phase-03`, `phase-05`)
- Xoá 3 bản chép cứng trong dispatch. Dispatch lấy operation/taskSpec/skill **từ Workflow definition** (`src/workflow/definition.mjs` + `domains/*/workflows/*.yaml`), truyền vào qua Unit/Assignment — dispatch vẫn không import `src/state/**`, và **không** chứa literal tên domain/stage.
- Khôi phục kiểm tra "operation hợp lệ" (nay: hợp lệ cho bước của Workflow).
- Work bỏ `stage` thật: `src/state/work.mjs`, `replay.mjs`, `store.mjs`; một đường đọc dữ liệu cũ (`stage` → `workflowStep`/Workflow run); xoá `workflow-stage-graphs.mjs`, `stage-fsm.mjs`, verb `stage` cũ khi không còn consumer. Rust `packages/work-state/rust` đọc version mới.
- Guard kiến trúc thêm: cấm literal domain/stage trong `src/runner/dispatch/**`, `src/runner/execution/**`.

### C. Làm xanh phần còn lại
- Phân loại từng fail: test cũ (cập nhật theo contract mới **có trong plan**) / hồi quy (sửa code) / thiếu file (`packages/coordination-state/contracts/...` — nếu crate đã xoá theo plan thì test Observe đọc contract mới). Mỗi dòng có `file:line` + lý do.
- 4 file test bị xoá ngoài engine: chứng minh phần code chúng phủ đã bị xoá theo plan, hoặc khôi phục test (từ `a59f95eff`/tag) và cập nhật.

### D. Nghiệm thu thật — bằng chứng là file trong store, không phải lời kể
Chạy trên **store của checkout chính** (`--dir /home/vantt/projects/forgentX`), executor thật (claude/codex), qua **pane herdr** nếu herdr có mặt (G7):
1. **Spike herdr + bwrap** (P1 phase 6 bước 0): reviewer read-only trong pane herdr — ghi repo bị chặn, ghi outbox được. Báo cáo: `plans/261001-0327-request-to-run-p1-execution-core/reports/spike-herdr-bwrap.md`.
2. **Ca 1** (P1): một Unit docs thật qua `fgos run --pattern reviewed` → `unit.json` + assignment producer/checker tồn tại.
3. **Smoke marketing** (P3): `fgos workflow start` `content-publish` → park ở cổng người → answer → hoàn tất.
4. **Ca 2** architecture-advisory + **ca 3** business-discussion (P4): mỗi ca một Workflow run hoàn tất.
5. **So với engine cũ** (ít nhất ca 2): dựng worktree tại tag `pre-engine-retirement`, chạy cùng câu hỏi qua engine; so số vai, ràng buộc độc lập, tới trạng thái cuối, thời gian, Lead-active.

Mỗi báo cáo nghiệm thu **bắt buộc** liệt kê: `unitRunId`/`workflowRunId`, đường dẫn `unit.json` / `events.jsonl` / outbox, transport thật (herdr hay cli), số đo lấy từ file. Ca nào không chạy được → ghi **NOT RUN + lý do**, không ghi Accepted. Sửa lại các báo cáo nghiệm thu cũ (P1 ca 1, P3, P4 ca 3) cho khớp sự thật.

### E. Đóng
- Full `npm test` xanh (Node + Rust) trong worktree; merge `main` (`--no-ff`, từ checkout chính đang ở `main`, không checkout nhánh khác ở đó).
- Cập nhật frontmatter/ghi chú P1–P4 + track `plan.md` cho đúng trạng thái thật.
- **Không** làm P5 (thuật ngữ + đóng track) — để sau, discussion lead giao riêng.

## Ràng buộc
- Không chạy `fgos submit/pick/move/approve`.
- Không xoá test để làm xanh; không skip không lý do.
- Không sửa test để hợp thức hoá việc mất một hành vi chặn/an toàn.
- Commit sau mỗi mục xanh; hết context → ghi trạng thái (mục nào, commit nào, fail còn lại) vào track `plan.md` cho agent kế.

## Bàn giao
```text
Status: DONE | DONE_WITH_CONCERNS | BLOCKED
Full npm test trên main sau merge: tests/pass/fail
A: gate an toàn — nguyên nhân + commit sửa
B: P3b — bằng chứng Work không còn stage (rg), dispatch không literal domain/stage
C: bảng fail → nguyên nhân → xử lý
D: mỗi ca: run id + đường dẫn file + transport + số đo, hoặc NOT RUN + lý do
Concerns
```
