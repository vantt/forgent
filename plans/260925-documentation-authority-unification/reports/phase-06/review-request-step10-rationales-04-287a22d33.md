# Bounded re-review: rationales 4

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

## Entry rationale-181

```json
{
  "entryId": "rationale-181",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_8542779d7837422248635f92de9b3acc",
  "before": "The current successor at docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#1-purpose supersedes the stale current-state claim shown at docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-6 before 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The original frozen source remains conserved by the accepted carriage and its dated complete historical carrier; this is a truth correction, not a new move or retirement. The section-specific code/CLI evidence is recorded in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json. This successor is pending independent truth review, with no inherited approval.",
  "after": "Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md:29-37#unheaded-block-6 (current lines); unit SHA256 978a58e97f57c8fd35a307893f95258075982cf4c2a5b0c90cced1dd574b7b0d.\nTarget: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md:25-25#1-purpose (current lines); unit SHA256 686ca168b65f0f7cdb20ef555957a6662aa1daa93df0e6448262cb4ba1b01c07.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 686ca168b65f0f7cdb20ef555957a6662aa1daa93df0e6448262cb4ba1b01c07 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 6\" → \"1. Purpose\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-6 under docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#1-purpose; source context \"Team Communication Protocol V1 / 1. Purpose\", target context \"Team Communication Protocol V1\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 180,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_8542779d7837422248635f92de9b3acc",
    "sourceUnitDigest": "978a58e97f57c8fd35a307893f95258075982cf4c2a5b0c90cced1dd574b7b0d",
    "claimKind": "contract",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md:29-37#unheaded-block-6 (current lines); unit SHA256 978a58e97f57c8fd35a307893f95258075982cf4c2a5b0c90cced1dd574b7b0d.\nTarget: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md:25-25#1-purpose (current lines); unit SHA256 686ca168b65f0f7cdb20ef555957a6662aa1daa93df0e6448262cb4ba1b01c07.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 686ca168b65f0f7cdb20ef555957a6662aa1daa93df0e6448262cb4ba1b01c07 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 6\" → \"1. Purpose\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-6 under docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#1-purpose; source context \"Team Communication Protocol V1 / 1. Purpose\", target context \"Team Communication Protocol V1\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md",
    "targetAnchor": "1-purpose",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "686ca168b65f0f7cdb20ef555957a6662aa1daa93df0e6448262cb4ba1b01c07",
    "targetAncestry": [
      "Team Communication Protocol V1"
    ]
  }
}
```

## Entry rationale-182

```json
{
  "entryId": "rationale-182",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_00e1655090bf22e4220e1a3ced2d7754",
  "before": "The current successor at docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#2-non-negotiable-boundaries supersedes the stale current-state claim shown at docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-8 before 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The original frozen source remains conserved by the accepted carriage and its dated complete historical carrier; this is a truth correction, not a new move or retirement. The section-specific code/CLI evidence is recorded in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json. This successor is pending independent truth review, with no inherited approval.",
  "after": "Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md:45-54#unheaded-block-8 (current lines); unit SHA256 5d24354554fdf1aed4c4baad1294475bb1d44e0b36c912743d7122764454c240.\nTarget: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md:52-52#2-non-negotiable-boundaries (current lines); unit SHA256 69df95123739c341b70ac683f5191086425ea3bd6a02af26a8dd86eb02a2d6a2.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 69df95123739c341b70ac683f5191086425ea3bd6a02af26a8dd86eb02a2d6a2 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 8\" → \"2. Non-Negotiable Boundaries\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-8 under docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#2-non-negotiable-boundaries; source context \"Team Communication Protocol V1 / 2. Non-Negotiable Boundaries\", target context \"Team Communication Protocol V1\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 181,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_00e1655090bf22e4220e1a3ced2d7754",
    "sourceUnitDigest": "5d24354554fdf1aed4c4baad1294475bb1d44e0b36c912743d7122764454c240",
    "claimKind": "contract",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md:45-54#unheaded-block-8 (current lines); unit SHA256 5d24354554fdf1aed4c4baad1294475bb1d44e0b36c912743d7122764454c240.\nTarget: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md:52-52#2-non-negotiable-boundaries (current lines); unit SHA256 69df95123739c341b70ac683f5191086425ea3bd6a02af26a8dd86eb02a2d6a2.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 69df95123739c341b70ac683f5191086425ea3bd6a02af26a8dd86eb02a2d6a2 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 8\" → \"2. Non-Negotiable Boundaries\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-8 under docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#2-non-negotiable-boundaries; source context \"Team Communication Protocol V1 / 2. Non-Negotiable Boundaries\", target context \"Team Communication Protocol V1\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md",
    "targetAnchor": "2-non-negotiable-boundaries",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "69df95123739c341b70ac683f5191086425ea3bd6a02af26a8dd86eb02a2d6a2",
    "targetAncestry": [
      "Team Communication Protocol V1"
    ]
  }
}
```

## Entry rationale-183

```json
{
  "entryId": "rationale-183",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_e7e86a8ca90d80602b8286cd75c34562",
  "before": "The current successor at docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#3-roles supersedes the stale current-state claim shown at docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-14 before 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The original frozen source remains conserved by the accepted carriage and its dated complete historical carrier; this is a truth correction, not a new move or retirement. The section-specific code/CLI evidence is recorded in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json. This successor is pending independent truth review, with no inherited approval.",
  "after": "Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md:78-79#unheaded-block-14 (current lines); unit SHA256 0f8cf844c97de3526eee2ec61054ff6f1f020149ef271b99a4047051ecdfefcc.\nTarget: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md:72-72#3-roles (current lines); unit SHA256 d472469ec9d5dbb20c57cf3e3bb26bdf1324fa107d3206368ef57fbe99a15b99.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest d472469ec9d5dbb20c57cf3e3bb26bdf1324fa107d3206368ef57fbe99a15b99 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 14\" → \"3. Roles\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-14 under docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#3-roles; source context \"Team Communication Protocol V1 / 3. Roles\", target context \"Team Communication Protocol V1\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 182,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_e7e86a8ca90d80602b8286cd75c34562",
    "sourceUnitDigest": "0f8cf844c97de3526eee2ec61054ff6f1f020149ef271b99a4047051ecdfefcc",
    "claimKind": "contract",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md:78-79#unheaded-block-14 (current lines); unit SHA256 0f8cf844c97de3526eee2ec61054ff6f1f020149ef271b99a4047051ecdfefcc.\nTarget: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md:72-72#3-roles (current lines); unit SHA256 d472469ec9d5dbb20c57cf3e3bb26bdf1324fa107d3206368ef57fbe99a15b99.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest d472469ec9d5dbb20c57cf3e3bb26bdf1324fa107d3206368ef57fbe99a15b99 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 14\" → \"3. Roles\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-14 under docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#3-roles; source context \"Team Communication Protocol V1 / 3. Roles\", target context \"Team Communication Protocol V1\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md",
    "targetAnchor": "3-roles",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "d472469ec9d5dbb20c57cf3e3bb26bdf1324fa107d3206368ef57fbe99a15b99",
    "targetAncestry": [
      "Team Communication Protocol V1"
    ]
  }
}
```

## Entry rationale-184

```json
{
  "entryId": "rationale-184",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_786929f6ae58e1e2fefd5e08805433ae",
  "before": "The current successor at docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#4-communication-modes supersedes the stale current-state claim shown at docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-16 before 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The original frozen source remains conserved by the accepted carriage and its dated complete historical carrier; this is a truth correction, not a new move or retirement. The section-specific code/CLI evidence is recorded in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json. This successor is pending independent truth review, with no inherited approval.",
  "after": "Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md:85-88#unheaded-block-16 (current lines); unit SHA256 e648f0d7dce1322214f40a89a0fd813bbdb8389e26d00f53bc9ce3f4fe1f4fd5.\nTarget: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md:90-90#4-communication-modes (current lines); unit SHA256 6cdb64c2bba9565b9069f599bd600b68e8f949ad27d44b5187662ba5fd2a6549.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 6cdb64c2bba9565b9069f599bd600b68e8f949ad27d44b5187662ba5fd2a6549 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 16\" → \"4. Communication Modes\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-16 under docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#4-communication-modes; source context \"Team Communication Protocol V1 / 4. Communication Modes\", target context \"Team Communication Protocol V1\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 183,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_786929f6ae58e1e2fefd5e08805433ae",
    "sourceUnitDigest": "e648f0d7dce1322214f40a89a0fd813bbdb8389e26d00f53bc9ce3f4fe1f4fd5",
    "claimKind": "contract",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md:85-88#unheaded-block-16 (current lines); unit SHA256 e648f0d7dce1322214f40a89a0fd813bbdb8389e26d00f53bc9ce3f4fe1f4fd5.\nTarget: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md:90-90#4-communication-modes (current lines); unit SHA256 6cdb64c2bba9565b9069f599bd600b68e8f949ad27d44b5187662ba5fd2a6549.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 6cdb64c2bba9565b9069f599bd600b68e8f949ad27d44b5187662ba5fd2a6549 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 16\" → \"4. Communication Modes\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-16 under docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#4-communication-modes; source context \"Team Communication Protocol V1 / 4. Communication Modes\", target context \"Team Communication Protocol V1\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md",
    "targetAnchor": "4-communication-modes",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "6cdb64c2bba9565b9069f599bd600b68e8f949ad27d44b5187662ba5fd2a6549",
    "targetAncestry": [
      "Team Communication Protocol V1"
    ]
  }
}
```

## Entry rationale-185

```json
{
  "entryId": "rationale-185",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_37730bd21cb1e3dc98a453dd7f96a13a",
  "before": "The current successor at docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#4-communication-modes supersedes the stale current-state claim shown at docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-17 before 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The original frozen source remains conserved by the accepted carriage and its dated complete historical carrier; this is a truth correction, not a new move or retirement. The section-specific code/CLI evidence is recorded in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json. This successor is pending independent truth review, with no inherited approval.",
  "after": "Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md:90-91#unheaded-block-17 (current lines); unit SHA256 da909120a851450c745f09b1b2ede09591abbb5881d013a1fb1dc0587c369569.\nTarget: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md:90-90#4-communication-modes (current lines); unit SHA256 6cdb64c2bba9565b9069f599bd600b68e8f949ad27d44b5187662ba5fd2a6549.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 6cdb64c2bba9565b9069f599bd600b68e8f949ad27d44b5187662ba5fd2a6549 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 17\" → \"4. Communication Modes\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-17 under docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#4-communication-modes; source context \"Team Communication Protocol V1 / 4. Communication Modes\", target context \"Team Communication Protocol V1\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 184,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_37730bd21cb1e3dc98a453dd7f96a13a",
    "sourceUnitDigest": "da909120a851450c745f09b1b2ede09591abbb5881d013a1fb1dc0587c369569",
    "claimKind": "contract",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md:90-91#unheaded-block-17 (current lines); unit SHA256 da909120a851450c745f09b1b2ede09591abbb5881d013a1fb1dc0587c369569.\nTarget: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md:90-90#4-communication-modes (current lines); unit SHA256 6cdb64c2bba9565b9069f599bd600b68e8f949ad27d44b5187662ba5fd2a6549.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 6cdb64c2bba9565b9069f599bd600b68e8f949ad27d44b5187662ba5fd2a6549 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 17\" → \"4. Communication Modes\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-17 under docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#4-communication-modes; source context \"Team Communication Protocol V1 / 4. Communication Modes\", target context \"Team Communication Protocol V1\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md",
    "targetAnchor": "4-communication-modes",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "6cdb64c2bba9565b9069f599bd600b68e8f949ad27d44b5187662ba5fd2a6549",
    "targetAncestry": [
      "Team Communication Protocol V1"
    ]
  }
}
```

## Entry rationale-186

```json
{
  "entryId": "rationale-186",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_a9382eb0ecc328ef7350f203cc059ed0",
  "before": "The current successor at docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#5-workflow-step-operation-selection supersedes the stale current-state claim shown at docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-20 before 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The original frozen source remains conserved by the accepted carriage and its dated complete historical carrier; this is a truth correction, not a new move or retirement. The section-specific code/CLI evidence is recorded in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json. This successor is pending independent truth review, with no inherited approval.",
  "after": "Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md:101-115#unheaded-block-20 (current lines); unit SHA256 d166987d5a39d4670bddb33f721e6ac4075dc8df339d1af80110991e117c1171.\nTarget: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md:105-105#5-workflow-step-operation-selection (current lines); unit SHA256 fabc9e94c67820f5472177487d55f406c9396fd74a625f5cd9e63b480cf9f44a.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest fabc9e94c67820f5472177487d55f406c9396fd74a625f5cd9e63b480cf9f44a at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 20\" → \"5. Workflow Step Operation Selection\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-20 under docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#5-workflow-step-operation-selection; source context \"Team Communication Protocol V1 / 5. Stage Operation Selection\", target context \"Team Communication Protocol V1\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 185,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_a9382eb0ecc328ef7350f203cc059ed0",
    "sourceUnitDigest": "d166987d5a39d4670bddb33f721e6ac4075dc8df339d1af80110991e117c1171",
    "claimKind": "contract",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md:101-115#unheaded-block-20 (current lines); unit SHA256 d166987d5a39d4670bddb33f721e6ac4075dc8df339d1af80110991e117c1171.\nTarget: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md:105-105#5-workflow-step-operation-selection (current lines); unit SHA256 fabc9e94c67820f5472177487d55f406c9396fd74a625f5cd9e63b480cf9f44a.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest fabc9e94c67820f5472177487d55f406c9396fd74a625f5cd9e63b480cf9f44a at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 20\" → \"5. Workflow Step Operation Selection\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-20 under docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#5-workflow-step-operation-selection; source context \"Team Communication Protocol V1 / 5. Stage Operation Selection\", target context \"Team Communication Protocol V1\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md",
    "targetAnchor": "5-workflow-step-operation-selection",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "fabc9e94c67820f5472177487d55f406c9396fd74a625f5cd9e63b480cf9f44a",
    "targetAncestry": [
      "Team Communication Protocol V1"
    ]
  }
}
```

## Entry rationale-187

```json
{
  "entryId": "rationale-187",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_e3d4d7b0fa329e89ef258b2b93e0f213",
  "before": "The current successor at docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#6-assignment-message-contract supersedes the stale current-state claim shown at docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-24 before 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The original frozen source remains conserved by the accepted carriage and its dated complete historical carrier; this is a truth correction, not a new move or retirement. The section-specific code/CLI evidence is recorded in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json. This successor is pending independent truth review, with no inherited approval.",
  "after": "Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md:135-149#unheaded-block-24 (current lines); unit SHA256 20e1ef602b061c806eb838f203169426d8fbd7222a39e702e08e1db5c490c50f.\nTarget: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md:140-140#6-assignment-message-contract (current lines); unit SHA256 0eb0e748178bcb38d9e72ca7337e97a9c0802f273260de260a06b9dc82b3efe9.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 0eb0e748178bcb38d9e72ca7337e97a9c0802f273260de260a06b9dc82b3efe9 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 24\" → \"6. Assignment Message Contract\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-24 under docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#6-assignment-message-contract; source context \"Team Communication Protocol V1 / 6. Assignment Message Contract\", target context \"Team Communication Protocol V1\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 186,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_e3d4d7b0fa329e89ef258b2b93e0f213",
    "sourceUnitDigest": "20e1ef602b061c806eb838f203169426d8fbd7222a39e702e08e1db5c490c50f",
    "claimKind": "contract",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md:135-149#unheaded-block-24 (current lines); unit SHA256 20e1ef602b061c806eb838f203169426d8fbd7222a39e702e08e1db5c490c50f.\nTarget: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md:140-140#6-assignment-message-contract (current lines); unit SHA256 0eb0e748178bcb38d9e72ca7337e97a9c0802f273260de260a06b9dc82b3efe9.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 0eb0e748178bcb38d9e72ca7337e97a9c0802f273260de260a06b9dc82b3efe9 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 24\" → \"6. Assignment Message Contract\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-24 under docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#6-assignment-message-contract; source context \"Team Communication Protocol V1 / 6. Assignment Message Contract\", target context \"Team Communication Protocol V1\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md",
    "targetAnchor": "6-assignment-message-contract",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "0eb0e748178bcb38d9e72ca7337e97a9c0802f273260de260a06b9dc82b3efe9",
    "targetAncestry": [
      "Team Communication Protocol V1"
    ]
  }
}
```

## Entry rationale-188

```json
{
  "entryId": "rationale-188",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_57f26b5acbd6bb500ca353f84f486488",
  "before": "The frozen primitive is still byte-identical at docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-41; only its owning heading ancestry was corrected in 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The move/carriage decision is unchanged. Heading/context changes invalidate the prior approval even when the primitive text digest is equal. The current section and its specific code evidence in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json are pending independent truth review.",
  "after": "Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md:236-243#unheaded-block-41 (current lines); unit SHA256 538e8cefb7885ba1fd52c8a4b9dc39cdd9b13edc851f8b83dd1b48a0670fd4c8.\nTarget: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md:261-268#unheaded-block-44 (current lines); unit SHA256 538e8cefb7885ba1fd52c8a4b9dc39cdd9b13edc851f8b83dd1b48a0670fd4c8.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 538e8cefb7885ba1fd52c8a4b9dc39cdd9b13edc851f8b83dd1b48a0670fd4c8 at 865ad66bebcc4748341e676bdc5b53a453ce1556.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-41 under docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-44; source context \"Team Communication Protocol V1 / 10. Coding-Domain Stage Protocols / 10.1 Discovery\", target context \"Team Communication Protocol V1 / 10. Coding-Domain Workflow Step Operations / 10.1 Discovery\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 187,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_57f26b5acbd6bb500ca353f84f486488",
    "sourceUnitDigest": "538e8cefb7885ba1fd52c8a4b9dc39cdd9b13edc851f8b83dd1b48a0670fd4c8",
    "claimKind": "contract",
    "disposition": "move",
    "rationale": "Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md:236-243#unheaded-block-41 (current lines); unit SHA256 538e8cefb7885ba1fd52c8a4b9dc39cdd9b13edc851f8b83dd1b48a0670fd4c8.\nTarget: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md:261-268#unheaded-block-44 (current lines); unit SHA256 538e8cefb7885ba1fd52c8a4b9dc39cdd9b13edc851f8b83dd1b48a0670fd4c8.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 538e8cefb7885ba1fd52c8a4b9dc39cdd9b13edc851f8b83dd1b48a0670fd4c8 at 865ad66bebcc4748341e676bdc5b53a453ce1556.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-41 under docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-44; source context \"Team Communication Protocol V1 / 10. Coding-Domain Stage Protocols / 10.1 Discovery\", target context \"Team Communication Protocol V1 / 10. Coding-Domain Workflow Step Operations / 10.1 Discovery\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md",
    "targetAnchor": "unheaded-block-44",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "538e8cefb7885ba1fd52c8a4b9dc39cdd9b13edc851f8b83dd1b48a0670fd4c8",
    "targetAncestry": [
      "Team Communication Protocol V1",
      "10. Coding-Domain Workflow Step Operations",
      "10.1 Discovery"
    ]
  }
}
```

## Entry rationale-189

```json
{
  "entryId": "rationale-189",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_242208b542d4bb24c84796f43f775d4a",
  "before": "The frozen primitive is still byte-identical at docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-43; only its owning heading ancestry was corrected in 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The move/carriage decision is unchanged. Heading/context changes invalidate the prior approval even when the primitive text digest is equal. The current section and its specific code evidence in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json are pending independent truth review.",
  "after": "Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md:254-254#unheaded-block-43 (current lines); unit SHA256 8be1c52fac778e783278a3fa17f78a4cf05b675f7111d46bc5930dd19a2bce63.\nTarget: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md:279-279#unheaded-block-46 (current lines); unit SHA256 8be1c52fac778e783278a3fa17f78a4cf05b675f7111d46bc5930dd19a2bce63.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 8be1c52fac778e783278a3fa17f78a4cf05b675f7111d46bc5930dd19a2bce63 at 865ad66bebcc4748341e676bdc5b53a453ce1556.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-43 under docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-46; source context \"Team Communication Protocol V1 / 10. Coding-Domain Stage Protocols / 10.2 Exploring\", target context \"Team Communication Protocol V1 / 10. Coding-Domain Workflow Step Operations / 10.2 Exploring\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 188,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_242208b542d4bb24c84796f43f775d4a",
    "sourceUnitDigest": "8be1c52fac778e783278a3fa17f78a4cf05b675f7111d46bc5930dd19a2bce63",
    "claimKind": "decision",
    "disposition": "move",
    "rationale": "Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md:254-254#unheaded-block-43 (current lines); unit SHA256 8be1c52fac778e783278a3fa17f78a4cf05b675f7111d46bc5930dd19a2bce63.\nTarget: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md:279-279#unheaded-block-46 (current lines); unit SHA256 8be1c52fac778e783278a3fa17f78a4cf05b675f7111d46bc5930dd19a2bce63.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 8be1c52fac778e783278a3fa17f78a4cf05b675f7111d46bc5930dd19a2bce63 at 865ad66bebcc4748341e676bdc5b53a453ce1556.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-43 under docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-46; source context \"Team Communication Protocol V1 / 10. Coding-Domain Stage Protocols / 10.2 Exploring\", target context \"Team Communication Protocol V1 / 10. Coding-Domain Workflow Step Operations / 10.2 Exploring\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md",
    "targetAnchor": "unheaded-block-46",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "8be1c52fac778e783278a3fa17f78a4cf05b675f7111d46bc5930dd19a2bce63",
    "targetAncestry": [
      "Team Communication Protocol V1",
      "10. Coding-Domain Workflow Step Operations",
      "10.2 Exploring"
    ]
  }
}
```

## Entry rationale-190

