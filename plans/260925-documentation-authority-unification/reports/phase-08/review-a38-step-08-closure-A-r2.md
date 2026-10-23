# A38 Step 8 closure review A, round 2 (bounded re-review)

Verdict: **REWORK** (narrow; two Medium wiring gaps in the machine handoff, no false green in the closure-A findings themselves)

Scope: worktree `/home/vantt/projects/forgentX-s8-review` at `1eae797d8`. The plan-relative paths below are under `plans/260925-documentation-authority-unification/reports/phase-08/`. The review was read-only: no git write, no fgos CLI, no suite, no `.fgos`, no secrets. Scratch went only to `/tmp/fgos-work/review-A/`.

## Reproduction (item 2)

- `step-07-assemble.py` refuses any output directory other than its own: `step-07-assemble.py:355-356` raises when `output_dir.resolve() != HERE`. Because of that, I ran a copy at `/tmp/fgos-work/review-A/assemble-copy.py`. The copy differs from the original in exactly three lines:
  - `HERE` is pinned to the worktree directory (line 22);
  - the output-directory check is disabled (line 355);
  - the patch roundtrip scratch moves to `/tmp/fgos-work/review-A/tmp` (line 249).
- Command: `python3 -B assemble-copy.py --final --pin 5e03159334df726e43ffe9505ad4ed43f72ba94d --output-dir /tmp/fgos-work/review-A/out`.
  - It exits 0 in 9.6 s.
  - stdout: rows 55,658, patches 524, composed 423, parks 3,275, outputBytes 7,475,179.
- All five outputs are **byte-identical** to the committed files. Their sha256 values match `step-07-final-determinism.json`: matrix `1add06ac…`, patch-order `8f09d079…`, readiness `8ff20415…`, composed `d50338a5…`, report `f4e6ffc5…`.
- The script sha256 is `f7a8c91f…`, which matches the recorded `scriptSha256`. The worktree is unchanged; only the pre-existing untracked `target-review/` is present.
- Input confinement:
  - `STAGES` (`:25`) names only `step-03-records`, `step-04-records` and `step-05-records`.
  - `record_files` (`:55-58`) raises on any other directory.
  - `load_records` (`:61-71`) enforces 130/33/33 batch files.
  - No pilot directory can reach the loader, because it has no path argument. The guard is a belt-and-braces constant check, not a CLI-reachable refusal; that is acceptable.
  - `grep records-r[123]` finds 0 hits in every input and output JSON.
  - The `step-07-park-resolution-applied.json` `recordCatalog` lists only `step-05-records/*`.

## Per-finding status

| Closure-A finding | Status | Evidence (locator) |
|---|---|---|
| **H1**: Step 3/4 final dispositions missing; patch order built from pilot r3 | **FIXED** (composition/review moved to owned PRE-FLIP gates) | See the H1 detail below the table. |
| **H2**: untraced mint/doctor readers and post-census sites | **FIXED** (individually traced; behavioral parks owned; non-behavioral sites gated PRE-FLIP) | See the H2 detail below the table. |
| **M1**: 81 changed bindings without independent review at current digest | **OWNED PRE-FLIP GATE** | See the M1 detail below the table. |
| **M2**: 47 judgments not current at the pin | **FIXED** | See the M2 detail below the table. |
| **L1**: SC2 bounded to Step 5 writers | **FIXED** | The bound is now stated in SC2 at `step-08-phase-08-scorecard.md:48`: "MET ONLY FOR THE TRACED RECORD POPULATION"; 52 writer rows, 0 violations; all 43 post-census writer hints individually triaged. Alias check: `step-07-assemble.py:363-366,373-374`. |
| **L2**: records hygiene (pending rows; reviewed-but-pending Step 0 rows) | **ACKNOWLEDGED/OWNED** | `allPendingRows = 2627` is counted in gate details. `step-08-phase-08-scorecard.md:17` allows explicit reuse of digest-identical reviews. Nothing is claimed as reviewed. |
| Review A's "33 changed + 1 missing" prose | **Doer's correction is right** | I replayed all 1,037 Step 3 records at both `373695db0` and `5e0315933`: 32 changed-present plus 1 missing (`docs/platform/session-identity/spec.md`), 33 in total. My earlier "33 + 1" was an off-by-one in prose. `step-08-source-recomposition.json#counts.reviewCountReconciliation` is accurate. |

