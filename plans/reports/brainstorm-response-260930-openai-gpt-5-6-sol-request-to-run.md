# Trả lời: OpenAI GPT-5.6 Sol

## Tóm tắt lập trường (≤ 8 dòng)

- [suy luận] Điểm hội tụ nên là **RunGraph**: DAG các Assignment slot; FlowDefinition chỉ là template tái dùng sinh RunGraph, còn yêu cầu/plan không có flow do Lead sinh cùng IR.
- [suy luận] Chỉ giữ bốn khái niệm trên hot path: `Unit → RunGraph → Binding → Run/RunResult`; Work đứng ngoài và chỉ đưa input/nhận evidence.
- [suy luận] Unit lưu **một capability đã chọn**, không lưu cả capability lẫn tám `DemandFacts`; facts chỉ là chất liệu để agent chọn và linter kiểm.
- [suy luận] FlowDefinition khai semantics (`capability`, `rigor`, role, dependency, mutation, evidence, human gate), không khai executor/tier/provider/model hay owner preference.
- [suy luận] Một bảng binding project-local theo `(capability, domain, role)` chọn executor/invocation/persona; rigor đi đúng chuỗi đã chốt tới tier/model.
- [suy luận] Inline và external đều phải materialize Assignment/Run; khác nhau ở executor, không khác cửa chạy/đo.
- [suy luận] Bước đầu tiên phải là vertical slice chạy K3, không phải thêm slot/protocol tổng quát trước rồi vẫn chưa chạy được plan.
- [fact] Hiện các mối nối đã tồn tại từng phần, nhưng nằm ở prose, facade coding, binding composer và legacy dispatch path khác nhau.

## A. Hiện trạng (trace K1, K3, K5 + bảng đếm khái niệm)

### K1 — sửa bug ad-hoc

| Tầng | Ai quyết; input → output | Bằng chứng và chỗ gãy |
|---|---|---|
| 1 Hiểu | Lead đọc câu user, tự xác định code/bug/đủ rõ. | [fact] `capability-matching.md:14-24` giao Q0/Q1 cho agent; code không parse prose. |
| 2 Phân rã | Lead tạo một change unit, hoặc tự nhận đây là “single cell”. | [fact] `fgos-code-change/SKILL.md:21-23,42-48`; không có canonical Unit runtime. |
| 3 Phân loại | Lead khai 8 DemandFacts; `matchCapability` chọn `code:implement`, form `protocol`. | [fact] `capability-match.mjs:61-86,114-125,140-183`. Việc khai facts vẫn thủ công. |
| 4 Cộng tác | Facade hạ xuống master loop doer → reviewer/red-team → fixer/recheck. | [fact] `fgos-code-change/SKILL.md:30`; YAML `standalone-master...:104-167`. Pattern ghim `code:*`; một bug luôn chịu first-pass reviewer + red-team. |
| 5 Binding | `code:implement` → Gemini; `code:review` → OpenAI; tier từ `minTier`; reviewer persona mặc định `code-reviewer`. | [fact] `.fgos/config.json:87-117`; `assignment-policy.mjs:250-299,387-401`. [fact] Đây không khớp khẩu vị owner “review code = Claude Opus”. |
| 6 Chạy/đo | Facade mở worktree, coordination tạo Assignment/Run, RunResult và session được Observe đọc. | [fact] `fgos-code-change/SKILL.md:85-115`; Run source đọc `.fgos/assignments` (`packages/run-result/rust/src/lib.rs:330-337`), session source ở `packages/coordination-state/rust/src/lib.rs:23-25`. |

### K3 — chạy Phase 6 của plan tài liệu

