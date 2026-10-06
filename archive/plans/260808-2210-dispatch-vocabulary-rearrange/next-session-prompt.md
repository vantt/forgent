# Prompt cho phiên mới — Sắp xếp lại toàn bộ từ vựng tầng dispatch của fgOS

> Dán nguyên khối dưới đây (từ `/fgOS:coding-shape` trở xuống) vào một phiên
> Claude Code mới mở tại `/home/vantt/projects/forgentX`.

---

/fgOS:coding-shape Sắp xếp lại toàn bộ từ vựng tầng dispatch của fgOS — từ
tổng quan xuống chi tiết, từng chữ về đúng tầng đúng nghĩa. Nhân tiện làm
giàu bằng khái niệm của bee và repository-harness.

════════════════════════════════════════════════════════════════════
PHẦN 0 — ĐỀ BÀI, VÀ LUẬT CHỐNG LAN MAN
════════════════════════════════════════════════════════════════════

fgOS **đã có** một hệ dispatch ĐANG VẬN HÀNH — orchestrator/launcher/
dispatch/task/subTask/capacity/executor/spawn/provider/model. Nhắc lại:
**đang vận hành**, không phải greenfield. Đừng đề xuất xây lại.

Vấn đề nằm ở TỪ VỰNG: một số chữ sai nghĩa, một số khó hiểu, một số đặt
sai tầng. Việc của phiên này:

1. Đưa toàn bộ từ vựng lên bàn, **từ tổng quan xuống chi tiết**.
2. Xếp lại từng chữ về đúng tầng, đúng nghĩa, có phép thử phân biệt.
3. Làm giàu: khái niệm bee/repository-harness có mà fgOS chưa → cân nhắc
   distill, nhưng **phải xếp được vào hệ hiện tại**, hoặc nêu rõ vì sao
   phải mở rộng hệ.

KHÔNG viết code. KHÔNG thiết kế thi công. Chỉ từ vựng và ranh giới.

### Luật chống lan man — BẮT BUỘC

Phiên trước (`tsk-5td`, 8 vòng) thất bại đúng ở chỗ này: mỗi vòng thêm một
tầng phân tích, không bao giờ tóm lại, người dùng đọc một hồi mất hẳn
phương hướng và phải dừng. Đừng lặp lại. Năm luật:

1. **Mỗi vòng kết thúc bằng MỘT bảng từ vựng đầy đủ, VIẾT LẠI TOÀN BỘ** —
   không phụ lục, không append, không "xem thêm hàng 27". Người dùng phải
   thấy toàn cảnh sau mỗi lượt, không phải ghép từ nhiều mảnh.
2. **Tối đa 2 câu hỏi mở mỗi lượt.** Nhiều hơn thì để dành vòng sau.
3. Một chữ chỉ được coi là xếp xong khi trả lời được đủ ba câu:
   *nghĩa là gì · nằm tầng nào · phép thử nào phân biệt nó với chữ gần
   nhất*. Thiếu một câu thì nó vẫn ở ô "chưa xếp".
4. **Đi đúng thứ tự PHẦN 6. Không nhảy cóc.**
5. Phát hiện điều mới giữa chừng: ghi một dòng vào ô "chưa xếp", **không
   đào ngay**. Đào ngay chính là cách phiên trước lạc.

### Neo và artifact

- Item neo: `tsk-5td` (status `doing`, stage `clarify`, branch `fgw/tsk-5td`,
  worktree `.claude/worktrees/tsk-5td-pqXr9j`).
- File: `docs/history/dispatch-concept-boundary/DISCUSSION.md` — 8 vòng đã
  ghi, D1/D2 đã mint. **§6 đang NỢ: nó là bản vòng 4, chưa gấp vòng 5–8
  vào.** Trả nợ đó là Bước 0 của phiên này.
- Prompt này đã gói đủ để làm việc. Chỉ mở `DISCUSSION.md` khi cần nguyên
  văn Q&A của một vòng cụ thể.

════════════════════════════════════════════════════════════════════
PHẦN 1 — HỆ ĐANG VẬN HÀNH: BẢN ĐỒ THẬT
════════════════════════════════════════════════════════════════════

### Module (`src/runner/`, dòng)

