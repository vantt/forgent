# Phase 7 scorecard — draft closing account

Author: `codex-session:fgos-run_unit-run-179233d8d50a57@2026-10-18`.
Status: **blocked; not awaiting-owner-review**. This is the established `reports/phase-07/phase-07-scorecard.md` plan-local name requested by the closing brief. No fgOS convention call is allowed in this worker.

## Close decisions and limits

**H1 suite decision:** [Lead fills final close statement here; L11-22 already records the measured residual, with `step-09-close-suite-attribution.json`.]

**H2 A46 ratification:** [Lead fills the owner's answer on the corrected attribution here; pending, no ratification inferred.]

A46 originally moved main-import accounting to Phase 9. Corrected facts: all **35** unknown candidate files equal every `docs/platform/**` file changed since B0 `6f0f39ca1`; **6 main-touched, 29 plan-only**, **2,436 claims and 233 gaps**. The main-touched set is component-boundary, Event Store, Holder-lock, instruction-composition, repository-runtime-layout and Process. It is not an exclusively main-import red set. `step-09-close-checks.json` independently computes the file partition, and `step-09-package-blocker.json.correctedAttribution` records it. Do not claim Phase 7's own work fully accounted until H2 is answered and recorded.

The Assignment sentence at line 69 is repaired under N1. The unchanged extractor finds two changed units, not one: heading `assignment` and `unheaded-block-10`; 57/59 unit objects remain identical. Native carry and D/E/comparator are pending committed bytes: the worker cannot perform git writes, and the native functions resolve an explicit committed treeish. Historical outputs below are not proof of the repaired working bytes. `step-09-close-assignment-unit-delta.json` pins the exact before/after units.

## Steps 1–9 and independent reviews

| Step | Result and proof | Independent verdict / remaining scope |
|---|---|---|
| 1 Inventory and routing | 98 B0 rows; ten later main-import rows; 4 duplicate, 28 semantic and all 13 queue families routed; CTR010 resolved by A45 | `review-a38-cross-area-inventory-01.md`, `review-a38-fresh-groups-01.md`; bounded rework accepted at `1d78440f9` |
| 2 Semantic groups | 28/28 joined; 26 resolved; two duplicate groups continue in Step 6 | `review-a38-step-01-rework-and-step-02-01.md`: 39/39 ok across Step 1 rework and Step 2, zero rework |
| 3 Contracts and boundary | 22 rows; CTR010 Gateway, CTR011 confinement label, CTR012 workflow operation, CTR013 Assignment; no extra Work writer | Architecture review drove rework; `review-a38-step-03-step-04-bounded-rework-01.md`: 15/15 ok; refreshed citations/pins now require bounded re-review |
| 4 Vocabulary | 13 reviewed vocabulary rows; proposals/history not made operative | `review-a38-step-03-04-vocabulary-01.md` plus same 15/15 bounded review; five rationale-only observations stay Phase 9 |
| 5 Authority and alignment | 109 rows; 28 A34 residuals preserved; no implementation repair; present counts 11 aligned / 89 deferred / 9 doc-fix; parked 0 | Parts 01–03 and seed/rollup review drove X-LOCK-05 rework; `review-a38-step-05-bounded-rework-01.md` accepted it. Closing truth sample found two false rows now corrected in authored records; independent re-review pending |
| 6 Projections and duplicates | Four groups reconciled; canonical/projection distinction retained; UI generator staleness and root split deferred | `review-a38-step-06-projections-01.md`: no required fixes; does not certify UI generated output or promotion readiness |
| 7 Navigation and key | Candidate navigation repaired; key reviewed/resealed before round 2 | `review-a38-step-07-key-reseal-02.md` accepted seal; three of eight sealed file hashes later changed; reviewed N2 found no changed answer/route/anchor. **No fresh seal** claimed |
| 8 Fresh readers | Round 1 failed one fabricated anchor; round 2 passed both readers A/B/C 6/6 each, authoring 3/3 each; eight files each; zero fabricated anchors, out-of-scope reads or legacy-authority answers | `fresh-reader-p7-r2-score.md`: PASS. One-line Assignment edit is outside the eight-file sealed corpus; no new reader result claimed |
| 9 Accounting and close | Prior native package D both/each exit 0; E/comparator red; checkpoint 6/6; corrected rows and evidence drafted | Three package-02 ordinary reviews deep-read 199 + 164 + 94 rows; `review-a38-step-09-runner-n1-01.md` reviewed later runner rebindings. Current Assignment repair still needs committed-byte N1 package and `review-request-a38-step-09-close-rework-01.md` |

## Nine review dimensions

| Dimension | Evidence and outcome | Remaining boundary |
|---|---|---|
| D1 One owner | Step 1/2 semantic and duplicate ownership joins | Legacy retirement and actual authority switch are Phase 9 |
| D2 Producer/consumer contracts | Step 3 matrix; no payload version invented for CTR012/CTR013 | Refreshed citations and Assignment edit pending N1 review |
| D3 Vocabulary | Step 4 reviewed terms/meanings; no new classes from responsibility rings | Dead-vocabulary guard rejects verbatim historical carriage; P7-DOC-GAP-05 pre-landing blocker |
| D4 Authority separation | Step 5 bounded statements; A34 activation conditions retained | README says Accepted while candidate headers say Candidate/Draft; P7-DOC-GAP-04 explicitly remains Phase 9 |
| D5 Component boundary | Main-checkout single door verified; no second state writer | Main-authored holder-lock header refresh deferred to Phase 9 main-import, L11-23 |
| D6 Preserved intent | 28/28 residual payload SHA/verbatim checks in closing truth review | No proposal activated or law rewritten; L10/L3 supersession wording remains promotion work |
| D7 Projection/source | Step 6 manual rules and equality meaning recorded | UI output drift/root split and runtime Gateway legacy YAML consumer are named Phase 8/9 work |
| D8 Newcomer navigation | Round 2 strict PASS; N2 changes reviewed | No fresh seal; candidate Accepted-versus-Candidate/Draft wording still inconsistent |
| D9 Implementation evidence | Whole-file hashes refreshed for 22 Step 3 and 109 Step 5 rows; 26 stale statement hashes, 51 Step 5 rows with changed pins/cites; span probes provided | Current bounded re-review and committed-byte global proof pending; full-corpus truth remains Phase 9 |

## Checkpoint and separate truth sample

`red-team-p7-close-01.md` (committed `e59d67904`) reviewed `c2409de08`: **0 Critical, 2 High, 4 Medium, 6 Low**. Checkpoint caught **6/6** seeded mutations (02/03/10/13/17/26), with **0 false flags** across 30 entries. Pack/key are retained in `checkpoint-p7/`; no seed or key was edited here and no new blind checkpoint is claimed after author access.

Separate truth sample: seeded ten rows 10/10 not false (4 true, 3 honestly deferred, 3 routing true). Mandatory high/parked plus contract set: 47 rows, **43 true / 1 true with false citation / 1 deferred now stale / 2 false**. S3-09 citation, X-LOCK-05 conservation and X-MAIN-01/X-LOCK-04 have authored corrections; the historical totals are preserved rather than relabelled as a fresh passing sample. PARK-PROTECTED-01 is formally unparked by L11-25, branch-correct divergence accepted (+10/-2 vs `eab4d617b`).

## Mechanical proof and exact red sets

| Check | Recorded result and limits |
|---|---|
| A | Current HEAD first-parent non-merge history plus working/untracked paths checked against original allowlist ∪ exact L11-24 lanes; zero outside paths. `step-09-close-checks.json`; original allowlist unchanged. Runner commit itself still needs final verification |
| B/C | Extractor closure and authority status unchanged by this worker; historical close author checks available. No checker, vocabulary, baseline, switchboard or protected-reader edit |
| G / D | Historical `step-09-runner-n1-global.json`: D both/identity/phase02 each exit 0, zero fatal. No refreshed claim for corrected Assignment bytes |
| H | Fresh strict candidate-status exit 0, 217 checked, zero findings/unresolved links; `step-09-close-checks.json` |
| I | **Red only for the imported main delta**: `docs/platform/holder-lock/spec.md`, `docs/platform/process/spec.md`, `docs/platform/session-identity/spec.md`. No removed link; frozen baseline unchanged; no frozen-I-green claim |
| Protected provenance | Reading-map divergence explicitly accepted by L11-25; raw equality to main remains false. No protected write this turn |
| E | Historical both/identity/phase02 each exit 1, eight fatal categories; exact memberships in `step-09-runner-n1-open-sets.json`, counts below. Not refreshed after new N1 edit |
| Comparator | Historical `step-09-runner-n1-comparison.json`: exit 1, `ok:false`, 24 errors; exact error strings retained there. Not a green comparison or an H2 approval |
| Tests | Fresh three-file doc-tooling run: 67 tests, 65 pass, 2 fail (initially three stale target digests; after rebinding, both historical reproduction `checks.mjs` reject the two required working Phase 8/9 plan paths). Full log is `step-09-close-doc-tests.log`; no gate or fixture bypass. L11-22 suite decision remains separately recorded; no full suite rerun here |
| Working diff | `git diff --check` clean; assignment paths only; current JSON parses and file/span pins checked |

Historical exact E categories (same counts across all three prior combinations):

| Set | Count | Exact membership |
|---|---:|---|
| Unknown files | 35 | `filesUnknownBlocking` |
| Unknown claims | 2,436 | `claimsUnknownBlocking` |
| Claims without own rationale | 2,436 | `claimsWithoutOwnRationale` |
| Unresolved registry gaps | 233 | `registryGapsWithoutDisposition` |
| Unreviewed holds | 4,504 | `pendingHolds` |
| Partial carries | 28 | `partialCarries` |
| Identical units with multiple owners | 362 | `identicalUnits` |
| Unreferenced candidate units | 2,716 | `candidateUnits` |

All membership keys above are in `step-09-runner-n1-open-sets.json`. Comparator's 24 errors include fifteen unexpected native candidate tuples plus unsupported file/rationale/gap categories and their diagnostics; the JSON is the exact red list. Native alias differences and post-B0 main-only source declarations remain explicit historical accounting limits, not erased by comparing a red set to itself.

## Routes and remaining blockers

1. Runner commits the Assignment edit; native package turn re-carries only its changed document, preserves all other registry records, rebuilds relevant declarations/bindings, reruns D/E/comparator and proves exact open-set delta. Investigate any additional gap/tuple change; do not silently claim the old 233 gaps persist.
2. Owner answers H2 on the corrected 6/29 attribution; Lead records it and fills the scorecard placeholder. A46's original main-import description does not settle this.
3. The two fresh reproduction failures are now attributed: ownership assertions pass after three target rebindings, but historical checks reject the required Phase 8/9 working paths. Next package must account final runner commit/path pairs through the approved manifest-data process; leave them blockers until real passing evidence exists. Do not alter tests/checkers/baselines.
4. Release the single bounded re-review request only after native proof exists; obtain independent per-entry verdicts. Authored corrections do not close M1/M4 independently.
5. Phase 8 inventories Gateway `gateway.rs:1187` serving `/contract` from the legacy YAML. Phase 9 refreshes the inherited holder-lock header, retains reading-map navigation, reconciles candidate header status/L10 wording and resolves P7-DOC-GAP-05 before landing. No authority switch, legacy deletion, main merge, landing or push is authorized here.
