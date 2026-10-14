# Lane workflow (L5) — phase 05, lõi (bước B) + CLI (bước C)

Nhánh `feat/rununit-workflow`, worktree `/home/vantt/projects/forgentX-worktrees/rununit-workflow`. Lõi làm trên main `1e8b5a048` (P01 + fix khoá resume). Sau khi Lead báo 04 đã merge, đã rebase lên main `c4d723bb1` và làm luôn phần CLI; sau đó rebase lên `a593d713e` (02) rồi `d0d9519fb` (pin persona của Unit) (yêu cầu 6-7) trên cùng nhánh. Báo cáo này phủ cả hai phần.

## Động cơ

- `--units` chưa có thật (skill dạy, code không có): **proven** — `bin/fgos.mjs` chỉ nhận `<workflowId>`/`--plan`; `startWorkflow` báo lỗi "requires workflowId, workflow, or planPath" (test đỏ).
- Unit ghi phụ thuộc unit ghi không thấy thay đổi của unit trước (H5): **proven** — worktree luôn tạo từ `HEAD` (`integrate.mjs:33`), test đỏ "Seen: none".
- Ghi ngoài `writes` vẫn pass: **proven** — test đỏ cho ra outcome `pass` với `stray.txt` đã nằm trong commit.

## Thiết kế

- NEW `src/workflow/units-source.mjs` `translateUnitsToWorkflow(path)`:
  - Đọc YAML/JSON, dạng `{id?, title?, units}` hoặc mảng.
  - Mỗi Unit qua `validateUnit`; mỗi Unit thành một step, `dependsOn` của Unit thành phụ thuộc giữa các step.
  - `inputs` thành `contextRefs`. Chỉ chép các field đã biết, nên `source`/`origin` tự khai không có tác dụng.
  - Id phải là đoạn tên nhánh an toàn (`[A-Za-z0-9][A-Za-z0-9._-]*`, không `..`, không kết thúc bằng `.` hay `.lock`), vì id đặt tên nhánh `wf/<run>/<id>`. `expectedOutputs` không rỗng thì từ chối, vì workflow unit không mang field này.
  - Gọi `validateWorkflow(def, { source: 'units-file' })`. id `units/<id|basename>`.
- `definition.mjs`: `validateWorkflow(raw, { source })`. `prefer` chỉ được phép trong unit template khi `source === 'units-file'`; top-level, step và unit-level vẫn cấm. Shape của `prefer` do `validateUnit` kiểm (lúc nạp units file và lại lúc `runUnit`). `checked.mjs` truyền options qua.
- `runner.mjs`:
  - `unitData` mang `prefer` + `persona` của template.
  - `params.effort`: kiểm bằng `assertReasoningEffort` trước khi tạo run, lưu ở `workflow.start.payload.effort`. `unitOverridesOf` thêm `reasoningEffort` vào mọi override và thêm một override không scope `{origin:'human-cli', reasoningEffort}`, cùng hình với `fgos run --effort`. Resume và answer đọc lại từ state.
  - **Nối nhánh:** `writeBaseOf` tìm unit ghi gần nhất trong các step tổ tiên; đi xuyên qua step chỉ đọc, dừng ở step `integrate`. Có đúng một unit như vậy thì worktree tạo từ sha nhánh của nó. `unit.scheduled` ghi `baseRef` + `baseSha`. `state.writeBranches` (cũng có trong `workflow status`) liệt kê `stepId, unitId, branch, worktreePath, baseRef, baseSha`. Không tự merge.
  - Từ ≥2 unit ghi (không cái nào đứng trên cái kia): **chỉ units file** bị từ chối lúc start: "merge these units into one, or make one depend on the other so they form a chain" (units file không chứa được step integrate, review vòng 2). Preset/plan cùng hình giữ base `HEAD` như trước (review M2: plan không biểu đạt được integrate step).
  - **Out-of-scope:** `outOfScopeWrites` = `commit.outOfScope` (field của 02) ∪ path đổi trong `git diff -z --no-renames <baseSha> <branch>` nằm ngoài `writeScope` của Unit run (đọc từ `unit.json`). Dùng `-z` nên tên non-ASCII khớp đúng. Đọc diff cả nhánh nên bắt được cả lượt resume và commit do producer tự làm.
  - Unit đứng trên một nhánh **chỉ kế thừa phần out-of-scope nằm trên nhánh đó** (`outOfScopeOnBranch`, lấy từ diff). Sau 02, file lạc của A được để lại, không commit, nên không giữ chân B sạch (review vòng 2).
  - Pass mà có out-of-scope thì thành `findings`; `unit.complete` ghi `outOfScope` (+ `outOfScopeOnBranch`); step fail với reason `... out-of-scope-writes: <paths>`.
  - Step `integrate` có unit phụ thuộc trực tiếp bị cờ thì **fail, không merge gì**, reason `integrate refused, nothing merged: <unit> (out-of-scope-writes: ...)`. Trước đây nó bỏ qua im lặng và báo `pass` (review vòng 2).
  - Không còn lối lùi về checkout dùng chung: base mất nhánh hoặc tạo worktree lỗi thì unit `execution-failure` kèm lý do (review M3/M4).
  - `--seats` + `unitsPath` thì từ chối (review L1).
