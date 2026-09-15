# Executor identity vs execution policy — kiến trúc đề xuất

Advisory, không phải plan. Grounded trên `.fgos/config.json`, `src/runner/dispatch/{config,resolve,assignment-policy,plan,transport,execution-contract}.mjs`, `src/runner/definitions/schema.mjs`, `src/runner/coordination/session-engine.mjs` tại HEAD `b0617eee` (2026-09-15).

## 1. Chẩn đoán từ code thật

| Quan sát | Bằng chứng |
|---|---|
| 18 executor, 16 agent + 2 tool. Tập agent phân rã đúng thành `account × adapter × mode` | `claude`, `claude-reviewer`, `claude-herdr`, `claude-reviewer-herdr`, `claude-bwrap` = 5 id cho 1 account. `codex-cli/readonly/pi/herdr/bwrap` = 5. `agy-cli/herdr/bwrap` = 3 |
| "Reviewer" chỉ là 2 khác biệt: `--effort high` + `--allowedTools` read-only | diff `claude` vs `claude-reviewer` trong config |
| Executor mang policy: `rigorOverrides` per executor (`codex-pi` ép mọi tier về `lightweight`, `agy-*` map `heavy→creative`) | `executors.<id>.rigorOverrides` |
| Capability block mang policy: `providerModel` + `rigorOverrides` + mô tả 3 đoạn giải thích lý do pin gemini-flash | `capabilities.fgos-coding-implement.overrides` |
| PolicyPatch vocabulary hiện tại: `minTier, preferPersona, preferExecutor, fallbackExecutors, visibility, repeatMode`. Không có provider, model, effort, permission intent | `definitions/schema.mjs:validatePolicyPatch` |
| Persona được resolve, ghi provenance, nhưng **không** đi vào prompt | grep `persona` trong `prompt-templates`, `brief`, `prepare`, `assignment-runner`, `worker-session-boot`: 0 hit |
| Transport chỉ thay `{prompt}` `{model}` | `transport.mjs:164` |
| Hai bảng tier: work tier `light/standard/heavy` → policy tier qua `DEFAULT_TIER_TO_POLICY`, rồi mỗi executor/capability tự đè bằng `rigorOverrides` | `config.mjs:457-462`, `plan.mjs:14` |
| `ExecutionContract.policy` chỉ nhận `minTier` | `execution-contract.mjs` |
| Luật đã có và đúng: protocol không được pin executor; model literal chỉ từ assignment/cli; `minTier` raise-only | `assertNoPortableExecutorPin`, `mergePolicyStack` |

Kết luận: nền tảng policy stack đã đúng hướng. Vấn đề là **vocabulary thiếu** (effort, permission intent, provider), nên người cấu hình phải nhét policy vào chỗ duy nhất có thể chứa flag: executor args và capability overrides. Executor phình là triệu chứng, không phải bệnh.

## 2. Trả lời 10 câu hỏi

### Q1. Tách executor identity khỏi execution policy?

Có, và tách theo một tiêu chí duy nhất: **một field thuộc ExecutorProfile khi và chỉ khi giá trị của nó không đổi theo business case của task.** Account, binary, adapter, credential home, sandbox backend, cách giao prompt, trust store: không đổi theo task → executor. Model, tier, effort, persona, tool allowlist theo vai, read-only: đổi theo task → policy.

Executor id trở thành "seat": *ai chạy, bằng gì, ở đâu*. "Làm gì, kỹ đến đâu, được phép gì" đến từ policy.

### Q2. Contract giữa các layer

Chuỗi 5 object, mỗi bước là một hàm thuần, có provenance:

```text
BusinessCasePreset ─┐
FlowDefinition/op   ├─ scoped ExecutionPolicyPatch[] ─► resolve ─► ResolvedExecutionPolicy
role/actor/assign   │                                              │
cli/human, governance┘                                             ▼
                                              bind(policy, ExecutorRegistry) ─► ExecutorProfile
                                                                   │
                                              compile(policy, profile) ─► DispatchPlan
                                                                   │
                                     ProviderAdapter.render(plan) ─► TransportInvocation {argv, env, promptBundle}
```

