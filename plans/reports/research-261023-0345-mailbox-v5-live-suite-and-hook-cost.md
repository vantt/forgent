# Mailbox V5: the live suite through the product door, and the hook cost inside each CLI

Date: 2026-10-23, Asia/Saigon, machine `fg-server`. Branch `mailbox/v1-v3`. Plan: `plans/261023-0013-mailbox-v5-native-hook-door/` phase 8. Harness: `test/live/mailbox-claude.live.mjs` (rebuilt around the product door in `83e9f04c1`). Host under test: commit `83e9f04c1`, the release build of `apps/fgos`. Versions: Claude Code 2.1.308, Codex 0.161.0, unchanged before and after every run.

## Summary

- **L1** (Claude Code) and **L2** (Claude Code, wrong-shape Stop row) passed every check through `fgos hook mailbox` and `fgos mailbox …` behind the shim.
- **C1** (Codex) passed registration from the payload, an inline mid-step frame and the model's own `fgos mailbox send`; the Stop check was **not observed**: the wake message arrived after Codex's Stop (a harness timing gap, fixed after the run, not re-run).
- **T1/T2**: the steady no-mail `PostToolUse` hook p95, measured inside each CLI under strace, was **68.4 ms** (Claude Code, N = 99) and **78.1 ms** (Codex, N = 99), against the 50 ms target. One cost dominated: the workspace shim's helper programs (p50 31–34 ms per call). Owner question 3's default (a) was applied: the shim now runs no helper program (`dc8e92240`). Outside the CLI, the same hook through the new shim measured p95 **3.4 ms** against 51.4 ms through the old one. The in-CLI re-measurement needs two more live runs, beyond the plan's ceiling of 12: it waits for the controller.

## Runs (live CLI invocations: 5)

Each once, no retry, each preceded by its dry run against the stub (`check`); memory ≥ 8 GB and no heavy gate running before each; benign content only.

| Case | CLI | Spawn marker (UTC, 2026-10-22) | Exit | Wall time | Result |
|---|---|---|---|---|---|
| L1 | `claude -p` haiku | 20:27:16Z | 0 | 15.2 s | every check passed |
| L2 | `claude -p` haiku | 20:27:40Z | 0 | 5.7 s | every check passed |
| C1 | `codex exec` | 20:27:55Z | 0 | 13.7 s | stop gate not observed |
| T1 | `claude -p` haiku, under strace | 20:28:33Z | 0 | 121.7 s | p95 68.4 ms > 50 ms |
| T2 | `codex exec`, under strace | 20:31:21Z | 0 | 280.8 s | p95 78.1 ms > 50 ms |

Phase total with phase 2's 7: **12**, the plan's ceiling. Codex's login guard passed before and after both Codex runs (link intact, `codex login status` ok, nothing set aside). Evidence: `.fgos/runtime/tmp/mailbox-v5/evidence/p8/<case>/` (gitignored): `result.json`, the snapshot, the rollouts, the traces.

Removed from the real `~/.claude/projects` after each Claude Code case (named in each `result.json`): `-tmp-fgos-work-mailbox-v5-live-L1-project` (2 files), `…-L2-project` (2 files), `…-T1-project` (2 files).

## How each case ran (product mode)

Each case is a fresh git repository `<case>/project/` with `.fgos/`, holding:

- a copy of the shim at `.fgos/installation/bin/fgos`;
- an `activation.json` with `status: ready` and `releasePath: <case>/release`;
- `<case>/release/bin/fgos`, the branch-built host.

The hook rows are the product installer's (`installClaudeHook` / `installCodexHook` from `src/setup/agent-hooks.mjs`), with their `PreToolUse` guards removed: those need the legacy-node payload, which the private release does not stage. For Claude Code the rows are moved to `<case>/settings.json` and passed with `--settings`; for Codex they become the run's `CODEX_HOME/hooks.json`. The shim's directory is first on the CLI's `PATH`, so the model's own `fgos mailbox …` reaches the same shim. No shared activation, `~/.fgos` or `fgctl` was touched.

**Deviation from spec §14 V5, verbatim:** "the V4 live suite through the shim" ran as the same shim bytes over a release that is never activated anywhere. The five runs above used a byte copy of the main checkout's shim (sha256 `02c9c5d5c40c…`). Since `dc8e92240` the suite lays out the shim this branch's `fgctl` writes, from its generator (`examples/print-workspace-shim.rs`).

