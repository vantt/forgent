# Capability-aware dispatch gate: điều tra và quyết định cho Phase 4

Track: `plans/260919-coordination-skill-harness-simplification/plan.md`
Trạng thái: ba quyết định đã chốt (owner, 2026-09-27); phần còn lại hoãn có tên.
Cập nhật 2026-09-27 12:30: Phase 4 (Unit I15) đã integrated tại `main@8e8a3f1aa`
trước khi report này viết xong; §6.4 đối chiếu ba quyết định với những gì đã
land và đổi đích áp dụng sang Phase 5.
Nguồn bằng chứng: điều tra tại `main@2085d88fe`; đối chiếu tại `main@dfd0b3d5a`.
Chế độ: phân tích, không sửa code/plan.

## 1. Bài toán

Ba yếu tố model/tier, executor/invocation, persona được chọn ổn ở hai giai
đoạn đầu (theo capability đã cho tên; theo operation đã khai trong
FlowDefinition). Giai đoạn ba, một prompt bất kỳ trong session đang sống,
không có bước nào suy ra ba yếu tố từ loại việc. Hệ dispatch tham gia sớm
(skill `fgos-capability-dispatching`, hook PreToolUse, mô tả skill
`fgos-code-panel`) và hỏng theo hai kiểu: quá đà (việc tài liệu bị lùa vào
cell code với worktree, doer, reviewer, red-team) và chọn sai (governance
gắn `code:implement`, review policy gắn `code:review`).

Ba câu hỏi theo thứ tự cho mọi prompt; hôm nay chỉ câu cuối được xây:

| | Câu hỏi | Bản chất | Hôm nay |
|---|---|---|---|
| Q0 | cần dispatch không, hay inline | kích hoạt | đảo ngược: mặc định hỏi `decide` |
| Q1 | loại việc: work-product hay advisory, domain, cỡ, cần review độc lập, có plan | steering | không có bước; ngầm trong mô tả skill |
| Q2 | executor / tier / persona cho capability và hình thức đã chọn | binding | đã xây, làm đúng việc |

`decide` trả lời đúng cho câu hỏi sai. Lỗi nằm trước `decide`.

## 2. Hai độ cao, hai trục

Unit theo doctrine (một mẩu việc, một capability, một lần `decide`) áp cho
từng node trong protocol: produce là một unit, review là một unit, red-team
là một unit. Cell là phép ghép nhiều unit theo protocol, không phải unit.
Danh sách I00..I14 trong plan.md ghi capability của node chính (produce).

| Độ cao | Capability trả lời | Ai hỏi | Hệ quả |
|---|---|---|---|
| plan unit | loại việc | Lead lúc decompose | chọn facade / protocol / inline |
| operation node | executor nào | composer, ngay trước dispatch | binding |

Hai trục `capabilities` trong code, không được lẫn:

| Trục | Ở đâu | Nghĩa | Enforce |
|---|---|---|---|
| dispatch capability | `runner.capabilities.<name>`, `decide --for` | cơ chế/executor chạy một unit | `compileDispatchPlan`, `resolveExecutorAndOverrides` |
| requirement tag | FlowDefinition `operations[].capabilities[]`, step/Assignment `capabilities[]` | "stored and validated, does not resolve execution infrastructure" (flow-definition.md:201); superset check cho specialist slot | `authorizeSpecialistSlot` |

Assignment door (`resolveAssignmentDispatchPolicy`) chọn executor theo
`actors[].executor` → `opPolicy.preferExecutor` → executor mặc định; không
tra `capabilities.<name>.prefer`. Confinement request hard-code
`compiledPlan.capability || 'code:implement'` (assignment-runner.mjs:2223).

## 3. Bản đồ surface đang chọn ba yếu tố

