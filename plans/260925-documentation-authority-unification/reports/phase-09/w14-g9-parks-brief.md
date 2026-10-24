# G9 parks: judge each owned park on its own merits (Doer brief, records slice)

Status: Lead brief under L12-137. The interim G9 work (`g9/receipt.md`, reviews w10 to w14) left **338 owned parks**. They came from 5 fixed rules, and all of them share one owner ("Documentation source-binding reviewer / Lead (G9)") and a generic next action. That is a placeholder, not a judgment. This turn replaces it with a judgment for each row.

For every parked row in `g9/judgments.json`, read the bound passage, the current passage at the pin, and the record that cites it. Then pick one disposition.

- **Still valid:** the record's claim stays true against the current text. Explain why in one or two sentences that name the specific changed bytes and why they do not matter.
- **Needs recomposition:** prepare a patch at current bytes in the existing `g9/` recompose format. Replay it with `patch --fuzz=0`, forward and rollback byte-exact, and add it to `g9/recomposed.json`.
- **Superseded or retired:** the record is historical and a later record owns the claim. Name the later record and pointer.
- **Owned park:** this is allowed only if the row truly cannot be decided from the repository. In that case it needs a named owner (an area spec owner, a lane such as WORK, SEAT or the Git owner, or the plan owner) and a concrete next action that someone could carry out.

Rules:
- Use the pin `git rev-parse HEAD` at the start of the turn, and name it in the receipt.
- Every row needs evidence: the current line numbers and digest, which the tools already produce.
- Group rows that share one cause, and give each group one explanation. Every row still gets its own disposition and evidence.
- Keep `g9/sweep.py --check --pin <pin>` and `g9/verify.py --pin <pin>` at exit 0.
- Record the counts before and after, per disposition.
- In `g9/receipt.md`, add a section listing every remaining owned park with its owner and next action.

Writable (exact):
- plans/260925-documentation-authority-unification/reports/phase-09/g9/**

Do not edit docs/, ledgers, composition or other scripts. If a row can only be fixed by changing one of those, choose "needs recomposition" for a doc change, or list the row as `needsWrites` in the receipt. No pair accounting. Never a git write (the runner commits; read-only git is fine), never the fgos CLI, never .fgos/ or secrets, never scripts/run-tests.mjs or npm test. Always `python3 -B`. Scratch only in `tempfile` directories under `/tmp/fgos-work/`, removed at the end.

Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).
