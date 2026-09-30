# Harness flexibility: chạy một plan bất kỳ với đúng executor/model/tier/persona, không cần FlowDefinition cho mỗi plan

```txt
Document type: Stateful advisory report (điểm khởi đầu cho một chat thảo luận tiếp)
Snapshot: 2026-09-30, main @ 40a61d10b
Audience: người (owner fgOS) + agent ở chat mới, không có lịch sử hội thoại
Status: Đề xuất; chưa có plan triển khai. Các quyết định đã chốt và câu hỏi mở nằm ở §7–§8
Case ứng dụng: plan "Documentation Authority Unification" (§3)
```

## 1. Câu hỏi cần trả lời

Harness của fgOS (group-protocol / coordination / dispatch) có đủ uyển chuyển để: đưa **một plan bất kỳ** vào, mỗi loại việc trong plan tự được chạy bằng đúng executor, model/tier và persona, với **cấu hình một lần** (khẩu vị của owner), mà **không phải viết một FlowDefinition riêng cho mỗi plan**?

FlowDefinition vẫn có chỗ đứng, nhưng dành cho **quy trình nghiệp vụ theo domain** (finance / marketing / HR), không phải cho mỗi plan.

Nếu chưa đủ, thì phải xây gì?

## 2. Ràng buộc nền (đã chốt, không mở lại nếu không có bằng chứng mới)

- **Vision Node → Rust:** không viết thêm hạ tầng mới bằng Node nếu tránh được. Tham chiếu `docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md`.
- **Single path:** mỗi năng lực chỉ có một đường; phần mới thay phần cũ thì xoá phần cũ trong cùng phase.
- **Không backward compat:** fgOS hiện chỉ có một người dùng, và chủ yếu dùng để phát triển chính fgOS. Memory `project_no_backward_compat_single_user.md`.
- **Priority** (`AGENTS.md`): Ship Faster → Release con người → DoD → Polish.
- **Mission** (D-ADR0035): fgOS tồn tại để phục vụ project khác và business workflow. Việc tự phát triển fgOS là dogfood.
- **Observe trước:** mọi lần chạy phải được component Observe (`fgos metrics`, `fgos friction`) đo được ngay từ đầu. Chỉ những cửa dispatch mà Observe đọc được mới hợp lệ.
- **Bối cảnh:** đánh giá trước đó cho thấy harness nặng (khoảng 46k dòng dispatch+coordination) nhưng use case thật lại bị kẹt. Xem `plans/reports/deep-comparison-260929-1446-harness-simplicity-herdr-cook-plan-vs-fgos.md` (so với `thieung/herdr-cook-plan`: 1 skill + 1 script 151 dòng).

## 3. Case ứng dụng: plan Documentation Authority Unification

- **Plan:** `plans/260925-documentation-authority-unification/` trên nhánh `plan/260925-documentation-authority-unification`, worktree `~/projects/forgentX-phase00-documentation-authority-unification`. Worktree này nằm **ngoài** `.claude/worktrees`.
- **Định dạng:** đã chuyển sang dạng AgentKit (`plan.md` + `phase-01..10`), commit `4d80eaf29`. Phase 1–3 đã xong; phase 4–10 chưa authorize.
- **Bản chất:** gom hai hệ thống tài liệu platform về một (`docs/platform/**`). Việc chủ yếu là **tổ chức lại** (claim-based migration, di chuyển, đổi tên, viết lại link, alias, xoá legacy root lúc cutover), kèm một phần code (gate script, resolver, verb `fgos doc …`). Vì vậy **khả năng ghi file (mutation) là cốt lõi**, không chỉ review.
- **Loại việc theo phase** (chi tiết từng deliverable trong `plans/reports/advice-260929-2345-doc-authority-harness-executor-routing.md` §4):
  - P4 constitution + method freeze: viết + code + quyết định.
  - P5 dual pilot: audit độc lập, transform, fresh-reader.
  - P6 transform mọi area: mutation nặng nhất, song song theo area.
  - P7 kiểm tra cross-area: review nhiều góc nhìn.
  - P8 viết lại consumer: code, skill, instruction.
  - P9 cutover nguyên tử: quyết định + script tuần tự.
  - P10 `fgos doc` CLI: code, Rust native.
