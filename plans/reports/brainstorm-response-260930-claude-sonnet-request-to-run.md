# Trả lời: claude-sonnet-5-5

Phạm vi kiểm chứng: đọc trực tiếp `src/verbs/coordination/binding.mjs:76-109` và `core/coordination-protocols/standalone-master-coordination-loop.yaml` (đúng như fact sheet). Bash bị chặn giữa chừng nên **không** kiểm lại được: `readOnlyRedirects`, nội dung `core/agents/*.yaml` có vào prompt không, `assignment-runner.mjs:2378`. Những chỗ đó ghi [fact-sheet] = tin theo §6, chưa tự kiểm.

## Tóm tắt lập trường

- Hội tụ ở **tầng 4**: cả "có" lẫn "không có" FlowDefinition đều sinh ra cùng một dạng **danh sách step có vai (role slot)**. Từ đó trở xuống chỉ có một Binder tất định và một cửa chạy.
- Một dạng unit duy nhất cho plan AgentKit và yêu cầu tự do: `{id, kind, domain, mutates, writes, rigor, dependsOn}`. Không khai `capability`; máy suy ra từ facts (mở rộng `deriveOperationCapability`).
- Phân rã = agent phán đoán; **kiểm** = code tất định (lint: write scope chồng nhau mà không `dependsOn` thì từ chối).
- Chọn pattern = máy, theo `applies:` khai trong chính pattern (dữ liệu). Lead được ghi đè bằng `pattern:` trên unit.
- Khẩu vị gom về **một bảng `taste`** (rule khớp `domain × need × role` → executor/invocation/persona). Thay `capabilities.prefer`, `rigorOverrides`, `providerModel`, `placementPolicy`, `fallbackExecutors`.
- Persona = **định nghĩa vai** (nội dung prompt), không ảnh hưởng tier hay executor. Vai do step khai; ai đóng vai do taste.
- Một unit ghi file đơn lẻ = pattern `solo` (1 step) đi qua **cùng cửa coordination**. Không mở đường thứ hai.
- Bài học §6.6: reviewer cùng provider chỉ đóng dấu, vì `distinctProviderFrom` đang `strength: preferred`. Với step ghi file, phải `required`; không thoả thì **park hỏi người**, không lặng lẽ hạ cấp.

## A. Hiện trạng

### Trace K1 (sửa bug, ghi file, review khác provider)

| Tầng | Ai quyết | Đầu vào → ra | Chỗ gãy / làm tay |
|---|---|---|---|
| 1 Hiểu | agent (`fgos-clarifying`, verdict-only) | text → intent+domain | ổn; nhưng chạy trước Work, ad-hoc không qua |
| 2 Phân rã | agent, không có khuôn | text → "plan một cell" (`fgos-code-change` SKILL) | không có schema unit cho yêu cầu tự do; plan-lint chỉ đọc `plan.md` |
| 3 Phân loại | agent tự làm tay Q1 (prose) → `fgos capability match --demand` | DemandFacts → capability+form | agent phải nhớ khai đủ 8 field; `rigor` pass-through |
| 4 Cộng tác | skill (`fgos-code-change` gate chỉ `code:implement/refactor`) → master loop | form=facade | 1 pattern duy nhất; loop tối đa 3 vòng |
| 5 Binding | code: `binding.mjs` → `resolve.mjs` → `assignment-policy.mjs`; 6 tầng ưu tiên [fact-sheet §6.4] | capability → executor, tier | `facts` không có cờ CLI, không lưu manifest → node sau node đầu mất facts (`actions.mjs:208` [fact-sheet]); `preferred` distinct → rơi về cùng provider |
| 6 Chạy | code, worktree do skill mở | assignment → run | OK vì qua protocol → Observe thấy |

### Trace K3 (phase 6, 15 area docs)

- Tầng 2: unit nằm ở phase file, plan-lint chỉ đọc `plan.md` [fact-sheet] → agent phải tự dựng ~15 request JSON.
- Tầng 3–5: master loop **ghim** `capability: code:implement` / `code:review` (yaml dòng 109, 125) → domain docs bị route như code. Muốn `openai flagship` cho writer phải sửa YAML hoặc viết request riêng cho từng plan. Đây là chỗ kẹt.
- Tầng 4: "ledger chỉ một người ghi" không có chỗ khai; phải nhớ tay.
- Tầng 5: reviewer opus → `readOnlyRedirects` có thể đổi sang openai [fact-sheet]; plan tier/rigor đã xoá.

