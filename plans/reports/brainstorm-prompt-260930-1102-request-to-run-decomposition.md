# Brainstorm prompt: từ một yêu cầu tới lúc chạy — phân rã, chọn cách cộng tác, chọn người làm

```txt
Document type: Brainstorm/advisory prompt (gửi nguyên văn cho nhiều agent độc lập)
Snapshot: 2026-09-30, repo forgentX, branch main
Người đặt câu hỏi: owner fgOS
Người tổng hợp: agent chủ trì (sẽ gom mọi câu trả lời, so sánh, rồi thảo luận tiếp với owner)
Trạng thái: mở — chưa có quyết định nào ở phạm vi prompt này ngoài §4
```

## 0. Vai trò của bạn và cách làm

Bạn là **cố vấn kiến trúc độc lập**. Bạn không sửa code, không tạo commit, không chạy lệnh ghi trạng thái (`fgos submit/pick/move/coordination start/dispatch execute`…). Bạn **được** đọc mọi file trong repo và chạy lệnh chỉ-đọc (`rg`, `cat`, `git log`, `node -e` đọc JSON).

Quy tắc:
- Mọi khẳng định về hiện trạng phải kèm con trỏ `path:line` hoặc tên symbol. Ghi rõ **[fact]** (đã kiểm trong code) hay **[suy luận]**.
- Fact sheet ở §6 do người soạn prompt tự kiểm ngày 2026-09-30; nó có thể sai hoặc thiếu. Nếu bạn thấy sai, nói thẳng và dẫn bằng chứng.
- Được phép — và được khuyến khích — phản bác khung ở §5, các ràng buộc suy diễn, hoặc chính câu hỏi, nếu có lý do.
- Ưu tiên **ít khái niệm hơn**, **một đường duy nhất cho mỗi năng lực**, **xoá được cái cũ**. Không đề xuất thêm lớp an toàn để vá một thiết kế rối.
- Viết bằng tiếng Việt, giữ thuật ngữ kỹ thuật tiếng Anh. Tối đa khoảng 2.500 từ (không tính bảng trace ở phần B/C).

## 1. Câu hỏi

> Với **một yêu cầu** của user, khi đi xuống hệ thống fgOS, nó được **phân rã** (việc/todo, capability) và chuyển xuống phần **coordination / dispatch / run** như thế nào — trong trường hợp **có** FlowDefinition và **không có** FlowDefinition? Executor, model/tier và persona được **chọn ra sao**?
>
> Hãy phân rã tiến trình đó để tìm ra một cách tiếp cận **đơn giản** và **linh hoạt**.

Mục tiêu là **đơn giản hoá cái đang có**. Phương pháp không bị giới hạn: bạn nên thiết kế một hình dạng mới từ đầu (clean-sheet) rồi đối chiếu với hiện tại để thấy nên gom/xoá gì.

## 2. Phạm vi

**Trong phạm vi — cả hai đường vào:**
1. **Yêu cầu tự do trong một session**: user gõ một câu ("sửa bug X", "review tài liệu Y", "cho tôi 3 ý kiến độc lập về Z", "viết lại section A của docs"). Agent đang chạy session (gọi là Lead) nhận và xử lý.
2. **Plan có sẵn**: một plan dạng AgentKit (`plans/<slug>/plan.md` + `phase-NN-*.md`), user nói "chạy phase 6".

Và cả hai trường hợp:
- **Không có FlowDefinition**: máy/Lead tự phân rã, tự chọn cách cộng tác.
- **Có FlowDefinition**: quy trình nghiệp vụ theo domain (finance/marketing/HR, hoặc các protocol cộng tác có sẵn) đã khai sẵn các bước.

Toàn bộ 6 tầng ở §5, kể cả tầng 1–2 (hiểu và phân rã yêu cầu).

**Ngoài phạm vi — Work item:** fgOS có một lớp **Work** (`fgos submit/pick/move`, stage, lifecycle, `domains/coding/workflows/feature.yaml`). Owner xác định: Work là **một lớp độc lập**, bản chất là **bản ghi chứa yêu cầu**, dùng để **quản lý công việc và giao tiếp với user**. Nó **không** phải cơ chế phân rã hay thực thi. Đừng thiết kế tiến trình dựa vào Work; nếu bạn thấy cần một điểm nối với Work, chỉ mô tả **giao diện** (Work đưa gì vào, nhận gì ra), không đi sâu.

