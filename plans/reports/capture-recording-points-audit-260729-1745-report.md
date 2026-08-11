# fgOS recording-points audit — Column A vs Column B

**Item:** tsk-ma4 (step (1) of tsk-4op). **No code changed** — this is the report itself.
**Plan:** `docs/history/recording-points-audit/plan.md`. **Decisions:** `docs/history/recording-points-audit/CONTEXT.md` (D1, D2).

## Hypothesis under test

Column A (fgOS's own automatic capture) records **what happened**, but not
**what was considered, and rejected, and why** — the report either proves or
disproves this, then answers three concrete questions.

---

## Column A — what fgOS captures today, automatically, no person required

The six mechanisms the item named, each re-verified against the live source
(all citations below hold at the stated line, confirmed 2026-07-29):

| Mechanism | Where | What it records | Fold rule |
|---|---|---|---|
| RUL13 outcome | predicted: `src/runner/claim-port.mjs:150-160`; actual: `src/runner/loop.mjs:712-722`, `bin/fgos.mjs:1448`/`1493` | `{outcome, passed, attempts, errorClass, aheadCount}` — a mechanical pass/fail fact, twice (claim-time prediction, close-time actual) | additive, merged by id (`docs/specs/work-state.md:980`) |
| RUL20 settlement | three edges: clarify-pass, answer, close | which of three FSM edges fired | additive per id (`work-state.md:987`) |
| RUL21 close-time learning | `composeLearning` at `src/state/store.mjs:268`, called `:510` | one mechanical, best-effort learning record on every `→done` | additive, never blocks close (`work-state.md:988`) |
| RUL32 reason | `item.reason`, set on reject/gate-break `work.move` | the single latest rejection/break reason string | **latest-wins** — the one exception to "additive," by design (`work-state.md:999`) |
| blocked friction | `addFriction`, `src/state/store.mjs:674-681` | one friction occurrence per block, with an optional `docType` tag | append per id, never merged (`work-state.md`:1122 replay notes) |
| `gates[id]` | fold site `src/state/replay.mjs:166-172` | **only** `ask` / `answer` / `parentSnapshotAtAsk` / `statusAtAsk` — confirmed **no actor/role field present** | overwritten per ask/answer round (LWW on those four keys) |

**Wider search (per CONTEXT.md D1) — two things beyond the six, found by
reading `docs/specs/work-state.md:1122`'s full replay-fold inventory and by
tracing `judgeDecompose`/`judgeDiscovery` directly:**

1. **`view.discovery`** (`src/state/discovery.mjs:239`, `addDiscovery`) —
   at `clarify`, every `judgeDiscovery` call appends
   `{clear, question?, verify?}` per id. This is a **thin why-adjacent**
   record: when the verdict is unclear, the `question` field is the closest
   thing Column A has today to "what was unresolved and why." It is real,
   but it only fires at `clarify`, and it never records a chosen option, a
   rejected alternative, or a tradeoff — only a pass/fail plus, optionally,
   one open question string.

2. **`judgeDecompose` records literally nothing.** Traced directly
   (`src/intake/plan.mjs:290-360`) and confirmed live: this session's
   own `fgos discover tsk-ma4` call at the decompose→executing edge hit
   exactly the `pass-through` branch (`decompose.mjs:328-331`) —
   `moveStage(...); releaseClaimOnExecuting(); return { outcome: 'pass-through', id };`
   — no `addDiscovery`, no decision, no friction, nothing. The `decompose`
   verdict (`invalid` / `need-human` / `pass-through` / `decompose`-with-children)
   leaves **zero** trace of its own reasoning in any case except
   `need-human`, where the proposed reasoning survives only as the raw
   `ask` text (via `putInAwaiting`) — not as a settled record. Even the
   `decompose`-with-children branch (`decompose.mjs:334-350`) persists the
   children's `title`/`kind`/`deps`/`verify`/`footprint` as new items, but
   never *why* the split was drawn that way. **This is a strictly deeper gap
   than `judgeDiscovery`'s** — the decompose judgment is less captured than
   the clarify judgment, not equally captured.

3. **The `decision` verb is confirmed genuinely global, not item-scoped** —
   the item's own claim holds up under direct code trace, not just as
   asserted. `bin/fgos.mjs:1024`'s `decision` case reads only `flags.text`;
   `--id` is silently accepted as a CLI flag but never read or forwarded.
   `addDecision` (`store.mjs:603-611`) requires only `text`; `replay.mjs:255`
   pushes `{...event.payload, ts}` onto a flat, unscoped `view.decisions`
   array. Concretely: the two `fgos decision --id tsk-ma4 --text "D1: ..."` /
   `"D2: ..."` calls made earlier in this same session recorded D1/D2's text
   globally — `fgos list --json`'s `view.decisions` for `tsk-ma4` specifically
   returns nothing, because there is no such per-item slice to return.

## Column B — what the synthesis layer actually needs

- **`gate-dialogue-continuity` D3** (`/home/vantt/projects/forgent/docs/history/gate-dialogue-continuity/CONTEXT.md:68-80`,
  sibling checkout, same repo/remote — cited directly by both this item and
  its own `docs/backlog.md:31` entry): a settle record bundling **why** the
  decision landed, the **exchange milestones** on the way, and the
  **tradeoffs accepted** — a structure, not `reason`'s one line.
- **`fgos-coding-compounding` SKILL.md:47-51** — the real, current input contract
  for the layer that writes the end-user doc: `fgos check <id>` (predicted/
  actual outcome + friction) plus, when present, `docs/history/<feature>/`
  for "the fuller story behind the capture." If that directory doesn't
  exist, or exists but was never filled in with real prose, there is no
  fuller story to read — the skill has no fallback.
- **Bee precedent (per D2)** — `scan-260728-1233-bee-doc-types-lifecycle-report.md`:
  bee's `CONTEXT.md` is written at **exploring/qualifying**, not at close —
  "always — locked decisions, source of truth" — and `.bee/decisions.jsonl`
  logs decisions in real time as the source doc gets built later. **fgOS's
  own `fgos-coding-exploring`/`fgos-coding-planning` skills already replicate exactly this
  pattern** — this session wrote `docs/history/recording-points-audit/CONTEXT.md`
  and `plan.md` *during* clarify/decompose, not at close, the same shape bee
  uses. The gap is not that fgOS lacks the mechanism — it's that, unlike
  bee's mandatory Gate 1/Gate 4 checkpoints, **nothing in fgOS's engine
  requires or checks that CONTEXT.md gets written at all**; it depends
  entirely on whichever session runs `fgos-coding-exploring` choosing to write real
  prose.

## Comparison table — measured, not speculated

Two independent counts, cross-checked because a live re-query of
`fgos list --json` mid-session returned a materially different (and
internally inconsistent — zero `done` items, down from 51) snapshot than an
earlier read in the same session. Rather than chase that discrepancy (out
of scope for this item — it is a `listWork`/view-projection question, not a
capture-design one), the numbers below come from a raw fold of every
`work.add`/`work.edit`/`work.move`/`work.stage` event directly off
`.fgos/events.jsonl` — a fold immune to whatever the CLI-layer anomaly is,
and directly comparable to the item's own 2026-07-29 preliminary scan:

| Metric | Item's own scan (2026-07-29, earlier) | This report's raw-log fold (2026-07-29, later) |
|---|---|---|
| Total work items ever created | 107 | 109 |
| ...with a `docsRef` ever set | 22 (21%) | 25 (23%) |
| ...`docs/history/*/CONTEXT.md` dirs on disk | 16 (15%) | 18 (16.5%) |
| ...with `acceptance` criteria | 2 (1.9%) | 3 (2.8%) |
| ...currently `done` | — | 52 |

Consistent trend both times: **roughly 3 in 4 items never get a `docsRef` or
a `CONTEXT.md` at all**, and locked `acceptance` criteria are rare (under
3%). The conclusion below does not depend on which exact snapshot is used —
both agree on the order of magnitude.

*Aside, out of scope for this item:* the `fgos list --json` anomaly
(0 `done` items on the later read vs. 51 on the earlier one, against the
same monotonically-growing event log) looks like a real bug in
`listWork`/view rebuild, not user error — worth its own item, not chased
further here.

## Where each column is thin

- Column A's six named mechanisms + `view.discovery` capture **mechanical
  facts and, at best, one open question** — never a chosen-vs-rejected
  option set, never a tradeoff, never exchange milestones.
- The `decompose` judgment (the edge this very item just crossed) captures
  **nothing at all** in its common `pass-through`/`decompose` outcomes —
  strictly worse than `clarify`'s thin `view.discovery` record.
- The one place fgOS *does* get a real, structured why/tradeoff record —
  `docs/history/<feature>/CONTEXT.md`, written by `fgos-coding-exploring`/
  `fgos-coding-planning` — is unenforced: only ~23% of items ever point at one,
  and nothing in the engine checks it happened.
- `gates[id]` (the `awaiting-human` async dialogue) has raw `ask`/`answer`
  text but **no actor/role**, confirmed live: `answerAwaiting` already
  stamps `payload.role = 'human'` on the underlying `work.move` event
  (`bin/fgos.mjs`'s `answer` case), and `putInAwaiting`/`ask` stamps no role
  at all — but neither ever reaches `gates[id]`'s fold (`replay.mjs:166-172`
  only spreads `ask`/`answer`/`parentSnapshotAtAsk`/`statusAtAsk`). This is
  D4's exact claim, confirmed true today, just under a renamed field:
  `payload.actor` was renamed to `payload.role` by STR46's own migration
  (`scripts/migrate-actor-to-role.mjs`) — the underlying gap D4 describes is
  unchanged by that rename.
- **A third, uncounted gap**: the live Socratic exchange between a session
  and a person during `clarify`/`decompose` — like the one that produced
  this item's own D1/D2 — happens entirely outside `awaiting-human` (via
  direct conversation, not `fgos ask`/`answer`). Nothing in fgOS's event log
  captures that exchange at all; its only trace is whatever prose the
  session chooses to write into `CONTEXT.md`. STR70a does not reach this
  case — it is scoped strictly to the async `awaiting-human` gate.

