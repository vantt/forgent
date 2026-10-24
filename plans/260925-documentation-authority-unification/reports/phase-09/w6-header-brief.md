# Candidate header blocks for four contract docs (Doer brief, docs slice)

Status: Lead brief under L12-137. With the ownership rebind applied (merge 2eb79909a), both reproduction recipes now pass `audit-ownership.mjs` and checks A and B. `checks.mjs` still exits 1 on **check H**, with 4 `missing-candidate-fields` findings ("no header block; missing: Document type, Audience, Purpose, Design status, Last reviewed, Related"):
- `docs/platform/herdr-web-dashboard/contracts/gateway-readiness.md`
- `docs/platform/packaging-distribution/decisions/vendored-yaml-parser.md`
- `docs/platform/runner/contracts/conserved-dispatch-doctrine.md`
- `docs/platform/work-state/contracts/non-transitioning-records.md`

These files carry loose `Document type:` / `Owner:` / `Status:` lines instead of the fenced ```` ```txt ```` header block the candidate docs use (see `docs/platform/work-state/contracts/knowledge-registry.md` lines 3-…).

Do:
1. Read how check H parses the header: the embedded `checks.mjs` in `reports/phase-06/step10-round5-reproduction.json` and the native checker it calls. Give each of the four files the same fenced header block as its sibling candidate docs, with every required field. Fill each field truthfully from the file's own content and owning area: Document type, Audience, Purpose, Design status, Last reviewed `2026-10-24`, Related (as links). Keep the existing facts (Owner, Status wording) inside the block or right after it; do not drop any claim text.
2. Run `python3 -B reports/phase-09/rebind/rebind.py --check`. If the header edit made bound rows drift, apply `rebind.py` (same rules: content rows go pending, A22) and record the rows in `rebind/rebindings.json` and `rebind/receipt.md` under a dated "header blocks" section.
3. Run `misc-fix/rebind.py --check` and `misc-fix/verify.py`; both exit 0.
4. A/B/H cannot run under your confinement. The Lead runs `reports/phase-08/audit-report.py` and the reproduction test after the merge, so do not claim them.

Writable (exact): the four docs above, plans/260925-documentation-authority-unification/pilot/decisions/**, plans/260925-documentation-authority-unification/ledger/decisions/**, plans/260925-documentation-authority-unification/reports/phase-09/rebind/**. No pair accounting. Never a git write (the runner commits), never the fgos CLI, never .fgos/ or secrets, never code or tests, never scripts/run-tests.mjs or npm test. Scratch /tmp/fgos-work/w6-header/ only.

Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).
