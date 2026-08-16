# CONTEXT: tsk-580 — `--verify-from-children`/`--verify-from-targets` trên `fgos edit`

## Feature boundary

Thêm đúng 2 flag boolean mới vào `fgos edit <id>`: `--verify-from-children`
(item cha kiểu decomposed-root, `parent`-tree) và `--verify-from-targets`
(item cha kiểu goalTier milestone/MVP, `targets`-tree). Mỗi flag tự sinh và
ghi thẳng field `verify` của item thành một câu lệnh `jq`-check trạng thái
con/target — thay cho việc người dùng tự tay viết câu jq đó (nguồn ma sát
thật, tài liệu trong 2 how-to doc hiện có). Không đổi bất kỳ gate/FSM/cycle
claim-verify-return-approve nào của item cha — phạm vi giới hạn nghiêm ngặt
ở việc sinh giá trị cho 1 field.

## Locked decisions

Toàn bộ thiết kế đã chốt qua phiên `fgos-coding-shaping` trước khi item này
được submit — xem
`docs/history/rollup-parent-auto-close/DISCUSSION.md#task-verify-from-flags`
để đọc lại quá trình + evidence đầy đủ. Chốt lại đây để CONTEXT.md tự đứng
được (không bắt buộc người đọc phải mở file kia):

| D-ID | Quyết định |
|------|-----------|
| D1 | Không tự động chuyển status cha khi con/target resolved. Cha vẫn tự đi qua nguyên vẹn cycle claim→verify→return→compound→approve. Chỉ giảm ma sát bước viết tay `verify`. |
| D2 | 2 flag boolean riêng trên `fgos edit`: `--verify-from-children` (quét toàn bộ item có `parent === id`, không đệ quy — cùng giới hạn 1-tầng hiện có của `fgos rollup`) và `--verify-from-targets` (đọc thẳng `item.targets` array) — 2 cơ chế enumerate khác nhau thật, không gộp 1 flag. |
| D3 | Check mặc định trong command sinh ra là resolved-set (`delivered`/`retrospective`/`cleanup`/`done`), không phải strict `== "done"` — theo tiền lệ tsk-2jc (đã qua `gates.answer` thật), vì `cleanup` chỉ là TTL sweep cơ học (7 ngày), không phải nội dung chưa xong. |

Cả 3 đã ghi qua `fgos decision --id tsk-580` thật (không chỉ nằm trong
prose), có thể đọc lại qua `fgos list --id tsk-580 --json` → `data.decisions`.

## Guard bắt buộc (đã chốt trong thiết kế, không phải fork mở)

Nếu danh sách con/target rỗng (quét `parent` ra 0 item, hoặc `targets`
rỗng/không tồn tại) → cả 2 flag phải throw lỗi rõ ràng ngay tại `edit`,
KHÔNG sinh command — tránh vacuous truth của jq `all()` trên mảng rỗng
(luôn trả `true`, tức verify sẽ luôn pass sai nếu không guard).

## Pinned terms

- **resolved-set**: tập hợp 4 status `{delivered, retrospective, cleanup,
  done}` — cùng định nghĩa với `TAIL_RESOLVED_STATUSES`
  (`src/state/frontier.mjs`), đã có sẵn hàm `isResolvedStatus` cùng file,
  đã import sẵn vào `bin/fgos.mjs` (dòng import `isResolvedStatus` từ
  `frontier.mjs`) — nên tái dùng thay vì tự khai báo mảng mới.
- **children (decomposed-root)**: item có `parent === <id đang edit>`,
  quét trực tiếp qua `Object.values(view.work)`, không đệ quy — cùng cách
  `collectRollupData` (bin/fgos.mjs) đã làm cho `fgos rollup`.
- **targets (goalTier)**: mảng `item.targets` đọc thẳng, không cần quét.

## Scout evidence (đường dẫn thật, không phải giả định)

- `bin/fgos.mjs` — case `'edit'`: pattern flag hiện có (field cùng tên qua
  loop chung, field kebab→camelCase qua block riêng như `--docs-ref`/
  `--goal-tier`/`--merge-after`) — flag mới nên theo đúng pattern block
  riêng này.
- `bin/fgos.mjs` — `collectRollupData`: cách enumerate children qua
  `w.parent === id`, comment tại đó xác nhận decompose chỉ 1 tầng (YAGNI,
  không đệ quy) — giữ nguyên giới hạn này cho flag mới, không mở rộng.
- **[Sửa lại — phát hiện lúc `fgos discover` dispute]** `src/runner/paths.mjs`
  — `resolveRepoRoot(cwd, {strict})` KHÔNG dùng được cho việc này:
  dùng `git rev-parse --show-toplevel` (paths.mjs:30), trả về root của
  chính WORKTREE hiện tại khi gọi từ trong worktree — SAI mục đích, vì
  worktree không bao giờ mang `.fgos/` riêng (ADR0020). Phải dùng đúng
  pattern `git rev-parse --path-format=absolute --git-common-dir` rồi lấy
  `path.dirname(...)` — đúng pattern mọi skill markdown đã dùng
  (`git rev-parse --path-format=absolute --git-common-dir | xargs
  dirname`), và đã có tiền lệ thật trong code (không export sẵn, nhưng có
  ví dụ inline): `src/cli/invocation-fault-log.mjs:47-59`
  (`mainCheckoutFgosDir`, dùng đúng 2 bước này rồi join thêm `.fgos`),
  `src/runner/merge.mjs:230`, `src/setup/registrations.mjs:189` — cả 3 chỗ
  đều tự inline execFileSync riêng, không có helper export sẵn cho "repo
  root" trần (chỉ có cho `.fgos` dir cụ thể) — theo đúng convention hiện
  tại (3 chỗ đã trùng lặp pattern này mà chưa gộp), flag mới nên inline
  tương tự, không cần export helper mới (giữ scope, YAGNI).
- `src/state/frontier.mjs` — `isResolvedStatus`/`TAIL_RESOLVED_STATUSES`:
  đã import sẵn vào `bin/fgos.mjs`, tái dùng được luôn cho check D3 thay vì
  khai báo mảng riêng.
- `docs/how-to/close-out-a-goaltier-milestone-after-all-targets-are-done.md`,
  `docs/how-to/close-out-a-decomposed-root-item-after-all-children-are-done.md`
  — 2 ví dụ command thật (tsk-u9k strict-done, tsk-2jc resolved-set) làm
  precedent cho D3; cả 2 doc nên được cập nhật để trỏ sang 2 flag mới thay
  vì hướng dẫn viết tay, một khi flag đã tồn tại (theo dõi ở `fgos-coding-planning`).

## Impact-analysis posture

`fgos tool query --capability impact-analysis --status present` → GitNexus
`present` (1 provider). Hook riêng của session này báo index có thể cũ
("last indexed: 251d0b5") — theo gate của `CLAUDE.md`, `present` không đồng
nghĩa index tươi; đã cross-check bằng grep/Read trực tiếp `bin/fgos.mjs`
(không dựa hẳn vào GitNexus) cho phần scout ở trên — đủ vì đây là 1 hàm
CLI verb tự chứa trong 1 file, rủi ro lan toả thấp.

## Câu hỏi còn mở

Không có — thiết kế đã chốt đầy đủ qua `fgos-coding-shaping` trước khi
submit; không phát sinh gray-area mới ở bước `fgos-coding-exploring` này. Chi
tiết implementation (tên biến, chỗ thêm `const view = listWork(dir)` trong
case `edit`, vị trí test) là việc của `fgos-coding-planning`, không chốt ở đây.
