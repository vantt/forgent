---
area: dispatch-control-plane
updated: 2026-09-11
coverage: proposed
---

# Design: Executor Fallback Activation And Health

> **Trạng thái:** PROPOSED — contract v1 chốt hình; default implementation chưa
> có. Hướng kiến trúc đã được người dùng chấp thuận 2026-09-11
> (`plans/reports/design-review-260911-1617-run-handle-continuation-health.md`).
>
> **Một câu:** lớp này quyết định **retry, park, hay fallback sang executor
> nào** — bằng cách *kích hoạt* `fallbackExecutors` đã reserved trong
> DispatchRequest, dựa trên signal ladder và recovery matrix đã có. Health
> observation store là phần tương lai của cùng contract, không phải điều kiện
> để ship.

Nguyên tắc chung nằm ở [README](README.md#runtime-recovery-principles).

## 1. Bất biến

```text
Capability là semantic target; executor là implementation.
Fallback không bao giờ hạ capability, tier, provider, confinement, mutation.
Mọi candidate đi qua cùng compileDispatchPlan với constraints/provenance ban đầu.
Recommendation không phải permission: admission đi qua Run contract.
```

Một executor unhealthy không làm operation thất bại về semantic; nó chỉ là tín
hiệu để retry/fallback/park. Semantic result thuộc RunResult normalizer.

## 2. Bug gốc → proof

| ID | Lỗi lịch sử | Giải pháp | Proof |
|---|---|---|---|
| E-a | `codex-herdr` timeout 35', zero output, no commit, `gitBefore == gitAfter`. | Ladder `timed-out-idle` + delivery/effect facts → eligibility → candidate tiếp theo qua compiler. | Fake zero-output → decision `fallback` với candidate từ `fallbackExecutors`, không hardcode trong skill. |
| E-b | `agy-herdr` handshake/re-brief timeout. | Ladder `timed-out-idle` với `delivery: unknown` → bounded retry cùng executor trước, fallback khi lặp. | Attempt 1 `retry-same`, attempt 2 `fallback`. |
| E-c | Codex quota "try again at…" bị retry ngay. | Ladder `paused-limit` → `park` với `retryAfter`; cùng Run tiếp tục, không Run mới. | Quota signal → `park`, không admit Run; sau retryAfter chỉ inspect. |
| E-d | Load cao → dispatch timeout giả, pane vẫn chạy. | RunHandle `present` → không ghi failure, decision `wait`. | Timeout + handle present → không duplicate spawn, không cooldown. |
| E-e | Fallback ổn định nằm trong trí nhớ người. | `fallbackExecutors` theo capability/operation trong config, resolver kiểm governance. | Candidate ngoài config hoặc sai capability → `rejectedCandidates` có reason. |
| E-f | Launch/config/semantic bị trộn thành timeout chung. | Ladder outcome + Run phase + RunResult classification tách ba lớp. | Semantic failure (RunResult reject) → không fallback, không cooldown. |

Thêm proof từ guarantee: restart không reset attempt; concurrent retry bị Run
admission chặn; cancellation đến giữa plan và admission → không spawn.

## 3. Ranh giới (SRP): bốn trách nhiệm, không trộn

| Trách nhiệm | Chủ | Input | Output |
|---|---|---|---|
| **Classification** — worker còn làm không, dừng kiểu gì | Signal ladder (`src/runner/dispatch/liveness.mjs`, semantic contract §4) | observation (result file, liveness reading, agent_status, output, screen) | `settled / blocked / died / timed-out-ceiling / paused-limit / timed-out-idle` |
| **Retry eligibility** — có được phép thử lại không | Operation contract + adapter guarantees + Run admission | ladder outcome, Run phase (`delivery`), effect facts, operation retry conditions | eligible / reconcile-first / park |
| **Candidate selection** — thử ai | Fallback policy (doc này) | eligibility, `fallbackExecutors`, attempt budget, trigger | ordered candidates |
| **Compile** — candidate có hợp governance không | `compileDispatchPlan` + Confinement Authority | candidate + effective constraints ban đầu | DispatchPlan hoặc refuse |

Lớp này sở hữu: candidate ordering, failure triggers, backoff, attempt budget,
reason code, và (tương lai) observation store. Không sở hữu: ladder rule,
governance merge, session graph, RunHandle lifecycle, result normalization,
Work lifecycle, confinement backend.

Dependency: dispatch resolver import fallback; coordination planner không
import fallback internals (nhận `dispatchAvailability` qua snapshot); fallback
đọc RunHandle summary do caller đưa, không gọi herdr; không import
session-engine; Confinement Authority là gate cuối trước spawn.

## 4. Classification: semantic contract phải được giữ khi port

Ladder là rule học từ production; bất kỳ implementation nào (Node hay Rust)
phải giữ nguyên:

1. Truth: result file của worker thắng mọi signal, kể cả "agent đã biến mất".
2. Blocked: agent chờ người → không timeout, không retry; answer it.
3. Died: chỉ sau `N` reading `absent` liên tiếp; một `unknown` reset đếm.
4. Ceiling: quá absolute bound bất kể bận thế nào.
5. Stale: chỉ ở đây mới đọc screen; blind interval (không đọc được
   `agent_status`) không tính vào idle. `paused-limit` tách khỏi idle thật.

Liveness read FAIL là `unknown`, không phải `absent`. Gate được phép refuse
trên thông tin xấu; quyết định kill thì không. `agent_status` chỉ là progress
hint, không bao giờ kết luận done.

Doc này không định nghĩa taxonomy thứ hai. Các nhãn cũ map như sau:
`zero-output-timeout` = `timed-out-idle` + `outputBytes == 0`;
`handshake-timeout` = `timed-out-idle` + `delivery: unknown`;
`provider-quota` = `paused-limit`; `timeout-unknown` = ladder chưa kết luận +
handle `present`; `launch-failed` = Run settled ở phase `admitted`/`launched`;
`dispatch-in-flight` KHÔNG phải health — là admission refusal của Run contract.

## 5. Contract v1

### 5.1 FailureObservation

```ts
interface FailureObservationV1 {
  contract: 'executor-failure-observation.v1';
  observationId: string;               // dedup
  assignmentId: string; runId: string; attempt: number;
  executorId: string;
  scope: { capability: string; provider?: string; account?: string; model?: string }; // resource thật bị giới hạn; không ghi credential
  outcome:
    | { kind: 'infra-ok' }             // executor chạy được; semantic thuộc RunResult
    | { kind: 'ladder'; result: LadderOutcome; delivery: 'not-sent' | 'sent' | 'unknown'; outputBytes: number; gitBefore?: string; gitAfter?: string; retryAfter?: string }
    | { kind: 'launch-failed'; phase: 'admitted' | 'launched'; error: string }
    | { kind: 'confinement-refused' }
    | { kind: 'config-invalid'; error: string };
  evidenceRefs: string[];
  observedAt: string;
}
```

Success không mang failure class. Hai executor dùng chung quota có cùng
`scope.provider/account` → cùng nguồn.

### 5.2 FallbackPolicy — chỉ candidates, triggers, budget

```ts
interface FallbackPolicyV1 {
  contract: 'executor-fallback-policy.v1';
  capability: string;
  candidates: string[];                // = DispatchRequest.fallbackExecutors, thứ tự ưu tiên
  fallbackOn: LadderOutcome[];         // default: ['died', 'timed-out-idle']
  parkOn: LadderOutcome[];             // default: ['paused-limit', 'blocked']
  retrySameFirst: { on: LadderOutcome[]; max: number };  // default: timed-out-idle với delivery unknown, max 1
  attemptBudget: { perExecutor: number; perAssignment: number; deadline?: string };
  backoff?: { initialMs: number; factor: number; maxMs: number };
  precedence: 'park-wins';             // fallbackOn ∩ parkOn → park
}
```

Không có `minTier`, `allowCrossProvider`, `requireConfinementAtLeast`: governance
sống trong DispatchRequest/PolicyPatch/compiler, không nhân bản ở đây. Policy
khai trong `runner.capabilities.<capability>` hoặc `runner.executors.<id>`
(additive); default nội bộ không hardcode executor cụ thể cho một role.
Unknown outcome không tự retry chỉ vì còn budget.

### 5.3 FallbackDecision — typed variants

```ts
interface FallbackDecisionV1 {
  contract: 'executor-fallback-decision.v1';
  assignmentId; runId; attempt;
  originalExecutorId: string;
  decision:
    | { kind: 'retry-same'; attemptNext: number; backoffMs: number }
    | { kind: 'fallback'; selectedExecutorId: string; compiledPlanRef: string }   // đã qua compileDispatchPlan
    | { kind: 'wait'; handleId: string; recheckAfter: string }                    // run còn sống
    | { kind: 'park'; reasonCode: FallbackReasonCode; retryAfter?: string; nextAction: string }
    | { kind: 'refuse'; reasonCode: FallbackReasonCode };
  eligibility: { ladder: LadderOutcome; delivery; effectGuarantee: 'not-needed' | 'declared-and-verified' | 'unverified' };
  rejectedCandidates: Array<{ executorId: string; reasonCode: FallbackReasonCode }>;
  policyProvenance: { scope: 'cliOverride' | 'opPolicy' | 'capability' | 'default'; id?: string };
}
type FallbackReasonCode =
  | 'candidate-not-registered' | 'candidate-capability-mismatch' | 'candidate-compile-refused'
  | 'candidate-in-cooldown' | 'attempt-budget-exhausted' | 'deadline-exceeded'
  | 'effect-guarantee-unverified' | 'run-still-live' | 'paused-provider-limit'
  | 'blocked-awaiting-human' | 'cancelled' | 'unknown-outcome' | 'no-fallback-pinned';
```

Không có boolean governance summary: `fallback` chỉ hợp lệ khi có
`compiledPlanRef`, tức compiler đã giữ mọi constraint. Operator pin executor
với "no fallback" → chỉ `retry-same`/`park`/`refuse`, code `no-fallback-pinned`.

### 5.4 EffectGuarantee port — operation khai, adapter chứng minh

```ts
interface EffectGuaranteePort {
  // Operation contract khai điều kiện thực thi lại; adapter cung cấp facts.
  declare(operationId): { retryable: 'before-delivery-only' | 'idempotent' | 'dedup-keyed' | 'never'; dedupWindowMs?: number };
  verify(operationId, runId): Promise<{ effectsObserved: boolean; dedupKey?: string; withinWindow: boolean }>;
}
```

Nhãn `idempotent` tự khai không thay bằng chứng: `verify` phải xác nhận
boundary thực hiện effect hỗ trợ dedup. Effect identity giữ nguyên khi thử lại
cùng effect, đổi khi có effect mới; `runId` không phải dedup key. Retry ngoài
window không còn guarantee. Default không cần effect ledger; contract có đường.

## 6. Retry và effect semantics

- Reconnect/observe tìm lại attempt hiện tại; resume tiếp tục execution hiện
  tại; retry tạo Run mới cùng Assignment; continuation tạo ledger mới. Không
  trộn.
- Lỗi xác nhận **trước delivery** (`delivery: not-sent`, hoặc Run settled ở
  `admitted`/`launched`) → retry theo budget/governance.
- **Sau delivery** → chỉ retry khi `EffectGuaranteePort` đáp ứng; `delivery:
  unknown` → reconnect/reconcile trước; chưa giải quyết → `park` với reason và
  `nextAction` cụ thể. Dừng process không xóa effect đã xảy ra.
- Cooldown/quota reset không vượt cancellation hay authority đã thu hồi.
- Chỉ hỏi người khi thiếu quyết định máy không tự đưa ra được (`blocked`).

## 7. Default implementation

Không có observation store. Ba mảnh, đều là kích hoạt thứ đã có:

1. **Activate `fallbackExecutors`** (`assignment-policy.mjs` executorList, hiện
   reserved-not-executed): khi `recovery.mjs` `resolveAction` trả `retry` và
   ladder trả `died`/`timed-out-idle` với eligibility đạt, chọn phần tử kế
   tiếp trong `executorList` chưa dùng cho Assignment này, qua
   `compileDispatchPlan`. Hết list → `park` `attempt-budget-exhausted`.
2. **`paused-limit` → park** với `retryAfter` từ ladder; cùng Run, không admit
   Run mới.
3. **Một attempt per executor per Assignment** (chặn re-pick executor vừa hỏng
   mà không cần cooldown window). `attempt` đếm trên Assignment, không reset.

Slices: R1 policy resolver thuần + decision (tests theo §2); R2 dispatch
integration (assignment-runner hỏi resolver trước retry, log structured
decision qua `logExecutorDispatch` với `fallbackReason` đã có); R3 CLI show.

Doctor: nếu thêm config policy → đăng ký defaults + doctor check "executors
referenced by fallbackExecutors exist". R1 không thêm runtime dir.

## 8. Tương lai (contract đã chừa chỗ, không ship ở default)

- Observation store `.fgos/runtime/executor-health/observations.jsonl` +
  derived `ExecutorHealthState` (window, attempts, successes, status
  healthy/degraded/cooldown/quota-paused) — scope theo resource.
- Cooldown window theo scope, adaptive ranking, cross-project sharing, UI.
- Effect ledger tổng quát.

Correctness của default không phụ thuộc scoring.

## 9. Con trỏ

- [Dispatch Control Plane](dispatch-control-plane.md) — DispatchRequest (`fallbackExecutors`, `minTier`, provenance), compiler.
- [Run contract](../contracts/assignment-run-runresult.md) — admission, phases, ba guarantee.
- [RunHandle](run-handle.md) — runtime facts.
- [Continuation Planner](coordination-continuation-recovery.md) — session next action.
- [Agent Confinement Authority](../../../specs/confinement-authority.md) — gate cuối trước spawn.
- `src/runner/dispatch/liveness.mjs`, `src/runner/recovery.mjs` — semantic contract hiện hành phải giữ khi port.
