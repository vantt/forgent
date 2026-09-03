---
authoritative_for: fgos return --worker-verified-sha, skip redundant verify after out-of-process worker already verified, merge carrying stale .fgos snapshot overwrote main live state
---

# `fgos return` no longer re-verifies a tree the worker already proved green

`tsk-6al` closed a real, confirmed-live compute waste: `fgos return`
re-ran an item's full verify command from scratch even when an
out-of-process worker had already proved it green on the exact same
committed tree moments earlier — a full test-suite cycle wasted on every
out-of-process-dispatched executing-stage item.

## Confirmed live

Driving `tsk-1uf`: the dispatched worker (`agy`/`gemini`, resolving
out-of-process unconditionally per `.fgos/config.json`'s own executor
preference, regardless of the driving session's own live Task access)
ran the item's exact verify command itself before committing and
reporting `[DONE]`, per `coding-worker-contract.md`'s own Layer 2 rule 2
("run it yourself"). The very next driver step, `fgos return`, then
re-ran the identical `npm test` suite (3748 tests, ~362s) against the
exact same already-committed, already-clean tree with zero further
changes — pure redundant compute.

**The exact same optimization already existed one step later in the
chain.** `fgos approve`/`sync-root` already skips verify with "verify
skipped: the merged tree is identical to `<branchHeadAtReturn>`, already
verified green at return" — `return` had no analogous check against a
commit the *worker* had already verified before `return` was ever
called.

## What shipped

A `--worker-verified-sha` flag on `fgos return`: when the value matches
the branch's current tip (`branchHead`), the verify step is skipped
entirely with `{passed: true, skipped: true, output: "verify skipped:
branch tip <sha> was already verified green by worker"}` instead of
provisioning a disposable worktree and re-running the full goal check —
the same shape `merge.mjs`'s own `branchHeadAtReturn` check already
proved out one step later in the chain, now applied one step earlier.

## A separate, real `.fgos/` state-loss incident on this item's own merge

Landing `fgw/tsk-6al` into `main` carried that branch's own frozen
`.fgos/` snapshot (stripped per ADR0020 before landing) and **overwrote
main's current `.fgos/` files with it**, deleting real, already-committed
log content across four files
(`approve-post-success-faults.jsonl`, `changelog-nag-history.jsonl`,
`entropy-history.jsonl`, `events.jsonl`). A separate follow-up commit
restored all four paths to their content immediately before that merge.
This item's own record does not confirm a systemic guard fix for this
specific merge-carries-stale-snapshot vector — only the recovery is
recorded here.

## A note on this item's own provenance

This item was originally lost — the first `tsk-6al` vanished from
`.fgos/events.jsonl` entirely under confirmed concurrent-write data loss
(see [`tsk-24e`'s own investigation](events-jsonl-concurrent-data-loss-investigation.md))
and was recreated from scratch, with that history noted directly in its
own re-submitted description.
