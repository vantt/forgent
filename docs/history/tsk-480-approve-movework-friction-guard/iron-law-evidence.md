# Iron Law evidence: tsk-480

`classifyIronLaw({ filesChanged, description: item.description })` against
this item's real committed diff:

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": ["bin/fgos.mjs"]
}
```

`filesChanged` (via `changedFiles`, `src/runner/merge.mjs`, comparing
against `item.branchHeadAtTake`):

- `bin/fgos.mjs`
- `docs/architecture-manifest.json`
- `docs/history/tsk-480-approve-movework-friction-guard/CONTEXT.md`
- `docs/history/tsk-480-approve-movework-friction-guard/plan.md`
- `src/cli/approve-fault-log.mjs`
- `test/cli/fgos.test.mjs`

`bin/fgos.mjs` is a gated self-modifying module (Iron Law's matched
module), which is why `required` is `true`.

## Verify command

`node --test test/cli/fgos.test.mjs` (this item's recorded `verify`).

## Failing-test-first proof

Captured by temporarily removing only the `try`/`catch` guard around the
same `FGOS_TEST_FORCE_APPROVE_LOCK_TIMEOUT` seam (bin/fgos.mjs's
`moveDeliveredOrRecordFault`) — i.e. the exact pre-fix shape, still using
this item's own new test as the probe — running the test, then restoring
the real fix. `git diff --stat -- bin/fgos.mjs` was empty both before this
capture and immediately after restoring, confirming the working tree
matches the real committed fix once the capture was done.

### Before (guard removed, seam still throwing) — real failure

```
node --test --test-name-pattern="approve \(pull-door" test/cli/fgos.test.mjs
```

```
✖ approve (pull-door/verify-only): a simulated post-verify lock-timeout is caught, recorded, and left diagnosable instead of crashing uncaught (253.649229ms)
✔ approve (pull-door/verify-only): with no simulated failure, the same item approves normally — the guard changes nothing on the happy path (245.944578ms)
ℹ tests 2
ℹ pass 1
ℹ fail 1

✖ failing tests:

test at test/cli/fgos.test.mjs:6797:1
✖ approve (pull-door/verify-only): a simulated post-verify lock-timeout is caught, recorded, and left diagnosable instead of crashing uncaught (253.649229ms)
  AssertionError [ERR_ASSERTION]: fgos: no runner config found — detected "claude" on PATH; wrote a default (executor: claude) at /tmp/fgos-cli-M8r6Ia/.fgos/config.json#runner; edit .fgos/config.json by hand to change.
  fatal: not a git repository (or any of the parent directories): .git
  fgos: approve: simulated lock-timeout for "approve-lock-timeout" (FGOS_TEST_FORCE_APPROVE_LOCK_TIMEOUT)


  7 !== 0

      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-480-oyTRXz/test/cli/fgos.test.mjs:6809:10)
```

Exit code `7`, uncaught `fgos: approve: simulated lock-timeout for
"approve-lock-timeout"` on stderr, no diagnostic record, no truthful
envelope — exactly the bug CONTEXT.md describes: a real success (the
simulated write here stands in for a real merge/verify already having
succeeded) followed by an unhandled throw with zero trace.

### After (real fix restored) — passing

```
node --test --test-name-pattern="approve \(pull-door" test/cli/fgos.test.mjs
```

```
✔ approve (pull-door/verify-only): a simulated post-verify lock-timeout is caught, recorded, and left diagnosable instead of crashing uncaught (251.719205ms)
✔ approve (pull-door/verify-only): with no simulated failure, the same item approves normally — the guard changes nothing on the happy path (250.330646ms)
ℹ tests 2
ℹ pass 2
ℹ fail 0
```

### Full recorded verify command, real fix in place

```
node --test test/cli/fgos.test.mjs
```

```
ℹ tests 456
ℹ pass 456
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

## Pre-existing, unrelated failures (not part of this evidence)

`npm test` (the full repo suite, run once for regression-checking beyond
this item's own recorded `verify`) shows exactly 2 failing tests, both
reproduced identically on the pristine `main` checkout before any of this
item's changes:

- `test/architecture.test.mjs` — "đủ sổ": `src/state/discover-pool.mjs`
  has no row in `docs/architecture-manifest.json` (pre-existing gap,
  unrelated file).
- `test/skills/fgos-mirror.test.mjs` — "every mirrored file pair is
  byte-identical": `fgos-submit-assist/SKILL.md` differs between
  `.claude/skills` and `.agents/skills` (pre-existing drift, unrelated
  file).

Neither file is touched by this diff. `item.verify` was narrowed from
`npm test` to `node --test test/cli/fgos.test.mjs` for this reason — the
broader command's only red is this pre-existing, unrelated noise, not
this item's own correctness.
