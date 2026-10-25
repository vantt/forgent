# Verifiers account for recorded rebinds; carries generator matches the deduped heading rows (Doer brief, records slice)

Status: Lead brief under L12-137 and L13-13.2. After merge 3f225cfe7 (turn 722), two checks are red for reasons that are not data errors:

1. `g0rework/verify.py` fails `assert own['targetDigestDrift'] == []`. Turn 722 restored corrupted code spans in 3 docs under `docs/platform/`, and recorded the rebinds in `rebind/g0-direct-rebindings.json` and `rebind/g0-rework-rebindings.json`. Per L13-13.2, the authoring check verifies at its own pin, and live drift is accepted only when a recorded rebind accounts for it. Make the live part accept drift exactly when a recorded rebind row names that target, with the old and new digests that match. Any other drift still fails. Add a negative control for unaccounted drift and for a rebind row with the wrong digest.
2. `g0rework/refresh-carries.py --check` regenerates `carries/source-heading-parity.json` with a second identical "Release Tree Canonicalization" target, which turn 708 removed as a duplicate (heading row 55). Fix the generator so that it emits each target once, in the same order, and does not regenerate the duplicate. Its output must then equal the committed file byte for byte. Do not hand-edit the generated file.

Proofs, all exit 0 with native addons blocked:
- `g0rework/verify.py` (`partial` is fine, `ok` per its contract);
- `g0rework/refresh-carries.py --check`;
- `node P/carries/verify-carries.mjs`;
- `rebind/rebind.py --check`.

Record them, with their exit codes, in `g0rework/receipt.md`.

Writable (exact):
- plans/260925-documentation-authority-unification/reports/phase-09/g0rework/**

Do not edit ledgers, docs/, carries data, rebind records or other scripts. No pair accounting. Never a git write (the runner commits; read-only git is fine), never the fgos CLI, never .fgos/ or secrets, never scripts/run-tests.mjs, npm test or product tests, never `phase-08/audit-report.py`, and never load native addons. Always `python3 -B`. Scratch only in `tempfile` directories under `/tmp/fgos-work/`, removed at the end.

Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).
