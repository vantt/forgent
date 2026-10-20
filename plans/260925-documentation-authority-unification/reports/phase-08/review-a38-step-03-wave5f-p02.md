# Review a38 — Step 3 wave 5f, part p02

Pin ae141550c2e022310de7a0efea757580c0b2479f. Read-only worktree detached at 0d1fb3bff. No checker or probe run. Each assigned file was read whole at the pin. Every edge was reviewed: source span against the pinned line text, disposition, target, anchor, timing, reason, witness groups, legacy-scan candidates and diff. I also grepped each source for legacy path forms the record may have missed. Every span's line/column text matched the pinned source for all 35 edges.

Verdict: 6 of 6 files ok. No outcome defects. 35 of 35 edges reviewed.

## Per-file results

### 1. docs/platform/intent-preservation-ledger.md
- Set batch-107, stratum unpatched-seeded. Verdict ok. 10 edges: 10 preserve, 0 patch, 0 park, empty diff.
- recordSha256 2f5b5f1f…dc48, diffSha256 e3b0c442… (empty), sourceDigest c3238831…0121.
- 07171 (L15 Related `docs/doc-governance.md`): preserve is correct. It is a retained root with a live Related target that survives (L12-34(4)). The candidate copy `docs/platform/governance.md` exists, but the root is retained.
- 07172 (L71 `docs/specs/platform-foundations.md`) and 07180 (L92 `docs/specs/runner.md` RUL104): preserve is correct. They are evidence and provenance citations in the "Proof / evidence" and "Source" columns (L12-51 ruling 1). Nothing patches a live pointer.
- 07173, 07174, 07179: `docs/doc-governance.md` in Source columns. Retained root, preserve ok.
- 07175 (`docs/README.md`): retained, preserve ok.
- 07176 (`docs/decisions/index.md`): exists, preserve ok. The successor note to the decisions-index record is non-executable.
- 07177, 07178 (`docs/distillery/sources/okf.md`): retained, preserve ok.
- Missed references: none. L80 "specs/architecture" is prose, not a path token. L71 `AGENTS.md` is a retained root. Bare D-ADR0035 and D-ADR0057 have no path, so they are not edges (L12-49).
- Excluded scan candidates are correct: L110 `vision.md` and L111 `platform-foundations.md` resolve to native `docs/platform/*`, which exist at the pin.

### 2. docs/platform/migration-authoring-rules.md
- Set batch-108, stratum unpatched-seeded. Verdict ok. 15 edges: 2 preserve (L17, L83-84 group, 3 edges in total), 4 phase9-row-flip, 8 parked step5-parity, empty diff.
- recordSha256 7a280461…ce27, sourceDigest 7b7d5bd4…5163.
- 07181 (L17 Related), 07194 (L83), 07195 (L84): `docs/doc-governance.md` is a retained root, preserve ok.
- 07182 and 07183 (L33 `docs/specs/**`, `docs/architect/**`, unit item-L31): the unit is computed correctly as the L31-34 list item. Both share one disposition. The Phase 9 replacement describes the post-cutover rule truthfully. Row-flip ok (L12-35(2)).
- 07184 and 07185 (L36 `work-state.md`, L37 `runner.md`, unit item-L35): same unit and shared disposition, ok.
- 07186 to 07193 (L45 x2, L48, L49, L51, L55, L57 x2): all are parks with category step5-parity. They describe the legacy ratchet's actual roots, baseline, exceptions and non-authority exemptions in `scripts/check-legacy-docs-ratchet.mjs`. blockedCategory equals dependencyCategory. The smallest blocker is named. Witness groups are category citation-only with alias lookups empty (alias-table.json and doc-registry.json 0 matches). The park is true, because rewriting the rule must wait for ratchet reader parity.
- Missed references: none. The Related `docs/transitional-switchboard.md` is a retained root whose own record flips its status rows. Links to `documentation/switchboard.md`, `governance.md` and the `scripts/*` are native or not legacy.

### 3. docs/platform/observe/decisions/observe-component-architecture.md
- Set batch-109, stratum patched-seeded. Verdict ok. 2 edges: 1 preserve, 1 patch.
- recordSha256 e4c21a2e…d199, diffSha256 2aa5978a…ee6cf.
- 07198 (L9 Provenance `docs/specs/observe.md at 111adc5…`): preserve ok (L12-47). It is a provenance line and the named path exists.
- 07199 (L17 Related): patch to `docs/platform/observe/spec.md`. The target exists at the pin. It is the whole-area spec, and the Related item names the whole area, so the null anchor is justified. The consumer is a decision record, so the target is neither self nor a duplicate. The diff is a single hunk at L14-20 whose context is the Related list. It matches the span and applies cleanly.
- Missed references: none. The bare `node-to-rust-migration.md` at L39 resolves to the native `docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md`, so it is not a legacy basename. The `holder-lock/spec.md` citation is native.

