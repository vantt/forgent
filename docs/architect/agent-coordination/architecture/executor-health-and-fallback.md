---
area: dispatch-control-plane
updated: 2026-09-11
coverage: proposed
---

# Design: Executor Health And Fallback Policy

> **Trạng thái:** PROPOSED. Tài liệu này thiết kế lớp health/fallback cho
> executor dispatch. Chưa coi là implemented cho tới khi có failure classifier,
> health store, fallback policy resolver, CLI/show/read path, và test/probe
> tương ứng.
>
> **Nguồn vận hành:** code-panel dogfood gặp `codex-herdr` zero-output timeout
> nhiều lần, `agy-herdr` handshake/re-brief timeout, Codex quota pause, dispatch
> timeout giả dưới tải cao, và kinh nghiệm rằng `claude-reviewer-herdr` ổn định
> hơn cho reviewer/fixer/red-team trong một số fallback.
>
> **Kết luận ngắn:** health/fallback quyết định **nên retry, park, hay fallback
> sang executor nào**. Nó không quyết định session graph đi tiếp thế nào.

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

- Tách failure classification khỏi retry eligibility. Timeout, zero output,
  không có result và `gitBefore == gitAfter` không chứng minh worker đã dừng
  hoặc chưa gây side effect. §7.1 là tín hiệu health, chưa đủ cho phép fallback.
- Đề xuất default: khi run cũ live/unknown hoặc delivery/effect ambiguous,
  reconcile/observe/park trước. Attempt mới chỉ được phép sau khi xác nhận run
  cũ dừng và xử lý side effects, hoặc operation có retry/concurrency guarantees
  phù hợp được khai và kiểm. Dừng process đơn thuần không xóa effect đã xảy ra.
- Retry/fallback giữ immutable Assignment, tạo Run mới, giữ evidence attempt cũ;
  session ghi retry qua cửa hiện có. Health resolver chỉ khuyến nghị, application
  executor revalidate eligibility/authority trước spawn. Semantic rejection
  không tự động kích hoạt infrastructure fallback.
- Fallback policy chỉ sở hữu candidate ordering, failure triggers, backoff và
  attempt limits. Mọi candidate đi qua cùng DispatchPlan compiler với effective
  constraints/provenance ban đầu; không tạo policy merger/governance authority
  thứ hai. Các field tier/provider/confinement hiện tại cần hợp nhất hoặc tham
  chiếu canonical policy, không được diễn giải như quyền nới constraint.
- Chốt default khi thiếu policy, precedence khi fallbackOn/parkOn giao nhau,
  tổng attempt budget/deadline và budget theo executor; không reset counters
  khi coordinator restart hoặc đổi candidate. Unknown failure không được tự
  retry chỉ vì còn attempt budget.
- Observation cần ID để deduplicate, attempt correlation và outcome union:
  success không bắt buộc failureClass. Semantic result tách khỏi infrastructure
  health; RunResult normalizer vẫn sở hữu semantic interpretation.
- Health scope phải biểu đạt resource bị giới hạn (executor/capability/provider/
  account/model theo evidence), không chỉ executorId. Hai executor dùng chung
  quota không được coi là hai nguồn độc lập. Không ghi credential vào scope.
- Decision cần stable reason code, typed park/refuse/retry payload, eligibility
  evidence và policy provenance. Boolean governance summary phục vụ hiển thị,
  không phải permission token cho execution.

Default có thể dùng classifier thuần, observation repository đơn giản, candidate
list tĩnh, bounded retry và conservative park. Health scoring, adaptive ranking,
cross-project sharing và UI để sau; correctness không phụ thuộc scoring.

Proof cần bổ sung: unknown/missing handle không duplicate spawn, timeout sau
external effect, stopped worker với effect chưa reconcile, concurrent retry,
restart không reset attempt budget, shared provider quota, deduplicate observation,
fallback compile giữ mọi governance constraint và semantic failure không cooldown.

