---
area: agent-coordination-runtime
updated: 2026-09-11
coverage: proposed
---

# Design: CoordinationSession Continuation And Recovery Planner

> **Trạng thái:** PROPOSED — contract v1 chốt hình; default implementation chưa
> có. Hướng kiến trúc đã được người dùng chấp thuận 2026-09-11
> (`plans/reports/design-review-260911-1617-run-handle-continuation-health.md`).
>
> **Một câu:** planner quyết định **tiếp tục session thế nào** — pure, từ
> snapshot + clock + policy, trả typed proposal. Nó không chọn executor, không
> ghi state, không cấp quyền. Plan là lời khuyên; authority hiện có kiểm lại
> tại apply.

Nguyên tắc chung nằm ở [README](README.md#runtime-recovery-principles).

## 1. Bất biến

```text
CoordinationSession sở hữu graph progress và là gate cuối.
Continuation Planner sở hữu next-action planning từ replay.
Run (contract) sở hữu admission của attempt.
Dispatch sở hữu executor choice.
RunHandle sở hữu runtime facts.
```

Planner dùng RunHandle và Dispatch làm nguồn dữ kiện (qua snapshot), không sở
hữu chúng, không nhân bản graph/quorum rules.

## 2. Bug gốc → nơi sửa → proof

Không phải lỗi nào cũng thuộc planner. Kiểm engine cho thấy vài lỗi là
validate-tại-cửa hoặc caller-không-biết-remedy.

| ID | Lỗi lịch sử | Nơi sửa | Proof |
|---|---|---|---|
| C-a | Review-only cell thiếu `partialPolicy.allowedOmissions` từ open request → không close được. | Đã có backlog: tsk-40j (bug, xác nhận live 2026-09-10); engine validate tại `openSession` = tsk-296. Planner chỉ surface hazard nếu session đã mở sai. | Open request review-only thiếu partial → refused trước open với code ổn định. |
| C-b | `allowedOmissions: ["fixer"]` làm session đóng partial sớm trước fix round. | Đã có backlog: tsk-5qj — nguyên nhân là engine auto-close sau pass required đầu tiên (kernel bug), không phải caller chọn sai. Sửa engine: không auto-close khi fix round còn authorizable. tsk-296 phụ thuộc tsk-5qj. | Implementation-cell request có fixer + partial → refused. |
| C-c | Authorize lại cùng `(actor, operation, node)` "không có tác dụng". | Engine ĐÃ refuse (`session-engine.mjs` dispatchDeclaredOperation: "fresher unconsumed authorization… pass a distinct taskKey"). Thiếu: refusal có `code` ổn định = tsk-1zu; planner dịch thành typed action. | Replay có duplicate authorize → planner trả `authorize-next-operation` với `taskKey` mới hoặc `open-continuation-session`, không retry mù. |
| C-d | `grantedContextRefs` khó khớp, authorization sai đứng trước. | Request builder chỉ cấp ref khi ownership/visibility kiểm được. | Ref không thuộc session → không được grant; dùng objective/provenance text + artifact hash. |
| C-e | `wallTimeMs` tính từ open, không từ round hiện tại. | Planner: `remainingWallTimeMs` luôn từ `createdAt`. Docs của bound thứ ba = tsk-oed. | Fixture session cũ còn active → `remaining <= 0` → không dispatch trong session. |
| C-f | CLI cha chết nhưng outbox đã có result. | Planner: scan result/receipt trước mọi dispatch. | Fixture result file có, `result-linked` chưa có → action `link-existing-result`, không redispatch. |
| C-g | Session active nhưng hard budget hết. | Planner: `open-continuation-session` proposal. | Fixture active-but-exhausted → proposal có lineage + budget authority rõ. |

Planner vì thế chỉ còn ba case thật: C-e/C-g (budget), C-f (crash với result),
và active-but-undispatchable. Việc ở engine đã nằm trong backlog: tsk-5qj
(auto-close), tsk-40j + tsk-296 (validate tại open), tsk-1zu (typed refusal
code); không đổi semantics `partialPolicy`/authorization.

## 3. Ranh giới (SRP)

```text
Application service ──read ports──▶ ContinuationSnapshot
        │
        ▼
Pure planner(snapshot, clock, policy) ──▶ ContinuationPlan (typed actions)
        │
        ▼
Adapter (CLI / request builder / show --json) render action → request/command
        │
        ▼
Command handler (fgos coordination run) revalidate → ghi qua authority hiện có
```

| Thành phần | Sở hữu | Không sở hữu |
|---|---|---|
| Application service | thu thập snapshot qua read ports (replay, Assignment/Run/RunResult store, RunHandle summary, dispatch availability) | quyết định |
| Pure planner | phân loại session state; missing operations theo FlowDefinition; remaining wall time; hazards; scan existing results; tạo plan | I/O, clock thật, gọi dispatch, ghi state |
| Request builder (adapter) | render action → request skeleton an toàn; kiểm ref ownership | quyết định action |
| Command handler / engine | revalidate revision, late result, run sống, authorization, budget, competing attempts; admit qua Run contract | — |

Planner không: chọn executor/model/tier; fallback/health; spawn/terminate;
RunHandle lifecycle; confinement; Work status; định nghĩa FlowDefinition; đóng
vai driver/human cho driver-authorized operation hoặc disposition.

Dependency: planner import replay/store/schema của coordination và public read
helpers của Assignment/Run/RunResult; không import executor-health internals,
không import herdr adapter; dispatch không import planner.

## 4. Contract v1

### 4.1 Input: ContinuationSnapshot

```ts
interface ContinuationSnapshotV1 {
  contract: 'coordination-continuation-snapshot.v1';
  coordinationId: string;
  sessionRevision: number;             // số event đã replay
  flowRef: { id: string; version: string };
  policyVersion: string;               // planner policy/threshold provenance
  manifest: { status; phase; createdAt; aggregateBounds; partialPolicy };
  bindings: BindingStateV1[];          // per (node, operation, actor): authorized/consumed/settled + taskKey
  runs: RunSummaryV1[];                // từ Run store: phase, attempt, settled?, superseded?
  existingResults: ExistingResultRefV1[];
  runHandles?: RunHandleSummaryV1[];   // diagnostic only
  dispatchAvailability?: Record<string, 'available' | 'parked' | 'refused'>; // đã hỏi sẵn, planner không gọi
}
```

### 4.2 ExistingResultRef — ba mức, không trộn

```ts
interface ExistingResultRefV1 {
  assignmentId: string; runId: string;
  level: 'receipt' | 'raw-result' | 'accepted';
  // receipt: worker báo nhận việc; raw-result: file trong runDir/outbox chưa normalize;
  // accepted: RunResult đã normalize và result-linked.
  path?: string; sha256?: string; observedAt: string;
  ownershipVerified: boolean;          // thuộc đúng Assignment/Run/session
}
```

Có receipt không chứng minh completion hay worker đã dừng.

### 4.3 Output: ContinuationPlan với action là discriminated union

```ts
interface ContinuationPlanV1 {
  contract: 'coordination-continuation-plan.v1';
  coordinationId: string;
  basedOn: { sessionRevision: number; flowRef; policyVersion: string };
  idempotencyKey: string;              // hash(coordinationId, sessionRevision, action.kind, action payload)
  action: ContinuationActionV1;
  hazards: ContinuationHazardV1[];
  session: { remainingWallTimeMs: number; elapsedWallTimeMs: number };
  createdAt: string;
}

type ContinuationActionV1 =
  | { kind: 'resume-session' }
  | { kind: 'link-existing-result'; assignmentId; runId; resultRef: ExistingResultRefV1; allowSupersede: boolean }
  | { kind: 'authorize-next-operation'; actorId; operationId; nodeId; taskKey: string; contextRefs: string[]; requiresDriver: true }
  | { kind: 'dispatch-next-operation'; assignmentId; capability; preconditions: PreconditionV1[] }
  | { kind: 'wait-for-run'; runId; handleId?; reason: 'run-live' | 'paused-provider-limit'; recheckAfter?: string }
  | { kind: 'record-disposition'; nodeId; requiresHuman: true }
  | { kind: 'close-session'; mode: 'full' | 'partial' }
  | { kind: 'open-continuation-session'; proposal: ContinuationSessionProposalV1 }
  | { kind: 'park'; reasonCode: ContinuationReasonCode; nextCheck?: string }
  | { kind: 'refuse'; reasonCode: ContinuationReasonCode };

interface PreconditionV1 { code: string; description: string; }  // engine kiểm lại tại apply
```

Không có `confidence`: preconditions và hazards nói đủ; `probable` không thay
precondition. Không có `command: string`: adapter render.

### 4.4 Hazard và reason code

```ts
type ContinuationHazardCode =
  | 'partial-policy-missing' | 'partial-policy-premature-close-risk'
  | 'authorization-duplicate-unconsumed' | 'authorization-context-ref-invalid'
  | 'wall-time-exhausted' | 'wall-time-too-low-for-dispatch'
  | 'existing-result-unlinked' | 'foreign-result-refused'
  | 'run-live-no-result' | 'session-active-but-undispatchable'
  | 'request-shape-immutable-after-open';
interface ContinuationHazardV1 { code; severity: 'info' | 'warning' | 'blocking'; message; affectedActorId?; affectedOperationId?; affectedNodeId?; evidenceRefs: string[]; }
type ContinuationReasonCode = ContinuationHazardCode | 'budget-authority-missing' | 'parent-lifecycle-unresolved' | 'cancelled-intent';
```

### 4.5 ContinuationSessionProposal — session mới, ledger mới

```ts
interface ContinuationSessionProposalV1 {
  parentCoordinationId: string;
  proposedCoordinationId: string;      // deterministic: hash(parent, reason, remainingOperations) — hai caller apply hội tụ
  lineage: { depth: number; rootCoordinationId: string };
  flowRef; policyProvenance: string;
  reason: 'wall-time-exhausted' | 'authorization-unrecoverable' | 'immutable-open-shape' | 'fresh-independent-recheck-required';
  objective: string;
  contextTransfer: Array<{ ref: string; ownershipVerified: true; visibility: 'granted' }>;  // chỉ ref đã validate
  remainingOperations: Array<{ actorId; operationId; nodeId; mutation: 'read-only' | 'mutating' }>;
  budget: { aggregateBounds; authority: 'open-request-author'; chainBudgetRemaining?: number };
  parentDisposition: 'closed-partial' | 'cancelled' | 'left-active-exhausted';
  inFlightRuns: string[];              // runId còn sống ở cha; con không dispatch lại các operation này
}
```

Con không kế thừa authorization hay quorum credit của cha. Budget của con do
tác giả request `openSession` cấp (engine đã nhận `aggregateBounds` từ
request); không có authority thì action là `park` với
`budget-authority-missing`. Không mở session liên tiếp để né hard limit:
`chainBudgetRemaining` giảm theo lineage.

## 5. Plan/apply

- Plan là lời khuyên. Tại apply, command handler kiểm `basedOn.sessionRevision`
  == revision hiện tại; khác → refuse `stale-plan`, replan. Kiểm result mới
  đến, cancellation, authorization, budget, competing attempts (Run contract:
  một Run chưa-settled per Assignment).
- `idempotencyKey` trùng → no-op; hai caller apply cùng plan hội tụ một kết
  quả.
- Admission attempt mới đi qua Run contract, không qua planner.
- Result acceptance: mỗi Run giữ result riêng; result đã accepted không bị
  late result thay thế (`result-linked` sau `run-retried`). Late result vẫn
  lưu/validate. Cancel requested → planner vẫn thu nhận late result, không
  retry ý định đã cancel.

## 6. Luồng khi resume (thứ tự bắt buộc)

1. replay event log → `sessionRevision`;
2. đọc Run/Assignment refs thuộc session (phase, superseded);
3. scan result/receipt/outbox chưa link; validate ownership;
4. missing operations + quorum state theo FlowDefinition;
5. `remainingWallTimeMs` từ `createdAt`;
6. hazards (duplicate authorize, immutable shape, budget);
7. Run còn sống (theo RunHandle summary) → `wait-for-run`, không dispatch;
8. trả plan. `remaining <= 0` → không bao giờ `dispatch-next-operation`.

## 7. Default implementation

- Pure planner + snapshot builder; `fgos coordination show --json` thêm
  `nextAction` (pure read, không ghi).
- Chưa tự mở session, chưa tạo request file, chưa tự dispatch; request builder
  là slice 2; `chain` dùng planner thay skill prose là slice 3.
- Proof theo bảng §2 + stale plan, apply lặp/concurrent, late result không thay
  accepted, budget chain không reset, authority thiếu → park.

## 8. Deferred

- Auto-apply / auto-open continuation.
- Threshold `wall-time-too-low-for-dispatch` mặc định.
- Visualize parent/continuation chain trong replay.
- Migration prose của `fgos-plan-loop`/`fgos-code-panel` sang planner.

## 9. Con trỏ

- [CoordinationSession Contract](../contracts/coordination-session.md) — manifest/event/recovery rule, `invocationKey`, `taskKey`, `run-retried`.
- [FlowDefinition Contract](../contracts/flow-definition.md) — graph/operation/quorum.
- [Run contract](../contracts/assignment-run-runresult.md) — admission, phases, fencing.
- [RunHandle](run-handle.md) — runtime facts.
- [Executor Fallback](executor-health-and-fallback.md) — executor choice sau failure.
