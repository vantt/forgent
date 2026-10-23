# Step 8 closure review C, round 3: verification of the L12-133 records repair

- Worktree `/home/vantt/projects/forgentX-s8-review`, detached at `27c2b2cde` (confirmed). I read committed bytes only, through `git show`, `git cat-file` and `git grep` at `27c2b2cde`.
- Writes: no git write, no fgOS CLI, no npm test or run-tests, no `.fgos` or secret reads. Python ran under `-B`.
- Scratch: `/tmp/fgos-work/review-C3`. I made one audit replay, with a copy of `audit-report.py` whose only change is `scratch = Path('/tmp/fgos-work/review-C3')`. It ran from the worktree root under `env -u CLAUDE_CODE_SESSION_ID python3 -B`.
- After the replay, `git status --short` was unchanged: only the pre-existing untracked `target-review/`.

## Verdict: **REWORK** (bounded, records-only, one item)

D1, D2, D4 and all four Lows are fixed. For D3, the six restores and their reclassification check out byte-exactly.

The fresh glob/directory-filter scan the brief asked for still finds one more reader of a removed row. That reader sits outside the scope the L12-133 audit declares, and it also reads the row by its literal name. A wider look at the same class (embedded read-only verifier scripts) finds literal readers for 20 of the 279 removed rows. The archive gate does not list any of them.

This is not data loss: every row keeps its gitBlob, SHA-256 and byte count. But the records claim "zero additional" and "no direct/constructed-name committed script reader", and those claims hold only inside a scope narrower than the gate they feed.

## Per-finding table

