# tsk-1t2 — plan

## Status

Done. Investigation-only; no production code changed.

## Phases

1. **Audit** — traced every `appendEvent`/`appendEventLocked` call site
   reachable from a general verb (`store.mjs`'s `addWork`/`editWork`/
   `moveWork`/`moveStage`/`addOutcome`/`addFriction`/`addDecision`/
   `recordGateApprove`/`recordCall`/`recordCallReturn`/`setFocus`/
   `resolveParkReason`, plus `dispatch/cli.mjs`/`loop.mjs`). All already
   route through `resolveWriterLogPath`, never the frozen `events.jsonl`
   baseline. `git blame` traces this back to `tsk-3ve`'s own original
   merge — no post-`tsk-3ve` regression window exists on `main`.
2. **Reproduce** — attempted 3 ways (in-process `store.mjs` calls, a fresh
   fixture repo through the real spawned CLI, and this session's own live
   `fgos pick tsk-1t2`): none land a byte in `.fgos/events.jsonl`.
3. **Regression guard** — added a CLI-process-level test
   (`test/cli/fgos-edit.test.mjs`) driving `add`/`edit`/`move`/`edit`
   through the real `fgos` binary, asserting the frozen baseline never
   changes. Verified failing-before by temporarily reverting `editWork`'s
   append call to the pre-`tsk-3ve` shape (see
   `docs/history/tsk-1t2/iron-law-evidence.md`).
4. **Document** — found and named a separate, real, already-fixed-
   elsewhere gap: 5 test failures (headBefore/headAtTake shifting under
   an eager truncation-guard periodic commit) that are `tsk-3tp-1`'s own
   scope, merged into `fgw/tsk-3tp` but not yet on `main`. Left untouched
   — fixing it here would duplicate `tsk-3tp`'s own eventual merge.

## Acceptance

- `node --test test/cli/fgos-edit.test.mjs` green (68/68), including the
  new regression test.
- `test/state/events-legacy-absence.test.mjs` not present on `main`
  (it lives on `fgw/tsk-3tp`/`fgw/tsk-3tp-2`, not yet merged) — nothing to
  re-run or reopen here.
- No `.gitattributes` change, no `.fgos/` state hand-edit, no other work
  item touched.

## Dependencies

None beyond what already merged into `main` (`tsk-3ve`, and the narrow
`41dcd479` dispatch/loop fix). `tsk-3tp`/`tsk-3tp-1` remain separately
in-flight.
