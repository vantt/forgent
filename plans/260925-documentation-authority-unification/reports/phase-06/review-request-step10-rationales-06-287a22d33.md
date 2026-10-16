# Bounded re-review: rationales 6

Author session: `codex-session:unit-run-1792114313040-56132651@2026-10-16`
Packaged by: `codex-session:unit-run-1792116045118-73cfbb42@2026-10-16`
Content commit: `287a22d33a0eaf2d9e47549a1142daf62361bb8c` (author changes at `0d8c602e2`)
Comparison base: `5035fed52e60254ecbe034cc987553feb24616f4`
Entries: **60**; each request at most60 entries and400000 bytes.

[Single request index](review-request-step10-index-287a22d33.md). Before values are historical; currentDecision and after for content rows come from `git show <content commit>:<shard>` through unchanged `reviewEntryFromCommittedRow`. New package-native predecessor rows are explicitly labelled overlay and require the runner package commit. No seed, sample IDs or verdict chosen by producer.

Reproduce all-shard consistency and every714 generated rationale (unchanged checker, no --apply):

```sh
env -u CLAUDE_CODE_SESSION_ID TMPDIR=/tmp/fgos-work python3 plans/260925-documentation-authority-unification/reports/phase-06/step10-sync287-reproduce.py consistency
```

Reproduce tests yourself (473 expected):

```sh
env -u CLAUDE_CODE_SESSION_ID TMPDIR=/tmp/fgos-work node --test test/scripts/doc-*.test.mjs test/scripts/check-doc-*.test.mjs test/scripts/generate-doc-inventory.test.mjs test/scripts/list-doc-anchors.test.mjs test/scripts/verify-phase-02.test.mjs test/scripts/next-doc-id.test.mjs
```

Run at the runner package checkout from repository root. The consistency reproduction materializes scratch only under `/tmp/fgos-work/`, checks all90 pinned shards with the original checker, verifies their current-row equality, then audits all4 package-native rows with unchanged `checkLegacyRationale`:12893 rows/91 nonempty shards in total. The original checker directly on the new shard errors because its historical oldRow lookup assumes every shard existed at5035fed52; that observed limitation is preserved in `step10-sync287-rationale-consistency.log`. No checker code was altered or bypassed for a pass.

Review every submitted current claim with an ordinary verdict and full digest/anchor/shard equality. Rationales are grouped for mechanical regeneration plus an independent seeded deep sample of at least108/714. A36 additionally requires reviewer-seeded at least162/1079 conservative Weak-exact/Judgment population, every unequal source/target digest and partial/historical row deep. One independently selected draw may satisfy both populations if both coverage thresholds are met; otherwise add draws. All exact doc corrections, tool changes and marked native predecessor transitions are deep. >3% deep rework escalates to the entire pack. Report seed/sample IDs and each claim's deep/mechanical note. Independent checkpoint/truth/red-team obligations remain. Confirmations retain existing committed approvals; metadata/evidence/native entries do not approve claims.

## Entry rationale-301

```json
{
  "entryId": "rationale-301",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_a8648a7aeedf0e3b676449beab92c30f",
  "before": "The current successor at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#82-compatibility-mapping supersedes the stale current-state claim shown at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-77 before 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The original frozen source remains conserved by the accepted carriage and its dated complete historical carrier; this is a truth correction, not a new move or retirement. The section-specific code/CLI evidence is recorded in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json. This successor is pending independent truth review, with no inherited approval.",
  "after": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:426-432#unheaded-block-76 (current lines); unit SHA256 a3ba13ce7a942c40b2a0af30815061c9b60f2f787e589314a17141b7337d6728.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:382-382#82-compatibility-mapping (current lines); unit SHA256 ec383764a04487a6dd4b57aa7e12d2813ecda979eb2df8c2f4cc4f404a64ff8d.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest ec383764a04487a6dd4b57aa7e12d2813ecda979eb2df8c2f4cc4f404a64ff8d at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 76\" → \"8.2 Compatibility Mapping\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-76 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#82-compatibility-mapping; source context \"Dispatch Control Plane Redesign / 8. DispatchAssignment / 8.2 Compatibility Mapping\", target context \"Dispatch Control Plane Redesign / 8. DispatchAssignment\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 300,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_a8648a7aeedf0e3b676449beab92c30f",
    "sourceUnitDigest": "a3ba13ce7a942c40b2a0af30815061c9b60f2f787e589314a17141b7337d6728",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:426-432#unheaded-block-76 (current lines); unit SHA256 a3ba13ce7a942c40b2a0af30815061c9b60f2f787e589314a17141b7337d6728.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:382-382#82-compatibility-mapping (current lines); unit SHA256 ec383764a04487a6dd4b57aa7e12d2813ecda979eb2df8c2f4cc4f404a64ff8d.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest ec383764a04487a6dd4b57aa7e12d2813ecda979eb2df8c2f4cc4f404a64ff8d at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 76\" → \"8.2 Compatibility Mapping\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-76 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#82-compatibility-mapping; source context \"Dispatch Control Plane Redesign / 8. DispatchAssignment / 8.2 Compatibility Mapping\", target context \"Dispatch Control Plane Redesign / 8. DispatchAssignment\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "82-compatibility-mapping",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "ec383764a04487a6dd4b57aa7e12d2813ecda979eb2df8c2f4cc4f404a64ff8d",
    "targetAncestry": [
      "Dispatch Control Plane Redesign",
      "8. DispatchAssignment"
    ]
  }
}
```

## Entry rationale-302

```json
{
  "entryId": "rationale-302",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_14669b63c931eebaaeb2664f0ee78959",
  "before": "The current successor at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#10-structured-result-and-confidence-ladder supersedes the stale current-state claim shown at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-95 before 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The original frozen source remains conserved by the accepted carriage and its dated complete historical carrier; this is a truth correction, not a new move or retirement. The section-specific code/CLI evidence is recorded in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json. This successor is pending independent truth review, with no inherited approval.",
  "after": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:559-561#unheaded-block-94 (current lines); unit SHA256 729047f18a90eaf057dc977708d0b2c03dd029a26cb667b23cec02c743321bad.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:497-497#10-structured-result-and-confidence-ladder (current lines); unit SHA256 7de031140299c76f14d6edaea7f7ad703809928ca203de49012f1c6995a29ca9.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 7de031140299c76f14d6edaea7f7ad703809928ca203de49012f1c6995a29ca9 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 94\" → \"10. Structured Result And Confidence Ladder\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-94 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#10-structured-result-and-confidence-ladder; source context \"Dispatch Control Plane Redesign / 10. Structured Result And Confidence Ladder\", target context \"Dispatch Control Plane Redesign\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 301,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_14669b63c931eebaaeb2664f0ee78959",
    "sourceUnitDigest": "729047f18a90eaf057dc977708d0b2c03dd029a26cb667b23cec02c743321bad",
    "claimKind": "contract",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:559-561#unheaded-block-94 (current lines); unit SHA256 729047f18a90eaf057dc977708d0b2c03dd029a26cb667b23cec02c743321bad.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:497-497#10-structured-result-and-confidence-ladder (current lines); unit SHA256 7de031140299c76f14d6edaea7f7ad703809928ca203de49012f1c6995a29ca9.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 7de031140299c76f14d6edaea7f7ad703809928ca203de49012f1c6995a29ca9 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 94\" → \"10. Structured Result And Confidence Ladder\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-94 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#10-structured-result-and-confidence-ladder; source context \"Dispatch Control Plane Redesign / 10. Structured Result And Confidence Ladder\", target context \"Dispatch Control Plane Redesign\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "10-structured-result-and-confidence-ladder",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "7de031140299c76f14d6edaea7f7ad703809928ca203de49012f1c6995a29ca9",
    "targetAncestry": [
      "Dispatch Control Plane Redesign"
    ]
  }
}
```

## Entry rationale-303

```json
{
  "entryId": "rationale-303",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_aa6d3cfae49d49c243cbb2d85d3138b0",
  "before": "The current successor at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#10-structured-result-and-confidence-ladder supersedes the stale current-state claim shown at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-98 before 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The original frozen source remains conserved by the accepted carriage and its dated complete historical carrier; this is a truth correction, not a new move or retirement. The section-specific code/CLI evidence is recorded in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json. This successor is pending independent truth review, with no inherited approval.",
  "after": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:570-572#unheaded-block-97 (current lines); unit SHA256 2c8858f4745fc75c26be7a9b80c4ff3ad1b8ad2f81158f785b367afc790b51e8.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:497-497#10-structured-result-and-confidence-ladder (current lines); unit SHA256 7de031140299c76f14d6edaea7f7ad703809928ca203de49012f1c6995a29ca9.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 7de031140299c76f14d6edaea7f7ad703809928ca203de49012f1c6995a29ca9 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 97\" → \"10. Structured Result And Confidence Ladder\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-97 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#10-structured-result-and-confidence-ladder; source context \"Dispatch Control Plane Redesign / 10. Structured Result And Confidence Ladder\", target context \"Dispatch Control Plane Redesign\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 302,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_aa6d3cfae49d49c243cbb2d85d3138b0",
    "sourceUnitDigest": "2c8858f4745fc75c26be7a9b80c4ff3ad1b8ad2f81158f785b367afc790b51e8",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:570-572#unheaded-block-97 (current lines); unit SHA256 2c8858f4745fc75c26be7a9b80c4ff3ad1b8ad2f81158f785b367afc790b51e8.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:497-497#10-structured-result-and-confidence-ladder (current lines); unit SHA256 7de031140299c76f14d6edaea7f7ad703809928ca203de49012f1c6995a29ca9.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 7de031140299c76f14d6edaea7f7ad703809928ca203de49012f1c6995a29ca9 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 97\" → \"10. Structured Result And Confidence Ladder\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-97 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#10-structured-result-and-confidence-ladder; source context \"Dispatch Control Plane Redesign / 10. Structured Result And Confidence Ladder\", target context \"Dispatch Control Plane Redesign\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "10-structured-result-and-confidence-ladder",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "7de031140299c76f14d6edaea7f7ad703809928ca203de49012f1c6995a29ca9",
    "targetAncestry": [
      "Dispatch Control Plane Redesign"
    ]
  }
}
```

## Entry rationale-304

```json
{
  "entryId": "rationale-304",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_0dd2b9c7a6cf201063f60b541137a8b4",
  "before": "The current successor at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#121a-herdr-own-rust-vocabulary-is-a-separate-namespace supersedes the stale current-state claim shown at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-114 before 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The original frozen source remains conserved by the accepted carriage and its dated complete historical carrier; this is a truth correction, not a new move or retirement. The section-specific code/CLI evidence is recorded in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json. This successor is pending independent truth review, with no inherited approval.",
  "after": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:643-655#unheaded-block-113 (current lines); unit SHA256 0d16c78522042b7f52488ab73957d4f4263e74ad2e70104da672f86ae9d9c9bb.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:617-617#121a-herdr-own-rust-vocabulary-is-a-separate-namespace (current lines); unit SHA256 043499b91025f70c20790bfe18521027c12f672d56d9b14c66e8359c1fc131ae.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 043499b91025f70c20790bfe18521027c12f672d56d9b14c66e8359c1fc131ae at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 113\" → \"12.1a Herdr Own Rust Vocabulary Is a Separate Namespace\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-113 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#121a-herdr-own-rust-vocabulary-is-a-separate-namespace; source context \"Dispatch Control Plane Redesign / 12. Transport / 12.1a Herdr Own Rust Vocabulary Is a Separate Namespace\", target context \"Dispatch Control Plane Redesign / 12. Transport\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 303,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_0dd2b9c7a6cf201063f60b541137a8b4",
    "sourceUnitDigest": "0d16c78522042b7f52488ab73957d4f4263e74ad2e70104da672f86ae9d9c9bb",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:643-655#unheaded-block-113 (current lines); unit SHA256 0d16c78522042b7f52488ab73957d4f4263e74ad2e70104da672f86ae9d9c9bb.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:617-617#121a-herdr-own-rust-vocabulary-is-a-separate-namespace (current lines); unit SHA256 043499b91025f70c20790bfe18521027c12f672d56d9b14c66e8359c1fc131ae.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 043499b91025f70c20790bfe18521027c12f672d56d9b14c66e8359c1fc131ae at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 113\" → \"12.1a Herdr Own Rust Vocabulary Is a Separate Namespace\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-113 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#121a-herdr-own-rust-vocabulary-is-a-separate-namespace; source context \"Dispatch Control Plane Redesign / 12. Transport / 12.1a Herdr Own Rust Vocabulary Is a Separate Namespace\", target context \"Dispatch Control Plane Redesign / 12. Transport\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "121a-herdr-own-rust-vocabulary-is-a-separate-namespace",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "043499b91025f70c20790bfe18521027c12f672d56d9b14c66e8359c1fc131ae",
    "targetAncestry": [
      "Dispatch Control Plane Redesign",
      "12. Transport"
    ]
  }
}
```

## Entry rationale-305

```json
{
  "entryId": "rationale-305",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_4366f098635c5a8564fcfdb402191b50",
  "before": "The current successor at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#122-near-term-herdr-adapter supersedes the stale current-state claim shown at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-115 before 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The original frozen source remains conserved by the accepted carriage and its dated complete historical carrier; this is a truth correction, not a new move or retirement. The section-specific code/CLI evidence is recorded in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json. This successor is pending independent truth review, with no inherited approval.",
  "after": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:659-659#unheaded-block-114 (current lines); unit SHA256 36c367e6656004e455ad6c92e44fef017d5d69f4f9abdd3ec887d374232c5b2d.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:633-633#122-near-term-herdr-adapter (current lines); unit SHA256 e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 114\" → \"12.2 Near-Term Herdr Adapter\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-114 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#122-near-term-herdr-adapter; source context \"Dispatch Control Plane Redesign / 12. Transport / 12.2 Near-Term Herdr Adapter\", target context \"Dispatch Control Plane Redesign / 12. Transport\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 304,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_4366f098635c5a8564fcfdb402191b50",
    "sourceUnitDigest": "36c367e6656004e455ad6c92e44fef017d5d69f4f9abdd3ec887d374232c5b2d",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:659-659#unheaded-block-114 (current lines); unit SHA256 36c367e6656004e455ad6c92e44fef017d5d69f4f9abdd3ec887d374232c5b2d.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:633-633#122-near-term-herdr-adapter (current lines); unit SHA256 e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 114\" → \"12.2 Near-Term Herdr Adapter\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-114 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#122-near-term-herdr-adapter; source context \"Dispatch Control Plane Redesign / 12. Transport / 12.2 Near-Term Herdr Adapter\", target context \"Dispatch Control Plane Redesign / 12. Transport\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "122-near-term-herdr-adapter",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa",
    "targetAncestry": [
      "Dispatch Control Plane Redesign",
      "12. Transport"
    ]
  }
}
```

## Entry rationale-306

```json
{
  "entryId": "rationale-306",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_ca9cfaa38b07d2339b637c7a562476d6",
  "before": "The current successor at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#122-near-term-herdr-adapter supersedes the stale current-state claim shown at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-116 before 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The original frozen source remains conserved by the accepted carriage and its dated complete historical carrier; this is a truth correction, not a new move or retirement. The section-specific code/CLI evidence is recorded in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json. This successor is pending independent truth review, with no inherited approval.",
  "after": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:661-664#unheaded-block-115 (current lines); unit SHA256 b19f0d898dc192014189c4f66bbf4951e7a968055677387eff39e22f3086e9a6.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:633-633#122-near-term-herdr-adapter (current lines); unit SHA256 e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 115\" → \"12.2 Near-Term Herdr Adapter\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-115 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#122-near-term-herdr-adapter; source context \"Dispatch Control Plane Redesign / 12. Transport / 12.2 Near-Term Herdr Adapter\", target context \"Dispatch Control Plane Redesign / 12. Transport\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 305,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_ca9cfaa38b07d2339b637c7a562476d6",
    "sourceUnitDigest": "b19f0d898dc192014189c4f66bbf4951e7a968055677387eff39e22f3086e9a6",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:661-664#unheaded-block-115 (current lines); unit SHA256 b19f0d898dc192014189c4f66bbf4951e7a968055677387eff39e22f3086e9a6.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:633-633#122-near-term-herdr-adapter (current lines); unit SHA256 e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 115\" → \"12.2 Near-Term Herdr Adapter\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-115 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#122-near-term-herdr-adapter; source context \"Dispatch Control Plane Redesign / 12. Transport / 12.2 Near-Term Herdr Adapter\", target context \"Dispatch Control Plane Redesign / 12. Transport\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "122-near-term-herdr-adapter",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa",
    "targetAncestry": [
      "Dispatch Control Plane Redesign",
      "12. Transport"
    ]
  }
}
```

## Entry rationale-307

```json
{
  "entryId": "rationale-307",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_38e1494401dc8f58be5239308bf07b21",
  "before": "The current successor at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#122-near-term-herdr-adapter supersedes the stale current-state claim shown at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-117 before 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The original frozen source remains conserved by the accepted carriage and its dated complete historical carrier; this is a truth correction, not a new move or retirement. The section-specific code/CLI evidence is recorded in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json. This successor is pending independent truth review, with no inherited approval.",
  "after": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:666-666#unheaded-block-116 (current lines); unit SHA256 411de9e6e56c468657375c41a2bab8c7d3a2822dacc6d3ed9db7e1df616ab714.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:633-633#122-near-term-herdr-adapter (current lines); unit SHA256 e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 116\" → \"12.2 Near-Term Herdr Adapter\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-116 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#122-near-term-herdr-adapter; source context \"Dispatch Control Plane Redesign / 12. Transport / 12.2 Near-Term Herdr Adapter\", target context \"Dispatch Control Plane Redesign / 12. Transport\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 306,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_38e1494401dc8f58be5239308bf07b21",
    "sourceUnitDigest": "411de9e6e56c468657375c41a2bab8c7d3a2822dacc6d3ed9db7e1df616ab714",
    "claimKind": "contract",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:666-666#unheaded-block-116 (current lines); unit SHA256 411de9e6e56c468657375c41a2bab8c7d3a2822dacc6d3ed9db7e1df616ab714.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:633-633#122-near-term-herdr-adapter (current lines); unit SHA256 e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 116\" → \"12.2 Near-Term Herdr Adapter\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-116 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#122-near-term-herdr-adapter; source context \"Dispatch Control Plane Redesign / 12. Transport / 12.2 Near-Term Herdr Adapter\", target context \"Dispatch Control Plane Redesign / 12. Transport\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "122-near-term-herdr-adapter",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa",
    "targetAncestry": [
      "Dispatch Control Plane Redesign",
      "12. Transport"
    ]
  }
}
```

## Entry rationale-308

```json
{
  "entryId": "rationale-308",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_8b68b02188ffca625df1c7dcba9cb8a0",
  "before": "The current successor at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#122-near-term-herdr-adapter supersedes the stale current-state claim shown at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-118 before 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The original frozen source remains conserved by the accepted carriage and its dated complete historical carrier; this is a truth correction, not a new move or retirement. The section-specific code/CLI evidence is recorded in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json. This successor is pending independent truth review, with no inherited approval.",
  "after": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:668-668#unheaded-block-117 (current lines); unit SHA256 77d8a8d8483eaa6f0d522fcaa89ebf00a4f4a54b28dcfdea4b288ef108437091.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:633-633#122-near-term-herdr-adapter (current lines); unit SHA256 e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 117\" → \"12.2 Near-Term Herdr Adapter\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-117 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#122-near-term-herdr-adapter; source context \"Dispatch Control Plane Redesign / 12. Transport / 12.2 Near-Term Herdr Adapter\", target context \"Dispatch Control Plane Redesign / 12. Transport\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 307,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_8b68b02188ffca625df1c7dcba9cb8a0",
    "sourceUnitDigest": "77d8a8d8483eaa6f0d522fcaa89ebf00a4f4a54b28dcfdea4b288ef108437091",
    "claimKind": "contract",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:668-668#unheaded-block-117 (current lines); unit SHA256 77d8a8d8483eaa6f0d522fcaa89ebf00a4f4a54b28dcfdea4b288ef108437091.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:633-633#122-near-term-herdr-adapter (current lines); unit SHA256 e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 117\" → \"12.2 Near-Term Herdr Adapter\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-117 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#122-near-term-herdr-adapter; source context \"Dispatch Control Plane Redesign / 12. Transport / 12.2 Near-Term Herdr Adapter\", target context \"Dispatch Control Plane Redesign / 12. Transport\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "122-near-term-herdr-adapter",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa",
    "targetAncestry": [
      "Dispatch Control Plane Redesign",
      "12. Transport"
    ]
  }
}
```

## Entry rationale-309

