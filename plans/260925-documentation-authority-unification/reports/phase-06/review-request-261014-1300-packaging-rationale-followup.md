# Packaging-distribution rationale-only follow-up

Author session: codex-session:11@2026-10-14
Original carriage author session: codex-session:8@2026-10-13
Independent report: `plans/260925-documentation-authority-unification/reports/phase-06/review-4-packaging-followup.md` at `d57231686ec1533d4de36507e814c2484da31f72`
Content and fresh proof commit: `478c54d67c4721d495687a88408780f82235f793`
Review mode requested: ordinary
State: ready-for-review; STOP for independent Lead

Review only the three rationale rows shown below. Each change names the existing labelled status-note additions; every other field in these three rows, all source/target text and all native tuples are unchanged. The rows remain pending without approval pins. No additional text correction is proposed.

All 26 ok verdict notes from the committed report are accepted verbatim: 12 source approvals applied by unchanged --apply-review and 14 truth/native/A28 evidence acceptances recorded with that report pin in the verification artifact. The report's minor unit-28 wording observation is accepted evidence, not an additional edit authorized in this turn.

The dropped-010 proposal, entire dropped register and FLAGGED retention remain byte-unchanged. F6 remains an owner decision. No batch closure, Step 5, promotion, main merge/write or push.

## Proof boundary

D against both prior registries: exit 0, zero fatal. Scoped strict E against both: expected exit 1 with exactly three pending source rows, one partial carry, two identical-unit groups, one pending dropped-001 register entry and 692 candidate-unverified units. E is not a strict-closure claim.

Native equality: all 94,333 immediate-prior known ID/path/anchor/digest tuples equal current; no missing ID, new ID or changed native tuple in this turn. Active registry/inventory tuples equal; 407 source rows (404 reviewed, three pending), 31 reviewed successors and 21 reviewed prior heading bindings. Agent 488 and Host 588 candidate tuple sets unchanged. Registry 59,450,050 bytes, below 90 MB; scratch only.

Targeted review/apply tests: 29/29 pass with env -u CLAUDE_CODE_SESSION_ID; zero fail/cancel/skip/todo. Preservation, ratchet, placement and candidate checks pass. No full-suite, installed-release, gateway or fresh truth-sample claim.

Full application notes, row objects/digests, commands, outputs and reproduction helper sources: `plans/260925-documentation-authority-unification/reports/phase-06/review-request-261014-1300-packaging-rationale-followup.json`; SHA256 `4bc4fd019686a7e0375200e2489072afa490f72ab2db7e057af73e5585bbccac`.

## claim_e4bf9b812f0b787bcf56246677865361

Shard: `plans/260925-documentation-authority-unification/ledger/decisions/s4-packaging-distribution-architecture.json`
Disposition: `move`; reviewStatus: `pending`.

Previous rationale:
The complete heading from docs/architect/packaging-distribution/runtime-identity-and-activation.md#6-workspaceactivationbinding, under "6. WorkspaceActivationBinding", is retained at docs/platform/packaging-distribution/contracts/activation-binding.md#6-workspaceactivationbinding. Only heading depth changes; the direct section payload follows the original source order. The named owner is the contracts/activation-binding.md topic owner; carriage does not certify current implementation.

Current rationale:
The complete heading from docs/architect/packaging-distribution/runtime-identity-and-activation.md#6-workspaceactivationbinding, under "6. WorkspaceActivationBinding", is retained at docs/platform/packaging-distribution/contracts/activation-binding.md#6-workspaceactivationbinding. Heading depth changes; the target also adds the labelled Retained dated design — status note (2026-10-14) before the bootstrap-context permission and the labelled Status note (2026-10-14) after the candidate permission paragraph; the direct section payload follows the original source order. The named owner is the contracts/activation-binding.md topic owner; carriage does not certify current implementation.

Before decision SHA256 (sorted UTF-8 compact JSON): `d47325a0ee0cd860c63119b590388215871cb1b7be4fade861399ace28e13df9`
Current decision SHA256 (same encoding): `b1ddbf1ef47630c8ccec0a015f31345144f04346b91ac553719a8f418eaae563`