### Trace K5 (marketing FlowDefinition)

- Tầng 4 tốt: step khai role/operation, có `human-only` ở lớp workflow.
- Tầng 5: FlowDefinition chỉ có `capability`; `docs:*`/`marketing:*` chưa đăng ký → rơi về generic `review`; `work-product` không có `facts.primaryCapability` → `source: 'unbound'` (binding.mjs:94-99). Nghĩa là bước "viết nội dung" **không bind được** nếu facts không tới.
- Bước "duyệt của người": nằm ở lớp Work (`feature.yaml`), không phải FlowDefinition → hai cấu trúc "các bước" song song.

### Bảng đếm khái niệm (tầng 1–6)

| Khái niệm | Nơi | Trùng nghĩa với |
|---|---|---|
| DemandFacts (8 field) | prose + `capability-match.mjs` | `facts` của binding (bản thứ hai, không lưu) |
| capability (`code:implement`…) | config + YAML pin | derive từ facts (bản thứ ba) |
| `form` inline/protocol/facade | match | pattern |
| unit (`- unit:`) | plan.md | step, operation |
| FlowDefinition/Protocol/operation/role/actor | schema | domain workflow stage→operation (lớp Work) |
| `minTier`, `minRigor`, `mode`, `size`/TIERS, tier 6 bậc | nhiều file | (đã có plan gom) |
| `prefer`, `preferExecutor`, `preferInvocation`, `actors[].executor`, `--executor`, `fallbackExecutors` | 5 nơi | cùng một việc: "ai làm" |
| `readOnlyRedirects`, `confinement`, `readOnly` | config | cùng một việc: "chạy read-only" |
| `persona`, `preferPersona`, `role`, `implied-by-persona` | YAML/roster | role ≈ persona |
| `distinctProviderFrom` + `strength` | step | ràng buộc, giữ |
| `agent-led`/`declared-protocol` | request schema | 2 loại request cho 1 việc |
| execute thường / execution-contract / protocol | 3 cửa chạy | 1 việc; chỉ 1 cửa Observe đọc |

Ước lượng: ~12 khái niệm mà một người/agent phải hiểu chỉ để trả lời "vì sao executor này" [suy luận].

## B. Thiết kế clean-sheet

### B1. Hợp đồng dữ liệu

```yaml
# Unit — cùng dạng cho plan và yêu cầu tự do
unit:
  id: area-ledger-x
  intent: "chuyển area X sang authority mới"
  kind: change | answer | research | review | content   # kết quả là gì
  domain: docs                # code | docs | marketing | ...
  mutates: true
  writes: [docs/specs/x.md]   # bắt buộc nếu mutates; cơ sở worktree + serial hoá
  rigor: standard             # low|standard|high|critical (đã chốt)
  dependsOn: []
  pattern: null               # tuỳ chọn; null = máy chọn
  constraints: []             # ràng buộc riêng của plan (chỉ ở dạng dữ liệu chung, xem K3)

# Pattern (thư viện; FlowDefinition của domain là pattern có tên)
pattern:
  id: do-review
  applies: { mutates: true, rigor: [low, standard, high] }
  steps:
    - { id: do,     role: doer,     need: work,   writes: unit }
    - { id: review, role: reviewer, need: review, after: do, readOnly: true,
        distinctFrom: [doer], strength: required }
  loop: { on: findings, back: do, max: 2, then: park-human }

# Step -> Binder
in : { step, unit, taste, override?, runnerConfig }
out: { executor, invocation, tier, persona, provenance: [{rule, layer, reason}] }
```