| Tầng | Ai quyết; input → output | Bằng chứng và chỗ gãy |
|---|---|---|
| 1 Hiểu | Lead phải đọc `plan.md` + phase và tự giữ authorization/dependency. | [fact] Nhánh plan ghi Phase 6 `not-started`, `not-authorized`, blocked by Phase 5; phase file chưa liệt kê area units. |
| 2 Phân rã | Lead tự suy ra area batches, dependency, worktree, ledger writer. | [fact] Plan §5 yêu cầu child worktree và cấm hai writer cùng target/ledger; Phase 6 chỉ nói “to be detailed when authorized”. Không có machine-readable units. |
| 3 Phân loại | `plan-lint` chỉ đọc `plan.md` block `- unit` hoặc Product Gates. Plan này không dùng convention đó. | [fact] `capability-plan-lint.mjs:8-21,101-118`; `fgos-code-change/SKILL.md:76`. K3 không qua gate hiện tại. |
| 4 Cộng tác | Facade duy nhất cho plan là coding master loop; chính plan loại nó và giữ Lead authoring inline + từng review session. | [fact] Plan §7.2 trên nhánh; master loop ghim `code:implement/review` (`standalone-master...:104-167`). Phân rã/cộng tác phải làm tay. |
| 5 Binding | Generic `execute` hiện prefer Claude, `review` không có `prefer`; owner muốn docs author OpenAI và review Claude Opus. | [fact] `.fgos/config.json:51-68`. Không có rule `(domain=docs, role=author/reviewer)`. |
| 6 Chạy/đo | Authoring inline không materialize Assignment/Run; review coordination được đo. Legacy `execute` thường ghi `.fgos/dispatch-runs`, Observe không có source cho store này. | [fact] `dispatch/cli.mjs:260-270`; Observe composition đọc Assignment/RunResult và Coordination, không đọc `dispatch-runs`. Đây là lỗ chặn K3. |

### K5 — marketing FlowDefinition

| Tầng | Ai quyết; input → output | Bằng chứng và chỗ gãy |
|---|---|---|
| 1–2 | Lead vẫn phải chọn đúng definition và điền objective/context; definition cho graph/steps. | [fact] Loader chỉ discover/validate, không tự chọn (`protocol-loader.mjs:1-15,17-55`). |
| 3–4 | Operation khai role/capability/policy/result; graph khai dependency/activation. | [fact] `flow-definition.md:178-205`; 13 protocol core hiện tại, chưa có marketing flow. |
| 5 | Composer bind `policy.capability` qua `capabilities.<name>.prefer`; request actor/CLI override thắng. | [fact] `binding.mjs:89-109,169-215,268-329`; `composers.mjs:22-35`. Nếu capability không có `prefer`, binder để unbound. |
| 6 | `coordination start/run` materialize Assignment qua cùng session engine; mutating step chỉ hợp lệ trong linked worktree. | [fact] `session-engine.mjs:2635-2675`; `execution-contract.mjs:315-330`. Human approval có thể là human-turn/driver action, nhưng chưa là một operation primitive `human-only`. |

### Đếm khái niệm

| Khái niệm hiện tại | Nơi sống | Trùng/chồng |
|---|---|---|
| 8 `DemandFacts` | prose + `capability-match.mjs` | `domain`, `mutates`, review need, size/rigor lặp lại trong unit/policy/contract |
| capability | unit annotation, `policy.capability`, `capabilities[]`, executor `for[]` | `capabilities[]` là tool requirements nhưng tên gần giống routing capability; `purpose` là alias cũ |
| form | `inline/protocol/facade` | Quyết execution shape nhưng không phải IR chạy |
| Unit | convention Markdown | Không có schema dùng chung giữa plan và ad-hoc |
| FlowDefinition operation/graph | YAML | Gần với Unit DAG nhưng là đường riêng |
| role / actor / persona | definition, request, policy, prompt | Persona hiện chỉ là tên chèn prompt (`assignment.mjs:713-765`); file `core/agents/*.yaml` phục vụ agent roster, không được nạp làm persona body |
| minTier/tier/rigor/minRigor/mode/size | nhiều policy/config | [fact] Plan tier-rigor đã chốt xoá phần lớn; không thiết kế lại |
| executor/invocation/provider/model/mechanism/adapter | dispatch | Cần nội bộ, nhưng caller đang nhìn quá nhiều selector |
| Assignment/Run/RunResult + legacy dispatch-run | hai store | Hai cửa đo; legacy dispatch-run vô hình với Observe |

## B. Thiết kế clean-sheet (hợp đồng dữ liệu, ai làm tầng nào, điểm hội tụ, bảng ưu tiên, tier, persona, chạy/đo, giao diện Work, trace K1–K6)

### 1. Bốn hợp đồng

```yaml
Unit:
  id: area-observe
  objective: "Transform Observe platform docs"
  domain: docs
  capability: execute
  rigor: high
  mutation: mutating
  inputs: [docs/specs/observe.md, packages/observe/]
  outputs: [docs/platform/observe/]
  writeScope: [docs/platform/observe/**]
  dependsOn: []
  collaboration: review       # solo | review | fanout
  constraints: ["ledger is single-writer"]
```

```yaml
RunGraph:
  nodes:
    - id: author
      unit: area-observe
      role: author
      capability: execute
    - id: review
      role: reviewer
      capability: review
      rigor: high
      mutation: read-only
      distinctProviderFrom: author
      dependsOn: [author]
  gates:
    - {after: review, kind: human, action: approve}   # chỉ khi business flow đòi
```

