# A38 review: Step 5 bounded part 03 (23 entries)

- Reviewer: `reviewer:sonnet-session:p7s5-r3@2026-10-17`
- Author session: `codex-session:fgos-run_unit-run-17922161b19023@2026-10-17`
- Reviewed commit: `5334499c1` (read-only worktree `/home/vantt/projects/forgentX-s8-review`, detached)
- Pin check: PASS (every `pins` and `parts` entry in `review-input-step-05-01/index.json` matches sha256 and byte length; part-03 sha256 `e5bc747acdc9...b21bd7`; part limits <=60 entries/400 KB hold; frame id list sorted, unique, count 22454, `sortedIdsSha256` matches)
- `git diff --check` clean
- Review mode: ordinary

## Totals

| Population | Entries | Deep-read | Mechanical only | ok | rework | Substantive rework rate |
|---|---|---|---|---|---|---|
| A34 preservation bindings (X-A34-12..28) | 17 | 17 | 0 | 17 | 0 | 0/17 = 0% (<=3%, no full-read expansion needed for this part) |
| Control proofs | 6 | 6 | 0 | 6 | 0 | 0/6 |
| Total | 23 | 23 | 0 | 23 | 0 | 0 |

## Mechanical checks run on all 17 A34 rows

For each row I recomputed from bytes (script in my scratchpad, no repo write):
- `decisionSha256`, `residualFileSha256` (== `residualFileB0Sha256`, `residualBytesUnchanged`), `currentSourceFileSha256`, `currentTargetFileSha256` against files on disk: all equal; no `srcSha/tgtSha/residualSha/decisionSha` mismatch.
- `reviewStatusAtDecision == reviewed`, and the decision shard contains the row's `claimId`.
- `sha256(verbatimPayload) == residualPayloadSha256` and the payload string is byte-equal to an actual string in the named residual file (`payloadHashVerified: true` confirmed independently): 17/17. Locations: 12 `rows[9|10]/restored[0]/shownText`, 13 `rows[11]/restored[0]/shownText`, 14 `rows[0]/untransferredRemainder/shownText`, 15-16 `rows[0|1]/residualText`, 17 `entries[3]/residualText`, 18-26 `rows[0..8]/residualText`, 27-28 `entries[0|1]/residualText`. (X-A34-12 payload also appears at `rows[9]`; the claimId record is `rows[10]`. Duplicate text, not a defect.)
- Code-evidence pointers in rows 12 and 13 (`packages/host-runtime/rust/src/invocation_service.rs:161-209`, `package.json:27-35`, `operation_provider_router.rs:74-119`, `registry.rs:41-69`): files exist and line ranges are within file length.
- `legacySuccessorRehomeOwed`: True on X-A34-17..28 (12 rows in this part; targets `docs/specs/observe.md`, `docs/specs/runner.md`, both retiring legacy files); False on 12-16 (targets are new `docs/platform/**` owners). Across all three parts exactly 13 rows are True (X-A34-01 plus 17..28), matching acceptance concern 4 ("thirteen retiring-legacy successors"). The old count "12" was not reopened.
- Drift flags: rows 12-14, 17 have source/target equal to B0. Rows 15-16 have source (`docs/specs/runner.md`) drifted from B0; rows 18-28 have both source and target (`docs/specs/runner.md`) drifted from B0. Flags are honest: `docs/specs/runner.md` was edited by main commits (`9b9f13d64`, `f44512393`, `9a5cc2df7`), and for rows 18-28 the payload lines are no longer present in current `runner.md` (checked by line search: only X-A34-21 and X-A34-17 still match). This is exactly the declared state: "No new A34 acceptance ... Step 9 rebind if affected; Phase 9 activation remains blocked". The bytes survive verbatim in the residual JSON, which is what a representation binding must prove.

## Per-entry verdicts

