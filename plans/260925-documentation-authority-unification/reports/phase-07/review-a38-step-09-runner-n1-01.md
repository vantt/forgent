# A38 independent review: Step 9 runner N1 citation repairs and reproduction accounting

- Reviewer: `reviewer:sonnet-session:a8067cf7969ee80df@2026-10-18`
- Author session (from request): `codex-session:fgos-run_unit-run-1792311894f50c@2026-10-18`
- Review mode: ordinary
- Reviewed commit: 681a8600505d09a872effe8e171c21967d407a02 (detached worktree `/home/vantt/projects/forgentX-s8-review`); content pin b919e2b9b, prior pin e6b7efeec
- Scope: 65 entries in 3 parts (36 / 18 / 11), all deep-read. Nothing was written to any repo. I did not run the fgos CLI, the full suite, native inventory, D/E or the comparator. Part 3 was verified from the recorded receipts only.

## Independent verifications

1. Citation lines checked at this commit. `docs/specs/runner.md` heading lines: 2354 = `### 0028` (launcher rename), 2416 = `### 0029`, 2590 = `### 0031`, 2897 = `### 0034`. Lines 2477 and 2609 are the 2x2 role-grid text ("Xếp thành lưới 2×2: (1, buông) = launcher; ..."). `bin/fgos.mjs:4426` is the `StoreError ... unknown verb` throw and `:4514` is `refuseHelp("unknown verb ...")`. The architecture file's diff matches this mapping row by row. For example `work` and `child work` map to 0029 at 2416, `executor` and `capability` map to 0034 at 2897, `launcher` maps to 0028 at 2354, and `driver` and `orchestrator` map to 0029 at 2416 and 0031 at 2590. The operations file moves 4410,4498 to 4426,4514. The diff e6b7efeec..b919e2b9b for the two files is 10 changed lines in the architecture file and 1 in the operations file, with no other prose change.
2. Identity-source delta. Between e6b7efeec and 681a86005 the only non-plan, non-script files changed are the two runner files. Only the changed-file list was inspected for that delta. `scripts/check-decision-citation-drift.baseline.json` and `scripts/check-legacy-docs-ratchet.exceptions.json` also differ, but they arrive via commit 2296413a2 (the A46 main-import accounting commit), which is outside this request's delta and is not identity source. They are noted below as an observation.
3. Re-run of the extractor on both versions of both files (e6b7efeec vs 681a86005). Exactly 5 units changed digest: architecture heading `bảng-đối-chiếu-từ-vựng-dispatch` (heading digest includes its section payload), `unheaded-block-4`, `unheaded-block-5`; operations heading `gate-a-...-evolve` and `unheaded-block-26`. Anchors and unit counts are unchanged (8 / 8 and 74 / 74). The three neighbor-context rows (architecture block-3, operations block-25, block-27) are digest-stable and their occurrence hashes change only via neighbor context, as stated.
4. The request's authentication script ran on this worktree and printed `{"checked":65,"parts":3,...}`. It confirmed part sha256 and size limits, per-entry data bindings, live-file hashes, unit pins, native transitions against the registry, reproduction pairs against the live manifests, and the whole-registry delta (see item 5).
5. Whole-registry delta from the script. Every unit, gap and retired-unit record outside the 8 allowed changes is deep-equal to the content-commit registry. Every old claimId is still present (knownIDsLost 0). The only new IDs are the 3 successors, and no other document row changed. This confirms nothing was lost and no identity was transplanted or approval carried. The three positional predecessors (`claim_6dba…`, `claim_9175…`, `claim_1b81…`) remain in `identityGaps` with their own digests. Their successors `claim_79fd…`, `claim_f4dd…`, `claim_f94e…` are fresh native IDs with `origin: added-since-e6b7efeec`. The two headings keep their `claim_a1f4…` and `claim_ab56…` lineage.
6. `env -u CLAUDE_CODE_SESSION_ID node --test test/scripts/doc-rationale-reproduction.test.mjs test/scripts/check-legacy-docs-ratchet.test.mjs test/scripts/check-decision-citation-drift.test.mjs` passed: tests 67, pass 67, fail 0.
7. Recorded D/E/comparator results (read, not re-run):
   - D passed on all 3 prior sets with 0 fatal findings.
   - Strict E ran 3 times with identical output. Each run failed with exactly 8 fatal types: files-unknown-blocking 35, claims-unknown-blocking 2436, claims-partial-carry 28, claims-not-reviewed 4504, claims-without-own-rationale 2436, identical-units-multiple-owners 362, registry-gaps-without-disposition 233, candidate-blocks-unreferenced 2716. These are exactly the A46 main-import sets plus the held, partial and unreferenced sets.
   - The comparator receipt has exit 1 and ok=false with 24 errors, byte-equal to the 24 errors in `step-09-accounting-comparison.json`.
   - The open-set comparison covers 10 comparisons (32 files, 2112 unknown, 2112 rationale-less, 233 gaps, 324 declared carry, 24 comparator errors, 4504 holds, 28 partial, 362 groups, 2716 union), each with unexpected=[] and missing=[]. It rebinds only the 5 N1 tuples, and I confirmed each pair against the extractor digests above (3 new claimIds and 2 retained ids). It lists 0 Phase 7 own additional open sets.
   - The ratchet is clean with 0 findings.
   - Doc-tests receipt is 67/67 with fullSuiteRun false.
   - The execution receipt records two killed inventory attempts (exit 137) with no evidence claimed from them.

