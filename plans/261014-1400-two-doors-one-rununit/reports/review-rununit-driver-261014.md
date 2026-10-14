# Review độc lập — lane driver (phase 10), `feat/rununit-driver`

Reviewer: code-reviewer (không phải người viết) · 2026-10-14 · diff `main...HEAD` (1 commit `e966e0057`, 11 file, +854/−160)

Đã đọc: protocol.md, phase-10, thiết kế r3-work-cut-design (đã duyệt, thắng phase file), lane report `lane-driver-261014-2017.md`.
Test focused: `env -u CLAUDE_CODE_SESSION_ID node --test test/runner/driver-rununit.test.mjs test/runner/operation-choice.test.mjs` → **165/165 pass, exit 0**.
Ngoài phạm vi review (theo brief): `loop.test.mjs` chưa chuyển; Spec/CHANGELOG nằm trong lane report.

## Tóm tắt

Phần lõi bám sát thiết kế:
- `declaredOperationFields` chỉ cộng thêm. Output của `buildAssignment` giống hệt: em đã so từng trường, kể cả `onAdvance` có điều kiện, `skills` đóng băng và `declared.workflow`.
- `runUnit` kiểm `declared` và `pinInputs` trước khi tạo thư mục, ghi cả hai vào `unit.json`, và resume đọc lại từ đó.
- `seatRoleOf` đúng cho cổng RUL73.4 và cho chỉ số fallback.
- Settlement lấy `inputDigests` từ `runMeta` khi caller không truyền.
- Walker dùng `listAssignmentRuns` với `asgnId` đầy đủ, lọc thêm theo `operation`, và so `rel` + digest.
- Nhánh không có `runResult` (refusal, pending-inline) và nhánh đọc lỗi `assignment.json` đều fail-closed.
- `rg -n "executeAssignment\(" src/runner/operation-choice.mjs` ra 0.

Còn **một lỗi High**: driver bỏ qua kết quả commit của runner.

## High

### H1. Driver bỏ qua commit thất bại của runner: operation mutating vẫn có thể `canProceed: true`

- **Ở đâu:** `src/runner/operation-choice.mjs:2337-2344` (chọn `producer.runResult`) và `:2414-2421` (trả `commit` nhưng `...interpreted` quyết định). Phía runner: `src/runner/execution/run.mjs:~721-726`, chỗ `if (commit.status === 'failed') result.outcome = 'execution-failure'`. Runner chỉ đổi `result.outcome`. `result.runResult` vẫn là RunResult `verified` của worker.
- **Kịch bản lỗi:**
  1. Loop (`loop.mjs:984`) chạy `scoped-subtask`. Worker ghi đúng file, nên RunResult ra `confidence: verified` và `changedFiles` khớp `expectedFiles`.
  2. `commitUnitWork` trả `status: 'failed'`. Lý do có thể là pre-commit hook từ chối (`git-error`), index bị stage lạ (`foreign-staged-index`), `untrusted-worktree` hay `staged-set-mismatch`.
  3. Driver đưa RunResult của producer vào `interpretAssignmentRunResult`, hàm này trả `canProceed: true, reason: 'scoped-subtask-verified'` (`operation-choice.mjs:2240-2245`). Loop đi tiếp như thể việc đã vào nhánh, trong khi file chỉ nằm dơ trong worktree và không có commit.
  4. Ca `commitPending` khi resume (`run.mjs:~640-650`, `outcome: 'execution-failure'` kèm `runResult: prior?.runResult`) cũng lọt y như vậy.