```json
{
  "entryId": "rationale-309",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_d7e3300a73c40ac50a91d45f47337878",
  "before": "The current successor at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#122-near-term-herdr-adapter supersedes the stale current-state claim shown at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-119 before 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The original frozen source remains conserved by the accepted carriage and its dated complete historical carrier; this is a truth correction, not a new move or retirement. The section-specific code/CLI evidence is recorded in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json. This successor is pending independent truth review, with no inherited approval.",
  "after": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:670-670#unheaded-block-118 (current lines); unit SHA256 02777615746fecf61bc5f1e374a44574e278b6380b45450e874f1fe292cf9f6d.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:633-633#122-near-term-herdr-adapter (current lines); unit SHA256 e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 118\" → \"12.2 Near-Term Herdr Adapter\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-118 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#122-near-term-herdr-adapter; source context \"Dispatch Control Plane Redesign / 12. Transport / 12.2 Near-Term Herdr Adapter\", target context \"Dispatch Control Plane Redesign / 12. Transport\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 308,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_d7e3300a73c40ac50a91d45f47337878",
    "sourceUnitDigest": "02777615746fecf61bc5f1e374a44574e278b6380b45450e874f1fe292cf9f6d",
    "claimKind": "contract",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:670-670#unheaded-block-118 (current lines); unit SHA256 02777615746fecf61bc5f1e374a44574e278b6380b45450e874f1fe292cf9f6d.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:633-633#122-near-term-herdr-adapter (current lines); unit SHA256 e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 118\" → \"12.2 Near-Term Herdr Adapter\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-118 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#122-near-term-herdr-adapter; source context \"Dispatch Control Plane Redesign / 12. Transport / 12.2 Near-Term Herdr Adapter\", target context \"Dispatch Control Plane Redesign / 12. Transport\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "122-near-term-herdr-adapter",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa",
    "targetAncestry": [
      "Dispatch Control Plane Redesign",
      "12. Transport"
    ]
  }
}
```

## Entry rationale-310

```json
{
  "entryId": "rationale-310",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_efee014e9c923b899c9b2fd74fb60f7a",
  "before": "The current successor at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#122-near-term-herdr-adapter supersedes the stale current-state claim shown at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-120 before 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The original frozen source remains conserved by the accepted carriage and its dated complete historical carrier; this is a truth correction, not a new move or retirement. The section-specific code/CLI evidence is recorded in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json. This successor is pending independent truth review, with no inherited approval.",
  "after": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:672-681#unheaded-block-119 (current lines); unit SHA256 54c3c398e7407022ad4b17cf6b7c847686724224e67b02e1214f876f9506cd32.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:633-633#122-near-term-herdr-adapter (current lines); unit SHA256 e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 119\" → \"12.2 Near-Term Herdr Adapter\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-119 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#122-near-term-herdr-adapter; source context \"Dispatch Control Plane Redesign / 12. Transport / 12.2 Near-Term Herdr Adapter\", target context \"Dispatch Control Plane Redesign / 12. Transport\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 309,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_efee014e9c923b899c9b2fd74fb60f7a",
    "sourceUnitDigest": "54c3c398e7407022ad4b17cf6b7c847686724224e67b02e1214f876f9506cd32",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:672-681#unheaded-block-119 (current lines); unit SHA256 54c3c398e7407022ad4b17cf6b7c847686724224e67b02e1214f876f9506cd32.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:633-633#122-near-term-herdr-adapter (current lines); unit SHA256 e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 119\" → \"12.2 Near-Term Herdr Adapter\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-119 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#122-near-term-herdr-adapter; source context \"Dispatch Control Plane Redesign / 12. Transport / 12.2 Near-Term Herdr Adapter\", target context \"Dispatch Control Plane Redesign / 12. Transport\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "122-near-term-herdr-adapter",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa",
    "targetAncestry": [
      "Dispatch Control Plane Redesign",
      "12. Transport"
    ]
  }
}
```

## Entry rationale-311

```json
{
  "entryId": "rationale-311",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_b91828db536d2481990bce0b68478735",
  "before": "The current successor at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#122-near-term-herdr-adapter supersedes the stale current-state claim shown at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-122 before 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The original frozen source remains conserved by the accepted carriage and its dated complete historical carrier; this is a truth correction, not a new move or retirement. The section-specific code/CLI evidence is recorded in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json. This successor is pending independent truth review, with no inherited approval.",
  "after": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:685-689#unheaded-block-121 (current lines); unit SHA256 3c822687dfc4d11ee5740a6d59025b08139101b0eac869b65e08403ac4b7e135.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:633-633#122-near-term-herdr-adapter (current lines); unit SHA256 e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 121\" → \"12.2 Near-Term Herdr Adapter\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-121 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#122-near-term-herdr-adapter; source context \"Dispatch Control Plane Redesign / 12. Transport / 12.2 Near-Term Herdr Adapter\", target context \"Dispatch Control Plane Redesign / 12. Transport\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 310,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_b91828db536d2481990bce0b68478735",
    "sourceUnitDigest": "3c822687dfc4d11ee5740a6d59025b08139101b0eac869b65e08403ac4b7e135",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:685-689#unheaded-block-121 (current lines); unit SHA256 3c822687dfc4d11ee5740a6d59025b08139101b0eac869b65e08403ac4b7e135.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:633-633#122-near-term-herdr-adapter (current lines); unit SHA256 e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 121\" → \"12.2 Near-Term Herdr Adapter\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-121 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#122-near-term-herdr-adapter; source context \"Dispatch Control Plane Redesign / 12. Transport / 12.2 Near-Term Herdr Adapter\", target context \"Dispatch Control Plane Redesign / 12. Transport\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "122-near-term-herdr-adapter",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa",
    "targetAncestry": [
      "Dispatch Control Plane Redesign",
      "12. Transport"
    ]
  }
}
```

## Entry rationale-312

```json
{
  "entryId": "rationale-312",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_3d73e4a2d6dae0baf907a974a53444c8",
  "before": "The current successor at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#122-near-term-herdr-adapter supersedes the stale current-state claim shown at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-123 before 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The original frozen source remains conserved by the accepted carriage and its dated complete historical carrier; this is a truth correction, not a new move or retirement. The section-specific code/CLI evidence is recorded in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json. This successor is pending independent truth review, with no inherited approval.",
  "after": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:691-691#unheaded-block-122 (current lines); unit SHA256 7a06d280f0273c3a445a1a35bbc48598996293971929575047cc5a914123d0ab.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:633-633#122-near-term-herdr-adapter (current lines); unit SHA256 e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 122\" → \"12.2 Near-Term Herdr Adapter\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-122 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#122-near-term-herdr-adapter; source context \"Dispatch Control Plane Redesign / 12. Transport / 12.2 Near-Term Herdr Adapter\", target context \"Dispatch Control Plane Redesign / 12. Transport\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 311,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_3d73e4a2d6dae0baf907a974a53444c8",
    "sourceUnitDigest": "7a06d280f0273c3a445a1a35bbc48598996293971929575047cc5a914123d0ab",
    "claimKind": "contract",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:691-691#unheaded-block-122 (current lines); unit SHA256 7a06d280f0273c3a445a1a35bbc48598996293971929575047cc5a914123d0ab.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:633-633#122-near-term-herdr-adapter (current lines); unit SHA256 e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 122\" → \"12.2 Near-Term Herdr Adapter\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-122 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#122-near-term-herdr-adapter; source context \"Dispatch Control Plane Redesign / 12. Transport / 12.2 Near-Term Herdr Adapter\", target context \"Dispatch Control Plane Redesign / 12. Transport\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "122-near-term-herdr-adapter",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa",
    "targetAncestry": [
      "Dispatch Control Plane Redesign",
      "12. Transport"
    ]
  }
}
```

## Entry rationale-313

```json
{
  "entryId": "rationale-313",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_749a1bdf0d058ac765a2e54a34c40f36",
  "before": "The earlier script-proven exact target at docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-66 changed during the current-truth correction in 96a13ab21670e1f5d9748c02cd615ea5598b53f5; digest identity no longer proves this row. It is now an explicitly authored, pending supersede to the corrected current successor at docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#12-the-persons-assessment-came-first-and-the-evaluator-was-not-the-driver. The frozen source unit and accepted historical carriage are unchanged. The source/current difference and section-specific code evidence in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json require independent truth review; no script approval or former review carries over.",
  "after": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md:365-365#unheaded-block-71 (current lines); unit SHA256 70ab638e4635de19179bdbf61b9d9c8fea2de03a76f4c9dface84e0e1bd602eb.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md:343-343#12-the-persons-assessment-came-first-and-the-evaluator-was-not-the-driver (current lines); unit SHA256 bf080a9b94daa08a92b9ecb41360e2ab03d927b0685c26fd9765b0fd07cfcf78.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest bf080a9b94daa08a92b9ecb41360e2ab03d927b0685c26fd9765b0fd07cfcf78 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 71\" → \"12. The Person's Assessment Came First, And The Evaluator Was Not The Driver\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-71 under docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#12-the-persons-assessment-came-first-and-the-evaluator-was-not-the-driver; source context \"Architecture Advisory Evaluation Rubric / 12. The Person's Assessment Came First, And The Evaluator Was Not The Driver\", target context \"Architecture Advisory Evaluation Rubric\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 312,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_749a1bdf0d058ac765a2e54a34c40f36",
    "sourceUnitDigest": "70ab638e4635de19179bdbf61b9d9c8fea2de03a76f4c9dface84e0e1bd602eb",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md",
    "targetAnchor": "12-the-persons-assessment-came-first-and-the-evaluator-was-not-the-driver",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md:365-365#unheaded-block-71 (current lines); unit SHA256 70ab638e4635de19179bdbf61b9d9c8fea2de03a76f4c9dface84e0e1bd602eb.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md:343-343#12-the-persons-assessment-came-first-and-the-evaluator-was-not-the-driver (current lines); unit SHA256 bf080a9b94daa08a92b9ecb41360e2ab03d927b0685c26fd9765b0fd07cfcf78.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest bf080a9b94daa08a92b9ecb41360e2ab03d927b0685c26fd9765b0fd07cfcf78 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 71\" → \"12. The Person's Assessment Came First, And The Evaluator Was Not The Driver\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-71 under docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#12-the-persons-assessment-came-first-and-the-evaluator-was-not-the-driver; source context \"Architecture Advisory Evaluation Rubric / 12. The Person's Assessment Came First, And The Evaluator Was Not The Driver\", target context \"Architecture Advisory Evaluation Rubric\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "bf080a9b94daa08a92b9ecb41360e2ab03d927b0685c26fd9765b0fd07cfcf78",
    "targetAncestry": [
      "Architecture Advisory Evaluation Rubric"
    ]
  }
}
```

## Entry rationale-314

```json
{
  "entryId": "rationale-314",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_b77e786ca1c28b37204b3c2d3af32147",
  "before": "The earlier script-proven exact target at docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-16 changed during the current-truth correction in 96a13ab21670e1f5d9748c02cd615ea5598b53f5; digest identity no longer proves this row. It is now an explicitly authored, pending supersede to the corrected current successor at docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#judgment-heuristics. The frozen source unit and accepted historical carriage are unchanged. The source/current difference and section-specific code evidence in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json require independent truth review; no script approval or former review carries over.",
  "after": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:130-147#unheaded-block-14 (current lines); unit SHA256 df3d64116293e25e83fc34a3f2c8ca54d9331bdf403f9bdbbcfba4bc3f1dc1fe.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:129-129#judgment-heuristics (current lines); unit SHA256 6cc30008d4d5f885eb943743e52f6c42493f3cc68d3c281f24af7e999e1ef4b9.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 6cc30008d4d5f885eb943743e52f6c42493f3cc68d3c281f24af7e999e1ef4b9 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 14\" → \"Judgment Heuristics\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-14 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#judgment-heuristics; source context \"Architecture Advisory Role Doctrine / 1. Lead Advisor / Judgment Heuristics\", target context \"Architecture Advisory Role Doctrine / 1. Lead Advisor\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 313,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_b77e786ca1c28b37204b3c2d3af32147",
    "sourceUnitDigest": "df3d64116293e25e83fc34a3f2c8ca54d9331bdf403f9bdbbcfba4bc3f1dc1fe",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "judgment-heuristics",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:130-147#unheaded-block-14 (current lines); unit SHA256 df3d64116293e25e83fc34a3f2c8ca54d9331bdf403f9bdbbcfba4bc3f1dc1fe.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:129-129#judgment-heuristics (current lines); unit SHA256 6cc30008d4d5f885eb943743e52f6c42493f3cc68d3c281f24af7e999e1ef4b9.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 6cc30008d4d5f885eb943743e52f6c42493f3cc68d3c281f24af7e999e1ef4b9 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 14\" → \"Judgment Heuristics\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-14 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#judgment-heuristics; source context \"Architecture Advisory Role Doctrine / 1. Lead Advisor / Judgment Heuristics\", target context \"Architecture Advisory Role Doctrine / 1. Lead Advisor\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "6cc30008d4d5f885eb943743e52f6c42493f3cc68d3c281f24af7e999e1ef4b9",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "1. Lead Advisor"
    ]
  }
}
```

## Entry rationale-315

```json
{
  "entryId": "rationale-315",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_4d76fa64e1f58b727c2388180d8963e4",
  "before": "The earlier script-proven exact target at docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-18 changed during the current-truth correction in 96a13ab21670e1f5d9748c02cd615ea5598b53f5; digest identity no longer proves this row. It is now an explicitly authored, pending supersede to the corrected current successor at docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#handoff-shape. The frozen source unit and accepted historical carriage are unchanged. The source/current difference and section-specific code evidence in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json require independent truth review; no script approval or former review carries over.",
  "after": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:166-170#unheaded-block-16 (current lines); unit SHA256 0553c8ef51aecb229fd94c07b2b48218b9ef66c010e3f57e71512e616a28f7be.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:165-165#handoff-shape (current lines); unit SHA256 a54ddeef04e1a1ceeeb73d40e68fb9a8f978c90c952c1e28b6822f5025d6f85c.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest a54ddeef04e1a1ceeeb73d40e68fb9a8f978c90c952c1e28b6822f5025d6f85c at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 16\" → \"Handoff Shape\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-16 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#handoff-shape; source context \"Architecture Advisory Role Doctrine / 1. Lead Advisor / Handoff Shape\", target context \"Architecture Advisory Role Doctrine / 1. Lead Advisor\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 314,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_4d76fa64e1f58b727c2388180d8963e4",
    "sourceUnitDigest": "0553c8ef51aecb229fd94c07b2b48218b9ef66c010e3f57e71512e616a28f7be",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "handoff-shape",
    "claimKind": "decision",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:166-170#unheaded-block-16 (current lines); unit SHA256 0553c8ef51aecb229fd94c07b2b48218b9ef66c010e3f57e71512e616a28f7be.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:165-165#handoff-shape (current lines); unit SHA256 a54ddeef04e1a1ceeeb73d40e68fb9a8f978c90c952c1e28b6822f5025d6f85c.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest a54ddeef04e1a1ceeeb73d40e68fb9a8f978c90c952c1e28b6822f5025d6f85c at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 16\" → \"Handoff Shape\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-16 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#handoff-shape; source context \"Architecture Advisory Role Doctrine / 1. Lead Advisor / Handoff Shape\", target context \"Architecture Advisory Role Doctrine / 1. Lead Advisor\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "a54ddeef04e1a1ceeeb73d40e68fb9a8f978c90c952c1e28b6822f5025d6f85c",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "1. Lead Advisor"
    ]
  }
}
```

## Entry rationale-316

```json
{
  "entryId": "rationale-316",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_d971f89754723d8ca8cf7ee3162412df",
  "before": "The earlier script-proven exact target at docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-19 changed during the current-truth correction in 96a13ab21670e1f5d9748c02cd615ea5598b53f5; digest identity no longer proves this row. It is now an explicitly authored, pending supersede to the corrected current successor at docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#good-example. The frozen source unit and accepted historical carriage are unchanged. The source/current difference and section-specific code evidence in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json require independent truth review; no script approval or former review carries over.",
  "after": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:174-203#unheaded-block-17 (current lines); unit SHA256 336b7e697c194576d513aacd39fef1b986765555db23b9e5db3bc38094294572.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:174-174#good-example (current lines); unit SHA256 bb899c27abbdaaae44f5da3f5e6646a2445cf647528d8296343e36c1f49b1dce.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest bb899c27abbdaaae44f5da3f5e6646a2445cf647528d8296343e36c1f49b1dce at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 17\" → \"Good Example\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-17 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#good-example; source context \"Architecture Advisory Role Doctrine / 1. Lead Advisor / Good Example\", target context \"Architecture Advisory Role Doctrine / 1. Lead Advisor\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 315,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_d971f89754723d8ca8cf7ee3162412df",
    "sourceUnitDigest": "336b7e697c194576d513aacd39fef1b986765555db23b9e5db3bc38094294572",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "good-example",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:174-203#unheaded-block-17 (current lines); unit SHA256 336b7e697c194576d513aacd39fef1b986765555db23b9e5db3bc38094294572.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:174-174#good-example (current lines); unit SHA256 bb899c27abbdaaae44f5da3f5e6646a2445cf647528d8296343e36c1f49b1dce.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest bb899c27abbdaaae44f5da3f5e6646a2445cf647528d8296343e36c1f49b1dce at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 17\" → \"Good Example\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-17 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#good-example; source context \"Architecture Advisory Role Doctrine / 1. Lead Advisor / Good Example\", target context \"Architecture Advisory Role Doctrine / 1. Lead Advisor\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "bb899c27abbdaaae44f5da3f5e6646a2445cf647528d8296343e36c1f49b1dce",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "1. Lead Advisor"
    ]
  }
}
```

## Entry rationale-317

```json
{
  "entryId": "rationale-317",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_1f9c5ac30bab055a8a34acab0d31d91b",
  "before": "The earlier script-proven exact target at docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-22 changed during the current-truth correction in 96a13ab21670e1f5d9748c02cd615ea5598b53f5; digest identity no longer proves this row. It is now an explicitly authored, pending supersede to the corrected current successor at docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#bad-example. The frozen source unit and accepted historical carriage are unchanged. The source/current difference and section-specific code evidence in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json require independent truth review; no script approval or former review carries over.",
  "after": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:220-229#unheaded-block-20 (current lines); unit SHA256 9c7a4c40fb2248f08f9a5c4dcffb2beb3ad3e0ad42fa5a1fed9d7762b56609d2.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:212-212#bad-example (current lines); unit SHA256 61bab8bdc6623d86c89d909a0608bc9bc2ae318375458653f19b4d13a72a4d49.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 61bab8bdc6623d86c89d909a0608bc9bc2ae318375458653f19b4d13a72a4d49 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 20\" → \"Bad Example\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-20 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#bad-example; source context \"Architecture Advisory Role Doctrine / 1. Lead Advisor / Bad Example\", target context \"Architecture Advisory Role Doctrine / 1. Lead Advisor\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 316,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_1f9c5ac30bab055a8a34acab0d31d91b",
    "sourceUnitDigest": "9c7a4c40fb2248f08f9a5c4dcffb2beb3ad3e0ad42fa5a1fed9d7762b56609d2",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "bad-example",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:220-229#unheaded-block-20 (current lines); unit SHA256 9c7a4c40fb2248f08f9a5c4dcffb2beb3ad3e0ad42fa5a1fed9d7762b56609d2.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:212-212#bad-example (current lines); unit SHA256 61bab8bdc6623d86c89d909a0608bc9bc2ae318375458653f19b4d13a72a4d49.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 61bab8bdc6623d86c89d909a0608bc9bc2ae318375458653f19b4d13a72a4d49 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 20\" → \"Bad Example\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-20 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#bad-example; source context \"Architecture Advisory Role Doctrine / 1. Lead Advisor / Bad Example\", target context \"Architecture Advisory Role Doctrine / 1. Lead Advisor\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "61bab8bdc6623d86c89d909a0608bc9bc2ae318375458653f19b4d13a72a4d49",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "1. Lead Advisor"
    ]
  }
}
```

## Entry rationale-318

```json
{
  "entryId": "rationale-318",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_deb6e0500907da30eb43c8a72e85ede0",
  "before": "The earlier script-proven exact target at docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-28 changed during the current-truth correction in 96a13ab21670e1f5d9748c02cd615ea5598b53f5; digest identity no longer proves this row. It is now an explicitly authored, pending supersede to the corrected current successor at docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#handoff-shape-1. The frozen source unit and accepted historical carriage are unchanged. The source/current difference and section-specific code evidence in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json require independent truth review; no script approval or former review carries over.",
  "after": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:295-298#unheaded-block-26 (current lines); unit SHA256 973d6e00ea99727efbddc2a9073fb53a5ae8e371f37c1297f3afe664ea39288a.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:295-295#handoff-shape-1 (current lines); unit SHA256 4295ec7d8a317a5cfd79bcc98221162d6ccde4d6f72b151240f9b3c1d1683848.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 4295ec7d8a317a5cfd79bcc98221162d6ccde4d6f72b151240f9b3c1d1683848 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 26\" → \"Handoff Shape\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-26 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#handoff-shape-1; source context \"Architecture Advisory Role Doctrine / 2. Context Investigator / Handoff Shape\", target context \"Architecture Advisory Role Doctrine / 2. Context Investigator\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 317,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_deb6e0500907da30eb43c8a72e85ede0",
    "sourceUnitDigest": "973d6e00ea99727efbddc2a9073fb53a5ae8e371f37c1297f3afe664ea39288a",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "handoff-shape-1",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:295-298#unheaded-block-26 (current lines); unit SHA256 973d6e00ea99727efbddc2a9073fb53a5ae8e371f37c1297f3afe664ea39288a.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:295-295#handoff-shape-1 (current lines); unit SHA256 4295ec7d8a317a5cfd79bcc98221162d6ccde4d6f72b151240f9b3c1d1683848.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 4295ec7d8a317a5cfd79bcc98221162d6ccde4d6f72b151240f9b3c1d1683848 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 26\" → \"Handoff Shape\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-26 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#handoff-shape-1; source context \"Architecture Advisory Role Doctrine / 2. Context Investigator / Handoff Shape\", target context \"Architecture Advisory Role Doctrine / 2. Context Investigator\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "4295ec7d8a317a5cfd79bcc98221162d6ccde4d6f72b151240f9b3c1d1683848",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "2. Context Investigator"
    ]
  }
}
```

