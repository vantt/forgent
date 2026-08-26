# plan.md — tsk-5x7-1 (piece 0: fix `decide --for`, minimal DispatchPlan, hoisted audit-event write)

Per-item risk map for this `risk: heavy` child of `tsk-5x7`. The full split,
locked decisions, and cross-piece footprint/deps rationale live at
`docs/history/dispatch-plan-protocol-redesign/plan.md` (the parent item's
shared plan) — this file is the item-specific record `assertPlanEvidence`
requires on `fgw/tsk-5x7-1` before `delivered` (`src/state/store.mjs:620`),
distilling the piece-0-specific rows already written there plus what was
actually verified during implementation.

## Scope

Per D1 and D6 (parent plan.md's Locked decisions), three layers in this one
piece, in this order so a green proof lands first:

- **(0a)** Fix the live bug: `cli.mjs`'s `decide --for` called
  `resolveExecutorIdForPurpose` and never read
  `capabilities.<name>.prefer` via `resolveExecutorAndOverrides` — routed
  through the latter so `decide --for fgos-coding-implement` now returns
  `executorId: "agy"`, `out-of-process`, `configured: true`, with
  characterization tests for all four selector forms written before the
  change.
- **(0b)** Added a MINIMAL `src/runner/dispatch/plan.mjs` exposing
  `compileDispatchPlan()`, which calls the existing
  `decideDispatchMechanism`/`decideExecutorDispatchMechanism`
  (`mechanism.mjs:42,82`) rather than re-deriving any routing rule, and
  packages `selector`/`caller`/`mechanism`/`executorId`/`capability`/
  `invocation`/`governance`/`reasonCodes`. Minimal per D6: only
  `decideExecutorCli` is ported in this piece — `spawnWorker`/
  `fanoutBatchExecutorCli`/the hook follow only when something needs them.
- **(0c)** HOISTED from the governance piece (`tsk-5x7-2`) at the
  footprint-overlap gate (person's call, 2026-08-25), because this piece
  already owns `cli.mjs` and already builds `plan.governance`: writes
  whatever `governance` payload `compileDispatchPlan` carries into the
  `executor.dispatch` audit event GENERICALLY (`logExecutorDispatch`,
  `cli.mjs:298`), so it stays empty-but-correct until `tsk-5x7-2` populates
  it. This is what keeps the two pieces genuinely independent — no
  ordering dependency, because this piece never needs to know the egress
  descriptor's shape.

Full design narrative: `docs/history/dispatch-plan-protocol-redesign/
DISCUSSION.md#task-dispatch-plan`.

## Risk map (from parent plan.md's own table)

| Component | Risk | Why heavy |
|---|---|---|
| `decide --for` routing fix + minimal `DispatchPlan` seam | **heavy** | live-verified routing bug (Finding #1) on the path every out-of-process dispatch in this repo goes through; a wrong fix silently mis-routes every future `decide --for` caller, not just this one |

## Verification actually done

- `node src/runner/dispatch.mjs decide --for fgos-coding-implement --dir "$PWD"`
  → `{"mechanism":"out-of-process","configured":true,"executorId":"agy"}`
  (was `{"mechanism":"unavailable","configured":false}` before the fix).
- `node --test test/runner/dispatch.test.mjs` — 322/322 pass, including the
  3 new/changed characterization tests for this piece:
  `decideExecutorCli resolves --for via capabilities.<name>.prefer
  returning executorId, out-of-process, configured:true (0a fix)`,
  `compileDispatchPlan builds a canonical DispatchPlan for all four
  selector forms (0b)`, `logExecutorDispatch writes governance payload
  into executor.dispatch event generically (0c)`.
- Iron Law evidence (`docs/history/tsk-5x7-1/iron-law-evidence.md`): real
  failing-before (missing `compileDispatchPlan` export, `decide` returning
  `unavailable`) / passing-after (322/322) transcript, classified
  `required: true` against `src/runner/dispatch.mjs`,
  `src/runner/dispatch/cli.mjs`, `src/runner/dispatch/plan.mjs`.
- Dispatched out-of-process (`agy`/`gemini-3.6-flash-medium`) via
  `dispatch.mjs execute`, per this repo's own dispatch-decide gate
  (`decide --work tsk-5x7-1 --has-live-task-access` returned
  `out-of-process`); driver confirmed the worker's own commit was real
  (`git log -1`, clean tree) before proceeding to Iron Law classification,
  per `coding-worker-contract.md` Layer 2.

## Outcome

Delivered as piece 0 of the three dependency-free children `tsk-5x7`
decomposed into (D6). No scope cut beyond what the parent plan.md already
records; `tsk-5x7-2` (governance) and `tsk-5x7-3` (herdr-spawn adapter)
remain open siblings at the time this piece lands.
