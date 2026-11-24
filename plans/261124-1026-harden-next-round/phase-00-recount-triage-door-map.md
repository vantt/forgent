# Phase 0: Recount, triage and one-door map (gated)

Capability: `code:test` for steps 1–7, which are read-only and write reports only (D27). Step 0 is a model-data edit
(`code:implement`) of twelve door rows, added by the owner's order through the supervisor on 2026-11-24 (backlog
`p-gikx34d7bh`, D21, D22).

## Gate

Step 0 has no gate: it runs now, ahead of the rest (the two high rows first, D24, D25). Steps 1–7 start only when both
hold (O7, D6, D22, D27):

- `plans/261121-2110-component-authority-doors/plan.md` says `status: done` (12a, 12b and 12d landed; 12c was
  withdrawn there and moved into `261122-2108`);
- `plans/261122-2108-delete-dead-node-execution-closure/plan.md` says `status: done` (its phase 11 is the old 12c).

## Inputs

- `plans/discussions/ds-wqsrwmiier-harden-next-round/DISCUSSION.md`: §3 (H1–H7, C5, N4, N6, N13), §4 (D9, D13, D15,
  D21, D24), §6 (the inventory and the loop).
- `plans/discussions/ds-wham5txfkv-node-rust-port-inventory/DISCUSSION.md` §5 (the inventory method).
- `packages/component-authority/model/` (`components.yaml`, `layers.yaml`, `contracts.yaml`, `decision-kinds.yaml`,
  `doors/`), and `fgos authority locate`.
- `test/architecture.test.mjs` (`NAMED_DOOR_DEBT`), `packages/host-runtime/contracts/command-routes.json`.
- The HARDEN root closing report: `plans/reports/closing-261118-1344-harden-root-closing.md` (§1–§7).

## Files it may write

`plans/261124-1026-harden-next-round/reports/phase-00*` (for example `reports/phase-00-recount.md`). Step 0 only: the
`retiredBy` line of the twelve files under `packages/component-authority/model/doors/` named in its table, and
nothing else in them.

## Steps

0. **One owner on every door row (`p-gikx34d7bh`, D22; no gate).** Set the `retiredBy` of each row below to the value
   given, a YAML double-quoted string, changing no other line. Each value starts with exactly one owner: a plan id
   (with its phase), a phase of this plan (`261124-1026-harden-next-round#T2-T3|T6|T7|T8|T9`) or a backlog id. The
   owners were checked on `main` at `7d94c27cf`; the row's own facts say why.

   | Row (file) | Severity | New `retiredBy` (owner first) | Why this owner |
   |---|---|---|---|
   | `skill-generated-stamp` | high | `p-6ectcp6jyg: the skill assembly render moves to Rust over skill_stamp.rs, and src/setup/skill-wrappers.mjs and its caller in src/setup/registrations.mjs go` | the backlog row's done-when removes this row |
   | `footprint-write-scope-overlap-rule` | high | `261122-2108-delete-dead-node-execution-closure#phase-11: dispatch moves onto the write-scope package and src/runner/dispatch/write-scope.mjs goes` | that phase's footprint already holds this row and `src/runner/dispatch/write-scope.mjs`; `p-taifrvti2x` asks to point here when it does (D22: write-scope rule → `261122-2108`) |
   | `kernel-lock-primitive` | medium | `261124-1026-harden-next-round#T7: the git node-addon and its single-load marker go with the legacy-node payload, which phase T7 removes; moving the marker onto a holder-lock resource earlier would make an addon load create or require the per-user state root` | doors 12a stopped on that state-root cost (doors report `unit-261124-0905-p12a-s2-result.md`); the doors plan is closed |
   | `run-bounded-child` | medium | `p-tvwy24txpj: one spawn.rs extension (caller-owned containment, an output cap, descriptor closing) retires the three debt entries; if the owner declines it, the entries record that decision as their reason` | it pointed at a report; the backlog row is the owner |
   | `no-node-from-native-packaging` | medium | `261124-1026-harden-next-round#T9: the release manifest drops requires.node and fgctl's preflight stops asking the Node on PATH for its version` | D22: packaging → T9 |
   | `process-control-signal` | medium | `261124-1026-harden-next-round#T9: the frozen mailbox measurement module moves onto the process door; each allowed Node own-child group kill goes in the sub-plan of the layer phase that moves its spawner to Rust` | D22 names "the phase that moves each spawner"; the one debt entry is a script (`scripts/lib/mailbox-live-confined.mjs`), which T9's scripts sweep owns |
   | `main-checkout-activity-beacon` | low | `261124-1026-harden-next-round#T2-T3: the pre-commit hook's writer and the commit gate's reader (src/runner/main-checkout-activity.mjs) move to Rust with the main-checkout hook verdicts` | D12 puts the main-checkout hook verdicts in T2–T3 |
   | `delete-guard-keyword-list` | low | `261124-1026-harden-next-round#T2-T3: the Node main-checkout delete guard moves to Rust and its test matcher over the prefilter data goes with it; the Node twin src/setup/agent-hooks.mjs is already deleted` | `src/setup/agent-hooks.mjs` is gone; the copy left is the delete guard's test (D12) |
   | `agent-hook-table` | low | `261122-2108-delete-dead-node-execution-closure#phase-08: src/setup/agent-hooks.mjs is already deleted; the Node readers left (src/run-supervisor/trust-store.mjs, src/runner/dispatch/worker-home.mjs) go with the dead Node Execution closure, or that phase names the layer phase that keeps them` | its old clause is done; the Node files left are in the closure that phase sorts, and its step 3 names the owner of a live one |
   | `read-and-clear-a-hot-mutex-record` | low | `261124-1026-harden-next-round#T7: the Node record writer in src/state/hot-lock.mjs moves with the Work state store` | the Work state store is T7 |
   | `canonical-json-bytes` | low | `261124-1026-harden-next-round#T9: the release-manifest pair moves to Rust as one, and the other Node exceptions the component-boundary row names go with the Node modules that hold them` | the pair is packaging (T9), the last Node module goes at the latest there |
   | `retired-node-s5-hook-script` | low | `261124-1026-harden-next-round#T9: the packaging council decides when no install that wrote the old dispatch hook entry remains, and the legacy marker goes` | upgrade of old installs is packaging |

   Verify step 0 with the three checks of acceptance criterion 10 in `plan.md`. Then report which rows each owning
   plan's acceptance must list: this plan's phases 1, 4 and 5 already list theirs; `261122-2108` phases 8 and 11 and
   backlog rows `p-6ectcp6jyg` and `p-tvwy24txpj` already remove theirs in their own done-when.
