# Phase 02 — Runner commit chỉ trong `writes`, preflight lúc launch, resume chỉ commit

Mốc M1, bước B (song song 03, 04, 05-core) · Lane L2 (`feat/rununit-commit`) · Ước lượng 1.5d · Rủi ro: cao · Red-team gộp với 01

## Context

- Quyết định Lead #6, #8; Lead sửa plan #5 (H3/H4), #8 (4 test subject); packet r4 R0.2 + R0.5; reviewer F2; red-team RT-R4-3, R-H3, R-H4, R-L3.
- Hiện trạng: `commitUnitWork` (`src/runner/execution/commit-unit-work.mjs`) làm ba việc:
  - stage `git add -A -- . ':(exclude).fgos'` (`:48`);
  - lấy cả index (`:49`), rồi `git commit` không giới hạn path (`:61`);
  - subject = dòng đầu `summary` (`:30-34`).
- `runUnit` gọi `commitUnitWork` sau khi lượt pass (`src/runner/execution/run.mjs:499-509`); commit lỗi thì outcome thành `execution-failure` (`:507`).
- Ba call site của `commitUnitWork`: `run.mjs:500`, `src/runner/loop.mjs:374`, `src/runner/fanout-batch.mjs:119`.
- Chỗ lưu record: `unit.json` → `bindings['producer/1']` (mỗi role/round một object, theo record thật `unit-run-1791960204216-f66d640b`), có `commit` (V-L4).

## Prior art

- `5cd01e884`: runner commit; gitdir read-only cho worker confined.
- Decision 0052 (`docs/specs/runner.md:3136`).
- Giữ khung `commitUnitWork` (identity, loại trừ `.fgos`, shape trả về).

## Requirements

### Preflight lúc launch (R-H3, R-H4)

