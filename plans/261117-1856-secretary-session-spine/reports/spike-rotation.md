# Spike report: statusline sidecar timing and /clear via Terminal Control

Status: DONE. Measured 2026-11-17 on fg-server2, Claude Code 2.1.326, herdr server running, scratch `claude --settings <scratch.json>` sessions (haiku-5-5 for step 1/3, sonnet-5-5 for step 2/4), panes allocated, launched, driven and closed through the Terminal Control route. No source, hook or user settings were changed; scratch files are deleted.

## Method
- Pane path: `fgos internal terminal-control allocate | launch | send | read | release` (host binary `devhost-target/debug/fgos`). `src/terminal-control/client.mjs` has no `send` or `launch` wrapper (only allocate, attach, read, inspect, release), but the route has both ops, so the spike called the route directly with the client's envelope. Finding: a rotation executor needs `send` and `launch` added to the Node client, or must call the route as done here. No raw `herdr pane send-text` was used.
- Sidecar statusline: appended `{ts, session_id, context_window.*}` per refresh. Stop hook: logged the raw payload, then the last non-sidechain assistant `usage` sum (input + cache_read + cache_creation, deduped by `message.id`) from `transcript_path` and the newest sidecar record, at Stop and again 1.5 s later.
- 16 turns of varying length (one-word to ~12 bullet lines, plus one that started a background shell task). Turns 1-10 used the first hook version; turns 11-16 the version that re-reads at +1.5 s.

## Verdicts
| Mechanic | Verdict | Evidence |
|---|---|---|
| Statusline sidecar write lands before Stop fires | works, but stale by one turn: 10 of 10 (and 16 of 16) | A record existed before every Stop, age at Stop 0.6-4.9 s (typically 3.4-4.9 s). Its token sum equalled the previous turn's final usage in 9 of 9 comparable turns (turn 1 had no usage yet). The current turn's value arrived 0.29-0.36 s AFTER Stop in 10 of 10 turns, and was present 1.2 s after Stop in 6 of 6 later turns. |
| Transcript sum at Stop | does not work at Stop: current turn missing 10 of 10 (turn 1: no assistant record at all) | The last assistant message of the turn was timestamped 40-60 ms before Stop yet was not in the file when the hook read it; the sum read was always the previous turn's. Re-read at +1.5 s: caught up in only 2 of 6 turns (the other 4 still one turn behind). It is complete by the next turn's Stop. |
| Sidecar coexists with a user statusline (tee wrapper) | works: 1 of 1 (deterministic, offline wrapper test also passed) | Wrapper `tee >(node sidecar.mjs) \| user-statusline`, run by bash, rendered the user's line `USER-STATUSLINE` in the live session while the sidecar still wrote records. Needs bash (process substitution); POSIX `sh` fails with a syntax error, so the wrapper must be `#!/bin/bash` or use `tee file` then read the file. |
| `/clear` sent via the route when idle, SessionStart `source=clear` | works: 3 of 3 | Each `/clear` fired SessionStart with `source: "clear"` and a NEW `session_id` and a new transcript file. The clear payload has no `model` field (startup had one). |
| SessionStart `additionalContext` reaches the new conversation | works: 3 of 3 | The marker returned as `hookSpecificOutput.additionalContext` appeared in each new transcript, and the model, asked in the cleared session, quoted it exactly and saw 0 earlier user messages. Tested with a short string only; the 10,000 char limit was not exercised. |

## Step 3b: Stop payload and background tasks
Works. The Stop payload carries `background_tasks` and `session_crons` (both arrays, `[]` when none). With one running background shell it read `background_tasks: [{id, type: "shell", status: "running", description, command}]` on both of two consecutive Stops while it ran. Other payload fields: `session_id, transcript_path, cwd, scratchpad_dir, prompt_id, permission_mode, effort, hook_event_name, stop_hook_active, last_assistant_message`. Not tested: Claude subagent tasks, other `type` values, `session_crons` non-empty. Phase 8's at-rest rule may use `background_tasks.length === 0 && session_crons.length === 0` for Claude's own tasks; processes outside Claude (herdr panes, external shells) are not visible there.

## Step 4: window size
- `bind()` at tier `standard` for family `claude` is `sonnet` (`core/config-standard/runner.yaml` modelPolicies). Measured here: `context_window_size = 1000000` for `claude-sonnet-5-5` and for `claude-haiku-5-5`. Opus was not measured.
- No transcript field names it: the assistant record's `model` is `claude-sonnet-5-5` with no `[1m]` suffix, and no window key exists in the transcript. Only the statusline JSON carries `context_window_size`.
- `used_percentage` is an integer (7 for ~67k of 1M), which is coarse: at a 1M window one percent is 10k tokens. Use the sidecar's `current_usage` sum, not the percentage, as the number.

## Decision rules
- Phase 8 measure: use the sidecar as the primary source, read as the latest sidecar record with `ts` newer than the Stop hook's own timestamp, wait up to about 1.5 s for it (it landed 0.3 s after Stop in 10 of 10); take `current_usage` sum and `context_window_size` from it. If no newer record appears, fall back to the transcript sum divided by `sessionRotation.windowTokens`, and treat that value as one turn stale (it is stale at Stop 10 of 10). A sidecar record older than the Stop timestamp is never "fresh". Do the rotation check at the next idle point or next prompt, not at Stop time, when only the stale value is available. Always record `sidecar_ts` and the source used. The transcript is NOT a usable measure at Stop. A user statusline stays intact only through a bash tee wrapper; changing anyone's statusline is a separate decision.
- Phase 14: confirmed. `/clear` through the Terminal Control route (`send` text plus submit while idle) works 3 of 3 and a SessionStart hook can re-inject a short context into the new conversation, so record it as the no-second-session fallback only, per SM-D13. The executor shape needs `send` (and `launch`) exposed on the Node client; `/clear` creates a new `session_id`, so anything keyed on the old id must follow the `source=clear` SessionStart.

## Not measured
- Opus window size; `additionalContext` near 10,000 chars; `/clear` while a turn is running; Stop payload with subagent or cron tasks; statusline behavior with a user statusline that is slow.
- One model family (Claude) only, one 1M-window configuration.
