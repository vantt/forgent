# Design Proposal: agent-executor — capacity → backend dispatch

Status: **proposal, chưa build** — trả lời câu "thiết kế chi tiết" sau
`distill-consult-260731-1733-agent-executor-backend-dispatch-report.md`.
Không tự chuyển thành plan có phase; chờ anh quyết ở mục Unresolved cuối bài.

## 0. Khung sự thật phải tôn trọng trước khi thiết kế

Đây là ràng buộc **kiến trúc**, không phải chi tiết vặt — bỏ qua nó thiết kế
sẽ sai từ gốc:

forgent KHÔNG sở hữu 2 domain invocation như nhau:

1. **Headless process-spawn domain** — `fgos loop`/runner tự động spawn 1
   process CLI mới (`claude -p ...` hay tương lai `codex ...`) để chạy 1 work
   item, không người ngồi xem. forgent's OWN Node code sở hữu domain này
   100% — `src/runner/dispatch.mjs` gọi `child_process.spawn` trực tiếp.
2. **In-session tool-call domain** — phiên Claude Code ĐANG chạy (như phiên
   này) tự quyết gọi Agent/Task tool để spawn subagent, hoặc Bash để shell
   ra CLI ngoài. Cơ chế Agent/Task tool là CỦA HARNESS (Claude Code binary),
   forgent KHÔNG có API nào để "gọi hộ" nó từ Node — chỉ có thể (a) viết
   PROSE (skill instruction) bảo chính LLM đang chạy phát tool-call đúng
   cách, và (b) cài **hook** (PreToolUse) để kiểm/chặn tool-call đó SAU KHI
   LLM đã quyết định phát nó.

→ "1 điểm gọi thống nhất, tự dispatch xuống đúng cơ chế" **không thể** là 1
hàm JS bao trọn cả 2 domain — domain 1 là code thật, domain 2 là prose +
hook. Marketing-cockpit/bee/symphony làm được adapter thống nhất VÌ họ sở
hữu process cha (harness) của chính mình; forgent chỉ sở hữu domain 1, còn
domain 2 nó chỉ là 1 SKILL chạy BÊN TRONG harness của người khác. Thiết kế
dưới đây tách rõ 2 domain, dùng CHUNG 1 config schema và 1 khái niệm
"capacity" cho cả hai, nhưng cơ chế enforce khác nhau.

## 1. Đã có sẵn — đừng xây lại

`src/runner/dispatch.mjs` (domain 1) đã đi được 80% đường:

- **`EXECUTOR_ADAPTERS`** — registry named-interface, adapter name → hàm
  `(command,args,cwd,opts) => Promise<result>`. Hôm nay chỉ có `cli-spawn`;
  comment sẵn: "rpc/app-server adapter... deferred... only the interface's
  name is bought now" — đây CHÍNH LÀ chỗ cắm executor mới sau này (RPC vào
  app-server của 1 headless agent thay vì spawn CLI).
- **`resolveExecutorConfig`/`resolveExecutorCommand`** — per-tier executor
  override (`cfg.executors.<tier>` phủ `cfg.executor` toàn cục), mỗi block
  có thể khai `adapter` (default `cli-spawn`). Additive-optional: config cũ
  không có `executors` vẫn chạy y nguyên (P41 style, đã pin test).
