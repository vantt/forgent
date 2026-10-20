# Review: Step 3 wave 5f, part p01 (batches 105 and 106)

Reviewer: independent read-only semantic review. Pin ae141550c2e022310de7a0efea757580c0b2479f. Worktree 0d1fb3bff.
No checker or probe was run. I used only my own read-only python extractors, `git show` at the pin, and `git ls-tree` / `git grep` at the pin.
Every file was read whole at the pin. Every edge was reviewed. The 91 edges are 16 + 4 + 15 + 2 + 51 + 3, which matches the frozen index.

## Per-file verdicts

All six records have an empty diff, and `digest` equals `inventoryFileDigest` (hashes below).
All edges are `preserve`. There are no parks, row flips or patches in this part.
Each file's source spans match the pinned text at the stated columns (verified programmatically for the ledger; spot-read for the others).

| Set | Stratum | File | Edges | Digest (first 12 hex) | Verdict |
|---|---|---|---:|---|---|
| batch-105 | unpatched-seeded | docs/platform/host-invocation-routing/architecture/external-provider-protocol.md | 16 | e6f0c282eb6f | ok |
| batch-105 | unpatched-seeded | docs/platform/host-invocation-routing/architecture/invocation-kernel.md | 4 | 389412c0eca0 | ok |
| batch-105 | unpatched-seeded | docs/platform/host-invocation-routing/contracts/component-protocol.md | 15 | ce3f29b86c0b | ok (Lead question Q1) |
| batch-105 | unpatched-seeded | docs/platform/host-invocation-routing/contracts/operation-request-outcome.md | 2 | 701eaf883e48 | ok |
| batch-105 | mandatory-threshold | docs/platform/host-invocation-routing/intent-preservation-ledger.md | 51 | aaf8bfe8bf31 | ok |
| batch-106 | unpatched-seeded | docs/platform/host-invocation-routing/verification/r3-remote-peer-proof.md | 3 | f8febf215e54 | ok |

### external-provider-protocol.md (16 edges)

- **Provenance and Source lines (06963, 06969).** The Provenance header (L16) and the `Source:` line in the carriage framing (L56) preserve. This follows L12-47 and L12-51(1).
- **Evidence column (06964, 06965).** These are the L41 and L42 Evidence-column links into the retiring protocol file. They preserve as evidence citations (L12-51(1)).
- **Labelled-source row (06968).** The L52 Related Files row labelled "source protocol" preserves. See Q1.
- **Live Related rows (06966, 06967).** These link to existing platform files and correctly stay literal.
- **Carriage edges (06970 to 06975, plus the three author-added edges at L71, L103 and L182).** All sit under `## Retained selected source material`, whose framing says it is the pinned September source. Carriage preserve is correct.
  - The L103 and L182 `legacy-cli-transition.md` links and the L71 sibling link resolve to a retiring file under the source coordinate. They are correctly added and preserved, per L12-35(6).
- **Completeness.** The pinned legacy scan has 3 candidates, all joined to edges. I enumerated every link and path in the file independently and found no missed retiring reference.
  - L62 (`plans/reports/...host-invocation-provider-routing-design-review.md`) only contains a basename as a substring of a longer name, so it is not an edge.
  - `release-boundaries.md` exists in the platform architecture directory, so L43 is a live link and not an edge.

### invocation-kernel.md (4 edges)

- 06979 (Provenance L16) and 06982 (L55 labelled-source row, see Q1) preserve.
- 06980 and 06981 are live contract rows and stay literal.
- The two scan exclusions (`legacy-cli-transition.md` at L45) are true. The native sibling exists at the pin, and it is outside carriage, so L12-34(5-7) applies.
- I found no missed reference.

### component-protocol.md (15 edges)

- 07027 (Provenance L15) preserves.
- 07028 (Evidence L44) preserves.
- 07029 to 07038 are the `Added in candidate: verbatim restoration of <architect path> at <sha>` lines at L57, 73, 92, 116, 128, 144, 156, 217, 259 and 277. These are source/provenance citations and preserve under L12-47. All ten edges are present.
- Author-added L229 is the link inside a fenced `md` block of restored excerpt bytes. It preserves as captured evidence (L12-40).
- Author-added L326C94 is the inline-code literal `../component-boundary/component-boundary-advisory.md`, quoted as the restored excerpt's retained bytes. It preserves.
- 07039 (L326, the "live destination" link) has an open question, Q1(b).
- Scan: 2 candidates, both joined. No missed reference.

### operation-request-outcome.md (2 edges)

- 07048 (Provenance L15) and 07049 (L57 labelled-source row, see Q1) preserve.
- Scan has 0 candidates. I found nothing missed.

### intent-preservation-ledger.md (51 edges, mandatory stratum)

