# Bounded source review pack

Content commit: 1276467f37a99d19aff05808d42fafbf40341449
Author session: codex-session:unit-run-1792045007741-a245b0a6@2026-10-15
Shard: plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json
Shard SHA256: 3d2bbc942e416345213d8b225e43ee69a2f63149f6b8768e23017f5dc829ed68
Source: docs/specs/confinement-authority.md
Part 2/7; entries: **34**. All decisions remain pending.

Read review-brief.md, owner-answers.md (A19/A22/A28/A34/A36/A39), the frozen specs-ui map and minimum constitution. Verify all rows mechanically: full digest recomputation, anchor, ancestry, exact-proof thresholds and shard/pack equality. Independently choose and record the seed and IDs for at least 10/33 Weak-exact/Judgment rows (15%, minimum 10, all if fewer), plus all unequal pairs and generated no-target rows below. Read both directions with a diff; read generation provenance for no-target rows. More than 3% deep rework requires full-pack deep reading. No producer seed/draw/verdict. Retain separate script-exact stratified spot checks; ordinary source approval does not certify truth or eligibility.

A36 class lists and mandatory deep IDs:

```json
{
  "classes": {
    "Unit-exact": [
      "claim_d867754cefbf1a753fef272a57b00603"
    ],
    "Weak-exact": [
      "claim_3c32f6e251ad5b14894ad90eed79d494",
      "claim_aceb99e66710c74e37fffe44001f80df",
      "claim_7bf382199b928a3ab6f591dace5d4ba0",
      "claim_8a41f5ebfb682108b780226cb00a9720",
      "claim_621f64668264b6ed6d389e54e9757c75",
      "claim_fa68c61965120a25c91cdcf5fb53b908",
      "claim_468db5188d82a8173af30117b269e05a",
      "claim_373330f7e7533c795af584bab3dd5be6",
      "claim_c2fd6287ed90af9fd0a9588d1e0af4e8",
      "claim_72db8aa2341abee798ff2aa09f120129",
      "claim_0ad70a8bb3d703165ed3757c16d9eef6",
      "claim_c061feaa8e24659688ca80707d9a5952",
      "claim_709d3b396f94bb46538b3be750723b77",
      "claim_414314452db8243d0e4d144939e7747e",
      "claim_61f6287707c0668d5d6c402a69c693d2",
      "claim_c04f7a8ff0d5c8273209f2a742efe0c4",
      "claim_cf8d898c041074cd559527f9f320330d",
      "claim_4190bbef80014aeece619a82d678182a",
      "claim_a7e6bbbc506d7d77d7e8ce6bcf85db31",
      "claim_65d53f69b094914bb1ffe25a8e54402c",
      "claim_7a56441f60be947b5cbe5856d4c3128b",
      "claim_a93df57649380e87940372c1ae98bc14",
      "claim_096bfa1baf75a9eb27e5ed86313d18c0",
      "claim_7ef6fc6ee5c72cd61746952b1c926596",
      "claim_ee19375a832b214415316df2880b9d38",
      "claim_9747eeeefab2b4de2147cabdd10cf940",
      "claim_03ebfa4088b7739930c4cf656a755f6b",
      "claim_542bb522121735ddb090894820aef357",
      "claim_4425d37263ae0477205ac7493e0489a6",
      "claim_362e53bd4c41468d0f31bbaff3766062",
      "claim_85614de5b582dd7f646938bf02212fad",
      "claim_534f0deefbdb22153d1310a77bc908e8",
      "claim_23c306e93da431c5b58dc42eae67791c"
    ],
    "Judgment": []
  },
  "unequalDigestPairs": [],
  "noTargetGeneratedRows": [],
  "mandatoryDeep": []
}
```


Return Reviewer, Author session(s), Review mode: ordinary, immutable content/request/shard pins, and one row per claim. Use ok/rework/hold, an own note prefixed deep or mechanical, full 64-hex digests; literal none for absent target. Consolidate parts by original shard before applying.

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|


## claim_d867754cefbf1a753fef272a57b00603

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-30; lines 203–209; ancestry ["Spec: Agent Confinement Authority","5. Component boundary","5.2 Quy tắc dependency"].
Target: docs/platform/agent-confinement/spec.md#unheaded-block-32; ancestry ["Spec: Agent Confinement Authority","5. Component boundary","5.2 Quy tắc dependency"].
Source digest: f922c23605a7afcce50568cdb5592cf3aeabed7b4e80cb18c659f784cfd691f7
Target digest: f922c23605a7afcce50568cdb5592cf3aeabed7b4e80cb18c659f784cfd691f7
Shown source SHA256: f922c23605a7afcce50568cdb5592cf3aeabed7b4e80cb18c659f784cfd691f7
Shown target SHA256: f922c23605a7afcce50568cdb5592cf3aeabed7b4e80cb18c659f784cfd691f7

### Complete proposed decision

```json
{
  "claimId": "claim_d867754cefbf1a753fef272a57b00603",
  "sourceUnitDigest": "f922c23605a7afcce50568cdb5592cf3aeabed7b4e80cb18c659f784cfd691f7",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "unheaded-block-32",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-30 (source lines 203-209) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-32 (candidate lines 225-231). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "f922c23605a7afcce50568cdb5592cf3aeabed7b4e80cb18c659f784cfd691f7",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "5. Component boundary",
    "5.2 Quy tắc dependency"
  ]
}
```

### Full source shown text

```text
Adapter metadata có `locus: local-process | remote`. cli-spawn/herdr-spawn là
local-process; http là remote dù request được gửi từ host. Bwrap chỉ nhận
local-process, không coi việc bọc HTTP client là confine remote agent.
In-process Agent/Task tool nằm ngoài execution authority này: dispatch ghi
`authorityScope: external-harness`, attestation null, không gọi đó là unconfined.
Capability required không được dispatch in-process khi chưa có trusted harness
attestation contract đáp ứng policy; phải refuse thay vì bỏ requirement.
```

### Full target shown text

```text
Adapter metadata có `locus: local-process | remote`. cli-spawn/herdr-spawn là
local-process; http là remote dù request được gửi từ host. Bwrap chỉ nhận
local-process, không coi việc bọc HTTP client là confine remote agent.
In-process Agent/Task tool nằm ngoài execution authority này: dispatch ghi
`authorityScope: external-harness`, attestation null, không gọi đó là unconfined.
Capability required không được dispatch in-process khi chưa có trusted harness
attestation contract đáp ứng policy; phải refuse thay vì bỏ requirement.
```

## claim_3c32f6e251ad5b14894ad90eed79d494

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#6-canonical-contracts; lines 211–211; ancestry ["Spec: Agent Confinement Authority"].
Target: docs/platform/agent-confinement/contracts/confinement-authority-v1.md#6-canonical-contracts; ancestry ["Added in candidate: confinement authority v1"].
Source digest: d254eef730f5414dcdf6f6c748ad5579f3557e842c7234930d5b503e195fff16
Target digest: d254eef730f5414dcdf6f6c748ad5579f3557e842c7234930d5b503e195fff16
Shown source SHA256: 767b9587f297596c458732d35a0f9c5ca8bfcd46cbd81f5d1f3d862c2c17dd43
Shown target SHA256: 767b9587f297596c458732d35a0f9c5ca8bfcd46cbd81f5d1f3d862c2c17dd43

### Complete proposed decision

```json
{
  "claimId": "claim_3c32f6e251ad5b14894ad90eed79d494",
  "sourceUnitDigest": "d254eef730f5414dcdf6f6c748ad5579f3557e842c7234930d5b503e195fff16",
  "targetOwner": "docs/platform/agent-confinement/contracts/confinement-authority-v1.md",
  "targetAnchor": "6-canonical-contracts",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters; document exact share below one half. The whole heading unit docs/specs/confinement-authority.md#6-canonical-contracts (source lines 211-211) is carried at docs/platform/agent-confinement/contracts/confinement-authority-v1.md#6-canonical-contracts (candidate lines 24-24). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "d254eef730f5414dcdf6f6c748ad5579f3557e842c7234930d5b503e195fff16",
  "targetAncestry": [
    "Added in candidate: confinement authority v1"
  ]
}
```

### Full source shown text

```text
## 6. Canonical contracts

Đây là contract đích. Default implementation có thể chỉ chấp nhận tập con ghi
tại §9, nhưng mỗi field đã ship phải giữ đúng nghĩa dưới đây.
```

### Full target shown text

```text
## 6. Canonical contracts

Đây là contract đích. Default implementation có thể chỉ chấp nhận tập con ghi
tại §9, nhưng mỗi field đã ship phải giữ đúng nghĩa dưới đây.
```

## claim_aceb99e66710c74e37fffe44001f80df

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-31; lines 213–214; ancestry ["Spec: Agent Confinement Authority","6. Canonical contracts"].
Target: docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-3; ancestry ["Added in candidate: confinement authority v1","6. Canonical contracts"].
Source digest: 9a4c1352f50e0f212ffcd376be7eb6daf6aaa184187043e0aa977c91c04ddbd0
Target digest: 9a4c1352f50e0f212ffcd376be7eb6daf6aaa184187043e0aa977c91c04ddbd0
Shown source SHA256: 9a4c1352f50e0f212ffcd376be7eb6daf6aaa184187043e0aa977c91c04ddbd0
Shown target SHA256: 9a4c1352f50e0f212ffcd376be7eb6daf6aaa184187043e0aa977c91c04ddbd0

### Complete proposed decision

