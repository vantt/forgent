---
id: p-tvwy24txpj
title: "One `spawn.rs` extension: caller-owned containment, an output cap and descriptor closing, which retires the three `run-bounded-child` door rows (process, priority P3; source: report `unit-261124-1035-p12b-bounded-child-stop.md` of the doors plan)"
status: proposed
priority: P3
area: process
created: 2026-11-24
---

# Why

Idea for the owner (RUL104 (tốt hơn, không to hơn)): extend `packages/process/rust/src/spawn.rs` so the last three bounded-child debts can go. Step 12b of the doors plan moved most bounded child spawns onto the shared `run_bounded` and `resolve_program`. Three files remain as named debt on the door row `run-bounded-child`, because `spawn.rs` lacks what each needs:

- `packages/git/rust/src/driver.rs`: run git inside a containment domain the caller creates (its own pipes, `kill_all` with proof the domain is empty, wake-up by pidfd), and stop when output passes a limit.
- `packages/mailbox/rust/store/src/nudge.rs`: it spawns through `spawn_mapped`, which closes every descriptor alive across exec, so the lock descriptor never reaches the helper. It needs a spawn that controls closing inherited descriptors.
- `packages/run-supervisor/rust/src/steps.rs`: on Windows the child sits in a Job Object the caller owns (`assign_and_resume`), and stdout is limited through `take()`.

The idea: one bounded-run mode in `spawn.rs` with three abilities: caller-owned containment (a domain on Linux, a Job Object on Windows), an output limit, and an option to close inherited descriptors. No single ability is enough: the output limit is shared by `driver.rs` and `steps.rs`, but each also needs its own containment, so no file can move with the limit alone.

Why not now: RUL104 (tốt hơn, không to hơn) does not allow adding a feature while hardening what exists. The 12b report advises building it only when one of the three crates is next changed in how it spawns.

# Done when

The owner decides whether to build it. If yes, a plan adds the mode to `spawn.rs`, the three files move onto it, and the door row `run-bounded-child` is removed. If no, the row records that decision as its reason.

# Notes

Report: `plans/261121-2110-component-authority-doors/reports/unit-261124-1035-p12b-bounded-child-stop.md`, section "Feature idea for the owner".