- `store.mjs` (ngoài danh sách file của phase, không lane nào giữ): thêm `effort`, `baseRef/baseSha`, `outOfScope`, `outOfScopeOnBranch` và `writeBranches` vào projection. Cần cho "ghi vào state để resume dùng lại" và "status liệt kê branch".
- `index.mjs` export `translateUnitsToWorkflow`; `startWorkflow` nhận `unitsPath`, `effort`.
- Manifest: row `src/workflow/units-source.mjs: infra`.

### Persona: gỡ override cấp unit sau khi 04 merge

- Lúc làm lõi, `bind()` chưa đọc `unit.persona` (thuộc 04). Bỏ override ngay sẽ làm mất persona của preset/plan, nên lõi giữ override và chuyển việc gỡ sang bước C. Reviewer vòng 1 đồng ý.
- Bước C (`91f0aad99`): `unitOverridesOf` chỉ còn override theo ghế `--seats` (cộng `reasoningEffort` khi có `--effort`). Persona đi theo `unitData.persona`, bind xếp nó dưới override, trên capability.
- Đổi kỳ vọng 2 test có chủ đích:
  - `workflow-runner.test.mjs` "a unit template persona and params reach the binding and the per-role objective": đổi tên (bỏ "like a CLI override"). Kỳ vọng mới: `binding.provenance.persona.source == 'unit'`, `overrides == []`. Lý do: yêu cầu 3 của phase, persona là của Unit chứ không phải một override do workflow bịa ra.
  - "a named persona lands on its own seat only ...": overrides chỉ còn 2 entry theo ghế; persona của unit nằm ở `unit.persona` và vẫn phục vụ panelist-1/synthesizer (các assert `preferPersona` giữ nguyên, vẫn xanh).
- Test đầu của units-runner được siết: `provenance.executor == {test-node, 'unit-prefer'}`, `provenance.persona == {code-reviewer, 'unit'}`, nên `prefer` của Unit giờ thật sự dẫn binding.

### CLI (bước C)

- `bin/fgos.mjs` case `workflow start`:
  - nhận `--units <file>` và `--effort <level>`;
  - phải có đúng một trong `<workflowId>` / `--plan` / `--units`;
  - dùng `--seats` cùng `--units` thì từ chối;
  - mức effort sai bị từ chối ở `resolveStart` (trước khi tạo run).
- Đường detached: `startWorkflowDetached` ghi run, gồm workflow đã dựng và `effort`; process `workflow resume` đọc lại từ state.
- `command-registry.mjs`: thêm mô tả cho `units`, `effort` và một ví dụ. `node scripts/export-command-selectors.mjs --check` exit 0 (không thêm verb top-level); `test/rust-host/command-routes.test.mjs` xanh.

## Commit (sau rebase lên `d0d9519fb`, gồm 04 + 02 + pin persona)

- `3fb6c1175` feat(workflow): build a one-off workflow from a units file, keeping unit prefer
- `d9d9ae85a` feat(workflow): run units with their prefer and persona, a run-wide effort, and chained write branches
- `63dddb266` fix(workflow): judge unit writes by the branch diff, carry them down a write chain, and never fall back to the shared checkout
- `91f0aad99` refactor(workflow): let a unit template persona travel on the unit instead of a made-up override
- `ba281f195` feat(cli): start a workflow from a units file with fgos workflow start --units and --effort
- `b7b27b00f` fix(workflow): inherit only out-of-scope paths a base branch carries, and fail an integrate step instead of skipping a flagged unit

