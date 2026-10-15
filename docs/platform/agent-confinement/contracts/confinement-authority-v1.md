# Added in candidate: confinement authority v1

```txt
Document type: Contract
Audience: Documentation migration reviewer, maintainer, agent
Purpose: Preserve mapped legacy content for independent conservation review
Design status: Candidate
Implementation: Carriage only; current implementation truth is not certified
Provenance: docs/specs/confinement-authority.md at 111adc51fd047d99121fd9d076eb4794c87045a4
Writer type: Agent draft writer
Canonical: No
Canonical for: None; candidate only
Use this when: Reviewing carriage, placement and source conservation
Do not use this for: Current canonical authority or implemented-behavior proof
Last reviewed: Not independently reviewed; authored 2026-10-15
Related:
- docs/specs/confinement-authority.md
Supersedes: None; candidate only
Superseded by: None
```

> Added in candidate: Candidate metadata and placement scaffolding. New subdivision authorized by Step 8 and constitution kind placement. Original heading levels and numbers are retained. Legacy authority remains unchanged; source wording is preserved for conservation, including known stale assertions.

## 6. Canonical contracts

Đây là contract đích. Default implementation có thể chỉ chấp nhận tập con ghi
tại §9, nhưng mỗi field đã ship phải giữ đúng nghĩa dưới đây.

### 6.1 `ConfinementPolicy`

Policy nói **cần bảo vệ gì**, không nói dùng argv nào.

```ts
type ConfinementMode = 'required' | 'preferred' | 'unconfined';

interface ConfinementPolicyV1 {
  contract: 'confinement-policy.v1';
  controls: {
    hostWrite: 'deny' | 'allow';
    hostRead: 'deny' | 'blind' | 'allow';
    networkEgress: 'deny' | 'allow' | 'filtered';
    process: 'isolated' | 'host';
    home: 'private' | 'host';
    session: 'isolated' | 'shared';
    workspace: 'own' | 'shared';
  };
  grants: ResourceGrantV1[];
  networkFilter?: NetworkFilterV1;
}

interface NetworkFilterV1 {
  defaultAction: 'deny';
  allow: Array<{
    protocol: 'tcp' | 'udp';
    destination: { kind: 'dns' | 'cidr'; value: string };
    ports: number[];
  }>;
}

type CapabilityConfinementConfigV1 =
  | {
      mode: 'required' | 'preferred';
      policy: string;
      allowInvocationOverride?: boolean;
    }
  | {
      mode: 'unconfined';
      allowInvocationOverride?: false;
    };

interface ResolvedConfinementRequirementV1 {
  mode: ConfinementMode;
  policyId: string | null;
  policy: ConfinementPolicyV1 | null;
}

interface InvocationConfinementOverrideV1 {
  // Chỉ capability công bố cho phép override mới được nhận shape này.
  controls?: Partial<ConfinementPolicyV1['controls']>;
  networkFilter?: NetworkFilterV1;
  // Chỉ bỏ grant hoặc thu hẹp access của capability policy.
  grants?: ResourceGrantV1[];
  mode?: 'required' | 'preferred';
}

type CoverageStatus = 'satisfied' | 'unsatisfied' | 'unknown';

interface ResourceGrantV1 {
  resource: string;
  access: 'read' | 'write' | 'read-write';
  scope: 'dispatch';
  // Defaults to true: an unavailable optional resource is unverified, not a refusal.
  optional?: boolean;
}
```

Thứ tự mức bảo vệ cố định theo từng control: `hostWrite deny > allow`,
`hostRead deny > blind > allow`, `networkEgress deny > filtered > allow`,
`process isolated > host`, `home private > host`, `session isolated > shared`,
và `workspace own > shared`. Override chỉ hợp lệ khi mỗi control bằng hoặc
mạnh hơn minimum. `allow`, `host`, `shared` là không đòi hạn chế trên trục đó,
không phải yêu cầu backend phải mở quyền; effective controls ghi hành vi thật.
Grant là giới hạn quyền tối đa: có thể bỏ grant hoặc thu `read-write` thành
`read`/`write`, không được thêm quyền. Binding phụ thuộc grant đã bỏ phải được
bỏ cùng; resource bắt buộc để đáp ứng control (như private home) vẫn phải tồn
tại, nếu không Authority refuse. Field override vắng thì giữ minimum.
`allowInvocationOverride` mặc định false; mode chỉ được giữ nguyên hoặc nâng
`preferred` thành `required`. Authority validate trước backend assessment.

