# w5-d5c archive review (D5c, 22ff13db5, reviewed at 1975d4403)

8 APPROVE / 2 REWORK. Full verdicts: `w5-d5c-archive-review.json`. Scratch `/tmp/fgos-work/w5-d5c-review/` was deleted after use.

## What holds
- **Scope:** `git diff --name-only 22ff13db5^ 22ff13db5` lists only paths under `P/reports/phase-09/archive/**`.
- **Live links:** I scanned every tracked file outside the plan (excluding `.fgos/`) at HEAD `1975d4403`, using both full-path mentions and relative Markdown links. **0 joins to archived files.** None of the 20 moved review rows is linked from outside the plan.
- **Navigation roots:** none of the 11 navigation roots has a link to an archived file.
- **The 22 rows:** 20 move. The other two stay, and both of their links are real:
  - `phase-06-transform-...md:25` -> `[pilot/README.md](pilot/README.md)`
  - `reports/phase-06/progress.md:1306` -> `[review-6-checkpoint.md](review-6-checkpoint.md)`

  I spot-checked other reasons and they are real reads: the constitution test's `readdirSync` of the pilot dirs, and the alias resolver default path. No row says "small".
- **Partition:** I recomputed it from `git ls-tree -rlz 23f6eaccf`:
  - 6,899 files / 2,897,413,094 B in total.
  - 6,016 archived / 883 retained.
  - 0 missing, 0 extra, 0 duplicates, 0 blob or size mismatches.

  Candidate tips: `98a121070` is 11,156 files / 818,290,357 B, and `dd78c6b18` is 2,117,345,765 B. Both match the receipt exactly.
- **verify-design.py:** it exits 0, and its output is byte-identical to the committed `verification.json`. To run it, I rebuilt the state it needs in a `--shared` clone: HEAD at pin `23f6eaccf` with the D5c `archive/` laid over it. It cannot run at the committed tip, because it asserts `HEAD == sourceCommit`.
- **Check A:** I ran the full `checks.mjs` embedded in both manifests on the **committed accounted candidate** `98a121070`, which includes the accounting commit itself. The Doer's "after" run was at the removal commit with the manifests left uncommitted.

  | Recipe | A | Unaccounted | Working violations | B | I (equalToHEAD / baseline unchanged) |
  |---|---|---:|---:|---|---|
  | round5 | ok | 0 | 0 | ok | true / true |
  | sync4d | ok | 0 | 0 | ok | true / true |

  H has the same 4 existing missing-candidate-fields findings as the Doer's after-output and **0 unresolved links**. The recipe still exits 1 because of H, as the receipt says.
- **ESM fixture claim:** this one is true.
  - In attempt-1, `verify-phase-02` had the same 10 "require is not defined in ES module scope" failures on both sides.
  - I reproduced the cause. An extensionless `#!node` stub under a directory whose parent `package.json` has `"type":"module"` fails. A nested `{"type":"commonjs"}` fixes it.
  - The final logs are 16/16 on both sides. No test was changed.
- **attempt-1/:** keeping `failure.json`, `rebuild-d5c.log`, `rehearsal.json` and the per-test logs is justified, because they prove the structural catch and the ESM parity. The 1.8 MB `rehearsal.bundle` is not needed:
  - Its refs point at superseded fixture commits (`e767e56e`, `9a32c086`, `0ed877f5`).
  - No verifier reads it.
  - gzip saves nothing (1,788,111 B versus 1,788,526 B).
  - It is not in `mainSidePaths`, so it never reaches the main tip. It is already in branch history, so deleting it now only saves bytes if landing squashes.

  This is a suggestion only: drop it, and `rehearsal-commands.json.gz` (318 KB), at the final rebuild.

## REWORK
1. **Retained rulings link to archived files.** Two retained rulings point at files that the archive moves.
   - `minimum-constitution.md` (linked 11 times from the live ledger) links to:
     - `alias-table-and-resolver-contract.md` (:235). This is the contract for the retained live input `alias-table.json`.
     - `cutover-write-lease-design.md` (:244). This is the design for the lease that is still pending.
     - `reports/phase-06/same-path-binding-blocker.json` (:332).
   - `evidence-payload-relocation-policy.md` (kept through `plan.md:160`) links to:
     - `cutover-write-lease-design.md` (:15).
     - `reports/doc-inventory.md` (:96). This is **one of the 20 moved rows**.

   Together that is 4 files / 783,918 B. More broadly, 118 retained files have 943 relative links to 631 archived files (281 MB). Most are evidence reports kept only because something links to them, and the design never states that their outgoing links break on the tip.
2. **No cold run was recorded.** The "cold fallback" is not cold.
   - Run 1 is a worktree add from a clone that was just copied with `--no-hardlinks`, so its packs are still in page cache.
   - That run took 2.415 s, faster than both warm runs (6.091 and 6.012 s).
   - The previous review measured a real cold first run of 51 s on a smaller reduced tree.

   The median of 6.012 s really is 6.012 seconds, and it meets "well under 60 s" and the 120 s Git deadline when warm. The cold value is unknown. The pre-freeze variant (49.5 / 27.7 / 13.4 s) is the one at risk of breaking 120 s cold.

   Eviction does not need root. `os.posix_fadvise(fd,0,0,POSIX_FADV_DONTNEED)` on a file emptied it from page cache here (`fincore` 47.7M -> 0B).

## Notes
- `rehearse.py` puts multi-GB physical scratch at `archive/.scratch/`, which is not gitignored. A crashed run at F leaves it untracked inside a tracked directory, where `git add -A` would sweep it up.
- During this review, another process rewrote the two phase-06 reproduction manifests in W with identical content (mtime 13:54:57). `git status` was clean afterwards.
- For timing context, my own full-pin checkout (3.1 GB) took 237 s at load 11.

Status: DONE_WITH_CONCERNS
Summary: 8 APPROVE / 2 REWORK. The partition, tip bytes, verify-design, check A on the committed accounted candidate, and live-link and navigation-root retention all reproduce. But the retained rulings (the constitution and the relocation policy) link to 4 archived files, including one of the 20 moved rows, and the "cold" timing is a warm page-cache run.
