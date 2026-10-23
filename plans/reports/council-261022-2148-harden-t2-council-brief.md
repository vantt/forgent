# HARDEN T2 council brief (shared by every seat)

Big lead: session `forgent-a8`, 2026-10-22 22:00 (Asia/Saigon). Repository: `/home/vantt/projects/forgent`, branch `main`. T0 and T1 are merged; T1 is `c56f1eae3`. Reports go to `/home/vantt/projects/forgent/plans/reports/`. Timezone Asia/Saigon. You may answer in English.

This is the council for layer **T2** of the HARDEN lane: **Git** (the `fgos-git` crate, its N-API addon namespaces and the `src/git/*` facade) and **Terminal-control** (the `fgos-terminal-control` crate and every Node site that reaches a herdr pane). You are one seat. You are **read-only**: edit no source, test, spec or config file, and make no git mutation. The only file you may write is your own seat report, at the path your seat prompt names. Out-of-process seats return the report as their final answer instead.

## Read first, in this order

1. `plans/reports/proposal-261021-0851-harden-review-criteria-and-method.md`: §2 (axes A–G, severity, evidence rule), §3 (gates 1–9), §4.3 (Rust move criteria) and §4.7 (dead code, tests, Rust priority).
2. `plans/261021-1118-harden-low-layers-bottom-up/plan.md`:
   - "The per-layer loop", step 2: what each seat returns;
   - "Size rule";
   - "Owner decisions" 1–13;
   - the two ledgers. Read rows H6, H17, H24, R2, R6, R8 and the known reds on main.
3. `plans/261021-1118-harden-low-layers-bottom-up/phase-03-t2-git-terminal-control.md`, the whole file. It holds the inventory, doctor rows, constraints and "Received from other lanes". Everything under R2 is in scope.
4. How T1 ended: `plans/reports/closing-261022-2003-harden-t1-holder-lock-identity-door.md`, especially §6, its hand-offs.
5. OPC, operation-scoped containment, which overlaps T2 in `packages/git/rust/src/driver.rs`'s contained branch:
   - `plans/reports/council-261022-1251-opc-arbitration.md`;
   - `plans/261022-1335-opc-phase-a-containment-fixes/plan.md`, Phase A landed on main;
   - its phase 05 report, when it exists;
   - `plans/reports/research-261022-1341-opc-phase-a-baseline.md`.
6. Specs and laws:
   - `docs/platform/git/spec.md`, especially §12 (the one-door gate) and §15 E6 (the test inventory);
   - `docs/platform/terminal-control/spec.md`;
   - `docs/platform/process/spec.md` §10, the containment port;
   - `docs/platform/component-boundary.md`;
   - `core/instructions/design-principles.md`.
7. Backlog items that are inputs here: `p-d2dc4f2e`, `p-f97bb935` and `p-a178ca5c` in `docs/backlog.md`. They cover a brief typed into a pane's shell, and a pane run dying before the agent reads its brief. Take what landed for them as given, including `065cc620a` and `359274c62`, and do not redo it.

Then read **every line** of the code in scope:
- **Rust:**
  - `packages/git/rust/**` (≈ 35 k lines), `packages/git/node-addon/src/git/**` and the Git namespaces of `packages/git/node-addon/src/lib.rs`, plus `packages/git/contracts/`;
  - `packages/terminal-control/rust/**` and its contracts;
  - the host routes that serve them in `apps/fgos/src/**`.
- **Node:**
  - `src/git/*`;
  - `src/terminal-control/*`;
  - every Node site that reaches herdr or a pane outside the port. The starting inventory is `rg -l herdr src`, including `src/runner/dispatch/herdr-round.mjs`, `herdr-agent.mjs`, `herdr-deadlines.mjs` and `worker-session*.mjs`. Separate pane access that bypasses the port (T2) from caller logic (T5).

## Decisions already made (do not reopen)

- **Owner, 2026-10-21 12:05:**
  - foundations go fully to Rust, cost accepted; T0–T4 end with no deciding logic in Node;
  - Node reaches Rust through the **in-process door** where a hot path or a wait is involved; cold paths may keep a host route;
  - stop-everything landing;
  - old data needs one read path; fences and drains live one release.
- **Owner decision 10 (T1):** the checkout channel `node bin/fgos.mjs` is unsupported for process, lock and identity verbs. The same applies to any Git or terminal verb that T2 moves onto the in-process door.
- **OPC owns operation-scoped containment** (the deferred operation-domain capability) and its port. T2 does not design a second one. R2's fix is OPC's operation domain if R2's measurement reaches OPC's trigger, which is ≥ 100 ms of containment per worktree add. T2 measures; OPC designs.
- **Out of scope:**
  - Event Store internals (WORK/ES);
  - the run supervisor (T4);
  - dispatch and seat logic (T5);
  - CFG's census regression (`03c99bc61`);
  - Git's missing Windows build. It is an open Git item; a seat may note it but must not plan it.
- **WORK's branch `work/es-cutover`** removes `legacyEvents` from the Git ports (`790616298`) and lands only at the owner's cutover. Treat it as coming; do not propose changes that collide with it without saying so.
- **RUL104:** better, not bigger. No new feature, layer or mechanism. A contract change moves every caller and deletes the old path in the same change (L10). Put every idea that adds something into a separate "proposed additions" section, with the problem, the evidence and the benefit, for the owner to pick.

## What every seat returns

The same sections as the T1 brief (`plans/reports/council-261021-2338-harden-t1-council-brief.md`, "What every seat returns"):

- Part A: the target shape per component.
- Part B: findings, each with id, axis, severity, whether it is reproduced or inferred, `file:line`, what goes wrong, and the fix shape.
- The tables: migration, delete list, doctor, tests.
- Rejected hypotheses.
- The status block.

Put `git rev-parse --short HEAD` at the top. A finding without `file:line` is not a finding.

The components are:
- **Git.** Ask what in a 35 k-line crate can go: dead paths, duplicate drivers, unused ports. The phase file's Constraints notes that `checkpointTrackedFiles` has no Node caller left once WORK lands. Cover the Git doctor rows (8 plus `git-mutation-one-door`, and 4 fixes) and the one-door census.
- **Terminal-control:** its port, its herdr driver, and every pane access outside the port.
- **R2,** in the seat that measures. Report the per-worktree-add containment share (ms of bwrap/containment per `addWorktreeSync`), not the file time, measured end to end against the OPC baseline. Pair any fsync-bound timing with a plain fsync probe.

## Rules for every seat

- Read-only. Report only what you saw yourself, and say what you ran.
- Run only commands that read, plus focused tests if you need them to reproduce a finding.
  - `cargo test -p <crate>` must use a private `CARGO_TARGET_DIR` **on ext4** under `/home/vantt/projects/forgent-worktrees/<your-seat>-target`. **Never** put it under `/tmp`, and never share it with another checkout.
  - Run `node --test <file>` only after staging the addon the way `scripts/lib/git-addon-stage.mjs` `ensureGitAddon(env, cwd)` does.
- Never run the whole `npm test`; the machine is shared. Run every `fgos …` command with `</dev/null`.
- Hooks block the words `node_modules`, `.git`, `target` and `build` inside commands; put such paths in a shell variable.
- No `--yagni` flag was passed: deliver the full scope above, and add nothing it does not ask for.
