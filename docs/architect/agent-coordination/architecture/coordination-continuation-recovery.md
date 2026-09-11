---
area: agent-coordination-runtime
updated: 2026-09-11
coverage: proposed
---

# Design: CoordinationSession Continuation And Recovery Planner

> **Trạng thái:** PROPOSED. Tài liệu này thiết kế một planner cho việc resume,
> recover, mở continuation session, và chọn bước còn thiếu của một
> `CoordinationSession`. Chưa coi là implemented cho tới khi có module planner,
> request builder, show/recover surface, và test/probe tương ứng.
>
> **Nguồn vận hành:** code-panel dogfood P04-P14 gặp các lỗi lặp lại:
> `partialPolicy` phải khai báo đúng từ request đầu tiên, authorization slot bị
> poisoned khi authorize lại cùng `(actor, operation, node)`, `wallTimeMs` tính
> từ lúc mở session chứ không phải từ round hiện tại, CLI cha chết nhưng outbox
> đã có result, và session sống qua nhiều lần phục hồi thì hết hard budget giữa
> chừng.
>
> **Kết luận ngắn:** planner này quyết định **tiếp tục session thế nào**. Nó
> không quyết định **chạy bằng executor nào**.

## Review thiết kế 2026-09-11 — phạm vi và trạng thái

Định hướng đã được người dùng xác nhận: contract đầy đủ, simple, clean,
hexagonal và SRP; default implementation có thể tối giản và bổ sung sau.
Toàn bộ Agent Coordination có kế hoạch chuyển sang Rust. Thiết kế đích độc lập
ngôn ngữ/runtime; Rust là đích triển khai thực tế. Các đường dẫn `.mjs`, chữ ký
TypeScript, import rule và file-store layout bên dưới là minh họa ban đầu,
không ràng buộc module/crate/process hay storage của implementation mới.

**Hướng kiến trúc đã được người dùng chấp thuận sau các vòng review ngày
2026-09-11; schema v1 và protocol chi tiết chưa chốt.** Các nguyên tắc và ranh
giới trong phần tổng hợp này có ưu tiên hơn ví dụ/schema ban đầu bên dưới.
Các mục cần đặc tả là công việc hoàn thiện contract theo hướng đã chốt, không
phải tuyên bố implementation hoặc migration đã hoàn tất.

Nguyên tắc trung tâm: sự cố quan sát không tự sinh thêm quyền thực thi. Mọi
attempt mới cần admission hợp lệ; bảo đảm chống lặp phải chỉ rõ đang bảo vệ
control, result hay effect. Thiết kế bảo vệ việc thực hiện một ý định nghiệp vụ;
Run là một attempt thực hiện ý định ấy.

Chốt domain semantics và application ports trước; chỉ chuẩn hóa wire/persistence
schema ở boundary cần trao đổi hoặc lưu lâu dài, không ép interface nội bộ thành
JSON/RPC. Rust enum/trait có thể biểu đạt state và port; ownership trong process
không thay thế idempotency/fencing/recovery xuyên process.

Trong giai đoạn Node/Rust coexistence, cần version compatibility, state ownership,
control ownership và quy tắc handover; tại mỗi scope chỉ một writer/controller
có quyền thực thi. Reader không hiểu version phải từ chối rõ, không tự reinterpret.
Không mặc định cả hai runtime cùng ghi state hoặc cùng điều khiển một Run.

### Boundary đã thống nhất và yêu cầu hoàn thiện contract

- Application service thu thập snapshot qua read ports; pure planner nhận
  snapshot + clock + effective policy và trả typed action. Request builder/CLI
  adapter render action thành request/command; command handler revalidate và
  ghi qua authority hiện có. Không nhân bản graph/quorum rules trong planner.
- Action dùng discriminated union, payload bắt buộc theo kind, stable reason
  code và preconditions. `decision` với optional `nextAction` hiện tại cho phép
  tổ hợp không thực thi được. `confidence: probable` không thay preconditions.
