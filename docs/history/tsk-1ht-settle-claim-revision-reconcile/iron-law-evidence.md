# Iron Law evidence — tsk-1ht

`classifyIronLaw` on this item's final committed diff (`d6a2169c`) returns:

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": ["src/state/store.mjs"]
}
```

`src/state/store.mjs` is on `MODULE_RULES`'s self-modifying-capable list —
this is the item's own core coordination-state module (`settleClaim`,
`editWork`, `moveWork`, every other durable state mutation in the repo
goes through this one file), a real trigger, not a description-keyword
false positive.

## Failing-test-first proof

Verify command: `node --test test/state/runtime-coordination.test.mjs`

**Before** (the `revisionDriftIsSelfCaused` reconcile branch temporarily
reverted back to the original unconditional throw, real transcript):

```
✖ settleClaim reconciles a revision drift caused entirely by the SAME writer that holds the claim, instead of refusing (51.269209ms)
✖ settleClaim reconciles a same-writer drift even when unstamped side-log events (decision, gate-approve) also happened mid-claim (53.262649ms)
ℹ tests 25
ℹ pass 23
ℹ fail 2

✖ failing tests:

test at test/state/runtime-coordination.test.mjs:549:1
✖ settleClaim reconciles a revision drift caused entirely by the SAME writer that holds the claim, instead of refusing (51.269209ms)
  Error [StoreError]: settleClaim: item "tsk-1" durable revision changed from "8e4d2961ea846612" to "7d55369e9e0110bc".
      at file:///.../src/state/store.mjs:1179:17
      at settleClaim (file:///.../src/state/store.mjs:1143:17)
      at TestContext.<anonymous> (file:///.../test/state/runtime-coordination.test.mjs:568:17)
    category: 'conflict'

test at test/state/runtime-coordination.test.mjs:586:1
✖ settleClaim reconciles a same-writer drift even when unstamped side-log events (decision, gate-approve) also happened mid-claim (53.262649ms)
  Error [StoreError]: settleClaim: item "tsk-1" durable revision changed from "dde0fbd064a3b286" to "f6100b008efcac8f".
      at file:///.../src/state/store.mjs:1179:17
      at settleClaim (file:///.../src/state/store.mjs:1143:17)
      at TestContext.<anonymous> (file:///.../test/state/runtime-coordination.test.mjs:603:17)
    category: 'conflict'
```

**After** (the reconcile branch restored, real transcript):

```
✔ settleClaim reconciles a revision drift caused entirely by the SAME writer that holds the claim, instead of refusing (85.660637ms)
✔ settleClaim reconciles a same-writer drift even when unstamped side-log events (decision, gate-approve) also happened mid-claim (61.808019ms)
✔ settleClaim still refuses a revision drift caused by a GENUINELY DIFFERENT writer, even under the same-writer reconcile (60.359458ms)
✔ settleClaim treats an event with no writer stamp at all as NOT self-caused (fails closed, keeps refusing) (47.518982ms)
ℹ tests 25
ℹ pass 25
ℹ fail 0
```

`git diff --stat src/state/store.mjs` after restoring reported no output
(zero diff) — the revert-and-restore cycle introduced no drift from the
already-committed version.

## Blast radius (why `src/state/store.mjs` is expected here, not alarming)

The only change inside `src/state/store.mjs` is the new
`revisionDriftIsSelfCaused` helper plus its `SIDE_LOG_ONLY_EVENT_TYPES`
denylist, and the one `if (!revisionDriftIsSelfCaused(...))` guard wrapped
around `settleClaim`'s existing revision-conflict throw — no other check
in `settleClaim` (claimId, writer-identity, status-drift) or any other
exported function in this file is touched. The full existing
`test/state/runtime-coordination.test.mjs` suite (25/25, including every
pre-existing test) is the direct proof those other checks are unaffected;
the full repo suite (`node --test 'test/**/*.test.mjs'`, run twice across
this item's own two implementation rounds) came back green both times
(4142/4142 then 4143/4143, 0 failures, 5 pre-existing skips both times).

## Live end-to-end confirmation (beyond the unit tests)

This fix was also verified against the REAL repo, not only synthetic test
fixtures: retrying `fgos plan tsk-1ht` against this item's own actual
`.fgos/` claim/event history (drifted by this item's own real
discovery/planning-stage `fgos edit`/`fgos decision`/`fgos gate-approve`
calls) produced a real reconcile (`fgos: settleClaim reconciled a
same-writer revision drift for "tsk-1ht" ...`) and let the
`planning`→`executing` transition succeed — the exact failure mode
described in the item's own repro (tsk-1sl), reproduced and fixed live on
this item itself. See `RESEARCH.md` rounds 2 and 4 for the full detail.

## Verification source

- `src/evolve/iron-law.mjs` read directly — confirms `src/state/store.mjs`
  is on `MODULE_RULES` by design, not a bug in the classifier.
- Real `node --test` transcripts above, captured by temporarily reverting
  and restoring the reconcile branch in this same worktree.
- Full `test/state/runtime-coordination.test.mjs` (25/25) and full repo
  suite (4143/4143, 0 fail) — confirms no collateral blast radius beyond
  the one reconcile branch.
- Live `fgos plan tsk-1ht` retry against the real repo state (RESEARCH.md
  rounds 2 and 4).
