# Lane gitparse: đọc mọi danh sách path của git bằng -z, gom về một parser

Worktree `/home/vantt/projects/forgentX-worktrees/rununit-gitparse`, nhánh `feat/rununit-gitparse`, base main `704c603ce` (đã rebase sau docs-a). Item ngoài phase, đợt C.

## Động cơ (proven)

Không có `-z`, git C-quote tên có byte non-ASCII, tab, `"`, `\` (`core.quotePath`); `git status` quote cả tên có dấu cách. Parser tách dòng + `trim` cắt dấu cách đầu/cuối. Settlement đã sửa (lane settle). Phần còn lại, chứng minh bằng test đỏ trên code main:

- `merge.mjs changedFiles` (Iron Law `filesChanged`, `runnerOwnDiff` của approve/sync-root, postLand, conflict giữa leaf): trả `'"t\303\240i li\341\273\207u/ghi ch\303\272.md"'`, mất nửa nguồn của rename.
- `isWorkingTreeClean` (gate của approve/sync-root/return/main-checkout-reset): file own (từ footprint, không quote) bẩn mà status trả bản quote → không khớp → **gate nói sạch** (`true !== false`). Rename staged với tên tiếng Việt: như vậy. File own untracked trong thư mục mới: status gộp `dir/` → gate nói sạch.
- `nextFreeDecisionId`: decision slug tiếng Việt bị quote → regex trượt → `'0001' !== '0042'` (đụng số decision).
- `postLandDrift`: thiếu path chung tiếng Việt và path một bên rename đi.
- `bin/fgos.mjs changedFilesSince` (đường `return`): footprintDiffHits báo nhầm `"\"ghi ch/303/272.md\""` cho file nằm trong footprint.
- Worker prompt (snippet Iron Law): `status --porcelain` + `slice(3)` → tên quote → phân loại sai.

## Thiết kế

`src/util/git-paths.mjs` (kernel, thuần, không I/O): `nulPaths` (`diff/ls-tree/show --name-only -z`), `statusPaths` (`status --porcelain=v1 -z`: rename/copy ra **cả hai nửa**, bỏ `/` cuối, dedupe), `nameStatusPaths` (`diff --name-status -z`), `GIT_LIST_MAX_BUFFER` (64 MiB). Mỗi caller giữ git wrapper riêng (commit-unit-work giữ `cleanEnv`), chỉ parse qua helper. Quy tắc chung cho diff reader: `--no-relative`.

| Chỗ gọi | Trước | Sau |
|---|---|---|
| `settlement.mjs` `safeGitStatusFiles`/`safeGitCommittedDiffFiles` | parser riêng -z | helper + maxBuffer + `--no-relative` |
| `commit-unit-work.mjs` `changedPaths`/`stagedPaths`/commit check | parser riêng -z, `nulList` | helper, `--no-relative` |
| `worktree.mjs` `checkoutDirtyPaths` | -z, chỉ tên mới, untracked gộp | helper, `--untracked-files=all`, maxBuffer |
| `claim-liveness.mjs` | -z, chỉ tên mới | helper, `-uall` (nửa nguồn không tồn tại → statSync bỏ qua) |
| `merge.mjs isWorkingTreeClean` | dòng + `isFgosOnlyStatusLine` (split `' -> '`) | `-z -uall` + `isIgnorableStatusPath` (path-level, `normalizePath` cả hai phía), prefix chỉ bỏ `\n` |
| `merge.mjs changedFiles`, staged-paths (merge), `--diff-filter=U` ×4, `ls-tree` ×3, `--name-status` ×2 | dòng | `-z` + helper, `--no-renames` nơi cần cả hai nửa |
| `merge.mjs branchContentMismatch` | dòng | `-z`, **giữ rename detection** (chỉ tên mới — xem dưới), `--literal-pathspecs` |
| `state/postland-drift.mjs` | dòng + trim cả output | `-z --no-renames` |
| `bin/fgos.mjs changedFilesSince` | dòng | `-z --no-renames` |
| `workflow/runner.mjs outOfScopeWrites` | tự split NUL | `nulPaths`, `--no-relative` |
| worker prompt snippet | status dòng | `diff HEAD -z` + `ls-files --others -z`, **không import** (worktree cũ chưa có helper) |
| `isCheckoutDirty`, `isDirtyRelativeToSync`, `session.mjs` reclaim, workflow cleanup (chỉ hỏi rỗng/`??`) | không đổi parse | thêm `--untracked-files=normal` (guard chống mất dữ liệu bị `status.showUntrackedFiles=no` che) |

Ngoại lệ "chỉ tên mới": `branchContentMismatch`. Với `--no-renames`, branch rename `a→b` sau khi main đã xoá `a` → merge không đổi `a` → báo "content discarded" giả → `verify-fail` (review L2). Giữ rename detection như cũ.

Đổi API: `isFgosOnlyStatusLine(line, …)` bỏ, thay `isIgnorableStatusPath(path, …)` (bin chỉ import, không dùng). Thêm `GIT_LIST_MAX_BUFFER`; `gitAt` (bin) nhận `{maxBuffer}` tuỳ chọn.

Không đổi (đã soát bằng rg): status/diff chỉ kiểm rỗng (`drift-status.mjs:78`, `merge.mjs` sweep, `events-jsonl-truncation-guard.mjs`, `bin` main-checkout-reset hiển thị), `worktree.mjs` resync (đọc cột status, quote không ảnh hưởng), `scripts/test-select.mjs` (đã -z), `scripts/prepare-release.mjs`/`test-timing.mjs` (chỉ rỗng/đếm). Ngoài `src/`: `core/skills/distill/scripts/distill.mjs:383` vẫn split `ls-files` theo dòng (skill của người khác — ghi item).

## Commit

- `1997ba9f5` fix(git): read every git path list NUL-separated through one parser, renames as both halves
- `d5c10ca23` fix(git): read path lists past 1 MiB, ignore diff.relative and status.showUntrackedFiles
- `794928358` test(return): match a quoted footprint name byte for byte and block on its dirty copy

## Test đỏ → xanh

Lượt 1 (`merge-quoted-paths.test.mjs`, `test/util/git-paths.test.mjs`), đỏ trên code main:

- `changedFiles lists … byte for byte, a rename as both halves`: `+ '" l\341\273\201 .md"', + '"m\341\273\233i.md"', + '"t\303\240i li\341\273\207u/ghi ch\303\272.md"'` / `- ' lề .md', - 'cũ.md', …`
- `isWorkingTreeClean blocks on the item's own dirty Vietnamese and edge-space paths` / `… staged rename …` / `… untracked file inside a new directory`: `true !== false`
- `nextFreeDecisionId reads a decision file with a Vietnamese slug`: `'0001' !== '0042'`
- `postLandDrift names a shared Vietnamese path and a path one side renamed away`: `+ '"t\303\240i…"'`, `- 'cũ.md'`
- `git-paths.test.mjs`: module chưa có.
- Ca edge-space còn đỏ sau sửa đầu (`normalizePath` trim phía own set, status thì không) → chuẩn hoá phía status trong `isIgnorableStatusPath`.