## 3. Mục tiêu và tiêu chí đánh giá

Kết quả mong muốn: **đưa vào một yêu cầu bất kỳ → mỗi phần việc tự chạy bằng đúng executor, model/tier và persona theo khẩu vị owner cấu hình một lần**, không cần viết FlowDefinition hay request JSON riêng cho mỗi plan/yêu cầu.

Tiêu chí để chấm một phương án (dùng đúng các tiêu chí này ở phần D):
1. **Đơn giản**: số khái niệm người/agent phải hiểu; số nơi chứa khẩu vị; số đường thực thi song song.
2. **Linh hoạt**: thêm một domain mới, đổi khẩu vị, hoặc override một lần cho một yêu cầu — là việc **dữ liệu/config**, không phải code.
3. **Tường minh**: với một assignment bất kỳ, trả lời được "vì sao executor/tier/persona này" từ một bảng ưu tiên duy nhất (provenance).
4. **Đo được**: mọi lần chạy (inline lẫn dispatch) đi qua cửa mà component Observe đọc được.
5. **Chi phí chuyển đổi**: bao nhiêu code sửa/xoá; có chạy được theo từng bước nhỏ không.

## 4. Ràng buộc đã chốt (chỉ mở lại khi có bằng chứng mới, và phải nói rõ bằng chứng đó)

- **Thứ tự ưu tiên sản phẩm** (`AGENTS.md`): Ship Faster → Release con người (hệ thống tự phán đoán; chỉ hỏi người khi thật cần, gom câu hỏi thành bộ; câu hỏi treo không chặn phần việc khác) → DoD (kết quả tái kiểm được + tài liệu có bằng chứng) → Polish.
- **Sứ mệnh** (D-ADR0035): fgOS phục vụ **project khác** và **business workflow**. Tự phát triển fgOS chỉ là dogfood. Thiết kế phải chạy được cho domain không phải code.
- **RUL11** (`AGENTS.md`): việc trở nặng vì tùm lum, không vì bản chất lớn. Gom cho tới hết; quy mô không là lý do miễn trừ.
- **Single path, không backward compat**: fgOS hiện có một người dùng. Cái mới thay cái cũ thì xoá cái cũ trong cùng bước; không alias, không field legacy.
- **Node → Rust**: không xây hạ tầng mới bằng Node nếu tránh được. Nhưng dispatch/coordination hiện là Node và **chưa có lịch** chuyển sang Rust (`docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md` §4: writer migration `planned`). Sửa trong ranh giới file Node đã có là chấp nhận được. Observe đã là Rust hoàn toàn.
- **Mặc định inline**: không có executor cấu hình cho một capability thì Lead tự làm trong session (`core/skills/_shared/capability-matching.md`, Q0).
- **Plan không ghim hạ tầng**: plan không được khai executor/provider/model/tier (`src/report/capability-plan-lint.mjs` báo lỗi khi gặp).
- **Khẩu vị hiện tại của owner** (dùng làm dữ liệu mẫu, không phải thiết kế): viết tài liệu = openai `flagship`; review tài liệu = claude opus readonly; phản biện quyết định = claude opus; viết code/script = gemini; review code = claude opus, khác provider với người viết; research = gemini/xai `standard`. Không áp trần ngân sách. Cho phép song song, mỗi luồng ghi file một worktree.
- **Thang độ mạnh model đã chốt (2026-09-30), không thiết kế lại:** plan riêng `plans/260930-0445-tier-rigor-vocabulary-consolidation/` (nhánh `plan/260930-tier-rigor-consolidation`, chưa merge main; đọc bằng `git show plan/260930-tier-rigor-consolidation:plans/260930-0445-tier-rigor-vocabulary-consolidation/plan.md`). Tóm tắt:
  - bên cầu chỉ có `rigor` (`low|standard|high|critical`), thay `minTier` trên step; bên cung là `runner.rigorToTier` → `tier` → `modelPolicies[provider][tier]`;
  - xoá `minRigor`, `mode`, `QUALITY_TIER_BRIDGE`, `DEFAULT_TIER_TO_POLICY`, `runner.models`, `rigorOverrides`, `readOnlyRedirects`, PlacementPolicy shadow;
  - Work `tier` tách thành `size` (không bao giờ tới model) + `rigor`;
  - bước chỉ-đọc dùng invocation read-only (`readOnly: true` hoặc confinement) của **chính** executor đã chọn, không còn redirect.

  Fact sheet §6.4 bên dưới mô tả hiện trạng **trước** plan đó, chỉ để hiểu vì sao nó rối. Thiết kế của bạn coi hình dạng đích trên là cho sẵn, và chỉ bàn phần còn lại của tầng 5 (executor, invocation, persona, thứ tự ưu tiên, override).