`networkFilter` bắt buộc đúng khi networkEgress là filtered; các mode khác
không nhận field này. DNS là tên chính xác đã normalize, không wildcard; CIDR
phải canonical, port là số 1–65535, danh sách không có phần tử trùng. Rule là
allowlist, phần còn lại deny. Override filtered chỉ được giữ hoặc bỏ rule và
thu tập port; đổi destination phải refuse dù người gọi cho rằng tương đương.
Nâng filtered thành deny bỏ filter; nâng allow thành filtered phải cấp filter.
Driver phải công bố cách enforce DNS resolution và chặn kết nối ngoài rule;
không có proof tương ứng thì unsupported. V1 không ngầm hỗ trợ L7/URL filtering.

`resource` là tên ngữ nghĩa, ví dụ `workspace`, `run-output`,
`executor-credentials` hay `private-home`. Policy không chứa absolute path hay
tên provider.
Resource resolver của dispatch mới được đổi `run-output` thành `runDir` cụ thể,
sau khi canonicalize và kiểm tra ownership.

`policy` trong capability là ID của policy chuẩn hoặc custom policy, không phải
backend ID. `unconfined` là quyết định tường minh và không nhận `policy`; nó
không phải giá trị mặc định do thiếu config và vẫn sinh attestation.
Sau resolution, `required|preferred` bắt buộc có cả `policyId` và full `policy`;
`unconfined` bắt buộc cả hai là `null`.

### 6.2 Nơi đặt policy

- Capability khai minimum policy nó cần.
- Executor tham chiếu đúng một backend instance, không khai minimum policy.
- Machine registry khai các backend instance có trên machine và cấu hình riêng
  của chúng. Nó không chọn backend mặc định thay executor.
- Invocation override có shape `InvocationConfinementOverrideV1`; chỉ capability
  nào công bố cho phép override mới được nhận nó. Override chỉ thu hẹp grant,
  hoặc chọn control bảo vệ hơn; nó không được thêm grant, hạ control, đổi policy
  ID hay chuyển `required` thành `preferred`/`unconfined`. `preferred` cũng không
  được chuyển thành `unconfined`. Không có override thì dùng nguyên minimum.
- Khi strict mode đã bật, capability thiếu policy tường minh là config error,
  không rơi về global executor với posture không biết.

Capability anchor là key resolver tra trong runner.capabilities, gồm purpose
và tên stage-skill do skillForStage trả về, không chỉ nhãn decide --for.
Resolver phải mang key gốc tới Authority kể cả fallback executor. Gọi trực tiếp
executor ID phải cung cấp capability anchor hoặc explicit requirement từ caller
tin cậy; không suy minimum từ executor.for có thể chứa nhiều capability.

Config đích `runner.confinement.strict: boolean` mặc định false trong migration
S1–S2; S4 chỉ được kích hoạt sau khi chuyển true và mọi anchor đã khai báo.
False chỉ cho phép omission legacy với outcome unknown và warning, không thay
nghĩa required. Setup đăng ký default; doctor check
`confinement-policies-declared` liệt kê anchor thiếu, và kiểm tra migration
readiness trước strict flip. Đây là config mới cần đăng ký distribution trước
implementation, không phải cờ đã tồn tại trong code hiện tại.

Bất biến cấu hình:

```text
Một capability -> một minimum policy
Một executor -> không quá một backend instance
Một dispatch -> một executor -> không quá một backend instance
Backend không đủ -> refuse/degrade theo policy, không tự fallback
```

Executor được phép không khai backend để phục vụ capability `unconfined`. Nếu
mode là `required`, thiếu backend luôn dẫn tới refusal trước spawn; nếu là
`preferred`, kết quả chỉ có thể là `degraded` với mismatch tường minh.
`unconfined` luôn đặt runtime `backendId: null`, kể cả executor có backend; đây
là opt-out có chủ ý và attestation phải ghi lại. Với `required|preferred`,
`backendId` luôn được copy từ executor đã resolve, không lấy từ machine default.

Ví dụ đích:

```yaml
capabilities:
  code:review:
    prefer: codex-bwrap
    confinement:
      mode: required
      policy: host-write-denied

executors:
  codex-bwrap:
    providerModel: openai-codex
    confinement:
      backend: bwrap
```

`host-write-denied` là policy chuẩn do fgOS cung cấp. Common case không cần khai
toàn bộ threat axes. Khi cần policy riêng, user thêm một entry có full
`ConfinementPolicyV1` vào `confinementPolicies` và vẫn tham chiếu bằng cùng
field `policy`; không có syntax thứ hai ở capability.

Built-in `host-write-denied` có definition versioned do fgOS sở hữu:

```yaml
contract: confinement-policy.v1
controls:
  hostWrite: deny
  hostRead: allow
  networkEgress: allow
  process: host
  home: host
  session: shared
  workspace: shared
grants:
  - { resource: run-output, access: write, scope: dispatch }
  - { resource: private-home, access: read-write, scope: dispatch }
  - { resource: executor-credentials, access: read, scope: dispatch }
```

