---
topic: fgos-capture-gaps-vs-bee
date: 2026-07-29
based_on: [beehive@1.18.3]
entries: [beehive:context-md-source-of-truth, beehive:unattended-triage-front-door, beehive:single-writer-context-md-render, beehive:phased-chain-with-four-gates, beehive:structured-decision-recall-surface]
---

# Deep-dive: fgOS's 4 capture gaps vs beehive's state design

**Bottom Line:** beehive's live `decisions.jsonl` (701 real entries, checked
directly, not just its curated index) already carries the exact fields
fgOS's audit (tsk-ma4) found missing — `rationale` (required), `alternatives`
(populated in 64/701 entries with real rejected-options-and-why), and a
free-text `source` (15 distinct values: `user`, `agent`, `Phil`,
`bee-planning (bypass-total auto-approval, not user)`, etc.) — so gap 1
(no actor/role) and most of gap 4 (no rejected-alternatives capture) are
**directly solved, already dogfooded, one schema to copy**. Gap 3
(CONTEXT.md unenforced) is also solved, but structurally, not by a field:
beehive's phase chain makes Gate 1 (bee-exploring's CONTEXT.md lock) mandatory,
and `bee-qualifying` guarantees the same outcome even with no human driving
— fgOS has the mechanism (`fgos-coding-exploring`) but not the gate. Gap 2
(`judgeDecompose` capturing nothing) has no beehive analog to copy directly —
beehive's closest parallel (`bee-qualifying`) always writes *something*
(locked or parked) rather than nothing, which is the design principle to
borrow, not a field to port.

## Câu hỏi

