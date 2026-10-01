# Trả lời: OpenAI GPT-5.6 Sol

## Tóm tắt lập trường (≤ 8 dòng)

- [suy luận] Điểm hội tụ nên là một **canonical RunGraph IR trước binding**, ưu tiên mở rộng `AssignmentPlan` hiện có nếu đủ thay vì tạo type/scheduler mới. FlowDefinition và yêu cầu/plan chỉ là hai nguồn cùng sinh IR này.
- [suy luận] Hot path logic là `Unit → canonical graph → Binding → Run/RunResult`; Work đứng ngoài. Runtime phải tái dùng assignment runner, mutation admission, worktree lifecycle và Observe hiện có.
- [suy luận] Unit lưu **một capability đã chọn**, không lưu cả capability lẫn tám `DemandFacts`; facts chỉ là chất liệu để agent chọn và linter kiểm.
- [suy luận] FlowDefinition khai semantics (`capability`, `rigor`, role, dependency, mutation, evidence, human gate), không khai executor/tier/provider/model hay owner preference.
- [suy luận] Một bảng binding project-local theo `(capability, domain, role)` chọn executor/invocation/persona; rigor đi đúng chuỗi đã chốt tới tier/model.
- [suy luận] Inline và external đều phải materialize Assignment/Run/RunResult qua cửa hiện có; khác nhau ở executor, không khác scheduler hay cửa đo.
- [suy luận] Vertical slice đầu phải vừa chạy K3 vừa chứng minh một FlowDefinition hiện hữu đi cùng runtime; không xây đường K3 mới rồi hứa hội tụ sau.
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

```yaml
Run:
  assignmentId: assignment-author
  executor: openai
  worktree: ../phase-06-observe
RunResult:
  runId: run-author
  outcome: pass          # pass | findings | execution-failure | policy-refusal | blocked
  evidence: [runs/run-author/result.json]
  next: [review]         # findings có thể mở fix/re-review; human gate mở approve/reject/resume
```

[suy luận] `Unit` là output chung của cả plan AgentKit và yêu cầu tự do. Canonical graph là **điểm hội tụ trước binding**, không phải runtime mới: ưu tiên nâng `AssignmentPlan` hiện có để nhận node/dependency/gate còn thiếu. FlowDefinition và các template `solo/review/fanout` đều compile/normalize vào đó; sau đó tái dùng binder, assignment runner, admission, worktree và RunResult hiện có. Nếu implementation cần scheduler thứ hai, đề xuất này phải bị bác.

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
| 2 | One-shot request override có selector node/role | K6 chọn OpenAI cho đúng reviewer, nhưng vẫn phải thỏa #1 | tier chỉ nâng | override khi step không khóa persona |
| 3 | Project preference `(capability, domain, role)` | owner cấu hình một lần; specificity cao hơn thắng, hòa thì refuse ambiguous | `rigorToTier → modelPolicies[provider][tier]` | default theo role/domain |
| 4 | Capability default | executor/invocation mặc định | cùng chuỗi rigor | persona mặc định capability |
| 5 | Không cấu hình | Lead inline nếu governance cho phép | model của Lead; vẫn ghi provenance | none |

[suy luận] Governance là veto cuối về thời điểm thực thi nhưng đứng đầu về hiệu lực. `distinctProviderFrom` là constraint trên toàn nhóm graph, kể cả sibling fan-out; resolver phải giải theo constraint/binding order xác định, không dựa array order hay chỉ các Assignment đã bind như giới hạn hiện tại (`binding.mjs:112-133`). Không đủ provider hợp lệ thì refuse/needs-input, không âm thầm bỏ constraint.

### 4. Persona, inline, worktree, Observe, Work

