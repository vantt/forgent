# RESEARCH — state/runner merge boundary (tsk-49i)

Tích luỹ theo vòng, không đè. Mỗi vòng: hỏi gì, kiểm ở đâu, tìm ra gì, còn mở gì.

---

## Vòng 1 — 2026-08-15, stage `discovery` (gọi từ `fgos-coding-discovering`)

**Đã hỏi (3 điểm mơ hồ còn lại sau 6 round shaping trong DISCUSSION.md):**

- **A1** — Danh sách import-site trong `DISCUSSION.md` §6 chỉ quét `src/` + `bin/`.
  `test/` và các thư mục khác có import trực tiếp các symbol sắp dời không?
- **A2** — Schema thật của một row trong `docs/architecture-manifest.json`, và
  `test/architecture.test.mjs` enforce chính xác những gì?
- **A3** — `verify` thật cho một item refactor thuần có hình dạng nào trong repo này?

**Đã kiểm:** dispatch 3 nhánh song song (`gather` capacity chưa đăng ký —
`dispatch.mjs decide --for gather` trả `{"mechanism":"unavailable"}` → fallback
native Task, đúng default path). Ngoài ra tự đọc trực tiếp
`docs/architecture-manifest.json` và `bin/fgos.mjs:540-599`.

### A1 — Import-site ngoài `src/`/`bin/` (findings)

Quét `test/ scripts/ plugins/ .agents/ agents/ dogfood-fixture/ herdr-plugin/
.githooks/ .github/ .claude/ .claude-plugin/`, cả static import lẫn
`await import()`, cả word-boundary grep:

| Symbol / move | File ngoài `src/`+`bin/` phải sửa |
|---|---|
| `resolveRoot` → `state/frontier.mjs` | `test/runner/root-affinity.test.mjs:3-8` (import) + call `:23,:32,:33,:34,:39,:47` |
| `isMainWorktree` → `worktree.mjs` | **không có** (chỉ 2 comment: `test/runner/merge.test.mjs:325`, `test/cli/fgos-approve.test.mjs:1127`) |
| `detectTrunk` → `worktree.mjs` | `test/runner/merge.test.mjs:9` (import) + call `:1420`, `:1463` |
| `session-identity.mjs` → `src/util/` | **6 file**: `test/runner/session-identity.test.mjs:11-17`; `test/state/store.test.mjs:22`; `.githooks/pre-commit:29` (+ dùng `:67`); `test/e2e/main-checkout-lock-hook.test.mjs:26,43,48,81,121` (`copyFileSync` vào `src/runner/` giả); `test/e2e/main-checkout-lock-hook-worktree-commit.test.mjs:34,68`; `plugins/fgOS/skills/terminal/rename.sh:64,66,69` (dynamic `import()`, path hardcode) |
| 3 collector → `src/report/item-trace.mjs` | **không có** — không test nào import `bin/fgos.mjs` như module (mọi tham chiếu đều spawn subprocess). `collectReviewTrace`'s field `trace` **không test nào assert** (grep `\.trace\b\|trace:` trên `test/` → 0) |
| `performCatchUp` → `runner/merge.mjs` | **không có** — identifier không xuất hiện ở bất kỳ test nào. Quan sát gián tiếp qua subprocess: assert trên commit message `catch-up: merge …` (`test/cli/fgos-approve.test.mjs:333,354,369,425-429`; `test/cli/fgos-post-merge.test.mjs:482,493,515,520`) — hợp đồng hành vi, không đổi khi move thuần |
| `ensureBranchPushed` → `worktree.mjs` | **không có** — identifier chỉ ở `bin/fgos.mjs` (def `:264`, call duy nhất `:3169`) |
| `driftStatus`/`unmergedDeliveries` nhận `{trunk}` bắt buộc | `test/state/drift-status.test.mjs:7` (import) + **24 call site 2-tham-số**: `driftStatus` `:48,:54,:63,:80,:93,:105,:125,:147,:173,:211,:403,:415`; `unmergedDeliveries` `:242,:250,:256,:265,:273,:291,:310,:328,:344,:359,:374,:388` |

