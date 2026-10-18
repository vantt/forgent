# Bounded independent closing re-review request (03)

Author: `codex-session:fgos-run_unit-run-179234b4520bb6@2026-10-19`.
Status: **ready for independent bounded review; no verdict or approval carried**. Candidate content pin: `1b3302680`; accounting evidence is this package's future runner commit. This is ONE logical request, superseding only the affected digest/context/pin bindings of -02. The three -02 reports remain immutable history (108 ok / 2 rework).

Use `review-input-step-09-close-rework-03/index.json`: **50 mandatory entries / 1 part / 252,033 bytes of part data**. Part limit is 60 entries / 400 KB. Write a fresh per-entry `ok`/`rework` verdict with concrete evidence only to the unique report `reports/phase-07/review-a38-step-09-close-rework-03.md` under this plan; do not overwrite any prior report. Use a fresh independent reviewer context. No reviewer was dispatched by the producer.

## Exact scope

- Two committed Lead citation edits: Assignment line 72 and ADR-006 lines 37–38. Read the current code at `src/runner/execution/run.mjs:569-576` and `src/runner/dispatch/assignment.mjs:443-444,626-628`; meaning remains unchanged. Full production `identityScopePathspec()` diff since `6f88f5d8e` is exactly these two documents.
- Four changed current units / six native transitions, six existing Assignment queue/context rebindings, four supplemental ADR occurrence/context bindings, four current decision targets, two pending predecessor supersessions and preserved historical B0 tuples. All 100,042 prior known IDs remain; only two native successors are added. No approval carries.
- Twenty-six -02 entries bound to now-changed digest/context/pin bytes are explicitly superseded in `step-09-close-n1-r03-rebindings.json.supersededRows`; all other prior rows remain historical evidence. Candidate declarations rebind 5 occurrences across all twelve prior lists; current review fields are pending, with old nested receipts retained only as history.
- Plan-record fixes: X-DEFECT-06 `runner.md:2475,2607,2895` → `2477,2609,2897`; X-DEFECT-08 `bin/fgos.mjs:4425,4513` → `4426,4514`. Read the lines and recompute span/probe hashes. Affected whole-file statement/evidence hashes and the dependent X-CTR010-01 matrix hash follow current bytes; no other statement meaning changes.
- Reproduction accounting: **zero new pairs**. The exact required three-file test command passed 67/67 both initially and on the final delivery rerun; both historical manifests are byte-equal to HEAD. The tracked Phase 6/7/8/9 plan-file scan after `6f88f5d8e` is empty.
- Fresh D both/identity/phase02, strict E in all three combinations, standalone ratchet, unchanged comparator and portable replay, full Check A against original allowlist ∪ `step-09-close-accounting-lanes.json`, and current 131-row file/span/probe binding checks.

## Exact scope boundary and red sets

ADR-006 was and remains outside the exact prior strict conservation scope (1,084 paths), so the **35 scoped unknown files remain exactly the prior 35**; ADR-006 does not join. D is repository-wide and strict E's candidate validation is global, including ADR-006's eight prior candidate-open rows with only its two changed native occurrences rebound. It has thirteen native current units and three pre-existing gaps: importing its entire file into conservation scope would add unrelated historical units/gaps, contrary to the requested delta boundary. The scope-facts receipt distinguishes these populations; no candidate-content defect or new disposition is inferred. Every recorded open membership follows only the four native N1 correspondences, with no unexpected/missing row. Read `step-09-close-n1-r03-scope-boundary.json`, `step-09-close-n1-r03-ADR-scope-facts.json` and the exact set comparison.

D each exits 0 with zero fatal; ratchet exits 0. Strict E each exits 1 with eight fatal categories; outputs are exactly equal. Current sets: 35 files, 2,436 unknown claims, 2,436 rationale-less claims, 233 unresolved gaps, 4,504 holds, 28 partial carries, 362 owner groups and 2,716 unreferenced native candidate units. Comparator remains visibly red: exit 1, `ok:false`, exactly the prior 24 errors (15 canonical/non-candidate contexts plus nine category/count/fatal diagnostics). No error is waived or reduced.

H1/H2, A46 ratification, the existing six native aliases, reader seal, full-suite disposition, authority promotion, implementation repair, legacy retirement, merge and landing are outside this review. The scoped H2 population remains 35 = six main-touched / 29 plan-only. The whole-repository touched-file population is separately 36 = six / 30 after the new ADR edit; it is not the scoped unknown population. No continuity result ratifies H2. If a candidate-content defect appears, report it and STOP; do not repair candidate bytes.

## Light portable checks

From the review checkout root, run serially with external output. These commands do not regenerate inventory, rerun carry, run npm test/fgos, or write repository files. Read the scripts first.

```sh
env -u CLAUDE_CODE_SESSION_ID node plans/260925-documentation-authority-unification/reports/phase-07/step-09-close-n1-r03-review-check.mjs /tmp/fgos-work/p7-close-rework-03-review
git diff --check
git diff 6f88f5d8e 1b3302680 -- docs/platform/agent-coordination/contracts/assignment-run-runresult.md docs/platform/agent-coordination/decisions/ADR-006-assignment-provenance-and-contract-snapshot.md
sed -n '569,576p' src/runner/execution/run.mjs
sed -n '443,444p;626,628p' src/runner/dispatch/assignment.mjs
sed -n '2477p;2609p;2897p' docs/specs/runner.md
sed -n '4426p;4514p' bin/fgos.mjs
```

The single portable entry authenticates part/evidence hashes, re-extracts only the two changed documents, verifies all native delta/queue/decision bindings, rechecks Check A and pins, compares exact open memberships, and reproduces all 24 comparator errors from the digest-pinned complete applied rows. These are mechanical checks; read each entry's cited material for semantic support. The producer supplies no reviewer seed, semantic verdict or acceptance.
