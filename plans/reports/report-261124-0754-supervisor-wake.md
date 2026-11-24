# Supervisor wake, 2026-11-24 07:54

## Queue

- 13 events closed. Seven `session-no-result` rows came from producer units that ran from 19:10 to 19:20 for plans that are now closed. Two `plan-done` and two `lead-ended` rows were for heads-stable-and-able and head-stop-rotation-bad-measure. Both plans were already closed in a6d606828 and 64e167036, and neither lead is live. One `lane-freed` row needed nothing because no plan is admissible (leads 1 of 3, lanes 4 of 4 free).
- `d22a9834` (coordination-help, raised this wake): the doors lead sat idle from 02:25 with unfinished phases. It had stopped on a full root disk, and the disk now has 15 GB free. I typed a nudge into it and it answered. Closed.
- `cab78645` (coordination-help, raised by the lead) is still open. The p02a-fix land waits on `fgos git recover` for the journal operation land-358453-1795461790719303262-1. Recover fails inside confined heads (the merge-slot lock is read-only) and no `lead:SUPERVISOR` is live, so I asked the owner in q-e62q73d2au.

## Running plan

- 261121-2110-component-authority-doors: the lead is live and busy again on phase 10b. Phase 11 step 6 waits on the recover, and phase 12 waits on a release (q-j4yeougr72).

## Defects seen (for the secretary to row)

- `fgos session type` puts the text into the Claude Code input box but does not submit it. An earlier unsent draft was sitting in the lead's input box, and I had to send a second `type` with a carriage return. A nudge can therefore sit unread for hours.
- The lead reports that `fgos run --sync main` through its request channel did not bring main's newest commits into the worktree. It also reports that `fgos run --resume` and the sync-only form are refused with "run takes one prompt".
- Plan phase 12 says the owner answered B to q-aanvfxaopa, but the question store still lists that question as open. Its asker has not acked it.

## Open owner questions

q-lnjt5zzbfq, q-aanvfxaopa, q-t5anmlcb7q, q-j4yeougr72, q-ddj673fmju, and the new q-e62q73d2au.