- Plan gắn snapshot revision, policy/flow version và idempotency key. Apply
  kiểm lại revision, result mới đến, run đang sống, authorization và budget;
  stale plan phải replan/refuse, không thực thi mù. Engine giữ gate cuối.
- Continuation cần lineage, flow/version, policy provenance, context transfer
  manifest và authority/budget provenance. Context chỉ được mang sang sau khi
  validate ownership/visibility; không tự kế thừa authorization/quorum credit.
- Chốt ai được cấp budget cho session con và budget scope của continuation
  chain. Không tự mở session liên tiếp để né hard limit hoặc giới hạn người
  dùng. Budget mới phải có authority rõ; chưa có authority thì proposal/park.
- Chốt trạng thái session cha, in-flight runs, late results và operation mapping
  khi mở session con. Hai caller apply cùng proposal phải hội tụ một continuation;
  không tạo execution chồng nhau trên phần việc chưa reconcile.
- Retry executor giữ Assignment, tạo Run mới; continuation tạo ledger mới;
  recheck là operation/Assignment mới theo contract hiện hành. Không trộn ba
  hành vi để chữa authorization conflict hoặc semantic rejection.
- `ExistingResultRefV1` và `MissingOperationV1` cần định nghĩa hoặc trỏ contract
  canonical; phân biệt receipt, raw result và accepted normalized result.
  Có receipt không chứng minh completion hay worker đã dừng.

Default là read-only pure planner và typed proposal; chưa cần tự mở session,
tạo request file hay tự dispatch. Contract phải đủ cho command handler sau này
mà không phải thêm authority ngầm vào planner.

Proof cần bổ sung: stale plan, apply lặp/concurrent, parent run còn sống, late
result, visibility không được carry ngầm, budget chain không tự reset, authority
thiếu, và Node/Rust handover trong lúc recovery.

### Tổng hợp kiến trúc đã chấp thuận

| Thành phần | Trách nhiệm |
|---|---|
| RunHandle | Runtime binding, delivery/execution facts, guarded control |
| Recovery planner | Pure planning từ snapshot/clock/policy; không ghi hoặc cấp quyền |
| Executor health/fallback | Health classification và governed candidate recommendation |
| Execution authority hiện có | Revalidate quyền/budget/concurrency và admit attempt |
| Operation contract/adapter | Retry semantics, effect reconciliation và guarantees thực tế |

Đây là ranh giới logic, không bắt buộc năm service/process/crate. Application
ports diễn đạt nhu cầu của use case; persistence, runtime, provider và CLI là
adapters. Không tạo authority hoặc graph/quorum evaluator song song.

### Plan/apply, admission và result acceptance

Plan là lời khuyên, không phải permission. Tại apply, authority hiện có kiểm lại
snapshot revision, result mới đến, cancellation, authorization, budget và
competing attempts; kiểm preconditions và ghi admission nhất quán/nguyên tử
trước spawn. Hai coordinator không được đồng thời admit cùng logical attempt.
Admission bền vững mang launch identity để reconcile crash trước/sau launch;
không suy thiếu RunHandle thành quyền cấp attempt mới.

Mỗi Run giữ result riêng. Authority hiện có quyết định attempt generation/
revision nào còn quyền công bố contribution chính thức. Không dùng last-arrival
wins; result đã accepted không tự bị late result thay thế. Late result vẫn được
lưu, validate và đối soát vì có thể chứng minh effect cũ đã xảy ra. Acceptance
protocol chi tiết cần khớp result-linked/run-retried và normalizer hiện có.

Cancel requested không chứng minh worker stopped; recovery vẫn thu nhận late
result và reconcile effect nhưng không tự retry công việc đã bị hủy. Timeout
không chứng minh effect absent. Continuation không tự phục hồi authorization đã
thu hồi hoặc ý định đã cancel.

