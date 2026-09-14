# Contract: Projection Ledger

```txt
Document type: Contract
Audience: Maintainer, implementation agent, reviewer
Purpose: Track the intended projection ledger boundary for packaging-distribution
Design status: Draft
Implementation status: Planned/unknown
Canonical: Yes, after review
Owner: Platform documentation
Source type: Architecture discussion
Last reviewed: 2026-09-13
Related:
- docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md
- docs/platform/packaging-distribution/verification/implementation-alignment.md
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

This is not yet proven implemented in the current scan. Keep claims about projection ledger behavior out of `spec.md` unless they are marked partial/planned and linked here.

## 5. Evidence Needed

Before promoting this contract:

- scan projection writers;
- identify whether a ledger exists today;
- verify `fgctl` does not write projections directly;
- verify local `fgos init` or `fgos doctor --fix` owns projection repair.
