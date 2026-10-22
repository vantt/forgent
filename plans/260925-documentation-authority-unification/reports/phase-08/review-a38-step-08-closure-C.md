# Step 8 closure review — part C (Step 7 handoff and Step 8 closure package)

- Worktree `/home/vantt/projects/forgentX-s8-review`, HEAD confirmed `373695db0` (single records commit over author input `36a1a08fc`). Source assembly pin `244a04354`. Read-only; pinned bytes through `git show 373695db0:<path>`; JSON loaded with python. No worktree write, git write, fgOS CLI, `.fgos`, secrets or suites. (The untracked `target-review/` directory in the worktree is not mine.)
- Inputs: phase-08 (Success Criteria, Step 7, Step 8), phase-09, `step-08-phase-08-scorecard.md`, `step-07-final-assembly-report.md`, `step-07-readiness.json`, `step-07-consumer-cutover-matrix.json`, `step-07-patch-order.json`, `step-07-integration-verification.json`, `step-07-park-resolution-applied.json`, the three Step 7 integration reviews, owner-answers L12-96..L12-122, progress.md, `dropped-claims-register.json`.

## Verdict: **rework**

The scorecard reports SC1 and Step 8 honestly as not-met. I found no row marked "met" whose proof is missing. The problem is how close is framed. Several duties that the owner, the Lead or the phase file assigned to **Step 7 or Step 7/8** were never done. The package moves them into "Phase 9 carries" without any ruling that reassigns them. One Phase 9 entry gate is also missing from the handoff. The next-action line suggests Phase 8 can close once the suite is green and this review passes. Under the phase file's own stop clause it cannot.

## Findings (false-green and stop-relevant first)

### F1 — High. Patch specs are stale against the final pin. That is the L12-58(1) duty, which was not done, and SC1's not-met rationale leaves it out.
- `step-07-patch-order.json` has 226 specs. **133 specs (138 of 233 `sourcePinChecks`)** have a `recordSourceSha256` that differs from `sourceSha256AtPin`, with blocker `record-source-digest-differs-from-final-pin-compose-before-application` (129 specs). **113 specs have no forward diff** (`exact-generator-or-row-action-not-composed`). **202 specs** carry `independent-final-composition-review`. Every one of the 226 specs has at least one blocker.
- L12-58(1) says the Step 3 record rebinds happen "**once, at Step 7's atomic handoff assembly at the final pin**". L12-61/63/66/68/112/117 each defer their lists (for example L12-117: 25 Step 3 / 16 Step 4 / 455 Step 5 records) "once to Step 7 final atomic assembly". `step-07-assemble.py` never reads any `*-deferred-rebinds.json`, and no Step 7 receipt discharges them.
- Phase-08 Step 7 stop clause: "stale proof prevents readiness". The scorecard handles this only as generic carry text ("Revalidate per-file composition, source digests…"). SC1 not-met names only the 214 parks and the 79 + 1,158 census sites.
- **Correction:** add these counts to SC1's not-met rationale. Mark the requirement rows that rest on these specs (CLI help, tests/fixtures, comments, skills) as "prepared records, 133 stale / 113 uncomposed". Either do the L12-58(1) rebinds now, or get an explicit Lead ruling that moves them to Phase 9.

### F2 — High. Owner-accepted L12-96 binding duties for Step 7 are undischarged and are not called out.
L12-96 (owner) assigns these to Step 7:
- "Carry the **44 missing claims** verbatim… **Bind exact passages and holders at Step 7**" (families 14/15/16/18). Readiness `parkOwners` shows all 43 parked members with `N-verbatim-claim-passages-and-live-holder-carriage-not-yet-composed`, plus one flip in `carry-distribution-gateway-claims`.
- Q3: "**Step 7 binds the exact holders, coverage and patches**" (families 13/17). Those 24 parks read `…-not-yet-bound` / `…-not-yet-composed`.
- "Bind post-retirement scan sets at Step 7 composition" (family 8, `readset-post-retirement-scan`, 48 parks): `successor-scan-set-not-composed`.

The scorecard counts these only as parks by owner. It never says they were owner-assigned to Step 7 and are unmet. Its "44 refs" (item 8) is a different 44 (the Work freshness refs), which invites confusion. The review rules forbid silently deferring an owner decision. **Correction:** add a named section "L12-96 Step 7 duties not performed", and route the deferral to the owner or Lead as an explicit ruling.