## Entry rationale-319

```json
{
  "entryId": "rationale-319",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_566d5e858feff3f7b42b34e719097dcb",
  "before": "The earlier script-proven exact target at docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-30 changed during the current-truth correction in 96a13ab21670e1f5d9748c02cd615ea5598b53f5; digest identity no longer proves this row. It is now an explicitly authored, pending supersede to the corrected current successor at docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#good-example-1. The frozen source unit and accepted historical carriage are unchanged. The source/current difference and section-specific code evidence in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json require independent truth review; no script approval or former review carries over.",
  "after": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:337-341#unheaded-block-28 (current lines); unit SHA256 68e1cf90aa9c5b6980cabd1f29b6caa411cd5bef8998b8d0d90c19c01d075a30.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:302-302#good-example-1 (current lines); unit SHA256 8f665fcc4561747ba704e9498d5599b76dcefa4d4f95bfa6943d8b5e54ee3764.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 8f665fcc4561747ba704e9498d5599b76dcefa4d4f95bfa6943d8b5e54ee3764 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 28\" → \"Good Example\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-28 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#good-example-1; source context \"Architecture Advisory Role Doctrine / 2. Context Investigator / Good Example\", target context \"Architecture Advisory Role Doctrine / 2. Context Investigator\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 318,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_566d5e858feff3f7b42b34e719097dcb",
    "sourceUnitDigest": "68e1cf90aa9c5b6980cabd1f29b6caa411cd5bef8998b8d0d90c19c01d075a30",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "good-example-1",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:337-341#unheaded-block-28 (current lines); unit SHA256 68e1cf90aa9c5b6980cabd1f29b6caa411cd5bef8998b8d0d90c19c01d075a30.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:302-302#good-example-1 (current lines); unit SHA256 8f665fcc4561747ba704e9498d5599b76dcefa4d4f95bfa6943d8b5e54ee3764.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 8f665fcc4561747ba704e9498d5599b76dcefa4d4f95bfa6943d8b5e54ee3764 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 28\" → \"Good Example\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-28 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#good-example-1; source context \"Architecture Advisory Role Doctrine / 2. Context Investigator / Good Example\", target context \"Architecture Advisory Role Doctrine / 2. Context Investigator\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "8f665fcc4561747ba704e9498d5599b76dcefa4d4f95bfa6943d8b5e54ee3764",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "2. Context Investigator"
    ]
  }
}
```

## Entry rationale-320

```json
{
  "entryId": "rationale-320",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_8dadb9fe6d698e022bd0dc047597595c",
  "before": "The earlier script-proven exact target at docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-37 changed during the current-truth correction in 96a13ab21670e1f5d9748c02cd615ea5598b53f5; digest identity no longer proves this row. It is now an explicitly authored, pending supersede to the corrected current successor at docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#judgment-heuristics-2. The frozen source unit and accepted historical carriage are unchanged. The source/current difference and section-specific code evidence in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json require independent truth review; no script approval or former review carries over.",
  "after": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:395-411#unheaded-block-35 (current lines); unit SHA256 301210e141d70c324ed5690186e4de3e964e0e4701567a46f10aef50a74134ae.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:395-395#judgment-heuristics-2 (current lines); unit SHA256 de0112f9c8b4f5cb0173835a16a9164393b289a50974f181f9f34b1bf5626a5a.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest de0112f9c8b4f5cb0173835a16a9164393b289a50974f181f9f34b1bf5626a5a at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 35\" → \"Judgment Heuristics\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-35 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#judgment-heuristics-2; source context \"Architecture Advisory Role Doctrine / 3. System Shaper / Judgment Heuristics\", target context \"Architecture Advisory Role Doctrine / 3. System Shaper\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 319,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_8dadb9fe6d698e022bd0dc047597595c",
    "sourceUnitDigest": "301210e141d70c324ed5690186e4de3e964e0e4701567a46f10aef50a74134ae",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "judgment-heuristics-2",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:395-411#unheaded-block-35 (current lines); unit SHA256 301210e141d70c324ed5690186e4de3e964e0e4701567a46f10aef50a74134ae.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:395-395#judgment-heuristics-2 (current lines); unit SHA256 de0112f9c8b4f5cb0173835a16a9164393b289a50974f181f9f34b1bf5626a5a.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest de0112f9c8b4f5cb0173835a16a9164393b289a50974f181f9f34b1bf5626a5a at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 35\" → \"Judgment Heuristics\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-35 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#judgment-heuristics-2; source context \"Architecture Advisory Role Doctrine / 3. System Shaper / Judgment Heuristics\", target context \"Architecture Advisory Role Doctrine / 3. System Shaper\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "de0112f9c8b4f5cb0173835a16a9164393b289a50974f181f9f34b1bf5626a5a",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "3. System Shaper"
    ]
  }
}
```

## Entry rationale-321

```json
{
  "entryId": "rationale-321",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_1ade04bad28dd68fdd1daf91ec49f0ed",
  "before": "The earlier script-proven exact target at docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-39 changed during the current-truth correction in 96a13ab21670e1f5d9748c02cd615ea5598b53f5; digest identity no longer proves this row. It is now an explicitly authored, pending supersede to the corrected current successor at docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#handoff-shape-2. The frozen source unit and accepted historical carriage are unchanged. The source/current difference and section-specific code evidence in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json require independent truth review; no script approval or former review carries over.",
  "after": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:429-432#unheaded-block-37 (current lines); unit SHA256 669e1b88d9feb04c85122c24e2376a0c7755566da2c3ee9e0f792b4fa8f46b90.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:429-429#handoff-shape-2 (current lines); unit SHA256 b41a04b80d18785a6f4b551a7b7986b208b30bb6fb1daa0d0ad1addb8bb1dc66.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest b41a04b80d18785a6f4b551a7b7986b208b30bb6fb1daa0d0ad1addb8bb1dc66 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 37\" → \"Handoff Shape\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-37 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#handoff-shape-2; source context \"Architecture Advisory Role Doctrine / 3. System Shaper / Handoff Shape\", target context \"Architecture Advisory Role Doctrine / 3. System Shaper\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 320,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_1ade04bad28dd68fdd1daf91ec49f0ed",
    "sourceUnitDigest": "669e1b88d9feb04c85122c24e2376a0c7755566da2c3ee9e0f792b4fa8f46b90",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "handoff-shape-2",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:429-432#unheaded-block-37 (current lines); unit SHA256 669e1b88d9feb04c85122c24e2376a0c7755566da2c3ee9e0f792b4fa8f46b90.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:429-429#handoff-shape-2 (current lines); unit SHA256 b41a04b80d18785a6f4b551a7b7986b208b30bb6fb1daa0d0ad1addb8bb1dc66.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest b41a04b80d18785a6f4b551a7b7986b208b30bb6fb1daa0d0ad1addb8bb1dc66 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 37\" → \"Handoff Shape\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-37 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#handoff-shape-2; source context \"Architecture Advisory Role Doctrine / 3. System Shaper / Handoff Shape\", target context \"Architecture Advisory Role Doctrine / 3. System Shaper\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "b41a04b80d18785a6f4b551a7b7986b208b30bb6fb1daa0d0ad1addb8bb1dc66",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "3. System Shaper"
    ]
  }
}
```

## Entry rationale-322

```json
{
  "entryId": "rationale-322",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_6911ce65c274d0bbe3fef19915607c69",
  "before": "The earlier script-proven exact target at docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-49 changed during the current-truth correction in 96a13ab21670e1f5d9748c02cd615ea5598b53f5; digest identity no longer proves this row. It is now an explicitly authored, pending supersede to the corrected current successor at docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#handoff-shape-3. The frozen source unit and accepted historical carriage are unchanged. The source/current difference and section-specific code evidence in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json require independent truth review; no script approval or former review carries over.",
  "after": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:578-582#unheaded-block-47 (current lines); unit SHA256 f1458231c836854cb281062d28e57ab9b3520a77d1d105593fc16f289881d3b6.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:578-578#handoff-shape-3 (current lines); unit SHA256 758bd9de89e1eb50159df3b3ba35ae583163fb5d5a97c988f9a46757158006df.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 758bd9de89e1eb50159df3b3ba35ae583163fb5d5a97c988f9a46757158006df at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 47\" → \"Handoff Shape\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-47 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#handoff-shape-3; source context \"Architecture Advisory Role Doctrine / 4. Alternative Shaper / Handoff Shape\", target context \"Architecture Advisory Role Doctrine / 4. Alternative Shaper\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 321,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_6911ce65c274d0bbe3fef19915607c69",
    "sourceUnitDigest": "f1458231c836854cb281062d28e57ab9b3520a77d1d105593fc16f289881d3b6",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "handoff-shape-3",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:578-582#unheaded-block-47 (current lines); unit SHA256 f1458231c836854cb281062d28e57ab9b3520a77d1d105593fc16f289881d3b6.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:578-578#handoff-shape-3 (current lines); unit SHA256 758bd9de89e1eb50159df3b3ba35ae583163fb5d5a97c988f9a46757158006df.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 758bd9de89e1eb50159df3b3ba35ae583163fb5d5a97c988f9a46757158006df at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 47\" → \"Handoff Shape\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-47 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#handoff-shape-3; source context \"Architecture Advisory Role Doctrine / 4. Alternative Shaper / Handoff Shape\", target context \"Architecture Advisory Role Doctrine / 4. Alternative Shaper\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "758bd9de89e1eb50159df3b3ba35ae583163fb5d5a97c988f9a46757158006df",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "4. Alternative Shaper"
    ]
  }
}
```

## Entry rationale-323

```json
{
  "entryId": "rationale-323",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_72f81fed028e9d9ae2d755816f77139d",
  "before": "The earlier script-proven exact target at docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-59 changed during the current-truth correction in 96a13ab21670e1f5d9748c02cd615ea5598b53f5; digest identity no longer proves this row. It is now an explicitly authored, pending supersede to the corrected current successor at docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#handoff-shape-4. The frozen source unit and accepted historical carriage are unchanged. The source/current difference and section-specific code evidence in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json require independent truth review; no script approval or former review carries over.",
  "after": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:716-719#unheaded-block-57 (current lines); unit SHA256 ebf1829c1b01028385e7940aaac1ca6e73b5d73f3b35d61884e6afd643c28576.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:716-716#handoff-shape-4 (current lines); unit SHA256 ac7fd4c4dcbe6edf7163fee8b9295870c8b1c907a24b36911c2efd32b34d0900.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest ac7fd4c4dcbe6edf7163fee8b9295870c8b1c907a24b36911c2efd32b34d0900 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 57\" → \"Handoff Shape\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-57 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#handoff-shape-4; source context \"Architecture Advisory Role Doctrine / 5. Constraint Advocate / Handoff Shape\", target context \"Architecture Advisory Role Doctrine / 5. Constraint Advocate\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 322,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_72f81fed028e9d9ae2d755816f77139d",
    "sourceUnitDigest": "ebf1829c1b01028385e7940aaac1ca6e73b5d73f3b35d61884e6afd643c28576",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "handoff-shape-4",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:716-719#unheaded-block-57 (current lines); unit SHA256 ebf1829c1b01028385e7940aaac1ca6e73b5d73f3b35d61884e6afd643c28576.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:716-716#handoff-shape-4 (current lines); unit SHA256 ac7fd4c4dcbe6edf7163fee8b9295870c8b1c907a24b36911c2efd32b34d0900.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest ac7fd4c4dcbe6edf7163fee8b9295870c8b1c907a24b36911c2efd32b34d0900 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 57\" → \"Handoff Shape\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-57 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#handoff-shape-4; source context \"Architecture Advisory Role Doctrine / 5. Constraint Advocate / Handoff Shape\", target context \"Architecture Advisory Role Doctrine / 5. Constraint Advocate\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "ac7fd4c4dcbe6edf7163fee8b9295870c8b1c907a24b36911c2efd32b34d0900",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "5. Constraint Advocate"
    ]
  }
}
```

## Entry rationale-324

```json
{
  "entryId": "rationale-324",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_bd8fb3923a823856489a3f5eb101e832",
  "before": "The earlier script-proven exact target at docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-73 changed during the current-truth correction in 96a13ab21670e1f5d9748c02cd615ea5598b53f5; digest identity no longer proves this row. It is now an explicitly authored, pending supersede to the corrected current successor at docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#handoff-shape-5. The frozen source unit and accepted historical carriage are unchanged. The source/current difference and section-specific code evidence in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json require independent truth review; no script approval or former review carries over.",
  "after": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:895-898#unheaded-block-71 (current lines); unit SHA256 896ba947d467f6209716142f1e95b09bc0d5c84629e53d625cf85d374e2ac17a.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:896-896#handoff-shape-5 (current lines); unit SHA256 1068ea219aa2e30d1af2251f3bc83ba424491c09a2ce04c16089a142de0c86df.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 1068ea219aa2e30d1af2251f3bc83ba424491c09a2ce04c16089a142de0c86df at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 71\" → \"Handoff Shape\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-71 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#handoff-shape-5; source context \"Architecture Advisory Role Doctrine / 6. Architecture Critic / Handoff Shape\", target context \"Architecture Advisory Role Doctrine / 6. Architecture Critic\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 323,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_bd8fb3923a823856489a3f5eb101e832",
    "sourceUnitDigest": "896ba947d467f6209716142f1e95b09bc0d5c84629e53d625cf85d374e2ac17a",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "handoff-shape-5",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:895-898#unheaded-block-71 (current lines); unit SHA256 896ba947d467f6209716142f1e95b09bc0d5c84629e53d625cf85d374e2ac17a.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:896-896#handoff-shape-5 (current lines); unit SHA256 1068ea219aa2e30d1af2251f3bc83ba424491c09a2ce04c16089a142de0c86df.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 1068ea219aa2e30d1af2251f3bc83ba424491c09a2ce04c16089a142de0c86df at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 71\" → \"Handoff Shape\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-71 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#handoff-shape-5; source context \"Architecture Advisory Role Doctrine / 6. Architecture Critic / Handoff Shape\", target context \"Architecture Advisory Role Doctrine / 6. Architecture Critic\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "1068ea219aa2e30d1af2251f3bc83ba424491c09a2ce04c16089a142de0c86df",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "6. Architecture Critic"
    ]
  }
}
```

## Entry rationale-325

```json
{
  "entryId": "rationale-325",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_88a852c57e217c461ea57067acb241b0",
  "before": "The earlier script-proven exact target at docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-81 changed during the current-truth correction in 96a13ab21670e1f5d9748c02cd615ea5598b53f5; digest identity no longer proves this row. It is now an explicitly authored, pending supersede to the corrected current successor at docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#judgment-heuristics-6. The frozen source unit and accepted historical carriage are unchanged. The source/current difference and section-specific code evidence in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json require independent truth review; no script approval or former review carries over.",
  "after": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1007-1022#unheaded-block-79 (current lines); unit SHA256 2626c5cc4a83c825b9f737201c9eeabe6c0068d3e19f0c04cfb697db40c85073.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1008-1008#judgment-heuristics-6 (current lines); unit SHA256 c5aadaa5e66291932c87295d069cc2257389c9b25ee9a1923f9cc7b0d83c1927.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest c5aadaa5e66291932c87295d069cc2257389c9b25ee9a1923f9cc7b0d83c1927 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 79\" → \"Judgment Heuristics\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-79 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#judgment-heuristics-6; source context \"Architecture Advisory Role Doctrine / 7. Synthesizer / Judgment Heuristics\", target context \"Architecture Advisory Role Doctrine / 7. Synthesizer\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 324,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_88a852c57e217c461ea57067acb241b0",
    "sourceUnitDigest": "2626c5cc4a83c825b9f737201c9eeabe6c0068d3e19f0c04cfb697db40c85073",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "judgment-heuristics-6",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1007-1022#unheaded-block-79 (current lines); unit SHA256 2626c5cc4a83c825b9f737201c9eeabe6c0068d3e19f0c04cfb697db40c85073.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1008-1008#judgment-heuristics-6 (current lines); unit SHA256 c5aadaa5e66291932c87295d069cc2257389c9b25ee9a1923f9cc7b0d83c1927.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest c5aadaa5e66291932c87295d069cc2257389c9b25ee9a1923f9cc7b0d83c1927 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 79\" → \"Judgment Heuristics\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-79 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#judgment-heuristics-6; source context \"Architecture Advisory Role Doctrine / 7. Synthesizer / Judgment Heuristics\", target context \"Architecture Advisory Role Doctrine / 7. Synthesizer\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "c5aadaa5e66291932c87295d069cc2257389c9b25ee9a1923f9cc7b0d83c1927",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "7. Synthesizer"
    ]
  }
}
```

## Entry rationale-326

```json
{
  "entryId": "rationale-326",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_0492d45c2c54a256ebdfda12092cba4c",
  "before": "The earlier script-proven exact target at docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-83 changed during the current-truth correction in 96a13ab21670e1f5d9748c02cd615ea5598b53f5; digest identity no longer proves this row. It is now an explicitly authored, pending supersede to the corrected current successor at docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#handoff-shape-6. The frozen source unit and accepted historical carriage are unchanged. The source/current difference and section-specific code evidence in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json require independent truth review; no script approval or former review carries over.",
  "after": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1038-1041#unheaded-block-81 (current lines); unit SHA256 6b135e3062617d5a1611d5eec682abd7a8856de21c1c3e85e33365cb869d1aa0.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1039-1039#handoff-shape-6 (current lines); unit SHA256 dfd84807f3b3cb305fa1f88bb5940de8d63a6154bf0b963010f9a58722ecb675.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest dfd84807f3b3cb305fa1f88bb5940de8d63a6154bf0b963010f9a58722ecb675 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 81\" → \"Handoff Shape\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-81 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#handoff-shape-6; source context \"Architecture Advisory Role Doctrine / 7. Synthesizer / Handoff Shape\", target context \"Architecture Advisory Role Doctrine / 7. Synthesizer\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 325,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_0492d45c2c54a256ebdfda12092cba4c",
    "sourceUnitDigest": "6b135e3062617d5a1611d5eec682abd7a8856de21c1c3e85e33365cb869d1aa0",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "handoff-shape-6",
    "claimKind": "decision",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1038-1041#unheaded-block-81 (current lines); unit SHA256 6b135e3062617d5a1611d5eec682abd7a8856de21c1c3e85e33365cb869d1aa0.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1039-1039#handoff-shape-6 (current lines); unit SHA256 dfd84807f3b3cb305fa1f88bb5940de8d63a6154bf0b963010f9a58722ecb675.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest dfd84807f3b3cb305fa1f88bb5940de8d63a6154bf0b963010f9a58722ecb675 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 81\" → \"Handoff Shape\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-81 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#handoff-shape-6; source context \"Architecture Advisory Role Doctrine / 7. Synthesizer / Handoff Shape\", target context \"Architecture Advisory Role Doctrine / 7. Synthesizer\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "dfd84807f3b3cb305fa1f88bb5940de8d63a6154bf0b963010f9a58722ecb675",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "7. Synthesizer"
    ]
  }
}
```

## Entry rationale-327

```json
{
  "entryId": "rationale-327",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_237843f43935cfdd341eb8471d77c3e8",
  "before": "The earlier script-proven exact target at docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-90 changed during the current-truth correction in 96a13ab21670e1f5d9748c02cd615ea5598b53f5; digest identity no longer proves this row. It is now an explicitly authored, pending supersede to the corrected current successor at docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#what-to-notice-7. The frozen source unit and accepted historical carriage are unchanged. The source/current difference and section-specific code evidence in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json require independent truth review; no script approval or former review carries over.",
  "after": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1172-1186#unheaded-block-88 (current lines); unit SHA256 c06ea01f584d79e85d225e45ebc2ca352a3cdd819f9ef833347ea02847f86ef3.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1174-1174#what-to-notice-7 (current lines); unit SHA256 b8129cef42f5aaa588bc7c1caa7b28138989933cfa7f84290e133f56a3f8b556.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest b8129cef42f5aaa588bc7c1caa7b28138989933cfa7f84290e133f56a3f8b556 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 88\" → \"What To Notice\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-88 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#what-to-notice-7; source context \"Architecture Advisory Role Doctrine / 8. Independent Red-Team / What To Notice\", target context \"Architecture Advisory Role Doctrine / 8. Independent Red-Team\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 326,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_237843f43935cfdd341eb8471d77c3e8",
    "sourceUnitDigest": "c06ea01f584d79e85d225e45ebc2ca352a3cdd819f9ef833347ea02847f86ef3",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "what-to-notice-7",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1172-1186#unheaded-block-88 (current lines); unit SHA256 c06ea01f584d79e85d225e45ebc2ca352a3cdd819f9ef833347ea02847f86ef3.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1174-1174#what-to-notice-7 (current lines); unit SHA256 b8129cef42f5aaa588bc7c1caa7b28138989933cfa7f84290e133f56a3f8b556.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest b8129cef42f5aaa588bc7c1caa7b28138989933cfa7f84290e133f56a3f8b556 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 88\" → \"What To Notice\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-88 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#what-to-notice-7; source context \"Architecture Advisory Role Doctrine / 8. Independent Red-Team / What To Notice\", target context \"Architecture Advisory Role Doctrine / 8. Independent Red-Team\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "b8129cef42f5aaa588bc7c1caa7b28138989933cfa7f84290e133f56a3f8b556",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "8. Independent Red-Team"
    ]
  }
}
```