**H1 detail**

- The matrix now carries every final Step 3/4 edge.
  - Step 3: 2,518 parked + 577 prepared + 4,842 preserved = **7,937**, equal to the raw final edges (2,265 parked + 596 patch + 234 row-flip + 4,804 preserve + 38 retiring).
  - Step 4: 217 + 64 + 609 = **890** slots, equal to the raw final slots (45 + 59 + 177 + 609).
  - Source: matrix `counts.byStage`; assembler `:114-142`.
- Spot joins:
  - `maps-j-04238/04242/04245/04247` are parked (`f03574..f03583`, `step-03-records/batch-070.jsonl:21`).
  - `maps-j-04403..04406` are prepared in a composed file spec (`batch-073.jsonl:3`).
  - `maps-j-08150/08169/08170` and `07977/07997` are parked, matching the final records.
  - `docs/specs/runner.md` has no spec (retiring).
  - `docs/platform/README.md` is parked as `exact-generator-render-or-row-action-not-composed`.
  - `io-contract.md` and `component-boundary.md` are composed-at-pin.
- The retiring-tree demotion (`:283-288`) affects one file and demotes **zero** prepared rows (probe).
- Every one of the 3,275 parks has an owner and a resolvable `remainingBlockerRef`.
- Gates `composition-independent-review` and `step3-step4-preserve-premise-review` are in `step-08-preflip-gates.json#gates` and in `step-07-readiness.json#preFlipGates`.
- Scorecard locators: `step-08-phase-08-scorecard.md:20-21,25,55-59`.
- Source drift: see new defect M-B.

**H2 detail**

- The 79 + 1,158 sites are all joined: 425 grade-record links and 812 gated (`step-08-post-census-join.json#sites`).
- Role reconciliation matches my original counts exactly:
  - literal: 21 reader and 2 default-root, all graded;
  - dynamic: 181 reader, 172 default-root and 43 writer, all graded.
- Named readers and their parks:
  - `mint.rs`: `pc-l-0067/68/71/72`, `pc-d-0992/0994-0996` parked; owner "Identity mint / document-floor owner".
  - `identity-checks.mjs`: `pc-l-0073-75`, `pc-d-1087-1092` parked; owner "Identity / setup-doctor registry owner".
  - `ak-cook-worker-contract.md` and `case-and-doors.md` are parked at the core source plus both renders.
  - `legacy_import.rs` is preserved with an owner.
- Locators: `step-08-post-census-records.jsonl`; `step-07-assemble.py:184-198`; scorecard `:22,:34`.
- Gate `non-behavioral-census-join` (1,126 ids) is present.
- The 1,126 is 812 gated plus 314 REJECT grade sites, so 314 sites are listed twice by design. I sampled 10 REJECT custodies: all are plausible non-document uses.

**M1 detail**

- My recompute walks every ledger/pilot claim by `claimId`:
  - 13,010 claims;
  - 173 changed from `f76861638` to the pin, **all 173 in `changedBindings`**;
  - the 5 L12-130 post-pin rebinds are also in the gate;
  - 0 changed rows are `reviewed`.
- Locators: `step-08-preflip-gates.json#gates[changed-binding-independent-review]` (count 191); scorecard `:17,:79`.

**M2 detail**

- `step-08-current-judgments.json` gives 47/47 rows, each with `owners[]` (matrix rowId, stage, parkRef or patchSpecId) or retirement records.
  - Every parked owner rowId is in `readiness.parkOwners`.
  - Rows 3–5 are retire-with-tree.
  - Rows 16/17 are parked.
  - Row 20 is prepared under its composed spec.
  - The 10 changed rows are flagged `sourceFileChangedSinceStep1`.