```json
{
  "claimId": "claim_aceb99e66710c74e37fffe44001f80df",
  "sourceUnitDigest": "9a4c1352f50e0f212ffcd376be7eb6daf6aaa184187043e0aa977c91c04ddbd0",
  "targetOwner": "docs/platform/agent-confinement/contracts/confinement-authority-v1.md",
  "targetAnchor": "unheaded-block-3",
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-31 (source lines 213-214) is carried at docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-3 (candidate lines 26-27). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "9a4c1352f50e0f212ffcd376be7eb6daf6aaa184187043e0aa977c91c04ddbd0",
  "targetAncestry": [
    "Added in candidate: confinement authority v1",
    "6. Canonical contracts"
  ]
}
```

### Full source shown text

```text
Đây là contract đích. Default implementation có thể chỉ chấp nhận tập con ghi
tại §9, nhưng mỗi field đã ship phải giữ đúng nghĩa dưới đây.
```

### Full target shown text

```text
Đây là contract đích. Default implementation có thể chỉ chấp nhận tập con ghi
tại §9, nhưng mỗi field đã ship phải giữ đúng nghĩa dưới đây.
```

## claim_7bf382199b928a3ab6f591dace5d4ba0

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#61-confinementpolicy; lines 216–216; ancestry ["Spec: Agent Confinement Authority","6. Canonical contracts"].
Target: docs/platform/agent-confinement/contracts/confinement-authority-v1.md#61-confinementpolicy; ancestry ["Added in candidate: confinement authority v1","6. Canonical contracts"].
Source digest: cf864e273a4652744a19ede737cb847431f5dbb4092c029a5e65089030ee147c
Target digest: cf864e273a4652744a19ede737cb847431f5dbb4092c029a5e65089030ee147c
Shown source SHA256: 80b757ddfce241c4708800987425a36fbde96615a4712eb01af704d352194210
Shown target SHA256: 80b757ddfce241c4708800987425a36fbde96615a4712eb01af704d352194210

### Complete proposed decision

```json
{
  "claimId": "claim_7bf382199b928a3ab6f591dace5d4ba0",
  "sourceUnitDigest": "cf864e273a4652744a19ede737cb847431f5dbb4092c029a5e65089030ee147c",
  "targetOwner": "docs/platform/agent-confinement/contracts/confinement-authority-v1.md",
  "targetAnchor": "61-confinementpolicy",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters; document exact share below one half. The whole heading unit docs/specs/confinement-authority.md#61-confinementpolicy (source lines 216-216) is carried at docs/platform/agent-confinement/contracts/confinement-authority-v1.md#61-confinementpolicy (candidate lines 29-29). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "cf864e273a4652744a19ede737cb847431f5dbb4092c029a5e65089030ee147c",
  "targetAncestry": [
    "Added in candidate: confinement authority v1",
    "6. Canonical contracts"
  ]
}
```

### Full source shown text

````text
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
````

### Full target shown text

````text
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
````

## claim_8a41f5ebfb682108b780226cb00a9720

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-32; lines 218–218; ancestry ["Spec: Agent Confinement Authority","6. Canonical contracts","6.1 `ConfinementPolicy`"].
Target: docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-4; ancestry ["Added in candidate: confinement authority v1","6. Canonical contracts","6.1 `ConfinementPolicy`"].
Source digest: 144306fc23422ced2d9f4ce6ea50de58d300c00160f2d1a952e8794165f41364
Target digest: 144306fc23422ced2d9f4ce6ea50de58d300c00160f2d1a952e8794165f41364
Shown source SHA256: 144306fc23422ced2d9f4ce6ea50de58d300c00160f2d1a952e8794165f41364
Shown target SHA256: 144306fc23422ced2d9f4ce6ea50de58d300c00160f2d1a952e8794165f41364

### Complete proposed decision

```json
{
  "claimId": "claim_8a41f5ebfb682108b780226cb00a9720",
  "sourceUnitDigest": "144306fc23422ced2d9f4ce6ea50de58d300c00160f2d1a952e8794165f41364",
  "targetOwner": "docs/platform/agent-confinement/contracts/confinement-authority-v1.md",
  "targetAnchor": "unheaded-block-4",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-32 (source lines 218-218) is carried at docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-4 (candidate lines 31-31). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "144306fc23422ced2d9f4ce6ea50de58d300c00160f2d1a952e8794165f41364",
  "targetAncestry": [
    "Added in candidate: confinement authority v1",
    "6. Canonical contracts",
    "6.1 `ConfinementPolicy`"
  ]
}
```

### Full source shown text

```text
Policy nói **cần bảo vệ gì**, không nói dùng argv nào.
```

### Full target shown text

```text
Policy nói **cần bảo vệ gì**, không nói dùng argv nào.
```

## claim_621f64668264b6ed6d389e54e9757c75

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-33; lines 220–282; ancestry ["Spec: Agent Confinement Authority","6. Canonical contracts","6.1 `ConfinementPolicy`"].
Target: docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-5; ancestry ["Added in candidate: confinement authority v1","6. Canonical contracts","6.1 `ConfinementPolicy`"].
Source digest: 82974998a4d9a5d1cd113cf5bc697a1493802a4d5b42fc4a29efe62f682794dd
Target digest: 82974998a4d9a5d1cd113cf5bc697a1493802a4d5b42fc4a29efe62f682794dd
Shown source SHA256: 82974998a4d9a5d1cd113cf5bc697a1493802a4d5b42fc4a29efe62f682794dd
Shown target SHA256: 82974998a4d9a5d1cd113cf5bc697a1493802a4d5b42fc4a29efe62f682794dd

### Complete proposed decision

```json
{
  "claimId": "claim_621f64668264b6ed6d389e54e9757c75",
  "sourceUnitDigest": "82974998a4d9a5d1cd113cf5bc697a1493802a4d5b42fc4a29efe62f682794dd",
  "targetOwner": "docs/platform/agent-confinement/contracts/confinement-authority-v1.md",
  "targetAnchor": "unheaded-block-5",
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-33 (source lines 220-282) is carried at docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-5 (candidate lines 33-95). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "82974998a4d9a5d1cd113cf5bc697a1493802a4d5b42fc4a29efe62f682794dd",
  "targetAncestry": [
    "Added in candidate: confinement authority v1",
    "6. Canonical contracts",
    "6.1 `ConfinementPolicy`"
  ]
}
```

### Full source shown text

````text
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
````

### Full target shown text

````text
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
````

## claim_fa68c61965120a25c91cdcf5fb53b908

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-34; lines 284–295; ancestry ["Spec: Agent Confinement Authority","6. Canonical contracts","6.1 `ConfinementPolicy`"].
Target: docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-6; ancestry ["Added in candidate: confinement authority v1","6. Canonical contracts","6.1 `ConfinementPolicy`"].
Source digest: c5fed59ea82e4179183d322c4994aa0dd9fe6fec922ac6c75c739b0cb993f482
Target digest: c5fed59ea82e4179183d322c4994aa0dd9fe6fec922ac6c75c739b0cb993f482
Shown source SHA256: c5fed59ea82e4179183d322c4994aa0dd9fe6fec922ac6c75c739b0cb993f482
Shown target SHA256: c5fed59ea82e4179183d322c4994aa0dd9fe6fec922ac6c75c739b0cb993f482

### Complete proposed decision

```json
{
  "claimId": "claim_fa68c61965120a25c91cdcf5fb53b908",
  "sourceUnitDigest": "c5fed59ea82e4179183d322c4994aa0dd9fe6fec922ac6c75c739b0cb993f482",
  "targetOwner": "docs/platform/agent-confinement/contracts/confinement-authority-v1.md",
  "targetAnchor": "unheaded-block-6",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-34 (source lines 284-295) is carried at docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-6 (candidate lines 97-108). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "c5fed59ea82e4179183d322c4994aa0dd9fe6fec922ac6c75c739b0cb993f482",
  "targetAncestry": [
    "Added in candidate: confinement authority v1",
    "6. Canonical contracts",
    "6.1 `ConfinementPolicy`"
  ]
}
```

### Full source shown text

```text
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
```

### Full target shown text

```text
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
```

## claim_468db5188d82a8173af30117b269e05a

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-35; lines 297–304; ancestry ["Spec: Agent Confinement Authority","6. Canonical contracts","6.1 `ConfinementPolicy`"].
Target: docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-7; ancestry ["Added in candidate: confinement authority v1","6. Canonical contracts","6.1 `ConfinementPolicy`"].
Source digest: 174065be7731e065d49df8831765e8b1621624e5e9c4147b65fc3f3d59bef97e
Target digest: 174065be7731e065d49df8831765e8b1621624e5e9c4147b65fc3f3d59bef97e
Shown source SHA256: 174065be7731e065d49df8831765e8b1621624e5e9c4147b65fc3f3d59bef97e
Shown target SHA256: 174065be7731e065d49df8831765e8b1621624e5e9c4147b65fc3f3d59bef97e

### Complete proposed decision

```json
{
  "claimId": "claim_468db5188d82a8173af30117b269e05a",
  "sourceUnitDigest": "174065be7731e065d49df8831765e8b1621624e5e9c4147b65fc3f3d59bef97e",
  "targetOwner": "docs/platform/agent-confinement/contracts/confinement-authority-v1.md",
  "targetAnchor": "unheaded-block-7",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-35 (source lines 297-304) is carried at docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-7 (candidate lines 110-117). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "174065be7731e065d49df8831765e8b1621624e5e9c4147b65fc3f3d59bef97e",
  "targetAncestry": [
    "Added in candidate: confinement authority v1",
    "6. Canonical contracts",
    "6.1 `ConfinementPolicy`"
  ]
}
```

### Full source shown text