- 07071 is the `docs/architect/host-invocation-routing/**` glob in the Provenance line. It preserves as a pattern with lineage wording.
- 07072 to 07121 are the 50 Source-column links in the HI-I001 to HI-I038 preserved-intentions table (L63 to L100).
- **Source-column role.** This is a migration-ledger Source-locator column, which is provenance. Preserving the original spelling is correct under L12-35/L12-51(1).
- **Coverage.** I checked each line programmatically. The per-line count of `architect/` occurrences equals the per-line edge count on every line, and every span text matches the pinned text at its columns. No row has a missed or extra link.
- **Scan exclusions.** The 10 exclusions are `vision.md`, `README.md` and `roadmap.md` at L32, 63, 64, 96 and 129. The native siblings exist at the pin: `docs/platform/host-invocation-routing/{vision,README,roadmap}.md`. The exclusions are true.
- **Navigation-class references.** The Related header and the `## 7. Related Files` rows (L129 to L136) point only to live platform files, including `history/documentation-migration/documentation-standardization-plan.md`, so they need no edge.

### r3-remote-peer-proof.md (3 edges)

- 07144 (Provenance L15) preserves.
- Author-added L15C106 is the bare basename `rust-cli-and-proof-components-plan.md`, the second source named in the same Provenance line. It is correctly added and preserved with the same role.
- 07145 (L112 labelled-source row, see Q1) preserves.
- Scan: 1 candidate, joined.

## Outcome defects (rework)

None. No wrong disposition, target, anchor or diff, no false adjacent description, and no missed reference was found in this part.

## Record-text notes (not rework)

- **Reason text on the labelled-source rows.** The reasons on 06968, 06982, 07049 and 07145 say "Source/Evidence column or explicitly labelled source relationship". The rows sit in a `## 4. Related Files` body table, not in an Evidence column. If the Lead rules these are navigation (Q1), the reason text needs revising, and so does the disposition.
- **Reason on 07039.** Its reason says "explicitly named historical source/proof input ... not current reading authority". The consumer sentence literally says "its live destination is [...]". The reason should quote the actual sentence, or the edge should change if Q1(b) goes against it.
- **Matching reasons elsewhere.** The reasons on 07029 to 07038 (restoration lines) are correct but generic. They say "Source/Provenance lineage", which fits a `verbatim restoration of <path> at <sha>` line.

## Lead-judgment questions

**Q1(a). Labelled "source" rows in `## N. Related Files` body tables.** Four edges are affected:

| Edge | File |
|---|---|
| 06968 | external-provider-protocol.md |
| 06982 | invocation-kernel.md |
| 07049 | operation-request-outcome.md |
| 07145 | r3-remote-peer-proof.md |

- **What the rows are.** Each row is labelled "source protocol", "source architecture" or "source migration". Each points at a retiring `docs/architect/...` file.
- **How the record treats them.** The records preserve them as a "labelled source relationship". I found no earlier-batch precedent for this reason wording; all 140 uses are in batch-105 onward.
- **The competing reading.** L12-37 says body `## Related` lists are navigation. L12-34(4) says a retiring Related target patches to its exact live holder, and a self or already-listed holder parks as duplicate. The live holder here would be the consumer itself, because each file is "Promoted from" that source. That reading gives park (duplicate), not preserve.
- **My lean.** I think the explicit "source ..." label plus L12-47 (Source/Provenance and Related keep separate roles) makes preserve defensible, and the Provenance header already preserves the lineage. If the Lead rules the other way, 4 edges in 4 files change disposition, and the same template would need checking across the rest of batch-105 and later.

**Q1(b). component-protocol.md edge 07039 (L326).**

- **What the sentence says.** "its live destination is [the retained component-boundary advisory](../../../architect/component-boundary/component-boundary-advisory.md). This navigation mapping does not revise the restored text."
- **What the record does.** It preserves the link as a historical source/proof input.
- **Why it is arguably navigation.** The sentence is an explicit navigation mapping into a retiring tree, in present tense.
- **The only live holder.** At the pin the advisory is carried only by `docs/platform/component-boundary.md` under `## Added in candidate: component-boundary-advisory source carriage` (L117). That is a carriage-only holder, so it cannot be a patch target.
- **If treated as navigation.** It would park for carry (phase9-carry).
- **If treated as a source-coordinate annotation.** The restored excerpt's original `../` link resolves, in source coordinates, to the architect tree. This is the same template as the preserve edge at release-boundaries.md L189 (07024, not in my part). Preserve is then defensible.
- **My lean.** Preserve is acceptable as a source-coordinate annotation. Please rule explicitly, because 07024 and the three release-boundaries.md L189 edges follow the same decision.

## Counts

| Set | Stratum | Files reviewed | Rework | Edges reviewed |
|---|---|---:|---:|---:|
| batch-105 | unpatched-seeded | 4 | 0 | 37 |
| batch-105 | mandatory-threshold | 1 | 0 | 51 |
| batch-106 | unpatched-seeded | 1 | 0 | 3 |
| Part total | | 6 | 0 | 91 |

The batch-105 unpatched-seeded edge count of 37 is 16 + 4 + 15 + 2.
No file in this part appears in two sets or strata, so there is no overlap to separate.
If Q1(a) is ruled against the preserve, the rework would be: batch-105 unpatched-seeded 2 of 4 files (external-provider-protocol.md, invocation-kernel.md; operation-request-outcome.md would be a third, so 3 of 4), and batch-106 1 of 1 file (r3-remote-peer-proof.md). This is contingent on the Lead's ruling and is not counted above.

Status: DONE_WITH_CONCERNS