| # | Surface | Đầu vào | executor/invocation | tier | persona | Trạng thái |
|---|---|---|---|---|---|---|
| A | catalog + `decide --for` | tên capability | `prefer`, `for` | `overrides.rigorOverrides` | không | đường chính doctrine |
| B | coordination: FlowDefinition + `actors[]` → `cliPolicy`; `placementPolicy.readOnlyRedirects`; `cohort-planner` | operation id, roster tay | có | `policy.minTier` raise-only | `actors[].persona` chuỗi tự do | đang dùng, không đọc A |
| C | Work path: `executorIdForWork` (domain+stage → alias capability), `work.tier` tự khai, `resolveAgentTypeForWork` | domain + stage | qua A | `work.tier` | chưa dùng | pick / runner / fanout |
| D | agent definitions `core/agents/*.yaml` → `.claude/agents` | tên agent | agentType | `model_tier` | có cấu trúc | in-process Agent; hook map `subagent_type` |
| E | ad-hoc six-field task, `execute --tier/--model` | phán đoán session | id tường minh | rubric inline | không | lẻ tẻ |
| F | operation prompt templates (I04) | operation id | không | không | tiềm năng (Phase 5 việc 1) | chưa mang persona |
| G | tool registry + Rust `authority_gate` | capability | tool provider | không | không | impact-analysis, pane-labeling |
| H | mô tả skill làm router | văn xuôi | gián tiếp | gián tiếp | gián tiếp | ngầm, không luật |

Persona có hai từ vựng không nối nhau (B chuỗi tự do, D object). Không
surface nào nhận đầu vào "loại việc".

## 4. Catalog đóng, `decide` dồn về default

Catalog sống: `impact-analysis`, `pane-labeling`, `advise`, `execute`,
`fgos-coding-implement`, `code:implement`, `code:review`, `code:test`,
`code:debug`, `code:refactor`.

- ngoài catalog (`docs:write`, `review`, `code:implment`) → `unavailable`,
  `selector.unregistered`, không cảnh báo
- `execute`, `code:test`, `code:refactor` → `prefer: claude`, trùng executor
  mặc định
- chỉ `code:implement` (gemini), `code:review`/`code:debug` (openai bwrap),
  `advise` (claude bwrap) thực sự đổi executor
- `glm`, `xai`, `deepseek` không khai `for` cho capability nào; chỉ chạm
  được qua id tường minh hoặc roster tay

Hệ quả: roster tay tồn tại vì là cửa duy nhất tới đa dạng provider cho việc
non-code. Bỏ roster mà không mở catalog thì mọi thứ về claude.

## 5. Lint hiện tại: lỗ hổng đã xác nhận bằng chạy thật

`src/report/capability-plan-lint.mjs` là `status: 'shadow'`
(test-ownership.mjs:45), không CLI, không caller. Chạy thử:

| Case | Kết quả |
|---|---|
| `capability: code:review (or advise)` | pass sạch (parenthetical bị strip) |
| hai dòng `capability:` | pass, dòng sau thắng |
| `capability: unresolved` | pass mãi |
| `prefer:` / `invocation:` trong block | không bắt (chỉ executor/provider/model/tier) |
| bảng Product Gates cột Capability | zero unit (không parse) |
| roster ngoài block | ngoài scope |

## 6. Ba quyết định đã chốt (2026-09-27)

### 6.1 Từ vựng fragment: hai độ cao

- Driver-discipline fragment dùng nguyên cụm "iteration" / "unit of
  iteration" (đúng plan.md) cho thứ driver mở, lặp, đóng tường minh. Không
  rút gọn thành "unit".
- Fragment không mô tả bên trong một iteration: không node, không
  doer/reviewer, không capability từng node.
- Cụm "execution unit" giữ nghĩa doctrine; fragment không dùng.

Quan hệ iteration ↔ execution unit viết ở S5, không ở fragment.

### 6.2 Câu cho hook slot "open inputs"