## Conclusion

**(a) Is there a real gap, and where?** Yes, and it is narrower and more
specific than "fgOS doesn't capture the why" in general:

1. `gates[id]` genuinely lacks actor/role (STR70a's exact target) —
   confirmed, not assumed.
2. The `decompose` judgment captures strictly less than `clarify`'s already-thin
   record — a gap the item didn't originally name.
3. The one mechanism that *does* work well (`CONTEXT.md`, bee-precedented)
   is unenforced and used by roughly a quarter of items — a process gap,
   not a missing-mechanism gap.
4. The synchronous, same-session Socratic exchange (not routed through
   `awaiting-human`) has **no** capture surface at all, and no existing
   backlog line (STR69a/69b/70a/70b/71) targets it.

**(b) Should STR70a be built before tsk-4op, or does the gap live
elsewhere?** STR70a should still be built — it closes a real, confirmed,
low-risk gap (D4 verified concretely above) — but building it does **not**
close the broader gap tsk-4op is worried about. STR70a's scope is the async
`awaiting-human` gate only; it does not touch the `decompose`-judgment gap
(item #2 above) or the synchronous-exchange gap (item #4 above), both of
which sit outside STR70a's own D1-D6. tsk-4op's own batch-trigger redesign
should scope its "capture layer, scattered not batched" language to cover
all three gaps, not assume STR70a alone resolves the hypothesis.

**(c) If STR70a is needed, how much work is its D4 prerequisite?** Small,
concretely bounded, not a redesign:
- `role` already exists as a raw payload field on the `answer` edge
  (`bin/fgos.mjs`'s `answer` case already passes `role: 'human'` into
  `answerAwaiting` → `moveWork`) — it is not a new concept to invent.
- The `ask` edge does not currently pass any role at all
  (`putInAwaiting`'s signature has no `role` param) — this needs adding,
  one parameter through one existing wrapper.
- `replay.mjs:166-172`'s `gates[id]` fold needs exactly one more spread
  line (`...(role !== undefined ? { role } : {})`), the same pattern the
  other three fields already use.
- Net: one CLI-case edit (`ask`), one function-signature edit
  (`putInAwaiting`), one fold-site line (`replay.mjs`), plus a test
  asserting `role` lands in `gates[id]` after both `ask` and `answer` —
  the same order of magnitude the backlog itself calls STR69a ("gần như
  free"), not a new capture mechanism.

## Unresolved questions

- The `fgos list --json` done-item anomaly noted above (0 vs 51 `done`
  items across two reads of the same growing log) is real and worth its
  own item, but is not this item's to chase.
- No existing backlog line targets the synchronous-exchange gap (§"Where
  each column is thin," last bullet) — whether that becomes part of
  tsk-4op's scope or its own new line is a call for whoever plans tsk-4op
  next, not settled here.
