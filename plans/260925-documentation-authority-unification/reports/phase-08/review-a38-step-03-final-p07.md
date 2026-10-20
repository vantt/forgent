# Step 3 final review, part p07

Pin ae141550c; worktree detached at d75e10774. Records read per field; every pinned source read whole, each edge reviewed. I independently resolved every markdown link and every `docs/...` and bare-basename token in each source against the pin tree, then compared the results with the recorded edges and legacyScan candidates. I ran no checker and no probe.

## Verdicts

| # | File | Batch | Set / stratum | Edges | Verdict |
|---|---|---|---|---:|---|
| 1 | docs/platform/host-invocation-routing/verification/implementation-alignment.md | 105 | expansion, original unpatched stratum | 2 | ok |
| 2 | docs/platform/host-invocation-routing/verification/r1-rust-host-proof.md | 105 | expansion | 2 | ok |
| 3 | docs/platform/host-invocation-routing/verification/r2-external-process-proof.md | 105 | expansion | 6 | ok |
| 4 | docs/platform/intent-preservation-ledger.md | 107 | targeted, record-text/coverage | 10 | ok |
| 5 | docs/platform/packaging-distribution/history/distribution-baseline.md | 110 | targeted, record-text/coverage | 28 (27 inventory + 1 author-added) | ok |
| 6 | docs/platform/packaging-distribution/verification/source-preservation-audit.md | 110 | targeted, record-text/coverage | 50 (32 inventory + 18 author-added) | ok |

Per-set / stratum counts:
- Expansion stratum (files 1-3): 3 files reviewed, 0 rework, 10 edges.
- Targeted stratum (files 4-6): 3 files reviewed, 0 rework, 88 edges.
- Part total: 6 files, 0 rework, 98 edges. No outcome defects.

## Per-file notes

### 1. implementation-alignment.md (07134, 07135)
- Both are links at lines 46-47 to `../contracts/component-protocol.md` and `../contracts/external-provider-manifest.md`.
- Both are preserve, which is correct. The targets are current retained files under host-invocation-routing and both exist at the pin. The cell is an Evidence column.
- My own scan of the file found no other link that does not resolve and no legacy token, matching legacyScan candidates 0.
- The diff is empty, which is correct for all-preserve.

### 2. r1-rust-host-proof.md (07136, 07137)
- 07136 is the `Provenance: Promoted from docs/architect/.../rust-cli-and-proof-components-plan.md` line. Preserve is correct under L12-47 and L12-51(1).
- 07137 is the Related Files row labelled "source plan" at line 92. Preserve is correct under the L12-54 ruling (1): rows labelled "source ..." are provenance.
- No other legacy token or dead link. Candidates 0.

### 3. r2-external-process-proof.md (07138-07143)
- 07138 (Provenance line 15) and 07143 (row labelled "source plan", line 105) preserve as above.
- 07139 and 07140 are links inside a native prose paragraph (lines 46-47). 07141 and 07142 are native Related Files rows. All four point at retained host-invocation-routing contracts that exist, so preserve is correct.
- Line 100 has a label/destination mismatch. The label reads `plans/260915-.../plan.md` and the destination is `archive/plans/...`. The destination resolves and is not a documentation legacy root, so it is out of scope and not an edge.

### 4. intent-preservation-ledger.md (07171-07180)
- Dispositions are all preserve and the diff is empty.
- 07171, 07173, 07174, 07179: `docs/doc-governance.md`. It is a retained root authority. The alias table has `entries: []`, doc-registry has no alias for it, and the switchboard lists it as a canonicalRoute. Preserve is correct.
- 07175 `docs/README.md` and 07176 `docs/decisions/index.md` are retained paths. 07177 and 07178 `docs/distillery/sources/okf.md` are retained and sit in the Source/Proof column. All correct.
- 07172 `docs/specs/platform-foundations.md` (line 71, "Proof / evidence" cell) and 07180 `docs/specs/runner.md` (line 92, Source cell) are retiring-tree paths. Both are preserved as provenance or evidence citations, which L12-51 and L12-25/26 support. See Lead-judgment question 1.
- Bare `reading-map.md` at line 74 was excluded with the L12-54 note as resolving to retained `docs/reading-map.md`. It sits next to `docs/README.md` and both files exist, so I accept it.
- The five basename candidates at lines 110-111 are native `vision.md` and `platform-foundations.md` links, and are correctly excluded.
- Bare decision numbers (D-ADR0035, RUL104, D-ADR0057) are not edges under L12-49.
- Link resolution is clean: lines 101, 102, 104 and 110-113 resolve.

### 5. distribution-baseline.md (28 edges)
- 07254 is the only patch, at line 14 `Related: - docs/specs/distribution.md`.
  - The replacement is `docs/platform/packaging-distribution/spec.md`. That file exists at the pin (tree line 5561) and is a whole-file area-spec holder.
  - The Related item carries no description to compare, and the label form is a bare path.
  - The diff is a single hunk replacing only line 14, which matches the record.
  - This is correct under L12-26(8) and L12-34(4). Source provenance is preserved separately on line 11.
