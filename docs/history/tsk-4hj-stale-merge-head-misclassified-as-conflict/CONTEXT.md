# tsk-4hj-stale-merge-head-misclassified-as-conflict — locked decisions

Item: `tsk-4hj` (heavy, deps: `tsk-5t3a`, `tsk-4l8`). Source ticket (raw,
untrusted per RUL45): `fgos approve` on `tsk-55h` reported `merge-conflict`
twice in a row despite the branch being provably clean (disposable-clone +
`git merge-tree` both times, no conflict). Root cause: the main checkout
already carried a `MERGE_HEAD` left behind by a *different* item's
in-progress/abandoned merge (`tsk-4qu`, then `tsk-5td`) from a concurrent
session. `git merge --no-commit --no-ff <branch>` refuses outright whenever
`MERGE_HEAD` already exists (regardless of which branch it belongs to);
the current code then reads `mergeHeadExists(repoRoot)` → `true` (the
leftover MERGE_HEAD is still on disk, not one this call created),
misclassifies it as `tsk-55h`'s own genuine conflict, and calls
`git merge --abort` — discarding the OTHER item's merge state — before
returning `{outcome: 'conflict'}` for the innocent item.

## Feature boundary

`mergeRunnerItemLocked`'s catch block (`src/runner/merge.mjs:894-919`) for
the initial `git merge --no-commit --no-ff <branch>` call
(`merge.mjs:886`) must distinguish three cases, not two:

1. genuine conflict — `MERGE_HEAD` did **not** exist before this call, and
   exists after it (created BY this call);
2. unclassified failure — `MERGE_HEAD` did not exist before OR after
   (already handled, `tsk-18a`, outcome `merge-failed-unclassified`);
3. **pre-existing MERGE_HEAD** (this item's gap) — `MERGE_HEAD` already
   existed **before** this call ever ran, so the call never got a chance
   to attempt anything of its own. Git's own refusal
   ("You have not concluded your merge") is the only signal in this case.

`mergeHeadExists(repoRoot)` (`merge.mjs:807-825`, `tsk-2j9`) already
computes the boolean this fix needs — it is currently read only ONCE,
after the failed `git merge` call, which cannot tell case 1 apart from
case 3. The fix is to also read it BEFORE the call.

The fix lands once, inside `mergeRunnerItemLocked` (`merge.mjs`), but
`mergeRunnerItem` (its caller) is shared by three call sites in
`bin/fgos.mjs` — two `approve` paths and `fgos sync-root` — so the new
outcome this produces is visible at all three; see D4 for the one of
those three (`sync-root`) that needs its own additional guard.

Scope excludes: `tsk-2j9`'s already-delivered abort-crash guard (a MISSING
MERGE_HEAD), `tsk-18a`'s already-delivered conflict/unclassified split (a
MERGE_HEAD this call itself created or never created) — see
`RESEARCH.md` in this same directory for the full confirmation that both
are orthogonal, already-delivered, and do not close this gap. Also
excludes any broader main-checkout-writer lock audit (`tsk-18a`'s own
still-deferred D3 scope) and any redesign of the Merge Conductor beyond
this one classification gap.

## Locked decisions

### D1 — Check `mergeHeadExists` BEFORE the `git merge --no-commit --no-ff` call, not only after
Add the pre-call check immediately before `merge.mjs:886`, inside
`mergeRunnerItemLocked`, after the main-checkout lock is already held. If
`MERGE_HEAD` already exists at that point, this item's own merge attempt
never runs at all — skip straight to the new outcome in D2, never call
`git merge --no-commit --no-ff` and never call `abortMergeIfPossible` on
state this call did not create.

Rejected alternative: keep the single post-call `mergeHeadExists` read and
try to infer "was it already there" from stderr text. Git's refusal
message is the same generic "You have not concluded your merge" whether
the leftover branch is a stray commit, this item's own retry, or a
different item entirely — parsing it can't distinguish cases, and is
fragile across git versions/locales. A boolean read before the call is the
same content-based, version-independent signal `tsk-2j9`/`tsk-18a` already
established as the trusted mechanism for this exact function.

