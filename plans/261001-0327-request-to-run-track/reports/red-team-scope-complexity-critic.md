# Red-team: Scope & Complexity Critic — track request-to-run (P1–P5 + umbrella)

```txt
Document type: red-team review (plan set, không phải code)
Snapshot: 2026-10-01, main @ b589f4458 (read-only; không chạy state-writing command)
Góc nhìn: SCOPE & COMPLEXITY CRITIC + CONTRACT VERIFIER
Nguồn quyết định (không mở lại): synthesis-260930-1229 §6/§7/§7c/§7d; layer-authority-map-261001-1020
Luật chấm: chỉ flag phần THÊM ngoài yêu cầu owner / ngoài thiết kế đã chốt, và khái niệm/store/abstraction mới trùng cái đã có (RUL11). Nghi ngờ về feature đã yêu cầu → nêu dạng câu hỏi.
```

Mọi `file:line` dưới đây đã kiểm bằng `rg`/`sed` trên main hôm nay. Số đếm consumer ở mục "Verification Results" cuối bài.

---

## Finding 1: `unit-run` là khái niệm + store THỨ TƯ cho "một lần chạy một pattern cho một unit" — synthesis đã đặt tên nó là *coordination session*, và P5 không có dòng nào cho tên mới này

- **Severity:** Critical
- **Location:** P1 `plan.md` §"Hợp đồng dữ liệu" (dòng 66: "Store mới: `.fgos/unit-runs/<unitRunId>/events.jsonl`"), P1 phase-05 §Requirements ("Store `.fgos/unit-runs/...`", "Đăng ký `.fgos/unit-runs/` vào setup/doctor"), P1 phase-04 ("log(event) ... nối vào store `unit-runs`"), P3 phase-02 (thêm `.fgos/workflow-runs/<id>/events.jsonl`), P4 phase-06 ("nguồn coordination trong `packages/observe/rust` thay bằng nguồn `unit-runs` + `workflow-runs`"), P1 `plan.md` Câu hỏi mở 3 (hoãn quyết sang phase 1 refresh).
- **Flaw:** Synthesis §6 D0 bảng thuật ngữ ghi rõ: "Một lần chạy một `CollaborationPattern` cho một unit = **coordination session**"; phân tầng chốt là `Unit → CollaborationPattern → coordination session → assignment/RunResult`. P1 đặt tên mới `unit-run`/`unitRunId`, mở store mới `.fgos/unit-runs`, thêm field `unitRunId` vào RunResult (Rust `packages/run-result`), nhóm Observe theo `unitRunId`, và yêu cầu setup/doctor đăng ký store mới. Đây là **thêm khái niệm + thêm store** đúng chỗ layer-map A7 đã kết luận "nhiều store, không rõ một writer/entity" và giao cho P1 **đóng** (điều chỉnh 4: "A7 do hai việc lẻ + P1 (RunResult một nơi, xoá `dispatch-runs`) đóng"). Thực tế sau P1 số store L7 không giảm: xoá `dispatch-runs` (10 file tham chiếu), thêm `unit-runs`; sau P3 thêm `workflow-runs`; `coordination/sessions` (606 thư mục thật) chỉ xoá ở P4 phase 6 — tức trong ~4–6 tuần hệ thống có **5 store sự kiện** chạy song song (Work events, assignments, coordination sessions, unit-runs, workflow-runs). Bảng thuật ngữ P5 (`plan.md` P5 §Bảng thuật ngữ) không có dòng nào cho `unit-run` → vi phạm "một khái niệm một tên" ngay trong track đặt ra luật đó. Câu hỏi mở 3 ("store mới hay tái dùng shape `coordination-state`") bị hoãn sang phase 1 refresh, nhưng phase 4/5 (sóng B/C) đã thiết kế resume, id tất định `unitRunId/role/round`, `admitRunAttempt`, Observe Rust quanh store mới — quyết định đã bị khoá trước khi "quyết bằng bằng chứng".
- **Failure scenario:** Observe Rust (`scorecard.rs:347,870–914`) hard-code `source == "coordination"` theo `SubjectKind::Session`; P1 phase 5 thêm nguồn `unit-runs`, P3 thêm `workflow-runs`, P4 phase 6 mới gỡ `coordination`. Trong khoảng đó harness scorecard đếm một lần chạy `reviewed` của engine (session) và của mô hình gọn (unit-run) ở hai nguồn khác shape → ca nghiệm thu 1/2/3 so sánh hai đường bằng hai nguồn Observe khác nhau, số liệu không cùng đơn vị. Đồng thời mọi phase 1 refresh của P2–P5 phải scout thêm một store nữa.
- **Evidence:**
  - `src/runner/coordination/store.mjs:2` (`.fgos/coordination/sessions/<id>/`), `:147` (`events.jsonl`), `:327–329` (claim nguyên tử `mkdirSync`) — đúng shape JSONL + claim mà P1 phase 5 mô tả lại cho `unit-runs`.
  - `packages/coordination-state/rust/src/lib.rs:9` (`pub struct CoordinationSource`) — nguồn Observe cho session.
  - `packages/observe/rust/src/scorecard.rs:347,870,877,884,891,898,907,914` — `source: "coordination"` hard-code.
  - `src/runner/dispatch/run-result.mjs:13–15,148–149,290–291` — RunResult contract v2/v3 kiểm cứng version; `packages/run-result/rust/src/lib.rs:207–234` chỉ nhận version 2|3 → thêm `unitRunId` = contract bump thứ tư, không ghi trong plan.
  - `ls .fgos/coordination/sessions | wc -l` = 606; `ls .fgos/assignments | wc -l` = 1019.
  - `rg -n "unit-runs|workflow-runs" src packages docs` = 0 hit (khái niệm hoàn toàn mới, chưa có spec).
