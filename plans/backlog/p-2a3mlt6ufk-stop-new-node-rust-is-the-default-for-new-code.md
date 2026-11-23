---
id: p-2a3mlt6ufk
title: "Stop new Node from entering: Rust is the default for new code (core/platform, priority high; source: owner order 2026-11-23 14:2x via lead:SUPERVISOR)"
status: proposed
priority: P1
area: platform-foundations
created: 2026-11-23
---

# Why

Since 2026-11-18 the repo gained 400 new .rs files and 12 new .mjs: src/native/dispatch-depth.mjs, dispatch-error.mjs, execution-door.mjs, legacy-view.mjs; src/runner/dispatch/assignment-layout-twin.mjs, config-twin.mjs; src/runner/confinement/authority-twin.mjs; src/runner/execution/unit-summary-twin.mjs; src/session-host/head-plan.mjs, head-stop.mjs; src/state/graph-adapter.mjs; src/workflow/admission-peer.mjs. The owner rule of 2026-11-18 (new code in Rust) lives only in supervisor briefs, design principle 4 covers only foundations, nothing guards it mechanically, and twins have no retire date.

# Done when

(a) Design principles say new code is Rust; Node is only a thin caller into Rust and every new .mjs names its reason. The owner approves the wording before it lands: the planner shows him the draft through the secretary. (b) A mechanical guard in npm test: a frozen census of existing src/**/*.mjs and scripts/**/*.mjs (like the Git mutation census); a new .mjs outside it without a recorded reason turns the suite red, and the census may only shrink. (c) Every *-twin.mjs names the plan that retires it, and that plan appears in the Node-to-Rust inventory (p-vwpnx4gpow).

# Notes

A small plan, ordered before p-vwpnx4gpow. Owner approved 2026-11-23.
