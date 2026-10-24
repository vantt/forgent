# Archive rework, second part: direct ruling links only, then the cold run (Doer brief, records slice)

Status: Lead brief under L12-137. This continues `w5-d5d-brief.md`. The previous turn stopped correctly at the 50 MB guard: the transitive closure would add 637 files / 281,770,653 B (commit d3efc70c5 on this branch records `link-closure.json` and the stop log). **Lead ruling (A42):** do not keep the transitive closure.

1. **Keep direct ruling link targets only.** The rule in `build-design.py`: a file that a kept ruling or a kept navigation root links to *directly* stays on the tip. Links one step further (from those targets into archived files) are not followed. Expect the four targets the review named (`alias-table-and-resolver-contract.md`, `cutover-write-lease-design.md`, `reports/phase-06/same-path-binding-blocker.json`, `reports/doc-inventory.md`, about 784 KB). Report the exact list and bytes the rule produces. If it gives more than 50 MB, stop again.
2. In `design.md`, write one short paragraph that gives the recomputed count of links from kept files into archived files, and shows how to follow such a link through the archive ref, with an example command. Keep `link-closure.json` as the recorded evidence for why the transitive closure was rejected.
3. Then do items 2–5 of `w5-d5d-brief.md` unchanged:
   - a real cold timing run, using `posix_fadvise` eviction with residency recorded before and after, for both variants;
   - scratch outside the tree;
   - `rehearsal.bundle` stays deleted;
   - rerun `build-design.py`, `rehearse.py` and `verify-design.py`, and update the records.

   Check A must stay green, with no new link findings.

Writable (exact): plans/260925-documentation-authority-unification/reports/phase-09/archive/**. No pair accounting. Never a git write (the runner commits), never the fgos CLI, never .fgos/ or secrets, never scripts/run-tests.mjs or npm test. Heavy IO: one timing variant at a time, and delete your scratch at the end.

Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).