- **Suggested fix:** Quyết câu hỏi mở 3 **trước** sóng B, không ở refresh: (a) giữ tên đã chốt *coordination session* cho một lần chạy pattern và tái dùng `src/runner/coordination/store.mjs` (append/claim) với root đổi tên khi P4 xoá engine — không mở store mới; hoặc (b) trạng thái vòng lặp pattern ghi vào chính thư mục assignment (`.fgos/assignments/<unitRunId>/events.jsonl`) vì RunResult đã ở đó, Observe đã đọc đó, không thêm nguồn Rust mới. Cả hai đều "mỗi lần thêm phải xoá được cái gì đó"; phương án hiện tại chỉ thêm.

---

## Finding 2: `bind()` viết lại luật chọn cơ chế mà `mechanism.mjs` đã là hàm thuần — hai bộ quyết cơ chế sống song song từ P1 merge tới P2 phase 4, và bind() bỏ rơi rule 4 (`forceCliSpawn`)

- **Severity:** High
- **Location:** P1 phase-03 §Requirements "Cơ chế" (3 luật: khác provider → out-of-process; cùng provider + context sạch/tier khác/song song → in-process; còn lại inline); P2 phase-04 §Requirements "`dispatch decide`: tính `mechanism` qua `bind()`"; P2 `plan.md` §Mối authority ("`dispatch decide` ... gọi `bind()` — không còn logic chọn cơ chế thứ hai").
- **Flaw:** Hôm nay cơ chế đã có **một** hàm thuần: `decideDispatchMechanism({hasNativeMechanism, hasLiveTaskAccess, forceCliSpawn})` và `compileDispatchPlan` gọi nó ("rather than re-deriving any routing rules"). Hook PreToolUse (`scripts/dispatch-decide-hook.mjs`, nối qua `.claude/settings.json:60`) ép mọi Agent/Task call qua `decide`. P1 phase 3 viết luật mới trong `bind()` với tập đầu vào khác (provider của session, "vai cần context sạch", tier session), **không gọi** `decideDispatchMechanism`, và bỏ `forceCliSpawn` (rule 4, D-ADR0033 "config wins") — tức đổi ngữ nghĩa doctrine Native-First lặng lẽ. P2 phase 4 mới làm `decide` gọi `bind()` — nhưng P2 là plan khác, chạy sau P1 merge `main` và song song P3; khoảng giữa đó skill/hook dùng `decide` (luật cũ) còn `fgos run` dùng `bind()` (luật mới). Đây là A3 "nhiều cửa" được tái tạo ở tầng quyết định thay vì tầng cửa chạy. Đồng thời không plan nào xoá `compileDispatchPlan`/`src/runner/dispatch/plan.mjs` (20K) dù `bind()` thay nó — thêm không xoá.
- **Failure scenario:** Project dùng fgOS khai `executors.codex.forceCliSpawn: true` (validator cho phép, `config.mjs:1030`). `decide` (hook) trả out-of-process; `fgos run` với `bind()` thấy cùng provider + vai producer + tier đủ → `inline`. Cùng Unit, hai câu trả lời; G6 ("không đổi người lặng lẽ") vỡ ở chính lõi mới.
- **Evidence:**
  - `src/runner/dispatch/mechanism.mjs:48–52` — `decideDispatchMechanism` thuần; `:17–47` ghi rõ rule 1/2/4 và vì sao rule 3 (cross-provider) nằm ngoài.
  - `src/runner/dispatch/plan.mjs:1–12` — "calls the existing `decideDispatchMechanism` ... rather than re-deriving any routing rules".
  - `src/runner/dispatch/config.mjs:577,1030–1031` — `forceCliSpawn` là khoá config hợp lệ.
  - `.claude/settings.json:60` — hook `scripts/dispatch-decide-hook.mjs`; `scripts/dispatch-decide-hook.mjs:12` import `decideExecutorCli` trực tiếp (không shell).
  - `src/cli/command-registry.mjs:916` — `dispatch` sub enum còn `decide`, `execute`, `log`.
- **Suggested fix:** P1 phase 3: `bind()` suy ra 3 boolean rồi gọi `decideDispatchMechanism` (giữ rule 4), chỉ bổ sung rule "vai cần context sạch → không inline". Gộp mục "decide gọi bind()" từ P2 phase 4 **vào P1 phase 5** (phase 5 đã sở hữu `cli.mjs`, `bin/fgos.mjs`, `command-registry.mjs`); xoá `compileDispatchPlan`/`plan.mjs` cùng phase. P2 phase 4 chỉ còn DemandFacts/doctrine.

---

## Finding 3: Ba bộ lập lịch theo `dependsOn` mới (P2 `plan-reader.mjs`, P3 `runner.mjs`, P3 `plan-source.mjs`) — fable E1 "không để hai sequencer" bị vi phạm ngay trong plan