```
loop.mjs 1307 · dispatch.mjs 1186 · merge.mjs 953 · worktree.mjs 890
session.mjs 597 · main-checkout-lock.mjs 533 · claim-port.mjs 278
anti-loop.mjs 253 · github-adapter.mjs 188 · worker-log.mjs 109
```

`dispatch.mjs` — 20 export:
`RunnerConfigError · DispatchError · buildPrompt · loadRunnerConfig ·
KNOWN_ASSISTANT_CLI_NAMES · detectAssistantCli · DEFAULT_RUNNER_CONFIG ·
SUPPORTED_EXECUTOR_TEMPLATES · loadRunnerConfigFromDir ·
ensureRunnerConfigForDir · CAPACITY_KINDS · CLAUDE_CLI_COMMANDS ·
modelForTier · decideDispatchMechanism · decideCapacityDispatchMechanism ·
resolveExecutorCommand · DEFAULT_ADAPTER · EXECUTOR_ADAPTERS · spawnWorker`

### Config thật (`.fgos/config.json`, block runner)

Key: `capacities` · `executors` · `executor` · `models` · `timeoutMs` ·
`parallel`.

```jsonc
"capacities": {
  "judge-discovery":        { "kind": "task", "command": "claude", "args": [...] },
  "judge-decompose":        { "kind": "task" },
  "submit-assist-classify": { "kind": "cli", "adapter": "cli-spawn", "command": "agy",
                              "provider": "agy", "args": [...], "tier": "light",
                              "model": "Gemini 3.5 Flash (Medium)",
                              "allowCrossProvider": true }
}
```

Tool đã đăng ký (2): `gitnexus` (kind mcp, capability `impact-analysis`,
command `mcp:gitnexus`, responsibility Verification, status present) ·
`submit-assist-classify` (kind cli, capability `submit-assist-classify`,
command `agy`, responsibility Classification, status present).

### 23 chữ đang sống — đây là thứ phải xếp

| # | Chữ | Sống ở đâu |
|---|---|---|
| 1 | `orchestrator` | 0026 (tên cũ) · `tsk-2cw` đang giải phóng cho tầng điều phối N đơn vị |
| 2 | `launcher` | 0028 (accepted) — tên mới của vai trò 0026 |
| 3 | `driver` | `fgos-coding-driving` |
| 4 | `dispatch` | tên module + tên hành động |
| 5 | `work` / work item | entity được lưu (0003) |
| 6 | `rootTask` | 0026 |
| 7 | `subTask` | 0026 (*"không phải phạm trù riêng"*) |
| 8 | `capacity` | 0026 + config key `capacities.<id>` |
| 9 | `capability` | field bắt buộc của `fgos tool register` |
| 10 | `tool` | entity tool-registry |
| 11 | `provider` | field trong capacity config + tên output của `tool query` |
| 12 | `kind` | `CAPACITY_KINDS = [...KINDS, 'task']` |
| 13 | `executor` | `command` + `args` |
| 14 | `adapter` | `EXECUTOR_ADAPTERS`, đúng 1 key |
| 15 | `spawn` / `spawnWorker` | hành động dựng tiến trình |
| 16 | `worker` | `spawnWorker`, `worker-log.mjs` |
| 17 | `model` | `models.<tier>` |
| 18 | `tier` | `TIERS = ['light','standard','heavy']` |
| 19 | mechanism `native`/`cli-spawn` | dẫn xuất, `decideDispatchMechanism` |
| 20 | `agentType` | `.claude/agents/<name>.md` |
| 21 | `forceCliSpawn` · `allowCrossProvider` | cổng gác |
| 22 | presence: `registered`/`present`/`missing`/`unknown`/`stale` | tool-registry, file local gitignored |
| 23 | `gather`/`judge` · `digest`/`verdict` | D2 của `tsk-5td` |

**Ngoài phạm vi** (đừng kéo vào): `stage`, `status`, `deps`, `frontier`,
`merge` — đó là vòng đời/lập lịch, không phải dispatch.

════════════════════════════════════════════════════════════════════
PHẦN 2 — ĐÃ KHOÁ. KHÔNG MỞ LẠI TRONG PHIÊN NÀY.
════════════════════════════════════════════════════════════════════

