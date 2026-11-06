# omp seat lost the pane foreground: `terminal:foreground-not-agent` (design-lap, 2026-11-06)

For: HARDEN lead (fg-server2). Collected read-only on design-lap. Every fact below is quoted
here because the files stay on design-lap. Times are UTC unless marked +07.

## Summary

- The gemini seat ran `omp` v18.11.0 in a bwrap-confined herdr pane on the activated release `sha256:0be72b79…`. omp drew its normal ready screen. About 5-6 s after omp started, the pane's zsh printed its prompt again. The first `send` then found the shell in the foreground, and the supervisor cancelled the run with `terminal:foreground-not-agent`. Nothing was typed.
- The "Update Available" banner is most likely a coincidence, not the cause. omp draws it as a display-only notification. The repo's own omp "ready" fixtures contain the same banner. On 2026-10-24 two omp v18.11.0 runs with this banner state passed between two that failed.
- This is backlog item **p-4bkfiw7d3j** again ("agent loses the tty foreground ~7 s after start", status `proposed`). It is omp-specific: omp has 5 of 83 terminal runs with this ending (6%). pi has 1 of 306, codex 0 of 183, claude 0 of 68. In the same unit, the pi and claude seats ran under the same release, bwrap and herdr, and passed.
- The `_omp_current_account` error comes from Claude Code's shell snapshot: it keeps the `omp` function but drops `_`-prefixed helpers. The seat never uses that wrapper. It runs `/home/vantt/.local/bin/omp` directly through `execvp`.

## Evidence (quoted)

**Run dir** `.fgos/assignments/unit-run-1793954412001-d0f119a0/constraint/1/runs/01/`

`stdout.log` (the pane screen at settle, 1639 bytes, complete):
```
              ██       v18.11.0
 Tip: Press Alt+P (or /switch) to switch provider, and Ctrl+P to cycle role models smol -> slow -> etc
──────────────────────────────────────────────────────────────
 Update Available
 New version 18.17.0 is available. Run: omp update
──────────────────────────────────────────────────────────────
 π > ◑ Gemini 4 Argon > 🌳 forgentX/forgentX-docos-panel > ⑂ detached > (sub) ▶─2%──┃───1M─
╰─                                                   ⇧⇥ to change thinking effort
➜  01 git:(main) ✗
```
The last line is the pane zsh's own oh-my-zsh prompt. Its cwd is `runs/01` in the main checkout, which is where the launch line `cd`s. omp's cwd was `forgentX-docos-panel` (detached HEAD), so this prompt does not come from a shell inside omp. Two things are absent from the screen: omp's clean-exit line `Resume this session with omp --resume …`, which every passing omp run shows, and any zsh `suspended` notice. omp's two status lines sit directly above the prompt, so omp could have redrawn over a notice line.

`supervisor.log`:
```
fgos internal supervise: nothing typed into the pane: the pane's shell (pid 2269658) is in the foreground
{"v":1,"protocol":1,"result":"closed","outcome":"cancelled"}
```
`stop-requested.json`: `{"cause":"cancel","at":"2026-11-06T08:40:20.235Z"}`
`gate-exit.json`: `{"exitCode":143,"signal":null,"stoppedBy":"cancel","cause":"cancel","exitedAt":"2026-11-06T08:40:21.006Z"}`. The gate was still alive when the cancel came, and it wrote this file itself.
`receipt.json`: `"outcome":"cancelled", "outboxPresent":false, "reason":"terminal:foreground-not-agent"`, capture digests = empty (sha256 e3b0c442…); omp wrote nothing to the protected stdout/stderr captures (0 bytes each).
`exit.json`: `{"exitCode":1,"timedOut":false,"settledAt":"2026-11-06T08:40:21.006Z"}`. `result.json` classification: `failure {family: provider, code: nonzero-process-exit}`, `outcome {category: infra}`.
`agent-binding.json`: agent `pid 2` in `pidNs pid:[4026533066]` (inside bwrap), `startTime 218141421`, bound `08:40:14.994Z`.
`supervisor-binding.json`: supervisor pid 2269800 (start 218141391), gate pid 2269976 (start 218141415), `domain linux-gate`, `guarantee {containment: kernel}`, bound `08:40:14.941Z`.
`visibility.json`: `paneId wS:p6EP`, `status pane-created`, `lastSeenAt 08:40:14.424Z`. It also says `confinement unconfined`, but `result.json` says `confinement: bwrap`. That is a reporting inconsistency to note; the launcher really used bwrap.