### Retry và effect semantics — kết luận đã thống nhất

Failure classification và retry eligibility là hai trách nhiệm khác nhau.
Không chuẩn hóa eligibility thành hai boolean safety chung: operation khai điều
kiện thực thi lại, adapter cung cấp facts và guarantees tương ứng, execution
authority kiểm trước admission. Nhãn `idempotent` tự khai không thay bằng chứng
rằng boundary thực hiện effect thật sự hỗ trợ deduplication.

- Reconnect/observe tìm lại attempt hiện tại, không giao lại công việc.
- Resume tiếp tục execution hiện tại khi runtime/operation hỗ trợ.
- Retry tạo Run mới cho cùng immutable Assignment.
- Continuation tạo session ledger mới; không phải retry executor.

Health có thể đề xuất candidate trước hoặc sau khi recovery đánh giá action;
không ép call order cố định. Tuy nhiên candidate recommendation không phải
permission: spawn luôn qua execution authority và DispatchPlan compiler chung.

Default: lỗi được xác nhận trước delivery có thể retry theo budget/governance.
Sau delivery, chỉ retry khi operation contract và adapter guarantees đáp ứng;
unknown thì tự reconnect/reconcile trước, chưa giải quyết được thì park với
stable reason và next action cụ thể. Chỉ hỏi người khi thiếu quyết định máy
không thể tự đưa ra. Không mặc định stopped worker nghĩa là effect đã an toàn.

Effect identity giữ nguyên khi thử lại cùng effect, đổi khi có effect mới có chủ
đích. Run ID phân biệt attempt, không tự làm idempotency key. Operation/effect
adapter định nghĩa identity, scope và thời hạn deduplication; Assignment có thể
có nhiều effects. Retry ngoài retention window không được coi còn guarantee.
Default chưa cần effect ledger tổng quát, nhưng contract phải có đường cung cấp
và kiểm các guarantees này.

Health status, cooldown hay quota reset không vượt cancellation hoặc authority
đã thu hồi. Cancellation không tự biến thành retry; late result vẫn được thu
nhận để đối soát effect qua authority/result path hiện có.

Proof bổ sung: dedup key giữ qua retry nhưng đổi cho effect mới, nhiều effects
trong một Assignment, dedup window hết hạn, adapter không chứng minh guarantee,
quota pause tiếp tục cùng Run, và cancellation đến giữa plan và admission.

## 1. Quyết định kiến trúc

Thêm một component trong Dispatch Control Plane:

```text
ExecutorHealthAndFallback
```

Component này nhận `DispatchPlan`, `ExecutorResult`/faults, RunResult
classification, và policy hiện hành để:

- phân loại failure theo mã ổn định;
- ghi health observation;
- áp cooldown/quota parking;
- chọn fallback executor hợp lệ;
- giải thích vì sao retry/fallback/refuse.

Luồng mục tiêu:

```text
Assignment
  -> DispatchPlan
  -> executor attempt
  -> failure/result classification
  -> health observation
  -> retry/fallback/park/refuse recommendation
```

### 1.1 Vì sao cần tách riêng

Fallback kiểu hardcode "codex-herdr lỗi thì dùng claude-reviewer-herdr" giải
quyết nhanh một hôm nhưng làm bẩn dispatch policy:

- không biết fallback có phục vụ capability đó không;
- không biết provider/tier/confinement có còn hợp lệ không;
- không phân biệt quota pause với infrastructure hang;
- không biết cooldown bao lâu;
- không để lại metric để cải thiện executor về sau;
- dễ để CoordinationSession tự chọn executor, sai boundary.

Health/fallback phải là phần của dispatch, vì dispatch đã sở hữu executor
resolution và governance.

### 1.2 Bất biến

```text
Capability remains the semantic target.
Executor remains the concrete implementation.
Health influences selection only through governed policy.
Fallback never weakens capability, tier, provider, confinement, or mutation rules.
```

Một executor unhealthy không làm operation thất bại về mặt semantic. Nó chỉ là
tín hiệu để retry/fallback/park.