> Open inputs. Trước khi mở một iteration, facade cung cấp: (a) loại kết
> quả iteration này tạo ra, work-product hay advisory; (b) đúng một
> capability canonical chính của nó; (c) mọi binding input mà control layer
> cần, nếu facade có. Discipline đọc (a) để biết luật evidence và close nào
> áp dụng, và coi (b), (c) là dữ liệu chuyển tiếp: nó không tự suy ra,
> không tự chọn, và không bao giờ đặt tên executor, model, tier hay persona.

- (a) tái dùng `result.kind` của FlowDefinition.
- Không nhắc `decide`: trong chế độ protocol driver không gọi `decide`,
  engine/composer resolve từng node. Không nhắc lint.
- (c) giữ roster hôm nay hợp lệ như binding input facade đang cung cấp;
  sau S5 facade ngừng cung cấp, câu không đổi.
- Không có `git`, `worktree`, `merge`, `npm test`, `phase`, `plan.md`.

### 6.3 Capability cho unit thực thi (áp từ Phase 5; Phase 4 đã chạy trước)

Track không chạy qua plan-loop; unit track là unit phẳng, mỗi unit một
capability, người thực thi hỏi `decide` một lần. Bảng dưới viết cho Phase 4
lúc chưa biết I15 đã xong; giữ lại làm mẫu phân loại cho unit prose/test/
review từ Phase 5 trở đi (xem §6.4).

| Unit | Việc | Capability | Vì sao |
|---|---|---|---|
| 4a | viết driver-discipline fragment | `execute` | prose `core/skills/_shared`, mutate, theo spec |
| 4b | viết coding-cell policy fragment | `execute` | như trên |
| 4c | rewrite plan-loop SKILL.md | `execute` | prose, không phải source |
| 4d | drift test, budget test, skill-contract test | `code:test` | code test thật |
| 4e | đo giảm token kịch bản Phase 0, ra measurement | `execute` | theo quy trình, tạo artifact |
| 4f | review độc lập 4a–4c + walk-through code-panel direct-mode | `unresolved` | không `code:review` (artifact không phải code), không `advise` (không phải một hỏi một đáp) |

Ghi chú thực thi:

- `execute` / `code:test` → `decide` trả claude out-of-process; claude
  headless sandbox chỉ commit được, Lead tự chạy test 4d.
- 4f không hỏi `decide` được; chạy inline hoặc `execute <executor-id>`
  tường minh với ad-hoc six-field task (ví dụ openai bwrap). Lần ghi
  `unresolved` này là bằng chứng nhu cầu đăng ký `review`; nếu slot land
  giữa chừng, 4f đổi sang `review`, ghi vào plan.
- Không unit nào là `code:implement`.

### 6.4 Đối chiếu với Phase 4 đã land (I15, `main@8e8a3f1aa`)

Đã land: `core/skills/_shared/coordination-driver.md` (114 dòng),
`domains/coding/skills/_shared/coding-cell-policy.md`, plan-loop rewrite
1.233 từ, test `test/skills/coordination-phase4-driver-discipline.test.mjs`
(9 test, drift test cấm `git`/`worktree`/`merge`/`npm test`/`phase`/`plan.md`).
Review độc lập APPROVE tại `c343304b3`. Phase 5 ghi "open / ready", chưa
consume fragment.

| Quyết định | Fragment/plan-loop đã land | Khớp? | Việc còn lại |
|---|---|---|---|
| 6.1 từ vựng "iteration" | hook slot tên `unit of iteration`; định nghĩa slot dùng "quantum of work ... one coordinated unit"; không mô tả node bên trong | đủ dùng; chữ "unit" lỏng trong định nghĩa slot, không đáng sửa riêng | không |
| 6.2 câu open inputs | slot `open inputs` = "source specifications and parameters ... task definitions, objectives, and actor configurations into session start parameters" | thiếu (a) loại kết quả và (b) capability chính; có (c) dưới tên "actor configurations"; **không có** vế "driver không bao giờ đặt tên executor/model/tier/persona" | amendment nhỏ, prose, trước unit Phase 5 đầu tiên (xem dưới) |
| 6.3 capability unit | I15 ghi `capability: code:implement` cho hai fragment prose + rewrite skill + test | **lỗi dogfood lặp lần hai**, cùng mẫu với sự cố ban đầu | ghi nhận làm bằng chứng; áp bảng 6.3 từ Phase 5 |

