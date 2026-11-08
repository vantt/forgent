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

The long delays came before the receiver fetched, not at the nudge. Measured on the sender: a send reaches origin in 1 second (`refs/fgos/events/fg-server2-jdp2bv`).

Cause of the long delays, from the code: the receiving machine fetches only when a hook call of some session on that machine finds its last sync older than `eventStore.sync.intervalSec` (`apps/fgos/src/wiring/mailbox_hook.rs`, `start_sync`, which spawns one detached sync child). An idle receiver session runs no hook, so on a machine where nothing else is running no fetch happens until something does. On fg-server the only other session (RULE) was between turns during the first two sends, which matches 19 and 9.5 minutes; during the third send RULE's session was active and the delay was 3 minutes. This is the behaviour the send output states ("later when none does"), not a defect, but it means wake latency is unbounded on a quiet machine. A periodic sync process on the receiving machine would bound it; that is a new mechanism and an owner decision.

## Open items

- The send-time hint "version 2.1.314 is not one this mailbox was tested against" comes from the hook-path version list (`testedAgainst`), not from the nudge list. Adding 2.1.314 there needs its own measurement first.
- The decision on the global accept key stays with the owner: fg-server2 holds it globally, fg-server uses the scoped receiver.
- Codex cross-machine wake after Claude is finished.

## Proposal: bounding the wake delay on a quiet receiver (owner choice, nothing built)

Problem: a machine fetches only when a hook of one of its own sessions runs. A receiver on a machine with no other activity gets its wake mail late, with no upper bound. No scheduler or always-running sync exists in fgOS today; the only long-running process is the gateway (`fgos gateway start`), and it does not run on every machine.

| Option | What it adds | Cost | Bound |
|---|---|---|---|
| A. OS timer | `fgos events sync` every `eventStore.sync.intervalSec`, registered by `fgos setup` and checked by `fgos doctor` | One scheduler adapter per platform (systemd user timer, launchd, Task Scheduler), new doctor row, new one-door census entry | The interval |
| B. Gateway tick | The gateway process runs the same sync on its own tick | No new process kind, but only where the gateway runs | The interval, only on gateway machines |
| C. Keep as is | Document that a wake arrives with the next fgOS activity on the receiver | None | None, but in practice agent machines have activity |

Recommendation: C now, A only if the owner wants wake delivery on idle machines. B leaves the gap on the machines where it matters. Lane MAIL does not start A or B without the owner's choice, and OPC reviews any new process or Git call site.

## Round trip on an idle machine, 2026-11-04 (no manual step)

Outcome: a mail with `--wake` from fg-server2 reached an idle receiver session on fg-server, which displayed it and answered; the answer came back to fg-server2. Both machines run main `d44d89e15` or later with the systemd user timer (`fgos doctor --fix`, row `mailbox-sync-timer`).

| Leg | Time (+07) |
|---|---|
| Sent on fg-server2 (record `d5b25d2f6d30db5e`) | 13:37:42 |
| Receiver `claude-cher@fg-server` replied (its own clock) | 13:38:17 |
| Reply seen on fg-server2 | 13:38:38 |

The whole round trip took 56 seconds. This is a best case: fg-server's timer ticks every 300 s on the :00 phase (13:38:00 here, 18 s after the send), and the sender side polled with `fgos hook mailbox-sync` every 5 s instead of waiting for its own timer. The bound is the timer interval on each side, so the worst case is about two intervals plus a few seconds.

What stood between the first mail and this result, in order: a sync killed halfway left a transfer blocking publications (fixed `5eeff5062`, `8c09919bf`); a plain `fgos events sync` made the hook skip its mail-taking child for a whole interval (fixed `811bb3da5`: the child leaves its own stamp); an idle machine took no mail at all (fixed `46f242d9a`, `d44d89e15`, `da7ae4237`: OS timer, ownership marker, removal); the receiver session must have run one tool call before it has a mailbox address, otherwise the wake is refused `unknown-name`. A first receiver (`claude-sh6w`) got no nudge for wakes sent after 16:56 on 11-03 and the cause is not proven: `remoteLifetimeCap` was already 50 on fg-server when it was set, so the cap of 5 was not shown to be the reason.

