---
id: ds-wham5txfkv
title: "Inventory every live Node area and order the Rust port, one plan per area"
status: open
source:
  - p-vwpnx4gpow
created: 2026-11-23
---

discussion: open

## 1. Trạng thái hiện tại

Round 1 (2026-11-23 14:21–14:50, shaper head). The scout is done and the full inventory table is in §6. Every
`src/` area has a row: 323 `.mjs` files, about 80k lines, mapped to the component model
(`packages/component-authority/model/components.json`).

Findings that shape the design:

1. **Two kinds of rows, not one.** About half the areas (tier 0–3: `native`, `holder-lock`, `git`, `config`,
   `event-store`, `observe`, `identity`, `convention`, `terminal-control`, `seat-binding`, most of `util`) are
   already **thin Node clients or facades over a Rust crate**. Rust owns the policy, and the Node file exists only
   because Node callers above it still exist. There is nothing to port in them. They can only be **deleted**, and
   only after their last Node caller is gone. The other areas hold **real logic with no Rust twin yet**
   (`workflow`, `state`/`intake`/`evolve`, `runner` tier 7, `verbs`, `report`, `session-host`, `session-rotation`,
   most of `setup`, `cli`).
2. **So literal bottom-up runs backwards for deletion.** Porting logic goes bottom-up, but deleting facades goes
   top-down, because a facade dies with its last caller.
3. The remaining rows of the owner-approved program `261114-2051-rust-verb-migration-program` are S1 (hook
   verdicts), S6b (Workflow) and S7 (Work). This inventory sizes those rows; it does not reorder them.

Provisional calls (§3 rows P1–P4) are recorded and not yet minted. The first one needs a second round before it
gets a D-ID. No owner question is open. Next round: re-verify the facade claim against callers file by file, check
whether the Work council (decision 78) has been held, then mint D-IDs and settle.

## 2. Mục tiêu & đề bài

Backlog row `p-vwpnx4gpow` (owner order of 2026-11-23 14:21) asks for one table listing every Node area still live in
`src/` with its tests. Each row gives files and tests, what Rust already owns, live callers, the target Rust
component, and dependencies. The rows are ordered bottom-up per the owner port order of 2026-11-14: packaging-distribution first,
then lower layers before upper. After the table, one plan per area is opened, one at a time, in that order. The dead tier-5 Node
closure has its own plan (`261122-2108-delete-dead-node-execution-closure`) and is excluded. Every plan must be clean
and cause no impact. It moves all callers and deletes the Node path and its tests in the same change (L10, design
principles 1 and 8), never leaves a twin, and is sequenced around the footprints of running plans
(`261121-2110-component-authority-doors`, `261122-0118-heads-stable-and-able`) so nothing collides. The owner port
order of 2026-11-14 is the program plan `plans/261114-2051-rust-verb-migration-program/plan.md`. Its "Order
(owner-approved, do not reorder)" is F0 → S2‖S3 → S4 packaging → S5 → S6a → S6b Workflow → S7 Work, with S1 hooks
allowed to run beside any step. F0 through S6a have landed (S6a ended after its facades on 2026-11-22, D-ADR0083).

## 3. Vấn đề rõ / chưa rõ