- **Severity:** High
- **Location:** P2 phase-03 §Requirements "Lập lịch: `src/runner/execution/plan-reader.mjs` (thuần) đọc Unit[] → sóng theo `dependsOn`; mở worktree cho Unit ghi file"; P3 phase-02 "`src/workflow/runner.mjs`: ... bước sẵn sàng theo `dependsOn`"; P3 phase-04 "`src/workflow/plan-source.mjs`: đọc `plan.md` + `phase-*.md` → Workflow (in-memory)"; P2 `plan.md` §Risk "Driver chung phình thành engine thứ hai"; track `plan.md` §Sở hữu file ("P2 chỉ làm 'một phase'; 'nhiều phase' thuộc P3 phase 4").
- **Flaw:** Synthesis §6 chốt "**Một runner duy nhất** cho Workflow run ... Không để hai sequencer (rủi ro E1 của fable) — phải kiểm khi lập plan". Plan set lập **ba** module mới cùng làm "topological waves over `dependsOn` + chạy song song + gom kết quả": `plan-reader` (Unit trong một phase), `runner` (bước trong Workflow), `plan-source` (phase → bước, rồi lại cần Unit trong phase → gọi `plan-reader`?). Ranh giới "một phase = P2, nhiều phase = P3" là ranh giới **sở hữu plan để chạy song song**, không phải ranh giới domain: một phase có nhiều Unit + `dependsOn` + worktree riêng chính là một Workflow dùng một lần với một bước. Hệ sẵn có đã có `dag-scheduler.mjs` (coordination), `frontier.mjs` (Work), `fanout-batch.mjs` (dispatch) — tức sau track vẫn tồn tại ≥ 3 sequencer thay vì 1.
- **Failure scenario:** `plan-reader` coi hai Unit có `writes` giao nhau nhưng không `dependsOn` là lỗi cứng (P2 phase 2) và chạy sóng song song mỗi Unit một worktree; `runner` (P3) chạy bước có `units[]` nhiều Unit — ai mở worktree, ai kiểm giao nhau? P3 phase 4 "qua plan-lint của P2 nếu đã có, hoặc parser chung" → parser thứ hai cho `- unit:`. Một plan 3 phase chạy "phase 2" (P2 driver) rồi "phase 2..3" (P3) đi hai đường code khác nhau cho cùng phase 2 → kết quả/Observe khác nhau tuỳ cách gọi.
- **Evidence:**
  - `src/verbs/coordination/dag-scheduler.mjs:1–3` — sequencer DAG hiện có (bị xoá ở P4 phase 6).
  - `src/state/frontier.mjs:86,127,162` — `frontier`, `frontierAcrossSteps`, `isDepsAndLineageReady` (sequencer theo deps của Work).
  - `src/runner/fanout-batch.mjs:1–12` — batch song song hiện có, gọi `compileDispatchPlan` + `executeExecutorCli` (đường P1 phase 5 xoá — không plan nào nhắc `fanout-batch.mjs`).
  - `src/runner/worktree.mjs:80–240` — helper worktree hiện có; P2 phase 3 "tái dùng qua interface, không import `src/state/**`" nhưng `worktree.mjs` nằm trong L3 (layer map) → `src/runner/execution/plan-reader.mjs` import nó là vi phạm guard A4 của chính P1.
- **Suggested fix:** Một hàm `waves(units|steps)` duy nhất ở `src/workflow/` (hoặc `src/runner/execution/`), cả "một phase" lẫn "nhiều phase" gọi nó; `plan-source` là parser duy nhất cho plan (plan-lint `--json` chỉ là bề mặt CLI của nó). Nếu P2 phải xong trước P3, đặt hàm sóng vào P2 và P3 import — nhưng xem Finding 4: tách P2∥P3 chính là nguyên nhân sinh ba module.

---

## Finding 4: P2 ∥ P3 chạy song song tốn phối hợp nhiều hơn tiết kiệm — bảng sở hữu file không khớp phase file, cả hai cùng sửa `bin/fgos.mjs` + `command-registry.mjs`, và P3 thiết kế phương án "nếu P2 chưa xong"

- **Severity:** High
- **Location:** track `plan.md` §Lộ trình (P2 "Song song với P3"), §Sở hữu file giữa P2 và P3; P3 `plan.md` §Phases ("nếu P2 chưa xong, P3 phase 4 đặt logic trong `src/workflow/plan-source.mjs` và chỉ nối skill khi P2 xong"); P3 phase-02 §Related Code Files ("Modify: `bin/fgos.mjs`, `src/cli/command-registry.mjs` (verb `workflow`)"); P3 phase-03 (`fgos discover/plan` → Workflow run; `bin/fgos.mjs:1147,1178`); P2 phase-02/04 (`bin/fgos.mjs` verb `plan-lint`, `capability`; `src/verbs/dispatch/**`); P3 phase-05 (`cli.mjs`, `config.mjs`).
- **Flaw:** Bảng sở hữu giao P2 "verb `capability`/`plan-lint` trong `bin/fgos.mjs` + `command-registry.mjs` (chỉ các mục đó)" và **không giao gì** trong `bin/fgos.mjs` cho P3; nhưng P3 phase 2 thêm verb `workflow`, phase 3 sửa `case 'discover'`/`case 'plan'` — cả hai trong `bin/fgos.mjs` (5.155 dòng, một file) và `command-registry.mjs`. P2 phase 4 sửa `src/verbs/dispatch/**` + `decide` (`cli.mjs:691–702` đọc `executor.for`) trong khi P3 phase 5 sửa `cli.mjs`/`config.mjs` (cắt import L3). P2 phase 3 tạo `core/skills/fgos-run/`, P3 phase 4 sửa cùng SKILL.md. Để chạy song song, P3 phải viết **hai nhánh thiết kế** (có P2 / chưa có P2) và P3 phase 4 phải có "parser chung" dự phòng (Finding 3). Chi phí: 2 nhánh plan, 2 lần merge `main` trên cùng file, 1 parser dự phòng, 1 skill viết hai lần. Tiết kiệm: P2 ~5–6d chạy trùng với P3 ~9–11d — chỉ khi không có xung đột, mà bằng chứng trên cho thấy có.
- **Failure scenario:** P2 merge `main` trước (ngắn hơn). P3 phase 1 refresh phải rebase toàn bộ phase 2–6 lên `bin/fgos.mjs`/`command-registry.mjs`/`cli.mjs` mới, và `fgos-run` SKILL.md do P2 viết không biết "nhiều phase" → P3 viết lại phần routing của skill P2 vừa cutover `fgos-code-change` sang. Trường hợp ngược (P3 xong trước) thì P2 phase 3 driver đọc Unit bằng `plan-lint --json` trong khi `plan-source.mjs` đã tồn tại → hai parser (Finding 3). Trong cả hai trường hợp, phase "làm tươi" của plan sau là một plan lại.
- **Evidence:**
  - `bin/fgos.mjs:1147` (`case 'discover'`), `:1178` (`case 'plan'`), `:2309` (`case 'plan-lint'`) — cùng một file cho cả P2 và P3.
  - `src/cli/command-registry.mjs:179` (`discover`), `:206` (`plan`), `:910–916` (`dispatch` + sub enum) — cùng file.
  - `src/runner/dispatch/cli.mjs:691–702` — `decide` đọc `resolvedExecutor.for` (P2 phase 4 chạm), `cli.mjs:21` import `workflow-stage-graphs` (P3 phase 5 chạm).
  - `src/runner/dispatch/config.mjs` — P1 phase 2 (validator), P2 (capability), P3 phase 5 (import state Work) cùng sửa.
