# w2-g6-preserve review: G6 preserve premises (D4, bade6b6b3)

Commit reviewed: cffe725b9. The proof itself is pinned to 3e2d05af8. Read-only review. Replays ran in a shared scratch clone at the pin under /tmp/fgos-work/w2-g6-preserve/.
Verdicts: 68 APPROVE, 50 REWORK. Full list: w2-g6-preserve-review.json.

## Replay
- I ran proof.py twice. Both runs exited 0, stdout was identical, and all 4 artifacts were byte-identical to each other and to the delivered files.
- I ran verify.py. It exited 0, with 7/7 artifacts byte-identical and 73/73 G7 wrapper paths covered.
- Identity conservation holds: 4,804 + 609 = 5,413 preserves, 38 rows excluded as retire-with-tree, and judgments.json has 1,134 open rows, each with an owner and a blocker.

## Findings (REWORK)
1. **The negative probes never test the evidence predicate.** Doer probes 1 and 3 are the same call, `premise(True,True,False,None,False)`. None of the three calls `historical_evidence()`. I ran my own probes through the real predicate:
   - A false retained pointer with an unrelated "e.g." 40 lines away is confirmed as history.
   - A navigation table row in a file whose H1 contains "Bee" is confirmed as history.
   - A mismatched passage parks. This is the only probe that behaves correctly.
2. **The external/example evidence branch searches the whole file.** `historical_evidence` runs `re.search(..., source)` over the entire file, not the passage. In 416 of 447 rows the marker sits outside the passage. 29 fgOS-owned live pointers are confirmed as history only because of a stray "e.g."/"ví dụ" elsewhere in the file. Each points to a target the cutover moves, and an exact successor exists:
   - AGENTS.md:13 and :60 point to docs/routing-handoff-contract.md.
   - gateway.rs and Cargo.toml point to docs/contracts/fgos-gateway-api-v1.yaml.
   - TaskDetail.tsx and Taskboard.tsx point to docs/ui-spec/....
   - Other files point to io-contract.md, coexistence.md and distribution-vision.md.

   This contradicts the receipt's own rule that a retained-path premise fails when its target disappears.
3. **Five rows are marked "reachability unchanged" but their source file is deleted** (f00515, f00521, f00525, f01225, f08411). The move deletes docs/README.md, docs/doc-governance.md and docs/transitional-switchboard.md. Each is replaced by an already-existing, non-identical target that carries a repointed link. So the preserved text does not survive, and the relative link would not resolve from the new location.
4. **The history-wrapper notes are not applied uniformly, which L12-35(3) requires.** There are 77 post-cut wrapper lines of the form "retired in 2180b4e…; see docs/specs/runner.md CoordinationSession":
   - 66 got a dated-note proposal.
   - 10 got none: f05646–f05742 (9 rows) and f06391 in a live playbook.
   - f06167 is labelled "inside literal carriage" but sits before "## Literal Snapshot". The proof accepts it because the carriage check only looks for the declaration somewhere above the line.
5. **f07526 (sample):** "Canonical architecture moved to: docs/architect/…" is navigation, and becomes false after the cut. It was accepted as carriage.
6. **Pin drift:** 90 rows sit in sources that changed between the pin and cffe725b9. 18 rows that were confirmed or marked reachable no longer bind at cffe725b9. Refreshing at final pin F is in Lead custody.

## Sound
- The 152 wrapper proposals: preserve-with-dated-note matches L12-35(3), and both successors exist after the cut.
  - runner/spec.md is the runner area successor.
  - h-aabefc85f0c9.md:25 holds the exact CoordinationSession section.
- One caveat: at the pin, runner/spec.md says "Canonical: No". The note's "Current successor" wording therefore relies on the authority flip.
- Sample: seed 20261023, 50 rows of confirmed history plus 14 rows of reachability. 63 of the 64 hold; the exception is f07526. Relative-link resolution from post-move locations only fails the 5 rows in finding 3.
- G6 is not met, which matches the receipt.
