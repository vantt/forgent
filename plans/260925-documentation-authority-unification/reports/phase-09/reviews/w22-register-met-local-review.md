Verdicts: 10 APPROVE / 4 REWORK

# W22 review: gate register met-local claim (04319c952)

This is an independent, read-only review. Branch `plan/260925-documentation-authority-unification`, HEAD `04319c952` throughout. Brief: `w21-register-catchup-brief.md`, ruling L13-19. Per-item verdicts are in [w22-register-met-local-review.json](w22-register-met-local-review.json).

The register says G0–G9 are met-local and that nothing remains before F except owner, external and F items. **That is not yet true.** Three gates (G2, G6, G9) still have unlisted or mislabelled local work. `cutoverReadiness` lists an order of steps that contradicts L13-6. The commit itself is correct.

## Proofs run

| Command | Exit | Result |
|---|---:|---|
| `python3 -B P/gate-reconcile/verify.py` | 0 | `passed`. It rewrote only `verification.json` `checkedAtHead`, which I restored from HEAD bytes. |
| `python3 -B P/gate-reconcile/controls.py` | 0 | `passed`, 10 controls |
| `node P/carries/verify-carries.mjs` | 0 | `pass`. Live drift only on `bin/fgos.mjs` and `docs/backlog.md`, both listed as duties. |
| `python3 -B P/g5/check.py --pin b57e79625` | 0 | stdout is byte-identical to `g5/check-b57e79625.json`; stderr is empty |
| G5 receipt §3 assertion block | 0 | `PASS` |
| Scratch `git clone --shared` at 04319c952 (tempfile dir under `/tmp/fgos-work/`, since deleted): `citations.py --pin cf13e2bd…`, then `join.py --pin cf13e2bd…` twice, with `NODE_OPTIONS=--no-addons` | 0 / 0 / 0 | Both runs give byte-identical stdout and stderr. All five outputs equal the committed bytes, and `git status` stays clean after every step. Counts: 779 + 289 + 54 + 4 = 1,126. |

The worktree is clean apart from these two report files.

## Commit 04319c952: APPROVE (1 Low)

- **pc-d-0288 is applied correctly.** It is now `confirmed REJECT` in group `test-diagnostic-rendering`, with the L13-19.1 reason and its locator. `owningProofs` is `[]` and the inferred `custody` is removed. `residue.json` is empty.
- **The other REJECT rows are unaffected.** The new `row.pop('custody')` line in `join.py` touches only 0288, because no other settlement REJECT row had `custody`. The other 57 changed rows differ only in their `sourceCommit` pin.
- **I approve the REJECT independently.** Line `:34` is an `assert.fail` message template. It renders only when the test fails, and it is neither a document path nor product input. W21 had reviewed this row only as a park. This review supplies the independent APPROVE that the G2 definition asks for.
- **The G5 receipt is fixed.** It now opens with the current run (exit 0; 1 verbatim / 8 restated / 1 not applicable; 31 controls). There is one `## 4.` heading, and its reproduction commands pass.
- **Low: three approved locators regressed, undisclosed.** `join.py:273` takes as its anchor the evidence span whose pin equals `--pin`, and otherwise falls back to `evidence[0]`. Re-pinning to cf13e2bd removed the matching span for three rows, so their locators changed:
  - `pc-d-1101`: `:30@5820ca678` became `:85@5e03159`. W20 had flagged this exact wrong line, and W21 approved the move to `:30`.
  - `pc-d-0924`: `:3868` became `:3862@5e03159`.
  - `pc-d-0449`: `:184` became `:183@a808bc676`.

  The census receipt still describes the corrected lines. The evidence spans themselves are intact. **Fix:** anchor on the newest span for the row's file (or the span at `currentLine`), not on exact pin equality.

## Gates