| Entry | Verdict | Note | Evidence |
|---|---|---|---|
| PRES-X-A34-12 | ok | deep | node-to-rust-migration step list 1-10 and "Sequence it internally" verbatim at `host-invocation-partial-carry-residual.json rows[10]`; "Checked status" says manual guidance, no new automation; code pointers exist; no promotion claim |
| PRES-X-A34-13 | ok | deep | rollback bullets verbatim, same residual file `rows[11]`; evidence paths exist |
| PRES-X-A34-14 | ok | deep | 18-row historical-decisions table; 17 of 18 lines still present in target `runtime-identity-and-activation.md`, 18 of 18 in legacy source; owner/status honest; no code claim |
| PRES-X-A34-15 | ok | deep | RUL77 text (8564 chars) verbatim in `step9-l9-9-partial-carry-residual.json rows[0]`; source drift flag true and disclosed; text not in current runner.md (drifted), rebind owed at Step 9 |
| PRES-X-A34-16 | ok | deep | RUL79/probe-account text verbatim `rows[1]`; same drift note |
| PRES-X-A34-17 | ok | deep | one Vietnamese bullet (store lock + writer shard) present in both `docs/specs/observe.md` and the residual; rehome owed True (target is retiring legacy) |
| PRES-X-A34-18 | ok | deep | "Architecture advisory - current boundary" residual verbatim; rehome owed; source drift disclosed |
| PRES-X-A34-19 | ok | deep | "blind" role residual verbatim; text still names confinement-authority 9.2 (reason codes exist in src) |
| PRES-X-A34-20 | ok | deep | item 6 "removed entirely" list verbatim; preserved as predecessor text, not activated |
| PRES-X-A34-21 | ok | deep | human gate item verbatim; still present in current runner.md |
| PRES-X-A34-22 | ok | deep | single bullet verbatim; drifted from current runner.md, disclosed |
| PRES-X-A34-23 | ok | deep | fault classifier residual verbatim |
| PRES-X-A34-24 | ok | deep | trust-table row residual verbatim |
| PRES-X-A34-25 | ok | deep | work-layer move list verbatim |
| PRES-X-A34-26 | ok | deep | RUL90 residual verbatim |
| PRES-X-A34-27 | ok | deep | main-checkout lock "Blocked when/Side effects" verbatim (`step10-sync2300-predecessor-residuals.json entries[0]`) |
| PRES-X-A34-28 | ok | deep | `main-checkout-lock.mjs` bullet verbatim (`entries[1]`); file still exists in `src/runner/` |
| CONTROL-MERGE | ok | deep | `cross-area-inventory.json` sha matches; `totalRows` 108 = 98 historical B0 rows + 10 supplement rows (`mainImportSupplement.addedRows`: X-MAIN-01..03, X-LOCK-01..07, all present in `rows`); `countsByKind`: main-import-document 3 + main-import-cross-area 7; scope text says all eight identity paths wait for Step 9 |
| CONTROL-G | ok | deep | `step-05-g-current.json` sha matches; both prior registries and working registry hashes recomputed and equal to the recorded values (`7b03...b053b60` for identity-registry and working-identity-registry, `7e08...b34730` for phase-02); claimIdNotConserved 0 on both priors, decisionSelfReview 0, 9667 rows/133 shards; `bindingScope` honestly says no native carry/close. I did not re-run the validators (instructed not to run heavy jobs) |
| PARK-PROTECTED-01 | ok (park remains correct, visibly false) | deep | `git rev-parse 21555f026:docs/specs/reading-map.md` = `f4f36b52...`, main-parent (`21555f026^2`) = `b306e3a3...`, plan-branch parent (`^1`) = `2851a42e...`: raw equality with main-parent is false. `git diff 21555f026^2 21555f026` shows +10/-2 lines: the plan branch's own Phase 00/01 edits (transition-rule banner `Quy tac chuyen tiep hien hanh` lines 1-8 and two reference line rewrites) retained on top of main's holder-lock additions, whose edits are also present (`^1` to merge diff is +3/-1). Branch commits `2b2ee26d1`, `eeb784c19`, `a725d4788` own those edits. Provenance explains the inequality; nothing waived, nothing repaired, `allMechanicalProofsGreen:false` stays honest |
| CONTROL-CHECKS | ok | deep | A recomputed: `git log --first-parent --no-merges --name-only 6f0f39ca..HEAD` vs `allowed-paths.json`: 0 bad paths. B recomputed: all five extractor blobs equal expected hashes via `git hash-object`. H, C, I, bounded G scope: recorded results read and internally consistent (H 611 files, 0 findings; C changedAreaStatuses empty; I equalToHEAD true with mainImportedDelta of three main specs); not re-run (H/C/I need the checker scripts, out of scope for light verification) |
| CONTROL-EDITS | ok | deep | `git diff --name-only 21555f026 5334499c1` outside `plans/`: exactly `docs/platform/component-boundary.md` and `docs/platform/system-architecture/architecture/architecture-intent.md`; their current sha256 (`65c27c78...`, `82b51061...`) both appear in `post-review-edits.md` Step 5 table; no code/script/contract file touched |
| CONTROL-FRAME | ok with note | deep | Statement (22457 units minus exactly three = 22454, no seed in author output) verified against the Lead's compact `step-05-remainder-frame.json`: extractor recomputation gives 22457 total, 22454 after exclusions. Note: this entry's pinned `path` (`step-05-remainder-frame/index.json`, sha `4ae2e89c...`) no longer exists in the tree, because the Lead replaced the multi-part frame with the compact file (Lead edit L11-16). The entry is stale by that edit, not an author defect |

## Findings and stops

- No rework. No stop. No implementation repair attempted.
- Observation for the rollup (not a defect): CONTROL-FRAME's path pin is stale after the Lead's frame replacement; the Lead may want to repoint it.
- Implementation gaps: none in this part (bindings carry old predecessor text; none claimed current).

Status: DONE
