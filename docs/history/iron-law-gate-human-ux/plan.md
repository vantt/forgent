# plan.md — Iron Law gate UX (`tsk-1y6`)

Mode: high-risk

**5 cờ áp dụng** trên bảng 10 cờ của Mode-gate (`fgos-routing`
SKILL.md:36-64), trong đó **hai cờ hard-gate**:

| Cờ | Áp dụng? | Vì sao |
|---|---|---|
| authorization | **có** | D2 đổi *ai* được phép chạy `--acknowledge-iron-law` |
| audit/security | **có — hard-gate** | Iron Law là cổng an toàn của chính repo; D3 mở đường bỏ qua nó |
| removing a validation | **có — hard-gate** | D1 gỡ cổng ở mọi ranh giới không phải trunk |
| data model | có | D7 thêm key config; D8 thêm hình dạng bản ghi |
| public contracts | có | `ironLaw.level` là contract người dùng viết tay; `/fgOS:approve` là bề mặt mới; RUL34/RUL37 đổi |
| existing covered behavior | có | `test/cli/fgos-approve.test.mjs`, `test/cli/fgos-merge.test.mjs`, `test/evolve/iron-law.test.mjs` đang phủ cổng này |
| auth · external systems · cross-platform · multi-domain | không | — |

Lane thấp hơn không trung thực: item này **làm yếu một cổng an toàn**.
`small`/`standard` không đòi proof point cho từng nhánh nới lỏng, mà đây
đúng chỗ sai một lần là mất niềm tin vào cả cổng.

`impact-analysis: degraded` — `gitnexus` `status: present` nhưng index
stale (`7bb3231`). Mọi proof point dưới đây **không** dựa vào blast radius
của GitNexus; bằng chứng lấy từ `rg`/đọc file trực tiếp. Proof point nào
lẽ ra tựa vào blast radius thì được đánh dấu là bằng chứng yếu.

`fgos graph --json`: `tsk-1y6` **không** nằm trên `criticalPath` (depth 10,
đường đi qua `tsk-4vo…tsk-19y-1`), không item nào phụ thuộc nó và nó không
phụ thuộc ai. `topUnblock` bị engine skip ở frame 753 node. Nên thứ tự bên
dưới do phụ thuộc nội bộ quyết định, không phải do vị trí trong đồ thị.

## Approach

### Đường đã chọn

Bốn mảnh, chia theo **file sở hữu** để chạy song song được mà không đua
cùng dòng. Không mảnh nào chạm file của mảnh khác.

1. **Engine gate** — thêm nhánh rẽ theo merge target + đọc mức config +
   ghi bản ghi mức `warn`. (D1, D3, D7, D8)
2. **`/fgOS:approve`** — skill mới, tự suy verb, trình bán kính trước khi
   hỏi. (D2, D9)
3. **merge-loop/merge-next** — đọc `skipped`, đi tiếp, trình gom một lượt.
   (D5, D2, D9)
4. **Spec + decision record** — RUL34/RUL37, supersede `D16/D17
   self-improve-loop`, CHANGELOG. (mọi D-ID)

Thứ tự bắt buộc: **3 sau 2** (prose của 3 trỏ tới skill mà 2 tạo ra);
**4 sau cả ba** (spec ghi lại hành vi đã có thật, không ghi lời hứa).
1 và 2 chạy song song được ngay.

### Lựa chọn đã loại

- **Gộp ba bản copy-paste của gate thành helper chung trước.** Cám dỗ vì
  cả ba nơi sắp sửa cùng một chỗ. Loại: đã có item backlog riêng cho việc
  này, và gộp nó vào đây biến một thay đổi hành vi thành một refactor
  cộng thay đổi hành vi — đúng thứ làm review không phân biệt được cái
  nào gây ra regression. Ba nơi sửa song song, giữ nguyên hình dạng lặp.