- **Ràng buộc riêng của plan:**
  - plan §5: worktree riêng, một worker cho mỗi area, **ledger chỉ có một người ghi**;
  - mỗi phase phải được authorize tường minh;
  - plan có `blockedBy` chờ plan Observe và plan RunResult.
- **Bằng chứng từ lần chạy trước** (phase 2 cũ chạy qua master loop, 6 session trong `.fgos/coordination/sessions/documentation-authority-unification--phase-01*`):
  - reviewer cùng provider với doer (gemini) nên chỉ đóng dấu cho qua (pass trong 1–3 phút);
  - red-team (xai) tìm ra finding gần như mỗi vòng, nhưng bị ghi là `status: failed`;
  - 3 vòng tốn khoảng 10 run và khoảng 150 phút worker;
  - không session nào được đóng.

  Chi tiết: `plans/260925-documentation-authority-unification/reports/harness-readiness-2026-09-29.md` (**chỉ có trên nhánh** `plan/260925-documentation-authority-unification`).

## 4. Hiện trạng harness: cái đã đúng

**Doctrine đã có đúng mô hình**: `core/skills/_shared/capability-matching.md`, `core/skills/_shared/planning-capability-awareness.md`, `core/skills/_shared/capability-catalog.md`, `core/skills/_shared/executor-dispatch-fallback.md`.
- **Q0:** làm inline hay dispatch; mặc định inline.
- **Q1:** unit khai `DemandFacts` (`outputKind`, `domain`, `mutates`, `behaviorPreserving`, `needsIndependentReview`, `hasPlanOrTrack`, `size`, `rigor`), match với `serves` của capability để ra **capability** và **form** (`inline` / `protocol` / `facade`). Công cụ: `fgos capability match --demand <json>`, code tại `src/runner/capability-match.mjs`.
- **Q2:** executor, tier và persona được gắn lúc thực thi qua `fgos dispatch decide --for <capability>` và config.
- **Plan chỉ khai capability, không ghim hạ tầng.** Điều kiện để tách một capability domain mới (ví dụ `docs:write`): có override lặp lại, **hoặc** project đăng ký executor riêng cho domain đó.

**Cơ chế engine đã có** (con trỏ để kiểm lại):

