# A38 Step 8 closure review A, round 3 (bounded verification)

Verdict: **APPROVE** (bounded to the round-2 findings M-A, M-B, L-A, L-B, L-C; one new Low informational note, non-blocking)

Scope:

- Worktree: `/home/vantt/projects/forgentX-s8-review` at `27c2b2cde`, detached and read-only.
- Paths below are relative to `plans/260925-documentation-authority-unification/reports/phase-08/` unless stated otherwise.
- I made no git writes and ran no fgos CLI, no npm test or run-tests, and nothing under `.fgos` or secrets.
- I used `python3 -B` throughout. Scratch went only to `/tmp/fgos-work/review-A3/`.
- The worktree is unchanged apart from the pre-existing untracked `target-review/`.

## Reproduction

- I made a copy at `/tmp/fgos-work/review-A3/assemble-copy.py`. It differs from `step-07-assemble.py` in exactly the same three lines as in round 2:
  - `:22`: `HERE` is pinned to the worktree phase-08 directory;
  - `:249`: the scratch moves to `/tmp/fgos-work/review-A3/tmp`;
  - `:355`: the output-directory check is disabled.
- Command: `python3 -B assemble-copy.py --final --pin 5e03159334df726e43ffe9505ad4ed43f72ba94d --output-dir …/out{1,2}`. I ran it twice.
  - Both runs exited 0, in 7.5 s and 9.6 s.
  - Both runs produced the same stdout, sha256 `1a5a2796…`. That equals `step-07-final-determinism.json#stdoutSha256`.
  - stdout reports rows 55,658, patches 524, composed 423, parks 3,275, outputBytes 7,477,269.
- All five outputs from both runs are `cmp`-identical to the committed files:
  - matrix `1add06ac…`;
  - patch-order `8f09d079…`;
  - readiness `eb6e4ce7…`, the only output whose bytes changed, as expected;
  - composed `d50338a5…`;
  - report `2ce7f2ed…`.
- Every size and hash equals `step-07-final-determinism.json#outputs`.
- The script sha256 `13e66d59…` equals the recorded `scriptSha256`.
- All 7 `inputDigests` and `postCensusInputs` sha256 values match the committed bytes.

## Per-finding table

| r2 finding | Status | Evidence (locator) |
|---|---|---|
| **M-A**: L12-129 gate only in prose | **FIXED** | See the M-A detail below the table. |
| **M-B**: 518 changed-source records counted ready; L12-130 / post-pin specs ungated; no `beforeSha256` rule | **FIXED** | See the M-B detail below the table. |
| **L-A**: Pilot B rows 1/2/46 mislabelled | **FIXED** | See the L-A detail below the table. |
| **L-B**: stale digests on the five L12-130 rebinds | **FIXED** | See the L-B detail below the table. |
| **L-C**: post-pin census gap | **FIXED** (declared) | See the L-C detail below the table. |

**M-A detail**

- `step-08-preflip-gates.json#gates[8]` is `L12-129-archive-ref-and-checkout`.
  - Owner: "Lead / Phase 9 landing owner".
  - Its details are in `#archiveRefAndCheckout`: archive ref on origin, real merge, `historyRewrite:false`, the reader repoint/retire requirement including the six restored inputs, 139.96 s / 143.7 s / 3.67 s, "well under 60 s, measured BEFORE cutover Land", and "no current push, landing, cutover or deletion authority".
- The gate is projected into `step-07-readiness.json#preFlipGates`: 12 gates, each one JSON-equal to its gates-file entry.
- `phase-09-atomic-platform-authority-cutover.md:23-30` carries the same requirement.
- Sibling gates `final-code-holder-land-rehearsal` and `cutover-release-with-docs-lease` are also wired. The first has `dependsOn` both of the others.

**M-B detail**

- `#gates[9]` is `source-context-and-post-pin-recomposition`, with its details in `#sourceContextAndPostPinRecomposition`.
- The 518 `changedRecords` (10/30/478) are exactly the `outcome == no-prepared-hunks; current-source-context review gate` subset of the 588 in `step-08-source-recomposition.json`. I joined them on file, record, line and stage: 0 field mismatches, and every record is owned.
- `deferredOverlapSource` points to `step-08-l12-130-deferred-rebinds.json#records`. It holds 10/9/125 records, each with an `owner` and `gateId` equal to this gate.
- `observedChangedComposedSpecs` lists the 8 paths. For each one:
  - `beforeSha256` equals the pin blob;
  - `observedSha256` equals both `890715ead` and HEAD.
