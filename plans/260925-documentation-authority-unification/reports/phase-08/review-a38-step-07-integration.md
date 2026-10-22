# Step 7 integration review (A38): final-pin consumer handoff

- Worktree `/home/vantt/projects/forgentX-s8-review` at `3f2c39de9ec12eae4f8bc1497d33a1700a9abb69` (confirmed). Assembly pin `244a0435466a46e56cd95b4a70bfe03f54670996`. Everything between the pin and HEAD is records only (18 report files).
- Method: read-only. I ran every script on a `git clone --shared` scratch copy under `scratchpad/s7-review/repo`. Nothing was written to the worktree, no git write was made there, no fgOS CLI was run, and `.fgos/`, secrets and the test suite were not touched.

## Verdict: **rework**

The rework is small. Seven preserve flips are wrong (F1). Everything else holds: conservation, determinism, the remaining parks, the readiness truth and the export read-only claim.

## Findings (ranked)

### F1: High. Seven members are marked preserve, but their values change under the effective move set.

**Cause.** Two legacy duplicate files exist at the pin, and both are physically retired by the move set:

- `docs/how-to/check-rollup-progress.md` is mapped to `docs/knowledge/how-to-check-a-root-item-s-progress-with-fgos-rollup/check-rollup-progress.md`.
- `docs/explanation/work-item-lifecycle-and-domain-model.md` is mapped to `docs/knowledge/why-the-work-item-lifecycle-keeps-status-and-stage-separate/work-item-lifecycle-and-domain-model.md`.

Both destinations already exist. These two are the only physically moving files under the quadrant directories.

**Effect.** `enumerateDocEntries` (`src/report/enduser-index-generate.mjs:89`) scans `docs/how-to` and `docs/explanation`. After the cutover, regenerating the manifest drops both entries.

**Why the proof missed it.** The v2 proof's enduser scan only covered the current tree (`step-07-export-v2-proof.json#/scan`: "Current scan only"). Its own `outcomeDeltas` (`/outcomes/0`, `/outcomes/29`) already flag exactly these two files, and that evidence was used to park the outcome members. It was not applied to the enduser members.

**Wrong preserves in family `gen-enduser-index`** (`docs/enduser-docs-index.json`): these entries disappear on regeneration.
- `r03739` / `reference-001785`: L3569, `docPath`
- `r03718` / `reference-001764`: L3573, alias inside the same entry
- `r03900` / `reference-001946`: L1057, `docPath`
- `r03806` / `reference-001852`: L1061, alias inside the same entry

The aliases in the surviving `docs/knowledge` entries (`r03719` L3869 and `r03809` L3464) are correctly preserved.

**Wrong preserves in family `r26:docs/enduser-docs-index.json`** (`test/report/enduser-index.test.mjs`):
- `r26116` and `r26215`: L162, the `find(e => e.docPath === 'docs/how-to/check-rollup-progress.md')` lookup.
- `r26201` / `reference-004330`: L167, `assert.equal(demo.docPath, …)`.

The records' own reasons say "requires the seeded real rollup demo at its old how-to path … co-cut REAL_DEMO_DOC_PATH". Patch spec `r26:test/report/enduser-index.test.mjs` (rows `r26155`, `r26183`) moves L385/386 to the knowledge path, so this one file would end up half-patched and the test would go red after cutover. The family's witness (L12-96 handling list) keeps the manifest *path* only: "its content regeneration remains family 2's separate obligation".

**Correction:**
1. Re-evaluate these 7 rows to individually parked, or to patch as a co-cut with `test/report/helpers/docs-index-state-fixture.mjs` `REAL_DEMO_DOC_PATH` and the L385/386 hunk.
2. Name the blocker: "legacy duplicate physically retires; regenerated manifest drops entry". Owner: Enduser-index / doc-sources reader owner.
3. Recount. If parked: preserve 9,643, parked 187, flips 2,124 (= 2,117 preserve + 7 patch); `gen-enduser-index` becomes 489 preserve / 17 parked; `r26:docs/enduser-docs-index.json` becomes 33 / 3.
4. Add a candidate-tree `enumerateDocEntries` simulation to the proof harness. It already has `withTree` and `candidate`.

### F2: Medium. The committed assembler is no longer the replay door.

`step-07-assemble.py --final --pin 244a0435… --output-dir …` exits 1 with `ValueError: final evidence is not bound to this pin` (`step-07-assemble.py:459`).

