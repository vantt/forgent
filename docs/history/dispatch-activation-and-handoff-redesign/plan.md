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
| P4 (`footprint` bắt buộc) | **P1** | Cả hai sửa `src/runner/dispatch.mjs` + `test/runner/dispatch.test.mjs`. Chỗ đòi `footprint` chính là cửa `execute --work` — tách ra là chia đôi một hàm |
| P3 (token + cold-pickup) | **P2** | Cả hai sửa `fgos-coding-implement/SKILL.md` và chính file hợp đồng. Token và cold-pickup **là nội dung của hợp đồng**, không phải việc rời |

P5 giữ nguyên thành child thứ ba, độc lập hoàn toàn — không đụng file nào
của P1/P2. Ghi chú tier A cho nó nằm ở cuối file.

## Files likely touched

- **P1:** `src/runner/dispatch.mjs`, `test/runner/dispatch.test.mjs`
- **P2:** `.agents/skills/_shared/coding-worker-contract.md` (mới) +
  bản mirror `plugins/fgOS/skills/_shared/`,
  `.agents/skills/fgos-coding-implement/SKILL.md` + 2 bản mirror,
  `src/state/workflow-stage-graphs.mjs` (seam),
  `src/runner/dispatch.mjs` (`buildPrompt`'s `skillPath` → contract),
  `test/skills/fgos-mirror.test.mjs`
- **P3 (nguyên P5):** `src/setup/registrations.mjs`,
  `test/setup/checks.test.mjs`

P1 và P2 giao nhau đúng một file: `src/runner/dispatch.mjs`. P1 sửa nhánh
CLI/`executeExecutorCli`, P2 sửa `buildPrompt`'s `skillPath` — khác hàm,
nhưng **cùng file**, nên P2 phải chạy sau P1, không song song. P3 không
giao với cả hai, chạy song song được.

## Risk map

| Thành phần | Mức | Cái gì chứng minh |
|---|---|---|
| Cửa `execute --work` + refusal có kiểu | standard | `test/runner/dispatch.test.mjs` — case đã claim / chưa claim / thiếu `footprint` |
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
    "title": "Add execute --work <id> to dispatch.mjs: build the payload from the claimed item, and refuse to issue it when the item is unclaimed or carries no footprint",
    "verify": "node --test test/runner/dispatch.test.mjs",
    "action": "D2: mảnh đã chia phải giao được cho provider rẻ mà không cần model mạnh dựng gói prompt bằng tay -- thêm cửa --work cho executeExecutorCli để nó phân giải item rồi dựng payload qua buildPrompt đã có, đóng bất đối xứng với decide (đã có --work). Cửa này đồng thời là chỗ kiểm tính hợp lệ của lời gọi: từ chối có kiểu (không phải exception, không bao giờ lách) khi item chưa status doing, hoặc khi footprint rỗng -- footprintDiffHits miễn trừ footprint rỗng nên nếu không đòi ở đây thì kiểm tra ranh giới file im lặng vô hiệu. KHÔNG quyết định lại cơ chế dispatch (tsk-5tm-3 D5 cấm, Step A đã quyết) -- chỉ kiểm lời gọi hợp lệ.",
    "footprint": ["src/runner/dispatch.mjs", "test/runner/dispatch.test.mjs"],
    "kind": "feature",
    "risk": "standard"
  },
  {
    "title": "Split fgos-coding-implement into a driver half and a worker half, add the provider-neutral worker contract with fixed status tokens and cold-pickup refusal, and point the dispatch template at it through a per-domain registry seam",
    "verify": "npm test && test -f .agents/skills/_shared/coding-worker-contract.md && grep -qF 'cold-pickup' .agents/skills/_shared/coding-worker-contract.md && grep -qF '[BLOCKED]' .agents/skills/_shared/coding-worker-contract.md && ! grep -qE 'fgos (return|discover|plan) ' .agents/skills/_shared/coding-worker-contract.md",
    "action": "D3: tách fgos-coding-implement thành phần driver (claim/decide/dispatch/verify/return/Iron Law) và phần worker (làm trong ranh giới, chứng minh, báo token), để in-process và out-of-process thi hành CÙNG một hợp đồng -- phiên Claude khi không dispatch cũng theo đúng hợp đồng đó, y như agy. D4: cấu trúc tổng quát, nội dung của coding -- chỗ nối khai ở registry theo đúng khuôn opt-in per-domain của roleGraph (vắng mặt = domain đó không dispatch worker, phải là no-op cho 3 domain fixture), còn nội dung viết một bản cho coding, tên coding-specific theo tiền lệ fgos-coding-driving D12. Hợp đồng mang: nạp Execute-loop của skill được trỏ, chỉ là phần thực thi, ranh giới là footprint (file không được nêu tên là câu hỏi phạm vi cho orchestrator), cold-pickup refusal (prompt không đủ thì trả BLOCKED nêu đúng chỗ thiếu, không đoán), token trả về cố định, gate/quyết định thuộc người. Vế negative của verify khoá đúng mâu thuẫn V3: hợp đồng KHÔNG được bảo worker gọi verb ghi state.",
    "footprint": [".agents/skills/_shared/coding-worker-contract.md", "plugins/fgOS/skills/_shared/coding-worker-contract.md", ".agents/skills/fgos-coding-implement/SKILL.md", "plugins/fgOS/skills/fgos-coding-implement/SKILL.md", ".claude/skills/fgos-coding-implement/SKILL.md", "src/state/workflow-stage-graphs.mjs", "src/runner/dispatch.mjs", "test/skills/fgos-mirror.test.mjs"],
    "kind": "feature",
    "risk": "heavy",
    "deps": []
  },
  {
    "title": "Register the advise and execute capability slots as a fgos setup configDefault plus a doctor check, so the empty capabilities map gets filled through the sanctioned door instead of a hand edit",
    "verify": "npm test && node --test test/setup/checks.test.mjs test/setup/checks-setup-config.test.mjs",
    "action": "D2: phân vai theo trí tuệ cần hai slot tách bạch -- advise (giá trị đến từ bất đồng, không đổi state, một hỏi một đáp) và execute (giá trị đến từ tuân thủ, sửa file, phải verify) -- gộp chung một cơ chế là một phần lý do dispatch cồng kềnh. Cửa decide --for <purpose> đã xây đủ nhưng .fgos/config.json có capabilities rỗng hoàn toàn nên chưa ai ở. KHÔNG sửa .fgos/config.json bằng tay: ADR0020 strip .fgos/ khỏi mọi worktree nên không child nào chạm được, và AGENTS.md's Install/setup/doctor gate đã bắt buộc đúng cửa còn lại -- một config default phải register vào fgos setup's config-merge VÀ fgos doctor's check registry, không được đứng một mình undiscoverable by doctor. Cơ chế đã có sẵn: configDefault registration + assembleRegistryDefaults (src/setup/registrations.mjs:163), gọi bởi ensureSharedConfigDefaults và checkConfigNotStale.",
    "footprint": ["src/setup/registrations.mjs", "test/setup/checks.test.mjs"],
    "kind": "feature",
    "risk": "standard"
  }
]
```

**Ghi chú cho `fgos-coding-validating`:** child thứ hai phải chạy **sau**
child thứ nhất (cùng đụng `src/runner/dispatch.mjs`, khác hàm). `deps` để
rỗng vì id của child thứ nhất chưa tồn tại lúc viết plan này — cổng
materialize là nơi duy nhất tạo child, nên xin nối `deps` ngay tại đó.
Child thứ ba không giao file với hai child kia, chạy song song được.

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

## Outstanding questions

None