Session con cần lineage, flow/policy provenance, validated context transfer và
budget authority rõ; không tự kế thừa authorization/quorum credit hoặc reset
chain limits. Cần đặc tả parent lifecycle, in-flight run và late-result mapping
trước auto-continuation. Default chỉ emit typed proposal là đủ.

### Default implementation và phần còn phải đặc tả

Default có thể gồm một runtime adapter, một durable repository, pure planner,
atomic admission và launch reconciliation, candidate list tĩnh và bounded retry.
Distributed coordination, adaptive health ranking, global health, nhiều adapters
và UI có thể để sau. Identity, authority, ambiguity, idempotency và concurrency
semantics phải hoàn thiện trước implementation dựa vào các guarantees đó.

| Thứ tự | Đặc tả tiếp theo | Tài liệu chủ trì | Trạng thái |
|---|---|---|---|
| 1 | Retry conditions, effect identity/scope/window và guarantee port | executor-health-and-fallback.md | Nguyên tắc đã chốt; schema/port còn mở |
| 2 | Delivery/execution states, incarnation và launch crash protocol | run-handle.md | Nguyên tắc đã chốt; transition/protocol còn mở |
| 3 | Continuation authority/budget, parent/child và late results | Tài liệu này | Nguyên tắc đã chốt; lifecycle chi tiết còn mở |
| 4 | Typed actions, admission, revision và result acceptance | Tài liệu này | Boundary đã chốt; payload/atomicity còn mở |
| 5 | Policy precedence, attempt counters và health scope | executor-health-and-fallback.md | Một nguồn governance đã chốt; schema/default còn mở |
| 6 | Wire/persistence versioning, ownership và Node/Rust handover | Cả ba | Hướng migration đã chốt; protocol chi tiết còn mở |

Proof bổ sung: hai caller admit cùng attempt, result/cancel đến giữa plan/apply,
crash sau admission, result cũ đến sau result mới, không tự thay accepted result,
continuation không phục hồi canceled intent và Node/Rust không cùng làm chủ.

## 1. Quyết định kiến trúc

Thêm một component runtime-layer có tên tạm:

```text
CoordinationContinuationPlanner
```

Planner nhận một `coordinationId` hoặc một request chuẩn bị mở session, đọc
manifest/event log/Assignment/Run/RunResult/outbox hiện có, rồi trả về một kế
hoạch máy-đọc-được:

```text
show/recover/open request
  -> replay CoordinationSession
  -> scan Assignments/Runs/RunResults/outbox
  -> evaluate immutable session constraints
  -> plan next coordination action
```

Planner không tự dispatch agent. Nó chỉ nói nên làm gì tiếp:

- resume cùng `coordinationId`;
- link/normalize result đã có;
- authorize operation còn thiếu;
- mở continuation session mới;
- refuse vì request shape đã không thể sửa trong session hiện tại;
- park và chờ operator/human.

### 1.1 Vì sao planner phải là concept riêng

Các lỗi lịch sử không cùng bản chất với executor failure:

- `partialPolicy` là invariant của session-open request;
- poisoned authorization slot là invariant của event log trong một session;
- `wallTimeMs` là hard budget của manifest;
- quorum/required actors thuộc FlowDefinition/session replay;
- outbox result đã có nhưng chưa link là recovery của session membership.

Nếu vá các lỗi này trực tiếp trong skill prose hoặc từng command `run`, logic sẽ
bị tản ra và dễ tạo một session "trông active nhưng không thể đóng".

### 1.2 Bất biến

```text
CoordinationSession owns graph progress.
Continuation Planner owns recovery and next-action planning.
Dispatch owns executor choice.
RunHandle owns runtime locator/liveness.
```

Planner được phép dùng `RunHandle` và Dispatch Control Plane như nguồn dữ kiện,
nhưng không sở hữu chúng.

## 2. Vấn đề lịch sử và giải pháp đề xuất