| Nguồn | Nội dung khoá |
|---|---|
| `0003` | *"Entity đơn vị việc = `work`"* — quyết định bố cục dữ liệu |
| `0026` | `launcher`/`rootTask`/`subTask`/`capacity` + 4 quy tắc native-vs-cli-spawn. `subTask` = *"KHÔNG phải phạm trù riêng, đúng bản chất chỉ là 1 rootTask khác, kích hoạt đệ quy"*. `capacity` = *"đơn vị functional/helper hẹp, không tự mang vòng đời rootTask đầy đủ"*. **Sửa nó phải là quyết định tường minh, không phải hệ quả phụ** |
| `0028` (supersedes 0026) | Đổi `orchestrator`→`launcher`. Chỉ đổi **tên**, chưa đụng **số giá trị** |
| `tsk-5td` **D1** | Tiêu chí phân lớp là **authority + state effects**, không phải "vòng đời đầy đủ". Hình **cây hai tầng**, KHÔNG phải hai trục vuông góc |
| `tsk-5td` **D2** | Nhánh không-authority tách hai: `gather` (trả `digest`) / `judge` (trả `verdict`) |
| `tsk-5kn` | Sở hữu khái niệm `gather` (fan-out A, D1–D17) — tham chiếu, đừng định nghĩa lại |
| `tsk-2cw` | Đang thi hành 0028; giữ chỗ `orchestrator` cho tầng điều phối N đơn vị |
| `tsk-503` | `work.tier` **cố ý** mang hai nghĩa (nghi thức + model), Path B thắng field-split. **Đừng mở lại** |
| `tsk-2t6` D4/D9 | exec packet B2 (con GHI file, id ephemeral phạm vi cha) **vẫn gated**. Điều kiện mở: `tsk-3xd` merged (đã thỏa) VÀ ≥2 ca thật — **chưa có ca nào** |
| — | `capacities.<id>` là config key thật. Bỏ nó = **breaking change** cho người dùng, không phải đổi nhãn |

════════════════════════════════════════════════════════════════════
PHẦN 3 — BẰNG CHỨNG ĐÃ SCOUT (2026-08-08). ĐỪNG SCOUT LẠI.
════════════════════════════════════════════════════════════════════

**3a. `capability` chỉ được đọc ở 3 chỗ — KHÔNG chỗ nào là dispatch**
`tool-registry.mjs:84` (normalize lúc register) · `command-registry.mjs:934`
(khai flag) · `bin/fgos.mjs:3873` (filter của `tool query`). Hết.

**3b. Khoá nối thật giữa capacity và tool là `name`, không phải capability**
```js
// dispatch.mjs:604-609 — tools keyed theo NAME
const tools = listWork(fgosDir).tools ?? {};
if (!tools[capacityId]) { throw ... }
```
⇒ capacity `kind:"cli"` **buộc** `capacity id === tool name`. Việc
`submit-assist-classify` cũng mang `capability` trùng tên là **ngẫu nhiên**
— đổi capability thành `"classification"` thì dispatch chạy y hệt.

**3c. Luật gốc fgOS tự ghi lúc port, rồi tự vi phạm**
`docs/distillery/deep-dives/tool-registry.md:27`:
> `--capability` … **Đây là điểm khớp DUY NHẤT giữa 1 bước workflow và 1
> tool** — bước chỉ tham chiếu capability, KHÔNG BAO GIỜ tham chiếu tên
> tool cụ thể (US-027: *"the core consults capabilities, never tools"*)

CLAUDE.md's gate (prose) tuân luật (`--capability impact-analysis`). Code
thì không (3b).

**3d. `KINDS` không có `task`**
`tool-registry.mjs`: `KINDS = ['cli','binary','mcp','skill','http']`.
`dispatch.mjs:395`: `CAPACITY_KINDS = Object.freeze([...KINDS, 'task'])`.
Comment tự khai: `task` là *"the one kind `fgos tool` has no reason to
know"*.

**3e. `kind` trong registry quyết định CÁCH PROBE, không phải cách gọi**
deep-dive dòng 26: `cli`/`binary` → resolve trên PATH; `mcp`/`skill` →
check `scan_target` tồn tại trên đĩa; `http` → TCP-ping 2s.

