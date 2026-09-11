---
area: agent-coordination-runtime
updated: 2026-09-11
coverage: proposed
---

# Design: RunHandle

> **Trạng thái:** PROPOSED. Tài liệu này chốt hình dạng thiết kế cho
> `RunHandle` sau chuỗi vận hành code-panel gặp lỗi pane/timeout/recovery.
> Chưa coi là implemented cho tới khi có store, adapter port, CLI/UI read path,
> doctor/setup wiring, và test/probe tương ứng.
>
> **Nguồn vận hành:** code-panel dogfood P01-P14, trong đó các lỗi lặp lại gồm:
> đóng nhầm pane agent đang chạy, CLI điều phối bị kill nhưng pane herdr vẫn
> sống, dispatch timeout giả dưới tải cao, zero-output executor timeout, paused
> provider quota, duplicate background process, và cần đọc trực tiếp outbox sau
> khi coordinator cha chết.
>
> **Kết luận ngắn:** `RunHandle` là handle runtime để quan sát hoặc điều khiển
> một `Run`. Nó không phải identity nghiệp vụ, không phải evidence, và không
> thuộc core coordination ledger.

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

- Giữ RunHandle service làm facade nhỏ cho binding và guarded runtime control.
  Tách repository port (persistence), runtime adapter port (inspect/control
  locator) và application guard (authority/preconditions). Recovery planner
  chọn next action; RunHandle không có recovery policy thứ hai.
- Runtime identity phải phân biệt locator với resource incarnation/generation:
  PID/pane ID bị tái sử dụng không được khiến control tác động vào resource khác.
  Một Run có nhiều handle cần phân biệt driver/observer/replacement; observer
  còn sống không chứng minh worker còn chạy.
- Mutation/control cần expected revision, atomic lease acquire/renew/release,
  và stale-owner rejection/fencing. Atomic file rename không thay CAS; exact ID
  confirmation không thay authority hoặc resource identity check.
- Chốt crash protocol cho tạo runtime → ghi binding → gửi prompt, bao gồm
  idempotent launch identity, orphan reconciliation và ambiguous delivery.
  Binding mất không được tự cho phép redispatch.
- Tách execution state, attachment state và observation freshness. `paused`,
  `detached`, `stale` có thể đồng thời đúng; enum status hiện tại chưa đủ.
  Chuẩn hóa unknown/unsupported, timestamp, nguồn quan sát và độ mới dữ kiện.
  Retry-after hết chỉ cho phép kiểm tra lại, không chứng minh runtime resumed.
- Dùng adapter identity có namespace/version và opaque locator được adapter
  validate; danh sách runtime kind không nên buộc sửa common contract mỗi lần
  thêm plugin. Unknown adapter cho phép đọc metadata, refuse control rõ ràng.
- Port control phải có typed request/result/error, async semantics, cancellation
  và idempotency; supported capability không đồng nghĩa caller được phép dùng.
  Diagnostic refs nên có tên rõ để không nhầm với accepted RunResult evidence.
- Query snapshot và refresh observation phải phân biệt: `show` read-only không
  được ngầm ghi heartbeat chỉ vì gọi inspect.

Default có thể là một herdr adapter và local repository với lock/CAS. Distributed
lease, nhiều adapter, archive indexes, supervisor và UI có thể triển khai sau;
identity, stale-owner rejection và ambiguous-outcome semantics phải chốt trước.

Proof cần bổ sung: PID/pane reuse, hai controller tranh lease, stale owner control,
crash tại từng launch boundary, observer-only còn sống, store mất nhưng worker
còn chạy, unsupported adapter, read-only show không ghi state.

### Delivery, control và crash recovery — hướng đã chốt

RunHandle cung cấp facts, không cấp quyền retry. Delivery state phải phân biệt
chưa giao việc, đã giao và không biết đã giao thành công chưa; execution state
và độ mới observation được biểu đạt riêng. Gửi request rồi mất acknowledgment
là delivery unknown, không phải bằng chứng launch failed. Adapter phải cho biết
có hỗ trợ tra cứu bằng launch identity hay không; unsupported không thành absent.

Launch identity ổn định gắn với admission của một attempt, được dùng để reconcile
crash giữa admission → tạo runtime → ghi binding → delivery. Recovery không cấp
admission mới chỉ vì thiếu handle. Claim và external spawn không được giả định
là một transaction; cần đặc tả các cửa sổ crash và hành vi adapter tại từng cửa.