| ID | Vấn đề lịch sử | Giải pháp bằng planner |
|---|---|---|
| C-a | Review-only cell không có `partialPolicy.allowedOmissions` từ open request thì không close được quorum. | Planner phân loại session template trước khi open; nếu request review-only cần partial close, shape phải được chốt trước open hoặc refuse. |
| C-b | `partialPolicy.allowedOmissions: ["fixer"]` ở open request khiến session đóng partial quá sớm trước fix round. | Planner tách "review-only recheck session" khỏi "implementation cell có fixer"; không dùng partialPolicy cho session còn có operation driver-authorized cần mở sau. |
| C-c | Poisoned authorization slot: authorize lại cùng `(actor, operation, node)` dưới ID mới không có tác dụng. | Planner phát hiện authorization conflict trong replay và đề xuất continuation session mới thay vì retry trong session cũ. |
| C-d | `grantedContextRefs` khó khớp, authorization cũ sai đứng trước theo FIFO. | Planner chuẩn hóa request builder: chỉ cấp ref khi ref ownership/visibility đã kiểm được; nếu không, dùng objective/provenance text và explicit artifact hash thay vì grant sai. |
| C-e | `wallTimeMs` tính từ lúc mở session, không phải round hiện tại. | Planner luôn tính `remainingWallTimeMs` từ `createdAt`; dưới ngưỡng thì không dispatch step dài, mà mở continuation session hoặc park. |
| C-f | CLI cha chết nhưng result/outbox đã có. | Planner scan result/receipt/outbox trước khi dispatch lại; result hợp lệ được link/normalize trước. |
| C-g | Session active nhưng hard budget hết, không dispatch step mới được. | Planner surface trạng thái "active but exhausted" và tạo `open-continuation` plan. |

## 3. Mục tiêu và phi mục tiêu

### 3.1 Mục tiêu

1. Cho một agent lạ biết bước coordination tiếp theo mà không đọc pane bằng mắt.
2. Ngăn request mở session có shape biết-trước-sẽ-kẹt.
3. Phát hiện session không thể recover trong cùng `coordinationId` do immutable
   policy, poisoned authorization, hoặc hard budget.
4. Ưu tiên result/receipt đã có trước mọi retry/redispatch.
5. Tách continuation session khỏi retry executor.
6. Tạo request builder an toàn cho `authorize`, `disposition`, `operation`,
   `close`, và `open-continuation`.
7. Giữ FlowDefinition và CoordinationSession replay là source of truth.
8. Tạo output `nextAction` đủ rõ cho CLI/skill/UI.

### 3.2 Phi mục tiêu

- Không chọn executor/fallback/cooldown; việc đó thuộc Dispatch Control Plane.
- Không đổi semantics của `partialPolicy`, authorization, quorum, hoặc
  `aggregateBounds`.
- Không sửa bằng cách cho mutate manifest/event cũ.
- Không dùng pane/herdr state làm quorum hoặc completion proof.
- Không thay thế `fgos coordination run/show`.
- Không tự tạo Work lifecycle transition.
- Không biến continuation session thành cùng một `coordinationId`.

### 3.3 Use case đích

Use case đầu tiên là code-panel/master-loop:

- mở cell mới với request shape đúng;
- khi resume, biết doer/reviewer/red-team/fixer/recheck nào đã xong;
- nếu session hết wall-time hoặc authorization bị poisoned, mở session mới cho
  phần còn thiếu;
- nếu CLI chết, đọc outbox/result trước khi dispatch lại;
- trả `nextAction` rõ cho người vận hành.

## 4. Threat model và mô hình rủi ro

Planner là decision-support/runtime recovery. Nó không phải authority ghi truth
mới ngoài các cửa coordination hiện có.

