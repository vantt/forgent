# Mailbox V4: live Claude Code suite through the test-only hook entry

Date: 2026-10-22, Asia/Saigon. Branch `mailbox/v1-v3`. Plan: `plans/261022-1501-mailbox-v4-claude-live-end-to-end/` phase 8. Harness: `test/live/mailbox-claude.live.mjs`; entry: `packages/mailbox/rust/store/examples/mailbox-test-hook.rs` (release build). Claude Code 2.1.308 before and after every case (listed in `testedAgainst`), `claude -p --model haiku`, topology `one-shell-hop` (phase 2 probe).

## Spend

| Case | CLI invocations | Re-run | Result |
|---|---|---|---|
| L1 registration, inbox, mid-step, send, stop gate | 1 | no | **failed**: the scripted steps did not run (two findings below); registration and the hook detector observed |
| L1, redesigned (plan owner's decision 1) | 1 | **yes, re-run** | **passed**, every check |
| L2 a skipped Stop hook is detected, its mail stays recorded | 1 | no | passed |
| L3a output size, `PostToolUse` `additionalContext` | 1 | no | **shortened** at every step (finding) |
| L3b output size, `Stop` `reason` | 1 | no | not shortened at any step |

Phase 8 spent 5 `claude -p` invocations: the 4 planned and the one L1 re-run the plan owner authorized. With phase 2's 5 (Claude 4, Codex 1), V4 has spent 10 live CLI invocations so far.

Before any spend, `node test/live/mailbox-claude.live.mjs check` passed: versions (Claude 2.1.308, Codex 0.161.0 listed), the managed-settings preflight, the release build, the wrapper-wins check (`zsh -ic 'whence -w fgos; whence -p fgos'` printed `fgos: command` and the case's `bin/fgos`), and a dry run of all four cases against the stub CLI, every check passing. The first `check` attempt found a harness bug (bindings are an object keyed by writer in the snapshot), and an orphaned stub from that crashed attempt wrote into the next attempt's log; the harness now ends its CLI when it exits. None of this spent a model call.

## L1, first run (1 invocation): failed

Evidence: `result.json` checks, the entry's log, the transcript's record types (quoted as types, not text).

- **Version pin:** 2.1.308 before and after.
- **Registration: passed.** The first `post-tool-use` outcome is quiet `NothingEligible` with the state written; the snapshot holds one binding for the session, named `mbxlive-claude-af` (the own two characters from the session file's derived name).
- **Wrapper reached: failed.** `tool-fgos.txt` reads `fgos is a shell function from ~/.claude/shell-snapshots/snapshot-zsh-<n>.sh`. **Finding 1:** Claude Code's Bash tool sources a shell snapshot it takes at session start, and that snapshot still defines the owner's `fgos` zsh function although the CLI ran with `ZDOTDIR` at an empty directory. The `zsh -ic` wrapper-wins check does not reproduce how Claude Code builds its snapshot, so it passed while the model's shell would have called the real `fgos`. The snapshot file was gone after the session.
- **Step 2 never ran.** The transcript's second tool result is `<tool_use_error>Blocked: sleep 25 followed by: fgos mailbox inbox. To wait for a condition, use Monitor with an until-loop …</tool_use_error>`. **Finding 2:** Claude Code 2.1.308 refuses a Bash command that starts with a long `sleep` followed by another command. The model then ended its turn with a question instead of steps 4 and 5.
- **Hook ran:** one `post-tool-use` `enter` line (a blocked tool call fires no `PostToolUse`) and one `stop` `enter` line, quiet `NothingEligible`; no Stop continuation. Corroborated by the transcript (two Bash `tool_use` records, no `hook_blocking_error`).
- **Not observed:** `inbox` read-only, mid-step, stop gate, `send` (M1 was never sent, because the harness stops when the wrapper is not reached).
- **Probe data for V5** (`tool-proc.txt`, `tool-env-names.txt`): a tool command's process chain is `zsh` → `claude` → `timeout`; the hook's is `node`/entry → `sh` (dash) → `claude`. Variable names only the tool sees: `CLAUDE_CODE_EXECPATH`, `GIT_EDITOR`, `LOGNAME`, `OLDPWD`, `SHLVL`, `_`; only the hook sees `CLAUDE_PROJECT_DIR`. So an entry started from a tool's shell sits under one shell hop exactly like a hook entry, with a different shell (`zsh` against `sh`): the caller check with `zsh` among the hop shells does not tell them apart. This is the discriminator search the plan hands to V5; nothing was changed.

The plan owner decided a redesign and one re-run (below).

## L1 re-run (1 invocation, authorized by the plan owner): passed

What changed, in the test harness only (`test/live/mailbox-claude.live.mjs`, `scripts/lib/mailbox-live-cli.mjs`):

- **The wait.** Claude Code's own refusal of the first run said: "To wait for a condition, use Monitor with an until-loop (e.g. `until <check>; do sleep 2; done`) … Do not chain shorter sleeps to work around this block." Step 2 is now `until [ -f go.txt ]; do sleep 2; done; fgos mailbox inbox`, and the harness writes `ws/go.txt` once M1 is recorded (or at once when it stops early). It is a real tool call with no network.
- **The `fgos` function.** The Claude Code 2.1.308 binary's snapshot code picks the rc file as `join(os.homedir(), ".zshrc")` (`.bashrc` for bash, else `.profile`), read from the binary without a model call; `ZDOTDIR` is not consulted, and the owner's `~/.bashrc` also sources the fgos shell integration, so switching the shell would not help. Each real case now runs with `HOME=<case>/home`, holding only a symlink `.claude` → the real `~/.claude` (credentials, session files and transcripts stay the real ones; a refresh writes through the link). Measured without a model: `claude auth status` under such a `HOME` reports logged in, and Claude Code creates its own `.claude.json` there. The harness checks after each case that the link is intact. The wrapper-wins check now sources `$HOME/.zshrc` under the case `HOME`, as the snapshot does.
- **The stub** now refuses a command that starts with `sleep N` followed by another command and runs the others in a shell built from `$HOME/.zshrc`, so a dry run reproduces both measured behaviours. `check` passed again (all four dry cases) before the re-run.

Results (all checks passed): version 2.1.308 before and after; `tool-fgos.txt` names the case's `bin/fgos`; two Bash tool calls, one Stop continuation, `enter` lines 2 `post-tool-use` and 2 `stop`; registration quiet `NothingEligible` with the state written, binding `mbxlive-claude-e3`; step 2's tool result lists M1 with `state=recorded` (the wrapper log shows the read-only `inbox` call, exit 0) and M1's injected frame says `attempt="1"`; M1 sits in a `hook_additional_context` record, the first `FINAL:` line holds `MBX-MID-…` and M1 ends `offered`; M2 was recorded 9 ms after M1's claim line and claimed at the Stop 3.7 s later, the Stop continuation (`hook_blocking_error`) carries its frame, the next Stop is quiet `NothingEligible`, the last `FINAL:` line holds both tokens, M2 ends `offered` and the binding's Stop-block count is 0; M1's answer ends `queued: it sees it at its next tool call.` and M2's `queued: it sees it at its next tool call or when its turn ends.` The tool's process chain again reads `zsh` → `claude` → `timeout`.

## L2 (1 invocation): passed

- `settings.json` had `PostToolUse` in the nested shape and `Stop` flat. Claude Code exited 0 and wrote to stderr: "These settings entries were skipped; the rest of each file is in effect: …settings.json (hooks.Stop.0): Hook matcher "hooks" must be an array of hook entries; received undefined; matcher ignored." So the skip is announced on stderr, not silent, and does not disable the other hooks.
- Registration happened at the `post-tool-use` hook (quiet `NothingEligible`, state written); the harness then sent one `wake` message.
- **Detector:** the turn ended (an assistant answer, exit 0) while the entry's log has no `stop` `enter` line, so the detector reports "Stop hook did not run". The dry run proved its "ran" branch.
- **Retention:** the message is still `recorded` in the snapshot after the CLI exited (not lost; it waits for a checkpoint or its TTL).

## L3a and L3b (1 invocation each): the output-size ladder

Full size `S` = queue.cap (50) × (maxBodyBytes (16384) + 3) + queue.cap (50) × F (1547) = **896,700 bytes**, F being the bytes of `[message]` and `[message.reply]` with every header placeholder filled to `frame.maxHeaderChars` (200). The bound entity escaping of `<`, `>`, `&` could reach (every body byte becoming 5) is computed, not measured: 50 × (5 × 16384 + 3) + 50 × 1547 = 4,173,500 bytes. Ladder: S/64 = 14,010, S/16 = 56,043, S/4 = 224,175, S = 896,700 bytes, plain ASCII words, each step opening with `L3START<n>X` and ending with `L3END<n>X`.

**L3a, `PostToolUse` `additionalContext`: shortened at every step.** Each `hook_additional_context` record held 2,291 to 2,292 bytes: `<persisted-output>` / `Output too large (13.7KB). Full output saved to: ~/.claude/projects/<workspace>/<session>/tool-results/hook-<tool use id>-<n>-additionalContext.txt` / `Preview (first 2KB):` and the first 2 KB of the text, then `</persisted-output>`. No end canary reached the model; it answered `CTX-END: left` four times (the last word of a later system reminder) and said it saw a persisted block. **Finding 3:** Claude Code 2.1.308 moves an `additionalContext` of 14,010 bytes or more to a file and gives the model a 2 KB preview; the threshold lies below 14,010 bytes and was not bracketed (the ladder's lowest step already exceeded it). A mid-step drain therefore reaches the model whole only while its output stays under that threshold: V5 needs an output cap for `PostToolUse` at or below a measured threshold, or one frame per drain.

**L3b, `Stop` `reason`: not shortened.** Each Stop block's "Stop hook feedback" record was the reason plus its 20-byte prefix (14,030; 56,063; 224,195; 896,720 bytes), every one held its end canary, and the model answered `STOP-END: L3END0X` through `STOP-END: L3END3X`; the fifth Stop was quiet and the CLI exited 0 after 35 s. The model naming the end canary shows the end reached it; it does not prove every middle byte was read.

## Not proven here, with owner

- The threshold of finding 3 (not bracketed).
- Spec §11 items 3, 4 (live TTL), 5, 8 and 9: as the plan states, owned by later rungs.
