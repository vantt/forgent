# CONTEXT — Tổng quát hoá tầng capacity/executor dispatch quanh khái niệm "task"

Item: `tsk-5tm`. Đầu vào của skill này là `DISCUSSION.md` (7 vòng thảo luận
tương tác, D1-D12 đã CHỐT, §6 là bản thiết kế thống nhất) — Native-First
handoff từ `fgos-coding-shaping` (`item.refs` đã trỏ vào
`DISCUSSION.md#design` trước khi phiên này bắt đầu). Pass này KHÔNG mở lại
bất kỳ quyết định nào DISCUSSION.md đã trả lời — chỉ scope lại, xác nhận
0 gray-area mới, và cô đọng thành CONTEXT.md theo đúng hình dạng
`fgos-coding-planning` cần đọc.

## 1. Ranh giới feature

Tổng quát hoá tầng dispatch (`src/runner/dispatch.mjs`) quanh 1 khái niệm
"task" dùng chung cho 4 hình dạng hiện có của fgOS (`work`, `childwork`
[gated], `capacity`, `ad-hoc task`) — đóng khoảng trống phạm vi đã khoá của
`tsk-3ik`'s D3 (mọi call site Task/Agent-tool trực tiếp phải qua cùng decision
protocol) mà `fgos-fanout` chưa từng tuân theo. Bao gồm: retire field `needs`
chết, xoá capacity `gather` (con đường cross-provider không lý do kiến trúc),
đặt tên "executor" thống nhất, thêm subcommand tự-thực-thi (`execute`) khớp
`run_task()` của marketing-cockpit, đổi registry shape (key theo tên executor,
`invocations[]`), đổi model/tier resolution sang N-map theo provider, và 1
prose/skill helper chung cho mọi producer nội bộ + 1 đoạn tuyên bố ở tầng
harness (`AGENTS.md`, hoãn đưa vào file tới khi phần thực thi ship).

KHÔNG bao gồm: `childwork`/exec-packet B2 (gated theo `two-layer-dispatch`,
chưa ship, ngoài phạm vi item này); quyết định bundle 1 item hay tách nhiều
item con — đó là phán đoán shape/size của `fgos-coding-planning`, không phải
của pass này (xem §5).

## Locked decisions

Kế thừa nguyên vẹn từ `DISCUSSION.md` §4, đã có trong decision log của item
(`fgos list --id tsk-5tm --json`'s `data.decisions`, ghi trong phiên
`fgos-coding-shaping`).

