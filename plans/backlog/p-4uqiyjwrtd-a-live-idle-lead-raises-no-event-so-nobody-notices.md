---
id: p-4uqiyjwrtd
title: "A live idle lead raises no event, so nobody notices it has stopped (supervisor, priority high; source: owner via Miu, 2026-11-22)"
status: done
priority: P1
area: supervisor
created: 2026-11-22
---

# Why

On 2026-11-22 the owner saw the lead of plan `261122-0800-red-tests-and-backlog-sweep` stop, then the lead of plan `261122-0118-heads-stable-and-able` go idle. Each time `fgos supervisor queue` was empty and `fgos supervisor plans` still showed `leadLive: true`. The plan files had not changed for more than 20 minutes (10:16 to 10:40, then 12:05 to 12:28). The owner had to notice and tell Miu, who raised a `coordination-help` event by hand. The fix of `p-waxzxz5mio` only runs once the watcher has raised `plan-no-progress` or `session-idle`, so a missed event leaves nothing to act on. The measurement of plan `261122-0118` phase 9 counts false idle alarms, not missed ones. Why the watcher raised nothing is not yet diagnosed.

# Done when

A live lead that has written nothing for the idle threshold produces an event on the supervision queue without anyone raising it by hand, and the supervisor acts on it. The cause of the missed event on 2026-11-22 is stated. The same measurement that counts false idle alarms also counts missed ones, before and after the tuning change. One owning test or fixture drives a live idle lead with an empty queue and shows the event is raised.

# Notes

Owner decision 2026-11-22: carry this inside plan `261122-0118-heads-stable-and-able` (phases 7 and 9), not as a separate plan. Related: `p-waxzxz5mio` (done), `p-5gczifzh7h`, `p-vquz26ibnn`.