```text
`networkFilter` bắt buộc đúng khi networkEgress là filtered; các mode khác
không nhận field này. DNS là tên chính xác đã normalize, không wildcard; CIDR
phải canonical, port là số 1–65535, danh sách không có phần tử trùng. Rule là
allowlist, phần còn lại deny. Override filtered chỉ được giữ hoặc bỏ rule và
thu tập port; đổi destination phải refuse dù người gọi cho rằng tương đương.
Nâng filtered thành deny bỏ filter; nâng allow thành filtered phải cấp filter.
Driver phải công bố cách enforce DNS resolution và chặn kết nối ngoài rule;
không có proof tương ứng thì unsupported. V1 không ngầm hỗ trợ L7/URL filtering.
```

### Full target shown text

```text
`networkFilter` bắt buộc đúng khi networkEgress là filtered; các mode khác
không nhận field này. DNS là tên chính xác đã normalize, không wildcard; CIDR
phải canonical, port là số 1–65535, danh sách không có phần tử trùng. Rule là
allowlist, phần còn lại deny. Override filtered chỉ được giữ hoặc bỏ rule và
thu tập port; đổi destination phải refuse dù người gọi cho rằng tương đương.
Nâng filtered thành deny bỏ filter; nâng allow thành filtered phải cấp filter.
Driver phải công bố cách enforce DNS resolution và chặn kết nối ngoài rule;
không có proof tương ứng thì unsupported. V1 không ngầm hỗ trợ L7/URL filtering.
```

## claim_373330f7e7533c795af584bab3dd5be6

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-36; lines 306–310; ancestry ["Spec: Agent Confinement Authority","6. Canonical contracts","6.1 `ConfinementPolicy`"].
Target: docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-8; ancestry ["Added in candidate: confinement authority v1","6. Canonical contracts","6.1 `ConfinementPolicy`"].
Source digest: 77d2d471883052250200ab7600172e75a4629ddcc35862fd36dad5c808926384
Target digest: 77d2d471883052250200ab7600172e75a4629ddcc35862fd36dad5c808926384
Shown source SHA256: 77d2d471883052250200ab7600172e75a4629ddcc35862fd36dad5c808926384
Shown target SHA256: 77d2d471883052250200ab7600172e75a4629ddcc35862fd36dad5c808926384

### Complete proposed decision

```json
{
  "claimId": "claim_373330f7e7533c795af584bab3dd5be6",
  "sourceUnitDigest": "77d2d471883052250200ab7600172e75a4629ddcc35862fd36dad5c808926384",
  "targetOwner": "docs/platform/agent-confinement/contracts/confinement-authority-v1.md",
  "targetAnchor": "unheaded-block-8",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-36 (source lines 306-310) is carried at docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-8 (candidate lines 119-123). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "77d2d471883052250200ab7600172e75a4629ddcc35862fd36dad5c808926384",
  "targetAncestry": [
    "Added in candidate: confinement authority v1",
    "6. Canonical contracts",
    "6.1 `ConfinementPolicy`"
  ]
}
```

### Full source shown text

```text
`resource` là tên ngữ nghĩa, ví dụ `workspace`, `run-output`,
`executor-credentials` hay `private-home`. Policy không chứa absolute path hay
tên provider.
Resource resolver của dispatch mới được đổi `run-output` thành `runDir` cụ thể,
sau khi canonicalize và kiểm tra ownership.
```

### Full target shown text

```text
`resource` là tên ngữ nghĩa, ví dụ `workspace`, `run-output`,
`executor-credentials` hay `private-home`. Policy không chứa absolute path hay
tên provider.
Resource resolver của dispatch mới được đổi `run-output` thành `runDir` cụ thể,
sau khi canonicalize và kiểm tra ownership.
```

## claim_c2fd6287ed90af9fd0a9588d1e0af4e8

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-37; lines 312–316; ancestry ["Spec: Agent Confinement Authority","6. Canonical contracts","6.1 `ConfinementPolicy`"].
Target: docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-9; ancestry ["Added in candidate: confinement authority v1","6. Canonical contracts","6.1 `ConfinementPolicy`"].
Source digest: 34e25b534cf851fdcca5ee576a24508f5e64e3ce2202bb48088a3827822cce87
Target digest: 34e25b534cf851fdcca5ee576a24508f5e64e3ce2202bb48088a3827822cce87
Shown source SHA256: 34e25b534cf851fdcca5ee576a24508f5e64e3ce2202bb48088a3827822cce87
Shown target SHA256: 34e25b534cf851fdcca5ee576a24508f5e64e3ce2202bb48088a3827822cce87

### Complete proposed decision

```json
{
  "claimId": "claim_c2fd6287ed90af9fd0a9588d1e0af4e8",
  "sourceUnitDigest": "34e25b534cf851fdcca5ee576a24508f5e64e3ce2202bb48088a3827822cce87",
  "targetOwner": "docs/platform/agent-confinement/contracts/confinement-authority-v1.md",
  "targetAnchor": "unheaded-block-9",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-37 (source lines 312-316) is carried at docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-9 (candidate lines 125-129). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "34e25b534cf851fdcca5ee576a24508f5e64e3ce2202bb48088a3827822cce87",
  "targetAncestry": [
    "Added in candidate: confinement authority v1",
    "6. Canonical contracts",
    "6.1 `ConfinementPolicy`"
  ]
}
```

### Full source shown text

```text
`policy` trong capability là ID của policy chuẩn hoặc custom policy, không phải
backend ID. `unconfined` là quyết định tường minh và không nhận `policy`; nó
không phải giá trị mặc định do thiếu config và vẫn sinh attestation.
Sau resolution, `required|preferred` bắt buộc có cả `policyId` và full `policy`;
`unconfined` bắt buộc cả hai là `null`.
```

### Full target shown text

```text
`policy` trong capability là ID của policy chuẩn hoặc custom policy, không phải
backend ID. `unconfined` là quyết định tường minh và không nhận `policy`; nó
không phải giá trị mặc định do thiếu config và vẫn sinh attestation.
Sau resolution, `required|preferred` bắt buộc có cả `policyId` và full `policy`;
`unconfined` bắt buộc cả hai là `null`.
```

## claim_72db8aa2341abee798ff2aa09f120129

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#62-nơi-đặt-policy; lines 318–318; ancestry ["Spec: Agent Confinement Authority","6. Canonical contracts"].
Target: docs/platform/agent-confinement/contracts/confinement-authority-v1.md#62-nơi-đặt-policy; ancestry ["Added in candidate: confinement authority v1","6. Canonical contracts"].
Source digest: e8c7201602b1661b1d1c2d0bcd200de348fa9f5ca2db3942a9cdedd5138b47e0
Target digest: e8c7201602b1661b1d1c2d0bcd200de348fa9f5ca2db3942a9cdedd5138b47e0
Shown source SHA256: e4dc0e3210e6f431da70dab7cd3e960bf5508bfc43e3942a0db163a73b553417
Shown target SHA256: e4dc0e3210e6f431da70dab7cd3e960bf5508bfc43e3942a0db163a73b553417

### Complete proposed decision

```json
{
  "claimId": "claim_72db8aa2341abee798ff2aa09f120129",
  "sourceUnitDigest": "e8c7201602b1661b1d1c2d0bcd200de348fa9f5ca2db3942a9cdedd5138b47e0",
  "targetOwner": "docs/platform/agent-confinement/contracts/confinement-authority-v1.md",
  "targetAnchor": "62-nơi-đặt-policy",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters; document exact share below one half. The whole heading unit docs/specs/confinement-authority.md#62-nơi-đặt-policy (source lines 318-318) is carried at docs/platform/agent-confinement/contracts/confinement-authority-v1.md#62-nơi-đặt-policy (candidate lines 131-131). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "e8c7201602b1661b1d1c2d0bcd200de348fa9f5ca2db3942a9cdedd5138b47e0",
  "targetAncestry": [
    "Added in candidate: confinement authority v1",
    "6. Canonical contracts"
  ]
}
```

### Full source shown text

````text
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
````

### Full target shown text

````text
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
````

## claim_0ad70a8bb3d703165ed3757c16d9eef6

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-38; lines 320–330; ancestry ["Spec: Agent Confinement Authority","6. Canonical contracts","6.2 Nơi đặt policy"].
Target: docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-10; ancestry ["Added in candidate: confinement authority v1","6. Canonical contracts","6.2 Nơi đặt policy"].
Source digest: ac0a0c84105227bcfd944b8130d6b3d17154e9c4e22729a3fd5d1ac6a6eeb211
Target digest: ac0a0c84105227bcfd944b8130d6b3d17154e9c4e22729a3fd5d1ac6a6eeb211
Shown source SHA256: ac0a0c84105227bcfd944b8130d6b3d17154e9c4e22729a3fd5d1ac6a6eeb211
Shown target SHA256: ac0a0c84105227bcfd944b8130d6b3d17154e9c4e22729a3fd5d1ac6a6eeb211

### Complete proposed decision

```json
{
  "claimId": "claim_0ad70a8bb3d703165ed3757c16d9eef6",
  "sourceUnitDigest": "ac0a0c84105227bcfd944b8130d6b3d17154e9c4e22729a3fd5d1ac6a6eeb211",
  "targetOwner": "docs/platform/agent-confinement/contracts/confinement-authority-v1.md",
  "targetAnchor": "unheaded-block-10",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-38 (source lines 320-330) is carried at docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-10 (candidate lines 133-143). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "ac0a0c84105227bcfd944b8130d6b3d17154e9c4e22729a3fd5d1ac6a6eeb211",
  "targetAncestry": [
    "Added in candidate: confinement authority v1",
    "6. Canonical contracts",
    "6.2 Nơi đặt policy"
  ]
}
```

### Full source shown text

```text
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
```

### Full target shown text

```text
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
```