The only way to reproduce the outputs is an adapter stored as a string in `step-07-export-v2-replay.json#assemblyAdapter`. That adapter:
- monkeypatches `final_resolution` and `final_obligations`;
- rewrites `step-07-final-obligations.json`;
- patches the report with `str.replace`, and each call silently does nothing if its source text drifts.

It does reproduce byte-for-byte (see Determinism), but that leaves two doors and an unchecked text rewrite (L10/RUL104).

**Correction:** fold the v1+v2 overlay consumption into `step-07-assemble.py`, so a single committed command reproduces the outputs. At minimum, assert that every `text.replace` matched once.

### F3: Low. The alias-writer check passes trivially.

`alias-table.json` has `entries: []`, so "0 alias writer violations" is true by construction.

I checked the property independently against the effective move set (old paths that will become aliases), and it holds:
- 51 writer rows (27 rejected, 24 preserved). None writes to a moving or retiring path.
- 87 prepared rows carry a target. 86 targets exist or are move destinations. The remaining one, `r26:…batch4` `reference-004380`, is an existing directory under `docs/platform/agent-coordination/verification/…`.
- Current routing: `AGENTS.md` and `CLAUDE.md` are identical to main `9c7edde30`.

**Correction:** make the assembler test writer destinations against the effective move set's `oldPath`s, not the adopted alias table, which is empty.

### F4: Low. One catch-all owner holds 161 of the 180 parks.

161 parks are owned by "Lead/documentation integration owner" and carry family-level blocker tokens. Example: `13-verbatim-claim-passages-and-live-holder-carriage-not-yet-composed`, prefixed per member with `family:id@file`.

The blockers are specific and none is an export gap, so this is not a "generic" violation. But L12-96 and the obligations name narrower owners: for example, the component-boundary owner for `readset-post-retirement-scan` / P7-DOC-GAP-05, and the RULE/holder owners for families 13 and 17. This is a Lead question, not a block.

### F5: Info. Decision-index parity is bounded.

Parity holds only together with the committed index (the state-wins union). Building from the export alone gives sha `d7aa9466…`, 33,397 bytes, against the committed 34,411 bytes. That proves the output stays stable; it does not prove that state alone produces it. Preserve verdicts are unaffected.

41 of the 78 members are free-text mentions of paths that physically retire: `docs/specs/{runner,work-state,platform-foundations,system-overview,seat-binding}.md`, `docs/architecture-map.md`, and `docs/architect/proposals/visibility-…`. They will dangle after cutover. That is consistent with Q2, but the L12-89 replacement guards must allow it in Phase 9.

### F6: Info. Two small gaps in the records.

- The v2 export records `fgosDir`, but not the `codeRoot` commit whose `listWork`/`computeDecisionIndex` produced it.
- The two external locator parks (`step-05-records/runtime-external-parks.jsonl`, 2 entries) sit outside the 46,404-row census and the matrix `recordCatalog`. They are joined separately in `step-07-park-resolution-applied.json#externalLocatorReevaluations`, each with a blocker and an owner. That is acceptable, but the report should state it.

## Conservation (independent rejoin from `step-05-records/*.jsonl`)

| Check | Result |
|---|---|
| Census rows (references + dynamicTraces + authorAddedReferences) | 46,404; 0 duplicate keys |
| Records ↔ matrix join | 0 rows missing from either side; every row's class matches my independent rule + overlay (0 disagreements) |
| Classes | applied-safe 0 · prepared 383 (376 + 7) · preserved 9,650 (7,526 + 2,124) · parked 180 · rejected-not-consumer 36,191 |
| Rejected custody | every REJECT row is `preserve`; 0 null or unknown custody ids |
| Park members | 2,311 = every base `parked` row; each in exactly one of 23 families; old disposition is `parked` for all; file/record/line keys verified |
| Flips | 2,131 = 2,124 preserve + 7 patch; 180 parked; per-family table matches the report exactly |
| Evidence / blockers | 0 members without an evidence pointer; all 180 parks have a blocker and an owner (34 distinct blocker texts) |

## Determinism

- I recreated the adapter from `step-07-export-v2-replay.json` (assembler sha `d25438ec…` matches) and ran it twice in the scratch clone at HEAD.
- Both runs exited 0 with identical stdout.
- All six files it writes are byte-identical to the committed ones (`git status` clean): matrix `64aae4ee…`, patch-order `5eefed29…`, readiness `25611c42…`, report `a50aff5e…`, obligations `83dc7b76…`, prepared-specs.
- The hashes match `step-07-final-determinism.json`.
- The bare assembler fails (F2).