| Cơ chế | Con trỏ | Ghi chú |
|---|---|---|
| Nạp protocol 3 tầng (core, domain, project `.fgos/coordination-protocols/`) | `src/runner/definitions/protocol-loader.mjs` (header, `PROJECT_PROTOCOLS_DIR`) | Thêm protocol là việc dữ liệu |
| Validator FlowDefinition; `policy.capability` là chuỗi tự do | `src/runner/definitions/schema.mjs` `validateFlowDefinition` | Không chặn capability khác `code:*` |
| Request coordination: `agent-led` (chỉ role chỉ-đọc `reviewer` / `researcher` / `advisor`, có `task.capabilities`) hoặc `declared-protocol` | `src/verbs/coordination/schema.mjs` `READ_ONLY_ROLES`, nhánh `raw.kind`; `src/verbs/coordination/run.mjs` `capabilities: request.task.capabilities` | `agent-led` = review hoặc research một lượt |
| Step operation được phép `mutation: mutating`; nhận `objective` / `expectedOutputs` / `contextRefs` / `constraints` / `capabilities` / `dependsOn` | `src/verbs/coordination/schema.mjs` `validateOperationStep` | Nội dung việc do Lead viết trong request |
| Ghim theo actor: `executor`, `invocation`, `tier`, `persona`, `fallbackExecutors` | `src/verbs/coordination/run.mjs` `actorPolicyFields` | `actors[].model` bị cấm với declared protocol (`src/verbs/coordination/run.mjs`, thông báo "--model / actors[].model is not supported") |
| Model = (executor, tier) | `.fgos/config.json` `runner.modelPolicies` | Ví dụ claude: flagship = opus, frontier = fable; openai: flagship = gpt-5.6-terra, frontier = gpt-6-astra |
| Persona | `core/agents/*.yaml` (`code-reviewer`, `docs-manager`, `researcher`, `planner`, ...); qua `preferPersona` | Chưa đánh giá kỹ ngữ nghĩa (§9) |
| Redirect read-only | `.fgos/config.json` `runner.placementPolicy.readOnlyRedirects`; `src/runner/dispatch/placement-policy.mjs`; `src/runner/dispatch/assignment-runner.mjs` `hasExplicitInvocationPin` | Chỉ ghim `invocation` tường minh mới tránh được redirect |
| Capability registry có sẵn | `src/setup/registrations.mjs` (các entry `code:*`, `CURATED_CAPABILITY_NAMES`); `.fgos/config.json` `runner.capabilities` (`execute`, `review`, `advise`, `code:*`) | `review` chưa có `prefer` |
| Claim assignment id nguyên tử (đa process) | `src/runner/dispatch/assignment.mjs` `claimAssignmentId`; `src/runner/coordination/store.mjs` (`createSessionAssignment` gọi `claimAssignmentId`) | Test: `test/runner/dispatch-assignment-id-claim-concurrency.test.mjs`, `test/runner/coordination-dag-concurrency.test.mjs` (đều xanh ngày 2026-09-30) |
| DAG trong session: node read-only độc lập chạy chồng; có cạnh phụ thuộc và trần concurrency | `src/verbs/coordination/dag-scheduler.mjs`; request `dag: true` + `dependsOn` | Dispatch khoá theo từng cwd, nên ghi file song song cần worktree riêng |
| Observe đọc assignment run và coordination session; transcript của worktree ngoài `.claude/worktrees` đã được tính (fix `40a61d10b`) | `packages/observe/rust/src/sources/`; `docs/specs/observe.md` | `dispatch-runs/` (cửa `execute` dạng thường) **không** được đọc |

**Protocol hiện có:** `core/coordination-protocols/`.
- Chỉ `standalone-master-coordination-loop` có bước ghi file, và nó gán cứng `code:implement` / `code:review`; red-team ở vòng đầu là bắt buộc; `revise` và `recheck` là `driver-authorized`.
- Các protocol còn lại (consult, RFC review lite, delphi, nominal group, research fan-out, architecture panel) đều chỉ đọc.

## 5. Năm mối nối đang gãy

| # | Mối nối | Bằng chứng | Hệ quả |
|---|---|---|---|
| S1 | Protocol ghim capability | master loop YAML: `capability: code:implement` / `code:review` | Mẫu cộng tác bị nhân bản theo từng domain; có xu hướng mỗi loại plan một protocol |
| S2 | Mutation chỉ đi qua protocol | `src/runner/dispatch/execution-contract.mjs` (header: `mutation: 'mutating'` bị từ chối ở cửa contract); `execute <executor>` dạng thường ghi `dispatch-runs/` (`src/runner/dispatch/cli.mjs` `openDispatchRun`) | Không có đường chuẩn cho một unit ghi file đơn lẻ mà Observe thấy được |
| S3 | Khẩu vị rải rác; `rigor` không điều khiển tier | `minTier` trong YAML; `capabilities.<cap>.prefer` trong config; persona riêng; doctrine ghi `rigor` là "pass-through" | Phải sửa nhiều chỗ để đổi khẩu vị |
| S4 | Thứ tự ưu tiên không rõ | redirect read-only đè lên `prefer` nếu request không ghim `invocation` | "Opus review" bị đổi lặng lẽ sang openai |
| S5 | Doctrine chỉ nằm trong prose, không có driver chung | Q1 do Lead làm tay; facade duy nhất `fgos-code-change` chỉ phục vụ code | Mỗi plan phải tự viết request JSON |

Hai phát hiện phụ:
- `src/runner/dispatch/assignment-runner.mjs` có `capability: compiledPlan.capability || 'code:implement'`: giá trị mặc định là code.
- `.fgos/dispatch-runs/` chứa run giả do test rò vào (xem prompt sửa: `plans/260929-1703-baseline-friction-producers/fix-test-fixture-leak-prompt.md`).

