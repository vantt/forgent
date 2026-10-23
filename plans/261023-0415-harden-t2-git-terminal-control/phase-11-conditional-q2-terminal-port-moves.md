---
phase: 11
title: "Conditional on Q2 = (a): the last pane access moves behind the terminal-control port (anchor pane, agent kinds and integrations, socket path, caller ownership on attach)"
status: pending
condition: "runs only if the owner answers yes to Q2 with option (a); with (b) or no answer it does not run and phase 09's spec exceptions stand"
depends_on: [09]
parallel: "with phases 10, 12, 13, 15 (disjoint files); before 16 if both run (same driver file)"
effort: ~1.5d
net_size: "Node −120 / Rust +90 / tests ±0 (estimate; each move ships its delete in the same commit)"
---

# Phase 11 — Conditional Q2 (E-10, E-11, E-12, E-17)

## Context

Arbitration §6 Q2 and §3 verdict 6 (moves that add answer fields: owner's call under RUL104). Simplicity E-10..E-12, E-17 and its proposed additions 1–3; red-team: `pane-owned.sh` goes only when `attach` checks ownership; the driver must become the only writer of the socket literal (L10). **Runs only if Q2 = (a).**

## Requirements (four moves, four commits, each with its delete)

1. **Anchor pane (E-10).** `capabilities` takes the caller's `FGOS_HERDR_ANCHOR_PANE` in the envelope `env` (the route already carries `env`, `route.rs:155-173`) and answers `anchorPane: {state: "resolved"|"unresolvable"|"absent", reason?}` from the driver's existing `pane get`. Delete `checkAnchorPane` and the `execFileSync` import (`src/setup/terminal-control-checks.mjs:12,22-40`); the `terminal-control` row reads the answer (empty value stays a Node check: it is the env var's shape).
2. **Agent kinds and integrations (E-11).** `capabilities` answers `agentKinds: [...]` and `integrations: {...}` parsed in the driver from `herdr agent start --help` and `herdr integration status`, with `unknown` when herdr's text cannot be parsed. Delete `defaultHerdrRun` and the two scrapers (`src/setup/registrations.mjs` `herdr-executor-kinds` block, seat `:4364-4396`; re-grep); the row keeps its id and conditions with injected data. Driver fixtures for both texts in `herdr_driver_fixtures.rs`.
3. **Socket path (E-12).** The driver derives the socket from the session name (`HERDR_SESSION`) using herdr's layout, and `capabilities` answers `endpoint.socketPath`. Delete the layout literals `src/runner/dispatch/worker-session.mjs:62-66` and `src/runner/dispatch/confinement/resources.mjs:187-190`; `worker-session-boot.mjs` asks the route for the path (a route that does not answer is `unknown`, as phase 2's CF01 rule already handles). Node passes the session name only. After this commit `rg -n "herdr\.sock|\.config/herdr|'\.config', 'herdr'" src` finds nothing.
4. **Caller ownership on `attach` (E-17).** <!-- Updated: Red Team 2026-10-23 - caller identity from the OS, not the payload -->
   - The core learns the caller from the OS, never from a pid field in the request.
     - The route host is a child of the caller, so its **parent process tuple** (pid, start time, boot) read through the Process identity door is the caller.
     - In process (the supervisor), the caller is the process itself.
   - The core walks that caller's ancestor tuples and requires the pane's shell to be one of them. A missing, unreadable or mismatched tuple refuses with `pane-not-owned`.
   - The check runs **before** `attach`'s early return for a key already bound to the pane (`core.rs:251-254`).
   - A route invoked through an intermediate wrapper (the skill's `fgos` shim) walks up from the host's parent, so the shim is part of the chain. The lead proves with one real-process test that the skill's `rename.sh` call path is accepted and that a sibling process holding the same `HERDR_PANE_ID` is refused.
   - Only when both cases are green does the same commit delete `plugins/fgOS/skills/terminal/pane-owned.sh` and its sourcing in `rename.sh:71-73` and `terminal-close/close.sh:18-20`. Otherwise `pane-owned.sh` stays and the move closes "kept by evidence".

## Tests

- Owning proofs: `herdr_driver_fake.rs` (one case per new answer field), `core_rules.rs` (attach refuses a non-owner; accepts the owner), `test/setup/terminal-control-checks.test.mjs` (row wiring with injected answers), `test/runner/dispatch-worker-session-boot.test.mjs` (path from the route).
- Retire: the Node anchor-pane cases that spawn a fake herdr (behaviour now owned by the driver case), the `herdr-executor-kinds` scrape cases (owned by the fixture cases), each named in the commit.

## Files

**Modify**: `packages/terminal-control/rust/src/{route.rs,core.rs,driver/mod.rs,driver/herdr.rs}`, `packages/terminal-control/contracts/{terminal-control.port.v1.json,driver-capabilities.v1.json}`, `packages/terminal-control/rust/tests/{herdr_driver_fake.rs,herdr_driver_fixtures.rs,core_rules.rs}`, `src/setup/{terminal-control-checks.mjs,registrations.mjs}`, `src/runner/dispatch/{worker-session.mjs,worker-session-boot.mjs,confinement/resources.mjs}`, `plugins/fgOS/skills/terminal/{rename.sh,terminal-port.sh}`, `plugins/fgOS/skills/terminal-close/close.sh`, `docs/platform/terminal-control/spec.md` (exceptions removed), tests above. **Delete**: `plugins/fgOS/skills/terminal/pane-owned.sh`, `checkAnchorPane`, `defaultHerdrRun` and scrapers, the two socket literals. **Tests to retire**: as above.

## Verification (exact)

`CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/t2-p11-target cargo test -p fgos-terminal-control -p fgos-run-supervisor`; Node one-file: `test/setup/terminal-control-checks.test.mjs test/runner/dispatch-worker-session-boot.test.mjs test/terminal-control/client-route.test.mjs test/terminal-control/contracts.test.mjs`; `rg -n "execFileSync\(.*herdr|'pane', 'get'|herdr\.sock" src plugins` → nothing; `wc -l src/setup/terminal-control-checks.mjs` ≤ 120.

## Net size

Node −120 (checks −20, registrations −33, worker-session/resources −15, `pane-owned.sh` −39, skill scripts −10). Rust +90 (four answers and the ownership check). Tests ±0.

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| Help-text parsing moves its fragility into the driver | M × M | Fixtures per herdr version; `unknown` answer instead of a guess |
| Ownership check refuses a legitimate caller (pid namespace, setsid) | M × M | Ancestor walk of tuples through the Process door; refusal names the tuples; skill falls back to "do nothing" as today |
| A caller forges ownership | L × H | Caller identity comes from the OS (host's parent tuple), never from the payload; check precedes the idempotent return; sibling-process refusal case |
| Boot cannot learn the socket path when the route is down | L × M | CF01 already fails `unknown` in that case; the error names the route failure |

## Rollback

Revert per move commit; each restores its Node/shell twin.

## Done when

Four moves merged with their deletes, greps clean, spec exceptions removed except the session-server start.
