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

## 0.5. Mục tiêu tối thượng + 4 thuộc tính bắt buộc mỗi hop (bổ sung 2026-08-01)

**Mục tiêu tối thượng của agent-executor** (anh xác nhận 2026-08-01): dùng
đúng agent-type/model để đạt **chất lượng phù hợp với giá RẺ NHẤT** — mọi
quyết định thiết kế khác (backend nào, tool nào, hiện thị ra sao) là PHƯƠNG
TIỆN phục vụ mục tiêu này, không phải mục tiêu riêng lẻ. Đây là lý do gốc
việc `cognitive-tier-model-decoupling` (candidate porting-log, mục 2) và
"model rẻ hơn cho việc rẻ hơn" (mục 4.2) tồn tại — không phải tiện ích phụ,
mà LÀ lý do agent-executor được xây.

**"Trơn tru"** (anh định nghĩa 2026-08-01) = 4 thuộc tính bắt buộc, kiểm ở
MỖI HOP dispatch (không chỉ hop đầu):

1. **Thông suốt** — không dead-end giữa chuỗi: tại mọi hop, luôn có đường
   đi hợp lệ tới capacity cần gọi (hoặc degrade sạch có báo, mục 5) — không
   bao giờ kẹt giữa chừng không biết làm sao tiếp.
2. **Đầy đủ tool** — process đang chạy ở hop đó PHẢI có đủ quyền/tool để
   làm xong việc của nó (không thiếu tới mức phải dừng giữa chừng).
3. **An toàn** — bù trừ trực tiếp cho #2: đủ nhưng KHÔNG THỪA — least
   privilege đúng nghĩa cả 2 chiều (mục 9: `allowedTools` scope đúng, không
   cấp dư như Cách A của mục 9 từng cảnh báo).
4. **Quan sát được** — announce/audit (mục 8) phải sống sót qua MỌI hop
   của 1 chuỗi đa-process, không chỉ hop đầu tiên forgent's runner spawn.
   Đây là chỗ dễ vỡ nhất: chuỗi càng nhiều hop, càng nhiều backend khác
   họ, càng dễ trở thành hộp đen đúng lúc quan sát cần nhất.

### Trục mới: process hiện tại đứng ở đâu (đánh giá LẠI mỗi hop, không tĩnh)

Mục 0 chia domain 1/domain 2 theo **ai khởi xướng đầu chuỗi** — đúng nhưng
CHƯA đủ cho đệ quy: 1 capacity đang chạy TRONG 1 process nào đó, tự nó lại
cần gọi capacity khác, phải hỏi LẠI câu hỏi domain tại CHÍNH HOP ĐÓ, dựa
trên process hiện tại, không phải dựa trên gốc chuỗi. Ba dạng process khả
dĩ, mỗi dạng có "năng lực điều phối native" khác nhau:

- **Agent-terminal tương tác** (domain 2 gốc) — Task/Agent/AgentTeam sẵn,
  người xem.
- **`claude -p` headless** (dù forgent's runner spawn, hay 1 capacity khác
  đệ quy spawn ra) — KHÔNG người xem, NHƯNG VẪN cùng 1 Claude Code engine
  → Task/Agent tool **vẫn dùng native được y hệt domain 2** nếu
  `allowedTools` cho phép (bee's cell chạy trong `claude -p` vẫn tự
  fan-out subagent là bằng chứng). Đây là ĐIỂM QUAN TRỌNG: không phải cứ
  headless là phải shell-out — chỉ shell-out khi CROSS họ backend.
- **Process khác họ Claude** (codex app-server, agy, hay chính forgent's
  Node code không LLM nào trong vòng lặp) — KHÔNG có Task/Agent tool, PHẢI
  spawn process mới hoặc nói qua giao thức riêng (symphony's
  `agent-adapter-codex-jsonrpc`, mục 6 — vẫn deferred, chỉ ghi nhận đây là
  ĐÚNG chỗ nó cắm vào khi cần).