**3f. `adapter` là CỔNG, và chỉ có một**
`dispatch.mjs:818-830` + `:941`:
```js
export const DEFAULT_ADAPTER = 'cli-spawn';
export const EXECUTOR_ADAPTERS = { [DEFAULT_ADAPTER]: cliSpawnAdapter };  // đúng 1 key
```
Doc comment: *"the executor **port** is now a NAMED interface"* … *"An
`rpc`/`app-server` adapter … is **deferred** — only the interface's name is
bought now, not a second adapter."*
⚠ Giá trị `'cli-spawn'` của adapter (**khai báo**) trùng chuỗi với giá trị
mechanism #3 (**dẫn xuất**).

**3g. mechanism suy ra từ kind**
`dispatch.mjs:688`: `hasNativeMechanism: Boolean(capacity && capacity.kind === 'task')`.

**3h. Presence check chỉ gác `kind === 'cli'`**
`dispatch.mjs:603` (presence) và `:630` (allowCrossProvider) đều gác
`kind === 'cli'`. Capacity `mcp`/`skill`/`http`/`binary` dispatch với
**zero** presence check, **zero** cross-provider check. Latent — chưa
capacity nào thuộc 4 kind đó.

**3i. Trùng lặp không đối chiếu**
`capacities.submit-assist-classify` nói `kind:"cli"`, `command:"agy"`.
`tools.submit-assist-classify` cũng nói `kind:"cli"`, `command:"agy"`. Nối
bằng name, **không so khớp**. Lệch thì dispatch dùng bản capacity, probe
dùng bản tool.

**3j. `0028` đã lập luận sẵn hai tính chất của vai trò bên gọi**
> *"orchestrator" trong ngành … chỉ định 1 tiến trình điều phối **NHIỀU**
> đơn vị theo thời gian, **duy trì liên hệ liên tục**… Vai trò `0026` mô
> tả làm **NGƯỢC LẠI**: chọn đúng 1 item bằng logic cơ học, đứng nó lên,
> rồi **bước ra hoàn toàn**.*

Cộng `0026`: *"Vai trò launcher **KHÔNG CẦN soul** — logic chọn item giữ
**THUẦN CƠ HỌC**"*.

**3k. `fgos-fanout` spawn N Agent, mỗi Agent chạy `/fgOS:pick` end-to-end**
⇒ mỗi Agent con là một `driver`.

**3l. `work.parent` là field thật** (`work.mjs:414`) — *"a child work item
carries `parent`… stays its own stored field, NOT a `deps` entry"*.

**3m. Chữ "đơn vị việc" đã có chủ**
`0003:24` — *"**Entity đơn vị việc = `work`**"*.
`system-overview.md:31` — *"Work item (`work`) | Đơn vị việc **DUY NHẤT**
của forgent"*.

**3n. Một dòng doc đã lỗi thời so với D1 — đằng nào cũng phải sửa**
`docs/explanation/why-fgos-dispatch-splits-into-gather-packets-and-a-gated-exec-packet.md:64`:
*"along **two orthogonal axes**: does this unit of work carry a real…"* —
D1 đã bác thẳng "vuông góc".

**3o. `gather` có 0 capacity đăng ký nhưng CÓ ca sống**
Fan-out của `fgos-researching` chạy hoàn toàn ngoài cơ chế capacity: không
config, không presence check, không log. Xác nhận sống bằng `tsk-o4l`
(2026-08-08). Bee cũng chưa đóng được chỗ này (*"a Bash-launched gather
emits zero `dispatch.jsonl` rows"*) ⇒ nếu fgOS làm, đây là chỗ **vượt**
upstream.

**3p. bee — ba lớp, tiêu chí sắc nhất trong ba hệ**
`upstreams/bee/skills/bee-hive/references/routing-and-contracts.md:342`:
execution worker *"distinguished from the I/O-offload worker by **AUTHORITY
AND STATE EFFECTS**, not by task size"* (có registry, có reservation, có
cell, trả status token) · I/O worker (không registry, không reservation,
trả digest có `file:line` anchor) · review-class (*"is **NEITHER class**"*).

**3q. repository-harness (hn) — 11 capability là hợp đồng giữa hai hệ**
`upstreams/repository-harness/docs/contracts/harness-orchestration-v1.md:84-101`
— *"Protocol-v1 capabilities are behavioral promises, not product names"*:
`stories.read.v1` · `stories.write.v1` · `work-graph.read.v1` ·
`story-dependencies.read-write.v1` · `story-hierarchy.read-write.v1` ·
`changesets.apply.v1` · `changesets.status-sha.v1` ·
`entity-revision-conflicts.v1` · `isolated-db.v1` ·
`isolated-db-snapshot.v1` · `semantic-operation-log.v1`.
Kèm luật: *"Unknown capabilities and unknown additive JSON fields must be
ignored. A missing required capability is a **hard compatibility failure
before mutation**."*
⚠ **KHÔNG cùng trục với `capacity` của fgOS.** Đừng chép số 11.