## Entry rationale-328

```json
{
  "entryId": "rationale-328",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_bee98ef4ef3d1bbe7f849cf6598667fa",
  "before": "The earlier script-proven exact target at docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-91 changed during the current-truth correction in 96a13ab21670e1f5d9748c02cd615ea5598b53f5; digest identity no longer proves this row. It is now an explicitly authored, pending supersede to the corrected current successor at docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#judgment-heuristics-7. The frozen source unit and accepted historical carriage are unchanged. The source/current difference and section-specific code evidence in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json require independent truth review; no script approval or former review carries over.",
  "after": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1190-1202#unheaded-block-89 (current lines); unit SHA256 6bebda0cc2247a74d1a5ce8cf37daac311177e665e5560dfbba65607f77ef0c2.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1191-1191#judgment-heuristics-7 (current lines); unit SHA256 49a61ee3ca395a79116a209a8fb78391226d3f18824b1571703e2eb41578e404.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 49a61ee3ca395a79116a209a8fb78391226d3f18824b1571703e2eb41578e404 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 89\" → \"Judgment Heuristics\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-89 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#judgment-heuristics-7; source context \"Architecture Advisory Role Doctrine / 8. Independent Red-Team / Judgment Heuristics\", target context \"Architecture Advisory Role Doctrine / 8. Independent Red-Team\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 327,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_bee98ef4ef3d1bbe7f849cf6598667fa",
    "sourceUnitDigest": "6bebda0cc2247a74d1a5ce8cf37daac311177e665e5560dfbba65607f77ef0c2",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "judgment-heuristics-7",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1190-1202#unheaded-block-89 (current lines); unit SHA256 6bebda0cc2247a74d1a5ce8cf37daac311177e665e5560dfbba65607f77ef0c2.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1191-1191#judgment-heuristics-7 (current lines); unit SHA256 49a61ee3ca395a79116a209a8fb78391226d3f18824b1571703e2eb41578e404.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 49a61ee3ca395a79116a209a8fb78391226d3f18824b1571703e2eb41578e404 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 89\" → \"Judgment Heuristics\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-89 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#judgment-heuristics-7; source context \"Architecture Advisory Role Doctrine / 8. Independent Red-Team / Judgment Heuristics\", target context \"Architecture Advisory Role Doctrine / 8. Independent Red-Team\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "49a61ee3ca395a79116a209a8fb78391226d3f18824b1571703e2eb41578e404",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "8. Independent Red-Team"
    ]
  }
}
```

## Entry rationale-329

```json
{
  "entryId": "rationale-329",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_0573e67e36361fdac77a24c6fc32b15a",
  "before": "The earlier script-proven exact target at docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-93 changed during the current-truth correction in 96a13ab21670e1f5d9748c02cd615ea5598b53f5; digest identity no longer proves this row. It is now an explicitly authored, pending supersede to the corrected current successor at docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#handoff-shape-7. The frozen source unit and accepted historical carriage are unchanged. The source/current difference and section-specific code evidence in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json require independent truth review; no script approval or former review carries over.",
  "after": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1219-1222#unheaded-block-91 (current lines); unit SHA256 4c2aab20db95e027ca27d48633e12cde282be1d1baa35b7b1409ceea2485213b.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1220-1220#handoff-shape-7 (current lines); unit SHA256 bf0486902ed9b2e525a2860eacb27168b3cb51a4c78db9c66ad955d00cd929cc.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest bf0486902ed9b2e525a2860eacb27168b3cb51a4c78db9c66ad955d00cd929cc at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 91\" → \"Handoff Shape\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-91 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#handoff-shape-7; source context \"Architecture Advisory Role Doctrine / 8. Independent Red-Team / Handoff Shape\", target context \"Architecture Advisory Role Doctrine / 8. Independent Red-Team\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 328,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_0573e67e36361fdac77a24c6fc32b15a",
    "sourceUnitDigest": "4c2aab20db95e027ca27d48633e12cde282be1d1baa35b7b1409ceea2485213b",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "handoff-shape-7",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1219-1222#unheaded-block-91 (current lines); unit SHA256 4c2aab20db95e027ca27d48633e12cde282be1d1baa35b7b1409ceea2485213b.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1220-1220#handoff-shape-7 (current lines); unit SHA256 bf0486902ed9b2e525a2860eacb27168b3cb51a4c78db9c66ad955d00cd929cc.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest bf0486902ed9b2e525a2860eacb27168b3cb51a4c78db9c66ad955d00cd929cc at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 91\" → \"Handoff Shape\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-91 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#handoff-shape-7; source context \"Architecture Advisory Role Doctrine / 8. Independent Red-Team / Handoff Shape\", target context \"Architecture Advisory Role Doctrine / 8. Independent Red-Team\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "bf0486902ed9b2e525a2860eacb27168b3cb51a4c78db9c66ad955d00cd929cc",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "8. Independent Red-Team"
    ]
  }
}
```

## Entry rationale-330

```json
{
  "entryId": "rationale-330",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_6ded96239e6537517b4222fe95101816",
  "before": "The earlier script-proven exact target at docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-99 changed during the current-truth correction in 96a13ab21670e1f5d9748c02cd615ea5598b53f5; digest identity no longer proves this row. It is now an explicitly authored, pending supersede to the corrected current successor at docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#posture-8. The frozen source unit and accepted historical carriage are unchanged. The source/current difference and section-specific code evidence in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json require independent truth review; no script approval or former review carries over.",
  "after": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1318-1320#unheaded-block-97 (current lines); unit SHA256 56496b03e29df21363ea7bf1eaa0db74fa622c637736e88d8b65aef3dcdcd0b4.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1319-1319#posture-8 (current lines); unit SHA256 12a158a8e0abcc3a45fdd974450f2bb2deaed71d7948389c0d57686d568a12ce.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 12a158a8e0abcc3a45fdd974450f2bb2deaed71d7948389c0d57686d568a12ce at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 97\" → \"Posture\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-97 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#posture-8; source context \"Architecture Advisory Role Doctrine / 9. Specialist / Posture\", target context \"Architecture Advisory Role Doctrine / 9. Specialist\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 329,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_6ded96239e6537517b4222fe95101816",
    "sourceUnitDigest": "56496b03e29df21363ea7bf1eaa0db74fa622c637736e88d8b65aef3dcdcd0b4",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "posture-8",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1318-1320#unheaded-block-97 (current lines); unit SHA256 56496b03e29df21363ea7bf1eaa0db74fa622c637736e88d8b65aef3dcdcd0b4.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1319-1319#posture-8 (current lines); unit SHA256 12a158a8e0abcc3a45fdd974450f2bb2deaed71d7948389c0d57686d568a12ce.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 12a158a8e0abcc3a45fdd974450f2bb2deaed71d7948389c0d57686d568a12ce at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 97\" → \"Posture\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-97 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#posture-8; source context \"Architecture Advisory Role Doctrine / 9. Specialist / Posture\", target context \"Architecture Advisory Role Doctrine / 9. Specialist\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "12a158a8e0abcc3a45fdd974450f2bb2deaed71d7948389c0d57686d568a12ce",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "9. Specialist"
    ]
  }
}
```

## Entry rationale-331

```json
{
  "entryId": "rationale-331",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_2a6f9a03cf11170e5a4d92f824443ff5",
  "before": "The earlier script-proven exact target at docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-103 changed during the current-truth correction in 96a13ab21670e1f5d9748c02cd615ea5598b53f5; digest identity no longer proves this row. It is now an explicitly authored, pending supersede to the corrected current successor at docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#handoff-shape-8. The frozen source unit and accepted historical carriage are unchanged. The source/current difference and section-specific code evidence in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json require independent truth review; no script approval or former review carries over.",
  "after": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1355-1358#unheaded-block-101 (current lines); unit SHA256 123c3fbe7d1fd292157346a31074fe66bcba5c7599116e2c37e5857d7627fc63.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1361-1361#handoff-shape-8 (current lines); unit SHA256 cbdce16b55b0e36ed482248556b7110d946371caa41cff6d37f2cd2b4ad054c7.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest cbdce16b55b0e36ed482248556b7110d946371caa41cff6d37f2cd2b4ad054c7 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 101\" → \"Handoff Shape\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-101 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#handoff-shape-8; source context \"Architecture Advisory Role Doctrine / 9. Specialist / Handoff Shape\", target context \"Architecture Advisory Role Doctrine / 9. Specialist\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 330,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_2a6f9a03cf11170e5a4d92f824443ff5",
    "sourceUnitDigest": "123c3fbe7d1fd292157346a31074fe66bcba5c7599116e2c37e5857d7627fc63",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "handoff-shape-8",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1355-1358#unheaded-block-101 (current lines); unit SHA256 123c3fbe7d1fd292157346a31074fe66bcba5c7599116e2c37e5857d7627fc63.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1361-1361#handoff-shape-8 (current lines); unit SHA256 cbdce16b55b0e36ed482248556b7110d946371caa41cff6d37f2cd2b4ad054c7.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest cbdce16b55b0e36ed482248556b7110d946371caa41cff6d37f2cd2b4ad054c7 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 101\" → \"Handoff Shape\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-101 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#handoff-shape-8; source context \"Architecture Advisory Role Doctrine / 9. Specialist / Handoff Shape\", target context \"Architecture Advisory Role Doctrine / 9. Specialist\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "cbdce16b55b0e36ed482248556b7110d946371caa41cff6d37f2cd2b4ad054c7",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "9. Specialist"
    ]
  }
}
```

## Entry rationale-332

```json
{
  "entryId": "rationale-332",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_c0dc65d7f7e651cdf170e3080f9ca46b",
  "before": "The earlier script-proven exact target at docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-107 changed during the current-truth correction in 96a13ab21670e1f5d9748c02cd615ea5598b53f5; digest identity no longer proves this row. It is now an explicitly authored, pending supersede to the corrected current successor at docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#driver-disposition-doctrine. The frozen source unit and accepted historical carriage are unchanged. The source/current difference and section-specific code evidence in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json require independent truth review; no script approval or former review carries over.",
  "after": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1419-1422#unheaded-block-105 (current lines); unit SHA256 e315a87a274e5daef423ac7c0b9cf16c152189f428d079cd61ac4a34f2ebb11a.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1425-1425#driver-disposition-doctrine (current lines); unit SHA256 9140482a9b73b69b0ce3b45fe052269377e16dbfd1cd970b9bf673758c0b644f.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 9140482a9b73b69b0ce3b45fe052269377e16dbfd1cd970b9bf673758c0b644f at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 105\" → \"Driver-Disposition Doctrine\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-105 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#driver-disposition-doctrine; source context \"Architecture Advisory Role Doctrine / Driver-Disposition Doctrine\", target context \"Architecture Advisory Role Doctrine\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 331,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_c0dc65d7f7e651cdf170e3080f9ca46b",
    "sourceUnitDigest": "e315a87a274e5daef423ac7c0b9cf16c152189f428d079cd61ac4a34f2ebb11a",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "driver-disposition-doctrine",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1419-1422#unheaded-block-105 (current lines); unit SHA256 e315a87a274e5daef423ac7c0b9cf16c152189f428d079cd61ac4a34f2ebb11a.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1425-1425#driver-disposition-doctrine (current lines); unit SHA256 9140482a9b73b69b0ce3b45fe052269377e16dbfd1cd970b9bf673758c0b644f.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 9140482a9b73b69b0ce3b45fe052269377e16dbfd1cd970b9bf673758c0b644f at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 105\" → \"Driver-Disposition Doctrine\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-105 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#driver-disposition-doctrine; source context \"Architecture Advisory Role Doctrine / Driver-Disposition Doctrine\", target context \"Architecture Advisory Role Doctrine\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "9140482a9b73b69b0ce3b45fe052269377e16dbfd1cd970b9bf673758c0b644f",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine"
    ]
  }
}
```

## Entry rationale-333

```json
{
  "entryId": "rationale-333",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_d914a73cf88e15ff256bb747a338fecc",
  "before": "The earlier script-proven exact target at docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-108 changed during the current-truth correction in 96a13ab21670e1f5d9748c02cd615ea5598b53f5; digest identity no longer proves this row. It is now an explicitly authored, pending supersede to the corrected current successor at docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#driver-disposition-doctrine. The frozen source unit and accepted historical carriage are unchanged. The source/current difference and section-specific code evidence in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json require independent truth review; no script approval or former review carries over.",
  "after": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1424-1427#unheaded-block-106 (current lines); unit SHA256 434f98d3ca7c6c8778e57c0d36b738f20ff321a610398f173e77528492963812.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1425-1425#driver-disposition-doctrine (current lines); unit SHA256 9140482a9b73b69b0ce3b45fe052269377e16dbfd1cd970b9bf673758c0b644f.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 9140482a9b73b69b0ce3b45fe052269377e16dbfd1cd970b9bf673758c0b644f at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 106\" → \"Driver-Disposition Doctrine\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-106 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#driver-disposition-doctrine; source context \"Architecture Advisory Role Doctrine / Driver-Disposition Doctrine\", target context \"Architecture Advisory Role Doctrine\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 332,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_d914a73cf88e15ff256bb747a338fecc",
    "sourceUnitDigest": "434f98d3ca7c6c8778e57c0d36b738f20ff321a610398f173e77528492963812",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "driver-disposition-doctrine",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1424-1427#unheaded-block-106 (current lines); unit SHA256 434f98d3ca7c6c8778e57c0d36b738f20ff321a610398f173e77528492963812.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1425-1425#driver-disposition-doctrine (current lines); unit SHA256 9140482a9b73b69b0ce3b45fe052269377e16dbfd1cd970b9bf673758c0b644f.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 9140482a9b73b69b0ce3b45fe052269377e16dbfd1cd970b9bf673758c0b644f at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 106\" → \"Driver-Disposition Doctrine\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-106 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#driver-disposition-doctrine; source context \"Architecture Advisory Role Doctrine / Driver-Disposition Doctrine\", target context \"Architecture Advisory Role Doctrine\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "9140482a9b73b69b0ce3b45fe052269377e16dbfd1cd970b9bf673758c0b644f",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine"
    ]
  }
}
```

## Entry rationale-334

```json
{
  "entryId": "rationale-334",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_857665a7f9ff1b6866fa898b07684233",
  "before": "The earlier script-proven exact target at docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-112 changed during the current-truth correction in 96a13ab21670e1f5d9748c02cd615ea5598b53f5; digest identity no longer proves this row. It is now an explicitly authored, pending supersede to the corrected current successor at docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#the-six-dispositions. The frozen source unit and accepted historical carriage are unchanged. The source/current difference and section-specific code evidence in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json require independent truth review; no script approval or former review carries over.",
  "after": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1445-1448#unheaded-block-110 (current lines); unit SHA256 85e4da34f1694d6cf43176751973e951bff9a748c9b279ad43e509b0741b6bd5.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1438-1438#the-six-dispositions (current lines); unit SHA256 ae5ad98a8d9ed7fd9316a2e61dbf8904059bbc39033b6e97f9d09535f45ec8a9.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest ae5ad98a8d9ed7fd9316a2e61dbf8904059bbc39033b6e97f9d09535f45ec8a9 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 110\" → \"The Six Dispositions\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-110 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#the-six-dispositions; source context \"Architecture Advisory Role Doctrine / Driver-Disposition Doctrine / The Six Dispositions\", target context \"Architecture Advisory Role Doctrine / Driver-Disposition Doctrine\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 333,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_857665a7f9ff1b6866fa898b07684233",
    "sourceUnitDigest": "85e4da34f1694d6cf43176751973e951bff9a748c9b279ad43e509b0741b6bd5",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "the-six-dispositions",
    "claimKind": "decision",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1445-1448#unheaded-block-110 (current lines); unit SHA256 85e4da34f1694d6cf43176751973e951bff9a748c9b279ad43e509b0741b6bd5.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1438-1438#the-six-dispositions (current lines); unit SHA256 ae5ad98a8d9ed7fd9316a2e61dbf8904059bbc39033b6e97f9d09535f45ec8a9.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest ae5ad98a8d9ed7fd9316a2e61dbf8904059bbc39033b6e97f9d09535f45ec8a9 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 110\" → \"The Six Dispositions\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-110 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#the-six-dispositions; source context \"Architecture Advisory Role Doctrine / Driver-Disposition Doctrine / The Six Dispositions\", target context \"Architecture Advisory Role Doctrine / Driver-Disposition Doctrine\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "ae5ad98a8d9ed7fd9316a2e61dbf8904059bbc39033b6e97f9d09535f45ec8a9",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "Driver-Disposition Doctrine"
    ]
  }
}
```

## Entry rationale-335

```json
{
  "entryId": "rationale-335",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_fb92651ea85a64c0b6e806926e51a4b2",
  "before": "The earlier script-proven exact target at docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#when-the-driver-must-not-disposition-alone changed during the current-truth correction in 96a13ab21670e1f5d9748c02cd615ea5598b53f5; digest identity no longer proves this row. It is now an explicitly authored, pending supersede to the corrected current successor at docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#evidence-and-conduct-boundaries. The frozen source unit and accepted historical carriage are unchanged. The source/current difference and section-specific code evidence in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json require independent truth review; no script approval or former review carries over.",
  "after": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1460-1460#when-the-driver-must-not-disposition-alone (current lines); unit SHA256 ee8907a2f12410887101fab337f085440903f2ece580174b69146302968cec4d.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1468-1468#evidence-and-conduct-boundaries (current lines); unit SHA256 82e4b520abf075cde4a91928c894f9c6ec67226ad6d989b89a8faef4a80409ed.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 82e4b520abf075cde4a91928c894f9c6ec67226ad6d989b89a8faef4a80409ed at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"When The Driver Must Not Disposition Alone\" → \"Evidence And Conduct Boundaries\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#when-the-driver-must-not-disposition-alone under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#evidence-and-conduct-boundaries; source context \"Architecture Advisory Role Doctrine / Driver-Disposition Doctrine\", target context \"Architecture Advisory Role Doctrine / Driver-Disposition Doctrine\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 334,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_fb92651ea85a64c0b6e806926e51a4b2",
    "sourceUnitDigest": "ee8907a2f12410887101fab337f085440903f2ece580174b69146302968cec4d",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "evidence-and-conduct-boundaries",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1460-1460#when-the-driver-must-not-disposition-alone (current lines); unit SHA256 ee8907a2f12410887101fab337f085440903f2ece580174b69146302968cec4d.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1468-1468#evidence-and-conduct-boundaries (current lines); unit SHA256 82e4b520abf075cde4a91928c894f9c6ec67226ad6d989b89a8faef4a80409ed.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 82e4b520abf075cde4a91928c894f9c6ec67226ad6d989b89a8faef4a80409ed at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"When The Driver Must Not Disposition Alone\" → \"Evidence And Conduct Boundaries\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#when-the-driver-must-not-disposition-alone under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#evidence-and-conduct-boundaries; source context \"Architecture Advisory Role Doctrine / Driver-Disposition Doctrine\", target context \"Architecture Advisory Role Doctrine / Driver-Disposition Doctrine\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "82e4b520abf075cde4a91928c894f9c6ec67226ad6d989b89a8faef4a80409ed",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "Driver-Disposition Doctrine"
    ]
  }
}
```

## Entry rationale-336

```json
{
  "entryId": "rationale-336",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_7759181bd522af266855f849ecf8143a",
  "before": "The earlier script-proven exact target at docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-115 changed during the current-truth correction in 96a13ab21670e1f5d9748c02cd615ea5598b53f5; digest identity no longer proves this row. It is now an explicitly authored, pending supersede to the corrected current successor at docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#evidence-and-conduct-boundaries. The frozen source unit and accepted historical carriage are unchanged. The source/current difference and section-specific code evidence in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json require independent truth review; no script approval or former review carries over.",
  "after": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1462-1464#unheaded-block-113 (current lines); unit SHA256 cb45e9a4f84c16ea35ed910d64ca9720bda9194e7a691a453be080ba5d950770.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1468-1468#evidence-and-conduct-boundaries (current lines); unit SHA256 82e4b520abf075cde4a91928c894f9c6ec67226ad6d989b89a8faef4a80409ed.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 82e4b520abf075cde4a91928c894f9c6ec67226ad6d989b89a8faef4a80409ed at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 113\" → \"Evidence And Conduct Boundaries\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-113 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#evidence-and-conduct-boundaries; source context \"Architecture Advisory Role Doctrine / Driver-Disposition Doctrine / When The Driver Must Not Disposition Alone\", target context \"Architecture Advisory Role Doctrine / Driver-Disposition Doctrine\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 335,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_7759181bd522af266855f849ecf8143a",
    "sourceUnitDigest": "cb45e9a4f84c16ea35ed910d64ca9720bda9194e7a691a453be080ba5d950770",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "evidence-and-conduct-boundaries",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1462-1464#unheaded-block-113 (current lines); unit SHA256 cb45e9a4f84c16ea35ed910d64ca9720bda9194e7a691a453be080ba5d950770.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1468-1468#evidence-and-conduct-boundaries (current lines); unit SHA256 82e4b520abf075cde4a91928c894f9c6ec67226ad6d989b89a8faef4a80409ed.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 82e4b520abf075cde4a91928c894f9c6ec67226ad6d989b89a8faef4a80409ed at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 113\" → \"Evidence And Conduct Boundaries\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-113 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#evidence-and-conduct-boundaries; source context \"Architecture Advisory Role Doctrine / Driver-Disposition Doctrine / When The Driver Must Not Disposition Alone\", target context \"Architecture Advisory Role Doctrine / Driver-Disposition Doctrine\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "82e4b520abf075cde4a91928c894f9c6ec67226ad6d989b89a8faef4a80409ed",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "Driver-Disposition Doctrine"
    ]
  }
}
```

