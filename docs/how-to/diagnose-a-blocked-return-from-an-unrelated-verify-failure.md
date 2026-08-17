---
type: how-to
title: How to diagnose a `fgos return` blocked by a verify failure unrelated to your change
tags: []
timestamp: 2026-07-29T01:09:46.000Z
source_capture_ids: [tsk-3wr-1]
---
# How to diagnose a `fgos return` blocked by a verify failure unrelated to your change

Use this when `fgos return <id>` reports `blocked` with `passed: false`, but
you have already verified your own change is correct — before assuming your
work is broken, rule out an unrelated flaky test or a concurrent session's
interference first.

## Before you start

- You need the item's id and its recorded `verify` command (`fgos list
  --json` or `fgos check <id>` shows it).
- This applies specifically when `return`'s own re-run of `verify` fails —
  not when your own manual test run already failed (that's a real bug in
  your change, fix it directly).

## Steps

1. **Read the actual failure, don't assume.** `return`'s JSON response
   includes the full `output` field (the verify command's real stdout/
   stderr). Parse it and look at exactly which test failed:

   ```js
   const j = JSON.parse(returnOutput);
   console.log(j.data.passed, j.data.exitStatus);
   console.log(j.data.output.split('\n').filter(l => /not ok|✖/.test(l)));
   ```

2. **Check whether the failing test touches the files you actually
   changed.** If the failing test lives in a file your change never
   touched, that's the first signal it's unrelated noise, not a
   regression.

3. **Re-run the failing test file in isolation, a few times.** A
   concurrency- or load-sensitive test can pass reliably alone but fail
   under a full-suite run (real OS-level resource contention) or when
   another live session is concurrently writing to the same shared state
   files:

   ```
   node --test path/to/the-failing.test.mjs
   ```

   If it passes cleanly every time in isolation, the failure is almost
   certainly load-induced flake, not something your change broke.

4. **Check the backlog for an already-tracked flaky-test item.** A
   genuinely flaky test usually already has an open item describing it —
   search `fgos list` for the test file's name. Finding one confirms this
   is known, pre-existing noise, not a new regression to fix.

5. **Resume the claim and retry.** A `blocked` return does not leave the
   item back at `todo` for a normal `fgos take` — `take` refuses a
   `blocked` item outright (it only accepts `todo`). Move it back to
   `doing` directly instead (the FSM allows `blocked -> doing` for exactly
   this recovery path), then call `return` again:

   ```
   fgos move <id> --to doing
   fgos return <id>
   ```

   Never retry blindly hoping a *deterministic* failure passes by luck —
   only retry after you've confirmed (steps 2-4) that the failure is
   genuinely non-deterministic and unrelated to your own change.

## Why this exists

`fgos take` intentionally has two claim modes: `pick` isolates work in its
own worktree, but a plain `take` works directly against the shared main
checkout with no isolation. That means a `return`'s full verify run can
observe real interference from another live session — a concurrent write
to shared state files, or a resource-contention flake — that has nothing
to do with the item actually being worked.

## Real example

Item `tsk-3wr-1` (stripping decision-code labels out of 147 test
descriptions across 30 files) had its own real rename work fully correct
and green in isolated per-directory test runs. Its first `fgos return`
still came back blocked:

> `"actual":{"outcome":"proposed","passed":true,"attempts":1,"errorClass":null,"aheadCount":2}`
> — real `work.outcome` capture, id `tsk-3wr-1` (the eventual successful outcome)

The friction recorded on the first, failing attempt:

> `{"id":"tsk-3wr-1","disposition":"blocked","errorClass":"verify-miss","layer":"verification","attempts":1,"detail":"goal-check failed (exit 1)","ts":"2026-07-29T00:42:38.404Z"}`
> — real `work.friction` capture, id `tsk-3wr-1`

The actual failing test was `test/state/events.test.mjs`'s
`appendEvent under concurrent OS processes yields unique, gapless,
strictly-increasing seqs` — a file `tsk-3wr-1`'s own change never
touched. Running that file alone, three times in a row, passed cleanly
every time (17/17, 0 fail), while another live session was independently
writing to `.fgos/events.jsonl` at the same moment. The backlog already
carries an open item describing exactly this: `tsk-3ld`, "Test suite fgOS
flaky dưới tải cao -- test/state/events" (test suite flaky under high
load). Moving the item `blocked -> doing` and returning again produced a
clean pass with no code change in between — confirming the first block
was pre-existing load noise, not a regression from the rename work.

## Real example: two genuine gaps in `return`'s own branch-source verify path, not stale tests

Item `tsk-5l2-1` (a new `resolve <executorId>` CLI subcommand on
`src/runner/dispatch.mjs`, footprint `src/runner/dispatch.mjs`/`test/`)
had its own change fully correct and green (`npm test` clean, 2038-2041
passing across several full runs). `fgos return tsk-5l2-1` still came back
`blocked`, three separate times, each for a genuine reason step 2 above
would correctly flag as *not* your own diff — but where step 4's "check
for an already-tracked flaky item" didn't apply either, because these were
real gaps in the tooling, not flaky tests:

1. **`return`'s disposable branch-source worktree had no `node_modules`.**
   Unlike `approve`'s ephemeral merge worktree (`createWorktree`, fixed for
   that path by `tsk-g18` — see the sibling how-to's "genuine gap in the
   merge machinery" section), `return`'s branch-source path builds its own
   throwaway checkout inline (`bin/fgos.mjs`, `fs.mkdtempSync(os.tmpdir())`
   + `git worktree add --detach`), a *different* code path `tsk-g18`'s
   `createWorktree` fix never touches. The failing file
   (`test/scripts/project-agents.test.mjs`, importing the real npm
   dependency `yaml`) was untouched by `tsk-5l2-1`'s own diff — the
   textbook "unrelated failure" signal from step 2 — but re-running it
   alone always passed, and it failed *every* `return` attempt, never
   intermittently: a real, deterministic gap, not noise. Fixed as its own
   commit on `fgw/tsk-5l2-1` (`9ae7760`): symlink the real `node_modules`
   into the disposable worktree before running verify.
2. **A naive fix wasn't enough — `repoRoot` itself can lack a local
   `node_modules`.** The first fix checked exactly
   `path.join(repoRoot, 'node_modules')`; that's wrong when the session
   invoking `return` is itself standing in a nested linked worktree
   several levels deep (this exact session's own shape at the time), which
   has no local install of its own and relies on Node's own upward
   resolver search reaching a real one further up — a single-directory
   `existsSync` check misses that. Fixed in a follow-up commit
   (`bd9a0d0`): a small `findNearestNodeModules` helper that walks up from
   `repoRoot` the same way Node's ESM resolver actually does.
3. **A third, unrelated cause: a bare `fgos <verb>` in an item's own
   `verify` field resolves to a stale global binary under `return`'s
   non-interactive goal-check spawn.** This surfaced on a *different*
   sibling item, `tsk-5l2-2`, whose own recorded `verify` was literally
   `fgos tool query --capability submit-assist-classify --status present`
   — correct when typed by hand in an interactive shell (where `fgos` is a
   zsh/bash function resolving to *this* repo's own `bin/fgos.mjs`), but
   `runGoalCheck` spawns verify via `spawn(cmd, {shell: true})`, which
   uses `/bin/sh` — a non-interactive shell that never sources
   `.zshrc`/`.bashrc` and therefore never defines that function. `fgos` on
   a bare `/bin/sh` PATH resolved instead to an old, globally
   `pnpm`-installed copy (`schema_version 1.0`, no `tool` verb at all),
   producing `fgos: unknown verb "tool"` — a failure with zero connection
   to the item's own diff. Fixed by editing the item's own `verify` field
   (`fgos edit <id> --verify "..."`) to a form that never depends on the
   interactive-only shell function: resolve the repo root via
   `git rev-parse --path-format=absolute --git-common-dir` and invoke
   `node "<that>/bin/fgos.mjs" ... --dir "<that>"` explicitly — the same
   git-common-dir trick every other `--dir`-passing call site in this repo
   already relies on. **Any future item whose `verify` field shells out to
   `fgos` directly should use this form, never a bare `fgos ...` call.**

Each of the three required a genuine fix (two code commits, one item-data
edit) before a retry could ever succeed — never a blind retry on the same
red state.

## Related

- `fgos check <id>` — full outcome/friction history for an item, including
  the entries quoted above.
- `tsk-3ld` — the tracked backlog item for `test/state/events.test.mjs`'s
  known flakiness under high load.
- `tsk-5z2` — a related filed friction: `fgos take`'s main-checkout-lock
  error doesn't surface remaining TTL/age, forcing the same kind of manual
  "is this actually stuck, or just live and busy" diagnosis this doc
  covers for verify failures.
