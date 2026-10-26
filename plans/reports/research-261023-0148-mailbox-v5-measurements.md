# Mailbox V5: hook process facts, the hook cwd, the inline context bound, and why not `resolve_workspace_root`

Date: 2026-10-23, Asia/Saigon, machine `fg-server`. Branch `mailbox/v1-v3`, recorder at `ecdb84f3d`. Plan: `plans/261023-0013-mailbox-v5-native-hook-door/` phase 2. Versions: Claude Code 2.1.308, Codex 0.161.0 (both already under `testedAgainst`; each read before and after every run, unchanged).

## Runs (live CLI invocations: 5)

All through `scripts/record-mailbox-hook-fixtures.mjs run <cli> <probe|probe-pane|ladder>`, each once, no retry, each preceded by the same mode with `--dry` against the stub CLI. Guards: the allowlisted environment of `scripts/lib/mailbox-live-cli.mjs`, an isolated run `HOME` (Claude Code: only a `.claude` link to `~/.claude`; Codex: an empty directory and `CODEX_HOME` in the run directory with `auth.json` linked to the `tetnu` account file), `timeout 300`, the spawn marker `spawned.json`, the heavy-gate and memory refusal (a run waited until another session's `npm test` ended), and for Codex the login guard before and after (link intact, `codex login status` ok, nothing set aside). Prompts were benign shell commands only.

| Run | Spawn marker (UTC) | Exit | Hook calls |
|---|---|---|---|
| P1 `run claude probe` (print) | 2026-10-22T19:00:06Z | 0 | 5 |
| P2 `run claude probe-pane` (interactive, herdr pane `w4:p4B` through Terminal Control, closed after the Stop call, 8.6 s) | 2026-10-22T19:00:34Z | 0 | 5 |
| P3 `run claude ladder` (print) | 2026-10-22T19:00:55Z | 0 | 14 |
| P4 `run codex probe` (`codex exec`) | 2026-10-22T19:01:43Z | 0 | 5 |
| P5 `run codex ladder` (`codex exec`) | 2026-10-22T19:02:28Z | 0 | 14 |

The hook was an executable at `<ws>/.fgos/installation/bin/fgos`, referenced by the installer's command strings: Claude Code `PostToolUse` plain (`"${CLAUDE_PROJECT_DIR}/.fgos/installation/bin/fgos" hook mailbox --cli claude --event post-tool-use`), `Stop` guarded (plan decision 14); Codex `PostToolUse` plain (`shimCommand`'s quoted absolute path), `Stop` guarded. Raw files are kept under `.fgos/runtime/tmp/mailbox-v5/evidence/p2/` (gitignored). Every run directory was removed with `clean-probe`. Removed from the real `~/.claude/projects`: `-tmp-fgos-work-mailbox-v3-record-claude-probe-ws` (1 file), `…-claude-probe-pane-ws` (1 file), `…-claude-ladder-ws` (9 files: the transcript and the persisted-output files). Not removed, as earlier rungs left them: the V3/V4 directories `…-claude-{accept,dump,dump-agent-head,subagent}-ws`.

Deviations from the phase file:

- The ladder steps are `echo step<n>` shell calls for all 14 steps, and the hook keys its size on the step number in the command, not on the call count, so a skipped step cannot shift the sizes. The sibling `PostToolUse` hook fires from step 11 on, also keyed by the command, instead of a `Read` matcher.
- Steps 11–14 repeated the four largest ladder sizes (11,264, 12,288, 13,312, 14,009). The phase file asked for the four largest **inline** sizes, which could not be known before the run; all four turned out to be above the threshold, so the sibling repeat could not tell per-hook from summed (table d). Settling it needs one more run per CLI, which only the controller can authorize.
- P2's prompt was passed as the first argument of the interactive session, as V4 D3 did, not typed into the pane.

## (a) `resolve_workspace_root` per call (RT1 evidence; no CLI)

A scratch crate (never committed, `.fgos/runtime/tmp/mailbox-v5/resolver-probe/`) calls `fgos_distribution::workspace::resolve_workspace_root(&cwd)` once per process, run from a linked worktree of a scratch repository, under `strace -f -e trace=execve,openat,mkdir,rename`.

