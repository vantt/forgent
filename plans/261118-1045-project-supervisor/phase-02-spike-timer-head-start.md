# Phase 2 — Spike: start a head from the timer environment

The watcher runs from an OS timer. Its wake door must start an LLM head session. A timer service has no terminal, a small PATH and no herdr pane. If no environment works, the wake door cannot start a supervisor. This spike proves what the rendered unit must carry before phase 15 writes it. Output is one report. No code.

## Inputs
Step 0 first: re-grep every item. A result that contradicts a plan decision stops the phase with `NEEDS_CONTEXT`.
- `packages/distribution/rust/src/timer.rs`: `Schedule` enum at `:33` (`MailboxSync`, `AccountProbe`); `service_vars` `:173` (only the probe gets a PATH); `Host::probe_path` `:475` (`~/.local/bin:/usr/local/bin:/usr/bin:/bin`); `render_systemd` `:339` (`Type=oneshot` at `:356` with the default `KillMode=control-group`, so whatever the unit forks dies when it exits; `Environment=` lines, no `WorkingDirectory`).
- The probe's own comment at `timer.rs:158`: "a timer has no herdr session, so the harness leg would open no pane".
- `src/session-host/head-start.mjs:166-190` (`placeHead`: pins persona, binds a seat, launches), `:120` (`defaultLaunch` -> `src/runner/dispatch/session-attempt.mjs`, terminal attempt).
- `docs/platform/session-host/spec.md` (placement, which hosts exist), `docs/platform/terminal-control/` (what a pane needs: a multiplexer, a socket).
- `docs/platform/identity/spec.md` (roles) for the `head:supervisor-<project handle>` uniqueness (PS-8).

## Footprint
`plans/261118-1045-project-supervisor/reports/spike-timer-head-start.md` (create). Nothing else.

## Steps
1. Write down the question: from a service started by systemd (user) and by launchd with only the env the unit declares, can `fgos session start <persona> --name <n>` place a head, and what is the least env that makes it work?
2. Scout, read only: which terminal host the head seat needs (herdr, tmux, other), how it is found (socket path, env var, PATH), and whether a head can be placed with no live terminal client.
3. Try it on this machine in a scratch project (`${TMPDIR:-/tmp}/fgos-work/`), never the main checkout:
   - run `systemd-run --user --wait --collect` with an empty environment plus candidate vars (PATH, HOME, XDG_RUNTIME_DIR, the terminal host socket var); each run invokes `npm run fgos:dev -- session start` for a throwaway persona and records exit code and refusal code;
   - head survival: for every run that started a head, check 2 minutes after the unit exited that the head, its run supervisor and its pane are still alive (`ps`, Session Host `alive`); repeat with `KillMode=process` in a scratch unit and with `systemd-run --user --scope` as the start wrapper, and record which keeps the head; repeat once with linger off (`loginctl show-user`) and record the result;
   - stop every session and process the spike started (process-management rule); list them in the report.
4. Record in the report: the minimal env list, the unit setting that keeps a head alive after the tick exits (`KillMode=process` or a `--scope` start), whether a terminal host must already run, the exact failure codes seen without each var, what happens when the user is logged out, and a macOS note from reading `render_launchd` (no run).
5. State the verdict in one of three forms: "works with env X and survival setting Y" (phase 15 renders X and Y), "works only while a terminal host runs" (the wake door must check for it and fall back to the mailbox notifier), or "does not work" (the wake door asks the mailbox recipient to start the supervisor; this becomes an owner question for the plan).
6. If the verdict is the second or third form, end the run `DONE_WITH_CONCERNS` and name which plan decision changes (PS-8 / PS-9, plan "Risks" first bullet). A verdict that changes no decision ends `DONE`.

## Verify
- The report exists, has the verdict line, the env table, the survival result (head alive 2 minutes after the unit exits, with which setting) and the list of what was cleaned up.
- `ps -eo pid,cmd | rg "fgos-work|session start"` shows nothing left over from the spike.
- `node scripts/plan-contract-check.mjs --plan plans/261118-1045-project-supervisor` still reports no new error.

## Rollback
Delete the report. The spike changes no source and leaves no process.