Đổi nghĩa một built-in policy là breaking contract; muốn posture khác phải thêm
policy ID mới. Full definition luôn được ghi vào request/attestation, vì vậy
evidence không phụ thuộc catalog hiện tại khi được đọc lại sau này.

Built-in `workspace-write` có cùng controls và grants như host-write-denied,
thêm `workspace: read-write` và `workspace-git-metadata: read-write` (scope
dispatch). hostWrite vẫn deny ngoài grant, không đổi thành allow. Grant là
quyền tối đa; chỉ resolve/cấp tài nguyên thực sự cần theo resourceNeeds.
Hai built-in cho phép private-home nhưng không bắt dùng: provider normalizer
khai need/binding khi CLI cần home ghi được. home host không có nghĩa cấp quyền
ghi host home. Credential/plugin/config đọc từ host qua hostRead allow; provider
phải chứng minh cách load khi dùng private home, không tự copy toàn bộ home.

Grant mặc định là optional khi runtime không resolve được resource đó: coverage
của grant là `unverified`, không biến cả required dispatch thành refusal. Caller
có thể đặt `optional: false` trên grant của policy riêng để biến absence thành
mismatch/refusal. Hai built-in giữ credentials optional để required mode usable
trên máy chưa có credential source.

Machine registry tương ứng:

```yaml
confinementBackends:
  bwrap:
    type: bwrap
    executable: /usr/bin/bwrap
    tempRoot: /var/tmp/fgos
```

`bwrap` ở đây vừa là backend instance ID người vận hành thấy, vừa là driver type
cho common case. Nếu cần hai instance cùng type, dùng ID rõ nghĩa như
`workstation-bwrap` và `ci-bwrap`; mỗi entry vẫn khai `type: bwrap`.

`confinementBackends` không chỉ bật/tắt backend. Mỗi entry chứa custom deployment
config và được validate bằng schema của `type` tương ứng. Ví dụ `bwrap` có thể
nhận `executable`, `tempRoot`, `privateHomeRoot`; backend container có thể nhận
`runtime`, `image`, `pullPolicy`. Secret chỉ xuất hiện dưới dạng reference,
không chứa credential value trực tiếp.

Không đặt policy, capability hay executor routing trong backend config. Không
đặt backend default ở cấp machine. Một field `enabled: false` có thể chủ động
vô hiệu hóa instance, nhưng trạng thái thực sự dùng được phải do `fgos doctor`
kiểm tra, không do `enabled: true` tự khẳng định.

Built-in driver config dùng discriminated schema; đây là config deployment,
không phải lời tự khai về security capability:

```ts
interface MachineConfinementRegistryV1 {
  contract: 'confinement-backend-registry.v1';
  confinementBackends: Record<string, ConfinementBackendInstanceConfigV1>;
}

type ConfinementBackendInstanceConfigV1 =
  | {
      type: 'bwrap';
      enabled?: boolean;
      executable?: string;
      tempRoot?: string;
      privateHomeRoot?: string;
    }
  | {
      type: 'container';
      enabled?: boolean;
      runtime: 'docker' | 'podman';
      image: string;
      pullPolicy?: 'never' | 'if-missing' | 'always';
    }
  | {
      type: 'remote';
      enabled?: boolean;
      endpoint: string;
      credentialRef: string;
    };
```

Contract cho phép đăng ký driver type mới cùng schema riêng mà không đổi
`ConfinementPolicyV1`. Mỗi registry entry phải validate theo driver schema trước
khi executor được dùng. Năng lực thực tế như network isolation hay writable
mount support do driver implementation và doctor probe xác nhận, không phải
field boolean do người dùng tự khai.

#### 6.2.1 Trust boundary của backend registry

`confinementBackends` là machine state do `fgos setup`/`fgos doctor` quản lý,
không nằm trong project-over-global config merge. Project config được phép khai
policy, executor và tham chiếu backend instance ID, nhưng không được định nghĩa
hoặc ghi đè `type`, `executable`, runtime endpoint hay credential source của
backend instance.

Ranh giới này không thay đổi luật project config thắng global config: luật đó
vẫn áp dụng nguyên vẹn cho shared config schema. Backend registry là security
trust store riêng, tương tự machine capability state, không phải cấp config thứ
ba tham gia precedence. Đường dẫn lưu trữ là chi tiết của distribution/state
resolver; caller không được tự dựng path hay truyền registry document vào
Authority.