Ai quyết gì:

| Layer | Được quyết | Cấm |
|---|---|---|
| Surface / skill / business workflow | `businessCase` id, objective, expected outputs | executor, model, effort literal |
| FlowDefinition / protocol | `businessCase`, `minTier`, `preferPersona`, `permissionIntent`, `visibility`, `repeatMode` | executor, provider, model (đã có luật), effort literal provider-specific |
| BusinessCasePreset (project config) | persona, minTier, effort, permissionIntent, preferProvider, fallback rules, rationale | executor id (chỉ được `preferProvider`) |
| Assignment policy resolver | merge stack, chọn provider (preference ∩ governance ∩ availability), derive model từ `modelPolicies[provider][tier]`, derive effort default từ tier | flag names |
| Dispatch control plane (bind + compile) | chọn ExecutorProfile thỏa constraint (provider, permissionIntent, confinement, visibility), mechanism in/out-of-process | thay đổi policy value |
| Capability registry | capability → executors nào *có thể* serve + confinement *requirement* | provider, model, tier, effort, persona |
| ExecutorProfile | account, adapter, confinement, promptDelivery, trust store, **supports** (effort? readOnly? systemPrompt? toolGating?) | mọi giá trị policy |
| ProviderAdapter (mới, per provider family) | map abstract knob → flag/env/config literal | quyết định giá trị |
| Transport | spawn argv/env, giao prompt bundle | biết tên flag |

### Q3. `tier` vs `effort`

Bốn khái niệm, giữ tên riêng, không cho gộp:

| Tên | Trả lời câu | Chủ sở hữu | Vocabulary |
|---|---|---|---|
| `work.size` (nay là work tier) | việc này to cỡ nào | Work item, planning | `light/standard/heavy` |
| `policy.minTier` (rigor tier) | cần chất lượng suy nghĩ mức nào | policy stack | `lightweight/standard/creative/analytical/critical` |
| `policy.effort` (runtime effort) | model nghĩ hết sức tới đâu trong lượt này | policy stack | `low/medium/high/max` (abstract) |
| `plan.model` | model literal nào | derived, không ai chọn tay trừ assignment/cli | string |

Quan hệ: `minTier` chọn **model nào** (qua `modelPolicies`). `effort` chọn **model đó nghĩ kỹ đến đâu**. Trực giao nhưng tier cho effort default: `lightweight→low, standard→medium, creative→medium, analytical→high, critical→max`. Preset hoặc scope cụ thể hơn được đè.

Đổi tên `work.tier` thành `work.size` khi có dịp; hiện hai chữ "tier" cùng tồn tại là nguồn nhầm chính.

### Q4. Effort: policy field chuẩn hay provider option?

**Cả hai, ở hai tầng.** `effort` là policy field chuẩn với vocabulary abstract. ProviderAdapter render nó: claude → `--effort high`; codex → `-c model_reasoning_effort=high`; agy → `--effort high`; pi/glm → không có knob. Provider không hỗ trợ: ghi `effort: {requested: high, applied: unsupported}` vào DispatchPlan, không fail, trừ khi policy đặt `effortRequired: true`.

Lý do không để nó là raw arg: raw arg không có provenance, không audit được, và là lý do trực tiếp sinh ra `*-reviewer` executor.

### Q5. Persona truyền xuống bằng gì?

Persona là **prompt-layer concern**, không phải adapter concern. Đề xuất:

1. `PersonaProfile` registry (tái dùng roster `core/agents/` + `domains/*/agents/` đã có trong `agent-roster.mjs`): `{id, systemPrompt, briefSection, defaultPermissionIntent, defaultToolIntent[], defaultEffort?}`.
2. Resolver output `policy.persona` → prepare bước build `PromptBundle {system?: string, sections: [{id:'role', body}], brief}`.
3. ExecutorProfile khai `promptDelivery.supportsSystemPrompt`. Có → adapter gắn qua slot system (`--append-system-prompt` cho claude, `-c` cho codex). Không → prepend `## Role` section vào brief (repo đã giao prompt qua `brief-<round>.md`, nên đây là đường mặc định an toàn nhất).
4. Persona **cũng** mang `defaultPermissionIntent` và `toolIntent` (abstract: `read-code, run-tests, git-read`). Đây là cách `code-reviewer` thay thế `claude-reviewer`: reviewer = persona + read-only + tool intent, không phải executor.

