---
phase: 6
title: "Measure topics per retrospective item"
status: draft
dependencies: [5]
---

# Phase 6: measure topics per retrospective item

## Inputs

- `plan.md` acceptance criterion 6; backlog `p-ixrbglli5o` "Done when" item 6.
- The Work store events (`fgos events`): `topic.register`, `doc.reserve`, `doc.register`, `doc.attest`,
  `capture.handoff`, and the retrospective moves.
- An activated release that carries phases 1–4 (`fgos doctor`, check `active-release-matches-checkout`).

## Footprint

`plans/261127-1003-h2-step2-core-write-door/reports/**`. The report path comes from
`fgos convention path --kind report --slug h2-step2-topics-per-retrospective-item`. Write it under this plan's
`reports/` if convention allows it there; otherwise write it where convention says and add that path here first.

## Steps

1. **Baseline.** Take the retrospective items moved to cleanup in the 30 days before phase 4's commit. Count the
   `topic.register`, `doc.reserve` and `doc.register` events whose capture or source capture is that item, and divide
   by the number of items. Record the query (a script under `.fgos/runtime/tmp/`, its text pasted into the report).
2. **After.** Run the retrospective loop on the next real items, at least 5, or every item in the pool if there are
   fewer. Record for each: claims stated, decision per claim, units grown, handoffs, decisions recorded for a carrier
   outside the registry, topics or slots opened (expected 0), whether the item reached cleanup, and the locate
   `partial` flag.
3. Write the report: the baseline, the after count, the per-item table, and any item that parked at cleanup with
   the gate's detail.
4. Land the report with `fgos land --paths`. Set the backlog row `p-ixrbglli5o` to done with the report link, set
   this plan to `done`, and set documentation spec section 4 step 2 to `done`. Update the DOCOS row of the program
   board as the board's rule says.

## Verify

The report exists. Every measured item reached cleanup. Zero topics or slots were opened without a person's request.

## Rollback

Nothing to revert. A bad result reopens phase 4 with the per-item table as its evidence.