## 6. Mô hình đích đề xuất

```text
Plan (bất kỳ)       ── unit: objective + DemandFacts + dependsOn + write scope  (KHÔNG hạ tầng)
      │  Q1 do máy làm
Pattern library     ── ít và chung: solo · author-review · author-review+objection · fan-out-research · panel
      │                 operation mang SLOT vai {author} {review} {objector} {researcher}
      │                 slot ← capability match từ DemandFacts của unit
      │  Q2
Binding (config)    ── khẩu vị một lần: capability → executor / invocation / persona
                       tier = bảng (rigor × vai); YAML chỉ giữ sàn
                       thứ tự: override của unit > khẩu vị capability > mặc định an toàn
FlowDefinition      ── quy trình nghiệp vụ theo domain (finance/marketing/hr), GHÉP từ pattern + slot
```

**Chọn pattern từ DemandFacts** (mở rộng `form` mà `capability match` đã trả):
- `mutates: false` + `finding` → `solo` read-only, hoặc `fan-out-research`;
- `mutates: true` + không cần review + `rigor: low` → `solo` mutating;
- `mutates: true` + `needsIndependentReview` → `author-review`;
- `rigor: critical` hoặc `outputKind: decision` → `author-review+objection`.

**Việc cần xây** (thứ tự đề xuất: B5 → B1 → B2/B3 → B4 → B6 → B7 → B8):

| # | Việc | Loại | Sửa |
|---|---|---|---|
| B1 | Capability **slot** trong operation (`capability: {slot: author}`), bind tự động theo DemandFacts, override bằng `slotBindings` trong request | engine | S1 |
| B2 | Thư viện pattern chung: đưa master loop sang slot; protocol read-only nhận slot `review`/`research` | dữ liệu + migration | S1 |
| B3 | Pattern `solo` mutating (vẫn qua cổng worktree cho bước ghi) | engine nhỏ | S2 |
| B4 | Chính sách tier một chỗ: bảng `rigor × vai → tier`; `minTier` trong YAML chỉ là sàn | config + binding | S3 |
| B5 | Thứ tự ưu tiên: override > `prefer` (kể cả invocation) > mặc định an toàn; mặc định an toàn không bao giờ đè lựa chọn tường minh | engine nhỏ | S4 |
| B6 | Driver chung `fgos-plan-run`: đọc unit trong phase → `decide` → match capability + pattern → mở session với slot → mở và đóng case Observe → đóng session. Tổng quát hoá phần facade của `fgos-code-change` | skill + CLI mỏng | S5 |
| B7 | Vocabulary `docs:author` / `docs:review` / `docs:object` (điều kiện tách đã thoả: có executor riêng cho docs) | dữ liệu + registry (install gate: setup/doctor) | — |
| B8 | Vòng học khẩu vị: Observe tổng hợp verdict, finding được chấp nhận và chi phí theo (capability, executor, tier), rồi **đề xuất** sửa config | Observe | tinh chỉnh |

**Không nên làm:**
- FlowDefinition cho mỗi plan;
- protocol cho mỗi tổ hợp domain × mẫu (tùm lum, RUL11);
- ghim executor trong plan;
- thêm lớp an toàn để vá chỗ thứ tự ưu tiên;
- để khẩu vị nằm trong YAML protocol.

**Bằng chứng khả thi:** một bản protocol nháp cho docs (author `execute` → reviewer `review` với `distinctProviderFrom: required` → objector / revise / recheck đều `driver-authorized`) **qua được `validateFlowDefinition`** ngày 2026-09-29. Điều đó chứng minh loader và validator chấp nhận capability tuỳ ý. Bản nháp ở dạng file tạm (scratchpad), không được lưu lại; nó bị thay thế bởi hướng B1/B2 (slot trên mẫu chung) thay vì protocol riêng cho docs.

## 7. Quyết định đã chốt