## Entry rationale-337

```json
{
  "entryId": "rationale-337",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_9568b972846dae2fe0984168520d2cdf",
  "before": "The earlier script-proven exact target at docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-116 changed during the current-truth correction in 96a13ab21670e1f5d9748c02cd615ea5598b53f5; digest identity no longer proves this row. It is now an explicitly authored, pending supersede to the corrected current successor at docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#evidence-and-conduct-boundaries. The frozen source unit and accepted historical carriage are unchanged. The source/current difference and section-specific code evidence in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json require independent truth review; no script approval or former review carries over.",
  "after": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1466-1478#unheaded-block-114 (current lines); unit SHA256 3b07fc5702a3a2ee4dfbe572497935d9c9ebe9f02b57940734913a17b8d95208.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1468-1468#evidence-and-conduct-boundaries (current lines); unit SHA256 82e4b520abf075cde4a91928c894f9c6ec67226ad6d989b89a8faef4a80409ed.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 82e4b520abf075cde4a91928c894f9c6ec67226ad6d989b89a8faef4a80409ed at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 114\" → \"Evidence And Conduct Boundaries\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-114 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#evidence-and-conduct-boundaries; source context \"Architecture Advisory Role Doctrine / Driver-Disposition Doctrine / When The Driver Must Not Disposition Alone\", target context \"Architecture Advisory Role Doctrine / Driver-Disposition Doctrine\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 336,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_9568b972846dae2fe0984168520d2cdf",
    "sourceUnitDigest": "3b07fc5702a3a2ee4dfbe572497935d9c9ebe9f02b57940734913a17b8d95208",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "evidence-and-conduct-boundaries",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1466-1478#unheaded-block-114 (current lines); unit SHA256 3b07fc5702a3a2ee4dfbe572497935d9c9ebe9f02b57940734913a17b8d95208.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1468-1468#evidence-and-conduct-boundaries (current lines); unit SHA256 82e4b520abf075cde4a91928c894f9c6ec67226ad6d989b89a8faef4a80409ed.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 82e4b520abf075cde4a91928c894f9c6ec67226ad6d989b89a8faef4a80409ed at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 114\" → \"Evidence And Conduct Boundaries\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-114 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#evidence-and-conduct-boundaries; source context \"Architecture Advisory Role Doctrine / Driver-Disposition Doctrine / When The Driver Must Not Disposition Alone\", target context \"Architecture Advisory Role Doctrine / Driver-Disposition Doctrine\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "82e4b520abf075cde4a91928c894f9c6ec67226ad6d989b89a8faef4a80409ed",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "Driver-Disposition Doctrine"
    ]
  }
}
```

## Entry rationale-338

```json
{
  "entryId": "rationale-338",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_f0516f596a66ef71d4f7e2a318b98e57",
  "before": "The earlier script-proven exact target at docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-117 changed during the current-truth correction in 96a13ab21670e1f5d9748c02cd615ea5598b53f5; digest identity no longer proves this row. It is now an explicitly authored, pending supersede to the corrected current successor at docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#evidence-and-conduct-boundaries. The frozen source unit and accepted historical carriage are unchanged. The source/current difference and section-specific code evidence in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json require independent truth review; no script approval or former review carries over.",
  "after": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1480-1481#unheaded-block-115 (current lines); unit SHA256 42c8ea4fd6902a98827d5a550460f5890ac73cc2f41b86a8c978721474870eb9.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1468-1468#evidence-and-conduct-boundaries (current lines); unit SHA256 82e4b520abf075cde4a91928c894f9c6ec67226ad6d989b89a8faef4a80409ed.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 82e4b520abf075cde4a91928c894f9c6ec67226ad6d989b89a8faef4a80409ed at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 115\" → \"Evidence And Conduct Boundaries\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-115 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#evidence-and-conduct-boundaries; source context \"Architecture Advisory Role Doctrine / Driver-Disposition Doctrine / When The Driver Must Not Disposition Alone\", target context \"Architecture Advisory Role Doctrine / Driver-Disposition Doctrine\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 337,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_f0516f596a66ef71d4f7e2a318b98e57",
    "sourceUnitDigest": "42c8ea4fd6902a98827d5a550460f5890ac73cc2f41b86a8c978721474870eb9",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "evidence-and-conduct-boundaries",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1480-1481#unheaded-block-115 (current lines); unit SHA256 42c8ea4fd6902a98827d5a550460f5890ac73cc2f41b86a8c978721474870eb9.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1468-1468#evidence-and-conduct-boundaries (current lines); unit SHA256 82e4b520abf075cde4a91928c894f9c6ec67226ad6d989b89a8faef4a80409ed.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 82e4b520abf075cde4a91928c894f9c6ec67226ad6d989b89a8faef4a80409ed at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 115\" → \"Evidence And Conduct Boundaries\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-115 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#evidence-and-conduct-boundaries; source context \"Architecture Advisory Role Doctrine / Driver-Disposition Doctrine / When The Driver Must Not Disposition Alone\", target context \"Architecture Advisory Role Doctrine / Driver-Disposition Doctrine\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "82e4b520abf075cde4a91928c894f9c6ec67226ad6d989b89a8faef4a80409ed",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "Driver-Disposition Doctrine"
    ]
  }
}
```

## Entry rationale-339

```json
{
  "entryId": "rationale-339",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_f7be1d8a794e7f9c867378b67fbc3158",
  "before": "The current successor at docs/platform/agent-coordination/decisions/README.md#accepted-decisions supersedes the stale current-state claim shown at docs/platform/agent-coordination/decisions/README.md#unheaded-block-4 before 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The original frozen source remains conserved by the accepted carriage and its dated complete historical carrier; this is a truth correction, not a new move or retirement. The section-specific code/CLI evidence is recorded in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json. This successor is pending independent truth review, with no inherited approval.",
  "after": "Source: docs/architect/agent-coordination/decisions/README.md:15-16#unheaded-block-3 (current lines); unit SHA256 4220e3a9675537c9fe609c9cfbf7324d589f26b484441c45a0ebf1ec2d0fa4dc.\nTarget: docs/platform/agent-coordination/decisions/README.md:33-33#accepted-decisions (current lines); unit SHA256 2747b59526d6d98b9baf4d83a704f0069ba97b4f0822aab57346fdcbccd09602.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 2747b59526d6d98b9baf4d83a704f0069ba97b4f0822aab57346fdcbccd09602 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 1, target 13; 13 changed spellings/labels, 1 destination changes; 12 added, 0 removed.\nLink 1: \"Agent Coordination Foundation Vision\" (../vision.md) → \"foundation vision\" (../vision.md); resolved docs/architect/agent-coordination/vision.md → docs/platform/agent-coordination/vision.md.\nLink 2: \"none\" (none) → \"ADR-001: Work Owns Delivery Lifecycle\" (ADR-001-work-lifecycle-authority.md); resolved none → docs/platform/agent-coordination/decisions/ADR-001-work-lifecycle-authority.md.\nLink 3: \"none\" (none) → \"ADR-002: Preserve Workflow Step Primary Operation Compatibility\" (ADR-002-stage-operation-compatibility.md); resolved none → docs/platform/agent-coordination/decisions/ADR-002-stage-operation-compatibility.md.\nLink 4: \"none\" (none) → \"ADR-003: Separate Assignment, Run, And RunResult\" (ADR-003-assignment-run-runresult-separation.md); resolved none → docs/platform/agent-coordination/decisions/ADR-003-assignment-run-runresult-separation.md.\nLink 5: \"none\" (none) → \"ADR-004: Reserve Job For A Future Scheduler\" (ADR-004-reserve-job.md); resolved none → docs/platform/agent-coordination/decisions/ADR-004-reserve-job.md.\nLink 6: \"none\" (none) → \"ADR-005: Herdr Is Visibility, Not Evidence\" (ADR-005-herdr-visibility-only.md); resolved none → docs/platform/agent-coordination/decisions/ADR-005-herdr-visibility-only.md.\nLink 7: \"none\" (none) → \"ADR-006: Assignment Provenance And Normalized Execution-Contract Snapshot\" (ADR-006-assignment-provenance-and-contract-snapshot.md); resolved none → docs/platform/agent-coordination/decisions/ADR-006-assignment-provenance-and-contract-snapshot.md.\nLink 8: \"none\" (none) → \"ADR-007: Domain Harness Seam And Non-Driving Inline Evidence\" (ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md); resolved none → docs/platform/agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md.\nLink 9: \"none\" (none) → \"ADR-011: Dispatch Owns Lifecycle; Receiver Writes Receipt\" (ADR-011-dispatch-owns-lifecycle-receiver-writes-receipt.md); resolved none → docs/platform/agent-coordination/decisions/ADR-011-dispatch-owns-lifecycle-receiver-writes-receipt.md.\nLink 10: \"none\" (none) → \"ADR-008: CoordinationSession And Mission Deferral\" (../history/retired-engine/files/decisions/ADR-008-coordination-session-and-mission-deferral.md#literal-snapshot); resolved none → docs/platform/agent-coordination/history/retired-engine/files/decisions/ADR-008-coordination-session-and-mission-deferral.md#literal-snapshot.\nLink 11: \"none\" (none) → \"ADR-009: FlowDefinition Shared IR And Typed Profiles\" (../history/retired-engine/files/decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md#literal-snapshot); resolved none → docs/platform/agent-coordination/history/retired-engine/files/decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md#literal-snapshot.\nLink 12: \"none\" (none) → \"ADR-010: Interactive/Headless Parity And Work Isolation\" (../history/retired-engine/files/decisions/ADR-010-interactive-headless-parity-and-work-isolation.md#literal-snapshot); resolved none → docs/platform/agent-coordination/history/retired-engine/files/decisions/ADR-010-interactive-headless-parity-and-work-isolation.md#literal-snapshot.\nLink 13: \"none\" (none) → \"original intent ledger\" (../history/retired-engine/files/intent-preservation-ledger.md#literal-snapshot); resolved none → docs/platform/agent-coordination/history/retired-engine/files/intent-preservation-ledger.md#literal-snapshot.\nHeading depth: not a heading → 2; title \"Unheaded block 3\" → \"Accepted Decisions\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/decisions/README.md#unheaded-block-3 under docs/platform/agent-coordination/decisions/README.md#accepted-decisions; source context \"Agent Coordination Architecture Decisions / Accepted Decisions\", target context \"Agent Coordination Architecture Decisions\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 338,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_f7be1d8a794e7f9c867378b67fbc3158",
    "sourceUnitDigest": "4220e3a9675537c9fe609c9cfbf7324d589f26b484441c45a0ebf1ec2d0fa4dc",
    "claimKind": "decision",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/decisions/README.md:15-16#unheaded-block-3 (current lines); unit SHA256 4220e3a9675537c9fe609c9cfbf7324d589f26b484441c45a0ebf1ec2d0fa4dc.\nTarget: docs/platform/agent-coordination/decisions/README.md:33-33#accepted-decisions (current lines); unit SHA256 2747b59526d6d98b9baf4d83a704f0069ba97b4f0822aab57346fdcbccd09602.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 2747b59526d6d98b9baf4d83a704f0069ba97b4f0822aab57346fdcbccd09602 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 1, target 13; 13 changed spellings/labels, 1 destination changes; 12 added, 0 removed.\nLink 1: \"Agent Coordination Foundation Vision\" (../vision.md) → \"foundation vision\" (../vision.md); resolved docs/architect/agent-coordination/vision.md → docs/platform/agent-coordination/vision.md.\nLink 2: \"none\" (none) → \"ADR-001: Work Owns Delivery Lifecycle\" (ADR-001-work-lifecycle-authority.md); resolved none → docs/platform/agent-coordination/decisions/ADR-001-work-lifecycle-authority.md.\nLink 3: \"none\" (none) → \"ADR-002: Preserve Workflow Step Primary Operation Compatibility\" (ADR-002-stage-operation-compatibility.md); resolved none → docs/platform/agent-coordination/decisions/ADR-002-stage-operation-compatibility.md.\nLink 4: \"none\" (none) → \"ADR-003: Separate Assignment, Run, And RunResult\" (ADR-003-assignment-run-runresult-separation.md); resolved none → docs/platform/agent-coordination/decisions/ADR-003-assignment-run-runresult-separation.md.\nLink 5: \"none\" (none) → \"ADR-004: Reserve Job For A Future Scheduler\" (ADR-004-reserve-job.md); resolved none → docs/platform/agent-coordination/decisions/ADR-004-reserve-job.md.\nLink 6: \"none\" (none) → \"ADR-005: Herdr Is Visibility, Not Evidence\" (ADR-005-herdr-visibility-only.md); resolved none → docs/platform/agent-coordination/decisions/ADR-005-herdr-visibility-only.md.\nLink 7: \"none\" (none) → \"ADR-006: Assignment Provenance And Normalized Execution-Contract Snapshot\" (ADR-006-assignment-provenance-and-contract-snapshot.md); resolved none → docs/platform/agent-coordination/decisions/ADR-006-assignment-provenance-and-contract-snapshot.md.\nLink 8: \"none\" (none) → \"ADR-007: Domain Harness Seam And Non-Driving Inline Evidence\" (ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md); resolved none → docs/platform/agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md.\nLink 9: \"none\" (none) → \"ADR-011: Dispatch Owns Lifecycle; Receiver Writes Receipt\" (ADR-011-dispatch-owns-lifecycle-receiver-writes-receipt.md); resolved none → docs/platform/agent-coordination/decisions/ADR-011-dispatch-owns-lifecycle-receiver-writes-receipt.md.\nLink 10: \"none\" (none) → \"ADR-008: CoordinationSession And Mission Deferral\" (../history/retired-engine/files/decisions/ADR-008-coordination-session-and-mission-deferral.md#literal-snapshot); resolved none → docs/platform/agent-coordination/history/retired-engine/files/decisions/ADR-008-coordination-session-and-mission-deferral.md#literal-snapshot.\nLink 11: \"none\" (none) → \"ADR-009: FlowDefinition Shared IR And Typed Profiles\" (../history/retired-engine/files/decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md#literal-snapshot); resolved none → docs/platform/agent-coordination/history/retired-engine/files/decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md#literal-snapshot.\nLink 12: \"none\" (none) → \"ADR-010: Interactive/Headless Parity And Work Isolation\" (../history/retired-engine/files/decisions/ADR-010-interactive-headless-parity-and-work-isolation.md#literal-snapshot); resolved none → docs/platform/agent-coordination/history/retired-engine/files/decisions/ADR-010-interactive-headless-parity-and-work-isolation.md#literal-snapshot.\nLink 13: \"none\" (none) → \"original intent ledger\" (../history/retired-engine/files/intent-preservation-ledger.md#literal-snapshot); resolved none → docs/platform/agent-coordination/history/retired-engine/files/intent-preservation-ledger.md#literal-snapshot.\nHeading depth: not a heading → 2; title \"Unheaded block 3\" → \"Accepted Decisions\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/decisions/README.md#unheaded-block-3 under docs/platform/agent-coordination/decisions/README.md#accepted-decisions; source context \"Agent Coordination Architecture Decisions / Accepted Decisions\", target context \"Agent Coordination Architecture Decisions\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/decisions/README.md",
    "targetAnchor": "accepted-decisions",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "2747b59526d6d98b9baf4d83a704f0069ba97b4f0822aab57346fdcbccd09602",
    "targetAncestry": [
      "Agent Coordination Architecture Decisions"
    ]
  }
}
```

## Entry rationale-340

```json
{
  "entryId": "rationale-340",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_128087ed2e98dd5ca8dfdf2adeed72fd",
  "before": "The current successor at docs/platform/agent-coordination/decisions/README.md#accepted-decisions supersedes the stale current-state claim shown at docs/platform/agent-coordination/decisions/README.md#unheaded-block-5 before 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The original frozen source remains conserved by the accepted carriage and its dated complete historical carrier; this is a truth correction, not a new move or retirement. The section-specific code/CLI evidence is recorded in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json. This successor is pending independent truth review, with no inherited approval.",
  "after": "Source: docs/architect/agent-coordination/decisions/README.md:18-27#unheaded-block-4 (current lines); unit SHA256 0a311d99026944161e5c278e27c04c9751122d186dd7718cac1293e704bd2104.\nTarget: docs/platform/agent-coordination/decisions/README.md:33-33#accepted-decisions (current lines); unit SHA256 2747b59526d6d98b9baf4d83a704f0069ba97b4f0822aab57346fdcbccd09602.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 2747b59526d6d98b9baf4d83a704f0069ba97b4f0822aab57346fdcbccd09602 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 10, target 13; 7 changed spellings/labels, 4 destination changes; 3 added, 0 removed.\nLink 1: \"none\" (none) → \"foundation vision\" (../vision.md); resolved none → docs/platform/agent-coordination/vision.md.\nLink 3: \"ADR-002: Preserve Stage Primary Operation Compatibility\" (ADR-002-stage-operation-compatibility.md) → \"ADR-002: Preserve Workflow Step Primary Operation Compatibility\" (ADR-002-stage-operation-compatibility.md); resolved docs/architect/agent-coordination/decisions/ADR-002-stage-operation-compatibility.md → docs/platform/agent-coordination/decisions/ADR-002-stage-operation-compatibility.md.\nLink 9: \"ADR-008: CoordinationSession As V1 Recovery Root, One-Way Assignment Membership, And Mission Deferral\" (ADR-008-coordination-session-and-mission-deferral.md) → \"ADR-011: Dispatch Owns Lifecycle; Receiver Writes Receipt\" (ADR-011-dispatch-owns-lifecycle-receiver-writes-receipt.md); resolved docs/architect/agent-coordination/decisions/ADR-008-coordination-session-and-mission-deferral.md → docs/platform/agent-coordination/decisions/ADR-011-dispatch-owns-lifecycle-receiver-writes-receipt.md.\nLink 10: \"ADR-009: Versioned FlowDefinition As Shared Graph/Operation/Policy IR With Typed Profiles\" (ADR-009-flow-definition-shared-ir-and-typed-profiles.md) → \"ADR-008: CoordinationSession And Mission Deferral\" (../history/retired-engine/files/decisions/ADR-008-coordination-session-and-mission-deferral.md#literal-snapshot); resolved docs/architect/agent-coordination/decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md → docs/platform/agent-coordination/history/retired-engine/files/decisions/ADR-008-coordination-session-and-mission-deferral.md#literal-snapshot.\nLink 11: \"ADR-010: Interactive/Headless Capability Parity And Domain-Owned Work Isolation\" (ADR-010-interactive-headless-parity-and-work-isolation.md) → \"ADR-009: FlowDefinition Shared IR And Typed Profiles\" (../history/retired-engine/files/decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md#literal-snapshot); resolved docs/architect/agent-coordination/decisions/ADR-010-interactive-headless-parity-and-work-isolation.md → docs/platform/agent-coordination/history/retired-engine/files/decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md#literal-snapshot.\nLink 12: \"none\" (none) → \"ADR-010: Interactive/Headless Parity And Work Isolation\" (../history/retired-engine/files/decisions/ADR-010-interactive-headless-parity-and-work-isolation.md#literal-snapshot); resolved none → docs/platform/agent-coordination/history/retired-engine/files/decisions/ADR-010-interactive-headless-parity-and-work-isolation.md#literal-snapshot.\nLink 13: \"none\" (none) → \"original intent ledger\" (../history/retired-engine/files/intent-preservation-ledger.md#literal-snapshot); resolved none → docs/platform/agent-coordination/history/retired-engine/files/intent-preservation-ledger.md#literal-snapshot.\nHeading depth: not a heading → 2; title \"Unheaded block 4\" → \"Accepted Decisions\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/decisions/README.md#unheaded-block-4 under docs/platform/agent-coordination/decisions/README.md#accepted-decisions; source context \"Agent Coordination Architecture Decisions / Accepted Decisions\", target context \"Agent Coordination Architecture Decisions\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 339,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_128087ed2e98dd5ca8dfdf2adeed72fd",
    "sourceUnitDigest": "0a311d99026944161e5c278e27c04c9751122d186dd7718cac1293e704bd2104",
    "claimKind": "decision",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/decisions/README.md:18-27#unheaded-block-4 (current lines); unit SHA256 0a311d99026944161e5c278e27c04c9751122d186dd7718cac1293e704bd2104.\nTarget: docs/platform/agent-coordination/decisions/README.md:33-33#accepted-decisions (current lines); unit SHA256 2747b59526d6d98b9baf4d83a704f0069ba97b4f0822aab57346fdcbccd09602.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 2747b59526d6d98b9baf4d83a704f0069ba97b4f0822aab57346fdcbccd09602 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 10, target 13; 7 changed spellings/labels, 4 destination changes; 3 added, 0 removed.\nLink 1: \"none\" (none) → \"foundation vision\" (../vision.md); resolved none → docs/platform/agent-coordination/vision.md.\nLink 3: \"ADR-002: Preserve Stage Primary Operation Compatibility\" (ADR-002-stage-operation-compatibility.md) → \"ADR-002: Preserve Workflow Step Primary Operation Compatibility\" (ADR-002-stage-operation-compatibility.md); resolved docs/architect/agent-coordination/decisions/ADR-002-stage-operation-compatibility.md → docs/platform/agent-coordination/decisions/ADR-002-stage-operation-compatibility.md.\nLink 9: \"ADR-008: CoordinationSession As V1 Recovery Root, One-Way Assignment Membership, And Mission Deferral\" (ADR-008-coordination-session-and-mission-deferral.md) → \"ADR-011: Dispatch Owns Lifecycle; Receiver Writes Receipt\" (ADR-011-dispatch-owns-lifecycle-receiver-writes-receipt.md); resolved docs/architect/agent-coordination/decisions/ADR-008-coordination-session-and-mission-deferral.md → docs/platform/agent-coordination/decisions/ADR-011-dispatch-owns-lifecycle-receiver-writes-receipt.md.\nLink 10: \"ADR-009: Versioned FlowDefinition As Shared Graph/Operation/Policy IR With Typed Profiles\" (ADR-009-flow-definition-shared-ir-and-typed-profiles.md) → \"ADR-008: CoordinationSession And Mission Deferral\" (../history/retired-engine/files/decisions/ADR-008-coordination-session-and-mission-deferral.md#literal-snapshot); resolved docs/architect/agent-coordination/decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md → docs/platform/agent-coordination/history/retired-engine/files/decisions/ADR-008-coordination-session-and-mission-deferral.md#literal-snapshot.\nLink 11: \"ADR-010: Interactive/Headless Capability Parity And Domain-Owned Work Isolation\" (ADR-010-interactive-headless-parity-and-work-isolation.md) → \"ADR-009: FlowDefinition Shared IR And Typed Profiles\" (../history/retired-engine/files/decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md#literal-snapshot); resolved docs/architect/agent-coordination/decisions/ADR-010-interactive-headless-parity-and-work-isolation.md → docs/platform/agent-coordination/history/retired-engine/files/decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md#literal-snapshot.\nLink 12: \"none\" (none) → \"ADR-010: Interactive/Headless Parity And Work Isolation\" (../history/retired-engine/files/decisions/ADR-010-interactive-headless-parity-and-work-isolation.md#literal-snapshot); resolved none → docs/platform/agent-coordination/history/retired-engine/files/decisions/ADR-010-interactive-headless-parity-and-work-isolation.md#literal-snapshot.\nLink 13: \"none\" (none) → \"original intent ledger\" (../history/retired-engine/files/intent-preservation-ledger.md#literal-snapshot); resolved none → docs/platform/agent-coordination/history/retired-engine/files/intent-preservation-ledger.md#literal-snapshot.\nHeading depth: not a heading → 2; title \"Unheaded block 4\" → \"Accepted Decisions\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/decisions/README.md#unheaded-block-4 under docs/platform/agent-coordination/decisions/README.md#accepted-decisions; source context \"Agent Coordination Architecture Decisions / Accepted Decisions\", target context \"Agent Coordination Architecture Decisions\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/decisions/README.md",
    "targetAnchor": "accepted-decisions",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "2747b59526d6d98b9baf4d83a704f0069ba97b4f0822aab57346fdcbccd09602",
    "targetAncestry": [
      "Agent Coordination Architecture Decisions"
    ]
  }
}
```

