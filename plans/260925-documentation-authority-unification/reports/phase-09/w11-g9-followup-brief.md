# G9 follow-up after the third import (Doer brief, records slice)

Status: Lead brief under L12-137. Read `reviews/w11-g9-rework-review.{md,json}` first. Run this turn at a tree that already contains the third main import accounting (`import3/`). That turn edited `scripts/check-legacy-docs-ratchet.exceptions.json` again.

1. **Stale judgment.** Row `phase-08/step-05-records/citation-ratchet-roots.jsonl:7` takes its evidence from `scripts/check-legacy-docs-ratchet.exceptions.json`. Re-judge that row, and any other row whose evidence file changed since d14d89865, at the current HEAD. Find those rows with `git diff --name-only d14d89865 HEAD` joined to the evidence paths.

   Then, at HEAD, rerun:
   - `g9/sweep.py --check`, which must exit 0;
   - `g9/verify.py --pin HEAD`, which must exit 0.

   Always pass the pin explicitly. The check reads committed bytes, so name the commit you judged at in the receipt.
2. **Three holder-lock glosses.** Witnesses #61, #62 and #64 (`docs/platform/holder-lock/spec.md`, about lines 420, 425 and 428) lost their `D1:`…`D8:` labels, so 11 sentences start in lowercase.
   - Restore the labels and reword so each sentence reads naturally and stays true.
   - Regenerate those diffs and witnesses, and replay the chain with `patch --fuzz=0`, forward and rollback byte-exact.
   - Rerun the citation scan with the glosses applied; it must report 0 findings.
   - Recompose any G9 body whose chain changed, so the sweep check stays at exit 0.
   - Then audit every witness mechanically for a sentence that starts in lowercase after a full stop, for a doubled word, and for a lost list label. Keep the complete per-witness result in `composition/w10-gloss-audit.json`, not a one-line summary.
3. **Body versus chain.** The chain check compares only the recorded metadata. Extend `g9/sweep.py --check` so it also checks that each recomposed body's bytes equal the bytes the current chain replays to. Prove it fails on one stale body in a scratch copy, and passes on the real tree.
4. **Trailing newline (low).** 274 passages differ from their bound text only by a final newline, and they are classed as changed. Treat a difference that is only a trailing LF as unchanged (or moved), and say so in the receipt. The dispositions should not change; if one does, list it.
5. Update `g9/receipt.md` and `composition/receipt.md`: the counts, the pin you judged at, and every command with its exit code.

Writable (exact):
- plans/260925-documentation-authority-unification/reports/phase-09/g9/**
- plans/260925-documentation-authority-unification/reports/phase-09/composition/**
- plans/260925-documentation-authority-unification/ledger/decisions/**

Do not edit docs/ or scripts/. No pair accounting. Never a git write (the runner commits; read-only git is fine), never the fgos CLI, never .fgos/ or secrets, never code or tests, never scripts/run-tests.mjs or npm test. Always `python3 -B`. Scratch /tmp/fgos-work/w11-g9/ only; delete it at the end.

Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).
