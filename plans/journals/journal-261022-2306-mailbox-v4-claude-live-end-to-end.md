# Journal: Mailbox V4, Claude Code live end to end, 2026-10-22

## What happened

- V4 was built on `mailbox/v1-v3` in ten phases: the hook shell, the Claude Code head finder and caller check, `send` and read-only `inbox`, a test-only cargo example as the hook entry, the mailbox root hidden from blind workers, and a live suite with two-session demos. 18 live CLI processes in all.
- The first live L1 failed outside the mailbox: Claude Code refused `sleep 25; fgos mailbox inbox`, and the model's shell still defined the owner's `fgos` function. After a redesign of the harness only, the one authorized re-run passed every check.
- The owner watched two sessions flirt in Vietnamese through the mailbox in two herdr panes. Claude to Claude completed; Claude to Codex delivered three turns and then waited at an idle Codex until the owner stopped it.

## Lessons

- **Read the refusal text.** Claude Code's own refusal named the allowed shape (`until <check>; do sleep 2; done`); the harness now writes the file the loop waits for, so every hop is triggered by the record, not a timing guess.
- **`ZDOTDIR` is not the lever.** Claude Code builds its shell snapshot from `join(os.homedir(), ".zshrc")`, read straight from the binary without a model call. A run `HOME` holding only a link to `~/.claude` keeps the owner's shell functions out and the login in.
- **A dry run must reproduce the measured CLI behaviour.** The stub passed while the real CLI refused; the stub now refuses the same commands and builds its shell the same way.
- **A crashed harness must end its CLI.** An orphaned stub from a crashed `check` wrote into the next run's log; the harness now ends its child on exit.
- **`pgrep -f` matches text, not processes.** Another session's three-hour wait loop held every live case back; the heavy-gate check now reads each process's own argv.
- **Herdr places a new tab in the focused workspace**, ignoring `HERDR_WORKSPACE_ID`; measured on a separate session (`herdr --session <name> server`), never on the owner's.
- **Idle is the real limit.** In print mode both CLIs ran every step; in panes, interactive Codex ended its turn early and a reply without wake waited at an idle recipient. That is the wake channel's job at a later rung.
- **Size matters per channel.** Claude Code moves a 14 KB `PostToolUse` context to a file with a 2 KB preview, while an 897 KB Stop reason arrived whole; V5 needs a bound for the context channel.
