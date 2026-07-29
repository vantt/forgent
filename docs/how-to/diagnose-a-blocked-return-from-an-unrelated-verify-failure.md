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

## Related

- `fgos check <id>` — full outcome/friction history for an item, including
  the entries quoted above.
- `tsk-3ld` — the tracked backlog item for `test/state/events.test.mjs`'s
  known flakiness under high load.
- `tsk-5z2` — a related filed friction: `fgos take`'s main-checkout-lock
  error doesn't surface remaining TTL/age, forcing the same kind of manual
  "is this actually stuck, or just live and busy" diagnosis this doc
  covers for verify failures.
