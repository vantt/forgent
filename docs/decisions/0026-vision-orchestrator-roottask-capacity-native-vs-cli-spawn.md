---
type: explanation
title: "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity"
tags: []
timestamp: 2026-08-03T10:33:57.000Z
source_capture_ids: []
date: 2026-08-03
status: accepted
superseded_by: 0028
extends: []
relates_specs: [runner]
---

# 0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity

**Pinned term: "Native-First Dispatch Doctrine"** — dùng tên này khi
tham chiếu tới toàn bộ vision trong quyết định này (vocabulary
launcher/rootTask/subTask/capacity + 4 quy tắc chọn native vs
cli/spawn dispatch bên dưới), thay vì lặp lại toàn bộ nội dung.

## Bối cảnh

Trong lúc thi công `tsk-3sw` (capacity `agentType` field) và `tsk-53h`
(generalize cli-dispatch-for-cheap-cross-provider-tasks), và trong lúc
truy ra gap thật của `tsk-1ni` (`judgeDiscovery`/`judgeDecompose` luôn
cli/spawn 1 judge mù, kể cả khi caller đã là 1 soul sống cùng provider),
người dùng phát biểu 1 tầm nhìn tổng quát hơn cho toàn bộ cơ chế dispatch
— vượt ra ngoài phạm vi hẹp của 2 item đó. Quyết định này CHỐT tầm nhìn
đó thành văn bản chính thức (đặt tên **Native-First Dispatch Doctrine**),
làm định hướng chung cho mọi item sau này đụng tới dispatch (không tự nó
implement gì).

## Đơn vị vận hành (vocabulary, chốt dùng xuyên suốt từ đây)

- **launcher** — tiến trình/cơ chế QUYẾT ĐỊNH kích hoạt 1 rootTask,
  qua HOẶC 1 agent-terminal (tương tác) HOẶC 1 headless/non-interactive
  agent process (spawn/cli). Là 1 VAI TRÒ, không phải 1 phần mềm cụ thể
  duy nhất — nhiều cơ chế khác nhau đều đóng vai này:
  - Người dùng tự tay mở 1 session Claude Code/Codex/agy tương tác —
    chính người dùng là launcher.
  - `/fgOS:pick`, `/fgOS:merge-loop`, `/fgOS:discover-loop`,
    `/fgOS:cleanup-loop`, `/fgOS:retro-loop` — các skill lặp, chạy BÊN
    TRONG 1 session tương tác đang sống, lần lượt kích hoạt/đưa nhiều
    rootTask qua vòng đời của chúng.
  - `fgos-runner` (`bin/fgos-runner.mjs`/`loop.mjs`) — launcher
    HEADLESS, không cần người ngồi terminal — hình dung là tương lai khi
    không cần thao tác tay nhiều nữa, tự claim + spawn worker headless
    cho từng rootTask.
  - `herdr-plugin` (quản lý pane/tab terminal) — hạ tầng để đứng 1
    agent-terminal lên (tìm/mở pane), CÓ THỂ được 1 launcher dùng để
    đứng rootTask lên, và tự nó cũng có thể được bọc thành 1 launcher
    (ví dụ 1 automation dùng herdr mở N pane, mỗi pane chạy 1 rootTask).
  - **Vai trò launcher KHÔNG CẦN soul** — logic chọn "item nào tiếp
    theo" (FIFO picker, frontier, priority ranking...) giữ THUẦN CƠ HỌC,
    đúng tinh thần "trí tuệ không cầm picker" (`fgos-routing`'s own D8
    stance) đã có sẵn trong repo. Soul chỉ vào cuộc SAU KHI launcher
    đã quyết định kích hoạt rootTask nào.

- **rootTask** — công việc gốc đang làm, được bao bọc/vận hành bởi 1
  agent-terminal (tương tác) hoặc 1 headless agent process. Vai trò này
  có tính ĐỆ QUY/fractal, không cố định ở 1 tầng: bất kỳ ai đang là "host"
  thực thi cho 1 việc, tại thời điểm nó tự kích hoạt việc con bên dưới,
  chính nó lại đóng vai rootTask cho những việc con đó (khớp
  `tsk-53h`'s nesting rule đã pin: 1 `claude` bị spawn qua cli/spawn, một
  khi đã chạy, chính nó lại là 1 Claude Code agent loop thật, có thể tiếp
  tục dispatch xuống 1 tầng nữa).

- **subTask** — KHÔNG phải 1 phạm trù riêng, ĐÚNG bản chất chỉ là 1
  **rootTask** khác, được kích hoạt đệ quy bởi rootTask hiện tại (khớp
  đúng tính đệ quy/fractal đã nói ở trên — "subTask" chỉ là tên gọi
  tương đối, nhìn từ góc của bên kích hoạt).

