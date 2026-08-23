# plan.md — tsk-2uf

Mode: high-risk

Đếm cờ theo Mode-gate của `fgos-routing` (direct-entry fallback — chưa ai
quyết lane cho item này): **5 cờ áp dụng** — data model (thêm field seam
vào registry), external systems (dispatch ra agy/codex/gemini), public
contracts (bề mặt CLI `execute`, hợp đồng worker, format template, field
registry), existing covered behavior (`test/runner/dispatch.test.mjs`,
`test/skills/fgos-mirror.test.mjs`, và `fgos-coding-implement` là skill
dùng hằng ngày), multi-domain (D4 thêm seam per-domain). Ngoài ra trúng
một **hard-gate flag** (external provider), nên `high-risk` là bắt buộc
bất kể số cờ.

Lane nhỏ hơn không trung thực ở đây: việc này sửa một skill mọi phiên đều
nạp, đổi một bề mặt CLI mà 6 skill khác trích dẫn, và thêm field vào
registry đóng băng — sai ở bất kỳ chỗ nào trong ba chỗ đó đều lan ra toàn
hệ, không giới hạn trong item này.

## Approach

Đường đã chốt ở `CONTEXT.md` (D1–D4) và diễn giải đầy đủ ở
`DISCUSSION.md#design`. Plan này chỉ quyết **hình dạng thi công**, không
mở lại quyết định nào.

**Thứ tự bắt buộc:** cửa `execute --work` đi trước. Không phải vì ưu tiên,
mà vì cả hợp đồng worker lẫn việc `footprint` có hiệu lực đều **không có
chỗ bám** nếu chưa có cửa đọc item — hợp đồng cần một payload dựng từ
item để mà trỏ vào, và chỗ đòi `footprint` nằm đúng trong cửa đó.

`fgos graph --json`: `tsk-2uf` là connected component riêng, mọi component
khác kích thước 1 và không dính khu vực này — `criticalPath`/`topUnblock`
không cho tín hiệu ordering nào ở đây. Ghi lại để việc bỏ qua là một quyết
định, không phải thiếu sót.

**`impact-analysis: degraded`** (`CONTEXT.md`): provider `gitnexus` báo
`present` nhưng index lệch HEAD suốt phiên. Theo khung ba mức của
`CLAUDE.md`, mọi proof point dựa vào blast-radius dưới đây phải bị đánh
dấu **yếu** — cụ thể: "6 skill trích dẫn `executor-dispatch-fallback.md`"
và "`fgos-coding-implement` được nạp bởi những đường nào" đều lấy từ `rg`
trực tiếp, không từ code-graph, và chưa được xác nhận bằng blast-radius.

### Hai chỗ gộp so với §7 của DISCUSSION.md, có lý do

`DISCUSSION.md#tasks` liệt kê 5 hạng mục. Plan này gộp còn **3**, vì hai
cặp có **footprint chồng nhau** — thứ `footprintOverlapAmong` tồn tại để
bắt, và thứ sẽ gây xung đột thật nếu chạy song song:

| §7 | Gộp vào | Vì sao |
|---|---|---|
| P4 (`footprint` bắt buộc) | **P1** | Chỗ đòi `footprint` chính là một nhánh refusal của `prepareDispatch` — tách ra là chia đôi một hàm |
| P3 (token + cold-pickup) | **P2** | Cả hai sửa `fgos-coding-implement/SKILL.md` và chính file hợp đồng. Token và cold-pickup **là nội dung của hợp đồng**, không phải việc rời |

P5 giữ nguyên thành child thứ ba, độc lập hoàn toàn — không đụng file nào
của P1/P2. Ghi chú tier A cho nó nằm ở cuối file.

## Files likely touched

- **P1 (đã đổi hình, D7):** gom `src/runner/dispatch.mjs` (2204 dòng) thành
  `dispatch/{config,resolve,mechanism,transport,prepare,cli}.mjs`, giữ
  `dispatch.mjs` làm **barrel re-export** (13 importer không đổi dòng nào),
  + `test/runner/dispatch.test.mjs`