- **Nhét mức `warn` vào `gateBypass.level`.** Loại theo D3: phá D4 của
  `gate-bypass-design.md`, vốn khoá floor của `gateBypass` là không bao
  giờ chạm Iron Law.
- **Tách `/fgOS:sync-root` riêng khỏi `/fgOS:approve`.** Loại theo D9.
- **Dựng cạnh FSM `awaiting-approval → awaiting-human` cho D5.** Loại:
  `status-fsm.mjs` nằm trong `MODULE_RULES` của Iron Law, nên bản vá trip
  đúng cổng nó đi sửa; và engine đã có sẵn `skipped`.

### Bản đồ rủi ro

| Thành phần | Mức | Điều gì chứng minh được |
|---|---|---|
| Nhánh rẽ trunk-only ở 3 gate site | **cao** | Test cặp đối xứng: leaf→`fgw/<root>` **không** trip; cùng diff đó root→trunk **có** trip. Thiếu vế thứ hai là cổng đã chết mà test vẫn xanh. Cộng một ca riêng cho `sync-root` với gốc-có-ông (`item.parent` tồn tại và cha cũng có cha) để chứng minh nó dùng `!item.parent` chứ không phải `resolveRoot` — xem A1b. |
| Mức `warn` bỏ qua cổng | **cao** | Test: `warn` cho merge đi qua VÀ ghi đúng một bản ghi `kind: engine`; `ask` (mặc định, và khi thiếu key) vẫn chặn cứng. Ca "thiếu key config" phải fail-closed về `ask`. |
| `/fgOS:approve` tự suy verb | trung bình | Prose không assert được bằng shell (xem "Chủ sở hữu chứng-minh-runtime", `docs/how-to/write-verify-for-a-skill-prose-change.md`). Verify chỉ chứng minh deliverable tồn tại + mang câu bán kính; hành vi thật thuộc review lúc merge + smoke-test. **Bằng chứng yếu, đã khai.** |
| merge-loop đọc `skipped` | trung bình | Cùng giới hạn prose như trên. Vế NEGATIVE chứng minh câu "dừng cả vòng lặp" đã biến mất là phần mạnh nhất shell làm được. |
| `ironLaw.level` vào doctor | thấp | Test registration: `fgos doctor` báo khi key thiếu; `--fix` ghi mặc định `ask`. |
| Sửa spec RUL34/RUL37 | thấp | `check-decision-citation-drift` + `npm test`. |

### File sẽ chạm

- **Mảnh 1**: `bin/fgos.mjs` (`:2487`, `:3494`, `:4100`),
  `src/setup/registrations.mjs`, `.fgos/config.json`,
  `test/cli/fgos-iron-law-gate.test.mjs` (mới).
- **Mảnh 2**: `plugins/fgOS/skills/approve/SKILL.md` (mới).
- **Mảnh 3**: `plugins/fgOS/skills/merge-loop/SKILL.md`,
  `plugins/fgOS/skills/merge-next/SKILL.md`.
- **Mảnh 4**: `docs/specs/runner.md`, `docs/decisions/`, `CHANGELOG.md`.

Đã kiểm: `plugins/fgOS/.claude-plugin/plugin.json` (286B) **không** liệt kê
tên skill — skill tự được phát hiện, nên mảnh 2 và mảnh 3 không chung
manifest nào. Footprint rời nhau thật, không phải giả định.

**Footprint đụng `tsk-1js`** (Iron Law không quản được project khác, risk
`heavy`): item đó sẽ sửa `src/evolve/iron-law.mjs` và cùng vùng
`bin/fgos.mjs`. Mảnh 1 ở đây **không** đụng `src/evolve/iron-law.mjs` —
chữ ký và hành vi `classifyIronLaw` giữ nguyên (D6). Chồng lấn còn lại chỉ
ở `bin/fgos.mjs`; `fgos conflicts` sẽ thấy, và thứ tự đúng là item này
xong trước vì `tsk-1js` xây trên nhánh rẽ mảnh 1 tạo ra.

## Shape

### Ca cụ thể đáng chứng minh

