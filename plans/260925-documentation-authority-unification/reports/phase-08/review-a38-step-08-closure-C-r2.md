# Step 8 closure review C, round 2: records and accounting

- Worktree `/home/vantt/projects/forgentX-s8-review`, detached at `1eae797d8` (confirmed). I read committed bytes only. Exact counts come from python `subprocess` over `git`, because the shell's rtk wrapper inflated one `wc -l` count (349 against the true 346).
- Writes: no git write, no fgOS CLI, no npm test or run-tests, no `.fgos`, no secrets.
- One audit replay: a copy of `audit-report.py` with its scratch root changed to `/tmp/fgos-work/review-C`, run from the worktree root under `env -u CLAUDE_CODE_SESSION_ID python3 -B`. Afterwards `git status` was unchanged (only the pre-existing untracked `target-review/`).

## Verdict: **REWORK** (bounded, records-only)

The earlier closure-C findings are resolved or held as explicit owned PRE-FLIP gates. The prune blobs, both merges and the 38 appended pairs all check out against committed bytes.

Four records defects remain:

1. L12-131 misstates the failure mechanism of two of the eleven titles.
2. L12-131 cites a prior receipt as flake proof when that receipt says the opposite.
3. The prune manifest claims there is no reader for six files that committed scripts enumerate.
4. The PRE-FLIP gate index went stale after L12-129/130.

None is a product defect. All of them are false or stale statements in the records that close this phase.

## Per-item verification

| # | Item | Result | Locators / evidence |
|---|---|---|---|
| 1 | Earlier closure-C F1–F9 and Lows | **Fixed or explicit owned PRE-FLIP gate** | **F1:** SC1 not-met now maps the 133 stale specs to 48/77/8 (`step-08-phase-08-scorecard.md:47`).<br>**F2:** named L12-96 section (`:65-73`, `step-08-preflip-gates.json:l12_96Composition`, 7 entries).<br>**F3:** 191-row `changedBindings` gate.<br>**F4:** `droppedClaims` holds 17 ids, dropped-001 `needs-restoration` and 002–017 `needs-review`, each owned.<br>**F5:** `gitOneDoorSites` 58.<br>**F6:** `retention` plus `retentionReceipts` (L11-23, L11-25, compounding).<br>**F7:** readiness `aliasWriterCheck` now uses the effective basis: 8/16/27 plus 1 parked = 52.<br>**F8:** "35 files / 34 unique blobs", with a dependents column (`:153`, `:179`).<br>**F9:** gate 5 (`:83`).<br>**Stop-table items:** the Git-fixture and citation tests were rerun (`:134`, `:140`). L12-124 is a Lead ruling under A42 (`phase-08-…md:116`), which is the plan's delegated authority. |
| 2 | Tree prune L12-128 (`ab4c65d17`) | **Pass, with one Medium (D3)** | All 285 removed rows have path, bytes, gitBlob, sha256, class and reason (0 missing). The removed set equals the commit's 285 deletions exactly. None is present at HEAD. **All 285** `gitBlob` values equal `git rev-parse ab4c65d17^:<path>`. Ten sampled rows (seed 7) match bytes and SHA-256 via `git cat-file blob`. None of the ten has a committed script/test reader: the only hits are historical `{commit,path}` exception data inside the embedded `checks.mjs`. My HEAD replay passes ownership/audit-ownership, so the owning inputs are intact. **Exception:** see D3. |
| 3 | Main merges L12-130 | **Pass** | **Paths:** `e1966d417` first-parent diff is exactly **346** paths and `cbdf18555` is **31**. Both equal `merge-accounting.json` changedPaths, with no missing or extra path.<br>**CHANGELOG:** the Unreleased section at both merges holds every nonblank add from both parents. No line the main parent removed is kept: `cbdf18555` drops main's three removed seat bullets. No invented line, and the rest of the file is identical.<br>**Registry:** `setup-doctor-registry.md` at `cbdf18555` is the branch line minus `seat-binding-drain` (main's only change), keeps `documentation-cutover-lease`, and lists 143 ids. At `e1966d417` main did not touch the file (p2 = base `f55a62c1`). The "Data Dictionary #7 … exactly the registered doctor checks" test passes (`step-08-l12-130-registrations.log:31`).<br>**Board:** `plan.md`/`log.md` equal main's parent blobs whole. The branch-side adds since base (1 + 1 lines) survive, and nothing removed is resurrected.<br>**Census:** 1,055 files / 58 sites / 253 classes at both merges and at HEAD. |
| 4 | Pair accounting | **Pass** | At HEAD `1eae797d8`, both recipes give ownership 0, audit-ownership 0, `noNewDoubleOwnership: true`, zero failingRows and B ok. A is red **only for 24 pairs, all of commit `1eae797d8`**, the same 24 in both manifests. The 38 appended pairs are a pure insertion (0 chars removed) and identical in both manifests: `ab4c65d17` ×32, `3feda4d15` ×2, `220a4d9ed`/`ebf45ec60`/`171105af5`/`010897c49` ×1 each. **All 38** paths are in their commit's first-parent diff. |
| 5 | Suite attribution L12-131 | **Totals and titles correct; classification partly wrong (D1, D2)** | `/tmp/fgos-work/branch-only3.txt` is byte-identical to `step-08-suite-e1966d417-branch-only.txt`. Recomputing failing titles in `p8-suite3.log` minus `main-suite.log` (`9c7edde30`) gives exactly those 11. The 1,138 s figure and exit 1 match. The registrations claim is true: all five worktree-failing titles show ✔ in the clone log. |
| 6 | L12-129 | **Faithful; grants nothing beyond a PRE-FLIP gate** | The owner text is quoted ("Archive ref + merge (Recommended)"). Scope says no landing, push, cutover or deletion now (`owner-answers.md:2717`). The gate is **not indexed** for Phase 9 (D4). One placeholder is left in the record (L2). |