- **P2:** `.agents/skills/_shared/coding-worker-contract.md` (mới) +
  bản mirror `plugins/fgOS/skills/_shared/`,
  `.agents/skills/fgos-coding-implement/SKILL.md` + 2 bản mirror,
  `src/state/workflow-stage-graphs.mjs` (seam),
  `src/runner/dispatch/prepare.mjs` (`buildPrompt`'s `skillPath` → contract;
  P1 chuyển `buildPrompt` về module này vì nó là assembly payload),
  `test/skills/fgos-mirror.test.mjs`
- **P3 (nguyên P5):** `src/setup/registrations.mjs`,
  `test/setup/checks.test.mjs`

P1 và P2 giao nhau đúng một file, giờ là `src/runner/dispatch/prepare.mjs`
(P1 tạo nó; P2 đổi đích của `skillPath` trong đó) — vẫn cùng file, nên
`deps` đã khoá P2 sau P1. P3 không giao với cả hai, chạy song song được.

**Đổi hình P1 (D7).** Bản đầu là "thêm cờ `--work` vào `executeExecutorCli`"
— tức thêm cửa thứ mười một vào một đống mười cửa rời rạc rồi gọi nó là
*additive*. Đo thật: `dispatch.mjs` 2204 dòng chứa **6 concern** tách bạch
được mà không có ranh giới nào (riêng config + 7 hàm `validate*Shape` đã là
794 dòng, 36% cả file). Đó mới là chỗ tùm lum — không phải dispatch phức
tạp, mà sáu mối quan tâm dùng chung một file nên cái nào cũng rò vào lý
luận của cái kia. Nguyên tắc người dùng đặt: hình dạng cuối phải là
**clear boundary, contract rõ, đổi và biến hình dễ, không chắp vá**; thấy
tùm lum thì gom lại.

`prepareDispatch(unit, opts) → {payload, transport, economics, refusal?}`
là khái niệm có tên ở giữa, **biết kind** (D5), refusal **có kiểu và không
ai lách** (beehive), tự ghi `executor.dispatch` (nên Step B.5 của tsk-3kl
bị supersede), và để sẵn slot `economics` cho `tsk-492`. Mọi cửa đi qua
nó: `execute --work`, `--task` sau này, `spawnWorker` (đường tự động), và
hook gọi cùng lõi kiểm — lưới với khuôn đọc chung một luật.

Barrel là điều kiện an toàn: 13 file import từ `runner/dispatch.mjs`, với
barrel thì **không file nào phải sửa**, nên việc gom chứng minh được là
behavior-neutral, và `test/runner/dispatch.test.mjs` (175K) là lưới.

## Risk map

| Thành phần | Mức | Cái gì chứng minh |
|---|---|---|
| Gom `dispatch.mjs` thành module + `prepareDispatch` + refusal có kiểu | **heavy** | `npm test` toàn bộ (13 importer đi qua barrel, `dispatch.test.mjs` 175K là lưới) + case đã claim / chưa claim / thiếu `footprint` |
| Tách driver/worker trên skill đang dùng hằng ngày | **heavy** | `npm test` toàn bộ + `fgos-mirror.test.mjs`; và một lần chạy dispatch THẬT end-to-end sau khi tách, không chỉ test |
| Seam per-domain trong registry đóng băng | standard | `fgos-mirror.test.mjs` + test registry hiện có; seam vắng mặt phải là no-op cho 3 domain fixture |
| `buildPrompt`'s `skillPath` đổi đích | standard | Đây là chỗ V3 (mâu thuẫn) được sửa — verify của P2 mang vế negative đúng chỗ này |
| Capability slot vào config qua `fgos setup` | standard | `test/setup/checks.test.mjs` + `checks-setup-config.test.mjs` |

Mục **heavy** cần proof point thật ở `fgos-coding-validating`: một lần
dispatch thật sau khi tách, chứng minh worker nạp đúng hợp đồng và trả
token, chứ không chỉ test xanh. Đây đúng ranh giới
`docs/how-to/write-verify-for-a-skill-prose-change.md` đã ghim: `verify`
không bao giờ chứng minh được prose chạy đúng lúc runtime — smoke test
thật và event log mới sở hữu phần đó.

## Child specs

