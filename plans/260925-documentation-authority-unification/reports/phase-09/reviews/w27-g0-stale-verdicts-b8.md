Verdicts: 92 APPROVE / 4 REWORK

# G0 stale-verdict re-review, batch 8

Pin `1967445897d028d73f41f62a0808ae8b81e8c63a`. The batch was cut at `595c24b45`. Since then only review and batch files changed, so no docs or ledger rows moved. Rulings: L13-22 and L13-25. Machine records: [w27-g0-stale-verdicts-b8.json](w27-g0-stale-verdicts-b8.json). Each verdict carries `rowFingerprint`, computed with `g0join/join.py` `row_fingerprint`; each one equals the join's value at the pin.

## Method

- **Hashes.** Every stored `bindingSha256` recomputes with `ledgerfix/bindings.py` `digest()`. All 96 rows pass.
- **Target units.** All 96 targets were extracted with `rebind.py extract()` from a tempfile copy, under `NODE_OPTIONS=--no-addons`. In every row the anchor resolves to exactly one unit, its digest equals `targetUnitDigest`, and its ancestry is self-inclusive and matches.
- **What changed.** For each row I diffed its decision fields against the row as it stood at the commit of its last verdict (`join.decision_fields`). I judged the current decision text, not only the changed words.
- **Sources.** Each source unit was found by its digest across git history (93 of 96 rows). The s7 main-import sources came from the main pin `eab4d617b`. The 2 s14 envelope rows were checked against their `before` witness.

## REWORK

1. **s4-packaging-distribution-architecture `/claims/214`.**
   - The rationale correction changed only the SHA.
   - The text still names `release-manifest.md:220#unheaded-block-17`, the section "Retained Runtime Identity And Activation Source Detail", and a Legacy CLI link to `docs/architect` with "0 destination changes".
   - The real unit is block-23 at line 258, under "Canonical Release Tree Rules".
   - The link resolves to `docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md`.
2. **s5-root-boundary-sync `/registryGaps/35`** and **s9-runner-01 `/registryGaps/0`.**
   - The Target line (only its SHA was corrected) and the L12-44 note both name `runner.md:1219-1269#unheaded-block-102`.
   - The bound unit is block-101 at 1244-1294.
   - Block-102 is now a different unit (`289d09c0`).
3. **s9-runner-01 `/claims/12`.**
   - The supersede and the target are right: the target equals current legacy runner.md block-11.
   - The new rationale cites the resync-a adjudication of block-10. This paragraph's adjudication is block-11, s13 `/sourceBindings/343`. Block-10 is the rigor paragraph, carried at target block-4.

## Approved groups

- **g0-content-redecisions, 24 rows** (`/8`, `/77`-`/99`). These rows were created at c25e8cf6a, after their only verdicts, and are now judged in full.
  - 21 rows are verbatim: target digest equals source digest.
  - `/77` and `/81`: the source section is contained in the target, and the only extra line is the next section's anchor.
  - `/8`: the only difference is the depth change, plus one clause owned by `claim_b5695d38`. That clause is g0 `/bindingRefresh/9`, a supersede with changedClauses.
- **Two previously open REWORK rows, now resolved.** s4-successors `/registryGaps/22` and s5-authorities `/registryGaps/3`.
  - The residual record now binds `e8167a0a` and file `85a7a1f8`.
  - Residual lines 1, 2, 5, 9 and 10 recompute, and so does `residualSha256`.
  - The code span `d['executeAssignment'](a)` equals legacy.
- **s7-step09-n1 `/registryGaps/0` and `/1`: the w26 REWORK is resolved.**
  - The old wording now matches the bound source exactly.
  - Applying the clauses reproduces the target byte for byte.
  - The cited runner.md@0d200a3cd endpoints are the ADR headings and tables.
  - The N1 provenance is kept.
- **s14-resync-b `/bindingRefresh/8`: the drop is correct.**
  - The test reads only runner.md and work-state.md.
  - The two 0032 topics are each owned once, by s11 `/conservedClaims/7/bindings/2` and `/3`.
- **s14 `/374`, `/376`, `/604` and `/611`.** The fenced code is back to legacy bytes. **`/474`.** "Document type: Contract" sits in the holder metadata fence.
- **s13 `/sourceBindings/877`.** The RUL108 label came from main (d309519fa) and is in the current source.
- **s9 move rows (37) and s8-agent-confinement (11).** These are verbatim moves. Each corrected anchor matches the bound unit.
- **Rows whose rationale changed only in the Target SHA.** The SHA is now correct: s2 `/404`, s3 `/16`, s5 `/36`, s8-observe `/4` and `/2`, and s9 `/9`, `/484` and `/registryGaps/33`.
- **Current-binding notes.** s2 `/126` and s7 `/24` and `/25` are approved. The current legacy text occurs verbatim inside each current target.

## Notes (non-blocking)

- **The "Target unchanged since last reviewed digest X at C" sentence is stale.** Several rows keep it next to a corrected Target SHA, so the two now contradict each other: s2 `/404`, s3 `/16`, s5 `/36`, s8-observe `/4` and `/2`, and s9 `/9`, `/484` and `/registryGaps/33`.
- **Line ranges are stale in several rows:**
  - s2 `/404` says 322; the actual line is 354.
  - s3 `/16` and s5 `/36` are off by one.
  - The s8 "candidate lines" are off by 3-4.
- **s4-successors `/22` and s5-authorities `/3`:**
  - The rationale's list of residual lines is incomplete. The record also has item 1 and RUL80.
  - `placement.selected.textDigest` still holds the pre-restore value `299c5b49`.
  - The rationale cites `g0fix/partial-carry-residuals.json`, but `residualRef` points to `import2/`.
- **Out of scope.** The bound historical s7 main-import sources (`bed26a6b` and `f9156dbb` at `eab4d617b`) are no longer verbatim in the targets, because of the RUL106 and account-pin text. The current legacy text is verbatim in the targets, which is the basis w24 approved.
