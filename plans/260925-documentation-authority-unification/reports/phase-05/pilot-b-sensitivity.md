# Pilot B sensitivity tests

All mutations were created by a subagent separate from the authors and reviewers measured (fixed seed 20261007, seed scripts kept in scratch), and scored by the lead against a key the checkers never saw. Scratch inputs and outputs: `sens/` in the session scratchpad (not committed).

## 1. Structural mutations (the scoped strict gate)

Gate: `check-doc-inventory-gates.mjs --strict --decisions <copy of the seven b-* shards> --scope docs/specs/work-state.md --scope docs/io-contract.md`, one run per scenario, each scenario a copy of the shards with exactly one seeded defect. The gate reads target documents from the committed inventory commit, so a heading that was removed or renamed in a target is modelled by an anchor that does not exist in it.

| Scenario | Seeded defect | Gate result | Detected |
|---|---|---|---|
| m00 | none (unmutated copy) | exit 0, no finding | clean, as required |
| m01 | one row removed (b-behaviors) | `claims-unknown-blocking`, `claims-not-reviewed`, `claims-without-own-rationale`: 1 row each, naming the row | yes |
| m02 | one row removed (b-decisions-second) | same three open-data findings, naming the row | yes |
| m03 | one row removed (b-io-contract) | same three open-data findings, naming the row | yes |
| m04 | `targetAnchor` that does not exist (b-data-dictionary) | `decision-target-anchor-missing` plus `retained-claim-target-anchor-missing` | yes |
| m05 | `targetAnchor` that does not exist (b-decisions-first) | same two findings | yes |
| m06 | one claim decided in two shards | `decision-claim-duplicate` | yes |
| m07 | one claim decided in two shards | `decision-claim-duplicate` | yes |
| m08 | unknown claim id | `decision-claim-unknown` (the row it replaced also reappears as open data) | yes |
| m09 | `reviewed` without `reviewedBy` | `decision-reviewed-incomplete` | yes |
| m10 | stale `sourceUnitDigest` | `decision-digest-stale` | yes |

Result: 10 of 10 seeded defects reported, 0 findings on the unmutated copy (criterion met). Note: the two "two owners" scenarios of the plan are expressed as one claim decided twice, because the format holds one owner per claim row (a claim with two owners is not representable by design); the gate reports the duplicate.

## 2. Semantic mutations (independent reviewer on a seeded pack)

A separate subagent built a 30-row review pack from the real packs (5 of the 6 shards represented): 24 rows byte-identical to the real pack, 6 rows with one target text mutation each, positions shuffled. A fresh reviewer, given only the pack and the review brief, returned 24 verified and 6 defects.

| Seeded mutation | Reviewer verdict |
|---|---|
| added claim (extra sentence in a side-effects bullet) | `defect:addition` |
| swapped enum value (`awaiting-human` replaced by `todo`) | `defect:meaning-changed` |
| changed number (5 steps replaced by 8) | `defect:meaning-changed` |
| removed negation | `defect:meaning-changed` |
| dropped condition clause | `defect:loss` |
| deleted list item | `defect:loss` |

Result: 6 of 6 caught, 0 false flags in 24 controls (criterion: at least 5 of 6, at most 2 false flags: met). Limit: the mutations sit in review packs, not in the committed candidate documents; the reviewer procedure (pack with source, target and decision) is the thing measured. The reviewer knew nothing about the mutations but the pack format makes "compare two texts" the whole task, so the result is an upper bound for pure text defects.

## 3. The omission case

Measured in Pilot A (control, see `pilot-a-discrepancy.md` section 7): absence of the known dropped section was detected for 7 of 7 units, 6 of 7 as `unknown-blocking` (the lead's report states the open question about the seventh).

## 4. What the real review found and missed (step 6 data)

- Found by the six independent reviewers over 366 rows: 3 claim-kind defects (all returned once to the author, corrected, re-verified by a second reviewer). No text loss, addition or meaning change was found, which fits the data: 234 candidate blocks are byte-identical to their source unit and 4 carry one mechanical link or clause change.
- Missed by the reviewers, found later by the lead's block-reference check (every candidate block should be named by a decision): 12 rows of the data-dictionary shard pointed at the heading instead of the block that holds the text (11 merge rows of the CLI surface and the row with the replaced clause). The reviewers verified the text by section, so the pack target (a heading line) did not show it. The lead retargeted 11 anchors mechanically by exact text match and the twelfth (a changed block, so no exact match) by hand.
- Found by the lead (not by any reviewer): one source line (`Ngữ nghĩa:`) is in no claim unit because the unit extractor drops blocks under 20 non-space characters; it was carried in the candidate by hand (see the defects report for the corpus-wide count).

## 5. Sampling simulation (1,000 random draws, seed 20261007)

Input: the 3 defects found by the step 6 reviewers, at their row positions in their shards (entry shard rows 13 and 14 of 18, io-contract shard row 38 of 41). A 20% row sample drawn per shard:

- each defect is caught in about 20% of draws (0.214, 0.222, 0.200);
- at least one of the three is caught in 51.6% of draws; two or more in 11.2%; all three in 0.8%.

Reading: a 20% sample would have missed the defects of this pilot in about half of the runs. The defects here are rare (3 in 366 rows, 0.8%) and clustered in judgment fields (claim kind), so a sample size for Phase 6 cannot be derived from 3 events; it can only be stated that 20% gives no useful catch probability for a rare judgment defect, while the deterministic checks (anchors, digests, duplicates, unreferenced blocks, exact-text carry) cost nothing and cover 100%.
