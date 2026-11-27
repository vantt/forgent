---
phase: 6
title: "Measure topics per retrospective item"
status: draft
dependencies: [5]
---

# Phase 6: measure topics per retrospective item

## Inputs

- `plan.md` acceptance criteria 6 and 10; backlog `p-ixrbglli5o` "Done when" item 6; gaps G1, G2, G7.
- The `fgos.doc.locate` records of the measured period (`fgos observe` reads), with the mention counts phase 7
  adds.
- `fgos doc locate --eval <gold>` and its gold-file format (`apps/fgos/src/wiring/doc_locate.rs` `answer_eval`).
- The Work store events (`fgos events`): `topic.register`, `doc.reserve`, `doc.register`, `doc.attest`,
  `capture.handoff`, and the retrospective moves.
- An activated release that carries phases 1–4 (`fgos doctor`, check `active-release-matches-checkout`).

## Footprint

`plans/261127-1003-h2-step2-core-write-door/reports/**` and the "Known limits of finding" sub-heading of
`docs/platform/documentation/subcomponents/document-identity/spec.md` section 12 (dated measurement lines only). The
report path comes from
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
   Add per item: mentions listed, `missedBySearch` mentions, and whether reading one changed the decision.
3. **Where search lost to the scan.** Over every `fgos.doc.locate` call in the after period: calls with at least
   one `missedBySearch` mention, the share of calls, average mentions per call, and terms that hit the 20-section
   cap. A `missedBySearch` section that the writer then grew or `updated` is a case where search alone would have
   failed; list those paths. This answers, with data, how often locate alone misses what a literal scan finds.
4. **English over the Vietnamese specs (G2).** An agent that has not seen the specs' text writes 15 or more short
   English developer notes whose right answer is a section of a Vietnamese-language platform spec (gold groups
   chosen by a second agent). Run `fgos doc locate --eval <gold>` and report recall at 3 and 10, plus how many of
   the misses `mentions` would have listed. Keep the gold file under this plan's `reports/` for re-runs at the next
   pin raise.
5. **G1 residue.** From step 2, count drafts with no backticked name and no `--exact` term whose decision was later
   found wrong (parked at cleanup, or corrected by a person). Report the count; it is the evidence for or against a
   further guard.
6. Write the report: the baseline, the after count, the per-item table, sections 3–5, and any item that parked at
   cleanup with the gate's detail. Update document identity section 12 "Known limits of finding" with the measured
   numbers for G1 and G2 (a dated line each; the limits stay listed until a measurement closes them).
7. Land the report with `fgos land --paths`. Set the backlog row `p-ixrbglli5o` to done with the report link, set
   this plan to `done`, and set documentation spec section 4 step 2 to `done`. Update the DOCOS row of the program
   board as the board's rule says.

## Verify

The report exists. Every measured item reached cleanup. Zero topics or slots were opened without a person's request.
The report states the `missedBySearch` share and the G2 recall, whatever their values; a poor value is a finding,
not a failure of this phase.

## Rollback

Nothing to revert. A bad result reopens phase 4 with the per-item table as its evidence.
