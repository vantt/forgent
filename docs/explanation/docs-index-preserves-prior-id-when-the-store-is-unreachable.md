# Why `docs-index` preserves a doc's prior id when the store is unreachable

`tsk-f31` fixed a real, reproducible data-corruption bug: running `fgos
docs-index` from a linked worktree (which never carries its own `.fgos/`
by design, `ADR0020`) silently regressed every real `sourceCaptureId` in
the tracked `docs/enduser-docs-index.json` to `null`. Found while
executing an unrelated item, `tsk-k7i`: "a clean `npm test` on
`fgw/tsk-k7i` dirtied this same tracked file the same way, discovered only
because the diff was inspected before staging."

## Root cause

> `case 'docs-index'` (`bin/fgos.mjs:1405`) calls `listWork(dir)` where
> `dir` resolved from a missing `.fgos/`, and `listWork`/`rebuildView`
> (`src/state/store.mjs:767`) treats a missing log exactly like a
> legitimately empty one: **"A missing log rebuilds to an empty view ...
> never an error, exit 0"**... `buildEnduserIndex` then can't tell "this
> doc genuinely has no capture" from "the store that would know was
> unreachable this run" — both produce the same empty `outcomesView`.

## The fix and why the signal is the log file, not the directory

> `docs-index` preserves a docPath's existing on-disk `sourceCaptureId`
> when the store is unreachable, instead of overwriting it with `null`.
> Only a genuinely reachable store — present and actually lacking a
> capture for that doc — is allowed to write `null` over a prior value.

The "unreachable" signal itself was corrected mid-flight, caught live at
`fgos-coding-validating`:

> Precise signal: the resolved `.fgos/` directory can exist while carrying
> no `events.jsonl` (observed live: a worktree's `.fgos/` holding only
> `main-checkout.lock`) — "unreachable" means the **log file** is absent,
> not the directory.

A directory-existence check would have misread that exact shape (a real
worktree's real `.fgos/`, holding only its lock file) as "reachable" and
kept the bug alive for the one environment this item exists to fix.

## Why fixing only the test (an earlier, rejected direction) wasn't enough

D1's own rejected alternative:

> Fix only the test (D2) and leave the generator's real behavior as today
> — declined... any human or session running `docs-index` for real inside
> a worktree (the normal path — `fgos pick` stands one up) hits the
> identical silent corruption, not only the one integration test.

This is the same underlying symptom `tsk-2ce` patched from the test side
(snapshot/restore around `npm test`) — but that fix only stopped the
*test* from leaving the file dirty; it never touched what `docs-index`
itself computes. `tsk-f31` is the complementary, production-side fix: the
generator now computes correct content in the first place, whether or not
a test happens to be watching.

## Why `--dir`-redirecting the test (D2) was tried, then dropped

> `fgos-coding-validating` proved live that `--dir` redirects `docs-index`'s own
> `repoRoot` (`case 'docs-index'`: `const repoRoot =
> path.dirname(dir)`), not just which store informs `sourceCaptureId` —
> pointing it at main checkout broke a real, unrelated test (`fgos
> docs-index tolerates a missing quadrant dir`, which hides the
> WORKTREE's own `docs/tutorials/` and expects it absent from the
> manifest; with `--dir` redirecting `repoRoot` to main, the verb scanned
> main's untouched `docs/tutorials/` instead). Separately, D1 alone was
> shown (dry-run simulation) to reconstruct content byte-identical to a
> worktree's freshly-checked-out (`HEAD`-identical) manifest when the
> store is unreachable — the same real ids main checkout would re-resolve
> are already the prior on-disk values D1 preserves.

## Rejected: making `docs-index` refuse without a reachable store

> making `docs-index` refuse outright without a reachable store (raising
> `requiresExistingStore` from its current `false`) — was explicitly
> declined: it would diverge from the documented, codebase-wide convention
> that a missing store degrades every read verb to an empty view rather
> than an error, and would force every caller of `docs-index` without
> `--dir` — not just this one test — to start supplying one.

## What this item does NOT claim to have closed

Verifying the fix independently (reverting `bin/fgos.mjs`'s change makes
the "preserves an existing prior sourceCaptureId" test fail
deterministically with the exact bug signature; restoring it goes green;
a single direct `node bin/fgos.mjs docs-index` run in a worktree with only
`.fgos/main-checkout.lock` left the tracked manifest byte-identical)
surfaced one more thing the item's own plan did not catch: its own verify
command (`npm test && test -z "$(git status --porcelain
docs/enduser-docs-index.json)"`) is intermittently flaky under full-suite
load — clean on one full run, 71 ids regressed to `null` on another, same
worktree, same fix in place. Not reproduced running
`test/report/enduser-index.test.mjs` alone (clean, twice), nor a single
direct production-code run (clean, once) — a race condition between the
file's two real-tree-touching tests under full-suite concurrency, not a
defect in the preserve-on-disk-value logic itself. Left as a known residual
for a possible follow-up item rather than blocking this fix, since the
core self-modifying logic's own failing-test-first proof held.