```json
{
  "entryId": "rationale-190",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_88cf23510b37d2048b1a578efc2ebb10",
  "before": "The frozen primitive is still byte-identical at docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-44; only its owning heading ancestry was corrected in 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The move/carriage decision is unchanged. Heading/context changes invalidate the prior approval even when the primitive text digest is equal. The current section and its specific code evidence in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json are pending independent truth review.",
  "after": "Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md:256-260#unheaded-block-44 (current lines); unit SHA256 6c2c64a1d48e2d1dca430f0811e612771eda3379e19731d984b3c5ea8b042013.\nTarget: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md:281-285#unheaded-block-47 (current lines); unit SHA256 6c2c64a1d48e2d1dca430f0811e612771eda3379e19731d984b3c5ea8b042013.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 6c2c64a1d48e2d1dca430f0811e612771eda3379e19731d984b3c5ea8b042013 at 865ad66bebcc4748341e676bdc5b53a453ce1556.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-44 under docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-47; source context \"Team Communication Protocol V1 / 10. Coding-Domain Stage Protocols / 10.2 Exploring\", target context \"Team Communication Protocol V1 / 10. Coding-Domain Workflow Step Operations / 10.2 Exploring\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 189,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_88cf23510b37d2048b1a578efc2ebb10",
    "sourceUnitDigest": "6c2c64a1d48e2d1dca430f0811e612771eda3379e19731d984b3c5ea8b042013",
    "claimKind": "contract",
    "disposition": "move",
    "rationale": "Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md:256-260#unheaded-block-44 (current lines); unit SHA256 6c2c64a1d48e2d1dca430f0811e612771eda3379e19731d984b3c5ea8b042013.\nTarget: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md:281-285#unheaded-block-47 (current lines); unit SHA256 6c2c64a1d48e2d1dca430f0811e612771eda3379e19731d984b3c5ea8b042013.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 6c2c64a1d48e2d1dca430f0811e612771eda3379e19731d984b3c5ea8b042013 at 865ad66bebcc4748341e676bdc5b53a453ce1556.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-44 under docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-47; source context \"Team Communication Protocol V1 / 10. Coding-Domain Stage Protocols / 10.2 Exploring\", target context \"Team Communication Protocol V1 / 10. Coding-Domain Workflow Step Operations / 10.2 Exploring\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md",
    "targetAnchor": "unheaded-block-47",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "6c2c64a1d48e2d1dca430f0811e612771eda3379e19731d984b3c5ea8b042013",
    "targetAncestry": [
      "Team Communication Protocol V1",
      "10. Coding-Domain Workflow Step Operations",
      "10.2 Exploring"
    ]
  }
}
```

## Entry rationale-191

```json
{
  "entryId": "rationale-191",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_abb60eb206ce120877cc9c06f826ab57",
  "before": "The frozen primitive is still byte-identical at docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-45; only its owning heading ancestry was corrected in 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The move/carriage decision is unchanged. Heading/context changes invalidate the prior approval even when the primitive text digest is equal. The current section and its specific code evidence in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json are pending independent truth review.",
  "after": "Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md:262-263#unheaded-block-45 (current lines); unit SHA256 6e5cc24269ba7cf4ebfdf5bb8062990d284cd999b1d8462e36c55d28713910f2.\nTarget: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md:287-288#unheaded-block-48 (current lines); unit SHA256 6e5cc24269ba7cf4ebfdf5bb8062990d284cd999b1d8462e36c55d28713910f2.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 6e5cc24269ba7cf4ebfdf5bb8062990d284cd999b1d8462e36c55d28713910f2 at 865ad66bebcc4748341e676bdc5b53a453ce1556.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-45 under docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-48; source context \"Team Communication Protocol V1 / 10. Coding-Domain Stage Protocols / 10.2 Exploring\", target context \"Team Communication Protocol V1 / 10. Coding-Domain Workflow Step Operations / 10.2 Exploring\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 190,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_abb60eb206ce120877cc9c06f826ab57",
    "sourceUnitDigest": "6e5cc24269ba7cf4ebfdf5bb8062990d284cd999b1d8462e36c55d28713910f2",
    "claimKind": "contract",
    "disposition": "move",
    "rationale": "Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md:262-263#unheaded-block-45 (current lines); unit SHA256 6e5cc24269ba7cf4ebfdf5bb8062990d284cd999b1d8462e36c55d28713910f2.\nTarget: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md:287-288#unheaded-block-48 (current lines); unit SHA256 6e5cc24269ba7cf4ebfdf5bb8062990d284cd999b1d8462e36c55d28713910f2.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 6e5cc24269ba7cf4ebfdf5bb8062990d284cd999b1d8462e36c55d28713910f2 at 865ad66bebcc4748341e676bdc5b53a453ce1556.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-45 under docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-48; source context \"Team Communication Protocol V1 / 10. Coding-Domain Stage Protocols / 10.2 Exploring\", target context \"Team Communication Protocol V1 / 10. Coding-Domain Workflow Step Operations / 10.2 Exploring\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md",
    "targetAnchor": "unheaded-block-48",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "6e5cc24269ba7cf4ebfdf5bb8062990d284cd999b1d8462e36c55d28713910f2",
    "targetAncestry": [
      "Team Communication Protocol V1",
      "10. Coding-Domain Workflow Step Operations",
      "10.2 Exploring"
    ]
  }
}
```

## Entry rationale-192

```json
{
  "entryId": "rationale-192",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_a6f71d465ebccd696428b94ff6f664af",
  "before": "The frozen primitive is still byte-identical at docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-46; only its owning heading ancestry was corrected in 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The move/carriage decision is unchanged. Heading/context changes invalidate the prior approval even when the primitive text digest is equal. The current section and its specific code evidence in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json are pending independent truth review.",
  "after": "Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md:267-267#unheaded-block-46 (current lines); unit SHA256 14807360bce011d160261d7194fbcc2cf445f6a0722f072d50101af54d78d3b9.\nTarget: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md:292-292#unheaded-block-49 (current lines); unit SHA256 14807360bce011d160261d7194fbcc2cf445f6a0722f072d50101af54d78d3b9.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 14807360bce011d160261d7194fbcc2cf445f6a0722f072d50101af54d78d3b9 at 865ad66bebcc4748341e676bdc5b53a453ce1556.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-46 under docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-49; source context \"Team Communication Protocol V1 / 10. Coding-Domain Stage Protocols / 10.3 Planning\", target context \"Team Communication Protocol V1 / 10. Coding-Domain Workflow Step Operations / 10.3 Planning\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 191,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_a6f71d465ebccd696428b94ff6f664af",
    "sourceUnitDigest": "14807360bce011d160261d7194fbcc2cf445f6a0722f072d50101af54d78d3b9",
    "claimKind": "contract",
    "disposition": "move",
    "rationale": "Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md:267-267#unheaded-block-46 (current lines); unit SHA256 14807360bce011d160261d7194fbcc2cf445f6a0722f072d50101af54d78d3b9.\nTarget: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md:292-292#unheaded-block-49 (current lines); unit SHA256 14807360bce011d160261d7194fbcc2cf445f6a0722f072d50101af54d78d3b9.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 14807360bce011d160261d7194fbcc2cf445f6a0722f072d50101af54d78d3b9 at 865ad66bebcc4748341e676bdc5b53a453ce1556.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-46 under docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-49; source context \"Team Communication Protocol V1 / 10. Coding-Domain Stage Protocols / 10.3 Planning\", target context \"Team Communication Protocol V1 / 10. Coding-Domain Workflow Step Operations / 10.3 Planning\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md",
    "targetAnchor": "unheaded-block-49",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "14807360bce011d160261d7194fbcc2cf445f6a0722f072d50101af54d78d3b9",
    "targetAncestry": [
      "Team Communication Protocol V1",
      "10. Coding-Domain Workflow Step Operations",
      "10.3 Planning"
    ]
  }
}
```

## Entry rationale-193

```json
{
  "entryId": "rationale-193",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_6b4789439adfb6eb3b05c85b7ed8f7e0",
  "before": "The frozen primitive is still byte-identical at docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-47; only its owning heading ancestry was corrected in 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The move/carriage decision is unchanged. Heading/context changes invalidate the prior approval even when the primitive text digest is equal. The current section and its specific code evidence in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json are pending independent truth review.",
  "after": "Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md:269-270#unheaded-block-47 (current lines); unit SHA256 f40aa8cbca5552bcf674388b44a555d1c431f1abab5c218961744a0c77968db0.\nTarget: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md:294-295#unheaded-block-50 (current lines); unit SHA256 f40aa8cbca5552bcf674388b44a555d1c431f1abab5c218961744a0c77968db0.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest f40aa8cbca5552bcf674388b44a555d1c431f1abab5c218961744a0c77968db0 at 865ad66bebcc4748341e676bdc5b53a453ce1556.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-47 under docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-50; source context \"Team Communication Protocol V1 / 10. Coding-Domain Stage Protocols / 10.3 Planning\", target context \"Team Communication Protocol V1 / 10. Coding-Domain Workflow Step Operations / 10.3 Planning\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 192,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_6b4789439adfb6eb3b05c85b7ed8f7e0",
    "sourceUnitDigest": "f40aa8cbca5552bcf674388b44a555d1c431f1abab5c218961744a0c77968db0",
    "claimKind": "contract",
    "disposition": "move",
    "rationale": "Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md:269-270#unheaded-block-47 (current lines); unit SHA256 f40aa8cbca5552bcf674388b44a555d1c431f1abab5c218961744a0c77968db0.\nTarget: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md:294-295#unheaded-block-50 (current lines); unit SHA256 f40aa8cbca5552bcf674388b44a555d1c431f1abab5c218961744a0c77968db0.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest f40aa8cbca5552bcf674388b44a555d1c431f1abab5c218961744a0c77968db0 at 865ad66bebcc4748341e676bdc5b53a453ce1556.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-47 under docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-50; source context \"Team Communication Protocol V1 / 10. Coding-Domain Stage Protocols / 10.3 Planning\", target context \"Team Communication Protocol V1 / 10. Coding-Domain Workflow Step Operations / 10.3 Planning\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md",
    "targetAnchor": "unheaded-block-50",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "f40aa8cbca5552bcf674388b44a555d1c431f1abab5c218961744a0c77968db0",
    "targetAncestry": [
      "Team Communication Protocol V1",
      "10. Coding-Domain Workflow Step Operations",
      "10.3 Planning"
    ]
  }
}
```

## Entry rationale-194

```json
{
  "entryId": "rationale-194",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_491f40d6df7f19683306f82f98695e8e",
  "before": "The current successor at docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#103-planning supersedes the stale current-state claim shown at docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-48 before 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The original frozen source remains conserved by the accepted carriage and its dated complete historical carrier; this is a truth correction, not a new move or retirement. The section-specific code/CLI evidence is recorded in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json. This successor is pending independent truth review, with no inherited approval.",
  "after": "Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md:272-273#unheaded-block-48 (current lines); unit SHA256 65d8bf9a4c4dda65972648dcc3f44641abb8680b909df0e588967a43d489b362.\nTarget: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md:290-290#103-planning (current lines); unit SHA256 286da397570ef708e22713d69313855865d24e617ca25730cefd92ce2d67eea1.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 286da397570ef708e22713d69313855865d24e617ca25730cefd92ce2d67eea1 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 48\" → \"10.3 Planning\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-48 under docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#103-planning; source context \"Team Communication Protocol V1 / 10. Coding-Domain Stage Protocols / 10.3 Planning\", target context \"Team Communication Protocol V1 / 10. Coding-Domain Workflow Step Operations\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 193,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_491f40d6df7f19683306f82f98695e8e",
    "sourceUnitDigest": "65d8bf9a4c4dda65972648dcc3f44641abb8680b909df0e588967a43d489b362",
    "claimKind": "contract",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md:272-273#unheaded-block-48 (current lines); unit SHA256 65d8bf9a4c4dda65972648dcc3f44641abb8680b909df0e588967a43d489b362.\nTarget: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md:290-290#103-planning (current lines); unit SHA256 286da397570ef708e22713d69313855865d24e617ca25730cefd92ce2d67eea1.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 286da397570ef708e22713d69313855865d24e617ca25730cefd92ce2d67eea1 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 48\" → \"10.3 Planning\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-48 under docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#103-planning; source context \"Team Communication Protocol V1 / 10. Coding-Domain Stage Protocols / 10.3 Planning\", target context \"Team Communication Protocol V1 / 10. Coding-Domain Workflow Step Operations\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md",
    "targetAnchor": "103-planning",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "286da397570ef708e22713d69313855865d24e617ca25730cefd92ce2d67eea1",
    "targetAncestry": [
      "Team Communication Protocol V1",
      "10. Coding-Domain Workflow Step Operations"
    ]
  }
}
```

## Entry rationale-195

```json
{
  "entryId": "rationale-195",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_8b79ab2d01c7ce85912eb9f0a25bf3ea",
  "before": "The frozen primitive is still byte-identical at docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-49; only its owning heading ancestry was corrected in 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The move/carriage decision is unchanged. Heading/context changes invalidate the prior approval even when the primitive text digest is equal. The current section and its specific code evidence in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json are pending independent truth review.",
  "after": "Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md:275-277#unheaded-block-49 (current lines); unit SHA256 999fd62d2ac5bba2d830abbc5aa0e3057ed2a35f727a9ef390bdffe41c60714e.\nTarget: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md:301-303#unheaded-block-52 (current lines); unit SHA256 999fd62d2ac5bba2d830abbc5aa0e3057ed2a35f727a9ef390bdffe41c60714e.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 999fd62d2ac5bba2d830abbc5aa0e3057ed2a35f727a9ef390bdffe41c60714e at 865ad66bebcc4748341e676bdc5b53a453ce1556.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-49 under docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-52; source context \"Team Communication Protocol V1 / 10. Coding-Domain Stage Protocols / 10.3 Planning\", target context \"Team Communication Protocol V1 / 10. Coding-Domain Workflow Step Operations / 10.3 Planning\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 194,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_8b79ab2d01c7ce85912eb9f0a25bf3ea",
    "sourceUnitDigest": "999fd62d2ac5bba2d830abbc5aa0e3057ed2a35f727a9ef390bdffe41c60714e",
    "claimKind": "contract",
    "disposition": "move",
    "rationale": "Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md:275-277#unheaded-block-49 (current lines); unit SHA256 999fd62d2ac5bba2d830abbc5aa0e3057ed2a35f727a9ef390bdffe41c60714e.\nTarget: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md:301-303#unheaded-block-52 (current lines); unit SHA256 999fd62d2ac5bba2d830abbc5aa0e3057ed2a35f727a9ef390bdffe41c60714e.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 999fd62d2ac5bba2d830abbc5aa0e3057ed2a35f727a9ef390bdffe41c60714e at 865ad66bebcc4748341e676bdc5b53a453ce1556.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-49 under docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-52; source context \"Team Communication Protocol V1 / 10. Coding-Domain Stage Protocols / 10.3 Planning\", target context \"Team Communication Protocol V1 / 10. Coding-Domain Workflow Step Operations / 10.3 Planning\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md",
    "targetAnchor": "unheaded-block-52",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "999fd62d2ac5bba2d830abbc5aa0e3057ed2a35f727a9ef390bdffe41c60714e",
    "targetAncestry": [
      "Team Communication Protocol V1",
      "10. Coding-Domain Workflow Step Operations",
      "10.3 Planning"
    ]
  }
}
```

## Entry rationale-196

```json
{
  "entryId": "rationale-196",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_e16b56644d520a0fe0a4cd6b40c2459a",
  "before": "The frozen primitive is still byte-identical at docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-50; only its owning heading ancestry was corrected in 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The move/carriage decision is unchanged. Heading/context changes invalidate the prior approval even when the primitive text digest is equal. The current section and its specific code evidence in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json are pending independent truth review.",
  "after": "Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md:281-281#unheaded-block-50 (current lines); unit SHA256 62f1292eb44e2dd4af3c1ccde7a1a7247ae0febf11739444e8b377e233d40a1b.\nTarget: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md:307-307#unheaded-block-53 (current lines); unit SHA256 62f1292eb44e2dd4af3c1ccde7a1a7247ae0febf11739444e8b377e233d40a1b.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 62f1292eb44e2dd4af3c1ccde7a1a7247ae0febf11739444e8b377e233d40a1b at 865ad66bebcc4748341e676bdc5b53a453ce1556.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-50 under docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-53; source context \"Team Communication Protocol V1 / 10. Coding-Domain Stage Protocols / 10.4 Executing\", target context \"Team Communication Protocol V1 / 10. Coding-Domain Workflow Step Operations / 10.4 Executing\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 195,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_e16b56644d520a0fe0a4cd6b40c2459a",
    "sourceUnitDigest": "62f1292eb44e2dd4af3c1ccde7a1a7247ae0febf11739444e8b377e233d40a1b",
    "claimKind": "contract",
    "disposition": "move",
    "rationale": "Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md:281-281#unheaded-block-50 (current lines); unit SHA256 62f1292eb44e2dd4af3c1ccde7a1a7247ae0febf11739444e8b377e233d40a1b.\nTarget: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md:307-307#unheaded-block-53 (current lines); unit SHA256 62f1292eb44e2dd4af3c1ccde7a1a7247ae0febf11739444e8b377e233d40a1b.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 62f1292eb44e2dd4af3c1ccde7a1a7247ae0febf11739444e8b377e233d40a1b at 865ad66bebcc4748341e676bdc5b53a453ce1556.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-50 under docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-53; source context \"Team Communication Protocol V1 / 10. Coding-Domain Stage Protocols / 10.4 Executing\", target context \"Team Communication Protocol V1 / 10. Coding-Domain Workflow Step Operations / 10.4 Executing\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md",
    "targetAnchor": "unheaded-block-53",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "62f1292eb44e2dd4af3c1ccde7a1a7247ae0febf11739444e8b377e233d40a1b",
    "targetAncestry": [
      "Team Communication Protocol V1",
      "10. Coding-Domain Workflow Step Operations",
      "10.4 Executing"
    ]
  }
}
```

## Entry rationale-197

```json
{
  "entryId": "rationale-197",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_a86887b78fbc23319db13f3bf4816dd8",
  "before": "The frozen primitive is still byte-identical at docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-51; only its owning heading ancestry was corrected in 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The move/carriage decision is unchanged. Heading/context changes invalidate the prior approval even when the primitive text digest is equal. The current section and its specific code evidence in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json are pending independent truth review.",
  "after": "Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md:283-287#unheaded-block-51 (current lines); unit SHA256 3db147178920207776ed26ad024fdfc3cb509d1839901116d0693f322f8f6bca.\nTarget: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md:309-313#unheaded-block-54 (current lines); unit SHA256 3db147178920207776ed26ad024fdfc3cb509d1839901116d0693f322f8f6bca.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 3db147178920207776ed26ad024fdfc3cb509d1839901116d0693f322f8f6bca at 865ad66bebcc4748341e676bdc5b53a453ce1556.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-51 under docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-54; source context \"Team Communication Protocol V1 / 10. Coding-Domain Stage Protocols / 10.4 Executing\", target context \"Team Communication Protocol V1 / 10. Coding-Domain Workflow Step Operations / 10.4 Executing\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 196,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_a86887b78fbc23319db13f3bf4816dd8",
    "sourceUnitDigest": "3db147178920207776ed26ad024fdfc3cb509d1839901116d0693f322f8f6bca",
    "claimKind": "contract",
    "disposition": "move",
    "rationale": "Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md:283-287#unheaded-block-51 (current lines); unit SHA256 3db147178920207776ed26ad024fdfc3cb509d1839901116d0693f322f8f6bca.\nTarget: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md:309-313#unheaded-block-54 (current lines); unit SHA256 3db147178920207776ed26ad024fdfc3cb509d1839901116d0693f322f8f6bca.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 3db147178920207776ed26ad024fdfc3cb509d1839901116d0693f322f8f6bca at 865ad66bebcc4748341e676bdc5b53a453ce1556.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-51 under docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-54; source context \"Team Communication Protocol V1 / 10. Coding-Domain Stage Protocols / 10.4 Executing\", target context \"Team Communication Protocol V1 / 10. Coding-Domain Workflow Step Operations / 10.4 Executing\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md",
    "targetAnchor": "unheaded-block-54",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "3db147178920207776ed26ad024fdfc3cb509d1839901116d0693f322f8f6bca",
    "targetAncestry": [
      "Team Communication Protocol V1",
      "10. Coding-Domain Workflow Step Operations",
      "10.4 Executing"
    ]
  }
}
```

## Entry rationale-198

```json
{
  "entryId": "rationale-198",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_fad0d749adc5ef611ee344c16b7c661e",
  "before": "The frozen primitive is still byte-identical at docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-52; only its owning heading ancestry was corrected in 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The move/carriage decision is unchanged. Heading/context changes invalidate the prior approval even when the primitive text digest is equal. The current section and its specific code evidence in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json are pending independent truth review.",
  "after": "Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md:289-291#unheaded-block-52 (current lines); unit SHA256 3c902b0dddbee64c10302bbe2fa05b431d4ee1236b7c925bf4ba6d10a1859962.\nTarget: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md:315-317#unheaded-block-55 (current lines); unit SHA256 3c902b0dddbee64c10302bbe2fa05b431d4ee1236b7c925bf4ba6d10a1859962.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 3c902b0dddbee64c10302bbe2fa05b431d4ee1236b7c925bf4ba6d10a1859962 at 865ad66bebcc4748341e676bdc5b53a453ce1556.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-52 under docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-55; source context \"Team Communication Protocol V1 / 10. Coding-Domain Stage Protocols / 10.4 Executing\", target context \"Team Communication Protocol V1 / 10. Coding-Domain Workflow Step Operations / 10.4 Executing\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 197,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_fad0d749adc5ef611ee344c16b7c661e",
    "sourceUnitDigest": "3c902b0dddbee64c10302bbe2fa05b431d4ee1236b7c925bf4ba6d10a1859962",
    "claimKind": "contract",
    "disposition": "move",
    "rationale": "Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md:289-291#unheaded-block-52 (current lines); unit SHA256 3c902b0dddbee64c10302bbe2fa05b431d4ee1236b7c925bf4ba6d10a1859962.\nTarget: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md:315-317#unheaded-block-55 (current lines); unit SHA256 3c902b0dddbee64c10302bbe2fa05b431d4ee1236b7c925bf4ba6d10a1859962.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 3c902b0dddbee64c10302bbe2fa05b431d4ee1236b7c925bf4ba6d10a1859962 at 865ad66bebcc4748341e676bdc5b53a453ce1556.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-52 under docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-55; source context \"Team Communication Protocol V1 / 10. Coding-Domain Stage Protocols / 10.4 Executing\", target context \"Team Communication Protocol V1 / 10. Coding-Domain Workflow Step Operations / 10.4 Executing\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md",
    "targetAnchor": "unheaded-block-55",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "3c902b0dddbee64c10302bbe2fa05b431d4ee1236b7c925bf4ba6d10a1859962",
    "targetAncestry": [
      "Team Communication Protocol V1",
      "10. Coding-Domain Workflow Step Operations",
      "10.4 Executing"
    ]
  }
}
```