## 2. Vấn đề lịch sử và giải pháp đề xuất

| ID | Vấn đề lịch sử | Giải pháp bằng health/fallback |
|---|---|---|
| E-a | `codex-herdr` timeout 35 phút, zero output, no commit/result, `gitBefore == gitAfter`. | Classify `zero-output-timeout`; cooldown executor cho capability/role đó; đề xuất fallback hợp lệ. |
| E-b | `agy-herdr` handshake/re-brief timeout. | Classify `handshake-timeout`; retry bounded hoặc fallback theo policy. |
| E-c | Codex quota "try again at ..." bị retry ngay. | Classify `provider-quota`; park đến `retryAfter`, không retry nóng. |
| E-d | Load cao làm dispatch timeout giả trong khi pane vẫn chạy. | Kết hợp RunHandle/liveness: nếu run còn active, không ghi health failure nặng và không dispatch trùng. |
| E-e | Một executor ổn định cho nhiều role nhưng fallback đang nằm trong trí nhớ người. | Policy khai fallback candidates theo capability/role, resolver kiểm governance trước khi dùng. |
| E-f | Các lỗi launch/config/semantic bị trộn thành timeout chung. | Failure taxonomy ổn định, mỗi code có retry/fallback/park rule riêng. |

## 3. Mục tiêu và phi mục tiêu

### 3.1 Mục tiêu

1. Ghi observation về health executor từ kết quả dispatch thật.
2. Phân biệt infrastructure failure, provider quota, timeout giả, config error,
   và semantic failure.
3. Chọn fallback executor qua policy, không hardcode trong skill prose.
4. Không làm yếu capability/tier/provider/confinement/mutation governance.
5. Có cooldown để tránh retry nóng cùng executor đang lỗi.
6. Có `retryAfter` cho quota/provider pause.
7. Surface lý do fallback cho operator và replay/debug.
8. Cho Coordination Recovery Planner hỏi "dispatch step này được không" mà không
   cần biết health internals.

### 3.2 Phi mục tiêu

- Không quyết định quorum/session continuation.
- Không mở coordination session mới.
- Không inspect pane trực tiếp; RunHandle làm việc đó.
- Không sửa lỗi gốc của provider/CLI.
- Không coi executor failure là semantic failure của worker nếu worker chưa có
  cơ hội làm việc.
- Không override explicit human executor choice nếu policy cấm fallback.
- Không thay thế Confinement Authority.

### 3.3 Use case đích

Use case đầu tiên:

- nếu `codex-herdr` zero-output timeout cho red-team, mark cooldown và fallback
  sang executor đã khai hợp lệ;
- nếu `codex-herdr` báo quota reset, park đến reset thay vì retry;
- nếu timeout nhưng RunHandle còn active, report `dispatch-observation-unknown`
  và tránh duplicate dispatch;
- nếu fallback không đạt tier/confinement/capability, refuse rõ.

## 4. Threat model và mô hình rủi ro

Health/fallback có thể thay đổi executor được chạy, nên là governance-sensitive.

| Trục | Cam kết | Không cam kết |
|---|---|---|
| Capability | Fallback phải phục vụ cùng capability hoặc capability tương thích đã khai. | Không tự suy role "gần giống" là đủ. |
| Tier/model | Fallback không được hạ minTier. | Không đảm bảo model cho output tốt hơn. |
| Provider | Cross-provider fallback phải qua governance hiện có. | Không lén gửi prompt sang provider khác. |
| Confinement | Required confinement không được fallback sang unconfined. | Không tự confinement executor. |
| Quota | Quota pause tạo retryAfter/cooldown. | Không tự bypass quota. |
| Evidence | Health observation cần refs tới run/fault/result. | Không dùng stdout thành semantic proof. |

### 4.1 Fail-closed rule

