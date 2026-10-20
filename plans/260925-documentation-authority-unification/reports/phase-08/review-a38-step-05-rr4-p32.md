# Review a38 step-05 rr4 p32 (s4-src-p32)

Scope: 9 source files under src/setup, 121 items (3 literal references, 118 dynamic tuples), no diffs in any file, 1 parked item. Pin aa8d3437.

## Per file

| File | Verdict | Items |
|---|---|---|
| src/setup/bin-discovery.mjs | ok | 23 (003794; 013559-013580) |
| src/setup/blind-steps-proven-pools.mjs | ok | 7 (013581-013587) |
| src/setup/config-merge.mjs | ok | 2 (013588-013589) |
| src/setup/event-store-checks.mjs | ok | 15 (013590-013604) |
| src/setup/event-store-fixes.mjs | ok | 6 (013605-013610) |
| src/setup/executor-posture-coverage.mjs | ok | 19 (013611-013629) |
| src/setup/executor-profile-warnings.mjs | ok | 9 (013630-013638) |
| src/setup/git-checks.mjs | ok | 15 (013639-013653) |
| src/setup/git-hooks.mjs | rework | 16 (003796, 003797, 013654-013667) |

## OUTCOME defects

D1. reference-003796, src/setup/git-hooks.mjs line 85, comment "no `.git` retained, per docs/specs/distribution.md".
- Recorded outcome: ADMIT, parked, blockedCategory source-input, with the blocker "requires final composed candidate document input set for the owning operation; current caller artifacts do not pin that candidate set".
- Rules broken: R4. That blocker is the boilerplate "missing candidate/export proof" sentence, and a comment has no owning operation or input set. R8. It is a comment pointer into docs/specs/** (retiring) with a live holder, so it should be patched. A "park" is wrong when a holder exists.
- Live holder: docs/platform/packaging-distribution/spec.md. Its "Retained Distribution Source Detail" section (line 459 on) carries the distribution.md source units, including the contributor hooks setup rules (around lines 634 and 808). distribution.md itself has the "Contributor hooks setup" section at line 146.
- Correction: replace the park with a source-only patch to that holder. The anchor must be the real heading in the promoted spec, which the Lead has to pick; no heading of that name was found by grep.
- Alternative: if the Lead finds that no passage in the live holder supports the claim, preserve the comment only as dated provenance with an explicit "tree retires" witness.
- Side effect: the parityObligation, proofCommand "missing" and proofScope fields are boilerplate, and the park's `reason` contradicts the outcome. It says the citation is "not an operative runtime read" yet admits and parks it.

## Record-text notes (no outcome change)

- 003794 (bin-discovery L2-3) and 003797 (git-hooks L29-30): the literals are REJECT/preserve with null nonDocumentUse, while the sibling comment pointer 003796 is ADMIT. Both point into docs/history/**, which stays, and both are only comments, so reject/preserve is consistent in outcome. The admission basis for comment citations should be stated the same way across all three (see Q1).
- dynamic-013662 (git-hooks L30) is on the same comment as 003797 and has the same outcome, but it is labelled "scalar-pass-through". It sits in a comment, so a comment-text label would be truer. dynamic-013661 (L26, `.githooks/` in a comment) is labelled "config-or-metadata", which is acceptable.
- Imprecise labels, rejects all true:
  - 013562 and 013559 are parameter defaults and 013562 is labelled "accumulator"; the R5 label should be scalar default.
  - 013569, 013572, 013577 and 013578 probe the fgos binary or `node_modules/.bin`, not documents. The label "scalar-pass-through" or "caller-data-formatting" is loose; "bin probe" is truer.
  - 013613, 013616 and 013628 emit `.fgos/config.json` and `~/.fgos/config.json`. These are config files, not documents; "state-event-store" is a loose label.
- The emitted strings in executor-profile-warnings L71 ("design.md §3.5") and L81 ("plans/260916-account-rotator/") name plan/design locations. Neither is under a legacy retiring root and neither has an item, so no outcome change. See Q2.

## Verification of the Round 4 extra checks

- Every ADMITted tuple names a pathOperand: there are none, because the only admitted item is the literal 003796. No dynamic tuple admitted or rejected hides a document read or write. I read all the pinned source, and the grep found no docs/, specs, architect, decisions or knowledge path constructed in these files.
- Every nonDocumentUse is true in substance: bin, PATH and hooks probes, `.git`, state/config paths, message formatting, finding path fields, and root-only values.
- Same-passage agreement holds: 003797 with 013662, and 003794 alone. 003796 stands alone on L85.
- Parks: one, defective as above. No retired-decision citation is present, so no successorNote is needed.

## Lead-judgment questions

Q1. Are comment-only citations (003794, 003797) meant to be REJECT/preserve while a comment-navigation pointer into a retiring tree (003796) is ADMIT? That reading is consistent with R8, but the nonDocumentUse field for the REJECT comments is left empty. Does the Lead want a "comment" category added there?
Q2. Is the emitted doctor output text in executor-profile-warnings L71/L81 (plan/design locations) out of scope? It names plans/ and a bare design.md, which are outside the legacy-root census.

Counts: 121 items reviewed; 120 correct; 1 outcome defect (D1); 0 diffs; 1 park (defective).

Status: DONE_WITH_CONCERNS
