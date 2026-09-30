# Tổng hợp brainstorm: yêu cầu → phân rã → coordination/dispatch/run

```txt
Document type: Synthesis report (discussion lead)
Snapshot: 2026-09-30 16:20 (Asia/Saigon), main @ 5aed82c52
Prompt: plans/reports/brainstorm-prompt-260930-1102-request-to-run-decomposition.md
Handoff: plans/reports/handoff-260930-1210-harness-routing-discussion-lead.md
Status: v1 — 3 câu trả lời (2 family: claude, openai). Chưa có gemini/xai; cập nhật tiếp nếu owner gửi thêm.
Lịch sử: v0 12:29 (sonnet + openai bản 12:20) → v1 16:20 (thêm fable; openai bản sửa 12:39)
```

## 1. Bảng tham gia

| Agent | Provider/model | Cách chạy | File | Đủ mẫu? | Chất lượng kiểm fact |
|---|---|---|---|---|---|
| claude-sonnet | claude / sonnet-5.5 | owner tự chạy; có `dispatch-runs/claude/1790745191212` (`execute` thường, Observe không đọc, run.json kẹt `running`) | 12:15 | Đủ heading; trace K3/K5 ngắn | Thấp: tự khai "Bash bị chặn giữa chừng", nhiều mục [fact-sheet] |
| openai-gpt-5.6-sol | openai / gpt-5.6-sol (ngoài `modelPolicies`, chạy ngoài fgOS) | owner tự chạy; **sửa lại 12:39** | 12:20 → 12:39 | Đủ | Tốt; nhưng bản 12:39 dựa vào `AssignmentPlan` **không tồn tại** (F25) |
| claude-fable | claude / fable-5.1 (Claude Code, chỉ đọc) | owner tự chạy | 12:32 | Đủ | **Cao nhất**: 11 chỗ sửa fact sheet, đa số đã kiểm là đúng; có số liệu store thật |
| _(chưa có)_ | gemini, xai | — | — | — | — |

Lead không dispatch lượt nào (owner chọn tự chạy). Hai family claude chiếm 2/3 → độ đa dạng góc nhìn còn thiếu; xem §8.

## 2. Fact đã kiểm

