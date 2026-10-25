# G9: decide the retention-or-move questions phase 08 left to this phase (Doer brief, records slice)

Status: Lead brief under L12-137 and L13-20. Read `reviews/w22-register-met-local-review.{md,json}` (finding G9) and `g9/receipt.md` ("carriedBlocker") first.

Seven phase-08 records carry 33 parked dependencies that name "Phase 9" as the decider:
- `tests-judgment-batch4:2`;
- `tests-judgment-batch6:1`;
- `cli-help-messages:3`;
- `gateway-contract:2`;
- `runtime-judgment-part-22:13`;
- `setup-doctor-roots:21`;
- `generators-skills-and-support:66`.

They are in `reports/phase-08/step-05-records/`. They ask whether files survive or move at the cutover: `docs/decisions/index.md` (15), `docs/enduser-docs-index.json` (10), the gateway contract yaml (3), `docs/architecture-manifest.json` (1), and 4 other phase-9 carries.

For each of the 33 entries, decide from the phase 09 cutover design: `phase-09-atomic-platform-authority-cutover.md`, `archive/` partition and retention, the `composition/` move set, and the ledger. The possible decisions are:
- **retained-in-place:** the file survives at its path. Cite the retention source.
- **moved:** name the destination path from the move set. List every reader that needs a retarget, and either name the existing prepared patch or add the reader to a new F composition list.
- **retired:** cite the retirement source and its successor, if any.

If the design does not decide it, propose a decision with its reason and mark it `leadDecisionProposed`. The Lead rules on those. Keep the WORK and registry export dependencies external, unchanged.

Output:
- `g9/phase9-decisions.json`: one object per entry (`record`, `pointer`, `file`, `decision`, `source`, `readers`, `patchRefs`);
- `g9/phase9-decisions.md`: counts, every decision with its source, and the proposals;
- `g9/check_phase9_decisions.py`: checks that all 33 entries are covered, every cited path exists at the pin, and every moved destination is in the move set. It must exit 0.

Do not change the `carriedBlocker` fields in this turn.

Writable (exact):
- plans/260925-documentation-authority-unification/reports/phase-09/g9/phase9-decisions.json
- plans/260925-documentation-authority-unification/reports/phase-09/g9/phase9-decisions.md
- plans/260925-documentation-authority-unification/reports/phase-09/g9/check_phase9_decisions.py

Do not edit docs/, ledgers, the register or other scripts. No pair accounting. Never a git write (the runner commits; read-only git is fine), never the fgos CLI, never .fgos/ or secrets, never scripts/run-tests.mjs, npm test or product tests, never `phase-08/audit-report.py`, and never load native addons. Always `python3 -B`. Scratch only in `tempfile` directories under `/tmp/fgos-work/`, removed at the end.

Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).