**3r. hn tách outbound / inbound**
deep-dive dòng 12: *outbound* (lệnh compiled của chính harness, luôn có) vs
*inbound* (tool project tự đăng ký, optional, may absent).

**3s. Degrade ladder của hn** — 0 provider registered → **Inactive** (skip
sạch, KHÔNG phải drift) · registered nhưng missing/unknown → **Degraded**
(chạy tiếp, cờ weak proof) · tất cả present → **Full**. fgOS đã có, ở prose
CLAUDE.md.

════════════════════════════════════════════════════════════════════
PHẦN 4 — CHẨN ĐOÁN ĐÃ CÓ. TẤT CẢ MỚI MỘT VÒNG, CHƯA CHỐT.
════════════════════════════════════════════════════════════════════

Đây là **giả thuyết làm việc**, không phải kết luận. Được phép bác bỏ —
nhưng bác thì phải nêu bằng chứng, không phải cảm giác.

### Bệnh nền: một ô mang câu trả lời cho HAI câu hỏi

Phiên trước bắt được **ba lần**, ba chỗ khác nhau:

| Lần | Ô nào | Gộp hai gì |
|---|---|---|
| vòng 4 | `kind` vs mechanism | khai báo tĩnh vs dẫn xuất động |
| vòng 6 | `capacity` | lớp việc vs bản ghi binding |
| vòng 8 | vai trò bên gọi | arity (1 vs N) vs engagement (buông vs ở lại) |

Ba lần cùng một khuôn ⇒ có thể **bản thân cái khuôn đó** mới là phát hiện
gốc, còn mọi thứ khác chỉ là chỗ nó lộ ra. Đáng kiểm bằng cách rà nốt 23
chữ ở PHẦN 1 xem còn ô nào nữa không.

### Khung tạm: một quan hệ, hai phía

Không phải hai trục song song. Là **một quan hệ dispatch có hai phía**:

| | phía CẦU | phía CUNG |
|---|---|---|
| trừu tượng | **work-unit** — `rootTask` · `capacity`{`gather`,`judge`} | **`capability`** |
| cụ thể | một item / một capacity id | **`tool`** (= provider) |
| khớp nối | ← `capability` là khớp hợp lệ duy nhất (3c) → | |
| bản ghi buộc | `capacities.<id>` — mang `kind` + `executor` | |

`work-unit` là tên người dùng đã chọn cho trục phía cầu (vòng 5b), với ràng
buộc: `work` là giá trị **được lưu** duy nhất trên trục (giải va chạm 3m
mà không supersede 0003 — 0003 nói về *entity*, không nói về *trục*). Cần
sửa `system-overview:31` một dòng.

### Năm điều chỉnh A1–A5

| | Nội dung | Sống hay latent |
|---|---|---|
| **A1** | `capacity` mang hai nghĩa: (a) lớp work-unit · (b) bản ghi binding. **Khác tập hợp** — gather là (a) mà không có (b) (3o) ⇒ khác khái niệm | — |
| **A2** | Binding nối bằng `name` chứ không `capability` (3b), vi phạm luật fgOS tự ghi (3c). Hệ quả đo được: **provider thứ hai của cùng capability không bao giờ thoả được một capacity** | **SỐNG** |
| **A3** | mechanism thật ra là *nhà cung cấp ở TRONG hay NGOÀI*. `native`/`cli-spawn` chỉ đặt tên cho vỏ | — |
| **A4** | presence check gác theo **vận chuyển** (`kind==='cli'`, 3h), đáng lẽ gác theo **nhà cung cấp có ở ngoài không** (`kind !== 'task'`) — đúng vị từ của A3 | latent |
| **A5** | capacity block và tool record tả cùng backend, không đối chiếu (3i) | latent |