```json
[
  {
    "title": "Gom dispatch.mjs thành module có ranh giới rõ, với prepareDispatch(unit, opts) là khái niệm có tên ở giữa; dispatch.mjs thành barrel",
    "verify": "npm test && test -f src/runner/dispatch/prepare.mjs && grep -q \"export function prepareDispatch\" src/runner/dispatch/prepare.mjs && test $(wc -l < src/runner/dispatch.mjs) -lt 200 && ! grep -q \"function validateExecutorShape\" src/runner/dispatch.mjs",
    "action": "D7 + D6: gom dispatch.mjs (2204 dòng, 6 concern lẫn một file) thành dispatch/{config,resolve,mechanism,transport,prepare,cli}.mjs, dispatch.mjs giữ làm barrel re-export nên 13 importer không đổi dòng nào. prepareDispatch(unit, opts) -> {payload, transport, economics, refusal?} là khái niệm có tên ở giữa: biết kind theo D5 (lifecycle-bearing vs ephemeral), refusal có kiểu không ai lách, kiểm claim-ownership và footprint rỗng tại đây, tự ghi executor.dispatch (supersede Step B.5 của tsk-3kl), để sẵn slot economics cho tsk-492. Mọi cửa đi qua nó: execute --work, --task sau này, spawnWorker, và hook gọi cùng lõi kiểm. KHÔNG quyết định lại cơ chế (tsk-5tm-3 D5), KHÔNG đổi hành vi -- gom và đặt tên, mọi named export giữ nguyên.",
    "footprint": [
      "src/runner/dispatch.mjs",
      "src/runner/dispatch/config.mjs",
      "src/runner/dispatch/resolve.mjs",
      "src/runner/dispatch/mechanism.mjs",
      "src/runner/dispatch/transport.mjs",
      "src/runner/dispatch/prepare.mjs",
      "src/runner/dispatch/cli.mjs",
      "test/runner/dispatch.test.mjs"
    ],
    "kind": "feature",
    "risk": "heavy"
  },
  {
    "title": "Split fgos-coding-implement into a driver half and a worker half, add the provider-neutral worker contract with fixed status tokens and cold-pickup refusal, and point the dispatch template at it through a per-domain registry seam",
    "verify": "npm test && test -f .agents/skills/_shared/coding-worker-contract.md && grep -qF 'cold-pickup' .agents/skills/_shared/coding-worker-contract.md && grep -qF '[BLOCKED]' .agents/skills/_shared/coding-worker-contract.md && ! grep -qE 'fgos (return|discover|plan) ' .agents/skills/_shared/coding-worker-contract.md",
    "action": "D3: tách fgos-coding-implement thành phần driver (claim/decide/dispatch/verify/return/Iron Law) và phần worker (làm trong ranh giới, chứng minh, báo token), để in-process và out-of-process thi hành CÙNG một hợp đồng -- phiên Claude khi không dispatch cũng theo đúng hợp đồng đó, y như agy. D4: cấu trúc tổng quát, nội dung của coding -- chỗ nối khai ở registry theo đúng khuôn opt-in per-domain của roleGraph (vắng mặt = domain đó không dispatch worker, phải là no-op cho 3 domain fixture), còn nội dung viết một bản cho coding, tên coding-specific theo tiền lệ fgos-coding-driving D12. Hợp đồng mang: nạp Execute-loop của skill được trỏ, chỉ là phần thực thi, ranh giới là footprint (file không được nêu tên là câu hỏi phạm vi cho orchestrator), cold-pickup refusal (prompt không đủ thì trả BLOCKED nêu đúng chỗ thiếu, không đoán), token trả về cố định, gate/quyết định thuộc người. Vế negative của verify khoá đúng mâu thuẫn V3: hợp đồng KHÔNG được bảo worker gọi verb ghi state. Ràng buộc cách viết (upstream pi, docs/distillery/sources/pi.md § integration-contract): token cố định là mẫu số chung thấp nhất cho executor chỉ có print-mode; viết hợp đồng sao cho KHÔNG cấm đường một kênh trả về có cấu trúc (pi's --mode json / --mode rpc phát cùng bộ AgentSessionEvent dưới dạng JSONL) khi provider có -- kênh trả về là thuộc tính của từng executor, không phải một hình dạng hardcode trong hợp đồng.",
    "footprint": [
      ".agents/skills/_shared/coding-worker-contract.md",
      "plugins/fgOS/skills/_shared/coding-worker-contract.md",
      ".agents/skills/fgos-coding-implement/SKILL.md",
      "plugins/fgOS/skills/fgos-coding-implement/SKILL.md",
      ".claude/skills/fgos-coding-implement/SKILL.md",
      "src/state/workflow-stage-graphs.mjs",
      "src/runner/dispatch/prepare.mjs",
      "test/skills/fgos-mirror.test.mjs"
    ],
    "kind": "feature",
    "risk": "heavy",
    "deps": [
      0
    ]
  },
  {
    "title": "Register the advise and execute capability slots as a fgos setup configDefault plus a doctor check, so the empty capabilities map gets filled through the sanctioned door instead of a hand edit",
    "verify": "npm test && node --test test/setup/checks.test.mjs test/setup/checks-setup-config.test.mjs",
    "action": "D2: phân vai theo trí tuệ cần hai slot tách bạch -- advise (giá trị đến từ bất đồng, không đổi state, một hỏi một đáp) và execute (giá trị đến từ tuân thủ, sửa file, phải verify) -- gộp chung một cơ chế là một phần lý do dispatch cồng kềnh. Cửa decide --for <purpose> đã xây đủ nhưng .fgos/config.json có capabilities rỗng hoàn toàn nên chưa ai ở. KHÔNG sửa .fgos/config.json bằng tay: ADR0020 strip .fgos/ khỏi mọi worktree nên không child nào chạm được, và AGENTS.md's Install/setup/doctor gate đã bắt buộc đúng cửa còn lại -- một config default phải register vào fgos setup's config-merge VÀ fgos doctor's check registry, không được đứng một mình undiscoverable by doctor. Cơ chế đã có sẵn: configDefault registration + assembleRegistryDefaults (src/setup/registrations.mjs:163), gọi bởi ensureSharedConfigDefaults và checkConfigNotStale.",
    "footprint": [
      "src/setup/registrations.mjs",
      "test/setup/checks.test.mjs"
    ],
    "kind": "feature",
    "risk": "standard"
  }
]
```

