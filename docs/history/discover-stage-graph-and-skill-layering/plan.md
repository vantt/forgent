# Plan: tsk-403 — Đổi tên cả họ `decompose` thành `plan`

Mode: **standard**

Đếm cờ theo Mode-gate (`fgos-routing`): 2 cờ áp dụng —
**public contracts** (đổi tên verb CLI `fgos decompose`→`fgos plan` và
launcher `/fgOS:decompose`→`/fgOS:plan`, cả hai là bề mặt người dùng gõ
trực tiếp) và **existing covered behavior** (rename chạm
`workflow-stage-graphs.mjs`, `bin/fgos.mjs`, `src/intake/decompose.mjs`,
đều có test bao phủ hôm nay). Không cờ hard-gate nào áp dụng (không auth,
không data loss, không audit/security, không external provider, không gỡ
validation) → không tự động lên `high-risk`. 2 cờ khớp khung "2–3 cờ →
standard", khớp `risk: "standard"` item đã tự khai từ lúc tạo.

Không lane này được handoff sẵn từ phiên trước (session tự claim thẳng qua
`/fgOS:pick` rồi `fgos-coding-driving`, chưa từng qua `fgos-routing`'s
Orient), và `plan.md` chưa tồn tại trước bước này — áp dụng fallback: tự
đọc Mode-gate và tính cờ như trên (không tái dùng một lane đã quyết từ
trước, vì thật sự chưa có).

## Approach

**Đường đi.** Rename cơ học xuyên repo theo đúng tiền lệ commit `8eba4a40`
(`chore(tsk-f38): rename skill fgos-executing to fgos-code-implement`) —
đã kiểm tra trực tiếp: commit đó đổi **131 file** cho **một** skill rename,
gồm cả `docs/history/*/CONTEXT.md` + `plan.md` lịch sử, `plans/reports/*`,
`docs/{explanation,how-to,reference,decisions}/*`, test, và cả file gốc
`tsk-1op-case-study-note.md` — xác nhận "full rewrite gồm cả docs/history"
không phải giả định của phiên này, là quy ước **đã có tiền lệ thật**, đúng
như D15/mô tả item đã trích.

