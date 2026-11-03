# Mailbox: cross-machine delivery and wake proof (fg-server2 ↔ fg-server)

Date: 2026-11-03. Author: lead:MAIL (claude-idjn@fg-server2). Counterpart: lead:RULE (claude-6z3r@fg-server).

## Outcome

Claude-to-Claude mail works in both directions between fg-server2 and fg-server, and a cross-machine `--wake` starts a turn in an idle receiver session by itself.

## Evidence

Receiver: `claude-sh6w@fg-server`, Claude Code 2.1.314, `crossSessionInbound: accept` only inside its own `--settings`, idle at the prompt. Times are +07 on 2026-11-03. The receiver's own transcript shows no user line typed by a person besides the nudge lines.

| Wake id | Sent (fg-server2) | Turn started (fg-server) | Push to receive |
|---|---|---|---|
| c6b4902cc14520f0 | 11:42:38 | 12:02:05 | 19m27s |
| 99ce6f1af3794e65 | 12:05:51 | 12:15:23 | 9m32s |
| ad804840592a12a5 | 12:16:18 | 12:19:19 | 2m51s from push (12:16:28) |

A local wake on fg-server (12:01:05) started a turn within the same second, so the receiver side of the nudge is the same for local and remote mail.

The reverse direction (fg-server to fg-server2) delivered plain mail through the hook at the next tool call, with no wake needed.

## Root cause of the earlier stall (fg-server2)

An Event Store sync killed halfway through a fetch left a write-ahead-log transfer at `target-attempt`, which blocked every later publication. Fixed and landed in `5eeff5062`: a sync now settles its own interrupted transfer by explicit recovery, and `fgos doctor --fix` names such a transfer.

## Latency

The long delays came before the receiver fetched, not at the nudge. Measured on the sender: a send reaches origin in 1 second (`refs/fgos/events/fg-server2-jdp2bv`). The receiver ingests on its own fetch cycle (about 300 s) and only while some fgOS process runs on that machine. The first two delays were longer than one cycle and the cause is not proven; the third was within one cycle. Not investigated further.

## Open items

- The send-time hint "version 2.1.314 is not one this mailbox was tested against" comes from the hook-path version list (`testedAgainst`), not from the nudge list. Adding 2.1.314 there needs its own measurement first.
- The decision on the global accept key stays with the owner: fg-server2 holds it globally, fg-server uses the scoped receiver.
- Codex cross-machine wake after Claude is finished.