## Defects

### D1 — Medium. L12-131 gives the wrong failure mechanism for both reproduction titles.
- **Locators:** `owner-answers.md` L12-131 table row "Reproduction A bookkeeping" and `step-08-phase-08-scorecard.md:368` ("reproduction A ×2 (bookkeeping)").
- **What the log shows:** in `p8-suite3.log` both titles fail at `audit-ownership.mjs`, not at check A:

  ```
  AssertionError: The expression evaluated to a falsy value: assert(current.noNewDoubleOwnership)
    at …/reviewer-fresh-hHhFz6/audit-ownership.mjs:8:56
  ```

  The same failure appears for sync4d (`reviewer-fresh-1Nrlqy`). `checks.mjs` never ran.
- **Likely cause:** `noNewDoubleOwnership` includes `!targetDigestDrift.length`. At `e1966d417` the imported main docs had changed, while the three owning shards (`s3-host-invocation-boundary-gaps`, `s5-root-boundary-sync`, `s5-root-main-recarry`) were only rebound in `1eae797d8`. That is target-digest drift from the main import. It is a different class from the earlier runs: `p8-suite.log` and `p8-suite4.log` fail at `checks.mjs` A, with 0 `noNewDoubleOwnership` hits.
- **Status at HEAD:** resolved. My HEAD replay shows `noNewDoubleOwnership: true` and drift 0.
- **Why it matters:** the record's "No new class" is false for this run. It also hides a real property: every main import leaves the committed bytes red in these two tests until a records commit rebinds them.
- **Fix:** restate the row as "target-digest drift from the `e1966d417` import, caught by audit-ownership. Resolved by the L12-130 five rebindings at `1eae797d8`. Not A bookkeeping." Cite the log line.

### D2 — Medium. The worktree-admin "load flake" classification has no proof and miscites L12-125.
- **The citation is wrong:** L12-131 says the same title "was a load flake in the L12-125 run". L12-125 says the opposite: "These are **infrastructure-blocked reruns, not evidence that the Lead failures were flakes**" (`owner-answers.md`, L12-125 table row C).
- **Branch history across the full logs:**

  | Log | Result |
  |---|---|
  | `p8-suite` | ✖ 199.8 s |
  | `p8-suite2` | ✖ 70.2 s |
  | `p8-suite3` | ✖ 79.9 s, `lock-held after waiting 60000 ms` |
  | `p8-suite4` | ✔ 12.9 s |

  Main (`main-suite.log`) passes it in 38.3 s.
- **The load argument is weak:** "suite wall 1,138 s vs 202 s baseline" leaves out that `main-suite.log` itself ran **1,136 s**. Under that same wall time main passed the dev-door (18 s) and `--help --json` (51 s) cases that time out on the branch.
- **Requested proof missing:** the scorecard's own next action (`:364`) requires "a real worktree-admin load replay". None was done.
- **Fix:** classify these four as "intermittent, branch-only in 3 of 4 runs, cause unproven". Keep the replay as a pre-close proof item rather than stating "no branch-caused failure".

