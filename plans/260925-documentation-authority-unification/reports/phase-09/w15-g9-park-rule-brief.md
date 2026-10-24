# G9 park rule: judge drift, carry existing blockers (Doer brief, records slice)

Status: Lead brief under L12-137. Read `reviews/w15-g9-parks-review.{md,json}` first.

**Lead ruling (L13-14).** G9 answers one question: did the source drift break the record's claim? A blocker the record already carried from phase 08 is not a G9 question. Typical examples are a Work export it waits for and registry inventory rows. That blocker stays owned where it was recorded.

So, for each of the 15 records that carry such a phase-08 blocker, set the G9 disposition from the drift alone:
- **still-valid**, if the drift leaves the claim true;
- **needs-recomposition**, only if the drift itself requires a doc change (not the blocker);
- **superseded**, if a later record owns the claim;
- **owned-park**, only if the drift question itself cannot be decided from the repository.

Then add a field `carriedBlocker` that gives the record and pointer of the phase-08 blocker and says that it stays open there. Apply this rule to all 15 records at once, including `runtime-judgment-part-27:35` and `:39`, `generators-skills-and-support:200`, `part-28:6`, `part-22:13` and `setup-doctor-roots:21`. If a row moves out of needs-recomposition, remove its patch from `g9/recomposed.json` only when no other row uses that patch.

Other fixes:
1. `step04-029:1` (`approve.mjs`) was retired as a whole. Only 2 of its 5 history references were removed (by e71381aba), and the other 3 are still present unchanged (lines 267, 308 and 362). Make it still-valid for those 3, and retire only the 2 that were removed.
2. In the backlog parks' next action, "regenerate `docs/backlog.md`" is wrong because the backlog is no longer generated. Say the owning writer edits it.
3. Correct the reason text the review found wrong or thin:
   - `tests-judgment-batch5:25`: the RESEARCH.md comparisons were removed;
   - `runtime-judgment-part-26:2`, and the one other row with the same pattern: every passage is gone, yet the row stays still-valid; either supersede it or explain why not;
   - the rows whose reasons skip the changed bytes in `AGENTS.md` and `transitional-switchboard.json`;
   - the two rows in groups that do not fit their reasons.
4. Proofs:
   - `g9/sweep.py --check --pin <pin>` exits 0;
   - `g9/verify.py --pin <pin>` exits 0;
   - the receipt has counts before and after, the pin, the list of 15 records with each record's `carriedBlocker`, and every command with its exit code.

Writable (exact):
- plans/260925-documentation-authority-unification/reports/phase-09/g9/**

Do not edit docs/, ledgers or other scripts. No pair accounting. Never a git write (the runner commits; read-only git is fine), never the fgos CLI, never .fgos/ or secrets, never scripts/run-tests.mjs or npm test, no native addons. Always `python3 -B`. Scratch only in `tempfile` directories under `/tmp/fgos-work/`, removed at the end.

Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).
