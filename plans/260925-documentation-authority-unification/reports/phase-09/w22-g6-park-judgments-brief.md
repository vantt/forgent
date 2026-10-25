# G6: settle the owned-park premise judgments before F, one shard per turn (Doer brief, records slice)

Status: Lead brief under L12-137 and L13-20. Read `reviews/w22-register-met-local-review.{md,json}` (finding G6), `reviews/w8-g6-parks-review.md`, `reviews/w9-g6-fix-review.md`, `preserve-premise/receipt.md` and L13-10 and L13-20 in `owner-answers.md` first.

Your shard is named in the launch note: `preserve-premise/park-judgments/shard-<N>-ids.json`. Judge only those rows, which are in `preserve-premise/proof.json`. Each row is an owned park of one of three kinds:
- **park-unconfirmed-preserve-premise:** the action says to confirm source-bound, non-dereferencing semantics. Read the bound passage and its surrounding file at the current HEAD and decide:
  - **preserve-confirmed:** the passage is historical or source-bound, and it does not tell a reader to follow the operand as current authority. Quote the evidence: the marker, header, date or framing sentence, with its line.
  - **repoint:** the passage tells a reader to use the operand as current authority, and the operand changes or is removed at cutover. Name the successor holder and section from the ledger or `carries/` mappings, and prepare a patch in the existing prepared-patch format. Do not apply it.
  - **owned-park:** only if the repository truly cannot decide it. Give a named owner and a concrete next action.
- **park-source-removed-by-cutover / park-source-absent:** the source file is removed by the cutover. Decide whether the passage's claim has a successor:
  - **retire-with-source:** the claim is history of the removed file only. Give the reason.
  - **successor-bound:** name the successor holder, section and current unit digest.
  - **owned-park:** as above.

Rules:
- Every row gets its own disposition, evidence lines and current digests. Group rows that share one cause and give each group one explanation.
- The flip date is not needed. If a row truly needs it, mark it `needsFlipDate` with the reason; expect very few.
- Pin: HEAD at the start of your turn. Name it in the output.
- Output only `preserve-premise/park-judgments/shard-<N>.json`, with one object per row (`rowId`, `kind`, `disposition`, `evidence`, `successor?`, `patch?`, `owner?`, `nextAction?`, `pin`), and `shard-<N>.md`, with counts per disposition, the groups, every owned park, and the commands you ran with their exit codes.
- A script `park-judgments/check_shard.py --shard <N>` must check that the shard covers exactly the ids file, that every row has evidence lines that exist at the pin with matching digests, and that every prepared patch replays with `patch --fuzz=0` forward and backward in a tempfile copy. It must exit 0. If another shard's turn already wrote the script, reuse it unchanged; otherwise write it so that it takes `--shard`.

Writable (exact):
- plans/260925-documentation-authority-unification/reports/phase-09/preserve-premise/park-judgments/shard-<N>.json
- plans/260925-documentation-authority-unification/reports/phase-09/preserve-premise/park-judgments/shard-<N>.md
- plans/260925-documentation-authority-unification/reports/phase-09/preserve-premise/park-judgments/check_shard.py

Do not edit `proof.json`, docs/, ledgers, the register or other scripts. No pair accounting. Never a git write (the runner commits; read-only git is fine), never the fgos CLI, never .fgos/ or secrets, never scripts/run-tests.mjs, npm test or product tests, never `phase-08/audit-report.py`, and never load native addons. Always `python3 -B`. Scratch only in `tempfile` directories under `/tmp/fgos-work/`, removed at the end.

Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).