| # | Khẳng định | Ai nêu | Kết quả | Bằng chứng |
|---|---|---|---|---|
| F1 | `src/runner/dispatch/**` ~59k dòng | fact sheet §6.1 | **Sai**: 32.047 (59–60k là cả `src/runner/**`). coordination 20.692, definitions 2.009 | `wc -l` (openai, fable đúng) |
| F2 | Master loop ghim `code:implement/review`; `distinctProviderFrom.strength: preferred` | sonnet | Đúng | `standalone-master-coordination-loop.yaml:109,125-128,137-140` |
| F3 | Config route `code:review` → openai; `execute` → claude; `review` không `prefer`. Khẩu vị "review code = opus" chưa hề có trong config | openai, fable | Đúng. Thêm `readOnlyRedirects` claude→openai (`assignment-runner.mjs:1428-1433`): opus review bị chặn **hai** tầng | `.fgos/config.json` `runner.capabilities`, `placementPolicy` |
| F4 | Persona chỉ là tên chèn prompt; `core/agents/*.yaml` chỉ cho roster `{name, skills}` | openai, fable | Đúng — đóng câu hỏi mở của handoff §5 | `assignment.mjs:713-765`; `agent-roster.mjs:1-52` |
| F5 | Mọi role `reviewer` mặc định persona `code-reviewer` (cả khi review docs) | fable | Đúng | `assignment-policy.mjs:388-391` |
| F6 | `work-product` thiếu `facts.primaryCapability` → `unbound` | sonnet | Đúng | `binding.mjs:94-99` |
| F7 | **`facts` không có producer nào**: `coordination start` không nhận/truyền; nhánh `facade-primary` là code chết; `domain` không bao giờ tới → luôn rơi về `review` | fable | Đúng (mạnh hơn fact sheet và đề xuất Q1 cũ) | `bin/fgos.mjs` khối start chỉ truyền `actors`; `start.mjs:55-66`; `actions.mjs:196-220` |
| F8 | Roster `--actors` ở `start` không theo sang bước sau; `--executor` bước sau tắt mọi computed binding của bước đó | fable | Đúng | `composers.mjs:52-54,434` |
| F9 | **DAG mode chỉ nhận bước read-only** → 15 area ghi file = 15 session mở tay | fable | Đúng | `dag-request-compiler.mjs:65` |
| F10 | `distinctProviderFrom` bỏ qua vai chưa bind (phụ thuộc thứ tự) | openai | Đúng | `binding.mjs:112-133` |
| F11 | Observe không đọc `.fgos/dispatch-runs/`; có đọc `.fgos/assignments` và transcript claude | cả ba | Đúng | `run-result/rust/src/lib.rs:330-337`; `observe/rust/src/sources/claude_transcripts.rs` |
| F12 | `metrics harness` đếm protocol sai: đọc `core/protocols/*.json` (không tồn tại) và `session.json.protocol.id` (field thật là `definitionRef.id`) → luôn 0 | fable | Đúng | `observe/rust/src/metrics_cli/harness.rs:226-250`; `ls core/protocols` lỗi |
| F13 | Store session: 606 session, **512 `active`**; ~115 là test rò (`test.*`, `some-def`); 152 agent-led; delphi/nominal/rfc/group-cognition dùng **0** lần | fable (602) | Đúng (số hôm nay 606) | đếm `session.json` trong `.fgos/coordination/sessions` |
| F14 | `executors.xai.for` chứa `review`, `code:review` → `decide --for review` có thể ra xai, trái doc catalog | fable [suy luận] | Config đúng; hành vi `decide` chưa chạy thử | `.fgos/config.json` `runner.executors.*.for` |
| F15 | Nơi chứa khẩu vị bị sót trong fact sheet: `model_tier` của `core/agents/*.yaml` → `scripts/project-agents.mjs` `DEFAULT_MODELS {light,standard,heavy}` (comment "matches runner.models", thứ plan tier sẽ xoá); `feature.yaml` `preferExecutor: claude` | fable | Đúng | `scripts/project-agents.mjs:47-53`; `domains/coding/workflows/feature.yaml:65` |
| F16 | `fallbackExecutors`: doc/comment "reserved-not-executed" nhưng runtime có Provider Capacity Rotator | openai | Đúng là drift (doc cũ) | `assignment-policy.mjs:404-410` vs `assignment-runner.mjs:1069,1768` |
| F17 | K3 (phase 6) chưa authorize, bị chặn phase 4–5; phase file chưa liệt kê area | openai | Đúng | nhánh `plan/260925-documentation-authority-unification` `plan.md:254,271-273` |
| F18 | Mặc định `code:implement` sót | fact sheet | Đúng, nhưng chỉ trong `buildConfinementRequest` (chọn confinement) | `assignment-runner.mjs:2378` |
| F19 | `steps[].capabilities` là field contract, không phải khoá routing | openai | Đúng | `session-engine.mjs:278-290` |
| F20 | Chặn `preferExecutor` ở scope portable | fact sheet | Đúng | `session-engine.mjs:925-942` |
| **F25** | "Mở rộng `AssignmentPlan` hiện có" làm canonical graph | openai (bản 12:39) | **Sai: không có symbol/khái niệm `AssignmentPlan`** trong `src/`, `packages/`, `docs/`. Gần nhất là `compileDispatchPlan` — plan dispatch của **một** assignment, không phải đồ thị | `rg AssignmentPlan` rỗng; `assignment-runner.mjs:1376` |

Chưa kiểm: `strength: preferred` có đúng là nguyên nhân rubber-stamp §6.6 (cần log session).

## 3. Ma trận đồng thuận / bất đồng

### 3.1 Theo tầng

