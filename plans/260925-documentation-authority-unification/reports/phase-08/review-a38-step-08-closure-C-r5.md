# Step 8 closure review C, round 5: narrow verification of L12-135

- Worktree `/home/vantt/projects/forgentX-s8-review`, detached at `7c07af625`. I checked committed bytes only.
- Constraints held: no git write, no fgOS CLI, no npm test or run-tests, no `.fgos` or secret reads. Python ran under `-B`.
- Scratch is `/tmp/fgos-work/review-C5/`:
  - `resolve.py` is the locator resolver.
  - `root/` is a symlink farm for the assembler run. The script and the 5 outputs are real copies there. Git reads go through `GIT_DIR=<worktree git dir>`.
  - `audit-report-copy.py` is the r4 replay copy with only the scratch path changed. `audit.out` holds its result.
- `git status --short` is unchanged afterwards: it shows only the pre-existing untracked `target-review/`.

## Verdict: **REWORK** (minimal, records-only: 6 stale fields, no rescan needed)

All five requested checks pass. But L12-135 says it applied "C's exact list", and it did not apply two of my r4 fix bullets: "correct the `constructedNames` and `ambiguousNameResolution` text" and "update the counts". So the authoritative manifest's own header still contradicts its inventory and the L12-129 gate. The audit record that the manifest cites as `recipeAndTriage` also still makes a claim that two manifest rows now refute. Fixing this is a mechanical edit plus one re-hash. It needs no re-review of the scan.

## Per-item table

| # | Item | Result | Evidence |
|---|---|---|---|
| 1 | 12 rows + 2 `step9-native-E` siblings: locator, kind, liveness, reason | **Pass** | Removed rows: 279. 48 have dict `scriptRefs` and 231 have none. No row has both a reader and the "no direct/constructed-name … reader" reason, and every ref is `liveness: historical-replay`. All 14 targeted rows resolve to the claimed line:<br>• `runner-final-D-{both,identity,phase02}` resolves to `runner-final-verification.json#/reproduction/checkHelper` line 7: the `read(R+'runner-final-'+check+'-'+label+'.json')` loop, `constructed`.<br>• `step8-committed-native-E-×3` resolves to `…#/reproduction/verification` line 10, `constructed`.<br>• `step9-native-E-{identity,phase02}` resolves to `step9-native-verification.json#/reproduction/checkHelperSource` line 10, `constructed`. The existing `E-both` literal joins at line 6 are kept, so the rule is applied consistently: all three are inputs.<br>• `phase-07/step-09-close-n1(-r03)-E-{identity,phase02}` resolves to `step-09-close-n1(-r03)-compare-reproduce.mjs:10`, `constructed`.<br>• Both checkpoint `pack.json` rows resolve to `review-10-checkpoint.md:51` and `review-6-checkpoint.md:29`, which show the `--seed-pack pack.json` commands, `command-argument`.<br>All 135 joins resolve. One matcher miss was hand-checked: `step-02c*.json` glob at `step-02c-verification.json#/scripts/9/source:54`, which is correct. |
| 2 | L12-129 reader list equals the manifest; readiness copy equals the gates file | **Pass** | `gates/8/historicalReplayReaders.files` (47) equals the reader-file set derived from the manifest (47), with an empty symmetric difference. The block records `removedInputs: 48`, `readerTargetJoins: 135` and `authority: "L12-134; L12-135"`.<br>`step-07-readiness.json#/preFlipGates` deep-equals `step-08-preflip-gates.json#/gates` as a whole, not only gate 8. |
| 3 | Refreshed `step-07-final-determinism.json` matches the committed files and one scratch run | **Pass** | Committed SHA-256 values all equal the record:<br>• gates `e802359c…`, in both `inputDigests` and `postCensusInputs`<br>• judgments `fc739318…`, recomposition `d10cf44a…`, deferred-rebinds `c5237fd4…`<br>• post-census records `d98710da…` and join `74949d28…`<br>• script `13e66d59…`<br>• the five outputs `1add06ac…`/3,832,732, `8f09d079…`/798,976, `f8f7102b…`/1,539,258, `d50338a5…`/1,305,741 and `2ce7f2ed…`/3,513, total 7,480,220<br>One run of `python3 -B …/step-07-assemble.py --final --pin 5e0315933…` in scratch exited 0 with empty stderr. All five outputs were rewritten (their mtimes moved) and are byte-identical to the committed files (`cmp`). stdout SHA-256 is `6f4ca6e81c1d986f…`, equal to `stdoutSha256`. The stale `ca3538e6…` gate digest is gone. |
| 4 | `fence@N` wording | **Pass in the manifest and gate; stale in the audit record (see N1-r5)** | The manifest `readerPathBase` and gate 8 `exactSourceLocators` both say "fence@N = physical line of the first line inside the code fence". I checked all 10 distinct `fence@N` locators: in each, line N-1 is the opener and line N is body. `step-08-closure-r3-reader-audit.json:65` `locatorContract` still says "Markdown fence start (physical line)". |
| 5 | Pair audit | **Pass** | Replay of both manifests at `7c07af625`: **exit 0**. Each manifest shows ownership/audit/checks 0/0/0, `noNewDoubleOwnership: true`, `failingRows: []`, A `unaccountedPairs: []`, `newWorkingViolations: []`, `ok: true` and H 0 findings.<br>`7c07af625` is a pure insertion of 2,878 chars into `checks.mjs`, identical in both manifests. It adds 16 pairs: 7 for `6f6bc13d0` (exactly its 7 changed paths) and 9 for `7adba4a48` (its 11 paths minus the two reproduction manifests, which A never counts). `7c07af625` itself touches only the two reproduction manifests, so it contributes zero auditable pairs. "Only `7c07af625`'s own pairs unaccounted" therefore holds with an empty set. `6f6bc13d0` is the first parent of `7c07af625`. |

