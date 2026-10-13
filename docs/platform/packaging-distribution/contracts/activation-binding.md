# Contract: Activation Binding

```txt
Document type: Contract
Audience: Maintainer, implementation agent, reviewer
Purpose: Describe workspace activation records for project-local fgOS runtime selection
Design status: Frozen (V1)
Implementation status: Implemented
Canonical: Yes, after review
Owner: Packaging-distribution
Source type: Code scan of packages/distribution/rust/src/init.rs, src/setup/bin-discovery.mjs, and packages/distribution/rust/tests/schema_golden.rs
Last reviewed: 2026-09-14
Related:
- docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md
- docs/platform/packaging-distribution/contracts/release-manifest.md
- packages/distribution/rust/src/init.rs
- packages/distribution/rust/tests/schema_golden.rs
Implementation: Original section-specific implementation statements retained; carriage is pending independent review
Provenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b
Writer type: Human + agent coauthor
Canonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review
Use this when: Reading this area topic and its retained design details
Do not use this for: Claiming a truth review or an authority cutover from carriage alone
Supersedes: No authority transition in this carriage pass
Superseded by: None recorded
```

## 1. Purpose

`activation.json` is the workspace-local ready pointer for the active fgOS runtime.

Path:

```txt
.fgos/installation/activation.json
```

## 2. Frozen Schema V1 Shape

The schema is frozen at `schemaVersion: 1`. Rust serde definition lives in `packages/distribution/rust/src/init.rs` (`WorkspaceActivationBinding`, aliased as `ActivationBinding`).

```json
{
  "schemaVersion": 1,
  "repositoryId": "repo_8d3322d88fba3bd8",
  "workspaceId": "8d3322d88fba3bd8",
  "workStateId": "8d3322d88fba3bd8",
  "activationId": "act_000001a08fe31d00",
  "status": "ready",
  "artifactDigest": "sha256:08e33ffd77ccae43fd3b9f3034c9d4c28bdc1d8c69966f913ed66707a0486ec4",
  "releasePath": "/home/user/.local/state/fgos/releases/sha256:08e33ffd77ccae43fd3b9f3034c9d4c28bdc1d8c69966f913ed66707a0486ec4",
  "previousArtifactDigest": null,
  "shimVersion": "1",
  "resolvedDependencies": {
    "node": "/usr/bin/node"
  },
  "pinSnapshot": {
    "schemaVersion": 1,
    "projectRuntime": {
      "policy": "exact-digest",
      "artifactDigest": "sha256:08e33ffd77ccae43fd3b9f3034c9d4c28bdc1d8c69966f913ed66707a0486ec4",
      "releaseVersion": "0.1.0",
      "channel": null,
      "allowPrerelease": false
    }
  },
  "activatedAt": "2026-09-14T00:00:00.000Z",
  "activatedBy": {
    "tool": "fgctl",
    "version": "0.1.0"
  }
}
```

## 3. Field Specifications & Optionality

| Field | Type | Required? | Description |
| --- | --- | --- | --- |
| `schemaVersion` | integer | Yes | Fixed at `1` for V1. |
| `repositoryId` | string | Yes | Canonical repository identifier (`repo_<workspaceId>`). |
| `workspaceId` | string | Yes | 16-hex hash of canonical workspace root. |
| `workStateId` | string | Yes | Work-state namespace identifier (equals `workspaceId` in V1). |
| `activationId` | string | Yes | Unique activation identifier (`act_<hex-timestamp>`). |
| `status` | string | Yes | Activation status: `"ready"` or `"quarantined"`. |
| `artifactDigest` | string | Yes | Canonical digest of the active release. |
| `releasePath` | string | Yes | Absolute filesystem path to active release in machine store. |
| `previousArtifactDigest` | string | Optional | Digest of previously active release (enables 1-step rollback/repair). |
| `shimVersion` | string | Yes | Version of stable shims (`"1"` in V1). |
| `resolvedDependencies` | object | Yes | Resolved host runtime toolpaths (e.g. `{"node": "..."}`). |
| `pinSnapshot` | object | Yes | Snapshot of `.fgos/distribution.json` at activation time. |
| `activatedAt` | string | Yes | ISO 8601 UTC timestamp of activation. |
| `activatedBy` | object | Yes | Identity of tool performing activation (`tool`, `version`). |

## 4. Status Rule

The stable shims expect `status` to be `ready`. If activation is missing, not ready (e.g. `quarantined`), missing `releasePath`, or points to a missing executable, the shim fails with exit code 3 and directs the user to run `fgctl init` or `fgctl repair`.

## 5. Selection Rule

Workspace activation is strictly local to the workspace. It is not a repository-wide global pointer. Multiple worktrees may share release store content while using different activation records.

## 6. Resolver Rule

Resolution code accepts activation only if it can safely resolve the release manifest and executable entry under the active release path. Node-side tier-zero resolution is implemented in `src/setup/bin-discovery.mjs`.

## 7. Evidence

| Claim | Evidence |
| --- | --- |
| Activation struct frozen and documented | `packages/distribution/rust/src/init.rs` (`WorkspaceActivationBinding`, `ActivationBinding`) |
| Stable shim reads activation | `packages/distribution/rust/src/init.rs` (`SHIM_FGOS_BODY`, `SHIM_FGOS_RUNNER_BODY`) |
| Shell/runtime resolver checks activation | `src/setup/bin-discovery.mjs`, `scripts/fgos-shell-integration.sh` |
| Init, repair, and upgrade tests exercise activation | `test/rust-host/fgctl-init.test.mjs`, `test/rust-host/fgctl-upgrade.test.mjs` |
| Schema golden tests (full, minimal, forward-compat) | `packages/distribution/rust/tests/schema_golden.rs`, `packages/distribution/rust/tests/goldens/activation-binding-*.json` |


## Retained Runtime Identity And Activation Source Detail

Added in candidate — complete source units from `docs/architect/packaging-distribution/runtime-identity-and-activation.md` at `77830ba77eb05991d95b005919776ee6254e833b`. Source design, dated status and obligations are preserved here; this carriage does not certify current implementation. Relative links retain their destination.

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