Complete current decision:

~~~~~~~~json
{
  "claimId": "claim_e4bf9b812f0b787bcf56246677865361",
  "sourceUnitDigest": "57af5b1c65fd1dda38b5e2fa7e5231049f66141d34f71578f2509b78a4994305",
  "targetOwner": "docs/platform/packaging-distribution/contracts/activation-binding.md",
  "targetAnchor": "6-workspaceactivationbinding",
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:10@2026-10-14",
  "rationale": "The complete heading from docs/architect/packaging-distribution/runtime-identity-and-activation.md#6-workspaceactivationbinding, under \"6. WorkspaceActivationBinding\", is retained at docs/platform/packaging-distribution/contracts/activation-binding.md#6-workspaceactivationbinding. Heading depth changes; the target also adds the labelled Retained dated design — status note (2026-10-14) before the bootstrap-context permission and the labelled Status note (2026-10-14) after the candidate permission paragraph; the direct section payload follows the original source order. The named owner is the contracts/activation-binding.md topic owner; carriage does not certify current implementation.",
  "reviewNote": "Stored digest has no target match; independent re-review required."
}
~~~~~~~~

Complete source: `docs/architect/packaging-distribution/runtime-identity-and-activation.md#6-workspaceactivationbinding`
Unit digest: `57af5b1c65fd1dda38b5e2fa7e5231049f66141d34f71578f2509b78a4994305`; full shown-text SHA256: `bf8d61bb919b6ecb32f956bdc469ef583855749d23994adcc064d9ef384830d4`

~~~~~~~~markdown
## 6. WorkspaceActivationBinding

Activation is the moment a staged and verified release becomes the runtime
authority for one workspace. V1 uses workspace
`.fgos/installation/activation.json` as a durably published ready binding, not a
symlink and not one repository-wide active pointer.

Minimum fields:

```json
{
  "schemaVersion": 1,
  "repositoryId": "repo_...",
  "workspaceId": "wks_...",
  "workStateId": "state_...",
  "activationId": "act_...",
  "status": "ready",
  "artifactDigest": "sha256:...",
  "releasePath": "<release-store-root>/releases/sha256-...",
  "previousArtifactDigest": "sha256:...",
  "shimVersion": "1",
  "resolvedDependencies": {
    "node": "/usr/bin/node"
  },
  "pinSnapshot": {},
  "activatedAt": "2026-09-04T00:00:00Z",
  "activatedBy": {
    "tool": "fgctl",
    "version": "..."
  }
}
```

Publishing must be atomic from the perspective of invocations. A project
command must see either the previous ready workspace binding or the new ready
workspace binding, never a half-prepared runtime.

`fgctl` must hold the release store `install.lock` before staging, verifying,
repairing, upgrading, rolling back, or quarantining release content. It must
also hold a workspace activation lock before writing that workspace's
`activation.json`. Projection writes are not part of the activation publish;
they belong to local `fgos init` / `fgos doctor --fix` under projection locks
defined by workspace topology.

Implementation should use a temp file plus atomic rename for
`activation.json`:

```txt
write <workspace-root>/.fgos/installation/activation.json.tmp.<activationId>
fsync file when supported
rename tmp -> <workspace-root>/.fgos/installation/activation.json
fsync parent directory when supported
```

The stable shims under `.fgos/installation/bin/` should not change during normal
activation. Activation changes the selected release identity, not the command
path callers use.

`activation.json` should contain only a durably published ready runtime
binding. Do not write `status: "preparing"` into `activation.json`.
Installation/activation transaction state belongs in the release store:

```txt
<release-store-root>/installs/<activationId>.json
```

Possible transaction statuses:

```txt
staging
verified
preparing
ready-published
ready-degraded
complete
failed
quarantined
```

Failure rules:

| Failure Point | `activation.json` | Transaction / Payload Action |
|---|---|---|
| Acquire/stage fails | Unchanged | Mark install transaction failed; remove or keep staged temp for diagnostics. |
| Verify fails | Unchanged | Refuse activation; quarantine or remove staged release. |
| Runtime dependency missing | Unchanged | Refuse activation with `runtime-dependency-missing`. |
| Candidate preflight fails before publish | Unchanged | Mark transaction `failed`; candidate has no writer authority and must not touch host-visible projections. |
| Atomic binding write fails | Previous ready binding remains authoritative if readable | Fail closed; do not run local workflow from candidate. |
| Active local `fgos init` / `doctor --fix` projection tail fails after publish | New ready binding remains authoritative | Mark transaction `ready-degraded`; local doctor reports repair action. |

The important rule is readiness: a candidate release does not gain writer
authority merely because it was staged or verified. It gains writer authority
for a workspace only after the workspace binding is published with
`status: "ready"`.

During preparation, `fgctl` may invoke the candidate release directly with a
restricted bootstrap context:

```txt
FGOS_BOOTSTRAP_CANDIDATE=1
FGOS_CANDIDATE_ARTIFACT_DIGEST=<digest>
FGOS_CANDIDATE_RELEASE_PATH=<path>
```

In that context the candidate may run preflight checks and write only staging
records under the installation transaction. It must not write host-visible
projection paths, execute general workflow mutations, or claim/write shared
work-state as the active runtime.
~~~~~~~~

Complete unchanged current target: `docs/platform/packaging-distribution/contracts/activation-binding.md#6-workspaceactivationbinding`
Unit digest: `32761eb7cc5ab63a191f4a707e6e56cf65a32c3dd5d605aa5558346377edfb40`; full shown-text SHA256: `ee69bcb619898365a7b38bc0eb13bb4ab438e82e13b39b6553be5dea8cf8e2c8`

~~~~~~~~markdown
#### 6. WorkspaceActivationBinding

Activation is the moment a staged and verified release becomes the runtime
authority for one workspace. V1 uses workspace
`.fgos/installation/activation.json` as a durably published ready binding, not a
symlink and not one repository-wide active pointer.

Minimum fields:

```json
{
  "schemaVersion": 1,
  "repositoryId": "repo_...",
  "workspaceId": "wks_...",
  "workStateId": "state_...",
  "activationId": "act_...",
  "status": "ready",
  "artifactDigest": "sha256:...",
  "releasePath": "<release-store-root>/releases/sha256-...",
  "previousArtifactDigest": "sha256:...",
  "shimVersion": "1",
  "resolvedDependencies": {
    "node": "/usr/bin/node"
  },
  "pinSnapshot": {},
  "activatedAt": "2026-09-04T00:00:00Z",
  "activatedBy": {
    "tool": "fgctl",
    "version": "..."
  }
}
```

Publishing must be atomic from the perspective of invocations. A project
command must see either the previous ready workspace binding or the new ready
workspace binding, never a half-prepared runtime.

`fgctl` must hold the release store `install.lock` before staging, verifying,
repairing, upgrading, rolling back, or quarantining release content. It must
also hold a workspace activation lock before writing that workspace's
`activation.json`. Projection writes are not part of the activation publish;
they belong to local `fgos init` / `fgos doctor --fix` under projection locks
defined by workspace topology.

Implementation should use a temp file plus atomic rename for
`activation.json`:

```txt
write <workspace-root>/.fgos/installation/activation.json.tmp.<activationId>
fsync file when supported
rename tmp -> <workspace-root>/.fgos/installation/activation.json
fsync parent directory when supported
```

The stable shims under `.fgos/installation/bin/` should not change during normal
activation. Activation changes the selected release identity, not the command
path callers use.

`activation.json` should contain only a durably published ready runtime
binding. Do not write `status: "preparing"` into `activation.json`.
Installation/activation transaction state belongs in the release store:

```txt
<release-store-root>/installs/<activationId>.json
```

Possible transaction statuses:

```txt
staging
verified
preparing
ready-published
ready-degraded
complete
failed
quarantined
```

Failure rules:

| Failure Point | `activation.json` | Transaction / Payload Action |
|---|---|---|
| Acquire/stage fails | Unchanged | Mark install transaction failed; remove or keep staged temp for diagnostics. |
| Verify fails | Unchanged | Refuse activation; quarantine or remove staged release. |
| Runtime dependency missing | Unchanged | Refuse activation with `runtime-dependency-missing`. |
| Candidate preflight fails before publish | Unchanged | Mark transaction `failed`; candidate has no writer authority and must not touch host-visible projections. |
| Atomic binding write fails | Previous ready binding remains authoritative if readable | Fail closed; do not run local workflow from candidate. |
| Active local `fgos init` / `doctor --fix` projection tail fails after publish | New ready binding remains authoritative | Mark transaction `ready-degraded`; local doctor reports repair action. |

The important rule is readiness: a candidate release does not gain writer
authority merely because it was staged or verified. It gains writer authority
for a workspace only after the workspace binding is published with
`status: "ready"`.

**Retained dated design — status note (2026-10-14):** The bootstrap-context permission below is source design, not current behavior. Preflight is static and never executes candidate release code (`packages/distribution/rust/src/init.rs:431-446`).
During preparation, `fgctl` may invoke the candidate release directly with a
restricted bootstrap context:

```txt
FGOS_BOOTSTRAP_CANDIDATE=1
FGOS_CANDIDATE_ARTIFACT_DIGEST=<digest>
FGOS_CANDIDATE_RELEASE_PATH=<path>
```

In that context the candidate may run preflight checks and write only staging
records under the installation transaction. It must not write host-visible
projection paths, execute general workflow mutations, or claim/write shared
work-state as the active runtime. **Status note (2026-10-14):** The permission in the first sentence is retained dated design, not implemented: static preflight never runs candidate code and the proposed environment-variable bootstrap context was never honored by a host (`packages/distribution/rust/src/init.rs:431-446`). The must-not obligation remains.
~~~~~~~~

## claim_3673677485dd4449067c9e5074623e1a

Shard: `plans/260925-documentation-authority-unification/ledger/decisions/s4-packaging-distribution-architecture.json`
Disposition: `move`; reviewStatus: `pending`.

Previous rationale:
The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-63, under "6. WorkspaceActivationBinding", is retained at docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-25. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/activation-binding.md topic owner; carriage does not certify current implementation.

Current rationale:
The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-63, under "6. WorkspaceActivationBinding", is retained at docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-25. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The target prepends the labelled Retained dated design — status note (2026-10-14), identifying the bootstrap-context permission as source design and static preflight as current behavior. The named owner is the contracts/activation-binding.md topic owner; carriage does not certify current implementation.

Before decision SHA256 (sorted UTF-8 compact JSON): `65b59e90d72970d4ea1638ca02c3dee52cfffe91438926d485a6c47a23051024`
Current decision SHA256 (same encoding): `251c3e11735327151ef438a4d863054f6123cb251e9b55316bed6bd2e1e6618a`

Complete current decision:

~~~~~~~~json
{
  "claimId": "claim_3673677485dd4449067c9e5074623e1a",
  "sourceUnitDigest": "a1e7ae9c98f45bb7c6b136fec8f222dffea7be454b7288a802983db5a7e43599",
  "targetOwner": "docs/platform/packaging-distribution/contracts/activation-binding.md",
  "targetAnchor": "unheaded-block-25",
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:10@2026-10-14",
  "rationale": "The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-63, under \"6. WorkspaceActivationBinding\", is retained at docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-25. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The target prepends the labelled Retained dated design — status note (2026-10-14), identifying the bootstrap-context permission as source design and static preflight as current behavior. The named owner is the contracts/activation-binding.md topic owner; carriage does not certify current implementation.",
  "reviewNote": "Stored digest has no target match; independent re-review required."
}
~~~~~~~~

Complete source: `docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-63`
Unit digest: `a1e7ae9c98f45bb7c6b136fec8f222dffea7be454b7288a802983db5a7e43599`; full shown-text SHA256: `a1e7ae9c98f45bb7c6b136fec8f222dffea7be454b7288a802983db5a7e43599`

~~~~~~~~markdown
During preparation, `fgctl` may invoke the candidate release directly with a
restricted bootstrap context:
~~~~~~~~