## claim_c061feaa8e24659688ca80707d9a5952

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-39; lines 332–336; ancestry ["Spec: Agent Confinement Authority","6. Canonical contracts","6.2 Nơi đặt policy"].
Target: docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-11; ancestry ["Added in candidate: confinement authority v1","6. Canonical contracts","6.2 Nơi đặt policy"].
Source digest: 7b98849030627dd574a65bdc66dcae626816913bf146d7d0563ffe208e741bba
Target digest: 7b98849030627dd574a65bdc66dcae626816913bf146d7d0563ffe208e741bba
Shown source SHA256: 7b98849030627dd574a65bdc66dcae626816913bf146d7d0563ffe208e741bba
Shown target SHA256: 7b98849030627dd574a65bdc66dcae626816913bf146d7d0563ffe208e741bba

### Complete proposed decision

```json
{
  "claimId": "claim_c061feaa8e24659688ca80707d9a5952",
  "sourceUnitDigest": "7b98849030627dd574a65bdc66dcae626816913bf146d7d0563ffe208e741bba",
  "targetOwner": "docs/platform/agent-confinement/contracts/confinement-authority-v1.md",
  "targetAnchor": "unheaded-block-11",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-39 (source lines 332-336) is carried at docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-11 (candidate lines 145-149). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "7b98849030627dd574a65bdc66dcae626816913bf146d7d0563ffe208e741bba",
  "targetAncestry": [
    "Added in candidate: confinement authority v1",
    "6. Canonical contracts",
    "6.2 Nơi đặt policy"
  ]
}
```

### Full source shown text

```text
Capability anchor là key resolver tra trong runner.capabilities, gồm purpose
và tên stage-skill do skillForStage trả về, không chỉ nhãn decide --for.
Resolver phải mang key gốc tới Authority kể cả fallback executor. Gọi trực tiếp
executor ID phải cung cấp capability anchor hoặc explicit requirement từ caller
tin cậy; không suy minimum từ executor.for có thể chứa nhiều capability.
```

### Full target shown text

```text
Capability anchor là key resolver tra trong runner.capabilities, gồm purpose
và tên stage-skill do skillForStage trả về, không chỉ nhãn decide --for.
Resolver phải mang key gốc tới Authority kể cả fallback executor. Gọi trực tiếp
executor ID phải cung cấp capability anchor hoặc explicit requirement từ caller
tin cậy; không suy minimum từ executor.for có thể chứa nhiều capability.
```

## claim_709d3b396f94bb46538b3be750723b77

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-40; lines 338–344; ancestry ["Spec: Agent Confinement Authority","6. Canonical contracts","6.2 Nơi đặt policy"].
Target: docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-12; ancestry ["Added in candidate: confinement authority v1","6. Canonical contracts","6.2 Nơi đặt policy"].
Source digest: 6d3a53fec3b2db3ccb67a44456cfa49581dc393b660909021f2ce70797bbb15e
Target digest: 6d3a53fec3b2db3ccb67a44456cfa49581dc393b660909021f2ce70797bbb15e
Shown source SHA256: 6d3a53fec3b2db3ccb67a44456cfa49581dc393b660909021f2ce70797bbb15e
Shown target SHA256: 6d3a53fec3b2db3ccb67a44456cfa49581dc393b660909021f2ce70797bbb15e

### Complete proposed decision

```json
{
  "claimId": "claim_709d3b396f94bb46538b3be750723b77",
  "sourceUnitDigest": "6d3a53fec3b2db3ccb67a44456cfa49581dc393b660909021f2ce70797bbb15e",
  "targetOwner": "docs/platform/agent-confinement/contracts/confinement-authority-v1.md",
  "targetAnchor": "unheaded-block-12",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-40 (source lines 338-344) is carried at docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-12 (candidate lines 151-157). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "6d3a53fec3b2db3ccb67a44456cfa49581dc393b660909021f2ce70797bbb15e",
  "targetAncestry": [
    "Added in candidate: confinement authority v1",
    "6. Canonical contracts",
    "6.2 Nơi đặt policy"
  ]
}
```

### Full source shown text

```text
Config đích `runner.confinement.strict: boolean` mặc định false trong migration
S1–S2; S4 chỉ được kích hoạt sau khi chuyển true và mọi anchor đã khai báo.
False chỉ cho phép omission legacy với outcome unknown và warning, không thay
nghĩa required. Setup đăng ký default; doctor check
`confinement-policies-declared` liệt kê anchor thiếu, và kiểm tra migration
readiness trước strict flip. Đây là config mới cần đăng ký distribution trước
implementation, không phải cờ đã tồn tại trong code hiện tại.
```

### Full target shown text

```text
Config đích `runner.confinement.strict: boolean` mặc định false trong migration
S1–S2; S4 chỉ được kích hoạt sau khi chuyển true và mọi anchor đã khai báo.
False chỉ cho phép omission legacy với outcome unknown và warning, không thay
nghĩa required. Setup đăng ký default; doctor check
`confinement-policies-declared` liệt kê anchor thiếu, và kiểm tra migration
readiness trước strict flip. Đây là config mới cần đăng ký distribution trước
implementation, không phải cờ đã tồn tại trong code hiện tại.
```

## claim_414314452db8243d0e4d144939e7747e

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-41; lines 346–353; ancestry ["Spec: Agent Confinement Authority","6. Canonical contracts","6.2 Nơi đặt policy"].
Target: docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-13; ancestry ["Added in candidate: confinement authority v1","6. Canonical contracts","6.2 Nơi đặt policy"].
Source digest: 6d04aec7233a3abca178f1faeb3165af28667ce83052b987786fbbe4f382119c
Target digest: 6d04aec7233a3abca178f1faeb3165af28667ce83052b987786fbbe4f382119c
Shown source SHA256: 6d04aec7233a3abca178f1faeb3165af28667ce83052b987786fbbe4f382119c
Shown target SHA256: 6d04aec7233a3abca178f1faeb3165af28667ce83052b987786fbbe4f382119c

### Complete proposed decision

```json
{
  "claimId": "claim_414314452db8243d0e4d144939e7747e",
  "sourceUnitDigest": "6d04aec7233a3abca178f1faeb3165af28667ce83052b987786fbbe4f382119c",
  "targetOwner": "docs/platform/agent-confinement/contracts/confinement-authority-v1.md",
  "targetAnchor": "unheaded-block-13",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-41 (source lines 346-353) is carried at docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-13 (candidate lines 159-166). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "6d04aec7233a3abca178f1faeb3165af28667ce83052b987786fbbe4f382119c",
  "targetAncestry": [
    "Added in candidate: confinement authority v1",
    "6. Canonical contracts",
    "6.2 Nơi đặt policy"
  ]
}
```

### Full source shown text

````text
Bất biến cấu hình:

```text
Một capability -> một minimum policy
Một executor -> không quá một backend instance
Một dispatch -> một executor -> không quá một backend instance
Backend không đủ -> refuse/degrade theo policy, không tự fallback
```
````

### Full target shown text

````text
Bất biến cấu hình:

```text
Một capability -> một minimum policy
Một executor -> không quá một backend instance
Một dispatch -> một executor -> không quá một backend instance
Backend không đủ -> refuse/degrade theo policy, không tự fallback
```
````

## claim_61f6287707c0668d5d6c402a69c693d2

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-42; lines 355–360; ancestry ["Spec: Agent Confinement Authority","6. Canonical contracts","6.2 Nơi đặt policy"].
Target: docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-14; ancestry ["Added in candidate: confinement authority v1","6. Canonical contracts","6.2 Nơi đặt policy"].
Source digest: aef1e73b22aa08d3ade14ec51cac96b5f2b8011355459ddc3fa512d0550748cc
Target digest: aef1e73b22aa08d3ade14ec51cac96b5f2b8011355459ddc3fa512d0550748cc
Shown source SHA256: aef1e73b22aa08d3ade14ec51cac96b5f2b8011355459ddc3fa512d0550748cc
Shown target SHA256: aef1e73b22aa08d3ade14ec51cac96b5f2b8011355459ddc3fa512d0550748cc

### Complete proposed decision

```json
{
  "claimId": "claim_61f6287707c0668d5d6c402a69c693d2",
  "sourceUnitDigest": "aef1e73b22aa08d3ade14ec51cac96b5f2b8011355459ddc3fa512d0550748cc",
  "targetOwner": "docs/platform/agent-confinement/contracts/confinement-authority-v1.md",
  "targetAnchor": "unheaded-block-14",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-42 (source lines 355-360) is carried at docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-14 (candidate lines 168-173). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "aef1e73b22aa08d3ade14ec51cac96b5f2b8011355459ddc3fa512d0550748cc",
  "targetAncestry": [
    "Added in candidate: confinement authority v1",
    "6. Canonical contracts",
    "6.2 Nơi đặt policy"
  ]
}
```

### Full source shown text

```text
Executor được phép không khai backend để phục vụ capability `unconfined`. Nếu
mode là `required`, thiếu backend luôn dẫn tới refusal trước spawn; nếu là
`preferred`, kết quả chỉ có thể là `degraded` với mismatch tường minh.
`unconfined` luôn đặt runtime `backendId: null`, kể cả executor có backend; đây
là opt-out có chủ ý và attestation phải ghi lại. Với `required|preferred`,
`backendId` luôn được copy từ executor đã resolve, không lấy từ machine default.
```

### Full target shown text

```text
Executor được phép không khai backend để phục vụ capability `unconfined`. Nếu
mode là `required`, thiếu backend luôn dẫn tới refusal trước spawn; nếu là
`preferred`, kết quả chỉ có thể là `degraded` với mismatch tường minh.
`unconfined` luôn đặt runtime `backendId: null`, kể cả executor có backend; đây
là opt-out có chủ ý và attestation phải ghi lại. Với `required|preferred`,
`backendId` luôn được copy từ executor đã resolve, không lấy từ machine default.
```

