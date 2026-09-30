# Tổng hợp brainstorm: yêu cầu → phân rã → coordination/dispatch/run

```txt
Document type: Synthesis report (discussion lead)
Snapshot: 2026-09-30 12:29 (Asia/Saigon), main @ bd21c8227
Prompt: plans/reports/brainstorm-prompt-260930-1102-request-to-run-decomposition.md
Handoff: plans/reports/handoff-260930-1210-harness-routing-discussion-lead.md
Status: BẢN SƠ BỘ v0 — mới có 2/≥3 câu trả lời; owner đang tự chạy thêm agent. Sẽ cập nhật khi có thêm.
```

## 1. Bảng tham gia

| Agent | Provider/model | Cách dispatch | Thời gian file | Đủ mẫu? | Ghi chú |
|---|---|---|---|---|---|
| claude-sonnet | claude / sonnet-5.5 | owner tự chạy (có `dispatch-runs/claude/1790745191212`, loại `execute` thường, Observe không đọc; run.json vẫn `running`) | 12:15 | Đủ heading; thiếu trace K3/K5 dạng bảng đầy đủ (có, nhưng ngắn) | Tự khai "Bash bị chặn giữa chừng": nhiều fact ghi [fact-sheet], chưa tự kiểm |
| openai-gpt-5.6-sol | openai / gpt-5.6-sol (không có trong `modelPolicies`, chạy ngoài fgOS) | owner tự chạy | 12:20 | Đủ | Kiểm fact kỹ nhất; bắt được 3 lỗi của fact sheet |
| _(chờ)_ | gemini | — | — | — | owner đang chạy |
| _(chờ)_ | xai | — | — | — | owner đang chạy |

Lead không dispatch lượt nào (owner chọn tự chạy, 2026-09-30 12:2x).

## 2. Fact đã kiểm

| # | Khẳng định | Ai nêu | Kết quả | Bằng chứng |
|---|---|---|---|---|
| F1 | `src/runner/dispatch/**` ~59k dòng | fact sheet §6.1 | **Sai** → 32.047 dòng `.mjs` (toàn bộ file cũng 32.047). coordination 20.692, definitions 2.009 | `find … \| wc -l` (openai đúng) |
| F2 | Master loop ghim `code:implement`/`code:review`; `distinctProviderFrom.strength: preferred` | sonnet | **Đúng** | `core/coordination-protocols/standalone-master-coordination-loop.yaml:109,125-128,137-140` |
| F3 | Config hiện route `code:review` → **openai** `codex-cli-bwrap`, ngược khẩu vị "review code = opus" | openai | **Đúng** | `.fgos/config.json` `runner.capabilities.code:review.prefer`. Cộng thêm `readOnlyRedirects` claude→openai: "opus review" bị chặn bởi **hai** tầng |
| F4 | `execute` prefer claude; `review` không có `prefer` | openai | **Đúng** | `.fgos/config.json` `runner.capabilities` |
| F5 | Persona chỉ là một cái tên chèn vào prompt; `core/agents/*.yaml` chỉ phục vụ agent roster (`{name, skills}`), không phải persona body | openai | **Đúng** — đóng câu hỏi mở của handoff §5 | `src/runner/dispatch/assignment.mjs:713-765`; `src/runner/agent-roster.mjs:1-52` |
| F6 | `work-product` không có `facts.primaryCapability` → `unbound` (K5 "viết nội dung" không bind được) | sonnet | **Đúng** | `src/verbs/coordination/binding.mjs:94-99` |
| F7 | Action composer sau node đầu gọi không có `facts` | cả hai | **Đúng** | `src/verbs/coordination/actions.mjs:196-220` (truyền `definition`, `runnerConfig`, `cliExecutor`, không `facts`) |
| F8 | `distinctProviderFrom` bỏ qua tham chiếu tới vai chưa bind (phụ thuộc thứ tự) | openai | **Đúng** | `binding.mjs:112-133` (comment tự nhận "accepted limitation") |
| F9 | Observe không đọc `.fgos/dispatch-runs/` | cả hai | **Đúng** | không có tham chiếu `dispatch-runs` trong `packages/**/rust`; `RunResultSource` đọc `.fgos/assignments` (`packages/run-result/rust/src/lib.rs:330-337`) |
| F10 | Observe có đọc transcript Claude | (lead kiểm) | **Đúng** | `packages/observe/rust/src/sources/claude_transcripts.rs` → việc inline của Lead **là claude** thì đo được qua transcript |
| F11 | `fallbackExecutors`: doc/code nói `reserved-not-executed`, nhưng có Provider Capacity Rotator tiêu thụ | openai | **Đúng là drift** | `assignment-policy.mjs:404-410` comment vs `assignment-runner.mjs:1069,1768` `attemptProviderCapacityFallback` |
| F12 | K3 (phase 6 plan tài liệu) chưa authorize, bị chặn bởi phase 4–5; phase file chưa liệt kê area | openai | **Đúng** | `git show plan/260925-documentation-authority-unification:…/plan.md` dòng 254, 271-273 |
| F13 | Chặn `preferExecutor` ở scope portable | fact sheet | **Đúng** | `src/runner/coordination/session-engine.mjs:925-942` |
| F14 | Mặc định `code:implement` còn sót | fact sheet | **Đúng**, nhưng nằm trong `buildConfinementRequest` (chọn confinement), không phải routing | `assignment-runner.mjs:2378` |
| F15 | `steps[].capabilities` là field contract (yêu cầu công cụ), không phải khoá routing | openai (ngầm) | **Đúng** | `session-engine.mjs:278-290` (`buildSessionContract`) |

