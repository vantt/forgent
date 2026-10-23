# Phase 13: Account readers read the accounts file

Depends on 11 and 12 (same shared file). Suggested executor: sonnet; independent sonnet review of the edit list against phase 00's enumeration. Shared files: `src/setup/registrations.mjs`, `bin/fgos.mjs` (two strings), `src/runner/dispatch/config.mjs`; post first.

## Context

L10: moving a mechanism means moving every consumer and deleting the old path in the same change. Spec section 13: "After the move the gateway reads only the token file and the runner only the accounts file; a missing file is a doctor failure, never a fallback to the old key." The account readers (`llm-accounts.mjs`, `provider-capacity.mjs`, `bind.mjs`, `explain.mjs`, `account-pin.mjs`, `account-rotation.mjs`, `case-start.mjs`, `provider-credential-renewal.mjs`, `provider-account-probe.mjs`) all take a `runnerConfig` parameter, so the move happens at the **assembly points** that produce that parameter, not inside each reader (D7). Phase 00 enumerated the assembly points; the seeds are: `loadRunnerConfig` (`src/runner/dispatch/config.mjs:402`, `:458`), `src/verbs/dispatch/inspect.mjs:34`, `src/verbs/dispatch/reconcile.mjs:33,72`, `src/setup/registrations.mjs:2101,4284,4536`, `src/setup/model-pool-checks.mjs:175`.

## Files it may touch

`src/config/machine-config.mjs` (append `withMachineAccounts`), exactly the sites phase 00's list names (the seeds above are the minimum), `bin/fgos.mjs` (the two `--account` messages at `:2318` and `:2896` stop saying `~/.fgos/config.json`), the error texts in `llm-accounts.mjs:61` and `provider-capacity.mjs:60` ("declare it in ~/.fgos/private/accounts.yaml"), `test/helpers/config-fixture.mjs` (a helper `writeAccountsFile(home, runnerAccounts)`), and the tests that build account inventories by hand (found by `rg -n "llmAccounts|providers.*accounts" test --glob '*.mjs' -l`, moved to the helper).

## Design

- `withMachineAccounts(runnerConfig, view)`: returns the config with `runner.llmAccounts` and each `runner.providers.<p>.accounts` taken **only** from the accounts view (an inventory already present in the input is dropped, not merged: the old path ends here). A project config that still names an account inventory keeps its existing refusal (`rejectProjectProviderAccountInventory`, `llm-accounts.mjs:60`), unchanged.
- **Assembly points.** Each site calls `readMachineAccounts({ globalDir })` once and passes the result through `withMachineAccounts`. `loadRunnerConfig` does it after its merge (so the JS global merge never sees accounts), the direct global readers do it on the object they pass on. **Not** inside `loadGlobalConfig` (D7: `bin-discovery.mjs:110-121` round-trips that object into `writeGlobalConfig`).
- A missing accounts file gives an empty inventory plus the existing "no accounts" outcomes of each reader (the lease already handles a pool with no accounts) and the doctor row `config-machine-files`/`config-key-in-wrong-file` tells the person what to run; there is no fallback to the old keys.
- A confined caller gets `state: unavailable-confined`: the runner-side readers run outside the sandbox; a nested `fgos run` from a worker is refused with `config-accounts-unavailable-confined` at the one place that leases (the check goes through `readMachineAccounts`'s state, not a new code path). If G-D2 was answered B this refusal is Slice C's.
- The two `bin/fgos.mjs` strings and the `docs/specs/runner.md` sentences are text only.

## Steps

1. Merge `origin/main`; `impact` on `loadRunnerConfig` and `providerAccountInventory` (record callers).
2. Add `writeAccountsFile` to the fixture helper and move the account-building tests to it in the same commit as the reader switch (a helper that writes a file nothing reads yet proves nothing, and no shim that reads both places is allowed).
3. Edit each assembly point; delete each old read; `rg -n "llmAccounts|\.accounts\b" src bin --glob '*.mjs'` hits that read the global file raw are the proof of completeness: none may remain.
4. Run `node --test test/runner test/setup test/verbs` (the dirs holding the moved tests) sequentially after `free -g`.
5. Measure the added cost of one `readMachineAccounts` per `loadRunnerConfig` (one N-API call; spec says about 12 µs plus the digest) and record it.

## Owning proofs

No new case copies: the existing lease, probe, pin, rotation, explain and doctor tests are the proofs, now fed by `writeAccountsFile`. One new test: `withMachineAccounts` drops an inventory present in its input (so the old path is gone) and leaves other runner keys intact.

## Risk

| Risk | L x I | Mitigation |
|---|---|---|
| A reader is missed and keeps reading the global JSON | M x H | the enumeration in phase 00, the `rg` completeness check, review against the list |
| Activation before stage 1 leaves a machine with no accounts | M x H | rollout order in phase 15 (stage 1 at activation); the reader error names the file and the verb |
| The overlay re-leaks accounts into `config.json` | L x H | overlay not in `loadGlobalConfig`; a test writes the global file after `loadRunnerConfig` and asserts it holds no account key |
| Performance regression on hot paths | L x L | one call per load, measured |

## Rollback

Revert: readers return to the global JSON. Valid only while stage 2 has not run on that machine (plan "Rollback").