## Entry rationale-199

```json
{
  "entryId": "rationale-199",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_6e6d4e1d3c3621bc16f442c43894284f",
  "before": "The current successor at docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#11-coordination-operating-harness supersedes the stale current-state claim shown at docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-56 before 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The original frozen source remains conserved by the accepted carriage and its dated complete historical carrier; this is a truth correction, not a new move or retirement. The section-specific code/CLI evidence is recorded in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json. This successor is pending independent truth review, with no inherited approval.",
  "after": "Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md:312-313#unheaded-block-56 (current lines); unit SHA256 b8fff28ad65a1ca9989c3692ee032020c172e1f2e2f5f538da0f73b13482312e.\nTarget: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md:319-319#11-coordination-operating-harness (current lines); unit SHA256 c0d64a86d73bfde404d65fadaa6e35b423daa0450a779678408d3219ab4caef8.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest c0d64a86d73bfde404d65fadaa6e35b423daa0450a779678408d3219ab4caef8 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 1; 1 changed spellings/labels, 0 destination changes; 1 added, 0 removed.\nLink 1: \"none\" (none) → \"coordination-operating-harness.md\" (../playbooks/coordination-operating-harness.md); resolved none → docs/platform/agent-coordination/playbooks/coordination-operating-harness.md.\nHeading depth: not a heading → 2; title \"Unheaded block 56\" → \"11. Coordination Operating Harness\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-56 under docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#11-coordination-operating-harness; source context \"Team Communication Protocol V1 / 11. Coordination Operating Harness\", target context \"Team Communication Protocol V1\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 198,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_6e6d4e1d3c3621bc16f442c43894284f",
    "sourceUnitDigest": "b8fff28ad65a1ca9989c3692ee032020c172e1f2e2f5f538da0f73b13482312e",
    "claimKind": "contract",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md:312-313#unheaded-block-56 (current lines); unit SHA256 b8fff28ad65a1ca9989c3692ee032020c172e1f2e2f5f538da0f73b13482312e.\nTarget: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md:319-319#11-coordination-operating-harness (current lines); unit SHA256 c0d64a86d73bfde404d65fadaa6e35b423daa0450a779678408d3219ab4caef8.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest c0d64a86d73bfde404d65fadaa6e35b423daa0450a779678408d3219ab4caef8 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 1; 1 changed spellings/labels, 0 destination changes; 1 added, 0 removed.\nLink 1: \"none\" (none) → \"coordination-operating-harness.md\" (../playbooks/coordination-operating-harness.md); resolved none → docs/platform/agent-coordination/playbooks/coordination-operating-harness.md.\nHeading depth: not a heading → 2; title \"Unheaded block 56\" → \"11. Coordination Operating Harness\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-56 under docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#11-coordination-operating-harness; source context \"Team Communication Protocol V1 / 11. Coordination Operating Harness\", target context \"Team Communication Protocol V1\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md",
    "targetAnchor": "11-coordination-operating-harness",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "c0d64a86d73bfde404d65fadaa6e35b423daa0450a779678408d3219ab4caef8",
    "targetAncestry": [
      "Team Communication Protocol V1"
    ]
  }
}
```

## Entry rationale-200

```json
{
  "entryId": "rationale-200",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_682c6fe1822ee94db41d02a613e3d451",
  "before": "The current successor at docs/platform/agent-coordination/architecture/dispatch-control-plane.md#flow supersedes the stale current-state claim shown at docs/platform/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-8 before 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The original frozen source remains conserved by the accepted carriage and its dated complete historical carrier; this is a truth correction, not a new move or retirement. The section-specific code/CLI evidence is recorded in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json. This successor is pending independent truth review, with no inherited approval.",
  "after": "Source: docs/architect/agent-coordination/architecture/dispatch-control-plane.md:44-51#unheaded-block-6 (current lines); unit SHA256 ad6b4456e0c1badb32b3d189e5b8a8206e95da6ea7bb204c60ea64e483d34ce2.\nTarget: docs/platform/agent-coordination/architecture/dispatch-control-plane.md:54-54#flow (current lines); unit SHA256 a31d566e09a26dae7ecafe699a9562fb482e8ee23231126e1457f37ce861e0b2.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest a31d566e09a26dae7ecafe699a9562fb482e8ee23231126e1457f37ce861e0b2 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 6\" → \"Flow\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-6 under docs/platform/agent-coordination/architecture/dispatch-control-plane.md#flow; source context \"Dispatch Control Plane / Flow\", target context \"Dispatch Control Plane\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 199,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_682c6fe1822ee94db41d02a613e3d451",
    "sourceUnitDigest": "ad6b4456e0c1badb32b3d189e5b8a8206e95da6ea7bb204c60ea64e483d34ce2",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/architecture/dispatch-control-plane.md:44-51#unheaded-block-6 (current lines); unit SHA256 ad6b4456e0c1badb32b3d189e5b8a8206e95da6ea7bb204c60ea64e483d34ce2.\nTarget: docs/platform/agent-coordination/architecture/dispatch-control-plane.md:54-54#flow (current lines); unit SHA256 a31d566e09a26dae7ecafe699a9562fb482e8ee23231126e1457f37ce861e0b2.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest a31d566e09a26dae7ecafe699a9562fb482e8ee23231126e1457f37ce861e0b2 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 6\" → \"Flow\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-6 under docs/platform/agent-coordination/architecture/dispatch-control-plane.md#flow; source context \"Dispatch Control Plane / Flow\", target context \"Dispatch Control Plane\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/architecture/dispatch-control-plane.md",
    "targetAnchor": "flow",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "a31d566e09a26dae7ecafe699a9562fb482e8ee23231126e1457f37ce861e0b2",
    "targetAncestry": [
      "Dispatch Control Plane"
    ]
  }
}
```

## Entry rationale-201

```json
{
  "entryId": "rationale-201",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_976c9258480b6a6549a86ce7f22c593e",
  "before": "The current successor at docs/platform/agent-coordination/architecture/dispatch-control-plane.md#contracts supersedes the stale current-state claim shown at docs/platform/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-14 before 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The original frozen source remains conserved by the accepted carriage and its dated complete historical carrier; this is a truth correction, not a new move or retirement. The section-specific code/CLI evidence is recorded in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json. This successor is pending independent truth review, with no inherited approval.",
  "after": "Source: docs/architect/agent-coordination/architecture/dispatch-control-plane.md:97-100#unheaded-block-12 (current lines); unit SHA256 79cd1e06fa13094d10975bb96137f73a4cf5ad8205777c9ce7e6cb83e162d515.\nTarget: docs/platform/agent-coordination/architecture/dispatch-control-plane.md:115-115#contracts (current lines); unit SHA256 bbe2a5a5b82a6a3145532c058e0d786e05b3bd13215fdce5b39d9dedf53e6b46.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest bbe2a5a5b82a6a3145532c058e0d786e05b3bd13215fdce5b39d9dedf53e6b46 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 12\" → \"Contracts\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-12 under docs/platform/agent-coordination/architecture/dispatch-control-plane.md#contracts; source context \"Dispatch Control Plane / Contracts\", target context \"Dispatch Control Plane\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 200,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_976c9258480b6a6549a86ce7f22c593e",
    "sourceUnitDigest": "79cd1e06fa13094d10975bb96137f73a4cf5ad8205777c9ce7e6cb83e162d515",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/architecture/dispatch-control-plane.md:97-100#unheaded-block-12 (current lines); unit SHA256 79cd1e06fa13094d10975bb96137f73a4cf5ad8205777c9ce7e6cb83e162d515.\nTarget: docs/platform/agent-coordination/architecture/dispatch-control-plane.md:115-115#contracts (current lines); unit SHA256 bbe2a5a5b82a6a3145532c058e0d786e05b3bd13215fdce5b39d9dedf53e6b46.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest bbe2a5a5b82a6a3145532c058e0d786e05b3bd13215fdce5b39d9dedf53e6b46 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 12\" → \"Contracts\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-12 under docs/platform/agent-coordination/architecture/dispatch-control-plane.md#contracts; source context \"Dispatch Control Plane / Contracts\", target context \"Dispatch Control Plane\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/architecture/dispatch-control-plane.md",
    "targetAnchor": "contracts",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "bbe2a5a5b82a6a3145532c058e0d786e05b3bd13215fdce5b39d9dedf53e6b46",
    "targetAncestry": [
      "Dispatch Control Plane"
    ]
  }
}
```

## Entry rationale-202

```json
{
  "entryId": "rationale-202",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_88d68c4bcfd5253c805d3f898f3faa4f",
  "before": "The current successor at docs/platform/agent-coordination/architecture/dispatch-control-plane.md#dispatchrequest-outer-core supersedes the stale current-state claim shown at docs/platform/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-15 before 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The original frozen source remains conserved by the accepted carriage and its dated complete historical carrier; this is a truth correction, not a new move or retirement. The section-specific code/CLI evidence is recorded in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json. This successor is pending independent truth review, with no inherited approval.",
  "after": "Source: docs/architect/agent-coordination/architecture/dispatch-control-plane.md:104-124#unheaded-block-13 (current lines); unit SHA256 660379a03ef45ee4294296fa6c6457a0c39aecaa2f43b4a9da3a8428ca859ba4.\nTarget: docs/platform/agent-coordination/architecture/dispatch-control-plane.md:122-122#dispatchrequest-outer-core (current lines); unit SHA256 c9e22dfa3e05e994e43bfa65ca96600406295aa8182af265e948fedce72ff9d3.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest c9e22dfa3e05e994e43bfa65ca96600406295aa8182af265e948fedce72ff9d3 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 13\" → \"DispatchRequest (outer → core)\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-13 under docs/platform/agent-coordination/architecture/dispatch-control-plane.md#dispatchrequest-outer-core; source context \"Dispatch Control Plane / Contracts / DispatchRequest (outer → core)\", target context \"Dispatch Control Plane / Contracts\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 201,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_88d68c4bcfd5253c805d3f898f3faa4f",
    "sourceUnitDigest": "660379a03ef45ee4294296fa6c6457a0c39aecaa2f43b4a9da3a8428ca859ba4",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/architecture/dispatch-control-plane.md:104-124#unheaded-block-13 (current lines); unit SHA256 660379a03ef45ee4294296fa6c6457a0c39aecaa2f43b4a9da3a8428ca859ba4.\nTarget: docs/platform/agent-coordination/architecture/dispatch-control-plane.md:122-122#dispatchrequest-outer-core (current lines); unit SHA256 c9e22dfa3e05e994e43bfa65ca96600406295aa8182af265e948fedce72ff9d3.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest c9e22dfa3e05e994e43bfa65ca96600406295aa8182af265e948fedce72ff9d3 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 13\" → \"DispatchRequest (outer → core)\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-13 under docs/platform/agent-coordination/architecture/dispatch-control-plane.md#dispatchrequest-outer-core; source context \"Dispatch Control Plane / Contracts / DispatchRequest (outer → core)\", target context \"Dispatch Control Plane / Contracts\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/architecture/dispatch-control-plane.md",
    "targetAnchor": "dispatchrequest-outer-core",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "c9e22dfa3e05e994e43bfa65ca96600406295aa8182af265e948fedce72ff9d3",
    "targetAncestry": [
      "Dispatch Control Plane",
      "Contracts"
    ]
  }
}
```

## Entry rationale-203

```json
{
  "entryId": "rationale-203",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_f90925846cf63161875b4657557bdf4f",
  "before": "The current successor at docs/platform/agent-coordination/architecture/dispatch-control-plane.md#dispatchrequest-outer-core supersedes the stale current-state claim shown at docs/platform/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-17 before 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The original frozen source remains conserved by the accepted carriage and its dated complete historical carrier; this is a truth correction, not a new move or retirement. The section-specific code/CLI evidence is recorded in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json. This successor is pending independent truth review, with no inherited approval.",
  "after": "Source: docs/architect/agent-coordination/architecture/dispatch-control-plane.md:140-148#unheaded-block-15 (current lines); unit SHA256 a5f0746c52639a115b4cc3c46edf9c430b1c809223e2bb7e7d64e4d8081a0f21.\nTarget: docs/platform/agent-coordination/architecture/dispatch-control-plane.md:122-122#dispatchrequest-outer-core (current lines); unit SHA256 c9e22dfa3e05e994e43bfa65ca96600406295aa8182af265e948fedce72ff9d3.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest c9e22dfa3e05e994e43bfa65ca96600406295aa8182af265e948fedce72ff9d3 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 15\" → \"DispatchRequest (outer → core)\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-15 under docs/platform/agent-coordination/architecture/dispatch-control-plane.md#dispatchrequest-outer-core; source context \"Dispatch Control Plane / Contracts / DispatchRequest (outer → core)\", target context \"Dispatch Control Plane / Contracts\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 202,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_f90925846cf63161875b4657557bdf4f",
    "sourceUnitDigest": "a5f0746c52639a115b4cc3c46edf9c430b1c809223e2bb7e7d64e4d8081a0f21",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/architecture/dispatch-control-plane.md:140-148#unheaded-block-15 (current lines); unit SHA256 a5f0746c52639a115b4cc3c46edf9c430b1c809223e2bb7e7d64e4d8081a0f21.\nTarget: docs/platform/agent-coordination/architecture/dispatch-control-plane.md:122-122#dispatchrequest-outer-core (current lines); unit SHA256 c9e22dfa3e05e994e43bfa65ca96600406295aa8182af265e948fedce72ff9d3.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest c9e22dfa3e05e994e43bfa65ca96600406295aa8182af265e948fedce72ff9d3 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 15\" → \"DispatchRequest (outer → core)\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-15 under docs/platform/agent-coordination/architecture/dispatch-control-plane.md#dispatchrequest-outer-core; source context \"Dispatch Control Plane / Contracts / DispatchRequest (outer → core)\", target context \"Dispatch Control Plane / Contracts\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/architecture/dispatch-control-plane.md",
    "targetAnchor": "dispatchrequest-outer-core",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "c9e22dfa3e05e994e43bfa65ca96600406295aa8182af265e948fedce72ff9d3",
    "targetAncestry": [
      "Dispatch Control Plane",
      "Contracts"
    ]
  }
}
```

## Entry rationale-204

```json
{
  "entryId": "rationale-204",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_6d348715644da34b65032ea70555a2c5",
  "before": "The current successor at docs/platform/agent-coordination/architecture/dispatch-control-plane.md#policypatch supersedes the stale current-state claim shown at docs/platform/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-18 before 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The original frozen source remains conserved by the accepted carriage and its dated complete historical carrier; this is a truth correction, not a new move or retirement. The section-specific code/CLI evidence is recorded in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json. This successor is pending independent truth review, with no inherited approval.",
  "after": "Source: docs/architect/agent-coordination/architecture/dispatch-control-plane.md:158-168#unheaded-block-17 (current lines); unit SHA256 250ec2e00a19da1f8b1d5e457e45fc375c7d2cd648dc3ee53d9b08ff1e6716e2.\nTarget: docs/platform/agent-coordination/architecture/dispatch-control-plane.md:168-168#policypatch (current lines); unit SHA256 36695f40c8dcd1f98944f0e05e72217b0e13d6bbc80aa925e4c8923448349989.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 36695f40c8dcd1f98944f0e05e72217b0e13d6bbc80aa925e4c8923448349989 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 17\" → \"PolicyPatch\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-17 under docs/platform/agent-coordination/architecture/dispatch-control-plane.md#policypatch; source context \"Dispatch Control Plane / Contracts / PolicyPatch\", target context \"Dispatch Control Plane / Contracts\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 203,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_6d348715644da34b65032ea70555a2c5",
    "sourceUnitDigest": "250ec2e00a19da1f8b1d5e457e45fc375c7d2cd648dc3ee53d9b08ff1e6716e2",
    "claimKind": "contract",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/architecture/dispatch-control-plane.md:158-168#unheaded-block-17 (current lines); unit SHA256 250ec2e00a19da1f8b1d5e457e45fc375c7d2cd648dc3ee53d9b08ff1e6716e2.\nTarget: docs/platform/agent-coordination/architecture/dispatch-control-plane.md:168-168#policypatch (current lines); unit SHA256 36695f40c8dcd1f98944f0e05e72217b0e13d6bbc80aa925e4c8923448349989.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 36695f40c8dcd1f98944f0e05e72217b0e13d6bbc80aa925e4c8923448349989 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 17\" → \"PolicyPatch\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-17 under docs/platform/agent-coordination/architecture/dispatch-control-plane.md#policypatch; source context \"Dispatch Control Plane / Contracts / PolicyPatch\", target context \"Dispatch Control Plane / Contracts\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/architecture/dispatch-control-plane.md",
    "targetAnchor": "policypatch",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "36695f40c8dcd1f98944f0e05e72217b0e13d6bbc80aa925e4c8923448349989",
    "targetAncestry": [
      "Dispatch Control Plane",
      "Contracts"
    ]
  }
}
```

## Entry rationale-205

```json
{
  "entryId": "rationale-205",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_1da19454b145196be8e6880ee621fc16",
  "before": "The current successor at docs/platform/agent-coordination/architecture/dispatch-control-plane.md#policypatch supersedes the stale current-state claim shown at docs/platform/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-19 before 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The original frozen source remains conserved by the accepted carriage and its dated complete historical carrier; this is a truth correction, not a new move or retirement. The section-specific code/CLI evidence is recorded in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json. This successor is pending independent truth review, with no inherited approval.",
  "after": "Source: docs/architect/agent-coordination/architecture/dispatch-control-plane.md:170-170#unheaded-block-18 (current lines); unit SHA256 fcd98567b2d5218f8f72e677335a5a8a73ee4ed19bfe73947a05b59b9a80fcce.\nTarget: docs/platform/agent-coordination/architecture/dispatch-control-plane.md:168-168#policypatch (current lines); unit SHA256 36695f40c8dcd1f98944f0e05e72217b0e13d6bbc80aa925e4c8923448349989.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 36695f40c8dcd1f98944f0e05e72217b0e13d6bbc80aa925e4c8923448349989 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 18\" → \"PolicyPatch\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-18 under docs/platform/agent-coordination/architecture/dispatch-control-plane.md#policypatch; source context \"Dispatch Control Plane / Contracts / PolicyPatch\", target context \"Dispatch Control Plane / Contracts\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 204,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_1da19454b145196be8e6880ee621fc16",
    "sourceUnitDigest": "fcd98567b2d5218f8f72e677335a5a8a73ee4ed19bfe73947a05b59b9a80fcce",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/architecture/dispatch-control-plane.md:170-170#unheaded-block-18 (current lines); unit SHA256 fcd98567b2d5218f8f72e677335a5a8a73ee4ed19bfe73947a05b59b9a80fcce.\nTarget: docs/platform/agent-coordination/architecture/dispatch-control-plane.md:168-168#policypatch (current lines); unit SHA256 36695f40c8dcd1f98944f0e05e72217b0e13d6bbc80aa925e4c8923448349989.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 36695f40c8dcd1f98944f0e05e72217b0e13d6bbc80aa925e4c8923448349989 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 18\" → \"PolicyPatch\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-18 under docs/platform/agent-coordination/architecture/dispatch-control-plane.md#policypatch; source context \"Dispatch Control Plane / Contracts / PolicyPatch\", target context \"Dispatch Control Plane / Contracts\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/architecture/dispatch-control-plane.md",
    "targetAnchor": "policypatch",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "36695f40c8dcd1f98944f0e05e72217b0e13d6bbc80aa925e4c8923448349989",
    "targetAncestry": [
      "Dispatch Control Plane",
      "Contracts"
    ]
  }
}
```

## Entry rationale-206

```json
{
  "entryId": "rationale-206",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_0548f4c5eada0527c365b6d10bc62b65",
  "before": "The current successor at docs/platform/agent-coordination/architecture/dispatch-control-plane.md#policypatch supersedes the stale current-state claim shown at docs/platform/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-20 before 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The original frozen source remains conserved by the accepted carriage and its dated complete historical carrier; this is a truth correction, not a new move or retirement. The section-specific code/CLI evidence is recorded in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json. This successor is pending independent truth review, with no inherited approval.",
  "after": "Source: docs/architect/agent-coordination/architecture/dispatch-control-plane.md:172-181#unheaded-block-19 (current lines); unit SHA256 3583305de78b7cdc72b5867540aaa0a18573358477c8db746e6c36ef1aa3d05d.\nTarget: docs/platform/agent-coordination/architecture/dispatch-control-plane.md:168-168#policypatch (current lines); unit SHA256 36695f40c8dcd1f98944f0e05e72217b0e13d6bbc80aa925e4c8923448349989.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 36695f40c8dcd1f98944f0e05e72217b0e13d6bbc80aa925e4c8923448349989 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 19\" → \"PolicyPatch\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-19 under docs/platform/agent-coordination/architecture/dispatch-control-plane.md#policypatch; source context \"Dispatch Control Plane / Contracts / PolicyPatch\", target context \"Dispatch Control Plane / Contracts\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 205,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_0548f4c5eada0527c365b6d10bc62b65",
    "sourceUnitDigest": "3583305de78b7cdc72b5867540aaa0a18573358477c8db746e6c36ef1aa3d05d",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/architecture/dispatch-control-plane.md:172-181#unheaded-block-19 (current lines); unit SHA256 3583305de78b7cdc72b5867540aaa0a18573358477c8db746e6c36ef1aa3d05d.\nTarget: docs/platform/agent-coordination/architecture/dispatch-control-plane.md:168-168#policypatch (current lines); unit SHA256 36695f40c8dcd1f98944f0e05e72217b0e13d6bbc80aa925e4c8923448349989.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 36695f40c8dcd1f98944f0e05e72217b0e13d6bbc80aa925e4c8923448349989 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 19\" → \"PolicyPatch\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-19 under docs/platform/agent-coordination/architecture/dispatch-control-plane.md#policypatch; source context \"Dispatch Control Plane / Contracts / PolicyPatch\", target context \"Dispatch Control Plane / Contracts\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/architecture/dispatch-control-plane.md",
    "targetAnchor": "policypatch",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "36695f40c8dcd1f98944f0e05e72217b0e13d6bbc80aa925e4c8923448349989",
    "targetAncestry": [
      "Dispatch Control Plane",
      "Contracts"
    ]
  }
}
```