Bước kiểu `need: human` là step như mọi step: park, câu hỏi gom thành bộ (ưu tiên #2).

### B2. Ai làm tầng nào

| Tầng | Ai | Lý do |
|---|---|---|
| 1 Hiểu | agent | phán đoán; đã có `fgos-clarifying` |
| 2 Phân rã | agent làm, **code kiểm** | LLM cắt việc tốt hơn quy tắc; nhưng write scope chồng, cycle, thiếu `writes` là lỗi tất định |
| 3 Phân loại | agent khai **facts** (kind/domain/mutates/rigor); code suy capability | tránh agent gõ sai tên capability |
| 4 Pattern | code (`applies`), Lead override | tất định, tái lập; ít bất ngờ |
| 5 Binding | code hoàn toàn | phải có provenance; LLM không được chọn model |
| 6 Chạy/đo | code | một cửa |

### B3. Điểm hội tụ

Danh sách step có vai. Không FlowDefinition: máy chọn pattern → step. Có FlowDefinition: nó *là* pattern do domain viết. Từ đó: Binder → cửa chạy. FlowDefinition thêm **giá trị** (thứ tự nghiệp vụ, visibility, human gate) chứ không thêm **đường**.

### B4. Bảng ưu tiên duy nhất (mọi thuộc tính: executor/invocation/persona)

1. **Override một lần** (`--use <role>=<executor>[:<persona>]` hoặc field của request). Thắng mọi thứ, provenance `override`. Nếu vi phạm ràng buộc thì vẫn chạy nhưng ghi `constraint-overridden`.
2. **Ràng buộc là bộ lọc, không phải xếp hạng**: `distinctFrom`, governance disallow, `readOnly` (chọn invocation read-only của *chính* executor đã chọn), `mutates` cần executor có worktree.
3. **Taste project** (rule cụ thể nhất: `domain+need+role` > `domain+need` > `need`).
4. **Taste global.**
5. Không rule nào khớp → **inline** (Q0). Không còn mặc định cứng `'claude'`.

Tier: `rigor → rigorToTier → tier → modelPolicies` như đã chốt. Không thấy xung đột. Một điểm cần bảo đảm: rule taste không được chứa model/tier, chỉ executor/invocation/persona.

```yaml
taste:
  - { match: {domain: docs, need: work},   use: {executor: openai} }
  - { match: {domain: docs, need: review}, use: {executor: claude, invocation: readonly, persona: doc-reviewer} }
  - { match: {need: challenge},            use: {executor: claude} }
  - { match: {domain: code, need: work},   use: {executor: gemini} }
  - { match: {domain: code, need: review}, use: {executor: claude} }
  - { match: {need: research},             use: {executor: [gemini, xai]} }
```

### B6. Persona

- Là **nội dung vai** (một file định nghĩa: mục tiêu, cách nhìn, format ra) được nạp vào prompt. Role và persona là một khái niệm; xoá `preferPersona`, `implied-by-persona`, tách `role` vs `persona`.
- Step khai **role** (yêu cầu của bước). Taste khai **ai đóng vai** (khẩu vị): map role → persona file, mặc định lấy `core/agents/<role>`, domain override.
- Ảnh hưởng: chỉ prompt. Không đổi tier (tier chỉ do rigor), không đổi executor. Lý do: ba trục độc lập mới giải thích được provenance.

### B7. Chạy inline / dispatch / song song / đo

- `need` không có rule → inline, Lead làm (K2, K4 một phần). Nếu Lead làm inline một step mutating thì vẫn ghi step-run qua cửa (không cần process ngoài).
- Có rule → Binder ra binding → cửa `run step` (Node hiện tại, ranh giới file cũ). Mutating: worktree riêng theo `writes`; hai unit có `writes` giao nhau bị serial hoá tự động.
- Mọi run (inline/subagent/ngoài) là **assignment trong một coordination session**, kể cả `solo` 1 step. Observe đọc chung một nguồn.

### B8. Giao diện Work

Vào: `{request text, domain hint?, rigor?}`. Ra: `{session ref, outcome, questions[] đã gom}`. Work không biết pattern, executor, tier.

### Trace K1–K6

- **K1**: agent khai facts `kind: change, domain: code, mutates: true, writes:[src/foo.mjs]` → pattern `do-review` → doer gemini, reviewer claude (khác provider, required) readonly → tối đa 2 vòng, quá thì park.
- **K2**: `kind: answer, mutates: false`, không rule `docs:answer` → inline, không đi cửa dispatch.
- **K3**: 15 unit `docs`, mỗi area `writes` khác nhau → song song, mỗi worktree; `do-review`; doer openai flagship (rigor high), reviewer opus readonly. Ledger = unit `dependsOn` 15 area, hoặc mọi area ghi qua unit `ledger` (`writes` chung ⇒ serial). Không cần request JSON riêng: plan-lint đọc unit → session.
- **K4**: `kind: research`, không mutate; pattern `panel(n=3, distinct provider)` + `synthesize`; taste `need: research` cho danh sách provider; Binder tự rải khác nhau.
- **K5**: FlowDefinition marketing = pattern. Role `brand-reviewer` là persona. `need: human` cho duyệt (park, gom câu hỏi). Taste `marketing:work/review` hoặc rơi về `work`/`review`.
- **K6**: `--use reviewer=openai` → layer 1; rule taste gốc không đổi; provenance ghi `override`; vì khác provider với doer nên không vi phạm ràng buộc.

## C. Đối chiếu

| Ở B | Hiện có | Hành động |
|---|---|---|
| unit shape | `- unit:` + `capability` trong plan.md | đổi: khai facts thay capability; đọc phase file; cùng shape cho ad-hoc |
| suy capability từ facts | `deriveOperationCapability` (binding.mjs:89) | **giữ, mở rộng** (`<domain>:<need>`); **thiếu**: lưu `facts` vào manifest, cờ `--facts` |
| pattern library | 13 protocol + master loop | gom (xem D); master loop bỏ pin `code:*` |
| `applies` chọn pattern | Q1 `form` + facade gate | thiếu, phải xây (nhỏ) |
| taste table | `capabilities.prefer/rigorOverrides/providerModel`, `placementPolicy` | gom vào 1 bảng; xoá các cái cũ cùng bước |
| override một lần | `--executor` (composers) + `actors[].executor` | giữ `--executor` gom thành `--use`; xoá `actors[].executor` như đường riêng |
| ràng buộc là filter | `distinctProviderFrom` | giữ; đổi mặc định `required` cho mutating |
| persona = role | `persona`/`preferPersona`/`core/agents` | gom; kiểm việc nạp file vào prompt [chưa tự kiểm] |
| cửa chạy duy nhất | `execute` thường (`dispatch-runs`), execution-contract, protocol | xoá `dispatch-runs` cho work-product; thêm `solo` |
| serial hoá theo `writes` | dag-scheduler + cwd lock | có gần đúng; thiếu: suy từ `writes` |
| facade | `fgos-code-change` | giữ làm dạng dùng cho code; tổng quát hoá gate |
| `preferExecutor`/`preferInvocation`/`fallbackExecutors` ở portable | schema cho qua, runtime chặn | **xoá khỏi schema** |
| deprecated skill | `fgos-code-panel`, `fgos-plan-loop` | xoá |

## D. Chấm điểm, lộ trình, không nên làm

Phương án B: đơn giản 4/5 (1 shape, 1 bảng, 1 cửa), linh hoạt 5/5 (thêm domain = thêm rule + pattern), tường minh 5/5 (provenance), đo được 5/5, chuyển đổi 3/5 (đụng coordination Node 21k dòng nhưng theo bước).
Phương án hai (tối thiểu): giữ Q0–Q2 prose + chỉ sửa master loop cho generic capability + persist facts. Rẻ (5/5) nhưng vẫn 4 nơi chứa khẩu vị → chỉ là bước 1 của B, không phải đích.

Lộ trình:
1. **Mở K3** (nhỏ nhất, chạy được): (a) `--facts` + lưu vào manifest; (b) master loop bỏ pin `code:*`, dùng derive (`work-product` → `<domain>:execute` nếu có, không thì `execute`); (c) `distinctProviderFrom` required cho step mutating; (d) plan-lint đọc unit ở phase file; (e) đăng ký `docs:execute`/`docs:review` trong taste hiện tại (tạm dùng `capabilities.prefer`). Xoá: pin capability trong YAML, default `|| 'code:implement'`. Rủi ro: facts vào manifest cần schema version; thấp.
2. **Taste table + Binder một bảng + provenance**: xoá `prefer`/`rigorOverrides`/`providerModel`/`placementPolicy`/`fallbackExecutors`/`preferExecutor`. Rủi ro: trung bình, đụng `resolve.mjs`/`assignment-policy.mjs`; giảm bằng test provenance.
3. **`solo` qua coordination, xoá `dispatch-runs`** cho work-product. Rủi ro: overhead cho việc nhỏ; giữ inline cho không mutate.
4. **Pattern library** (`do-review`, `do-review-fix`, `solo`, `panel`, `review-only`) + `applies`. Đủ ~5 pattern portable; delphi/nominal-group/architecture-panel giữ như FlowDefinition có tên vì mang ngữ nghĩa visibility thật. Xoá `fgos-code-panel`, `fgos-plan-loop`.
5. Persona = role: xoá `preferPersona`, `implied-by-persona`.

Không nên: thêm lớp an toàn mới quanh master loop; tách `docs:*` cho từng phong cách; cho FlowDefinition khai executor/model/tier; giữ hai đường chạy song song "cho tương thích"; viết Binder mới bằng Rust khi chưa có lịch migrate writer.

## E. Tự phản biện

1. **Agent phân rã kém** (unit quá to, `writes` khai thiếu) → worktree conflict, review vô nghĩa. Phát hiện sớm: lint từ chối scope chồng; đo tỉ lệ unit bị `findings` >2 vòng qua Observe.
2. **Taste table thành nơi thứ 5** nếu các cấu hình cũ không xoá cùng bước. Phát hiện: doctor check đếm số file có tên executor ngoài `taste`; fail nếu >1.
3. **Loop và `required` distinct gây park nhiều hơn chạy** khi chỉ có 1–2 provider, vi phạm "release con người". Phát hiện: đo `parked/total` trên K3; nếu cao thì cho `strength: required` chỉ ở rigor ≥ standard và mặc định fallback `preferred` + cờ cảnh báo trong verdict thay vì im lặng.

## Trả lời 9 câu hỏi

1. Agent phán đoán, code kiểm. Cùng một dạng unit cho plan và yêu cầu tự do.
2. Khai **facts**, máy suy capability. Không cần cả hai; một escape hatch tường minh chỉ nên là override một lần.
3. Máy theo `applies` trong pattern; Lead ghi đè `pattern:`. Config không chọn pattern.
4. FlowDefinition chứa: step, role, `need`, `rigor`, `after`, `distinctFrom`, visibility, repeat, human gate. Không chứa: executor/invocation/model/tier/provider/persona file. `minTier` đã thay bằng `rigor` (yêu cầu của bước); persona là khẩu vị (taste), role là yêu cầu.
5. Có. ~5 pattern portable; slot = role. Các protocol có ngữ nghĩa visibility giữ riêng.
6. Persona là taste (ai đóng vai) trên một role do step khai; chỉ ảnh hưởng prompt.
7. Không tách `docs:*`. `domain × need` làm khoá taste, tên capability chỉ là dẫn xuất; tách khi có executor riêng cho domain (đã đúng theo `capability-matching.md`).
8. Pattern `solo` = coordination session 1 step; cùng cửa, cùng Observe.
9. Xoá trước: pin `code:*` trong master loop, `readOnlyRedirects`, `preferExecutor/preferInvocation/fallbackExecutors` ở schema portable, default `code:implement`, hai skill deprecated, `preferPersona`.

## Chỗ fact sheet §6 sai hoặc thiếu

- Đúng (đã kiểm): `deriveOperationCapability` như mô tả; master loop ghim `code:implement/code:review`, `distinctProviderFrom` là `preferred`.
- Thiếu: `strength: preferred` là nguyên nhân trực tiếp của kết quả "reviewer cùng provider" ở §6.6 (đề xuất, chưa xác minh bằng session log).
- Chưa tự kiểm: các dòng dẫn cho `readOnlyRedirects`, persona nạp file, `assignment-runner.mjs:2378`.

## Câu hỏi còn mở cho owner

1. `required` distinct + park khi không đủ provider: chấp nhận đổi lấy hết rubber-stamp?
2. Loop tối đa 2 hay 3 vòng, hết vòng thì park hay auto-fail?
3. Mutating unit chạy inline trong Lead (không process ngoài) có được coi là đủ cho Observe, hay bắt buộc process riêng?