1. **Recount (D9).** Rerun the ds-wham5txfkv §5 method on current `main`. Produce the §6 table again: area,
   component (tier), kind, files and lines, tests, what Rust owns, live callers, owning phase of this plan. Record the
   main SHA, the `legacy-cli` route count and `git ls-files 'src/*.mjs' 'bin/*.mjs' | wc -l`.
2. **H5 (N6).** Run alone: `node --test test/cli/fgos-workflow.test.mjs` and the instruction-projection test the
   HARDEN closing report §5 names. Record pass or fail for each.
3. **Triage (D13).** For every component in the recount, write the council weight (full, light or skip) and the reason,
   by the rules of discussion §3 row N7: full when authority, contracts or door are unsound (status `designed`,
   per-file layer exceptions, contract evidence pointing at Node, door debt, a `mustNotOwn` breach sign, more than one
   door for a job); light when only inside work remains; skip for a facade, thin client or dead code (D1). T7 Work is
   always full.
4. **One-door map (D15).** For every job in the model (`owns`, `mustNotOwn`, decision kinds, contracts, door rows),
   list every door that does it, over `src`, `bin`, `scripts`, `apps`, `packages` and the hooks, Node and Rust. Mark
   the door kept (the lowest layer that needs it) and the phase that deletes each extra door. A job the model lacks is
   listed for the model's owner, not added here.
5. **Assign the named debt (D21, D22).** Each door row whose `retiredBy` names S6b or S7 gets one phase: T6, T7 or T9.
   Include the severity each row carries (D24).
6. **Confirm N4:** T8 is the `supervision` component. Name C5's stale tier name for phase 2.
7. Write the report and update this plan's phase 1–5 files only if the recount moves a row between phases (note it in
   the report; this phase writes no other file).

## Verify

Step 0: acceptance criterion 10 of `plan.md`. Steps 1–7: The report contains, on one recorded SHA: the recounted table, the two H5 results, the triage column for every
component, the job → doors map, the phase for each of the S6b/S7 door rows, and the N4 answer.

## Rollback

Step 0: revert its commit (twelve `retiredBy` lines). Steps 1–7: delete the report.
