# Step 3 pilot round 3, semantic review g01

Pin `ae141550c`; worktree read-only at `bade80e52`. I read the r3 request g01 section, A51, L12-26, L12-30 and L12-31, the r2 g01 review, the r3 change delta and all six g01 records (batch-001, batch-002). I did not run the resolver; I checked the records against the pinned bytes directly.

At the pin I read:
- the full legacy-token lines of every g01 file;
- `docs/reading-map.md` lines 1-22, 122-128, 131, 135-185 and every edge region;
- `doc-governance.md` lines 7-22, 40-75, 93-97 and 458-476;
- `platform-foundations.md` lines 1-8 and 169-178;
- `routing-handoff-contract.md` lines 30-36, 85-95 and the ADR 0005 section of the runner decisions file.

Target passages read: packaging-distribution §9 and the heading outline; runner `h-6979005beaf7/spec.md` headings and RUL53/84/89/93 placement; agent-confinement §9.2 and §13; the candidate headers of claude-plugin, work-state, runner, observe, herdr-web-dashboard, decision-citation-drift and agent-confinement; the system-architecture architecture-intent and architect-readme candidates; the domainization candidate; the documentation-system-design candidate; and the host-invocation-routing and agent-coordination candidate trees.

I also ran a read-only coverage scan of `docs/reading-map.md` at the pin. It searched every retiring-tree basename (627 names) plus the `docs/specs`, `docs/architect`, `specs/` and `architect/` roots, and compared each hit against the record spans. No hit is uncovered except generic names that resolve to retained or candidate files, such as `platform/README.md`, `vision.md`, and root `README.md` on line 141. The other four small files have no uncovered legacy token either.

## Per-file verdicts

### batch-001

`docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md` — batch-001 — **ok**
- Round-1/2 defects: 07239 stays fixed.
- 07239 patches to `docs/platform/packaging-distribution/spec.md#9-instruction-composition-and-projection`.
  - The anchor proof gives heading `## 9. Instruction Composition And Projection` at lines 201-210, RUL102 at line 203, and no narrower common holder.
  - The only other RUL102 hit in that file is line 724, in the retained Lịch sử narrative, which is carriage.
  - The "Agent Context Engine (RUL102, ...)" gloss stays true for the new target.
  - The record diff is the single hunk at line 39 and matches the record.
- 07240 is preserved because `docs/architecture-manifest.json` exists at the pin.

### batch-002

`README.md` — batch-002 — **ok**
- Records 00001..00003 preserve retained how-to and explanation paths. All three exist at the pin.
- There are no legacy-root or retiring-basename tokens in the file, no added edges, and the diff is empty.

`docs/doc-governance.md` — batch-002 — **ok**
- Round-2 Lead question Q1 (wording of "retained path" for retiring roots) is fixed.
  - 01902, 01904 and 01909 now say "exists at author pin; tree retires at Phase 9; preserved as retired history / lineage".
  - They add the non-executable successor note `docs/doc-governance.md`.
  - They state that the candidate `documentation-system-design.md` declares "Source snapshot retained". I confirmed its header: "Implementation: Source snapshot retained", "Canonical: No".
  - 01902 is a genuine "Promoted from" lineage line and 01909 is a "source design discussion" provenance cell. Both are correct preserves.
- 01905 and 01906 are one shared row flip. Line 95 is unchanged, and the flip text names the switchboard and keeps the original until cutover.
- Preserves 01903, 01907 and 01908 point at retained root files that exist at the pin.
- No missed legacy tokens. The tree block at lines 51 and 58 lists only retained or target-layout names.

`docs/platform-foundations.md` — batch-002 — **ok**
- 05086..05090 are retained `docs/distillery/**` paths, and the reasons state "retained path exists at author pin". All of them exist at the pin.
- 05091:
  - The target `docs/history/phase-3-compound-learning/...` has 0 tree entries at the pin.
  - The passage is the dated evidence line "**Claimed.** F4 — 2026-07-16" (line 171, with the path at line 176 in the same paragraph).
  - The reason quotes that marker, as L12-31(3) requires.
  - Preserve is correct.