## Test đỏ → xanh

- `test/workflow/units-source.test.mjs` (7 ca). Đỏ: `ERR_MODULE_NOT_FOUND ... src/workflow/units-source.mjs`. Xanh 7/7.
- `test/workflow/units-runner.test.mjs` (12 ca). Đỏ lượt 1:
  - `startWorkflow requires workflowId, workflow, or planPath` (units file, nối nhánh, từ chối 2 base);
  - `actual: undefined, expected: 'high'` (effort);
  - `Missing expected rejection ... /reasoningEffort "turbo"/`;
  - `actual: 'pass', expected: 'findings'` (stray.txt).

  Đỏ lượt 2 (sau review):
  - unicode `docs/résumé.md` ra `findings`;
  - rò qua chuỗi;
  - id `fix login` không bị từ chối;
  - base mất nhánh chạy trong main checkout ("cwd resolves to the main checkout");
  - preset 2 base bị từ chối.

  Xanh 12/12.
- Ca effort dùng một CLI giả tên `agy` (fgOS có cờ `--effort` cho CLI này), nên lượt chạy chứng minh `--effort high` thật sự nằm trong argv. Executor `node` trơn bị transport từ chối effort, và đó là hành vi đúng.
- Ca "`--seats` vẫn ghim persona theo ghế": phủ bởi test có sẵn `workflow-runner.test.mjs:~1951` (vẫn xanh, override theo ghế giữ nguyên).
- CLI:
  - Đỏ: `bin/fgos.mjs` ở HEAD trước khi sửa trả `workflow start requires <workflowId> or --plan <path>` cho `--units` (cả khi có `--seats`).
  - Xanh: `test/cli/fgos-workflow.test.mjs` ca mới (6 ca từ chối, không tạo run) và `units-runner.test.mjs` ca "fgos workflow start --units <file> --effort ..." chạy thật qua CLI (2 unit ghi nối nhánh, effort `high` tới argv).
- `test/workflow/*` + `test/architecture.test.mjs` + `test/cli/fgos-workflow.test.mjs` + `test/rust-host/command-routes.test.mjs`: 149/149 xanh.

## Impact (GitNexus present; index của main checkout, stale so với HEAD lane)

- `validateWorkflow` MEDIUM (3 caller trực tiếp, module Workflow).
- `unitOverridesOf` LOW; `advanceWorkflowRun` LOW (3 caller).
- `resolveStart` không có trong index → cross-check `rg`: 2 caller (`preflightWorkflowSeats`, `prepareWorkflowRun`).
- Không có HIGH/CRITICAL. Không sửa `bind`/`run.mjs`/`settlement`.
- Đổi hành vi ngoài units file, đã ghi ở CHANGELOG delta:
  1. Unit ghi của plan/preset có đúng một unit ghi tổ tiên giờ khởi đầu từ nhánh của unit đó, không còn từ HEAD.
  2. Tạo worktree lỗi thì unit fail, không còn lùi về checkout dùng chung.

## `npm test`

- Lượt 1 (sau rebase, trước fix review): exit 1, 7371 pass / 2 fail. Hai ca fail:
  - `test/runner/execution/run-herdr.test.mjs` "headless (no herdr) runs cli-spawn ...";
  - `test/runner/herdr-reconciliation.test.mjs` "20. live Herdr gateway ...".

  Chạy riêng 2 file: 53/53 xanh. Flake khi tải cao (3 lane khác chạy song song); diff không đụng herdr.
- Lượt 2 và 3: bị dừng giữa chừng, vì Lead báo main nhận 04 rồi 02 và phải rebase lại.
- Lượt 4, ở `ced5dc4cc` (đã rebase lên `a593d713e`): **exit 0, 7515 tests, 7440 pass, 0 fail**.
- Lượt 5 (sau fix review vòng 2): dừng vì main nhận fix pin persona.
- Lượt 6, ở `b7b27b00f` (đã rebase lên `d0d9519fb`): xem Kết quả cuối.

## Review độc lập

`code-reviewer`: [review-lane-workflow-core-261014.md](review-lane-workflow-core-261014.md), DONE_WITH_CONCERNS.

