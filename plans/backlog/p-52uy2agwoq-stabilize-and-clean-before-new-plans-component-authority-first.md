---
id: p-52uy2agwoq
title: "Stabilize and clean the system before any new plan: component-authority first, no new Node unless truly needed, keep the node/rust/wasm router (platform, priority high; owner order via Miu, 2026-11-23)"
status: proposed
priority: P1
area: platform
created: 2026-11-23
---

# Why

Owner order 2026-11-23 15:13: instability is starting to appear in many places. Until it is under control, no plan that only adds capability is started. The priority is work that makes the system stable and clean, above all component-authority.

# Order

1. Stability and cleanup work comes before every feature plan. Feature plans that are draft or ready wait; plans already running (heads-stable-and-able, component-authority-doors) continue.
2. Component-authority is the first cleanup lane.
3. No new Node code or module unless it is truly needed; a new Node piece needs a stated reason. Deleting or porting existing Node is welcome.
4. The fgOS router: the router mechanism that routes to node, rust, wasm and external CLIs stays whole and keeps all four kinds of backend. What goes is only a route whose work has already moved from Node to Rust: its Node route entry is removed, the Rust route stays. A phase that edits routing files proves the mechanism still supports all four kinds and lists each Node route it removed as already served by Rust.

# Done when

The supervisor orders the plan queue so that stabilization and cleanup rows run first and no new feature plan is started while they are open; every new plan states whether it adds Node and why. The owner lifts the hold explicitly.

# Notes

Which existing rows count as stabilization (reds, leaks, data-loss, one-door debt, dead-code deletion) is for the supervisor to sort from the backlog; open ties go to the owner.