- 07251, 07252, 07253 (line 11 Source type) preserve as provenance. 07252, 07255, 07257, 07259 `docs/distribution-vision.md` is a retained root path and correct to preserve. A history copy also exists at `docs/platform/packaging-distribution/history/distribution-vision.md`, but there is no alias retiring the root file.
- 07256 is the line 17 Related entry naming the retiring original of this very file. It is parked as description-rewrite (self pointer), consistent with L12-40(2) and with 17 other self-pointer parks in the records. The searchWitness is present and the alias lookups are empty. Correct.
- 07258, 07260 (lines 77, 79): the "Old source | Use" table in a History-type file is a source-locator column, so preserve is correct. 07260 is a glob, handled as a directory under the L12-26(9) rule.
- 07261-07272 sit inside `## Retained Distribution Baseline Source Detail`, which declares itself carriage. The records carry no existence claims, as L12-36 requires.
- 07273-07277 (lines 222, 246, 258, 279, 300) are the "Inherited Distribution Source Unit N" frames. Each frame says "this exact earlier source unit from `docs/specs/distribution.md` at <sha> ... preserved here as dated evidence". Preserve with a pinned commit is correct, and the reason makes no existence claim.
- The author-added edge at line 111 is the self link in the carriage block. Preserve is correct.
- My uncovered-token scan found nothing. Native `../vision.md` and `vision.md` resolve.

### 6. source-preservation-audit.md (50 edges)
- All 50 edges are preserve and the diff is empty.
- Lines 11 and 44-53: Source type and the "Source | Role" corpus table are provenance, so preserve is correct. This includes 07378-07384 and the retained `docs/distribution-vision.md` rows.
- Lines 66-91: the "Original source" column holds bare basenames (`scope-map.md`, `runtime-identity-and-activation.md`, `future-constraints.md`). The 18 author-added edges cover each of these instances, and I confirmed each is in the Original-source column.
- The `architecture/runtime-identity-and-activation.md` and `architecture/future-constraints.md` occurrences are in the "Current preserved location" column. They are native and were correctly left without edges.
- 07385 and 07386 (lines 56-57) preserve the audit-erratum text that names `migration-map.md` and `rewrite-plan.md`. The record says "exists at author pin", which is accurate: both files are in the pin tree (tree lines 2164-2165). See Lead-judgment question 2.
- 07399-07404 (§4.1 "P9 Legacy Doc Read-Through" table, lines 109-114) are a completed past-action record. Preserving original identities is correct under L12-46 and L12-51(1). The 07404 cell also names the native `docs/platform/.../distribution-baseline.md`, which is not an edge.
- The 6 candidates excluded as native `README.md` and `vision.md` are correct.

## Record-text notes (not rework)
- 07136, 07138 and similar items use `unitId item-L13` for a span on line 15. The unit is the Related list item plus its continuation lines through the Provenance line, so the id is internally consistent.
- 07171's reason says "actual historical source region ... separate from wrapper Related", but line 15 is a Related-header entry. The outcome (preserve, retained path) is right. The better rationale is L12-26(3) for a retained root authority, as 07173 states it.
- 07255 (distribution-baseline line 15, a Related entry) has the same wording mismatch, and the outcome is the same.

## Lead-judgment questions
1. **Retiring-tree evidence/source cells in the platform ledger.**
   - 07172 cites `docs/specs/platform-foundations.md` "decision history" in a Proof/evidence cell. 07180 cites `docs/specs/runner.md` RUL104 in a Source cell.
   - `git grep RUL104` at the pin finds it only in `docs/specs/runner.md:1135`. Neither of the two cited claims has a holder outside the retiring tree. For foundations, that is P8-DOC-GAP-02.
   - Preserve follows L12-51 (evidence and provenance citations preserve) and L12-25/26 (Source column). These cells will point at a deleted path after Phase 9 step 6, with no successor note or carry flag. Confirm that preserve alone is intended, or whether a successor/carry note for the RUL104 holder (a runner-area carry) is wanted.
2. **Audit erratum in source-preservation-audit.md lines 56-62.** It states that `migration-map.md` and `rewrite-plan.md` are absent from the tree and have no git history. Both exist at the pin (`docs/architect/packaging-distribution/migration-map.md` and `rewrite-plan.md`). The preserve dispositions are right, because the text is dated original evidence. The claim is false at the pin, so a Phase 9 step-10 semantic reader may want it noted.
3. **Possible missed partial coordinate, `history/distribution-baseline.md`.** It appears at source-preservation-audit lines 81 and 82 in the "Original source" column (col ~118 and ~158), with no edge and no legacyScan candidate. The scan treated it as a native path, because it resolves to the area's own `history/distribution-baseline.md`. In that column it denotes the legacy ledger. Any edge would preserve under provenance, so there is no patch consequence. I did not count it as rework. Add an author-added preserve edge only if Lead wants strict one-to-one coverage of partial coordinates in source columns.

Status: DONE
Summary: All 6 files (98 edges) reviewed against the pin and judged ok, with 0 rework. I found only record-text wording notes and three Lead-judgment questions: retiring-tree evidence citations in the ledger, a stale erratum claim, and one uncovered partial coordinate.
