# Step 8 closure review C, round 4: verification of the L12-134 prune-reader repair

- Worktree `/home/vantt/projects/forgentX-s8-review`, detached at `7adba4a48`. Committed bytes only (`git show`, `git grep`, `git ls-tree` at the pin).
- No git write, no fgOS CLI, no npm test or run-tests, no `.fgos` or secret reads. Python ran under `-B`.
- Scratch: `/tmp/fgos-work/review-C4`. The scan scripts there are `scan`/`lines.py`, `cmds.py`, `enumscan.py`, `evalenum.py`, `labels.py` and `cmp.py`.
- One audit replay: a copy of `audit-report.py` whose only change is `scratch = Path('/tmp/fgos-work/review-C4/audit')`, run under `env -u CLAUDE_CODE_SESSION_ID`.
- `git status --short` was unchanged afterwards: only the pre-existing untracked `target-review/`.

## Verdict: **REWORK** (bounded, records-only)

Items 2 (the Low) and 3 (pairs) pass.

Item 1 is much better than round 3: 34 rows, 121 joins and 43 reader files. All 121 locators resolve to the claimed reading line, and the gate and readiness lists match the manifest exactly.

The completeness claim still does not hold. My independent whole-plan rescan finds **12 more removed rows that have historical-replay input readers**. Ten are constructed-name (label-loop) reads. Two are recorded CLI commands with a file argument. All 12 still carry `scriptRefs: []` and the reason "no direct/constructed-name committed script reader". Four of their reader files are absent from the L12-129 `historicalReplayReaders.files` list.

None of these readers is a current owning check: a `git grep` over `scripts test src package.json .githooks apps crates packages core domains` finds no caller. So no restore is needed. This is the same false-completeness class as round-3 N1, at smaller scale.

## Per-item table

| # | Item | Result | Evidence |
|---|---|---|---|
| 1a | Whole-plan scan; every hit recorded on its row | **Not met: 12 missed rows (N1-r4)** | **Literal names:** `git grep -F -f` over the 278 removed basenames at `7adba4a48`, then decoded JSON/JSONL strings and Markdown fences. Every code-body line naming a removed file with read context is joined in the manifest, except quotations in the reader audit or my r3 report and lines checked by hand to be writers or citations (the `1276467f3` `write(R+'verification-…')`, `step8-nine-rework` `initialAttempt:{raw:R+…}`, `convention-truth-bindings-pack.json` substring, `pack-gen.mjs`/`gen.mjs` writers). All 7 constructed runner-label joins in the manifest are confirmed.<br>**Globs and directory filters:** 1,531 unique enumeration snippets, resolved by root and filter. Only `step-02c*.json` matches a removed row, and it is recorded. These do not match any removed row: the `review-request-step10-*-(345f15d95\|287a22d33)` filters, the `candidate-unverified-*` and `step-05*.py/receipts` globs, the `sync-2a1304393/finalize.py` name allow-list and the `.parts` directory (no enumerator).<br>**Constructed names and command arguments:** see N1-r4 for the 12 missed rows. |
| 1b | No row still claims "no reader" wrongly | **Not met** | 12 rows, listed in N1-r4. |
| 1c | No current owning check reads a removed file | **Met** | No current caller exists for any reader, recorded or newly found. `restoredFiles: []` is correct. The six earlier owning restores are unchanged. |
| 1d | Historical readers named in the L12-129 gate and the readiness copy | **Met for the recorded 43; incomplete overall** | `step-08-preflip-gates.json#/gates/8/historicalReplayReaders` equals `step-07-readiness.json#/preFlipGates/8/historicalReplayReaders` (deep-equal). Its 43 `files` equal the manifest's dict-`scriptRefs` reader-file set exactly.<br>All 121 `{readerPath,line}` locators resolve, through JSON pointer or fence, to a line naming the target or its label family.<br>Missing from the list: `../phase-07/step-09-close-n1-compare-reproduce.mjs`, `../phase-07/step-09-close-n1-r03-compare-reproduce.mjs`, `../phase-06/review-10-checkpoint.md` and `../phase-06/review-6-checkpoint.md`. |
| 2 | C Low: denominators and inference wording | **Fixed** | L12-131 in `owner-answers.md` now reads "**inferred** load-sensitive … not established as branch-caused" and "3 of 4 branch full-suite runs **versus 0 of 1 main** full-suite run". It also says "an inference from the alone-pass replays, **not a reproduced load failure**". The scorecard row, the `progress.md` block and the L12-134 entry say the same. |
| 3 | Pair audit | **Pass** | Replay exit 1 for the expected reason. In both manifests: ownership/audit **0/0**, `noNewDoubleOwnership: true`, `failingRows: []`, `newWorkingViolations: []`, B ok, H 0 findings, I `equalToHEAD: true`.<br>`unaccountedPairs` = **9, all `7adba4a48`**: its own 9 changed paths.<br>The `7adba4a48` change to both manifests' `checks.mjs` is a pure insertion (0 removed, 3,464 chars inserted), identical in both, with no other JSON value changed. It adds **19 pairs**: `27c2b2cde` ×15 and `83f572ac3` ×4. All 19 are in their commit's first-parent diff, and both commits are ancestors of the pin. |

## New defects

### N1-r4 — Medium. Twelve removed rows have historical-replay input readers that are not recorded.

