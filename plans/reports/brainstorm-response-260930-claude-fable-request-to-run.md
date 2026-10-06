# Trả lời: claude-fable-5.1 (Claude Code, cố vấn chỉ-đọc)

```txt
Document type: Brainstorm response (advisory, stateful record)
Prompt: plans/reports/brainstorm-prompt-260930-1102-request-to-run-decomposition.md
Snapshot: 2026-09-30, main @ bd21c8227, chỉ đọc; không sửa code, không commit, không chạy verb ghi state
Độc lập: không đọc câu trả lời của agent khác
```

## Tóm tắt lập trường (≤ 8 dòng)

1. Hai đường hội tụ ở **Unit** (hết tầng 3), sớm hơn khung §5. FlowDefinition nghiệp vụ là *unit list khai sẵn*; không có thì Lead viết unit list. Từ Unit xuống chỉ một đường: pattern → Ask → bind → run.
2. 13 "FlowDefinition" hiện có đều là **pattern** (cách cộng tác trong một unit). Chưa có business flow nào. Hai nghĩa đang dùng chung một tên.
3. Unit khai thẳng `capability` dạng `domain:verb`, fallback về `verb`. Xoá DemandFacts, matcher và `form`.
4. Ba pattern là đủ: `solo`, `reviewed`, `panel`. Vai là slot: vai không khai capability, lấy từ unit.
5. Binding là một hàm thuần, gọi ở đúng một chỗ (cửa chạy), theo một bảng ưu tiên. Caller không bao giờ tự tính executor.
6. Khẩu vị chỉ nằm trong config. YAML chỉ khai yêu cầu: capability, rigor, readOnly, independentOf.
7. Persona là nội dung prompt của vai. Nó không chạm tier, model hay executor.
8. Inline cũng là một run có RunResult. Bước đầu cho K3 là bốn sửa nhỏ trong file đã có, không xây hạ tầng mới.

## A. Hiện trạng (trace K1, K3, K5 + bảng đếm khái niệm)

### K1: "sửa bug null ở src/foo.mjs, có test"

| Tầng | Ai quyết | Vào → ra | Con trỏ | Chỗ gãy / làm tay |
|---|---|---|---|---|
| 1 Hiểu | Lead đọc prose | câu chữ → ý định | `core/skills/_shared/capability-matching.md` Q0 | [fact] không có artifact ghi intent/domain; `fgos-clarifying` chỉ chạy ở đường `/fgOS:submit` (Work) |
| 2 Phân rã | Lead | → 1 "cell" | `domains/coding/skills/fgos-code-change/SKILL.md` ("a single change is a plan with one cell") | không có dạng unit cho yêu cầu tự do |
| 3 Phân loại | Lead khai 8 DemandFacts, máy match | facts → `code:implement`, `form: protocol` | `bin/fgos.mjs:2358`, `src/runner/capability-match.mjs:121` | 8 field để ra 1 token; `rigor` không được dùng; miss/tie rơi lặng lẽ về inline |
| 4 Cộng tác | skill (prose) | `form` → facade → master loop | SKILL "Step 0/1"; `core/coordination-protocols/standalone-master-coordination-loop.yaml` | pattern cố định (red-team bắt buộc); Lead tự tạo worktree và gọi 5–8 lệnh có action-key |
| 5 Binding | code + config | `policy.capability` → `prefer` | `src/verbs/coordination/binding.mjs:89,169`; config `code:implement.prefer = gemini/agy-cli-mucdong`, `code:review.prefer = openai/codex-cli-bwrap` | [fact] khẩu vị §4 ("review code = claude opus") chưa có trong config; ghi `prefer: claude` không kèm invocation thì bị redirect sang openai (`assignment-runner.mjs:1431-1433`); persona mặc định `code-reviewer` cho mọi role `reviewer` (`assignment-policy.mjs:391`) |
| 6 Chạy/đo | engine | contract → `.fgos/assignments/*/runs` | `session-engine.mjs:2135` (chỉ worktree), `packages/run-result/rust/src/lib.rs:336` | close làm tay: [fact] 512/602 session đang `active` |