| Tầng | Đồng thuận (3/3) | Bất đồng |
|---|---|---|
| 1 Hiểu | Agent phán đoán | — |
| 2 Phân rã | Agent phân rã, máy lint (id, chu trình, `writes` giao nhau, không ghim hạ tầng); plan và yêu cầu tự do sinh **cùng một dạng Unit** | — |
| 3 Phân loại | Không để 8 DemandFacts là field runtime thứ hai; `rigor` là yêu cầu của unit | **D1** khai gì: `capability` trực tiếp (openai, fable `domain:verb` có fallback `verb`) ↔ facts `kind/domain/mutates` (sonnet) |
| 4 Cộng tác | Ba mẫu là đủ; red-team/objector là một vai trong mẫu review, không phải mẫu riêng; FlowDefinition không có đường riêng | **D0 điểm hội tụ**: Unit (fable) ↔ step list có vai (sonnet) ↔ canonical graph trước binding (openai). **D2** ai chọn mẫu: rule trong config (fable) ↔ máy theo `applies` trong mẫu (sonnet) ↔ agent (openai) |
| 5 Binding | Một binder tất định + provenance; khẩu vị chỉ trong config; FlowDefinition không chứa executor/model/tier; không tạo `docs:*` trong catalog chỉ để routing; persona chỉ ảnh hưởng prompt và cần nội dung thật | **D5** override vs ràng buộc độc lập. **D6** persona: khẩu vị thuần (sonnet) ↔ vai khai là yêu cầu + config khai khẩu vị (openai, fable). **D9** tier theo capability (fable, xem §7 Q1) |
| 6 Chạy & đo | Một cửa chạy Observe đọc được; xoá `dispatch-runs`; ghi file phải trong worktree | **D4/D8** solo & inline: mọi việc (cả inline) thành Assignment + RunResult qua `executeAssignment` (openai, fable) ↔ solo = session 1 node, inline để nguyên (sonnet) |

### 3.2 Chín câu hỏi của prompt

| # | sonnet | openai | fable | Kết |
|---|---|---|---|---|
| 1 Phân rã | agent + lint; cùng unit | như vậy | như vậy | ✅ |
| 2 capability vs facts | facts → máy suy | capability trực tiếp | capability `domain:verb`; facts→capability là ánh xạ 1-1 qua `serves` nên là bản sao | 2/3 trực tiếp |
| 3 Chọn mẫu | máy (`applies`) | agent | rule config, override có lý do | ❌ D2 |
| 4 FlowDefinition | step/role/rigor/distinct/human gate | graph/role/capability/rigor/gate | **unit list** + gate người; persona khi bước đòi | ≈ nội dung; khác về *bản chất* (D0) |
| 5 Thư viện mẫu | ~5 | 3 (`solo/review/fanout`) | 3 (`solo/reviewed/panel`) | 2/3 ba mẫu |
| 6 Persona | khẩu vị trên role | semantic trên step, mặc định config | vai khai = yêu cầu, `capabilities[cap].persona` = khẩu vị | 2/3 lai |
| 7 `docs:*` | không tách | không tách | key config tuỳ chọn có fallback, không vào catalog | ✅ (bác Q4 handoff) |
| 8 Solo ghi file | session 1 node | Assignment/Run door | mẫu `solo` qua cùng engine và `executeAssignment`; điều kiện ghi = "cwd là linked worktree", không cần protocol stamp | 2/3 cùng cửa assignment |
| 9 Xoá trước | pin `code:*`, redirect, portable `prefer*`… | `form`, `dispatch-runs`, `purpose`… | (a) 6 dòng pin master loop (b) `facts`/`agent-led` (c) `dispatch-runs` (d) `preferExecutor`+`executors.for`+default `claude` (e) DemandFacts+matcher+`form` | ✅ bổ sung nhau; fable xếp theo lợi/chi phí |

### 3.3 Đóng góp riêng đáng giữ