| Trục | Cam kết | Không cam kết |
|---|---|---|
| Session truth | Đọc manifest/event log và replay hiện có. | Không sửa event cũ để "heal" session. |
| Request safety | Refuse hoặc warn khi request shape sẽ kẹt theo invariant đã biết. | Không thay đổi invariant của engine. |
| Recovery | Ưu tiên result/receipt đã có trước retry. | Không tin stdout/pane text như RunResult. |
| Continuation | Đề xuất session mới khi session cũ không thể tiếp tục. | Không coi continuation là cùng một quorum ledger. |
| Authorization | Phát hiện conflict/poisoned slot. | Không bypass visibility/grant ownership. |
| Budget | Tính remaining budget từ manifest creation time. | Không gia hạn hard budget trong cùng session. |

### 4.1 Fail-closed rule

Nếu planner không chứng minh được một result thuộc đúng Assignment/Run/session,
nó không link result đó. Nếu session graph không thể đóng mà không cần mutate
immutable shape, planner phải đề xuất continuation hoặc refuse, không đoán.

### 4.2 Human authority

Planner có thể soạn request tiếp theo, nhưng nếu operation thuộc nhóm
driver-authorized hoặc cần human disposition, quyền author vẫn là driver/human
theo CoordinationSession contract. Planner không tự đóng vai người.

## 5. Component boundary

### 5.1 Vị trí và parent

Component thuộc **Agent Coordination / CoordinationSession runtime**:

```text
src/runner/coordination/
  continuation-planner.mjs
  continuation-request-builder.mjs
```

Các call site hợp lệ:

- `src/verbs/coordination/run.mjs` trước khi apply request;
- `src/verbs/coordination/show.mjs` để hiển thị `nextAction`;
- skill/CLI recovery surface, ví dụ `fgos coordination chain`;
- headless adapter khi resume một session.

### 5.2 Planner sở hữu

- phân loại session state từ replay;
- tính step còn thiếu theo FlowDefinition;
- kiểm immutable-open-shape hazards;
- phát hiện poisoned authorization;
- tính `remainingWallTimeMs`;
- scan Assignment/Run/RunResult/outbox refs thuộc session;
- tạo `ContinuationPlan`;
- tạo request skeleton an toàn cho bước tiếp theo.

### 5.3 Planner không sở hữu

- chọn executor/model/tier;
- fallback executor hoặc health score;
- spawn/terminate runtime;
- RunHandle lifecycle;
- Confinement policy;
- Work approve/merge/status;
- định nghĩa protocol/FlowDefinition mới.

### 5.4 Dependency rule

1. Planner được import coordination replay/store/schema.
2. Planner được đọc Assignment/Run/RunResult store qua public read helpers.
3. Planner được đọc RunHandle summary nếu có, nhưng chỉ làm diagnostic.
4. Planner chỉ gọi Dispatch Control Plane qua một planning API, không đọc
   executor health store trực tiếp.
5. Dispatch không import planner; dispatch chỉ nhận Assignment/Run input.

## 6. Contract chuẩn

### 6.1 `ContinuationPlan`

```ts
type ContinuationDecision =
  | 'resume-session'
  | 'link-existing-result'
  | 'authorize-next-operation'
  | 'dispatch-next-operation'
  | 'open-continuation-session'
  | 'record-disposition'
  | 'close-session'
  | 'park'
  | 'refuse';

interface ContinuationPlanV1 {
  contract: 'coordination-continuation-plan.v1';
  coordinationId: string;
  decision: ContinuationDecision;
  reason: string;
  confidence: 'certain' | 'probable' | 'blocked';
  session: SessionSummaryV1;
  nextAction?: NextActionV1;
  hazards: ContinuationHazardV1[];
  existingResults: ExistingResultRefV1[];
  missingOperations: MissingOperationV1[];
  continuation?: ContinuationSessionProposalV1;
  createdAt: string;
}
```

### 6.2 `SessionSummary`

