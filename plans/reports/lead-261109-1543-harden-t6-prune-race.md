# HARDEN T6: prune race (case-close "two prunes at once")

Verdict: real race in `pruneFinishedCases`, not test timing.

## Evidence
- Single test under cargo load (clean + rebuild loop): 0/30 failures, so the original 2026-11-09 failure is rare at 2 prunes and 4 cases.
- Stress copy (3 concurrent prunes, 8-16 cases, 12-25 rounds, scratch only, not committed): union of removed cases missed a case in about 1 of 12-25 rounds; kept reasons showed `delete-failed` (ENOTEMPTY on `rmSync(runDir)`) and `error` (ENOENT on `locks/advance.lock`) for cases another prune was removing.
- No dup (a case reported twice) was ever seen: the per-case hold works.

## Cause
A prune that reaches a case another prune is deleting passes `existsSync`, then `tryAcquireAdvanceLock` mkdirs/writes lock files inside the directory under deletion.
1. The deleting prune's `rmSync(runDir)` meets a non-empty dir: ENOTEMPTY, reported `delete-failed`, case missing from `cases`.
2. The intruding prune's lock open fails ENOENT as the dir vanishes: reported `error` (only "not found" was treated as a concurrent removal).

## Fix (`src/workflow/case-close.mjs`)
- `removeCaseDir`: `rmSync` with `maxRetries`/`retryDelay` (delete is idempotent, retry until empty); used for the case delete and the stub delete.
- Catch: a case whose ledger (events file) is gone went with a concurrent prune; drop the leftover stub, no `error`.

## Proof
`test/workflow/case-close.test.mjs` "concurrent prunes remove each directory once, finish, and report no failure" (replaces "two prunes at once"; 24 cases, 4 prunes; also asserts the only kept reason is `advance-held`). Before fix: red 4/6 runs. After: 20/20 green.

## Gate
Focused 150/150 (case-close, admission, verbs, playbook-proposer, observe fixtures, architecture, doc-health, decision-citation-drift); one-door scan 0 undeclared, census regenerated (also after rebase); full npm test 8600 tests, fail 2: V7n addendum (known) and mailbox-live-confined (known load flake, 19/19 alone).

## Unresolved
- Original failing log was not kept, so the exact assertion of the 11-09 failure is unconfirmed; the reproduced symptoms match the union assertion.