**Thứ tự đã khoá bằng máy:** child thứ hai mang `deps: [0]` — `deps` trong
child spec là **index-based**, không phải id-based
(`buildDecomposeChildrenVerdict` lọc `d < index`), nên nối được ngay lúc
viết, không phải chờ id thật. Bản nháp trước ghi nhầm là phải chờ, và để
`deps` rỗng kèm một ghi chú prose — cổng-người của engine đã bắt đúng chỗ
chồng lấn đó (`tsk-2uf-1 ↔ tsk-2uf-2` trùng `src/runner/dispatch.mjs`) và
người dùng chọn `sequence`. Child thứ ba không giao file với hai child
kia, chạy song song được.

## Ghi chú tier A — câu hỏi P5 đã tự đóng

Bản nháp đầu của plan này để P5 ngoài split và nêu ba hướng (a)/(b)/(c)
chờ người chọn, vì `.fgos/config.json` **có** trong git (`git ls-files`
xác nhận) nhưng **vắng mặt trong mọi worktree** — ADR0020 strip `.fgos/`
ngay sau `git worktree add` (kiểm trực tiếp trong worktree của chính item
này: `test -f .fgos/config.json` → ABSENT), và `.githooks/pre-commit` từ
chối commit stage bất kỳ xoá nào dưới `.fgos/` (tsk-56u).

`fgos-coding-validating`'s tier A ("có hành động nào trong tầm tay đóng
được khoảng trống không? nếu có: **làm**, rồi hỏi lại từ đầu — đừng hỏi
người") tìm ra repo **đã tự quyết** rồi, ở hai chỗ độc lập:

1. `AGENTS.md`'s Install/setup/doctor gate nói thẳng: *"Does this add a
   config default…? If yes, it must register into `fgos setup`'s
   config-merge and `fgos doctor`'s check registry
   (`src/setup/checks.mjs`) — not stand alone, undiscoverable by
   `doctor`."* Tức hướng (c) không phải một lựa chọn ngang hàng — nó là
   luật đã có sẵn.
2. Cơ chế thi hành luật đó tồn tại thật: `configDefault` registration +
   `assembleRegistryDefaults()` (`src/setup/registrations.mjs:163`), được
   gọi bởi `ensureSharedConfigDefaults` và `checkConfigNotStale`.

Nên P5 không phải "config change không có cửa" — nó là `src/` work bình
thường, làm được trong worktree; và hướng (a) sửa tay trên main checkout
đúng ra là **vi phạm** luật trên, không phải một lựa chọn hợp lệ. Không
còn gì để hỏi người ở đây.

## Ghi chú upstream `pi` — một đính chính, một ràng buộc cách viết

Nguồn: `docs/distillery/sources/pi.md` (chưng cất `e5dde9a`, 2026-08-18).
`pi` là harness terminal tối giản, **cố ý không có sub-agent** — nên nó
không dạy ta cách điều phối; nó dạy ta **một worker runtime tử tế trông
như thế nào**, đúng câu hỏi hợp đồng worker đang hỏi.

**Đính chính cho `DISCUSSION.md` §6.** Ở vòng 4 tôi viết beehive's
`PINNED_AGENT_TYPE` "không bê nguyên" vì nó gắn `tools:`/`model:` vào
frontmatter subagent native của Claude, còn executor `agy` của ta là
cli-spawn ra tiến trình ngoài. Tiền đề đúng, **kết luận sai**: `pi` cho
thấy một agent cli-spawn-shaped **vẫn nhận được allowlist năng lực qua
cờ CLI** — `pi --tools read,grep,find,ls -p "Review the code"` là một
worker read-only, ép bằng chính tiến trình, không bằng câu dặn
(`pi.md` § `built-in-tool-set`). Vậy nguyên tắc của beehive *"ranh giới
ép bằng CAPABILITY, không bằng câu dặn"* **có** với tới out-of-process —
chỉ là qua `invocations[].args`, không qua frontmatter. fgOS đã có sẵn
đúng cái xe đó.

Và nó phơi ra một chỗ hỏng trong chính config hiện tại: `agy` đang chạy
với `--dangerously-skip-permissions`. Ta đang làm **ngược** nguyên tắc
trên — trao toàn quyền cho worker rồi trông vào prose ("ranh giới là
`footprint`") để giữ nó trong khuôn.

**Không nhét vào child nào của plan này** (khác cơ chế hoàn toàn: config
executor args, không phải skill prose + seam registry; và không giao
footprint với cả ba child). Cũng **không trùng `tsk-49o`** — item đó là
sandbox mức OS (bubblewrap/firejail/sandbox-exec), tự khai là
*"defense-in-depth **on top of allowedTools**"*, tức nó **giả định** lớp
allowlist đã tồn tại. Lớp đó chính là thứ đang thiếu. Đi thành item
riêng, vì còn cần discovery thật (agy có bề mặt permission diễn đạt được
allowlist không — cờ `--dangerously-skip-permissions` hàm ý có, nhưng
chưa kiểm).

**Ràng buộc cách viết, đã gấp vào `action` của child 2.** `pi` có
`--mode json` / `--mode rpc` phát cùng một bộ `AgentSessionEvent` dạng
JSONL (`pi.md` § `integration-contract`). Token cố định của ta là mẫu số
chung thấp nhất cho executor chỉ có print-mode — đúng cho hôm nay, nhưng
hợp đồng không được viết theo kiểu **cấm đường** một kênh có cấu trúc về
sau. Kênh trả về là thuộc tính của từng executor.

Chi tiết đáng giữ cho lúc thật sự làm kênh JSONL: pi cảnh báo framing
phải **LF-only**, và Node's `readline` **không tuân thủ** vì nó tách cả
U+2028/U+2029 — hai ký tự hợp lệ bên trong chuỗi JSON. Đây là loại ghi
chú chỉ xuất hiện sau một lần tích hợp hỏng thật.

## Outstanding questions

None