- **fable — hai nghĩa của "FlowDefinition"**: 13 protocol hiện có đều là *mẫu cộng tác trong một unit*; chưa có business flow nào. Business flow thật = danh sách unit khai sẵn + cổng người. Tách tên này làm sạch D0.
- **fable — cảnh báo E1**: chi phí §6.6 (~10 run, ~150 phút) đến từ vòng lặp và nghi lễ driver, không từ binding. Đề xuất **bake-off** 2 area: engine vs Lead + subagent.
- **fable — `mechanism` do `bind()` trả**, Lead là một candidate như mọi executor → thay phán đoán Q0 bằng quy tắc.
- **openai — K3 ledger**: mỗi cặp author/reviewer trả reviewed commit + digests + *ledger delta*; một writer áp tuần tự và chạy conservation sau **mỗi** commit.
- **openai — smoke 2 area song song**, kiểm cả findings→fix, pass, policy refusal, đóng session.
- **sonnet — `distinct` bắt buộc** cho review output ghi file; không thoả thì park (§6.6).

## 4. Phương án ứng viên

| | **P-A: Unit → mẫu → một binder → một cửa (gom 3 bản)** | **P-Y: Lead điều phối bằng prose + primitive `run --ask` (fable, đường lui)** | **P-B: Vá tối thiểu** |
|---|---|---|---|
| Ý chính | Unit chung; 3 mẫu chạy bằng engine coordination hiện có; `bind()` một chỗ ở cửa chạy; mọi Ask = Assignment + RunResult | Mẫu chạy bằng Lead (như herdr-cook-plan); engine chỉ dùng cho Flow nghiệp vụ | Chỉ bỏ pin master loop, persist capability, thêm khẩu vị docs |
| Đơn giản | 4 (6 danh từ: Unit, Pattern, Flow, Ask, Taste, Run) | 3 (ad-hoc gọn, nhưng hai sequencer) | 2 (vẫn ~10 nơi quyết executor, F-bảng fable) |
| Linh hoạt | 5 | 4 | 3 |
| Tường minh | 5 (`bind --explain`) | 5 | 2 |
| Đo được | 4–5 (cần RunResult inline) | 3 (Observe phải học cách nhóm mới) | 3 |
| Chuyển đổi | 3–4, theo bước | 2 | 5 |
| Trace K3 | 15 unit `docs:write` rigor high + 1 unit ledger `dependsOn` cả 15; `reviewed`; author openai flagship, reviewer claude opus readonly khác provider; mỗi area một worktree trả ledger delta | Lead mở 15 subagent/`run --ask` theo prose | Mở tay 15 session `start --capability docs:write --cwd <wt>` |

P-B **là bước 1 của P-A** (cả ba agent đồng ý). P-Y chỉ chọn nếu bake-off cho thấy nghi lễ engine vẫn quá đắt.

## 5. Đối chiếu với đề xuất chưa chốt (handoff §5)

| §8 | Đề xuất cũ | Kết luận | Lý do |
|---|---|---|---|
| Q1 slot | Không `slotBindings`; `deriveOperationCapability` + persist `facts` | **Xác nhận hướng, sửa cơ chế**: bỏ `facts` (không có producer, F7); `coordination start --capability`, lưu manifest, mọi node đọc lại. Khoá = `domain:verb` fallback `verb` | F7, F8; cả ba bỏ `slotBindings` |
| Q2 facade | Đưa `fgos-code-change` lên core; xoá 2 skill deprecated | **Xác nhận** | 3/3 |
| Q3 tách plan | Plan 1 = B5+B1+B7+smoke | **Sửa**: bước 1 = S1 bốn việc (§6) + smoke 2 area + bake-off; B7 bỏ | F17: P6 chưa authorize |
| Q4 `docs:*` | Tạo `docs:author/review` trong catalog | **Bác một nửa**: không vào catalog với `serves`; chỉ là **key config** `docs:write`/`docs:review` có fallback | 3/3 không tách catalog; fable: tách = một dòng dữ liệu |
| Q5 unit format | Mở rộng `- unit:` của plan-lint sang phase file + `rigor/dependsOn/writes` | **Xác nhận**, field chốt: `id, objective, capability, rigor, writes, dependsOn, pattern?, overrides?` | 3/3 |
| Q6 Node/Rust | Sửa Node trong ranh giới file | **Xác nhận** | 3/3 |
| Persona chưa rõ | — | **Đóng**: chỉ là tên (F4, F5) | |

## 6. Đề xuất của lead