- [suy luận] Persona là **prompt behavior profile**: tone, checklist, judgment lens, domain obligations. Nó không đổi executor/tier. Registry persona phải có nội dung versioned; không chỉ string label.
- [suy luận] Persona trên Flow step chỉ khi là semantics nghiệp vụ, ví dụ `brand-reviewer`. Khẩu vị `docs-reviewer` mặc định nằm trong project binding config.
- [suy luận] Mọi node, kể cả Lead-inline, tạo Assignment, Run và `runs/<id>/result.json` qua assignment lifecycle hiện có. Inline nghĩa executor=`current-session`; không có legacy `.fgos/dispatch-runs`.
- [suy luận] `mutation: mutating` bắt buộc worktree và phải qua cùng mutation admission. Khi bỏ protocol-operation stamp, producer và `executeAssignment` phải cut over cùng bước, không thêm bypass.
- [suy luận] Work nối đúng một chỗ: input `{request, constraints, refs}` → driver; output `{graph id, artifacts, RunResults, recommendation}` → Work verb quyết lifecycle. Khớp boundary hiện tại (`work-integration.md:16-44`).

### 5. Trace K1–K6

| Kịch bản | Trace đích |
|---|---|
| K1 | Lead sinh 1 Unit code/change/high/review → template review sinh author+reviewer → config bind hai provider → cùng assignment runner tạo Run/RunResult; findings mở fix/re-review, pass mới đóng. |
| K2 | 1 Unit docs/finding/standard/solo/read-only → không executor config thì current-session Run vẫn ghi `result.json` → Observe thấy cùng lifecycle. |
| K3 | Lead sinh area Units; mỗi author/reviewer pair trả reviewed commit + source digests + ledger delta. Một integration/ledger writer áp tuần tự vào plan branch và chạy conservation sau **mỗi target commit**, không chờ mọi area xong. |
| K4 | 1 decision Unit → `fanout(count=3)+synthesize`; binder giải provider-diversity trên ba sibling trước chạy; thiếu candidate thì refuse/needs-input. |
| K5 | Marketing FlowDefinition normalize thành brief→author→brand-review→human gate→publish trên cùng canonical graph; approve mở publish, reject/resume có transition tường minh. |
| K6 | Như K1; one-shot selector chỉ override reviewer sang OpenAI; governance/diversity vẫn veto và provenance ghi override. |

## C. Đối chiếu với hiện tại

| Đích | Hiện có gần đúng | Hành động |
|---|---|---|
| Unit schema chung | DemandFacts + plan lint convention | **Gom/đổi** thành Unit; matcher là helper, không runtime IR |
| Canonical graph | `AssignmentPlan` + FlowDefinition graph + coordination request DAG | **Mở rộng/gom** representation hiện có; không tạo scheduler/runtime tên RunGraph nếu `AssignmentPlan` đảm nhiệm được |
| 3 template | master loop, research fan-out, consult/panels | **Gom** solo/review/fanout thành authoring templates; human gate và result transition là graph semantics |
| FlowDefinition | loader 3 tầng + validator | **Giữ**, bỏ hạ tầng preference khỏi definition |
| capability slot | `deriveOperationCapability` | **Giữ ý**, bỏ fallback ngầm; compiled node phải có capability |
| binder duy nhất | `bindOperations` + assignment policy + resolve | **Gom**; binding phải nhận Assignment facts và trả một provenance chain |
| project preference `(capability,domain,role)` | `capabilities.<name>.prefer` | **Mở rộng dữ liệu**, không tạo `docs:*` chỉ để routing |
| rigor chain | plan tier-rigor đã chốt | **Nhận nguyên** |
| persona registry có body | `preferPersona` + `core/agents` labels | **Thiếu, xây nhỏ**; tách persona khỏi agent type |
| một run door | Assignment runner + coordination | **Giữ và tái dùng**; cut over inline/solo mutation vào cùng admission, **xoá** legacy dispatch-run sau khi mọi caller đã chuyển |
| generic plan/free-request facade | coding-only `fgos-code-change` | **Mở rộng caller**, không dựng runtime bên dưới thứ hai |
| Observe mọi run | RunResult/Coordination sources | **Giữ**; mọi producer phải ghi `runs/<id>/result.json`, phân biệt pass/findings/execution/policy/blocked |

