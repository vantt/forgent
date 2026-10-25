# Gate register: reconcile every blocker with the review chain (Doer brief, records slice)

Status: Lead brief under L12-137. `preflip-gate-status.json` has fallen behind the review chain. For example, G6 still says "no exhaustive APPROVE over the 1,423 open judgment/note rows", but `reviews/w8-g6-parks-review` (1,260 rows) and `reviews/w8-g6-judgments-review` (163 rows plus every overturn) cover all 1,423, and `reviews/w9-g6-fix-review` approved the fixes for their 41 REWORK rows. Likewise, `reviews/w8-lead-fixes-review` re-reviewed c5586146c.

Task: for every gate G0 to G11, and for every entry in `blockers`, `remaining`, `cutoverReadiness.beforeFinalPin` and `cutoverReadiness.atFinalPinUnderLease`, decide one of:

- **cleared:** a later commit and an independent review settle it. Remove it from the open lists and add it to a new `cleared` array on the gate. Each entry is `{item, clearedBy: [commit...], reviews: [path...], verdict}`, where the verdict is quoted from the review file.
- **still open:** keep it, and correct counts or wording that later work changed. Every number must come from a file you read.
- **moved to F:** a ruling (L13-n in `owner-answers.md`) or a review defers it to the final pin. Move it into `atFinalPinUnderLease`, citing the ruling.

Then set each gate's `status`, `commit` and `evidence` from what remains. A gate is `met-local` only when nothing in it remains before F, apart from owner, external or F items. Rewrite `cutoverReadiness.summary` to say which gates are met-local and what still blocks the cutover approval packet.

Read, at least:
- every file in `reviews/` (its verdict line and the findings in the JSON);
- `owner-answers.md` from L13-1 to L13-16;
- the receipts of `g0rework/`, `g9/`, `import3/`, `misc-fix/`, `preserve-premise/`, `composition/` and `carries/`;
- `git log --oneline` of the plan branch.

A Doer turn running in parallel edits `carries/**` and `g0rework/**`. Do not read their uncommitted state. Use what is committed at your start HEAD, and name that HEAD in `asOf`.

Proof: write `gate-reconcile/receipt.md` and `receipt.json`. List every item with its decision and evidence, and give the counts per gate before and after. A script in `gate-reconcile/` must check that every `reviews:` and `evidence` path exists, and that every `clearedBy` commit is an ancestor of HEAD. It must exit 0, with `python3 -B`.

Writable (exact):
- plans/260925-documentation-authority-unification/reports/phase-09/preflip-gate-status.json
- plans/260925-documentation-authority-unification/reports/phase-09/gate-reconcile/**

Do not edit docs/, ledgers, reviews or other scripts. No pair accounting. Never a git write (the runner commits; read-only git is fine), never the fgos CLI, never .fgos/ or secrets, never scripts/run-tests.mjs or npm test, never `phase-08/audit-report.py`, and never load native addons. Scratch only in `tempfile` directories under `/tmp/fgos-work/`, removed at the end.

Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).