Phát hiện thêm khi đối chiếu, cần track manager biết trước Phase 5:

1. **Roster biến mất khỏi facade mà chưa có kênh thay thế.** Plan-loop mới
   gọi `fgos coordination start` không có `--actors`/`--executor`/`--tier`
   (CLI vẫn nhận các flag này, `bin/fgos.mjs` ALLOWED_COORDINATION_FLAGS
   `start`/`operation`). Test clean-pass cũng gọi `startCoordinationUseCase`
   không actors. `docs/how-to/author-a-plan-loop-track.md` vẫn bắt ghi
   Roster trong Execution Inputs nhưng plan-loop không nói cách truyền.
   Hệ quả khi làm theo prose: doer về executor mặc định (claude, không còn
   gemini như roster cũ); reviewer/red-team vẫn sang openai bwrap nhờ
   `placementPolicy.readOnlyRedirects` theo operation id; persona mất hẳn;
   tier lấy từ `policy.minTier` của protocol. Đây là bước vô tình tiến về
   hướng (c) binding-từ-config, nhưng mới đúng nửa: Assignment door vẫn
   không đọc `capabilities.code:implement.prefer`, nên doer không về gemini.
2. **Slot open inputs hợp thức hóa "actor configurations" là đầu vào của
   facade**, tức driver vẫn là người cấp binding. Vế cấm trong 6.2 chưa có
   chỗ đứng cho tới khi S5 chuyển binding vào composer.

Đề xuất xử lý, không mở lại Phase 4:

- **Amendment unit trước Phase 5** (`execute`, prose, một session): thêm vào
  định nghĩa slot `open inputs` hai ý (a) loại kết quả work-product/advisory
  và (b) một capability chính, giữ "actor configurations" là (c); thêm vế
  "discipline không tự chọn và không đặt tên executor, model, tier, persona".
  Plan-loop hook value bổ sung "primary capability và result kind lấy từ
  bảng Product Gates". Chạy lại 9 test Phase 4 + projection byte-identical.
  Làm trước khi Phase 5 consume để không vướng luật "consume unchanged".
- Phase 5 việc 2 (S5) nhận thêm yêu cầu tường minh: khôi phục kênh binding
  cho facade (composer đọc `capabilities.<name>.prefer` cho từng node, roster
  tay là override) và sửa how-to cho khớp. Cho tới đó, ghi vào plan-loop một
  dòng chuyển tiếp: Lead có thể truyền `--actors` trên `start` khi cần đa
  dạng provider.
- Ghi I15 `code:implement` vào evidence của plan liền kề S1–S3 như dogfood
  lần hai.

## 7. Kế hoạch triển khai: hai đường theo độ ghép

| Mảnh | Chạm file | Track đang sửa? | Đường |
|---|---|---|---|
| S1 steering doctrine: mặc định inline, bốn lý do mới dispatch, lời khai loại việc trước `decide`; chỉnh trigger `fgos-capability-dispatching` | fragment mới `_shared/`, mô tả skill | không | plan liền kề |
| S2 lint sửa lỗi §5 + parse Product Gates + verb `fgos plan-lint` | `src/report/`, `bin/fgos.mjs`, registry, test | không | plan liền kề |
| S3 catalog: slot `review`, `for` cho glm/xai/deepseek, reasonCode `capability.unknown` | `registrations.mjs`, `.fgos/config.json`, `dispatch/plan.mjs` | không | plan liền kề |
| S4 hook open-inputs trong fragment + facade gọi preflight trước mở cell | fragment và plan-loop đã land | Phase 4 đã đóng | amendment unit nhỏ trước Phase 5 (§6.4); preflight gọi `plan-lint` chờ S2 |
| S5 binding resolver trong composer (tái dùng cohort-planner), capability đơn trên operation, ràng buộc đa dạng, persona vào template, **khôi phục kênh binding facade đã mất (§6.4 mục 1)** | composers, FlowDefinition, template registry, how-to | có | đầu Phase 5, thay việc 2 |
| S6 version contract FlowDefinition, roster rời plan.md, đóng cửa sổ | contract, how-to, CHANGELOG | có | Phase 7 |

