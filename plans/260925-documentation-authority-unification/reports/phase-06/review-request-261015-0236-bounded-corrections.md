# Independent bounded corrections re-review request

Author session: codex-session:32@2026-10-15
Assignment: unit-run-1792006482248-ed75dedf/producer/1
Content commit: 7e9fd4bd5d9eff9ef748190256cbe182c5ace00c
Proof commit: 04e476784ed528970ae33b13dbd220bff9948a5a
Entries: 44 (one pack; no second request)
Review status: pending
Pack: [review-pack-261015-0236-bounded-corrections.md](review-pack-261015-0236-bounded-corrections.md)
Pack SHA256: 26d65b8411aaebcb9a63762856301955a533a85830c5a0b544a323ab2e4d39db
Sidecar: [review-pack-261015-0236-bounded-corrections.md.json](review-pack-261015-0236-bounded-corrections.md.json)
Sidecar SHA256: 7381e6b3f1259e391f6a22e854b7587fdca295ef8676296889f285215ccc962c
Verification: [verification-261015-0236-bounded-corrections.md](verification-261015-0236-bounded-corrections.md)

The correction bytes are pinned to 7e9fd4bd5; the completed native proof and root-list refresh are pinned separately to 04e476784. Do not rerun native registry sync for this request. The full proof is `root-boundary-native-verification.json` at the proof commit, sections `fileEditsResume` and `nativeProofResume`. This request packages those persisted corrections and their consequences; it does not certify Step 5 closure.

## Exact population and exclusions

25 rework verdicts + 2 tidied truth rationales + 5 previously accepted distribution binding consequences + 1 AGENTS split-successor = 33 pending changed shard rows. Strict E claims-not-reviewed=25 is a scoped live-claim metric including 3 existing holds, excluding registry-gap/classification rows; it is not the pack population.

| Population | Entries | Review channel |
|---|---:|---|
| Live ordinary claim rows | 23 | Ordinary full-digest claim verdicts; one intentionally has no platform target under Q5 |
| Existing ordinary registry-gap rows rebound by corrections | 7 | Ordinary full-digest gap verdicts through the existing gap channel |
| Changed pending classification refs | 3 | Separately labelled accounting; preserve pending/candidate-unverified status |
| Draft alias 0114 | 1 | Proposal verdict only |
| Four changed native headings | 4 | Native binding accounting |
| Four predecessor-gap/current-body pairs | 4 | Native conservation and pending successor-disposition accounting |
| Root reverse list 832 → 830 | 1 | Exact two-removal list accounting |
| User-knowledge file-level ownership check | 1 | All 21 changed files shown in full before/after |
| Total | 44 | One bounded review |

The 33 shard rows exactly equal `nativeProofResume.changedAtInputCommit.reReviewRows`. All 25 committed reworks are present; the two tidied truth rationales are `claim_05086f8eb3a7fe8c76475c68250251ce` and `claim_be95c2d548d7fa5a1d2406be5584a36a`. Five accepted distribution bindings were reopened because the target changed, and `claim_2ae81c7bed935553943d6777b81e2114` is the real native AGENTS split successor. No unchanged accepted row is resubmitted: exclusion is by exact shard/kind/claim-ID tuple, because an ID can occur in distinct historical/current channels. The 115 retained reviewed rows and 278 applied review/accounting stamps are historical proof, not a new review population. The three Coordination Rings holds and all existing identical-unit exception memberships stay outside this request.

## Review instructions and deliverable

Read the shared review rules in the phase file, `review-brief.md`, and owner answers A19/A22/A23/A28/A31/A34–A37. Every entry shows the report and exact finding or related rework it answers, complete prior/current decision data, source text, prior target where applicable, current target, full 64-hex native digests and shown-text hashes. A heading's native digest uses the unchanged extractor formula; the separate shown-text SHA256 hashes the displayed heading section. Historical sources have their actual full immutable pin. All current content targets are pinned to the content commit; only the proof-only reverse-list target uses the proof commit.

Perform mechanical checks on every submitted row: recompute full native and shown-text digests, verify anchors and exact shard/pack equality. A36 requires a reviewer-selected seeded sample of at least 15% of Weak-exact/Judgment ordinary rows, minimum 10 (all if fewer), plus every differing-digest entry. Record the seed and sampled IDs; mark each verdict note `deep` or `mechanical`. There are 37 differing/absent-target entries, listed in the pack and sidecar, and 21 differing full-file checks in the file-level appendix. More than 3% rework among deep-read rows requires full-pack reading before reporting. A31 merge/conservation review and corrected A37 truth obligations are unchanged by A36: read those submitted corrections and their before/after diffs in full, preserving the earlier code evidence. This is no new truth draw or area-wide truth sweep.

Write one independent ordinary verdict per each of the 30 ordinary claim/gap rows, with `Claim | Verdict | Note | Source digest | Target digest`, full 64-hex native digests and literal `none` for the intentional Q5 absent target. Write separately labelled verdict tables for the other 14 accounting/proposal entries, using their displayed IDs; never present an accounting ID as a new platform claim. The classification entries use `classification-<claimId>` labels; their original claim IDs and destination shards are explicit in the sidecar. They remain pending/candidate-unverified even if their accounting is accepted. Four new native gap pairs preserve the old opaque IDs and show real current IDs; judge the pending same-file supersede proposal without identity grafting. Gap disposition application remains a later independently authorized ordinary accounting step, not a mutation made by this packaging turn.

The reviewer must be independent of the author. Return the report with all notes and dissent intact, bound to this content/proof pair and exact pack hashes. The owner starts the review session; this request does not dispatch it. Do not edit source/candidate content, active aliases, checkers, vocabulary, baselines or extraction rules. No prior approval carries to any changed row or proposal.

## Remaining Step 5 closure work

1. Independent acceptance of this bounded request, then ordinary application of exact committed verdicts and accounting of the four native predecessor gaps. Keep the A34 partial-carry residual and explicit exception/hold memberships visible. Persisted proof currently has D zero fatal and strict E red: partial-carry=1, not-reviewed=25, identical-unit groups=345, candidate-unverified union=1398. These are recorded open data, not unexplained proof failure and not closure.
2. Independent 50-block invented-claim sample with recorded seed: 20 unreferenced candidate blocks, 20 carried blocks with rewritten rationales, 10 random. Independent hostile pass for Step 5; every Critical/High finding fixed or owner-accepted, zero open Critical/High.
3. Commit the fresh-reader scoring key before any reader starts. Owner starts two independent fresh readers, each over the three Step 5 scenarios, using only the candidate area corpus. Score six definition-of-done questions per scenario: at least 5/6 correct, zero nonexistent anchors, zero legacy-authority answers, at most eight files per run; record anchor-check evidence and any isolation limitations.
4. Complete consumer-edge/cutover and draft-alias accounting, retain existing owner-queue obligations, then write the Step 5 batch report with counts, holds, defects, review/rework effort and reproducible proof links. No batch report or closure is claimed by this request.

A37 requires no additional Step 5 truth draw. A35/A37 full work-state truth remains owed at promotion, with known-stale-carrier notes preserved. No Step 6, promotion, push or merge follows from this request. No external blocker prevents packaging; independent review and the listed closure activities remain owed.