**Năm suy dẫn độc lập đều rơi vào A3** — lý do tin nó, không phải khớp ép:
(i) `KINDS` không có `task` (3d) · (ii) hn tách outbound/inbound (3r) ·
(iii) `hasNativeMechanism === kind==='task'` (3g) · (iv) `judge-discovery`
và `submit-assist-classify` **cùng lớp judge, khác nhà cung cấp** ·
(v) adapter `rpc` deferred (3f) — ngày nó đăng ký thì "ngoài" và "spawn"
tách nhau, tên `cli-spawn` cho mechanism thành sai.

Suy dẫn (iv) cũng chứng minh **D1/D2 sống nguyên**: đổi nhà cung cấp mà lớp
không đổi ⇒ hai phía độc lập thật.

### `dispatch` là cạnh, không phải nút

Nó là mấy mũi tên cầu→binding→cung→chạy. Tách hai nửa:

| nửa | phục vụ mechanism nào |
|---|---|
| **resolve** — tìm binding, gác governance, ra executor | **cả hai** |
| **invoke** — chạy thật | ngoài: qua adapter · trong: Task tool của chính session |

⇒ `invoke` native **không đóng gói được** (bản chất — không có biên để bắc
cầu); `resolve` native thì có (thiếu sót).
⇒ Chẩn đoán `dispatch.mjs` sửa lại: "1186 dòng / 6 trách nhiệm" là **triệu
chứng**; bệnh là trộn `resolve` (dùng chung) với `invoke-external` (một
mechanism) rồi đặt tên theo cả act. Khớp với việc `decideDispatchMechanism`
— hàm thuần **không đọc config**, tức thuần resolve — là export duy nhất
phục vụ cả hai. **Đường cắt đúng: resolve/invoke, không phải "chia 6".**

### Vai trò bên gọi: 2×2, một ô trống

| | **buông** | **ở lại** |
|---|---|---|
| **1 đơn vị** | `launcher` | `driver` |
| **N đơn vị** | *(trống)* | `orchestrator` |

Nhu-cầu-phán-đoán bám theo **cột** (3j), không theo arity. Và
`orchestrator` không phải ô thứ ba mà là **tầng hợp thành** — 3k chứng
minh: mỗi Agent con của fanout là một driver.
⇒ Đề xuất: vai trò bên gọi rút về **2 giá trị**, `orchestrator` lên tầng
trên. **Đụng `tsk-2cw` — phải hỏi người dùng trước.**

════════════════════════════════════════════════════════════════════
PHẦN 5 — KHO bee/hn ĐỂ CÂN NHẮC DISTILL
════════════════════════════════════════════════════════════════════

Luật: lấy cái gì cũng **phải xếp được vào tầng của hệ hiện tại**, hoặc nêu
rõ vì sao buộc phải mở rộng hệ. Không bê nguyên xi.

| Khái niệm | Hệ | fgOS có chưa | Xếp vào đâu nếu lấy |
|---|---|---|---|
| **Phía cầu tự khai capability nó CẦN** (story→capability, `audit`/`propose` phát hiện drift) | hn | **CHƯA CÓ** | phía cầu. ⚠ **Món to nhất** — hôm nay work item không khai nó cần gì, nên khớp nối chỉ có một đầu |
| capability versioned (`.v1`) | hn | chưa (free-text, không version) | phía cung |
| *"missing required capability = hard failure **before mutation**"* | hn | có nửa — throw trước spawn, nhưng kiểm **tồn tại** chứ không kiểm **lời hứa** | cổng gác |
| *"Unknown capabilities / unknown additive fields must be ignored"* | hn | chưa | cổng gác |
| Degrade ladder Inactive/Degraded/Full | hn | **CÓ** (prose CLAUDE.md, 3s) | — đã có, chỉ cần ghi vào hệ |
| outbound vs inbound | hn | có ngầm (`task` vs kind ngoài) — chính là A3 | mechanism |
| lane — nghi thức scale **bằng cấu trúc file** | hn | có `tier` (2 nghĩa, khoá ở `tsk-503`) | ⚠ đụng chỗ đã khoá, cẩn thận |
| run = worktree + copy DB → semantic changeset → apply idempotent | hn | có worktree + merge, cơ chế khác | ngoài phạm vi từ vựng dispatch |
| epic→story hierarchy trong schema, cycle chặn từ lúc insert (DFS) | hn | có `parent` + `deps`, có bảo đảm acyclic | ngoài phạm vi |
| **Gác theo MỤC ĐÍCH dispatch** (`resolveTier(..., {for:'gather'})`; bare/cell resolve của cli-shaped tier bị REFUSE `{type:'refused', reason:'cli_tier_gather_only'}`) | bee | **chưa** — fgOS gác theo capacity id | cổng gác. Ăn khớp trực tiếp với `gather`/`judge` của D2 |
| Status token `[DONE]`/`[BLOCKED]`/`[HANDOFF]`/`[NOOP]` | bee | chưa | giao diện trả về của work-unit |
| digest **bắt buộc** có `file:line` anchor; *"the orchestrator never re-reads what a digest already answers"* | bee | có ở doc, chưa thành cơ chế | giao diện trả về của `gather` |
| cell ≠ backlog item (hai sổ riêng, cell chết khi feature đóng) | bee | chưa | ⚠ đụng B2 đang gated (PHẦN 2) — đọc kỹ trước khi đề xuất |

