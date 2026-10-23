# Phase 12: Node doctor rows, setup and the token row

Depends on 11. Suggested executor: sonnet; independent sonnet review before landing. Shared file: `src/setup/registrations.mjs` (board "File chung dễ va"): post a log line first, merge `origin/main` at start and end.

## Context

The install/setup/doctor gate (AGENTS.md): every new file a tool expects must register into `fgos setup` and `fgos doctor`. The new expectations are `~/.fgos/private/` (0700), `accounts.yaml`, `gateway-token`. Doctor rows live in `src/setup/registrations.mjs` through `registerCheck`/`registerFix` (`:177`, `:223`), usually from a per-area module (`seat-binding-checks.mjs`, `identity-checks.mjs`); `checks.mjs` is a re-export shim, so the spec's "registered in `src/setup/checks.mjs`" is satisfied by the registry that file re-exports (D25). Setup already runs every registered fix (`bin/fgos.mjs:4072`, `runFixes(repoRoot)`), which is the spec's "setup creates `private/` and the token when missing": no new setup code, only the fix.

## Files it may touch

`src/setup/config-checks.mjs` (new), `src/setup/registrations.mjs` (the import line and registration call; delete the old gateway token check/fix and the `gateway` config default), `bin/fgos.mjs` (none expected; verify `runFixes` is the only setup hook needed), `test/setup/config-checks.test.mjs` (new), the existing tests that pin the retired default or the old token row (`test/setup/checks*.test.mjs`, found by phase 00's `rg "gateway-token-configured|gateway.token" test`).

## Design

- **Rows from the contract.** `config-checks.mjs` imports `packages/config/contracts/doctor-rows.v1.json` and registers one `registerCheck` per row id and one `registerFix` per fix id by looping the contract; each check calls `checkConfig({ rows: [id] })` once per doctor run (a per-run memo so the 14 rows cost one N-API call, not 14: a closure keyed on the run, not a process-lifetime cache) and maps findings to `{ passed, message }` (the registry's shape): `fail` -> `passed: false`; `warn` -> `passed: true` with the message prefixed `warning:` (the repo's convention, see `checkSeatBindingConfig`); the message is `file:line:column row-id path` and the finding's text, never a value.
- **`gateway-token-configured`.** Keeps its id and description text (now "the gateway token file `~/.fgos/private/gateway-token` exists, is 0600 and holds one line"); the check is the contract row `config-machine-files`; the fix is `create-machine-files` (D23). `fixGatewayTokenConfigured` and `checkGatewayTokenConfigured` (`registrations.mjs:2932-2967`) are deleted in the same change; the `gateway` `registerConfigDefault` (`:2970`) is deleted (it seeds `{port, token: null}` into every project and global file, the cause of this repository's `gateway` section).
- **Setup.** `runFixes` already runs the fix on `fgos setup`; verify by the existing idempotence test that a second setup changes nothing. The doctor message when the addon is missing says what to run.
- **Severities.** From the contract (D19): rows fail or warn exactly as listed; the phase 08 sweep decides, before this phase lands, whether any real project would newly fail `fgos doctor`; if yes the owner is asked before registering that row as fail.
- **Docs row.** `docs/specs/distribution.md` row 7 lists registered checks and says "a module adding one updates this row in the same change": phase 17 does the text edit; this phase's commit message names the row ids.

## Steps

1. Merge `origin/main`; board line; `impact` on `checkGatewayTokenConfigured` and `fixGatewayTokenConfigured` (callers: the registry only; record).
2. Write `config-checks.mjs`; register; delete the old row code and default; run `rg -n "gateway-token-configured|gateway\.token" src bin test --glob '*.mjs'` and move every hit (L10).
3. `test/setup/config-checks.test.mjs`: one case per row family (wiring only, not row logic): every contract row id is registered; severity mapping (`warn` is `passed: true` with the prefix); a finding carries no value; the memo makes one door call per run (count via a stub of the client module's door seam, the pattern the git door tests use); the token row on a temp `HOME`: missing -> fails with the fix id, fix creates, second fix is a no-op; the missing-addon message.
4. Update the setup tests that asserted the old default (`gateway` key seeded) to assert it is no longer seeded; run `node --test test/setup/checks*.test.mjs test/setup/config-checks.test.mjs`, then `npm test` later in the closeout phase (not here).

## Owning proofs

Row semantics: phase 08. Mapping and wiring: `test/setup/config-checks.test.mjs`. Default retirement: the updated `checks-setup-config.test.mjs` case.

## Risk

| Risk | L x I | Mitigation |
|---|---|---|
| New failing rows break `fgos doctor` in every project | M x M | phase 08 sweep and severity decision before landing; legacy rows warn |
| Deleting the `gateway` default breaks a reader that relied on `gateway.port` in the project file | L x M | phase 00's reader list; the gateway reads only the global file; the standard file holds the port |
| Two lanes edit `registrations.mjs` | M x L | board line; land second rebases |
| The memo hides a change between rows | L x L | scoped to one doctor invocation; a test with two runs |

## Rollback

Revert: the old token row and default return; the machine files stay on disk, ignored. Only valid before stage 2 ran on any machine (plan "Rollback").