| # | Point | State | Evidence / note |
|---|---|---|---|
| C1 | Count: 323 `.mjs` in `src/` | clear | sums per directory in §6 match |
| C2 | Owner order of 2026-11-14 = program plan `261114-2051` | clear | plan.md "Order (owner-approved, do not reorder)" |
| C3 | Dead tier-5 Node excluded | clear | `261122-2108` footprint: `src/runner/dispatch/**`, `src/runner/execution/**`, `src/run-supervisor/**`. 62 of 89 files dead; the 27 live ones stay for Workflow (S6b), setup/session-head (S7) and the frozen mailbox harness |
| P1 | **Facade rows get no plan of their own.** A Node client or facade over a Rust crate is deleted inside the plan that removes its last Node caller. Its row in §6 names that plan. | provisional (round 1) | L10 and design principle 1 (one door) forbid deleting a facade while a caller remains. Porting it would create a second Rust caller path. Headers confirm Rust owns the policy: e.g. `src/git/*.mjs` "Typed transport only; authority and Git policy remain in Rust", `src/holder-lock/hold-transport.mjs` "Node cannot call LockFileEx", `src/config/facade.mjs` |
| P2 | **"Packaging first" = the setup pieces whose layer already lives in Rust or that have no layer.** Those are instruction registry/composition/projections, agent hooks, skill wrappers, agy permissions, bin discovery, shell rc, git hooks and mailbox limits. Doctor rows of a layer still in Node (`seat-binding-checks`, `workflow-case-checks`, `workflow-catalog-reader`, `blind-steps-proven-pools`, and the bridged rows in `registrations.mjs`) stay on `doctor-bridge.mjs` and move with their layer's plan. The bridge is deleted with the last such row. | provisional (round 1) | AGENTS.md install gate: "a row of a layer still in Node is bridged"; S4 plan "Items for the program plan" assigns bridged rows to S5/S6a/S6b/S7 |
| P3 | **One plan per component of the model**, not per `src/` directory. The `work-state` component spans `src/state` + `src/intake` + `src/evolve`, and `host-surface` spans `src/cli` + `src/verbs` + `bin/`. | provisional (round 1) | `components.json` `paths` |
| P4 | This inventory sizes the program's remaining rows (S1, S6b, S7) and splits S7 into its components. It does not reorder the owner-approved order. | provisional (round 1) | program plan: "S1-S7 each get their own detailed plan … when they start" |
| O1 | S7 entry gate "Work council (decision 78) held": status unknown | open, blocks only §7 task-work-state | to check next round |
| O2 | `session-host` / `session-rotation` are being edited now by `261122-0118`, `261122-2307` (done) and `261123-0828` (ready) | open, blocks only their own plans' start | footprints read 2026-11-23 |
| O3 | `src/util/yaml.mjs` vs the `yaml-doc` crate: is it being retired by `261121-2110-component-authority-doors` ("Rust crate the only reader of the YAML model")? | open | commit `bea353689` |
| O4 | Test counts in §6 are "test files that import the area", so a test can count under several areas. Backlog says 588 test files in all. | clear (method stated) | scratchpad script, method in §5 |

## 4. Quyết định đã chốt

| D-ID | Decision | Rounds held | Source |
|---|---|---|---|
| (none yet) | | | |

## 5. Q&A log

- **2026-11-23 14:21 — round 1, scout.** Read backlog `p-vwpnx4gpow`, program plan `261114-2051`, the dead-closure plan
  `261122-2108`, the component model, and the footprints of every running or ready plan. Method for §6: one Python pass over
  `src/ bin/ scripts/ test/ .githooks/ packages/ apps/` that resolves every relative `import` and counts, per `src/` area,
  its files, its lines, the test files that import it, and the product files outside the area that import it. The
  dispatch and execution subdirectories of `src/runner` are split out. Each file's header comment was read to classify
  it as facade or logic. Result: the facade-versus-logic split (§1 finding 1) and provisional calls P1–P4. No owner question
  was needed; P1–P4 follow from L10, design principle 1, and the S4 bridge rule.

## 6. Thiết kế đã chốt {#design}

*Draft, round 1. Not settled until P1–P4 hold a second round.*

### Shape

The remaining Node code retires in **logic plans**, run bottom-up by tier: packaging first, then each logic area from
the lowest tier up. Each logic plan ports its area into its Rust component, moves every caller, and deletes the Node
area, its tests and every **facade** whose last caller it removed. Facade rows have no plan. Each one names the plan
that deletes it, which is the plan of its highest-tier caller. The host surface (`src/cli`, `bin/fgos.mjs`, the
`legacy-node` payload) goes last, once no `legacy-cli` route is left (56 of 86 routes are still `legacy-cli` today, per
`packages/host-runtime/contracts/command-routes.json`).

```mermaid
flowchart BT
  subgraph F[Facades: no plan, deleted with last caller]
    native[native t0] --- hl[holder-lock t1] --- cfg[config t1] --- conv[convention t1] --- id[identity t1]
    git[git t2] --- tc[terminal-control t2] --- es[event-store t3] --- obs[observe t3] --- sb[seat-binding client t5]
    util[util leaves t0]
  end
  pk[1 packaging setup] --> sr[2 session-rotation t2] --> sh[3 session-host t3] --> wf[4 workflow t6 = S6b]
  wf --> ws[5 work-state t7 = S7 core] --> rn[6 runner t7] --> vb[7 verbs/merge] --> rp[8 report t9] --> sup[9 portfolio t8]
  sup --> hs[10 host-surface: cli + bin + legacy-node payload]
  S1[S1 hook verdicts: any time] -.-> hs
```

