---
type: explanation
title: 0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)
tags: []
timestamp: 2026-07-29T00:00:00.000Z
source_capture_ids: []
date: 2026-07-29
status: accepted
extends: []
relates_specs: [runner]
---

# 0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)

## Bối cảnh

`tsk-53f` xác nhận 1 case cụ thể: claim + worktree-isolation (`take`/`pick`
vs runner) từng có 3 đường claim độc lập, đã hợp nhất qua `claim-port.mjs`
(D1). `tsk-1ab` là khảo sát rộng hơn: những loại quyết định NÀO KHÁC trong
fgOS đang bị nhiều flow (CLI verb, runner loop, skill) tự implement riêng,
dẫn tới hành vi lệch nhau cho CÙNG một câu hỏi quyết định. Mỗi candidate
dưới đây được xác nhận bằng cách đọc trực tiếp từng call site — không suy
diễn từ tên/hình dạng giống nhau (yêu cầu (2) của item).

## Candidates

### Xác nhận THẬT (choke-point có bằng chứng cụ thể)

#### 1. `take` vs `pick` — 2 định nghĩa khác nhau cho "item này claim được không"

Cả hai đều delegate phần ghi state cho cùng `claimWork` (`claim-port.mjs`,
đã hợp nhất đúng theo tsk-53f D1) — NHƯNG mỗi verb tự gác một lớp kiểm tra
điều kiện claim RIÊNG, ngay trước khi gọi `claimWork`, và hai lớp gác đó
trả lời khác nhau cho cùng 1 input (id đang ở stage `clarify`/`decompose`,
status `todo`, chưa vào frontier):

- `take --id <id>` (`bin/fgos.mjs:1233-1237`): chặn cứng — nếu
  `status === 'todo'` và id không nằm trong `readyWork()` (frontier, tức
  chưa tới stage `executing`), ném lỗi `"is todo but not in the frontier
  yet (stage/deps/lineage)"`.
- `pick --id <id>` (`bin/fgos.mjs:1272-1285`): KHÔNG có kiểm tra
  frontier/stage — chỉ cần id tồn tại. Comment ngay tại chỗ
  (`bin/fgos.mjs:1263-1268`) xác nhận đây là chủ ý: "the frontier-membership
  guard removed below was a hard check at THIS verb layer, never an FSM
  law" — nới lỏng để clarify/decompose claim qua được cửa pick.

Hệ quả đã xác nhận thật, không suy đoán:
- `plugins/fgOS/skills/fgos-routing/SKILL.md` (bản trong worktree này) tự
  hướng dẫn dùng đúng `fgos take --role session [--id <id>]` để claim một
  item còn ở `clarify`/`decompose` — lệnh này BỊ REJECT bởi chính guard ở
  trên, vì `take` chưa từng được nới lỏng như `pick`.
- `plugins/fgOS/skills/cook/SKILL.md:36-39` đã tự phát hiện đúng lỗi này
  qua test thật ("Verified empirically against this repo... rejected"),
  ghi thành "Known gap (flagged, not guessed around)" — nhưng chỉ vá ở
  tầng cook's own flow, không sửa `fgos-routing`, và tự nhận "reconciling
  fgos-routing itself is a separate, out-of-scope fix".
- Phiên làm việc khảo sát item NÀY (tsk-1ab) tự confirm thêm 1 lần nữa:
  `pick tsk-1ab` thành công thật khi item còn stage `clarify` (log claim
  seq 502, `"from":"todo","to":"doing"`), đúng khớp phân tích code trên.

