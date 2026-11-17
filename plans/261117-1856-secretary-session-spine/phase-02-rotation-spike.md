# Phase 2: Spike — statusline sidecar timing and /clear via Terminal Control

Spike. Writes only its report; no source, hook or settings change is committed. Its result decides the measure source
of phase 8 and confirms the executor shape of phase 14.

## Inputs (read first)
- `plans/reports/research-261117-1624-handoff-skills-research.md` §4a, §4b, "Limitations / unverified".
- `docs/history/secretary-miu/DISCUSSION.md` SM-D2, SM-D13.
- Claude Code docs for hooks and statusline (https://code.claude.com/docs/en/hooks, /statusline): fields
  `context_window.used_percentage`, `context_window_size`, Stop input fields, SessionStart `source`.
- `.claude/settings.json` (current `statusLine` is the user's AgentKit script under another path; do not edit it).
- Terminal Control route `send` (`packages/terminal-control/rust/src/route.rs`), client `src/terminal-control/client.mjs`.

## Files this phase may write
`plans/261117-1856-secretary-session-spine/reports/spike-rotation.md`. Scratch work under `.fgos/runtime/tmp/` (ignored).

## Steps
1. Sidecar timing. In a throwaway herdr pane, start `claude --settings <scratch settings.json>` whose `statusLine` is a
   scratch script that appends `{ts, session_id, used_percentage, context_window_size}` to a file, and whose Stop hook
   appends `{ts, session_id}` plus the last non-sidechain assistant `usage` sum from `transcript_path` (dedupe by
   `message.id`). Run 10 turns of different lengths. Record per turn: did a statusline write land before Stop fired, its
   age at Stop, and the gap between the statusline percentage and the transcript sum / window.
2. Can a sidecar coexist with a user's own statusline? Test a wrapper statusline that tees stdin to the sidecar then
   execs a given command, and check the user's line still renders. Record the finding only; changing anyone's statusline
   is out of scope here.
3. `/clear` via Terminal Control: in a pane allocated through the route (never raw `herdr pane send-text`), send `/clear`
   followed by Enter when the session is idle; record whether SessionStart fires with `source=clear` and whether
   `additionalContext` (under 10,000 chars) reaches the new conversation.
3b. At rest: record whether the Stop payload says anything about in-process background tasks (phase 8's at-rest rule
   assumes it); if not, name the fact the hook can use instead. <!-- Updated: Validation Session 1 -->
4. Window size: record `context_window_size` for the models bind() picks at tier `standard` here, and whether any
   transcript field names it.
5. Write the report: for each mechanic `works | does not work | flaky (n of 10)`, the evidence, and the decision rule
   for phase 8 (measure = sidecar when fresh within N seconds, else transcript sum / `sessionRotation.windowTokens`; or
   transcript only) and for phase 14 (`/clear` recorded as a no-second-session fallback only, per SM-D13).
6. Clean up: close every pane you allocated (release through the route), remove scratch files.

## Verify
- The report exists, has the three mechanic verdicts with counts, and the two decision rules.
- `herdr pane list` shows no pane left by the spike.

## Rollback
Delete the report; nothing else was committed.
