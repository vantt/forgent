# Bounded closure correction check

Status: READY FOR INDEPENDENT REVIEW. Batch closure: UNPROVEN.
Author session: codex-session:1@2026-10-11
Authorization: owner A28, committed verbatim alone at `4ed399671`; A27 correction scope and A22 binding remain.
Authored snapshot for the frozen gate proof: `221ac1e8eebc71a2b1ece554b34e0e75b89c7c49`. Text pin above remains byte-identical in this snapshot.

## Only two checks

1. Check the eight previously rejected truth/citation units, and their necessary source/successor bindings. Do not reopen the 321-unit truth/receipt pass. Compare `closure-fixes-current-units.json` (eight complete old/current shown units) with current code and the exact correction notes in `review-2-closure-current.md` and `review-2-closure-current-earlier.md`. Text is pinned at `0ddec07f86f5289a304d6070e27595650625ac7f`.
2. Check that `candidate-unverified-agent-coordination.json` equals **both** unchanged strict E reverse-open outputs, with identical claim IDs, paths, anchors and native unit digests, and that every file is eligible under A28. Do not approve these units as true: their truth remains unverified. Effective authority comes from the switchboard, separately from the unchanged canonical capability of a document kind. No promoted file is in the list; history-kind files use A28's history route.

| Prior rework | Correction | Current document |
|---|---|---|
| claim_1be365c3 / claim_e9bb0000 | Verified confidence counts run-produced changed files or dirty-before mutations, not arbitrary test/result artifacts; settlement.mjs:206-226,290 | proposals/team-communication-protocol-v1.md, section 8 / block 38 |
| claim_4206c1d3 | Current blocked outcome mapping citation, herdr-round.mjs:356-367 | architecture/executor-health-and-fallback.md, section 2 |
| claim_0c80eeeb | Remove nonexistent shared mutation door | architecture/runtime-recovery-design.md, block 31 |
| claim_60bdeefb | Cite random launch identity, checked replacement authority and fenced epoch record | architecture/runtime-recovery-design.md, block 33 |
| claim_34a87472 | Cite declared/inline policy and normalizer stamps | contracts/assignment-run-runresult.md, block 9 |
| claim_1acc05f1 / claim_f1ff9633 | Correct two Run metadata citations to assignment-runner.mjs:1563-1582 | contracts/assignment-run-runresult.md, status section / block 4 |

All document paths above are under `docs/platform/agent-coordination/`. No carriage, history bytes, canonical promotion, checker, baseline or vocabulary changed. No new reverse receipt exists; the correction packet is shown-text evidence only and is never referenced by candidateClassifications. Accepted receipt artifacts remain unchanged. The rejected/obsolete references are withdrawn, not passed through silently.

## Binding consequences, not additional truth scope

- `review-pack-2-closure-fixes-source.json`: nine ordinary source rows; native input is `review-input-2-closure-fixes-source.json`. Original legacy text is unchanged; changed target digests/ancestry are pending, with no approval carried.
- `review-pack-2-closure-fixes-retired.json`: nine retired successor rows and six identity-gap successors. Original source commits, complete shown text and native digests are retained. Five unstable old IDs remain in the extractor's identity-gap records and receive real pending successors; one existing successor changes target. Every change is caused by the same eight fixes.
- `closure-fixes-bindings.json`: exact physical shard paths, before/after rows and withdrawals. Six unrelated retired rows with byte-identical native text across this pass are deliberately unchanged.

Commit independent reports with a typed `Reviewer:` identity different from the author session. Use **exactly** this native table order for source/retired/gap verdicts; one row per affected identity, notes verbatim:

```text
| Claim | Verdict | Note | Source digest | Target digest |
```

Use sourceUnitDigest / targetUnitDigest from the packets, not a full-document hash. The eight truth findings may be reported together or separately, naming previous/current IDs and digests. The list-equality/status check is a report finding, not 326 invented ok verdicts. No author-made report or approval stamp will be used.
Source/retired/gap reports must include `Review mode: ordinary`, `Reviewer: reviewer:<different-session>@<date>` and `Author session: codex-session:1@2026-10-11`. No pack seed/score is required for this ordinary bounded check; committed report pins and independence remain mandatory.

## Proof boundary

Both prior-registry full D commands pass, zero fatal. Both strict E diagnostics exit 1, exactly:
- 12 pending source rows: three unchanged Coordination Rings holds plus nine binding consequences awaiting this check;
- 342 existing identical-owner exception groups;
- 326 reverse-open units, exactly the candidate-unverified list.

The list adjusts the former 321-unit boundary: one existing block receives a new digest/ID after its citation fix, and five rejected corrected units remain explicitly unverified; net +5. No old ID disappears from accounting. After committed ok verdicts are applied, the nine source consequences must leave the pending set; the three holds stay. Closure then compares unchanged strict E with the holds, existing identical-unit exceptions and this list. No strict result is relabelled green by changing a checker.

Commands, actual outputs, seven-file tests (155/155), four read-only smokes (41 assertions), preservation/isolation and list comparison are in `closure-fixes-verification.json`. D/E commands use `scripts/check-doc-inventory-gates.mjs` and run once for each `--previous-registry`: `reports/identity-registry.json` and `reports/phase-02-identity-registry.json`; strict E adds the recorded 937-path scope and `--strict`. Refresh the unchanged extractor at the committed authored snapshot as recorded before rerunning; inventory shards are scratch artifacts, never committed.

No archive/delete or promoted-portal edit, no new main-spec conflict, no main write. Three Rings holds remain in the owner queue. Stop here for the committed independent report; no Step 3 content starts now. Later batches use A28: all judgment/weak-exact rows reviewed, exact sample unchanged, 30 randomly selected current units checked against code, above 10% false stops; full truth review at canonical promotion. Existing checkpoint sensitivity reviews are unchanged.