## Cases

### L1, Claude Code (every check passed)

| Check | Evidence |
|---|---|
| The model's `fgos` is the case shim | `tool-fgos.txt`: `fgos is …/L1/project/.fgos/installation/bin/fgos` |
| The first hook registers the head | binding `project-claude-2e` |
| `inbox` lists without change | step 2's tool result: `<id> message from=unregistered_mailbox_ state=recorded offers=0` |
| A message sent during a tool reaches the next `PostToolUse` **inline** | the transcript's `hook_additional_context` holds the whole frame (closing tag present, no `persisted-output`); state `offered`; the token is in the final answer |
| `inbox --claim` | step 3's tool result holds the frame; state `offered` |
| A wake message after the last tool is taken at Stop | the Stop reason carries it; state `offered`; the token is in the final answer; `stop_blocks` back to 0 |
| `send`'s tier sentences | M1: "queued: it sees it at its next tool call."; M2 (wake): "… or when its turn ends." |

### L2, Claude Code, Stop row in the wrong shape (every check passed)

| Check | Evidence |
|---|---|
| The installer's own check names it | `.claude/settings.json missing canonical hook(s): dispatch-decide, decision-question, mailbox Stop (in a shape Claude Code does not read: mailbox Stop) — run fgos doctor --fix` |
| The PostToolUse row still registers | binding `project-claude-23` |
| The Stop hook did not run | no Stop continuation in the transcript; CLI exit 0 |
| The wake message stays recorded | state `recorded` |

### C1, Codex

| Check | Result | Evidence |
|---|---|---|
| Registration from the payload's `session_id`, head at the Codex executable | pass | binding `project-codex-5d`; its handle is its session key |
| Mid-step delivery inline | pass | the rollout's developer message holds the whole frame; state `offered` |
| The model's own `fgos mailbox send` is recorded, from the Codex head | pass | a message to the stand-in peer, `from` the Codex binding |
| Wake message taken at Stop | **not observed** | M2 recorded 12.7 s after launch; Codex had already written its one-line final answer and fired Stop; M2 stayed `recorded` |

The stand-in peer was registered through the product hook: this harness process acted as a Claude Code head with a session file, and the hook ran below `/bin/sh`. Its session file was removed right after.

Fix after the run (`test(mailbox): give the Codex case a long final answer…`): C1 now writes the integers from 1 to 400 before its FINAL line, as L1 does, which widens the gap between the last tool and Stop. Not re-run (ceiling). The Codex Stop shape itself is owned at store level (`tests/hook_payloads.rs`, recorded Codex fixtures).

### T1 and T2, the hook cost inside each CLI

Each case had 100 trivial `echo` calls, then a wait for the harness, then one `wake:false` message larger than the step bound (held back, so the pointer line printed each call), then 20 more calls and one Stop.

Each hook call was timed from the `execve` of its outermost process to that process's `exit_group`, in an `strace -f --seccomp-bpf -e trace=execve,exit_group` of the CLI:

- Claude Code: the `/bin/sh -c` of the installed row;
- Codex: the user's `$SHELL -c`, which execs the shim.

The first PostToolUse call (registration) is reported apart, and so are the calls after the held-back message.

| CLI | Steady no-mail PostToolUse (N) | p50 | p95 | max | Registering call | After held-back mail (N, p50 / p95) | Stop |
|---|---|---|---|---|---|---|---|
| Claude Code 2.1.308 | 99 | 57.5 ms | **68.4 ms** | 74.0 ms | 32.4 ms | 21, 32.8 / 58.7 ms | 28.5 ms |
| Codex 0.161.0 | 99 | 57.6 ms | **78.1 ms** | 86.9 ms | 39.8 ms | 22, 69.4 / 79.0 ms | 45.8 ms |

**Status against `mailbox.hook.p95TargetMs` (50 ms): missed in both CLIs**, with the old shim and under strace.

Where the time went, per call, from the same traces:

| Part | Claude Code p50 / p95 | Codex p50 / p95 |
|---|---|---|
| CLI's shell until the shim starts | 1.2 / 2.4 ms (`/bin/sh`) | 7.2 / 10.3 ms (`zsh -c`, the user's login shell) |
| **Shim until the host starts** | **30.6 / 41.7 ms** | **33.7 / 45.2 ms** |
| Host until exit | 21.5 / 28.2 ms | 21.6 / 29.1 ms |