Không dùng "role profile trong executor adapter": adapter mà biết persona là policy leak.

### Q6. Provider/model chọn ở đâu?

- **Provider**: preference chain `cli > assignment > actor > role > operation > definition > preset > runner default`, sau đó ∩ governance `disallowedProviders` ∩ availability (executor nào của provider đó đang `present`). FlowDefinition chỉ được `preferProvider` khi protocol thật sự cần (vd red-team đa provider); mặc định để trống.
- **Model**: luôn derived `modelPolicies[provider][minTier]`. Model literal chỉ từ assignment/cli (đã là luật). `rigorOverrides` xóa; nếu gemini "standard" yếu hơn claude "standard" thì đó là **provider calibration** và phải sửa trong bảng `modelPolicies.gemini`, không phải đè ở executor.
- **Executor**: chưa bao giờ chọn. Bind step chọn seat cuối cùng.

### Q7. Chống capability config giấu policy

- Validator: `capabilities.<name>` chỉ nhận `description, aliases, providers[], confinement`. Từ chối `providerModel, rigorOverrides, prefer` mang ý nghĩa provider/model/tier. (`prefer` executor cho **tool** capability như `impact-analysis → gitnexus` thì hợp lệ, vì tool không có tier.)
- Mọi lý do dạng "pin X vì Y, revert bằng Z" (như đoạn mô tả `fgos-coding-implement` hiện tại) chuyển sang `BusinessCasePreset.rationale` + `evidence[]` + `revert`.
- `fgos policy explain --case code.implement [--work id]` in stack đã resolve kèm provenance từng field. Cái gì không hiện ở đây thì không được phép ảnh hưởng dispatch.
- Doctor check: executor entry chứa field policy hoặc args chứa flag trong danh sách "policy-shaped flags" của ProviderAdapter → warn (giai đoạn 1), fail (giai đoạn 3).

### Q8. Business-case registry

Có. Nó là scope mới `businessCase` trong stack, nằm ngay trên `runner`, dưới `definition`. Preset là project-owned, protocol chỉ trỏ id. Bộ khởi đầu:

| id | persona | minTier | effort | permissionIntent | preferProvider |
|---|---|---|---|---|---|
| `code.implement` | `implementer` | standard | medium | mutating | gemini (hiện tại) |
| `code.review` | `code-reviewer` | analytical | high | read-only | claude |
| `code.redteam` | `red-team` | analytical | high | read-only | ≠ provider của doer (rule) |
| `architecture.advisory` | `architect-advisor` | critical | max | read-only | claude |
| `discovery.research` | `researcher` | standard | medium | read-only | any |

`code.redteam` cho thấy preset cần 1 rule field: `providerRule: "differs-from: doer"`. Đây là chỗ duy nhất fallback/diversity rule nên sống.

### Q9. Protocol portable + operator override

- Protocol chỉ mang: `businessCase`, `minTier`, `preferPersona`, `permissionIntent`, `visibility`. Luật `assertNoPortableExecutorPin` mở rộng thêm: cấm `model`, cấm `preferExecutor`, cấm effort literal provider-specific (effort abstract thì được).
- Operator override ở 2 chỗ, đều có provenance:
  - `cli` scope (đã có): ad-hoc, một lần.
  - `runner.pins[]` (mới): `{match: {businessCase?, role?, workId?}, patch, reason, until}`. Bắt buộc `reason` và `until` (ngày hoặc `"until:<work-id>-done"`). Pin hết hạn → doctor warn, resolver bỏ qua và log. Pin không mục.
- `governance` cuối cùng, chỉ được **thu hẹp** (disallow, cap effort, ép read-only), không được nới.