Rào để không chậm / không phá:

- S3 chỉ thêm, không đổi `prefer` của `execute`/`code:test`/`code:refactor`
  đang trỏ claude (unit track đang `decide` sống trên đó).
- S1 tạo file mới; land trước S4 rồi S4 link tới.
- Không đặt steering vào kernel hay hook.
- S4 không là điều kiện exit Phase 4.
- Không mở contract FlowDefinition trước Phase 7; S5 dùng ánh xạ tạm trong
  composer.

Phase 4 không được: viết `plan-lint` vào fragment; tuyên bố roster là luật
vĩnh viễn; gắn `code:*` cho việc governance; ghi capability gate đã xong.

## 8. Lệnh tái lập bằng chứng

```sh
node src/runner/dispatch.mjs decide --for code:implment   # unavailable, selector.unregistered
node src/runner/dispatch.mjs decide --for review          # unavailable
node src/runner/dispatch.mjs decide --for execute         # out-of-process, claude
node src/runner/dispatch.mjs decide --for code:test       # out-of-process, claude
node -e 'const c=JSON.parse(require("fs").readFileSync(".fgos/config.json","utf8")).runner;for(const [k,v] of Object.entries(c.executors))console.log(k,JSON.stringify(v.for))'
grep -n "capability-plan-lint" test/test-ownership.mjs   # status: shadow
```

Lint probe: gọi `lintPlanCapabilityAnnotations` với các case ở §5, tất cả
trả `ok: true`.

## 9. Câu hỏi chưa chốt

1. Đăng ký generic `review` (đề xuất) hay nới mô tả `code:review`?
2. Roster: chuyển vào `runner.coordination.rosters.<track>` hay ghi nhận là
   ngoại lệ protocol-actor? Đề xuất config, quyết ở S5/S6.
3. Warning domain-mismatch có đáng thêm config `runner.codePaths`
   (`registerConfigDefault`, doctor báo inactive khi vắng) ngay, hay chờ
   dogfood lần hai?
4. Plan unit khai `size` (light/standard/heavy) có được coi là fact về
   việc, không phải pin tier?
5. Ràng buộc đa dạng vô nghiệm với config nhỏ: dừng hỏi người hay chạy
   thiếu đa dạng có ghi nhận?
6. Cửa sổ tương thích cho plan chưa khai capability dài bao lâu trước khi
   warn thành refuse?
7. `unresolved` có được mở với Lead override ghi rationale, hay bắt buộc
   resolve trước?
8. Persona: template (Phase 5 việc 1) hay override request-scope cùng chỗ
   roster tay?
9. `fallbackExecutors` per actor chồng với provider-capacity fallback ở đâu?
10. Field capability đơn trên operation: làm cho cả panel ở Phase 5 hay chỉ
    `produce-review-revise` trước?

## 10. Draft: amendment unit block cho plan.md (chèn sau I15, trước Phase 5)

Word budget: combined Lead load hiện 3.121 / 3.300 từ (driver 1.141, plan-loop
1.251, policy 729). Amendment cộng tối đa ~120 từ.

