# plan: review-diff-enobufs-stale-branch (tsk-648)

## Status

Mode: **small**. Ready for `fgos-coding-validating`.

No `CONTEXT.md` exists for this feature. `fgos-clarifying` judged the
item's own description fully self-specifying (exact bug, exact
reproduction, exact two acceptable fix directions) and passed it straight
from `clarify` to `decompose` with a caller-supplied clear verdict — there
was no gray area for `fgos-coding-exploring` to lock. This plan treats the item's
own `description` as the decision record; every design choice below cites
back to it directly instead of a `CONTEXT.md` D-ID.

## Mode gate

Lane decided directly (direct-entry fallback: no `fgos-routing` Orient
prose was handed to this session, and no prior `plan.md` existed) per
`fgos-routing`'s own Mode-gate table:

| Flag | Applies? |
|---|---|
| auth | no |
| authorization | no |
| data model | no |
| audit/security | no |
| external systems | no — `git` is a local subprocess, not a hosted/paid provider |
| public contracts | no — `reviewDiff`'s return shape (`{source, diff, warnings}`) is unchanged; only an internal helper gains an optional param with a default that preserves today's behavior for every other caller |
| cross-platform | no |
| existing covered behavior | **yes** — `reviewDiff` and the shared `git()` helper are exercised by `test/runner/merge.test.mjs`'s existing suite; the fix must not regress any of those cases |
| weak proof around the area | no — the area is tested (see `test/runner/merge.test.mjs`); the bug is a genuine untested edge case (a very large diff), not a general coverage gap |
| multi-domain | no |

1 flag → **small** (a couple of files, no gray areas — the item's own
description names both acceptable fixes, and code reading below shows the
actual blast radius is narrower than the title implies).

## Approach

**Root cause** (read directly from `src/runner/merge.mjs`): the shared
`git()` helper (line 72) calls `execFileSync('git', args, { cwd, encoding:
'utf8', shell: false, stdio: [...] })` with no `maxBuffer` option, so Node
applies its default of 1 MiB to stdout. `reviewDiff` (line 264) has two
call sites that ask `git()` for a FULL, uncapped diff — `git diff
trunk...branch` (runner source, line 272) and `git diff
headAtTake..headAtReturn` (pull-door source, line 284) — either of which
can exceed 1 MiB once a branch is hundreds of commits stale (the item's
own reproduction: 332 commits behind main). When it does, `execFileSync`
throws `ENOBUFS` and `reviewDiff`'s existing `try/catch` rethrows it as a
`MergeError` whose message is just the raw Node message — accurate, but
gives the caller no path forward. `fgos review <id>` calls `reviewDiff`
directly (`bin/fgos.mjs:2631-2632`) with nothing that catches a
`MergeError` locally, so it surfaces via the CLI's top-level handler
(`bin/fgos.mjs:4398`) as a hard failure instead of a usable review result.

**Scope correction from the item's title** (pinned as an assumption, not
asked — verified directly by grep, not a product judgment call): the title
says "review/approve crashes." Reading every call site of `reviewDiff`
(`grep -rn "reviewDiff(" bin/fgos.mjs src/` → exactly the two lines inside
`review`'s own case) and every full (non-`--name-only`) `git diff` call in
`merge.mjs` (lines 272 and 284 only — every other `git diff` call in the
file passes `--name-only`, which returns file paths, not diff content, and
cannot realistically hit a 1 MiB cap) shows `approve` never calls
`reviewDiff` or any other full-diff path today. The reproduced incident
(`fgos review tsk-4n7`) also only exercises `review`. This plan fixes both
of `reviewDiff`'s own full-diff call sites (covering `review`, and any
future caller of `reviewDiff`) but does not invent an `approve`-side change
that has no corresponding code path — there is nothing there to fix.

**Chosen path** (does both halves of the item's own "either/or" — each is
a few lines, and doing both costs less than debating which one to skip):

1. Give `git()` an optional `maxBuffer` param, default `undefined` — Node's
   own default when omitted, so all ~19 other call sites (`detectTrunk`,
   `changedFiles`, `isWorkingTreeClean`, `isAlreadyMerged`,
   `autoResolveDecisionIndexCollision`, etc.) stay byte-identical. This is
   what keeps the fix's real blast radius small despite `git()`'s own
   CRITICAL/21-dependent impact-analysis reading below.
2. Pass an explicit, generous `maxBuffer` (50 MiB — a local git subprocess
   call, not memory-constrained the way a network payload is; a text diff
   this large from a normal repo would already be an outlier) from
   `reviewDiff`'s two full-diff call sites only.