- **`modelForTier`** — tier→model qua `cfg.models`.
- **`detectAssistantCli`/`ensureRunnerConfig`** — tự dò CLI trên PATH, viết
  default config, KHÔNG bịa argv cho CLI chưa verify (chỉ `claude` có
  template thật, `codex` được liệt kê nhưng cố ý chưa có template — "thà
  hỏi tay hơn đoán sai lần chạy đầu").
- **`buildPrompt`** đã resolve `(work.domain, 'executing') → skillName →
  skillPath` qua `workflow-stage-graphs.mjs`'s `skillForStage` — đây CHÍNH
  LÀ khái niệm "capacity identifier" đã tồn tại, chỉ chưa dùng nó để chọn
  BACKEND, mới dùng để nhúng đường dẫn skill vào prompt text.

Việc thiếu: (a) chọn executor theo **capacity/skill** (không chỉ theo tier),
(b) domain 2 (in-session) hoàn toàn chưa có config/enforcement nào.

## 2. Vay mượn gì từ consult, từ đâu

| Ý tưởng | Nguồn | Áp dụng vào đâu bên dưới |
|---|---|---|
| Đăng ký named-adapter, defer đến khi cần | forgent tự có (C9 v2) + `bee:herding-runtime-adapter-seam` | giữ nguyên `EXECUTOR_ADAPTERS`, không thêm rpc adapter vội |
| Explicit > auto > default precedence | `beads:multiagent-routing-and-slots` | thứ tự resolve capacity > tier > global |
| Tier/model tách khỏi capacity qua policy riêng | `marketing-cockpit:executor-registry-cognitive-tier` | giữ `models` tách khỏi `capacities`/`executors` — không fuse |
| NHƯNG: khai trong prompt không đủ, phải fuse vào TYPE | `beegog:pinned-tier-agent-types` (bài học đắt giá thật) | mục 4.3 — hook domain 2 đòi subagent_type khớp, không tin prompt tự khai |
| 1 hàm DUY NHẤT sinh mọi payload dispatch, tự audit | `beegog:dispatch-prepare-payload-builder` | `resolveExecutorCommand` generalize là nơi DUY NHẤT — không thêm đường tắt nào khác |
| Omitted model/tier silently inherits — phải chặn | `superpowers:model-selection-warning` + `beegog:model-guard-tier-transport` | mục 4.3 hook domain 2 deny khi thiếu marker |
| Adapter pluggable N-backend, idle-timeout vì im lặng ≠ chết | `symphony:agent-adapter-codex-jsonrpc` | ghi vào mục 6 (deferred) cho tương lai rpc adapter |
| Preflight/health-check trước dispatch, absent = clean skip | `repository-harness:tool-registry-capability` + `symphony:doctor-preflight` | mục 5 — capacity không khai executor = fallback sạch, không lỗi |
| Return envelope chuẩn hoá bất kể backend nào chạy dưới | `compound-engineering-plugin:return-to-caller-envelope` | mục 4.1 — `spawnWorker` đã trả `{status,stdout,stderr,tier,model,templateName,templateHash}` thống nhất; giữ nguyên, không đổi shape theo adapter |
| Action chỉ từ config nguồn, không từ nội dung runtime | `compound-engineering-plugin:untrusted-input-discipline` | mục 4 — capacity config đến từ file committed, KHÔNG bao giờ từ nội dung work item/prompt |
| Đừng nuốt orchestration logic của backend vào layer dispatch | `beads-rust:non-invasive-by-construction` | mục 6 — executor layer CHỈ chọn+gọi, không quản lý retry/orchestration (đó là việc của runner/hook khác) |

## 3. Khái niệm "capacity" — định danh dùng chung 2 domain

Không cần bịa khái niệm mới. `capacityId` = 1 trong 2 dạng đã tồn tại:

- **skill name** trực tiếp (`"distill"`, `"fgos-planning"`, `"research"`...)
  — namespace đã có (`.claude/skills/<name>/`).
- **`domain:stage`** cặp (`"coding:executing"`) khi capacity gắn với 1 bước
  FSM — resolve ra skill name qua `skillForStage` sẵn có, KHÔNG cần bảng
  ánh xạ mới.

Registry mới không cần sinh ID mới; chỉ cần 1 map lấy 1 trong 2 dạng trên
làm khoá.

## 4. Config schema — 1 file, 2 domain đọc chung

Mở rộng `.fgos-runner.json` hiện có (KHÔNG tạo file thứ hai — bài học
`superpowers:six-divergent-manifest-formats` nói thẳng: nhiều file config
cho cùng 1 khái niệm sẽ tự trôi). Thêm 1 block optional, additive, cùng
style P41 (`executors` từng được thêm y hệt cách này):

```jsonc
{
  "executor": { "command": "claude", "args": ["-p", "{prompt}", "--model", "{model}", "..."] },
  "executors": {
    "light": { "command": "claude", "args": ["..."] }
  },
  "models": { "light": "haiku", "standard": "sonnet", "heavy": "opus" },

  // MỚI — optional, absent = hành vi hôm nay giữ nguyên 100%
  "capacities": {
    "distill": {
      "invocation": "task",        // "task" (in-session Agent/Task tool) | "cli-spawn" (reuse EXECUTOR_ADAPTERS) | "mcp" (deferred)
      "target": "general-purpose", // subagent_type khi invocation=task; command name khi invocation=cli-spawn
      "tier": "standard"           // optional — resolve model qua "models" như cũ, tách riêng khỏi target
    },
    "fgos-planning": {
      "invocation": "cli-spawn",
      "adapter": "cli-spawn",      // trỏ thẳng EXECUTOR_ADAPTERS key đã có — domain 1 dùng lại y nguyên
      "tier": "heavy"
    }
  }
}
```

**Precedence lúc resolve** (giống hệt tinh thần `beads:multiagent-routing-and-slots`):

```
capacities.<capacityId>  >  executors.<tier>  >  executor   (global)
```

Capacity không khai gì → rơi xuống hành vi tier-based hôm nay, byte-for-byte
— đây là invariant bắt buộc test phải pin, y hệt cách `executors` block đã
được test pin khi thêm ở P41.

### 4.1 Domain 1 (headless, code thật) — generalize `resolveExecutorConfig`

```js
// dispatch.mjs — thêm capacityId là tham số optional thứ 3, KHÔNG đổi
// signature bắt buộc (backward compat cho mọi call site cũ chưa biết capacity)
function resolveExecutorConfig(cfg, tier, capacityId) {
  const byCapacity = capacityId && cfg.capacities && cfg.capacities[capacityId];
  if (byCapacity?.adapter || byCapacity?.command) return byCapacity;
  const perTier = cfg.executors && cfg.executors[tier];
  return perTier ?? cfg.executor;
}
```

`spawnWorker` truyền thêm `work.domain`+`stage` đã resolve sẵn thành
`capacityId` (dùng lại đúng `skillForStage` đang chạy trong `buildPrompt`,
KHÔNG tính 2 lần theo 2 cách khác nhau — 1 nơi tính, dùng lại).
`resolveExecutorCommand`/`spawnWorker` không đổi return shape — vẫn
`{command,args,adapter}` rồi `{status,stdout,stderr,tier,model,...}` như
hôm nay (compound-engineering's return-envelope discipline: caller không
cần biết capacity nào chọn ra executor nào).

Đây là điểm DUY NHẤT sinh dispatch cho domain 1 — không thêm hàm build
payload thứ hai ở đâu khác (đúng kỷ luật `dispatch-prepare-payload-builder`).

### 4.2 Domain 2 (in-session) — resolve + dispatch + ANNOUNCE, không enforcement

**Quyết định (2026-07-31): không cần hook, không cần marker-để-chặn.** Mục
tiêu thật của anh là *capability* (gọi được model/backend khác để tiết kiệm
+ đa dạng hoá góc nhìn quyết định), không phải *guard*. Không ai/không có
gì cần chặn tool-call sai — bỏ hẳn phần enforcement khỏi thiết kế.

Domain 2 vì vậy chỉ cần:

1. Skill đang cần dispatch 1 capacity tự đọc `cfg.capacities.<capacityId>`
   (đã biết chính xác nó đang gọi capacity nào — không cần nhét ID vào
   prompt cho ai khác đọc lại, vì không có ai đọc lại).
2. Rẽ nhánh theo `.invocation`:
   - `"task"` → phát Agent/Task tool call bình thường, `subagent_type`/model
     lấy từ `.target`/tier resolve.
   - `"cli"` → Bash gọi CLI ngoài, build argv bằng ĐÚNG cơ chế
     `resolveExecutorCommand`/`EXECUTOR_ADAPTERS` của `dispatch.mjs` (gọi
     qua 1 CLI helper nhỏ, vd `node src/runner/dispatch.mjs resolve
     <capacityId>` in ra argv) — không viết lại logic build-argv lần 2.
3. **Announce** — xem mục 8 bên dưới, đây là phần anh thật sự cần.

Tiền lệ đã CHẠY THẬT cho việc "gọi model khác để tiết kiệm/đa dạng hoá":
skill `/research` (`~/.claude/skills/research/SKILL.md`) đã có "Gemini
Toggle" — đọc `~/.claude/.ck.json`'s `skills.research.useGemini`, gọi
`gemini` CLI qua Bash thay WebSearch khi bật. agent-executor tổng quát hoá
đúng pattern này cho MỌI capacity, qua 1 config dùng chung thay vì logic
riêng từng skill.

### 4.3 Agent-type của forgent — sở hữu riêng, gốc platform-agnostic

**Quyết định (2026-07-31):** forgent tự sở hữu định nghĩa agent (không dùng
chung ClaudeKit global), nhưng gốc PHẢI platform-agnostic, không nằm trong
`.claude/` (tên đó tự nó nghĩa là "của riêng Claude Code" — mâu thuẫn với
mục tiêu agnostic). Theo đúng mẫu marketing-cockpit:

```
.fgos/agents/<name>.yaml   ← gốc DUY NHẤT: persona + decision-boundary +
                              model-tier preference. Không chữ "Claude"/
                              "Codex" nào trong nội dung.
.claude/agents/<name>.md   ← ADAPTER, SINH RA từ gốc (script copy/convert
                              nhỏ, không hand-maintain riêng) — đúng frontmatter
                              Claude Code cần.
.codex/agents/<name>.*     ← adapter khác, cùng gốc, khi có platform #2 thật.
```

Mức làm: **rẻ nhất trước** — 1 script nhỏ project `.fgos/agents/` →
`.claude/agents/`, KHÔNG build converter/writer engine đầy đủ kiểu
compound-engineering-plugin ngay (candidate `multi-target-converter-engine`
đã tự ghi "YAGNI tới khi cần belt thứ 3+" trong porting-log — vẫn đúng ở
đây, chỉ có 1 platform thật hôm nay).

## 5. Degrade sạch khi executor vắng mặt

Áp nguyên doctrine đã hội tụ 4 nguồn (`repository-harness`, `herdr`,
`symphony`, `beegog`'s known-answer probe): **capacity không khai backend =
skip sạch, KHÔNG lỗi** (rơi về tier/global như hôm nay). Executor CÓ khai
nhưng command không tồn tại trên PATH → lỗi rõ ràng tại resolve-time (domain
1: `RunnerConfigError` trước khi spawn, y hệt style hiện tại của
`resolveExecutorCommand`; domain 2: hook deny với message named-nguyên-nhân,
không phải exit code mù). Không thêm "known-answer probe" (health-check thật
sự chạy executor) ở v1 — YAGNI: chỉ 1 backend (`claude`) có template verify
hôm nay, probe hai backend trở lên mới có giá trị đo được.

## 6. Enforcement hook — ROADMAP, không phải "không bao giờ"

**Cập nhật 2026-07-31 (anh xác nhận forgent SẼ muốn multi-agent fan-out
thật):** hook/marker không bị loại bỏ vĩnh viễn — chỉ CHƯA TỚI LƯỢT, vì
điều kiện khiến bee bị (2 điều kiện, không phải 1) chưa hội đủ ở forgent
hôm nay:

1. **Nhiều call site** cùng dispatch capacity (bee: nhiều cell/skill tự
   quyết subagent_type). forgent hôm nay: domain 2 mới 1 điểm gọi (đang
   thiết kế), domain 1 chỉ 1 hàm (`spawnWorker`).
2. **Không ai xem từng lần dispatch** (bee: swarm chạy nhiều giờ không
   người). forgent hôm nay: domain 1 ĐÃ unattended (loop chạy không người
   xem) nhưng bù bằng validate-fail-loud tại resolve-time, không phải
   freeform prose — nên chưa lặp đúng lỗi bee. Domain 2 hôm nay người xem
   mỗi turn, NHƯNG đã có mầm #2 (fan-out subagent song song trong 1 turn,
   không ai duyệt từng cái) — đây là dấu hiệu sớm.

**Trigger point (ghi lại để không quên, không phải ngày lịch):** khi domain
2 lên multi-agent fan-out THẬT (nhiều capacity tự dispatch capacity khác,
không người duyệt từng bước) — đúng lúc candidate `intent-scoring-agent-dispatch`
(marketing-cockpit, đã trong porting-log, đang "chưa chín") chín tới — build
CÙNG LÚC: hook PreToolUse (mẫu `beegog:model-guard-tier-transport`) + marker
`[capacity: X]` để hook parse. Domain 1 nếu sau này có nhiều điểm dispatch
hơn 1 (không chỉ `spawnWorker`) cũng nên xét lại lúc đó, không đợi domain 2.

Không build 2 thứ này TRƯỚC khi điều kiện trigger thật xảy ra — phòng thủ
sớm cho mối đe doạ chưa hình thành là chi phí không đổi lấy được gì (YAGNI).

## Cố tình hoãn (deferred, ghi lại để không quên — có thể cần sau)

- **`rpc`/`app-server` adapter** trong `EXECUTOR_ADAPTERS` (symphony's
  `agent-adapter-codex-jsonrpc` là bản thiết kế tham khảo khi cần) — chờ
  tới khi có backend thật cần nói JSON-RPC thay vì argv CLI.
- **Multi-agent PUSH routing** (marketing-cockpit's `three-level-intent-routing`)
  — điều kiện áp dụng là "forgent lên multi-agent thật", chưa xảy ra (đã
  ghi rõ trong porting-log `intent-scoring-agent-dispatch`).
- **Converter/writer engine đầy đủ** cho agent-type projection (mục 4.3) —
  chỉ 1 script copy nhỏ trước, engine khi có platform #2 thật.

## 8. Hiển thị dispatch — capacity / provider / model

Đây là phần anh thật sự cần, cụ thể qua ví dụ anh đưa: `coding - agy -
flash 3.5`. Format 1 dòng announce mỗi lần 1 capacity được dispatch:

```
<capacityId> — <provider> — <model>
vd: coding — agy — flash-3.5
```

- **provider** = `executor.command` đã resolve (vd `"agy"`, `"claude"`,
  `"codex"`) — không cần field mới trừ khi command thực thi khác tên hiển
  thị muốn dùng (thì thêm `provider:` optional trong executor block, default
  = `command`).
- **model** = kết quả `modelForTier`/tier resolve như hôm nay.
- **capacityId** = đúng định danh mục 3 (skill name hoặc `domain:stage`).

Hiển thị ở 2 chỗ, tuỳ domain:

- **Domain 2 (in-session)**: dòng text NGAY TRƯỚC khi skill phát tool-call
  — vì tool-call bản thân không hiện cho anh thấy, chỉ text hiện. Đây khớp
  đúng thói quen "nói 1 câu trước khi làm" đã áp dụng suốt phiên này.
- **Domain 1 (headless)**: `spawnWorker` thêm `capacityId`+`command`(provider)
  vào object trả về hiện có (`{status,stdout,stderr,tier,model,...}` →
  thêm `capacityId,provider`), runner loop in dòng này ra log/stderr khi
  dispatch — không đổi shape cho consumer cũ (field mới, không xoá field
  cũ).

**Audit có nên ghi log không?** Đề xuất: có — append 1 dòng vào
`.fgos/events.jsonl` (event-log một-cửa-ghi đã có sẵn, không mở file audit
riêng — đúng khuyến nghị deep-dive `tool-registry.md`). Lợi ích: sau này có
thể làm `fgos capacity gain` kiểu `rtk gain --history` — thấy capacity nào
gọi backend/model nào bao nhiêu lần, ước lượng tiết kiệm. Chưa build lệnh
đó bây giờ (YAGNI) — chỉ ghi log là đủ, phân tích tính sau khi có dữ liệu.

## 7. Việc build ĐƯỢC ngay (nếu anh chốt hướng)

Chỉ domain 1, phần generalize `resolveExecutorConfig`/`resolveExecutorCommand`
nhận thêm `capacityId` + `cfg.capacities` map — additive, backward-compat
100% (test cũ không đổi), nhỏ, đúng khuôn P41 đã có tiền lệ trong chính
file này. Đây là phần DUY NHẤT không cần quyết định gì thêm để bắt tay làm.

## Coverage — map ngược về porting-log đã có

| porting-log candidate | Áp dụng ở đâu trong thiết kế này |
|---|---|
| `dispatch-payload-as-authority` (R3 E2 F2) | mục 4.1 — 1 hàm resolve DUY NHẤT, không thêm đường tắt |
| `cognitive-tier-model-decoupling` (R2 E2 F2) | mục 4 — `models` tách khỏi `capacities`/`executors` |
| `agent-agnostic-adapter-projection` (R3 E2 F3) | mục 1 — `EXECUTOR_ADAPTERS` đã LÀ bản named-interface này, không port thêm gì mới |
| `tool-registry-capability` (R3 E2 F2) | mục 5 — degrade doctrine present/missing/unknown |
| `multi-target-converter-engine` (R3 E2 F3) | không áp — đó là build-time projection sang N platform, khác domain (runtime dispatch) |
| `intent-scoring-agent-dispatch` (R2 E1 F2) | mục 6 — deferred, điều kiện chưa chín |

## Đã chốt (2026-07-31)

1. Agent-type: forgent tự sở hữu, gốc platform-agnostic ở `.fgos/agents/`,
   `.claude/agents/` là bản chiếu sinh ra, không hand-maintain riêng — mục 4.3.
2. Domain 2: KHÔNG phải phòng thủ — là capability thật (tiết kiệm + đa dạng
   hoá model cho quyết định), build cùng đợt, không hoãn — mục 4.2.
3. Marker/hook enforcement: bỏ hẳn, không phải nhu cầu — mục 6.
4. Domain 1 (generalize `resolveExecutorConfig`): làm ngay, work item riêng.

## Còn mở — cần anh xác nhận

1. Format announce mục 8 (`capacityId — provider — model`) đúng ý chưa, hay
   muốn thêm/bớt trường (vd thêm lý do chọn: cost/diversity)?
2. Ghi audit vào `.fgos/events.jsonl` — đồng ý tái dùng event-log có sẵn,
   hay muốn 1 file log riêng cho capacity dispatch?
3. `.fgos/agents/<name>.yaml` — có muốn tôi khảo trước 1-2 field mẫu cụ thể
   (persona/model-tier/tool-scope) trước khi viết work item, hay để lúc
   build tự quyết theo mẫu marketing-cockpit `agent.schema.yaml`?
4. Sẵn sàng để tôi soạn work item (fgOS submit) cho phần domain 1 + mục 8
   (announce, cả 2 domain) làm 1 đợt, hay tách riêng 2 work item?
