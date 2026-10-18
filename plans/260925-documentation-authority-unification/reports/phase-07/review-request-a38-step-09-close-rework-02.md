# Bounded independent closing re-review request (02)

Author: `codex-session:fgos-run_unit-run-1792346bcf6848@2026-10-18`.
Supersedes `review-request-a38-step-09-close-rework-01.md`; earlier request and reviews remain historical and untouched. This is ONE logical request, with per-entry verdicts across its parts.

Status: **ready for independent bounded review; no verdict carried**. Review content pin: `6f88f5d8e`; accounting evidence is this package's runner commit. Use a distinct fresh reviewer context and write only the unique report `reports/phase-07/review-a38-step-09-close-rework-02.md` within this plan. Do not infer an independent verdict from this request.

## Scope

Use `review-input-step-09-close-rework-02/index.json`: **110 entries in 3 digest-pinned parts (50/50/10), 367,228 bytes of part data**. Each part is at most 50 entries and below 400 KB. Scope includes the committed one-line Assignment citation edit; two changed extractor units; three native transitions, four neighboring context bindings, and preserved B0 tuples; pending predecessor supersession and three prior target rebindings; M1 main-checkout/hot-state distinction, M3 protected divergence disposition and M4 refreshed citations/pins; approved reproduction pairs and current rechecks.

A36 pin sample: 81/131 rows (minimum 20, hence ≥15% and ≥10), including all 22 contract rows, the 51 changed alignment rows and every remaining high-risk/deep-read row. All 31 high-risk alignment rows are present. Recompute bindings and read cited spans for semantic support; hashes alone do not prove truth. Each part entry gets one `ok`/`rework` verdict with its exact id and independently checked evidence.

H1/H2 Lead placeholders and owner decisions are outside this verdict. The 35 unknown files are the complete candidate changed-file set since B0, with six main-touched and 29 plan-only files; equality to the recorded open set does not ratify A46's corrected premise. The request carries no approval, fresh reader seal, authority switch, legacy retirement or implementation repair.

## Light portable checks

Run from the repository root in the review tree, retaining its committed candidate bytes. The report scripts below read production results and pin bytes; neither regenerates inventory or runs native carry.

```sh
sha256sum plans/260925-documentation-authority-unification/reports/phase-07/review-input-step-09-close-rework-02/part-*.json
git diff --check
git show --format=fuller --stat 6f88f5d8e
git diff 6f88f5d8e^ 6f88f5d8e -- docs/platform/agent-coordination/contracts/assignment-run-runresult.md
node plans/260925-documentation-authority-unification/reports/phase-07/step-09-close-n1-checks-reproduce.mjs /tmp/fgos-work/p7-close-review-checks
node plans/260925-documentation-authority-unification/reports/phase-07/step-09-close-n1-compare-reproduce.mjs /tmp/fgos-work/p7-close-review-sets
node plans/260925-documentation-authority-unification/reports/phase-07/step-09-close-n1-portable-comparator-reproduce.mjs /tmp/fgos-work/p7-close-review-comparator
git merge-base --is-ancestor cd7ed1207 eab4d617b
git diff --numstat eab4d617b 6f88f5d8e -- docs/specs/reading-map.md
sed -n '443,444p;626,628p' src/runner/dispatch/assignment.mjs
sed -n '901,915p;1538p' src/runner/loop.mjs
sed -n '337p;703p' src/workflow/runner.mjs
sed -n '2264,2302p' src/setup/registrations.mjs
sed -n '174,223p;445,464p;519,557p' src/setup/holder-lock-checks.mjs
```

For remaining spans use each row's portable `probes[].command`. Verify the manifest diffs change only the exact exception arrays and contain two `6f88f5d8e` Phase 8/9 path pairs per manifest; compare the approved pair receipt and boundary hashes. Read the test log and real exit/result receipts. Check native predecessor/successor correspondence and all six context bindings; old B0 source tuples stay historical. No heavy global rerun is requested from the reviewer.

## Native release evidence

`step-09-close-n1-global.json`: fresh D both/identity/phase02 each exit 0, zero fatal; strict E each exit 1 with eight fatal categories and identical outputs. `step-09-close-n1-open-set-comparison.json`: all eight exact open sets equal the recorded `step-09-runner-n1-open-sets.json` after only the two native Assignment correspondences; no unexpected/missing tuple. The 35-file set is unchanged, as are 2,436 unknown claims, 233 unresolved gaps, 4,504 pending holds, 28 partial carries, 362 owner groups and 2,716 unreferenced units. Comparator exit 1 retains exactly the same 24 errors; portable replay verifies hashes and reproduces it. Ratchet CLI exit 0. Final three-file tests: 67/67 pass. Final Check A and 131-row byte pin verification pass in `step-09-close-n1-checks.json`.

Candidate declaration continuity is independently derived from all twelve prior authored lists; one unreferenced Assignment tuple changes and every other declaration is preserved. Read `step-09-close-n1-candidate-rebindings.json`, the pending gap disposition and production/manifest boundary receipt. Do not reclassify or filter any old list to reduce the comparison's red set. If any unrelated tuple or comparator error differs, stop and report it. Continuity proof does not resolve H2 or certify full-corpus truth.
