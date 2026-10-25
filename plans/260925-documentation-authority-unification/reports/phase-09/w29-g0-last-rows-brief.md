# G0: last three rows, plus the same heading-title gap across g0 rows (Doer brief, records and docs slice)

Status: Lead brief under L12-137 and L13-25. Read `reviews/w28-g0-verdicts-b9.{md,json}` first (24 APPROVE / 3 REWORK).

1. `g0-content-redecisions.json` `/bindingRefresh/45`: also name the heading-title change, "Khai việc (add) — bề mặt nội bộ" (`docs/specs/work-state.md:864`) to "Add Verb" (`docs/platform/work-state/spec.md:713`). Then check every other `g0-content-redecisions.json` row for the same gap, a title change inside the unit that the rationale does not name (the review suspects `/47`). Name each one you find.
2. `s4-packaging-distribution-successors.json` `/registryGaps/22` and `s5-root-authorities-boundary-gaps.json` `/registryGaps/3`: update `placement.content` to the current unit text. Its hash must equal `placement.selected.textDigest` (`e8167a0a…`), and `ledgerfix/verify.py`'s `p['content'] == unit['text']` must hold. Search all ledger shards for any other placement whose `content` does not hash to its `selected.textDigest`, and fix those the same way.
3. `docs/platform/work-state/spec.md` still refers to the old headings "Khai việc" and "Nộp vấn đề tự do", which no longer exist. Retarget those references to the current headings. Then rebind any affected ledger row through `rebind/rebind.py`, and record the rebinds.
4. Fix the non-blocking "(current lines)" notes the review lists (s2 `/404`, s8-observe `/4` and `/2`, s9 `/9` and `/33`): say "historical lines at <commit>".

Set `reviewStatus: pending` on every changed row. Proofs:
- `rebind/rebind.py --check` exits 0.
- `ledgerfix/verify.py` (or the existing placement check) exits 0.
- `node scripts/check-legacy-docs-ratchet.mjs` exits 0.
- `g0join/join.py --pin HEAD` shows only the rows changed in this turn as stale.

Record everything, with every command and its exit code, in `g0join/followup-receipt.md`.

Writable (exact):
- plans/260925-documentation-authority-unification/ledger/decisions/**
- docs/platform/work-state/**
- plans/260925-documentation-authority-unification/reports/phase-09/g0join/**
- plans/260925-documentation-authority-unification/reports/phase-09/rebind/**
- plans/260925-documentation-authority-unification/reports/phase-09/import2/partial-carry-residuals.json

Do not edit legacy docs, the register, reviews or other scripts. No pair accounting. Never a git write (the runner commits; read-only git is fine), never the fgos CLI, never .fgos/ or secrets, never scripts/run-tests.mjs, npm test or product tests, never `phase-08/audit-report.py`, and never load native addons. Always `python3 -B`. Scratch only in `tempfile` directories under `/tmp/fgos-work/`, removed at the end.

Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).