Chưa kiểm: sonnet cho rằng `strength: preferred` là **nguyên nhân trực tiếp** của reviewer cùng provider ở §6.6 — hợp lý (F2) nhưng chưa đối chiếu log session.

## 3. Ma trận đồng thuận / bất đồng

### 3.1 Theo tầng

| Tầng | Đồng thuận | Bất đồng |
|---|---|---|
| 1 Hiểu | Agent phán đoán (`fgos-clarifying` đã có) | — |
| 2 Phân rã | Agent phân rã; **máy kiểm** DAG/cycle/write-scope chồng; plan và yêu cầu tự do sinh **cùng một dạng unit** | — |
| 3 Phân loại | Không để 8 DemandFacts là field runtime thứ hai | **D1**: unit khai `capability` trực tiếp (openai) ↔ unit khai facts `kind/domain/mutates`, máy suy capability (sonnet) |
| 4 Cộng tác | Hội tụ = một đồ thị step có vai (sonnet "step list", openai "RunGraph"); FlowDefinition chỉ là template sinh ra cùng đồ thị | **D2** ai chọn pattern: máy theo `applies` (sonnet) ↔ agent chọn template (openai). **D3** số pattern: ~5 (sonnet) ↔ 3 `solo/review/fanout` + human gate (openai) |
| 5 Binding | Một binder tất định + provenance; một bảng khẩu vị khoá theo `(domain, việc, vai)`; FlowDefinition không chứa executor/model/tier; không tách `docs:*` để routing; persona chỉ ảnh hưởng prompt và cần có body | **D5** override vs ràng buộc. **D6** persona là khẩu vị thuần (sonnet) ↔ persona nghiệp vụ được khoá trên step (openai). **D7** `distinct` bắt buộc + park (sonnet) ↔ chỉ nói lọc theo DAG (openai) |
| 6 Chạy & đo | Mọi lần chạy dispatch qua **một** cửa Observe đọc được; xoá `dispatch-runs` legacy | **D4** solo mutating = coordination session 1 step (sonnet) ↔ Assignment/Run door, không bắt buộc session (openai). **D8** inline: K2 inline không qua cửa (sonnet) ↔ inline cũng sinh Run `executor=current-session` (openai) |

### 3.2 Chín câu hỏi của prompt

