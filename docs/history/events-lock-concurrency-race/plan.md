# events-lock-concurrency-race — plan

## Mode

**Spike.** Flag count: 2 (existing covered behavior — this touches an
already RUL10-ablation-proven mechanism; weak proof around the area — the
current test is itself flaky, undermining confidence either way). No
hard-gate flag (no auth/data-loss/audit/external-provider/removed
validation) applies, so flag count alone would land at `standard`. Spike is
chosen instead because the whole item collapses to one yes/no question that
decides whether any code change is even needed (D1, `CONTEXT.md`): does the
patched lock stay reliably green under the load that reproduces today's
flake? Everything downstream is conditional on that single answer.

## The question

Run the ablation `CONTEXT.md` D1 already locked — patch removed vs restored
— but at `N_PROC = 20` (D2's headroom target, up from the test's current 6),
repeated enough times to catch the flake's own observed ~30% rate (5
repeated runs of the patched variant is enough to make a 30%-per-run flake
show up with >83% probability; if it stays green across all 5, that's
strong evidence for (b)):

1. Stash the `events.lock` patch (same technique RUL10's original proof
   used). Run the race test at `N_PROC = 20` — expect reliably RED (proves
   the race exists at this scale without the lock; if it does NOT reliably
   fail here, the ablation technique itself doesn't transfer to 20 procs
   and D1's proof bar needs revisiting before anything else).
2. Restore the patch. Run the same test 5 times at `N_PROC = 20`.
   - **All 5 green** → closes as **(b)**: the lock holds at the real
     headroom target: remedy is the test-side fix already scoped in
     `CONTEXT.md`'s deferred questions (loosen threshold/retry, or exclude
     from the default full-suite run behind a flag) — pick whichever keeps
     `npm test` fast for everyone while still exercising the lock somewhere
     in CI.
   - **Any red** → closes as **(a)**: a real race exists in
     `acquireEventsLock`/`tryAcquireEventsLockOnce`
     (`src/state/events.mjs:203-292`). The failure's exact shape (which
     assertion breaks, what the duplicate/gap pattern looks like) points at
     which of the two reads in the stale-pid-reclaim branch
     (`src/state/events.mjs:224-247`) is racing — that diagnosis happens at
     that point, not guessed now.

## Risk map

| Component | Risk | Proof point |
|---|---|---|
| `acquireEventsLock`/`tryAcquireEventsLockOnce` (`src/state/events.mjs:203-292`) | Medium — every `appendEvent` call in the whole system funnels through this lock; a real bug here is critical, but the RUL10 ablation and the 557-event measurement in `CONTEXT.md` both lean toward the lock being sound | The question above, run at `fgos-validating` |
| `test/state/events.test.mjs:225-287` (the race test itself) | Low — worst case is the test stays imperfect, not that production data corrupts | Same run above |

## Files likely touched

- `test/state/events.test.mjs` — bump `N_PROC` from 6 to 20 for the
  ablation run (temporary, for the spike) and for whichever permanent
  parameter change the outcome calls for.
- `src/state/events.mjs` — only if outcome is (a); no changes if (b).

## Order

Single isolated item — `fgos graph --id tsk-3ld` confirms tsk-3ld is its own
size-1 component (no deps, nothing depends on it), so no cross-item
ordering applies.

## Split

No split. One honest piece: run the question above, then apply whichever
remedy it points to. The item's own description already scoped both
outcomes as fitting in one item.

## Verify

Already set by `fgos discover`'s judgment (not re-decided here, per
"leave execution alone"): `npm test -- test/state/events.test.mjs && for i
in {1..3}; do npm test; done`.
