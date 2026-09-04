---
authoritative_for: fgos catchup/performCatchUp's ephemeral-worktree merge spuriously refusing with git's "Entry '<path>' not uptodate. Cannot merge." on a path the branch never touched since merge-base, root cause unconfirmed after extensive investigation; performCatchUp's abort-after-non-conflict-failure handling fixed to return a typed merge-refused outcome instead of misclassifying it as an empty-array conflict or crashing on git merge --abort with no merge started
---

# A merge refusal git explained clearly, that the code still mishandled

`tsk-5et` investigated and partially fixed a real, costly bug:
`fgos catchup`/`performCatchUp`'s ephemeral-worktree merge
(`src/runner/merge.mjs`, `src/runner/worktree.mjs`) could spuriously refuse
a merge with `error: Entry '<path>' not uptodate. Cannot merge.` on a path
the branch never touched since its merge-base — even though the working
tree was verified byte-equal to HEAD immediately before the merge command
ran.

## Reproduced 5/5 times, root cause not confirmed

Reproduced merging `fgw/tsk-25b` vs main, always on the same file
(`.agents/skills/fgos-fanout/references/wave-dispatch-mechanics.md`),
across a ~45-minute window including a period with confirmed-idle system
load. `git status --porcelain` inside the ephemeral worktree was clean
immediately before the failing `git merge` call. `GIT_TRACE` showed the
merge command took 116 seconds before failing, vs ~85ms for the same
operation reproduced manually — which never reproduced the failure across
6+ attempts, including one that exactly replayed the automated sequence.

Ruled out as root cause: racy git stat-cache staleness (tried
`git update-index --refresh`, empirically failed to fix a retry, reverted);
gitattributes merge filter drivers on the path (none declared);
`core.fsmonitor`/`core.untrackedCache` (not configured); worktree metadata
bloat (0 prunable among 364 registered worktrees); single-session
contention (disproved — `.fgos/events/` writer-id shards in the same
window carry at least 3 distinct session writer-ids, proving genuine
concurrent sessions).

Working theory, not confirmed: main accumulates a high rate of
near-content-free `.fgos` merge=union checkpoint commits from concurrent
sessions (20 of 27 main commits in one measured 3-hour window were
periodic `events.jsonl` checkpoints). These are declared `merge=union`
specifically to merge for free, but the catchup mechanism's `.fgos/` strip
(raw `fs.rmSync`, not `git rm`, done to satisfy ADR0020 on worker branches)
followed by the merge command may not actually deliver that free property
once many such commits accumulate — possibly interacting with git's
rename-detection pass across a large multi-thousand-commit divergence
(`fgw/tsk-25b` was ~2194 commits behind main at investigation time). Not
confirmed with a targeted repro (renames disabled via config), because
every manual repro attempt failed to trigger the base failure at all,
with or without that setting.

## The real cost this created

One blocked work item (`tsk-25b`) needed 5 additional automated catchup
attempts plus one manual git-mechanics workaround (checkout, conflict
resolution mirroring `resolveFgosOnlyConflict`, verify, commit, CAS-guarded
ref update) to land — roughly 3 hours of session time. The eventual real
fix for `tsk-25b` itself was unrelated to any of this (a stale symbol
import in the branch's own test file, renamed on main while the branch sat
blocked) — the merge-mechanics failure investigated here was pure overhead
on top of that.

## The scope decision

A person confirmed via `/fgOS:answer`: **investigation-plus-fix**, not
investigation-only. The bar set (D2): both `performCatchUp` and
`mergeRunnerItemLocked`'s `abortMergeIfPossible` must handle any
non-conflict merge failure (including an unexplained not-uptodate refusal)
as a graceful typed outcome — **not** blocked on confirming the underlying
git-internals root trigger. Root cause of the original not-uptodate
trigger stays unconfirmed by design, deferred, not gating.

A validating-stage reality-gate check on round 1 found
`abortMergeIfPossible` already handled the broken-abort case correctly via
a typed `MergeError`; the plan was corrected to scope only
`performCatchUp`'s real fix plus a locking regression test for the
already-correct sibling.

## What shipped

`performCatchUp`'s catch block previously called `resolveFgosOnlyConflict`
(which only ever finds something to do when git already staged a real
conflict) and then unconditionally attempted `git merge --abort` — even
when the original failure was a pre-merge refusal that never started a
merge at all, a failure shape `resolveFgosOnlyConflict` cannot detect. This
produced a raw crash: `fatal: There is no merge to abort (MERGE_HEAD
missing)`.

The fix checks for `MERGE_HEAD` before treating a failure as a real
conflict:

```diff
     try {
       execFileSync('git', ['merge', '--no-commit', '--no-ff', target], { cwd: ephemeral.path, encoding: 'utf8', shell: false });
-    } catch {
+    } catch (err) {
+      if (!mergeHeadExists(ephemeral.path)) {
+        const reason = (err.stderr || err.message || '').trim();
+        return { outcome: 'merge-refused', reason };
+      }
       ...
```

A new typed outcome, `{ outcome: 'merge-refused', reason }`, is returned
for this case — aborted cleanly (nothing was staged to abort), branch
untouched. The existing conflict/verify-fail paths were also refactored to
share a new `abortMergeIfPossible` helper instead of duplicating the
same try/catch-and-rethrow abort logic inline.
`src/verbs/merge/{catchup,approve,sync-root}.mjs` were updated to handle
the new outcome. Iron Law evidence's failing-test-first proof reproduced
the real pre-fix crash text verbatim: `"fatal: There is no merge to abort
(MERGE_HEAD missing)"`.
