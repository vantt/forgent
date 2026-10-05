# Timing-sensitive test cleanup (2026-10-05)

## Method and an honest caveat

Load was generated with CPU burners (`node -e "for(;;);"`), first 20, then 64 to 80, on a 16-core host,
then stopped and verified gone. At 20 and 64 burners none of the targeted tests failed in 4 to 8 runs
before the change, so most "before" counts are 0 and the evidence for those fixes is the mechanism,
not a reproduced failure. Only one test reproduced under load (80 burners).

| Test | Before (load) | After (load) | Cause and fix |
|---|---|---|---|
| `test/scripts/test-select-coverage-map.test.mjs` `files run at most concurrency at a time` | 1 of 6 failed (peak overlap read 1) | 0 of 6 | Two files overlapped only if the second booted within 600ms of the first. Each file now waits until two have started before its fixed work. |
| `test/cli/fgos-approve-6.test.mjs`, `test/cli/fgos-merge.test.mjs` `--no-wait fails immediately` | 0 of 5 (bound already loosened to 5000ms) | 0 of 1 | The wall-clock bound is replaced by what a waiting run would necessarily print: the retry progress line and the "waited Nms before giving up" suffix. The holder (the test process) never releases, so a waiting run could not succeed either. |
| `test/cli/fgos-claim-2.test.mjs` take and pick `--no-wait` (2000ms bound), `--wait 600` (5000ms ceiling) | 0 of 4 at 80 burners | 0 of 4 | Same observable for the two `--no-wait` tests. The `--wait` test keeps its lower bound and its ceiling is now 60s against a lock snapshot of about 179s. |
| `test/runner/provider-capacity.test.mjs` marker-file exclusivity probe | 0 of 14 (not reproduced) | 0 of 6 | Contenders used the default 5s `withFileLock` wait, so a slow holder under load made a contender throw `ProviderCapacityLockError`. Mutual exclusion is the property, so contenders now wait up to 300s and the test timeout is 300s. |
| `test/rust-host/harness.test.mjs` R5 Node-against-Node | not load-driven; fails whenever HEAD moves between the two `version` calls | passes | The harness gained a per-case `jsonIgnorePaths` list applied to both sides. R5 ignores `data.gitCommit` and `data_hash` (a digest of `data`, which is still compared field by field). A new unit test shows the list drops only the named paths and any other difference still fails. |
| `test/runner/cli-spawn-reconciliation.test.mjs` (4 receipt polls, 1 duration bound, worker-exit wait) | 0 of 8 at 64 burners | 0 of 4 | Receipt polls allowed 4s in total for a cold node supervisor plus worker, and one test asserted under 5s; the worker-exit wait allowed 1s. A `waitForReceipt` helper polls for 50s, the exit wait for 30s. The hung-pipe test keeps its proof because the held-open descendant lives 60s, longer than the ceiling. |
| `test/cli/fgos-merge.test.mjs` closed-PR review elapsed under 5000ms | 0 | 0 | Removed: the single-gh-invocation assertion already proves the poll collapsed. |
| `test/runner/lock-wait.test.mjs` waitMs bound under 3000ms | 0 | 0 | Bound is 30s against the 60s remainingTtlMs it contrasts with. |
| `test/runner/loop.test.mjs` runWatch timing (300ms fallback) and abort (2000ms fallback, under 1s) | 0 of 4 at 80 burners | 0 of 4 | A real cycle was compared against a 300ms fallback. Fallbacks are now 3000ms and 60000ms. The timing test takes about 2.7s longer. |
| `test/runner/herdr-launcher-env.test.mjs`, `test/runner/herdr-reconciliation.test.mjs` test 22 | not reproduced | passes | They read `/proc` after a fixed 100/200ms sleep, and test 22's child exited on its own after 5s. They now await the `spawn` event (exec done) and the child lives until cleanup. |
| `test/runner/dispatch.test.mjs` process-group kill | not reproduced | passes | Fixed 300ms sleep before checking the grandchild died; now polls up to 30s. |

Commands: `env -u CLAUDE_CODE_SESSION_ID node --test <file>` (narrow runs only, no full suite).

## Case 3: assignment-dispatch concurrent `--contract` invocations

Cause not found; test and product left untouched.

- 3 plain plus 60 loaded iterations of an exact replica (two concurrent `dispatch execute --contract`
  children, same `--work`) produced valid JSON on stdout every time.
- Files both children touch: `.fgos/config.json` (written before the spawn), `.fgos/cache/state.json`
  (replaced by temp file and rename, so readers never see a partial file), `.fgos/events/*.jsonl`
  (appended under a lock, but read unlocked), the dispatch lock file, and each child's own
  assignment directory (`mkdir` claim, no sharing).
- The one theoretical path matching the text "Unexpected end of JSON input" is an unlocked event-log
  read seeing a half-appended line, which `parseEventLines` reports as "Corrupt or truncated event log
  line ... Unexpected end of JSON input". A single small `appendFileSync` is not realistically
  visible half-written, I could not reproduce it, and the observed message did not carry the
  "Corrupt or truncated" prefix as far as the brief says, so I did not change product code.
- If it recurs, capture the child's stderr in full (the test discards it on a failed `JSON.parse`).

## Case 5: scan results

Fixed: coverage-map, claim-2, merge, lock-wait, loop, cli-spawn-reconciliation, herdr-launcher-env,
herdr-reconciliation, dispatch (9 files beyond cases 1 to 4; under the cap of 15).

Left untouched, with reasons:

- `test/e2e/runner-loop.test.mjs` SIGINT exit within 2000ms: the bound is the stated behaviour of the
  test, though it could fail on a very loaded host. Making it robust means changing the documented bound.
- `test/runner/dispatch.test.mjs` idle timeout under 6000ms (idle 1500ms, hard cap 10000ms): the
  bound is the behaviour under test and has 4s of margin.
- `test/runner/herdr-prompt-ready.test.mjs` under 2000ms with `readyMs` 60: in-process fake client, low risk.
- `test/runner/merge.test.mjs` under half the lock TTL (90s): generous.
- `test/runner/herdr-spawn-adapter.test.mjs` (15s, 10s), `test/scripts/run-tests.test.mjs` (60s),
  `test/scripts/test-select-coverage-map.test.mjs` hang test (20s): generous.
- Lower-bound assertions (`elapsed >=`) in claim-2, lock-wait, events: slowness cannot fail them.
- Polling loops with a deadline already: `test/cli/dir-differs-from-cwd.test.mjs` (30s),
  `test/workflow/workflow-runner.test.mjs` (20s), `test/runner/assignment-dispatch.test.mjs` 300ms
  alive-check (a negative wait that cannot fail from slowness).
- `test/rust-host/fgctl-stage.test.mjs` 100ms sleep before the mtime check: only longer on a slow host.
- `test/runner/provider-capacity.test.mjs` first S3 test goes through `acquireProviderAccountLease`,
  which fixes the 5s lock wait inside product code; leave until the product exposes a wait option.
- `test/e2e/runner-loop.test.mjs:279` 200ms sleep sits inside a fixture script after killing its parent.

## Unresolved

- The harness release-tree staged-binary run also compares `version` output from two invocations but
  reports no git commit (no `.git`), so it was not changed.