## claim_c04f7a8ff0d5c8273209f2a742efe0c4

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-43; lines 362–377; ancestry ["Spec: Agent Confinement Authority","6. Canonical contracts","6.2 Nơi đặt policy"].
Target: docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-15; ancestry ["Added in candidate: confinement authority v1","6. Canonical contracts","6.2 Nơi đặt policy"].
Source digest: 36e771f87aee65315d67207605e953c9e01114e3a44901731a7da9a5a6f7d97c
Target digest: 36e771f87aee65315d67207605e953c9e01114e3a44901731a7da9a5a6f7d97c
Shown source SHA256: 36e771f87aee65315d67207605e953c9e01114e3a44901731a7da9a5a6f7d97c
Shown target SHA256: 36e771f87aee65315d67207605e953c9e01114e3a44901731a7da9a5a6f7d97c

### Complete proposed decision

```json
{
  "claimId": "claim_c04f7a8ff0d5c8273209f2a742efe0c4",
  "sourceUnitDigest": "36e771f87aee65315d67207605e953c9e01114e3a44901731a7da9a5a6f7d97c",
  "targetOwner": "docs/platform/agent-confinement/contracts/confinement-authority-v1.md",
  "targetAnchor": "unheaded-block-15",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-43 (source lines 362-377) is carried at docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-15 (candidate lines 175-190). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "36e771f87aee65315d67207605e953c9e01114e3a44901731a7da9a5a6f7d97c",
  "targetAncestry": [
    "Added in candidate: confinement authority v1",
    "6. Canonical contracts",
    "6.2 Nơi đặt policy"
  ]
}
```

### Full source shown text

````text
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
````

### Full target shown text

````text
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
````

## claim_cf8d898c041074cd559527f9f320330d

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-44; lines 379–382; ancestry ["Spec: Agent Confinement Authority","6. Canonical contracts","6.2 Nơi đặt policy"].
Target: docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-16; ancestry ["Added in candidate: confinement authority v1","6. Canonical contracts","6.2 Nơi đặt policy"].
Source digest: 46511410e541ae7f3d505f24b96474a308661046620525bdc78b0132632503ac
Target digest: 46511410e541ae7f3d505f24b96474a308661046620525bdc78b0132632503ac
Shown source SHA256: 46511410e541ae7f3d505f24b96474a308661046620525bdc78b0132632503ac
Shown target SHA256: 46511410e541ae7f3d505f24b96474a308661046620525bdc78b0132632503ac

### Complete proposed decision

```json
{
  "claimId": "claim_cf8d898c041074cd559527f9f320330d",
  "sourceUnitDigest": "46511410e541ae7f3d505f24b96474a308661046620525bdc78b0132632503ac",
  "targetOwner": "docs/platform/agent-confinement/contracts/confinement-authority-v1.md",
  "targetAnchor": "unheaded-block-16",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-44 (source lines 379-382) is carried at docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-16 (candidate lines 192-195). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "46511410e541ae7f3d505f24b96474a308661046620525bdc78b0132632503ac",
  "targetAncestry": [
    "Added in candidate: confinement authority v1",
    "6. Canonical contracts",
    "6.2 Nơi đặt policy"
  ]
}
```

### Full source shown text

```text
`host-write-denied` là policy chuẩn do fgOS cung cấp. Common case không cần khai
toàn bộ threat axes. Khi cần policy riêng, user thêm một entry có full
`ConfinementPolicyV1` vào `confinementPolicies` và vẫn tham chiếu bằng cùng
field `policy`; không có syntax thứ hai ở capability.
```

### Full target shown text

```text
`host-write-denied` là policy chuẩn do fgOS cung cấp. Common case không cần khai
toàn bộ threat axes. Khi cần policy riêng, user thêm một entry có full
`ConfinementPolicyV1` vào `confinementPolicies` và vẫn tham chiếu bằng cùng
field `policy`; không có syntax thứ hai ở capability.
```

## claim_4190bbef80014aeece619a82d678182a

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-45; lines 384–384; ancestry ["Spec: Agent Confinement Authority","6. Canonical contracts","6.2 Nơi đặt policy"].
Target: docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-17; ancestry ["Added in candidate: confinement authority v1","6. Canonical contracts","6.2 Nơi đặt policy"].
Source digest: b4384b488cab8d5b506feb676b0806a3a4359417a76025ae33e510f669118d5b
Target digest: b4384b488cab8d5b506feb676b0806a3a4359417a76025ae33e510f669118d5b
Shown source SHA256: b4384b488cab8d5b506feb676b0806a3a4359417a76025ae33e510f669118d5b
Shown target SHA256: b4384b488cab8d5b506feb676b0806a3a4359417a76025ae33e510f669118d5b

### Complete proposed decision

```json
{
  "claimId": "claim_4190bbef80014aeece619a82d678182a",
  "sourceUnitDigest": "b4384b488cab8d5b506feb676b0806a3a4359417a76025ae33e510f669118d5b",
  "targetOwner": "docs/platform/agent-confinement/contracts/confinement-authority-v1.md",
  "targetAnchor": "unheaded-block-17",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-45 (source lines 384-384) is carried at docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-17 (candidate lines 197-197). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "b4384b488cab8d5b506feb676b0806a3a4359417a76025ae33e510f669118d5b",
  "targetAncestry": [
    "Added in candidate: confinement authority v1",
    "6. Canonical contracts",
    "6.2 Nơi đặt policy"
  ]
}
```

### Full source shown text

```text
Built-in `host-write-denied` có definition versioned do fgOS sở hữu:
```

### Full target shown text

```text
Built-in `host-write-denied` có definition versioned do fgOS sở hữu:
```

## claim_a7e6bbbc506d7d77d7e8ce6bcf85db31

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-46; lines 386–400; ancestry ["Spec: Agent Confinement Authority","6. Canonical contracts","6.2 Nơi đặt policy"].
Target: docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-18; ancestry ["Added in candidate: confinement authority v1","6. Canonical contracts","6.2 Nơi đặt policy"].
Source digest: a8993901e0112ac1a6abc97ad6af873a631e01d29de08abe7603f4857dea40bc
Target digest: a8993901e0112ac1a6abc97ad6af873a631e01d29de08abe7603f4857dea40bc
Shown source SHA256: a8993901e0112ac1a6abc97ad6af873a631e01d29de08abe7603f4857dea40bc
Shown target SHA256: a8993901e0112ac1a6abc97ad6af873a631e01d29de08abe7603f4857dea40bc

### Complete proposed decision

```json
{
  "claimId": "claim_a7e6bbbc506d7d77d7e8ce6bcf85db31",
  "sourceUnitDigest": "a8993901e0112ac1a6abc97ad6af873a631e01d29de08abe7603f4857dea40bc",
  "targetOwner": "docs/platform/agent-confinement/contracts/confinement-authority-v1.md",
  "targetAnchor": "unheaded-block-18",
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-46 (source lines 386-400) is carried at docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-18 (candidate lines 199-213). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "a8993901e0112ac1a6abc97ad6af873a631e01d29de08abe7603f4857dea40bc",
  "targetAncestry": [
    "Added in candidate: confinement authority v1",
    "6. Canonical contracts",
    "6.2 Nơi đặt policy"
  ]
}
```

### Full source shown text

````text
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
````

### Full target shown text

````text
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
````

## claim_65d53f69b094914bb1ffe25a8e54402c

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-47; lines 402–404; ancestry ["Spec: Agent Confinement Authority","6. Canonical contracts","6.2 Nơi đặt policy"].
Target: docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-19; ancestry ["Added in candidate: confinement authority v1","6. Canonical contracts","6.2 Nơi đặt policy"].
Source digest: b3e564641ff23cbde2e94d06283e58ae0ddefcbcc0928d31b2aa18c1b6c4d4b8
Target digest: b3e564641ff23cbde2e94d06283e58ae0ddefcbcc0928d31b2aa18c1b6c4d4b8
Shown source SHA256: b3e564641ff23cbde2e94d06283e58ae0ddefcbcc0928d31b2aa18c1b6c4d4b8
Shown target SHA256: b3e564641ff23cbde2e94d06283e58ae0ddefcbcc0928d31b2aa18c1b6c4d4b8

### Complete proposed decision

```json
{
  "claimId": "claim_65d53f69b094914bb1ffe25a8e54402c",
  "sourceUnitDigest": "b3e564641ff23cbde2e94d06283e58ae0ddefcbcc0928d31b2aa18c1b6c4d4b8",
  "targetOwner": "docs/platform/agent-confinement/contracts/confinement-authority-v1.md",
  "targetAnchor": "unheaded-block-19",
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-47 (source lines 402-404) is carried at docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-19 (candidate lines 215-217). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "b3e564641ff23cbde2e94d06283e58ae0ddefcbcc0928d31b2aa18c1b6c4d4b8",
  "targetAncestry": [
    "Added in candidate: confinement authority v1",
    "6. Canonical contracts",
    "6.2 Nơi đặt policy"
  ]
}
```

### Full source shown text

```text
Đổi nghĩa một built-in policy là breaking contract; muốn posture khác phải thêm
policy ID mới. Full definition luôn được ghi vào request/attestation, vì vậy
evidence không phụ thuộc catalog hiện tại khi được đọc lại sau này.
```

### Full target shown text

```text
Đổi nghĩa một built-in policy là breaking contract; muốn posture khác phải thêm
policy ID mới. Full definition luôn được ghi vào request/attestation, vì vậy
evidence không phụ thuộc catalog hiện tại khi được đọc lại sau này.
```

