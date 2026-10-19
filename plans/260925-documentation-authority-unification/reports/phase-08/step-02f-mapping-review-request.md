# A50 replacement mapping review request — step 02f

Status: **AUTHOR PACKET; second independent pilot pending; Step 2 OPEN.** This is the ONE replacement request under L12-22. The entire 94-part `step-02e-mapping-review-request.md` is **SUPERSEDED**, including undispatched parts. Its replay and six pilot reports remain immutable evidence. Earlier 02c requests remain superseded.

Input source HEAD: `a63f38ef49d469b86875b9472638b414a13b3607`. Rules: owner-answers A49/A50 and L12-1–22, especially L12-21/22. The author performed no consumer edit or git write. The runner commits; Lead accounts actual committed path pairs later under L12-11.

## Volume and review contract

- **5,436 edges / 1,036 files / 1,325 distinct mappings**, versus 02e 5,440 / 1,330 and 02c 5,427 / 1,018. The four removed 02e rows are code import specifiers, pinned in exclusions. Every original 02c row retains a reconciliation. All 59 stored external URLs are preserved, with no remote validation claim.
- **98 logical parts / 5,313 entries**, overlaps intentional. Each is ≤60 entries and ≤400,000 UTF-8 bytes including resolved rows and metadata; max **397,442 bytes**. One index resolves all parts; no per-part payload files. Reserved independent report names: `review-a38-step-02f-map-part-NN.md`. The author has created none of these reports.
- Review **every mapping**, every exception/control, every role/action variant and **816 seeded semantic edges** (ceil(15%)). Seed: `A50-step02f-L12-22-2026-10-19-v1`; rank is SHA-256(seed + NUL + edgeId). Do not review only the mapping representative. ≥10 deep reads per part, or all when fewer, and all mandatory entries.
- First run a **second pilot** over the complete former failed-pilot content and **four fresh parts chosen by Lead**. Former pilot 03's 123 edges are all in **parts 95–97**; former pilot 26's 60 edges are all in **part 98**, including rows now preserved or behavioral. The crosswalk lists every old/new edge join and all normal mapping/exception locations. Full review is scheduled only after pilot rework is below 3%, per L12-22. The >3% affected-set expansion and sample breach → all-edge semantic read still apply. The verification-evidence mapping population remains a mandatory full read after the former 03 breach.
- One independent reviewer runs the read-only replay across every source file, physical unit, old-row disposition, correction overlay and downstream join. Other independent reviewers deep-read the logical parts. **Started 0 / accepted 0 / independent elapsed 0 / budget unassigned**. Lead sizes the measured volume under A38; author checks are not independent acceptance.

## Artifacts and reproduction

1. `step-02f-parser.py` is the successor to unchanged 02e. It re-enumerates the same tracked class boundary, parses complete reference units, preserves slash/ellipsis topology, excludes code specifiers with reasons, classifies writer blocks and keeps migration state ahead of inherited provenance. It reads no state/secrets and writes only stdout.
2. `step-02f-census-maps-portals-prose.json` holds full source hashes, physical spans, contexts, source/render routes, lookup-only alias IDs, roles/actions, non-executable successor notes and unchanged anchor API results. All parked rows have no executable `new`. Carriage policy explicitly permits preserve without alias and records the Phase 9 link-check region exclusion. No checker was changed.
3. `step-02f-packet.py` compiles distinct mappings, exception sets, seeded sample and the index. `step-02f-review-data.json` preserves all original correction controls and earlier failures; both 02c and 02e defect comparisons carry explicit predicates and old IDs. Human comparison: [defect diff](step-02f-defect-diff.md).
4. `step-02f-probes.py`: **44 differential regressions** with failing old behavior and passing new behavior, plus three existing-invariant guards. Replay retains nine syntax and eight negative mutation probes, including effective-overlay and downstream corrected-row hashes, mapping/exception/sample/part membership.
5. `step-02f-pilot-crosswalk.json`: former 03/26 populations, exact joins and current logical part locations. Primary mappings from old 03 are in normal parts 02–03; old 26 now spans several mapping/exception sets, so the mandatory full-content pilot part 98 prevents a preserved/retyped row dropping out of re-review.
6. `step-02f-verification.json`: command receipts, source/script hashes, final replay and light proof. Read this after the author run finishes; acceptance still waits for committed-pair accounting and independent checks.

Run with `PYTHONDONTWRITEBYTECODE=1`:

```sh
python3 plans/260925-documentation-authority-unification/reports/phase-08/step-02f-replay.py
python3 plans/260925-documentation-authority-unification/reports/phase-08/step-02f-probes.py
```

Parser and packet stdout can be captured under `/tmp/fgos-work/`; canonical table bytes are UTF-8 `json.dumps(value, ensure_ascii=False, sort_keys=True)` followed by one LF byte. No `fgos` CLI, git write, inventory export or service is required by replay.

## Mandatory populations

| Set | Entries | Retiring-root consumer edges |
|---|---:|---:|
| behavioral-runtime-and-contract-triage | 1066 | 211 |
| mandatory-rereview-former-pilot-03 | 123 | 32 |
| mandatory-rereview-former-pilot-26 | 60 | 60 |
| mechanical-target-failures | 6 | 3 |
| native-dynamic-patterns | 9 | 0 |
| overlay-precedence-controls | 197 | 0 |
| phase9-row-flip | 78 | 0 |
| preserve-pending-behavioral-proof | 163 | 15 |
| preserve-pending-target | 567 | 350 |
| prior-anchor-check-failures | 21 | 0 |
| prior-target-failure-dispositions | 104 | 0 |
| seeded-semantic-edge-sample | 816 | 204 |
| semantic-roadmap | 4 | 2 |
| writers-and-writer-triage | 774 | 154 |

Counts overlap intentionally. Keep all 104 original mechanical-target-failure dispositions, 21 earlier anchor failures, nine dynamic patterns and 197 overlay controls. Missing/template targets are not passes. Pending-target and behavioral-proof rows remain blocked on exact targets/Step 5 adoption and IO parity.

## Reviewer checks and limits

Read source blocks, not only the row excerpts. Check Create/PERSISTENT STATE/proof-path/EVIDENCE_DIR as writes, and preserve ROSTER_SOURCE reads. Check all 25 formerly inherited-provenance state cells; the pilot prose said 24 but its listed IDs total 25. Keep directory slashes and complete placeholders; docs/history remains retained. Migration-plan source locators and retired handoff checkpoints stay historical. Observe resolves to `docs/platform/observe/spec.md`. Deleted locators use checked non-executable successor notes.

Verbatim carriage is preserved even without a lookup alias. **Phase 9's link check excludes verbatim carriage regions** (pilot part 60 already identifies 21 broken links there); it still checks operative prose. This is a recorded cutover obligation, not a checker modification or a blanket file exemption.

Class 3 static parsing is regenerated; native/current-coordinate/adoption and operational parity remain open. Class 4 is **NOT STARTED** at this boundary. Do not infer Step 2 closure, authority flip, semantic approval, installed-package reachability or permission to rewrite targets. Lead must still run L12-11 accounting on the real runner commit and then checks on clean committed bytes. Both protected Phase 6 manifests and every old census/review/request remain unchanged. MDView is absent from this assignment's tool surface; no service/registration was started.
