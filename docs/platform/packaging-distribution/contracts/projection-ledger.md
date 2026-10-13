# Contract: Projection Ledger

```txt
Document type: Contract
Audience: Maintainer, implementation agent, reviewer
Purpose: Track the intended projection ledger boundary for packaging-distribution
Design status: Draft
Implementation status: Partial: instruction projections have a ledger entry and doctor/fix repair; skill and wider host projections remain follow-up
Canonical: Yes, after review
Owner: Platform documentation
Source type: Architecture discussion
Last reviewed: 2026-09-18
Related:
- docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md
- docs/platform/packaging-distribution/verification/implementation-alignment.md
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

The projection ledger records host-visible files materialized by the active runtime, such as managed skills, agents, prose, docs, or instruction blocks.

Expected path from architecture discussion:

```txt
.fgos/installation/projections/ledger.json
```

## 2. Boundary

`fgctl` selects and repairs runtime identity. It should not directly own host-visible projection writes.

The active local `fgos` should own projection materialization after activation.

## 3. Why This Matters

Projection files are visible to host tools and humans. If two runtime identities can write them without a ledger, a workspace can drift silently.

The ledger should answer:

- which runtime wrote the projection;
- what source inside the release produced it;
- which destination was written;
- whether a later runtime owns or supersedes it;
- how repair should handle missing or stale projections.

## 4. Current Status

Instruction projections now write a managed `AGENTS.md` block, effective-set JSON, and an entry in `.fgos/installation/projections/ledger.json`. The check/fix path lives in `src/setup/instruction-projections.mjs` and is registered as `instruction-projections-stale`.

This does not yet prove ledger coverage for every host-visible projection. Skill packaging projections and future host adapters still need their own ledger entries before this contract can be promoted to fully implemented.

## 5. Evidence Needed

Before promoting this contract:

- scan projection writers;
- identify whether a ledger exists today;
- verify `fgctl` does not write projections directly;
- verify local `fgos init` or `fgos doctor --fix` owns projection repair.


## Retained Runtime Identity And Activation Source Detail

Added in candidate — complete source units from `docs/architect/packaging-distribution/runtime-identity-and-activation.md` at `77830ba77eb05991d95b005919776ee6254e833b`. Source design, dated status and obligations are preserved here; this carriage does not certify current implementation. Relative links retain their destination.

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