**Chọn P-A**, chốt bất đồng như sau (thay đổi so với v0 được ghi rõ):

- **D0 → hội tụ ở Unit** (theo fable). Tên gọi: *Pattern* = 13 protocol hiện có (cách cộng tác trong một unit); *Flow* = danh sách unit khai sẵn + cổng người. Flow **chưa xây** tới khi có tenant K5 thật. Lý do: cách nhìn này giải thích được vì sao "FlowDefinition cho mỗi plan" là sai — plan đã *là* danh sách unit.
- **D1 → unit khai `capability` dạng `domain:verb`**, binder tra `capabilities[domain:verb]` rồi fallback `capabilities[verb]`. Xoá DemandFacts, matcher, `form`. (sonnet `kind+domain` là cùng thông tin đổi tên.)
- **D2 → rule mặc định trong config** (đổi so với v0): "review nhiều hay ít" là khẩu vị nên phải là dữ liệu (lập luận của fable). Mặc định: có `writes` + rigor ≥ standard → `reviewed`; `critical` → thêm objector; còn lại `solo`. Unit/user override bằng `pattern:`.
- **D3 → 3 mẫu `solo`, `reviewed` (objector tuỳ chọn, `driver-authorized`), `panel`.** Delphi/nominal/rfc/group-cognition (0 lần dùng, F13) → đánh dấu experimental, không gom lúc này.
- **D4/D8 → mọi Ask thành Assignment + RunResult qua `executeAssignment`, kể cả inline** (`mechanism: inline`) — **đổi so với v0** (2/3 agent; F11 cho thấy transcript chỉ có với claude, còn Observe cần RunResult để nhóm theo unit). Điều kiện ghi file = cwd là linked worktree (`resolveMutatingCwdPosture` đã có), bỏ phụ thuộc protocol stamp.
- **D5 → bảng ưu tiên của fable**: override một lần (lưu theo unit, áp mọi vòng) → yêu cầu của unit/vai → khẩu vị config → không còn gì thì inline (có Lead) / lỗi rõ (headless). Không mặc định `claude`. `readOnly` và `independentOf` là **bộ lọc**; override vi phạm độc lập thì từ chối trừ khi override nói rõ chấp nhận. Governance phủ quyết cuối.
- **Cơ chế chạy do `bind()` trả** (bổ sung 19:35 sau thảo luận với owner):

  | | inline | in-process | out-of-process |
  |---|---|---|---|
  | Ai làm | Lead, trong lượt của nó | subagent qua Agent/Task tool của Lead (hoặc MCP tool) | process CLI riêng qua coordination/assignment |
  | Context | chung với Lead | mới, sạch | mới, sạch |
  | Model | cố định = model session | chọn trong cùng host (tham số `model` của Agent tool) | `modelPolicies[provider][tier]` |
  | Provider | = Lead | = Lead | bất kỳ |
  | Song song / chỉ-đọc ép được / độc lập khác provider | không / không / không | có / tool-scope / không | có / invocation read-only / có |

  Quy tắc: (1) candidate khác provider Lead → out-of-process; (2) cùng provider nhưng vai cần context sạch (review, objector), tier khác session, hoặc song song → in-process, `bind()` trả `model`; (3) cùng provider, **tier session ≥ sàn**, vai không cần độc lập → inline. Cả ba đều ghi RunResult (D4/D8).