- Scorecard locator: `:18`.
- One labelling nit: see L-A.

## New defects

### M-A: The L12-128/L12-129 gate exists only in scorecard prose, not in the machine handoff (Medium)

- **Locator:**
  - `step-08-phase-08-scorecard.md:77` says "`step-07-readiness.json:preFlipGates` points to the complete id/owner/digest/site lists".
  - `:88-90` (items 10 and 11) and `:358` call L12-129 a "Phase 9 PRE-FLIP gate".
- **Evidence:**
  - `grep -c 'L12-129\|archive ref\|L12-128\|<60'` returns **0** in `step-07-readiness.json`, `step-08-preflip-gates.json` and `step-07-final-obligations.json`.
  - `preFlipGates` holds 8 gates (changed-binding, L12-96, non-behavioral census, dropped claims, git one-door, retention, preserve-premise, composition review). None of them is the archive-ref move, the reader repoint/retire, or the measured <60 s candidate checkout.
- **Wording check:** the scorecard text of item 11 matches the owner decision `owner-answers.md:2709-2717` with no drift:
  - archive ref on origin;
  - small manifest landed by a real merge;
  - no history rewrite;
  - repoint/retire readers in the same change;
  - measure a candidate well under 60 s before the cutover Land;
  - no deletion or landing authorized now.
- **Failure scenario:** Phase 9 drives its PRE-FLIP checklist from `readiness.preFlipGates`, which is the artifact the scorecard calls complete. It then executes the cutover Land with ~2.9 GB of plan records on main's tip. Per L12-129's own measurement, that pushes every worktree and Land on every machine past the Git driver's 120 s deadline.
- **Fix:**
  - Add an `L12-129-archive-ref-and-checkout` gate to `step-08-preflip-gates.json#gates`, with owner (Lead / Phase 9 landing owner), blocker wording copied from L12-129 and the 139.96 s / <60 s measurement refs.
  - Regenerate with the assembler (readiness picks it up via `:408-436`).
  - Refresh `step-07-final-determinism.json`.

### M-B: Source drift is not wired into readiness; changed-source preserves and parks count as "ready" (Medium)

- **Locators:**
  - `step-08-source-recomposition.json#changedRecords` has **518** records (Step 3: 10, Step 4: 30, Step 5: 478) with outcome `no-prepared-hunks; current-source-context review gate`. Each record carries its own owner/blocker.
  - That "gate" id appears **nowhere** in `step-08-preflip-gates.json` or `step-07-readiness.json`. `grep current-source-context` and `grep source-recomposition` both return 0.
  - `readiness.rowReadinessCounts.readyRows = 51,596` is computed at `step-07-assemble.py:443` as everything not prepared or parked. It therefore includes the preserved rows of these changed-source records.
  - `patch-order.sourceRecompositionChecks` (`:293-294`) covers only files with prepared rows: 39 entries.
- **Post-pin drift, also absent from readiness:**
  - (a) `step-08-l12-130-deferred-rebinds.json` lists 10 Step 3, 9 Step 4 and 125 Step 5 overlaps from the two main imports. `owner-answers.md` L12-130 calls them "L12-124 Phase 9 PRE-FLIP recomposition". The scorecard only says "Exact overlaps defer under L12-124" (`:358`), with no link and no readiness gate.
  - (b) Branch-own post-pin edits are not covered by that list. Example: `docs/platform/git/spec.md` changed `5e0315933..HEAD` (L12-126 Land text). Its spec `file:docs/platform/git/spec.md` is **composed-at-pin** from `step-03-records/batch-101.jsonl:1`, yet it is absent from the L12-130 deferred list.
  - In total, **8 composed-at-pin specs** have sources changed after the pin: `apps/fgos-gateway/Cargo.toml`, `apps/fgos-gateway/src/mcp.rs`, `docs/platform/component-boundary.md`, `docs/platform/git/spec.md`, `src/cli/command-registry.mjs`, `src/setup/registrations.mjs`, `test/runner/dispatch-executor-profile.test.mjs`, `test/runner/worktree.test.mjs`.
