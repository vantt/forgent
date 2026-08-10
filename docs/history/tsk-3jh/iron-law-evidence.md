# Iron Law evidence — tsk-3jh

`classifyIronLaw` result against the real committed diff (`trunk...fgw/tsk-3jh`):

```json
{"required":true,"matchedFlags":[],"matchedModules":["src/runner/claim-port.mjs"]}
```

Matched via the `src/runner/` prefix rule (`src/evolve/iron-law.mjs`), not
a heavy-risk keyword.

## Verify command

```
node --test test/runner/claim-port.test.mjs
```

This item's own diff is a pure internal dedupe with no observable behavior
change (plan.md's own regression-guard case: the existing suite must pass
unchanged) — there was no pre-existing failing assertion to turn green. To
give the Iron Law's failing-test-first proof honestly, a new test was added
that counts real `fs.readFileSync` calls against `events.jsonl` during one
`claimWork` call — the concrete, measurable fact this fix actually changes,
not just the resulting shape.

## RED — pre-fix (`src/runner/claim-port.mjs` at commit `6dce273d`, the
commit immediately before this item's implementation landed)

```
$ node --test --test-name-pattern="6 times per call" test/runner/claim-port.test.mjs
✖ claimWork reads the event log 6 times per call, not 7 (tsk-3jh dedupe of the listWork + readRawEvents pair)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  7 !== 6
ℹ tests 1
ℹ pass 0
ℹ fail 1
```

7 reads matches this item's own original measurement ("Phần state-layer
của claimWork = 274ms, 7 lần đọc log đầy đủ"): `claimWork`'s own
`listWork` + `readRawEvents` pair (2), `moveWork`'s CAS pre-read (1),
`moveWork`'s `appendEventCore` seq-read (1), `moveWork`'s post-append
`refreshView` read (1), `addOutcome`'s `appendEventCore` seq-read (1),
`addOutcome`'s post-append `refreshView` read (1).

## GREEN — post-fix (working tree restored to the real committed state,
`git diff --stat` against the commit confirmed empty before this run)

```
$ node --test test/runner/claim-port.test.mjs
✔ claimWork reads the event log 6 times per call, not 7 (tsk-3jh dedupe of the listWork + readRawEvents pair)
ℹ tests 16
ℹ pass 16
ℹ fail 0
```

6 reads: `claimWork`'s own single combined read replaces the old
`listWork` + `readRawEvents` pair, dropping the count from 7 to 6. The
remaining 5 (moveWork's CAS pre-read, `moveWork`'s and `addOutcome`'s own
`appendEventCore` seq-reads, `moveWork`'s and `addOutcome`'s post-append
`refreshView` reads) are all load-bearing, untouched by this item —
`docs/history/tsk-3jh-dedupe-redundant-state-reads/RESEARCH.md`.

Full `npm test` (2799 tests, 2794 pass, 0 fail, 5 skipped) was also run
clean against the final committed state before `fgos return`.