Phân biệt ba bảo đảm:

- Control fencing: controller hết quyền không được điều khiển/ghi state.
- Result fencing: attempt cũ không tự thay kết quả chính thức của Assignment.
- Effect protection: deduplication/isolation/fencing tại nơi effect xảy ra.

Lease/token nội bộ chỉ bảo vệ effect nếu bên thực hiện effect cũng enforce nó.
RunHandle không hứa exactly-once external effects. Resource incarnation và
expected revision phải được kiểm trước destructive control; exact ID không đủ.

Cancel requested khác execution stopped; timeout khác effect absent. Runtime
báo facts và xác nhận control outcome, kể cả unknown. Quota retry-after hết chỉ
cho phép inspect/resume theo capability, không tự mở Run mới.

Proof bổ sung: mất acknowledgment sau delivery, crash sau admission trước
binding, lookup unsupported, cancel chưa dừng worker và stale controller bị
chặn nhưng external effect vẫn phải đối soát qua operation adapter.

## 1. Quyết định kiến trúc

fgOS sẽ thêm một khái niệm runtime-layer có tên **RunHandle**:

```text
Assignment -> Run -> RunHandle(s)
                  -> RunResult
```

`RunHandle` là bản ghi tạm thời/có-thể-phục-hồi mô tả cách tìm, quan sát, đặt
nhãn, snapshot, hoặc chấm dứt một lần chạy trong một runtime cụ thể. Với herdr,
handle thường trỏ tới tmux pane hoặc agent session. Với runtime khác, handle có
thể trỏ tới pid, process group, container id, remote job id, web terminal id,
hoặc một locator opaque khác.

Rule nên được đóng thành bất biến:

```text
runId is execution identity.
RunHandle is an operational locator and capability handle.
Pane id is only one possible locator field inside a RunHandle.
```

Core coordination chỉ được tham chiếu `Assignment`, `Run`, `RunResult`, evidence
và protocol/operation state. Core không được cần biết tmux pane, terminal title,
window name, pid tree, hay bất kỳ runtime chrome nào.

### 1.1 Vì sao cần một concept riêng

Không có `RunHandle`, nhiều thứ khác bản chất bị trộn vào nhau:

- pane title bị đọc như identity;
- herdr status bị đọc như Run completion;
- CLI coordinator chết bị hiểu nhầm là worker chết;
- timeout không phân biệt "worker im thật" với "observer mất tín hiệu";
- close-pane là thao tác UI nhưng lại có thể phá một run đang sống;
- recovery phải đọc bằng mắt nhiều file/pane/outbox không có mapping chuẩn.

`RunHandle` gom nhóm vận hành này vào một lớp đúng cho runtime mà không làm ô
nhiễm core protocol.

### 1.2 Tên gọi

`RuntimeAttachment` là tên đúng về mặt formal nhưng khó đọc. `RunHandle` được
chọn vì nó nói đúng ý đồ cho người debug lúc hệ thống đang sống:

- `Run` là lần thực thi.
- `RunHandle` là tay nắm để tìm và điều khiển lần thực thi đó.

UI có thể hiển thị thành "pane", "process", "job", "terminal" tùy runtime.
Code/spec dùng `RunHandle`.

## 2. Vấn đề lịch sử và giải pháp đề xuất

| ID | Vấn đề lịch sử | Giải pháp bằng RunHandle |
|---|---|---|
| F-a | Lead đóng nhầm pane vì dựa vào title/vị trí pane. | Mỗi pane/runtime locator có `RunHandle` trỏ ngược về `runId`/`assignmentId`; close guard phải inspect handle và core run state trước khi đóng. |
| F-b | CLI cha bị kill do RAM, pane herdr vẫn chạy nhưng session driver mất state. | Handle được ghi durable trước khi prompt được gửi; resume đọc handle/outbox trước khi dispatch lại. |
| F-c | Dispatch timeout giả dưới tải cao, pane thực ra vẫn đang làm. | Timeout của caller không tự động kết luận Run failed; `inspect(handle)` và worker receipt/result có thứ tự ưu tiên riêng. |
| F-d | Provider quota/pause cần giữ pane để tiếp tục sau reset. | Handle có `status: paused` và `pause.reason/retryAfter`; retention policy giữ locator. |
| F-e | Zero-output timeout không tạo output/commit. | Handle snapshot và heartbeat giúp phân biệt no-output launch hang với worker có tiến triển nhưng không ghi stdout. |
| F-f | Hai cơ chế background gây duplicate process. | Runtime adapter tạo đúng một handle cho đúng một process/pane; input guard từ chối double-background trước khi tạo handle. |
| F-g | Lock "dispatch in flight" và tranh chấp cwd/run khó quan sát. | In-flight registry keyed bởi subject/cwd/executor có handle hiện hành, để CLI nói "run nào đang chiếm". |

