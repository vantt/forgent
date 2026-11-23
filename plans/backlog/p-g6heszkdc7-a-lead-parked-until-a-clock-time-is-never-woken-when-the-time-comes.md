---
id: p-g6heszkdc7
title: "A lead parked until a clock time is never woken when the time comes, because no process or event marks the end of the wait (supervisor, priority high; source: owner via Miu, 2026-11-23 14:4x)"
status: proposed
priority: P1
area: supervisor
created: 2026-11-23
---

# Why

The lead of plan `261122-0118-heads-stable-and-able` waits for 21:06 on 2026-11-23 (phases 8, 10 and 11, see the plan's Waits section). A clock time is not a background process and not a request, so nothing raises an event when it arrives. The owner expects the lead to stay idle past 21:06, as it did at 14:20 when the phase 9 window ended: the lead was idle and the owner had to tell Miu, who raised `coordination-help` by hand and the lead was replaced. No existing row covers this case: `p-4uqiyjwrtd` is about an idle lead with no event, `p-5gczifzh7h` is about a wait on a process or CI run that finished. Both leave a pure time wait unwoken, and the tuning in `p-du3gbevrs5` (the fallback honouring `session-idle: none`) removes the last wake that happened to catch it.

# Done when

Owner direction 2026-11-23: a lead that has nothing to do until a time must not stay live holding memory. It writes one durable sleep record (who, plan, due time, what to do on waking), then its session ends. The watcher reads the records on each tick and, when one is due, wakes the supervisor, which starts a fresh lead that continues from the plan files and the record; the record is then marked woken. This reuses the existing watcher tick and the lead start door; the only new thing is the record, and prior art shows no timed-wake record before this (the only park today is an item awaiting a human answer). One owning test drives a sleep record past its due time and shows the wake and the fresh lead; a record not yet due wakes nobody. The lead of plan \`261122-0118-heads-stable-and-able\` is the first user, for its 21:06 wait.

Owner addition 2026-11-23: sleeping is only safe if the lead's workspace is safe. Before the session ends, the sleep record names the lead's workspace (its worktrees, branches, unlanded changes and held locks or tickets) and the system keeps it intact while the lead sleeps: a worktree removal, a disk cleanup or a rotation must refuse or skip a worktree named by a live sleep record (p-6sd4fslxv7 removes landed worktrees, so it reads this record). On waking, the fresh lead is handed that same workspace and the record says so, so it neither starts from a clean checkout nor loses work. One owning test sleeps a lead with an unlanded change, runs the cleanup, wakes the lead and shows the change is still there and is the lead's again.

Until it lands, the secretary raises \`coordination-help\` for that 21:06 wait at that time.

# Notes

Owner concern 2026-11-23. Related: `p-4uqiyjwrtd`, `p-5gczifzh7h`, `p-du3gbevrs5`. Order it with the two supervisor rows above, before the 21:06 wait if the owner wants it.