## 5. Khung giả thuyết (được phép phá)

| Tầng | Câu hỏi của tầng | Đầu ra dự kiến |
|---|---|---|
| 1. Hiểu | Yêu cầu muốn gì, thuộc domain nào, có đủ rõ để làm chưa? | intent + domain (+ câu hỏi cho người nếu thật cần) |
| 2. Phân rã | Gồm những phần việc (unit) nào; phụ thuộc; phạm vi ghi file? | units + dependsOn + write scope |
| 3. Phân loại | Mỗi unit là loại việc gì, cần nghiêm ngặt tới đâu? | capability + rigor |
| 4. Chọn cách cộng tác | Unit cần một người làm, hay người làm + review, + phản biện, fan-out, panel? Có FlowDefinition thì đây là các bước của nó | pattern với các **vai** |
| 5. Binding | Vai nào do ai làm cụ thể? | executor / invocation / model(tier) / persona |
| 6. Chạy & đo | Thực thi ở đâu (inline / subagent / process ngoài / worktree), đo thế nào? | run + bằng chứng + Observe case |

Điểm then chốt cần làm rõ: FlowDefinition và "plan/yêu cầu không có FlowDefinition" **hội tụ ở tầng nào**, để từ đó trở xuống chỉ còn **một** đường.

## 6. Fact sheet hiện trạng (đã kiểm 2026-09-30 — hãy tự kiểm lại những gì bạn dựa vào)

### 6.1 Quy mô
Khoảng 59k dòng `src/runner/dispatch/**`, 21k dòng `src/runner/coordination` + `src/verbs/coordination`, 2k dòng `src/runner/definitions`. Tham chiếu so sánh: `thieung/herdr-cook-plan` làm việc tương tự bằng 1 skill + 1 script 151 dòng — xem `plans/reports/deep-comparison-260929-1446-harness-simplicity-herdr-cook-plan-vs-fgos.md`.

### 6.2 Tầng 1–3: hiểu, phân rã, phân loại
- **Doctrine Q0/Q1/Q2** (prose, agent tự làm tay): `core/skills/_shared/capability-matching.md`, `planning-capability-awareness.md`, `capability-catalog.md`, `executor-dispatch-fallback.md`.
  - Q0: inline hay dispatch (mặc định inline). Q1: agent khai `DemandFacts` (`outputKind`, `domain`, `mutates`, `behaviorPreserving`, `needsIndependentReview`, `hasPlanOrTrack`, `size`, `rigor`) rồi match với `serves` của capability → ra `capability` + `form` (`inline`/`protocol`/`facade`). Q2: `fgos dispatch decide --for <capability>` ngay trước khi chạy.
  - Code: `fgos capability match --demand <json>` (`bin/fgos.mjs` ~2358, `src/runner/capability-match.mjs`).
  - `rigor` hiện là "pass-through", không điều khiển tier.
- **Hiểu yêu cầu/phân loại domain**: skill `fgos-clarifying` (verdict-only, chạy trước khi tạo Work).
- **Unit trong plan**: `fgos plan-lint` đọc quy ước `- unit: <tên>` / `  capability: <tên>` trong **`plan.md`** (không đọc file phase) và bảng `## Product Gates`; báo lỗi nếu unit ghim `executor|provider|model|tier|prefer|invocation|actors` (`src/report/capability-plan-lint.mjs:13-22`). Hiện không plan đang chạy nào dùng quy ước này.
- **Capability registry**: `.fgos/config.json` `runner.capabilities` có `advise`, `execute`, `review`, `code:implement|review|test|debug|refactor`, `impact-analysis`, `pane-labeling`, `fgos-coding-implement`… Mỗi entry có thể có `prefer` (executor + invocation), `serves`, `confinement`, `providerModel`, `rigorOverrides`. Đăng ký/doctor ở `src/setup/registrations.mjs`.
- Điều kiện tách capability domain mới (vd `docs:*`): có override lặp lại, **hoặc** project có executor riêng cho domain đó (`capability-matching.md`).

