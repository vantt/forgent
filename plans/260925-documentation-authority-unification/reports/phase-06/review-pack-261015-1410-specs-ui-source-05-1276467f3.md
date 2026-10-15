# Bounded source review pack

Content commit: 1276467f37a99d19aff05808d42fafbf40341449
Author session: codex-session:unit-run-1792045007741-a245b0a6@2026-10-15
Shard: plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json
Shard SHA256: 3d2bbc942e416345213d8b225e43ee69a2f63149f6b8768e23017f5dc829ed68
Source: docs/specs/confinement-authority.md
Part 5/7; entries: **30**. All decisions remain pending.

Read review-brief.md, owner-answers.md (A19/A22/A28/A34/A36/A39), the frozen specs-ui map and minimum constitution. Verify all rows mechanically: full digest recomputation, anchor, ancestry, exact-proof thresholds and shard/pack equality. Independently choose and record the seed and IDs for at least 10/11 Weak-exact/Judgment rows (15%, minimum 10, all if fewer), plus all unequal pairs and generated no-target rows below. Read both directions with a diff; read generation provenance for no-target rows. More than 3% deep rework requires full-pack deep reading. No producer seed/draw/verdict. Retain separate script-exact stratified spot checks; ordinary source approval does not certify truth or eligibility.

A36 class lists and mandatory deep IDs:

```json
{
  "classes": {
    "Unit-exact": [
      "claim_c0cd54862f6365e2da2856925bef04c1",
      "claim_2cfa54b977cf929a5f73250095379bd2",
      "claim_26b3a49adef572e1be2ed219e292c8b0",
      "claim_d7fa39da9698c447594edefdc44d7ce5",
      "claim_daf2ec0996ad074a68903680fce85adb",
      "claim_73ae83a090b77eed0e84212e99fa6e7c",
      "claim_f1aeeff92e7bbf3f52b1cc88896cc41e",
      "claim_1538dad17e4fa44207a7f70dc2ca7b55",
      "claim_daa730ce31dbd045d14a42c31c57f316",
      "claim_1a847c3e3266a47169a83f7ac836ef7b",
      "claim_d4bc3fb932ca2d29e917119191f45f1c",
      "claim_3770d5a0b897fbd8c1393a38c48c3333",
      "claim_68dd1d19379c9a16393429b5e2aac34a",
      "claim_b1731956c352b9977eef7ffa07f88991",
      "claim_54f630d44a33c5624ebeca834cf25ceb",
      "claim_220b8163566ad8b38cbf1d534c871e42",
      "claim_9d863e7c1e4c3983292845628b60e041",
      "claim_bb5abf5828264d19c061b9b0920618a3",
      "claim_bd94f9efb9ccdbbc8ca5b90916290c6f"
    ],
    "Weak-exact": [
      "claim_46c173824da77fbf25f59072ae8e1620",
      "claim_cd345b6c8a7da2451c2acf04ba8c5292",
      "claim_9a1cd05f74418890fbca8955aa76b378",
      "claim_cc0d485b1b93357edb755f4121a26206",
      "claim_2c080a72c195a28a1ca8efb0e1187f11",
      "claim_96b54d15ac01f69e7df991151c2268be",
      "claim_029dd2509143e3a718a8fc0b7f7be03e",
      "claim_0a81cfc730773e8a468f69c67e1a7948",
      "claim_1ef2bc00c79bc7a40787b62a4943f0df",
      "claim_7aacf43ab14386fce6c4a5a8a0519402",
      "claim_9168d8af609c58932a87918d4a49b8aa"
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


## claim_46c173824da77fbf25f59072ae8e1620

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#86-crash-và-cleanup; lines 1084–1084; ancestry ["Spec: Agent Confinement Authority","8. Policy resolution và edge cases"].
Target: docs/platform/agent-confinement/spec.md#86-crash-và-cleanup; ancestry ["Spec: Agent Confinement Authority","8. Policy resolution và edge cases"].
Source digest: a021e5594432d44b1543517b1219a7406a72c4ba9503363e1f8eef3f8085524a
Target digest: a021e5594432d44b1543517b1219a7406a72c4ba9503363e1f8eef3f8085524a
Shown source SHA256: 112d0c3220c0e651b5bd39452b9ab928d1e4c1dc2da47b3861457c2b7f63a9a5
Shown target SHA256: 112d0c3220c0e651b5bd39452b9ab928d1e4c1dc2da47b3861457c2b7f63a9a5

### Complete proposed decision

```json
{
  "claimId": "claim_46c173824da77fbf25f59072ae8e1620",
  "sourceUnitDigest": "a021e5594432d44b1543517b1219a7406a72c4ba9503363e1f8eef3f8085524a",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "86-crash-và-cleanup",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/specs/confinement-authority.md#86-crash-và-cleanup (source lines 1084-1084) is carried at docs/platform/agent-confinement/spec.md#86-crash-và-cleanup (candidate lines 348-348). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "a021e5594432d44b1543517b1219a7406a72c4ba9503363e1f8eef3f8085524a",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "8. Policy resolution và edge cases"
  ]
}
```

### Full source shown text

```text
### 8.6 Crash và cleanup

Nghĩa vụ chung của Authority là giữ evidence/ownership identity và chỉ cho phép
dọn sau khi execution đã dừng; recovery mechanics được chọn theo driver profile.
Local-bwrap-v1 dùng thư mục tạm theo dispatchId tạo dưới trusted root, ownership
marker trước allocation, finally và startup reaper idempotent. Reaper kiểm tra
process identity/liveness (không chỉ PID trần) trước khi dọn; host-disk private
home không tự biến mất khi process exit. Không cần remote lease/journal engine
cho default local. Phần journal/lease dưới đây áp dụng profile có resource sống
ngoài process local (remote/container detached), không phải gate chung của S4.

Attestation `prepared` được ghi trước adapter call. Cleanup chạy trong
`finally`; partial prepare cũng phải cung cấp cleanup handle như quy định ở
§6.5. Startup reaper nhận diện resource tạm qua dispatch id và dọn phần còn
lại. Cleanup failure không được biến execution chưa rõ thành thành công, và
không được che mất execution result đã có. Nếu Authority crash sau khi prepare,
run record giữ phase cuối cùng và reaper xử lý resource chưa dọn.

Reaper và recovery hỏi đúng herdr session mà worker được khởi chạy trong đó: bản ghi launch command và ownership marker của home được giữ lại mang `herdrSession` (socket suy ra từ tên, không lưu), `reconcile` dựng client theo session đó, reaper dùng `FGOS_HERDR_BIN` và cùng session; marker không có session thì trạng thái pane là không rõ và quy tắc hết hạn quyết định.

Với profile remote/container detached, Authority cấp resource identity và ghi allocation intent bền vững trước mỗi
side effect prepare; driver tạo theo identity đó một cách idempotent. Journal
ghi dispatch id, backend snapshot reference, resource locator, lease/execution
identity và trạng thái allocation/collection/cleanup, không chứa credential.
Callback cleanup chỉ là tối ưu trong process; recovery không phụ thuộc callback.
Reaper phải lấy recovery lease độc quyền, kiểm tra liveness bằng execution
identity chống PID reuse, dừng và xác nhận cả execution tree trước khi collect
và cleanup idempotent. Timeout/cancel cũng tuân cùng thứ tự. Không liên lạc được
remote thì giữ unknown và cleanup pending, không suy agent đã dừng; reconnect
hoặc backend lease-expiry có proof mới cho phép dọn. Resource chưa collect được
giữ cho recovery, không xóa vì agent đã exit. Startup reaper dùng cùng registry
setup/doctor; backend không có recovery contract này chưa được nhận required.

Local profile chỉ phải đáp ứng invariants ownership/liveness/idempotence nêu
trên, không phải triển khai journal/lease schema của remote.
```

### Full target shown text

```text
### 8.6 Crash và cleanup

Nghĩa vụ chung của Authority là giữ evidence/ownership identity và chỉ cho phép
dọn sau khi execution đã dừng; recovery mechanics được chọn theo driver profile.
Local-bwrap-v1 dùng thư mục tạm theo dispatchId tạo dưới trusted root, ownership
marker trước allocation, finally và startup reaper idempotent. Reaper kiểm tra
process identity/liveness (không chỉ PID trần) trước khi dọn; host-disk private
home không tự biến mất khi process exit. Không cần remote lease/journal engine
cho default local. Phần journal/lease dưới đây áp dụng profile có resource sống
ngoài process local (remote/container detached), không phải gate chung của S4.

Attestation `prepared` được ghi trước adapter call. Cleanup chạy trong
`finally`; partial prepare cũng phải cung cấp cleanup handle như quy định ở
§6.5. Startup reaper nhận diện resource tạm qua dispatch id và dọn phần còn
lại. Cleanup failure không được biến execution chưa rõ thành thành công, và
không được che mất execution result đã có. Nếu Authority crash sau khi prepare,
run record giữ phase cuối cùng và reaper xử lý resource chưa dọn.

Reaper và recovery hỏi đúng herdr session mà worker được khởi chạy trong đó: bản ghi launch command và ownership marker của home được giữ lại mang `herdrSession` (socket suy ra từ tên, không lưu), `reconcile` dựng client theo session đó, reaper dùng `FGOS_HERDR_BIN` và cùng session; marker không có session thì trạng thái pane là không rõ và quy tắc hết hạn quyết định.

Với profile remote/container detached, Authority cấp resource identity và ghi allocation intent bền vững trước mỗi
side effect prepare; driver tạo theo identity đó một cách idempotent. Journal
ghi dispatch id, backend snapshot reference, resource locator, lease/execution
identity và trạng thái allocation/collection/cleanup, không chứa credential.
Callback cleanup chỉ là tối ưu trong process; recovery không phụ thuộc callback.
Reaper phải lấy recovery lease độc quyền, kiểm tra liveness bằng execution
identity chống PID reuse, dừng và xác nhận cả execution tree trước khi collect
và cleanup idempotent. Timeout/cancel cũng tuân cùng thứ tự. Không liên lạc được
remote thì giữ unknown và cleanup pending, không suy agent đã dừng; reconnect
hoặc backend lease-expiry có proof mới cho phép dọn. Resource chưa collect được
giữ cho recovery, không xóa vì agent đã exit. Startup reaper dùng cùng registry
setup/doctor; backend không có recovery contract này chưa được nhận required.

