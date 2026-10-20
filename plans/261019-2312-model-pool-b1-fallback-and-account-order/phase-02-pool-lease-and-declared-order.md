# Phase 02: pool-keyed lease, `llmAccounts` as source, declared account order

**Status: done (2026-10-19).** See the [phase lead report](../reports/phase-lead-261019-2323-model-pool-b1-p00-p02.md).

## Context

- [plan.md](plan.md) D4, D5; owner decisions 3 and 4; wave-0 answers 6 and 7.
- Code: `rankProviderAccounts` (`src/runner/dispatch/provider-capacity.mjs:568`), `acquireProviderAccountLease` (`:591`), `inventoryServingCli` (`:651`), `providerAccountInventory` (`:271`), `legacyStateKey` and `readLlmAccounts` (`src/runner/dispatch/llm-accounts.mjs`).
- Parallel with phase 01. Callers keep their signatures: `provider` arguments simply carry the pool's state key, so no caller moves in this phase (callers move in phase 04).

## Requirements

1. **State key per pool.** The key of a pool is `legacyStateKey(pool)` (exists): pool `openai` stays `openai-codex`, `z-ai` and `deepseek` stay as they are, a new pool name such as `openrouter` is its own key. Leases, `lastSelectedAt`, sticky assignment records and quarantine already hang off this key, so they become per pool with no state-file change.
2. **One inventory door.** `providerAccountInventory` returns, per state key, the accounts of that pool: from `llmAccounts.<pool>` when the pool is declared there, otherwise from `runner.providers.<key>.accounts`. Mark the `runner.providers` branch in code as the transition read, with its removal condition (MP-C: every workspace on a release that reads `llmAccounts`, then `runner.providers` removed from global config). All existing readers (`hasProviderAccounts`, lease, `inspectProviderCapacity`, `resolveAccountPin`, probe, `account-rotation`) go through it unchanged.
3. **Derived account shape.** An `llmAccounts` account becomes the legacy shape the readers expect: per CLI `{kind, home, files?}` with `kind: codex-home` for `use: codex`, otherwise `home-files` with `files` = the files the config's invocations declare for that `use` (phase 00 fact 4 confirms every reader gets what it reads today). A `use` with no declared files makes that account unusable for that CLI, named in `inspect` and doctor, never run with an empty home. `disabled` is carried on the account.
4. **Declared order.** `rankProviderAccounts` returns: the sticky account when it is still usable, else the pool's accounts in `Object.keys` order, skipping quarantined and `disabled` accounts. Least-lease and least-recently-used are deleted from the sort (one ordering, no switch). `lastSelectedAt` is still written (it is evidence in `inspect`).
5. **Filter by store before ranking.** `acquireProviderAccountLease` keeps its `cli` argument; phase 04 passes it for every launch whose invocation declares a store.
6. **Integer-like account ids are refused** (`/^\d+$/`) in `validateAccountId` (legacy inventory) and in `llm-accounts.mjs` `ACCOUNT_ID`, with a message naming the reason (JS orders them before every other key, which would break declared order).
7. **Quarantine** keeps its key; `quarantineProviderAccount` and `releaseProviderAccountLease` need no change beyond the key now being a pool key. A credential fault quarantines the account in its own pool only.

## Files

- Modify: `src/runner/dispatch/provider-capacity.mjs` (rank, inventory merge, id rule; not the lock block `:372-420`), `src/runner/dispatch/llm-accounts.mjs` (derive legacy shape, id rule).
- Tests: `test/runner/provider-capacity.test.mjs`, `test/runner/llm-accounts.test.mjs`, `test/runner/provider-per-cli-credential-sources.test.mjs`.

## Tests

- Decision 3: accounts `[a, b, c]` with leases on `a` still rank `a` first; `a` quarantined gives `b`; `b` disabled gives `c`; an account without the store for `cli` is skipped; sticky assignment returns the same account until it is quarantined.
- Decision 4: two pools of one family keep separate leases and quarantine; quarantining pool `openrouter/or-a` leaves `deepseek/main` usable; pool `openai` reads and writes state key `openai-codex`.
- Integer-like id refused in both inventories; JSON key order survives the config merge (phase 00 fact 5).
- Inventory: a pool declared in `llmAccounts` wins over `runner.providers`; an undeclared pool reads `runner.providers` unchanged (the whole existing suite is the regression guard).
- Derived shape: `use: pi` pool gives `home-files` with the invocation's files; `use: codex` gives `codex-home`.

## Risk / rollback

M x M: a mixed-release machine leases one physical account under two keys only when a pool name differs from the legacy provider key, which happens only when phase 06 flips cells to `@openrouter`, after activation. Revert the commit; state files are unchanged by this phase.
