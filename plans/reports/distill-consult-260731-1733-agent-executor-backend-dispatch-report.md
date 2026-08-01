# Consult: agent-executor (backend-agnostic capacity invocation)

**Feature:** "capacity" = 1 unit việc agent làm (skill/prompt), hành vi bị agent
description (persona/tool-scope/model) định hình. Hiện gọi agent thực thi
capacity tách theo backend cụ thể (built-in Claude Code subagent vs external
LLM CLI như Codex/agy). Muốn: 1 điểm gọi thống nhất ("agent-executor")
agnostic ở call site, tự dispatch xuống đúng cơ chế theo config gắn với
capacity đó.

**Bottom Line:** `marketing-cockpit:executor-registry-cognitive-tier` +
`agent-agnostic-adapter-spec` là tiền lệ hoàn chỉnh nhất — task khai
`cognitive_tier`, tier map sang model qua `model-policy.yaml` RIÊNG, và
`executor-registry.yaml` map task→executor (`kind: agent|tool`, `invocation:
task|cli|mcp|api`, `adapter: bash|python|native|mcp`) — đúng 3 lớp tách rời
mà agent-executor cần (capacity, model-tier, executor-mechanism). Battle-tested
nhất về runtime enforcement là beegog: `dispatch-prepare-payload-builder`
(1 hàm sinh MỌI payload dispatch) + hook `model-guard` từ chối dispatch thiếu
tier tường minh — và bài học đắt giá: tier phải gắn vào AGENT TYPE
(`pinned-tier-agent-types`), khai trong prompt KHÔNG đủ vì
`subagent_type:"general-purpose"` âm thầm bỏ tier. symphony
(`agent-adapter-codex-jsonrpc`) có hình dạng runtime "N backend, 1 interface"
sạch nhất: adapter pluggable (`custom` spawn-command vs `codex` full
JSON-RPC), có idle-timeout reconciliation vì các backend báo "còn sống" khác
nhau. **Lỗ hổng chung:** chưa nguồn nào giải quyết trọn "cùng 1 capacity, từ
CÙNG 1 call site, chọn Claude-subagent hay external-CLI lúc runtime" — gần
nhất là beegog's `model-tiers-cost-discipline` (external executor
`{kind:"cli", command}` preset cạnh Agent tool) nhưng vẫn đòi caller biết
trước mình đang gọi CLI, chưa phải 1 verb thật sự agnostic. forgent đã có
mầm việc này: `src/runner/dispatch.mjs` (`executor.command`/`executor.args`
argv template cho `claude`/`codex`, ở tầng headless runner) — nên tái dùng
tổng quát hoá thay vì thiết kế từ đầu.

## Chất liệu theo domain

### harness (hit)
- `beegog:dual-runtime-contract` — 1 core skill+lib chạy nguyên vẹn trên
  Claude Code lẫn Codex, enforcement sống ở helper dùng chung trước
  ("một bộ não, hai belt") — tiền lệ trực tiếp cho call site agnostic +
  adapter riêng mỗi backend.
- `beegog:cell-task-unit` — Cell = JSON task tự chứa đủ để dispatch
  ("plans are prompts") — gần khớp khái niệm "capacity" làm payload gọi.
- `superpowers:cross-harness-bootstrap-injection` — 3 "Shape" adapter (shell
  hook / in-process plugin / instructions-file) chiếu 1 cơ chế lên 8 harness
  khác nhau.