Second demo (13:41:33 to 13:43:29, 1 min 56 s) and the receiver's pane dump (taken by RULE with `tmux capture-pane`, fg-server clock) show the receiver displaying each sentence word for word and answering: first mail arrived 13:38:17 (35 s), second 13:43:14 (1 min 41 s). A working session that only sees mail at its next tool call (lead:RULE, tier turn) read the same mail 27 minutes later; only a receiver opened for wakes (accept key in its own settings) answers in minutes. OPC accepted the timer (46f242d9a, d44d89e15, da7ae4237), including Node `execFileSync` for systemctl and launchctl, and asked that Windows be named in the backlog row (not done: docs/backlog.md is outside this lane's files).

Open: the Windows scheduler is not built (no Windows machine runs mail).

## Mail bodies in the mail-body ref: two-machine proof (2026-11-08, lane MAIL)

Result: a message whose body travels in `refs/fgos/mail-bodies/<machine>` instead of the signed event was sent from fg-server2 and read in full on fg-server. Rotation and the expired state were not run on real machines (see Not proven).

Setup: fg-server2 on release `93288a84b` with `mailbox.remote.bodyRef` on (set with `fgos config set`, with a reason); fg-server on `bbbf52f00` (takes payload versions 1, 2, 3, no sender or rotation code needed to receive).

- Test 1, sent 09:42:09: the body reached fg-server with the exact text and marker `BODYREF-PROOF-7f3a`, seen by fg-server at about 09:42. `git ls-remote origin` then listed `refs/fgos/mail-bodies/fg-server2-jdp2bv`, and `fgos mailbox status` on fg-server2 read `1 kept, the oldest was sent 11 s ago; a body is kept for 168 h`.
- Test 2, sent about 09:45 (marker `BODYREF-PROOF-9c21`): received on fg-server, seen about 09:45. The remote ref then held 2 blobs, so the second body was added to the first, not a replacement.
- Two sends of test 2 were refused first with `body-not-published: event-seal not taken: Timeout { waited_ms: 5000 }`: a `fgos hook mailbox-sync` was running on a loaded machine and held the event seal; the third try recorded. The refusal names the way out (retry, or set `bodyRef` false). Open item: a send waits 5 s for the seal and does not queue; on a busy machine a bodyRef send can need a retry.
- Cleanup: `bodyRef` removed from the project config (file restored byte for byte), and the test ref deleted from the remote with a leased delete, so no test body remains on `origin`. The two signed headers remain in the event refs (they carry a hash and a length, no text).

Not proven on real machines: the 7-day rotation (the lifetime cannot be set below 86700 s, so it cannot be shown within a day) and the expired state a receiver settles when a blob is gone. Both are proven by tests in `apps/fgos/tests/mailbox_routes.rs` and `packages/git/rust/tests/publication.rs`. Not covered: design-lap as sender or receiver of a v3 body (it takes v3, per its own status line).

Open decisions: a machine that turns `bodyRef` off keeps its last bodies on the remote until it turns it on again, because rotation runs only while the setting is on.

## Mail bodies on permanently: all three machines (2026-11-09, lane MAIL)

Result: `mailbox.remote.bodyRef` is on at fg-server2, fg-server and design-lap, and design-lap read a v3 message from fg-server2 in full.

- Line landed in the project config as `a3eb4a15a` (owner 2026-11-08: on permanently, clear by hand when it is turned off). Before it landed, each machine confirmed by mail a build containing `2d43cdf23`, the payload line `takes mail payload versions 1, 2, 3` and a clean `fgos config check`: fg-server2 `2d43cdf23`, fg-server `d527cee16`, design-lap release `91e0e561`.
- design-lap (06:46, after pulling main): received the v3 test message with its text; `mailbox status` there reads `mail bodies are kept in this machine's mail-body ref (bodyRef is on); none kept`.
- fg-server could not pull main (other sessions' uncommitted changes overlap), so its owner set the same key locally with `fgos config set` (backup kept); its status reads the same line. The local line will match main when it is pulled.
- fg-server's upgrade rejected its local project config (four executor keys became global-only) and `fgos mailbox` refused until they were removed; four sends there were recorded as `before-first-sync` refusals during that window.
- fg-server2's two proof bodies from 2026-11-08 are still kept locally (`2 kept`); they expire with the 7-day lifetime.

Still not proven on real machines: the 7-day rotation and the expired state (tests only), and design-lap or fg-server as the sender of a v3 body.
