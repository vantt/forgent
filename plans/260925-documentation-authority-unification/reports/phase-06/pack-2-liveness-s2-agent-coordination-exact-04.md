# Review pack: s2-agent-coordination-exact-04

Pack commit: ebb68bbf6d4e703f974456e2d4a51d630870f7ec

Pack id: fedc4b44981f4f9726162e2901eb5f38718265c6b019f771892ced00255adc7e

Author session: codex-session:1@2026-10-08

## claim_824b96e5bdbf98cceb212871ed7101dc

Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-124

Target: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-125

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_824b96e5bdbf98cceb212871ed7101dc |
| sourceUnitDigest | 4e14eb6ffca2b6dffff9e62c6e2cb492a5b158b3b1acc286d1ac7b834b4a96af |
| claimKind | architecture |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-124 is retained in docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-125. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md |
| targetAnchor | unheaded-block-125 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | 4e14eb6ffca2b6dffff9e62c6e2cb492a5b158b3b1acc286d1ac7b834b4a96af |
| targetAncestry | \["Dispatch Control Plane Redesign","13. Full Design Target"\] |

### Source unit

````text
```txt
Caller
  -> DispatchPlan
  -> governance check
  -> transport adapter
  -> worker runtime
  -> structured result or fallback signal
  -> artifact refs
  -> runner-owned state update
```
````

### Target unit

````text
```txt
Caller
  -> DispatchPlan
  -> governance check
  -> transport adapter
  -> worker runtime
  -> structured result or fallback signal
  -> artifact refs
  -> runner-owned state update
```
````

### Unified diff

```diff
No text difference.
```

## claim_2382adfc5036469ddad709111bc07d2c

Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-125

Target: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-126

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_2382adfc5036469ddad709111bc07d2c |
| sourceUnitDigest | 2193eff434b5780a69b77e0f3576ecca37f3e480111f1865b5d35ef85ea37901 |
| claimKind | architecture |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-125 is retained in docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-126. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md |
| targetAnchor | unheaded-block-126 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | 2193eff434b5780a69b77e0f3576ecca37f3e480111f1865b5d35ef85ea37901 |
| targetAncestry | \["Dispatch Control Plane Redesign","13. Full Design Target"\] |

### Source unit

````text
Logical layers:

```txt
Semantic layer:
  DispatchPlan, DispatchAssignment, RESULT/BLOCKER, governance

Message layer:
  AgentMessage envelope, correlation, delivery, idempotency

Artifact layer:
  git refs, local artifacts, reports, datasets, logs

Execution layer:
  cli-spawn, herdr-spawn, mailbox, MCP, API

State layer:
  fgOS event log and derived state; runner remains the writer
```
````

### Target unit

````text
Logical layers:

```txt
Semantic layer:
  DispatchPlan, DispatchAssignment, RESULT/BLOCKER, governance

Message layer:
  AgentMessage envelope, correlation, delivery, idempotency

Artifact layer:
  git refs, local artifacts, reports, datasets, logs

Execution layer:
  cli-spawn, herdr-spawn, mailbox, MCP, API

State layer:
  fgOS event log and derived state; runner remains the writer
```
````

### Unified diff

```diff
No text difference.
```

## claim_76b3b4c83b8f395662c1d078b2a033f4

Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-126

Target: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-127

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_76b3b4c83b8f395662c1d078b2a033f4 |
| sourceUnitDigest | 1f14348e451612987f69d000fb45cf2d05a9cc4914b06f296d4c9d5b7f0aa640 |
| claimKind | architecture |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-126 is retained in docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-127. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md |
| targetAnchor | unheaded-block-127 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | 1f14348e451612987f69d000fb45cf2d05a9cc4914b06f296d4c9d5b7f0aa640 |
| targetAncestry | \["Dispatch Control Plane Redesign","14. Narrow Implementation Status"\] |

### Source unit

```text
This is the current implementation slice. It intentionally does not implement the full design target.
```

### Target unit

```text
This is the current implementation slice. It intentionally does not implement the full design target.
```

### Unified diff

```diff
No text difference.
```

## claim_093665be42da8c50453afb53b7ac55a5

Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-129

Target: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-130

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_093665be42da8c50453afb53b7ac55a5 |
| sourceUnitDigest | 19e78e714b4484223ca8ac3e08db2a3d806e7abb70ad79a32c3794714bf0022c |
| claimKind | architecture |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-129 is retained in docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-130. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md |
| targetAnchor | unheaded-block-130 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | 19e78e714b4484223ca8ac3e08db2a3d806e7abb70ad79a32c3794714bf0022c |
| targetAncestry | \["Dispatch Control Plane Redesign","14. Narrow Implementation Status"\] |

### Source unit

```text
Review outcome:

- no remaining P1/P2 findings in the committed diff;
- ready to merge by `main...HEAD` review scope;
- unrelated dirty worktree state remains outside the committed-diff scope;
- full AgentMessage, mailbox, artifact store, and structured confidence telemetry remain deferred.
```

### Target unit

```text
Review outcome:

- no remaining P1/P2 findings in the committed diff;
- ready to merge by `main...HEAD` review scope;
- unrelated dirty worktree state remains outside the committed-diff scope;
- full AgentMessage, mailbox, artifact store, and structured confidence telemetry remain deferred.
```

### Unified diff

```diff
No text difference.
```

## claim_a4c8fc5a7676ae1ed5dba1db9091cad2

Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#141-item-0---fix-decide---for-and-add-minimal-dispatchplan

Target: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#141-item-0---fix-decide---for-and-add-minimal-dispatchplan

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_a4c8fc5a7676ae1ed5dba1db9091cad2 |
| sourceUnitDigest | f3d30cd08912ddce8d87db26829ac9e4313abb49eab89500cf9418e224d7cdb6 |
| claimKind | architecture |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#141-item-0---fix-decide---for-and-add-minimal-dispatchplan is retained in docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#141-item-0---fix-decide---for-and-add-minimal-dispatchplan. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md |
| targetAnchor | 141-item-0---fix-decide---for-and-add-minimal-dispatchplan |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | f3d30cd08912ddce8d87db26829ac9e4313abb49eab89500cf9418e224d7cdb6 |
| targetAncestry | \["Dispatch Control Plane Redesign","14. Narrow Implementation Status"\] |

### Source unit

````text
### 14.1 Item 0 - Fix `decide --for` And Add Minimal DispatchPlan

Status: implemented in the reviewed candidate.

Implemented behavior:

- `decide --for <purpose>` uses the same capability-aware resolution as `execute --for`;
- the selected `executorId` is visible when a capability `prefer` maps the purpose to a concrete executor;
- `compileDispatchPlan()` centralizes selector handling and returns a consistent governance/invocation shape;
- explicit executor selector wins over work/purpose selector when both are present;
- governance-blocked executors are not reported as dispatchable.

Proof command:

```txt
node src/runner/dispatch.mjs decide --for fgos-coding-implement --has-live-task-access
```

Observed proof:

```json
{"mechanism":"out-of-process","configured":true,"executorId":"agy"}
```
````

### Target unit

````text
### 14.1 Item 0 - Fix `decide --for` And Add Minimal DispatchPlan

Status: implemented in the reviewed candidate.

Implemented behavior:

- `decide --for <purpose>` uses the same capability-aware resolution as `execute --for`;
- the selected `executorId` is visible when a capability `prefer` maps the purpose to a concrete executor;
- `compileDispatchPlan()` centralizes selector handling and returns a consistent governance/invocation shape;
- explicit executor selector wins over work/purpose selector when both are present;
- governance-blocked executors are not reported as dispatchable.

Proof command:

```txt
node src/runner/dispatch.mjs decide --for fgos-coding-implement --has-live-task-access
```

Observed proof:

```json
{"mechanism":"out-of-process","configured":true,"executorId":"agy"}
```
````

### Unified diff

```diff
No text difference.
```

## claim_8a80bfb39359705c28607c0c7f99d25f

Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-132

Target: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-133

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_8a80bfb39359705c28607c0c7f99d25f |
| sourceUnitDigest | bc910e23eedcb32f1a141b8055f2a3b73cc6c1875afa9ee051670ec3e065b1fb |
| claimKind | architecture |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-132 is retained in docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-133. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md |
| targetAnchor | unheaded-block-133 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | bc910e23eedcb32f1a141b8055f2a3b73cc6c1875afa9ee051670ec3e065b1fb |
| targetAncestry | \["Dispatch Control Plane Redesign","14. Narrow Implementation Status","14.1 Item 0 - Fix \`decide --for\` And Add Minimal DispatchPlan"\] |

### Source unit

```text
- `decide --for <purpose>` uses the same capability-aware resolution as `execute --for`;
- the selected `executorId` is visible when a capability `prefer` maps the purpose to a concrete executor;
- `compileDispatchPlan()` centralizes selector handling and returns a consistent governance/invocation shape;
- explicit executor selector wins over work/purpose selector when both are present;
- governance-blocked executors are not reported as dispatchable.
```

### Target unit

```text
- `decide --for <purpose>` uses the same capability-aware resolution as `execute --for`;
- the selected `executorId` is visible when a capability `prefer` maps the purpose to a concrete executor;
- `compileDispatchPlan()` centralizes selector handling and returns a consistent governance/invocation shape;
- explicit executor selector wins over work/purpose selector when both are present;
- governance-blocked executors are not reported as dispatchable.
```

### Unified diff

```diff
No text difference.
```

## claim_3cbbf6679df9f95927ddd24dc3a57172

Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-133

Target: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-134

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_3cbbf6679df9f95927ddd24dc3a57172 |
| sourceUnitDigest | e5d6ec54e7c7848772a7ecffdfe29d4a4cd76a6e1600c2b506b97d26e8c76ac4 |
| claimKind | architecture |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-133 is retained in docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-134. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md |
| targetAnchor | unheaded-block-134 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | e5d6ec54e7c7848772a7ecffdfe29d4a4cd76a6e1600c2b506b97d26e8c76ac4 |
| targetAncestry | \["Dispatch Control Plane Redesign","14. Narrow Implementation Status","14.1 Item 0 - Fix \`decide --for\` And Add Minimal DispatchPlan"\] |

### Source unit

````text
Proof command:

```txt
node src/runner/dispatch.mjs decide --for fgos-coding-implement --has-live-task-access
```
````

### Target unit

````text
Proof command:

```txt
node src/runner/dispatch.mjs decide --for fgos-coding-implement --has-live-task-access
```
````

### Unified diff

```diff
No text difference.
```

## claim_882afd27a90f245b5fb9ece4bdb62d5c

Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-134

Target: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-135

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_882afd27a90f245b5fb9ece4bdb62d5c |
| sourceUnitDigest | 40ba4eaf36d90e1aee36688d1fdc5bf7e7851e5657a9e74f716068786b40d5da |
| claimKind | architecture |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-134 is retained in docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-135. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md |
| targetAnchor | unheaded-block-135 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | 40ba4eaf36d90e1aee36688d1fdc5bf7e7851e5657a9e74f716068786b40d5da |
| targetAncestry | \["Dispatch Control Plane Redesign","14. Narrow Implementation Status","14.1 Item 0 - Fix \`decide --for\` And Add Minimal DispatchPlan"\] |

### Source unit

````text
Observed proof:

```json
{"mechanism":"out-of-process","configured":true,"executorId":"agy"}
```
````

### Target unit

````text
Observed proof:

```json
{"mechanism":"out-of-process","configured":true,"executorId":"agy"}
```
````

### Unified diff

```diff
No text difference.
```

## claim_39cb769774461a2bf4cb8f9141c4d68d

Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-137

Target: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-138

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_39cb769774461a2bf4cb8f9141c4d68d |
| sourceUnitDigest | e4a8c316ba8bab18cb0af99594d2fd2912876164247b193f03ae59ca25eb01c7 |
| claimKind | architecture |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-137 is retained in docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-138. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md |
| targetAnchor | unheaded-block-138 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | e4a8c316ba8bab18cb0af99594d2fd2912876164247b193f03ae59ca25eb01c7 |
| targetAncestry | \["Dispatch Control Plane Redesign","14. Narrow Implementation Status","14.2 Item 1 - Governance Egress"\] |

### Source unit

```text
- command-only cross-provider judgment is replaced with effective egress judgment;
- `carries` remains the content-class vocabulary;
- egress classification records provider family, target, content class, command, and adapter context through the resolved executor path;
- a Claude-looking command with `ANTHROPIC_BASE_URL` routed to OpenRouter is cross-provider egress and fails closed unless explicitly allowed;
- malformed or deceptive endpoint overrides fail closed;
- same-provider Claude resolves as same-provider governance;
- non-Claude executors must explicitly allow cross-provider egress when carrying repo content.
```

### Target unit

```text
- command-only cross-provider judgment is replaced with effective egress judgment;
- `carries` remains the content-class vocabulary;
- egress classification records provider family, target, content class, command, and adapter context through the resolved executor path;
- a Claude-looking command with `ANTHROPIC_BASE_URL` routed to OpenRouter is cross-provider egress and fails closed unless explicitly allowed;
- malformed or deceptive endpoint overrides fail closed;
- same-provider Claude resolves as same-provider governance;
- non-Claude executors must explicitly allow cross-provider egress when carrying repo content.
```

### Unified diff

```diff
No text difference.
```

## claim_6d6c229b00e4e9558e7fab3bf7da8486

Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-138

Target: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-139

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_6d6c229b00e4e9558e7fab3bf7da8486 |
| sourceUnitDigest | 44da843d442e2fa0b8e6fa399a17853a6907b9144a1579cc60f4d52cac3ec161 |
| claimKind | architecture |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-138 is retained in docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-139. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md |
| targetAnchor | unheaded-block-139 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | 44da843d442e2fa0b8e6fa399a17853a6907b9144a1579cc60f4d52cac3ec161 |
| targetAncestry | \["Dispatch Control Plane Redesign","14. Narrow Implementation Status","14.2 Item 1 - Governance Egress"\] |

### Source unit

```text
Proof:

- an executor that routes to another provider through env/model is not allowed merely because its command is `claude`;
- governance tests cover allowed and blocked cross-provider cases.
```

### Target unit

```text
Proof:

- an executor that routes to another provider through env/model is not allowed merely because its command is `claude`;
- governance tests cover allowed and blocked cross-provider cases.
```

### Unified diff

```diff
No text difference.
```

## claim_46468eec9b9c3677bb85bd88c60494f8

Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-141

Target: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-142

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_46468eec9b9c3677bb85bd88c60494f8 |
| sourceUnitDigest | 7905401409a2993a182f0e82fc64fb83569350300b430ac4c160e407ea344bf2 |
| claimKind | architecture |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-141 is retained in docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-142. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md |
| targetAnchor | unheaded-block-142 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | 7905401409a2993a182f0e82fc64fb83569350300b430ac4c160e407ea344bf2 |
| targetAncestry | \["Dispatch Control Plane Redesign","14. Narrow Implementation Status","14.3 Item 2 - \`herdr-spawn\` Adapter"\] |

### Source unit

```text
- a configured executor with `adapter:"herdr-spawn"` routes through the Herdr adapter;
- `invocation.via:"cli"` remains the resolver-compatible invocation type;
- every dispatch creates a fresh pane;
- pane output is captured and normalized before the existing result parser sees it;
- worker completion is detected by the runner-owned sentinel after real command exit, not by `[DONE]`/`[BLOCKED]`;
- prompts that mention `[DONE]` as instructional prose do not trigger false success;
- workers that emit no semantic token still resolve through the existing `unsignaled`/git-state fallback path;
- timeouts close the Herdr pane and do not wait on observer descendants that keep pipes open;
- observer failures surface as transport failures.
```

### Target unit

```text
- a configured executor with `adapter:"herdr-spawn"` routes through the Herdr adapter;
- `invocation.via:"cli"` remains the resolver-compatible invocation type;
- every dispatch creates a fresh pane;
- pane output is captured and normalized before the existing result parser sees it;
- worker completion is detected by the runner-owned sentinel after real command exit, not by `[DONE]`/`[BLOCKED]`;
- prompts that mention `[DONE]` as instructional prose do not trigger false success;
- workers that emit no semantic token still resolve through the existing `unsignaled`/git-state fallback path;
- timeouts close the Herdr pane and do not wait on observer descendants that keep pipes open;
- observer failures surface as transport failures.
```

### Unified diff

```diff
No text difference.
```

## claim_3d8b85a91a420da5d4c72ce76e7199d7

Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-142

Target: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-143

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_3d8b85a91a420da5d4c72ce76e7199d7 |
| sourceUnitDigest | 1e7a8f4ef6813313c1043b94b021827782e1a1539b35daa38429e8556c8e8622 |
| claimKind | architecture |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-142 is retained in docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-143. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md |
| targetAnchor | unheaded-block-143 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | 1e7a8f4ef6813313c1043b94b021827782e1a1539b35daa38429e8556c8e8622 |
| targetAncestry | \["Dispatch Control Plane Redesign","14. Narrow Implementation Status","14.3 Item 2 - \`herdr-spawn\` Adapter"\] |

### Source unit

```text
Proof:

- a configured executor with `adapter:"herdr-spawn"` routes through the adapter;
- Herdr starts a fresh pane and runs the intended command;
- Herdr does not write or decide fgOS task state;
- result handling still accepts structured output if present, then `[DONE]`/`[BLOCKED]`, then git-state inference.
```

### Target unit

```text
Proof:

- a configured executor with `adapter:"herdr-spawn"` routes through the adapter;
- Herdr starts a fresh pane and runs the intended command;
- Herdr does not write or decide fgOS task state;
- result handling still accepts structured output if present, then `[DONE]`/`[BLOCKED]`, then git-state inference.
```

### Unified diff

```diff
No text difference.
```

## claim_bc464f69b9780890094679b1c665a68f

Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-143

Target: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-144

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_bc464f69b9780890094679b1c665a68f |
| sourceUnitDigest | 55f7c18d04d9441da628087a688ae7929eb47dfb3832c5aff259c1d735878691 |
| claimKind | architecture |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-143 is retained in docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-144. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md |
| targetAnchor | unheaded-block-144 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | 55f7c18d04d9441da628087a688ae7929eb47dfb3832c5aff259c1d735878691 |
| targetAncestry | \["Dispatch Control Plane Redesign","14. Narrow Implementation Status","14.3 Item 2 - \`herdr-spawn\` Adapter"\] |

### Source unit

```text
Review verification:

- `node --test test/runner/herdr-spawn-adapter.test.mjs` - 20/20 pass.
- `node --test test/runner/egress-governance.test.mjs` - 6/6 pass.
- `node --test test/runner/dispatch.test.mjs test/runner/loop.test.mjs` - 401/401 pass.
- `git diff --check main...HEAD` - clean.
- Live timeout probes reject around 104-112ms instead of the earlier 1000-10000ms delayed failure shape.
```

### Target unit

```text
Review verification:

- `node --test test/runner/herdr-spawn-adapter.test.mjs` - 20/20 pass.
- `node --test test/runner/egress-governance.test.mjs` - 6/6 pass.
- `node --test test/runner/dispatch.test.mjs test/runner/loop.test.mjs` - 401/401 pass.
- `git diff --check main...HEAD` - clean.
- Live timeout probes reject around 104-112ms instead of the earlier 1000-10000ms delayed failure shape.
```

### Unified diff

```diff
No text difference.
```

## claim_f93d4cf3a9455d45357cde918e13031d

Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-144

Target: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-145

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_f93d4cf3a9455d45357cde918e13031d |
| sourceUnitDigest | 8ccb90efece76e0cfdd3850ce7c38611ada33a18e951cbb1a0f8654a750413a9 |
| claimKind | architecture |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-144 is retained in docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-145. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md |
| targetAnchor | unheaded-block-145 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | 8ccb90efece76e0cfdd3850ce7c38611ada33a18e951cbb1a0f8654a750413a9 |
| targetAncestry | \["Dispatch Control Plane Redesign","15. Deferred Until A Consumer Exists"\] |

### Source unit

```text
These remain part of the architecture target but are not part of the narrow slice:
```

### Target unit

```text
These remain part of the architecture target but are not part of the narrow slice:
```

### Unified diff

```diff
No text difference.
```

## claim_be72d686a809691a1655432eba1a1f38

Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-145

Target: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-146

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_be72d686a809691a1655432eba1a1f38 |
| sourceUnitDigest | b76ec2eac42fde96cb172217c5039eaa6f600f407306c54cbad443c7e9c7db44 |
| claimKind | contract |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-145 is retained in docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-146. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md |
| targetAnchor | unheaded-block-146 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | b76ec2eac42fde96cb172217c5039eaa6f600f407306c54cbad443c7e9c7db44 |
| targetAncestry | \["Dispatch Control Plane Redesign","15. Deferred Until A Consumer Exists"\] |

### Source unit

```text
- full AgentMessage envelope implementation;
- DispatchAssignment rename/migration from exec packet/ad-hoc task;
- artifact store V1;
- mailbox;
- protocol registry beyond the existing adapter registry;
- structured RESULT migration with confidence telemetry;
- ACK/PROGRESS/QUESTION/ANSWER/REVIEW/CANCEL message types.
```

### Target unit

```text
- full AgentMessage envelope implementation;
- DispatchAssignment rename/migration from exec packet/ad-hoc task;
- artifact store V1;
- mailbox;
- protocol registry beyond the existing adapter registry;
- structured RESULT migration with confidence telemetry;
- ACK/PROGRESS/QUESTION/ANSWER/REVIEW/CANCEL message types.
```

### Unified diff

```diff
No text difference.
```

## claim_a4d718116ce5da0bb388a5a5d99d690a

Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-146

Target: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-147

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_a4d718116ce5da0bb388a5a5d99d690a |
| sourceUnitDigest | 4a6e363665c3211df42e18650edef6bce3204522e79c42c4c9df4a476d7ef6c4 |
| claimKind | architecture |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-146 is retained in docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-147. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md |
| targetAnchor | unheaded-block-147 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | 4a6e363665c3211df42e18650edef6bce3204522e79c42c4c9df4a476d7ef6c4 |
| targetAncestry | \["Dispatch Control Plane Redesign","15. Deferred Until A Consumer Exists"\] |

### Source unit

```text
Entry criteria to pull one of these forward:
```

### Target unit

```text
Entry criteria to pull one of these forward:
```

### Unified diff

```diff
No text difference.
```

## claim_7034c248d749b342090acdd8b80b221c

Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-147

Target: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-148

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_7034c248d749b342090acdd8b80b221c |
| sourceUnitDigest | c69fd7c76a064f8a77a15670e73d340b469c6f214c2741b1ad58c0b6bf40c9ed |
| claimKind | architecture |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-147 is retained in docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-148. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md |
| targetAnchor | unheaded-block-148 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | c69fd7c76a064f8a77a15670e73d340b469c6f214c2741b1ad58c0b6bf40c9ed |
| targetAncestry | \["Dispatch Control Plane Redesign","15. Deferred Until A Consumer Exists"\] |

### Source unit

```text
- a production reader needs the data;
- Herdr/CLI usage shows fallback result quality is insufficient;
- multiple agents need async QUESTION/BLOCKER/ANSWER flow;
- artifact references are needed to avoid passing large data through conversation;
- provider compliance telemetry has a concrete dashboard/gate/report consumer.
```

### Target unit

```text
- a production reader needs the data;
- Herdr/CLI usage shows fallback result quality is insufficient;
- multiple agents need async QUESTION/BLOCKER/ANSWER flow;
- artifact references are needed to avoid passing large data through conversation;
- provider compliance telemetry has a concrete dashboard/gate/report consumer.
```

### Unified diff

```diff
No text difference.
```

## claim_170c7a5c7d068ea2ca28126a4608a095

Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-149

Target: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-150

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_170c7a5c7d068ea2ca28126a4608a095 |
| sourceUnitDigest | 7b4b358a2c557d91fa0559cd158df7bfcfc061bf4957a0f0025cf63504fdd319 |
| claimKind | architecture |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-149 is retained in docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-150. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md |
| targetAnchor | unheaded-block-150 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | 7b4b358a2c557d91fa0559cd158df7bfcfc061bf4957a0f0025cf63504fdd319 |
| targetAncestry | \["Dispatch Control Plane Redesign","16. Implementation Pointers"\] |

### Source unit

```text
- `src/runner/dispatch/plan.mjs`
- `src/runner/dispatch/config.mjs`
- `src/runner/dispatch/resolve.mjs`
- `src/runner/dispatch/mechanism.mjs`
- `src/runner/dispatch/transport.mjs`
- `src/runner/dispatch/prepare.mjs`
- `src/runner/dispatch/cli.mjs`
- `src/runner/dispatch/result-ladder.mjs` — confidence-ladder result normalization, extracted from `cli.mjs` by `tsk-2tr` (§17.2/§17.3), consumed by `src/report/dispatch-confidence.mjs`.
- `src/runner/dispatch.mjs`
```

### Target unit

```text
- `src/runner/dispatch/plan.mjs`
- `src/runner/dispatch/config.mjs`
- `src/runner/dispatch/resolve.mjs`
- `src/runner/dispatch/mechanism.mjs`
- `src/runner/dispatch/transport.mjs`
- `src/runner/dispatch/prepare.mjs`
- `src/runner/dispatch/cli.mjs`
- `src/runner/dispatch/result-ladder.mjs` — confidence-ladder result normalization, extracted from `cli.mjs` by `tsk-2tr` (§17.2/§17.3), consumed by `src/report/dispatch-confidence.mjs`.
- `src/runner/dispatch.mjs`
```

### Unified diff

```diff
No text difference.
```

## claim_2d2e35bb98c0810a6a567bc2118e3f75

Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-150

Target: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-151

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_2d2e35bb98c0810a6a567bc2118e3f75 |
| sourceUnitDigest | 7fa8ab01bbb968bc40a5ed953487e7138bcd80a0adf7454a27b52a79b0813150 |
| claimKind | architecture |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-150 is retained in docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-151. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md |
| targetAnchor | unheaded-block-151 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | 7fa8ab01bbb968bc40a5ed953487e7138bcd80a0adf7454a27b52a79b0813150 |
| targetAncestry | \["Dispatch Control Plane Redesign","16. Implementation Pointers"\] |

### Source unit

```text
Result-confidence reader (§10/§15 entry criterion pulled forward by `tsk-1g6`, §17.2/§17.3):
```

### Target unit

```text
Result-confidence reader (§10/§15 entry criterion pulled forward by `tsk-1g6`, §17.2/§17.3):
```

### Unified diff

```diff
No text difference.
```

## claim_962abf6092edd6fb7c1cb7d1bee03dd8

Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-151

Target: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-152

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_962abf6092edd6fb7c1cb7d1bee03dd8 |
| sourceUnitDigest | c76c5674bdc286856408fab057ead733da60e5852916b2b613e32a9a6b69d292 |
| claimKind | architecture |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-151 is retained in docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-152. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md |
| targetAnchor | unheaded-block-152 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | c76c5674bdc286856408fab057ead733da60e5852916b2b613e32a9a6b69d292 |
| targetAncestry | \["Dispatch Control Plane Redesign","16. Implementation Pointers"\] |

### Source unit

```text
- `src/report/dispatch-confidence.mjs`
- wired into `bin/fgos.mjs` and `src/cli/command-registry.mjs`
```

### Target unit

```text
- `src/report/dispatch-confidence.mjs`
- wired into `bin/fgos.mjs` and `src/cli/command-registry.mjs`
```

### Unified diff

```diff
No text difference.
```

## claim_069e4dd6db4fa703a9e7064cf7e5c34f

Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-153

Target: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-154

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_069e4dd6db4fa703a9e7064cf7e5c34f |
| sourceUnitDigest | edf60c84a26b9c37d9e25d00f88d692231029b221b2e1b003e470cdc723928d3 |
| claimKind | contract |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-153 is retained in docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-154. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md |
| targetAnchor | unheaded-block-154 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | edf60c84a26b9c37d9e25d00f88d692231029b221b2e1b003e470cdc723928d3 |
| targetAncestry | \["Dispatch Control Plane Redesign","16. Implementation Pointers"\] |

### Source unit

```text
- `plugins/fgOS/skills/_shared/executor-dispatch-fallback.md`
- `plugins/fgOS/skills/_shared/coding-worker-contract.md`
- `src/runner/prompt-templates/worker-prompt-skill-pointer.txt`
```

### Target unit

```text
- `plugins/fgOS/skills/_shared/executor-dispatch-fallback.md`
- `plugins/fgOS/skills/_shared/coding-worker-contract.md`
- `src/runner/prompt-templates/worker-prompt-skill-pointer.txt`
```

### Unified diff

```diff
No text difference.
```

## claim_179b6be7dc985be066a9a180155d8e07

Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-154

Target: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-155

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_179b6be7dc985be066a9a180155d8e07 |
| sourceUnitDigest | 39338b94483fb29a78726ee91b69cb2fc08ace12dcdfc1dc5257062b4323b85f |
| claimKind | architecture |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-154 is retained in docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-155. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md |
| targetAnchor | unheaded-block-155 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | 39338b94483fb29a78726ee91b69cb2fc08ace12dcdfc1dc5257062b4323b85f |
| targetAncestry | \["Dispatch Control Plane Redesign","16. Implementation Pointers"\] |

### Source unit

```text
Current focused tests for the narrow slice:
```

### Target unit

```text
Current focused tests for the narrow slice:
```

### Unified diff

```diff
No text difference.
```

## claim_80458f88e0dc781e44edc52c24ed7951

Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-155

Target: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-156

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_80458f88e0dc781e44edc52c24ed7951 |
| sourceUnitDigest | 0cbbc36bb45b78703ce2ddb3acc40d84556c3ff6fca391fe0beb3e1f24f35c85 |
| claimKind | architecture |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-155 is retained in docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-156. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md |
| targetAnchor | unheaded-block-156 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | 0cbbc36bb45b78703ce2ddb3acc40d84556c3ff6fca391fe0beb3e1f24f35c85 |
| targetAncestry | \["Dispatch Control Plane Redesign","16. Implementation Pointers"\] |

### Source unit

```text
- `test/runner/dispatch.test.mjs`
- `test/runner/egress-governance.test.mjs`
- `test/runner/herdr-spawn-adapter.test.mjs`
- `test/runner/loop.test.mjs`
```

### Target unit

```text
- `test/runner/dispatch.test.mjs`
- `test/runner/egress-governance.test.mjs`
- `test/runner/herdr-spawn-adapter.test.mjs`
- `test/runner/loop.test.mjs`
```

### Unified diff

```diff
No text difference.
```

## claim_bd56da5ca2731e990a4c5f1af27a60bf

Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-157

Target: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-158

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_bd56da5ca2731e990a4c5f1af27a60bf |
| sourceUnitDigest | 98afca898c5585e927290ebe8611db36b3dadd1184d91e7e2cc700f74cbd7a4f |
| claimKind | contract |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-157 is retained in docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-158. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md |
| targetAnchor | unheaded-block-158 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | 98afca898c5585e927290ebe8611db36b3dadd1184d91e7e2cc700f74cbd7a4f |
| targetAncestry | \["Dispatch Control Plane Redesign","16. Implementation Pointers"\] |

### Source unit

```text
- `docs/specs/runner.md` sections for Native-First Dispatch Doctrine and executor/capability rename;
- `docs/history/two-layer-dispatch/`;
- `docs/history/dispatch-concept-boundary/`;
- `docs/history/task-dispatch-unification/`.
- `docs/history/tsk-5x7/`.
```

### Target unit

```text
- `docs/specs/runner.md` sections for Native-First Dispatch Doctrine and executor/capability rename;
- `docs/history/two-layer-dispatch/`;
- `docs/history/dispatch-concept-boundary/`;
- `docs/history/task-dispatch-unification/`.
- `docs/history/tsk-5x7/`.
```

### Unified diff

```diff
No text difference.
```

## claim_edc408ae9b73c7759834eab2c43e7ac4

Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#17-task-sets-that-implemented-this-plan-2026-08-25-2026-08-26

Target: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#17-task-sets-that-implemented-this-plan-2026-08-25-2026-08-26

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_edc408ae9b73c7759834eab2c43e7ac4 |
| sourceUnitDigest | c234587692ee31a44eea55903f911c69c40b9b7f8d1b27886c144cfb678719b4 |
| claimKind | architecture |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#17-task-sets-that-implemented-this-plan-2026-08-25-2026-08-26 is retained in docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#17-task-sets-that-implemented-this-plan-2026-08-25-2026-08-26. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md |
| targetAnchor | 17-task-sets-that-implemented-this-plan-2026-08-25-2026-08-26 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | c234587692ee31a44eea55903f911c69c40b9b7f8d1b27886c144cfb678719b4 |
| targetAncestry | \["Dispatch Control Plane Redesign"\] |

### Source unit

```text
## 17. Task Sets That Implemented This Plan (2026-08-25 → 2026-08-26)

Found by scanning git log on `src/runner/dispatch*` and this doc over the
last 2-3 days. Root item is `tsk-5x7`; everything else is a follow-on task
that either landed a deferred/reviewed piece of the design or fixed a
regression the redesign introduced.
```

### Target unit

```text
## 17. Task Sets That Implemented This Plan (2026-08-25 → 2026-08-26)

Found by scanning git log on `src/runner/dispatch*` and this doc over the
last 2-3 days. Root item is `tsk-5x7`; everything else is a follow-on task
that either landed a deferred/reviewed piece of the design or fixed a
regression the redesign introduced.
```

### Unified diff

```diff
No text difference.
```

## claim_5a7e196f7f8a316c58fba721f619981b

Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-158

Target: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-159

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_5a7e196f7f8a316c58fba721f619981b |
| sourceUnitDigest | 7e9f6d297de37960aef9c608c27aa03049c574f17c228e229a76790145631625 |
| claimKind | architecture |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-158 is retained in docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-159. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md |
| targetAnchor | unheaded-block-159 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | 7e9f6d297de37960aef9c608c27aa03049c574f17c228e229a76790145631625 |
| targetAncestry | \["Dispatch Control Plane Redesign","17. Task Sets That Implemented This Plan (2026-08-25 → 2026-08-26)"\] |

### Source unit

```text
Found by scanning git log on `src/runner/dispatch*` and this doc over the
last 2-3 days. Root item is `tsk-5x7`; everything else is a follow-on task
that either landed a deferred/reviewed piece of the design or fixed a
regression the redesign introduced.
```

### Target unit

```text
Found by scanning git log on `src/runner/dispatch*` and this doc over the
last 2-3 days. Root item is `tsk-5x7`; everything else is a follow-on task
that either landed a deferred/reviewed piece of the design or fixed a
regression the redesign introduced.
```

### Unified diff

```diff
No text difference.
```

## claim_d3508309300faa83e6c99ee30200969b

Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#171-tsk-5x7-dispatch-semantic-control-plane-herdr-ready-orchestration-root

Target: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#171-tsk-5x7-dispatch-semantic-control-plane-herdr-ready-orchestration-root

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_d3508309300faa83e6c99ee30200969b |
| sourceUnitDigest | f9bab4236368701749f7d7eb9e7ecb9920e586b7fe723e6c55c2a442474e4752 |
| claimKind | architecture |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#171-tsk-5x7-dispatch-semantic-control-plane-herdr-ready-orchestration-root is retained in docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#171-tsk-5x7-dispatch-semantic-control-plane-herdr-ready-orchestration-root. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md |
| targetAnchor | 171-tsk-5x7-dispatch-semantic-control-plane-herdr-ready-orchestration-root |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | f9bab4236368701749f7d7eb9e7ecb9920e586b7fe723e6c55c2a442474e4752 |
| targetAncestry | \["Dispatch Control Plane Redesign","17. Task Sets That Implemented This Plan (2026-08-25 → 2026-08-26)"\] |

### Source unit

```text
### 17.1 `tsk-5x7` — Dispatch semantic control plane + Herdr-ready orchestration (root)

Plan: `docs/history/dispatch-plan-protocol-redesign/plan.md`. Split into
three dep-free children per D6 (2026-08-25):

- **`tsk-5x7-1`** — piece 0: fix `decide --for` to read `capabilities.prefer`,
  add minimal `DispatchPlan`, hoist the audit-event write.
  Plan: `docs/history/tsk-5x7-1/plan.md`. → §14.1 above.
- **`tsk-5x7-2`** — piece 1: declared-egress governance (replaces the
  `command !== claude` substring check).
  Plan: `docs/history/tsk-5x7-2/plan.md`. → §14.2 above.
- **`tsk-5x7-3`** — piece 2: `herdr-spawn` adapter, protocol untouched.
  Plan: `docs/history/tsk-5x7-3/plan.md`. → §14.3 above.

The root `tsk-5x7` branch then absorbed a long self-review/hardening pass
(governance-descriptor discard, shell-injection in the pane run, timeout
waiting on descendants, echo-stripping gaps, secret-env passthrough,
`plan.mjs`↔`cli.mjs` import cycle, whitespace hygiene) before merge —
commits `580fe09e` .. `76d8539d`, 2026-08-25 18:43–23:02. This doc's own
§14 status section and the "reviewed narrow implementation candidate"
framing in the header were written from that merged state
(`8e835dc1` / `ebdf69d5`, 2026-08-25 22:18 / 2026-08-26 13:20).
```

### Target unit

```text
### 17.1 `tsk-5x7` — Dispatch semantic control plane + Herdr-ready orchestration (root)

Plan: `docs/history/dispatch-plan-protocol-redesign/plan.md`. Split into
three dep-free children per D6 (2026-08-25):

- **`tsk-5x7-1`** — piece 0: fix `decide --for` to read `capabilities.prefer`,
  add minimal `DispatchPlan`, hoist the audit-event write.
  Plan: `docs/history/tsk-5x7-1/plan.md`. → §14.1 above.
- **`tsk-5x7-2`** — piece 1: declared-egress governance (replaces the
  `command !== claude` substring check).
  Plan: `docs/history/tsk-5x7-2/plan.md`. → §14.2 above.
- **`tsk-5x7-3`** — piece 2: `herdr-spawn` adapter, protocol untouched.
  Plan: `docs/history/tsk-5x7-3/plan.md`. → §14.3 above.

The root `tsk-5x7` branch then absorbed a long self-review/hardening pass
(governance-descriptor discard, shell-injection in the pane run, timeout
waiting on descendants, echo-stripping gaps, secret-env passthrough,
`plan.mjs`↔`cli.mjs` import cycle, whitespace hygiene) before merge —
commits `580fe09e` .. `76d8539d`, 2026-08-25 18:43–23:02. This doc's own
§14 status section and the "reviewed narrow implementation candidate"
framing in the header were written from that merged state
(`8e835dc1` / `ebdf69d5`, 2026-08-25 22:18 / 2026-08-26 13:20).
```

### Unified diff

```diff
No text difference.
```

## claim_e2a2389b5cf963fbb0cc99899f20e241

Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-159

Target: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-160

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_e2a2389b5cf963fbb0cc99899f20e241 |
| sourceUnitDigest | 3d12eea59e198fafe11719ea8d217384d904887832da2d0318691d991c5c5bd8 |
| claimKind | contract |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-159 is retained in docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-160. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md |
| targetAnchor | unheaded-block-160 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | 3d12eea59e198fafe11719ea8d217384d904887832da2d0318691d991c5c5bd8 |
| targetAncestry | \["Dispatch Control Plane Redesign","17. Task Sets That Implemented This Plan (2026-08-25 → 2026-08-26)","17.1 \`tsk-5x7\` — Dispatch semantic control plane + Herdr-ready orchestration (root)"\] |

### Source unit

```text
Plan: `docs/history/dispatch-plan-protocol-redesign/plan.md`. Split into
three dep-free children per D6 (2026-08-25):
```

### Target unit

```text
Plan: `docs/history/dispatch-plan-protocol-redesign/plan.md`. Split into
three dep-free children per D6 (2026-08-25):
```

### Unified diff

```diff
No text difference.
```

## claim_d83546183b7053a268874ca9c5abc2d4

Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-160

Target: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-161

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_d83546183b7053a268874ca9c5abc2d4 |
| sourceUnitDigest | 913d182f302221eec624e4b43a1b4718d3d99bcf567bb25b2af0e0b44775fee3 |
| claimKind | architecture |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-160 is retained in docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-161. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md |
| targetAnchor | unheaded-block-161 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | 913d182f302221eec624e4b43a1b4718d3d99bcf567bb25b2af0e0b44775fee3 |
| targetAncestry | \["Dispatch Control Plane Redesign","17. Task Sets That Implemented This Plan (2026-08-25 → 2026-08-26)","17.1 \`tsk-5x7\` — Dispatch semantic control plane + Herdr-ready orchestration (root)"\] |

### Source unit

```text
- **`tsk-5x7-1`** — piece 0: fix `decide --for` to read `capabilities.prefer`,
  add minimal `DispatchPlan`, hoist the audit-event write.
  Plan: `docs/history/tsk-5x7-1/plan.md`. → §14.1 above.
- **`tsk-5x7-2`** — piece 1: declared-egress governance (replaces the
  `command !== claude` substring check).
  Plan: `docs/history/tsk-5x7-2/plan.md`. → §14.2 above.
- **`tsk-5x7-3`** — piece 2: `herdr-spawn` adapter, protocol untouched.
  Plan: `docs/history/tsk-5x7-3/plan.md`. → §14.3 above.
```

### Target unit

```text
- **`tsk-5x7-1`** — piece 0: fix `decide --for` to read `capabilities.prefer`,
  add minimal `DispatchPlan`, hoist the audit-event write.
  Plan: `docs/history/tsk-5x7-1/plan.md`. → §14.1 above.
- **`tsk-5x7-2`** — piece 1: declared-egress governance (replaces the
  `command !== claude` substring check).
  Plan: `docs/history/tsk-5x7-2/plan.md`. → §14.2 above.
- **`tsk-5x7-3`** — piece 2: `herdr-spawn` adapter, protocol untouched.
  Plan: `docs/history/tsk-5x7-3/plan.md`. → §14.3 above.
```

### Unified diff

```diff
No text difference.
```

## claim_13c2987cfb81b854cac75b1b9ee66d9d

Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-161

Target: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-162

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_13c2987cfb81b854cac75b1b9ee66d9d |
| sourceUnitDigest | 3513536168ccb09e62e7d50301ae310d2bf94d0a9f92632ac8e5de20a038936f |
| claimKind | architecture |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-161 is retained in docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-162. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md |
| targetAnchor | unheaded-block-162 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | 3513536168ccb09e62e7d50301ae310d2bf94d0a9f92632ac8e5de20a038936f |
| targetAncestry | \["Dispatch Control Plane Redesign","17. Task Sets That Implemented This Plan (2026-08-25 → 2026-08-26)","17.1 \`tsk-5x7\` — Dispatch semantic control plane + Herdr-ready orchestration (root)"\] |

### Source unit

```text
The root `tsk-5x7` branch then absorbed a long self-review/hardening pass
(governance-descriptor discard, shell-injection in the pane run, timeout
waiting on descendants, echo-stripping gaps, secret-env passthrough,
`plan.mjs`↔`cli.mjs` import cycle, whitespace hygiene) before merge —
commits `580fe09e` .. `76d8539d`, 2026-08-25 18:43–23:02. This doc's own
§14 status section and the "reviewed narrow implementation candidate"
framing in the header were written from that merged state
(`8e835dc1` / `ebdf69d5`, 2026-08-25 22:18 / 2026-08-26 13:20).
```

### Target unit

```text
The root `tsk-5x7` branch then absorbed a long self-review/hardening pass
(governance-descriptor discard, shell-injection in the pane run, timeout
waiting on descendants, echo-stripping gaps, secret-env passthrough,
`plan.mjs`↔`cli.mjs` import cycle, whitespace hygiene) before merge —
commits `580fe09e` .. `76d8539d`, 2026-08-25 18:43–23:02. This doc's own
§14 status section and the "reviewed narrow implementation candidate"
framing in the header were written from that merged state
(`8e835dc1` / `ebdf69d5`, 2026-08-25 22:18 / 2026-08-26 13:20).
```

### Unified diff

```diff
No text difference.
```

## claim_a987a52a709a38d22e54b93d50d987fa

Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#172-follow-on-task-sets-2026-08-26-each-pulling-one-15-deferred-item-forward-or-fixing-a-redesign-regression

Target: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#172-follow-on-task-sets-2026-08-26-each-pulling-one-15-deferred-item-forward-or-fixing-a-redesign-regression

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_a987a52a709a38d22e54b93d50d987fa |
| sourceUnitDigest | 4c165b0bf2c28fa82473709f46b3a81d1535d3caec1c64c7724bcb54b7b2a4a9 |
| claimKind | architecture |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#172-follow-on-task-sets-2026-08-26-each-pulling-one-15-deferred-item-forward-or-fixing-a-redesign-regression is retained in docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#172-follow-on-task-sets-2026-08-26-each-pulling-one-15-deferred-item-forward-or-fixing-a-redesign-regression. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md |
| targetAnchor | 172-follow-on-task-sets-2026-08-26-each-pulling-one-15-deferred-item-forward-or-fixing-a-redesign-regression |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | 4c165b0bf2c28fa82473709f46b3a81d1535d3caec1c64c7724bcb54b7b2a4a9 |
| targetAncestry | \["Dispatch Control Plane Redesign","17. Task Sets That Implemented This Plan (2026-08-25 → 2026-08-26)"\] |

### Source unit

```text
### 17.2 Follow-on task sets (2026-08-26), each pulling one §15 "deferred" item forward or fixing a redesign regression

| Task | Title | Plan doc | Relation to this design |
|---|---|---|---|
| `tsk-17m` | D0026 native-dispatch-doctrine narrative reconciliation | `docs/history/d0026-narrative-reconciliation/plan.md` | Doc-only; reconciles the Native-First Dispatch Doctrine narrative this plan depends on (§4.2, §6.3). |
| `tsk-5jl` | Generalize `herdr-spawn` executor adapter for live visibility (config-driven, correct result) | `docs/history/herdr-spawn-generalize-live-visibility/plan.md` | Extends §12.2's near-term Herdr adapter beyond the tsk-5x7-3 slice. |
| `tsk-10j` | agy-herdr interactive-mode redesign — real TUI visibility | `docs/history/herdr-spawn-agy-interactive-mode/plan.md` | Builds on the `herdr-spawn` adapter (§12.2) for the `agy` executor specifically. |
| `tsk-10n` | Herdr runtime boundary and orchestrator terminology | `docs/history/herdr-orchestrator-terminology-boundary/plan.md` | Landed as this doc's own §12.1a (Herdr Rust vocabulary is a separate namespace from §5.1's `orchestrator`). |
| `tsk-2tr` | Extract dispatch result normalization ladder | `docs/history/extract-dispatch-result-normalization-ladder/plan.md` | Refactors the §10 confidence-ladder result handling into a shared helper, ahead of tsk-1g6. |
| `tsk-1g6` | Dispatch result confidence — production reader | `docs/history/dispatch-result-confidence-reader/plan.md` | Pulls forward the §10/§15 "confidence telemetry needs a reader" entry criterion — first production consumer of result confidence, reusing tsk-2tr's ladder helper. |
| `tsk-2rr` | Fix false-idle polling race in `herdrSpawnInteractiveAdapter` | `docs/history/agy-herdr-false-idle-polling-race/plan.md` | Regression fix in the §12.2 Herdr adapter's idle/completion detection (decouple `done` from `sawWorking`, 3-poll debounce). |
| `tsk-by0` | Remove `herdr-spawn`'s non-interactive dispatch paths | `docs/history/herdr-spawn-remove-noninteractive-paths/plan.md` | Narrows §12.2's adapter to interactive-only after tsk-5jl/tsk-10j generalized it. |

Also same-window but only tangential to this doc: `tsk-2ii` (rename `agy`
executor id), `tsk-3vz` (flip `executors.agy-herdr` config default),
`tsk-1dd` (D0026 gap/duplicate check, mode tiny) — these touch dispatch
config/executors but don't implement a numbered item or §15 deferred entry
from this design.
```

### Target unit

```text
### 17.2 Follow-on task sets (2026-08-26), each pulling one §15 "deferred" item forward or fixing a redesign regression

| Task | Title | Plan doc | Relation to this design |
|---|---|---|---|
| `tsk-17m` | D0026 native-dispatch-doctrine narrative reconciliation | `docs/history/d0026-narrative-reconciliation/plan.md` | Doc-only; reconciles the Native-First Dispatch Doctrine narrative this plan depends on (§4.2, §6.3). |
| `tsk-5jl` | Generalize `herdr-spawn` executor adapter for live visibility (config-driven, correct result) | `docs/history/herdr-spawn-generalize-live-visibility/plan.md` | Extends §12.2's near-term Herdr adapter beyond the tsk-5x7-3 slice. |
| `tsk-10j` | agy-herdr interactive-mode redesign — real TUI visibility | `docs/history/herdr-spawn-agy-interactive-mode/plan.md` | Builds on the `herdr-spawn` adapter (§12.2) for the `agy` executor specifically. |
| `tsk-10n` | Herdr runtime boundary and orchestrator terminology | `docs/history/herdr-orchestrator-terminology-boundary/plan.md` | Landed as this doc's own §12.1a (Herdr Rust vocabulary is a separate namespace from §5.1's `orchestrator`). |
| `tsk-2tr` | Extract dispatch result normalization ladder | `docs/history/extract-dispatch-result-normalization-ladder/plan.md` | Refactors the §10 confidence-ladder result handling into a shared helper, ahead of tsk-1g6. |
| `tsk-1g6` | Dispatch result confidence — production reader | `docs/history/dispatch-result-confidence-reader/plan.md` | Pulls forward the §10/§15 "confidence telemetry needs a reader" entry criterion — first production consumer of result confidence, reusing tsk-2tr's ladder helper. |
| `tsk-2rr` | Fix false-idle polling race in `herdrSpawnInteractiveAdapter` | `docs/history/agy-herdr-false-idle-polling-race/plan.md` | Regression fix in the §12.2 Herdr adapter's idle/completion detection (decouple `done` from `sawWorking`, 3-poll debounce). |
| `tsk-by0` | Remove `herdr-spawn`'s non-interactive dispatch paths | `docs/history/herdr-spawn-remove-noninteractive-paths/plan.md` | Narrows §12.2's adapter to interactive-only after tsk-5jl/tsk-10j generalized it. |

Also same-window but only tangential to this doc: `tsk-2ii` (rename `agy`
executor id), `tsk-3vz` (flip `executors.agy-herdr` config default),
`tsk-1dd` (D0026 gap/duplicate check, mode tiny) — these touch dispatch
config/executors but don't implement a numbered item or §15 deferred entry
from this design.
```

### Unified diff

```diff
No text difference.
```

## claim_04b6ec37215f079b7449be461afe4855

Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-162

Target: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-163

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_04b6ec37215f079b7449be461afe4855 |
| sourceUnitDigest | bbe4c42985d7de98daed6c515169292a584c1408f23a210d3db3d6c20b3220ce |
| claimKind | architecture |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-162 is retained in docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-163. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md |
| targetAnchor | unheaded-block-163 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | bbe4c42985d7de98daed6c515169292a584c1408f23a210d3db3d6c20b3220ce |
| targetAncestry | \["Dispatch Control Plane Redesign","17. Task Sets That Implemented This Plan (2026-08-25 → 2026-08-26)","17.2 Follow-on task sets (2026-08-26), each pulling one §15 \\"deferred\\" item forward or fixing a redesign regression"\] |

### Source unit

```text
| Task | Title | Plan doc | Relation to this design |
|---|---|---|---|
| `tsk-17m` | D0026 native-dispatch-doctrine narrative reconciliation | `docs/history/d0026-narrative-reconciliation/plan.md` | Doc-only; reconciles the Native-First Dispatch Doctrine narrative this plan depends on (§4.2, §6.3). |
| `tsk-5jl` | Generalize `herdr-spawn` executor adapter for live visibility (config-driven, correct result) | `docs/history/herdr-spawn-generalize-live-visibility/plan.md` | Extends §12.2's near-term Herdr adapter beyond the tsk-5x7-3 slice. |
| `tsk-10j` | agy-herdr interactive-mode redesign — real TUI visibility | `docs/history/herdr-spawn-agy-interactive-mode/plan.md` | Builds on the `herdr-spawn` adapter (§12.2) for the `agy` executor specifically. |
| `tsk-10n` | Herdr runtime boundary and orchestrator terminology | `docs/history/herdr-orchestrator-terminology-boundary/plan.md` | Landed as this doc's own §12.1a (Herdr Rust vocabulary is a separate namespace from §5.1's `orchestrator`). |
| `tsk-2tr` | Extract dispatch result normalization ladder | `docs/history/extract-dispatch-result-normalization-ladder/plan.md` | Refactors the §10 confidence-ladder result handling into a shared helper, ahead of tsk-1g6. |
| `tsk-1g6` | Dispatch result confidence — production reader | `docs/history/dispatch-result-confidence-reader/plan.md` | Pulls forward the §10/§15 "confidence telemetry needs a reader" entry criterion — first production consumer of result confidence, reusing tsk-2tr's ladder helper. |
| `tsk-2rr` | Fix false-idle polling race in `herdrSpawnInteractiveAdapter` | `docs/history/agy-herdr-false-idle-polling-race/plan.md` | Regression fix in the §12.2 Herdr adapter's idle/completion detection (decouple `done` from `sawWorking`, 3-poll debounce). |
| `tsk-by0` | Remove `herdr-spawn`'s non-interactive dispatch paths | `docs/history/herdr-spawn-remove-noninteractive-paths/plan.md` | Narrows §12.2's adapter to interactive-only after tsk-5jl/tsk-10j generalized it. |
```

### Target unit

```text
| Task | Title | Plan doc | Relation to this design |
|---|---|---|---|
| `tsk-17m` | D0026 native-dispatch-doctrine narrative reconciliation | `docs/history/d0026-narrative-reconciliation/plan.md` | Doc-only; reconciles the Native-First Dispatch Doctrine narrative this plan depends on (§4.2, §6.3). |
| `tsk-5jl` | Generalize `herdr-spawn` executor adapter for live visibility (config-driven, correct result) | `docs/history/herdr-spawn-generalize-live-visibility/plan.md` | Extends §12.2's near-term Herdr adapter beyond the tsk-5x7-3 slice. |
| `tsk-10j` | agy-herdr interactive-mode redesign — real TUI visibility | `docs/history/herdr-spawn-agy-interactive-mode/plan.md` | Builds on the `herdr-spawn` adapter (§12.2) for the `agy` executor specifically. |
| `tsk-10n` | Herdr runtime boundary and orchestrator terminology | `docs/history/herdr-orchestrator-terminology-boundary/plan.md` | Landed as this doc's own §12.1a (Herdr Rust vocabulary is a separate namespace from §5.1's `orchestrator`). |
| `tsk-2tr` | Extract dispatch result normalization ladder | `docs/history/extract-dispatch-result-normalization-ladder/plan.md` | Refactors the §10 confidence-ladder result handling into a shared helper, ahead of tsk-1g6. |
| `tsk-1g6` | Dispatch result confidence — production reader | `docs/history/dispatch-result-confidence-reader/plan.md` | Pulls forward the §10/§15 "confidence telemetry needs a reader" entry criterion — first production consumer of result confidence, reusing tsk-2tr's ladder helper. |
| `tsk-2rr` | Fix false-idle polling race in `herdrSpawnInteractiveAdapter` | `docs/history/agy-herdr-false-idle-polling-race/plan.md` | Regression fix in the §12.2 Herdr adapter's idle/completion detection (decouple `done` from `sawWorking`, 3-poll debounce). |
| `tsk-by0` | Remove `herdr-spawn`'s non-interactive dispatch paths | `docs/history/herdr-spawn-remove-noninteractive-paths/plan.md` | Narrows §12.2's adapter to interactive-only after tsk-5jl/tsk-10j generalized it. |
```

### Unified diff

```diff
No text difference.
```

## claim_b43af2d8406b98263e46ac70830cb4f7

Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-163

Target: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-164

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_b43af2d8406b98263e46ac70830cb4f7 |
| sourceUnitDigest | 9cc943464f8c6fabb7ff443244cab5daf013b45e9b506ae721008f48a03d80b7 |
| claimKind | architecture |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-163 is retained in docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-164. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md |
| targetAnchor | unheaded-block-164 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | 9cc943464f8c6fabb7ff443244cab5daf013b45e9b506ae721008f48a03d80b7 |
| targetAncestry | \["Dispatch Control Plane Redesign","17. Task Sets That Implemented This Plan (2026-08-25 → 2026-08-26)","17.2 Follow-on task sets (2026-08-26), each pulling one §15 \\"deferred\\" item forward or fixing a redesign regression"\] |

### Source unit

```text
Also same-window but only tangential to this doc: `tsk-2ii` (rename `agy`
executor id), `tsk-3vz` (flip `executors.agy-herdr` config default),
`tsk-1dd` (D0026 gap/duplicate check, mode tiny) — these touch dispatch
config/executors but don't implement a numbered item or §15 deferred entry
from this design.
```

### Target unit

```text
Also same-window but only tangential to this doc: `tsk-2ii` (rename `agy`
executor id), `tsk-3vz` (flip `executors.agy-herdr` config default),
`tsk-1dd` (D0026 gap/duplicate check, mode tiny) — these touch dispatch
config/executors but don't implement a numbered item or §15 deferred entry
from this design.
```

### Unified diff

```diff
No text difference.
```

## claim_635cfc93f91538f7526e79b3a2d251b9

Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#173-implementation-pointers-per-task-set

Target: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#173-implementation-pointers-per-task-set

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_635cfc93f91538f7526e79b3a2d251b9 |
| sourceUnitDigest | 0dc49783d6387a0acdcd23ced8b747ea068c12719d1b90d670356d9258d72b61 |
| claimKind | architecture |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#173-implementation-pointers-per-task-set is retained in docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#173-implementation-pointers-per-task-set. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md |
| targetAnchor | 173-implementation-pointers-per-task-set |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | 0dc49783d6387a0acdcd23ced8b747ea068c12719d1b90d670356d9258d72b61 |
| targetAncestry | \["Dispatch Control Plane Redesign","17. Task Sets That Implemented This Plan (2026-08-25 → 2026-08-26)"\] |

### Source unit

```text
### 17.3 Implementation Pointers Per Task Set

Real source/test files each task set actually touched (`git diff --stat`
per task's commit range), scoped to code — not the `docs/history/<task>/`
plan/research/iron-law-evidence files every task also writes. Doc-only
tasks are noted as such rather than listing their own plan doc again.

| Task | Files touched |
|---|---|
| `tsk-5x7-1` | none yet — piece lands its `decide --for`/`DispatchPlan` code in the root's later hardening pass below, not in its own commit range. |
| `tsk-5x7-2` | `docs/architecture-manifest.json` (registration only; governance code landed with the root). |
| `tsk-5x7-3` | none of its own — adapter code lands with the root's hardening pass below. |
| `tsk-5x7` (root hardening pass, `580fe09e..76d8539d`) | `src/runner/dispatch.mjs`, `src/runner/dispatch/cli.mjs`, `src/runner/dispatch/plan.mjs`, `src/runner/dispatch/resolve.mjs`, `src/runner/dispatch/transport.mjs`, `src/runner/loop.mjs`, `test/runner/dispatch.test.mjs`, `test/runner/herdr-spawn-adapter.test.mjs`, `test/runner/loop.test.mjs` |
| `tsk-17m` | doc-only: `docs/specs/runner.md`, this doc's own header/status text — no source/test files. |
| `tsk-5jl` | `src/runner/dispatch/config.mjs`, `src/runner/dispatch/live-renderers/claude-stream-json.mjs` (new), `src/runner/dispatch/live-renderers/pi-agent-session.mjs` (new), `src/runner/dispatch/resolve.mjs`, `src/runner/dispatch/transport.mjs`, `test/runner/herdr-spawn-adapter.test.mjs`, `docs/architecture-manifest.json`, `docs/enduser-docs-index.json` |
| `tsk-10j` | `src/runner/dispatch/cli.mjs`, `src/runner/dispatch/config.mjs`, `src/runner/dispatch/resolve.mjs`, `src/runner/dispatch/transport.mjs`, `test/runner/herdr-spawn-adapter.test.mjs` |
| `tsk-10n` | doc-only: this doc's own §12.1a — no source/test files. |
| `tsk-2tr` | `src/runner/dispatch/cli.mjs`, `src/runner/dispatch/result-ladder.mjs` (new), `test/runner/dispatch.test.mjs`, `docs/architecture-manifest.json` |
| `tsk-1g6` | `bin/fgos.mjs`, `src/cli/command-registry.mjs`, `src/report/dispatch-confidence.mjs` (new), `test/runner/dispatch.test.mjs`, `docs/architecture-manifest.json` |
| `tsk-2rr` | `src/runner/dispatch/transport.mjs`, `test/runner/herdr-spawn-adapter.test.mjs` |
| `tsk-by0` | `src/runner/dispatch/transport.mjs` (shrunk), `test/runner/herdr-spawn-adapter.test.mjs` (shrunk), `CHANGELOG.md`, `docs/architecture-manifest.json` (entries removed); deleted `src/runner/dispatch/live-renderers/claude-stream-json.mjs` and `pi-agent-session.mjs` (the two live-renderer files `tsk-5jl` had added) |

Net effect on §16's file list: `src/runner/dispatch/result-ladder.mjs` and
`src/report/dispatch-confidence.mjs` are new files this window added and
belong in §16's pointer list; `src/runner/dispatch/live-renderers/` was
added by `tsk-5jl` and removed again by `tsk-by0` — it no longer exists on
`main` and should not be added to §16.
```

### Target unit

```text
### 17.3 Implementation Pointers Per Task Set

Real source/test files each task set actually touched (`git diff --stat`
per task's commit range), scoped to code — not the `docs/history/<task>/`
plan/research/iron-law-evidence files every task also writes. Doc-only
tasks are noted as such rather than listing their own plan doc again.

| Task | Files touched |
|---|---|
| `tsk-5x7-1` | none yet — piece lands its `decide --for`/`DispatchPlan` code in the root's later hardening pass below, not in its own commit range. |
| `tsk-5x7-2` | `docs/architecture-manifest.json` (registration only; governance code landed with the root). |
| `tsk-5x7-3` | none of its own — adapter code lands with the root's hardening pass below. |
| `tsk-5x7` (root hardening pass, `580fe09e..76d8539d`) | `src/runner/dispatch.mjs`, `src/runner/dispatch/cli.mjs`, `src/runner/dispatch/plan.mjs`, `src/runner/dispatch/resolve.mjs`, `src/runner/dispatch/transport.mjs`, `src/runner/loop.mjs`, `test/runner/dispatch.test.mjs`, `test/runner/herdr-spawn-adapter.test.mjs`, `test/runner/loop.test.mjs` |
| `tsk-17m` | doc-only: `docs/specs/runner.md`, this doc's own header/status text — no source/test files. |
| `tsk-5jl` | `src/runner/dispatch/config.mjs`, `src/runner/dispatch/live-renderers/claude-stream-json.mjs` (new), `src/runner/dispatch/live-renderers/pi-agent-session.mjs` (new), `src/runner/dispatch/resolve.mjs`, `src/runner/dispatch/transport.mjs`, `test/runner/herdr-spawn-adapter.test.mjs`, `docs/architecture-manifest.json`, `docs/enduser-docs-index.json` |
| `tsk-10j` | `src/runner/dispatch/cli.mjs`, `src/runner/dispatch/config.mjs`, `src/runner/dispatch/resolve.mjs`, `src/runner/dispatch/transport.mjs`, `test/runner/herdr-spawn-adapter.test.mjs` |
| `tsk-10n` | doc-only: this doc's own §12.1a — no source/test files. |
| `tsk-2tr` | `src/runner/dispatch/cli.mjs`, `src/runner/dispatch/result-ladder.mjs` (new), `test/runner/dispatch.test.mjs`, `docs/architecture-manifest.json` |
| `tsk-1g6` | `bin/fgos.mjs`, `src/cli/command-registry.mjs`, `src/report/dispatch-confidence.mjs` (new), `test/runner/dispatch.test.mjs`, `docs/architecture-manifest.json` |
| `tsk-2rr` | `src/runner/dispatch/transport.mjs`, `test/runner/herdr-spawn-adapter.test.mjs` |
| `tsk-by0` | `src/runner/dispatch/transport.mjs` (shrunk), `test/runner/herdr-spawn-adapter.test.mjs` (shrunk), `CHANGELOG.md`, `docs/architecture-manifest.json` (entries removed); deleted `src/runner/dispatch/live-renderers/claude-stream-json.mjs` and `pi-agent-session.mjs` (the two live-renderer files `tsk-5jl` had added) |

Net effect on §16's file list: `src/runner/dispatch/result-ladder.mjs` and
`src/report/dispatch-confidence.mjs` are new files this window added and
belong in §16's pointer list; `src/runner/dispatch/live-renderers/` was
added by `tsk-5jl` and removed again by `tsk-by0` — it no longer exists on
`main` and should not be added to §16.
```

### Unified diff

```diff
No text difference.
```

## claim_21e01a4034e28f51618f809b45dba0c8

Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-164

Target: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-165

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_21e01a4034e28f51618f809b45dba0c8 |
| sourceUnitDigest | ccf65207ced6a4727311f188da96e6c9d1e62d8830e63bc42e774fa47d7b1713 |
| claimKind | architecture |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-164 is retained in docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-165. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md |
| targetAnchor | unheaded-block-165 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | ccf65207ced6a4727311f188da96e6c9d1e62d8830e63bc42e774fa47d7b1713 |
| targetAncestry | \["Dispatch Control Plane Redesign","17. Task Sets That Implemented This Plan (2026-08-25 → 2026-08-26)","17.3 Implementation Pointers Per Task Set"\] |

### Source unit

```text
Real source/test files each task set actually touched (`git diff --stat`
per task's commit range), scoped to code — not the `docs/history/<task>/`
plan/research/iron-law-evidence files every task also writes. Doc-only
tasks are noted as such rather than listing their own plan doc again.
```

### Target unit

```text
Real source/test files each task set actually touched (`git diff --stat`
per task's commit range), scoped to code — not the `docs/history/<task>/`
plan/research/iron-law-evidence files every task also writes. Doc-only
tasks are noted as such rather than listing their own plan doc again.
```

### Unified diff

```diff
No text difference.
```

## claim_adf0ba351a44a6b128a321d4b069fdb0

Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-165

Target: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-166

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_adf0ba351a44a6b128a321d4b069fdb0 |
| sourceUnitDigest | e5ebec05d9bbec882f84795a9c6d62bfbd66be57216fe3f50e01435c9726cd82 |
| claimKind | architecture |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-165 is retained in docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-166. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md |
| targetAnchor | unheaded-block-166 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | e5ebec05d9bbec882f84795a9c6d62bfbd66be57216fe3f50e01435c9726cd82 |
| targetAncestry | \["Dispatch Control Plane Redesign","17. Task Sets That Implemented This Plan (2026-08-25 → 2026-08-26)","17.3 Implementation Pointers Per Task Set"\] |

### Source unit

```text
| Task | Files touched |
|---|---|
| `tsk-5x7-1` | none yet — piece lands its `decide --for`/`DispatchPlan` code in the root's later hardening pass below, not in its own commit range. |
| `tsk-5x7-2` | `docs/architecture-manifest.json` (registration only; governance code landed with the root). |
| `tsk-5x7-3` | none of its own — adapter code lands with the root's hardening pass below. |
| `tsk-5x7` (root hardening pass, `580fe09e..76d8539d`) | `src/runner/dispatch.mjs`, `src/runner/dispatch/cli.mjs`, `src/runner/dispatch/plan.mjs`, `src/runner/dispatch/resolve.mjs`, `src/runner/dispatch/transport.mjs`, `src/runner/loop.mjs`, `test/runner/dispatch.test.mjs`, `test/runner/herdr-spawn-adapter.test.mjs`, `test/runner/loop.test.mjs` |
| `tsk-17m` | doc-only: `docs/specs/runner.md`, this doc's own header/status text — no source/test files. |
| `tsk-5jl` | `src/runner/dispatch/config.mjs`, `src/runner/dispatch/live-renderers/claude-stream-json.mjs` (new), `src/runner/dispatch/live-renderers/pi-agent-session.mjs` (new), `src/runner/dispatch/resolve.mjs`, `src/runner/dispatch/transport.mjs`, `test/runner/herdr-spawn-adapter.test.mjs`, `docs/architecture-manifest.json`, `docs/enduser-docs-index.json` |
| `tsk-10j` | `src/runner/dispatch/cli.mjs`, `src/runner/dispatch/config.mjs`, `src/runner/dispatch/resolve.mjs`, `src/runner/dispatch/transport.mjs`, `test/runner/herdr-spawn-adapter.test.mjs` |
| `tsk-10n` | doc-only: this doc's own §12.1a — no source/test files. |
| `tsk-2tr` | `src/runner/dispatch/cli.mjs`, `src/runner/dispatch/result-ladder.mjs` (new), `test/runner/dispatch.test.mjs`, `docs/architecture-manifest.json` |
| `tsk-1g6` | `bin/fgos.mjs`, `src/cli/command-registry.mjs`, `src/report/dispatch-confidence.mjs` (new), `test/runner/dispatch.test.mjs`, `docs/architecture-manifest.json` |
| `tsk-2rr` | `src/runner/dispatch/transport.mjs`, `test/runner/herdr-spawn-adapter.test.mjs` |
| `tsk-by0` | `src/runner/dispatch/transport.mjs` (shrunk), `test/runner/herdr-spawn-adapter.test.mjs` (shrunk), `CHANGELOG.md`, `docs/architecture-manifest.json` (entries removed); deleted `src/runner/dispatch/live-renderers/claude-stream-json.mjs` and `pi-agent-session.mjs` (the two live-renderer files `tsk-5jl` had added) |
```

### Target unit

```text
| Task | Files touched |
|---|---|
| `tsk-5x7-1` | none yet — piece lands its `decide --for`/`DispatchPlan` code in the root's later hardening pass below, not in its own commit range. |
| `tsk-5x7-2` | `docs/architecture-manifest.json` (registration only; governance code landed with the root). |
| `tsk-5x7-3` | none of its own — adapter code lands with the root's hardening pass below. |
| `tsk-5x7` (root hardening pass, `580fe09e..76d8539d`) | `src/runner/dispatch.mjs`, `src/runner/dispatch/cli.mjs`, `src/runner/dispatch/plan.mjs`, `src/runner/dispatch/resolve.mjs`, `src/runner/dispatch/transport.mjs`, `src/runner/loop.mjs`, `test/runner/dispatch.test.mjs`, `test/runner/herdr-spawn-adapter.test.mjs`, `test/runner/loop.test.mjs` |
| `tsk-17m` | doc-only: `docs/specs/runner.md`, this doc's own header/status text — no source/test files. |
| `tsk-5jl` | `src/runner/dispatch/config.mjs`, `src/runner/dispatch/live-renderers/claude-stream-json.mjs` (new), `src/runner/dispatch/live-renderers/pi-agent-session.mjs` (new), `src/runner/dispatch/resolve.mjs`, `src/runner/dispatch/transport.mjs`, `test/runner/herdr-spawn-adapter.test.mjs`, `docs/architecture-manifest.json`, `docs/enduser-docs-index.json` |
| `tsk-10j` | `src/runner/dispatch/cli.mjs`, `src/runner/dispatch/config.mjs`, `src/runner/dispatch/resolve.mjs`, `src/runner/dispatch/transport.mjs`, `test/runner/herdr-spawn-adapter.test.mjs` |
| `tsk-10n` | doc-only: this doc's own §12.1a — no source/test files. |
| `tsk-2tr` | `src/runner/dispatch/cli.mjs`, `src/runner/dispatch/result-ladder.mjs` (new), `test/runner/dispatch.test.mjs`, `docs/architecture-manifest.json` |
| `tsk-1g6` | `bin/fgos.mjs`, `src/cli/command-registry.mjs`, `src/report/dispatch-confidence.mjs` (new), `test/runner/dispatch.test.mjs`, `docs/architecture-manifest.json` |
| `tsk-2rr` | `src/runner/dispatch/transport.mjs`, `test/runner/herdr-spawn-adapter.test.mjs` |
| `tsk-by0` | `src/runner/dispatch/transport.mjs` (shrunk), `test/runner/herdr-spawn-adapter.test.mjs` (shrunk), `CHANGELOG.md`, `docs/architecture-manifest.json` (entries removed); deleted `src/runner/dispatch/live-renderers/claude-stream-json.mjs` and `pi-agent-session.mjs` (the two live-renderer files `tsk-5jl` had added) |
```

### Unified diff

```diff
No text difference.
```

## claim_9e361aad48c95808dc7d2e00e853cdd6

Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-166

Target: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-167

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_9e361aad48c95808dc7d2e00e853cdd6 |
| sourceUnitDigest | 7bdd550f4524be5c68524e225443a16ee9d91bf625f1de511b6e31caec83fec2 |
| claimKind | architecture |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-166 is retained in docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-167. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md |
| targetAnchor | unheaded-block-167 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | 7bdd550f4524be5c68524e225443a16ee9d91bf625f1de511b6e31caec83fec2 |
| targetAncestry | \["Dispatch Control Plane Redesign","17. Task Sets That Implemented This Plan (2026-08-25 → 2026-08-26)","17.3 Implementation Pointers Per Task Set"\] |

### Source unit

```text
Net effect on §16's file list: `src/runner/dispatch/result-ladder.mjs` and
`src/report/dispatch-confidence.mjs` are new files this window added and
belong in §16's pointer list; `src/runner/dispatch/live-renderers/` was
added by `tsk-5jl` and removed again by `tsk-by0` — it no longer exists on
`main` and should not be added to §16.
```

### Target unit

```text
Net effect on §16's file list: `src/runner/dispatch/result-ladder.mjs` and
`src/report/dispatch-confidence.mjs` are new files this window added and
belong in §16's pointer list; `src/runner/dispatch/live-renderers/` was
added by `tsk-5jl` and removed again by `tsk-by0` — it no longer exists on
`main` and should not be added to §16.
```

### Unified diff

```diff
No text difference.
```

## claim_cc10d4ac8b8c6ad0dce1dc43ee5d1278

Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-167

Target: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-168

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_cc10d4ac8b8c6ad0dce1dc43ee5d1278 |
| sourceUnitDigest | 4a2f39f5abea99a48a57f3d9af3374b640cc334124e52cbf8699046319d8ca0a |
| claimKind | decision |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-167 is retained in docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-168. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md |
| targetAnchor | unheaded-block-168 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | 4a2f39f5abea99a48a57f3d9af3374b640cc334124e52cbf8699046319d8ca0a |
| targetAncestry | \["Dispatch Control Plane Redesign","18. Broader Orchestration Vocabulary"\] |

### Source unit

```text
This document defines the dispatch-control-plane slice: how one selected
target resolves to an executor, mechanism, governance decision, adapter, and
result signal.
```

### Target unit

```text
This document defines the dispatch-control-plane slice: how one selected
target resolves to an executor, mechanism, governance decision, adapter, and
result signal.
```

### Unified diff

```diff
No text difference.
```

## claim_e7dce9e197497c2f44a8f5971681a587

Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-168

Target: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-169

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_e7dce9e197497c2f44a8f5971681a587 |
| sourceUnitDigest | dc950ce5cfd06b28f756dfe5fd3255926b963caf5e785a82cdae3be50e1c1ab1 |
| claimKind | architecture |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-168 is retained in docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-169. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md |
| targetAnchor | unheaded-block-169 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | dc950ce5cfd06b28f756dfe5fd3255926b963caf5e785a82cdae3be50e1c1ab1 |
| targetAncestry | \["Dispatch Control Plane Redesign","18. Broader Orchestration Vocabulary"\] |

### Source unit

```text
For the broader orchestration map around this slice, including the distinction
between mission, work, workflow, assignment, dispatch, runtime, evidence, and
visibility, see the canonical [Vocabulary Map](../vocabulary/README.md).
```

### Target unit

```text
For the broader orchestration map around this slice, including the distinction
between mission, work, workflow, assignment, dispatch, runtime, evidence, and
visibility, see the canonical [Vocabulary Map](../vocabulary/README.md).
```

### Unified diff

```diff
No text difference.
```

## claim_cb55b0d936792af1f1e2718ff067ef63

Source: docs/architect/agent-coordination/proposals/README.md#unheaded-block-4

Target: docs/platform/agent-coordination/proposals/README.md#unheaded-block-5

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_cb55b0d936792af1f1e2718ff067ef63 |
| sourceUnitDigest | 0d5cee8fe6f4312ea22b2b5dffa4db1d4282da8d1f13dbcc0e5cff4df38e44f2 |
| claimKind | architecture |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/README.md#unheaded-block-4 is retained in docs/platform/agent-coordination/proposals/README.md#unheaded-block-5. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/README.md |
| targetAnchor | unheaded-block-5 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | 0d5cee8fe6f4312ea22b2b5dffa4db1d4282da8d1f13dbcc0e5cff4df38e44f2 |
| targetAncestry | \["Agent Coordination Proposals","Active Proposals"\] |

### Source unit

```text
1. [Dispatch Control Plane Redesign](dispatch-control-plane-redesign.md) contains
   the detailed target and implementation-era findings behind the canonical
   dispatch summary.
2. [Team Communication Protocol V1](team-communication-protocol-v1.md) proposes
   role-to-role message and operation doctrine.
```

### Target unit

```text
1. [Dispatch Control Plane Redesign](dispatch-control-plane-redesign.md) contains
   the detailed target and implementation-era findings behind the canonical
   dispatch summary.
2. [Team Communication Protocol V1](team-communication-protocol-v1.md) proposes
   role-to-role message and operation doctrine.
```

### Unified diff

```diff
No text difference.
```

## claim_0a5b193e9d643f834ed7a5353ac8b512

Source: docs/architect/agent-coordination/proposals/README.md#unheaded-block-5

Target: docs/platform/agent-coordination/proposals/README.md#unheaded-block-6

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_0a5b193e9d643f834ed7a5353ac8b512 |
| sourceUnitDigest | 538a6c24f7b667a8fdf24b90749219766f09e0a306c6e1f730c8aea57799a68d |
| claimKind | architecture |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/README.md#unheaded-block-5 is retained in docs/platform/agent-coordination/proposals/README.md#unheaded-block-6. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/README.md |
| targetAnchor | unheaded-block-6 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | 538a6c24f7b667a8fdf24b90749219766f09e0a306c6e1f730c8aea57799a68d |
| targetAncestry | \["Agent Coordination Proposals","Promoted History"\] |

### Source unit

```text
These proposals are no longer the active design frontier. Their accepted parts
have been promoted into architecture, contracts, and ADRs; their unresolved
parts remain explicitly deferred.
```

### Target unit

```text
These proposals are no longer the active design frontier. Their accepted parts
have been promoted into architecture, contracts, and ADRs; their unresolved
parts remain explicitly deferred.
```

### Unified diff

```diff
No text difference.
```

## claim_a8d4656df8484f8a03f6da40ba2d31d1

Source: docs/architect/agent-coordination/proposals/README.md#unheaded-block-6

Target: docs/platform/agent-coordination/proposals/README.md#unheaded-block-7

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_a8d4656df8484f8a03f6da40ba2d31d1 |
| sourceUnitDigest | 7478bc345f7fa77e35c3ccfb090a7b3762d16e0a4318f01dee73d7196e87cb18 |
| claimKind | contract |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/README.md#unheaded-block-6 is retained in docs/platform/agent-coordination/proposals/README.md#unheaded-block-7. Only Markdown reference locations differ in the full shown section. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/README.md |
| targetAnchor | unheaded-block-7 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | e6c7064b562782714a1267b213d0ca659bef13a677f21cc6058dc4f4462c2fa1 |
| targetAncestry | \["Agent Coordination Proposals","Promoted History"\] |

### Source unit

```text
1. [Step 07: CoordinationSession, AdhocTask, And Planning Boundary](step-07-coordination-session-adhoc-task.md)
   is historical discussion. CoordinationSession, runtime boundaries, and
   Work authority decisions were promoted; AdhocTask and generalized inline
   execution-contract schema remain unaccepted/deferred.
2. [Step 08: Standalone Coordination And Optional Protocols](step-08-standalone-coordination-protocols.md)
   is historical discussion for the delivered standalone coordination surface.
   Read [Coordination Foundation Baseline](../architecture/coordination-foundation-baseline.md),
   [CoordinationSession](../contracts/coordination-session.md), and
   [FlowDefinition](../contracts/flow-definition.md) for canonical design.
```

### Target unit

```text
1. [Step 07: CoordinationSession, AdhocTask, And Planning Boundary](../history/retired-engine/files/proposals/step-07-coordination-session-adhoc-task.md#literal-snapshot)
   is historical discussion. CoordinationSession, runtime boundaries, and
   Work authority decisions were promoted; AdhocTask and generalized inline
   execution-contract schema remain unaccepted/deferred.
2. [Step 08: Standalone Coordination And Optional Protocols](../history/retired-engine/files/proposals/step-08-standalone-coordination-protocols.md#literal-snapshot)
   is historical discussion for the delivered standalone coordination surface.
   Read [Coordination Foundation Baseline](../history/retired-engine/files/architecture/coordination-foundation-baseline.md#literal-snapshot),
   [CoordinationSession](../history/retired-engine/files/contracts/coordination-session.md#literal-snapshot), and
   [FlowDefinition](../history/retired-engine/files/contracts/flow-definition.md#literal-snapshot) for canonical design.
```

### Unified diff

```diff
--- "docs/architect/agent-coordination/proposals/README.md#unheaded-block-6"
+++ "docs/platform/agent-coordination/proposals/README.md#unheaded-block-7"
@@ -1,9 +1,9 @@
-1. [Step 07: CoordinationSession, AdhocTask, And Planning Boundary](step-07-coordination-session-adhoc-task.md)
+1. [Step 07: CoordinationSession, AdhocTask, And Planning Boundary](../history/retired-engine/files/proposals/step-07-coordination-session-adhoc-task.md#literal-snapshot)
    is historical discussion. CoordinationSession, runtime boundaries, and
    Work authority decisions were promoted; AdhocTask and generalized inline
    execution-contract schema remain unaccepted/deferred.
-2. [Step 08: Standalone Coordination And Optional Protocols](step-08-standalone-coordination-protocols.md)
+2. [Step 08: Standalone Coordination And Optional Protocols](../history/retired-engine/files/proposals/step-08-standalone-coordination-protocols.md#literal-snapshot)
    is historical discussion for the delivered standalone coordination surface.
-   Read [Coordination Foundation Baseline](../architecture/coordination-foundation-baseline.md),
-   [CoordinationSession](../contracts/coordination-session.md), and
-   [FlowDefinition](../contracts/flow-definition.md) for canonical design.
\ No newline at end of file
+   Read [Coordination Foundation Baseline](../history/retired-engine/files/architecture/coordination-foundation-baseline.md#literal-snapshot),
+   [CoordinationSession](../history/retired-engine/files/contracts/coordination-session.md#literal-snapshot), and
+   [FlowDefinition](../history/retired-engine/files/contracts/flow-definition.md#literal-snapshot) for canonical design.
\ No newline at end of file
```

## claim_f88a3d5e1c88b14b886bc166eaafe5c4

Source: docs/architect/agent-coordination/proposals/README.md#unheaded-block-9

Target: docs/platform/agent-coordination/proposals/README.md#unheaded-block-10

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_f88a3d5e1c88b14b886bc166eaafe5c4 |
| sourceUnitDigest | 26a63cb6b206a0275e590e8df35aa4f2bcb802252417323f16a5a75f4bf46f84 |
| claimKind | architecture |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/README.md#unheaded-block-9 is retained in docs/platform/agent-coordination/proposals/README.md#unheaded-block-10. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/README.md |
| targetAnchor | unheaded-block-10 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | 26a63cb6b206a0275e590e8df35aa4f2bcb802252417323f16a5a75f4bf46f84 |
| targetAncestry | \["Agent Coordination Proposals","Promotion Rule"\] |

### Source unit

```text
- term changes into `vocabulary/`;
- durable boundaries into `architecture/`;
- exact behavior into `contracts/`;
- accepted choices and rejected alternatives into `decisions/`;
- implementation sequence into `roadmap/`.
```

### Target unit

```text
- term changes into `vocabulary/`;
- durable boundaries into `architecture/`;
- exact behavior into `contracts/`;
- accepted choices and rejected alternatives into `decisions/`;
- implementation sequence into `roadmap/`.
```

### Unified diff

```diff
No text difference.
```

## claim_f6c786298435184ff3d5af7a3321ef4e

Source: docs/architect/agent-coordination/proposals/README.md#unheaded-block-10

Target: docs/platform/agent-coordination/proposals/README.md#unheaded-block-11

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_f6c786298435184ff3d5af7a3321ef4e |
| sourceUnitDigest | ceb6bdbd87c4361cb965140c25ba96873923a632f6822c747b91f77c589dfab5 |
| claimKind | architecture |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/README.md#unheaded-block-10 is retained in docs/platform/agent-coordination/proposals/README.md#unheaded-block-11. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/README.md |
| targetAnchor | unheaded-block-11 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | ceb6bdbd87c4361cb965140c25ba96873923a632f6822c747b91f77c589dfab5 |
| targetAncestry | \["Agent Coordination Proposals","Promotion Rule"\] |

### Source unit

```text
Do not relabel an entire mixed proposal as canonical.
```

### Target unit

```text
Do not relabel an entire mixed proposal as canonical.
```

### Unified diff

```diff
No text difference.
```

## claim_a7d5db612925b0dddda050be37b4f564

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-3

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-3

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_a7d5db612925b0dddda050be37b4f564 |
| sourceUnitDigest | ecd69b7cac9013d136c9a343973af68a42107edeeac469301539c8dcbb8864e3 |
| claimKind | contract |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-3 is retained in docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-3. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-3 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | ecd69b7cac9013d136c9a343973af68a42107edeeac469301539c8dcbb8864e3 |
| targetAncestry | \["Team Communication Protocol V1","1. Purpose"\] |

### Source unit

```text
Team Dispatch V1 needs a communication protocol, but it must stay smaller than
a mailbox, daemon, or second lifecycle system.
```

### Target unit

```text
Team Dispatch V1 needs a communication protocol, but it must stay smaller than
a mailbox, daemon, or second lifecycle system.
```

### Unified diff

```diff
No text difference.
```

## claim_d49d36501d7dffa090b41cc252de8fc6

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-4

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-4

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_d49d36501d7dffa090b41cc252de8fc6 |
| sourceUnitDigest | b3b8e691ec81ad84fd588ef1c9a6981f747952acfe367d9958d9f29c8f4887ad |
| claimKind | contract |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-4 is retained in docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-4. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-4 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | b3b8e691ec81ad84fd588ef1c9a6981f747952acfe367d9958d9f29c8f4887ad |
| targetAncestry | \["Team Communication Protocol V1","1. Purpose"\] |

### Source unit

```text
This proposal describes a Work-attached coding-domain protocol and one early
standalone prototype. It is not the universal entry model for Agent
Coordination. Per the [Agent Coordination Foundation Vision](../vision.md), an
agent-led session may coordinate through validated dynamic execution contracts
without a predeclared Workflow/Stage graph.
```

### Target unit

```text
This proposal describes a Work-attached coding-domain protocol and one early
standalone prototype. It is not the universal entry model for Agent
Coordination. Per the [Agent Coordination Foundation Vision](../vision.md), an
agent-led session may coordinate through validated dynamic execution contracts
without a predeclared Workflow/Stage graph.
```

### Unified diff

```diff
No text difference.
```

## claim_8542447325252dd1efcaf60e2a1aec75

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-5

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-5

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_8542447325252dd1efcaf60e2a1aec75 |
| sourceUnitDigest | 833c531e8fdeb6c904c1e26c040f97b9109c7bb9403fdbcac81dbf2d72fb3d15 |
| claimKind | contract |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-5 is retained in docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-5. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-5 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | 833c531e8fdeb6c904c1e26c040f97b9109c7bb9403fdbcac81dbf2d72fb3d15 |
| targetAncestry | \["Team Communication Protocol V1","1. Purpose"\] |

### Source unit

```text
The protocol defines how roles communicate while `Work` remains the lifecycle
authority:
```

### Target unit

```text
The protocol defines how roles communicate while `Work` remains the lifecycle
authority:
```

### Unified diff

```diff
No text difference.
```

## claim_8542779d7837422248635f92de9b3acc

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-6

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-6

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_8542779d7837422248635f92de9b3acc |
| sourceUnitDigest | 978a58e97f57c8fd35a307893f95258075982cf4c2a5b0c90cced1dd574b7b0d |
| claimKind | contract |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-6 is retained in docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-6. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-6 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | 978a58e97f57c8fd35a307893f95258075982cf4c2a5b0c90cced1dd574b7b0d |
| targetAncestry | \["Team Communication Protocol V1","1. Purpose"\] |

### Source unit

````text
```txt
Work position
  -> current workflow stage
    -> legal stage operations
      -> selected Assignment
        -> one Run
          -> one RunResult
            -> driver chooses the next legal operation or engine verb
```
````

### Target unit

````text
```txt
Work position
  -> current workflow stage
    -> legal stage operations
      -> selected Assignment
        -> one Run
          -> one RunResult
            -> driver chooses the next legal operation or engine verb
```
````

### Unified diff

```diff
No text difference.
```

## claim_6035c3df234b0985cba970d283cf4280

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-7

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-7

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_6035c3df234b0985cba970d283cf4280 |
| sourceUnitDigest | 6a6030031d9c451d1ae3ad6ea9579381f8c9e9962c310e6bdd2b86d7a7a1fa66 |
| claimKind | contract |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-7 is retained in docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-7. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-7 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | 6a6030031d9c451d1ae3ad6ea9579381f8c9e9962c310e6bdd2b86d7a7a1fa66 |
| targetAncestry | \["Team Communication Protocol V1","1. Purpose"\] |

### Source unit

```text
The protocol is not a meeting scheduler. It is the set of rules that make one
role's message usable by another role without trusting terminal text or agent
say-so as proof.
```

### Target unit

```text
The protocol is not a meeting scheduler. It is the set of rules that make one
role's message usable by another role without trusting terminal text or agent
say-so as proof.
```

### Unified diff

```diff
No text difference.
```

## claim_00e1655090bf22e4220e1a3ced2d7754

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-8

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-8

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_00e1655090bf22e4220e1a3ced2d7754 |
| sourceUnitDigest | 5d24354554fdf1aed4c4baad1294475bb1d44e0b36c912743d7122764454c240 |
| claimKind | contract |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-8 is retained in docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-8. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-8 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | 5d24354554fdf1aed4c4baad1294475bb1d44e0b36c912743d7122764454c240 |
| targetAncestry | \["Team Communication Protocol V1","2. Non-Negotiable Boundaries"\] |

### Source unit

````text
```txt
Work is lifecycle authority.
Mission is a lightweight team envelope.
Stage is workflow position.
Stage Operation is one legal task-shaped action inside a stage.
Assignment is a semantic request.
Run is a runtime attempt.
RunResult is normalized result plus evidence.
Herdr is visibility only.
```
````

### Target unit

````text
```txt
Work is lifecycle authority.
Mission is a lightweight team envelope.
Stage is workflow position.
Stage Operation is one legal task-shaped action inside a stage.
Assignment is a semantic request.
Run is a runtime attempt.
RunResult is normalized result plus evidence.
Herdr is visibility only.
```
````

### Unified diff

```diff
No text difference.
```

## claim_61718cefbaac91cd6525485236e05fca

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-9

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-9

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_61718cefbaac91cd6525485236e05fca |
| sourceUnitDigest | 5fd6e58a75202aca351252a5317a2a8e126a664fb57dca480822600d1c3abe11 |
| claimKind | contract |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-9 is retained in docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-9. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-9 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | 5fd6e58a75202aca351252a5317a2a8e126a664fb57dca480822600d1c3abe11 |
| targetAncestry | \["Team Communication Protocol V1","2. Non-Negotiable Boundaries"\] |

### Source unit

```text
Do not introduce `Job` in V1. `Job` remains reserved for a future queue,
scheduler, lease, cancellation, or worker-pool design.
```

### Target unit

```text
Do not introduce `Job` in V1. `Job` remains reserved for a future queue,
scheduler, lease, cancellation, or worker-pool design.
```

### Unified diff

```diff
No text difference.
```

## claim_1107e3b2ca450006c66c673628f6c566

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-10

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-10

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_1107e3b2ca450006c66c673628f6c566 |
| sourceUnitDigest | ff646ad5d24962f64b1a14689561c61e7d44576247fad8b9231166a13f5de259 |
| claimKind | contract |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-10 is retained in docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-10. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-10 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | ff646ad5d24962f64b1a14689561c61e7d44576247fad8b9231166a13f5de259 |
| targetAncestry | \["Team Communication Protocol V1","2. Non-Negotiable Boundaries"\] |

### Source unit

```text
Do not let an Assignment mutate Work lifecycle state by itself. Work moves only
through existing engine verbs such as `fgos discover`, `fgos plan`, `fgos
return`, `fgos ask`, `fgos answer`, and approval/merge verbs.
```

### Target unit

```text
Do not let an Assignment mutate Work lifecycle state by itself. Work moves only
through existing engine verbs such as `fgos discover`, `fgos plan`, `fgos
return`, `fgos ask`, `fgos answer`, and approval/merge verbs.
```

### Unified diff

```diff
No text difference.
```

## claim_9fb4f4da8b39d374dd3725e6d9724d35

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-11

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-11

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_9fb4f4da8b39d374dd3725e6d9724d35 |
| sourceUnitDigest | 7e6302c7f5cae840cc85711797fb684f80484a80d8d1a95573c5399834f0945b |
| claimKind | contract |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-11 is retained in docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-11. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-11 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | 7e6302c7f5cae840cc85711797fb684f80484a80d8d1a95573c5399834f0945b |
| targetAncestry | \["Team Communication Protocol V1","3. Roles"\] |

### Source unit

```text
The coding domain starts with the roles already declared in the role graph:
```

### Target unit

```text
The coding domain starts with the roles already declared in the role graph:
```

### Unified diff

```diff
No text difference.
```

## claim_ab67d3b7517abae5115ff61416319fab

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-12

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-12

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_ab67d3b7517abae5115ff61416319fab |
| sourceUnitDigest | c47c4db5cb7e7782beace7a591d4efe204b4e22848f0b31ca30e7670942f1622 |
| claimKind | contract |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-12 is retained in docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-12. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-12 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | c47c4db5cb7e7782beace7a591d4efe204b4e22848f0b31ca30e7670942f1622 |
| targetAncestry | \["Team Communication Protocol V1","3. Roles"\] |

### Source unit

```text
| Role | Responsibility | Typical operation family |
|---|---|---|
| `implementer` | Owns the current Work item, edits repo state, invokes engine verbs, and coordinates legal sub-calls. | `judge-ambiguity`, `shape-plan`, `implement-item`, `fix-verify-red` |
| `researcher` | Gathers evidence and facts. It may read repo context, run approved research tools, or inspect docs. | `resolve-question`, `scout-blast-radius` |
| `reviewer` | Finds correctness, feasibility, regression, and test risks. | `validate-plan`, `review-item` |
| `helper` | Performs an independent scoped piece whose footprint does not collide with the driver's active edit surface. | `scoped-subtask` |
| `advisor` | Answers product, scope, priority, or human-intent questions that cannot be settled from machine evidence. | `answer-question`, selected `advise` interactions |
```

### Target unit

```text
| Role | Responsibility | Typical operation family |
|---|---|---|
| `implementer` | Owns the current Work item, edits repo state, invokes engine verbs, and coordinates legal sub-calls. | `judge-ambiguity`, `shape-plan`, `implement-item`, `fix-verify-red` |
| `researcher` | Gathers evidence and facts. It may read repo context, run approved research tools, or inspect docs. | `resolve-question`, `scout-blast-radius` |
| `reviewer` | Finds correctness, feasibility, regression, and test risks. | `validate-plan`, `review-item` |
| `helper` | Performs an independent scoped piece whose footprint does not collide with the driver's active edit surface. | `scoped-subtask` |
| `advisor` | Answers product, scope, priority, or human-intent questions that cannot be settled from machine evidence. | `answer-question`, selected `advise` interactions |
```

### Unified diff

```diff
No text difference.
```

## claim_2e21db456b0f05f955af46a2191712ad

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-13

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-13

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_2e21db456b0f05f955af46a2191712ad |
| sourceUnitDigest | 4015d267197784676f52d91dc488be71b148be2a5a310e0698cfc16b9e3a9471 |
| claimKind | contract |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-13 is retained in docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-13. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-13 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | 4015d267197784676f52d91dc488be71b148be2a5a310e0698cfc16b9e3a9471 |
| targetAncestry | \["Team Communication Protocol V1","3. Roles"\] |

### Source unit

```text
Role is not executor. A reviewer can run on Codex, Claude, agy, pi, or a future
executor if policy and governance allow it.
```

### Target unit

```text
Role is not executor. A reviewer can run on Codex, Claude, agy, pi, or a future
executor if policy and governance allow it.
```

### Unified diff

```diff
No text difference.
```

## claim_e7e86a8ca90d80602b8286cd75c34562

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-14

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-14

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_e7e86a8ca90d80602b8286cd75c34562 |
| sourceUnitDigest | 0f8cf844c97de3526eee2ec61054ff6f1f020149ef271b99a4047051ecdfefcc |
| claimKind | contract |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-14 is retained in docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-14. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-14 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | 0f8cf844c97de3526eee2ec61054ff6f1f020149ef271b99a4047051ecdfefcc |
| targetAncestry | \["Team Communication Protocol V1","3. Roles"\] |

### Source unit

```text
Role is not stage owner. A stage owner may dispatch an Assignment to another
role while the Work item stays at the same stage.
```

### Target unit

```text
Role is not stage owner. A stage owner may dispatch an Assignment to another
role while the Work item stays at the same stage.
```

### Unified diff

```diff
No text difference.
```

## claim_49a164a6d5638c69cedb16f816e7a19b

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-15

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-15

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_49a164a6d5638c69cedb16f816e7a19b |
| sourceUnitDigest | 97a87aa3ca51c8b5a5299f12ef0a772649856605de2d900dbd0d2fe47c9ef313 |
| claimKind | contract |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-15 is retained in docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-15. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-15 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | 97a87aa3ca51c8b5a5299f12ef0a772649856605de2d900dbd0d2fe47c9ef313 |
| targetAncestry | \["Team Communication Protocol V1","4. Communication Modes"\] |

### Source unit

```text
The role graph's `mode` field has protocol meaning:
```

### Target unit

```text
The role graph's `mode` field has protocol meaning:
```

### Unified diff

```diff
No text difference.
```

## claim_786929f6ae58e1e2fefd5e08805433ae

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-16

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-16

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_786929f6ae58e1e2fefd5e08805433ae |
| sourceUnitDigest | e648f0d7dce1322214f40a89a0fd813bbdb8389e26d00f53bc9ce3f4fe1f4fd5 |
| claimKind | contract |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-16 is retained in docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-16. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-16 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | e648f0d7dce1322214f40a89a0fd813bbdb8389e26d00f53bc9ce3f4fe1f4fd5 |
| targetAncestry | \["Team Communication Protocol V1","4. Communication Modes"\] |

### Source unit

```text
| Mode | Meaning | Lifecycle effect | Required evidence |
|---|---|---|---|
| `sync` | Caller waits for a bounded finding or work product, then continues in the same stage. | Work usually stays claimed by the caller; holder may be logged but returns immediately. | Structured result artifact for read-only calls; git/artifact delta for mutating helper work. |
| `async` | Caller cannot continue without another actor or human-adjacent answer. | Work may park, or holder may move until a future reclaim. | A recorded question, answer, review verdict, or blocker with context refs. |
```

### Target unit

```text
| Mode | Meaning | Lifecycle effect | Required evidence |
|---|---|---|---|
| `sync` | Caller waits for a bounded finding or work product, then continues in the same stage. | Work usually stays claimed by the caller; holder may be logged but returns immediately. | Structured result artifact for read-only calls; git/artifact delta for mutating helper work. |
| `async` | Caller cannot continue without another actor or human-adjacent answer. | Work may park, or holder may move until a future reclaim. | A recorded question, answer, review verdict, or blocker with context refs. |
```

### Unified diff

```diff
No text difference.
```

## claim_37730bd21cb1e3dc98a453dd7f96a13a

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-17

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-17

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_37730bd21cb1e3dc98a453dd7f96a13a |
| sourceUnitDigest | da909120a851450c745f09b1b2ede09591abbb5881d013a1fb1dc0587c369569 |
| claimKind | contract |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-17 is retained in docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-17. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-17 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | da909120a851450c745f09b1b2ede09591abbb5881d013a1fb1dc0587c369569 |
| targetAncestry | \["Team Communication Protocol V1","4. Communication Modes"\] |

### Source unit

```text
`sync` does not mean invisible. It still needs a recorded handoff or Assignment
RunResult when the result matters to later decisions.
```

### Target unit

```text
`sync` does not mean invisible. It still needs a recorded handoff or Assignment
RunResult when the result matters to later decisions.
```

### Unified diff

```diff
No text difference.
```

## claim_2e1640a602ac5bc9503b7acd4248e56f

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-18

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-18

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_2e1640a602ac5bc9503b7acd4248e56f |
| sourceUnitDigest | 7dc21721e330ea3eacc151031668dc7a0222f3590a65715f4fcee68c33ac0926 |
| claimKind | contract |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-18 is retained in docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-18. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-18 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | 7dc21721e330ea3eacc151031668dc7a0222f3590a65715f4fcee68c33ac0926 |
| targetAncestry | \["Team Communication Protocol V1","4. Communication Modes"\] |

### Source unit

```text
`async` does not mean a new Work item. It becomes Work only when the request
needs independent lifecycle, approval, merge, or backlog visibility.
```

### Target unit

```text
`async` does not mean a new Work item. It becomes Work only when the request
needs independent lifecycle, approval, merge, or backlog visibility.
```

### Unified diff

```diff
No text difference.
```

## claim_94c7daf8908cd5de9fbe1bd6dbbd042b

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-19

Target: docs/platform/agent-coordination/history/retired-engine/files/proposals/team-communication-protocol-v1.md#literal-snapshot

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_94c7daf8908cd5de9fbe1bd6dbbd042b |
| sourceUnitDigest | 6e5ac6dfbbd3f5d8e4f17e888282b888ec67337755cb27edd1ede6f6ce32c91c |
| claimKind | contract |
| disposition | move |
| rationale | This particular legacy unit docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-19 is retained verbatim inside docs/platform/agent-coordination/history/retired-engine/files/proposals/team-communication-protocol-v1.md#literal-snapshot as the dated pre-rework statement, not as an assertion that the whole surviving file is retired. The current version of docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md distinguishes present runtime behaviour/design obligations from the original session-only, obsolete interface or dated implementation wording. Retirement 2180b4e72 applies only to session-engine portions; live guidance is restored at its current path and receives a separate independent check. No old approval carries to this corrected unit-specific explanation. |
| targetOwner | docs/platform/agent-coordination/history/retired-engine/files/proposals/team-communication-protocol-v1.md |
| targetAnchor | literal-snapshot |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | c3a4d458bb1581e2f7b65a4b653037ba1866eb3ac0ee69dd189c0de195a97578 |
| targetAncestry | \["Historical File: Team Communication Protocol V1"\] |

### Source unit

```text
The driver may choose only operations declared for the current stage by
`operationsForStage(domain, stage, { kind })`.
```

### Target unit

````text
## Literal Snapshot

~~~~text
# Team Communication Protocol V1

```txt
Document type: Proposal
Audience: Human reviewers, maintainers, documentation agents
Purpose: Preserve source material for Team Communication Protocol V1
Design status: Candidate
Implementation: Not re-verified; source implementation statements remain in the body
Provenance: Retained from docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md at fcfe78cb89585bc9ab23f11bab67d41458834fc4
Writer type: Documentation maintainer
Canonical for: Preserved proposal material for Team Communication Protocol V1; no authority cutover
Use this when: Comparing this candidate with its pinned legacy source
Do not use this for: Inferring current implementation or supersession of retained sources
Last reviewed: UNPROVEN; independent content review pending
Related:
- docs/platform/agent-coordination/vision.md
- docs/platform/agent-coordination/playbooks/coordination-operating-harness.md
- docs/platform/agent-coordination/proposals/step-08-standalone-coordination-protocols.md
Supersedes: None; retained source authority is unchanged
Superseded by: None
Added in candidate: Promotion metadata only; source claims and implementation are not re-decided here
```
Document type: Proposal
Design status: Proposed
Implementation: Partial
Last reviewed: 2026-08-31
Canonical for: nothing until communication contracts are accepted
Original date: 2026-08-28
Scope: role-to-role communication inside coding-domain stage protocols, Work-attached assignments, RunResult evidence, and standalone read-only coordination

## 1. Purpose

Team Dispatch V1 needs a communication protocol, but it must stay smaller than
a mailbox, daemon, or second lifecycle system.

This proposal describes a Work-attached coding-domain protocol and one early
standalone prototype. It is not the universal entry model for Agent
Coordination. Per the [Agent Coordination Foundation Vision](../vision.md), an
agent-led session may coordinate through validated dynamic execution contracts
without a predeclared Workflow/Stage graph.

The protocol defines how roles communicate while `Work` remains the lifecycle
authority:

```txt
Work position
  -> current workflow stage
    -> legal stage operations
      -> selected Assignment
        -> one Run
          -> one RunResult
            -> driver chooses the next legal operation or engine verb
```

The protocol is not a meeting scheduler. It is the set of rules that make one
role's message usable by another role without trusting terminal text or agent
say-so as proof.

## 2. Non-Negotiable Boundaries

```txt
Work is lifecycle authority.
Mission is a lightweight team envelope.
Stage is workflow position.
Stage Operation is one legal task-shaped action inside a stage.
Assignment is a semantic request.
Run is a runtime attempt.
RunResult is normalized result plus evidence.
Herdr is visibility only.
```

Do not introduce `Job` in V1. `Job` remains reserved for a future queue,
scheduler, lease, cancellation, or worker-pool design.

Do not let an Assignment mutate Work lifecycle state by itself. Work moves only
through existing engine verbs such as `fgos discover`, `fgos plan`, `fgos
return`, `fgos ask`, `fgos answer`, and approval/merge verbs.

## 3. Roles

The coding domain starts with the roles already declared in the role graph:

| Role | Responsibility | Typical operation family |
|---|---|---|
| `implementer` | Owns the current Work item, edits repo state, invokes engine verbs, and coordinates legal sub-calls. | `judge-ambiguity`, `shape-plan`, `implement-item`, `fix-verify-red` |
| `researcher` | Gathers evidence and facts. It may read repo context, run approved research tools, or inspect docs. | `resolve-question`, `scout-blast-radius` |
| `reviewer` | Finds correctness, feasibility, regression, and test risks. | `validate-plan`, `review-item` |
| `helper` | Performs an independent scoped piece whose footprint does not collide with the driver's active edit surface. | `scoped-subtask` |
| `advisor` | Answers product, scope, priority, or human-intent questions that cannot be settled from machine evidence. | `answer-question`, selected `advise` interactions |

Role is not executor. A reviewer can run on Codex, Claude, agy, pi, or a future
executor if policy and governance allow it.

Role is not stage owner. A stage owner may dispatch an Assignment to another
role while the Work item stays at the same stage.

## 4. Communication Modes

The role graph's `mode` field has protocol meaning:

| Mode | Meaning | Lifecycle effect | Required evidence |
|---|---|---|---|
| `sync` | Caller waits for a bounded finding or work product, then continues in the same stage. | Work usually stays claimed by the caller; holder may be logged but returns immediately. | Structured result artifact for read-only calls; git/artifact delta for mutating helper work. |
| `async` | Caller cannot continue without another actor or human-adjacent answer. | Work may park, or holder may move until a future reclaim. | A recorded question, answer, review verdict, or blocker with context refs. |

`sync` does not mean invisible. It still needs a recorded handoff or Assignment
RunResult when the result matters to later decisions.

`async` does not mean a new Work item. It becomes Work only when the request
needs independent lifecycle, approval, merge, or backlog visibility.

## 5. Stage Operation Selection

The driver may choose only operations declared for the current stage by
`operationsForStage(domain, stage, { kind })`.

Selection rules:

1. Prefer the primary operation when the stage's normal owner work remains the
   next required action.
2. Choose a secondary operation when a bounded role contribution would unblock
   the stage without creating lifecycle-bearing child work.
3. Create child Work only when the contribution needs its own claim, branch,
   verify, approval, merge, or backlog visibility.
4. Route discovery unresolved ambiguity to `exploring`; discovery must not ask
   the human directly.
5. Refuse operations marked `dispatch: human-only` from cli-spawn assignment
   execution.
6. Refuse synthetic compatibility operations from runtime dispatch unless their
   task-spec file resolves and the caller explicitly accepts compatibility
   dispatch.

Examples:

| Stage | Situation | Operation |
|---|---|---|
| `discovery` | Need machine evidence for ambiguity. | `resolve-question` to `researcher`, then owner decides `clear` or `unclear`. |
| `planning` | Plan is written and needs proof before the edge to executing. | `validate-plan` to `reviewer`. |
| `planning` | A symbol's blast radius is unknown. | `scout-blast-radius` to `researcher`. |
| `executing` | Implementation needs a separate non-overlapping edit. | `scoped-subtask` to `helper`. |
| `executing` | Returned diff needs independent review. | `review-item` to `reviewer`. |
| `executing` | Review or verify reports a concrete red issue. | `fix-verify-red` to `implementer`. |

## 6. Assignment Message Contract

Every assignment prompt must provide the worker with enough information to
produce a usable result without learning fgOS internals.

Required prompt fields:

```txt
Assignment: <assignmentId>
Work: <workId or (none)>
Stage operation: <stage>.<operation>
Role: <role>
Task-spec: <task-spec path>
Objective: <bounded request>
Context refs:
- <ref>
Expected outputs:
- <output>
Result artifact:
- Write JSON to <runDir>/agent-result.json
- Optionally write Markdown to <runDir>/agent-report.md
```

The prompt must say that the worker should not call Work lifecycle verbs unless
the task-spec explicitly says the worker is the lifecycle driver. Ordinary
Assignment workers return artifacts; the driver interprets them.

The prompt must pass refs, not embedded large docs, diffs, transcripts, or
secrets.

## 7. Agent Result Schema

`agent-result.json` is the worker's structured claim. It is not proof by
itself.

Minimal schema:

```json
{
  "status": "done",
  "summary": "One concise result sentence.",
  "findings": [],
  "evidenceRefs": [],
  "nextRecommendedOperation": null
}
```

Allowed status values:

| Status | Meaning |
|---|---|
| `done` | The worker believes the assignment objective is complete. |
| `blocked` | The worker could not complete because a named blocker remains. |
| `failed` | The worker attempted the assignment and produced an error or invalid output. |
| `no-evidence` | The worker can report context but cannot support a completion claim. |

Required fields by status:

| Status | Required fields |
|---|---|
| `done` | `summary`; at least one `evidenceRefs` entry or a companion `agent-report.md` for read-only work; external git/artifact evidence for mutating work. |
| `blocked` | `summary`; `blocker`; `evidenceRefs` when any evidence exists. |
| `failed` | `summary`; `error`. |
| `no-evidence` | `summary`; reason why evidence is absent. |

Optional `nextRecommendedOperation` may name another legal stage operation, but
it is only a recommendation. The driver must verify legality before acting.

## 8. RunResult Confidence

RunResult status and confidence are control-plane judgments.

Confidence ladder:

| Confidence | Meaning | Allowed use |
|---|---|---|
| `verified` | Structured claim plus post-run external evidence such as a new commit, new changed file, test artifact, or verified result file. | May feed lifecycle decisions that require proof. |
| `reported` | Structured claim plus a worker-produced report for read-only consult/review work. | May feed driver judgment, but should not close mutating work. |
| `inferred` | Post-run external evidence exists but no structured claim exists. | May be surfaced for inspection; driver should avoid automatic lifecycle movement. |
| `no-evidence` | Process settled without proof. | Must not advance Work. |
| `failed` | Timeout, nonzero exit, signal, invalid schema, or explicit failure. | Must not advance Work. |

The driver must treat `done/no-evidence` as not done. It may retry, ask for a
proper artifact, or route to a different legal operation.

## 9. Handoff Versus Assignment

Use `handoff` when the interaction is a short role-axis record around work the
current session already performed or directly observed.

Use Assignment when:

- another executor, provider, role, or tool performs the action;
- the result will be read by a later driver turn;
- the result needs Run/RunResult evidence;
- the interaction may fail independently;
- a read-only consult/review needs an artifact rather than a one-line summary.

`handoff` remains useful for visibility and role-holder truth. It is not enough
evidence for a Team Dispatch operation once the result influences a lifecycle
decision.

## 10. Coding-Domain Stage Protocols

### 10.1 Discovery

Discovery is machine-alone.

Allowed behavior:

- owner reads existing Work context;
- owner consults researcher helpers for evidence;
- owner logs consult interactions;
- owner chooses `clear` or `unclear`;
- `clear` can route to planning;
- `unclear` routes to exploring.

Forbidden behavior:

- asking the human directly;
- parking as `awaiting-human`;
- treating a helper's unsupported answer as proof;
- opening a new Work item just to answer a bounded evidence question.

### 10.2 Exploring

Exploring is the human-adjacent decision-locking stage.

Allowed behavior:

- advisor interaction for material, grounded, answerable product questions;
- researcher consult for repo or external facts;
- lock decisions into CONTEXT.md.

Exploring may ask a human. It should ask only after machine evidence has been
gathered and the question is self-contained.

### 10.3 Planning

Planning has two main operation families:

- `shape-plan` by implementer;
- `validate-plan` by reviewer.

The stage owner may write the plan directly, but validation should move toward
a reviewer Assignment once Step 05 adopts operation choice.

`validate-plan` is a real reviewer-role operation when dispatched through
Assignment. Prose that says validating is only an implementer function must be
reconciled before driver adoption.

### 10.4 Executing

Executing has the richest team protocol:

- implementer owns the main edit path;
- researcher may answer blast-radius or API/pattern questions;
- helper may take independent scoped work;
- reviewer may review returned diffs or candidate fixes;
- advisor handles product/scope questions that exceed locked decisions.

The implementer remains responsible for Work lifecycle. Helper/reviewer
assignments return artifacts and recommendations unless explicitly promoted to
child Work.

## 11. Coordination Operating Harness

Multi-agent implementation benefits from a durable operating harness:

```txt
trace/index.md
trace/current-cell.md
trace/<cell>.md
prompt templates
review and red-team gates
live proof capture
```

This harness is documented in
[coordination-operating-harness.md](../playbooks/coordination-operating-harness.md). It is
supporting engineering practice, not Step 07 runtime infrastructure and not a
lifecycle system. Its job is to keep coordinator, doer, reviewer, and red-team
sessions aligned while preserving token budget and proof traceability.

The harness should be used where it reduces implementation drift, but dogfooding
it is not a runtime dependency gate for standalone coordination.

## 12. Standalone Read-Only Coordination

The current mission-lite implementation is a prototype for standalone read-only
coordination. Its generalization is still under discussion in
[Step 08](step-08-standalone-coordination-protocols.md) and depends on the relevant
CoordinationSession/AdhocTask contracts from
[Step 07](step-07-coordination-session-adhoc-task.md).

A standalone session may group assignments without a Work item for read-only
coordination:

```txt
mission-lite objective
  -> researcher background brief
  -> reviewer counter-argument
  -> advisor product framing
  -> driver synthesis
```

Mission-lite currently borrows coding Stage Operations. That is prototype
behavior, not a foundation requirement. The target standalone path may instead
construct validated dynamic Assignments and may optionally select a reusable
protocol.

Rules:

- no Work lifecycle;
- no repo mutation;
- no approval/merge semantics;
- every role result is a structured artifact;
- synthesis is a report, not a state transition;
- any resulting implementation proposal becomes ordinary Work before code is
  changed.

Good first case:

```txt
Question: Should coding-domain planning validation run as a reviewer Assignment
or stay as direct same-session validation?
```

This is useful because it tests team reasoning without risking Work lifecycle
truth.

## 13. Acceptance Criteria For V1 Protocol

The protocol is ready for driver adoption when:

- every runtime assignment receives an explicit result artifact path;
- malformed or missing structured claims cannot produce `verified` or
  `reported`;
- dirty-before files cannot be counted as post-run evidence;
- read-only operations can return `reported` only through worker artifacts;
- mutating operations require post-run external evidence;
- stage skills agree on when Assignment is used versus direct invocation;
- `validate-plan` role prose is consistent across skill and task-spec docs;
- discovery remains machine-alone.
~~~~
````

### Unified diff

````diff
--- "docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-19"
+++ "docs/platform/agent-coordination/history/retired-engine/files/proposals/team-communication-protocol-v1.md#literal-snapshot"
@@ -1,2 +1,391 @@
+## Literal Snapshot
+
+~~~~text
+# Team Communication Protocol V1
+
+```txt
+Document type: Proposal
+Audience: Human reviewers, maintainers, documentation agents
+Purpose: Preserve source material for Team Communication Protocol V1
+Design status: Candidate
+Implementation: Not re-verified; source implementation statements remain in the body
+Provenance: Retained from docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md at fcfe78cb89585bc9ab23f11bab67d41458834fc4
+Writer type: Documentation maintainer
+Canonical for: Preserved proposal material for Team Communication Protocol V1; no authority cutover
+Use this when: Comparing this candidate with its pinned legacy source
+Do not use this for: Inferring current implementation or supersession of retained sources
+Last reviewed: UNPROVEN; independent content review pending
+Related:
+- docs/platform/agent-coordination/vision.md
+- docs/platform/agent-coordination/playbooks/coordination-operating-harness.md
+- docs/platform/agent-coordination/proposals/step-08-standalone-coordination-protocols.md
+Supersedes: None; retained source authority is unchanged
+Superseded by: None
+Added in candidate: Promotion metadata only; source claims and implementation are not re-decided here
+```
+Document type: Proposal
+Design status: Proposed
+Implementation: Partial
+Last reviewed: 2026-08-31
+Canonical for: nothing until communication contracts are accepted
+Original date: 2026-08-28
+Scope: role-to-role communication inside coding-domain stage protocols, Work-attached assignments, RunResult evidence, and standalone read-only coordination
+
+## 1. Purpose
+
+Team Dispatch V1 needs a communication protocol, but it must stay smaller than
+a mailbox, daemon, or second lifecycle system.
+
+This proposal describes a Work-attached coding-domain protocol and one early
+standalone prototype. It is not the universal entry model for Agent
+Coordination. Per the [Agent Coordination Foundation Vision](../vision.md), an
+agent-led session may coordinate through validated dynamic execution contracts
+without a predeclared Workflow/Stage graph.
+
+The protocol defines how roles communicate while `Work` remains the lifecycle
+authority:
+
+```txt
+Work position
+  -> current workflow stage
+    -> legal stage operations
+      -> selected Assignment
+        -> one Run
+          -> one RunResult
+            -> driver chooses the next legal operation or engine verb
+```
+
+The protocol is not a meeting scheduler. It is the set of rules that make one
+role's message usable by another role without trusting terminal text or agent
+say-so as proof.
+
+## 2. Non-Negotiable Boundaries
+
+```txt
+Work is lifecycle authority.
+Mission is a lightweight team envelope.
+Stage is workflow position.
+Stage Operation is one legal task-shaped action inside a stage.
+Assignment is a semantic request.
+Run is a runtime attempt.
+RunResult is normalized result plus evidence.
+Herdr is visibility only.
+```
+
+Do not introduce `Job` in V1. `Job` remains reserved for a future queue,
+scheduler, lease, cancellation, or worker-pool design.
+
+Do not let an Assignment mutate Work lifecycle state by itself. Work moves only
+through existing engine verbs such as `fgos discover`, `fgos plan`, `fgos
+return`, `fgos ask`, `fgos answer`, and approval/merge verbs.
+
+## 3. Roles
+
+The coding domain starts with the roles already declared in the role graph:
+
+| Role | Responsibility | Typical operation family |
+|---|---|---|
+| `implementer` | Owns the current Work item, edits repo state, invokes engine verbs, and coordinates legal sub-calls. | `judge-ambiguity`, `shape-plan`, `implement-item`, `fix-verify-red` |
+| `researcher` | Gathers evidence and facts. It may read repo context, run approved research tools, or inspect docs. | `resolve-question`, `scout-blast-radius` |
+| `reviewer` | Finds correctness, feasibility, regression, and test risks. | `validate-plan`, `review-item` |
+| `helper` | Performs an independent scoped piece whose footprint does not collide with the driver's active edit surface. | `scoped-subtask` |
+| `advisor` | Answers product, scope, priority, or human-intent questions that cannot be settled from machine evidence. | `answer-question`, selected `advise` interactions |
+
+Role is not executor. A reviewer can run on Codex, Claude, agy, pi, or a future
+executor if policy and governance allow it.
+
+Role is not stage owner. A stage owner may dispatch an Assignment to another
+role while the Work item stays at the same stage.
+
+## 4. Communication Modes
+
+The role graph's `mode` field has protocol meaning:
+
+| Mode | Meaning | Lifecycle effect | Required evidence |
+|---|---|---|---|
+| `sync` | Caller waits for a bounded finding or work product, then continues in the same stage. | Work usually stays claimed by the caller; holder may be logged but returns immediately. | Structured result artifact for read-only calls; git/artifact delta for mutating helper work. |
+| `async` | Caller cannot continue without another actor or human-adjacent answer. | Work may park, or holder may move until a future reclaim. | A recorded question, answer, review verdict, or blocker with context refs. |
+
+`sync` does not mean invisible. It still needs a recorded handoff or Assignment
+RunResult when the result matters to later decisions.
+
+`async` does not mean a new Work item. It becomes Work only when the request
+needs independent lifecycle, approval, merge, or backlog visibility.
+
+## 5. Stage Operation Selection
+
 The driver may choose only operations declared for the current stage by
-`operationsForStage(domain, stage, { kind })`.
\ No newline at end of file
+`operationsForStage(domain, stage, { kind })`.
+
+Selection rules:
+
+1. Prefer the primary operation when the stage's normal owner work remains the
+   next required action.
+2. Choose a secondary operation when a bounded role contribution would unblock
+   the stage without creating lifecycle-bearing child work.
+3. Create child Work only when the contribution needs its own claim, branch,
+   verify, approval, merge, or backlog visibility.
+4. Route discovery unresolved ambiguity to `exploring`; discovery must not ask
+   the human directly.
+5. Refuse operations marked `dispatch: human-only` from cli-spawn assignment
+   execution.
+6. Refuse synthetic compatibility operations from runtime dispatch unless their
+   task-spec file resolves and the caller explicitly accepts compatibility
+   dispatch.
+
+Examples:
+
+| Stage | Situation | Operation |
+|---|---|---|
+| `discovery` | Need machine evidence for ambiguity. | `resolve-question` to `researcher`, then owner decides `clear` or `unclear`. |
+| `planning` | Plan is written and needs proof before the edge to executing. | `validate-plan` to `reviewer`. |
+| `planning` | A symbol's blast radius is unknown. | `scout-blast-radius` to `researcher`. |
+| `executing` | Implementation needs a separate non-overlapping edit. | `scoped-subtask` to `helper`. |
+| `executing` | Returned diff needs independent review. | `review-item` to `reviewer`. |
+| `executing` | Review or verify reports a concrete red issue. | `fix-verify-red` to `implementer`. |
+
+## 6. Assignment Message Contract
+
+Every assignment prompt must provide the worker with enough information to
+produce a usable result without learning fgOS internals.
+
+Required prompt fields:
+
+```txt
+Assignment: <assignmentId>
+Work: <workId or (none)>
+Stage operation: <stage>.<operation>
+Role: <role>
+Task-spec: <task-spec path>
+Objective: <bounded request>
+Context refs:
+- <ref>
+Expected outputs:
+- <output>
+Result artifact:
+- Write JSON to <runDir>/agent-result.json
+- Optionally write Markdown to <runDir>/agent-report.md
+```
+
+The prompt must say that the worker should not call Work lifecycle verbs unless
+the task-spec explicitly says the worker is the lifecycle driver. Ordinary
+Assignment workers return artifacts; the driver interprets them.
+
+The prompt must pass refs, not embedded large docs, diffs, transcripts, or
+secrets.
+
+## 7. Agent Result Schema
+
+`agent-result.json` is the worker's structured claim. It is not proof by
+itself.
+
+Minimal schema:
+
+```json
+{
+  "status": "done",
+  "summary": "One concise result sentence.",
+  "findings": [],
+  "evidenceRefs": [],
+  "nextRecommendedOperation": null
+}
+```
+
+Allowed status values:
+
+| Status | Meaning |
+|---|---|
+| `done` | The worker believes the assignment objective is complete. |
+| `blocked` | The worker could not complete because a named blocker remains. |
+| `failed` | The worker attempted the assignment and produced an error or invalid output. |
+| `no-evidence` | The worker can report context but cannot support a completion claim. |
+
+Required fields by status:
+
+| Status | Required fields |
+|---|---|
+| `done` | `summary`; at least one `evidenceRefs` entry or a companion `agent-report.md` for read-only work; external git/artifact evidence for mutating work. |
+| `blocked` | `summary`; `blocker`; `evidenceRefs` when any evidence exists. |
+| `failed` | `summary`; `error`. |
+| `no-evidence` | `summary`; reason why evidence is absent. |
+
+Optional `nextRecommendedOperation` may name another legal stage operation, but
+it is only a recommendation. The driver must verify legality before acting.
+
+## 8. RunResult Confidence
+
+RunResult status and confidence are control-plane judgments.
+
+Confidence ladder:
+
+| Confidence | Meaning | Allowed use |
+|---|---|---|
+| `verified` | Structured claim plus post-run external evidence such as a new commit, new changed file, test artifact, or verified result file. | May feed lifecycle decisions that require proof. |
+| `reported` | Structured claim plus a worker-produced report for read-only consult/review work. | May feed driver judgment, but should not close mutating work. |
+| `inferred` | Post-run external evidence exists but no structured claim exists. | May be surfaced for inspection; driver should avoid automatic lifecycle movement. |
+| `no-evidence` | Process settled without proof. | Must not advance Work. |
+| `failed` | Timeout, nonzero exit, signal, invalid schema, or explicit failure. | Must not advance Work. |
+
+The driver must treat `done/no-evidence` as not done. It may retry, ask for a
+proper artifact, or route to a different legal operation.
+
+## 9. Handoff Versus Assignment
+
+Use `handoff` when the interaction is a short role-axis record around work the
+current session already performed or directly observed.
+
+Use Assignment when:
+
+- another executor, provider, role, or tool performs the action;
+- the result will be read by a later driver turn;
+- the result needs Run/RunResult evidence;
+- the interaction may fail independently;
+- a read-only consult/review needs an artifact rather than a one-line summary.
+
+`handoff` remains useful for visibility and role-holder truth. It is not enough
+evidence for a Team Dispatch operation once the result influences a lifecycle
+decision.
+
+## 10. Coding-Domain Stage Protocols
+
+### 10.1 Discovery
+
+Discovery is machine-alone.
+
+Allowed behavior:
+
+- owner reads existing Work context;
+- owner consults researcher helpers for evidence;
+- owner logs consult interactions;
+- owner chooses `clear` or `unclear`;
+- `clear` can route to planning;
+- `unclear` routes to exploring.
+
+Forbidden behavior:
+
+- asking the human directly;
+- parking as `awaiting-human`;
+- treating a helper's unsupported answer as proof;
+- opening a new Work item just to answer a bounded evidence question.
+
+### 10.2 Exploring
+
+Exploring is the human-adjacent decision-locking stage.
+
+Allowed behavior:
+
+- advisor interaction for material, grounded, answerable product questions;
+- researcher consult for repo or external facts;
+- lock decisions into CONTEXT.md.
+
+Exploring may ask a human. It should ask only after machine evidence has been
+gathered and the question is self-contained.
+
+### 10.3 Planning
+
+Planning has two main operation families:
+
+- `shape-plan` by implementer;
+- `validate-plan` by reviewer.
+
+The stage owner may write the plan directly, but validation should move toward
+a reviewer Assignment once Step 05 adopts operation choice.
+
+`validate-plan` is a real reviewer-role operation when dispatched through
+Assignment. Prose that says validating is only an implementer function must be
+reconciled before driver adoption.
+
+### 10.4 Executing
+
+Executing has the richest team protocol:
+
+- implementer owns the main edit path;
+- researcher may answer blast-radius or API/pattern questions;
+- helper may take independent scoped work;
+- reviewer may review returned diffs or candidate fixes;
+- advisor handles product/scope questions that exceed locked decisions.
+
+The implementer remains responsible for Work lifecycle. Helper/reviewer
+assignments return artifacts and recommendations unless explicitly promoted to
+child Work.
+
+## 11. Coordination Operating Harness
+
+Multi-agent implementation benefits from a durable operating harness:
+
+```txt
+trace/index.md
+trace/current-cell.md
+trace/<cell>.md
+prompt templates
+review and red-team gates
+live proof capture
+```
+
+This harness is documented in
+[coordination-operating-harness.md](../playbooks/coordination-operating-harness.md). It is
+supporting engineering practice, not Step 07 runtime infrastructure and not a
+lifecycle system. Its job is to keep coordinator, doer, reviewer, and red-team
+sessions aligned while preserving token budget and proof traceability.
+
+The harness should be used where it reduces implementation drift, but dogfooding
+it is not a runtime dependency gate for standalone coordination.
+
+## 12. Standalone Read-Only Coordination
+
+The current mission-lite implementation is a prototype for standalone read-only
+coordination. Its generalization is still under discussion in
+[Step 08](step-08-standalone-coordination-protocols.md) and depends on the relevant
+CoordinationSession/AdhocTask contracts from
+[Step 07](step-07-coordination-session-adhoc-task.md).
+
+A standalone session may group assignments without a Work item for read-only
+coordination:
+
+```txt
+mission-lite objective
+  -> researcher background brief
+  -> reviewer counter-argument
+  -> advisor product framing
+  -> driver synthesis
+```
+
+Mission-lite currently borrows coding Stage Operations. That is prototype
+behavior, not a foundation requirement. The target standalone path may instead
+construct validated dynamic Assignments and may optionally select a reusable
+protocol.
+
+Rules:
+
+- no Work lifecycle;
+- no repo mutation;
+- no approval/merge semantics;
+- every role result is a structured artifact;
+- synthesis is a report, not a state transition;
+- any resulting implementation proposal becomes ordinary Work before code is
+  changed.
+
+Good first case:
+
+```txt
+Question: Should coding-domain planning validation run as a reviewer Assignment
+or stay as direct same-session validation?
+```
+
+This is useful because it tests team reasoning without risking Work lifecycle
+truth.
+
+## 13. Acceptance Criteria For V1 Protocol
+
+The protocol is ready for driver adoption when:
+
+- every runtime assignment receives an explicit result artifact path;
+- malformed or missing structured claims cannot produce `verified` or
+  `reported`;
+- dirty-before files cannot be counted as post-run evidence;
+- read-only operations can return `reported` only through worker artifacts;
+- mutating operations require post-run external evidence;
+- stage skills agree on when Assignment is used versus direct invocation;
+- `validate-plan` role prose is consistent across skill and task-spec docs;
+- discovery remains machine-alone.
+~~~~
\ No newline at end of file
````

## claim_a9382eb0ecc328ef7350f203cc059ed0

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-20

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-20

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_a9382eb0ecc328ef7350f203cc059ed0 |
| sourceUnitDigest | d166987d5a39d4670bddb33f721e6ac4075dc8df339d1af80110991e117c1171 |
| claimKind | contract |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-20 is retained in docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-20. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-20 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | d166987d5a39d4670bddb33f721e6ac4075dc8df339d1af80110991e117c1171 |
| targetAncestry | \["Team Communication Protocol V1","5. Workflow Step Operation Selection"\] |

### Source unit

```text
Selection rules:

1. Prefer the primary operation when the stage's normal owner work remains the
   next required action.
2. Choose a secondary operation when a bounded role contribution would unblock
   the stage without creating lifecycle-bearing child work.
3. Create child Work only when the contribution needs its own claim, branch,
   verify, approval, merge, or backlog visibility.
4. Route discovery unresolved ambiguity to `exploring`; discovery must not ask
   the human directly.
5. Refuse operations marked `dispatch: human-only` from cli-spawn assignment
   execution.
6. Refuse synthetic compatibility operations from runtime dispatch unless their
   task-spec file resolves and the caller explicitly accepts compatibility
   dispatch.
```

### Target unit

```text
Selection rules:

1. Prefer the primary operation when the stage's normal owner work remains the
   next required action.
2. Choose a secondary operation when a bounded role contribution would unblock
   the stage without creating lifecycle-bearing child work.
3. Create child Work only when the contribution needs its own claim, branch,
   verify, approval, merge, or backlog visibility.
4. Route discovery unresolved ambiguity to `exploring`; discovery must not ask
   the human directly.
5. Refuse operations marked `dispatch: human-only` from cli-spawn assignment
   execution.
6. Refuse synthetic compatibility operations from runtime dispatch unless their
   task-spec file resolves and the caller explicitly accepts compatibility
   dispatch.
```

### Unified diff

```diff
No text difference.
```

## claim_43e1cfb21a914c8f9bd52e664d9d863c

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-21

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-21

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_43e1cfb21a914c8f9bd52e664d9d863c |
| sourceUnitDigest | 54e3c6b0da41a07fc63905fc1209d8cf16128cc18ef5aaf3699df8e46315c1cf |
| claimKind | contract |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-21 is retained in docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-21. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-21 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | 54e3c6b0da41a07fc63905fc1209d8cf16128cc18ef5aaf3699df8e46315c1cf |
| targetAncestry | \["Team Communication Protocol V1","5. Workflow Step Operation Selection"\] |

### Source unit

```text
Examples:

| Stage | Situation | Operation |
|---|---|---|
| `discovery` | Need machine evidence for ambiguity. | `resolve-question` to `researcher`, then owner decides `clear` or `unclear`. |
| `planning` | Plan is written and needs proof before the edge to executing. | `validate-plan` to `reviewer`. |
| `planning` | A symbol's blast radius is unknown. | `scout-blast-radius` to `researcher`. |
| `executing` | Implementation needs a separate non-overlapping edit. | `scoped-subtask` to `helper`. |
| `executing` | Returned diff needs independent review. | `review-item` to `reviewer`. |
| `executing` | Review or verify reports a concrete red issue. | `fix-verify-red` to `implementer`. |
```

### Target unit

```text
Examples:

| Stage | Situation | Operation |
|---|---|---|
| `discovery` | Need machine evidence for ambiguity. | `resolve-question` to `researcher`, then owner decides `clear` or `unclear`. |
| `planning` | Plan is written and needs proof before the edge to executing. | `validate-plan` to `reviewer`. |
| `planning` | A symbol's blast radius is unknown. | `scout-blast-radius` to `researcher`. |
| `executing` | Implementation needs a separate non-overlapping edit. | `scoped-subtask` to `helper`. |
| `executing` | Returned diff needs independent review. | `review-item` to `reviewer`. |
| `executing` | Review or verify reports a concrete red issue. | `fix-verify-red` to `implementer`. |
```

### Unified diff

```diff
No text difference.
```

## claim_ed173813c08271fa5b0761010681c9e7

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-22

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-22

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_ed173813c08271fa5b0761010681c9e7 |
| sourceUnitDigest | 9a4b3396b392473d4d2f8f441d276f09f958e1526f7cd7e4c32302f9e1940944 |
| claimKind | contract |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-22 is retained in docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-22. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-22 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | 9a4b3396b392473d4d2f8f441d276f09f958e1526f7cd7e4c32302f9e1940944 |
| targetAncestry | \["Team Communication Protocol V1","6. Assignment Message Contract"\] |

### Source unit

```text
Every assignment prompt must provide the worker with enough information to
produce a usable result without learning fgOS internals.
```

### Target unit

```text
Every assignment prompt must provide the worker with enough information to
produce a usable result without learning fgOS internals.
```

### Unified diff

```diff
No text difference.
```

## claim_e3d4d7b0fa329e89ef258b2b93e0f213

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-24

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-24

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_e3d4d7b0fa329e89ef258b2b93e0f213 |
| sourceUnitDigest | 20e1ef602b061c806eb838f203169426d8fbd7222a39e702e08e1db5c490c50f |
| claimKind | contract |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-24 is retained in docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-24. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-24 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | 20e1ef602b061c806eb838f203169426d8fbd7222a39e702e08e1db5c490c50f |
| targetAncestry | \["Team Communication Protocol V1","6. Assignment Message Contract"\] |

### Source unit

````text
```txt
Assignment: <assignmentId>
Work: <workId or (none)>
Stage operation: <stage>.<operation>
Role: <role>
Task-spec: <task-spec path>
Objective: <bounded request>
Context refs:
- <ref>
Expected outputs:
- <output>
Result artifact:
- Write JSON to <runDir>/agent-result.json
- Optionally write Markdown to <runDir>/agent-report.md
```
````

### Target unit

````text
```txt
Assignment: <assignmentId>
Work: <workId or (none)>
Stage operation: <stage>.<operation>
Role: <role>
Task-spec: <task-spec path>
Objective: <bounded request>
Context refs:
- <ref>
Expected outputs:
- <output>
Result artifact:
- Write JSON to <runDir>/agent-result.json
- Optionally write Markdown to <runDir>/agent-report.md
```
````

### Unified diff

```diff
No text difference.
```

## claim_d4b00bdaada87eee70476a8e04d4fe6c

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-25

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-25

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_d4b00bdaada87eee70476a8e04d4fe6c |
| sourceUnitDigest | 1f9d524b7a2541304399735991ec6e577535fa02e2cdc971d38b5d0d1914f6e8 |
| claimKind | contract |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-25 is retained in docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-25. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-25 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | 1f9d524b7a2541304399735991ec6e577535fa02e2cdc971d38b5d0d1914f6e8 |
| targetAncestry | \["Team Communication Protocol V1","6. Assignment Message Contract"\] |

### Source unit

```text
The prompt must say that the worker should not call Work lifecycle verbs unless
the task-spec explicitly says the worker is the lifecycle driver. Ordinary
Assignment workers return artifacts; the driver interprets them.
```

### Target unit

```text
The prompt must say that the worker should not call Work lifecycle verbs unless
the task-spec explicitly says the worker is the lifecycle driver. Ordinary
Assignment workers return artifacts; the driver interprets them.
```

### Unified diff

```diff
No text difference.
```

## claim_61ff03aa16e5480629085f704c0fda0b

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-26

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-26

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_61ff03aa16e5480629085f704c0fda0b |
| sourceUnitDigest | 88f914ec8e17738c3bdab6ec6994a7522af915b05f74f6cc0af5e958dc93e811 |
| claimKind | contract |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-26 is retained in docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-26. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-26 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | 88f914ec8e17738c3bdab6ec6994a7522af915b05f74f6cc0af5e958dc93e811 |
| targetAncestry | \["Team Communication Protocol V1","6. Assignment Message Contract"\] |

### Source unit

```text
The prompt must pass refs, not embedded large docs, diffs, transcripts, or
secrets.
```

### Target unit

```text
The prompt must pass refs, not embedded large docs, diffs, transcripts, or
secrets.
```

### Unified diff

```diff
No text difference.
```

## claim_596d0430e922fe72e09512abc97beb7f

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-27

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-27

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_596d0430e922fe72e09512abc97beb7f |
| sourceUnitDigest | c70a2a68807ae2df6b8fcdffc9a19f4f19fdfd62c3aa25f309b80161f9553f2e |
| claimKind | contract |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-27 is retained in docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-27. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-27 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | c70a2a68807ae2df6b8fcdffc9a19f4f19fdfd62c3aa25f309b80161f9553f2e |
| targetAncestry | \["Team Communication Protocol V1","7. Agent Result Schema"\] |

### Source unit

```text
`agent-result.json` is the worker's structured claim. It is not proof by
itself.
```

### Target unit

```text
`agent-result.json` is the worker's structured claim. It is not proof by
itself.
```

### Unified diff

```diff
No text difference.
```

## claim_1838df5e7c81c1fa79b336008e3b94bd

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-28

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-28

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_1838df5e7c81c1fa79b336008e3b94bd |
| sourceUnitDigest | ce53d4284a859f9d95baf033102595aead78608a6a58c872b777da4dcd35e6a2 |
| claimKind | contract |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-28 is retained in docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-28. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-28 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | ce53d4284a859f9d95baf033102595aead78608a6a58c872b777da4dcd35e6a2 |
| targetAncestry | \["Team Communication Protocol V1","7. Agent Result Schema"\] |

### Source unit

````text
Minimal schema:

```json
{
  "status": "done",
  "summary": "One concise result sentence.",
  "findings": [],
  "evidenceRefs": [],
  "nextRecommendedOperation": null
}
```
````

### Target unit

````text
Minimal schema:

```json
{
  "status": "done",
  "summary": "One concise result sentence.",
  "findings": [],
  "evidenceRefs": [],
  "nextRecommendedOperation": null
}
```
````

### Unified diff

```diff
No text difference.
```

## claim_d645da105a558068961c06e1d47aa9ee

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-30

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-30

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_d645da105a558068961c06e1d47aa9ee |
| sourceUnitDigest | 5c43b0ba58e8b4ea86373ea1aae4b7c01a96ac7a88d4738a8e84814ca4b1b93d |
| claimKind | contract |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-30 is retained in docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-30. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-30 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | 5c43b0ba58e8b4ea86373ea1aae4b7c01a96ac7a88d4738a8e84814ca4b1b93d |
| targetAncestry | \["Team Communication Protocol V1","7. Agent Result Schema"\] |

### Source unit

```text
| Status | Meaning |
|---|---|
| `done` | The worker believes the assignment objective is complete. |
| `blocked` | The worker could not complete because a named blocker remains. |
| `failed` | The worker attempted the assignment and produced an error or invalid output. |
| `no-evidence` | The worker can report context but cannot support a completion claim. |
```

### Target unit

```text
| Status | Meaning |
|---|---|
| `done` | The worker believes the assignment objective is complete. |
| `blocked` | The worker could not complete because a named blocker remains. |
| `failed` | The worker attempted the assignment and produced an error or invalid output. |
| `no-evidence` | The worker can report context but cannot support a completion claim. |
```

### Unified diff

```diff
No text difference.
```

## claim_37887f05ca0822cd7c415eaadda42c55

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-32

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-32

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_37887f05ca0822cd7c415eaadda42c55 |
| sourceUnitDigest | fd36ed4ee645f1e8a36bd3a20ac076a9c70d7bc1c89c2b3488edcb551816a21b |
| claimKind | contract |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-32 is retained in docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-32. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-32 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | fd36ed4ee645f1e8a36bd3a20ac076a9c70d7bc1c89c2b3488edcb551816a21b |
| targetAncestry | \["Team Communication Protocol V1","7. Agent Result Schema"\] |

### Source unit

```text
| Status | Required fields |
|---|---|
| `done` | `summary`; at least one `evidenceRefs` entry or a companion `agent-report.md` for read-only work; external git/artifact evidence for mutating work. |
| `blocked` | `summary`; `blocker`; `evidenceRefs` when any evidence exists. |
| `failed` | `summary`; `error`. |
| `no-evidence` | `summary`; reason why evidence is absent. |
```

### Target unit

```text
| Status | Required fields |
|---|---|
| `done` | `summary`; at least one `evidenceRefs` entry or a companion `agent-report.md` for read-only work; external git/artifact evidence for mutating work. |
| `blocked` | `summary`; `blocker`; `evidenceRefs` when any evidence exists. |
| `failed` | `summary`; `error`. |
| `no-evidence` | `summary`; reason why evidence is absent. |
```

### Unified diff

```diff
No text difference.
```

## claim_3d5dc31cf6cf90ba661de6bb1fafb486

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-33

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-33

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_3d5dc31cf6cf90ba661de6bb1fafb486 |
| sourceUnitDigest | 546c59ef10ff886d2fd256b488c6193c117c59d5e82632dbb8c14b30cd072efc |
| claimKind | contract |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-33 is retained in docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-33. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-33 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | 546c59ef10ff886d2fd256b488c6193c117c59d5e82632dbb8c14b30cd072efc |
| targetAncestry | \["Team Communication Protocol V1","7. Agent Result Schema"\] |

### Source unit

```text
Optional `nextRecommendedOperation` may name another legal stage operation, but
it is only a recommendation. The driver must verify legality before acting.
```

### Target unit

```text
Optional `nextRecommendedOperation` may name another legal stage operation, but
it is only a recommendation. The driver must verify legality before acting.
```

### Unified diff

```diff
No text difference.
```

## claim_50cc0ff73dabd1642950365f358125c2

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-34

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-34

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_50cc0ff73dabd1642950365f358125c2 |
| sourceUnitDigest | f9a43ac823ac553c41f0f8734a247e9e88404201676f68476f9b003961fd475f |
| claimKind | contract |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-34 is retained in docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-34. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-34 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | f9a43ac823ac553c41f0f8734a247e9e88404201676f68476f9b003961fd475f |
| targetAncestry | \["Team Communication Protocol V1","8. RunResult Confidence"\] |

### Source unit

```text
RunResult status and confidence are control-plane judgments.
```

### Target unit

```text
RunResult status and confidence are control-plane judgments.
```

### Unified diff

```diff
No text difference.
```

## claim_1c155ab462849e3ec4136ee9fa08a218

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-35

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-35

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_1c155ab462849e3ec4136ee9fa08a218 |
| sourceUnitDigest | 09432ca4e37e6469053ef9ae2f7931a444dd0b05c9d58a2fe25d34daede483f6 |
| claimKind | contract |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-35 is retained in docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-35. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-35 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | 09432ca4e37e6469053ef9ae2f7931a444dd0b05c9d58a2fe25d34daede483f6 |
| targetAncestry | \["Team Communication Protocol V1","8. RunResult Confidence"\] |

### Source unit

```text
Confidence ladder:

| Confidence | Meaning | Allowed use |
|---|---|---|
| `verified` | Structured claim plus post-run external evidence such as a new commit, new changed file, test artifact, or verified result file. | May feed lifecycle decisions that require proof. |
| `reported` | Structured claim plus a worker-produced report for read-only consult/review work. | May feed driver judgment, but should not close mutating work. |
| `inferred` | Post-run external evidence exists but no structured claim exists. | May be surfaced for inspection; driver should avoid automatic lifecycle movement. |
| `no-evidence` | Process settled without proof. | Must not advance Work. |
| `failed` | Timeout, nonzero exit, signal, invalid schema, or explicit failure. | Must not advance Work. |
```

### Target unit

```text
Confidence ladder:

| Confidence | Meaning | Allowed use |
|---|---|---|
| `verified` | Structured claim plus post-run external evidence such as a new commit, new changed file, test artifact, or verified result file. | May feed lifecycle decisions that require proof. |
| `reported` | Structured claim plus a worker-produced report for read-only consult/review work. | May feed driver judgment, but should not close mutating work. |
| `inferred` | Post-run external evidence exists but no structured claim exists. | May be surfaced for inspection; driver should avoid automatic lifecycle movement. |
| `no-evidence` | Process settled without proof. | Must not advance Work. |
| `failed` | Timeout, nonzero exit, signal, invalid schema, or explicit failure. | Must not advance Work. |
```

### Unified diff

```diff
No text difference.
```

## claim_34284834ad2dd8f5a0fc5a924b8196a5

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-36

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-36

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_34284834ad2dd8f5a0fc5a924b8196a5 |
| sourceUnitDigest | 9b769b73c2920816c9da55624eb71f9c6704bb633a32db6a0ba27d71aaef2e6a |
| claimKind | contract |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-36 is retained in docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-36. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-36 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | 9b769b73c2920816c9da55624eb71f9c6704bb633a32db6a0ba27d71aaef2e6a |
| targetAncestry | \["Team Communication Protocol V1","8. RunResult Confidence"\] |

### Source unit

```text
The driver must treat `done/no-evidence` as not done. It may retry, ask for a
proper artifact, or route to a different legal operation.
```

### Target unit

```text
The driver must treat `done/no-evidence` as not done. It may retry, ask for a
proper artifact, or route to a different legal operation.
```

### Unified diff

```diff
No text difference.
```

## claim_b602d530010f3b2f66ef5485bbff5bcb

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-37

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-37

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_b602d530010f3b2f66ef5485bbff5bcb |
| sourceUnitDigest | 45448dcaa1ce69055f61288526e27178ab68b9657ad3c6ea0471592547570269 |
| claimKind | contract |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-37 is retained in docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-37. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-37 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | 45448dcaa1ce69055f61288526e27178ab68b9657ad3c6ea0471592547570269 |
| targetAncestry | \["Team Communication Protocol V1","9. Handoff Versus Assignment"\] |

### Source unit

```text
Use `handoff` when the interaction is a short role-axis record around work the
current session already performed or directly observed.
```

### Target unit

```text
Use `handoff` when the interaction is a short role-axis record around work the
current session already performed or directly observed.
```

### Unified diff

```diff
No text difference.
```

## claim_c37da632abaadd051eff58492f71c8c7

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-38

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-38

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_c37da632abaadd051eff58492f71c8c7 |
| sourceUnitDigest | 5e110b497e1da92942a6973ad6b43884d4085ad25ae9ee9a6d23c44d8c63b6bd |
| claimKind | contract |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-38 is retained in docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-38. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-38 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | 5e110b497e1da92942a6973ad6b43884d4085ad25ae9ee9a6d23c44d8c63b6bd |
| targetAncestry | \["Team Communication Protocol V1","9. Handoff Versus Assignment"\] |

### Source unit

```text
Use Assignment when:

- another executor, provider, role, or tool performs the action;
- the result will be read by a later driver turn;
- the result needs Run/RunResult evidence;
- the interaction may fail independently;
- a read-only consult/review needs an artifact rather than a one-line summary.
```

### Target unit

```text
Use Assignment when:

- another executor, provider, role, or tool performs the action;
- the result will be read by a later driver turn;
- the result needs Run/RunResult evidence;
- the interaction may fail independently;
- a read-only consult/review needs an artifact rather than a one-line summary.
```

### Unified diff

```diff
No text difference.
```

## claim_c52e0d7342545a9365e507c17a99e946

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-39

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-39

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_c52e0d7342545a9365e507c17a99e946 |
| sourceUnitDigest | d804ea47af68c0aa6bcdc1058abb3dd934cfe47cfbc766e23bbed4772b98ad1f |
| claimKind | decision |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-39 is retained in docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-39. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-39 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | d804ea47af68c0aa6bcdc1058abb3dd934cfe47cfbc766e23bbed4772b98ad1f |
| targetAncestry | \["Team Communication Protocol V1","9. Handoff Versus Assignment"\] |

### Source unit

```text
`handoff` remains useful for visibility and role-holder truth. It is not enough
evidence for a Team Dispatch operation once the result influences a lifecycle
decision.
```

### Target unit

```text
`handoff` remains useful for visibility and role-holder truth. It is not enough
evidence for a Team Dispatch operation once the result influences a lifecycle
decision.
```

### Unified diff

```diff
No text difference.
```

## claim_57f26b5acbd6bb500ca353f84f486488

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-41

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-41

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_57f26b5acbd6bb500ca353f84f486488 |
| sourceUnitDigest | 538e8cefb7885ba1fd52c8a4b9dc39cdd9b13edc851f8b83dd1b48a0670fd4c8 |
| claimKind | contract |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-41 is retained in docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-41. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-41 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | 538e8cefb7885ba1fd52c8a4b9dc39cdd9b13edc851f8b83dd1b48a0670fd4c8 |
| targetAncestry | \["Team Communication Protocol V1","10. Coding-Domain Stage Protocols","10.1 Discovery"\] |

### Source unit

```text
Allowed behavior:

- owner reads existing Work context;
- owner consults researcher helpers for evidence;
- owner logs consult interactions;
- owner chooses `clear` or `unclear`;
- `clear` can route to planning;
- `unclear` routes to exploring.
```

### Target unit

```text
Allowed behavior:

- owner reads existing Work context;
- owner consults researcher helpers for evidence;
- owner logs consult interactions;
- owner chooses `clear` or `unclear`;
- `clear` can route to planning;
- `unclear` routes to exploring.
```

### Unified diff

```diff
No text difference.
```

## claim_78524c36c6f57c543377be47620d748c

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-42

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-42

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_78524c36c6f57c543377be47620d748c |
| sourceUnitDigest | b343cb615e796f69b45669066da04a200bb366f9071bba646a4b1a546a9ce565 |
| claimKind | contract |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-42 is retained in docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-42. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-42 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | b343cb615e796f69b45669066da04a200bb366f9071bba646a4b1a546a9ce565 |
| targetAncestry | \["Team Communication Protocol V1","10. Coding-Domain Stage Protocols","10.1 Discovery"\] |

### Source unit

```text
Forbidden behavior:

- asking the human directly;
- parking as `awaiting-human`;
- treating a helper's unsupported answer as proof;
- opening a new Work item just to answer a bounded evidence question.
```

### Target unit

```text
Forbidden behavior:

- asking the human directly;
- parking as `awaiting-human`;
- treating a helper's unsupported answer as proof;
- opening a new Work item just to answer a bounded evidence question.
```

### Unified diff

```diff
No text difference.
```

## claim_242208b542d4bb24c84796f43f775d4a

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-43

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-43

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_242208b542d4bb24c84796f43f775d4a |
| sourceUnitDigest | 8be1c52fac778e783278a3fa17f78a4cf05b675f7111d46bc5930dd19a2bce63 |
| claimKind | decision |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-43 is retained in docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-43. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-43 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | 8be1c52fac778e783278a3fa17f78a4cf05b675f7111d46bc5930dd19a2bce63 |
| targetAncestry | \["Team Communication Protocol V1","10. Coding-Domain Stage Protocols","10.2 Exploring"\] |

### Source unit

```text
Exploring is the human-adjacent decision-locking stage.
```

### Target unit

```text
Exploring is the human-adjacent decision-locking stage.
```

### Unified diff

```diff
No text difference.
```

## claim_88cf23510b37d2048b1a578efc2ebb10

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-44

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-44

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_88cf23510b37d2048b1a578efc2ebb10 |
| sourceUnitDigest | 6c2c64a1d48e2d1dca430f0811e612771eda3379e19731d984b3c5ea8b042013 |
| claimKind | contract |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-44 is retained in docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-44. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-44 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | 6c2c64a1d48e2d1dca430f0811e612771eda3379e19731d984b3c5ea8b042013 |
| targetAncestry | \["Team Communication Protocol V1","10. Coding-Domain Stage Protocols","10.2 Exploring"\] |

### Source unit

```text
Allowed behavior:

- advisor interaction for material, grounded, answerable product questions;
- researcher consult for repo or external facts;
- lock decisions into CONTEXT.md.
```

### Target unit

```text
Allowed behavior:

- advisor interaction for material, grounded, answerable product questions;
- researcher consult for repo or external facts;
- lock decisions into CONTEXT.md.
```

### Unified diff

```diff
No text difference.
```

## claim_abb60eb206ce120877cc9c06f826ab57

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-45

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-45

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_abb60eb206ce120877cc9c06f826ab57 |
| sourceUnitDigest | 6e5cc24269ba7cf4ebfdf5bb8062990d284cd999b1d8462e36c55d28713910f2 |
| claimKind | contract |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-45 is retained in docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-45. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-45 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | 6e5cc24269ba7cf4ebfdf5bb8062990d284cd999b1d8462e36c55d28713910f2 |
| targetAncestry | \["Team Communication Protocol V1","10. Coding-Domain Stage Protocols","10.2 Exploring"\] |

### Source unit

```text
Exploring may ask a human. It should ask only after machine evidence has been
gathered and the question is self-contained.
```

### Target unit

```text
Exploring may ask a human. It should ask only after machine evidence has been
gathered and the question is self-contained.
```

### Unified diff

```diff
No text difference.
```

## claim_a6f71d465ebccd696428b94ff6f664af

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-46

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-46

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_a6f71d465ebccd696428b94ff6f664af |
| sourceUnitDigest | 14807360bce011d160261d7194fbcc2cf445f6a0722f072d50101af54d78d3b9 |
| claimKind | contract |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-46 is retained in docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-46. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-46 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | 14807360bce011d160261d7194fbcc2cf445f6a0722f072d50101af54d78d3b9 |
| targetAncestry | \["Team Communication Protocol V1","10. Coding-Domain Stage Protocols","10.3 Planning"\] |

### Source unit

```text
Planning has two main operation families:
```

### Target unit

```text
Planning has two main operation families:
```

### Unified diff

```diff
No text difference.
```

## claim_6b4789439adfb6eb3b05c85b7ed8f7e0

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-47

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-47

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_6b4789439adfb6eb3b05c85b7ed8f7e0 |
| sourceUnitDigest | f40aa8cbca5552bcf674388b44a555d1c431f1abab5c218961744a0c77968db0 |
| claimKind | contract |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-47 is retained in docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-47. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-47 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | f40aa8cbca5552bcf674388b44a555d1c431f1abab5c218961744a0c77968db0 |
| targetAncestry | \["Team Communication Protocol V1","10. Coding-Domain Stage Protocols","10.3 Planning"\] |

### Source unit

```text
- `shape-plan` by implementer;
- `validate-plan` by reviewer.
```

### Target unit

```text
- `shape-plan` by implementer;
- `validate-plan` by reviewer.
```

### Unified diff

```diff
No text difference.
```

## claim_491f40d6df7f19683306f82f98695e8e

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-48

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-48

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_491f40d6df7f19683306f82f98695e8e |
| sourceUnitDigest | 65d8bf9a4c4dda65972648dcc3f44641abb8680b909df0e588967a43d489b362 |
| claimKind | contract |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-48 is retained in docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-48. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-48 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | 65d8bf9a4c4dda65972648dcc3f44641abb8680b909df0e588967a43d489b362 |
| targetAncestry | \["Team Communication Protocol V1","10. Coding-Domain Stage Protocols","10.3 Planning"\] |

### Source unit

```text
The stage owner may write the plan directly, but validation should move toward
a reviewer Assignment once Step 05 adopts operation choice.
```

### Target unit

```text
The stage owner may write the plan directly, but validation should move toward
a reviewer Assignment once Step 05 adopts operation choice.
```

### Unified diff

```diff
No text difference.
```

## claim_8b79ab2d01c7ce85912eb9f0a25bf3ea

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-49

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-49

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_8b79ab2d01c7ce85912eb9f0a25bf3ea |
| sourceUnitDigest | 999fd62d2ac5bba2d830abbc5aa0e3057ed2a35f727a9ef390bdffe41c60714e |
| claimKind | contract |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-49 is retained in docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-49. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-49 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | 999fd62d2ac5bba2d830abbc5aa0e3057ed2a35f727a9ef390bdffe41c60714e |
| targetAncestry | \["Team Communication Protocol V1","10. Coding-Domain Stage Protocols","10.3 Planning"\] |

### Source unit

```text
`validate-plan` is a real reviewer-role operation when dispatched through
Assignment. Prose that says validating is only an implementer function must be
reconciled before driver adoption.
```

### Target unit

```text
`validate-plan` is a real reviewer-role operation when dispatched through
Assignment. Prose that says validating is only an implementer function must be
reconciled before driver adoption.
```

### Unified diff

```diff
No text difference.
```

## claim_e16b56644d520a0fe0a4cd6b40c2459a

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-50

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-50

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_e16b56644d520a0fe0a4cd6b40c2459a |
| sourceUnitDigest | 62f1292eb44e2dd4af3c1ccde7a1a7247ae0febf11739444e8b377e233d40a1b |
| claimKind | contract |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-50 is retained in docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-50. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-50 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | 62f1292eb44e2dd4af3c1ccde7a1a7247ae0febf11739444e8b377e233d40a1b |
| targetAncestry | \["Team Communication Protocol V1","10. Coding-Domain Stage Protocols","10.4 Executing"\] |

### Source unit

```text
Executing has the richest team protocol:
```

### Target unit

```text
Executing has the richest team protocol:
```

### Unified diff

```diff
No text difference.
```

## claim_a86887b78fbc23319db13f3bf4816dd8

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-51

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-51

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_a86887b78fbc23319db13f3bf4816dd8 |
| sourceUnitDigest | 3db147178920207776ed26ad024fdfc3cb509d1839901116d0693f322f8f6bca |
| claimKind | contract |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-51 is retained in docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-51. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-51 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | 3db147178920207776ed26ad024fdfc3cb509d1839901116d0693f322f8f6bca |
| targetAncestry | \["Team Communication Protocol V1","10. Coding-Domain Stage Protocols","10.4 Executing"\] |

### Source unit

```text
- implementer owns the main edit path;
- researcher may answer blast-radius or API/pattern questions;
- helper may take independent scoped work;
- reviewer may review returned diffs or candidate fixes;
- advisor handles product/scope questions that exceed locked decisions.
```

### Target unit

```text
- implementer owns the main edit path;
- researcher may answer blast-radius or API/pattern questions;
- helper may take independent scoped work;
- reviewer may review returned diffs or candidate fixes;
- advisor handles product/scope questions that exceed locked decisions.
```

### Unified diff

```diff
No text difference.
```

## claim_fad0d749adc5ef611ee344c16b7c661e

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-52

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-52

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_fad0d749adc5ef611ee344c16b7c661e |
| sourceUnitDigest | 3c902b0dddbee64c10302bbe2fa05b431d4ee1236b7c925bf4ba6d10a1859962 |
| claimKind | contract |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-52 is retained in docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-52. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-52 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | 3c902b0dddbee64c10302bbe2fa05b431d4ee1236b7c925bf4ba6d10a1859962 |
| targetAncestry | \["Team Communication Protocol V1","10. Coding-Domain Stage Protocols","10.4 Executing"\] |

### Source unit

```text
The implementer remains responsible for Work lifecycle. Helper/reviewer
assignments return artifacts and recommendations unless explicitly promoted to
child Work.
```

### Target unit

```text
The implementer remains responsible for Work lifecycle. Helper/reviewer
assignments return artifacts and recommendations unless explicitly promoted to
child Work.
```

### Unified diff

```diff
No text difference.
```

## claim_f4f513bfd7ca5fd9708005243a624f95

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-53

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-53

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_f4f513bfd7ca5fd9708005243a624f95 |
| sourceUnitDigest | 99fd2729268c130f3b988b8833fb4ec10dedeb48094339156e687cba619bebb3 |
| claimKind | contract |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-53 is retained in docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-53. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-53 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | 99fd2729268c130f3b988b8833fb4ec10dedeb48094339156e687cba619bebb3 |
| targetAncestry | \["Team Communication Protocol V1","11. Coordination Operating Harness"\] |

### Source unit

```text
Multi-agent implementation benefits from a durable operating harness:
```

### Target unit

```text
Multi-agent implementation benefits from a durable operating harness:
```

### Unified diff

```diff
No text difference.
```

## claim_b165c6ca3702ce5335599867e447ae55

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-54

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-54

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_b165c6ca3702ce5335599867e447ae55 |
| sourceUnitDigest | 3136bedc9eac77f08874328886bc22baa033ea44009227abad3fe36e05878c8f |
| claimKind | contract |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-54 is retained in docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-54. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-54 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | 3136bedc9eac77f08874328886bc22baa033ea44009227abad3fe36e05878c8f |
| targetAncestry | \["Team Communication Protocol V1","11. Coordination Operating Harness"\] |

### Source unit

````text
```txt
trace/index.md
trace/current-cell.md
trace/<cell>.md
prompt templates
review and red-team gates
live proof capture
```
````

### Target unit

````text
```txt
trace/index.md
trace/current-cell.md
trace/<cell>.md
prompt templates
review and red-team gates
live proof capture
```
````

### Unified diff

```diff
No text difference.
```

## claim_8b6511ceef7788eaaecfbe1c17de0ccf

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-55

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-55

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_8b6511ceef7788eaaecfbe1c17de0ccf |
| sourceUnitDigest | 68cb00b63900ec23e263a0a39ed605cf5e1f2a3a841467c8632d7f06e99f4264 |
| claimKind | contract |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-55 is retained in docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-55. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-55 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | 68cb00b63900ec23e263a0a39ed605cf5e1f2a3a841467c8632d7f06e99f4264 |
| targetAncestry | \["Team Communication Protocol V1","11. Coordination Operating Harness"\] |

### Source unit

```text
This harness is documented in
[coordination-operating-harness.md](../playbooks/coordination-operating-harness.md). It is
supporting engineering practice, not Step 07 runtime infrastructure and not a
lifecycle system. Its job is to keep coordinator, doer, reviewer, and red-team
sessions aligned while preserving token budget and proof traceability.
```

### Target unit

```text
This harness is documented in
[coordination-operating-harness.md](../playbooks/coordination-operating-harness.md). It is
supporting engineering practice, not Step 07 runtime infrastructure and not a
lifecycle system. Its job is to keep coordinator, doer, reviewer, and red-team
sessions aligned while preserving token budget and proof traceability.
```

### Unified diff

```diff
No text difference.
```

## claim_6e6d4e1d3c3621bc16f442c43894284f

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-56

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-56

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_6e6d4e1d3c3621bc16f442c43894284f |
| sourceUnitDigest | b8fff28ad65a1ca9989c3692ee032020c172e1f2e2f5f538da0f73b13482312e |
| claimKind | contract |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-56 is retained in docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-56. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-56 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | b8fff28ad65a1ca9989c3692ee032020c172e1f2e2f5f538da0f73b13482312e |
| targetAncestry | \["Team Communication Protocol V1","11. Coordination Operating Harness"\] |

### Source unit

```text
The harness should be used where it reduces implementation drift, but dogfooding
it is not a runtime dependency gate for standalone coordination.
```

### Target unit

```text
The harness should be used where it reduces implementation drift, but dogfooding
it is not a runtime dependency gate for standalone coordination.
```

### Unified diff

```diff
No text difference.
```

## claim_34510cf59404d2487bd8e2b0859cd859

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#12-standalone-read-only-coordination

Target: docs/platform/agent-coordination/history/retired-engine/files/proposals/team-communication-protocol-v1.md#literal-snapshot

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_34510cf59404d2487bd8e2b0859cd859 |
| sourceUnitDigest | ed4c8c67017d8d911e6bc39d546e00f979ba37645c6c2ec801fd139a7b914ed0 |
| claimKind | contract |
| disposition | move |
| rationale | This exact dated source unit docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#12-standalone-read-only-coordination is retained verbatim in its own complete historical snapshot; its original metadata, obsolete interface or dated context is not silently asserted by the corrected current docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md. This is a unit-specific version/provenance retention, not retirement of the whole surviving subject. Current live/design sections and their changed text receive a separate independent check. The engine-only retirement reference is 2180b4e72; no previous approval carries. |
| targetOwner | docs/platform/agent-coordination/history/retired-engine/files/proposals/team-communication-protocol-v1.md |
| targetAnchor | literal-snapshot |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | c3a4d458bb1581e2f7b65a4b653037ba1866eb3ac0ee69dd189c0de195a97578 |
| targetAncestry | \["Historical File: Team Communication Protocol V1"\] |

### Source unit

````text
## 12. Standalone Read-Only Coordination

The current mission-lite implementation is a prototype for standalone read-only
coordination. Its generalization is still under discussion in
[Step 08](step-08-standalone-coordination-protocols.md) and depends on the relevant
CoordinationSession/AdhocTask contracts from
[Step 07](step-07-coordination-session-adhoc-task.md).

A standalone session may group assignments without a Work item for read-only
coordination:

```txt
mission-lite objective
  -> researcher background brief
  -> reviewer counter-argument
  -> advisor product framing
  -> driver synthesis
```

Mission-lite currently borrows coding Stage Operations. That is prototype
behavior, not a foundation requirement. The target standalone path may instead
construct validated dynamic Assignments and may optionally select a reusable
protocol.

Rules:

- no Work lifecycle;
- no repo mutation;
- no approval/merge semantics;
- every role result is a structured artifact;
- synthesis is a report, not a state transition;
- any resulting implementation proposal becomes ordinary Work before code is
  changed.

Good first case:

```txt
Question: Should coding-domain planning validation run as a reviewer Assignment
or stay as direct same-session validation?
```

This is useful because it tests team reasoning without risking Work lifecycle
truth.
````

### Target unit

````text
## Literal Snapshot

~~~~text
# Team Communication Protocol V1

```txt
Document type: Proposal
Audience: Human reviewers, maintainers, documentation agents
Purpose: Preserve source material for Team Communication Protocol V1
Design status: Candidate
Implementation: Not re-verified; source implementation statements remain in the body
Provenance: Retained from docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md at fcfe78cb89585bc9ab23f11bab67d41458834fc4
Writer type: Documentation maintainer
Canonical for: Preserved proposal material for Team Communication Protocol V1; no authority cutover
Use this when: Comparing this candidate with its pinned legacy source
Do not use this for: Inferring current implementation or supersession of retained sources
Last reviewed: UNPROVEN; independent content review pending
Related:
- docs/platform/agent-coordination/vision.md
- docs/platform/agent-coordination/playbooks/coordination-operating-harness.md
- docs/platform/agent-coordination/proposals/step-08-standalone-coordination-protocols.md
Supersedes: None; retained source authority is unchanged
Superseded by: None
Added in candidate: Promotion metadata only; source claims and implementation are not re-decided here
```
Document type: Proposal
Design status: Proposed
Implementation: Partial
Last reviewed: 2026-08-31
Canonical for: nothing until communication contracts are accepted
Original date: 2026-08-28
Scope: role-to-role communication inside coding-domain stage protocols, Work-attached assignments, RunResult evidence, and standalone read-only coordination

## 1. Purpose

Team Dispatch V1 needs a communication protocol, but it must stay smaller than
a mailbox, daemon, or second lifecycle system.

This proposal describes a Work-attached coding-domain protocol and one early
standalone prototype. It is not the universal entry model for Agent
Coordination. Per the [Agent Coordination Foundation Vision](../vision.md), an
agent-led session may coordinate through validated dynamic execution contracts
without a predeclared Workflow/Stage graph.

The protocol defines how roles communicate while `Work` remains the lifecycle
authority:

```txt
Work position
  -> current workflow stage
    -> legal stage operations
      -> selected Assignment
        -> one Run
          -> one RunResult
            -> driver chooses the next legal operation or engine verb
```

The protocol is not a meeting scheduler. It is the set of rules that make one
role's message usable by another role without trusting terminal text or agent
say-so as proof.

## 2. Non-Negotiable Boundaries

```txt
Work is lifecycle authority.
Mission is a lightweight team envelope.
Stage is workflow position.
Stage Operation is one legal task-shaped action inside a stage.
Assignment is a semantic request.
Run is a runtime attempt.
RunResult is normalized result plus evidence.
Herdr is visibility only.
```

Do not introduce `Job` in V1. `Job` remains reserved for a future queue,
scheduler, lease, cancellation, or worker-pool design.

Do not let an Assignment mutate Work lifecycle state by itself. Work moves only
through existing engine verbs such as `fgos discover`, `fgos plan`, `fgos
return`, `fgos ask`, `fgos answer`, and approval/merge verbs.

## 3. Roles

The coding domain starts with the roles already declared in the role graph:

| Role | Responsibility | Typical operation family |
|---|---|---|
| `implementer` | Owns the current Work item, edits repo state, invokes engine verbs, and coordinates legal sub-calls. | `judge-ambiguity`, `shape-plan`, `implement-item`, `fix-verify-red` |
| `researcher` | Gathers evidence and facts. It may read repo context, run approved research tools, or inspect docs. | `resolve-question`, `scout-blast-radius` |
| `reviewer` | Finds correctness, feasibility, regression, and test risks. | `validate-plan`, `review-item` |
| `helper` | Performs an independent scoped piece whose footprint does not collide with the driver's active edit surface. | `scoped-subtask` |
| `advisor` | Answers product, scope, priority, or human-intent questions that cannot be settled from machine evidence. | `answer-question`, selected `advise` interactions |

Role is not executor. A reviewer can run on Codex, Claude, agy, pi, or a future
executor if policy and governance allow it.

Role is not stage owner. A stage owner may dispatch an Assignment to another
role while the Work item stays at the same stage.

## 4. Communication Modes

The role graph's `mode` field has protocol meaning:

| Mode | Meaning | Lifecycle effect | Required evidence |
|---|---|---|---|
| `sync` | Caller waits for a bounded finding or work product, then continues in the same stage. | Work usually stays claimed by the caller; holder may be logged but returns immediately. | Structured result artifact for read-only calls; git/artifact delta for mutating helper work. |
| `async` | Caller cannot continue without another actor or human-adjacent answer. | Work may park, or holder may move until a future reclaim. | A recorded question, answer, review verdict, or blocker with context refs. |

`sync` does not mean invisible. It still needs a recorded handoff or Assignment
RunResult when the result matters to later decisions.

`async` does not mean a new Work item. It becomes Work only when the request
needs independent lifecycle, approval, merge, or backlog visibility.

## 5. Stage Operation Selection

The driver may choose only operations declared for the current stage by
`operationsForStage(domain, stage, { kind })`.

Selection rules:

1. Prefer the primary operation when the stage's normal owner work remains the
   next required action.
2. Choose a secondary operation when a bounded role contribution would unblock
   the stage without creating lifecycle-bearing child work.
3. Create child Work only when the contribution needs its own claim, branch,
   verify, approval, merge, or backlog visibility.
4. Route discovery unresolved ambiguity to `exploring`; discovery must not ask
   the human directly.
5. Refuse operations marked `dispatch: human-only` from cli-spawn assignment
   execution.
6. Refuse synthetic compatibility operations from runtime dispatch unless their
   task-spec file resolves and the caller explicitly accepts compatibility
   dispatch.

Examples:

| Stage | Situation | Operation |
|---|---|---|
| `discovery` | Need machine evidence for ambiguity. | `resolve-question` to `researcher`, then owner decides `clear` or `unclear`. |
| `planning` | Plan is written and needs proof before the edge to executing. | `validate-plan` to `reviewer`. |
| `planning` | A symbol's blast radius is unknown. | `scout-blast-radius` to `researcher`. |
| `executing` | Implementation needs a separate non-overlapping edit. | `scoped-subtask` to `helper`. |
| `executing` | Returned diff needs independent review. | `review-item` to `reviewer`. |
| `executing` | Review or verify reports a concrete red issue. | `fix-verify-red` to `implementer`. |

## 6. Assignment Message Contract

Every assignment prompt must provide the worker with enough information to
produce a usable result without learning fgOS internals.

Required prompt fields:

```txt
Assignment: <assignmentId>
Work: <workId or (none)>
Stage operation: <stage>.<operation>
Role: <role>
Task-spec: <task-spec path>
Objective: <bounded request>
Context refs:
- <ref>
Expected outputs:
- <output>
Result artifact:
- Write JSON to <runDir>/agent-result.json
- Optionally write Markdown to <runDir>/agent-report.md
```

The prompt must say that the worker should not call Work lifecycle verbs unless
the task-spec explicitly says the worker is the lifecycle driver. Ordinary
Assignment workers return artifacts; the driver interprets them.

The prompt must pass refs, not embedded large docs, diffs, transcripts, or
secrets.

## 7. Agent Result Schema

`agent-result.json` is the worker's structured claim. It is not proof by
itself.

Minimal schema:

```json
{
  "status": "done",
  "summary": "One concise result sentence.",
  "findings": [],
  "evidenceRefs": [],
  "nextRecommendedOperation": null
}
```

Allowed status values:

| Status | Meaning |
|---|---|
| `done` | The worker believes the assignment objective is complete. |
| `blocked` | The worker could not complete because a named blocker remains. |
| `failed` | The worker attempted the assignment and produced an error or invalid output. |
| `no-evidence` | The worker can report context but cannot support a completion claim. |

Required fields by status:

| Status | Required fields |
|---|---|
| `done` | `summary`; at least one `evidenceRefs` entry or a companion `agent-report.md` for read-only work; external git/artifact evidence for mutating work. |
| `blocked` | `summary`; `blocker`; `evidenceRefs` when any evidence exists. |
| `failed` | `summary`; `error`. |
| `no-evidence` | `summary`; reason why evidence is absent. |

Optional `nextRecommendedOperation` may name another legal stage operation, but
it is only a recommendation. The driver must verify legality before acting.

## 8. RunResult Confidence

RunResult status and confidence are control-plane judgments.

Confidence ladder:

| Confidence | Meaning | Allowed use |
|---|---|---|
| `verified` | Structured claim plus post-run external evidence such as a new commit, new changed file, test artifact, or verified result file. | May feed lifecycle decisions that require proof. |
| `reported` | Structured claim plus a worker-produced report for read-only consult/review work. | May feed driver judgment, but should not close mutating work. |
| `inferred` | Post-run external evidence exists but no structured claim exists. | May be surfaced for inspection; driver should avoid automatic lifecycle movement. |
| `no-evidence` | Process settled without proof. | Must not advance Work. |
| `failed` | Timeout, nonzero exit, signal, invalid schema, or explicit failure. | Must not advance Work. |

The driver must treat `done/no-evidence` as not done. It may retry, ask for a
proper artifact, or route to a different legal operation.

## 9. Handoff Versus Assignment

Use `handoff` when the interaction is a short role-axis record around work the
current session already performed or directly observed.

Use Assignment when:

- another executor, provider, role, or tool performs the action;
- the result will be read by a later driver turn;
- the result needs Run/RunResult evidence;
- the interaction may fail independently;
- a read-only consult/review needs an artifact rather than a one-line summary.

`handoff` remains useful for visibility and role-holder truth. It is not enough
evidence for a Team Dispatch operation once the result influences a lifecycle
decision.

## 10. Coding-Domain Stage Protocols

### 10.1 Discovery

Discovery is machine-alone.

Allowed behavior:

- owner reads existing Work context;
- owner consults researcher helpers for evidence;
- owner logs consult interactions;
- owner chooses `clear` or `unclear`;
- `clear` can route to planning;
- `unclear` routes to exploring.

Forbidden behavior:

- asking the human directly;
- parking as `awaiting-human`;
- treating a helper's unsupported answer as proof;
- opening a new Work item just to answer a bounded evidence question.

### 10.2 Exploring

Exploring is the human-adjacent decision-locking stage.

Allowed behavior:

- advisor interaction for material, grounded, answerable product questions;
- researcher consult for repo or external facts;
- lock decisions into CONTEXT.md.

Exploring may ask a human. It should ask only after machine evidence has been
gathered and the question is self-contained.

### 10.3 Planning

Planning has two main operation families:

- `shape-plan` by implementer;
- `validate-plan` by reviewer.

The stage owner may write the plan directly, but validation should move toward
a reviewer Assignment once Step 05 adopts operation choice.

`validate-plan` is a real reviewer-role operation when dispatched through
Assignment. Prose that says validating is only an implementer function must be
reconciled before driver adoption.

### 10.4 Executing

Executing has the richest team protocol:

- implementer owns the main edit path;
- researcher may answer blast-radius or API/pattern questions;
- helper may take independent scoped work;
- reviewer may review returned diffs or candidate fixes;
- advisor handles product/scope questions that exceed locked decisions.

The implementer remains responsible for Work lifecycle. Helper/reviewer
assignments return artifacts and recommendations unless explicitly promoted to
child Work.

## 11. Coordination Operating Harness

Multi-agent implementation benefits from a durable operating harness:

```txt
trace/index.md
trace/current-cell.md
trace/<cell>.md
prompt templates
review and red-team gates
live proof capture
```

This harness is documented in
[coordination-operating-harness.md](../playbooks/coordination-operating-harness.md). It is
supporting engineering practice, not Step 07 runtime infrastructure and not a
lifecycle system. Its job is to keep coordinator, doer, reviewer, and red-team
sessions aligned while preserving token budget and proof traceability.

The harness should be used where it reduces implementation drift, but dogfooding
it is not a runtime dependency gate for standalone coordination.

## 12. Standalone Read-Only Coordination

The current mission-lite implementation is a prototype for standalone read-only
coordination. Its generalization is still under discussion in
[Step 08](step-08-standalone-coordination-protocols.md) and depends on the relevant
CoordinationSession/AdhocTask contracts from
[Step 07](step-07-coordination-session-adhoc-task.md).

A standalone session may group assignments without a Work item for read-only
coordination:

```txt
mission-lite objective
  -> researcher background brief
  -> reviewer counter-argument
  -> advisor product framing
  -> driver synthesis
```

Mission-lite currently borrows coding Stage Operations. That is prototype
behavior, not a foundation requirement. The target standalone path may instead
construct validated dynamic Assignments and may optionally select a reusable
protocol.

Rules:

- no Work lifecycle;
- no repo mutation;
- no approval/merge semantics;
- every role result is a structured artifact;
- synthesis is a report, not a state transition;
- any resulting implementation proposal becomes ordinary Work before code is
  changed.

Good first case:

```txt
Question: Should coding-domain planning validation run as a reviewer Assignment
or stay as direct same-session validation?
```

This is useful because it tests team reasoning without risking Work lifecycle
truth.

## 13. Acceptance Criteria For V1 Protocol

The protocol is ready for driver adoption when:

- every runtime assignment receives an explicit result artifact path;
- malformed or missing structured claims cannot produce `verified` or
  `reported`;
- dirty-before files cannot be counted as post-run evidence;
- read-only operations can return `reported` only through worker artifacts;
- mutating operations require post-run external evidence;
- stage skills agree on when Assignment is used versus direct invocation;
- `validate-plan` role prose is consistent across skill and task-spec docs;
- discovery remains machine-alone.
~~~~
````

### Unified diff

````diff
--- "docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#12-standalone-read-only-coordination"
+++ "docs/platform/agent-coordination/history/retired-engine/files/proposals/team-communication-protocol-v1.md#literal-snapshot"
@@ -1,3 +1,336 @@
+## Literal Snapshot
+
+~~~~text
+# Team Communication Protocol V1
+
+```txt
+Document type: Proposal
+Audience: Human reviewers, maintainers, documentation agents
+Purpose: Preserve source material for Team Communication Protocol V1
+Design status: Candidate
+Implementation: Not re-verified; source implementation statements remain in the body
+Provenance: Retained from docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md at fcfe78cb89585bc9ab23f11bab67d41458834fc4
+Writer type: Documentation maintainer
+Canonical for: Preserved proposal material for Team Communication Protocol V1; no authority cutover
+Use this when: Comparing this candidate with its pinned legacy source
+Do not use this for: Inferring current implementation or supersession of retained sources
+Last reviewed: UNPROVEN; independent content review pending
+Related:
+- docs/platform/agent-coordination/vision.md
+- docs/platform/agent-coordination/playbooks/coordination-operating-harness.md
+- docs/platform/agent-coordination/proposals/step-08-standalone-coordination-protocols.md
+Supersedes: None; retained source authority is unchanged
+Superseded by: None
+Added in candidate: Promotion metadata only; source claims and implementation are not re-decided here
+```
+Document type: Proposal
+Design status: Proposed
+Implementation: Partial
+Last reviewed: 2026-08-31
+Canonical for: nothing until communication contracts are accepted
+Original date: 2026-08-28
+Scope: role-to-role communication inside coding-domain stage protocols, Work-attached assignments, RunResult evidence, and standalone read-only coordination
+
+## 1. Purpose
+
+Team Dispatch V1 needs a communication protocol, but it must stay smaller than
+a mailbox, daemon, or second lifecycle system.
+
+This proposal describes a Work-attached coding-domain protocol and one early
+standalone prototype. It is not the universal entry model for Agent
+Coordination. Per the [Agent Coordination Foundation Vision](../vision.md), an
+agent-led session may coordinate through validated dynamic execution contracts
+without a predeclared Workflow/Stage graph.
+
+The protocol defines how roles communicate while `Work` remains the lifecycle
+authority:
+
+```txt
+Work position
+  -> current workflow stage
+    -> legal stage operations
+      -> selected Assignment
+        -> one Run
+          -> one RunResult
+            -> driver chooses the next legal operation or engine verb
+```
+
+The protocol is not a meeting scheduler. It is the set of rules that make one
+role's message usable by another role without trusting terminal text or agent
+say-so as proof.
+
+## 2. Non-Negotiable Boundaries
+
+```txt
+Work is lifecycle authority.
+Mission is a lightweight team envelope.
+Stage is workflow position.
+Stage Operation is one legal task-shaped action inside a stage.
+Assignment is a semantic request.
+Run is a runtime attempt.
+RunResult is normalized result plus evidence.
+Herdr is visibility only.
+```
+
+Do not introduce `Job` in V1. `Job` remains reserved for a future queue,
+scheduler, lease, cancellation, or worker-pool design.
+
+Do not let an Assignment mutate Work lifecycle state by itself. Work moves only
+through existing engine verbs such as `fgos discover`, `fgos plan`, `fgos
+return`, `fgos ask`, `fgos answer`, and approval/merge verbs.
+
+## 3. Roles
+
+The coding domain starts with the roles already declared in the role graph:
+
+| Role | Responsibility | Typical operation family |
+|---|---|---|
+| `implementer` | Owns the current Work item, edits repo state, invokes engine verbs, and coordinates legal sub-calls. | `judge-ambiguity`, `shape-plan`, `implement-item`, `fix-verify-red` |
+| `researcher` | Gathers evidence and facts. It may read repo context, run approved research tools, or inspect docs. | `resolve-question`, `scout-blast-radius` |
+| `reviewer` | Finds correctness, feasibility, regression, and test risks. | `validate-plan`, `review-item` |
+| `helper` | Performs an independent scoped piece whose footprint does not collide with the driver's active edit surface. | `scoped-subtask` |
+| `advisor` | Answers product, scope, priority, or human-intent questions that cannot be settled from machine evidence. | `answer-question`, selected `advise` interactions |
+
+Role is not executor. A reviewer can run on Codex, Claude, agy, pi, or a future
+executor if policy and governance allow it.
+
+Role is not stage owner. A stage owner may dispatch an Assignment to another
+role while the Work item stays at the same stage.
+
+## 4. Communication Modes
+
+The role graph's `mode` field has protocol meaning:
+
+| Mode | Meaning | Lifecycle effect | Required evidence |
+|---|---|---|---|
+| `sync` | Caller waits for a bounded finding or work product, then continues in the same stage. | Work usually stays claimed by the caller; holder may be logged but returns immediately. | Structured result artifact for read-only calls; git/artifact delta for mutating helper work. |
+| `async` | Caller cannot continue without another actor or human-adjacent answer. | Work may park, or holder may move until a future reclaim. | A recorded question, answer, review verdict, or blocker with context refs. |
+
+`sync` does not mean invisible. It still needs a recorded handoff or Assignment
+RunResult when the result matters to later decisions.
+
+`async` does not mean a new Work item. It becomes Work only when the request
+needs independent lifecycle, approval, merge, or backlog visibility.
+
+## 5. Stage Operation Selection
+
+The driver may choose only operations declared for the current stage by
+`operationsForStage(domain, stage, { kind })`.
+
+Selection rules:
+
+1. Prefer the primary operation when the stage's normal owner work remains the
+   next required action.
+2. Choose a secondary operation when a bounded role contribution would unblock
+   the stage without creating lifecycle-bearing child work.
+3. Create child Work only when the contribution needs its own claim, branch,
+   verify, approval, merge, or backlog visibility.
+4. Route discovery unresolved ambiguity to `exploring`; discovery must not ask
+   the human directly.
+5. Refuse operations marked `dispatch: human-only` from cli-spawn assignment
+   execution.
+6. Refuse synthetic compatibility operations from runtime dispatch unless their
+   task-spec file resolves and the caller explicitly accepts compatibility
+   dispatch.
+
+Examples:
+
+| Stage | Situation | Operation |
+|---|---|---|
+| `discovery` | Need machine evidence for ambiguity. | `resolve-question` to `researcher`, then owner decides `clear` or `unclear`. |
+| `planning` | Plan is written and needs proof before the edge to executing. | `validate-plan` to `reviewer`. |
+| `planning` | A symbol's blast radius is unknown. | `scout-blast-radius` to `researcher`. |
+| `executing` | Implementation needs a separate non-overlapping edit. | `scoped-subtask` to `helper`. |
+| `executing` | Returned diff needs independent review. | `review-item` to `reviewer`. |
+| `executing` | Review or verify reports a concrete red issue. | `fix-verify-red` to `implementer`. |
+
+## 6. Assignment Message Contract
+
+Every assignment prompt must provide the worker with enough information to
+produce a usable result without learning fgOS internals.
+
+Required prompt fields:
+
+```txt
+Assignment: <assignmentId>
+Work: <workId or (none)>
+Stage operation: <stage>.<operation>
+Role: <role>
+Task-spec: <task-spec path>
+Objective: <bounded request>
+Context refs:
+- <ref>
+Expected outputs:
+- <output>
+Result artifact:
+- Write JSON to <runDir>/agent-result.json
+- Optionally write Markdown to <runDir>/agent-report.md
+```
+
+The prompt must say that the worker should not call Work lifecycle verbs unless
+the task-spec explicitly says the worker is the lifecycle driver. Ordinary
+Assignment workers return artifacts; the driver interprets them.
+
+The prompt must pass refs, not embedded large docs, diffs, transcripts, or
+secrets.
+
+## 7. Agent Result Schema
+
+`agent-result.json` is the worker's structured claim. It is not proof by
+itself.
+
+Minimal schema:
+
+```json
+{
+  "status": "done",
+  "summary": "One concise result sentence.",
+  "findings": [],
+  "evidenceRefs": [],
+  "nextRecommendedOperation": null
+}
+```
+
+Allowed status values:
+
+| Status | Meaning |
+|---|---|
+| `done` | The worker believes the assignment objective is complete. |
+| `blocked` | The worker could not complete because a named blocker remains. |
+| `failed` | The worker attempted the assignment and produced an error or invalid output. |
+| `no-evidence` | The worker can report context but cannot support a completion claim. |
+
+Required fields by status:
+
+| Status | Required fields |
+|---|---|
+| `done` | `summary`; at least one `evidenceRefs` entry or a companion `agent-report.md` for read-only work; external git/artifact evidence for mutating work. |
+| `blocked` | `summary`; `blocker`; `evidenceRefs` when any evidence exists. |
+| `failed` | `summary`; `error`. |
+| `no-evidence` | `summary`; reason why evidence is absent. |
+
+Optional `nextRecommendedOperation` may name another legal stage operation, but
+it is only a recommendation. The driver must verify legality before acting.
+
+## 8. RunResult Confidence
+
+RunResult status and confidence are control-plane judgments.
+
+Confidence ladder:
+
+| Confidence | Meaning | Allowed use |
+|---|---|---|
+| `verified` | Structured claim plus post-run external evidence such as a new commit, new changed file, test artifact, or verified result file. | May feed lifecycle decisions that require proof. |
+| `reported` | Structured claim plus a worker-produced report for read-only consult/review work. | May feed driver judgment, but should not close mutating work. |
+| `inferred` | Post-run external evidence exists but no structured claim exists. | May be surfaced for inspection; driver should avoid automatic lifecycle movement. |
+| `no-evidence` | Process settled without proof. | Must not advance Work. |
+| `failed` | Timeout, nonzero exit, signal, invalid schema, or explicit failure. | Must not advance Work. |
+
+The driver must treat `done/no-evidence` as not done. It may retry, ask for a
+proper artifact, or route to a different legal operation.
+
+## 9. Handoff Versus Assignment
+
+Use `handoff` when the interaction is a short role-axis record around work the
+current session already performed or directly observed.
+
+Use Assignment when:
+
+- another executor, provider, role, or tool performs the action;
+- the result will be read by a later driver turn;
+- the result needs Run/RunResult evidence;
+- the interaction may fail independently;
+- a read-only consult/review needs an artifact rather than a one-line summary.
+
+`handoff` remains useful for visibility and role-holder truth. It is not enough
+evidence for a Team Dispatch operation once the result influences a lifecycle
+decision.
+
+## 10. Coding-Domain Stage Protocols
+
+### 10.1 Discovery
+
+Discovery is machine-alone.
+
+Allowed behavior:
+
+- owner reads existing Work context;
+- owner consults researcher helpers for evidence;
+- owner logs consult interactions;
+- owner chooses `clear` or `unclear`;
+- `clear` can route to planning;
+- `unclear` routes to exploring.
+
+Forbidden behavior:
+
+- asking the human directly;
+- parking as `awaiting-human`;
+- treating a helper's unsupported answer as proof;
+- opening a new Work item just to answer a bounded evidence question.
+
+### 10.2 Exploring
+
+Exploring is the human-adjacent decision-locking stage.
+
+Allowed behavior:
+
+- advisor interaction for material, grounded, answerable product questions;
+- researcher consult for repo or external facts;
+- lock decisions into CONTEXT.md.
+
+Exploring may ask a human. It should ask only after machine evidence has been
+gathered and the question is self-contained.
+
+### 10.3 Planning
+
+Planning has two main operation families:
+
+- `shape-plan` by implementer;
+- `validate-plan` by reviewer.
+
+The stage owner may write the plan directly, but validation should move toward
+a reviewer Assignment once Step 05 adopts operation choice.
+
+`validate-plan` is a real reviewer-role operation when dispatched through
+Assignment. Prose that says validating is only an implementer function must be
+reconciled before driver adoption.
+
+### 10.4 Executing
+
+Executing has the richest team protocol:
+
+- implementer owns the main edit path;
+- researcher may answer blast-radius or API/pattern questions;
+- helper may take independent scoped work;
+- reviewer may review returned diffs or candidate fixes;
+- advisor handles product/scope questions that exceed locked decisions.
+
+The implementer remains responsible for Work lifecycle. Helper/reviewer
+assignments return artifacts and recommendations unless explicitly promoted to
+child Work.
+
+## 11. Coordination Operating Harness
+
+Multi-agent implementation benefits from a durable operating harness:
+
+```txt
+trace/index.md
+trace/current-cell.md
+trace/<cell>.md
+prompt templates
+review and red-team gates
+live proof capture
+```
+
+This harness is documented in
+[coordination-operating-harness.md](../playbooks/coordination-operating-harness.md). It is
+supporting engineering practice, not Step 07 runtime infrastructure and not a
+lifecycle system. Its job is to keep coordinator, doer, reviewer, and red-team
+sessions aligned while preserving token budget and proof traceability.
+
+The harness should be used where it reduces implementation drift, but dogfooding
+it is not a runtime dependency gate for standalone coordination.
+
 ## 12. Standalone Read-Only Coordination
 
 The current mission-lite implementation is a prototype for standalone read-only
@@ -40,4 +373,19 @@ or stay as direct same-session validation?
 ```
 
 This is useful because it tests team reasoning without risking Work lifecycle
-truth.
\ No newline at end of file
+truth.
+
+## 13. Acceptance Criteria For V1 Protocol
+
+The protocol is ready for driver adoption when:
+
+- every runtime assignment receives an explicit result artifact path;
+- malformed or missing structured claims cannot produce `verified` or
+  `reported`;
+- dirty-before files cannot be counted as post-run evidence;
+- read-only operations can return `reported` only through worker artifacts;
+- mutating operations require post-run external evidence;
+- stage skills agree on when Assignment is used versus direct invocation;
+- `validate-plan` role prose is consistent across skill and task-spec docs;
+- discovery remains machine-alone.
+~~~~
\ No newline at end of file
````

## claim_635c585273c250e77af0dde9d4d9b52d

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-57

Target: docs/platform/agent-coordination/history/retired-engine/files/proposals/team-communication-protocol-v1.md#literal-snapshot

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_635c585273c250e77af0dde9d4d9b52d |
| sourceUnitDigest | 4b5cf3923e8ac354d53e3a27d41b106d772d04a534efaab428cbbbf97a7d5cda |
| claimKind | contract |
| disposition | move |
| rationale | This particular legacy unit docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-57 is retained verbatim inside docs/platform/agent-coordination/history/retired-engine/files/proposals/team-communication-protocol-v1.md#literal-snapshot as the dated pre-rework statement, not as an assertion that the whole surviving file is retired. The current version of docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md distinguishes present runtime behaviour/design obligations from the original session-only, obsolete interface or dated implementation wording. Retirement 2180b4e72 applies only to session-engine portions; live guidance is restored at its current path and receives a separate independent check. No old approval carries to this corrected unit-specific explanation. |
| targetOwner | docs/platform/agent-coordination/history/retired-engine/files/proposals/team-communication-protocol-v1.md |
| targetAnchor | literal-snapshot |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | c3a4d458bb1581e2f7b65a4b653037ba1866eb3ac0ee69dd189c0de195a97578 |
| targetAncestry | \["Historical File: Team Communication Protocol V1"\] |

### Source unit

```text
The current mission-lite implementation is a prototype for standalone read-only
coordination. Its generalization is still under discussion in
[Step 08](step-08-standalone-coordination-protocols.md) and depends on the relevant
CoordinationSession/AdhocTask contracts from
[Step 07](step-07-coordination-session-adhoc-task.md).
```

### Target unit

````text
## Literal Snapshot

~~~~text
# Team Communication Protocol V1

```txt
Document type: Proposal
Audience: Human reviewers, maintainers, documentation agents
Purpose: Preserve source material for Team Communication Protocol V1
Design status: Candidate
Implementation: Not re-verified; source implementation statements remain in the body
Provenance: Retained from docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md at fcfe78cb89585bc9ab23f11bab67d41458834fc4
Writer type: Documentation maintainer
Canonical for: Preserved proposal material for Team Communication Protocol V1; no authority cutover
Use this when: Comparing this candidate with its pinned legacy source
Do not use this for: Inferring current implementation or supersession of retained sources
Last reviewed: UNPROVEN; independent content review pending
Related:
- docs/platform/agent-coordination/vision.md
- docs/platform/agent-coordination/playbooks/coordination-operating-harness.md
- docs/platform/agent-coordination/proposals/step-08-standalone-coordination-protocols.md
Supersedes: None; retained source authority is unchanged
Superseded by: None
Added in candidate: Promotion metadata only; source claims and implementation are not re-decided here
```
Document type: Proposal
Design status: Proposed
Implementation: Partial
Last reviewed: 2026-08-31
Canonical for: nothing until communication contracts are accepted
Original date: 2026-08-28
Scope: role-to-role communication inside coding-domain stage protocols, Work-attached assignments, RunResult evidence, and standalone read-only coordination

## 1. Purpose

Team Dispatch V1 needs a communication protocol, but it must stay smaller than
a mailbox, daemon, or second lifecycle system.

This proposal describes a Work-attached coding-domain protocol and one early
standalone prototype. It is not the universal entry model for Agent
Coordination. Per the [Agent Coordination Foundation Vision](../vision.md), an
agent-led session may coordinate through validated dynamic execution contracts
without a predeclared Workflow/Stage graph.

The protocol defines how roles communicate while `Work` remains the lifecycle
authority:

```txt
Work position
  -> current workflow stage
    -> legal stage operations
      -> selected Assignment
        -> one Run
          -> one RunResult
            -> driver chooses the next legal operation or engine verb
```

The protocol is not a meeting scheduler. It is the set of rules that make one
role's message usable by another role without trusting terminal text or agent
say-so as proof.

## 2. Non-Negotiable Boundaries

```txt
Work is lifecycle authority.
Mission is a lightweight team envelope.
Stage is workflow position.
Stage Operation is one legal task-shaped action inside a stage.
Assignment is a semantic request.
Run is a runtime attempt.
RunResult is normalized result plus evidence.
Herdr is visibility only.
```

Do not introduce `Job` in V1. `Job` remains reserved for a future queue,
scheduler, lease, cancellation, or worker-pool design.

Do not let an Assignment mutate Work lifecycle state by itself. Work moves only
through existing engine verbs such as `fgos discover`, `fgos plan`, `fgos
return`, `fgos ask`, `fgos answer`, and approval/merge verbs.

## 3. Roles

The coding domain starts with the roles already declared in the role graph:

| Role | Responsibility | Typical operation family |
|---|---|---|
| `implementer` | Owns the current Work item, edits repo state, invokes engine verbs, and coordinates legal sub-calls. | `judge-ambiguity`, `shape-plan`, `implement-item`, `fix-verify-red` |
| `researcher` | Gathers evidence and facts. It may read repo context, run approved research tools, or inspect docs. | `resolve-question`, `scout-blast-radius` |
| `reviewer` | Finds correctness, feasibility, regression, and test risks. | `validate-plan`, `review-item` |
| `helper` | Performs an independent scoped piece whose footprint does not collide with the driver's active edit surface. | `scoped-subtask` |
| `advisor` | Answers product, scope, priority, or human-intent questions that cannot be settled from machine evidence. | `answer-question`, selected `advise` interactions |

Role is not executor. A reviewer can run on Codex, Claude, agy, pi, or a future
executor if policy and governance allow it.

Role is not stage owner. A stage owner may dispatch an Assignment to another
role while the Work item stays at the same stage.

## 4. Communication Modes

The role graph's `mode` field has protocol meaning:

| Mode | Meaning | Lifecycle effect | Required evidence |
|---|---|---|---|
| `sync` | Caller waits for a bounded finding or work product, then continues in the same stage. | Work usually stays claimed by the caller; holder may be logged but returns immediately. | Structured result artifact for read-only calls; git/artifact delta for mutating helper work. |
| `async` | Caller cannot continue without another actor or human-adjacent answer. | Work may park, or holder may move until a future reclaim. | A recorded question, answer, review verdict, or blocker with context refs. |

`sync` does not mean invisible. It still needs a recorded handoff or Assignment
RunResult when the result matters to later decisions.

`async` does not mean a new Work item. It becomes Work only when the request
needs independent lifecycle, approval, merge, or backlog visibility.

## 5. Stage Operation Selection

The driver may choose only operations declared for the current stage by
`operationsForStage(domain, stage, { kind })`.

Selection rules:

1. Prefer the primary operation when the stage's normal owner work remains the
   next required action.
2. Choose a secondary operation when a bounded role contribution would unblock
   the stage without creating lifecycle-bearing child work.
3. Create child Work only when the contribution needs its own claim, branch,
   verify, approval, merge, or backlog visibility.
4. Route discovery unresolved ambiguity to `exploring`; discovery must not ask
   the human directly.
5. Refuse operations marked `dispatch: human-only` from cli-spawn assignment
   execution.
6. Refuse synthetic compatibility operations from runtime dispatch unless their
   task-spec file resolves and the caller explicitly accepts compatibility
   dispatch.

Examples:

| Stage | Situation | Operation |
|---|---|---|
| `discovery` | Need machine evidence for ambiguity. | `resolve-question` to `researcher`, then owner decides `clear` or `unclear`. |
| `planning` | Plan is written and needs proof before the edge to executing. | `validate-plan` to `reviewer`. |
| `planning` | A symbol's blast radius is unknown. | `scout-blast-radius` to `researcher`. |
| `executing` | Implementation needs a separate non-overlapping edit. | `scoped-subtask` to `helper`. |
| `executing` | Returned diff needs independent review. | `review-item` to `reviewer`. |
| `executing` | Review or verify reports a concrete red issue. | `fix-verify-red` to `implementer`. |

## 6. Assignment Message Contract

Every assignment prompt must provide the worker with enough information to
produce a usable result without learning fgOS internals.

Required prompt fields:

```txt
Assignment: <assignmentId>
Work: <workId or (none)>
Stage operation: <stage>.<operation>
Role: <role>
Task-spec: <task-spec path>
Objective: <bounded request>
Context refs:
- <ref>
Expected outputs:
- <output>
Result artifact:
- Write JSON to <runDir>/agent-result.json
- Optionally write Markdown to <runDir>/agent-report.md
```

The prompt must say that the worker should not call Work lifecycle verbs unless
the task-spec explicitly says the worker is the lifecycle driver. Ordinary
Assignment workers return artifacts; the driver interprets them.

The prompt must pass refs, not embedded large docs, diffs, transcripts, or
secrets.

## 7. Agent Result Schema

`agent-result.json` is the worker's structured claim. It is not proof by
itself.

Minimal schema:

```json
{
  "status": "done",
  "summary": "One concise result sentence.",
  "findings": [],
  "evidenceRefs": [],
  "nextRecommendedOperation": null
}
```

Allowed status values:

| Status | Meaning |
|---|---|
| `done` | The worker believes the assignment objective is complete. |
| `blocked` | The worker could not complete because a named blocker remains. |
| `failed` | The worker attempted the assignment and produced an error or invalid output. |
| `no-evidence` | The worker can report context but cannot support a completion claim. |

Required fields by status:

| Status | Required fields |
|---|---|
| `done` | `summary`; at least one `evidenceRefs` entry or a companion `agent-report.md` for read-only work; external git/artifact evidence for mutating work. |
| `blocked` | `summary`; `blocker`; `evidenceRefs` when any evidence exists. |
| `failed` | `summary`; `error`. |
| `no-evidence` | `summary`; reason why evidence is absent. |

Optional `nextRecommendedOperation` may name another legal stage operation, but
it is only a recommendation. The driver must verify legality before acting.

## 8. RunResult Confidence

RunResult status and confidence are control-plane judgments.

Confidence ladder:

| Confidence | Meaning | Allowed use |
|---|---|---|
| `verified` | Structured claim plus post-run external evidence such as a new commit, new changed file, test artifact, or verified result file. | May feed lifecycle decisions that require proof. |
| `reported` | Structured claim plus a worker-produced report for read-only consult/review work. | May feed driver judgment, but should not close mutating work. |
| `inferred` | Post-run external evidence exists but no structured claim exists. | May be surfaced for inspection; driver should avoid automatic lifecycle movement. |
| `no-evidence` | Process settled without proof. | Must not advance Work. |
| `failed` | Timeout, nonzero exit, signal, invalid schema, or explicit failure. | Must not advance Work. |

The driver must treat `done/no-evidence` as not done. It may retry, ask for a
proper artifact, or route to a different legal operation.

## 9. Handoff Versus Assignment

Use `handoff` when the interaction is a short role-axis record around work the
current session already performed or directly observed.

Use Assignment when:

- another executor, provider, role, or tool performs the action;
- the result will be read by a later driver turn;
- the result needs Run/RunResult evidence;
- the interaction may fail independently;
- a read-only consult/review needs an artifact rather than a one-line summary.

`handoff` remains useful for visibility and role-holder truth. It is not enough
evidence for a Team Dispatch operation once the result influences a lifecycle
decision.

## 10. Coding-Domain Stage Protocols

### 10.1 Discovery

Discovery is machine-alone.

Allowed behavior:

- owner reads existing Work context;
- owner consults researcher helpers for evidence;
- owner logs consult interactions;
- owner chooses `clear` or `unclear`;
- `clear` can route to planning;
- `unclear` routes to exploring.

Forbidden behavior:

- asking the human directly;
- parking as `awaiting-human`;
- treating a helper's unsupported answer as proof;
- opening a new Work item just to answer a bounded evidence question.

### 10.2 Exploring

Exploring is the human-adjacent decision-locking stage.

Allowed behavior:

- advisor interaction for material, grounded, answerable product questions;
- researcher consult for repo or external facts;
- lock decisions into CONTEXT.md.

Exploring may ask a human. It should ask only after machine evidence has been
gathered and the question is self-contained.

### 10.3 Planning

Planning has two main operation families:

- `shape-plan` by implementer;
- `validate-plan` by reviewer.

The stage owner may write the plan directly, but validation should move toward
a reviewer Assignment once Step 05 adopts operation choice.

`validate-plan` is a real reviewer-role operation when dispatched through
Assignment. Prose that says validating is only an implementer function must be
reconciled before driver adoption.

### 10.4 Executing

Executing has the richest team protocol:

- implementer owns the main edit path;
- researcher may answer blast-radius or API/pattern questions;
- helper may take independent scoped work;
- reviewer may review returned diffs or candidate fixes;
- advisor handles product/scope questions that exceed locked decisions.

The implementer remains responsible for Work lifecycle. Helper/reviewer
assignments return artifacts and recommendations unless explicitly promoted to
child Work.

## 11. Coordination Operating Harness

Multi-agent implementation benefits from a durable operating harness:

```txt
trace/index.md
trace/current-cell.md
trace/<cell>.md
prompt templates
review and red-team gates
live proof capture
```

This harness is documented in
[coordination-operating-harness.md](../playbooks/coordination-operating-harness.md). It is
supporting engineering practice, not Step 07 runtime infrastructure and not a
lifecycle system. Its job is to keep coordinator, doer, reviewer, and red-team
sessions aligned while preserving token budget and proof traceability.

The harness should be used where it reduces implementation drift, but dogfooding
it is not a runtime dependency gate for standalone coordination.

## 12. Standalone Read-Only Coordination

The current mission-lite implementation is a prototype for standalone read-only
coordination. Its generalization is still under discussion in
[Step 08](step-08-standalone-coordination-protocols.md) and depends on the relevant
CoordinationSession/AdhocTask contracts from
[Step 07](step-07-coordination-session-adhoc-task.md).

A standalone session may group assignments without a Work item for read-only
coordination:

```txt
mission-lite objective
  -> researcher background brief
  -> reviewer counter-argument
  -> advisor product framing
  -> driver synthesis
```

Mission-lite currently borrows coding Stage Operations. That is prototype
behavior, not a foundation requirement. The target standalone path may instead
construct validated dynamic Assignments and may optionally select a reusable
protocol.

Rules:

- no Work lifecycle;
- no repo mutation;
- no approval/merge semantics;
- every role result is a structured artifact;
- synthesis is a report, not a state transition;
- any resulting implementation proposal becomes ordinary Work before code is
  changed.

Good first case:

```txt
Question: Should coding-domain planning validation run as a reviewer Assignment
or stay as direct same-session validation?
```

This is useful because it tests team reasoning without risking Work lifecycle
truth.

## 13. Acceptance Criteria For V1 Protocol

The protocol is ready for driver adoption when:

- every runtime assignment receives an explicit result artifact path;
- malformed or missing structured claims cannot produce `verified` or
  `reported`;
- dirty-before files cannot be counted as post-run evidence;
- read-only operations can return `reported` only through worker artifacts;
- mutating operations require post-run external evidence;
- stage skills agree on when Assignment is used versus direct invocation;
- `validate-plan` role prose is consistent across skill and task-spec docs;
- discovery remains machine-alone.
~~~~
````

### Unified diff

````diff
--- "docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-57"
+++ "docs/platform/agent-coordination/history/retired-engine/files/proposals/team-communication-protocol-v1.md#literal-snapshot"
@@ -1,5 +1,391 @@
+## Literal Snapshot
+
+~~~~text
+# Team Communication Protocol V1
+
+```txt
+Document type: Proposal
+Audience: Human reviewers, maintainers, documentation agents
+Purpose: Preserve source material for Team Communication Protocol V1
+Design status: Candidate
+Implementation: Not re-verified; source implementation statements remain in the body
+Provenance: Retained from docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md at fcfe78cb89585bc9ab23f11bab67d41458834fc4
+Writer type: Documentation maintainer
+Canonical for: Preserved proposal material for Team Communication Protocol V1; no authority cutover
+Use this when: Comparing this candidate with its pinned legacy source
+Do not use this for: Inferring current implementation or supersession of retained sources
+Last reviewed: UNPROVEN; independent content review pending
+Related:
+- docs/platform/agent-coordination/vision.md
+- docs/platform/agent-coordination/playbooks/coordination-operating-harness.md
+- docs/platform/agent-coordination/proposals/step-08-standalone-coordination-protocols.md
+Supersedes: None; retained source authority is unchanged
+Superseded by: None
+Added in candidate: Promotion metadata only; source claims and implementation are not re-decided here
+```
+Document type: Proposal
+Design status: Proposed
+Implementation: Partial
+Last reviewed: 2026-08-31
+Canonical for: nothing until communication contracts are accepted
+Original date: 2026-08-28
+Scope: role-to-role communication inside coding-domain stage protocols, Work-attached assignments, RunResult evidence, and standalone read-only coordination
+
+## 1. Purpose
+
+Team Dispatch V1 needs a communication protocol, but it must stay smaller than
+a mailbox, daemon, or second lifecycle system.
+
+This proposal describes a Work-attached coding-domain protocol and one early
+standalone prototype. It is not the universal entry model for Agent
+Coordination. Per the [Agent Coordination Foundation Vision](../vision.md), an
+agent-led session may coordinate through validated dynamic execution contracts
+without a predeclared Workflow/Stage graph.
+
+The protocol defines how roles communicate while `Work` remains the lifecycle
+authority:
+
+```txt
+Work position
+  -> current workflow stage
+    -> legal stage operations
+      -> selected Assignment
+        -> one Run
+          -> one RunResult
+            -> driver chooses the next legal operation or engine verb
+```
+
+The protocol is not a meeting scheduler. It is the set of rules that make one
+role's message usable by another role without trusting terminal text or agent
+say-so as proof.
+
+## 2. Non-Negotiable Boundaries
+
+```txt
+Work is lifecycle authority.
+Mission is a lightweight team envelope.
+Stage is workflow position.
+Stage Operation is one legal task-shaped action inside a stage.
+Assignment is a semantic request.
+Run is a runtime attempt.
+RunResult is normalized result plus evidence.
+Herdr is visibility only.
+```
+
+Do not introduce `Job` in V1. `Job` remains reserved for a future queue,
+scheduler, lease, cancellation, or worker-pool design.
+
+Do not let an Assignment mutate Work lifecycle state by itself. Work moves only
+through existing engine verbs such as `fgos discover`, `fgos plan`, `fgos
+return`, `fgos ask`, `fgos answer`, and approval/merge verbs.
+
+## 3. Roles
+
+The coding domain starts with the roles already declared in the role graph:
+
+| Role | Responsibility | Typical operation family |
+|---|---|---|
+| `implementer` | Owns the current Work item, edits repo state, invokes engine verbs, and coordinates legal sub-calls. | `judge-ambiguity`, `shape-plan`, `implement-item`, `fix-verify-red` |
+| `researcher` | Gathers evidence and facts. It may read repo context, run approved research tools, or inspect docs. | `resolve-question`, `scout-blast-radius` |
+| `reviewer` | Finds correctness, feasibility, regression, and test risks. | `validate-plan`, `review-item` |
+| `helper` | Performs an independent scoped piece whose footprint does not collide with the driver's active edit surface. | `scoped-subtask` |
+| `advisor` | Answers product, scope, priority, or human-intent questions that cannot be settled from machine evidence. | `answer-question`, selected `advise` interactions |
+
+Role is not executor. A reviewer can run on Codex, Claude, agy, pi, or a future
+executor if policy and governance allow it.
+
+Role is not stage owner. A stage owner may dispatch an Assignment to another
+role while the Work item stays at the same stage.
+
+## 4. Communication Modes
+
+The role graph's `mode` field has protocol meaning:
+
+| Mode | Meaning | Lifecycle effect | Required evidence |
+|---|---|---|---|
+| `sync` | Caller waits for a bounded finding or work product, then continues in the same stage. | Work usually stays claimed by the caller; holder may be logged but returns immediately. | Structured result artifact for read-only calls; git/artifact delta for mutating helper work. |
+| `async` | Caller cannot continue without another actor or human-adjacent answer. | Work may park, or holder may move until a future reclaim. | A recorded question, answer, review verdict, or blocker with context refs. |
+
+`sync` does not mean invisible. It still needs a recorded handoff or Assignment
+RunResult when the result matters to later decisions.
+
+`async` does not mean a new Work item. It becomes Work only when the request
+needs independent lifecycle, approval, merge, or backlog visibility.
+
+## 5. Stage Operation Selection
+
+The driver may choose only operations declared for the current stage by
+`operationsForStage(domain, stage, { kind })`.
+
+Selection rules:
+
+1. Prefer the primary operation when the stage's normal owner work remains the
+   next required action.
+2. Choose a secondary operation when a bounded role contribution would unblock
+   the stage without creating lifecycle-bearing child work.
+3. Create child Work only when the contribution needs its own claim, branch,
+   verify, approval, merge, or backlog visibility.
+4. Route discovery unresolved ambiguity to `exploring`; discovery must not ask
+   the human directly.
+5. Refuse operations marked `dispatch: human-only` from cli-spawn assignment
+   execution.
+6. Refuse synthetic compatibility operations from runtime dispatch unless their
+   task-spec file resolves and the caller explicitly accepts compatibility
+   dispatch.
+
+Examples:
+
+| Stage | Situation | Operation |
+|---|---|---|
+| `discovery` | Need machine evidence for ambiguity. | `resolve-question` to `researcher`, then owner decides `clear` or `unclear`. |
+| `planning` | Plan is written and needs proof before the edge to executing. | `validate-plan` to `reviewer`. |
+| `planning` | A symbol's blast radius is unknown. | `scout-blast-radius` to `researcher`. |
+| `executing` | Implementation needs a separate non-overlapping edit. | `scoped-subtask` to `helper`. |
+| `executing` | Returned diff needs independent review. | `review-item` to `reviewer`. |
+| `executing` | Review or verify reports a concrete red issue. | `fix-verify-red` to `implementer`. |
+
+## 6. Assignment Message Contract
+
+Every assignment prompt must provide the worker with enough information to
+produce a usable result without learning fgOS internals.
+
+Required prompt fields:
+
+```txt
+Assignment: <assignmentId>
+Work: <workId or (none)>
+Stage operation: <stage>.<operation>
+Role: <role>
+Task-spec: <task-spec path>
+Objective: <bounded request>
+Context refs:
+- <ref>
+Expected outputs:
+- <output>
+Result artifact:
+- Write JSON to <runDir>/agent-result.json
+- Optionally write Markdown to <runDir>/agent-report.md
+```
+
+The prompt must say that the worker should not call Work lifecycle verbs unless
+the task-spec explicitly says the worker is the lifecycle driver. Ordinary
+Assignment workers return artifacts; the driver interprets them.
+
+The prompt must pass refs, not embedded large docs, diffs, transcripts, or
+secrets.
+
+## 7. Agent Result Schema
+
+`agent-result.json` is the worker's structured claim. It is not proof by
+itself.
+
+Minimal schema:
+
+```json
+{
+  "status": "done",
+  "summary": "One concise result sentence.",
+  "findings": [],
+  "evidenceRefs": [],
+  "nextRecommendedOperation": null
+}
+```
+
+Allowed status values:
+
+| Status | Meaning |
+|---|---|
+| `done` | The worker believes the assignment objective is complete. |
+| `blocked` | The worker could not complete because a named blocker remains. |
+| `failed` | The worker attempted the assignment and produced an error or invalid output. |
+| `no-evidence` | The worker can report context but cannot support a completion claim. |
+
+Required fields by status:
+
+| Status | Required fields |
+|---|---|
+| `done` | `summary`; at least one `evidenceRefs` entry or a companion `agent-report.md` for read-only work; external git/artifact evidence for mutating work. |
+| `blocked` | `summary`; `blocker`; `evidenceRefs` when any evidence exists. |
+| `failed` | `summary`; `error`. |
+| `no-evidence` | `summary`; reason why evidence is absent. |
+
+Optional `nextRecommendedOperation` may name another legal stage operation, but
+it is only a recommendation. The driver must verify legality before acting.
+
+## 8. RunResult Confidence
+
+RunResult status and confidence are control-plane judgments.
+
+Confidence ladder:
+
+| Confidence | Meaning | Allowed use |
+|---|---|---|
+| `verified` | Structured claim plus post-run external evidence such as a new commit, new changed file, test artifact, or verified result file. | May feed lifecycle decisions that require proof. |
+| `reported` | Structured claim plus a worker-produced report for read-only consult/review work. | May feed driver judgment, but should not close mutating work. |
+| `inferred` | Post-run external evidence exists but no structured claim exists. | May be surfaced for inspection; driver should avoid automatic lifecycle movement. |
+| `no-evidence` | Process settled without proof. | Must not advance Work. |
+| `failed` | Timeout, nonzero exit, signal, invalid schema, or explicit failure. | Must not advance Work. |
+
+The driver must treat `done/no-evidence` as not done. It may retry, ask for a
+proper artifact, or route to a different legal operation.
+
+## 9. Handoff Versus Assignment
+
+Use `handoff` when the interaction is a short role-axis record around work the
+current session already performed or directly observed.
+
+Use Assignment when:
+
+- another executor, provider, role, or tool performs the action;
+- the result will be read by a later driver turn;
+- the result needs Run/RunResult evidence;
+- the interaction may fail independently;
+- a read-only consult/review needs an artifact rather than a one-line summary.
+
+`handoff` remains useful for visibility and role-holder truth. It is not enough
+evidence for a Team Dispatch operation once the result influences a lifecycle
+decision.
+
+## 10. Coding-Domain Stage Protocols
+
+### 10.1 Discovery
+
+Discovery is machine-alone.
+
+Allowed behavior:
+
+- owner reads existing Work context;
+- owner consults researcher helpers for evidence;
+- owner logs consult interactions;
+- owner chooses `clear` or `unclear`;
+- `clear` can route to planning;
+- `unclear` routes to exploring.
+
+Forbidden behavior:
+
+- asking the human directly;
+- parking as `awaiting-human`;
+- treating a helper's unsupported answer as proof;
+- opening a new Work item just to answer a bounded evidence question.
+
+### 10.2 Exploring
+
+Exploring is the human-adjacent decision-locking stage.
+
+Allowed behavior:
+
+- advisor interaction for material, grounded, answerable product questions;
+- researcher consult for repo or external facts;
+- lock decisions into CONTEXT.md.
+
+Exploring may ask a human. It should ask only after machine evidence has been
+gathered and the question is self-contained.
+
+### 10.3 Planning
+
+Planning has two main operation families:
+
+- `shape-plan` by implementer;
+- `validate-plan` by reviewer.
+
+The stage owner may write the plan directly, but validation should move toward
+a reviewer Assignment once Step 05 adopts operation choice.
+
+`validate-plan` is a real reviewer-role operation when dispatched through
+Assignment. Prose that says validating is only an implementer function must be
+reconciled before driver adoption.
+
+### 10.4 Executing
+
+Executing has the richest team protocol:
+
+- implementer owns the main edit path;
+- researcher may answer blast-radius or API/pattern questions;
+- helper may take independent scoped work;
+- reviewer may review returned diffs or candidate fixes;
+- advisor handles product/scope questions that exceed locked decisions.
+
+The implementer remains responsible for Work lifecycle. Helper/reviewer
+assignments return artifacts and recommendations unless explicitly promoted to
+child Work.
+
+## 11. Coordination Operating Harness
+
+Multi-agent implementation benefits from a durable operating harness:
+
+```txt
+trace/index.md
+trace/current-cell.md
+trace/<cell>.md
+prompt templates
+review and red-team gates
+live proof capture
+```
+
+This harness is documented in
+[coordination-operating-harness.md](../playbooks/coordination-operating-harness.md). It is
+supporting engineering practice, not Step 07 runtime infrastructure and not a
+lifecycle system. Its job is to keep coordinator, doer, reviewer, and red-team
+sessions aligned while preserving token budget and proof traceability.
+
+The harness should be used where it reduces implementation drift, but dogfooding
+it is not a runtime dependency gate for standalone coordination.
+
+## 12. Standalone Read-Only Coordination
+
 The current mission-lite implementation is a prototype for standalone read-only
 coordination. Its generalization is still under discussion in
 [Step 08](step-08-standalone-coordination-protocols.md) and depends on the relevant
 CoordinationSession/AdhocTask contracts from
-[Step 07](step-07-coordination-session-adhoc-task.md).
\ No newline at end of file
+[Step 07](step-07-coordination-session-adhoc-task.md).
+
+A standalone session may group assignments without a Work item for read-only
+coordination:
+
+```txt
+mission-lite objective
+  -> researcher background brief
+  -> reviewer counter-argument
+  -> advisor product framing
+  -> driver synthesis
+```
+
+Mission-lite currently borrows coding Stage Operations. That is prototype
+behavior, not a foundation requirement. The target standalone path may instead
+construct validated dynamic Assignments and may optionally select a reusable
+protocol.
+
+Rules:
+
+- no Work lifecycle;
+- no repo mutation;
+- no approval/merge semantics;
+- every role result is a structured artifact;
+- synthesis is a report, not a state transition;
+- any resulting implementation proposal becomes ordinary Work before code is
+  changed.
+
+Good first case:
+
+```txt
+Question: Should coding-domain planning validation run as a reviewer Assignment
+or stay as direct same-session validation?
+```
+
+This is useful because it tests team reasoning without risking Work lifecycle
+truth.
+
+## 13. Acceptance Criteria For V1 Protocol
+
+The protocol is ready for driver adoption when:
+
+- every runtime assignment receives an explicit result artifact path;
+- malformed or missing structured claims cannot produce `verified` or
+  `reported`;
+- dirty-before files cannot be counted as post-run evidence;
+- read-only operations can return `reported` only through worker artifacts;
+- mutating operations require post-run external evidence;
+- stage skills agree on when Assignment is used versus direct invocation;
+- `validate-plan` role prose is consistent across skill and task-spec docs;
+- discovery remains machine-alone.
+~~~~
\ No newline at end of file
````

## claim_df28ee736197bf083dee56b947737273

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-58

Target: docs/platform/agent-coordination/history/retired-engine/files/proposals/team-communication-protocol-v1.md#literal-snapshot

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_df28ee736197bf083dee56b947737273 |
| sourceUnitDigest | f488c415f981f077bab391418eab9f6bfcf4a4f3e1cf62b03ecdc24c52af388b |
| claimKind | contract |
| disposition | move |
| rationale | This particular legacy unit docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-58 is retained verbatim inside docs/platform/agent-coordination/history/retired-engine/files/proposals/team-communication-protocol-v1.md#literal-snapshot as the dated pre-rework statement, not as an assertion that the whole surviving file is retired. The current version of docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md distinguishes present runtime behaviour/design obligations from the original session-only, obsolete interface or dated implementation wording. Retirement 2180b4e72 applies only to session-engine portions; live guidance is restored at its current path and receives a separate independent check. No old approval carries to this corrected unit-specific explanation. |
| targetOwner | docs/platform/agent-coordination/history/retired-engine/files/proposals/team-communication-protocol-v1.md |
| targetAnchor | literal-snapshot |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | c3a4d458bb1581e2f7b65a4b653037ba1866eb3ac0ee69dd189c0de195a97578 |
| targetAncestry | \["Historical File: Team Communication Protocol V1"\] |

### Source unit

```text
A standalone session may group assignments without a Work item for read-only
coordination:
```

### Target unit

````text
## Literal Snapshot

~~~~text
# Team Communication Protocol V1

```txt
Document type: Proposal
Audience: Human reviewers, maintainers, documentation agents
Purpose: Preserve source material for Team Communication Protocol V1
Design status: Candidate
Implementation: Not re-verified; source implementation statements remain in the body
Provenance: Retained from docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md at fcfe78cb89585bc9ab23f11bab67d41458834fc4
Writer type: Documentation maintainer
Canonical for: Preserved proposal material for Team Communication Protocol V1; no authority cutover
Use this when: Comparing this candidate with its pinned legacy source
Do not use this for: Inferring current implementation or supersession of retained sources
Last reviewed: UNPROVEN; independent content review pending
Related:
- docs/platform/agent-coordination/vision.md
- docs/platform/agent-coordination/playbooks/coordination-operating-harness.md
- docs/platform/agent-coordination/proposals/step-08-standalone-coordination-protocols.md
Supersedes: None; retained source authority is unchanged
Superseded by: None
Added in candidate: Promotion metadata only; source claims and implementation are not re-decided here
```
Document type: Proposal
Design status: Proposed
Implementation: Partial
Last reviewed: 2026-08-31
Canonical for: nothing until communication contracts are accepted
Original date: 2026-08-28
Scope: role-to-role communication inside coding-domain stage protocols, Work-attached assignments, RunResult evidence, and standalone read-only coordination

## 1. Purpose

Team Dispatch V1 needs a communication protocol, but it must stay smaller than
a mailbox, daemon, or second lifecycle system.

This proposal describes a Work-attached coding-domain protocol and one early
standalone prototype. It is not the universal entry model for Agent
Coordination. Per the [Agent Coordination Foundation Vision](../vision.md), an
agent-led session may coordinate through validated dynamic execution contracts
without a predeclared Workflow/Stage graph.

The protocol defines how roles communicate while `Work` remains the lifecycle
authority:

```txt
Work position
  -> current workflow stage
    -> legal stage operations
      -> selected Assignment
        -> one Run
          -> one RunResult
            -> driver chooses the next legal operation or engine verb
```

The protocol is not a meeting scheduler. It is the set of rules that make one
role's message usable by another role without trusting terminal text or agent
say-so as proof.

## 2. Non-Negotiable Boundaries

```txt
Work is lifecycle authority.
Mission is a lightweight team envelope.
Stage is workflow position.
Stage Operation is one legal task-shaped action inside a stage.
Assignment is a semantic request.
Run is a runtime attempt.
RunResult is normalized result plus evidence.
Herdr is visibility only.
```

Do not introduce `Job` in V1. `Job` remains reserved for a future queue,
scheduler, lease, cancellation, or worker-pool design.

Do not let an Assignment mutate Work lifecycle state by itself. Work moves only
through existing engine verbs such as `fgos discover`, `fgos plan`, `fgos
return`, `fgos ask`, `fgos answer`, and approval/merge verbs.

## 3. Roles

The coding domain starts with the roles already declared in the role graph:

| Role | Responsibility | Typical operation family |
|---|---|---|
| `implementer` | Owns the current Work item, edits repo state, invokes engine verbs, and coordinates legal sub-calls. | `judge-ambiguity`, `shape-plan`, `implement-item`, `fix-verify-red` |
| `researcher` | Gathers evidence and facts. It may read repo context, run approved research tools, or inspect docs. | `resolve-question`, `scout-blast-radius` |
| `reviewer` | Finds correctness, feasibility, regression, and test risks. | `validate-plan`, `review-item` |
| `helper` | Performs an independent scoped piece whose footprint does not collide with the driver's active edit surface. | `scoped-subtask` |
| `advisor` | Answers product, scope, priority, or human-intent questions that cannot be settled from machine evidence. | `answer-question`, selected `advise` interactions |

Role is not executor. A reviewer can run on Codex, Claude, agy, pi, or a future
executor if policy and governance allow it.

Role is not stage owner. A stage owner may dispatch an Assignment to another
role while the Work item stays at the same stage.

## 4. Communication Modes

The role graph's `mode` field has protocol meaning:

| Mode | Meaning | Lifecycle effect | Required evidence |
|---|---|---|---|
| `sync` | Caller waits for a bounded finding or work product, then continues in the same stage. | Work usually stays claimed by the caller; holder may be logged but returns immediately. | Structured result artifact for read-only calls; git/artifact delta for mutating helper work. |
| `async` | Caller cannot continue without another actor or human-adjacent answer. | Work may park, or holder may move until a future reclaim. | A recorded question, answer, review verdict, or blocker with context refs. |

`sync` does not mean invisible. It still needs a recorded handoff or Assignment
RunResult when the result matters to later decisions.

`async` does not mean a new Work item. It becomes Work only when the request
needs independent lifecycle, approval, merge, or backlog visibility.

## 5. Stage Operation Selection

The driver may choose only operations declared for the current stage by
`operationsForStage(domain, stage, { kind })`.

Selection rules:

1. Prefer the primary operation when the stage's normal owner work remains the
   next required action.
2. Choose a secondary operation when a bounded role contribution would unblock
   the stage without creating lifecycle-bearing child work.
3. Create child Work only when the contribution needs its own claim, branch,
   verify, approval, merge, or backlog visibility.
4. Route discovery unresolved ambiguity to `exploring`; discovery must not ask
   the human directly.
5. Refuse operations marked `dispatch: human-only` from cli-spawn assignment
   execution.
6. Refuse synthetic compatibility operations from runtime dispatch unless their
   task-spec file resolves and the caller explicitly accepts compatibility
   dispatch.

Examples:

| Stage | Situation | Operation |
|---|---|---|
| `discovery` | Need machine evidence for ambiguity. | `resolve-question` to `researcher`, then owner decides `clear` or `unclear`. |
| `planning` | Plan is written and needs proof before the edge to executing. | `validate-plan` to `reviewer`. |
| `planning` | A symbol's blast radius is unknown. | `scout-blast-radius` to `researcher`. |
| `executing` | Implementation needs a separate non-overlapping edit. | `scoped-subtask` to `helper`. |
| `executing` | Returned diff needs independent review. | `review-item` to `reviewer`. |
| `executing` | Review or verify reports a concrete red issue. | `fix-verify-red` to `implementer`. |

## 6. Assignment Message Contract

Every assignment prompt must provide the worker with enough information to
produce a usable result without learning fgOS internals.

Required prompt fields:

```txt
Assignment: <assignmentId>
Work: <workId or (none)>
Stage operation: <stage>.<operation>
Role: <role>
Task-spec: <task-spec path>
Objective: <bounded request>
Context refs:
- <ref>
Expected outputs:
- <output>
Result artifact:
- Write JSON to <runDir>/agent-result.json
- Optionally write Markdown to <runDir>/agent-report.md
```

The prompt must say that the worker should not call Work lifecycle verbs unless
the task-spec explicitly says the worker is the lifecycle driver. Ordinary
Assignment workers return artifacts; the driver interprets them.

The prompt must pass refs, not embedded large docs, diffs, transcripts, or
secrets.

## 7. Agent Result Schema

`agent-result.json` is the worker's structured claim. It is not proof by
itself.

Minimal schema:

```json
{
  "status": "done",
  "summary": "One concise result sentence.",
  "findings": [],
  "evidenceRefs": [],
  "nextRecommendedOperation": null
}
```

Allowed status values:

| Status | Meaning |
|---|---|
| `done` | The worker believes the assignment objective is complete. |
| `blocked` | The worker could not complete because a named blocker remains. |
| `failed` | The worker attempted the assignment and produced an error or invalid output. |
| `no-evidence` | The worker can report context but cannot support a completion claim. |

Required fields by status:

| Status | Required fields |
|---|---|
| `done` | `summary`; at least one `evidenceRefs` entry or a companion `agent-report.md` for read-only work; external git/artifact evidence for mutating work. |
| `blocked` | `summary`; `blocker`; `evidenceRefs` when any evidence exists. |
| `failed` | `summary`; `error`. |
| `no-evidence` | `summary`; reason why evidence is absent. |

Optional `nextRecommendedOperation` may name another legal stage operation, but
it is only a recommendation. The driver must verify legality before acting.

## 8. RunResult Confidence

RunResult status and confidence are control-plane judgments.

Confidence ladder:

| Confidence | Meaning | Allowed use |
|---|---|---|
| `verified` | Structured claim plus post-run external evidence such as a new commit, new changed file, test artifact, or verified result file. | May feed lifecycle decisions that require proof. |
| `reported` | Structured claim plus a worker-produced report for read-only consult/review work. | May feed driver judgment, but should not close mutating work. |
| `inferred` | Post-run external evidence exists but no structured claim exists. | May be surfaced for inspection; driver should avoid automatic lifecycle movement. |
| `no-evidence` | Process settled without proof. | Must not advance Work. |
| `failed` | Timeout, nonzero exit, signal, invalid schema, or explicit failure. | Must not advance Work. |

The driver must treat `done/no-evidence` as not done. It may retry, ask for a
proper artifact, or route to a different legal operation.

## 9. Handoff Versus Assignment

Use `handoff` when the interaction is a short role-axis record around work the
current session already performed or directly observed.

Use Assignment when:

- another executor, provider, role, or tool performs the action;
- the result will be read by a later driver turn;
- the result needs Run/RunResult evidence;
- the interaction may fail independently;
- a read-only consult/review needs an artifact rather than a one-line summary.

`handoff` remains useful for visibility and role-holder truth. It is not enough
evidence for a Team Dispatch operation once the result influences a lifecycle
decision.

## 10. Coding-Domain Stage Protocols

### 10.1 Discovery

Discovery is machine-alone.

Allowed behavior:

- owner reads existing Work context;
- owner consults researcher helpers for evidence;
- owner logs consult interactions;
- owner chooses `clear` or `unclear`;
- `clear` can route to planning;
- `unclear` routes to exploring.

Forbidden behavior:

- asking the human directly;
- parking as `awaiting-human`;
- treating a helper's unsupported answer as proof;
- opening a new Work item just to answer a bounded evidence question.

### 10.2 Exploring

Exploring is the human-adjacent decision-locking stage.

Allowed behavior:

- advisor interaction for material, grounded, answerable product questions;
- researcher consult for repo or external facts;
- lock decisions into CONTEXT.md.

Exploring may ask a human. It should ask only after machine evidence has been
gathered and the question is self-contained.

### 10.3 Planning

Planning has two main operation families:

- `shape-plan` by implementer;
- `validate-plan` by reviewer.

The stage owner may write the plan directly, but validation should move toward
a reviewer Assignment once Step 05 adopts operation choice.

`validate-plan` is a real reviewer-role operation when dispatched through
Assignment. Prose that says validating is only an implementer function must be
reconciled before driver adoption.

### 10.4 Executing

Executing has the richest team protocol:

- implementer owns the main edit path;
- researcher may answer blast-radius or API/pattern questions;
- helper may take independent scoped work;
- reviewer may review returned diffs or candidate fixes;
- advisor handles product/scope questions that exceed locked decisions.

The implementer remains responsible for Work lifecycle. Helper/reviewer
assignments return artifacts and recommendations unless explicitly promoted to
child Work.

## 11. Coordination Operating Harness

Multi-agent implementation benefits from a durable operating harness:

```txt
trace/index.md
trace/current-cell.md
trace/<cell>.md
prompt templates
review and red-team gates
live proof capture
```

This harness is documented in
[coordination-operating-harness.md](../playbooks/coordination-operating-harness.md). It is
supporting engineering practice, not Step 07 runtime infrastructure and not a
lifecycle system. Its job is to keep coordinator, doer, reviewer, and red-team
sessions aligned while preserving token budget and proof traceability.

The harness should be used where it reduces implementation drift, but dogfooding
it is not a runtime dependency gate for standalone coordination.

## 12. Standalone Read-Only Coordination

The current mission-lite implementation is a prototype for standalone read-only
coordination. Its generalization is still under discussion in
[Step 08](step-08-standalone-coordination-protocols.md) and depends on the relevant
CoordinationSession/AdhocTask contracts from
[Step 07](step-07-coordination-session-adhoc-task.md).

A standalone session may group assignments without a Work item for read-only
coordination:

```txt
mission-lite objective
  -> researcher background brief
  -> reviewer counter-argument
  -> advisor product framing
  -> driver synthesis
```

Mission-lite currently borrows coding Stage Operations. That is prototype
behavior, not a foundation requirement. The target standalone path may instead
construct validated dynamic Assignments and may optionally select a reusable
protocol.

Rules:

- no Work lifecycle;
- no repo mutation;
- no approval/merge semantics;
- every role result is a structured artifact;
- synthesis is a report, not a state transition;
- any resulting implementation proposal becomes ordinary Work before code is
  changed.

Good first case:

```txt
Question: Should coding-domain planning validation run as a reviewer Assignment
or stay as direct same-session validation?
```

This is useful because it tests team reasoning without risking Work lifecycle
truth.

## 13. Acceptance Criteria For V1 Protocol

The protocol is ready for driver adoption when:

- every runtime assignment receives an explicit result artifact path;
- malformed or missing structured claims cannot produce `verified` or
  `reported`;
- dirty-before files cannot be counted as post-run evidence;
- read-only operations can return `reported` only through worker artifacts;
- mutating operations require post-run external evidence;
- stage skills agree on when Assignment is used versus direct invocation;
- `validate-plan` role prose is consistent across skill and task-spec docs;
- discovery remains machine-alone.
~~~~
````

### Unified diff

````diff
--- "docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-58"
+++ "docs/platform/agent-coordination/history/retired-engine/files/proposals/team-communication-protocol-v1.md#literal-snapshot"
@@ -1,2 +1,391 @@
+## Literal Snapshot
+
+~~~~text
+# Team Communication Protocol V1
+
+```txt
+Document type: Proposal
+Audience: Human reviewers, maintainers, documentation agents
+Purpose: Preserve source material for Team Communication Protocol V1
+Design status: Candidate
+Implementation: Not re-verified; source implementation statements remain in the body
+Provenance: Retained from docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md at fcfe78cb89585bc9ab23f11bab67d41458834fc4
+Writer type: Documentation maintainer
+Canonical for: Preserved proposal material for Team Communication Protocol V1; no authority cutover
+Use this when: Comparing this candidate with its pinned legacy source
+Do not use this for: Inferring current implementation or supersession of retained sources
+Last reviewed: UNPROVEN; independent content review pending
+Related:
+- docs/platform/agent-coordination/vision.md
+- docs/platform/agent-coordination/playbooks/coordination-operating-harness.md
+- docs/platform/agent-coordination/proposals/step-08-standalone-coordination-protocols.md
+Supersedes: None; retained source authority is unchanged
+Superseded by: None
+Added in candidate: Promotion metadata only; source claims and implementation are not re-decided here
+```
+Document type: Proposal
+Design status: Proposed
+Implementation: Partial
+Last reviewed: 2026-08-31
+Canonical for: nothing until communication contracts are accepted
+Original date: 2026-08-28
+Scope: role-to-role communication inside coding-domain stage protocols, Work-attached assignments, RunResult evidence, and standalone read-only coordination
+
+## 1. Purpose
+
+Team Dispatch V1 needs a communication protocol, but it must stay smaller than
+a mailbox, daemon, or second lifecycle system.
+
+This proposal describes a Work-attached coding-domain protocol and one early
+standalone prototype. It is not the universal entry model for Agent
+Coordination. Per the [Agent Coordination Foundation Vision](../vision.md), an
+agent-led session may coordinate through validated dynamic execution contracts
+without a predeclared Workflow/Stage graph.
+
+The protocol defines how roles communicate while `Work` remains the lifecycle
+authority:
+
+```txt
+Work position
+  -> current workflow stage
+    -> legal stage operations
+      -> selected Assignment
+        -> one Run
+          -> one RunResult
+            -> driver chooses the next legal operation or engine verb
+```
+
+The protocol is not a meeting scheduler. It is the set of rules that make one
+role's message usable by another role without trusting terminal text or agent
+say-so as proof.
+
+## 2. Non-Negotiable Boundaries
+
+```txt
+Work is lifecycle authority.
+Mission is a lightweight team envelope.
+Stage is workflow position.
+Stage Operation is one legal task-shaped action inside a stage.
+Assignment is a semantic request.
+Run is a runtime attempt.
+RunResult is normalized result plus evidence.
+Herdr is visibility only.
+```
+
+Do not introduce `Job` in V1. `Job` remains reserved for a future queue,
+scheduler, lease, cancellation, or worker-pool design.
+
+Do not let an Assignment mutate Work lifecycle state by itself. Work moves only
+through existing engine verbs such as `fgos discover`, `fgos plan`, `fgos
+return`, `fgos ask`, `fgos answer`, and approval/merge verbs.
+
+## 3. Roles
+
+The coding domain starts with the roles already declared in the role graph:
+
+| Role | Responsibility | Typical operation family |
+|---|---|---|
+| `implementer` | Owns the current Work item, edits repo state, invokes engine verbs, and coordinates legal sub-calls. | `judge-ambiguity`, `shape-plan`, `implement-item`, `fix-verify-red` |
+| `researcher` | Gathers evidence and facts. It may read repo context, run approved research tools, or inspect docs. | `resolve-question`, `scout-blast-radius` |
+| `reviewer` | Finds correctness, feasibility, regression, and test risks. | `validate-plan`, `review-item` |
+| `helper` | Performs an independent scoped piece whose footprint does not collide with the driver's active edit surface. | `scoped-subtask` |
+| `advisor` | Answers product, scope, priority, or human-intent questions that cannot be settled from machine evidence. | `answer-question`, selected `advise` interactions |
+
+Role is not executor. A reviewer can run on Codex, Claude, agy, pi, or a future
+executor if policy and governance allow it.
+
+Role is not stage owner. A stage owner may dispatch an Assignment to another
+role while the Work item stays at the same stage.
+
+## 4. Communication Modes
+
+The role graph's `mode` field has protocol meaning:
+
+| Mode | Meaning | Lifecycle effect | Required evidence |
+|---|---|---|---|
+| `sync` | Caller waits for a bounded finding or work product, then continues in the same stage. | Work usually stays claimed by the caller; holder may be logged but returns immediately. | Structured result artifact for read-only calls; git/artifact delta for mutating helper work. |
+| `async` | Caller cannot continue without another actor or human-adjacent answer. | Work may park, or holder may move until a future reclaim. | A recorded question, answer, review verdict, or blocker with context refs. |
+
+`sync` does not mean invisible. It still needs a recorded handoff or Assignment
+RunResult when the result matters to later decisions.
+
+`async` does not mean a new Work item. It becomes Work only when the request
+needs independent lifecycle, approval, merge, or backlog visibility.
+
+## 5. Stage Operation Selection
+
+The driver may choose only operations declared for the current stage by
+`operationsForStage(domain, stage, { kind })`.
+
+Selection rules:
+
+1. Prefer the primary operation when the stage's normal owner work remains the
+   next required action.
+2. Choose a secondary operation when a bounded role contribution would unblock
+   the stage without creating lifecycle-bearing child work.
+3. Create child Work only when the contribution needs its own claim, branch,
+   verify, approval, merge, or backlog visibility.
+4. Route discovery unresolved ambiguity to `exploring`; discovery must not ask
+   the human directly.
+5. Refuse operations marked `dispatch: human-only` from cli-spawn assignment
+   execution.
+6. Refuse synthetic compatibility operations from runtime dispatch unless their
+   task-spec file resolves and the caller explicitly accepts compatibility
+   dispatch.
+
+Examples:
+
+| Stage | Situation | Operation |
+|---|---|---|
+| `discovery` | Need machine evidence for ambiguity. | `resolve-question` to `researcher`, then owner decides `clear` or `unclear`. |
+| `planning` | Plan is written and needs proof before the edge to executing. | `validate-plan` to `reviewer`. |
+| `planning` | A symbol's blast radius is unknown. | `scout-blast-radius` to `researcher`. |
+| `executing` | Implementation needs a separate non-overlapping edit. | `scoped-subtask` to `helper`. |
+| `executing` | Returned diff needs independent review. | `review-item` to `reviewer`. |
+| `executing` | Review or verify reports a concrete red issue. | `fix-verify-red` to `implementer`. |
+
+## 6. Assignment Message Contract
+
+Every assignment prompt must provide the worker with enough information to
+produce a usable result without learning fgOS internals.
+
+Required prompt fields:
+
+```txt
+Assignment: <assignmentId>
+Work: <workId or (none)>
+Stage operation: <stage>.<operation>
+Role: <role>
+Task-spec: <task-spec path>
+Objective: <bounded request>
+Context refs:
+- <ref>
+Expected outputs:
+- <output>
+Result artifact:
+- Write JSON to <runDir>/agent-result.json
+- Optionally write Markdown to <runDir>/agent-report.md
+```
+
+The prompt must say that the worker should not call Work lifecycle verbs unless
+the task-spec explicitly says the worker is the lifecycle driver. Ordinary
+Assignment workers return artifacts; the driver interprets them.
+
+The prompt must pass refs, not embedded large docs, diffs, transcripts, or
+secrets.
+
+## 7. Agent Result Schema
+
+`agent-result.json` is the worker's structured claim. It is not proof by
+itself.
+
+Minimal schema:
+
+```json
+{
+  "status": "done",
+  "summary": "One concise result sentence.",
+  "findings": [],
+  "evidenceRefs": [],
+  "nextRecommendedOperation": null
+}
+```
+
+Allowed status values:
+
+| Status | Meaning |
+|---|---|
+| `done` | The worker believes the assignment objective is complete. |
+| `blocked` | The worker could not complete because a named blocker remains. |
+| `failed` | The worker attempted the assignment and produced an error or invalid output. |
+| `no-evidence` | The worker can report context but cannot support a completion claim. |
+
+Required fields by status:
+
+| Status | Required fields |
+|---|---|
+| `done` | `summary`; at least one `evidenceRefs` entry or a companion `agent-report.md` for read-only work; external git/artifact evidence for mutating work. |
+| `blocked` | `summary`; `blocker`; `evidenceRefs` when any evidence exists. |
+| `failed` | `summary`; `error`. |
+| `no-evidence` | `summary`; reason why evidence is absent. |
+
+Optional `nextRecommendedOperation` may name another legal stage operation, but
+it is only a recommendation. The driver must verify legality before acting.
+
+## 8. RunResult Confidence
+
+RunResult status and confidence are control-plane judgments.
+
+Confidence ladder:
+
+| Confidence | Meaning | Allowed use |
+|---|---|---|
+| `verified` | Structured claim plus post-run external evidence such as a new commit, new changed file, test artifact, or verified result file. | May feed lifecycle decisions that require proof. |
+| `reported` | Structured claim plus a worker-produced report for read-only consult/review work. | May feed driver judgment, but should not close mutating work. |
+| `inferred` | Post-run external evidence exists but no structured claim exists. | May be surfaced for inspection; driver should avoid automatic lifecycle movement. |
+| `no-evidence` | Process settled without proof. | Must not advance Work. |
+| `failed` | Timeout, nonzero exit, signal, invalid schema, or explicit failure. | Must not advance Work. |
+
+The driver must treat `done/no-evidence` as not done. It may retry, ask for a
+proper artifact, or route to a different legal operation.
+
+## 9. Handoff Versus Assignment
+
+Use `handoff` when the interaction is a short role-axis record around work the
+current session already performed or directly observed.
+
+Use Assignment when:
+
+- another executor, provider, role, or tool performs the action;
+- the result will be read by a later driver turn;
+- the result needs Run/RunResult evidence;
+- the interaction may fail independently;
+- a read-only consult/review needs an artifact rather than a one-line summary.
+
+`handoff` remains useful for visibility and role-holder truth. It is not enough
+evidence for a Team Dispatch operation once the result influences a lifecycle
+decision.
+
+## 10. Coding-Domain Stage Protocols
+
+### 10.1 Discovery
+
+Discovery is machine-alone.
+
+Allowed behavior:
+
+- owner reads existing Work context;
+- owner consults researcher helpers for evidence;
+- owner logs consult interactions;
+- owner chooses `clear` or `unclear`;
+- `clear` can route to planning;
+- `unclear` routes to exploring.
+
+Forbidden behavior:
+
+- asking the human directly;
+- parking as `awaiting-human`;
+- treating a helper's unsupported answer as proof;
+- opening a new Work item just to answer a bounded evidence question.
+
+### 10.2 Exploring
+
+Exploring is the human-adjacent decision-locking stage.
+
+Allowed behavior:
+
+- advisor interaction for material, grounded, answerable product questions;
+- researcher consult for repo or external facts;
+- lock decisions into CONTEXT.md.
+
+Exploring may ask a human. It should ask only after machine evidence has been
+gathered and the question is self-contained.
+
+### 10.3 Planning
+
+Planning has two main operation families:
+
+- `shape-plan` by implementer;
+- `validate-plan` by reviewer.
+
+The stage owner may write the plan directly, but validation should move toward
+a reviewer Assignment once Step 05 adopts operation choice.
+
+`validate-plan` is a real reviewer-role operation when dispatched through
+Assignment. Prose that says validating is only an implementer function must be
+reconciled before driver adoption.
+
+### 10.4 Executing
+
+Executing has the richest team protocol:
+
+- implementer owns the main edit path;
+- researcher may answer blast-radius or API/pattern questions;
+- helper may take independent scoped work;
+- reviewer may review returned diffs or candidate fixes;
+- advisor handles product/scope questions that exceed locked decisions.
+
+The implementer remains responsible for Work lifecycle. Helper/reviewer
+assignments return artifacts and recommendations unless explicitly promoted to
+child Work.
+
+## 11. Coordination Operating Harness
+
+Multi-agent implementation benefits from a durable operating harness:
+
+```txt
+trace/index.md
+trace/current-cell.md
+trace/<cell>.md
+prompt templates
+review and red-team gates
+live proof capture
+```
+
+This harness is documented in
+[coordination-operating-harness.md](../playbooks/coordination-operating-harness.md). It is
+supporting engineering practice, not Step 07 runtime infrastructure and not a
+lifecycle system. Its job is to keep coordinator, doer, reviewer, and red-team
+sessions aligned while preserving token budget and proof traceability.
+
+The harness should be used where it reduces implementation drift, but dogfooding
+it is not a runtime dependency gate for standalone coordination.
+
+## 12. Standalone Read-Only Coordination
+
+The current mission-lite implementation is a prototype for standalone read-only
+coordination. Its generalization is still under discussion in
+[Step 08](step-08-standalone-coordination-protocols.md) and depends on the relevant
+CoordinationSession/AdhocTask contracts from
+[Step 07](step-07-coordination-session-adhoc-task.md).
+
 A standalone session may group assignments without a Work item for read-only
-coordination:
\ No newline at end of file
+coordination:
+
+```txt
+mission-lite objective
+  -> researcher background brief
+  -> reviewer counter-argument
+  -> advisor product framing
+  -> driver synthesis
+```
+
+Mission-lite currently borrows coding Stage Operations. That is prototype
+behavior, not a foundation requirement. The target standalone path may instead
+construct validated dynamic Assignments and may optionally select a reusable
+protocol.
+
+Rules:
+
+- no Work lifecycle;
+- no repo mutation;
+- no approval/merge semantics;
+- every role result is a structured artifact;
+- synthesis is a report, not a state transition;
+- any resulting implementation proposal becomes ordinary Work before code is
+  changed.
+
+Good first case:
+
+```txt
+Question: Should coding-domain planning validation run as a reviewer Assignment
+or stay as direct same-session validation?
+```
+
+This is useful because it tests team reasoning without risking Work lifecycle
+truth.
+
+## 13. Acceptance Criteria For V1 Protocol
+
+The protocol is ready for driver adoption when:
+
+- every runtime assignment receives an explicit result artifact path;
+- malformed or missing structured claims cannot produce `verified` or
+  `reported`;
+- dirty-before files cannot be counted as post-run evidence;
+- read-only operations can return `reported` only through worker artifacts;
+- mutating operations require post-run external evidence;
+- stage skills agree on when Assignment is used versus direct invocation;
+- `validate-plan` role prose is consistent across skill and task-spec docs;
+- discovery remains machine-alone.
+~~~~
\ No newline at end of file
````

## claim_2ece9faad33bb859a23d6fb5b9c20987

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-59

Target: docs/platform/agent-coordination/history/retired-engine/files/proposals/team-communication-protocol-v1.md#literal-snapshot

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_2ece9faad33bb859a23d6fb5b9c20987 |
| sourceUnitDigest | 65b71d970b52f183e7df086d48cb367c1f76ed8d93b9e4098d8d21b92d7d4a69 |
| claimKind | contract |
| disposition | move |
| rationale | This particular legacy unit docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-59 is retained verbatim inside docs/platform/agent-coordination/history/retired-engine/files/proposals/team-communication-protocol-v1.md#literal-snapshot as the dated pre-rework statement, not as an assertion that the whole surviving file is retired. The current version of docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md distinguishes present runtime behaviour/design obligations from the original session-only, obsolete interface or dated implementation wording. Retirement 2180b4e72 applies only to session-engine portions; live guidance is restored at its current path and receives a separate independent check. No old approval carries to this corrected unit-specific explanation. |
| targetOwner | docs/platform/agent-coordination/history/retired-engine/files/proposals/team-communication-protocol-v1.md |
| targetAnchor | literal-snapshot |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | c3a4d458bb1581e2f7b65a4b653037ba1866eb3ac0ee69dd189c0de195a97578 |
| targetAncestry | \["Historical File: Team Communication Protocol V1"\] |

### Source unit

````text
```txt
mission-lite objective
  -> researcher background brief
  -> reviewer counter-argument
  -> advisor product framing
  -> driver synthesis
```
````

### Target unit

````text
## Literal Snapshot

~~~~text
# Team Communication Protocol V1

```txt
Document type: Proposal
Audience: Human reviewers, maintainers, documentation agents
Purpose: Preserve source material for Team Communication Protocol V1
Design status: Candidate
Implementation: Not re-verified; source implementation statements remain in the body
Provenance: Retained from docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md at fcfe78cb89585bc9ab23f11bab67d41458834fc4
Writer type: Documentation maintainer
Canonical for: Preserved proposal material for Team Communication Protocol V1; no authority cutover
Use this when: Comparing this candidate with its pinned legacy source
Do not use this for: Inferring current implementation or supersession of retained sources
Last reviewed: UNPROVEN; independent content review pending
Related:
- docs/platform/agent-coordination/vision.md
- docs/platform/agent-coordination/playbooks/coordination-operating-harness.md
- docs/platform/agent-coordination/proposals/step-08-standalone-coordination-protocols.md
Supersedes: None; retained source authority is unchanged
Superseded by: None
Added in candidate: Promotion metadata only; source claims and implementation are not re-decided here
```
Document type: Proposal
Design status: Proposed
Implementation: Partial
Last reviewed: 2026-08-31
Canonical for: nothing until communication contracts are accepted
Original date: 2026-08-28
Scope: role-to-role communication inside coding-domain stage protocols, Work-attached assignments, RunResult evidence, and standalone read-only coordination

## 1. Purpose

Team Dispatch V1 needs a communication protocol, but it must stay smaller than
a mailbox, daemon, or second lifecycle system.

This proposal describes a Work-attached coding-domain protocol and one early
standalone prototype. It is not the universal entry model for Agent
Coordination. Per the [Agent Coordination Foundation Vision](../vision.md), an
agent-led session may coordinate through validated dynamic execution contracts
without a predeclared Workflow/Stage graph.

The protocol defines how roles communicate while `Work` remains the lifecycle
authority:

```txt
Work position
  -> current workflow stage
    -> legal stage operations
      -> selected Assignment
        -> one Run
          -> one RunResult
            -> driver chooses the next legal operation or engine verb
```

The protocol is not a meeting scheduler. It is the set of rules that make one
role's message usable by another role without trusting terminal text or agent
say-so as proof.

## 2. Non-Negotiable Boundaries

```txt
Work is lifecycle authority.
Mission is a lightweight team envelope.
Stage is workflow position.
Stage Operation is one legal task-shaped action inside a stage.
Assignment is a semantic request.
Run is a runtime attempt.
RunResult is normalized result plus evidence.
Herdr is visibility only.
```

Do not introduce `Job` in V1. `Job` remains reserved for a future queue,
scheduler, lease, cancellation, or worker-pool design.

Do not let an Assignment mutate Work lifecycle state by itself. Work moves only
through existing engine verbs such as `fgos discover`, `fgos plan`, `fgos
return`, `fgos ask`, `fgos answer`, and approval/merge verbs.

## 3. Roles

The coding domain starts with the roles already declared in the role graph:

| Role | Responsibility | Typical operation family |
|---|---|---|
| `implementer` | Owns the current Work item, edits repo state, invokes engine verbs, and coordinates legal sub-calls. | `judge-ambiguity`, `shape-plan`, `implement-item`, `fix-verify-red` |
| `researcher` | Gathers evidence and facts. It may read repo context, run approved research tools, or inspect docs. | `resolve-question`, `scout-blast-radius` |
| `reviewer` | Finds correctness, feasibility, regression, and test risks. | `validate-plan`, `review-item` |
| `helper` | Performs an independent scoped piece whose footprint does not collide with the driver's active edit surface. | `scoped-subtask` |
| `advisor` | Answers product, scope, priority, or human-intent questions that cannot be settled from machine evidence. | `answer-question`, selected `advise` interactions |

Role is not executor. A reviewer can run on Codex, Claude, agy, pi, or a future
executor if policy and governance allow it.

Role is not stage owner. A stage owner may dispatch an Assignment to another
role while the Work item stays at the same stage.

## 4. Communication Modes

The role graph's `mode` field has protocol meaning:

| Mode | Meaning | Lifecycle effect | Required evidence |
|---|---|---|---|
| `sync` | Caller waits for a bounded finding or work product, then continues in the same stage. | Work usually stays claimed by the caller; holder may be logged but returns immediately. | Structured result artifact for read-only calls; git/artifact delta for mutating helper work. |
| `async` | Caller cannot continue without another actor or human-adjacent answer. | Work may park, or holder may move until a future reclaim. | A recorded question, answer, review verdict, or blocker with context refs. |

`sync` does not mean invisible. It still needs a recorded handoff or Assignment
RunResult when the result matters to later decisions.

`async` does not mean a new Work item. It becomes Work only when the request
needs independent lifecycle, approval, merge, or backlog visibility.

## 5. Stage Operation Selection

The driver may choose only operations declared for the current stage by
`operationsForStage(domain, stage, { kind })`.

Selection rules:

1. Prefer the primary operation when the stage's normal owner work remains the
   next required action.
2. Choose a secondary operation when a bounded role contribution would unblock
   the stage without creating lifecycle-bearing child work.
3. Create child Work only when the contribution needs its own claim, branch,
   verify, approval, merge, or backlog visibility.
4. Route discovery unresolved ambiguity to `exploring`; discovery must not ask
   the human directly.
5. Refuse operations marked `dispatch: human-only` from cli-spawn assignment
   execution.
6. Refuse synthetic compatibility operations from runtime dispatch unless their
   task-spec file resolves and the caller explicitly accepts compatibility
   dispatch.

Examples:

| Stage | Situation | Operation |
|---|---|---|
| `discovery` | Need machine evidence for ambiguity. | `resolve-question` to `researcher`, then owner decides `clear` or `unclear`. |
| `planning` | Plan is written and needs proof before the edge to executing. | `validate-plan` to `reviewer`. |
| `planning` | A symbol's blast radius is unknown. | `scout-blast-radius` to `researcher`. |
| `executing` | Implementation needs a separate non-overlapping edit. | `scoped-subtask` to `helper`. |
| `executing` | Returned diff needs independent review. | `review-item` to `reviewer`. |
| `executing` | Review or verify reports a concrete red issue. | `fix-verify-red` to `implementer`. |

## 6. Assignment Message Contract

Every assignment prompt must provide the worker with enough information to
produce a usable result without learning fgOS internals.

Required prompt fields:

```txt
Assignment: <assignmentId>
Work: <workId or (none)>
Stage operation: <stage>.<operation>
Role: <role>
Task-spec: <task-spec path>
Objective: <bounded request>
Context refs:
- <ref>
Expected outputs:
- <output>
Result artifact:
- Write JSON to <runDir>/agent-result.json
- Optionally write Markdown to <runDir>/agent-report.md
```

The prompt must say that the worker should not call Work lifecycle verbs unless
the task-spec explicitly says the worker is the lifecycle driver. Ordinary
Assignment workers return artifacts; the driver interprets them.

The prompt must pass refs, not embedded large docs, diffs, transcripts, or
secrets.

## 7. Agent Result Schema

`agent-result.json` is the worker's structured claim. It is not proof by
itself.

Minimal schema:

```json
{
  "status": "done",
  "summary": "One concise result sentence.",
  "findings": [],
  "evidenceRefs": [],
  "nextRecommendedOperation": null
}
```

Allowed status values:

| Status | Meaning |
|---|---|
| `done` | The worker believes the assignment objective is complete. |
| `blocked` | The worker could not complete because a named blocker remains. |
| `failed` | The worker attempted the assignment and produced an error or invalid output. |
| `no-evidence` | The worker can report context but cannot support a completion claim. |

Required fields by status:

| Status | Required fields |
|---|---|
| `done` | `summary`; at least one `evidenceRefs` entry or a companion `agent-report.md` for read-only work; external git/artifact evidence for mutating work. |
| `blocked` | `summary`; `blocker`; `evidenceRefs` when any evidence exists. |
| `failed` | `summary`; `error`. |
| `no-evidence` | `summary`; reason why evidence is absent. |

Optional `nextRecommendedOperation` may name another legal stage operation, but
it is only a recommendation. The driver must verify legality before acting.

## 8. RunResult Confidence

RunResult status and confidence are control-plane judgments.

Confidence ladder:

| Confidence | Meaning | Allowed use |
|---|---|---|
| `verified` | Structured claim plus post-run external evidence such as a new commit, new changed file, test artifact, or verified result file. | May feed lifecycle decisions that require proof. |
| `reported` | Structured claim plus a worker-produced report for read-only consult/review work. | May feed driver judgment, but should not close mutating work. |
| `inferred` | Post-run external evidence exists but no structured claim exists. | May be surfaced for inspection; driver should avoid automatic lifecycle movement. |
| `no-evidence` | Process settled without proof. | Must not advance Work. |
| `failed` | Timeout, nonzero exit, signal, invalid schema, or explicit failure. | Must not advance Work. |

The driver must treat `done/no-evidence` as not done. It may retry, ask for a
proper artifact, or route to a different legal operation.

## 9. Handoff Versus Assignment

Use `handoff` when the interaction is a short role-axis record around work the
current session already performed or directly observed.

Use Assignment when:

- another executor, provider, role, or tool performs the action;
- the result will be read by a later driver turn;
- the result needs Run/RunResult evidence;
- the interaction may fail independently;
- a read-only consult/review needs an artifact rather than a one-line summary.

`handoff` remains useful for visibility and role-holder truth. It is not enough
evidence for a Team Dispatch operation once the result influences a lifecycle
decision.

## 10. Coding-Domain Stage Protocols

### 10.1 Discovery

Discovery is machine-alone.

Allowed behavior:

- owner reads existing Work context;
- owner consults researcher helpers for evidence;
- owner logs consult interactions;
- owner chooses `clear` or `unclear`;
- `clear` can route to planning;
- `unclear` routes to exploring.

Forbidden behavior:

- asking the human directly;
- parking as `awaiting-human`;
- treating a helper's unsupported answer as proof;
- opening a new Work item just to answer a bounded evidence question.

### 10.2 Exploring

Exploring is the human-adjacent decision-locking stage.

Allowed behavior:

- advisor interaction for material, grounded, answerable product questions;
- researcher consult for repo or external facts;
- lock decisions into CONTEXT.md.

Exploring may ask a human. It should ask only after machine evidence has been
gathered and the question is self-contained.

### 10.3 Planning

Planning has two main operation families:

- `shape-plan` by implementer;
- `validate-plan` by reviewer.

The stage owner may write the plan directly, but validation should move toward
a reviewer Assignment once Step 05 adopts operation choice.

`validate-plan` is a real reviewer-role operation when dispatched through
Assignment. Prose that says validating is only an implementer function must be
reconciled before driver adoption.

### 10.4 Executing

Executing has the richest team protocol:

- implementer owns the main edit path;
- researcher may answer blast-radius or API/pattern questions;
- helper may take independent scoped work;
- reviewer may review returned diffs or candidate fixes;
- advisor handles product/scope questions that exceed locked decisions.

The implementer remains responsible for Work lifecycle. Helper/reviewer
assignments return artifacts and recommendations unless explicitly promoted to
child Work.

## 11. Coordination Operating Harness

Multi-agent implementation benefits from a durable operating harness:

```txt
trace/index.md
trace/current-cell.md
trace/<cell>.md
prompt templates
review and red-team gates
live proof capture
```

This harness is documented in
[coordination-operating-harness.md](../playbooks/coordination-operating-harness.md). It is
supporting engineering practice, not Step 07 runtime infrastructure and not a
lifecycle system. Its job is to keep coordinator, doer, reviewer, and red-team
sessions aligned while preserving token budget and proof traceability.

The harness should be used where it reduces implementation drift, but dogfooding
it is not a runtime dependency gate for standalone coordination.

## 12. Standalone Read-Only Coordination

The current mission-lite implementation is a prototype for standalone read-only
coordination. Its generalization is still under discussion in
[Step 08](step-08-standalone-coordination-protocols.md) and depends on the relevant
CoordinationSession/AdhocTask contracts from
[Step 07](step-07-coordination-session-adhoc-task.md).

A standalone session may group assignments without a Work item for read-only
coordination:

```txt
mission-lite objective
  -> researcher background brief
  -> reviewer counter-argument
  -> advisor product framing
  -> driver synthesis
```

Mission-lite currently borrows coding Stage Operations. That is prototype
behavior, not a foundation requirement. The target standalone path may instead
construct validated dynamic Assignments and may optionally select a reusable
protocol.

Rules:

- no Work lifecycle;
- no repo mutation;
- no approval/merge semantics;
- every role result is a structured artifact;
- synthesis is a report, not a state transition;
- any resulting implementation proposal becomes ordinary Work before code is
  changed.

Good first case:

```txt
Question: Should coding-domain planning validation run as a reviewer Assignment
or stay as direct same-session validation?
```

This is useful because it tests team reasoning without risking Work lifecycle
truth.

## 13. Acceptance Criteria For V1 Protocol

The protocol is ready for driver adoption when:

- every runtime assignment receives an explicit result artifact path;
- malformed or missing structured claims cannot produce `verified` or
  `reported`;
- dirty-before files cannot be counted as post-run evidence;
- read-only operations can return `reported` only through worker artifacts;
- mutating operations require post-run external evidence;
- stage skills agree on when Assignment is used versus direct invocation;
- `validate-plan` role prose is consistent across skill and task-spec docs;
- discovery remains machine-alone.
~~~~
````

### Unified diff

````diff
--- "docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-59"
+++ "docs/platform/agent-coordination/history/retired-engine/files/proposals/team-communication-protocol-v1.md#literal-snapshot"
@@ -1,7 +1,391 @@
+## Literal Snapshot
+
+~~~~text
+# Team Communication Protocol V1
+
+```txt
+Document type: Proposal
+Audience: Human reviewers, maintainers, documentation agents
+Purpose: Preserve source material for Team Communication Protocol V1
+Design status: Candidate
+Implementation: Not re-verified; source implementation statements remain in the body
+Provenance: Retained from docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md at fcfe78cb89585bc9ab23f11bab67d41458834fc4
+Writer type: Documentation maintainer
+Canonical for: Preserved proposal material for Team Communication Protocol V1; no authority cutover
+Use this when: Comparing this candidate with its pinned legacy source
+Do not use this for: Inferring current implementation or supersession of retained sources
+Last reviewed: UNPROVEN; independent content review pending
+Related:
+- docs/platform/agent-coordination/vision.md
+- docs/platform/agent-coordination/playbooks/coordination-operating-harness.md
+- docs/platform/agent-coordination/proposals/step-08-standalone-coordination-protocols.md
+Supersedes: None; retained source authority is unchanged
+Superseded by: None
+Added in candidate: Promotion metadata only; source claims and implementation are not re-decided here
+```
+Document type: Proposal
+Design status: Proposed
+Implementation: Partial
+Last reviewed: 2026-08-31
+Canonical for: nothing until communication contracts are accepted
+Original date: 2026-08-28
+Scope: role-to-role communication inside coding-domain stage protocols, Work-attached assignments, RunResult evidence, and standalone read-only coordination
+
+## 1. Purpose
+
+Team Dispatch V1 needs a communication protocol, but it must stay smaller than
+a mailbox, daemon, or second lifecycle system.
+
+This proposal describes a Work-attached coding-domain protocol and one early
+standalone prototype. It is not the universal entry model for Agent
+Coordination. Per the [Agent Coordination Foundation Vision](../vision.md), an
+agent-led session may coordinate through validated dynamic execution contracts
+without a predeclared Workflow/Stage graph.
+
+The protocol defines how roles communicate while `Work` remains the lifecycle
+authority:
+
+```txt
+Work position
+  -> current workflow stage
+    -> legal stage operations
+      -> selected Assignment
+        -> one Run
+          -> one RunResult
+            -> driver chooses the next legal operation or engine verb
+```
+
+The protocol is not a meeting scheduler. It is the set of rules that make one
+role's message usable by another role without trusting terminal text or agent
+say-so as proof.
+
+## 2. Non-Negotiable Boundaries
+
+```txt
+Work is lifecycle authority.
+Mission is a lightweight team envelope.
+Stage is workflow position.
+Stage Operation is one legal task-shaped action inside a stage.
+Assignment is a semantic request.
+Run is a runtime attempt.
+RunResult is normalized result plus evidence.
+Herdr is visibility only.
+```
+
+Do not introduce `Job` in V1. `Job` remains reserved for a future queue,
+scheduler, lease, cancellation, or worker-pool design.
+
+Do not let an Assignment mutate Work lifecycle state by itself. Work moves only
+through existing engine verbs such as `fgos discover`, `fgos plan`, `fgos
+return`, `fgos ask`, `fgos answer`, and approval/merge verbs.
+
+## 3. Roles
+
+The coding domain starts with the roles already declared in the role graph:
+
+| Role | Responsibility | Typical operation family |
+|---|---|---|
+| `implementer` | Owns the current Work item, edits repo state, invokes engine verbs, and coordinates legal sub-calls. | `judge-ambiguity`, `shape-plan`, `implement-item`, `fix-verify-red` |
+| `researcher` | Gathers evidence and facts. It may read repo context, run approved research tools, or inspect docs. | `resolve-question`, `scout-blast-radius` |
+| `reviewer` | Finds correctness, feasibility, regression, and test risks. | `validate-plan`, `review-item` |
+| `helper` | Performs an independent scoped piece whose footprint does not collide with the driver's active edit surface. | `scoped-subtask` |
+| `advisor` | Answers product, scope, priority, or human-intent questions that cannot be settled from machine evidence. | `answer-question`, selected `advise` interactions |
+
+Role is not executor. A reviewer can run on Codex, Claude, agy, pi, or a future
+executor if policy and governance allow it.
+
+Role is not stage owner. A stage owner may dispatch an Assignment to another
+role while the Work item stays at the same stage.
+
+## 4. Communication Modes
+
+The role graph's `mode` field has protocol meaning:
+
+| Mode | Meaning | Lifecycle effect | Required evidence |
+|---|---|---|---|
+| `sync` | Caller waits for a bounded finding or work product, then continues in the same stage. | Work usually stays claimed by the caller; holder may be logged but returns immediately. | Structured result artifact for read-only calls; git/artifact delta for mutating helper work. |
+| `async` | Caller cannot continue without another actor or human-adjacent answer. | Work may park, or holder may move until a future reclaim. | A recorded question, answer, review verdict, or blocker with context refs. |
+
+`sync` does not mean invisible. It still needs a recorded handoff or Assignment
+RunResult when the result matters to later decisions.
+
+`async` does not mean a new Work item. It becomes Work only when the request
+needs independent lifecycle, approval, merge, or backlog visibility.
+
+## 5. Stage Operation Selection
+
+The driver may choose only operations declared for the current stage by
+`operationsForStage(domain, stage, { kind })`.
+
+Selection rules:
+
+1. Prefer the primary operation when the stage's normal owner work remains the
+   next required action.
+2. Choose a secondary operation when a bounded role contribution would unblock
+   the stage without creating lifecycle-bearing child work.
+3. Create child Work only when the contribution needs its own claim, branch,
+   verify, approval, merge, or backlog visibility.
+4. Route discovery unresolved ambiguity to `exploring`; discovery must not ask
+   the human directly.
+5. Refuse operations marked `dispatch: human-only` from cli-spawn assignment
+   execution.
+6. Refuse synthetic compatibility operations from runtime dispatch unless their
+   task-spec file resolves and the caller explicitly accepts compatibility
+   dispatch.
+
+Examples:
+
+| Stage | Situation | Operation |
+|---|---|---|
+| `discovery` | Need machine evidence for ambiguity. | `resolve-question` to `researcher`, then owner decides `clear` or `unclear`. |
+| `planning` | Plan is written and needs proof before the edge to executing. | `validate-plan` to `reviewer`. |
+| `planning` | A symbol's blast radius is unknown. | `scout-blast-radius` to `researcher`. |
+| `executing` | Implementation needs a separate non-overlapping edit. | `scoped-subtask` to `helper`. |
+| `executing` | Returned diff needs independent review. | `review-item` to `reviewer`. |
+| `executing` | Review or verify reports a concrete red issue. | `fix-verify-red` to `implementer`. |
+
+## 6. Assignment Message Contract
+
+Every assignment prompt must provide the worker with enough information to
+produce a usable result without learning fgOS internals.
+
+Required prompt fields:
+
+```txt
+Assignment: <assignmentId>
+Work: <workId or (none)>
+Stage operation: <stage>.<operation>
+Role: <role>
+Task-spec: <task-spec path>
+Objective: <bounded request>
+Context refs:
+- <ref>
+Expected outputs:
+- <output>
+Result artifact:
+- Write JSON to <runDir>/agent-result.json
+- Optionally write Markdown to <runDir>/agent-report.md
+```
+
+The prompt must say that the worker should not call Work lifecycle verbs unless
+the task-spec explicitly says the worker is the lifecycle driver. Ordinary
+Assignment workers return artifacts; the driver interprets them.
+
+The prompt must pass refs, not embedded large docs, diffs, transcripts, or
+secrets.
+
+## 7. Agent Result Schema
+
+`agent-result.json` is the worker's structured claim. It is not proof by
+itself.
+
+Minimal schema:
+
+```json
+{
+  "status": "done",
+  "summary": "One concise result sentence.",
+  "findings": [],
+  "evidenceRefs": [],
+  "nextRecommendedOperation": null
+}
+```
+
+Allowed status values:
+
+| Status | Meaning |
+|---|---|
+| `done` | The worker believes the assignment objective is complete. |
+| `blocked` | The worker could not complete because a named blocker remains. |
+| `failed` | The worker attempted the assignment and produced an error or invalid output. |
+| `no-evidence` | The worker can report context but cannot support a completion claim. |
+
+Required fields by status:
+
+| Status | Required fields |
+|---|---|
+| `done` | `summary`; at least one `evidenceRefs` entry or a companion `agent-report.md` for read-only work; external git/artifact evidence for mutating work. |
+| `blocked` | `summary`; `blocker`; `evidenceRefs` when any evidence exists. |
+| `failed` | `summary`; `error`. |
+| `no-evidence` | `summary`; reason why evidence is absent. |
+
+Optional `nextRecommendedOperation` may name another legal stage operation, but
+it is only a recommendation. The driver must verify legality before acting.
+
+## 8. RunResult Confidence
+
+RunResult status and confidence are control-plane judgments.
+
+Confidence ladder:
+
+| Confidence | Meaning | Allowed use |
+|---|---|---|
+| `verified` | Structured claim plus post-run external evidence such as a new commit, new changed file, test artifact, or verified result file. | May feed lifecycle decisions that require proof. |
+| `reported` | Structured claim plus a worker-produced report for read-only consult/review work. | May feed driver judgment, but should not close mutating work. |
+| `inferred` | Post-run external evidence exists but no structured claim exists. | May be surfaced for inspection; driver should avoid automatic lifecycle movement. |
+| `no-evidence` | Process settled without proof. | Must not advance Work. |
+| `failed` | Timeout, nonzero exit, signal, invalid schema, or explicit failure. | Must not advance Work. |
+
+The driver must treat `done/no-evidence` as not done. It may retry, ask for a
+proper artifact, or route to a different legal operation.
+
+## 9. Handoff Versus Assignment
+
+Use `handoff` when the interaction is a short role-axis record around work the
+current session already performed or directly observed.
+
+Use Assignment when:
+
+- another executor, provider, role, or tool performs the action;
+- the result will be read by a later driver turn;
+- the result needs Run/RunResult evidence;
+- the interaction may fail independently;
+- a read-only consult/review needs an artifact rather than a one-line summary.
+
+`handoff` remains useful for visibility and role-holder truth. It is not enough
+evidence for a Team Dispatch operation once the result influences a lifecycle
+decision.
+
+## 10. Coding-Domain Stage Protocols
+
+### 10.1 Discovery
+
+Discovery is machine-alone.
+
+Allowed behavior:
+
+- owner reads existing Work context;
+- owner consults researcher helpers for evidence;
+- owner logs consult interactions;
+- owner chooses `clear` or `unclear`;
+- `clear` can route to planning;
+- `unclear` routes to exploring.
+
+Forbidden behavior:
+
+- asking the human directly;
+- parking as `awaiting-human`;
+- treating a helper's unsupported answer as proof;
+- opening a new Work item just to answer a bounded evidence question.
+
+### 10.2 Exploring
+
+Exploring is the human-adjacent decision-locking stage.
+
+Allowed behavior:
+
+- advisor interaction for material, grounded, answerable product questions;
+- researcher consult for repo or external facts;
+- lock decisions into CONTEXT.md.
+
+Exploring may ask a human. It should ask only after machine evidence has been
+gathered and the question is self-contained.
+
+### 10.3 Planning
+
+Planning has two main operation families:
+
+- `shape-plan` by implementer;
+- `validate-plan` by reviewer.
+
+The stage owner may write the plan directly, but validation should move toward
+a reviewer Assignment once Step 05 adopts operation choice.
+
+`validate-plan` is a real reviewer-role operation when dispatched through
+Assignment. Prose that says validating is only an implementer function must be
+reconciled before driver adoption.
+
+### 10.4 Executing
+
+Executing has the richest team protocol:
+
+- implementer owns the main edit path;
+- researcher may answer blast-radius or API/pattern questions;
+- helper may take independent scoped work;
+- reviewer may review returned diffs or candidate fixes;
+- advisor handles product/scope questions that exceed locked decisions.
+
+The implementer remains responsible for Work lifecycle. Helper/reviewer
+assignments return artifacts and recommendations unless explicitly promoted to
+child Work.
+
+## 11. Coordination Operating Harness
+
+Multi-agent implementation benefits from a durable operating harness:
+
+```txt
+trace/index.md
+trace/current-cell.md
+trace/<cell>.md
+prompt templates
+review and red-team gates
+live proof capture
+```
+
+This harness is documented in
+[coordination-operating-harness.md](../playbooks/coordination-operating-harness.md). It is
+supporting engineering practice, not Step 07 runtime infrastructure and not a
+lifecycle system. Its job is to keep coordinator, doer, reviewer, and red-team
+sessions aligned while preserving token budget and proof traceability.
+
+The harness should be used where it reduces implementation drift, but dogfooding
+it is not a runtime dependency gate for standalone coordination.
+
+## 12. Standalone Read-Only Coordination
+
+The current mission-lite implementation is a prototype for standalone read-only
+coordination. Its generalization is still under discussion in
+[Step 08](step-08-standalone-coordination-protocols.md) and depends on the relevant
+CoordinationSession/AdhocTask contracts from
+[Step 07](step-07-coordination-session-adhoc-task.md).
+
+A standalone session may group assignments without a Work item for read-only
+coordination:
+
 ```txt
 mission-lite objective
   -> researcher background brief
   -> reviewer counter-argument
   -> advisor product framing
   -> driver synthesis
-```
\ No newline at end of file
+```
+
+Mission-lite currently borrows coding Stage Operations. That is prototype
+behavior, not a foundation requirement. The target standalone path may instead
+construct validated dynamic Assignments and may optionally select a reusable
+protocol.
+
+Rules:
+
+- no Work lifecycle;
+- no repo mutation;
+- no approval/merge semantics;
+- every role result is a structured artifact;
+- synthesis is a report, not a state transition;
+- any resulting implementation proposal becomes ordinary Work before code is
+  changed.
+
+Good first case:
+
+```txt
+Question: Should coding-domain planning validation run as a reviewer Assignment
+or stay as direct same-session validation?
+```
+
+This is useful because it tests team reasoning without risking Work lifecycle
+truth.
+
+## 13. Acceptance Criteria For V1 Protocol
+
+The protocol is ready for driver adoption when:
+
+- every runtime assignment receives an explicit result artifact path;
+- malformed or missing structured claims cannot produce `verified` or
+  `reported`;
+- dirty-before files cannot be counted as post-run evidence;
+- read-only operations can return `reported` only through worker artifacts;
+- mutating operations require post-run external evidence;
+- stage skills agree on when Assignment is used versus direct invocation;
+- `validate-plan` role prose is consistent across skill and task-spec docs;
+- discovery remains machine-alone.
+~~~~
\ No newline at end of file
````

## claim_697e8c7f2f13751e84b7f9b3be93954f

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-60

Target: docs/platform/agent-coordination/history/retired-engine/files/proposals/team-communication-protocol-v1.md#literal-snapshot

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_697e8c7f2f13751e84b7f9b3be93954f |
| sourceUnitDigest | 92433fb950ddd9f0043f0f377855b12bb4dcb1891f315e5c3edc518085dc2174 |
| claimKind | contract |
| disposition | move |
| rationale | This particular legacy unit docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-60 is retained verbatim inside docs/platform/agent-coordination/history/retired-engine/files/proposals/team-communication-protocol-v1.md#literal-snapshot as the dated pre-rework statement, not as an assertion that the whole surviving file is retired. The current version of docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md distinguishes present runtime behaviour/design obligations from the original session-only, obsolete interface or dated implementation wording. Retirement 2180b4e72 applies only to session-engine portions; live guidance is restored at its current path and receives a separate independent check. No old approval carries to this corrected unit-specific explanation. |
| targetOwner | docs/platform/agent-coordination/history/retired-engine/files/proposals/team-communication-protocol-v1.md |
| targetAnchor | literal-snapshot |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | c3a4d458bb1581e2f7b65a4b653037ba1866eb3ac0ee69dd189c0de195a97578 |
| targetAncestry | \["Historical File: Team Communication Protocol V1"\] |

### Source unit

```text
Mission-lite currently borrows coding Stage Operations. That is prototype
behavior, not a foundation requirement. The target standalone path may instead
construct validated dynamic Assignments and may optionally select a reusable
protocol.
```

### Target unit

````text
## Literal Snapshot

~~~~text
# Team Communication Protocol V1

```txt
Document type: Proposal
Audience: Human reviewers, maintainers, documentation agents
Purpose: Preserve source material for Team Communication Protocol V1
Design status: Candidate
Implementation: Not re-verified; source implementation statements remain in the body
Provenance: Retained from docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md at fcfe78cb89585bc9ab23f11bab67d41458834fc4
Writer type: Documentation maintainer
Canonical for: Preserved proposal material for Team Communication Protocol V1; no authority cutover
Use this when: Comparing this candidate with its pinned legacy source
Do not use this for: Inferring current implementation or supersession of retained sources
Last reviewed: UNPROVEN; independent content review pending
Related:
- docs/platform/agent-coordination/vision.md
- docs/platform/agent-coordination/playbooks/coordination-operating-harness.md
- docs/platform/agent-coordination/proposals/step-08-standalone-coordination-protocols.md
Supersedes: None; retained source authority is unchanged
Superseded by: None
Added in candidate: Promotion metadata only; source claims and implementation are not re-decided here
```
Document type: Proposal
Design status: Proposed
Implementation: Partial
Last reviewed: 2026-08-31
Canonical for: nothing until communication contracts are accepted
Original date: 2026-08-28
Scope: role-to-role communication inside coding-domain stage protocols, Work-attached assignments, RunResult evidence, and standalone read-only coordination

## 1. Purpose

Team Dispatch V1 needs a communication protocol, but it must stay smaller than
a mailbox, daemon, or second lifecycle system.

This proposal describes a Work-attached coding-domain protocol and one early
standalone prototype. It is not the universal entry model for Agent
Coordination. Per the [Agent Coordination Foundation Vision](../vision.md), an
agent-led session may coordinate through validated dynamic execution contracts
without a predeclared Workflow/Stage graph.

The protocol defines how roles communicate while `Work` remains the lifecycle
authority:

```txt
Work position
  -> current workflow stage
    -> legal stage operations
      -> selected Assignment
        -> one Run
          -> one RunResult
            -> driver chooses the next legal operation or engine verb
```

The protocol is not a meeting scheduler. It is the set of rules that make one
role's message usable by another role without trusting terminal text or agent
say-so as proof.

## 2. Non-Negotiable Boundaries

```txt
Work is lifecycle authority.
Mission is a lightweight team envelope.
Stage is workflow position.
Stage Operation is one legal task-shaped action inside a stage.
Assignment is a semantic request.
Run is a runtime attempt.
RunResult is normalized result plus evidence.
Herdr is visibility only.
```

Do not introduce `Job` in V1. `Job` remains reserved for a future queue,
scheduler, lease, cancellation, or worker-pool design.

Do not let an Assignment mutate Work lifecycle state by itself. Work moves only
through existing engine verbs such as `fgos discover`, `fgos plan`, `fgos
return`, `fgos ask`, `fgos answer`, and approval/merge verbs.

## 3. Roles

The coding domain starts with the roles already declared in the role graph:

| Role | Responsibility | Typical operation family |
|---|---|---|
| `implementer` | Owns the current Work item, edits repo state, invokes engine verbs, and coordinates legal sub-calls. | `judge-ambiguity`, `shape-plan`, `implement-item`, `fix-verify-red` |
| `researcher` | Gathers evidence and facts. It may read repo context, run approved research tools, or inspect docs. | `resolve-question`, `scout-blast-radius` |
| `reviewer` | Finds correctness, feasibility, regression, and test risks. | `validate-plan`, `review-item` |
| `helper` | Performs an independent scoped piece whose footprint does not collide with the driver's active edit surface. | `scoped-subtask` |
| `advisor` | Answers product, scope, priority, or human-intent questions that cannot be settled from machine evidence. | `answer-question`, selected `advise` interactions |

Role is not executor. A reviewer can run on Codex, Claude, agy, pi, or a future
executor if policy and governance allow it.

Role is not stage owner. A stage owner may dispatch an Assignment to another
role while the Work item stays at the same stage.

## 4. Communication Modes

The role graph's `mode` field has protocol meaning:

| Mode | Meaning | Lifecycle effect | Required evidence |
|---|---|---|---|
| `sync` | Caller waits for a bounded finding or work product, then continues in the same stage. | Work usually stays claimed by the caller; holder may be logged but returns immediately. | Structured result artifact for read-only calls; git/artifact delta for mutating helper work. |
| `async` | Caller cannot continue without another actor or human-adjacent answer. | Work may park, or holder may move until a future reclaim. | A recorded question, answer, review verdict, or blocker with context refs. |

`sync` does not mean invisible. It still needs a recorded handoff or Assignment
RunResult when the result matters to later decisions.

`async` does not mean a new Work item. It becomes Work only when the request
needs independent lifecycle, approval, merge, or backlog visibility.

## 5. Stage Operation Selection

The driver may choose only operations declared for the current stage by
`operationsForStage(domain, stage, { kind })`.

Selection rules:

1. Prefer the primary operation when the stage's normal owner work remains the
   next required action.
2. Choose a secondary operation when a bounded role contribution would unblock
   the stage without creating lifecycle-bearing child work.
3. Create child Work only when the contribution needs its own claim, branch,
   verify, approval, merge, or backlog visibility.
4. Route discovery unresolved ambiguity to `exploring`; discovery must not ask
   the human directly.
5. Refuse operations marked `dispatch: human-only` from cli-spawn assignment
   execution.
6. Refuse synthetic compatibility operations from runtime dispatch unless their
   task-spec file resolves and the caller explicitly accepts compatibility
   dispatch.

Examples:

| Stage | Situation | Operation |
|---|---|---|
| `discovery` | Need machine evidence for ambiguity. | `resolve-question` to `researcher`, then owner decides `clear` or `unclear`. |
| `planning` | Plan is written and needs proof before the edge to executing. | `validate-plan` to `reviewer`. |
| `planning` | A symbol's blast radius is unknown. | `scout-blast-radius` to `researcher`. |
| `executing` | Implementation needs a separate non-overlapping edit. | `scoped-subtask` to `helper`. |
| `executing` | Returned diff needs independent review. | `review-item` to `reviewer`. |
| `executing` | Review or verify reports a concrete red issue. | `fix-verify-red` to `implementer`. |

## 6. Assignment Message Contract

Every assignment prompt must provide the worker with enough information to
produce a usable result without learning fgOS internals.

Required prompt fields:

```txt
Assignment: <assignmentId>
Work: <workId or (none)>
Stage operation: <stage>.<operation>
Role: <role>
Task-spec: <task-spec path>
Objective: <bounded request>
Context refs:
- <ref>
Expected outputs:
- <output>
Result artifact:
- Write JSON to <runDir>/agent-result.json
- Optionally write Markdown to <runDir>/agent-report.md
```

The prompt must say that the worker should not call Work lifecycle verbs unless
the task-spec explicitly says the worker is the lifecycle driver. Ordinary
Assignment workers return artifacts; the driver interprets them.

The prompt must pass refs, not embedded large docs, diffs, transcripts, or
secrets.

## 7. Agent Result Schema

`agent-result.json` is the worker's structured claim. It is not proof by
itself.

Minimal schema:

```json
{
  "status": "done",
  "summary": "One concise result sentence.",
  "findings": [],
  "evidenceRefs": [],
  "nextRecommendedOperation": null
}
```

Allowed status values:

| Status | Meaning |
|---|---|
| `done` | The worker believes the assignment objective is complete. |
| `blocked` | The worker could not complete because a named blocker remains. |
| `failed` | The worker attempted the assignment and produced an error or invalid output. |
| `no-evidence` | The worker can report context but cannot support a completion claim. |

Required fields by status:

| Status | Required fields |
|---|---|
| `done` | `summary`; at least one `evidenceRefs` entry or a companion `agent-report.md` for read-only work; external git/artifact evidence for mutating work. |
| `blocked` | `summary`; `blocker`; `evidenceRefs` when any evidence exists. |
| `failed` | `summary`; `error`. |
| `no-evidence` | `summary`; reason why evidence is absent. |

Optional `nextRecommendedOperation` may name another legal stage operation, but
it is only a recommendation. The driver must verify legality before acting.

## 8. RunResult Confidence

RunResult status and confidence are control-plane judgments.

Confidence ladder:

| Confidence | Meaning | Allowed use |
|---|---|---|
| `verified` | Structured claim plus post-run external evidence such as a new commit, new changed file, test artifact, or verified result file. | May feed lifecycle decisions that require proof. |
| `reported` | Structured claim plus a worker-produced report for read-only consult/review work. | May feed driver judgment, but should not close mutating work. |
| `inferred` | Post-run external evidence exists but no structured claim exists. | May be surfaced for inspection; driver should avoid automatic lifecycle movement. |
| `no-evidence` | Process settled without proof. | Must not advance Work. |
| `failed` | Timeout, nonzero exit, signal, invalid schema, or explicit failure. | Must not advance Work. |

The driver must treat `done/no-evidence` as not done. It may retry, ask for a
proper artifact, or route to a different legal operation.

## 9. Handoff Versus Assignment

Use `handoff` when the interaction is a short role-axis record around work the
current session already performed or directly observed.

Use Assignment when:

- another executor, provider, role, or tool performs the action;
- the result will be read by a later driver turn;
- the result needs Run/RunResult evidence;
- the interaction may fail independently;
- a read-only consult/review needs an artifact rather than a one-line summary.

`handoff` remains useful for visibility and role-holder truth. It is not enough
evidence for a Team Dispatch operation once the result influences a lifecycle
decision.

## 10. Coding-Domain Stage Protocols

### 10.1 Discovery

Discovery is machine-alone.

Allowed behavior:

- owner reads existing Work context;
- owner consults researcher helpers for evidence;
- owner logs consult interactions;
- owner chooses `clear` or `unclear`;
- `clear` can route to planning;
- `unclear` routes to exploring.

Forbidden behavior:

- asking the human directly;
- parking as `awaiting-human`;
- treating a helper's unsupported answer as proof;
- opening a new Work item just to answer a bounded evidence question.

### 10.2 Exploring

Exploring is the human-adjacent decision-locking stage.

Allowed behavior:

- advisor interaction for material, grounded, answerable product questions;
- researcher consult for repo or external facts;
- lock decisions into CONTEXT.md.

Exploring may ask a human. It should ask only after machine evidence has been
gathered and the question is self-contained.

### 10.3 Planning

Planning has two main operation families:

- `shape-plan` by implementer;
- `validate-plan` by reviewer.

The stage owner may write the plan directly, but validation should move toward
a reviewer Assignment once Step 05 adopts operation choice.

`validate-plan` is a real reviewer-role operation when dispatched through
Assignment. Prose that says validating is only an implementer function must be
reconciled before driver adoption.

### 10.4 Executing

Executing has the richest team protocol:

- implementer owns the main edit path;
- researcher may answer blast-radius or API/pattern questions;
- helper may take independent scoped work;
- reviewer may review returned diffs or candidate fixes;
- advisor handles product/scope questions that exceed locked decisions.

The implementer remains responsible for Work lifecycle. Helper/reviewer
assignments return artifacts and recommendations unless explicitly promoted to
child Work.

## 11. Coordination Operating Harness

Multi-agent implementation benefits from a durable operating harness:

```txt
trace/index.md
trace/current-cell.md
trace/<cell>.md
prompt templates
review and red-team gates
live proof capture
```

This harness is documented in
[coordination-operating-harness.md](../playbooks/coordination-operating-harness.md). It is
supporting engineering practice, not Step 07 runtime infrastructure and not a
lifecycle system. Its job is to keep coordinator, doer, reviewer, and red-team
sessions aligned while preserving token budget and proof traceability.

The harness should be used where it reduces implementation drift, but dogfooding
it is not a runtime dependency gate for standalone coordination.

## 12. Standalone Read-Only Coordination

The current mission-lite implementation is a prototype for standalone read-only
coordination. Its generalization is still under discussion in
[Step 08](step-08-standalone-coordination-protocols.md) and depends on the relevant
CoordinationSession/AdhocTask contracts from
[Step 07](step-07-coordination-session-adhoc-task.md).

A standalone session may group assignments without a Work item for read-only
coordination:

```txt
mission-lite objective
  -> researcher background brief
  -> reviewer counter-argument
  -> advisor product framing
  -> driver synthesis
```

Mission-lite currently borrows coding Stage Operations. That is prototype
behavior, not a foundation requirement. The target standalone path may instead
construct validated dynamic Assignments and may optionally select a reusable
protocol.

Rules:

- no Work lifecycle;
- no repo mutation;
- no approval/merge semantics;
- every role result is a structured artifact;
- synthesis is a report, not a state transition;
- any resulting implementation proposal becomes ordinary Work before code is
  changed.

Good first case:

```txt
Question: Should coding-domain planning validation run as a reviewer Assignment
or stay as direct same-session validation?
```

This is useful because it tests team reasoning without risking Work lifecycle
truth.

## 13. Acceptance Criteria For V1 Protocol

The protocol is ready for driver adoption when:

- every runtime assignment receives an explicit result artifact path;
- malformed or missing structured claims cannot produce `verified` or
  `reported`;
- dirty-before files cannot be counted as post-run evidence;
- read-only operations can return `reported` only through worker artifacts;
- mutating operations require post-run external evidence;
- stage skills agree on when Assignment is used versus direct invocation;
- `validate-plan` role prose is consistent across skill and task-spec docs;
- discovery remains machine-alone.
~~~~
````

### Unified diff

````diff
--- "docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-60"
+++ "docs/platform/agent-coordination/history/retired-engine/files/proposals/team-communication-protocol-v1.md#literal-snapshot"
@@ -1,4 +1,391 @@
+## Literal Snapshot
+
+~~~~text
+# Team Communication Protocol V1
+
+```txt
+Document type: Proposal
+Audience: Human reviewers, maintainers, documentation agents
+Purpose: Preserve source material for Team Communication Protocol V1
+Design status: Candidate
+Implementation: Not re-verified; source implementation statements remain in the body
+Provenance: Retained from docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md at fcfe78cb89585bc9ab23f11bab67d41458834fc4
+Writer type: Documentation maintainer
+Canonical for: Preserved proposal material for Team Communication Protocol V1; no authority cutover
+Use this when: Comparing this candidate with its pinned legacy source
+Do not use this for: Inferring current implementation or supersession of retained sources
+Last reviewed: UNPROVEN; independent content review pending
+Related:
+- docs/platform/agent-coordination/vision.md
+- docs/platform/agent-coordination/playbooks/coordination-operating-harness.md
+- docs/platform/agent-coordination/proposals/step-08-standalone-coordination-protocols.md
+Supersedes: None; retained source authority is unchanged
+Superseded by: None
+Added in candidate: Promotion metadata only; source claims and implementation are not re-decided here
+```
+Document type: Proposal
+Design status: Proposed
+Implementation: Partial
+Last reviewed: 2026-08-31
+Canonical for: nothing until communication contracts are accepted
+Original date: 2026-08-28
+Scope: role-to-role communication inside coding-domain stage protocols, Work-attached assignments, RunResult evidence, and standalone read-only coordination
+
+## 1. Purpose
+
+Team Dispatch V1 needs a communication protocol, but it must stay smaller than
+a mailbox, daemon, or second lifecycle system.
+
+This proposal describes a Work-attached coding-domain protocol and one early
+standalone prototype. It is not the universal entry model for Agent
+Coordination. Per the [Agent Coordination Foundation Vision](../vision.md), an
+agent-led session may coordinate through validated dynamic execution contracts
+without a predeclared Workflow/Stage graph.
+
+The protocol defines how roles communicate while `Work` remains the lifecycle
+authority:
+
+```txt
+Work position
+  -> current workflow stage
+    -> legal stage operations
+      -> selected Assignment
+        -> one Run
+          -> one RunResult
+            -> driver chooses the next legal operation or engine verb
+```
+
+The protocol is not a meeting scheduler. It is the set of rules that make one
+role's message usable by another role without trusting terminal text or agent
+say-so as proof.
+
+## 2. Non-Negotiable Boundaries
+
+```txt
+Work is lifecycle authority.
+Mission is a lightweight team envelope.
+Stage is workflow position.
+Stage Operation is one legal task-shaped action inside a stage.
+Assignment is a semantic request.
+Run is a runtime attempt.
+RunResult is normalized result plus evidence.
+Herdr is visibility only.
+```
+
+Do not introduce `Job` in V1. `Job` remains reserved for a future queue,
+scheduler, lease, cancellation, or worker-pool design.
+
+Do not let an Assignment mutate Work lifecycle state by itself. Work moves only
+through existing engine verbs such as `fgos discover`, `fgos plan`, `fgos
+return`, `fgos ask`, `fgos answer`, and approval/merge verbs.
+
+## 3. Roles
+
+The coding domain starts with the roles already declared in the role graph:
+
+| Role | Responsibility | Typical operation family |
+|---|---|---|
+| `implementer` | Owns the current Work item, edits repo state, invokes engine verbs, and coordinates legal sub-calls. | `judge-ambiguity`, `shape-plan`, `implement-item`, `fix-verify-red` |
+| `researcher` | Gathers evidence and facts. It may read repo context, run approved research tools, or inspect docs. | `resolve-question`, `scout-blast-radius` |
+| `reviewer` | Finds correctness, feasibility, regression, and test risks. | `validate-plan`, `review-item` |
+| `helper` | Performs an independent scoped piece whose footprint does not collide with the driver's active edit surface. | `scoped-subtask` |
+| `advisor` | Answers product, scope, priority, or human-intent questions that cannot be settled from machine evidence. | `answer-question`, selected `advise` interactions |
+
+Role is not executor. A reviewer can run on Codex, Claude, agy, pi, or a future
+executor if policy and governance allow it.
+
+Role is not stage owner. A stage owner may dispatch an Assignment to another
+role while the Work item stays at the same stage.
+
+## 4. Communication Modes
+
+The role graph's `mode` field has protocol meaning:
+
+| Mode | Meaning | Lifecycle effect | Required evidence |
+|---|---|---|---|
+| `sync` | Caller waits for a bounded finding or work product, then continues in the same stage. | Work usually stays claimed by the caller; holder may be logged but returns immediately. | Structured result artifact for read-only calls; git/artifact delta for mutating helper work. |
+| `async` | Caller cannot continue without another actor or human-adjacent answer. | Work may park, or holder may move until a future reclaim. | A recorded question, answer, review verdict, or blocker with context refs. |
+
+`sync` does not mean invisible. It still needs a recorded handoff or Assignment
+RunResult when the result matters to later decisions.
+
+`async` does not mean a new Work item. It becomes Work only when the request
+needs independent lifecycle, approval, merge, or backlog visibility.
+
+## 5. Stage Operation Selection
+
+The driver may choose only operations declared for the current stage by
+`operationsForStage(domain, stage, { kind })`.
+
+Selection rules:
+
+1. Prefer the primary operation when the stage's normal owner work remains the
+   next required action.
+2. Choose a secondary operation when a bounded role contribution would unblock
+   the stage without creating lifecycle-bearing child work.
+3. Create child Work only when the contribution needs its own claim, branch,
+   verify, approval, merge, or backlog visibility.
+4. Route discovery unresolved ambiguity to `exploring`; discovery must not ask
+   the human directly.
+5. Refuse operations marked `dispatch: human-only` from cli-spawn assignment
+   execution.
+6. Refuse synthetic compatibility operations from runtime dispatch unless their
+   task-spec file resolves and the caller explicitly accepts compatibility
+   dispatch.
+
+Examples:
+
+| Stage | Situation | Operation |
+|---|---|---|
+| `discovery` | Need machine evidence for ambiguity. | `resolve-question` to `researcher`, then owner decides `clear` or `unclear`. |
+| `planning` | Plan is written and needs proof before the edge to executing. | `validate-plan` to `reviewer`. |
+| `planning` | A symbol's blast radius is unknown. | `scout-blast-radius` to `researcher`. |
+| `executing` | Implementation needs a separate non-overlapping edit. | `scoped-subtask` to `helper`. |
+| `executing` | Returned diff needs independent review. | `review-item` to `reviewer`. |
+| `executing` | Review or verify reports a concrete red issue. | `fix-verify-red` to `implementer`. |
+
+## 6. Assignment Message Contract
+
+Every assignment prompt must provide the worker with enough information to
+produce a usable result without learning fgOS internals.
+
+Required prompt fields:
+
+```txt
+Assignment: <assignmentId>
+Work: <workId or (none)>
+Stage operation: <stage>.<operation>
+Role: <role>
+Task-spec: <task-spec path>
+Objective: <bounded request>
+Context refs:
+- <ref>
+Expected outputs:
+- <output>
+Result artifact:
+- Write JSON to <runDir>/agent-result.json
+- Optionally write Markdown to <runDir>/agent-report.md
+```
+
+The prompt must say that the worker should not call Work lifecycle verbs unless
+the task-spec explicitly says the worker is the lifecycle driver. Ordinary
+Assignment workers return artifacts; the driver interprets them.
+
+The prompt must pass refs, not embedded large docs, diffs, transcripts, or
+secrets.
+
+## 7. Agent Result Schema
+
+`agent-result.json` is the worker's structured claim. It is not proof by
+itself.
+
+Minimal schema:
+
+```json
+{
+  "status": "done",
+  "summary": "One concise result sentence.",
+  "findings": [],
+  "evidenceRefs": [],
+  "nextRecommendedOperation": null
+}
+```
+
+Allowed status values:
+
+| Status | Meaning |
+|---|---|
+| `done` | The worker believes the assignment objective is complete. |
+| `blocked` | The worker could not complete because a named blocker remains. |
+| `failed` | The worker attempted the assignment and produced an error or invalid output. |
+| `no-evidence` | The worker can report context but cannot support a completion claim. |
+
+Required fields by status:
+
+| Status | Required fields |
+|---|---|
+| `done` | `summary`; at least one `evidenceRefs` entry or a companion `agent-report.md` for read-only work; external git/artifact evidence for mutating work. |
+| `blocked` | `summary`; `blocker`; `evidenceRefs` when any evidence exists. |
+| `failed` | `summary`; `error`. |
+| `no-evidence` | `summary`; reason why evidence is absent. |
+
+Optional `nextRecommendedOperation` may name another legal stage operation, but
+it is only a recommendation. The driver must verify legality before acting.
+
+## 8. RunResult Confidence
+
+RunResult status and confidence are control-plane judgments.
+
+Confidence ladder:
+
+| Confidence | Meaning | Allowed use |
+|---|---|---|
+| `verified` | Structured claim plus post-run external evidence such as a new commit, new changed file, test artifact, or verified result file. | May feed lifecycle decisions that require proof. |
+| `reported` | Structured claim plus a worker-produced report for read-only consult/review work. | May feed driver judgment, but should not close mutating work. |
+| `inferred` | Post-run external evidence exists but no structured claim exists. | May be surfaced for inspection; driver should avoid automatic lifecycle movement. |
+| `no-evidence` | Process settled without proof. | Must not advance Work. |
+| `failed` | Timeout, nonzero exit, signal, invalid schema, or explicit failure. | Must not advance Work. |
+
+The driver must treat `done/no-evidence` as not done. It may retry, ask for a
+proper artifact, or route to a different legal operation.
+
+## 9. Handoff Versus Assignment
+
+Use `handoff` when the interaction is a short role-axis record around work the
+current session already performed or directly observed.
+
+Use Assignment when:
+
+- another executor, provider, role, or tool performs the action;
+- the result will be read by a later driver turn;
+- the result needs Run/RunResult evidence;
+- the interaction may fail independently;
+- a read-only consult/review needs an artifact rather than a one-line summary.
+
+`handoff` remains useful for visibility and role-holder truth. It is not enough
+evidence for a Team Dispatch operation once the result influences a lifecycle
+decision.
+
+## 10. Coding-Domain Stage Protocols
+
+### 10.1 Discovery
+
+Discovery is machine-alone.
+
+Allowed behavior:
+
+- owner reads existing Work context;
+- owner consults researcher helpers for evidence;
+- owner logs consult interactions;
+- owner chooses `clear` or `unclear`;
+- `clear` can route to planning;
+- `unclear` routes to exploring.
+
+Forbidden behavior:
+
+- asking the human directly;
+- parking as `awaiting-human`;
+- treating a helper's unsupported answer as proof;
+- opening a new Work item just to answer a bounded evidence question.
+
+### 10.2 Exploring
+
+Exploring is the human-adjacent decision-locking stage.
+
+Allowed behavior:
+
+- advisor interaction for material, grounded, answerable product questions;
+- researcher consult for repo or external facts;
+- lock decisions into CONTEXT.md.
+
+Exploring may ask a human. It should ask only after machine evidence has been
+gathered and the question is self-contained.
+
+### 10.3 Planning
+
+Planning has two main operation families:
+
+- `shape-plan` by implementer;
+- `validate-plan` by reviewer.
+
+The stage owner may write the plan directly, but validation should move toward
+a reviewer Assignment once Step 05 adopts operation choice.
+
+`validate-plan` is a real reviewer-role operation when dispatched through
+Assignment. Prose that says validating is only an implementer function must be
+reconciled before driver adoption.
+
+### 10.4 Executing
+
+Executing has the richest team protocol:
+
+- implementer owns the main edit path;
+- researcher may answer blast-radius or API/pattern questions;
+- helper may take independent scoped work;
+- reviewer may review returned diffs or candidate fixes;
+- advisor handles product/scope questions that exceed locked decisions.
+
+The implementer remains responsible for Work lifecycle. Helper/reviewer
+assignments return artifacts and recommendations unless explicitly promoted to
+child Work.
+
+## 11. Coordination Operating Harness
+
+Multi-agent implementation benefits from a durable operating harness:
+
+```txt
+trace/index.md
+trace/current-cell.md
+trace/<cell>.md
+prompt templates
+review and red-team gates
+live proof capture
+```
+
+This harness is documented in
+[coordination-operating-harness.md](../playbooks/coordination-operating-harness.md). It is
+supporting engineering practice, not Step 07 runtime infrastructure and not a
+lifecycle system. Its job is to keep coordinator, doer, reviewer, and red-team
+sessions aligned while preserving token budget and proof traceability.
+
+The harness should be used where it reduces implementation drift, but dogfooding
+it is not a runtime dependency gate for standalone coordination.
+
+## 12. Standalone Read-Only Coordination
+
+The current mission-lite implementation is a prototype for standalone read-only
+coordination. Its generalization is still under discussion in
+[Step 08](step-08-standalone-coordination-protocols.md) and depends on the relevant
+CoordinationSession/AdhocTask contracts from
+[Step 07](step-07-coordination-session-adhoc-task.md).
+
+A standalone session may group assignments without a Work item for read-only
+coordination:
+
+```txt
+mission-lite objective
+  -> researcher background brief
+  -> reviewer counter-argument
+  -> advisor product framing
+  -> driver synthesis
+```
+
 Mission-lite currently borrows coding Stage Operations. That is prototype
 behavior, not a foundation requirement. The target standalone path may instead
 construct validated dynamic Assignments and may optionally select a reusable
-protocol.
\ No newline at end of file
+protocol.
+
+Rules:
+
+- no Work lifecycle;
+- no repo mutation;
+- no approval/merge semantics;
+- every role result is a structured artifact;
+- synthesis is a report, not a state transition;
+- any resulting implementation proposal becomes ordinary Work before code is
+  changed.
+
+Good first case:
+
+```txt
+Question: Should coding-domain planning validation run as a reviewer Assignment
+or stay as direct same-session validation?
+```
+
+This is useful because it tests team reasoning without risking Work lifecycle
+truth.
+
+## 13. Acceptance Criteria For V1 Protocol
+
+The protocol is ready for driver adoption when:
+
+- every runtime assignment receives an explicit result artifact path;
+- malformed or missing structured claims cannot produce `verified` or
+  `reported`;
+- dirty-before files cannot be counted as post-run evidence;
+- read-only operations can return `reported` only through worker artifacts;
+- mutating operations require post-run external evidence;
+- stage skills agree on when Assignment is used versus direct invocation;
+- `validate-plan` role prose is consistent across skill and task-spec docs;
+- discovery remains machine-alone.
+~~~~
\ No newline at end of file
````

## claim_5029e0d6308aaf043be48a5008883d04

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-61

Target: docs/platform/agent-coordination/history/retired-engine/files/proposals/team-communication-protocol-v1.md#literal-snapshot

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_5029e0d6308aaf043be48a5008883d04 |
| sourceUnitDigest | 1c2032023a60d221df40b78fe727ce5eb08b6aad5ace305950c8ec61e633ba57 |
| claimKind | contract |
| disposition | move |
| rationale | This particular legacy unit docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-61 is retained verbatim inside docs/platform/agent-coordination/history/retired-engine/files/proposals/team-communication-protocol-v1.md#literal-snapshot as the dated pre-rework statement, not as an assertion that the whole surviving file is retired. The current version of docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md distinguishes present runtime behaviour/design obligations from the original session-only, obsolete interface or dated implementation wording. Retirement 2180b4e72 applies only to session-engine portions; live guidance is restored at its current path and receives a separate independent check. No old approval carries to this corrected unit-specific explanation. |
| targetOwner | docs/platform/agent-coordination/history/retired-engine/files/proposals/team-communication-protocol-v1.md |
| targetAnchor | literal-snapshot |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | c3a4d458bb1581e2f7b65a4b653037ba1866eb3ac0ee69dd189c0de195a97578 |
| targetAncestry | \["Historical File: Team Communication Protocol V1"\] |

### Source unit

```text
Rules:

- no Work lifecycle;
- no repo mutation;
- no approval/merge semantics;
- every role result is a structured artifact;
- synthesis is a report, not a state transition;
- any resulting implementation proposal becomes ordinary Work before code is
  changed.
```

### Target unit

````text
## Literal Snapshot

~~~~text
# Team Communication Protocol V1

```txt
Document type: Proposal
Audience: Human reviewers, maintainers, documentation agents
Purpose: Preserve source material for Team Communication Protocol V1
Design status: Candidate
Implementation: Not re-verified; source implementation statements remain in the body
Provenance: Retained from docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md at fcfe78cb89585bc9ab23f11bab67d41458834fc4
Writer type: Documentation maintainer
Canonical for: Preserved proposal material for Team Communication Protocol V1; no authority cutover
Use this when: Comparing this candidate with its pinned legacy source
Do not use this for: Inferring current implementation or supersession of retained sources
Last reviewed: UNPROVEN; independent content review pending
Related:
- docs/platform/agent-coordination/vision.md
- docs/platform/agent-coordination/playbooks/coordination-operating-harness.md
- docs/platform/agent-coordination/proposals/step-08-standalone-coordination-protocols.md
Supersedes: None; retained source authority is unchanged
Superseded by: None
Added in candidate: Promotion metadata only; source claims and implementation are not re-decided here
```
Document type: Proposal
Design status: Proposed
Implementation: Partial
Last reviewed: 2026-08-31
Canonical for: nothing until communication contracts are accepted
Original date: 2026-08-28
Scope: role-to-role communication inside coding-domain stage protocols, Work-attached assignments, RunResult evidence, and standalone read-only coordination

## 1. Purpose

Team Dispatch V1 needs a communication protocol, but it must stay smaller than
a mailbox, daemon, or second lifecycle system.

This proposal describes a Work-attached coding-domain protocol and one early
standalone prototype. It is not the universal entry model for Agent
Coordination. Per the [Agent Coordination Foundation Vision](../vision.md), an
agent-led session may coordinate through validated dynamic execution contracts
without a predeclared Workflow/Stage graph.

The protocol defines how roles communicate while `Work` remains the lifecycle
authority:

```txt
Work position
  -> current workflow stage
    -> legal stage operations
      -> selected Assignment
        -> one Run
          -> one RunResult
            -> driver chooses the next legal operation or engine verb
```

The protocol is not a meeting scheduler. It is the set of rules that make one
role's message usable by another role without trusting terminal text or agent
say-so as proof.

## 2. Non-Negotiable Boundaries

```txt
Work is lifecycle authority.
Mission is a lightweight team envelope.
Stage is workflow position.
Stage Operation is one legal task-shaped action inside a stage.
Assignment is a semantic request.
Run is a runtime attempt.
RunResult is normalized result plus evidence.
Herdr is visibility only.
```

Do not introduce `Job` in V1. `Job` remains reserved for a future queue,
scheduler, lease, cancellation, or worker-pool design.

Do not let an Assignment mutate Work lifecycle state by itself. Work moves only
through existing engine verbs such as `fgos discover`, `fgos plan`, `fgos
return`, `fgos ask`, `fgos answer`, and approval/merge verbs.

## 3. Roles

The coding domain starts with the roles already declared in the role graph:

| Role | Responsibility | Typical operation family |
|---|---|---|
| `implementer` | Owns the current Work item, edits repo state, invokes engine verbs, and coordinates legal sub-calls. | `judge-ambiguity`, `shape-plan`, `implement-item`, `fix-verify-red` |
| `researcher` | Gathers evidence and facts. It may read repo context, run approved research tools, or inspect docs. | `resolve-question`, `scout-blast-radius` |
| `reviewer` | Finds correctness, feasibility, regression, and test risks. | `validate-plan`, `review-item` |
| `helper` | Performs an independent scoped piece whose footprint does not collide with the driver's active edit surface. | `scoped-subtask` |
| `advisor` | Answers product, scope, priority, or human-intent questions that cannot be settled from machine evidence. | `answer-question`, selected `advise` interactions |

Role is not executor. A reviewer can run on Codex, Claude, agy, pi, or a future
executor if policy and governance allow it.

Role is not stage owner. A stage owner may dispatch an Assignment to another
role while the Work item stays at the same stage.

## 4. Communication Modes

The role graph's `mode` field has protocol meaning:

| Mode | Meaning | Lifecycle effect | Required evidence |
|---|---|---|---|
| `sync` | Caller waits for a bounded finding or work product, then continues in the same stage. | Work usually stays claimed by the caller; holder may be logged but returns immediately. | Structured result artifact for read-only calls; git/artifact delta for mutating helper work. |
| `async` | Caller cannot continue without another actor or human-adjacent answer. | Work may park, or holder may move until a future reclaim. | A recorded question, answer, review verdict, or blocker with context refs. |

`sync` does not mean invisible. It still needs a recorded handoff or Assignment
RunResult when the result matters to later decisions.

`async` does not mean a new Work item. It becomes Work only when the request
needs independent lifecycle, approval, merge, or backlog visibility.

## 5. Stage Operation Selection

The driver may choose only operations declared for the current stage by
`operationsForStage(domain, stage, { kind })`.

Selection rules:

1. Prefer the primary operation when the stage's normal owner work remains the
   next required action.
2. Choose a secondary operation when a bounded role contribution would unblock
   the stage without creating lifecycle-bearing child work.
3. Create child Work only when the contribution needs its own claim, branch,
   verify, approval, merge, or backlog visibility.
4. Route discovery unresolved ambiguity to `exploring`; discovery must not ask
   the human directly.
5. Refuse operations marked `dispatch: human-only` from cli-spawn assignment
   execution.
6. Refuse synthetic compatibility operations from runtime dispatch unless their
   task-spec file resolves and the caller explicitly accepts compatibility
   dispatch.

Examples:

| Stage | Situation | Operation |
|---|---|---|
| `discovery` | Need machine evidence for ambiguity. | `resolve-question` to `researcher`, then owner decides `clear` or `unclear`. |
| `planning` | Plan is written and needs proof before the edge to executing. | `validate-plan` to `reviewer`. |
| `planning` | A symbol's blast radius is unknown. | `scout-blast-radius` to `researcher`. |
| `executing` | Implementation needs a separate non-overlapping edit. | `scoped-subtask` to `helper`. |
| `executing` | Returned diff needs independent review. | `review-item` to `reviewer`. |
| `executing` | Review or verify reports a concrete red issue. | `fix-verify-red` to `implementer`. |

## 6. Assignment Message Contract

Every assignment prompt must provide the worker with enough information to
produce a usable result without learning fgOS internals.

Required prompt fields:

```txt
Assignment: <assignmentId>
Work: <workId or (none)>
Stage operation: <stage>.<operation>
Role: <role>
Task-spec: <task-spec path>
Objective: <bounded request>
Context refs:
- <ref>
Expected outputs:
- <output>
Result artifact:
- Write JSON to <runDir>/agent-result.json
- Optionally write Markdown to <runDir>/agent-report.md
```

The prompt must say that the worker should not call Work lifecycle verbs unless
the task-spec explicitly says the worker is the lifecycle driver. Ordinary
Assignment workers return artifacts; the driver interprets them.

The prompt must pass refs, not embedded large docs, diffs, transcripts, or
secrets.

## 7. Agent Result Schema

`agent-result.json` is the worker's structured claim. It is not proof by
itself.

Minimal schema:

```json
{
  "status": "done",
  "summary": "One concise result sentence.",
  "findings": [],
  "evidenceRefs": [],
  "nextRecommendedOperation": null
}
```

Allowed status values:

| Status | Meaning |
|---|---|
| `done` | The worker believes the assignment objective is complete. |
| `blocked` | The worker could not complete because a named blocker remains. |
| `failed` | The worker attempted the assignment and produced an error or invalid output. |
| `no-evidence` | The worker can report context but cannot support a completion claim. |

Required fields by status:

| Status | Required fields |
|---|---|
| `done` | `summary`; at least one `evidenceRefs` entry or a companion `agent-report.md` for read-only work; external git/artifact evidence for mutating work. |
| `blocked` | `summary`; `blocker`; `evidenceRefs` when any evidence exists. |
| `failed` | `summary`; `error`. |
| `no-evidence` | `summary`; reason why evidence is absent. |

Optional `nextRecommendedOperation` may name another legal stage operation, but
it is only a recommendation. The driver must verify legality before acting.

## 8. RunResult Confidence

RunResult status and confidence are control-plane judgments.

Confidence ladder:

| Confidence | Meaning | Allowed use |
|---|---|---|
| `verified` | Structured claim plus post-run external evidence such as a new commit, new changed file, test artifact, or verified result file. | May feed lifecycle decisions that require proof. |
| `reported` | Structured claim plus a worker-produced report for read-only consult/review work. | May feed driver judgment, but should not close mutating work. |
| `inferred` | Post-run external evidence exists but no structured claim exists. | May be surfaced for inspection; driver should avoid automatic lifecycle movement. |
| `no-evidence` | Process settled without proof. | Must not advance Work. |
| `failed` | Timeout, nonzero exit, signal, invalid schema, or explicit failure. | Must not advance Work. |

The driver must treat `done/no-evidence` as not done. It may retry, ask for a
proper artifact, or route to a different legal operation.

## 9. Handoff Versus Assignment

Use `handoff` when the interaction is a short role-axis record around work the
current session already performed or directly observed.

Use Assignment when:

- another executor, provider, role, or tool performs the action;
- the result will be read by a later driver turn;
- the result needs Run/RunResult evidence;
- the interaction may fail independently;
- a read-only consult/review needs an artifact rather than a one-line summary.

`handoff` remains useful for visibility and role-holder truth. It is not enough
evidence for a Team Dispatch operation once the result influences a lifecycle
decision.

## 10. Coding-Domain Stage Protocols

### 10.1 Discovery

Discovery is machine-alone.

Allowed behavior:

- owner reads existing Work context;
- owner consults researcher helpers for evidence;
- owner logs consult interactions;
- owner chooses `clear` or `unclear`;
- `clear` can route to planning;
- `unclear` routes to exploring.

Forbidden behavior:

- asking the human directly;
- parking as `awaiting-human`;
- treating a helper's unsupported answer as proof;
- opening a new Work item just to answer a bounded evidence question.

### 10.2 Exploring

Exploring is the human-adjacent decision-locking stage.

Allowed behavior:

- advisor interaction for material, grounded, answerable product questions;
- researcher consult for repo or external facts;
- lock decisions into CONTEXT.md.

Exploring may ask a human. It should ask only after machine evidence has been
gathered and the question is self-contained.

### 10.3 Planning

Planning has two main operation families:

- `shape-plan` by implementer;
- `validate-plan` by reviewer.

The stage owner may write the plan directly, but validation should move toward
a reviewer Assignment once Step 05 adopts operation choice.

`validate-plan` is a real reviewer-role operation when dispatched through
Assignment. Prose that says validating is only an implementer function must be
reconciled before driver adoption.

### 10.4 Executing

Executing has the richest team protocol:

- implementer owns the main edit path;
- researcher may answer blast-radius or API/pattern questions;
- helper may take independent scoped work;
- reviewer may review returned diffs or candidate fixes;
- advisor handles product/scope questions that exceed locked decisions.

The implementer remains responsible for Work lifecycle. Helper/reviewer
assignments return artifacts and recommendations unless explicitly promoted to
child Work.

## 11. Coordination Operating Harness

Multi-agent implementation benefits from a durable operating harness:

```txt
trace/index.md
trace/current-cell.md
trace/<cell>.md
prompt templates
review and red-team gates
live proof capture
```

This harness is documented in
[coordination-operating-harness.md](../playbooks/coordination-operating-harness.md). It is
supporting engineering practice, not Step 07 runtime infrastructure and not a
lifecycle system. Its job is to keep coordinator, doer, reviewer, and red-team
sessions aligned while preserving token budget and proof traceability.

The harness should be used where it reduces implementation drift, but dogfooding
it is not a runtime dependency gate for standalone coordination.

## 12. Standalone Read-Only Coordination

The current mission-lite implementation is a prototype for standalone read-only
coordination. Its generalization is still under discussion in
[Step 08](step-08-standalone-coordination-protocols.md) and depends on the relevant
CoordinationSession/AdhocTask contracts from
[Step 07](step-07-coordination-session-adhoc-task.md).

A standalone session may group assignments without a Work item for read-only
coordination:

```txt
mission-lite objective
  -> researcher background brief
  -> reviewer counter-argument
  -> advisor product framing
  -> driver synthesis
```

Mission-lite currently borrows coding Stage Operations. That is prototype
behavior, not a foundation requirement. The target standalone path may instead
construct validated dynamic Assignments and may optionally select a reusable
protocol.

Rules:

- no Work lifecycle;
- no repo mutation;
- no approval/merge semantics;
- every role result is a structured artifact;
- synthesis is a report, not a state transition;
- any resulting implementation proposal becomes ordinary Work before code is
  changed.

Good first case:

```txt
Question: Should coding-domain planning validation run as a reviewer Assignment
or stay as direct same-session validation?
```

This is useful because it tests team reasoning without risking Work lifecycle
truth.

## 13. Acceptance Criteria For V1 Protocol

The protocol is ready for driver adoption when:

- every runtime assignment receives an explicit result artifact path;
- malformed or missing structured claims cannot produce `verified` or
  `reported`;
- dirty-before files cannot be counted as post-run evidence;
- read-only operations can return `reported` only through worker artifacts;
- mutating operations require post-run external evidence;
- stage skills agree on when Assignment is used versus direct invocation;
- `validate-plan` role prose is consistent across skill and task-spec docs;
- discovery remains machine-alone.
~~~~
````

### Unified diff

````diff
--- "docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-61"
+++ "docs/platform/agent-coordination/history/retired-engine/files/proposals/team-communication-protocol-v1.md#literal-snapshot"
@@ -1,3 +1,360 @@
+## Literal Snapshot
+
+~~~~text
+# Team Communication Protocol V1
+
+```txt
+Document type: Proposal
+Audience: Human reviewers, maintainers, documentation agents
+Purpose: Preserve source material for Team Communication Protocol V1
+Design status: Candidate
+Implementation: Not re-verified; source implementation statements remain in the body
+Provenance: Retained from docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md at fcfe78cb89585bc9ab23f11bab67d41458834fc4
+Writer type: Documentation maintainer
+Canonical for: Preserved proposal material for Team Communication Protocol V1; no authority cutover
+Use this when: Comparing this candidate with its pinned legacy source
+Do not use this for: Inferring current implementation or supersession of retained sources
+Last reviewed: UNPROVEN; independent content review pending
+Related:
+- docs/platform/agent-coordination/vision.md
+- docs/platform/agent-coordination/playbooks/coordination-operating-harness.md
+- docs/platform/agent-coordination/proposals/step-08-standalone-coordination-protocols.md
+Supersedes: None; retained source authority is unchanged
+Superseded by: None
+Added in candidate: Promotion metadata only; source claims and implementation are not re-decided here
+```
+Document type: Proposal
+Design status: Proposed
+Implementation: Partial
+Last reviewed: 2026-08-31
+Canonical for: nothing until communication contracts are accepted
+Original date: 2026-08-28
+Scope: role-to-role communication inside coding-domain stage protocols, Work-attached assignments, RunResult evidence, and standalone read-only coordination
+
+## 1. Purpose
+
+Team Dispatch V1 needs a communication protocol, but it must stay smaller than
+a mailbox, daemon, or second lifecycle system.
+
+This proposal describes a Work-attached coding-domain protocol and one early
+standalone prototype. It is not the universal entry model for Agent
+Coordination. Per the [Agent Coordination Foundation Vision](../vision.md), an
+agent-led session may coordinate through validated dynamic execution contracts
+without a predeclared Workflow/Stage graph.
+
+The protocol defines how roles communicate while `Work` remains the lifecycle
+authority:
+
+```txt
+Work position
+  -> current workflow stage
+    -> legal stage operations
+      -> selected Assignment
+        -> one Run
+          -> one RunResult
+            -> driver chooses the next legal operation or engine verb
+```
+
+The protocol is not a meeting scheduler. It is the set of rules that make one
+role's message usable by another role without trusting terminal text or agent
+say-so as proof.
+
+## 2. Non-Negotiable Boundaries
+
+```txt
+Work is lifecycle authority.
+Mission is a lightweight team envelope.
+Stage is workflow position.
+Stage Operation is one legal task-shaped action inside a stage.
+Assignment is a semantic request.
+Run is a runtime attempt.
+RunResult is normalized result plus evidence.
+Herdr is visibility only.
+```
+
+Do not introduce `Job` in V1. `Job` remains reserved for a future queue,
+scheduler, lease, cancellation, or worker-pool design.
+
+Do not let an Assignment mutate Work lifecycle state by itself. Work moves only
+through existing engine verbs such as `fgos discover`, `fgos plan`, `fgos
+return`, `fgos ask`, `fgos answer`, and approval/merge verbs.
+
+## 3. Roles
+
+The coding domain starts with the roles already declared in the role graph:
+
+| Role | Responsibility | Typical operation family |
+|---|---|---|
+| `implementer` | Owns the current Work item, edits repo state, invokes engine verbs, and coordinates legal sub-calls. | `judge-ambiguity`, `shape-plan`, `implement-item`, `fix-verify-red` |
+| `researcher` | Gathers evidence and facts. It may read repo context, run approved research tools, or inspect docs. | `resolve-question`, `scout-blast-radius` |
+| `reviewer` | Finds correctness, feasibility, regression, and test risks. | `validate-plan`, `review-item` |
+| `helper` | Performs an independent scoped piece whose footprint does not collide with the driver's active edit surface. | `scoped-subtask` |
+| `advisor` | Answers product, scope, priority, or human-intent questions that cannot be settled from machine evidence. | `answer-question`, selected `advise` interactions |
+
+Role is not executor. A reviewer can run on Codex, Claude, agy, pi, or a future
+executor if policy and governance allow it.
+
+Role is not stage owner. A stage owner may dispatch an Assignment to another
+role while the Work item stays at the same stage.
+
+## 4. Communication Modes
+
+The role graph's `mode` field has protocol meaning:
+
+| Mode | Meaning | Lifecycle effect | Required evidence |
+|---|---|---|---|
+| `sync` | Caller waits for a bounded finding or work product, then continues in the same stage. | Work usually stays claimed by the caller; holder may be logged but returns immediately. | Structured result artifact for read-only calls; git/artifact delta for mutating helper work. |
+| `async` | Caller cannot continue without another actor or human-adjacent answer. | Work may park, or holder may move until a future reclaim. | A recorded question, answer, review verdict, or blocker with context refs. |
+
+`sync` does not mean invisible. It still needs a recorded handoff or Assignment
+RunResult when the result matters to later decisions.
+
+`async` does not mean a new Work item. It becomes Work only when the request
+needs independent lifecycle, approval, merge, or backlog visibility.
+
+## 5. Stage Operation Selection
+
+The driver may choose only operations declared for the current stage by
+`operationsForStage(domain, stage, { kind })`.
+
+Selection rules:
+
+1. Prefer the primary operation when the stage's normal owner work remains the
+   next required action.
+2. Choose a secondary operation when a bounded role contribution would unblock
+   the stage without creating lifecycle-bearing child work.
+3. Create child Work only when the contribution needs its own claim, branch,
+   verify, approval, merge, or backlog visibility.
+4. Route discovery unresolved ambiguity to `exploring`; discovery must not ask
+   the human directly.
+5. Refuse operations marked `dispatch: human-only` from cli-spawn assignment
+   execution.
+6. Refuse synthetic compatibility operations from runtime dispatch unless their
+   task-spec file resolves and the caller explicitly accepts compatibility
+   dispatch.
+
+Examples:
+
+| Stage | Situation | Operation |
+|---|---|---|
+| `discovery` | Need machine evidence for ambiguity. | `resolve-question` to `researcher`, then owner decides `clear` or `unclear`. |
+| `planning` | Plan is written and needs proof before the edge to executing. | `validate-plan` to `reviewer`. |
+| `planning` | A symbol's blast radius is unknown. | `scout-blast-radius` to `researcher`. |
+| `executing` | Implementation needs a separate non-overlapping edit. | `scoped-subtask` to `helper`. |
+| `executing` | Returned diff needs independent review. | `review-item` to `reviewer`. |
+| `executing` | Review or verify reports a concrete red issue. | `fix-verify-red` to `implementer`. |
+
+## 6. Assignment Message Contract
+
+Every assignment prompt must provide the worker with enough information to
+produce a usable result without learning fgOS internals.
+
+Required prompt fields:
+
+```txt
+Assignment: <assignmentId>
+Work: <workId or (none)>
+Stage operation: <stage>.<operation>
+Role: <role>
+Task-spec: <task-spec path>
+Objective: <bounded request>
+Context refs:
+- <ref>
+Expected outputs:
+- <output>
+Result artifact:
+- Write JSON to <runDir>/agent-result.json
+- Optionally write Markdown to <runDir>/agent-report.md
+```
+
+The prompt must say that the worker should not call Work lifecycle verbs unless
+the task-spec explicitly says the worker is the lifecycle driver. Ordinary
+Assignment workers return artifacts; the driver interprets them.
+
+The prompt must pass refs, not embedded large docs, diffs, transcripts, or
+secrets.
+
+## 7. Agent Result Schema
+
+`agent-result.json` is the worker's structured claim. It is not proof by
+itself.
+
+Minimal schema:
+
+```json
+{
+  "status": "done",
+  "summary": "One concise result sentence.",
+  "findings": [],
+  "evidenceRefs": [],
+  "nextRecommendedOperation": null
+}
+```
+
+Allowed status values:
+
+| Status | Meaning |
+|---|---|
+| `done` | The worker believes the assignment objective is complete. |
+| `blocked` | The worker could not complete because a named blocker remains. |
+| `failed` | The worker attempted the assignment and produced an error or invalid output. |
+| `no-evidence` | The worker can report context but cannot support a completion claim. |
+
+Required fields by status:
+
+| Status | Required fields |
+|---|---|
+| `done` | `summary`; at least one `evidenceRefs` entry or a companion `agent-report.md` for read-only work; external git/artifact evidence for mutating work. |
+| `blocked` | `summary`; `blocker`; `evidenceRefs` when any evidence exists. |
+| `failed` | `summary`; `error`. |
+| `no-evidence` | `summary`; reason why evidence is absent. |
+
+Optional `nextRecommendedOperation` may name another legal stage operation, but
+it is only a recommendation. The driver must verify legality before acting.
+
+## 8. RunResult Confidence
+
+RunResult status and confidence are control-plane judgments.
+
+Confidence ladder:
+
+| Confidence | Meaning | Allowed use |
+|---|---|---|
+| `verified` | Structured claim plus post-run external evidence such as a new commit, new changed file, test artifact, or verified result file. | May feed lifecycle decisions that require proof. |
+| `reported` | Structured claim plus a worker-produced report for read-only consult/review work. | May feed driver judgment, but should not close mutating work. |
+| `inferred` | Post-run external evidence exists but no structured claim exists. | May be surfaced for inspection; driver should avoid automatic lifecycle movement. |
+| `no-evidence` | Process settled without proof. | Must not advance Work. |
+| `failed` | Timeout, nonzero exit, signal, invalid schema, or explicit failure. | Must not advance Work. |
+
+The driver must treat `done/no-evidence` as not done. It may retry, ask for a
+proper artifact, or route to a different legal operation.
+
+## 9. Handoff Versus Assignment
+
+Use `handoff` when the interaction is a short role-axis record around work the
+current session already performed or directly observed.
+
+Use Assignment when:
+
+- another executor, provider, role, or tool performs the action;
+- the result will be read by a later driver turn;
+- the result needs Run/RunResult evidence;
+- the interaction may fail independently;
+- a read-only consult/review needs an artifact rather than a one-line summary.
+
+`handoff` remains useful for visibility and role-holder truth. It is not enough
+evidence for a Team Dispatch operation once the result influences a lifecycle
+decision.
+
+## 10. Coding-Domain Stage Protocols
+
+### 10.1 Discovery
+
+Discovery is machine-alone.
+
+Allowed behavior:
+
+- owner reads existing Work context;
+- owner consults researcher helpers for evidence;
+- owner logs consult interactions;
+- owner chooses `clear` or `unclear`;
+- `clear` can route to planning;
+- `unclear` routes to exploring.
+
+Forbidden behavior:
+
+- asking the human directly;
+- parking as `awaiting-human`;
+- treating a helper's unsupported answer as proof;
+- opening a new Work item just to answer a bounded evidence question.
+
+### 10.2 Exploring
+
+Exploring is the human-adjacent decision-locking stage.
+
+Allowed behavior:
+
+- advisor interaction for material, grounded, answerable product questions;
+- researcher consult for repo or external facts;
+- lock decisions into CONTEXT.md.
+
+Exploring may ask a human. It should ask only after machine evidence has been
+gathered and the question is self-contained.
+
+### 10.3 Planning
+
+Planning has two main operation families:
+
+- `shape-plan` by implementer;
+- `validate-plan` by reviewer.
+
+The stage owner may write the plan directly, but validation should move toward
+a reviewer Assignment once Step 05 adopts operation choice.
+
+`validate-plan` is a real reviewer-role operation when dispatched through
+Assignment. Prose that says validating is only an implementer function must be
+reconciled before driver adoption.
+
+### 10.4 Executing
+
+Executing has the richest team protocol:
+
+- implementer owns the main edit path;
+- researcher may answer blast-radius or API/pattern questions;
+- helper may take independent scoped work;
+- reviewer may review returned diffs or candidate fixes;
+- advisor handles product/scope questions that exceed locked decisions.
+
+The implementer remains responsible for Work lifecycle. Helper/reviewer
+assignments return artifacts and recommendations unless explicitly promoted to
+child Work.
+
+## 11. Coordination Operating Harness
+
+Multi-agent implementation benefits from a durable operating harness:
+
+```txt
+trace/index.md
+trace/current-cell.md
+trace/<cell>.md
+prompt templates
+review and red-team gates
+live proof capture
+```
+
+This harness is documented in
+[coordination-operating-harness.md](../playbooks/coordination-operating-harness.md). It is
+supporting engineering practice, not Step 07 runtime infrastructure and not a
+lifecycle system. Its job is to keep coordinator, doer, reviewer, and red-team
+sessions aligned while preserving token budget and proof traceability.
+
+The harness should be used where it reduces implementation drift, but dogfooding
+it is not a runtime dependency gate for standalone coordination.
+
+## 12. Standalone Read-Only Coordination
+
+The current mission-lite implementation is a prototype for standalone read-only
+coordination. Its generalization is still under discussion in
+[Step 08](step-08-standalone-coordination-protocols.md) and depends on the relevant
+CoordinationSession/AdhocTask contracts from
+[Step 07](step-07-coordination-session-adhoc-task.md).
+
+A standalone session may group assignments without a Work item for read-only
+coordination:
+
+```txt
+mission-lite objective
+  -> researcher background brief
+  -> reviewer counter-argument
+  -> advisor product framing
+  -> driver synthesis
+```
+
+Mission-lite currently borrows coding Stage Operations. That is prototype
+behavior, not a foundation requirement. The target standalone path may instead
+construct validated dynamic Assignments and may optionally select a reusable
+protocol.
+
 Rules:
 
 - no Work lifecycle;
@@ -6,4 +363,29 @@ Rules:
 - every role result is a structured artifact;
 - synthesis is a report, not a state transition;
 - any resulting implementation proposal becomes ordinary Work before code is
-  changed.
\ No newline at end of file
+  changed.
+
+Good first case:
+
+```txt
+Question: Should coding-domain planning validation run as a reviewer Assignment
+or stay as direct same-session validation?
+```
+
+This is useful because it tests team reasoning without risking Work lifecycle
+truth.
+
+## 13. Acceptance Criteria For V1 Protocol
+
+The protocol is ready for driver adoption when:
+
+- every runtime assignment receives an explicit result artifact path;
+- malformed or missing structured claims cannot produce `verified` or
+  `reported`;
+- dirty-before files cannot be counted as post-run evidence;
+- read-only operations can return `reported` only through worker artifacts;
+- mutating operations require post-run external evidence;
+- stage skills agree on when Assignment is used versus direct invocation;
+- `validate-plan` role prose is consistent across skill and task-spec docs;
+- discovery remains machine-alone.
+~~~~
\ No newline at end of file
````

## claim_3dc1f558195ca1de886b8ff63caa6d07

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-62

Target: docs/platform/agent-coordination/history/retired-engine/files/proposals/team-communication-protocol-v1.md#literal-snapshot

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_3dc1f558195ca1de886b8ff63caa6d07 |
| sourceUnitDigest | 92816bfa9f91999427276a286323dc93f7ad792c6f8dccf5ed4e6c92619720bc |
| claimKind | contract |
| disposition | move |
| rationale | This particular legacy unit docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-62 is retained verbatim inside docs/platform/agent-coordination/history/retired-engine/files/proposals/team-communication-protocol-v1.md#literal-snapshot as the dated pre-rework statement, not as an assertion that the whole surviving file is retired. The current version of docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md distinguishes present runtime behaviour/design obligations from the original session-only, obsolete interface or dated implementation wording. Retirement 2180b4e72 applies only to session-engine portions; live guidance is restored at its current path and receives a separate independent check. No old approval carries to this corrected unit-specific explanation. |
| targetOwner | docs/platform/agent-coordination/history/retired-engine/files/proposals/team-communication-protocol-v1.md |
| targetAnchor | literal-snapshot |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | c3a4d458bb1581e2f7b65a4b653037ba1866eb3ac0ee69dd189c0de195a97578 |
| targetAncestry | \["Historical File: Team Communication Protocol V1"\] |

### Source unit

````text
Good first case:

```txt
Question: Should coding-domain planning validation run as a reviewer Assignment
or stay as direct same-session validation?
```
````

### Target unit

````text
## Literal Snapshot

~~~~text
# Team Communication Protocol V1

```txt
Document type: Proposal
Audience: Human reviewers, maintainers, documentation agents
Purpose: Preserve source material for Team Communication Protocol V1
Design status: Candidate
Implementation: Not re-verified; source implementation statements remain in the body
Provenance: Retained from docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md at fcfe78cb89585bc9ab23f11bab67d41458834fc4
Writer type: Documentation maintainer
Canonical for: Preserved proposal material for Team Communication Protocol V1; no authority cutover
Use this when: Comparing this candidate with its pinned legacy source
Do not use this for: Inferring current implementation or supersession of retained sources
Last reviewed: UNPROVEN; independent content review pending
Related:
- docs/platform/agent-coordination/vision.md
- docs/platform/agent-coordination/playbooks/coordination-operating-harness.md
- docs/platform/agent-coordination/proposals/step-08-standalone-coordination-protocols.md
Supersedes: None; retained source authority is unchanged
Superseded by: None
Added in candidate: Promotion metadata only; source claims and implementation are not re-decided here
```
Document type: Proposal
Design status: Proposed
Implementation: Partial
Last reviewed: 2026-08-31
Canonical for: nothing until communication contracts are accepted
Original date: 2026-08-28
Scope: role-to-role communication inside coding-domain stage protocols, Work-attached assignments, RunResult evidence, and standalone read-only coordination

## 1. Purpose

Team Dispatch V1 needs a communication protocol, but it must stay smaller than
a mailbox, daemon, or second lifecycle system.

This proposal describes a Work-attached coding-domain protocol and one early
standalone prototype. It is not the universal entry model for Agent
Coordination. Per the [Agent Coordination Foundation Vision](../vision.md), an
agent-led session may coordinate through validated dynamic execution contracts
without a predeclared Workflow/Stage graph.

The protocol defines how roles communicate while `Work` remains the lifecycle
authority:

```txt
Work position
  -> current workflow stage
    -> legal stage operations
      -> selected Assignment
        -> one Run
          -> one RunResult
            -> driver chooses the next legal operation or engine verb
```

The protocol is not a meeting scheduler. It is the set of rules that make one
role's message usable by another role without trusting terminal text or agent
say-so as proof.

## 2. Non-Negotiable Boundaries

```txt
Work is lifecycle authority.
Mission is a lightweight team envelope.
Stage is workflow position.
Stage Operation is one legal task-shaped action inside a stage.
Assignment is a semantic request.
Run is a runtime attempt.
RunResult is normalized result plus evidence.
Herdr is visibility only.
```

Do not introduce `Job` in V1. `Job` remains reserved for a future queue,
scheduler, lease, cancellation, or worker-pool design.

Do not let an Assignment mutate Work lifecycle state by itself. Work moves only
through existing engine verbs such as `fgos discover`, `fgos plan`, `fgos
return`, `fgos ask`, `fgos answer`, and approval/merge verbs.

## 3. Roles

The coding domain starts with the roles already declared in the role graph:

| Role | Responsibility | Typical operation family |
|---|---|---|
| `implementer` | Owns the current Work item, edits repo state, invokes engine verbs, and coordinates legal sub-calls. | `judge-ambiguity`, `shape-plan`, `implement-item`, `fix-verify-red` |
| `researcher` | Gathers evidence and facts. It may read repo context, run approved research tools, or inspect docs. | `resolve-question`, `scout-blast-radius` |
| `reviewer` | Finds correctness, feasibility, regression, and test risks. | `validate-plan`, `review-item` |
| `helper` | Performs an independent scoped piece whose footprint does not collide with the driver's active edit surface. | `scoped-subtask` |
| `advisor` | Answers product, scope, priority, or human-intent questions that cannot be settled from machine evidence. | `answer-question`, selected `advise` interactions |

Role is not executor. A reviewer can run on Codex, Claude, agy, pi, or a future
executor if policy and governance allow it.

Role is not stage owner. A stage owner may dispatch an Assignment to another
role while the Work item stays at the same stage.

## 4. Communication Modes

The role graph's `mode` field has protocol meaning:

| Mode | Meaning | Lifecycle effect | Required evidence |
|---|---|---|---|
| `sync` | Caller waits for a bounded finding or work product, then continues in the same stage. | Work usually stays claimed by the caller; holder may be logged but returns immediately. | Structured result artifact for read-only calls; git/artifact delta for mutating helper work. |
| `async` | Caller cannot continue without another actor or human-adjacent answer. | Work may park, or holder may move until a future reclaim. | A recorded question, answer, review verdict, or blocker with context refs. |

`sync` does not mean invisible. It still needs a recorded handoff or Assignment
RunResult when the result matters to later decisions.

`async` does not mean a new Work item. It becomes Work only when the request
needs independent lifecycle, approval, merge, or backlog visibility.

## 5. Stage Operation Selection

The driver may choose only operations declared for the current stage by
`operationsForStage(domain, stage, { kind })`.

Selection rules:

1. Prefer the primary operation when the stage's normal owner work remains the
   next required action.
2. Choose a secondary operation when a bounded role contribution would unblock
   the stage without creating lifecycle-bearing child work.
3. Create child Work only when the contribution needs its own claim, branch,
   verify, approval, merge, or backlog visibility.
4. Route discovery unresolved ambiguity to `exploring`; discovery must not ask
   the human directly.
5. Refuse operations marked `dispatch: human-only` from cli-spawn assignment
   execution.
6. Refuse synthetic compatibility operations from runtime dispatch unless their
   task-spec file resolves and the caller explicitly accepts compatibility
   dispatch.

Examples:

| Stage | Situation | Operation |
|---|---|---|
| `discovery` | Need machine evidence for ambiguity. | `resolve-question` to `researcher`, then owner decides `clear` or `unclear`. |
| `planning` | Plan is written and needs proof before the edge to executing. | `validate-plan` to `reviewer`. |
| `planning` | A symbol's blast radius is unknown. | `scout-blast-radius` to `researcher`. |
| `executing` | Implementation needs a separate non-overlapping edit. | `scoped-subtask` to `helper`. |
| `executing` | Returned diff needs independent review. | `review-item` to `reviewer`. |
| `executing` | Review or verify reports a concrete red issue. | `fix-verify-red` to `implementer`. |

## 6. Assignment Message Contract

Every assignment prompt must provide the worker with enough information to
produce a usable result without learning fgOS internals.

Required prompt fields:

```txt
Assignment: <assignmentId>
Work: <workId or (none)>
Stage operation: <stage>.<operation>
Role: <role>
Task-spec: <task-spec path>
Objective: <bounded request>
Context refs:
- <ref>
Expected outputs:
- <output>
Result artifact:
- Write JSON to <runDir>/agent-result.json
- Optionally write Markdown to <runDir>/agent-report.md
```

The prompt must say that the worker should not call Work lifecycle verbs unless
the task-spec explicitly says the worker is the lifecycle driver. Ordinary
Assignment workers return artifacts; the driver interprets them.

The prompt must pass refs, not embedded large docs, diffs, transcripts, or
secrets.

## 7. Agent Result Schema

`agent-result.json` is the worker's structured claim. It is not proof by
itself.

Minimal schema:

```json
{
  "status": "done",
  "summary": "One concise result sentence.",
  "findings": [],
  "evidenceRefs": [],
  "nextRecommendedOperation": null
}
```

Allowed status values:

| Status | Meaning |
|---|---|
| `done` | The worker believes the assignment objective is complete. |
| `blocked` | The worker could not complete because a named blocker remains. |
| `failed` | The worker attempted the assignment and produced an error or invalid output. |
| `no-evidence` | The worker can report context but cannot support a completion claim. |

Required fields by status:

| Status | Required fields |
|---|---|
| `done` | `summary`; at least one `evidenceRefs` entry or a companion `agent-report.md` for read-only work; external git/artifact evidence for mutating work. |
| `blocked` | `summary`; `blocker`; `evidenceRefs` when any evidence exists. |
| `failed` | `summary`; `error`. |
| `no-evidence` | `summary`; reason why evidence is absent. |

Optional `nextRecommendedOperation` may name another legal stage operation, but
it is only a recommendation. The driver must verify legality before acting.

## 8. RunResult Confidence

RunResult status and confidence are control-plane judgments.

Confidence ladder:

| Confidence | Meaning | Allowed use |
|---|---|---|
| `verified` | Structured claim plus post-run external evidence such as a new commit, new changed file, test artifact, or verified result file. | May feed lifecycle decisions that require proof. |
| `reported` | Structured claim plus a worker-produced report for read-only consult/review work. | May feed driver judgment, but should not close mutating work. |
| `inferred` | Post-run external evidence exists but no structured claim exists. | May be surfaced for inspection; driver should avoid automatic lifecycle movement. |
| `no-evidence` | Process settled without proof. | Must not advance Work. |
| `failed` | Timeout, nonzero exit, signal, invalid schema, or explicit failure. | Must not advance Work. |

The driver must treat `done/no-evidence` as not done. It may retry, ask for a
proper artifact, or route to a different legal operation.

## 9. Handoff Versus Assignment

Use `handoff` when the interaction is a short role-axis record around work the
current session already performed or directly observed.

Use Assignment when:

- another executor, provider, role, or tool performs the action;
- the result will be read by a later driver turn;
- the result needs Run/RunResult evidence;
- the interaction may fail independently;
- a read-only consult/review needs an artifact rather than a one-line summary.

`handoff` remains useful for visibility and role-holder truth. It is not enough
evidence for a Team Dispatch operation once the result influences a lifecycle
decision.

## 10. Coding-Domain Stage Protocols

### 10.1 Discovery

Discovery is machine-alone.

Allowed behavior:

- owner reads existing Work context;
- owner consults researcher helpers for evidence;
- owner logs consult interactions;
- owner chooses `clear` or `unclear`;
- `clear` can route to planning;
- `unclear` routes to exploring.

Forbidden behavior:

- asking the human directly;
- parking as `awaiting-human`;
- treating a helper's unsupported answer as proof;
- opening a new Work item just to answer a bounded evidence question.

### 10.2 Exploring

Exploring is the human-adjacent decision-locking stage.

Allowed behavior:

- advisor interaction for material, grounded, answerable product questions;
- researcher consult for repo or external facts;
- lock decisions into CONTEXT.md.

Exploring may ask a human. It should ask only after machine evidence has been
gathered and the question is self-contained.

### 10.3 Planning

Planning has two main operation families:

- `shape-plan` by implementer;
- `validate-plan` by reviewer.

The stage owner may write the plan directly, but validation should move toward
a reviewer Assignment once Step 05 adopts operation choice.

`validate-plan` is a real reviewer-role operation when dispatched through
Assignment. Prose that says validating is only an implementer function must be
reconciled before driver adoption.

### 10.4 Executing

Executing has the richest team protocol:

- implementer owns the main edit path;
- researcher may answer blast-radius or API/pattern questions;
- helper may take independent scoped work;
- reviewer may review returned diffs or candidate fixes;
- advisor handles product/scope questions that exceed locked decisions.

The implementer remains responsible for Work lifecycle. Helper/reviewer
assignments return artifacts and recommendations unless explicitly promoted to
child Work.

## 11. Coordination Operating Harness

Multi-agent implementation benefits from a durable operating harness:

```txt
trace/index.md
trace/current-cell.md
trace/<cell>.md
prompt templates
review and red-team gates
live proof capture
```

This harness is documented in
[coordination-operating-harness.md](../playbooks/coordination-operating-harness.md). It is
supporting engineering practice, not Step 07 runtime infrastructure and not a
lifecycle system. Its job is to keep coordinator, doer, reviewer, and red-team
sessions aligned while preserving token budget and proof traceability.

The harness should be used where it reduces implementation drift, but dogfooding
it is not a runtime dependency gate for standalone coordination.

## 12. Standalone Read-Only Coordination

The current mission-lite implementation is a prototype for standalone read-only
coordination. Its generalization is still under discussion in
[Step 08](step-08-standalone-coordination-protocols.md) and depends on the relevant
CoordinationSession/AdhocTask contracts from
[Step 07](step-07-coordination-session-adhoc-task.md).

A standalone session may group assignments without a Work item for read-only
coordination:

```txt
mission-lite objective
  -> researcher background brief
  -> reviewer counter-argument
  -> advisor product framing
  -> driver synthesis
```

Mission-lite currently borrows coding Stage Operations. That is prototype
behavior, not a foundation requirement. The target standalone path may instead
construct validated dynamic Assignments and may optionally select a reusable
protocol.

Rules:

- no Work lifecycle;
- no repo mutation;
- no approval/merge semantics;
- every role result is a structured artifact;
- synthesis is a report, not a state transition;
- any resulting implementation proposal becomes ordinary Work before code is
  changed.

Good first case:

```txt
Question: Should coding-domain planning validation run as a reviewer Assignment
or stay as direct same-session validation?
```

This is useful because it tests team reasoning without risking Work lifecycle
truth.

## 13. Acceptance Criteria For V1 Protocol

The protocol is ready for driver adoption when:

- every runtime assignment receives an explicit result artifact path;
- malformed or missing structured claims cannot produce `verified` or
  `reported`;
- dirty-before files cannot be counted as post-run evidence;
- read-only operations can return `reported` only through worker artifacts;
- mutating operations require post-run external evidence;
- stage skills agree on when Assignment is used versus direct invocation;
- `validate-plan` role prose is consistent across skill and task-spec docs;
- discovery remains machine-alone.
~~~~
````

### Unified diff

````diff
--- "docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-62"
+++ "docs/platform/agent-coordination/history/retired-engine/files/proposals/team-communication-protocol-v1.md#literal-snapshot"
@@ -1,6 +1,391 @@
+## Literal Snapshot
+
+~~~~text
+# Team Communication Protocol V1
+
+```txt
+Document type: Proposal
+Audience: Human reviewers, maintainers, documentation agents
+Purpose: Preserve source material for Team Communication Protocol V1
+Design status: Candidate
+Implementation: Not re-verified; source implementation statements remain in the body
+Provenance: Retained from docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md at fcfe78cb89585bc9ab23f11bab67d41458834fc4
+Writer type: Documentation maintainer
+Canonical for: Preserved proposal material for Team Communication Protocol V1; no authority cutover
+Use this when: Comparing this candidate with its pinned legacy source
+Do not use this for: Inferring current implementation or supersession of retained sources
+Last reviewed: UNPROVEN; independent content review pending
+Related:
+- docs/platform/agent-coordination/vision.md
+- docs/platform/agent-coordination/playbooks/coordination-operating-harness.md
+- docs/platform/agent-coordination/proposals/step-08-standalone-coordination-protocols.md
+Supersedes: None; retained source authority is unchanged
+Superseded by: None
+Added in candidate: Promotion metadata only; source claims and implementation are not re-decided here
+```
+Document type: Proposal
+Design status: Proposed
+Implementation: Partial
+Last reviewed: 2026-08-31
+Canonical for: nothing until communication contracts are accepted
+Original date: 2026-08-28
+Scope: role-to-role communication inside coding-domain stage protocols, Work-attached assignments, RunResult evidence, and standalone read-only coordination
+
+## 1. Purpose
+
+Team Dispatch V1 needs a communication protocol, but it must stay smaller than
+a mailbox, daemon, or second lifecycle system.
+
+This proposal describes a Work-attached coding-domain protocol and one early
+standalone prototype. It is not the universal entry model for Agent
+Coordination. Per the [Agent Coordination Foundation Vision](../vision.md), an
+agent-led session may coordinate through validated dynamic execution contracts
+without a predeclared Workflow/Stage graph.
+
+The protocol defines how roles communicate while `Work` remains the lifecycle
+authority:
+
+```txt
+Work position
+  -> current workflow stage
+    -> legal stage operations
+      -> selected Assignment
+        -> one Run
+          -> one RunResult
+            -> driver chooses the next legal operation or engine verb
+```
+
+The protocol is not a meeting scheduler. It is the set of rules that make one
+role's message usable by another role without trusting terminal text or agent
+say-so as proof.
+
+## 2. Non-Negotiable Boundaries
+
+```txt
+Work is lifecycle authority.
+Mission is a lightweight team envelope.
+Stage is workflow position.
+Stage Operation is one legal task-shaped action inside a stage.
+Assignment is a semantic request.
+Run is a runtime attempt.
+RunResult is normalized result plus evidence.
+Herdr is visibility only.
+```
+
+Do not introduce `Job` in V1. `Job` remains reserved for a future queue,
+scheduler, lease, cancellation, or worker-pool design.
+
+Do not let an Assignment mutate Work lifecycle state by itself. Work moves only
+through existing engine verbs such as `fgos discover`, `fgos plan`, `fgos
+return`, `fgos ask`, `fgos answer`, and approval/merge verbs.
+
+## 3. Roles
+
+The coding domain starts with the roles already declared in the role graph:
+
+| Role | Responsibility | Typical operation family |
+|---|---|---|
+| `implementer` | Owns the current Work item, edits repo state, invokes engine verbs, and coordinates legal sub-calls. | `judge-ambiguity`, `shape-plan`, `implement-item`, `fix-verify-red` |
+| `researcher` | Gathers evidence and facts. It may read repo context, run approved research tools, or inspect docs. | `resolve-question`, `scout-blast-radius` |
+| `reviewer` | Finds correctness, feasibility, regression, and test risks. | `validate-plan`, `review-item` |
+| `helper` | Performs an independent scoped piece whose footprint does not collide with the driver's active edit surface. | `scoped-subtask` |
+| `advisor` | Answers product, scope, priority, or human-intent questions that cannot be settled from machine evidence. | `answer-question`, selected `advise` interactions |
+
+Role is not executor. A reviewer can run on Codex, Claude, agy, pi, or a future
+executor if policy and governance allow it.
+
+Role is not stage owner. A stage owner may dispatch an Assignment to another
+role while the Work item stays at the same stage.
+
+## 4. Communication Modes
+
+The role graph's `mode` field has protocol meaning:
+
+| Mode | Meaning | Lifecycle effect | Required evidence |
+|---|---|---|---|
+| `sync` | Caller waits for a bounded finding or work product, then continues in the same stage. | Work usually stays claimed by the caller; holder may be logged but returns immediately. | Structured result artifact for read-only calls; git/artifact delta for mutating helper work. |
+| `async` | Caller cannot continue without another actor or human-adjacent answer. | Work may park, or holder may move until a future reclaim. | A recorded question, answer, review verdict, or blocker with context refs. |
+
+`sync` does not mean invisible. It still needs a recorded handoff or Assignment
+RunResult when the result matters to later decisions.
+
+`async` does not mean a new Work item. It becomes Work only when the request
+needs independent lifecycle, approval, merge, or backlog visibility.
+
+## 5. Stage Operation Selection
+
+The driver may choose only operations declared for the current stage by
+`operationsForStage(domain, stage, { kind })`.
+
+Selection rules:
+
+1. Prefer the primary operation when the stage's normal owner work remains the
+   next required action.
+2. Choose a secondary operation when a bounded role contribution would unblock
+   the stage without creating lifecycle-bearing child work.
+3. Create child Work only when the contribution needs its own claim, branch,
+   verify, approval, merge, or backlog visibility.
+4. Route discovery unresolved ambiguity to `exploring`; discovery must not ask
+   the human directly.
+5. Refuse operations marked `dispatch: human-only` from cli-spawn assignment
+   execution.
+6. Refuse synthetic compatibility operations from runtime dispatch unless their
+   task-spec file resolves and the caller explicitly accepts compatibility
+   dispatch.
+
+Examples:
+
+| Stage | Situation | Operation |
+|---|---|---|
+| `discovery` | Need machine evidence for ambiguity. | `resolve-question` to `researcher`, then owner decides `clear` or `unclear`. |
+| `planning` | Plan is written and needs proof before the edge to executing. | `validate-plan` to `reviewer`. |
+| `planning` | A symbol's blast radius is unknown. | `scout-blast-radius` to `researcher`. |
+| `executing` | Implementation needs a separate non-overlapping edit. | `scoped-subtask` to `helper`. |
+| `executing` | Returned diff needs independent review. | `review-item` to `reviewer`. |
+| `executing` | Review or verify reports a concrete red issue. | `fix-verify-red` to `implementer`. |
+
+## 6. Assignment Message Contract
+
+Every assignment prompt must provide the worker with enough information to
+produce a usable result without learning fgOS internals.
+
+Required prompt fields:
+
+```txt
+Assignment: <assignmentId>
+Work: <workId or (none)>
+Stage operation: <stage>.<operation>
+Role: <role>
+Task-spec: <task-spec path>
+Objective: <bounded request>
+Context refs:
+- <ref>
+Expected outputs:
+- <output>
+Result artifact:
+- Write JSON to <runDir>/agent-result.json
+- Optionally write Markdown to <runDir>/agent-report.md
+```
+
+The prompt must say that the worker should not call Work lifecycle verbs unless
+the task-spec explicitly says the worker is the lifecycle driver. Ordinary
+Assignment workers return artifacts; the driver interprets them.
+
+The prompt must pass refs, not embedded large docs, diffs, transcripts, or
+secrets.
+
+## 7. Agent Result Schema
+
+`agent-result.json` is the worker's structured claim. It is not proof by
+itself.
+
+Minimal schema:
+
+```json
+{
+  "status": "done",
+  "summary": "One concise result sentence.",
+  "findings": [],
+  "evidenceRefs": [],
+  "nextRecommendedOperation": null
+}
+```
+
+Allowed status values:
+
+| Status | Meaning |
+|---|---|
+| `done` | The worker believes the assignment objective is complete. |
+| `blocked` | The worker could not complete because a named blocker remains. |
+| `failed` | The worker attempted the assignment and produced an error or invalid output. |
+| `no-evidence` | The worker can report context but cannot support a completion claim. |
+
+Required fields by status:
+
+| Status | Required fields |
+|---|---|
+| `done` | `summary`; at least one `evidenceRefs` entry or a companion `agent-report.md` for read-only work; external git/artifact evidence for mutating work. |
+| `blocked` | `summary`; `blocker`; `evidenceRefs` when any evidence exists. |
+| `failed` | `summary`; `error`. |
+| `no-evidence` | `summary`; reason why evidence is absent. |
+
+Optional `nextRecommendedOperation` may name another legal stage operation, but
+it is only a recommendation. The driver must verify legality before acting.
+
+## 8. RunResult Confidence
+
+RunResult status and confidence are control-plane judgments.
+
+Confidence ladder:
+
+| Confidence | Meaning | Allowed use |
+|---|---|---|
+| `verified` | Structured claim plus post-run external evidence such as a new commit, new changed file, test artifact, or verified result file. | May feed lifecycle decisions that require proof. |
+| `reported` | Structured claim plus a worker-produced report for read-only consult/review work. | May feed driver judgment, but should not close mutating work. |
+| `inferred` | Post-run external evidence exists but no structured claim exists. | May be surfaced for inspection; driver should avoid automatic lifecycle movement. |
+| `no-evidence` | Process settled without proof. | Must not advance Work. |
+| `failed` | Timeout, nonzero exit, signal, invalid schema, or explicit failure. | Must not advance Work. |
+
+The driver must treat `done/no-evidence` as not done. It may retry, ask for a
+proper artifact, or route to a different legal operation.
+
+## 9. Handoff Versus Assignment
+
+Use `handoff` when the interaction is a short role-axis record around work the
+current session already performed or directly observed.
+
+Use Assignment when:
+
+- another executor, provider, role, or tool performs the action;
+- the result will be read by a later driver turn;
+- the result needs Run/RunResult evidence;
+- the interaction may fail independently;
+- a read-only consult/review needs an artifact rather than a one-line summary.
+
+`handoff` remains useful for visibility and role-holder truth. It is not enough
+evidence for a Team Dispatch operation once the result influences a lifecycle
+decision.
+
+## 10. Coding-Domain Stage Protocols
+
+### 10.1 Discovery
+
+Discovery is machine-alone.
+
+Allowed behavior:
+
+- owner reads existing Work context;
+- owner consults researcher helpers for evidence;
+- owner logs consult interactions;
+- owner chooses `clear` or `unclear`;
+- `clear` can route to planning;
+- `unclear` routes to exploring.
+
+Forbidden behavior:
+
+- asking the human directly;
+- parking as `awaiting-human`;
+- treating a helper's unsupported answer as proof;
+- opening a new Work item just to answer a bounded evidence question.
+
+### 10.2 Exploring
+
+Exploring is the human-adjacent decision-locking stage.
+
+Allowed behavior:
+
+- advisor interaction for material, grounded, answerable product questions;
+- researcher consult for repo or external facts;
+- lock decisions into CONTEXT.md.
+
+Exploring may ask a human. It should ask only after machine evidence has been
+gathered and the question is self-contained.
+
+### 10.3 Planning
+
+Planning has two main operation families:
+
+- `shape-plan` by implementer;
+- `validate-plan` by reviewer.
+
+The stage owner may write the plan directly, but validation should move toward
+a reviewer Assignment once Step 05 adopts operation choice.
+
+`validate-plan` is a real reviewer-role operation when dispatched through
+Assignment. Prose that says validating is only an implementer function must be
+reconciled before driver adoption.
+
+### 10.4 Executing
+
+Executing has the richest team protocol:
+
+- implementer owns the main edit path;
+- researcher may answer blast-radius or API/pattern questions;
+- helper may take independent scoped work;
+- reviewer may review returned diffs or candidate fixes;
+- advisor handles product/scope questions that exceed locked decisions.
+
+The implementer remains responsible for Work lifecycle. Helper/reviewer
+assignments return artifacts and recommendations unless explicitly promoted to
+child Work.
+
+## 11. Coordination Operating Harness
+
+Multi-agent implementation benefits from a durable operating harness:
+
+```txt
+trace/index.md
+trace/current-cell.md
+trace/<cell>.md
+prompt templates
+review and red-team gates
+live proof capture
+```
+
+This harness is documented in
+[coordination-operating-harness.md](../playbooks/coordination-operating-harness.md). It is
+supporting engineering practice, not Step 07 runtime infrastructure and not a
+lifecycle system. Its job is to keep coordinator, doer, reviewer, and red-team
+sessions aligned while preserving token budget and proof traceability.
+
+The harness should be used where it reduces implementation drift, but dogfooding
+it is not a runtime dependency gate for standalone coordination.
+
+## 12. Standalone Read-Only Coordination
+
+The current mission-lite implementation is a prototype for standalone read-only
+coordination. Its generalization is still under discussion in
+[Step 08](step-08-standalone-coordination-protocols.md) and depends on the relevant
+CoordinationSession/AdhocTask contracts from
+[Step 07](step-07-coordination-session-adhoc-task.md).
+
+A standalone session may group assignments without a Work item for read-only
+coordination:
+
+```txt
+mission-lite objective
+  -> researcher background brief
+  -> reviewer counter-argument
+  -> advisor product framing
+  -> driver synthesis
+```
+
+Mission-lite currently borrows coding Stage Operations. That is prototype
+behavior, not a foundation requirement. The target standalone path may instead
+construct validated dynamic Assignments and may optionally select a reusable
+protocol.
+
+Rules:
+
+- no Work lifecycle;
+- no repo mutation;
+- no approval/merge semantics;
+- every role result is a structured artifact;
+- synthesis is a report, not a state transition;
+- any resulting implementation proposal becomes ordinary Work before code is
+  changed.
+
 Good first case:
 
 ```txt
 Question: Should coding-domain planning validation run as a reviewer Assignment
 or stay as direct same-session validation?
-```
\ No newline at end of file
+```
+
+This is useful because it tests team reasoning without risking Work lifecycle
+truth.
+
+## 13. Acceptance Criteria For V1 Protocol
+
+The protocol is ready for driver adoption when:
+
+- every runtime assignment receives an explicit result artifact path;
+- malformed or missing structured claims cannot produce `verified` or
+  `reported`;
+- dirty-before files cannot be counted as post-run evidence;
+- read-only operations can return `reported` only through worker artifacts;
+- mutating operations require post-run external evidence;
+- stage skills agree on when Assignment is used versus direct invocation;
+- `validate-plan` role prose is consistent across skill and task-spec docs;
+- discovery remains machine-alone.
+~~~~
\ No newline at end of file
````

## claim_7cc303c9abde10cad26fc1c4f766eb8a

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-63

Target: docs/platform/agent-coordination/history/retired-engine/files/proposals/team-communication-protocol-v1.md#literal-snapshot

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_7cc303c9abde10cad26fc1c4f766eb8a |
| sourceUnitDigest | 1d3cff182fba9303857b6225b4b6d22d60ac21e0a04de03c0ca00ddd2264379a |
| claimKind | contract |
| disposition | move |
| rationale | This particular legacy unit docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-63 is retained verbatim inside docs/platform/agent-coordination/history/retired-engine/files/proposals/team-communication-protocol-v1.md#literal-snapshot as the dated pre-rework statement, not as an assertion that the whole surviving file is retired. The current version of docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md distinguishes present runtime behaviour/design obligations from the original session-only, obsolete interface or dated implementation wording. Retirement 2180b4e72 applies only to session-engine portions; live guidance is restored at its current path and receives a separate independent check. No old approval carries to this corrected unit-specific explanation. |
| targetOwner | docs/platform/agent-coordination/history/retired-engine/files/proposals/team-communication-protocol-v1.md |
| targetAnchor | literal-snapshot |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | c3a4d458bb1581e2f7b65a4b653037ba1866eb3ac0ee69dd189c0de195a97578 |
| targetAncestry | \["Historical File: Team Communication Protocol V1"\] |

### Source unit

```text
This is useful because it tests team reasoning without risking Work lifecycle
truth.
```

### Target unit

````text
## Literal Snapshot

~~~~text
# Team Communication Protocol V1

```txt
Document type: Proposal
Audience: Human reviewers, maintainers, documentation agents
Purpose: Preserve source material for Team Communication Protocol V1
Design status: Candidate
Implementation: Not re-verified; source implementation statements remain in the body
Provenance: Retained from docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md at fcfe78cb89585bc9ab23f11bab67d41458834fc4
Writer type: Documentation maintainer
Canonical for: Preserved proposal material for Team Communication Protocol V1; no authority cutover
Use this when: Comparing this candidate with its pinned legacy source
Do not use this for: Inferring current implementation or supersession of retained sources
Last reviewed: UNPROVEN; independent content review pending
Related:
- docs/platform/agent-coordination/vision.md
- docs/platform/agent-coordination/playbooks/coordination-operating-harness.md
- docs/platform/agent-coordination/proposals/step-08-standalone-coordination-protocols.md
Supersedes: None; retained source authority is unchanged
Superseded by: None
Added in candidate: Promotion metadata only; source claims and implementation are not re-decided here
```
Document type: Proposal
Design status: Proposed
Implementation: Partial
Last reviewed: 2026-08-31
Canonical for: nothing until communication contracts are accepted
Original date: 2026-08-28
Scope: role-to-role communication inside coding-domain stage protocols, Work-attached assignments, RunResult evidence, and standalone read-only coordination

## 1. Purpose

Team Dispatch V1 needs a communication protocol, but it must stay smaller than
a mailbox, daemon, or second lifecycle system.

This proposal describes a Work-attached coding-domain protocol and one early
standalone prototype. It is not the universal entry model for Agent
Coordination. Per the [Agent Coordination Foundation Vision](../vision.md), an
agent-led session may coordinate through validated dynamic execution contracts
without a predeclared Workflow/Stage graph.

The protocol defines how roles communicate while `Work` remains the lifecycle
authority:

```txt
Work position
  -> current workflow stage
    -> legal stage operations
      -> selected Assignment
        -> one Run
          -> one RunResult
            -> driver chooses the next legal operation or engine verb
```

The protocol is not a meeting scheduler. It is the set of rules that make one
role's message usable by another role without trusting terminal text or agent
say-so as proof.

## 2. Non-Negotiable Boundaries

```txt
Work is lifecycle authority.
Mission is a lightweight team envelope.
Stage is workflow position.
Stage Operation is one legal task-shaped action inside a stage.
Assignment is a semantic request.
Run is a runtime attempt.
RunResult is normalized result plus evidence.
Herdr is visibility only.
```

Do not introduce `Job` in V1. `Job` remains reserved for a future queue,
scheduler, lease, cancellation, or worker-pool design.

Do not let an Assignment mutate Work lifecycle state by itself. Work moves only
through existing engine verbs such as `fgos discover`, `fgos plan`, `fgos
return`, `fgos ask`, `fgos answer`, and approval/merge verbs.

## 3. Roles

The coding domain starts with the roles already declared in the role graph:

| Role | Responsibility | Typical operation family |
|---|---|---|
| `implementer` | Owns the current Work item, edits repo state, invokes engine verbs, and coordinates legal sub-calls. | `judge-ambiguity`, `shape-plan`, `implement-item`, `fix-verify-red` |
| `researcher` | Gathers evidence and facts. It may read repo context, run approved research tools, or inspect docs. | `resolve-question`, `scout-blast-radius` |
| `reviewer` | Finds correctness, feasibility, regression, and test risks. | `validate-plan`, `review-item` |
| `helper` | Performs an independent scoped piece whose footprint does not collide with the driver's active edit surface. | `scoped-subtask` |
| `advisor` | Answers product, scope, priority, or human-intent questions that cannot be settled from machine evidence. | `answer-question`, selected `advise` interactions |

Role is not executor. A reviewer can run on Codex, Claude, agy, pi, or a future
executor if policy and governance allow it.

Role is not stage owner. A stage owner may dispatch an Assignment to another
role while the Work item stays at the same stage.

## 4. Communication Modes

The role graph's `mode` field has protocol meaning:

| Mode | Meaning | Lifecycle effect | Required evidence |
|---|---|---|---|
| `sync` | Caller waits for a bounded finding or work product, then continues in the same stage. | Work usually stays claimed by the caller; holder may be logged but returns immediately. | Structured result artifact for read-only calls; git/artifact delta for mutating helper work. |
| `async` | Caller cannot continue without another actor or human-adjacent answer. | Work may park, or holder may move until a future reclaim. | A recorded question, answer, review verdict, or blocker with context refs. |

`sync` does not mean invisible. It still needs a recorded handoff or Assignment
RunResult when the result matters to later decisions.

`async` does not mean a new Work item. It becomes Work only when the request
needs independent lifecycle, approval, merge, or backlog visibility.

## 5. Stage Operation Selection

The driver may choose only operations declared for the current stage by
`operationsForStage(domain, stage, { kind })`.

Selection rules:

1. Prefer the primary operation when the stage's normal owner work remains the
   next required action.
2. Choose a secondary operation when a bounded role contribution would unblock
   the stage without creating lifecycle-bearing child work.
3. Create child Work only when the contribution needs its own claim, branch,
   verify, approval, merge, or backlog visibility.
4. Route discovery unresolved ambiguity to `exploring`; discovery must not ask
   the human directly.
5. Refuse operations marked `dispatch: human-only` from cli-spawn assignment
   execution.
6. Refuse synthetic compatibility operations from runtime dispatch unless their
   task-spec file resolves and the caller explicitly accepts compatibility
   dispatch.

Examples:

| Stage | Situation | Operation |
|---|---|---|
| `discovery` | Need machine evidence for ambiguity. | `resolve-question` to `researcher`, then owner decides `clear` or `unclear`. |
| `planning` | Plan is written and needs proof before the edge to executing. | `validate-plan` to `reviewer`. |
| `planning` | A symbol's blast radius is unknown. | `scout-blast-radius` to `researcher`. |
| `executing` | Implementation needs a separate non-overlapping edit. | `scoped-subtask` to `helper`. |
| `executing` | Returned diff needs independent review. | `review-item` to `reviewer`. |
| `executing` | Review or verify reports a concrete red issue. | `fix-verify-red` to `implementer`. |

## 6. Assignment Message Contract

Every assignment prompt must provide the worker with enough information to
produce a usable result without learning fgOS internals.

Required prompt fields:

```txt
Assignment: <assignmentId>
Work: <workId or (none)>
Stage operation: <stage>.<operation>
Role: <role>
Task-spec: <task-spec path>
Objective: <bounded request>
Context refs:
- <ref>
Expected outputs:
- <output>
Result artifact:
- Write JSON to <runDir>/agent-result.json
- Optionally write Markdown to <runDir>/agent-report.md
```

The prompt must say that the worker should not call Work lifecycle verbs unless
the task-spec explicitly says the worker is the lifecycle driver. Ordinary
Assignment workers return artifacts; the driver interprets them.

The prompt must pass refs, not embedded large docs, diffs, transcripts, or
secrets.

## 7. Agent Result Schema

`agent-result.json` is the worker's structured claim. It is not proof by
itself.

Minimal schema:

```json
{
  "status": "done",
  "summary": "One concise result sentence.",
  "findings": [],
  "evidenceRefs": [],
  "nextRecommendedOperation": null
}
```

Allowed status values:

| Status | Meaning |
|---|---|
| `done` | The worker believes the assignment objective is complete. |
| `blocked` | The worker could not complete because a named blocker remains. |
| `failed` | The worker attempted the assignment and produced an error or invalid output. |
| `no-evidence` | The worker can report context but cannot support a completion claim. |

Required fields by status:

| Status | Required fields |
|---|---|
| `done` | `summary`; at least one `evidenceRefs` entry or a companion `agent-report.md` for read-only work; external git/artifact evidence for mutating work. |
| `blocked` | `summary`; `blocker`; `evidenceRefs` when any evidence exists. |
| `failed` | `summary`; `error`. |
| `no-evidence` | `summary`; reason why evidence is absent. |

Optional `nextRecommendedOperation` may name another legal stage operation, but
it is only a recommendation. The driver must verify legality before acting.

## 8. RunResult Confidence

RunResult status and confidence are control-plane judgments.

Confidence ladder:

| Confidence | Meaning | Allowed use |
|---|---|---|
| `verified` | Structured claim plus post-run external evidence such as a new commit, new changed file, test artifact, or verified result file. | May feed lifecycle decisions that require proof. |
| `reported` | Structured claim plus a worker-produced report for read-only consult/review work. | May feed driver judgment, but should not close mutating work. |
| `inferred` | Post-run external evidence exists but no structured claim exists. | May be surfaced for inspection; driver should avoid automatic lifecycle movement. |
| `no-evidence` | Process settled without proof. | Must not advance Work. |
| `failed` | Timeout, nonzero exit, signal, invalid schema, or explicit failure. | Must not advance Work. |

The driver must treat `done/no-evidence` as not done. It may retry, ask for a
proper artifact, or route to a different legal operation.

## 9. Handoff Versus Assignment

Use `handoff` when the interaction is a short role-axis record around work the
current session already performed or directly observed.

Use Assignment when:

- another executor, provider, role, or tool performs the action;
- the result will be read by a later driver turn;
- the result needs Run/RunResult evidence;
- the interaction may fail independently;
- a read-only consult/review needs an artifact rather than a one-line summary.

`handoff` remains useful for visibility and role-holder truth. It is not enough
evidence for a Team Dispatch operation once the result influences a lifecycle
decision.

## 10. Coding-Domain Stage Protocols

### 10.1 Discovery

Discovery is machine-alone.

Allowed behavior:

- owner reads existing Work context;
- owner consults researcher helpers for evidence;
- owner logs consult interactions;
- owner chooses `clear` or `unclear`;
- `clear` can route to planning;
- `unclear` routes to exploring.

Forbidden behavior:

- asking the human directly;
- parking as `awaiting-human`;
- treating a helper's unsupported answer as proof;
- opening a new Work item just to answer a bounded evidence question.

### 10.2 Exploring

Exploring is the human-adjacent decision-locking stage.

Allowed behavior:

- advisor interaction for material, grounded, answerable product questions;
- researcher consult for repo or external facts;
- lock decisions into CONTEXT.md.

Exploring may ask a human. It should ask only after machine evidence has been
gathered and the question is self-contained.

### 10.3 Planning

Planning has two main operation families:

- `shape-plan` by implementer;
- `validate-plan` by reviewer.

The stage owner may write the plan directly, but validation should move toward
a reviewer Assignment once Step 05 adopts operation choice.

`validate-plan` is a real reviewer-role operation when dispatched through
Assignment. Prose that says validating is only an implementer function must be
reconciled before driver adoption.

### 10.4 Executing

Executing has the richest team protocol:

- implementer owns the main edit path;
- researcher may answer blast-radius or API/pattern questions;
- helper may take independent scoped work;
- reviewer may review returned diffs or candidate fixes;
- advisor handles product/scope questions that exceed locked decisions.

The implementer remains responsible for Work lifecycle. Helper/reviewer
assignments return artifacts and recommendations unless explicitly promoted to
child Work.

## 11. Coordination Operating Harness

Multi-agent implementation benefits from a durable operating harness:

```txt
trace/index.md
trace/current-cell.md
trace/<cell>.md
prompt templates
review and red-team gates
live proof capture
```

This harness is documented in
[coordination-operating-harness.md](../playbooks/coordination-operating-harness.md). It is
supporting engineering practice, not Step 07 runtime infrastructure and not a
lifecycle system. Its job is to keep coordinator, doer, reviewer, and red-team
sessions aligned while preserving token budget and proof traceability.

The harness should be used where it reduces implementation drift, but dogfooding
it is not a runtime dependency gate for standalone coordination.

## 12. Standalone Read-Only Coordination

The current mission-lite implementation is a prototype for standalone read-only
coordination. Its generalization is still under discussion in
[Step 08](step-08-standalone-coordination-protocols.md) and depends on the relevant
CoordinationSession/AdhocTask contracts from
[Step 07](step-07-coordination-session-adhoc-task.md).

A standalone session may group assignments without a Work item for read-only
coordination:

```txt
mission-lite objective
  -> researcher background brief
  -> reviewer counter-argument
  -> advisor product framing
  -> driver synthesis
```

Mission-lite currently borrows coding Stage Operations. That is prototype
behavior, not a foundation requirement. The target standalone path may instead
construct validated dynamic Assignments and may optionally select a reusable
protocol.

Rules:

- no Work lifecycle;
- no repo mutation;
- no approval/merge semantics;
- every role result is a structured artifact;
- synthesis is a report, not a state transition;
- any resulting implementation proposal becomes ordinary Work before code is
  changed.

Good first case:

```txt
Question: Should coding-domain planning validation run as a reviewer Assignment
or stay as direct same-session validation?
```

This is useful because it tests team reasoning without risking Work lifecycle
truth.

## 13. Acceptance Criteria For V1 Protocol

The protocol is ready for driver adoption when:

- every runtime assignment receives an explicit result artifact path;
- malformed or missing structured claims cannot produce `verified` or
  `reported`;
- dirty-before files cannot be counted as post-run evidence;
- read-only operations can return `reported` only through worker artifacts;
- mutating operations require post-run external evidence;
- stage skills agree on when Assignment is used versus direct invocation;
- `validate-plan` role prose is consistent across skill and task-spec docs;
- discovery remains machine-alone.
~~~~
````

### Unified diff

````diff
--- "docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-63"
+++ "docs/platform/agent-coordination/history/retired-engine/files/proposals/team-communication-protocol-v1.md#literal-snapshot"
@@ -1,2 +1,391 @@
+## Literal Snapshot
+
+~~~~text
+# Team Communication Protocol V1
+
+```txt
+Document type: Proposal
+Audience: Human reviewers, maintainers, documentation agents
+Purpose: Preserve source material for Team Communication Protocol V1
+Design status: Candidate
+Implementation: Not re-verified; source implementation statements remain in the body
+Provenance: Retained from docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md at fcfe78cb89585bc9ab23f11bab67d41458834fc4
+Writer type: Documentation maintainer
+Canonical for: Preserved proposal material for Team Communication Protocol V1; no authority cutover
+Use this when: Comparing this candidate with its pinned legacy source
+Do not use this for: Inferring current implementation or supersession of retained sources
+Last reviewed: UNPROVEN; independent content review pending
+Related:
+- docs/platform/agent-coordination/vision.md
+- docs/platform/agent-coordination/playbooks/coordination-operating-harness.md
+- docs/platform/agent-coordination/proposals/step-08-standalone-coordination-protocols.md
+Supersedes: None; retained source authority is unchanged
+Superseded by: None
+Added in candidate: Promotion metadata only; source claims and implementation are not re-decided here
+```
+Document type: Proposal
+Design status: Proposed
+Implementation: Partial
+Last reviewed: 2026-08-31
+Canonical for: nothing until communication contracts are accepted
+Original date: 2026-08-28
+Scope: role-to-role communication inside coding-domain stage protocols, Work-attached assignments, RunResult evidence, and standalone read-only coordination
+
+## 1. Purpose
+
+Team Dispatch V1 needs a communication protocol, but it must stay smaller than
+a mailbox, daemon, or second lifecycle system.
+
+This proposal describes a Work-attached coding-domain protocol and one early
+standalone prototype. It is not the universal entry model for Agent
+Coordination. Per the [Agent Coordination Foundation Vision](../vision.md), an
+agent-led session may coordinate through validated dynamic execution contracts
+without a predeclared Workflow/Stage graph.
+
+The protocol defines how roles communicate while `Work` remains the lifecycle
+authority:
+
+```txt
+Work position
+  -> current workflow stage
+    -> legal stage operations
+      -> selected Assignment
+        -> one Run
+          -> one RunResult
+            -> driver chooses the next legal operation or engine verb
+```
+
+The protocol is not a meeting scheduler. It is the set of rules that make one
+role's message usable by another role without trusting terminal text or agent
+say-so as proof.
+
+## 2. Non-Negotiable Boundaries
+
+```txt
+Work is lifecycle authority.
+Mission is a lightweight team envelope.
+Stage is workflow position.
+Stage Operation is one legal task-shaped action inside a stage.
+Assignment is a semantic request.
+Run is a runtime attempt.
+RunResult is normalized result plus evidence.
+Herdr is visibility only.
+```
+
+Do not introduce `Job` in V1. `Job` remains reserved for a future queue,
+scheduler, lease, cancellation, or worker-pool design.
+
+Do not let an Assignment mutate Work lifecycle state by itself. Work moves only
+through existing engine verbs such as `fgos discover`, `fgos plan`, `fgos
+return`, `fgos ask`, `fgos answer`, and approval/merge verbs.
+
+## 3. Roles
+
+The coding domain starts with the roles already declared in the role graph:
+
+| Role | Responsibility | Typical operation family |
+|---|---|---|
+| `implementer` | Owns the current Work item, edits repo state, invokes engine verbs, and coordinates legal sub-calls. | `judge-ambiguity`, `shape-plan`, `implement-item`, `fix-verify-red` |
+| `researcher` | Gathers evidence and facts. It may read repo context, run approved research tools, or inspect docs. | `resolve-question`, `scout-blast-radius` |
+| `reviewer` | Finds correctness, feasibility, regression, and test risks. | `validate-plan`, `review-item` |
+| `helper` | Performs an independent scoped piece whose footprint does not collide with the driver's active edit surface. | `scoped-subtask` |
+| `advisor` | Answers product, scope, priority, or human-intent questions that cannot be settled from machine evidence. | `answer-question`, selected `advise` interactions |
+
+Role is not executor. A reviewer can run on Codex, Claude, agy, pi, or a future
+executor if policy and governance allow it.
+
+Role is not stage owner. A stage owner may dispatch an Assignment to another
+role while the Work item stays at the same stage.
+
+## 4. Communication Modes
+
+The role graph's `mode` field has protocol meaning:
+
+| Mode | Meaning | Lifecycle effect | Required evidence |
+|---|---|---|---|
+| `sync` | Caller waits for a bounded finding or work product, then continues in the same stage. | Work usually stays claimed by the caller; holder may be logged but returns immediately. | Structured result artifact for read-only calls; git/artifact delta for mutating helper work. |
+| `async` | Caller cannot continue without another actor or human-adjacent answer. | Work may park, or holder may move until a future reclaim. | A recorded question, answer, review verdict, or blocker with context refs. |
+
+`sync` does not mean invisible. It still needs a recorded handoff or Assignment
+RunResult when the result matters to later decisions.
+
+`async` does not mean a new Work item. It becomes Work only when the request
+needs independent lifecycle, approval, merge, or backlog visibility.
+
+## 5. Stage Operation Selection
+
+The driver may choose only operations declared for the current stage by
+`operationsForStage(domain, stage, { kind })`.
+
+Selection rules:
+
+1. Prefer the primary operation when the stage's normal owner work remains the
+   next required action.
+2. Choose a secondary operation when a bounded role contribution would unblock
+   the stage without creating lifecycle-bearing child work.
+3. Create child Work only when the contribution needs its own claim, branch,
+   verify, approval, merge, or backlog visibility.
+4. Route discovery unresolved ambiguity to `exploring`; discovery must not ask
+   the human directly.
+5. Refuse operations marked `dispatch: human-only` from cli-spawn assignment
+   execution.
+6. Refuse synthetic compatibility operations from runtime dispatch unless their
+   task-spec file resolves and the caller explicitly accepts compatibility
+   dispatch.
+
+Examples:
+
+| Stage | Situation | Operation |
+|---|---|---|
+| `discovery` | Need machine evidence for ambiguity. | `resolve-question` to `researcher`, then owner decides `clear` or `unclear`. |
+| `planning` | Plan is written and needs proof before the edge to executing. | `validate-plan` to `reviewer`. |
+| `planning` | A symbol's blast radius is unknown. | `scout-blast-radius` to `researcher`. |
+| `executing` | Implementation needs a separate non-overlapping edit. | `scoped-subtask` to `helper`. |
+| `executing` | Returned diff needs independent review. | `review-item` to `reviewer`. |
+| `executing` | Review or verify reports a concrete red issue. | `fix-verify-red` to `implementer`. |
+
+## 6. Assignment Message Contract
+
+Every assignment prompt must provide the worker with enough information to
+produce a usable result without learning fgOS internals.
+
+Required prompt fields:
+
+```txt
+Assignment: <assignmentId>
+Work: <workId or (none)>
+Stage operation: <stage>.<operation>
+Role: <role>
+Task-spec: <task-spec path>
+Objective: <bounded request>
+Context refs:
+- <ref>
+Expected outputs:
+- <output>
+Result artifact:
+- Write JSON to <runDir>/agent-result.json
+- Optionally write Markdown to <runDir>/agent-report.md
+```
+
+The prompt must say that the worker should not call Work lifecycle verbs unless
+the task-spec explicitly says the worker is the lifecycle driver. Ordinary
+Assignment workers return artifacts; the driver interprets them.
+
+The prompt must pass refs, not embedded large docs, diffs, transcripts, or
+secrets.
+
+## 7. Agent Result Schema
+
+`agent-result.json` is the worker's structured claim. It is not proof by
+itself.
+
+Minimal schema:
+
+```json
+{
+  "status": "done",
+  "summary": "One concise result sentence.",
+  "findings": [],
+  "evidenceRefs": [],
+  "nextRecommendedOperation": null
+}
+```
+
+Allowed status values:
+
+| Status | Meaning |
+|---|---|
+| `done` | The worker believes the assignment objective is complete. |
+| `blocked` | The worker could not complete because a named blocker remains. |
+| `failed` | The worker attempted the assignment and produced an error or invalid output. |
+| `no-evidence` | The worker can report context but cannot support a completion claim. |
+
+Required fields by status:
+
+| Status | Required fields |
+|---|---|
+| `done` | `summary`; at least one `evidenceRefs` entry or a companion `agent-report.md` for read-only work; external git/artifact evidence for mutating work. |
+| `blocked` | `summary`; `blocker`; `evidenceRefs` when any evidence exists. |
+| `failed` | `summary`; `error`. |
+| `no-evidence` | `summary`; reason why evidence is absent. |
+
+Optional `nextRecommendedOperation` may name another legal stage operation, but
+it is only a recommendation. The driver must verify legality before acting.
+
+## 8. RunResult Confidence
+
+RunResult status and confidence are control-plane judgments.
+
+Confidence ladder:
+
+| Confidence | Meaning | Allowed use |
+|---|---|---|
+| `verified` | Structured claim plus post-run external evidence such as a new commit, new changed file, test artifact, or verified result file. | May feed lifecycle decisions that require proof. |
+| `reported` | Structured claim plus a worker-produced report for read-only consult/review work. | May feed driver judgment, but should not close mutating work. |
+| `inferred` | Post-run external evidence exists but no structured claim exists. | May be surfaced for inspection; driver should avoid automatic lifecycle movement. |
+| `no-evidence` | Process settled without proof. | Must not advance Work. |
+| `failed` | Timeout, nonzero exit, signal, invalid schema, or explicit failure. | Must not advance Work. |
+
+The driver must treat `done/no-evidence` as not done. It may retry, ask for a
+proper artifact, or route to a different legal operation.
+
+## 9. Handoff Versus Assignment
+
+Use `handoff` when the interaction is a short role-axis record around work the
+current session already performed or directly observed.
+
+Use Assignment when:
+
+- another executor, provider, role, or tool performs the action;
+- the result will be read by a later driver turn;
+- the result needs Run/RunResult evidence;
+- the interaction may fail independently;
+- a read-only consult/review needs an artifact rather than a one-line summary.
+
+`handoff` remains useful for visibility and role-holder truth. It is not enough
+evidence for a Team Dispatch operation once the result influences a lifecycle
+decision.
+
+## 10. Coding-Domain Stage Protocols
+
+### 10.1 Discovery
+
+Discovery is machine-alone.
+
+Allowed behavior:
+
+- owner reads existing Work context;
+- owner consults researcher helpers for evidence;
+- owner logs consult interactions;
+- owner chooses `clear` or `unclear`;
+- `clear` can route to planning;
+- `unclear` routes to exploring.
+
+Forbidden behavior:
+
+- asking the human directly;
+- parking as `awaiting-human`;
+- treating a helper's unsupported answer as proof;
+- opening a new Work item just to answer a bounded evidence question.
+
+### 10.2 Exploring
+
+Exploring is the human-adjacent decision-locking stage.
+
+Allowed behavior:
+
+- advisor interaction for material, grounded, answerable product questions;
+- researcher consult for repo or external facts;
+- lock decisions into CONTEXT.md.
+
+Exploring may ask a human. It should ask only after machine evidence has been
+gathered and the question is self-contained.
+
+### 10.3 Planning
+
+Planning has two main operation families:
+
+- `shape-plan` by implementer;
+- `validate-plan` by reviewer.
+
+The stage owner may write the plan directly, but validation should move toward
+a reviewer Assignment once Step 05 adopts operation choice.
+
+`validate-plan` is a real reviewer-role operation when dispatched through
+Assignment. Prose that says validating is only an implementer function must be
+reconciled before driver adoption.
+
+### 10.4 Executing
+
+Executing has the richest team protocol:
+
+- implementer owns the main edit path;
+- researcher may answer blast-radius or API/pattern questions;
+- helper may take independent scoped work;
+- reviewer may review returned diffs or candidate fixes;
+- advisor handles product/scope questions that exceed locked decisions.
+
+The implementer remains responsible for Work lifecycle. Helper/reviewer
+assignments return artifacts and recommendations unless explicitly promoted to
+child Work.
+
+## 11. Coordination Operating Harness
+
+Multi-agent implementation benefits from a durable operating harness:
+
+```txt
+trace/index.md
+trace/current-cell.md
+trace/<cell>.md
+prompt templates
+review and red-team gates
+live proof capture
+```
+
+This harness is documented in
+[coordination-operating-harness.md](../playbooks/coordination-operating-harness.md). It is
+supporting engineering practice, not Step 07 runtime infrastructure and not a
+lifecycle system. Its job is to keep coordinator, doer, reviewer, and red-team
+sessions aligned while preserving token budget and proof traceability.
+
+The harness should be used where it reduces implementation drift, but dogfooding
+it is not a runtime dependency gate for standalone coordination.
+
+## 12. Standalone Read-Only Coordination
+
+The current mission-lite implementation is a prototype for standalone read-only
+coordination. Its generalization is still under discussion in
+[Step 08](step-08-standalone-coordination-protocols.md) and depends on the relevant
+CoordinationSession/AdhocTask contracts from
+[Step 07](step-07-coordination-session-adhoc-task.md).
+
+A standalone session may group assignments without a Work item for read-only
+coordination:
+
+```txt
+mission-lite objective
+  -> researcher background brief
+  -> reviewer counter-argument
+  -> advisor product framing
+  -> driver synthesis
+```
+
+Mission-lite currently borrows coding Stage Operations. That is prototype
+behavior, not a foundation requirement. The target standalone path may instead
+construct validated dynamic Assignments and may optionally select a reusable
+protocol.
+
+Rules:
+
+- no Work lifecycle;
+- no repo mutation;
+- no approval/merge semantics;
+- every role result is a structured artifact;
+- synthesis is a report, not a state transition;
+- any resulting implementation proposal becomes ordinary Work before code is
+  changed.
+
+Good first case:
+
+```txt
+Question: Should coding-domain planning validation run as a reviewer Assignment
+or stay as direct same-session validation?
+```
+
 This is useful because it tests team reasoning without risking Work lifecycle
-truth.
\ No newline at end of file
+truth.
+
+## 13. Acceptance Criteria For V1 Protocol
+
+The protocol is ready for driver adoption when:
+
+- every runtime assignment receives an explicit result artifact path;
+- malformed or missing structured claims cannot produce `verified` or
+  `reported`;
+- dirty-before files cannot be counted as post-run evidence;
+- read-only operations can return `reported` only through worker artifacts;
+- mutating operations require post-run external evidence;
+- stage skills agree on when Assignment is used versus direct invocation;
+- `validate-plan` role prose is consistent across skill and task-spec docs;
+- discovery remains machine-alone.
+~~~~
\ No newline at end of file
````

## claim_bf7bc8618e95e7e89fdfb50cef192b53

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#13-acceptance-criteria-for-v1-protocol

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#13-acceptance-criteria-for-v1-protocol

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_bf7bc8618e95e7e89fdfb50cef192b53 |
| sourceUnitDigest | 47ede54461f940b4f0cdf6846459520e09e43ff36bc485d69735315112dc0bae |
| claimKind | contract |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#13-acceptance-criteria-for-v1-protocol is retained in docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#13-acceptance-criteria-for-v1-protocol. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | 13-acceptance-criteria-for-v1-protocol |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | 47ede54461f940b4f0cdf6846459520e09e43ff36bc485d69735315112dc0bae |
| targetAncestry | \["Team Communication Protocol V1"\] |

### Source unit

```text
## 13. Acceptance Criteria For V1 Protocol

The protocol is ready for driver adoption when:

- every runtime assignment receives an explicit result artifact path;
- malformed or missing structured claims cannot produce `verified` or
  `reported`;
- dirty-before files cannot be counted as post-run evidence;
- read-only operations can return `reported` only through worker artifacts;
- mutating operations require post-run external evidence;
- stage skills agree on when Assignment is used versus direct invocation;
- `validate-plan` role prose is consistent across skill and task-spec docs;
- discovery remains machine-alone.
```

### Target unit

```text
## 13. Acceptance Criteria For V1 Protocol

The protocol is ready for driver adoption when:

- every runtime assignment receives an explicit result artifact path;
- malformed or missing structured claims cannot produce `verified` or
  `reported`;
- dirty-before files cannot be counted as post-run evidence;
- read-only operations can return `reported` only through worker artifacts;
- mutating operations require post-run external evidence;
- stage skills agree on when Assignment is used versus direct invocation;
- `validate-plan` role prose is consistent across skill and task-spec docs;
- discovery remains machine-alone.
```

### Unified diff

```diff
No text difference.
```

## claim_033a7b790516e8618c276525412173f8

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-64

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-58

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_033a7b790516e8618c276525412173f8 |
| sourceUnitDigest | 734cc0979352c1a8d01a9e6c05a6fd4d544665459d9c6bdc8a3e71b9622321d5 |
| claimKind | contract |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-64 is retained in docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-58. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-58 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | 734cc0979352c1a8d01a9e6c05a6fd4d544665459d9c6bdc8a3e71b9622321d5 |
| targetAncestry | \["Team Communication Protocol V1","13. Acceptance Criteria For V1 Protocol"\] |

### Source unit

```text
The protocol is ready for driver adoption when:
```

### Target unit

```text
The protocol is ready for driver adoption when:
```

### Unified diff

```diff
No text difference.
```

## claim_6ed12fe83f43ad052bbcde7a88beee1d

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-65

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-59

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_6ed12fe83f43ad052bbcde7a88beee1d |
| sourceUnitDigest | aaded8bcb540dd65483aeec1913efc98975a6a30b92a0e1dbcd6505a5f03e4ae |
| claimKind | contract |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-65 is retained in docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-59. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-59 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| targetUnitDigest | aaded8bcb540dd65483aeec1913efc98975a6a30b92a0e1dbcd6505a5f03e4ae |
| targetAncestry | \["Team Communication Protocol V1","13. Acceptance Criteria For V1 Protocol"\] |

### Source unit

```text
- every runtime assignment receives an explicit result artifact path;
- malformed or missing structured claims cannot produce `verified` or
  `reported`;
- dirty-before files cannot be counted as post-run evidence;
- read-only operations can return `reported` only through worker artifacts;
- mutating operations require post-run external evidence;
- stage skills agree on when Assignment is used versus direct invocation;
- `validate-plan` role prose is consistent across skill and task-spec docs;
- discovery remains machine-alone.
```

### Target unit

```text
- every runtime assignment receives an explicit result artifact path;
- malformed or missing structured claims cannot produce `verified` or
  `reported`;
- dirty-before files cannot be counted as post-run evidence;
- read-only operations can return `reported` only through worker artifacts;
- mutating operations require post-run external evidence;
- stage skills agree on when Assignment is used versus direct invocation;
- `validate-plan` role prose is consistent across skill and task-spec docs;
- discovery remains machine-alone.
```

### Unified diff

```diff
No text difference.
```

## Unmatched candidate units

### docs/platform/agent-coordination/history/retired-engine/files/proposals/team-communication-protocol-v1.md#historical-file-team-communication-protocol-v1

````text
# Historical File: Team Communication Protocol V1

```txt
Document type: History
Audience: Human reviewer, maintainer and documentation agent
Purpose: Preserve the complete classified input as non-authority historical evidence
Design status: Candidate
Implementation: Historical snapshot; not current implementation or authority
Provenance: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md at d23045c2de83e3508fda8fd2580b43ece2e1e046; SHA256 6f9d87a2f4189617629be45686edcbbb794e74bf823d9a319645576c9b5cb357
Writer type: Documentation maintainer
Canonical for: Historical evidence only; no current authority
Use this when: Auditing original claims or section-level retirement
Do not use this for: Current runtime behaviour, accepted proposals or executable routing
Last reviewed: Pending independent whole-area review
Related:
- docs/platform/agent-coordination/README.md
- docs/specs/runner.md
Supersedes: None; this is an exact historical carrier
Superseded by: Current execution ownership in docs/specs/runner.md
Added in candidate: Historical framing only; literal file bytes are unchanged
```

The coordination engine was retired in `2180b4e72701bb090288af8fe8021008d9d42079`; see `docs/specs/runner.md` **CoordinationSession (Lịch sử — đã thu hồi per P4; thay bằng CollaborationPattern & Workflow runner)**. Original statuses and instructions below are dated evidence, not current claims.
````

### docs/platform/agent-coordination/history/retired-engine/files/proposals/team-communication-protocol-v1.md#unheaded-block-1

````text
```txt
Document type: History
Audience: Human reviewer, maintainer and documentation agent
Purpose: Preserve the complete classified input as non-authority historical evidence
Design status: Candidate
Implementation: Historical snapshot; not current implementation or authority
Provenance: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md at d23045c2de83e3508fda8fd2580b43ece2e1e046; SHA256 6f9d87a2f4189617629be45686edcbbb794e74bf823d9a319645576c9b5cb357
Writer type: Documentation maintainer
Canonical for: Historical evidence only; no current authority
Use this when: Auditing original claims or section-level retirement
Do not use this for: Current runtime behaviour, accepted proposals or executable routing
Last reviewed: Pending independent whole-area review
Related:
- docs/platform/agent-coordination/README.md
- docs/specs/runner.md
Supersedes: None; this is an exact historical carrier
Superseded by: Current execution ownership in docs/specs/runner.md
Added in candidate: Historical framing only; literal file bytes are unchanged
```
````

### docs/platform/agent-coordination/history/retired-engine/files/proposals/team-communication-protocol-v1.md#unheaded-block-2

```text
The coordination engine was retired in `2180b4e72701bb090288af8fe8021008d9d42079`; see `docs/specs/runner.md` **CoordinationSession (Lịch sử — đã thu hồi per P4; thay bằng CollaborationPattern & Workflow runner)**. Original statuses and instructions below are dated evidence, not current claims.
```

### docs/platform/agent-coordination/history/retired-engine/files/proposals/team-communication-protocol-v1.md#unheaded-block-3

````text
~~~~text
# Team Communication Protocol V1

```txt
Document type: Proposal
Audience: Human reviewers, maintainers, documentation agents
Purpose: Preserve source material for Team Communication Protocol V1
Design status: Candidate
Implementation: Not re-verified; source implementation statements remain in the body
Provenance: Retained from docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md at fcfe78cb89585bc9ab23f11bab67d41458834fc4
Writer type: Documentation maintainer
Canonical for: Preserved proposal material for Team Communication Protocol V1; no authority cutover
Use this when: Comparing this candidate with its pinned legacy source
Do not use this for: Inferring current implementation or supersession of retained sources
Last reviewed: UNPROVEN; independent content review pending
Related:
- docs/platform/agent-coordination/vision.md
- docs/platform/agent-coordination/playbooks/coordination-operating-harness.md
- docs/platform/agent-coordination/proposals/step-08-standalone-coordination-protocols.md
Supersedes: None; retained source authority is unchanged
Superseded by: None
Added in candidate: Promotion metadata only; source claims and implementation are not re-decided here
```
Document type: Proposal
Design status: Proposed
Implementation: Partial
Last reviewed: 2026-08-31
Canonical for: nothing until communication contracts are accepted
Original date: 2026-08-28
Scope: role-to-role communication inside coding-domain stage protocols, Work-attached assignments, RunResult evidence, and standalone read-only coordination

## 1. Purpose

Team Dispatch V1 needs a communication protocol, but it must stay smaller than
a mailbox, daemon, or second lifecycle system.

This proposal describes a Work-attached coding-domain protocol and one early
standalone prototype. It is not the universal entry model for Agent
Coordination. Per the [Agent Coordination Foundation Vision](../vision.md), an
agent-led session may coordinate through validated dynamic execution contracts
without a predeclared Workflow/Stage graph.

The protocol defines how roles communicate while `Work` remains the lifecycle
authority:

```txt
Work position
  -> current workflow stage
    -> legal stage operations
      -> selected Assignment
        -> one Run
          -> one RunResult
            -> driver chooses the next legal operation or engine verb
```

The protocol is not a meeting scheduler. It is the set of rules that make one
role's message usable by another role without trusting terminal text or agent
say-so as proof.

## 2. Non-Negotiable Boundaries

```txt
Work is lifecycle authority.
Mission is a lightweight team envelope.
Stage is workflow position.
Stage Operation is one legal task-shaped action inside a stage.
Assignment is a semantic request.
Run is a runtime attempt.
RunResult is normalized result plus evidence.
Herdr is visibility only.
```

Do not introduce `Job` in V1. `Job` remains reserved for a future queue,
scheduler, lease, cancellation, or worker-pool design.

Do not let an Assignment mutate Work lifecycle state by itself. Work moves only
through existing engine verbs such as `fgos discover`, `fgos plan`, `fgos
return`, `fgos ask`, `fgos answer`, and approval/merge verbs.

## 3. Roles

The coding domain starts with the roles already declared in the role graph:

| Role | Responsibility | Typical operation family |
|---|---|---|
| `implementer` | Owns the current Work item, edits repo state, invokes engine verbs, and coordinates legal sub-calls. | `judge-ambiguity`, `shape-plan`, `implement-item`, `fix-verify-red` |
| `researcher` | Gathers evidence and facts. It may read repo context, run approved research tools, or inspect docs. | `resolve-question`, `scout-blast-radius` |
| `reviewer` | Finds correctness, feasibility, regression, and test risks. | `validate-plan`, `review-item` |
| `helper` | Performs an independent scoped piece whose footprint does not collide with the driver's active edit surface. | `scoped-subtask` |
| `advisor` | Answers product, scope, priority, or human-intent questions that cannot be settled from machine evidence. | `answer-question`, selected `advise` interactions |

Role is not executor. A reviewer can run on Codex, Claude, agy, pi, or a future
executor if policy and governance allow it.

Role is not stage owner. A stage owner may dispatch an Assignment to another
role while the Work item stays at the same stage.

## 4. Communication Modes

The role graph's `mode` field has protocol meaning:

| Mode | Meaning | Lifecycle effect | Required evidence |
|---|---|---|---|
| `sync` | Caller waits for a bounded finding or work product, then continues in the same stage. | Work usually stays claimed by the caller; holder may be logged but returns immediately. | Structured result artifact for read-only calls; git/artifact delta for mutating helper work. |
| `async` | Caller cannot continue without another actor or human-adjacent answer. | Work may park, or holder may move until a future reclaim. | A recorded question, answer, review verdict, or blocker with context refs. |

`sync` does not mean invisible. It still needs a recorded handoff or Assignment
RunResult when the result matters to later decisions.

`async` does not mean a new Work item. It becomes Work only when the request
needs independent lifecycle, approval, merge, or backlog visibility.

## 5. Stage Operation Selection

The driver may choose only operations declared for the current stage by
`operationsForStage(domain, stage, { kind })`.

Selection rules:

1. Prefer the primary operation when the stage's normal owner work remains the
   next required action.
2. Choose a secondary operation when a bounded role contribution would unblock
   the stage without creating lifecycle-bearing child work.
3. Create child Work only when the contribution needs its own claim, branch,
   verify, approval, merge, or backlog visibility.
4. Route discovery unresolved ambiguity to `exploring`; discovery must not ask
   the human directly.
5. Refuse operations marked `dispatch: human-only` from cli-spawn assignment
   execution.
6. Refuse synthetic compatibility operations from runtime dispatch unless their
   task-spec file resolves and the caller explicitly accepts compatibility
   dispatch.

Examples:

| Stage | Situation | Operation |
|---|---|---|
| `discovery` | Need machine evidence for ambiguity. | `resolve-question` to `researcher`, then owner decides `clear` or `unclear`. |
| `planning` | Plan is written and needs proof before the edge to executing. | `validate-plan` to `reviewer`. |
| `planning` | A symbol's blast radius is unknown. | `scout-blast-radius` to `researcher`. |
| `executing` | Implementation needs a separate non-overlapping edit. | `scoped-subtask` to `helper`. |
| `executing` | Returned diff needs independent review. | `review-item` to `reviewer`. |
| `executing` | Review or verify reports a concrete red issue. | `fix-verify-red` to `implementer`. |

## 6. Assignment Message Contract

Every assignment prompt must provide the worker with enough information to
produce a usable result without learning fgOS internals.

Required prompt fields:

```txt
Assignment: <assignmentId>
Work: <workId or (none)>
Stage operation: <stage>.<operation>
Role: <role>
Task-spec: <task-spec path>
Objective: <bounded request>
Context refs:
- <ref>
Expected outputs:
- <output>
Result artifact:
- Write JSON to <runDir>/agent-result.json
- Optionally write Markdown to <runDir>/agent-report.md
```

The prompt must say that the worker should not call Work lifecycle verbs unless
the task-spec explicitly says the worker is the lifecycle driver. Ordinary
Assignment workers return artifacts; the driver interprets them.

The prompt must pass refs, not embedded large docs, diffs, transcripts, or
secrets.

## 7. Agent Result Schema

`agent-result.json` is the worker's structured claim. It is not proof by
itself.

Minimal schema:

```json
{
  "status": "done",
  "summary": "One concise result sentence.",
  "findings": [],
  "evidenceRefs": [],
  "nextRecommendedOperation": null
}
```

Allowed status values:

| Status | Meaning |
|---|---|
| `done` | The worker believes the assignment objective is complete. |
| `blocked` | The worker could not complete because a named blocker remains. |
| `failed` | The worker attempted the assignment and produced an error or invalid output. |
| `no-evidence` | The worker can report context but cannot support a completion claim. |

Required fields by status:

| Status | Required fields |
|---|---|
| `done` | `summary`; at least one `evidenceRefs` entry or a companion `agent-report.md` for read-only work; external git/artifact evidence for mutating work. |
| `blocked` | `summary`; `blocker`; `evidenceRefs` when any evidence exists. |
| `failed` | `summary`; `error`. |
| `no-evidence` | `summary`; reason why evidence is absent. |

Optional `nextRecommendedOperation` may name another legal stage operation, but
it is only a recommendation. The driver must verify legality before acting.

## 8. RunResult Confidence

RunResult status and confidence are control-plane judgments.

Confidence ladder:

| Confidence | Meaning | Allowed use |
|---|---|---|
| `verified` | Structured claim plus post-run external evidence such as a new commit, new changed file, test artifact, or verified result file. | May feed lifecycle decisions that require proof. |
| `reported` | Structured claim plus a worker-produced report for read-only consult/review work. | May feed driver judgment, but should not close mutating work. |
| `inferred` | Post-run external evidence exists but no structured claim exists. | May be surfaced for inspection; driver should avoid automatic lifecycle movement. |
| `no-evidence` | Process settled without proof. | Must not advance Work. |
| `failed` | Timeout, nonzero exit, signal, invalid schema, or explicit failure. | Must not advance Work. |

The driver must treat `done/no-evidence` as not done. It may retry, ask for a
proper artifact, or route to a different legal operation.

## 9. Handoff Versus Assignment

Use `handoff` when the interaction is a short role-axis record around work the
current session already performed or directly observed.

Use Assignment when:

- another executor, provider, role, or tool performs the action;
- the result will be read by a later driver turn;
- the result needs Run/RunResult evidence;
- the interaction may fail independently;
- a read-only consult/review needs an artifact rather than a one-line summary.

`handoff` remains useful for visibility and role-holder truth. It is not enough
evidence for a Team Dispatch operation once the result influences a lifecycle
decision.

## 10. Coding-Domain Stage Protocols

### 10.1 Discovery

Discovery is machine-alone.

Allowed behavior:

- owner reads existing Work context;
- owner consults researcher helpers for evidence;
- owner logs consult interactions;
- owner chooses `clear` or `unclear`;
- `clear` can route to planning;
- `unclear` routes to exploring.

Forbidden behavior:

- asking the human directly;
- parking as `awaiting-human`;
- treating a helper's unsupported answer as proof;
- opening a new Work item just to answer a bounded evidence question.

### 10.2 Exploring

Exploring is the human-adjacent decision-locking stage.

Allowed behavior:

- advisor interaction for material, grounded, answerable product questions;
- researcher consult for repo or external facts;
- lock decisions into CONTEXT.md.

Exploring may ask a human. It should ask only after machine evidence has been
gathered and the question is self-contained.

### 10.3 Planning

Planning has two main operation families:

- `shape-plan` by implementer;
- `validate-plan` by reviewer.

The stage owner may write the plan directly, but validation should move toward
a reviewer Assignment once Step 05 adopts operation choice.

`validate-plan` is a real reviewer-role operation when dispatched through
Assignment. Prose that says validating is only an implementer function must be
reconciled before driver adoption.

### 10.4 Executing

Executing has the richest team protocol:

- implementer owns the main edit path;
- researcher may answer blast-radius or API/pattern questions;
- helper may take independent scoped work;
- reviewer may review returned diffs or candidate fixes;
- advisor handles product/scope questions that exceed locked decisions.

The implementer remains responsible for Work lifecycle. Helper/reviewer
assignments return artifacts and recommendations unless explicitly promoted to
child Work.

## 11. Coordination Operating Harness

Multi-agent implementation benefits from a durable operating harness:

```txt
trace/index.md
trace/current-cell.md
trace/<cell>.md
prompt templates
review and red-team gates
live proof capture
```

This harness is documented in
[coordination-operating-harness.md](../playbooks/coordination-operating-harness.md). It is
supporting engineering practice, not Step 07 runtime infrastructure and not a
lifecycle system. Its job is to keep coordinator, doer, reviewer, and red-team
sessions aligned while preserving token budget and proof traceability.

The harness should be used where it reduces implementation drift, but dogfooding
it is not a runtime dependency gate for standalone coordination.

## 12. Standalone Read-Only Coordination

The current mission-lite implementation is a prototype for standalone read-only
coordination. Its generalization is still under discussion in
[Step 08](step-08-standalone-coordination-protocols.md) and depends on the relevant
CoordinationSession/AdhocTask contracts from
[Step 07](step-07-coordination-session-adhoc-task.md).

A standalone session may group assignments without a Work item for read-only
coordination:

```txt
mission-lite objective
  -> researcher background brief
  -> reviewer counter-argument
  -> advisor product framing
  -> driver synthesis
```

Mission-lite currently borrows coding Stage Operations. That is prototype
behavior, not a foundation requirement. The target standalone path may instead
construct validated dynamic Assignments and may optionally select a reusable
protocol.

Rules:

- no Work lifecycle;
- no repo mutation;
- no approval/merge semantics;
- every role result is a structured artifact;
- synthesis is a report, not a state transition;
- any resulting implementation proposal becomes ordinary Work before code is
  changed.

Good first case:

```txt
Question: Should coding-domain planning validation run as a reviewer Assignment
or stay as direct same-session validation?
```

This is useful because it tests team reasoning without risking Work lifecycle
truth.

## 13. Acceptance Criteria For V1 Protocol

The protocol is ready for driver adoption when:

- every runtime assignment receives an explicit result artifact path;
- malformed or missing structured claims cannot produce `verified` or
  `reported`;
- dirty-before files cannot be counted as post-run evidence;
- read-only operations can return `reported` only through worker artifacts;
- mutating operations require post-run external evidence;
- stage skills agree on when Assignment is used versus direct invocation;
- `validate-plan` role prose is consistent across skill and task-spec docs;
- discovery remains machine-alone.
~~~~
````

### docs/platform/agent-coordination/proposals/README.md#agent-coordination-proposals

````text
# Agent Coordination Proposals

```txt
Document type: Collection index
Audience: Maintainer, implementation agent and independent reviewer
Purpose: Preserve current contracts and explicitly distinguish unimplemented design from retired engine history
Design status: Candidate
Implementation: Section-specific; proposal schemas and dated findings are not blanket implementation claims
Provenance: Restored from 7880fbc74b07c3667ebaa61f2b0561b5d80471b5 after independent liveness review
Writer type: Human + agent coauthor
Canonical for: The current subject and design boundaries stated in this file; not retired engine authority
Use this when: Reading the surviving contract, its implementation limits or current proposals
Do not use this for: Reinstating the retired coordination engine or treating proposal details as shipped behavior
Last reviewed: Pending independent liveness re-review
Related:
- docs/platform/agent-coordination/README.md
- docs/specs/runner.md
Supersedes: Incorrect whole-file retirement or over-removal only
Superseded by: None for the surviving current subject
Added in candidate: Liveness evidence and explicit implementation/proposal distinction
```

Complete pre-rework input: [historical snapshot](../history/retired-engine/files/proposals/README.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.

All proposals remain subordinate to the surviving Agent Coordination foundation boundaries in [Vision](../vision.md). A current design frontier does not implicitly reopen an accepted boundary. Before narrowing it, reconcile the original intent in the [preservation ledger](../intent-preservation-ledger.md). This restores the live introduction; the historical snapshot retains its original wording.
````

### docs/platform/agent-coordination/proposals/README.md#unheaded-block-1

````text
```txt
Document type: Collection index
Audience: Maintainer, implementation agent and independent reviewer
Purpose: Preserve current contracts and explicitly distinguish unimplemented design from retired engine history
Design status: Candidate
Implementation: Section-specific; proposal schemas and dated findings are not blanket implementation claims
Provenance: Restored from 7880fbc74b07c3667ebaa61f2b0561b5d80471b5 after independent liveness review
Writer type: Human + agent coauthor
Canonical for: The current subject and design boundaries stated in this file; not retired engine authority
Use this when: Reading the surviving contract, its implementation limits or current proposals
Do not use this for: Reinstating the retired coordination engine or treating proposal details as shipped behavior
Last reviewed: Pending independent liveness re-review
Related:
- docs/platform/agent-coordination/README.md
- docs/specs/runner.md
Supersedes: Incorrect whole-file retirement or over-removal only
Superseded by: None for the surviving current subject
Added in candidate: Liveness evidence and explicit implementation/proposal distinction
```
````

### docs/platform/agent-coordination/proposals/README.md#unheaded-block-2

```text
Complete pre-rework input: [historical snapshot](../history/retired-engine/files/proposals/README.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.
```

### docs/platform/agent-coordination/proposals/README.md#unheaded-block-3

```text
All proposals remain subordinate to the surviving Agent Coordination foundation boundaries in [Vision](../vision.md). A current design frontier does not implicitly reopen an accepted boundary. Before narrowing it, reconcile the original intent in the [preservation ledger](../intent-preservation-ledger.md). This restores the live introduction; the historical snapshot retains its original wording.
```

### docs/platform/agent-coordination/proposals/README.md#migration-status

```text
## Migration Status

This target directory preserves the proposal frontier from
`docs/architect/agent-coordination/proposals/`. A target-path copy does not
promote its design: the status of every frontier source remains governed by
[Proposal Status](../history/documentation-migration/proposal-status.md).
```

### docs/platform/agent-coordination/proposals/README.md#unheaded-block-4

```text
This target directory preserves the proposal frontier from
`docs/architect/agent-coordination/proposals/`. A target-path copy does not
promote its design: the status of every frontier source remains governed by
[Proposal Status](../history/documentation-migration/proposal-status.md).
```

### docs/platform/agent-coordination/proposals/README.md#active-proposals

```text
## Active Proposals

1. [Dispatch Control Plane Redesign](dispatch-control-plane-redesign.md) contains
   the detailed target and implementation-era findings behind the canonical
   dispatch summary.
2. [Team Communication Protocol V1](team-communication-protocol-v1.md) proposes
   role-to-role message and operation doctrine.
```

### docs/platform/agent-coordination/proposals/README.md#promoted-history

```text
## Promoted History

These proposals are no longer the active design frontier. Their accepted parts
have been promoted into architecture, contracts, and ADRs; their unresolved
parts remain explicitly deferred.

1. [Step 07: CoordinationSession, AdhocTask, And Planning Boundary](../history/retired-engine/files/proposals/step-07-coordination-session-adhoc-task.md#literal-snapshot)
   is historical discussion. CoordinationSession, runtime boundaries, and
   Work authority decisions were promoted; AdhocTask and generalized inline
   execution-contract schema remain unaccepted/deferred.
2. [Step 08: Standalone Coordination And Optional Protocols](../history/retired-engine/files/proposals/step-08-standalone-coordination-protocols.md#literal-snapshot)
   is historical discussion for the delivered standalone coordination surface.
   Read [Coordination Foundation Baseline](../history/retired-engine/files/architecture/coordination-foundation-baseline.md#literal-snapshot),
   [CoordinationSession](../history/retired-engine/files/contracts/coordination-session.md#literal-snapshot), and
   [FlowDefinition](../history/retired-engine/files/contracts/flow-definition.md#literal-snapshot) for canonical design.
```

### docs/platform/agent-coordination/proposals/README.md#related-architect-level-intentions

```text
## Related Architect-Level Intentions

- [Architecture Intent](../../../architect/architecture-intent.md) preserves the wider
  design intent behind deferred architecture capabilities. Its first active
  thread covers group-thinking/problem-solving capability and sits at
  `docs/architect/` because the concern spans Agent Coordination, Work Driver,
  Dispatch/Run, Run Result Evaluation, and the Coding Domain adoption track.
- [Step 09: Group Thinking Substrate](../../../architect/proposals/step-09-group-thinking-substrate.md)
  discusses the standalone, no-Work group-thinking substrate expansion. The
  first useful proof fixture is a Master Coordination style loop with external
  driver authority, bounded optional rounds, recheck, and disposition.
- [Step 10: Coding Domain Adoption Of The Coordination Foundation](../../../architect/proposals/step-10-coding-domain-adoption.md)
  discusses bringing the existing coding domain onto the Step 08 foundation:
  duplicate-mechanism inventory, seams, the foundation capabilities coding
  still needs, and a candidate step sequence gated on ADR-010 §5's proof.
- [Component Authority Boundary Map](../../../architect/proposals/component-authority-boundary-map.md)
  is the parallel architect-level authority/layout draft for cross-component
  placement and forbidden dependencies.
```

### docs/platform/agent-coordination/proposals/README.md#unheaded-block-8

```text
- [Architecture Intent](../../../architect/architecture-intent.md) preserves the wider
  design intent behind deferred architecture capabilities. Its first active
  thread covers group-thinking/problem-solving capability and sits at
  `docs/architect/` because the concern spans Agent Coordination, Work Driver,
  Dispatch/Run, Run Result Evaluation, and the Coding Domain adoption track.
- [Step 09: Group Thinking Substrate](../../../architect/proposals/step-09-group-thinking-substrate.md)
  discusses the standalone, no-Work group-thinking substrate expansion. The
  first useful proof fixture is a Master Coordination style loop with external
  driver authority, bounded optional rounds, recheck, and disposition.
- [Step 10: Coding Domain Adoption Of The Coordination Foundation](../../../architect/proposals/step-10-coding-domain-adoption.md)
  discusses bringing the existing coding domain onto the Step 08 foundation:
  duplicate-mechanism inventory, seams, the foundation capabilities coding
  still needs, and a candidate step sequence gated on ADR-010 §5's proof.
- [Component Authority Boundary Map](../../../architect/proposals/component-authority-boundary-map.md)
  is the parallel architect-level authority/layout draft for cross-component
  placement and forbidden dependencies.
```

### docs/platform/agent-coordination/proposals/README.md#promotion-rule

```text
## Promotion Rule

Approving a proposal means extracting:

- term changes into `vocabulary/`;
- durable boundaries into `architecture/`;
- exact behavior into `contracts/`;
- accepted choices and rejected alternatives into `decisions/`;
- implementation sequence into `roadmap/`.

Do not relabel an entire mixed proposal as canonical.
```

### docs/platform/agent-coordination/proposals/README.md#unheaded-block-9

```text
Approving a proposal means extracting:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#dispatch-control-plane-redesign

````text
# Dispatch Control Plane Redesign

```txt
Document type: Proposal
Audience: Maintainer, implementation agent and independent reviewer
Purpose: Preserve current contracts and explicitly distinguish unimplemented design from retired engine history
Design status: Candidate
Implementation: Section-specific; proposal schemas and dated findings are not blanket implementation claims
Provenance: Restored from 7880fbc74b07c3667ebaa61f2b0561b5d80471b5 after independent liveness review
Writer type: Human + agent coauthor
Canonical for: The current subject and design boundaries stated in this file; not retired engine authority
Use this when: Reading the surviving contract, its implementation limits or current proposals
Do not use this for: Reinstating the retired coordination engine or treating proposal details as shipped behavior
Last reviewed: Pending independent liveness re-review
Related:
- docs/platform/agent-coordination/README.md
- docs/specs/runner.md
Supersedes: Incorrect whole-file retirement or over-removal only
Superseded by: None for the surviving current subject
Added in candidate: Liveness evidence and explicit implementation/proposal distinction
```

Complete pre-rework input: [historical snapshot](../history/retired-engine/files/proposals/dispatch-control-plane-redesign.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.

Reading boundary: sections 1 and 4 record the original 2026-08-26 problem/finding context; their wording is not a claim that those defects still exist. Sections 2–16 retain the engine-independent design proposal. Section 17 records subsequent implementation and removal events. Current dispatch behaviour must be read in src/runner/execution/bind.mjs and the dispatch config/resolve/transport/result modules, not inferred from the dated failure examples below. No section is retired merely because a proposed schema is not yet implemented.
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-1

````text
```txt
Document type: Proposal
Audience: Maintainer, implementation agent and independent reviewer
Purpose: Preserve current contracts and explicitly distinguish unimplemented design from retired engine history
Design status: Candidate
Implementation: Section-specific; proposal schemas and dated findings are not blanket implementation claims
Provenance: Restored from 7880fbc74b07c3667ebaa61f2b0561b5d80471b5 after independent liveness review
Writer type: Human + agent coauthor
Canonical for: The current subject and design boundaries stated in this file; not retired engine authority
Use this when: Reading the surviving contract, its implementation limits or current proposals
Do not use this for: Reinstating the retired coordination engine or treating proposal details as shipped behavior
Last reviewed: Pending independent liveness re-review
Related:
- docs/platform/agent-coordination/README.md
- docs/specs/runner.md
Supersedes: Incorrect whole-file retirement or over-removal only
Superseded by: None for the surviving current subject
Added in candidate: Liveness evidence and explicit implementation/proposal distinction
```
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-2

```text
Complete pre-rework input: [historical snapshot](../history/retired-engine/files/proposals/dispatch-control-plane-redesign.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-3

```text
Reading boundary: sections 1 and 4 record the original 2026-08-26 problem/finding context; their wording is not a claim that those defects still exist. Sections 2–16 retain the engine-independent design proposal. Section 17 records subsequent implementation and removal events. Current dispatch behaviour must be read in src/runner/execution/bind.mjs and the dispatch config/resolve/transport/result modules, not inferred from the dated failure examples below. No section is retired merely because a proposed schema is not yet implemented.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#1-problem-statement

```text
## 1. Problem Statement

fgOS dispatch already has the important pieces of a real multi-agent control plane, but the pieces are not yet explicit enough at the same layer.

The current system has:

- a runner config that maps capabilities/purposes to concrete executors;
- executor declarations with kind, carries, provider/model policy, invocation shape, and optional adapter;
- a `decide` command that chooses whether a target should run native/in-process or out-of-process (this command is the concrete result of D0026's 4 done phases, with phase 5 extending native detection to agy deliberately deferred per `docs/specs/runner.md`'s "Lớp còn thiếu — LLM đủ thông minh để tự nhận ra khi nào dùng nhánh nào" section);
- an `execute` path that resolves an executor, spawns a process, captures output, and returns a JSON result;
- prompt contracts for work items and ad-hoc dispatches;
- legacy stdout tokens such as `[DONE]` and `[BLOCKED]`;
- an `unsignaled` fallback that compares git state before and after execution;
- an existing Herdr executor entry and Herdr-related product work around pane visibility.

The problem is that these concepts are spread across config, resolver, mechanism, transport, prompt text, and documentation. That creates five practical gaps.

1. The decision surface is not canonical. `execute --for` and `decide --for` do not use the same resolver path, so a capability `prefer` can be honored by execution while the decision command reports unavailable.
2. Governance asks the wrong question in one important place. A cross-provider gate that checks only the command name misses cases where the command is local-looking but environment/model settings route the content elsewhere.
3. Protocol is mixed with transport. Stdin/stdout is treated as the protocol boundary, while it is only one possible delivery mechanism.
4. Result truth is unclear. A structured result, a legacy token, and a git-state inference have different trust levels, but current output does not model that distinction as a first-class contract.
5. Terminal visibility is valuable, but it must not turn the terminal runtime into the semantic authority for task state.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-4

```text
fgOS dispatch already has the important pieces of a real multi-agent control plane, but the pieces are not yet explicit enough at the same layer.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-5

```text
The current system has:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-6

```text
- a runner config that maps capabilities/purposes to concrete executors;
- executor declarations with kind, carries, provider/model policy, invocation shape, and optional adapter;
- a `decide` command that chooses whether a target should run native/in-process or out-of-process (this command is the concrete result of D0026's 4 done phases, with phase 5 extending native detection to agy deliberately deferred per `docs/specs/runner.md`'s "Lớp còn thiếu — LLM đủ thông minh để tự nhận ra khi nào dùng nhánh nào" section);
- an `execute` path that resolves an executor, spawns a process, captures output, and returns a JSON result;
- prompt contracts for work items and ad-hoc dispatches;
- legacy stdout tokens such as `[DONE]` and `[BLOCKED]`;
- an `unsignaled` fallback that compares git state before and after execution;
- an existing Herdr executor entry and Herdr-related product work around pane visibility.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-7

```text
The problem is that these concepts are spread across config, resolver, mechanism, transport, prompt text, and documentation. That creates five practical gaps.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-8

```text
1. The decision surface is not canonical. `execute --for` and `decide --for` do not use the same resolver path, so a capability `prefer` can be honored by execution while the decision command reports unavailable.
2. Governance asks the wrong question in one important place. A cross-provider gate that checks only the command name misses cases where the command is local-looking but environment/model settings route the content elsewhere.
3. Protocol is mixed with transport. Stdin/stdout is treated as the protocol boundary, while it is only one possible delivery mechanism.
4. Result truth is unclear. A structured result, a legacy token, and a git-state inference have different trust levels, but current output does not model that distinction as a first-class contract.
5. Terminal visibility is valuable, but it must not turn the terminal runtime into the semantic authority for task state.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#2-goals

```text
## 2. Goals

1. Make dispatch a single explicit decision object.
2. Keep the Native-First Dispatch Doctrine as the source of dispatch mechanism selection.
3. Separate "what to run", "who runs it", "how it is delivered", and "how result truth is proven".
4. Support cross-provider execution without hidden egress.
5. Support Herdr pane visibility soon without requiring the full protocol migration first.
6. Keep worker result handling robust when third-party CLI agents do not obey a structured schema.
7. Keep large data, source diffs, reports, and datasets out of messages; pass references instead.
8. Defer full AgentMessage/mailbox/artifact-store implementation until there is a concrete reader/consumer.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-9

```text
1. Make dispatch a single explicit decision object.
2. Keep the Native-First Dispatch Doctrine as the source of dispatch mechanism selection.
3. Separate "what to run", "who runs it", "how it is delivered", and "how result truth is proven".
4. Support cross-provider execution without hidden egress.
5. Support Herdr pane visibility soon without requiring the full protocol migration first.
6. Keep worker result handling robust when third-party CLI agents do not obey a structured schema.
7. Keep large data, source diffs, reports, and datasets out of messages; pass references instead.
8. Defer full AgentMessage/mailbox/artifact-store implementation until there is a concrete reader/consumer.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#3-non-goals

```text
## 3. Non-Goals

1. Do not make Herdr the source of truth for task state.
2. Do not require every third-party CLI worker to emit valid structured JSON from day one.
3. Do not implement a broad message bus only because it is architecturally attractive.
4. Do not create a second content-class enum beside `carries`.
5. Do not re-open the settled distinction between lifecycle work and ephemeral ad-hoc dispatch.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-10

```text
1. Do not make Herdr the source of truth for task state.
2. Do not require every third-party CLI worker to emit valid structured JSON from day one.
3. Do not implement a broad message bus only because it is architecturally attractive.
4. Do not create a second content-class enum beside `carries`.
5. Do not re-open the settled distinction between lifecycle work and ephemeral ad-hoc dispatch.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#4-current-findings

```text
## 4. Current Findings
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#41-config-already-has-the-right-raw-material

```text
### 4.1 Config Already Has The Right Raw Material

The runner config already distinguishes these axes:

- executor kind: agent or tool;
- content carried: `user-text` or `repo-content`;
- invocation mechanism: `cli`, `task`, `mcp`, or `api`;
- adapter: default `cli-spawn`, with a registry hook already present;
- provider/model policy and rigor override;
- capability `prefer` mapping from an abstract purpose to a concrete executor.

This means the redesign should reuse the existing vocabulary rather than create parallel fields.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-11

```text
The runner config already distinguishes these axes:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-12

```text
- executor kind: agent or tool;
- content carried: `user-text` or `repo-content`;
- invocation mechanism: `cli`, `task`, `mcp`, or `api`;
- adapter: default `cli-spawn`, with a registry hook already present;
- provider/model policy and rigor override;
- capability `prefer` mapping from an abstract purpose to a concrete executor.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-13

```text
This means the redesign should reuse the existing vocabulary rather than create parallel fields.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#42-decide---for-and-execute---for-drift

````text
### 4.2 `decide --for` And `execute --for` Drift

The execution path resolves purposes through the richer resolver that understands capability `prefer`. The decision path has a narrower branch that can resolve only by scanning executors that declare `for`.

The visible failure is:

```txt
node src/runner/dispatch.mjs decide --for fgos-coding-implement --has-live-task-access
```

returning unavailable even though the config declares that the `fgos-coding-implement` capability prefers `agy`.
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-14

```text
The execution path resolves purposes through the richer resolver that understands capability `prefer`. The decision path has a narrower branch that can resolve only by scanning executors that declare `for`.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-15

```text
The visible failure is:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-16

````text
```txt
node src/runner/dispatch.mjs decide --for fgos-coding-implement --has-live-task-access
```
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-17

```text
returning unavailable even though the config declares that the `fgos-coding-implement` capability prefers `agy`.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#43-governance-can-miss-hidden-egress

```text
### 4.3 Governance Can Miss Hidden Egress

The current cross-provider gate is command-shaped. It treats a non-Claude command as suspicious unless `allowCrossProvider` is true.

That misses the inverse case: an executor can run command `claude` while environment and model settings route the real request through another provider endpoint. The `glm` executor shape is the motivating example: the command can look like Claude while the effective target is OpenRouter and a GLM model.

Governance must inspect effective egress, not just argv[0].
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-18

```text
The current cross-provider gate is command-shaped. It treats a non-Claude command as suspicious unless `allowCrossProvider` is true.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-19

```text
That misses the inverse case: an executor can run command `claude` while environment and model settings route the real request through another provider endpoint. The `glm` executor shape is the motivating example: the command can look like Claude while the effective target is OpenRouter and a GLM model.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-20

```text
Governance must inspect effective egress, not just argv[0].
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#44-cli-only-dispatch-is-too-narrow-but-the-adapter-axis-already-exists

````text
### 4.4 CLI-Only Dispatch Is Too Narrow, But The Adapter Axis Already Exists

The resolver currently insists on a `via:"cli"` invocation for production dispatch. That blocks true `api` or `mcp` execution paths.

However, the transport layer already selects an adapter independently:

```txt
executor.adapter ?? DEFAULT_ADAPTER
```

Therefore a near-term Herdr integration does not need a new protocol layer. An executor can remain `via:"cli"` for resolver compatibility while using `adapter:"herdr-spawn"` to launch the worker in a visible Herdr pane.
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-21

```text
The resolver currently insists on a `via:"cli"` invocation for production dispatch. That blocks true `api` or `mcp` execution paths.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-22

```text
However, the transport layer already selects an adapter independently:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-23

````text
```txt
executor.adapter ?? DEFAULT_ADAPTER
```
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-24

```text
Therefore a near-term Herdr integration does not need a new protocol layer. An executor can remain `via:"cli"` for resolver compatibility while using `adapter:"herdr-spawn"` to launch the worker in a visible Herdr pane.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#45-unsignaled-is-a-real-fallback-not-a-mistake

```text
### 4.5 `unsignaled` Is A Real Fallback, Not A Mistake

CLI agents are third-party workers controlled by prompt, not by hard schema enforcement. A worker may exit successfully without emitting a structured result or even a legacy status token.

The existing `unsignaled` outcome captures this reality by returning `headBefore` and `headAfter`. It should not be deleted until a replacement reader exists and provider compliance data proves it is safe.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-25

```text
CLI agents are third-party workers controlled by prompt, not by hard schema enforcement. A worker may exit successfully without emitting a structured result or even a legacy status token.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-26

```text
The existing `unsignaled` outcome captures this reality by returning `headBefore` and `headAfter`. It should not be deleted until a replacement reader exists and provider compliance data proves it is safe.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#46-herdr-visibility-does-not-require-mailbox-yet

````text
### 4.6 Herdr Visibility Does Not Require Mailbox Yet

The near-term Herdr use case is:

```txt
agent A asks fgOS to activate agent B
fgOS launches B in a Herdr pane
Herdr owns the terminal/runtime surface
fgOS still owns dispatch result interpretation and task state
```

In this shape, A and B do not need a direct communication channel. B returns through the same worker-output path as any CLI dispatch: terminal transcript is captured by the Herdr adapter and handed back to fgOS. fgOS then applies the existing result ladder. Herdr provides visibility and process control, not semantic routing.

Therefore mailbox and AgentMessage are still design targets, not prerequisites for the current Herdr adapter.
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-27

```text
The near-term Herdr use case is:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-28

````text
```txt
agent A asks fgOS to activate agent B
fgOS launches B in a Herdr pane
Herdr owns the terminal/runtime surface
fgOS still owns dispatch result interpretation and task state
```
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-29

```text
In this shape, A and B do not need a direct communication channel. B returns through the same worker-output path as any CLI dispatch: terminal transcript is captured by the Herdr adapter and handed back to fgOS. fgOS then applies the existing result ladder. Herdr provides visibility and process control, not semantic routing.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-30

```text
Therefore mailbox and AgentMessage are still design targets, not prerequisites for the current Herdr adapter.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#5-vocabulary

```text
## 5. Vocabulary
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#51-dispatch-roles

```text
### 5.1 Dispatch Roles

- `launcher` - starts a work item or dispatch target and may step away.
- `driver` - stays attached and continues coordinating after activation.
- `orchestrator` - T0 composition layer that manages N units of work and stays attached.
- `work` - lifecycle-bearing fgOS unit with state, events, claim/return, and merge semantics.
- `child work` - a normal work item related to a parent; not a separate dispatch category.
- `capability` - an abstract behavior promise such as `fgos-coding-implement`.
- `executor` - the concrete implementation of a capability, such as `agy`, `codex`, `gitnexus`, or `herdr`.
- `ad-hoc task` / `exec packet` - an ephemeral runtime-composed unit outside the work ledger.

The old `rootTask`/`subTask` vocabulary is not part of the current dispatch model. A "subtask" is either child work with lifecycle or an ephemeral ad-hoc dispatch target. Note that the runner spec's (`docs/specs/runner.md`) historical `capacity` concept maps to `capability` for abstract behavior promises and to `executor` for concrete execution units per ADR 0034.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-31

```text
- `launcher` - starts a work item or dispatch target and may step away.
- `driver` - stays attached and continues coordinating after activation.
- `orchestrator` - T0 composition layer that manages N units of work and stays attached.
- `work` - lifecycle-bearing fgOS unit with state, events, claim/return, and merge semantics.
- `child work` - a normal work item related to a parent; not a separate dispatch category.
- `capability` - an abstract behavior promise such as `fgos-coding-implement`.
- `executor` - the concrete implementation of a capability, such as `agy`, `codex`, `gitnexus`, or `herdr`.
- `ad-hoc task` / `exec packet` - an ephemeral runtime-composed unit outside the work ledger.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-32

```text
The old `rootTask`/`subTask` vocabulary is not part of the current dispatch model. A "subtask" is either child work with lifecycle or an ephemeral ad-hoc dispatch target. Note that the runner spec's (`docs/specs/runner.md`) historical `capacity` concept maps to `capability` for abstract behavior promises and to `executor` for concrete execution units per ADR 0034.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#52-design-target-rename

````text
### 5.2 Design-Target Rename

If the protocol migration is allowed to break compatibility, the clean name for the old `exec packet` concept is:

```txt
DispatchAssignment
```

`exec packet` describes how something is sent. `DispatchAssignment` describes what it means: a bounded assignment handed to another agent.

During the narrow slice, do not rename the existing docs or prompt contract. Use `DispatchAssignment` only in the design target until the protocol migration has a real implementation consumer.
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-33

```text
If the protocol migration is allowed to break compatibility, the clean name for the old `exec packet` concept is:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-34

````text
```txt
DispatchAssignment
```
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-35

```text
`exec packet` describes how something is sent. `DispatchAssignment` describes what it means: a bounded assignment handed to another agent.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-36

```text
During the narrow slice, do not rename the existing docs or prompt contract. Use `DispatchAssignment` only in the design target until the protocol migration has a real implementation consumer.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#6-dispatchplan

```text
## 6. DispatchPlan

`DispatchPlan` is the canonical answer to "what should happen with this dispatch request?"

It is not a new decision beside the Native-First Dispatch Doctrine. Its `mechanism` is the named result of that doctrine applied to a concrete selector, executor, and runtime condition.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-37

```text
`DispatchPlan` is the canonical answer to "what should happen with this dispatch request?"
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-38

```text
It is not a new decision beside the Native-First Dispatch Doctrine. Its `mechanism` is the named result of that doctrine applied to a concrete selector, executor, and runtime condition.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#61-shape

````text
### 6.1 Shape

```json
{
  "selector": {
    "type": "work",
    "value": "tsk-123"
  },
  "target": {
    "capability": "fgos-coding-implement",
    "executorId": "agy",
    "kind": "agent"
  },
  "mechanism": "out-of-process",
  "handback": null,
  "governance": {
    "carries": ["repo-content"],
    "egress": {
      "allowed": true,
      "declaredProvider": "agy",
      "command": "agy",
      "effectiveTarget": "agy"
    }
  },
  "execution": {
    "invocationVia": "cli",
    "adapter": "cli-spawn",
    "model": "gemini-...",
    "tier": "lightweight"
  },
  "reasonCodes": [
    "capability-prefer",
    "cli-spawn-shaped-executor",
    "native-first-rule-cross-provider"
  ]
}
```
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-39

````text
```json
{
  "selector": {
    "type": "work",
    "value": "tsk-123"
  },
  "target": {
    "capability": "fgos-coding-implement",
    "executorId": "agy",
    "kind": "agent"
  },
  "mechanism": "out-of-process",
  "handback": null,
  "governance": {
    "carries": ["repo-content"],
    "egress": {
      "allowed": true,
      "declaredProvider": "agy",
      "command": "agy",
      "effectiveTarget": "agy"
    }
  },
  "execution": {
    "invocationVia": "cli",
    "adapter": "cli-spawn",
    "model": "gemini-...",
    "tier": "lightweight"
  },
  "reasonCodes": [
    "capability-prefer",
    "cli-spawn-shaped-executor",
    "native-first-rule-cross-provider"
  ]
}
```
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#62-selector

```text
### 6.2 Selector

The selector is caller input, not the mechanism result.

Allowed selector types:

- `work` - dispatch decision for a lifecycle work item.
- `purpose` - dispatch decision for a named capability/purpose.
- `executor` - dispatch decision for a concrete executor id.
- `adHocAgent` - dispatch decision for a runtime-composed agent assignment.

Do not add `nativeTask` as a selector. Native/in-process is an output mechanism, not an input category.

Current implementation note: `execute --for` already resolves through the
capability-aware path that honors `capabilities.<name>.prefer`.
`decide --for` still uses the older `for` scan. Item 0 below exists to
remove that split.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-40

```text
The selector is caller input, not the mechanism result.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-41

```text
Allowed selector types:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-42

```text
- `work` - dispatch decision for a lifecycle work item.
- `purpose` - dispatch decision for a named capability/purpose.
- `executor` - dispatch decision for a concrete executor id.
- `adHocAgent` - dispatch decision for a runtime-composed agent assignment.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-43

```text
Do not add `nativeTask` as a selector. Native/in-process is an output mechanism, not an input category.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-44

```text
Current implementation note: `execute --for` already resolves through the
capability-aware path that honors `capabilities.<name>.prefer`.
`decide --for` still uses the older `for` scan. Item 0 below exists to
remove that split.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#63-mechanism

````text
### 6.3 Mechanism

Allowed mechanisms:

- `unavailable` - no configured or permitted dispatch target.
- `in-process` - use the current live agent/session facility.
- `out-of-process` - execute through an external executor/adapter.

For in-process dispatch, `handback` carries the concrete native surface:

```json
{
  "mechanism": "in-process",
  "handback": {
    "type": "native-task",
    "agentType": "fgos-coding-implement"
  }
}
```

or:

```json
{
  "mechanism": "in-process",
  "handback": {
    "type": "mcp-tool",
    "tool": "mcp__gitnexus__impact"
  }
}
```
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-45

```text
Allowed mechanisms:

- `unavailable` - no configured or permitted dispatch target.
- `in-process` - use the current live agent/session facility.
- `out-of-process` - execute through an external executor/adapter.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-46

```text
For in-process dispatch, `handback` carries the concrete native surface:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-47

````text
```json
{
  "mechanism": "in-process",
  "handback": {
    "type": "native-task",
    "agentType": "fgos-coding-implement"
  }
}
```
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-48

````text
or:

```json
{
  "mechanism": "in-process",
  "handback": {
    "type": "mcp-tool",
    "tool": "mcp__gitnexus__impact"
  }
}
```
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#7-governance-and-egress

```text
## 7. Governance And Egress

Governance answers whether content may leave the current trusted execution boundary.

Use the existing `carries` vocabulary:

- `user-text` - user prompt or ordinary instruction content.
- `repo-content` - repository content, diffs, file paths, worktree state, or source-derived material.

There is no `secrets` content value. Secrets are never valid dispatch payload.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-49

```text
Governance answers whether content may leave the current trusted execution boundary.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-50

```text
Use the existing `carries` vocabulary:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-51

```text
- `user-text` - user prompt or ordinary instruction content.
- `repo-content` - repository content, diffs, file paths, worktree state, or source-derived material.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-52

```text
There is no `secrets` content value. Secrets are never valid dispatch payload.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#71-effective-egress

````text
### 7.1 Effective Egress

The gate must classify egress from the full resolved executor shape:

- declared provider label;
- resolved model/provider policy;
- invocation command;
- invocation environment;
- base URL or endpoint variables;
- adapter;
- `allowCrossProvider`;
- `carries`.

The audit event must record at least:

```json
{
  "provider": "glm",
  "command": "claude",
  "effectiveEgressTarget": "openrouter:z-ai/glm-5.2",
  "carries": ["repo-content"]
}
```

The important rule: command is evidence, not the whole answer.
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-53

```text
The gate must classify egress from the full resolved executor shape:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-54

```text
- declared provider label;
- resolved model/provider policy;
- invocation command;
- invocation environment;
- base URL or endpoint variables;
- adapter;
- `allowCrossProvider`;
- `carries`.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-55

```text
The audit event must record at least:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-56

````text
```json
{
  "provider": "glm",
  "command": "claude",
  "effectiveEgressTarget": "openrouter:z-ai/glm-5.2",
  "carries": ["repo-content"]
}
```
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-57

```text
The important rule: command is evidence, not the whole answer.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#72-policy-resolution-before-dispatchplan

````text
### 7.2 Policy Resolution Before DispatchPlan

Team dispatch adds one layer before `DispatchPlan`: an effective execution
policy resolver.

```txt
stage operation + role + persona + work + assignment + human override
  -> effective dispatch policy
  -> DispatchPlan
  -> governance
  -> transport
```

This policy resolver must not become a second dispatch mechanism. It prepares
the selector and execution hints that the existing dispatch resolver already
understands.

Canonical specificity order:

```txt
Global defaults
-> Domain defaults
-> Workflow defaults
-> Stage defaults
-> Stage operation / taskSpec defaults
-> Role defaults
-> Persona defaults
-> Work-item policy
-> Assignment explicit policy
-> Human / CLI explicit override
-> Governance gate
```

Different fields resolve differently:

| Field family | Rule |
|---|---|
| Constraints | union, then fail closed if unsatisfied |
| Provider / executor preference | highest-specificity wins |
| Fallback executors | preserve ordered list from the most specific layer, with broader fallbacks appended if useful |
| Tier / rigor | strongest required tier wins |
| Model name | resolve from provider/model policy after effective provider and tier are known |
| Literal model name | assignment or human/CLI override only |
| Governance / egress | final gate, never bypassed by policy |

Example:

```txt
role reviewer requires minTier=standard
operation validate-plan prefers persona=code-reviewer
work risk=high raises minTier=critical
assignment prefers executor=claude
governance checks effective egress
```

The resulting `DispatchPlan.execution` carries the concrete model and adapter.
The workflow does not need to hardcode a provider to prove team coordination.
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-58

```text
Team dispatch adds one layer before `DispatchPlan`: an effective execution
policy resolver.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-59

````text
```txt
stage operation + role + persona + work + assignment + human override
  -> effective dispatch policy
  -> DispatchPlan
  -> governance
  -> transport
```
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-60

```text
This policy resolver must not become a second dispatch mechanism. It prepares
the selector and execution hints that the existing dispatch resolver already
understands.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-61

```text
Canonical specificity order:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-62

````text
```txt
Global defaults
-> Domain defaults
-> Workflow defaults
-> Stage defaults
-> Stage operation / taskSpec defaults
-> Role defaults
-> Persona defaults
-> Work-item policy
-> Assignment explicit policy
-> Human / CLI explicit override
-> Governance gate
```
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-63

```text
Different fields resolve differently:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-64

```text
| Field family | Rule |
|---|---|
| Constraints | union, then fail closed if unsatisfied |
| Provider / executor preference | highest-specificity wins |
| Fallback executors | preserve ordered list from the most specific layer, with broader fallbacks appended if useful |
| Tier / rigor | strongest required tier wins |
| Model name | resolve from provider/model policy after effective provider and tier are known |
| Literal model name | assignment or human/CLI override only |
| Governance / egress | final gate, never bypassed by policy |
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-65

````text
Example:

```txt
role reviewer requires minTier=standard
operation validate-plan prefers persona=code-reviewer
work risk=high raises minTier=critical
assignment prefers executor=claude
governance checks effective egress
```
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-66

```text
The resulting `DispatchPlan.execution` carries the concrete model and adapter.
The workflow does not need to hardcode a provider to prove team coordination.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#73-recommended-v1-provider-policy-for-coding-feature-flow

```text
### 7.3 Recommended V1 Provider Policy For Coding Feature Flow

Use these as defaults for the first team-dispatch proof, not permanent hard
bindings.

| Stage | Operation | Preferred execution | Rationale |
|---|---|---|---|
| planning | `shape-plan` | `claude` / Claude `sonnet` | plan synthesis and tradeoff writing are the current stable default path |
| planning | `resolve-question` | `pi` / OpenAI-Codex `gpt-5.5` | independent consult benefits from provider diversity; `pi` has a verified JSON cli-spawn path |
| planning | `scout-blast-radius` | `gitnexus`, then `pi` if synthesis is needed | graph/tool evidence should precede model judgment |
| planning | `validate-plan` | `claude` / `sonnet`, raise to `opus` for critical work | review/proving should be evidence-first and may need stronger rigor |
| executing | `implement-item` | `agy-cli` / Gemini `gemini-3.6-flash-medium` | current repo config already pins `fgos-coding-implement` to the stable headless agy path |
| executing | `review-item` | `claude` / `sonnet`, raise to `opus` for critical work | separate reviewer from implementation provider where possible |
| executing | `fix-verify-red` | `claude` for diagnosis, `agy-cli` for bounded edits | root-cause work and mechanical fix work have different execution needs |
| executing | `scoped-subtask` | `agy-cli` or `pi` | bounded helper work should use a cheaper/fast executor when evidence gates are clear |

Do not use `agy-herdr`, `codex-herdr`, or other interactive Herdr paths as the
authority for the first team proof. They can be tried later as visibility
adapters after cli-spawn assignment execution and evidence handling are stable.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-67

```text
Use these as defaults for the first team-dispatch proof, not permanent hard
bindings.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-68

```text
| Stage | Operation | Preferred execution | Rationale |
|---|---|---|---|
| planning | `shape-plan` | `claude` / Claude `sonnet` | plan synthesis and tradeoff writing are the current stable default path |
| planning | `resolve-question` | `pi` / OpenAI-Codex `gpt-5.5` | independent consult benefits from provider diversity; `pi` has a verified JSON cli-spawn path |
| planning | `scout-blast-radius` | `gitnexus`, then `pi` if synthesis is needed | graph/tool evidence should precede model judgment |
| planning | `validate-plan` | `claude` / `sonnet`, raise to `opus` for critical work | review/proving should be evidence-first and may need stronger rigor |
| executing | `implement-item` | `agy-cli` / Gemini `gemini-3.6-flash-medium` | current repo config already pins `fgos-coding-implement` to the stable headless agy path |
| executing | `review-item` | `claude` / `sonnet`, raise to `opus` for critical work | separate reviewer from implementation provider where possible |
| executing | `fix-verify-red` | `claude` for diagnosis, `agy-cli` for bounded edits | root-cause work and mechanical fix work have different execution needs |
| executing | `scoped-subtask` | `agy-cli` or `pi` | bounded helper work should use a cheaper/fast executor when evidence gates are clear |
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-69

```text
Do not use `agy-herdr`, `codex-herdr`, or other interactive Herdr paths as the
authority for the first team proof. They can be tried later as visibility
adapters after cli-spawn assignment execution and evidence handling are stable.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#8-dispatchassignment

```text
## 8. DispatchAssignment

`DispatchAssignment` is the design-target replacement for the current six-field ad-hoc task / exec packet.

It is for runtime-composed work that has no lifecycle row of its own. It does not get claimed, reserved, capped, merged, or moved through work-item state.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-70

```text
`DispatchAssignment` is the design-target replacement for the current six-field ad-hoc task / exec packet.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-71

```text
It is for runtime-composed work that has no lifecycle row of its own. It does not get claimed, reserved, capped, merged, or moved through work-item state.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#81-design-target-shape

````text
### 8.1 Design-Target Shape

```json
{
  "assignmentId": "asgn_example_001",
  "origin": {
    "type": "adhoc",
    "scope": "tsk-123",
    "sequence": 1
  },
  "objective": "Research dispatch protocol migration risks.",
  "inputs": [
    {
      "ref": "repo://forgentX/src/runner/dispatch",
      "purpose": "Read current dispatch implementation",
      "required": true
    }
  ],
  "scope": {
    "read": ["src/runner/dispatch", "docs/history"],
    "write": [],
    "forbidden": [".env", "secrets"]
  },
  "constraints": [
    "Do not modify code",
    "Return findings with evidence"
  ],
  "deliverable": {
    "type": "research_findings",
    "shape": "ordered findings with severity and file references"
  },
  "returnContract": {
    "allowedMessageTypes": ["RESULT", "BLOCKER"],
    "fallbackSignals": ["[DONE]", "[BLOCKED]"]
  }
}
```
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-72

````text
```json
{
  "assignmentId": "asgn_example_001",
  "origin": {
    "type": "adhoc",
    "scope": "tsk-123",
    "sequence": 1
  },
  "objective": "Research dispatch protocol migration risks.",
  "inputs": [
    {
      "ref": "repo://forgentX/src/runner/dispatch",
      "purpose": "Read current dispatch implementation",
      "required": true
    }
  ],
  "scope": {
    "read": ["src/runner/dispatch", "docs/history"],
    "write": [],
    "forbidden": [".env", "secrets"]
  },
  "constraints": [
    "Do not modify code",
    "Return findings with evidence"
  ],
  "deliverable": {
    "type": "research_findings",
    "shape": "ordered findings with severity and file references"
  },
  "returnContract": {
    "allowedMessageTypes": ["RESULT", "BLOCKER"],
    "fallbackSignals": ["[DONE]", "[BLOCKED]"]
  }
}
```
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#82-compatibility-mapping

````text
### 8.2 Compatibility Mapping

If compatibility is required, the existing six fields map directly:

| Current field | Design-target field |
|---|---|
| `id` | `assignmentId` or `origin.scope + origin.sequence` |
| `goal` | `objective` |
| `inputs` | `inputs` |
| `boundary` | `scope` |
| `expected shape` | `deliverable.shape` |
| `return contract` | `returnContract` |

The current `<scope>#p<n>` id remains valid for old prompt contracts. In the breaking design, typed ids are clearer:

- `tsk_...` or existing `tsk-*` - lifecycle work;
- `asgn_*` - dispatch assignment;
- `msg_*` - protocol message;
- `run_*` - one execution run;
- `trace_*` - distributed trace.

Implementation note:

```txt
Only `tsk-*` work ids exist today as durable lifecycle ids.
`asgn_*`, `msg_*`, `run_*`, and `trace_*` are design-target namespaces until
the assignment, message, runtime, and observability layers add real writers.
```
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-73

```text
If compatibility is required, the existing six fields map directly:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-74

```text
| Current field | Design-target field |
|---|---|
| `id` | `assignmentId` or `origin.scope + origin.sequence` |
| `goal` | `objective` |
| `inputs` | `inputs` |
| `boundary` | `scope` |
| `expected shape` | `deliverable.shape` |
| `return contract` | `returnContract` |
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-75

```text
The current `<scope>#p<n>` id remains valid for old prompt contracts. In the breaking design, typed ids are clearer:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-76

```text
- `tsk_...` or existing `tsk-*` - lifecycle work;
- `asgn_*` - dispatch assignment;
- `msg_*` - protocol message;
- `run_*` - one execution run;
- `trace_*` - distributed trace.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-77

````text
Implementation note:

```txt
Only `tsk-*` work ids exist today as durable lifecycle ids.
`asgn_*`, `msg_*`, `run_*`, and `trace_*` are design-target namespaces until
the assignment, message, runtime, and observability layers add real writers.
```
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#9-agentmessage

````text
## 9. AgentMessage

`AgentMessage` is a protocol envelope. It is not a work item, not a prompt, and not an artifact.

```txt
AgentMessage = identity + routing + correlation + delivery + governance + payload refs
Artifact = heavy data or work product
State store = authoritative task/work truth
Transport = how the envelope moves
```
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-78

```text
`AgentMessage` is a protocol envelope. It is not a work item, not a prompt, and not an artifact.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-79

````text
```txt
AgentMessage = identity + routing + correlation + delivery + governance + payload refs
Artifact = heavy data or work product
State store = authoritative task/work truth
Transport = how the envelope moves
```
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#91-design-target-envelope

````text
### 9.1 Design-Target Envelope

```json
{
  "schema": "agent-message",
  "schemaVersion": "1.0",
  "messageId": "msg_example_001",
  "messageType": "ASSIGN",
  "from": {
    "agentId": "claude.architect",
    "runId": "run_example_001"
  },
  "to": {
    "selector": {
      "type": "capability",
      "value": "code-implementation"
    },
    "agentId": null
  },
  "correlation": {
    "traceId": "trace_example_001",
    "parentWorkId": "tsk-123",
    "assignmentId": "asgn_example_001",
    "replyTo": null
  },
  "delivery": {
    "priority": "normal",
    "mode": "next_safe_point",
    "ackRequired": false,
    "idempotencyKey": "tsk-123:code-implementation:p1"
  },
  "governance": {
    "carries": ["repo-content"],
    "egress": {
      "allowed": true,
      "effectiveTarget": "codex"
    }
  },
  "payload": {
    "kind": "dispatch-assignment",
    "assignmentId": "asgn_example_001"
  },
  "artifacts": {
    "inputs": [],
    "outputsExpected": []
  },
  "observability": {
    "traceId": "trace_example_001",
    "spanId": "span_001",
    "parentSpanId": null
  }
}
```
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-80

````text
```json
{
  "schema": "agent-message",
  "schemaVersion": "1.0",
  "messageId": "msg_example_001",
  "messageType": "ASSIGN",
  "from": {
    "agentId": "claude.architect",
    "runId": "run_example_001"
  },
  "to": {
    "selector": {
      "type": "capability",
      "value": "code-implementation"
    },
    "agentId": null
  },
  "correlation": {
    "traceId": "trace_example_001",
    "parentWorkId": "tsk-123",
    "assignmentId": "asgn_example_001",
    "replyTo": null
  },
  "delivery": {
    "priority": "normal",
    "mode": "next_safe_point",
    "ackRequired": false,
    "idempotencyKey": "tsk-123:code-implementation:p1"
  },
  "governance": {
    "carries": ["repo-content"],
    "egress": {
      "allowed": true,
      "effectiveTarget": "codex"
    }
  },
  "payload": {
    "kind": "dispatch-assignment",
    "assignmentId": "asgn_example_001"
  },
  "artifacts": {
    "inputs": [],
    "outputsExpected": []
  },
  "observability": {
    "traceId": "trace_example_001",
    "spanId": "span_001",
    "parentSpanId": null
  }
}
```
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#92-message-type-discipline

```text
### 9.2 Message Type Discipline

Do not implement every imaginable type before a consumer exists.

The minimal useful set for a real migration is:

- `ASSIGN` - hand a `DispatchAssignment` to an agent.
- `RESULT` - report a completed assignment or work dispatch result.
- `BLOCKER` - report that execution cannot continue without a decision/artifact.
- `ERROR` - report infrastructure or protocol failure.

These are reserved but deferred until a named consumer exists:

- `ACK`
- `PROGRESS`
- `QUESTION`
- `ANSWER`
- `REVIEW_REQUEST`
- `REVIEW_RESULT`
- `CANCEL`

This keeps the protocol expandable without committing implementation surface to unused workflow states.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-81

```text
Do not implement every imaginable type before a consumer exists.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-82

```text
The minimal useful set for a real migration is:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-83

```text
- `ASSIGN` - hand a `DispatchAssignment` to an agent.
- `RESULT` - report a completed assignment or work dispatch result.
- `BLOCKER` - report that execution cannot continue without a decision/artifact.
- `ERROR` - report infrastructure or protocol failure.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-84

```text
These are reserved but deferred until a named consumer exists:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-85

```text
- `ACK`
- `PROGRESS`
- `QUESTION`
- `ANSWER`
- `REVIEW_REQUEST`
- `REVIEW_RESULT`
- `CANCEL`
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-86

```text
This keeps the protocol expandable without committing implementation surface to unused workflow states.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#10-structured-result-and-confidence-ladder

````text
## 10. Structured Result And Confidence Ladder

Structured `RESULT` is the target, but structured-only is not a correct V1 for prompt-controlled CLI agents.

Every dispatch result should eventually classify its confidence:

```txt
structured RESULT or BLOCKER  -> confidence: reported
stdout [DONE]/[BLOCKED]       -> confidence: legacy-signal
git/artifact delta inference  -> confidence: inferred
```

The result object should preserve evidence:

```json
{
  "status": "SUCCESS",
  "confidence": "legacy-signal",
  "evidence": {
    "legacySignal": "DONE",
    "headBefore": "abc123",
    "headAfter": "def456",
    "exitCode": 0,
    "structuredMessage": null
  }
}
```

Do not add confidence telemetry as a write-only field. A migration must include a reader, such as:

- dispatch compliance stats;
- an attestation warning/gate;
- provider compliance report;
- CI health check for provider result quality.

Until that reader exists, keep the current fallback behavior and avoid pretending the telemetry migration has started.

Current post-merge status: Assignment RunResult storage now has first-class
`confidence` labels, but Step 04 must harden the evidence contract before the
coding driver treats those labels as lifecycle proof.

For Team Dispatch V1, the concrete post-merge rule is:

```txt
No driver may advance Work from an Assignment result unless the RunResult
confidence was computed from evidence produced during that run.
```

This is why Step 04 hardens dirty-before/after snapshots, structured
`agent-result.json` validation, and read-only report artifacts before Step 05
lets the coding driver choose secondary operations.
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-87

```text
Structured `RESULT` is the target, but structured-only is not a correct V1 for prompt-controlled CLI agents.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-88

```text
Every dispatch result should eventually classify its confidence:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-89

````text
```txt
structured RESULT or BLOCKER  -> confidence: reported
stdout [DONE]/[BLOCKED]       -> confidence: legacy-signal
git/artifact delta inference  -> confidence: inferred
```
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-90

```text
The result object should preserve evidence:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-91

````text
```json
{
  "status": "SUCCESS",
  "confidence": "legacy-signal",
  "evidence": {
    "legacySignal": "DONE",
    "headBefore": "abc123",
    "headAfter": "def456",
    "exitCode": 0,
    "structuredMessage": null
  }
}
```
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-92

```text
Do not add confidence telemetry as a write-only field. A migration must include a reader, such as:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-93

```text
- dispatch compliance stats;
- an attestation warning/gate;
- provider compliance report;
- CI health check for provider result quality.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-94

```text
Until that reader exists, keep the current fallback behavior and avoid pretending the telemetry migration has started.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-95

```text
Current post-merge status: Assignment RunResult storage now has first-class
`confidence` labels, but Step 04 must harden the evidence contract before the
coding driver treats those labels as lifecycle proof.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-96

```text
For Team Dispatch V1, the concrete post-merge rule is:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-97

````text
```txt
No driver may advance Work from an Assignment result unless the RunResult
confidence was computed from evidence produced during that run.
```
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-98

```text
This is why Step 04 hardens dirty-before/after snapshots, structured
`agent-result.json` validation, and read-only report artifacts before Step 05
lets the coding driver choose secondary operations.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#11-artifact-store

````text
## 11. Artifact Store

Messages should carry control and references, not heavy content.

The design target is:

```txt
Message carries: intent, metadata, routing, constraints, artifact refs
Artifact store carries: diffs, reports, logs, datasets, screenshots, generated files
State store carries: authoritative lifecycle state
```

Artifact references must be stable enough for later readers:

```json
{
  "ref": "artifact://dispatch/run_456/test-report.json",
  "type": "test_report",
  "name": "tests",
  "sha256": "..."
}
```

For code work, a git commit is an artifact reference:

```json
{
  "ref": "git://forgentX/commit/abc123",
  "type": "git_commit",
  "name": "implementation"
}
```

The artifact store is deferred in the narrow slice because no structured result reader is being shipped yet.
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-99

```text
Messages should carry control and references, not heavy content.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-100

````text
The design target is:

```txt
Message carries: intent, metadata, routing, constraints, artifact refs
Artifact store carries: diffs, reports, logs, datasets, screenshots, generated files
State store carries: authoritative lifecycle state
```
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-101

```text
Artifact references must be stable enough for later readers:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-102

````text
```json
{
  "ref": "artifact://dispatch/run_456/test-report.json",
  "type": "test_report",
  "name": "tests",
  "sha256": "..."
}
```
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-103

```text
For code work, a git commit is an artifact reference:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-104

````text
```json
{
  "ref": "git://forgentX/commit/abc123",
  "type": "git_commit",
  "name": "implementation"
}
```
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-105

```text
The artifact store is deferred in the narrow slice because no structured result reader is being shipped yet.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#12-transport

```text
## 12. Transport

Transport is how messages and work activation move. It is not the protocol.

Supported or planned transport families:

- CLI subprocess spawn;
- CLI spawn through a visible Herdr pane;
- stdout/NDJSON frames;
- filesystem mailbox;
- MCP call;
- HTTP/API call.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-106

```text
Transport is how messages and work activation move. It is not the protocol.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-107

```text
Supported or planned transport families:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-108

```text
- CLI subprocess spawn;
- CLI spawn through a visible Herdr pane;
- stdout/NDJSON frames;
- filesystem mailbox;
- MCP call;
- HTTP/API call.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#121-herdr-runtime-role

```text
### 12.1 Herdr Runtime Role

Herdr is runtime/orchestration/visibility:

- open or reuse a pane;
- start an agent process;
- show live output to the human;
- preserve terminal/session context;
- provide attention/liveness signals.

Herdr is not the authority for:

- whether a work item is done;
- whether a blocker is resolved;
- whether a review passed;
- whether artifacts are accepted.

Those facts come from runner state, structured agent events, artifact refs, and verification.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-109

```text
Herdr is runtime/orchestration/visibility:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-110

```text
- open or reuse a pane;
- start an agent process;
- show live output to the human;
- preserve terminal/session context;
- provide attention/liveness signals.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-111

```text
Herdr is not the authority for:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-112

```text
- whether a work item is done;
- whether a blocker is resolved;
- whether a review passed;
- whether artifacts are accepted.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-113

```text
Those facts come from runner state, structured agent events, artifact refs, and verification.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#121a-herdr-own-rust-vocabulary-is-a-separate-namespace

```text
### 12.1a Herdr Own Rust Vocabulary Is a Separate Namespace

Herdr's Rust implementation (`herdr-dashboard/src/`) names several of its own
types with "orchestrator" in Rust-identifier casing: the `PaneOrchestrator`
trait (`ports.rs`) governing pane open/reuse/focus, and the
`OrchestratorSettings`/`HerdrOrchestratorToggles` structs (`settings.rs`,
`main.rs`) governing the `herdrOrchestrator` auto-launch config section
(auto-discover/auto-merge/auto-retro/auto-cleanup pane launching). These
are Rust port terms describing Herdr's own pane-lifecycle and toggle
mechanics — a different vocabulary from this document's own "orchestrator"
glossary entry above (§5.1: the T0 composition layer that manages N units of work and stays attached). Do not
rename `PaneOrchestrator` or its sibling identifiers to align with that
glossary sense, and do not read a `PaneOrchestrator`/`OrchestratorSettings`
citation elsewhere in the repo as evidence fgOS's own dispatch layer is
being described.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-114

```text
Herdr's Rust implementation (`herdr-dashboard/src/`) names several of its own
types with "orchestrator" in Rust-identifier casing: the `PaneOrchestrator`
trait (`ports.rs`) governing pane open/reuse/focus, and the
`OrchestratorSettings`/`HerdrOrchestratorToggles` structs (`settings.rs`,
`main.rs`) governing the `herdrOrchestrator` auto-launch config section
(auto-discover/auto-merge/auto-retro/auto-cleanup pane launching). These
are Rust port terms describing Herdr's own pane-lifecycle and toggle
mechanics — a different vocabulary from this document's own "orchestrator"
glossary entry above (§5.1: the T0 composition layer that manages N units of work and stays attached). Do not
rename `PaneOrchestrator` or its sibling identifiers to align with that
glossary sense, and do not read a `PaneOrchestrator`/`OrchestratorSettings`
citation elsewhere in the repo as evidence fgOS's own dispatch layer is
being described.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#122-near-term-herdr-adapter

````text
### 12.2 Near-Term Herdr Adapter

The near-term implementation should use:

```txt
invocation.via = "cli"
executor.adapter = "herdr-spawn"
```

This lets the resolver keep its current CLI-shaped contract while the transport layer launches the worker in Herdr instead of a hidden child process.

The later design target may add a true `protocol:"herdr"` or mailbox transport, but that should wait until a real AgentMessage consumer exists.

Implemented adapter contract for the reviewed narrow slice:

- `herdr-spawn` is selected only by the executor adapter field.
- The adapter always creates a fresh Herdr pane for the dispatched worker; it does not reuse an existing pane.
- The worker command is run through a temporary script so prompt text and shell metacharacters are not reinterpreted as a pane command.
- The temporary script removes itself at startup so a crash does not leave the full prompt behind on disk.
- The adapter injects a runner-owned completion sentinel after the real worker command exits.
- Herdr observation waits for that runner-owned sentinel, not for `[DONE]` or `[BLOCKED]`.
- The captured Herdr transcript is normalized by stripping echoed script-invocation lines before downstream result parsing.
- Missing `result.read.text`, missing sentinel evidence, or observer failure is a transport failure, not a worker success.
- Timeout belongs to the adapter: on timeout it closes the pane, kills the observer process group, releases local pipes, and rejects immediately without waiting for Herdr or descendant processes to close.
- Resolved executor environment is passed into the pane, but secret values are not included in adapter error messages.

The important protocol split:

```txt
runner-owned sentinel = proves the pane command exited and transcript is complete
[DONE]/[BLOCKED]      = optional legacy semantic signal emitted by the worker
git head delta        = fallback inference when no semantic signal appears
```

This keeps Herdr compatible with the current prompt/stdout protocol while avoiding the false conclusion that a terminal token is a full AgentMessage.
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-115

```text
The near-term implementation should use:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-116

````text
```txt
invocation.via = "cli"
executor.adapter = "herdr-spawn"
```
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-117

```text
This lets the resolver keep its current CLI-shaped contract while the transport layer launches the worker in Herdr instead of a hidden child process.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-118

```text
The later design target may add a true `protocol:"herdr"` or mailbox transport, but that should wait until a real AgentMessage consumer exists.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-119

```text
Implemented adapter contract for the reviewed narrow slice:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-120

```text
- `herdr-spawn` is selected only by the executor adapter field.
- The adapter always creates a fresh Herdr pane for the dispatched worker; it does not reuse an existing pane.
- The worker command is run through a temporary script so prompt text and shell metacharacters are not reinterpreted as a pane command.
- The temporary script removes itself at startup so a crash does not leave the full prompt behind on disk.
- The adapter injects a runner-owned completion sentinel after the real worker command exits.
- Herdr observation waits for that runner-owned sentinel, not for `[DONE]` or `[BLOCKED]`.
- The captured Herdr transcript is normalized by stripping echoed script-invocation lines before downstream result parsing.
- Missing `result.read.text`, missing sentinel evidence, or observer failure is a transport failure, not a worker success.
- Timeout belongs to the adapter: on timeout it closes the pane, kills the observer process group, releases local pipes, and rejects immediately without waiting for Herdr or descendant processes to close.
- Resolved executor environment is passed into the pane, but secret values are not included in adapter error messages.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-121

```text
The important protocol split:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-122

````text
```txt
runner-owned sentinel = proves the pane command exited and transcript is complete
[DONE]/[BLOCKED]      = optional legacy semantic signal emitted by the worker
git head delta        = fallback inference when no semantic signal appears
```
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-123

```text
This keeps Herdr compatible with the current prompt/stdout protocol while avoiding the false conclusion that a terminal token is a full AgentMessage.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#13-full-design-target

````text
## 13. Full Design Target

The full target architecture is:

```txt
Caller
  -> DispatchPlan
  -> governance check
  -> transport adapter
  -> worker runtime
  -> structured result or fallback signal
  -> artifact refs
  -> runner-owned state update
```

Logical layers:

```txt
Semantic layer:
  DispatchPlan, DispatchAssignment, RESULT/BLOCKER, governance

Message layer:
  AgentMessage envelope, correlation, delivery, idempotency

Artifact layer:
  git refs, local artifacts, reports, datasets, logs

Execution layer:
  cli-spawn, herdr-spawn, mailbox, MCP, API

State layer:
  fgOS event log and derived state; runner remains the writer
```
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-124

```text
The full target architecture is:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#14-narrow-implementation-status

````text
## 14. Narrow Implementation Status

This is the current implementation slice. It intentionally does not implement the full design target.

Reviewed candidate branch:

```txt
fgw/tsk-5x7
```

Review outcome:

- no remaining P1/P2 findings in the committed diff;
- ready to merge by `main...HEAD` review scope;
- unrelated dirty worktree state remains outside the committed-diff scope;
- full AgentMessage, mailbox, artifact store, and structured confidence telemetry remain deferred.
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-128

```text
Reviewed candidate branch:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-129

````text
```txt
fgw/tsk-5x7
```
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-131

```text
Status: implemented in the reviewed candidate.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-132

```text
Implemented behavior:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#142-item-1---governance-egress

```text
### 14.2 Item 1 - Governance Egress

Status: implemented in the reviewed candidate.

Implemented behavior:

- command-only cross-provider judgment is replaced with effective egress judgment;
- `carries` remains the content-class vocabulary;
- egress classification records provider family, target, content class, command, and adapter context through the resolved executor path;
- a Claude-looking command with `ANTHROPIC_BASE_URL` routed to OpenRouter is cross-provider egress and fails closed unless explicitly allowed;
- malformed or deceptive endpoint overrides fail closed;
- same-provider Claude resolves as same-provider governance;
- non-Claude executors must explicitly allow cross-provider egress when carrying repo content.

Proof:

- an executor that routes to another provider through env/model is not allowed merely because its command is `claude`;
- governance tests cover allowed and blocked cross-provider cases.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-136

```text
Status: implemented in the reviewed candidate.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-137

```text
Implemented behavior:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#143-item-2---herdr-spawn-adapter

```text
### 14.3 Item 2 - `herdr-spawn` Adapter

Status: implemented in the reviewed candidate.

Implemented behavior:

- a configured executor with `adapter:"herdr-spawn"` routes through the Herdr adapter;
- `invocation.via:"cli"` remains the resolver-compatible invocation type;
- every dispatch creates a fresh pane;
- pane output is captured and normalized before the existing result parser sees it;
- worker completion is detected by the runner-owned sentinel after real command exit, not by `[DONE]`/`[BLOCKED]`;
- prompts that mention `[DONE]` as instructional prose do not trigger false success;
- workers that emit no semantic token still resolve through the existing `unsignaled`/git-state fallback path;
- timeouts close the Herdr pane and do not wait on observer descendants that keep pipes open;
- observer failures surface as transport failures.

Proof:

- a configured executor with `adapter:"herdr-spawn"` routes through the adapter;
- Herdr starts a fresh pane and runs the intended command;
- Herdr does not write or decide fgOS task state;
- result handling still accepts structured output if present, then `[DONE]`/`[BLOCKED]`, then git-state inference.

Review verification:

- `node --test test/runner/herdr-spawn-adapter.test.mjs` - 20/20 pass.
- `node --test test/runner/egress-governance.test.mjs` - 6/6 pass.
- `node --test test/runner/dispatch.test.mjs test/runner/loop.test.mjs` - 401/401 pass.
- `git diff --check main...HEAD` - clean.
- Live timeout probes reject around 104-112ms instead of the earlier 1000-10000ms delayed failure shape.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-140

```text
Status: implemented in the reviewed candidate.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-141

```text
Implemented behavior:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#15-deferred-until-a-consumer-exists

```text
## 15. Deferred Until A Consumer Exists

These remain part of the architecture target but are not part of the narrow slice:

- full AgentMessage envelope implementation;
- DispatchAssignment rename/migration from exec packet/ad-hoc task;
- artifact store V1;
- mailbox;
- protocol registry beyond the existing adapter registry;
- structured RESULT migration with confidence telemetry;
- ACK/PROGRESS/QUESTION/ANSWER/REVIEW/CANCEL message types.

Entry criteria to pull one of these forward:

- a production reader needs the data;
- Herdr/CLI usage shows fallback result quality is insufficient;
- multiple agents need async QUESTION/BLOCKER/ANSWER flow;
- artifact references are needed to avoid passing large data through conversation;
- provider compliance telemetry has a concrete dashboard/gate/report consumer.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#16-implementation-pointers

```text
## 16. Implementation Pointers

Current dispatch files:

- `src/runner/dispatch/plan.mjs`
- `src/runner/dispatch/config.mjs`
- `src/runner/dispatch/resolve.mjs`
- `src/runner/dispatch/mechanism.mjs`
- `src/runner/dispatch/transport.mjs`
- `src/runner/dispatch/prepare.mjs`
- `src/runner/dispatch/cli.mjs`
- `src/runner/dispatch/result-ladder.mjs` — confidence-ladder result normalization, extracted from `cli.mjs` by `tsk-2tr` (§17.2/§17.3), consumed by `src/report/dispatch-confidence.mjs`.
- `src/runner/dispatch.mjs`

Result-confidence reader (§10/§15 entry criterion pulled forward by `tsk-1g6`, §17.2/§17.3):

- `src/report/dispatch-confidence.mjs`
- wired into `bin/fgos.mjs` and `src/cli/command-registry.mjs`

Current prompt/protocol references:

- `plugins/fgOS/skills/_shared/executor-dispatch-fallback.md`
- `plugins/fgOS/skills/_shared/coding-worker-contract.md`
- `src/runner/prompt-templates/worker-prompt-skill-pointer.txt`

Current focused tests for the narrow slice:

- `test/runner/dispatch.test.mjs`
- `test/runner/egress-governance.test.mjs`
- `test/runner/herdr-spawn-adapter.test.mjs`
- `test/runner/loop.test.mjs`

Decision/history anchors:

- `docs/specs/runner.md` sections for Native-First Dispatch Doctrine and executor/capability rename;
- `docs/history/two-layer-dispatch/`;
- `docs/history/dispatch-concept-boundary/`;
- `docs/history/task-dispatch-unification/`.
- `docs/history/tsk-5x7/`.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-149

```text
Current dispatch files:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-153

```text
Current prompt/protocol references:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-157

```text
Decision/history anchors:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#18-broader-orchestration-vocabulary

```text
## 18. Broader Orchestration Vocabulary

This document defines the dispatch-control-plane slice: how one selected
target resolves to an executor, mechanism, governance decision, adapter, and
result signal.

For the broader orchestration map around this slice, including the distinction
between mission, work, workflow, assignment, dispatch, runtime, evidence, and
visibility, see the canonical [Vocabulary Map](../vocabulary/README.md).
```

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#team-communication-protocol-v1

````text
# Team Communication Protocol V1

```txt
Document type: Proposal
Audience: Maintainer, implementation agent and independent reviewer
Purpose: Preserve current contracts and explicitly distinguish unimplemented design from retired engine history
Design status: Candidate
Implementation: Section-specific; proposal schemas and dated findings are not blanket implementation claims
Provenance: Restored from 7880fbc74b07c3667ebaa61f2b0561b5d80471b5 after independent liveness review
Writer type: Human + agent coauthor
Canonical for: The current subject and design boundaries stated in this file; not retired engine authority
Use this when: Reading the surviving contract, its implementation limits or current proposals
Do not use this for: Reinstating the retired coordination engine or treating proposal details as shipped behavior
Last reviewed: Pending independent liveness re-review
Related:
- docs/platform/agent-coordination/README.md
- docs/specs/runner.md
Supersedes: Incorrect whole-file retirement or over-removal only
Superseded by: None for the surviving current subject
Added in candidate: Liveness evidence and explicit implementation/proposal distinction
```

Complete pre-rework input: [historical snapshot](../history/retired-engine/files/proposals/team-communication-protocol-v1.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.
````

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-1

````text
```txt
Document type: Proposal
Audience: Maintainer, implementation agent and independent reviewer
Purpose: Preserve current contracts and explicitly distinguish unimplemented design from retired engine history
Design status: Candidate
Implementation: Section-specific; proposal schemas and dated findings are not blanket implementation claims
Provenance: Restored from 7880fbc74b07c3667ebaa61f2b0561b5d80471b5 after independent liveness review
Writer type: Human + agent coauthor
Canonical for: The current subject and design boundaries stated in this file; not retired engine authority
Use this when: Reading the surviving contract, its implementation limits or current proposals
Do not use this for: Reinstating the retired coordination engine or treating proposal details as shipped behavior
Last reviewed: Pending independent liveness re-review
Related:
- docs/platform/agent-coordination/README.md
- docs/specs/runner.md
Supersedes: Incorrect whole-file retirement or over-removal only
Superseded by: None for the surviving current subject
Added in candidate: Liveness evidence and explicit implementation/proposal distinction
```
````

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-2

```text
Complete pre-rework input: [historical snapshot](../history/retired-engine/files/proposals/team-communication-protocol-v1.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.
```

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#1-purpose

````text
## 1. Purpose

Team Dispatch V1 needs a communication protocol, but it must stay smaller than
a mailbox, daemon, or second lifecycle system.

This proposal describes a Work-attached coding-domain protocol and one early
standalone prototype. It is not the universal entry model for Agent
Coordination. Per the [Agent Coordination Foundation Vision](../vision.md), an
agent-led session may coordinate through validated dynamic execution contracts
without a predeclared Workflow/Stage graph.

The protocol defines how roles communicate while `Work` remains the lifecycle
authority:

```txt
Work position
  -> current workflow stage
    -> legal stage operations
      -> selected Assignment
        -> one Run
          -> one RunResult
            -> driver chooses the next legal operation or engine verb
```

The protocol is not a meeting scheduler. It is the set of rules that make one
role's message usable by another role without trusting terminal text or agent
say-so as proof.
````

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#2-non-negotiable-boundaries

````text
## 2. Non-Negotiable Boundaries

```txt
Work is lifecycle authority.
Mission is a lightweight team envelope.
Stage is workflow position.
Stage Operation is one legal task-shaped action inside a stage.
Assignment is a semantic request.
Run is a runtime attempt.
RunResult is normalized result plus evidence.
Herdr is visibility only.
```

Do not introduce `Job` in V1. `Job` remains reserved for a future queue,
scheduler, lease, cancellation, or worker-pool design.

Do not let an Assignment mutate Work lifecycle state by itself. Work moves only
through existing engine verbs such as `fgos discover`, `fgos plan`, `fgos
return`, `fgos ask`, `fgos answer`, and approval/merge verbs.
````

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#3-roles

```text
## 3. Roles

The coding domain starts with the roles already declared in the role graph:

| Role | Responsibility | Typical operation family |
|---|---|---|
| `implementer` | Owns the current Work item, edits repo state, invokes engine verbs, and coordinates legal sub-calls. | `judge-ambiguity`, `shape-plan`, `implement-item`, `fix-verify-red` |
| `researcher` | Gathers evidence and facts. It may read repo context, run approved research tools, or inspect docs. | `resolve-question`, `scout-blast-radius` |
| `reviewer` | Finds correctness, feasibility, regression, and test risks. | `validate-plan`, `review-item` |
| `helper` | Performs an independent scoped piece whose footprint does not collide with the driver's active edit surface. | `scoped-subtask` |
| `advisor` | Answers product, scope, priority, or human-intent questions that cannot be settled from machine evidence. | `answer-question`, selected `advise` interactions |

Role is not executor. A reviewer can run on Codex, Claude, agy, pi, or a future
executor if policy and governance allow it.

Role is not stage owner. A stage owner may dispatch an Assignment to another
role while the Work item stays at the same stage.
```

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#4-communication-modes

```text
## 4. Communication Modes

The role graph's `mode` field has protocol meaning:

| Mode | Meaning | Lifecycle effect | Required evidence |
|---|---|---|---|
| `sync` | Caller waits for a bounded finding or work product, then continues in the same stage. | Work usually stays claimed by the caller; holder may be logged but returns immediately. | Structured result artifact for read-only calls; git/artifact delta for mutating helper work. |
| `async` | Caller cannot continue without another actor or human-adjacent answer. | Work may park, or holder may move until a future reclaim. | A recorded question, answer, review verdict, or blocker with context refs. |

`sync` does not mean invisible. It still needs a recorded handoff or Assignment
RunResult when the result matters to later decisions.

`async` does not mean a new Work item. It becomes Work only when the request
needs independent lifecycle, approval, merge, or backlog visibility.
```

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#5-workflow-step-operation-selection

```text
## 5. Workflow Step Operation Selection

The current Workflow helper is `operationsForStep(wf, stepId, { defaultRole })`
(`src/workflow/steps.mjs:70-85`). The old domain/stage/kind signature is historical.
The selection rules below remain a communication/driver design proposal, not proof
that every communication mode is implemented.

Selection rules:

1. Prefer the primary operation when the stage's normal owner work remains the
   next required action.
2. Choose a secondary operation when a bounded role contribution would unblock
   the stage without creating lifecycle-bearing child work.
3. Create child Work only when the contribution needs its own claim, branch,
   verify, approval, merge, or backlog visibility.
4. Route discovery unresolved ambiguity to `exploring`; discovery must not ask
   the human directly.
5. Refuse operations marked `dispatch: human-only` from cli-spawn assignment
   execution.
6. Refuse synthetic compatibility operations from runtime dispatch unless their
   task-spec file resolves and the caller explicitly accepts compatibility
   dispatch.

Examples:

| Stage | Situation | Operation |
|---|---|---|
| `discovery` | Need machine evidence for ambiguity. | `resolve-question` to `researcher`, then owner decides `clear` or `unclear`. |
| `planning` | Plan is written and needs proof before the edge to executing. | `validate-plan` to `reviewer`. |
| `planning` | A symbol's blast radius is unknown. | `scout-blast-radius` to `researcher`. |
| `executing` | Implementation needs a separate non-overlapping edit. | `scoped-subtask` to `helper`. |
| `executing` | Returned diff needs independent review. | `review-item` to `reviewer`. |
| `executing` | Review or verify reports a concrete red issue. | `fix-verify-red` to `implementer`. |
```

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-19

```text
The current Workflow helper is `operationsForStep(wf, stepId, { defaultRole })`
(`src/workflow/steps.mjs:70-85`). The old domain/stage/kind signature is historical.
The selection rules below remain a communication/driver design proposal, not proof
that every communication mode is implemented.
```

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#6-assignment-message-contract

````text
## 6. Assignment Message Contract

Every assignment prompt must provide the worker with enough information to
produce a usable result without learning fgOS internals.

Required prompt fields:

```txt
Assignment: <assignmentId>
Work: <workId or (none)>
Stage operation: <stage>.<operation>
Role: <role>
Task-spec: <task-spec path>
Objective: <bounded request>
Context refs:
- <ref>
Expected outputs:
- <output>
Result artifact:
- Write JSON to <runDir>/agent-result.json
- Optionally write Markdown to <runDir>/agent-report.md
```

The prompt must say that the worker should not call Work lifecycle verbs unless
the task-spec explicitly says the worker is the lifecycle driver. Ordinary
Assignment workers return artifacts; the driver interprets them.

The prompt must pass refs, not embedded large docs, diffs, transcripts, or
secrets.
````

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-23

```text
Required prompt fields:
```

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#7-agent-result-schema

````text
## 7. Agent Result Schema

`agent-result.json` is the worker's structured claim. It is not proof by
itself.

Minimal schema:

```json
{
  "status": "done",
  "summary": "One concise result sentence.",
  "findings": [],
  "evidenceRefs": [],
  "nextRecommendedOperation": null
}
```

Allowed status values:

| Status | Meaning |
|---|---|
| `done` | The worker believes the assignment objective is complete. |
| `blocked` | The worker could not complete because a named blocker remains. |
| `failed` | The worker attempted the assignment and produced an error or invalid output. |
| `no-evidence` | The worker can report context but cannot support a completion claim. |

Required fields by status:

| Status | Required fields |
|---|---|
| `done` | `summary`; at least one `evidenceRefs` entry or a companion `agent-report.md` for read-only work; external git/artifact evidence for mutating work. |
| `blocked` | `summary`; `blocker`; `evidenceRefs` when any evidence exists. |
| `failed` | `summary`; `error`. |
| `no-evidence` | `summary`; reason why evidence is absent. |

Optional `nextRecommendedOperation` may name another legal stage operation, but
it is only a recommendation. The driver must verify legality before acting.
````

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-29

```text
Allowed status values:
```

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-31

```text
Required fields by status:
```

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#8-runresult-confidence

```text
## 8. RunResult Confidence

RunResult status and confidence are control-plane judgments.

Confidence ladder:

| Confidence | Meaning | Allowed use |
|---|---|---|
| `verified` | Structured claim plus post-run external evidence such as a new commit, new changed file, test artifact, or verified result file. | May feed lifecycle decisions that require proof. |
| `reported` | Structured claim plus a worker-produced report for read-only consult/review work. | May feed driver judgment, but should not close mutating work. |
| `inferred` | Post-run external evidence exists but no structured claim exists. | May be surfaced for inspection; driver should avoid automatic lifecycle movement. |
| `no-evidence` | Process settled without proof. | Must not advance Work. |
| `failed` | Timeout, nonzero exit, signal, invalid schema, or explicit failure. | Must not advance Work. |

The driver must treat `done/no-evidence` as not done. It may retry, ask for a
proper artifact, or route to a different legal operation.
```

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#9-handoff-versus-assignment

```text
## 9. Handoff Versus Assignment

Use `handoff` when the interaction is a short role-axis record around work the
current session already performed or directly observed.

Use Assignment when:

- another executor, provider, role, or tool performs the action;
- the result will be read by a later driver turn;
- the result needs Run/RunResult evidence;
- the interaction may fail independently;
- a read-only consult/review needs an artifact rather than a one-line summary.

`handoff` remains useful for visibility and role-holder truth. It is not enough
evidence for a Team Dispatch operation once the result influences a lifecycle
decision.
```

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#10-coding-domain-stage-protocols

```text
## 10. Coding-Domain Stage Protocols
```

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#101-discovery

```text
### 10.1 Discovery

Discovery is machine-alone.

Allowed behavior:

- owner reads existing Work context;
- owner consults researcher helpers for evidence;
- owner logs consult interactions;
- owner chooses `clear` or `unclear`;
- `clear` can route to planning;
- `unclear` routes to exploring.

Forbidden behavior:

- asking the human directly;
- parking as `awaiting-human`;
- treating a helper's unsupported answer as proof;
- opening a new Work item just to answer a bounded evidence question.
```

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-40

```text
Discovery is machine-alone.
```

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#102-exploring

```text
### 10.2 Exploring

Exploring is the human-adjacent decision-locking stage.

Allowed behavior:

- advisor interaction for material, grounded, answerable product questions;
- researcher consult for repo or external facts;
- lock decisions into CONTEXT.md.

Exploring may ask a human. It should ask only after machine evidence has been
gathered and the question is self-contained.
```

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#103-planning

```text
### 10.3 Planning

Planning has two main operation families:

- `shape-plan` by implementer;
- `validate-plan` by reviewer.

The stage owner may write the plan directly, but validation should move toward
a reviewer Assignment once Step 05 adopts operation choice.

`validate-plan` is a real reviewer-role operation when dispatched through
Assignment. Prose that says validating is only an implementer function must be
reconciled before driver adoption.
```

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#104-executing

```text
### 10.4 Executing

Executing has the richest team protocol:

- implementer owns the main edit path;
- researcher may answer blast-radius or API/pattern questions;
- helper may take independent scoped work;
- reviewer may review returned diffs or candidate fixes;
- advisor handles product/scope questions that exceed locked decisions.

The implementer remains responsible for Work lifecycle. Helper/reviewer
assignments return artifacts and recommendations unless explicitly promoted to
child Work.
```

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#11-coordination-operating-harness

````text
## 11. Coordination Operating Harness

Multi-agent implementation benefits from a durable operating harness:

```txt
trace/index.md
trace/current-cell.md
trace/<cell>.md
prompt templates
review and red-team gates
live proof capture
```

This harness is documented in
[coordination-operating-harness.md](../playbooks/coordination-operating-harness.md). It is
supporting engineering practice, not Step 07 runtime infrastructure and not a
lifecycle system. Its job is to keep coordinator, doer, reviewer, and red-team
sessions aligned while preserving token budget and proof traceability.

The harness should be used where it reduces implementation drift, but dogfooding
it is not a runtime dependency gate for standalone coordination.
````

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#12-standalone-read-only-coordination

```text
## 12. Standalone Read-Only Coordination

The former session-engine runtime path is historical. Current standalone execution uses Unit/CollaborationPattern, not that protocol profile. The manual operating harness in section 11 remains current by owner decision.
```

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-57

```text
The former session-engine runtime path is historical. Current standalone execution uses Unit/CollaborationPattern, not that protocol profile. The manual operating harness in section 11 remains current by owner decision.
```
