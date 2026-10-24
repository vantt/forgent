# Archive rework: keep ruling link targets and record a real cold run (Doer brief, records slice)

Status: Lead brief under L12-137. Follows review `reviews/w5-d5c-archive-review.{md,json}` (8 APPROVE / 2 REWORK) of 22ff13db5 (brief `w4-d5c-brief.md`). Read the review first.

1. **Ruling link targets stay on the tip.** Keep these four files, each with the reason "ruling link: <file>:<line>":
   - `alias-table-and-resolver-contract.md` (linked from `minimum-constitution.md:235`)
   - `cutover-write-lease-design.md` (linked from `minimum-constitution.md:244` and `evidence-payload-relocation-policy.md:15`)
   - `reports/phase-06/same-path-binding-blocker.json` (linked from `minimum-constitution.md:332`)
   - `reports/doc-inventory.md` (linked from `evidence-payload-relocation-policy.md:96`)

   Make the rule general in `build-design.py`, not a hand list: any file linked from a kept ruling or a kept navigation root stays, together with whatever those kept files link to in turn, up to a fixed point. Report how many files and bytes this adds. If the closure pulls in more than about 50 MB, stop and report the list instead of keeping it.

   For the other links from kept files into archived files (the review counted 118 kept files with 943 links to 631 archived files), add one line to `design.md` that gives the recomputed count and says how to follow such a link through the archive ref.
2. **Real cold timing.** In `rehearse.py`, before run 1, evict every file under the timing clone's `.git/objects` from the page cache with `os.posix_fadvise(fd, 0, 0, os.POSIX_FADV_DONTNEED)`. Record `fincore` (or an equivalent residency count) before and after the eviction. Then time:
   - one cold `git worktree add` of the reduced tip, plus two warm runs;
   - the same for the pre-freeze variant.

   Label each run cold or warm from the measured residency, not from its order. If the eviction cannot be shown to work, label run 1 "first run, warm page cache" and record that an owner `drop_caches` cold run is required at the final pin.
3. **Scratch outside the tree.** Move `rehearse.py`'s scratch from `archive/.scratch/` to `/tmp/fgos-work/w5-d5d/` (or `$TMPDIR`), so that a crashed run can never be staged.
4. Delete `audit/attempt-1/rehearsal.bundle`; nothing reads it (the review checked). Keep the rest of `attempt-1/`.
5. Re-run `build-design.py`, `rehearse.py` and `verify-design.py`. Update `manifest.json`, `receipt.{md,json}`, `rehearsal.json` and `verification.json`, and in the receipt table state counts and bytes before and after. Check A must stay green, with no new link findings.

Writable (exact): plans/260925-documentation-authority-unification/reports/phase-09/archive/**. No pair accounting (the Lead does it after the merge). Never a git write (the runner commits; your rehearsal clones under /tmp are yours), never the fgos CLI, never .fgos/ or secrets, never scripts/run-tests.mjs or npm test. Heavy IO: run one timing variant at a time, and delete your scratch at the end.

Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).
