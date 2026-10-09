# Review 2 whole-area: folded reworks, current-owner text and promoted edits
Reviewer: reviewer:claude-session:4df9e88c@2026-10-09
Review mode: ordinary
Author session: codex-session:1@2026-10-08
Request: reports/phase-06/review-request-2-whole-area.md (reviewed tree 2a5d186291aa43ab44ae4cae5642316afde4e355; classification pin 7880fbc74b07c3667ebaa61f2b0561b5d80471b5, content pin 9134ff4e531bb7e75b188ed272188f6efbfe430d, accounting pin 6df71985bf87b30a7a865e31f22c37ec22a8c8c8, owner decision A16 d23045c2de83e3508fda8fd2580b43ece2e1e046)
Reading method: diff-based reading of every row, full text for flagged rows; current-state text checked against current code; owner-approved 2026-10-08/09 (A5, A6, A11-A16).

Scope: the small reworks of the reframe review folded into the A16 pass (A16 item 4), the portal and spec current-owner text, and the promoted-document edits.

## Result

- Eleven own-source legacy rationale rows: 11/11 verified; verdict ok for all eleven in the shard reports (judgment-01: 2, judgment-02: 9). 
- Five dangling classification rows: 5/5 resolved; four retire into the history carriers (their retired rows are pending moves, byte-verified), the fifth (spec.md Current Summary) survives with changed text and has a new receipt.
- spec.md no longer names CoordinationProtocol as a current or optional contract; system-context.md Runtime Profiles and semantic-cli-surface.md section 4 exist only in history carriers.
- Portal README.md and spec.md: ok (every current-state sentence verified against code, see review-2whole-files.md). One receipt of spec.md is rework (unsupported Contracts Consumed row).

## 1. Eleven source rationale rows (own-source legacy snapshots)

The earlier review found that the boilerplate rationale claimed the whole shown text was contained in a normalised/interleaved candidate snapshot, which was false for these sources (the migration-status blockquote and header lines were missing or split by the promotion block). Each row now binds the complete own-source legacy snapshot under history/retired-engine/legacy/. Checks: the snapshot file equals the legacy file at HEAD byte for byte (preservation proof rows 72-74, sha256 equals the legacy input: README 75303f27d6e8..., system-context db2d23502ec7..., ledger 1a0a6e7df11d...); the source unit recomputed from the legacy file equals the sidecar digest; the complete unit text, including the three-line "Migration status" blockquote and every status line, is found contiguously in the snapshot body; the rationale says exactly that and no longer claims normalisation or interleaving.