```ts
interface SessionSummaryV1 {
  status: 'active' | 'completed' | 'partial' | 'failed' | 'cancelled';
  phase: string;
  createdAt: string;
  wallTimeMs: number;
  elapsedWallTimeMs: number;
  remainingWallTimeMs: number;
  aggregateBounds: {
    wallTimeMs: number;
    maxAssignments: number;
    maxConcurrency: number;
    maxRounds: number;
    maxTaskDepth: number;
  };
  partialPolicy: null | {
    minimumActors?: number;
    allowedOmissions?: string[];
  };
}
```

`remainingWallTimeMs` luôn derive từ `createdAt`, không từ lúc resume hoặc lúc
round hiện tại bắt đầu.

### 6.3 `ContinuationHazard`

```ts
type ContinuationHazardCode =
  | 'partial-policy-missing'
  | 'partial-policy-premature-close-risk'
  | 'authorization-slot-poisoned'
  | 'authorization-context-ref-invalid'
  | 'wall-time-exhausted'
  | 'wall-time-too-low-for-dispatch'
  | 'existing-result-unlinked'
  | 'foreign-result-refused'
  | 'session-active-but-undispatchable'
  | 'request-shape-immutable-after-open';

interface ContinuationHazardV1 {
  code: ContinuationHazardCode;
  severity: 'info' | 'warning' | 'blocking';
  message: string;
  affectedActorId?: string;
  affectedOperationId?: string;
  affectedNodeId?: string;
  evidenceRefs: string[];
}
```

Consumer rẽ nhánh theo `code`, không parse message.

### 6.4 `NextAction`

```ts
interface NextActionV1 {
  kind:
    | 'run-request'
    | 'show-session'
    | 'open-continuation'
    | 'wait-for-result'
    | 'ask-human'
    | 'manual-inspection';
  command?: string;
  requestFile?: string;
  explanation: string;
  requiresHumanApproval: boolean;
}
```

`manual-inspection` là fallback cuối cùng, không phải happy path. Nếu planner
trả `manual-inspection` thường xuyên thì implementation chưa đủ.

### 6.5 `ContinuationSessionProposal`

```ts
interface ContinuationSessionProposalV1 {
  parentCoordinationId: string;
  proposedCoordinationId: string;
  inheritedContextRefs: string[];
  objective: string;
  reason:
    | 'wall-time-exhausted'
    | 'authorization-poisoned'
    | 'immutable-open-shape'
    | 'fresh-independent-recheck-required';
  remainingOperations: Array<{
    actorId: string;
    operationId: string;
    nodeId: string;
    mutation: 'read-only' | 'mutating';
  }>;
}
```

Continuation session là session mới, có ledger mới. Nó được phép thừa kế context
refs và objective, nhưng không được pretend là cùng quorum ledger với session
cha.

## 7. Luồng runtime

### 7.1 Trước khi mở session

Planner hoặc request builder kiểm:

1. protocol/FlowDefinition có review-only shape hay không;
2. session có fixer/follow-up driver-authorized operation cần chạy sau quorum
   đầu hay không;
3. `partialPolicy` có làm session close sớm không;
4. `aggregateBounds.wallTimeMs` có đủ cho expected steps không;
5. request có context refs không hợp lệ hoặc không sở hữu không.

Nếu hazard blocking, refuse trước open. Một session đã mở sai shape thì không
được mutate manifest để sửa.

### 7.2 Khi resume

Thứ tự bắt buộc:

1. replay session event log;
2. đọc Assignment/Run refs thuộc session;
3. scan worker result/outbox chưa link;
4. validate result ownership/freshness;
5. tính missing operations và quorum state;
6. tính remaining wall time;
7. phát hiện authorization conflict;
8. hỏi Dispatch Control Plane nếu cần một dispatch mới;
9. trả `ContinuationPlan`.

### 7.3 Khi session hết budget