Local profile chỉ phải đáp ứng invariants ownership/liveness/idempotence nêu
trên, không phải triển khai journal/lease schema của remote.
```

## claim_c0cd54862f6365e2da2856925bef04c1

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-110; lines 1086–1093; ancestry ["Spec: Agent Confinement Authority","8. Policy resolution và edge cases","8.6 Crash và cleanup"].
Target: docs/platform/agent-confinement/spec.md#unheaded-block-43; ancestry ["Spec: Agent Confinement Authority","8. Policy resolution và edge cases","8.6 Crash và cleanup"].
Source digest: 237461836affe4167aaf89d08ee087d9de21a39a3afc2f10e54bfe6bcaeaeb2b
Target digest: 237461836affe4167aaf89d08ee087d9de21a39a3afc2f10e54bfe6bcaeaeb2b
Shown source SHA256: 237461836affe4167aaf89d08ee087d9de21a39a3afc2f10e54bfe6bcaeaeb2b
Shown target SHA256: 237461836affe4167aaf89d08ee087d9de21a39a3afc2f10e54bfe6bcaeaeb2b

### Complete proposed decision

```json
{
  "claimId": "claim_c0cd54862f6365e2da2856925bef04c1",
  "sourceUnitDigest": "237461836affe4167aaf89d08ee087d9de21a39a3afc2f10e54bfe6bcaeaeb2b",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "unheaded-block-43",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-110 (source lines 1086-1093) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-43 (candidate lines 350-357). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "237461836affe4167aaf89d08ee087d9de21a39a3afc2f10e54bfe6bcaeaeb2b",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "8. Policy resolution và edge cases",
    "8.6 Crash và cleanup"
  ]
}
```

### Full source shown text

```text
Nghĩa vụ chung của Authority là giữ evidence/ownership identity và chỉ cho phép
dọn sau khi execution đã dừng; recovery mechanics được chọn theo driver profile.
Local-bwrap-v1 dùng thư mục tạm theo dispatchId tạo dưới trusted root, ownership
marker trước allocation, finally và startup reaper idempotent. Reaper kiểm tra
process identity/liveness (không chỉ PID trần) trước khi dọn; host-disk private
home không tự biến mất khi process exit. Không cần remote lease/journal engine
cho default local. Phần journal/lease dưới đây áp dụng profile có resource sống
ngoài process local (remote/container detached), không phải gate chung của S4.
```

### Full target shown text

```text
Nghĩa vụ chung của Authority là giữ evidence/ownership identity và chỉ cho phép
dọn sau khi execution đã dừng; recovery mechanics được chọn theo driver profile.
Local-bwrap-v1 dùng thư mục tạm theo dispatchId tạo dưới trusted root, ownership
marker trước allocation, finally và startup reaper idempotent. Reaper kiểm tra
process identity/liveness (không chỉ PID trần) trước khi dọn; host-disk private
home không tự biến mất khi process exit. Không cần remote lease/journal engine
cho default local. Phần journal/lease dưới đây áp dụng profile có resource sống
ngoài process local (remote/container detached), không phải gate chung của S4.
```

## claim_2cfa54b977cf929a5f73250095379bd2

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-111; lines 1095–1100; ancestry ["Spec: Agent Confinement Authority","8. Policy resolution và edge cases","8.6 Crash và cleanup"].
Target: docs/platform/agent-confinement/spec.md#unheaded-block-44; ancestry ["Spec: Agent Confinement Authority","8. Policy resolution và edge cases","8.6 Crash và cleanup"].
Source digest: 0ab59371b3385f8142084098da1a758776a37360071cd460fdb90dea8eb2a8f1
Target digest: 0ab59371b3385f8142084098da1a758776a37360071cd460fdb90dea8eb2a8f1
Shown source SHA256: 0ab59371b3385f8142084098da1a758776a37360071cd460fdb90dea8eb2a8f1
Shown target SHA256: 0ab59371b3385f8142084098da1a758776a37360071cd460fdb90dea8eb2a8f1

### Complete proposed decision

```json
{
  "claimId": "claim_2cfa54b977cf929a5f73250095379bd2",
  "sourceUnitDigest": "0ab59371b3385f8142084098da1a758776a37360071cd460fdb90dea8eb2a8f1",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "unheaded-block-44",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-111 (source lines 1095-1100) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-44 (candidate lines 359-364). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "0ab59371b3385f8142084098da1a758776a37360071cd460fdb90dea8eb2a8f1",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "8. Policy resolution và edge cases",
    "8.6 Crash và cleanup"
  ]
}
```

### Full source shown text

```text
Attestation `prepared` được ghi trước adapter call. Cleanup chạy trong
`finally`; partial prepare cũng phải cung cấp cleanup handle như quy định ở
§6.5. Startup reaper nhận diện resource tạm qua dispatch id và dọn phần còn
lại. Cleanup failure không được biến execution chưa rõ thành thành công, và
không được che mất execution result đã có. Nếu Authority crash sau khi prepare,
run record giữ phase cuối cùng và reaper xử lý resource chưa dọn.
```

### Full target shown text

```text
Attestation `prepared` được ghi trước adapter call. Cleanup chạy trong
`finally`; partial prepare cũng phải cung cấp cleanup handle như quy định ở
§6.5. Startup reaper nhận diện resource tạm qua dispatch id và dọn phần còn
lại. Cleanup failure không được biến execution chưa rõ thành thành công, và
không được che mất execution result đã có. Nếu Authority crash sau khi prepare,
run record giữ phase cuối cùng và reaper xử lý resource chưa dọn.
```

## claim_26b3a49adef572e1be2ed219e292c8b0

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-112; lines 1102–1102; ancestry ["Spec: Agent Confinement Authority","8. Policy resolution và edge cases","8.6 Crash và cleanup"].
Target: docs/platform/agent-confinement/spec.md#unheaded-block-45; ancestry ["Spec: Agent Confinement Authority","8. Policy resolution và edge cases","8.6 Crash và cleanup"].
Source digest: ab25a8a3c32e9f823859789e4005083667f0b527ebafe9a4d572c918738bdefe
Target digest: ab25a8a3c32e9f823859789e4005083667f0b527ebafe9a4d572c918738bdefe
Shown source SHA256: ab25a8a3c32e9f823859789e4005083667f0b527ebafe9a4d572c918738bdefe
Shown target SHA256: ab25a8a3c32e9f823859789e4005083667f0b527ebafe9a4d572c918738bdefe

### Complete proposed decision

```json
{
  "claimId": "claim_26b3a49adef572e1be2ed219e292c8b0",
  "sourceUnitDigest": "ab25a8a3c32e9f823859789e4005083667f0b527ebafe9a4d572c918738bdefe",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "unheaded-block-45",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-112 (source lines 1102-1102) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-45 (candidate lines 366-366). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "ab25a8a3c32e9f823859789e4005083667f0b527ebafe9a4d572c918738bdefe",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "8. Policy resolution và edge cases",
    "8.6 Crash và cleanup"
  ]
}
```

### Full source shown text

```text
Reaper và recovery hỏi đúng herdr session mà worker được khởi chạy trong đó: bản ghi launch command và ownership marker của home được giữ lại mang `herdrSession` (socket suy ra từ tên, không lưu), `reconcile` dựng client theo session đó, reaper dùng `FGOS_HERDR_BIN` và cùng session; marker không có session thì trạng thái pane là không rõ và quy tắc hết hạn quyết định.
```

### Full target shown text

```text
Reaper và recovery hỏi đúng herdr session mà worker được khởi chạy trong đó: bản ghi launch command và ownership marker của home được giữ lại mang `herdrSession` (socket suy ra từ tên, không lưu), `reconcile` dựng client theo session đó, reaper dùng `FGOS_HERDR_BIN` và cùng session; marker không có session thì trạng thái pane là không rõ và quy tắc hết hạn quyết định.
```

## claim_d7fa39da9698c447594edefdc44d7ce5

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-113; lines 1104–1115; ancestry ["Spec: Agent Confinement Authority","8. Policy resolution và edge cases","8.6 Crash và cleanup"].
Target: docs/platform/agent-confinement/spec.md#unheaded-block-46; ancestry ["Spec: Agent Confinement Authority","8. Policy resolution và edge cases","8.6 Crash và cleanup"].
Source digest: a89aecc164ff54f3f6807a0d3231e27b4ca2c77c4e41fd121bbfdb18ea8024f0
Target digest: a89aecc164ff54f3f6807a0d3231e27b4ca2c77c4e41fd121bbfdb18ea8024f0
Shown source SHA256: a89aecc164ff54f3f6807a0d3231e27b4ca2c77c4e41fd121bbfdb18ea8024f0
Shown target SHA256: a89aecc164ff54f3f6807a0d3231e27b4ca2c77c4e41fd121bbfdb18ea8024f0

### Complete proposed decision

```json
{
  "claimId": "claim_d7fa39da9698c447594edefdc44d7ce5",
  "sourceUnitDigest": "a89aecc164ff54f3f6807a0d3231e27b4ca2c77c4e41fd121bbfdb18ea8024f0",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "unheaded-block-46",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-113 (source lines 1104-1115) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-46 (candidate lines 368-379). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "a89aecc164ff54f3f6807a0d3231e27b4ca2c77c4e41fd121bbfdb18ea8024f0",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "8. Policy resolution và edge cases",
    "8.6 Crash và cleanup"
  ]
}
```

### Full source shown text

```text
Với profile remote/container detached, Authority cấp resource identity và ghi allocation intent bền vững trước mỗi
side effect prepare; driver tạo theo identity đó một cách idempotent. Journal
ghi dispatch id, backend snapshot reference, resource locator, lease/execution
identity và trạng thái allocation/collection/cleanup, không chứa credential.
Callback cleanup chỉ là tối ưu trong process; recovery không phụ thuộc callback.
Reaper phải lấy recovery lease độc quyền, kiểm tra liveness bằng execution
identity chống PID reuse, dừng và xác nhận cả execution tree trước khi collect
và cleanup idempotent. Timeout/cancel cũng tuân cùng thứ tự. Không liên lạc được
remote thì giữ unknown và cleanup pending, không suy agent đã dừng; reconnect
hoặc backend lease-expiry có proof mới cho phép dọn. Resource chưa collect được
giữ cho recovery, không xóa vì agent đã exit. Startup reaper dùng cùng registry
setup/doctor; backend không có recovery contract này chưa được nhận required.
```

### Full target shown text

```text
Với profile remote/container detached, Authority cấp resource identity và ghi allocation intent bền vững trước mỗi
side effect prepare; driver tạo theo identity đó một cách idempotent. Journal
ghi dispatch id, backend snapshot reference, resource locator, lease/execution
identity và trạng thái allocation/collection/cleanup, không chứa credential.
Callback cleanup chỉ là tối ưu trong process; recovery không phụ thuộc callback.
Reaper phải lấy recovery lease độc quyền, kiểm tra liveness bằng execution
identity chống PID reuse, dừng và xác nhận cả execution tree trước khi collect
và cleanup idempotent. Timeout/cancel cũng tuân cùng thứ tự. Không liên lạc được
remote thì giữ unknown và cleanup pending, không suy agent đã dừng; reconnect
hoặc backend lease-expiry có proof mới cho phép dọn. Resource chưa collect được
giữ cho recovery, không xóa vì agent đã exit. Startup reaper dùng cùng registry
setup/doctor; backend không có recovery contract này chưa được nhận required.
```

## claim_daf2ec0996ad074a68903680fce85adb

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-114; lines 1117–1118; ancestry ["Spec: Agent Confinement Authority","8. Policy resolution và edge cases","8.6 Crash và cleanup"].
Target: docs/platform/agent-confinement/spec.md#unheaded-block-47; ancestry ["Spec: Agent Confinement Authority","8. Policy resolution và edge cases","8.6 Crash và cleanup"].
Source digest: f43f3ff53150980b52653b87618308619ddaae4a8ce19572b2589bb7cf744f7a
Target digest: f43f3ff53150980b52653b87618308619ddaae4a8ce19572b2589bb7cf744f7a
Shown source SHA256: f43f3ff53150980b52653b87618308619ddaae4a8ce19572b2589bb7cf744f7a
Shown target SHA256: f43f3ff53150980b52653b87618308619ddaae4a8ce19572b2589bb7cf744f7a

### Complete proposed decision

```json
{
  "claimId": "claim_daf2ec0996ad074a68903680fce85adb",
  "sourceUnitDigest": "f43f3ff53150980b52653b87618308619ddaae4a8ce19572b2589bb7cf744f7a",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "unheaded-block-47",
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-114 (source lines 1117-1118) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-47 (candidate lines 381-382). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "f43f3ff53150980b52653b87618308619ddaae4a8ce19572b2589bb7cf744f7a",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "8. Policy resolution và edge cases",
    "8.6 Crash và cleanup"
  ]
}
```

### Full source shown text

```text
Local profile chỉ phải đáp ứng invariants ownership/liveness/idempotence nêu
trên, không phải triển khai journal/lease schema của remote.
```

### Full target shown text

```text
Local profile chỉ phải đáp ứng invariants ownership/liveness/idempotence nêu
trên, không phải triển khai journal/lease schema của remote.
```

## claim_cd345b6c8a7da2451c2acf04ba8c5292

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#87-bảng-tình-huống-chuẩn; lines 1120–1120; ancestry ["Spec: Agent Confinement Authority","8. Policy resolution và edge cases"].
Target: docs/platform/agent-confinement/spec.md#87-bảng-tình-huống-chuẩn; ancestry ["Spec: Agent Confinement Authority","8. Policy resolution và edge cases"].
Source digest: 951028a48688bf9bf121f61795876c4aa5bbe52d0dd58383dbb76608271980f9
Target digest: 951028a48688bf9bf121f61795876c4aa5bbe52d0dd58383dbb76608271980f9
Shown source SHA256: 11233a832534c22e326967e6c7f56c21938253459e96162e177e6492cb53fa85
Shown target SHA256: 11233a832534c22e326967e6c7f56c21938253459e96162e177e6492cb53fa85

### Complete proposed decision

```json
{
  "claimId": "claim_cd345b6c8a7da2451c2acf04ba8c5292",
  "sourceUnitDigest": "951028a48688bf9bf121f61795876c4aa5bbe52d0dd58383dbb76608271980f9",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "87-bảng-tình-huống-chuẩn",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/specs/confinement-authority.md#87-bảng-tình-huống-chuẩn (source lines 1120-1120) is carried at docs/platform/agent-confinement/spec.md#87-bảng-tình-huống-chuẩn (candidate lines 384-384). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "951028a48688bf9bf121f61795876c4aa5bbe52d0dd58383dbb76608271980f9",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "8. Policy resolution và edge cases"
  ]
}
```

### Full source shown text

```text
### 8.7 Bảng tình huống chuẩn

| Tình huống | Trước spawn | Kết quả cuối |
|---|---|---|
| Required, đủ coverage/readiness/proof | prepare rồi execute | enforced khi receipt/evidence khớp |
| Required, proof stale | tự refresh probe trước spawn | pass thì execute; fail/timeout thì refused |
| Preferred, thiếu network protection nhưng đủ needs | ghi degrade rồi execute phần đã assess | degraded |
| Preferred không backend, need private home chưa có | refuse, zero spawn | refused |
| Grant read-write, backend chỉ read, need read | coverage/readiness satisfied | có thể enforced |
| Grant read-write, backend chỉ read, need write | readiness unsatisfied, zero spawn | refused ở mọi mode |
| Prepare tạo resource rồi Authority crash | phục hồi theo profile (local marker hoặc journal) | unknown tới khi recovery có bằng chứng |
| Remote mất kết nối sau started | không suy đã dừng | failed/unknown, cleanup pending |
| Collect artifact thất bại | agent đã chạy, không refusal hồi tố | failed, giữ resource để thu lại |
```

### Full target shown text

```text
### 8.7 Bảng tình huống chuẩn

