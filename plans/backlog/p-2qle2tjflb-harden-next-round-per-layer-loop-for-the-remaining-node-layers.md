---
id: p-2qle2tjflb
title: "HARDEN vòng tiếp: làm cứng từng tầng còn Node theo vòng lặp của HARDEN, Work để cuối (HARDEN, priority P1; source: ds-wham5txfkv Closing note round 4, owner order 2026-11-23)"
status: proposed
priority: P1
area: harden
created: 2026-11-23
---

# Why

The Node inventory discussion closed and handed the layer work to a new discussion. This row carries it: harden each remaining Node layer with HARDEN's per-layer loop, not port it to Rust as it stands.

# Done when

A settled discussion "HARDEN vòng tiếp" exists, fixing the layer order, the baseline recount and the per-layer loop, ready to plan. It must not block component-authority-doors or heads-stable-and-able, and it does not enter the supervision queue until it is settled.

# Settled frame (the shaper does not reopen it)

- Follow HARDEN's per-layer loop, never carry the state as it is to Rust.
- Order: T2-T3 session, T6 Workflow, T8 supervision, T9 host/surface/packaging/report, then T7 Work last. Work gets its own discussion, opened only when its turn comes.
- Step 0 recounts the inventory table (§6) after component-authority-doors and 261122-2108 land, and checks the two tests that were still red when HARDEN closed (H5).

# Read first (shaper)

1. plans/discussions/ds-wham5txfkv-node-rust-port-inventory/DISCUSSION.md: "Closing note (round 4)", §3 (H1-H7, C5, what HARDEN left open and what is new), §4, §6 (inventory table, baseline input).
2. plans/261021-1118-harden-low-layers-bottom-up/plan.md: section "The per-layer loop" (steps 1-9) and decision 78.
3. plans/reports/closing-261118-1344-harden-root-closing.md: §1, §6, §7.
4. An owner draft exists at /tmp/claude-1000/-home-vantt-projects-forgent/4700a438-e544-423e-ad82-32ecb291aa09/scratchpad/harden-next-round-draft.md; use it as a frame if readable, else rebuild from §3 and §4.

# Notes

Source of the order: the owner's message to Miu, 2026-11-23.