Lượt 2 (đòn review/red-team), đỏ trên commit 1:

- `… answer on an untracked tree listing over 1 MiB`: `spawnSync git ENOBUFS`
- `a dirty own file in a subdirectory blocks the subtree gate even with diff.relative set`: `+ 'x.js'` / `- 'sub/x.js'`
- `isWorkingTreeClean exempts .fgos under a subdirectory whose name starts with a space`: `false !== true`
- `checkoutDirtyPaths names a new file inside an already-untracked directory`: `- 'scratch/stray.txt'`
- `checkoutDirtyPaths sees untracked files when status.showUntrackedFiles is no`: `- 'new.md'`
- Thêm sau: `isCheckoutDirty … showUntrackedFiles is no`, pin `normalizePath` collision (fails closed).

E2E `test/cli/fgos-return-quoted-paths.test.mjs` (qua `bin/fgos.mjs return` thật): đột biến trả `changedFilesSince` về parser dòng → đỏ `got [".fgos/coexistence.json","\"ghi ch/303/272.md\""]`; ca "file own bẩn chặn return" xanh cả trên code cũ (hai phía cùng quote) — giữ làm guard.

Đổi kỳ vọng test cũ (tên test vẫn đúng):

- `merge.test.mjs`: 7 test `isFgosOnlyStatusLine` (dòng) → `isIgnorableStatusPath` (path); test rename line `"a -> b"` → test `isWorkingTreeClean` với rename staged thật.
- `prompt-templates.test.mjs` golden: snippet mới.
- `dispatch-stray-write-attribution.test.mjs`: `paths: ['plans/']` → `['plans/other/reports/code-review.md']` (checkoutDirtyPaths giờ `-uall`: tên file thật, chính xác hơn).

Focused (122 file chạm module đổi, trừ rust-host) sau commit 1: 3660 test, 1 fail (stray-write ở trên, đã sửa kỳ vọng). Sau commit 2: 9 file trực tiếp 233/233.

## Impact

`fgos tool query --capability impact-analysis --status present` → gitnexus present; nhưng index **stale** (indexed `b334695`, của main checkout) và nhiều repo trùng tên `forgent` → gọi bằng path `/home/vantt/projects/forgentX`. Kết quả (upstream):