**Ranh giới (D1).** Leaf có `parent`, target là `fgw/<root>` → không trip.
Cùng leaf đó, nếu `resolveRoot` trả về chính nó (root không cha) → target
là trunk → trip như cũ. Gốc **có** `parent` mà `sync-root` → target là
`fgw/<parent>`, không trip. Gốc **không** `parent` → `detectTrunk()` →
trip. Bốn ca này là bốn nhánh thật của hai biểu thức đã có sẵn trong code,
không phải ca bịa.

**Ca biên của config (D7).** Thiếu hẳn key `ironLaw` → mặc định `ask`
(fail-closed). `level` là chuỗi lạ → `ask`, không phải `warn`. `level`
đúng `"warn"` → đi qua. Cùng kỷ luật "bất kỳ thứ gì khác `true` đều là
`false`" mà các Gate section hiện có đang dùng.

**Hành vi cũ không được hồi quy.** `--acknowledge-iron-law` chỉ tính khi
là boolean `true` trần (`review-20260718-self-improve-loop` f02: mọi dạng
mang giá trị đều fail-closed). Nhánh `--github` vẫn phải qua cổng
(f01 từng là lỗ hổng thật). Nguồn `pull`/`legacy` vẫn không qua cổng.

**Ghi bản ghi (D8).** Bản ghi mức `warn` do engine gọi `addDecision` trực
tiếp với `kind: 'engine'` — **không** shell ra `fgos decision`, vì verb đó
không có flag `--kind` (`src/cli/command-registry.mjs`, đã ghim trong
CONTEXT.md) và sẽ ghi `kind: design`, tái tạo đúng lỗi backlog đang mở.

**Thất bại từng phần.** Ở mức `warn`, nếu merge hỏng sau khi bản ghi đã
ghi, bản ghi vẫn đứng — đó là chấp nhận được (nhật ký append-only ghi
"đã bỏ qua cổng", không ghi "đã merge xong"). Ngược lại thì không: không
được merge trước rồi mới ghi.

### Giá của việc sai

- **D1 sai** (bỏ hỏi ở chỗ lẽ ra phải hỏi) — **đắt**: một diff tự-sửa
  land lên main không ai duyệt. Nhưng có đường lùi rẻ: nhánh rẽ là một
  điều kiện, revert một dòng.
- **D3/D7 sai** (mức `warn` bật nhầm) — **rẻ để lùi**, đắt trong lúc còn
  bật: mặc định là `ask` và thiếu key cũng là `ask`, nên sai chỉ xảy ra
  khi người chủ động ghi `warn` vào config.
- **D9 sai** (skill suy nhầm verb) — **rẻ**: skill trình bán kính trước
  khi hỏi, nên người thấy ngay nó định làm gì và từ chối được.
- **D5 sai** (bỏ qua nhầm item) — **rẻ**: không merge gì cả, item ở
  nguyên `awaiting-approval`, lượt quét sau gặp lại.

Lựa chọn đảo ngược được làm mất hẳn câu hỏi: mảnh 1 giao **trước** mọi
mảnh khác thì cổng vẫn nguyên hành vi cũ ở mức mặc định `ask` — tức có
thể land mảnh 1 mà chưa land mảnh 2/3, không kẹt nửa vời.

### Giả định

- **A1 — ĐÃ CHỨNG MINH, và bản nháp trước của chính giả định này sai.**
  Nháp cũ viết "chưa chứng minh cho ca gốc có `parent` mà nhánh cha chưa
  tồn tại — code hiện fallback về trunk". Sai: nó lẫn **diff base** với
  **merge target**. Đọc thật `bin/fgos.mjs:3596-3608` — khi
  `resolveRoot(view, id) !== id`, `approve` lấy `rootBranch =
  branchNameFor(rootId)` và nếu nhánh chưa tồn tại thì **`createBranchRef`
  tạo nó**, chứ không lùi về trunk. Cái fallback-về-trunk (`... : {}` ở
  `:3487`) chỉ áp cho `changedFiles`' diff base, không đụng target. Nên
  với `approve`: `resolveRoot(view, id) === id` ⟺ target là trunk, đúng
  vô điều kiện.