## 3. Mục tiêu và phi mục tiêu

### 3.1 Mục tiêu

1. Cho người vận hành nhận ra đúng agent/run/pane đang sống mà không suy đoán.
2. Cho recovery tìm lại run đang sống sau khi coordinator process chết.
3. Chuẩn hóa quan sát/điều khiển runtime cho herdr, cli process, container,
   remote job, và web terminal mà không đổi core.
4. Tách transport liveness khỏi Run completion và RunResult.
5. Ghi đủ context để close guard, snapshot, inspect, rename/label, terminate
   có thể làm đúng việc.
6. Bảo tồn replay/evidence: handle mất hoặc stale không làm mất Run/RunResult.
7. Cho phép nhiều handle cho một Run khi observer/driver/terminal thay đổi.
8. Hỗ trợ migration nhỏ: herdr pane labeling là slice đầu tiên hợp lệ.

### 3.2 Phi mục tiêu

- Không đưa pane/tmux/herdr vào core coordination protocol.
- Không dùng handle làm receipt, evidence, hay proof agent đã làm việc.
- Không thay thế Assignment, Run, RunResult, DispatchPlan, ConfinementAuthority.
- Không cho UI/pane ownership thành Work ownership.
- Không biến process exit thành semantic success.
- Không thiết kế terminal manager mới.
- Không yêu cầu mọi runtime có cùng locator schema.
- Không fix mọi coordination quirk như partialPolicy, poisoned authorization,
  hay wallTime budget; RunHandle chỉ cung cấp visibility/recovery substrate.

### 3.3 Use case đích và default đầu tiên

Use case đầu tiên là `herdr-spawn` trong code-panel:

- khi dispatch agent, runtime ghi handle với `kind: "herdr-pane"`;
- pane được label từ `RunHandle.displayName`;
- operator có lệnh inspect/list handles đang active;
- close-pane guard yêu cầu handle terminal hoặc xác nhận đúng exact id;
- resume đọc result/outbox/handle trước khi dispatch lại;
- paused quota giữ pane và hiển thị retry time.

Default đầu tiên không cần support container/remote job, nhưng contract phải để
đường cho các runtime đó mà không đổi tên field.

## 4. Threat model và mô hình rủi ro

`RunHandle` là observability/control metadata. Nó không tạo security boundary.

| Trục | Cam kết | Không cam kết |
|---|---|---|
| Identity | Trỏ tới `runId`/`assignmentId` đã được core tạo. | Không thay thế `runId`; locator có thể stale/spoof nếu đọc ngoài guard. |
| Liveness | Cho phép inspect runtime locator bằng adapter tương ứng. | Không chứng minh work đã xong hay đúng. |
| Control | Liệt kê thao tác được runtime support như `observe`, `terminate`, `rename`. | Không cấp Work/coordination authority mới. |
| Evidence | Có thể trỏ tới snapshot/log diagnostic. | Diagnostic snapshot không tự động là evidence required. |
| Recovery | Cho resume biết có runtime nào còn sống. | Không được retry/đóng pane nếu worker result đã có mà chưa normalize. |
| Security | Có thể liên kết confinement attestation/runDir. | Không confinement agent; việc đó thuộc Agent Confinement Authority. |

### 4.1 Trust boundary

Writer được phép tạo/cập nhật handle là runtime owner của run:

- dispatch runtime adapter khi launch thành công hoặc launch đang tiến hành;
- supervisor/recovery process khi inspect thay đổi liveness;
- operator CLI khi thực hiện thao tác control có guard.

