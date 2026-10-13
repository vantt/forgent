# Packaging independent review: source-architecture 4

Content pin: `baef3a075899f83d515a28ab66abd6c3d55201c5`

Author: `codex-session:8@2026-10-13`; assembler: `codex-session:9@2026-10-13`. All proposals remain pending.

## claim_107a23bb29dcf6db15e2471d7e77590b

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-65

Target: docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-27

Source identity digest: `ccb205fdc5120e6287ab2067b178cb8c998e156c606d0282c8d7e02821feece0`

Target identity digest: `ccb205fdc5120e6287ab2067b178cb8c998e156c606d0282c8d7e02821feece0`

Source shown SHA256: `ccb205fdc5120e6287ab2067b178cb8c998e156c606d0282c8d7e02821feece0`

Target shown SHA256: `ccb205fdc5120e6287ab2067b178cb8c998e156c606d0282c8d7e02821feece0`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_107a23bb29dcf6db15e2471d7e77590b |
| sourceUnitDigest | ccb205fdc5120e6287ab2067b178cb8c998e156c606d0282c8d7e02821feece0 |
| targetOwner | docs/platform/packaging-distribution/contracts/activation-binding.md |
| targetAnchor | unheaded-block-27 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-65, under "6. WorkspaceActivationBinding", is retained at docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-27. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/activation-binding.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
In that context the candidate may run preflight checks and write only staging
records under the installation transaction. It must not write host-visible
projection paths, execute general workflow mutations, or claim/write shared
work-state as the active runtime.
```

### Target unit

```text
In that context the candidate may run preflight checks and write only staging
records under the installation transaction. It must not write host-visible
projection paths, execute general workflow mutations, or claim/write shared
work-state as the active runtime.
```

### Unified diff

```diff
No text difference.
```

## claim_179e4e3efced44d5c47758b3fff895fa

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#7-invocation-lease

Target: docs/platform/packaging-distribution/contracts/activation-binding.md#7-invocation-lease

Source identity digest: `99f45b97f4f4b91e26788bc9d3b584e40ad6c9945533ae13a2869cd8adc66852`

Target identity digest: `9cf64d9a62542a96c82cedc1b87194e9ab1f8b1e6b6b468c23290d7588dc94e8`

Source shown SHA256: `98df4a2c632a3266d30ff008dbc0ccf699da6d62ef7529623416bbf4d4302875`

Target shown SHA256: `7668225fecb8f0e7bf9c229725583263c3aa168db9160667995a210dce658db2`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_179e4e3efced44d5c47758b3fff895fa |
| sourceUnitDigest | 99f45b97f4f4b91e26788bc9d3b584e40ad6c9945533ae13a2869cd8adc66852 |
| targetOwner | docs/platform/packaging-distribution/contracts/activation-binding.md |
| targetAnchor | 7-invocation-lease |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete heading from docs/architect/packaging-distribution/runtime-identity-and-activation.md#7-invocation-lease, under "7. Invocation Lease", is retained at docs/platform/packaging-distribution/contracts/activation-binding.md#7-invocation-lease. Only heading depth changes; the direct section payload follows the original source order. The named owner is the contracts/activation-binding.md topic owner; carriage does not certify current implementation. |

### Source unit

````text
## 7. Invocation Lease

Any command that mutates project state should lease the workspace/work-state/
runtime identity at invocation start:

```txt
invocation starts
  -> enter stable shim path
  -> read workspace .fgos/installation/activation.json
  -> record workspaceId, workStateId, and artifactDigest in invocation context
  -> run using that release path only
  -> finish with same digest or fail with activation-changed/unknown-completion
```

This prevents activation changes, worktree switches, or nested invocations from
silently changing the runtime authority under a running command.

V1 can be conservative:

- allow `fgctl upgrade/repair` to acquire, stage, and verify while local
  mutating invocations are active;
- refuse publishing a new workspace activation binding while any non-stale
  mutating lease for that workspace is active.

Lease files are scoped by workspace and work-state identity. The exact
lease-root is supplied by `TopologyContext`, normally under
`runtimeCoordinationRoot(workStateId)` with workspace subkeys when needed. It is
not part of the packaging release/activation namespace.

```txt
<lease-root>/<workspaceId>/<invocationId>.json
```

Minimum shape:

```json
{
  "schemaVersion": 1,
  "invocationId": "inv_...",
  "pid": 12345,
  "processStartToken": "...",
  "bootId": "...",
  "startedAt": "2026-09-04T00:00:00Z",
  "expiresAt": "2026-09-04T00:05:00Z",
  "heartbeatAt": "2026-09-04T00:00:10Z",
  "workspaceId": "wks_...",
  "workStateId": "state_...",
  "artifactDigest": "sha256:...",
  "mode": "mutating",
  "command": "fgos pick",
  "parentLeaseId": null,
  "workItemId": "tsk-...",
  "runnerAssignmentId": null
}
```

V1 rules:

- the active release host binary writes leases, not the stable shim;
- mutating local `fgos` commands create a lease before mutating state;
- read-only local `fgos` commands lease the active digest in memory but do not
  block activation;
- local commands run against the leased artifact digest for the whole
  invocation;
- nested local `fgos` invocations inherit `parentLeaseId` through environment
  and must not create independent conflicting lease authority;
- `fgos-runner --watch` must not hold one long mutating lease forever. It
  leases per assignment/work mutation and re-reads workspace `activation.json`
  between assignments;
- commands remove or complete their lease on normal exit;
- `fgctl` may stage and verify a new release while leases exist;
- `fgctl` refuses to publish a new workspace activation binding with
  `runtime-busy` while a non-stale mutating lease exists for that workspace;
- stale lease cleanup is allowed only when ownership is mechanically provable:
  process start token/boot identity proves owner death, or an explicit recovery
  command records completion unknown.

Lease states:

```txt
active
released
owner-dead
expired-unproven
completion-unknown
```

Timeout alone must not silently prove safety for a mutating lease. A lease that
is merely old but whose owner cannot be mechanically proven dead should fail
closed or require explicit recovery.

Default V1 behavior is refuse, not wait. Waiting can be added later, but a
clear `runtime-busy` failure is easier to reason about and safer during the
first Rust CLI/distribution slice.
````

### Target unit

````text
#### 7. Invocation Lease

Any command that mutates project state should lease the workspace/work-state/
runtime identity at invocation start:

```txt
invocation starts
  -> enter stable shim path
  -> read workspace .fgos/installation/activation.json
  -> record workspaceId, workStateId, and artifactDigest in invocation context
  -> run using that release path only
  -> finish with same digest or fail with activation-changed/unknown-completion
```

This prevents activation changes, worktree switches, or nested invocations from
silently changing the runtime authority under a running command.

V1 can be conservative:

- allow `fgctl upgrade/repair` to acquire, stage, and verify while local
  mutating invocations are active;
- refuse publishing a new workspace activation binding while any non-stale
  mutating lease for that workspace is active.

Lease files are scoped by workspace and work-state identity. The exact
lease-root is supplied by `TopologyContext`, normally under
`runtimeCoordinationRoot(workStateId)` with workspace subkeys when needed. It is
not part of the packaging release/activation namespace.

```txt
<lease-root>/<workspaceId>/<invocationId>.json
```

Minimum shape:

```json
{
  "schemaVersion": 1,
  "invocationId": "inv_...",
  "pid": 12345,
  "processStartToken": "...",
  "bootId": "...",
  "startedAt": "2026-09-04T00:00:00Z",
  "expiresAt": "2026-09-04T00:05:00Z",
  "heartbeatAt": "2026-09-04T00:00:10Z",
  "workspaceId": "wks_...",
  "workStateId": "state_...",
  "artifactDigest": "sha256:...",
  "mode": "mutating",
  "command": "fgos pick",
  "parentLeaseId": null,
  "workItemId": "tsk-...",
  "runnerAssignmentId": null
}
```

V1 rules:

- the active release host binary writes leases, not the stable shim;
- mutating local `fgos` commands create a lease before mutating state;
- read-only local `fgos` commands lease the active digest in memory but do not
  block activation;
- local commands run against the leased artifact digest for the whole
  invocation;
- nested local `fgos` invocations inherit `parentLeaseId` through environment
  and must not create independent conflicting lease authority;
- `fgos-runner --watch` must not hold one long mutating lease forever. It
  leases per assignment/work mutation and re-reads workspace `activation.json`
  between assignments;
- commands remove or complete their lease on normal exit;
- `fgctl` may stage and verify a new release while leases exist;
- `fgctl` refuses to publish a new workspace activation binding with
  `runtime-busy` while a non-stale mutating lease exists for that workspace;
- stale lease cleanup is allowed only when ownership is mechanically provable:
  process start token/boot identity proves owner death, or an explicit recovery
  command records completion unknown.

Lease states:

```txt
active
released
owner-dead
expired-unproven
completion-unknown
```

Timeout alone must not silently prove safety for a mutating lease. A lease that
is merely old but whose owner cannot be mechanically proven dead should fail
closed or require explicit recovery.

Default V1 behavior is refuse, not wait. Waiting can be added later, but a
clear `runtime-busy` failure is easier to reason about and safer during the
first Rust CLI/distribution slice.
````

### Unified diff

```diff
--- "docs/architect/packaging-distribution/runtime-identity-and-activation.md#7-invocation-lease"
+++ "docs/platform/packaging-distribution/contracts/activation-binding.md#7-invocation-lease"
@@ -1,4 +1,4 @@
-## 7. Invocation Lease
+#### 7. Invocation Lease
 
 Any command that mutates project state should lease the workspace/work-state/
 runtime identity at invocation start:
```

## claim_9b88f0158d85f69a82792e4b47f72022

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-66

Target: docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-28

Source identity digest: `0449999b7a416906c1e39a270e9c21f37d9cc2326d375cf13594e6fe38253d12`

Target identity digest: `0449999b7a416906c1e39a270e9c21f37d9cc2326d375cf13594e6fe38253d12`

Source shown SHA256: `0449999b7a416906c1e39a270e9c21f37d9cc2326d375cf13594e6fe38253d12`

Target shown SHA256: `0449999b7a416906c1e39a270e9c21f37d9cc2326d375cf13594e6fe38253d12`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_9b88f0158d85f69a82792e4b47f72022 |
| sourceUnitDigest | 0449999b7a416906c1e39a270e9c21f37d9cc2326d375cf13594e6fe38253d12 |
| targetOwner | docs/platform/packaging-distribution/contracts/activation-binding.md |
| targetAnchor | unheaded-block-28 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-66, under "7. Invocation Lease", is retained at docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-28. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/activation-binding.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
Any command that mutates project state should lease the workspace/work-state/
runtime identity at invocation start:
```

### Target unit

```text
Any command that mutates project state should lease the workspace/work-state/
runtime identity at invocation start:
```

### Unified diff

```diff
No text difference.
```

## claim_5d408ebec2a9651d66e1dceb37b133aa

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-67

Target: docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-29

Source identity digest: `7db0392a7929f28b94d89e713f924622ad7f686b20f8070c87360ecd964b2b22`

Target identity digest: `7db0392a7929f28b94d89e713f924622ad7f686b20f8070c87360ecd964b2b22`

Source shown SHA256: `7db0392a7929f28b94d89e713f924622ad7f686b20f8070c87360ecd964b2b22`

Target shown SHA256: `7db0392a7929f28b94d89e713f924622ad7f686b20f8070c87360ecd964b2b22`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_5d408ebec2a9651d66e1dceb37b133aa |
| sourceUnitDigest | 7db0392a7929f28b94d89e713f924622ad7f686b20f8070c87360ecd964b2b22 |
| targetOwner | docs/platform/packaging-distribution/contracts/activation-binding.md |
| targetAnchor | unheaded-block-29 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-67, under "7. Invocation Lease", is retained at docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-29. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/activation-binding.md topic owner; carriage does not certify current implementation. |

### Source unit

````text
```txt
invocation starts
  -> enter stable shim path
  -> read workspace .fgos/installation/activation.json
  -> record workspaceId, workStateId, and artifactDigest in invocation context
  -> run using that release path only
  -> finish with same digest or fail with activation-changed/unknown-completion
```
````

### Target unit

````text
```txt
invocation starts
  -> enter stable shim path
  -> read workspace .fgos/installation/activation.json
  -> record workspaceId, workStateId, and artifactDigest in invocation context
  -> run using that release path only
  -> finish with same digest or fail with activation-changed/unknown-completion
```
````

### Unified diff

```diff
No text difference.
```

## claim_644be2fa35959c10348a048777c5f1b9

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-68

Target: docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-30

Source identity digest: `e46b094a9d547703457cd1874db926f229c5f840fdc4c04f70ee621f8d25e57a`

Target identity digest: `e46b094a9d547703457cd1874db926f229c5f840fdc4c04f70ee621f8d25e57a`

Source shown SHA256: `e46b094a9d547703457cd1874db926f229c5f840fdc4c04f70ee621f8d25e57a`

Target shown SHA256: `e46b094a9d547703457cd1874db926f229c5f840fdc4c04f70ee621f8d25e57a`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_644be2fa35959c10348a048777c5f1b9 |
| sourceUnitDigest | e46b094a9d547703457cd1874db926f229c5f840fdc4c04f70ee621f8d25e57a |
| targetOwner | docs/platform/packaging-distribution/contracts/activation-binding.md |
| targetAnchor | unheaded-block-30 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-68, under "7. Invocation Lease", is retained at docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-30. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/activation-binding.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
This prevents activation changes, worktree switches, or nested invocations from
silently changing the runtime authority under a running command.
```

### Target unit

```text
This prevents activation changes, worktree switches, or nested invocations from
silently changing the runtime authority under a running command.
```

### Unified diff

```diff
No text difference.
```

## claim_6db1dcef195562e8c4244f6ad6d0a032

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-69

Target: docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-31

Source identity digest: `dc365e00a42eed9599e3c3364e4fdc6934ded461577fc2edbffbbc164163f43c`

Target identity digest: `dc365e00a42eed9599e3c3364e4fdc6934ded461577fc2edbffbbc164163f43c`

Source shown SHA256: `dc365e00a42eed9599e3c3364e4fdc6934ded461577fc2edbffbbc164163f43c`

Target shown SHA256: `dc365e00a42eed9599e3c3364e4fdc6934ded461577fc2edbffbbc164163f43c`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_6db1dcef195562e8c4244f6ad6d0a032 |
| sourceUnitDigest | dc365e00a42eed9599e3c3364e4fdc6934ded461577fc2edbffbbc164163f43c |
| targetOwner | docs/platform/packaging-distribution/contracts/activation-binding.md |
| targetAnchor | unheaded-block-31 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-69, under "7. Invocation Lease", is retained at docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-31. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/activation-binding.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
V1 can be conservative:
```

### Target unit

```text
V1 can be conservative:
```

### Unified diff

```diff
No text difference.
```

## claim_a56575cde3ab1f361ab6e7079699886f

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-70

Target: docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-32

Source identity digest: `7925f88545b7297188e1883a5707b8dbb1dfee8bd4fd4797783de1e0d8b26267`

Target identity digest: `7925f88545b7297188e1883a5707b8dbb1dfee8bd4fd4797783de1e0d8b26267`

Source shown SHA256: `7925f88545b7297188e1883a5707b8dbb1dfee8bd4fd4797783de1e0d8b26267`

Target shown SHA256: `7925f88545b7297188e1883a5707b8dbb1dfee8bd4fd4797783de1e0d8b26267`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_a56575cde3ab1f361ab6e7079699886f |
| sourceUnitDigest | 7925f88545b7297188e1883a5707b8dbb1dfee8bd4fd4797783de1e0d8b26267 |
| targetOwner | docs/platform/packaging-distribution/contracts/activation-binding.md |
| targetAnchor | unheaded-block-32 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-70, under "7. Invocation Lease", is retained at docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-32. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/activation-binding.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
- allow `fgctl upgrade/repair` to acquire, stage, and verify while local
  mutating invocations are active;
- refuse publishing a new workspace activation binding while any non-stale
  mutating lease for that workspace is active.
```

### Target unit

```text
- allow `fgctl upgrade/repair` to acquire, stage, and verify while local
  mutating invocations are active;
- refuse publishing a new workspace activation binding while any non-stale
  mutating lease for that workspace is active.
```

### Unified diff

```diff
No text difference.
```

## claim_14de31f9e2756afe4d30767125f2f302

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-71

Target: docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-33

Source identity digest: `e260a8e1fa942a1f5bf1c99a7ba7abd14dac6ee6231576143a44a28bc0d0a05f`

Target identity digest: `e260a8e1fa942a1f5bf1c99a7ba7abd14dac6ee6231576143a44a28bc0d0a05f`

Source shown SHA256: `e260a8e1fa942a1f5bf1c99a7ba7abd14dac6ee6231576143a44a28bc0d0a05f`

Target shown SHA256: `e260a8e1fa942a1f5bf1c99a7ba7abd14dac6ee6231576143a44a28bc0d0a05f`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_14de31f9e2756afe4d30767125f2f302 |
| sourceUnitDigest | e260a8e1fa942a1f5bf1c99a7ba7abd14dac6ee6231576143a44a28bc0d0a05f |
| targetOwner | docs/platform/packaging-distribution/contracts/activation-binding.md |
| targetAnchor | unheaded-block-33 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-71, under "7. Invocation Lease", is retained at docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-33. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/activation-binding.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
Lease files are scoped by workspace and work-state identity. The exact
lease-root is supplied by `TopologyContext`, normally under
`runtimeCoordinationRoot(workStateId)` with workspace subkeys when needed. It is
not part of the packaging release/activation namespace.
```

### Target unit

```text
Lease files are scoped by workspace and work-state identity. The exact
lease-root is supplied by `TopologyContext`, normally under
`runtimeCoordinationRoot(workStateId)` with workspace subkeys when needed. It is
not part of the packaging release/activation namespace.
```

### Unified diff

```diff
No text difference.
```

## claim_3ef278de1f3aec5f3020e1aa0b5ce269

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-72

Target: docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-34

Source identity digest: `2d86b51570e889b3275f8bd88e04ea73bf1b87ef273c55682de94fc09ee5114b`

Target identity digest: `2d86b51570e889b3275f8bd88e04ea73bf1b87ef273c55682de94fc09ee5114b`

Source shown SHA256: `2d86b51570e889b3275f8bd88e04ea73bf1b87ef273c55682de94fc09ee5114b`

Target shown SHA256: `2d86b51570e889b3275f8bd88e04ea73bf1b87ef273c55682de94fc09ee5114b`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_3ef278de1f3aec5f3020e1aa0b5ce269 |
| sourceUnitDigest | 2d86b51570e889b3275f8bd88e04ea73bf1b87ef273c55682de94fc09ee5114b |
| targetOwner | docs/platform/packaging-distribution/contracts/activation-binding.md |
| targetAnchor | unheaded-block-34 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-72, under "7. Invocation Lease", is retained at docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-34. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/activation-binding.md topic owner; carriage does not certify current implementation. |

### Source unit

````text
```txt
<lease-root>/<workspaceId>/<invocationId>.json
```
````

### Target unit

````text
```txt
<lease-root>/<workspaceId>/<invocationId>.json
```
````

### Unified diff

```diff
No text difference.
```

## claim_566ba6b6f52ab7360edd78e376c925ba

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-73

Target: docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-35

Source identity digest: `b8fa01639c54fb4ce334dcb069b23472fbc2478e9bad4df8d67c073289e8e2d8`

Target identity digest: `b8fa01639c54fb4ce334dcb069b23472fbc2478e9bad4df8d67c073289e8e2d8`

Source shown SHA256: `b8fa01639c54fb4ce334dcb069b23472fbc2478e9bad4df8d67c073289e8e2d8`

Target shown SHA256: `b8fa01639c54fb4ce334dcb069b23472fbc2478e9bad4df8d67c073289e8e2d8`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_566ba6b6f52ab7360edd78e376c925ba |
| sourceUnitDigest | b8fa01639c54fb4ce334dcb069b23472fbc2478e9bad4df8d67c073289e8e2d8 |
| targetOwner | docs/platform/packaging-distribution/contracts/activation-binding.md |
| targetAnchor | unheaded-block-35 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-73, under "7. Invocation Lease", is retained at docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-35. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/activation-binding.md topic owner; carriage does not certify current implementation. |

### Source unit

````text
Minimum shape:

```json
{
  "schemaVersion": 1,
  "invocationId": "inv_...",
  "pid": 12345,
  "processStartToken": "...",
  "bootId": "...",
  "startedAt": "2026-09-04T00:00:00Z",
  "expiresAt": "2026-09-04T00:05:00Z",
  "heartbeatAt": "2026-09-04T00:00:10Z",
  "workspaceId": "wks_...",
  "workStateId": "state_...",
  "artifactDigest": "sha256:...",
  "mode": "mutating",
  "command": "fgos pick",
  "parentLeaseId": null,
  "workItemId": "tsk-...",
  "runnerAssignmentId": null
}
```
````

### Target unit

````text
Minimum shape:

```json
{
  "schemaVersion": 1,
  "invocationId": "inv_...",
  "pid": 12345,
  "processStartToken": "...",
  "bootId": "...",
  "startedAt": "2026-09-04T00:00:00Z",
  "expiresAt": "2026-09-04T00:05:00Z",
  "heartbeatAt": "2026-09-04T00:00:10Z",
  "workspaceId": "wks_...",
  "workStateId": "state_...",
  "artifactDigest": "sha256:...",
  "mode": "mutating",
  "command": "fgos pick",
  "parentLeaseId": null,
  "workItemId": "tsk-...",
  "runnerAssignmentId": null
}
```
````

### Unified diff

```diff
No text difference.
```

## claim_902e921806fa75a30ff3879ae1f85761

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-74

Target: docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-36

Source identity digest: `dbfa56f1bdbb52a5388df77df070e5146275526c1da44bc23fd9162931e9d761`

Target identity digest: `dbfa56f1bdbb52a5388df77df070e5146275526c1da44bc23fd9162931e9d761`

Source shown SHA256: `dbfa56f1bdbb52a5388df77df070e5146275526c1da44bc23fd9162931e9d761`

Target shown SHA256: `dbfa56f1bdbb52a5388df77df070e5146275526c1da44bc23fd9162931e9d761`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_902e921806fa75a30ff3879ae1f85761 |
| sourceUnitDigest | dbfa56f1bdbb52a5388df77df070e5146275526c1da44bc23fd9162931e9d761 |
| targetOwner | docs/platform/packaging-distribution/contracts/activation-binding.md |
| targetAnchor | unheaded-block-36 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-74, under "7. Invocation Lease", is retained at docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-36. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/activation-binding.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
V1 rules:

- the active release host binary writes leases, not the stable shim;
- mutating local `fgos` commands create a lease before mutating state;
- read-only local `fgos` commands lease the active digest in memory but do not
  block activation;
- local commands run against the leased artifact digest for the whole
  invocation;
- nested local `fgos` invocations inherit `parentLeaseId` through environment
  and must not create independent conflicting lease authority;
- `fgos-runner --watch` must not hold one long mutating lease forever. It
  leases per assignment/work mutation and re-reads workspace `activation.json`
  between assignments;
- commands remove or complete their lease on normal exit;
- `fgctl` may stage and verify a new release while leases exist;
- `fgctl` refuses to publish a new workspace activation binding with
  `runtime-busy` while a non-stale mutating lease exists for that workspace;
- stale lease cleanup is allowed only when ownership is mechanically provable:
  process start token/boot identity proves owner death, or an explicit recovery
  command records completion unknown.
```

### Target unit

```text
V1 rules:

- the active release host binary writes leases, not the stable shim;
- mutating local `fgos` commands create a lease before mutating state;
- read-only local `fgos` commands lease the active digest in memory but do not
  block activation;
- local commands run against the leased artifact digest for the whole
  invocation;
- nested local `fgos` invocations inherit `parentLeaseId` through environment
  and must not create independent conflicting lease authority;
- `fgos-runner --watch` must not hold one long mutating lease forever. It
  leases per assignment/work mutation and re-reads workspace `activation.json`
  between assignments;