- **Vì sao không phải phương án B của 00:** thiết kế mục 7 chỉ bảo không dùng `outcome` của Unit để *đọc tín hiệu correlated*. Thiết kế không cho phép bỏ qua lỗi do chính runner gây ra sau khi worker xong. Commit là việc của runner ("chỉ runner commit"), nên runner thất bại thì bước đó thất bại.
- **Test hiện có không bắt:** `driver-rununit.test.mjs` "a mutating operation runs in the item worktree…" chỉ thử commit thành công.
- **Sửa:**
  - Sau khi lấy `producer`, nếu `producer.commit?.status === 'failed'` (hoặc `producer.outcome === 'execution-failure'` mà `runResult` lại `ok`) thì trả `stop: true, canAdvanceEdge: false, canProceed: false, reason: 'unit-commit-failed'` kèm `commit`, không gọi interpret.
  - Thêm test đỏ: fixture có pre-commit hook `exit 1` trong worktree item, rồi assert `canProceed !== true` và `reason === 'unit-commit-failed'`.

## Medium

### M1. `digestPinnedInputs` chọn gốc khớp đầu tiên, nên worktree nằm trong main checkout ra `rel` sai

- **Ở đâu:** `src/runner/dispatch/assignment-runner.mjs:1266`, `roots.find(...)`. `mainRoot` được thêm vào trước, nên mọi worktree nằm dưới nó khớp `mainRoot` trước.
- **Đã chứng minh bằng thực nghiệm** (repo tạm, `git worktree add .claude/worktrees/w1`): pin `…/.claude/worktrees/w1/docs/x/plan.md` ra `root = <main>`, `rel = ".claude/worktrees/w1/docs/x/plan.md"`.
- **Kịch bản lỗi:**
  1. Worktree nằm trong main checkout. Ví dụ: worktree `isolation:"worktree"` của Claude Code dưới `.claude/worktrees/`, `worktreeDir` cấu hình trong repo, hoặc `resolveContentRoot` chọn `process.cwd()` là một worktree lồng.
  2. Bên đọc tìm `rel === <docsRef>/plan.md` và không thấy.
  3. Walker không bao giờ tiêu thụ verdict. Mỗi lượt loop lại chạy validate-plan và tốn tiền mãi. Hướng lỗi là fail-closed, nhưng là vòng lặp tốn kém.
- **Sửa:** chọn gốc **dài nhất** chứa `real`, ví dụ `roots.filter(...).sort((a, b) => b.length - a.length)[0]`. Thêm ca test có worktree lồng.

### M2. Bytes được băm có thể khác bytes worker đọc khi caller đè `worktree`

- **Ở đâu:** `src/runner/work-dispatch.mjs:447-450` băm `<contentRoot>/<docsRef>/plan.md`. `operation-choice.mjs:2318` đè `worktree: opts.cwd`.
- **Kịch bản lỗi:**
  1. `loop.mjs:984` truyền `cwd: wt.path` cho mọi operation, kể cả validate-plan read-only.
  2. `resolveContentRoot` thử `process.cwd()` trước. Tiến trình loop đứng ở main checkout, và main có `docsRef/plan.md` (đã khoá), nên pin là bản ở main.
  3. Worker lại đọc `plan.md` trong `wt.path`, có thể là bản khác trên nhánh item.
  4. Digest ghi lại bytes của main. Bên đọc dùng cùng cách phân giải nên khớp, và verdict của plan A được gắn vào bytes của plan B.
- **Mức độ:** lỗi có từ trước (hash cũ cũng lấy theo `process.cwd()`), nhưng lane này đặt ra mục tiêu "digest lấy đúng file worker đọc". `step.mjs:73` và `loop.mjs:1620` truyền `cwd: contentRoot` nên nhất quán; chỉ đường `:984` lệch.
- **Sửa:** khi caller đưa `worktree` cho operation read-only, pin `path.join(worktree, docsRef, 'plan.md')` nếu file đó tồn tại, và chỉ lùi về `contentRoot` khi không có. Hoặc ghi rõ trong lane report đây là giới hạn đã biết của `:984`.

### M3. `opts.runnerConfig` của caller chỉ còn quyết một nửa