## Entry rationale-207

```json
{
  "entryId": "rationale-207",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_6ac14c8dfb68eb863ccd6513576a1b9a",
  "before": "The current successor at docs/platform/agent-coordination/architecture/dispatch-control-plane.md#dispatchplan-core-runtime supersedes the stale current-state claim shown at docs/platform/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-23 before 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The original frozen source remains conserved by the accepted carriage and its dated complete historical carrier; this is a truth correction, not a new move or retirement. The section-specific code/CLI evidence is recorded in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json. This successor is pending independent truth review, with no inherited approval.",
  "after": "Source: docs/architect/agent-coordination/architecture/dispatch-control-plane.md:212-219#unheaded-block-23 (current lines); unit SHA256 63a4fbd17351a5c00639252f11e139f33cbb60bbef50e0975fc2336029db422a.\nTarget: docs/platform/agent-coordination/architecture/dispatch-control-plane.md:202-202#dispatchplan-core-runtime (current lines); unit SHA256 a45ae72abffaf471700451bb238774e045b81bbd3818512a9709af2b54c02567.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest a45ae72abffaf471700451bb238774e045b81bbd3818512a9709af2b54c02567 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 23\" → \"DispatchPlan (core → runtime)\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-23 under docs/platform/agent-coordination/architecture/dispatch-control-plane.md#dispatchplan-core-runtime; source context \"Dispatch Control Plane / Contracts / DispatchPlan (core → runtime)\", target context \"Dispatch Control Plane / Contracts\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 206,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_6ac14c8dfb68eb863ccd6513576a1b9a",
    "sourceUnitDigest": "63a4fbd17351a5c00639252f11e139f33cbb60bbef50e0975fc2336029db422a",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/architecture/dispatch-control-plane.md:212-219#unheaded-block-23 (current lines); unit SHA256 63a4fbd17351a5c00639252f11e139f33cbb60bbef50e0975fc2336029db422a.\nTarget: docs/platform/agent-coordination/architecture/dispatch-control-plane.md:202-202#dispatchplan-core-runtime (current lines); unit SHA256 a45ae72abffaf471700451bb238774e045b81bbd3818512a9709af2b54c02567.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest a45ae72abffaf471700451bb238774e045b81bbd3818512a9709af2b54c02567 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 23\" → \"DispatchPlan (core → runtime)\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-23 under docs/platform/agent-coordination/architecture/dispatch-control-plane.md#dispatchplan-core-runtime; source context \"Dispatch Control Plane / Contracts / DispatchPlan (core → runtime)\", target context \"Dispatch Control Plane / Contracts\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/architecture/dispatch-control-plane.md",
    "targetAnchor": "dispatchplan-core-runtime",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "a45ae72abffaf471700451bb238774e045b81bbd3818512a9709af2b54c02567",
    "targetAncestry": [
      "Dispatch Control Plane",
      "Contracts"
    ]
  }
}
```

## Entry rationale-208

```json
{
  "entryId": "rationale-208",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_317581a1ee7c63342e2015d6ef43ec99",
  "before": "The current successor at docs/platform/agent-coordination/architecture/dispatch-control-plane.md#dispatchplan-core-runtime supersedes the stale current-state claim shown at docs/platform/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-24 before 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The original frozen source remains conserved by the accepted carriage and its dated complete historical carrier; this is a truth correction, not a new move or retirement. The section-specific code/CLI evidence is recorded in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json. This successor is pending independent truth review, with no inherited approval.",
  "after": "Source: docs/architect/agent-coordination/architecture/dispatch-control-plane.md:221-233#unheaded-block-24 (current lines); unit SHA256 2686eec825341d5a13dae16a78affdf85f050be78ac38a4b3fc62c3d39001171.\nTarget: docs/platform/agent-coordination/architecture/dispatch-control-plane.md:202-202#dispatchplan-core-runtime (current lines); unit SHA256 a45ae72abffaf471700451bb238774e045b81bbd3818512a9709af2b54c02567.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest a45ae72abffaf471700451bb238774e045b81bbd3818512a9709af2b54c02567 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 24\" → \"DispatchPlan (core → runtime)\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-24 under docs/platform/agent-coordination/architecture/dispatch-control-plane.md#dispatchplan-core-runtime; source context \"Dispatch Control Plane / Contracts / DispatchPlan (core → runtime)\", target context \"Dispatch Control Plane / Contracts\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 207,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_317581a1ee7c63342e2015d6ef43ec99",
    "sourceUnitDigest": "2686eec825341d5a13dae16a78affdf85f050be78ac38a4b3fc62c3d39001171",
    "claimKind": "decision",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/architecture/dispatch-control-plane.md:221-233#unheaded-block-24 (current lines); unit SHA256 2686eec825341d5a13dae16a78affdf85f050be78ac38a4b3fc62c3d39001171.\nTarget: docs/platform/agent-coordination/architecture/dispatch-control-plane.md:202-202#dispatchplan-core-runtime (current lines); unit SHA256 a45ae72abffaf471700451bb238774e045b81bbd3818512a9709af2b54c02567.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest a45ae72abffaf471700451bb238774e045b81bbd3818512a9709af2b54c02567 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 24\" → \"DispatchPlan (core → runtime)\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-24 under docs/platform/agent-coordination/architecture/dispatch-control-plane.md#dispatchplan-core-runtime; source context \"Dispatch Control Plane / Contracts / DispatchPlan (core → runtime)\", target context \"Dispatch Control Plane / Contracts\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/architecture/dispatch-control-plane.md",
    "targetAnchor": "dispatchplan-core-runtime",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "a45ae72abffaf471700451bb238774e045b81bbd3818512a9709af2b54c02567",
    "targetAncestry": [
      "Dispatch Control Plane",
      "Contracts"
    ]
  }
}
```

## Entry rationale-209

```json
{
  "entryId": "rationale-209",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_3eb1d76cbee05b14310c7bf9188db06d",
  "before": "The current successor at docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#1-responsibility-and-inputs supersedes the stale current-state claim shown at docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-5 before 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The original frozen source remains conserved by the accepted carriage and its dated complete historical carrier; this is a truth correction, not a new move or retirement. The section-specific code/CLI evidence is recorded in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json. This successor is pending independent truth review, with no inherited approval.",
  "after": "Source: docs/architect/agent-coordination/architecture/executor-health-and-fallback.md:20-28#unheaded-block-4 (current lines); unit SHA256 554e6357c8a41fbf5f65e9ff2e5534e6dfb594c24c27a9e55c229e8081c5ca2c.\nTarget: docs/platform/agent-coordination/architecture/executor-health-and-fallback.md:39-39#1-responsibility-and-inputs (current lines); unit SHA256 f97c6b9e2271690437b10e8b0557b6c0afc97b598e3dcf1e527f30d8e4129ac0.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest f97c6b9e2271690437b10e8b0557b6c0afc97b598e3dcf1e527f30d8e4129ac0 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 4\" → \"1. Responsibility And Inputs\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-4 under docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#1-responsibility-and-inputs; source context \"Executor Fallback And Effect Eligibility / 1. Responsibility And Inputs\", target context \"Executor Fallback And Effect Eligibility\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 208,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_3eb1d76cbee05b14310c7bf9188db06d",
    "sourceUnitDigest": "554e6357c8a41fbf5f65e9ff2e5534e6dfb594c24c27a9e55c229e8081c5ca2c",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/architecture/executor-health-and-fallback.md:20-28#unheaded-block-4 (current lines); unit SHA256 554e6357c8a41fbf5f65e9ff2e5534e6dfb594c24c27a9e55c229e8081c5ca2c.\nTarget: docs/platform/agent-coordination/architecture/executor-health-and-fallback.md:39-39#1-responsibility-and-inputs (current lines); unit SHA256 f97c6b9e2271690437b10e8b0557b6c0afc97b598e3dcf1e527f30d8e4129ac0.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest f97c6b9e2271690437b10e8b0557b6c0afc97b598e3dcf1e527f30d8e4129ac0 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 4\" → \"1. Responsibility And Inputs\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-4 under docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#1-responsibility-and-inputs; source context \"Executor Fallback And Effect Eligibility / 1. Responsibility And Inputs\", target context \"Executor Fallback And Effect Eligibility\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/architecture/executor-health-and-fallback.md",
    "targetAnchor": "1-responsibility-and-inputs",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "f97c6b9e2271690437b10e8b0557b6c0afc97b598e3dcf1e527f30d8e4129ac0",
    "targetAncestry": [
      "Executor Fallback And Effect Eligibility"
    ]
  }
}
```

## Entry rationale-210

```json
{
  "entryId": "rationale-210",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_d8053a7159526a29d5e92f20793b07d5",
  "before": "The current successor at docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#3-coarse-matrix-mapping supersedes the stale current-state claim shown at docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-13 before 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The original frozen source remains conserved by the accepted carriage and its dated complete historical carrier; this is a truth correction, not a new move or retirement. The section-specific code/CLI evidence is recorded in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json. This successor is pending independent truth review, with no inherited approval.",
  "after": "Source: docs/architect/agent-coordination/architecture/executor-health-and-fallback.md:88-93#unheaded-block-12 (current lines); unit SHA256 d53bfd97c7c9bb4662d383886334ce53d28e853d76e8d7c50d0913a2ed431269.\nTarget: docs/platform/agent-coordination/architecture/executor-health-and-fallback.md:96-96#3-coarse-matrix-mapping (current lines); unit SHA256 4f10d6082daebad81a53b4f06c9d44fa3187f4d894791d39783017ff77e5fcbf.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 4f10d6082daebad81a53b4f06c9d44fa3187f4d894791d39783017ff77e5fcbf at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 12\" → \"3. Coarse Matrix Mapping\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-12 under docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#3-coarse-matrix-mapping; source context \"Executor Fallback And Effect Eligibility / 3. Coarse Matrix Mapping\", target context \"Executor Fallback And Effect Eligibility\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 209,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_d8053a7159526a29d5e92f20793b07d5",
    "sourceUnitDigest": "d53bfd97c7c9bb4662d383886334ce53d28e853d76e8d7c50d0913a2ed431269",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/architecture/executor-health-and-fallback.md:88-93#unheaded-block-12 (current lines); unit SHA256 d53bfd97c7c9bb4662d383886334ce53d28e853d76e8d7c50d0913a2ed431269.\nTarget: docs/platform/agent-coordination/architecture/executor-health-and-fallback.md:96-96#3-coarse-matrix-mapping (current lines); unit SHA256 4f10d6082daebad81a53b4f06c9d44fa3187f4d894791d39783017ff77e5fcbf.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 4f10d6082daebad81a53b4f06c9d44fa3187f4d894791d39783017ff77e5fcbf at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 12\" → \"3. Coarse Matrix Mapping\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-12 under docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#3-coarse-matrix-mapping; source context \"Executor Fallback And Effect Eligibility / 3. Coarse Matrix Mapping\", target context \"Executor Fallback And Effect Eligibility\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/architecture/executor-health-and-fallback.md",
    "targetAnchor": "3-coarse-matrix-mapping",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "4f10d6082daebad81a53b4f06c9d44fa3187f4d894791d39783017ff77e5fcbf",
    "targetAncestry": [
      "Executor Fallback And Effect Eligibility"
    ]
  }
}
```

## Entry rationale-211

```json
{
  "entryId": "rationale-211",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_e373744fe1410b7c47de06bd6a90b6be",
  "before": "The current successor at docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#4-one-attempt-history-explicit-caps supersedes the stale current-state claim shown at docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-14 before 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The original frozen source remains conserved by the accepted carriage and its dated complete historical carrier; this is a truth correction, not a new move or retirement. The section-specific code/CLI evidence is recorded in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json. This successor is pending independent truth review, with no inherited approval.",
  "after": "Source: docs/architect/agent-coordination/architecture/executor-health-and-fallback.md:97-100#unheaded-block-13 (current lines); unit SHA256 4f5b345592d0f6896a7498c30cf5ad5c2646819c56a4c14073fea0f4e649b9a6.\nTarget: docs/platform/agent-coordination/architecture/executor-health-and-fallback.md:122-122#4-one-attempt-history-explicit-caps (current lines); unit SHA256 2f23cfb828da8d49550ee62f606921a1b0c87b974326553ee6c7afb59dff9fbc.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 2f23cfb828da8d49550ee62f606921a1b0c87b974326553ee6c7afb59dff9fbc at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 13\" → \"4. One Attempt History, Explicit Caps\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-13 under docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#4-one-attempt-history-explicit-caps; source context \"Executor Fallback And Effect Eligibility / 4. One Attempt History, Explicit Caps\", target context \"Executor Fallback And Effect Eligibility\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 210,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_e373744fe1410b7c47de06bd6a90b6be",
    "sourceUnitDigest": "4f5b345592d0f6896a7498c30cf5ad5c2646819c56a4c14073fea0f4e649b9a6",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/architecture/executor-health-and-fallback.md:97-100#unheaded-block-13 (current lines); unit SHA256 4f5b345592d0f6896a7498c30cf5ad5c2646819c56a4c14073fea0f4e649b9a6.\nTarget: docs/platform/agent-coordination/architecture/executor-health-and-fallback.md:122-122#4-one-attempt-history-explicit-caps (current lines); unit SHA256 2f23cfb828da8d49550ee62f606921a1b0c87b974326553ee6c7afb59dff9fbc.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 2f23cfb828da8d49550ee62f606921a1b0c87b974326553ee6c7afb59dff9fbc at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 13\" → \"4. One Attempt History, Explicit Caps\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-13 under docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#4-one-attempt-history-explicit-caps; source context \"Executor Fallback And Effect Eligibility / 4. One Attempt History, Explicit Caps\", target context \"Executor Fallback And Effect Eligibility\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/architecture/executor-health-and-fallback.md",
    "targetAnchor": "4-one-attempt-history-explicit-caps",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "2f23cfb828da8d49550ee62f606921a1b0c87b974326553ee6c7afb59dff9fbc",
    "targetAncestry": [
      "Executor Fallback And Effect Eligibility"
    ]
  }
}
```

## Entry rationale-212

```json
{
  "entryId": "rationale-212",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_f5bffd709d33a00b0aa159f55fbb1a8b",
  "before": "The current successor at docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#4-one-attempt-history-explicit-caps supersedes the stale current-state claim shown at docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-15 before 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The original frozen source remains conserved by the accepted carriage and its dated complete historical carrier; this is a truth correction, not a new move or retirement. The section-specific code/CLI evidence is recorded in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json. This successor is pending independent truth review, with no inherited approval.",
  "after": "Source: docs/architect/agent-coordination/architecture/executor-health-and-fallback.md:102-105#unheaded-block-14 (current lines); unit SHA256 c06867e1d5ad0eafdb6e2cc1dbbf368b1d229e4604c31ea33eb287de111198a3.\nTarget: docs/platform/agent-coordination/architecture/executor-health-and-fallback.md:122-122#4-one-attempt-history-explicit-caps (current lines); unit SHA256 2f23cfb828da8d49550ee62f606921a1b0c87b974326553ee6c7afb59dff9fbc.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 2f23cfb828da8d49550ee62f606921a1b0c87b974326553ee6c7afb59dff9fbc at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 14\" → \"4. One Attempt History, Explicit Caps\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-14 under docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#4-one-attempt-history-explicit-caps; source context \"Executor Fallback And Effect Eligibility / 4. One Attempt History, Explicit Caps\", target context \"Executor Fallback And Effect Eligibility\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 211,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_f5bffd709d33a00b0aa159f55fbb1a8b",
    "sourceUnitDigest": "c06867e1d5ad0eafdb6e2cc1dbbf368b1d229e4604c31ea33eb287de111198a3",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/architecture/executor-health-and-fallback.md:102-105#unheaded-block-14 (current lines); unit SHA256 c06867e1d5ad0eafdb6e2cc1dbbf368b1d229e4604c31ea33eb287de111198a3.\nTarget: docs/platform/agent-coordination/architecture/executor-health-and-fallback.md:122-122#4-one-attempt-history-explicit-caps (current lines); unit SHA256 2f23cfb828da8d49550ee62f606921a1b0c87b974326553ee6c7afb59dff9fbc.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 2f23cfb828da8d49550ee62f606921a1b0c87b974326553ee6c7afb59dff9fbc at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 14\" → \"4. One Attempt History, Explicit Caps\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-14 under docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#4-one-attempt-history-explicit-caps; source context \"Executor Fallback And Effect Eligibility / 4. One Attempt History, Explicit Caps\", target context \"Executor Fallback And Effect Eligibility\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/architecture/executor-health-and-fallback.md",
    "targetAnchor": "4-one-attempt-history-explicit-caps",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "2f23cfb828da8d49550ee62f606921a1b0c87b974326553ee6c7afb59dff9fbc",
    "targetAncestry": [
      "Executor Fallback And Effect Eligibility"
    ]
  }
}
```

## Entry rationale-213

```json
{
  "entryId": "rationale-213",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_07dad543c4bb6b7ce874e8466f2a09c6",
  "before": "The current successor at docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#4-one-attempt-history-explicit-caps supersedes the stale current-state claim shown at docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-16 before 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The original frozen source remains conserved by the accepted carriage and its dated complete historical carrier; this is a truth correction, not a new move or retirement. The section-specific code/CLI evidence is recorded in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json. This successor is pending independent truth review, with no inherited approval.",
  "after": "Source: docs/architect/agent-coordination/architecture/executor-health-and-fallback.md:107-115#unheaded-block-15 (current lines); unit SHA256 ceebada3611071e2438d0b4edb36ff1b583f1ab012e449e5891243d8a9fd682b.\nTarget: docs/platform/agent-coordination/architecture/executor-health-and-fallback.md:122-122#4-one-attempt-history-explicit-caps (current lines); unit SHA256 2f23cfb828da8d49550ee62f606921a1b0c87b974326553ee6c7afb59dff9fbc.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 2f23cfb828da8d49550ee62f606921a1b0c87b974326553ee6c7afb59dff9fbc at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 15\" → \"4. One Attempt History, Explicit Caps\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-15 under docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#4-one-attempt-history-explicit-caps; source context \"Executor Fallback And Effect Eligibility / 4. One Attempt History, Explicit Caps\", target context \"Executor Fallback And Effect Eligibility\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 212,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_07dad543c4bb6b7ce874e8466f2a09c6",
    "sourceUnitDigest": "ceebada3611071e2438d0b4edb36ff1b583f1ab012e449e5891243d8a9fd682b",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/architecture/executor-health-and-fallback.md:107-115#unheaded-block-15 (current lines); unit SHA256 ceebada3611071e2438d0b4edb36ff1b583f1ab012e449e5891243d8a9fd682b.\nTarget: docs/platform/agent-coordination/architecture/executor-health-and-fallback.md:122-122#4-one-attempt-history-explicit-caps (current lines); unit SHA256 2f23cfb828da8d49550ee62f606921a1b0c87b974326553ee6c7afb59dff9fbc.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 2f23cfb828da8d49550ee62f606921a1b0c87b974326553ee6c7afb59dff9fbc at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 15\" → \"4. One Attempt History, Explicit Caps\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-15 under docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#4-one-attempt-history-explicit-caps; source context \"Executor Fallback And Effect Eligibility / 4. One Attempt History, Explicit Caps\", target context \"Executor Fallback And Effect Eligibility\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/architecture/executor-health-and-fallback.md",
    "targetAnchor": "4-one-attempt-history-explicit-caps",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "2f23cfb828da8d49550ee62f606921a1b0c87b974326553ee6c7afb59dff9fbc",
    "targetAncestry": [
      "Executor Fallback And Effect Eligibility"
    ]
  }
}
```

## Entry rationale-214

```json
{
  "entryId": "rationale-214",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_6d43b086d10f2df86b53ddcec381df1a",
  "before": "The current successor at docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#4-one-attempt-history-explicit-caps supersedes the stale current-state claim shown at docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-17 before 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The original frozen source remains conserved by the accepted carriage and its dated complete historical carrier; this is a truth correction, not a new move or retirement. The section-specific code/CLI evidence is recorded in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json. This successor is pending independent truth review, with no inherited approval.",
  "after": "Source: docs/architect/agent-coordination/architecture/executor-health-and-fallback.md:117-123#unheaded-block-16 (current lines); unit SHA256 8351d265484b0dd81108f0aa35df62589eb3292ab052cf6dffe7fa9a2d14214c.\nTarget: docs/platform/agent-coordination/architecture/executor-health-and-fallback.md:122-122#4-one-attempt-history-explicit-caps (current lines); unit SHA256 2f23cfb828da8d49550ee62f606921a1b0c87b974326553ee6c7afb59dff9fbc.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 2f23cfb828da8d49550ee62f606921a1b0c87b974326553ee6c7afb59dff9fbc at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 16\" → \"4. One Attempt History, Explicit Caps\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-16 under docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#4-one-attempt-history-explicit-caps; source context \"Executor Fallback And Effect Eligibility / 4. One Attempt History, Explicit Caps\", target context \"Executor Fallback And Effect Eligibility\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 213,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_6d43b086d10f2df86b53ddcec381df1a",
    "sourceUnitDigest": "8351d265484b0dd81108f0aa35df62589eb3292ab052cf6dffe7fa9a2d14214c",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/architecture/executor-health-and-fallback.md:117-123#unheaded-block-16 (current lines); unit SHA256 8351d265484b0dd81108f0aa35df62589eb3292ab052cf6dffe7fa9a2d14214c.\nTarget: docs/platform/agent-coordination/architecture/executor-health-and-fallback.md:122-122#4-one-attempt-history-explicit-caps (current lines); unit SHA256 2f23cfb828da8d49550ee62f606921a1b0c87b974326553ee6c7afb59dff9fbc.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 2f23cfb828da8d49550ee62f606921a1b0c87b974326553ee6c7afb59dff9fbc at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 16\" → \"4. One Attempt History, Explicit Caps\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-16 under docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#4-one-attempt-history-explicit-caps; source context \"Executor Fallback And Effect Eligibility / 4. One Attempt History, Explicit Caps\", target context \"Executor Fallback And Effect Eligibility\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/architecture/executor-health-and-fallback.md",
    "targetAnchor": "4-one-attempt-history-explicit-caps",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "2f23cfb828da8d49550ee62f606921a1b0c87b974326553ee6c7afb59dff9fbc",
    "targetAncestry": [
      "Executor Fallback And Effect Eligibility"
    ]
  }
}
```

