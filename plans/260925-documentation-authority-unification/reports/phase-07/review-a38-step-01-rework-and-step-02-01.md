# A38 review: Step 1 rework and Step 2 semantic records

- Reviewer: reviewer:claude-session:a4954387@2026-10-17
- Author session: codex-session:fgos-run_unit-run-179220cd962900@2026-10-17
- Review mode: ordinary
- Request commit: 19d37a8a1

## Method and seed

1. All 7 pinned SHA-256 digests recomputed with the request's node command: all 7 equal. Worktree HEAD is 19d37a8a1. `git diff --name-only 135230fb3..HEAD -- docs/platform` is empty, and `git diff --stat 135230fb3..HEAD -- plans/.../reports/phase-06` is empty (no candidate or Phase 6 queue edit).
2. Part A: jq on the 7 named rows plus all 13 QF rows, the 14 DEFECT/NAV rows' routing fields, the A34 residual owners, and the diff of the phase file and inventory since 135230fb3. Compared against the two Step 1 reviews (review-a38-fresh-groups-01.md; review-a38-cross-area-inventory-01.md) and L11-8..L11-11 in owner-answers.md.
3. Part B, mechanical, all 28 records: a script (scratch `work-p7s2/v.mjs`) recomputed SHA-256 of every source and target file and compared with the record and with B0 `6f0f39ca1` (`git show`); joined each record's `evidence` decision file, confirmed the source file maps to the target owner in `files[].targets`, and counted claims with `targetOwner == target` and `reviewStatus == reviewed` against the number stated in `exactDivergence`.
4. Part B, deep: no seed sampling. Every record was checked mechanically and every pair's fields were read in the JSON. All three X-SEM-13 members were read in full (migration-status.md 5.5 KB, orchestration-vocabulary-map-2026-08-27.md 37 KB read through section 11, intent-preservation-ledger.md 16 KB). Deep-read is 28 of 28, so it exceeds the 15% floor and the 3% expansion rule is moot. No seed was used because the sample is the full set.
5. Not run (per request): full inventory, native sync, D/E, comparator, npm test, fgos CLI. `.fgos/secrets.local.env` not read.

## Part A: Step 1 rework (11 entries)

| Entry | Verdict | Note |
|---|---|---|
| 1. X-DUP-01 uses the same CTR010 park marker as X-CTR010-01 | ok | deep: X-DUP-01 has `disposition: park-dependent-rows`, `blockedDecision: "owner CTR010 choice sent by Lead; same park as X-CTR010-01"`; X-CTR010-01 has the same disposition and "owner CTR010 choice sent by Lead". Closes the first-review rework on X-DUP-01. Gateway YAML pair digests unchanged. |
| 2. X-DUP-03 keyed by the two paths, blob `2ff043edb`, never `e6d9582dd` as identity | ok | deep: groupId is `paths:docs/architecture-manifest.json::docs/platform/contracts/architecture-manifest.json`; `implementationEvidence` records current blob 2ff043edb at B0 and names e6d9582dd as stale, "not an identity key". Source and target digests are equal. Matches the fresh-groups review note. |
| 3. X-SEM-29 routes only to Step 6, cross-references X-DUP-04 | ok | deep: `targetStep: 6`, evidence "duplicate-byte handling is X-DUP-04"; X-DUP-04 has identical source/target ids and digests. The Step 2 record is `routed-to-Step-6:X-DUP-04`, so there is no second verdict. |
| 4. X-SEM-31 routes only to Step 6, cross-references X-DUP-02 | ok | deep: same as row 3 for X-DUP-02 (digest 2ce8f77f...). |
| 5. L11-8 records path-key/current-blob decision without editing the Phase 6 queue | ok | deep: L11-8 (owner-answers.md) chooses the two paths, records 2ff043edb, scope "no baseline or queue edit"; phase-06 diff since base is empty. |
| 6. L11-9 applies the settled-target reading to already-promoted X-SEM-12 | ok | deep: L11-9 applies "target settled; legacy source retires at Phase 9" with no promoted-file edit. X-SEM-12 record says the target is already promoted and legacy stays until Phase 9; area-map-packaging-distribution.md row 12 independently says "Existing promoted owner". 44 reviewed bindings. |
| 7. L11-10 names `docs/platform/README.md` as Step 7 host for all four links, no edit now | ok | deep: L11-10 says add one system-architecture entry to `docs/platform/README.md` in Step 7 and link all four files; X-NAV-01..04 are `targetStep: 7`; docs/platform diff is empty. |
| 8. L11-11 requires real unit digests for all 31 DEFECT/NAV/QF rows in Step 9 | ok | deep: L11-11 states 14 DEFECT + 4 NAV + 13 QF = 31 and "require all 31 real bindings in Step 9". The cross-area-inventory.md closing paragraph repeats it. |
| 9. Step 9 proof list holds the same 31-row real-binding obligation | ok | deep: phase-07 file adds, in Step 9 item 3, "replace every placeholder/non-content digest in the 14 DEFECT, four NAV and 13 QF inventory rows ... prove all 31 bindings", and a proof-table row "Inventory digest bindings ... zero note-id/path-only/route-placeholder hashes remain". |
| 10. QF notation separates `Step 9` from `Phase 8/9`; no bare 8 or 9 in QF fields | ok | deep: all 13 QF rows read. Dispositions and targetStep use "Step N", "Steps 4-6", "Phase 8", "Phase 9", "Phase 8/9"; no bare digit remains. |
| 11. QF-01 carries the Phase 9 re-home obligation for X-A34-01 and X-A34-17..28 | ok | deep: QF-01 `implementationEvidence` names X-A34-01 and X-A34-17..X-A34-28 (successor is the retiring legacy source) and its disposition carries "Phase 9 promotion truth and 12-row residual re-home". X-A34-17 and 18..28 are docs/specs/observe.md and docs/specs/runner.md (legacy); X-A34-01 owner is docs/io-contract.md. Count 12 = 17..28, with 01 named separately. |

