---
id: p-tyowvhthul
title: "A lead waiting on an external measure holds a lead slot while a ready plan waits, and nothing raises the lane limit by capacity (supervisor, priority high; source: owner via Miu, 2026-11-23)"
status: proposed
priority: P1
area: supervisor
created: 2026-11-23
---

# Why

On 2026-11-23 `maxLeads` was 2 and both slots were held: one by the component-authority-doors lead, and one by the heads-stable-and-able lead, which sat in a measurement window until 21:06 with no unit running. The ready plan `261123-0828-head-stop-rotation-bad-measure` was not admitted, and the owner wanted component-authority-doors to move faster. `maxLeads` is a fixed number in `.fgos/config.yaml`; no rule counts a lead that is only waiting outside against the limit differently from a working one, and none raises the limit when provider capacity, memory and disk allow.

# Done when

The supervisor's admission counts a lead whose plan names an external wait as not holding a working slot, or raises the lane count from measured capacity (provider seats, memory, free disk), whichever the owner picks. The rule and its inputs are written in the supervisor spec, and one owning test drives two leads, one waiting outside, and shows the ready plan admitted. Within a plan, phases whose footprints do not collide start together.

# Notes

Capacity limits seen the same day: the Gemini seat at its provider limit, an OOM kill that took down several heads' request sockets (`p-6htu2ae64o`), and a root disk that filled earlier. Related: `p-fel4zoytbn`, `p-4uqiyjwrtd`, `p-iatzcg2gee`.