- **Failure scenario:** a Phase 9 executor treats `readyRows` as no-action. The preserve/park judgments for 518 records were made against source text that has since changed. A changed passage that now names a retiring path is carried as "preserved" with no gate in the machine handoff.
- **Not a false green on executable patches.** Each composed spec carries `beforeSha256`, and a pin-mismatched source would fail an executor that checks it. But `patch --fuzz=0` with offsets can still apply to a drifted file unless the executor checks `beforeSha256`. The handoff never states that check as mandatory.
- **Fix:** add one PRE-FLIP gate, `source-context-and-post-pin-recomposition`, owned by the Documentation source-binding reviewer / Lead. Its details join:
  - the 518 changedRecords;
  - the L12-130 deferred-rebinds;
  - every patch spec whose source changed between the pin and the Phase 9 cutover pin, with a mandatory `beforeSha256` equality precondition before any patch applies.
  - Exclude those rows from `readyRows`, or rename the field. Regenerate.

### L-A: Three Pilot B judgments are labelled preserved while their owning rows are rejected-not-consumer (Low)

- `step-08-current-judgments.json` rows 1, 2 and 46 (`test/scripts/check-doc-conservation.test.mjs` ×2, `check-decision-citation-drift.test.mjs`) have `currentDisposition: preserved-history/fixture`. Their `owners[]` rows `r37225`, `r37224` and `r36788` are in `rejectedNotConsumerRows`.
- The true split is 18 preserved + 3 rejected, not 21 preserved. The scorecard repeats 21 at `:18`.
- No readiness impact.

### L-B: Gate digests for the five L12-130 rebinds are stale (Low)

- `changedBindings` is pinned at `5e0315933`. The five L12-130 rebinds changed `targetUnitDigest` after that, so the gate's `bindingSha256` and `targetUnitDigest` for them are not "exact current".
- The reviewer must use HEAD digests. Note it in the gate, or regenerate at the new pin.

### L-C: Post-pin census gap (Low, informational)

- Code imported after the pin adds legacy-root string literals only in a fixture: `packages/yaml-doc/contracts/fixtures/parse.v1.json` (`docs/specs/work-state.md`, `docs/contracts/fgos-gateway-api-v1.yaml`).
- I found no new behavioral readers by lexical scan of the added lines in 263 changed non-plan files.
- These are not in the post-census join, which was inventoried at `244a04354` and rebound at the pin. Phase 9's post-flip literal search will catch them, but the pre-flip census is pin-bounded and should say so.

### Outside my list (noted only)

- `step-08-phase-08-scorecard.md:92-98` says "Suite slot remains BLOCKED … attribution blocked".
- `:366-368` (L12-131) says "No branch-caused failure" for the same `e1966d417` run.
- The Lead should reconcile which of the two is current. I did not review this.

## Coverage

- Assembler: full read of `step-07-assemble.py` (484 lines); 1 full independent final-pin run, byte-compared on 5 of 5 outputs.
- Matrix/raw conservation: 7,937 Step 3 edges and 890 Step 4 slots.
- Spot joins: 13 named edge ids and 6 named files.
- Retiring demotion probe across all 3 stages.
- Post-census: 1,237 of 1,237 sites routed; 40 named-reader references read; 10 REJECT samples.
- Bindings: 13,010 claims compared at 3 revisions; 173 + 5 changed rows covered by the gate.
- Judgments: 47 of 47 owner joins.
- Step 3 drift: replayed at 2 pins (1,037 records each).
- Post-pin: 294 changed paths intersected with 524 specs (12 hits, 8 composed); 263 code files lexically scanned.

Status: DONE_WITH_CONCERNS
Summary: REWORK, narrow. The five closure-A findings are fixed or are explicit owned PRE-FLIP gates, and the assembler reproduces all five committed outputs byte-for-byte from final records only. The machine readiness, however, lacks the L12-129 archive/checkout gate (scorecard prose only) and has no gate for 518 changed-source records plus the post-pin drift (L12-130 overlaps, 8 stale composed specs), while still counting those records as "ready".
