# Git-owner review request: declared one-door sites

Owner authorization: [L13-6 (1)](../owner-answers.md). Please review the **25 exact declarations** in `scripts/lib/git-one-door-declarations.v1.json`, not a hand-edited census:

- **1** cold-hook `leaseGitRead`: existing `hook-read-context`; only `show-ref` and `diff-tree` added to the hook read set. Hook bytes unchanged.
- **10** byte-pinned reproduction calls + **9** missing-capability documentation calls: new `declared-tooling-exemption`. Existing classes cannot honestly describe fixed Git evidence readers; no port extension or fallback was added.
- **5** project-configured invariant/setup calls: existing `configured-binary`; consumer bytes unchanged.

Every entry has `reason` and `retireWhen`. [The packet](exemption-proposal.md) retains each capability gap and retirement condition. Review source digests in the regenerated `packages/git/contracts/mutation-census.v1.json`; all 25 declarations appear under `classes`, with **0** `sites`.

## Audit

1. Run `node scripts/git-one-door-scan.mjs --write-census --json` in a staged checkout. A second generation must be byte-identical. The declaration JSON ships under `scripts/` and its digest is checked by `verifyCensus`; no packaging/config registry addition is needed.
2. `siteId` binds the enclosing named function and comment-blanked call text (callee, operands/options), not a line number. For a site without literal Git argv/verb, it additionally hashes the sorted **multiset** of every resolved wrapper caller's call digest: `sha256(relativeCallerPath + '\0' + commentBlankedCallText)`, through both named and function-value caller resolution (including anonymous callbacks). Its call hash is `sha256(JSON.stringify([spawnCallText, sortedCallerDigests]))`; fixed-verb calls retain `sha256(spawnCallText)`. `callerDigests` is emitted in the census. A new direct spawn remains undeclared; a new or changed caller through a declared pass-through wrapper makes that declaration **stale**, including a new read or identical duplicate caller. It does not silently inherit the wrapper exemption. Preceding line shifts and caller reordering still match; edits inside a call need re-review. Changed/removed sites, duplicate keys and ambiguous matches refuse generation. Hook `verbs` must exactly match observed literal caller verbs and all be reads; merely refreshing its siteId cannot approve a write.
3. Run individual files `test/scripts/git-one-door-declarations.test.mjs` (new matching contract), `test/setup/git-mutation-census.test.mjs` (one doctor wiring proof), and existing `test/git/one-door.test.mjs` (automatic flow classification).
4. Confirm pinned generator blobs remain `a52981ff2862cc2c553dbb3181e4e822a26b146b` and `0f1cd7e1cee308772c0b56c37f3190333039cfb3`.

[Original declaration receipt and limits](declared-exemptions/receipt.md); [wrapper-caller repair receipt](wrapper-callers/receipt.md). The repair re-declares nine identities (the three pass-through sites, five configured-command sites and one pinned call with indirect argv); all 25 reasons/classes/retirement conditions and consumer bytes are unchanged. The focused declaration and doctor results, source-backed negative probes, deterministic census replay and remaining environment limits are recorded in the repair receipt. No Git-owner verdict, overall G4 closure, full-suite result or new-release proof is claimed.