- **Suggested fix:** Bỏ song song P2∥P3. Cách rẻ nhất: thu P2 về **hai phase thật** (plan-lint đọc phase file + xoá DemandFacts/facade — không có driver), chuyển driver chung + `plan-reader` vào P3 (nơi runner sống); P3 phase 4 trở thành "một phase hoặc nhiều phase = cùng một runner". Lợi: bỏ hẳn một module, một parser dự phòng, một nhánh thiết kế "nếu P2 chưa xong".

---

## Finding 5: `fgos run record` là cửa ghi kết quả THỨ BA (bên cạnh `executeAssignment` outbox và `fgos dispatch log`), và nó phá tiêu chí "một lệnh chạy trọn Unit" mà phase 5 tự đặt

- **Severity:** Medium
- **Location:** P1 phase-05 §Requirements "Subverb `fgos run record --unit-run <id> --role <r> --result <file>` để Lead ghi kết quả vai inline / in-process"; "nếu `in-process`/`inline`: trả chỉ dẫn ... và **chờ `run record`**"; §Success Criteria "Một lệnh `fgos run` chạy trọn Unit `reviewed` không cần Lead can thiệp giữa vòng (headless)".
- **Flaw:** D4/D8 đã chốt "mọi Ask thành Assignment + RunResult qua `executeAssignment`, kể cả inline (`mechanism: inline`)". Phase 5 thay vì cho `executeAssignment` nhận kết quả inline qua outbox/claim contract đã có (`agent-result-claim-contract.mjs`, `worker-artifacts.mjs`), lại thêm sub-verb mới `run record`, và **không xoá** `fgos dispatch log` — cửa "Lead ghi lại một lần gọi executor trong session" đang tồn tại và được AGENTS.md (L8, luôn nạp) chỉ dẫn. Kết quả: 3 cửa ghi kết quả (outbox, `dispatch log`, `run record`). Nghiêm trọng hơn: với pattern `reviewed` mà reviewer là `in-process` (K1 chính là ca này: author gemini out-of-process, reviewer claude in-process), `fgos run` phải **thoát** sau khi trả chỉ dẫn, Lead gọi Agent tool, gọi `run record`, rồi gọi `fgos run --resume` để vòng lặp đi tiếp — phase 5 không mô tả bước resume này nhưng nó bắt buộc vì process đã kết thúc. Đó là nghi lễ 3–4 lệnh/vai, đúng thứ synthesis Q0 liệt kê là chi phí engine ("Lead gọi 5–8 lệnh cho một thay đổi").
- **Failure scenario:** Ca 1 (phase 8) chạy `reviewed` docs với reviewer claude: bind() → cùng provider với Lead (Claude Code) + vai cần context sạch → `in-process`. `fgos run` không thể "chạy trọn" — Lead-active tăng (tiêu chí 1, 2) đúng ở ca nghiệm thu quyết định số phận mô hình gọn. Nếu lead ép reviewer `out-of-process` để đạt tiêu chí, thì `run record` là code chết ở V1.
- **Evidence:**
  - `src/runner/dispatch-log.mjs:1–30` — `logExecutorDispatch` ghi `executor.dispatch` (có `mechanism`) vào Work event log; AGENTS.md:116 chỉ dẫn `fgos dispatch log` cho mọi out-of-process run. Không plan nào xoá nó.
  - `src/runner/dispatch/agent-result-claim-contract.mjs`, `src/runner/dispatch/worker-artifacts.mjs` — đường nhận kết quả vai đã có (`agent-result.json`, `outbox/result-<round>.json` — P1 phase 6 còn yêu cầu giữ đường này cho worker read-only).
  - `src/cli/command-registry.mjs:916` — `dispatch` sub enum có `log`.
- **Suggested fix:** Chọn một: (a) V1 `reviewed`/`panel` chỉ cho phép vai `out-of-process`; `bind()` từ chối in-process/inline trong pattern ≠ `solo` với lý do rõ (G6) — `run record` không cần tồn tại; hoặc (b) `fgos run` ở lại (resident) và vai in-process ghi kết quả vào đúng outbox assignment (đường hiện có), không có sub-verb mới. Cả hai trường hợp: **xoá `fgos dispatch log`** cùng phase 5 và sửa AGENTS.md ở đó (không đợi P2 phase 4).

---

## Finding 6: "Preset có tên" không có nhà — ba plan cho ba chỗ khả dĩ (module, config `runner.patterns.presets`, `core/protocol-packs/*.json`) cộng Workflow YAML → `fgos-panel` cần bảng tra thứ tư

