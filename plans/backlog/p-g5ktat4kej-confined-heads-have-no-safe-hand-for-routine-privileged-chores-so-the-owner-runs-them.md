---
id: p-g5ktat4kej
title: "Confined heads have no safe hand for routine privileged chores, so the owner relays messages and runs commands by hand (supervisor, priority high; source: owner via Miu, 2026-11-23 20:05)"
status: done
priority: P1
area: supervisor
created: 2026-11-23
---

# Why

Since the manual lead:SUPERVISOR session stopped, the owner is the messenger and the hand. On 2026-11-23 the supervisor head, being confined, could not write `.fgos/config.yaml` (maxLeads) or remove landed worktrees (`.git` read-only), so question `q-ptcieh72p6` sent both chores to the owner. Before that the owner had to notice that two leads had ended and that a lead sat idle, and tell Miu to raise events. `fgos session type` does not submit. Existing rows cover single pieces (`p-iatzcg2gee`, `p-4uqiyjwrtd`, `p-lfwmzs6zsr`, `p-tyowvhthul`) but none covers the whole: who does an unconfined chore, and who reacts on time.

# Done when

A routine privileged chore (remove a delivered worktree, set a bounded config key, remove scratch of a landed phase) has one named door with a fixed, safe verb list that a confined head can call without the owner, and every call is recorded. Events that need a reaction (a lead ended or idle, a question answered, a ready plan with a free slot) reach the head that owns them without the owner relaying. The owner is asked only for choices, never for commands.

# Notes

The owner picks the shape: a standing unconfined lead:SUPERVISOR, or a narrow door with bounded verbs. Related: `p-iatzcg2gee`, `p-4uqiyjwrtd`, `p-lfwmzs6zsr`, `p-tyowvhthul`, `p-vquz26ibnn`.