## claim_7a56441f60be947b5cbe5856d4c3128b

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-48; lines 406–413; ancestry ["Spec: Agent Confinement Authority","6. Canonical contracts","6.2 Nơi đặt policy"].
Target: docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-20; ancestry ["Added in candidate: confinement authority v1","6. Canonical contracts","6.2 Nơi đặt policy"].
Source digest: 5f56c09a0921d072e749320c929cf1ee3801280e3288ce0f388accb47e6f399c
Target digest: 5f56c09a0921d072e749320c929cf1ee3801280e3288ce0f388accb47e6f399c
Shown source SHA256: 5f56c09a0921d072e749320c929cf1ee3801280e3288ce0f388accb47e6f399c
Shown target SHA256: 5f56c09a0921d072e749320c929cf1ee3801280e3288ce0f388accb47e6f399c

### Complete proposed decision

```json
{
  "claimId": "claim_7a56441f60be947b5cbe5856d4c3128b",
  "sourceUnitDigest": "5f56c09a0921d072e749320c929cf1ee3801280e3288ce0f388accb47e6f399c",
  "targetOwner": "docs/platform/agent-confinement/contracts/confinement-authority-v1.md",
  "targetAnchor": "unheaded-block-20",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-48 (source lines 406-413) is carried at docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-20 (candidate lines 219-226). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "5f56c09a0921d072e749320c929cf1ee3801280e3288ce0f388accb47e6f399c",
  "targetAncestry": [
    "Added in candidate: confinement authority v1",
    "6. Canonical contracts",
    "6.2 Nơi đặt policy"
  ]
}
```

### Full source shown text

```text
Built-in `workspace-write` có cùng controls và grants như host-write-denied,
thêm `workspace: read-write` và `workspace-git-metadata: read-write` (scope
dispatch). hostWrite vẫn deny ngoài grant, không đổi thành allow. Grant là
quyền tối đa; chỉ resolve/cấp tài nguyên thực sự cần theo resourceNeeds.
Hai built-in cho phép private-home nhưng không bắt dùng: provider normalizer
khai need/binding khi CLI cần home ghi được. home host không có nghĩa cấp quyền
ghi host home. Credential/plugin/config đọc từ host qua hostRead allow; provider
phải chứng minh cách load khi dùng private home, không tự copy toàn bộ home.
```

### Full target shown text

```text
Built-in `workspace-write` có cùng controls và grants như host-write-denied,
thêm `workspace: read-write` và `workspace-git-metadata: read-write` (scope
dispatch). hostWrite vẫn deny ngoài grant, không đổi thành allow. Grant là
quyền tối đa; chỉ resolve/cấp tài nguyên thực sự cần theo resourceNeeds.
Hai built-in cho phép private-home nhưng không bắt dùng: provider normalizer
khai need/binding khi CLI cần home ghi được. home host không có nghĩa cấp quyền
ghi host home. Credential/plugin/config đọc từ host qua hostRead allow; provider
phải chứng minh cách load khi dùng private home, không tự copy toàn bộ home.
```

## claim_a93df57649380e87940372c1ae98bc14

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-49; lines 415–419; ancestry ["Spec: Agent Confinement Authority","6. Canonical contracts","6.2 Nơi đặt policy"].
Target: docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-21; ancestry ["Added in candidate: confinement authority v1","6. Canonical contracts","6.2 Nơi đặt policy"].
Source digest: d8a9fb19101ac0e03201ba2cc768c704b2aa263798aef9c98f10712f587e67f6
Target digest: d8a9fb19101ac0e03201ba2cc768c704b2aa263798aef9c98f10712f587e67f6
Shown source SHA256: d8a9fb19101ac0e03201ba2cc768c704b2aa263798aef9c98f10712f587e67f6
Shown target SHA256: d8a9fb19101ac0e03201ba2cc768c704b2aa263798aef9c98f10712f587e67f6

### Complete proposed decision

```json
{
  "claimId": "claim_a93df57649380e87940372c1ae98bc14",
  "sourceUnitDigest": "d8a9fb19101ac0e03201ba2cc768c704b2aa263798aef9c98f10712f587e67f6",
  "targetOwner": "docs/platform/agent-confinement/contracts/confinement-authority-v1.md",
  "targetAnchor": "unheaded-block-21",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-49 (source lines 415-419) is carried at docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-21 (candidate lines 228-232). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "d8a9fb19101ac0e03201ba2cc768c704b2aa263798aef9c98f10712f587e67f6",
  "targetAncestry": [
    "Added in candidate: confinement authority v1",
    "6. Canonical contracts",
    "6.2 Nơi đặt policy"
  ]
}
```

### Full source shown text

```text
Grant mặc định là optional khi runtime không resolve được resource đó: coverage
của grant là `unverified`, không biến cả required dispatch thành refusal. Caller
có thể đặt `optional: false` trên grant của policy riêng để biến absence thành
mismatch/refusal. Hai built-in giữ credentials optional để required mode usable
trên máy chưa có credential source.
```

### Full target shown text

```text
Grant mặc định là optional khi runtime không resolve được resource đó: coverage
của grant là `unverified`, không biến cả required dispatch thành refusal. Caller
có thể đặt `optional: false` trên grant của policy riêng để biến absence thành
mismatch/refusal. Hai built-in giữ credentials optional để required mode usable
trên máy chưa có credential source.
```

## claim_096bfa1baf75a9eb27e5ed86313d18c0

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-50; lines 421–421; ancestry ["Spec: Agent Confinement Authority","6. Canonical contracts","6.2 Nơi đặt policy"].
Target: docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-22; ancestry ["Added in candidate: confinement authority v1","6. Canonical contracts","6.2 Nơi đặt policy"].
Source digest: 066ac1063e1440ff187b3549a9a0767e3a73e0d8ed51d563746d3674f1b75adf
Target digest: 066ac1063e1440ff187b3549a9a0767e3a73e0d8ed51d563746d3674f1b75adf
Shown source SHA256: 066ac1063e1440ff187b3549a9a0767e3a73e0d8ed51d563746d3674f1b75adf
Shown target SHA256: 066ac1063e1440ff187b3549a9a0767e3a73e0d8ed51d563746d3674f1b75adf

### Complete proposed decision

```json
{
  "claimId": "claim_096bfa1baf75a9eb27e5ed86313d18c0",
  "sourceUnitDigest": "066ac1063e1440ff187b3549a9a0767e3a73e0d8ed51d563746d3674f1b75adf",
  "targetOwner": "docs/platform/agent-confinement/contracts/confinement-authority-v1.md",
  "targetAnchor": "unheaded-block-22",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters; document exact share below one half. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-50 (source lines 421-421) is carried at docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-22 (candidate lines 234-234). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "066ac1063e1440ff187b3549a9a0767e3a73e0d8ed51d563746d3674f1b75adf",
  "targetAncestry": [
    "Added in candidate: confinement authority v1",
    "6. Canonical contracts",
    "6.2 Nơi đặt policy"
  ]
}
```

### Full source shown text

```text
Machine registry tương ứng:
```

### Full target shown text

```text
Machine registry tương ứng:
```

## claim_7ef6fc6ee5c72cd61746952b1c926596

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-51; lines 423–429; ancestry ["Spec: Agent Confinement Authority","6. Canonical contracts","6.2 Nơi đặt policy"].
Target: docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-23; ancestry ["Added in candidate: confinement authority v1","6. Canonical contracts","6.2 Nơi đặt policy"].
Source digest: 3cef3c7a3f285561a7ddffb1c2c51186af1674c44611658a12b638f5337dcaf1
Target digest: 3cef3c7a3f285561a7ddffb1c2c51186af1674c44611658a12b638f5337dcaf1
Shown source SHA256: 3cef3c7a3f285561a7ddffb1c2c51186af1674c44611658a12b638f5337dcaf1
Shown target SHA256: 3cef3c7a3f285561a7ddffb1c2c51186af1674c44611658a12b638f5337dcaf1

### Complete proposed decision

```json
{
  "claimId": "claim_7ef6fc6ee5c72cd61746952b1c926596",
  "sourceUnitDigest": "3cef3c7a3f285561a7ddffb1c2c51186af1674c44611658a12b638f5337dcaf1",
  "targetOwner": "docs/platform/agent-confinement/contracts/confinement-authority-v1.md",
  "targetAnchor": "unheaded-block-23",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-51 (source lines 423-429) is carried at docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-23 (candidate lines 236-242). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "3cef3c7a3f285561a7ddffb1c2c51186af1674c44611658a12b638f5337dcaf1",
  "targetAncestry": [
    "Added in candidate: confinement authority v1",
    "6. Canonical contracts",
    "6.2 Nơi đặt policy"
  ]
}
```

### Full source shown text

````text
```yaml
confinementBackends:
  bwrap:
    type: bwrap
    executable: /usr/bin/bwrap
    tempRoot: /var/tmp/fgos
```
````

### Full target shown text

````text
```yaml
confinementBackends:
  bwrap:
    type: bwrap
    executable: /usr/bin/bwrap
    tempRoot: /var/tmp/fgos
```
````

## claim_ee19375a832b214415316df2880b9d38

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-52; lines 431–433; ancestry ["Spec: Agent Confinement Authority","6. Canonical contracts","6.2 Nơi đặt policy"].
Target: docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-24; ancestry ["Added in candidate: confinement authority v1","6. Canonical contracts","6.2 Nơi đặt policy"].
Source digest: 1c88074cc7336dc83b3ad38729360fe21f7dd439060af7a287bc4fd0bb7f5e47
Target digest: 1c88074cc7336dc83b3ad38729360fe21f7dd439060af7a287bc4fd0bb7f5e47
Shown source SHA256: 1c88074cc7336dc83b3ad38729360fe21f7dd439060af7a287bc4fd0bb7f5e47
Shown target SHA256: 1c88074cc7336dc83b3ad38729360fe21f7dd439060af7a287bc4fd0bb7f5e47