### K3: "chạy phase 6" (15 area docs, song song, openai viết, opus review, ledger một writer)

| Tầng | Ai quyết | Con trỏ | Chỗ gãy / làm tay |
|---|---|---|---|
| 1 | Lead; path plan → plan mode | SKILL "Mode Selection" | — |
| 2 | tác giả plan đã chia phase; 15 area nằm trong prose của phase | `src/report/capability-plan-lint.mjs:13` | [fact] `plan-lint` chỉ đọc `plan.md`; plan này không có block `- unit:` nên Lead phải tự chia area |
| 3 | gate của facade | SKILL "Single-cell mode gate" | [fact] facade chỉ nhận `code:implement`/`code:refactor`; unit docs bị trả về inline |
| 4 | YAML | master loop | [fact] protocol ghi file duy nhất ghim `code:*`; DAG mode chỉ nhận bước read-only (`src/verbs/coordination/dag-request-compiler.mjs:65`) nên 15 area = 15 session mở tay |
| 5 | roster tay | `bin/fgos.mjs:2741-2780`; `src/verbs/coordination/composers.mjs:434` | [fact] `--actors` chỉ có ở `start` và không theo sang bước sau (composer dựng lại từ `actors: []`); fixer và recheck quay về gemini/openai trừ khi truyền `--executor/--tier` từng bước; persona và invocation không override được sau entry node |
| 6 | engine + Lead | §6.6 của prompt | "ledger một writer" không được mô hình hoá; finding bị ghi `failed` |

### K5: flow marketing có FlowDefinition và bước human

| Tầng | Hiện trạng | Con trỏ |
|---|---|---|
| 1 | [suy luận] không có lối vào: `fgos-panel` chỉ định tuyến preset group-thinking | `core/skills/fgos-panel/SKILL.md` |
| 2–4 | [fact] schema CoordinationProtocol không có node "chờ người": `human-turn` là step của request (ghi lại lượt nói), `gate-verdict` chỉ hợp lệ ở profile Workflow, `dispatch: human-only` chỉ có ở workflow của Work | `src/verbs/coordination/schema.mjs:740`; `src/runner/definitions/schema.mjs:840`; `domains/coding/workflows/feature.yaml` |
| 5 | [fact] `marketing:write` chưa có trong config thì actor "unbound", rồi rơi về `runner.executor.command ?? 'claude'`: không inline, không báo lỗi | `binding.mjs:268`; `assignment-policy.mjs:290` |
| 6 | [fact] bước "xuất bản" không phải git change nhưng `mutating` đòi linked worktree | `src/runner/dispatch/execution-contract.mjs:139` |

Kết luận: K5 chưa từng tồn tại. Thứ đang gọi là FlowDefinition chỉ phủ tầng 4.

### Bảng đếm khái niệm

| Câu hỏi | Khái niệm đang cùng trả lời | Số |
|---|---|---|
| "Một phần việc" gọi là gì | unit (`plan-lint`), cell, phase, hàng Product Gates, operation step, Assignment | 6 |
| Loại việc | DemandFacts (8 field), `serves`, capability, `form`, `capabilities[]` của operation (chỉ cohort planner đọc), `policy.capability` | 6 |
| "Ai" | role (protocol), `READ_ONLY_ROLES` (request), role (contract), actor, persona, agentType | 6 |
| Các bước | FlowDefinition profile CoordinationProtocol, profile Workflow, domain workflow YAML, request `steps[]`, `dag: true` | 5 |
| Kiểu request | `agent-led`, `declared-protocol`, inline contract, plain `execute` | 4 |
| Executor nào | `--executor`, `actors[].executor`, `capabilities.prefer`, `executors.for`, literal executor id, `preferExecutor`, `runner.executor.command`, `readOnlyRedirects`, `fallbackExecutors`, governance | 10 |
| Thứ tự ưu tiên | 7 scope của engine (`session-engine.mjs:2635-2642`), precedence riêng trong `binding.mjs`, danh sách 11 mức ở header `assignment-policy.mjs` | 3 |
| "Chỉ đọc" | `mutation`, `result.kind`, `READ_ONLY_ROLES`, `confinement` (capability + invocation), redirect | 5 |
| Độc lập | `distinctProviderFrom`, `cohort.distinctProviderFamilies`, `allowDiversityUnsatisfiable` | 3 |
| Persona | `preferPersona`, `actors[].persona`, actor `persona`, `core/agents/*.yaml`, projection `.claude/agents`, `model_tier` | 6 |
| Cơ chế chạy | `unavailable` / `in-process` / `out-of-process` | 3 |
| Cửa chạy | `execute <executor>`, `execute --assignment`, `execute --contract`, `coordination *`, Agent tool qua hook | 5 |
| Nơi ghi | `dispatch-runs/`, `assignments/*/runs`, `coordination/sessions`, observe cases, transcript | 5 |