Nếu fallback candidate không chứng minh được capability/tier/provider/confinement
phù hợp, resolver refuse thay vì chạy. Nếu failure không classify được, mặc định
`unknown-infra-failure`: retry bounded hoặc park theo recovery matrix, không
fallback tùy tiện.

### 4.2 Explicit override

Nếu người vận hành pin executor cụ thể với policy "no fallback", health layer chỉ
được refuse/park/retry theo rule, không đổi executor. Nếu policy cho fallback,
kết quả phải ghi rõ executor gốc, executor thay thế, và reason code.

## 5. Component boundary

### 5.1 Vị trí và parent

Component thuộc **Dispatch Control Plane / Executor resolution**:

```text
src/runner/dispatch/
  executor-health.mjs
  fallback-policy.mjs
  failure-classifier.mjs
```

Store quan sát đề xuất:

```text
.fgos/runtime/executor-health/
  observations.jsonl
  cooldowns.json
```

Đây là runtime state, không phải event log core. Nếu cần report dài hạn, có thể
copy/summarize vào docs/reports sau.

### 5.2 Health/fallback sở hữu

- failure classification từ DispatchError/ExecutorResult/RunResult summary;
- health observation schema;
- cooldown/quota window;
- fallback candidate ranking theo policy;
- guard không hạ capability/tier/provider/confinement;
- reason code cho retry/fallback/park/refuse.

### 5.3 Health/fallback không sở hữu

- session graph/quorum/authorization;
- opening continuation session;
- RunHandle locator lifecycle;
- worker result normalization;
- Work lifecycle transition;
- setup of concrete confinement backend;
- protocol role semantics.

### 5.4 Dependency rule

1. Dispatch resolver có thể import health/fallback.
2. Coordination planner không import health internals; nó gọi dispatch planning
   API chung.
3. Health layer có thể đọc RunHandle summary do caller đưa vào, nhưng không gọi
   herdr/tmux adapter trực tiếp.
4. Health layer không import coordination session-engine.
5. Confinement Authority vẫn là gate cuối trước spawn; fallback phải đi qua nó.

## 6. Contract chuẩn

### 6.1 `ExecutorHealthObservation`

```ts
type ExecutorFailureClass =
  | 'zero-output-timeout'
  | 'handshake-timeout'
  | 'provider-quota'
  | 'dispatch-in-flight'
  | 'launch-failed'
  | 'config-invalid'
  | 'confinement-refused'
  | 'worker-result-malformed'
  | 'semantic-failure'
  | 'timeout-unknown'
  | 'unknown-infra-failure';

interface ExecutorHealthObservationV1 {
  contract: 'executor-health-observation.v1';
  executorId: string;
  capability?: string;
  actorId?: string;
  operationId?: string;
  runId?: string;
  assignmentId?: string;
  failureClass: ExecutorFailureClass;
  outcome: 'success' | 'failure' | 'parked' | 'unknown';
  evidenceRefs: string[];
  gitBefore?: string;
  gitAfter?: string;
  stdoutBytes?: number;
  stderrBytes?: number;
  retryAfter?: string;
  observedAt: string;
}
```

`semantic-failure` không làm executor unhealthy theo cùng cách infrastructure
failure. Worker làm đúng việc nhưng review reject là tín hiệu khác với adapter
không giao được prompt.

### 6.2 `ExecutorHealthState`

```ts
interface ExecutorHealthStateV1 {
  contract: 'executor-health-state.v1';
  executorId: string;
  capability?: string;
  windowStartedAt: string;
  windowEndedAt: string;
  attempts: number;
  successes: number;
  failuresByClass: Record<ExecutorFailureClass, number>;
  status: 'healthy' | 'degraded' | 'cooldown' | 'quota-paused' | 'unknown';
  cooldownUntil?: string;
  reason?: string;
}
```

State được derive từ observations/cooldowns. Không edit tay để "fix" health;
muốn override phải đi qua config/policy rõ.

### 6.3 `FallbackPolicy`