| # | sonnet | openai | Đồng thuận? |
|---|---|---|---|
| 1 Phân rã | agent làm, code kiểm; cùng unit | như vậy | ✅ |
| 2 capability vs DemandFacts | facts → máy suy | capability trực tiếp; facts chỉ trợ giúp | ❌ D1 |
| 3 Chọn pattern | máy (`applies`), Lead override | FlowDefinition nếu có, không thì agent; máy chỉ compile | ❌ D2 (cùng: config không chọn pattern) |
| 4 FlowDefinition chứa gì | step/role/need/rigor/after/distinct/visibility/human gate; không executor/model/tier/persona file | graph/role/capability/rigor/mutation/evidence/human gate; persona chỉ khi là nghiệp vụ | ≈ (khác ở persona) |
| 5 Thư viện pattern | có, ~5 portable; protocol có visibility giữ riêng | có, 3 template; red-team là một vai reviewer | ≈ D3 |
| 6 Persona | khẩu vị trên role; chỉ prompt | semantic trên step, mặc định trong config; chỉ prompt | ≈ D6 |
| 7 `docs:*` | không tách | không tách | ✅ (bác đề xuất Q4 của handoff) |
| 8 Solo ghi file | coordination 1 step | Assignment/Run door | ❌ D4 |
| 9 Xoá trước | pin `code:*`, `readOnlyRedirects`, portable `prefer*`, default `code:implement`, skill deprecated, `preferPersona` | `form` runtime, `dispatch-runs`, `purpose` alias, capability fallback ngầm, persona không body, protocol/facade deprecated | ≈ (bổ sung nhau) |

## 4. Phương án ứng viên

Cả hai agent thực ra đề xuất **cùng một hình dạng**; khác ở mức chi tiết. Lead gom thành 2 phương án thật sự khác nhau:

| | **P-A: Đồ thị hội tụ (gom từ cả hai)** | **P-B: Vá tối thiểu (sonnet "phương án hai")** |
|---|---|---|
| Ý chính | Unit chung → template/FlowDefinition → **một đồ thị step có vai** = coordination session `dag` → một binder (bảng khẩu vị + provenance) → một cửa chạy | Giữ Q0–Q2 prose; chỉ persist facts, bỏ pin `code:*` master loop, sửa config |
| Đơn giản | 4 — ~5 khái niệm hot path: Unit, Template, Step/Role, Taste, Run | 2 — vẫn 4 nơi chứa khẩu vị, 3 cửa chạy |
| Linh hoạt | 5 — domain/khẩu vị/override là dữ liệu | 3 — domain mới vẫn cần sửa YAML |
| Tường minh | 5 — một bảng ưu tiên, provenance mỗi binding | 2 — thứ tự vẫn rải 6 tầng |
| Đo được | 5 — dispatch luôn là assignment trong session; inline claude qua transcript | 3 — `dispatch-runs` vẫn tồn tại |
| Chi phí chuyển đổi | 3 — sửa Node trong ranh giới cũ, làm được theo bước | 5 |
| Trace K3 | Lead đọc phase → N unit area (`writes` riêng) + 1 unit ledger `dependsOn` tất cả → template `review` → author openai flagship, reviewer opus readonly (distinct required) → worktree mỗi area | Viết tay request JSON cho mỗi area, master loop đã bỏ pin; khẩu vị docs nhét vào `capabilities.execute/review.prefer` (đụng mọi domain) |

P-B là **bước 1 của P-A**, không phải đích — cả hai agent đồng ý điểm này.

## 5. Đối chiếu với đề xuất chưa chốt (handoff §5)

| §8 | Đề xuất cũ | Kết luận | Lý do |
|---|---|---|---|
| Q1 slot | Không tạo `slotBindings`; dùng `deriveOperationCapability` + persist `facts` | **Xác nhận, sửa**: khoá slot đổi từ tên capability `<domain>:<x>` sang cặp `(domain, capability)`; thứ cần persist là **ngữ cảnh unit** (`domain`, `rigor`, `mutation`) lên manifest | F6, F7; cả hai agent bỏ `slotBindings` |
| Q2 facade | Đưa `fgos-code-change` lên core, tổng quát gate; xoá 2 skill deprecated | **Xác nhận** | cả hai đồng ý một facade chung |
| Q3 tách plan | Plan 1 = B5+B1+B7+smoke | **Sửa**: bước 1 là "vertical slice docs" (xem §6); B7 bỏ | F12: P6 chưa authorize, bị chặn P4–P5 → smoke trên một area/pilot, không phải "chạy P6" |
| Q4 `docs:*` | Tạo `docs:author`, `docs:review` | **Bác bỏ** | cả hai agent: khoá bằng `domain`; tách tên capability chỉ để routing là tùm lum (RUL11) |
| Q5 unit format | Tái dùng `- unit:`/`capability:` của plan-lint, mở rộng phase file + `rigor/dependsOn/writes` | **Xác nhận**, thêm `domain`, `mutation`, `collaboration` | cả hai |
| Q6 Node/Rust | Sửa Node trong ranh giới file | **Xác nhận** | không agent phản đối |