**Phương án bị loại.** Đổi riêng lẻ ba việc (stage/verb/launcher trước,
file sau, tiền tố sau nữa) trong ba PR khác nhau — bị loại vì quét toàn
repo ba lần cho cùng một việc (chính lý do D15 đã chốt gộp). Cân nhắc thay
`decompose` alias bằng deprecation-warning runtime thay vì static
`skillMap` entry — bị loại vì phức tạp hơn không cần thiết; `skillMap` là
data tĩnh, không cần logic runtime mới (đúng "Do not invent a new stage,
field, or event kind" của skill này).

**Bằng chứng scout mới, khác số liệu DISCUSSION.md đã ước lượng ban đầu:**
`rg -l "decompose"` (loại `node_modules`/`.git`/`.fgos`) khớp **493 file**,
không phải "hai how-to doc" như DISCUSSION.md ước lượng nhẹ ban đầu. Vỡ ra:

| Thư mục | Số file |
|---|---|
| `docs/history` | 281 |
| `docs/explanation` | 50 |
| `plans/reports` | 32 |
| `docs/how-to` | 24 |
| `src/state` | 11 |
| `plugins/fgOS` | 10 |
| `test/state` | 9 |
| `test/e2e` | 7 |
| `src/runner` | 7 |
| `docs/reference` | 7 |
| `docs/decisions` | 7 |
| còn lại (test/cli, test/runner, src/intake, herdr-plugin, docs/specs, docs/distillery, test/intake, docs/journals, gốc) | 26 |

**Cảnh báo quan trọng cho người thực thi (không phải quyết định mới, là
ranh giới thực thi):** `rg "decompose"` khớp CẢ literal identifier
(stage/verb/tên file) LẪN từ tiếng Anh thông thường "decompose" dùng
trong văn xuôi (vd. "decompose công việc thành phần nhỏ" — nghĩa "chia
nhỏ", không liên quan gì tên stage). Sweep phải phân biệt hai loại này:
chỉ đổi literal identifier (`stage: 'decompose'`, `fgos decompose`,
`skillMap.decompose`, tên file `decompose.mjs`, đường dẫn
`plugins/fgOS/skills/decompose`), **không** đổi câu văn xuôi dùng từ
"decompose" với nghĩa từ điển thông thường. Đây là ranh giới thực thi cho
`fgos-code-implement`, không phải một quyết định sản phẩm mới — không cần
quay lại `CONTEXT.md`.

**impact-analysis posture:** `fgos tool query --capability impact-analysis
--status present` → provider `gitnexus`, `status: "present"` → **full**.
Bằng chứng blast-radius cho các proof point bên dưới nên chạy qua GitNexus
(`impact`/`detect_changes`) khi khả thi, theo CLAUDE.md.

## Shape (phased — mode standard)

### Phase 1 — Core engine registry (`src/state/workflow-stage-graphs.mjs`)

- Đổi `stages` array của domain `coding`: thêm `planning`, **giữ**
  `decompose` (D18 — alias legacy).
- `skillMap`: thêm `planning: 'fgos-coding-planning'`; **sửa** (không
  xoá) `decompose: 'fgos-planning'` thành `decompose: 'fgos-coding-planning'`
  — **điểm dễ sai nhất của cả kế hoạch**: alias `decompose` vẫn phải trỏ
  tới skill THẬT sau khi thư mục skill đã đổi tên (việc 3), nếu không 3
  item đang mở trên stage đó (`tsk-42i`, `tsk-3at`, `tsk-3m6`) sẽ trỏ tới
  một thư mục không còn tồn tại — đúng thất bại D18 định ngăn, chỉ là ở
  một lớp khác (skill file, không phải stage name).
- `stepMap`: **đã đọc thật** `src/state/workflow-stage-graphs.mjs:74-78`
  — hôm nay `stepMap` của domain `coding` là `{ clarify: 'Clarify',
  decompose: 'Divide', executing: 'Execute' }`, tức `decompose` ĐANG có
  entry thật, không phải "chưa có gì để khỏi thêm". Hành động chính xác:
  **xoá hẳn** entry `decompose: 'Divide'` hiện có, **thêm mới** `planning:
  'Divide'` thay vào đúng vị trí đó — kết quả giống hệt D18 mô tả (`decompose`
  không còn trong `stepMap`, `discovery`/`exploring` vẫn tiếp tục không có
  như hôm nay), chỉ khác ở chỗ đây là một phép XOÁ+THÊM, không phải một
  phép THÊM đơn thuần như bản nháp trước đó lỡ viết.
- `transitions`: giữ cạnh `decompose -> executing` và `clarify ->
  decompose`/`exploring -> decompose` (D18 "giữ cạnh ra của nó" — đọc kỹ:
  giữ cả cạnh VÀO lẫn RA, vì 2 trong 3 item mở đang ở `blocked`/
  `awaiting-human`, tức đã từng đi vào bằng một cạnh vào rồi; không cần
  cạnh vào mới nhưng cạnh cũ không được xoá). Thêm cạnh mới song song
  dùng tên `planning` cho luồng mới: `clarify -> planning`, `exploring ->
  planning`, `planning -> executing`.
- Domain thứ hai trong cùng file (dòng ~334, không phải `coding`) **không
  đụng** — nó đã tự có `decompose: null` trong `skillMap`, ngoài phạm vi
  D9's domain-prefix logic.

**Proof point (risk: TRUNG BÌNH).** 3 item đang mở phải vẫn resolve được
skill thật sau rename — test: đọc `skillForStage(getDomain('coding'),
'decompose')` trả về `'fgos-coding-planning'`, và
`fs.existsSync('.claude/skills/fgos-coding-planning')` = true tại thời
điểm Phase 1 hoàn tất (tức Phase 1 phải làm SAU Phase 4's rename thư mục
skill, hoặc Phase 1 phải trỏ tới tên đích trước rồi Phase 4 hiện thực hoá
— xem thứ tự Phase bên dưới, đã chọn vế sau vì `fgos graph` không áp dụng
được cho thứ tự nội-file của một item không-split).

### Phase 2 — File + hàm nội bộ (`src/intake/decompose.mjs` → `plan.mjs`)

- `git mv src/intake/decompose.mjs src/intake/plan.mjs`.
- **Sửa lại theo bằng chứng thật (đã đọc file, không đoán):** hàm export
  thật trong file là `resolveDecompose`, `resolveCallerDecomposeVerdict`,
  `resolveContentRoot`, `readLockedContext`,
  `findUncoveredLockedDecisions` — đổi hai cái đầu mang chữ `decompose`:
  `resolveDecompose`→`resolvePlan`, `resolveCallerDecomposeVerdict`→
  `resolveCallerPlanVerdict`. **`judgeDecompose` KHÔNG PHẢI hàm còn sống**
  — chỉ còn trong comment mô tả nó đã bị retire (dòng 6, 458, 468 của
  `decompose.mjs`: "that judgeDecompose is retired", cùng lý do
  `judgeDiscovery` bị khai tử ở `discovery.mjs`) — không có gì để đổi
  tên, chỉ cần sửa CHỮ trong các comment đó từ `judgeDecompose` thành một
  cụm mô tả tương đương (vd. "the retired subprocess judge") nếu muốn
  nhất quán, không bắt buộc vì đó không phải identifier thật.
  `passThroughModeMatch` (nằm ở `fgos-planning`, không phải file này) giữ
  nguyên tên. **Giá trị verdict STRING `"decompose"` / `"pass-through"` /
  `"need-human"` GIỮ NGUYÊN nguyên văn** (D11: tên kết cục, không phải
  tên hàm/chặng). Cập nhật mọi call site — xác nhận qua `grep`:
  `bin/fgos.mjs:28` (`import { resolveDecompose } from
  '../src/intake/decompose.mjs'`) là call site DUY NHẤT import trực tiếp
  từ file này; `resolveCallerDecomposeVerdict` chỉ được gọi NỘI BỘ trong
  chính `decompose.mjs` (dòng 547), không bị import ở nơi khác — thu hẹp
  đáng kể bề mặt cần sửa so với ước lượng ban đầu.
- `git mv test/intake/decompose.test.mjs test/intake/plan.test.mjs`, sửa
  import path.

**Vì sao đổi tên hàm dù item chỉ nói "đổi tên file":** một file `plan.mjs`
export `resolveDecompose` là mâu thuẫn tên ngay trong chính file đó —
cùng lỗi lệch verb-vs-stage mà D11 ghi nhận là *lý do gốc gây ra cả phiên
rename này*. Đây là suy luận triển khai (Approach), không phải quyết định
sản phẩm mới — không cần quay lại `CONTEXT.md`.

### Phase 3 — Engine verb + CLI dispatch (`bin/fgos.mjs`)

- `case 'decompose':` (dòng 1219) → `case 'plan':`. Thông báo lỗi bên
  trong (`"decompose requires an id..."`, `"decompose: work ... not ...,
  use fgos discover ... instead"`) đổi chữ `decompose` → `plan` NHƯNG câu
  `--verdict must be "pass-through", "need-human", or "decompose"` (dòng
  436) **giữ nguyên** vì đó là danh sách giá trị verdict hợp lệ (D11).
- Import từ `plan.mjs` (Phase 2) thay vì `decompose.mjs`.
- `stageForStep(..., 'Divide')` vẫn đúng nguyên (không đổi, chỉ đổi cái
  gì gọi nó).

**Proof point (risk: THẤP — cơ học, có test bao phủ sẵn).** `npm test`
phần `test/cli/*` phải xanh; đặc biệt case gọi `fgos decompose <id>` cũ
giờ phải báo "unknown command" hoặc tương tự có kiểm soát — không câm
lặng.

### Phase 4 — Launcher (`plugins/fgOS/skills/decompose` → `plan`)

- `git mv plugins/fgOS/skills/decompose plugins/fgOS/skills/plan`, sửa
  toàn bộ `SKILL.md` bên trong: `/fgOS:decompose` → `/fgOS:plan`, mọi câu
  gọi `fgos decompose` → `fgos plan`.
- **Không** tạo alias ở lớp launcher — verify item yêu cầu thẳng `!
  test -d plugins/fgOS/skills/decompose` (xoá hẳn, không giữ). Điều này
  **không mâu thuẫn** D18: D18 chỉ giữ alias ở lớp STAGE (máy, cho item
  đang đứng sẵn), còn launcher là lệnh người gõ tay — người luôn gõ
  `/fgOS:plan <id>` bất kể item đang ở stage `decompose` (legacy) hay
  `planning` (mới), vì `fgos-coding-driving` resolve theo `skillMap` dữ
  liệu, không theo tên launcher người gõ.
- Sửa mọi launcher khác trỏ tới cặp `decompose-next`/`decompose-loop` nếu
  có (D11 ghi cặp `plan-next`/`plan-loop` thuộc MỘT task con khác, ngoài
  phạm vi `tsk-403` — task này chỉ cần đảm bảo tên `plan` đã sẵn sàng cho
  con đó dùng, không tự tạo cặp launcher mới).

### Phase 5 — Tiền tố `coding-` cho 5 skill (cả hai mirror)

Đổi cả `.claude/skills/` và `.agents/skills/` (đã xác nhận có mirror đầy
đủ 13 thư mục ở cả hai phía):

| Cũ | Mới |
|---|---|
| `fgos-exploring` | `fgos-coding-exploring` |
| `fgos-planning` | `fgos-coding-planning` |
| `fgos-validating` | `fgos-coding-validating` |
| `fgos-compounding` | `fgos-coding-compounding` |
| `fgos-code-implement` | `fgos-coding-implement` |

`git mv` từng cặp thư mục ở cả hai mirror (10 lệnh `mv`), rồi sửa mọi
cross-reference bên trong từng `SKILL.md` (skill nào cũng nhắc tên các
skill khác trong chuỗi `clarify → discovery → exploring → planning →
executing`), cộng chính `skillMap` (Phase 1) đã trỏ đúng tên mới.
**Không** đụng `fgos-clarifying`/`fgos-researching` (D9, helper) và
**không bao giờ** đụng `fgos-fanout`/`fgos-indexing`/`fgos-routing`/
`fgos-unlock` (D19).

**Proof point (risk: TRUNG BÌNH).** Sau rename, `grep -rn
"fgos-code-implement\|fgos-planning\b\|fgos-validating\b\|fgos-compounding
\|fgos-exploring\b"` (không phải bare `decompose`) trên toàn repo — ngoại
trừ `docs/history` snapshot của các item ĐÃ HOÀN TẤT TRƯỚC `tsk-403` mà
KHÔNG thuộc "full rewrite" convention của chính `tsk-403` — phải về 0 tại
những chỗ đang hoạt động thật (`src/`, `bin/`, `plugins/`, `.claude/`,
`.agents/`, `test/`). Đây là clause item's own `verify` field **không**
kiểm — item chỉ kiểm `! test -d plugins/fgOS/skills/decompose`. Rủi ro:
verify hiện tại KHÔNG bắt được một cross-reference sót trong SKILL.md của
skill khác. Khuyến nghị cho `fgos-validating`: chạy sweep thủ công này
như một proof point độc lập, không chỉ dựa vào `verify` string hiện có.

### Phase 6 — Sweep toàn repo còn lại + CHANGELOG

- `docs/history/*` (281 file, theo tiền lệ commit `8eba4a40` — full
  rewrite, gồm cả CONTEXT.md/plan.md lịch sử của các item **khác**
  `tsk-403`, không phải chỉ tài liệu của chính item này).
- `docs/{explanation,how-to,reference,decisions}` (~88 file cộng lại) —
  đây là **living docs**, mọi tham chiếu `fgos decompose`/stage
  `decompose`/tên skill cũ phải cập nhật vì chúng mô tả hành vi HIỆN TẠI,
  không phải lịch sử.
- `plans/reports` (32 file) — theo cùng tiền lệ.
- `test/state`, `test/e2e`, `test/cli`, `test/runner`, `herdr-plugin/src`
  — sửa theo Phase 1-4 đã đổi API/CLI.
- **CHANGELOG.md**: thêm dòng vào `## [Unreleased]` — bắt buộc theo
  AGENTS.md's install/setup/doctor gate ("Does this change something a
  user of fgOS would see? If yes, add a line"). Đổi tên CLI verb
  (`fgos decompose`→`fgos plan`) và launcher (`/fgOS:decompose`→
  `/fgOS:plan`) là thay đổi người dùng thấy trực tiếp — dòng CHANGELOG
  không có trong bất kỳ D-ID nào ở CONTEXT.md vì đây là nghĩa vụ đứng
  ngoài phạm vi rename, áp dụng cho MỌI thay đổi user-visible.

**Proof point (risk: THẤP, khối lượng lớn nhưng cơ học).** `npm test`
xanh sau toàn bộ sweep; verify string của item tự nó không kiểm hết 493
file nhưng `npm test` sẽ bắt được phần nào tham chiếu code thật bị đổi mà
quên sửa (import path vỡ, v.v.) — phần docs thuần văn bản (đa số 281 file
`docs/history`) không có gì tự động bắt sai nếu sót, rủi ro duy nhất là
"lười sót", giảm bằng cách chạy `rg -l "decompose"` lại SAU sweep và audit
thủ công từng file còn sót xem là literal identifier hay từ tiếng Anh
thường (đã phân biệt ở mục Approach).

## Assumptions (không phải câu hỏi mới — chi tiết chỉ người thực thi cần)

1. Thứ tự Phase 1→6 như trên là AN TOÀN cho `npm test` chạy xanh giữa
   chừng — không bắt buộc; có thể gộp Phase 1+2+3+4 thành một commit rồi
   Phase 5+6 một commit khác, miễn cuối cùng `fgos-code-implement`'s "one
   commit per item" khi return item (nhiều commit trong lúc làm là bình
   thường, chỉ cần lịch sử sạch trước khi return).
2. `fgos graph --json`/`--what-if` không áp dụng để quyết thứ tự SÁU
   PHASE NỘI BỘ của một item không-split (D15 đã chốt không split) — công
   cụ đó phục vụ thứ tự GIỮA CÁC ITEM, không phải giữa các bước trong một
   item. Thứ tự 6 phase trên chọn theo phụ thuộc kỹ thuật thật (Phase 1
   cần biết tên đích của Phase 4 trước khi ghi `skillMap`, nên viết theo
   thứ tự khai báo nhưng thực hiện Phase 4 song song/trước khi commit
   Phase 1 nếu cần — không phải một ràng buộc tuần tự cứng).
3. Repo có công cụ `git mv` sẵn dùng bình thường; không cần script
   riêng cho khối lượng này (493 file nhưng đa số là sed/rg thay chữ, không
   phải rename thư mục).

## Outstanding questions

None
