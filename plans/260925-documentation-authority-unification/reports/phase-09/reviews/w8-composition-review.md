# W8 composition review

**183 verdicts: 164 APPROVE, 19 REWORK.** Machine file: [w8-composition-review.json](w8-composition-review.json).

| Scope | APPROVE | REWORK |
|---|---:|---:|
| Recomposed G7 REWORK specs (c5, c7) | 2 | 0 |
| 101 park actions | 95 | 6 |
| Supplemental blocked groups (outside the 101) | 0 | 2 |
| Family 8/13/17 member joins (72) | 64 | 8 |
| Gate items (family 8, 13, 17 records; 115 join; GAP-05; citation drift) | 3 | 3 |

Reviewed at `f2162d9ff`. The records are pinned at `cffe725b9`. All replays ran in `/tmp/fgos-work/w8-comp-review` (deleted afterwards). No git write, no fgOS CLI, no full test suite.

## 1. The two recomposed REWORK specs: both resolved

- c5 `test/cli/fgos-merge.test.mjs`: the stray blank line is gone and the one-line retarget is kept. The target file exists.
- c7 `docs/how-to/fix-bare-citation-findings.md`: the link now points to `runner/subcomponents/h-6979005beaf7/spec.md#business-rules`, the file that holds the runner rules.
- For both, `patch --batch --fuzz=0` forward and rollback reproduce `expectedAfterSha256` and `beforeSha256` exactly. The bytes at HEAD still equal `beforeSha256`.
- All 62 effective specs replay byte-exact once predecessor chains are resolved.

## 2. The 101 park actions

**Mechanical check of all 101.** Every action has its spec or evidence present, and each spec is effective or a stated no-byte-change. Before and after hashes match the specs.

- **69 render actions:** I regenerated them from a scratch export of HEAD plus the 12 composed canonical inputs, using `node scripts/build-skill-wrappers.mjs`. All 69 renders and all 33 changed outputs are byte-equal, with no extra changes.
- **Semantic spot-check of 26:** the 7 hunk parks, the identity successor, the reading-map retirement, 6 status, convention and row specs, 5 render diffs, both REWORK specs, and the 4 blocked groups. Targets and anchors exist. The fgos.rs comment correction is accurate.

**6 REWORK actions:**

1. `docs/specs/workflow.md` hunk park: it contradicts the D6 holder `docs/platform/workflow/spec.md`. The park points at `runner/decisions/h-36d872fbb0e5.md` and the holder points at `../runner/spec.md`. It also patches a source that is being retired. Recompose it against the holder and pick one target.
2. `docs/enduser-docs-index.json`: the recorded "command" is a JS function call. The door is `fgos docs-index`, with the doctor check `enduser-docs-index-stale` as proof. The bounded replay drops 2 docs; record each as carried or retired.
3. `docs/ui-spec/generated/wireframe-v2.html`: the command is wrong. `interpret.mjs` writes `wireframe.html` and has no `--out` flag. Use `interpret-wireframe.mjs --root docs/ui-spec` after `npm ci` in the tools directory. The committed render is already stale against its sources: regenerating at HEAD gives `f06815ee`, not `77894fdd`.
4. `docs/platform/governance.md`: it chains on the stale holder table (see section 3).
5. and 6. The two switchboards are blocked. See below.

**The 4 blocked items and what each needs now that D6 has landed (`e5af4c501`):**

| Item | What it needs now |
|---|---|
| system-overview f07928/f07929 (outside the 101) | The holders exist: the two end-user sections in `work-state/contracts/knowledge-registry.md`, approved as `enduser-contract-carry`. HEAD lines 44-45 already link to them. The step-07 base spec no longer applies at HEAD. Recompose the base and the partial spec at current bytes, and add the two rows. |
| architecture-intent, 8 rows (outside the 101) | D6 does not cover these. Five rows have candidate copies under `docs/platform/proposals/**`, `system-architecture/architecture/` and `agent-coordination/proposals/`. Intent ledger, coordination-session and flow-definition exist only as retired-engine history. The Lead must rule on placement, then compose and replay. |
| transitional-switchboard f08382-f08384 | Set the end-user owner row to the two knowledge-registry sections, then recompose at current bytes (D6 also changed `transitional-switchboard.json`). |
| documentation/switchboard f06749-f06751 | Same fix as the transitional switchboard. |

**Drift since the record pin.** 11 of the 58 effective-spec files changed after `cffe725b9`, so their byte guards will refuse at cutover. Nine of the 11 still apply with fuzz=0 to HEAD bytes. Two no longer apply: `w2:predecessor:docs/platform/component-boundary.md` and the step-07 system-overview base. Re-pin all 11 at F (G9).

## 3. G1 families 8, 13 and 17

- **All 115 members are joined.** The 72 members of families 8/13/17 are in `member-joins.json`, and each verbatim passage is found at its recorded sha. The 43 members of families 14/15/16/18 are in `carries/claim-carries.json`.
- **Family 8 (48 members):** APPROVE. 28 members are "preserve" rows with no spec. One of them, `reference-003640`, has no owning proof and its file changed, but the predicate is still present. 10 member source files changed after the pin; re-anchor them at F.
- **Family 13 (16 members):** APPROVE. The scan and convention are correct. The red test is a content problem (section 5), not a scan defect.
- **Family 17 (8 members plus the table): REWORK.** The table still marks enduser-docs-authoring, enduser-docs-index, seat-binding and workflow as MISSING, but all four now have holders. Two rows also cite the non-effective `recomposed-predecessor:src/cli/command-registry.mjs`. Ten decision write-home directories, and `docs/platform/decisions/`, do not exist yet.

## 4. GAP-05 `dynamic-023895`

The placement is right: move both whole carriage units into `system-architecture/history/component-boundary-source-carriage.md` and keep a live pointer. The gateway test reads `docs/platform/component-boundary.md` by name and HEAD carries the same 9 retired names, so this move is the only change that clears it without renaming or exempting anything.

Replayed at HEAD:

- Composed test plus the retired-schema qualification plus the relocation: **10/10 pass**.
- Without the relocation: the gateway test fails.

The record is REWORK because it cannot be applied as is:

- Its predecessor fails fuzz=0 at HEAD, so it must be rebased on HEAD bytes. The relocation hunk itself applies cleanly.
- 88 ledger bindings target the 22 moved headings (12 in s6-readme, 10 in s6-layout, 66 in s14-resync-b). Each needs a rebind overlay before the Lead approves.

## 5. Citation drift "124 new findings"

This is a **real gap, not baseline drift**. The baseline is unchanged, and no new finding's text matches any baseline entry. At HEAD the same scan reports **142** findings:

- **130** are in `docs/platform` specs that already exist on main and were never scanned before (git 47, holder-lock 24, platform-foundations 15, and others).
- **10** are in branch-only candidates. `work-state/spec.md:1048` lost glosses that its legacy source already has.
- **2** are in a retired-engine history ADR.

Fix:

- Exclude `*/history/*` from the added read set.
- Gloss the 10 branch sites (re-carry the glossed legacy text for work-state).
- Lead decision for the 130 main-owned sites: add exactly those keys to the baseline (existing entries unchanged), or route them to the owning lanes to gloss.

Status: DONE_WITH_CONCERNS