### Complete proposed decision

```json
{
  "claimId": "claim_ee19375a832b214415316df2880b9d38",
  "sourceUnitDigest": "1c88074cc7336dc83b3ad38729360fe21f7dd439060af7a287bc4fd0bb7f5e47",
  "targetOwner": "docs/platform/agent-confinement/contracts/confinement-authority-v1.md",
  "targetAnchor": "unheaded-block-24",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-52 (source lines 431-433) is carried at docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-24 (candidate lines 244-246). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "1c88074cc7336dc83b3ad38729360fe21f7dd439060af7a287bc4fd0bb7f5e47",
  "targetAncestry": [
    "Added in candidate: confinement authority v1",
    "6. Canonical contracts",
    "6.2 Nơi đặt policy"
  ]
}
```

### Full source shown text

```text
`bwrap` ở đây vừa là backend instance ID người vận hành thấy, vừa là driver type
cho common case. Nếu cần hai instance cùng type, dùng ID rõ nghĩa như
`workstation-bwrap` và `ci-bwrap`; mỗi entry vẫn khai `type: bwrap`.
```

### Full target shown text

```text
`bwrap` ở đây vừa là backend instance ID người vận hành thấy, vừa là driver type
cho common case. Nếu cần hai instance cùng type, dùng ID rõ nghĩa như
`workstation-bwrap` và `ci-bwrap`; mỗi entry vẫn khai `type: bwrap`.
```

## claim_9747eeeefab2b4de2147cabdd10cf940

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-53; lines 435–439; ancestry ["Spec: Agent Confinement Authority","6. Canonical contracts","6.2 Nơi đặt policy"].
Target: docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-25; ancestry ["Added in candidate: confinement authority v1","6. Canonical contracts","6.2 Nơi đặt policy"].
Source digest: c979fe19764ba16590b0f9f551bc05298d26b38d39ef9ecd18c354b7aa5311c6
Target digest: c979fe19764ba16590b0f9f551bc05298d26b38d39ef9ecd18c354b7aa5311c6
Shown source SHA256: c979fe19764ba16590b0f9f551bc05298d26b38d39ef9ecd18c354b7aa5311c6
Shown target SHA256: c979fe19764ba16590b0f9f551bc05298d26b38d39ef9ecd18c354b7aa5311c6

### Complete proposed decision

```json
{
  "claimId": "claim_9747eeeefab2b4de2147cabdd10cf940",
  "sourceUnitDigest": "c979fe19764ba16590b0f9f551bc05298d26b38d39ef9ecd18c354b7aa5311c6",
  "targetOwner": "docs/platform/agent-confinement/contracts/confinement-authority-v1.md",
  "targetAnchor": "unheaded-block-25",
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-53 (source lines 435-439) is carried at docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-25 (candidate lines 248-252). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "c979fe19764ba16590b0f9f551bc05298d26b38d39ef9ecd18c354b7aa5311c6",
  "targetAncestry": [
    "Added in candidate: confinement authority v1",
    "6. Canonical contracts",
    "6.2 Nơi đặt policy"
  ]
}
```

### Full source shown text

```text
`confinementBackends` không chỉ bật/tắt backend. Mỗi entry chứa custom deployment
config và được validate bằng schema của `type` tương ứng. Ví dụ `bwrap` có thể
nhận `executable`, `tempRoot`, `privateHomeRoot`; backend container có thể nhận
`runtime`, `image`, `pullPolicy`. Secret chỉ xuất hiện dưới dạng reference,
không chứa credential value trực tiếp.
```

### Full target shown text

```text
`confinementBackends` không chỉ bật/tắt backend. Mỗi entry chứa custom deployment
config và được validate bằng schema của `type` tương ứng. Ví dụ `bwrap` có thể
nhận `executable`, `tempRoot`, `privateHomeRoot`; backend container có thể nhận
`runtime`, `image`, `pullPolicy`. Secret chỉ xuất hiện dưới dạng reference,
không chứa credential value trực tiếp.
```

## claim_03ebfa4088b7739930c4cf656a755f6b

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-54; lines 441–444; ancestry ["Spec: Agent Confinement Authority","6. Canonical contracts","6.2 Nơi đặt policy"].
Target: docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-26; ancestry ["Added in candidate: confinement authority v1","6. Canonical contracts","6.2 Nơi đặt policy"].
Source digest: 31662baa9e369dcb6cf5055ca1889e2036714c0505a740d883b0ccd1cd13abd6
Target digest: 31662baa9e369dcb6cf5055ca1889e2036714c0505a740d883b0ccd1cd13abd6
Shown source SHA256: 31662baa9e369dcb6cf5055ca1889e2036714c0505a740d883b0ccd1cd13abd6
Shown target SHA256: 31662baa9e369dcb6cf5055ca1889e2036714c0505a740d883b0ccd1cd13abd6

### Complete proposed decision

```json
{
  "claimId": "claim_03ebfa4088b7739930c4cf656a755f6b",
  "sourceUnitDigest": "31662baa9e369dcb6cf5055ca1889e2036714c0505a740d883b0ccd1cd13abd6",
  "targetOwner": "docs/platform/agent-confinement/contracts/confinement-authority-v1.md",
  "targetAnchor": "unheaded-block-26",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-54 (source lines 441-444) is carried at docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-26 (candidate lines 254-257). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "31662baa9e369dcb6cf5055ca1889e2036714c0505a740d883b0ccd1cd13abd6",
  "targetAncestry": [
    "Added in candidate: confinement authority v1",
    "6. Canonical contracts",
    "6.2 Nơi đặt policy"
  ]
}
```

### Full source shown text

```text
Không đặt policy, capability hay executor routing trong backend config. Không
đặt backend default ở cấp machine. Một field `enabled: false` có thể chủ động
vô hiệu hóa instance, nhưng trạng thái thực sự dùng được phải do `fgos doctor`
kiểm tra, không do `enabled: true` tự khẳng định.
```

### Full target shown text

```text
Không đặt policy, capability hay executor routing trong backend config. Không
đặt backend default ở cấp machine. Một field `enabled: false` có thể chủ động
vô hiệu hóa instance, nhưng trạng thái thực sự dùng được phải do `fgos doctor`
kiểm tra, không do `enabled: true` tự khẳng định.
```

## claim_542bb522121735ddb090894820aef357

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-55; lines 446–447; ancestry ["Spec: Agent Confinement Authority","6. Canonical contracts","6.2 Nơi đặt policy"].
Target: docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-27; ancestry ["Added in candidate: confinement authority v1","6. Canonical contracts","6.2 Nơi đặt policy"].
Source digest: 6e03ccb65264e6643bf7207bc062fa8805c7576c3ee873d95818f0e06730f263
Target digest: 6e03ccb65264e6643bf7207bc062fa8805c7576c3ee873d95818f0e06730f263
Shown source SHA256: 6e03ccb65264e6643bf7207bc062fa8805c7576c3ee873d95818f0e06730f263
Shown target SHA256: 6e03ccb65264e6643bf7207bc062fa8805c7576c3ee873d95818f0e06730f263

### Complete proposed decision

```json
{
  "claimId": "claim_542bb522121735ddb090894820aef357",
  "sourceUnitDigest": "6e03ccb65264e6643bf7207bc062fa8805c7576c3ee873d95818f0e06730f263",
  "targetOwner": "docs/platform/agent-confinement/contracts/confinement-authority-v1.md",
  "targetAnchor": "unheaded-block-27",
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-55 (source lines 446-447) is carried at docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-27 (candidate lines 259-260). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "6e03ccb65264e6643bf7207bc062fa8805c7576c3ee873d95818f0e06730f263",
  "targetAncestry": [
    "Added in candidate: confinement authority v1",
    "6. Canonical contracts",
    "6.2 Nơi đặt policy"
  ]
}
```

### Full source shown text

```text
Built-in driver config dùng discriminated schema; đây là config deployment,
không phải lời tự khai về security capability:
```

### Full target shown text

```text
Built-in driver config dùng discriminated schema; đây là config deployment,
không phải lời tự khai về security capability:
```

## claim_4425d37263ae0477205ac7493e0489a6

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-56; lines 449–476; ancestry ["Spec: Agent Confinement Authority","6. Canonical contracts","6.2 Nơi đặt policy"].
Target: docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-28; ancestry ["Added in candidate: confinement authority v1","6. Canonical contracts","6.2 Nơi đặt policy"].
Source digest: 41e420ab27f84a409a736afe94d48d53b7189944b2e8eab354d5808f1928d87e
Target digest: 41e420ab27f84a409a736afe94d48d53b7189944b2e8eab354d5808f1928d87e
Shown source SHA256: 41e420ab27f84a409a736afe94d48d53b7189944b2e8eab354d5808f1928d87e
Shown target SHA256: 41e420ab27f84a409a736afe94d48d53b7189944b2e8eab354d5808f1928d87e

### Complete proposed decision

```json
{
  "claimId": "claim_4425d37263ae0477205ac7493e0489a6",
  "sourceUnitDigest": "41e420ab27f84a409a736afe94d48d53b7189944b2e8eab354d5808f1928d87e",
  "targetOwner": "docs/platform/agent-confinement/contracts/confinement-authority-v1.md",
  "targetAnchor": "unheaded-block-28",
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-56 (source lines 449-476) is carried at docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-28 (candidate lines 262-289). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "41e420ab27f84a409a736afe94d48d53b7189944b2e8eab354d5808f1928d87e",
  "targetAncestry": [
    "Added in candidate: confinement authority v1",
    "6. Canonical contracts",
    "6.2 Nơi đặt policy"
  ]
}
```

