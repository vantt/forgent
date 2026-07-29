---
item: tsk-6b6
stage: decompose (shaping)
date: 2026-07-29
---

# plan.md: decompose verdict capture

## Mode

Flags counted against the mechanical gate:

| Flag | Applies? | Why |
|---|---|---|
| auth | no | |
| authorization | no | |
| data model | **yes** | `addDecision`'s payload shape changes (`store.mjs:603`), and `decision` events' fold shape changes (`replay.mjs:254-255`) |
| audit/security | **yes** | this feature IS the audit/decision-trail mechanism for an automated judge — the exact surface tsk-ma4's audit was about |
| external systems | no | no new external call; the model/judge-executor path already exists |
| public contracts | **yes** | `addDecision`/CLI `decision` verb is an existing public surface; see the compatibility risk below — the naive reading of CONTEXT.md D1 ("rationale required") would break it |
| cross-platform | no | |
| existing covered behavior | **yes** | `bin/fgos.mjs:1025` is the ONLY production caller of `addDecision`, passing `{text}` only; `test/cli/fgos.test.mjs:694,705` and every `fgos decision --text` call inside `fgos-exploring`/`fgos-planning`/`cook` skills (including the 6 decision calls already logged for this very item) depend on that shape staying callable |
| weak proof around the area | **yes** | item's own `verify` field reads "chưa xác định — P15 bổ sung" (not yet determined) |
| multi-domain | no | single domain (coding), `src/intake` + `src/state` + `bin` |

**5 flags → high-risk mode**, per the mechanical rule (4+ flags). Confirmed
by direct grep evidence, not vibes — see Risk map below for the one flag
(existing covered behavior) that actually threatens a live regression if
handled naively.

## Approach

### The one real risk: "rationale required" as CONTEXT.md D1 literally reads would break production today

CONTEXT.md's D1 says `addDecision` gains `rationale (required, throws if
blank — mirrors bee's decisions.mjs:307-308)`. Taken unconditionally, this
breaks the **only** existing production caller
(`bin/fgos.mjs:1025`: `addDecision(dir, { text })`, no rationale) and fails
two live tests (`test/cli/fgos.test.mjs:694` "decision logs one event...
exit 0", and implicitly every bare `fgos decision --text "..."` call this
session already made while locking tsk-6b6's own D1-D5, and every call
`fgos-exploring`/`fgos-planning`/`cook` skills make the same way).

**Resolution (implementation detail, not a reopening of D1):** `rationale`
is required **only when `payload.id` is present** — i.e., only for the new
id-scoped shape `judgeDecompose` actually uses. A bare, unscoped
`addDecision(dir, { text })` call (today's only production shape) is
completely untouched: no `id`, so no rationale requirement, identical
behavior to today. This is the only reading that honors D1's "required"
language for the feature it was written for (judgeDecompose's own calls
always carry `id` + `source: 'judgeDecompose'`) without regressing the
pre-existing global decision log every skill in this repo already depends
on. Flagged as this plan's #1 proof point for `fgos-validating`.

### Fold shape for `view.decisions[id]`

Checked `replay.mjs:322-338` (`work.discovery`) and the sibling
`work.friction`/`work.outcome` cases: each of those is a **separate, already
id-namespaced event type** (`work.discovery`, not `decision`), so they only
ever fold into their own `view.<key>[id]`, never also into a flat array.
`decision` is different — it is ONE event type serving both the pre-existing
global log and (after this change) the new id-scoped shape. Resolution:
`case 'decision'` in `replay.mjs` branches on `payload.id` —
- **`id` present** → append to `view.decisions[id]` (lazy key, array,
  append-only — same append rule `work.discovery` already uses), and
  **not** also pushed into the flat `view.decisions` array.
- **`id` absent** → exactly today's behavior: push into the flat
  `view.decisions` array.

This keeps `test/state/replay.mjs:86` ("foldEvents collects decision events
into view.decisions... `{text, ts}`") passing unmodified for every
id-less event — old and new — while giving `judgeDecompose`'s calls a
dedicated per-item view exactly like `view.discovery[id]`.

### Files touched, in dependency order

1. **`src/state/store.mjs`** — extend `addDecision(dir, payload)`: accept
   optional `id`, optional `rationale`/`alternatives`/`source`; throw
   `StoreError('validation', ...)` when `id` is present and `rationale` is
   blank/missing (mirrors the existing blank-`text` check already there).
   `text` stays required exactly as today, unconditionally (D1 does not
   touch it — bee's `decision` field and fgOS's existing `text` field serve
   the same "what was decided" role; nothing here renames or drops it).
2. **`src/state/replay.mjs`** — `case 'decision'`: add the `id`-branch fold
   described above.
3. **`bin/fgos.mjs`** — `case 'decision'`: add optional `--id`,
   `--rationale`, `--alternatives`, `--source` flags, threaded straight
   into `addDecision`'s payload (same `optionalField` idiom every other
   optional flag in this file already uses). Additive only — no existing
   flag changes shape.
4. **`src/intake/decompose.mjs`** —
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
      (`invalid`/`need-human`/`pass-through`/`decompose`) calls
      `addDecision(dir, { id, source: 'judgeDecompose', rationale, alternatives? })`
      alongside its existing `moveStage`/`putInAwaiting` call — `rationale`
      sourced per CONTEXT.md's pinned term (`verdict.reason` →
      `rationale`), with `invalid`'s rationale always the fixed string
      from CONTEXT.md D3 (no model text exists to draw from on that path).

