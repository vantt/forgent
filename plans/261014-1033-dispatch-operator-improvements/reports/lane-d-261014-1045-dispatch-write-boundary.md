# Lane D — ranh giới ghi (đề xuất 6, 8)

Status: đang chạy — code production TẠM DỪNG theo lệnh Lead 10:45 (chờ kết luận hội đồng một-cửa).
Worktree: `/home/vantt/projects/forgentX-worktrees/dispatch-write-boundary`, nhánh `feat/dispatch-write-boundary` (từ main 88315d5de).
Council lane: `architecture-advisory` run `wf-run-1791949058825-3690e98f` (đang chạy).

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
- `writes:` của unit chỉ quyết rỗng/không rỗng (`bind.mjs:139`), không thu hẹp mount; đề xuất 6 (docs-only confined) cần đúng chỗ này ở cửa nào còn sống sau hội đồng.

## Đề xuất 8 — báo nhầm "ghi ra ngoài workspace"

Nguyên nhân (proven, ca thật): Doer turn 11 (`execute openai --for execute`, prompt `.fgos/runtime/tmp/doer-turn-11.md`) chạy 09:30–10:01 ngày 2026-10-14 trong `/home/vantt/projects/forgentX-phase00-documentation-authority-unification`; kết quả `.fgos/runtime/tmp/doer-turn-11.out.json` = `worktree-fail`, nêu 3 file `plans/261007-1700-provider-credential-rotation-safety/reports/code-review-261014-{0935,0945,1000}-*.md`, mtime 09:31/09:48/09:56 — báo cáo của phiên code-review credential, khác plan, ghi vào main. File 0930 (mtime 09:25, trước lượt) bị loại đúng. Bộ kiểm tra không phân biệt tiến trình ghi.

Test tái hiện (đỏ, CHƯA commit theo lệnh Lead): `test/runner/dispatch-stray-write-attribution.test.mjs` — worker cli-spawn chỉ ghi trong worktree; test (đóng vai phiên khác) ghi `plans/other/reports/code-review.md` vào main giữa lượt → hiện tại `worktree-fail`, `strayPaths: ['plans/']`.

Thiết kế: chờ council lane + kết luận một-cửa.

## Đề xuất 6 — Doer docs-only chạy confined

Prior art: policy `workspace-write` (`confinement/policies.mjs:45`) mount rw cả workspace; không có grant hẹp hơn workspace. `fix/dispatch-followups` (Việc 2: cửa đọc-only confined giữ provider) chưa merge vào main → không code. Thiết kế: chờ council + một-cửa.

## Còn để ngỏ

- Kết luận council lane (a)/(b).
- Kết luận hội đồng một-cửa: cửa nào còn, đo ghi-lạc ở đâu.