Nếu `remainingWallTimeMs <= 0`, planner không được đề xuất dispatch trong cùng
session. Nếu còn operation cần làm, planner trả `open-continuation-session`.
Nếu mọi result đã có nhưng chưa close, planner có thể đề xuất link/close nếu
không cần spawn mới và engine cho phép.

### 7.4 Khi authorization bị poisoned

Nếu replay cho thấy một authorization cũ cùng `(actorId, operationId, nodeId)`
đã tạo route sai hoặc contextRefs sai mà engine sẽ match trước, planner không
retry cùng tuple trong session đó. Nó đề xuất continuation session mới hoặc một
operation khác hợp lệ nếu FlowDefinition có đường đó.

## 8. Tương tác với Dispatch và RunHandle

Planner dùng Dispatch Control Plane như oracle cho câu hỏi:

```ts
planDispatchForStep({
  capability,
  actorId,
  operationId,
  preferredExecutorId,
  failureContext
}) -> DispatchPlan | DispatchParked | DispatchRefused
```

Planner không đọc health score, không hardcode fallback executor.

Planner dùng RunHandle như diagnostic:

- run còn handle active thì tránh duplicate dispatch;
- handle paused provider-limit thì đề xuất wait/park;
- handle lost không tự động nghĩa là Run failed nếu result đã có.

## 9. Implementation mặc định đầu tiên

### 9.1 Slice R1: read-only planner

- Thêm `continuation-planner.mjs`.
- Nhận `coordinationId`, trả `ContinuationPlan`.
- Chưa tạo request file tự động.
- Tests: wallTime calculation, missing operations, existing result scan,
  poisoned authorization detection.

### 9.2 Slice R2: request builder

- Tạo skeleton request cho `authorize`, `operation`, `disposition`, `close`,
  và `open-continuation`.
- Refuse request shape gây partial close sớm.
- Tests: review-only partial allowed, implementation-cell partial refused,
  contextRefs ownership checked.

### 9.3 Slice R3: CLI/show integration

- `fgos coordination show --json` thêm `nextAction`.
- `fgos coordination chain` dùng planner thay vì skill prose tự suy.
- Tests: active-but-exhausted session shows continuation, no redispatch when
  existing result is available.

## 10. Proof và Definition of Done

- Unit tests cho hazard classification.
- Replay fixture cho poisoned authorization.
- Fixture session hết `wallTimeMs` nhưng vẫn active.
- Fixture CLI crash: result file đã có, event link chưa có.
- Static test: planner không import executor-health internals.
- Integration test: `show` hiển thị `nextAction` mà không mutate session.

## 11. Quyết định của proposal

1. Planner thuộc CoordinationSession runtime.
2. Planner quyết định continuation/session next action, không chọn executor.
3. Session-open shape immutable; planner refuse thay vì mutate.
4. Result/receipt đã có thắng retry.
5. Hard wall time tính từ session `createdAt`.
6. Poisoned authorization dẫn tới continuation session, không retry mù.
7. Continuation session là ledger mới, không phải extension ẩn của session cũ.

## 12. Các việc deferred

- UX cho operator duyệt continuation request.
- Policy chọn threshold `remainingWallTimeMs` tối thiểu cho dispatch dài.
- Có nên auto-write request files hay chỉ emit JSON plan.
- Migration của `fgos-plan-loop`/`fgos-code-panel` prose sang planner.
- Cách visualize parent/continuation chain trong replay.

## 13. Con trỏ hiện tại

- [CoordinationSession Contract](../contracts/coordination-session.md) là truth
  cho manifest/event log/recovery hiện có.
- [FlowDefinition Contract](../contracts/flow-definition.md) là truth cho graph,
  operation, activation, và quorum.
- [Runtime Model](runtime-model.md) định nghĩa Assignment -> Run -> RunResult.
- [RunHandle](run-handle.md) định nghĩa runtime locator/liveness handle.
- [Dispatch Control Plane](dispatch-control-plane.md) định nghĩa executor và
  mechanism resolution.