Nguồn signature hiện tại: `src/state/drift-status.mjs:118`
`export function driftStatus(repoRoot, view)` và `:210`
`export function unmergedDeliveries(repoRoot, view)`, cả hai tự gọi
`detectTrunk(repoRoot)` bên trong (`:120`, `:212`).

**Rủi ro im lặng (A1 tự nêu):** `plugins/fgOS/skills/terminal/rename.sh` guard
bằng `[ -f "$project_root/src/runner/session-identity.mjs" ]` và kết thúc
`|| true` — nếu dời module mà quên file này, tính năng rename pane **hỏng im
lặng**, không test nào đỏ.

### A2 — Manifest + architecture test (findings)

- Shape: một object top-level `{contract, map, layers[], files{}}`;
  `files` là object **keyed bằng path repo-relative**, value là **chuỗi layer
  trần** — không có object con, không field phụ
  (`docs/architecture-manifest.json:12,:23,:61,:70`).
- `layers` = `["entry","use-case","infra","domain","kernel"]`
  (`:4-10`); **index chính là rank** (`test/architecture.test.mjs:20`),
  `entry`=0 … `kernel`=4.
- `test/architecture.test.mjs` enforce đúng 3 điều:
  1. `:35-37` 1-1 giữa file `.mjs` trên đĩa (`src/`+`bin/`, quét đệ quy `:22-30`)
     và row trong manifest — `assert.deepEqual(onDisk, inManifest)` trên mảng đã
     sort → **thiếu row VÀ row mồ côi đều đỏ**. `test/` nằm ngoài phạm vi quét.
  2. `:39-43` mọi row phải dùng layer đã khai.
  3. `:45-76` import một-chiều-xuống: `rank(file) > rank(target)` là vi phạm
     (`:68`) → **same-rank hợp lệ**; import ra ngoài `src/`+`bin/` bị bỏ qua (`:67`).
- **Không có version gate**: `contract` không được test đọc, không có
  `MANIFEST_SCHEMA_VERSION` ở đâu. Thêm row không cần bump gì.
- **Phát hiện detection là REGEX, không phải AST** (`:48-54`), hệ quả đã kiểm:
  chỉ bắt statement bắt đầu **đúng cột 0** bằng `import … from '<relative>'`;
  **`export {x} from './y'` (re-export) lọt**, **`await import()` lọt**,
  import thụt lề lọt, side-effect `import './x.mjs'` lọt. Có instance thật đang
  lọt: `src/setup/registrations.mjs:56`.
- Rank thật của các file item này đụng (đọc trực tiếp manifest):
  `bin/fgos.mjs`=entry(0); `state/store.mjs`=infra(2); `state/frontier.mjs`,
  `state/graph-harness.mjs`, `state/cleanup-harness.mjs`,
  `runner/root-affinity.mjs`, `evolve/iron-law.mjs`, `report/entropy.mjs`=domain(3);
  `state/drift-status.mjs`, `runner/{session-identity,merge,worktree,
  promote-engine,claim-port}.mjs`, `cli/invocation-fault-log.mjs`=infra(2);
  `runner/loop.mjs`, `setup/registrations.mjs`=use-case(1);
  **`src/util/` hiện chỉ có 2 file, cả hai = kernel(4)**.
- `src/verbs/` chưa tồn tại; scan đệ quy tự nhặt file mới, không cần cấu hình.
- **Chỉ `test/architecture.test.mjs` đọc manifest** — nhưng nó là
  `DEFAULT_INVARIANT_CHECK_COMMANDS` của repo
  (`src/config/shared-config-file.mjs:60`), tức tự chạy ở `return`/`merge`, không
  chỉ trong `npm test`.

Kiểm chéo layer cho các move dự kiến (tự tính từ rank ở trên, quy tắc
`rank(file) > rank(target)` = vi phạm):

- `resolveRoot` domain(3) → `frontier.mjs` domain(3): mọi importer
  (`root-affinity` 3, `claim-port` 2, `loop` 1, `graph-harness` 3,
  `cleanup-harness` 3, `bin` 0) đều ≤ 3 → **hợp lệ**.
- `session-identity.mjs` sang `util/`: 4 importer đều rank ≤ 2 → gán `kernel`(4)
  hay giữ `infra`(2) **đều hợp lệ**; `kernel` khớp 2 sibling sẵn có.