`docs/routing-handoff-contract.md` — batch-002 — **ok**
- Round-1 defect 08056 stays fixed.
  - Anchor `0005-runner-cô-lập-worker` is the `### 0005` heading at lines 30-73 of the runner decisions file.
  - It holds the D3 and D4 text (`per D3`, `per D4`).
  - There are no sub-headings for D3 or D4, so no narrower holder exists.
  - The "ADR-0005 ... D3/D4" gloss stays true.
- 08053 is a whole-file patch to work-state/spec.md. The "(schema work)" gloss is true because that spec holds the data dictionary.
- 08054 patches to agent-confinement §9.2 (heading at line 454). Both the extractor anchor and `githubSlug` resolve under `anchorExists`.
- 08052 and 08055 preserve the retained `docs/platform-foundations.md`.
- The diff has three hunks and they match the records. `legacyScan` found no added candidates, and my own scan agrees.

`docs/reading-map.md` — batch-002 — **ok**, with minor notes below.

Disposition counts, 97 edges (89 original plus 8 added):

| Disposition | Count |
|---|---|
| patch | 34 |
| preserve | 32 |
| row-flip | 7 |
| parked | 24 (16 original plus 8 added) |

Round-2 defects and Lead questions confirmed fixed:
- Q2 (anchor precision): 08008, 08009, 08016 and 08017 now target `h-6979005beaf7/spec.md#business-rules`.
  - The heading `## Business Rules` is unique at line 25.
  - RUL53 is at lines 90 and 92, RUL93 at 82 and 187, RUL89 at 183, and RUL84 at 178 and 191. All sit inside it.
  - The listAnchors check shows `business-rules` (line 25) and `added-in-candidate-runner-business-rules` (the H1 at line 1) as separate anchors.
  - The diff and the record anchor agree.
- Q1 (retiring-tree wording): 07953 and 07963 now say "exists at author pin; tree retires at Phase 9; preserved as retired history / lineage". They carry the successor note `docs/reading-map.md`.
  - 07963 is a "Merged from" lineage line.
  - 07953 is a header "Related:" entry; see Lead question 1.
- All round-1 and round-2 patch, park and preserve decisions are unchanged and still hold. I rechecked the heading proofs for 07977 (§3.3 at line 96), 07992 (§3 at line 129), 07993 (§7 at line 265), 07994 and 08031 (§11 RUL60 at line 1089 and RUL45 at line 1077).
- Candidate headers of claude-plugin, runner, observe and the others read "Carriage only" for implementation truth. They are area specs, treated uniformly as targets. This matches the earlier acceptance.

Added edges, all parked. All eight are real out-of-inventory references and none was missed or overcounted.
- Lines 163 and 164 hold the following:
  - On line 163 (the agent-coordination row): `README.md`, `coordination-session.md` and `flow-definition.md`.
  - On line 164 (the host-invocation row): its five basenames.
- Row 163:
  - Every file exists under `agent-coordination/history/retired-engine/files/**`.
  - The row describes the retired tree ("đã thu hồi ở P4").
  - The park is "description needs rewrite" with the successor note `.../history/retired-engine/`. It is consistent with 08018 and its specs-map twin 08193.
- Row 164:
  - The reason is factually exact. `legacy-cli-transition.md` and `external-provider-protocol.md` exist under `docs/platform/host-invocation-routing/architecture/`.
  - `host-invocation-provider-routing.md` became `architecture/provider-routing.md`.
  - `node-to-rust-component-migration.md` became `architecture/node-to-rust-migration.md`.
  - `rust-cli-and-proof-components-plan.md` exists only in the retiring tree. The path-by-path listing confirms there is no counterpart in the candidate tree.
  - That makes two moves, two renames and one absent file. 08019 is consistent with the five siblings.
- The "5 tệp" description blocker is real: a path-only retarget would leave the list false.
- Each added edge has its own searchWitness with one hit group. The live hits are proof logs, verification files, switchboard rows, candidate architecture or contract files that merely name the file, and ADR text. None is a holder of the row's claim.

