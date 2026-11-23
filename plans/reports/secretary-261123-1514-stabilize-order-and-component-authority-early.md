# Stabilize first: how component-authority starts early, and the next steps

Secretary Miu, 2026-11-23 15:14. Owner order: no capability-only plans; stabilize and clean, component-authority first, no new Node unless needed, keep the node/rust/wasm router. Backlog row: p-52uy2agwoq (landed f1419d448); supervisor raised and woken.

## 1. How to get component-authority working early

Read from `plans/261121-2110-component-authority-doors/plan.md` (running; only phase 1, `fgos authority locate`, is done; the other 21 rows are draft). Not verified by me: code state, which I do not read.

- Today the plan only lets an agent *find* the existing door. Nothing stops a new second door at plan time or at land time, so doors keep appearing while the retirement phases run.
- The mechanism that stops new doors is split across two phases: phase 5 (`declare`, the plan-time mapping rule, skill wiring), which needs only phase 1b, and phase 10 (the land check), which waits for 17 other phases (all retirements).
- Proposal: run 1b then 5 first, then land a first version of the phase 10 check that blocks every NEW copy and counts the existing ones as named debt. The retirement phases (2a to 4, 6 to 9) then shrink that debt, and phase 10's final form (zero debt) stays last. After that, no new door can appear while the cleanup runs.
- Correction (owner, 15:2x): my first draft said these phases do not touch the router. That was not verified and is wrong: the plan footprints of phases 1, 2c, 5, 6, 7 and 11 include routing files (command registry, command-routes, command-manifest, `route.rs`, `routing.rs`). Rule instead: the router stays one set over node, rust, wasm and external CLIs; moving Node to Rust never removes it; each such phase proves all four caller kinds still route.

## 2. Suggested order

1. Keep running: heads-stable-and-able (the supervisor and secretary must be steady first) and component-authority-doors, reordered as above.
2. Stability rows to take next, from the backlog: p-l57a7tjhu7 (~89 GB of retained land chains), p-olifa4mlty and p-mxhphe4kga (tests leak temp dirs), p-mfllw32ynj (config set can overwrite tracked config), p-q2dn2cnzlq (unpushed commit blocks later lands), p-24xw2cwdvo (delete dead Node execution modules; fewer Node, in line with your order).
3. Ready plan 261123-0828-head-stop-rotation-bad-measure is a bug fix for heads; I suggest it goes with step 1.
4. Held until you lift the hold: the draft capability plans (orchestration-skeleton, agent-start-context, owner-communication-standard, docos-pkm-locate-door, coach-agent, mailbox v6/v7, and similar).

## Open

- Does the owner agree to split phase 10 so a "no new copies" check lands right after phase 5?
- Does the owner agree to the step-2 list as the stability set, or want rows added or removed?
