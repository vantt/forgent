# Closing re-review 03 - step 09 close rework

Reviewer: reviewer:sonnet-session:ad171439f0165ad9b@2026-10-19
Reviewed commit: a97d954d0 (detached, read-only worktree)
Part sha256: 3b651c20384349f9187a1dd08b50fe4934b3909506199929d0522ed7cc1e6230 (verified equal; part-01.json, 50 entries)

## Verdict summary

50 ok / 0 rework. No candidate-content defect. One non-blocking concern (below) about a stale citation that pre-dates this rework and was not in the stated scope.

## Per-entry verdicts

| entry | verdict | evidence |
|---|---|---|
| lead-citation-1 | ok | Diff 6f88f5d8e..1b3302680 is citation-only. run.mjs:569-576 is exactly the `provenance: { kind: unit-run ... }` object; assignment.mjs:443-444 and 626-628 are the declared/inline `contractPolicyVersion/normalizerVersion` stamps. Evidence sha matches. |
| lead-citation-2 | ok | Diff 6f88f5d8e..1b3302680 is citation-only. run.mjs:569-576 is exactly the `provenance: { kind: unit-run ... }` object; assignment.mjs:443-444 and 626-628 are the declared/inline `contractPolicyVersion/normalizerVersion` stamps. Evidence sha matches. |
| native-transition-1 | ok | Portable bindings-check recomputed all 6 native transitions against committed bytes (6 transitions, 100,042 known ids preserved). |
| native-transition-2 | ok | Portable bindings-check recomputed all 6 native transitions against committed bytes (6 transitions, 100,042 known ids preserved). |
| native-transition-3 | ok | Portable bindings-check recomputed all 6 native transitions against committed bytes (6 transitions, 100,042 known ids preserved). |
| native-transition-4 | ok | Portable bindings-check recomputed all 6 native transitions against committed bytes (6 transitions, 100,042 known ids preserved). |
| native-transition-5 | ok | Portable bindings-check recomputed all 6 native transitions against committed bytes (6 transitions, 100,042 known ids preserved). |
| native-transition-6 | ok | Portable bindings-check recomputed all 6 native transitions against committed bytes (6 transitions, 100,042 known ids preserved). |
| queue-236 | ok | bindings-check re-extracted units from committed source: digest, previous/next context, occurrence and context hash recomputed equal; native row equals registry; before/after queue rows equal. |
| queue-237 | ok | bindings-check re-extracted units from committed source: digest, previous/next context, occurrence and context hash recomputed equal; native row equals registry; before/after queue rows equal. |
| queue-238 | ok | bindings-check re-extracted units from committed source: digest, previous/next context, occurrence and context hash recomputed equal; native row equals registry; before/after queue rows equal. |
| queue-242 | ok | bindings-check re-extracted units from committed source: digest, previous/next context, occurrence and context hash recomputed equal; native row equals registry; before/after queue rows equal. |
| queue-243 | ok | bindings-check re-extracted units from committed source: digest, previous/next context, occurrence and context hash recomputed equal; native row equals registry; before/after queue rows equal. |
| queue-244 | ok | bindings-check re-extracted units from committed source: digest, previous/next context, occurrence and context hash recomputed equal; native row equals registry; before/after queue rows equal. |
| ADR-context-1 | ok | Supplemental occurrence binding recomputed by bindings-check against committed ADR-006 bytes (4 bindings); boundary note says it is not an invented queue row. |
| ADR-context-2 | ok | Supplemental occurrence binding recomputed by bindings-check against committed ADR-006 bytes (4 bindings); boundary note says it is not an invented queue row. |
| ADR-context-3 | ok | Supplemental occurrence binding recomputed by bindings-check against committed ADR-006 bytes (4 bindings); boundary note says it is not an invented queue row. |
| ADR-context-4 | ok | Supplemental occurrence binding recomputed by bindings-check against committed ADR-006 bytes (4 bindings); boundary note says it is not an invented queue row. |
| target-1 | ok | Decision target row equals file at rowIndex, before equals 1b3302680 version, reviewStatus pending, sourceUnitDigest unchanged (bindings-check). |
| target-2 | ok | Decision target row equals file at rowIndex, before equals 1b3302680 version, reviewStatus pending, sourceUnitDigest unchanged (bindings-check). |
| target-3 | ok | Decision target row equals file at rowIndex, before equals 1b3302680 version, reviewStatus pending, sourceUnitDigest unchanged (bindings-check). |
| target-4 | ok | Decision target row equals file at rowIndex, before equals 1b3302680 version, reviewStatus pending, sourceUnitDigest unchanged (bindings-check). |
| predecessor-1 | ok | Gap disposition pending, no approval; target digest matches a registry unit; predecessor id retained as identity gap (bindings-check). |
| predecessor-2 | ok | Gap disposition pending, no approval; target digest matches a registry unit; predecessor id retained as identity gap (bindings-check). |
| displaced-228 | ok | Historical B0 tuple unchanged vs prior queue (displacedB0Units deepEqual); only current successor binding changed. |
| displaced-234 | ok | Historical B0 tuple unchanged vs prior queue (displacedB0Units deepEqual); only current successor binding changed. |
| superseded-02-rows | ok | 26 -02 rows listed as superseded with obsoleteDigests; rule states no approval carries; none carries a verdict in this part. |
| pin-X-DEFECT-06 | ok | Re-read runner.md 2477/2609/2897; fileSha256 matches HEAD; spanSha256 (line bytes without newline) recomputed equal for all 3; line 2897 is the ADR 0034 heading cited by the statement file; verdict pending. |
| pin-X-DEFECT-08 | ok | Re-read bin/fgos.mjs 4426/4514 (unknown verb throw / refuseHelp unknown verb); span hashes recomputed equal; statement file h-51f5cd7279fd.md line 456 cites 4426,4514; fileSha matches. |
| dependent-file-pins | ok | 0fc67b5f... equals sha256 of the committed Assignment doc; 18 rebinding fields all point to it; checks-reproduce shows 131 rows/403 files/97 spans/97 probes, 0 mismatches. |
| candidate-1 | ok | Candidate tuple rebound to current unitDigest, reviewStatus pending; old nested receipts retained only under priorEvidenceReceipt (history); no approval carried. |
| candidate-2 | ok | Candidate tuple rebound to current unitDigest, reviewStatus pending; old nested receipts retained only under priorEvidenceReceipt (history); no approval carried. |
| candidate-3 | ok | Candidate tuple rebound to current unitDigest, reviewStatus pending; old nested receipts retained only under priorEvidenceReceipt (history); no approval carried. |
| candidate-4 | ok | Candidate tuple rebound to current unitDigest, reviewStatus pending; old nested receipts retained only under priorEvidenceReceipt (history); no approval carried. |
| candidate-5 | ok | Candidate tuple rebound to current unitDigest, reviewStatus pending; old nested receipts retained only under priorEvidenceReceipt (history); no approval carried. |
| ADR-scope | ok | Scope 1084 unchanged, ADR-006 outside it; 35 unknown files stay the prior 35 (compare-reproduce unexpected 0 missing 0). |
| reproduction-pairs | ok | Both manifests byte-equal HEAD (sha recomputed); later tracked plan commit scan empty; newPairs [] so no exception arrays changed. |
| doc-tests | ok | Log sha e910a033 matches; log tail: 67 tests, 67 pass, 0 fail; command is the exact three-file run. |
| D-both | ok | Receipt exit 0, fatal 0, no fatal types. |
| D-identity | ok | Receipt exit 0, fatal 0, no fatal types. |
| D-phase02 | ok | Receipt exit 0, fatal 0, no fatal types. |
| E-both | ok | Receipt exit 1, 8 fatal categories; 35 files / 2436 unknown / 2436 rationale-less / 233 gaps / 4504 holds / 28 partial / 362 groups / 2716 candidate units; identical across the three E priors. |
| E-identity | ok | Receipt exit 1, 8 fatal categories; 35 files / 2436 unknown / 2436 rationale-less / 233 gaps / 4504 holds / 28 partial / 362 groups / 2716 candidate units; identical across the three E priors. |
| E-phase02 | ok | Receipt exit 1, 8 fatal categories; 35 files / 2436 unknown / 2436 rationale-less / 233 gaps / 4504 holds / 28 partial / 362 groups / 2716 candidate units; identical across the three E priors. |
| ratchet | ok | Re-ran ratchet: exit 0, clean (995 legacy files; 26 accounted edits, 1 new). |
| exact-open-continuity | ok | compare-reproduce passed: all 9 comparisons expected==actual, unexpected 0, missing 0, only the four native correspondences. |
| portable-comparator | ok | portable-comparator-reproduce: exit 1, 24 errors (15 candidate union + 9 diagnostics), equals recorded comparison; actual/expected/gate hashes authenticated. |
| check-A-and-pins | ok | checks-reproduce passed: historyViolations 0, workingViolations 0, pins 131 rows 0 mismatches. |
| native-bindings-auth | ok | Re-ran bindings-check: passed true, 6/6/4/4/2, 1231 unchanged queue rows, noApprovalCarry. |
| scope-boundary | ok | Production scope inputs byte-equal HEAD and prior receipt; scope 1084 unchanged; ADR-006 outside scope documented; frozen-input/path boundary verified by Check A (0 violations). |

