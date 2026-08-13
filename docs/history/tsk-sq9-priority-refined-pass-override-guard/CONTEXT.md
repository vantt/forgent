# CONTEXT: guard against the refined pass silently clobbering a human priority override

Item: `tsk-sq9`.

## Feature boundary

`work.priority` is written by three writers today: `resolveDiscovery`'s
rough pass (`src/intake/discovery.mjs:369`), `resolvePlan`'s refined pass
(`src/intake/plan.mjs`, the file `decompose.mjs` was renamed to per
tsk-403 D15, ~line 631), and a human's own `fgos edit --priority`. Neither
automated pass today checks whether a human already set the value via
`edit --priority` before it runs — both call `editWork(dir, { patch: {
priority } })` unconditionally. This item scopes which of those two
writers actually needs a guard, and what the guard's mechanism is.

The item's own description carries a 2026-08-09 update note claiming this
framing was superseded by a bigger measured bug (the refined pass missing
a `semanticRelatedness` axis the rough pass had, collapsing impact to 0
for 69% of scored items). Scout confirmed that bug is already closed:
`docs/history/tsk-1r3-priority-refined-pass-drops-term/` fixed the
parameter-parity gap, and `docs/history/tsk-4hb-priority-formula-
degenerate-axes/` fixed the sibling risk-fallback-visibility gap. Neither
touched the clobber question this item asks — this item's original scope
is still live and unresolved on its own merits.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | The rough pass (`discovery.mjs`'s `resolveDiscovery`, ~line 369) overwriting `work.priority` on new info is intended behavior, not a bug — its whole purpose is to reflect newly-clarified information into the pre-triage ranking. No guard applies here. |
| D2 | The refined pass (`plan.mjs`'s `resolvePlan`, ~line 631) recompute is also intentionally kept, not removed. `releaseClaimOnExecuting()` (`plan.mjs`) releases the item's claim once it reaches stage `executing`, so a planned-but-not-yet-executing item sits unclaimed in the frontier; `frontier.mjs`'s comparator sorts strictly by `priority` ASC (absent-last) — the same order `/fgOS:pick`, `/fgOS:ready`, and `fgos-fanout` read to decide which ready item to work next. The refined pass has real `effort`/`blastRadius` (unlike the rough pass's `EFFORT_FLOOR` estimate), so recomputing here measurably improves that cross-item scheduling decision. |
| D3 | The guard applies at exactly one call site: `plan.mjs`'s `resolvePlan`, immediately before its `editWork(dir, { id, patch: { priority }, role })` call (~line 631). Before that write, check `view.decisions` for a `priority-override` decision (logged by `edit --priority` via the existing `addDecision`, `store.mjs:870`) newer than the item's last recompute. If one exists, skip the auto-write so the human's deliberate escalation/de-escalation survives. `discovery.mjs`'s rough pass is untouched (per D1). |

## Pinned terms

- **rough pass** — `resolveDiscovery`'s priority write in `discovery.mjs`, run on every clarify pass while the item is still at stage `discovery`/`exploring`.
- **refined pass** — `resolvePlan`'s priority write in `plan.mjs`, run once fgos-coding-planning has produced a verdict for the item (stage `planning`).
- **priority-override decision** — a decision-log entry (`kind`, exact string left to `fgos-coding-planning`) written by `edit --priority` to mark that the new value was set by a human, distinguishing it from an auto-computed one.

## Scout evidence

- `src/intake/discovery.mjs:369` — rough pass, unconditional `editWork({patch:{priority}})`.
- `src/intake/plan.mjs` ~589-631 — `resolvePlan`'s refined pass; comment block explains it exists specifically to use real `effort`/`blastRadius` once known, unlike the rough pass.
- `src/intake/plan.mjs:493` (`releaseClaimOnExecuting`) — claim is released once the item reaches stage `executing`, so it becomes pickable by someone/something else.
- `src/state/frontier.mjs:171-179` — v2 comparator: `priority` ASC, absent-last, then `intent` DESC. This is the order `/fgOS:pick`/`/fgOS:ready`/`fgos-fanout` read.
- `src/state/store.mjs:870` (`addDecision`) — existing decision-log write, already used by sibling fixes at this same call site (see below). `view.decisions` (surfaced via `fgos list --id <id> --json`) is already the per-item read path this guard would query.
- `docs/history/tsk-1r3-priority-refined-pass-drops-term/` and `docs/history/tsk-4hb-priority-formula-degenerate-axes/` — sibling fixes at the exact same `plan.mjs` call site, both `mode: tiny`, both using `addDecision` for an adjacent observability concern near this same code. D3's mechanism follows the same pattern deliberately, for consistency with what's already there.
- Impact-analysis posture: **full** — `fgos tool query --capability impact-analysis --status present` returned `gitnexus` as `present`, checked fresh this session.

## Canonical references

- `docs/history/work-item-priority-matrix/CONTEXT.md` D6 — establishes the override door (`edit --priority`) stays open at any time; this item is the follow-up that makes a forced value survive the *next* automated pass, scoped down to the one pass (D2/D3) where that survival actually matters.
- `docs/history/tsk-1r3-priority-refined-pass-drops-term/plan.md`, `docs/history/tsk-4hb-priority-formula-degenerate-axes/plan.md` — sibling `tiny`-mode fixes at the same call site; precedent for scope size and mechanism choice.

## Outstanding questions

None