- **capacity** — KHÁC bản chất với subTask: là 1 đơn vị functional/helper
  hẹp (judge-discovery, submit-assist-classify) — không tự mang vòng đời
  1 rootTask đầy đủ.

  **subTask và capacity KHÔNG gộp thành 1 khái niệm** (đính chính lại
  phát biểu ban đầu) — chúng khác nhau thật về bản chất (1 bên là
  rootTask đệ quy, 1 bên là helper). Cái GIỐNG NHAU, và là điều đáng nói,
  là **CƠ CHẾ DISPATCH/LAUNCH**: quyết định "kích hoạt bằng gì" (native
  hay cli/spawn, theo 4 quy tắc dưới) áp dụng Y HỆT cho cả 2 — bên kích
  hoạt không cần quan tâm target là 1 rootTask-con hay 1 helper, chỉ cần
  biết: có cần soul không, cùng provider không, có cơ chế native tương
  ứng không, config có ép cli/spawn không. Từ góc nhìn cơ chế dispatch
  (không phải góc nhìn khái niệm), coi cả 2 là "đối tượng bị kích hoạt"
  chung 1 quyết định là hợp lý — nhưng đó là hợp nhất Ở TẦNG CƠ CHẾ, chưa
  từng có ý gộp bản chất 2 khái niệm làm một.

## Quy tắc chọn cơ chế dispatch (áp dụng y hệt cho subTask lẫn capacity)

1. **Target thuần cơ học** (không cần suy luận/soul) → luôn cli/spawn.
   Hiển nhiên, không có lựa chọn khác, không tranh cãi.

2. **Target cần soul, CÙNG provider với rootTask đang chạy** → ưu tiên
   cơ chế NATIVE của chính provider đó (Claude: Task/SubAgent/Team; agy:
   `--agent` + cơ chế subagent nội bộ của riêng nó — xác nhận thật qua
   changelog agy: "subagent_info payload for delegated subagents...
   nested subagents (grandchild and deeper)" — agy có khái niệm
   native-subagent-trong-session y hệt Claude, không chỉ mỗi CLI flag
   `--agent`). Đây là **native dispatch** — tên tổng quát hoá của
   "task-dispatch" (`tsk-53h`) ra khỏi phạm vi riêng Claude, cho MỌI
   provider có cơ chế in-process của riêng nó.

3. **Target cần soul, KHÁC provider với rootTask đang chạy** → bắt buộc
   cli/spawn (**cli/spawn dispatch** — tên giữ nguyên nghĩa "cli-dispatch"
   cũ). Không có ngoại lệ hôm nay — chưa provider nào hỗ trợ native
   cross-provider (Claude's Task tool chỉ chọn được model Claude, không
   gọi được binary khác — đã xác nhận qua `--model`/`--agent` help text
   lẫn `tsk-53h`'s locked fact).

4. **Ngoại lệ hợp lệ, không phải bug:** config có thể ép 1 target cùng
   provider vẫn phải cli/spawn, cho mục đích riêng (ví dụ: cách ly tài
   nguyên, cần chạy trong worktree/cwd khác, cần 1 tiến trình độc lập
   hoàn toàn không chia sẻ context). `tsk-3sw`'s `agentType` field
   (headless-runner spawn `claude --agent <name>`) CHÍNH LÀ case này —
   hợp lệ, không sai, không bị tầm nhìn này phủ nhận.

## Lớp còn thiếu — LLM đủ thông minh để tự nhận ra khi nào dùng nhánh nào

Hôm nay CHƯA có lớp quyết định nào tự động áp quy tắc 1-4 ở trên. Bằng
chứng sống, cụ thể (`tsk-1ni`, truy ra trong buổi thảo luận dẫn tới quyết
định này): `judgeDiscovery`/`judgeDecompose` — 1 capacity cần soul (helper
functional, không phải subTask) — LUÔN cli/spawn 1 `claude -p` con, dù caller
(chính session đang gọi `fgos discover`) đã là 1 soul sống, CÙNG provider,
đã có sẵn context tốt hơn (đã đọc CONTEXT.md, đã tự Socratic xong). Đúng
lẽ ra phải rơi vào nhánh 2 (native — tự suy luận tiếp, không cần spawn gì
cả) nhưng lại rơi vào nhánh 3/4 một cách âm thầm, sai — không phải vì
thiếu khái niệm kiến trúc, mà vì thiếu cơ chế PHÁT HIỆN "tôi đang được
gọi từ 1 soul sống cùng provider hay không" trước khi quyết định.

Lớp thiếu này cần LÀ MỘT PHÁN ĐOÁN CỦA LLM (không thuần cơ học) vì tín
hiệu quyết định không chỉ là 1 biến môi trường boolean (`CLAUDECODE` có
mặt hay không) — còn phải cân nhắc: capacity này có thật sự cần soul
không, có tồn tại cơ chế native tương ứng không, config có ép cli/spawn
không, và (khi native khả dụng) có đáng dùng native hay vẫn nên cli/spawn
vì lý do cô lập/tài nguyên. Đây chính là "lớp LLM vừa đủ thông minh" mà
tầm nhìn này đòi hỏi — chưa xây, chỉ mới có mầm mống ý định
(`tsk-3sw`'s "Revised design": *"the calling skill... MAY call Task tool
natively instead of exec'ing... if it already has live Agent/Task tool
access"*).

## Quan hệ với việc đã khoá — không mâu thuẫn, chỉ hẹp hơn

- `tsk-3sw` (agentType, Claude-only, build qua cli/spawn) — là 1 mảnh
  ghép ĐÚNG của quy tắc 4 (ngoại lệ hợp lệ) + phần thật cần cho mọi
  nhánh khác cũng vậy (cli/spawn primitive vẫn cần tồn tại, dùng chung
  cho case cơ học/cross-provider/config-ép). Không bị supersede.
- `tsk-53h`'s nesting rule + bằng chứng đa-provider (Claude/agy/Codex 3
  shape khác nhau) — ĐÚNG NỀN TẢNG quy tắc 2/3 ở trên dựa vào, không đổi.
- Cả 2 item đó và gap `tsk-1ni` đều chỉ là MẢNH GHÉP hẹp (cơ chế
  `capacities.<id>` config riêng của fgOS) của bức tranh rộng hơn tầm
  nhìn này vẽ ra (gộp cả việc tự gọi Task tool ngoài cơ chế
  `capacities.<id>`, gộp cả khái niệm launcher tường minh).

## Ranh giới quan sát được (observability) — tránh ngộ nhận

Ưu tiên native (quy tắc 2) có 2 lý do ĐỘC LẬP, không phải 1: (a) tránh
lãng phí/sai lệch khi soul mù re-derive 1 phán đoán soul sống đã làm rồi
(đúng bug `tsk-1ni`) — lý do này ĐÚNG ở CẢ launcher tương tác lẫn
headless; (b) quan sát được trực tiếp (agent-terminal tương tác cho thấy
pane/subagent sống) — lý do này CHỈ đúng khi launcher đang tương tác.
Khi rootTask tự nó chạy headless (spawn bởi `fgos-runner`), dùng native
bên trong nó (nested Task) VẪN tránh được lãng phí (a) nhưng KHÔNG cho
quan sát sống (b) — vẫn chỉ ghi lại post-hoc, có điều kiện, qua
scout-notes.md (đã trace thật trong buổi thảo luận này). Không đánh đồng
"dùng native" với "quan sát được" — 2 lợi ích tách biệt, chỉ trùng nhau
khi launcher vốn đã tương tác.

## Việc chưa quyết, để lại cho item build lớp quyết định thật

- Tín hiệu phát hiện "launcher hiện tại có phải soul sống cùng
  provider không" cho từng provider (Claude: `CLAUDECODE` env var đã xác
  nhận tồn tại; agy/Codex: chưa verify tín hiệu tương đương).
