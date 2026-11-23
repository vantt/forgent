---
id: p-vukyn5cg3p
title: "The secretary cannot read a scratchpad draft that the shaper she started can read (agent confinement, priority P2; source: owner observation to the secretary, 2026-11-23)"
status: proposed
priority: P2
area: agent-confinement
created: 2026-11-23
---

# Why

On 2026-11-23 the owner pointed Miu at a draft in another session's scratchpad (`/tmp/claude-1000/.../scratchpad/harden-next-round-draft.md`). From the secretary's sandbox the path did not exist, while the owner reports that the shaper started for the same topic reads it. So two heads of the same project see different files, and the secretary cannot check or pass on a file the owner names. The cause is not verified: it may be the confinement's read scope, a per-head temp directory, or the owner's path being visible only to unconfined or differently confined heads.

# Done when

The cause is named from the confinement setup of each persona. The owner then decides whether a file the owner names in a request must be readable by the secretary (and how, for example copy under `plans/`), or stays shaper-only. The answer is recorded in the confinement spec and the secretary skill says what she does when a named file is not reachable.

# Notes

Same family as p-v6xinnjoxh and p-dw3h5wscns: gaps between what a secretary request needs and what her grant lets her do. The workaround used on the day: the row for the shaper says to use the draft if readable.