| Finding | Xử lý |
|---|---|
| H1 tên non-ASCII báo nhầm out-of-scope | Sửa: diff `-z` |
| H2 rò qua chuỗi ghi | Sửa: kế thừa outOfScope |
| M2 luật 2 base với plan | Sửa: chỉ units file từ chối, preset/plan giữ HEAD |
| M3 lùi im lặng | Sửa: fail có lý do |
| M4 id không hợp lệ làm tên nhánh | Sửa: kiểm id trong units-source |
| M5 sót commit của lượt resume/producer tự commit | Sửa: diff cả nhánh |
| L1 seats+units | Sửa: từ chối |
| M1 writer sau integrate đứng trên HEAD chứ không trên target | Residual, như trước |
| L3 nhánh tồn tại bỏ qua baseRef (`integrate.mjs`, chỉ đọc) | Residual |
| L4 `writeBranches` giữ path worktree đã xoá (status kèm `worktrees.removed`) | Residual |
| L2, L5, L6 | Ghi nhận; L6 (prefer chưa có tác dụng) hết hiệu lực khi 04 merge, test đã siết `unit-prefer` |

Vòng 2 (sau fix, gỡ persona, CLI, rebase 02): [review-lane-workflow-round2-261014.md](review-lane-workflow-round2-261014.md), DONE_WITH_CONCERNS. Persona refactor và CLI: đúng.

| Finding | Xử lý |
|---|---|
| Kế thừa outOfScope quá chặt sau 02: B sạch bị hạ `findings`, không tích hợp | Sửa: chỉ kế thừa `outOfScopeOnBranch`; test "an out-of-scope file left uncommitted ... does not hold back the clean writer" (đỏ: `actual: ['stray.txt'], expected: undefined`) |
| Integrate bỏ qua unit bị cờ mà vẫn `pass` | Sửa: step integrate fail, không merge; test mới (đỏ trước khi sửa) |
| Thông điệp từ chối khuyên "add an integrate step", units file không làm được | Sửa: "merge ... or make one depend on the other"; help cũng sửa |
| Id kết thúc bằng `.` | Sửa: từ chối |
| Integrate nuốt lỗi merge (cả conflict) | Residual, có từ trước lane (`runner.mjs` "If branch didn't have commits or already merged, ignore") |
| M1 (writer sau integrate đứng trên HEAD) | Residual, ghi trong Spec delta |
| Không có test cho stray do producer tự commit | Không dựng được: worker confined không ghi được gitdir; đường đó được phủ bằng logic diff nhánh (`outOfScopeOnBranch`) |
| `--effort` mà executor không hỗ trợ chỉ lộ khi unit đó bind; `--effort` trên `workflow resume` bị bỏ qua; `git diff` lỗi thì không báo gì; `--foreground false` + `--plan` bị từ chối; đường detached chưa có test | Ghi nhận, residual Low |

## Spec delta (cho decision 0061, 07a áp)

- `fgos workflow start --units <file>`: units file (YAML/JSON, `{id?,title?,units}` hoặc mảng Unit).
  - Mỗi Unit thành một step; `dependsOn` thành phụ thuộc step. Id Unit là đoạn tên nhánh an toàn.
  - Workflow id `units/<id|basename>`.
  - Nguồn `units-file` do loader truyền cho validator, không phải field dữ liệu.
  - Chỉ nguồn này cho `prefer` trong unit template; preset/plan vẫn cấm (G2).
- `--effort <level>` của workflow: override `{reasoningEffort, origin:'human-cli'}` cho mọi unit, lưu trong `workflow.start`, resume dùng lại. Mức ngoài `low|medium|high|max` bị từ chối trước khi tạo run.
- Unit ghi:
  - Đứng trên đúng một unit ghi tổ tiên (trực tiếp hoặc qua unit chỉ đọc; step integrate chặn đường đi) thì worktree tạo từ sha nhánh của unit đó.
  - Units file có unit ghi đứng trên ≥2 unit ghi thì bị từ chối lúc start.
  - Không tự merge; `writeBranches` liệt kê nhánh/worktree/base.
