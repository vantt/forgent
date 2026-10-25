# Register catch-up to the current plan HEAD (Doer brief, records slice)

Status: Lead brief under L12-137 and L13-6. The register (`preflip-gate-status.json`) was last generated at d7126c5b9. Many records and reviews have landed since. Regenerate it with `gate-reconcile/reconcile.py`, the one generator, from committed inputs at the turn-start HEAD. Read L13-16 to L13-27 in `owner-answers.md` and every review under `reviews/` committed since d7126c5b9.

Each gate's status must follow from committed evidence only. Expected, if the evidence holds; check each one yourself:

- **G0:** `g0join/join.py --pin <HEAD>` exits 0, with 1,929 of 1,929 effective rows approved (reviews w24 to w30). The F duties come from `g0rework/final-pin-duties.json`:
  - the delta verdicts at the actual F pin;
  - the conditional w8/w9 overlay approvals of L13-23.4, which depend on the rebased gap05 relocation id that `fchain` records.
- **G2:** the 187 judgments (L13-17), with their review status taken from the committed review.
- **G6:** the 787 premise judgments. The shard reviews in w23 and the rework review in w28 (104 APPROVE; its 2 REWORK items are answered by L13-26 and the `fchain/link-retargets.json` record). The current-passage-unbound rows and the composition stay at F.
- **G9:** 158 decisions, approved in w25. One composition door (L13-24). The WORK and registry exports stay external.
- **F composition (L13-24, L13-26):**
  - `fchain/check.py --pin HEAD` exits 0, with 0 `linkIntoMoveSet`.
  - Every prepared-patch source is listed in `fchain/manifest.json`, including `link-retargets.json`.
  - The F duty is to replay it at the F pin.
- **Ownership audit (L13-27):** drift is judged through `rebind.py --check`. `phase-08/audit-report.py` is `ok` at 4a4fefbe8, after the pair accounting in that commit.
- **G5:** met-local, except that the owner must accept the 8 restatements. That is an owner item.
- **G8:** the archive ref is created at F (L13-18).
- **G4, G10, G11:** external, as recorded.

Also:
- `cutoverReadiness` keeps the single order of L13-6. Recompute `fWindowSize` from the source files: add the link-retarget patch count and the rebased entries, and update every other count that has changed.
- Add a `followUps` list for items outside this plan, each with its source review:
  - in `docs/platform/work-state/spec.md`, Data Dictionary row 12 says `add` defaults to `executing`, against RUL18 and `bin/fgos.mjs`, which say `discovery`;
  - RUL59 says `intent` is retired, but still describes `edit --intent`;
  - about 15 old Vietnamese heading names are still quoted in that spec;
  - 36 rationale or reason strings in s2/s6/s14 start with whitespace.

Proofs, all exit 0:
- `gate-reconcile/verify.py`;
- `gate-reconcile/controls.py`.

Restore volatile fields that only a rerun changed. Update `gate-reconcile/receipt.md` with each gate's status before and after, and every command with its exit code.

Writable (exact):
- plans/260925-documentation-authority-unification/reports/phase-09/preflip-gate-status.json
- plans/260925-documentation-authority-unification/reports/phase-09/gate-reconcile/**

Do not edit docs/, ledgers, reviews, other records or scripts. No pair accounting. Never a git write (the runner commits; read-only git is fine), never the fgos CLI, never .fgos/ or secrets, never scripts/run-tests.mjs, npm test or product tests, never `phase-08/audit-report.py`, and never load native addons. You may read the committed audit output as evidence, but do not run it. Always `python3 -B`. Scratch only in `tempfile` directories under `/tmp/fgos-work/`, removed at the end.

Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).
