# Doctor checks: Workflow pool independence and agent CLI project trust (2026-10-05)

Evidence: `plans/reports/dogfood-mdview-q4-retry-261005.md`. Two failures there were findable before any paid run; both are now `fgos doctor` checks. Both are read-only.

## What was added

| Check id | Where |
|---|---|
| `workflow-pools-satisfy-independence` | `src/setup/workflow-pool-independence.mjs`, `src/runner/execution/dry-bind.mjs`, `src/runner/execution/role-ledger.mjs` |
| `agent-cli-project-trusted` | `src/setup/agent-cli-trust.mjs` |

Both are registered in `src/setup/registrations.mjs` (next to the existing trust-store checks), have rows in `docs/architecture-manifest.json`, one entry each in the doctor-check row of `docs/specs/distribution.md`, and one `CHANGELOG.md` `[Unreleased]` > Added line.

### workflow-pools-satisfy-independence

For every Workflow definition under `core/workflows/`, `domains/*/workflows/` (package root, then the project's own), it takes each unit whose pattern resolves to `panel` or `reviewed` and drives it through the runner's own `runPattern()` with a role runner that only calls `bind()`. Nothing is dispatched, no model is called, nothing is written. The independence rule is not re-implemented: panelist and checker roles, their `independentOf` lists and the family comparison all come from `patterns/*.mjs` and `bind()`.

- Seam: `simulateUnitBindings(unit, runnerConfig)` in `dry-bind.mjs`. The one piece of runner plumbing it needs, resolving a role name in `independentOf` to the executor that played it, lived as a closure inside `runUnit`; it is now `createRoleExecutorLedger()` in `role-ledger.mjs`, used by both `runUnit` and the simulation so they cannot drift. `run.mjs` changed by that extraction only.
- Reports per `workflow/step/unit`: the pattern, capability, each refused role with bind()'s own reason and detail, and which roles bound before the refusal. Example from the unit test with a pool of three families: `synthesizer refused for independence: ... [bound before refusal: panelist-1=alpha, panelist-2=beta, panelist-3=gamma]`.
- A capability with no `prefer` pool at all is left to `workflow-capabilities-configured` (it already warns) and is not reported as an independence gap.
- "Runnable" is exactly what `bind()` already considers: governance allow-list, and posture (the machine confinement registry plus bwrap on PATH, or a herdr invocation when `HERDR_ENV` is live). `bind()` does not see quota-parked accounts or an agent CLI blocked on a trust prompt. That is a stated limit of the check, not a guess; the trust half is covered by the second check.
- Design call settled from the repo: `fgos doctor` ran checks synchronously and the pattern code is promise-based. Rather than re-implement the role sequence synchronously (which would copy the independence plumbing), `fgos doctor` in `bin/fgos.mjs` now awaits each check (`await` on a plain result is a no-op, so the other 94 checks are unaffected). This is the only contract change; the CHANGELOG line says checks may now be asynchronous.
- The YAML parser is loaded with `createRequire` inside the check, because `fgos setup` runs from copies without installed dependencies; a missing parser reports "not evaluated", never a crash.

### agent-cli-project-trusted

For the project root (the main checkout the doctor is run against):

- Not applicable (passes, with a message saying so) when the root has no `.git`, when the runner config cannot be loaded, or when no codex or agy executor is configured.
- codex: every `config.toml` named by an executor or invocation, either through a `codex-toml` `interactiveMode.trustStore` (its `path`, else its `CODEX_HOME`, else `~/.codex`) or through a `CODEX_HOME` in its env (`${HOME}`, `$HOME` and `~` are expanded). Each distinct file is checked once; the message names the executors that use it. It uses `readCodexTrust` from `src/runner/dispatch/trust-store.mjs`, the same reader the existing seeder uses: it matches the single `[projects."<path>"]` table and answers yes/no; it never returns file content. Both the plain and the realpath spelling of the root are tried.
- agy: the sub-HOMEs `findAgySubHomes` already enumerates for `agy-sub-homes-configured`, checked through `readAgyTrust` (`.gemini/antigravity-cli/settings.json`, `trustedWorkspaces`). agy has an equivalent trust notion, the same one the claude-side seeder writes.
- Failure message gives the exact fix: for codex, add `[projects."<root>"]` with `trust_level = "trusted"` to the named file; for agy, add the root to its `trustedWorkspaces` array. It states fgOS never edits those files, and the check never does (a test compares the file before and after, and asserts a credential-looking line in the file never appears in any message).
- Limit: `readCodexTrust` recognises only the double-quoted table name codex writes itself; a hand-written `[projects.'<path>']` would read as "no entry". Same behaviour as the dispatch seeder, so doctor and a real run agree.

## Run against /home/vantt/projects/mdview (read-only, `fgos doctor --dir /home/vantt/projects/mdview`)

- `agent-cli-project-trusted`: FAIL. `/home/vantt/.codex-fgovn/config.toml` (executors `openai/codex-cli-bypass-fgovn`, `openai/codex-herdr-fgovn`) has no entry for `/home/vantt/projects/mdview`, with the line to add. Also `/home/vantt/.agy-homes/mucdong/.gemini/antigravity-cli/settings.json` and `/home/vantt/.agy-homes/tetnu/...` do not list mdview in `trustedWorkspaces`. That is the exact blocker from the dogfood (codex), plus the agy equivalent the dogfood had not reached.
- `workflow-pools-satisfy-independence`: PASS, 12 panel/reviewed units bind all roles. mdview's restored original pools hold claude, xai, openai, glm, so on paper the pools are enough; what failed in the dogfood was openai being blocked on trust, which bind() cannot see (the check above names it). The dogfood's second state (openai removed, three runnable families) is reproduced and reported as a synthesizer independence refusal in the unit test `a panel whose pool has only as many families as panelists fails on the synthesizer`.
- Neither check modified any file; mdview's config and the codex/agy files were not edited.

## Tests

- New: `test/setup/workflow-pool-independence-check.test.mjs` (10), `test/setup/agent-cli-trust-check.test.mjs` (11). Hermetic: fixture configs and workflows in temp dirs, HOME and `homeDir` pointed at temp dirs, native-agent executors so `bind()` does not read the machine's confinement registry. Updated the doctor id list in `test/setup/checks.test.mjs`.
- Passing (`env -u CLAUDE_CODE_SESSION_ID`): `test/setup`, `test/architecture.test.mjs`, `test/runner/execution`, `test/workflow`: 881 tests, 0 failures.
- Full suite not run: `free -m` showed 2847 MB free (below the 3000 MB gate; 11 GB available).

## Concerns

- The simulation does not model provider-limit fallback (`nextCandidate`) or account quota; it answers "can the pool place every role", not "will every provider answer".
- A Workflow whose pool has enough families passes even when one of them is blocked by a trust prompt or an expired login; only the trust check covers the first of those.
- `bin/fgos.mjs` and `run.mjs` were edited (small); the GitNexus impact step was not run because the index is stale and the changes are behaviour-neutral (an awaited sync result; a closure moved to a module).
- The worktree needed `node_modules` and `target` symlinks to the main checkout to run anything; they are untracked and not committed.
