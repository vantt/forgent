# Git-owner review request: declared one-door sites

Owner authorization: [L13-6 (1)](../owner-answers.md). Please review the **25 exact declarations** in `scripts/lib/git-one-door-declarations.v1.json`, not a hand-edited census:

- **1** cold-hook `leaseGitRead`: existing `hook-read-context`; only `show-ref` and `diff-tree` added to the hook read set. Hook bytes unchanged.
- **10** byte-pinned reproduction calls + **9** missing-capability documentation calls: new `declared-tooling-exemption`. Existing classes cannot honestly describe fixed Git evidence readers; no port extension or fallback was added.
- **5** project-configured invariant/setup calls: existing `configured-binary`; consumer bytes unchanged.

Every entry has `reason` and `retireWhen`. [The packet](exemption-proposal.md) retains each capability gap and retirement condition. Review source digests in the regenerated `packages/git/contracts/mutation-census.v1.json`; all 25 declarations appear under `classes`, with **0** `sites`.

## Audit

1. Run `node scripts/git-one-door-scan.mjs --write-census --json` in a staged checkout. A second generation must be byte-identical. The declaration JSON ships under `scripts/` and its digest is checked by `verifyCensus`; no packaging/config registry addition is needed.
2. `siteId` is enclosing named function + SHA-256 of callee and comment-blanked call text (including operands/options). Preceding line shifts do not change identity. A changed/removed call, duplicate key or ambiguous match refuses generation; a new call in the same path remains undeclared. Any formatting edit inside the call needs re-review too.
3. Run individual files `test/scripts/git-one-door-declarations.test.mjs` (new matching contract), `test/setup/git-mutation-census.test.mjs` (one doctor wiring proof), and existing `test/git/one-door.test.mjs` (automatic flow classification).
4. Confirm pinned generator blobs remain `a52981ff2862cc2c553dbb3181e4e822a26b146b` and `0f1cd7e1cee308772c0b56c37f3190333039cfb3`.

[Receipt and limits](declared-exemptions/receipt.md): new tests and actual-tree doctor pass; the existing one-door file is **4/6** in this unstaged worktree (native addon unavailable), not claimed green. No Git-owner verdict, overall G4 closure, full-suite result or new-release proof is claimed.