| # | Round-2 finding | Result | Evidence and locators |
|---|---|---|---|
| D1 | L12-131 reproduction mechanism | **Fixed** | `owner-answers.md` L12-131 now carries a dated L12-133 correction: failed at `assert(current.noNewDoubleOwnership)` `audit-ownership.mjs:8:56`, from target-digest drift after `e1966d417`, "not pair bookkeeping". The original text is kept. The scorecard suite table, row "Reproduction titles ×2", says the same. The "Reproduction A bookkeeping" row still in the scorecard sits under the explicitly historical L12-126 table, which is correct. My replay at `27c2b2cde`: ownership/audit-ownership **0/0** in both manifests, `noNewDoubleOwnership: true`, `failingRows: []`. |
| D2 | worktree-admin "flake" without proof, L12-125 miscited | **Fixed, recorded honestly** | Recorded values: the brief's A/B (2026-10-23 13:45), `ensureGitAddon` staging, `env -u CLAUDE_CODE_SESSION_ID node --test test/runner/worktree-admin-multiprocess.test.mjs`. Branch `e1966d417` 7/7 ×3 (11.2/26.4/25.5 s), main `9c7edde30` 7/7 ×3 (24.9/12.2/12.4 s). These match the supplied replay.<br>Provenance is stated as "supplied in this turn's brief", not as the Doer's own run.<br>The L12-125 citation is withdrawn explicitly.<br>3/4 branch failures are disclosed, and wall-time reasoning is disowned (main 1,136 s vs branch 1,138 s).<br>The other three spawn timeouts are left "not established". The blanket "no branch-caused failure" is retracted.<br>See L-new-1 for a denominator nit. |
| D3 | six `review-request-step10-*-345f15d95.json` readers missed | **Six restores verified; scan criterion not met (see N1)** | All six are present at `27c2b2cde` at their original paths. Blob ids equal `ab4c65d17^:<path>` (6/6), and SHA-256 values match the manifest. Total **20,966,166** bytes.<br>The rows are now class `owning record`, action `keep`, with `scriptRefs` `step10-round3-rationale-rebuild.mjs:21` and `step10-round4-rationale-rebuild.mjs:33`. Both locators hold the `readdirSync(R).filter(/^review-request-step10-.*-(345f15d95…)/)` lines.<br>Inventory: 297 keep / 279 remove, `removedBytes` 1,472,631,114 (my recomputation matches). The removed set equals the 285 `ab4c65d17` deletions minus the six. None of the 279 is present at HEAD, all 297 kept files are present, and 0 of 279 blob ids differ from `ab4c65d17^`. |
| D4 | stale gate digests, L12-129 gate missing, 144 overlaps unowned | **Fixed** | **Digests:** in `step-08-preflip-gates.json`, the five rebound claims in both `changedBindings` (rows 11/19/146/151/152) and `pendingChangedSinceStep0` now carry `targetUnitDigest` = `merge-rebindings.json` afterDigest. I recomputed `bindingSha256` from the declared encoding (SHA-256 of sorted-key compact JSON + LF of `bindingHashInput`): **10/10 match**. `reviewStatus` stays `pending`.<br>**Gates:** readiness `preFlipGates` lists 12 owned ids, including `L12-129-archive-ref-and-checkout`, `source-context-and-post-pin-recomposition`, `final-code-holder-land-rehearsal` and `cutover-release-with-docs-lease`. `phase-09-…md` has the new "Owned PRE-FLIP prerequisites" section with all four.<br>**Overlaps:** all 144 deferred overlaps (10/9/125) carry `owner` and `gateId: source-context-and-post-pin-recomposition`. |
| L1 | contradictory scorecard / missing index | **Fixed** | The scorecard suite section is retitled "supplied attribution, dated correction", and the BLOCKED / "no eleven-row" text is gone. The decision index runs to L12-133 (L12-131/132/133 entries). `progress.md` has an L12-131/132/133 block. The next action says "do not request their classification again". |
| L2 | "103,868,xxx" | **Fixed** | Now reads `103,868,451 bytes`. No `xxx` left in `owner-answers.md`. |
| L3 | unrecorded suite signals | **Fixed** | `documentation-cutover-lease-hooks.test.mjs:96 [new-cli-spawn-without-reason]` is recorded in both L12-131 and the scorecard. The symlink-output title is called a location-dependent safety-check limitation, with no repair authorized. |
| Pairs | rerun audit | **Pass** | Both manifests: A `unaccountedPairs` = **15, all commit `27c2b2cde`**, the same 15 in both. `newWorkingViolations: []`, B ok, H 0 findings, I `equalToHEAD: true`.<br>The `27c2b2cde` change to both manifests is a pure insertion (0 chars removed, 6,863 inserted), identical in both: **36 pairs** = `1eae797d8` ×24, `890715ead` ×6, `1c9e642e5` ×5, `7389e61c5` ×1. All 36 paths are in their commit's first-parent diff, and all four commits are ancestors. |

## New defects

### N1 — Medium. The reader rescan misses embedded read-only replays, including a glob reader of a removed row.

**The glob reader.** `reports/phase-08/step-08-closure-r2-reader-audit.json` claims "zero additional removed input matches". Its method covers "recursive embedded reproduction sources". The manifest's `referenceAudit.searches` narrows embedded code to "every phase-06/step10-*-reproduction.json". Outside that scope:

- `reports/phase-08/step-02c-verification.json:638` embeds `/tmp/fgos-work/step02c-verify.py`. The record itself says it "is the read-only replay". It contains:

  ```
  for p in R.glob('step-02c*.json'):json.loads(p.read_text())
  idx=load(R/'step-02c-review-index.json')
  ```

  `R` = `reports/phase-08`. `step-02c-review-index.json` (1,406,617 bytes, blob `aae10be7…`) is a **removed** row: class "superseded intermediate", `scriptRefs: []`, reason "no direct/constructed-name committed script reader". At the TIP, that replay now dies with FileNotFoundError. The glob alone would silently skip the file.
- This reader is not in the audit's `candidateEnumerationLines` (72 entries).

