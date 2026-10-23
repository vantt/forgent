# Preserve-premise review receipt

Source pin: `3e2d05af89313dbfbf0d26cd0de34f6b660d194b`. Authority: L12-137, G6 and the L12-121 method. **G6 is not met**; judgments, independent review and F replay remain open.

## Coverage and evidence

`proof.json` owns one digest-bound premise row for **4,804 Step 3 + 609 Step 4 = 5,413** final preserves. The proof independently conserves final-record identities, including Step 4's hashed `slotKey`; it does not inherit the Step 5 verdicts. The 163 final batches comprise 136 matrix-catalog batches and 27 verified zero-edge batches. The extra **38 Step 3 `retire-with-tree` rows** are separately accounted in `retire-with-tree.json`, with physical removal confirmed; they are not counted as preserves.

| Result | Rows |
|---|---:|
| Source-confirmed history/provenance/carriage | 3,011 |
| Operand reachability unchanged in physical candidate | 1,268 |
| Owned park: premise not source-confirmed | 888 |
| Owned park: current passage cannot bind exactly | 92 |
| Owned park: source absent | 2 |
| Lead judgment: preserve with dated successor note | 152 |

Thus **4,279 bounded confirmations, 982 owned parks and 152 proposals**, not 5,413 approvals. `judgments.json` indexes every open row by source, record line, member, current coordinates/digests, owner and blocker. Candidate successors are evidence to review, not automatic pointer patches. In particular, the old “retained path” explanations for live references such as `docs/reading-map.md` are not accepted when the physical target disappears.

`physical-move.mjs` adapts the L12-121 tracked-doc scratch copy, retained exceptions, non-overwriting destination treatment and existing pure index/registry generators. Its historical-premise predicate is copied unchanged. It physically removes 1,039 old paths present at this pin; absent old paths are not fabricated. The additional whole-root Step 6 sweep finds no unlisted remaining files. The owning index scan remains **492 → 490**, removing only the two already identified duplicate documents. No source carriage, runtime parity, candidate authority promotion or live-state parity is claimed.

## History-wrapper recommendation — Lead decision, not an edit

1. **What:** source-confirmed old runner coordinates disappear after the physical cut. `history-wrapper-proposals.json` has a proposal per preserve row, successor existence and digest, and the exact dated note to compose.
2. **Cause:** L12-26(8)/L12-35(3) preserved history framing, not post-cutover filesystem reachability.
3. **Options/cost:** preserve the historical wording and add a dated, reachable successor note outside the snapshot (one co-composed note per affected source unit); or repoint the historical framing (changes original wording and needs an explicit Lead ruling against the previous preserve treatment).
4. **Recommendation:** **preserve-with-dated-note**. The current-owner note uses `docs/platform/runner/spec.md`; the CoordinationSession note uses `docs/platform/runner/decisions/h-aabefc85f0c9.md`. Every proposal checks the successor in the physical post-cutover tree. Repoint remains an explicit alternative per row.
5. **Scope:** 152 row proposals: 146 retired-engine rows, three history/documentation-migration rows and three additional dated playbook-framing rows. This reaches 89 files, including older wrapper rows beyond the review's named set. **All 73 files in the named G7 review batch are covered**, zero missing. Six inner literal-snapshot occurrences remain history preserves, not extra wrapper edits. Lead chooses and has the resulting change composed/reviewed with each owning file; this turn applies none.

## Replay and limits

```sh
python3 -B plans/260925-documentation-authority-unification/reports/phase-09/preserve-premise/proof.py
python3 -B plans/260925-documentation-authority-unification/reports/phase-09/preserve-premise/verify.py
```

Both exit 0. The verifier ran both G2 and G6 generators **twice in separate scratch directories**, comparing all **seven artifacts and each command's stdout byte-for-byte**, also against the delivered artifacts. `verification.json` retains commands, exits, stdout, artifact sizes/hashes and script hashes. Three negative probes reject false retained-pointer custody, mismatching historical passages and a navigation label masquerading as history; the effective Step 3/4 decision predicate also rejects those three classes.

No original L12-121 record/script, product source, test, skill, register or baseline was edited. No Git mutation, fgOS CLI, live workspace state/secret access, full suite, owning product test, pair accounting, service or preview was run. Tests containing fixture Git writes were not executed or filtered. Impact analysis is **degraded/unqueried under no-CLI**, with no product symbol changed. Full suite, independent review, source refresh at F, note/patch composition and A1 accounting remain Lead custody. `needsWrites: []` for this completed records task.