- Independent recheck at HEAD: exactly those 8 of 423 composed specs now differ from `beforeSha256`. The other 4 post-pin hits in patch-order are uncomposed or parked.
- `patchApplicationPrecondition` makes whole-file `beforeSha256` equality mandatory before every forward patch, and `expectedAfterSha256` before every rollback. It states that fuzz-zero alone is insufficient.
- `requiredCutoverPin` requires a new pin and a full re-enumeration.
- The field rename in readiness:
  - `readiness.rowReadinessCounts` now has `nonPreparedNonParkedRows: 51596` plus a `basis` that says it is not readiness;
  - the `readyRows` key is gone. Its only remaining occurrence is inside the `basis` string.
  - The rename is at `step-07-assemble.py:443`.
- `readyForCutover: false` and `noReadinessClaim: true` still hold.

**L-A detail**

- In `step-08-current-judgments.json`, indexes 1, 2 and 46 now have `currentDisposition: rejected-not-consumer`.
- Their owners `r37225`, `r37224` and `r36788` are all in `matrix.rejectedNotConsumerRows`.
- The counts are 18 preserved + 3 rejected + 2 prepared + 16 parked + 8 retiring = 47.
- No preserved row has a rejected owner.
- Scorecard `:18` matches.

**L-B detail**

- `#bindingRefresh` lists 5 rows. Both `changedBindings` and `pendingChangedSinceStep0` carry the new `targetUnitDigest` / `bindingSha256`.
- I recomputed each `bindingSha256` from the declared `bindingHashInput` and encoding (sorted-key compact JSON + LF): 5 of 5 match.
- Each `targetUnitDigest` equals the claim in its ledger file at HEAD. The ledger is unchanged between `890715ead` and HEAD.
- All 5 rows are still `reviewStatus: pending`.
- The other 186 `changedBindings` are byte-identical to `HEAD~1`, and no pre-existing gate changed.

**L-C detail**

- `#censusBoundary` reads `status: "pin-bounded; not current-runtime completeness"` and cites the `parse.v1.json` fixture observation.
- The Phase 9 doc (`:30`) restates that the census is pin-bounded.

## New defects

None blocking. The fix adds only:

- six new top-level keys plus four gates in `step-08-preflip-gates.json`;
- one assembler schema change (a key rename plus `basis`, and the report line);
- prose.

The six restored inputs total 20,966,166 bytes, as claimed.

### N-1 (Low, informational): the observed post-pin lists already miss one branch-own edit

- `test/scripts/doc-runner-liveness.test.mjs` was changed after the pin by `44ca64559`, a branch-own edit (+42/-5).
- It owns a Step 5 judgment record at `step-05-records/tests-judgment-batch7.jsonl:191`, whose `sourceSha256` equals the pin blob.
- The file is absent from all of the following:
  - the 518 `changedRecords`;
  - the L12-130 overlaps;
  - the composed-spec list;
  - `grep` over the gates, readiness and recomposition files (0 hits).
- I intersected the 135 post-pin changed non-plan files that have Step 3/4/5 records against the enumerated files. This is the only one missing.
- Why it is not blocking:
  - the gate's `requiredCutoverPin` and `requiredEvidence` already demand complete re-enumeration at a new pin, "including branch-own edits", and declare the listed sets "not future completeness";
  - the edit touches lines 18+, while the record's only trace is the line-10 `reportDir` literal, so the disposition is not affected.
- It is a concrete proof that the enumerated sets understate the real set, so the new-pin re-enumeration is load-bearing. The Phase 9 executor must not treat the 518 + 144 + 8 as the work list.

## Coverage

- Assembler: 2 independent scratch runs, byte-compared on 5 of 5 outputs plus stdout. Script and input digests checked.
- Gates: 12 of 12 compared between the gates file and the readiness projection. 518 of 518 joined to the source recomposition. 144 of 144 overlaps owned. 8 of 8 composed specs hash-verified at the pin, at `890715ead` and at HEAD. Full 423-spec drift scan at HEAD.
- Bindings: 5 of 5 hashes recomputed. 186 unchanged rows diffed against `HEAD~1`.
- Judgments: 47 of 47 dispositions, plus a rejected-owner cross-check.
- Post-pin census: 714 changed paths intersected with 2,626 record files.

Status: DONE
Summary: APPROVE. M-A, M-B, L-A, L-B and L-C are all fixed in committed bytes at 27c2b2cde, and the assembler reproduces all five outputs and stdout byte-identically in two scratch runs, matching step-07-final-determinism.json. One Low informational note (N-1): a branch-own post-pin edit to doc-runner-liveness.test.mjs is missing from the observed lists. The new-pin full re-enumeration gate already covers it.
