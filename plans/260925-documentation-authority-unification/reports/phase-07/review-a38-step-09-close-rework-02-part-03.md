# Review a38 step-09 close rework 02, part 03

Reviewer: `reviewer:sonnet-session:a154cf08c8dad74af@2026-10-19`
Reviewed commit: `7ba806025` (detached review tree, content pin `6f88f5d8e`)
Part sha256: `d823bc7f13f79e4c8d32ed2829fd00ae20becd79bd555c54feefc42eba773063` (verified equal)

## Verdicts

| Entry id | Verdict | Evidence |
|---|---|---|
| doc-tooling-tests | ok | Log tail shows tests 67 / pass 67 / fail 0, no `not ok` or failure lines; receipt step-09-close-n1-doc-tests.json exit 0, finalRerun true; the three test files named match the command. I did not rerun npm test (not permitted). |
| displaced-228 | ok | Historical tuple (97396cdd...) and current native binding (claim_f50eba28..., unitDigest ba9b0407..., sourceUnitDigest 8f9c8e20...) both present in step-09-close-n1-rebindings.json; the binding equals the `after` of the carry.json change 1 and the first native correspondence in the open-set comparison. Historical B0 tuple left unchanged. |
| displaced-234 | ok | Historical tuple (565c53c7...) and current target (claim_1e367448..., unheaded-block-10, unitDigest 66aa2165..., sourceUnitDigest 30b918ac...) found in rebindings; equal to carry.json change 3 `after` (new unit). Matches the candidate-declaration after row. |
| closure-open-set-comparison | ok | compare-reproduce rerun: passed, every open set expected==actual with 0 unexpected/0 missing (35 / 2436 / 2436 / 233 / 4504 / 28 / 362 / 2716), comparatorErrors 24/24; only two Assignment unit correspondences applied; all three strict E outputs equal. |
| portable-comparator-replay | ok | portable-comparator-reproduce rerun: reproduced true, comparatorExit 1, errors 24; actual gz sha (34e37da3...) and expected/E-both shas equal inputs.json. |
| production-and-manifest-boundary | ok | All 7 production/tool sha256 values match the recorded byte-equal-to-HEAD values (generate-doc-inventory, check-doc-inventory-gates, compare-doc-global-closure, ratchet script/baseline/exceptions, doc-rationale test); manifest shas 502562f0 / 7bd8e281 match. Diff of the two phase-06 manifests vs 7ba806025^ changes only the exception array in the embedded checks.mjs, inserting exactly two 6f88f5d8e entries (phase-08 and phase-09 paths) in each. `git diff --check` clean. 6f88f5d8e touches only the Assignment contract line and phase-08/09 plan files in that area; no scripts/tests/src diff between 6f88f5d8e and 7ba806025. |
| ratchet-command | ok | step-09-close-n1-ratchet-command.json: exit 0, "clean (995 legacy files; 26 accounted edits, 1 accounted new file)"; open-set comparison ratchet: clean true, 0 findings. |
| closure-inputs | ok | actualSHA256, expectedSHA256, strictEGateSHA256 recomputed and equal to the recorded values; actual gz decompresses to the recorded sha. |
| candidate-declaration-correspondence | ok | Independent diff of step-09-runner-n1-expected.json vs step-09-close-n1-expected.json: exactly one candidate row changes (claim_85872e0e -> claim_1e367448, unheaded-block-10, unitDigest eb1cabf7 -> 30b918ac; all other fields incl. authoredBy/status preserved) and one hold key; the other 11 candidate lists identical, holds 4504/4504. |
| final-boundary-validation | ok | Consistent with recomputed evidence: D both/identity/phase02 exit 0 fatal 0; strict E three runs exit 1 fatal 8 with equal outputs; ratchet 0; 67/67; comparator 24 errors; checks.json passed with no scope violations. Counts of registry rows were not independently recomputed (no native inventory allowed); recorded only. |

## Portable-check outputs (run one at a time, `env -u CLAUDE_CODE_SESSION_ID`, outputs in /tmp/fgos-work/)

All three scripts were read first; they write only to /tmp/fgos-work/ and run no npm test, fgos or inventory, so they were run.

- checks-reproduce: `{"passed":true,"historyViolations":0,"workingViolations":0,"pins":{"rows":131,"files":403,"spans":97,"probes":97},"mismatches":0}`. Check A passes against allowlist plus accounting-lanes.
- compare-reproduce: `passed:true`, all open sets 0 unexpected / 0 missing as listed above.
- portable-comparator-reproduce: `{"reproduced":true,"comparatorExit":1,"errors":24}`.
- Global receipt: D both/identity/phase02 exit 0 fatal 0; strict E exit 1 fatal 8 each.

## Totals

10 entries: 10 ok, 0 rework. No unrelated tuple or comparator error differs.

## Rework details

None. Caveats: semantic claims beyond hashes in Part 03 (registry row counts, test pass) rely on recorded receipts, since npm test and native inventory were out of scope.

Status: DONE
Summary: 10 ok, 0 rework; no ids need rework.