### Inventory (one row per area)

Legend: **kind** L = logic to port, F = facade/client over Rust, D-rest = what the dead-closure plan leaves.
*tests* = test files importing the area. *Callers* = product files outside the area that import it.

| # | Area (`src/`) | Component (tier) | Kind | Files / lines | Tests | What Rust owns today | Live callers | Target Rust component | Retired by |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `setup` (17 files) | packaging-distribution (9) | L + bridge | 17 / 5150 | 25 | `packages/distribution` (init, doctor, wire-agents, uninstall native since S4); `apps/fgos/src/wiring/doctor` | scripts (5: `build:skills` and friends), verbs (1), Rust host → `doctor-bridge.mjs` | `packages/distribution` | **plan 1** for non-bridge pieces (P2); bridged rows move with plans 4, 5 and 6; `doctor-bridge.mjs` with the last |
| 2 | `util` (23) | platform-foundations (0) | F/leaf | 23 / 1130 | 78 | `durable-file`, `canonical-json`, `yaml-doc`, `identity`, host-bin resolution in `apps/fgos` | almost every area | none (leaves die) | each leaf with its last caller; `yaml.mjs` see O3 |
| 3 | `native` (8) | process (0) | F | 8 / 1129 | 53 | `packages/process`; the combined addon | workflow 27, dispatch 19, many | none | the last plan (10), since it is the Node→Rust door itself |
| 4 | `config` (1) | config (1) | F | 1 / 127 | 15 | `packages/config/rust` | 11 areas | none | with its last caller |
| 5 | `convention` (4) | convention (1) | F | 4 / 146 | 3 | `packages/convention/rust` | workflow, runner, scripts (3) | none | plan 4 or 6; scripts need a Rust verb or a direct crate call |
| 6 | `identity` (1) | identity (1) | F | 1 / 16 | 0 | `packages/identity/rust` | none found by import | none | possibly dead now; check in round 2 |
| 7 | `holder-lock` (9) | holder-lock (1) | F | 9 / 1789 | 50 | `packages/holder-lock/rust` (policy, Windows `LockFileEx` via `fgos internal lock-hold`) | git (12), runner, dispatch, workflow, state, `.githooks` | none | with its last caller (plan 6 or 10) |
| 8 | `git` (13) | git (2) | F + one logic file | 13 / 796 | 26 | `packages/git/rust` + node-addon | runner, workflow, state, scripts (11) | `packages/git` | facades with their last caller; `main-checkout-delete-guard.mjs` (505 lines of logic) = **S1** |
| 9 | `terminal-control` (2) | terminal-control (2) | F | 2 / 284 | 3 | `packages/terminal-control/rust` | dispatch (live rest), scripts | none | with dispatch's live rest |
| 10 | `session-rotation` (2) | session-rotation (2) | L | 2 / 811 | 2 | `packages/session-host/rust/src/rotation`, `wiring/session_rotation_hook.rs` | session-host | `packages/session-host` | **plan 2** |
| 11 | `event-store` (6) | event-store (3) | F + seal policy | 6 / 468 | 14 | `packages/event-store/rust` (maintain since F0) | state (4), verbs, runner, scripts | none | with work-state (plan 5) |
| 12 | `observe` (3) | observe (3) | F | 3 / 270 | 3 | `packages/observe/rust` | state, verbs | none | with plan 5 or 7 |
| 13 | `session-host` (7) | session-host (3) | L | 7 / 2127 | 13 | `packages/session-host/rust` (panes, route, host) | session-rotation, dispatch, bin | `packages/session-host` | **plan 3** |
| 14 | `run-supervisor` (12), `runner/dispatch` (54), `runner/execution` (23) | run-supervisor (4), dispatch/exec (5) | D-rest | 89 / 26.8k, of which 27 live after `261122-2108` | 181 | `packages/run-supervisor`, `packages/execution` (S6a) | live rest: workflow, setup, session-host, mailbox harness | `packages/execution` | dead part: `261122-2108`; live rest: plans 3, 4 and 5; mailbox-harness reach: mailbox lane |
| 15 | `seat-binding` (1) | seat-binding (5) | F | 1 / 232 | 6 | `packages/seat-binding/rust` | workflow, setup, dispatch | none | with plan 4 |
| 16 | `workflow` (32) | workflow (6) | L | 32 / 7469 | 54 | none (no crate) | state, setup, runner, bin | new Workflow crate (spec `docs/platform/workflow/`) | **plan 4 = S6b** |
| 17 | `state` (34), `intake` (6), `evolve` (1) | work-state (7) | L | 41 / 12.9k | 134 | `packages/work-state/rust` (event reader, work source only) | verbs (13), runner (13), report, setup, bin | `packages/work-state` | **plan 5 = S7 core**; gate O1 |
| 18 | `runner` top level (34) | runner (7) | L | 34 / 10.6k | 70 | parts in `apps/fgos/src/wiring` (lock, worktree, agents) | verbs (9), setup, workflow, bin, `.githooks` | `packages/execution` / work-state, per file | **plan 6 = S7 runner** |
| 19 | `verbs` (14) | host-surface (9) | L | 14 / 2457 | 16 | events verbs native (S3) | bin | `apps/fgos` wiring | **plan 7 = S7 merge/state verbs** |
| 20 | `report` (10) | learning-docs-registry (9) | L | 10 / 2058 | 10 | none | state, setup, verbs, bin | new crate or `packages/documentation` | **plan 8** |
| 21 | `portfolio` (1) | supervision (8) | L (tiny) | 1 / 19 | 0 | `packages/supervision/rust` (portfolio, queue, land) | scripts (1) | `packages/supervision` | **plan 9** (or folded into 8) |
| 22 | `cli` (5) + `bin/*.mjs` (2) | host-surface (9) | L | 5 / 3316 + bin | 20 | `apps/fgos` routing/help (F0) | bin, scripts | `apps/fgos` | **plan 10**: zero `legacy-cli` routes, `legacy-node` payload removed |