- **A1b — discriminator KHÁC NHAU theo từng call site, không dùng chung
  một biểu thức.** Đây là điểm A1 cũ che mất:
  - `approve` (`:3596`) và `merge next`'s `wouldTripIronLaw` (`:2480`, vốn
    là bản pre-check soi gương của `approve`) → dùng
    `resolveRoot(view, id) === id`.
  - `sync-root` (`:4090`) → dùng **`!item.parent`**, KHÔNG phải
    `resolveRoot`. `sync-root` chỉ land vào **cha trực tiếp**
    (`targetBranch = item.parent ? branchNameFor(item.parent) :
    detectTrunk(repoRoot)`) và throw nếu nhánh cha không tồn tại. Dùng
    `resolveRoot` ở đây sẽ SAI cho một gốc có cha mà cha lại có ông:
    `resolveRoot` leo tới đỉnh, còn target thật chỉ lên một bậc.

  Mảnh 1 phải viết hai biểu thức riêng, không refactor thành một helper
  dùng chung — đó chính là cái bẫy mà việc "gộp ba bản copy-paste" (đã
  loại ở trên) sẽ đẩy người ta rơi vào.
- **A2** — Không tồn tại đường thứ tư nào gọi `classifyIronLaw`. Dựa trên
  `rg 'classifyIronLaw\('` trả đúng ba call site, chạy lại sau merge
  `main`. Đã chứng minh.

## Split

Bốn mảnh, mỗi mảnh một item con. Không mảnh nào tự đứng được như một
pass-through của item cha: mảnh 1 đổi engine, mảnh 2 tạo bề mặt mới, mảnh
3 sửa prose hai skill, mảnh 4 sửa spec — bốn loại chứng minh khác hẳn
nhau, gộp lại thì một verify không nói được điều gì trung thực về cả bốn.