fgOS's own capture mechanism was explicitly modeled on beehive's ("cơ chế này
thực chất học từ họ"). tsk-ma4's audit found 4 gaps in fgOS's capture
design. Does beehive's actual state design already solve these — meaning fgOS
regressed from a pattern beehive already had, rather than never having built it?

## Cách beehive giải quyết

### Gap 1 (fgOS: `gates[id]` has no actor/role) — beehive: `source` field, live and rich

Checked directly against `/home/vantt/projects/forgent/.bee/decisions.jsonl`
(701 lines) and `.bee/bin/lib/decisions.mjs:302`
(`logDecision(root, { decision, rationale, alternatives = null, scope = 'repo', source = 'user', ... })`):

```
{"decision":"...","rationale":"...","alternatives":null,"scope":"repo","source":"user","confidence":null}
```

`grep -o '"source":"[^"]*"' decisions.jsonl | sort -u` returns 15 distinct
values in production use: `user`, `agent`, `agent (bypass=total)`,
`bee-planning (bypass-total auto-approval, not user)`,
`bee-swarming goal-check (orchestrator)`, `bee-validating (persona panel +
cold-pickup review)`, `bypass-total`, `exploring`, `gate-bypass`, `Phil`
(a literal person's name), `planning`, `project`, `user+agent`,
`validating`. This is not a binary human/agent flag — it is a free-text
provenance tag that names the exact skill, mode, or person responsible,
richer than what fgOS's STR70a/D4 even proposes (a single `actor`/`role`
value).

**Why beehive designed it this way:** `source` defaults to `'user'` but every
caller can override it — the field exists precisely so a later reader can
tell "did a person actually type this, or did an automated bypass path
assert it" without guessing from context. Bee's gate-bypass banner design
(ux domain, `gate-bypass-banner`) shows the same underlying value:
automation posture must stay visible, never silently indistinguishable
from a human decision.

### Gap 4 (fgOS: no rejected-alternatives capture anywhere) — beehive: `alternatives` field, populated 64/701 times

`alternatives` defaults `null` but is genuinely populated in real use.
Sample (verbatim, one entry):

> "Đổi ngay sang Rust/Go (bỏ: trả giá cứng nhắc lúc hành vi chưa chốt);
> TypeScript full build ở product repo (để sau, bước kế tiếp nếu checkJs
> không đủ); hexagonal đầy đủ + DTO/service (bỏ: nghi thức trả trước cho
> tính mềm chưa ai cần)"

This is exactly the "what was considered and rejected, and why" fgOS's
Column A was found to lack entirely. `rationale` is a *required* field
(`decisions.mjs:307-308` throws if blank) — beehive never allows a decision to
log without a why, whereas fgOS's `decision` verb only requires `text`
(no structure at all) and `gates[id]` has no why field of any kind.

Bee also supports `type: supersede` (`.bee/bin/lib/decisions.mjs:407`,
`supersedeDecision`) — a decision that changes later is a NEW entry
pointing at the superseded one, never an overwrite. This is a concrete
alternative to fgOS's RUL32 latest-wins `reason` field: beehive keeps full
history of a changed mind; fgOS deliberately discards the prior reason.
Both are defensible for different fields (RUL32 is for a *live* retry
context, not a settled decision), but it's worth naming explicitly that
beehive had both patterns and picked append-never-overwrite specifically for
`decisions.jsonl`.

### Gap 3 (fgOS: CONTEXT.md unenforced) — beehive: mandatory Gate 1 + unattended equivalent

`phased-chain-with-four-gates`: the chain is
`bee-hive → bee-exploring [Gate1] → bee-planning → ...` with a closed
phase enum that refuses invented phase names — a structural guard, not a
convention. Gate 1 IS bee-exploring's CONTEXT.md lock; the phase can't
silently skip past it.

Crucially, for the *unattended* path (no human driving — fgOS's exact
`judgeDiscovery`/`judgeDecompose` situation): `unattended-triage-front-door`
(`bee-qualifying`) still guarantees an artifact either way — "a clear item
auto-locks CONTEXT.md via bee-context-locking and advances; an ambiguous
one gets parked into CONTEXT.md's Outstanding Questions with the backlog
row flipped to `parked` in the same commit." There is no automated path in
beehive that advances a phase and writes nothing, which is exactly fgOS's
`judgeDecompose` `pass-through` branch today (confirmed live during this
same audit: `tsk-ma4`'s own decompose→executing transition wrote nothing).

`single-writer-context-md-render` (`bee-context-locking`) is the
mechanism that makes this possible: ONE skill is the sole writer of
CONTEXT.md, serving both the human-interactive path and the automatic
path, so both paths funnel into the same non-optional write — "it
renders; it does not decide." fgOS has no equivalent single-writer gate;
`fgos-coding-exploring` is a skill a session *may* invoke, not a structural
checkpoint the engine enforces before allowing the stage edge.

### Gap 2 (fgOS: `judgeDecompose` captures nothing) — no direct beehive field to copy, but a clear principle

Bee has no line-item equivalent to "decompose verdict capture" — its chain
doesn't have a decompose step shaped like fgOS's (item vs. children
splitting). But the *design principle* transfers directly from gap 3's
fix: bee-qualifying never lets an automated judgment produce zero trace.
The concrete borrow is not a field, it's the rule — "an automated verdict
that advances a stage always writes something, even if that something is
just a parked question" — applied to `judgeDecompose`'s own
`pass-through`/`decompose`-with-children outcomes.

## So sánh & trade-offs

| | fgOS today | beehive | Gap closed by copying? |
|---|---|---|---|
| Who made a decision | nothing (`decision` verb, `gates[id]`) | `source` (free text, 15 real values) | Yes — direct field port |
| Why a decision was made | `reason` (latest-wins, only on reject/gate-break) | `rationale` (required on every decision) | Yes — direct field port |
| What was rejected, and why | nothing anywhere | `alternatives` (populated ~9% of real entries, rich prose) | Yes — direct field port |
| CONTEXT.md enforcement | none — `fgos-coding-exploring` is optional | mandatory Gate 1 + `bee-qualifying`'s always-write unattended path | Yes — but structural (gate + single-writer), not a field |
| Automated judgment capturing rationale | `view.discovery` thin (clarify only); `judgeDecompose` zero | `bee-qualifying` always locks-or-parks | Principle transfers; no field to copy |
| Superseding a changed decision | not supported for decisions (only `reason` overwrites) | `type: supersede`, append-only | Worth adopting for fgOS's own `decision` verb too |

## Giải pháp tổng hợp cho host

Concrete fgOS schema change, combining beehive's proven shape with fgOS's own
append-only-log discipline (RUL11 — beehive's shape fits this without
modification, since beehive's `decisions.jsonl` is itself append-only):

1. **Extend `addDecision`'s payload** (`src/state/store.mjs:603`) to accept
   `rationale` (required, mirroring beehive's throw-if-blank rule),
   `alternatives` (optional, free text), and `source` (optional, free
   text, default `'session'` since fgOS calls are always agent-initiated
   unless a human types the CLI directly — fgOS's own equivalent
   distinction). Reuses beehive's exact field names and semantics; no new
   concept to invent. This alone gives fgOS's `decision` verb structural
   parity with beehive's, and is a natural superset of D4's `role`/`actor`
   ask (tsk-63c) — `source` subsumes it with more granularity for free.
2. **Fold the same three fields into `gates[id]`'s ask/answer payload**
   (`replay.mjs:166-172`) rather than inventing a separate STR70a-only
   shape — same fields, same reasoning, one schema for both surfaces.
3. **Do NOT copy beehive's `type: supersede` mechanism wholesale** — fgOS's
   `decision` verb is genuinely global/unscoped (confirmed in tsk-ma4's
   audit) while beehive's is per-repo-state; adopting supersede meaningfully
   first needs `decision` to be id-scoped (a separate, larger change than
   this deep-dive's remit — flag as an open question below, don't fold it
   into the schema change above).
4. **Gate 3's structural fix (beehive's answer to gap 3) needs a phase-graph
   change, not a field**: add a precondition to `decompose`'s
   `clarify`→`executing`/`decompose`→`executing` edges (mirroring RUL50's
   own `compound-learn` done-gate shape) that refuses the edge unless
   either `docsRef` is set OR an explicit "skip, item is simple enough"
   marker is recorded — matching beehive's own two-path guarantee (locked or
   explicitly parked, never silent). This is a genuinely bigger, riskier
   change than #1/#2 — matches tsk-ma4's own conclusion that gap 3 is a
   policy decision requiring its own `fgos-coding-exploring` round (tsk-47e),
   not a code patch to bolt on here.
5. **Gap 2 gets no new field** — instead, `judgeDecompose`'s four verdict
   branches (`invalid`/`need-human`/`pass-through`/`decompose`) should
   each call `addDecision` (once #1 lands) with a `source: 'judgeDecompose'`
   and a `rationale` derived from the verdict's own reasoning — turning a
   silent `moveStage`-only branch into a decision-logged one, the same
   principle `bee-qualifying` already applies to its own always-locks-or-
   parks rule.

## Portable ideas

| Idea | R | E | F | Note |
|---|---|---|---|---|
| `decision`/`gates[id]` schema: add `rationale` (required) + `alternatives` (optional) + `source` (optional free text) | 3 | 2 | 2 | Cross-cutting (touches the one capture surface all 4 gap items reference); dogfooded by beehive (701 real entries, 64 with real alternatives); component-level effort — extend two existing functions + fold sites, no new subsystem |
| Structural CONTEXT.md gate (mandatory Gate-1-equivalent + always-locks-or-parks unattended path) | 3 | 2 | 3 | Cross-cutting (changes the `decompose` edge's own precondition); beehive dogfoods this at scale (18 skills, mandatory chain); subsystem-level effort — a new precondition on a stage edge, needs its own `fgos-coding-exploring` round first (tsk-47e already filed) |
| `judgeDecompose` calling `addDecision` on every verdict branch | 2 | 2 | 1 | One subsystem (`src/intake/plan.mjs`); beehive's `bee-qualifying` principle, not a literal field; small once idea #1's schema lands |

## Open questions

- ~~fgOS's `decision` verb is confirmed global/unscoped (tsk-ma4 audit) —
  should it become id-scoped before or alongside adding
  `rationale`/`alternatives`/`source`?~~ **Resolved 2026-07-29 (user):**
  add `id` as an OPTIONAL parameter to `addDecision`, matching the
  existing `addOutcome`/`addFriction`/`addDiscovery` pattern — fold into
  `view.decisions[id]` when present, fall through to the existing global
  bucket when absent (zero migration, RUL11-safe). Explicitly rejected
  copying beehive's `scope`/`tags` + `decisions search` model here: beehive uses
  that because it has no per-work-item lifecycle as tight as fgOS's own —
  fgOS already has the per-id fold pattern for three sibling verbs, so
  extending the fourth to match is the consistent choice, not a borrow
  from beehive. Applies to tsk-63c/tsk-6b6's shape.
- Bee's `source` free-text convention (`"bee-planning (bypass-total
  auto-approval, not user)"`) trades structure for expressiveness — no
  enum, no validation beyond non-empty. Should fgOS's `source` field be
  free text (beehive's choice) or a closed enum (`human`/`session`/`engine`)?
  Bee's own real data suggests free text was worth it (15 distinct values
  in production, several carrying context an enum couldn't) — leaning
  free text, but this is a call for whoever specs the schema change.