## Park-flip sample results

- **Every member, mechanically.** I checked all 2,311 member operands against the effective move set and the files present at the pin. 68 preserves have a literal operand that moves or retires. I reviewed all 68:
  - 41 decision-index free-text mentions: correct (F5).
  - 6 doc-registry aliases / sourceCaptureIds of the two duplicates, plus 4 `purposeTitle` free-text mentions: correct; values come from state and stay unchanged (registry JSON/MD hashes are equal before and after).
  - 4 directory operands (`docs/how-to`, `docs/explanation/`): correct, because the directories survive.
  - 2 surviving knowledge-entry aliases: correct.
  - **4 enduser entries, plus 3 test rows found by manual review: wrong (F1).**
- **gen-decision-index, all 78:** preserve is correct. Parity reproduced (next section).
- **Random 20 from `gen-doc-registry`:** every operand equals the export value its pointer resolves to (20/20).
- **Random 20 from `gen-enduser-index`:** 18/20 match. The other two are parked unregistered slots, which is correct.
- **Manual stratified sample (~34) across `state-registry-export`, `state-work-docsref`, `state-inventory-oldpath`, `state-outcome`, `r29`, architecture manifest and `gateway-ctr010`:** reasons are sound.
  - The r29 operands are historical: the pin's `merge.mjs` has 0 `docs/decisions`/`DECISION_INDEX_PATH` hits, and `63b777873` is an ancestor.
  - The 7 patches target existing files. The gateway YAML copy is byte-identical, and `#business-rules` exists.
- **Independent export checks:** 648 docsRef values / joined / descendant paths are never moved; 44 refs across 32 items intersect retiring paths (matching the 3 parks); inventory currentPaths are never moved; 0 contentRoot values.

## Remaining parks (sample of 40, plus a keyword scan of all 180)

- All 40 sampled blockers are real and specific.
- None is an export gap that v2 already answers. The 4 rows whose text mentions "exported" are reader-composition or changed-binding work.
- The 13 `gen-enduser-index` scan parks are genuine unregistered-slot or final-scan work. The F1 rows belong with them.

## Readiness truth check

- `readyForCutover: false` and `noReadinessClaim: true`. 19 obligations are blocked; there is no false green.
- **Lease:** status "delivered-reviewed-rehearsed", with a blocker that names Phase 9 landing, Git-owner §7 consent, the holder-lock notification and the integrated ref proof. The final review is noted as predating O1.
- **Plan A phase 06:** `a004bb598` is an ancestor of main `9c7edde30`, and the plan is completed.
- **Plan B (convention) phase 06:** `461e12d12` is an ancestor of main, and the plan is archived `status: completed`.
- **Plan C** (`plans/261006-1445-fgctl-dev-activation`) is `pending` / Draft, and plan.md §7.5 says it is not a dependency. The brief's premise ("Plan B draft") is wrong, and the report's correction is right.
- **P7-DOC-GAP-05:** blocked. **P7-DOC-GAP-06:** prepared, not applied.
- **Step 5 carries:** 12 blocked, 2 prepared, 2 resolved-in-records.
- The required Git-fixture test files are listed as unrun, not waived.

## v2 export and decision-index parity

- The `.mjs` imports only `listWork` (→ `currentEffectiveView` → `rebuildViewFromDir` + `readClaims`, both read-only) and `computeDecisionIndex`, which reads only and never calls `generateDecisionIndex`.
- It reads `inventory-data.json` from the repo. Its only write is the `out` file.
- **Parity reproduced without `.fgos`:** `buildDecisionIndexMarkdown(exportV2.decisions, committed index)` gives `082c2741b963b714…`, equal to the committed index. Whether the export faithfully reflects live state is not independently reproducible without state access.

## Questions for the Lead

1. For F1, should the 7 rows be parked, or patched as a co-cut with `REAL_DEMO_DOC_PATH` and the L385/386 hunk?
2. Should the overlay be folded into `step-07-assemble.py` now (F2), or carried as a known two-door replay until the closure review?
3. Should the 161 parks under "Lead/documentation integration owner" be split by the holder owners L12-96 names (F4)?

Status: DONE
Summary: Rework. 7 preserve flips are wrong (4 enduser-index entries, 3 enduser test assertions) because two legacy duplicate docs physically retire. Conservation (46,404 / 2,311), byte-identical determinism through the replay adapter, the remaining-park blockers, readiness truth and the export's read-only claim all check out.