Khoảng 67 khái niệm cho 13 câu hỏi, chưa tính các bộ tier.

## B. Thiết kế clean-sheet

Sáu danh từ và một hàm: **Unit, Pattern, Flow, Ask, Taste, Run** và `bind()`.

### 1. Hợp đồng dữ liệu

```yaml
# Unit: đầu ra tầng 2–3. Lead viết, hoặc nằm sẵn trong phase file, hoặc do Flow sinh.
- id: area-runner
  objective: "Chuyển area runner sang docs/platform/runner theo method đã freeze"
  capability: docs:write          # domain:verb
  rigor: high                     # low|standard|high|critical
  writes: [docs/platform/runner/**]   # rỗng = chỉ đọc
  dependsOn: []
  pattern: reviewed               # tuỳ chọn; vắng thì rule trong config chọn
  overrides: {}                   # tuỳ chọn, một lần: { reviewer: { executor: openai } }
```

```yaml
# Pattern: khuôn vai của MỘT unit. Vai là slot, không khai capability.
id: reviewed
roles:
  author:   { verb: "=unit" }
  reviewer: { verb: review, readOnly: true, independentOf: [author] }
  objector: { verb: review, readOnly: true, independentOf: [author], activation: driver }
loop: { fixBy: author, recheckBy: [reviewer], maxRounds: 2 }
```

```yaml
# Flow: quy trình nghiệp vụ = unit list khai sẵn + cổng người. Không có executor/tier.
id: marketing.content-publish
units:
  - { id: brief,   capability: "marketing:research" }
  - { id: write,   capability: "marketing:write", pattern: reviewed, persona: { reviewer: brand-guardian }, dependsOn: [brief] }
  - { id: approve, gate: human, dependsOn: [write] }
  - { id: publish, capability: "marketing:publish", dependsOn: [approve] }
```

```yaml
# Ask: Unit × vai. Hợp đồng duy nhất mà binder và cửa chạy nhận.
{ unitId, role, capability, rigor, readOnly, independentOf: [askId], persona?, overrides?, objective, contextRefs, expectedOutputs, cwd }
# bind(ask, taste, siblings, session) trả:
{ executor, invocation, tier, model, persona, mechanism, provenance: { <field>: { value, source } } }
```

### 2. Ai làm tầng nào

| Tầng | Ai | Lý do |
|---|---|---|
| 1 Hiểu | agent | ngôn ngữ tự nhiên; chỉ hỏi người khi thiếu đối tượng hoặc thẩm quyền |
| 2 Phân rã | agent phán, máy kiểm | chia việc là phán đoán; máy lint id, chu trình `dependsOn`, `writes` giao nhau, không ghim hạ tầng |
| 3 Phân loại | agent chọn 1 verb + rigor | chọn 1 trong ~6 verb đáng tin hơn điền 8 field để máy suy ra 1 trong 8 capability |
| 4 Pattern | rule trong config; agent hoặc user override có ghi lý do | "review nhiều hay ít" là khẩu vị, phải đổi được bằng dữ liệu |
| 5 Binding | máy, hàm thuần | cần provenance tái lập được |
| 6 Chạy/đo | máy; Lead chỉ làm vai inline và các điểm phán (disposition, authorize) | bất biến cứng: worktree, một run chưa settle cho mỗi assignment |