## Entry rationale-215

```json
{
  "entryId": "rationale-215",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_dfe4002bbb3b81c40896dc2d7647c0bc",
  "before": "The current successor at docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#4-one-attempt-history-explicit-caps supersedes the stale current-state claim shown at docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-18 before 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The original frozen source remains conserved by the accepted carriage and its dated complete historical carrier; this is a truth correction, not a new move or retirement. The section-specific code/CLI evidence is recorded in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json. This successor is pending independent truth review, with no inherited approval.",
  "after": "Source: docs/architect/agent-coordination/architecture/executor-health-and-fallback.md:125-130#unheaded-block-17 (current lines); unit SHA256 2591a85c59e7bd2ddc86f8251405aba66e1fc9dcb6f5bd99f8666180c20a82a1.\nTarget: docs/platform/agent-coordination/architecture/executor-health-and-fallback.md:122-122#4-one-attempt-history-explicit-caps (current lines); unit SHA256 2f23cfb828da8d49550ee62f606921a1b0c87b974326553ee6c7afb59dff9fbc.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 2f23cfb828da8d49550ee62f606921a1b0c87b974326553ee6c7afb59dff9fbc at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 17\" → \"4. One Attempt History, Explicit Caps\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-17 under docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#4-one-attempt-history-explicit-caps; source context \"Executor Fallback And Effect Eligibility / 4. One Attempt History, Explicit Caps\", target context \"Executor Fallback And Effect Eligibility\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 214,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_dfe4002bbb3b81c40896dc2d7647c0bc",
    "sourceUnitDigest": "2591a85c59e7bd2ddc86f8251405aba66e1fc9dcb6f5bd99f8666180c20a82a1",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/architecture/executor-health-and-fallback.md:125-130#unheaded-block-17 (current lines); unit SHA256 2591a85c59e7bd2ddc86f8251405aba66e1fc9dcb6f5bd99f8666180c20a82a1.\nTarget: docs/platform/agent-coordination/architecture/executor-health-and-fallback.md:122-122#4-one-attempt-history-explicit-caps (current lines); unit SHA256 2f23cfb828da8d49550ee62f606921a1b0c87b974326553ee6c7afb59dff9fbc.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 2f23cfb828da8d49550ee62f606921a1b0c87b974326553ee6c7afb59dff9fbc at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 17\" → \"4. One Attempt History, Explicit Caps\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-17 under docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#4-one-attempt-history-explicit-caps; source context \"Executor Fallback And Effect Eligibility / 4. One Attempt History, Explicit Caps\", target context \"Executor Fallback And Effect Eligibility\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/architecture/executor-health-and-fallback.md",
    "targetAnchor": "4-one-attempt-history-explicit-caps",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "2f23cfb828da8d49550ee62f606921a1b0c87b974326553ee6c7afb59dff9fbc",
    "targetAncestry": [
      "Executor Fallback And Effect Eligibility"
    ]
  }
}
```

## Entry rationale-216

```json
{
  "entryId": "rationale-216",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_c89663c837918676821535861c41b485",
  "before": "The current successor at docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#5-effectguaranteeport supersedes the stale current-state claim shown at docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-20 before 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The original frozen source remains conserved by the accepted carriage and its dated complete historical carrier; this is a truth correction, not a new move or retirement. The section-specific code/CLI evidence is recorded in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json. This successor is pending independent truth review, with no inherited approval.",
  "after": "Source: docs/architect/agent-coordination/architecture/executor-health-and-fallback.md:140-150#unheaded-block-19 (current lines); unit SHA256 971881e56230e867df9e3128911645fdea0daf5002ef793a8a77efd91a1df36c.\nTarget: docs/platform/agent-coordination/architecture/executor-health-and-fallback.md:148-148#5-effectguaranteeport (current lines); unit SHA256 b1d381bbc887443b7cf100e3487266740edf4f45898aec8b14065bfa410ef8b5.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest b1d381bbc887443b7cf100e3487266740edf4f45898aec8b14065bfa410ef8b5 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 19\" → \"5. EffectGuaranteePort\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-19 under docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#5-effectguaranteeport; source context \"Executor Fallback And Effect Eligibility / 5. EffectGuaranteePort\", target context \"Executor Fallback And Effect Eligibility\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 215,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_c89663c837918676821535861c41b485",
    "sourceUnitDigest": "971881e56230e867df9e3128911645fdea0daf5002ef793a8a77efd91a1df36c",
    "claimKind": "contract",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/architecture/executor-health-and-fallback.md:140-150#unheaded-block-19 (current lines); unit SHA256 971881e56230e867df9e3128911645fdea0daf5002ef793a8a77efd91a1df36c.\nTarget: docs/platform/agent-coordination/architecture/executor-health-and-fallback.md:148-148#5-effectguaranteeport (current lines); unit SHA256 b1d381bbc887443b7cf100e3487266740edf4f45898aec8b14065bfa410ef8b5.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest b1d381bbc887443b7cf100e3487266740edf4f45898aec8b14065bfa410ef8b5 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 19\" → \"5. EffectGuaranteePort\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-19 under docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#5-effectguaranteeport; source context \"Executor Fallback And Effect Eligibility / 5. EffectGuaranteePort\", target context \"Executor Fallback And Effect Eligibility\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/architecture/executor-health-and-fallback.md",
    "targetAnchor": "5-effectguaranteeport",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "b1d381bbc887443b7cf100e3487266740edf4f45898aec8b14065bfa410ef8b5",
    "targetAncestry": [
      "Executor Fallback And Effect Eligibility"
    ]
  }
}
```

## Entry rationale-217

```json
{
  "entryId": "rationale-217",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_92b8f4c6b79700a469ef0a7194d216b2",
  "before": "The current successor at docs/platform/agent-coordination/architecture/group-thinking-trigger-surface.md#a-keep-only-fgos-group-thinking supersedes the stale current-state claim shown at docs/platform/agent-coordination/architecture/group-thinking-trigger-surface.md#unheaded-block-19 before 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The original frozen source remains conserved by the accepted carriage and its dated complete historical carrier; this is a truth correction, not a new move or retirement. The section-specific code/CLI evidence is recorded in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json. This successor is pending independent truth review, with no inherited approval.",
  "after": "Source: docs/architect/agent-coordination/architecture/group-thinking-trigger-surface.md:145-147#unheaded-block-17 (current lines); unit SHA256 27030b44550e90c380e68d859f65041ca081f66b7b4f999cafc2e0969d8b5ca9.\nTarget: docs/platform/agent-coordination/architecture/group-thinking-trigger-surface.md:126-126#a-keep-only-fgos-group-thinking (current lines); unit SHA256 3c18ab212ee8c63a137e1ab4cf6e4b210b7dbd2c9470ddb340f6243744e1d53f.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 3c18ab212ee8c63a137e1ab4cf6e4b210b7dbd2c9470ddb340f6243744e1d53f at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 17\" → \"A. Keep only `fgos-group-thinking`\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/architecture/group-thinking-trigger-surface.md#unheaded-block-17 under docs/platform/agent-coordination/architecture/group-thinking-trigger-surface.md#a-keep-only-fgos-group-thinking; source context \"Group Thinking Trigger Surface / Alternatives Considered / A. Keep only `fgos-group-thinking`\", target context \"Group Thinking Trigger Surface / Alternatives Considered\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 216,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_92b8f4c6b79700a469ef0a7194d216b2",
    "sourceUnitDigest": "27030b44550e90c380e68d859f65041ca081f66b7b4f999cafc2e0969d8b5ca9",
    "claimKind": "contract",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/architecture/group-thinking-trigger-surface.md:145-147#unheaded-block-17 (current lines); unit SHA256 27030b44550e90c380e68d859f65041ca081f66b7b4f999cafc2e0969d8b5ca9.\nTarget: docs/platform/agent-coordination/architecture/group-thinking-trigger-surface.md:126-126#a-keep-only-fgos-group-thinking (current lines); unit SHA256 3c18ab212ee8c63a137e1ab4cf6e4b210b7dbd2c9470ddb340f6243744e1d53f.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 3c18ab212ee8c63a137e1ab4cf6e4b210b7dbd2c9470ddb340f6243744e1d53f at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 17\" → \"A. Keep only `fgos-group-thinking`\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/architecture/group-thinking-trigger-surface.md#unheaded-block-17 under docs/platform/agent-coordination/architecture/group-thinking-trigger-surface.md#a-keep-only-fgos-group-thinking; source context \"Group Thinking Trigger Surface / Alternatives Considered / A. Keep only `fgos-group-thinking`\", target context \"Group Thinking Trigger Surface / Alternatives Considered\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/architecture/group-thinking-trigger-surface.md",
    "targetAnchor": "a-keep-only-fgos-group-thinking",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "3c18ab212ee8c63a137e1ab4cf6e4b210b7dbd2c9470ddb340f6243744e1d53f",
    "targetAncestry": [
      "Group Thinking Trigger Surface",
      "Alternatives Considered"
    ]
  }
}
```

## Entry rationale-218

```json
{
  "entryId": "rationale-218",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_6ccb120b3660788aa96def3f9c9488f0",
  "before": "The current successor at docs/platform/agent-coordination/architecture/group-thinking-trigger-surface.md#c-rename-or-deprecate-the-existing-skills supersedes the stale current-state claim shown at docs/platform/agent-coordination/architecture/group-thinking-trigger-surface.md#unheaded-block-21 before 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The original frozen source remains conserved by the accepted carriage and its dated complete historical carrier; this is a truth correction, not a new move or retirement. The section-specific code/CLI evidence is recorded in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json. This successor is pending independent truth review, with no inherited approval.",
  "after": "Source: docs/architect/agent-coordination/architecture/group-thinking-trigger-surface.md:157-161#unheaded-block-19 (current lines); unit SHA256 0e1f77c31747156af1b8f026abfb2b1f6d86862ee268fa77ca7f0b9c181f7072.\nTarget: docs/platform/agent-coordination/architecture/group-thinking-trigger-surface.md:138-138#c-rename-or-deprecate-the-existing-skills (current lines); unit SHA256 4d282049017d6b3a1c8b0995d30cccb8a6895bbe607b2205ad5a094fbaf5d27c.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 4d282049017d6b3a1c8b0995d30cccb8a6895bbe607b2205ad5a094fbaf5d27c at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 19\" → \"C. Rename or deprecate the existing skills\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/architecture/group-thinking-trigger-surface.md#unheaded-block-19 under docs/platform/agent-coordination/architecture/group-thinking-trigger-surface.md#c-rename-or-deprecate-the-existing-skills; source context \"Group Thinking Trigger Surface / Alternatives Considered / C. Rename or deprecate the existing skills\", target context \"Group Thinking Trigger Surface / Alternatives Considered\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 217,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_6ccb120b3660788aa96def3f9c9488f0",
    "sourceUnitDigest": "0e1f77c31747156af1b8f026abfb2b1f6d86862ee268fa77ca7f0b9c181f7072",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/architecture/group-thinking-trigger-surface.md:157-161#unheaded-block-19 (current lines); unit SHA256 0e1f77c31747156af1b8f026abfb2b1f6d86862ee268fa77ca7f0b9c181f7072.\nTarget: docs/platform/agent-coordination/architecture/group-thinking-trigger-surface.md:138-138#c-rename-or-deprecate-the-existing-skills (current lines); unit SHA256 4d282049017d6b3a1c8b0995d30cccb8a6895bbe607b2205ad5a094fbaf5d27c.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 4d282049017d6b3a1c8b0995d30cccb8a6895bbe607b2205ad5a094fbaf5d27c at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 19\" → \"C. Rename or deprecate the existing skills\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/architecture/group-thinking-trigger-surface.md#unheaded-block-19 under docs/platform/agent-coordination/architecture/group-thinking-trigger-surface.md#c-rename-or-deprecate-the-existing-skills; source context \"Group Thinking Trigger Surface / Alternatives Considered / C. Rename or deprecate the existing skills\", target context \"Group Thinking Trigger Surface / Alternatives Considered\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/architecture/group-thinking-trigger-surface.md",
    "targetAnchor": "c-rename-or-deprecate-the-existing-skills",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "4d282049017d6b3a1c8b0995d30cccb8a6895bbe607b2205ad5a094fbaf5d27c",
    "targetAncestry": [
      "Group Thinking Trigger Surface",
      "Alternatives Considered"
    ]
  }
}
```

## Entry rationale-219

```json
{
  "entryId": "rationale-219",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_d025ea86a4c37a1d545a30405c95c10e",
  "before": "The current successor at docs/platform/agent-coordination/architecture/protocol-model.md#planning-sources supersedes the stale current-state claim shown at docs/platform/agent-coordination/architecture/protocol-model.md#unheaded-block-3 before 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The original frozen source remains conserved by the accepted carriage and its dated complete historical carrier; this is a truth correction, not a new move or retirement. The section-specific code/CLI evidence is recorded in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json. This successor is pending independent truth review, with no inherited approval.",
  "after": "Source: docs/architect/agent-coordination/architecture/protocol-model.md:20-22#unheaded-block-3 (current lines); unit SHA256 4de01935c05e1015b7a52cba8cea0f52b31e6637adbfcd97ec6185e84ca3e0be.\nTarget: docs/platform/agent-coordination/architecture/protocol-model.md:25-25#planning-sources (current lines); unit SHA256 29205425e672bf450568296cebc7af19a9f88e89736a712f24cc06d01903f0f6.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 29205425e672bf450568296cebc7af19a9f88e89736a712f24cc06d01903f0f6 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 1, target 0; 1 changed spellings/labels, 0 destination changes; 0 added, 1 removed.\nLink 1: \"Agent Coordination Foundation Vision\" (../vision.md) → \"none\" (none); resolved docs/architect/agent-coordination/vision.md → none.\nHeading depth: not a heading → 2; title \"Unheaded block 3\" → \"Planning Sources\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/architecture/protocol-model.md#unheaded-block-3 under docs/platform/agent-coordination/architecture/protocol-model.md#planning-sources; source context \"Coordination Protocol Model / Planning Sources\", target context \"Coordination Protocol Model\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 218,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_d025ea86a4c37a1d545a30405c95c10e",
    "sourceUnitDigest": "4de01935c05e1015b7a52cba8cea0f52b31e6637adbfcd97ec6185e84ca3e0be",
    "claimKind": "contract",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/architecture/protocol-model.md:20-22#unheaded-block-3 (current lines); unit SHA256 4de01935c05e1015b7a52cba8cea0f52b31e6637adbfcd97ec6185e84ca3e0be.\nTarget: docs/platform/agent-coordination/architecture/protocol-model.md:25-25#planning-sources (current lines); unit SHA256 29205425e672bf450568296cebc7af19a9f88e89736a712f24cc06d01903f0f6.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 29205425e672bf450568296cebc7af19a9f88e89736a712f24cc06d01903f0f6 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 1, target 0; 1 changed spellings/labels, 0 destination changes; 0 added, 1 removed.\nLink 1: \"Agent Coordination Foundation Vision\" (../vision.md) → \"none\" (none); resolved docs/architect/agent-coordination/vision.md → none.\nHeading depth: not a heading → 2; title \"Unheaded block 3\" → \"Planning Sources\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/architecture/protocol-model.md#unheaded-block-3 under docs/platform/agent-coordination/architecture/protocol-model.md#planning-sources; source context \"Coordination Protocol Model / Planning Sources\", target context \"Coordination Protocol Model\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/architecture/protocol-model.md",
    "targetAnchor": "planning-sources",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "29205425e672bf450568296cebc7af19a9f88e89736a712f24cc06d01903f0f6",
    "targetAncestry": [
      "Coordination Protocol Model"
    ]
  }
}
```

## Entry rationale-220

```json
{
  "entryId": "rationale-220",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_3baa17b96efa5b2e4471ab115b0d7c17",
  "before": "The current successor at docs/platform/agent-coordination/architecture/protocol-model.md#planning-sources supersedes the stale current-state claim shown at docs/platform/agent-coordination/architecture/protocol-model.md#unheaded-block-4 before 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The original frozen source remains conserved by the accepted carriage and its dated complete historical carrier; this is a truth correction, not a new move or retirement. The section-specific code/CLI evidence is recorded in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json. This successor is pending independent truth review, with no inherited approval.",
  "after": "Source: docs/architect/agent-coordination/architecture/protocol-model.md:24-33#unheaded-block-4 (current lines); unit SHA256 e7573044163f4c72029fe7924af03aeeb083e5932f03761a1c858406ffa339ae.\nTarget: docs/platform/agent-coordination/architecture/protocol-model.md:25-25#planning-sources (current lines); unit SHA256 29205425e672bf450568296cebc7af19a9f88e89736a712f24cc06d01903f0f6.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 29205425e672bf450568296cebc7af19a9f88e89736a712f24cc06d01903f0f6 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 4\" → \"Planning Sources\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/architecture/protocol-model.md#unheaded-block-4 under docs/platform/agent-coordination/architecture/protocol-model.md#planning-sources; source context \"Coordination Protocol Model / Planning Sources\", target context \"Coordination Protocol Model\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 219,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_3baa17b96efa5b2e4471ab115b0d7c17",
    "sourceUnitDigest": "e7573044163f4c72029fe7924af03aeeb083e5932f03761a1c858406ffa339ae",
    "claimKind": "contract",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/architecture/protocol-model.md:24-33#unheaded-block-4 (current lines); unit SHA256 e7573044163f4c72029fe7924af03aeeb083e5932f03761a1c858406ffa339ae.\nTarget: docs/platform/agent-coordination/architecture/protocol-model.md:25-25#planning-sources (current lines); unit SHA256 29205425e672bf450568296cebc7af19a9f88e89736a712f24cc06d01903f0f6.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 29205425e672bf450568296cebc7af19a9f88e89736a712f24cc06d01903f0f6 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 4\" → \"Planning Sources\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/architecture/protocol-model.md#unheaded-block-4 under docs/platform/agent-coordination/architecture/protocol-model.md#planning-sources; source context \"Coordination Protocol Model / Planning Sources\", target context \"Coordination Protocol Model\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/architecture/protocol-model.md",
    "targetAnchor": "planning-sources",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "29205425e672bf450568296cebc7af19a9f88e89736a712f24cc06d01903f0f6",
    "targetAncestry": [
      "Coordination Protocol Model"
    ]
  }
}
```

## Entry rationale-221

```json
{
  "entryId": "rationale-221",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_41f39b5ae50c28f205b44cedf2042c53",
  "before": "The current successor at docs/platform/agent-coordination/architecture/protocol-model.md#declared-model supersedes the stale current-state claim shown at docs/platform/agent-coordination/architecture/protocol-model.md#unheaded-block-6 before 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The original frozen source remains conserved by the accepted carriage and its dated complete historical carrier; this is a truth correction, not a new move or retirement. The section-specific code/CLI evidence is recorded in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json. This successor is pending independent truth review, with no inherited approval.",
  "after": "Source: docs/architect/agent-coordination/architecture/protocol-model.md:41-50#unheaded-block-6 (current lines); unit SHA256 f3122a52ffc80c8160aa2a51efbecd8948873d2da3be559bf551f1991cecbc14.\nTarget: docs/platform/agent-coordination/architecture/protocol-model.md:46-46#declared-model (current lines); unit SHA256 54d3b4be1e06f2ac02712f7b8774bc763c5f411f5d40bd0bbc61c3e0256889ff.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 54d3b4be1e06f2ac02712f7b8774bc763c5f411f5d40bd0bbc61c3e0256889ff at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 6\" → \"Declared Model\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/architecture/protocol-model.md#unheaded-block-6 under docs/platform/agent-coordination/architecture/protocol-model.md#declared-model; source context \"Coordination Protocol Model / Declared Model\", target context \"Coordination Protocol Model\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 220,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_41f39b5ae50c28f205b44cedf2042c53",
    "sourceUnitDigest": "f3122a52ffc80c8160aa2a51efbecd8948873d2da3be559bf551f1991cecbc14",
    "claimKind": "contract",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/architecture/protocol-model.md:41-50#unheaded-block-6 (current lines); unit SHA256 f3122a52ffc80c8160aa2a51efbecd8948873d2da3be559bf551f1991cecbc14.\nTarget: docs/platform/agent-coordination/architecture/protocol-model.md:46-46#declared-model (current lines); unit SHA256 54d3b4be1e06f2ac02712f7b8774bc763c5f411f5d40bd0bbc61c3e0256889ff.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 54d3b4be1e06f2ac02712f7b8774bc763c5f411f5d40bd0bbc61c3e0256889ff at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 6\" → \"Declared Model\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/architecture/protocol-model.md#unheaded-block-6 under docs/platform/agent-coordination/architecture/protocol-model.md#declared-model; source context \"Coordination Protocol Model / Declared Model\", target context \"Coordination Protocol Model\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/architecture/protocol-model.md",
    "targetAnchor": "declared-model",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "54d3b4be1e06f2ac02712f7b8774bc763c5f411f5d40bd0bbc61c3e0256889ff",
    "targetAncestry": [
      "Coordination Protocol Model"
    ]
  }
}
```

## Entry rationale-222

