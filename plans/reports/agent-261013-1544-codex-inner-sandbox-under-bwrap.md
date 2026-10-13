# Codex inner sandbox under fgOS bwrap: `Can't mkdir <cwd>/.aws`

Date: 2026-10-13. Branch `worktree-agent-a5a43d5dccbc4038d`, fix commit `96283a8c0` (base: main `0990a010a`, fast-forwarded before work).

## 1. Problem

A confined read-only (`host-write-denied`) Codex pane (`codex-herdr-fgovn`, run
`.fgos/assignments/unit-run-1791874482416-acccbfe0/panelist-2/1/runs/01` in the main checkout) ran its first
commands and wrote `ack-1.json`. After its turn was interrupted, every command failed before it ran with
`bwrap: Can't mkdir /home/vantt/projects/forgentX/.aws: Read-only file system`, so `report-1.md` and
`result-1.json` were never written (the screen is captured in `herdr-diagnosis.json`; the run settled `timed-out-idle`).

## 2. Prior art

- `9ddf59017` (2026-09-09) introduced `codex-bwrap`: `-s danger-full-access` is correct only because bwrap is the
  confinement; a per-run `CODEX_HOME` holds `auth.json`. Its description already noted that the helpers
  `codex-linux-sandbox` and `codex-execve-wrapper` belong to Codex's own sandbox, which that executor deliberately does not use.
- `5a42bc376` moved bwrap executors under the Confinement Authority (private-home resource binding to `CODEX_HOME`).
- `acde5fd07` (2026-10-02) made the herdr pane run `codex -s danger-full-access -a never` under bwrap with a private home.
- `85322eb17` (`stop-processes-inside.mjs`) already knew that Codex starts `app-server-daemon` from `<home>/packages/...`
  and leaves it running, but it only stopped the leaked process. Nothing set how the daemon runs the session.
- No commit or spec mentions `--no-daemon`, `daemon_auto_start`, `sandbox_mode` in a private home, or `.aws`.
  `git log -S` for `sandbox_mode` turns up only `.fgos` event-log noise.
- Codex itself (0.160.1 global, 0.162.1 in the account's daemon releases): `codex features list` shows
  `daemon_auto_start` (stable, on), `code_mode_host` (stable, on) and `in_app_updates` (on). `codex --help` offers
  `--no-daemon` ("Run without the shared background server, even if it is already running"). `codex exec` has no
  daemon option and does not use the daemon. The account home `~/.codex-fgovn/app-server-daemon/daemon-updater.stderr.log`
  shows a daemon-updater that runs `scheduled_update` / `installer_fetch` periodically, and
  `~/.codex-fgovn/packages/app-server-daemon/releases/` holds 0.158.0 through 0.162.1, each installed on a different day.

## 3. Cause, with evidence

**Proven: the error is Codex's own sandbox in `workspace-write` mode, running inside the fgOS read-only mount.**
Repro script (scratch): the same mount fgOS builds (`--ro-bind / /`, `--dev`, `--proc`, `--tmpfs /tmp`, a private
home and an outbox bound writable), and inside it
`codex sandbox -c sandbox_mode="<mode>" -- sh -c 'echo ok > <outbox>/report.md'`:

| codex | cwd | mode | result |
|---|---|---|---|
| 0.162.1 (daemon release) | main checkout | workspace-write | `bwrap: Can't mkdir /home/vantt/projects/forgentX/.aws: Read-only file system` (the exact error) |
| 0.160.1 / 0.162.1 | this worktree (has no `.codex`) | workspace-write | `bwrap: Can't mkdir .../agent-a5a43d5dccbc4038d/.codex: Read-only file system` |
| 0.162.1 | worktree | read-only | `bwrap: execvp codex-linux-sandbox: No such file or directory` (a different failure) |
| 0.162.1 | worktree | danger-full-access | `WROTE`, exit 0, outbox file present |

So the process that prints the message is the `bwrap` that Codex's own sandbox launches (Codex bundles one in
`codex-resources/bwrap`). In `workspace-write` mode Codex treats the cwd as a writable root and creates mount points
inside it to mask protected names: `.codex` first, then `.aws` (the main checkout already has `.codex`). Under the
outer `--ro-bind` that mkdir fails before any command runs. With Codex's sandbox off (`danger-full-access`) the
outbox write succeeds and the host stays read-only.

**Proven: the pane runs its session on the background daemon from the start.** A live confined pane dispatch
(`codex-herdr-fgovn`, read-only posture, through the real assignment runner) had
`<private home>/packages/app-server-daemon/releases/0.160.1-.../` and `app-server-daemon/daemon.pid` within seconds
of starting. The private `config.toml` holds only the seeded `trust_level = "trusted"` and has no `sandbox_mode`, so
Codex's default for a trusted project is `workspace-write`. The TUI shows `permissions: YOLO mode`, so its `-s`
applies to the thread it opens.

**Probed, but no repro of the switch:**
- Esc-interrupting a turn, then sending fgOS's "continue" nudge: commands keep working.
- SIGTERM to the daemon: it waits until its clients leave.
- SIGKILL to the daemon: the 0.160.1 TUI reports "Reconnect failed" and does not reopen the thread.

**UNPROVEN: what moved the original thread into `workspace-write`.** The strongest hypothesis fits all the evidence
but I did not reproduce it. The TUI was 0.160.1 (the global install, still 0.160.1 today). The failed home had a
0.162.1 daemon. A fresh home installs a daemon matching the TUI (0.160.1, measured). So the private home's own
daemon-updater swapped in 0.162.1 mid-run. The swap ended the in-flight turn, which would explain the "interrupted"
turn the Lead could not explain. The thread was then reopened on the new daemon without the TUI's `-s`, fell back to
the config default `workspace-write`, and hit the mkdir failure. The private home of the failed run was already
removed, so its logs and rollouts can't be checked.