**Nguyên tắc chọn (phục vụ "trơn tru" #1+#2, và mục tiêu tối thượng —
rẻ/nhẹ nhất mà vẫn đủ)**: ở mỗi hop, ƯU TIÊN Ở LẠI NATIVE trong process
hiện tại (dùng Task tool sẵn có, không tốn process mới, giữ nguyên
context) — CHỈ cross sang process khác khi capacity kế tiếp khai backend
khác họ trong `cfg.capacities.<id>` (mục 4). Mỗi lần cross là 1 chi phí
thật (process mới, mất context, round-trip nặng hơn) — đây CHÍNH LÀ nhánh
"rẻ nhất mà vẫn đủ chất lượng" của mục tiêu tối thượng, áp ở tầng cơ chế
(không native thì đắt hơn, không phải chỉ tier/model mới đắt hơn).

### Khi nào THẬT SỰ cần dừng hỏi người (không phải "tự thấy chưa chắc")

Anh chốt (2026-08-01): cơ chế hỏi ĐÃ CÓ (`awaiting-human` park, `fgos
ask`/`fgos answer` — dùng suốt phiên này) — cái thiếu KHÔNG PHẢI cách hỏi,
mà là **ngưỡng xác định lúc nào ĐÁNG hỏi**, tránh 2 lỗi đối xứng: hỏi lắt
nhắt việc tầm thường, VÀ tự quyết liều lĩnh việc lẽ ra phải hỏi.

forgent **đã locked đúng khung này rồi**, chỗ khác (`docs/history/gate-bypass/CONTEXT.md`,
tsk-6bx D1-D5) — không bịa mới, PORT nguyên hình dạng quyết định đó sang
agent-executor:

- **D2 (đã locked) — sửa lại cách hiểu cho đúng (2026-08-01):** "cơ học"
  KHÔNG có nghĩa "không ai phán xét" — phán xét vẫn có, chỉ **dời sang lúc
  khác, người khác**: người quyết 1 LẦN lúc author config, agent lúc chạy
  chỉ TRA LẠI, không tự phán lại. Nguy hiểm thật của "tự tin lúc runtime"
  không phải vì tự tin hay sai — mà vì **agent đang tự chấm bài chính
  mình** (self-grading) đúng lúc input mập mờ/độc hại có thể đánh lừa nó
  tự tin sai chỗ (bee's `gate_bypass` tự nói nguyên văn: "untrusted item
  text could talk a session into faking confidence"). Áp cho
  agent-executor: capacity CÓ entry trong `cfg.capacities.<id>` (mục 4) →
  chạy theo config, KHÔNG hỏi — vì phán xét đã xảy ra RỒI, lúc người viết
  entry đó. Capacity KHÔNG có entry → rơi về default tier/global hôm nay
  (mục 5) → CŨNG không hỏi — vì đó là hành vi đã được chấp nhận an toàn
  TỪ TRƯỚC (chính hành vi hôm nay), không phải 1 phán xét mới. Native-vs-
  cross-process (mục 0.5 trên) tự nó KHÔNG BAO GIỜ là lý do để hỏi — nó
  luôn tra được từ config có/không, đúng nguyên tắc D2.
- **D4-tương-đương (sàn bất di bất dịch, nối mục 9):** CHỈ 1 trường hợp
  THẬT SỰ đáng hỏi trong agent-executor — khi resolve ra 1 capacity đòi
  **cấp tool-scope/quyền CAO HƠN baseline an toàn hôm nay**
  (`Bash(git add:*),Bash(git commit:*)`), ví dụ `Write` cho 1 process
  unattended (đúng rủi ro Cách A, mục 9). Đây là sàn không thoả hiệp —
  hỏi 1 LẦN lúc AUTHOR config (người duyệt `allowedTools` mới trước khi
  commit vào `.fgos-runner.json`), không phải hỏi runtime mỗi lần dispatch.
  Sau khi người đã duyệt 1 lần, lần dispatch sau CƠ HỌC theo config (D2),
  không hỏi lại — đúng tinh thần "an toàn + không lắt nhắt" cùng lúc.
- **D3-tương-đương (nối mục 8):** kể cả khi KHÔNG hỏi (chạy cơ học theo
  config hoặc fallback), vẫn phải HIỆN RA (announce mục 8) — không bao
  giờ skip trong im lặng.

Kết quả: câu hỏi mở ban đầu ("process tự biết nó đứng ở đâu để CHỌN native
hay cross") thu hẹp lại đúng phạm vi — đó KHÔNG PHẢI 1 quyết định cần hỏi
người (luôn suy ra cơ học từ config có/không), CHỈ CÒN 1 việc thật sự cần
người: duyệt tool-scope mới TRƯỚC KHI nó vào config, 1 lần, không phải mỗi
lần chạy. Vẫn còn 1 câu hỏi kỹ thuật hẹp hơn nhiều, KHÔNG PHẢI triết học
nữa: implementation cụ thể để 1 process (đặc biệt headless) đọc được
`cfg.capacities`/biết mình đang chạy trong process nào — đây là chi tiết
code, không phải quyết định thiết kế còn treo.

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

- **skill name** trực tiếp (`"distill"`, `"fgos-coding-planning"`, `"research"`...)
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

### 4.0 Hợp nhất từ vựng với `fgos tool` (bổ sung 2026-08-01, anh xác nhận)

Anh chỉ ra đúng: `capacities` (tầng dispatch) và `fgos tool` registry
(`src/state/tool-registry.mjs`, tsk-1dj, **đã build** — tầng discovery)
đều là cùng 1 khái niệm "capacity", chỉ khác tầng. Verify code thật, phát
hiện 1 trùng lặp cụ thể: `tool-registry.mjs`'s `commandExistsOnPath()` và
`dispatch.mjs`'s `detectAssistantCli()` là **CÙNG 1 logic quét PATH, viết 2
lần độc lập**. Không merge 2 schema làm 1 (tool-registry cố ý hẹp — chỉ
presence-detect, không có `{prompt}`/`{model}` template, không nên gánh
thêm việc dispatch), nhưng THỐNG NHẤT từ vựng và khử trùng lặp:

- Field `invocation` đổi tên thành **`kind`**, giá trị dùng LẠI
  `tool-registry.mjs`'s `KINDS = ['cli', 'binary', 'mcp', 'skill', 'http']`
  nguyên vẹn, cộng thêm 1 giá trị mới **`task`** (in-session Task/Agent
  tool dispatch — thứ duy nhất `fgos tool` không cần biết, vì đây không
  phải câu hỏi "có mặt trên máy không", Task tool luôn sẵn trong phiên
  tương tác).
- `commandExistsOnPath()`/`detectAssistantCli()` gộp thành 1 helper dùng
  chung (đặt ở đâu là chi tiết implementation, không phải quyết định thiết
  kế — có thể `tool-registry.mjs` export, `dispatch.mjs` import lại).
- Với `kind: "cli"`, `resolveExecutorConfig` (mục 4.1) NÊN hỏi
  `fgos tool query --capability <capacityId>` để biết present/missing
  thay vì tự probe lại — tái dùng máy discovery đã có, không xây máy thứ 2.
  Đây là việc CẦN đăng ký capacity đó vào `fgos tool` trước (`fgos tool
  register --kind cli ...`) — tự nhiên nối 2 tầng lại mà không cần đổi
  schema của tool-registry.

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
      "kind": "task",               // dùng chung KINDS của fgos tool + "task" mới (2026-08-01)
      "target": "general-purpose",  // subagent_type khi kind=task; command name khi kind=cli
      "tier": "standard"            // optional — resolve model qua "models" như cũ, tách riêng khỏi target
    },
    "fgos-coding-planning": {
      "kind": "cli",
      "adapter": "cli-spawn",       // trỏ thẳng EXECUTOR_ADAPTERS key đã có — domain 1 dùng lại y nguyên
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
2. Rẽ nhánh theo `.kind` (mục 4.0):
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

## 9. Tool-scope/permission — trục thứ 3 (bổ sung 2026-08-01)

Nguồn: `plans/reports/research-260801-1001-judge-scout-result-not-persisted-reused-report.md`
(đã tự verify lại code, không chỉ tin report). Phát hiện: `.fgos-runner.json`
hôm nay đã có `executors.judge` — nhưng đọc comment thật trong
`judge-executor.mjs` (`spawnAttempt`):

> "tier: 'judge' reuses the existing generic cfg.executors string-keyed
> lookup... as a **synthetic role key** — a repo can grant judge calls
> their own executors.judge block (e.g. Bash(rg:*)) without touching the
> worker's own tier blocks."

Nói thẳng: `judge` không phải cost-tier (không nằm trong `models.{light,
standard,heavy}`) — nó đang MƯỢN field `tier`/`executors` để chở 1 thứ khác
hẳn: **allowedTools/permission grant riêng cho 1 loại lời gọi**. Đây chính
là bằng chứng SỐNG rằng thiết kế 2 trục (backend, model) ở mục 4 CHƯA ĐỦ —
thiếu hẳn trục thứ 3: **tool-scope/permission PER CAPACITY**, tách khỏi cả
model-tier lẫn backend-choice.

Sửa schema mục 4: `capacities.<id>` nhận thêm field optional `allowedTools`
(và về sau `permissionMode` nếu cần):

```jsonc
"capacities": {
  "judgeDiscovery": {
    "invocation": "cli-spawn",
    "tier": "judge",                 // model-tier như hôm nay, KHÔNG đổi
    "allowedTools": ["Bash(rg:*)"]   // MỚI — tool-scope, tách khỏi tier
  }
}
```

`resolveExecutorConfig` (mục 4.1) khi build `args` cho block resolve từ
capacity, nối `allowedTools` (nếu có) vào đúng vị trí `--allowedTools` của
executor — thay vì tiếp tục đè lên `executors.judge` như "synthetic role
key" (hack tsk-62d TỰ đặt tên đúng vậy, dự tính rõ ràng chỉ để tạm). tsk-62v
là chỗ ĐÚNG để dọn việc này — vì đây chính là công việc tsk-62v đang làm
(tổng quát hoá resolve theo capacity), không phải việc mới ngoài scope.

### Vì sao đây là rủi ro thật, không phải lý thuyết

`judgeDiscovery`/`judgeDecompose` chạy **domain 1 hoàn toàn** — nested
`claude -p` qua `spawnSync`, KHÔNG người xem giữa chừng, đúng 2 điều kiện
mục 6 từng nói "chưa hội đủ nên chưa cần hook" (nhiều call site + không ai
xem). judge KHÔNG mới có 2 điều kiện đó — nó ĐÃ unattended từ tsk-62d. May
mắn là tsk-62d tự khoá scope chặt (chỉ `Bash(rg:*)`, tự note *"nếu rg không
đủ, đó là item follow-up riêng, ngoài scope"*) — đúng bản năng
`bee:read-only-agent-type-for-analysts` (safeguard = TOOL SET, không phải
lời dặn trong prompt) dù tsk-62d không trích dẫn nguồn đó.

**Cách A (model tự ghi file, cấp thêm `Write`) lặp lại NGUYÊN VĂN lỗi bee
từng trả giá**: cấp `Write` cho 1 process tự động không người giám sát,
tin vào PROMPT ("chỉ ghi vào scout-notes.md") thay vì CAPABILITY giới hạn
đường ghi. Câu hỏi #3 của report gốc ("Write có path-scope được không, hay
chỉ all-or-nothing") CHƯA verify được — và đó chính là điểm bee từng bị:
tưởng prompt đủ, hoá ra tool full quyền vẫn ghi được chỗ khác.

**Cách B (parent parse transcript qua `--output-format stream-json`,
KHÔNG cấp Write cho judge)** né được toàn bộ rủi ro trên — judge vẫn
read-only tuyệt đối, an toàn hơn đúng theo nguyên tắc đã học. Phức tạp hơn
(phải tự parse transcript), nhưng KHÔNG mở lỗ quyền mới.

**Đề xuất: Cách B**, trừ khi Q3 (path-scope Write) verify được là AN TOÀN
THẬT (không chỉ "CLI chấp nhận cú pháp" mà "CLI THỰC SỰ chặn ghi ngoài
path đó") — chưa verify thì mặc định chọn hướng không cần tin tưởng.

### Việc này đổi gì ở phần "Đã chốt"/"Còn mở" bên dưới

Không đổi domain-1/domain-2 gì đã chốt — chỉ CHỨNG MINH bằng ca thật rằng
trục tool-scope phải vào `capacities` schema của tsk-62v, và cho thấy rủi ro
cấp quyền cho unattended process là chuyện ĐANG XẢY RA (judge), không phải
giả định tương lai — khác với domain-2 hook (mục 6) vẫn đang đợi điều kiện
trigger multi-agent thật.

## 9.1 Sandbox — lớp phòng thủ bổ sung cho tool-scope (bổ sung 2026-08-01)

Anh nêu: sandbox có thể hỗ trợ đúng bài toán tool-scope security ở mục 9.
Đúng — sandbox biến `allowedTools` từ **ràng buộc mềm** (CLI tự khai đã
tuân thủ, chưa verify được có enforce thật — đúng Q3 bỏ ngỏ ở mục 9) thành
**ràng buộc cứng** (OS/kernel chặn vật lý, không phụ thuộc LLM bên trong có
"nghe lời" hay không).

Verify code thật (`judge-executor.mjs`): `spawnAttempt` gọi
`spawnSync(command, args, {shell: false, ...})` — **Node code trần, KHÔNG
qua Bash tool của Claude Code**. Điều này tách sandbox thành 2 tầng, chỉ 1
tầng forgent kiểm soát được:

- **Tầng trong** (không kiểm soát được): nếu nested `claude -p` tự gọi
  `Bash(rg:*)` bên trong nó, có thể thừa hưởng sandbox mode mặc định của
  chính Claude Code (chính phiên tương tác đang chạy design này CÓ tham số
  `dangerouslyDisableSandbox` trên Bash tool — ngụ ý mặc định LÀ có
  sandbox, tắt mới là ngoại lệ "dangerous"). Đây là suy luận hợp lý,
  **CHƯA verify được** áp dụng y hệt cho `-p` headless mode hay không —
  thuộc nội bộ Claude Code binary, forgent không kiểm soát, không nên
  thiết kế dựa hẳn vào giả định này.
- **Tầng ngoài** (forgent sở hữu 100%): chỗ `dispatch.mjs`/`judge-executor.mjs`
  tự spawn CẢ process — hôm nay **chắc chắn KHÔNG có sandbox nào** (raw
  `spawn`, không cwd giới hạn, không namespace/jail gì cả). Đây là chỗ
  đáng thêm, vì forgent tự quyết được, không phải hy vọng vào hành vi nội
  bộ của binary người khác.

**Đề xuất cắm vào đúng chỗ đã có sẵn**: `EXECUTOR_ADAPTERS` (mục 1) đã là
registry named-adapter, hôm nay chỉ có `cli-spawn`, đã chừa sẵn chỗ cho
adapter thứ 2 ("rpc... deferred... only the interface's name is bought
now"). Thêm 1 adapter MỚI cùng hàng — `sandboxed-cli-spawn` — wrap
`command`/`args` qua 1 sandbox OS-level (vd Linux `bubblewrap`/
`firejail`/seccomp, macOS `sandbox-exec`) trước khi spawn, giới hạn
filesystem writable-path (vd CHỈ `docs/history/<docsRef>/` ghi được, phần
còn lại read-only hoặc không thấy). Capacity chọn adapter này qua
`capacities.<id>.adapter: "sandboxed-cli-spawn"` — không cần field mới,
KHÔNG đổi schema, chỉ thêm 1 giá trị hợp lệ vào registry đã có.

**Không đảo ngược Cách B đã chốt** (mục 9, "Đã chốt" #8) — chưa có bằng
chứng THẬT (sandbox đã cài đặt, đã verify chặn ghi ngoài path) đủ mạnh để
lật 1 quyết định đã verify (theo nguyên tắc: chỉ lật khi có bằng chứng
mới, không phải lo ngại trừu tượng). Nhưng sandbox **CỘNG THÊM giá trị
ngay cả dưới Cách B**: `Bash(rg:*)` read-only hôm nay VẪN đáng sandbox
(giới hạn `rg` chỉ đọc trong phạm vi repo, không leo ra ngoài) — phòng
thủ nhiều lớp, không phải thay thế Cách B.

**Việc CHƯA làm** (deferred, không phải build ngay): `sandboxed-cli-spawn`
là 1 work item RIÊNG, sau khi `tsk-62v`'s `EXECUTOR_ADAPTERS`-qua-capacity
đã chạy — không mở rộng scope `tsk-g18` (Cách B) hay `tsk-62v` (generalize
resolve) ngay bây giờ. Việc đầu tiên cần làm THẬT trước khi build là
**verify** (không phải giả định): sandbox OS-level nào khả dụng/đáng tin
trên máy chạy forgent thật (Linux? macOS? cả 2?), overhead khởi động có
chấp nhận được cho 1 lời gọi judge ngắn hạn không.

## Đã chốt

1. Agent-type: forgent tự sở hữu, gốc platform-agnostic ở `.fgos/agents/`,
   `.claude/agents/` là bản chiếu sinh ra, không hand-maintain riêng — mục 4.3.
2. Domain 2: KHÔNG phải phòng thủ — là capability thật (tiết kiệm + đa dạng
   hoá model cho quyết định), build cùng đợt, không hoãn — mục 4.2.
3. Marker/hook enforcement: bỏ hẳn, không phải nhu cầu — mục 6.
4. Domain 1 (generalize `resolveExecutorConfig`): làm ngay, work item riêng
   (tsk-62v, đã bao gồm luôn announce mục 8 — không tách 2 item).
5. Format announce mục 8: `capacityId — provider — model`, đúng ví dụ anh
   cho ban đầu — không thêm trường, không cần hỏi lại (anh đã tự chốt lúc
   đưa ví dụ).
6. Audit dispatch: tái dùng `.fgos/events.jsonl` có sẵn, không mở file
   riêng — đúng doctrine đã tự tìm thấy trong deep-dive `tool-registry.md`
   của chính distillery này ("đừng mở audit file riêng khi one-door-write
   log đã có") — không phải chọn tuỳ ý, có căn cứ trong repo.
7. `.fgos/agents/<name>.yaml` field cụ thể: để build tự quyết theo mẫu
   marketing-cockpit `agent.schema.yaml` — đã ghi rõ vậy trong scope
   tsk-slq lúc submit, không phải câu hỏi còn treo.
8. Mục 9 — chọn **Cách B** (parent parse transcript, judge giữ read-only
   tuyệt đối), không phải Cách A. Lý do quyết được mà không cần hỏi: B là
   lựa chọn AN TOÀN HƠN + DỄ ĐẢO NGƯỢC HƠN — thêm Write sau (nếu B tỏ ra
   không đủ) rẻ hơn hẳn việc gỡ Write ra sau khi skill đã lỡ phụ thuộc vào
   nó. Bias đúng hướng khi chưa chắc: chọn nhánh rẻ-để-sửa-sau, không phải
   nhánh rẻ-để-làm-trước.
9. Mục 9 = work item riêng (`depends: [tsk-62v]`, cùng cụm tsk-64p) — không
   gộp vào tsk-62v. Lý do: tsk-62v scope gốc là announce/audit theo
   capacity, không phải permission/tool-scope; gộp thêm phình 1 item ra 2
   concern khác hẳn nhau, khó review/khó rollback riêng lẻ.
10. Ngưỡng ép duyệt tool-scope escalation (mục 0.5's D4-tương-đương):
    KHÔNG thêm lint/CI riêng — `.fgos-runner.json` đã committed, review Git
    thường đã là "duyệt 1 lần". Thêm lint là phòng thủ cho rủi ro chưa
    từng xảy ra (YAGNI, cùng lý do domain-2 hook hoãn ở mục 6).

Không còn câu hỏi thiết kế nào cần anh quyết ở tài liệu này — mọi điểm trên
đều có tiền lệ/bằng chứng đủ để tự quyết (đúng nguyên tắc D2 vừa sửa: phán
xét đã có, không phải "để trống rồi hỏi lại"). Việc còn lại là build, theo
đúng thứ tự phụ thuộc đã có trong cụm tsk-64p.

**Ngoại lệ — mục 9.1 (sandbox) là mục MỞ THẬT, không thuộc danh sách trên**:
chưa đủ bằng chứng (chưa verify sandbox OS-level nào khả dụng/đáng tin trên
máy thật) để tự quyết build ngay hay không — cần 1 bước verify trước khi
có thể tự quyết, khác hẳn 10 điểm trên (đã đủ bằng chứng ngay lúc này).
