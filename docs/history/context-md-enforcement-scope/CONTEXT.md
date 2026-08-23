# context-md-enforcement-scope — locking whether/where CONTEXT.md is required

Item: `tsk-47e`. Deliverable is this decision doc only — no engine/gate code
in this item (that is deferred to a follow-up item, see Outstanding below).

## Feature boundary

Measured live from `.fgos/events.jsonl` (2026-07-29 baseline, re-checked
2026-08-02): of 109 items ever created, only 25 (23%) ever got a `docsRef`,
and only 18 (16.5%) of `docs/history/*/` directories carried a `CONTEXT.md`
at all — the one mechanism that captures *why* a decision landed where it
did (`docs/explanation/fgos-capture-points-and-the-why-gap.md`). Re-measured
2026-08-02 against the current log: 280 items created, 102 (36.4%) with a
real `CONTEXT.md` — organic improvement (from two unrelated upgrades,
`tsk-ozl` and `fgos-coding-planning-context-gap-handback`), still with zero
engine-level enforcement. Nothing in `src/intake/discovery.mjs` or
`src/intake/plan.mjs` checks CONTEXT.md's existence before an item
leaves `clarify`/`decompose` — both edges to `executing` exist unconditioned
(`src/state/workflow-stage-graphs.mjs:65,67`).

This item locks *whether* to enforce, *what scope* triggers enforcement, and
*how hard* the gate is. It does not design or write the gate itself — that
is a separate, follow-up item (see Outstanding).

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Enforcement scope is **(b) OR (c)**: an item must carry a non-empty `CONTEXT.md` under its `docsRef` before leaving `clarify`/`decompose` **if** it is `risk: heavy` or `risk: standard` with `acceptance` criteria set (b), **or** it has been through at least one `fgos ask`/`fgos answer` round trip (c) — either condition alone is sufficient to trigger the requirement. An item that is neither (`risk: light` with no acceptance, never parked on a person) is exempt — preserves `fgos-coding-exploring`'s own "item đơn giản không cần ceremony" principle. |
| D2 | Enforcement is **hard**: both `clarify -> executing` and `decompose -> executing` (`workflow-stage-graphs.mjs:65,67`) are blocked — not warn-and-continue — when D1's trigger applies and no non-empty `CONTEXT.md` exists at the item's `docsRef`. Mirrors the existing `RUL50`/compound-learn precondition precedent (a precondition gate blocking a stage/status edge on a content check) already proven safe in this codebase, rather than a softer warn-only path that a 27%-73% non-compliance rate (pre-upgrade baseline) shows does not self-correct. |
| D3 | The trigger check (D1) is evaluated at attempt-time, reading the item's *current* `risk`/`acceptance`/gate history, not a value frozen at creation — an item that starts `risk: light` and gets upgraded, or that gets parked on a person later, becomes subject to enforcement from that point forward, same as any other content-based gate in this codebase. |
| D4 | This item's own scope stops at the decision lock. The actual precondition check (reading `docsRef` + file-on-disk, keyed off D1's trigger, applied to both edges per D2) is separate follow-up work — writing it here would violate `fgos-coding-exploring`'s "do not write code, other than the decision doc itself" rule. |

## Pinned terms

- **"Enforced"** — an item's `clarify -> executing` / `decompose ->
  executing` transition is blocked (per D2) until a non-empty
  `CONTEXT.md` exists at its `docsRef`.
- **Trigger (D1)** — the OR of two independent conditions: (b) `risk`
  heavy/standard-with-acceptance, (c) at least one `ask`/`answer` round
  trip recorded in the item's gate history.

## Scout evidence

- `.fgos/events.jsonl` — direct fold (`work.add`/`work.edit` payloads):
  109→280 items created between the two measurement dates; `docsRef`
  coverage 23%→36.4%; real `CONTEXT.md` file coverage 16.5%→36.4%
  (numbers converged — nearly every `docsRef` now points at a real file).
- `src/intake/discovery.mjs`, `src/intake/plan.mjs` — grepped for
  `CONTEXT.md`/`docsRef`: both only *read* `CONTEXT.md` when present
  (`readLockedContext`, shared helper) to trust a locked decision and skip
  re-judging (`tsk-ozl`, D2/D3 of
  `docs/history/discover-verb-context-blind-clarify-judge/CONTEXT.md`) —
  neither ever *requires* it exist. No precondition gate exists today.
- `src/state/workflow-stage-graphs.mjs:65,67` — confirmed both
  `clarify -> executing` and `decompose -> executing` edges exist,
  unconditioned on any CONTEXT.md check.
- `docs/specs/work-state.md` RUL49/RUL50 (compound-learn precondition,
  now retired per `work-item-status-delivered-retrospective-cleanup` D11,
  but the *precondition-gate-on-an-edge* mechanism it proved is the
  precedent D2 cites) — a content-based precondition blocking a
  stage/status edge is an established, safe pattern in this codebase.
- `docs/distillery/sources/bee.md` (acceptance criteria already recorded
  on `tsk-47e`) — bee's own Gate 1 is a **fixed structural guard**
  (closed phase-enum, rejects invented phase names) inside a mandatory
  chain (`bee-hive -> bee-exploring[Gate1] -> bee-planning -> ...`), and
  its unattended path (`bee-qualifying`, no person watching) *never*
  writes zero — it either locks `CONTEXT.md` or parks a question, never
  both silent. This is direct precedent for D2's "hard" choice over a
  soft/warn one: bee's own structural guard is exactly a hard block, not
  advisory.
- `fgos tool query --capability impact-analysis --status present --dir
  <root>`: 1 provider, `gitnexus`, `status: "present"` → posture **full**
  per `CLAUDE.md`'s impact-analysis gate. Informational only — this
  session writes no code, only this decision doc.
- `docs/explanation/fgos-capture-points-and-the-why-gap.md` — background
  on why CONTEXT.md is the one structured why/tradeoff record fgOS has.
- Prior gate round-trip on this item itself (`fgos ask`/`fgos answer`,
  `view.gates['tsk-47e']`): the (a)/(b)/(c) × hard/soft framing was asked
  and answered as **(b) OR (c), hard** — locked verbatim into D1/D2 above,
  not reopened here.

## Outstanding, deferred to a follow-up item

- Writing the actual precondition check (D4) — where in `discovery.mjs`/
  `decompose.mjs` it hooks in, what error/park behavior fires on a
  trigger-true-but-missing-CONTEXT.md item, and its own verify/test
  coverage. Not locked here; a new item's own `fgos-coding-planning` pass
  shapes it, citing D1-D4 above.
- Exact wording of the parked reason / error surfaced to a blocked item
  (implementer's call, per D4).
