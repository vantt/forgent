# DISCUSSION — Tổng quát hoá tầng capacity/executor dispatch quanh khái niệm "task"

Item: `tsk-5tm`. Distill từ 1 phiên thảo luận tương tác dài (2026-08-14, session
bắt đầu review report `plans/reports/capacity-dispatch-260813-1723-flow-a-skill-
vs-flow-b-runner-report.md`), không qua `/fgOS:submit`/`/fgOS:pick` cho tới khi
chuỗi kết luận đủ chín để ghi lại. Liên quan trực tiếp: `tsk-1o7` (needs/capability
binding), `tsk-2ie5`/`tsk-2c1` (gather-capacity-purpose-binding), `tsk-3ik`
(Native-First Dispatch Doctrine Phase 4, đã merge — nguồn gốc `mechanism:
in-process/out-of-process`), `docs/decisions/0026` (Native-First Dispatch
Doctrine, 4 quy tắc chọn native-vs-cli/spawn).

## 1. Trạng thái hiện tại

Vòng 2 (2026-08-14). 6 điểm đã CHỐT (D1-D6, giữ nguyên qua ≥2 vòng không bị
đảo — D6 vừa qua ngưỡng này ở vòng 2: điều tra → hỏi thẳng lý do → chốt xoá).
Cùng vòng 2, 4 quyết định phạm vi cụ thể cho D6 (A/B/C/D, xem `#task-remove-
gather`) — không mint D-ID riêng, coi là chi tiết thực thi của D6 chứ không
phải quyết định kiến trúc mới. 2 điểm MỚI NÊU ở vòng 1, chưa qua vòng xác nhận
thứ 2 (§3, chưa mint D-ID). 1 điểm điều tra phụ vẫn mở, chưa đủ bằng chứng để
quyết.

