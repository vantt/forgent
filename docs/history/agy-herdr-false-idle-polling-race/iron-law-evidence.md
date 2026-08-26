# Iron Law evidence — tsk-2rr

## Classification

```
node --input-type=module -e "
import { changedFiles } from './src/runner/merge.mjs';
import { classifyIronLaw } from './src/evolve/iron-law.mjs';
import { listWork } from './src/state/store.mjs';
const item = listWork('/home/vantt/projects/forgentX/.fgos').work['tsk-2rr'];
const filesChanged = changedFiles('/home/vantt/projects/forgentX', item);
console.log(JSON.stringify(classifyIronLaw({ filesChanged, description: item.description }), null, 2));
"
```

Result (real, against the actual committed diff):

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": [
    "src/runner/dispatch/transport.mjs"
  ]
}
```

## Verify command

```
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test test/runner/herdr-spawn-adapter.test.mjs
```

## Failing-test-first proof (real, not narrated)

Method: temporarily swapped `src/runner/dispatch/transport.mjs` back to
its pre-item version (`git show 21966be3:<path>`, `21966be3` =
`branchHeadAtTake`), kept the NEW test file (`git show HEAD:<path>`),
ran the new tests against the old code, confirmed a real failure,
restored the current (fixed) files (`git checkout HEAD -- <both paths>`,
`git status` clean before and after, proving the restore was exact), and
confirmed the same tests pass.

**Before (old code, real failure output — the new mocked test fails
deterministically):**

```
✖ herdr-spawn adapter interactiveMode ignores premature idle signal until
  working is observed at least once (tsk-2rr) (682.341321ms)
  AssertionError [ERR_ASSERTION]: expected at least 3 polls (0: premature
  idle, 1: working, 2: real idle), got 2
      at TestContext.<anonymous> (test/runner/herdr-spawn-adapter.test.mjs:1287:10)
ℹ tests 2
ℹ pass 1
ℹ fail 1
```

(The live test in the same run happened to pass against the old code —
expected and consistent with the bug's own nature: the false-idle race is
real but non-deterministic against real LLM timing, sometimes not
triggering. The mocked test above is the deterministic proof; RESEARCH.md
Rounds 2–3 document the live, real-dispatch failure rate directly.)

**After (current, fixed code, real pass output):**

```
✔ herdr-spawn adapter interactiveMode ignores premature idle signal until
  working is observed at least once (tsk-2rr)
✔ herdr-spawn adapter (LIVE): dispatch a real agy-herdr interactiveMode
  executor against real binaries (11969.001395ms)
ℹ tests 2
ℹ pass 2
ℹ fail 0
```

Full suite, real run: 30/30 pass, 0 fail (multiple repeated full-file
runs during implementation — see below).

## Real bugs found via live testing (not caught by mocks alone)

This item's own implementation surfaced a SECOND, related race beyond
the one it set out to fix — found only by independently re-verifying the
first fix's own live test result rather than trusting a single green run:

1. **The original false-idle race** (the item's own subject,
   `docs/history/agy-herdr-false-idle-polling-race/RESEARCH.md` Rounds
   1–2): `herdr`'s `agent_status` classifier can falsely report `idle`
   during a pane's own startup rendering, well before the agent has done
   any real work. Fixed with a `sawWorking` gate: only trust a subsequent
   `idle`/`done` once `working` has been observed at least once.
2. **A residual mid-turn race** (RESEARCH.md Round 3, found while
   verifying the `sawWorking` fix): a multi-step turn (file edit, then a
   separate shell-command tool call) can show a brief `idle`-looking gap
   BETWEEN the two real tool calls. A single-poll `sawWorking` gate alone
   still let this fool completion detection ~25% of the time in isolated
   live re-runs (1 failure / 4 runs), and more often under full-test-file
   concurrent load (2 failures / 3 full-file runs). Fixed by requiring
   the SAME terminal reading on 3 consecutive 500ms polls before trusting
   it — measured 0 failures across 4 full-file runs and 5+ isolated runs
   afterward (not proof of "never": live LLM-backed timing is not
   perfectly bounded, and one further isolated re-run during Iron Law
   evidence-gathering itself hit the adapter's own outer 60s timeout once,
   confirmed a one-off by an immediate clean re-run right after — the
   same "real timing flake, not a regression" class this repo already
   accepts, per tsk-10j's own iron-law-evidence.md precedent).

3. **`done` gated on `sawWorking` with no evidence, found by an
   independent advisor review (RESEARCH.md Round 4).** Confirmed real by
   a failing-test-first check: swapped `transport.mjs` back to the
   pre-Round-4 commit (`e8cfa897`), kept the new Round 4 test file, and
   ran the new "done never passing through working" mock test against
   it — it failed for real:

   ```
   ✖ herdr-spawn adapter interactiveMode: a "done" completion never
     passing through "working" still completes, not gated on sawWorking
     (review finding, tsk-2rr) (5069.553079ms)
     Error [DispatchError]: executor timed out after 5000ms for work
     "done-no-working-item".
   ```

   Restored the fix (`git checkout HEAD -- <path>`, re-applied — see
   commit `945e7fc4`), confirmed both new tests pass, full suite 32/32.
   A second independent finding in the same review (the existing
   debounce test only proved *a* debounce existed, not the specific
   3-poll requirement) was closed with a new deterministic test proven
   to discriminate a 2-poll gate from a 3-poll gate by construction
   (RESEARCH.md Round 4 has the full reasoning).

## Accepted scope decision (not a defect)

The 3-consecutive-poll debounce adds up to ~1000ms of extra latency
before a genuine completion is recognized — negligible against the
multi-second-to-tens-of-seconds real dispatch times observed throughout
this investigation (and RESEARCH.md's own Round 2/3 live timing data).
This is documented plainly as a real, measured improvement over both the
original bug (0 successes across 6+ pre-fix live attempts) and the
1-poll/2-poll intermediate versions tried during implementation, not
claimed as a mathematically guaranteed fix — a load-dependent residual
flake of this kind is inherent to polling a heuristic, load-sensitive
external signal (`herdr`'s own `agent_status` classifier), not something
this adapter can fully control from its own side alone.
