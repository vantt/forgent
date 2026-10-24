# w14 review: G8 direct-link retention and cold timing, at 0763c2259

**Verdict: APPROVE with 1 REWORK (Low).** Full rows: [w14-g8-retention-timing-review.json](w14-g8-retention-timing-review.json).
Commits: 984829939 (direct-link retention), 5c3b57347 (Lead cold timing), 25e8842d3 (receipt fix after w8).

The retention rule and the timing numbers hold. The w8 receipt REWORK is only half done: `receipt.json` now says two opposite things.

## How I checked

- Read-only. I did not clone, re-time or rerun `verify-design.py`. The archive evidence (`verification.json`, `rehearsal.json`, `audit/`) has not changed since f2162d9ff (`git diff --quiet f2162d9ff HEAD`), so w8's verifier rerun (exit 0, byte-equal `verification.json`) still covers it.
- I wrote a link scanner in `/tmp/fgos-work/w14-g8-review/` (deleted). It reads every `.md` and `.json` that stays at the tip, in the trees at d3efc70c5 and at HEAD. It resolves relative Markdown links, skipping fenced code, and checks them against the 6,026 archived paths in `audit/partition.json.gz`. For JSON it also counts repository-relative path strings.

## 1. Direct-link retention

- **All 4 kept files are linked.** Each ruling line at d3efc70c5 holds the link, and so does each line at HEAD: `minimum-constitution.md:235` → `alias-table-and-resolver-contract.md`, `:244` → `cutover-write-lease-design.md`, `:332` → `reports/phase-06/same-path-binding-blocker.json`, `evidence-payload-relocation-policy.md:15` → `cutover-write-lease-design.md`, `:96` → `reports/doc-inventory.md`. Blob sizes 3,951 + 27,057 + 59,528 + 693,382 = **783,918 B**.
- **Exactly 4 are added.** In `direct-links.json.gz`, 646 references come from roots (27 ruling, 619 navigation). Only these 4 targets fall outside the 888 files kept before the change. The 3 ruling roots come from the `Document type:` header, not from a list of file names (`build-design.py:266-276`).
- **No root links into the archive.** No ruling or navigation root (3 + 102 files) links to an archived file. No file outside the plan (including `docs/`) does either: 0 links at the pin and 0 at HEAD.
- **The 1,025 retained-to-archived links are recomputed exactly.** My Markdown scan finds 939 links from 117 `.md` files to 628 targets, with nothing beyond the recorded set. The other 86 links are Markdown links quoted inside 6 retained `.json` review requests, which the recorded scan also counts. These links all come from retained evidence (phase-06/08 step reports and review requests), and design.md says they resolve through the archive ref. None is a dangling ruling or navigation link.
- **Informational (Low): JSON path strings are not covered.** 200 retained JSON files hold **40,641** repository-relative path strings that name archived files, for example `phase-08/step-08-tree-prune-manifest.json` (7,015), `ledger/retired-unit-decisions.json` (3,272) and the identity registries (2,214 each). They are data, not links. The reader closure shows no live program opening them (`unresolvedLiveSources: 0`). But design.md's recovery note covers only relative Markdown links. **Fix:** add one sentence saying that retained JSON path fields also resolve through the archive ref, and give the counts.
- **Carried to F (Medium): the pin partition archives most phase-09 gate evidence.** At HEAD, **70 of the 92** evidence paths in `preflip-gate-status.json` point at files the d3efc70c5 partition archives (the reviews/receipts for G0–G9, including G8's own w2/w4/w5 reviews). So do 3 new phase-09 Markdown links (to `composition/receipt.md`, `reviews/w5-g4-wrapper-review.md` and `reviews/w5-misc-fix-review.md`). The one-hop rule follows Markdown links only, so a JSON gate register will never retain its evidence, even after a rebuild at F. This is not a defect at the pin, because the partition is pin-bound and must be rebuilt at F. **Fix at F:** decide on purpose whether the cutover gate register and its evidence stay at the tip or resolve through the archive ref, and write that decision into the rebuild.

## 2. Cold timing

- **Method: sound for what the gate measures.** `rehearse.py:266-310` makes a fresh `clone --no-hardlinks --no-checkout` of the rehearsal clone for each variant. For every `.git/objects` file it calls fsync and then `posix_fadvise(DONTNEED)`, and it measures `fincore` before and after. It then times only `git worktree add --detach <oid>` (wall clock, `perf_counter`), three runs in sequence. It labels a run `cold` only when eviction is proven and residency before the add is 0.
- **Numbers match the committed raw data.**
  - In `rehearsal.json`, eviction takes residency from 704,667,648 B to 0 for both variants.
  - The per-run residency chain holds: before the cold run 0, after it 230,699,008 B for the reduced tip and 382,160,896 B before freeze; the warm runs then hold steady at those values. Per-file `res` sums equal the totals.
  - The 6 timed `worktree add` rows in the committed `audit/rehearsal-commands.json.gz` have exactly 2.9292 / 2.7071 / 2.9036 s and 41.7036 / 10.5524 / 12.4394 s, all exit 0.
  - Recomputed medians: **2.904 s** and **12.439 s**. The receipt's 2.93 s / 41.70 s cold figures are correct.
  - `filesystemStat` and `findmnt` show ext4 on nvme, which matches the receipt's "ext4 root disk".
- **Limits (informational, they do not change the result):**
  - Only one cold sample per variant.
  - Eviction covers the timing clone's objects only; the git binary, libraries and `.git/index` stay cached. `coldMethod` says this.
  - The timing does not include writeback (no sync), so dirty pages left by earlier runs or the earlier variant may overlap the next run. The pre-freeze cold penalty (+31 s for 382 MB) is far larger than the reduced one (+0.2 s for 231 MB), which suggests IO contention on the shared SSD.
  - None of this matters for the gate: its criterion is "median of 3 < 60 s (target ≤ 20 s)", and the reduced tip is 2.90 s median and 2.93 s cold, with warm and cold nearly identical.
- The receipt cites the stdout log at `/tmp/fgos-work/w5-d5e-rehearse.log`, which is not committed and does not persist (Low). The structured command log that is committed is enough.

## 3. Prior w8 REWORKs on these commits

Only w8 REWORK 3 (`archive-receipt-json-stale`) concerns 984829939/5c3b57347. w8 approved the retention and timing rows. 25e8842d3 fixed **part** of it:

- **Fixed:** top-level `status: verified-local`, `verifierExit 0`, `verifierStatus verified`, `rehearsalRerunCompleted`, `newTimingRuns 6`, `coldCacheEvidence`, `checkARevalidated`, `runtimeExercised`, `leadRunCommit 5c3b57347`, `historicalBlocker`; `receipt.md` now has a "superseded" pointer under its H1.
- **Not fixed (REWORK, Low):** the old values were left in place next to the new top-level copies, so the same JSON contradicts itself:
  - `proofs.verifierExit: 2`, `proofs.verifierStatus: blocked-rehearsal-not-current`, `proofs.rehearsalRerunCompleted: false`, `proofs.newTimingRuns: 0`, `proofs.coldCacheEvidence: false`, `proofs.checkARevalidated: false`;
  - `coldRunImplementation.runtimeExercised: false`;
  - `deferred` still lists "Both real-disk timing variants and measured eviction" and "Current full A/B/H/I and link/test parity";
  - top-level `blocker` still holds the sandbox errno-30 text (w8 asked to move it into `historicalBlocker`, which got only the status);
  - `design.md` line 3 still says "**Current status: blocked** … full verification exits 2".

  **Fix:** move the old `proofs`, `coldRunImplementation.runtimeExercised`, `deferred` and `blocker` into `historicalBlocker` (or delete them). Set `proofs` from `verification.json`/`rehearsal.json`, and empty `deferred` except the F items. Add the same superseded pointer at the top of `design.md`, or rewrite its line 3.

The other three w8 REWORKs (misc receipt, claim_2e2bc926, G5 checker) are on different commits and are out of scope here.

## Outcome for the G8 blocker

The blocker "984829939 and 5c3b57347 not independently re-reviewed" can close once the receipt REWORK above is fixed. The remaining G8 items stay open: rebuild at F, 0 unresolved readers, re-time at F, the archive ref and S2 publication.

Not run: verify-design.py, rehearse.py, cold timing, npm/cargo suites, fgos CLI, impact analysis.
