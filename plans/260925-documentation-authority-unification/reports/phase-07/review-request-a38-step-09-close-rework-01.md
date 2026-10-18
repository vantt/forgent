# Bounded independent closing re-review request (01)

Author: `codex-session:fgos-run_unit-run-179233d8d50a57@2026-10-18`.
Status: **prepared, held for committed-byte N1 package**. ONE logical request; no independent verdict claimed.
Reviewer must use a distinct fresh context and write only `reports/phase-07/review-a38-step-09-close-rework-01.md` within this plan. Never overwrite earlier reviews.

## Scope and release conditions

Review the parts in `review-input-step-09-close-rework-01/index.json`: 80 entries in 2 parts, each ≤60 entries and <400 KB. This includes the one-line Assignment citation repair (two extractor units), all 22 Step 3 pins, 51 Step 5 rows with changed pins/citations, the unpark disposition, two accounting review-field refreshes, and three existing decision target bindings for the repaired units. Unchanged rows, full corpus truth, legacy retirement, H1 and H2 owner decisions are outside this bounded verdict.

Before starting the semantic review, the Lead must attach committed-byte native carry evidence for only the Assignment document, D both/each, strict E both/each, and the unchanged comparator, with exact before/after open-set comparison. If any unrelated tuple changes, stop. `step-09-close-assignment-unit-delta.json` is an extractor delta, not a carry receipt. This file is already in the 35-file unknown set. No global rerun or heavy job is requested from the reviewer.

## Light commands

```sh
sha256sum plans/260925-documentation-authority-unification/reports/phase-07/review-input-step-09-close-rework-01/part-*.json
git diff --check
git diff HEAD -- docs/platform/agent-coordination/contracts/assignment-run-runresult.md
git merge-base --is-ancestor cd7ed1207 eab4d617b
git diff --numstat eab4d617b HEAD -- docs/specs/reading-map.md
sed -n '443,444p;626,628p' src/runner/dispatch/assignment.mjs
sed -n '901,915p;1538p' src/runner/loop.mjs
sed -n '337p;703p' src/workflow/runner.mjs
sed -n '2264,2302p' src/setup/registrations.mjs
sed -n '174,223p;445,464p;519,557p' src/setup/holder-lock-checks.mjs
sed -n '530,533p' docs/platform/packaging-distribution/spec.md
```

Use each row's `evidence.probes` or `evidencePins[].probes` for the remaining one-line probes and span digests; recompute file SHA-256 from the committed review tree, verify pinned spans support the bounded statement. At the committed tree replace the illustrative working-diff check with the runner commit's parent comparison. Check main-checkout cutover versus hot-state pending, X-LOCK-05 resolved conservation, and branch-correct reading-map divergence. Check corrected H2 attribution is factual and explicitly pending owner/Lead, never ratified by this request.

Record one `ok`/`rework` verdict per entry, exact row ids, independently recomputed hashes and any weak evidence. Prior seals/reviews are historical and carry no approval to the edited units. If the new native package is missing, keep request held rather than infer unchanged open sets.