### Q10. Migration giảm executor không phá behavior

Xem §6. Nguyên tắc: mỗi bước thêm đường mới **song song**, giữ id cũ như alias có deprecation warning, chỉ xóa khi test + doctor xanh.

## 3. Precedence stack

```text
builtin defaults
< runner            (project config: modelPolicies, default provider)
< businessCase      (preset — MỚI)
< definition
< node
< operation
< role
< actor
< assignment        (model literal cho phép từ đây)
< cli / human       (model literal, preferExecutor cho phép)
< runner.pins       (operator, có reason + until — MỚI)
< governance        (chỉ thu hẹp, luôn thắng)
```

Quy tắc merge theo field:

| Field | Merge rule |
|---|---|
| `minTier` | raise-only (đã có) |
| `permissionIntent` | narrow-only: scope cụ thể hơn được hạ `mutating→read-only`, không được nâng. Nâng lên `mutating` chỉ qua protocol-operation stamp (đã có) |
| `effort` | most-specific-wins, bị `governance.maxEffort` chặn trên |
| `persona`, `preferProvider`, `visibility` | most-specific-wins |
| `model` | chỉ nhận từ `assignment` trở lên; scope thấp hơn khai `model` → validation error (đã có cho YAML) |
| `preferExecutor` | chỉ nhận từ `cli`/`pins`; protocol khai → error (đã có) |
| `toolIntent[]` | union, rồi ∩ với `permissionIntent` (read-only tự loại `git-write`, `fs-write`) |

## 4. Schema ngắn

### BusinessCasePreset

```jsonc
{
  "id": "code.review",
  "version": "1",
  "policy": {                       // một ExecutionPolicyPatch, scope = businessCase
    "preferPersona": "code-reviewer",
    "minTier": "analytical",
    "effort": "high",
    "permissionIntent": "read-only",
    "toolIntent": ["read-code", "run-tests", "git-read"],
    "preferProvider": "claude",
    "providerRule": null            // hoặc "differs-from: doer" cho code.redteam
  },
  "fallback": { "onProviderUnavailable": "next-allowed-provider", "onEffortUnsupported": "proceed" },
  "rationale": "review là quality-first; high effort là default",
  "evidence": ["docs/.../proofs/2026-09-07-v0/"],
  "revert": "đổi preferProvider về ... hoặc xóa preset"
}
```

### ExecutionPolicyPatch (mở rộng PolicyPatch hiện có)

```jsonc
{
  "minTier": "standard",             // raise-only
  "effort": "medium",                // low|medium|high|max, abstract
  "effortRequired": false,
  "permissionIntent": "read-only",   // read-only|mutating, narrow-only
  "toolIntent": ["read-code"],       // abstract, ProviderAdapter map sang allowedTools/-s/--tools
  "preferPersona": "code-reviewer",
  "preferProvider": "claude",        // family, không phải executor
  "preferExecutor": null,            // chỉ cli/pins
  "model": null,                     // chỉ assignment/cli
  "fallbackExecutors": [],           // giữ reserved-not-executed như hiện tại, nói rõ trong doc
  "visibility": "visible",
  "repeatMode": "once"
}
```

### ExecutorProfile (thay executors.<id> hiện tại)

```jsonc
{
  "id": "claude",
  "kind": "agent",
  "provider": "claude",                       // family, bắt buộc, thay providerModel
  "account": { "home": "${HOME}/.claude-fgovn", "env": {} },
  "invocations": [
    { "adapter": "cli-spawn",   "command": "claude", "baseArgs": ["-p"], "promptDelivery": "argv" },
    { "adapter": "herdr-spawn", "command": "claude", "baseArgs": [],     "promptDelivery": "brief-pointer",
      "liveOutput": {...}, "interactiveMode": {...} }
  ],
  "confinement": { "available": ["none", "bwrap"] },   // không phải 1 executor riêng cho bwrap
  "trustStore": { "kind": "claude-json" },
  "supports": {                                        // adapter khai năng lực, không khai giá trị
    "effort": true, "readOnlyMode": "via-allowedTools", "systemPrompt": "--append-system-prompt",
    "toolGating": "allowedTools", "modelFlag": "--model"
  }
}
```

