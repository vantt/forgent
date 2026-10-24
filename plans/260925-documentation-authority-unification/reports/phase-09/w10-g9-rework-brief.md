# G9 and composition rework after the W10 reviews (Doer brief, records slice)

Status: Lead brief under L12-137. Read first: `reviews/w10-g9-interim-review.{md,json}` and `reviews/w10-composition-rework-review.{md,json}`. Both found REWORK items, listed here in the order to do them. Local refs `keep/doer-pin-92260972c` and `keep/doer-pin-a27d85d0a` now keep the two old Doer commits reachable.

1. **Gloss witness #16** (`docs/platform/event-store/spec.md:1138`, "plan porting uses `project:porting`"). Reword its `w8:gloss:*` spec in `composition/patch-specs.json` so the line reads naturally and stays true, for example "in the plan, porting uses …". Then:
   - regenerate that spec's diff and witness;
   - replay the full chain with `patch --fuzz=0`, forward and rollback byte-exact;
   - rerun the citation-drift scan with the glosses applied (it must report 0 findings);
   - update `composition/receipt.md`.

   Also read every other gloss witness once more for the same fault (doubled words, a dangling article) and fix any you find the same way. List each fix you make.
2. **Stale recomposed bodies.** Commit 928f5cc14 rewrote the final-pin gloss patches for five specs (`docs/platform/{agent-protocol,event-store,git,process,terminal-control}/spec.md`), so `g9/recomposed.json` still holds the old bodies for them.
   - Recompose those five specs at the current composition chain, including the step 1 change.
   - Replay them with the same proof.
   - Change `g9/sweep.py --check` so it also compares each recomposed body's predecessor chain with the current composition chain, and exits 1 on any mismatch. That way, a later composition edit reopens G9.
   - Show that the new check fails before the recompose and passes after it.
3. **Duplicate-line classification.** 20 parked rows are classed `changed`, but their bound text equals the current text byte for byte. The case is a moved line that appears more than once in the file (for example `runtime-r20.jsonl:34`).
   - Fix the classifier so a byte-equal passage found at another place counts as `moved`.
   - Re-run the judgments for the affected rows.
   - Update the counts.
4. **Unexplained still-valid rows.** For the 5 rows marked still valid only because their own passage is unchanged: either give a reason why the changed dependency that put them in scope does not matter, or park them with an owner. One of those dependencies is `docs/specs/reading-map.md`, which is itself an old-path park, so it cannot be the reason they are valid.
5. **Ratchet exceptions pin.** In `scripts/check-legacy-docs-ratchet.exceptions.json`, `previousMainMergeAccounting.inputCommit` still names 92260972c.
   - Re-pin it to the plan-branch commit with the same `git patch-id --stable` (expected 5965143b4…), but only if `git show <old>:<path>` and `git show <new>:<path>` are byte-equal for `scripts/check-legacy-docs-ratchet.exceptions.json`. That way, `objectSha256` stays true. Otherwise leave it and say why.
   - Then run `node scripts/check-legacy-docs-ratchet.mjs`; it must exit 0.
6. Update `g9/receipt.md` with:
   - the new counts for each classification and disposition;
   - the five recomposed specs;
   - the check change;
   - every command, with its exit code.

   The final `g9/sweep.py --check` must exit 0 at your tree, and `composition` verify must stay green.

Writable (exact):
- plans/260925-documentation-authority-unification/reports/phase-09/g9/**
- plans/260925-documentation-authority-unification/reports/phase-09/composition/**
- plans/260925-documentation-authority-unification/ledger/decisions/**
- scripts/check-legacy-docs-ratchet.exceptions.json

Do not edit docs/: every doc change is a prepared, replayed patch. No pair accounting. Never a git write (the runner commits; read-only git is fine), never the fgos CLI, never .fgos/ or secrets, never other code or tests, never scripts/run-tests.mjs or npm test. Always `python3 -B`. Scratch /tmp/fgos-work/w10-g9-rework/ only; delete it at the end.

Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).
