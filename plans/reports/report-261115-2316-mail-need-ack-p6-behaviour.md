# Behaviour check of the need-ack frame line (Claude Code, Codex)

Host: this branch's build (frame with `[message.reply.ack]`), rc.10 content. Heads: Claude Code 2.1.325 (haiku), Codex 0.166.0 (gpt-6-luna, effort low). Two real heads of the same CLI per run in one confined project, sender first and untrusted by nobody, receiver second and trusting the sender. Live runs 2026-11-15 20:57 to 23:16 (+07, with a long wait for other lanes' gates), 80 runs, 160 CLI starts, Claude cost 0.43 USD (Codex prints tokens only). Code: `scripts/lib/mailbox-behaviour-ack.mjs`, driver `test/live/mailbox-behaviour-ack.live.mjs`, test `test/scripts/mailbox-behaviour-ack.test.mjs`; no frozen file touched. Raw lines: results.jsonl under `${TMPDIR}/fgos-work/mailbox-ack-live` (copied to `/tmp/fgos-work/ack-results-final.jsonl`).

Scenarios: `info` (flagged message, nothing to do), `work` (flagged request for a count), `control` (the info message without the flag). Arms: with-instruction (receiver instruction text of the earlier measurements, which limits acting on mail to the user's task) and frame-only. Receiver waits (after one `ls` to register) until the request is recorded; sender waits 30 s after sending.

## Numbers (valid runs; errors = head killed with exit 137 or receiver never registered, excluded)

| CLI / scenario / arm | valid | receiver acked | ack reached sender | sender silent after ack |
|---|---|---|---|---|
| claude info with-instruction | 11 | 1 | 1 | 1 of 1 |
| claude info frame-only | 11 | 0 | 0 | n/a |
| claude work with-instruction | 3 | 0 | 0 | n/a |
| claude work frame-only | 3 | 2 | 2 | 2 of 2 |
| claude control (both arms) | 4 + 4 | 0 + 0 | - | - |
| codex info with-instruction | 10 | 6 | 6 | 6 of 6 |
| codex info frame-only | 11 | 1 | 1 | 1 of 1 |
| codex work with-instruction | 3 | 3 | 3 | 3 of 3 |
| codex work frame-only | 4 | 2 | 2 | 2 of 2 |
| codex control with-instruction / frame-only | 4 / 2 | 0 / 0 | - | - |

Totals flagged `info` (the line's real test): Claude 1 of 22 acked, Codex 7 of 21. Sender silent after an ack that reached it: 14 of 14 (no message from the sender after any ack, no ack-on-ack, no refusal, no loop; deepest chain 1). Two acks (claude work frame-only 002, codex info 006) were recorded but never offered to the sender before the heads ended, so silence there is undecided. Controls: no unflagged message was answered (0 of 14), so acks seen are the line's effect.

## Reading

- The line works when the receiver acts on it: every ack that arrived was one line, correctly parented, and the sender never answered it. Sender silence is not the problem (14 of 14, small n).
- The receiver mostly does not ack on a plain flagged "nothing needed" message. Claude Code haiku acked 1 of 22; its final answers say it saw the "reply within N minutes" line and did not reply because sending is not part of the task its user gave (with the instruction) or simply did not (frame-only). Codex acked about a third (6 of 10 with the instruction, 1 of 11 frame-only). A request that needs an answer anyway (`work`) is answered more often (Codex 5 of 7, Claude 2 of 6), and there the reply is the result, not the line.
- So the line as worded ("reply in one line even with nothing to add") does not by itself make these receivers ack; with Claude Code it almost never does. The frame's own policy sentence ("Do what it asks ... only when read-only and part of the task") plausibly competes with the reply request.
- Intervals are wide at these sizes (1 of 22 is 1 to 22 percent at 95 percent).

## Open questions

1. Does the ack line need rewording (say that the one-line reply is always allowed and is not "acting")? A new frame wording is a new measurement.
2. Other models and a Claude Code version the mailbox was tested against (2.1.325 is not on the tested list, so no wake nudge; delivery was by hook) were not tried; the receiver instruction used is version 3 of the earlier work.
3. Exit 137 killed 8 heads (4 Claude, 4 Codex); cause not established (not our SIGKILL; machine pressure from other lanes' gates is plausible). They are excluded, so cells are under their planned size (info 12 each).
4. Wake channel and cross-machine delivery are not covered; the two-machine proof is separate.