Field bị cấm (validator reject): `model`, `effort`, `persona`, `tier`, `rigorOverrides`, và bất kỳ `baseArgs` entry nào nằm trong `ProviderAdapter.policyShapedFlags` của provider đó (`--effort`, `--model`, `-s read-only`, `--allowedTools`, `--permission-mode`…).

### DispatchPlan (mở rộng output `compileDispatchPlan`)

```jsonc
{
  "selector": { "type": "assignment", "value": "asg-..." },
  "businessCase": "code.review",
  "policy": {                                 // ResolvedExecutionPolicy + provenance từng field
    "minTier":   { "value": "analytical", "source": { "scope": "businessCase", "id": "code.review" } },
    "effort":    { "value": "high",       "source": { "scope": "businessCase", "id": "code.review" } },
    "permissionIntent": { "value": "read-only", "source": {...} },
    "persona":   { "value": "code-reviewer", "source": {...} },
    "provider":  { "value": "claude", "source": {...} },
    "model":     { "value": "opus", "source": { "scope": "derived", "id": "modelPolicies.claude.analytical" } }
  },
  "executor": { "id": "claude", "invocation": "herdr-spawn", "confinement": "none",
                "source": { "scope": "bind", "reason": ["visibility=visible", "provider=claude", "supports.readOnlyMode"] } },
  "runtime": {                                // output của ProviderAdapter.render — literal, audit được
    "argv": ["claude", "--model", "opus", "--effort", "high", "--permission-mode", "acceptEdits",
             "--allowedTools", "Bash(git diff:*),..."],
    "env": { "HOME": "..." },
    "prompt": { "delivery": "brief-pointer", "system": "<persona system prompt>", "sections": ["role"] },
    "applied": { "effort": "applied", "readOnly": "applied-via-allowedTools", "systemPrompt": "applied" }
  },
  "mechanism": "out-of-process",
  "reasonCodes": [...]
}
```

## 5. Invariants

1. **Không field nào trong ExecutorProfile đổi theo business case.** Validator + doctor enforce.
2. **Mọi giá trị chạm transport đều có provenance trong DispatchPlan.** Không có "flag mồ côi".
3. **Chỉ ProviderAdapter biết tên flag.** Transport nhận argv đã render. Executor `baseArgs` chỉ chứa infra args.
4. **Protocol không pin executor/provider-literal/model/effort-literal.** Mở rộng luật hiện có.
5. **`minTier` raise-only, `permissionIntent` narrow-only, governance chỉ thu hẹp.**
6. **Knob không hỗ trợ được ghi lại, không bị nuốt.** `runtime.applied.<knob>: unsupported`.
7. **Capability registry không chứa provider/model/tier/effort/persona.**
8. **Persona đã resolve thì phải tới prompt.** Test: `plan.policy.persona.value` khác null ⇒ `runtime.prompt.sections` chứa `role` hoặc `runtime.prompt.system` khác null.
9. **Một account = một ExecutorProfile.** Adapter, confinement là chiều trong `invocations[]`/`confinement.available`, không phải id mới.

## 6. Migration

Mỗi bước độc lập, test xanh, có thể dừng sau bất kỳ bước nào.

