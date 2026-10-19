# Review A38 Step 0 author/accounting, part 02

Reviewer: reviewer:sonnet-session:a83f315585819037e@2026-10-19

Commits: worktree HEAD b1e7aec1a (ACCOUNTING); AUTHOR a2e8634df (parent a2e8634df^ used as the before-row source); historical comparison 49ad04648^1.

Part: step-00-author-review-part-02.json, sha256 7dcdd860c6a075417036cf1a23800108b1696bd22dc798d8a09190077e09d0fa, 38 entries, all kind=binding (no pair/exception/conflict entries in this part; binding-072 is a Step 0 exception-class passage change).

Method (all mechanical): for each entry, (1) the row at rowIndex in a2e8634df^, in b1e7aec1a and in the working tree equal embedded before / after / after; (2) only targetAnchor, targetUnitDigest, rationale and the added reviewNote differ (binding-071/073 additionally drop the prior review fields); claimId, sourceUnitDigest, sourcePath, targetOwner, claimKind, disposition and authoredBy unchanged; (3) using the committed recipe unitsOf (step10-sync287-lib.mjs, unchanged, extracted from the round5 manifest) on git show 49ad04648^1:<targetOwner> and on the current file: the old unit at before.targetAnchor hashes to before.targetUnitDigest and is unique by digest in the old file; the unit at after.targetAnchor hashes to after.targetUnitDigest; normalised passage text and heading ancestry are equal; the old digest occurs exactly once in the current file; (4) historicalNative sourceAnchor/sourceUnitDigest agree with the old unit; (5) reviewStatus pending and no review fields carried.