════════════════════════════════════════════════════════════════════
PHẦN 6 — THỨ TỰ LÀM. ĐI ĐÚNG, KHÔNG NHẢY CÓC.
════════════════════════════════════════════════════════════════════

**Bước 0 — Trả nợ §6.** Regenerate `§6 Thiết kế đã chốt` trong
`DISCUSSION.md` cho đúng trạng thái sau 8 vòng. Không thêm ý mới ở bước
này, chỉ hợp nhất cái đã có. Xong thì hỏi người dùng: bản này đọc có hiểu
không? Nếu không thì sửa cho hiểu **trước khi** đi tiếp.

**Bước 1 — Chốt có bao nhiêu TẦNG và tên từng tầng.** Chỉ tầng, chưa xếp
chữ nào. Ứng viên từ PHẦN 4: hợp thành · dấn thân · cầu · binding · cung ·
cổng gác (cắt ngang) · dẫn xuất. Người dùng phải gật cái khung này trước.

**Bước 2 — Xếp 23 chữ (PHẦN 1) vào tầng.** Mỗi chữ đủ ba câu của luật 3.
Chữ nào không xếp được → ô "chưa xếp", đi tiếp, không dừng lại đào.

**Bước 3 — Xử lý chữ bị hai nghĩa.** Với mỗi ô gộp: tách ra, đặt tên cho
từng nửa, nêu phép thử phân biệt. Nhớ ràng buộc breaking-change ở PHẦN 2.

**Bước 4 — Rà kho PHẦN 5.** Từng dòng: lấy hay không, nếu lấy thì xếp tầng
nào, nếu không lấy thì vì sao. Bắt đầu từ dòng đầu (phía cầu tự khai
capability) — nó to nhất.

**Bước 5 — Danh sách việc phải làm.** Rename gì · sửa doc nào · mở item
nào. **Không thi công trong phiên này.**

════════════════════════════════════════════════════════════════════
PHẦN 7 — BỐN CÂU ĐANG TREO (nói bằng tiếng thường)
════════════════════════════════════════════════════════════════════

1. **Khi cần một công cụ, fgOS hỏi "ai làm được việc này" hay hỏi đích danh
   tên công cụ?** Code đang hỏi đích danh tên (3b); doc bảo phải hỏi theo
   việc (3c). Hai cái lệch nhau. Nhận luật US-027 ⇒ A2 thành khiếm khuyết
   đã biết, phải mở item sửa.
2. **`capacity` là "loại việc" hay "dòng cấu hình"?** Đang dùng lẫn cả hai
   (A1). Nếu chốt: giữ nghĩa lớp, `capacities.<id>` đọc lại thành binding —
   thì D1/D2 không phải sửa chữ nào, chỉ thêm một dòng định nghĩa.
3. **Chỗ kiểm "công cụ có cài chưa" đang bỏ sót 4 loại kind** (A4/3h).
   Phiên này chốt **vị từ đúng**, còn sửa code tách item riêng — được
   không?
4. **`orchestrator` có cùng loại với `launcher`/`driver` không?** Nếu
   không (PHẦN 4) thì vai trò bên gọi rút về 2 giá trị. **Đụng `tsk-2cw`** —
   phiên này chỉ ghi nhận, hay chốt luôn?

---

**Bắt đầu bằng Bước 0. Đừng trả lời bốn câu PHẦN 7 hộ người dùng.**
