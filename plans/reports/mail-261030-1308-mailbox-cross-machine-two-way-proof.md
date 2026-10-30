# Mailbox cross-machine mail: two-way proof, fg-server2 and fg-server

Result: mail crosses machines in both directions through the Event Store over the Git remote, on the two machines that run fgOS processes. The owner's machine (design-lap) was not part of this proof.

## Evidence (2026-10-30, times in UTC+7 unless noted)

- fg-server2 sent proof message 2 (`5cd78f4ee411a0b2` on the sender) to `claude-6z3r@fg-server` after fg-server's first sync. fg-server's `fgos mailbox inbox` showed it (id `d679c1cc2d63ec3e` on the receiver) in state recorded about 100 s after a tool turn there (06:02 UTC).
- fg-server replied with `--reply-to`. fg-server2's `fgos mailbox inbox` listed `61fc3083e8717bc6` from `claude-6z3r@fg-server` ("got it") at 13:07, and `fgos mailbox status` went from 1 to 2 sent, 1 offered.
- The sync child starts from the hook after a tool turn, not from `fgos mailbox inbox`; `sync.json` lives at `.git/fgos/events/sync.json`.

## Finding: the first message was lost to the baseline

The first message was sent before fg-server's first sync. The first ingest of a machine takes a baseline and skips the mail already in the stream, so that message was never offered. It still shows as "waiting for the receiver's fetch" on the sender. This is by design (history is not replayed), but the sender is never told. Not yet confirmed by reading the receiver's cursor; the second message arriving after the first sync supports it.

## Open

- design-lap needs the owner's go.
- Sender report for baseline-skipped mail (a settlement the sender can see) is not designed; raise it with phase 02.