**The same class, more widely.** I looked for read-context literals: `read(R+'…')`, `fs.readFileSync(r+'…')`, `json.load(open(R/'…'))`, `(R/'…').read_text`, excluding writers. These appear in embedded verifier sources in committed phase-06/phase-08 JSON. **20 removed rows** are read by name this way. All have `scriptRefs: []` and the "no reader" reason. Examples:

- `liveness-rework-verification.json` (9.8 MB). Read in `closure-routing-stop.json`, `host-invocation-close-verification.json`, `truth-fix-accounting-agent-coordination.json` and others, 13 files in all, e.g. `prior=JSON.parse(fs.readFileSync(r+'liveness-rework-verification.json','utf8'))`.
- `truth-accounting-agent-coordination.json` (11 files).
- `step9-predecessor-accounting.json`. Read in `runner-b80e-review-package-index.json#reproduction.finishBuilder` and `step9-review-package-index.json`.
- `step8-final-rework-accounting.json` and `review-request-261015-1526-specs-ui-reworks-main-recarry.md.json`. Read in `step8-committed-request-binding-proof.json`, `step8-nine-rework-verification.json` and `step8-committed-native-verification.json`.
- `runner-final-E-both.json`, `runner-b80e-native-E-both.json`, `runner-26f5-native-E-both.json` and `step9-native-E-both.json`.
- `step-02c-review-index.json`, above.

**Not a reader:**

- The `runner-b80e` sidecar builder writes its own sidecar, so it is a writer, not an input reader.
- `step9-a42-followup-audit.json:421` only does `includes('review-pack-')` over git paths.

**Why it matters.** The L12-129 gate (`archiveRefAndCheckout.readerRequirement`) requires "Every discovered direct, constructed-name, directory-filter and glob test/script reader … repointed … or retired in the SAME change". The Phase 9 executor will build that list from these records, so these embedded replays would be neither repointed nor retired. Unlike the round3/round4 case these replays fail loudly, not silently, so this is lower severity than D3 was. It is still the same false-completeness class.

**Fix, records-only.** Pick either option:

- (a) Widen the rescan to every embedded code field in committed plan JSON. Add the reader locators to the affected rows' `scriptRefs` (they can stay `remove` as retired historical replays). Name them in the L12-129 gate's reader list as "retire, pinned historical replay".
- (b) State the scope limit explicitly in the reader audit, the manifest row reasons and the L12-129 gate. Add an obligation to rescan all embedded verifier sources before the archive Land.

Restoring the files is not required unless the Lead wants these replays runnable at the TIP.

### L-new-1 — Low. D2's main-side denominator is not stated.

"Failed in 3 of 4 branch full-suite runs and 0 recorded main runs" does not say that only **one** main full-suite log (`main-suite.log`, `9c7edde30`) exists. So the asymmetry is 3/4 against 0/1.

Also, the A/B is an alone-on-a-quiet-machine replay. It shows the title passes alone on both pins. It does not reproduce the failure under load on either pin. "Load-sensitive" is therefore still an inference, though the record does say the conclusion rests on this replay. Suggest adding "(n=1)" for main.

## Not findings (verified)

- The six restored files are byte-identical to the pre-prune blobs, and the `directoryReaderCorrection.restoredFiles` metadata matches.
- The assembler's `readyRows` key is renamed to disposition-only `nonPreparedNonParkedRows`, with a basis string. That is the only `step-07-assemble.py` change (2 lines).
- `git status` is unchanged after the replay.

Status: DONE_WITH_CONCERNS
Summary: REWORK, one bounded records item. D1, D2, D4, the Lows, the six byte-exact restores and the 36 appended pairs all verify, and only `27c2b2cde`'s own 15 pairs stay unaccounted. The fresh reader scan still finds a missed glob reader of a removed row (`step-02c-verification.json:638` reads `step-02c-review-index.json`, which is pruned), plus literal read-only embedded replay readers for 20 of the 279 removed rows, all outside the scope the reader audit declares and absent from the L12-129 reader-retirement gate.
