# Misc-fix check: verify the record at its own commit (Doer brief, records slice)

Status: Lead brief under L12-137.

Why: `python3 -B reports/phase-09/misc-fix/verify.py` now exits 1. The first thing it runs is `misc-fix/rebind.py --check`, which fails at `assert json.loads(SHARD.read_text())==shard` (line 91).

The check regenerates the misc-fix shard `ledger/decisions/s17-misc-review-fixes.json` at the record's `sourceHead`, then compares it with the **live** file. The import 3 resync (d786e305e) rebound some s17 rows in place, legitimately. Section 9.3 renumbered later anchors and changed the `updated:` date. It recorded the rows as they were before in `import3/binding-refresh.json`, and `rebind/rebind.py --check` exits 0 on the live ledger. Because of that, a one-shot authoring check that compares against live bytes breaks on every later rebind. The full rebind after apply at the final pin will break it again.

Do:
1. Change `misc-fix/rebind.py --check` so it checks the misc-fix authoring at the commit that wrote it, not against the live tree:
   - Compare the regenerated shard and record with the bytes at the commit that last wrote `misc-fix/binding-refresh.json`. Use `git show <commit>:<path>`; do not hardcode the commit, find it with `git log -1 --format=%H -- <path>`.
   - Run the effective-row loop against the shard and docs at that same commit. Read through `git show`, or through a scratch `git archive` of only the paths it needs, under `/tmp/fgos-work/w11-misc-pin/`.
   - Keep every existing assertion and its strength; only the source of the bytes changes.
2. Add one live check: every misc-fix overlay row either is still the effective binding in the live ledger, or is superseded or edited in place by a later recorded rebind, meaning a row that a later `binding-refresh.json`, or an `import*/` or `rebind/` record, lists with its preimage. List any row that is neither, and exit 1 if there is one. The live correctness of each binding stays with `rebind/rebind.py --check`; do not duplicate it.
3. Make the same pin-versus-live separation in `misc-fix/verify.py` wherever it reads live ledger or doc bytes for authoring proof. The earlier fix already pins `g6pin` to the `proof.json` sourceCommit, so follow that pattern.
4. Proofs:
   - `misc-fix/verify.py` exits 0 at HEAD. It rewrites `misc-fix/checks.json`; if the only change is volatile (time, pin), restore the previous bytes by writing them back from `git show HEAD:<path>`, and keep a real change only with a stated reason.
   - `rebind/rebind.py --check` exits 0.
   - A negative control in scratch fails: corrupt one misc overlay at its authoring commit copy, and the check must fail. Also drop one later-rebind preimage record, and the live check must fail.
   - Record the commands and exit codes in `misc-fix/receipt.md`, in a short new section.

Writable (exact):
- plans/260925-documentation-authority-unification/reports/phase-09/misc-fix/**

Do not edit ledgers, docs or other scripts. No pair accounting. Never a git write (the runner commits; read-only git is fine), never the fgos CLI, never .fgos/ or secrets, never scripts/run-tests.mjs or npm test. Always `python3 -B`. Scratch `/tmp/fgos-work/w11-misc-pin/` only; delete it at the end.

Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).