```yaml
BindingInput:
  assignment: {capability, domain, role, rigor, mutation, distinctProviderFrom, persona?}
  requestOverride: {executor?, invocation?, tier?, persona?}
BindingResult:
  executor: claude
  invocation: claude-cli-readonly
  tier: flagship
  model: opus
  persona: docs-reviewer
  provenance: ["project rule docs/reviewer", "rigor high → flagship"]
```

[suy luận] `Unit` là output chung của cả plan AgentKit và yêu cầu tự do. `RunGraph` là **điểm hội tụ**: không FlowDefinition thì Lead chọn template `solo/review/fanout` và compile; có FlowDefinition thì máy expand definition thành cùng RunGraph. Từ đó chỉ còn một binder và một runtime.

### 2. Ai quyết tầng nào

| Tầng | Chủ thể | Lý do |
|---|---|---|
| Hiểu | Agent | Prose/domain/độ rõ cần judgment; máy chỉ validate schema. |
| Phân rã | Agent; máy kiểm DAG/write overlap | Boundary và dependency cần judgment; cycle/path conflict là tất định. |
| Phân loại | Agent ghi capability + rigor; máy validate registry | Không để máy suy ngược capability lần hai. Matcher chỉ là authoring aid. |
| Cộng tác | FlowDefinition nếu có; nếu không Lead chọn 1 trong 3 template | Business flow là config; ad-hoc shape cần judgment. |
| Binding | Máy | Config + precedence + provenance phải deterministic. |
| Chạy/đo | Máy | Admission, isolation, RunResult và Observe là invariant. |

### 3. Một bảng ưu tiên

| Thứ tự | Nguồn | Executor/invocation | Tier/model | Persona |
|---:|---|---|---|---|
| 1 | Governance/hard requirements | veto nếu sai mutation/read-only/provider diversity | rigor là floor; không hạ | fixed persona chỉ khi step semantics bắt buộc |
| 2 | One-shot request override | K6 chọn OpenAI invocation, nhưng vẫn phải thỏa #1 | tier chỉ nâng | override khi step không khóa persona |
| 3 | Project preference `(capability, domain, role)` | owner cấu hình một lần | `rigorToTier → modelPolicies[provider][tier]` | default theo role/domain |
| 4 | Capability default | executor/invocation mặc định | cùng chuỗi rigor | persona mặc định capability |
| 5 | Không cấu hình | Lead inline | model của Lead; vẫn ghi provenance | none |

[suy luận] Governance là veto cuối về thời điểm thực thi nhưng đứng đầu về hiệu lực. `distinctProviderFrom` lọc candidate sau khi các Assignment trước đã bind; resolver phải hỗ trợ DAG dependency, không dựa array order như giới hạn hiện tại (`binding.mjs:112-133`).

### 4. Persona, inline, worktree, Observe, Work

- [suy luận] Persona là **prompt behavior profile**: tone, checklist, judgment lens, domain obligations. Nó không đổi executor/tier. Registry persona phải có nội dung versioned; không chỉ string label.
- [suy luận] Persona trên Flow step chỉ khi là semantics nghiệp vụ, ví dụ `brand-reviewer`. Khẩu vị `docs-reviewer` mặc định nằm trong project binding config.
- [suy luận] Mọi node, kể cả Lead-inline, tạo Assignment và Run qua một `run assignment` door. Inline nghĩa executor=`current-session`; không có legacy `.fgos/dispatch-runs`.
- [suy luận] `mutation: mutating` bắt buộc worktree; scheduler dùng `writeScope` để phát hiện overlap, nhưng checkout riêng vẫn là isolation authority.
- [suy luận] Work nối đúng một chỗ: input `{request, constraints, refs}` → driver; output `{RunGraph id, artifacts, RunResults, recommendation}` → Work verb quyết lifecycle. Khớp boundary hiện tại (`work-integration.md:16-44`).

### 5. Trace K1–K6