- `iron-law-gate.mjs` mới import `merge`(2)+`worktree`(2)+`iron-law`(3) →
  **buộc phải rank ≤ 2**; `infra`(2) là giá trị tự nhiên duy nhất.
- `verbs/merge/*` use-case(1) import infra(2)/domain(3)/lẫn nhau(1) → **hợp lệ**.
- `item-trace.mjs` domain(3): đọc trực tiếp `bin/fgos.mjs:549-598` xác nhận cả 3
  collector nhận `view` qua tham số và **không import gì nội bộ** → không thể vi
  phạm layer.

### A3 — Verify (findings)

- `package.json:19-26`: chỉ có `test` = `node --test 'test/**/*.test.mjs'`.
  **Không lint, không typecheck, không build, không `devDependencies`**.
- **Không có madge/dependency-cruiser** hay bất kỳ cycle-checker module nào;
  `test/architecture.test.mjs` là file duy nhất parse import statement.
  (`src/state/dep-graph.mjs`'s "cycle-check" là cycle của **work-item deps**,
  không phải import.)
- Convention verify (`docs/how-to/write-verify-for-a-skill-prose-change.md`):
  bắt buộc `npm test && <POSITIVE> && <NEGATIVE>` — positive chứng minh cái mới
  tồn tại, negative chứng minh cái cũ đã mất; verify chỉ có negative sẽ **pass
  khi xoá sạch deliverable**.
- Tiền lệ gần nhất cho move/rename: `tsk-403` —
  `npm test && grep -q … && test -f src/intake/plan.mjs && test -d
  plugins/fgOS/skills/plan && ! test -d plugins/fgOS/skills/decompose`.
- Placeholder hiện tại của item khớp hằng
  `RETIRED_P14_PLACEHOLDER = 'chưa xác định — P15 bổ sung'`
  (`src/intake/discovery.mjs:84`) → không phải verify thật.
- Bẫy đã áp dụng (`docs/how-to/avoid-vacuous-pass-with-node-test-test-name-pattern.md`):
  phải chạy verify trên trạng thái CHƯA sửa và xác nhận exit non-zero.
  **Đã chạy thật**: cả 6 clause đều fail, chuỗi ghép trả `exit=1`.
- Chi phí: `npm test` = 142 file test, ~50s (đo trong
  `docs/history/tsk-25b-test-wallclock-split/CONTEXT.md` D4: 47–53s qua 3 lần);
  `node --test test/architecture.test.mjs` = 0.14s. Verify chạy dưới timeout
  mặc định 900000ms (`bin/fgos.mjs:333` + `src/runner/dispatch.mjs:247` —
  toạ độ đã lệch, xem Vòng 2 §F3 và Vòng 3 §G3).

### Verdict vòng 1

`{clear: true, verify: "npm test && test -f src/util/session-identity.mjs && test -f src/runner/iron-law-gate.mjs && test -d src/verbs/merge && test -f src/report/item-trace.mjs && ! grep -rqF \"from '../runner/\" src/state/ && ! grep -qF classifyIronLaw bin/fgos.mjs"}`

Verify này **cố ý shim-agnostic**: nó không chứa clause
`! test -f src/runner/session-identity.mjs`, nên không tự quyết thay
`fgos-coding-planning` việc có giữ re-export shim ở đường dẫn cũ hay không
(xem "Còn mở" dưới). Claim thật của item — cycle `state → runner` bị cắt — vẫn
được clause `! grep -rqF "from '../runner/" src/state/` chứng minh dù có shim
hay không.

### Còn mở (chuyển cho `fgos-coding-planning`, không phải câu hỏi cho người)

1. **Shim hay không shim cho `session-identity.mjs`.** Giữ re-export ở
   `src/runner/session-identity.mjs` sẽ để `.githooks/pre-commit`, 2 e2e test
   copy-file, và `plugins/fgOS/skills/terminal/rename.sh` chạy nguyên — nhưng
   A2 chứng minh re-export **vô hình** với architecture test, và shim vẫn cần
   row manifest riêng. Không shim thì phải sửa đủ 6 file, trong đó `rename.sh`
   hỏng im lặng nếu quên.
2. **Layer cho `src/util/session-identity.mjs`**: `kernel`(4, khớp 2 sibling) hay
   `infra`(2, giữ nguyên giá trị cũ) — cả hai hợp lệ với 4 importer hiện tại.