```json
{
  "entryId": "rationale-222",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_9ff39ce2352aa1a1450c05755bcb4b4b",
  "before": "The current successor at docs/platform/agent-coordination/architecture/protocol-model.md#declared-model supersedes the stale current-state claim shown at docs/platform/agent-coordination/architecture/protocol-model.md#unheaded-block-7 before 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The original frozen source remains conserved by the accepted carriage and its dated complete historical carrier; this is a truth correction, not a new move or retirement. The section-specific code/CLI evidence is recorded in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json. This successor is pending independent truth review, with no inherited approval.",
  "after": "Source: docs/architect/agent-coordination/architecture/protocol-model.md:52-54#unheaded-block-7 (current lines); unit SHA256 1571c801405554789b25bc8a8d2bc3fda183369bf53165399b302af5fa69f459.\nTarget: docs/platform/agent-coordination/architecture/protocol-model.md:46-46#declared-model (current lines); unit SHA256 54d3b4be1e06f2ac02712f7b8774bc763c5f411f5d40bd0bbc61c3e0256889ff.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 54d3b4be1e06f2ac02712f7b8774bc763c5f411f5d40bd0bbc61c3e0256889ff at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 7\" → \"Declared Model\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/architecture/protocol-model.md#unheaded-block-7 under docs/platform/agent-coordination/architecture/protocol-model.md#declared-model; source context \"Coordination Protocol Model / Declared Model\", target context \"Coordination Protocol Model\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 221,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_9ff39ce2352aa1a1450c05755bcb4b4b",
    "sourceUnitDigest": "1571c801405554789b25bc8a8d2bc3fda183369bf53165399b302af5fa69f459",
    "claimKind": "contract",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/architecture/protocol-model.md:52-54#unheaded-block-7 (current lines); unit SHA256 1571c801405554789b25bc8a8d2bc3fda183369bf53165399b302af5fa69f459.\nTarget: docs/platform/agent-coordination/architecture/protocol-model.md:46-46#declared-model (current lines); unit SHA256 54d3b4be1e06f2ac02712f7b8774bc763c5f411f5d40bd0bbc61c3e0256889ff.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 54d3b4be1e06f2ac02712f7b8774bc763c5f411f5d40bd0bbc61c3e0256889ff at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 7\" → \"Declared Model\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/architecture/protocol-model.md#unheaded-block-7 under docs/platform/agent-coordination/architecture/protocol-model.md#declared-model; source context \"Coordination Protocol Model / Declared Model\", target context \"Coordination Protocol Model\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/architecture/protocol-model.md",
    "targetAnchor": "declared-model",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "54d3b4be1e06f2ac02712f7b8774bc763c5f411f5d40bd0bbc61c3e0256889ff",
    "targetAncestry": [
      "Coordination Protocol Model"
    ]
  }
}
```

## Entry rationale-223

```json
{
  "entryId": "rationale-223",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_7d36c00eba15b11cc07b5583187a1e8e",
  "before": "The current successor at docs/platform/agent-coordination/architecture/protocol-model.md#responsibility-split supersedes the stale current-state claim shown at docs/platform/agent-coordination/architecture/protocol-model.md#unheaded-block-8 before 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The original frozen source remains conserved by the accepted carriage and its dated complete historical carrier; this is a truth correction, not a new move or retirement. The section-specific code/CLI evidence is recorded in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json. This successor is pending independent truth review, with no inherited approval.",
  "after": "Source: docs/architect/agent-coordination/architecture/protocol-model.md:58-66#unheaded-block-8 (current lines); unit SHA256 abc22b88ed9d6c86a2f5efec953fbb9486c18cc849ed8a99a085ef10a5779a97.\nTarget: docs/platform/agent-coordination/architecture/protocol-model.md:62-62#responsibility-split (current lines); unit SHA256 b279b9ea1b355531ab48f2f3c849c20e2c95cdf4c6f18b7786adda380a0bf57a.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest b279b9ea1b355531ab48f2f3c849c20e2c95cdf4c6f18b7786adda380a0bf57a at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 8\" → \"Responsibility Split\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/architecture/protocol-model.md#unheaded-block-8 under docs/platform/agent-coordination/architecture/protocol-model.md#responsibility-split; source context \"Coordination Protocol Model / Responsibility Split\", target context \"Coordination Protocol Model\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 222,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_7d36c00eba15b11cc07b5583187a1e8e",
    "sourceUnitDigest": "abc22b88ed9d6c86a2f5efec953fbb9486c18cc849ed8a99a085ef10a5779a97",
    "claimKind": "contract",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/architecture/protocol-model.md:58-66#unheaded-block-8 (current lines); unit SHA256 abc22b88ed9d6c86a2f5efec953fbb9486c18cc849ed8a99a085ef10a5779a97.\nTarget: docs/platform/agent-coordination/architecture/protocol-model.md:62-62#responsibility-split (current lines); unit SHA256 b279b9ea1b355531ab48f2f3c849c20e2c95cdf4c6f18b7786adda380a0bf57a.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest b279b9ea1b355531ab48f2f3c849c20e2c95cdf4c6f18b7786adda380a0bf57a at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 8\" → \"Responsibility Split\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/architecture/protocol-model.md#unheaded-block-8 under docs/platform/agent-coordination/architecture/protocol-model.md#responsibility-split; source context \"Coordination Protocol Model / Responsibility Split\", target context \"Coordination Protocol Model\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/architecture/protocol-model.md",
    "targetAnchor": "responsibility-split",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "b279b9ea1b355531ab48f2f3c849c20e2c95cdf4c6f18b7786adda380a0bf57a",
    "targetAncestry": [
      "Coordination Protocol Model"
    ]
  }
}
```

## Entry rationale-224

```json
{
  "entryId": "rationale-224",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_906538d95e180ed10d9fdc235eea846f",
  "before": "The current successor at docs/platform/agent-coordination/architecture/protocol-model.md#responsibility-split supersedes the stale current-state claim shown at docs/platform/agent-coordination/architecture/protocol-model.md#unheaded-block-9 before 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The original frozen source remains conserved by the accepted carriage and its dated complete historical carrier; this is a truth correction, not a new move or retirement. The section-specific code/CLI evidence is recorded in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json. This successor is pending independent truth review, with no inherited approval.",
  "after": "Source: docs/architect/agent-coordination/architecture/protocol-model.md:68-72#unheaded-block-9 (current lines); unit SHA256 0d894dbefdac385fc550b8f1f161ec3f3e9335813dc1dcbbdd74c963e69129cb.\nTarget: docs/platform/agent-coordination/architecture/protocol-model.md:62-62#responsibility-split (current lines); unit SHA256 b279b9ea1b355531ab48f2f3c849c20e2c95cdf4c6f18b7786adda380a0bf57a.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest b279b9ea1b355531ab48f2f3c849c20e2c95cdf4c6f18b7786adda380a0bf57a at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 9\" → \"Responsibility Split\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/architecture/protocol-model.md#unheaded-block-9 under docs/platform/agent-coordination/architecture/protocol-model.md#responsibility-split; source context \"Coordination Protocol Model / Responsibility Split\", target context \"Coordination Protocol Model\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 223,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_906538d95e180ed10d9fdc235eea846f",
    "sourceUnitDigest": "0d894dbefdac385fc550b8f1f161ec3f3e9335813dc1dcbbdd74c963e69129cb",
    "claimKind": "contract",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/architecture/protocol-model.md:68-72#unheaded-block-9 (current lines); unit SHA256 0d894dbefdac385fc550b8f1f161ec3f3e9335813dc1dcbbdd74c963e69129cb.\nTarget: docs/platform/agent-coordination/architecture/protocol-model.md:62-62#responsibility-split (current lines); unit SHA256 b279b9ea1b355531ab48f2f3c849c20e2c95cdf4c6f18b7786adda380a0bf57a.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest b279b9ea1b355531ab48f2f3c849c20e2c95cdf4c6f18b7786adda380a0bf57a at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 9\" → \"Responsibility Split\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/architecture/protocol-model.md#unheaded-block-9 under docs/platform/agent-coordination/architecture/protocol-model.md#responsibility-split; source context \"Coordination Protocol Model / Responsibility Split\", target context \"Coordination Protocol Model\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/architecture/protocol-model.md",
    "targetAnchor": "responsibility-split",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "b279b9ea1b355531ab48f2f3c849c20e2c95cdf4c6f18b7786adda380a0bf57a",
    "targetAncestry": [
      "Coordination Protocol Model"
    ]
  }
}
```

## Entry rationale-225

```json
{
  "entryId": "rationale-225",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_0e9e0ab53bbc4bdfb7b06b60033e2cc0",
  "before": "The current successor at docs/platform/agent-coordination/architecture/README.md#documents supersedes the stale current-state claim shown at docs/platform/agent-coordination/architecture/README.md#unheaded-block-6 before 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The original frozen source remains conserved by the accepted carriage and its dated complete historical carrier; this is a truth correction, not a new move or retirement. The section-specific code/CLI evidence is recorded in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json. This successor is pending independent truth review, with no inherited approval.",
  "after": "Source: docs/architect/agent-coordination/architecture/README.md:18-51#unheaded-block-4 (current lines); unit SHA256 672b4eb44591d3566f6019f9ac30e09eb818a3f4ef39b61915d1286d1b98fb24.\nTarget: docs/platform/agent-coordination/architecture/README.md:38-38#documents (current lines); unit SHA256 49356260560f2832cf7a255dea7b0b249ea812951557ae23a39df4cef1b3b9f0.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 49356260560f2832cf7a255dea7b0b249ea812951557ae23a39df4cef1b3b9f0 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 12, target 14; 5 changed spellings/labels, 3 destination changes; 2 added, 0 removed.\nLink 1: \"none\" (none) → \"Agent Coordination Foundation Vision\" (../vision.md); resolved none → docs/platform/agent-coordination/vision.md.\nLink 2: \"System Context\" (system-context.md) → \"System Context\" (../history/retired-engine/files/architecture/system-context.md#literal-snapshot); resolved docs/architect/agent-coordination/architecture/system-context.md → docs/platform/agent-coordination/history/retired-engine/files/architecture/system-context.md#literal-snapshot.\nLink 3: \"Coordination Foundation Baseline\" (coordination-foundation-baseline.md) → \"Coordination Foundation Baseline\" (../history/retired-engine/files/architecture/coordination-foundation-baseline.md#literal-snapshot); resolved docs/architect/agent-coordination/architecture/coordination-foundation-baseline.md → docs/platform/agent-coordination/history/retired-engine/files/architecture/coordination-foundation-baseline.md#literal-snapshot.\nLink 11: \"Coordination Continuation And Recovery\" (coordination-continuation-recovery.md) → \"Coordination Continuation And Recovery\" (../history/retired-engine/files/architecture/coordination-continuation-recovery.md#literal-snapshot); resolved docs/architect/agent-coordination/architecture/coordination-continuation-recovery.md → docs/platform/agent-coordination/history/retired-engine/files/architecture/coordination-continuation-recovery.md#literal-snapshot.\nLink 14: \"none\" (none) → \"Run Phases And Admission\" (../contracts/assignment-run-runresult.md#run-phases-and-admission); resolved none → docs/platform/agent-coordination/contracts/assignment-run-runresult.md#run-phases-and-admission.\nHeading depth: not a heading → 2; title \"Unheaded block 4\" → \"Documents\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/architecture/README.md#unheaded-block-4 under docs/platform/agent-coordination/architecture/README.md#documents; source context \"Agent Coordination Architecture / Documents\", target context \"Agent Coordination Architecture\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 224,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_0e9e0ab53bbc4bdfb7b06b60033e2cc0",
    "sourceUnitDigest": "672b4eb44591d3566f6019f9ac30e09eb818a3f4ef39b61915d1286d1b98fb24",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/architecture/README.md:18-51#unheaded-block-4 (current lines); unit SHA256 672b4eb44591d3566f6019f9ac30e09eb818a3f4ef39b61915d1286d1b98fb24.\nTarget: docs/platform/agent-coordination/architecture/README.md:38-38#documents (current lines); unit SHA256 49356260560f2832cf7a255dea7b0b249ea812951557ae23a39df4cef1b3b9f0.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 49356260560f2832cf7a255dea7b0b249ea812951557ae23a39df4cef1b3b9f0 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 12, target 14; 5 changed spellings/labels, 3 destination changes; 2 added, 0 removed.\nLink 1: \"none\" (none) → \"Agent Coordination Foundation Vision\" (../vision.md); resolved none → docs/platform/agent-coordination/vision.md.\nLink 2: \"System Context\" (system-context.md) → \"System Context\" (../history/retired-engine/files/architecture/system-context.md#literal-snapshot); resolved docs/architect/agent-coordination/architecture/system-context.md → docs/platform/agent-coordination/history/retired-engine/files/architecture/system-context.md#literal-snapshot.\nLink 3: \"Coordination Foundation Baseline\" (coordination-foundation-baseline.md) → \"Coordination Foundation Baseline\" (../history/retired-engine/files/architecture/coordination-foundation-baseline.md#literal-snapshot); resolved docs/architect/agent-coordination/architecture/coordination-foundation-baseline.md → docs/platform/agent-coordination/history/retired-engine/files/architecture/coordination-foundation-baseline.md#literal-snapshot.\nLink 11: \"Coordination Continuation And Recovery\" (coordination-continuation-recovery.md) → \"Coordination Continuation And Recovery\" (../history/retired-engine/files/architecture/coordination-continuation-recovery.md#literal-snapshot); resolved docs/architect/agent-coordination/architecture/coordination-continuation-recovery.md → docs/platform/agent-coordination/history/retired-engine/files/architecture/coordination-continuation-recovery.md#literal-snapshot.\nLink 14: \"none\" (none) → \"Run Phases And Admission\" (../contracts/assignment-run-runresult.md#run-phases-and-admission); resolved none → docs/platform/agent-coordination/contracts/assignment-run-runresult.md#run-phases-and-admission.\nHeading depth: not a heading → 2; title \"Unheaded block 4\" → \"Documents\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/architecture/README.md#unheaded-block-4 under docs/platform/agent-coordination/architecture/README.md#documents; source context \"Agent Coordination Architecture / Documents\", target context \"Agent Coordination Architecture\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/architecture/README.md",
    "targetAnchor": "documents",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "49356260560f2832cf7a255dea7b0b249ea812951557ae23a39df4cef1b3b9f0",
    "targetAncestry": [
      "Agent Coordination Architecture"
    ]
  }
}
```

## Entry rationale-226

```json
{
  "entryId": "rationale-226",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_572b05980d7185a97d83e9167978cfc1",
  "before": "The current successor at docs/platform/agent-coordination/architecture/README.md#runtime-recovery-principles supersedes the stale current-state claim shown at docs/platform/agent-coordination/architecture/README.md#unheaded-block-9 before 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The original frozen source remains conserved by the accepted carriage and its dated complete historical carrier; this is a truth correction, not a new move or retirement. The section-specific code/CLI evidence is recorded in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json. This successor is pending independent truth review, with no inherited approval.",
  "after": "Source: docs/architect/agent-coordination/architecture/README.md:60-84#unheaded-block-7 (current lines); unit SHA256 8280357eb2640fa59bf6e606f3347228be1fa52bebd3908f03ae9c75d125dd80.\nTarget: docs/platform/agent-coordination/architecture/README.md:78-78#runtime-recovery-principles (current lines); unit SHA256 ae39ebfd15d5366bf1f3fdd54205e69a1a908e45bb3eeefc50715cacd36780b2.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest ae39ebfd15d5366bf1f3fdd54205e69a1a908e45bb3eeefc50715cacd36780b2 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 4; 4 changed spellings/labels, 0 destination changes; 4 added, 0 removed.\nLink 1: \"none\" (none) → \"ADR-008\" (../history/retired-engine/files/decisions/ADR-008-coordination-session-and-mission-deferral.md#literal-snapshot); resolved none → docs/platform/agent-coordination/history/retired-engine/files/decisions/ADR-008-coordination-session-and-mission-deferral.md#literal-snapshot.\nLink 2: \"none\" (none) → \"ADR-009\" (../history/retired-engine/files/decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md#literal-snapshot); resolved none → docs/platform/agent-coordination/history/retired-engine/files/decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md#literal-snapshot.\nLink 3: \"none\" (none) → \"baseline\" (../history/retired-engine/files/architecture/coordination-foundation-baseline.md#literal-snapshot); resolved none → docs/platform/agent-coordination/history/retired-engine/files/architecture/coordination-foundation-baseline.md#literal-snapshot.\nLink 4: \"none\" (none) → \"Group Thinking Trigger Surface\" (group-thinking-trigger-surface.md); resolved none → docs/platform/agent-coordination/architecture/group-thinking-trigger-surface.md.\nHeading depth: not a heading → 2; title \"Unheaded block 7\" → \"Runtime Recovery Principles\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/architecture/README.md#unheaded-block-7 under docs/platform/agent-coordination/architecture/README.md#runtime-recovery-principles; source context \"Agent Coordination Architecture / Runtime Recovery Principles\", target context \"Agent Coordination Architecture\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 225,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_572b05980d7185a97d83e9167978cfc1",
    "sourceUnitDigest": "8280357eb2640fa59bf6e606f3347228be1fa52bebd3908f03ae9c75d125dd80",
    "claimKind": "contract",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/architecture/README.md:60-84#unheaded-block-7 (current lines); unit SHA256 8280357eb2640fa59bf6e606f3347228be1fa52bebd3908f03ae9c75d125dd80.\nTarget: docs/platform/agent-coordination/architecture/README.md:78-78#runtime-recovery-principles (current lines); unit SHA256 ae39ebfd15d5366bf1f3fdd54205e69a1a908e45bb3eeefc50715cacd36780b2.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest ae39ebfd15d5366bf1f3fdd54205e69a1a908e45bb3eeefc50715cacd36780b2 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 4; 4 changed spellings/labels, 0 destination changes; 4 added, 0 removed.\nLink 1: \"none\" (none) → \"ADR-008\" (../history/retired-engine/files/decisions/ADR-008-coordination-session-and-mission-deferral.md#literal-snapshot); resolved none → docs/platform/agent-coordination/history/retired-engine/files/decisions/ADR-008-coordination-session-and-mission-deferral.md#literal-snapshot.\nLink 2: \"none\" (none) → \"ADR-009\" (../history/retired-engine/files/decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md#literal-snapshot); resolved none → docs/platform/agent-coordination/history/retired-engine/files/decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md#literal-snapshot.\nLink 3: \"none\" (none) → \"baseline\" (../history/retired-engine/files/architecture/coordination-foundation-baseline.md#literal-snapshot); resolved none → docs/platform/agent-coordination/history/retired-engine/files/architecture/coordination-foundation-baseline.md#literal-snapshot.\nLink 4: \"none\" (none) → \"Group Thinking Trigger Surface\" (group-thinking-trigger-surface.md); resolved none → docs/platform/agent-coordination/architecture/group-thinking-trigger-surface.md.\nHeading depth: not a heading → 2; title \"Unheaded block 7\" → \"Runtime Recovery Principles\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/architecture/README.md#unheaded-block-7 under docs/platform/agent-coordination/architecture/README.md#runtime-recovery-principles; source context \"Agent Coordination Architecture / Runtime Recovery Principles\", target context \"Agent Coordination Architecture\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/architecture/README.md",
    "targetAnchor": "runtime-recovery-principles",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "ae39ebfd15d5366bf1f3fdd54205e69a1a908e45bb3eeefc50715cacd36780b2",
    "targetAncestry": [
      "Agent Coordination Architecture"
    ]
  }
}
```

## Entry rationale-227

```json
{
  "entryId": "rationale-227",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_7f7eea3837a5a141729c012e44d43903",
  "before": "The current successor at docs/platform/agent-coordination/architecture/README.md#runtime-recovery-principles supersedes the stale current-state claim shown at docs/platform/agent-coordination/architecture/README.md#unheaded-block-10 before 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The original frozen source remains conserved by the accepted carriage and its dated complete historical carrier; this is a truth correction, not a new move or retirement. The section-specific code/CLI evidence is recorded in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json. This successor is pending independent truth review, with no inherited approval.",
  "after": "Source: docs/architect/agent-coordination/architecture/README.md:86-95#unheaded-block-8 (current lines); unit SHA256 8b61857ecd1c833898fa45e8ba0ff7aaf8a1eed9e773058c4a180115f6d81fca.\nTarget: docs/platform/agent-coordination/architecture/README.md:78-78#runtime-recovery-principles (current lines); unit SHA256 ae39ebfd15d5366bf1f3fdd54205e69a1a908e45bb3eeefc50715cacd36780b2.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest ae39ebfd15d5366bf1f3fdd54205e69a1a908e45bb3eeefc50715cacd36780b2 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 4, target 4; 4 changed spellings/labels, 4 destination changes; 0 added, 0 removed.\nLink 1: \"ADR-008\" (../decisions/ADR-008-coordination-session-and-mission-deferral.md) → \"ADR-008\" (../history/retired-engine/files/decisions/ADR-008-coordination-session-and-mission-deferral.md#literal-snapshot); resolved docs/architect/agent-coordination/decisions/ADR-008-coordination-session-and-mission-deferral.md → docs/platform/agent-coordination/history/retired-engine/files/decisions/ADR-008-coordination-session-and-mission-deferral.md#literal-snapshot.\nLink 2: \"ADR-009\" (../decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md) → \"ADR-009\" (../history/retired-engine/files/decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md#literal-snapshot); resolved docs/architect/agent-coordination/decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md → docs/platform/agent-coordination/history/retired-engine/files/decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md#literal-snapshot.\nLink 3: \"contracts/\" (../contracts/README.md) → \"baseline\" (../history/retired-engine/files/architecture/coordination-foundation-baseline.md#literal-snapshot); resolved docs/architect/agent-coordination/contracts/README.md → docs/platform/agent-coordination/history/retired-engine/files/architecture/coordination-foundation-baseline.md#literal-snapshot.\nLink 4: \"Coordination Foundation Baseline\" (coordination-foundation-baseline.md) → \"Group Thinking Trigger Surface\" (group-thinking-trigger-surface.md); resolved docs/architect/agent-coordination/architecture/coordination-foundation-baseline.md → docs/platform/agent-coordination/architecture/group-thinking-trigger-surface.md.\nHeading depth: not a heading → 2; title \"Unheaded block 8\" → \"Runtime Recovery Principles\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/architecture/README.md#unheaded-block-8 under docs/platform/agent-coordination/architecture/README.md#runtime-recovery-principles; source context \"Agent Coordination Architecture / Runtime Recovery Principles\", target context \"Agent Coordination Architecture\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 226,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_7f7eea3837a5a141729c012e44d43903",
    "sourceUnitDigest": "8b61857ecd1c833898fa45e8ba0ff7aaf8a1eed9e773058c4a180115f6d81fca",
    "claimKind": "decision",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/architecture/README.md:86-95#unheaded-block-8 (current lines); unit SHA256 8b61857ecd1c833898fa45e8ba0ff7aaf8a1eed9e773058c4a180115f6d81fca.\nTarget: docs/platform/agent-coordination/architecture/README.md:78-78#runtime-recovery-principles (current lines); unit SHA256 ae39ebfd15d5366bf1f3fdd54205e69a1a908e45bb3eeefc50715cacd36780b2.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest ae39ebfd15d5366bf1f3fdd54205e69a1a908e45bb3eeefc50715cacd36780b2 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 4, target 4; 4 changed spellings/labels, 4 destination changes; 0 added, 0 removed.\nLink 1: \"ADR-008\" (../decisions/ADR-008-coordination-session-and-mission-deferral.md) → \"ADR-008\" (../history/retired-engine/files/decisions/ADR-008-coordination-session-and-mission-deferral.md#literal-snapshot); resolved docs/architect/agent-coordination/decisions/ADR-008-coordination-session-and-mission-deferral.md → docs/platform/agent-coordination/history/retired-engine/files/decisions/ADR-008-coordination-session-and-mission-deferral.md#literal-snapshot.\nLink 2: \"ADR-009\" (../decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md) → \"ADR-009\" (../history/retired-engine/files/decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md#literal-snapshot); resolved docs/architect/agent-coordination/decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md → docs/platform/agent-coordination/history/retired-engine/files/decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md#literal-snapshot.\nLink 3: \"contracts/\" (../contracts/README.md) → \"baseline\" (../history/retired-engine/files/architecture/coordination-foundation-baseline.md#literal-snapshot); resolved docs/architect/agent-coordination/contracts/README.md → docs/platform/agent-coordination/history/retired-engine/files/architecture/coordination-foundation-baseline.md#literal-snapshot.\nLink 4: \"Coordination Foundation Baseline\" (coordination-foundation-baseline.md) → \"Group Thinking Trigger Surface\" (group-thinking-trigger-surface.md); resolved docs/architect/agent-coordination/architecture/coordination-foundation-baseline.md → docs/platform/agent-coordination/architecture/group-thinking-trigger-surface.md.\nHeading depth: not a heading → 2; title \"Unheaded block 8\" → \"Runtime Recovery Principles\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/architecture/README.md#unheaded-block-8 under docs/platform/agent-coordination/architecture/README.md#runtime-recovery-principles; source context \"Agent Coordination Architecture / Runtime Recovery Principles\", target context \"Agent Coordination Architecture\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/architecture/README.md",
    "targetAnchor": "runtime-recovery-principles",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "ae39ebfd15d5366bf1f3fdd54205e69a1a908e45bb3eeefc50715cacd36780b2",
    "targetAncestry": [
      "Agent Coordination Architecture"
    ]
  }
}
```