## 4. Change and why

`.fgos/config.json` gives `executors.openai` invocation `codex-herdr-fgovn` an extra `--no-daemon` arg (now
`-s danger-full-access -a never --no-daemon --model {model}`).

Why this layer:
- With `--no-daemon` the session lives in the pane's own Codex process, which got `-s danger-full-access -a never`.
  No second Codex process with its own config defaults runs commands, and nothing can be upgraded mid-run.
  This removes the trigger whatever the exact handoff event was. bwrap stays the only confinement, and the host
  stays read-only.
- Side benefit: no daemon or updater starts from the private home any more (measured: no `app-server-daemon/` or
  `packages/` in the home). That is the leak `stop-processes-inside.mjs` exists to clean up after.
- It is a config-only change. There is no provider branch in the bwrap driver (spec §6.5) and no edit to herdr trust
  seeding (owned by another agent).
- Not chosen: writing `sandbox_mode = "danger-full-access"` / `approval_policy = "never"` into the private
  `config.toml`. That file is written by trust seeding in `herdr-round.mjs`, which I must not touch, and doing it
  in the driver would need Codex-specific code. It stays a possible second layer of defence and is recorded in
  spec §13.3.
- Not chosen: `-c sandbox_mode=...` in the args. It is the same scope as `-s` (this process only) and adds nothing.
- Not chosen: writable scratch mount points for Codex's sandbox. That makes the read-only workspace partly writable
  and runs two sandboxes inside each other for no gain.
- `codex-cli-bwrap` (`codex exec`) does not use the daemon and is unchanged.

Docs:
- `docs/specs/confinement-authority.md` gets a new §13.3 (decision, why, evidence, what is unproven).
- `CHANGELOG.md` gets an `[Unreleased]` → Fixed entry.

GitNexus: no function or method was edited (config, test, docs only), so impact analysis had no symbol to run on.
`detect_changes` on the branch-only diff (`main...HEAD`) touches four files and no code symbols. Its two-dot compare
against the moved main lists main's own newer commits, none of them mine.

## 5. Tests

- New test in `test/runner/herdr-provider-invocations.test.mjs`: "the codex pane keeps its session in its own
  process, never on the shared background daemon".
  - Before the fix: failed with `codex-herdr-fgovn args ["-s","danger-full-access","-a","never","--model","{model}"] must carry --no-daemon`.
  - After the fix: file 6/6 pass.
- Full suite: green, see §8.

## 6. Live verification

A confined read-only Codex dispatch through the real assignment runner, pinned to `codex-herdr-fgovn` with the
read-only binding a Workflow unit carries (run `asgn_cfcd0e10_beed_4753_94c8_04bd36d661bf_op_008`, in this
worktree's `.fgos/assignments`, not committed). Results:
- `visibility.json`: `confinement.status: confined-bwrap`, `outcome: settled`, trust seeded and removed.
- The private home has no `app-server-daemon/` and no `packages/`.
- The outbox has `ack-1.json`, `report-1.md` and `result-1.json`:
  `{"status":"done","summary":"All five sandbox probe commands completed separately with exit code 0; no sandbox fault was observed. ..."}`.
  - The report lists `pwd`, `ls -a`, `sleep 20 && echo slept`, `cat package.json | head -3` and `sleep 20 && echo slept-again`, all with exit code 0.
- Baseline before the fix (op_004, no `--no-daemon`): it also completed, since no daemon swap happened in a short
  run, but its private home had the daemon installed at startup.

## 7. Side finding (out of scope, UNPROVEN whether intended)

`fgos dispatch execute --contract <file> --executor openai` with `"mutation": "read-only"`, run from inside herdr,
picked `cli-spawn` and settled with `"confinement": null` and "Permission enforcement: instructed". It did not use
the `codex-cli-bwrap` sandbox. RUL77 in `docs/specs/runner.md` describes this door as the confined read-only door
that leases the account. Worth a separate check. I filed no work item, as instructed.

## 8. Full suite result

`npm test` with `CLAUDE_CODE_SESSION_ID` unset, on this branch: tests 7262, pass 7187, fail 0, skipped 10, todo 65 (about 672 s). The 11 tests known to fail on main (`fgctl-init`, `release-tree`) did not fail in this run.

## 9. Cleanup

- I closed every herdr pane I opened: `wS:p4V1`, `p4V2`, `p4V4` and `p4VB` closed after their runs settled, and I
  closed `p4V5` and `p4V8` myself.
- I removed my leftover private homes (`disp_1791881839760_721340c5` and `disp_1791882066839_03f89be7`) through
  fgOS's `cleanupConfinementResource`, so login write-back still ran.
- `disp_1791882157350_54dbcfc4` (pane `wS:p4V9`) is not mine and I left it.
- No background processes of mine are left. I killed my run's daemon (pid 827967) during the SIGKILL probe.
- Scratch files are only in the session scratchpad.

## 10. Risks / open questions

- Does the 0.162.x TUI also honor `--no-daemon`? Its help lists the flag. Machines whose global `codex` is older
  than 0.160 may reject the flag. **UNPROVEN** on other versions.
- herdr agent detection still worked with `--no-daemon` (agent detected, prompt ready, run settled).
- A second layer of defence (writing `sandbox_mode` into the private `config.toml`) is not done. It needs either the
  trust-seeding owner or a generic home-seed mechanism, which would be a new mechanism and so a decision question.