3 nguồn (code, cook's known-gap note, phiên này) đồng nhất — đây là
choke-point rõ nhất tìm được: 1 câu hỏi quyết định ("id này claim được
chưa"), 2 verb code trả lời khác nhau, và tài liệu skill chính thức
(`fgos-routing`) đang hướng dẫn sai theo nhánh `take` bị chặn.

#### 2. Kiểm tra working-tree sạch — 2 định nghĩa độc lập cho `return` và `approve`

Xác nhận lại tsk-63j D1 với citation mới (file đã đổi dòng từ lúc D1 ghi):

- `bin/fgos.mjs:98` định nghĩa `isWorkingTreeClean(cwd)` riêng cho `return`
  (gọi tại `bin/fgos.mjs:1428`) — chạy `git status --porcelain -- .`, chỉ
  soi subtree của `cwd`.
- `src/runner/merge.mjs:133` định nghĩa `isWorkingTreeClean(repoRoot)`
  riêng cho `approve` (import alias `isMainTreeClean` tại
  `bin/fgos.mjs:33`, gọi tại `bin/fgos.mjs:1714`) — chạy
  `git status --porcelain` không pathspec, soi TOÀN repo.

Cả hai dùng chung 1 helper loại trừ (`isFgosOnlyStatusLine`) nhưng hàm gác
chính thì viết riêng 2 lần, với khác biệt phạm vi thật (subtree vs
whole-repo) — không phải trùng tên ngẫu nhiên, là 2 implementation thật.

**Đã sửa** (item `choke-point-workingtree-clean-duplication`, commit
`3dad0c2`): hợp nhất về 1 hàm `isWorkingTreeClean(repoRoot, ownFileSet,
{ scope })` trong `src/runner/merge.mjs`, `scope` nhận `'subtree'` (return)
hoặc `'whole-repo'` (approve, mặc định) — cùng 1 lần tính `prefix`, cùng 1
lần loại trừ `.fgos/`. `bin/fgos.mjs`'s own `isWorkingTreeClean(cwd,
ownFileSet)` giờ chỉ delegate sang hàm trên với `scope: 'subtree'`.

#### 3. `createWorktree` — 6 call site, mỗi nơi tự xử lý baseRef/cleanup riêng

Re-verify tsk-53f's finding từ đầu theo D2 (không tái dùng report cũ) —
xác nhận vẫn đúng 6 call site, line number đã trôi so với report cũ
(`plans/reports/choke-point-investigation-260728-1717-claim-worktree-report.md`,
tự nó là bằng chứng cho luận điểm của item này: tài liệu tĩnh trôi khỏi
code rất nhanh trong repo này):

| Ngữ cảnh | File:Line hôm nay | baseRef | Cleanup khi lỗi |
|---|---|---|---|
| `pick` | `bin/fgos.mjs` qua `claim-port.mjs:170` | HEAD hiện tại hoặc root branch (đã sửa theo baseRef truyền vào) | không có `finally`/cleanup tại call site này |
| `approve` (leaf merge, ephemeral) | `bin/fgos.mjs:1735` | root branch | có |
| `review` (ephemeral) | `bin/fgos.mjs:1994` | item branch | có |
| Runner `startupReap` | `src/runner/loop.mjs:398` | mặc định (không truyền `baseRef`) | có (`finally`) |
| Runner dispatch — LEAF | `src/runner/loop.mjs:679` | `branchNameFor(rootId)` | có |
| Runner dispatch — ROOT | `src/runner/loop.mjs:681` | mặc định | có |

`createWorktree` bản thân đã là 1 hàm dùng chung (`src/runner/worktree.mjs`)
— phần LẶP không nằm ở việc tạo worktree, mà ở việc MỖI call site tự quyết
`baseRef` nào truyền vào và tự viết cleanup riêng thay vì có 1 wrapper
chung theo "loại thao tác" (claim-isolate / merge-ephemeral / runner-dispatch).

### Đã kiểm tra, KHÔNG phải choke-point (loại khỏi danh sách, có bằng chứng)

Yêu cầu (2) của item đòi xác nhận thật, không chỉ giống bề ngoài — 3
candidate sau nằm trong 4 gợi ý gốc của description nhưng khi đọc code thì
ĐÃ hợp nhất đúng, không lặp:

- **Verify run + timeout**: 1 hàm dùng chung duy nhất,
  `runGoalCheck` (`src/runner/goal-check.mjs:20`) — gọi từ cả 8 nơi cần
  chạy verify (`bin/fgos.mjs:1391,1440,1886,2036`, `src/runner/loop.mjs:399,727`,
  `src/runner/merge.mjs:335`). Không có implementation thứ 2.
- **`docType` validation**: 1 hàm dùng chung duy nhất,
  `assertValidDocType` (`src/state/store.mjs:619`), gọi từ `bin/fgos.mjs:842`
  và nội bộ `store.mjs` (`addOutcome`, 2 chỗ). Comment tại
  `bin/fgos.mjs:808` tự xác nhận: "the single `DIATAXIS_DOC_TYPES` set".
- **`docsRef` validation**: 1 helper dùng chung, `optionalField`
  (`bin/fgos.mjs:172`), gọi 3 lần (`add`/`submit`/`edit`) với message lỗi
  khác nhau theo verb — khác message, không khác LOGIC kiểm tra, nên
  không tính là lặp thật.
- **Ghi `.fgos/events.jsonl`/`state.json` ở tầng thấp**: đã có 1 cửa ghi
  duy nhất có khóa, `withEventsLock`/`appendEventLocked`
  (`src/state/events.mjs`, dùng bởi mọi hàm ghi trong `store.mjs`) — tầng
  append-event tự nó KHÔNG hở, đúng như comment `store.mjs:24` tự nhận
  ("single-write-door scope stays exactly events.jsonl + state.json").

### Ghi chú liên quan — không phải finding mới của item này

`main-checkout-lock.mjs` (2 export `acquireMainCheckoutLock`/
`releaseMainCheckoutLock`) từng bị tsk-53f's report gọi là "dead code,
imported by NOTHING" — claim đó nay ĐÃ SAI: `src/runner/claim-port.mjs:12,73`
import và gọi thật (wired post tsk-53f D1). Đào sâu hơn lộ ra đây là 1
cơ chế RIÊNG với mục đích khác — khóa claim-identity tại thời điểm claim,
không phải khóa git-commit — và cơ chế bảo vệ git-commit race (vụ `tsk-3w8`,
`approve`'s `git commit --no-edit` xung đột) đã được quyết định RIÊNG,
KHÔNG qua app-level lock mà qua `.githooks/pre-commit` (mọi actor, mọi
commit) — xem `docs/decisions/0021-wire-main-checkout-hook-qua-doctor-setup.md`,
đã accepted, có nêu rõ khoảng hở còn mở (hook không active mặc định) và
đã tự đóng thành 1 câu hỏi để dành cho item riêng nếu có bằng chứng thật.
Không liệt lại thành candidate riêng của tsk-1ab vì đã có quyết định +
theo dõi sẵn — trích dẫn ở đây để không đọc nhầm 2 cơ chế cùng tên
"main-checkout-lock" là một.

## Ranked priority

1 bảng phẳng duy nhất (D4) — sort theo rủi ro lệch hành vi trước, tần suất
gọi làm tie-break. Chỉ xếp hạng 3 candidate đã XÁC NHẬN THẬT ở trên (mục
"Đã kiểm tra, KHÔNG phải choke-point" không vào bảng này vì không phải
việc cần hợp nhất).

| Hạng | Choke-point | Rủi ro lệch hành vi | Tần suất | Vì sao |
|---|---|---|---|---|
| 1 | `take` vs `pick` claim-eligibility (#1) | **Cao** — không chỉ khác hành vi ngầm, mà khiến lệnh do chính `fgos-routing` hướng dẫn literal bị CLI reject cứng, giữa chừng 1 session | Rất cao — `fgos-routing` được nạp "at the start of every fgOS work session" (chính mô tả skill), nên bất kỳ session nào theo đúng ví dụ prose sẽ dính | Sửa 1 lần (đồng bộ guard giữa `take`/`pick`, hoặc sửa lại prose `fgos-routing` theo hành vi thật của `pick`) chặn đứng lỗi lặp lại ở mọi session tương lai |
| 2 | `isWorkingTreeClean` trùng lặp (`return` vs `approve`, #2) | Trung bình — 2 phạm vi khác nhau thật (subtree vs whole-repo) có thể khiến `return` coi là sạch trong khi `approve` sau đó lại thấy bẩn (hoặc ngược lại), lệch kỳ vọng giữa 2 verb lõi | Cao — mọi lần `return` và mọi lần `approve` đều chạy qua 1 trong 2 hàm này | Hợp nhất về 1 hàm nhận tham số phạm vi (subtree/whole-repo) thay vì 2 định nghĩa riêng, để đảm bảo cùng logic loại trừ + cùng cách tính prefix |
| 3 | `createWorktree` 6 call site tự quyết baseRef/cleanup (#3) | Trung bình-thấp — mỗi nơi đã tự đúng theo ngữ cảnh riêng (baseRef hợp lý theo leaf/root, hầu hết đã có cleanup), rủi ro chủ yếu là worktree mồ côi khi cleanup thiếu (site `pick`), không phải state sai | Cao — 6 call site trải khắp `pick`/`approve`/`review`/runner dispatch, chạy thường xuyên | Thêm 1 wrapper theo "loại thao tác" (claim-isolate / merge-ephemeral / runner-dispatch) bọc `createWorktree` + cleanup thống nhất, thay vì sửa lẻ từng site |

## No fixes applied

Đúng yêu cầu (4) của item: khảo sát này KHÔNG tự sửa bất kỳ choke-point
nào ở trên. Mỗi dòng trong bảng xếp hạng, nếu được chọn để sửa, trở thành
1 item riêng sau này (như cách finding của `tsk-53f` đã tách thành item
độc lập) — không nằm trong phạm vi thi công của `tsk-1ab`/`tsk-1ab-1`/
`tsk-1ab-2`.
