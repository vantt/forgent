# Agent Coordination review request

Status: ready-for-review; P4 authoring complete, not batch closure.
Author session: codex-session:1@2026-10-08
Source pin: 76585861f718c7ef0dd6150d9b92a7c7baaa3ec4
Candidate-document pin: 0a41d793e60631aa9073c73a941f641548862b6c
Decision-data pins: 576f9efea72de92d4191eb295afd9b2349bbb99a and d8a250ced380b855d50ce34fa749b50c64c7e45b
Visible pack pin: d8a250ced380b855d50ce34fa749b50c64c7e45b
Owner A9: aa688258b08f3b64ede2fd7003bd2544142419a0

All paths below are relative to `P = plans/260925-documentation-authority-unification`, unless absolute. Work in `/home/vantt/projects/forgentX-phase00-documentation-authority-unification` on `plan/260925-documentation-authority-unification`, never main. A9's producer correction is green; no additional tooling re-review is requested.

## Read first

The phase contract and owner amendments A1–A9; review-brief.md; frozen vocabulary/constitution; shard schema; batch-agent-coordination.md/json; corpus-projection-verification.json; review-packet-2.json. Read the actual candidate diffs, promoted-edits.md and post-review-edits.md. No real manual or corpus approval has been produced by the author.

## Full manual review

Read every source/target unit in these ordinary, unseeded packs. The `.md.json` sidecars bind the shown text; the reviewer reads Markdown. All 1,434 pending judgment ids appear exactly once across the four packs.

| Decision shard | Pending rows | Visible Markdown |
|---|---:|---|
| ledger/decisions/s2-agent-coordination-judgment-01.json | 500 | /tmp/phase06/review-agent-coordination-judgment-01.md |
| ledger/decisions/s2-agent-coordination-judgment-02.json | 500 | /tmp/phase06/review-agent-coordination-judgment-02.md |
| ledger/decisions/s2-agent-coordination-judgment-03.json | 430 | /tmp/phase06/review-agent-coordination-judgment-03.md |
| ledger/decisions/s2-agent-coordination-log-duplicates.json | 4 | /tmp/phase06/review-agent-coordination-log-duplicates.md |

Reproduce a pack with the existing CLI: `node scripts/propose-doc-decisions.mjs --pack "$P/ledger/decisions/<shard>.json" --inventory "$S/review-doc-inventory.json" --repo-root "$W" --out "$S/review-agent-coordination-<suffix>.md"`. Exact hashes and pin are in review-packet-2.json. Scratch packs are reproducible, not inventory shards to commit.

Check whole versus partial carry, disposition, claim kind, correct single owner/anchor, own rationale, named remainder where required, and no pointer-back-only carrier or unlabelled invented claim. The two legacy-only documents' 190 rows are pending move into the authorized literal history snapshots, not archive. The scheduler row is pending supersede under A8; neither enum was edited. The four byte-equal log/Markdown pairs require manual full-file context, not mirror-class approval.

Read ledger/retired-unit-decisions.json and the committed retired-source-inventory-review.md. It displays the entire old 128,009-character source-inventory unit and new 128,477-character unit, source/target digests, ancestry and exact two preservation replacements. The old identity remains retired, never removed from conservation. Return its ordinary digest-bound verdict in review-2-retired-unit.md. It is outside the live legacy pack/apply row lookup: do not blindly pass it to --apply-review. Only after the independent report is committed may its disposition record acquire that review's identity/date/report pin and shown target digest.

## Script-proven spot check

Population: `/tmp/phase06/script-proof-population-agent-coordination.json`, 15,600 rows, split into 12,878 Mirror and 2,722 Unit-exact. Pin/hash in review-packet-2.json. The gate must re-prove every entry; the reviewer independently draws 100 random unique rows from this complete population and records the selected ids, method and observations in review-2-script-sample.md. The author drew no sample. No per-batch mutation seed is used.

The population is the merged script-reviewed rows from the committed mirror/exact shards, selected by the legacy Agent Coordination source prefix and script reviewer; full source/target locators and native unit digests are supplied. Rebuild with loadProposalContext + loadDecisionShards + applyDecisions using the existing unit/digest lookups if scratch is absent; verify both class counts and unique ids before drawing. Do not use only the four manual packs as a sample population.

## File decisions, policies, conflicts and reverse direction

