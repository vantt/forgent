---
phase: 8
title: "Live Claude Code suite"
status: pending
depends_on: [2, 3, 7]
live_calls: 4
---

# Phase 8: Live Claude Code suite

## Why

Spec §11 (the live suite, chosen by name, never in `npm test`) and the §14 V4 row: stop gate, mid-step, the hook really ran, `send`, `inbox`, and the output-size measurement, on a real Claude Code, through the test-only entry.

§11 items V4 does not run, with their owner: item 3 idle wake (no wake channel; V7 with the Claude scoped socket and `codex queue`), item 4 no silent loss under the TTL notice (the core proves the sweep and the notice; a live TTL run needs `record.ttlSec` of real time, so V6/V7; L2 below shows only that mail to a head whose Stop hook was skipped stays `recorded`), item 5 no side effects (the first slice types nothing), item 8 runner workers (V5), item 9 subordinates (proven on recorded payloads at V3, not re-spent here). <!-- Updated: red-team - item 4 owned -->

## Files

- Create `test/live/mailbox-claude.live.mjs` (Node built-ins only; imports `scripts/lib/mailbox-live-cli.mjs` from phase 2; never discovered by `npm test`, which runs only `*.test.mjs`). Subcommands:
  - `check` (no model call), refusing with exit 3 on any failure:
    - `free -g` available ≥ 8, and no `cargo` or `npm test` process running (`pgrep -f`);
    - `claude --version` and `~/.local/bin/codex --version` are in `testedAgainst` (spec §11 item 7);
    - the managed-settings preflight;
    - the example builds once, `CARGO_BUILD_JOBS=4 cargo build --release -p fgos-mailbox --example mailbox-test-hook`, path from `cargo metadata --format-version 1 --no-deps` `target_directory` (honours `CARGO_TARGET_DIR`);
    - **the wrapper wins in the model's shell**: under the exact case environment below, `zsh -ic 'whence -w fgos; whence -p fgos'` prints `fgos: command` and the case's `bin/fgos`. In the owner's shell `fgos` is a zsh function from `~/.zshrc` (`source …/scripts/fgos-shell-integration.sh`, lines 460–471) and `~/.zshrc` prepends `~/.local/bin` again, so without isolation the model's Bash tool, which restores a snapshot of the user's shell, would call the real `fgos` (checked 2026-10-22: `zsh -ic 'whence -w fgos'` → `fgos: function`); <!-- Updated: red-team - shell function shadows the wrapper -->
    - **dry run of every case** (`--dry`): a stub `claude` (a Node script in the harness) reads the case's `settings.json` and fires its hooks in the case's order with the V3 Claude fixtures, the case's session uuid substituted, and runs the case's tool commands itself. Everything real except the model: the example, the record, the wrapper, the log, the harness's waits and checks. A dry case writes under `<base>-dry/` and costs nothing. <!-- Updated: red-team - dry run before any spend -->
  - `run L1|L2|L3a|L3b`, `demo D1|D2` (phase 9), `probe-hook` (L3's hook command), `report`.
  - Every case runs under `${TMPDIR:-/tmp}/fgos-work/mailbox-v4-live/<case>/` (outside every git checkout, checked as the recorder does). **Fixed-count guard:** the harness writes `<case>/spawned.json` immediately before it starts a real CLI and refuses a case whose `spawned.json` exists; a failure before that point (preflight, build, harness bug) leaves no marker and spends nothing. Every case re-runs the memory and process check of `check` first. <!-- Updated: red-team - guard counts spends, not attempts -->
- Modify nothing in `src/` or `bin/`.

### The run environment of every case

- **An allowlisted environment**, not the harness's own: `HOME`, `USER`, `LANG`, `TERM`, `XDG_RUNTIME_DIR` from the parent; `PATH=<case>/bin:<parent PATH>`; `SHELL=/usr/bin/zsh` (the owner's) with `ZDOTDIR=<case>/zdot` (an empty directory, so no user rc file defines `fgos` or reorders `PATH`); `DISABLE_AUTOUPDATER=1`. Nothing else passes: the harness itself runs inside a Claude Code session whose environment carries `CLAUDE_CODE_SESSION_ID`, `CLAUDE_CODE_MESSAGING_SOCKET`, `CLAUDE_CODE_MESSAGING_TOKEN`, `CLAUDE_CODE_CHILD_SESSION`, `CLAUDE_PID` and more (checked 2026-10-22), none of which a test CLI may inherit. Claude Code authenticates from `$HOME/.claude`, which the allowlist keeps. <!-- Updated: red-team - env allowlist, no auto-update -->
- **Version pin per case:** the CLI version is read before and after each case and both are written into `result.json`; a difference, or a version not in `testedAgainst`, fails the case.
- `claude -p --model haiku --dangerously-skip-permissions --setting-sources project --settings <case>/settings.json --session-id <fresh uuid> <prompt>`, cwd `<case>/ws`, under `timeout 300`, exit status read right after the command. Every prompt and every message body is written by the harness; no third-party text reaches the model.
- `settings.json` (L1; L2 and L3 differ as stated): `PostToolUse` (matcher `*`) and `Stop`, each one command `<example> hook --cli claude --event <post-tool-use|stop> --fgos-dir <case>/.fgos --project mbxlive --topology <phase 2's> --log <case>/log/hook.log`, in the nested shape V3 recorded. The log lives outside `ws/`, the model's working directory.
- `bin/fgos`: a POSIX `sh` script. It accepts only `mailbox send …` and `mailbox inbox …`, **refuses (exit 2) any argument starting with `--fgos-dir`, `--log`, `--fault` or `--topology`**, runs `<example> <verb> --fgos-dir <case>/.fgos "$@"`, appends the argv, the exit status and the output to `<case>/log/fgos-calls.log`, prints the output and exits with the example's status; any other verb exits 2 with "test fixture: only fgos mailbox send|inbox". <!-- Updated: red-team - wrapper argument guard -->
- The harness's own sends run the example's `send` with the allowlisted environment, so they come from a sender with no head (no reply line in their frame, spec §5.5).
- Transcript: the harness finds `~/.claude/projects/*/<session uuid>.jsonl` (read-only, never deleted; the recorder's rule).
- Snapshot: read `<case>/.fgos/runtime/mailbox/record/snapshot.json` only between hooks for a binding name, or after the CLI exited (the install is an atomic rename, V2).

### What counts as evidence

The **transcript is primary**: an injected frame is proven by the record type V3 recorded (`attachment` of type `hook_additional_context` for `PostToolUse`; for `Stop`, the continuation with `stop_hook_active: true` and the reason text) and by the model's final answer containing the nonce. The entry's log (`enter` line first, outcome line last, `budget-exit` when the watchdog fired) and the snapshot corroborate; a check that only the log supports is reported as "log only". <!-- Updated: red-team - transcript primary -->

## Cases (one invocation each)

### L1: registration, `inbox`, mid-step, `send`, stop gate (1 call)

Prompt (exact):

```text
This is a test of a message hook. Do exactly these steps and nothing else.
1. Run this shell command once: type fgos > tool-fgos.txt; p=$$; for i in 1 2 3 4 5 6; do echo "$p $(cat /proc/$p/comm)"; p=$(cut -d' ' -f4 /proc/$p/stat); done > tool-proc.txt; env | cut -d= -f1 | sort > tool-env-names.txt; echo step1
2. Run this shell command once: sleep 25; fgos mailbox inbox
3. Do not run any other tool after step 2.
4. Write the integers from 1 to 400, separated by single spaces.
5. End with one line that starts with FINAL: followed by every token that starts with MBX- that a mailbox message asked you to include, separated by spaces, or FINAL: none
```

Harness, in order: start the CLI; wait (≤ 120 s) for the first `post-tool-use` outcome line (the registration); read `ws/tool-fgos.txt` and stop watching with "wrapper not reached" if it does not name `<case>/bin/fgos` (the case is then failed, its spend reported); send **M1** (`wake` false) "Please include the token MBX-MID-<8 hex> in your final answer. No reply is needed."; wait (≤ 120 s) for the `post-tool-use` outcome line that claimed M1; send **M2** (`--wake`) "Please include the token MBX-STOP-<8 hex> in your final answer. No reply is needed."; wait for exit.

Why M2 cannot be ordered by construction: a `PostToolUse` drain takes every pending message, `wake` or not (spec §6.1), and a `Stop` drain only `wake` mail, so the only way to show a Stop claim is a message recorded after the last tool's hook. The hook runs before the model's next request, the entry writes its outcome line just before it exits, and the harness sends M2 at once; the model must still receive a response and write 400 integers before its Stop. The harness records the delay from the M1-claim line to M2's `recorded`, and the time of the Stop, so the report shows the real margin. <!-- Updated: red-team - race stated with its margin -->

Checks written to `result.json`:

- **wrapper reached:** `tool-fgos.txt` names the case's `bin/fgos`.
- **hook ran:** the transcript shows two Bash tool calls and a Stop continuation; the log has two `post-tool-use` and at least two `stop` `enter` lines (corroboration).
- **registration:** the first outcome line is quiet `NothingEligible` with the state written; the snapshot has one binding for the session uuid, named `mbxlive-claude-…`.
- **`inbox` read-only:** step 2's tool result in the transcript lists M1's id with state `recorded`; M1's claim that follows is its first offer (`attempt="1"` in the injected frame).
- **mid-step:** M1 is in a `hook_additional_context` attachment after step 2; `FINAL:` contains MBX-MID; M1 is `offered`.
- **stop gate:** the Stop continuation carries M2's frame; the next Stop arrives with `stop_hook_active: true` and is quiet; `FINAL:` contains MBX-STOP; M2 is `offered`; the binding's Stop-block count is 0 at the end. If M2 was claimed at a `post-tool-use` instead (the model ran another tool), or arrived after the last Stop, the stop gate is **not observed** (failed), never "passed".
- **`send`:** M1's answer contains `queued: it sees it at its next tool call.`; M2's contains `queued: it sees it at its next tool call or when its turn ends.`
- **probe data for V5:** `tool-proc.txt` and `tool-env-names.txt` (names only) beside the hook's facts from phase 2.

### L2: a skipped hook is detected and its mail stays recorded (1 call)

`settings.json`: `PostToolUse` in the correct nested shape; `Stop` in a wrong shape (the entry flat, `{"type":"command","command":…}`, without the nested `hooks` array). Prompt: "Run the shell command `true` once, then answer done." The harness sends one `wake` message right after the `post-tool-use` outcome line (registration). Checks: the transcript shows the turn ended (a Stop happened) while the log has **no `stop` `enter` line**, so the detector reports "Stop hook did not run"; the message is still `recorded` in the snapshot (not lost; it waits for a checkpoint or its TTL, spec §11 item 4); the CLI's exit status and stderr are recorded as found (a silent skip and a loud settings error are both findings). The detector is the harness's function used by every case, so the dry run proves its "ran" branch and L2 its "did not run" branch on the real CLI. <!-- Updated: red-team - L2 registers first, proves retention -->

### L3a and L3b: output size, as a ladder (2 calls)

The question (spec §14 V4 row): does Claude Code shorten a `PostToolUse` `additionalContext` or a `Stop` `reason` of `queue.cap × maxBodyBytes` plus frame text? One context that large likely fills the model's window and may end the run with an error, so each run climbs a ladder and puts the full size last: a threshold is found even if the last step errors. <!-- Updated: red-team - size ladder -->

- **Full size** `S`, computed by the harness from the two contracts and written into `result.json` with its formula: `queue.cap × (maxBodyBytes + 3)` (the body gutter `| ` and a newline) `+ queue.cap × F`, where `F` is the bytes of the `[message]` and `[message.reply]` sections with every header placeholder filled to `frame.maxHeaderChars`. The body text is plain ASCII words (no entity expansion); the larger bound that entity escaping of `<`, `>` and `&` could reach is reported as computed, not measured.
- **Ladder:** `S/64`, `S/16`, `S/4`, `S`, each starting and ending with its own canaries.
- **Probe hook** (`probe-hook <event> <ladder file> <state file>`): prints the V3-recorded shape for the next ladder step and advances its state; L3a configures it on `PostToolUse` only, L3b on `Stop` only (block at each of the first four Stops, quiet after).
- **Prompts:** L3a "Run the shell command `true` four times, one call at a time. After each call write one line: CTX-END: followed by the last word of the additional context you received after that call, or none." L3b "Answer with the word ready. Each time you are given a reason to continue, answer with one line: STOP-END: followed by the last word of that reason, or none."
- **Checks per step:** the transcript record holding the injected text (type as V3 recorded), its length in bytes, whether it contains the end canary; any error text and the CLI's exit status; the model's line. Report per step: "not shortened", "shortened to N bytes", or "refused/errored".

## Steps

1. `check` (no model call), including the dry run of every case; fix the harness until every dry case passes.
2. Run L1, L2, L3a, L3b one after the other, each once, observable exit. Read each `result.json` and its evidence before the next.
3. Write the research report at `fgos convention path --kind report --type research --slug mailbox-v4-live-suite --json` (worktree): per case, what ran, the checks, the invocation count, every failed or not-observed check as such. Quote checks and record states, never raw transcript text; session ids appear as `<uuid>`, home paths as `~`, and accounts by role ("the Codex test account"). <!-- Updated: red-team - evidence redaction -->
4. **Before committing, scan** the report and every file to be committed: `rg -n -i 'sk-|ghp_|bearer|auth\.json|tetnu|/home/|[0-9a-f]{8}-[0-9a-f]{4}-' <files>` must print nothing that is not a placeholder; evidence copies stay under `.fgos/runtime/tmp/mailbox-v4/evidence/` (gitignored) and are never committed.
5. `fgos convention check --dir . -- <report> test/live/mailbox-claude.live.mjs scripts/lib/mailbox-live-cli.mjs`.
6. Commit (`test(mailbox): live Claude Code suite through the test-only hook entry`) the harness and the report; census; sync; push.

## Proof

The report, backed by each case's `result.json`. The phase is done when every case ran once and the report states its outcome truthfully; a failed check is a finding for the controller, not a reason to re-run.

## Risk

- The model ignores the script (extra tool, missing FINAL line): the check fails as "not observed"; no re-run without the controller.
- Rate limit or login expiry mid-case: the case fails; the controller decides about a re-run.
- L3 spends the most tokens of the rung: plan decision 14.