## Entry rationale-228

```json
{
  "entryId": "rationale-228",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_bb98dd8d67f6de65de2b005722ade1fd",
  "before": "The current successor at docs/platform/agent-coordination/architecture/runtime-recovery-design.md#10-proof-matrix supersedes the stale current-state claim shown at docs/platform/agent-coordination/architecture/runtime-recovery-design.md#unheaded-block-25 before 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The original frozen source remains conserved by the accepted carriage and its dated complete historical carrier; this is a truth correction, not a new move or retirement. The section-specific code/CLI evidence is recorded in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json. This successor is pending independent truth review, with no inherited approval.",
  "after": "Source: docs/architect/agent-coordination/architecture/runtime-recovery-design.md:268-270#unheaded-block-31 (current lines); unit SHA256 157e984f508d4ca3863cb3f03edd4d73ed28ef731058eb503058f7489ab564fc.\nTarget: docs/platform/agent-coordination/architecture/runtime-recovery-design.md:234-234#10-proof-matrix (current lines); unit SHA256 f376450edf5fe0f9938c58636ed160d27c633ebdfa090046b7f0ab5ea4d9bce5.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest f376450edf5fe0f9938c58636ed160d27c633ebdfa090046b7f0ab5ea4d9bce5 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 31\" → \"10. Proof Matrix\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/architecture/runtime-recovery-design.md#unheaded-block-31 under docs/platform/agent-coordination/architecture/runtime-recovery-design.md#10-proof-matrix; source context \"Runtime Recovery And Work Continuity / 10. Proof Matrix\", target context \"Runtime Recovery And Work Continuity\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 227,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_bb98dd8d67f6de65de2b005722ade1fd",
    "sourceUnitDigest": "157e984f508d4ca3863cb3f03edd4d73ed28ef731058eb503058f7489ab564fc",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/architecture/runtime-recovery-design.md:268-270#unheaded-block-31 (current lines); unit SHA256 157e984f508d4ca3863cb3f03edd4d73ed28ef731058eb503058f7489ab564fc.\nTarget: docs/platform/agent-coordination/architecture/runtime-recovery-design.md:234-234#10-proof-matrix (current lines); unit SHA256 f376450edf5fe0f9938c58636ed160d27c633ebdfa090046b7f0ab5ea4d9bce5.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest f376450edf5fe0f9938c58636ed160d27c633ebdfa090046b7f0ab5ea4d9bce5 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 31\" → \"10. Proof Matrix\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/architecture/runtime-recovery-design.md#unheaded-block-31 under docs/platform/agent-coordination/architecture/runtime-recovery-design.md#10-proof-matrix; source context \"Runtime Recovery And Work Continuity / 10. Proof Matrix\", target context \"Runtime Recovery And Work Continuity\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/architecture/runtime-recovery-design.md",
    "targetAnchor": "10-proof-matrix",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "f376450edf5fe0f9938c58636ed160d27c633ebdfa090046b7f0ab5ea4d9bce5",
    "targetAncestry": [
      "Runtime Recovery And Work Continuity"
    ]
  }
}
```

## Entry rationale-229

```json
{
  "entryId": "rationale-229",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_358f4471159df6d56b6f9ae689efc338",
  "before": "The current successor at docs/platform/agent-coordination/architecture/runtime-recovery-design.md#11-review-finding-resolution-and-limits supersedes the stale current-state claim shown at docs/platform/agent-coordination/architecture/runtime-recovery-design.md#unheaded-block-28 before 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The original frozen source remains conserved by the accepted carriage and its dated complete historical carrier; this is a truth correction, not a new move or retirement. The section-specific code/CLI evidence is recorded in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json. This successor is pending independent truth review, with no inherited approval.",
  "after": "Source: docs/architect/agent-coordination/architecture/runtime-recovery-design.md:318-321#unheaded-block-34 (current lines); unit SHA256 4e738024bef0fa77ab626479e21257efde2ff73b8d0652c1ce7f275de488949c.\nTarget: docs/platform/agent-coordination/architecture/runtime-recovery-design.md:265-265#11-review-finding-resolution-and-limits (current lines); unit SHA256 93c25a0d99ce3b063b6a246bf7c11aa06c23d8f8784603627c2454c7054dda55.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 93c25a0d99ce3b063b6a246bf7c11aa06c23d8f8784603627c2454c7054dda55 at 9aa37b12a329abd16900dad73ab98408e6ef3aec.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 34\" → \"11. Review Finding Resolution And Limits\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/architecture/runtime-recovery-design.md#unheaded-block-34 under docs/platform/agent-coordination/architecture/runtime-recovery-design.md#11-review-finding-resolution-and-limits; source context \"Runtime Recovery And Work Continuity / 11. Review Finding Resolution And Limits\", target context \"Runtime Recovery And Work Continuity\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 228,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_358f4471159df6d56b6f9ae689efc338",
    "sourceUnitDigest": "4e738024bef0fa77ab626479e21257efde2ff73b8d0652c1ce7f275de488949c",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/architecture/runtime-recovery-design.md:318-321#unheaded-block-34 (current lines); unit SHA256 4e738024bef0fa77ab626479e21257efde2ff73b8d0652c1ce7f275de488949c.\nTarget: docs/platform/agent-coordination/architecture/runtime-recovery-design.md:265-265#11-review-finding-resolution-and-limits (current lines); unit SHA256 93c25a0d99ce3b063b6a246bf7c11aa06c23d8f8784603627c2454c7054dda55.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 93c25a0d99ce3b063b6a246bf7c11aa06c23d8f8784603627c2454c7054dda55 at 9aa37b12a329abd16900dad73ab98408e6ef3aec.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 34\" → \"11. Review Finding Resolution And Limits\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/architecture/runtime-recovery-design.md#unheaded-block-34 under docs/platform/agent-coordination/architecture/runtime-recovery-design.md#11-review-finding-resolution-and-limits; source context \"Runtime Recovery And Work Continuity / 11. Review Finding Resolution And Limits\", target context \"Runtime Recovery And Work Continuity\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/architecture/runtime-recovery-design.md",
    "targetAnchor": "11-review-finding-resolution-and-limits",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "93c25a0d99ce3b063b6a246bf7c11aa06c23d8f8784603627c2454c7054dda55",
    "targetAncestry": [
      "Runtime Recovery And Work Continuity"
    ]
  }
}
```

## Entry rationale-230

```json
{
  "entryId": "rationale-230",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_c4295f45877ba69492d2a2ea9620acf0",
  "before": "The current successor at docs/platform/agent-coordination/architecture/runtime-recovery-design.md#11-review-finding-resolution-and-limits supersedes the stale current-state claim shown at docs/platform/agent-coordination/architecture/runtime-recovery-design.md#unheaded-block-29 before 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The original frozen source remains conserved by the accepted carriage and its dated complete historical carrier; this is a truth correction, not a new move or retirement. The section-specific code/CLI evidence is recorded in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json. This successor is pending independent truth review, with no inherited approval.",
  "after": "Source: docs/architect/agent-coordination/architecture/runtime-recovery-design.md:323-329#unheaded-block-35 (current lines); unit SHA256 d00a98ac29267f7fefda5343b52e11ebec9212c6042187f6d6cbda7fa1dd9983.\nTarget: docs/platform/agent-coordination/architecture/runtime-recovery-design.md:265-265#11-review-finding-resolution-and-limits (current lines); unit SHA256 93c25a0d99ce3b063b6a246bf7c11aa06c23d8f8784603627c2454c7054dda55.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 93c25a0d99ce3b063b6a246bf7c11aa06c23d8f8784603627c2454c7054dda55 at 9aa37b12a329abd16900dad73ab98408e6ef3aec.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 35\" → \"11. Review Finding Resolution And Limits\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/architecture/runtime-recovery-design.md#unheaded-block-35 under docs/platform/agent-coordination/architecture/runtime-recovery-design.md#11-review-finding-resolution-and-limits; source context \"Runtime Recovery And Work Continuity / 11. Review Finding Resolution And Limits\", target context \"Runtime Recovery And Work Continuity\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 229,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_c4295f45877ba69492d2a2ea9620acf0",
    "sourceUnitDigest": "d00a98ac29267f7fefda5343b52e11ebec9212c6042187f6d6cbda7fa1dd9983",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/architecture/runtime-recovery-design.md:323-329#unheaded-block-35 (current lines); unit SHA256 d00a98ac29267f7fefda5343b52e11ebec9212c6042187f6d6cbda7fa1dd9983.\nTarget: docs/platform/agent-coordination/architecture/runtime-recovery-design.md:265-265#11-review-finding-resolution-and-limits (current lines); unit SHA256 93c25a0d99ce3b063b6a246bf7c11aa06c23d8f8784603627c2454c7054dda55.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 93c25a0d99ce3b063b6a246bf7c11aa06c23d8f8784603627c2454c7054dda55 at 9aa37b12a329abd16900dad73ab98408e6ef3aec.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 35\" → \"11. Review Finding Resolution And Limits\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/architecture/runtime-recovery-design.md#unheaded-block-35 under docs/platform/agent-coordination/architecture/runtime-recovery-design.md#11-review-finding-resolution-and-limits; source context \"Runtime Recovery And Work Continuity / 11. Review Finding Resolution And Limits\", target context \"Runtime Recovery And Work Continuity\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/architecture/runtime-recovery-design.md",
    "targetAnchor": "11-review-finding-resolution-and-limits",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "93c25a0d99ce3b063b6a246bf7c11aa06c23d8f8784603627c2454c7054dda55",
    "targetAncestry": [
      "Runtime Recovery And Work Continuity"
    ]
  }
}
```

## Entry rationale-231

```json
{
  "entryId": "rationale-231",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_1f7afbbdef971d513de11c3bd40fd5c4",
  "before": "The current successor at docs/platform/agent-coordination/architecture/work-integration.md#core-invariant supersedes the stale current-state claim shown at docs/platform/agent-coordination/architecture/work-integration.md#unheaded-block-6 before 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The original frozen source remains conserved by the accepted carriage and its dated complete historical carrier; this is a truth correction, not a new move or retirement. The section-specific code/CLI evidence is recorded in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json. This successor is pending independent truth review, with no inherited approval.",
  "after": "Source: docs/architect/agent-coordination/architecture/work-integration.md:23-26#unheaded-block-4 (current lines); unit SHA256 90a3f10c8b66c61ff5fa68caa40f226ed0f521284af53013f3893753461f3d69.\nTarget: docs/platform/agent-coordination/architecture/work-integration.md:38-38#core-invariant (current lines); unit SHA256 9ef97539eb2db05c2771d137bf842dc6eb0341b8c7bb67abef70d01085689f44.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 9ef97539eb2db05c2771d137bf842dc6eb0341b8c7bb67abef70d01085689f44 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 1, target 1; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 4\" → \"Core Invariant\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/architecture/work-integration.md#unheaded-block-4 under docs/platform/agent-coordination/architecture/work-integration.md#core-invariant; source context \"Work Integration Boundaries / Core Invariant\", target context \"Work Integration Boundaries\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 230,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_1f7afbbdef971d513de11c3bd40fd5c4",
    "sourceUnitDigest": "90a3f10c8b66c61ff5fa68caa40f226ed0f521284af53013f3893753461f3d69",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/architecture/work-integration.md:23-26#unheaded-block-4 (current lines); unit SHA256 90a3f10c8b66c61ff5fa68caa40f226ed0f521284af53013f3893753461f3d69.\nTarget: docs/platform/agent-coordination/architecture/work-integration.md:38-38#core-invariant (current lines); unit SHA256 9ef97539eb2db05c2771d137bf842dc6eb0341b8c7bb67abef70d01085689f44.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 9ef97539eb2db05c2771d137bf842dc6eb0341b8c7bb67abef70d01085689f44 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 1, target 1; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 4\" → \"Core Invariant\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/architecture/work-integration.md#unheaded-block-4 under docs/platform/agent-coordination/architecture/work-integration.md#core-invariant; source context \"Work Integration Boundaries / Core Invariant\", target context \"Work Integration Boundaries\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/architecture/work-integration.md",
    "targetAnchor": "core-invariant",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "9ef97539eb2db05c2771d137bf842dc6eb0341b8c7bb67abef70d01085689f44",
    "targetAncestry": [
      "Work Integration Boundaries"
    ]
  }
}
```

## Entry rationale-232

```json
{
  "entryId": "rationale-232",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_11980b101ef098a18b76be8c2a78b8a5",
  "before": "The current successor at docs/platform/agent-coordination/architecture/work-integration.md#execution-may supersedes the stale current-state claim shown at docs/platform/agent-coordination/architecture/work-integration.md#unheaded-block-7 before 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The original frozen source remains conserved by the accepted carriage and its dated complete historical carrier; this is a truth correction, not a new move or retirement. The section-specific code/CLI evidence is recorded in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json. This successor is pending independent truth review, with no inherited approval.",
  "after": "Source: docs/architect/agent-coordination/architecture/work-integration.md:30-35#unheaded-block-5 (current lines); unit SHA256 2e9571c2bb74721903f37008fafd70c4a52ab893269e00ebb554313f9e12a29d.\nTarget: docs/platform/agent-coordination/architecture/work-integration.md:50-50#execution-may (current lines); unit SHA256 cfe78d1b5a6430df008c0eab711a34a6a09dc25e1b6357332466bfc0b20ecb52.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest cfe78d1b5a6430df008c0eab711a34a6a09dc25e1b6357332466bfc0b20ecb52 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 5\" → \"Execution May\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/architecture/work-integration.md#unheaded-block-5 under docs/platform/agent-coordination/architecture/work-integration.md#execution-may; source context \"Work Integration Boundaries / Coordination May\", target context \"Work Integration Boundaries\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 231,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_11980b101ef098a18b76be8c2a78b8a5",
    "sourceUnitDigest": "2e9571c2bb74721903f37008fafd70c4a52ab893269e00ebb554313f9e12a29d",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/architecture/work-integration.md:30-35#unheaded-block-5 (current lines); unit SHA256 2e9571c2bb74721903f37008fafd70c4a52ab893269e00ebb554313f9e12a29d.\nTarget: docs/platform/agent-coordination/architecture/work-integration.md:50-50#execution-may (current lines); unit SHA256 cfe78d1b5a6430df008c0eab711a34a6a09dc25e1b6357332466bfc0b20ecb52.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest cfe78d1b5a6430df008c0eab711a34a6a09dc25e1b6357332466bfc0b20ecb52 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 5\" → \"Execution May\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/architecture/work-integration.md#unheaded-block-5 under docs/platform/agent-coordination/architecture/work-integration.md#execution-may; source context \"Work Integration Boundaries / Coordination May\", target context \"Work Integration Boundaries\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/architecture/work-integration.md",
    "targetAnchor": "execution-may",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "cfe78d1b5a6430df008c0eab711a34a6a09dc25e1b6357332466bfc0b20ecb52",
    "targetAncestry": [
      "Work Integration Boundaries"
    ]
  }
}
```

## Entry rationale-233

```json
{
  "entryId": "rationale-233",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_f7da49f56bb5406dda1b7a9dc8321353",
  "before": "The current successor at docs/platform/agent-coordination/architecture/work-integration.md#execution-may-not supersedes the stale current-state claim shown at docs/platform/agent-coordination/architecture/work-integration.md#unheaded-block-8 before 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The original frozen source remains conserved by the accepted carriage and its dated complete historical carrier; this is a truth correction, not a new move or retirement. The section-specific code/CLI evidence is recorded in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json. This successor is pending independent truth review, with no inherited approval.",
  "after": "Source: docs/architect/agent-coordination/architecture/work-integration.md:39-44#unheaded-block-6 (current lines); unit SHA256 4a99e414746056ef825d6a8c53697323e396f7bfb593ce49204336b7dd672c42.\nTarget: docs/platform/agent-coordination/architecture/work-integration.md:60-60#execution-may-not (current lines); unit SHA256 978d2f83cf66c478cb560a7913d5a0a07656b38ab45d6b8cbdbd457e26ba1dca.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 978d2f83cf66c478cb560a7913d5a0a07656b38ab45d6b8cbdbd457e26ba1dca at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 6\" → \"Execution May Not\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/architecture/work-integration.md#unheaded-block-6 under docs/platform/agent-coordination/architecture/work-integration.md#execution-may-not; source context \"Work Integration Boundaries / Coordination May Not\", target context \"Work Integration Boundaries\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 232,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_f7da49f56bb5406dda1b7a9dc8321353",
    "sourceUnitDigest": "4a99e414746056ef825d6a8c53697323e396f7bfb593ce49204336b7dd672c42",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/architecture/work-integration.md:39-44#unheaded-block-6 (current lines); unit SHA256 4a99e414746056ef825d6a8c53697323e396f7bfb593ce49204336b7dd672c42.\nTarget: docs/platform/agent-coordination/architecture/work-integration.md:60-60#execution-may-not (current lines); unit SHA256 978d2f83cf66c478cb560a7913d5a0a07656b38ab45d6b8cbdbd457e26ba1dca.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 978d2f83cf66c478cb560a7913d5a0a07656b38ab45d6b8cbdbd457e26ba1dca at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 6\" → \"Execution May Not\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/architecture/work-integration.md#unheaded-block-6 under docs/platform/agent-coordination/architecture/work-integration.md#execution-may-not; source context \"Work Integration Boundaries / Coordination May Not\", target context \"Work Integration Boundaries\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/architecture/work-integration.md",
    "targetAnchor": "execution-may-not",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "978d2f83cf66c478cb560a7913d5a0a07656b38ab45d6b8cbdbd457e26ba1dca",
    "targetAncestry": [
      "Work Integration Boundaries"
    ]
  }
}
```

## Entry rationale-234

