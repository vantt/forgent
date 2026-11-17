# Guide: move a machine's LLM accounts to `runner.llmAccounts` only (design-lap, fg-server, fg-server2)

For: any machine with LLM accounts. Run it on the machine itself: design-lap (forgentx-46, claude-phdk@design-lap), fg-server (the owner's machine), fg-server2 (done by HARDEN, p-ag76llwilb). Written on fg-server2, 2026-11-17, from main `54261df0a`
and the installed release v0.2.0-rc.10. Unblocks plan 261115-2328 phase 16 (deletes the `runner.providers.<p>.accounts`
reader and refuses a config that still sets it). Never print credential values or login-store contents; print key names,
counts and directory paths only.

## Facts (checked in code)

1. Who wins when both blocks exist: **`llmAccounts`, per pool, not a merge.** `providerAccountInventory` reads
   `providers`, then overwrites each state key that an `llmAccounts` pool supplies: `{ ...legacy, ...derived }`
   (`src/runner/dispatch/provider-capacity.mjs:284-289`; Rust twin `packages/execution/rust/src/accounts.rs:661-671`).
   A pool's accounts fully replace that provider's old accounts; a provider with no matching pool still reads `providers`.
   Pool to state key: `legacyStateKey` (`src/runner/dispatch/llm-accounts.mjs:146-149`, `accounts.rs:37-44`; `glm`->`z-ai`,
   `agy`->`gemini`, `openai`/`codex`->`openai-codex`, else the name). rc.10 has the same code
   (`<release>/libexec/legacy-node/src/runner/dispatch/provider-capacity.mjs:290-295`).
2. Paths that read only `providers`: the lease (`assignment-runner.mjs:602-607` via `hasProviderAccounts`), probe-account
   (`provider-account-probe.mjs:64-66`, `:95-106`), the `--all` sweep (`:399-401`), credential write-back
   (`src/setup/registrations.mjs:2141`) and reconcile all go through `providerAccountInventory`, so none of them breaks.
   **One exception:** the doctor check of agy sub-homes reads `runner.providers.gemini.accounts` only
   (`src/setup/agy-permissions.mjs:160`, rc.10 `:219`). Once `providers` is removed, that check stops listing the gemini
   account homes (it misses them; it does not fail). Phase 16 must move this caller. The probe's error text still says
   "in runner.providers" (`provider-account-probe.mjs:322`), but the lookup reads both blocks.
3. Field mapping. Old: `credentialSource` (one store) or `credentialSources.<cli>` (one store per CLI), each `{home, ...}`.
   New: `credentialStore: { <cli>: <dir> }` with keys `label` and `disabled` (`core/config-schema/runner.schema.yaml:308-333`,
   checked at `accounts.rs:486-519`). Write the old `.home` as the directory (absolute, or starting with `~` or `${HOME}`).
   A CLI key is lower-case letters, digits, `-` or `_`, but it is usable only if it is `codex` (codex-home) or a
   `credentialStore.use` that some invocation declares with `files`; any other key goes to `unusableFor`
   (`llm-accounts.mjs:206-257`, `accounts.rs:558-656`). The keys in use in `core/config-standard/runner.yaml` are
   `pi, codex, claude, omp, agy`. An old single `credentialSource` served only the CLI whose layout it belongs to, so
   write one key for that CLI (for example a `~/.pi/accounts/<x>` home becomes `pi:`).
4. Pool names. Tier cells for both families name `@openrouter` (`core/config-standard/runner.yaml:529-548`), so a seat bound
   from a cell leases from pool **`openrouter`**. A seat with no bound pool leases from its executor's `providerModel`
   (`assignment-runner.mjs:603-606`): `glm` has `providerModel: z-ai` (`runner.yaml:66-94`) and `deepseek` has
   `providerModel: deepseek` (`:296-300`). So declare pools **`z-ai`** and **`deepseek`** (copies of the old provider
   accounts, `pi:` store) **and** keep `openrouter`.
5. Release: **rc.10 is enough. Do not wait for rc.11.** rc.10 already reads `llmAccounts` with the same per-pool code
   (fact 1). The only cost on rc.10 is the agy doctor coverage gap in fact 2.

## Steps

Each step has a check and a rollback. `F=~/.fgos/private/accounts.yaml`.

1. **Back up.** `cp -p $F $F.bak-$(date +%Y%m%dT%H%M%S)-llmaccounts`.
   Check: `ls -l ~/.fgos/private/` shows the copy with the same size. Rollback: none needed.
2. **Inventory, structure only.** List the pool and account names under `runner.providers.*.accounts` and
   `runner.llmAccounts` (names and counts only; no values). For each provider, find its pool by fact 1 (state key).
   Check: you have a provider -> pool -> account table. Rollback: none (read-only).
3. **Add the missing pools and accounts** to `runner.llmAccounts` in `$F`. For each old account:
   `credentialSources.<cli>.home` becomes `credentialStore.<cli>`, and `credentialSource.home` becomes one key for its
   CLI (fact 3). Copy `label` and `disabled`. Add `z-ai` and `deepseek` if `providers` has them, and keep or add
   `openrouter` (fact 4). Keep the account order, because the lease takes accounts in declared order. Remember fact 1: a
   pool you add replaces that provider's old accounts at once, so copy every account of it.
   Check: each provider of the old block has a pool with the same account ids. Rollback: copy the backup back over `$F`.
4. **Config check.** Run `fgos config check`, then `fgos doctor` and read the rows `llm-accounts-shape` and
   `llm-accounts-vs-legacy` (`src/setup/registrations.mjs:821-826`, `src/setup/model-pool-checks.mjs:161,181`).
   Check: config check passes; the shape row has no problems and no `unusableFor`; the vs-legacy row
   names no "only in runner.providers" and no "different login directories" (an "only in runner.llmAccounts" list is fine).
   Rollback: restore the backup.
5. **Probe every account**, read-only: no `--record`, one at a time:
   `fgos dispatch probe-account --provider <pool> --account <id>`. For `openrouter`, add `--executor glm` and again with
   `--executor deepseek`, because no executor has `providerModel: openrouter` (`provider-account-probe.mjs:72-74`).
   Use `--leg direct` if no herdr is available. Check: every verdict is `healthy`, or matches what it was before step 3
   (an account that was already in quota stays in quota). Rollback: restore the backup.
6. **Remove `runner.providers.*.accounts`** (all of `runner.providers` if nothing else is left in it). Allowed on rc.10
   (fact 5). Before you remove it, run `fgos doctor` and note the agy sub-home row for gemini; after removal it no longer
   covers the gemini account homes (fact 2). Check: `fgos config show` lists no `runner.providers.*.accounts`. Rollback: restore the backup.
7. **Check again.** Run step 4 and step 5 again. The vs-legacy row now lists every account as "only in runner.llmAccounts"; that
   is expected. Check: the same verdicts as in step 5. Rollback: restore the backup, then post on the board that the move is reverted.
8. **Board line.** Each machine posts its own line when its move is done. Stamp the time with `date` and add this line
   at the top of `plans/261017-1313-fgos-platform-program-board/log.md`:
   `<date> <MACHINE>: <machine> accounts are on runner.llmAccounts only`
   The machine whose move completes last (all three lines present: design-lap, fg-server, fg-server2) also adds
   the gate line for phase 16, with exactly this text:
   `<date> DESIGN-LAP: every machine's accounts are on runner.llmAccounts (design-lap, fg-server, fg-server2)`
   Check: `git log -1 -p` shows only the added line(s). Rollback: a new line that withdraws it.

## Preconditions

- Release: none beyond rc.10.
- Phase 16 opens only on the gate line that covers **every** machine: design-lap, fg-server and fg-server2.
- Phase 16 must also move `src/setup/agy-permissions.mjs:160` to read `llmAccounts` (pool `gemini`).