**unit-summary.json**: outcome `execution-failure`, started `08:40:12.017Z`, settled `08:45:45.245Z`. Seats: `alternative` claude/opus pass, `system` openai/gpt-6-astra pass (CLI `pi`), `constraint` gemini/gemini-4-argon-high `execution-failure`, a single attempt with no fallback.

**Invocation** (`envelope.json` + `protected/prepared-invocation/*.json`, secrets file `protected/attempt-secrets.json` not opened):
- binding: executor `gemini`, invocation `omp-herdr`, transport `herdr` (source `herdr-invocation-present`), adapter `herdr-spawn`, mode `terminal`, mechanism `out-of-process`, posture read-only, lease account `tetcu72`, tier flagship.
- config (`core/config-standard/runner.yaml` `executors.gemini.invocations[omp-herdr]`): `command: omp`, `credentialStore {use: omp, homeEnv: PI_CODING_AGENT_DIR, files: [agent.db, config.yml]}`, `env PI_CONFIG_DIR: ../../tmp/fgos-omp-config`, `interactiveMode {exitCommand: /exit, kind: omp}`.
- worker: `omp --model gemini-4-argon-high --thinking medium --tools read,write,edit,bash,grep,glob --auto-approve`, cwd `/home/vantt/projects/forgentX-docos-panel`, env keys `PATH HOME LANG SHELL=/usr/bin/zsh USER LOGNAME PWD FGOS_DISPATCH_DEPTH FGOS_SESSION_ID FGOS_PARENT_WRITER_ID` (plus pane TERM/HERDR_* and secrets). No `--profile` is passed: the account comes from `PI_CODING_AGENT_DIR` pointing at a private home, `/tmp/fgos-confinement/disp_1793954413341_9820b2c2/home`.
- `launcher.sh`: `#!/bin/sh` + `exec /usr/bin/bwrap --ro-bind / / --dev /dev --proc /proc --tmpfs /tmp --unshare-pid --as-pid-1 --setenv FGOS_CONFINED 1 --die-with-parent` + tmpfs over every credential dir (~/.omp/agent, ~/.omp/profiles/gemini-tetcu72/agent, ~/.claude, ~/.codex*, ~/.pi/*, ~/.config/herdr, /run/user/1000, .fgos/assignments …), ro/rw binds for the run dir, outbox, private home, captures and gate-exit + `-- <release>/bin/fgos internal gate --protocol 1 --envelope …/envelope.json --go-socket /run/user/1000/fgos/327340a21f53b64d.sock`.
- Typed into the pane's zsh: `cd '<runDir>' && '<runDir>/launcher.sh'` (`launch_line`, `packages/terminal-control/rust/src/core.rs:1257`), after the ready-shell probe `printf '%s%s\n' fgos-ok- <nonce>`.

**Earlier identical ends** (all `cancelled terminal:foreground-not-agent`, from `.fgos/assignments/*/receipt.json`):

| started (UTC) | CLI | release | screen tail |
|---|---|---|---|
| 10-21 21:20:22 | omp | a2b19d78 | brief text then prompt |
| 10-22 01:55:07 | omp | a2b19d78 | oh-my-zsh update prompt ate `cd` (fixed since, p-a178ca5c) + "Still starting after 10s" |
| 10-22 11:41:20 | pi | 9508f457 | pi changelog + "New version 1.4.0" |
| 10-24 02:35:06 | omp | a970a7e6 | brief typed, `⎋ Working…`, then `➜  01 git:(main) ✗` |
| 10-24 02:37:21 | omp v18.11.0 | a970a7e6 | `Update Available / New version 18.12.6` then `➜  01 git:(mai…` |
| 11-06 08:40:12 | omp v18.11.0 | 0be72b79 | this run |

Between the two 10-24 failures, omp runs at 02:35:20 and 02:36:43 on the same release and omp version passed. Each of those ends with `Closing session… / Resume this session with omp --resume <id>` and then the prompt. The 10-24 02:35:06 row shows the foreground can also be lost after the brief was accepted, mid-work, with no banner involved.

**omp version**: before = `v18.11.0` (startup banner in this run's screen at 08:40:14-20Z, and in the 10-24 run). Now = `omp/18.17.0` (`~/.local/bin/omp --version`). `~/.local/bin/omp` is a 284 MB ELF with mtime `2026-11-06 15:55:44 +07` (08:55:44Z), the owner's `omp update`, 15 min after the failure. omp keeps no update-check metadata under `~/.omp/cache`. Logs under `~/.omp/logs` and `~/.omp/profiles/gemini-tetcu72/logs` stop at 10-20 and 10-17: a seat's omp logs go to `PI_CONFIG_DIR` inside the sandbox's private `/tmp` and are lost.

**Banner behaviour** (from the 18.17.0 binary's embedded JS, not 18.11): `showNewVersionNotification(s)` only calls `this.ctx.present(...)` with "Update Available / New version ${s} is available. Run: omp update". It is called from the version-check promise after `renderInitialMessages`, so the banner shows up asynchronously a moment after the ready screen. It is not a prompt and does not exit. The repo fixtures `packages/agent-protocol/contracts/fixtures/terminal/omp/{ready,turn-finished,login-needed,chip-in-composer}.txt` all contain this banner, and `omp.rs` has `start_banners: &[]`, so no key is pressed for it.

**Shell wrapper**: in an interactive zsh, `whence -va omp` gives `omp is a shell function from /home/vantt/.zshrc` and `/home/vantt/.local/bin/omp`. The function (`.zshrc:372`) runs `local acct="$(_omp_current_account)"`, then `command omp --profile="$profile" "$@"`. `_omp_current_account` is defined at `.zshrc:364` and reads `~/.omp_active_account`. The newest Claude Code snapshot `~/.claude/shell-snapshots/snapshot-zsh-1793945800270-ymqyd0.sh` defines `omp ()` at line 1226, and its 4th body line is `local acct="$(_omp_current_account)"`. The snapshot contains no single-underscore function at all; `__git_prompt_git` is the only `_`-prefixed one. That is exactly `omp:4: command not found: _omp_current_account`. The seat does not go through this wrapper: the gate runs `Command::new("omp")`, an `execvp` over PATH, inside bwrap.

## Code path that decides `foreground-not-agent` (read only)

1. `packages/run-supervisor/rust/src/gate/unix.rs` `spawn_agent` (terminal mode): runs `pre_exec` with `setpgid(0,0)`, then `tcsetpgrp(0, getpid())` with SIGTTOU blocked. omp leads its own process group and becomes the tty's foreground group. The gate and the outer bwrap stay in the zsh job's group, which is now a background group. `give_back_foreground()` (`tcflush` + `tcsetpgrp(own)`) runs only after the agent's group is gone. Inside the pid ns, `getpgrp` is 0, so that call is a no-op.
2. `packages/agent-protocol/rust/src/terminal/mod.rs` `await_ready`, then `deliver_brief`. omp uses `submit_by_prompt_door: true`, so the first `send` is the brief itself.
3. `packages/run-supervisor/rust/src/supervise/terminal.rs` `TermIo::send`, then `core.send`. On `SendOutcome::ForegroundNotAgent` it logs "nothing typed into the pane: …" and calls `begin_stop("cancel", REASON_FOREGROUND_NOT_AGENT)`.
4. `packages/terminal-control/rust/src/core.rs` `Core::send` calls `driver.process_info(pane)`, which is `herdr pane process-info --pane <id>`, then `foreground_of`. That uses `identity::first_non_shell(info)`, the first foreground process whose pid ≠ `shell_pid`. If none is found, it falls back to the `Launched` marker (exec-replaced shell). If both give nothing and `identity::is_bare_shell`, it returns "the pane's shell (pid N) is in the foreground".

When an agent is only showing a banner but still holds the tty, herdr's foreground list holds omp, which is not the shell, so `send` would type. The reason "pane's shell is in the foreground" therefore means herdr reported the tty's foreground group as the shell's own. The zsh prompt on screen agrees: zsh had already taken the tty back. So omp had lost the foreground before the send. The gate itself never hands the tty back while omp lives.

## Timeline (2026-11-06, UTC)

| time | event | source |
|---|---|---|
| 08:28:29.917 | workflow `wf-run-1793953709917-02abe923` created | run id |
| 08:40:12.001 | shaping unit created; 08:40:12.017 started | unit id, unit-summary |
| 08:40:12.854-.861 | constraint run admitted / launch command id | run.json, attempt id |
| 08:40:12.939 | gemini lease tetcu72 selected | effective-execution-contract |
| 08:40:13.341 | dispatch id (private home) | prepared-invocation |
| 08:40:14.424 | herdr pane wS:p6EP created | visibility.json |
| 08:40:14.941 / .994 | gate bound / omp (ns pid 2) bound | supervisor-, agent-binding |
| ~08:40:15-20 | omp draws v18.11.0 ready screen, banner, then zsh prompt returns | stdout.log |
| 08:40:20.235 | first send refused, stop requested (cause cancel) | stop-requested.json |
| 08:40:21.006 | gate exits 143 (cancel); run settled | gate-exit, exit.json |
| 08:40:21.987 | attempt closed (settle, finalize-home, cleanup-trust, release-slot) | closed.json |
| 08:45:45.245 | unit settled `execution-failure` | unit-summary |
| 08:55:44 | `~/.local/bin/omp` replaced (omp update → 18.17.0) | file mtime |
| 08:56:50.964 | new run `wf-run-1793955410964-95bb3ea1` created | run id |

omp lived about 5.2 s from binding until the refused send, and at most 6 s until the cancel. That fits the "~7 s" of p-4bkfiw7d3j (10-23, fg-server) and the "9-11 s" of today's 12:35 dev-build report.

## Hypotheses, ranked

1. **The zsh job stopped or ended while omp still ran, so zsh reclaimed the tty (p-4bkfiw7d3j, omp-specific).**
   - For: the prompt is on screen. There is no omp `Resume this session` line, so omp did not exit cleanly. The gate was alive at cancel (it wrote `gate-exit`, 143). After `spawn_agent`, the gate and outer bwrap sit in a background group: any tty read or tcsetattr by them would stop the job (SIGTTIN/SIGTTOU), and zsh would take the tty back. The 10-24 mid-work case shows the loss is not tied to startup or to the banner. The rate is concentrated on omp (5/83).
   - Against: the screen shows no zsh `suspended` notice, though omp may have redrawn over it. The 10-23 case had a `%` partial-line mark, which hints that the job exited rather than stopped. The only thing that would make the gate survive a bwrap exit is the `--die-with-parent` semantics, which argues against an exit. Process states were not captured.
2. **omp, or a child it starts, does job control of its own and moves the foreground** (for example an interactive shell, or a tool that calls `tcsetpgrp`/`setsid`, at ~5 s, when the async version check or plugin discovery finishes).
   - For: the loss is omp-only. It happens at a similar delay each time, and also mid-work.
   - Against: no omp log survived (`PI_CONFIG_DIR` sits on the sandbox tmpfs). Nothing shell-related turned up in older host logs.
3. **The update banner itself, or the update check, is the trigger.**
   - For: two of the five omp cases end on the banner.
   - Against: the banner is display-only in the code. It is part of the passing "ready" fixtures. Same-version passes on 10-24. 10-21, 10-22 and 10-24 02:35 show no banner. It can only be tested now by pinning 18.11.0 again, since 18.17.0 has no newer version to announce.
4. **Dev build vs release regression** (12:35 report).
   - Against: this failure is on the activated release 0be72b79, so "release works" does not hold as a general rule. Both builds can hit it.

## What HARDEN needs to reproduce

- omp 18.x in a herdr pane, launched exactly as above: zsh pane, probe, then `cd <runDir> && launcher.sh`, then `exec bwrap --unshare-pid --as-pid-1 --die-with-parent … -- fgos internal gate`. The gate runs omp with `setpgid`+`tcsetpgrp` and `PI_CODING_AGENT_DIR` pointing at a private home that holds copied `agent.db`/`config.yml`. Args are listed above.
- Run 20-30 read-only omp seats. In parallel, add capture that today's design does not keep, polling every 0.5 s on the host from launch until the first send: `/proc/<zsh pid>/stat` (field 8 `tpgid`), plus the `stat` state (T, Z, S), `pgrp` and `sid` of the outer bwrap, the gate and omp's host pid. The `herdr pane process-info` JSON answer also. Keep omp's `PI_CONFIG_DIR` logs: put them outside the sandbox `/tmp`, or copy them out in `finalize-home`. Optionally `strace -f -e trace=ioctl,setpgid,setsid,kill -p <gate>` around the launch.
- Expected discriminators: H1-stop shows outer bwrap/gate in state `T`. H1-exit shows the zsh child pid gone while the gate is alive. H2 shows `tpgid` equal to a pgroup that is neither omp's nor the shell's, or a new omp child with its own `sid`/`pgrp`.
- To test H3 cheaply, compare omp runs where the version-check notification is turned off. omp has a setting gate (`Hwe.get(settings)`) around `showNewVersionNotification`. A small rate (≈6%) needs ≥30 runs per arm.

## Open questions

- Whether `wf-run-1793955410964-95bb3ea1` gets its gemini seat through: at 09:03:01Z `fgos workflow status` reports `status running`, step `framing` running (unit `unit-run-1793955411290-c5ff142b`), `shaping` pending. Not waited on.
- Is the herdr pane `wS:p6EP` still retained for inspection (`retainFailedPaneMs: null`)? It was not checked: the sandboxed shell here cannot see host processes.
- Why does `visibility.json` say `confinement unconfined` while the run used bwrap?
- Exact 18.11.0 startup code. Only 18.17.0 is on disk now.
- Should omp's startup and tool logs survive the sandbox for the next failure (they are now lost with the private `/tmp`)?