## Entry rationale-341

```json
{
  "entryId": "rationale-341",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_a8914714b51091a9f0a487f739172da2",
  "before": "The current successor at docs/platform/agent-coordination/decisions/README.md#accepted-decisions supersedes the stale current-state claim shown at docs/platform/agent-coordination/decisions/README.md#unheaded-block-6 before 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The original frozen source remains conserved by the accepted carriage and its dated complete historical carrier; this is a truth correction, not a new move or retirement. The section-specific code/CLI evidence is recorded in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json. This successor is pending independent truth review, with no inherited approval.",
  "after": "Source: docs/architect/agent-coordination/decisions/README.md:29-43#unheaded-block-5 (current lines); unit SHA256 5ba4d36d43461dcc3047edaf13a0aa0685b4352f9e177191e29dd1bd980a66bf.\nTarget: docs/platform/agent-coordination/decisions/README.md:33-33#accepted-decisions (current lines); unit SHA256 2747b59526d6d98b9baf4d83a704f0069ba97b4f0822aab57346fdcbccd09602.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 2747b59526d6d98b9baf4d83a704f0069ba97b4f0822aab57346fdcbccd09602 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 1, target 13; 13 changed spellings/labels, 1 destination changes; 12 added, 0 removed.\nLink 1: \"Intent Preservation Ledger\" (../intent-preservation-ledger.md) → \"foundation vision\" (../vision.md); resolved docs/architect/agent-coordination/intent-preservation-ledger.md → docs/platform/agent-coordination/vision.md.\nLink 2: \"none\" (none) → \"ADR-001: Work Owns Delivery Lifecycle\" (ADR-001-work-lifecycle-authority.md); resolved none → docs/platform/agent-coordination/decisions/ADR-001-work-lifecycle-authority.md.\nLink 3: \"none\" (none) → \"ADR-002: Preserve Workflow Step Primary Operation Compatibility\" (ADR-002-stage-operation-compatibility.md); resolved none → docs/platform/agent-coordination/decisions/ADR-002-stage-operation-compatibility.md.\nLink 4: \"none\" (none) → \"ADR-003: Separate Assignment, Run, And RunResult\" (ADR-003-assignment-run-runresult-separation.md); resolved none → docs/platform/agent-coordination/decisions/ADR-003-assignment-run-runresult-separation.md.\nLink 5: \"none\" (none) → \"ADR-004: Reserve Job For A Future Scheduler\" (ADR-004-reserve-job.md); resolved none → docs/platform/agent-coordination/decisions/ADR-004-reserve-job.md.\nLink 6: \"none\" (none) → \"ADR-005: Herdr Is Visibility, Not Evidence\" (ADR-005-herdr-visibility-only.md); resolved none → docs/platform/agent-coordination/decisions/ADR-005-herdr-visibility-only.md.\nLink 7: \"none\" (none) → \"ADR-006: Assignment Provenance And Normalized Execution-Contract Snapshot\" (ADR-006-assignment-provenance-and-contract-snapshot.md); resolved none → docs/platform/agent-coordination/decisions/ADR-006-assignment-provenance-and-contract-snapshot.md.\nLink 8: \"none\" (none) → \"ADR-007: Domain Harness Seam And Non-Driving Inline Evidence\" (ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md); resolved none → docs/platform/agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md.\nLink 9: \"none\" (none) → \"ADR-011: Dispatch Owns Lifecycle; Receiver Writes Receipt\" (ADR-011-dispatch-owns-lifecycle-receiver-writes-receipt.md); resolved none → docs/platform/agent-coordination/decisions/ADR-011-dispatch-owns-lifecycle-receiver-writes-receipt.md.\nLink 10: \"none\" (none) → \"ADR-008: CoordinationSession And Mission Deferral\" (../history/retired-engine/files/decisions/ADR-008-coordination-session-and-mission-deferral.md#literal-snapshot); resolved none → docs/platform/agent-coordination/history/retired-engine/files/decisions/ADR-008-coordination-session-and-mission-deferral.md#literal-snapshot.\nLink 11: \"none\" (none) → \"ADR-009: FlowDefinition Shared IR And Typed Profiles\" (../history/retired-engine/files/decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md#literal-snapshot); resolved none → docs/platform/agent-coordination/history/retired-engine/files/decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md#literal-snapshot.\nLink 12: \"none\" (none) → \"ADR-010: Interactive/Headless Parity And Work Isolation\" (../history/retired-engine/files/decisions/ADR-010-interactive-headless-parity-and-work-isolation.md#literal-snapshot); resolved none → docs/platform/agent-coordination/history/retired-engine/files/decisions/ADR-010-interactive-headless-parity-and-work-isolation.md#literal-snapshot.\nLink 13: \"none\" (none) → \"original intent ledger\" (../history/retired-engine/files/intent-preservation-ledger.md#literal-snapshot); resolved none → docs/platform/agent-coordination/history/retired-engine/files/intent-preservation-ledger.md#literal-snapshot.\nHeading depth: not a heading → 2; title \"Unheaded block 5\" → \"Accepted Decisions\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/decisions/README.md#unheaded-block-5 under docs/platform/agent-coordination/decisions/README.md#accepted-decisions; source context \"Agent Coordination Architecture Decisions / Accepted Decisions\", target context \"Agent Coordination Architecture Decisions\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 340,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_a8914714b51091a9f0a487f739172da2",
    "sourceUnitDigest": "5ba4d36d43461dcc3047edaf13a0aa0685b4352f9e177191e29dd1bd980a66bf",
    "claimKind": "decision",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/decisions/README.md:29-43#unheaded-block-5 (current lines); unit SHA256 5ba4d36d43461dcc3047edaf13a0aa0685b4352f9e177191e29dd1bd980a66bf.\nTarget: docs/platform/agent-coordination/decisions/README.md:33-33#accepted-decisions (current lines); unit SHA256 2747b59526d6d98b9baf4d83a704f0069ba97b4f0822aab57346fdcbccd09602.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 2747b59526d6d98b9baf4d83a704f0069ba97b4f0822aab57346fdcbccd09602 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 1, target 13; 13 changed spellings/labels, 1 destination changes; 12 added, 0 removed.\nLink 1: \"Intent Preservation Ledger\" (../intent-preservation-ledger.md) → \"foundation vision\" (../vision.md); resolved docs/architect/agent-coordination/intent-preservation-ledger.md → docs/platform/agent-coordination/vision.md.\nLink 2: \"none\" (none) → \"ADR-001: Work Owns Delivery Lifecycle\" (ADR-001-work-lifecycle-authority.md); resolved none → docs/platform/agent-coordination/decisions/ADR-001-work-lifecycle-authority.md.\nLink 3: \"none\" (none) → \"ADR-002: Preserve Workflow Step Primary Operation Compatibility\" (ADR-002-stage-operation-compatibility.md); resolved none → docs/platform/agent-coordination/decisions/ADR-002-stage-operation-compatibility.md.\nLink 4: \"none\" (none) → \"ADR-003: Separate Assignment, Run, And RunResult\" (ADR-003-assignment-run-runresult-separation.md); resolved none → docs/platform/agent-coordination/decisions/ADR-003-assignment-run-runresult-separation.md.\nLink 5: \"none\" (none) → \"ADR-004: Reserve Job For A Future Scheduler\" (ADR-004-reserve-job.md); resolved none → docs/platform/agent-coordination/decisions/ADR-004-reserve-job.md.\nLink 6: \"none\" (none) → \"ADR-005: Herdr Is Visibility, Not Evidence\" (ADR-005-herdr-visibility-only.md); resolved none → docs/platform/agent-coordination/decisions/ADR-005-herdr-visibility-only.md.\nLink 7: \"none\" (none) → \"ADR-006: Assignment Provenance And Normalized Execution-Contract Snapshot\" (ADR-006-assignment-provenance-and-contract-snapshot.md); resolved none → docs/platform/agent-coordination/decisions/ADR-006-assignment-provenance-and-contract-snapshot.md.\nLink 8: \"none\" (none) → \"ADR-007: Domain Harness Seam And Non-Driving Inline Evidence\" (ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md); resolved none → docs/platform/agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md.\nLink 9: \"none\" (none) → \"ADR-011: Dispatch Owns Lifecycle; Receiver Writes Receipt\" (ADR-011-dispatch-owns-lifecycle-receiver-writes-receipt.md); resolved none → docs/platform/agent-coordination/decisions/ADR-011-dispatch-owns-lifecycle-receiver-writes-receipt.md.\nLink 10: \"none\" (none) → \"ADR-008: CoordinationSession And Mission Deferral\" (../history/retired-engine/files/decisions/ADR-008-coordination-session-and-mission-deferral.md#literal-snapshot); resolved none → docs/platform/agent-coordination/history/retired-engine/files/decisions/ADR-008-coordination-session-and-mission-deferral.md#literal-snapshot.\nLink 11: \"none\" (none) → \"ADR-009: FlowDefinition Shared IR And Typed Profiles\" (../history/retired-engine/files/decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md#literal-snapshot); resolved none → docs/platform/agent-coordination/history/retired-engine/files/decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md#literal-snapshot.\nLink 12: \"none\" (none) → \"ADR-010: Interactive/Headless Parity And Work Isolation\" (../history/retired-engine/files/decisions/ADR-010-interactive-headless-parity-and-work-isolation.md#literal-snapshot); resolved none → docs/platform/agent-coordination/history/retired-engine/files/decisions/ADR-010-interactive-headless-parity-and-work-isolation.md#literal-snapshot.\nLink 13: \"none\" (none) → \"original intent ledger\" (../history/retired-engine/files/intent-preservation-ledger.md#literal-snapshot); resolved none → docs/platform/agent-coordination/history/retired-engine/files/intent-preservation-ledger.md#literal-snapshot.\nHeading depth: not a heading → 2; title \"Unheaded block 5\" → \"Accepted Decisions\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/decisions/README.md#unheaded-block-5 under docs/platform/agent-coordination/decisions/README.md#accepted-decisions; source context \"Agent Coordination Architecture Decisions / Accepted Decisions\", target context \"Agent Coordination Architecture Decisions\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/decisions/README.md",
    "targetAnchor": "accepted-decisions",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "2747b59526d6d98b9baf4d83a704f0069ba97b4f0822aab57346fdcbccd09602",
    "targetAncestry": [
      "Agent Coordination Architecture Decisions"
    ]
  }
}
```

## Entry rationale-342

```json
{
  "entryId": "rationale-342",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_70a805be575183f1a48f3d5933770896",
  "before": "The earlier script-proven exact target at docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-10 changed during the current-truth correction in 96a13ab21670e1f5d9748c02cd615ea5598b53f5; digest identity no longer proves this row. It is now an explicitly authored, pending supersede to the corrected current successor at docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#what-these-templates-are-for. The frozen source unit and accepted historical carriage are unchanged. The source/current difference and section-specific code evidence in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json require independent truth review; no script approval or former review carries over.",
  "after": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:31-39#unheaded-block-7 (current lines); unit SHA256 ce5513244017cd08e740fb27ef0ea4ca16a2bea1d16b19ee2ecada96b3de1de5.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:50-50#what-these-templates-are-for (current lines); unit SHA256 b35910d208b2c126fd3c87f57c1f8ef56191f734434c6135aaee3b6ad1f631e7.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest b35910d208b2c126fd3c87f57c1f8ef56191f734434c6135aaee3b6ad1f631e7 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 7\" → \"What These Templates Are For\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-7 under docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#what-these-templates-are-for; source context \"Architecture Advisory Artifact Templates / What These Templates Are For\", target context \"Architecture Advisory Artifact Templates\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 341,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_70a805be575183f1a48f3d5933770896",
    "sourceUnitDigest": "ce5513244017cd08e740fb27ef0ea4ca16a2bea1d16b19ee2ecada96b3de1de5",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md",
    "targetAnchor": "what-these-templates-are-for",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:31-39#unheaded-block-7 (current lines); unit SHA256 ce5513244017cd08e740fb27ef0ea4ca16a2bea1d16b19ee2ecada96b3de1de5.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:50-50#what-these-templates-are-for (current lines); unit SHA256 b35910d208b2c126fd3c87f57c1f8ef56191f734434c6135aaee3b6ad1f631e7.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest b35910d208b2c126fd3c87f57c1f8ef56191f734434c6135aaee3b6ad1f631e7 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 7\" → \"What These Templates Are For\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-7 under docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#what-these-templates-are-for; source context \"Architecture Advisory Artifact Templates / What These Templates Are For\", target context \"Architecture Advisory Artifact Templates\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "b35910d208b2c126fd3c87f57c1f8ef56191f734434c6135aaee3b6ad1f631e7",
    "targetAncestry": [
      "Architecture Advisory Artifact Templates"
    ]
  }
}
```

## Entry rationale-343

```json
{
  "entryId": "rationale-343",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_e03e71322f4966158501e6da370897a6",
  "before": "The earlier script-proven exact target at docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-12 changed during the current-truth correction in 96a13ab21670e1f5d9748c02cd615ea5598b53f5; digest identity no longer proves this row. It is now an explicitly authored, pending supersede to the corrected current successor at docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#standard-provenance-header. The frozen source unit and accepted historical carriage are unchanged. The source/current difference and section-specific code evidence in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json require independent truth review; no script approval or former review carries over.",
  "after": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:49-49#unheaded-block-9 (current lines); unit SHA256 abea55eb3d1c7ac987a2aa55e01cef98a02e9452751622328ae302240e9eefed.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:82-82#standard-provenance-header (current lines); unit SHA256 42d29197ec62105d2b6412fa55b9a3d5198b19da4e8bd036e9d2bff6317b277b.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 42d29197ec62105d2b6412fa55b9a3d5198b19da4e8bd036e9d2bff6317b277b at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 9\" → \"Standard Provenance Header\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-9 under docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#standard-provenance-header; source context \"Architecture Advisory Artifact Templates / Standard Provenance Header\", target context \"Architecture Advisory Artifact Templates\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 342,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_e03e71322f4966158501e6da370897a6",
    "sourceUnitDigest": "abea55eb3d1c7ac987a2aa55e01cef98a02e9452751622328ae302240e9eefed",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md",
    "targetAnchor": "standard-provenance-header",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:49-49#unheaded-block-9 (current lines); unit SHA256 abea55eb3d1c7ac987a2aa55e01cef98a02e9452751622328ae302240e9eefed.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:82-82#standard-provenance-header (current lines); unit SHA256 42d29197ec62105d2b6412fa55b9a3d5198b19da4e8bd036e9d2bff6317b277b.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 42d29197ec62105d2b6412fa55b9a3d5198b19da4e8bd036e9d2bff6317b277b at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 9\" → \"Standard Provenance Header\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-9 under docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#standard-provenance-header; source context \"Architecture Advisory Artifact Templates / Standard Provenance Header\", target context \"Architecture Advisory Artifact Templates\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "42d29197ec62105d2b6412fa55b9a3d5198b19da4e8bd036e9d2bff6317b277b",
    "targetAncestry": [
      "Architecture Advisory Artifact Templates"
    ]
  }
}
```

## Entry rationale-344

```json
{
  "entryId": "rationale-344",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_454a911b873012ac0ff8f6c43613cd48",
  "before": "The earlier script-proven exact target at docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-14 changed during the current-truth correction in 96a13ab21670e1f5d9748c02cd615ea5598b53f5; digest identity no longer proves this row. It is now an explicitly authored, pending supersede to the corrected current successor at docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#standard-provenance-header. The frozen source unit and accepted historical carriage are unchanged. The source/current difference and section-specific code evidence in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json require independent truth review; no script approval or former review carries over.",
  "after": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:60-64#unheaded-block-11 (current lines); unit SHA256 de8b4415e6deef449cd314ab318fe42b9565d7cdcae5f70f8dabfbc317893175.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:82-82#standard-provenance-header (current lines); unit SHA256 42d29197ec62105d2b6412fa55b9a3d5198b19da4e8bd036e9d2bff6317b277b.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 42d29197ec62105d2b6412fa55b9a3d5198b19da4e8bd036e9d2bff6317b277b at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 11\" → \"Standard Provenance Header\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-11 under docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#standard-provenance-header; source context \"Architecture Advisory Artifact Templates / Standard Provenance Header\", target context \"Architecture Advisory Artifact Templates\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 343,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_454a911b873012ac0ff8f6c43613cd48",
    "sourceUnitDigest": "de8b4415e6deef449cd314ab318fe42b9565d7cdcae5f70f8dabfbc317893175",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md",
    "targetAnchor": "standard-provenance-header",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:60-64#unheaded-block-11 (current lines); unit SHA256 de8b4415e6deef449cd314ab318fe42b9565d7cdcae5f70f8dabfbc317893175.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:82-82#standard-provenance-header (current lines); unit SHA256 42d29197ec62105d2b6412fa55b9a3d5198b19da4e8bd036e9d2bff6317b277b.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 42d29197ec62105d2b6412fa55b9a3d5198b19da4e8bd036e9d2bff6317b277b at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 11\" → \"Standard Provenance Header\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-11 under docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#standard-provenance-header; source context \"Architecture Advisory Artifact Templates / Standard Provenance Header\", target context \"Architecture Advisory Artifact Templates\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "42d29197ec62105d2b6412fa55b9a3d5198b19da4e8bd036e9d2bff6317b277b",
    "targetAncestry": [
      "Architecture Advisory Artifact Templates"
    ]
  }
}
```

