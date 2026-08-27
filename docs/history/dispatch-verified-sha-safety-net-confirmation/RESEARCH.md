# dispatch-verified-sha-safety-net-confirmation — RESEARCH

## Round 1 — 2026-08-26 (tsk-22bm discovery)

**Asked:** tsk-22bm reports a real incident (driving tsk-10n) where
`dispatch.mjs execute`'s JSON result reported `verifiedSha` as main's own
current HEAD (an unrelated, concurrent commit), not the worker's own real
commit — confirmed the actual work landed correctly on the right branch,
only the metadata was wrong. Two suggested directions: (a) trace
`verifiedSha`'s own computation to find where it reads the wrong HEAD;
(b) confirm whether `fgos return`'s `--worker-verified-sha` handling
validates the passed sha before trusting it, and add the check if
missing.

**Direction (b) — already fully implemented and already tested, closing
the more urgent half of this report:**
`bin/fgos.mjs:3473-3474`: `const workerVerifiedSha =
flags['worker-verified-sha']; const isWorkerVerified = typeof
workerVerifiedSha === 'string' && workerVerifiedSha && workerVerifiedSha
=== branchHead;` — `branchHead` is computed independently, immediately
above (`bin/fgos.mjs:3443-3445`: `gitAt(repoRoot, ['rev-parse',
branch])`, reading the item's real `fgw/<id>` branch tip directly from
git's shared ref database, which resolves correctly from ANY worktree of
the same repo since branches aren't worktree-local). **A mismatched
`--worker-verified-sha` is never trusted** — `isWorkerVerified` is `false`
whenever the passed sha doesn't exactly equal the real branch tip, and
`fgos return` falls straight through to a full, real re-verify
(`bin/fgos.mjs:3477-3485`'s own `if (isWorkerVerified) {...skip...} else
{...real verify...}` branch). This exact scenario already has dedicated,
passing regression tests in TWO files: `test/cli/fgos-return.test.mjs:1262`
and `test/cli/fgos-return-4.test.mjs:337`, both named "return
--worker-verified-sha falls through to real verify when sha is stale or
mismatched."

**Practical severity re-assessment:** because (b) already holds, a wrong
`verifiedSha` (direction a's own subject) can only ever COST the "skip
re-verify" optimization on an otherwise-correct result — it can never
cause an unverified result to be silently trusted as verified. The
original incident's own real outcome already demonstrates this: the
session independently confirmed the commit via `git log -1`/`git status`
and called `fgos return` bare (no `--worker-verified-sha`), and the
item's own report already names this as the correct avoidance — this
research round confirms that avoidance is not merely a workaround but the
system's own designed, tested fail-safe path.

**Direction (a) — traces to the same upstream mechanism already
documented in tsk-322's own research, not a new root cause:**
`verifiedSha` is set to `headAfter` in `buildDispatchResult`
(`src/runner/dispatch/result-ladder.mjs:50`), which is `captureHeadSha(cwd)`
(`src/runner/dispatch/cli.mjs:284-295`, a plain `git rev-parse HEAD` in
`cwd`) called immediately after the adapter's own work completes
(`cli.mjs:505`). `cwd` here is the SAME `cwd` parameter whose Node-level
default-to-`process.cwd()` behavior tsk-322's own RESEARCH.md already
live-tested and confirmed correct (a synthetic repro proved the git
attestation call inside this same dispatch layer genuinely uses the
calling process's real `process.cwd()`, unaffected by `--repo-root`) —
tsk-322 also already concluded the real incidents' cause sits upstream of
this file (the calling session's own process cwd, not `dispatch.mjs`'s
own resolution code), out of this repo's control. tsk-22bm's own incident
(no `--repo-root`/`--cwd` flags at all, an even simpler case than
tsk-322's) is consistent with the exact same upstream class, not a
distinct mechanism — re-investigating it here would duplicate tsk-322's
own already-thorough, already-merged research rather than add anything
new.

## Verdict

`clear`. Scope: documentation-only, closing this item on the strength of
what's already true in the codebase:
- (b) is confirmed implemented + tested — cite the exact lines/tests so a
  future reader never has to re-verify this from scratch.
- (a) is confirmed to be the same upstream cwd-resolution class tsk-322
  already documented and (correctly) declined to fully solve from within
  this repo — cited, not re-investigated.

No code change: the safety net this item worried might be missing
already exists and is already tested; the remaining open question (a) is
already owned by tsk-322's own research, not a fresh gap for this item to
close.

**Verify:** `node --test test/cli/fgos-return.test.mjs
test/cli/fgos-return-4.test.mjs` — confirms both existing regression
tests (skip-on-match, fall-through-on-mismatch) still pass, as the live
proof that direction (b)'s safety net is real, not just correctly read
from source.
