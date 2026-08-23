# plan: tsk-2iz — decision-index auto-resolve: consider both trees, never skip the abort on a throw

Mode: standard

Flag count/lane: 1 explicit flag (existing covered behavior —
`test/runner/merge.test.mjs` already carries a real self-resolve happy-path
suite). No hard-gate flag applies (this is a merge-time collision-resolution
correction, not auth/data-loss/audit-security/external-provider/removed-
validation in the report's own hard-gate sense) — though the failure mode
(two decision files silently claiming the same 4-digit id) is itself a data
INTEGRITY concern worth calling out honestly in the risk map below, even
though it doesn't trip the mechanical hard-gate keyword floor the same way
tsk-18k's did. Item's own `tier`/`risk` (`standard`/`standard`) match the
report's "severity: medium" framing. Standard lane.

Direct-entry fallback: this item entered `planning` straight from a `clear`
discovery verdict — no `CONTEXT.md`/exploring round exists. `RESEARCH.md`
round 1 stands in for it.

## Impact-analysis posture

Same posture as tsk-18k/tsk-1mn (checked minutes earlier in this same
session, unchanged): gitnexus `present` but the indexed snapshot is 172
commits behind HEAD — **degraded**. Cross-checked directly by reading
`nextFreeDecisionId`'s only caller both via GitNexus's own call-graph flow
AND a plain `grep -rn "nextFreeDecisionId(" src bin test` (RESEARCH.md round
1, finding 1) — both agree: exactly one caller,
`autoResolveDecisionIndexCollision`. No discrepancy this round.

## Approach

Two changes, both in `src/runner/merge.mjs`, both direct implementations of
Finding 3's own "Suggested direction":

1. **`nextFreeDecisionId(repoRoot, refs)` generalized to accept a ref or an
   array of refs**, computing the max decision id across the union instead
   of a single ref. The one caller (`autoResolveDecisionIndexCollision`)
   now passes `['HEAD', branch]` instead of the literal `'HEAD'`. Closes
   the duplicate-id bug: a branch's own new decision files above `HEAD`'s
   max are now consulted before minting a "next free" id, so the mint can
   never land on a number the branch itself already used.

2. **The `classifyDecisionIndexCollision` + `autoResolveDecisionIndexCollision`
   pair, called inside the outer `git merge` failure's `catch` block, is now
   wrapped in its own local try/catch.** A throw from either (a real fs/git
   failure — `renumberDecisionFile`'s `git mv`, a file read/write —
   distinct from the documented `false`-return "shape mismatch" case) is
   caught and treated the same as `resolved: false`: falls through to the
   EXISTING `abortMergeIfPossible` + report path unchanged, but the real
   error is now surfaced via the existing `merge-failed-unclassified`
   outcome shape (`error: {message, stderr, status}`) instead of
   propagating uncaught and skipping the abort — closes the "MERGE_HEAD and
   partial renames left in the shared main checkout" half of Finding 3.

**Why both, together:** the report names them as one finding because both
live in the same code path and both were exercised by the same audit pass;
they are independently fixable and independently testable, but splitting
them into two items would double the ceremony for two small, tightly
co-located changes in the same function. Single item, no split.

**Order:** the `nextFreeDecisionId` fix first (smaller, self-contained,
directly closes the duplicate-id bug the item's own title names), then the
try/catch wrap (defense-in-depth for a failure mode that can happen
regardless of the first fix — an fs/git error is not caused by which id
gets picked).

## Risk map

| Component | How risky | Proof point |
|---|---|---: |
| `nextFreeDecisionId`'s generalized signature | Medium — its own docstring previously asserted "always HEAD/main here, per this function's only caller" (now stale by construction once the caller changes) — a real behavior change to a function with exactly one caller, but that caller's own call site is the only one that needs updating | New test reproducing Finding 3's EXACT failure scenario (branch forked at max 0040, writes 0041+0042 of its own; main independently lands its own 0041) — asserts the OLD bug (duplicate 0042) cannot occur and the real next-free id (0043) is picked, both files verified present with unique 4-digit prefixes |
| The new try/catch around the resolve attempt | Low-medium — must not swallow the real error, must not skip the abort, must not misreport a genuine conflict as an auto-resolve failure or vice versa | New test forcing a REAL throw (pre-planting a file at the exact rename destination so `git mv` genuinely refuses) — asserts a defined `merge-failed-unclassified` outcome (never an uncaught exception), `MERGE_HEAD` is gone (abort ran), and the working tree is clean (no partial staged rename) |
| Every other existing self-resolve test (happy path, positional collision, non-collision conflict, index-confined-check) | Low — must stay byte-identical | Full existing `test/runner/merge.test.mjs` suite (91 tests) reruns unchanged |

## Shape

Single piece, no split — two tightly co-located fixes in the same function,
already implemented and verified.

Verify (already synced onto the item at discovery, real and runnable):
```
node --test test/runner/merge.test.mjs
```

## Outstanding questions

None