Worker agent không được tự ghi/cập nhật RunHandle. Worker chỉ ghi receipt/result
theo contract riêng của Run. Nếu worker có thể sửa handle thì handle không còn
là tín hiệu operator đang tin.

### 4.2 Fail-closed rule

Khi handle miêu tả một locator active nhưng adapter không inspect được, hệ thống
trả `status: "unknown"` hoặc `status: "stale"`, không tự động coi là `dead`.
Khi worker result tồn tại, result/receipt thắng mọi tín hiệu runtime.

## 5. Component boundary

### 5.1 Vị trí và parent

RunHandle thuộc **runtime/dispatch infra** bên dưới Agent Coordination, cạnh
Run/RunResult nhưng không nằm trong protocol graph. Vị trí code đề xuất:

```text
src/runner/dispatch/run-handles/
  schema.mjs
  store.mjs
  registry.mjs
  adapters/
    herdr-pane.mjs
    process.mjs
```

Tên thư mục có thể đổi khi implementation, nhưng boundary giữ nguyên:

- Core session engine có thể nhận `runId` và đọc RunResult.
- Dispatch runtime tạo/cập nhật RunHandle.
- Herdr adapter implement locator-specific operation.
- CLI/UI đọc RunHandle để hiển thị và guard thao tác.

### 5.2 RunHandle Authority

Nên có một facade duy nhất, nhỏ hơn Confinement Authority:

```text
withRunHandle(request, runtimePort) -> launched runtime + handle record
```

Facade này sở hữu:

- tạo handle id;
- validate subject;
- normalize runtime kind;
- ghi handle trước khi prompt/control quan trọng được gửi;
- cập nhật heartbeat/liveness/snapshot refs;
- enforce close/terminate guard policy;
- record detach/stale/terminated lifecycle.

Facade này không sở hữu:

- chọn executor/model/capability;
- decide-before-execute;
- tạo Assignment;
- normalize RunResult;
- confinement policy;
- protocol quorum/authorization;
- Work status/stage.

### 5.3 Quy tắc dependency

1. `Run` được tạo trước `RunHandle`.
2. Adapter runtime tạo locator, rồi RunHandle store ghi binding trước khi gửi
   prompt làm việc không-idempotent.
3. Mọi thao tác control đi qua RunHandle facade, không thao tác trực tiếp pane
   nếu pane đang gắn với fgOS run active.
4. Core coordination không import herdr/tmux adapter.
5. UI/gateway không tự suy đoán RunResult từ handle status.
6. Recovery đọc worker receipt/result trước, đọc RunHandle sau, rồi mới quyết
   định dispatch lại hay attach/observe.

## 6. Contract chuẩn

Đây là contract đích. Slice đầu tiên có thể ship tập con, nhưng field đã ship
phải giữ đúng nghĩa.

### 6.1 `RunHandle`

```ts
type RunHandleStatus =
  | 'active'
  | 'paused'
  | 'detached'
  | 'stale'
  | 'terminated'
  | 'lost';

type RunHandleCapability =
  | 'observe'
  | 'send-input'
  | 'terminate'
  | 'rename'
  | 'snapshot'
  | 'reattach';

interface RunHandleV1 {
  contract: 'run-handle.v1';
  id: string;
  subject: RunHandleSubjectV1;
  runtime: RuntimeLocatorV1;
  owner: RunHandleOwnerV1;
  capabilities: RunHandleCapability[];
  status: RunHandleStatus;
  displayName: string;
  labels?: Record<string, string>;
  lease?: RunHandleLeaseV1;
  heartbeat?: RunHandleHeartbeatV1;
  pause?: RunHandlePauseV1;
  evidenceRefs?: RunHandleEvidenceRefV1[];
  createdAt: string;
  updatedAt: string;
  detachedAt?: string;
  terminatedAt?: string;
  schemaVersion: 1;
}
```

### 6.2 `RunHandleSubject`

```ts
interface RunHandleSubjectV1 {
  type: 'assignment-run';
  assignmentId: string;
  runId: string;
  coordinationId?: string;
  actorId?: string;
  operationId?: string;
  nodeId?: string;
  executorId: string;
  cwd: string;
  runDir: string;
}
```

`assignmentId` và `runId` là identity. `coordinationId`/`actorId`/`operationId`
là context để người đọc và UI hiển thị đúng, không phải điều kiện core quorum.
`cwd` và `runDir` phải là path canonical do dispatch resolver cung cấp; không
nhận path từ worker output.

