# Refresh bindings, carries and the ratchet at the final main import (Doer brief, records slice)

Status: Lead brief under L13-30 and L13-34. F is `eb161da46`, the merge of origin/main `947dc3103`. Read first: `owner-answers.md` L13-27 and L13-34, `rebind/` (records 149–154 are the format to follow), `carries/`, and `scripts/check-legacy-docs-ratchet.exceptions.json`.

1. **Drift rows.** The ownership audit reports 27 target-digest drift rows that the rebind check does not account for:
   - `docs/specs/runner.md` 8;
   - `work-state.md` 7;
   - `distribution.md` 4;
   - `docs/architecture-manifest.json` 3;
   - `confinement-authority.md` 2;
   - `component-boundary.md`, the install how-to and `dispatch-module-boundaries.md`, 1 each.

   Main changed these targets after the last import. For each row, record a target-digest edge in `rebind/g0-rework-rebindings.json`, in its existing format, with `affectedBindings` complete. Name the main commit that changed the bytes, and judge whether the claim still holds on the F bytes:
   - if it holds, record a rebind;
   - if it does not hold, list it as needing a delta decision; do not write one.

   Leave new edges `authored-pending-independent-review`. You cannot run the audit itself. Reproduce the failing rows with the embedded ownership scripts, as `rebind/rebind.py --check` already does.
2. **Carries.** `carries/verify-carries.mjs` fails on `ledger/decisions/s11-preflip-carries.json /unitCarries/248`, and possibly others. Refresh the current source anchor and digest from F in the fields the checker reads. Keep the history in the existing history fields.
3. **Ratchet.** `node scripts/check-legacy-docs-ratchet.mjs` reports 9 unaccounted legacy edits; main edited legacy `docs/specs/*` after the last import. For each one, update or add the exception in `scripts/check-legacy-docs-ratchet.exceptions.json` to the F digest. Give the main commit that made the edit as provenance and use the existing exception format. Do not widen any rule.

Proofs, all exit 0:
- `rebind/rebind.py --check`;
- `node plans/260925-documentation-authority-unification/reports/phase-09/carries/verify-carries.mjs`;
- `node scripts/check-legacy-docs-ratchet.mjs`;
- `g0rework/refresh-carries.py --check`;
- `g0join/join.py --pin HEAD`.

Write `rebind/f-refresh-receipt.md` with the rows, edges, carries, exceptions and every command with its exit code.

Writable (exact):
- plans/260925-documentation-authority-unification/reports/phase-09/rebind/**
- plans/260925-documentation-authority-unification/reports/phase-09/carries/**
- plans/260925-documentation-authority-unification/reports/phase-09/g0rework/**
- plans/260925-documentation-authority-unification/ledger/decisions/**
- scripts/check-legacy-docs-ratchet.exceptions.json

Do not edit docs/ or the fchain, preserve-premise or g9 records; another turn owns those. No pair accounting. Never a git write (the runner commits; read-only git is fine), never the fgos CLI, never .fgos/ or secrets, never scripts/run-tests.mjs or npm test, never `phase-08/audit-report.py`, and never load native addons. Always `python3 -B`. Scratch only in `tempfile` directories under `/tmp/fgos-work/`, removed at the end.

Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).