- `superpowers:tool-vocabulary-translation-references` — tài liệu per-harness
  dịch động từ agnostic ("dispatch a subagent") sang tên tool cụ thể từng
  runtime, kèm gap thật (Pi không có subagent/todo tool — "không được bịa
  `Task` call"). Đây chính là lớp translation agent-executor cần.
- `bee.md:native-codex-empty-wait-contract` — tending Codex CLI subagent
  song song Claude Code, semantics wait khác nhau giữa 2 backend.
- `beads-rust:agent-first-cli-contract-hardened` — contract 3 tầng
  (capabilities→schema→robot-docs) versioned, caller branch trước khi parse
  — mẫu cho executor point expose metadata máy-đọc theo backend.

### orchestration (hit)
- `beegog:dispatch-prepare-payload-builder` — nơi DUY NHẤT sinh payload cho
  mọi cơ chế dispatch bee sở hữu (Agent tool / Codex spawn_agent / Bash), tự
  kiểm qua `evaluateDispatch`, audit `dispatch.jsonl`.
- `beegog:pinned-tier-agent-types` — mỗi tier có-model = 1 agent type cụ thể
  (`bee-gather`/`bee-extract`/`bee-review`); `general-purpose` bị deny vì
  không mang danh tính tier.
- `beegog:model-tiers-cost-discipline` — external executor preset
  `{kind:"cli", command}` (Codex CLI/agy/opencode) + "known-answer probe" để
  xác nhận executor CLI còn sống thật (không tin exit status).
- `beegog:read-only-analyst-fanout` — tool-scope enforce bằng CAPABILITY
  (pin `Explore` agent), không bằng prompt — sau sự cố "đừng ghi file" bị
  lờ khi capability vẫn cho ghi.
- `symphony:isolated-run-contract` — `RUN_CONTRACT.json` = prompt đủ để
  dispatch (required_outputs/forbidden_paths/agent_instructions) + validate
  `RESULT.json` bắt buộc.
- `symphony:agent-adapter-codex-jsonrpc` — **analog gần nhất với
  agent-executor**: adapter pluggable (`custom` spawn-command vs `codex`
  full JSON-RPC), idle-timeout reconciliation ("im lặng ≠ chết").
- `superpowers:sdd-ledger-and-circuit-breaker` — fix-loop leo tier, vòng 4-5
  escalate sang "implementer fresh trên model mạnh hơn".
- `superpowers:model-selection-warning` — "model bị bỏ trống kế thừa model
  của session — âm thầm vô hiệu hoá mục này" — đúng bug agent-executor phải
  chặn.
- `marketing-cockpit:funnel-agent-roster` — agent định nghĩa qua
  `agent.schema.yaml` (persona + decision-boundary + collaboration), nồng độ
  concurrency theo "cognitive load".
- `compound-engineering-plugin:orchestrator-judges-fans-out-fixes` — judge
  trước rồi mới fan-out subagent ("được gọi KHÔNG phải là được phép").
- `compound-engineering-plugin:return-to-caller-envelope` — trả về envelope
  chuẩn (`status/changed_files/verification_evidence`) để caller agnostic cả
  chiều RA, không chỉ chiều vào.
- `herdr:agent-vs-pane-cli-distinction` + `wait-primitives` — tách API
  "process tôi chạy" khỏi "agent tôi phối hợp", 2 verb wait khác nhau.
- `beads:multiagent-routing-and-slots` — precedence rõ ràng: flag tường minh
  > auto-detect > default, danh tính agent đọc từ ENV chứ không khai trong
  prompt ("chống giả mạo rẻ hơn model-guard của bee").

### routing (hit)
- `beegog:status-token-wave-dispatch` — tiered "rescue ladder" khi
  [BLOCKED] (thêm context → tier mạnh hơn → escalate người).
- `symphony:discovery-before-mutation-client` — `preflight()` read-only xác
  thực version/schema/capability TRƯỚC mọi mutation, branch theo exit code.
- `beads-rust:cross-project-routing` — bảng dispatch prefix→path
  (`.beads/routes.jsonl`) cho cross-workspace, KHÔNG phải sync.
- `superpowers:platform-adaptation-routing` — route tới file reference theo
  harness, có gap thật (Gemini bị bỏ sót dù có reference) — bài học bảo trì
  routing table.
- `marketing-cockpit:three-level-intent-routing` — L2 skill→candidate agents
  qua token-scoring + tie-break `fewer_active_tasks`.
- `repository-harness:protocol-next-action-table` — routing là decision
  table TRONG contract (data), không phải code router.

### integration-contract (hit)
- `marketing-cockpit:agent-agnostic-adapter-spec` — **entry liên quan nhất
  toàn corpus**: 1 core chạy N nền qua adapter contract, mỗi adapter BẮT
  BUỘC implement 4 capability + 6 optional có fallback tường minh; adapter
  sống ở `.{platform}/`, base LUÔN từ `.fgOS/`.
- `beegog:codex-runtime-parity` — dual-runtime từ "chung code" lên "tested
  parity": Worker-thread transport khi Codex chặn child process, hook
  audit-only cho native subagent.
- `symphony:typed-runtime-boundary` — product nói chuyện với engine CHỈ qua
  protocol versioned (capabilities = lời hứa hành vi, không phải tên sản
  phẩm) — never source/DB trực tiếp.
- `symphony:product-boundary-non-goals` — bảng "Harness sở hữu X / Symphony
  sở hữu Y" — điều adapter KHÔNG được tự làm lại.
- `herdr:wrapped-process-env-var-contract` — handshake ENV cố định
  (`HERDR_ENV`, `HERDR_SOCKET_PATH`...) mà 14 backend agent khác nhau đều
  gate theo trước khi hành động.
- `herdr:external-agent-minimum-version-gate` — probe `min_version` 3 kết
  quả (đạt/chưa-biết-cứ-chạy/quá-cũ-chặn) trước khi wire integration.
- `compound-engineering-plugin:explicit-tool-and-hook-mapping` — mỗi
  converter khai `TOOL_MAP`/`HOOK_EVENT_MAP` + chuẩn hoá tên model, lossy
  mapping PHẢI nhìn thấy được.
- `beads-rust:agent-baseline-golden-snapshots` — golden-snapshot CI trên bề
  mặt CLI hướng-agent (help/schema/examples) chống drift hợp đồng.

### tooling (maybe → hit thật)
- `bee.md:herding-runtime-adapter-seam` — `.bee/config.json` khai
  `herding.agent_command`/`control_command` dạng argv-token-array với
  placeholder (`{MODEL}`,`{PROMPT}`...), thiếu key = hành vi mặc định
  byte-equal; kèm ví dụ adapter Codex minh hoạ (chưa wire) — **seam config
  gần nhất với executor config forgent cần**.
- `repository-harness:tool-registry-capability` — registry 2 chiều
  (outbound/inbound), trả FACT (`present/missing/unknown`) chứ không tự áp
  policy — policy do agent đọc prose áp dụng.
- `symphony:optional-provider-degrade-ladder` — 3-nấc degrade (absent→skip
  sạch / present-broken→warn / present→audit thêm) cho optional external
  provider.
- `compound-engineering-plugin:bundled-skill-scripts` — script gọi qua
  `SKILL_DIR` absolute anchor, `command -v` optional-detect, portable
  qua N platform sau convert.

### skills (maybe)
- `superpowers:subagent-driven-development-skill` + `executing-plans-skill`
  + `writing-plans-skill` — mọi plan kết thúc bằng lựa chọn thực thi tường
  minh (Subagent-Driven vs Inline), mỗi nhánh có `REQUIRED SUB-SKILL` pointer
  — config nằm NGAY TRONG artifact chọn cách capacity được chạy.
- `superpowers:dispatching-parallel-agents-skill` — luật cơ học: nhiều dispatch
  1 response = song song; 1/response = tuần tự.

### hooks (maybe → hit thật)
- `beegog:model-guard-tier-transport` — PreToolUse guard trên Agent/Task từ
  chối dispatch thiếu tier tường minh; audit mọi dispatch.
- `bee.md:hook-equivalent-guardrails` — runtime không có hook gốc (Codex) thì
  cùng luật được tự-tuân qua AGENTS.md — enforce nhất quán CROSS-backend dù
  cơ chế hook khác nhau.
- `marketing-cockpit:multiplatform-lifecycle-hooks` — 1 hook logic + matcher
  per-executor chiếu sang nhiều nền.
- `herdr:per-agent-integration-hooks` — 14 adapter chính thức, mỗi cái ghi
  hook/plugin riêng vào config dir của backend đó, báo về qua 1 socket API
  chung — "1 điểm gọi, N cơ chế backend" gần nghĩa đen nhất.
- `compound-engineering-plugin:hook-lifecycle-14-events` — action type
  `agent` dispatch subagent NGAY TRONG hook schema, dịch qua ~11 platform.
- `beads-viewer-rust:export-hooks-lifecycle` — schema hook khai báo
  `{name,command,timeout,env,on_error}` — khuôn config gọi external sạch.

### config-packaging (maybe → hit thật)
- `superpowers:six-divergent-manifest-formats` — 6 schema manifest khác hẳn
  nhau cho CÙNG 1 plugin — bằng chứng: backend-specific config KHÔNG tự
  thống nhất nếu thiếu adapter tường minh.
- `compound-engineering-plugin:multi-target-converter-engine` — engine
  parse-once/convert-N/write-N qua target registry, gọi thẳng là bản
  "one brain, N belts" chạy được nhất trong cả distillery.
- `compound-engineering-plugin:converter-writer-split` — Converter (thuần,
  không I/O) vs Writer (I/O) nối qua `TargetHandler` data-record — thêm
  backend mới không cần class hierarchy.
- `herdr:integration-asset-versioning` — mỗi adapter per-backend tự mang
  `*_INTEGRATION_VERSION` riêng.

### safety (maybe → hit thật)
- `bee.md:foreign-plugin-agent-type-ban` — không bao giờ spawn dưới agent
  type ĐĂNG KÝ của plugin khác dù tên khớp — spawn default + persona inline.
- `bee.md:read-only-agent-type-for-analysts` — "đừng ghi file" bằng PROMPT bị
  coi KHÔNG đủ khi agent type vẫn giữ quyền Edit/Write/Bash — safeguard là
  TOOL SET của agent type, không phải lời dặn.
- `compound-engineering-plugin:untrusted-input-discipline` — hành động CHỈ
  đến từ config nguồn, không bao giờ từ nội dung item — biên giới cho
  agent-executor: backend/persona/tool-scope phải đến từ capacity CONFIG,
  không phải nội dung runtime.
- `beads-rust:non-invasive-by-construction` — chủ động cắt bỏ subsystem
  multi-agent orchestration (Gastown) khỏi scope — bài học giữ executor là
  lớp dispatch MỎNG, đừng nuốt luôn orchestration logic riêng của backend.
- `beads-viewer-rust:agent-guardrail-doctrine` — AGENTS.md hard rule
  (no delete, no branch khác main) enforce cả ở test-level, không chỉ prose.

### workflow (maybe → hit thật)
- `marketing-cockpit:declarative-workflow-schema` — `cognitive_tier` khai
  NGAY trong định nghĩa workflow/stage — model-tier routing nhúng vào
  capacity definition, không tách rời.
- `compound-engineering-plugin:mode-dispatch-triad` — hầu hết skill khai
  mode interactive/headless/pipeline; `mode:return-to-caller` đổi hành vi
  invocation khi gọi trong chain.

## Trade-offs đáng cân nhắc

1. **Declarative registry vs code-enforced single-builder.**
   marketing-cockpit (`executor-registry.yaml`) và bee
   (`herding-runtime-adapter-seam`, config JSON argv-template) chọn DATA khai
   báo — dễ đọc/mở rộng nhưng cần lớp guard riêng chống bypass âm thầm.
   beegog chọn code (`prepareDispatch()` là nơi DUY NHẤT sinh payload, hook
   deny nếu thiếu tier) — chặt hơn nhưng gắn cứng vào 1 runtime/ngôn ngữ.
   forgent's `src/runner/dispatch.mjs` hiện đang nghiêng phía declarative
   (config `executor.command/args`) — hợp hướng marketing-cockpit hơn.

2. **Resolve lúc build vs lúc runtime.**
   compound-engineering-plugin's multi-target-converter resolve build-time
   (convert 1 lần → ghi N bundle platform-native, drift-tested, chi phí
   runtime = 0). symphony/marketing-cockpit/bee resolve RUNTIME mỗi lần gọi
   (cần preflight/health-check mỗi call — xem #5). Câu hỏi thật cho
   agent-executor: capacity→backend là quyết định BUILD TIME (project theo
   config) hay RUNTIME (chọn theo tình huống mỗi lần gọi)? Hai bài toán
   khác nhau, không loại trừ nhau (có thể build-time cho skill projection,
   runtime cho model/tier choice).

3. **Tier/model tách khỏi capacity hay fuse vào agent type.**
   marketing-cockpit tách 3 lớp rời nhau (task khai tier → tier→model qua
   policy file riêng → task→executor qua registry riêng). beegog học được
   NGƯỢC lại sau sự cố thật: khai tier trong PROMPT không đủ —
   `general-purpose` subagent_type âm thầm bỏ tier — nên phải FUSE tier vào
   chính agent type (`bee-gather`/`bee-extract`/`bee-review`). Đây là quyết
   định thiết kế cụ thể forgent phải chốt, không phải chi tiết vặt: tách rời
   thì linh hoạt hơn nhưng có lỗ hổng bypass mà chỉ enforcement ở TYPE mới
   vá được.

4. **Guard chống default âm thầm.** beegog (hook deny thiếu tier) +
   superpowers (`model-selection-warning`: model bỏ trống kế thừa session,
   âm thầm vô hiệu hoá) hội tụ cùng 1 bug-class: agent-executor PHẢI từ
   chối dispatch thiếu backend/model tường minh, không được suy luận mặc
   định lặng lẽ.

5. **Không tin backend còn sống — luôn probe trước khi gọi.** beegog
   ("known-answer probe", không tin exit status) + herdr (`min_version`
   3-way gate) + symphony (`doctor-preflight` Pass/Warn/Fail cho agent
   adapter) + repository-harness (`tool-registry` trả fact
   present/missing/unknown) đều hội tụ: preflight/health-check TRƯỚC
   dispatch, degrade sạch khi absent — cùng doctrine "absent capability =
   clean skip" mà bee đã áp cho tool (không riêng cho LLM backend).

6. **Contract chiều RA cũng phải agnostic, không chỉ chiều VÀO.**
   compound-engineering's `return-to-caller-envelope` — caller nhận
   `status/changed_files/verification_evidence` chuẩn hoá bất kể backend
   nào chạy bên dưới; symphony's `RESULT.json` validate bắt buộc cùng ý.
   Thiếu vế này, agent-executor mới chỉ agnostic một nửa.

## Candidate liên quan (đã có trong porting-log.md)

| Candidate | Nguồn | Score | Ghi chú |
|---|---|---|---|
| `dispatch-payload-as-authority` | beegog:dispatch-prepare-payload-builder + pinned-tier-agent-types | R3 E2 F2 | Sinh payload bằng code từ 1 nơi, tự kiểm, audit, từ chối cấp khi chưa cầm claim |
| `cognitive-tier-model-decoupling` | marketing-cockpit:executor-registry-cognitive-tier | R2 E2 F2 | task khai tier, map tier→model tách policy riêng, silent-downgrade — bản trưởng thành của cost-tiered-delegation forgent đã dùng |
| `intent-scoring-agent-dispatch` | marketing-cockpit:three-level-intent-routing | R2 E1 F2 | dispatch nhiều-agent qua token-scoring; điều kiện "forgent lên multi-agent" đã resolve, chờ tầng multi-agent dựng thật |
| `agent-agnostic-adapter-projection` | marketing-cockpit:agent-agnostic-adapter-spec + beegog:dual-runtime-contract | R3 E2 F3 | E2 hội tụ độc lập "core neutral + adapter mỏng" |
| `multi-target-converter-engine` | compound-engineering-plugin | R3 E2 F3 | bản build-time "one brain, N belts" chạy được nhất, E2 hội tụ 3 nguồn |
| `tool-registry-capability` | repository-harness | R3 E2 F2 | adjacent — registry cho EXTERNAL TOOL capability (vd GitNexus), không phải LLM backend, nhưng cùng khuôn present/missing/unknown |

**Chưa có row porting-log (mới phát hiện qua consult này, để human triage):**
`symphony:agent-adapter-codex-jsonrpc` (adapter runtime pluggable +
idle-timeout reconciliation), `bee:herding-runtime-adapter-seam` (config
argv-template + ví dụ Codex adapter chưa wire), `herdr:per-agent-integration-hooks`
+ `wrapped-process-env-var-contract` (14 adapter thật, ENV handshake chuẩn) —
đây là 3 chất liệu bám sát nhất với đúng câu hỏi "1 điểm gọi, N cơ chế
backend" nhưng chưa từng được chấm điểm R/E/F trong porting-log.

## Coverage ledger

| Domain | Kết quả |
|---|---|
| harness | consulted (11 entries, 6 nguồn) |
| orchestration | consulted (17 entries, 8 nguồn) |
| routing | consulted (8 entries, 6 nguồn) |
| integration-contract | consulted (10 entries, 6 nguồn) |
| tooling | consulted (5 entries, 4 nguồn) |
| skills | consulted (4 entries, 1 nguồn — superpowers) |
| hooks | consulted (8 entries, 6 nguồn) |
| config-packaging | consulted (4 entries, 3 nguồn) |
| safety | consulted (5 entries, 4 nguồn) |
| workflow | consulted (2 entries, 2 nguồn) |
| context-memory | ruled out — về persistence/memory giữa session, không chạm chọn backend lúc gọi |
| planning | ruled out — về lập kế hoạch (plan.md/phase file), không phải cơ chế invocation |
| quality-gates | ruled out — về tiêu chuẩn duyệt/pass, không phải backend selection |
| docs-style | ruled out — văn phong tài liệu, không liên quan |
| repo-layout | ruled out — cấu trúc thư mục, không liên quan |
| self-improvement | ruled out — học/cải tiến qua thời gian, không phải invocation |
| ux | ruled out — trải nghiệm người dùng cuối, không chạm tầng dispatch backend |
| testing-evals | ruled out — đánh giá chất lượng output, không phải cơ chế gọi backend |

Keyword sweep (`executor`, `adapter`, `dispatch`, sau khi đã đọc vocabulary
nguồn): không bắt thêm entry mới ngoài các domain đã walk — 1 chạm duy nhất
ở symphony's `web-board-recovery-actions` (đã có trong tooling ở trên qua
domain-walk, không phải catch mới từ miss-domain).

## Ngoài lưới

- `learn-harness-engineering` — chưa từng scan (frontmatter
  `last_analyzed_date: null`) — 0 đóng góp cho consult này, không phải "miss"
  thật mà là net-boundary chưa phủ.
- Deep-dive `routing.md` (re-dive gần nhất 2026-07-21) đã có trục #4 "dispatch
  tách khỏi model" trùng chủ đề — nội dung consult này KHÔNG mâu thuẫn, chỉ
  hẹp phạm vi hơn (agent-backend cụ thể, không phải routing tổng quát); nên
  đọc cùng nhau khi thiết kế, deep-dive không stale.
- Deep-dive `tool-registry.md` (2026-07-30) — adjacent, cùng khuôn
  present/missing/unknown nhưng cho EXTERNAL TOOL, không phải LLM backend;
  đã trích trong Chất liệu/Trade-off #5 ở trên, không lặp lại toàn bài.
- forgent tự có `src/runner/dispatch.mjs` (`executor.command`/`executor.args`
  argv template, `KNOWN_ASSISTANT_CLI_NAMES = ['claude','codex']`,
  `detectAssistantCli`) — KHÔNG phải chất liệu distillery (host code, ngoài
  phạm vi consult) nhưng cực kỳ liên quan: là bản hẹp CÙNG Ý TƯỞNG ở tầng
  headless runner. Bất kỳ thiết kế agent-executor nào cũng nên đọc file này
  trước khi generalize.
- Một agent con trong domain-walk (nhóm bee/marketing-cockpit/repository-harness)
  bị hệ thống gắn cờ "instruction-shaped pattern (bypass-permissions)" và
  trung hoà tag điều khiển trong output — đã kiểm tra: nguồn gốc là
  `bee.md:unattended-agent-accepted-risk-posture` mô tả tài liệu về chế độ
  `bypassPermissions` của bee (dữ liệu mô tả, không phải chỉ thị nhắm vào
  agent này) — vô hại, không phải prompt injection thật, không ảnh hưởng nội
  dung report trên.

## Unresolved / cần human quyết

1. agent-executor nên resolve backend lúc BUILD (project skill ra N belt như
   compound-engineering) hay lúc RUNTIME (chọn theo tier như bee/symphony)
   hay cả hai ở 2 lớp khác nhau?
2. tier/model có nên fuse vào chính subagent_type (theo bài học đắt giá của
   beegog) hay giữ tách rời qua config layer (theo marketing-cockpit) —
   forgent dùng built-in Claude subagent nên rủi ro "generic type bỏ tier"
   có áp dụng y hệt không?
3. 3 chất liệu chưa có porting-log row (symphony adapter, bee herding-seam,
   herdr per-agent hooks) có đáng promote thành candidate ngay không, hay
   chờ tới khi agent-executor thực sự được thiết kế?