| Claim | Source unit | Lines | Contained | Shard verdict | Source digest | Target digest |
|---|---|---|---|---|---|---|
| claim_245d7950762aca2fdf5098e550a2fdbe | legacy:architecture/system-context.md#agent-coordination-system-context | 1-1 | yes (byte-for-byte) | ok | 939f42f6a878463effa3202a4a227168f670ed5968794bb10797bf9b3ce2a8ed | cf6a18c0b3438e752c7f5602c0d4250ab85d45811863b6f3193bf0cc48e5be1a |
| claim_53c0908c64387834798c02723baf321b | legacy:intent-preservation-ledger.md#agent-coordination-intent-preservation-ledger | 1-1 | yes (byte-for-byte) | ok | 169e9ae80f9041a6adab8f3630f86e8e6deb179c38aa9ba8c89e0ff73f6e2b18 | 7638b53ad99b8cd4a6fa398fe81fdffa175090e5ec5f2851e614239fa9c6ae01 |
| claim_d7b301f8fb707e0d981814d24bb15baf | legacy:README.md#agent-coordination-documentation | 1-1 | yes (byte-for-byte) | ok | cf7c1cc1403beef5ea2e3cded6d5e65473661550a1b985676abfa839e2aa7f1c | 7bc6408cefac2408da797d15ad0ad568c5939a412882fa1e1f321a3304d43e91 |
| claim_de80414d5b62cfde5c30e15879962289 | legacy:README.md#unheaded-block-7 | 29-30 | yes (byte-for-byte) | ok | 1b78a56ae2680e497ffc0723ea87e2bac17e8b8d346e618803ae3c7f5837bc7f | 7bc6408cefac2408da797d15ad0ad568c5939a412882fa1e1f321a3304d43e91 |
| claim_63c89f3510a09c65e0dd06e184f6e24d | legacy:README.md#understand-the-system | 34-34 | yes (byte-for-byte) | ok | dd384883424cddf05827438b41d12dbf91008e78366622ff6b38ee2288e77c3c | 7bc6408cefac2408da797d15ad0ad568c5939a412882fa1e1f321a3304d43e91 |
| claim_a1b390e16f85b08ee756e6f793954ce0 | legacy:README.md#unheaded-block-8 | 36-47 | yes (byte-for-byte) | ok | a498d936fab714378e8e165b81ac96113d1a96bbb6733b021cad79b8c98d1544 | 7bc6408cefac2408da797d15ad0ad568c5939a412882fa1e1f321a3304d43e91 |
| claim_0a8720e6b18bf3e9836991f89d92aa59 | legacy:README.md#continue-the-design-discussion | 56-56 | yes (byte-for-byte) | ok | a551a39b8d90abd668a35d19c74e0dfbc2d348f4c4a4a4853b376fec3b06971f | 7bc6408cefac2408da797d15ad0ad568c5939a412882fa1e1f321a3304d43e91 |
| claim_3887b3a9933305705f64fab4a1d14b0d | legacy:README.md#unheaded-block-10 | 58-61 | yes (byte-for-byte) | ok | 75843dcc73add1b395d0b4b9f4daa5e46405976c4cbe807885e769ee83bceb04 | 7bc6408cefac2408da797d15ad0ad568c5939a412882fa1e1f321a3304d43e91 |
| claim_57167ac5929039c97a19f854a22dc37d | legacy:README.md#unheaded-block-11 | 63-76 | yes (byte-for-byte) | ok | f169bed8698bf5c611f4bec81b487b9c1ca498b4cf5c3319736d79b17596a88c | 7bc6408cefac2408da797d15ad0ad568c5939a412882fa1e1f321a3304d43e91 |
| claim_ec4ad6bded60c2ae61dd970b01686cab | legacy:README.md#active-design-frontier | 133-133 | yes (byte-for-byte) | ok | a6a5bc3f546796a71f0d9f96d5f7d7a2ed848c2998b515d21aa328692ffe1c21 | 7bc6408cefac2408da797d15ad0ad568c5939a412882fa1e1f321a3304d43e91 |
| claim_77c22cc44269a12d78fdd3cb5468144e | legacy:README.md#unheaded-block-21 | 156-159 | yes (byte-for-byte) | ok | dbd6a3c07ce9c30b16309949d99479ecdbbf3c0b6b139333adcea479c49e1b10 | 7bc6408cefac2408da797d15ad0ad568c5939a412882fa1e1f321a3304d43e91 |

## 2. Five dangling classification rows

The withdrawn receipts described retained prose that referred to a diagram, map or table that had been moved to the snapshot. Checked against HEAD and the pending ledgers (whole-area-receipt-withdrawals.json):

| Claim | Previous location | State at HEAD | History successor | Retired row | Result |
|---|---|---|---|---|---|
| claim_57cc129eeedc6624d9e0f94e0419b1ec | architecture/system-context.md#component-and-runtime-flow | file absent (moved to history) | history/retired-engine/files/architecture/system-context.md#literal-snapshot | yes | retired row move/pending: reviewed in review-2whole-retired-unit.md |
| claim_1ec34eb7139574fbbcaac476ee82a51a | proposals/semantic-cli-surface.md#2-giải-pháp-kiến-trúc-the-solution | file absent (moved to history) | history/retired-engine/files/proposals/semantic-cli-surface.md#literal-snapshot | yes | retired row move/pending: reviewed in review-2whole-retired-unit.md |
| claim_1b9e2ea95285bcf3db525a371492b405 | spec.md#current-summary | unit still present with changed text (digest differs) | history/retired-engine/files/spec.md#literal-snapshot | none | new candidate-native-content receipt: verdict ok |
| claim_2361d048c1d9443043e89eb5fb31a6d9 | subcomponents/README.md#agent-coordination-subcomponents | file absent (moved to history) | history/retired-engine/files/subcomponents/README.md#literal-snapshot | yes | retired row move/pending: reviewed in review-2whole-retired-unit.md |
| claim_b27d445f9ef1a6c7e7d87ae491066f93 | verification/implementation-alignment.md#agent-coordination-implementation-alignment | file absent (moved to history) | history/retired-engine/files/verification/implementation-alignment.md#literal-snapshot | yes | retired row move/pending: reviewed in review-2whole-retired-unit.md |

