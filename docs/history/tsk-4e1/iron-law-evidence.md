# Iron Law Evidence: tsk-4e1 — `fgos preflight` verb

## Classification

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": [
    "bin/fgos.mjs"
  ]
}
```

## Failing-Test-First Proof

### 1. Test Command

```bash
node --test test/cli/fgos-preflight.test.mjs
```

### 2. Red Transcript (reverting implementation files `bin/fgos.mjs` and `src/cli/command-registry.mjs` to pre-feature commit)

```text
✖ fgos preflight passes when all 3 checks pass (exit 0) (728.884266ms)
✖ fgos preflight fails when mirror-sync-diff detects uncommitted skill wrapper drift (exit 4) (770.241227ms)
✖ fgos preflight fails when decision-citation-drift check fails (exit 4) (805.173574ms)
✖ fgos preflight fails when backlog-reconciliation check fails (exit 4) (826.523066ms)
✖ fgos preflight aggregates multiple failing checks in failure message (802.510101ms)
✖ fgos preflight works from inside a linked worktree (794.288157ms)
ℹ tests 6
ℹ suites 0
ℹ pass 0
ℹ fail 6
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 5018.849173

✖ failing tests:

test at test/cli/fgos-preflight.test.mjs:73:1
✖ fgos preflight passes when all 3 checks pass (exit 0) (728.884266ms)
  AssertionError [ERR_ASSERTION]: expected status 0, got 4: fgos: unknown verb "preflight". Usage: fgos <version|init|add|submit|discover|plan|move|retrospective|cleanup|compound|edit|ask|answer|decision|list|ready|rebuild|repair|check|rollup|take|return|review|approve|sync-root|reject|catchup|evolve|triage|session|goal|tool|setup|doctor|unlock|lock-status|main-checkout-reset> ...
```

### 3. Green Transcript (restoring implementation files)

```text
✔ fgos preflight passes when all 3 checks pass (exit 0) (1323.89446ms)
✔ fgos preflight fails when mirror-sync-diff detects uncommitted skill wrapper drift (exit 4) (1375.494159ms)
✔ fgos preflight fails when decision-citation-drift check fails (exit 4) (1344.733062ms)
✔ fgos preflight fails when backlog-reconciliation check fails (exit 4) (1305.756355ms)
✔ fgos preflight aggregates multiple failing checks in failure message (1454.046746ms)
✔ fgos preflight works from inside a linked worktree (1389.853715ms)
ℹ tests 6
ℹ suites 0
ℹ pass 6
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 8507.184536
```
