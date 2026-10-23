# w3-g2g6-delta: review of the D4b G2/G6 fixes (b25dadae2)

Reviewed at 6d275ad81. The delivery commit is b25dadae2 and the Doer pin is 3d0169f39. This was a read-only review. Scratch lives in shared clones under /tmp/fgos-work/w3-g2g6-delta/.

Verdicts: 103 APPROVE, 1 REWORK (Low). Every earlier REWORK item from w2-g2-census and w2-g6-preserve is fixed. G2 and G6 both stay unmet, as their receipts say. Full list: w3-g2g6-delta-review.json.

## Replay
- **join.py**: `--pin 3d0169f39 --rescan` ran twice in a clone at the pin. All 4 artifacts and stdout were byte-identical to each other and to b25dadae2.
  - At 6d275ad81 with the same `--pin`, only `registerSha256` differs. The register is read from the working tree; only `changedBindings` changed in it, not the census sites. This is Low.
- **proof.py**: `--pin` ran twice at the pin. All 4 artifacts and stdout were byte-identical and equal to b25dadae2. I changed only the scratch base path, to keep my writes under my own directory.
- Outside plans/, the sources at b25dadae2 equal the pin.

## G2: all fixed
- **Dynamic delta**: I recomputed the step-07 dynamic delta independently at the pin.
  - It has 143 sites, multiset-equal to post-pin-dynamics.json.
  - All 132 reviewed sites are bound: 77 test joins and 55 digest-bound REJECTs.
- **Judgments read at source**: I read all 13 reader hints and all 56 judgments. Each is correct:
  - lease stdout templates;
  - config.yaml/config.json reads;
  - a refusal filename;
  - a lock-row name;
  - YAML scalar typing;
  - stderr and $comment formatters;
  - Rust use/type lines;
  - YAML Segment paths;
  - Cargo crate paths.
- **Deleted sources**: 27 rows plus pc-d-1108 name 5a33989fa, and git confirms that commit deleted the files.
- **Recovery proof**: pc-d-0185/0186 name recovery_matrix_all_payload_kinds (511/512).
- **Rust/YAML locators**: every Rust proof sits at its `#[test]`/fn line and none is ignored. The YAML proof is golden_parse.rs:184/185 with loader mod.rs:28.
- **Custody text**: no row claims joined custody with empty proofs. The 116 helper rows now say that no caller is proved.

## G6: all fixed
- **Probes**: they run through the real `historical_evidence()`. My own variants also park: a far-away "e.g." under 5 reasons, and a Bee H1 or Example H2 nav row.
- **Live pointers**: the 29 rows park with evidence None and a digest-bound candidate successor.
- **Deleted consumers**: the 5 rows are `park-source-removed-by-cutover`. This now applies to all 162 rows in deleted consumers.
- **f07526**: it is now a repoint-proposal to agent-coordination/architecture/dispatch-control-plane.md.
- **f06167**: it now gets the dated note, because the before-snapshot guard rejects its old carriage reason.
- **Wrapper notes**: I enumerated the wrappers independently.
  - All 163 outside-snapshot runner.md wrapper lines are dated-note proposals across 90 files, with "effective only after the authority flip … Prepared successor". **No wrapper is missing.**
  - 7 are inside a snapshot and are correctly left unrewritten.
  - agent-coordination/spec.md:20 "Superseded by" has no G6 row because step-03 repoints it.

## Findings
1. **REWORK (Low, conservative)**: the example/external branch now matches only `span.text`, which on 726 of 783 rows is the bare token.
   - At the pin it confirms 0 rows.
   - The positive control uses a whole-line span that no real row has, so it is a phantom control.
   - Genuine same-line examples now park: f00167, f08807, f07822, f08072 and f08073.
   - Fix: match the bound line or `unit_at()`, and use a control with a token-only span.
2. **Low**: f07697, f08033 and f08047 have a candidate successor equal to the consumer itself. The Lead must not compose a self-link (L12-35(7)).
3. **Low**: `--pin` pins source blobs only. Plan inputs such as the register, records and review delta are read from the working tree.
4. **Info, Lead custody at F**: 7be0cbc52 and 6d275ad81 changed 15 docs after the pin. That affects 186 G6 rows and the successor digest of 86 wrapper proposals in runner/spec.md. No G2 row is affected.
5. **Info**: the carriage-declaration branch still has no section bound in files without a Literal Snapshot heading (691 rows). A scan found only whole-file carriers, so there are no new mislabels.
