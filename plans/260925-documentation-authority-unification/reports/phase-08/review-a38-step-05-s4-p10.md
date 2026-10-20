# review-a38 step-05 seam 4, part src-p10

Pin 95301cb9, read-only. No diffs in any of the 9 entries (all preserve, park or reject). Method: payload items, then pinned source checked for missed doc-path operands (grep of docs/, .md, readFile, core/ in every file).

## Per file

| file | verdict | items | notes |
|---|---|---:|---|
| scripts/check-doc-retirement.mjs | rework | 49 (4 refs, 45 tuples) | 1 outcome defect, 1 judgment point |
| scripts/check-glibc-ceiling.sh | ok | 0 | no doc references or tuples; nothing in source |
| scripts/check-hook-registrations-guarded.mjs | ok | 6 | all rejects correct (.claude/settings.json is tool config; console formatting) |
| scripts/check-locked-decisions-heading-drift.mjs | ok | 9 (2 refs, 7 tuples) | docs/history preserve is right (point-in-time records, excluded from repointing, not in a retiring root); 007234/007238-240 admit+preserve consistent with refs 003553/003554; 007237 and the message templates reject correctly |
| scripts/ci-asset-server.mjs | ok | 7 | temp asset dir, release-tag URLs: not documents |
| scripts/ci-external-consumer.ps1 | ok | 12 | temp/install dirs, env, .fgos\installation\bin (installer artifact, not a document) |
| scripts/ci-external-consumer.sh | ok | 17 | same; the 4 `readFileSync` digest reads are the activation JSON, non-document |
| scripts/decision-question-hook.mjs | ok | 7 | transcript read and message formatting; the line-4 comment cites core/skills/_shared/decision-question.md, not a legacy root |
| scripts/dispatch-decide-hook.mjs | ok | 3 | message formatting only |

Counts: 110 items reviewed (6 literal references, 104 tuples). Defects: 1 outcome defect (4 items). Rejects checked: all 77 reject/preserve tuples are non-document; none constructs or reads a document path.

## Outcome defects

D1. scripts/check-doc-retirement.mjs, line 44 passage (LEGACY_ROOTS = ['docs/specs/', 'docs/architect/']), same-passage rule (L12-71). Literals reference-002490 and 002492 are `preserve` (retirement-gate-identity), but tuple dynamic-007118 (the same line 44, passage 41-47, operand `LEGACY_ROOTS = ['docs/specs/'`) is `parked`. Same passage, two outcomes. The same split exists for dynamic-007123 (`isLegacyPath`, line 50, passage 47-53) against reference-002491's passage 45-51 (docs/history preserve, `isLegacyPath` at line 50 inside it).
Correction: one outcome per passage. Recommended: dynamic-007118 and dynamic-007123 join the preserve outcome (they are the gate's own legacy-root recognition; "no change to gate permitted"; the park text about an unbounded caller file set does not describe a string-prefix test over a constant). Alternative, if the Lead wants them parked: park 002490/002492/002491 as well with a real blocker. Dynamic-007119..007122 (lines 45-46, passage 42-48 overlapping 002490's 41-47) should also be restated so the overlap has one outcome: they build plans/ ledger JSON paths next to the constitution and read no docs path, so preserve or reject is the better fit than park.

## Lead-judgment questions

Q1. dynamic-007126 and dynamic-007127 (lines 74/83): the operand is a function parameter default (`retiringRoots = null) {`), admitted as path-operation and parked. The parameter holds already-loaded JSON; the function only compares edge target strings against it, so no path is constructed or read there. The actual read is dynamic-007107 (line 235). Suggest reject as parameter plumbing and let 007107/007112 own the outcome, or keep the park but say why a parameter default counts as a path operation.
Q2. preserve of 002490/002492 targets docs/specs/ and docs/architect/ (both retire in Phase 9). The witness is gate identity, not a "retained" claim, so the L12-69 rule against a retained witness is not triggered. Phase 9 still has to decide whether LEGACY_ROOTS keeps meaning after those roots are deleted. This is Phase 9's call, and the record should say so (checker/baseline changes are out of scope now).

## Record-text notes

- The park reason/dependency of 007101-007113, 007118-007123 are the same sentence ("no bounded artifact/export supplied; preserve gate bytes and require same-input post-cutover coverage"). It names a missing proof, not a blocker or a dependency item. Acceptable as inherited wording but weak against "park names a real blocker".
- 007118's operation text is "Bounded caller input" in the reason, but LEGACY_ROOTS is a constant; the text does not match the source.
- reference-002490/002492 rule text says "alias transformer", but this file is the retirement checker; wording only.

Status: DONE_WITH_CONCERNS