## Per-entry verdicts

| Entries | Content | Verdict | Evidence |
|---|---|---|---|
| part-01 native-transition-001 | architecture heading, retained claim_a1f4, digest-changed | ok | extractor digest e6b7efeec vs 681a86005 differ as recorded; registry after-row equal |
| native-transition-002, -003 | architecture block-4 / block-5 moved to identityGaps (predecessors retain identity) | ok | gap rows retain own digests; registry check |
| native-transition-004 | operations heading, retained claim_ab56 | ok | digest 054ab408 confirmed |
| native-transition-005 | operations block-26 to gap | ok | as above |
| native-transition-006, -007, -008 | new native successors for arch block-4, arch block-5, ops block-26 | ok | fresh IDs, origin added-since-e6b7efeec, digests equal extractor output |
| current-009 .. 016 | 5 changed digests + 3 neighbor contexts (arch block-3, ops block-25, block-27) | ok | the script recomputed context and occurrence hash; digests match the extractor |
| displaced-017 .. 021 | 5 displaced successor bindings | ok | prior tuples vs currentNative consistent with transitions |
| decisions-022 .. 028 | 7 target decisions repointed to N1 digests | ok | targetUnitDigest equals the new unit digests (for example ec0d27fd, 054ab408, e6db142a, 33dec38b, dd65649c); prior rationale kept as history and each now explicitly says "N1 rebind at b919e2b9b ... no approval carry"; reviewStatus pending |
| routing-029, -030 | X-DEFECT-06 and -08 cross-area citation bindings | ok | rebound to current lines (2477/2609/2897 and 4426/4514), which I verified |
| gap-decision-031 .. 033 | 3 supersessions of positional predecessors | ok | target digests equal the new units; no identity transplant, pending status |
| document-034, -035 | document hashes for the two runner files | ok | blob/digest match; matches the post-review-edits table |
| boundary-036 | registry delta receipt | ok | confirmed in verification 5, plus 2 identity-source files only; the other receipt claims (candidate lists unchanged, reader key unchanged, Phase 7 plan unchanged) are consistent with the diff; I did not re-derive the sealed reader key |
| part-02 reproduction-pair-001 .. 008 | 8 existing pairs (scripts manifest), refreshed live hash | ok | live sha256 matches the file; pair present in the manifest's exception list; commit is an ancestor and touched the path |
| reproduction-pair-009 | new pair (9ac0f42fb, phase-07 plan), scripts manifest | ok | exists in the `exceptions` array; the commit touched the file; reproduction tests pass |
| reproduction-pair-010 .. 017 | 8 existing pairs (readOnlyScripts) | ok | same checks |
| reproduction-pair-018 | new pair (9ac0f42fb), readOnlyScripts manifest | ok | same checks |
| part-03 gate-001 .. 003 | D on both / identity / phase02 | ok | exit 0, fatal 0; identical output across priors |
| gate-004 .. 006 | strict E | ok | red only for the A46 open sets (counts listed above); no extra category |
| ratchet-007 | ratchet | ok | clean, 0 findings |
| comparison-008 | comparator receipt | ok | exit 1, ok=false, 24 errors identical to the recorded baseline errors; no extra error |
| doc-tests-009 | targeted tests | ok | independently reproduced 67/67 |
| open-set-comparison-010 | exact open-set comparison under A46 | ok | all 10 comparisons clean; only the 5 N1 correspondences rebind |
| execution-011 | execution receipt | ok | serialized; no candidate bytes edited by the carry; failed attempts honestly flagged as no evidence |

Total: 65 ok, 0 rework, 0 hold.

## Rework items

None.

## Observations (no action required, not rework)

- A bounded text scan I attempted for "first-parent non-merge commits touching plan phase files" was too crude to be a valid reproduction of the guard's own pair logic (it counts every phase-file commit). It is not evidence for or against the new pairs. The guard's own test suite, which passed 67/67, and the script's exact-pair checks are the evidence used for entries 009 and 018.
- The scripts files `check-legacy-docs-ratchet.exceptions.json` and `check-decision-citation-drift.baseline.json` differ from e6b7efeec through commit 2296413a2 (the main-import accounting commit). They are outside this request's identity-source delta and N1's claim of "no baseline change" is about this package. The Lead may want to confirm that commit was already covered by an earlier review.
- The remaining line reference `dispatch-control-plane-redesign.md:125` and `:175/:210` in the architecture table was not in scope and was not re-checked.
- Rationale-only wording was not treated as rework.

Status: DONE
Summary: 65 ok, 0 rework, 0 hold. Citation fixes land on the correct lines at 681a86005 (ADR 0028/0029/0031/0034 headings, role-grid, both unknown-verb throws). Only the two runner files changed in the identity source. Re-carried units bind to current bytes with nothing lost and no approval carried. The three doc-tooling tests pass 67/67. Recorded D is green and strict E/comparator are red only for the A46 main-import open sets (24 comparator errors identical to baseline).