- **Tier/model chỉ còn một chuỗi**: `rigor → rigorToTier → tier → modelPolicies[provider][tier]`, cho cả out-of-process lẫn in-process. Đầu vào merge chỉ-nâng: `rigor` unit/step, override `--tier`/`actors[].tier`, và (nếu Q1 được nhận) `capabilities.<cap>.rigor`. Inline không phải một đường chọn model mà là điều kiện "tier session ≥ sàn".
- **Năm mức tuỳ biến executor / tier / persona** (bổ sung 22:05 sau thảo luận với owner). Xếp từ thấp (fallback) lên cao (thắng); mỗi thuộc tính lấy giá trị ở mức cao nhất có khai, mức 0 chỉ dùng khi mức 1–4 đều trống:

  | Mức | Tầng | Executor (+ invocation) | Tier | Persona |
  |---|---|---|---|---|
  | 0 | Mặc định hệ thống | inline nếu có Lead / lỗi rõ nếu headless (không mặc định `claude`) | `rigor = standard` (vẫn đi qua `rigorToTier`) | không có (prompt không có mục Persona) |
  | 1 | Khẩu vị global `~/.fgos/config.json` | `capabilities[domain:verb].prefer[]` → fallback `capabilities[verb].prefer[]` — **đã có** (`prefer`) | `rigorToTier` (khoá bắt buộc, `fgos setup` cài, `doctor` kiểm — plan tier); sàn `capabilities[cap].rigor` — **đề xuất, Q1** | `capabilities[cap].persona` — **đề xuất, chưa có** |
  | 2 | Khẩu vị project `.fgos/config.json` (đè global theo từng key) | như mức 1 | như mức 1 | như mức 1 |
  | 3 | Yêu cầu của việc (unit / YAML mẫu / Flow) | **không bao giờ** | `rigor` (sàn) | vai do step/Flow khai |
  | 4 | Override một lần (request / CLI) | `unit.overrides[role]`, `--executor` | `--tier` / `actors[].tier` (chỉ nâng) | override |

  Áp trên mọi mức, không ai vượt: bộ lọc `readOnly` + `independentOf` (override vi phạm thì từ chối trừ khi ghi rõ chấp nhận); governance phủ quyết cuối.

  Ba ngoại lệ về cách thắng:
  - **Tier lấy giá trị lớn nhất, không theo "mức cao đè":** `rigor = max(rigor mức 3, sàn mức 1–2) ?? standard`; `tier = max(rigorToTier[rigor], override mức 4)`; `model = modelPolicies[provider][tier]`. Không mức nào hạ được sàn.
  - **Executor không có mức 3:** việc chỉ nêu yêu cầu; ai làm là khẩu vị hoặc override. Trong `prefer[]`, candidate đầu qua bộ lọc thắng, các candidate sau là fallback (kể cả khi hết quota).
  - **Persona mức 3 vs 4 còn tranh chấp:** persona nghiệp vụ Flow khoá (vd `brand-guardian`) — lead đề xuất override **không** đè được (xem §7 Q6).

  Hiện trạng persona để đối chiếu: chỉ có mức 4 (`actors[].persona`), mức 3 (`preferPersona` trong YAML) và một mặc định cứng `code-reviewer` cho mọi role `reviewer` (`assignment-policy.mjs:388-391`); config chưa có field persona; persona chỉ là tên (F4, F5).
- **D6 → vai khai là yêu cầu (vd `brand-guardian`), `capabilities[cap].persona` là khẩu vị**; persona có nội dung thật; bỏ default `code-reviewer`, `implied-by-persona`, `model_tier`.
- **D7 → `independentOf` bắt buộc** với vai review output ghi file; không thoả → park. Doctor check "mỗi capability chỉ-đọc có ≥ 2 provider family có invocation read-only".

**Bước 1 = S1 của fable (bốn việc) + hai bổ sung:**
1. Bỏ `policy.capability` khỏi master loop; `red-team-candidate` → `driver-authorized`.
2. `coordination start --capability`, lưu manifest; `composeActionRequest` đọc lại cho mọi node (thay `facts` chết).
3. Config: `docs:write.prefer=[openai]`, `docs:review.prefer=[claude/claude-cli-readonly]`, và sửa `code:review.prefer` → claude (F3). **Lưu ý:** `plan.md` của plan tier nay ghi "readOnlyRedirects dời sang plan follow-on" — **lệch với C5 của handoff** (C5 ghi "bỏ redirect"). Chừng nào redirect còn, bước read-only chọn claude vẫn bị đổi sang openai trừ khi ghim invocation tường minh; vì vậy `prefer` phải luôn kèm invocation, hoặc bước 1 tự xoá redirect.
4. Close-check trước merge; sửa `metrics harness` đọc `definitionRef.id` (F12).
5. *(bổ sung)* Smoke **2 area song song** (openai) trong một Observe case.
6. *(bổ sung)* **Bake-off** cùng 2 area bằng Lead + subagent (fable E1) → quyết P-A hay P-Y trước khi đầu tư S2–S6.