```ts
interface FallbackPolicyV1 {
  contract: 'executor-fallback-policy.v1';
  capability: string;
  primary?: string;
  candidates: string[];
  allowCrossProvider?: boolean;
  preserveProviderFamily?: boolean;
  minTier?: string;
  requireConfinementAtLeast?: 'same' | 'required-only' | 'none';
  fallbackOn: ExecutorFailureClass[];
  parkOn: ExecutorFailureClass[];
  maxAttemptsPerExecutor?: number;
}
```

Policy có thể được khai trong `runner.capabilities.<capability>` hoặc
`runner.executors.<id>` theo hướng additive sau này, nhưng implementation đầu
tiên có thể hardcode default policy nội bộ miễn là không hardcode executor cụ
thể cho một role.

### 6.4 `FallbackDecision`

```ts
type FallbackDecisionKind =
  | 'use-primary'
  | 'retry-same'
  | 'fallback'
  | 'park'
  | 'refuse';

interface FallbackDecisionV1 {
  contract: 'executor-fallback-decision.v1';
  decision: FallbackDecisionKind;
  originalExecutorId: string;
  selectedExecutorId?: string;
  reason: string;
  failureClass?: ExecutorFailureClass;
  retryAfter?: string;
  rejectedCandidates: Array<{
    executorId: string;
    reason: string;
  }>;
  governance: {
    capabilityPreserved: boolean;
    tierPreserved: boolean;
    providerAllowed: boolean;
    confinementPreserved: boolean;
  };
}
```

## 7. Failure classification rules

### 7.1 `zero-output-timeout`

Điều kiện đủ:

- dispatch hit absolute/idle timeout;
- stdout/stderr không có output có nghĩa hoặc bằng 0 bytes;
- không có worker result/receipt;
- nếu mutating, `gitBefore == gitAfter`.

Rule: cooldown executor cho capability/role window hiện tại; có thể đề xuất
candidate hợp lệ. Chỉ thực thi fallback khi retry eligibility và admission đã
được authority kiểm; các dấu hiệu trên tự chúng không cấp quyền retry.

### 7.2 `provider-quota`

Điều kiện đủ:

- stderr/stdout/result structured chứa quota/usage-limit signal đã parse được;
- có hoặc không có `retryAfter`.

Rule: park đến `retryAfter` nếu có; nếu không có, cooldown ngắn và refuse retry
nóng. Fallback chỉ được dùng nếu policy cho phép đổi provider và governance
cho phép.

### 7.3 `handshake-timeout`

Điều kiện đủ:

- adapter khởi tạo được runtime nhưng agent không phản hồi handshake/re-brief;
- không có worker result.

Rule: retry bounded cùng executor nếu lịch sử gần không xấu; fallback nếu lặp
lại hoặc policy yêu cầu.

### 7.4 `dispatch-in-flight`

Điều kiện đủ:

- cwd/run/assignment đang có dispatch lock hoặc RunHandle active.

Rule: không spawn thêm. Trả handle/run đang chiếm nếu biết; Coordination
Recovery Planner quyết định wait/attach/recover.

### 7.5 `semantic-failure`

Điều kiện đủ:

- worker result có mặt và normalized;
- executor đã chạy được;
- failure đến từ review/test/evidence semantic.

Rule: không mark executor unhealthy nặng. Có thể ghi observation outcome
`failure` nhưng không cooldown như infra failure.

## 8. Fallback governance

Trước khi chọn candidate, resolver phải kiểm:

1. candidate tồn tại trong runner config;
2. candidate phục vụ capability đang yêu cầu;
3. minTier không bị hạ;
4. provider family/cross-provider governance hợp lệ;
5. confinement requirement vẫn được giữ;
6. mutation posture không bị đổi sai;
7. candidate không đang cooldown/quota-paused;
8. max attempts chưa vượt.

Không có candidate hợp lệ thì trả `park` hoặc `refuse`, không tự chọn executor
"ổn định nhất" bằng trí nhớ.

## 9. Tương tác với các component khác