Part A: ok 11, rework 0.

Rework items and decisions from the Step 1 reviews, applied: (a) X-DUP-01 CTR010 marker: yes; (b) X-SEM-29/31 single owner step plus cross-reference: yes; (c) L11-8 to L11-11 recorded and reflected in inventory/phase file as listed above. The Step 1 review's digest-binding note was handled under L10-37 as a Step 9 obligation (not wording rework), consistent with L11-11.

## Part B: Step 2 semantic records (28 entries)

All 27 pairs: source and target SHA-256 equal the record and B0; decision file maps source to target; stated reviewed-binding count equals the reviewed claims with that target owner (101, 45, 20, 21, 13, 44, 22, 44, 2, 66, 50, 12, 5, 10, 9, 16, 11, 12, 13, 14, 20, 24, 15, 1, 30, 1, 9). `authorVerdict` is resolved or Step 6 route, `reviewerVerdict` is pending (unfilled by the author, as required). Structural: 28 groups, 28 unique rowIds, counts 26 resolved + 2 Step 6, stopConditions all false. Report reading says "target settled; legacy source retires at Phase 9" with no promotion/retirement action or candidate edit.

| Entry | Verdict | Note |
|---|---|---|
| X-SEM-05 confinement-authority -> platform/agent-confinement/spec.md | ok | mechanical: digests (src, tgt, B0) match; s8-agent-confinement-01 maps source to target; 101 reviewed claims = stated 101; one target. |
| X-SEM-06 fgos-plugin -> platform/claude-plugin/spec.md | ok | mechanical: digests match; s8-claude-plugin-01 mapping; 45 = 45. |
| X-SEM-07 decision-citation-drift | ok | mechanical: digests match; mapping present; 20 = 20. |
| X-SEM-08 distillery | ok | mechanical: digests match; mapping present; 21 = 21. |
| X-SEM-09 transitional-switchboard -> platform/documentation/switchboard.md | ok | deep: digests match; s5-root-mapped-conservation maps (disp supersede); 13 = 13; text says the switchboard stays unedited until Phase 8, matching L11-5; no early retirement implied. |
| X-SEM-10 herdr-web-dashboard | ok | mechanical: digests match; mapping present; 44 = 44. |
| X-SEM-11 observe | ok | mechanical: digests match; mapping present; 22 = 22. |
| X-SEM-12 packaging runtime-identity-and-activation | ok | deep: digests match; s4-packaging-distribution-architecture maps source (split) to target; 44 = 44; L11-9 reading consistent with area-map "Existing promoted owner" and the legacy file's own "Promoted to" header; legacy retains until Phase 9. |
| X-SEM-13 history triple -> docs/specs/runner.md | ok | deep: all three members fully read (see below); member digests match; s2-agent-coordination-classifications carries per-member history-carrier claims. |
| X-SEM-14 specs/runner.md -> platform/runner/spec.md | ok | deep: digests match; s9-runner-01 maps source to 16 targets including this one (split); only 2 reviewed bindings target this file, equal to stated 2; the wording "target-unit bindings" matches. One target owner. |
| X-SEM-15 domainization README -> platform/domainization/architecture/domainization.md | ok | mechanical: digests match; s7 decision maps; 66 = 66. |
| X-SEM-16 system-overview | ok | mechanical: digests match; s6 decision maps; 50 = 50. |
| X-SEM-17 C01-item-card | ok | mechanical: digests match; s8-ui-spec-01 maps; 12 = 12. |
| X-SEM-18 20-domain-rules | ok | mechanical: digests match; mapping present; 5 = 5. |
| X-SEM-19 F01 flow | ok | mechanical: digests match; mapping present; 10 = 10. |
| X-SEM-20 F02 flow | ok | mechanical: digests match; mapping present; 9 = 9. |
| X-SEM-21 ui-spec overview -> platform/ui-spec/spec.md | ok | mechanical: digests match; mapping present; 16 = 16. |
| X-SEM-22 M01 | ok | mechanical: digests match; mapping present; 11 = 11. |
| X-SEM-23 M02 | ok | mechanical: digests match; mapping present; 12 = 12. |
| X-SEM-24 M03 | ok | mechanical: digests match; mapping present; 13 = 13. |
| X-SEM-25 S01 | ok | mechanical: digests match; mapping present; 14 = 14. |
| X-SEM-26 S02 | ok | mechanical: digests match; mapping present; 20 = 20. |
| X-SEM-27 S03 | ok | mechanical: digests match; mapping present; 24 = 24. |
| X-SEM-28 S04 | ok | mechanical: digests match; mapping present; 15 = 15. |
| X-SEM-29 spec.config.yaml | ok | deep: source and target byte-identical (same digest); 1 reviewed move binding = stated 1; verdict `routed-to-Step-6:X-DUP-04`; target "intended" and not resolved here; matches Step 1 row. |
| X-SEM-30 30-states-and-errors | ok | mechanical: digests match; mapping present; 30 = 30. |
| X-SEM-31 surface-contract.schema.json | ok | deep: byte-identical pair; 1 move binding = stated 1; routed to Step 6 / X-DUP-02. |
| X-SEM-32 15-system-events | ok | mechanical: digests match; mapping present; 9 = 9. |

