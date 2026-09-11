---
area: agent-coordination-runtime
updated: 2026-09-11
coverage: proposed
---

# Design: RunHandle

> **Trạng thái:** PROPOSED — contract v1 chốt hình; default implementation chưa
> có. Hướng kiến trúc đã được người dùng chấp thuận 2026-09-11 sau các vòng
> review (`plans/reports/design-review-260911-1617-run-handle-continuation-health.md`).
>
> **Một câu:** `RunHandle` là tay nắm runtime để *tìm, quan sát, và điều khiển
> có guard* một `Run`. Nó ghi facts về runtime; nó không cấp quyền, không phải
> identity, không phải evidence, không nằm trong core coordination ledger.

Nguyên tắc chung cho cả ba thiết kế runtime recovery (RunHandle, Continuation
Planner, Executor Fallback) nằm ở [README](README.md#runtime-recovery-principles);
doc này không lặp lại, chỉ áp dụng.

## 1. Vị trí và bất biến

```text
Assignment -> Run -> RunHandle(s)
                  -> RunResult
```

```text
runId là execution identity và launch identity (Run contract §Run Phases).
RunHandle là operational locator + capability handle.
Pane id / pid chỉ là một field locator bên trong RunHandle.
```

RunHandle thuộc **runtime/dispatch infra** dưới Agent Coordination, cạnh
Run/RunResult, ngoài protocol graph. Core coordination chỉ tham chiếu
`Assignment`, `Run`, `RunResult`, evidence, protocol/operation state — không
biết tmux pane, terminal title, pid tree, hay runtime chrome nào.

Run là đơn vị admission ([Run contract](../contracts/assignment-run-runresult.md)
§Run Phases And Admission). RunHandle được tạo ở phase `bound`, sau `launched`,
trước `delivered`. Mất handle không bao giờ là lý do admit Run mới.

## 2. Bug gốc → proof

Mỗi lỗi dogfood code-panel P01–P14 gắn đúng một proof; đây là DoD của doc.

| ID | Lỗi lịch sử | Giải pháp | Proof |
|---|---|---|---|
| F-a | Lead đóng nhầm pane vì dựa vào title/vị trí. | Mọi control đi qua guard; guard đọc Run state + handle theo exact `handleId`. | Close pane có handle `active` không kèm exact id → refused với `run-handle-active-close-refused`. |
| F-b | CLI cha bị kill vì RAM, pane vẫn sống, session driver mất state. | Binding ghi durable trước khi gửi prompt; resume đọc result → handle → mới dispatch. | Fixture: coordinator giả chết + handle inspect được → không redispatch, trả `attach`. |
| F-c | Dispatch timeout giả dưới tải cao, pane vẫn làm. | Timeout caller là fact về observer; execution state chỉ đổi khi adapter chứng minh. | Timeout + adapter `present` → `observation.freshness = stale`, execution state không đổi, không ghi failure. |
| F-d | Provider quota cần giữ pane để tiếp tục sau reset. | `execution: paused` + `pause.retryAfter`; guard refuse close paused. | Paused-limit pane không bị close; retry-after hết chỉ cho phép inspect lại. |
| F-e | Zero-output timeout không có output/commit. | Snapshot + delivery state phân biệt no-output launch hang với worker có tiến triển không ghi stdout. | Fixture zero output + `delivery: unknown` → classify `unknown`, snapshot được ghi trước classify. |
| F-f | Hai cơ chế background gây duplicate process. | Một Run chưa-settled per Assignment (Run contract) + controller lock per Run. | Hai controller cùng bind một Run → cái thứ hai `run-handle-lease-conflict`. |
| F-g | Lock "dispatch in flight" khó quan sát. | `list` trả handle đang chiếm cwd/Assignment. | `dispatch-in-flight` error in ra `handleId`/`runId` đang chiếm. |

Thêm hai proof không từ bug nhưng từ guarantee đã chốt: locator tái dùng (pane
id sau tmux restart / pid wrap) không bị control nhầm; `show` read-only không
ghi state.

## 3. Ranh giới (SRP)

Ba port + một application service. Đây là ranh giới logic; Rust có thể biểu
đạt bằng trait, không bắt buộc ba crate.

| Thành phần | Sở hữu | Không sở hữu |
|---|---|---|
| `RunHandleRepository` (port, persistence) | lưu/đọc handle với expected revision (CAS), controller lock acquire/release | inspect runtime, policy |
| `RuntimeControlPort` (port, adapter) | inspect / send-input / snapshot / rename / terminate trên một locator; validate locator shape; báo capability | quyết định có được phép làm không, ghi handle |
| `RunHandleGuard` (application service) | authority + precondition trước mọi control: đọc Run state, exact id, lock, revision, incarnation; ghi diagnostic refs; chuyển execution/attachment state | chọn executor, admit Run, normalize RunResult, recovery policy |
| Recovery planner (doc riêng) | chọn next action | — |

Guard không có recovery policy thứ hai. Guard không tạo Run.

**Writer hợp lệ:** dispatch adapter (lúc bind), supervisor/recovery (lúc inspect
đổi state), operator CLI (control có guard). Worker agent không được ghi handle
— worker chỉ ghi receipt/result theo contract Run.

**Node/Rust coexistence:** ai spawn thì sở hữu handle (`owner`); runtime kia
chỉ đọc. Reader không hiểu `contract` version phải từ chối rõ, không tự diễn
giải.

## 4. Contract v1

Chữ ký TypeScript là minh họa ngôn ngữ-độc-lập; wire/persistence schema chỉ
chuẩn hóa ở boundary lưu lâu dài (file handle) và trao đổi (CLI JSON).

### 4.1 RunHandle

```ts
interface RunHandleV1 {
  contract: 'run-handle.v1';
  id: string;                      // rh_<ulid>
  revision: number;                // CAS; mọi write mang expected revision
  subject: RunHandleSubjectV1;
  runtime: RuntimeLocatorV1;
  owner: RunHandleOwnerV1;         // ai spawn / ai đang giữ binding
  role: 'driver' | 'observer' | 'replacement';
  capabilities: RunHandleCapability[];   // adapter khai; không phải permission
  execution: ExecutionStateV1;     // worker đang làm gì (theo adapter)
  attachment: AttachmentStateV1;   // observer/gateway còn nối không
  observation: ObservationV1;      // dữ kiện mới tới đâu, từ đâu
  delivery: 'not-sent' | 'sent' | 'unknown';
  pause?: RunHandlePauseV1;
  lock?: ControllerLockV1;
  diagnosticRefs?: DiagnosticRefV1[];
  displayName: string;
  labels?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}
```

Ba trạng thái trực giao, có thể đồng thời đúng (`paused` + `detached` + stale):

```ts
type ExecutionStateV1 =
  | 'launching' | 'running' | 'paused' | 'unknown' | 'terminated';
type AttachmentStateV1 = 'attached' | 'detached';
interface ObservationV1 {
  observedAt: string;
  source: RunHandleOwnerV1;
  adapterStatus: 'working' | 'idle' | 'blocked' | 'absent' | 'unknown';
  freshness: 'fresh' | 'stale';    // theo policy max-age; stale ≠ dead
  outputBytes?: number;
  lastOutputAt?: string;
}
```

`adapterStatus: idle` không bao giờ nghĩa là Run done. `absent` một lần không
nghĩa là dead — rule "unknown ≠ absent, died cần absent liên tiếp, blind
interval không tính stale" là của signal ladder
(`src/runner/dispatch/liveness.mjs`, xem [Executor Fallback](executor-health-and-fallback.md) §4);
RunHandle chỉ ghi reading, không tự kết luận.

### 4.2 Subject

```ts
interface RunHandleSubjectV1 {
  type: 'assignment-run';
  assignmentId: string;
  runId: string;                   // launch identity
  attempt: number;
  coordinationId?: string; actorId?: string; operationId?: string; nodeId?: string;
  executorId: string;
  cwd: string; runDir: string;     // canonical, do dispatch resolver cấp; không nhận từ worker
}
```

`assignmentId`/`runId` là identity; các field còn lại là context hiển thị,
không phải điều kiện quorum.

### 4.3 RuntimeLocator và incarnation

```ts
interface RuntimeLocatorV1 {
  adapter: string;                 // namespaced, versioned: 'fgos.herdr-pane@1', 'fgos.process@1'
  locator: Record<string, unknown>; // opaque theo adapter; adapter validate
}
```

Danh sách adapter không nằm trong common contract; thêm plugin không sửa
contract này. Unknown adapter: đọc metadata được, control bị refuse
`run-handle-control-unsupported`.

**Rule incarnation:** locator phải unique trong đời máy/server, và adapter
kiểm lại trước mọi control destructive. Không cần field generic:

| Adapter | Locator | Incarnation |
|---|---|---|
| `fgos.herdr-pane@1` | `gateway, session, window, paneId, agentSessionId` | `agentSessionId` (herdr cấp, không tái dùng) |
| `fgos.process@1` | `pid, pgid, startTime` | `pid + startTime` (từ `/proc`) |
| `remote-job` (tương lai) | `provider, jobId, url` | `jobId` |

### 4.4 Owner và controller lock

```ts
interface RunHandleOwnerV1 { kind: 'dispatch-adapter' | 'supervisor' | 'operator-cli' | 'gateway'; id: string; runtime: 'node' | 'rust'; }
interface ControllerLockV1 { holder: RunHandleOwnerV1; acquiredAt: string; expiresAt: string; purpose: 'drive' | 'terminate' | 'recover'; }
```

Lock chỉ cho control cần một chủ (drive, terminate, recover). Observer không
cần lock. Default = lock file per Run theo pattern exclusive-create đã có trong
repo (holder + expiry + stale-by-pid). Lock nội bộ chỉ bảo vệ control; effect
protection thuộc operation adapter (Run contract §Three guarantees).

### 4.5 Pause, diagnostic refs, lỗi

```ts
interface RunHandlePauseV1 { reason: 'provider-limit' | 'awaiting-operator' | 'transport-backpressure' | 'unknown'; retryAfter?: string; message?: string; }
interface DiagnosticRefV1 { kind: 'stdout-log' | 'stderr-log' | 'pane-snapshot' | 'process-info' | 'worker-result' | 'confinement-attestation'; path?: string; ref?: string; sha256?: string; capturedAt: string; }
```

`diagnosticRefs` là artifact chẩn đoán, không thỏa evidence policy của
RunResult; `worker-result` ref vẫn phải qua normalizer.

```ts
type RunHandleErrorCode =
  | 'run-handle-not-found' | 'run-handle-subject-mismatch' | 'run-handle-revision-conflict'
  | 'run-handle-lease-conflict' | 'run-handle-incarnation-mismatch'
  | 'run-handle-inspect-unsupported' | 'run-handle-control-unsupported'
  | 'run-handle-active-close-refused' | 'run-handle-locator-invalid'
  | 'run-handle-adapter-failed' | 'run-handle-version-unsupported';
```

Error có `code`, `message`, `handleId?`, `runId?`, `assignmentId?`,
`recoverable: boolean`. Consumer rẽ theo `code`.

## 5. Ports

```ts
interface RunHandleRepository {
  put(handle: RunHandleV1, expectedRevision: number | null): RunHandleV1;   // CAS
  get(handleId: string): RunHandleV1 | null;
  list(filter: { runId?; assignmentId?; cwd?; execution?; adapter? }): RunHandleV1[];
  acquireLock(handleId, holder, purpose, ttlMs): ControllerLockV1;       // atomic
  releaseLock(handleId, holder): void;
}

interface RuntimeControlPort {
  adapter: string;
  validateLocator(locator): void;
  inspect(locator): Promise<{ status: ObservationV1['adapterStatus']; incarnationOk: boolean; raw? }>;
  sendInput(locator, input, opts: { idempotencyKey; signal }): Promise<{ delivery: 'sent' | 'unknown' }>;
  snapshot(locator): Promise<DiagnosticRefV1[]>;
  rename(locator, displayName): Promise<void>;
  terminate(locator, policy: { graceMs; force }): Promise<{ outcome: 'stopped' | 'unknown' }>;
}
```

Control là typed request/result/error, async, có cancellation và idempotency
key. Adapter khai `capabilities`; khai được không đồng nghĩa caller được phép —
Guard quyết.

**Guard (application service):**

- `bind(run, locator, owner)` — ghi handle trước khi gửi prompt; fail → dispatch
  refuse/degrade rõ, không spawn interactive run không có handle.
- `inspect(handleId, { refresh })` — `refresh: false` là pure read (`show`),
  không ghi. `refresh: true` gọi adapter, kiểm incarnation, ghi observation.
- `deliver(handleId, input)` — cần lock `drive`; ghi `delivery` theo kết quả.
- `terminate(handleId, { exactId, force })` — thứ tự: đọc RunResult/receipt →
  nếu Run settled cho phép → nếu active/unknown yêu cầu exact id → paused
  provider-limit refuse trừ force → kiểm revision + incarnation → snapshot →
  terminate → ghi `execution: terminated` chỉ khi adapter xác nhận `stopped`.
- `detach/reattach(handleId)` — đổi `attachment`, không đổi `execution`.

## 6. Lifecycle

Execution × attachment tách nhau; bảng dưới là transition execution:

| From | To | Trigger |
|---|---|---|
| launching | running | adapter inspect thấy worker nhận việc |
| running | paused | provider limit / operator pause |
| paused | running | inspect sau retryAfter thấy tiến triển (retry-after hết chỉ cho phép inspect) |
| running/paused | unknown | inspect fail hoặc absent chưa đủ ngưỡng ladder |
| unknown | running | inspect thành công + incarnation khớp |
| any | terminated | guarded terminate xác nhận `stopped`, hoặc ladder kết luận `died` |

Cấm: handle → `settled`/`failed` (thuộc Run/RunResult); `paused → terminated`
không có explicit intent; `unknown → terminated` chỉ vì hết retry-after.

## 7. Thứ tự recovery

Theo Run contract: (1) worker result/receipt trong runDir/outbox → normalize;
(2) chưa có result → đọc handle, `inspect({refresh: true})`; (3) worker sống →
attach/observe, không dispatch; (4) ladder kết luận died/lost và không có result
→ classify, để Continuation Planner/Fallback quyết; (5) không có handle → ghi
`run-handle-missing`, vẫn KHÔNG tự admit Run mới.

## 8. Default implementation

- **Adapter:** `fgos.herdr-pane@1` (herdr-spawn trong code-panel). `fgos.process@1`
  cho `cli-spawn` là slice sau, cùng contract.
- **Persistence:** một file `run-handle.json` trong `runDir` của Run. Index
  by-run = runDir, by-assignment = assignment dir, by-locator = scan. Không
  có lớp index riêng. Ghi atomic temp+rename theo chuẩn repo; không tạo file
  rỗng rồi ghi sau (race P12).
- **Lock:** lock file per Run, pattern exclusive-create đã có.
- **Multiplicity:** contract cho nhiều handle per Run (`role`); default một
  handle, replacement sau gateway restart = handle mới `role: replacement`,
  handle cũ `attachment: detached`.
- **Display name:** `<roleShort> <opShort> <coordShort> <asgnShort> <runShort>`,
  ví dụ `RT op_107 c_8fa asgn_01wf run_02`. Canonical assignment/run path không
  đổi; alias chỉ là convenience.

Slices: R1 bind + label + read-only list/inspect; R2 close guard; R3 recovery
integration (resume đọc handle, in-flight error in handle, timeout snapshot);
R4 process adapter.

Doctor/setup: R1 không thêm config key; doctor thêm read-only check: handle
store writable, herdr adapter available khi có herdr executor, stale-handle
summary. Thêm config/env/dir mới thì phải đăng ký `fgos setup`/`fgos doctor`.

## 9. Deferred (contract đã chừa chỗ)

- Distributed lease nhiều máy, renew bởi supervisor sống qua cái chết CLI.
- Field `incarnation` generic cho container/remote-job.
- Archive/retention của handle cũ; audit log mirror.
- Web dashboard cho handle list và guarded close.
- Security model cho remote locator.

## 10. Con trỏ

- [Run contract](../contracts/assignment-run-runresult.md) — phases, admission, ba guarantee.
- [Runtime Model](runtime-model.md) — Assignment → Run → RunResult.
- [Visibility And Herdr](visibility-and-herdr.md) — herdr là observability, không phải truth.
- [Executor Fallback](executor-health-and-fallback.md) — ladder classification và fallback.
- [Continuation Planner](coordination-continuation-recovery.md) — next action sau recovery.
- [Agent Confinement Authority](../../../specs/confinement-authority.md) — enforcement quanh spawn; handle tham chiếu attestation, không thay thế.