- Ghi ngoài scope (commit báo, hoặc diff nhánh ngoài `writeScope`): unit ra `findings` (reason `out-of-scope-writes`). Unit đứng trên nhánh đó kế thừa phần nằm trên nhánh. Step integrate có unit phụ thuộc bị cờ thì fail và không merge gì.
- Persona trong unit template đi theo Unit (provenance `unit`); override chỉ còn cho ghế `--seats`.
- Residual: unit ghi sau step integrate vẫn bắt đầu từ HEAD của main checkout, không từ target của integrate.
- Unit ghi không có worktree riêng (base mất nhánh, tạo worktree lỗi) thì fail, không bao giờ chạy trong checkout dùng chung.

## CHANGELOG delta (cho `## [Unreleased]`, 07a áp)

- Added: `fgos workflow start --units <file>` (YAML/JSON list of Units): chạy một danh sách Unit như một Workflow tạm, mỗi Unit một step. Unit có thể mang `prefer` (ưu tiên mềm) và `persona`; không đi cùng `--seats`.
- Added: `fgos workflow start --effort <level>`: mọi unit của run xin cùng reasoning effort, giữ qua resume.
- Changed: `persona` trong unit template của workflow đi theo Unit (provenance `unit`), không còn là override `origin: workflow`.
- Changed: unit ghi trong workflow đứng trên một unit ghi khác giờ bắt đầu từ nhánh của unit đó (trước đây từ HEAD); `workflow status` có `writeBranches`.
- Changed: unit ghi file ngoài `writes` kết thúc `findings`; một step integrate gặp unit như vậy thì fail và không merge gì (trước đây nó bỏ qua im lặng).
- Changed: unit ghi không tạo được worktree riêng giờ fail, không còn chạy trong checkout dùng chung.

## Để ngỏ

- File chung: `store.mjs` + `checked.mjs` không nằm trong danh sách file của phase, nhưng không lane nào giữ; Lead xác nhận.
- Lane 02: `commit.outOfScope` nên tính từ danh sách path không quote (`-z`), nếu không sẽ báo nhầm tên non-ASCII giống H1. Runner của workflow đã tự bảo vệ phần đã commit bằng diff `-z`.
- Residual: M1, L3, L4 ở bảng trên; base của B cũ đi khi A bị chạy lại sau khi B đã tạo worktree (`baseSha` hiện trong status).

## Kết quả cuối

- HEAD `b7b27b00f`, rebase trên main `d0d9519fb` (không đi sau main).
- `env -u CLAUDE_CODE_SESSION_ID npm test` lượt 6: exit 1, 7517 tests, 7441 pass, **1 fail**.
  - Ca fail: `test/runner/herdr-prompt-ready.test.mjs` "a process that never draws anything is typed at after a bounded wait rather than waited on forever" (62ms, chờ có giới hạn thời gian).
  - Chạy riêng file đó 3 lần: 11/11 xanh cả 3. Diff của lane không đụng herdr, nên đây là flake về thời gian khi máy tải cao, không phải hồi quy.
  - Lượt 4 ở code tương đương (trước fix vòng 2 và pin persona) đã exit 0.
- Focused sau rebase cuối: `test/workflow/*` + architecture + `test/cli/fgos-workflow.test.mjs` 136/136; cộng thêm `command-routes` thì 150/150 ở lượt trước. `export-command-selectors --check` exit 0.
- Không commit `.fgos/**`. Không đụng main checkout, không merge, không push.
- Red-team: phase 05 không nằm trong danh sách bắt buộc. Hai vòng review độc lập đã chạy.

Status: DONE_WITH_CONCERNS
Summary: Xong cả lõi và CLI của phase 05:
- `--units` (units-source, `prefer` chỉ cho nguồn units-file), `--effort` lưu trong run;
- persona đi theo Unit, unit ghi nối nhánh, ghi ngoài scope thành `findings` và chặn integrate;
- hai vòng review đã xử lý hết finding High/Medium, trừ residual có ghi;
- `npm test` xanh ngoại trừ một flake herdr đã chạy riêng lại và xanh.

Concerns:
1. `store.mjs` và `checked.mjs` nằm ngoài danh sách file của phase (không lane nào giữ); Lead xác nhận.
2. Còn residual: integrate nuốt lỗi merge (có từ trước); writer sau integrate bắt đầu từ HEAD (M1); `--effort` không hỗ trợ chỉ lộ khi unit bind; đường detached của `--units` chưa có test.
3. Flake `herdr-prompt-ready` ở lượt cuối (chạy riêng lại thì xanh).
