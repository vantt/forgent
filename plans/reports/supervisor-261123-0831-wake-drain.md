# Supervisor wake 2026-11-23 08:23–08:31

No owner question is pending. Queue drained: 19 events handled.

## What moved

- **head-status-line-ak-land closed.** p01 landed as c447154e1, and the plan-done update landed as 805beabb8 (p-7nmpo2zr3d is done). The lead was stopped as "plan done". The lead reported 5 non-blocking review findings in the plan's reports/ as a possible follow-up item. The secretary owns telling the owner.
- **runner-recheck-replays-account-view admitted** into the freed slot (5cb9f6b6b, base 805beabb8). Lead head:lead-forgent-261123-0821-runner-494d8 is live, and planner ds-f4ocn3oiex was stopped as "plan ready". The fix unblocks every writing unit that is refused while a preferred account is quarantined, which holds contract-check wave 1 and doors wave 1.
- **Doors plan made visible again (9e188949a).** The admission commit 680eeb6f3 had left two `base:` keys, so `supervisor plans` could not read the plan, hid its lead and counted 3 live leads instead of 4. Removing the stale key surfaced a portfolio drift: the running doors plan cited two done rows (p-esa3lau6kd and p-7nja6ilwkr), which refused the status-line land with `land-backlog-index-failed`. I moved both rows from `source` into a provenance line (a2bd716f1). Both rows had met their own Done-when with 261121-2109.
- **Orchestration skeleton held** behind doors on the owner's 08:23 order (9e188949a). The two footprints share `command-manifest.json`, `command-routes.json` and `command-route-annotations.json`, and all four lead slots were in use. The skeleton stays `draft`. Orphan unit unit-run-1795396210085-7041f159 (skeleton p10, left over from the 08:15 stop) reported no result, and its worktree is kept for the resumed lead.
- **Owner chores:** 261122-1751-owner-communication-standard withdrawn as a duplicate of 1950 (94b169842); delete-dead-node now runs before 1950, with blockedBy swapped (679653af8).
- **p-vbv57yc4d5 (no head rotates: bad-measure):** I seeded the settled discussion ds-p7bc4sheox from the backlog row (94b169842) and started planner head:planner-ds-p7bc4sheox.

## Running plans

| Plan | Lead | State |
|---|---|---|
| 261121-2110-component-authority-doors | live | wave 1 waits for gemini's quarantine to lift at 09:03 (a timer is running in the lead's shell) |
| 261122-0118-heads-stable-and-able | live | phases 8–11 are parked on measurement windows ending 14:20 and 21:06 |
| 261123-0726-contract-check-in-confined-heads | live | wave 1 is parked on the runner binding mismatch; it resumes once the runner-recheck fix lands |
| 261123-0821-runner-recheck-replays-account-view | live (new) | starting |

## Notes

- `fgos session type` puts text into the prompt without submitting it. A second `type` with a carriage return submitted it.
- The doors lead's prompt line shows "don't wait, run with --provider claude now". It is unsubmitted and may be a CLI suggestion, so I left it alone.