Project policy được coi là policy của người vận hành project đã tin cậy; nó có
thể yêu cầu bảo vệ cao hơn hoặc chọn `unconfined` một cách tường minh. Một repo
không tin cậy không được trở thành nguồn để giảm requirement của capability hoặc
thay machine registry. Nếu sản phẩm cần bảo vệ cả machine khỏi project config
độc hại, đó là trust profile riêng phải được thêm vào contract và backend.

Registry loader phải đọc và validate trọn document trước khi publish snapshot;
không dùng một phần registry khi một entry lỗi. Mỗi dispatch giữ một immutable
snapshot đến hết cleanup để config thay đổi giữa chừng không đổi backend đang
chạy. Default persistence có thể là file machine-local được setup quản lý;
contract không gắn caller với path của file đó.

Resolution có thứ tự cố định:

1. Merge shared global/project config theo distribution contract.
2. Resolver chọn executor theo contract dispatch hiện có.
3. Đọc singular `executor.confinement.backend`.
4. Authority lookup đúng instance ID đó trong machine registry đã validate.
5. Registry nội bộ lookup driver bằng `instance.type`; đây là lookup type đã
   công bố trong schema, không phải routing key mà user phải đoán.
6. Driver kiểm tra host + instance config + request có cover policy hay không.
7. Authority execute hoặc refuse/degrade theo mode; không thử instance thứ hai.

`enabled` mặc định là `true` khi entry tồn tại. Setup có thể tạo instance
`bwrap` thuận tiện trên machine hỗ trợ, nhưng đó chỉ là một entry có tên để
executor tham chiếu, không phải fallback/default selection rule.

Ba boolean `privateHome`, `isolatedSession`, `ownWorktree` hiện tại được
migrate thành các control tương ứng, không bị xóa nghĩa. Trong giai đoạn chuyển
tiếp, loader chấp nhận shape cũ, normalize thành policy v1 và cảnh báo nếu shape
cũ và mới mâu thuẫn.

Legacy permissionMode bypass vẫn yêu cầu privateHome, isolatedSession,
ownWorktree như validator hiện tại: normalize thành home private, session
isolated, workspace own và verify đầy đủ trước execute. hostWrite deny không
thay thế ba điều kiện này; default chưa hỗ trợ đủ thì refuse. Không suy bypass
từ argv provider để tự nới invariant. Mâu thuẫn legacy/new policy là config
error, warning không đủ nếu chọn một phía làm mất bảo vệ.

### 6.3 `ConfinementRequest`

Request là snapshot đầy đủ tại cửa runtime:

```ts
interface RuntimeResourceBindingV1 {
  resource: string;
  target:
    | { kind: 'env'; name: string }
    | { kind: 'argument'; token: string };
}

interface RuntimeResourceNeedV1 {
  resource: string;
  access: 'read' | 'write' | 'read-write';
}

interface ResourceResolverV1 {
  resolve(
    resource: string,
    context: ConfinementRequestV1['context'],
    providerSources: Readonly<Record<string, string>>,
  ): { identity: string; hostTargets: string[]; allocation: 'existing' | 'temporary' };
}

interface ResolvedResourceV1 {
  resource: string;
  identity: string;
  hostTarget: string | null;
  executionTarget: { location: 'host' | 'container' | 'remote'; path: string };
  delivery: 'direct' | 'mount' | 'copy';
  collect: 'none' | 'artifact' | 'workspace-change';
}

interface ConfinementRequestV1 {
  contract: 'confinement-request.v1';
  dispatchId: string;
  capability: string;
  executorId: string;
  invocation: {
    command: string;
    args: string[];
    env: Record<string, string>;
    adapter: string;
    resourceBindings: RuntimeResourceBindingV1[];
    // Remote adapter dùng transport, không spawn command/args.
    transport?: { kind: 'http'; method: string; url: string;
      headers: Record<string, string>; body?: string };
  };
  context: {
    cwd: string;
    repoRoot?: string;
    runDir: string;
    fgosDir?: string;
  };
  requirement: ResolvedConfinementRequirementV1;
  override?: InvocationConfinementOverrideV1;
  resourceNeeds: RuntimeResourceNeedV1[];
  backendId: string | null;
}
```

Mọi path phải absolute sau normalize. `runDir` bắt buộc với dispatch agent;
không backend nào được tự suy nó từ `.fgos/assignments` hay current working
directory. Request không chứa backend type hay raw backend config. Authority là
bên duy nhất resolve `backendId` từ machine registry, tránh để caller tiêm một
deployment config khác vào đúng cửa enforcement.

Mỗi binding phải tham chiếu resource được policy cho phép. `token` là placeholder
opaque đã có trong argv, không phải path. Authority/backend thay binding bằng
resolved target trong phase prepare; binding thừa, trùng target hoặc không có
grant tương ứng là `confinement-grant-invalid`.
`override` chỉ xuất hiện sau khi resolver đã kiểm tra
`allowInvocationOverride`; Authority vẫn validate lại partial order tại cửa
runtime.

