# Source parity: check live heading and block coverage too (Doer brief, records slice)

Status: Lead brief under L12-137 and L13-16. Read `reviews/w17-parity-rework-review.{md,json}` first.

The last turn made `carries/verify-carries.mjs` pass by reading the heading census, the section-block coverage and the pointer-patch drift at the historical witness pin `f534aeaea`. That proves the authoring, but it hides the current state. The checker is the permanent parity proof, so it must check both.

1. **W17-1, Medium.** Keep the witness-pin checks as they are, and add live checks against the working tree:
   - the heading census of `carries/source-heading-parity.json`;
   - "every current source section block has a parity row".

   Then fix what the live checks find, the way F1 was fixed:
   - refresh the 4 stale `docs/specs/distribution.md` heading rows (`data-dictionary`, `setup`, `business-rules`, `lịch-sử-quyết-định`), keeping the old values in history fields;
   - add a parity row for `distribution.md#unheaded-block-17` ("Terminal setup loses a row and a fix"), whose text lives in `docs/platform/packaging-distribution/spec.md`.

   Do not drop any row.
2. **W17-2, Low.** Add a live pointer-patch drift check as well. The check must name every unapplied patch whose `beforeSha256` no longer matches the live file. It fails on any drift not listed in an explicit, machine-readable final-pin duty list inside `carries/`. Today that list holds `bin/fgos.mjs` and `docs/backlog.md`, each with the reason "main changed after authoring; recompose at the final main import". Do not rewrite those patches.
3. **Proofs.** All of these must exit 0, with native addons blocked:
   - the carries checker;
   - `g0rework/verify.py` (it stays "partial" only for `checks.mjs`);
   - `rebind/rebind.py --check`;
   - `g9/sweep.py --check --pin HEAD`;
   - `misc-fix/verify.py` (restore `misc-fix/checks.json` if only volatile fields changed).

   Update `g0rework/receipt.md` and `receipt.json` with the counts before and after, the final-pin duty list, and every command with its exit code. Leave nothing new under `/tmp/fgos-work`.

Writable (exact):
- plans/260925-documentation-authority-unification/reports/phase-09/carries/**
- plans/260925-documentation-authority-unification/reports/phase-09/g0rework/**

Do not edit docs/, ledgers or other scripts. No pair accounting. Never a git write (the runner commits; read-only git is fine), never the fgos CLI, never .fgos/ or secrets, never scripts/run-tests.mjs or npm test, never `phase-08/audit-report.py`, and never load native addons. Always `python3 -B`. Scratch only in `tempfile` directories under `/tmp/fgos-work/`, removed at the end.

Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).
