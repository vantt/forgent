# Context: decision-schema-rationale-alternatives-source (tsk-63c)

## Feature boundary

Extend fgOS's `addDecision` verb and the `gates[id]` ask/answer fold with
a richer decision-capture schema, ported from bee's live
`.bee/decisions.jsonl` shape (701 real entries): `rationale` (required),
`alternatives` (optional), `source` (optional, free text), and `id`
(optional, per-item scoping). This supersedes the item's own stale
`description` field, which still describes only STR70a D4's narrower
"fold a `role` field into `gates[id]`" plan — `source` subsumes that ask
with more granularity, per the deep-dive cited below.

Out of scope for this item: `tsk-6b6`'s own `judgeDecompose`
verdict-recording work (depends on this item's `id`-optional shape, but
is a separate item); the structural CONTEXT.md gate / phase-graph
precondition change (deep-dive idea #4, needs its own `fgos-coding-exploring`
round per `tsk-47e`); bee's `type: supersede` mechanism (deep-dive idea
#3, needs `decision` to be id-scoped first — this item delivers that
id-scoping but does not itself add supersede semantics); the exact
in-memory/view shape of `view.decisions[id]` vs the existing global
`view.decisions` array (an implementation/architecture call, left to
`fgos-coding-planning`).

## Locked decisions

| ID | Decision |
|---|---|
| D1 | Scope is BROAD: extend `addDecision` with `rationale` (required)/`alternatives` (optional)/`source` (optional, subsumes STR70a's `role`/`actor` ask)/`id` (optional, already locked per decision seq 1206, renumbered by tsk-n4i-1; was 1190), fold the same 3 fields (`rationale`/`alternatives`/`source`) into `gates[id]`'s ask+answer payload (`replay.mjs:166-172`). Supersedes the item description's narrower role-only STR70a plan. |
| D2 | `rationale` is REQUIRED on `addDecision` (mirrors bee's throw-if-blank rule). `fgos decision` CLI gets a new required `--rationale` flag alongside `--text`. Breaking change accepted — grep confirmed `bin/fgos.mjs:1025` is the only existing caller; no other call sites to migrate. |
| D3 | `source` is FREE TEXT, no enum validation — matches bee's live convention (15 distinct real values in production) and fgOS's existing free-text `role`/`actor` string fields elsewhere. Defaults to `'session'` when omitted (per deep-dive), since fgOS calls are agent-initiated unless a human types the CLI directly. |

Prior decision cited, not re-locked here:

- **Seq 1190** (`.fgos/events.jsonl`, 2026-07-29, already applies to
  `tsk-63c`/`tsk-6b6`): `addDecision` accepts `id` as an OPTIONAL
  parameter, matching the existing `addOutcome`/`addFriction`/
  `addDiscovery` per-id pattern — folds into a per-id decisions view when
  `id` is present, falls through to the existing global bucket when
  absent.

## Pinned terms

- **`role`/`actor` ask (STR70a D4)** — the original, narrower plan this
  item's stale `description` still describes. Superseded by D1: `source`
  covers the same "who made this decision" need with more granularity,
  so no separate `role` field is added to `putInAwaiting`/the `ask` CLI
  case/`gates[id]`.
- **`source`** — free-text string on `addDecision`/`gates[id]`
  identifying who/what triggered the decision (e.g. `'session'`,
  `'human'`, `'judgeDecompose'`), not a validated enum.

## Scout evidence

- `docs/backlog.md:31` (STR70a) and `docs/history/gate-dialogue-continuity/CONTEXT.md`
  D2-D5 — the original, narrower `role`/`actor`-in-`gates[id]` ask this
  item's description still reflects.
- `docs/explanation/fgos-capture-points-and-the-why-gap.md:88-96` —
  confirms `gates[id]` today only carries `ask`/`answer`/
  `parentSnapshotAtAsk`/`statusAtAsk` (matches direct read of
  `src/state/replay.mjs:162-173`), and that the `actor`→`role` rename
  (STR46, `scripts/migrate-actor-to-role.mjs`) never touched this gap.
- `docs/distillery/deep-dives/fgos-capture-gaps-vs-bee.md:139-179` — the
  concrete proposed schema (rationale/alternatives/source/id-optional),
  explicitly framed as "a natural superset of D4's `role`/`actor` ask
  (tsk-63c) — `source` subsumes it with more granularity for free"
  (line 152-153), and the two still-open questions this item resolves
  (D2, D3 above) at lines 189-209.
- `docs/distillery/porting-log.md:119` — cross-reference confirming
  `tsk-63c`/`tsk-6b6` as the touch points for this exact schema
  extension.
- `.fgos/events.jsonl:1206` (seq 1206, renumbered by tsk-n4i-1; was 1190) — the prior locked decision on
  `id`-optional scoping, explicitly applying to `tsk-63c`.
- Direct code read: `src/state/store.mjs:527` (`putInAwaiting`, no
  `role` param today), `src/state/store.mjs:543` (`answerAwaiting`,
  already takes/passes `role`), `src/state/store.mjs:603` (`addDecision`,
  today only requires non-empty `text`), `bin/fgos.mjs:985-1021` (`ask`/
  `answer` CLI cases), `bin/fgos.mjs:1025` (`decision` CLI case, the
  only `addDecision` caller), `src/state/replay.mjs:162-173` (`gates[id]`
  fold), `src/state/replay.mjs:255` (current flat `view.decisions.push`).

## Canonical references

- `docs/distillery/deep-dives/fgos-capture-gaps-vs-bee.md` — the design
  this item implements.
- `plans/reports/capture-recording-points-audit-260729-1745-report.md`
  (tsk-ma4) — the original audit that surfaced the gap.
- `docs/explanation/fgos-capture-points-and-the-why-gap.md` — background
  on why `gates[id]` lacks actor/role today.

## Outstanding questions deferred to planning

- Exact view shape for per-id decisions: a new key (e.g.
  `view.decisionsById[id]`) holding an accumulating array (mirrors
  `view.discovery`/`view.frictions`, since decisions append over time
  and D1 of this very item is itself the second decision logged against
  `tsk-63c`), vs. some other structure. `fgos-coding-planning`'s call, not a
  product decision.
- Whether `gates[id]`'s new `rationale`/`alternatives`/`source` fields
  get populated only via CLI flags on `fgos ask`/`fgos answer` (mirroring
  how `ask`/`answer` text itself is passed today), or some other
  population path. The deep-dive already states the intent plainly
  ("fold the same three fields into `gates[id]`'s ask/answer payload...
  same fields, same reasoning, one schema for both surfaces") — left to
  planning to confirm the CLI flag shape, not re-litigated here as a
  product ambiguity.
