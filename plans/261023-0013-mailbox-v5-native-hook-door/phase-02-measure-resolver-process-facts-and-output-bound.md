---
phase: 2
title: "Measure first: resolver cost, process facts, output bound"
status: pending
priority: P1
effort: "5h"
dependencies: [1]
---

# Phase 2: Measure first

## Goal

Before any product code exists, get the facts that phases 3–6 encode:

- why `resolve_workspace_root` is not used on the hook path (the child processes and writes it causes; plan decision 3), and where a hook's cwd points after a tool's `cd`;
- what tells the hook's shell apart from a tool's shell in each CLI;
- the Codex head's executable;
- the largest `PostToolUse` context each CLI injects inline.

## Context

- Decisions 3, 5, 6, 7, 8 and 14 of `plan.md` depend on this phase's numbers. Nothing here is product code.
- The V4 probe measured the following (`plans/reports/research-261022-1751-mailbox-v4-hook-process-probe.md`):
  - **Claude Code 2.1.308:** hook process → `sh` (exe `dash`) → `claude`.
  - **Codex 0.161.0:** hook process → `codex` (comm and exe `codex`).
  - **A Claude tool command** runs under `zsh` → `claude`, so the one-shell-hop check passes it too (spec §17, V4 live decision 3).
- V4 L3a found that Claude Code moves a context of **14,010 bytes or more** to a file. The threshold below that was never bracketed.
- Report: `fgos convention path --kind report --type research --slug mailbox-v5-measurements` (run from `/home/vantt/projects/forgent`; copy the printed path, do not build it).

## Steps

### A. Why not `resolve_workspace_root` (evidence for plan decision 3; no CLI, no live spend)

1. Under `.fgos/runtime/tmp/mailbox-v5/resolver-probe/`, make a scratch cargo crate. It is never committed. It depends by path on `packages/distribution/rust` and calls `resolve_workspace_root(&cwd)` once per process. Run it from a scratch repo's linked worktree:
   - under `strace -f -e trace=execve,openat,rename,mkdir -c` with a fresh `XDG_STATE_HOME`;
   - again with a different `PATH`;
   - again with `HOME` unset.

   Record the child processes per call, the files created or replaced under the state root, and the p50/p95 over 50 fresh processes.
2. This documents red-team finding RT1 with numbers. It changes no decision: the hook path uses the disk-only read built in phase 6. Phase 6 measures that read's own cost.

### B. Live probes (5 invocations, each once, benign prompts)

Use the recorder `scripts/record-mailbox-hook-fixtures.mjs` and the shared guards in `scripts/lib/mailbox-live-cli.mjs`:

- allowlisted environment, isolated `HOME` linking `~/.claude`;
- for Codex, the `auth.json` symlink with the login-status guard and the replaced-auth set-aside (V4 fix M2);
- `timeout 300`, a run directory outside every checkout;
- the spawn marker;
- a dry run against the stub CLI first, every time.

Extend the recorder only where a mode below needs it. Each extension is a recorder change with its own dry-run proof.

**The hook command uses the product form.** In P1–P5, the dump or ladder hook is an executable (a `#!/usr/bin/env node` script) placed at `<run>/project/.fgos/installation/bin/fgos`. It is referenced by the exact command string the product installer writes:

- Claude: `"${CLAUDE_PROJECT_DIR}/.fgos/installation/bin/fgos" hook mailbox --cli claude --event <e>`;
- Codex: `shimCommand`'s quoted absolute path plus the same arguments.

The CLI then spawns it exactly as it will spawn the real shim in phase 8, and the measured topology is the product's. The real shim `exec`s the host, which keeps the pid and the parent, so the topology carries over. Phase 8's C1 and L1 confirm it with the real host.

5. **P1, Claude print-mode process probe.**
   - The hook command is the recorder's dump hook, which already writes `<n>-<event>.proc.json`. Extend that file with, for the entry's parent and grandparent:
     - `exe` (the `fgos_process::facts::view_of` field, read in Node as `readlink /proc/<pid>/exe`);
     - `comm`;
     - `tty_nr`, `session` and `pgrp` (from `/proc/<pid>/stat`);
     - whether fds 0, 1 and 2 are a tty, and what kind each is (pipe, file, tty).
   - For the hook's shell, also record `cmdline` (argv[0] is the path the CLI invoked, for `hookShell`), `realpath(/bin/sh)`, and the hook process's cwd and whether `CLAUDE_PROJECT_DIR` is set.
   - In the same run, the prompt asks the model to:
     1. run one Bash command, `node <run>/dump-ancestry.mjs`;
     2. run `cd <run>/elsewhere` (a directory the harness made);
     3. run the dump again;
     4. make one more trivial tool call.

     That script writes the same facts, plus its cwd and whether `CLAUDE_PROJECT_DIR` is set, for itself and its parent chain to `tool-<n>.proc.json`. The hook after the `cd` shows whether a hook's cwd follows the model's `cd` (plan decision 3).
   - Expected: about 2 hook calls and 1 tool dump.
