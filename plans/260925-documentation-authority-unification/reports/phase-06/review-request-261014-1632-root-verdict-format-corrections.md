# Independent correction request: ordinary verdict bindings

Author session: codex-session:19@2026-10-14
Review mode: ordinary
Report pin: 18962827a371c629b91475e6b2540a998fa30e9a
State: blocked for Lead report-format correction; Step 5 stays open

The scope contains 73 ok verdicts. The doer applied 68 decision verdicts and three native/list accounting verdicts with verbatim notes and the exact committed pin. Two source verdicts stay pending because the committed ordinary reports fail existing parser/validator contracts. No source/candidate text, truth sample, checker, gate, vocabulary, extractor or baseline was changed. No new truth sample or author verdict is offered.

Lead action: commit only the two mechanical report-format corrections below, keeping Reviewer, Author session, Review mode and every note unchanged. Retain the original report pin as provenance. No conservation or truth re-review is requested. The doer cannot apply a row against corrected scratch text while the committed report remains invalid.

## claim_e2377849e4ba8e3d3beaf70880e4ed23

Report: `plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-authorities-rework.md`
Shard: `plans/260925-documentation-authority-unification/pilot/decisions/b-io-contract.json`

Ordinary report source digest is 16 hex; validator requires 64 hex in its source-digest column. Full digest in note matches the native source.

Native source SHA256: `39e4ab1f30a6acc99de534a9fd16bd348b9ef8c1827664c0a7a50487f0587c0c`
Current target digest: `e1577e3b51decf45fde9d2754d740429b7714340ec90baf7e5e4156b316e33d1`

Original committed physical line (verbatim):

````text
| claim_e2377849e4ba8e3d3beaf70880e4ed23 | ok | Diff of docs/io-contract.md block 19 to the target shows exactly what the rationale lists: the example swap to review/approve/run and the "Xem fgos --help --json cho" deferral rewritten into COMMAND_REGISTRY, 15 verbs, no coordination, which the live manifest confirms; full source sha256 is 39e4ab1f30a6acc99de534a9fd16bd348b9ef8c1827664c0a7a50487f0587c0c, the sidecar carries only its 16-hex prefix. | 39e4ab1f30a6acc9 | e1577e3b51decf45fde9d2754d740429b7714340ec90baf7e5e4156b316e33d1 |
````

Correction: replace only the source-digest table cell `39e4ab1f30a6acc9` with `39e4ab1f30a6acc99de534a9fd16bd348b9ef8c1827664c0a7a50487f0587c0c`. Its full digest is already in the independent note; the native source and that note agree. The applier note requested the prefix, but the production validator at `scripts/check-doc-inventory-gates.mjs:650` requires 64 hex in the committed table. Changing the sidecar or a scratch report cannot satisfy that invariant.

Existing-validator diagnostic for the proposed approval (the persisted row remains pending):

````json
[
  {
    "type": "decision-review-report-missing",
    "message": "claim claim_e2377849e4ba8e3d3beaf70880e4ed23: no matching committed independent verdict with shown-text or checkpoint sensitivity bindings"
  }
]
````

## claim_ee85a9e312493fde5fa5dfcf8b3eb573

Report: `plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-authorities-templates.md`
Shard: `plans/260925-documentation-authority-unification/ledger/decisions/s5-root-template-conservation.json`

Last source verdict and candidate-list verdict are concatenated on one physical line; parser and validator require five cells per source verdict.

Native source SHA256: `6d5ef0e9fd38ab9de5b8bbb92f352e17a9232c8182e4298939aa23ccce892548`
Current target digest: `none`

Original committed physical line (verbatim):

````text
| claim_ee85a9e312493fde5fa5dfcf8b3eb573 | ok | Source unit unheaded-block-4 (lines 29-31) of docs/user/README.md; docs/user/README.md blob 8fdeba93 is identical at map pin fd6c9ab9e and HEAD with no diff and no carrier; unit digest recomputed equal; out-of-scope reclassification matches the map row and the vocabulary entry (no target owner); block 4 is the migration clause (existing roots stay active), labelled navigation; accepted because the text is untouched. | 6d5ef0e9fd38ab9de5b8bbb92f352e17a9232c8182e4298939aa23ccce892548 | none || Candidate-unverified list Root (70) | ok | 70 committed tuples equal the native strict E reverse rows for exactly the nine scopes against both prior registries (no missing, extra or duplicate); 59 old tuples unchanged and 11 new template units (3 History headers, 3 Source Metadata headings, 5 README units) all in history or non-promoted Candidate files with Canonical: No; 7 template digests and the unit extractor recompute equal. Candidate-unverified, no truth approval, as the request states. | none | none |
````

Correction: insert one newline between the final user-portal verdict and `| Candidate-unverified list Root (70) |`. The joined physical line has ten cells. The note, verdict and digests of both entries must remain byte-identical. The parser at `scripts/propose-doc-decisions.mjs:342` and validator at `scripts/check-doc-inventory-gates.mjs:649` require five cells for a source verdict.

Existing-validator diagnostic for the proposed approval (the persisted row remains pending):

````json
[
  {
    "type": "decision-review-report-missing",
    "message": "claim claim_ee85a9e312493fde5fa5dfcf8b3eb573: no matching committed independent verdict with shown-text or checkpoint sensitivity bindings"
  }
]
````

## Proof and resumption

`root-authorities-review-application-turn19.json` records every applied before/after decision, all three accounting notes and both blocked rows with their immutable lines and native source digests. `root-conservation-turn19-verification.json` records both-prior D, scoped strict E, native identity equality and compact registry preservation. Strict E is intentionally red; neither format failure is hidden by a closure exception.

After Lead commits these format corrections: apply the two pending ordinary rows with verbatim notes and the new committed evidence pin, retain 18962827a as original provenance, refresh from the compact persisted registry, rerun D/E/native equality, then resume the 559 undecided Step 5 source rows in at least three bounded packs of about 80 entries. The proposed 240-row authoring group is eight remaining templates (100), coexistence (25), id-systems audit (32), operator runbook (18), routing handoff (19), distribution vision (22), switchboard (13) and docs portal (11). No new decision or carrier for those 240 rows is committed in this blocked turn. AGENTS/CLAUDE wait for Step 10. Owner truth decision on 5/30 remains parked. No promotion, push, main merge or Step 6.