| Tình huống | Trước spawn | Kết quả cuối |
|---|---|---|
| Required, đủ coverage/readiness/proof | prepare rồi execute | enforced khi receipt/evidence khớp |
| Required, proof stale | tự refresh probe trước spawn | pass thì execute; fail/timeout thì refused |
| Preferred, thiếu network protection nhưng đủ needs | ghi degrade rồi execute phần đã assess | degraded |
| Preferred không backend, need private home chưa có | refuse, zero spawn | refused |
| Grant read-write, backend chỉ read, need read | coverage/readiness satisfied | có thể enforced |
| Grant read-write, backend chỉ read, need write | readiness unsatisfied, zero spawn | refused ở mọi mode |
| Prepare tạo resource rồi Authority crash | phục hồi theo profile (local marker hoặc journal) | unknown tới khi recovery có bằng chứng |
| Remote mất kết nối sau started | không suy đã dừng | failed/unknown, cleanup pending |
| Collect artifact thất bại | agent đã chạy, không refusal hồi tố | failed, giữ resource để thu lại |
```

## claim_73ae83a090b77eed0e84212e99fa6e7c

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-115; lines 1122–1132; ancestry ["Spec: Agent Confinement Authority","8. Policy resolution và edge cases","8.7 Bảng tình huống chuẩn"].
Target: docs/platform/agent-confinement/spec.md#unheaded-block-48; ancestry ["Spec: Agent Confinement Authority","8. Policy resolution và edge cases","8.7 Bảng tình huống chuẩn"].
Source digest: 0ef8d6c210698ac4fae241e133b626be662e36e1023900186b541f3f7d0e27b8
Target digest: 0ef8d6c210698ac4fae241e133b626be662e36e1023900186b541f3f7d0e27b8
Shown source SHA256: 0ef8d6c210698ac4fae241e133b626be662e36e1023900186b541f3f7d0e27b8
Shown target SHA256: 0ef8d6c210698ac4fae241e133b626be662e36e1023900186b541f3f7d0e27b8

### Complete proposed decision

```json
{
  "claimId": "claim_73ae83a090b77eed0e84212e99fa6e7c",
  "sourceUnitDigest": "0ef8d6c210698ac4fae241e133b626be662e36e1023900186b541f3f7d0e27b8",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "unheaded-block-48",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-115 (source lines 1122-1132) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-48 (candidate lines 386-396). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "0ef8d6c210698ac4fae241e133b626be662e36e1023900186b541f3f7d0e27b8",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "8. Policy resolution và edge cases",
    "8.7 Bảng tình huống chuẩn"
  ]
}
```

### Full source shown text

```text
| Tình huống | Trước spawn | Kết quả cuối |
|---|---|---|
| Required, đủ coverage/readiness/proof | prepare rồi execute | enforced khi receipt/evidence khớp |
| Required, proof stale | tự refresh probe trước spawn | pass thì execute; fail/timeout thì refused |
| Preferred, thiếu network protection nhưng đủ needs | ghi degrade rồi execute phần đã assess | degraded |
| Preferred không backend, need private home chưa có | refuse, zero spawn | refused |
| Grant read-write, backend chỉ read, need read | coverage/readiness satisfied | có thể enforced |
| Grant read-write, backend chỉ read, need write | readiness unsatisfied, zero spawn | refused ở mọi mode |
| Prepare tạo resource rồi Authority crash | phục hồi theo profile (local marker hoặc journal) | unknown tới khi recovery có bằng chứng |
| Remote mất kết nối sau started | không suy đã dừng | failed/unknown, cleanup pending |
| Collect artifact thất bại | agent đã chạy, không refusal hồi tố | failed, giữ resource để thu lại |
```

### Full target shown text

```text
| Tình huống | Trước spawn | Kết quả cuối |
|---|---|---|
| Required, đủ coverage/readiness/proof | prepare rồi execute | enforced khi receipt/evidence khớp |
| Required, proof stale | tự refresh probe trước spawn | pass thì execute; fail/timeout thì refused |
| Preferred, thiếu network protection nhưng đủ needs | ghi degrade rồi execute phần đã assess | degraded |
| Preferred không backend, need private home chưa có | refuse, zero spawn | refused |
| Grant read-write, backend chỉ read, need read | coverage/readiness satisfied | có thể enforced |
| Grant read-write, backend chỉ read, need write | readiness unsatisfied, zero spawn | refused ở mọi mode |
| Prepare tạo resource rồi Authority crash | phục hồi theo profile (local marker hoặc journal) | unknown tới khi recovery có bằng chứng |
| Remote mất kết nối sau started | không suy đã dừng | failed/unknown, cleanup pending |
| Collect artifact thất bại | agent đã chạy, không refusal hồi tố | failed, giữ resource để thu lại |
```

## claim_9a1cd05f74418890fbca8955aa76b378

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#9-default-implementation-đầu-tiên; lines 1134–1134; ancestry ["Spec: Agent Confinement Authority"].
Target: docs/platform/agent-confinement/spec.md#9-default-implementation-đầu-tiên; ancestry ["Spec: Agent Confinement Authority"].
Source digest: e78c37d28fb7fbf09e1c978624d56d78b442c8082d44b3b19c61e9be95642831
Target digest: e78c37d28fb7fbf09e1c978624d56d78b442c8082d44b3b19c61e9be95642831
Shown source SHA256: 697667bf86341f1cd8e05ecae3e97ad831b56fc07baf1449792b17b1400ee355
Shown target SHA256: 697667bf86341f1cd8e05ecae3e97ad831b56fc07baf1449792b17b1400ee355

### Complete proposed decision

```json
{
  "claimId": "claim_9a1cd05f74418890fbca8955aa76b378",
  "sourceUnitDigest": "e78c37d28fb7fbf09e1c978624d56d78b442c8082d44b3b19c61e9be95642831",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "9-default-implementation-đầu-tiên",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/specs/confinement-authority.md#9-default-implementation-đầu-tiên (source lines 1134-1134) is carried at docs/platform/agent-confinement/spec.md#9-default-implementation-đầu-tiên (candidate lines 398-398). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "e78c37d28fb7fbf09e1c978624d56d78b442c8082d44b3b19c61e9be95642831",
  "targetAncestry": [
    "Spec: Agent Confinement Authority"
  ]
}
```

### Full source shown text

```text
## 9. Default implementation đầu tiên

Default nhỏ nhất có ích:

1. Một backend driver `bwrap` và một backend instance `bwrap` trong machine
   registry.
2. Hai built-in policy `host-write-denied` và `workspace-write` (§6.2):
   `hostWrite: deny`; host-write-denied cấp `run-output` và backend-managed
   `private-home`; read grant `executor-credentials`;
   `hostRead/networkEgress/process` lần lượt cho phép `allow/allow/host` và
   không được trình bày như restriction;
   workspace-write thêm workspace/git-metadata grant theo ownership/readiness;
   private home tùy nhu cầu provider, không là control bắt buộc của built-in;
   private home cho Codex được provider normalizer diễn tả bằng resource binding
   chuẩn, backend không biết đó là Codex.
3. Migration ba executor bwrap khỏi argv hardcode; mỗi executor tham chiếu
   singular backend instance `bwrap`.
4. Giữ tên `claude-bwrap`, `agy-bwrap`, `codex-bwrap` để không phá evidence
   trail và capability binding.
5. Shape cũ của herdr được normalize và đi qua cùng Authority. Việc di dời
   provisioning khỏi `herdr-round.mjs` có thể ship sau, nhưng chưa di dời xong
   thì maturity một cửa chỉ được ghi là `partial`.
6. Mọi capability committed phải khai policy ID hoặc `unconfined` trước khi bật
   strict mode.

Trong default, host-write-denied giữ workspace read-only; workspace-write cho
sửa workspace đã cấp. Capability execute/stage implement phải được migrate sang
profile có backend phù hợp trước strict flip; không đổi sang unconfined chỉ để
qua gate. Git commit readiness là kiểm tra riêng như §6.3.

Default chưa cần network firewall, secret filtering, macOS/container/remote
backend, generic composition cho mọi tổ hợp control, hoặc đổi tên executor.
```

### Full target shown text

```text
## 9. Default implementation đầu tiên

Default nhỏ nhất có ích:

1. Một backend driver `bwrap` và một backend instance `bwrap` trong machine
   registry.
2. Hai built-in policy `host-write-denied` và `workspace-write` (§6.2):
   `hostWrite: deny`; host-write-denied cấp `run-output` và backend-managed
   `private-home`; read grant `executor-credentials`;
   `hostRead/networkEgress/process` lần lượt cho phép `allow/allow/host` và
   không được trình bày như restriction;
   workspace-write thêm workspace/git-metadata grant theo ownership/readiness;
   private home tùy nhu cầu provider, không là control bắt buộc của built-in;
   private home cho Codex được provider normalizer diễn tả bằng resource binding
   chuẩn, backend không biết đó là Codex.
3. Migration ba executor bwrap khỏi argv hardcode; mỗi executor tham chiếu
   singular backend instance `bwrap`.
4. Giữ tên `claude-bwrap`, `agy-bwrap`, `codex-bwrap` để không phá evidence
   trail và capability binding.
5. Shape cũ của herdr được normalize và đi qua cùng Authority. Việc di dời
   provisioning khỏi `herdr-round.mjs` có thể ship sau, nhưng chưa di dời xong
   thì maturity một cửa chỉ được ghi là `partial`.
6. Mọi capability committed phải khai policy ID hoặc `unconfined` trước khi bật
   strict mode.

Trong default, host-write-denied giữ workspace read-only; workspace-write cho
sửa workspace đã cấp. Capability execute/stage implement phải được migrate sang
profile có backend phù hợp trước strict flip; không đổi sang unconfined chỉ để
qua gate. Git commit readiness là kiểm tra riêng như §6.3.

Default chưa cần network firewall, secret filtering, macOS/container/remote
backend, generic composition cho mọi tổ hợp control, hoặc đổi tên executor.
```

## claim_cc0d485b1b93357edb755f4121a26206

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-116; lines 1136–1136; ancestry ["Spec: Agent Confinement Authority","9. Default implementation đầu tiên"].
Target: docs/platform/agent-confinement/spec.md#unheaded-block-49; ancestry ["Spec: Agent Confinement Authority","9. Default implementation đầu tiên"].
Source digest: f0aa8cea776fc1a9bd023b6e3e1318c7c9c16589a68d5ac16288b63f23634cbb
Target digest: f0aa8cea776fc1a9bd023b6e3e1318c7c9c16589a68d5ac16288b63f23634cbb
Shown source SHA256: f0aa8cea776fc1a9bd023b6e3e1318c7c9c16589a68d5ac16288b63f23634cbb
Shown target SHA256: f0aa8cea776fc1a9bd023b6e3e1318c7c9c16589a68d5ac16288b63f23634cbb

### Complete proposed decision

```json
{
  "claimId": "claim_cc0d485b1b93357edb755f4121a26206",
  "sourceUnitDigest": "f0aa8cea776fc1a9bd023b6e3e1318c7c9c16589a68d5ac16288b63f23634cbb",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "unheaded-block-49",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-116 (source lines 1136-1136) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-49 (candidate lines 400-400). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "f0aa8cea776fc1a9bd023b6e3e1318c7c9c16589a68d5ac16288b63f23634cbb",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "9. Default implementation đầu tiên"
  ]
}
```

### Full source shown text

```text
Default nhỏ nhất có ích:
```

### Full target shown text

```text
Default nhỏ nhất có ích:
```

## claim_f1aeeff92e7bbf3f52b1cc88896cc41e

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-117; lines 1138–1157; ancestry ["Spec: Agent Confinement Authority","9. Default implementation đầu tiên"].
Target: docs/platform/agent-confinement/spec.md#unheaded-block-50; ancestry ["Spec: Agent Confinement Authority","9. Default implementation đầu tiên"].
Source digest: 2fcf6811e81b5faf421dcc8038872613f72ad4fb0f62a9c552a56c090a6b31c0
Target digest: 2fcf6811e81b5faf421dcc8038872613f72ad4fb0f62a9c552a56c090a6b31c0
Shown source SHA256: 2fcf6811e81b5faf421dcc8038872613f72ad4fb0f62a9c552a56c090a6b31c0
Shown target SHA256: 2fcf6811e81b5faf421dcc8038872613f72ad4fb0f62a9c552a56c090a6b31c0

### Complete proposed decision

```json
{
  "claimId": "claim_f1aeeff92e7bbf3f52b1cc88896cc41e",
  "sourceUnitDigest": "2fcf6811e81b5faf421dcc8038872613f72ad4fb0f62a9c552a56c090a6b31c0",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "unheaded-block-50",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-117 (source lines 1138-1157) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-50 (candidate lines 402-421). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "2fcf6811e81b5faf421dcc8038872613f72ad4fb0f62a9c552a56c090a6b31c0",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "9. Default implementation đầu tiên"
  ]
}
```

### Full source shown text

```text
1. Một backend driver `bwrap` và một backend instance `bwrap` trong machine
   registry.
2. Hai built-in policy `host-write-denied` và `workspace-write` (§6.2):
   `hostWrite: deny`; host-write-denied cấp `run-output` và backend-managed
   `private-home`; read grant `executor-credentials`;
   `hostRead/networkEgress/process` lần lượt cho phép `allow/allow/host` và
   không được trình bày như restriction;
   workspace-write thêm workspace/git-metadata grant theo ownership/readiness;
   private home tùy nhu cầu provider, không là control bắt buộc của built-in;
   private home cho Codex được provider normalizer diễn tả bằng resource binding
   chuẩn, backend không biết đó là Codex.
3. Migration ba executor bwrap khỏi argv hardcode; mỗi executor tham chiếu
   singular backend instance `bwrap`.
4. Giữ tên `claude-bwrap`, `agy-bwrap`, `codex-bwrap` để không phá evidence
   trail và capability binding.
5. Shape cũ của herdr được normalize và đi qua cùng Authority. Việc di dời
   provisioning khỏi `herdr-round.mjs` có thể ship sau, nhưng chưa di dời xong
   thì maturity một cửa chỉ được ghi là `partial`.
6. Mọi capability committed phải khai policy ID hoặc `unconfined` trước khi bật
   strict mode.
```

### Full target shown text

```text
1. Một backend driver `bwrap` và một backend instance `bwrap` trong machine
   registry.
2. Hai built-in policy `host-write-denied` và `workspace-write` (§6.2):
   `hostWrite: deny`; host-write-denied cấp `run-output` và backend-managed
   `private-home`; read grant `executor-credentials`;
   `hostRead/networkEgress/process` lần lượt cho phép `allow/allow/host` và
   không được trình bày như restriction;
   workspace-write thêm workspace/git-metadata grant theo ownership/readiness;
   private home tùy nhu cầu provider, không là control bắt buộc của built-in;
   private home cho Codex được provider normalizer diễn tả bằng resource binding
   chuẩn, backend không biết đó là Codex.
3. Migration ba executor bwrap khỏi argv hardcode; mỗi executor tham chiếu
   singular backend instance `bwrap`.
4. Giữ tên `claude-bwrap`, `agy-bwrap`, `codex-bwrap` để không phá evidence
   trail và capability binding.
5. Shape cũ của herdr được normalize và đi qua cùng Authority. Việc di dời
   provisioning khỏi `herdr-round.mjs` có thể ship sau, nhưng chưa di dời xong
   thì maturity một cửa chỉ được ghi là `partial`.
6. Mọi capability committed phải khai policy ID hoặc `unconfined` trước khi bật
   strict mode.
