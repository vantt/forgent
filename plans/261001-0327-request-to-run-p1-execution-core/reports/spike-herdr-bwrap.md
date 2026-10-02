# Spike: herdr pane + bwrap read-only posture

Date 2026-10-02. Host: herdr 0.9.1-vantt.1 (`HERDR_ENV=1`, socket present), bwrap `/usr/bin/bwrap`, claude 2.1.287. Run by hand from a live herdr pane (`herdr pane split` → `herdr pane run`), not through `fgos run` — see "What this does not prove".

## Posture used

The posture `resolvePosture()` builds for `read-only` in `src/runner/dispatch/confinement/policies.mjs`:

```
bwrap --ro-bind / / --dev /dev --proc /proc --tmpfs /tmp --bind <runDir> <runDir> <command>
```

`<runDir>` stood in for a run dir with an `outbox/`. Command ran in pane `wS:p3S9` (split of this session's pane, closed afterwards).

## Results (files: `spike-herdr-bwrap-probe.log`, `spike-herdr-bwrap-claude.log` in this directory)

| Check | Result |
|---|---|
| Pane gives the wrapped process a TTY | yes (`tty: yes`) |
| Write into the repo checkout | blocked (`touch` exit 1; file absent on disk) |
| Write into the home directory | blocked (exit 1; file absent) |
| Write `outbox/result-1.json` and a file in the run dir | allowed (exit 0; file present, `ls` confirmed) |
| Real claude agent (`claude -p --dangerously-skip-permissions`, `~/.claude` and `~/.claude.json` bound read-write) told to `touch` a repo file then write `outbox/result-2.json` | `A=1` (repo write blocked by the sandbox, not by claude's permission layer — permissions were skipped), `B=0` (outbox write ok); `result-2.json` exists with content `ok` |
| Pane survives the wrapped command ending | yes (shell prompt returned; pane stayed until closed by hand) |

Credentials: claude needed `~/.claude` and `~/.claude.json` writable inside the sandbox. That is an explicit grant, not covered by `host-write-denied` today.

## What this does not prove

- Interactive REPL: only `claude -p` (non-interactive) ran under bwrap in the pane. A REPL session under bwrap in a herdr pane was NOT RUN.
- `fgos run` does not use this path. `bind()` returns `transport: 'herdr'` but `src/runner/execution/run.mjs` never reads it, and `runUnit` did not probe for herdr at all before this round (a probe, `detectHerdrPresent`, was added). `resolvePosture()` has no caller outside tests, and `canApplyPosture()` returns true for every candidate. So the posture phase 6 describes is not applied by either transport today; this spike shows it is feasible, not that it is wired. `src/runner/dispatch/confinement/` still applies confinement only through the older `invocation.confinement` (`{backend: bwrap}`) route.
- codex/openai could not be exercised: its login token is expired on this machine (`Failed to refresh token ... log out and sign in again`).

## Verdict

Feasibility: PASS for the three properties asked (read-only repo, writable outbox, pane + TTY) with claude. Wiring: NOT DONE (see above); carried as a concern, not claimed closed.
