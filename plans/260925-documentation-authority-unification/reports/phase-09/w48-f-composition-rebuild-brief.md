# Rebuild the F composition on the final main import (Doer brief, records slice)

Status: Lead brief under L13-30, L13-32 and L13-34. F is `eb161da46`, the merge of origin/main `947dc3103`. Read first: `owner-answers.md` L13-24 to L13-34, `fchain/receipt.md`, and the findings list `fchain/f-delta-findings-947dc3103.json`.

After F, the shared composition replay reports 199 findings on 61 files. Find it with `g9/check_phase9_decisions.py`, which calls `fchain/check.py` `compose(HEAD, additions=...)`.
- `conflict` 149: stale chain entries, whole-body witness preimage drift, composed preimage hash changes and absent `composedBy` postimages.
- `linkGuard` 42: moved-target, stale-label and missing-file.
- `ownerless` 8.

Before F, all of these were 0.

1. **Conflicts.** Main changed the preimage of each conflicting patch. For every one, rebuild the patch on the F bytes, through the record that owns it (`fchain/` sources, `preserve-premise/park-judgments/`, `g9/` additions, link retargets). Keep its intent and its owning decision. Never weaken a hash or witness check.
   - Where main's change makes a patch obsolete, retire it with that reason.
   - Where main's new bytes conflict with the decision the patch carries, stop on that patch and list it as needing a decision. Do not guess.
2. **Links (L13-28).** Fix every `linkGuard` finding by the L13-28 rule order, in `fchain/link-retargets.json`. Most of them are new main content that links into moved paths.
3. **Ownerless.** Give each of the 8 files the owner its path and content imply, through the record that assigns owners, or list it as needing a decision.
4. **Delta list.** For each gate (G0, G2, G6, G7, G9) list exactly which judgments, bindings or composed bodies changed at F. Put the list in `fchain/f-delta-receipt.json`; it is the input for the delta reviews.

Proofs, all exit 0:
- `g9/check_phase9_decisions.py` with 0 findings;
- `fchain/check.py --pin HEAD` (restore `check.json` if only volatile fields changed; delete only an untracked `chain-check-*.json`);
- `fchain/controls.py`, including the stale-label control, which must use a fixture that still exists at F;
- `check_shard.py --all`.

Write `fchain/f-rebuild-receipt.md` with counts before and after, every rebuilt or retired patch, the decision list if any, and every command with its exit code.

Writable (exact):
- plans/260925-documentation-authority-unification/reports/phase-09/fchain/**
- plans/260925-documentation-authority-unification/reports/phase-09/preserve-premise/**
- plans/260925-documentation-authority-unification/reports/phase-09/g9/**
- plans/260925-documentation-authority-unification/reports/phase-09/composition/**

Do not edit docs/, code, ledgers or rebind records; another turn owns those. No pair accounting. Never a git write (the runner commits; read-only git is fine), never the fgos CLI, never .fgos/ or secrets, never scripts/run-tests.mjs or npm test, never `phase-08/audit-report.py`, and never load native addons. Always `python3 -B`. Scratch only in `tempfile` directories under `/tmp/fgos-work/`, removed at the end.

Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).