| Bước | Việc | Giảm executor | Rủi ro |
|---|---|---|---|
| 0 | Thêm `ProviderAdapter` cho `claude`, `codex`, `agy`, `pi`, `glm`: `render(policy, profile) → {argv, env, applied}` + `policyShapedFlags[]`. Chưa ai gọi. Test thuần. | 0 | không |
| 1 | Mở rộng `ExecutionPolicyPatch` với `effort`, `permissionIntent`, `toolIntent`, `preferProvider`. Resolver derive `effort` từ tier. `mergePolicyStack` thêm rule narrow-only. DispatchPlan thêm `runtime` + `applied`. Transport: nếu plan có `runtime.argv` thì dùng, không thì đường `{prompt}/{model}` cũ. | 0 | thấp, additive |
| 2 | Persona → prompt: `PersonaProfile` từ roster, `PromptBundle`, inject qua brief section. Fix gap #8. | 0 | trung bình: prompt thay đổi, cần chạy lại code-panel proof |
| 3 | `BusinessCasePreset` registry + scope `businessCase`. Chuyển `capabilities.fgos-coding-implement.overrides` → preset `code.implement`. Validator từ chối field policy trong capability (warn trước, fail sau 1 release). | 0 | thấp |
| 4 | Alias layer: `claude-reviewer` → `{profile: claude, patch: {persona: code-reviewer, permissionIntent: read-only, effort: high}}`, tương tự `codex-readonly`, `claude-reviewer-herdr`. Id cũ vẫn resolve, log deprecation. Xóa `rigorOverrides` khỏi executor, sửa bảng `modelPolicies.gemini`/`openai-codex` cho tương đương. | 18 → 15 (đếm profile thật) | trung bình: cần proof `code.review` cho ra cùng argv như trước. So sánh argv cũ/mới bằng snapshot test |
| 5 | Gộp adapter/confinement vào `invocations[]` + `confinement.available`: `claude-herdr`, `claude-bwrap` → `claude`. Bind step chọn invocation theo `visibility` + confinement requirement. | 15 → 7 (`claude, codex, agy, pi, glm, gitnexus, herdr`) | cao nhất: chạm herdr-spawn, bwrap. Làm từng provider, giữ alias |
| 6 | Xóa alias, doctor fail trên executor có policy field, `fgos policy explain` là proof duy nhất. | 7 | thấp |

Snapshot test xuyên suốt: với mỗi (executor cũ, work tier) hiện có, ghi argv/env/prompt-delivery trước bước 0; sau mỗi bước, plan mới phải render ra argv tương đương (cho phép khác thứ tự flag). Đây là "không phá behavior" đo được.

## 7. Anti-pattern cần tránh

- **Executor-as-role**: `*-reviewer`, `*-readonly` là persona + permission intent, không phải seat.
- **Executor-as-adapter**: `*-herdr`, `*-bwrap` là chiều invocation/confinement, không phải seat.
- **Policy literal trong args**: `--effort high` mất provenance, sinh id mới mỗi khi cần một giá trị khác.
- **Capability description làm ADR**: rationale không có schema thì không audit, không expire.
- **Per-executor rigor calibration** (`rigorOverrides`): đổi chất lượng theo *ai chạy* thay vì *provider nào*; đúng chỗ là `modelPolicies.<provider>`.
- **Hai chữ "tier" cùng nghĩa khác nhau**: đổi work tier → `size`.
- **Resolve mà không deliver**: persona hiện có provenance nhưng không tới prompt; provenance đang nói dối.
- **Silent drop knob không hỗ trợ**: phải ghi `unsupported`.
- **Pin không hạn**: mọi operator pin cần `reason` + `until`.
- **Fallback "reserved-not-executed" mà không nói**: giữ nguyên nhưng doc phải nói rõ, hoặc chuyển thành `fallback` rule trong preset khi làm thật.

## 8. Unresolved

- `modelPolicies.gemini` có cần thêm tier trung gian để bỏ `rigorOverrides` của agy mà giữ nguyên model đang chọn không: cần bảng đối chiếu (executor, work tier) → model hiện tại trước khi quyết.
- `permissionIntent` read-only trên claude chỉ đạt được qua `allowedTools`, không phải sandbox thật; `supports.readOnlyMode: "via-allowedTools"` phải hiển thị trong plan để reviewer biết mức bảo đảm.
- Scope `businessCase` đặt dưới `definition` (protocol đè được preset) hay trên (preset đè protocol)? Đề xuất dưới, vì protocol là contract cụ thể hơn; nhưng nếu muốn preset là "chính sách công ty" bất khả xâm phạm thì đưa phần đó vào `governance`.
- Có nên đưa design này vào `docs/history/<feature>/DISCUSSION.md` qua `/fgOS:coding-shape-distill` để thành shaping record chính thức không.