- **Severity:** Medium
- **Location:** P1 phase-04 §Requirements "bảng preset nằm trong config **hoặc** module, phase 2 schema đã cho chỗ"; P1 `plan.md` §Hợp đồng dữ liệu (`runner.patterns` chỉ có `defaultRule`, `reviewed` — không có `presets`); P4 phase-02 §Requirements "Preset khai ở một nơi (config `runner.patterns.presets` **hoặc** module preset của P1 — theo chỗ P1 đã chọn)", §Related "`src/runner/execution/patterns/index.mjs` (preset) **hoặc** `src/runner/dispatch/config.mjs` + `.fgos/config.json`"; P4 phase-05 "`core/protocol-packs/group-thinking.json` → registry các dạng thảo luận (preset + Workflow) theo tên; **hoặc** xoá nếu `fgos-panel` tra trực tiếp"; P4 `plan.md` §Mối authority "định tuyến yêu cầu thảo luận (`fgos-panel`) chọn preset/Workflow theo tên".
- **Flaw:** Synthesis D0 chốt preset là "tham số cố định" của 3 pattern (`consult`, `research-fan-out`, `rfc`, `code-change`) — tức hình dạng, không phải khẩu vị; khẩu vị đã có chỗ riêng (`checkersByRigor`, `minCheckers`). Plan set để ngỏ "config hoặc module" ở P1, chuyển quyết định sang P4 ("theo chỗ P1 đã chọn"), rồi P4 phase 5 còn mở thêm phương án giữ `core/protocol-packs/*.json` làm registry tên. Ba "hoặc" nối tiếp = không ai quyết; khả năng thực tế là mỗi phase chọn chỗ tiện cho mình: `code-change` ở module (P1), `consult`/`rfc` ở config (P4 phase 2), architecture/business/delphi ở `core/workflows/*.yaml` (P4 phase 3–5), và protocol-pack JSON giữ lại làm "registry". Đây chính là "tùm lum" RUL11.
- **Failure scenario:** `fgos-panel` (P4 phase 5) phải tra 3–4 nguồn để map "rfc" → preset config, "architecture" → YAML, "consult" → module; conformance test P4 phase 2 so engine vs preset nhưng preset nằm ở config project → project khác không có `runner.patterns.presets` → `consult` không tồn tại ở đó (mission #1 vỡ: project dùng fgOS mất năng lực tuỳ config).
- **Evidence:**
  - `.fgos/config.json` — không có khoá `patterns`/`preset` (`rg -n '"patterns"|preset' .fgos/config.json` = 0); `src/runner/dispatch/config.mjs` — không có validator `patterns` (0 hit) → mọi thứ ở đây là mới.
  - `core/protocol-packs/` tồn tại; `src/verbs/coordination/group-thinking-pack.mjs` (20.3K) là gate hiện tại; `src/cli/command-registry.mjs:800` mô tả `pack list|show-protocol|run`.
- **Suggested fix:** Quyết ngay trong P1 phase 4: preset = hằng số code trong `src/runner/execution/patterns/index.mjs` (ship cùng fgOS, mọi project có); config chỉ giữ khẩu vị (`checkersByRigor`, `minCheckers`, `defaultRule`). P4 phase 5: **xoá** `core/protocol-packs` + `group-thinking-pack.mjs`, bỏ chữ "hoặc"; `fgos-panel` tra một bảng tên trong `patterns/index.mjs` + loader Workflow.

---

## Finding 7: P3 phase 2 xây loader YAML 3 tầng + tầng `.fgos/workflows` (project) + `core/workflows` mới, trong khi đã có hai loader (`workflow-stage-graphs.mjs`, `protocol-loader.mjs`) và một trong hai sẽ bị P4 xoá thay vì tái dùng

- **Severity:** Medium
- **Location:** P3 phase-02 §Requirements "Nạp **ba tầng** như `protocol-loader.mjs` hiện có: `core/workflows/*.yaml`, `domains/<d>/workflows/*.yaml`, project `.fgos/workflows/*.yaml`"; "`src/workflow/definition.mjs`: validate Workflow"; P4 phase-06 "Xoá: ... `src/runner/definitions/**` (vỏ `FlowDefinition`, `protocol-loader`, `schema`)"; P3 phase-03 "Delete: `src/state/workflow-stage-graphs.mjs` (logic còn cần chuyển vào `src/workflow/definition.mjs`)".
- **Flaw:** Synthesis D0 chốt Workflow = "`domains/<domain>/workflows/*.yaml`"; không có tầng project `.fgos/workflows` trong quyết định nào — đây là **thêm ngoài thiết kế chốt** (câu hỏi: owner có yêu cầu project override Workflow domain không?). `core/workflows` cho dạng thảo luận là suy diễn hợp lý từ Q8 nhưng cũng chưa chốt vị trí. Về code: `protocol-loader.mjs:17–37` đã là loader 3 tầng project/domain/core đúng y hệt mô tả; P3 viết bản mới "như" nó, rồi P4 phase 6 xoá bản cũ. Giữa P3 merge và P4 phase 6, repo có **ba** loader YAML định nghĩa (stage-graphs cho tới P3 phase 3 xoá, protocol-loader, definition.mjs). Đây là "viết lại thay vì chuyển" — thêm trước, xoá sau, trái bài học §7c.
- **Failure scenario:** `definition.mjs` chọn luật shadow id khác `protocol-loader.mjs` (vd project-first-wins vs error-on-duplicate — `protocol-loader.mjs:45–61` mô tả luật duplicate-id riêng). P4 phase 3 viết `core/workflows/architecture-advisory.yaml` trong khi `core/coordination-protocols/architecture-advisory-panel-v1.yaml` còn sống cho ca so sánh → hai file cùng `id`/tên ở hai loader, conformance test tải nhầm nguồn.
- **Evidence:**
  - `src/runner/definitions/protocol-loader.mjs:17–37` (3 tầng project/domain/core), `:45–61` (luật duplicate id), `:148`, `:191` (`scanTier`, `registerTierEntries`).
  - `src/state/workflow-stage-graphs.mjs:18–19,291,302` — load `domains/<d>/registry.yaml` + `workflows/*.yaml` lúc module-load.
  - `src/runner/definitions/workflow-adapter.mjs:1–20` — bản chiếu Workflow → FlowDefinition "purely additive", consumer duy nhất là doctor check (`registrations.mjs:~3595–3700` theo synthesis) — bằng chứng đã có một lần "viết thêm vỏ rồi không ai dùng".
  - `ls core/workflows src/workflow` → không tồn tại (mới hoàn toàn).
- **Suggested fix:** P3 phase 2 **di chuyển** `protocol-loader.mjs` → `src/workflow/loader.mjs` (tham số hoá thư mục quét), xoá bản cũ cùng phase; P4 phase 6 không còn gì để xoá ở đó. Bỏ tầng `.fgos/workflows` khỏi V1 trừ khi owner nêu ca thật (ghi thành câu hỏi mở, không phải requirement).

---

## Finding 8: P1 gộp 8 phase (~9–11d) trước khi đo, ngược lại thứ tự owner chốt ("bake-off trước, primitive tối thiểu"); nếu ca 1 thua thì toàn bộ nhánh bị mắc kẹt

- **Severity:** Medium
- **Location:** P1 `plan.md` §Phases (sóng B: phase 2+3+4; C: 5; D: 6+7; E: 8 nghiệm thu); P1 phase-08 §Risk "Ca 1 cho thấy mô hình gọn thua → **không merge**"; synthesis §6 "Bước 1 (sắp lại 23:05 theo Q0): **bake-off trước**, chỉ làm những sửa không phụ thuộc engine ... Cần một primitive **tối thiểu** `run --unit --role` bọc `executeAssignment` + `bind()` bản nhỏ đủ cho khẩu vị docs"; §7c "làm gọn trước, đo ngay; chỉ thêm máy móc khi một ca thật thất bại trên bản gọn, có số liệu".
- **Flaw:** Owner đã chốt Q0 nên bake-off không còn để chọn engine, nhưng §7 Q0 vẫn giữ nó là "ca nghiệm thu + đo mốc" và §6 Bước 1 vẫn ghi primitive **tối thiểu** trước. P1 lại dồn vào trước phase 8: Unit schema + validator config + doctor 4 loại (phase 2), bind() 5 mức + provenance + 6 ca âm (phase 3), 3 pattern + preset + resume (phase 4), store mới + verb + `run record` + Q9 cổng ghi file + persona body + RunResult/Observe Rust (phase 5), toàn bộ plan X (read-only posture, quota, herdr, xoá redirect/placement-policy — phase 6), rewire engine qua bind() + xoá `executors.for`/`preferExecutor`/default claude (phase 7). Phần "chỉ thêm máy móc khi ca thật thất bại" (resume giữa vòng, store riêng, quota fallback, herdr, Observe Rust) được xây **trước** ca thật. Phase 8 risk tự thừa nhận: thua → không merge → ~9d trên nhánh.
- **Failure scenario:** Ca 1 thua tiêu chí 4 vì `reviewed` thiếu recheck-disposition (phase 4 risk đã đoán). Theo plan: "bổ sung luật vào `reviewed`, không mang lại engine" — nhưng lúc này phase 6/7 đã xoá `readOnlyRedirects`, `placement-policy`, `executors.for`, default `claude`, và engine đã bị rewire qua `bind()` → không có đường lùi ngắn; owner phải chọn giữa merge một lõi thua ca nghiệm thu hoặc vứt 9d.
- **Evidence:**
  - `rg -l rigorToTier src` = 0 — T chưa merge; P1 chưa thể bắt đầu, còn thời gian sắp lại.
  - Synthesis §6 Bước 1 mục 1 (trích ở trên) — primitive tối thiểu + bake-off là bước đầu tiên theo chính owner.
  - `src/runner/dispatch/assignment-runner.mjs:547` (`resolveMutatingCwdPosture`), `:694` (`admitRunAttempt`) — phần nền đã có; primitive tối thiểu chỉ cần bọc, không cần store mới.
- **Suggested fix:** Tách P1 thành P1a (phase 2 rút gọn: `validateUnit` + `capabilities.<cap>.prefer/persona` đọc từ config hiện có; phase 3 bind() cho docs taste; phase 4 chỉ `solo`+`reviewed` không resume; phase 5 verb `run` bọc `executeAssignment`, **không** store mới; phase 8 ca 1) và P1b (resume/store, persona body, X, phase 7, Observe Rust) chỉ mở khi ca 1 có số liệu chỉ ra phần thiếu. Đây là thứ tự owner đã chốt, không phải cắt scope.

---

## Finding 9: Phase 6 (gộp plan X) đặt một brainstorm bảo mật 4 câu hỏi của owner **bên trong** phase triển khai, và mọi requirement của phase đều phụ thuộc câu trả lời

- **Severity:** Medium
- **Location:** P1 phase-06 §Requirements "Bước 0 — quyết thiết kế bảo mật (owner): chạy `/ak:brainstorm` ngắn trên 4 câu hỏi của X"; §Risk "Quyết định bước 0 kéo dài → làm phần không phụ thuộc trước"; P1 `plan.md` §Câu hỏi mở 1, 2 (trigger quota; pane herdr) — chưa có câu trả lời; track `phase-01-prerequisites-gate.md` bảng điều kiện — **không có** dòng nào cho các câu hỏi này.
- **Flaw:** Phase 6 có 6 requirement: posture read-only (phụ thuộc Q "OS confinement hay cờ CLI"), `bind()` dùng posture (phụ thuộc posture), worker read-only ghi artefact (phụ thuộc posture), fallback quota (phụ thuộc Q trigger), gộp luật read-only thứ hai (phụ thuộc posture), doctor (phụ thuộc posture + herdr). "Phần không phụ thuộc" thực chất chỉ còn "xoá `readOnlyRedirects` + `placement-policy.mjs`". Fallback quota là code chết hôm nay (synthesis §6b X ràng buộc 4: cần `runner.providers.*.accounts`, không config nào khai) — xây trigger quota mới = thêm máy móc cho ca chưa từng xảy ra, trước khi đo (§7c). Pane herdr (A5) tương tự.
- **Failure scenario:** Owner trả lời bước 0 muộn 3 ngày; phase 7 (cùng sóng D) xong trước; phase 8 chặn bởi 6; worktree phase 6 treo với một nửa requirement; refresh P2/P3 (đã bắt đầu vì "P1 merge" là cổng) phải chờ. Hoặc lead tự chọn "cờ CLI" cho nhanh → đúng lỗi plan tier finding #3 (`claude-cli-readonly` vẫn ghi được file) mà synthesis §6b đã cảnh báo.
- **Evidence:**
  - Synthesis §6b "Fallback khi hết quota: ràng buộc 4: nhánh fallback là **code chết**"; "Trigger quota: quyết trong X".
  - `src/runner/dispatch/provider-capacity.mjs` (41.6K), `provider-adapter.mjs:356–369` (luật read-only thứ hai, theo synthesis) — vùng phase 6 sửa, chưa có quyết định đầu vào.
  - Track `phase-01-prerequisites-gate.md` §Architecture — bảng 8 điều kiện, không có "owner trả lời 4 câu hỏi X".
- **Suggested fix:** Đưa 4 câu hỏi X vào **track phase 1 (cổng điều kiện)** — owner trả lời một lượt trước khi P1 bắt đầu (cùng lúc chờ T merge, không tốn lịch). Phase 6 thu về: posture = `confinement` của capability + invocation confined (đã có: `claude-cli-bwrap`, `confinement: required, host-write-denied`), xoá redirect/placement-policy, doctor quét. Quota + herdr → follow-on có bằng chứng ca thật (ghi vào Câu hỏi mở của track, không phải requirement).

---

## Verification Results — CONTRACT VERIFIER

Đếm consumer thật trên main cho mỗi thay đổi interface plan set nêu; so với số plan ghi. "Plan ghi" = file/phạm vi plan liệt kê để sửa/xoá.

| Interface bị đổi | Plan/phase xoá | Consumer thật (file) | Plan ghi | Lệch |
|---|---|---|---|---|
| `fgos dispatch execute <executor>` (thường) | P1 ph5 | **32 file** (`rg -l "dispatch execute"` core/domains/docs/src/test/AGENTS.md): `AGENTS.md:116` (L8 luôn nạp), `src/cli/command-registry.mjs:911,916`, `src/runner/dispatch/assignment-runner.mjs`, `test/cli/dispatch-operability.test.mjs`, `test/runner/dispatch-confinement-p04.test.mjs`, `test/runner/coordination-stale-action-proof.test.mjs`, `test/runner/dispatch-i08b-remediation.test.mjs`, `docs/how-to/configure-and-operate-agent-confinement.md`, `docs/explanation/dispatch-execute-*.md` (5 file), `docs/doc-registry.{md,json}`, `docs/enduser-docs-index.json`, +15 docs/history & verification | "`rg "dispatch execute"` trong core/, domains/, docs/ và sửa cùng phase" | AGENTS.md:116 chỉ sửa ở **P2 ph4**, không ở P1 ph5 → doctrine luôn-nạp chỉ dẫn lệnh đã xoá trong khoảng P1→P2; `fanout-batch.mjs:9` gọi `executeExecutorCli` không được nhắc |
| `fgos capability match` / `matchCapability` / `deriveForm` / `DemandFacts` | P2 ph4 | **32 file**, 154 dòng: `src/runner/capability-match.mjs`, `bin/fgos.mjs`, `src/cli/command-registry.mjs`, `src/runner/dispatch/config.mjs`, `src/setup/registrations.mjs`, `core/skills/_shared/{capability-catalog,capability-matching,planning-capability-awareness}.md`, `core/skills/fgos-capability-dispatching/SKILL.md`, **`core/skills/fgos-panel/SKILL.md:71`**, **`core/skills/fgos-architecture-panel/SKILL.md:81`**, `domains/coding/skills/fgos-code-change/SKILL.md`, `docs/specs/runner.md`, `docs/platform/packaging-distribution/contracts/skill-package-distribution.md`, 6 test (`test/cli/capability-match*.test.mjs`, `test/runner/capability-match*.test.mjs`, `test/setup/{skill-wrappers,capability-catalog-doctrine}.test.mjs`, `test/skills/coordination-capability-matching-keyword-trigger.test.mjs`, `test/verbs/coordination-binding.test.mjs`) | `_shared/capability-*.md`, `fgos-capability-dispatching`, `fgos-code-change`, matcher tests, `capability-catalog-doctrine.test.mjs` | **`fgos-panel` và `fgos-architecture-panel` gọi `fgos capability match --demand`** nhưng thuộc sở hữu **P4 ph3/ph5** → hai skill gãy từ P2 merge tới P4 (nhiều tuần). `docs/specs/runner.md`, `skill-package-distribution.md`, `skill-wrappers.test.mjs`, `coordination-binding.test.mjs` không được liệt kê |
| verb `fgos discover` / `fgos plan` (P3 Câu hỏi mở 1 đề xuất xoá) | P3 ph3 | `bin/fgos.mjs:1147,1178`; `command-registry.mjs:179,206`; **269 file** nhắc `fgos discover|fgos plan|/fgOS:discover|/fgOS:plan` (core 1, domains 12, docs non-history 82, còn lại history/plugins); **`herdr-plugin/src/pick.rs:167` `discover_run_argv`** dựng argv `/fgOS:discover-next` cho pane | "`fgos discover/plan` và `/fgOS:discover\|plan\|*-loop\|*-next` → dùng Workflow run; herdr-plugin (phần stage)" | herdr `pick.rs` là consumer **verb**, không phải stage — không trong danh sách; 82 docs non-history không đếm |
| verb `fgos coordination` + engine | P4 ph6 | **318 file** nhắc; **1.152 dòng** `fgos coordination` trong core/domains/docs/AGENTS; **139 test file** nhắc coordination, **85 test file** import `runner/coordination|verbs/coordination`; Rust: `packages/coordination-state/rust/src/lib.rs`, `packages/observe/rust/src/scorecard.rs:347,870–914` (hard-code `source: "coordination"`), 2 file herdr | "~170 file test nhắc coordination"; P5 "~800 lượt tên cũ" | Test ≈ khớp (139–170). Docs: riêng `fgos coordination` đã 1.152 dòng > "~800 lượt" của P5 cho **toàn bộ** tên cũ → P5 effort 2–3d thiếu cơ sở |
| Work `stage` (field + `workflow-stage-graphs`) | P3 ph3 | src/bin: **32 file** import `workflow-stage-graphs`, **25 file** đọc `.stage`; **test: 70 file** (`.stage`/`stage:`); Rust `work-state`+`herdr-plugin/src`: **9 file** (`app.rs:53 pub stage`, `:98 matches!(self.stage...)`); herdr web: **5 file** (`TaskDetail.tsx:322`, `Taskboard.test.tsx:20,68–80`, `TaskDetail.test.tsx:17`); skill: **27 file**; docs: 1.112 file (đa số history) | "32 file import, 24 file đọc `item.stage`, Rust, gateway, ~20 skill" | Khớp src. **70 test file không được đếm**; skill 27 vs ~20; web 5 file chỉ ghi "web types" |
| `executors.<id>.for` + `capability.for` | P1 ph7 | **17 file** + `.fgos/config.json` 8 entry (`:287,327,334,351,369,604,774,833`): `resolve.mjs:201,303`, `config.mjs`, `cli.mjs:691–702` (decide output), **`plan.mjs:300,310`**, `placement-policy.mjs` (xoá ph6), **`src/state/tool-registry.mjs:105`**, **`src/setup/registrations.mjs:2057`**, `src/verbs/coordination/binding.mjs`, `test/setup/checks.test.mjs`, `test/runner/dispatch.test.mjs`, `test/verbs/coordination-binding.test.mjs`, `docs/specs/confinement-authority.md`, `docs/doc-registry.*` | `resolve.mjs`, `.fgos/config.json` | `plan.mjs`, `cli.mjs` (decide label), `tool-registry.mjs` (L3!), `registrations.mjs`, 2 test, 1 spec không liệt kê |
| PolicyPatch `preferExecutor` / `preferInvocation` / `preferPersona` | P1 ph7 | **40 file**, 163 dòng. src (16): `definitions/schema.mjs:120–146,290–295`, `assignment-policy.mjs`, `assignment-runner.mjs`, **`execution-contract.mjs`**, **`plan.mjs`**, **`cli.mjs`**, **`recovery.mjs`**, **`workflow-adapter.mjs`**, **`cohort-planner.mjs`**, `session-engine.mjs`, **`src/verbs/coordination/schema.mjs`**, `composers.mjs`, `run.mjs`, `binding.mjs`, **`src/setup/registrations.mjs`**; test **23 file** (vd `flow-definition-policy-patch-doc-drift`, `assignment-provenance`, `dispatch-governance-provider-denylist`, `group-cognition-framework`, `coordination-nominal-group-lite`, `cohort-planner`, `dispatch-recovery`…); YAML: `feature.yaml:64–65` (thật), 5 protocol YAML chỉ comment; docs 1 | 6 src + 3 test glob | 9 src file + ~20 test file không liệt kê; `flow-definition-policy-patch-doc-drift.test.mjs` sẽ đỏ khi schema mất field |
| `openDispatchRun` / `.fgos/dispatch-runs` | P1 ph5 | **10 file**: `cli.mjs:260–267,364,938`, `visibility-session.mjs:234–249`, `runtime-inspection.mjs:83–84`, `src/verbs/dispatch/show-run.mjs:58–63`, + test | `cli.mjs` + "phần writer + test" | `visibility-session.mjs`, `runtime-inspection.mjs`, `show-run.mjs` là **reader** — không liệt kê; xoá writer mà giữ reader = đường đọc chết |
| `test/runner/dead-vocabulary-guard.test.mjs` | P4 ph6, P5 ph3 ("Modify") | **không tồn tại** (`rg -l "dead-vocabulary" test src scripts` = 0) | "Modify" | Phải là "Create"; P1 ph8 "guard từ vựng chết của P1" là nơi tạo — ba plan tham chiếu một file chưa ai tạo |
| Hook PreToolUse `dispatch decide` | P2 ph1 ("tìm script thật: `rg -l "dispatch decide" .claude plugins core`") | `.claude/settings.json:60` → `scripts/dispatch-decide-hook.mjs` (import `decideExecutorCli` từ `cli.mjs`); test `test/scripts/dispatch-decide-hook.test.mjs` | đường tìm sai thư mục | `scripts/` không nằm trong đường tìm; hook import trực tiếp `cli.mjs` nên P1 ph5 (sửa `cli.mjs`) đã chạm hook, không phải P2 |

### Kiểm fact khác

- `src/workflow/`, `src/runner/execution/`, `core/workflows/` — chưa tồn tại (đúng là mới).
- `rigorToTier` — 0 hit trên main → T chưa merge; cổng P1 đúng.
- `src/report/capability-plan-lint.mjs:10,51,79,258–268` — plan-lint **đã** đọc `## Product Gates` và `- unit:` trong `plan.md`; P2 ph2 "Bỏ `## Product Gates` nếu trùng nghĩa Unit" hợp lý nhưng `bin/fgos.mjs:2310–2312` message ghi cứng "a plan.md file" — cần sửa cùng.
- `test/architecture.test.mjs` tồn tại (31K) — guard một chiều đã có chỗ; P1/P3 không cần file guard mới.
- `src/runner/worktree.mjs` thuộc L3 (layer map) — P2 ph3 `plan-reader.mjs` "tái dùng qua interface" mâu thuẫn guard A4 của P1 (`src/runner/execution/**` không import `src/state/**`; worktree.mjs import state).

---

## Câu hỏi cho owner (nghi ngờ về feature đã yêu cầu — không phải đề xuất cắt)

1. Tầng project `.fgos/workflows/*.yaml` (P3 ph2) — có ca thật cần project đè Workflow domain không, hay chỉ sao chép hình protocol-loader?
2. `fgos run record` + vai in-process trong `reviewed` — anh muốn V1 chạy reviewer in-process (Lead đứng giữa) hay out-of-process thuần để "một lệnh chạy trọn" đúng nghĩa?
3. Fallback quota + pane herdr (P1 ph6) — đã có ca thật nào hết quota làm review treo chưa, hay đây là xây trước ca?
4. `unit-run` vs *coordination session* — anh muốn tên nào cho "một lần chạy pattern cho một unit"? Synthesis D0 đã đặt *coordination session*; nếu đổi, P5 cần thêm dòng.

---

Status: DONE_WITH_CONCERNS
Summary: 9 finding (1 Critical, 3 High, 5 Medium) — plan set thêm 2 store + 1 khái niệm + 3 sequencer + 2 loader + 1 verb ghi kết quả mà không xoá tương ứng trong cùng phase; P2∥P3 chạy song song tạo xung đột file thật; 9 bảng consumer cho thấy undercount ở 8/10 interface, nặng nhất là `fgos capability match` (fgos-panel/architecture-panel gãy giữa P2 và P4) và PolicyPatch (40 file vs 9 liệt kê).
Concerns/Blockers: Câu hỏi mở 3 của P1 (store) và 4 câu hỏi X (phase 6) nên được owner quyết **trước** sóng B, không ở phase refresh; `dead-vocabulary-guard.test.mjs` chưa tồn tại nhưng 3 plan ghi "Modify".