3. **Tách `tsk-49i` thành 2 item con hay 1 item 2 phase** — §7 của DISCUSSION.md
   có 2 task với thứ tự bắt buộc; đây là shaping judgment của planning.

---

## Vòng 2 — 2026-08-15, re-verify sau khi merge `main` vào `fgw/tsk-49i`

**Vì sao:** nhánh đứng sau `main` 171 commit lúc bắt đầu phiên, trong đó **14
commit chạm `src/state`/`src/runner`** — đúng vùng vòng 1 lấy bằng chứng
`file:line`. Merge (không rebase, theo D2 `src/runner/worktree.mjs`) ra commit
`ba25a590`, sạch, không conflict. Vòng này kiểm lại từng anchor của vòng 1 trên
cây đã merge.

**Diện thay đổi `main` mang vào (`git diff be5663af ba25a590 -- src/ bin/`):**
12 file, +631/−84, **không thêm file `.mjs` mới nào** — `bin/fgos.mjs` (+131),
`runner/worktree.mjs` (+149), `runner/merge.mjs` (+96), `state/store.mjs` (+68),
`setup/registrations.mjs` (+129), `runner/claim-port.mjs`, `claim-liveness.mjs`,
`loop.mjs`, `state/cleanup-harness.mjs`, `frontier.mjs`, `graph-metrics.mjs`,
`status-fsm.mjs`.

### F1 — Cạnh `state/ → runner/` thứ 5, chưa có trong plan (BLOCKING)

Vòng 1 và `plan.md` đếm **4** cạnh. Trên cây đã merge có **5**:

| # | Cạnh | Trạng thái |
|---|---|---|
| 1 | `state/cleanup-harness.mjs:41` → `runner/root-affinity.mjs` (`resolveRoot`) | đã có trong plan |
| 2 | `state/drift-status.mjs:18` → `runner/merge.mjs` (`detectTrunk`) | đã có trong plan |
| 3 | `state/graph-harness.mjs:23` → `runner/root-affinity.mjs` (`resolveRoot`) | đã có trong plan |
| 4 | `state/store.mjs:42` → `runner/session-identity.mjs` (`resolveWriterIdentity`) | đã có trong plan |
| 5 | **`state/graph-metrics.mjs:18` → `runner/frozen-judge.mjs` (`normalizePath`)** | **MỚI, chưa có trong plan** |

Cạnh 5 do commit `ac1e30f1` (`fix(tsk-2jn): footprintOverlapAmong normalizes
both sides through normalizePath`) trên `main` thêm vào, sau khi plan được viết.

**Hệ quả cứng:** clause `! grep -rqF "from '../runner/" src/state/` trong verify
đã chốt của item **sẽ đỏ** nếu chỉ cắt 4 cạnh. Verify chặt hơn danh sách task —
không phải chọn cắt hay không, mà là cắt thì item mới xanh.

**Đường cắt rẻ nhất** (cùng khuôn với move `session-identity.mjs` đã nằm trong
`tsk-49i-1`): `normalizePath` (`runner/frozen-judge.mjs:42`) là hàm thuần xử lý
chuỗi path, không import gì nội bộ. Dời sang `src/util/normalize-path.mjs`.
Consumer hiện tại: `frozen-judge.mjs:58,61,97,100`, `runner/merge.mjs:49`,
`state/graph-metrics.mjs:18`, `bin/fgos.mjs:49`. Mọi importer rank ≤ 3 nên
`kernel`(4) hợp lệ, khớp 2 sibling `src/util/` sẵn có.

### F2 — Anchor còn đúng nguyên (không cần sửa gì)

- `state/drift-status.mjs:118` `driftStatus`, `:120` `detectTrunk(`, `:210`
  `unmergedDeliveries`, `:212` `detectTrunk(` — **cả 4 đúng từng dòng**.
- `test/state/drift-status.test.mjs:7` import; 12 call `driftStatus` +
  12 call `unmergedDeliveries` = **24 call site, số dòng y nguyên**
  (`:48,:54,:63…`, `:242,:250,:256…`).
- `test/runner/root-affinity.test.mjs` — import trong `:3-8` (thực tế `:5`),
  call `:23,:32,:33,:34,:39,:47` — **đúng hết**.
