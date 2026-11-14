# Platform Vision

```txt
Document type: Platform vision
Audience: Human reviewer, architect, maintainer, agent
Purpose: State the whole-platform mission, direction, and non-scope for fgOS
Design status: Accepted at atomic cutover
Implementation status: Partial
Canonical: Yes
Owner: Platform documentation
Source type: Promoted anchor from platform foundations, work-item lifecycle vision, and mission decisions
Last reviewed: 2026-09-13
Related:
- docs/platform/README.md
- docs/platform/platform-foundations.md
- Source coordinate (provenance only; not a reader destination): `docs/work-item-lifecycle-vision.md` at `23fb220e309f82998a62ae4e62727bc405515035`
- docs/platform/platform-foundations.md
Implementation: Partial; carried source truth not certified
Provenance: docs/work-item-lifecycle-vision.md at f0efa3330a14d117ad89feba91bdb9b61d768339
Writer type: Agent draft writer
Canonical for: The document scope stated above; source implementation limits remain explicit
Use this when: Reading the scope, contracts and implementation limits stated here
Do not use this for: Proof that dated claims are currently implemented
Supersedes: None; source carriage with explicit implementation limits
Superseded by: None
```

## 1. Purpose

fgOS exists to make agent applications and business-base workflows faster, safer, more reusable, and less dependent on a human sitting in the loop.

This document is the whole-platform north star. Area visions, such as `docs/platform/packaging-distribution/vision.md`, should align with it.

The companion [intent-preservation-ledger.md](intent-preservation-ledger.md)
tracks parts of this direction that are only partially implemented or
deliberately deferred. A simplified implementation slice does not shrink this
vision unless an explicit decision says so.

## 2. Mission

fgOS exists to:

- develop other projects;
- run business-base workflows;
- provide reusable platform infrastructure for agent applications.

fgOS does not exist primarily to develop itself. Dogfooding inside this repo is necessary, but it is not the mission.

## 3. Product Priority

When trade-offs collide, use this order:

1. Ship faster for projects using fgOS.
2. Release humans from waiting, babysitting, and repetitive coordination.
3. Produce reproducibly verifiable results with evidence-linked documentation.
4. Polish after the definition of done is satisfied.

Lower priorities do not override higher priorities.

## 4. Operating Shape

The platform direction is:

```txt
human intent
  -> durable work/state
  -> domain-aware shaping and planning
  -> governed agent execution
  -> verifiable result
  -> retained learning
```

Humans should stay present for judgment, review, and direction. They should not need to manually preserve every useful design point or monitor every execution step.

## 5. Design Commitments

- Keep boundaries clear: component ownership, contract authority, and state writes must be explicit.
- Keep docs useful to humans: reading paths, implementation status, proof, and related links are part of system quality.
- Prefer extensible registries and contracts over hidden one-off behavior.
- Treat generated docs as projections, not new authority.
- Keep work restartable by a stranger agent with no chat history.

## 6. Layer Direction: Execution, Workflow, Domain

Status: direction, not a locked law and not proof of current code. Owner
direction (2026-11-14), restating a view the owner has given before; the
earlier statements are linked below rather than copied.

1. **Three layers.**
   - **Execution** runs one Unit reliably.
   - **Workflow** coordinates many Units.
   - **Domain** holds each field's doctrine and its business cases.
2. **A Unit is one atomically settled piece of work, and Workflow has only
   generic coordination mechanisms, never a specific business case.** A Unit
   has one write scope, one worktree custody, one outcome and one commit.
   Inside it, one or more seats coordinate through one of four loops: solo (one
   seat, the default), reviewed, panel, debate. Seats in parallel or in series
   and back-and-forth review loops inside a Unit belong to Execution, as
   D-ADR0073 in the [Workflow spec](workflow/spec.md) fixes. Workflow owns
   coordination across Units: fan-out/fan-in; quorum over Units; loop-until;
   parallel ready steps (they run serially today); an independence guard across
   Units; an arbiter that settles and keeps dissent; gates and human stops;
   resume after interruption; retry on infrastructure faults; passing one
   step's result into the next; budgets and round limits. Workflow is the
   skeleton that lets the soul (the agent) run a flow reliably, precisely and
   flexibly, without boxing it in.