`context` chứa path phía host. Authority resolve resource identity/host target;
driver đề xuất execution target và delivery bằng bước assessment không side
effect, Authority validate rồi đóng băng vào plan. Binding được materialize
bằng execution target, không dùng host path trên máy remote. Với copy, prepare
stage input trước spawn; sau execution phải collect output trước cleanup.
Workspace-change chỉ thu về artifact/patch, không tự ghi đè workspace host.
Collect thất bại là failed và giữ resource để recovery; backend không hỗ trợ
delivery/collect cần thiết phải refuse. Namespace và target phải thuộc dispatch,
không chấp nhận path/handle do agent tự khai là bằng chứng ownership.

`resourceNeeds` do provider normalizer diễn tả nhu cầu vận hành, không cấp quyền.
Mỗi need phải nằm trong grant tương ứng; mỗi binding phải có need tương ứng.
Run-output write là need bắt buộc của dispatch; private-home read-write là need
khi home private. Needs thiếu tài nguyên hoặc quyền thì refuse ở mọi mode.
Unconfined không so needs với policy null, nhưng vẫn validate target và delivery.

Authority sở hữu ResourceResolverV1 và validate output. run-output lấy từ runDir;
workspace lấy root workspace đã được dispatch xác nhận (không mặc định mọi cwd
là root); private-home nhận allocation identity từ backend temp-root config;
executor-credentials lấy path/reference từ provider normalizer tin cậy dùng
distribution resolver, không hardcode home hay nhận path do prompt cấp. Một
resource có nhiều hostTargets được expand thành nhiều ResolvedResourceV1 cùng
resource, khác identity; coverage resource là tổng hợp tất cả target.

Workspace worktree phải resolve .git bằng Git metadata, không đoán path bằng
chuỗi. workspace-git-metadata gồm per-worktree gitdir đã kiểm ownership;
common gitdir objects/refs có thể cần cho commit và là shared state, không tự
grant toàn common dir hoặc parent checkout. Readiness cho nhu cầu Git write
chỉ đạt khi backend có mapping hẹp đã probe, hoặc dùng isolated git storage.
Nếu chưa có, sửa file vẫn được nhưng nhu cầu commit phải refuse. Default test
phải chứng minh không sửa metadata worktree khác; hỗ trợ workspace-write không
đồng nghĩa mọi thao tác git/merge đều được cấp quyền.

### 6.4 `ConfinementPlan`

Compile plan là pure trên request và assessment snapshot đã resolve; kết quả
serializable, audit được trước side effect prepare (không phủ nhận I/O resolve):

```ts
interface ConfinementPlanV1 {
  contract: 'confinement-plan.v1';
  dispatchId: string;
  decision: 'execute' | 'refuse' | 'degrade';
  requested: ResolvedConfinementRequirementV1;
  coverage: Record<string, CoverageStatus>;
  resources: ResolvedResourceV1[];
  readiness: Record<string, CoverageStatus>;
  grants: Array<{
    resource: string;
    access: string;
    resolvedTarget: string;
  }>;
  backend: {
    id: string;
    type: string;
    version: string;
    configDigest: string;
  } | null;
  mismatches: Array<{ code: string; detail: string }>;
}
```

Plan không chứa credential value. `resolvedTarget` có thể bị redact trong event
public, nhưng run record cục bộ phải đủ thông tin để audit grant.
`grants[].resolvedTarget` là executionTarget.path của entry cùng resource trong
resources; identity/location nằm ở resources, không suy từ string path.

`required` cộng bất kỳ control nào `unsatisfied|unknown` dẫn tới
`refuse`; grant optional không resolve là ngoại lệ hẹp: nó là `unverified`
nhưng không mismatch. `preferred` có thể dẫn tới `degrade`, nhưng phải có mismatch và
attestation. `coverage` phải có entry cho toàn bộ control và grant trong
`requested.policy`; thiếu entry là `unknown` và bị từ chối trong `required`.
Không có degrade âm thầm.

Coverage dùng key `control:<name>` và `grant:<resource>`, mỗi resource chỉ có
một grant. Grant coverage satisfied nghĩa là quyền thực tế không vượt giới hạn,
không có nghĩa đủ quyền chạy việc. Readiness dùng key resource từ resourceNeeds:
satisfied khi nhu cầu thực thi được cấp đủ. Readiness unsatisfied/unknown luôn
refuse, kể cả preferred. Backend cấp read cho grant read-write vẫn có thể đạt
coverage, nhưng need write sẽ không đạt readiness. Grant là exception của deny;
khi trục hostRead/hostWrite là allow, grant không tạo deny ngầm trên trục đó.

