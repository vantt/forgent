# Review R1 — tsk-3tp sweep-checkpoint redesign (correctness/regression lens)

Scope: `main...fgw/tsk-3tp` (branch `fgw/tsk-3tp`, worktree
`.claude/worktrees/tsk-3tp-0YK44Z`). Correctness/regression only — no
behavioral/e2e or spec/safety judgment made here (separate review rounds).

## Diff surveyed

28 files changed (+1466/-877): `src/runner/merge.mjs` (sweep insertion),
`src/state/events-jsonl-truncation-guard.mjs` (fallback redesign),
`src/setup/registrations.mjs` (legacy doctor-check removal), `bin/fgos.mjs`
(noise-path regex), `.gitattributes`/`package.json`/
`docs/architecture-manifest.json` (legacy references dropped), deleted
`scripts/check-events-seq-contiguity.mjs` +
`scripts/events-jsonl-contiguity.mjs` + `src/state/events-jsonl-contiguity.mjs`,
plus test updates/additions (`test/runner/merge.test.mjs`,
`test/state/events-jsonl-truncation-guard.test.mjs`,
`test/state/events-legacy-absence.test.mjs` (new),
`test/cli/fgos-return.test.mjs`, `test/runner/concurrent-claim-eventlog-loss.test.mjs`,
`test/state/replay.test.mjs`, `test/setup/checks.test.mjs`,
`test/setup/registrations.test.mjs`), plus `docs/history/tsk-3tp-*` design docs.

## Test suite

Ran bare `node --test` (full suite, ~113s). Result: **3881 tests, 3874 pass,
2 fail** (no cancelled, 5 skipped):

1. `herdr-plugin/web/src/api/client.test.ts` — known pre-existing/unrelated
   (per task brief; TS-resolution issue, confirmed unrelated to this diff).
2. `test/runner/claim-port.test.mjs`: "claimWork reads the event log fully 4
   times per call, not 6 or 7" — **verified pre-existing on `main` too**: ran
   the same single test file directly against `main` (checked out at
   `/home/vantt/projects/forgentX`, unaffected by this branch) and it fails
   there as well (`8 !== 4`, vs. `6 !== 4` on the branch — the exact count
   looks environment-sensitive, but the failure itself reproduces
   independently of tsk-3tp). This test file, and everything it imports
   (`src/runner/claim-port.mjs`, `src/state/store.mjs`), is untouched by the
   `main...HEAD` diff. Not a regression from this branch.

No other failures. Suite is genuinely green modulo these two pre-existing,
branch-independent issues.

## Legacy-caller sweep (grep audit)

Grepped the whole repo for `events-jsonl-contiguity`, `check-events-seq-
contiguity`, `check:events-seq`, `PERIODIC_CHECKPOINT_INTERVAL_SEC`,
`DEFAULT_CHECKPOINT_EVENT_THRESHOLD`. Every hit outside `docs/history/**`
(historical/narrative, not live code) is either: a comment/precedent
reference in `src/state/events-compaction.mjs` / `src/state/replay.mjs` /
`test/state/replay.test.mjs`, or the new `test/state/events-legacy-absence.test.mjs`
which actively asserts the retired files/imports are gone. `package.json`'s
`check:events-seq` script and `.githooks/*` references are both clean —
confirmed removed. No stale caller of the deleted API found.

## Finding

**Verdict: FINDINGS**