```

## claim_1538dad17e4fa44207a7f70dc2ca7b55

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-118; lines 1159–1162; ancestry ["Spec: Agent Confinement Authority","9. Default implementation đầu tiên"].
Target: docs/platform/agent-confinement/spec.md#unheaded-block-51; ancestry ["Spec: Agent Confinement Authority","9. Default implementation đầu tiên"].
Source digest: 9077d21c4c3ff52bd3ddcb04d54a03a978ee83919055752883a6609016055acf
Target digest: 9077d21c4c3ff52bd3ddcb04d54a03a978ee83919055752883a6609016055acf
Shown source SHA256: 9077d21c4c3ff52bd3ddcb04d54a03a978ee83919055752883a6609016055acf
Shown target SHA256: 9077d21c4c3ff52bd3ddcb04d54a03a978ee83919055752883a6609016055acf

### Complete proposed decision

```json
{
  "claimId": "claim_1538dad17e4fa44207a7f70dc2ca7b55",
  "sourceUnitDigest": "9077d21c4c3ff52bd3ddcb04d54a03a978ee83919055752883a6609016055acf",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "unheaded-block-51",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-118 (source lines 1159-1162) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-51 (candidate lines 423-426). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "9077d21c4c3ff52bd3ddcb04d54a03a978ee83919055752883a6609016055acf",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "9. Default implementation đầu tiên"
  ]
}
```

### Full source shown text

```text
Trong default, host-write-denied giữ workspace read-only; workspace-write cho
sửa workspace đã cấp. Capability execute/stage implement phải được migrate sang
profile có backend phù hợp trước strict flip; không đổi sang unconfined chỉ để
qua gate. Git commit readiness là kiểm tra riêng như §6.3.
```

### Full target shown text

```text
Trong default, host-write-denied giữ workspace read-only; workspace-write cho
sửa workspace đã cấp. Capability execute/stage implement phải được migrate sang
profile có backend phù hợp trước strict flip; không đổi sang unconfined chỉ để
qua gate. Git commit readiness là kiểm tra riêng như §6.3.
```

## claim_daa730ce31dbd045d14a42c31c57f316

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-119; lines 1164–1165; ancestry ["Spec: Agent Confinement Authority","9. Default implementation đầu tiên"].
Target: docs/platform/agent-confinement/spec.md#unheaded-block-52; ancestry ["Spec: Agent Confinement Authority","9. Default implementation đầu tiên"].
Source digest: fdcc56c6036171a7393772c55e187bfd7e86e9b00b045bc9d0ae3c81c963fd67
Target digest: fdcc56c6036171a7393772c55e187bfd7e86e9b00b045bc9d0ae3c81c963fd67
Shown source SHA256: fdcc56c6036171a7393772c55e187bfd7e86e9b00b045bc9d0ae3c81c963fd67
Shown target SHA256: fdcc56c6036171a7393772c55e187bfd7e86e9b00b045bc9d0ae3c81c963fd67

### Complete proposed decision

```json
{
  "claimId": "claim_daa730ce31dbd045d14a42c31c57f316",
  "sourceUnitDigest": "fdcc56c6036171a7393772c55e187bfd7e86e9b00b045bc9d0ae3c81c963fd67",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "unheaded-block-52",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-119 (source lines 1164-1165) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-52 (candidate lines 428-429). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "fdcc56c6036171a7393772c55e187bfd7e86e9b00b045bc9d0ae3c81c963fd67",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "9. Default implementation đầu tiên"
  ]
}
```

### Full source shown text

```text
Default chưa cần network firewall, secret filtering, macOS/container/remote
backend, generic composition cho mọi tổ hợp control, hoặc đổi tên executor.
```

### Full target shown text

```text
Default chưa cần network firewall, secret filtering, macOS/container/remote
backend, generic composition cho mọi tổ hợp control, hoặc đổi tên executor.
```

## claim_2c080a72c195a28a1ca8efb0e1187f11

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#91-support-matrix-của-default; lines 1167–1167; ancestry ["Spec: Agent Confinement Authority","9. Default implementation đầu tiên"].
Target: docs/platform/agent-confinement/spec.md#91-support-matrix-của-default; ancestry ["Spec: Agent Confinement Authority","9. Default implementation đầu tiên"].
Source digest: 6547070a649080a9b46e64e56a74695a0a27993e07e7d917978fd4b56697af4d
Target digest: 6547070a649080a9b46e64e56a74695a0a27993e07e7d917978fd4b56697af4d
Shown source SHA256: 2164078fb1f6c590463d5f295a544fd87e9fc99affea9ef5f0cbeed95308b94f
Shown target SHA256: 2164078fb1f6c590463d5f295a544fd87e9fc99affea9ef5f0cbeed95308b94f

### Complete proposed decision

```json
{
  "claimId": "claim_2c080a72c195a28a1ca8efb0e1187f11",
  "sourceUnitDigest": "6547070a649080a9b46e64e56a74695a0a27993e07e7d917978fd4b56697af4d",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "91-support-matrix-của-default",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/specs/confinement-authority.md#91-support-matrix-của-default (source lines 1167-1167) is carried at docs/platform/agent-confinement/spec.md#91-support-matrix-của-default (candidate lines 431-431). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "6547070a649080a9b46e64e56a74695a0a27993e07e7d917978fd4b56697af4d",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "9. Default implementation đầu tiên"
  ]
}
```

### Full source shown text

```text
### 9.1 Support matrix của default

| Contract surface | Default v1 |
|---|---|
| Mode | `required`, `unconfined`; `preferred` có trong contract nhưng default chưa nhận config này |
| Invocation override | Contract đích giữ shape/partial-order; default v1 từ chối config override, dùng policy ID/capability khác — trừ một override duy nhất, `{ controls: { hostRead: 'blind' } }` (§9.2) |
| `hostWrite` | `deny` qua bwrap, hoặc `allow` khi explicit `unconfined` |
| Write grant | run-output, private-home khi cần; workspace/git-metadata cho workspace-write theo readiness |
| Read grant | `executor-credentials` khi policy của dispatch yêu cầu |
| `home` | host mặc định; private resource khi provider cần; home private nếu policy thực sự yêu cầu và đã prove |
| `session`, `workspace` | effective value là `shared`; legacy `isolated/own` được normalize nhưng chưa di dời enforcement ở slice đầu |
| `hostRead` | `allow`, hoặc `blind` (§9.2); request `deny` bị `unsupported` |
| `networkEgress`, `process` | effective value là `allow`, `host`; request `deny/filtered/isolated` bị `unsupported` |
| Resource delivery/collect | host direct/mount; copy/remote/workspace-change chưa hỗ trợ |
| Backend | Linux bwrap; backend khác trả `unsupported` có lý do |

Việc parser hiểu một field không có nghĩa backend đã support field đó. Default
phải từ chối requirement ngoài matrix thay vì nhận rồi bỏ qua.
```

### Full target shown text

```text
### 9.1 Support matrix của default

| Contract surface | Default v1 |
|---|---|
| Mode | `required`, `unconfined`; `preferred` có trong contract nhưng default chưa nhận config này |
| Invocation override | Contract đích giữ shape/partial-order; default v1 từ chối config override, dùng policy ID/capability khác — trừ một override duy nhất, `{ controls: { hostRead: 'blind' } }` (§9.2) |
| `hostWrite` | `deny` qua bwrap, hoặc `allow` khi explicit `unconfined` |
| Write grant | run-output, private-home khi cần; workspace/git-metadata cho workspace-write theo readiness |
| Read grant | `executor-credentials` khi policy của dispatch yêu cầu |
| `home` | host mặc định; private resource khi provider cần; home private nếu policy thực sự yêu cầu và đã prove |
| `session`, `workspace` | effective value là `shared`; legacy `isolated/own` được normalize nhưng chưa di dời enforcement ở slice đầu |
| `hostRead` | `allow`, hoặc `blind` (§9.2); request `deny` bị `unsupported` |
| `networkEgress`, `process` | effective value là `allow`, `host`; request `deny/filtered/isolated` bị `unsupported` |
| Resource delivery/collect | host direct/mount; copy/remote/workspace-change chưa hỗ trợ |
| Backend | Linux bwrap; backend khác trả `unsupported` có lý do |

Việc parser hiểu một field không có nghĩa backend đã support field đó. Default
phải từ chối requirement ngoài matrix thay vì nhận rồi bỏ qua.
```

## claim_1a847c3e3266a47169a83f7ac836ef7b

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-120; lines 1169–1181; ancestry ["Spec: Agent Confinement Authority","9. Default implementation đầu tiên","9.1 Support matrix của default"].
Target: docs/platform/agent-confinement/spec.md#unheaded-block-53; ancestry ["Spec: Agent Confinement Authority","9. Default implementation đầu tiên","9.1 Support matrix của default"].
Source digest: 14f3ee1a5085e8338b27e811d4a6fdddb36726d4f98c9df86111a65f594d85fa
Target digest: 14f3ee1a5085e8338b27e811d4a6fdddb36726d4f98c9df86111a65f594d85fa
Shown source SHA256: 14f3ee1a5085e8338b27e811d4a6fdddb36726d4f98c9df86111a65f594d85fa
Shown target SHA256: 14f3ee1a5085e8338b27e811d4a6fdddb36726d4f98c9df86111a65f594d85fa

### Complete proposed decision

```json
{
  "claimId": "claim_1a847c3e3266a47169a83f7ac836ef7b",
  "sourceUnitDigest": "14f3ee1a5085e8338b27e811d4a6fdddb36726d4f98c9df86111a65f594d85fa",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "unheaded-block-53",
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-120 (source lines 1169-1181) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-53 (candidate lines 433-445). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "14f3ee1a5085e8338b27e811d4a6fdddb36726d4f98c9df86111a65f594d85fa",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "9. Default implementation đầu tiên",
    "9.1 Support matrix của default"
  ]
}
```

### Full source shown text

```text
| Contract surface | Default v1 |
|---|---|
| Mode | `required`, `unconfined`; `preferred` có trong contract nhưng default chưa nhận config này |
| Invocation override | Contract đích giữ shape/partial-order; default v1 từ chối config override, dùng policy ID/capability khác — trừ một override duy nhất, `{ controls: { hostRead: 'blind' } }` (§9.2) |
| `hostWrite` | `deny` qua bwrap, hoặc `allow` khi explicit `unconfined` |
| Write grant | run-output, private-home khi cần; workspace/git-metadata cho workspace-write theo readiness |
| Read grant | `executor-credentials` khi policy của dispatch yêu cầu |
| `home` | host mặc định; private resource khi provider cần; home private nếu policy thực sự yêu cầu và đã prove |
| `session`, `workspace` | effective value là `shared`; legacy `isolated/own` được normalize nhưng chưa di dời enforcement ở slice đầu |
| `hostRead` | `allow`, hoặc `blind` (§9.2); request `deny` bị `unsupported` |
| `networkEgress`, `process` | effective value là `allow`, `host`; request `deny/filtered/isolated` bị `unsupported` |
| Resource delivery/collect | host direct/mount; copy/remote/workspace-change chưa hỗ trợ |
| Backend | Linux bwrap; backend khác trả `unsupported` có lý do |
```

### Full target shown text

```text
| Contract surface | Default v1 |
|---|---|
| Mode | `required`, `unconfined`; `preferred` có trong contract nhưng default chưa nhận config này |
| Invocation override | Contract đích giữ shape/partial-order; default v1 từ chối config override, dùng policy ID/capability khác — trừ một override duy nhất, `{ controls: { hostRead: 'blind' } }` (§9.2) |
| `hostWrite` | `deny` qua bwrap, hoặc `allow` khi explicit `unconfined` |
| Write grant | run-output, private-home khi cần; workspace/git-metadata cho workspace-write theo readiness |
| Read grant | `executor-credentials` khi policy của dispatch yêu cầu |
| `home` | host mặc định; private resource khi provider cần; home private nếu policy thực sự yêu cầu và đã prove |
| `session`, `workspace` | effective value là `shared`; legacy `isolated/own` được normalize nhưng chưa di dời enforcement ở slice đầu |
| `hostRead` | `allow`, hoặc `blind` (§9.2); request `deny` bị `unsupported` |
| `networkEgress`, `process` | effective value là `allow`, `host`; request `deny/filtered/isolated` bị `unsupported` |
| Resource delivery/collect | host direct/mount; copy/remote/workspace-change chưa hỗ trợ |
| Backend | Linux bwrap; backend khác trả `unsupported` có lý do |
```

## claim_d4bc3fb932ca2d29e917119191f45f1c

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-121; lines 1183–1184; ancestry ["Spec: Agent Confinement Authority","9. Default implementation đầu tiên","9.1 Support matrix của default"].
Target: docs/platform/agent-confinement/spec.md#unheaded-block-54; ancestry ["Spec: Agent Confinement Authority","9. Default implementation đầu tiên","9.1 Support matrix của default"].
Source digest: 62da6aab49287cf95b091c9f3b8d55e5eed5b510a040c7663c8d3616cef1a994
Target digest: 62da6aab49287cf95b091c9f3b8d55e5eed5b510a040c7663c8d3616cef1a994
Shown source SHA256: 62da6aab49287cf95b091c9f3b8d55e5eed5b510a040c7663c8d3616cef1a994
Shown target SHA256: 62da6aab49287cf95b091c9f3b8d55e5eed5b510a040c7663c8d3616cef1a994

### Complete proposed decision

```json
{
  "claimId": "claim_d4bc3fb932ca2d29e917119191f45f1c",
  "sourceUnitDigest": "62da6aab49287cf95b091c9f3b8d55e5eed5b510a040c7663c8d3616cef1a994",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "unheaded-block-54",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-121 (source lines 1183-1184) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-54 (candidate lines 447-448). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "62da6aab49287cf95b091c9f3b8d55e5eed5b510a040c7663c8d3616cef1a994",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "9. Default implementation đầu tiên",
    "9.1 Support matrix của default"
  ]
}
```

### Full source shown text

```text
Việc parser hiểu một field không có nghĩa backend đã support field đó. Default
phải từ chối requirement ngoài matrix thay vì nhận rồi bỏ qua.
```

### Full target shown text

```text
Việc parser hiểu một field không có nghĩa backend đã support field đó. Default
phải từ chối requirement ngoài matrix thay vì nhận rồi bỏ qua.
```

## claim_3770d5a0b897fbd8c1393a38c48c3333

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#92-hostread-blind-worker-mù-trước-run-state-của-peer; lines 1186–1186; ancestry ["Spec: Agent Confinement Authority","9. Default implementation đầu tiên"].
Target: docs/platform/agent-confinement/spec.md#92-hostread-blind-worker-mù-trước-run-state-của-peer; ancestry ["Spec: Agent Confinement Authority","9. Default implementation đầu tiên"].
Source digest: 28ef20e16a5b5c8d4fe7db58cfb81fa2915a15bd591ddfbdac9094abd5cdd4bc
Target digest: 28ef20e16a5b5c8d4fe7db58cfb81fa2915a15bd591ddfbdac9094abd5cdd4bc
Shown source SHA256: 3e91f84ef8836e97ee3440f9ae08372a26e8234d7093cd2e83e9f2ef9490b0ef
Shown target SHA256: 3e91f84ef8836e97ee3440f9ae08372a26e8234d7093cd2e83e9f2ef9490b0ef

### Complete proposed decision

```json
{
  "claimId": "claim_3770d5a0b897fbd8c1393a38c48c3333",
  "sourceUnitDigest": "28ef20e16a5b5c8d4fe7db58cfb81fa2915a15bd591ddfbdac9094abd5cdd4bc",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "92-hostread-blind-worker-mù-trước-run-state-của-peer",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole heading unit docs/specs/confinement-authority.md#92-hostread-blind-worker-mù-trước-run-state-của-peer (source lines 1186-1186) is carried at docs/platform/agent-confinement/spec.md#92-hostread-blind-worker-mù-trước-run-state-của-peer (candidate lines 450-450). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "28ef20e16a5b5c8d4fe7db58cfb81fa2915a15bd591ddfbdac9094abd5cdd4bc",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "9. Default implementation đầu tiên"
  ]
}
```

### Full source shown text

```text
### 9.2 `hostRead: blind` — worker mù trước run state của peer