### F3 — High. The changed-binding independent review owed at Step 7/8 is relabelled as a Phase 9 carry.
- Phase-08 review map: "Steps 7/8 … **review changed bindings**". L12-58: "The 35 changed bindings stay pending until the **combined Step 7/8 binding review**".
- Later rebinds are recorded as "pending independent review" and have no review file: L12-112 (141 rebinds), L12-115 (3), L12-117 (8), plus earlier batches (owner-answers lines 576 and 706: 35 and 40). The only rebind review is `review-a38-step-07-l12-101-rebinds.md`. Step 7 r1–r3 did not review bindings.
- The scorecard marks "Binding integrity" met-with-carry. Carry item 2 says "Review changed bindings", which places the duty in Phase 9.
- **Correction:** either this closure review (part A/B?) covers every pending changed binding, or the binding row becomes not-met and close stops.

### F4 — High. The dropped-claims register, a Phase 9 entry gate, is missing from the handoff.
- phase-09 Overview: "Every entry in `dropped-claims-register.json` must be restored or dispositioned first."
- At the pin the register holds **17 entries: dropped-001 `dropped-needs-restoration` and dropped-002…017 `dropped-needs-review`**.
- The scorecard mentions only "dropped-001 is restored later". Neither readiness nor the obligations file has an entry for the register.
- **Correction:** add a named carry with all 17 ids, their status and an owner.

### F5 — Medium. Branch-only git one-door sites have no owner or carry.
- `packages/git/contracts/mutation-census.v1.json` lists **58 sites at the pin versus 5 on main**.
- The 53 added sites include Phase 8 deliverables: `scripts/check-evidence-relocation.mjs` and `.githooks/pre-commit`.
- `git-mutation-one-door` (`src/setup/git-checks.mjs:71`) fails on any listed site. Landing therefore widens a doctor red from 5 to 58 sites.
- The scorecard lists this only as a "local residual". **Correction:** name an owner (Git one-door / documentation tooling), carry it explicitly, and attribute it in the suite or doctor table.

### F6 — Medium. L11-23/L11-25 retention is not carried.
- phase-09 requires keeping the reading-map transition banner and the two compounding→knowledge fixes (+10/−2 versus `eab4d617b`, the L11-25 accepted divergence).
- The scorecard has zero mentions of L11-23, L11-25, compounding or `eab4d617b`. The `reading-map-entry-merge` blocker mentions L11-25 only as "not merge proof".
- **Correction:** add these to carry item 6.

### F7 — Low. The two committed alias-writer records disagree on the class split.
- Matrix/readiness `aliasWriterCheck`: parked 7 / preserved 17 / rejected 27. The assembler (`step-07-assemble.py:646-651`) classes writers by the original Step 5 disposition.
- `step-07-integration-verification.json`: prepared 8 / preserved 16 / rejected 27. The verifier uses the effective overlay.
- Both report 51 writers and 0 violations, so SC2 "met" stands. Fix the assembler to use effective classes, or note the basis in the scorecard.

### F8 — Low. Bloat inventory.
- I recomputed at `373695db0` (identical to `36a1a08fc`): 35 files at or above 10 MB, **728,650,869** logical bytes, and every per-file size matches. These are **34 unique blobs**: `step-05-seam5-batch7-full-check.json` and `step-05-seam5-b6-closure-clean-check.json` share blob `5e3d93d7`. Say "35 files / 34 blobs", not "35 blobs".
- No row claims outright deletability. However, several "prune candidate" rows still have committed dependents that the table does not name:
  - `step-05-seam5-batch7-full-check.json` is read by `step-05-seam5-batch7-closure.py` / `-seal.py` / `step-05-seam5-b6-review-finalize.py`.
  - `step-05-full-check-result.json` / `step-05-head-drift.json` are outputs of `step-05-check.py` / `step-05-final-verify.py`.
  - The step-02c…02i censuses are cited by the A38 map reviews.
  - All of these paths appear as pairs in both Phase 6 reproduction manifests. Any deletion needs new L12-11 pair accounting.
- Add a "dependents" column.

### F9 — Low. A retained legacy source block contains stale present-tense claims.
`setup-doctor-registry.md:207` (a retained distribution block, absent on main) says setup "attempts the `lock-fences` cutover step (row 7b)" with default `predecessorKillWaitMs`. Both were deleted by T1, and row 7b does not exist. This is defensible as retained carriage pending truth review (L12-117), but the A47 truth review should be pointed at it explicitly.

## Stop-vs-carry table (every red/blocked item at close)

