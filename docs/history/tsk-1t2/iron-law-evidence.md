# tsk-1t2 — Iron Law failing-test-first evidence

`fgos approve` reported: `matched flags: [migration, audit]; matched modules: [none]`
(the item's own text mentions the events-log migration and an audit of write
call sites, tripping the keyword-based gate even though the eventual diff
turned out to be test-only).

## What was investigated

tsk-1t2 was opened on the premise that some `fgos` verb (named candidates:
`fgos edit`, `fgos pick`, `fgos return`) still appends directly to the frozen
`.fgos/events.jsonl` baseline instead of routing through the per-writer
shard path (`resolveWriterLogPath`, TA-D2/TA-D11) tsk-3ve introduced and
tsk-3tp-1 partially hardened (commit `41dcd479`, already on `main`) — based
on real events for `tsk-26r` (seq 24089-24092) found sitting in
`.fgos/events.jsonl` on `main` days after both fixes.

## Audit result: no live call site reproduces this on current `main`

Every call site reachable from a general verb (`store.mjs`'s `addWork`,
`editWork`, `moveWork`, `moveStage`, `addOutcome`, `addFriction`,
`addDecision`, `recordGateApprove`, `recordCall`, `recordCallReturn`,
`setFocus`, `resolveParkReason`, plus `dispatch/cli.mjs` and `loop.mjs`)
already calls `appendEventLocked(resolveWriterLogPath(dir), ...)` — never
the frozen `paths(dir).logPath`. `git blame` on `store.mjs`'s append lines
traces this routing back to `tsk-3ve`'s own original merge, not to a later
patch — there was never a version of `main` post-`tsk-3ve` where these call
sites wrote to the baseline directly.

## Failing-before / passing-after (real transcript)

Since no live bug reproduces, failing-before was demonstrated by
temporarily reverting the exact shape of the historical bug in
`editWork` (`src/state/store.mjs`) — swapping
`appendEventLocked(resolveWriterLogPath(dir), { type: 'work.edit', payload }, dir)`
back to `appendEventLocked(logPath, { type: 'work.edit', payload }, dir)`
(the pre-`tsk-3ve` shape) — running the new regression test, then
reverting the file back (confirmed byte-identical via `git diff --stat`,
zero residual change).

```
$ node --test --test-name-pattern "never appends to the frozen" test/cli/fgos-edit.test.mjs
✖ a full add -> edit -> move -> edit CLI lifecycle never appends to the frozen events.jsonl baseline -- every event lands under .fgos/events/ (403.71265ms)
  AssertionError [ERR_ASSERTION]: the frozen events.jsonl baseline must stay byte-identical (empty) -- every event above belongs in a per-writer shard, never here
  + actual - expected
  + '{"seq":1,...,"type":"work.edit",...}\n' + '{"seq":2,...,"type":"work.edit",...}\n'
  - ''
ℹ tests 1
ℹ pass 0
ℹ fail 1
```

After reverting `store.mjs` back to its real, committed content:

```
$ node --test --test-name-pattern "never appends to the frozen" test/cli/fgos-edit.test.mjs
✔ a full add -> edit -> move -> edit CLI lifecycle never appends to the frozen events.jsonl baseline -- every event lands under .fgos/events/ (409.783651ms)
ℹ tests 1
ℹ pass 1
ℹ fail 0
```

Full suite after the (test-only) change:

```
$ node --test
ℹ tests 3902
ℹ pass 3890
ℹ fail 7
ℹ cancelled 0
ℹ skipped 5
```

The 7 failures are pre-existing and reproduce identically with the change
stashed out (verified via `git stash` + targeted re-run): `herdr-plugin/web/
src/api/client.test.ts` (tracked, unrelated) and `test/runner/claim-port.test.mjs`'s
read-count assertion (tracked as tsk-3tb) are the two failures this repo's
own known-issue list already names. The remaining 5 (2 in
`test/cli/fgos-claim.test.mjs`, 1 in `test/cli/fgos-read.test.mjs`, 1 in
`test/cli/fgos-return.test.mjs`, 1 e2e in `test/e2e/runner-loop.test.mjs`)
match, name-for-name, the "before" baseline `docs/history/tsk-3tp-1/
iron-law-evidence.md` documents on the `tsk-3tp-1`/`tsk-3tp` branch tree:
the eager `events-jsonl-truncation-guard.mjs` periodic-checkpoint trigger
that shifts `headBefore`/`headAtTake` SHA values in tests. That fix
(commit `453dbd4a` on `fgw/tsk-3tp-1`, merged into `fgw/tsk-3tp`, per that
item's own `mergedInto` field) has not yet reached `main` — `tsk-3tp` (the
parent) itself has not merged. This is a real, separately-tracked,
already-fixed-elsewhere gap, out of tsk-1t2's own footprint; duplicating
that fix here would collide with `tsk-3tp`'s own eventual merge.

## Conclusion

No production code changed. The general/default event-append path already
routes through the per-writer shard everywhere it is called from; the
historical `tsk-26r` baseline growth (seq 24089-24092) is closed and does
not reproduce against current `main`. A CLI-process-level regression test
was added (`test/cli/fgos-edit.test.mjs`) to guard against this class of
regression recurring at a call site outside `store.mjs`'s own unit-level
coverage (`test/state/store.test.mjs` already covers `moveWork`'s
lifecycle at the in-process level).