| Kịch bản | Trace đích |
|---|---|
| K1 | Lead sinh 1 Unit code/change/high/review → template review sinh author+reviewer → config Gemini author, Claude reviewer khác provider → hai Run, một worktree. |
| K2 | 1 Unit docs/finding/standard/solo/read-only → không executor config thì current-session Run → Observe vẫn thấy. |
| K3 | Lead đọc phase, sinh 15 area Units + 1 ledger Unit; area chạy song song worktree riêng, ledger dependsOn mọi area và chạy đơn; docs author OpenAI, reviewer Claude Opus. |
| K4 | 1 decision Unit → `fanout(count=3)+synthesize`; binder chọn provider-diverse candidates; bốn Run. |
| K5 | Marketing FlowDefinition compile thành brief→author→brand-review→human gate→publish RunGraph; human gate không bind executor. |
| K6 | Như K1; override reviewer executor=OpenAI chỉ cho request này; provenance ghi override, project preference không đổi. |

## C. Đối chiếu với hiện tại

| Đích | Hiện có gần đúng | Hành động |
|---|---|---|
| Unit schema chung | DemandFacts + plan lint convention | **Gom/đổi** thành Unit; matcher là helper, không runtime IR |
| RunGraph | FlowDefinition graph + coordination request DAG | **Giữ/gom** thành một compiled graph |
| 3 template | master loop, research fan-out, consult/panels | **Gom** solo/review/fanout; human gate là node/gate, không nhân pattern |
| FlowDefinition | loader 3 tầng + validator | **Giữ**, bỏ hạ tầng preference khỏi definition |
| capability slot | `deriveOperationCapability` | **Giữ ý**, bỏ fallback ngầm; compiled node phải có capability |
| binder duy nhất | `bindOperations` + assignment policy + resolve | **Gom**; binding phải nhận Assignment facts và trả một provenance chain |
| project preference `(capability,domain,role)` | `capabilities.<name>.prefer` | **Mở rộng dữ liệu**, không tạo `docs:*` chỉ để routing |
| rigor chain | plan tier-rigor đã chốt | **Nhận nguyên** |
| persona registry có body | `preferPersona` + `core/agents` labels | **Thiếu, xây nhỏ**; tách persona khỏi agent type |
| một run door | Assignment runner + coordination | **Giữ**; đưa inline/solo mutation vào đây, **xoá** legacy dispatch-run |
| generic plan/free-request facade | coding-only `fgos-code-change` | **Tổng quát hóa rồi xoá facade cũ** |
| Observe mọi run | RunResult/Coordination sources | **Giữ**; inline cũng phát cùng contract |

## D. Chấm điểm, lộ trình, không nên làm

### Chấm điểm

| Tiêu chí | Điểm /5 | Lý do |
|---|---:|---|
| Đơn giản | 4.5 | 4 contract, 1 convergence point, 1 runtime; chi phí là Unit + RunGraph compiler. |
| Linh hoạt | 4.5 | Domain/pref/flow đều là data; ad-hoc không cần FlowDefinition. |
| Tường minh | 5 | Một precedence table và provenance trên từng BindingResult. |
| Đo được | 5 | Inline/external/solo/protocol đều là Run. |
| Chuyển đổi | 3 | Phải cắt facade, legacy run store và policy seams; làm vertical slice được. |

### Lộ trình

1. **K3 vertical slice trước.** Thêm Unit/RunGraph tối thiểu và một generic `run plan/phase` facade: Lead phân rã Phase 6 thành area Units; compiler tạo author+review nodes; scheduler mở worktree riêng, serialize ledger; mọi node materialize Assignment/Run. Thêm project rules docs-author→OpenAI, docs-reviewer→Claude read-only/flagship. Sau smoke một area + ledger, chạy Phase 6. **Xoá ngay** requirement dùng coding master loop/hand-written request JSON cho path này. Rủi ro: plan Phase 6 chưa chi tiết và chưa authorized — runner phải refuse trước authorization.
2. Compile FlowDefinition và ad-hoc templates về RunGraph; giữ loader/validator, bỏ path materialization song song.
3. Hợp nhất `bindOperations`, assignment policy và capability resolve thành một binder trên Assignment facts; triển khai precedence/provenance duy nhất; nhận migration tier-rigor đã chốt.
4. Đưa Lead-inline và solo mutation qua Assignment Run door; Observe smoke cả hai; xoá `openDispatchRun`/`.fgos/dispatch-runs`.
5. Cutover facade: generic facade thay `fgos-code-change`; xoá deprecated code-panel/plan-loop và protocol trùng; đo usage rồi giữ hoặc xoá 13 protocol theo template/FlowDefinition thật sự cần.

**Không nên làm:** thêm `slotBindings` song song với capability trên compiled node; tạo `docs:*` chỉ để chọn model; FlowDefinition cho từng plan; policy preference trong YAML; matcher tự đoán capability lại lúc runtime; giữ legacy dispatch-run để “tương thích”; thêm Rust subsystem mới trước khi K3 vertical slice chạy thật.

