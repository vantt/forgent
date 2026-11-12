# Pane seat env leak (CLAUDE_CODE_CHILD_SESSION, CLAUDE_CODE_MESSAGING_TOKEN)

Read-only. No seat run. Names only, no values.

## Cause

The "worker env allowlist" does not exist. The worker env is a DENYLIST over the runner's own env:

- `src/runner/dispatch/adapters.mjs:124-157` `workerBaseEnv(baseEnv = process.env)`: destructures out 17 named vars (host recursion guard, OMP/PI profile, FGOS_LOCK_*, FGOS_STATE_ROOT, FGOS_HOST_BIN, FGOS_SESSION_ID, FGOS_CASE_*, CLAUDE_CODE_SESSION_ID, CODEX_THREAD_ID, PI_SESSION_*) and returns `...rest` (line 143, 156). Every other name passes.
- `src/runner/dispatch/confinement/authority.mjs:758` `workerEnv = { ...workerBaseEnv(), ...resolvedExecutorEnv, FGOS_DISPATCH_DEPTH }` -> returned as `attempt.secretEnv` (authority.mjs:874).
- `src/runner/dispatch/assignment-runner.mjs:1065` writes it to the attempt side file (`writeAttemptFiles`, `src/run-supervisor/direct-launch.mjs:254-257`), after only `withIdentityEnv(...)` and, for a terminal attempt, `withoutPaneEnv(...)` (herdr-round.mjs:51-54, strips TERM/COLORTERM/TERM_PROGRAM*/HERDR_*).
- The gate (`packages/run-supervisor/rust/src/gate/unix.rs:652-656`) does `env_clear().envs(config.env).envs(secrets)` where `secrets` = side-file env (`gate.rs:251-266`). So the agent gets exactly the side file. `env_clear` there is correct; the content it is fed is the leak.

The runner here was started from a Claude Code Bash tool, whose env carries `CLAUDE_CODE_CHILD_SESSION`, `CLAUDE_CODE_MESSAGING_SOCKET`, `CLAUDE_CODE_MESSAGING_TOKEN`, etc. (names confirmed in `plans/reports/research-261022-1751-mailbox-v4-hook-process-probe.md:50`). They pass `...rest`.

## Q2/Q3: hops

- Pane created by `herdr-round.mjs:432` `tc.allocateAsync({..., env: {} })`: pane env is the herdr server's/pane shell's, NOT the controller's. Irrelevant to the agent: the gate runs in the pane and `env_clear`s.
- Agent env = side file (workerEnv minus pane vars) + config.env (redacted allowlist `SAFE_ENV_ALLOWLIST`, authority.mjs:53) + for terminal only, the pane's own TERM/COLORTERM/TERM_PROGRAM*/HERDR_* (`unix.rs:660-666`). herdr server env cannot reach the agent. Envelope is not the source; the side file is.
- bwrap: `drivers/bwrap.mjs:573-581` has no `--clearenv`; only `--setenv CONFINED_MARKER 1`. bwrap itself inherits the supervisor/pane env, but the gate (inside bwrap, bwrapPrefix handed to the envelope) then `env_clear`s, so bwrap's env is overwritten. `--clearenv` is not the effective control on this path; it would be defense in depth only. The proposal doc (`docs/platform/proposals/coordination-worker-provider-boundary.md:60-77`) already measured inheritance and named `--clearenv`, never implemented.
- Pane vs headless: SAME side-file env (`secretEnv`) feeds both; headless skips only `withoutPaneEnv`. So headless seats carry the same leaked names. "Not reported" = no visible symptom (the pane TUI prints "Transcript saving is off - inherited CLAUDE_CODE_CHILD_SESSION marker", headless `-p` shows nothing). Not proven by me that headless writes transcripts; env content is identical by code.
- Leaking names (by code, from a Claude-Bash-launched runner): `CLAUDE_CODE_CHILD_SESSION`, `CLAUDE_CODE_MESSAGING_SOCKET`, `CLAUDE_CODE_MESSAGING_TOKEN`, `CLAUDE_CODE_ENTRYPOINT`, `CLAUDE_CODE_SESSION_ATTENDED`, `CLAUDECODE`, `AI_AGENT`, `CLAUDE_PID`, `CLAUDE_PROJECT_DIR`, `CLAUDE_EFFORT`, plus every other runner env name (CK_*, any API keys/tokens in the operator env). Only the 17 denied names are dropped. No live confined pane seat of this project was running (pgrep: only operator claude sessions), so no /proc check was possible.

