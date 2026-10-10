# Independent ordinary-report formatting repair

Status: blocked before A25 verdict application; not the batch closure review.

Authorization: `ae3a742e13e5e84c13a651dd115747e6a50851ac`. Review: `2e43dd595d91b08f35346ce10d7bd8d47a745a29`. SYNC: `727a9bd0183cd870611ccc22f2ee44303b6f0493`. Accounting and frozen inventory: `da294ffb5a07765a2733f16c0d63516b2e0274a5`.

## Required action by an independent reviewer

Reorder the existing verdict tables in exactly these two committed reports:

- `plans/260925-documentation-authority-unification/reports/phase-06/review-2-carriage-labels-source.md` (48 rows: 46 ok, two rework).
- `plans/260925-documentation-authority-unification/reports/phase-06/review-2-carriage-labels-retired.md` (114 rows: 114 ok).

The current order is `Claim | Verdict | Source digest | Target digest | Note`. The unchanged native parser and committed-report gate require:

`Claim | Verdict | Note | Source digest | Target digest`

Keep every claim ID, verdict, note, source digest and target digest byte-identical. Preserve reviewer/author headers and ordinary mode. Replace the column order; do not append duplicate verdict rows. Commit these two report paths from a session independent of the author. No new judgment or broadened review scope is requested. The content/classification reports require no formatting change identified by this proof.

## Evidence and unchanged boundary

`scripts/propose-doc-decisions.mjs:330-345` parses the note as cell 3 and shown digests as cells 4-5. `scripts/check-doc-inventory-gates.mjs:645-651` requires that same order in the actual committed report.

The real native CLI against an isolated 48-row input exits 1 with `shown source digest changed for claim_fb0f85ad508f7f857ba4c0963879790a`. A Node audit calling the unchanged committed-report validator rejects all 46 source ok rows and all 114 retired ok rows as `decision-review-report-missing` (zero accepted of 160). Exact commands and per-row findings: `closure-review-format-blocker.json`.

No verdict has been applied; no physical decision row or candidate text has changed in this continuation. The author will not rewrite an independent report or change the gate. Main is synchronized, all seven Plan B documentation paths are accounted, and check A/ratchet pass at the accounting commit. The four authorized reworks, reverse closure, pending source preparation and post-application D/E remain UNPROVEN.

## Exact next action

After the two formatting repairs are committed: pull, apply the committed verdicts natively, perform the four A25 reworks, prepare every reverse/pending row under the existing contract, run both prior-registry proofs and unchanged checks, then publish the single closure review request.