- Cơ chế tường minh nào áp CÙNG 1 quyết định dispatch (quy tắc 1-4) cho
  cả subTask lẫn capacity trong code thật — hôm nay `capacities.<id>`
  (fgOS config) và lời gọi Task tool trực tiếp của 1 session (kích hoạt
  subTask) là 2 đường tách biệt hoàn toàn, chưa đi qua cùng 1 lớp quyết
  định nào cả.
- Địa điểm đặt lớp quyết định native-vs-cli/spawn: trong `resolveExecutorConfig`
  bản thân nó (không thể — là hàm Node thuần, không tự gọi Task được),
  hay ở tầng gọi nó (skill/engine-verb caller, nơi có soul thật)?

## Kế hoạch triển khai (5 pha, đã file thành work item, deps thật)

| Pha | Item | Phụ thuộc | Song song được với |
|---|---|---|---|
| 1 | `tsk-1ni` — fix `repoRoot` (state-root/content-root lẫn nhau) + verify-overwrite | không | Pha 3 (`tsk-53h`, khác file) |
| 2 | `tsk-27y` — protocol caller tự khai verdict cho `fgos discover`/`fgos decompose` | không (chỉ overlap footprint với Pha 1, không phải dep logic) | Pha 3 (`tsk-53h`, khác file) |
| 3 | `tsk-53h` — shared helper phát hiện native-vs-cli/spawn cho skill-facing capacity | `tsk-3sw` (đã done) | Pha 1, Pha 2 (khác file, không overlap) |
| 4 | `tsk-3ik` — hợp nhất `capacities.<id>` config dispatch với lời gọi Task tool trực tiếp | `tsk-27y` + `tsk-53h` | không (chờ cả 2 xong) |
| 5 | `tsk-6db` — mở rộng native detection sang `agy` (deferred, YAGNI, chưa consumer thật) | `tsk-53h` | Pha 2, Pha 4 (concern khác nhau) |

## Tham chiếu

- `tsk-3sw` — `docs/history/agent-executor-capacity-kind-task-resolution/CONTEXT.md`
- `tsk-53h` — `docs/history/agent-executor-generalized-capacity-helper/CONTEXT.md`
- `tsk-1ni` — gap `readLockedContext`/verify-overwrite, bằng chứng sống
  cho lớp quyết định còn thiếu
- `tsk-27y`, `tsk-3ik`, `tsk-6db` — Pha 2/4/5 của kế hoạch triển khai trên
- `docs/explanation/agent-executor-capacity-aware-dispatch.md`