1. Trước khi spawn producer của một Unit mutating, `runUnit` (lượt mới hoặc resume) kiểm worktree:
   - **Foreign index.** Chạy `git diff --cached --name-only -z`. Không rỗng thì từ chối **trước khi spawn**, outcome `policy-refusal`, reason `foreign-staged-index`, kèm path. Không đụng index. Thông điệp: "index có thay đổi staged không do lượt này: <paths>; unstage hoặc commit chúng rồi chạy lại".
   - **File bẩn sẵn trong phạm vi.** `partitionPaths(git status --porcelain=v1 -z --untracked-files=all, writeScope).inScope`, ghi thành `preExistingInScope` trên attempt record. Không từ chối (Lead #5): các file này **không** được tự commit, caller tự quyết.
2. Bước commit kiểm lại foreign index (phòng thủ lần hai). Khe giữa bước kiểm và `git commit` (TOCTOU) chỉ phát hiện được sau commit: ghi residual (R-L3).

### `commitUnitWork({ worktree, unitId, summary, scope, changedFiles, excludePaths, needsWrites })`

3. Ứng viên lấy từ `git status --porcelain=v1 -z --untracked-files=all`, bỏ `.fgos/`, bỏ `excludePaths` (= `preExistingInScope`). Rename chưa stage hiện ra thành một xoá + một untracked, mỗi nửa xét riêng.
4. Chia bằng `partitionPaths(candidates, scope)`. Phạm vi rỗng thì trả `no-changes`.
5. Stage đúng danh sách: `git add -A --pathspec-from-file=- --pathspec-file-nul` với `GIT_LITERAL_PATHSPECS=1`.
6. Kiểm trước khi commit: tập đã stage phải bằng đúng tập trong phạm vi. Lệch thì chỉ gỡ cái mình đã stage, trả `failed: staged-set-mismatch`.
7. Commit, rồi kiểm sau commit: `git show --name-only --format= -z HEAD` phải bằng đúng tập đó. Lệch (thường do hook pre-commit) thì trả `failed: committed-set-mismatch`; commit vẫn nằm trên nhánh.
8. **Subject conventional:**
   - Dòng đầu `summary` khớp `^(feat|fix|docs|refactor|test|chore|perf|build|ci|style|revert)(\([^)]+\))?!?: \S` thì giữ nguyên (cắt ở 100 ký tự).
   - Không khớp thì dùng `chore(<unitId>): <dòng đầu, bỏ tiền tố "<unitId>: " nếu có>`.
   - Summary rỗng thì dùng `chore(<unitId>): producer changes`.
9. **outOfScope** = phần ngoài phạm vi ∩ `changedFiles` (`runResult.evidence.changedFiles`, `run-result.mjs:628`). Claim có giới hạn: file đã bẩn trước lượt mà bị sửa tiếp thì không được hứa báo (RT-R4-3).
10. Record trả về: `{status, sha?, subject?, files?, outOfScope, preExistingInScope, needsWrites?, reason?}`. Nằm ở `results[i].commit` và `unit.json` → `bindings['<role>/<round>']` (attempt tương ứng) → `.commit`. Không đổi `unit-summary.mjs` (F2).

### Resume chỉ commit (R-H4)

11. `fgos run --resume <id>` khi attempt cuối của producer có outcome lượt agent là `pass` nhưng `commit.status === 'failed'`:
   - reason `foreign-staged-index` hoặc `staged-set-mismatch`: chạy lại preflight rồi **chỉ** `commitUnitWork`, không spawn agent. Đạt thì outcome thành `pass`.
   - reason `committed-set-mismatch`: resume từ chối. Thông điệp: "commit <sha> đã nằm trên nhánh nhưng chứa file ngoài phạm vi: <diff>; xem và revert tay rồi resume".

### Outcome

12. `fgos run`: outOfScope và `preExistingInScope` là cảnh báo, không đổi outcome. Với Workflow, 05 biến `outOfScope` không rỗng thành `findings`; 02 chỉ cung cấp field.
13. Caller tầng Work (`loop.mjs:374`, `fanout-batch.mjs:119`, sẽ chuyển sang runUnit ở 09): truyền `scope: ['**']`, `changedFiles: null`, `excludePaths: []`, giữ hành vi `add -A` cũ. Foreign index ở bước commit vẫn áp dụng.

### Test khoá subject cũ (V-H3): đổi kỳ vọng có chủ đích

Lý do chung: subject conventional là quyết định Lead #6. Đường Work cũng đi qua `commitUnitWork`, nên một luật dùng cho mọi caller (RUL11). 09 sẽ đưa loop/fanout qua runUnit, khi đó kỳ vọng mới vẫn giữ.

| Test | Kỳ vọng cũ | Kỳ vọng mới |
|---|---|---|
| `test/runner/loop.test.mjs:1083-1087` | `item-nocommit: Produce the output file` | `chore(item-nocommit): Produce the output file` |
| `test/runner/fanout-batch-runner-commit.test.mjs` | `cand1: Produce the file` | `chore(cand1): Produce the file` |
| `test/runner/execution/run.test.mjs:922` | `Added the feature file` | `chore(<unitId>): Added the feature file` |
| `test/runner/dispatch-confinement-backend-p03.test.mjs:1302` | `Added f\n` | `chore(<unitId>): Added f\n` |

## Files

Sở hữu:
- `src/runner/execution/commit-unit-work.mjs`
- `src/runner/execution/run.mjs` (preflight, khối commit, nhánh resume chỉ commit)
- `src/runner/loop.mjs` (chỉ `commitWorkerChanges`)
- `src/runner/fanout-batch.mjs` (chỉ lời gọi commit)
- NEW `test/runner/execution/commit-unit-work.test.mjs`
- `test/runner/execution/run.test.mjs`
- 4 test ở bảng trên

Chỉ đọc: `write-scope.mjs`, `run-result.mjs`.

`needsWrites` do 03 thêm vào claim. Test của 02 tự đặt `agentClaim.needsWrites` trong fixture, không chờ 03.

## Bước

1. Test đỏ `commit-unit-work.test.mjs`, mỗi ca một repo tạm:
   - a. Staged ngoài phạm vi: refuse, index giữ nguyên.
   - b. Staged trong phạm vi: refuse.
   - c. Bẩn ngoài phạm vi: có trong outOfScope khi nằm trong `changedFiles`, không có khi không nằm.
   - d. Xoá file trong phạm vi.
   - e. Rename vượt ranh giới phạm vi.
   - f. Mục `writes` là thư mục.
   - g. Tên path có `*`, `[`, khoảng trắng, xuống dòng, unicode.
   - h. `.fgos/x` với scope `**`.
   - i. Hook pre-commit thêm file vào commit: `committed-set-mismatch`.
   - j. Subject: 3 ca.
   - k. 2000 file.
   - l. Scope `**` giữ hành vi cũ.
   - m. `excludePaths` không vào commit.
2. Sửa `commitUnitWork` cho xanh.
3. Test đỏ `run.test.mjs`:
   - Preflight foreign index: `policy-refusal` và **không có lượt spawn nào** (worker giả không chạy).
   - File trong phạm vi bẩn trước launch: không vào commit, có trong `preExistingInScope`.
   - Producer ghi 1 file trong + 1 file ngoài phạm vi: commit chỉ có file trong, outOfScope có file ngoài, outcome `pass`.
   - Resume sau `foreign-staged-index` ở bước commit (gây bằng cách stage giữa lượt): chỉ commit, worker giả không chạy lần hai.
   - Resume sau `committed-set-mismatch`: từ chối đúng thông điệp.
4. Sửa `run.mjs` cho xanh. Thêm `scope: ['**']` ở loop/fanout. Đổi kỳ vọng 4 test trong bảng.
5. Chạy `npm test`. Báo cáo lane có Spec delta (để 07a đưa vào decision 0060, thay mục 1-2 của 0052) và CHANGELOG delta.

## Đòn red-team (sàn, gộp 01+02)

1. Staged trước lượt, cả trong và ngoài phạm vi. Staged giữa lượt (TOCTOU): ghi residual nếu không chặn được.
2. Biến thể path: `docs` vs `docs-old/x`; `./docs`, `docs//`, `docs/`, `.`, `''`, `**`, `/abs`, `a/../b`, `:(top)x`; `app/[slug]/page.tsx` là nghĩa đen.
3. Symlink trong phạm vi trỏ ra ngoài; thư mục là symlink.
4. Submodule; file bị `.gitignore` nằm trong phạm vi.
5. Tên path có `\n`, `\t`, `"`, unicode tổ hợp.
6. Rename hoặc xoá vượt ranh giới phạm vi.
7. Hook pre-commit đổi index; `.githooks/pre-commit` chặn file mới ở gốc repo.
8. File sinh khi có và không có entry config.
9. Resume sau khi `generatedPaths` đổi.
10. File bẩn sẵn ngoài phạm vi bị sửa tiếp: không báo (khoá bằng test).
11. Người đang sửa dở `docs/x.md` trong worktree, Unit có `writes: [docs]`: file không vào commit, có trong `preExistingInScope`.

## Rủi ro + rollback

- Worker loop không confine tự `git add`: thành `worktree-fail` ở bước commit. Đo rồi báo Lead. Không thêm cờ ngoại lệ.
- Rollback: revert commit của lane.

## Xong khi

- Ca bước 1 và bước 3 xanh. 4 test subject đã đổi có ghi lý do.
- `rg -n "'add', '-A', '--', '.'" src` ra 0.
- `npm test` exit 0.
- Red-team sạch.