- **Ở đâu:** `operation-choice.mjs:2309`. `cfg` (của caller) dùng để `workUnitFor` suy capability và `prefer`. Còn `runUnit` bind theo `snapshotRunnerConfig(mainRoot)` đọc từ đĩa (`run.mjs:375`).
- **Hệ quả:**
  - Loop/step truyền `runnerConfig`, nhưng việc chọn executor, tier và posture không theo nó. Fixture phải ghi config ra đĩa mới chạy được (`unitReady` trong `operation-choice.test.mjs:466-485`).
  - Nếu config trong bộ nhớ khác config trên đĩa (override lúc chạy, config global gộp khác), capability và `prefer` (lấy từ cfg) có thể không khớp pool mà bind thấy.
  - Production hiện có lẽ cùng nguồn, nên rủi ro thấp. Nhưng đây là contract ngầm mới mà chưa có chỗ nào ghi.
- **Sửa:** tối thiểu, ghi trong JSDoc của `executeDriverOperationChoice` và trong Spec delta rằng `runnerConfig` chỉ dùng để dựng Unit, còn bind luôn đọc config trên đĩa. Tốt hơn thì bỏ `opts.runnerConfig` ở đường này và luôn dùng `snapshotRunnerConfig(stateRoot).runner`, để chỉ còn một nguồn.

## Low

### L1. Kiểm pattern lúc đầu và lúc sau lệch nhau, có thể bỏ lại `unit.json` mồ côi

- **Ở đâu:** `run.mjs:353` kiểm `callerPatternName || unit.pattern || options.pattern`, còn `run.mjs:380` ghi `pattern: options.pattern ?? unit.pattern`. Sau đó `:416` kiểm lại `unitRecord.pattern` *sau khi* `unit.json` đã được ghi.
- **Kịch bản lỗi:**
  1. Caller truyền `options.pattern: 'reviewed'` dạng chuỗi, còn `unit.pattern` là `'solo'`.
  2. Lần kiểm đầu đọc `unit.pattern` trước nên qua.
  3. Lần kiểm ở `:416` đọc `unitRecord.pattern = 'reviewed'` và throw. Thư mục unit còn lại với `execution.status: 'running'`.
  4. Driver không truyền `pattern`, nên đường Work không gặp lỗi này.
- **Sửa:** tính tên pattern một lần bằng đúng công thức của `:797`, rồi dùng chung cho cả hai chỗ.

### L2. Bộ lọc `contextRefs` của driver lệch với `validateUnit`

