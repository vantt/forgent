---
id: p-iatzcg2gee
title: "A lead that finishes raises no event, so nobody checks its result and its lane stays unused (supervisor, priority high; source: owner via Miu, 2026-11-23)"
status: proposed
priority: P1
area: supervisor
created: 2026-11-23
---

# Why

On 2026-11-23 two leads finished at 19:29. `fgos supervisor queue` stayed empty, so `fgos supervisor wake` answered nothing-unhandled and no supervisor started. The owner had to notice the gap and tell Miu, who raised a `coordination-chore` event by hand at about 20:10. Until then the ready plan `261123-0828-head-stop-rotation-bad-measure` stayed unadmitted because the lead count read as full. `p-4uqiyjwrtd` covers a live idle lead only; a lead that has ended is a separate case.

# Done when

A lead that ends, by finishing or by failing, produces an event on the supervision queue without anyone raising it by hand, and the supervisor reads its result and frees the lane. The secretary can see the same fact in the portfolio files she already reads. One owning test drives an ended lead with an empty queue and shows the event.

# Notes

Related: `p-4uqiyjwrtd`, `p-g6heszkdc7`, `p-vquz26ibnn`. The cause is not yet diagnosed; scout whether the lead end already raises an event that the watcher drops.
