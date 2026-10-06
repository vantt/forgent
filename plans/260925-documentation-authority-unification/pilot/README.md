# Pilot claim decisions

Reviewed row decisions for the dual pilot. The generated inventory derives every claim row from the switchboard and has no place for a reviewed target, kind, disposition or rationale; a decisions shard is that place. Format: [claim-decisions.schema.json](claim-decisions.schema.json). Vocabulary: [../claim-and-disposition-vocabulary.json](../claim-and-disposition-vocabulary.json).

## 1. Use

```bash
node scripts/check-doc-inventory-gates.mjs --inventory <inv> --identity-registry <reg> \
  --decisions plans/260925-documentation-authority-unification/pilot/decisions \
  --strict --scope docs/specs/work-state.md --scope docs/io-contract.md
```

- `--decisions <file|dir>` merges every `*.json` shard onto `claimLedger` and `items` in memory, then runs the existing checks. Without it nothing changes.
- `--scope <path-or-prefix>` (repeatable) restricts the strict open-data checks to rows whose source path is in scope, so a pilot can pass strict while the global run stays red.

## 2. Rules a shard must satisfy (fatal findings)

1. Every `claimId` exists in the inventory; no claim is decided twice across all shards; every claim's source path is listed in the shard's `sources`.
2. `sourceUnitDigest` is a prefix (at least 16 hex characters) of the row's current `sourceUnitDigest`; a source that changed makes its decision stale.
3. `disposition` and `claimKind` are vocabulary values; a disposition that requires a target owner has one, and `targetAnchor`.
4. `targetOwner` is a document of the tree (an inventory item under `docs/platform/`) and `targetAnchor` is one of its heading or block anchors.
5. `reviewStatus: reviewed` needs `reviewedBy`, `reviewedAt` and a rationale; `unknown-blocking` rows carry `reviewStatus: blocking`.
6. `searched` is present and non-empty for `unknown-blocking` and every `delete-*` disposition.

An author writes `pending` (or `blocking`); `reviewed` appears only after an independent review of that row.