### 6.3 Tầng 4: cách cộng tác
- **FlowDefinition / CoordinationProtocol**: nạp 3 tầng core/domain/project (`src/runner/definitions/protocol-loader.mjs`), validate ở `src/runner/definitions/schema.mjs` (`validateFlowDefinition`). 13 protocol ở `core/coordination-protocols/`. Chỉ `standalone-master-coordination-loop.yaml` có bước ghi file (doer → reviewer + red-team → fixer → recheck) và nó **ghim** `capability: code:implement / code:review`. Các protocol còn lại chỉ đọc (consult, rfc review, delphi, nominal group, research fan-out, architecture panel…).
- **Mỗi step của FlowDefinition khai được gì** (`POLICY_PATCH_FIELDS`, `schema.mjs:145`; `ACTOR_FIELDS`, `schema.mjs:118`), ở 4 tầng definition → operation → role → actor:
  - `capability` (loại việc), `minTier` (sàn, chỉ nâng — `schema.mjs:268`), `persona` (actor) / `preferPersona`, `distinctProviderFrom` (khác provider với vai khác), `visibility`, `repeatMode`, `fallbackExecutors`.
  - `preferExecutor`/`preferInvocation`: **schema cho qua nhưng runtime chặn** ở mọi tầng portable (`session-engine.mjs:931-942`, `assertNoPortableExecutorPin`); chỉ tầng `assignment`/`cli` được ghim. `fallbackExecutors` không bị guard này kiểm.
  - Model cụ thể: **cấm** (`assignment-policy.mjs:243`).
  - Tóm lại: FlowDefinition khai **yêu cầu về người làm** (loại việc, sàn năng lực, persona, ràng buộc độc lập), không khai **người cụ thể**.
- **"Slot" capability đã có một nửa**: `deriveOperationCapability` (`src/verbs/coordination/binding.mjs:89`): operation không khai `policy.capability` thì `result.kind: work-product` → `facts.primaryCapability`; advisory/gate → `<facts.domain>:review` nếu đã đăng ký, không thì `review`. Nhưng: `coordination start` không có cờ CLI truyền `facts`; `facts` không lưu vào manifest nên các action sau node đầu (`src/verbs/coordination/actions.mjs:208`) gọi composer **không có** `facts`.
- **Hai loại request coordination**: `agent-led` (chỉ role chỉ-đọc `reviewer/researcher/advisor`, một lượt) và `declared-protocol` (`src/verbs/coordination/schema.mjs`). Request có DAG (`dag: true` + `dependsOn`, `src/verbs/coordination/dag-scheduler.mjs`); ghi file song song cần worktree riêng vì dispatch khoá theo cwd.
- **Facade** duy nhất là skill `fgos-code-change` (`domains/coding/skills/fgos-code-change/SKILL.md`): "a single change is a plan with one cell"; có plan mode (đọc `plan.md` qua `plan-lint`), mở worktree, chạy master loop, tối đa 3 vòng sửa, merge. Gate chỉ nhận `code:implement`/`code:refactor`. Hai skill cũ `fgos-code-panel`, `fgos-plan-loop` đã deprecated nhưng vẫn còn.
- Skill `fgos-panel` định tuyến yêu cầu "cho ý kiến/review/so sánh/red-team" sang protocol group-thinking có sẵn.
- **Domain workflow** (thuộc lớp Work, ngoài phạm vi, chỉ để biết): `domains/coding/workflows/feature.yaml` khai stage → operations với `role`, `reason`, `dispatch: human-only`… — một cấu trúc "các bước" thứ hai, khác FlowDefinition.