Plan AgentKit và yêu cầu tự do sinh **cùng một dạng Unit**.

### 3. Điểm hội tụ

```text
Yêu cầu tự do  → Lead viết Unit[]            ┐
Plan           → Unit[] trong phase file      ├→ Unit[] → pattern → Ask[] → bind → run → RunResult
Flow nghiệp vụ → Unit[] khai sẵn + cổng người ┘
```

Flow chỉ làm trước tầng 2–4 bằng dữ liệu. Nó không có engine riêng, binder riêng hay cửa riêng.

### 4. Bảng ưu tiên duy nhất

| Field | 1. Override một lần | 2. Yêu cầu của unit/vai | 3. Khẩu vị (config) | 4. Khi không còn gì |
|---|---|---|---|---|
| executor + invocation | `unit.overrides[role]` hoặc CLI; lưu theo unit, áp cho mọi vòng | không bao giờ khai | `capabilities[domain:verb].prefer[]`, thiếu key thì `capabilities[verb].prefer[]` | có Lead: `inline`; headless: lỗi rõ. Không có mặc định `claude` |
| tier | `--tier`, chỉ nâng | `rigor`, merge chỉ-nâng | `rigorToTier` → `modelPolicies[provider][tier]` | `standard` |
| persona | override | vai hoặc Flow khai | `capabilities[cap].persona` | không có |

Hai **bộ lọc** áp lên danh sách candidate ở mọi mức, không phải mức ưu tiên:

- `readOnly`: chỉ nhận invocation read-only của chính executor đó.
- `independentOf`: bỏ candidate cùng provider family với vai đã bind.

Governance phủ quyết cuối. Override vi phạm độc lập thì từ chối, trừ khi chính override nói rõ chấp nhận.

`mechanism` cũng do `bind` trả: executor trùng chính session (cùng provider, tier đủ) và vai `solo` thì `inline`; session có Agent tool và executor chạy in-process được thì `in-process`; còn lại `out-of-process`. Lead là một candidate như mọi executor. Quy tắc này thay cho phán đoán Q0.

### 5. Tier/rigor

Dùng nguyên hình dạng §4. Hai điểm cần nêu:

- **Căng nhẹ, có bằng chứng.** Khẩu vị §4 phát biểu theo capability ("viết tài liệu = flagship", "research = standard"), còn `rigorToTier` là bảng toàn cục. Muốn "review luôn là opus" thì chỉ còn cách khai `rigor` cao trong pattern YAML, tức khẩu vị quay lại YAML. Đề xuất một scope nữa trong chuỗi merge chỉ-nâng đã có: `capabilities.<cap>.rigor` (sàn, cùng thang). Không thêm từ vựng.
- **Chỗ plan tier có vẻ sót.** [fact] `scripts/project-agents.mjs:49-53,186` dịch `model_tier` của `core/agents/*.yaml` qua `DEFAULT_MODELS {light, standard, heavy}` thành `model:` trong `.claude/agents/*.md`. Comment ghi bảng này "matches runner.models", thứ plan sẽ xoá. [fact] grep `model_tier|project-agents|core/agents` trên `plan.md` và 5 phase file của plan tier không ra kết quả.

### 6. Persona

Persona là **hồ sơ prompt của vai**: giọng, ranh giới quyết định, tool-scope. Nguồn khai: vai trong Pattern/Flow khi đó là yêu cầu của bước (ví dụ `brand-guardian`), hoặc `capabilities[cap].persona` khi là khẩu vị. Nó chỉ ảnh hưởng prompt. Nó không ảnh hưởng tier, model, executor. Hệ quả: bỏ `model_tier` khỏi agent YAML, bỏ default `code-reviewer`, bỏ `implied-by-persona`.

### 7. Chạy và đo

