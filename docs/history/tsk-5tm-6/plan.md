# plan.md — tsk-5tm-6 (D4: fanout consults dispatch decision protocol, heavy risk)

Per-item risk map for this `risk: heavy` child of `tsk-5tm`, the last of
the 6-child split. The full split, ordering, and cross-child
footprint/deps rationale live at `docs/history/task-dispatch-unification/
plan.md` (the parent item's shared plan) — this file is the item-specific
record `assertPlanEvidence` requires on `fgw/tsk-5tm-6` before `delivered`
(`src/state/store.mjs:499`), distilling the D4-specific rows already
written there plus what was actually verified during implementation.

## Scope

`D4`: `fgos-fanout` (Flow A, in-session synchronous fan-out) hardcoded
native Agent-tool dispatch for every candidate in a batch, never consulting
the dispatch decision protocol `tsk-3ik` D3 already locked scope for. This
item extends that protocol's real usage to this producer and adds the
work-item-shaped lookup it needs (`D12(iii)`): `capacityIdForWork` exported
+ a `decide --work <id>` CLI flag, both consumed by the skill's own Loop
right before it fires each candidate.

Dependency (from the parent plan.md, unchanged): landed after
`#task-dispatch-self-execute` (D5, `tsk-5tm-3`) — the `execute` mechanism
D5 shipped is the real place an out-of-process decision would go, even
though this piece itself never calls `execute` (fgos-fanout has no
out-of-process firing path of its own; a non-in-process `decide` result is
reported back as needing a person instead).

## Risk map (from parent plan.md's own table)

| Component | Risk | Why heavy |
|---|---|---|
| Wire `fgos-fanout` to consult dispatch decision protocol before firing Agent batch (D4) | **heavy** | The only piece with an added-latency risk against an already-parallel dispatch path — a `decide` call per candidate, wired wrong, could turn the batch's parallel Agent-fire step sequential |

## Feasibility check (re-confirmed at implementation time, tsk-5tm-6)

Required proof (parent plan.md's own note on this piece): the
`decide`-before-fire step must stay inside `fgos-fanout`'s existing
per-candidate serial loop (max 5 members per batch, D8's trim rule) —
never a design that adds an unbounded or per-wave-unbounded synchronous
pass.

Re-read of `.agents/skills/fgos-fanout/SKILL.md`'s own Loop after editing
confirms this holds: the new `decided = ... decide --work <id>
--has-live-task-access` call sits as the FIRST statement inside the
existing `for each id in the batch` loop (the same loop that already ran
the announce-line print, pre-D4) — never a separate pass over the batch
before or after it. The parallel Agent-fire step
(`dispatch one Agent per id in firing, single message, running in
parallel`) is unchanged in shape; only the SET of ids fed into it can
shrink (a non-`in-process`/`unavailable` candidate is excluded and
reported instead of fired). A `decide` call is a single local CLI
subprocess reading the already-loaded runner config — no network call, no
lock contention with the parallel fire step that runs strictly after it,
never concurrently with it.

**Verdict: contained.** Same structural conclusion the parent plan.md's
feasibility matrix already reached at planning time ("PROVEN bounded"), now
re-confirmed against the actual post-implementation prose, not just the
pre-implementation design intent.

## Verification actually done (beyond the base `verify` command)

- `node --test test/runner/dispatch.test.mjs` — 215/215 pass (5 new tests
  added for this item: `capacityIdForWork` export/resolution,
  `decideCapacityCli` resolving via `work`, its precedence against a
  positional `capacityId`, its error on an unknown work-item id, and a
  full CLI-entry-point `decide --work <id>` end-to-end test against a real
  temp git repo + `.fgos` work-item store).
- `npm test` — 3281/3286 pass, 5 pre-existing unrelated skips.
- Iron Law evidence (`docs/history/tsk-5tm-6/iron-law-evidence.md`): real
  failing-before (module load error — `capacityIdForWork` not exported)/
  passing-after (215 pass) transcript, swapping `src/runner/dispatch.mjs`
  between the `fgw/tsk-5tm-5` merge commit and this item's own commit.
- Re-read of `.agents/skills/fgos-fanout/SKILL.md`'s Loop, Hard rules, and
  Red flags sections after editing, confirming the consult step's
  position and that the parallel fire step's own shape is untouched (see
  Feasibility check above).
- `plugins/fgOS/skills/fgos-fanout/SKILL.md` re-synced as the required
  byte-identical mirror (`test/skills/fgos-mirror.test.mjs`), confirmed via
  `diff`.
- GitNexus `detect_changes({scope:"all"})` before commit: `risk_level:
  "low"`, exactly the 4 intended files touched (`.agents/skills/
  fgos-fanout/SKILL.md`, its plugin mirror, `src/runner/dispatch.mjs`,
  `test/runner/dispatch.test.mjs`), no unexpected symbol drift.

## Deliberately out of scope (per plan.md's own verify-caveat note)

A live wall-clock timing run of a real fanout batch (multiple concurrent
Agents/worktrees dispatched in this repo) is out of scope for a
single-session implementation pass — the structural bound established
above (the consult step runs entirely before, never inside or after, the
parallel fire step) is what the risk map required to be closed at this
stage; an actual timing number is a live-operations concern for whoever
next runs a real fanout batch through this updated skill, not something
this item's own verify can produce synthetically without misrepresenting
it as a real measurement.

## Outcome

Delivered as-is — this is the last of the 6 children (`docs/history/
task-dispatch-unification/plan.md`'s chain: D1→D6→D5→D11→D9→D4). No scope
cut, no deferred follow-up beyond what the parent plan.md already notes as
future/separate concerns (D7's `AGENTS.md` dispatch-contract prose, and the
live wall-clock measurement noted above).
