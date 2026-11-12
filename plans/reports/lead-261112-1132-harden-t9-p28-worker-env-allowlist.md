# HARDEN T9 P28: worker env allowlist

Branch `harden/t9-p28-worker-env-allowlist`. Backlog row `p-ti7prrwace` (on branch `harden/t9-p27-claude-seat-store`; P27 lands it). Cause report: [debug-261112-1101-pane-seat-env-leak.md](debug-261112-1101-pane-seat-env-leak.md).

## Facts

- Readers of `workerBaseEnv`: `confinement/authority.mjs` (the seat's `workerEnv`, becomes the attempt side file the gate applies after `env_clear`), `assignment-runner.mjs` (the herdr round's `fullEnv`), and tests (`worker-env-case-context`, `attempt-writer-id`, `holder-lock/driver-unavailable`).
- Catch: the herdr round used `workerBaseEnv` as the **controller's** environment, not only the seat's: `establishConfinement` passes `fullEnv` as `sessionEnv`/`callerEnv` to the terminal control and to `assertNotOperatorSession` (`HERDR_SESSION`, `HERDR_SOCKET_PATH`), and `trustStorePaths` reads `CODEX_HOME` and `HOME` from it. A bare allowlist would have broken pane launches. Fixed with `herdrEndpointEnv()` (`terminal-slot.mjs`), added to `fullEnv` only; the seat never gets it.
- What a seat reads: `PATH` (CLI, project shim), `HOME` (login home, shim store formula, mailbox hook `HOME`/`CLAUDE_CONFIG_DIR`), `FGOS_STATE_ROOT` (pinned; the shim's `FGOS_STATE_HOME`/`XDG_STATE_HOME` formula is not needed), login homes by name (`machineLoginStores`, `CLI_LOGIN_HOMES`), `CODEX_HOME` (codex nudge). Executor `env` in `core/config-standard/runner.yaml` declares only `PI_CONFIG_DIR`; `homeEnv` is set by the bwrap driver from the private home.
- Ambient API keys: nothing relies on them. `runner.yaml`, `~/.fgos/config.yaml` and `accounts.yaml` carry no `${...}` and no key variable; the only mentions are historical docs of the old glm route. `${NAME}` in an executor `env` is still resolved from the runner's environment by `resolveExecutorEnv`, so that declared route keeps working. No contract change, no stop.
- Prior art: `git log -S'workerBaseEnv'` shows f8d940348 (recursion guard) and 340cc7d85; `-S'clearenv'` hits only docs and proofs (the 2026-09-06 boundary proof). The denylist grew one name per patch (b99fcb04f added `PI_SESSION_ID`). Reused: the existing `env_clear` in the gate and `withoutPaneEnv` (kept: it lets the pane's own `TERM` win over an executor-declared one). Missing: an allowlist at the one door.

## Final allowlist (`WORKER_ENV_NAMES` in `adapters.mjs`)

| Name | Reason |
|---|---|
| `PATH` | finds the agent CLI and the project shim its hooks call |
| `HOME` | CLI default login home, shim store formula, mailbox hook |
| `USER`, `LOGNAME` | user identity a CLI and its shell report |
| `SHELL` | shell a CLI's bash tool starts |
| `TMPDIR` | temporary files |
| `TZ`, `LANG`, `LANGUAGE`, every `LC_*` | time zone and locale |
| `TERM`, `COLORTERM` | terminal capability (a pane's own value replaces them) |
| `CLAUDE_CONFIG_DIR`, `CODEX_HOME`, `PI_CODING_AGENT_DIR` | login homes a launch with no credential store reads in place (paths, not secrets); a declared `homeEnv` still wins |
| `FGOS_STATE_ROOT` (pin, not ambient) | keeps the machine-scope locks of the parent |

Left out on purpose: `XDG_*` (would point a private-home seat at the real home), `XDG_RUNTIME_DIR`, `SSH_*`, proxy and CA names (nothing in the repo reads them; a seat that needs one declares it in the executor `env`), `NVM_*`/`PNPM_HOME` (`PATH` already carries the resolved bins).

## Proofs

- Owning proof: `test/runner/dispatch/worker-env-case-context.test.mjs`, "a worker starts from the allowlist only..." (canary set: `CANARY_SECRET`, `CLAUDE_CODE_MESSAGING_TOKEN`, `CLAUDE_CODE_CHILD_SESSION`, API keys, session ids, lock, host and case authority, `HERDR_*`, `XDG_RUNTIME_DIR`). Red against the old denylist (`CANARY_SECRET must not cross`), green now.
- Wiring, headless: same file, a real `runUnit` worker reports its variable names; none of the canaries.
- Wiring, pane: `test/run-supervisor/terminal-cutover.test.mjs` (the agent now records its variable names; the side file and the agent have no canary, `CLAUDE_CODE_*`, `*_TOKEN`, `*_KEY`).
- Retired: the per-name "drops X" tests of lock descriptions, case variables, host binary (`worker-env-case-context`) and session ids (`attempt-writer-id`). Their behaviour is owned by the allowlist test: each of those names is in its canary set. The state-root pin keeps its tests (`driver-unavailable`, `attempt-writer-id` digest test).
- Real check (dev host, `CANARY_SECRET` exported, this shell also carries `CLAUDE_CODE_MESSAGING_*`, `CLAUDE_CODE_CHILD_SESSION`, `CLAUDECODE`; names only): `fgos run --provider deepseek` asked a seat to print `env | cut -d= -f1`.
  - Pane seat (inside herdr): 33 names, none of `CANARY_SECRET`, `CLAUDE_CODE_*`, `CLAUDECODE`, `*_TOKEN`, `*_KEY`; present: the allowlist, `FGOS_*` the supervisor sets, the pane's own `TERM_PROGRAM*`/`HERDR_*`, and pi's own `PI_*`/`AI_AGENT`.
  - Headless `cli-spawn` seat (herdr variables unset, so bind chose `cli`): 25 names, no canary, no `CLAUDE_CODE_*`, no `HERDR_*`. Both seats passed and reported.
- Gates: architecture, doc-health, git-mutation-census, instruction-projections green; `check-decision-citation-drift` has the known red in `document-identity/spec.md` (not ours). Census regenerated by its script (0 undeclared sites).
- Full `npm test`: see the landing section below.

## Authority

Execution's `workerBaseEnv` is the one authority for a seat's ambient environment; Provider variables belong to the executor declaration and the credential store (Dispatch config), never to the ambient. Found: the herdr round used the seat-environment door as the controller's own environment, two meanings in one function result. Now the controller's herdr endpoint is its own named helper (`herdrEndpointEnv`, terminal-slot, which already owned the `HERDR_` filter). Not moved: `withoutPaneEnv` and `SAFE_ENV_ALLOWLIST` (persisted-record redaction, authority.mjs) stay in their files; the second is a second list of names in a different layer (what may be persisted, not what a seat gets), left to P27's file owner. Secondary belt, not done: bwrap `--clearenv` (the gate's `env_clear` is the effective control on this path).

## Lessons

- The debug report named `workerBaseEnv` the "single door", but one of its two callers used it for the controller. Grep every reader's use of the result, not only the callers' count, before tightening a shared function.
- A privacy hook blocks any shell command whose text contains the string for the process environment object; write edit scripts to a scratch file and run them.
- `npm run fgos:dev -- run` works in a linked worktree only with `--dir <main checkout>`; the run history lands in the main checkout's ignored `.fgos`.
- Forcing the headless path of a dual-transport executor means unsetting `HERDR_*` for that one command; bind chooses the pane inside herdr.