No current page asserts a design rule about a figure, map or table that is no longer there: the four units no longer exist outside history, and the surviving spec.md Current Summary unit carries only owner facts (see section 3).

## 3. spec.md and the CoordinationProtocol sentence

- grep: CoordinationProtocol appears in spec.md only at line 13 ("Do not use this for: Reinstating CoordinationSession, CoordinationProtocol or FlowDefinition as current implementation") and line 30 ("not an assertion that CoordinationProtocol is a current prerequisite or entity"); both are negations. FlowDefinition and CoordinationSession appear only in negations or links to history.
- Current Summary owner facts verified against code: Unit collaboration is selected by CollaborationPattern (src/runner/execution/patterns/index.mjs:34-46) and executable Workflow nodes call the Unit execution core (src/workflow/runner.mjs:419-428, runUnit at :420); Core Entities link src/runner/execution/unit.mjs, patterns/index.mjs and src/workflow/runner.mjs, which exist.
- Open item: the Contracts Consumed row "Host invocation and provider routing ... Dispatch/executor integration consumes host-owned process routing" has no code evidence (src/runner/dispatch references no InvocationService, OperationCatalog or HostInvocation; the host invocation service is in packages/host-runtime/rust and apps/fgos*), and "Optional Work integration" is unevidenced: rework on the spec.md#contracts-consumed receipt (claim_021a84c1334927bc8bba62ec12584496).
- Observation: spec.md and README name only CollaborationPattern and the Workflow runner as execution owners, while the retained architecture files describe the Assignment/Run/dispatch chain; either the spec should name src/runner/dispatch as an owner or those files are not current (see review-2whole-files.md).

## 4. system-context.md Runtime Profiles and semantic-cli-surface.md section 4

- git grep -i "runtime profile" outside history/ and the verification payloads: no hits. The section exists at history/retired-engine/files/architecture/system-context.md:117, history/retired-engine/architecture/system-context.md:146 and the legacy snapshot :97, all inside the `~~~~text` literal fence of non-authority carriers. system-context.md itself is absent at HEAD (class i, moved whole, classification verdict ok in review-2whole-files.md).
- semantic-cli-surface.md (section 4 "Bề Mặt CLI Mới (10 Verbs + 1 View)") exists only at history/retired-engine/files/proposals/semantic-cli-surface.md:73 and history/retired-engine/proposals/semantic-cli-surface.md:74 (earlier carrier, byte-equal to the 54c2698ee file); the portal links it as "Historical CLI proposal". The proposed verbs are not a current CLI: `fgos --help --json` lists 73 commands, none named coordination.

## 5. Portal README.md

A16 repoint of the portal: the three code/CLI facts are verified (retirement commit 2180b4e72 is an ancestor of HEAD and docs/specs/runner.md:1312-1314 marks the engine history; CollaborationPattern at src/runner/execution/patterns/index.mjs:34-46 and Workflow runner at src/workflow/runner.mjs:419-428; the machine-readable manifest has 73 commands and none matches coordination); all 18 live non-history files are linked, every relative link and all 46 anchor links resolve; the SKILL citation core/skills/fgos-architecture-panel/SKILL.md:135-142 is correct. Verdict ok. The portal text "dispatch/result/recovery boundaries that have surviving executable owners" is true, but the portal routes readers to files that are over-cut (review-2whole-files.md finding 5).

## 6. Promoted edits

See review-2whole-moves.md (promoted-document edits and link plan). The shared promoted file docs/platform/intent-preservation-ledger.md changed by exactly one row (git diff: 1 insertion, 1 deletion); the new text is true (the target is the retired-engine ledger snapshot, anchor resolves). No owner checkpoint is bypassed: the edit is logged in promoted-edits.md; semantic acceptance of the portal rests on this review.

## Disagreements and unproven assertions

- None for items 1, 2, 4. Item 3 has the one rework receipt above plus the ownership observation.