At p95, calls with held-back mail were no slower than steady ones (58.7 against 68.4 ms; 79.0 against 78.1 ms), so the pointer line adds nothing the p95 shows. Codex's p50 was higher with held-back mail (69.4 against 57.6 ms), inside the spread the shim and the machine's load give.

In T2, Codex's model ran `fgos mailbox inbox --claim` right after the first pointer line ("1 message(s) too large for this channel are waiting; read them with: fgos mailbox inbox --claim"). The message was then `offered`, through the designed path; the harness's "held back" check expected `recorded` and so reads as failed. The pointer line led the model to the claim command on its first appearance.

## Outside the CLI (no model, no spend)

`node test/live/mailbox-claude.live.mjs cost 200 <main|branch>` ran 200 hook calls after one registering call. Each used the recorded Claude Code `PostToolUse` payload, through the installed command, `/bin/sh -c` below a head with a session file. It then ran the same calls against the host without the shim. Labelled "outside the CLI": never the number checked against the target.

| Shim | Registering call | Via shim p50 / p95 / max | Host without shim p50 / p95 | One call under strace: shell + shim |
|---|---|---|---|---|
| main checkout's (`dirname`, `sed`, `head`, `tr`) | 29.9 ms | 9.8 / **51.4** / 62.7 ms | 2.5 / 11.5 ms | 16.3 ms |
| this branch's (builtins only, `dc8e92240`) | 19.8 ms | 3.0 / **3.4** / 3.6 ms | 2.4 / 2.7 ms | 3.2 ms |

An earlier `cost` run under heavier machine load gave, through the old shim, p50 29.4 / p95 58.0 ms and, for the host alone, p50 9.1 / p95 11.2 ms: the shim's share is the same.

## Owner question 3: what was done

One cost dominated: the shim, 31–34 ms of 52–63 ms per call at p50 under strace. Following owner question 3's default (a), as the controller ruled, the shim was optimised through its owner, `fgos_distribution::shim` (`dc8e92240`, with test fixes in `72042d720`; for DIST review). The shim now:

- finds its own directory with parameter expansion;
- reads `activation.json` with a `read` loop and builtins;
- `exec`s the entry.

Behaviour is kept:

- the first matching line wins;
- spaces and trailing commas are accepted;
- `\r` inside a value is dropped;
- backslashes become slashes and repeated slashes collapse;
- the four refusal messages and exit 3 are the same.

The one change: a line ending in a carriage return now matches; before, it never did.

Owning tests in `shim.rs`:

- `the_sh_shim_reads_activation_and_execs_the_entry_with_only_shell_builtins`: an empty `PATH` still reaches the entry;
- `the_sh_shim_normalises_the_release_path_and_refuses_what_it_cannot_run`.

Four hand mutants were killed.

Consequence: workspaces whose shim was written by an older `fgctl` see `check_workspace_shims` report it as different until `fgctl repair` rewrites it. That happens only when a release carrying this change is activated, which V5 does not do.

**Still open:** the in-CLI p95 with the new shim. Expected from the split above:

- Claude Code: shell 2 ms + shim about 1 ms + host 28 ms, about 31 ms at p95 under strace;
- Codex: about 40 ms.

Confirming it takes one T1 and one T2 re-run (2 invocations, total 14 > ceiling 12), which only the controller can authorize. Until then V5's hook-cost acceptance stays open (DONE_WITH_CONCERNS).

## Limits

- One run per CLI: N ≥ 80 bounds the p95 within one session, not across sessions or machines.
- strace slows the CLI and its children. The in-CLI numbers include its cost, and the outside-the-CLI numbers are given beside them.
- The machine's load varied between runs (another session's test suite ran earlier the same hour). The outside-the-CLI host numbers moved from p50 9 ms to 2.4 ms between two runs.

## V6 precondition (review H2), verbatim

"V6 must not run adversarial or untrusted peer content until the live harness runs the CLI confined (bwrap with the case directory writable and `~/.claude` limited to what the CLI needs) or without permission bypass, and cleans `~/.claude/projects/<case>` after each case (review H2)."