### 6.3 `RuntimeLocator`

```ts
type RuntimeKind =
  | 'herdr-pane'
  | 'process'
  | 'process-group'
  | 'container'
  | 'remote-job'
  | 'web-terminal';

interface RuntimeLocatorV1 {
  kind: RuntimeKind;
  locator: Record<string, unknown>;
}
```

`locator` là opaque JSON theo `kind`. Contract chung không ép mọi runtime có
`paneId` hay `pid`. Adapter của từng `kind` chịu trách nhiệm validate locator
shape của mình.

Ví dụ herdr:

```json
{
  "kind": "herdr-pane",
  "locator": {
    "gateway": "local",
    "session": "fgos",
    "window": "code-panel",
    "paneId": "%42",
    "agentSessionId": "agent_..."
  }
}
```

Ví dụ process:

```json
{
  "kind": "process-group",
  "locator": {
    "pid": 12345,
    "pgid": 12345
  }
}
```

Ví dụ remote job:

```json
{
  "kind": "remote-job",
  "locator": {
    "provider": "github-actions",
    "runId": "123456789",
    "url": "https://..."
  }
}
```

### 6.4 Owner, lease, heartbeat

```ts
interface RunHandleOwnerV1 {
  kind: 'dispatch-adapter' | 'supervisor' | 'operator-cli' | 'gateway';
  id: string;
}

interface RunHandleLeaseV1 {
  holder: RunHandleOwnerV1;
  tokenHash: string;
  acquiredAt: string;
  expiresAt: string;
  purpose: 'drive' | 'terminate' | 'recover';
}

interface RunHandleHeartbeatV1 {
  observedAt: string;
  source: RunHandleOwnerV1;
  adapterStatus: 'working' | 'idle' | 'blocked' | 'absent' | 'unknown';
  outputBytes?: number;
  lastOutputAt?: string;
}
```

Lease chỉ bảo vệ thao tác control cần một chủ drive. Observers không cần lease.
Heartbeat là diagnostic. `adapterStatus: "idle"` không bao giờ đồng nghĩa với
Run done.

### 6.5 Pause và trạng thái terminal

```ts
interface RunHandlePauseV1 {
  reason:
    | 'provider-limit'
    | 'awaiting-operator'
    | 'transport-backpressure'
    | 'unknown';
  retryAfter?: string;
  message?: string;
}
```

`paused` nghĩa là runtime locator còn giá trị và nên được giữ. `detached` nghĩa
là observer/gateway mất liên kết nhưng chưa chứng minh worker chết. `stale`
nghĩa là handle quá tuổi hoặc không inspect được theo policy. `lost` nghĩa là
locator không còn tìm thấy sau nhiều lần inspect và không có result.
`terminated` chỉ được ghi sau thao tác terminate có guarded intent hoặc adapter
chứng minh runtime đã kết thúc.

### 6.6 Evidence refs

```ts
interface RunHandleEvidenceRefV1 {
  kind:
    | 'stdout-log'
    | 'stderr-log'
    | 'pane-snapshot'
    | 'process-info'
    | 'worker-result'
    | 'confinement-attestation';
  path?: string;
  ref?: string;
  sha256?: string;
  capturedAt: string;
}
```

Tên `evidenceRefs` ở đây có nghĩa "diagnostic artifact references", không tự
động thỏa evidence policy của `RunResult`. `worker-result` và verification refs
vẫn phải được RunResult normalizer đọc/kiểm riêng.

### 6.7 Phân loại lỗi

```ts
type RunHandleErrorCode =
  | 'run-handle-not-found'
  | 'run-handle-subject-mismatch'
  | 'run-handle-stale'
  | 'run-handle-inspect-unsupported'
  | 'run-handle-control-unsupported'
  | 'run-handle-lease-conflict'
  | 'run-handle-active-close-refused'
  | 'run-handle-locator-invalid'
  | 'run-handle-adapter-failed';
```

Error phải có `code`, `message`, `handleId?`, `runId?`, `assignmentId?`, và
`recoverable: boolean`. Consumer rẽ nhánh theo `code`, không parse message.

## 7. Mô hình lưu trữ

### 7.1 Đường dẫn đề xuất