```json
[
  {
    "title": "Iron Law gate: chỉ chạy ở ranh giới trunk, đọc ironLaw.level, ghi bản ghi mức warn",
    "verify": "npm test && grep -q 'ironLaw' src/setup/registrations.mjs && node --test test/cli/fgos-iron-law-gate.test.mjs",
    "action": "D1: thêm nhánh rẽ theo merge target ở cả ba call site classifyIronLaw (bin/fgos.mjs:2487/:3494/:4100) để cổng chỉ chạy khi target là trunk. Hai biểu thức RIÊNG, không gộp thành helper chung (plan.md A1b): approve và merge-next dùng resolveRoot(view,id)===id; sync-root dùng !item.parent vì nó chỉ land vào cha trực tiếp, dùng resolveRoot ở đó sẽ sai cho gốc có ông. D3+D7: đọc ironLaw.level (ask mặc định, warn opt-in), đăng ký check+fix vào src/setup/registrations.mjs theo khuôn gateBypass, thiếu key thì fail-closed về ask. D8: ở mức warn ghi một bản ghi qua addDecision với kind engine, không shell ra fgos decision. Không đụng src/evolve/iron-law.mjs — chữ ký classifyIronLaw giữ nguyên theo D6.",
    "footprint": ["bin/fgos.mjs", "src/setup/registrations.mjs", ".fgos/config.json", "test/cli/fgos-iron-law-gate.test.mjs"],
    "kind": "task",
    "risk": "heavy"
  },
  {
    "title": "Xây skill /fgOS:approve — tự suy verb approve/sync-root, trình bán kính trước khi hỏi",
    "verify": "npm test && test -f plugins/fgOS/skills/approve/SKILL.md && grep -q '^name: approve$' plugins/fgOS/skills/approve/SKILL.md && grep -q 'blast radius before asking' plugins/fgOS/skills/approve/SKILL.md && ! git diff --name-only main...HEAD | grep -q '^src/'",
    "action": "D2: người duyệt trong chat là đủ, skill tự chạy lệnh, tự đọc exit code, tự sửa lỗi cơ học và retry — không đẩy lệnh cho người gõ. D9: MỘT skill bọc cả approve lẫn sync-root, tự suy verb từ id, và BẮT BUỘC trình bán kính (verb nào, gốc nào, bao nhiêu con đi kèm) trước khi hỏi.",
    "footprint": ["plugins/fgOS/skills/approve/SKILL.md"],
    "kind": "task",
    "risk": "standard"
  },
  {
    "title": "merge-loop/merge-next: đọc skipped, đi tiếp thay vì dừng, trình danh sách Iron Law đọng gom một lượt",
    "verify": "npm test && grep -q 'every ready item is blocked' plugins/fgOS/skills/merge-loop/SKILL.md && grep -q 'fgOS:approve' plugins/fgOS/skills/merge-next/SKILL.md && ! grep -q 'stop the loop and report' plugins/fgOS/skills/merge-loop/SKILL.md",
    "action": "D5: đọc tín hiệu skipped / every ready item is blocked mà engine đã trả sẵn (bin/fgos.mjs:2557-2567), đi tiếp sang item sau thay vì dừng cả vòng lặp, tích luỹ danh sách rồi trình một lượt kèm bằng chứng đọc từ docs/history/<id>/iron-law-evidence.md. Item ở nguyên awaiting-approval — không fgos ask, không awaiting-human. D2+D9: sửa hai chỗ đang trỏ người tự gõ lệnh để trỏ sang /fgOS:approve.",
    "footprint": ["plugins/fgOS/skills/merge-loop/SKILL.md", "plugins/fgOS/skills/merge-next/SKILL.md"],
    "kind": "task",
    "risk": "standard"
  },
  {
    "title": "Cập nhật RUL34/RUL37 + decision record supersede D16/D17 self-improve-loop + CHANGELOG",
    "verify": "npm test && grep -q 'ironLaw.level' docs/specs/runner.md && ls docs/decisions/ | grep -q 'iron-law' && ! git diff --name-only main...HEAD | grep -q '^src/'",
    "action": "D1+D2+D3+D5: ghi lại vào spec hành vi đã có thật sau ba mảnh kia — cổng chỉ chạy ở trunk, agent được gõ lệnh thay người sau khi người duyệt, mức ask/warn, và vòng lặp không nghẽn. Viết decision record mới supersede mệnh đề hard-refuse-always của D16/D17 self-improve-loop, không sửa tại chỗ. Iron Law không nằm trong platform-foundations.md nên đây là sửa spec, không phải đổi luật khoá.",
    "footprint": ["docs/specs/runner.md", "docs/decisions/", "CHANGELOG.md"],
    "kind": "task",
    "risk": "standard"
  }
]
```

Phụ thuộc giữa các con: con 3 phụ thuộc con 2; con 4 phụ thuộc cả ba.
Con 1 và con 2 độc lập, chạy song song được.

**Ghi chú trung thực về cách phụ thuộc được gắn.** Khối JSON trên **không**
mang trường `deps` — thiếu sót thật của bản nháp, phát hiện ngay sau khi
`fgos plan --verdict decompose` tạo bốn con. Nếu để nguyên, cả bốn cùng
vào frontier và con 3 có thể chạy trước con 2, viết prose trỏ tới một
skill chưa tồn tại — đúng cái bug item này đang đi sửa. Đã vá bằng
`fgos edit tsk-1y6-3 --deps tsk-1y6-2` và
`fgos edit tsk-1y6-4 --deps tsk-1y6-1,tsk-1y6-2,tsk-1y6-3` ngay sau đó;
`fgos ready` xác nhận frontier giờ chỉ còn con 1 và con 2. Khối JSON giữ
nguyên như lúc thật sự được truyền vào engine, không sửa lại cho đẹp.

## Outstanding questions

None
