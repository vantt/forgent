# HARDEN T5 batch D

Worktree /home/vantt/projects/forgent-worktrees/harden-t5-batch-d, branch harden/t5-batch-d (not pushed).

## 1. Quota wordings (d49de8fa4)
Both probes now import `matchQuotaLimitLine` from `provider-auth-failure.mjs` (owner of `QUOTA_LIMIT_PATTERNS`). Private `QUOTA_PATTERN` removed from both.
Difference: probes held the loose substring `/usage limit|quota|rate limit/i`; the classifier list is line-anchored and names 4 wordings (usage limit, usage limit reached, individual quota reached, pi/OpenRouter 402 credits). Union NOT kept: no test or recorded provider message uses the bare "quota"/"rate limit" substring; existing test wording ("You've hit your usage limit") is in the list. Consequence: a bare "rate limit" or prose containing "quota" no longer reads as quota in the probes (account probe then falls to sandbox/timeout/other; unlock probe falls to the exit-code detail).
Tests extended in place: credential probe (402 credits line), account probe (individual quota line).
Census regenerated (packages/git/contracts/mutation-census.v1.json) in this commit.

## 2. B-11 (3875eeb3c)
`run.mjs`: new exported `readAccountInventory(mainRoot, suppliedConfig)`; `withAccounts` calls it each time; the per-seat cached `runnerConfig` is gone, `bindCtxFor` and the rotation inspect call `withAccounts` per bind. A caller-supplied `options.runnerConfig` stays its own inventory.
Test (`test/runner/execution/run.test.mjs`): inventory file gains an account between two reads, second read sees it. Proof is at the reader; the per-bind wiring is by code (a full launch test would need a real rotation run, not added).

## Verification
Passed: run.test, both probe tests, architecture, run-provider-failover, account-rotation, account-pin, per-cli-credential-sources, pool-lease, one-door, driver-rununit (246 tests, 0 fail).
Text judge in provider-capacity.mjs untouched.

Status: DONE
