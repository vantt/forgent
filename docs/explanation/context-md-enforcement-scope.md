# Why CONTEXT.md enforcement is scoped to (b) OR (c), and why it's hard

`CONTEXT.md` is fgOS's one structured record of *why* a decision landed
where it did (`docs/explanation/fgos-capture-points-and-the-why-gap.md`).
For a long time nothing in the engine required it to exist before an item
moved on. `tsk-47e` locked whether/where/how-hard to enforce it, without
writing the enforcement code itself.

## The gap, measured

> Measured live from `.fgos/events.jsonl` (2026-07-29 baseline, re-checked
> 2026-08-02): of 109 items ever created, only 25 (23%) ever got a
> `docsRef`, and only 18 (16.5%) of `docs/history/*/` directories carried
> a `CONTEXT.md` at all... Re-measured 2026-08-02 against the current
> log: 280 items created, 102 (36.4%) with a real `CONTEXT.md` — organic
> improvement (from two unrelated upgrades, `tsk-ozl` and
> `fgos-coding-planning-context-gap-handback`), still with zero engine-level
> enforcement. Nothing in `src/intake/discovery.mjs` or
> `src/intake/plan.mjs` checks CONTEXT.md's existence before an item
> leaves `clarify`/`decompose` — both edges to `executing` exist
> unconditioned (`src/state/workflow-stage-graphs.mjs:65,67`).

The item's own scope was deliberately narrow:

> This item locks *whether* to enforce, *what scope* triggers
> enforcement, and *how hard* the gate is. It does not design or write
> the gate itself — that is a separate, follow-up item.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Enforcement scope is **(b) OR (c)**: an item must carry a non-empty `CONTEXT.md` under its `docsRef` before leaving `clarify`/`decompose` **if** it is `risk: heavy` or `risk: standard` with `acceptance` criteria set (b), **or** it has been through at least one `fgos ask`/`fgos answer` round trip (c) — either condition alone is sufficient to trigger the requirement. An item that is neither (`risk: light` with no acceptance, never parked on a person) is exempt — preserves `fgos-coding-exploring`'s own "item đơn giản không cần ceremony" principle. |
| D2 | Enforcement is **hard**: both `clarify -> executing` and `decompose -> executing` (`workflow-stage-graphs.mjs:65,67`) are blocked — not warn-and-continue — when D1's trigger applies and no non-empty `CONTEXT.md` exists at the item's `docsRef`. Mirrors the existing `RUL50`/compound-learn precondition precedent (a precondition gate blocking a stage/status edge on a content check) already proven safe in this codebase, rather than a softer warn-only path that a 27%-73% non-compliance rate (pre-upgrade baseline) shows does not self-correct. |
| D3 | The trigger check (D1) is evaluated at attempt-time, reading the item's *current* `risk`/`acceptance`/gate history, not a value frozen at creation — an item that starts `risk: light` and gets upgraded, or that gets parked on a person later, becomes subject to enforcement from that point forward, same as any other content-based gate in this codebase. |
| D4 | This item's own scope stops at the decision lock. The actual precondition check (reading `docsRef` + file-on-disk, keyed off D1's trigger, applied to both edges per D2) is separate follow-up work — writing it here would violate `fgos-coding-exploring`'s "do not write code, other than the decision doc itself" rule. |

## Why hard, not soft — the bee precedent

> `docs/distillery/sources/bee.md` (acceptance criteria already recorded
> on `tsk-47e`) — bee's own Gate 1 is a **fixed structural guard** (closed
> phase-enum, rejects invented phase names) inside a mandatory chain
> (`bee-hive -> bee-exploring[Gate1] -> bee-planning -> ...`), and its
> unattended path (`bee-qualifying`, no person watching) *never* writes
> zero — it either locks `CONTEXT.md` or parks a question, never both
> silent. This is direct precedent for D2's "hard" choice over a
> soft/warn one: bee's own structural guard is exactly a hard block, not
> advisory.

The organic 23%→36.4% improvement between the two measurement dates came
from two unrelated upgrades (`tsk-ozl`,
`fgos-coding-planning-context-gap-handback`) — not from any gate — which is why
D2 treats a soft/warn path as insufficient: passive improvement plateaus
well short of full coverage without a hard block.

## What's still outstanding

The decision lock does not include the gate implementation itself:

> - Writing the actual precondition check (D4) — where in
>   `discovery.mjs`/`decompose.mjs` it hooks in, what error/park behavior
>   fires on a trigger-true-but-missing-CONTEXT.md item, and its own
>   verify/test coverage. Not locked here; a new item's own
>   `fgos-coding-planning` pass shapes it, citing D1-D4 above.
> - Exact wording of the parked reason / error surfaced to a blocked item
>   (implementer's call, per D4).

Full decision record: `docs/history/context-md-enforcement-scope/CONTEXT.md`.