Parks rechecked:
- 08012: the live spec has `### 13.2` but no `### 13.1`. Section 13.1 is held only at line 51 of `rollout-and-settled-facts.md`, which is carriage.
- 08013: the only holder is `system-architecture/history/architect-readme.md`, "Document type: History".
- 08014 and 08015: the whole-file candidates are carriage-style ("Preserve the complete ... source", "current source remains ...", "Source snapshot retained"). There is no live non-carriage whole-file successor.
- 07965, 07981, 08004, 08007, 08028 and 08029: GAP-02. The only live hits are switchboard and decision-index citations, which are not holders.
- 07979: the source says "legacy spec", so a path-only patch would leave the gloss false.
- 07984: Step 5 default-root parity under L12-30(8).
- 07972 and 08003: whole-row `docs/specs/` description rewrite.

Preserves rechecked:
- 08037 and 08038: the line 181 passage says "path not present at this commit" and cites `git ls-tree e7393ea3c ... (no entries)`. The target has 0 tree entries at the pin. Preserving is correct; see Lead question 2 for the quoted marker.
- 07982: the retained path exists, and the successor note is non-executable.

## New defects (edgeId, line, rule, correction)

None that require rework. Minor wording points, non-blocking:

- `maps-j-08018` (and its twin 08193, outside g01), source line 163, L12-30(2) and L12-31(5) factual reasons:
  - The park reason says the description "names historical contracts/vocabulary/roadmap structure".
  - Line 163 names only `README.md` and `contracts/` (`coordination-session.md`, `flow-definition.md`).
  - Suggested correction: drop "vocabulary/roadmap". The real blocker, a retired tree that needs live versus retired-engine boundaries, is correct.
- `maps-j-08008`, `08009`, `08016`, `08017`, source lines 158, 158, 161 and 162:
  - The reason text still says "exact live locator passage at `...#added-in-candidate-runner-business-rules`", while target and anchor are `#business-rules`.
  - A trailing "L12-31(1): ... #business-rules" sentence reconciles them.
  - Suggested correction: remove the old slug from the first sentence so a reader cannot take it as the anchor.

## Lead-judgment questions

1. Header "Related:" lineage entries.
   - These are 07953 (reading-map line 19) and 01904 (doc-governance line 20). They point at retiring-tree sources (`docs/specs/reading-map.md`, `docs/architect/documentation-system-design.md`).
   - After Phase 9 deletion they become dead header links.
   - They are preserved as "lineage" under L12-31(2), which is acceptable under that ruling. The alternative is to park them as dead links once the tree retires.
   - I recommend keeping the preserve. Lineage entries are the intended use of L12-31(2) and the successor note is on record.
2. Marker quote for 08037.
   - The reason quotes "benchmark lịch sử ngoài suite (F4)", a historical label. It is not a dated past-action marker.
   - The same line carries the stronger marker "path not present at this commit" and `git ls-tree e7393ea3c ... (no entries)`. 08038 already quotes the latter.
   - Suggested correction: quote the stronger marker in 08037 as well. This is non-blocking and the disposition is right.
3. Anchor spelling.
   - The records use the extractor `anchor` (for example `92-hostread-blind-worker-mù-...`). GitHub's rendered slug differs (`...blind--worker...`).
   - `anchorExists` accepts both, so no change is needed.
   - If rendered GitHub navigation matters, the two disagree on em-dash headings only.

## Denominators

| Set | Files reviewed | Semantic rework |
|---|---|---|
| batch-001 | 1 | 0 (0%) |
| batch-002 | 5 | 0 (0%) |

Status: DONE
Summary: All six g01 files are ok under L12-30 and L12-31. Round-2 questions Q1 and Q2 are confirmed fixed, and all eight reading-map added edges are real and correctly parked. Three minor wording corrections (08018, the four runner anchor reasons, 08037) and two Lead questions are non-blocking.