1. **The new merge-time sweep in `src/runner/merge.mjs` (D2's core
   mechanism) silently never fires for any leaf→parent or promote-engine
   merge — only for a direct root→main merge — due to a `repoRoot`/
   `lockRoot` base mismatch, confirmed by direct git reproduction.**

   `src/runner/merge.mjs:1355-1376` (`mergeRunnerItemLocked`):
   ```js
   const sweepFgosDir = path.join(lockRoot, '.fgos');
   const sweepLogPath = path.join(sweepFgosDir, 'events.jsonl');
   const sweepEventsDirPath = path.join(sweepFgosDir, 'events');
   const sweepPathspecs = [];
   if (fs.existsSync(sweepLogPath)) {
     sweepPathspecs.push(path.relative(repoRoot, sweepLogPath) || '.fgos/events.jsonl');
   }
   if (fs.existsSync(sweepEventsDirPath)) {
     sweepPathspecs.push(path.relative(repoRoot, sweepEventsDirPath));
   }
   if (sweepPathspecs.length > 0) {
     try {
       const statusOut = git(repoRoot, ['status', '--porcelain', '--', ...sweepPathspecs]).trim();
       if (statusOut.length > 0) {
         git(repoRoot, ['add', ...sweepPathspecs]);
       }
     } catch {
       // non-blocking
     }
   }
   ```
   The filesystem existence check and the `.fgos` directory itself are
   resolved off `lockRoot` (correct — per `mergeRunnerItem`'s own doc
   comment at `merge.mjs:875-883` and
   `docs/explanation/why-mergerunneritem-takes-a-separate-lockroot-param.md`,
   `lockRoot` is the *real* repo root while `repoRoot` is an *ephemeral
   worktree* used only as the git-op cwd for a leaf→parent merge —
   `src/runner/promote-engine.mjs:73` and
   `src/verbs/merge/approve.mjs:533` both call `mergeRunnerItem(ephemeral.path,
   item, { lockRoot: repoRoot, ... })`). But the two `path.relative(...)`
   calls here use `repoRoot` (the ephemeral worktree), not `lockRoot`, as
   the base — and the subsequent `git status`/`git add` calls run with
   `cwd: repoRoot` (see `git()`'s definition at `merge.mjs:93-102`,
   `cwd: repoRoot`). Whenever `lockRoot !== repoRoot` (every leaf→parent
   approve, every promote-engine merge — i.e. every merge that is *not* the
   final root→main approve), the computed pathspec is a `../`-relative path
   that resolves *outside* the ephemeral worktree's own tree. Git refuses
   any pathspec that resolves outside the current repository/worktree with
   `fatal: ... is outside repository at '<repoRoot>'` (exit 128) — I
   reproduced this exact error empirically with two sibling repos standing
   in for main-checkout vs. ephemeral-worktree (see reproduction below) —
   and that throw is swallowed by the surrounding `catch { // non-blocking
   }`, so the sweep silently does nothing.

   Reproduction (isolated scratch dirs, not touching the real repo):
   ```
   $ node -e "console.log(require('path').relative('<other>', '<main>/.fgos/events'))"
   ../main/.fgos/events
   $ git status --porcelain -- ../main/.fgos/events   # (cwd=<other>)
   fatal: ../main/.fgos/events: '../main/.fgos/events' is outside repository at '<other>'
   ```

   **Why this matters:** D2's own stated purpose is "gom dirty `.fgos/events/`
   shard vào chính các merge/approve commit main đằng nào cũng tạo" (sweep
   dirty shards into whatever merge/approve commit is already happening) —
   but the only place this sweep block exists is inside
   `mergeRunnerItemLocked`, and it is only reachable/effective when
   `lockRoot === repoRoot` (the direct root→main approve path,
   `src/verbs/merge/approve.mjs:706`, and `sync-root.mjs` when it omits
   `lockRoot`). For every leaf-item approve and every promote-engine
   fan-out merge — plausibly the *majority* of merge events in this
   platform's actual dispatch workflow — the sweep is dead code that always
   throws and gets caught. The only mechanism that still works for those
   merges is the 1-hour sparse fallback
   (`runOpportunisticMainCheckoutChecks`, which correctly threads
   `lockRoot`/`realRepoRoot` throughout and is unaffected by this bug), so
   real behavior degrades to "dirty events only get committed by the
   1-hour timer," not "swept into the next merge," for that whole class of
   merges — silently, with no error surfaced anywhere.

   **Confirmed untested:** the only new test for this mechanism,
   `test/runner/merge.test.mjs`'s "mergeRunnerItem sweeps a dirty untracked
   `.fgos/events/` shard file into its own merge commit" (added by this
   branch), calls `mergeRunnerItem(repoRoot, makeItem(...))` with no
   `lockRoot` override at all — i.e. it only exercises the `lockRoot ===
   repoRoot` case. No test in the diff exercises a merge where `lockRoot`
   differs from `repoRoot` together with a dirty `.fgos/events/` shard, so
   this gap shipped unnoticed. `plan.md:84`'s own risk row ("Sweep stage
   nhầm file ngoài `.fgos/events/` vào merge commit") anticipated the
   *opposite* failure direction (staging something outside the intended
   prefix) and was mitigated for that; the actual failure mode here — the
   sweep matching *nothing at all* for a large class of real merges — was
   not on that risk list and has no compensating test.

   Suggested fix direction (not applied — review-only per task brief):
   compute `sweepLogPath`/`sweepEventsDirPath` relative to `lockRoot`
   (matching where they're resolved from), and run the `git status`/`git
   add` calls with `cwd: lockRoot` when sweeping — or, if the design intent
   is that the sweep should only ever apply to the real checkout's own
   `.fgos/` (never something living in a separate ephemeral worktree
   process), gate the whole block on `lockRoot === repoRoot` explicitly so
   the no-op is a documented decision rather than a swallowed exception.

No other correctness/regression issues found: no stale caller of the
deleted contiguity API/script, no over-broad glob in the sweep's pathspecs
(they're exact, non-wildcard `.fgos/events.jsonl` / `.fgos/events` paths),
the sparse-fallback interval check (`currentTimeSec - refSec >=
effectiveFallbackIntervalSec`) has no off-by-one, and
`runOpportunisticMainCheckoutChecks` itself correctly threads
`lockRoot`/`realRepoRoot` end-to-end (unlike the sweep block above) so it
is unaffected by this bug.

Verdict: FINDINGS