- Một cửa: mọi Ask thành một Assignment, run ghi vào `.fgos/assignments/<id>/runs/<n>`.
- Inline: Lead làm vai đó rồi đóng bằng cùng RunResult với `mechanism: inline`. Token lấy từ transcript source Observe đã có.
- Ghi file: `cwd` phải là linked worktree. Bất biến này đã có ở `resolveMutatingCwdPosture` và đủ thay cho "protocol stamp".
- Song song: mỗi unit có `writes` một worktree; lint bảo đảm `writes` không giao nhau; Lead là scheduler cấp unit.
- Đo: `unitId` nhóm các run; driver mở và đóng một Observe case quanh cả yêu cầu; unit chỉ "xong" khi qua close-check.

### 8. Giao diện Work

Work đưa vào `{workId, objective, domain, rigor?}`. Work nhận ra `{unitIds, verdict, runRefs}`. Không gì khác.

### Trace K1–K6

| # | Unit | Pattern | Binding (khẩu vị §4) | Chạy |
|---|---|---|---|---|
| K1 | `code:implement`, rigor standard, writes `src/foo.mjs` + test | rule → `reviewed` | author → gemini; reviewer (`code:review`, readOnly, khác author) → claude opus readonly | worktree; fix ≤ 2 vòng; close-check; Lead merge |
| K2 | `docs:review`, không writes | rule → `solo` | candidate claude; session là claude đủ tier → `inline` | Lead làm, ghi RunResult inline |
| K3 | 15 unit `docs:write`, rigor high, writes `docs/platform/<area>/**`; thêm 1 unit `ledger` với `dependsOn` cả 15 | `reviewed`; ledger `solo` | author → openai flagship; reviewer → claude opus readonly | 15 worktree, tối đa N song song; mỗi area trả *ledger fragment*; unit ledger là writer duy nhất |
| K4 | `advise`, không writes, `pattern: panel`, n = 3 | user nói rõ → `panel` | 3 advisor, mỗi ask `independentOf` các ask trước → 3 provider | song song read-only; Lead tổng hợp inline |
| K5 | Flow sinh 4 unit, có `approve: gate human` | theo Flow | `marketing:write` thiếu key → fallback `write`; reviewer persona `brand-guardian` | walker park ở cổng người, unit không phụ thuộc vẫn chạy; headless thì `bind --explain` báo lỗi sớm |
| K6 | như K1, thêm `overrides: { reviewer: { executor: openai } }` | `reviewed` | mức 1 thắng; tier vẫn từ rigor; provenance `override` | override lưu theo unit nên recheck cũng dùng openai; config không đổi |

## C. Đối chiếu với hiện tại

| Ở B | Hiện có | Hành động |
|---|---|---|
| Unit | `- unit:` của plan-lint, Product Gates, field của operation step, "cell" | **gom** về một dạng; lint đọc cả phase file |
| `domain:verb` + fallback | `deriveOperationCapability` (`<domain>:review` → `review`) | **giữ**, mở fallback cho cả work-product |
| (không còn) DemandFacts, matcher, `form` | `src/runner/capability-match.mjs`, `fgos capability match` | **xoá** |
| Pattern | FlowDefinition profile CoordinationProtocol | **giữ engine**; master loop thành `reviewed`: bỏ 6 dòng `capability:`, red-team thành `driver-authorized` |
| `solo` | request kind `agent-led` (chỉ đọc) | **gom**: thành pattern, cho ghi file trong worktree; xoá kind |
| `panel` | declared-consult, research fan-out (2 bản), architecture panel (2 bản) | **gom** dần; delphi, nominal, rfc, group-cognition (0 session thật) đánh dấu experimental |
| Flow | chưa có; profile Workflow và `feature.yaml` thuộc Work | **thiếu**; chỉ xây khi có tenant K5 thật |
| Ask | inline execution contract (`ACCEPTED_CONTRACT_FIELDS`) và session contract | **gần đúng**: thêm capability, rigor, independentOf |
| `bind()` một chỗ | `binding.mjs` + `assignment-policy.mjs` + `resolve.mjs` + redirect + `decide` | **gom**; giữ logic diversity và hai guard H1/H4 của `binding.mjs` |
| Taste | `capabilities.*.prefer`, `modelPolicies`, `rigorToTier` | **giữ**; thêm `.persona`, `.rigor`; **xoá** `executors.for`, default `claude`, `preferExecutor` khỏi PolicyPatch |
| Override theo unit | `--actors` ở start, `--executor/--tier` từng bước | **gom**: lưu vào manifest |
| Tham số `facts` | [fact] không có producer nào ngoài test | **thay** bằng `capability` của unit lưu trong manifest |
| Persona | chỉ là tên chèn vào prompt; `core/agents/*.yaml` | **sửa**: nạp nội dung; bỏ `model_tier` |
| Một cửa | `executeAssignment` đạt; plain `execute` ghi `dispatch-runs/` không đạt | **xoá** cửa `dispatch-runs` |
| RunResult inline | `fgos dispatch log` chỉ cho out-of-process | **thiếu** |
| `mechanism` | `unavailable` | **đổi tên** thành `inline` |
| Driver chung | `fgos-code-change`, `coordination-driver.md`, `coding-cell-policy.md` | **tổng quát hoá**; xoá `fgos-code-panel`, `fgos-plan-loop` |
| Close-check | chưa có | **thiếu**, nhỏ |

