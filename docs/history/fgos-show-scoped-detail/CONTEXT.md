# fgos show — scoped single-task detail

Item: tsk-2fw. Stage at write time: `clarify`.

## Feature boundary

Add a new fgOS CLI verb `fgos show <id>` (bin/fgos.mjs + registered in
src/cli/command-registry.mjs) and a matching plugin skill
`/fgOS:show <task-id>` (plugins/fgOS/skills/show/) that wraps it. `show`
returns the full detail of exactly one work item, scoped to that item's
own id across every per-item log the store keeps — not just the `work`
record itself. This is a read-only verb: it never appends an event, same
class as `list`/`ready`/`graph`/`stale`/`conflicts`.

Out of scope: any human-formatted rendering. Both with and without
`--json`, output is `JSON.stringify(data, null, 2)` (D2) — `--json` is
accepted for compatibility/discoverability but is a no-op on shape.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | `show` is a dedicated CLI verb (`fgos show <id>`), not a skill-only wrapper around `list --id`. It filters `decisions`/`discovery`/`gates`/`outcomes`/`learnings` down to just the named item's id — a true single-task full-detail view, distinct from `list --id`'s behavior of scoping only `work` while leaving those arrays/maps global. |
| D2 | Default (no `--json`) output is raw `JSON.stringify(data, null, 2)`, identical to `--json`. No separate human-readable key:value renderer. |

Both logged to the item's append-only decision log (`fgos decision --id
tsk-2fw`, seq 1894/1895) alongside this doc.

## Scout evidence

- `bin/fgos.mjs:1076-1096` (`case 'list'`): `--id` already resolves
  `rawView.work[id]` and returns `{ ...rawView, work: { [id]: item } }` —
  only the `work` key is scoped; `decisions`, `discovery`, `gates`,
  `settlements`, `outcomes`, `frictions`, `learnings`, `decisionsById`
  pass through untouched (confirmed by running `list --id tsk-2fw --json`
  live: `decisions` array included entries for unrelated items like
  `tsk-64s`, `bo-hardcode-ten-trunk-main`).
- No `show` verb exists anywhere in `bin/fgos.mjs` or
  `src/cli/command-registry.mjs` today. The only existing `show` is an
  unrelated sub-verb of `goal` (`fgos goal show`, command-registry.mjs:716,
  fgos.mjs:2354) — a focus-pointer read, not a work-item detail read.
- `plugins/fgOS/skills/` has no `show/` directory. `list/SKILL.md` is the
  closest existing pattern: thin wrapper that shells out to the verb via
  `node ${CLAUDE_PROJECT_DIR}.../bin/fgos.mjs <verb> --json`, then renders
  the result — same shape the new `show` skill should follow, minus any
  rendering step per D2.
- Per-item log shapes, from `src/state/replay.mjs`/`store.mjs`:
  - `view.discovery[id]` — array, lazy key (replay.mjs, confirmed also by
    `fgos-coding-exploring`'s own step 1 usage).
  - `view.decisionsById[id]` — array, lazy key (replay.mjs:283-287).
  - `view.gates[id]` — per-item (store.mjs:431/563 comments: "gates[id]
    gains the same...", "two snapshots live side by side in gates[id]").
  - `view.outcomes[id]?.actual` — per-item (store.mjs:269).
  - `view.learnings[id]` — array, lazy key (replay.mjs:243-247).
  - `view.frictions[id]` and `view.settlements[id]` — arrays, lazy keys,
    per-item (replay.mjs:224-225/350-351/405-406). **Correction (found at
    executing time): an earlier pass of this doc misread
    `store.mjs`'s `composeLearning(view, id, ...)` — the `frictions[layer]
    = (frictions[layer] ?? 0) + 1` / `settlements[key] = (settlements[key]
    ?? 0) + 1` lines there (store.mjs:274-285) are a LOCAL summary object
    that function builds by iterating `view.frictions?.[id]` /
    `view.settlements?.[id]` for the one id it was called with — not a
    global aggregate keyed by layer. The real `view.frictions[id]` /
    `view.settlements[id]` are per-item, exactly like `discovery`/
    `decisionsById`/`gates`/`outcomes`/`learnings`, and belong in `show`'s
    scoped output too.** `bin/fgos.mjs` already has exactly the reusable
    per-item collectors `show` needs: `collectFrictionData(view, id)`,
    `collectSettlementData(view, id)`, `collectLearningData(view, id)`,
    `collectOutcomeEntry(id, entry)` (lines 335-440, built for the `check`
    verb) — `show` reuses these directly rather than reimplementing the
    slice, so the two verbs render identical shapes for identical data.

## Pinned terms

- "Full detail of 1 task" (from the original ask) means: the `work`
  record plus every per-item log keyed by that item's id (`discovery`,
  `decisionsById`/`decisions`, `gates`, `outcomes`/`outcome`,
  `learnings`/`learning`, `frictions`/`friction`,
  `settlements`/`settlement`) — not the single global `decisions` array
  (the append-only log across every item), which stays out of `show`'s
  scope on purpose (it is genuinely global, unlike frictions/settlements).

## docsRef

tsk-2fw was submitted before this doc existed and has no `docsRef` field.
`fgos add` only creates new items (`bin/fgos.mjs:701-702`: `requireField`
on a fresh id) — there is no update path for an existing item's
`docsRef`. Per this skill's own contract, an item without `docsRef` is
unaffected; none is set here.

## Deferred / out of scope

- A human-formatted (non-JSON) detail renderer — explicitly rejected by
  D2, not deferred as future work, just not built.
- Any change to `list --id`'s existing (unfiltered) behavior — untouched,
  kept as is for backward compatibility with existing callers (e.g.
  `/fgOS:pick`'s own step 3 already depends on `list --id`'s current
  shape).

## Outstanding questions for planning

None — both material product decisions (verb shape, output format) are
locked above. Implementation details (exact filter helper location/name,
whether `show` lives in the same `case` block style as `list`, test
placement) are planning's call.
