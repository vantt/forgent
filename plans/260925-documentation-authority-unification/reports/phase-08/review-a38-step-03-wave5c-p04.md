# Wave 5c review, part p04

Pin ae141550c2e022310de7a0efea757580c0b2479f. Read-only. No checker, probe or CLI run.

## docs/enduser-docs-index.json

- Set: batch-129 (mandatory file, not a seeded sample).
- Stratum: mandatory.
- Verdict: **ok**.
- Edges reviewed: 506 of 506, all `parked` (`step5-parity`, L12-30/32/34).
  - 160 generated docPath values.
  - 344 generated aliases-array values.
  - 2 generated titles (maps-j-03247 `docs/specs/runner.md`, maps-j-03302 `docs/history/`).
- Diff: empty. No target, anchor or hunk on any edge. `authorAddedEdgeIds` is empty.

### What I checked

- **Spans.** All 506 sourceSpans match the pinned source file (5130 lines) exactly, by line and column text. I loaded the file whole as JSON.
- **Generator claim.** The pinned tree confirms the named owners.
  - `computeEnduserDocsIndex` and `generateEnduserDocsIndex` exist in `src/report/enduser-index-generate.mjs`.
  - `buildEnduserIndex` exists in `src/report/enduser-index.mjs` and emits `aliases` from the resolver.
  - `bin/fgos.mjs` (`docs-index`) overwrites the file whole.
  - `src/setup/registrations.mjs` (the doctor check) imports the same compute function, so "shared by docs-index and doctor" is true.
  - The park reason is true, and no hand patch or alias rewrite is claimed.
- **targetFacts.** I recomputed them against `git ls-tree` at the pin.
  - 166 `exists` facts agree with the tree. `docs/history` is a directory, so it is absent from the file list.
  - 338 alias facts are `renamed`. 328 successors equal the owning entry's docPath.
  - 10 other aliases are intermediate renames to a `docs/explanation|how-to|reference/...` name that was later renamed again. The record says the rename was "at c681f353 to <intermediate>; original spelling conserved", which is accurate. See record-text note 1.
- **Coverage, source to edges.** I scanned every docPath and alias value and every path-like token in titles, purposes and audiences.
  - All 160 docs/explanation, docs/how-to, docs/reference and docs/decisions docPaths have an edge.
  - All 346 existing-or-renamed docs/<quadrant>/ aliases have an edge.
  - 332 `docs/knowledge/**` docPaths have no edge. `docs/knowledge` is a retained live root, not a retiring or legacy-root path, and the Class-4 inventory does not cover it. Not a miss.
  - 180 `docs/<slug>/<file>.md` aliases have no edge. They name a pre-rename holder that never existed at the pin under that path, and no edge was inventoried or expected for them. I found no slug-dir edges in the sibling `docs/doc-registry.json` record either, so this is consistent. Not a miss.
  - Title line 1940 mentions `docs/enduser-docs-index.json`, a self-reference and so never patched (L12-40). Titles that mention bare or live paths (`plugins/fgOS/skills`, `scripts/write-wrapper-script.mjs`, `src/runner/dispatch`, `coding-worker-contract.md`, `.fgos/events.jsonl`, `CONTEXT.md`, `plan.md`) are not retiring or mapped paths. Not misses.
- **Disposition.** Parking every generated emission on regenerate-parity is correct. A hand patch would be overwritten by the next `fgos docs-index`, and alias values are lookup identity, not write destinations. The title edges (a retiring `docs/specs/runner.md` and a `docs/history/` mention inside a generated title) are likewise derived from each doc's H1, so parking is right.

### Outcome defects

None.

### Record-text notes (not rework)

1. Ten alias edges carry a rename "successor" that is itself no longer on the tree. Examples: maps-j-03392, 03446, 03448, 03626, 03633, 03660, 03666, 03674, 03677, 03697. Each was renamed at c681f353 and later moved into `docs/knowledge/`. The reason text is true as written, and it is harmless because the edges are parked and carry no target.
2. `dependency` and `blockedReason` are identical on every edge. The reason text just repeats them.

### Lead-judgment questions

- None specific to this file. `step-03-wave5c-lead-ruling-gaps.json` lists no open edges for batch-129.
- Carry-forward for Step 5 and Phase 9: regenerate this file only through the generator. The regeneration must preserve the `docs/explanation/**` alias lookup, and the 180 dead slug-dir alias strings must stay lookup data and not be rewritten.

## Per-set and stratum counts

| Set | Stratum | Reviewed | Rework |
|---|---|---:|---:|
| batch-129 | mandatory | 1 | 0 |
| batch-129 | patched sample | 0 | 0 |
| batch-129 | unpatched sample | 0 | 0 |

Rework rate: 0/1, which is within the 3% limit.

Status: DONE
Summary: `docs/enduser-docs-index.json` is ok. All 506 edges are parked on generator regeneration parity, spans, targetFacts and generator ownership all check out against the pin, and I found no missed references.