### 6.5 Backend port

Driver chỉ assess control/grant thuộc backend; Authority điền context coverage
session/workspace và readiness chung trước compile. Thiếu entry => unknown áp
dụng sau bước hợp này, không bắt driver tự xác nhận context.

```ts
interface ResolvedBackendInstanceV1 {
  id: string;
  type: string;
  config: Readonly<Record<string, unknown>>;
}

interface BackendAssessmentV1 {
  coverage: Record<string, CoverageStatus>;
  resources: ResolvedResourceV1[];
  readiness: Record<string, CoverageStatus>;
  mismatches: Array<{ code: string; detail: string }>;
}

interface ConfinementBackendRegistryV1 {
  resolve(instanceId: string): ResolvedBackendInstanceV1 | null;
}

interface ConfinementBackendDriverV1 {
  type: string;
  version: string;
  validateConfig(config: unknown): BackendConfigValidation;
  assess(
    request: ConfinementRequestV1,
    backend: ResolvedBackendInstanceV1,
  ): BackendAssessmentV1;
  prepare(
    plan: ConfinementPlanV1,
    request: ConfinementRequestV1,
    backend: ResolvedBackendInstanceV1,
  ):
    Promise<PreparedConfinementV1>;
}

interface PreparedConfinementV1 {
  invocation: ConfinementRequestV1['invocation'];
  contextPatch?: Record<string, unknown>;
  claims: Record<string, CoverageStatus>;
  cleanup(): Promise<void>;
}

```

Nếu `prepare` tạo được resource rồi thất bại, driver phải throw lỗi typed có
`cleanup` handle; Authority gọi handle đó trong `finally`. Cancel, timeout,
spawn failure và process crash đều đi qua cùng đường cleanup. Mismatch phát hiện
sau spawn là `confinement-violation`/`confinement-execution-failed` và không thể
đổi thành refusal hồi tố. Authority ghi attestation `failed` cùng execution
error và cleanup result. Đây là đường xử lý khi process Authority còn sống;
Authority crash được phục hồi theo recovery profile ở §8.6.

Chỉ backend driver `type` đăng ký qua allowlist trong code. Backend instance ID
và config nằm trong machine registry, vì vậy người vận hành có thể đọc và tham
chiếu nó trực tiếp nhưng project caller không thể thay thế nội dung. Driver
schema phải từ chối key lạ. `assess` chỉ báo coverage và mismatch; Authority mới
sở hữu quyết định `execute|refuse|degrade` và compile `ConfinementPlanV1`.
`prepare` không được spawn agent. Authority so claims của kết quả prepare với
plan trước khi gọi adapter.

Mỗi dispatch dùng đúng một backend instance. Một driver có thể phối hợp nhiều
primitive nội bộ để thực hiện filesystem, home, process hoặc network control,
nhưng không phơi composition đó thành array/strategy trong executor config.
Nếu backend đã chọn không cover policy, `required` phải refuse; Authority không
tự đổi sang backend khác.

Backend driver không được branch theo `executorId`, `providerModel`, Codex,
Claude hay agent type khác. Nó chỉ nhận invocation, resolved semantic grants và
control chuẩn. Provider adapter/normalizer chịu trách nhiệm diễn tả nhu cầu đặc
thù thành binding chuẩn trước cửa, ví dụ bind resource `private-home` vào env
`CODEX_HOME`; Authority resolve resource, còn backend chỉ áp dụng binding đã
được duyệt. Nhờ vậy bỏ provider recipe mà không giấu recipe thành `if` trong
driver.

### 6.6 `ConfinementAttestation`

```ts
interface ProbeFingerprintV1 {
  policyDigest: string;
  driverVersion: string;
  backendConfigDigest: string;
  platformDigest: string;
  providerCliDigest?: string;
  credentialLoadingDigest?: string;
  invocationTemplateDigest?: string;
  proofProfile: string;
}

interface AdapterReceiptV1 {
  contract: 'confinement-adapter-receipt.v1';
  dispatchId: string;
  preparedInvocationDigest: string;
  executionId: string;
  state: 'started' | 'stopped' | 'unknown';
}

interface ConfinementAttestationV1 {
  contract: 'confinement-attestation.v1';
  dispatchId: string;
  phase: 'prepared' | 'completed' | 'failed' | 'refused';
  outcome: 'enforced' | 'unconfined' | 'degraded' | 'refused' | 'unknown';
  requested: ResolvedConfinementRequirementV1;
  coverage: Record<string, CoverageStatus>;
  effectiveControls: Partial<ConfinementPolicyV1['controls']>;
  resources: ResolvedResourceV1[];
  readiness: Record<string, CoverageStatus>;
  channels: Array<{
    name: 'filesystem' | 'inherited-fd' | 'stdio' | 'host-ipc' | 'network';
    coverage: 'covered' | 'out-of-scope' | 'unknown';
    detail: string;
  }>;
  receipt: AdapterReceiptV1 | null;
  backend: {
    id: string;
    type: string;
    version: string;
    configDigest: string;
  } | null;
  grants: Array<{ resource: string; access: string; target: string }>;
  mismatches: Array<{ code: string; detail: string }>;
  evidence: Array<{
    kind: 'falsification-probe' | 'structural-observation' | 'post-check';
    ref: string;
    freshness: 'current' | 'stale' | 'not-run';
    fingerprint?: ProbeFingerprintV1;
  }>;
  cleanup: { status: 'not-needed' | 'pending' | 'completed' | 'failed'; error?: string };
}
```