**G0 APPROVE.** The 191 rows are covered by g0-b1..b5 and the delta reviews. Of the 124 content rows, W14 approved 121 and found 3 REWORK; those 3 were fixed and passed W16, and W17 passed the follow-up. W19 approved the 25 current rebinds. The GAP-05 overlays were approved row by row in W10 F2 (90 rows) and W9 (44 rows); the register should cite those reviews under G0, because L13-11.2 makes the overlays G0 work. The claim_2e2bc926 deferral under L13-15.2 is sound, because its successor depends on main code that only arrives with the F import.
- **Info:** no join tool exists yet for "shards@F × verdict file". Many reviews recomputed every row (for example, s13 1057/1057) but did not emit per-row `{id, bindingSha256, targetUnitDigest, APPROVE}` records. Building that join now, before F, would keep it out of the lease window.

**G1 APPROVE.** All 115 members are joined. GAP-05, citation-chain and import-3 approvals trace to W8–W14. Live parity and the 25 rebinds are approved in W19, and the duty cleanup in W20 B. The scratch guard replay (W9: dead-vocabulary 10/10) exists. The L13-16 F placement of the two drifted pointer patches is sound, because main changed those files.

**G2 REWORK (Medium).** The census itself is settled: 1,126 rows with zero open judgments, W20/W21 trace every REWORK to an approved fix, and 0288 has my APPROVE above. The problem is `census-join/pointer-patches.json`, which holds 4 composed but unapplied retargets of code comments that cite legacy docs:
- the files are `src/setup/registrations.mjs`, `src/setup/workflow-case-checks.mjs`, `test/setup/doctor-fresh-run.test.mjs` and `test/runner/execution/bind-tier-composition.test.mjs`;
- their status is `composed-not-applied-pending-shared-file-integration`;
- the record itself says "Lead must compose the full approved chain at F".

Neither the G2 F list nor the composition chain includes them; `composition/patch-specs.json` and `actions.json` contain no match. Without them, the 4 citation joins point at files that the cutover deletes. **Fix:** add a G2 F duty: compose and apply the 4 retargets at F, recheck their `expectedAfterSha256` and rerun the citation join.

**G3 APPROVE.** W2-g3 approves all 17 ids at cffe725b9: dropped-001 restored and honestly requalified, 010 superseded, no tie. The 5 REWORKs in that review are packaging re-sync items for G1/G0, not G3. Register statuses are `restored-pending-review` 16 and `superseded-pending-review` 1, so no `dropped-needs-*` remains. The F recheck is pre-existing register text.

**G4 APPROVE (Low).** The declaration, wrapper and escape fixes are reviewed (W4, W5, W6, W8). The owner declared all 25 sites under L13-6, and the Git/HARDEN review is listed as external. The board shows no Git-owner review yet.
- **Low:** G4 has no F duty, but the F main import can bring new Git sites that are undeclared on the branch. Add "rerun `git-one-door-scan` at F: 0 undeclared".
- **Info:** the note's "design-lap still must not pull main" is stale. The board at 11:35 says design-lap now runs main `1c3c786c3`.

**G5 APPROVE.** I reproduced `check-b57e79625.json` byte for byte, and W21 B approves it. Owner acceptance of the 8 restatements is external, and the rerun at F is listed.

**G6 REWORK (Medium).** The plan's G6 "met" allows owned parks, so the status can stand. The F duty text cannot. It says "Only composition is deferred; the judgments were reviewed before F" (L13-17.2). `preserve-premise/proof.json` contradicts that:
- **623** `park-unconfirmed-preserve-premise` rows each say "confirm source-bound non-dereferencing semantics … or co-compose/review the live-pointer successor … Lead owns this row before flip".
- **162** `park-source-removed-by-cutover` rows each say "Review … non-identical successor(s) and compose/review".
- **2** `park-source-absent` rows have similar actions.
- Only the **137** `park-current-passage-unbound` rows tie their own action to F.