### D2 — New outcome, retryable via `fgos catchup`, following `tsk-18a`'s own precedent exactly
A pre-existing MERGE_HEAD gets its own new outcome (name deferred to
planning, e.g. `merge-blocked-other-item`) — never folded into
`conflict` and never folded into `merge-failed-unclassified` (that class
means THIS call's own attempt failed in an unrecognized way; this class
means THIS call's attempt never happened). `bin/fgos.mjs`'s `CATCHUP_REASONS`
set and `docs/specs/runner.md`'s accepted-reason list must be extended the
same way `tsk-18a` D1 already extended them for
`merge-failed-unclassified` — retrying via `catchup` is the natural
recovery here (the blocking item's own merge will eventually finish or get
aborted by a person, clearing MERGE_HEAD), the exact reasoning `tsk-18a`'s
own D1 already used for its sibling case.

Assumption, not a fresh question: this item's own proposed fix direction
already names "refuse rõ ràng" as the desired behavior, and `tsk-18a`
(same file, same classification boundary, already delivered) already
established "new distinct outcome + catchup-retryable" as this codebase's
answer to "a merge call didn't run/complete for a reason unrelated to
content" — pinned rather than asked per `fgos-coding-exploring`'s own
material/grounded/answerable bar: grounded in direct precedent, and an
internal-auto-retry alternative would contradict that established
recovery mechanism (`fgos catchup` exists specifically for this
"may just work later" class) without any evidence this item's author wants
a different mechanism.

### D3 — Never call `abortMergeIfPossible` on a pre-existing MERGE_HEAD
Once D1's check fires, the code returns the D2 outcome directly — it must
not call `git merge --abort` at all in that path. That abort is exactly
the destructive step the original bug report identifies as the actual
data-loss risk (an unrelated item's manually-resolved, uncommitted
conflict fix, silently discarded). This is the one behavior change that is
non-negotiable, not an assumption: it is the literal safety gap the item's
own description names.

### D4 — `sync-root`'s call site (`bin/fgos.mjs:3305-3357`) gets a defensive unrecognized-outcome guard, not a named `merge-blocked-other-item` branch
Found during `fgos-coding-validating`'s reality gate (not anticipated when D1-D3
were locked): `mergeRunnerItem` is shared by THREE call sites, not two —
the two `approve` paths (`~2999`, `~3114`) already handled by D2, and
`fgos sync-root`'s own `runAndReport` (`~3305-3357`), which has no branch
at all for `merge-failed-unclassified` — an outcome it does not
recognize falls straight through to the success block
(`bin/fgos.mjs:3349-3357`: `addDecision(...'merged'...)` +
`return {outcome: 'synced', ...}`). This is a pre-existing gap (predates
this item, `tsk-18a` never touched this call site), but D1's own fix
makes it newly reachable in a worse way: today a pre-existing MERGE_HEAD
at least surfaces as a wrong-but-visible `blocked`/`merge-conflict` via
`sync-root`'s existing `conflict` branch (`~3312-3322`); after D1, the
same condition returns the new `merge-blocked-other-item` outcome, which
`sync-root` has NO branch for either — so it would silently report
`synced` (false success) instead. D1 must not ship without closing this,
per D3's own already-established bar (never silently misreport a blocked
merge as if it succeeded).

Fix: add a defensive `else` after `sync-root`'s existing `verify-fail`
branch (`~3346`) that treats ANY outcome other than `'merged'` as an
error instead of falling through to the success block — future-proof
against any outcome this call site doesn't yet recognize, not just this
item's new one by name. Never widen `sync-root`'s own three existing
named branches (`conflict`/`fgos-write-rejected`/`verify-fail`) to also
list `merge-blocked-other-item`/`merge-failed-unclassified` by name —
the defensive `else` covers both without hardcoding either, and covers
whatever a future D1-shaped fix adds later too.

Pinned rather than asked: grounded in this session's own direct read of
`bin/fgos.mjs:3305-3357` (cited above), and the fix is the smallest
possible closure of a real regression D1 would otherwise introduce — not
a product/UX choice with more than one reasonable answer. `sync-root`'s
own existing test suite (`test/cli/fgos.test.mjs:6121+`, confirmed
present and covering the happy path plus rejection cases) is the natural
home for the new regression test.

## Pinned terms

- **Pre-existing MERGE_HEAD** — `mergeHeadExists(repoRoot)` returns `true`
  when checked *before* `mergeRunnerItemLocked`'s own `git merge
  --no-commit --no-ff branch` call (`merge.mjs:886`) runs. Distinct from
  `tsk-18a`'s "genuine conflict" (MERGE_HEAD absent before, present after —
  created BY this call).
- **Genuine conflict** (`tsk-18a`, unchanged) — MERGE_HEAD absent before
  this call, present after it.
- **Unclassified failure** (`tsk-18a`, unchanged) — MERGE_HEAD absent both
  before and after this call.

## Scout evidence cited

See `RESEARCH.md` in this same directory (2026-08-11 round) for the full
file:line citations confirming: the bug is live on current `main`; neither
`tsk-2j9` nor `tsk-18a` closes it; the exact fix point
(`merge.mjs:886`); and that `acquireMainCheckoutLock`
(`main-checkout-lock.mjs:321`) does not protect against this case (it
serializes concurrent `approve` calls but a crashed/exited holder can
still leave a real, uncleaned `MERGE_HEAD` behind for the next holder).

Additional this round:
- `fgos tool query --capability impact-analysis --status present` →
  `gitnexus` provider, `status: "present"` → impact-analysis posture is
  **full**. `AGENTS.md`'s gate applies the MUST rules as written for
  planning/validating/executing — run `impact()` on
  `mergeRunnerItemLocked`/`mergeHeadExists`/`abortMergeIfPossible` before
  editing any of them.
- `docs/history/tsk-18a-merge-conflict-misclassification/CONTEXT.md` D1/D2
  — direct precedent for D2/D3 above (new distinct catchup-retryable
  outcome, empirical-repro bar).
- `docs/history/tsk-2j9-merge-abort-missing-merge-head/CONTEXT.md` —
  confirms `mergeHeadExists`'s own origin and existing guard shape, reused
  unchanged by D1.
- `bin/fgos.mjs:3305-3357` (`sync-root`'s `runAndReport`) — read in full
  during `fgos-coding-validating`'s reality gate: confirms `conflict`,
  `fgos-write-rejected`, `verify-fail` are the only three named outcome
  branches; any other outcome (including today's `merge-failed-unclassified`
  and this item's new `merge-blocked-other-item`) falls through unguarded
  to the success block at `:3349-3357`. Basis for D4.
- `test/cli/fgos.test.mjs:6121+` — confirms `sync-root` has real, existing
  test coverage (happy path, validation rejections) to extend for D4's new
  regression test, not a cold-start test file.

## Outstanding questions

None