`blind` là giá trị thứ ba của trục `hostRead` (`deny > blind > allow`): host vẫn đọc được,
trừ run state của các dispatch khác và phiên agent đang sống. Runner gửi nó như một override
chỉ-thu-hẹp qua slot `override` của request (Unit mang `blind: true`, mọi vai của Unit đó đều
mù); built-in policy không đổi, không có policy ID mới. Mặc định tắt: argv của dispatch không
`blind` giữ nguyên từng byte.

Với `blind`, driver bwrap giữ `--ro-bind / /` và thêm, theo đúng thứ tự: `--unshare-pid` (ẩn
`/proc/<pid>/cmdline` của tiến trình khác); `--tmpfs` che từng *hidden root* đang tồn tại;
`--ro-bind` thư mục của chính dispatch (round dir `<assignments>/<unit run>/<role>/<round>`,
hoặc run dir nếu không có assignment) chỉ-đọc; các mount nằm dưới mask (outbox ghi được, private
home); cuối cùng `--remount-ro` trên các mask. Hidden root là dữ liệu của contract
(`BLIND_HIDDEN_ROOTS`), không phải code của driver: `{fgosDir}/assignments`,
`{fgosDir}/workflow-runs`, `{fgosDir}/dispatch-runs` của project dispatch đang chạy, thư mục
socket của herdr, và confinement temp root (private home của dispatch khác, chứa transcript agent).
Resource `hidden-root` và `own-assignment` đi vào plan/attestation; attestation ghi thêm
`requested.override`, `effectiveControls.hostRead: blind` và `hiddenRoots`.

Vì sao như vậy: (1) chỉ che ba thư mục run state chứ không che cả `.fgos`, vì `.fgos` có file
tracked (config, events) — che cả thư mục làm chúng hiện thành "đã xoá" trong trạng thái checkout,
và worker ghi được workspace có thể commit việc xoá đó; (2) `--unshare-pid` vì không có nó worker
đọc được cmdline của tiến trình anh em; (3) socket herdr nằm trong danh sách vì `--ro-bind / /`
vẫn cho `connect()`, tức worker có thể `pane read` pane của anh em. Blind chỉ dùng được khi cái
worker *được trao* nằm sẵn trong thư mục của chính nó, nên với Unit `blind` resolver hand-off
(`resolveUnitInputs`, `src/runner/execution/handoff-refs.mjs`) không giao đường dẫn gốc: mọi input
`unit-run:`, `gate-answer:` và mọi ref nằm trong hidden root được chép nguyên byte (kiểm lại sha256
lúc chép; nguồn đã đổi sau settle thì từ chối `report-changed-after-settle`) vào `inputs/` của
*round dir của chính vai đó* (`<round>/inputs/<tên>`), vô điều kiện, không cần `anonymizeInputs`; tên
trung tính `seat-A...` cho input `unit-run:` khi `anonymizeInputs` bật, tên cố định `<n>-<vai>-r<vòng>`
hoặc `<n>-gate-<bước>` nếu không. Mỗi vai một bản riêng (không chia sẻ giữa các vai của Unit), nên
chỉ vai đó đọc được; danh sách ref của vai là các bản chép. `unit.json` giữ `resolvedInputs` (ref
đọc được tại chỗ) và `inputMap` (nguồn, tên, sha256); resume dùng lại bản chép đã có, fallback chép
lại vào round dir của lần thử mới. Synthesizer của pattern `panel` nhận report của panelist theo
đúng cách đó. `blind-ref-hidden` chỉ còn cho ref không chép được.

Canary sống (2026-10-05, mỗi họ executor một Unit blind chỉ-đọc, input `unit-run:`, và đường dẫn
tuyệt đối tới report nguồn): claude (herdr), codex (herdr và cli bwrap), xai (pi herdr), glm và
deepseek (pi cli bwrap) đều đọc bản chép, gặp `ENOENT` ở nguồn và chỉ thấy chuỗi của chính mình
trong `.fgos/assignments`. Dưới `--unshare-pid` và mask thư mục socket herdr, herdr vẫn nhận ra agent
trong pane (`agentKnownToHerdr: detected`, trạng thái `unknown` → `working` → `idle`/kết thúc), nên
mask và `--unshare-pid` giữ nguyên. agy chưa chứng minh được: `agy-herdr` hỏng cả khi không blind
(`foreground process ... does not match prepared command argv`), `agy-cli-bwrap` dừng vì hết quota
của tài khoản.

Dispatch `blind` bị **từ chối, không bao giờ chạy không-blind**, với lý do có tên, trước khi
spawn: `blind-requires-confinement` (mode không phải `required`/không có policy),
`blind-in-process` (Agent tool/inline không có sandbox quanh worker; `bind()` cũng không chọn nó),
`blind-hides-workspace` (cwd hoặc repo root nằm trong hidden root), `blind-ref-hidden` (context
ref nằm trong hidden root ngoài thư mục của chính dispatch), `confinement-backend-missing` /
`confinement-backend-disabled` (không có bwrap), `confinement-probe-failed` (probe chưa tươi hoặc
không qua). Probe `peer-run-hidden` (thứ chín, chỉ cho dispatch blind; fingerprint và cache riêng)
dựng argv từ chính `prepareBwrap`: worker không đọc được report của peer, home của peer, cmdline
của tiến trình anh em, nhưng đọc được thư mục của mình (chỉ-đọc) và ghi được outbox; falsifier bỏ
mask thì phải đọc được file peer. `fgos doctor` báo `blind-read: pass | fail |
backend-unsupported` (check `confinement-blind-read`). Giới hạn còn mở: transcript agent của Lead
trong host home, `.fgos/secrets.local.env` và project khác (bí mật, không phải mù), và mạng
localhost.
```

### Full target shown text

```text
### 9.2 `hostRead: blind` — worker mù trước run state của peer

`blind` là giá trị thứ ba của trục `hostRead` (`deny > blind > allow`): host vẫn đọc được,
trừ run state của các dispatch khác và phiên agent đang sống. Runner gửi nó như một override
chỉ-thu-hẹp qua slot `override` của request (Unit mang `blind: true`, mọi vai của Unit đó đều
mù); built-in policy không đổi, không có policy ID mới. Mặc định tắt: argv của dispatch không
`blind` giữ nguyên từng byte.

Với `blind`, driver bwrap giữ `--ro-bind / /` và thêm, theo đúng thứ tự: `--unshare-pid` (ẩn
`/proc/<pid>/cmdline` của tiến trình khác); `--tmpfs` che từng *hidden root* đang tồn tại;
`--ro-bind` thư mục của chính dispatch (round dir `<assignments>/<unit run>/<role>/<round>`,
hoặc run dir nếu không có assignment) chỉ-đọc; các mount nằm dưới mask (outbox ghi được, private
home); cuối cùng `--remount-ro` trên các mask. Hidden root là dữ liệu của contract
(`BLIND_HIDDEN_ROOTS`), không phải code của driver: `{fgosDir}/assignments`,
`{fgosDir}/workflow-runs`, `{fgosDir}/dispatch-runs` của project dispatch đang chạy, thư mục
socket của herdr, và confinement temp root (private home của dispatch khác, chứa transcript agent).
Resource `hidden-root` và `own-assignment` đi vào plan/attestation; attestation ghi thêm
`requested.override`, `effectiveControls.hostRead: blind` và `hiddenRoots`.

Vì sao như vậy: (1) chỉ che ba thư mục run state chứ không che cả `.fgos`, vì `.fgos` có file
tracked (config, events) — che cả thư mục làm chúng hiện thành "đã xoá" trong trạng thái checkout,
và worker ghi được workspace có thể commit việc xoá đó; (2) `--unshare-pid` vì không có nó worker
đọc được cmdline của tiến trình anh em; (3) socket herdr nằm trong danh sách vì `--ro-bind / /`
vẫn cho `connect()`, tức worker có thể `pane read` pane của anh em. Blind chỉ dùng được khi cái
worker *được trao* nằm sẵn trong thư mục của chính nó, nên với Unit `blind` resolver hand-off
(`resolveUnitInputs`, `src/runner/execution/handoff-refs.mjs`) không giao đường dẫn gốc: mọi input
`unit-run:`, `gate-answer:` và mọi ref nằm trong hidden root được chép nguyên byte (kiểm lại sha256
lúc chép; nguồn đã đổi sau settle thì từ chối `report-changed-after-settle`) vào `inputs/` của
*round dir của chính vai đó* (`<round>/inputs/<tên>`), vô điều kiện, không cần `anonymizeInputs`; tên
trung tính `seat-A...` cho input `unit-run:` khi `anonymizeInputs` bật, tên cố định `<n>-<vai>-r<vòng>`
hoặc `<n>-gate-<bước>` nếu không. Mỗi vai một bản riêng (không chia sẻ giữa các vai của Unit), nên
chỉ vai đó đọc được; danh sách ref của vai là các bản chép. `unit.json` giữ `resolvedInputs` (ref
đọc được tại chỗ) và `inputMap` (nguồn, tên, sha256); resume dùng lại bản chép đã có, fallback chép
lại vào round dir của lần thử mới. Synthesizer của pattern `panel` nhận report của panelist theo
đúng cách đó. `blind-ref-hidden` chỉ còn cho ref không chép được.

Canary sống (2026-10-05, mỗi họ executor một Unit blind chỉ-đọc, input `unit-run:`, và đường dẫn
tuyệt đối tới report nguồn): claude (herdr), codex (herdr và cli bwrap), xai (pi herdr), glm và
deepseek (pi cli bwrap) đều đọc bản chép, gặp `ENOENT` ở nguồn và chỉ thấy chuỗi của chính mình
trong `.fgos/assignments`. Dưới `--unshare-pid` và mask thư mục socket herdr, herdr vẫn nhận ra agent
trong pane (`agentKnownToHerdr: detected`, trạng thái `unknown` → `working` → `idle`/kết thúc), nên
mask và `--unshare-pid` giữ nguyên. agy chưa chứng minh được: `agy-herdr` hỏng cả khi không blind
(`foreground process ... does not match prepared command argv`), `agy-cli-bwrap` dừng vì hết quota
của tài khoản.