| Item | Source | Classification |
|---|---|---|
| P7-DOC-GAP-05 dead-vocabulary guard | readiness `specialObligations` | **Allowed red**; Phase 9 pre-landing blocker |
| Lead `npm test` + reproduction/embedded checks A/B/H/I after L12-11 | scorecard suite table, all pending | **Phase 8 stop until green** (only GAP-05 may be red) |
| `common-light-Git-fixture-tests` (candidate-status, constitution) | `unrunRequiredChecks` | **Phase 8 stop**: mandatory proof unrun |
| Reproduction / ratchet / citation-drift tests after runner commit | `unrunRequiredChecks[1]` (citation-drift and ratchet tests are not named in the scorecard suite table) | **Phase 8 stop** until run; add them to the table |
| Pending changed-binding review (F3) | L12-58/112/115/117 | **Phase 8 stop** unless this closure review covers it |
| Census semantic join, 79 literal + 1,158 dynamic sites | `current-census-semantic-join` | **Stop** under "untraced behavioral consumer" unless the Lead explicitly rules it a Phase 9 carry. Phase 9 step 10 runs post-flip, which is too late to find readers to switch at step 5 |
| 133 stale / 113 uncomposed patch specs (F1) | patch-order blockers, L12-58(1) | **Stop** (Step 7 duty) or explicit Lead re-assignment |
| L12-96 Step 7 binding duties (F2) | readiness parks | **Owner-assigned Step 7 duty**; carry only with an owner/Lead ruling |
| 214 individually owned parks | readiness `parkOwners` | Legitimate Phase 9 carry: every row has an owner and a blocker. F2 subsets need the ruling |
| A34 two-line residual; 7 AGENTS root-pointer parks | obligations | Legitimate Phase 9 carry (root-instruction cutover) |
| Reading-map entry merge | obligations | Legitimate carry (phase-09 names its owner) |
| Lease landing, Git §7 consent, Holder-lock notice | obligations | Legitimate carry (phase-09 step 1) |
| P7-DOC-GAP-06, PF-I022/23, holder-lock header | prepared-for-cutover | Legitimate carry |
| `post-census-workflow-holder`; `step5-carry:earlier-post-census-workflow` | obligations | Ambiguous: its blocker text says "**Step 7** final source/census reconciliation must disposition…". Relabel the actor to Phase 9 by ruling, or treat it as a Step 7 stop |
| Other step5-carry blocked items (overlap-1/2/3, shared-test co-cuts, deferred replays, seam67, gateway-yaml, store-comment, registry-provenance) | obligations | Composition deferred to "final composition". Same L12-58(1) issue as F1: a carry only by explicit ruling |
| Registry missing currentPath | obligations | Legitimate carry (Knowledge-registry owner; pre-existing) |
| Evidence verifier `--after` red (907) | scorecard | Expected before deletion; Phase 9 step 6. Not a suite red |
| Dropped-claims register, 17 entries (F4) | phase-09 Overview | **Missing carry**; add it |
| One-door census 58 vs 5 (F5) | mutation census | Missing owner/carry; add attribution |

## Progress next-action line

It is concrete: fill the suite table, run the separate L12-11 Unit, then one A38 review. It is incomplete because it does not say who rules on the not-met SC1, F1–F3 and the census join before close. Add: "Lead/owner rules each Step 7-assigned item in the stop table as either done-before-close or carried to Phase 9 with a named owner; without that ruling, Phase 8 stays open."

## Lead questions

1. Will you rule the census semantic join (79 + 1,158), the 133 stale / 113 uncomposed specs (L12-58(1)), and the L12-96 Step 7 binding duties as Phase 9 carries? Or must Phase 8 do them before close? The L12-96 duties need the owner, because L12-96 is an owner decision.
2. Do parts A/B review all pending changed bindings (L12-112's 141, L12-115's 3, L12-117's 8, plus the earlier 35/40)? If not, who does, and before close?
3. Who owns the dropped-claims register dispositions (16 needs-review) and the one-door census widening?
4. Should the assembler's writer-class split be corrected to effective classes before the package is accepted (F7)?

Status: DONE_WITH_CONCERNS
Summary: Rework. There is no outright false "met", but several Step 7/8-assigned duties are carried to Phase 9 without a ruling: 133 stale patch specs (L12-58(1)), the L12-96 Step 7 binding duties and the pending changed-binding review. The dropped-claims register (17 entries) and the one-door census widening (5→58) are missing from the Phase 9 handoff.