| D-ID | Quyết định | Bằng chứng chính |
|---|---|---|
| D1 | Retire field `needs` khỏi `capacities.<id>` | `dispatch.mjs:692` chỉ chạy gate `needs` khi `kind!=='task'`; 2/3 entry thật là `kind:"task"` → data chết 100% |
| D2 | Đặt tên "executor", không "backend" | Khớp sẵn `resolveExecutorConfig`/`EXECUTOR_ADAPTERS`, ADR0042, `executor-registry.yaml` của marketing-cockpit |
| D3 | `for`/`needs` là 2 trục trực giao JOB vs MECHANISM | `for`=việc giao (purpose-lookup); `needs`(khái niệm, dù field bị retire theo D1)=cơ chế phải có mặt |
| D4 | Tổng quát hoá dispatch quanh "task", mở rộng phạm vi đã khoá của `tsk-3ik` D3 | Flow B (`capacityIdForWork`, `dispatch.mjs:1090`) đã làm 1 nửa; `fgos-fanout` hardcode Agent tool, chưa consult decision protocol |
| D5 | `dispatch.mjs` cần self-execute cho case adapter-resolvable, khớp `run_task()` marketing-cockpit | `task-executor.py:550-611`; Flow A (`resolveCapacityCli`) luôn hand-back `{command,args}` kể cả case tự làm được; `EXECUTOR_ADAPTERS` (`dispatch.mjs:895`) chỉ Flow B gọi |
| D6 | Xoá capacity `gather` khỏi `.fgos/config.json` | Con đường cross-provider duy nhất, không lý do kiến trúc ghi lại (`tsk-2ie5` plan.md tự ghi "not decided"); lý do song song hoá đã được native đáp ứng đủ |
| D7 | Hoãn viết hợp đồng dispatch vào `AGENTS.md` tới khi D5 (`execute`) + `--work` CLI flag ship | `AGENTS.md` luôn-nạp — viết trước khi lệnh tồn tại sẽ trỏ vào lệnh không có thật |
| D8 | Đổi tên "ad-hoc packet" → "ad-hoc task" trong vocab D4 | Khớp mô tả gốc (agent tự soạn prompt, cần dispatch); "work" va chạm work-item có lifecycle; `id` shape (`<scope>#p<n>`, invalid `ID_PATTERN`) không đổi |
| D9 | Model/tier resolution: 1 map phẳng → N-map theo provider, vocab tier 3→5, thêm `rigorOverrides` | `modelForTier` (`dispatch.mjs:577`) chỉ đọc tên model Claude — executor non-Claude (agy/Gemini) nhận sai tên, không throw |
| D10 | `judge-discovery`/`judge-decompose` `for:"judge"` collision vô hại, không sửa `resolveCapacityIdForPurpose` | Điều tra `tsk-4eu`/`tsk-5ge`: bug thật không liên quan `for`/purpose-lookup, là nhầm lẫn `runner.executors.judge` với cơ chế tier khác hoàn toàn |
| D11 | Registry shape mới GIỮ field top-level `capacities`, KHÔNG đổi thành `executors` | `dispatch.mjs:521-528` (`tsk-4eu`) validate `cfg.executors` CHỈ cho phép key TIER — key theo tên executor sẽ bị `RunnerConfigError` từ chối |
| D12 | Shared prose helper: 3 sub-phần gộp chung, không tách D-ID riêng | (i) fragment rút 3 bước hệ quả D5; (ii) purpose-lookup `--for` đã hoạt động, chỉ cần tài liệu; (iii) `--work <id>` hướng (a) export `capacityIdForWork` + cờ CLI mới, đã qua ≥3 vòng không đảo |

Toàn bộ D1-D12 đã có mặt trong `fgos list --id tsk-5tm --json`'s
`data.decisions` (ghi trong phiên `fgos-coding-shaping`) — pass này không ghi
lại, chỉ trích dẫn. Rationale đầy đủ của từng D-ID: `DISCUSSION.md` §4.

## 3. Thuật ngữ đã ghim (pinned terms)

- **task** — khái niệm tổng quát mượn vocab marketing-cockpit, bao trùm 4 hình
  dạng: `work` (work-item đầy đủ lifecycle), `childwork` (exec-packet B2,
  GATED — chưa ship), `capacity` (đăng ký sẵn `capacities.<id>`), `ad-hoc
  task` (6-field runtime-composed, D8, `id` cố ý invalid `ID_PATTERN`).
- **executor** — tên gọi Tầng 2 (hiện thực hoá 1 capacity/task), không dùng
  "backend" (D2).
- **for** — trục JOB: việc được giao, dùng purpose-lookup (enum hiện tại chỉ
  còn `judge` sau D6 xoá `'gather'`).
- **needs** — trục MECHANISM: cơ chế phải có mặt để chạy; khái niệm giữ
  nguyên nhưng field trên `capacities.<id>` đã retire (D1) — nơi hỏi
  presence/staleness chuyển sang tool-registry + `fgos tool query`.
- **mechanism** (giá trị trả về của dispatch decision) — 3 giá trị:
  `"unavailable"` (hợp lệ, không phải lỗi, tự làm inline), `"in-process"`
  (hand-back `{agentType, prompt}`, agent tự gọi Task/Agent tool),
  `"out-of-process"` (dispatch tự thực thi qua `execute`, D5).

