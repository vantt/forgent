# Host Invocation Baseline

```txt
Document type: History
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: Preserve the old host-invocation baseline and migration context after promotion
Design status: Draft
Implementation: Historical/current source snapshot
Canonical: Yes, after review, for migration history only
Owner: Host invocation
Source type: Summary of docs/architect/host-invocation-routing/**
Provenance: First committed in 05b6bf861 (2026-09-14) as a summary of docs/architect/host-invocation-routing/**
Writer type: Agent draft writer
Canonical for: Migration history of the old host-invocation baseline after promotion
Use this when: Looking up the old command-readiness classification and the historical decisions the migration preserved
Do not use this for: Current routes (see the area spec and command-routes.json) or any claim that a command is still near-thin or not-thin
Last reviewed: 2026-09-14
Related:
- docs/platform/host-invocation-routing/history/source-inventory.md
- docs/platform/host-invocation-routing/intent-preservation-ledger.md
```

## 1. Baseline Summary

The old host-invocation docs settled the direction that Rust becomes the public `fgos` host first while the Node payload remains a legacy-current compatibility payload. The permanent architecture separates host surfaces, semantic operations, and provider mechanisms. The migration avoids Node-thinning-first and big-bang rewrites.

## 2. Preserved Command Readiness Notes

The old migration source classified command readiness as an ordering signal:

| Category | Commands | Preservation |
| --- | --- | --- |
| Near-thin | `version`, `review`, `approve`, `reject`, `catchup`, `sync-root`, `promote-to-component`, `gateway start|stop|status`, `session start|end|list|gc`, `triage`, `goal` | Preserve as scan result; recheck before execution. |
| Partly-thin | `submit`, `discover`, `plan`, `init`, `doctor`, `check`, `rollup`, `evolve` | Preserve as scan result; migrate only by complete use-case boundary. |
| Not-thin | `take`, `pick`, `return`, `move`, `add`, `edit`, `uninstall`, `preflight`, `unlock`, `main-checkout-reset`, `resync-worktree`, knowledge/documentation/registry verbs | Preserve as scan result; remain whole legacy operations until boundaries are ready. |

## 3. Historical Decisions Preserved

- `bin/fgos.mjs` remains unmoved and unrenamed while the Node payload exists.
- Legacy payload identity is `legacy-node`.
- `fgos.v1` is CLI presentation, not provider protocol.
- Config cannot replace built-in providers.
- Rollback of native R1/R2 behavior is release rollback through `fgctl`.
- Node removal waits for zero legacy routes and compatibility/replay/doctor/rollback proof.

## 4. Related Files

| Relationship | File |
| --- | --- |
| source inventory | [source-inventory.md](source-inventory.md) |
| ledger | [../intent-preservation-ledger.md](../intent-preservation-ledger.md) |
| source migration strategy | ../architecture/node-to-rust-migration.md |