## Entry rationale-345

```json
{
  "entryId": "rationale-345",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_4265ae53d6f60a543e5c6ddb87ca352e",
  "before": "The earlier script-proven exact target at docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-22 changed during the current-truth correction in 96a13ab21670e1f5d9748c02cd615ea5598b53f5; digest identity no longer proves this row. It is now an explicitly authored, pending supersede to the corrected current successor at docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#3-scout-report-scout-reportmd. The frozen source unit and accepted historical carriage are unchanged. The source/current difference and section-specific code evidence in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json require independent truth review; no script approval or former review carries over.",
  "after": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:172-200#unheaded-block-19 (current lines); unit SHA256 5ca2f4b26c7b636a1547f830a3148804d78cca301e22327e2e4a44da6989b9c7.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:208-208#3-scout-report-scout-reportmd (current lines); unit SHA256 44b72b66db6472f9dc5f5a98720a065e72fb61cae17b4c9408a43036387ffc72.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 44b72b66db6472f9dc5f5a98720a065e72fb61cae17b4c9408a43036387ffc72 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 19\" → \"3. Scout Report — `scout-report.md`\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-19 under docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#3-scout-report-scout-reportmd; source context \"Architecture Advisory Artifact Templates / 3. Scout Report — `scout-report.md`\", target context \"Architecture Advisory Artifact Templates\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 344,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_4265ae53d6f60a543e5c6ddb87ca352e",
    "sourceUnitDigest": "5ca2f4b26c7b636a1547f830a3148804d78cca301e22327e2e4a44da6989b9c7",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md",
    "targetAnchor": "3-scout-report-scout-reportmd",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:172-200#unheaded-block-19 (current lines); unit SHA256 5ca2f4b26c7b636a1547f830a3148804d78cca301e22327e2e4a44da6989b9c7.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:208-208#3-scout-report-scout-reportmd (current lines); unit SHA256 44b72b66db6472f9dc5f5a98720a065e72fb61cae17b4c9408a43036387ffc72.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 44b72b66db6472f9dc5f5a98720a065e72fb61cae17b4c9408a43036387ffc72 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 19\" → \"3. Scout Report — `scout-report.md`\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-19 under docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#3-scout-report-scout-reportmd; source context \"Architecture Advisory Artifact Templates / 3. Scout Report — `scout-report.md`\", target context \"Architecture Advisory Artifact Templates\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "44b72b66db6472f9dc5f5a98720a065e72fb61cae17b4c9408a43036387ffc72",
    "targetAncestry": [
      "Architecture Advisory Artifact Templates"
    ]
  }
}
```

## Entry rationale-346

```json
{
  "entryId": "rationale-346",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_2d6fead0c43c66d71a75a792b8fc0af4",
  "before": "The earlier script-proven exact target at docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-30 changed during the current-truth correction in 96a13ab21670e1f5d9748c02cd615ea5598b53f5; digest identity no longer proves this row. It is now an explicitly authored, pending supersede to the corrected current successor at docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-37. The frozen source unit and accepted historical carriage are unchanged. The source/current difference and section-specific code evidence in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json require independent truth review; no script approval or former review carries over.",
  "after": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:318-318#unheaded-block-27 (current lines); unit SHA256 b966ae0e1460ab7ae4b8c0590e3b6f72c9d10abbe84e63a27bd29d3ad8a58915.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:370-370#unheaded-block-37 (current lines); unit SHA256 b966ae0e1460ab7ae4b8c0590e3b6f72c9d10abbe84e63a27bd29d3ad8a58915.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest b966ae0e1460ab7ae4b8c0590e3b6f72c9d10abbe84e63a27bd29d3ad8a58915 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-27 under docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-37; source context \"Architecture Advisory Artifact Templates / 5. Candidate Architecture Proposal — `proposals/<role>.md` / No-Build Path — mandatory sub-shape\", target context \"Architecture Advisory Artifact Templates / 5. Candidate Architecture Proposal — `proposals/<role>.md` / No-Build Path — cognitive quality sub-shape\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 345,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_2d6fead0c43c66d71a75a792b8fc0af4",
    "sourceUnitDigest": "b966ae0e1460ab7ae4b8c0590e3b6f72c9d10abbe84e63a27bd29d3ad8a58915",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md",
    "targetAnchor": "unheaded-block-37",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:318-318#unheaded-block-27 (current lines); unit SHA256 b966ae0e1460ab7ae4b8c0590e3b6f72c9d10abbe84e63a27bd29d3ad8a58915.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:370-370#unheaded-block-37 (current lines); unit SHA256 b966ae0e1460ab7ae4b8c0590e3b6f72c9d10abbe84e63a27bd29d3ad8a58915.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest b966ae0e1460ab7ae4b8c0590e3b6f72c9d10abbe84e63a27bd29d3ad8a58915 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-27 under docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-37; source context \"Architecture Advisory Artifact Templates / 5. Candidate Architecture Proposal — `proposals/<role>.md` / No-Build Path — mandatory sub-shape\", target context \"Architecture Advisory Artifact Templates / 5. Candidate Architecture Proposal — `proposals/<role>.md` / No-Build Path — cognitive quality sub-shape\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "b966ae0e1460ab7ae4b8c0590e3b6f72c9d10abbe84e63a27bd29d3ad8a58915",
    "targetAncestry": [
      "Architecture Advisory Artifact Templates",
      "5. Candidate Architecture Proposal — `proposals/<role>.md`",
      "No-Build Path — cognitive quality sub-shape"
    ]
  }
}
```

## Entry rationale-347

```json
{
  "entryId": "rationale-347",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_9053d212a1d094dda69ed7e3124ec459",
  "before": "The earlier script-proven exact target at docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-31 changed during the current-truth correction in 96a13ab21670e1f5d9748c02cd615ea5598b53f5; digest identity no longer proves this row. It is now an explicitly authored, pending supersede to the corrected current successor at docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-38. The frozen source unit and accepted historical carriage are unchanged. The source/current difference and section-specific code evidence in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json require independent truth review; no script approval or former review carries over.",
  "after": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:320-327#unheaded-block-28 (current lines); unit SHA256 cf5054b7363a581dc1a02be6704071f9b33faf034df6581f1847a85ca97278ac.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:372-379#unheaded-block-38 (current lines); unit SHA256 cf5054b7363a581dc1a02be6704071f9b33faf034df6581f1847a85ca97278ac.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest cf5054b7363a581dc1a02be6704071f9b33faf034df6581f1847a85ca97278ac at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-28 under docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-38; source context \"Architecture Advisory Artifact Templates / 5. Candidate Architecture Proposal — `proposals/<role>.md` / No-Build Path — mandatory sub-shape\", target context \"Architecture Advisory Artifact Templates / 5. Candidate Architecture Proposal — `proposals/<role>.md` / No-Build Path — cognitive quality sub-shape\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 346,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_9053d212a1d094dda69ed7e3124ec459",
    "sourceUnitDigest": "cf5054b7363a581dc1a02be6704071f9b33faf034df6581f1847a85ca97278ac",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md",
    "targetAnchor": "unheaded-block-38",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:320-327#unheaded-block-28 (current lines); unit SHA256 cf5054b7363a581dc1a02be6704071f9b33faf034df6581f1847a85ca97278ac.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:372-379#unheaded-block-38 (current lines); unit SHA256 cf5054b7363a581dc1a02be6704071f9b33faf034df6581f1847a85ca97278ac.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest cf5054b7363a581dc1a02be6704071f9b33faf034df6581f1847a85ca97278ac at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-28 under docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-38; source context \"Architecture Advisory Artifact Templates / 5. Candidate Architecture Proposal — `proposals/<role>.md` / No-Build Path — mandatory sub-shape\", target context \"Architecture Advisory Artifact Templates / 5. Candidate Architecture Proposal — `proposals/<role>.md` / No-Build Path — cognitive quality sub-shape\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "cf5054b7363a581dc1a02be6704071f9b33faf034df6581f1847a85ca97278ac",
    "targetAncestry": [
      "Architecture Advisory Artifact Templates",
      "5. Candidate Architecture Proposal — `proposals/<role>.md`",
      "No-Build Path — cognitive quality sub-shape"
    ]
  }
}
```

## Entry rationale-348

```json
{
  "entryId": "rationale-348",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_c87985222ef9cfb3a5a64ad3f375abb6",
  "before": "The earlier script-proven exact target at docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-32 changed during the current-truth correction in 96a13ab21670e1f5d9748c02cd615ea5598b53f5; digest identity no longer proves this row. It is now an explicitly authored, pending supersede to the corrected current successor at docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-39. The frozen source unit and accepted historical carriage are unchanged. The source/current difference and section-specific code evidence in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json require independent truth review; no script approval or former review carries over.",
  "after": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:329-333#unheaded-block-29 (current lines); unit SHA256 6c50b9c6966a57813be2ef06dbd737388419a2ea121303eb325a14056f124235.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:381-385#unheaded-block-39 (current lines); unit SHA256 6c50b9c6966a57813be2ef06dbd737388419a2ea121303eb325a14056f124235.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 6c50b9c6966a57813be2ef06dbd737388419a2ea121303eb325a14056f124235 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-29 under docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-39; source context \"Architecture Advisory Artifact Templates / 5. Candidate Architecture Proposal — `proposals/<role>.md` / No-Build Path — mandatory sub-shape\", target context \"Architecture Advisory Artifact Templates / 5. Candidate Architecture Proposal — `proposals/<role>.md` / No-Build Path — cognitive quality sub-shape\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 347,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_c87985222ef9cfb3a5a64ad3f375abb6",
    "sourceUnitDigest": "6c50b9c6966a57813be2ef06dbd737388419a2ea121303eb325a14056f124235",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md",
    "targetAnchor": "unheaded-block-39",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:329-333#unheaded-block-29 (current lines); unit SHA256 6c50b9c6966a57813be2ef06dbd737388419a2ea121303eb325a14056f124235.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:381-385#unheaded-block-39 (current lines); unit SHA256 6c50b9c6966a57813be2ef06dbd737388419a2ea121303eb325a14056f124235.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 6c50b9c6966a57813be2ef06dbd737388419a2ea121303eb325a14056f124235 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-29 under docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-39; source context \"Architecture Advisory Artifact Templates / 5. Candidate Architecture Proposal — `proposals/<role>.md` / No-Build Path — mandatory sub-shape\", target context \"Architecture Advisory Artifact Templates / 5. Candidate Architecture Proposal — `proposals/<role>.md` / No-Build Path — cognitive quality sub-shape\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "6c50b9c6966a57813be2ef06dbd737388419a2ea121303eb325a14056f124235",
    "targetAncestry": [
      "Architecture Advisory Artifact Templates",
      "5. Candidate Architecture Proposal — `proposals/<role>.md`",
      "No-Build Path — cognitive quality sub-shape"
    ]
  }
}
```

## Entry rationale-349

```json
{
  "entryId": "rationale-349",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_ccfcc4bcb24e4f5a31aa634b44e95c7f",
  "before": "The earlier script-proven exact target at docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#7-constraint-findings-proposalsconstraint-advocatemd-phase-6-section changed during the current-truth correction in 96a13ab21670e1f5d9748c02cd615ea5598b53f5; digest identity no longer proves this row. It is now an explicitly authored, pending supersede to the corrected current successor at docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#7-constraint-findings-optional-manual-constraintcritique-shape. The frozen source unit and accepted historical carriage are unchanged. The source/current difference and section-specific code evidence in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json require independent truth review; no script approval or former review carries over.",
  "after": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:379-379#7-constraint-findings-proposalsconstraint-advocatemd-phase-6-section (current lines); unit SHA256 925fd21f6972ad4060e318d3d32bfc3feae3fa6aebd95910d5a6ff90837c5885.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:434-434#7-constraint-findings-optional-manual-constraintcritique-shape (current lines); unit SHA256 fcc54b69666a906c0dfbfd1e3a24f0f6f1679a130c0afa73facbcd34753a0600.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest fcc54b69666a906c0dfbfd1e3a24f0f6f1679a130c0afa73facbcd34753a0600 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 2 → 2; title \"7. Constraint Findings — `proposals/constraint-advocate.md` (Phase 6 section)\" → \"7. Constraint Findings — optional manual constraint/critique shape\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#7-constraint-findings-proposalsconstraint-advocatemd-phase-6-section under docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#7-constraint-findings-optional-manual-constraintcritique-shape; source context \"Architecture Advisory Artifact Templates\", target context \"Architecture Advisory Artifact Templates\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 348,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_ccfcc4bcb24e4f5a31aa634b44e95c7f",
    "sourceUnitDigest": "925fd21f6972ad4060e318d3d32bfc3feae3fa6aebd95910d5a6ff90837c5885",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md",
    "targetAnchor": "7-constraint-findings-optional-manual-constraintcritique-shape",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:379-379#7-constraint-findings-proposalsconstraint-advocatemd-phase-6-section (current lines); unit SHA256 925fd21f6972ad4060e318d3d32bfc3feae3fa6aebd95910d5a6ff90837c5885.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:434-434#7-constraint-findings-optional-manual-constraintcritique-shape (current lines); unit SHA256 fcc54b69666a906c0dfbfd1e3a24f0f6f1679a130c0afa73facbcd34753a0600.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest fcc54b69666a906c0dfbfd1e3a24f0f6f1679a130c0afa73facbcd34753a0600 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 2 → 2; title \"7. Constraint Findings — `proposals/constraint-advocate.md` (Phase 6 section)\" → \"7. Constraint Findings — optional manual constraint/critique shape\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#7-constraint-findings-proposalsconstraint-advocatemd-phase-6-section under docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#7-constraint-findings-optional-manual-constraintcritique-shape; source context \"Architecture Advisory Artifact Templates\", target context \"Architecture Advisory Artifact Templates\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "fcc54b69666a906c0dfbfd1e3a24f0f6f1679a130c0afa73facbcd34753a0600",
    "targetAncestry": [
      "Architecture Advisory Artifact Templates"
    ]
  }
}
```

## Entry rationale-350

```json
{
  "entryId": "rationale-350",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_b6dde833e1e94658019aecb31294a7e6",
  "before": "The earlier script-proven exact target at docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-36 changed during the current-truth correction in 96a13ab21670e1f5d9748c02cd615ea5598b53f5; digest identity no longer proves this row. It is now an explicitly authored, pending supersede to the corrected current successor at docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-45. The frozen source unit and accepted historical carriage are unchanged. The source/current difference and section-specific code evidence in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json require independent truth review; no script approval or former review carries over.",
  "after": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:381-382#unheaded-block-33 (current lines); unit SHA256 ffbb19884c262cabef857adbd445184a0fe365f9ef7d7020eeea6e38ad4155a7.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:439-440#unheaded-block-45 (current lines); unit SHA256 ffbb19884c262cabef857adbd445184a0fe365f9ef7d7020eeea6e38ad4155a7.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest ffbb19884c262cabef857adbd445184a0fe365f9ef7d7020eeea6e38ad4155a7 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-33 under docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-45; source context \"Architecture Advisory Artifact Templates / 7. Constraint Findings — `proposals/constraint-advocate.md` (Phase 6 section)\", target context \"Architecture Advisory Artifact Templates / 7. Constraint Findings — optional manual constraint/critique shape\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 349,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_b6dde833e1e94658019aecb31294a7e6",
    "sourceUnitDigest": "ffbb19884c262cabef857adbd445184a0fe365f9ef7d7020eeea6e38ad4155a7",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md",
    "targetAnchor": "unheaded-block-45",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:381-382#unheaded-block-33 (current lines); unit SHA256 ffbb19884c262cabef857adbd445184a0fe365f9ef7d7020eeea6e38ad4155a7.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:439-440#unheaded-block-45 (current lines); unit SHA256 ffbb19884c262cabef857adbd445184a0fe365f9ef7d7020eeea6e38ad4155a7.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest ffbb19884c262cabef857adbd445184a0fe365f9ef7d7020eeea6e38ad4155a7 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-33 under docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-45; source context \"Architecture Advisory Artifact Templates / 7. Constraint Findings — `proposals/constraint-advocate.md` (Phase 6 section)\", target context \"Architecture Advisory Artifact Templates / 7. Constraint Findings — optional manual constraint/critique shape\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "ffbb19884c262cabef857adbd445184a0fe365f9ef7d7020eeea6e38ad4155a7",
    "targetAncestry": [
      "Architecture Advisory Artifact Templates",
      "7. Constraint Findings — optional manual constraint/critique shape"
    ]
  }
}
```

## Entry rationale-351

```json
{
  "entryId": "rationale-351",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_921fe2f798d3d1cbd95e02e7b597e1e2",
  "before": "The earlier script-proven exact target at docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-37 changed during the current-truth correction in 96a13ab21670e1f5d9748c02cd615ea5598b53f5; digest identity no longer proves this row. It is now an explicitly authored, pending supersede to the corrected current successor at docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-46. The frozen source unit and accepted historical carriage are unchanged. The source/current difference and section-specific code evidence in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json require independent truth review; no script approval or former review carries over.",
  "after": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:384-398#unheaded-block-34 (current lines); unit SHA256 a7fe12ec970bb4a89b8f5f0880b71f449f3a71a88d8426b3126f65aafd902f79.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:442-456#unheaded-block-46 (current lines); unit SHA256 a7fe12ec970bb4a89b8f5f0880b71f449f3a71a88d8426b3126f65aafd902f79.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest a7fe12ec970bb4a89b8f5f0880b71f449f3a71a88d8426b3126f65aafd902f79 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-34 under docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-46; source context \"Architecture Advisory Artifact Templates / 7. Constraint Findings — `proposals/constraint-advocate.md` (Phase 6 section)\", target context \"Architecture Advisory Artifact Templates / 7. Constraint Findings — optional manual constraint/critique shape\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 350,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_921fe2f798d3d1cbd95e02e7b597e1e2",
    "sourceUnitDigest": "a7fe12ec970bb4a89b8f5f0880b71f449f3a71a88d8426b3126f65aafd902f79",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md",
    "targetAnchor": "unheaded-block-46",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:384-398#unheaded-block-34 (current lines); unit SHA256 a7fe12ec970bb4a89b8f5f0880b71f449f3a71a88d8426b3126f65aafd902f79.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:442-456#unheaded-block-46 (current lines); unit SHA256 a7fe12ec970bb4a89b8f5f0880b71f449f3a71a88d8426b3126f65aafd902f79.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest a7fe12ec970bb4a89b8f5f0880b71f449f3a71a88d8426b3126f65aafd902f79 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-34 under docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-46; source context \"Architecture Advisory Artifact Templates / 7. Constraint Findings — `proposals/constraint-advocate.md` (Phase 6 section)\", target context \"Architecture Advisory Artifact Templates / 7. Constraint Findings — optional manual constraint/critique shape\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "a7fe12ec970bb4a89b8f5f0880b71f449f3a71a88d8426b3126f65aafd902f79",
    "targetAncestry": [
      "Architecture Advisory Artifact Templates",
      "7. Constraint Findings — optional manual constraint/critique shape"
    ]
  }
}
```

## Entry rationale-352

```json
{
  "entryId": "rationale-352",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_df876a1ab74395eaaadda955b740528c",
  "before": "The earlier script-proven exact target at docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-38 changed during the current-truth correction in 96a13ab21670e1f5d9748c02cd615ea5598b53f5; digest identity no longer proves this row. It is now an explicitly authored, pending supersede to the corrected current successor at docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-47. The frozen source unit and accepted historical carriage are unchanged. The source/current difference and section-specific code evidence in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json require independent truth review; no script approval or former review carries over.",
  "after": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:400-405#unheaded-block-35 (current lines); unit SHA256 08567f67d3f8d2cd74df5b45987ca4015ad06e4843a451f41fadbc64c826c277.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:458-463#unheaded-block-47 (current lines); unit SHA256 08567f67d3f8d2cd74df5b45987ca4015ad06e4843a451f41fadbc64c826c277.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 08567f67d3f8d2cd74df5b45987ca4015ad06e4843a451f41fadbc64c826c277 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-35 under docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-47; source context \"Architecture Advisory Artifact Templates / 7. Constraint Findings — `proposals/constraint-advocate.md` (Phase 6 section)\", target context \"Architecture Advisory Artifact Templates / 7. Constraint Findings — optional manual constraint/critique shape\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 351,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_df876a1ab74395eaaadda955b740528c",
    "sourceUnitDigest": "08567f67d3f8d2cd74df5b45987ca4015ad06e4843a451f41fadbc64c826c277",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md",
    "targetAnchor": "unheaded-block-47",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:400-405#unheaded-block-35 (current lines); unit SHA256 08567f67d3f8d2cd74df5b45987ca4015ad06e4843a451f41fadbc64c826c277.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:458-463#unheaded-block-47 (current lines); unit SHA256 08567f67d3f8d2cd74df5b45987ca4015ad06e4843a451f41fadbc64c826c277.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 08567f67d3f8d2cd74df5b45987ca4015ad06e4843a451f41fadbc64c826c277 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-35 under docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-47; source context \"Architecture Advisory Artifact Templates / 7. Constraint Findings — `proposals/constraint-advocate.md` (Phase 6 section)\", target context \"Architecture Advisory Artifact Templates / 7. Constraint Findings — optional manual constraint/critique shape\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "08567f67d3f8d2cd74df5b45987ca4015ad06e4843a451f41fadbc64c826c277",
    "targetAncestry": [
      "Architecture Advisory Artifact Templates",
      "7. Constraint Findings — optional manual constraint/critique shape"
    ]
  }
}
```