No `fgos graph`-driven reordering needed — this item has no children today
and nothing else in the graph depends on it landing in a particular
sub-order; the four files above have a strict internal dependency chain
(schema before wiring, prompt before wiring) which already fixes the order.

## Risk map

| Component | Risk | Proof point (→ fgos-validating) |
|---|---|---|
| `addDecision` required-rationale scoping | **high** — naive reading breaks the only production caller + 2 live tests + every skill's bare decision logging | Confirm `test/cli/fgos.test.mjs:694,705` still pass unmodified; confirm a bare `fgos decision --text "..."` (no `--id`) still exits 0 after the change |
| `replay.mjs` decision fold branch | medium — must not touch the flat-array path for id-less events | Confirm `test/state/replay.mjs:86-97` (the two existing decision-fold tests) still pass byte-for-byte |
| `decompose.mjs` reason parsing (D2/D3) | medium — a required top-level `reason` on the `decompose` branch changes what a previously-valid model response now normalizes to | Confirm existing `test/intake/decompose.test.mjs` cases for `decompose`-with-children still pass once fixtures gain a `reason` field; add one new case for "decompose verdict missing top-level reason → invalid" |
| `resolveDecompose` calling `addDecision` on every branch | low — additive call, no existing return-shape change (per `resolveDecompose`'s own doc comment, `outcome` values are unchanged) | Confirm `view.decisions['<item-id>']` gains one entry per `discover` call, for all 4 branches (invalid/need-human/pass-through/decompose) — this is the item's own stated verify criterion |
| CLI `decision` verb new flags | low | Confirm `--id`/`--rationale`/`--alternatives`/`--source` are all optional and omitting all four reproduces today's exact behavior |

## Concrete cases to prove against

- Bare `fgos decision --text "..."` (no id) — must still work exactly as
  today (regression guard for the #1 risk above).
- `judgeDecompose` returns `pass-through` with no `reason` — must fall back
  to the fixed rationale (D2), not throw.
- `judgeDecompose` returns `decompose` with children but no top-level
  `reason` — must normalize to `invalid` (D3), matching the existing
  missing-child-`verify` precedent.
- `judgeDecompose` returns `invalid` (model/parse failure) — `rationale`
  logged is always the fixed string, never sourced from `verdict`.
- Two consecutive `discover` calls on the same item, different branches
  each time (e.g. `need-human` then `decompose`) — `view.decisions[id]`
  must accumulate both, never overwrite (append-only, matches
  `view.discovery[id]`'s existing rule).
- Re-entrant `already-decomposed` path (`decompose.mjs:287-292`) — decide
  whether it also logs a decision record or stays silent (it currently
  calls `moveStage` only, same as `pass-through`, but is a *different*
  outcome kind not explicitly named in CONTEXT.md's four branches); leaning
  toward: no new record here, since children already carry their own trace
  and this path is purely a crash-recovery no-op, not a fresh judgment —
  flagged for `fgos-validating` to confirm against the item's own verify
  wording ("cả 4 nhánh").

## No split

This is one coherent piece: the schema extension (files 1-3) has no
standalone value without `decompose.mjs` actually calling it (the item's
own verify criterion needs all three), and the prompt change (4a/4b) has no
standalone value without the wiring (4c) actually using the new field.
Splitting into "schema" / "prompt" / "wiring" child items would produce
three items with no independently runnable verify command — exactly what
step 5's own rule rules out. Proceeds as one item.