### 6.4 Tầng 5: binding (chọn người làm) — hiện trạng trước plan tier/rigor (xem §4)
- **Thứ tự hiện tại cho executor** [fact, gom từ nhiều file]:
  1. cờ CLI `--executor` (đè mọi binding tính toán — `composers.mjs` `withComputedActorBindings`);
  2. `actors[].executor` trong request của Lead;
  3. `policy.capability` của operation → `runner.capabilities.<cap>.prefer` (`binding.mjs`, dùng `resolveExecutorAndOverrides` ở `src/runner/dispatch/resolve.mjs:256`);
  4. `opPolicy.preferExecutor` (bị chặn ở tầng portable) → `runner.executor.command` → `'claude'` (`assignment-policy.mjs` ~288);
  5. sau đó `runner.placementPolicy.readOnlyRedirects` **đổi executor** cho bước chỉ-đọc nếu request không ghim `invocation` tường minh (`src/runner/dispatch/assignment-runner.mjs` `hasExplicitInvocationPin`). Config hiện tại: claude → openai `codex-cli-bwrap` cho `review-candidate`/`red-team-candidate`. Hệ quả thật: "opus review" bị đổi lặng lẽ sang openai.
  6. governance (`disallowedProviders/Executors`) có quyền phủ quyết cuối.
- `distinctProviderFrom` được giải trong cùng lượt binding (`binding.mjs`), chỉ so với vai đã bind trước theo thứ tự node.
- **Tier/model — các bộ từ vựng đang cùng tồn tại** [fact]:
  - `size`/Work `TIERS`: `light|standard|heavy` (`src/state/work.mjs:168`); `runner.models` legacy cũng `light|standard|heavy` → haiku/sonnet/opus.
  - `MODEL_POLICY_TIERS` = `MIN_TIER_VALUES`: `nano|mini|standard|advanced|flagship|frontier` (`dispatch/config.mjs:520`, `definitions/schema.mjs:29`); `runner.modelPolicies.<provider>.<tier>` → model (vd claude: flagship=opus, frontier=fable).
  - `DEFAULT_TIER_TO_POLICY`: light→nano, standard→standard, heavy→frontier (`config.mjs:525`).
  - `rigor`/`minRigor`: `low|standard|high|critical`; `mode`: `balanced|creative|analytical|adversarial`; `QUALITY_TIER_BRIDGE` tier → {minRigor, mode} (`assignment-policy.mjs:47-73`). `minRigor` hiện chỉ-đọc, suy ra từ tier.
  - `rigorOverrides` theo executor/capability đổi khoá tra `modelPolicies`; `providerModel` chọn bảng provider.
  - Comment trong `resolve.mjs` còn nhắc một bộ từ vựng cũ khác (`lightweight|standard|creative|analytical|critical`).
  - Tier cuối = merge chỉ-nâng qua các scope (runner/definition/operation/role/actor/assignment/cli).
- **Persona**: chỉ là **một cái tên** chèn vào prompt ("You are acting under the resolved persona …", `src/runner/dispatch/assignment.mjs:739-765`). Có file `core/agents/*.yaml` (`code-reviewer`, `docs-manager`, `researcher`, `planner`…) nhưng chưa xác nhận nội dung của chúng có được nạp vào prompt ở đường này không. `implied-by-persona` (persona suy ra mode) "chưa có producer".
- Khẩu vị hiện nằm ở ít nhất 4 nơi: `minTier` trong YAML protocol; `capabilities.<cap>.prefer/rigorOverrides/providerModel` trong config; `readOnlyRedirects` trong config; persona trong YAML hoặc roster request.

### 6.5 Tầng 6: chạy và đo
- `fgos dispatch decide` trả `mechanism`: `unavailable` (tự làm inline), `in-process` (Lead dùng Agent/Task tool của chính mình hoặc gọi MCP tool), `out-of-process` (`fgos dispatch execute`). Hook `PreToolUse` ép mọi Agent/Task call phải qua `decide` (`AGENTS.md` § Dispatch).
- Hai cửa ghi file ngoài protocol: `execute <executor>` dạng thường ghi `.fgos/dispatch-runs/` (`src/runner/dispatch/cli.mjs` `openDispatchRun`) — **Observe không đọc**; cửa execution-contract từ chối `mutation: 'mutating'` (`src/runner/dispatch/execution-contract.mjs`). Nên hiện không có đường chuẩn cho **một** unit ghi file đơn lẻ mà Observe thấy được; ghi file hợp lệ chỉ qua protocol.
- Observe (Rust, `packages/observe/rust/src/sources/`, spec `docs/specs/observe.md`) đọc assignment run và coordination session, kể cả transcript của worktree ngoài `.claude/worktrees`.
- Assignment id được claim nguyên tử đa process (`src/runner/dispatch/assignment.mjs` `claimAssignmentId`).
- Chỉ một chỗ còn mặc định code khi chạy: `assignment-runner.mjs:2378` `capability: compiledPlan.capability || 'code:implement'`.