| Chủ đề | Quyết định | Nguồn |
|---|---|---|
| Khẩu vị viết tài liệu | openai, tier `flagship` (gpt-5.6-terra) | owner, 2026-09-30 |
| Review tài liệu | claude opus (`flagship`), invocation readonly | owner (trước đó) |
| Phản biện quyết định | claude opus (`flagship`) | owner, 2026-09-30 |
| Viết code/script | gemini | owner, 2026-09-30 |
| Review code | claude opus, khác provider với người viết | suy ra từ trên |
| Research / fresh-reader | gemini, xai (`standard`) | đề xuất, chưa phản đối |
| Ngân sách | không áp trần; Observe chỉ đo | owner, 2026-09-30 |
| Song song | cho phép, mỗi area một worktree; chạy một smoke song song thật trước P6 | owner + bằng chứng §4 |
| Tổ chức Observe | một component Observe (Rust), subject tầng nền, case là đơn vị đo | `plans/260929-1501-metrics-friction-rust-native/` (xong) |
| RunResult | D1-A: bỏ `status` legacy, đọc `classification`; D2-A: producer ghi `classification.outcome.category` một lần | `plans/260929-1703-runresult-classification-single-path/` (đang chạy trên nhánh `plan/260929-runresult-classification`) |
| Không dùng master loop `code:*` cho docs | chốt | §3 bằng chứng chi phí |

## 8. Câu hỏi mở (cho chat tiếp theo)

1. **B1:** bind slot tự động từ DemandFacts làm mặc định, cho `slotBindings` tường minh override? (đề xuất: cả hai)
2. **B6:** facade chung mới `fgos-plan-run`, và `fgos-code-change` trở thành một cấu hình của nó? (đề xuất: có)
3. **Tách plan fgOS:** plan 1 = B5 + B1–B3 (đủ để chạy track tài liệu); plan 2 = B4 + B6–B8. Hay gộp làm một?
4. **B7:** tạo `docs:*` riêng (đề xuất), hay tái dùng `execute` / `review`?
5. **Unit trong plan:** chọn định dạng máy đọc được nào trong file phase của AgentKit (ví dụ block YAML `units:` trong từng phase), sao cho `ak plan` và B6 cùng đọc được?
6. **Code mới** (B1/B3/B5 nằm trong Node dispatch/coordination): chấp nhận sửa Node, hay chờ tới khi các component đó chuyển sang Rust?

## 9. Chưa kiểm chứng (cần làm trước hoặc trong plan)

- Cổng mutating có chấp nhận capability không phải code ở **runtime** không (mới chỉ qua validator tĩnh): cần smoke thật.
- Ngữ nghĩa của `steps[].capabilities` trong định tuyến (schema nhận, chưa rõ có override capability của operation không).
- Persona (`core/agents/*.yaml`, `preferPersona`) ảnh hưởng tới prompt hay executor thế nào.
- Bên trong `fgos-code-change` (phần facade) có tái dùng được cho B6 không.
- Nguyên nhân sự cố race ngày 2026-09-15 (claim nguyên tử đã có từ 2026-09-01; memory `feedback_serialize_coordination_run_never_parallel_same_writer.md` đã được cập nhật).

## 10. Tài liệu liên quan

- Đánh giá harness: `plans/reports/research-260929-1203-herdr-cook-plan-vs-fgos-dispatch-coordination.md`, `plans/reports/deep-comparison-260929-1446-harness-simplicity-herdr-cook-plan-vs-fgos.md`
- Đo lường: `plans/reports/measurement-audit-260929-1454-harness-scorecard.md`; spec `docs/specs/observe.md`
- Gán executor cho track tài liệu: `plans/reports/advice-260929-2345-doc-authority-harness-executor-routing.md` (§4 bảng từng deliverable, §8 khẩu vị và concurrency; phần protocol riêng cho docs bị thay bởi báo cáo này)
- Chỉ có trên nhánh `plan/260925-documentation-authority-unification`: `plans/260925-documentation-authority-unification/reports/harness-readiness-2026-09-29.md` (§5 ghi "không có đường mutating non-code": **đã lỗi thời**, xem §4–§6 ở đây) và `plans/260925-documentation-authority-unification/plan.md` §7.2
- Draft producer friction: `plans/260929-1703-baseline-friction-producers/plan.md`