Phát hiện định hình lại cả buổi: khung "1 cửa dispatch chung cho mọi hình dạng
task" **không phải ý tưởng mới** — nó là phần mở rộng đúng phạm vi đã khoá của
`tsk-3ik`'s D3 (`docs/history/native-first-dispatch-doctrine-phase-4-unify-
capacity-and-task-dispatch/CONTEXT.md`: *"the shared decision protocol must
govern BOTH `capacities.<id>` config-driven dispatch AND any skill's direct
Agent/Task-tool subTask calls"*) sang 1 loại target D3 lúc đó chưa phủ tới —
work-item, dispatch qua `fgos-fanout`. `tsk-3ik` tự ghi lúc đó "zero existing
direct Task/Agent-tool call sites" trong skill catalog; `fgos-fanout` ra đời
sau, hardcode thẳng Agent tool, chưa từng được wire vào decision protocol đã
khoá — đây là ca không tuân thủ 1 doctrine đã chốt, không phải lỗ hổng kiến
trúc chưa ai nghĩ tới.

## 2. Mục tiêu & đề bài

fgOS có 1 kernel dùng chung (`resolveExecutorConfig`, `dispatch.mjs:674`) để
resolve 1 capacity ra 1 backend thật, nhưng 2 caller đi vào nó theo 2 đường cấu
trúc khác hẳn nhau (Flow A — skill tự CLI round-trip; Flow B — `fgos-runner`
compiled, in-process) và có ít nhất 1 producer thật (`fgos-fanout`) hoàn toàn
không đi qua nó. Đối chiếu với `marketing-cockpit` (framework anh em, cùng gốc
`.fgOS/`, khác dòng máu code) lộ ra model của họ gọn hơn: MỌI đơn vị công việc
— dù là task đăng ký sẵn hay workflow stage — đều đi qua đúng 1 hàm `run_task()`
duy nhất, hàm này TỰ THỰC THI cho mọi case tự làm được (cli/api/task-khác-family)
và CHỈ hand-back cho agent đúng 1 case (native, cùng family, có session sống).
Đề bài của phiên này: xác định fgOS có nên tổng quát hoá dispatch theo đúng mô
hình đó không, những field/khái niệm nào đang cản trở việc đó (`needs`, tên gọi
"backend" vs "executor", ranh giới `for`/`needs`), và những capacity/producer cụ
thể nào cần sửa lại theo hướng này (`gather`, `fgos-fanout`, `fgos-researching`).

## 3. Vấn đề rõ / chưa rõ

| # | Vấn đề | Trạng thái |
|---|---|---|
| 1 | `judge-discovery`/`judge-decompose` cùng khai `for:"judge"` — `resolveCapacityIdForPurpose` (dispatch.mjs:666) chỉ trả entry ĐẦU TIÊN khớp, nên `judge-decompose` không bao giờ được purpose-lookup chọn, chỉ tới được qua gọi thẳng id. | **CHƯA RÕ** — cố ý (mỗi skill tự biết gọi đúng id, `for` chỉ để gom nhóm/tài liệu hoá) hay gap chưa ai để ý — cần đọc lịch sử `judge-discovery`/`judge-decompose` riêng trước khi kết luận. |
| 2 | Cần 1 prose/skill helper CHUNG làm "ngõ vào" dispatch cho MỌI producer nội bộ (research, fanout, tương lai) — không phải mỗi producer tự viết lại logic gọi dispatch. | **MỚI NÊU (vòng 1)**, chưa qua vòng xác nhận thứ 2 — chưa mint D-ID theo đúng hard rule của skill này. Bằng chứng ủng hộ đã có: `fgos-researching` đã phải viết lại `decide --for`/`resolve --for` ngay trong SKILL.md của nó thay vì gọi `_shared/capacity-dispatch-fallback.md`, vì fragment đó viết cho `<CAPACITY_ID>` cố định, chưa support purpose-based lookup khi `tsk-2ie5` thêm `for`/`needs`. |
| 3 | Hợp đồng "muốn chạy 1 task thì gọi dispatch" nên được tuyên bố Ở TẦNG HARNESS (`AGENTS.md`), như 1 khối MUST/NEVER giống `CLAUDE.md`'s GitNexus block — để agent NGOÀI luồng 1 skill cụ thể cũng tự biết cửa vào, không cần đợi skill nạp prose. | **MỚI NÊU (vòng 1)**, ngay sau #2, cùng vòng — chưa qua vòng xác nhận riêng, chưa mint D-ID. Khác biệt với #2: #2 là producer NỘI BỘ (đã có skill chủ động gọi), #3 là phủ trường hợp CHUNG (agent bất kỳ, ngoài skill catalog fgOS). |

## 4. Quyết định đã chốt

| D-ID | Quyết định |
|---|---|
| D1 | **Retire field `needs` khỏi `capacities.<id>`.** Bằng chứng: `resolveExecutorConfig` (dispatch.mjs:692) chỉ chạy gate `needs` khi `capacity.kind !== 'task'` — nhưng 2/3 entry thật trong `.fgos/config.json` (`judge-discovery`, `judge-decompose`) là `kind:"task"`, nên `needs:"llm-judgment"` trên cả 2 là data chết 100%, code không bao giờ đọc. Entry thứ 3 (`gather`, kind:"cli") có `needs` sống nhưng không thêm tín hiệu nào ngoài việc OS tự throw ENOENT nếu binary thiếu — chỉ đổi chỗ throw sớm hơn với message thân thiện hơn. Lý do gốc `needs` sinh ra (staleness gate kiểu GitNexus, `tsk-1o7`/US-027) chưa từng có executor thật nào dùng tới (GitNexus chưa bao giờ là 1 `capacities.<id>` entry — agent gọi MCP trực tiếp). Giữ nguyên tool-registry + `fgos tool query --status present/stale` làm nơi hỏi staleness trực tiếp tại điểm gọi — không cần dispatch.mjs tái tạo gate này. |
| D2 | **Đặt tên "executor", không "backend".** Đã khớp sẵn code (`resolveExecutorConfig`/`resolveExecutorCommand`/`EXECUTOR_ADAPTERS`), khớp ADR0042 gốc ("task-first-routing-and-executor-kinds"), khớp chính file thật của marketing-cockpit (`executor-registry.yaml`, key theo tên executor: agy/claude/codex). "backend" chỉ xuất hiện 1 lần trong report trước do tự trôi thuật ngữ giữa 2 đoạn, không phải quyết định thật — không cần sửa code (đã đúng sẵn), chỉ là kỷ luật đặt tên cho tài liệu/thảo luận về sau. |
| D3 | **`for`/`needs` là 2 trục trực giao: JOB vs MECHANISM**, không phải cùng 1 khái niệm. `for` = việc được giao (job, dùng để purpose-lookup, enum `gather`/`judge`). `needs` = cơ chế phải có mặt để chạy (mechanism, dependency gate — dù D1 đã quyết retire field này khỏi capacity, trục khái niệm vẫn đúng, chỉ nơi hỏi chuyển sang tool-registry trực tiếp). Executor càng chuyên biệt (gitnexus, nếu có entry) thì `for`==`needs` càng tự nhiên trùng; executor càng tổng quát (agy, có thể phục vụ nhiều job) thì càng tách xa. Phép thử: "executor này có thể bị giao việc KHÁC mà vẫn dùng đúng cơ chế này không?" — có thì `for` phải khác mechanism-gate, không thì trùng là đúng, không phải lỗi. |
| D4 | **Tổng quát hoá dispatch quanh khái niệm "task"** (mượn vocab marketing-cockpit), là MỞ RỘNG đúng phạm vi đã khoá của `tsk-3ik`'s D3, không phải ý tưởng mới. 4 hình dạng hiện có của fgOS (`work`-item đầy đủ lifecycle, `childwork`/exec-packet B2 còn gated chưa ship theo `two-layer-dispatch` D4, `capacity` đã đăng ký, `adhoc-packet` 6-field runtime-composed theo `two-layer-dispatch` D3/D6) đều là "task" theo nghĩa tổng quát. Tầng SẢN XUẤT (fgos-researching tính+chia việc research, fgos-fanout tính+chia wave/work-item) chỉ lo tính và chia — KHÔNG tự quyết cơ chế thực thi. Tầng DISPATCH (1 cơ chế dùng chung, đã tồn tại 1 phần qua `decideCapacityDispatchMechanism`/Native-First Dispatch Doctrine 4 quy tắc) nhận bất kỳ hình dạng task nào, quyết executor tại runtime — native subagent chỉ là 1 kết quả có thể của quyết định này (Quy tắc 2 của `docs/decisions/0026`: cùng provider + cần soul → ưu tiên native), không phải đường đi riêng nằm ngoài dispatch. Bằng chứng gap cụ thể: Flow B (`capacityIdForWork`, dispatch.mjs:1090) đã model hoá "thực thi 1 work-item" như capacity-dispatch qua domain+stage — nhưng `fgos-fanout` (Flow A, đồng bộ trong-session) hardcode thẳng Agent tool, chưa từng consult decision protocol này, dù đúng phạm vi `tsk-3ik`'s D3 đã tuyên bố phải làm. |
| D5 | **`dispatch.mjs` cần tự thực thi (self-execute) cho case adapter-resolvable, khớp `run_task()` của marketing-cockpit** (đã đọc `task-executor.py:550-611`: tự gọi adapter, trả kết quả thật, cho mọi case `via=cli/api/task-khác-family`; CHỈ hand-back đúng 1 case `via=task` cùng-family-có-session-sống). fgOS's Flow A (`resolveCapacityCli`) hôm nay LUÔN hand-back `{command,args}` cho agent tự chạy qua Bash — kể cả case `cli` lẽ ra tự thực thi được. `EXECUTOR_ADAPTERS['cli-spawn']` được validate (dispatch.mjs:895) nhưng KHÔNG BAO GIỜ được gọi trong Flow A, chỉ Flow B (`spawnWorker`) mới tự gọi. Cần 1 subcommand mới (`execute`/`dispatch`) tự gọi `EXECUTOR_ADAPTERS[adapter](...)` ngay trong CLI cho mọi case tự làm được, chỉ trả `spawn_instruction`-shaped result cho case in-process — đây là nền tảng D4 cần để có nơi thật cho nhánh "out-of-process" của mọi hình dạng task, không riêng capacity. |
| D6 | **Xoá capacity `gather` khỏi `.fgos/config.json`.** Con đường cross-provider DUY NHẤT trong hệ; không có quyết định kiến trúc nào ghi lại lý do cần cross-provider cụ thể (plan.md gốc `tsk-2ie5` tự ghi "provider... not decided in this plan, not guessed ahead of time"). Lý do thật duy nhất có ghi lại ("song song hoá, rút ngắn wall-clock") đã được native Task-tool đáp ứng đủ. `fgos-researching`'s SKILL.md đã tự coi "không có gather capacity" là "the common/default path today" — xoá an toàn, revert về hành vi trước `tsk-2ie5`. Qua ngưỡng ≥2 vòng: điều tra bằng chứng (vòng 1) → hỏi thẳng lý do cross-provider, không tìm thấy → chốt xoá (vòng 2). |

## 5. Q&A log

- **Vòng 1, đoạn a (2026-08-14 ~13:26).** Người dùng yêu cầu đọc lại report
  `capacity-dispatch-260813-1723...` và trình bày chi tiết data-structure của
  "capacity-registry". Scout: đọc report đầy đủ, tách rõ Tầng 1 (tool-registry,
  fact table) vs Tầng 2 (executor-registry/`runner.capacities`, config table),
  nối bằng `needs`→`capability` — không map theo `name`.
- **Vòng 1, đoạn b (~13:35).** Người dùng đề xuất framing "capacity = lời hứa,
  executor = hiện thực hoá lời hứa", muốn tư vấn Opus. Opus quá tải (529) 2 lần
  — chạy bằng Sonnet thay thế theo lựa chọn người dùng. Verdict: giữ 2 bảng
  tách riêng (không gộp) — capability-với-0-executor là bằng chứng thật
  (`impact-analysis`/GitNexus), khoá ngoại `needs→capability` chính là chỗ DRY.
- **Vòng 1, đoạn c (~13:51).** Người dùng hỏi "executor" hay "backend" hợp lý
  hơn cho tên gọi Tầng 2. Xác nhận "executor" đúng — khớp code/ADR0042/
  marketing-cockpit, "backend" chỉ là report tự trôi thuật ngữ → **D2**.
- **Vòng 1, đoạn d (~13:58–14:08).** Người dùng chưa rõ ranh giới `for`/`needs`,
  yêu cầu "step back" thảo luận lại. Đề xuất khung JOB vs MECHANISM. Người dùng
  phản hồi "for map vào capacity, needs không đâu dùng" — scout bằng
  `.fgos/config.json` thật + đọc `resolveExecutorConfig` dòng 692, xác nhận
  đúng 2/3, phát hiện phụ vụ collision `judge-discovery`/`judge-decompose` cùng
  `for` → **D3** + vấn đề mở #2.
- **Vòng 1, đoạn e (~14:20).** Người dùng chốt "needs cần retire bởi vì chính
  executor là đơn vị fulfillment rồi" → **D1**, kèm đánh đổi UX (mất message
  lỗi sớm) đã nêu rõ.
- **Vòng 1, đoạn f (~14:29).** Người dùng yêu cầu "ghi nhận vào tài liệu
  trước", rồi NGAY LẬP TỨC (giữa turn) đổi hướng: "lật lại vụ gather, sẽ không
  có executor gather, tìm các chỗ liên quan". Scout toàn bộ điểm chạm `gather`
  trong code/skill/docs/test → vấn đề mở #1.
- **Vòng 1, đoạn g (~14:53).** Người dùng hỏi thẳng "gather đẩy việc gì ra
  ngoài, tại sao cần provider khác". Đọc `plan.md` gốc `tsk-2ie5` +
  `why-fgos-dispatch-splits-into-gather-packets...md` — xác nhận: lý do
  "song song hoá" đã đủ với native, KHÔNG có lý do kiến trúc nào cho
  cross-provider cụ thể.
- **Vòng 1, đoạn h (~14:59).** Người dùng phát hiện `fgos-researching` VÀ
  `fgos-fanout` đều embed 1 phần logic dispatch, đề xuất tách 1 skill chung.
  Đọc `_shared/capacity-dispatch-fallback.md` (đã tồn tại, DRY-motivated từ
  `tsk-53h`) + `fgos-fanout` SKILL.md — xác nhận đúng 1 nửa (research diverge
  khỏi fragment vì fragment thiếu purpose-based support — DRY debt thật) và
  phản biện 1 nửa (fanout dispatch work-item, khác lớp gather-packet theo
  `two-layer-dispatch`'s "does it write a file" axis — không nên gộp LOGIC
  TÍNH-VIỆC, chỉ nên gộp ĐIỂM GỌI DISPATCH).
- **Vòng 1, đoạn i (ultrathink, ~14:53→15:0x).** Người dùng đưa khung: dispatch
  = dispatch task (mượn vocab marketing-cockpit, tổng quát 4 hình dạng
  work/childwork/capacity/adhoc-packet); tầng sản xuất (research/fanout) chỉ
  tính+chia việc, tầng dispatch quyết executor tại runtime, native subagent chỉ
  là 1 kết quả có thể. Xác nhận đúng, chỉ ra Flow B (`capacityIdForWork`) đã
  làm 1 nửa, `fgos-fanout` là ngoại lệ chưa tuân theo → **D4** (sau khi grounding
  thêm với `tsk-3ik`/`docs/decisions/0026` ở vòng ghi tài liệu).
- **Vòng 1, đoạn j.** Người dùng hỏi đã học cơ chế `run_task()` của
  marketing-cockpit chưa (tự thực thi case làm được, hand-back case native).
  Xác nhận đã học từ report gốc, đối chiếu ra gap cụ thể: Flow A của fgOS
  không bao giờ tự thực thi, `EXECUTOR_ADAPTERS` chỉ được Flow B gọi → **D5**.
- **Vòng 1, đoạn k.** Người dùng yêu cầu "ghi nhận chuỗi kết luận", thêm điểm
  mới: cần 1 prose/skill helper chung ở đầu agent làm ngõ vào dispatch cho MỌI
  producer, điểm kích hoạt gốc luôn từ agent → vấn đề mở #3. Bắt đầu quy trình
  `fgos-coding-shaping`: `fgos submit` → `tsk-5tm`, `fgos pick`, vào worktree.
- **Vòng 1, đoạn l (giữa lúc ghi tài liệu).** Người dùng bổ sung thêm: hợp đồng
  này nên tuyên bố Ở TẦNG HARNESS (`AGENTS.md`), giống khối MUST/NEVER của
  GitNexus trong `CLAUDE.md`, để agent ngoài luồng skill cụ thể cũng biết cửa
  vào → vấn đề mở #3. Đọc thêm `docs/decisions/0026` (4 quy tắc chọn dispatch)
  + `tsk-3ik` CONTEXT.md để grounding D4 đúng vị trí (mở rộng doctrine đã khoá,
  không phải phát minh mới).

- **Vòng 2, đoạn a.** Người dùng chốt "1. xoá gather" — vấn đề mở cũ #1
  (gather) chuyển thành **D6**. Ghi `fgos decision` D6.
- **Vòng 2, đoạn b.** Người dùng hỏi "chỗ nào cần thảo luận" trước khi chốt
  hẳn việc cần làm. Scout xác nhận `why-fgos-dispatch-splits-into-gather-
  packets...md` KHÔNG bị ảnh hưởng (dùng "gather" làm tên khái niệm packet,
  không nhắc capacity/config thật) — loại khỏi scope. Nêu 4 điểm thật sự cần
  quyết (không chỉ xoá cơ học): (A) giữ hay xoá tool-registry entry
  `gather`→`prompt-completion`; (B) giữ hay bỏ `'gather'` khỏi
  `CAPACITY_PURPOSES` enum; (C) 2 doc explanation dùng `gather`/`needs` làm ví
  dụ chính — sửa ví dụ/đánh dấu lỗi thời/để nguyên; (D) trim hay giữ đoạn
  "check gather-purpose capacity" trong `fgos-researching`'s SKILL.md.
- **Vòng 2, đoạn c.** Người dùng chốt cả 4: **A. xoá** (tool-registry entry đi
  cùng capacity, không giữ speculative); **B. bỏ cả `'gather'` khỏi enum**
  ("capacity đã là purpose rồi" — không cần giữ 1 enum value không ai dùng,
  purpose mới sau này tự thêm lại khi có nhu cầu thật) — hệ quả cụ thể: 11 chỗ
  trong `test/runner/dispatch.test.mjs` dùng `for: 'gather'` làm fixture, phải
  đổi sang `for: 'judge'` (giá trị enum còn lại) khi B thực thi; **C. sửa lỗi
  thời** (chủ động cập nhật nội dung, không chỉ đánh dấu lịch sử) — how-to đổi
  ví dụ sang entry thật còn sống (`judge-discovery`), doc `dispatch-binding-
  moves-from-name-keying...md` viết lại phần mô tả `needs` phản ánh đúng D1
  (đã retire); **D. bỏ** đoạn "check gather-purpose capacity" khỏi
  `fgos-researching`'s SKILL.md — không giữ bảo hiểm cho 1 nhánh không còn kỳ
  vọng quay lại. 4 quyết định này gộp vào scope thực thi của D6, không mint
  D-ID riêng (chi tiết thực thi, không phải quyết định kiến trúc mới).

## 6. Thiết kế đã chốt {#design}

fgOS có 1 doctrine dispatch đã khoá (`docs/decisions/0026`, Native-First
Dispatch Doctrine): với 1 target cần "soul" (suy luận, không thuần cơ học),
cùng provider với phiên đang chạy → ưu tiên native; khác provider → bắt buộc
cli/spawn; config có thể ép cli/spawn cho mục đích cách ly tài nguyên (ngoại lệ
hợp lệ). `tsk-3ik` (Phase 4) đã hiện thực hoá 1 lớp quyết định tự động áp 4 quy
tắc này cho `capacities.<id>` (`decideCapacityDispatchMechanism`, `mechanism:
in-process/out-of-process`) — nhưng phạm vi D3 của nó ("mọi call site Task/
Agent-tool trực tiếp phải qua cùng decision protocol") chưa từng được thực thi
cho `fgos-fanout`, vì skill đó chưa tồn tại lúc `tsk-3ik` viết.

Thiết kế đã chốt của phiên này là ĐÓNG đúng khoảng trống đó, theo đúng hình
dạng `run_task()` của marketing-cockpit đã đối chiếu:

- **Producer layer** (fgos-researching, fgos-fanout, tương lai thêm) chỉ tính
  việc + chia việc thành TASK — không tự quyết cơ chế thực thi. 4 hình dạng
  task tương ứng 4 khái niệm hiện có của fgOS: `work` (work-item đầy đủ
  lifecycle), `childwork` (exec-packet B2, còn gated theo `two-layer-dispatch`
  D4, chưa ship), `capacity` (đã đăng ký, `gather`/`judge-*`), `adhoc-packet`
  (6-field runtime-composed, theo `two-layer-dispatch` D3/D6).
- **Dispatch layer** (1 cơ chế dùng chung, mở rộng từ hạ tầng `tsk-3ik` đã có)
  nhận bất kỳ hình dạng task nào, áp 4 quy tắc của `docs/decisions/0026` tại
  runtime: TỰ THỰC THI (gọi `EXECUTOR_ADAPTERS[adapter]`, trả kết quả thật) cho
  mọi case adapter-resolvable (D5) — CHỈ hand-back `{agentType, prompt}` cho
  agent tự gọi Task tool đúng 1 case: native, cùng family, có session sống.
- **Điểm kích hoạt gốc luôn từ agent** — dispatch.mjs là CLI/thư viện thụ động,
  không tự chủ động gọi ai. Cần đúng 1 prose/skill helper chuẩn (mở rộng
  `_shared/capacity-dispatch-fallback.md`, hiện chỉ support `<CAPACITY_ID>` cố
  định) làm ngõ vào DUY NHẤT cho mọi producer nội bộ — KHÔNG gộp logic
  tính-việc riêng của từng producer, chỉ gộp điểm gọi dispatch (vấn đề mở #3).
  Song song, cân nhắc tuyên bố hợp đồng này ở tầng harness (`AGENTS.md`, khối
  MUST/NEVER kiểu GitNexus) để phủ agent ngoài luồng skill catalog (vấn đề mở
  #4) — 2 tầng phủ khác nhau: #3 là nội bộ (đã chủ động), #4 là phổ quát.

```mermaid
flowchart TD
    subgraph Producer["Tầng sản xuất — chỉ tính + chia việc"]
        R["fgos-researching<br/>tính research branch"]
        F["fgos-fanout<br/>tính wave"]
    end

    subgraph Tasks["4 hình dạng task (đều là 'task' tổng quát)"]
        T1["work<br/>work-item đầy đủ lifecycle"]
        T2["childwork<br/>exec-packet B2 — GATED, chưa ship"]
        T3["capacity<br/>đã đăng ký (gather/judge-*)"]
        T4["adhoc-packet<br/>6-field runtime-composed"]
    end

    subgraph Dispatch["Tầng dispatch — 1 cửa chung, quyết tại runtime"]
        D["dispatch.mjs<br/>áp 4 quy tắc 0026"]
        Rule2{"cùng provider<br/>+ cần soul?"}
    end

    R -->|sinh| T3
    R -->|sinh| T4
    F -->|sinh| T1

    T1 --> D
    T2 -.->|chưa ship| D
    T3 --> D
    T4 --> D

    D --> Rule2
    Rule2 -->|có, D5: adapter-resolvable| SelfExec["dispatch TỰ GỌI<br/>EXECUTOR_ADAPTERS[adapter]<br/>trả kết quả thật"]
    Rule2 -->|native, cùng family, session sống| HandBack["dispatch trả<br/>{agentType, prompt}<br/>agent TỰ gọi Task tool"]

    style T2 stroke-dasharray: 5 5