Dispatch `blind` bị **từ chối, không bao giờ chạy không-blind**, với lý do có tên, trước khi
spawn: `blind-requires-confinement` (mode không phải `required`/không có policy),
`blind-in-process` (Agent tool/inline không có sandbox quanh worker; `bind()` cũng không chọn nó),
`blind-hides-workspace` (cwd hoặc repo root nằm trong hidden root), `blind-ref-hidden` (context
ref nằm trong hidden root ngoài thư mục của chính dispatch), `confinement-backend-missing` /
`confinement-backend-disabled` (không có bwrap), `confinement-probe-failed` (probe chưa tươi hoặc
không qua). Probe `peer-run-hidden` (thứ chín, chỉ cho dispatch blind; fingerprint và cache riêng)
dựng argv từ chính `prepareBwrap`: worker không đọc được report của peer, home của peer, cmdline
của tiến trình anh em, nhưng đọc được thư mục của mình (chỉ-đọc) và ghi được outbox; falsifier bỏ
mask thì phải đọc được file peer. `fgos doctor` báo `blind-read: pass | fail |
backend-unsupported` (check `confinement-blind-read`). Giới hạn còn mở: transcript agent của Lead
trong host home, `.fgos/secrets.local.env` và project khác (bí mật, không phải mù), và mạng
localhost.
```

## claim_68dd1d19379c9a16393429b5e2aac34a

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-122; lines 1188–1192; ancestry ["Spec: Agent Confinement Authority","9. Default implementation đầu tiên","9.2 `hostRead: blind` — worker mù trước run state của peer"].
Target: docs/platform/agent-confinement/spec.md#unheaded-block-55; ancestry ["Spec: Agent Confinement Authority","9. Default implementation đầu tiên","9.2 `hostRead: blind` — worker mù trước run state của peer"].
Source digest: cd86d66ba41c3e216cfd4d8bd8d3d67ba807275450780add3123faf7d91d35bb
Target digest: cd86d66ba41c3e216cfd4d8bd8d3d67ba807275450780add3123faf7d91d35bb
Shown source SHA256: cd86d66ba41c3e216cfd4d8bd8d3d67ba807275450780add3123faf7d91d35bb
Shown target SHA256: cd86d66ba41c3e216cfd4d8bd8d3d67ba807275450780add3123faf7d91d35bb

### Complete proposed decision

```json
{
  "claimId": "claim_68dd1d19379c9a16393429b5e2aac34a",
  "sourceUnitDigest": "cd86d66ba41c3e216cfd4d8bd8d3d67ba807275450780add3123faf7d91d35bb",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "unheaded-block-55",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-122 (source lines 1188-1192) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-55 (candidate lines 452-456). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "cd86d66ba41c3e216cfd4d8bd8d3d67ba807275450780add3123faf7d91d35bb",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "9. Default implementation đầu tiên",
    "9.2 `hostRead: blind` — worker mù trước run state của peer"
  ]
}
```

### Full source shown text

```text
`blind` là giá trị thứ ba của trục `hostRead` (`deny > blind > allow`): host vẫn đọc được,
trừ run state của các dispatch khác và phiên agent đang sống. Runner gửi nó như một override
chỉ-thu-hẹp qua slot `override` của request (Unit mang `blind: true`, mọi vai của Unit đó đều
mù); built-in policy không đổi, không có policy ID mới. Mặc định tắt: argv của dispatch không
`blind` giữ nguyên từng byte.
```

### Full target shown text

```text
`blind` là giá trị thứ ba của trục `hostRead` (`deny > blind > allow`): host vẫn đọc được,
trừ run state của các dispatch khác và phiên agent đang sống. Runner gửi nó như một override
chỉ-thu-hẹp qua slot `override` của request (Unit mang `blind: true`, mọi vai của Unit đó đều
mù); built-in policy không đổi, không có policy ID mới. Mặc định tắt: argv của dispatch không
`blind` giữ nguyên từng byte.
```

## claim_b1731956c352b9977eef7ffa07f88991

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-123; lines 1194–1203; ancestry ["Spec: Agent Confinement Authority","9. Default implementation đầu tiên","9.2 `hostRead: blind` — worker mù trước run state của peer"].
Target: docs/platform/agent-confinement/spec.md#unheaded-block-56; ancestry ["Spec: Agent Confinement Authority","9. Default implementation đầu tiên","9.2 `hostRead: blind` — worker mù trước run state của peer"].
Source digest: 7cf71cce1a2badb415557e66813aa0937d285bc90ad11c6264e1e54083199ff6
Target digest: 7cf71cce1a2badb415557e66813aa0937d285bc90ad11c6264e1e54083199ff6
Shown source SHA256: 7cf71cce1a2badb415557e66813aa0937d285bc90ad11c6264e1e54083199ff6
Shown target SHA256: 7cf71cce1a2badb415557e66813aa0937d285bc90ad11c6264e1e54083199ff6

### Complete proposed decision

```json
{
  "claimId": "claim_b1731956c352b9977eef7ffa07f88991",
  "sourceUnitDigest": "7cf71cce1a2badb415557e66813aa0937d285bc90ad11c6264e1e54083199ff6",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "unheaded-block-56",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-123 (source lines 1194-1203) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-56 (candidate lines 458-467). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "7cf71cce1a2badb415557e66813aa0937d285bc90ad11c6264e1e54083199ff6",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "9. Default implementation đầu tiên",
    "9.2 `hostRead: blind` — worker mù trước run state của peer"
  ]
}
```

### Full source shown text

```text
Với `blind`, driver bwrap giữ `--ro-bind / /` và thêm, theo đúng thứ tự: `--unshare-pid` (ẩn
`/proc/<pid>/cmdline` của tiến trình khác); `--tmpfs` che từng *hidden root* đang tồn tại;
`--ro-bind` thư mục của chính dispatch (round dir `<assignments>/<unit run>/<role>/<round>`,
hoặc run dir nếu không có assignment) chỉ-đọc; các mount nằm dưới mask (outbox ghi được, private
home); cuối cùng `--remount-ro` trên các mask. Hidden root là dữ liệu của contract
(`BLIND_HIDDEN_ROOTS`), không phải code của driver: `{fgosDir}/assignments`,
`{fgosDir}/workflow-runs`, `{fgosDir}/dispatch-runs` của project dispatch đang chạy, thư mục
socket của herdr, và confinement temp root (private home của dispatch khác, chứa transcript agent).
Resource `hidden-root` và `own-assignment` đi vào plan/attestation; attestation ghi thêm
`requested.override`, `effectiveControls.hostRead: blind` và `hiddenRoots`.
```

### Full target shown text

```text
Với `blind`, driver bwrap giữ `--ro-bind / /` và thêm, theo đúng thứ tự: `--unshare-pid` (ẩn
`/proc/<pid>/cmdline` của tiến trình khác); `--tmpfs` che từng *hidden root* đang tồn tại;
`--ro-bind` thư mục của chính dispatch (round dir `<assignments>/<unit run>/<role>/<round>`,
hoặc run dir nếu không có assignment) chỉ-đọc; các mount nằm dưới mask (outbox ghi được, private
home); cuối cùng `--remount-ro` trên các mask. Hidden root là dữ liệu của contract
(`BLIND_HIDDEN_ROOTS`), không phải code của driver: `{fgosDir}/assignments`,
`{fgosDir}/workflow-runs`, `{fgosDir}/dispatch-runs` của project dispatch đang chạy, thư mục
socket của herdr, và confinement temp root (private home của dispatch khác, chứa transcript agent).
Resource `hidden-root` và `own-assignment` đi vào plan/attestation; attestation ghi thêm
`requested.override`, `effectiveControls.hostRead: blind` và `hiddenRoots`.
```

## claim_54f630d44a33c5624ebeca834cf25ceb

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-124; lines 1205–1220; ancestry ["Spec: Agent Confinement Authority","9. Default implementation đầu tiên","9.2 `hostRead: blind` — worker mù trước run state của peer"].
Target: docs/platform/agent-confinement/spec.md#unheaded-block-57; ancestry ["Spec: Agent Confinement Authority","9. Default implementation đầu tiên","9.2 `hostRead: blind` — worker mù trước run state của peer"].
Source digest: 8caafcb371d02a300d8aa42288fc25e25354ddd2301e48508ee4810c99340902
Target digest: 8caafcb371d02a300d8aa42288fc25e25354ddd2301e48508ee4810c99340902
Shown source SHA256: 8caafcb371d02a300d8aa42288fc25e25354ddd2301e48508ee4810c99340902
Shown target SHA256: 8caafcb371d02a300d8aa42288fc25e25354ddd2301e48508ee4810c99340902

### Complete proposed decision

```json
{
  "claimId": "claim_54f630d44a33c5624ebeca834cf25ceb",
  "sourceUnitDigest": "8caafcb371d02a300d8aa42288fc25e25354ddd2301e48508ee4810c99340902",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "unheaded-block-57",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-124 (source lines 1205-1220) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-57 (candidate lines 469-484). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "8caafcb371d02a300d8aa42288fc25e25354ddd2301e48508ee4810c99340902",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "9. Default implementation đầu tiên",
    "9.2 `hostRead: blind` — worker mù trước run state của peer"
  ]
}
```

### Full source shown text

```text
Vì sao như vậy: (1) chỉ che ba thư mục run state chứ không che cả `.fgos`, vì `.fgos` có file
tracked (config, events) — che cả thư mục làm chúng hiện thành "đã xoá" trong trạng thái checkout,
và worker ghi được workspace có thể commit việc xoá đó; (2) `--unshare-pid` vì không có nó worker
đọc được cmdline của tiến trình anh em; (3) socket herdr nằm trong danh sách vì `--ro-bind / /`
vẫn cho `connect()`, tức worker có thể `pane read` pane của anh em. Blind chỉ dùng được khi cái
worker *được trao* nằm sẵn trong thư mục của chính nó, nên với Unit `blind` resolver hand-off
(`resolveUnitInputs`, `src/runner/execution/handoff-refs.mjs`) không giao đường dẫn gốc: mọi input
`unit-run:`, `gate-answer:` và mọi ref nằm trong hidden root được chép nguyên byte (kiểm lại sha256
lúc chép; nguồn đã đổi sau settle thì từ chối `report-changed-after-settle`) vào `inputs/` của
*round dir của chính vai đó* (`<round>/inputs/<tên>`), vô điều kiện, không cần `anonymizeInputs`; tên
trung tính `seat-A...` cho input `unit-run:` khi `anonymizeInputs` bật, tên cố định `<n>-<vai>-r<vòng>`
hoặc `<n>-gate-<bước>` nếu không. Mỗi vai một bản riêng (không chia sẻ giữa các vai của Unit), nên
chỉ vai đó đọc được; danh sách ref của vai là các bản chép. `unit.json` giữ `resolvedInputs` (ref
đọc được tại chỗ) và `inputMap` (nguồn, tên, sha256); resume dùng lại bản chép đã có, fallback chép
lại vào round dir của lần thử mới. Synthesizer của pattern `panel` nhận report của panelist theo
đúng cách đó. `blind-ref-hidden` chỉ còn cho ref không chép được.
```

### Full target shown text

```text
Vì sao như vậy: (1) chỉ che ba thư mục run state chứ không che cả `.fgos`, vì `.fgos` có file
tracked (config, events) — che cả thư mục làm chúng hiện thành "đã xoá" trong trạng thái checkout,
và worker ghi được workspace có thể commit việc xoá đó; (2) `--unshare-pid` vì không có nó worker
đọc được cmdline của tiến trình anh em; (3) socket herdr nằm trong danh sách vì `--ro-bind / /`
vẫn cho `connect()`, tức worker có thể `pane read` pane của anh em. Blind chỉ dùng được khi cái
worker *được trao* nằm sẵn trong thư mục của chính nó, nên với Unit `blind` resolver hand-off
(`resolveUnitInputs`, `src/runner/execution/handoff-refs.mjs`) không giao đường dẫn gốc: mọi input
`unit-run:`, `gate-answer:` và mọi ref nằm trong hidden root được chép nguyên byte (kiểm lại sha256
lúc chép; nguồn đã đổi sau settle thì từ chối `report-changed-after-settle`) vào `inputs/` của
*round dir của chính vai đó* (`<round>/inputs/<tên>`), vô điều kiện, không cần `anonymizeInputs`; tên
trung tính `seat-A...` cho input `unit-run:` khi `anonymizeInputs` bật, tên cố định `<n>-<vai>-r<vòng>`
hoặc `<n>-gate-<bước>` nếu không. Mỗi vai một bản riêng (không chia sẻ giữa các vai của Unit), nên
chỉ vai đó đọc được; danh sách ref của vai là các bản chép. `unit.json` giữ `resolvedInputs` (ref
đọc được tại chỗ) và `inputMap` (nguồn, tên, sha256); resume dùng lại bản chép đã có, fallback chép
lại vào round dir của lần thử mới. Synthesizer của pattern `panel` nhận report của panelist theo
đúng cách đó. `blind-ref-hidden` chỉ còn cho ref không chép được.
```

## claim_220b8163566ad8b38cbf1d534c871e42

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-125; lines 1222–1229; ancestry ["Spec: Agent Confinement Authority","9. Default implementation đầu tiên","9.2 `hostRead: blind` — worker mù trước run state của peer"].
Target: docs/platform/agent-confinement/spec.md#unheaded-block-58; ancestry ["Spec: Agent Confinement Authority","9. Default implementation đầu tiên","9.2 `hostRead: blind` — worker mù trước run state của peer"].
Source digest: d0eb5b8c250cd17479ceba5b41a114e24933e13bfe9ca355ed5871091093e30f
Target digest: d0eb5b8c250cd17479ceba5b41a114e24933e13bfe9ca355ed5871091093e30f
Shown source SHA256: d0eb5b8c250cd17479ceba5b41a114e24933e13bfe9ca355ed5871091093e30f
Shown target SHA256: d0eb5b8c250cd17479ceba5b41a114e24933e13bfe9ca355ed5871091093e30f

### Complete proposed decision

```json
{
  "claimId": "claim_220b8163566ad8b38cbf1d534c871e42",
  "sourceUnitDigest": "d0eb5b8c250cd17479ceba5b41a114e24933e13bfe9ca355ed5871091093e30f",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "unheaded-block-58",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-125 (source lines 1222-1229) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-58 (candidate lines 486-493). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "d0eb5b8c250cd17479ceba5b41a114e24933e13bfe9ca355ed5871091093e30f",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "9. Default implementation đầu tiên",
    "9.2 `hostRead: blind` — worker mù trước run state của peer"
  ]
}
```

### Full source shown text

```text
Canary sống (2026-10-05, mỗi họ executor một Unit blind chỉ-đọc, input `unit-run:`, và đường dẫn
tuyệt đối tới report nguồn): claude (herdr), codex (herdr và cli bwrap), xai (pi herdr), glm và
deepseek (pi cli bwrap) đều đọc bản chép, gặp `ENOENT` ở nguồn và chỉ thấy chuỗi của chính mình
trong `.fgos/assignments`. Dưới `--unshare-pid` và mask thư mục socket herdr, herdr vẫn nhận ra agent
trong pane (`agentKnownToHerdr: detected`, trạng thái `unknown` → `working` → `idle`/kết thúc), nên
mask và `--unshare-pid` giữ nguyên. agy chưa chứng minh được: `agy-herdr` hỏng cả khi không blind
(`foreground process ... does not match prepared command argv`), `agy-cli-bwrap` dừng vì hết quota
của tài khoản.
```

### Full target shown text

```text
Canary sống (2026-10-05, mỗi họ executor một Unit blind chỉ-đọc, input `unit-run:`, và đường dẫn
tuyệt đối tới report nguồn): claude (herdr), codex (herdr và cli bwrap), xai (pi herdr), glm và
deepseek (pi cli bwrap) đều đọc bản chép, gặp `ENOENT` ở nguồn và chỉ thấy chuỗi của chính mình
trong `.fgos/assignments`. Dưới `--unshare-pid` và mask thư mục socket herdr, herdr vẫn nhận ra agent
trong pane (`agentKnownToHerdr: detected`, trạng thái `unknown` → `working` → `idle`/kết thúc), nên
mask và `--unshare-pid` giữ nguyên. agy chưa chứng minh được: `agy-herdr` hỏng cả khi không blind
(`foreground process ... does not match prepared command argv`), `agy-cli-bwrap` dừng vì hết quota
của tài khoản.
```

## claim_9d863e7c1e4c3983292845628b60e041

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-126; lines 1231–1243; ancestry ["Spec: Agent Confinement Authority","9. Default implementation đầu tiên","9.2 `hostRead: blind` — worker mù trước run state của peer"].
Target: docs/platform/agent-confinement/spec.md#unheaded-block-59; ancestry ["Spec: Agent Confinement Authority","9. Default implementation đầu tiên","9.2 `hostRead: blind` — worker mù trước run state của peer"].
Source digest: a42feb4ea36f23dcda856872a41811401e058cee1f3bfd71af95069725466bc8
Target digest: a42feb4ea36f23dcda856872a41811401e058cee1f3bfd71af95069725466bc8
Shown source SHA256: a42feb4ea36f23dcda856872a41811401e058cee1f3bfd71af95069725466bc8
Shown target SHA256: a42feb4ea36f23dcda856872a41811401e058cee1f3bfd71af95069725466bc8

### Complete proposed decision

```json
{
  "claimId": "claim_9d863e7c1e4c3983292845628b60e041",
  "sourceUnitDigest": "a42feb4ea36f23dcda856872a41811401e058cee1f3bfd71af95069725466bc8",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "unheaded-block-59",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-126 (source lines 1231-1243) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-59 (candidate lines 495-507). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "a42feb4ea36f23dcda856872a41811401e058cee1f3bfd71af95069725466bc8",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "9. Default implementation đầu tiên",
    "9.2 `hostRead: blind` — worker mù trước run state của peer"
  ]
}
```

### Full source shown text

```text
Dispatch `blind` bị **từ chối, không bao giờ chạy không-blind**, với lý do có tên, trước khi
spawn: `blind-requires-confinement` (mode không phải `required`/không có policy),
`blind-in-process` (Agent tool/inline không có sandbox quanh worker; `bind()` cũng không chọn nó),
`blind-hides-workspace` (cwd hoặc repo root nằm trong hidden root), `blind-ref-hidden` (context
ref nằm trong hidden root ngoài thư mục của chính dispatch), `confinement-backend-missing` /
`confinement-backend-disabled` (không có bwrap), `confinement-probe-failed` (probe chưa tươi hoặc
không qua). Probe `peer-run-hidden` (thứ chín, chỉ cho dispatch blind; fingerprint và cache riêng)
dựng argv từ chính `prepareBwrap`: worker không đọc được report của peer, home của peer, cmdline
của tiến trình anh em, nhưng đọc được thư mục của mình (chỉ-đọc) và ghi được outbox; falsifier bỏ
mask thì phải đọc được file peer. `fgos doctor` báo `blind-read: pass | fail |
backend-unsupported` (check `confinement-blind-read`). Giới hạn còn mở: transcript agent của Lead
trong host home, `.fgos/secrets.local.env` và project khác (bí mật, không phải mù), và mạng
localhost.
```

### Full target shown text

```text
Dispatch `blind` bị **từ chối, không bao giờ chạy không-blind**, với lý do có tên, trước khi
spawn: `blind-requires-confinement` (mode không phải `required`/không có policy),
`blind-in-process` (Agent tool/inline không có sandbox quanh worker; `bind()` cũng không chọn nó),
`blind-hides-workspace` (cwd hoặc repo root nằm trong hidden root), `blind-ref-hidden` (context
ref nằm trong hidden root ngoài thư mục của chính dispatch), `confinement-backend-missing` /
`confinement-backend-disabled` (không có bwrap), `confinement-probe-failed` (probe chưa tươi hoặc
không qua). Probe `peer-run-hidden` (thứ chín, chỉ cho dispatch blind; fingerprint và cache riêng)
dựng argv từ chính `prepareBwrap`: worker không đọc được report của peer, home của peer, cmdline
của tiến trình anh em, nhưng đọc được thư mục của mình (chỉ-đọc) và ghi được outbox; falsifier bỏ
mask thì phải đọc được file peer. `fgos doctor` báo `blind-read: pass | fail |
backend-unsupported` (check `confinement-blind-read`). Giới hạn còn mở: transcript agent của Lead
trong host home, `.fgos/secrets.local.env` và project khác (bí mật, không phải mù), và mạng
localhost.
```

## claim_96b54d15ac01f69e7df991151c2268be

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#10-lộ-trình-rollout-và-trạng-thái-hoàn-thành; lines 1245–1245; ancestry ["Spec: Agent Confinement Authority"].
Target: docs/platform/agent-confinement/history/rollout-and-settled-facts.md#10-lộ-trình-rollout-và-trạng-thái-hoàn-thành; ancestry ["Added in candidate: rollout and settled facts"].
Source digest: d190224e5d950146033421700ed7ddb13820841f2cebcdb371223943ceacd82d
Target digest: d190224e5d950146033421700ed7ddb13820841f2cebcdb371223943ceacd82d
Shown source SHA256: 18c1f2d6a5ecd00c1be30eb1308284b84626d40ca811ec78a3882051d5151498
Shown target SHA256: 18c1f2d6a5ecd00c1be30eb1308284b84626d40ca811ec78a3882051d5151498

### Complete proposed decision

```json
{
  "claimId": "claim_96b54d15ac01f69e7df991151c2268be",
  "sourceUnitDigest": "d190224e5d950146033421700ed7ddb13820841f2cebcdb371223943ceacd82d",
  "targetOwner": "docs/platform/agent-confinement/history/rollout-and-settled-facts.md",
  "targetAnchor": "10-lộ-trình-rollout-và-trạng-thái-hoàn-thành",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole heading unit docs/specs/confinement-authority.md#10-lộ-trình-rollout-và-trạng-thái-hoàn-thành (source lines 1245-1245) is carried at docs/platform/agent-confinement/history/rollout-and-settled-facts.md#10-lộ-trình-rollout-và-trạng-thái-hoàn-thành (candidate lines 24-24). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "d190224e5d950146033421700ed7ddb13820841f2cebcdb371223943ceacd82d",
  "targetAncestry": [
    "Added in candidate: rollout and settled facts"
  ]
}
```

### Full source shown text

```text
## 10. Lộ trình rollout và trạng thái hoàn thành