- `isWorkingTreeClean` LOW (approve, sync-root).
- `changedFiles` **HIGH** (approve, sync-root, promote-to-component).
- `safeGitStatusFiles` **CRITICAL** (executeAssignment, dispatchBound, runOnce, settleRunOutcome…).
- `checkoutDirtyPaths` **CRITICAL** (executeExecutorCli, spawnWorker…).
- `changedPaths`: "not found" (index stale) → cross-check rg: chỉ `commit-unit-work.mjs` gọi (145, 219).

Hành vi chỉ đổi với tên bị quote/có dấu cách đầu-cuối, rename (thêm nửa nguồn — chỉ làm gate chặt hơn), untracked dir (liệt kê từng file), và repo đặt `diff.relative`/`status.showUntrackedFiles=no`. Review xác nhận: Iron Law/approve/sync-root chỉ chặt hơn.

## Review độc lập

[review-rununit-gitparse-261014.md](review-rununit-gitparse-261014.md) (`code-reviewer`, `fgos dispatch decide --for code-review` → in-process).

| Finding | Xử lý |
|---|---|
| H1 `-uall` làm gate ENOBUFS với cây untracked lớn (mất cả merge đã verify ở `:1903`) | Sửa: `GIT_LIST_MAX_BUFFER` 64 MiB cho mọi đọc danh sách path. Test đỏ ENOBUFS → xanh |
| M1 snippet import `src/util/git-paths.mjs`, worktree claim trước khi merge thiếu file → crash | Sửa: snippet tự chứa (`diff -z HEAD` + `ls-files --others -z`), chạy thật qua bash |
| M2 thiếu test đường gate | Sửa một phần: e2e `return` (đột biến đỏ), pin normalize collision, rename qua `isWorkingTreeClean` thật, `t.after` cleanup. Chưa: `mergedTreeAlreadyVerified`, reader `--diff-filter=U` với tên quote (cần dựng conflict merge; helper `nulPaths` đã có test) |
| M3 `diff.relative` → gate fail-open | Sửa: `--no-relative` mọi diff reader. Test đỏ → xanh |
| L0 prefix `.trim()` | Sửa: chỉ bỏ `\n`. Test |
| L1 pathspec glob trong `branchContentMismatch` | Sửa: `--literal-pathspecs` |
| L2 nửa nguồn rename → "discarded" giả → verify-fail | Sửa: giữ rename detection riêng hàm này (ghi trong code) |
| L3 footprint advisory báo cả nửa nguồn rename | Giữ có chủ đích (advisory, file dời khỏi footprint nên hiện) |
| L4 `workflow/runner.mjs:271` tự split; distill `ls-files` theo dòng | Sửa runner.mjs; distill: skill ngoài fgOS core → item riêng |

## Red-team

[redteam-rununit-gitparse-261014.md](redteam-rununit-gitparse-261014.md) — 16 đòn trên fixture git thật, 7 trúng.