## Entry rationale-353

```json
{
  "entryId": "rationale-353",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_f5ac0ef50ab3563ebd907f6fce7bee1b",
  "before": "The earlier script-proven exact target at docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-42 changed during the current-truth correction in 96a13ab21670e1f5d9748c02cd615ea5598b53f5; digest identity no longer proves this row. It is now an explicitly authored, pending supersede to the corrected current successor at docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#9-human-facing-explanation-explanationmd. The frozen source unit and accepted historical carriage are unchanged. The source/current difference and section-specific code evidence in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json require independent truth review; no script approval or former review carries over.",
  "after": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:479-485#unheaded-block-39 (current lines); unit SHA256 bece9edc81e0ddcf82cad96d9340ac7e6cfe39fd9e52c195a3b2790da8fc3e75.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:540-540#9-human-facing-explanation-explanationmd (current lines); unit SHA256 7832b7c1233116e2b11ecdbd0605fb0061175cd13d11f0c863721182c7fca35b.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 7832b7c1233116e2b11ecdbd0605fb0061175cd13d11f0c863721182c7fca35b at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 39\" → \"9. Human-Facing Explanation — `explanation.md`\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-39 under docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#9-human-facing-explanation-explanationmd; source context \"Architecture Advisory Artifact Templates / 9. Human-Facing Explanation — `explanation.md`\", target context \"Architecture Advisory Artifact Templates\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 352,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_f5ac0ef50ab3563ebd907f6fce7bee1b",
    "sourceUnitDigest": "bece9edc81e0ddcf82cad96d9340ac7e6cfe39fd9e52c195a3b2790da8fc3e75",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md",
    "targetAnchor": "9-human-facing-explanation-explanationmd",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:479-485#unheaded-block-39 (current lines); unit SHA256 bece9edc81e0ddcf82cad96d9340ac7e6cfe39fd9e52c195a3b2790da8fc3e75.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:540-540#9-human-facing-explanation-explanationmd (current lines); unit SHA256 7832b7c1233116e2b11ecdbd0605fb0061175cd13d11f0c863721182c7fca35b.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 7832b7c1233116e2b11ecdbd0605fb0061175cd13d11f0c863721182c7fca35b at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 39\" → \"9. Human-Facing Explanation — `explanation.md`\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-39 under docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#9-human-facing-explanation-explanationmd; source context \"Architecture Advisory Artifact Templates / 9. Human-Facing Explanation — `explanation.md`\", target context \"Architecture Advisory Artifact Templates\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "7832b7c1233116e2b11ecdbd0605fb0061175cd13d11f0c863721182c7fca35b",
    "targetAncestry": [
      "Architecture Advisory Artifact Templates"
    ]
  }
}
```

## Entry rationale-354

```json
{
  "entryId": "rationale-354",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_48f849918416a2e7a0253da7188ed3a6",
  "before": "The earlier script-proven exact target at docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-50 changed during the current-truth correction in 96a13ab21670e1f5d9748c02cd615ea5598b53f5; digest identity no longer proves this row. It is now an explicitly authored, pending supersede to the corrected current successor at docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#11-dialogue-impact-assessment-dialogue-impactmd. The frozen source unit and accepted historical carriage are unchanged. The source/current difference and section-specific code evidence in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json require independent truth review; no script approval or former review carries over.",
  "after": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:589-626#unheaded-block-47 (current lines); unit SHA256 419bb47b988e8b7e0d505ada59d1f8c0c6afc71be503b9c7d157f3e1065e0208.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:646-646#11-dialogue-impact-assessment-dialogue-impactmd (current lines); unit SHA256 cff4e021a1b217e6e9c99fbb68b293a27d82727bb6754f892a6e0da940119208.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest cff4e021a1b217e6e9c99fbb68b293a27d82727bb6754f892a6e0da940119208 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 47\" → \"11. Dialogue Impact Assessment — `dialogue/<n>-impact.md`\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-47 under docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#11-dialogue-impact-assessment-dialogue-impactmd; source context \"Architecture Advisory Artifact Templates / 11. Dialogue Impact Assessment — `dialogue/<n>-impact.md`\", target context \"Architecture Advisory Artifact Templates\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 353,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_48f849918416a2e7a0253da7188ed3a6",
    "sourceUnitDigest": "419bb47b988e8b7e0d505ada59d1f8c0c6afc71be503b9c7d157f3e1065e0208",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md",
    "targetAnchor": "11-dialogue-impact-assessment-dialogue-impactmd",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:589-626#unheaded-block-47 (current lines); unit SHA256 419bb47b988e8b7e0d505ada59d1f8c0c6afc71be503b9c7d157f3e1065e0208.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:646-646#11-dialogue-impact-assessment-dialogue-impactmd (current lines); unit SHA256 cff4e021a1b217e6e9c99fbb68b293a27d82727bb6754f892a6e0da940119208.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest cff4e021a1b217e6e9c99fbb68b293a27d82727bb6754f892a6e0da940119208 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 47\" → \"11. Dialogue Impact Assessment — `dialogue/<n>-impact.md`\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-47 under docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#11-dialogue-impact-assessment-dialogue-impactmd; source context \"Architecture Advisory Artifact Templates / 11. Dialogue Impact Assessment — `dialogue/<n>-impact.md`\", target context \"Architecture Advisory Artifact Templates\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "cff4e021a1b217e6e9c99fbb68b293a27d82727bb6754f892a6e0da940119208",
    "targetAncestry": [
      "Architecture Advisory Artifact Templates"
    ]
  }
}
```

## Entry rationale-355

```json
{
  "entryId": "rationale-355",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_8e489ff736ba50a186eef488fdf45c56",
  "before": "The earlier script-proven exact target at docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-69 changed during the current-truth correction in 96a13ab21670e1f5d9748c02cd615ea5598b53f5; digest identity no longer proves this row. It is now an explicitly authored, pending supersede to the corrected current successor at docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#15-prompt-package-promptsmd. The frozen source unit and accepted historical carriage are unchanged. The source/current difference and section-specific code evidence in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json require independent truth review; no script approval or former review carries over.",
  "after": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:807-841#unheaded-block-64 (current lines); unit SHA256 e75202696078dfc604ef6c64f30066affe79f9e1304dc90b6532b974e34931cd.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:879-879#15-prompt-package-promptsmd (current lines); unit SHA256 1110a3463ed1912c786aae429fa258ca6ecadc867ab299edfb7b05e5f170af1e.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 1110a3463ed1912c786aae429fa258ca6ecadc867ab299edfb7b05e5f170af1e at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 64\" → \"15. Prompt Package — `prompts/<role>.md`\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-64 under docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#15-prompt-package-promptsmd; source context \"Architecture Advisory Artifact Templates / 15. Prompt Package — `prompts/<role>.md`\", target context \"Architecture Advisory Artifact Templates\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 354,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_8e489ff736ba50a186eef488fdf45c56",
    "sourceUnitDigest": "e75202696078dfc604ef6c64f30066affe79f9e1304dc90b6532b974e34931cd",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md",
    "targetAnchor": "15-prompt-package-promptsmd",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:807-841#unheaded-block-64 (current lines); unit SHA256 e75202696078dfc604ef6c64f30066affe79f9e1304dc90b6532b974e34931cd.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:879-879#15-prompt-package-promptsmd (current lines); unit SHA256 1110a3463ed1912c786aae429fa258ca6ecadc867ab299edfb7b05e5f170af1e.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 1110a3463ed1912c786aae429fa258ca6ecadc867ab299edfb7b05e5f170af1e at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 64\" → \"15. Prompt Package — `prompts/<role>.md`\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-64 under docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#15-prompt-package-promptsmd; source context \"Architecture Advisory Artifact Templates / 15. Prompt Package — `prompts/<role>.md`\", target context \"Architecture Advisory Artifact Templates\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "1110a3463ed1912c786aae429fa258ca6ecadc867ab299edfb7b05e5f170af1e",
    "targetAncestry": [
      "Architecture Advisory Artifact Templates"
    ]
  }
}
```

## Entry rationale-356

```json
{
  "entryId": "rationale-356",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_4a45bed5a7cfbab3868aa12d43769450",
  "before": "The earlier script-proven exact target at docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-75 changed during the current-truth correction in 96a13ab21670e1f5d9748c02cd615ea5598b53f5; digest identity no longer proves this row. It is now an explicitly authored, pending supersede to the corrected current successor at docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#17-red-team-report-redteammd. The frozen source unit and accepted historical carriage are unchanged. The source/current difference and section-specific code evidence in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json require independent truth review; no script approval or former review carries over.",
  "after": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:881-888#unheaded-block-69 (current lines); unit SHA256 b305a18ce11506b14cae5728a1ad5768fec6cd7f6f539130a2324d03a5cb41ea.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:959-959#17-red-team-report-redteammd (current lines); unit SHA256 e4e8ff075643ee8057c2f7f6bc8da547ac03d0df8868d775a62c8d7b6ba1b082.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest e4e8ff075643ee8057c2f7f6bc8da547ac03d0df8868d775a62c8d7b6ba1b082 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 69\" → \"17. Red-Team Report — `redteam.md`\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-69 under docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#17-red-team-report-redteammd; source context \"Architecture Advisory Artifact Templates / 17. Red-Team Report — `redteam.md`\", target context \"Architecture Advisory Artifact Templates\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 355,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_4a45bed5a7cfbab3868aa12d43769450",
    "sourceUnitDigest": "b305a18ce11506b14cae5728a1ad5768fec6cd7f6f539130a2324d03a5cb41ea",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md",
    "targetAnchor": "17-red-team-report-redteammd",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:881-888#unheaded-block-69 (current lines); unit SHA256 b305a18ce11506b14cae5728a1ad5768fec6cd7f6f539130a2324d03a5cb41ea.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:959-959#17-red-team-report-redteammd (current lines); unit SHA256 e4e8ff075643ee8057c2f7f6bc8da547ac03d0df8868d775a62c8d7b6ba1b082.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest e4e8ff075643ee8057c2f7f6bc8da547ac03d0df8868d775a62c8d7b6ba1b082 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 69\" → \"17. Red-Team Report — `redteam.md`\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-69 under docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#17-red-team-report-redteammd; source context \"Architecture Advisory Artifact Templates / 17. Red-Team Report — `redteam.md`\", target context \"Architecture Advisory Artifact Templates\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "e4e8ff075643ee8057c2f7f6bc8da547ac03d0df8868d775a62c8d7b6ba1b082",
    "targetAncestry": [
      "Architecture Advisory Artifact Templates"
    ]
  }
}
```

## Entry rationale-357

```json
{
  "entryId": "rationale-357",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_a3371035f36760e80daff24f1b12ae48",
  "before": "The earlier script-proven exact target at docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-76 changed during the current-truth correction in 96a13ab21670e1f5d9748c02cd615ea5598b53f5; digest identity no longer proves this row. It is now an explicitly authored, pending supersede to the corrected current successor at docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#17-red-team-report-redteammd. The frozen source unit and accepted historical carriage are unchanged. The source/current difference and section-specific code evidence in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json require independent truth review; no script approval or former review carries over.",
  "after": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:890-891#unheaded-block-70 (current lines); unit SHA256 b67455829142f78e8b9d4eba9897a599eb23e6ea213b7a84c9864d61640854eb.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:959-959#17-red-team-report-redteammd (current lines); unit SHA256 e4e8ff075643ee8057c2f7f6bc8da547ac03d0df8868d775a62c8d7b6ba1b082.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest e4e8ff075643ee8057c2f7f6bc8da547ac03d0df8868d775a62c8d7b6ba1b082 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 70\" → \"17. Red-Team Report — `redteam.md`\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-70 under docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#17-red-team-report-redteammd; source context \"Architecture Advisory Artifact Templates / 17. Red-Team Report — `redteam.md`\", target context \"Architecture Advisory Artifact Templates\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 356,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_a3371035f36760e80daff24f1b12ae48",
    "sourceUnitDigest": "b67455829142f78e8b9d4eba9897a599eb23e6ea213b7a84c9864d61640854eb",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md",
    "targetAnchor": "17-red-team-report-redteammd",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:890-891#unheaded-block-70 (current lines); unit SHA256 b67455829142f78e8b9d4eba9897a599eb23e6ea213b7a84c9864d61640854eb.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:959-959#17-red-team-report-redteammd (current lines); unit SHA256 e4e8ff075643ee8057c2f7f6bc8da547ac03d0df8868d775a62c8d7b6ba1b082.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest e4e8ff075643ee8057c2f7f6bc8da547ac03d0df8868d775a62c8d7b6ba1b082 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 70\" → \"17. Red-Team Report — `redteam.md`\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-70 under docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#17-red-team-report-redteammd; source context \"Architecture Advisory Artifact Templates / 17. Red-Team Report — `redteam.md`\", target context \"Architecture Advisory Artifact Templates\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "e4e8ff075643ee8057c2f7f6bc8da547ac03d0df8868d775a62c8d7b6ba1b082",
    "targetAncestry": [
      "Architecture Advisory Artifact Templates"
    ]
  }
}
```

## Entry rationale-358

```json
{
  "entryId": "rationale-358",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_b4a122fdf0fb7791b7747ab63d107da5",
  "before": "The earlier script-proven exact target at docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-77 changed during the current-truth correction in 96a13ab21670e1f5d9748c02cd615ea5598b53f5; digest identity no longer proves this row. It is now an explicitly authored, pending supersede to the corrected current successor at docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#17-red-team-report-redteammd. The frozen source unit and accepted historical carriage are unchanged. The source/current difference and section-specific code evidence in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json require independent truth review; no script approval or former review carries over.",
  "after": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:893-925#unheaded-block-71 (current lines); unit SHA256 a2260d42e998d826a205adaa9b8bb9755af5c4383971c64dc394b18c265afe47.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:959-959#17-red-team-report-redteammd (current lines); unit SHA256 e4e8ff075643ee8057c2f7f6bc8da547ac03d0df8868d775a62c8d7b6ba1b082.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest e4e8ff075643ee8057c2f7f6bc8da547ac03d0df8868d775a62c8d7b6ba1b082 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 71\" → \"17. Red-Team Report — `redteam.md`\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-71 under docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#17-red-team-report-redteammd; source context \"Architecture Advisory Artifact Templates / 17. Red-Team Report — `redteam.md`\", target context \"Architecture Advisory Artifact Templates\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 357,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_b4a122fdf0fb7791b7747ab63d107da5",
    "sourceUnitDigest": "a2260d42e998d826a205adaa9b8bb9755af5c4383971c64dc394b18c265afe47",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md",
    "targetAnchor": "17-red-team-report-redteammd",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:893-925#unheaded-block-71 (current lines); unit SHA256 a2260d42e998d826a205adaa9b8bb9755af5c4383971c64dc394b18c265afe47.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:959-959#17-red-team-report-redteammd (current lines); unit SHA256 e4e8ff075643ee8057c2f7f6bc8da547ac03d0df8868d775a62c8d7b6ba1b082.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest e4e8ff075643ee8057c2f7f6bc8da547ac03d0df8868d775a62c8d7b6ba1b082 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 71\" → \"17. Red-Team Report — `redteam.md`\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-71 under docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#17-red-team-report-redteammd; source context \"Architecture Advisory Artifact Templates / 17. Red-Team Report — `redteam.md`\", target context \"Architecture Advisory Artifact Templates\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "e4e8ff075643ee8057c2f7f6bc8da547ac03d0df8868d775a62c8d7b6ba1b082",
    "targetAncestry": [
      "Architecture Advisory Artifact Templates"
    ]
  }
}
```

## Entry rationale-359

```json
{
  "entryId": "rationale-359",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_1449692311c75f2f513b0e3838de257d",
  "before": "The earlier script-proven exact target at docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-79 changed during the current-truth correction in 96a13ab21670e1f5d9748c02cd615ea5598b53f5; digest identity no longer proves this row. It is now an explicitly authored, pending supersede to the corrected current successor at docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#18-reviewer-assessment-reviewmd. The frozen source unit and accepted historical carriage are unchanged. The source/current difference and section-specific code evidence in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json require independent truth review; no script approval or former review carries over.",
  "after": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:940-945#unheaded-block-73 (current lines); unit SHA256 5a24149f1b973fea20707d1688326f74835f942e028379402ab00eac5943a75f.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:1017-1017#18-reviewer-assessment-reviewmd (current lines); unit SHA256 281cf39b9921e81e05ae93ea920849adc9d6330e3fd545cf47bdf78d707d3799.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 281cf39b9921e81e05ae93ea920849adc9d6330e3fd545cf47bdf78d707d3799 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 73\" → \"18. Reviewer Assessment — `review.md`\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-73 under docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#18-reviewer-assessment-reviewmd; source context \"Architecture Advisory Artifact Templates / 18. Reviewer Assessment — `review.md`\", target context \"Architecture Advisory Artifact Templates\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 358,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_1449692311c75f2f513b0e3838de257d",
    "sourceUnitDigest": "5a24149f1b973fea20707d1688326f74835f942e028379402ab00eac5943a75f",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md",
    "targetAnchor": "18-reviewer-assessment-reviewmd",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:940-945#unheaded-block-73 (current lines); unit SHA256 5a24149f1b973fea20707d1688326f74835f942e028379402ab00eac5943a75f.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:1017-1017#18-reviewer-assessment-reviewmd (current lines); unit SHA256 281cf39b9921e81e05ae93ea920849adc9d6330e3fd545cf47bdf78d707d3799.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 281cf39b9921e81e05ae93ea920849adc9d6330e3fd545cf47bdf78d707d3799 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 73\" → \"18. Reviewer Assessment — `review.md`\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-73 under docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#18-reviewer-assessment-reviewmd; source context \"Architecture Advisory Artifact Templates / 18. Reviewer Assessment — `review.md`\", target context \"Architecture Advisory Artifact Templates\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "281cf39b9921e81e05ae93ea920849adc9d6330e3fd545cf47bdf78d707d3799",
    "targetAncestry": [
      "Architecture Advisory Artifact Templates"
    ]
  }
}
```

## Entry rationale-360

```json
{
  "entryId": "rationale-360",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_8b66907461f2c1a815924ea9aebf4b09",
  "before": "The earlier script-proven exact target at docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-80 changed during the current-truth correction in 96a13ab21670e1f5d9748c02cd615ea5598b53f5; digest identity no longer proves this row. It is now an explicitly authored, pending supersede to the corrected current successor at docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#18-reviewer-assessment-reviewmd. The frozen source unit and accepted historical carriage are unchanged. The source/current difference and section-specific code evidence in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json require independent truth review; no script approval or former review carries over.",
  "after": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:947-949#unheaded-block-74 (current lines); unit SHA256 845fdc216ee998d3833dc123bd929e5d9f08bd6bc033feecb6c662a3e727171c.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:1017-1017#18-reviewer-assessment-reviewmd (current lines); unit SHA256 281cf39b9921e81e05ae93ea920849adc9d6330e3fd545cf47bdf78d707d3799.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 281cf39b9921e81e05ae93ea920849adc9d6330e3fd545cf47bdf78d707d3799 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 74\" → \"18. Reviewer Assessment — `review.md`\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-74 under docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#18-reviewer-assessment-reviewmd; source context \"Architecture Advisory Artifact Templates / 18. Reviewer Assessment — `review.md`\", target context \"Architecture Advisory Artifact Templates\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 359,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_8b66907461f2c1a815924ea9aebf4b09",
    "sourceUnitDigest": "845fdc216ee998d3833dc123bd929e5d9f08bd6bc033feecb6c662a3e727171c",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md",
    "targetAnchor": "18-reviewer-assessment-reviewmd",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:947-949#unheaded-block-74 (current lines); unit SHA256 845fdc216ee998d3833dc123bd929e5d9f08bd6bc033feecb6c662a3e727171c.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:1017-1017#18-reviewer-assessment-reviewmd (current lines); unit SHA256 281cf39b9921e81e05ae93ea920849adc9d6330e3fd545cf47bdf78d707d3799.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 281cf39b9921e81e05ae93ea920849adc9d6330e3fd545cf47bdf78d707d3799 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 74\" → \"18. Reviewer Assessment — `review.md`\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-74 under docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#18-reviewer-assessment-reviewmd; source context \"Architecture Advisory Artifact Templates / 18. Reviewer Assessment — `review.md`\", target context \"Architecture Advisory Artifact Templates\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "281cf39b9921e81e05ae93ea920849adc9d6330e3fd545cf47bdf78d707d3799",
    "targetAncestry": [
      "Architecture Advisory Artifact Templates"
    ]
  }
}
```