## 6. Đề xuất của lead (sơ bộ, chờ thêm câu trả lời)

**Chọn P-A**, và chốt các bất đồng như sau:

- **D1 → unit khai `domain` + `capability` (động từ chung: `execute|review|research|advise`) + `mutation` + `rigor`.** Xoá 8 DemandFacts, `form` và `capability match` khỏi đường chạy. Lý do: sonnet muốn "máy suy" nhưng field nó đề xuất (`kind` + `domain`) chính là `capability` + `domain` đổi tên; suy ngược thêm một lớp là tùm lum. `code:implement` → `(code, execute)`.
- **D2 → unit mang `collaboration: solo|review|fanout`**. Lead điền khi phân rã (vốn đã phán đoán); `plan-lint` điền mặc định tất định khi trống (`mutation: mutating` → `review`, còn lại → `solo`). Config không chọn pattern. Có FlowDefinition thì dùng nó.
- **D3 → 3 template + human gate là một loại step.** Red-team = thêm vai `objector` trong template `review` khi `rigor: critical`, không là pattern mới. Các protocol group-thinking (delphi, nominal group, architecture panel…) giữ nguyên là FlowDefinition có tên, `fgos-panel` định tuyến như cũ.
- **D4 → solo = coordination session 1 node** (sonnet). Coordination session có `dag` **đã là** "RunGraph" (`dag-scheduler.mjs`); không mở cửa Assignment thứ hai. Xoá `dispatch-runs`.
- **D5 → thứ tự ưu tiên:** governance veto → override một lần (ghi `constraint-overridden` nếu vi phạm distinct) → bộ lọc ràng buộc (`distinctProviderFrom`, read-only ⇒ invocation read-only của chính executor) → taste project → taste global → inline.
- **D6 → step khai `role`** (được phép là vai nghiệp vụ như `brand-reviewer`); persona body tra theo tên role (`core/agents`, `domains/*/agents`), taste override được. Xoá `persona`/`preferPersona` như field riêng. Đáp được cả nhu cầu "khoá persona nghiệp vụ" của openai mà không thêm khái niệm.
- **D7 → `distinct` bắt buộc cho vai review một output mutating**; không thoả thì park hỏi người (config có 6 provider nên hiếm). Bằng chứng: §6.6 + F2.
- **D8 → inline giữ inline**, không sinh Run giả; Lead claude được đo qua transcript (F10). Việc ghi file luôn đi qua đồ thị.

**Bước 1 (vertical slice docs):** persist ngữ cảnh unit vào manifest; master loop bỏ pin `code:*` → template `review` dùng khoá `(domain, capability, role)`; thêm 2 dòng taste docs (author openai flagship, review claude readonly); `distinct` required; sửa `code:review` → claude (F3); xoá `readOnlyRedirects` (đã thuộc plan tier/rigor); plan-lint đọc phase file. Smoke: 1 area docs + 1 unit ledger, đo bằng Observe.

## 7. Bộ câu hỏi cho owner

_(Chưa đưa ra — chờ gom đủ câu trả lời gemini/xai để câu hỏi phản ánh toàn bộ bất đồng.)_

## 8. Câu hỏi còn mở

- `strength: preferred` có đúng là nguyên nhân của rubber-stamp §6.6 không — cần đọc log session `documentation-authority-unification--phase-01*`.
- Drift `fallbackExecutors` (F11): doc hay code đúng — tách riêng, không chặn thiết kế.
- Tên run `dispatch-runs/claude/1790745191212` vẫn `running` — có thể là run treo từ lượt sonnet của owner.