## Portable-check outputs

- `review-check.mjs /tmp/fgos-work/p7-close-rework-03-review` (after reading all 5 scripts; only git reads, writes under /tmp/fgos-work): exit 0, `{"passed":true,"entries":50,"parts":1,"totalPartBytes":252033}`. Sub-checks:
  - bindings-check: passed, 6 native transitions, 100,042 known ids preserved, 6 queue + 4 supplemental bindings, 4 target rows, 2 gap dispositions, 1231 unchanged queue rows, noApprovalCarry.
  - checks-reproduce: historyViolations 0, workingViolations 0, pins 131 rows / 403 files / 97 spans / 97 probes, 0 mismatches.
  - compare-reproduce: all comparisons expected==actual, unexpected 0, missing 0 (35 files, 2436, 2436, 233, 4504, 28, 362, 2716, 24 errors).
  - portable-comparator-reproduce: exit 1, 24 errors, equal to recorded comparison.
- `git diff --check`: clean (exit 0).
- Lead diff 6f88f5d8e..1b3302680: exactly the two citation changes (run.mjs:334-338 -> 569-576; assignment.mjs 456-459,663-666 -> 443-444,626-628).
- Code reads: run.mjs 569-576 is the `provenance: { kind: 'unit-run', unitRunId, role, round, binding, declared? }` object. assignment.mjs 443-444 = `contractPolicyVersion/normalizerVersion` in declared provenance; 626-628 = same two plus `validators` in inline provenance. Correct.
- runner.md 2477/2609/2897 and bin/fgos.mjs 4426/4514 read; span hashes recomputed equal (hash is of the line without trailing newline).
- Ratchet re-run: exit 0. Doc tests: 67/67 from recorded log (not rerun; npm test forbidden, log sha matches). D x3: exit 0 fatal 0. E x3: exit 1, 8 fatal, identical. Check A: 0 violations.
- Reproduction manifests: byte-equal HEAD, no new pairs, so no exception arrays changed.

## Concern (non-blocking, outside the changed sentences)

Other code-line citations in the two files were checked as asked:
- Assignment doc line 31 (table row): `assignment-runner.mjs:431,560,574 (provenance.kind inline/declared/unit-run)` does not point at provenance.kind. Current lines 431/560/574 are a worktree realpath check, a comment on inline mutating re-verification, and a supervisor-liveness doc comment. Actual provenance.kind uses in that file are around 368, 387, 500, 514, 1164. This row existed unchanged at 6f88f5d8e and is not part of the line-72 sentence or this rework's declared scope.
- ADR-006 line 60: `execution-contract.mjs:345-346,371-382` for the budget telemetry claim; 371-382 is the budget validation, but 345-346 is the `contract.role` check, not budget.
- Other citations in these files that I spot-checked (assignment.mjs:17,276; normalizer 95-124, 120-143, 173-175; execution-contract 47/44 constants, 327-334) are plausible.

I did not mark rework: the request scopes the two Lead edits (both correct), and these older citations are not part of any entry's change. Worth a follow-up fix by the Lead if the "no other stale citation" bar applies to the whole files.

## Totals

ok 50 / rework 0.

Status: DONE_WITH_CONCERNS