### D3 — Medium. The prune manifest says "no constructed-name reader" for six files that committed scripts enumerate.
- **Files:** six removed rows, `review-request-step10-{accounting-01,accounting-02,decisions-02,decisions-04,decisions-05,native-01}-345f15d95.json`. Each has reason "no direct/constructed-name committed script reader … found" and empty `scriptRefs`.
- **Actual readers:** `reports/phase-06/step10-round3-rationale-rebuild.mjs:21` and `step10-round4-rationale-rebuild.mjs:33` load exactly this set:

  ```
  fs.readdirSync(R).filter(n=>/^review-request-step10-.*-(345f15d95|287a22d33).json$/.test(n))
  ```

  They use it to build `sourceWitness` maps.
- **Failure scenario:** a rerun of either rebuild (`--check`) at the TIP does not fail. It silently runs on the remaining 287a22d33 subset and gives different witness/forced sets.
- **Not an owning proof:** the round5/sync4d recipes and the restored-blob independent-auditor comparison do not invoke round3/round4. The committed test uses round4 only for the unsafe-output rejection.
- **Why it still matters:** L12-128's own policy keeps "discovered script inputs" and "directory inputs". L12-129's reader repoint/retire list will be built from this audit.
- **Fix:** correct these six rows' `scriptRefs`/reason. Then either restore them or record that round3/round4 are retired historical tools pinned to `345f15d95`/`287a22d33`, with the owning proof named.

### D4 — Medium. The PRE-FLIP gate index is stale after L12-129/130.
- **Stale digests:** `step-07-readiness.json:preFlipGates` and `step-08-preflip-gates.json` are declared the "complete id/owner/digest" lists (scorecard `:77`). The five L12-130 rebound claims (`claim_83c03365…`, `af89c4e6…`, `b741539a…`, `f9c135d8…`, `b19630ef…`) are in `changedBindings`, but every one still has `targetUnitDigest` equal to `merge-rebindings.json` **beforeDigest**, not afterDigest.
  - Failure: a reviewer working the gate list records verdicts against superseded digests, which the gate's own rule forbids ("no approval crosses the current binding digest").
- **L12-129 gate missing:** the archive-ref / reader-repoint / measured <60 s gate is in neither readiness `preFlipGates` (8 ids) nor `phase-09-atomic-platform-authority-cutover.md` (no "archive"/"L12-129" hit). Only the scorecard's item 11 and owner-answers hold it.
  - Failure: a Phase 9 executor working from phase-09 lands ~2.9 GB on main.
- **Overlaps without owners:** the 144 L12-130 deferred overlaps (`step-08-l12-130-deferred-rebinds.json`, 10/9/125) have no `owner` field and no gate entry.
- **Fix:** regenerate or append the gate index with the after-digests. Add an `archive-ref-and-reader-repoint` gate with an owner. Join the deferred overlaps to `composition-independent-review` or give them owners.

### Lows
- **L1. Scorecard contradicts itself.**
  - `:94-104` still says "Suite slot remains BLOCKED … no eleven-row attribution".
  - Next action `:364` still asks the Lead to supply logs and classify, while `:366-368` says L12-131 completed this.
  - The decision index stops at L12-130 (`:205`, `:360`), and `progress.md` has no L12-131 entry.
- **L2. Placeholder in L12-129.** The record says "largest blob is 103,868,xxx bytes". Replace it with the exact number.
- **L3. Two unrecorded signals in `p8-suite3.log`.**
  - The run-tests warning `test/e2e/documentation-cutover-lease-hooks.test.mjs:96 [new-cli-spawn-without-reason]` is not recorded.
  - The `/tmp`-clone symlink-output failure shows that `step10-round4-rationale-rebuild.mjs` accepts a symlinked output that resolves into the repository whenever the repository itself lives under `/tmp/fgos-work/`, then crashes on import. That is a location-dependent safety check, not purely a clone artifact. Note it under the clone-artifact class.

## Not findings (verified)
- The Doer's 346 path count is correct; the brief's 349 is wrong.
- The 285 deletions are not A pairs except the 32 that the unchanged recipe reports. No invented pairs.
- The two board files taken whole from main lose no branch-side line.

Status: DONE_WITH_CONCERNS
Summary: REWORK, records-only. Closure-C F1–F9, the prune blob/hash accounting, both merge resolutions and the 38 appended pairs all verify against committed bytes, and at `1eae797d8` only that commit's own 24 pairs stay unaccounted. Four records defects remain: L12-131 misstates the reproduction failures (it was target-digest drift, not A bookkeeping) and calls the worktree-admin failure a load flake without proof, the prune manifest misses two committed readers of six files, and the PRE-FLIP gate index has stale digests for the five rebound claims and lacks the L12-129 archive gate.