```

## 7. Danh mục hạng mục / task {#tasks}

Chỉ tạo task cho các quyết định đã CHỐT (D1/D4/D5/D6) — vấn đề mở (§3) chưa đủ
chín để shape thành task, và D2/D3 là kỷ luật đặt tên/khái niệm không cần code
mới (D2: code đã đúng sẵn; D3: đã áp dụng ngay trong quyết định retire D1).

### `#task-remove-gather` (D6, phạm vi A/B/C/D đã chốt vòng 2)

- **Mục tiêu:** Xoá hoàn toàn capacity `gather` và mọi thứ chỉ tồn tại để phục
  vụ nó — không để lại config chết, enum chết, hay doc trỏ vào ví dụ không còn
  tồn tại.
- **Việc cụ thể:**
  1. Xoá block `capacities.gather` khỏi `.fgos/config.json`.
  2. (A) Xoá tool-registry entry `{"name":"gather","kind":"cli",
     "capability":"prompt-completion","command":"agy"}` cùng lúc — không giữ
     speculative.
  3. (B) Bỏ `'gather'` khỏi `CAPACITY_PURPOSES` (`dispatch.mjs:406`) —
     `Object.freeze(['gather', 'judge'])` → `Object.freeze(['judge'])`. Kéo
     theo: 11 chỗ trong `test/runner/dispatch.test.mjs` dùng `for: 'gather'`
     làm fixture (không phải test entry thật, chỉ mượn tên) phải đổi sang
     `for: 'judge'` để không vỡ `validateCapacityShape`'s enum check.
  4. Sửa test `test/runner/dispatch.test.mjs:651-657` (assert cứng "committed
     .fgos/config.json declares the gather capacity") — xoá hẳn, không còn
     điều đó đúng.
  5. (C) `docs/how-to/wire-a-skill-to-a-capacity-by-purpose-not-name.md` —
     đổi ví dụ chính sang 1 entry thật còn sống (`judge-discovery`).
  6. (C) `docs/explanation/dispatch-binding-moves-from-name-keying-to-needs-
     for-capability-declaration.md` — viết lại phần mô tả `needs` phản ánh
     đúng D1 (field đã retire, tool-registry + `fgos tool query` là nơi hỏi
     staleness trực tiếp), không chỉ đổi ví dụ.
  7. (D) Trim đoạn "check gather-purpose capacity trước mỗi fan-out" (dòng
     58-78) khỏi `fgos-researching`'s SKILL.md (`.agents/skills/fgos-
     researching/SKILL.md`) — luôn native, không còn nhánh nào khác để mô tả.
- **Trích §4:** *"`fgos-researching`'s SKILL.md đã tự coi 'không có gather
  capacity' là 'the common/default path today' — xoá an toàn"*.
- **D-ID áp dụng:** D6.
- **Quan hệ:** độc lập với `#task-retire-needs`/`#task-dispatch-self-execute`/
  `#task-fanout-consult-dispatch` — không phụ thuộc chéo, có thể làm riêng.
  Lưu ý thứ tự nội bộ: bước 6 (sửa doc `needs`) nên làm SAU khi
  `#task-retire-needs` (D1) đã landed, để doc phản ánh đúng field đã thật sự
  bị xoá khỏi code, không chỉ dự đoán trước.
- **Verify nháp:** `npm test` xanh; `grep -rn "gather" .fgos/config.json`
  không còn khớp gì; `grep -n "'gather'" src/runner/dispatch.mjs` chỉ còn xuất
  hiện trong comment/lịch sử, không còn trong `CAPACITY_PURPOSES`; `fgos tool
  query --capability prompt-completion` trả rỗng (không còn provider nào đăng
  ký).

### `#task-retire-needs` (D1)

- **Mục tiêu:** Xoá field `needs` khỏi 3 entry `.fgos/config.json` +
  `validateCapacityShape` + khối gate `resolveExecutorConfig` dòng 692-707.
- **Trích §6:** *"CHỈ hand-back... cho agent tự gọi Task tool đúng 1 case"* —
  `needs` không thuộc quyết định đó, nó là gate độc lập đã xác nhận chết/thừa.
- **D-ID áp dụng:** D1.
- **Quan hệ:** độc lập, không phụ thuộc task nào khác trong danh sách này.
- **Verify nháp:** `npm test` xanh; `grep -n "needs" src/runner/dispatch.mjs`
  không còn xuất hiện trong khối gate của `resolveExecutorConfig`; `.fgos/
  config.json` không còn field `needs` ở cả 3 entry.

### `#task-dispatch-self-execute` (D5)

- **Mục tiêu:** Thêm subcommand `execute`/`dispatch` mới cho `dispatch.mjs` —
  tự gọi `EXECUTOR_ADAPTERS[adapter](...)` ngay trong CLI cho mọi case
  adapter-resolvable, chỉ trả `spawn_instruction`-shaped result cho case
  in-process — khớp hành vi `run_task()` của marketing-cockpit.
- **Trích §6:** *"TỰ THỰC THI... cho mọi case adapter-resolvable (D5) — CHỈ
  hand-back... đúng 1 case: native"*.
- **D-ID áp dụng:** D5.
- **Quan hệ:** NỀN TẢNG cho `#task-fanout-consult-dispatch` — case
  out-of-process của task work-item cần chỗ thật để dispatch tự chạy, không chỉ
  trả command cho agent tự đứng ra làm thay adapter như Flow A hôm nay.
- **Verify nháp:** test mới — gọi subcommand với 1 capacity `kind:"cli"` thật,
  xác nhận adapter được GỌI (không chỉ validate), kết quả trả về là output
  thật của subprocess, không phải `{command,args}` trần; case `kind` native
  vẫn trả `spawn_instruction` không tự thực thi.

### `#task-fanout-consult-dispatch` (D4)

- **Mục tiêu:** Wire `fgos-fanout` gọi dispatch decision protocol (tương tự
  `capacityIdForWork`-shaped resolution) TRƯỚC KHI fire batch Agent, thay vì
  hardcode thẳng Agent tool — đúng phạm vi D3 của `tsk-3ik` chưa từng thực thi
  cho producer này.
- **Trích §6:** *"`fgos-fanout` (Flow A, đồng bộ trong-session) hardcode thẳng
  Agent tool, chưa từng consult decision protocol này, dù đúng phạm vi
  `tsk-3ik`'s D3 đã tuyên bố phải làm"*.
- **D-ID áp dụng:** D4.
- **Quan hệ:** phụ thuộc `#task-dispatch-self-execute` landing trước (nhánh
  out-of-process cần chỗ thật để đi tới); quan hệ với vấn đề mở #3 (shared
  prose helper) — helper đó là nơi tự nhiên để đặt lời gọi consult này, nhưng
  #3 chưa chốt nên task này có thể tự đứng độc lập nếu #3 chưa sẵn sàng.