W8 parks approved that each row is *correctly parked*. It did not judge the premise. So about 787 semantic judgments are open, and they do not need the flip date. L13-17.2's reasoning holds for the 163 dated notes and the 6 repoints, not for these rows. Under the plan they would land inside the lease window, which is the write freeze. L13-17.1 refused exactly this deferral for G2.

**Fix:** correct the F text and give the counts. Then either settle the 787 judgments before F (digest-bound, so only F drift reopens rows), or record a new Lead ruling that places them at F and states the lease-time cost in the packet.

**G7 APPROVE.** g7-c1..c7 give 385 APPROVE / 2 REWORK. Both REWORKs are approved in W8, and the 101 park actions in W9/W10. The 36 deferred specs and the post-apply rebinds are W0-prefilter/W3 duties.

**G8 APPROVE (Low).** L13-18 is sound. `archive/design.md` makes the ref create-only, refusing a different target, and the partition bound to d3efc70c5 is rebuilt at F. A ref created now would block the correct one. W20 C approves f67e0f676.
- **Low:** the W14 finding `json-path-strings-undocumented` (40,641 retained JSON path strings; add one recovery sentence to `design.md`) is not fixed. It has no owner and is in no F list; the register calls it only "a separate documentation note". Fix it now, or list it as a G8 F duty.

**G9 REWORK (Medium).** The 15 `carriedBlocker` records are listed as external, "open with their original owners" (L13-14). Reading the phase-08 records shows that **33 of their 170 blocker entries, in 7 records, name "Phase 9" as the dependency**:
- retention-or-move decisions for `docs/decisions/index.md` (15), `docs/enduser-docs-index.json` (10), `docs/contracts/fgos-gateway-api-v1.yaml` (3) and `docs/architecture-manifest.json` (1);
- four "Phase 9 carry" items.

Their recorded owner is this phase's Lead, not WORK. No phase-09 record decides them; the string "retention-or-move" appears nowhere under `reports/phase-09`. These decisions are local and do not depend on F, yet they appear in neither `beforeFinalPin` nor the F list. **Fix:** decide them (cite the decision, for example L12-96's generated index) or list them as before-F Lead items. Keep only the WORK and registry exports as external. The rest of G9 stands as W18 approved it.

**G10 APPROVE.** Status `external` is correct. §7 consent was requested (L13-1); the board shows none granted. The rehearsal depends on G11 and F.

**G11 APPROVE (Info).** Status `external` is correct. The L13-12 "design-lap must not pull main" constraint carried in the externals is stale (see G4).

## cutoverReadiness: REWORK (Medium)

- **The aggregation is mechanically complete.** Every gate's F item appears with its gate prefix in the top-level list (26), and every gate external in the top-level externals (9).
- **The content is not complete.** The G2 pointer-patch duty and the 33 Phase-9 decisions are missing, and the latter are labelled external.
- **The order contradicts L13-6.** The last F item says to write and review the final status ledger "and only then assemble the owner cutover packet". L13-6 and this task send the packet at met-local, before F. The packet should state one order: owner approval → lease → F import → F duties → final ledger review → Land, with a stop if an F duty fails.
- **The packet does not size the F window.** Owner approval starts the lease and the write freeze, so the owner needs the size of the work inside it:
  - about 787 G6 owned-park judgments plus 137 rebind parks;
  - 407 distinct bindings to resolve (W10 sizing);
  - 130 main-owned glosses;
  - delta re-reviews for G0, G2, G7 and G9.

## Recommended actions

1. G2: add the F duty for the 4 census pointer retargets.
2. G6: correct the L13-17.2 F text with the counts. Settle the ~787 park judgments before F, or record a ruling and its lease cost.
3. G9: decide or list as before-F the 33 Phase-9 retention-or-move/carry dependencies. Stop labelling them external.
4. cutoverReadiness: fix the step order to match L13-6 and add an F-window workload summary.
5. Low: fix the locator anchor selection; add the G4 F rescan; own the G8 JSON path-string note; cite the W9/W10 overlay reviews under G0.