```text
.fgos/runtime/run-handles/
  active/
    rh_<id>.json
  archive/
    YYYYMM/
      rh_<id>.json
  indexes/
    by-run/
      run_<id>.json
    by-assignment/
      asgn_<id>.json
    by-locator/
      herdr-pane_<escaped-pane-id>.json
```

Handle là runtime state, nên nằm dưới `.fgos/runtime/`, không nằm trong
coordination session ledger. Nếu `.fgos/runtime` gitignored/per-machine, handle
có thể mất mà core vẫn đúng. Nếu cần replay vận hành, snapshot có thể được copy
vào reports riêng, không coi store runtime là truth bất biến.

### 7.2 Atomicity

Tạo/cập nhật handle phải dùng cùng chuẩn atomic file write của repo:

1. write temp file cùng filesystem;
2. fsync nếu store đang yêu cầu durability;
3. rename atomic vào target;
4. update index bằng write atomic riêng;
5. stale index phải được rebuild từ handle body.

Không tách create file rỗng rồi write body sau. Mẫu đó đã gây race lock-file
trong vận hành P12 và không được lặp lại.

### 7.3 Multiplicity

Một `Run` có thể có nhiều handle:

- driver handle: pane/process đang nhận prompt;
- observer handle: web terminal/session mirror;
- replacement handle: attach lại sau gateway restart;
- historical handle: pane đã terminated nhưng snapshot còn cần debug.

Index `by-run` trả danh sách handle theo `createdAt`, không ép one-to-one.
Close guard phải thao tác đúng handle id cụ thể.

## 8. Thao tác runtime

RunHandle layer nên công bố port chung:

```ts
interface RunHandlePort {
  create(input: CreateRunHandleInput): RunHandleV1;
  inspect(handleId: string): RunHandleInspectionV1;
  list(filter: RunHandleListFilter): RunHandleV1[];
  rename(handleId: string, displayName: string): RunHandleV1;
  snapshot(handleId: string, opts?: SnapshotOptions): RunHandleSnapshotResult;
  terminate(handleId: string, policy: TerminationPolicy): TerminationResult;
  detach(handleId: string, reason: string): RunHandleV1;
  recover(filter: RecoveryFilter): RecoveryPlan;
}
```

### 8.1 Create

- Chạy khi: adapter có locator đầu tiên cho run.
- Ghi gì: ghi handle active và indexes.
- Bắt buộc trước khi: gửi prompt làm việc, ghi lên pane, hoặc cho operator thấy
  một pane fgOS-owned.
- Khi lỗi: dispatch phải refuse hoặc degrade rõ ràng; không được spawn một
  interactive run mà không có handle nếu runtime đó cần handle để recover.

### 8.2 Inspect

- Chạy khi: status UI, resume, close guard, recovery, timeout classifier.
- Ghi gì: có thể cập nhật heartbeat/status nếu adapter có evidence mới.
- Sau đó: trả status diagnostic, không settle Run.

### 8.3 Rename

- Chạy khi: sau create, sau actor/operation context được resolve, hoặc khi UI
  cần refresh display.
- Ghi gì: `displayName` trong handle và runtime label nếu capability có
  `rename`.
- Khi lỗi: label failure là diagnostic; không làm fail dispatch nếu handle
  body đã tồn tại.

### 8.4 Snapshot

- Chạy khi: timeout, close refusal, operator request, recovery ambiguity.
- Ghi gì: ghi diagnostic refs, ví dụ pane text/process tree.
- Sau đó: snapshot có thể được attach vào report, nhưng RunResult normalizer
  không coi snapshot là success proof nếu operation không cho phép.

### 8.5 Terminate/close guard

Terminate không phải đóng pane đơn giản. Port phải biết subject và state:

1. đọc RunResult/worker receipt trước;
2. nếu Run đã settled, cho terminate/close theo retention policy;
3. nếu Run active/unknown, yêu cầu exact `handleId` hoặc `assignmentId` confirm;
4. nếu `paused` do provider limit, mặc định refuse close trừ khi explicit force;
5. ghi snapshot trước khi terminate nếu capability support.

## 9. Lifecycle

```text
created
  -> active
  -> paused
  -> active
  -> detached
  -> active
  -> stale
  -> lost
  -> terminated
```

Đây là lifecycle của handle, không phải lifecycle của Run.