No component-boundary change ở mức đề xuất; các bước triển khai S3 trở đi cần đối chiếu `docs/platform/component-boundary.md`.

## D. Chấm điểm, lộ trình, không nên làm

Phương án Y để so: pattern chạy bằng prose của Lead cộng một primitive `run --ask`; engine chỉ dành cho Flow.

| Tiêu chí | Hiện tại | B | Y |
|---|---|---|---|
| Đơn giản | 1 | 4 | 3 (path ad-hoc gọn hơn nhưng có hai sequencer) |
| Linh hoạt | 2 | 5 | 4 |
| Tường minh | 2 | 5 | 5 |
| Đo được | 2 | 4 | 3 (Observe phải học cách nhóm mới) |
| Chi phí chuyển đổi | — | 4 | 2 |

Chọn B. Giữ Y làm đường lui nếu bake-off cho thấy nghi lễ session vẫn quá đắt (mục E1).

### Lộ trình

| Bước | Giao được | Xoá được | Rủi ro |
|---|---|---|---|
| **S1. Slot + khẩu vị docs** | **K3**: mỗi area một lệnh `start --capability docs:write --cwd <wt>`, không roster tay | 6 dòng `capability:` trong master loop; tham số `facts` chết | test gắn với protocol id; chạy song song thật cần smoke 2 area; `prefer` phải kèm invocation cho tới khi plan tier xoá redirect |
| S2. Override bền + `solo` | K1, K2, K6 | kind `agent-led`; cửa `dispatch-runs`; ngoại lệ stamp ở cửa contract | 157 session agent-led cũ vẫn phải đọc được |
| S3. Một binder ở cửa chạy | provenance một chuỗi; `bind --explain` | `preferExecutor`, `executors.for`, default `claude`, default `code-reviewer`, default `'code:implement'` | cùng file với plan tier, nên làm sau khi plan đó merge |
| S4. Unit trong phase file + driver chung | "chạy phase N" cho mọi domain | DemandFacts, matcher, `form`, `fgos-code-panel`, `fgos-plan-loop` | agent chọn sai verb, xem E2 |
| S5. Persona + inline run | persona có nội dung; inline đo được | `model_tier`, `implied-by-persona` | — |
| S6. `panel` + Flow | K4 một pattern; K5 khi có tenant | 4–8 protocol YAML | xây Flow sớm là lặp lại lỗi "platform trước tenant" |

S1 gồm đúng bốn việc:

