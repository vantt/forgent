---
id: p-lerdf5mjjp
title: "A confined head's supervisor wake and queue are refused ref-invalid on a head-window case ref (supervision, priority P2; source: owner, 2026-11-27)"
status: proposed
priority: P2
area: supervision
created: 2026-11-27
---

# Why

On 2026-11-27 at 15:36, `head:shaper-plan-claim-who-and-where` on fg-server ran `fgos supervisor wake` and
`fgos supervisor queue`. Both failed with `ref-invalid: "case:head-window-c-<pid>-<ns>": not found in the checkout
/home/vantt/projects/forgent`. `fgos supervisor raise` from the same head worked (event `fb3517c4030c5272`).
The case ref was minted by the request door itself, not passed by the head.

# Done when

A head's `supervisor wake` and `supervisor queue` through the request socket answer, or refuse with their own
code. They never refuse on a case ref that the request door minted itself.

# Notes

Handed over by the shaper through the supervision queue (event `c7a12feb3dd7ba0e`): a shaper cannot write the backlog.
