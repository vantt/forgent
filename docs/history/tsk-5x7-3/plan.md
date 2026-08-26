# plan.md — tsk-5x7-3 (piece 2: herdr-spawn adapter, protocol untouched)

Per-item risk map for this `risk: heavy` child of `tsk-5x7`. The full split,
locked decisions, and cross-piece footprint/deps rationale live at
`docs/history/dispatch-plan-protocol-redesign/plan.md` (the parent item's
shared plan) — this file is the item-specific record `assertPlanEvidence`
requires on `fgw/tsk-5x7-3` before `delivered` (`src/state/store.mjs:620`),
distilling the piece-2-specific rows already written there plus what was
actually verified during implementation.

## Scope

Per D3 and D6: add a `herdr-spawn` entry to `EXECUTOR_ADAPTERS`
(`transport.mjs`) that launches the worker inside a Herdr pane instead of a
stdout-captured subprocess, so a person can watch the agent work. Selected
purely by `executor.adapter` — the executor keeps `invocations[].via:"cli"`,
so `resolve.mjs`'s cli gate passes unchanged and no protocol work was
required. Results come back through the existing ladder (structured, else
`[DONE]`/`[BLOCKED]` token, else `headBefore`/`headAfter` git inference) —
this piece introduces no new result protocol and no telemetry claim.

**Hard constraint carried from validating (tsk-1nih, live evidence):** the
adapter must ALWAYS create a fresh pane (`herdr pane split`) and must NEVER
reuse an existing one — `herdr pane run`/`send-text` types into whatever
process currently holds the pane, and a reused pane could deliver the next
dispatch as a chat message into someone else's live session. Confirmed
enforced by test: "herdr-spawn adapter ALWAYS creates a fresh pane (hard
constraint C1 / tsk-1nih) and never reuses".

**D2's surviving hard constraint, also asserted in test:** a Herdr runtime
signal alone never changes task status, review outcome, blocker resolution,
or artifact acceptance — only fgOS state transitions do.

Full design narrative: `docs/history/dispatch-plan-protocol-redesign/
DISCUSSION.md#task-herdr-spawn-adapter`.

## Risk map (from parent plan.md's own table)

| Component | Risk | Why heavy |
|---|---|---|
| `herdr-spawn` executor adapter | **heavy** | a reused-pane bug delivers a dispatch as a chat message into someone else's live interactive session — the sharpest case parks an unrelated item at `awaiting-human` for the wrong reason |

## Verification actually done

- `node --test test/runner/herdr-spawn-adapter.test.mjs` — 5/5 pass:
  adapter registration + config validation, always-fresh-pane hard
  constraint (C1/tsk-1nih), `MAX_DISPATCH_DEPTH` nested-dispatch cap
  respected, timeout handling via `DispatchError('worker-timeout')`, D2
  hard-constraint assertion (a Herdr signal alone never mutates task
  status/state transitions).
- `node --test test/runner/dispatch.test.mjs` — 322/322 pass (existing
  `EXECUTOR_ADAPTERS` keys assertion updated for the new entry).
- Iron Law evidence (`docs/history/tsk-5x7-3/iron-law-evidence.md`): real
  failing-before (`'herdr-spawn' in EXECUTOR_ADAPTERS` false, `herdrSpawn is
  not a function`) / passing-after (5/5 + 322/322) transcript, classified
  `required: true` against `src/runner/dispatch/transport.mjs`.
- Dispatched out-of-process (`agy`); driver confirmed the worker's own
  commit was real and the tree clean (`git log`, `git status`), and —
  learning from `tsk-5x7-2`'s evidence-capture incident — additionally
  diffed the implementation commit against the evidence commit
  (`git diff 25999942 603149ea -- src/runner/dispatch/transport.mjs`,
  empty) to confirm this worker's evidence capture did NOT revert the
  implementation this time.
- `node --test test/architecture.test.mjs` — 6/6 pass; no manifest gap this
  time (no new `src/`-tree file, `transport.mjs` already had a row).

## Outcome

Delivered as the last of the three dependency-free children `tsk-5x7`
decomposed into (D6). No scope cut. `tsk-5x7` itself is ready to land into
its own trunk target once this piece is approved — `tsk-5x7-1` and
`tsk-5x7-2` are already `delivered` on `fgw/tsk-5x7`.