3. In both of `reviewDiff`'s existing `catch` blocks, special-case
   `err.code === 'ENOBUFS'` with a message that names the actual condition
   ("diff exceeds Nx MiB — branch is likely very stale; sync/rebase before
   reviewing" or equivalent) instead of forwarding Node's raw message
   verbatim. This is the "detect/report excessive staleness as its own
   diagnosable condition" half — it only fires when even the raised
   buffer isn't enough, so it costs nothing on the common path.

**Rejected alternative:** computing commit-count/staleness up front (an
extra `git rev-list --count` call before ever attempting the diff) and
refusing early. Rejected as unnecessary ceremony (YAGNI) — raising the
buffer already fixes the reproduced case (332 commits) outright, and the
`ENOBUFS`-specific catch above already gives a diagnosable message for
whatever is left over, without a second git round-trip on every review.

**Risk map:**

| Component | How risky | What proves it |
|---|---|---|
| `git()`'s new optional `maxBuffer` param | low — default-omitted behavior is provably unchanged (no existing call site passes it) | full `npm test` green — any failure here is a real regression, not an expected update |
| `reviewDiff`'s two call sites passing a larger `maxBuffer` | low — additive, only raises a ceiling | a diff sized between the old 1 MiB default and the new 50 MiB ceiling now succeeds where it previously threw (see Shape below) |
| The `ENOBUFS`-specific catch message | low — only reached once the (much larger) ceiling is still exceeded | a diff deliberately made to exceed a small, test-supplied `maxBuffer` still throws `MergeError`, with a message naming the real condition, never an uncaught crash |

Impact-analysis capability gate (`CLAUDE.md`): `fgos tool query
--capability impact-analysis --status present` → **1 provider, status
present** → posture **full**. Ran `impact({target: "git", direction:
"upstream", file_path: "src/runner/merge.mjs"})` per this repo's own
GitNexus "Always Do" rule: **risk CRITICAL, 21 upstream dependents (16
direct: `detectTrunk`, `isWorkingTreeClean`, `isMainWorktree`,
`reviewDiff`, `changedFiles`, `classifyDecisionIndexCollision`,
`nextFreeDecisionId`, `renumberDecisionFile`,
`resolveDecisionIndexConflict`, `autoResolveDecisionIndexCollision`,
`isAlreadyMerged`, `branchContentMismatch`, `mergeHeadExists`,
`abortMergeIfPossible`, `mergeRunnerItemLocked`, `cleanupMergedBranch`;
plus depth-2/3 fan-out into `promote-engine.mjs`
(`resolveIntegrationBranch`, `retargetMember`), `drift-status.mjs`
(`driftStatus`), and `setup/registrations.mjs` (`checkRootDrift`) — 3
modules affected: Runner, State, Setup).** `reviewDiff` itself (the other
target checked) has 0 upstream dependents beyond the CLI call site
already read above. **Warning surfaced to the user per CLAUDE.md's "MUST
warn... before proceeding" rule: `git()` is a CRITICAL-risk shared
primitive.** The chosen design (default-omitted `maxBuffer`, explicit
value passed only from `reviewDiff`'s two call sites) is specifically
shaped to keep this real: none of the other 15 direct callers pass
`maxBuffer`, so their behavior is provably unchanged, not merely assumed
safe — full `npm test` is still the proof of record for that claim.

**Files touched:**

- `src/runner/merge.mjs` — `git()` helper gains the optional `maxBuffer`
  param (line 72); `reviewDiff`'s two full-diff call sites (lines 272,
  284) and their `catch` blocks (lines 273-275, 286-288).
- `test/runner/merge.test.mjs` — new `reviewDiff` cases (see Shape below).

**Ordering:** `fgos graph --json` shows this item as a size-1 component
(no dependencies, nothing depends on it) — no cross-item ordering
question. Within the item: `git()`'s param first (everything else reads
it), then `reviewDiff`'s two call sites plus their catch blocks together
(same shape, same fix, no reason to split).

## Shape

Single item, not split — one shared root cause (`git()`'s missing
`maxBuffer`), one bounded set of call sites (`reviewDiff`'s two), well
under "a couple of files, one direct task."

Concrete cases worth proving, matching `small` depth (existing behavior
regression + the two new behaviors):

- Existing `reviewDiff` suite (5 cases already in `test/runner/
  merge.test.mjs`, runner/pull/legacy sources, custom trunk, multi-commit
  warning) stays green — regression proof that the additive param changed
  nothing for a normal-sized diff.
- A diff sized between the OLD 1 MiB default and the NEW 50 MiB ceiling
  (e.g. one commit adding a ~2 MiB text file) succeeds today's fix's way,
  and — read directly, not asserted — would have thrown `ENOBUFS` under
  the code as it exists before this item.
- A diff that still exceeds an explicitly small, test-supplied
  `maxBuffer` (`reviewDiff(repoRoot, item, { maxBuffer: <small> })`, the
  same seam `opts.trunk` already establishes) throws `MergeError` with a
  message naming the real condition (matches `/exceed|too large|stale/i`
  or equivalent — the exact wording is an implementation detail, not
  worth locking into this plan), never an uncaught exception.
- No `--name-only` call site (`detectTrunk`, `changedFiles`, the other 14
  direct callers from the impact-analysis read above) needs a new test —
  they never pass `maxBuffer`, so their existing coverage already proves
  they are untouched.

## Split

No split — see Shape above.

## Execution note

Verify command for this item: `node --test test/runner/merge.test.mjs -t
"reviewDiff"` (already locked as the item's `verify` field via the
`discover --verdict clear` call). This runs only the `reviewDiff`-named
cases in the file — narrower than the full suite, matching this item's own
scope — with a full `npm test` pass as the broader regression check for
`git()`'s other 15 direct callers before this item is returned.

## Outstanding questions

None