6. **P2, Claude interactive probe.**
   - The same hook and the same one tool command, in an interactive `claude` started in a herdr pane, the way V4 D3 did it: through Terminal Control's internal route with the installed host, `env -i` with the allowlist, the pane kept with `retain`.
   - The prompt is typed once by the harness, and the pane is closed after the dumps appear.
   - This answers whether the hook's `sh` and the tool's `zsh` differ in tty or session when a terminal exists.
7. **P3, Claude `PostToolUse` context ladder.**
   - The ladder hook prints, per Bash tool call, `additionalContext` of exactly these sizes: 2,048; 4,096; 6,144; 8,192; 9,216; 10,240; 11,264; 12,288; 13,312; 14,009 bytes. That is one size per tool call, 10 calls; the prompt asks for 10 trivial `echo` calls. No waits are needed.
   - **Then 4 `Read` calls** of a small file repeat the four largest inline sizes, with a **sibling `PostToolUse` hook** (matcher `Read`) that emits a fixed 2,048-byte context. This tells whether the threshold is per hook or summed across the hooks of one event (plan decision 6).
   - Also record whether non-ASCII text changes the verdict: step 8 uses a body of 3-byte UTF-8 characters with the same byte length.
   - Each text opens with `L5START<n>X` and ends with `L5END<n>X`.
   - Read the transcript: a step is inline when its `hook_additional_context` record holds the whole text, and moved when it holds a `<persisted-output>` block.
   - The bound is **the largest inline step**. Report the resolution (1,024 bytes) honestly; do not interpolate.
8. **P4, Codex process probe** (`codex exec`, `--dangerously-bypass-hook-trust` in the controlled `CODEX_HOME`).
   - The same dump hook, tool commands and `cd` sequence as in P1.
   - **Command forms:** the `Stop` row uses the guarded shell form of plan decision 14, and the `PostToolUse` row uses the plain `shimCommand` form. This shows in one run whether Codex runs a hook command through a shell (the guard works) or directly.
   - Record the head's full exe path and basename.
   - Record how Codex runs a tool command (which shell, which parent), to confirm that a Codex tool process cannot sit at the `direct` head position as a non-shell child of `codex`. If it can (for example Codex execs the tool directly), write that down: the M4 exe check then does not separate a tool from a hook, and the residual is stated.
9. **P5, Codex `PostToolUse` context ladder.** The same ladder as P3, including the sibling-hook repetition, read from the rollout file. In the V3 recording, the nested `hookSpecificOutput.additionalContext` was found in the rollout's developer message. Bound: the largest step that reached the model input whole.

### C. Write the report, then decide

10. Write the research report with these tables:
    - (a) `resolve_workspace_root`: child processes, writes and p50/p95 per call (the RT1 evidence);
    - (b) per CLI and mode, the facts of hook-parent vs tool-parent (exe, cmdline[0], comm, tty, session, fds), and the hook cwd and `CLAUDE_PROJECT_DIR` before and after the tool's `cd`;
    - (c) Codex head exe and start order;
    - (d) the two ladders with the inline/moved verdict per step, per-hook vs summed, and the non-ASCII step;
    - (e) **the values phase 3 writes**: per CLI `hookTopology`, `hookShell`, `headExecutables`, `postToolUseContextMaxBytes` (with the margin rule of plan decision 6 applied), and whether Codex accepts the guarded command form;
    - (f) **the discriminator rule chosen** (plan decision 7) and its residual.
11. Copy the raw `.proc.json` files under `.fgos/runtime/tmp/mailbox-v5/evidence/p2/` (gitignored). Clean the run directories with the recorder's `clean` (never delete a set-aside `auth.json`). For P1–P3, report and remove `~/.claude/projects/<encoded run dir>` (review H2 item 3), listing what was removed.
12. Run `fgos convention check --dir . -- <report path>` and commit the report (and any recorder change, with the census). Merge main, push.

## Verification

- The report exists, holds all six tables, and passes `fgos convention check`.
- The live count is 5; the report lists every spawn marker.
- Every number phase 3 writes points to a row of this report.

## Risks

- A CLI auto-updates mid-phase. `DISABLE_AUTOUPDATER=1` is in the allowlist; the version is checked before and after each run, and a changed version stops the phase.
- P2 needs a herdr session. If herdr is not available, report P2 as not run and choose the discriminator from P1 alone, with a stated limit ("interactive mode not measured").
- The ladder's model forgets a step. The verdict comes from the transcript record, not from the model's answer, so a forgotten step is still measured.

## Notes

_Filled during the phase._