Transition được phép:

| From | To | Trigger |
|---|---|---|
| created | active | locator đã được ghi và inspect được |
| active | paused | phát hiện provider/rate-limit/operator pause |
| paused | active | retry-after đã qua hoặc operator resume |
| active | detached | observer/gateway mất liên kết nhưng worker chưa bị chứng minh đã chết |
| detached | active | reattach/inspect thành công |
| active/detached | stale | heartbeat quá tuổi tối đa và inspect vẫn unknown |
| stale | active | locator inspect thành công trở lại |
| stale | lost | nhiều lần absent và không có worker result |
| any non-terminated | terminated | guarded terminate hoặc adapter có terminal proof |

Transition bị cấm:

- `active -> settled`: settlement thuộc Run/RunResult, không thuộc handle.
- `lost -> failed`: failure classification thuộc RunResult/recovery.
- `paused -> terminated` khi không có explicit operator/driver intent.

## 10. Định danh hiển thị

### 10.1 Định dạng DisplayName

Display name mặc định nên ngắn, sortable, và có đủ thành phần để tránh nhầm:

```text
<roleShort> <opShort> <coordShort> <asgnShort> <runShort>
```

Ví dụ:

```text
RT op_107 c_8fa asgn_01wf run_02
REV op_104 c_8fa asgn_01wd run_01
DO op_103 c_8fa asgn_01wc run_01
```

Với code-panel, display name có thể thêm slug worktree nếu còn chỗ:

```text
RT op_107 asgn_01wf forgentX
```

### 10.2 Không đổi canonical assignment path

Không rename canonical assignment/run directory để chèn role/pane info. Đường
dẫn canonical đã là ref ổn định cho contextRefs, replay, outbox, và debug.

Muốn dễ đọc hơn thì thêm alias/index:

```text
.fgos/runtime/run-handles/indexes/by-locator/herdr-pane_%42.json
.fgos/runtime/run-handles/indexes/by-assignment/asgn_01wf.json
.fgos/assignments/active/by-role/red-team-op_107 -> ../asgn_...
```

Alias là convenience. Canonical id không đổi.

## 11. Ngữ nghĩa recovery

Thứ tự recovery bắt buộc:

1. Đọc worker result/receipt trong runDir/outbox.
2. Nếu result hợp lệ, normalize RunResult; runtime locator có thể đã chết.
3. Nếu không có result, đọc RunHandle active/paused/detached/stale.
4. Nếu handle inspect được và worker còn sống, attach/observe thay vì dispatch lại.
5. Nếu handle lost và không có result, classify theo recovery matrix.
6. Nếu không có handle, dùng fallback hiện có nhưng ghi rõ `run-handle-missing`.

Quy tắc này xử lý case CLI cha bị kill: pane có thể vẫn sống, và dispatch lại
ngay có thể tạo trùng agent trên cùng cwd/run.

## 12. Tương tác với các authority hiện có

### 12.1 CoordinationSession

CoordinationSession được phép hiển thị handle refs trong `show`, nhưng session
ledger không được phụ thuộc vào handle để tính quorum. Quorum đọc contributions
và linked RunResult, không đọc pane state.

### 12.2 Dispatch Control Plane

DispatchPlan chọn executor/mechanism. RunHandle không chọn executor. Sau khi
DispatchPlan đã resolve và Run đã mở, runtime adapter tạo handle phù hợp với
mechanism thực thi.

### 12.3 Agent Confinement Authority

Confinement Authority bảo vệ spawn/adapter execution. RunHandle có thể tham
chiếu confinement attestation, nhưng không thay thế attestation. Nếu backend
confinement refuse trước spawn, không tạo active handle; có thể tạo failure
record của Run nếu Run đã mở.

### 12.4 Herdr

Herdr là runtime/transport adapter. Herdr có thể:

- tạo pane;
- label pane;
- đọc pane/process info;
- gửi input;
- chụp snapshot;
- terminate locator.

Herdr không được:

- ghi RunResult thay worker;
- đóng vai core lifecycle truth;
- đọc `idle` thành done;
- approve/merge Work.

## 13. Implementation mặc định đầu tiên

### 13.1 Slice R1: herdr-pane handle và label