3. **Business cases live in Domain.** A coding flow, a council, a marketing
   flow and a financial flow are each a composition of Workflow mechanisms plus
   the field's doctrine. With every coordination mechanism already in
   Workflow, a council in the Domain layer becomes very easy, ready to use, and
   stable.
4. **Execution is the foundation.** If Execution is solid, an agent can
   already build and run its own council, workflow-style. Workflow adds
   reliability on top, but it must not bloat.
5. **Work is not a foundation layer.** Work (lifecycle, human touch points,
   per-domain apps) sits above Domain and reads Domain only as data. Address
   it only when needed. This layer direction supersedes the older "Work as a
   shared spine" reading in the base-lifecycle vision further down this file,
   which is left as written.
6. **Placement test.** If a change in Workflow names or encodes a specific
   business case (council-lite, architecture-advisory, coding, marketing, and
   so on), it is in the wrong layer and belongs in Domain. If it is a
   coordination mechanism several cases can share, it belongs in Workflow.
   `panel` is the name of a mechanism (fan-out to independent seats, then a
   synthesizer), not a business case.
7. **Gates and human stops split by mechanism and policy.** Workflow owns the
   mechanism: gate modes consent and input, the parked state, the answer verb,
   the human-consent guard, the question record, and the decision-question
   shape checker. Work and Domain own the policy: gate-bypass (when a question
   may be skipped), batching questions into one ask, and presentation. Work's
   `awaiting-human` state folds into the Workflow park at the coding cutover,
   leaving one park. This reconciles the 2026-11-09 Work vision, whose gate
   items are policy and presentation, with this direction.
8. **Order.** The coding cutover comes first, then the cross-Unit Workflow
   mechanisms. The hard-independent panel arbiter can land at any time.

Where this direction is already stated or applied:

| Need | Read |
| --- | --- |
| Layer names, and which layer owns which decision at the Execution to Workflow boundary | [Unit Run Result Contract, section 1](runner/contracts/unit-run-result.md#1-layers-and-who-decides-what) |
| Hard outside, soft inside: the skeleton and the soul | [System Vision: Trong Mem Ngoai Cung](system-architecture/architecture/system-vision-trong-mem-ngoai-cung.md) |
| Workflow vocabulary: workflow, case, unit, loop, pattern, seat | [Workflow spec](workflow/spec.md) |
| Domain doctrine placement | [Domainization](domainization/architecture/domainization.md) |
| Code tiers and the import rule that enforces them | `docs/architecture-manifest.json` (`tierNames`, `tiers`), checked by `test/architecture.test.mjs` |

Known gaps against this direction:

- The code tiers in `docs/architecture-manifest.json` put Work lifecycle at
  tier 7 and Skill and Domain at tier 8, so Domain sits above Work. Point 5
  places Work above Domain. The tier change goes with the coding cutover,
  because until then Work's step machine drives coding's progress. This is an
  open gap, not a decision.
- The same manifest also has a `layers` list (`entry`, `use-case`, `infra`,
  `domain`, `kernel`), the per-file ranks of its one-directional import rule.
  Its `domain` rank does not mean the Domain layer above.
- Business names have leaked into generic code and must move to Domain: the
  hardcoded research-fan-out branch in `src/runner/execution/seat-resolver.mjs`,
  the code-change and rfc recipes in the generic catalog, and council names in
  error and help text.
- The decision-question shape checker lives in `src/state/decision-question.mjs`
  and moves down to the Workflow layer later.
- Question batching (point 7) has no code yet.
- The hard-independent panel arbiter is a small parameter change from
  `preferIndependentOf` to `independentOf` in
  `src/runner/execution/loops/panel.mjs`. Today independence is a soft
  preference.
- The councils in `core/workflows` move into a named domain.
- Capability rows, decided by the owner on 2026-11-14 in two steps. First,
  every reader of `runner.capabilities` goes through `bind()` or its result;
  today about 27 files under `src/` read the config directly. The config does
  not change in this step. Second, the 37 business-named rows in
  `core/config-standard/runner.yaml` go away and travel with the councils'
  move. What remains is the real tool abilities (such as `impact-analysis`) and
  the generic jobs `execute`, `review` and `advise`. A workflow step declares
  the tier and rigor it needs, and a project with no capability rows still
  runs. A project still customizes through `modelPolicies`, `tierFallback`, a
  per-persona and per-role table, and an optional row that overrides one job.
  Each kind of customization has exactly one place. Persona files still carry
  no model fields (D-ADR0072). The family of the agent that is currently
  running never changes the order, because the config is the only authority
  over it.

## 7. Related Anchors

| Need | Read |
| --- | --- |
| Preserved platform intent | [intent-preservation-ledger.md](intent-preservation-ledger.md) |
| Platform laws | [platform-foundations.md](platform-foundations.md) |
| Whole-system architecture | [architecture-map.md](architecture-map.md) |
| Component authority map | [component-boundary.md](component-boundary.md) |
| Documentation governance | [governance.md](governance.md) |
| Exclusive binding law text, rationale, sources and review thresholds | [platform-foundations.md](platform-foundations.md) |


## Chu trình Work-Item của fgOS — tầm nhìn nền tảng

```txt
Legacy status: Historical vision source retained with current navigation adapted
Promoted target entry: docs/platform/vision.md
Potential future area: docs/platform/work-state/ or docs/platform/work-lifecycle/
Use this legacy file for: Original work-item lifecycle direction and unresolved questions
Do not use this legacy file for: Current canonical platform navigation
Last reviewed: 2026-09-13
```

**Trạng thái:** TẦM NHÌN / ĐỊNH HƯỚNG — chưa khoá thành luật (platform-foundations) hay spec;
còn câu hỏi mở. **Ngày:** 2026-07-15. Nguồn: định hướng của chủ sản phẩm.

Tài liệu này ghi lại chu trình sống của một work-item để không mất, và làm khung cho các PBI
kế tiếp. Nó chưa phải hợp đồng thi hành — mọi bước chưa dựng đều là backlog.

### 1. Ý tưởng cốt lõi

fgOS **không phải** "runner headless không người". Nó là **pipeline bán-tự-động
(mixed-autonomy)**: tự động là mặc định, người xen vào ở những **cổng (gate) có điều kiện**, và
mức độ người-tham-gia **thay đổi theo giai đoạn** của work-item — không cố định.

Khác biệt cốt tử với bee: **bee chặn phiên chat ở mỗi gate**; fgOS biến gate thành **checkpoint
bất đồng bộ** mà hệ *đậu lại (park) và chờ người quay lại* — tuỳ chế độ intake. Người không phải
lúc nào cũng ngồi đợi.

### 2. Chu trình chung nền tảng (base workflow)

Mọi loại công việc chia sẻ MỘT chu trình xương sống; mỗi domain (coding, marketing, HR,
finance…) **kế thừa base và thêm stage riêng**:

1. **Init / Intake** — tiếp nhận vấn đề vào hệ thống.
2. **Làm rõ (Clarify)** — phân loại, khám phá ngữ cảnh, và (nếu cần) exploring cùng người.
3. **Chia việc (Divide)** — làm giàu ngữ cảnh + planning thành các item nhỏ độc lập, dependency
   rõ, đẩy vào queue.
4. **Thực thi (Execute)** — runner tự làm từng item; tạo PR; người review; hệ tự merge.
5. **Compound-learning** — học từ chính vận hành.

Domain **coding** thêm: context-discovery, PR lifecycle. Marketing/HR/finance sẽ thêm stage của
họ trên cùng base này. **Một base — nhiều domain-extension.**

### 3. Hai chế độ Intake

- **(a) Submit rồi rời đi (un-attended):** người nộp vấn đề rồi bỏ đi. Hệ ghi nhận + tự phân
  loại; các bước sau **đậu lại ở cổng-người khi cần và chờ người quay lại** (bất đồng bộ), không
  chặn một phiên sống.
- **(b) Submit và xử lý ngay (collaborate-now):** người nộp và muốn làm cùng; hệ tiếp tục
  tương tác để triển khai các bước, dừng ở cổng-người theo thời gian thực.

### 4. Chu trình coding (cụ thể hoá base cho coding)

1. Người đưa vấn đề vào (**intake**) — 2 chế độ (a)/(b).
2. Hệ **ghi nhận một work-item** và phân loại như thường.
3. Runner sơ khởi chạy **phân loại + context-discovery** (bước khởi đầu).
4. Task đơn giản, thuần, không phức tạp → mark **`ready`**; một runner khác pick để xử lý.
5. Task **chưa rõ + phức tạp**, cần định hướng cùng người → chuyển trạng thái **`need-exploring`**.
6. Kích hoạt bước **exploring** (giống bee).
7. Chốt xong → hệ tự **làm giàu context + planning** thành **n item nhỏ độc lập**, dependency rõ,
   chia nhỏ và đẩy vào **queue**. *(Câu hỏi mở: bước này chạy runner không-người-đợi, hay cần
   người ngồi đợi — xem §7.)*
8. Hệ tự **giải quyết các item** bằng runner.
9. **Tạo PR**.
10. **Người review PR** (cổng-người).
11. Hệ **tự merge PR**.

### 5. Bản đồ người-tham-gia (human-involvement map)

| Giai đoạn | Người tham gia? |
|---|---|
| 1 Intake / submit | **NGƯỜI** khởi tạo (2 chế độ) |
| 2 Ghi nhận + phân loại | Tự động |
| 3 Phân loại + context-discovery | Tự động (runner sơ khởi) |
| 4 Simple → `ready` → pick | Tự động |
| 5 Unclear → `need-exploring` | Tự động chuyển trạng thái |
| 6 Exploring | **NGƯỜI** (hoặc hoãn tới khi người quay lại nếu chế độ (a)) |
| 7 Enrich + planning → queue | Tự động — *có thể* cần **NGƯỜI** (câu hỏi mở) |
| 8 Execute item nhỏ | Tự động (runner) |
| 9 Tạo PR | Tự động |
| 10 Review PR | **NGƯỜI** (cổng) |
| 11 Merge PR | Tự động |

### 6. Ánh xạ Phase 1/2/3 hiện có vào chu trình

- **Phase 1 (state-layer)** + **Phase 2 (routing/runner)** = nền của stage **Thực thi**
  (work-state FSM, frontier, runner loop, recovery matrix).
- **Phase 3 (compound-learning)** = stage **Compound-learning**.
- **Chưa có (là backlog):** Intake (1-2), context-discovery + `need-exploring` + exploring
  trong-sản-phẩm (3,5,6), auto planning→queue (7), PR lifecycle (9-11), và mô hình
  base-workflow / domain-extension.

### 7. Câu hỏi mở (chưa quyết — cần chốt khi tới stage tương ứng)

1. **Bước 7 (planning) có cần người đợi không?** Một mặt exploring nên giải quyết hết khúc mắc;
   mặt khác chính lúc planning mới lộ khúc mắc → có thể cần một cổng-người ở đây. Chưa ngã ngũ.
2. **Workspace thực thi (bước 8-9):** mỗi item nhỏ một git worktree riêng, hay nhiều item chung
   một worktree?
3. **Độ hạt PR (bước 9):** mỗi item nhỏ một PR, hay gom mọi item nhỏ của một
   human-submitted-item thành một PR?

### 8. Ảnh hưởng tới "capture 2 kênh" (Phase 3 slice 2)

Chu trình này giải toả điểm mờ của slice 2: **capture bám vào các chuyển-trạng-thái của FSM
lifecycle, không phải "lượt chat"** — đúng thứ Phase 1/2 đã dựng.

- **Settlement (kênh 1)** = ghi tại các transition **ngã-ngũ**: quyết định lock ở exploring (6),
  PR duyệt (10), và các auto-transition. **Actor thay đổi theo stage** (người ở cổng, runner ở
  bước tự động). Dạng đầy đủ **chờ các stage này được dựng**; hiện chỉ có transition của
  work-state FSM (todo/doing/proposed/blocked/done).
- **Friction (kênh 2)** = ghi tại transition **thất bại** của bất kỳ bước tự động nào (execute,
  discovery…), runner **tự quy tội**. **Làm được ngay** — nhánh fail đã tồn tại (park/halt).

→ Củng cố hướng: slice 2 làm **friction trước** (độc lập, cần thật, không phụ thuộc stage chưa
dựng); settlement dạng đầy đủ theo sau khi các stage lifecycle (exploring/PR) được dựng.