| # | Đòn | Kết quả | Xử lý |
|---|---|---|---|
| 1 | cây untracked lớn + `-uall` | HIT (mới) | Sửa (= H1) |
| 2 | `diff.relative=true` + cwd con | HIT, gate nói sạch (cũ) | Sửa (= M3) |
| 3 | tên non-UTF-8 (`\xff`/`\xfe` → U+FFFD) | HIT: gate chặn nhầm (fail-closed, mới); commit-unit-work không commit được (cũ, báo lỗi rõ) | **Không sửa**: đổi sang latin1/Buffer làm chuỗi UTF-8 tiếng Việt lệch với footprint/scope (UTF-8). Item riêng: path dạng Buffer xuyên suốt |
| 4 | stray write vào thư mục untracked đã bẩn | HIT (cũ) | Sửa: `checkoutDirtyPaths` `-uall`. Test |
| 5 | `status.showUntrackedFiles=no` | HIT (cũ) | Sửa: untracked mode tường minh ở reader + 4 guard rỗng. Test |
| 6 | thư mục con tên bắt đầu bằng dấu cách | HIT low | Sửa (= L0) |
| 7 | path own trong nested repo untracked | HIT low, contrived | Không sửa: git gộp repo lồng thành một entry; ghi nhận |
| 8–16 | rename/copy, `" -> "` trong tên, quotePath=false, `"`/`\`/tab/newline/edge space, `.fgos-x`, symlink `.fgos`, UU/AA/UD, submodule, config status/color/noprefix/external, name-status `R100\tweird`, edge space vs normalize | MISS | — |

Ghi chú ngoài phạm vi (item riêng): N1 approve whole-repo gate với ownFileSet coi main đang dở merge (conflict chỉ ở file khác) là sạch; N2 `merge.mjs git()` thừa kế `GIT_DIR`/`GIT_INDEX_FILE` (commit-unit-work đã `cleanEnv`); N3 submodule ignore/excludesFile/fsmonitor che thay đổi (ý người dùng); N4 `ls-tree` trong `nextFreeDecisionId` relative khi repoRoot là thư mục con.

## npm test

`env -u CLAUDE_CODE_SESSION_ID npm test`, HEAD `794928358` trên main `704c603ce`, log ở scratchpad (ngoài `.fgos`): **exit=0**, tests 7563, pass 7488, fail 0, cancelled 0, skipped 10, todo 65, ~406s.

Hai lượt trước bị dừng chủ động (rebase docs-a; rồi sửa theo review) — không phải fail.

## Spec delta (cho người giữ `docs/specs/runner.md`)

- Mọi đọc danh sách path từ git trong runtime (status, diff/show/ls-tree name-only, name-status) đi qua `src/util/git-paths.mjs`, bằng `-z`: path giữ nguyên byte (tên tiếng Việt, dấu cách, tab, `"`), rename/copy ra cả hai nửa; ngoại lệ có chủ đích `branchContentMismatch` (chỉ tên mới). Diff reader dùng `--no-relative`; status reader nêu untracked mode tường minh; trần output 64 MiB.
- Gate clean-tree (approve/sync-root/return): liệt kê untracked từng file; path status chuẩn hoá bằng `normalizePath` như own set (trùng sau chuẩn hoá → coi là own → chặn).
- `checkoutDirtyPaths` (stray-write / lost-work của out-of-process dispatch) liệt kê untracked từng file, không còn `dir/`.

## CHANGELOG delta (`## [Unreleased]`)

- Approve, sync-root và return nhận đúng file tên tiếng Việt / có dấu cách / tab: file own còn bẩn chặn gate, footprint không báo nhầm, rename tính cả tên cũ.
- Số decision mới không còn đụng decision có slug non-ASCII; post-land drift báo đúng path chung khi một bên đổi tên file.
- Gate clean-tree không còn crash `ENOBUFS` khi có cây untracked lớn; không bị `diff.relative=true` hay `status.showUntrackedFiles=no` qua mặt.
- Cảnh báo stray-write nêu từng file mới, kể cả trong thư mục untracked đã có sẵn.

## Còn để ngỏ

- Tên non-UTF-8 (red-team #3): cần path dạng Buffer/latin1 xuyên suốt — item riêng.
- `core/skills/distill/scripts/distill.mjs:383` parse `ls-files` theo dòng — item riêng.
- N1 (gate coi main dở merge là sạch khi có ownFileSet), N2 (env `GIT_*` rò vào `merge.mjs git()`), N4 — item riêng.
- Chưa có test conflict-reader với tên quote và `mergedTreeAlreadyVerified` với rename (helper đã có test; logic name-status giữ nguyên ngữ nghĩa cả hai nửa).
- `resolveFgosOnlyConflict` vẫn truyền path làm pathspec không literal (chỉ path `.fgos/`).
- Docs: `docs/how-to/produce-failing-test-first-proof-for-an-iron-law-gated-diff.md` không chứa snippet (đã rg), không cần sửa.

Status: DONE_WITH_CONCERNS
Summary: Mọi đọc danh sách path của git trong src/ + bin (status, name-only, name-status, ls-tree) gom về `src/util/git-paths.mjs` đọc `-z`, rename ra cả hai nửa (trừ `branchContentMismatch`, ghi rõ); đường approve/merge/return của Work hết so tên bị quote với footprint không quote. Thêm theo review/red-team: trần 64 MiB (ENOBUFS do `-uall`), `--no-relative`, untracked mode tường minh, prefix giữ dấu cách, literal pathspec, snippet prompt tự chứa. Test đỏ→xanh, e2e `return` qua bin thật, `npm test` exit 0 trên main mới nhất; review độc lập + red-team xong, mọi High đã sửa.
Concerns: (1) Tên non-UTF-8 vẫn mất byte (gate fail-closed; commit-unit-work báo lỗi) — cần item path dạng Buffer. (2) Ngoài phạm vi, nên tách item: N1 gate coi main dở merge là sạch khi có ownFileSet; N2 env `GIT_*` rò vào `merge.mjs git()`; distill `ls-files` theo dòng. (3) Đổi API: `isFgosOnlyStatusLine` → `isIgnorableStatusPath`; cảnh báo stray-write giờ nêu tên file thay `dir/`. (4) Chưa test conflict-reader với tên quote và `mergedTreeAlreadyVerified` với rename.