## D. Chấm điểm, lộ trình, không nên làm

### Chấm điểm

| Tiêu chí | Điểm /5 | Lý do |
|---|---:|---|
| Đơn giản | 4 | Một IR trước binding và runtime hiện có; mất điểm nếu phải thêm type/scheduler thay vì mở rộng `AssignmentPlan`. |
| Linh hoạt | 4.5 | Domain/pref/flow đều là data; ad-hoc không cần FlowDefinition. |
| Tường minh | 4.5 | Precedence, selector, tie-break và provenance phải cùng được khóa. |
| Đo được | 4 | Chỉ đạt 5 khi inline/current-session thật sự ghi RunResult và Observe đọc được. |
| Chuyển đổi | 3 | Phải cut over producer và admission cùng bước; vertical slice vẫn khả thi nếu tái dùng runtime. |

### Lộ trình

1. **Khóa eligibility của K3 trước.** Tách “build/smoke harness” khỏi “chạy Phase 6 thật”; xác minh Phase 5, các prerequisite Observe/RunResult, authorization, area ownership/dependency và sửa contract authoring hiện tại ở plan §7.2. Chưa đủ gate thì runner refuse, nhưng việc build/smoke vẫn tiến được.
2. **K3 vertical slice trên runtime hiện có.** Mở rộng `AssignmentPlan` (hoặc representation hiện có tương đương) thành canonical graph tối thiểu; không thêm scheduler. FlowDefinition hiện hữu và K3 area pair phải cùng đi qua binder, mutation admission, assignment runner, worktree và RunResult. Cut over producer lẫn `executeAssignment` trong cùng bước; không bypass protocol stamp một phía.
3. **Smoke hai area song song, không chỉ một area.** Mỗi pair trả reviewed commit + digests + ledger delta; integration/ledger writer áp tuần tự vào plan branch và chạy conservation sau mỗi target commit. Kiểm cả findings→fix/re-review, pass, policy refusal và terminal closure. Chỉ sau smoke này và authorization mới chạy Phase 6 thật.
4. Mở rộng cùng canonical graph cho ad-hoc templates và các FlowDefinition còn lại; hợp nhất binding precedence/provenance, selector/tie-break và provider-diversity constraint. Nhận nguyên migration tier-rigor đã chốt.
5. Cut over Lead-inline/solo mutation vào cùng RunResult lifecycle, smoke Observe, rồi xoá `openDispatchRun`/`.fgos/dispatch-runs`, facade/protocol deprecated và các đường materialization song song.

**Không nên làm:** tạo type `RunGraph` nếu `AssignmentPlan` mở rộng được; viết compiler/scheduler/runtime K3 thứ hai; thêm `slotBindings` song song với capability; tạo `docs:*` chỉ để chọn model; FlowDefinition cho từng plan; policy preference trong YAML; matcher tự đoán capability lại lúc runtime; bỏ mutation admission thay vì cut over; giữ legacy dispatch-run để “tương thích”; thêm Rust subsystem mới trước khi K3 vertical slice chạy thật.

## E. Tự phản biện

1. **Canonical graph có thể chỉ đổi tên độ phức tạp hiện có.** Phát hiện sớm: cần type/scheduler mới hoặc K3 và FlowDefinition đi hai entry/runtime khác nhau. Gate: ưu tiên mở rộng `AssignmentPlan`; một K3 pair và một FlowDefinition phải có cùng persisted Assignment shape, admission, runner và RunResult.
2. **Agent phân rã K3 có thể tạo Unit không ổn định/overlap.** Phát hiện sớm: dry-run hai lần cho graph khác nhau hoặc write-scope collision. Gate: canonicalized graph diff + deterministic cycle/overlap validator trước mutation.
3. **Outcome/gate có thể bị mô tả nhưng không vận hành.** Gate: permanent scenario phải chứng minh findings không bị coi là execution failure, fix/re-review tiếp tục được, human reject/resume đúng transition và session đóng terminal.

