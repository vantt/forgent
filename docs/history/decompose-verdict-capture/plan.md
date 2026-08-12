---
item: tsk-6b6
stage: decompose (shaping)
date: 2026-07-29
revised: 2026-07-29 (tsk-63c landed with a different schema shape than originally assumed — see CONTEXT.md D1/D5 revision)
---

# plan.md: decompose verdict capture

## Mode

Flags counted against the mechanical gate, **recounted after tsk-63c
landed** (originally 5 flags/high-risk; the schema/CLI/replay work this
item used to own is now already shipped elsewhere):

| Flag | Applies? | Why |
|---|---|---|
| auth | no | |
| authorization | no | |
| data model | no | `addDecision`/`view.decisionsById` already shipped by tsk-63c (`store.mjs:631-643`, `replay.mjs:261-280`) — this item does not touch that schema |
| audit/security | **yes** | this feature is still the audit/decision-trail wiring for an automated judge — the surface tsk-ma4's audit was about |
| external systems | no | no new external call |
| public contracts | no | CLI `decision` verb already carries `--id`/`--rationale`/`--alternatives`/`--source` (`bin/fgos.mjs:1034-1042`, shipped) — this item does not touch the CLI |
| cross-platform | no | |
| existing covered behavior | **yes** | `test/intake/plan.test.mjs` has 38 passing tests, 13 fixtures constructing `verdict: 'decompose'` — see the recount below |
| weak proof around the area | **yes** | item's own `verify` field reads "chưa xác định — P15 bổ sung" (not yet determined) |
| multi-domain | no | single domain (coding), `src/intake/plan.mjs` only |

**3 flags → standard mode** (down from the original 5-flag/high-risk
count). The scope shrunk for real reasons, not by relaxing rigor: the
schema/CLI/replay risk this item used to carry is now someone else's
already-landed, already-tested code.

## Approach

### What changed since the original plan

The original plan (this same file, pre-revision) had this item build the
`addDecision` extension itself (files 1-3 below). `tsk-63c` shipped that
extension while this item sat blocked on it — with a **different** shape
than CONTEXT.md D1 originally locked:
- `rationale` is required **unconditionally** (not scoped to `id`-present).
- The fold is **dual**: `view.decisions` (flat) always gets the push;
  `view.decisionsById[id]` (not `view.decisions[id]`) is an *additional*
  fold when `id` is present — never either/or.
- CLI flags (`--id`/`--rationale`/`--alternatives`/`--source`) already
  exist.

This item's remaining scope is therefore **only `src/intake/plan.mjs`**
— consuming the shipped `addDecision`, plus the model-prompt change
(D2/D3) that was always this item's own to build regardless of who owns
the schema.

### Files touched, in dependency order

1. **`src/intake/plan.mjs`** —
   a. `buildDecomposePrompt`: extend the JSON schema description (currently
      line 120) so `pass-through` gains an optional top-level `"reason"`
      and `decompose` gains a **required** top-level `"reason"` (separate
      from each child's own fields) — per CONTEXT.md D2.
   b. `judgeDecompose`: parse the new `reason` field for `pass-through`
      (`verdict.reason` string, optional — omitted/blank is valid, D2's
      fallback case) and `decompose` (required — blank/missing → the whole
      verdict normalizes to `{ kind: 'invalid' }`, per CONTEXT.md D3,
      mirroring `normalizeChild`'s existing missing-`verify` rule at
      `decompose.mjs:127-131`).
   c. `resolveDecompose`: each of the four outcome branches
      (`invalid`/`need-human`/`pass-through`/`decompose`) calls the
      **already-shipped** `addDecision(dir, { id, text, source:
      'judgeDecompose', rationale, alternatives? })` alongside its existing
      `moveStage`/`putInAwaiting` call. `text` is required by the shipped
      schema (unconditionally, unrelated to this feature) — a short fixed
      label per branch (e.g. `"decompose verdict: pass-through"`,
      `"decompose verdict: decompose (N children)"`), distinct from
      `rationale` (the why, per CONTEXT.md's pinned term: `verdict.reason`
      → `rationale`). `invalid`'s `rationale`/`text` are always the fixed
      strings from CONTEXT.md D3 (no model text exists to draw from on
      that path).

No other files are in scope. No `fgos graph`-driven reordering needed —
one file, one internal dependency chain (prompt/parsing before wiring).

## Risk map

| Component | Risk | Proof point (→ fgos-coding-validating) |
|---|---|---|
| `decompose.mjs` reason parsing (D2/D3) | medium — a required top-level `reason` on the `decompose` branch changes what a previously-valid model response now normalizes to | Confirm `test/intake/plan.test.mjs`'s 13 `verdict: 'decompose'` fixtures (2 unaffected — 0-children and missing-verify negative paths); the other ~11 need a `reason` field added or they flip to `kind: 'invalid'`; add one new case for "decompose verdict missing top-level reason → invalid" |
| `resolveDecompose` calling the shipped `addDecision` on every branch | low — additive call, no existing return-shape change (per `resolveDecompose`'s own doc comment, `outcome` values are unchanged); `text`/`rationale`/`id`/`source` are all fields the shipped `addDecision` already accepts | Confirm `view.decisionsById['<item-id>']` gains one entry per `discover` call, for all 4 branches (invalid/need-human/pass-through/decompose) — this is the item's own stated verify criterion |

## Concrete cases to prove against

- `judgeDecompose` returns `pass-through` with no `reason` — must fall back
  to the fixed rationale (D2), not throw.
- `judgeDecompose` returns `decompose` with children but no top-level
  `reason` — must normalize to `invalid` (D3), matching the existing
  missing-child-`verify` precedent.
- `judgeDecompose` returns `invalid` (model/parse failure) — `rationale`/
  `text` logged are always the fixed strings, never sourced from `verdict`.
- Two consecutive `discover` calls on the same item, different branches
  each time (e.g. `need-human` then `decompose`) — `view.decisionsById[id]`
  must accumulate both, never overwrite (append-only, matches
  `view.discovery[id]`'s existing rule and tsk-63c's own fold comment).
- Re-entrant `already-decomposed` path (`decompose.mjs:287-292`) — leaning
  toward: no new record here, since children already carry their own trace
  and this path is purely a crash-recovery no-op, not a fresh judgment —
  flagged for `fgos-coding-implement` to confirm against the item's own verify
  wording ("cả 4 nhánh").

## No split

One file, one coherent change: the prompt/parsing change (1a/1b) has no
standalone value without the wiring (1c) actually using the new field, and
neither has an independently runnable verify command apart from the
item's own stated verify (all 4 branches recording a decision). Proceeds
as one item.