## E. Tự phản biện

1. **RunGraph có thể chỉ đổi tên độ phức tạp hiện có.** Phát hiện sớm: implementation cần hơn một compiler + một schema, hoặc vẫn giữ hai scheduler. Gate: K3 và K5 phải dùng cùng persisted Assignment shape và scheduler.
2. **Agent phân rã K3 có thể tạo Unit không ổn định/overlap.** Phát hiện sớm: dry-run hai lần cho graph khác nhau hoặc write-scope collision. Gate: canonicalized graph diff + deterministic cycle/overlap validator trước mutation.
3. **Một bảng preference `(capability,domain,role)` có thể chưa đủ cho brand/legal/security.** Phát hiện sớm: K5 cần executor pin trong FlowDefinition. Cách sửa: thêm semantic constraints/required persona, không thêm selector hạ tầng vào flow.

## Trả lời 9 câu hỏi cụ thể

1. **Agent phân rã; máy chỉ validate DAG, scope, dependency.** Plan và yêu cầu tự do phải sinh cùng Unit.
2. **Unit khai capability trực tiếp.** DemandFacts là input giải thích/lint tùy chọn, không phải field runtime thứ hai.
3. **FlowDefinition quyết khi có; không có thì agent chọn template; config không chọn pattern.** Máy chỉ compile.
4. **FlowDefinition chứa graph, role, capability, rigor, mutation, evidence, constraints, human gate.** Không chứa executor/provider/model/tier hay owner preference. Persona chỉ nằm trên step nếu nó là semantics nghiệp vụ.
5. **Có; ba template đủ:** `solo`, `review`, `fanout`; human approval là gate primitive. Red-team là reviewer role/persona, không phải pattern mới.
6. **Persona semantic nằm trong step; persona mặc định nằm config.** Nó chỉ ảnh hưởng prompt, không executor/tier.
7. **`execute/review + domain` đủ.** Chỉ tạo `docs:*` khi behavior contract khác, không vì routing preference.
8. **Solo unit vẫn materialize Assignment/Run qua cùng run door.** Không coordination session bắt buộc, không legacy dispatch-run.
9. **Xoá trước:** `form` như runtime branch, legacy dispatch-run, `purpose` alias nội bộ, capability fallback ngầm, persona-label-không-body, và protocol/facade deprecated. Tier-rigor plan xử lý cụm vocabulary chất lượng riêng.

## Chỗ fact sheet §6 sai hoặc thiếu (nếu có)

- [fact] Quy mô `src/runner/dispatch/**` hiện là **32.047** dòng `.mjs`, không khoảng 59k theo phép đếm cùng phạm vi; coordination + verbs là **20.692**, definitions **2.009**. Có thể 59k đã cộng phạm vi khác nhưng prompt không nói rõ.
- [fact] Core hiện có đúng 13 protocol.
- [fact] Persona không chỉ “chưa xác nhận”: runtime chèn đúng tên vào prompt (`assignment.mjs:713-765`); `core/agents/*.yaml` được `agent-roster.mjs` dùng để chọn agent type, không cung cấp persona body cho đường này.
- [fact] K3 mô tả “~15 area, mỗi area một worker” là scenario mục tiêu, chưa phải contract hiện hành của Phase 6. Phase file chưa enumerate units; plan §7.2 hiện ghi authoring bởi Lead và review theo area batch.
- [fact] `fallbackExecutors` bị tài liệu accepted mô tả `reserved-not-executed` (`dispatch-control-plane.md:181-187`), trong khi comments mới hơn nói Provider Capacity Rotator tiêu thụ nó; đây là drift cần xác minh trước khi dựa vào fallback.
- [fact] `deriveOperationCapability` là nửa slot thật, nhưng `facts` không được `startCoordinationUseCase` truyền rõ từ CLI và action composer gọi không có facts (`actions.mjs:198-220`); fallback domain vì vậy không bền qua session.

## Câu hỏi còn mở cho owner

1. K3 hiện vẫn `not-authorized` và blocked by Phase 5. “Bước đầu đủ chạy K3” có nghĩa là chỉ build/smoke harness, hay đồng thời owner sẽ authorize và bổ sung danh sách area Units?
2. Persona nghiệp vụ như `brand-reviewer` có được phép khóa ở FlowDefinition, hay mọi persona đều phải override được theo request? Đề xuất: persona semantic được khóa; persona preference thì override được.
