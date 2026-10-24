# W10 import 3: account main import 571a996f5 and re-sync its legacy edits (Doer brief)

Status: Lead brief under L12-137 and L13-6 (re-sync legacy drift in batches). This turn follows the import 2 turn closely. Read its brief `w3-import2-brief.md` (this directory), its receipt `import2/receipt.md`, and its review `reviews/w4-import2-review.md`.

Why: `node scripts/check-legacy-docs-ratchet.mjs` exits 1 at plan HEAD. Three files fail with an "exception but digest mismatch" error: `docs/specs/confinement-authority.md`, `docs/specs/reading-map.md` and `docs/specs/seat-binding.md`. Merge 571a996f5 brought in 69 main commits (`git log --oneline 571a996f5^1..571a996f5^2`). Between them they changed those three legacy files, `docs/backlog.md`, and four `docs/platform/**` files (holder-lock and secrets among them). No one accounted for that merge or re-synced it.

Common rules are the same as in `w3-import2-brief.md`:
- Read `preflip-execution-plan.md` §1–§2 and `owner-answers.md` (L13-*).
- Never write to git in this repository; temporary fixture repositories under /tmp are fine.
- Never run the fgos CLI against this repository.
- Never touch `.fgos/` or secrets.
- Never run `scripts/run-tests.mjs` or `npm test`.
- Use `python3 -B`. Use scratch `/tmp/fgos-work/w10-import3/` only, and delete it at the end.
- Run only single tests, with `env -u CLAUDE_CODE_SESSION_ID FGOS_HOST_BIN=<releasePath>/bin/fgos node --test <file>`.
- Do no pair accounting. Do not write owner-answers, progress or gate-status.
- For anything outside the writable list, stop and report it under `needsWrites`.

Tasks:
1. **Merge accounting for 571a996f5.** Write it to `import3/merge-accounting.json` in the same format as `import2/merge-accounting.json`. Include the exact parents and base, every changed path under `docs/**`, `AGENTS.md`, `CLAUDE.md` and the switchboard, and how the plan side resolved each one. Run the Step 0 binding check on every changed candidate document under `docs/platform/**`.
2. **Re-sync.**
   - Rerun `late-areas/scan-legacy-drift.mjs` at HEAD; it writes `late-areas/legacy-drift.json`.
   - Carry every missing changed unit into its successor, using the import 2 method. The units come from the three legacy specs above; the `confinement-authority.md` change is the largest at +67 lines.
   - Add rebind rows under the declared recipe.
   - Rerun the scan until it reports zero missing.
   - Then confirm with `python3 -B reports/phase-09/rebind/rebind.py --check` (exit 0) and `python3 -B reports/phase-08/audit-report.py`, where audit-ownership must exit 0 and must report no failing rows.
3. **Ratchet.** Refresh the three mismatched exception digests in the existing `mainMergeAccounting` format only:
   - name 571a996f5 as the input, with a truthful rationale;
   - change no baseline, no allowance and no other exception.

   `node scripts/check-legacy-docs-ratchet.mjs` must then exit 0. Also run the evidence relocation `--before` check, as the import 2 turn did.
4. Write `import3/receipt.md` and `import3/receipt.json`: counts, every carried unit with its successor anchor, the ratchet entries changed, and every command with its exit code.

Writable (exact):
- docs/platform/**
- plans/260925-documentation-authority-unification/ledger/decisions/**
- plans/260925-documentation-authority-unification/phase-09-atomic-platform-authority-cutover.md
- scripts/check-legacy-docs-ratchet.exceptions.json
- plans/260925-documentation-authority-unification/reports/phase-09/import3/**
- plans/260925-documentation-authority-unification/reports/phase-09/late-areas/legacy-drift.json

Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).