```text
- unit: I16 — amend driver-discipline open-inputs slot and plan-loop hook value before Phase 5 consumes the fragment
  capability: execute
  depends-on: I15
  status: not-started
  scope: Prose-only amendment; no code, schema, persisted entity, or runtime change.
    (1) core/skills/_shared/coordination-driver.md, hook-slot table row `open inputs`:
        replace the Definition/Responsibility cells with:
        Definition: "The source specifications and parameters used to initialize the session:
          (a) the iteration's declared result kind, work-product or advisory;
          (b) exactly one primary canonical capability;
          (c) any binding inputs the control layer requires, when the facade has them."
        Responsibility: "Facade supplies (a)–(c). The discipline reads (a) to select
          evidence and close rules, treats (b) and (c) as pass-through data, never derives
          or chooses them itself, and never names an executor, model, tier, or persona."
        Vocabulary constraint: no `git`, `worktree`, `merge`, `npm test`, `phase`, `plan.md`
        (drift test); "capability", "executor", "binding" are platform vocabulary and allowed.
    (2) core/skills/fgos-plan-loop/SKILL.md, hook-value table row `open inputs`:
        "Extracted from plans/<track>/phase-NN-<name>.md: objective, verification commands,
         result kind (work-product for a produce cell), the phase's primary capability from
         the plan.md Product Gates table, and any actor binding the Lead supplies."
    (3) core/skills/fgos-plan-loop/SKILL.md, section "1. Open a Cell", after the `start`
        command block, one transitional sentence:
        "Until binding resolves from config (Phase 5), pass `--actors '<json>'` on `start`
         when the track's Execution Inputs roster requires provider diversity; omitting it
         binds every node to the default executor plus placementPolicy read-only redirects."
    (4) docs/how-to/author-a-plan-loop-track.md, Execution Inputs "Roster" bullet: add
        "(passed via `fgos coordination start --actors`; transitional until Phase 5)".
    (5) npm run build:skills; confirm .agents/ and plugins/fgOS/ mirrors byte-identical.
    Nothing else changes: no decide call added to the fragment, no plan-lint reference,
    no roster rule declared permanent, no exit criterion of Phase 4 reopened.
  verification:
    node --test test/skills/coordination-phase4-driver-discipline.test.mjs   (9/9, incl. drift + word budget + projection)
    node --test test/skills/coordination-dag-driver-skill-contract.test.mjs
    wc -w core/skills/_shared/coordination-driver.md core/skills/fgos-plan-loop/SKILL.md domains/coding/skills/_shared/coding-cell-policy.md  (combined <= 3300)
    git diff --check
  evidence: plans/reports/architecture-investigation-260927-1154-capability-aware-dispatch-gate-phase4-decisions.md §6.2, §6.4
  stop: any test above fails; combined word load exceeds 3300; the amendment needs a word
    on the drift-test forbidden list; Phase 5 has already consumed the fragment (then the
    change moves into Phase 5's own re-verification instead).
```

Ghi chú cho người thực thi: `decide --for execute` hôm nay trả claude
out-of-process; claude headless không tự chạy test, Lead chạy verification
ở trên và đối chiếu diff trước khi approve. Không dùng `code:implement`.

## 11. Quyết định phiên steering (owner, 2026-09-27 14:16)

Đầu ra của phiên: bước Q1 có hình dạng, tên, ranh giới; đã gộp vào track làm Unit I17–I20
(`plans/260919-coordination-skill-harness-simplification/phase-05-unit-i17…i20-*.md`).

### 11.1 Phía cầu khai `DemandFacts` (thuộc tính, không phải nhãn)

| Thuộc tính | Kiểu | Ghi chú |
|---|---|---|
| `outputKind` | chuỗi mở | giá trị hợp lệ = những gì catalog đang khai; hôm nay `change`, `verification`, `finding`, `decision` |
| `domain` | chuỗi mở | `code`, `docs`, `config`, … hoặc rỗng |
| `mutates` | bool | |
| `behaviorPreserving` | bool, tùy chọn | refactor vs implement |
| `needsIndependentReview` | bool | quyết hình thức protocol |
| `hasPlanOrTrack` | bool | quyết plan mode |
| `size` | `TIERS` light/standard/heavy | **chỉ** quyết hình thức; không liên quan model |
| `rigor` | `MIN_RIGOR_VALUES` low/standard/high/critical | chuyển tiếp cho Q2; steering không dùng |

