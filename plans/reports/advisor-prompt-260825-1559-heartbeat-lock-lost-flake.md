# Advisor prompt: `lock-lost-mid-merge` heartbeat test flakes under full-suite load

## Context

Repo: forgentX (fgOS). Test runner: Node's built-in `node --test`, full suite
is ~4060 tests, ~2 minutes wall time. Two full-suite runs today each had
exactly ONE failure, in a DIFFERENT test each time, both from the same family
described below. Both failures disappeared when the failing test file was
re-run in isolation (3/3 passes each time). No production code touched in
this session's changes is anywhere near the failing tests' subject
(`src/runner/merge.mjs`'s lock-heartbeat mechanism) — the two runs bracket
unrelated, separately-committed changes to claim/settle code
(`src/state/store.mjs`, `src/runner/claim-port.mjs`), so the flake is judged
pre-existing, not a regression from that work.

## The mechanism (identical in all 3 occurrences)

Three tests — `test/runner/merge.test.mjs` ("mergeRunnerItem reports
'lock-lost-mid-merge' when heartbeat renewal fails before commit and never
calls abortMergeIfPossible"), and a byte-identical pair in
`test/cli/fgos-merge.test.mjs` / `test/cli/fgos-merge-2.test.mjs` ("sync-root
outcome guard catches lock-lost-mid-merge and records unhandled-outcome
friction (tsk-3df)") — all use the same construction:

```js
process.env.FGOS_HEARTBEAT_INTERVAL_MS = '10';
const lockOverwriter = `node -e "require('fs').writeFileSync('${lockPath}', JSON.stringify({pid: 999999, ts: Date.now()})); const end = Date.now() + 50; while (Date.now() < end) {}"`;
// ... verify/goal-check runs `lockOverwriter` as a child process, which
// overwrites main-checkout.lock with a different pid, then busy-waits 50ms.
```

Production side (`src/runner/merge.mjs`): a real `setInterval(renew,
heartbeatIntervalMs())` (line ~796/933) renews the lock every tick;
`heartbeatIntervalMs()` reads `FGOS_HEARTBEAT_INTERVAL_MS` (line ~728,
falling back to `DEFAULT_TTL_MS/3` when unset). The test's assumption: within
the 50ms window the lock-overwriter script busy-waits, at least one 10ms
heartbeat tick must fire, notice the lock file's pid no longer matches, and
flip `heartbeatStatus.status` to something other than `'renewed'` — which
`mergeRunnerItem` checks (line ~1487-1492) right before committing, aborting
the merge with outcome `lock-lost-mid-merge` instead of committing.

## Why this is a real timing race, not a logic bug

`setInterval` in Node has no real-time guarantee — under heavy event-loop/CPU
contention (exactly what a ~4060-test full run creates), a scheduled 10ms
tick can fire tens or hundreds of milliseconds late. The test's own
"guarantee" a tick fires — a plain synchronous `while (Date.now() < end) {}`
busy-loop for 50ms — is itself CPU-hogging and competing for the same
starved scheduler as the heartbeat timer it's trying to give room to run.
Both isolated-run reliability (3/3 pass each) and full-suite intermittency
point at real wall-clock scheduling drift under load, not a race in the
production merge/lock logic itself.

## Relevant precedent in this same repo

`docs/history/tsk-4fx-concurrency-test-lock-timeout-flake/RESEARCH.md`
documents an already-resolved, different-mechanism flake in the same genus:
tests racing many real OS processes against `src/state/events.mjs`'s
`events.lock` occasionally exceeded its fixed 2000ms acquisition timeout
under full-suite CPU load. That item's resolution, on record:

- Rejected touching the production lock-timeout constant (`EVENTS_LOCK_TIMEOUT_MS`,
  a deliberate, documented, load-bearing default with no override hook) as
  out of the declared footprint and higher blast radius than necessary.
- Fixed entirely on the test side: reduced PEAK simultaneous contention
  (batched child-process starts instead of firing all N at once) without
  changing total operation count or the race semantics under test.

That specific fix (batching concurrent lock contenders) does not transfer
directly here — this flake isn't about too many processes fighting one file
lock, it's a single timer needing to fire inside a fixed wall-clock window
under scheduler pressure. But the PRECEDENT's shape (prefer a test-side fix
that doesn't touch the production timing constant, unless there's a strong
reason to) is presumably still the house preference.

## What I'm asking you to weigh in on

1. Is my read of the mechanism (timer-scheduling drift vs. a real logic
   race in `merge.mjs`'s heartbeat/lock-loss detection) correct, or is
   there a subtler production bug I should rule out first before treating
   this as "just" a test-timing problem?
2. What's the right fix shape for a test that needs to assert "a background
   timer noticed an external change within a wall-clock window", given
   Node's `setInterval` isn't real-time? Candidates I can think of but
   haven't picked between:
   - Give the busy-wait window more headroom (e.g. 50ms → 300-500ms) —
     cheapest, but still a real-clock assumption that could still flake
     under sufficiently bad scheduler pressure, just less often.
   - Replace the real-timer heartbeat in these specific tests with an
     injectable/fake clock (e.g. Node's `node:timers/promises` +
     dependency injection, or a test-only hook to trigger a heartbeat tick
     synchronously) so the test controls exactly when a tick fires instead
     of hoping the OS scheduler cooperates — bigger change, touches
     `merge.mjs`'s heartbeat wiring for testability.
   - Poll/wait for the heartbeat's OWN observable side effect (e.g. spin
     checking `heartbeatStatus` or a written marker) instead of a blind
     fixed-duration busy-wait, so the test only proceeds once a tick has
     provably happened — no timing constant at all, but needs a way to
     observe that state from outside `mergeRunnerItem`'s call.
   - Accept it as a documented standing flake (same disposition as
     tsk-4fx) and do nothing beyond noting it, since it self-resolves on
     any isolated re-run and never left `main` broken.
3. Given this exact test body is duplicated 3x across 3 files (one direct
   `mergeRunnerItem` test, two byte-identical CLI-level copies), should a
   fix land once and be propagated to all 3, or is the duplication itself
   worth collapsing as part of this?

## Constraints / house rules to respect in any answer

- Prefer the smallest test-side fix over a production-code change unless
  there's a concrete reason the production code itself needs to change.
- Never weaken what the test actually proves (that a genuinely lost lock
  aborts the merge and never commits) to make it "pass more reliably" —
  a fix that hides the real assertion is worse than the current flake.
- No new external test dependencies (no fake-timer library) unless you
  think it's clearly worth it — the repo's other concurrency tests
  (`test/state/store.test.mjs`'s `raceAcrossProcesses`) all use real
  `Atomics.wait`/real child processes, no mocking libraries anywhere in
  `test/`.