`prepared` chỉ nói invocation đã được Authority dựng; không được đổi tên thành
`verified`. `completed` ghi execution outcome và post-check nếu có. `failed`
ghi execution hoặc cleanup failure sau khi đã prepare; `refused` ghi quyết định
không spawn. `enforced` chỉ hợp lệ khi mọi control/grant yêu cầu có coverage
`satisfied`, claims khớp plan, adapter đã chạy invocation đã prepare, và evidence
cần thiết là `current`. Nếu một phần không thể xác định thì outcome là
`unknown`; `required` trong trạng thái đó phải refuse nếu trạng thái được biết
trước spawn. Nếu unknown chỉ xuất hiện sau spawn, đó là execution failure và
không thể đổi thành refusal hồi tố. Chỉ probe độc lập mới
được ghi evidence `falsification-probe`; đọc lại argv chỉ là
`structural-observation` và không thể một mình nâng outcome lên `enforced`.

Trước spawn, `required` cần assessment đủ coverage, prepare claims khớp plan
và chứng nhận probe độc lập còn hiệu lực; chưa cần bằng chứng agent đã chạy.
Sau spawn, adapter receipt gắn dispatch id và digest prepared invocation là
structural evidence bổ sung để kết luận `enforced`, không thay thế probe.
`prepared` với mode required ghi outcome `unknown` vì execution chưa xảy ra;
điều này không đồng nghĩa assessment coverage là unknown.

Proof profile đăng ký trong code quyết định fingerprint component bắt buộc.
`local-bwrap-v1` yêu cầu policy, driver version, backend config, platform digest
(kernel/bwrap); readiness recipe dùng provider CLI/credential-loading/invocation
digest khi kết quả phụ thuộc chúng. Không được bỏ dependency thực sự để tránh
stale. Path runtime chuẩn hóa theo resource identity. Component bắt buộc đổi
thì proof tương ứng stale; component không áp dụng không cần giá trị giả.
Authority tự chạy lại probe đã đăng ký khi stale trước required spawn, dùng
single-flight/cache theo fingerprint, timeout hữu hạn, và ghi evidence mới.
Probe fail/timeout thì refuse có lý do; không cần người chạy doctor để đi tiếp
khi probe có thể tự thành công. Doctor dùng cùng harness và giải thích lỗi.
Tính độc lập là test input/assertion không lấy kết quả mong đợi từ claims của
driver; không phụ thuộc ai khởi chạy probe. Backend không tự chứng nhận mình.

Falsification-probe evidence bắt buộc có fingerprint; receipt do trusted adapter
phát, không lấy từ stdout của agent. Platform digest gồm kernel/runtime và
sandbox binary/image theo proofProfile. Evidence ref trỏ tới record versioned
do Authority kiểm tra; thiếu component bắt buộc theo proofProfile không được current.
Channels luôn có đủ năm entry trên; out-of-scope không được dùng để miễn
filesystem hay inherited-fd khi hostWrite deny. Violation đã xác nhận ghi
phase failed, outcome degraded và mismatch; unknown dành cho thiếu bằng chứng.

Authority lưu plan, prepared record và terminal attestation vào machine state
store do host quản lý, mặc định ngoài project `.fgos/` và ngoài mọi write grant
của agent. Trước mỗi persist Authority kiểm tra containment hai chiều giữa store
và mọi resolved writable resource; bất kỳ overlap nào phải refuse, không được
ghi record vào vùng grant. Run-output chỉ chứa artifact của agent
và có thể chứa bản sao attestation, không phải durable truth. Event committed
chỉ chứa dispatch id, outcome, mismatch code và reference/digest tới record đã
redact; không chứa credential, raw env hay absolute sensitive path. Recovery
giữ record prepared chưa có terminal ở trạng thái unknown, không suy thành công.

### 6.7 Detector port

Detector là detective control độc lập với khai báo. Nó có thể nhận ra argv
`bwrap`, provider-native sandbox, writable mount bất thường hoặc adapter bỏ qua
prepared invocation. Detector:

- không được chọn backend;
- không được nâng `unknown` thành `satisfied`;
- không lấy expected result từ chính plan rồi tự xác nhận plan;
- chỉ phát observation/mismatch cho attestation và doctor.

### 6.8 Error taxonomy

| Code | Ý nghĩa | Xử lý |
|---|---|---|
| `confinement-policy-missing` | capability không có quyết định tường minh | refuse trong strict mode |
| `confinement-backend-registry-forbidden` | project config cố định nghĩa/override machine backend | config error |
| `confinement-backend-unknown` | backend instance không có trong machine registry hoặc driver type không ở allowlist | config error |
| `confinement-backend-missing` | required dispatch không có backend instance được executor chọn, hoặc instance không resolve được | refuse trước spawn |
| `confinement-backend-disabled` | backend instance được chọn nhưng bị machine registry vô hiệu hóa | refuse trước spawn |
| `confinement-mode-unsupported` | mode `preferred` chưa có backend path được hỗ trợ trong phase hiện tại | refuse trước spawn |
| `confinement-need-unsatisfied` | resource need bắt buộc không được plan/backend đáp ứng | refuse trước spawn |
| `confinement-unsupported` | host/backend không đáp ứng required control | refuse trước spawn |
| `confinement-grant-invalid` | resource không tồn tại, path thoát boundary, access sai | refuse trước spawn |
| `confinement-plan-mismatch` | prepared claims khác plan | refuse trước spawn |
| `confinement-observed-mismatch` | detector thấy thực tế khác khai báo | trước spawn: required refuse; sau spawn: failed và giữ evidence; observe chỉ ghi observation |
| `confinement-violation` | post-check/probe thấy vi phạm | execution failed, giữ evidence |
| `confinement-cleanup-failed` | resource tạm không dọn được | lỗi có tên; không nuốt |
| `confinement-execution-failed` | adapter/process thất bại sau prepare | failed, giữ execution error và attestation |

### 6.9 Kết quả của cửa Authority

Caller luôn nhận một shape duy nhất, kể cả khi agent không được phép chạy:

```ts
type ConfinementExecutionV1 =
  | {
      contract: 'confinement-execution.v1';
      status: 'completed';
      result: ExecutorResult;
      attestation: ConfinementAttestationV1;
    }
  | {
      contract: 'confinement-execution.v1';
      status: 'failed';
      result?: ExecutorResult;
      error: { code: string; message: string };
      cleanup: ConfinementAttestationV1['cleanup'];
      attestation: ConfinementAttestationV1;
    }
  | {
      contract: 'confinement-execution.v1';
      status: 'refused';
      error: { code: string; message: string };
      attestation: ConfinementAttestationV1;
    };
```

Lỗi lập trình hoặc hỏng hạ tầng ngoài taxonomy vẫn có thể throw, nhưng phải mang
`dispatchId`; nếu đã qua bước compile thì run record phải giữ được attestation
cuối cùng đã biết. Một refusal theo policy là kết quả có cấu trúc, không phải
stderr text để caller tự parse.
`result` của agent và trạng thái cleanup là hai giá trị độc lập: cleanup failure
không được xóa result, và result chưa rõ không được biến thành thành công chỉ vì
cleanup đã xong.

Union trên là contract nội bộ Authority, không bắt caller cũ đổi result shape.
Facade cho spawnWorker/executeExecutorCli giữ ExecutorResult và thêm attestation
khi thành công; refused/failed được chuyển thành DispatchError với code
confinement-* và details chứa dispatchId, attestation, result nếu có, cleanup.
CLI tiếp tục dùng error-envelope hiện hành; không tạo exit/error channel thứ hai.
Agent exit code khác zero vẫn là ExecutorResult theo adapter contract hiện tại,
không tự biến thành lỗi infrastructure của confinement.

### 6.10 Version và evolution

- Mỗi contract có version token riêng; consumer từ chối major version không biết.
- Schema runtime là closed shape: key lạ bị từ chối, không bị bỏ qua âm thầm.
- Thêm giá trị control hoặc đổi nghĩa field cần version mới. Thêm field optional
  chỉ được phép khi vắng field giữ nguyên nghĩa cũ.
- Backend driver version độc lập với contract version; đổi cách prepare
  invocation không bắt caller đổi policy, nhưng bắt chạy lại golden test, probe
  và doctor.
- Attestation lưu cả policy version, backend instance/config digest và driver
  version để evidence cũ không bị diễn giải bằng semantics mới.
- Shape legacy chỉ sống ở config-normalization boundary. Sau normalization, mọi
  module runtime chỉ thấy v1 canonical shape.