## New defects

### N1-r5 — Low/Medium (records-only). Two r4 fix bullets were not applied, and stale counts and claims remain beside the corrected ones.

The stale fields are pinned at `7c07af625`:

1. `step-08-tree-prune-manifest.json` lines 41-43, `referenceAudit.l12_134ExpandedReaderScan`, read `removedRowsWithHistoricalReaders: 34`, `readerTargetJoins: 121` and `historicalReaderFiles: 43`. The same file's inventory has 48 / 135 / 47, and so do the gate and the readiness copy. The block is not a frozen L12-134 snapshot: `6f6bc13d0` edited its `readerPathBase` in the same commit.
2. `step-08-closure-r3-reader-audit.json:32` `ambiguousNameResolution` reads "All six pack.json candidate lines are output construction, prose or copied CLI help, **not reads of either removed checkpoint pack**". Both checkpoint `pack.json` rows now carry `command-argument` readers, so this is false. The manifest cites this file as `recipeAndTriage`.
3. `step-08-closure-r3-reader-audit.json:6354` `constructedNames` reads "resolve **six** additional removed variants". There are now 16 constructed variants: the original 6, plus `runner-final-D` ×3, `step8-committed-native-E` ×3, `step9-native-E` ×2 and `close-n1(-r03)-E` ×4.
4. `step-08-closure-r3-reader-audit.json:14-15` (121/43) and `:65` `locatorContract` ("fence start") are stale in the same way.

The impact is documentary. The L12-129 gate, the per-row `scriptRefs` and the restore decision are all correct, so this does not affect the archive Land outcome. But a stranger reading the manifest header and its triage record gets numbers and a negative claim that its own rows contradict. That is the false-completeness class this review has chased for four rounds.

**Fix** (either option works):

- **Option a.** Update the four items above to 48/135/47, then:
  - append to `ambiguousNameResolution` "…except `review-6-checkpoint.md:29` and `review-10-checkpoint.md:51`, whose `--seed-pack pack.json` commands read the removed packs (L12-135)";
  - set `constructedNames` to the 16-variant statement;
  - reword `locatorContract` to the new fence wording.
- **Option b.** Add an explicit `l12_135Addendum {removedRowsWithHistoricalReaders:48, readerTargetJoins:135, historicalReaderFiles:47, supersedes:[…the four fields…]}` in both files.

Either way, account the new commit's pairs in both reproduction manifests. The assembler does not read the two edited files. Its 12 inputs are listed in the determinism record. So no rerun is needed, unless the gates file is touched.

### L1-r5 — Low (wording). The new reason misattributes discovery.

The 14 rows now say "Historical replay input discovered **by the Lead** after review C round 4". Review C r4 found them and the Lead applied them, and `owner-answers.md` L12-135 says so correctly. Suggest "found by review C round 4, applied under L12-135". This is optional and can be folded into the N1-r5 edit.

## Not findings (verified)

- All 135 locators resolve. `kind` matches the read form: `constructed`, `literal`, `command-argument` or `glob`.
- The gate and readiness copies are deep-equal. Their 47 files equal the manifest's 47 reader files.
- The determinism record is exact. One independent assembler run reproduced all five outputs and stdout byte-for-byte.
- The pair audit exits 0. All 16 appended pairs are valid, with no stray or duplicate pairs.
- No reader is current, so `restoredFiles: []` stands. I did not re-scan this round. The r4 scan plus these 14 joins is the basis.

Status: DONE_WITH_CONCERNS
Summary: REWORK, minimal and records-only. All five requested checks pass: 14 locators correct and historical-replay, the gate and readiness copy carry 47 files and equal the manifest, the determinism record is reproduced byte-for-byte by one scratch run (gate e802359c, five outputs, stdout 6f4ca6e8), the fence wording is fixed in the manifest and gate, and the pair audit exits 0 with nothing unaccounted. But the manifest header still says 34/121/43, and the cited reader-audit record still claims "six" constructed variants, "no read" of the checkpoint packs and "fence start". These are the r4 bullets that L12-135 says it applied but did not.