### 9.1 Coordination Recovery Planner

Coordination planner hỏi dispatch:

```ts
planDispatchForStep(...) -> DispatchPlan | DispatchParked | DispatchRefused
```

Health/fallback nằm sau API đó. Coordination planner không biết health score hay
fallback ranking.

### 9.2 RunHandle

RunHandle cung cấp liveness diagnostic. Nếu timeout nhưng handle active, health
layer không được ghi `zero-output-timeout` chắc chắn; nó ghi
`timeout-unknown` hoặc `dispatch-in-flight` tùy evidence.

### 9.3 Confinement Authority

Fallback candidate vẫn phải đi qua Confinement Authority. Nếu confinement bị
refuse, ghi `confinement-refused`; không fallback sang unconfined để "cứu" run.

### 9.4 Setup/doctor

Nếu thêm config policy mới, phải đăng ký defaults và doctor checks. Nếu chỉ ghi
runtime observations dưới `.fgos/runtime`, doctor vẫn nên có read-only check:

- health store writable/readable;
- executors referenced by fallback policy exist;
- fallback không hạ confinement/cross-provider governance;
- quota cooldowns visible.

## 10. Implementation mặc định đầu tiên

### 10.1 Slice R1: failure classifier

- Thêm pure classifier từ DispatchError/ExecutorResult summary.
- Tests cho zero-output timeout, provider quota, handshake timeout,
  semantic failure, dispatch-in-flight.

### 10.2 Slice R2: observation store

- Ghi `.fgos/runtime/executor-health/observations.jsonl`.
- Derive cooldown state.
- Tests atomic append, corrupt-line skip/fail policy, derive window.

### 10.3 Slice R3: fallback resolver

- Chọn candidate từ policy/config.
- Kiểm capability/tier/provider/confinement.
- Tests candidate rejected for each governance axis.

### 10.4 Slice R4: dispatch integration

- Khi failure infra xảy ra, hỏi fallback resolver trước retry.
- Surface structured reason trong dispatch output/log.
- Tests no duplicate dispatch when RunHandle active; quota park with retryAfter.

## 11. Proof và Definition of Done

- Classifier unit tests phủ mọi failure class shipped.
- Governance tests chứng minh fallback không hạ capability/tier/provider/
  confinement.
- Integration test: `codex-herdr` fake zero-output timeout -> fallback decision
  không hardcode trong skill.
- Integration test: quota signal -> park/retryAfter.
- Integration test: semantic failure không cooldown executor như infra failure.
- Static test: health layer không import coordination session-engine.
- Doctor/setup tests nếu có config/default mới.

## 12. Quyết định của proposal

1. Health/fallback thuộc Dispatch Control Plane.
2. Failure classification dùng code ổn định, không parse message ở consumer.
3. Fallback không được hạ governance.
4. Quota là park/retryAfter, không retry nóng.
5. Timeout có RunHandle active không phải executor failure chắc chắn.
6. Semantic failure khác infrastructure failure.
7. Coordination planner không hardcode executor fallback.

## 13. Các việc deferred

- Công thức health score cụ thể và window size mặc định.
- UI hiển thị degraded/cooldown executor.
- Policy syntax cuối cùng trong `.fgos/config.json`.
- Cross-project/global health sharing có nên tồn tại không.
- Export metrics dài hạn cho retrospective.

## 14. Con trỏ hiện tại

- [Dispatch Control Plane](dispatch-control-plane.md) là boundary chính.
- [Assignment, Run, And RunResult Contract](../contracts/assignment-run-runresult.md)
  định nghĩa Run/RunResult và confidence boundaries.
- [RunHandle](run-handle.md) định nghĩa runtime locator/liveness handle.
- [CoordinationSession Continuation And Recovery Planner](coordination-continuation-recovery.md)
  định nghĩa phần session continuation, không chọn executor.
- [Agent Confinement Authority](../../../specs/confinement-authority.md) định
  nghĩa enforcement trước adapter spawn.