## Q4: layer and line

fgOS code, not herdr. Allowlist should apply at `src/runner/dispatch/adapters.mjs:143/156` (`...rest`) i.e. `workerBaseEnv`, the single door that builds worker env (callers: authority.mjs:758, assignment-runner.mjs:987). Owner: Execution (runner dispatch) for the content; the confinement layer (bwrap `--clearenv` + explicit `--setenv`) is a second belt, not the fix.

## Q5: prior art

- `git log -S'CLAUDE_CODE_CHILD_SESSION'`: no code ever handled it; only docs/research. Intake of P01.2 (`docs/platform/agent-coordination/verification/architecture-advisory-panel/proofs/P01.2/intake.md:101`) said "strip CLAUDECODE/CLAUDE_CODE_SESSION_ID/CLAUDE_CODE_CHILD_SESSION/CLAUDE_PID" for panel seats; not in `src`.
- Same symptom already on record 2026-10-02: `plans/261002-1339-request-to-run-p6-herdr-posture-quota/reports/evidence/ca2/pane-log-reviewer-probe-frames.txt:37`, `ca4/pane-log.txt:31` ("Transcript saving is off - inherited CLAUDE_CODE_CHILD_SESSION marker"). No fix followed (no code hit).
- `-S'clearenv'`: only docs/proofs (2026-09-06 boundary proof). `adapters.mjs` history: b99fcb04f (PI_SESSION_ID added to denylist), f8d940348 (strip recursion guard) - each patch added one more name: denylist whack-a-mole.
- Spec text: the boundary proposal states "Environment overrides therefore do not form an allowlist" (line ~63). No runner contract line found stating the pane env rule; `herdr-round.mjs:44-50` states only the pane-var rule.

## Severity

`CLAUDE_CODE_MESSAGING_SOCKET` + `CLAUDE_CODE_MESSAGING_TOKEN` are the parent session's mailbox credential (research-261020 row 15: mailbox of the SESSION, machine/OS-user scope): a seat can send/read as the lead's Claude messaging peer, i.e. impersonate the dispatching session, from a "confined" seat (the socket is reachable; bwrap binds `/` read-only, no net unshare seen). `CLAUDE_CODE_CHILD_SESSION` breaks transcripts (evidence loss, observed). Any other secret in the operator env (API keys) also reaches every seat. Medium-High (confinement-claim violation; no exfil path beyond local socket proven).

## Smallest fix

In `workerBaseEnv` (Execution, `adapters.mjs`), replace the destructure-denylist with an allowlist of names the seats need (PATH, HOME, USER, LOGNAME, LANG, LC_*, TZ, TMPDIR, XDG_RUNTIME_DIR, SHELL, provider/agent knobs the executor env declares via `resolveExecutorEnv`, FGOS_* the supervisor `attemptStepEnv` already passes minus the denied ones), keeping the `FGOS_STATE_ROOT` pin. Executor config `env` remains the way to add provider vars. Interim minimum: add the `CLAUDE_CODE_*` (except nothing needed), `CLAUDECODE`, `AI_AGENT`, `CLAUDE_PID` prefix/name set to the denial. Secondary: `--clearenv` in `prepareBwrapSync` (bwrap.mjs:573) plus `--setenv` of the allowed names. One owning proof: a unit test on `workerBaseEnv` with a canary env (per design principle 8); one wiring test that the side file lacks the canary.

## Unresolved

- Whether the seat's claude needs any `CLAUDE_CODE_*` (e.g. OAuth token var `CLAUDE_CODE_OAUTH_TOKEN`) from the operator env: allowlist must be derived from executor/credential config, check `credentialStore` handling before cutting.
- Headless leak not observed live; by-code identical.

Status: DONE
Summary: The leak is in fgOS Execution: `workerBaseEnv` (adapters.mjs:124-157) is a denylist (`...rest`), so side-file env fed to the gate's `env_clear` contains every runner name, headless and pane alike; bwrap has no `--clearenv` and herdr is not the source.