Part B: ok 28, rework 0. Exactly one settled target in all rows except X-SEM-29/31, which are Step 6 routes (26 resolved + 2 routed).

### X-SEM-13 full read confirmation

I fully read all three members.
- migration-status.md: header "Historical evidence only; no current authority", Superseded by runner.md. Literal snapshot is a dated Phase 0-7 migration-status table (Last reviewed 2026-09-18).
- orchestration-vocabulary-map-2026-08-27.md: same wrapper; the snapshot is the retired coordination vocabulary (Mission/Work/Assignment/Run, rings, policy, ID namespaces) with its own header "Design status: Superseded ... Canonical for: nothing". A different meaning and provenance (retained legacy source at fcfe78cb8).
- intent-preservation-ledger.md: same wrapper; the snapshot is the platform-intent ledger (PF-I001..I021, status vocabulary).
The shared first heading "Historical File: Prior navigation before whole-file historical relocation" is wrapper only; the three literal snapshots, provenance paths/SHA-256 and historical purposes all differ. Each is non-authority history and each wrapper names docs/specs/runner.md as the current execution owner. The record's "three distinct witnesses, no merge, single target owner docs/specs/runner.md" is supported. (The ledger snapshot's subject is platform intent rather than execution; runner.md is still the owner the wrappers name, so I accept it as the single target for the record's stated "execution meaning".)

## Notes

- Counts: Part A ok 11 / rework 0; Part B ok 28 / rework 0. Total 39 ok.
- The pair verdicts are on records and evidence, not on the content of the 44-claim bindings themselves (those were reviewed in Phase 6).
- step-02-checks.json records `HEAD: 135230fb3` (the input base), not the request commit. This is consistent, since the request commit adds the artifacts.

## Unresolved

Non-blocking, outside the 39 entries:
1. A34 rows (`5-sample;9-all-affected`) and X-CTR010-01 (`3;9-close`) still use bare step digits in `targetStep`. They mean Phase 7 Steps and are unambiguous in context, but if the L11-11 notation rule is meant to cover all inventory rows rather than QF only, normalize them to `Step N` at Step 9.
2. The Step 7 section of the phase file does not mention L11-10 itself; the host choice lives only in owner-answers.md. Fine as the decision record, but the Step 7 Doer must read it.

Status: DONE
Summary: Pinned digests all verify (7/7). All 11 Part A rework/decision entries and all 28 Part B records are ok; 39 of 39 ok, 0 rework. All three X-SEM-13 members were read in full.
Concerns: None blocking; two notation/documentation observations above.