- commands remove or complete their lease on normal exit;
- `fgctl` may stage and verify a new release while leases exist;
- `fgctl` refuses to publish a new workspace activation binding with
  `runtime-busy` while a non-stale mutating lease exists for that workspace;
- stale lease cleanup is allowed only when ownership is mechanically provable:
  process start token/boot identity proves owner death, or an explicit recovery
  command records completion unknown.
```

### Unified diff

```diff
No text difference.
```

## claim_13dd8473351e86bde28b379f9fbeb00f

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-75

Target: docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-37

Source identity digest: `d2e41a70900c9bf7d37465e1a5e7ce95f2dabdc1d8a1a64be8258795da18205b`

Target identity digest: `d2e41a70900c9bf7d37465e1a5e7ce95f2dabdc1d8a1a64be8258795da18205b`

Source shown SHA256: `d2e41a70900c9bf7d37465e1a5e7ce95f2dabdc1d8a1a64be8258795da18205b`

Target shown SHA256: `d2e41a70900c9bf7d37465e1a5e7ce95f2dabdc1d8a1a64be8258795da18205b`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_13dd8473351e86bde28b379f9fbeb00f |
| sourceUnitDigest | d2e41a70900c9bf7d37465e1a5e7ce95f2dabdc1d8a1a64be8258795da18205b |
| targetOwner | docs/platform/packaging-distribution/contracts/activation-binding.md |
| targetAnchor | unheaded-block-37 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-75, under "7. Invocation Lease", is retained at docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-37. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/activation-binding.md topic owner; carriage does not certify current implementation. |

### Source unit

````text
Lease states:

```txt
active
released
owner-dead
expired-unproven
completion-unknown
```
````

### Target unit

````text
Lease states:

```txt
active
released
owner-dead
expired-unproven
completion-unknown
```
````

### Unified diff

```diff
No text difference.
```

## claim_9abe48d0f9a2dc345830741d5ab789c8

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-76

Target: docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-38

Source identity digest: `a1f9632769f4cbf2465902c1773664342ac276e6a87f3d290cae2d20730110c6`

Target identity digest: `a1f9632769f4cbf2465902c1773664342ac276e6a87f3d290cae2d20730110c6`

Source shown SHA256: `a1f9632769f4cbf2465902c1773664342ac276e6a87f3d290cae2d20730110c6`

Target shown SHA256: `a1f9632769f4cbf2465902c1773664342ac276e6a87f3d290cae2d20730110c6`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_9abe48d0f9a2dc345830741d5ab789c8 |
| sourceUnitDigest | a1f9632769f4cbf2465902c1773664342ac276e6a87f3d290cae2d20730110c6 |
| targetOwner | docs/platform/packaging-distribution/contracts/activation-binding.md |
| targetAnchor | unheaded-block-38 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-76, under "7. Invocation Lease", is retained at docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-38. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/activation-binding.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
Timeout alone must not silently prove safety for a mutating lease. A lease that
is merely old but whose owner cannot be mechanically proven dead should fail
closed or require explicit recovery.
```

### Target unit

```text
Timeout alone must not silently prove safety for a mutating lease. A lease that
is merely old but whose owner cannot be mechanically proven dead should fail
closed or require explicit recovery.
```

### Unified diff

```diff
No text difference.
```

## claim_9b6a43d8cd95739a1b4b582898073233

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-77

Target: docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-39

Source identity digest: `fd456a8043fdb4255157f59b82696fe42576b90151877b4cb1232a5ea854b82a`

Target identity digest: `fd456a8043fdb4255157f59b82696fe42576b90151877b4cb1232a5ea854b82a`

Source shown SHA256: `fd456a8043fdb4255157f59b82696fe42576b90151877b4cb1232a5ea854b82a`

Target shown SHA256: `fd456a8043fdb4255157f59b82696fe42576b90151877b4cb1232a5ea854b82a`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_9b6a43d8cd95739a1b4b582898073233 |
| sourceUnitDigest | fd456a8043fdb4255157f59b82696fe42576b90151877b4cb1232a5ea854b82a |
| targetOwner | docs/platform/packaging-distribution/contracts/activation-binding.md |
| targetAnchor | unheaded-block-39 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-77, under "7. Invocation Lease", is retained at docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-39. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/activation-binding.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
Default V1 behavior is refuse, not wait. Waiting can be added later, but a
clear `runtime-busy` failure is easier to reason about and safer during the
first Rust CLI/distribution slice.
```

### Target unit

```text
Default V1 behavior is refuse, not wait. Waiting can be added later, but a
clear `runtime-busy` failure is easier to reason about and safer during the
first Rust CLI/distribution slice.
```

### Unified diff

```diff
No text difference.
```

## claim_52a973f8470cb1944a340ed858f04efb

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#8-pin

Target: docs/platform/packaging-distribution/contracts/distribution-pin.md#8-pin

Source identity digest: `144862b42e821c608f6ee8e1371a770aaf9eaba4887c172aea10923b4533201c`

Target identity digest: `0161405f328c7b384ad2516777bc2229203e0e8e8475853c7635243904641e79`

Source shown SHA256: `663327c4f40bb5dc6f8bae4f7e1a47d98496fac921bbbd00582a927e887f7bf2`

Target shown SHA256: `ad0bcfc9d46da333e4397737a922d0a4d06db99b1fd3dca8c0b73f4cc30c300e`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_52a973f8470cb1944a340ed858f04efb |
| sourceUnitDigest | 144862b42e821c608f6ee8e1371a770aaf9eaba4887c172aea10923b4533201c |
| targetOwner | docs/platform/packaging-distribution/contracts/distribution-pin.md |
| targetAnchor | 8-pin |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete heading from docs/architect/packaging-distribution/runtime-identity-and-activation.md#8-pin, under "8. Pin", is retained at docs/platform/packaging-distribution/contracts/distribution-pin.md#8-pin. Only heading depth changes; the direct section payload follows the original source order. The named owner is the contracts/distribution-pin.md topic owner; carriage does not certify current implementation. |

### Source unit

````text
## 8. Pin

The pin records desired selection policy. It does not prove what is active. In
V1 the pin is tracked project state at:

```txt
.fgos/distribution.json
```

This is intentionally outside ignored machine-local runtime areas so a clone or
teammate receives the same branch/project runtime policy.

Possible shape:

```json
{
  "schemaVersion": 1,
  "projectRuntime": {
    "policy": "exact-digest",
    "artifactDigest": "sha256:...",
    "releaseVersion": "0.1.0",
    "channel": null,
    "allowPrerelease": false
  }
}
```

Supported policies can start small:

- `exact-digest`;
- `exact-version`;
- later `channel`.

For safety, the workspace activation binding should snapshot the pin used
during activation.

If the pin exists but its requested release is not present in the release store
root, the workspace is `pinned-not-staged`. `fgctl init` must acquire the
pinned release instead of selecting latest.
````

### Target unit

````text
#### 8. Pin

The pin records desired selection policy. It does not prove what is active. In
V1 the pin is tracked project state at:

```txt
.fgos/distribution.json
```

This is intentionally outside ignored machine-local runtime areas so a clone or
teammate receives the same branch/project runtime policy.

Possible shape:

```json
{
  "schemaVersion": 1,
  "projectRuntime": {
    "policy": "exact-digest",
    "artifactDigest": "sha256:...",
    "releaseVersion": "0.1.0",
    "channel": null,
    "allowPrerelease": false
  }
}
```

Supported policies can start small:

- `exact-digest`;
- `exact-version`;
- later `channel`.

For safety, the workspace activation binding should snapshot the pin used
during activation.

If the pin exists but its requested release is not present in the release store
root, the workspace is `pinned-not-staged`. `fgctl init` must acquire the
pinned release instead of selecting latest.
````

### Unified diff

```diff
--- "docs/architect/packaging-distribution/runtime-identity-and-activation.md#8-pin"
+++ "docs/platform/packaging-distribution/contracts/distribution-pin.md#8-pin"
@@ -1,4 +1,4 @@
-## 8. Pin
+#### 8. Pin
 
 The pin records desired selection policy. It does not prove what is active. In
 V1 the pin is tracked project state at:
```

## claim_971cf3ac708840a6682762c1ff359bfe

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-78

Target: docs/platform/packaging-distribution/contracts/distribution-pin.md#unheaded-block-12

Source identity digest: `90970e1148a1744047765bc8f2d93346bb881b91e982483eefb4168451df4f7d`

Target identity digest: `90970e1148a1744047765bc8f2d93346bb881b91e982483eefb4168451df4f7d`

Source shown SHA256: `90970e1148a1744047765bc8f2d93346bb881b91e982483eefb4168451df4f7d`

Target shown SHA256: `90970e1148a1744047765bc8f2d93346bb881b91e982483eefb4168451df4f7d`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_971cf3ac708840a6682762c1ff359bfe |
| sourceUnitDigest | 90970e1148a1744047765bc8f2d93346bb881b91e982483eefb4168451df4f7d |
| targetOwner | docs/platform/packaging-distribution/contracts/distribution-pin.md |
| targetAnchor | unheaded-block-12 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-78, under "8. Pin", is retained at docs/platform/packaging-distribution/contracts/distribution-pin.md#unheaded-block-12. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/distribution-pin.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
The pin records desired selection policy. It does not prove what is active. In
V1 the pin is tracked project state at:
```

### Target unit

```text
The pin records desired selection policy. It does not prove what is active. In
V1 the pin is tracked project state at:
```

### Unified diff

```diff
No text difference.
```

## claim_91a834dde03fb4d5de522e8f2ee4e264

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-79

Target: docs/platform/packaging-distribution/contracts/distribution-pin.md#unheaded-block-13

Source identity digest: `657d4d3bbdbcdb7958cb601a9a4163736217a003e781e0ca4965fcfa8cd37e8c`

Target identity digest: `657d4d3bbdbcdb7958cb601a9a4163736217a003e781e0ca4965fcfa8cd37e8c`

Source shown SHA256: `657d4d3bbdbcdb7958cb601a9a4163736217a003e781e0ca4965fcfa8cd37e8c`

Target shown SHA256: `657d4d3bbdbcdb7958cb601a9a4163736217a003e781e0ca4965fcfa8cd37e8c`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_91a834dde03fb4d5de522e8f2ee4e264 |
| sourceUnitDigest | 657d4d3bbdbcdb7958cb601a9a4163736217a003e781e0ca4965fcfa8cd37e8c |
| targetOwner | docs/platform/packaging-distribution/contracts/distribution-pin.md |
| targetAnchor | unheaded-block-13 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-79, under "8. Pin", is retained at docs/platform/packaging-distribution/contracts/distribution-pin.md#unheaded-block-13. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/distribution-pin.md topic owner; carriage does not certify current implementation. |

### Source unit

````text
```txt
.fgos/distribution.json
```
````

### Target unit

````text
```txt
.fgos/distribution.json
```
````

### Unified diff

```diff
No text difference.
```

## claim_727d725b6c684525ce31433b6c80a82c

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-80

Target: docs/platform/packaging-distribution/contracts/distribution-pin.md#unheaded-block-14

Source identity digest: `747dc79de35fcff38eb16089557e5a173ad94e380736ddb89811c1cdf5cf9eba`

Target identity digest: `747dc79de35fcff38eb16089557e5a173ad94e380736ddb89811c1cdf5cf9eba`

Source shown SHA256: `747dc79de35fcff38eb16089557e5a173ad94e380736ddb89811c1cdf5cf9eba`

Target shown SHA256: `747dc79de35fcff38eb16089557e5a173ad94e380736ddb89811c1cdf5cf9eba`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_727d725b6c684525ce31433b6c80a82c |
| sourceUnitDigest | 747dc79de35fcff38eb16089557e5a173ad94e380736ddb89811c1cdf5cf9eba |
| targetOwner | docs/platform/packaging-distribution/contracts/distribution-pin.md |
| targetAnchor | unheaded-block-14 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-80, under "8. Pin", is retained at docs/platform/packaging-distribution/contracts/distribution-pin.md#unheaded-block-14. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/distribution-pin.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
This is intentionally outside ignored machine-local runtime areas so a clone or
teammate receives the same branch/project runtime policy.
```

### Target unit

```text
This is intentionally outside ignored machine-local runtime areas so a clone or
teammate receives the same branch/project runtime policy.
```

### Unified diff

```diff
No text difference.
```

## claim_caf633f259ab9311fc2a6b59369e8e4c

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-81

Target: docs/platform/packaging-distribution/contracts/distribution-pin.md#unheaded-block-15

Source identity digest: `3d5ea0ed17a180fec81bcbd1f399dd0f8badc973b37c4b7d4afdfd679351b61a`

Target identity digest: `3d5ea0ed17a180fec81bcbd1f399dd0f8badc973b37c4b7d4afdfd679351b61a`

Source shown SHA256: `3d5ea0ed17a180fec81bcbd1f399dd0f8badc973b37c4b7d4afdfd679351b61a`

Target shown SHA256: `3d5ea0ed17a180fec81bcbd1f399dd0f8badc973b37c4b7d4afdfd679351b61a`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_caf633f259ab9311fc2a6b59369e8e4c |
| sourceUnitDigest | 3d5ea0ed17a180fec81bcbd1f399dd0f8badc973b37c4b7d4afdfd679351b61a |
| targetOwner | docs/platform/packaging-distribution/contracts/distribution-pin.md |
| targetAnchor | unheaded-block-15 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-81, under "8. Pin", is retained at docs/platform/packaging-distribution/contracts/distribution-pin.md#unheaded-block-15. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/distribution-pin.md topic owner; carriage does not certify current implementation. |

### Source unit

````text
Possible shape:

```json
{
  "schemaVersion": 1,
  "projectRuntime": {
    "policy": "exact-digest",
    "artifactDigest": "sha256:...",
    "releaseVersion": "0.1.0",
    "channel": null,
    "allowPrerelease": false
  }
}
```
````

### Target unit

````text
Possible shape:

```json
{
  "schemaVersion": 1,
  "projectRuntime": {
    "policy": "exact-digest",
    "artifactDigest": "sha256:...",
    "releaseVersion": "0.1.0",
    "channel": null,
    "allowPrerelease": false
  }
}
```
````

### Unified diff

```diff
No text difference.
```

## claim_c79ecbfd6d9fcef835494ec27d9b430d

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-82

Target: docs/platform/packaging-distribution/contracts/distribution-pin.md#unheaded-block-16

Source identity digest: `22f562f2ec14869bc828603921116e6fb4b26fc418e464f6c58ea945e322992d`

Target identity digest: `22f562f2ec14869bc828603921116e6fb4b26fc418e464f6c58ea945e322992d`

Source shown SHA256: `22f562f2ec14869bc828603921116e6fb4b26fc418e464f6c58ea945e322992d`

Target shown SHA256: `22f562f2ec14869bc828603921116e6fb4b26fc418e464f6c58ea945e322992d`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_c79ecbfd6d9fcef835494ec27d9b430d |
| sourceUnitDigest | 22f562f2ec14869bc828603921116e6fb4b26fc418e464f6c58ea945e322992d |
| targetOwner | docs/platform/packaging-distribution/contracts/distribution-pin.md |
| targetAnchor | unheaded-block-16 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-82, under "8. Pin", is retained at docs/platform/packaging-distribution/contracts/distribution-pin.md#unheaded-block-16. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/distribution-pin.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
Supported policies can start small:
```

### Target unit

```text
Supported policies can start small:
```

### Unified diff

```diff
No text difference.
```

## claim_fdba65f9b9568b8b056ca62b641ba27a

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-83

Target: docs/platform/packaging-distribution/contracts/distribution-pin.md#unheaded-block-17

Source identity digest: `0332f7a1c0ccb10758f05b803e0b8dc69f39eecd12e3b5c538e8bb641439429c`

Target identity digest: `0332f7a1c0ccb10758f05b803e0b8dc69f39eecd12e3b5c538e8bb641439429c`

Source shown SHA256: `0332f7a1c0ccb10758f05b803e0b8dc69f39eecd12e3b5c538e8bb641439429c`

Target shown SHA256: `0332f7a1c0ccb10758f05b803e0b8dc69f39eecd12e3b5c538e8bb641439429c`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_fdba65f9b9568b8b056ca62b641ba27a |
| sourceUnitDigest | 0332f7a1c0ccb10758f05b803e0b8dc69f39eecd12e3b5c538e8bb641439429c |
| targetOwner | docs/platform/packaging-distribution/contracts/distribution-pin.md |
| targetAnchor | unheaded-block-17 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-83, under "8. Pin", is retained at docs/platform/packaging-distribution/contracts/distribution-pin.md#unheaded-block-17. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/distribution-pin.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
- `exact-digest`;
- `exact-version`;
- later `channel`.
```

### Target unit

```text
- `exact-digest`;
- `exact-version`;
- later `channel`.
```

### Unified diff

```diff
No text difference.
```

## claim_c55b087169bb5b95e77d2392f847dd59

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-84

Target: docs/platform/packaging-distribution/contracts/distribution-pin.md#unheaded-block-18

Source identity digest: `9542925797bd42cb7029f75ebfec929b567a437d454c558c2992815adb329ac2`

Target identity digest: `9542925797bd42cb7029f75ebfec929b567a437d454c558c2992815adb329ac2`

Source shown SHA256: `9542925797bd42cb7029f75ebfec929b567a437d454c558c2992815adb329ac2`

Target shown SHA256: `9542925797bd42cb7029f75ebfec929b567a437d454c558c2992815adb329ac2`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_c55b087169bb5b95e77d2392f847dd59 |
| sourceUnitDigest | 9542925797bd42cb7029f75ebfec929b567a437d454c558c2992815adb329ac2 |
| targetOwner | docs/platform/packaging-distribution/contracts/distribution-pin.md |
| targetAnchor | unheaded-block-18 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-84, under "8. Pin", is retained at docs/platform/packaging-distribution/contracts/distribution-pin.md#unheaded-block-18. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/distribution-pin.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
For safety, the workspace activation binding should snapshot the pin used
during activation.
```

### Target unit

```text
For safety, the workspace activation binding should snapshot the pin used
during activation.
```

### Unified diff

```diff
No text difference.
```

## claim_fe64609bae7caa081faaaf50124b3467

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-85

Target: docs/platform/packaging-distribution/contracts/distribution-pin.md#unheaded-block-19

Source identity digest: `74e0babdb79701590cf19af9a8f409ed0597d35cb398ecaa96cb1adaf4547d7d`

Target identity digest: `74e0babdb79701590cf19af9a8f409ed0597d35cb398ecaa96cb1adaf4547d7d`

Source shown SHA256: `74e0babdb79701590cf19af9a8f409ed0597d35cb398ecaa96cb1adaf4547d7d`