Out of `src/` but in scope because the same plans touch them: `packages/portfolio/*.mjs` (5 Node files, with plan 9),
and `scripts/*.mjs` callers of `src/` (each plan moves its own script callers).

## 7. Danh mục hạng mục / task {#tasks}

*Draft order. Each entry becomes one plan, opened one at a time.*

### 1. Packaging remainder {#task-packaging}
Goal: port the setup pieces in P2 into `packages/distribution`, move their script callers (`build:skills` and friends), and
delete them. Collision: `261121-2110-component-authority-doors` holds 6 `src/setup` files, so start after it lands.
Verify draft: `npm test && cargo test --workspace`; `git ls-files src/setup` lists only the bridge files.

### 2. Session rotation {#task-session-rotation}
Goal: `rotate.mjs` and `handoff-store.mjs` into `packages/session-host` rotation. Collision: `261122-0118` and `261123-0828`.
Verify draft: `git ls-files src/session-rotation` is empty.

### 3. Session host {#task-session-host}
Goal: the head request, start, stop, plan and grants logic into `packages/session-host`; also the dispatch live-rest
reached only from heads. Depends on 2. Collision: `261122-0118`, coach-agent draft `261122-2110`.

### 4. Workflow = S6b {#task-workflow}
Goal: `src/workflow/**` into a Workflow crate; delete the seat-binding client and the dispatch/execution live rest
reached from `definition.mjs`; move the Workflow doctor rows off the bridge. Collision: orchestration-skeleton draft
`261122-0056` (6 workflow files).

### 5. Work-state = S7 core {#task-work-state}
Goal: replay first, then writers behind the §11 gates; delete `src/state`, `src/intake`, `src/evolve` and the
event-store/observe facades. Gate: O1.

### 6. Runner tier 7 {#task-runner}
Goal: `src/runner/*.mjs` (loop, operation-choice, merge, work-dispatch, ...) and `bin/fgos-runner.mjs`.

### 7. Merge and state verbs {#task-verbs}
### 8. Report / learning-docs registry {#task-report}
### 9. Portfolio leaf {#task-portfolio}
### 10. Host surface: cli, bin, legacy-node payload, native door, last util leaves {#task-host-surface}

S1 (hook verdicts: `main-checkout-delete-guard.mjs`, `state/decision-question.mjs`, `runner/hook.mjs`) may run beside any of
these, as the program allows.