## 4. Scout evidence + impact-analysis posture

- `src/runner/dispatch.mjs` — điểm chạm chính: `resolveExecutorConfig`
  (dòng 692, gate `needs`), `EXECUTOR_ADAPTERS` (dòng 895, validate nhưng
  chỉ Flow B gọi), `decideCapacityCli`/`decideCapacityDispatchMechanism`
  (dòng 800-825), `capacityIdForWork` (dòng 1090, Flow B), `modelForTier`
  (dòng 577), validate `cfg.executors` tier-keyed (dòng 521-528, từ
  `tsk-4eu`), `CAPACITY_PURPOSES` enum (dòng 406).
- `.fgos/config.json` — 3 entry thật (`judge-discovery`, `judge-decompose`
  kind:"task"; `gather` kind:"cli", sẽ xoá theo D6).
- `docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-
  cli-spawn.md` — Native-First Dispatch Doctrine, 4 quy tắc áp tại runtime
  cho mọi hình dạng task (D4's nền tảng).
- `docs/history/native-first-dispatch-doctrine-phase-4-unify-capacity-and-
  task-dispatch/CONTEXT.md` (`tsk-3ik`) — D3 gốc: "the shared decision
  protocol must govern BOTH capacities.<id> config-driven dispatch AND any
  skill's direct Agent/Task-tool subTask calls" — `fgos-fanout` chưa từng
  tuân theo, vì skill đó ra đời sau `tsk-3ik`.
- `.claude/skills/gitnexus`/marketing-cockpit's `task-executor.py:550-611` —
  mô hình `run_task()` tự thực thi/hand-back tham chiếu cho D5.
- `test/runner/dispatch.test.mjs` — 11 chỗ fixture dùng `for: 'gather'`,
  1 assert cứng "committed .fgos/config.json declares the gather capacity"
  (dòng 651-657) — cả 2 sẽ vỡ nếu D6 landed mà không sửa, đã ghi rõ trong
  `#task-remove-gather`'s việc cụ thể (DISCUSSION.md §7).
- Impact-analysis capability gate (`fgos tool query --capability
  impact-analysis --status present`, chạy fresh trong pass này): GitNexus
  `status: "present"` — posture **full** theo CLAUDE.md's 3 mức. Các
  `#task-*` ở `fgos-coding-planning` cần chạy `impact({target, direction:
  "upstream"})` thật trước khi sửa từng symbol trong `dispatch.mjs`
  (`resolveExecutorConfig`, `EXECUTOR_ADAPTERS`, `modelForTier`,
  `CAPACITY_PURPOSES`, v.v.) — không phải posture suy đoán.

## 5. Outstanding questions cho `fgos-coding-planning`

Không phải product decision (đã chốt hết ở DISCUSSION.md §4/§6), nhưng đây là
1 phán đoán shape/size mà exploring không được quyết:

- **Bundle 1 item hay tách nhiều item con:** `#task-retire-needs` (D1) và
  `#task-remove-gather` (D6) độc lập hoàn toàn (lưu ý thứ tự nội bộ nhẹ —
  xem `#task-remove-gather`'s "Quan hệ" trong DISCUSSION.md §7: bước sửa doc
  `needs` nên làm SAU khi D1 landed). `#task-dispatch-self-execute` (D5) và
  `#task-fanout-consult-dispatch` (D4) có phụ thuộc tuần tự thật (D5 là nền
  tảng D4 cần). `#task-executor-registry-restructure` (D11) và
  `#task-provider-tier-policy` (D9) độc lập với 2 cặp trên, có thể build
  song song. DISCUSSION.md §7 đã shape đủ 5 `#task-*` với mục tiêu/trích
  dẫn/verify nháp riêng — `fgos-coding-planning` đọc trực tiếp từ đó, quyết
  giữ 1 item hay `--parent`/`--merge-after` tách nhỏ.

## Outstanding questions

None