### 6.6 Bằng chứng từ một lần chạy thật (plan tài liệu, phase cũ chạy qua master loop)
6 session coordination: reviewer cùng provider với người làm (gemini) chỉ đóng dấu cho qua trong 1–3 phút; red-team (xai) tìm ra finding gần như mỗi vòng nhưng bị ghi `status: failed`; 3 vòng tốn ~10 run và ~150 phút worker; không session nào được đóng. Đây là loại thất bại thiết kế mới phải tránh.

### 6.7 Tài liệu nền nên đọc (theo thứ tự)
1. `plans/reports/advice-260930-1002-harness-flexibility-plan-agnostic-routing.md` (năm mối nối gãy S1–S5, mô hình đích nháp, việc cần xây B1–B8).
2. `core/skills/_shared/capability-matching.md`, `planning-capability-awareness.md`.
3. `core/coordination-protocols/standalone-master-coordination-loop.yaml`.
4. `src/verbs/coordination/binding.mjs`, `src/runner/dispatch/assignment-policy.mjs` (khoảng 230–400), `src/runner/dispatch/resolve.mjs` (khoảng 190–300).
5. `domains/coding/skills/fgos-code-change/SKILL.md`.
6. `plans/reports/deep-comparison-260929-1446-harness-simplicity-herdr-cook-plan-vs-fgos.md`.

## 7. Kịch bản thử (dùng để trace ở phần B và C)

| # | Yêu cầu | Đặc điểm cần kiểm |
|---|---|---|
| K1 | Trong session: "sửa bug null ở `src/foo.mjs`, có test" | ad-hoc, ghi file, cần review độc lập khác provider |
| K2 | Trong session: "đọc `docs/specs/observe.md` và cho biết chỗ nào mâu thuẫn với code" | chỉ đọc, một lượt, có thể inline |
| K3 | "Chạy phase 6 của `plans/260925-documentation-authority-unification/`": chuyển đổi ~15 area tài liệu, mỗi area một worktree, song song; mỗi area cần người viết (openai) + reviewer (opus) + ledger chỉ một người ghi | plan có sẵn, mutating song song, domain docs, có ràng buộc riêng của plan |
| K4 | "Cho tôi 3 ý kiến độc lập về việc nên dùng SQLite hay JSONL cho X, rồi tổng hợp" | panel, chỉ đọc, cần khác provider |
| K5 | Quy trình marketing có FlowDefinition sẵn: brief → viết nội dung → review brand → duyệt của người → xuất bản | có FlowDefinition, domain không phải code, có bước human-only |
| K6 | Như K1 nhưng user thêm: "lần này review bằng gpt thay vì opus" | override một lần, không đổi khẩu vị gốc |

## 8. Nhiệm vụ

### A. Phân rã hiện trạng
Với **K1, K3, K5**: trace tiến trình **hiện tại** qua 6 tầng. Mỗi tầng ghi: ai quyết (agent đọc prose / code / config / người), đầu vào, đầu ra, file:line, và **chỗ gãy hoặc phải làm tay**. Cuối phần, lập bảng **đếm khái niệm**: mỗi khái niệm/field/bộ từ vựng liên quan tới 6 tầng, nó ở đâu, có trùng nghĩa với khái niệm khác không.