| Case | Result | Child `execve` | of them `git` | State-root `mkdir` | Files created under the state root | Time |
|---|---|---|---|---|---|---|
| Fresh `XDG_STATE_HOME` (first call) | main checkout | 47 | 20 | the state root, `git-empty-hooks`, a whole floor-probe repository `git-floor-<pid>-4` (created, then deleted) | `git-floor-verdict.json` (durable-file rename), the floor repo's hooks, refs, objects | 385 ms |
| Same state root again (warm) | main checkout | 12 (6 `bwrap`, 5 `git`, 1 `/bin/true`) | 5 (`config --list` twice, `rev-parse --show-object-format`, …) | 0 | 0 | 101 ms under strace |
| Warm state root, different `PATH` | main checkout | 47 | 20 | 9 | 36 (the floor probe runs again: its verdict is keyed by `PATH`) | 286 ms |
| `HOME` unset | refused: `git-config-paths-unavailable` | 45 | 19 | 11 | 35 | 263 ms |
| `HOME` and `XDG_STATE_HOME` unset | refused | 45 | 19 | 14, **relative to the cwd**: it created `.local/state/fgos` inside the worktree | 35 | 189 ms |
| 50 fresh warm processes, no strace | | | | | | p50 23.7 ms, p95 70.8 ms, max 80.5 ms (in-process); wall p50 26.6 ms, p95 76.3 ms |

Why it is too costly for the hook path: every fresh process spawns at least 12 children (5 of them `git`) even with a warm state root; a changed `PATH` reruns the whole floor probe, which writes a repository and a verdict file; and the warm p95 alone (76 ms wall) exceeds the 50 ms target of the whole hook. The no-mail hook must also be write-free, which this read is not. Plan decision 3 stands: the hook and the verbs use the disk-only `main_checkout_root` that phase 6 cuts out of `resolve_topology`.

A finding outside this lane: with `HOME` and `XDG_STATE_HOME` both unset, the Git component's state root resolves to a relative `.local/state/fgos` and is created in the caller's cwd (here inside a worktree). It is recorded for the GIT/HARDEN lanes, not fixed here.

## (b) Hook parent against tool parent, and the hook cwd

Per process: `comm`, `exe` (`readlink /proc/<pid>/exe`), `cmdline[0]`, `tty_nr`, session, process group, and the kinds of fds 0, 1, 2. `realpath(/bin/sh)` is `/usr/bin/dash` on this machine.

| CLI, mode | Process | comm | exe | cmdline[0] | tty | own session | fds 0/1/2 | its parent |
|---|---|---|---|---|---|---|---|---|
| Claude, print (P1) | hook's parent (all 5 calls, plain and guarded) | `sh` | `/usr/bin/dash` | `/bin/sh` | none | yes (leader) | socket/socket/socket | `claude` |
| Claude, print (P1) | tool's parent (2 dumps) | `zsh` | `/usr/bin/zsh` | `/usr/bin/zsh` (argv `-c source <shell snapshot> …`) | none | yes (leader) | null/file/file | `claude` |
| Claude, interactive pane (P2) | hook's parent | `sh` | `/usr/bin/dash` | `/bin/sh` | none | yes | socket/socket/socket | `claude` (which has the pane tty) |
| Claude, interactive pane (P2) | tool's parent | `zsh` | `/usr/bin/zsh` | `/usr/bin/zsh` | none | yes | null/file/file | `claude` |
| Codex, exec (P4) | `PostToolUse` hook (plain form): its parent | `codex` | `…/.codex/packages/standalone/releases/0.161.0-x86_64-unknown-linux-musl/bin/codex` | `/home/vantt/.local/bin/codex` | none | no | null/socket/socket | `timeout` |
| Codex, exec (P4) | `Stop` hook (guarded form): its parent | `zsh` | `/usr/bin/zsh` | `/usr/bin/zsh` (argv `-c <the guarded command>`) | none | yes | pipe/pipe/pipe | `codex` |
| Codex, exec (P4) | tool process: its parent | `codex` | as above | as above | none | no | null/socket/socket | `timeout` |

The hook processes themselves: Claude hook fds socket/socket/socket; Codex hook fds pipe/pipe/pipe; tool processes null/file/file (Claude) or null/pipe/pipe (Codex).

Session variables: every Claude hook call saw `CLAUDE_CODE_SESSION_ID`; every Claude tool process saw it too. No Codex hook call saw any of the three variables; the Codex tool processes saw `CODEX_THREAD_ID`.

