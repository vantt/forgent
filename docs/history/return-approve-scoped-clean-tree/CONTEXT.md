---
type: context
item: tsk-598
timestamp: 2026-07-28T16:04:00.000Z
status: locked
---

# tsk-598 — return/approve's clean-tree check chỉ đối chiếu file của chính item

## Feature boundary

`return` (main-source, headAtTake path) và `approve` (runner-source, merge
path) mỗi cái có 1 clean-tree gate riêng, cả 2 hiện quét TOÀN BỘ working
tree (`git status --porcelain`, trừ `.fgos/`) — bất kỳ file dirty/untracked
nào, dù không liên quan gì tới item đang xử lý, cũng chặn. Tái hiện thật 2
lần cùng buổi 2026-07-28: tsk-veg's `approve` bị chặn bởi
`docs/history/hello-world-vanilla-js/` + `plans/` của phiên khác; tsk-352's
`return` bị chặn bởi `plans/reports/distill-consult-*.md` của phiên khác.

Scope của item này: thu hẹp CẢ 2 gate để chỉ đối chiếu file thuộc về CHÍNH
item đang return/approve, không quét toàn cây. Không đổi hành vi khi có
xung đột thật (cùng path vừa thuộc diff của item vừa đang dirty).

Ngoài phạm vi: không đổi cơ chế `.fgos/` exclusion (giữ nguyên), không đổi
hành vi branch-source `return` (đã KHÔNG có cwd-clean check — verify chạy
trong disposable detached worktree, xem `bin/fgos.mjs:1332-1341`), không
xây writer-per-path attribution mới.

## Locked decisions

| ID | Decision |
|---|---|
| D1 | Sửa CẢ 2 chốt: `return`'s `isWorkingTreeClean(cwd)` main-source path (`bin/fgos.mjs:1382`, dùng `changedFilesSince(cwd, item.headAtTake, head)` — cơ chế đã có sẵn, dùng lại từ `frozenJudgeHits` call ngay bên dưới nó ở dòng 1397) VÀ `approve`'s `isMainTreeClean(repoRoot)` runner-source path (`bin/fgos.mjs:1668`, dùng `changedFiles(repoRoot, item)` — cơ chế đã có sẵn, dùng lại từ Iron Law check ở dòng 1601). |
| D2 | `own-file-set` cho 1 item = union(committed diff của item, `item.footprint` nếu có khai báo). 1 dòng `git status --porcelain` chỉ CHẶN return/approve khi path của nó nằm trong `own-file-set` — path ngoài `own-file-set` (dù là của phiên khác hay chính mình quên `git add`) luôn được bỏ qua, không chặn gì. Cùng path vừa nằm trong committed diff vừa đang dirty lại = xung đột thật, vẫn chặn như cũ. |
| D3 | Khi item KHÔNG khai `footprint` (mặc định — field optional, `src/state/work.mjs:242-258`; đa số item hôm nay không có, kể cả chính tsk-598) — `own-file-set` fallback về CHỈ committed diff (không còn whole-tree-clean). Item có khai `footprint` được bảo vệ thêm theo D2: 1 path nằm trong `footprint` nhưng chưa commit vẫn chặn (đọc như "có thể là việc của item, chưa xong"), tránh lọt qua trường hợp quên `git add`. |

## Pinned terms

- **own-file-set**: tập path mà return/approve coi là "thuộc về item này",
  dùng làm bộ lọc duy nhất cho clean-tree gate — xem D2/D3.
- **committed diff**: với `return` (main-source) là
  `git diff --name-only headAtTake..HEAD`; với `approve` (runner-source) là
  `git diff --name-only <trunk>...fgw/<id>` (đã có sẵn qua `changedFiles`,
  `src/runner/merge.mjs:265-279`).
- **footprint**: field optional có sẵn trên item (`work.footprint`,
  exact-path match, không glob/prefix — `src/runner/frozen-judge.mjs:45-51`).

## Scout evidence

- `src/runner/merge.mjs:109-139` — `isFgosOnlyStatusLine` + `isWorkingTreeClean`:
  whole-repo `git status --porcelain` scan hiện tại, chỉ trừ `.fgos/`.
- `bin/fgos.mjs:1308-1392` — `return` verb: branch-source path (dòng
  1316-1374, KHÔNG có cwd-clean check) vs main-source path (dòng 1377-1392,
  CÓ `isWorkingTreeClean(cwd)` whole-tree gate — đây là chỗ sửa).
- `bin/fgos.mjs:1397` — `changedFilesSince(cwd, item.headAtTake, head)` đã
  tính sẵn cho `frozenJudgeHits`, tái dùng làm `own-file-set` nguồn main.
- `bin/fgos.mjs:1600-1670` — `approve` verb: Iron Law check dùng
  `changedFiles(repoRoot, item)` (dòng 1601), tái dùng làm `own-file-set`
  nguồn runner; `isMainTreeClean(repoRoot)` whole-tree gate ở dòng 1668 —
  chỗ sửa thứ 2.
- `src/state/work.mjs:242-258`, `src/runner/frozen-judge.mjs:45-58` —
  `footprint` field, optional, exact-path Set membership.
- `test/runner/merge.test.mjs` — test hiện có cho
  `isWorkingTreeClean`/`isFgosOnlyStatusLine`, chỗ thêm test case mới.

## Outstanding — deferred to planning

- Vị trí đặt hàm filter mới (`own-file-set` intersection logic) — module
  mới trong `src/runner/` hay hàm thêm vào `merge.mjs` — implementation
  choice, không phải product decision.
- Có cần đổi chữ ký `isWorkingTreeClean`/`isMainTreeClean` (thêm tham số)
  hay viết hàm mới song song rồi thay call site — implementation choice.
- Test case cụ thể (unit vs integration, fixture nào) — planning tự quyết.