Complete unchanged current target: `docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-25`
Unit digest: `273e89aa19e81dcc743483fe3e51606dcf949278cadecb37a885aa39014cec2b`; full shown-text SHA256: `273e89aa19e81dcc743483fe3e51606dcf949278cadecb37a885aa39014cec2b`

~~~~~~~~markdown
**Retained dated design — status note (2026-10-14):** The bootstrap-context permission below is source design, not current behavior. Preflight is static and never executes candidate release code (`packages/distribution/rust/src/init.rs:431-446`).
During preparation, `fgctl` may invoke the candidate release directly with a
restricted bootstrap context:
~~~~~~~~

## claim_107a23bb29dcf6db15e2471d7e77590b

Shard: `plans/260925-documentation-authority-unification/ledger/decisions/s4-packaging-distribution-architecture.json`
Disposition: `move`; reviewStatus: `pending`.

Previous rationale:
The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-65, under "6. WorkspaceActivationBinding", is retained at docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-27. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/activation-binding.md topic owner; carriage does not certify current implementation.

Current rationale:
The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-65, under "6. WorkspaceActivationBinding", is retained at docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-27. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The target appends the labelled Status note (2026-10-14), identifying the candidate permission as retained dated design, static preflight and the unimplemented environment-variable bootstrap context, while retaining the must-not obligation. The named owner is the contracts/activation-binding.md topic owner; carriage does not certify current implementation.

Before decision SHA256 (sorted UTF-8 compact JSON): `39bd0e2873f7de840ed50ac31021989334536bb86e54a110d2340ac2aea911f8`
Current decision SHA256 (same encoding): `d03eb21b0d3d5f9aa8d9b6ce509dca94f26fbf9341b0998b38dea1813c665c4d`

Complete current decision:

~~~~~~~~json
{
  "claimId": "claim_107a23bb29dcf6db15e2471d7e77590b",
  "sourceUnitDigest": "ccb205fdc5120e6287ab2067b178cb8c998e156c606d0282c8d7e02821feece0",
  "targetOwner": "docs/platform/packaging-distribution/contracts/activation-binding.md",
  "targetAnchor": "unheaded-block-27",
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:10@2026-10-14",
  "rationale": "The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-65, under \"6. WorkspaceActivationBinding\", is retained at docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-27. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The target appends the labelled Status note (2026-10-14), identifying the candidate permission as retained dated design, static preflight and the unimplemented environment-variable bootstrap context, while retaining the must-not obligation. The named owner is the contracts/activation-binding.md topic owner; carriage does not certify current implementation.",
  "reviewNote": "Stored digest has no target match; independent re-review required."
}
~~~~~~~~

Complete source: `docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-65`
Unit digest: `ccb205fdc5120e6287ab2067b178cb8c998e156c606d0282c8d7e02821feece0`; full shown-text SHA256: `ccb205fdc5120e6287ab2067b178cb8c998e156c606d0282c8d7e02821feece0`

~~~~~~~~markdown
In that context the candidate may run preflight checks and write only staging
records under the installation transaction. It must not write host-visible
projection paths, execute general workflow mutations, or claim/write shared
work-state as the active runtime.
~~~~~~~~

Complete unchanged current target: `docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-27`
Unit digest: `6fbabae72e49d14c8ea861f42ffc8ee4180d3b83c968871b6ea38ace19b92d9a`; full shown-text SHA256: `6fbabae72e49d14c8ea861f42ffc8ee4180d3b83c968871b6ea38ace19b92d9a`

~~~~~~~~markdown
In that context the candidate may run preflight checks and write only staging
records under the installation transaction. It must not write host-visible
projection paths, execute general workflow mutations, or claim/write shared
work-state as the active runtime. **Status note (2026-10-14):** The permission in the first sentence is retained dated design, not implemented: static preflight never runs candidate code and the proposed environment-variable bootstrap context was never honored by a host (`packages/distribution/rust/src/init.rs:431-446`). The must-not obligation remains.
~~~~~~~~

## Lead handback

Commit ordinary ok/rework verdicts for only these three claim IDs, with their complete source and target digests. The 26 prior ok verdicts and unchanged native text are outside this new review request.

STOP. Independent Lead review is the next action; no owner decision is requested here.