Các bước sau (theo fable): S2 override bền + `solo` + xoá `agent-led`/`dispatch-runs`; S3 một binder (sau khi plan tier merge, cùng file); S4 unit trong phase file + driver chung, xoá DemandFacts; S5 persona + RunResult inline; S6 `panel` + Flow khi có tenant.

## 7. Bộ câu hỏi cho owner (một lượt)

1. **Sàn tier theo capability — chạm quyết định đã chốt C5.** Khẩu vị của anh nói theo loại việc ("review = opus", "research = standard"), nhưng `rigorToTier` là bảng toàn cục; muốn "review luôn opus" thì chỉ còn cách khai `rigor` cao trong YAML mẫu, tức khẩu vị quay lại YAML. Fable đề xuất thêm một scope `capabilities.<cap>.rigor` (sàn, cùng thang, chỉ nâng) vào chuỗi merge đã có. **Em đề xuất: nhận**, đưa vào plan tier như một mục nhỏ. Lựa chọn khác: giữ C5 nguyên, chấp nhận pattern khai rigor.
2. **`model_tier` trong `core/agents/*.yaml`** là đường chọn model thứ hai (qua `scripts/project-agents.mjs`, dựa vào `runner.models` sắp bị xoá), plan tier **chưa phủ** (F15). **Em đề xuất: thêm vào plan tier** (vì plan đó xoá `runner.models`, không làm thì gãy), **kèm thay thế**: subagent in-process lấy model từ `bind()` (tham số `model` của Agent tool, tra `modelPolicies.claude[tier]`), không từ agent YAML. Chỉ xoá mà không thay thì đường in-process mất cách chọn model. Lựa chọn khác: để S5 ở đây.
3. **Bake-off engine vs Lead + subagent** trên 2 area trước khi làm S2+. Tốn thêm một lượt smoke; đổi lại biết chắc nên gom engine hay đi đường gọn kiểu herdr-cook-plan. **Em đề xuất: làm.**
4. **Red-team cho code**: giữ bắt buộc như hiện nay, hay thành objector tuỳ chọn (tự bật ở `rigor: critical`) giống mọi domain? **Em đề xuất: tuỳ chọn**, vì §6.6 cho thấy chi phí vòng lặp; review khác provider bắt buộc đã giữ chất lượng nền.
5. **Plan tài liệu**: bước 1 chỉ build + smoke trên area mẫu. Chạy phase thật cần anh authorize P4 (P6 còn chặn bởi P4–P5). Anh định authorize P4 ngay khi S1 xong, hay chờ thêm? (Không chặn việc build.)

6. **Persona nghiệp vụ Flow khoá có bị override một lần đè không?** Fable: override thắng; openai: persona đã khoá không đè được. **Em đề xuất: không đè** — đó là yêu cầu nghiệp vụ (mức 3), không phải khẩu vị; muốn đổi thì sửa Flow.

Những gì em **tự quyết**, không hỏi: D0–D7 ở §6; bác `AssignmentPlan` (F25); không xây Flow trước tenant.

## 8. Câu hỏi còn mở

- **Đa dạng góc nhìn**: 2/3 câu trả lời là claude. Nếu gemini/xai có góc nhìn khác (nhất là về P-Y), tổng hợp sẽ cập nhật; nếu anh không chạy thêm, em coi 3 bản là đủ vì đồng thuận khung đã rõ.
- `strength: preferred` có đúng là nguyên nhân rubber-stamp §6.6 — cần đọc log session `documentation-authority-unification--phase-01*`.
- Store session nhiễm: 512 `active`, ~115 test rò (F13) — nên thành một work item riêng (dọn + chặn test ghi store thật).
- Drift doc `fallbackExecutors` (F16); `decide --for review` có ra xai không (F14) — nhỏ, tách riêng.
- `dispatch-runs/claude/1790745191212` kẹt `running`.