- Read ledger/decisions/s2-agent-coordination-files.json: 70 area file decisions; also s2-generated-projections.json: three regenerate-from-source file decisions. Generated roots are not retired or re-pinned as history. Future root authoring must not duplicate these file decisions.
- Read all three s2-corpus-*.json policies and their complete classified membership. Corpus counts are 1,705 history files, 515 user-knowledge files and 40 consumer-project files. Claims remain fully expanded/reviewed only after the policy's independent committed report. A9 omits generated items from corpus file overlays; all three generated files retain their explicit file role. No file-class guard is bypassed.
- Read ledger/conflict-resolutions.json: 815 duplicate and 205 semantic receipt proposals; correct current members, canonical owner and named resolution, not acceptance by a free-form declaration. Frozen retirement currently leaves only three duplicate and 13 semantic groups outside this batch; receipts still need independent semantic acceptance.
- Read identical-unit-exceptions.md/json: 334 contextual multi-owner exception proposals. Check every context/rationale; do not blanket-approve proof snapshots or short normative text.
- Read reverse-agent-coordination.md/json: 184 unnamed candidate units, complete text, ancestry and proposed classifications. Verify each against source or explicit Added in candidate evidence. This classification is not a gate waiver and does not assert reverse closure.
- Review the promoted portal diffs e4650e585 and 0a41d793e, source-inventory reference update 3e9c35999 and the two history snapshots 99bc9fe53/c32b503df. Owner A8 notes the archive/portal lists; no further author action before review.

Corpus report rule digests:

| Corpus | Digest |
|---|---|
| history-evidence | efa84a36a83aad82772a6d64b71bcc5e7d24d6782aee97e9600a492be1c6088a |
| user-knowledge | 433e848c90ee0cf9805ceb2d031c714bf64a819f49e7352a0100aa7e9ac35cdd |
| consumer-project | 47661c744c759ea1ffa1e6d7bee60fffb04b66d89c530c6c5259884990082d59 |

Use separate review-2-corpus-history-evidence.md, review-2-corpus-user-knowledge.md and review-2-corpus-consumer-project.md. Each report includes the independent Reviewer header, Author session, Corpus, exact Rule digest and one `corpus:<name>` verdict with the reviewer's own note. Recompute digests using corpusRuleDigest; no seed/pack score is required for an ordinary policy review.

## Committed review outputs

Write review-2-<shard>.md from a different session. Declare Reviewer, Author session and `Review mode: ordinary`; manual verdict tables have Claim / Verdict / Note / Source digest / Target digest columns. Use full source/target SHA-256, or `none` for no target. Bind exactly the text shown, not a later target. Every pending manual row receives ok/rework/hold and its own substantive note.

Commit reports before any approval flip. Ordinary --apply-review must read those committed reports and retain mandatory H1 authorship, author/reviewer independence, report ancestry/pins and shown-text digest binding. Corpus, file and retired metadata decisions need their independent verdicts recorded; never fabricate historical authorship or approvals to make a gate pass. Hold/rework follows A2: unknown-blocking stays blocking, other dispositions pending, note without reviewedBy/reviewedAt; held unknown-blocking ids go to the owner queue.

No per-batch seeded pack or reviewer red-team. Checkpoint rules after Steps 3/6 and closing are unchanged. No push, PR, merge into main, ship or authority flip. The author waits for committed reports, does not review its own rows and does not begin the next batch.

## Gate commands and observed limits

Set W/P/S as above; retain B0/SYNC from progress.md. Rebuild scratch using the frozen generator and the invocation-only retired-unit projection recorded in batch-agent-coordination.json. Preserve the old retired identity and pending disposition; do not edit committed registries or commit *.parts directories. Refresh before gate runs after a commit.

Run this D command twice, once for each PREV:

```sh
node scripts/check-doc-inventory-gates.mjs \
  --inventory "$S/review-doc-inventory.json" \
  --identity-registry "$S/review-identity-registry.json" \
  --decisions "$P/pilot/decisions" \
  --decisions "$P/ledger/decisions" \
  --previous-registry "$PREV" --json
```

PREV values: `$P/reports/identity-registry.json` and `$P/reports/phase-02-identity-registry.json`; both must pass. A/B/C/F/G/H/I use the frozen commands/amendments. Test commands and 393 explicit files are in corpus-projection-verification.json: targeted 8/8, scripts 872/872, full suite 7,289 pass/zero fail, eight skip and 65 todo UNPROVEN. Wrong generated disposition still fails the unchanged validator. Baseline default output is byte-identical before/after the correction.

Observed scoped NON-STRICT completeness: 1,434 pending judgments, 334 identical-unit exception groups and 184 unnamed candidate units; zero fatal findings. After independently committed verdicts and necessary rework, P6 must run strict E twice for the whole legacy area, compare open data against holds/exceptions, close reverse gaps, perform reduced promotion rehearsal and fresh-reader scenarios. None is waived by this request. Retirement is still 15 blocked/four pass/one review, zero invariants. This is ready for independent review, not strict closure or a completed phase.

## Owner lists and exact next step

Archive: 65 migration-notice units, ids/reasons in batch-agent-coordination.json; no obsolete delete or physical legacy deletion. Source holds zero; corpus-policy holds zero; scheduler enum owner-resolved, its row still pending. Promoted edits are logged for owner inspection. No new owner decision is requested now.

Next: owner starts the independent review session for these paths, reviewer commits its reports, author then resumes only to apply/rework those verdicts and prove P6. Independent approval, strict E, reverse closure, rehearsal, readers, batch close and Phase 6 completion remain UNPROVEN.
