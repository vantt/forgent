# tsk-1q5 — Iron Law evidence

`classifyIronLaw` result: `required: true`, `matchedModules: ["src/state/store.mjs"]`, `matchedFlags: []`.

## Test command

`node --test test/state/events.test.mjs test/state/store.test.mjs test/state/porting-store.test.mjs` (item's own `verify`). Full suite also run: `npm test`.

## Structural proof (direct code reading, before the fix)

Before this item's fix, `src/state/store.mjs` and `src/state/porting-store.mjs` ran
every mutation's `refreshView(dir)` call AFTER releasing `withEventsLock`, as
its own separate, unlocked critical section — e.g. `addWork` (store.mjs):

```js
const event = withEventsLock(logPath, () => {
  ...
  return appendEventLocked(logPath, { type: 'work.add', payload: item });
});
const view = refreshView(dir);   // <-- outside the lock
return { event, view };
```

`refreshView` does an unconditional whole-file `rebuildView(logPath)` (replay
the log) then `fs.writeFileSync` of `state.json`. This shape repeated at 12
call sites in `store.mjs` (verified by grep before editing) and 2 in
`porting-store.mjs`. Two processes finishing their own correctly-locked
appends close together can race their unlocked `refreshView` calls: whichever
process's write lands last wins, even if its own log read predated the
other's append — a lost-update on the derived cache. This is the same class
of TOCTOU reasoning `withEventsLock`'s own doc comment already uses to
justify locking a precondition read ahead of an append (events.mjs:320-338).

## Ablation attempts (real transcripts, not fabricated)

Per this repo's own precedent for proving a narrow cross-process race
(`docs/history/events-lock-concurrency-race/CONTEXT.md` D1), the fix was
temporarily reverted (`git stash` on `src/state/store.mjs`/
`src/state/porting-store.mjs` only, tests kept) and the new regression tests
re-run against the pre-fix code, at increasing load:

- 8 processes × 1 mutation each (different ids): **passed** (no lost update observed).
- 16 processes × 30 edits each / 15 ids each (store / porting): **passed** again, twice.
- 24 processes × 80 edits each: **passed**, but this load level also produced
  genuine `lock-timeout` failures unrelated to the refreshView race (the
  aggregate 1920 individual lock acquisitions exceeded `events.lock`'s own
  2s timeout under contention) — reverted back to the 16×30 level.

None of these ablation runs reproduced a red result. This is consistent with
this repo's own documented experience for this class of race: the sibling
append-race test (`test/state/events.test.mjs`) was itself only
"spike-confirmed... ~30% of runs" flaky even under artificially heavy machine
load (two parallel full test-suite runs), per
`docs/history/events-lock-concurrency-race/CONTEXT.md`'s own Scout evidence —
a TOCTOU window this narrow (a rebuild+write of a small temp-dir file,
sub-millisecond) is inherently hard to force via OS scheduler luck alone
without synthetic external load this session did not have available.

The fix's correctness rests on the structural proof above (the exact
vulnerable pattern, confirmed present at all 14 call sites before the edit,
confirmed absent after), not on a forced red ablation run. The new tests
still serve as real regression coverage: they assert the invariant a lost
update would violate (`persisted state.json == fresh rebuild of the log`)
and pass reliably after the fix.

## Passing-after (real transcript)

Scoped verify command:

```
ℹ tests 82
ℹ suites 0
ℹ pass 82
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

Full `npm test`:

```
ℹ tests 2757
ℹ suites 0
ℹ pass 2752
ℹ fail 0
ℹ cancelled 0
ℹ skipped 5
ℹ todo 0
```

(5 skips pre-existing, unrelated to this change.)

## What changed

`src/state/store.mjs`: added `withEventsLockAndRefresh(dir, logPath, fn)`,
folding `refreshView(dir)` into the same held `withEventsLock` scope as the
append. Applied to all 12 mutation functions (`addWork`, `editWork`,
`setFocus`, `moveWork`, `moveStage`, `addDiscovery`, `recordGateApprove`,
`addDecision`, `addOutcome`, `addFriction`, `registerTool`, `removeTool`);
the 5 that previously used bare `appendEvent` now use `appendEventLocked`
inside the same wrapper. `initStore`'s and `rebuild()`'s own `refreshView`
calls left untouched (single-writer-at-setup and explicit-recovery paths,
not part of the concurrent-mutation race). `src/state/porting-store.mjs`:
same fix, same helper, applied to `addPorting`/`movePorting`.

`test/state/store.test.mjs` / `test/state/porting-store.test.mjs`: extended
`raceAcrossProcesses` with an optional per-child `extraArgvPerChild` (so a
race test can give each child a distinct id), and added a fork-based
regression test in each file proving concurrent mutations on different ids
never lose a write to `state.json`.

Root cause A of tsk-1q5. Root cause B (events.jsonl git-tracked in the
shared main checkout) is out of scope, deferred and logged on `tsk-3wq`.
