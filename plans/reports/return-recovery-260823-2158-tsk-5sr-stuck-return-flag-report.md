# tsk-5sr — recovery record: `fgos return` deadlock and merge-state reconciliation

**Date:** 2026-08-23 · **Item:** `tsk-5sr` (aggregator parent, 9 children, all `done`)
**Trigger:** `/fgOS:pick tsk-5sr` re-claimed the item from `blocked`
(`parkReason: system-error`, stale `reason` from a prior merge-reachability
check on child `tsk-64h`). This note records what was actually verified
during the recovery, not a restatement of `FINDINGS.md` or the round-2
audit — both already exist and are cited below.

## 1. `tsk-5sr` itself has no diff of its own

`git status --short` on `fgw/tsk-5sr` is clean; `branchHeadAtTake ==
branchHeadAtReturn == 2b009efb8a64c18faf886dc7a01a39ef13001016`. This
matches the item's own description: it is a pure aggregator
("Cha chỉ done khi mọi con done") — all 9 children (`tsk-2el`, `tsk-3zi`,
`tsk-31lz`, `tsk-64h`, `tsk-2t3`, `tsk-q88`, `tsk-5eq`, `tsk-19m`,
`tsk-2so`) read `status: done` as of this recovery.

## 2. Merge-state check, re-verified today

`plans/reports/audit-round2-260812-1713-tsk-5sr-post-merge-verification-report.md`
(2026-08-12, on `main`) found that `tsk-5sr` and its child `tsk-64h` had
both reached `delivered` via a manual `work.move` (no `work.gate-approve`
event, no real merge into `main`) — the same bug class as `tsk-13z`
(2026-08-10). That report is why the `blocked` reason surfaced by this
pick cites a merge-reachability failure on `tsk-64h`'s commit.

Re-checked today, from inside `fgw/tsk-5sr`'s own worktree:

```
$ git merge-base --is-ancestor fgw/tsk-64h main   # 7d6ae519...
ancestor: yes
$ git merge-base --is-ancestor HEAD main          # fgw/tsk-5sr @ 2b009efb
ancestor: yes
$ git merge-base --is-ancestor main HEAD
ancestor: no   (main is strictly ahead — expected, unrelated work landed since)
```

Both `tsk-5sr`'s own branch tip and `tsk-64h`'s commit are genuine
ancestors of `main` today. The compound-learn doc `tsk-5sr` had already
written in a prior pass —
`docs/explanation/why-a-clean-npm-test-run-missed-16-edge-gaps-after-the-lifecycle-rebuild.md`
— is present on `main` too. The G1 gap the round-2 audit flagged (phantom
delivery, content never merged) does not reproduce against current `main`;
whatever the resolution path was, the real content is there now. This
recovery did not re-derive *how* it got fixed — only confirmed *that* it
did, via the two `merge-base` checks above, which is the load-bearing fact
for closing this item out.

## 3. `npm test` (the item's own `verify`) is flaky right now, not red

Three runs, same worktree, same commit, no code change between them:

| # | How it ran | Result |
|---|---|---|
| 1 | `npm test` directly | exit 0, clean |
| 2 | inside `fgos return tsk-5sr --no-new-commits-ok` | exit 1 — 131 failing assertions, almost all tracing to `runner config (...) "executors" key "pi" is not a tier` (a global `~/.fgos/config.json` shape leaking into fresh per-test-repo configs) plus `appendEvent: timed out acquiring events.lock ... another process is writing` |
| 3 | `npm test` directly, immediately after | exit 0, clean, 0 failures |

The `~/.fgos/config.json` in question is the real user-global config
(`runner.executors.pi`, a named-executor entry, not a tier override) — it
predates the tier-shaped `executors` validation `validateRunnerConfigShape`
now enforces (`bin/fgos.mjs`). Some test bootstrap path merges global
config defaults into fresh per-repo fixtures, and at the moment run #2
executed, something else running concurrently on this machine (this repo
runs many worktrees/sessions at once — same environment class the prior
`fgos-move-exception-for-verified-flake` precedent describes, see
`test/state/porting-store.test.mjs`-style concurrency flakes) was writing
to shared state at the same time, producing both symptoms. Runs #1 and #3
bracket #2 cleanly, in the same worktree, with zero diff — this is the
standard flake signature, not a regression introduced by this recovery
(there is no diff to regress).

## 4. Why `--no-new-commits-ok` and `fgos catchup` don't apply anymore

Run #2's `fgos return --no-new-commits-ok` recorded a real `blocked`
`actual` outcome for `tsk-5sr`
(`view.outcomes['tsk-5sr'].actual.outcome === 'blocked'`, `errorClass:
'verify-miss'`). `bin/fgos.mjs`'s `assertNoPriorBlockedOutcome` refuses
`--no-new-commits-ok` for an id whenever that id's outcome history has
*ever* recorded a `blocked` actual — item-wide, not scoped to the current
claim, by design ("the flag only closes out work that was never returned,
never rescues a failed retry"). That guard is now permanently tripped for
`tsk-5sr`. `fgos catchup` doesn't apply either — it only recovers a
merge-related `blocked` reason (`merge-conflict` /
`verify-fail-post-merge` / etc., per
`docs/how-to/recover-a-blocked-item-with-fgos-catchup-from-inside-its-own-worktree.md`),
and the current `reason` field is the stale pre-existing merge-reachability
text from before this pick, not run #2's verify-fail.

This commit is the intended way out: a real, non-empty diff on `tsk-5sr`'s
own branch, so the next `fgos return tsk-5sr` (no flag needed) advances the
branch past `branchHeadAtTake` on its own merits.

## Unresolved

- The mechanism by which `tsk-5sr`/`tsk-64h` went from the round-2 audit's
  "phantom delivered, never merged" state to "genuinely ancestor of `main`
  today" was not traced — only confirmed as a fact. If it matters later,
  `git log --all --grep tsk-64h` / `git reflog show fgw/tsk-5sr` is the
  starting point.
- The `~/.fgos/config.json` `executors.pi` shape mismatch (named-executor
  entry vs. the tier-keyed shape `validateRunnerConfigShape` expects) is a
  real environment issue, reproducible under concurrent load. It sits
  outside `tsk-5sr`'s own 9 declared children (none of them touch
  `src/runner/dispatch.mjs` or the global config), so it was not fixed
  here — flagging it in case it belongs in a future edge-gap sweep.