Agent đọc prose để khai facts; máy không đọc prose. Agent được override kết
quả khớp, kèm lý do, được log. Enum hoạt động bị bỏ (đóng kín, tái tạo bài
toán catalog đóng).

### 11.2 Catalog tự là bảng: `serves`

Mỗi capability khai `serves` (tập thuộc tính nó phục vụ). Khớp: mọi thuộc
tính capability khai đều thỏa; không khai = bất kỳ; nhiều-thuộc-tính-hơn
thắng; hòa hoặc không khớp → `form: inline`, `capability: null`, log miss
kèm ứng viên. Không có bảng tra riêng; thêm capability là thêm dòng.

| Capability | `serves` |
|---|---|
| `code:implement` | change, code, mutates |
| `code:refactor` | change, code, mutates, behaviorPreserving |
| `code:test` | verification, code |
| `code:debug` | finding, code |
| `code:review` | finding, code, không mutate |
| `execute` | change, mutates |
| `advise` | decision, không mutate |
| `review` (mới) | finding, không mutate |

Hình thức từ `needsIndependentReview` (protocol), `hasPlanOrTrack` (plan
mode), `size`. `serves` là schema addition trên `runner.capabilities`,
đăng ký setup/doctor; entry không có `serves` vẫn hợp lệ, không bao giờ
được match tự động.

### 11.3 Ba từ vựng tier, không gộp

`TIERS` (work-size, `src/state/work.mjs:161`) ≠ `MIN_RIGOR_VALUES`
(`assignment-policy.mjs:48`) ≠ `MODEL_POLICY_TIERS` (`config.mjs:520`).
`docs/history/two-layer-dispatch/DISCUSSION.md` #30/#30b: model tier phán
lúc dispatch, planning tier cùng lắm là gợi ý. Lý do dispatch thứ năm
"model mạnh hơn" = `rigor` khai cao hơn mức session đang chạy; không gắn
với `size`.

### 11.4 Năm lý do dispatch; mặc định inline

Model rẻ hơn, model mạnh hơn, provider khác, cách ly, chạy song song. Không
có lý do → inline. Đảo ngược trigger hiện tại của
`fgos-capability-dispatching`.

### 11.5 Tên và ranh giới component

| Thứ | Tên |
|---|---|
| fact phía cầu | `DemandFacts` (từ vựng cầu/cung, `dispatch-concept-boundary/DISCUSSION.md` §6.4) |
| hàm thuần | `matchCapability(demandFacts, catalog)` |
| kết quả | `CapabilityMatch { facts, capability \| null, form, candidates, source, reason }` |
| module | `src/runner/capability-match.mjs` (ngoài `dispatch/`, boundary test cấm import decide) |
| CLI | `fgos capability match --demand <json>` |
| fragment | `_shared/capability-matching.md` (cụm bốn với catalog, planning-awareness, dispatch-fallback) |
| log | `appendWorkerLog`, `source: match \| override \| miss` |

Chuỗi: `capability match` (Q1) → `dispatch decide` (Q2) → `dispatch execute`.
Ranh giới: matching không gọi `decide`, không đọc `prefer`, không resolve
executor. Tên bị loại: steer (chung chung), classify (đã có
`src/intake/classify.mjs`), route/triage/shape (skill/verb đã chiếm).

### 11.6 `execute` gánh prose; `docs:*` chỉ khi có trigger

Domain-scoped chỉ khi lời hứa khác; viết tài liệu theo spec là đúng lời
hứa của `execute`. Chi phí/model do `rigor` và binding lo. Promotion trigger
ghi trong fragment: override khỏi `execute` lặp lại trong log, hoặc project
đăng ký executor chỉ phục vụ docs. `review` generic cần ngay.

### 11.7 Đối chiếu I16 đã land (`main@a48ce987c`, 2026-09-27)