1. Bỏ `policy.capability` khỏi master loop; đổi `red-team-candidate` thành `driver-authorized`. `fgos-code-change` vẫn authorize nó nên hành vi code không đổi.
2. `coordination start` nhận `--capability`, lưu vào manifest; `composeActionRequest` (`src/verbs/coordination/actions.mjs:208`) đọc lại cho mọi node.
3. Config thêm `docs:write.prefer = [openai]` và `docs:review.prefer = [claude/claude-cli-readonly]`.
4. Close-check trước khi merge; sửa `metrics harness` đọc đúng `definitionRef.id`.

### Không nên làm

- FlowDefinition cho từng plan; protocol cho từng tổ hợp domain × pattern.
- Cú pháp slot mới (`capability: {slot: …}`, `slotBindings`). Vắng capability đã là slot.
- Đăng ký trước `docs:*` với `serves`. Một key config cộng fallback là đủ.
- Scheduler Node mới cho DAG ghi file. Lead, worktree và N session là đủ.
- Executor mặc định "an toàn" ở đáy bảng.
- Vòng học khẩu vị (B8 của báo cáo advice) trước khi có số đo sạch.
- Xây Flow nghiệp vụ trước khi có một tenant thật.

## E. Tự phản biện

1. **Giữ session engine làm sequencer có thể giữ luôn chi phí.** Chuyến chạy ~10 run, ~150 phút ở §6.6 đến từ luật vòng lặp và nghi lễ driver, không phải từ binding. Phát hiện sớm: pilot S1 trên 2 area trong một Observe case, so wall time và số lần người can thiệp với cùng việc làm bằng Lead + subagent. Thua rõ thì chuyển Y.
2. **Bỏ DemandFacts có thể đưa keyword-spotting quay lại; rule pattern trong config có thể quá thô.** Phát hiện sớm: ghi tỉ lệ override capability/pattern và tỉ lệ finding được `accepted` theo pattern. Reviewer pass dưới 3 phút với 0 finding nhiều lần liên tiếp là tín hiệu đóng dấu.
3. **Hai bộ lọc cộng lại có thể làm rỗng candidate** (readOnly + độc lập + hết quota), khiến bước treo chờ người, trái ưu tiên #2. Gom binder cũng có thể làm mất hai guard H1/H4. Phát hiện sớm: test chạy `bind --explain` cho K1–K6 trên config thật; doctor check "mỗi capability chỉ-đọc có ≥ 2 provider family có invocation read-only".

## Trả lời 9 câu hỏi cụ thể

1. Phân rã do agent phán, máy lint (id, chu trình, `writes` giao nhau, không ghim hạ tầng). Plan và yêu cầu tự do sinh cùng một dạng Unit.
2. Khai `capability` trực tiếp. Không cần cả hai: facts → capability hiện là ánh xạ một-một qua `serves`, nên DemandFacts chỉ là biểu diễn thứ hai của cùng thông tin.
3. Rule trong config làm mặc định; agent hoặc câu chữ của user override, có ghi lý do. Flow thì khai sẵn.
4. FlowDefinition chứa: unit, `dependsOn`, capability, rigor, readOnly, independentOf, cổng người, và persona khi bước thật sự đòi. Không chứa: executor, invocation, provider, model, tier. `rigor` (thay `minTier`) là yêu cầu của bước. Persona mặc định là khẩu vị, chỉ thành yêu cầu khi Flow nêu tên.
5. Có. Ba pattern: `solo`, `reviewed` (objector tuỳ chọn), `panel`.
6. Cả hai, theo cùng bảng ưu tiên: vai khai là yêu cầu, `capabilities[cap].persona` là khẩu vị. Chỉ ảnh hưởng prompt.
7. Không cần tách trong catalog. `domain:verb` là key config tuỳ chọn, có fallback về `verb`. "Tách" trở thành một dòng dữ liệu.
8. Pattern `solo` đi cùng engine và cùng cửa `executeAssignment`. Điều kiện ghi file là "cwd là linked worktree", không phải "có protocol stamp". Xoá cửa `dispatch-runs`.
9. Theo thứ tự lợi/chi phí: (a) 6 dòng ghim `capability` trong master loop; (b) cặp `facts`/`agent-led`; (c) cửa `dispatch-runs`; (d) `preferExecutor` + `executors.for` + default `claude`; (e) DemandFacts + matcher + `form`.