```json
{
  "entryId": "rationale-234",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_d95063546b7db6e2eefcccef844da414",
  "before": "The current successor at docs/platform/agent-coordination/contracts/assignment-run-runresult.md#assignment supersedes the stale current-state claim shown at docs/platform/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-7 before 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The original frozen source remains conserved by the accepted carriage and its dated complete historical carrier; this is a truth correction, not a new move or retirement. The section-specific code/CLI evidence is recorded in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json. This successor is pending independent truth review, with no inherited approval.",
  "after": "Source: docs/architect/agent-coordination/contracts/assignment-run-runresult.md:27-27#unheaded-block-5 (current lines); unit SHA256 5b70c17ccf304cd9b34dfd3d35a8c2de11bd40b4276e7b07fcbf563cc3f8321e.\nTarget: docs/platform/agent-coordination/contracts/assignment-run-runresult.md:42-42#assignment (current lines); unit SHA256 97396cdd3cbd4c71c571e6b253019014d445ce4d4e1f7eeef80e4b7a60fc4fa5.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 97396cdd3cbd4c71c571e6b253019014d445ce4d4e1f7eeef80e4b7a60fc4fa5 at 9aa37b12a329abd16900dad73ab98408e6ef3aec.\nLinks: source 0, target 1; 1 changed spellings/labels, 0 destination changes; 1 added, 0 removed.\nLink 1: \"none\" (none) → \"ADR-006\" (../decisions/ADR-006-assignment-provenance-and-contract-snapshot.md); resolved none → docs/platform/agent-coordination/decisions/ADR-006-assignment-provenance-and-contract-snapshot.md.\nHeading depth: not a heading → 2; title \"Unheaded block 5\" → \"Assignment\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-5 under docs/platform/agent-coordination/contracts/assignment-run-runresult.md#assignment; source context \"Assignment, Run, And RunResult Contract / Assignment\", target context \"Assignment, Run, And RunResult Contract\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 233,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_d95063546b7db6e2eefcccef844da414",
    "sourceUnitDigest": "5b70c17ccf304cd9b34dfd3d35a8c2de11bd40b4276e7b07fcbf563cc3f8321e",
    "claimKind": "contract",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/contracts/assignment-run-runresult.md:27-27#unheaded-block-5 (current lines); unit SHA256 5b70c17ccf304cd9b34dfd3d35a8c2de11bd40b4276e7b07fcbf563cc3f8321e.\nTarget: docs/platform/agent-coordination/contracts/assignment-run-runresult.md:42-42#assignment (current lines); unit SHA256 97396cdd3cbd4c71c571e6b253019014d445ce4d4e1f7eeef80e4b7a60fc4fa5.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 97396cdd3cbd4c71c571e6b253019014d445ce4d4e1f7eeef80e4b7a60fc4fa5 at 9aa37b12a329abd16900dad73ab98408e6ef3aec.\nLinks: source 0, target 1; 1 changed spellings/labels, 0 destination changes; 1 added, 0 removed.\nLink 1: \"none\" (none) → \"ADR-006\" (../decisions/ADR-006-assignment-provenance-and-contract-snapshot.md); resolved none → docs/platform/agent-coordination/decisions/ADR-006-assignment-provenance-and-contract-snapshot.md.\nHeading depth: not a heading → 2; title \"Unheaded block 5\" → \"Assignment\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-5 under docs/platform/agent-coordination/contracts/assignment-run-runresult.md#assignment; source context \"Assignment, Run, And RunResult Contract / Assignment\", target context \"Assignment, Run, And RunResult Contract\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/contracts/assignment-run-runresult.md",
    "targetAnchor": "assignment",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "97396cdd3cbd4c71c571e6b253019014d445ce4d4e1f7eeef80e4b7a60fc4fa5",
    "targetAncestry": [
      "Assignment, Run, And RunResult Contract"
    ]
  }
}
```

## Entry rationale-235

```json
{
  "entryId": "rationale-235",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_1a54f3db0a30f97f58e3f5bdf48a2f18",
  "before": "The current successor at docs/platform/agent-coordination/contracts/assignment-run-runresult.md#assignment supersedes the stale current-state claim shown at docs/platform/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-8 before 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The original frozen source remains conserved by the accepted carriage and its dated complete historical carrier; this is a truth correction, not a new move or retirement. The section-specific code/CLI evidence is recorded in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json. This successor is pending independent truth review, with no inherited approval.",
  "after": "Source: docs/architect/agent-coordination/contracts/assignment-run-runresult.md:29-31#unheaded-block-6 (current lines); unit SHA256 af0984cd7f09308d4738fa381f862a7dab8983aa738675df60636e0dc72e57b4.\nTarget: docs/platform/agent-coordination/contracts/assignment-run-runresult.md:42-42#assignment (current lines); unit SHA256 97396cdd3cbd4c71c571e6b253019014d445ce4d4e1f7eeef80e4b7a60fc4fa5.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 97396cdd3cbd4c71c571e6b253019014d445ce4d4e1f7eeef80e4b7a60fc4fa5 at 9aa37b12a329abd16900dad73ab98408e6ef3aec.\nLinks: source 0, target 1; 1 changed spellings/labels, 0 destination changes; 1 added, 0 removed.\nLink 1: \"none\" (none) → \"ADR-006\" (../decisions/ADR-006-assignment-provenance-and-contract-snapshot.md); resolved none → docs/platform/agent-coordination/decisions/ADR-006-assignment-provenance-and-contract-snapshot.md.\nHeading depth: not a heading → 2; title \"Unheaded block 6\" → \"Assignment\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-6 under docs/platform/agent-coordination/contracts/assignment-run-runresult.md#assignment; source context \"Assignment, Run, And RunResult Contract / Assignment\", target context \"Assignment, Run, And RunResult Contract\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 234,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_1a54f3db0a30f97f58e3f5bdf48a2f18",
    "sourceUnitDigest": "af0984cd7f09308d4738fa381f862a7dab8983aa738675df60636e0dc72e57b4",
    "claimKind": "contract",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/contracts/assignment-run-runresult.md:29-31#unheaded-block-6 (current lines); unit SHA256 af0984cd7f09308d4738fa381f862a7dab8983aa738675df60636e0dc72e57b4.\nTarget: docs/platform/agent-coordination/contracts/assignment-run-runresult.md:42-42#assignment (current lines); unit SHA256 97396cdd3cbd4c71c571e6b253019014d445ce4d4e1f7eeef80e4b7a60fc4fa5.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 97396cdd3cbd4c71c571e6b253019014d445ce4d4e1f7eeef80e4b7a60fc4fa5 at 9aa37b12a329abd16900dad73ab98408e6ef3aec.\nLinks: source 0, target 1; 1 changed spellings/labels, 0 destination changes; 1 added, 0 removed.\nLink 1: \"none\" (none) → \"ADR-006\" (../decisions/ADR-006-assignment-provenance-and-contract-snapshot.md); resolved none → docs/platform/agent-coordination/decisions/ADR-006-assignment-provenance-and-contract-snapshot.md.\nHeading depth: not a heading → 2; title \"Unheaded block 6\" → \"Assignment\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-6 under docs/platform/agent-coordination/contracts/assignment-run-runresult.md#assignment; source context \"Assignment, Run, And RunResult Contract / Assignment\", target context \"Assignment, Run, And RunResult Contract\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/contracts/assignment-run-runresult.md",
    "targetAnchor": "assignment",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "97396cdd3cbd4c71c571e6b253019014d445ce4d4e1f7eeef80e4b7a60fc4fa5",
    "targetAncestry": [
      "Assignment, Run, And RunResult Contract"
    ]
  }
}
```

## Entry rationale-236

```json
{
  "entryId": "rationale-236",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_b0ed3798ba3d726ad708747bf9f3e417",
  "before": "The current successor at docs/platform/agent-coordination/contracts/assignment-run-runresult.md#run-phases-and-admission supersedes the stale current-state claim shown at docs/platform/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-15 before 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The original frozen source remains conserved by the accepted carriage and its dated complete historical carrier; this is a truth correction, not a new move or retirement. The section-specific code/CLI evidence is recorded in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json. This successor is pending independent truth review, with no inherited approval.",
  "after": "Source: docs/architect/agent-coordination/contracts/assignment-run-runresult.md:68-76#unheaded-block-13 (current lines); unit SHA256 33dd801eb1c88a8c6a7a04ce3c14c3aee10a861214e2a30761e57c30e04f1a0b.\nTarget: docs/platform/agent-coordination/contracts/assignment-run-runresult.md:88-88#run-phases-and-admission (current lines); unit SHA256 73bad58d6b9f94e6a764be7e1d7a8be5c2f995043e9a15b8ac617d7edd96a295.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 73bad58d6b9f94e6a764be7e1d7a8be5c2f995043e9a15b8ac617d7edd96a295 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 13\" → \"Run Phases And Admission\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-13 under docs/platform/agent-coordination/contracts/assignment-run-runresult.md#run-phases-and-admission; source context \"Assignment, Run, And RunResult Contract / Run / Run Phases And Admission\", target context \"Assignment, Run, And RunResult Contract / Run\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 235,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_b0ed3798ba3d726ad708747bf9f3e417",
    "sourceUnitDigest": "33dd801eb1c88a8c6a7a04ce3c14c3aee10a861214e2a30761e57c30e04f1a0b",
    "claimKind": "contract",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/contracts/assignment-run-runresult.md:68-76#unheaded-block-13 (current lines); unit SHA256 33dd801eb1c88a8c6a7a04ce3c14c3aee10a861214e2a30761e57c30e04f1a0b.\nTarget: docs/platform/agent-coordination/contracts/assignment-run-runresult.md:88-88#run-phases-and-admission (current lines); unit SHA256 73bad58d6b9f94e6a764be7e1d7a8be5c2f995043e9a15b8ac617d7edd96a295.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 73bad58d6b9f94e6a764be7e1d7a8be5c2f995043e9a15b8ac617d7edd96a295 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 13\" → \"Run Phases And Admission\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-13 under docs/platform/agent-coordination/contracts/assignment-run-runresult.md#run-phases-and-admission; source context \"Assignment, Run, And RunResult Contract / Run / Run Phases And Admission\", target context \"Assignment, Run, And RunResult Contract / Run\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/contracts/assignment-run-runresult.md",
    "targetAnchor": "run-phases-and-admission",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "73bad58d6b9f94e6a764be7e1d7a8be5c2f995043e9a15b8ac617d7edd96a295",
    "targetAncestry": [
      "Assignment, Run, And RunResult Contract",
      "Run"
    ]
  }
}
```

## Entry rationale-237

```json
{
  "entryId": "rationale-237",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_b5e9a0cb05c450974c572df6c74d80c0",
  "before": "The current successor at docs/platform/agent-coordination/contracts/assignment-run-runresult.md#run-phases-and-admission supersedes the stale current-state claim shown at docs/platform/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-17 before 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The original frozen source remains conserved by the accepted carriage and its dated complete historical carrier; this is a truth correction, not a new move or retirement. The section-specific code/CLI evidence is recorded in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json. This successor is pending independent truth review, with no inherited approval.",
  "after": "Source: docs/architect/agent-coordination/contracts/assignment-run-runresult.md:94-109#unheaded-block-16 (current lines); unit SHA256 5d61f284eb32792d2bc93158e694eebb660af9e6bce9e66feeb577f010182ed7.\nTarget: docs/platform/agent-coordination/contracts/assignment-run-runresult.md:88-88#run-phases-and-admission (current lines); unit SHA256 73bad58d6b9f94e6a764be7e1d7a8be5c2f995043e9a15b8ac617d7edd96a295.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 73bad58d6b9f94e6a764be7e1d7a8be5c2f995043e9a15b8ac617d7edd96a295 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 16\" → \"Run Phases And Admission\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-16 under docs/platform/agent-coordination/contracts/assignment-run-runresult.md#run-phases-and-admission; source context \"Assignment, Run, And RunResult Contract / Run / Run Phases And Admission\", target context \"Assignment, Run, And RunResult Contract / Run\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 236,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_b5e9a0cb05c450974c572df6c74d80c0",
    "sourceUnitDigest": "5d61f284eb32792d2bc93158e694eebb660af9e6bce9e66feeb577f010182ed7",
    "claimKind": "contract",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/contracts/assignment-run-runresult.md:94-109#unheaded-block-16 (current lines); unit SHA256 5d61f284eb32792d2bc93158e694eebb660af9e6bce9e66feeb577f010182ed7.\nTarget: docs/platform/agent-coordination/contracts/assignment-run-runresult.md:88-88#run-phases-and-admission (current lines); unit SHA256 73bad58d6b9f94e6a764be7e1d7a8be5c2f995043e9a15b8ac617d7edd96a295.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 73bad58d6b9f94e6a764be7e1d7a8be5c2f995043e9a15b8ac617d7edd96a295 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 16\" → \"Run Phases And Admission\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-16 under docs/platform/agent-coordination/contracts/assignment-run-runresult.md#run-phases-and-admission; source context \"Assignment, Run, And RunResult Contract / Run / Run Phases And Admission\", target context \"Assignment, Run, And RunResult Contract / Run\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/contracts/assignment-run-runresult.md",
    "targetAnchor": "run-phases-and-admission",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "73bad58d6b9f94e6a764be7e1d7a8be5c2f995043e9a15b8ac617d7edd96a295",
    "targetAncestry": [
      "Assignment, Run, And RunResult Contract",
      "Run"
    ]
  }
}
```

## Entry rationale-238

```json
{
  "entryId": "rationale-238",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_6a7f1f2db9e46be482d5db01438a7377",
  "before": "The current successor at docs/platform/agent-coordination/contracts/assignment-run-runresult.md#proposed-runtime-recovery-amendment supersedes the stale current-state claim shown at docs/platform/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-21 before 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The original frozen source remains conserved by the accepted carriage and its dated complete historical carrier; this is a truth correction, not a new move or retirement. The section-specific code/CLI evidence is recorded in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json. This successor is pending independent truth review, with no inherited approval.",
  "after": "Source: docs/architect/agent-coordination/contracts/assignment-run-runresult.md:141-141#unheaded-block-19 (current lines); unit SHA256 dab477c9862fdc35259c1cdaa7c472cd37ff9af0ebd825423e14947c31375b21.\nTarget: docs/platform/agent-coordination/contracts/assignment-run-runresult.md:148-148#proposed-runtime-recovery-amendment (current lines); unit SHA256 99a1afe1389f0f8751791b35c90eeada1d947fb81e097f8625a6ebcb499355e1.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 99a1afe1389f0f8751791b35c90eeada1d947fb81e097f8625a6ebcb499355e1 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 1; 1 changed spellings/labels, 0 destination changes; 1 added, 0 removed.\nLink 1: \"none\" (none) → \"Runtime Recovery Design\" (../architecture/runtime-recovery-design.md); resolved none → docs/platform/agent-coordination/architecture/runtime-recovery-design.md.\nHeading depth: not a heading → 3; title \"Unheaded block 19\" → \"Proposed Runtime Recovery Amendment\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-19 under docs/platform/agent-coordination/contracts/assignment-run-runresult.md#proposed-runtime-recovery-amendment; source context \"Assignment, Run, And RunResult Contract / Run / Proposed Runtime Recovery Amendment\", target context \"Assignment, Run, And RunResult Contract / Run\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 237,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_6a7f1f2db9e46be482d5db01438a7377",
    "sourceUnitDigest": "dab477c9862fdc35259c1cdaa7c472cd37ff9af0ebd825423e14947c31375b21",
    "claimKind": "contract",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/contracts/assignment-run-runresult.md:141-141#unheaded-block-19 (current lines); unit SHA256 dab477c9862fdc35259c1cdaa7c472cd37ff9af0ebd825423e14947c31375b21.\nTarget: docs/platform/agent-coordination/contracts/assignment-run-runresult.md:148-148#proposed-runtime-recovery-amendment (current lines); unit SHA256 99a1afe1389f0f8751791b35c90eeada1d947fb81e097f8625a6ebcb499355e1.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 99a1afe1389f0f8751791b35c90eeada1d947fb81e097f8625a6ebcb499355e1 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 1; 1 changed spellings/labels, 0 destination changes; 1 added, 0 removed.\nLink 1: \"none\" (none) → \"Runtime Recovery Design\" (../architecture/runtime-recovery-design.md); resolved none → docs/platform/agent-coordination/architecture/runtime-recovery-design.md.\nHeading depth: not a heading → 3; title \"Unheaded block 19\" → \"Proposed Runtime Recovery Amendment\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-19 under docs/platform/agent-coordination/contracts/assignment-run-runresult.md#proposed-runtime-recovery-amendment; source context \"Assignment, Run, And RunResult Contract / Run / Proposed Runtime Recovery Amendment\", target context \"Assignment, Run, And RunResult Contract / Run\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/contracts/assignment-run-runresult.md",
    "targetAnchor": "proposed-runtime-recovery-amendment",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "99a1afe1389f0f8751791b35c90eeada1d947fb81e097f8625a6ebcb499355e1",
    "targetAncestry": [
      "Assignment, Run, And RunResult Contract",
      "Run"
    ]
  }
}
```

## Entry rationale-239

```json
{
  "entryId": "rationale-239",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_a30e0ef293a9486cb916f09f5e245e6a",
  "before": "The same owned unit is rebound to the corrected text authorized by A20/A22 in f4bc8027ff2ef34b7c7c1b084330b62fdcbc353f. The old target wording is superseded in place, with the legacy source and accepted historical carriage unchanged. Independent review must check the current shown text against the section truth ledger; no prior text approval is carried. Previous rationale (historical): The current successor at docs/platform/agent-coordination/contracts/assignment-run-runresult.md#dispatch-operability-addendum supersedes the stale current-state claim shown at docs/platform/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-34 before 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The original frozen source remains conserved by the accepted carriage and its dated complete historical carrier; this is a truth correction, not a new move or retirement. The section-specific code/CLI evidence is recorded in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json. This successor is pending independent truth review, with no inherited approval.",
  "after": "Source: docs/architect/agent-coordination/contracts/assignment-run-runresult.md:258-261#unheaded-block-33 (current lines); unit SHA256 f2fcc5595e8ec8c27d24cad2115755f77284c19d9f55686485e59201b8a53a34.\nTarget: docs/platform/agent-coordination/contracts/assignment-run-runresult.md:252-252#dispatch-operability-addendum (current lines); unit SHA256 ae15a88c7eb4499399761dd51ce845613c7d19ad7a6ab7578dec7ba0226ed93c.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest ae15a88c7eb4499399761dd51ce845613c7d19ad7a6ab7578dec7ba0226ed93c at 9351a257f718ae8f41545792fda3b477a0616e9e.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 33\" → \"Dispatch Operability Addendum\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-33 under docs/platform/agent-coordination/contracts/assignment-run-runresult.md#dispatch-operability-addendum; source context \"Assignment, Run, And RunResult Contract / RunResult / Dispatch Operability Addendum\", target context \"Assignment, Run, And RunResult Contract / RunResult\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 238,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_a30e0ef293a9486cb916f09f5e245e6a",
    "sourceUnitDigest": "f2fcc5595e8ec8c27d24cad2115755f77284c19d9f55686485e59201b8a53a34",
    "claimKind": "contract",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/contracts/assignment-run-runresult.md:258-261#unheaded-block-33 (current lines); unit SHA256 f2fcc5595e8ec8c27d24cad2115755f77284c19d9f55686485e59201b8a53a34.\nTarget: docs/platform/agent-coordination/contracts/assignment-run-runresult.md:252-252#dispatch-operability-addendum (current lines); unit SHA256 ae15a88c7eb4499399761dd51ce845613c7d19ad7a6ab7578dec7ba0226ed93c.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest ae15a88c7eb4499399761dd51ce845613c7d19ad7a6ab7578dec7ba0226ed93c at 9351a257f718ae8f41545792fda3b477a0616e9e.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 33\" → \"Dispatch Operability Addendum\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-33 under docs/platform/agent-coordination/contracts/assignment-run-runresult.md#dispatch-operability-addendum; source context \"Assignment, Run, And RunResult Contract / RunResult / Dispatch Operability Addendum\", target context \"Assignment, Run, And RunResult Contract / RunResult\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/contracts/assignment-run-runresult.md",
    "targetAnchor": "dispatch-operability-addendum",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "ae15a88c7eb4499399761dd51ce845613c7d19ad7a6ab7578dec7ba0226ed93c",
    "targetAncestry": [
      "Assignment, Run, And RunResult Contract",
      "RunResult"
    ]
  }
}
```

## Entry rationale-240

```json
{
  "entryId": "rationale-240",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_01a4127478b48d367f29f82a84b96736",
  "before": "The same owned unit is rebound to the corrected text authorized by A20/A22 in f4bc8027ff2ef34b7c7c1b084330b62fdcbc353f. The old target wording is superseded in place, with the legacy source and accepted historical carriage unchanged. Independent review must check the current shown text against the section truth ledger; no prior text approval is carried. Previous rationale (historical): The current successor at docs/platform/agent-coordination/contracts/assignment-run-runresult.md#dispatch-operability-addendum supersedes the stale current-state claim shown at docs/platform/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-36 before 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The original frozen source remains conserved by the accepted carriage and its dated complete historical carrier; this is a truth correction, not a new move or retirement. The section-specific code/CLI evidence is recorded in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json. This successor is pending independent truth review, with no inherited approval.",
  "after": "Source: docs/architect/agent-coordination/contracts/assignment-run-runresult.md:277-284#unheaded-block-35 (current lines); unit SHA256 4a33074fe5079abc1726c504288cdcd6fe16dca8a2554166ba2588dfb8c4e02f.\nTarget: docs/platform/agent-coordination/contracts/assignment-run-runresult.md:252-252#dispatch-operability-addendum (current lines); unit SHA256 ae15a88c7eb4499399761dd51ce845613c7d19ad7a6ab7578dec7ba0226ed93c.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest ae15a88c7eb4499399761dd51ce845613c7d19ad7a6ab7578dec7ba0226ed93c at 9351a257f718ae8f41545792fda3b477a0616e9e.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 35\" → \"Dispatch Operability Addendum\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-35 under docs/platform/agent-coordination/contracts/assignment-run-runresult.md#dispatch-operability-addendum; source context \"Assignment, Run, And RunResult Contract / RunResult / Dispatch Operability Addendum\", target context \"Assignment, Run, And RunResult Contract / RunResult\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 239,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_01a4127478b48d367f29f82a84b96736",
    "sourceUnitDigest": "4a33074fe5079abc1726c504288cdcd6fe16dca8a2554166ba2588dfb8c4e02f",
    "claimKind": "contract",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/contracts/assignment-run-runresult.md:277-284#unheaded-block-35 (current lines); unit SHA256 4a33074fe5079abc1726c504288cdcd6fe16dca8a2554166ba2588dfb8c4e02f.\nTarget: docs/platform/agent-coordination/contracts/assignment-run-runresult.md:252-252#dispatch-operability-addendum (current lines); unit SHA256 ae15a88c7eb4499399761dd51ce845613c7d19ad7a6ab7578dec7ba0226ed93c.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest ae15a88c7eb4499399761dd51ce845613c7d19ad7a6ab7578dec7ba0226ed93c at 9351a257f718ae8f41545792fda3b477a0616e9e.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 35\" → \"Dispatch Operability Addendum\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-35 under docs/platform/agent-coordination/contracts/assignment-run-runresult.md#dispatch-operability-addendum; source context \"Assignment, Run, And RunResult Contract / RunResult / Dispatch Operability Addendum\", target context \"Assignment, Run, And RunResult Contract / RunResult\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/contracts/assignment-run-runresult.md",
    "targetAnchor": "dispatch-operability-addendum",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "ae15a88c7eb4499399761dd51ce845613c7d19ad7a6ab7578dec7ba0226ed93c",
    "targetAncestry": [
      "Assignment, Run, And RunResult Contract",
      "RunResult"
    ]
  }
}
```