Fragment và plan-loop có đúng hai dòng open inputs như §6.2; how-to sửa;
tổng ba file 3.240 từ (trần 3.300). Executor phát hiện thêm, ghi ở
plan-loop dòng 89: `--actors` trên `fgos coordination start` **chỉ bind node
đầu** (entry node `produce-candidate`); các `authorize-and-dispatch` sau
không mang actors, nên reviewer/red-team bind về executor mặc định cộng
`placementPolicy.readOnlyRedirects`. **Đa dạng provider giữa các role hiện
không đạt được từ facade.** Đây là đầu vào cứng cho S5: composer phải bind
từng node (từ `serves`/`prefer` của catalog, roster tay là override), không
chỉ node đầu. Plan liền kề đã gộp vào track làm Unit I17–I20 (owner, 2026-09-27 14:34);
I19 (config thuần) chặn Phase 5 việc 2.

## 12. Quyết định S5: binding từng node (owner, 2026-09-27 14:56) → Unit I21

1. **Thứ tự bind mỗi node**, composer tính một lần, đi qua kênh `cliPolicy`
   có sẵn, provenance `bindingSource`: override tường minh của Lead (roster
   hoặc `--executor/--tier` trên step) > `policy.capability` của operation →
   `capabilities.<cap>.prefer` + `overrides` > `policy.minTier` raise-only
   với `rigor` > `readOnlyRedirects` giữ ở tầng dưới làm lưới an toàn
   read-only.
2. **`policy.capability`** (số ít, dưới `policy`, cạnh `minTier`) trên
   operation của FlowDefinition; tùy chọn; hợp scope portable vì là
   requirement. Fallback khi vắng: `work-product` → capability chính của
   facade; `advisory` → `<domain>:review` nếu có, không thì `review`. Không
   có bảng config ánh xạ operationId.
3. **`policy.distinctProviderFrom: [role...]`** với `strength: required |
   preferred`. `preferred` bind kèm cảnh báo provenance khi vô nghiệm;
   `required` từ chối có tên `binding.diversity-unsatisfiable`, Lead vượt
   bằng flag tường minh có provenance. `produce-review-revise` khai
   `preferred`; panel có thể khai `required` cho red-team. Doctor báo số
   họ provider cấu hình.
4. **Persona** vào operation template (Phase 5 việc 1); `actors[].persona`
   là override request-scope có provenance; agent yaml chưa nối.
5. Chồng lấn `readOnlyRedirects` / `code:review.prefer` ghi nhận, Phase 7
   quyết giữ một.
6. Không quyết binding trong session-engine/kernel; engine chỉ nhận
   `cliPolicy` đã tính cho mọi declared step (đường fan-out đã làm vậy).

## 13. Phase 6/7 của track đã nhận phần còn lại (2026-09-27)

Phase 6: entry gate (I21, I18, I20); hook open inputs điền từ `plan-lint --cell`
(plan mode) và `capability match --demand` (single-change); match `inline` thì
không mở cell; facade không cấp roster mặc định. Exit thêm: cell chỉ mở khi
match không phải inline và không có finding cứng; ca dogfood I15 không được
tái diễn.

Phase 7: 4 (setup/doctor cho `serves`, `review`, hai policy field), 4b
(version contract FlowDefinition + spec), 4c (chọn một trong
`readOnlyRedirects` / `code:review.prefer`), 4d (đóng cửa sổ tương thích:
plan chưa khai capability → refuse; bỏ `Execution Inputs: Roster` khỏi
how-to), drift test bốn dòng mới (serves hợp lệ/không trùng; `policy.capability`
resolve; không pin executor qua policy field; skill dispatch link fragment và
không trigger theo từ khoá).

Mọi câu hỏi mở còn lại (§9) đều có chủ: 1 → I19; 2 → I21/Phase 7 4d; 3 →
log của I20 quyết; 4 → §11.1 (`size` chỉ hình thức); 5 → §12 mục 3; 6 →
Phase 7 4d; 7 → I18 (warn) rồi Phase 7 4d (hard); 8 → §12 mục 4; 9 → I21
ghi nhận, Phase 7 4c; 10 → I21 làm cả hai protocol.