- `isMainWorktree`: vẫn chỉ 2 comment, `test/runner/merge.test.mjs:325` và
  `test/cli/fgos-approve.test.mjs:1127` — **đúng cả 2**.
- `session-identity.mjs`: `test/runner/session-identity.test.mjs:17`,
  `test/state/store.test.mjs:22`, `.githooks/pre-commit:29`,
  `test/e2e/main-checkout-lock-hook.test.mjs:26,48,81,121`,
  `test/e2e/main-checkout-lock-hook-worktree-commit.test.mjs:34,68`,
  `plugins/fgOS/skills/terminal/rename.sh:64,69` — **đúng**.
- `ensureBranchPushed` def `bin/fgos.mjs:264` — đúng, và **vẫn đúng 1 call**.
- Manifest: `layers` `:4-10`, index = rank; **rank của cả 10 file item này đụng
  không đổi** (`bin/fgos.mjs` entry; `store/drift-status/session-identity/merge/
  worktree` infra; `frontier/root-affinity/iron-law/graph-metrics/frozen-judge`
  domain; `loop` use-case).
- `src/util/` vẫn đúng 2 file, cả hai `kernel`; **`src/verbs/` vẫn chưa tồn tại**.
- `test/architecture.test.mjs`: `:20` rank map, `:36` `deepEqual`, `:68` so rank
  — **đúng**. Vẫn không có version gate.
- `src/config/shared-config-file.mjs:60` `DEFAULT_INVARIANT_CHECK_COMMANDS` —
  đúng từng dòng.
- `src/intake/discovery.mjs:84` `RETIRED_P14_PLACEHOLDER` — đúng từng dòng.
- `src/runner/dispatch.mjs:247` `timeoutMs: 900000` — đúng từng dòng.
- `package.json`: vẫn chỉ có script `test` (`:25`), **vẫn không có
  `devDependencies`**, không lint/typecheck/build.

### F3 — Anchor đã lệch số dòng (claim vẫn đúng, chỉ sai toạ độ)

| Vòng 1 ghi | Thực tế sau merge | Ghi chú |
|---|---|---|
| `detectTrunk` call `test/runner/merge.test.mjs:1420,:1463` | **`:1511`, `:1554`** | `main` thêm 2 khối test `detectTrunk` mới (master-trunk, origin/HEAD) — commit `c727b439` |
| `ensureBranchPushed` call `bin/fgos.mjs:3169` | **`:3227`** | vẫn đúng 1 call duy nhất |
| Iron Law gate `bin/fgos.mjs:3422-3447` | **`:3494-3503`** (và gate thứ 2 `:4100-4101`) | |
| timeout mặc định `bin/fgos.mjs:333` | **`:304`** (`MAX_WAIT_MS`) | |
| re-export lọt regex `src/setup/registrations.mjs:56` | **`:57`** | claim "re-export lọt" vẫn đúng |
| 3 collector `bin/fgos.mjs:549-598` | `collectOutcomeEntry:549`, `collectFrictionData:569`, `collectReviewTrace:593` | vẫn nằm trong khoảng cũ |

### F4 — Claim đã sai nội dung (không chỉ lệch dòng)

1. **`required = matchedModules.length > 0`** — sai. Thực tế
   `src/evolve/iron-law.mjs:93`:
   `const required = matchedModules.length > 0 || matchedFlags.length > 0;`
   Kết luận không đổi (gate vẫn chặn approve), nhưng prompt đang trích sai.
2. **"`performCatchUp` không xuất hiện ở bất kỳ test nào"** — nay có 1 chỗ:
   `test/cli/fgos-approve.test.mjs:369`, trong **chuỗi message của assert**, không
   phải import. Hợp đồng hành vi (assert trên commit message `catch-up:`) vẫn
   không đổi khi move thuần. Def nay ở `bin/fgos.mjs:1063`, **3 call**
   (`:3677`, `:4219`, `:4543`).

### F5 — Tham chiếu ngoài `src/`+`bin/` vòng 1 bỏ sót (không blocking)

Cả hai đều là hệ quả của move `session-identity.mjs`, không test nào bắt được:

- `plugins/fgOS/skills/_shared/capacity-dispatch-fallback.md:176` — trích
  `src/runner/session-identity.mjs:129` kèm số dòng trong prose skill.
- `scripts/check-decision-codes.baseline.json:214` — key theo đường dẫn
  **file test** `test/runner/session-identity.test.mjs`. Nếu dời file test theo
  module sang `test/util/`, baseline này phải đổi key, nếu không
  `scripts/check-decision-codes` lệch baseline.

### Verdict vòng 2

Bằng chứng vòng 1 **vẫn dùng được**: mọi kết luận về shape (manifest, rank,
architecture test, verify convention) đều đúng nguyên; lệch chủ yếu là toạ độ
dòng trong `bin/fgos.mjs` và `test/runner/merge.test.mjs`. **Một thay đổi phạm
vi thật: cạnh thứ 5 ở F1** — phải nằm trong `tsk-49i-1` (cùng item với 4 cạnh
kia) thì verify đã chốt mới xanh; đây là quyết định phạm vi cho người, không
phải cho skill tự nới.

---

## Vòng 3 — 2026-08-15, re-verify sau đợt `tsk-5tm` (dispatch unification)

**Vì sao:** `main` nhận thêm **44 commit** sau lần merge `ba25a590` — trọn đợt
`tsk-5tm` (task-dispatch-unification, 6 con) cộng 2 commit chỉnh model map.
Merge lần hai, sạch, không conflict.

**Diện thay đổi rất hẹp so với item này.** Trong `src/`+`bin/` **đúng 1 file
đổi**: `src/runner/dispatch.mjs` (+424/−108). **Không thêm file `.mjs` mới**
nào dưới `src/`/`bin/`/`scripts/`. Trong `test/` chỉ 2 file:
`test/runner/dispatch.test.mjs`, `test/scripts/project-agents.test.mjs`.

**Hệ quả: `bin/fgos.mjs` byte-identical** với lần verify Vòng 2, và không file
test nào trong footprint của 2 con bị đụng. Nên **toàn bộ anchor Vòng 2 §F2/§F3
vẫn đúng nguyên**, không cần kiểm lại từng dòng: gate Iron Law `:3494-3503`,
`ensureBranchPushed` `:264`/`:3227`, 3 collector `:549/:569/:593`,
`MAX_WAIT_MS` `:304`, cả 24 call site `drift-status.test.mjs`, 2 call
`detectTrunk` `merge.test.mjs:1511/:1554`.

### G1 — Cạnh import: vẫn đúng 5, không phát sinh cạnh thứ 6

`grep -rn "from '../runner/" src/state/` trả đúng 5 dòng của §F1. `dispatch.mjs`
nằm ở phía `runner/` nên đợt này không thêm cạnh ngược nào.

### G2 — Manifest và architecture test: không đổi

Không có file `.mjs` mới ⇒ không cần row manifest mới.
`node --test test/architecture.test.mjs` **xanh, 3/3 pass, 49ms** trên cây đã
merge — invariant check của repo vẫn sạch trước khi item bắt đầu.

### G3 — Anchor lệch (1 chỗ)

| Vòng trước ghi | Thực tế | |
|---|---|---|
| `src/runner/dispatch.mjs:247` `timeoutMs: 900000` | **`:260`** | `bin/fgos.mjs:304` không đổi |

### G4 — Ghi chú xuất xứ của Vòng 1 nay đã lỗi thời

Vòng 1 mô tả cách nó dispatch 3 nhánh nghiên cứu song song: "`gather` capacity
chưa đăng ký — `dispatch.mjs decide --for gather` trả
`{"mechanism":"unavailable"}` → fallback native Task". Sau `tsk-5tm-2` (D6),
`gather` **bị khai tử hẳn** chứ không còn là "chưa đăng ký"
(`src/runner/dispatch.mjs:446`). Đây chỉ là ghi chú về cách vòng 1 tự chạy,
**không phải bằng chứng nào của item** — nhưng đừng lấy nó làm hướng dẫn để
lặp lại thí nghiệm cũ.

### Verdict vòng 3

Không có thay đổi phạm vi. Plan và spec 2 con **giữ nguyên như sau Vòng 2**
(5 cạnh, footprint đã bổ sung). Sửa duy nhất: toạ độ ở §G3.