Target shown SHA256: `74e0babdb79701590cf19af9a8f409ed0597d35cb398ecaa96cb1adaf4547d7d`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_fe64609bae7caa081faaaf50124b3467 |
| sourceUnitDigest | 74e0babdb79701590cf19af9a8f409ed0597d35cb398ecaa96cb1adaf4547d7d |
| targetOwner | docs/platform/packaging-distribution/contracts/distribution-pin.md |
| targetAnchor | unheaded-block-19 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-85, under "8. Pin", is retained at docs/platform/packaging-distribution/contracts/distribution-pin.md#unheaded-block-19. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/distribution-pin.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
If the pin exists but its requested release is not present in the release store
root, the workspace is `pinned-not-staged`. `fgctl init` must acquire the
pinned release instead of selecting latest.
```

### Target unit

```text
If the pin exists but its requested release is not present in the release store
root, the workspace is `pinned-not-staged`. `fgctl init` must acquire the
pinned release instead of selecting latest.
```

### Unified diff

```diff
No text difference.
```

## claim_a9d41dca59b552f4bc5f85b11b18a34b

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#9-projectionledger

Target: docs/platform/packaging-distribution/contracts/projection-ledger.md#9-projectionledger

Source identity digest: `514e33c19e1461dae232ceba7e30e01212a76dd1955e433649107329e824cd31`

Target identity digest: `ba4c239d03cb07df326478a7175dc3f6161398499f8666f93c706b0ad7d894cc`

Source shown SHA256: `fb8d16e9607ac477f7206c9211cb5e0dd44e885e57da8df767ddae656dfee538`

Target shown SHA256: `7753415dec5526d274dde055960afb0757627ec57509195607a0b270b4a0513d`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_a9d41dca59b552f4bc5f85b11b18a34b |
| sourceUnitDigest | 514e33c19e1461dae232ceba7e30e01212a76dd1955e433649107329e824cd31 |
| targetOwner | docs/platform/packaging-distribution/contracts/projection-ledger.md |
| targetAnchor | 9-projectionledger |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete heading from docs/architect/packaging-distribution/runtime-identity-and-activation.md#9-projectionledger, under "9. ProjectionLedger", is retained at docs/platform/packaging-distribution/contracts/projection-ledger.md#9-projectionledger. Only heading depth changes; the direct section payload follows the original source order. The named owner is the contracts/projection-ledger.md topic owner; carriage does not certify current implementation. |

### Source unit

````text
## 9. ProjectionLedger

Host-visible projections are not immutable release files. They are generated
workspace material derived from the active runtime.

Examples:

```txt
.agents/skills/*
.claude/skills/*
AGENTS.md managed blocks
other host-specific instruction/prose entry points
```

Projection ledgers are workspace-scoped. They live with the workspace installation
area, not in one shared release-store ledger:

```txt
<workspace-root>/.fgos/installation/projections/ledger.json
```

Each projected path needs an ownership class:

| Ownership | Meaning | Repair Policy |
|---|---|---|
| `projection-owned` | fgOS generated this whole file/path. | May replace if current file matches last materialized digest; otherwise report drift and require explicit repair. |
| `managed-block` | fgOS owns only a marked block inside a user/source file. | May update that block if markers and baseline match. |
| `source-owned` | File is authored by the product/source repo. | Never overwrite automatically. |
| `coexistence-refuse` | Another harness/tool owns or conflicts with the path. | Do not write; report required human decision. |

Projection drift should use a three-way comparison:

```txt
runtime source digest
last materialized digest
current workspace file digest
```

Materialization timing:

```txt
fgctl init
  -> install/activate runtime
  -> invoke active local fgos init

local fgos init
  -> create/update ProjectionLedger
  -> materialize required projections for the current host/workspace

local fgos doctor
  -> report projection drift

local fgos doctor --fix
  -> repair only safe projection-owned or managed-block drift
```

`fgctl` must not write host-visible projection files directly. It may install
and activate the runtime, then invoke local `fgos init` under that active
runtime identity. The local runtime owns projection semantics because
projection paths, host compatibility, and workshop material may vary by fgOS
release.

Minimum projection ledger entry:

```json
{
  "schemaVersion": 1,
  "workspaceId": "wks_...",
  "workStateId": "state_...",
  "path": ".agents/skills/example/SKILL.md",
  "ownership": "projection-owned",
  "source": {
    "artifactDigest": "sha256:...",
    "path": "workshop/skills/example/SKILL.md",
    "digest": "sha256:..."
  },
  "lastMaterializedDigest": "sha256:...",
  "currentDigestAtLastCheck": "sha256:...",
  "policy": {
    "repair": "safe-if-unchanged",
    "packageSurface": "exclude"
  }
}
```

Repair rules:

| Ownership | `init` Behavior | `doctor` Behavior | `doctor --fix` Behavior |
|---|---|---|---|
| `projection-owned` | Create if absent; replace only when current file matches last materialized digest. | Report missing/drift/conflict. | Replace if unchanged from baseline; otherwise refuse and report conflict. |
| `managed-block` | Create/update marked block if markers are healthy. | Report marker drift or block drift. | Replace only managed block when markers/baseline match. |
| `source-owned` | Do not overwrite. | Report if expected projection cannot be materialized because source owns path. | Never overwrite. |
| `coexistence-refuse` | Do not write. | Report external ownership/conflict. | Never overwrite. |

Self-development uses the same ownership classes. The forgent source repo must
not be treated as a nested product install or receive blanket generated-file
overwrites. Any path that is source-authored in the product tree must be marked
`source-owned` or protected by an explicit managed-block/projection policy.
````

### Target unit

````text
#### 9. ProjectionLedger

Host-visible projections are not immutable release files. They are generated
workspace material derived from the active runtime.

Examples:

```txt
.agents/skills/*
.claude/skills/*
AGENTS.md managed blocks
other host-specific instruction/prose entry points
```

Projection ledgers are workspace-scoped. They live with the workspace installation
area, not in one shared release-store ledger:

```txt
<workspace-root>/.fgos/installation/projections/ledger.json
```

Each projected path needs an ownership class:

| Ownership | Meaning | Repair Policy |
|---|---|---|
| `projection-owned` | fgOS generated this whole file/path. | May replace if current file matches last materialized digest; otherwise report drift and require explicit repair. |
| `managed-block` | fgOS owns only a marked block inside a user/source file. | May update that block if markers and baseline match. |
| `source-owned` | File is authored by the product/source repo. | Never overwrite automatically. |
| `coexistence-refuse` | Another harness/tool owns or conflicts with the path. | Do not write; report required human decision. |

Projection drift should use a three-way comparison:

```txt
runtime source digest
last materialized digest
current workspace file digest
```

Materialization timing:

```txt
fgctl init
  -> install/activate runtime
  -> invoke active local fgos init

local fgos init
  -> create/update ProjectionLedger
  -> materialize required projections for the current host/workspace

local fgos doctor
  -> report projection drift

local fgos doctor --fix
  -> repair only safe projection-owned or managed-block drift
```

`fgctl` must not write host-visible projection files directly. It may install
and activate the runtime, then invoke local `fgos init` under that active
runtime identity. The local runtime owns projection semantics because
projection paths, host compatibility, and workshop material may vary by fgOS
release.

Minimum projection ledger entry:

```json
{
  "schemaVersion": 1,
  "workspaceId": "wks_...",
  "workStateId": "state_...",
  "path": ".agents/skills/example/SKILL.md",
  "ownership": "projection-owned",
  "source": {
    "artifactDigest": "sha256:...",
    "path": "workshop/skills/example/SKILL.md",
    "digest": "sha256:..."
  },
  "lastMaterializedDigest": "sha256:...",
  "currentDigestAtLastCheck": "sha256:...",
  "policy": {
    "repair": "safe-if-unchanged",
    "packageSurface": "exclude"
  }
}
```

Repair rules:

| Ownership | `init` Behavior | `doctor` Behavior | `doctor --fix` Behavior |
|---|---|---|---|
| `projection-owned` | Create if absent; replace only when current file matches last materialized digest. | Report missing/drift/conflict. | Replace if unchanged from baseline; otherwise refuse and report conflict. |
| `managed-block` | Create/update marked block if markers are healthy. | Report marker drift or block drift. | Replace only managed block when markers/baseline match. |
| `source-owned` | Do not overwrite. | Report if expected projection cannot be materialized because source owns path. | Never overwrite. |
| `coexistence-refuse` | Do not write. | Report external ownership/conflict. | Never overwrite. |

Self-development uses the same ownership classes. The forgent source repo must
not be treated as a nested product install or receive blanket generated-file
overwrites. Any path that is source-authored in the product tree must be marked
`source-owned` or protected by an explicit managed-block/projection policy.
````

### Unified diff

```diff
--- "docs/architect/packaging-distribution/runtime-identity-and-activation.md#9-projectionledger"
+++ "docs/platform/packaging-distribution/contracts/projection-ledger.md#9-projectionledger"
@@ -1,4 +1,4 @@
-## 9. ProjectionLedger
+#### 9. ProjectionLedger
 
 Host-visible projections are not immutable release files. They are generated
 workspace material derived from the active runtime.
```

## claim_9ee6b8fd89b75b07fe2d38f8221b6fcb

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-86

Target: docs/platform/packaging-distribution/contracts/projection-ledger.md#unheaded-block-15

Source identity digest: `dbc6e52a4956ffbc532c6a5da06043288ab0fe164997b2f60f9adf269ce0810f`

Target identity digest: `dbc6e52a4956ffbc532c6a5da06043288ab0fe164997b2f60f9adf269ce0810f`

Source shown SHA256: `dbc6e52a4956ffbc532c6a5da06043288ab0fe164997b2f60f9adf269ce0810f`

Target shown SHA256: `dbc6e52a4956ffbc532c6a5da06043288ab0fe164997b2f60f9adf269ce0810f`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_9ee6b8fd89b75b07fe2d38f8221b6fcb |
| sourceUnitDigest | dbc6e52a4956ffbc532c6a5da06043288ab0fe164997b2f60f9adf269ce0810f |
| targetOwner | docs/platform/packaging-distribution/contracts/projection-ledger.md |
| targetAnchor | unheaded-block-15 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-86, under "9. ProjectionLedger", is retained at docs/platform/packaging-distribution/contracts/projection-ledger.md#unheaded-block-15. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/projection-ledger.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
Host-visible projections are not immutable release files. They are generated
workspace material derived from the active runtime.
```

### Target unit

```text
Host-visible projections are not immutable release files. They are generated
workspace material derived from the active runtime.
```

### Unified diff

```diff
No text difference.
```

## claim_6924b8ba3475c1cbddca353b6e956109

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-87

Target: docs/platform/packaging-distribution/contracts/projection-ledger.md#unheaded-block-16

Source identity digest: `0074c2f7d72faa948dd8d627f0490e151a2876545a387d53ecf7a754c45b9cf9`

Target identity digest: `0074c2f7d72faa948dd8d627f0490e151a2876545a387d53ecf7a754c45b9cf9`

Source shown SHA256: `0074c2f7d72faa948dd8d627f0490e151a2876545a387d53ecf7a754c45b9cf9`

Target shown SHA256: `0074c2f7d72faa948dd8d627f0490e151a2876545a387d53ecf7a754c45b9cf9`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_6924b8ba3475c1cbddca353b6e956109 |
| sourceUnitDigest | 0074c2f7d72faa948dd8d627f0490e151a2876545a387d53ecf7a754c45b9cf9 |
| targetOwner | docs/platform/packaging-distribution/contracts/projection-ledger.md |
| targetAnchor | unheaded-block-16 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-87, under "9. ProjectionLedger", is retained at docs/platform/packaging-distribution/contracts/projection-ledger.md#unheaded-block-16. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/projection-ledger.md topic owner; carriage does not certify current implementation. |

### Source unit

````text
Examples:

```txt
.agents/skills/*
.claude/skills/*
AGENTS.md managed blocks
other host-specific instruction/prose entry points
```
````

### Target unit

````text
Examples:

```txt
.agents/skills/*
.claude/skills/*
AGENTS.md managed blocks
other host-specific instruction/prose entry points
```
````

### Unified diff

```diff
No text difference.
```

## claim_83056288e77252541c6691aa5cc02180

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-88

Target: docs/platform/packaging-distribution/contracts/projection-ledger.md#unheaded-block-17

Source identity digest: `bd3972f7ad72224df37c958e55e6b561d29728fe2bf8850c99ba1dfef36213db`

Target identity digest: `bd3972f7ad72224df37c958e55e6b561d29728fe2bf8850c99ba1dfef36213db`

Source shown SHA256: `bd3972f7ad72224df37c958e55e6b561d29728fe2bf8850c99ba1dfef36213db`

Target shown SHA256: `bd3972f7ad72224df37c958e55e6b561d29728fe2bf8850c99ba1dfef36213db`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_83056288e77252541c6691aa5cc02180 |
| sourceUnitDigest | bd3972f7ad72224df37c958e55e6b561d29728fe2bf8850c99ba1dfef36213db |
| targetOwner | docs/platform/packaging-distribution/contracts/projection-ledger.md |
| targetAnchor | unheaded-block-17 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-88, under "9. ProjectionLedger", is retained at docs/platform/packaging-distribution/contracts/projection-ledger.md#unheaded-block-17. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/projection-ledger.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
Projection ledgers are workspace-scoped. They live with the workspace installation
area, not in one shared release-store ledger:
```

### Target unit

```text
Projection ledgers are workspace-scoped. They live with the workspace installation
area, not in one shared release-store ledger:
```

### Unified diff

```diff
No text difference.
```

## claim_68cb4be049108f3fa0787389fcad5d70

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-89

Target: docs/platform/packaging-distribution/contracts/projection-ledger.md#unheaded-block-18

Source identity digest: `48ec93fc0ee5d69e81cc388ca04e23407d647705e18faa21852476d1c4add34d`

Target identity digest: `48ec93fc0ee5d69e81cc388ca04e23407d647705e18faa21852476d1c4add34d`

Source shown SHA256: `48ec93fc0ee5d69e81cc388ca04e23407d647705e18faa21852476d1c4add34d`

Target shown SHA256: `48ec93fc0ee5d69e81cc388ca04e23407d647705e18faa21852476d1c4add34d`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_68cb4be049108f3fa0787389fcad5d70 |
| sourceUnitDigest | 48ec93fc0ee5d69e81cc388ca04e23407d647705e18faa21852476d1c4add34d |
| targetOwner | docs/platform/packaging-distribution/contracts/projection-ledger.md |
| targetAnchor | unheaded-block-18 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-89, under "9. ProjectionLedger", is retained at docs/platform/packaging-distribution/contracts/projection-ledger.md#unheaded-block-18. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/projection-ledger.md topic owner; carriage does not certify current implementation. |

### Source unit

````text
```txt
<workspace-root>/.fgos/installation/projections/ledger.json
```
````

### Target unit

````text
```txt
<workspace-root>/.fgos/installation/projections/ledger.json
```
````

### Unified diff

```diff
No text difference.
```

## claim_9828d5c2a7dc5da98fffde8f3709234a

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-90

Target: docs/platform/packaging-distribution/contracts/projection-ledger.md#unheaded-block-19

Source identity digest: `46a1d10e0b7d35041c5505d91bc659d4c9e7e8b77f1f5d4b0d0777a02a930f3c`

Target identity digest: `46a1d10e0b7d35041c5505d91bc659d4c9e7e8b77f1f5d4b0d0777a02a930f3c`

Source shown SHA256: `46a1d10e0b7d35041c5505d91bc659d4c9e7e8b77f1f5d4b0d0777a02a930f3c`

Target shown SHA256: `46a1d10e0b7d35041c5505d91bc659d4c9e7e8b77f1f5d4b0d0777a02a930f3c`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_9828d5c2a7dc5da98fffde8f3709234a |
| sourceUnitDigest | 46a1d10e0b7d35041c5505d91bc659d4c9e7e8b77f1f5d4b0d0777a02a930f3c |
| targetOwner | docs/platform/packaging-distribution/contracts/projection-ledger.md |
| targetAnchor | unheaded-block-19 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-90, under "9. ProjectionLedger", is retained at docs/platform/packaging-distribution/contracts/projection-ledger.md#unheaded-block-19. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/projection-ledger.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
Each projected path needs an ownership class:
```

### Target unit

```text
Each projected path needs an ownership class:
```

### Unified diff

```diff
No text difference.
```

## claim_c255b948236f12ef2e1822baee4aeffe

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-91

Target: docs/platform/packaging-distribution/contracts/projection-ledger.md#unheaded-block-20

Source identity digest: `519915c1bae4fc22633b628bac6c16cba24d0e04e71abf909bed8fa01b5ed7a9`

Target identity digest: `519915c1bae4fc22633b628bac6c16cba24d0e04e71abf909bed8fa01b5ed7a9`

Source shown SHA256: `519915c1bae4fc22633b628bac6c16cba24d0e04e71abf909bed8fa01b5ed7a9`

Target shown SHA256: `519915c1bae4fc22633b628bac6c16cba24d0e04e71abf909bed8fa01b5ed7a9`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_c255b948236f12ef2e1822baee4aeffe |
| sourceUnitDigest | 519915c1bae4fc22633b628bac6c16cba24d0e04e71abf909bed8fa01b5ed7a9 |
| targetOwner | docs/platform/packaging-distribution/contracts/projection-ledger.md |
| targetAnchor | unheaded-block-20 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-91, under "9. ProjectionLedger", is retained at docs/platform/packaging-distribution/contracts/projection-ledger.md#unheaded-block-20. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/projection-ledger.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
| Ownership | Meaning | Repair Policy |
|---|---|---|
| `projection-owned` | fgOS generated this whole file/path. | May replace if current file matches last materialized digest; otherwise report drift and require explicit repair. |
| `managed-block` | fgOS owns only a marked block inside a user/source file. | May update that block if markers and baseline match. |
| `source-owned` | File is authored by the product/source repo. | Never overwrite automatically. |
| `coexistence-refuse` | Another harness/tool owns or conflicts with the path. | Do not write; report required human decision. |
```

### Target unit

```text
| Ownership | Meaning | Repair Policy |
|---|---|---|
| `projection-owned` | fgOS generated this whole file/path. | May replace if current file matches last materialized digest; otherwise report drift and require explicit repair. |
| `managed-block` | fgOS owns only a marked block inside a user/source file. | May update that block if markers and baseline match. |
| `source-owned` | File is authored by the product/source repo. | Never overwrite automatically. |
| `coexistence-refuse` | Another harness/tool owns or conflicts with the path. | Do not write; report required human decision. |
```

### Unified diff

```diff
No text difference.
```

## claim_9645945ba0efdae80d19b702eae7e664

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-92

Target: docs/platform/packaging-distribution/contracts/projection-ledger.md#unheaded-block-21

Source identity digest: `13bcabf9e4534aa082c1a6b04c297045398db8c14cfef4c66327aa69802b7353`

Target identity digest: `13bcabf9e4534aa082c1a6b04c297045398db8c14cfef4c66327aa69802b7353`

Source shown SHA256: `13bcabf9e4534aa082c1a6b04c297045398db8c14cfef4c66327aa69802b7353`

Target shown SHA256: `13bcabf9e4534aa082c1a6b04c297045398db8c14cfef4c66327aa69802b7353`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_9645945ba0efdae80d19b702eae7e664 |
| sourceUnitDigest | 13bcabf9e4534aa082c1a6b04c297045398db8c14cfef4c66327aa69802b7353 |
| targetOwner | docs/platform/packaging-distribution/contracts/projection-ledger.md |
| targetAnchor | unheaded-block-21 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-92, under "9. ProjectionLedger", is retained at docs/platform/packaging-distribution/contracts/projection-ledger.md#unheaded-block-21. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/projection-ledger.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
Projection drift should use a three-way comparison:
```

### Target unit

```text
Projection drift should use a three-way comparison:
```

### Unified diff

```diff
No text difference.
```

## claim_bc5aa4f672c86bdabd7b9c71ecb07d5e

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-93

Target: docs/platform/packaging-distribution/contracts/projection-ledger.md#unheaded-block-22

Source identity digest: `07ef0f67819814204f7fc46af4a484d5175c1b884c8e21c9d831c5ddd983a27d`

Target identity digest: `07ef0f67819814204f7fc46af4a484d5175c1b884c8e21c9d831c5ddd983a27d`

Source shown SHA256: `07ef0f67819814204f7fc46af4a484d5175c1b884c8e21c9d831c5ddd983a27d`

Target shown SHA256: `07ef0f67819814204f7fc46af4a484d5175c1b884c8e21c9d831c5ddd983a27d`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_bc5aa4f672c86bdabd7b9c71ecb07d5e |
| sourceUnitDigest | 07ef0f67819814204f7fc46af4a484d5175c1b884c8e21c9d831c5ddd983a27d |
| targetOwner | docs/platform/packaging-distribution/contracts/projection-ledger.md |
| targetAnchor | unheaded-block-22 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-93, under "9. ProjectionLedger", is retained at docs/platform/packaging-distribution/contracts/projection-ledger.md#unheaded-block-22. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/projection-ledger.md topic owner; carriage does not certify current implementation. |

### Source unit

````text
```txt
runtime source digest
last materialized digest
current workspace file digest
```
````

### Target unit

````text
```txt
runtime source digest
last materialized digest
current workspace file digest
```
````

### Unified diff

```diff
No text difference.
```

## claim_c9b0a6af3e0c8e794470d4f769ee8237

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-94

Target: docs/platform/packaging-distribution/contracts/projection-ledger.md#unheaded-block-23

Source identity digest: `4a035b8070c692af62bc47f64e798b77cd53fcc04f5980bd8750bd2331cc2015`

Target identity digest: `4a035b8070c692af62bc47f64e798b77cd53fcc04f5980bd8750bd2331cc2015`

Source shown SHA256: `4a035b8070c692af62bc47f64e798b77cd53fcc04f5980bd8750bd2331cc2015`

Target shown SHA256: `4a035b8070c692af62bc47f64e798b77cd53fcc04f5980bd8750bd2331cc2015`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_c9b0a6af3e0c8e794470d4f769ee8237 |
| sourceUnitDigest | 4a035b8070c692af62bc47f64e798b77cd53fcc04f5980bd8750bd2331cc2015 |
| targetOwner | docs/platform/packaging-distribution/contracts/projection-ledger.md |
| targetAnchor | unheaded-block-23 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-94, under "9. ProjectionLedger", is retained at docs/platform/packaging-distribution/contracts/projection-ledger.md#unheaded-block-23. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/projection-ledger.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
Materialization timing:
```

### Target unit

```text
Materialization timing:
```

### Unified diff

```diff
No text difference.
```

## claim_f0fad11fa4e6246168b9b1eaf533dc47

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-95

Target: docs/platform/packaging-distribution/contracts/projection-ledger.md#unheaded-block-24

Source identity digest: `df6d248c259a8e79aa2c497c59529be018791b59f89911dea72636c8e2f500b4`

Target identity digest: `df6d248c259a8e79aa2c497c59529be018791b59f89911dea72636c8e2f500b4`

Source shown SHA256: `df6d248c259a8e79aa2c497c59529be018791b59f89911dea72636c8e2f500b4`

Target shown SHA256: `df6d248c259a8e79aa2c497c59529be018791b59f89911dea72636c8e2f500b4`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_f0fad11fa4e6246168b9b1eaf533dc47 |
| sourceUnitDigest | df6d248c259a8e79aa2c497c59529be018791b59f89911dea72636c8e2f500b4 |
| targetOwner | docs/platform/packaging-distribution/contracts/projection-ledger.md |
| targetAnchor | unheaded-block-24 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-95, under "9. ProjectionLedger", is retained at docs/platform/packaging-distribution/contracts/projection-ledger.md#unheaded-block-24. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/projection-ledger.md topic owner; carriage does not certify current implementation. |

### Source unit

````text
```txt
fgctl init
  -> install/activate runtime
  -> invoke active local fgos init

local fgos init
  -> create/update ProjectionLedger
  -> materialize required projections for the current host/workspace

local fgos doctor
  -> report projection drift

local fgos doctor --fix
  -> repair only safe projection-owned or managed-block drift
```
````

### Target unit

````text
```txt
fgctl init
  -> install/activate runtime
  -> invoke active local fgos init

local fgos init
  -> create/update ProjectionLedger
  -> materialize required projections for the current host/workspace

local fgos doctor
  -> report projection drift

local fgos doctor --fix
  -> repair only safe projection-owned or managed-block drift
```
````

### Unified diff

```diff
No text difference.
```

## claim_7a855153147bff66d84b5c0867a0a0ec

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-96

Target: docs/platform/packaging-distribution/contracts/projection-ledger.md#unheaded-block-25

Source identity digest: `b49c3a0f9af1ea4dbb2327f01207b652a8b770faba4cb5a9c22db389f95377b1`

Target identity digest: `b49c3a0f9af1ea4dbb2327f01207b652a8b770faba4cb5a9c22db389f95377b1`

Source shown SHA256: `b49c3a0f9af1ea4dbb2327f01207b652a8b770faba4cb5a9c22db389f95377b1`

Target shown SHA256: `b49c3a0f9af1ea4dbb2327f01207b652a8b770faba4cb5a9c22db389f95377b1`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_7a855153147bff66d84b5c0867a0a0ec |
| sourceUnitDigest | b49c3a0f9af1ea4dbb2327f01207b652a8b770faba4cb5a9c22db389f95377b1 |
| targetOwner | docs/platform/packaging-distribution/contracts/projection-ledger.md |
| targetAnchor | unheaded-block-25 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-96, under "9. ProjectionLedger", is retained at docs/platform/packaging-distribution/contracts/projection-ledger.md#unheaded-block-25. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/projection-ledger.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
`fgctl` must not write host-visible projection files directly. It may install
and activate the runtime, then invoke local `fgos init` under that active
runtime identity. The local runtime owns projection semantics because
projection paths, host compatibility, and workshop material may vary by fgOS
release.
```

### Target unit

```text
`fgctl` must not write host-visible projection files directly. It may install
and activate the runtime, then invoke local `fgos init` under that active
runtime identity. The local runtime owns projection semantics because
projection paths, host compatibility, and workshop material may vary by fgOS
release.
```

### Unified diff

```diff
No text difference.
```

## claim_f3266d83b74f1e5c4424ded4f2035d62

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-97

Target: docs/platform/packaging-distribution/contracts/projection-ledger.md#unheaded-block-26

Source identity digest: `b734501cca54cd7c705bd73ea747d303162bbd931785a39f2ee733589e1eec8b`

Target identity digest: `b734501cca54cd7c705bd73ea747d303162bbd931785a39f2ee733589e1eec8b`

Source shown SHA256: `b734501cca54cd7c705bd73ea747d303162bbd931785a39f2ee733589e1eec8b`

Target shown SHA256: `b734501cca54cd7c705bd73ea747d303162bbd931785a39f2ee733589e1eec8b`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_f3266d83b74f1e5c4424ded4f2035d62 |
| sourceUnitDigest | b734501cca54cd7c705bd73ea747d303162bbd931785a39f2ee733589e1eec8b |
| targetOwner | docs/platform/packaging-distribution/contracts/projection-ledger.md |
| targetAnchor | unheaded-block-26 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-97, under "9. ProjectionLedger", is retained at docs/platform/packaging-distribution/contracts/projection-ledger.md#unheaded-block-26. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/projection-ledger.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
Minimum projection ledger entry:
```

### Target unit

```text
Minimum projection ledger entry:
```

### Unified diff

```diff
No text difference.
```

## claim_aa041e3cbcf57f2fc4953023e15560e9

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-98

Target: docs/platform/packaging-distribution/contracts/projection-ledger.md#unheaded-block-27

Source identity digest: `447cd8e77af79e7fb66def9e53eff5859c0c85f37d899a74329e769b094943bc`

Target identity digest: `447cd8e77af79e7fb66def9e53eff5859c0c85f37d899a74329e769b094943bc`

Source shown SHA256: `447cd8e77af79e7fb66def9e53eff5859c0c85f37d899a74329e769b094943bc`

Target shown SHA256: `447cd8e77af79e7fb66def9e53eff5859c0c85f37d899a74329e769b094943bc`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_aa041e3cbcf57f2fc4953023e15560e9 |
| sourceUnitDigest | 447cd8e77af79e7fb66def9e53eff5859c0c85f37d899a74329e769b094943bc |
| targetOwner | docs/platform/packaging-distribution/contracts/projection-ledger.md |
| targetAnchor | unheaded-block-27 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-98, under "9. ProjectionLedger", is retained at docs/platform/packaging-distribution/contracts/projection-ledger.md#unheaded-block-27. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/projection-ledger.md topic owner; carriage does not certify current implementation. |

### Source unit

````text
```json
{
  "schemaVersion": 1,
  "workspaceId": "wks_...",
  "workStateId": "state_...",
  "path": ".agents/skills/example/SKILL.md",
  "ownership": "projection-owned",
  "source": {
    "artifactDigest": "sha256:...",
    "path": "workshop/skills/example/SKILL.md",
    "digest": "sha256:..."
  },
  "lastMaterializedDigest": "sha256:...",
  "currentDigestAtLastCheck": "sha256:...",
  "policy": {
    "repair": "safe-if-unchanged",
    "packageSurface": "exclude"
  }
}
```
````

### Target unit

````text
```json
{
  "schemaVersion": 1,
  "workspaceId": "wks_...",
  "workStateId": "state_...",
  "path": ".agents/skills/example/SKILL.md",
  "ownership": "projection-owned",
  "source": {
    "artifactDigest": "sha256:...",
    "path": "workshop/skills/example/SKILL.md",
    "digest": "sha256:..."
  },
  "lastMaterializedDigest": "sha256:...",
  "currentDigestAtLastCheck": "sha256:...",
  "policy": {
    "repair": "safe-if-unchanged",
    "packageSurface": "exclude"
  }
}
```
````

### Unified diff

```diff
No text difference.
```

## claim_6f9551b510fce99e4d9c0be74cea033e

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-99

Target: docs/platform/packaging-distribution/contracts/projection-ledger.md#unheaded-block-28

Source identity digest: `70608a27f2f6b37f1fea97fb185adef5913ec07ad6457eac3ed28f86b64d97be`

Target identity digest: `70608a27f2f6b37f1fea97fb185adef5913ec07ad6457eac3ed28f86b64d97be`

Source shown SHA256: `70608a27f2f6b37f1fea97fb185adef5913ec07ad6457eac3ed28f86b64d97be`

Target shown SHA256: `70608a27f2f6b37f1fea97fb185adef5913ec07ad6457eac3ed28f86b64d97be`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_6f9551b510fce99e4d9c0be74cea033e |
| sourceUnitDigest | 70608a27f2f6b37f1fea97fb185adef5913ec07ad6457eac3ed28f86b64d97be |
| targetOwner | docs/platform/packaging-distribution/contracts/projection-ledger.md |
| targetAnchor | unheaded-block-28 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-99, under "9. ProjectionLedger", is retained at docs/platform/packaging-distribution/contracts/projection-ledger.md#unheaded-block-28. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/projection-ledger.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
Repair rules:

| Ownership | `init` Behavior | `doctor` Behavior | `doctor --fix` Behavior |
|---|---|---|---|
| `projection-owned` | Create if absent; replace only when current file matches last materialized digest. | Report missing/drift/conflict. | Replace if unchanged from baseline; otherwise refuse and report conflict. |
| `managed-block` | Create/update marked block if markers are healthy. | Report marker drift or block drift. | Replace only managed block when markers/baseline match. |
| `source-owned` | Do not overwrite. | Report if expected projection cannot be materialized because source owns path. | Never overwrite. |
| `coexistence-refuse` | Do not write. | Report external ownership/conflict. | Never overwrite. |
```

### Target unit

```text
Repair rules:

| Ownership | `init` Behavior | `doctor` Behavior | `doctor --fix` Behavior |
|---|---|---|---|
| `projection-owned` | Create if absent; replace only when current file matches last materialized digest. | Report missing/drift/conflict. | Replace if unchanged from baseline; otherwise refuse and report conflict. |
| `managed-block` | Create/update marked block if markers are healthy. | Report marker drift or block drift. | Replace only managed block when markers/baseline match. |
| `source-owned` | Do not overwrite. | Report if expected projection cannot be materialized because source owns path. | Never overwrite. |
| `coexistence-refuse` | Do not write. | Report external ownership/conflict. | Never overwrite. |
```

### Unified diff

```diff
No text difference.
```

## claim_c0012a8de299b47450ea5d16a61dda21

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-100

Target: docs/platform/packaging-distribution/contracts/projection-ledger.md#unheaded-block-29

Source identity digest: `ff111686b8319e43789ab1a3ac994d1c4657082c6f36d55c469cd837e8f2f6a8`

Target identity digest: `ff111686b8319e43789ab1a3ac994d1c4657082c6f36d55c469cd837e8f2f6a8`

Source shown SHA256: `ff111686b8319e43789ab1a3ac994d1c4657082c6f36d55c469cd837e8f2f6a8`

Target shown SHA256: `ff111686b8319e43789ab1a3ac994d1c4657082c6f36d55c469cd837e8f2f6a8`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_c0012a8de299b47450ea5d16a61dda21 |
| sourceUnitDigest | ff111686b8319e43789ab1a3ac994d1c4657082c6f36d55c469cd837e8f2f6a8 |
| targetOwner | docs/platform/packaging-distribution/contracts/projection-ledger.md |
| targetAnchor | unheaded-block-29 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-100, under "9. ProjectionLedger", is retained at docs/platform/packaging-distribution/contracts/projection-ledger.md#unheaded-block-29. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/projection-ledger.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
Self-development uses the same ownership classes. The forgent source repo must
not be treated as a nested product install or receive blanket generated-file
overwrites. Any path that is source-authored in the product tree must be marked
`source-owned` or protected by an explicit managed-block/projection policy.
```

### Target unit

```text
Self-development uses the same ownership classes. The forgent source repo must
not be treated as a nested product install or receive blanket generated-file
overwrites. Any path that is source-authored in the product tree must be marked
`source-owned` or protected by an explicit managed-block/projection policy.
```

### Unified diff

```diff
No text difference.
```

## claim_d42eb384f05d935d19cf9891bb5c5df9

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#10-migrationjournal

Target: docs/platform/packaging-distribution/contracts/activation-binding.md#10-migrationjournal

Source identity digest: `0ff84bbd74e6a3abe8de2c145a229b7d721d29679e206e46f48a1ee7b2fba9bb`

Target identity digest: `911c580691fc66e1f9485c40795ff51655e76d27689a05f11f7b50899a18f46a`

Source shown SHA256: `106709ad95c08c37681061d23bcc907949662606ac4253d17711285b66ba9561`

Target shown SHA256: `3831006d88552c5a8243104ef3d99efad909e708818dd6cbb335396b514b2e8c`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_d42eb384f05d935d19cf9891bb5c5df9 |
| sourceUnitDigest | 0ff84bbd74e6a3abe8de2c145a229b7d721d29679e206e46f48a1ee7b2fba9bb |
| targetOwner | docs/platform/packaging-distribution/contracts/activation-binding.md |
| targetAnchor | 10-migrationjournal |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete heading from docs/architect/packaging-distribution/runtime-identity-and-activation.md#10-migrationjournal, under "10. MigrationJournal", is retained at docs/platform/packaging-distribution/contracts/activation-binding.md#10-migrationjournal. Only heading depth changes; the direct section payload follows the original source order. The named owner is the contracts/activation-binding.md topic owner; carriage does not certify current implementation. |

### Source unit

````text
## 10. MigrationJournal

Runtime rollback is not automatically state rollback.

The migration journal records state-schema changes made by local `fgos`:

```json
{
  "schemaVersion": 1,
  "migrationId": "mig_...",
  "fromStateSchema": "1",
  "toStateSchema": "2",
  "runtimeArtifactDigest": "sha256:...",
  "startedAt": "...",
  "finishedAt": "...",
  "checkpoint": "...",
  "reversible": false
}
```

Downgrade safety must consider state-schema readability/writability, not only
version order.

Rule:

```txt
fgctl may activate an older runtime only if that runtime declares it can read
the current state schema and the requested operation does not require writes
the runtime cannot perform.
```

V1 does not perform automatic state migration during `fgctl upgrade` or
rollback. If the target runtime cannot read the current project state schema,
activation must fail with `state-schema-incompatible`. If the target runtime
can read but cannot write the current schema, activation may be allowed only
for read-only diagnostic use; mutating local `fgos` commands must refuse with
`state-schema-write-incompatible`.

The current project state schema must be recorded outside the immutable
runtime payload, for example:

```txt
<workHistoryRoot(workStateId)>/schema.json
```

Possible shape:

```json
{
  "schemaVersion": 1,
  "workStateId": "state_...",
  "currentStateSchema": "1",
  "lastWriterArtifactDigest": "sha256:..."
}
```

Compatibility checks:

```txt
fgctl activate/upgrade/rollback
  -> read target ReleaseManifest.stateSchemas.read
  -> read project currentStateSchema
  -> refuse activation unless target can read currentStateSchema

local mutating fgos command
  -> lease active artifact digest
  -> read active ReleaseManifest.stateSchemas.write
  -> read work-state currentStateSchema
  -> verify workStateId matches the resolved work-state root
  -> refuse mutation unless active runtime can write currentStateSchema
```

If two workspaces with different active artifact digests share one
`workStateId`, both may write only if both active release manifests declare
compatible write support for the current work-state schema and coordination
locks/claims permit the operation. Otherwise the runtime must refuse mutation
instead of relying on branch-local activation alone.

Migration remains explicit future work. When introduced, each migration must be
declared by the release manifest and recorded in `MigrationJournal` with
checkpoint/reversibility facts.
````

### Target unit

````text
#### 10. MigrationJournal

Runtime rollback is not automatically state rollback.

The migration journal records state-schema changes made by local `fgos`:

```json
{
  "schemaVersion": 1,
  "migrationId": "mig_...",
  "fromStateSchema": "1",
  "toStateSchema": "2",
  "runtimeArtifactDigest": "sha256:...",
  "startedAt": "...",
  "finishedAt": "...",
  "checkpoint": "...",
  "reversible": false
}
```

Downgrade safety must consider state-schema readability/writability, not only
version order.

Rule:

```txt
fgctl may activate an older runtime only if that runtime declares it can read
the current state schema and the requested operation does not require writes
the runtime cannot perform.
```

V1 does not perform automatic state migration during `fgctl upgrade` or
rollback. If the target runtime cannot read the current project state schema,
activation must fail with `state-schema-incompatible`. If the target runtime
can read but cannot write the current schema, activation may be allowed only
for read-only diagnostic use; mutating local `fgos` commands must refuse with
`state-schema-write-incompatible`.

The current project state schema must be recorded outside the immutable
runtime payload, for example:

```txt
<workHistoryRoot(workStateId)>/schema.json
```

Possible shape:

```json
{
  "schemaVersion": 1,
  "workStateId": "state_...",
  "currentStateSchema": "1",
  "lastWriterArtifactDigest": "sha256:..."
}
```

Compatibility checks:

```txt
fgctl activate/upgrade/rollback
  -> read target ReleaseManifest.stateSchemas.read
  -> read project currentStateSchema
  -> refuse activation unless target can read currentStateSchema

local mutating fgos command
  -> lease active artifact digest
  -> read active ReleaseManifest.stateSchemas.write
  -> read work-state currentStateSchema
  -> verify workStateId matches the resolved work-state root
  -> refuse mutation unless active runtime can write currentStateSchema
```

If two workspaces with different active artifact digests share one
`workStateId`, both may write only if both active release manifests declare
compatible write support for the current work-state schema and coordination
locks/claims permit the operation. Otherwise the runtime must refuse mutation
instead of relying on branch-local activation alone.

Migration remains explicit future work. When introduced, each migration must be
declared by the release manifest and recorded in `MigrationJournal` with
checkpoint/reversibility facts.
````

### Unified diff

```diff
--- "docs/architect/packaging-distribution/runtime-identity-and-activation.md#10-migrationjournal"
+++ "docs/platform/packaging-distribution/contracts/activation-binding.md#10-migrationjournal"
@@ -1,4 +1,4 @@
-## 10. MigrationJournal
+#### 10. MigrationJournal
 
 Runtime rollback is not automatically state rollback.
```

## claim_bee69c9fafc3e15fc38dd82f1b54acc9

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-101

Target: docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-40

Source identity digest: `ac51cf26ef4e4e0468e570f319c083e5225c25835f20c164d4a047cd888458c1`

Target identity digest: `ac51cf26ef4e4e0468e570f319c083e5225c25835f20c164d4a047cd888458c1`

Source shown SHA256: `ac51cf26ef4e4e0468e570f319c083e5225c25835f20c164d4a047cd888458c1`

Target shown SHA256: `ac51cf26ef4e4e0468e570f319c083e5225c25835f20c164d4a047cd888458c1`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_bee69c9fafc3e15fc38dd82f1b54acc9 |
| sourceUnitDigest | ac51cf26ef4e4e0468e570f319c083e5225c25835f20c164d4a047cd888458c1 |
| targetOwner | docs/platform/packaging-distribution/contracts/activation-binding.md |
| targetAnchor | unheaded-block-40 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-101, under "10. MigrationJournal", is retained at docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-40. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/activation-binding.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
Runtime rollback is not automatically state rollback.
```

### Target unit

```text
Runtime rollback is not automatically state rollback.
```

### Unified diff

```diff
No text difference.
```

## claim_4a2a23337b8495f1940fd9e3226e9d31

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-102

Target: docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-41

Source identity digest: `da01d2fc952c416ba16325b6f4493f5602a85e68e6445890d86a661ddb563d60`

Target identity digest: `da01d2fc952c416ba16325b6f4493f5602a85e68e6445890d86a661ddb563d60`

Source shown SHA256: `da01d2fc952c416ba16325b6f4493f5602a85e68e6445890d86a661ddb563d60`

Target shown SHA256: `da01d2fc952c416ba16325b6f4493f5602a85e68e6445890d86a661ddb563d60`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_4a2a23337b8495f1940fd9e3226e9d31 |
| sourceUnitDigest | da01d2fc952c416ba16325b6f4493f5602a85e68e6445890d86a661ddb563d60 |
| targetOwner | docs/platform/packaging-distribution/contracts/activation-binding.md |
| targetAnchor | unheaded-block-41 |
| claimKind | contract |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-102, under "10. MigrationJournal", is retained at docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-41. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/activation-binding.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
The migration journal records state-schema changes made by local `fgos`:
```

### Target unit

```text
The migration journal records state-schema changes made by local `fgos`:
```

### Unified diff

```diff
No text difference.
```

## claim_181a82457153d16a123d8c3378c30c98

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-103

Target: docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-42

Source identity digest: `9a365e9b5b43ce380e4ccc724d86d039e5020c11b3875ec94a3e3547cfbbc663`

Target identity digest: `9a365e9b5b43ce380e4ccc724d86d039e5020c11b3875ec94a3e3547cfbbc663`

Source shown SHA256: `9a365e9b5b43ce380e4ccc724d86d039e5020c11b3875ec94a3e3547cfbbc663`

Target shown SHA256: `9a365e9b5b43ce380e4ccc724d86d039e5020c11b3875ec94a3e3547cfbbc663`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_181a82457153d16a123d8c3378c30c98 |
| sourceUnitDigest | 9a365e9b5b43ce380e4ccc724d86d039e5020c11b3875ec94a3e3547cfbbc663 |
| targetOwner | docs/platform/packaging-distribution/contracts/activation-binding.md |
| targetAnchor | unheaded-block-42 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-103, under "10. MigrationJournal", is retained at docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-42. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/activation-binding.md topic owner; carriage does not certify current implementation. |

### Source unit

````text
```json
{
  "schemaVersion": 1,
  "migrationId": "mig_...",
  "fromStateSchema": "1",
  "toStateSchema": "2",
  "runtimeArtifactDigest": "sha256:...",
  "startedAt": "...",
  "finishedAt": "...",
  "checkpoint": "...",
  "reversible": false
}
```
````

### Target unit

````text
```json
{
  "schemaVersion": 1,
  "migrationId": "mig_...",
  "fromStateSchema": "1",
  "toStateSchema": "2",
  "runtimeArtifactDigest": "sha256:...",
  "startedAt": "...",
  "finishedAt": "...",
  "checkpoint": "...",
  "reversible": false
}
```
````

### Unified diff

```diff
No text difference.
```

## claim_c6869299794e7b0b8faebb525521af54

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-104

Target: docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-43

Source identity digest: `3608b979a603b21c6131d86953fbe07fd47dceb6f9e477d6dbf66064b3d5f4de`

Target identity digest: `3608b979a603b21c6131d86953fbe07fd47dceb6f9e477d6dbf66064b3d5f4de`

Source shown SHA256: `3608b979a603b21c6131d86953fbe07fd47dceb6f9e477d6dbf66064b3d5f4de`

Target shown SHA256: `3608b979a603b21c6131d86953fbe07fd47dceb6f9e477d6dbf66064b3d5f4de`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_c6869299794e7b0b8faebb525521af54 |
| sourceUnitDigest | 3608b979a603b21c6131d86953fbe07fd47dceb6f9e477d6dbf66064b3d5f4de |
| targetOwner | docs/platform/packaging-distribution/contracts/activation-binding.md |
| targetAnchor | unheaded-block-43 |
| claimKind | contract |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-104, under "10. MigrationJournal", is retained at docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-43. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/activation-binding.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
Downgrade safety must consider state-schema readability/writability, not only
version order.
```

### Target unit

```text
Downgrade safety must consider state-schema readability/writability, not only
version order.
```

### Unified diff

```diff
No text difference.
```

## claim_bbe6d0ce5f2af5471b4b0f830209f3c6

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-105

Target: docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-44

Source identity digest: `60ba86001f48ba64132862a134ed1e7ede5c4233b11ea818bda2593400a6ee85`

Target identity digest: `60ba86001f48ba64132862a134ed1e7ede5c4233b11ea818bda2593400a6ee85`

Source shown SHA256: `60ba86001f48ba64132862a134ed1e7ede5c4233b11ea818bda2593400a6ee85`

Target shown SHA256: `60ba86001f48ba64132862a134ed1e7ede5c4233b11ea818bda2593400a6ee85`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_bbe6d0ce5f2af5471b4b0f830209f3c6 |
| sourceUnitDigest | 60ba86001f48ba64132862a134ed1e7ede5c4233b11ea818bda2593400a6ee85 |
| targetOwner | docs/platform/packaging-distribution/contracts/activation-binding.md |
| targetAnchor | unheaded-block-44 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-105, under "10. MigrationJournal", is retained at docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-44. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/activation-binding.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
Rule:
```

### Target unit

```text
Rule:
```

### Unified diff

```diff
No text difference.
```

## claim_573f1ab0c14672c3e3d1893b96f5e6ef

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-106

Target: docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-45

Source identity digest: `1fa15164579b61c19fd19c467f533973c1577e9a1c708158799e0c8994f50419`

Target identity digest: `1fa15164579b61c19fd19c467f533973c1577e9a1c708158799e0c8994f50419`

Source shown SHA256: `1fa15164579b61c19fd19c467f533973c1577e9a1c708158799e0c8994f50419`

Target shown SHA256: `1fa15164579b61c19fd19c467f533973c1577e9a1c708158799e0c8994f50419`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_573f1ab0c14672c3e3d1893b96f5e6ef |
| sourceUnitDigest | 1fa15164579b61c19fd19c467f533973c1577e9a1c708158799e0c8994f50419 |
| targetOwner | docs/platform/packaging-distribution/contracts/activation-binding.md |
| targetAnchor | unheaded-block-45 |
| claimKind | contract |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-106, under "10. MigrationJournal", is retained at docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-45. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/activation-binding.md topic owner; carriage does not certify current implementation. |

### Source unit

````text
```txt
fgctl may activate an older runtime only if that runtime declares it can read
the current state schema and the requested operation does not require writes
the runtime cannot perform.
```
````

### Target unit

````text
```txt
fgctl may activate an older runtime only if that runtime declares it can read
the current state schema and the requested operation does not require writes
the runtime cannot perform.
```
````

### Unified diff

```diff
No text difference.
```

## claim_491998778e598a5385e78b541e33bff8

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-107

Target: docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-46

Source identity digest: `498ce4bd1a2493ee1261ae7e8632c54b2c6abfcb4fff8fbb7554cd93809c17e8`

Target identity digest: `498ce4bd1a2493ee1261ae7e8632c54b2c6abfcb4fff8fbb7554cd93809c17e8`

Source shown SHA256: `498ce4bd1a2493ee1261ae7e8632c54b2c6abfcb4fff8fbb7554cd93809c17e8`

Target shown SHA256: `498ce4bd1a2493ee1261ae7e8632c54b2c6abfcb4fff8fbb7554cd93809c17e8`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_491998778e598a5385e78b541e33bff8 |
| sourceUnitDigest | 498ce4bd1a2493ee1261ae7e8632c54b2c6abfcb4fff8fbb7554cd93809c17e8 |
| targetOwner | docs/platform/packaging-distribution/contracts/activation-binding.md |
| targetAnchor | unheaded-block-46 |
| claimKind | contract |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-107, under "10. MigrationJournal", is retained at docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-46. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/activation-binding.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
V1 does not perform automatic state migration during `fgctl upgrade` or
rollback. If the target runtime cannot read the current project state schema,
activation must fail with `state-schema-incompatible`. If the target runtime
can read but cannot write the current schema, activation may be allowed only
for read-only diagnostic use; mutating local `fgos` commands must refuse with
`state-schema-write-incompatible`.
```

### Target unit

```text
V1 does not perform automatic state migration during `fgctl upgrade` or
rollback. If the target runtime cannot read the current project state schema,
activation must fail with `state-schema-incompatible`. If the target runtime
can read but cannot write the current schema, activation may be allowed only
for read-only diagnostic use; mutating local `fgos` commands must refuse with
`state-schema-write-incompatible`.
```

### Unified diff

```diff
No text difference.
```

## claim_bd90f346258ea0333f0e9b09949a2bae

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-108

Target: docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-47

Source identity digest: `4a5dcd22823a0b2ccd988467b5c6b7df81536ef3fd5372bfd5ce1d5a1ba2eda5`

Target identity digest: `4a5dcd22823a0b2ccd988467b5c6b7df81536ef3fd5372bfd5ce1d5a1ba2eda5`

Source shown SHA256: `4a5dcd22823a0b2ccd988467b5c6b7df81536ef3fd5372bfd5ce1d5a1ba2eda5`

Target shown SHA256: `4a5dcd22823a0b2ccd988467b5c6b7df81536ef3fd5372bfd5ce1d5a1ba2eda5`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_bd90f346258ea0333f0e9b09949a2bae |
| sourceUnitDigest | 4a5dcd22823a0b2ccd988467b5c6b7df81536ef3fd5372bfd5ce1d5a1ba2eda5 |
| targetOwner | docs/platform/packaging-distribution/contracts/activation-binding.md |
| targetAnchor | unheaded-block-47 |
| claimKind | contract |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-108, under "10. MigrationJournal", is retained at docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-47. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/activation-binding.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
The current project state schema must be recorded outside the immutable
runtime payload, for example:
```

### Target unit

```text
The current project state schema must be recorded outside the immutable
runtime payload, for example:
```

### Unified diff

```diff
No text difference.
```

## claim_5a5a447d501facb835101fcf15cf5f9d

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-109

Target: docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-48

Source identity digest: `7736cb341115949ee30f3c483b3b4547bd282597586122e1eb7662e64eeb78f0`

Target identity digest: `7736cb341115949ee30f3c483b3b4547bd282597586122e1eb7662e64eeb78f0`

Source shown SHA256: `7736cb341115949ee30f3c483b3b4547bd282597586122e1eb7662e64eeb78f0`

Target shown SHA256: `7736cb341115949ee30f3c483b3b4547bd282597586122e1eb7662e64eeb78f0`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_5a5a447d501facb835101fcf15cf5f9d |
| sourceUnitDigest | 7736cb341115949ee30f3c483b3b4547bd282597586122e1eb7662e64eeb78f0 |
| targetOwner | docs/platform/packaging-distribution/contracts/activation-binding.md |
| targetAnchor | unheaded-block-48 |
| claimKind | contract |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-109, under "10. MigrationJournal", is retained at docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-48. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/activation-binding.md topic owner; carriage does not certify current implementation. |

### Source unit

````text
```txt
<workHistoryRoot(workStateId)>/schema.json
```
````

### Target unit

````text
```txt
<workHistoryRoot(workStateId)>/schema.json
```
````

### Unified diff

```diff
No text difference.
```

## claim_0d7b6c7bb749583718df925f63a8ba7f

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-110

Target: docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-49

Source identity digest: `de9ca65ddfe8a9180b1cfc6b5075e300c8e3c63d27516f5767707a0657fabd05`

Target identity digest: `de9ca65ddfe8a9180b1cfc6b5075e300c8e3c63d27516f5767707a0657fabd05`

Source shown SHA256: `de9ca65ddfe8a9180b1cfc6b5075e300c8e3c63d27516f5767707a0657fabd05`

Target shown SHA256: `de9ca65ddfe8a9180b1cfc6b5075e300c8e3c63d27516f5767707a0657fabd05`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_0d7b6c7bb749583718df925f63a8ba7f |
| sourceUnitDigest | de9ca65ddfe8a9180b1cfc6b5075e300c8e3c63d27516f5767707a0657fabd05 |
| targetOwner | docs/platform/packaging-distribution/contracts/activation-binding.md |
| targetAnchor | unheaded-block-49 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-110, under "10. MigrationJournal", is retained at docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-49. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/activation-binding.md topic owner; carriage does not certify current implementation. |

### Source unit

````text
Possible shape:

```json
{
  "schemaVersion": 1,
  "workStateId": "state_...",
  "currentStateSchema": "1",
  "lastWriterArtifactDigest": "sha256:..."
}
```
````

### Target unit

````text
Possible shape:

```json
{
  "schemaVersion": 1,
  "workStateId": "state_...",
  "currentStateSchema": "1",
  "lastWriterArtifactDigest": "sha256:..."
}
```
````

### Unified diff

```diff
No text difference.
```

## claim_eb0ec8c42d305f6fc227246824a4e360

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-111

Target: docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-50

Source identity digest: `70db9bdf36a7ab578e4aced8a540eefcc332495e830b507981eb3605ff53b858`

Target identity digest: `70db9bdf36a7ab578e4aced8a540eefcc332495e830b507981eb3605ff53b858`

Source shown SHA256: `70db9bdf36a7ab578e4aced8a540eefcc332495e830b507981eb3605ff53b858`

Target shown SHA256: `70db9bdf36a7ab578e4aced8a540eefcc332495e830b507981eb3605ff53b858`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_eb0ec8c42d305f6fc227246824a4e360 |
| sourceUnitDigest | 70db9bdf36a7ab578e4aced8a540eefcc332495e830b507981eb3605ff53b858 |
| targetOwner | docs/platform/packaging-distribution/contracts/activation-binding.md |
| targetAnchor | unheaded-block-50 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-111, under "10. MigrationJournal", is retained at docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-50. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/activation-binding.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
Compatibility checks:
```

### Target unit

```text
Compatibility checks:
```

### Unified diff

```diff
No text difference.
```

## claim_30369b94b606096331ba0ac8215dfe6f

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-112

Target: docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-51

Source identity digest: `be3d98e07c3a376719e09158f719c780c45a05d4a808f4665df1392229e81c99`

Target identity digest: `be3d98e07c3a376719e09158f719c780c45a05d4a808f4665df1392229e81c99`

Source shown SHA256: `be3d98e07c3a376719e09158f719c780c45a05d4a808f4665df1392229e81c99`

Target shown SHA256: `be3d98e07c3a376719e09158f719c780c45a05d4a808f4665df1392229e81c99`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_30369b94b606096331ba0ac8215dfe6f |
| sourceUnitDigest | be3d98e07c3a376719e09158f719c780c45a05d4a808f4665df1392229e81c99 |
| targetOwner | docs/platform/packaging-distribution/contracts/activation-binding.md |
| targetAnchor | unheaded-block-51 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-112, under "10. MigrationJournal", is retained at docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-51. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/activation-binding.md topic owner; carriage does not certify current implementation. |

### Source unit

````text
```txt
fgctl activate/upgrade/rollback
  -> read target ReleaseManifest.stateSchemas.read
  -> read project currentStateSchema
  -> refuse activation unless target can read currentStateSchema

local mutating fgos command
  -> lease active artifact digest
  -> read active ReleaseManifest.stateSchemas.write
  -> read work-state currentStateSchema
  -> verify workStateId matches the resolved work-state root
  -> refuse mutation unless active runtime can write currentStateSchema
```
````

### Target unit

````text
```txt
fgctl activate/upgrade/rollback
  -> read target ReleaseManifest.stateSchemas.read
  -> read project currentStateSchema
  -> refuse activation unless target can read currentStateSchema

local mutating fgos command
  -> lease active artifact digest
  -> read active ReleaseManifest.stateSchemas.write
  -> read work-state currentStateSchema
  -> verify workStateId matches the resolved work-state root
  -> refuse mutation unless active runtime can write currentStateSchema
```
````

### Unified diff

```diff
No text difference.
```

## claim_3a0164aced10388208f0c748829bf990

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-113

Target: docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-52

Source identity digest: `17a2c3fcd7e144c9173cd3ad9f462ba8152f488e4ae493b63123be13014b8995`

Target identity digest: `17a2c3fcd7e144c9173cd3ad9f462ba8152f488e4ae493b63123be13014b8995`

Source shown SHA256: `17a2c3fcd7e144c9173cd3ad9f462ba8152f488e4ae493b63123be13014b8995`

Target shown SHA256: `17a2c3fcd7e144c9173cd3ad9f462ba8152f488e4ae493b63123be13014b8995`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_3a0164aced10388208f0c748829bf990 |
| sourceUnitDigest | 17a2c3fcd7e144c9173cd3ad9f462ba8152f488e4ae493b63123be13014b8995 |
| targetOwner | docs/platform/packaging-distribution/contracts/activation-binding.md |
| targetAnchor | unheaded-block-52 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-113, under "10. MigrationJournal", is retained at docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-52. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/activation-binding.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
If two workspaces with different active artifact digests share one
`workStateId`, both may write only if both active release manifests declare
compatible write support for the current work-state schema and coordination
locks/claims permit the operation. Otherwise the runtime must refuse mutation
instead of relying on branch-local activation alone.
```

### Target unit

```text
If two workspaces with different active artifact digests share one
`workStateId`, both may write only if both active release manifests declare
compatible write support for the current work-state schema and coordination
locks/claims permit the operation. Otherwise the runtime must refuse mutation
instead of relying on branch-local activation alone.
```

### Unified diff

```diff
No text difference.
```

## claim_ec133e4ac5ee546b775219835450cb9a

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-114

Target: docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-53

Source identity digest: `ac7af0538dc243ffd13baf530f76a89686ff9cd2e59016f38c52877e3c3925df`

Target identity digest: `ac7af0538dc243ffd13baf530f76a89686ff9cd2e59016f38c52877e3c3925df`

Source shown SHA256: `ac7af0538dc243ffd13baf530f76a89686ff9cd2e59016f38c52877e3c3925df`

Target shown SHA256: `ac7af0538dc243ffd13baf530f76a89686ff9cd2e59016f38c52877e3c3925df`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_ec133e4ac5ee546b775219835450cb9a |
| sourceUnitDigest | ac7af0538dc243ffd13baf530f76a89686ff9cd2e59016f38c52877e3c3925df |
| targetOwner | docs/platform/packaging-distribution/contracts/activation-binding.md |
| targetAnchor | unheaded-block-53 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-114, under "10. MigrationJournal", is retained at docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-53. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/activation-binding.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
Migration remains explicit future work. When introduced, each migration must be
declared by the release manifest and recorded in `MigrationJournal` with
checkpoint/reversibility facts.
```

### Target unit

```text
Migration remains explicit future work. When introduced, each migration must be
declared by the release manifest and recorded in `MigrationJournal` with
checkpoint/reversibility facts.
```

### Unified diff

```diff
No text difference.
```

## claim_093f54d48d2e2a3efc8f0c865ba57b66

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#existing-project-adoption

Target: docs/platform/packaging-distribution/contracts/activation-binding.md#existing-project-adoption

Source identity digest: `87c50c8516e8e94bdf62183a8c57ddbf0ba1e8c3672f66630fe47106de4e0fd2`

Target identity digest: `fb1fd721f45cd646c9b1e55e905c9b96ceb0250986e0e1c9bcee142e38c5b1e9`

Source shown SHA256: `07c10d04d08ae099a78045aa3fdc4302bdbd8d059241ee2ead57e8fc6a7fd46e`

Target shown SHA256: `2d48a6e7a8ab59e31412a9f9334707c3e2510002896e8fe0f01fe4a5d41286f9`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_093f54d48d2e2a3efc8f0c865ba57b66 |
| sourceUnitDigest | 87c50c8516e8e94bdf62183a8c57ddbf0ba1e8c3672f66630fe47106de4e0fd2 |
| targetOwner | docs/platform/packaging-distribution/contracts/activation-binding.md |
| targetAnchor | existing-project-adoption |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete heading from docs/architect/packaging-distribution/runtime-identity-and-activation.md#existing-project-adoption, under "Existing Project Adoption", is retained at docs/platform/packaging-distribution/contracts/activation-binding.md#existing-project-adoption. Only heading depth changes; the direct section payload follows the original source order. The named owner is the contracts/activation-binding.md topic owner; carriage does not certify current implementation. |

### Source unit

````text
### Existing Project Adoption

V1 must adopt existing fgOS projects. A fresh design that only works on an
empty project is not enough because real projects already have legacy
`.fgos/events.jsonl`, `.fgos/events/`, `.fgos/config.json`, and coordination
state but no release store, no workspace `activation.json`, and no work-state
schema record.

Legacy/adoption physical shape:

```txt
<existing-main>/.fgos/events*
```

Canonical V1 logical root:

```txt
workHistoryRoot(workStateId)
```

Packaging must not hardcode the legacy physical layout. It asks
`resolveTopology()` for `workHistoryRoot(workStateId)` and lets work-state
architecture own migration/import from legacy paths.

Adoption rule:

```txt
fgctl init on existing .fgos/
  -> preserve/import existing eventlog/config/claim state through TopologyContext
  -> acquire/stage/activate runtime from tracked pin or selected source
  -> invoke active local fgos init
  -> if work-state schema record is missing, local fgos init writes schema "1"
  -> run bootstrap-safe doctor --fix
  -> run doctor
```

Missing schema record means "legacy schema 1" for V1, not "unknown, refuse".
This keeps existing projects adoptable without automatic migration.
````

### Target unit

````text
##### Existing Project Adoption

V1 must adopt existing fgOS projects. A fresh design that only works on an
empty project is not enough because real projects already have legacy
`.fgos/events.jsonl`, `.fgos/events/`, `.fgos/config.json`, and coordination
state but no release store, no workspace `activation.json`, and no work-state
schema record.

Legacy/adoption physical shape:

```txt
<existing-main>/.fgos/events*
```

Canonical V1 logical root:

```txt
workHistoryRoot(workStateId)
```

Packaging must not hardcode the legacy physical layout. It asks
`resolveTopology()` for `workHistoryRoot(workStateId)` and lets work-state
architecture own migration/import from legacy paths.

Adoption rule:

```txt
fgctl init on existing .fgos/
  -> preserve/import existing eventlog/config/claim state through TopologyContext
  -> acquire/stage/activate runtime from tracked pin or selected source
  -> invoke active local fgos init
  -> if work-state schema record is missing, local fgos init writes schema "1"
  -> run bootstrap-safe doctor --fix
  -> run doctor
```

Missing schema record means "legacy schema 1" for V1, not "unknown, refuse".
This keeps existing projects adoptable without automatic migration.
````

### Unified diff

```diff
--- "docs/architect/packaging-distribution/runtime-identity-and-activation.md#existing-project-adoption"
+++ "docs/platform/packaging-distribution/contracts/activation-binding.md#existing-project-adoption"
@@ -1,4 +1,4 @@
-### Existing Project Adoption
+##### Existing Project Adoption
 
 V1 must adopt existing fgOS projects. A fresh design that only works on an
 empty project is not enough because real projects already have legacy
```

## claim_6ed197b95e7f9801fa8298694177e5d0

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-115

Target: docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-54

Source identity digest: `6974a311e550994984d962f6e8e1f71e1afc8c14fbe7f8d5282a4cdda7df0cd8`

Target identity digest: `6974a311e550994984d962f6e8e1f71e1afc8c14fbe7f8d5282a4cdda7df0cd8`

Source shown SHA256: `6974a311e550994984d962f6e8e1f71e1afc8c14fbe7f8d5282a4cdda7df0cd8`

Target shown SHA256: `6974a311e550994984d962f6e8e1f71e1afc8c14fbe7f8d5282a4cdda7df0cd8`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_6ed197b95e7f9801fa8298694177e5d0 |
| sourceUnitDigest | 6974a311e550994984d962f6e8e1f71e1afc8c14fbe7f8d5282a4cdda7df0cd8 |
| targetOwner | docs/platform/packaging-distribution/contracts/activation-binding.md |
| targetAnchor | unheaded-block-54 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-115, under "Existing Project Adoption", is retained at docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-54. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/activation-binding.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
V1 must adopt existing fgOS projects. A fresh design that only works on an
empty project is not enough because real projects already have legacy
`.fgos/events.jsonl`, `.fgos/events/`, `.fgos/config.json`, and coordination
state but no release store, no workspace `activation.json`, and no work-state
schema record.
```

### Target unit

```text
V1 must adopt existing fgOS projects. A fresh design that only works on an
empty project is not enough because real projects already have legacy
`.fgos/events.jsonl`, `.fgos/events/`, `.fgos/config.json`, and coordination
state but no release store, no workspace `activation.json`, and no work-state
schema record.
```

### Unified diff

```diff
No text difference.
```

## claim_a144f2fd3dd53acd12feeb7e72607de9

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-116

Target: docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-55

Source identity digest: `b10f8721b7f1f6d51be6d22b21acb9effa78de473c0b6a2fb2f92dd71e67b158`

Target identity digest: `b10f8721b7f1f6d51be6d22b21acb9effa78de473c0b6a2fb2f92dd71e67b158`

Source shown SHA256: `b10f8721b7f1f6d51be6d22b21acb9effa78de473c0b6a2fb2f92dd71e67b158`

Target shown SHA256: `b10f8721b7f1f6d51be6d22b21acb9effa78de473c0b6a2fb2f92dd71e67b158`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_a144f2fd3dd53acd12feeb7e72607de9 |
| sourceUnitDigest | b10f8721b7f1f6d51be6d22b21acb9effa78de473c0b6a2fb2f92dd71e67b158 |
| targetOwner | docs/platform/packaging-distribution/contracts/activation-binding.md |
| targetAnchor | unheaded-block-55 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-116, under "Existing Project Adoption", is retained at docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-55. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/activation-binding.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
Legacy/adoption physical shape:
```

### Target unit

```text
Legacy/adoption physical shape:
```

### Unified diff

```diff
No text difference.
```

## claim_2929202af5d9245fafd9c8fe0055e494

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-117

Target: docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-56

Source identity digest: `1f0eae3e1e42a0694560408217a0581fc8920c356521c76f38c931b04a3e21f0`

Target identity digest: `1f0eae3e1e42a0694560408217a0581fc8920c356521c76f38c931b04a3e21f0`

Source shown SHA256: `1f0eae3e1e42a0694560408217a0581fc8920c356521c76f38c931b04a3e21f0`

Target shown SHA256: `1f0eae3e1e42a0694560408217a0581fc8920c356521c76f38c931b04a3e21f0`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_2929202af5d9245fafd9c8fe0055e494 |
| sourceUnitDigest | 1f0eae3e1e42a0694560408217a0581fc8920c356521c76f38c931b04a3e21f0 |
| targetOwner | docs/platform/packaging-distribution/contracts/activation-binding.md |
| targetAnchor | unheaded-block-56 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-117, under "Existing Project Adoption", is retained at docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-56. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/activation-binding.md topic owner; carriage does not certify current implementation. |

### Source unit

````text
```txt
<existing-main>/.fgos/events*
```
````

### Target unit

````text
```txt
<existing-main>/.fgos/events*
```
````

### Unified diff

```diff
No text difference.
```

## claim_ed503fa8fc58ad877bf8c8faa3f7958b

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-118

Target: docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-57

Source identity digest: `1350217488d7df5ff2cd08fc752fef846e75b1b20161c0d22dcde1d9f7388837`

Target identity digest: `1350217488d7df5ff2cd08fc752fef846e75b1b20161c0d22dcde1d9f7388837`

Source shown SHA256: `1350217488d7df5ff2cd08fc752fef846e75b1b20161c0d22dcde1d9f7388837`

Target shown SHA256: `1350217488d7df5ff2cd08fc752fef846e75b1b20161c0d22dcde1d9f7388837`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_ed503fa8fc58ad877bf8c8faa3f7958b |
| sourceUnitDigest | 1350217488d7df5ff2cd08fc752fef846e75b1b20161c0d22dcde1d9f7388837 |
| targetOwner | docs/platform/packaging-distribution/contracts/activation-binding.md |
| targetAnchor | unheaded-block-57 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-118, under "Existing Project Adoption", is retained at docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-57. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/activation-binding.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
Canonical V1 logical root:
```

### Target unit

```text
Canonical V1 logical root:
```

### Unified diff

```diff
No text difference.
```

## claim_26bc6a190eda16e49745b6bcc7fbc379

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-119

Target: docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-58

Source identity digest: `0f882749d3e11278fb1a1150c663da4b71885a1d0a9e39574a10225f36a24d65`

Target identity digest: `0f882749d3e11278fb1a1150c663da4b71885a1d0a9e39574a10225f36a24d65`

Source shown SHA256: `0f882749d3e11278fb1a1150c663da4b71885a1d0a9e39574a10225f36a24d65`

Target shown SHA256: `0f882749d3e11278fb1a1150c663da4b71885a1d0a9e39574a10225f36a24d65`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_26bc6a190eda16e49745b6bcc7fbc379 |
| sourceUnitDigest | 0f882749d3e11278fb1a1150c663da4b71885a1d0a9e39574a10225f36a24d65 |
| targetOwner | docs/platform/packaging-distribution/contracts/activation-binding.md |
| targetAnchor | unheaded-block-58 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-119, under "Existing Project Adoption", is retained at docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-58. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/activation-binding.md topic owner; carriage does not certify current implementation. |

### Source unit

````text
```txt
workHistoryRoot(workStateId)
```
````

### Target unit

````text
```txt
workHistoryRoot(workStateId)
```
````

### Unified diff

```diff
No text difference.
```

## claim_a5d4be2b9bafbb6afe85aa62070351e0

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-120

Target: docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-59

Source identity digest: `67b295693448086f48b7539c8a2b9b6914b45d721cfe4a7926635054eb41ea81`

Target identity digest: `67b295693448086f48b7539c8a2b9b6914b45d721cfe4a7926635054eb41ea81`

Source shown SHA256: `67b295693448086f48b7539c8a2b9b6914b45d721cfe4a7926635054eb41ea81`

Target shown SHA256: `67b295693448086f48b7539c8a2b9b6914b45d721cfe4a7926635054eb41ea81`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_a5d4be2b9bafbb6afe85aa62070351e0 |
| sourceUnitDigest | 67b295693448086f48b7539c8a2b9b6914b45d721cfe4a7926635054eb41ea81 |
| targetOwner | docs/platform/packaging-distribution/contracts/activation-binding.md |
| targetAnchor | unheaded-block-59 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-120, under "Existing Project Adoption", is retained at docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-59. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/activation-binding.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
Packaging must not hardcode the legacy physical layout. It asks
`resolveTopology()` for `workHistoryRoot(workStateId)` and lets work-state
architecture own migration/import from legacy paths.
```

### Target unit

```text
Packaging must not hardcode the legacy physical layout. It asks
`resolveTopology()` for `workHistoryRoot(workStateId)` and lets work-state
architecture own migration/import from legacy paths.
```

### Unified diff

```diff
No text difference.
```

## claim_b0de344d5a30b83c57e0ff1b963c4c43

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-121

Target: docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-60

Source identity digest: `07f8f1512cab1811efe3279788d3b494c699f31d6e5bf623417c53eb1241ea01`

Target identity digest: `07f8f1512cab1811efe3279788d3b494c699f31d6e5bf623417c53eb1241ea01`

Source shown SHA256: `07f8f1512cab1811efe3279788d3b494c699f31d6e5bf623417c53eb1241ea01`

Target shown SHA256: `07f8f1512cab1811efe3279788d3b494c699f31d6e5bf623417c53eb1241ea01`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_b0de344d5a30b83c57e0ff1b963c4c43 |
| sourceUnitDigest | 07f8f1512cab1811efe3279788d3b494c699f31d6e5bf623417c53eb1241ea01 |
| targetOwner | docs/platform/packaging-distribution/contracts/activation-binding.md |
| targetAnchor | unheaded-block-60 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-121, under "Existing Project Adoption", is retained at docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-60. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/activation-binding.md topic owner; carriage does not certify current implementation. |

### Source unit

````text
Adoption rule:

```txt
fgctl init on existing .fgos/
  -> preserve/import existing eventlog/config/claim state through TopologyContext
  -> acquire/stage/activate runtime from tracked pin or selected source
  -> invoke active local fgos init
  -> if work-state schema record is missing, local fgos init writes schema "1"
  -> run bootstrap-safe doctor --fix
  -> run doctor
```
````

### Target unit

````text
Adoption rule:

```txt
fgctl init on existing .fgos/
  -> preserve/import existing eventlog/config/claim state through TopologyContext
  -> acquire/stage/activate runtime from tracked pin or selected source
  -> invoke active local fgos init
  -> if work-state schema record is missing, local fgos init writes schema "1"
  -> run bootstrap-safe doctor --fix
  -> run doctor
```
````

### Unified diff

```diff
No text difference.
```

## claim_89796d37e2377576e2e7202f34b08ea8

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-122

Target: docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-61

Source identity digest: `8ca6f556298555c6b141f6386ec9ea4418f581ecaca73550d2f99de0dda9aa13`

Target identity digest: `8ca6f556298555c6b141f6386ec9ea4418f581ecaca73550d2f99de0dda9aa13`

Source shown SHA256: `8ca6f556298555c6b141f6386ec9ea4418f581ecaca73550d2f99de0dda9aa13`

Target shown SHA256: `8ca6f556298555c6b141f6386ec9ea4418f581ecaca73550d2f99de0dda9aa13`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_89796d37e2377576e2e7202f34b08ea8 |
| sourceUnitDigest | 8ca6f556298555c6b141f6386ec9ea4418f581ecaca73550d2f99de0dda9aa13 |
| targetOwner | docs/platform/packaging-distribution/contracts/activation-binding.md |
| targetAnchor | unheaded-block-61 |
| claimKind | contract |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-122, under "Existing Project Adoption", is retained at docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-61. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/activation-binding.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
Missing schema record means "legacy schema 1" for V1, not "unknown, refuse".
This keeps existing projects adoptable without automatic migration.
```

### Target unit

```text
Missing schema record means "legacy schema 1" for V1, not "unknown, refuse".
This keeps existing projects adoptable without automatic migration.
```

### Unified diff

```diff
No text difference.
```

## claim_efd5afeb35b4352c0229ea2f7be2356b

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#dev-source-activation

Target: docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#dev-source-activation-restoration-stub

Source identity digest: `54e58acdabc49d0aefb2cf037f6a476f121008c99a25bd0eaad2b33b8284adab`

Target identity digest: `2cda289ff834706e95ac82903eb9518fc523d85011a80349900cb627158ddde1`

Source shown SHA256: `ee11c1f9e77a52a5dab72c524976a65a4eeb8865dbe394e5711bdeff442b9cb9`

Target shown SHA256: `43976f11724a656ad1ad1aa763e8cc3cbc3e4b1090279e9aacf3778241835d5a`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_efd5afeb35b4352c0229ea2f7be2356b |
| sourceUnitDigest | 54e58acdabc49d0aefb2cf037f6a476f121008c99a25bd0eaad2b33b8284adab |
| targetOwner | docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md |
| targetAnchor | dev-source-activation-restoration-stub |
| claimKind | architecture |
| disposition | defer-with-owner |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The heading at docs/architect/packaging-distribution/runtime-identity-and-activation.md#dev-source-activation is one of the seven registered dev/source activation units. Restore remains owned by Plan C; the labelled stub tracks this exact unit. For the compound table, all non-dev clauses are retained in the stub companion table. No implementation or retirement verdict is asserted. |
| stubOwner | docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md |
| stubAnchor | dev-source-activation-restoration-stub |

### Source unit

````text
### Dev / Source Activation

fgOS self-development needs a dogfood path that does not require nested repos
and does not pretend a source checkout is an immutable release.

V1 supports an explicit dev activation kind:

```txt
artifactDigest: dev:<sourceRevisionOrWorktreeId>
activationKind: dev-source
activeReleasePath: <source checkout path>
distributable: false
```

Dev activation rules:

- must be explicit; never selected as an accidental PATH fallback;
- skips immutable release file digest guarantees;
- still reports runtime identity as `dev:*`;
- still uses the same command authority, work-state root, projection ownership,
  and state-schema compatibility rules;
- is not valid for a distributable install package.

This preserves dogfood without turning dogfood into the product mission and
without solving self-development by nesting a product repo inside a workshop
repo.
````

### Target unit

```text
## Dev Source Activation Restoration Stub

Added in candidate — not carried; restoration tracked by dropped-001 and Plan C.

Restoration owner: Plan C (`plans/261006-1445-fgctl-dev-activation/`, draft, unscheduled). This is an explicit deferral of the seven source units, not an implementation or retirement verdict. The six units under Dev / Source Activation and the dev-source clause in the compound settled-facts table remain tracked in the source register. All other clauses of that table are retained below without promoting dev activation.

| Decision | Status |
|---|---|
| Runtime identity is digest-based, not PATH-based. | Settled for V1. |
| `artifactDigest` is the digest of the canonical release tree manifest, not an archive digest. | Settled for V1. |
| Release tree manifest uses normalized logical paths and refuses symlinks/case collisions in V1. | Settled for V1. |
| Project commands enter through stable local shims under workspace `.fgos/installation/bin/`. | Settled for V1. |
| Immutable release payloads live under a shared content-addressed machine/trust-domain release store, not under each worktree. | Settled for V1. |
| Activation is per workspace via `.fgos/installation/activation.json`; there is no single repository-wide active runtime pointer in V1. | Settled for V1. |
| Packaging release/activation state uses workspace installation roots and must not share a namespace with work coordination state. | Settled for V1. |
| The project/team pin is tracked as `.fgos/distribution.json`; machine-local activation state remains ignored. | Settled for V1. |
| `activation.json` is a durably published workspace binding, not a symlink, in V1. | Settled for V1. |
| Install transaction state lives under the release store root's `installs/<activationId>.json`, not inside `activation.json`. | Settled for V1. |
| Mutating invocations create lease files; `fgctl` may stage/verify during leases but refuses activation while a non-stale mutating lease exists. | Settled for V1. |
| V1 does not do automatic state migration during upgrade/rollback. | Settled for V1. |
| `fgctl` never writes host-visible projection files directly; local `fgos init` / `doctor --fix` owns projection materialization under active identity. | Settled for V1. |
| Existing projects are adoptable: a missing state schema record is treated as schema `1` and written during local `fgos init`. | Settled for V1. |
| Dev / source activation restoration is tracked by dropped-001 and Plan C. | Deferred; not carried in this candidate. |
| `fgctl` V1 is a Rust bootstrap binary with local path/tarball and GitHub release asset as acquisition sources. | Settled for V1. |
| Candidate preflight is static: `fgctl` never executes candidate release code before the ready binding is published. | Settled for V1 (P7 red-team fix, 2026-09-14). |
| Shared gateway/web are architecture constraints only, not active delivery scope. | Promoted for active delivery. |
```

### Unified diff

````diff
--- "docs/architect/packaging-distribution/runtime-identity-and-activation.md#dev-source-activation"
+++ "docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#dev-source-activation-restoration-stub"
@@ -1,26 +1,26 @@
-### Dev / Source Activation
+## Dev Source Activation Restoration Stub
 
-fgOS self-development needs a dogfood path that does not require nested repos
-and does not pretend a source checkout is an immutable release.
+Added in candidate — not carried; restoration tracked by dropped-001 and Plan C.
 
-V1 supports an explicit dev activation kind:
+Restoration owner: Plan C (`plans/261006-1445-fgctl-dev-activation/`, draft, unscheduled). This is an explicit deferral of the seven source units, not an implementation or retirement verdict. The six units under Dev / Source Activation and the dev-source clause in the compound settled-facts table remain tracked in the source register. All other clauses of that table are retained below without promoting dev activation.
 
-```txt
-artifactDigest: dev:<sourceRevisionOrWorktreeId>
-activationKind: dev-source
-activeReleasePath: <source checkout path>
-distributable: false
-```
-
-Dev activation rules:
-
-- must be explicit; never selected as an accidental PATH fallback;
-- skips immutable release file digest guarantees;
-- still reports runtime identity as `dev:*`;
-- still uses the same command authority, work-state root, projection ownership,
-  and state-schema compatibility rules;
-- is not valid for a distributable install package.
-
-This preserves dogfood without turning dogfood into the product mission and
-without solving self-development by nesting a product repo inside a workshop
-repo.
\ No newline at end of file
+| Decision | Status |
+|---|---|
+| Runtime identity is digest-based, not PATH-based. | Settled for V1. |
+| `artifactDigest` is the digest of the canonical release tree manifest, not an archive digest. | Settled for V1. |
+| Release tree manifest uses normalized logical paths and refuses symlinks/case collisions in V1. | Settled for V1. |
+| Project commands enter through stable local shims under workspace `.fgos/installation/bin/`. | Settled for V1. |
+| Immutable release payloads live under a shared content-addressed machine/trust-domain release store, not under each worktree. | Settled for V1. |
+| Activation is per workspace via `.fgos/installation/activation.json`; there is no single repository-wide active runtime pointer in V1. | Settled for V1. |
+| Packaging release/activation state uses workspace installation roots and must not share a namespace with work coordination state. | Settled for V1. |
+| The project/team pin is tracked as `.fgos/distribution.json`; machine-local activation state remains ignored. | Settled for V1. |
+| `activation.json` is a durably published workspace binding, not a symlink, in V1. | Settled for V1. |
+| Install transaction state lives under the release store root's `installs/<activationId>.json`, not inside `activation.json`. | Settled for V1. |
+| Mutating invocations create lease files; `fgctl` may stage/verify during leases but refuses activation while a non-stale mutating lease exists. | Settled for V1. |
+| V1 does not do automatic state migration during upgrade/rollback. | Settled for V1. |
+| `fgctl` never writes host-visible projection files directly; local `fgos init` / `doctor --fix` owns projection materialization under active identity. | Settled for V1. |
+| Existing projects are adoptable: a missing state schema record is treated as schema `1` and written during local `fgos init`. | Settled for V1. |
+| Dev / source activation restoration is tracked by dropped-001 and Plan C. | Deferred; not carried in this candidate. |
+| `fgctl` V1 is a Rust bootstrap binary with local path/tarball and GitHub release asset as acquisition sources. | Settled for V1. |
+| Candidate preflight is static: `fgctl` never executes candidate release code before the ready binding is published. | Settled for V1 (P7 red-team fix, 2026-09-14). |
+| Shared gateway/web are architecture constraints only, not active delivery scope. | Promoted for active delivery. |
\ No newline at end of file
````

## claim_c95bf4f07595cb9b849208efc61e76fb

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-123

Target: docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#dev-source-activation-restoration-stub

Source identity digest: `12a6c926f8c2c640b2a3b32069da45936488d40fc9512a28acc3c71e75632004`

Target identity digest: `2cda289ff834706e95ac82903eb9518fc523d85011a80349900cb627158ddde1`

Source shown SHA256: `12a6c926f8c2c640b2a3b32069da45936488d40fc9512a28acc3c71e75632004`

Target shown SHA256: `43976f11724a656ad1ad1aa763e8cc3cbc3e4b1090279e9aacf3778241835d5a`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_c95bf4f07595cb9b849208efc61e76fb |
| sourceUnitDigest | 12a6c926f8c2c640b2a3b32069da45936488d40fc9512a28acc3c71e75632004 |
| targetOwner | docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md |
| targetAnchor | dev-source-activation-restoration-stub |
| claimKind | architecture |
| disposition | defer-with-owner |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The unheaded-block at docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-123 is one of the seven registered dev/source activation units. Restore remains owned by Plan C; the labelled stub tracks this exact unit. For the compound table, all non-dev clauses are retained in the stub companion table. No implementation or retirement verdict is asserted. |
| stubOwner | docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md |
| stubAnchor | dev-source-activation-restoration-stub |

### Source unit

```text
fgOS self-development needs a dogfood path that does not require nested repos
and does not pretend a source checkout is an immutable release.
```

### Target unit

```text
## Dev Source Activation Restoration Stub

Added in candidate — not carried; restoration tracked by dropped-001 and Plan C.

Restoration owner: Plan C (`plans/261006-1445-fgctl-dev-activation/`, draft, unscheduled). This is an explicit deferral of the seven source units, not an implementation or retirement verdict. The six units under Dev / Source Activation and the dev-source clause in the compound settled-facts table remain tracked in the source register. All other clauses of that table are retained below without promoting dev activation.

| Decision | Status |
|---|---|
| Runtime identity is digest-based, not PATH-based. | Settled for V1. |
| `artifactDigest` is the digest of the canonical release tree manifest, not an archive digest. | Settled for V1. |
| Release tree manifest uses normalized logical paths and refuses symlinks/case collisions in V1. | Settled for V1. |
| Project commands enter through stable local shims under workspace `.fgos/installation/bin/`. | Settled for V1. |
| Immutable release payloads live under a shared content-addressed machine/trust-domain release store, not under each worktree. | Settled for V1. |
| Activation is per workspace via `.fgos/installation/activation.json`; there is no single repository-wide active runtime pointer in V1. | Settled for V1. |
| Packaging release/activation state uses workspace installation roots and must not share a namespace with work coordination state. | Settled for V1. |
| The project/team pin is tracked as `.fgos/distribution.json`; machine-local activation state remains ignored. | Settled for V1. |
| `activation.json` is a durably published workspace binding, not a symlink, in V1. | Settled for V1. |
| Install transaction state lives under the release store root's `installs/<activationId>.json`, not inside `activation.json`. | Settled for V1. |
| Mutating invocations create lease files; `fgctl` may stage/verify during leases but refuses activation while a non-stale mutating lease exists. | Settled for V1. |
| V1 does not do automatic state migration during upgrade/rollback. | Settled for V1. |
| `fgctl` never writes host-visible projection files directly; local `fgos init` / `doctor --fix` owns projection materialization under active identity. | Settled for V1. |
| Existing projects are adoptable: a missing state schema record is treated as schema `1` and written during local `fgos init`. | Settled for V1. |
| Dev / source activation restoration is tracked by dropped-001 and Plan C. | Deferred; not carried in this candidate. |
| `fgctl` V1 is a Rust bootstrap binary with local path/tarball and GitHub release asset as acquisition sources. | Settled for V1. |
| Candidate preflight is static: `fgctl` never executes candidate release code before the ready binding is published. | Settled for V1 (P7 red-team fix, 2026-09-14). |
| Shared gateway/web are architecture constraints only, not active delivery scope. | Promoted for active delivery. |
```

### Unified diff

```diff
--- "docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-123"
+++ "docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#dev-source-activation-restoration-stub"
@@ -1,2 +1,26 @@
-fgOS self-development needs a dogfood path that does not require nested repos
-and does not pretend a source checkout is an immutable release.
\ No newline at end of file
+## Dev Source Activation Restoration Stub
+
+Added in candidate — not carried; restoration tracked by dropped-001 and Plan C.
+
+Restoration owner: Plan C (`plans/261006-1445-fgctl-dev-activation/`, draft, unscheduled). This is an explicit deferral of the seven source units, not an implementation or retirement verdict. The six units under Dev / Source Activation and the dev-source clause in the compound settled-facts table remain tracked in the source register. All other clauses of that table are retained below without promoting dev activation.
+
+| Decision | Status |
+|---|---|
+| Runtime identity is digest-based, not PATH-based. | Settled for V1. |
+| `artifactDigest` is the digest of the canonical release tree manifest, not an archive digest. | Settled for V1. |
+| Release tree manifest uses normalized logical paths and refuses symlinks/case collisions in V1. | Settled for V1. |
+| Project commands enter through stable local shims under workspace `.fgos/installation/bin/`. | Settled for V1. |
+| Immutable release payloads live under a shared content-addressed machine/trust-domain release store, not under each worktree. | Settled for V1. |
+| Activation is per workspace via `.fgos/installation/activation.json`; there is no single repository-wide active runtime pointer in V1. | Settled for V1. |
+| Packaging release/activation state uses workspace installation roots and must not share a namespace with work coordination state. | Settled for V1. |
+| The project/team pin is tracked as `.fgos/distribution.json`; machine-local activation state remains ignored. | Settled for V1. |
+| `activation.json` is a durably published workspace binding, not a symlink, in V1. | Settled for V1. |
+| Install transaction state lives under the release store root's `installs/<activationId>.json`, not inside `activation.json`. | Settled for V1. |
+| Mutating invocations create lease files; `fgctl` may stage/verify during leases but refuses activation while a non-stale mutating lease exists. | Settled for V1. |
+| V1 does not do automatic state migration during upgrade/rollback. | Settled for V1. |
+| `fgctl` never writes host-visible projection files directly; local `fgos init` / `doctor --fix` owns projection materialization under active identity. | Settled for V1. |
+| Existing projects are adoptable: a missing state schema record is treated as schema `1` and written during local `fgos init`. | Settled for V1. |
+| Dev / source activation restoration is tracked by dropped-001 and Plan C. | Deferred; not carried in this candidate. |
+| `fgctl` V1 is a Rust bootstrap binary with local path/tarball and GitHub release asset as acquisition sources. | Settled for V1. |
+| Candidate preflight is static: `fgctl` never executes candidate release code before the ready binding is published. | Settled for V1 (P7 red-team fix, 2026-09-14). |
+| Shared gateway/web are architecture constraints only, not active delivery scope. | Promoted for active delivery. |
\ No newline at end of file
```

## claim_865a8350c10fa2d9cc73ba3edb8b0520

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-124

Target: docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#dev-source-activation-restoration-stub

Source identity digest: `5c2bcca41b6bdea7c18a1fb420ab27f7404c32ef2240ab0eb8ef9370b7122872`

Target identity digest: `2cda289ff834706e95ac82903eb9518fc523d85011a80349900cb627158ddde1`

Source shown SHA256: `5c2bcca41b6bdea7c18a1fb420ab27f7404c32ef2240ab0eb8ef9370b7122872`

Target shown SHA256: `43976f11724a656ad1ad1aa763e8cc3cbc3e4b1090279e9aacf3778241835d5a`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_865a8350c10fa2d9cc73ba3edb8b0520 |
| sourceUnitDigest | 5c2bcca41b6bdea7c18a1fb420ab27f7404c32ef2240ab0eb8ef9370b7122872 |
| targetOwner | docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md |
| targetAnchor | dev-source-activation-restoration-stub |
| claimKind | architecture |
| disposition | defer-with-owner |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The unheaded-block at docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-124 is one of the seven registered dev/source activation units. Restore remains owned by Plan C; the labelled stub tracks this exact unit. For the compound table, all non-dev clauses are retained in the stub companion table. No implementation or retirement verdict is asserted. |
| stubOwner | docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md |
| stubAnchor | dev-source-activation-restoration-stub |

### Source unit

```text
V1 supports an explicit dev activation kind:
```

### Target unit

```text
## Dev Source Activation Restoration Stub

Added in candidate — not carried; restoration tracked by dropped-001 and Plan C.

Restoration owner: Plan C (`plans/261006-1445-fgctl-dev-activation/`, draft, unscheduled). This is an explicit deferral of the seven source units, not an implementation or retirement verdict. The six units under Dev / Source Activation and the dev-source clause in the compound settled-facts table remain tracked in the source register. All other clauses of that table are retained below without promoting dev activation.

| Decision | Status |
|---|---|
| Runtime identity is digest-based, not PATH-based. | Settled for V1. |
| `artifactDigest` is the digest of the canonical release tree manifest, not an archive digest. | Settled for V1. |
| Release tree manifest uses normalized logical paths and refuses symlinks/case collisions in V1. | Settled for V1. |
| Project commands enter through stable local shims under workspace `.fgos/installation/bin/`. | Settled for V1. |
| Immutable release payloads live under a shared content-addressed machine/trust-domain release store, not under each worktree. | Settled for V1. |
| Activation is per workspace via `.fgos/installation/activation.json`; there is no single repository-wide active runtime pointer in V1. | Settled for V1. |
| Packaging release/activation state uses workspace installation roots and must not share a namespace with work coordination state. | Settled for V1. |
| The project/team pin is tracked as `.fgos/distribution.json`; machine-local activation state remains ignored. | Settled for V1. |
| `activation.json` is a durably published workspace binding, not a symlink, in V1. | Settled for V1. |
| Install transaction state lives under the release store root's `installs/<activationId>.json`, not inside `activation.json`. | Settled for V1. |
| Mutating invocations create lease files; `fgctl` may stage/verify during leases but refuses activation while a non-stale mutating lease exists. | Settled for V1. |
| V1 does not do automatic state migration during upgrade/rollback. | Settled for V1. |
| `fgctl` never writes host-visible projection files directly; local `fgos init` / `doctor --fix` owns projection materialization under active identity. | Settled for V1. |
| Existing projects are adoptable: a missing state schema record is treated as schema `1` and written during local `fgos init`. | Settled for V1. |
| Dev / source activation restoration is tracked by dropped-001 and Plan C. | Deferred; not carried in this candidate. |
| `fgctl` V1 is a Rust bootstrap binary with local path/tarball and GitHub release asset as acquisition sources. | Settled for V1. |
| Candidate preflight is static: `fgctl` never executes candidate release code before the ready binding is published. | Settled for V1 (P7 red-team fix, 2026-09-14). |
| Shared gateway/web are architecture constraints only, not active delivery scope. | Promoted for active delivery. |
```

### Unified diff

```diff
--- "docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-124"
+++ "docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#dev-source-activation-restoration-stub"
@@ -1 +1,26 @@
-V1 supports an explicit dev activation kind:
\ No newline at end of file
+## Dev Source Activation Restoration Stub
+
+Added in candidate — not carried; restoration tracked by dropped-001 and Plan C.
+
+Restoration owner: Plan C (`plans/261006-1445-fgctl-dev-activation/`, draft, unscheduled). This is an explicit deferral of the seven source units, not an implementation or retirement verdict. The six units under Dev / Source Activation and the dev-source clause in the compound settled-facts table remain tracked in the source register. All other clauses of that table are retained below without promoting dev activation.
+
+| Decision | Status |
+|---|---|
+| Runtime identity is digest-based, not PATH-based. | Settled for V1. |
+| `artifactDigest` is the digest of the canonical release tree manifest, not an archive digest. | Settled for V1. |
+| Release tree manifest uses normalized logical paths and refuses symlinks/case collisions in V1. | Settled for V1. |
+| Project commands enter through stable local shims under workspace `.fgos/installation/bin/`. | Settled for V1. |
+| Immutable release payloads live under a shared content-addressed machine/trust-domain release store, not under each worktree. | Settled for V1. |
+| Activation is per workspace via `.fgos/installation/activation.json`; there is no single repository-wide active runtime pointer in V1. | Settled for V1. |
+| Packaging release/activation state uses workspace installation roots and must not share a namespace with work coordination state. | Settled for V1. |
+| The project/team pin is tracked as `.fgos/distribution.json`; machine-local activation state remains ignored. | Settled for V1. |
+| `activation.json` is a durably published workspace binding, not a symlink, in V1. | Settled for V1. |
+| Install transaction state lives under the release store root's `installs/<activationId>.json`, not inside `activation.json`. | Settled for V1. |
+| Mutating invocations create lease files; `fgctl` may stage/verify during leases but refuses activation while a non-stale mutating lease exists. | Settled for V1. |
+| V1 does not do automatic state migration during upgrade/rollback. | Settled for V1. |
+| `fgctl` never writes host-visible projection files directly; local `fgos init` / `doctor --fix` owns projection materialization under active identity. | Settled for V1. |
+| Existing projects are adoptable: a missing state schema record is treated as schema `1` and written during local `fgos init`. | Settled for V1. |
+| Dev / source activation restoration is tracked by dropped-001 and Plan C. | Deferred; not carried in this candidate. |
+| `fgctl` V1 is a Rust bootstrap binary with local path/tarball and GitHub release asset as acquisition sources. | Settled for V1. |
+| Candidate preflight is static: `fgctl` never executes candidate release code before the ready binding is published. | Settled for V1 (P7 red-team fix, 2026-09-14). |
+| Shared gateway/web are architecture constraints only, not active delivery scope. | Promoted for active delivery. |
\ No newline at end of file
```

## claim_3b0ea2eb26b63bcfe3c447bcce51d96c

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-125

Target: docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#dev-source-activation-restoration-stub

Source identity digest: `fbf2d2af13ec036d421e8ed1fb30ffc5cc600b77e97fbeedcf934348cf3a6291`

Target identity digest: `2cda289ff834706e95ac82903eb9518fc523d85011a80349900cb627158ddde1`

Source shown SHA256: `fbf2d2af13ec036d421e8ed1fb30ffc5cc600b77e97fbeedcf934348cf3a6291`

Target shown SHA256: `43976f11724a656ad1ad1aa763e8cc3cbc3e4b1090279e9aacf3778241835d5a`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_3b0ea2eb26b63bcfe3c447bcce51d96c |
| sourceUnitDigest | fbf2d2af13ec036d421e8ed1fb30ffc5cc600b77e97fbeedcf934348cf3a6291 |
| targetOwner | docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md |
| targetAnchor | dev-source-activation-restoration-stub |
| claimKind | architecture |
| disposition | defer-with-owner |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The unheaded-block at docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-125 is one of the seven registered dev/source activation units. Restore remains owned by Plan C; the labelled stub tracks this exact unit. For the compound table, all non-dev clauses are retained in the stub companion table. No implementation or retirement verdict is asserted. |
| stubOwner | docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md |
| stubAnchor | dev-source-activation-restoration-stub |

### Source unit

````text
```txt
artifactDigest: dev:<sourceRevisionOrWorktreeId>
activationKind: dev-source
activeReleasePath: <source checkout path>
distributable: false
```
````

### Target unit

```text
## Dev Source Activation Restoration Stub

Added in candidate — not carried; restoration tracked by dropped-001 and Plan C.

Restoration owner: Plan C (`plans/261006-1445-fgctl-dev-activation/`, draft, unscheduled). This is an explicit deferral of the seven source units, not an implementation or retirement verdict. The six units under Dev / Source Activation and the dev-source clause in the compound settled-facts table remain tracked in the source register. All other clauses of that table are retained below without promoting dev activation.

| Decision | Status |
|---|---|
| Runtime identity is digest-based, not PATH-based. | Settled for V1. |
| `artifactDigest` is the digest of the canonical release tree manifest, not an archive digest. | Settled for V1. |
| Release tree manifest uses normalized logical paths and refuses symlinks/case collisions in V1. | Settled for V1. |
| Project commands enter through stable local shims under workspace `.fgos/installation/bin/`. | Settled for V1. |
| Immutable release payloads live under a shared content-addressed machine/trust-domain release store, not under each worktree. | Settled for V1. |
| Activation is per workspace via `.fgos/installation/activation.json`; there is no single repository-wide active runtime pointer in V1. | Settled for V1. |
| Packaging release/activation state uses workspace installation roots and must not share a namespace with work coordination state. | Settled for V1. |
| The project/team pin is tracked as `.fgos/distribution.json`; machine-local activation state remains ignored. | Settled for V1. |
| `activation.json` is a durably published workspace binding, not a symlink, in V1. | Settled for V1. |
| Install transaction state lives under the release store root's `installs/<activationId>.json`, not inside `activation.json`. | Settled for V1. |
| Mutating invocations create lease files; `fgctl` may stage/verify during leases but refuses activation while a non-stale mutating lease exists. | Settled for V1. |
| V1 does not do automatic state migration during upgrade/rollback. | Settled for V1. |
| `fgctl` never writes host-visible projection files directly; local `fgos init` / `doctor --fix` owns projection materialization under active identity. | Settled for V1. |
| Existing projects are adoptable: a missing state schema record is treated as schema `1` and written during local `fgos init`. | Settled for V1. |
| Dev / source activation restoration is tracked by dropped-001 and Plan C. | Deferred; not carried in this candidate. |
| `fgctl` V1 is a Rust bootstrap binary with local path/tarball and GitHub release asset as acquisition sources. | Settled for V1. |
| Candidate preflight is static: `fgctl` never executes candidate release code before the ready binding is published. | Settled for V1 (P7 red-team fix, 2026-09-14). |
| Shared gateway/web are architecture constraints only, not active delivery scope. | Promoted for active delivery. |
```

### Unified diff

````diff
--- "docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-125"
+++ "docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#dev-source-activation-restoration-stub"
@@ -1,6 +1,26 @@
-```txt
-artifactDigest: dev:<sourceRevisionOrWorktreeId>
-activationKind: dev-source
-activeReleasePath: <source checkout path>
-distributable: false
-```
\ No newline at end of file
+## Dev Source Activation Restoration Stub
+
+Added in candidate — not carried; restoration tracked by dropped-001 and Plan C.
+
+Restoration owner: Plan C (`plans/261006-1445-fgctl-dev-activation/`, draft, unscheduled). This is an explicit deferral of the seven source units, not an implementation or retirement verdict. The six units under Dev / Source Activation and the dev-source clause in the compound settled-facts table remain tracked in the source register. All other clauses of that table are retained below without promoting dev activation.
+
+| Decision | Status |
+|---|---|
+| Runtime identity is digest-based, not PATH-based. | Settled for V1. |
+| `artifactDigest` is the digest of the canonical release tree manifest, not an archive digest. | Settled for V1. |
+| Release tree manifest uses normalized logical paths and refuses symlinks/case collisions in V1. | Settled for V1. |
+| Project commands enter through stable local shims under workspace `.fgos/installation/bin/`. | Settled for V1. |
+| Immutable release payloads live under a shared content-addressed machine/trust-domain release store, not under each worktree. | Settled for V1. |
+| Activation is per workspace via `.fgos/installation/activation.json`; there is no single repository-wide active runtime pointer in V1. | Settled for V1. |
+| Packaging release/activation state uses workspace installation roots and must not share a namespace with work coordination state. | Settled for V1. |
+| The project/team pin is tracked as `.fgos/distribution.json`; machine-local activation state remains ignored. | Settled for V1. |
+| `activation.json` is a durably published workspace binding, not a symlink, in V1. | Settled for V1. |
+| Install transaction state lives under the release store root's `installs/<activationId>.json`, not inside `activation.json`. | Settled for V1. |
+| Mutating invocations create lease files; `fgctl` may stage/verify during leases but refuses activation while a non-stale mutating lease exists. | Settled for V1. |
+| V1 does not do automatic state migration during upgrade/rollback. | Settled for V1. |
+| `fgctl` never writes host-visible projection files directly; local `fgos init` / `doctor --fix` owns projection materialization under active identity. | Settled for V1. |
+| Existing projects are adoptable: a missing state schema record is treated as schema `1` and written during local `fgos init`. | Settled for V1. |
+| Dev / source activation restoration is tracked by dropped-001 and Plan C. | Deferred; not carried in this candidate. |
+| `fgctl` V1 is a Rust bootstrap binary with local path/tarball and GitHub release asset as acquisition sources. | Settled for V1. |
+| Candidate preflight is static: `fgctl` never executes candidate release code before the ready binding is published. | Settled for V1 (P7 red-team fix, 2026-09-14). |
+| Shared gateway/web are architecture constraints only, not active delivery scope. | Promoted for active delivery. |
\ No newline at end of file
````

## claim_3b558cb40f932564057bd64e5d7e024b

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-126

Target: docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#dev-source-activation-restoration-stub

Source identity digest: `c5b60269a59c089f5f65d887f3c94aad46db63cb786f98293fb892cb3ed6ed86`

Target identity digest: `2cda289ff834706e95ac82903eb9518fc523d85011a80349900cb627158ddde1`

Source shown SHA256: `c5b60269a59c089f5f65d887f3c94aad46db63cb786f98293fb892cb3ed6ed86`

Target shown SHA256: `43976f11724a656ad1ad1aa763e8cc3cbc3e4b1090279e9aacf3778241835d5a`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_3b558cb40f932564057bd64e5d7e024b |
| sourceUnitDigest | c5b60269a59c089f5f65d887f3c94aad46db63cb786f98293fb892cb3ed6ed86 |
| targetOwner | docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md |
| targetAnchor | dev-source-activation-restoration-stub |
| claimKind | architecture |
| disposition | defer-with-owner |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The unheaded-block at docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-126 is one of the seven registered dev/source activation units. Restore remains owned by Plan C; the labelled stub tracks this exact unit. For the compound table, all non-dev clauses are retained in the stub companion table. No implementation or retirement verdict is asserted. |
| stubOwner | docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md |
| stubAnchor | dev-source-activation-restoration-stub |

### Source unit

```text
Dev activation rules:

- must be explicit; never selected as an accidental PATH fallback;
- skips immutable release file digest guarantees;
- still reports runtime identity as `dev:*`;
- still uses the same command authority, work-state root, projection ownership,
  and state-schema compatibility rules;
- is not valid for a distributable install package.
```

### Target unit

```text
## Dev Source Activation Restoration Stub

Added in candidate — not carried; restoration tracked by dropped-001 and Plan C.

Restoration owner: Plan C (`plans/261006-1445-fgctl-dev-activation/`, draft, unscheduled). This is an explicit deferral of the seven source units, not an implementation or retirement verdict. The six units under Dev / Source Activation and the dev-source clause in the compound settled-facts table remain tracked in the source register. All other clauses of that table are retained below without promoting dev activation.

| Decision | Status |
|---|---|
| Runtime identity is digest-based, not PATH-based. | Settled for V1. |
| `artifactDigest` is the digest of the canonical release tree manifest, not an archive digest. | Settled for V1. |
| Release tree manifest uses normalized logical paths and refuses symlinks/case collisions in V1. | Settled for V1. |
| Project commands enter through stable local shims under workspace `.fgos/installation/bin/`. | Settled for V1. |
| Immutable release payloads live under a shared content-addressed machine/trust-domain release store, not under each worktree. | Settled for V1. |
| Activation is per workspace via `.fgos/installation/activation.json`; there is no single repository-wide active runtime pointer in V1. | Settled for V1. |
| Packaging release/activation state uses workspace installation roots and must not share a namespace with work coordination state. | Settled for V1. |
| The project/team pin is tracked as `.fgos/distribution.json`; machine-local activation state remains ignored. | Settled for V1. |
| `activation.json` is a durably published workspace binding, not a symlink, in V1. | Settled for V1. |
| Install transaction state lives under the release store root's `installs/<activationId>.json`, not inside `activation.json`. | Settled for V1. |
| Mutating invocations create lease files; `fgctl` may stage/verify during leases but refuses activation while a non-stale mutating lease exists. | Settled for V1. |
| V1 does not do automatic state migration during upgrade/rollback. | Settled for V1. |
| `fgctl` never writes host-visible projection files directly; local `fgos init` / `doctor --fix` owns projection materialization under active identity. | Settled for V1. |
| Existing projects are adoptable: a missing state schema record is treated as schema `1` and written during local `fgos init`. | Settled for V1. |
| Dev / source activation restoration is tracked by dropped-001 and Plan C. | Deferred; not carried in this candidate. |
| `fgctl` V1 is a Rust bootstrap binary with local path/tarball and GitHub release asset as acquisition sources. | Settled for V1. |
| Candidate preflight is static: `fgctl` never executes candidate release code before the ready binding is published. | Settled for V1 (P7 red-team fix, 2026-09-14). |
| Shared gateway/web are architecture constraints only, not active delivery scope. | Promoted for active delivery. |
```

### Unified diff

```diff
--- "docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-126"
+++ "docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#dev-source-activation-restoration-stub"
@@ -1,8 +1,26 @@
-Dev activation rules:
+## Dev Source Activation Restoration Stub
 
-- must be explicit; never selected as an accidental PATH fallback;
-- skips immutable release file digest guarantees;
-- still reports runtime identity as `dev:*`;
-- still uses the same command authority, work-state root, projection ownership,
-  and state-schema compatibility rules;
-- is not valid for a distributable install package.
\ No newline at end of file
+Added in candidate — not carried; restoration tracked by dropped-001 and Plan C.
+
+Restoration owner: Plan C (`plans/261006-1445-fgctl-dev-activation/`, draft, unscheduled). This is an explicit deferral of the seven source units, not an implementation or retirement verdict. The six units under Dev / Source Activation and the dev-source clause in the compound settled-facts table remain tracked in the source register. All other clauses of that table are retained below without promoting dev activation.
+
+| Decision | Status |
+|---|---|
+| Runtime identity is digest-based, not PATH-based. | Settled for V1. |
+| `artifactDigest` is the digest of the canonical release tree manifest, not an archive digest. | Settled for V1. |
+| Release tree manifest uses normalized logical paths and refuses symlinks/case collisions in V1. | Settled for V1. |
+| Project commands enter through stable local shims under workspace `.fgos/installation/bin/`. | Settled for V1. |
+| Immutable release payloads live under a shared content-addressed machine/trust-domain release store, not under each worktree. | Settled for V1. |
+| Activation is per workspace via `.fgos/installation/activation.json`; there is no single repository-wide active runtime pointer in V1. | Settled for V1. |
+| Packaging release/activation state uses workspace installation roots and must not share a namespace with work coordination state. | Settled for V1. |
+| The project/team pin is tracked as `.fgos/distribution.json`; machine-local activation state remains ignored. | Settled for V1. |
+| `activation.json` is a durably published workspace binding, not a symlink, in V1. | Settled for V1. |
+| Install transaction state lives under the release store root's `installs/<activationId>.json`, not inside `activation.json`. | Settled for V1. |
+| Mutating invocations create lease files; `fgctl` may stage/verify during leases but refuses activation while a non-stale mutating lease exists. | Settled for V1. |
+| V1 does not do automatic state migration during upgrade/rollback. | Settled for V1. |
+| `fgctl` never writes host-visible projection files directly; local `fgos init` / `doctor --fix` owns projection materialization under active identity. | Settled for V1. |
+| Existing projects are adoptable: a missing state schema record is treated as schema `1` and written during local `fgos init`. | Settled for V1. |
+| Dev / source activation restoration is tracked by dropped-001 and Plan C. | Deferred; not carried in this candidate. |
+| `fgctl` V1 is a Rust bootstrap binary with local path/tarball and GitHub release asset as acquisition sources. | Settled for V1. |
+| Candidate preflight is static: `fgctl` never executes candidate release code before the ready binding is published. | Settled for V1 (P7 red-team fix, 2026-09-14). |
+| Shared gateway/web are architecture constraints only, not active delivery scope. | Promoted for active delivery. |
\ No newline at end of file
```

## claim_b4018a4e982ca86c1f265cfe32a05494

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-127

Target: docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#dev-source-activation-restoration-stub

Source identity digest: `7e3f5e9aeda86c61f68de30e4d5a9b2b817a0dfb720845d3464c86832cf88b93`

Target identity digest: `2cda289ff834706e95ac82903eb9518fc523d85011a80349900cb627158ddde1`

Source shown SHA256: `7e3f5e9aeda86c61f68de30e4d5a9b2b817a0dfb720845d3464c86832cf88b93`

Target shown SHA256: `43976f11724a656ad1ad1aa763e8cc3cbc3e4b1090279e9aacf3778241835d5a`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_b4018a4e982ca86c1f265cfe32a05494 |
| sourceUnitDigest | 7e3f5e9aeda86c61f68de30e4d5a9b2b817a0dfb720845d3464c86832cf88b93 |
| targetOwner | docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md |
| targetAnchor | dev-source-activation-restoration-stub |
| claimKind | architecture |
| disposition | defer-with-owner |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The unheaded-block at docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-127 is one of the seven registered dev/source activation units. Restore remains owned by Plan C; the labelled stub tracks this exact unit. For the compound table, all non-dev clauses are retained in the stub companion table. No implementation or retirement verdict is asserted. |
| stubOwner | docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md |
| stubAnchor | dev-source-activation-restoration-stub |

### Source unit

```text
This preserves dogfood without turning dogfood into the product mission and
without solving self-development by nesting a product repo inside a workshop
repo.
```

### Target unit

```text
## Dev Source Activation Restoration Stub

Added in candidate — not carried; restoration tracked by dropped-001 and Plan C.

Restoration owner: Plan C (`plans/261006-1445-fgctl-dev-activation/`, draft, unscheduled). This is an explicit deferral of the seven source units, not an implementation or retirement verdict. The six units under Dev / Source Activation and the dev-source clause in the compound settled-facts table remain tracked in the source register. All other clauses of that table are retained below without promoting dev activation.

| Decision | Status |
|---|---|
| Runtime identity is digest-based, not PATH-based. | Settled for V1. |
| `artifactDigest` is the digest of the canonical release tree manifest, not an archive digest. | Settled for V1. |
| Release tree manifest uses normalized logical paths and refuses symlinks/case collisions in V1. | Settled for V1. |
| Project commands enter through stable local shims under workspace `.fgos/installation/bin/`. | Settled for V1. |
| Immutable release payloads live under a shared content-addressed machine/trust-domain release store, not under each worktree. | Settled for V1. |
| Activation is per workspace via `.fgos/installation/activation.json`; there is no single repository-wide active runtime pointer in V1. | Settled for V1. |
| Packaging release/activation state uses workspace installation roots and must not share a namespace with work coordination state. | Settled for V1. |
| The project/team pin is tracked as `.fgos/distribution.json`; machine-local activation state remains ignored. | Settled for V1. |
| `activation.json` is a durably published workspace binding, not a symlink, in V1. | Settled for V1. |
| Install transaction state lives under the release store root's `installs/<activationId>.json`, not inside `activation.json`. | Settled for V1. |
| Mutating invocations create lease files; `fgctl` may stage/verify during leases but refuses activation while a non-stale mutating lease exists. | Settled for V1. |
| V1 does not do automatic state migration during upgrade/rollback. | Settled for V1. |
| `fgctl` never writes host-visible projection files directly; local `fgos init` / `doctor --fix` owns projection materialization under active identity. | Settled for V1. |
| Existing projects are adoptable: a missing state schema record is treated as schema `1` and written during local `fgos init`. | Settled for V1. |
| Dev / source activation restoration is tracked by dropped-001 and Plan C. | Deferred; not carried in this candidate. |
| `fgctl` V1 is a Rust bootstrap binary with local path/tarball and GitHub release asset as acquisition sources. | Settled for V1. |
| Candidate preflight is static: `fgctl` never executes candidate release code before the ready binding is published. | Settled for V1 (P7 red-team fix, 2026-09-14). |
| Shared gateway/web are architecture constraints only, not active delivery scope. | Promoted for active delivery. |
```

### Unified diff

```diff
--- "docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-127"
+++ "docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#dev-source-activation-restoration-stub"
@@ -1,3 +1,26 @@
-This preserves dogfood without turning dogfood into the product mission and
-without solving self-development by nesting a product repo inside a workshop
-repo.
\ No newline at end of file
+## Dev Source Activation Restoration Stub
+
+Added in candidate — not carried; restoration tracked by dropped-001 and Plan C.
+
+Restoration owner: Plan C (`plans/261006-1445-fgctl-dev-activation/`, draft, unscheduled). This is an explicit deferral of the seven source units, not an implementation or retirement verdict. The six units under Dev / Source Activation and the dev-source clause in the compound settled-facts table remain tracked in the source register. All other clauses of that table are retained below without promoting dev activation.
+
+| Decision | Status |
+|---|---|
+| Runtime identity is digest-based, not PATH-based. | Settled for V1. |
+| `artifactDigest` is the digest of the canonical release tree manifest, not an archive digest. | Settled for V1. |
+| Release tree manifest uses normalized logical paths and refuses symlinks/case collisions in V1. | Settled for V1. |
+| Project commands enter through stable local shims under workspace `.fgos/installation/bin/`. | Settled for V1. |
+| Immutable release payloads live under a shared content-addressed machine/trust-domain release store, not under each worktree. | Settled for V1. |
+| Activation is per workspace via `.fgos/installation/activation.json`; there is no single repository-wide active runtime pointer in V1. | Settled for V1. |
+| Packaging release/activation state uses workspace installation roots and must not share a namespace with work coordination state. | Settled for V1. |
+| The project/team pin is tracked as `.fgos/distribution.json`; machine-local activation state remains ignored. | Settled for V1. |
+| `activation.json` is a durably published workspace binding, not a symlink, in V1. | Settled for V1. |
+| Install transaction state lives under the release store root's `installs/<activationId>.json`, not inside `activation.json`. | Settled for V1. |
+| Mutating invocations create lease files; `fgctl` may stage/verify during leases but refuses activation while a non-stale mutating lease exists. | Settled for V1. |
+| V1 does not do automatic state migration during upgrade/rollback. | Settled for V1. |
+| `fgctl` never writes host-visible projection files directly; local `fgos init` / `doctor --fix` owns projection materialization under active identity. | Settled for V1. |
+| Existing projects are adoptable: a missing state schema record is treated as schema `1` and written during local `fgos init`. | Settled for V1. |
+| Dev / source activation restoration is tracked by dropped-001 and Plan C. | Deferred; not carried in this candidate. |
+| `fgctl` V1 is a Rust bootstrap binary with local path/tarball and GitHub release asset as acquisition sources. | Settled for V1. |
+| Candidate preflight is static: `fgctl` never executes candidate release code before the ready binding is published. | Settled for V1 (P7 red-team fix, 2026-09-14). |
+| Shared gateway/web are architecture constraints only, not active delivery scope. | Promoted for active delivery. |
\ No newline at end of file
```

## claim_bc6c80a5dbb5b49aa616db0b538022ba

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#11-drift-repair-rollback-and-quarantine

Target: docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#11-drift-repair-rollback-and-quarantine

Source identity digest: `6a37fc07266052c74e57040a68f547acd666f004c57467289b7d085a8c457aaf`

Target identity digest: `825d187be82f486aaca968ce8ad77b74803e4d5067824980233f9fb4f8f18d0d`

Source shown SHA256: `c3c7b0f8910b1bd2a037d15b0b4c8087fa6ec95cb0cea051bcf8b1a819b30de4`

Target shown SHA256: `1bc0371b34537749721a5cfd2c7b31b486b86ab14d78d551ae1cfa44c125e466`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_bc6c80a5dbb5b49aa616db0b538022ba |
| sourceUnitDigest | 6a37fc07266052c74e57040a68f547acd666f004c57467289b7d085a8c457aaf |
| targetOwner | docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md |
| targetAnchor | 11-drift-repair-rollback-and-quarantine |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete heading from docs/architect/packaging-distribution/runtime-identity-and-activation.md#11-drift-repair-rollback-and-quarantine, under "11. Drift, Repair, Rollback, And Quarantine", is retained at docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#11-drift-repair-rollback-and-quarantine. Only heading depth changes; the direct section payload follows the original source order. The named owner is the architecture/runtime-identity-and-activation.md topic owner; carriage does not certify current implementation. |

### Source unit

````text
## 11. Drift, Repair, Rollback, And Quarantine

Drift classes:

| Drift | Detector | Allowed Automatic Action |
|---|---|---|
| Immutable release file digest mismatch | `fgctl verify` or local `fgos doctor` reporting active identity | Quarantine/refuse. Do not patch individual release files. |
| Projection differs from generated baseline | local `fgos doctor` | `doctor --fix` may repair only when ownership and three-way comparison allow it. |
| Managed config differs from default | local `fgos doctor` | Schema-aware merge if registered as safe. |
| Mutable state/log/cache differs | N/A | Excluded from release drift. |

`fgctl init`, `fgctl repair`, and `fgctl upgrade` use one pipeline:

```txt
select/acquire release
  -> stage
  -> verify
  -> run candidate preflight without host-visible projection writes
  -> ensure workspace installation capsule and stable shims
  -> publish workspace activation binding as ready
  -> invoke active local fgos init
  -> invoke active local fgos doctor --fix
  -> invoke active local fgos doctor
```

They differ by selection input, not by having separate repair semantics. The
transaction reaches `complete` only after the active local init/fix/check tail
finishes. If the post-publish tail fails, the new binding remains authoritative
but the transaction is `ready-degraded` and local doctor reports the needed
repair. Candidate preflight failure before publish leaves the previous
workspace activation binding authoritative and gives the candidate no writer
authority.

Local `fgos doctor --fix` may not change active runtime identity or patch
immutable release files. Runtime repair stays `fgctl` authority.

Rollback unit:

```txt
ActivationRecord.previousArtifactDigest
  + preserved release directory
  + state-schema compatibility check
```

If rollback cannot safely write current state, it may still allow read-only
diagnostics if the old runtime declares read compatibility.

Quarantine rule:

```txt
If an immutable release payload fails identity verification, move or mark it as
quarantined and refuse activation/use until `fgctl repair` reacquires a trusted
artifact.
```
````

### Target unit

````text
#### 11. Drift, Repair, Rollback, And Quarantine

Drift classes:

| Drift | Detector | Allowed Automatic Action |
|---|---|---|
| Immutable release file digest mismatch | `fgctl verify` or local `fgos doctor` reporting active identity | Quarantine/refuse. Do not patch individual release files. |
| Projection differs from generated baseline | local `fgos doctor` | `doctor --fix` may repair only when ownership and three-way comparison allow it. |
| Managed config differs from default | local `fgos doctor` | Schema-aware merge if registered as safe. |
| Mutable state/log/cache differs | N/A | Excluded from release drift. |

`fgctl init`, `fgctl repair`, and `fgctl upgrade` use one pipeline:

```txt
select/acquire release
  -> stage
  -> verify
  -> run candidate preflight without host-visible projection writes
  -> ensure workspace installation capsule and stable shims
  -> publish workspace activation binding as ready
  -> invoke active local fgos init
  -> invoke active local fgos doctor --fix
  -> invoke active local fgos doctor
```

They differ by selection input, not by having separate repair semantics. The
transaction reaches `complete` only after the active local init/fix/check tail
finishes. If the post-publish tail fails, the new binding remains authoritative
but the transaction is `ready-degraded` and local doctor reports the needed
repair. Candidate preflight failure before publish leaves the previous
workspace activation binding authoritative and gives the candidate no writer
authority.

Local `fgos doctor --fix` may not change active runtime identity or patch
immutable release files. Runtime repair stays `fgctl` authority.

Rollback unit:

```txt
ActivationRecord.previousArtifactDigest
  + preserved release directory
  + state-schema compatibility check
```

If rollback cannot safely write current state, it may still allow read-only
diagnostics if the old runtime declares read compatibility.

Quarantine rule:

```txt
If an immutable release payload fails identity verification, move or mark it as
quarantined and refuse activation/use until `fgctl repair` reacquires a trusted
artifact.
```
````

### Unified diff

```diff
--- "docs/architect/packaging-distribution/runtime-identity-and-activation.md#11-drift-repair-rollback-and-quarantine"
+++ "docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#11-drift-repair-rollback-and-quarantine"
@@ -1,4 +1,4 @@
-## 11. Drift, Repair, Rollback, And Quarantine
+#### 11. Drift, Repair, Rollback, And Quarantine
 
 Drift classes:
```

## claim_822b8a0d68b2d83e3d093e45be2e77e8

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-128

Target: docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#unheaded-block-40

Source identity digest: `12b5bcbf4641d713eb20b90aacb9103660ab51c676ef51c72deacdaf9e3735b1`

Target identity digest: `12b5bcbf4641d713eb20b90aacb9103660ab51c676ef51c72deacdaf9e3735b1`

Source shown SHA256: `12b5bcbf4641d713eb20b90aacb9103660ab51c676ef51c72deacdaf9e3735b1`

Target shown SHA256: `12b5bcbf4641d713eb20b90aacb9103660ab51c676ef51c72deacdaf9e3735b1`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_822b8a0d68b2d83e3d093e45be2e77e8 |
| sourceUnitDigest | 12b5bcbf4641d713eb20b90aacb9103660ab51c676ef51c72deacdaf9e3735b1 |
| targetOwner | docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md |
| targetAnchor | unheaded-block-40 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-128, under "11. Drift, Repair, Rollback, And Quarantine", is retained at docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#unheaded-block-40. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the architecture/runtime-identity-and-activation.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
Drift classes:

| Drift | Detector | Allowed Automatic Action |
|---|---|---|
| Immutable release file digest mismatch | `fgctl verify` or local `fgos doctor` reporting active identity | Quarantine/refuse. Do not patch individual release files. |
| Projection differs from generated baseline | local `fgos doctor` | `doctor --fix` may repair only when ownership and three-way comparison allow it. |
| Managed config differs from default | local `fgos doctor` | Schema-aware merge if registered as safe. |
| Mutable state/log/cache differs | N/A | Excluded from release drift. |
```

### Target unit

```text
Drift classes:

| Drift | Detector | Allowed Automatic Action |
|---|---|---|
| Immutable release file digest mismatch | `fgctl verify` or local `fgos doctor` reporting active identity | Quarantine/refuse. Do not patch individual release files. |
| Projection differs from generated baseline | local `fgos doctor` | `doctor --fix` may repair only when ownership and three-way comparison allow it. |
| Managed config differs from default | local `fgos doctor` | Schema-aware merge if registered as safe. |
| Mutable state/log/cache differs | N/A | Excluded from release drift. |
```

### Unified diff

```diff
No text difference.
```

## claim_28574a962da3d238b368e94888838811

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-129

Target: docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#unheaded-block-41

Source identity digest: `a4bb3aa70ebac2ed80da9d9aab6af6cc373eb41589b1a0ba0c45de20c9a9fc40`

Target identity digest: `a4bb3aa70ebac2ed80da9d9aab6af6cc373eb41589b1a0ba0c45de20c9a9fc40`

Source shown SHA256: `a4bb3aa70ebac2ed80da9d9aab6af6cc373eb41589b1a0ba0c45de20c9a9fc40`

Target shown SHA256: `a4bb3aa70ebac2ed80da9d9aab6af6cc373eb41589b1a0ba0c45de20c9a9fc40`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_28574a962da3d238b368e94888838811 |
| sourceUnitDigest | a4bb3aa70ebac2ed80da9d9aab6af6cc373eb41589b1a0ba0c45de20c9a9fc40 |
| targetOwner | docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md |
| targetAnchor | unheaded-block-41 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-129, under "11. Drift, Repair, Rollback, And Quarantine", is retained at docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#unheaded-block-41. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the architecture/runtime-identity-and-activation.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
`fgctl init`, `fgctl repair`, and `fgctl upgrade` use one pipeline:
```

### Target unit

```text
`fgctl init`, `fgctl repair`, and `fgctl upgrade` use one pipeline:
```

### Unified diff

```diff
No text difference.
```

## claim_c528c54251a8a068ed907a33f2231af0

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-130

Target: docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#unheaded-block-42

Source identity digest: `4858351982325a4ac8a61c370e58c5a13d57b596f8ab006631fad4ad44f535f7`

Target identity digest: `4858351982325a4ac8a61c370e58c5a13d57b596f8ab006631fad4ad44f535f7`

Source shown SHA256: `4858351982325a4ac8a61c370e58c5a13d57b596f8ab006631fad4ad44f535f7`

Target shown SHA256: `4858351982325a4ac8a61c370e58c5a13d57b596f8ab006631fad4ad44f535f7`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_c528c54251a8a068ed907a33f2231af0 |
| sourceUnitDigest | 4858351982325a4ac8a61c370e58c5a13d57b596f8ab006631fad4ad44f535f7 |
| targetOwner | docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md |
| targetAnchor | unheaded-block-42 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-130, under "11. Drift, Repair, Rollback, And Quarantine", is retained at docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#unheaded-block-42. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the architecture/runtime-identity-and-activation.md topic owner; carriage does not certify current implementation. |

### Source unit

````text
```txt
select/acquire release
  -> stage
  -> verify
  -> run candidate preflight without host-visible projection writes
  -> ensure workspace installation capsule and stable shims
  -> publish workspace activation binding as ready
  -> invoke active local fgos init
  -> invoke active local fgos doctor --fix
  -> invoke active local fgos doctor
```
````

### Target unit

````text
```txt
select/acquire release
  -> stage
  -> verify
  -> run candidate preflight without host-visible projection writes
  -> ensure workspace installation capsule and stable shims
  -> publish workspace activation binding as ready
  -> invoke active local fgos init
  -> invoke active local fgos doctor --fix
  -> invoke active local fgos doctor
```
````

### Unified diff

```diff
No text difference.
```

## claim_9951c6bd4ccb66c41b615e5738a97d03

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-131

Target: docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#unheaded-block-43

Source identity digest: `3c79eca349037f63e9ed3dc5cf74a3a6b81e4f8e7c78a95e269fbdde577449f7`

Target identity digest: `3c79eca349037f63e9ed3dc5cf74a3a6b81e4f8e7c78a95e269fbdde577449f7`

Source shown SHA256: `3c79eca349037f63e9ed3dc5cf74a3a6b81e4f8e7c78a95e269fbdde577449f7`

Target shown SHA256: `3c79eca349037f63e9ed3dc5cf74a3a6b81e4f8e7c78a95e269fbdde577449f7`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_9951c6bd4ccb66c41b615e5738a97d03 |
| sourceUnitDigest | 3c79eca349037f63e9ed3dc5cf74a3a6b81e4f8e7c78a95e269fbdde577449f7 |
| targetOwner | docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md |
| targetAnchor | unheaded-block-43 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-131, under "11. Drift, Repair, Rollback, And Quarantine", is retained at docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#unheaded-block-43. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the architecture/runtime-identity-and-activation.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
They differ by selection input, not by having separate repair semantics. The
transaction reaches `complete` only after the active local init/fix/check tail
finishes. If the post-publish tail fails, the new binding remains authoritative
but the transaction is `ready-degraded` and local doctor reports the needed
repair. Candidate preflight failure before publish leaves the previous
workspace activation binding authoritative and gives the candidate no writer
authority.
```

### Target unit

```text
They differ by selection input, not by having separate repair semantics. The
transaction reaches `complete` only after the active local init/fix/check tail
finishes. If the post-publish tail fails, the new binding remains authoritative
but the transaction is `ready-degraded` and local doctor reports the needed
repair. Candidate preflight failure before publish leaves the previous
workspace activation binding authoritative and gives the candidate no writer
authority.
```

### Unified diff

```diff
No text difference.
```

## claim_96f22a8e9502051138cfd569f9d1284d

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-132

Target: docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#unheaded-block-44

Source identity digest: `db2ff2c8d78686ed9e68c7aca0a2a30e8171ba74d393b0a87254fb9789827fd9`

Target identity digest: `db2ff2c8d78686ed9e68c7aca0a2a30e8171ba74d393b0a87254fb9789827fd9`

Source shown SHA256: `db2ff2c8d78686ed9e68c7aca0a2a30e8171ba74d393b0a87254fb9789827fd9`

Target shown SHA256: `db2ff2c8d78686ed9e68c7aca0a2a30e8171ba74d393b0a87254fb9789827fd9`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_96f22a8e9502051138cfd569f9d1284d |
| sourceUnitDigest | db2ff2c8d78686ed9e68c7aca0a2a30e8171ba74d393b0a87254fb9789827fd9 |
| targetOwner | docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md |
| targetAnchor | unheaded-block-44 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-132, under "11. Drift, Repair, Rollback, And Quarantine", is retained at docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#unheaded-block-44. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the architecture/runtime-identity-and-activation.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
Local `fgos doctor --fix` may not change active runtime identity or patch
immutable release files. Runtime repair stays `fgctl` authority.
```

### Target unit

```text
Local `fgos doctor --fix` may not change active runtime identity or patch
immutable release files. Runtime repair stays `fgctl` authority.
```

### Unified diff

```diff
No text difference.
```

## claim_94cacafd8c1528537a1a34e34c0d9a5a

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-133

Target: docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#unheaded-block-45

Source identity digest: `b1d32ac950cf9f02e8d99ade148c86a0d8fcfe5192d1ed4c9fc4cff28f4ccdc3`

Target identity digest: `b1d32ac950cf9f02e8d99ade148c86a0d8fcfe5192d1ed4c9fc4cff28f4ccdc3`

Source shown SHA256: `b1d32ac950cf9f02e8d99ade148c86a0d8fcfe5192d1ed4c9fc4cff28f4ccdc3`

Target shown SHA256: `b1d32ac950cf9f02e8d99ade148c86a0d8fcfe5192d1ed4c9fc4cff28f4ccdc3`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_94cacafd8c1528537a1a34e34c0d9a5a |
| sourceUnitDigest | b1d32ac950cf9f02e8d99ade148c86a0d8fcfe5192d1ed4c9fc4cff28f4ccdc3 |
| targetOwner | docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md |
| targetAnchor | unheaded-block-45 |
| claimKind | contract |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-133, under "11. Drift, Repair, Rollback, And Quarantine", is retained at docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#unheaded-block-45. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the architecture/runtime-identity-and-activation.md topic owner; carriage does not certify current implementation. |

### Source unit

````text
Rollback unit:

```txt
ActivationRecord.previousArtifactDigest
  + preserved release directory
  + state-schema compatibility check
```
````

### Target unit

````text
Rollback unit:

```txt
ActivationRecord.previousArtifactDigest
  + preserved release directory
  + state-schema compatibility check
```
````

### Unified diff

```diff
No text difference.
```

## claim_758a0cbdf10b65b416cb9d69f5a335f2

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-134

Target: docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#unheaded-block-46

Source identity digest: `7840c891652d9cd51adafd17d10e4ae80dcaa0a5736eecdb15d1939fcd4f2c1c`

Target identity digest: `7840c891652d9cd51adafd17d10e4ae80dcaa0a5736eecdb15d1939fcd4f2c1c`

Source shown SHA256: `7840c891652d9cd51adafd17d10e4ae80dcaa0a5736eecdb15d1939fcd4f2c1c`

Target shown SHA256: `7840c891652d9cd51adafd17d10e4ae80dcaa0a5736eecdb15d1939fcd4f2c1c`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_758a0cbdf10b65b416cb9d69f5a335f2 |
| sourceUnitDigest | 7840c891652d9cd51adafd17d10e4ae80dcaa0a5736eecdb15d1939fcd4f2c1c |
| targetOwner | docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md |
| targetAnchor | unheaded-block-46 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-134, under "11. Drift, Repair, Rollback, And Quarantine", is retained at docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#unheaded-block-46. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the architecture/runtime-identity-and-activation.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
If rollback cannot safely write current state, it may still allow read-only
diagnostics if the old runtime declares read compatibility.
```

### Target unit

```text
If rollback cannot safely write current state, it may still allow read-only
diagnostics if the old runtime declares read compatibility.
```

### Unified diff

```diff
No text difference.
```

## claim_50f9705e563bfc2722ba75dba06b2b55

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-135

Target: docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#unheaded-block-47

Source identity digest: `b6807b0682c778d6ddc1647782ebbcfce2bc72d308d580c5ec617a3b5dec6bc7`

Target identity digest: `b6807b0682c778d6ddc1647782ebbcfce2bc72d308d580c5ec617a3b5dec6bc7`

Source shown SHA256: `b6807b0682c778d6ddc1647782ebbcfce2bc72d308d580c5ec617a3b5dec6bc7`

Target shown SHA256: `b6807b0682c778d6ddc1647782ebbcfce2bc72d308d580c5ec617a3b5dec6bc7`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_50f9705e563bfc2722ba75dba06b2b55 |
| sourceUnitDigest | b6807b0682c778d6ddc1647782ebbcfce2bc72d308d580c5ec617a3b5dec6bc7 |
| targetOwner | docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md |
| targetAnchor | unheaded-block-47 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-135, under "11. Drift, Repair, Rollback, And Quarantine", is retained at docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#unheaded-block-47. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the architecture/runtime-identity-and-activation.md topic owner; carriage does not certify current implementation. |

### Source unit

````text
Quarantine rule:

```txt
If an immutable release payload fails identity verification, move or mark it as
quarantined and refuse activation/use until `fgctl repair` reacquires a trusted
artifact.
```
````

### Target unit

````text
Quarantine rule:

```txt
If an immutable release payload fails identity verification, move or mark it as
quarantined and refuse activation/use until `fgctl repair` reacquires a trusted
artifact.
```
````

### Unified diff

```diff
No text difference.
```

## claim_d00aa510f8e3a7395320c9636c3a5528

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#12-command-authority-matrix

Target: docs/platform/packaging-distribution/architecture/fgctl-and-local-fgos.md#12-command-authority-matrix

Source identity digest: `6a943609628d25d000536330e47f40ed919eb319b1db69b8d960f6262e0df341`

Target identity digest: `afd739eccbb21c60ad472bd711a301800f874448ba1b8e930f178af2cfaf0760`

Source shown SHA256: `a03adc6b16c0ba99f1c3fc616de8294345e26aea6fdbace091fc32489f6b976d`

Target shown SHA256: `ff2e539631308bd593f73f8daafd0aaf2dbf27cb71d58849777ba8c9c294c2f1`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_d00aa510f8e3a7395320c9636c3a5528 |
| sourceUnitDigest | 6a943609628d25d000536330e47f40ed919eb319b1db69b8d960f6262e0df341 |
| targetOwner | docs/platform/packaging-distribution/architecture/fgctl-and-local-fgos.md |
| targetAnchor | 12-command-authority-matrix |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete heading from docs/architect/packaging-distribution/runtime-identity-and-activation.md#12-command-authority-matrix, under "12. Command Authority Matrix", is retained at docs/platform/packaging-distribution/architecture/fgctl-and-local-fgos.md#12-command-authority-matrix. Only heading depth changes; the direct section payload follows the original source order. The named owner is the architecture/fgctl-and-local-fgos.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
## 12. Command Authority Matrix

| Command | May Change Runtime Identity | May Change Workspace Config/State | May Materialize Projections | Notes |
|---|---:|---:|---:|---|
| `fgctl init` | Yes | Indirectly, by invoking active local `fgos init` after publishing ready binding | Indirectly after activation | One-command onboarding orchestrator; installs stable local shims if missing. Candidate preflight before publish must not write host-visible projections. |
| `fgctl repair` | Yes | Indirectly, through the same active init/fix/check tail | Indirectly after activation | Reacquires/repairs runtime payload, publishes ready binding, then repairs projections/config through local fgos. |
| `fgctl upgrade` | Yes | Indirectly, through the same active init/fix/check tail; no automatic state migration in V1 | Indirectly after activation | Must verify state-schema compatibility before publishing ready binding. |
| local `fgos init` | No | Yes | Yes | Adopts workspace under active runtime identity. |
| local `fgos doctor` | No | No | No | Read-only report. |
| local `fgos doctor --fix` | No | Yes, only registered safe fixes | Yes, only safe projection repair | Must not patch release payload files. |
| local workflow verbs | No | Yes | No, unless explicitly part of operation | Must lease active runtime identity. |
```

### Target unit

```text
#### 12. Command Authority Matrix

| Command | May Change Runtime Identity | May Change Workspace Config/State | May Materialize Projections | Notes |
|---|---:|---:|---:|---|
| `fgctl init` | Yes | Indirectly, by invoking active local `fgos init` after publishing ready binding | Indirectly after activation | One-command onboarding orchestrator; installs stable local shims if missing. Candidate preflight before publish must not write host-visible projections. |
| `fgctl repair` | Yes | Indirectly, through the same active init/fix/check tail | Indirectly after activation | Reacquires/repairs runtime payload, publishes ready binding, then repairs projections/config through local fgos. |
| `fgctl upgrade` | Yes | Indirectly, through the same active init/fix/check tail; no automatic state migration in V1 | Indirectly after activation | Must verify state-schema compatibility before publishing ready binding. |
| local `fgos init` | No | Yes | Yes | Adopts workspace under active runtime identity. |
| local `fgos doctor` | No | No | No | Read-only report. |
| local `fgos doctor --fix` | No | Yes, only registered safe fixes | Yes, only safe projection repair | Must not patch release payload files. |
| local workflow verbs | No | Yes | No, unless explicitly part of operation | Must lease active runtime identity. |
```

### Unified diff

```diff
--- "docs/architect/packaging-distribution/runtime-identity-and-activation.md#12-command-authority-matrix"
+++ "docs/platform/packaging-distribution/architecture/fgctl-and-local-fgos.md#12-command-authority-matrix"
@@ -1,4 +1,4 @@
-## 12. Command Authority Matrix
+#### 12. Command Authority Matrix
 
 | Command | May Change Runtime Identity | May Change Workspace Config/State | May Materialize Projections | Notes |
 |---|---:|---:|---:|---|
```

## claim_9afc188be58ad9bb817c25a40707a574

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-136

Target: docs/platform/packaging-distribution/architecture/fgctl-and-local-fgos.md#unheaded-block-12

Source identity digest: `23c19d900d8f500d5e8c23470a8514902d16b5eca60069178062e7b4af3435ac`

Target identity digest: `23c19d900d8f500d5e8c23470a8514902d16b5eca60069178062e7b4af3435ac`

Source shown SHA256: `23c19d900d8f500d5e8c23470a8514902d16b5eca60069178062e7b4af3435ac`

Target shown SHA256: `23c19d900d8f500d5e8c23470a8514902d16b5eca60069178062e7b4af3435ac`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_9afc188be58ad9bb817c25a40707a574 |
| sourceUnitDigest | 23c19d900d8f500d5e8c23470a8514902d16b5eca60069178062e7b4af3435ac |
| targetOwner | docs/platform/packaging-distribution/architecture/fgctl-and-local-fgos.md |
| targetAnchor | unheaded-block-12 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-136, under "12. Command Authority Matrix", is retained at docs/platform/packaging-distribution/architecture/fgctl-and-local-fgos.md#unheaded-block-12. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the architecture/fgctl-and-local-fgos.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
| Command | May Change Runtime Identity | May Change Workspace Config/State | May Materialize Projections | Notes |
|---|---:|---:|---:|---|
| `fgctl init` | Yes | Indirectly, by invoking active local `fgos init` after publishing ready binding | Indirectly after activation | One-command onboarding orchestrator; installs stable local shims if missing. Candidate preflight before publish must not write host-visible projections. |
| `fgctl repair` | Yes | Indirectly, through the same active init/fix/check tail | Indirectly after activation | Reacquires/repairs runtime payload, publishes ready binding, then repairs projections/config through local fgos. |
| `fgctl upgrade` | Yes | Indirectly, through the same active init/fix/check tail; no automatic state migration in V1 | Indirectly after activation | Must verify state-schema compatibility before publishing ready binding. |
| local `fgos init` | No | Yes | Yes | Adopts workspace under active runtime identity. |
| local `fgos doctor` | No | No | No | Read-only report. |
| local `fgos doctor --fix` | No | Yes, only registered safe fixes | Yes, only safe projection repair | Must not patch release payload files. |
| local workflow verbs | No | Yes | No, unless explicitly part of operation | Must lease active runtime identity. |
```

### Target unit

```text
| Command | May Change Runtime Identity | May Change Workspace Config/State | May Materialize Projections | Notes |
|---|---:|---:|---:|---|
| `fgctl init` | Yes | Indirectly, by invoking active local `fgos init` after publishing ready binding | Indirectly after activation | One-command onboarding orchestrator; installs stable local shims if missing. Candidate preflight before publish must not write host-visible projections. |
| `fgctl repair` | Yes | Indirectly, through the same active init/fix/check tail | Indirectly after activation | Reacquires/repairs runtime payload, publishes ready binding, then repairs projections/config through local fgos. |
| `fgctl upgrade` | Yes | Indirectly, through the same active init/fix/check tail; no automatic state migration in V1 | Indirectly after activation | Must verify state-schema compatibility before publishing ready binding. |
| local `fgos init` | No | Yes | Yes | Adopts workspace under active runtime identity. |
| local `fgos doctor` | No | No | No | Read-only report. |
| local `fgos doctor --fix` | No | Yes, only registered safe fixes | Yes, only safe projection repair | Must not patch release payload files. |
| local workflow verbs | No | Yes | No, unless explicitly part of operation | Must lease active runtime identity. |
```

### Unified diff

```diff
No text difference.
```

## claim_f41b8ecfd7a8e422b2ee9ab94407e848

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#13-fgctl-form-and-v1-acquisition-sources

Target: docs/platform/packaging-distribution/architecture/fgctl-and-local-fgos.md#13-fgctl-form-and-v1-acquisition-sources

Source identity digest: `d9941af0fab55e3c2a8ad8ba99c011a38fd305570a9f540ac29e7975bb5a72e8`

Target identity digest: `9cce52e54486b39bf811aee6ff427a43e05b9001f24c815e5e75184a5d18df5f`

Source shown SHA256: `50136f4713f96325767aa42b8465b4227055c4f80e4a2f3b2754d6c63246019d`

Target shown SHA256: `5972a1d835fee0a85fd2b0e6f29b7d2adf704a2d1bab33a53c90f972015f1f93`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_f41b8ecfd7a8e422b2ee9ab94407e848 |
| sourceUnitDigest | d9941af0fab55e3c2a8ad8ba99c011a38fd305570a9f540ac29e7975bb5a72e8 |
| targetOwner | docs/platform/packaging-distribution/architecture/fgctl-and-local-fgos.md |
| targetAnchor | 13-fgctl-form-and-v1-acquisition-sources |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete heading from docs/architect/packaging-distribution/runtime-identity-and-activation.md#13-fgctl-form-and-v1-acquisition-sources, under "13. \`fgctl\` Form And V1 Acquisition Sources", is retained at docs/platform/packaging-distribution/architecture/fgctl-and-local-fgos.md#13-fgctl-form-and-v1-acquisition-sources. Only heading depth changes; the direct section payload follows the original source order. The named owner is the architecture/fgctl-and-local-fgos.md topic owner; carriage does not certify current implementation. |

### Source unit

````text
## 13. `fgctl` Form And V1 Acquisition Sources

V1 `fgctl` is a Rust bootstrap binary. It may be built from the same source
tree as the future Rust host, but its authority is different: machine/project
runtime control, not project workflow semantics.

V1 acquisition sources:

- local release tree path, for development/proof;
- local tarball/archive plus release tree manifest;
- GitHub release asset plus authenticated or pinned expected release tree
  manifest digest.

The first walking skeleton should not wait for the Rust host to replace local
`fgos`. V1 can ship:

```txt
fgctl = Rust bootstrap/control binary
release bin/fgos = existing Node host or thin Node entry
release bin/fgos-runner = existing Node runner
release libexec/legacy-node = compatibility payload if needed
```

Later, Rust host replaces release `bin/fgos` inside the same release tree
contract. Packaging does not need to change for that swap.

`doctor --fix` during `fgctl init` runs after the ready binding is published,
through the active local `fgos`. Candidate preflight before publish is
read-only or staging-only and must not write host-visible projections. General
repair remains explicit.
````

### Target unit

````text
#### 13. `fgctl` Form And V1 Acquisition Sources

V1 `fgctl` is a Rust bootstrap binary. It may be built from the same source
tree as the future Rust host, but its authority is different: machine/project
runtime control, not project workflow semantics.

V1 acquisition sources:

- local release tree path, for development/proof;
- local tarball/archive plus release tree manifest;
- GitHub release asset plus authenticated or pinned expected release tree
  manifest digest.

The first walking skeleton should not wait for the Rust host to replace local
`fgos`. V1 can ship:

```txt
fgctl = Rust bootstrap/control binary
release bin/fgos = existing Node host or thin Node entry
release bin/fgos-runner = existing Node runner
release libexec/legacy-node = compatibility payload if needed
```

Later, Rust host replaces release `bin/fgos` inside the same release tree
contract. Packaging does not need to change for that swap.

`doctor --fix` during `fgctl init` runs after the ready binding is published,
through the active local `fgos`. Candidate preflight before publish is
read-only or staging-only and must not write host-visible projections. General
repair remains explicit.
````

### Unified diff

```diff
--- "docs/architect/packaging-distribution/runtime-identity-and-activation.md#13-fgctl-form-and-v1-acquisition-sources"
+++ "docs/platform/packaging-distribution/architecture/fgctl-and-local-fgos.md#13-fgctl-form-and-v1-acquisition-sources"
@@ -1,4 +1,4 @@
-## 13. `fgctl` Form And V1 Acquisition Sources
+#### 13. `fgctl` Form And V1 Acquisition Sources
 
 V1 `fgctl` is a Rust bootstrap binary. It may be built from the same source
 tree as the future Rust host, but its authority is different: machine/project
```