## Trả lời 9 câu hỏi cụ thể

1. **Agent phân rã; máy chỉ validate DAG, scope, dependency.** Plan và yêu cầu tự do phải sinh cùng Unit.
2. **Unit khai capability trực tiếp.** DemandFacts là input giải thích/lint tùy chọn, không phải field runtime thứ hai.
3. **FlowDefinition quyết khi có; không có thì agent chọn template; config không chọn pattern.** Máy chỉ compile.
4. **FlowDefinition chứa graph, role, capability, rigor, mutation, evidence, constraints, human gate.** Không chứa executor/provider/model/tier hay owner preference. Persona chỉ nằm trên step nếu nó là semantics nghiệp vụ.
5. **Có; ba template đủ:** `solo`, `review`, `fanout`; human approval là gate primitive. Red-team là reviewer role/persona, không phải pattern mới.
6. **Persona semantic nằm trong step; persona mặc định nằm config.** Nó chỉ ảnh hưởng prompt, không executor/tier.
7. **`execute/review + domain` đủ.** Chỉ tạo `docs:*` khi behavior contract khác, không vì routing preference.
8. **Solo unit vẫn materialize Assignment/Run/RunResult qua assignment lifecycle hiện có.** Không coordination session bắt buộc, không scheduler mới, không legacy dispatch-run.
9. **Xoá trước:** `form` như runtime branch, legacy dispatch-run sau cutover, `purpose` alias nội bộ, capability fallback ngầm, persona-label-không-body, và protocol/facade deprecated. Tier-rigor plan xử lý cụm vocabulary chất lượng riêng.

## Chỗ fact sheet §6 sai hoặc thiếu (nếu có)

- [fact] Quy mô `src/runner/dispatch/**` hiện là **32.047** dòng `.mjs`, không khoảng 59k theo phép đếm cùng phạm vi; coordination + verbs là **20.692**, definitions **2.009**. Có thể 59k đã cộng phạm vi khác nhưng prompt không nói rõ.
- [fact] Core hiện có đúng 13 protocol.
- [fact] Persona không chỉ “chưa xác nhận”: runtime chèn đúng tên vào prompt (`assignment.mjs:713-765`); `core/agents/*.yaml` được `agent-roster.mjs` dùng để chọn agent type, không cung cấp persona body cho đường này.
- [fact] K3 mô tả “~15 area, mỗi area một worker” là scenario mục tiêu, chưa phải contract hiện hành của Phase 6. Phase file chưa enumerate units; plan §7.2 hiện ghi authoring bởi Lead và review theo area batch.
- [fact] `fallbackExecutors` bị tài liệu accepted mô tả `reserved-not-executed` (`dispatch-control-plane.md:181-187`), nhưng runtime đã dùng `compiledPlan.policy.executorPreference.slice(1)` cho provider-capacity refusal (`assignment-runner.mjs:1070-1118,1767-1804`). Drift nằm ở tài liệu; đây không phải retry/failover chung cho mọi lỗi.
- [fact] `deriveOperationCapability` là nửa slot thật, nhưng `facts` không được `startCoordinationUseCase` truyền rõ từ CLI và action composer gọi không có facts (`actions.mjs:198-220`); fallback domain vì vậy không bền qua session.

## Câu hỏi còn mở cho owner

1. K3 hiện `not-authorized`, blocked by Phase 5 và plan §7.2 còn khóa Lead-inline authoring. Owner cho phép đến đâu: chỉ build/smoke harness, hay sau khi đủ Observe/RunResult prerequisite sẽ authorize Phase 6 và sửa execution contract sang external author/reviewer + integration writer?
2. Persona nghiệp vụ như `brand-reviewer` có được phép khóa ở FlowDefinition, hay mọi persona đều phải override được theo request? Đề xuất: persona semantic được khóa; persona preference thì override được.