| CLI | Hook cwd before the tool's `cd` | after it | `CLAUDE_PROJECT_DIR` in the hook | in the tool process |
|---|---|---|---|---|
| Claude, print and pane | `ws` | **`ws/elsewhere`** (the hook's cwd and the payload's `cwd` follow the model's `cd`) | `ws`, before and after | unset |
| Codex | `ws` | `ws` (each tool command runs in a fresh shell, so the `cd` is lost; the tool's next dump also ran in `ws`) | unset | unset |

Consequences for plan decision 3: the Claude start directory must be `CLAUDE_PROJECT_DIR` (the hook's cwd moves with the model). The verbs, run from a tool process, have no `CLAUDE_PROJECT_DIR` and fall back to cwd: a model that `cd`s outside the repository and then runs `fgos mailbox` gets `[record.error]` for no repository. That residual is written down; inside the repository the main-checkout read walks up from any subdirectory.

## (c) The Codex head and how Codex runs commands

- Head exe: `/home/vantt/.codex/packages/standalone/releases/0.161.0-x86_64-unknown-linux-musl/bin/codex`, basename `codex`; invoked as `/home/vantt/.local/bin/codex`.
- Codex runs a hook command through the user's `$SHELL -c` (here `/usr/bin/zsh -c`, argv recorded). zsh execs a single simple command, so the plain `shimCommand` form lands directly under `codex` (`direct`), while the guarded form keeps `zsh` between (`one-shell-hop` through the **user's login shell**).
- Codex runs a tool command the same way: the tool process sits directly under `codex` as well. So the M4 executable check refuses a subreaper or pane process at the head position, but it does not tell a Codex tool process from a Codex hook process; both have `codex` as parent. Start order separates nothing (RT8). The remaining facts that differ (no session variable in the hook, fd 0 pipe in the hook against null in the tool) are not a guard against the same user, and the `WriterMismatch` guard keeps its plan-decision-8 form.

## (d) The `PostToolUse` context ladders

Verdict per step from the model input: Claude's transcript `hook_additional_context` record, Codex's rollout developer message. `inline` = the whole text arrived; Claude `moved` = a `<persisted-output>` block (2,341-byte preview, file saved); Codex `truncated` = the middle cut out ("Warning: truncated output …", about 10,100 bytes kept, both markers present).

| Step | Bytes | Claude 2.1.308 | Codex 0.161.0 |
|---|---|---|---|
| 1 | 2,048 | inline | inline |
| 2 | 4,096 | inline | inline |
| 3 | 6,144 | inline | inline |
| 4 | 8,192 | inline | inline |
| 5 | 9,216 | inline | inline |
| 6 | 10,240 | moved | truncated |
| 7 | 11,264 | moved | truncated |
| 8 | 12,288 in 3-byte characters (4,096 characters) | **inline** | truncated |
| 9 | 13,312 | moved | truncated |
| 10 | 14,009 | moved | truncated |
| 11–14 | 11,264 / 12,288 / 13,312 / 14,009, each with the 2,048-byte sibling | moved; sibling inline | truncated; sibling inline |

- Claude Code's threshold counts **characters** (the 12,288-byte step of 4,096 characters stayed inline), between 9,217 and 10,240 characters. Codex's counts **bytes** (the same step was cut to about 10,100 bytes), between 9,217 and 10,240 bytes. A bound in bytes is safe for both, since a text never has more characters than bytes.
- Largest inline step: 9,216 bytes for both CLIs, at the ladder's 1,024-byte resolution. V4 L3a's "14,010 bytes or more is moved" did not bracket the threshold; this ladder does.
- Per hook or summed: not determined by this ladder (deviation above); settled by the authorized re-run in table (g): **per hook** in both CLIs.
- Non-ASCII: changes the verdict for Claude (characters counted), not for Codex (bytes counted).

## (e) The values phase 3 writes

| CLI | `hookTopology` | `hookShell` | `headExecutables` | `postToolUseContextMaxBytes` | Source rows |
|---|---|---|---|---|---|
| `claude` (2.1.308, linux) | `one-shell-hop` | `/bin/sh` | none (the head's exe basename is the version, `2.1.308`; the head is bound by the session file, not by its executable) | **8,192** | (b) P1, P2; (d); (g) |
| `codex` (0.161.0, linux) | `direct` | null | `codex` | **8,192** | (b) P4, (c); (d); (g) |

The bound applies plan decision 6's margin rule for a threshold shown to apply per hook (table g): the largest inline step less one ladder step, 9,216 − 1,024 = 8,192 bytes. Before the re-run the summed-case rule gave 4,608 (9,216 / 2), which phase 3 first wrote into the contract.

Whether Codex accepts the guarded command form: **it runs it** (the guarded `Stop` hook ran), but through the user's login shell, which puts that shell at the hop position: the topology then depends on the user's `$SHELL`, and the hop shell is the same program the tools run in. So the Codex row keeps the plain `shimCommand` form (decision 14's fallback), which zsh exec'd into `direct` (measured; bash also execs a lone `-c` command, not measured here). Residual: a user whose `$SHELL` does not exec a lone command (dash, the `/bin/sh` here) gets a shell at the head position, and the Codex hook then stays quiet with `NoHead::WrongExecutable`; that is a quiet failure, never a wrong registration.

## (f) The discriminator chosen (plan decision 7) and its residual

- **Claude Code:** accept the hop only when the parent's `exe` equals `realpath(hookShell)` (`/usr/bin/dash`) **and** its `cmdline[0]` is `hookShell` (`/bin/sh`). In every measured mode (print and interactive) the hook's shell passes and the tool's shell fails on both facts (`/usr/bin/zsh`). tty and session do not separate them (both: no tty, own session), so no tty or session predicate is added.
- Residual: Claude Code runs tools in the user's `$SHELL`. A user whose `$SHELL` is `/bin/sh` itself would give tool shells the same two facts, and the check falls back to the topology and pid-reuse guard of spec §6.1. The tool shell's `-c` script starting with `source <shell snapshot>` and its file stdout would still differ, but they are implementation details of 2.1.308 and are not used.
- **Codex:** `direct` with `headExecutables: ["codex"]` refuses a subreaper or pane process; a tool process of the same Codex passes the position check, as (c) shows. The `WriterMismatch` guard (an entry environment whose session variable names another session than the payload) and the `att-` check still run. Same-user processes remain outside the guard, as spec §6.1 says.

## (g) Re-run: per hook or summed (2 more live invocations, authorized by the plan owner)

The plan owner (agent) authorized one more ladder per CLI after the first report (total live runs of this phase: 7). Mode `ladder-sum` of the recorder: steps of 5,120, 6,144, 7,168, 8,192 and 9,216 bytes, each at or below the largest inline step, each beside the 2,048-byte sibling, so the sum of the two hooks' texts crosses the single-hook threshold (moved or truncated at 10,240) from step 4 on. Dry runs first, no retries, benign `echo` steps.

| Run | Spawn marker (UTC, 2026-10-22) | Exit |
|---|---|---|
| P3b `run claude ladder-sum` | 2026-10-22T19:46:46Z | 0 |
| P5b `run codex ladder-sum` | 2026-10-22T19:47:15Z | 0 |

| Step | Ladder bytes | Sum with sibling | Claude 2.1.308 ladder / sibling | Codex 0.161.0 ladder / sibling |
|---|---|---|---|---|
| 1 | 5,120 | 7,168 | inline / not run (see below) | inline / inline |
| 2 | 6,144 | 8,192 | inline / inline | inline / inline |
| 3 | 7,168 | 9,216 | inline / inline | inline / inline |
| 4 | 8,192 | 10,240 | inline / inline | inline / inline |
| 5 | 9,216 | 11,264 | inline / inline | inline / inline |

- Steps 4 and 5 put more than the single-hook threshold into one event and nothing was moved or truncated: **the threshold applies per hook** in both CLIs. Each hook's text is its own record (Claude: one `hook_additional_context` attachment per hook; Codex: one developer message per hook, 9,216 bytes alone at step 5).
- Claude's step-1 sibling did not run: it started before the ladder hook created the run's `calls/` directory and failed on that write (a recorder race, fixed in the same commit; the sibling now creates the directory). Steps 2–5 carry the finding.
- Removed from the real `~/.claude/projects`: `-tmp-fgos-work-mailbox-v3-record-claude-ladder-sum-ws` (1 file). Evidence: `.fgos/runtime/tmp/mailbox-v5/evidence/p2b/` (gitignored). The Codex auth guard passed before and after.
