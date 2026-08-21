# Iron Law evidence — tsk-1vc

## Classification

```json
{"required":true,"matchedFlags":["data loss"],"matchedModules":[]}
```

`matchedFlags: ["data loss"]` is a real, true-positive match — this item's
own description is literally about preventing further silent data loss on
the shared main-checkout `.fgos/events.jsonl`, and the real diff (10 files
across all 3 merged children) includes genuine code changes to the guard
subsystem, not a docs-only false positive.

## Real diff

```
docs/history/tsk-1vc-silent-eventlog-loss-detection/CONTEXT.md
docs/history/tsk-1vc-silent-eventlog-loss-detection/RESEARCH.md
docs/history/tsk-1vc-silent-eventlog-loss-detection/plan.md
docs/specs/distribution.md
src/setup/registrations.mjs
src/state/events-jsonl-truncation-guard.mjs
src/state/main-checkout-guard-warnings.mjs
test/runner/concurrent-claim-eventlog-loss.test.mjs
test/setup/registrations.test.mjs
test/state/events-jsonl-truncation-guard.test.mjs
```

## Failing-test-first proof (D1: guard fail-closed at its own write path)

Reconstructed live from the two real commits that bracket the fix
(`0c69cedd`, the tip before `tsk-1vc-2`'s implementation, vs. the current
merged tree) via a throwaway `git worktree add <tmp> 0c69cedd`, running the
exact same new test against both:

**RED — same test, against the pre-fix code (`0c69cedd`):**

```
$ FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test --test-name-pattern="refuses periodic auto-commit when an unacknowledged truncation break is flagged" test/state/events-jsonl-truncation-guard.test.mjs

✖ runOpportunisticMainCheckoutChecks D1: refuses periodic auto-commit when an unacknowledged truncation break is flagged (33.5ms)
  AssertionError [ERR_ASSERTION]: must refuse periodic auto-commit when truncation break is flagged
  + actual - expected
  + 'chore(.fgos): periodic events.jsonl checkpoint'
  - 'init events'
ℹ pass 0
ℹ fail 1
```

The old code committed the stale/dirty `events.jsonl` even while a
truncation break was actively flagged — exactly the defect D1 exists to
close.

**GREEN — same test, against the fixed code (current):**

```
$ FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test --test-name-pattern="refuses periodic auto-commit when an unacknowledged truncation break is flagged" test/state/events-jsonl-truncation-guard.test.mjs

✔ runOpportunisticMainCheckoutChecks D1: refuses periodic auto-commit when an unacknowledged truncation break is flagged (21.2ms)
ℹ pass 1
ℹ fail 0
```

## Full suite, current state

`FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test test/state/events-jsonl-truncation-guard.test.mjs test/runner/claim-port.test.mjs test/runner/merge.test.mjs test/cli/fgos-claim.test.mjs test/cli/fgos-return.test.mjs test/cli/fgos-read.test.mjs test/e2e/runner-loop.test.mjs` — 365 pass, 0 fail (run independently by the driving session at `tsk-1vc-2`'s own return, not just the worker's self-report).

`FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test test/runner/concurrent-claim-eventlog-loss.test.mjs` — 3 pass, 0 fail (`tsk-1vc-1`).

`FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test --test-name-pattern=guard-warnings-surface test/setup/registrations.test.mjs` — 1 pass, 0 fail (`tsk-1vc-3`).

`test/architecture.test.mjs` — 6 pass, 0 fail (re-confirmed after fixing a
real kernel/domain layering violation the `tsk-1vc-2` worker introduced —
see that item's own commit `83d43b3e`).

## Verification source

- `src/evolve/iron-law.mjs`/`src/intake/risk-keywords.mjs` read directly to
  confirm `matchedFlags` is a description-text scan, independent of
  `filesChanged` (same mechanism `docs/history/tsk-6av/iron-law-evidence.md`
  already documents) — cited here only to explain WHY the flag fired, not
  to argue it away, since this one is real.
- `git worktree add /tmp/.../old-guard 0c69cedd` + the same test file
  copied in — real, reproducible red-before-green, not a paraphrase.
- `docs/history/tsk-1vc-silent-eventlog-loss-detection/CONTEXT.md`/`plan.md` —
  D1/D2/D4/D6 the 3 merged children each implement.