The L12-134 records claim complete constructed-name resolution ("Runner label loops … resolve six additional removed variants") and complete shell/argv coverage. Neither claim holds.

**Constructed-name reads.** In each case the read happens in a script separate from the one that writes the file, so it is an input read. In every case `R` is the `phase-0x` reports directory.

1. `reports/phase-06/runner-final-verification.json#/reproduction/checkHelper` line 7 reads `read(R+'runner-final-'+check+'-'+label+'.json')` for `check` in `['D','E']`. The writer is the separate `singlePassHelper`. The manifest joins the three E rows to this reader. It misses **`runner-final-D-both.json`, `runner-final-D-identity.json` and `runner-final-D-phase02.json`**.
2. `reports/phase-06/step8-committed-native-verification.json#/reproduction/verification` line 10 reads `read(R+'step8-committed-native-E-'+label+'.json')`. The writer is the separate `/reproduction/gates` line 7, and `verification` contains no write. Missed: **`step8-committed-native-E-both.json`, `-E-identity.json` and `-E-phase02.json`**.
3. `reports/phase-07/step-09-close-n1-compare-reproduce.mjs:10` is a standalone committed script: `['both','identity','phase02'].map(x=>read(R+'/step-09-close-n1-E-'+x+'.json'))`. Missed: **`step-09-close-n1-E-identity.json` and `step-09-close-n1-E-phase02.json`**. `E-both` is kept, so the script now dies on the second read.
4. `reports/phase-07/step-09-close-n1-r03-compare-reproduce.mjs:10` follows the same shape. Missed: **`step-09-close-n1-r03-E-identity.json` and `-r03-E-phase02.json`**.

The manifest already lists both compare scripts in `citedBy` for the kept `*-open-sets.json` rows, so they were in view. They are reviewer-runnable replays: `review-request-a38-step-09-close-rework-02.md:26` runs `node …/step-09-close-n1-compare-reproduce.mjs /tmp/fgos-work/…`.

**Recorded CLI input arguments.** This is the same class as the `--gate` comparator command the audit did add.

5. `reports/phase-06/review-10-checkpoint.md:51`: `` `node scripts/propose-doc-decisions.mjs --seed-pack pack.json --seed s10-checkpoint-… --out seed-pack.md` `` reads **`sensitivity-10-checkpoint/pack.json`** (removed).
6. `reports/phase-06/review-6-checkpoint.md:29` runs the same command form and reads **`sensitivity-6-checkpoint-whole-system/pack.json`** (removed).

`literalNameCoverage.ambiguousNameResolution` says "All six pack.json candidate lines are output construction, prose or copied CLI help". But these two command lines are not among its six candidates: `review-10-checkpoint.md#inline@59`, `pack-gen.mjs:54` and four `step-05-seam4-p148.json` help lines.

**Consistency note, not counted above.** `step9-native-verification.json#/reproduction/checkHelperSource` reads `step9-native-E-'+label+'.json'` at line 10, after the same script wrote those files at line 5. The manifest joins `step9-native-E-both` (literal, line 6) as a reader. It does not join `E-identity` or `E-phase02` (constructed, line 10). Either all three are self-produced (drop the E-both join) or all three are inputs (add two). Pick one rule.

**Fix (records-only).**

- Add `{readerPath, line, kind: "constructed"|"literal", liveness: "historical-replay"}` to the 12 rows, and replace their "no reader" reason.
- Add the four new reader files to `historicalReplayReaders.files` in both the gate and the readiness copy, and update the counts: 46 rows, 47 files, joins as computed.
- Correct the `constructedNames` and `ambiguousNameResolution` text.
- No restore is needed: no reader is current.
- Recipe hint: search the code bodies for every `'(D|E)-'+label` or `'-'+x+'.json'` label loop, and match `--<flag> <removed-basename>` in recorded commands, including inline backtick code.

### L-r4-1 — Low. Fence locator convention is off by one from its stated contract.

`readerPathBase` says "# suffix identifies … Markdown fence start (physical line)". In all 19 `fence@N` locators, N is the **first body line**: the opener sits at physical line N-1. Lines within the fence then resolve correctly. Either reword the contract to "first line inside the fence" or shift N.

## Not findings (verified)

- The gate list is deep-equal across the gate and the readiness copy, and is identical to the manifest's reader-file set.
- All 121 recorded locators resolve.
- The 19 appended pairs are valid, and only `7adba4a48`'s own 9 pairs remain unaccounted.
- The Low is fixed in all four copies.
- `git status` is unchanged.

Status: DONE_WITH_CONCERNS
Summary: REWORK, one bounded records item. The Low and the pair audit pass: 19 valid appended pairs, and only `7adba4a48`'s own 9 pairs remain. The 121 recorded joins and the 43-file L12-129 list are accurate and consistent. The whole-plan rescan still finds 12 removed rows with unrecorded historical-replay input readers. Ten are constructed label-loop reads (`runner-final-D-*` ×3, `step8-committed-native-E-*` ×3, and `step-09-close-n1(-r03)-E-{identity,phase02}` ×4 from two standalone compare scripts). Two are `--seed-pack pack.json` commands in the review-6 and review-10 checkpoint reports. Four of these reader files are missing from the gate. None is current, so no restore is needed.
