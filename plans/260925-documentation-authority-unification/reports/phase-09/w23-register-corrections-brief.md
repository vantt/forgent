# Register corrections, verdict-join tool and locator fallback (Doer brief, records slice)

Status: Lead brief under L12-137 and L13-20.3. Read `reviews/w22-register-met-local-review.{md,json}` and L13-20 in `owner-answers.md` first. Reviews of the G6 premise shards and the G9 decisions run at the same time; do not edit those files or `reviews/`.

1. **`census-join/join.py:273` locator fallback.** When no evidence span matches the new pin, the code falls back to `evidence[0]`. That silently reverted the W21-approved locators of pc-d-1101 (:30), pc-d-0924 (:3868) and pc-d-0449 (:184). Fix it so that a missing match fails loudly, or rebinds through the row's recorded corrected locator. Then restore those three locators and replay `join.py --pin <HEAD at start>` twice, byte-identically.
2. **G0 verdict-join tool, built now so it is ready at F.** Add `g0join/join.py --pin <commit>`. It joins every `changedBindings` row and every later rebind or re-decision row to its effective ledger row, and checks that each is matched by an independent APPROVE, bound to the same `bindingSha256` and `targetUnitDigest`, in the per-row verdict files under `reviews/`. Where a review has no per-row verdict records, the tool lists that review as `aggregateOnly` and counts it separately; do not invent rows. It reports missing, mismatched and open-REWORK rows, and exits 1 if any exist. Run it at the current HEAD and commit the output as `g0join/join-<shortpin>.json`. A non-zero exit is fine; record the gaps honestly in `g0join/receipt.md`.
3. **G8.** Add one recovery sentence to `archive/design.md` for the retained JSON path strings: how a reader recovers a JSON path string that points into the archive. This is the W14 json-path-strings-undocumented note.
4. **Register.** Run `gate-reconcile/reconcile.py`, the one generator, so that the register:
   - G2: adds an F duty to compose the 4 unapplied comment retargets in `census-join/pointer-patches.json` into the F chain.
   - G4: adds an F duty to rerun the git one-door scan after the final main import.
   - G6: replaces the false "judgments were reviewed before F" text. The 787 premise judgments are settled in `preserve-premise/park-judgments/shard-{1,2,3}.json`, with their exhaustive review pending. Only the 137 current-passage-unbound rows and the composition stay at F. Keep G6 at `partial` until those reviews land.
   - G9: cites `g9/phase9-decisions.json` for the 33 phase-9 dependencies, with its review pending, and keeps only the WORK and registry exports external.
   - G0: cites `g0join/` and the W9/W10 overlay reviews.
   - Removes the stale "design-lap must not pull main" text everywhere.
   - `cutoverReadiness` states one order, consistent with L13-6: packet at met-local, then owner approval, lease, F, F duties, final ledger review, Land. It removes the "only then assemble the packet" item, adds a `fWindowSize` object with counts from source files (G6 unbound rows, post-apply bindings, glosses, delta reviews per gate), and lists every owner and external item.

   Rerun `verify.py` and `controls.py` (exit 0), and restore volatile fields.
5. **Proofs.** List every command with its exit code in the receipts you touch.

Writable (exact):
- plans/260925-documentation-authority-unification/reports/phase-09/census-join/**
- plans/260925-documentation-authority-unification/reports/phase-09/g0join/**
- plans/260925-documentation-authority-unification/reports/phase-09/archive/design.md
- plans/260925-documentation-authority-unification/reports/phase-09/preflip-gate-status.json
- plans/260925-documentation-authority-unification/reports/phase-09/gate-reconcile/**

Do not edit docs/, src/, test/, ledgers, reviews, shards or other scripts. No pair accounting. Never a git write (the runner commits; read-only git is fine), never the fgos CLI, never .fgos/ or secrets, never scripts/run-tests.mjs, npm test or product tests, never `phase-08/audit-report.py`, and never load native addons. Always `python3 -B`. Scratch only in `tempfile` directories under `/tmp/fgos-work/`, removed at the end.

Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).