| Entry | File (ledger) | Row | Anchor old -> new | Verdict | Evidence |
|---|---|---|---|---|---|
| binding-036 | s4-packaging-distribution-architecture | 243 | unheaded-block-30 -> unheaded-block-34 | ok | Digest identical to the old passage, same ancestry, unique in current file; positional shift only. |
| binding-037 | s4-packaging-distribution-architecture | 244 | unheaded-block-31 -> unheaded-block-35 | ok | Digest identical to the old passage, same ancestry, unique in current file; positional shift only. |
| binding-038 | s4-packaging-distribution-architecture | 245 | unheaded-block-32 -> unheaded-block-36 | ok | Digest identical to the old passage, same ancestry, unique in current file; positional shift only. |
| binding-039 | s4-packaging-distribution-architecture | 246 | unheaded-block-33 -> unheaded-block-37 | ok | Digest identical to the old passage, same ancestry, unique in current file; positional shift only. |
| binding-040 | s4-packaging-distribution-architecture | 247 | unheaded-block-34 -> unheaded-block-38 | ok | Digest identical to the old passage, same ancestry, unique in current file; positional shift only. |
| binding-041 | s4-packaging-distribution-architecture | 248 | unheaded-block-35 -> unheaded-block-39 | ok | Digest identical to the old passage, same ancestry, unique in current file; positional shift only. |
| binding-042 | s4-packaging-distribution-architecture | 249 | unheaded-block-36 -> unheaded-block-40 | ok | Digest identical to the old passage, same ancestry, unique in current file; positional shift only. |
| binding-043 | s4-packaging-distribution-architecture | 250 | unheaded-block-37 -> unheaded-block-41 | ok | Digest identical to the old passage, same ancestry, unique in current file; positional shift only. |
| binding-044 | s4-packaging-distribution-architecture | 251 | unheaded-block-38 -> unheaded-block-42 | ok | Digest identical to the old passage, same ancestry, unique in current file; positional shift only. |
| binding-045 | s4-packaging-distribution-architecture | 252 | unheaded-block-39 -> unheaded-block-43 | ok | Digest identical to the old passage, same ancestry, unique in current file; positional shift only. |
| binding-046 | s4-packaging-distribution-architecture | 279 | unheaded-block-40 -> unheaded-block-44 | ok | Digest identical to the old passage, same ancestry, unique in current file; positional shift only. |
| binding-047 | s4-packaging-distribution-architecture | 280 | unheaded-block-41 -> unheaded-block-45 | ok | Digest identical to the old passage, same ancestry, unique in current file; positional shift only. |
| binding-048 | s4-packaging-distribution-architecture | 281 | unheaded-block-42 -> unheaded-block-46 | ok | Digest identical to the old passage, same ancestry, unique in current file; positional shift only. |
| binding-049 | s4-packaging-distribution-architecture | 282 | unheaded-block-43 -> unheaded-block-47 | ok | Digest identical to the old passage, same ancestry, unique in current file; positional shift only. |
| binding-050 | s4-packaging-distribution-architecture | 283 | unheaded-block-44 -> unheaded-block-48 | ok | Digest identical to the old passage, same ancestry, unique in current file; positional shift only. |
| binding-051 | s4-packaging-distribution-architecture | 284 | unheaded-block-45 -> unheaded-block-49 | ok | Digest identical to the old passage, same ancestry, unique in current file; positional shift only. |
| binding-052 | s4-packaging-distribution-architecture | 285 | unheaded-block-46 -> unheaded-block-50 | ok | Digest identical to the old passage, same ancestry, unique in current file; positional shift only. |
| binding-053 | s4-packaging-distribution-architecture | 286 | unheaded-block-47 -> unheaded-block-51 | ok | Digest identical to the old passage, same ancestry, unique in current file; positional shift only. |
| binding-054 | s4-packaging-distribution-architecture | 287 | unheaded-block-48 -> unheaded-block-52 | ok | Digest identical to the old passage, same ancestry, unique in current file; positional shift only. |
| binding-055 | s4-packaging-distribution-architecture | 288 | unheaded-block-49 -> unheaded-block-53 | ok | Digest identical to the old passage, same ancestry, unique in current file; positional shift only. |
| binding-056 | s4-packaging-distribution-architecture | 289 | unheaded-block-50 -> unheaded-block-54 | ok | Digest identical to the old passage, same ancestry, unique in current file; positional shift only. |
| binding-057 | s4-packaging-distribution-architecture | 290 | unheaded-block-51 -> unheaded-block-55 | ok | Digest identical to the old passage, same ancestry, unique in current file; positional shift only. |
| binding-058 | s4-packaging-distribution-architecture | 291 | unheaded-block-52 -> unheaded-block-56 | ok | Digest identical to the old passage, same ancestry, unique in current file; positional shift only. |
| binding-059 | s4-packaging-distribution-architecture | 292 | unheaded-block-53 -> unheaded-block-57 | ok | Digest identical to the old passage, same ancestry, unique in current file; positional shift only. |
| binding-060 | s4-packaging-distribution-architecture | 294 | unheaded-block-54 -> unheaded-block-58 | ok | Digest identical to the old passage, same ancestry, unique in current file; positional shift only. |
| binding-061 | s4-packaging-distribution-architecture | 295 | unheaded-block-55 -> unheaded-block-59 | ok | Digest identical to the old passage, same ancestry, unique in current file; positional shift only. |
| binding-062 | s4-packaging-distribution-architecture | 296 | unheaded-block-56 -> unheaded-block-60 | ok | Digest identical to the old passage, same ancestry, unique in current file; positional shift only. |
| binding-063 | s4-packaging-distribution-architecture | 297 | unheaded-block-57 -> unheaded-block-61 | ok | Digest identical to the old passage, same ancestry, unique in current file; positional shift only. |
| binding-064 | s4-packaging-distribution-architecture | 298 | unheaded-block-58 -> unheaded-block-62 | ok | Digest identical to the old passage, same ancestry, unique in current file; positional shift only. |
| binding-065 | s4-packaging-distribution-architecture | 299 | unheaded-block-59 -> unheaded-block-63 | ok | Digest identical to the old passage, same ancestry, unique in current file; positional shift only. |
| binding-066 | s4-packaging-distribution-architecture | 300 | unheaded-block-60 -> unheaded-block-64 | ok | Digest identical to the old passage, same ancestry, unique in current file; positional shift only. |
| binding-067 | s4-packaging-distribution-architecture | 301 | unheaded-block-61 -> unheaded-block-65 | ok | Digest identical to the old passage, same ancestry, unique in current file; positional shift only. |
| binding-068 | s4-packaging-distribution-distribution | 11 | unheaded-block-21 -> unheaded-block-25 | ok | Digest identical to the old passage, same ancestry, unique in current file; positional shift only. |
| binding-069 | s4-packaging-distribution-distribution | 14 | unheaded-block-23 -> unheaded-block-27 | ok | Digest identical to the old passage, same ancestry, unique in current file; positional shift only. |
| binding-070 | s4-packaging-distribution-distribution | 5 | unheaded-block-22 -> unheaded-block-26 | ok | Digest identical to the old passage, same ancestry, unique in current file; positional shift only. |
| binding-071 | s4-packaging-distribution-successors | 21 | unheaded-block-145 -> unheaded-block-144 | ok | Digest identical (f0b5e6..), same ancestry, unique in current file. Prior reviewed status/reviewer/report/commit fields removed, now pending with reviewNote. Shares target block with the other of 071/073 as before. |
| binding-072 | s4-packaging-main-recarry | 0 | unheaded-block-5 -> unheaded-block-5 | ok | Same Data Dictionary table (ancestry Spec: Distribution > Data Dictionary, same anchor, same header). Digest 652c49..->ac5c94.. because the main merge extended it: the current table block equals the main-side table (49ad04648^2 and 49ad04648 identical for rows 5g..7j), adding rows 5h and 7c-7j and widening 5g/7/7b; no old text moved elsewhere (old digest absent from current file). Binding meaning (supersede successor by table identity) preserved; pending, no approval carried. Rationale cites a stale 00a341.. digest (wording only, not rework). |
| binding-073 | s5-root-authorities-boundary-gaps | 1 | unheaded-block-145 -> unheaded-block-144 | ok | Digest identical (f0b5e6..), same ancestry, unique in current file. Prior reviewed status/reviewer/report/commit fields removed, now pending with reviewNote. Shares target block with the other of 071/073 as before. |

Totals: 38 ok, 0 rework, 0 concerns of rework class. Entries 38/38 verified.

Rework details: none.

Notes (not rework): binding-072 rationale text still quotes digest 00a3412a.. while targetUnitDigest is ac5c945e..; binding-071/073 rationale text still says the target is unheaded-block-145 (current lines) while the row binds unheaded-block-144. Rationale wording only; authoritative fields are correct. The accounting commit b1e7aec1a touches only the two reproduction manifests (2 files, 2 insertions each). Not independently re-run: digest recomputation was done through the recipe unitsOf on both file versions, which is the shell-reproducible path; no npm test or fgos CLI used.
