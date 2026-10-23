# G0 batch g0-b2: review of changed bindings at 8a9385eca

Result: 50 rows. 49 APPROVE, 1 REWORK.

## How the checks were run
- **Binding digest.** The hash is SHA-256 of Python `json.dumps({targetOwner,targetAnchor,targetUnitDigest,targetAncestry,successorGroup}, sort_keys=True, ensure_ascii=False)`, with default separators and no trailing newline. A missing key becomes null. The values come from the shard row at `keys`. All 50 rows match.
  - Tooling finding: this recipe is not written down anywhere. `step-08-preflip-gates.json` declares a bindingHashEncoding only for the 5 rows rebound under L12-130, and that encoding is different (compact JSON, LF, 4 keys). No committed script produces `changedBindings`. I reproduced the recipe only after the Lead passed on what sibling reviewers found. The gate should declare the encoding on every row.
- **Unit digest.** I used the Phase 6 extractor `unitsOf` from `reports/phase-06/step10-round5-reproduction.json` (`step10-sync287-lib.mjs`), run on the worktree files at 8a9385eca. For all 50 rows, the anchor's textDigest equals targetUnitDigest and its ancestry equals the shard's targetAncestry.
- **Semantic.** Each claim's source unit is found by its sourceUnitDigest in the legacy `docs/architect/packaging-distribution/runtime-identity-and-activation.md`:
  - 47 rows are byte-identical to their source, under the same heading.
  - 2 rows (s4 claims 237 and 239) carry the source verbatim and add a dated 2026-10-14 status note. The note is true: `preflight_candidate` never runs candidate code. The rows keep the must-not obligation and drop no clause.

## REWORK
- `claim_83a4a91369ae5c2fd8959d7835a2f76e` (s7-step09-main-import-accounting claims[12]) → `activation-binding.md#unheaded-block-19`.
  - The target carries the source text from before commit 88a702f6f: "On Windows, fgctl init/upgrade/repair refuse with lock-driver-unavailable until the Windows lock driver exists".
  - Commit 88a702f6f (2026-10-17) changed the legacy source block-54 (now digest e617921c…) to say the same locks work on Windows through `LockFileEx`. The Windows driver exists in `packages/holder-lock/rust/src/driver/windows.rs`.
  - No ledger claim binds the current source passage, and the candidate still makes the superseded Windows claim.
  - Fix: recompose the target from the current source, then rebind. This probably overlaps the `source-context-and-post-pin-recomposition` gate.

## Note on where the claims live
Sections 7 (Invocation Lease), 10 (MigrationJournal) and Existing Project Adoption are carried in the retained-source appendix of `contracts/activation-binding.md`. I accepted that placement because no other `docs/platform` contract owns these topics, and the architecture doc and `spec.md` only mention them in passing.