### 4. docs/platform/observe/spec.md
- Set batch-109, stratum unpatched-seeded. Verdict ok. 6 edges: 5 preserve, 1 parked description-rewrite, empty diff.
- recordSha256 e885db19…4956, sourceDigest 65d6f6e8…6460.
- 07200 (L9 Provenance): preserve ok.
- 07201 (L17 Related `docs/specs/observe.md`): parked description-rewrite. The patch target would be the consumer itself, since it carries the source of `docs/specs/observe.md`. This follows L12-34(4) and L12-52(2): a wrapper Related entry pointing at its own source parks. The reason is true, and the file has a witness with category citation-only.
- 07202 and 07203 (L22 rebased "to" destinations) and 07204 and 07205 (L93 links): `docs/reference/discussion-quality-rubric.md` and `docs/how-to/compare-discussion-setups-with-metrics-eval.md` both exist and are retained. The relative links resolve from `docs/platform/observe/`. Preserve ok.
- Missed references: none. A grep of the whole source finds only these paths plus native `spec.md` links. The "from" spellings quoted in the L22 note are not retiring paths.

### 5. docs/platform/packaging-distribution/architecture/fgctl-and-local-fgos.md
- Set batch-110, stratum unpatched-seeded. Verdict ok. 1 edge: 1 preserve, empty diff.
- recordSha256 2bf58b03…fa72.
- 07220 (L83): the path sits in the framing sentence of the "## Retained Runtime Identity And Activation Source Detail" carriage. The reason states the carriage declaration and makes no existence claim, as L12-35(4) requires. Preserve ok.
- Missed references: none. A grep for `docs/(specs|architect)/` finds only L83.

### 6. docs/platform/packaging-distribution/contracts/projection-ledger.md
- Set batch-110, stratum unpatched-seeded. Verdict ok. 1 edge: 1 preserve, empty diff.
- recordSha256 5ab81034…77aa5.
- 07241 (L72): same carriage framing sentence and same reasoning as file 5. Preserve ok.
- Missed references: none.

## Outcome defects
None.

## Record-text notes (not rework)
- 07171 and 07173 to 07175: the reasons paste large "Source role" quotations that include fence fragments (a stray closing "```") or whole table rows. 07171 calls a Related header an "actual historical source region". Wording only. The outcome (retained root, preserve) is right.
- 07202 and 07203: the reason calls the L22 note an "actual historical source region". The span is in a candidate scaffolding note and it is the rebased destination. Wording only.
- 07172 and 07180 say "tree retires at Phase 9" but name no live successor. For 07172 `docs/platform/platform-foundations.md` exists, though the decision history is probably held only in the retiring spec. This is acceptable for a preserved evidence citation.
- 07182 to 07185: dependencyCategory is null for row-flip edges. This is allowed because they are not parks.

## Lead-judgment questions
1. batch-107 L74: the bare `reading-map.md` in "`docs/README.md`, `reading-map.md`, governance, related links..." is excluded from edges. The exclusion's resolved readings name `docs/platform/reading-map.md`, which does not exist at the pin. Two real files do exist, `docs/reading-map.md` (retained root) and `docs/specs/reading-map.md` (retiring). The row lists root portal artifacts (`docs/README.md`, governance), so the root map is the natural reading and no edge is needed (L12-53 ruling on bare retained-root basenames). I consider the exclusion acceptable. The exclusion text is imprecise: it cites a nonexistent candidate path and does not name the real referent. The Lead may prefer to confirm, or to add a clarifying note.

## Counts
Reviewed denominator and rework numerator per set and stratum. Overlaps: none, because each file sits in exactly one stratum.

| Set | Stratum | Reviewed files | Rework |
|---|---|---:|---:|
| batch-107 | unpatched-seeded | 1 | 0 |
| batch-108 | unpatched-seeded | 1 | 0 |
| batch-109 | patched-seeded | 1 | 0 |
| batch-109 | unpatched-seeded | 1 | 0 |
| batch-110 | unpatched-seeded | 2 | 0 |

Edges reviewed: 35 (batch-107 10, batch-108 15, batch-109 8, batch-110 2). This part claims no set closure.

Status: DONE
Summary: All 6 files and 35 edges in part p02 are ok. No outcome defects, a few record-text wording notes, and one Lead question about the bare `reading-map.md` exclusion in batch-107 L74.