## Chỗ fact sheet §6 sai hoặc thiếu (nếu có)

1. **§6.1 sai số.** `src/runner/dispatch/**` là 32.047 dòng. 60.213 dòng là cả `src/runner/**`. Coordination đúng: 14.575 + 6.117.
2. **§6.3 nói nhẹ hơn thực tế.** `facts` không có producer nào trong `src/` và `bin/`, kể cả ở node đầu: `start` không nhận và không truyền (`bin/fgos.mjs:2741-2780`). Nhánh `facade-primary` là code chết. `domain` cũng không bao giờ tới nên fallback luôn ra `review`, capability này không có `prefer`, nên actor unbound.
3. **§6.3 thiếu.** DAG mode từ chối mọi bước không read-only (`dag-request-compiler.mjs:65`).
4. **§6.4 thiếu override không bền.** Roster ở `start` không theo sang bước sau (`composers.mjs:434`). `--executor` ở bước sau tắt mọi computed binding của bước đó (`composers.mjs:53`).
5. **§6.4 thiếu hai nơi chứa khẩu vị.** `model_tier` trong `core/agents/*.yaml` (đường in-process, qua `scripts/project-agents.mjs`); `validate-plan.policy.preferExecutor: claude` trong `domains/coding/workflows/feature.yaml`.
6. **§6.4 persona, đã xác nhận.** Không file nào trong `src/` đọc `voice`/`style`/`archetype`/`decision_boundary`; `src/runner/agent-roster.mjs` chỉ đọc `name` và `skills`. Nội dung persona chỉ tới worker qua agent type của host.
7. **§6.5 "chỉ một chỗ mặc định code" chưa đủ.** Còn `assignment-policy.mjs:391` (persona `code-reviewer`) và gate của `fgos-code-change`.
8. **§6.5 Observe đang đo sai.** `metrics harness` đếm protocol từ `core/protocols/*.json` (thư mục không tồn tại) và `session.json.protocol.id` (field không tồn tại; field thật là `definitionRef.id`) tại `packages/observe/rust/src/metrics_cli/harness.rs:226-250`. Hai số luôn bằng 0.
9. **Store session bị nhiễm.** Trong 602 session: 512 `active`; khoảng 115 có `definitionRef.id` dạng `test.*` hoặc `some-def` (test rò vào store thật); 157 agent-led. Dùng thật: master loop 249, consult 34, research fan-out 30, architecture panel 8. Delphi, nominal, rfc, group-cognition: 0.
10. **§4 so với config.** Config hiện có `code:review.prefer = openai/codex-cli-bwrap`, `execute.prefer = claude`, `review` không có `prefer`. Khẩu vị §4 chưa nằm trong config.
11. [suy luận, chưa chạy `decide`] `capability-catalog.md` ghi `decide --for review` trả mặc định, nhưng `executors.xai.for` có `review` nên nhánh `capability.for` của `resolve.mjs` sẽ trả xai.

## Câu hỏi còn mở cho owner

1. Rule chọn pattern: chấp nhận đặt trong config như khẩu vị? Ngưỡng mặc định đề xuất: ghi file + rigor ≥ standard thì `reviewed`; `critical` thì thêm objector.
2. Objector có thành tuỳ chọn cho cả code không, hay code vẫn luôn có red-team?
3. Có nhận `capabilities.<cap>.rigor` (sàn) vào plan tier không, hay giữ `rigorToTier` toàn cục và để pattern khai rigor?
4. Tên verb: `execute`, `code:implement`, "viết tài liệu" là cùng một verb. Chọn tên nào?
5. Review có bao giờ được inline không, hay luôn dispatch để có context sạch và invocation read-only?
6. Khi nào có tenant thật cho K5? Trước đó Flow chỉ nên là schema trên giấy.
7. `model_tier` trong `core/agents/*.yaml`: đưa vào plan tier (phase 1 hoặc 5), hay để S5 ở đây?