### Full source shown text

````text
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
````

### Full target shown text

````text
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
````

## claim_362e53bd4c41468d0f31bbaff3766062

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-57; lines 478–482; ancestry ["Spec: Agent Confinement Authority","6. Canonical contracts","6.2 Nơi đặt policy"].
Target: docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-29; ancestry ["Added in candidate: confinement authority v1","6. Canonical contracts","6.2 Nơi đặt policy"].
Source digest: 05c490af337290c284cdda8846ae5ae6c55ba87783b627d5565966fbb32ff22c
Target digest: 05c490af337290c284cdda8846ae5ae6c55ba87783b627d5565966fbb32ff22c
Shown source SHA256: 05c490af337290c284cdda8846ae5ae6c55ba87783b627d5565966fbb32ff22c
Shown target SHA256: 05c490af337290c284cdda8846ae5ae6c55ba87783b627d5565966fbb32ff22c

### Complete proposed decision

```json
{
  "claimId": "claim_362e53bd4c41468d0f31bbaff3766062",
  "sourceUnitDigest": "05c490af337290c284cdda8846ae5ae6c55ba87783b627d5565966fbb32ff22c",
  "targetOwner": "docs/platform/agent-confinement/contracts/confinement-authority-v1.md",
  "targetAnchor": "unheaded-block-29",
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-57 (source lines 478-482) is carried at docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-29 (candidate lines 291-295). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "05c490af337290c284cdda8846ae5ae6c55ba87783b627d5565966fbb32ff22c",
  "targetAncestry": [
    "Added in candidate: confinement authority v1",
    "6. Canonical contracts",
    "6.2 Nơi đặt policy"
  ]
}
```

### Full source shown text

```text
Contract cho phép đăng ký driver type mới cùng schema riêng mà không đổi
`ConfinementPolicyV1`. Mỗi registry entry phải validate theo driver schema trước
khi executor được dùng. Năng lực thực tế như network isolation hay writable
mount support do driver implementation và doctor probe xác nhận, không phải
field boolean do người dùng tự khai.
```

### Full target shown text

```text
Contract cho phép đăng ký driver type mới cùng schema riêng mà không đổi
`ConfinementPolicyV1`. Mỗi registry entry phải validate theo driver schema trước
khi executor được dùng. Năng lực thực tế như network isolation hay writable
mount support do driver implementation và doctor probe xác nhận, không phải
field boolean do người dùng tự khai.
```

## claim_85614de5b582dd7f646938bf02212fad

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#621-trust-boundary-của-backend-registry; lines 484–484; ancestry ["Spec: Agent Confinement Authority","6. Canonical contracts","6.2 Nơi đặt policy"].
Target: docs/platform/agent-confinement/contracts/confinement-authority-v1.md#621-trust-boundary-của-backend-registry; ancestry ["Added in candidate: confinement authority v1","6. Canonical contracts","6.2 Nơi đặt policy"].
Source digest: 6881955b6321c52b6c9feb850cdd00c7205c99aa02bdd18025a771e908b91003
Target digest: 6881955b6321c52b6c9feb850cdd00c7205c99aa02bdd18025a771e908b91003
Shown source SHA256: 2208e5ff53145c4c6d215be34b2c3a4ceb9455655d3168d3e335d39e25e1e317
Shown target SHA256: 2208e5ff53145c4c6d215be34b2c3a4ceb9455655d3168d3e335d39e25e1e317

### Complete proposed decision

```json
{
  "claimId": "claim_85614de5b582dd7f646938bf02212fad",
  "sourceUnitDigest": "6881955b6321c52b6c9feb850cdd00c7205c99aa02bdd18025a771e908b91003",
  "targetOwner": "docs/platform/agent-confinement/contracts/confinement-authority-v1.md",
  "targetAnchor": "621-trust-boundary-của-backend-registry",
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole heading unit docs/specs/confinement-authority.md#621-trust-boundary-của-backend-registry (source lines 484-484) is carried at docs/platform/agent-confinement/contracts/confinement-authority-v1.md#621-trust-boundary-của-backend-registry (candidate lines 297-297). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "6881955b6321c52b6c9feb850cdd00c7205c99aa02bdd18025a771e908b91003",
  "targetAncestry": [
    "Added in candidate: confinement authority v1",
    "6. Canonical contracts",
    "6.2 Nơi đặt policy"
  ]
}
```

### Full source shown text

```text
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
```

### Full target shown text

```text
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
```

## claim_534f0deefbdb22153d1310a77bc908e8

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-58; lines 486–490; ancestry ["Spec: Agent Confinement Authority","6. Canonical contracts","6.2 Nơi đặt policy","6.2.1 Trust boundary của backend registry"].
Target: docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-30; ancestry ["Added in candidate: confinement authority v1","6. Canonical contracts","6.2 Nơi đặt policy","6.2.1 Trust boundary của backend registry"].
Source digest: 8d1d0290f08fff8a37ca8c4df31c7e374a99a8a734dfed30635740417f6b2449
Target digest: 8d1d0290f08fff8a37ca8c4df31c7e374a99a8a734dfed30635740417f6b2449
Shown source SHA256: 8d1d0290f08fff8a37ca8c4df31c7e374a99a8a734dfed30635740417f6b2449
Shown target SHA256: 8d1d0290f08fff8a37ca8c4df31c7e374a99a8a734dfed30635740417f6b2449

### Complete proposed decision

```json
{
  "claimId": "claim_534f0deefbdb22153d1310a77bc908e8",
  "sourceUnitDigest": "8d1d0290f08fff8a37ca8c4df31c7e374a99a8a734dfed30635740417f6b2449",
  "targetOwner": "docs/platform/agent-confinement/contracts/confinement-authority-v1.md",
  "targetAnchor": "unheaded-block-30",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-58 (source lines 486-490) is carried at docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-30 (candidate lines 299-303). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "8d1d0290f08fff8a37ca8c4df31c7e374a99a8a734dfed30635740417f6b2449",
  "targetAncestry": [
    "Added in candidate: confinement authority v1",
    "6. Canonical contracts",
    "6.2 Nơi đặt policy",
    "6.2.1 Trust boundary của backend registry"
  ]
}
```

### Full source shown text

```text
`confinementBackends` là machine state do `fgos setup`/`fgos doctor` quản lý,
không nằm trong project-over-global config merge. Project config được phép khai
policy, executor và tham chiếu backend instance ID, nhưng không được định nghĩa
hoặc ghi đè `type`, `executable`, runtime endpoint hay credential source của
backend instance.
```

### Full target shown text

```text
`confinementBackends` là machine state do `fgos setup`/`fgos doctor` quản lý,
không nằm trong project-over-global config merge. Project config được phép khai
policy, executor và tham chiếu backend instance ID, nhưng không được định nghĩa
hoặc ghi đè `type`, `executable`, runtime endpoint hay credential source của
backend instance.
```

## claim_23c306e93da431c5b58dc42eae67791c

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-59; lines 492–497; ancestry ["Spec: Agent Confinement Authority","6. Canonical contracts","6.2 Nơi đặt policy","6.2.1 Trust boundary của backend registry"].
Target: docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-31; ancestry ["Added in candidate: confinement authority v1","6. Canonical contracts","6.2 Nơi đặt policy","6.2.1 Trust boundary của backend registry"].
Source digest: b23088a2e289401fe24b97ed2e1a116c59e6fbf44c5a2a23addf2a1e61ff87c3
Target digest: b23088a2e289401fe24b97ed2e1a116c59e6fbf44c5a2a23addf2a1e61ff87c3
Shown source SHA256: b23088a2e289401fe24b97ed2e1a116c59e6fbf44c5a2a23addf2a1e61ff87c3
Shown target SHA256: b23088a2e289401fe24b97ed2e1a116c59e6fbf44c5a2a23addf2a1e61ff87c3

### Complete proposed decision

```json
{
  "claimId": "claim_23c306e93da431c5b58dc42eae67791c",
  "sourceUnitDigest": "b23088a2e289401fe24b97ed2e1a116c59e6fbf44c5a2a23addf2a1e61ff87c3",
  "targetOwner": "docs/platform/agent-confinement/contracts/confinement-authority-v1.md",
  "targetAnchor": "unheaded-block-31",
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-59 (source lines 492-497) is carried at docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-31 (candidate lines 305-310). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "b23088a2e289401fe24b97ed2e1a116c59e6fbf44c5a2a23addf2a1e61ff87c3",
  "targetAncestry": [
    "Added in candidate: confinement authority v1",
    "6. Canonical contracts",
    "6.2 Nơi đặt policy",
    "6.2.1 Trust boundary của backend registry"
  ]
}
```

### Full source shown text

```text
Ranh giới này không thay đổi luật project config thắng global config: luật đó
vẫn áp dụng nguyên vẹn cho shared config schema. Backend registry là security
trust store riêng, tương tự machine capability state, không phải cấp config thứ
ba tham gia precedence. Đường dẫn lưu trữ là chi tiết của distribution/state
resolver; caller không được tự dựng path hay truyền registry document vào
Authority.
```

### Full target shown text

```text
Ranh giới này không thay đổi luật project config thắng global config: luật đó
vẫn áp dụng nguyên vẹn cho shared config schema. Backend registry là security
trust store riêng, tương tự machine capability state, không phải cấp config thứ
ba tham gia precedence. Đường dẫn lưu trữ là chi tiết của distribution/state
resolver; caller không được tự dựng path hay truyền registry document vào
Authority.
```