| Phase | Kết quả | Trạng thái (Track `confinement-authority-implementation`) |
|---|---|---|
| S0 - Contract | Spec, schema names, error taxonomy, one-door invariant | **Đã hoàn thành (P00)**: Contract đóng băng, repo map, inventory |
| S1 - One-door observe | Hai call site chỉ gọi Authority; adapter execute handle bị ẩn; attestation đính kèm kết quả | **Đã hoàn thành (P02)**: `executeThroughConfinement` gắn tại `spawnWorker` và `executeExecutorCli` |
| S2 - Declare | Capabilities explicit policy / `unconfined`; backend registry machine-local; schema validation | **Đã hoàn thành (P01/P04)**: Closed schema, `~/.fgos/confinement-backends.json`, setup/doctor |
| S3 - Prove | Probe harness committed (8 falsification probes) + doctor checks probe freshness | **Đã hoàn thành (P03)**: `runAllConfinementProbes` + doctor checks |
| S4 - Enforce | `required` fail closed trước spawn; di trú 3 bwrap executor | **Đã hoàn thành một phần (P04)**: 7 refusal gates, F-a đến F-d đóng; di trú 3 bwrap executor sang backend reference CHỈ ở fixture (P04.md R4) — live `.fgos/config.json` migration deferred, chưa hoàn thành |
| S5 - Complete migration | Herdr và legacy confinement hội tụ dưới Authority; evaluateBypassPairing | **Đã hoàn thành (P05)**: Chuẩn hoá v1 controls, bypass pairing bảo đảm |
| Dogfood Proof | Multi-agent coordination với cross-provider execution và bwrap enforcement thật | **Đã hoàn thành (P06)**: Doer/Reviewer/Red-Team live proof xanh, attestation artifacts |
| S6 - Extend | macOS/container/remote/network/secret backend khi có nhu cầu | Tương lai / mở rộng ngoài v1 |

Observe-first là thứ tự rollout, không phải kiến trúc đích. `required` luôn fail-closed. Mọi capability chưa có backend binding hỗ trợ được giữ ở `unconfined` (cho 3 capability tư vấn) hoặc omitted (chờ backend binding). Chế độ strict mode (`runner.confinement.strict`) mặc định giữ `false` với chẩn đoán sẵn sàng từ `fgos doctor`.
```

### Full target shown text

```text
## 10. Lộ trình rollout và trạng thái hoàn thành

| Phase | Kết quả | Trạng thái (Track `confinement-authority-implementation`) |
|---|---|---|
| S0 - Contract | Spec, schema names, error taxonomy, one-door invariant | **Đã hoàn thành (P00)**: Contract đóng băng, repo map, inventory |
| S1 - One-door observe | Hai call site chỉ gọi Authority; adapter execute handle bị ẩn; attestation đính kèm kết quả | **Đã hoàn thành (P02)**: `executeThroughConfinement` gắn tại `spawnWorker` và `executeExecutorCli` |
| S2 - Declare | Capabilities explicit policy / `unconfined`; backend registry machine-local; schema validation | **Đã hoàn thành (P01/P04)**: Closed schema, `~/.fgos/confinement-backends.json`, setup/doctor |
| S3 - Prove | Probe harness committed (8 falsification probes) + doctor checks probe freshness | **Đã hoàn thành (P03)**: `runAllConfinementProbes` + doctor checks |
| S4 - Enforce | `required` fail closed trước spawn; di trú 3 bwrap executor | **Đã hoàn thành một phần (P04)**: 7 refusal gates, F-a đến F-d đóng; di trú 3 bwrap executor sang backend reference CHỈ ở fixture (P04.md R4) — live `.fgos/config.json` migration deferred, chưa hoàn thành |
| S5 - Complete migration | Herdr và legacy confinement hội tụ dưới Authority; evaluateBypassPairing | **Đã hoàn thành (P05)**: Chuẩn hoá v1 controls, bypass pairing bảo đảm |
| Dogfood Proof | Multi-agent coordination với cross-provider execution và bwrap enforcement thật | **Đã hoàn thành (P06)**: Doer/Reviewer/Red-Team live proof xanh, attestation artifacts |
| S6 - Extend | macOS/container/remote/network/secret backend khi có nhu cầu | Tương lai / mở rộng ngoài v1 |

Observe-first là thứ tự rollout, không phải kiến trúc đích. `required` luôn fail-closed. Mọi capability chưa có backend binding hỗ trợ được giữ ở `unconfined` (cho 3 capability tư vấn) hoặc omitted (chờ backend binding). Chế độ strict mode (`runner.confinement.strict`) mặc định giữ `false` với chẩn đoán sẵn sàng từ `fgos doctor`.
```

## claim_029dd2509143e3a718a8fc0b7f7be03e

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-127; lines 1247–1256; ancestry ["Spec: Agent Confinement Authority","10. Lộ trình rollout và trạng thái hoàn thành"].
Target: docs/platform/agent-confinement/history/rollout-and-settled-facts.md#unheaded-block-3; ancestry ["Added in candidate: rollout and settled facts","10. Lộ trình rollout và trạng thái hoàn thành"].
Source digest: 5036517c45b86b22554b3c8c1b11e63cc453d4a66722bbd0c820af5ec68cc56f
Target digest: 5036517c45b86b22554b3c8c1b11e63cc453d4a66722bbd0c820af5ec68cc56f
Shown source SHA256: 5036517c45b86b22554b3c8c1b11e63cc453d4a66722bbd0c820af5ec68cc56f
Shown target SHA256: 5036517c45b86b22554b3c8c1b11e63cc453d4a66722bbd0c820af5ec68cc56f

### Complete proposed decision

```json
{
  "claimId": "claim_029dd2509143e3a718a8fc0b7f7be03e",
  "sourceUnitDigest": "5036517c45b86b22554b3c8c1b11e63cc453d4a66722bbd0c820af5ec68cc56f",
  "targetOwner": "docs/platform/agent-confinement/history/rollout-and-settled-facts.md",
  "targetAnchor": "unheaded-block-3",
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-127 (source lines 1247-1256) is carried at docs/platform/agent-confinement/history/rollout-and-settled-facts.md#unheaded-block-3 (candidate lines 26-35). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "5036517c45b86b22554b3c8c1b11e63cc453d4a66722bbd0c820af5ec68cc56f",
  "targetAncestry": [
    "Added in candidate: rollout and settled facts",
    "10. Lộ trình rollout và trạng thái hoàn thành"
  ]
}
```

### Full source shown text

```text
| Phase | Kết quả | Trạng thái (Track `confinement-authority-implementation`) |
|---|---|---|
| S0 - Contract | Spec, schema names, error taxonomy, one-door invariant | **Đã hoàn thành (P00)**: Contract đóng băng, repo map, inventory |
| S1 - One-door observe | Hai call site chỉ gọi Authority; adapter execute handle bị ẩn; attestation đính kèm kết quả | **Đã hoàn thành (P02)**: `executeThroughConfinement` gắn tại `spawnWorker` và `executeExecutorCli` |
| S2 - Declare | Capabilities explicit policy / `unconfined`; backend registry machine-local; schema validation | **Đã hoàn thành (P01/P04)**: Closed schema, `~/.fgos/confinement-backends.json`, setup/doctor |
| S3 - Prove | Probe harness committed (8 falsification probes) + doctor checks probe freshness | **Đã hoàn thành (P03)**: `runAllConfinementProbes` + doctor checks |
| S4 - Enforce | `required` fail closed trước spawn; di trú 3 bwrap executor | **Đã hoàn thành một phần (P04)**: 7 refusal gates, F-a đến F-d đóng; di trú 3 bwrap executor sang backend reference CHỈ ở fixture (P04.md R4) — live `.fgos/config.json` migration deferred, chưa hoàn thành |
| S5 - Complete migration | Herdr và legacy confinement hội tụ dưới Authority; evaluateBypassPairing | **Đã hoàn thành (P05)**: Chuẩn hoá v1 controls, bypass pairing bảo đảm |
| Dogfood Proof | Multi-agent coordination với cross-provider execution và bwrap enforcement thật | **Đã hoàn thành (P06)**: Doer/Reviewer/Red-Team live proof xanh, attestation artifacts |
| S6 - Extend | macOS/container/remote/network/secret backend khi có nhu cầu | Tương lai / mở rộng ngoài v1 |
```

### Full target shown text

```text
| Phase | Kết quả | Trạng thái (Track `confinement-authority-implementation`) |
|---|---|---|
| S0 - Contract | Spec, schema names, error taxonomy, one-door invariant | **Đã hoàn thành (P00)**: Contract đóng băng, repo map, inventory |
| S1 - One-door observe | Hai call site chỉ gọi Authority; adapter execute handle bị ẩn; attestation đính kèm kết quả | **Đã hoàn thành (P02)**: `executeThroughConfinement` gắn tại `spawnWorker` và `executeExecutorCli` |
| S2 - Declare | Capabilities explicit policy / `unconfined`; backend registry machine-local; schema validation | **Đã hoàn thành (P01/P04)**: Closed schema, `~/.fgos/confinement-backends.json`, setup/doctor |
| S3 - Prove | Probe harness committed (8 falsification probes) + doctor checks probe freshness | **Đã hoàn thành (P03)**: `runAllConfinementProbes` + doctor checks |
| S4 - Enforce | `required` fail closed trước spawn; di trú 3 bwrap executor | **Đã hoàn thành một phần (P04)**: 7 refusal gates, F-a đến F-d đóng; di trú 3 bwrap executor sang backend reference CHỈ ở fixture (P04.md R4) — live `.fgos/config.json` migration deferred, chưa hoàn thành |
| S5 - Complete migration | Herdr và legacy confinement hội tụ dưới Authority; evaluateBypassPairing | **Đã hoàn thành (P05)**: Chuẩn hoá v1 controls, bypass pairing bảo đảm |
| Dogfood Proof | Multi-agent coordination với cross-provider execution và bwrap enforcement thật | **Đã hoàn thành (P06)**: Doer/Reviewer/Red-Team live proof xanh, attestation artifacts |
| S6 - Extend | macOS/container/remote/network/secret backend khi có nhu cầu | Tương lai / mở rộng ngoài v1 |
```

## claim_0a81cfc730773e8a468f69c67e1a7948

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-128; lines 1258–1258; ancestry ["Spec: Agent Confinement Authority","10. Lộ trình rollout và trạng thái hoàn thành"].
Target: docs/platform/agent-confinement/history/rollout-and-settled-facts.md#unheaded-block-4; ancestry ["Added in candidate: rollout and settled facts","10. Lộ trình rollout và trạng thái hoàn thành"].
Source digest: 685026d049d214e631c09ff55243094abcf13ea2acb41222f115d94bcc335107
Target digest: 685026d049d214e631c09ff55243094abcf13ea2acb41222f115d94bcc335107
Shown source SHA256: 685026d049d214e631c09ff55243094abcf13ea2acb41222f115d94bcc335107
Shown target SHA256: 685026d049d214e631c09ff55243094abcf13ea2acb41222f115d94bcc335107

### Complete proposed decision

```json
{
  "claimId": "claim_0a81cfc730773e8a468f69c67e1a7948",
  "sourceUnitDigest": "685026d049d214e631c09ff55243094abcf13ea2acb41222f115d94bcc335107",
  "targetOwner": "docs/platform/agent-confinement/history/rollout-and-settled-facts.md",
  "targetAnchor": "unheaded-block-4",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-128 (source lines 1258-1258) is carried at docs/platform/agent-confinement/history/rollout-and-settled-facts.md#unheaded-block-4 (candidate lines 37-37). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "685026d049d214e631c09ff55243094abcf13ea2acb41222f115d94bcc335107",
  "targetAncestry": [
    "Added in candidate: rollout and settled facts",
    "10. Lộ trình rollout và trạng thái hoàn thành"
  ]
}
```

### Full source shown text

```text
Observe-first là thứ tự rollout, không phải kiến trúc đích. `required` luôn fail-closed. Mọi capability chưa có backend binding hỗ trợ được giữ ở `unconfined` (cho 3 capability tư vấn) hoặc omitted (chờ backend binding). Chế độ strict mode (`runner.confinement.strict`) mặc định giữ `false` với chẩn đoán sẵn sàng từ `fgos doctor`.
```

### Full target shown text

```text
Observe-first là thứ tự rollout, không phải kiến trúc đích. `required` luôn fail-closed. Mọi capability chưa có backend binding hỗ trợ được giữ ở `unconfined` (cho 3 capability tư vấn) hoặc omitted (chờ backend binding). Chế độ strict mode (`runner.confinement.strict`) mặc định giữ `false` với chẩn đoán sẵn sàng từ `fgos doctor`.
```

## claim_1ef2bc00c79bc7a40787b62a4943f0df

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#11-proof-và-definition-of-done; lines 1260–1260; ancestry ["Spec: Agent Confinement Authority"].
Target: docs/platform/agent-confinement/spec.md#11-proof-và-definition-of-done; ancestry ["Spec: Agent Confinement Authority"].
Source digest: 57cf348eee6c014023677b375f253194430c8b05e051987ccbb1ad56e611e828
Target digest: 57cf348eee6c014023677b375f253194430c8b05e051987ccbb1ad56e611e828
Shown source SHA256: f101461a754c040429900435dfac91432d1167fb8258234fe5ab535969a8a278
Shown target SHA256: f101461a754c040429900435dfac91432d1167fb8258234fe5ab535969a8a278

### Complete proposed decision

```json
{
  "claimId": "claim_1ef2bc00c79bc7a40787b62a4943f0df",
  "sourceUnitDigest": "57cf348eee6c014023677b375f253194430c8b05e051987ccbb1ad56e611e828",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "11-proof-và-definition-of-done",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/specs/confinement-authority.md#11-proof-và-definition-of-done (source lines 1260-1260) is carried at docs/platform/agent-confinement/spec.md#11-proof-và-definition-of-done (candidate lines 509-509). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "57cf348eee6c014023677b375f253194430c8b05e051987ccbb1ad56e611e828",
  "targetAncestry": [
    "Spec: Agent Confinement Authority"
  ]
}
```

### Full source shown text

```text
## 11. Proof và Definition of Done
```

### Full target shown text

```text
## 11. Proof và Definition of Done
```

## claim_7aacf43ab14386fce6c4a5a8a0519402

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#111-contract-tests; lines 1262–1262; ancestry ["Spec: Agent Confinement Authority","11. Proof và Definition of Done"].
Target: docs/platform/agent-confinement/spec.md#111-contract-tests; ancestry ["Spec: Agent Confinement Authority","11. Proof và Definition of Done"].
Source digest: 6d170846be1146514c997c484be5a940415a4a695507cfad1750510d531bd0d9
Target digest: 6d170846be1146514c997c484be5a940415a4a695507cfad1750510d531bd0d9
Shown source SHA256: ef020c383013bd0d40a4419cf56d79ca6080f967c321ede339a0fedbe4971f2c
Shown target SHA256: ef020c383013bd0d40a4419cf56d79ca6080f967c321ede339a0fedbe4971f2c

### Complete proposed decision

```json
{
  "claimId": "claim_7aacf43ab14386fce6c4a5a8a0519402",
  "sourceUnitDigest": "6d170846be1146514c997c484be5a940415a4a695507cfad1750510d531bd0d9",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "111-contract-tests",
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/specs/confinement-authority.md#111-contract-tests (source lines 1262-1262) is carried at docs/platform/agent-confinement/spec.md#111-contract-tests (candidate lines 511-511). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "6d170846be1146514c997c484be5a940415a4a695507cfad1750510d531bd0d9",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "11. Proof và Definition of Done"
  ]
}
```

### Full source shown text

```text
### 11.1 Contract tests