- **Ở đâu:** `operation-choice.mjs:2320-2322`.
- **Vấn đề:** ref tuyệt đối bị **bỏ âm thầm**, không có warning, trong khi `workUnitFor` ghi warning cho trường hợp tương tự. Còn ref chứa `\` hay `\0` lọt qua bộ lọc nhưng `validateUnit` sẽ throw, làm hỏng cả bước driver thay vì chỉ bỏ ref đó.
- **Sửa:** dùng chung `isSafeRepoRelative` mà `workUnitFor` đang dùng, và đẩy ref bị bỏ vào `built.warnings`.

### L3. Driver không còn truyền `agentType`, `capabilityHints`, `work` vào `executeAssignment`

- **Bối cảnh:** trước đây `workDispatchContext` đưa ba thứ này vào. Theo `resolve.mjs:405-416`, `agentType` chỉ có tác dụng với entry executor không có command và không có invocation. Unit luôn bind executor có invocation, nên tác động thực tế gần như bằng 0.
- **Đề nghị:** ghi một dòng vào Spec delta để 11 khỏi tưởng còn thiếu.

### L4. `onAdvance: derive-plan-verdict-from-plan-md` vẫn đọc `plan.md` lúc tiêu thụ, không kiểm digest đã pin

- **Ở đâu:** `operation-choice.mjs:2380-2394`.
- **Vấn đề:** lỗi có từ trước, không phải hồi quy. Nhưng giờ đã có `runResult.inputDigests`. Nên gọi `planEvidenceMatches` trước khi suy verdict, để không suy `decompose` từ một plan đã đổi sau khi validate.

### L5. Ca "correlated" lồng trong `driver-rununit.test.mjs` là dữ liệu dựng tay

- **Ở đâu:** ca này sửa `result.json` sau khi settle (`evidence.changedFiles`).
- **Vấn đề:** nó chứng minh walker fail-closed khi đọc trường đó, chứ không chứng minh đường phát hiện thật.
- **Có chấp nhận được không:** được. Worker read-only bị bwrap chặn ghi, nên không còn cách tạo tín hiệu thật qua driver. Lý do đổi kỳ vọng của hai test cũ trong `operation-choice.test.mjs` (`:1425`, `:1554`) đã ghi trong lane report, tên test cũng đã đổi theo, nên không vi phạm L5.

### L6. Driver dựng đường `assignment.json` bằng tay

- **Ở đâu:** `operation-choice.mjs:2347` ghép `assignmentId.split('/')` vào đường dẫn.
- **Đề nghị:** dùng `assignmentDir(fgosDir, id)` của `assignment-layout.mjs`, hàm này đã chặn đường tuyệt đối và `..`, để giống walker.

## Kiểm theo checklist của brief

| Mục | Kết quả |
|---|---|
| Thiết kế mục 1 (`declared`, stamp, solo, khớp mutation, human-only, kiểm trước mkdir) | Đạt |
| Mục 2 (`pinInputs`, gốc được phép, symlink, `rel` + digest, `planContentHash` chỉ để đọc) | Đạt, trừ M1 và M2 |
| Mục 3 (rigor 1-3 → `unit.rigor` → `policy.rigor`) | Đạt (test 3 nguồn) |
| Mục 4 (inputs tương đối) | Đạt; L2 |
| Mục 7 (runResult của producer, refusal/pending-inline → stop) | Đạt một phần: **H1** |
| Mục 8 (walker B, `asgnId` đầy đủ, lọc `operation`) | Đạt |
| Output của `buildAssignment` giữ nguyên | Đạt (so tay từng trường) |
| Cổng unit-run trong `executeAssignment` (`seatRoleOf`) | Đạt. Các chỗ đọc `asgn.role` khác (settlement claim validation, stamp mutation) cần role của operation và đang nhận đúng role đó |
| Settlement lấy từ `runMeta.inputDigests` | Đạt; `[] ?? runMeta` không vô tình lấy giá trị lùi |
| Nhánh lỗi của driver (không có result, pending-inline, refusal, `assignment.json` không đọc được) | Đạt |
| Caller `loop.mjs:984/1620`, `step.mjs:73` | Tương thích chữ ký; M2 (`:984`), M3 |
| Test bị nới | Không có test bị nới mà thiếu lý do. Thay đổi ở `architecture.test.mjs` và `assignment-enumerator-guard` làm test chặt hơn |
| Docs | Delta nằm trong lane report theo protocol. Thiếu: ghi chú M3 và L3 |

## Việc nên làm, theo thứ tự

1. H1: chặn khi commit thất bại, kèm test đỏ có hook pre-commit.
2. M1: chọn gốc dài nhất, kèm test worktree lồng.
3. M2: pin theo `worktree` khi caller đè, hoặc ghi giới hạn này vào lane report.
4. M3: một nguồn config, hoặc ghi contract.
5. L1, L2, L6: dọn nhỏ.

Status: DONE_WITH_CONCERNS
Summary: Phần lõi đúng thiết kế, `buildAssignment` giữ nguyên output, 165/165 test focused xanh. Có một lỗi High: driver bỏ qua commit thất bại của runner, nên operation mutating vẫn có thể `canProceed: true` dù không có commit.
Concerns/Blockers: H1 phải sửa trước khi merge. M1 (worktree lồng gây re-validate mãi) đã chứng minh bằng thực nghiệm.