### B. Thiết kế từ đầu (clean-sheet)
Quên code hiện tại. Thiết kế tiến trình yêu cầu → chạy với **số khái niệm ít nhất** đáp ứng §3–§4 và đủ cho K1–K6. Bắt buộc có:
1. **Hợp đồng dữ liệu giữa các tầng** (unit trông như thế nào; pattern/vai trông như thế nào; binding đọc gì, trả gì). Viết dạng schema ngắn hoặc ví dụ YAML/JSON.
2. **Ai làm tầng nào**: agent (LLM phán đoán) hay máy (code tất định). Nêu lý do cho từng tầng.
3. **Điểm hội tụ** giữa "có FlowDefinition" và "không có FlowDefinition".
4. **Một bảng ưu tiên duy nhất** cho executor / invocation / tier / persona, gồm override một lần (K6) và ràng buộc độc lập (khác provider).
5. **Tier/rigor**: dùng hình dạng đã chốt ở §4 (rigor → rigorToTier → tier → modelPolicies). Chỉ nêu nếu bạn thấy nó xung đột với thiết kế của mình, kèm bằng chứng.
6. **Ngữ nghĩa persona**: nó là gì, ai khai, ảnh hưởng tới cái gì (prompt, tier, executor?).
7. Chạy inline vs dispatch vs song song + worktree, và cách mọi đường đều để Observe đo được.
8. Chỗ duy nhất nối với Work (nếu cần) — chỉ giao diện.
Trace **K1–K6** qua thiết kế của bạn (mỗi kịch bản vài dòng).

### C. Đối chiếu
Bảng: mỗi khái niệm/cơ chế ở B ↔ cái tương ứng hiện có (giữ nguyên / đổi tên / gom / xoá / thiếu phải xây). Chỉ rõ những gì **đã có sẵn gần đúng** (vd `deriveOperationCapability`, `plan-lint` unit, `fgos-code-change`) để tránh xây lại.

### D. Đề xuất và lộ trình
- Chấm B (và nếu bạn muốn, một phương án thứ hai) theo 5 tiêu chí ở §3.
- Lộ trình theo bước nhỏ, mỗi bước: giao được gì, xoá được gì, rủi ro. Bước đầu tiên phải đủ để chạy K3 (use case đang bị kẹt).
- Nêu rõ những gì **không nên làm**.

### E. Tự phản biện
Ba lý do mạnh nhất khiến đề xuất của bạn có thể sai hoặc thất bại khi chạy thật, và cách phát hiện sớm từng lý do.

### Các câu hỏi cụ thể phải trả lời (ngắn gọn, có lập trường)
1. Phân rã (tầng 2) nên do agent làm bằng phán đoán, hay có phần tất định? Plan AgentKit và yêu cầu tự do có nên sinh ra **cùng một** dạng unit không?
2. Unit nên khai `capability` trực tiếp, hay khai `DemandFacts` để máy suy ra capability? Có cần cả hai không?
3. Chọn pattern cộng tác (tầng 4) là việc của máy (quy tắc từ facts), của agent, hay của config?
4. FlowDefinition nên chứa những gì và **không** chứa gì? `minTier` và `persona` là yêu cầu của bước hay khẩu vị của owner?
5. Có nên gộp các protocol hiện có thành một thư viện pattern nhỏ với vai là slot không? Nếu có, bao nhiêu pattern là đủ?
6. (Đã chốt ở §4: `readOnlyRedirects` bị xoá.) Thay vào đó: persona có nên là khẩu vị trong config hay yêu cầu trên step, và nó ảnh hưởng tới những gì?
7. Có cần tách capability theo domain (`docs:*`) không, hay `execute`/`review` + `domain` là đủ để binding?
8. Làm sao để một unit ghi file đơn lẻ (không review) vẫn chạy qua cửa Observe đọc được, mà không sinh đường thứ hai?
9. Đâu là tập khái niệm nên **xoá** trước tiên để giảm tùm lum nhiều nhất với chi phí nhỏ nhất?

## 9. Mẫu trả lời (giữ đúng thứ tự heading để người tổng hợp so được)

```markdown
# Trả lời: <tên agent/model>

## Tóm tắt lập trường (≤ 8 dòng)
## A. Hiện trạng (trace K1, K3, K5 + bảng đếm khái niệm)
## B. Thiết kế clean-sheet (hợp đồng dữ liệu, ai làm tầng nào, điểm hội tụ, bảng ưu tiên, tier, persona, chạy/đo, giao diện Work, trace K1–K6)
## C. Đối chiếu với hiện tại
## D. Chấm điểm, lộ trình, không nên làm
## E. Tự phản biện
## Trả lời 9 câu hỏi cụ thể
## Chỗ fact sheet §6 sai hoặc thiếu (nếu có)
## Câu hỏi còn mở cho owner
```

Nếu bạn có quyền ghi file, lưu câu trả lời vào `plans/reports/brainstorm-response-260930-<tên-agent>-request-to-run.md`. Nếu không, trả lời trực tiếp.