- Schema từ chối key lạ, backend instance/driver type lạ, driver config sai,
  policy thiếu và override hạ policy.
- Project-over-global merge được validate lại.
- Project config không thể định nghĩa hoặc override machine backend instance.
- Mọi capability resolve thành policy ID hoặc explicit `unconfined`.
- Backend không cover required control/grant phải refuse.
- Network filter/override, grant coverage và resource readiness tuân bảng §8.7.
- Fingerprint/receipt/channels đúng closed schema; stale proof phải refresh pass
  trước required spawn, refresh fail/timeout thì refuse.
```

### Full target shown text

```text
### 11.1 Contract tests

- Schema từ chối key lạ, backend instance/driver type lạ, driver config sai,
  policy thiếu và override hạ policy.
- Project-over-global merge được validate lại.
- Project config không thể định nghĩa hoặc override machine backend instance.
- Mọi capability resolve thành policy ID hoặc explicit `unconfined`.
- Backend không cover required control/grant phải refuse.
- Network filter/override, grant coverage và resource readiness tuân bảng §8.7.
- Fingerprint/receipt/channels đúng closed schema; stale proof phải refresh pass
  trước required spawn, refresh fail/timeout thì refuse.
```

## claim_bb5abf5828264d19c061b9b0920618a3

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-129; lines 1264–1272; ancestry ["Spec: Agent Confinement Authority","11. Proof và Definition of Done","11.1 Contract tests"].
Target: docs/platform/agent-confinement/spec.md#unheaded-block-60; ancestry ["Spec: Agent Confinement Authority","11. Proof và Definition of Done","11.1 Contract tests"].
Source digest: 7653e11267b25193a2a1f9c9969fffcc140830bfec41bb55bd80af4a541dc396
Target digest: 7653e11267b25193a2a1f9c9969fffcc140830bfec41bb55bd80af4a541dc396
Shown source SHA256: 7653e11267b25193a2a1f9c9969fffcc140830bfec41bb55bd80af4a541dc396
Shown target SHA256: 7653e11267b25193a2a1f9c9969fffcc140830bfec41bb55bd80af4a541dc396

### Complete proposed decision

```json
{
  "claimId": "claim_bb5abf5828264d19c061b9b0920618a3",
  "sourceUnitDigest": "7653e11267b25193a2a1f9c9969fffcc140830bfec41bb55bd80af4a541dc396",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "unheaded-block-60",
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-129 (source lines 1264-1272) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-60 (candidate lines 513-521). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "7653e11267b25193a2a1f9c9969fffcc140830bfec41bb55bd80af4a541dc396",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "11. Proof và Definition of Done",
    "11.1 Contract tests"
  ]
}
```

### Full source shown text

```text
- Schema từ chối key lạ, backend instance/driver type lạ, driver config sai,
  policy thiếu và override hạ policy.
- Project-over-global merge được validate lại.
- Project config không thể định nghĩa hoặc override machine backend instance.
- Mọi capability resolve thành policy ID hoặc explicit `unconfined`.
- Backend không cover required control/grant phải refuse.
- Network filter/override, grant coverage và resource readiness tuân bảng §8.7.
- Fingerprint/receipt/channels đúng closed schema; stale proof phải refresh pass
  trước required spawn, refresh fail/timeout thì refuse.
```

### Full target shown text

```text
- Schema từ chối key lạ, backend instance/driver type lạ, driver config sai,
  policy thiếu và override hạ policy.
- Project-over-global merge được validate lại.
- Project config không thể định nghĩa hoặc override machine backend instance.
- Mọi capability resolve thành policy ID hoặc explicit `unconfined`.
- Backend không cover required control/grant phải refuse.
- Network filter/override, grant coverage và resource readiness tuân bảng §8.7.
- Fingerprint/receipt/channels đúng closed schema; stale proof phải refresh pass
  trước required spawn, refresh fail/timeout thì refuse.
```

## claim_9168d8af609c58932a87918d4a49b8aa

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#112-one-door-tests; lines 1274–1274; ancestry ["Spec: Agent Confinement Authority","11. Proof và Definition of Done"].
Target: docs/platform/agent-confinement/spec.md#112-one-door-tests; ancestry ["Spec: Agent Confinement Authority","11. Proof và Definition of Done"].
Source digest: 82ad2c5e239e041eee2e98c16e8b463b09fb944eade7c446627ee3509bf79fc8
Target digest: 82ad2c5e239e041eee2e98c16e8b463b09fb944eade7c446627ee3509bf79fc8
Shown source SHA256: c3159902559b26b70e46c9599db907074a2babfcbce8d3082782eda21d6ca06a
Shown target SHA256: c3159902559b26b70e46c9599db907074a2babfcbce8d3082782eda21d6ca06a

### Complete proposed decision

```json
{
  "claimId": "claim_9168d8af609c58932a87918d4a49b8aa",
  "sourceUnitDigest": "82ad2c5e239e041eee2e98c16e8b463b09fb944eade7c446627ee3509bf79fc8",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "112-one-door-tests",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/specs/confinement-authority.md#112-one-door-tests (source lines 1274-1274) is carried at docs/platform/agent-confinement/spec.md#112-one-door-tests (candidate lines 523-523). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "82ad2c5e239e041eee2e98c16e8b463b09fb944eade7c446627ee3509bf79fc8",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "11. Proof và Definition of Done"
  ]
}
```

### Full source shown text

```text
### 11.2 One-door tests

- Import/static test chứng minh production caller không gọi executor adapter
  execute function trực tiếp.
- Cả `spawnWorker` và `executeExecutorCli` đi qua cùng facade.
- Adapter fake chỉ nhận prepared invocation.
- Throw trong resolve/assess/compile/prepare tạo zero spawn.
- Preferred thiếu backend/needs và partial coverage tuân §8.2, không fallback
  invocation gốc sau prepare failure.
- Crash giữa allocation intent và prepare completion được replay/reap
  idempotent; không cleanup execution còn sống hoặc remote chưa rõ liveness.
- Collect failure giữ artifact/resource; cleanup failure không xóa agent result.
```

### Full target shown text

```text
### 11.2 One-door tests

- Import/static test chứng minh production caller không gọi executor adapter
  execute function trực tiếp.
- Cả `spawnWorker` và `executeExecutorCli` đi qua cùng facade.
- Adapter fake chỉ nhận prepared invocation.
- Throw trong resolve/assess/compile/prepare tạo zero spawn.
- Preferred thiếu backend/needs và partial coverage tuân §8.2, không fallback
  invocation gốc sau prepare failure.
- Crash giữa allocation intent và prepare completion được replay/reap
  idempotent; không cleanup execution còn sống hoặc remote chưa rõ liveness.
- Collect failure giữ artifact/resource; cleanup failure không xóa agent result.
```

## claim_bd94f9efb9ccdbbc8ca5b90916290c6f

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-130; lines 1276–1285; ancestry ["Spec: Agent Confinement Authority","11. Proof và Definition of Done","11.2 One-door tests"].
Target: docs/platform/agent-confinement/spec.md#unheaded-block-61; ancestry ["Spec: Agent Confinement Authority","11. Proof và Definition of Done","11.2 One-door tests"].
Source digest: ef13d34054bfb70d28e34612c2fa9c8baf76e7a153c8f38c1673b92b9936f2bd
Target digest: ef13d34054bfb70d28e34612c2fa9c8baf76e7a153c8f38c1673b92b9936f2bd
Shown source SHA256: ef13d34054bfb70d28e34612c2fa9c8baf76e7a153c8f38c1673b92b9936f2bd
Shown target SHA256: ef13d34054bfb70d28e34612c2fa9c8baf76e7a153c8f38c1673b92b9936f2bd

### Complete proposed decision

```json
{
  "claimId": "claim_bd94f9efb9ccdbbc8ca5b90916290c6f",
  "sourceUnitDigest": "ef13d34054bfb70d28e34612c2fa9c8baf76e7a153c8f38c1673b92b9936f2bd",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "unheaded-block-61",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-130 (source lines 1276-1285) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-61 (candidate lines 525-534). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "ef13d34054bfb70d28e34612c2fa9c8baf76e7a153c8f38c1673b92b9936f2bd",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "11. Proof và Definition of Done",
    "11.2 One-door tests"
  ]
}
```

### Full source shown text

```text
- Import/static test chứng minh production caller không gọi executor adapter
  execute function trực tiếp.
- Cả `spawnWorker` và `executeExecutorCli` đi qua cùng facade.
- Adapter fake chỉ nhận prepared invocation.
- Throw trong resolve/assess/compile/prepare tạo zero spawn.
- Preferred thiếu backend/needs và partial coverage tuân §8.2, không fallback
  invocation gốc sau prepare failure.
- Crash giữa allocation intent và prepare completion được replay/reap
  idempotent; không cleanup execution còn sống hoặc remote chưa rõ liveness.
- Collect failure giữ artifact/resource; cleanup failure không xóa agent result.
```

### Full target shown text

```text
- Import/static test chứng minh production caller không gọi executor adapter
  execute function trực tiếp.
- Cả `spawnWorker` và `executeExecutorCli` đi qua cùng facade.
- Adapter fake chỉ nhận prepared invocation.
- Throw trong resolve/assess/compile/prepare tạo zero spawn.
- Preferred thiếu backend/needs và partial coverage tuân §8.2, không fallback
  invocation gốc sau prepare failure.
- Crash giữa allocation intent và prepare completion được replay/reap
  idempotent; không cleanup execution còn sống hoặc remote chưa rõ liveness.
- Collect failure giữ artifact/resource; cleanup failure không xóa agent result.
```