- Tạo RunHandle khi `herdr-spawn` có pane/session locator.
- Ghi `displayName` từ assignment/run context.
- Rename pane/window nếu herdr support.
- Thêm lệnh read-only list/inspect handles.
- Tests: schema, store atomicity, displayName shortening, core không import herdr.

### 13.2 Slice R2: close guard

- Thêm CLI/gateway close-pane qua RunHandle.
- Refuse close active/paused handle nếu không có exact confirm.
- Snapshot trước khi close nếu support.
- Tests: active close bị refuse, settled close được phép, paused-limit được giữ.

### 13.3 Slice R3: recovery integration

- Resume đọc RunHandle trước khi dispatch lại.
- Dispatch-in-flight error in ra handle/run đang chiếm.
- Timeout classifier snapshot handle và phân biệt no-output/unknown/lost.
- Tests: fake killed coordinator + live handle -> không redispatch.

### 13.4 Slice R4: generic runtime kinds

- Thêm `process`/`process-group` adapter cho `cli-spawn`.
- Contract vẫn dùng chung `RunHandle`; locator khác herdr.
- Tests: process liveness, terminate pgid, stale index rebuild.

## 14. Proof và Definition of Done

### 14.1 Test contract

- validate closed schema;
- reject update handle do worker tự ghi;
- reject subject mismatch;
- giữ opaque locator theo kind;
- nhiều handles trên một run;
- rebuild stale index từ body.

### 14.2 Test boundary

- core coordination module không import herdr/tmux RunHandle adapter;
- RunHandle store nằm dưới `.fgos/runtime`, không nằm trong session ledger;
- `fgos coordination show` có thể hiển thị handle refs nhưng quorum tests không
  cần handles để close.

### 14.3 Probe hành vi

- herdr pane label khớp run/assignment/role;
- close guard refuse active pane khi thiếu exact id;
- paused provider-limit pane được giữ lại;
- coordinator crash recovery tìm thấy live pane và tránh duplicate dispatch;
- timeout không có result sẽ snapshot handle trước khi classify;
- process adapter có thể report lost mà không mark Run success/failure.

### 14.4 Doctor/setup

Nếu implementation thêm config default, env var, runtime dir, adapter registry,
hoặc herdr prerequisite mới, nó phải đăng ký vào `fgos setup` config merge và
`fgos doctor` check registry. Riêng R1 nếu chỉ ghi dưới `.fgos/runtime` và dùng
herdr checks đã có, có thể không cần config key mới, nhưng doctor nên có read
path diagnostic:

- handle store writable;
- herdr handle adapter available khi có herdr executors;
- stale active handles summary.

## 15. Quyết định của proposal

1. Tên concept là `RunHandle`, không phải `RuntimeAttachment`.
2. `RunHandle` thuộc runtime layer, không thuộc core protocol.
3. `RunHandle` không phải identity; `runId` mới là identity.
4. `locator` là opaque theo `runtime.kind`.
5. Một Run có thể có nhiều handle.
6. Handle status không được suy thành RunResult.
7. Worker không được ghi handle.
8. Close/terminate pane phải đi qua handle guard.
9. Canonical assignment/run path không đổi; chỉ thêm alias/index để đọc.
10. Recovery phải đọc result/receipt trước, handle sau, rồi mới dispatch lại.

## 16. Các việc deferred

- Security/auth model cho remote job locator.
- UX web dashboard cho handle list, stale handles, và guarded close.
- Retention policy cho archive handle cũ.
- Có nên mirror RunHandle events vào low-volume audit log hay không.
- `fgos coordination show` nên include handle refs mặc định hay chỉ dưới verbose
  flag.
- Một supervisor process chung sống sót qua cái chết của CLI caller và sở hữu
  heartbeat.

## 17. Con trỏ hiện tại

- [Runtime Model](runtime-model.md) định nghĩa Assignment -> Run -> RunResult.
- [Assignment, Run, And RunResult Contract](../contracts/assignment-run-runresult.md)
  là contract chuẩn cho identity và result boundaries.
- [Visibility And Herdr](visibility-and-herdr.md) định nghĩa vì sao herdr là
  observability, không phải truth.
- [Dispatch Control Plane](dispatch-control-plane.md) định nghĩa
  executor/mechanism resolution.
- [Agent Confinement Authority](../../../specs/confinement-authority.md) định
  nghĩa runtime enforcement authority quanh adapter execution.
