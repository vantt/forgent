# Step 3 final review, part p06 (batch-105, original unpatched stratum, expansion)

Pin ae141550c. Records read as fields only; checker and probes not run. Every source was read whole except `spec.md`, which I read as outline plus header, sections 2, 3, 7, 8, the retained-source preamble and the migration note (the other 220 lines are verbatim carriage with no edges and no scan candidates).

## Per file

| File | Edges | Verdict |
|---|---:|---|
| `docs/platform/host-invocation-routing/history/host-invocation-baseline.md` | 2 | ok |
| `.../history/source-inventory.md` | 13 | ok (record-text notes) |
| `.../r2-external-process-rollout-plan.md` | 0 | ok |
| `.../r3-remote-peer-rollout-plan.md` | 0 | ok |
| `.../spec.md` | 2 | ok |
| `.../verification/compatibility-harness.md` | 5 | ok |

No file is under `retiresWithTree`; none is a docs/specs or docs/architect file. All 22 edges are preserve, with no patched, parked, row-flip or added edges, and every diff is empty.

### host-invocation-baseline.md
- 07056 (line 11, `Source type: Summary of docs/architect/host-invocation-routing/**`): preserve is correct. It is a provenance header with a glob token (L12-47, L12-51(1)).
- 07057 (line 47, Related Files row "source migration strategy"): preserve is correct under L12-54 ruling (1) (rows labelled "source ..." are provenance). The file is also declared `Document type: History`. The target exists at the pin.

### source-inventory.md
- 07058 (line 11): preserve is correct (provenance header, glob).
- 07059, 07061, 07064, 07067, 07068 (lines 24-28, Source column links to the five legacy architect files): preserve is correct. The file is History-typed and the column records the original source identity of the inventory row. The Destination-column links are candidate-native, and 07060, 07062, 07063, 07065 and 07066 preserve them correctly.
- 07069, 07070 (lines 36-37, cross-area pattern reference in the Source column): preserve is correct. They are inventory identity in a History file, and the disposition cells say `archive`. The targets exist at the pin.
- The three non-link token exclusions (line 23 twice, line 24 once) are legitimate. No missed edges: the other relative links, such as lines 34-35, resolve to existing `docs/platform/**` files.

### r2 and r3 rollout plans (zero edges)
Read in full. The only links are candidate-native proof files and `../../../archive/plans/...` (not a legacy root). The record has an empty scan with no candidates, so zero edges is correct. The link labels do not match their destinations (`plans/` versus `archive/plans/`), but that is pre-existing and names no retiring path.

### spec.md
- 07127 (line 16, `Provenance: Promoted from docs/architect/host-invocation-routing/**`): preserve is correct (provenance, glob).
- 07128 (line 104, `Source: ...host-invocation-provider-routing.md` at a commit sha): preserve is correct. It is a Source line under the "Retained selected source material" heading and also pins an exact commit.
- Section 8 Related Files and the Related Documents list at the end contain only candidate-native links. The 12 unjoined scan candidates are candidate-native basenames with true exclusion reasons. There are no missed edges.

### compatibility-harness.md
- 07129 (line 15, Provenance header): preserve is correct.
- 07130 (line 50, `../contracts/command-route-descriptor.md`): preserve is correct. It is a candidate-native retained path that exists at the pin.
- 07131 (line 52, source plan row): preserve is correct under L12-54(1) ("source ..." Related row).
- 07132 and 07133 (lines 56 and 83, "Added in candidate: verbatim restoration of `docs/architect/...` at <sha>"): preserve is correct. They are provenance and restoration-source lines pinned to a commit, and they sit inside the restored-section notes.
- No missed edges. The remaining paths are code evidence (`packages/...`, `package.json`).

## Outcome defects
None. 0 of 6 files need rework.

## Record-text notes (not rework)
1. `source-inventory.md` edges 07059-07068: the reason says "inside literal carriage (L12-26(5)); declaration: | [documentation-standardization-plan.md] ... |". The file is not a carriage region. The "declaration" quoted is an unrelated inventory row (line 23). The correct basis is that the file is History-typed and the Source column records original source identity (L12-38 history class; L12-54(3)). The disposition stands. The reason sentence overstates the carriage claim and could be reworded.
2. The three line-23/24 exclusion reasons in `source-inventory.md` say "inside carriage/dated history". The same carriage wording applies, and the file is better described as a History-typed inventory.
3. 07060, 07062, 07063, 07065, 07066 (candidate-native Destination-column links) carry the same carriage reason. The preserve is right because they are candidate-native retained paths, but the reason text says carriage.

## Lead-judgment questions
None blocking. The 07069/07070 Source-column links to `docs/architect/agent-coordination/*` have no patch because the disposition cell is `archive` in a History file. If Lead considers an "archive as reference pattern" row live navigation, it would instead need a holder lookup for agent-coordination, but I judge preserve correct under L12-38/L12-54(3).

## Counts
Set batch-105, stratum "expansion: unreviewed files of the original unpatched stratum": 6 files reviewed, 0 rework, 22 edges reviewed (0 outcome defects).
