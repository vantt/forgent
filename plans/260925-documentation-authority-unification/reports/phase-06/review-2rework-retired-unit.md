# Independent re-review: retired candidate unit (contracts README transition paragraph)

Reviewer: reviewer:claude-session:4df9e88c@2026-10-08
Author session: codex-session:1@2026-10-08
Review mode: ordinary

Request: reports/phase-06/review-request-2-rework.md (Retired candidate unit); record: ledger/retired-unit-decisions.json, row claim_9f6e15a2ce50865f7d2499a31dad819f. Source (legacy) pin 76585861f718c7ef0dd6150d9b92a7c7baaa3ec4; old candidate pin 0a41d793e60631aa9073c73a941f641548862b6c; review tree e7d95eb414e72193cac063836ce8b99d06529bb2.
Retired unit: docs/platform/agent-coordination/contracts/README.md#unheaded-block-4 at the old candidate pin; shown target: the same file#unheaded-block-2.

This verdict is digest-bound to the displayed units. The retired unit is not passed to --apply-review, and the other record in the file (source-inventory.md, claim_ffa208224c13eeca2cdc3a874735b802) is unchanged and was accepted in the first review.

## Verification performed

- Extracted both units with the repository extractor: the old unit at 0a41d793e is the three-line paragraph 'Read the Agent Coordination Foundation Vision first. Contracts define exact behavior beneath it and cannot make Work or a predeclared protocol universally mandatory.' (181 characters, digest 80bfb53cf0...), as recorded; the shown target unit at the review tree is the transition note plus the same three-line paragraph (438 characters, digest 0fc5290332...), as recorded.
- The paragraph occurs exactly once in the candidate file at the review tree (line 31) and exactly once in the pinned legacy file (legacy README lines 13-16, one block with the transition note). The legacy block is claim_d45237a22e355cee523c6c5b51c50454, an accepted script-proven exact row (legacy unheaded-block-3 to candidate unheaded-block-2, equal digest 0fc5290332...), so the paragraph is still bound by a source claim.
- Diffed the file against the old candidate (git diff 0a41d793e..HEAD): the only change is the removal of the four lines (paragraph and blank line) that duplicated the paragraph under Migration Status; no other byte of the file changed. The unit that disappeared was therefore carried source text, not candidate-native material, as the record's rework note says.
- The new decision row passes the unchanged invariants for a supersede: owner and anchor exist, both digests are full sha256, rationale is specific and names the exact claim that still binds the block, and no authority status changes.

## Verdict

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|
| claim_9f6e15a2ce50865f7d2499a31dad819f | ok | I recomputed the retired unit (old candidate unheaded-block-4 of contracts/README.md at 0a41d793e, 181 characters) and the shown target (unheaded-block-2 at the review tree, 438 characters) with the repository extractor; both digests equal the record. The paragraph survives once, inside the exact-proven transition block that claim_d45237a2 binds, and the only file change since the old candidate is deleting the redundant copy, so supersede loses nothing and invents nothing. | 80bfb53cf02c8e8deb576d9f9bc51f6852d6235c3a5d45ad0ac2e69534d8aa84 | 0fc5290332da88be032e4397964b690893aca762028c747fd13fc94faa8af854 |