- **Rủi ro cần xử ở planning:** latency thêm — mỗi candidate trong batch cần 1
  lượt `decide` trước khi fire, có thể cộng dồn round-trip trước khi parallel
  dispatch thật sự bắt đầu; cần đo wall-clock, không giả định rẻ.
- **Verify nháp:** đo wall-clock 1 batch fanout trước/sau — vẫn chạy song song
  thật (không tuần tự hoá); test xác nhận `decide` được gọi 1 lần mỗi candidate
  trước khi Agent tool được fire.

## Outstanding questions

Chưa đủ chín để tạo task — cần quay lại hỏi người dùng trước khi shape:

- **Vấn đề mở #1 (`judge-discovery`/`judge-decompose` purpose collision):** cố
  ý hay gap? Cần điều tra lịch sử riêng trước khi quyết có sửa
  `resolveCapacityIdForPurpose` hay không.
- **Vấn đề mở #2 (shared prose helper cho producer nội bộ):** mở rộng
  `_shared/capacity-dispatch-fallback.md` support `<CAPACITY_ID>` cố định +
  `--for <purpose>` + input work-item-shaped — cần giữ qua ít nhất 1 vòng nữa
  trước khi mint D-ID, theo đúng hard rule của skill này.
- **Vấn đề mở #3 (tuyên bố ở `AGENTS.md` tầng harness):** đặt ở `AGENTS.md` hay
  `CLAUDE.md` gốc? Nội dung cụ thể của khối MUST/NEVER trông ra sao (tham chiếu
  `CLAUDE.md`'s GitNexus block làm mẫu)? Cũng cần giữ qua ≥1 vòng nữa.
- **Bundle hay tách item:** `#task-retire-needs` và `#task-remove-gather` độc
  lập hoàn toàn, có thể tách riêng ngay (lưu ý thứ tự nội bộ nhẹ giữa 2 task
  này — xem `#task-remove-gather`'s "Quan hệ"). `#task-dispatch-self-execute`
  + `#task-fanout-consult-dispatch` có phụ thuộc tuần tự thật — giữ chung 1
  mạch hay tách 2 item với `mergeAfter` là quyết định của `fgos-coding-
  planning`, chưa chốt ở đây.
