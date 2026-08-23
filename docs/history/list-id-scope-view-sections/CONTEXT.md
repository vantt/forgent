item: tsk-2u9

# CONTEXT — tsk-2u9: fgos list --id doesn't scope every view section to the requested item

## Feature boundary

`fgos list --id <id> --json` (`bin/fgos.mjs`'s `list` handler, around line
1577-1589) correctly scopes `work` to just `{[id]: item}`, but spreads the
rest of the raw view (`decisions`, `discovery`, `gates`, `settlements`,
`outcomes`, `frictions`, `learnings`, `decisionsById`, `tools`) unfiltered
from the entire backlog. This contradicts documented behavior in
`plugins/fgOS/skills/pick/SKILL.md` step 3 ("filtered to just this item so
the call never dumps the whole backlog") and `fgos-coding-exploring/SKILL.md` step
1 (reads `view.discovery["<item-id>"]`, implying scoped access). Confirmed
live: a single-item lookup on this repo's real `.fgos/` store returned
2.2MB (1334 decisions entries, 201 discovery keys, 138 gates keys, etc.)
for a request naming exactly one item.

Note: the ACCESS PATTERN callers already use (indexing the id-keyed dicts
by the same id, e.g. `view.discovery["<item-id>"]`) already returns
correct data today, since those dicts are already keyed by item id — this
bug is a response-SIZE/token-cost problem, not a correctness problem.

## Locked decisions

| ID | Decision | Why |
|----|----------|-----|
| D1 | Fix the code (scope every id-keyed view section), not the docs. | Real, repeatedly-hit pain point this session — 2.2MB for a single-item lookup, on every driving-loop iteration. Fix is mechanical and low-risk; chosen over lowering the docs' promise to match wasteful current behavior. |
| D2 | Scope `discovery`/`gates`/`settlements`/`outcomes`/`frictions`/`learnings`/`decisionsById` (dicts keyed by item id) to `{[id]: v[id]}` when present, omitting the key when absent. Filter the flat `decisions` array to entries where `d.id === id`. Leave `tools` untouched (a global tool-registry map keyed by tool name — `gitnexus`, `submit-assist-classify` — never a work item id). `work`'s existing `--id` behavior is unchanged. | Confirmed each section's real shape via a live `listWork()` read against this repo's own `.fgos/` store before locking, plus grepping `bin/fgos.mjs`'s own writer call sites (`addDiscovery`/`putInAwaiting`/`recordGateApprove`/etc.). `decisions` entries sometimes carry no `id` at all (global, not item-tied decisions) — those are correctly excluded by the `d.id === id` filter, not a special case. |

## Pinned terms

- "id-keyed view section" = a top-level key on the folded view object
  (`replay.mjs`'s `rebuildView`/`foldEvents` shape) whose value is a plain
  object mapping work-item id → per-item data. Confirmed today:
  `discovery`, `gates`, `settlements`, `outcomes`, `frictions`,
  `learnings`, `decisionsById`. `work` is also id-keyed but already
  correctly scoped by the existing code. `decisions` is NOT id-keyed (a
  flat append-only array; some entries lack an `id` field). `tools` is
  keyed by tool NAME, not item id, and is out of this item's scope
  entirely.

## Scout evidence

- `bin/fgos.mjs:1570-1589` — the exact `list --id` handler:
  `const singleView = { ...rawView, work: { [id]: item } };` — spreads
  `rawView` (the full, unfiltered view) and only overwrites `work`. Every
  other key passes through untouched.
- Live repro this session: `node bin/fgos.mjs list --id tsk-2aa --json`
  against this repo's real store returned `work` correctly scoped to 1
  entry, but `decisions: 1334 items`, `discovery: 201 keys`, `gates: 138
  keys`, `settlements: 275 keys`, `outcomes: 320 keys`, `frictions: 86
  keys`, `learnings: 166 keys`, `decisionsById: 170 keys`, `tools: 2 keys`
  — total response 2,214,741 bytes for a single-item request.
  wc -c confirmed the byte count directly.
- `node -e "import('./src/state/store.mjs').then(({listWork}) => ...)"` —
  confirmed live shapes: `tools` keys are `["gitnexus",
  "submit-assist-classify"]` (tool names, not item ids); a sampled
  `decisions` entry carries no `id` field at all (a global decision, not
  tied to a specific work item); `decisionsById`'s sampled key
  (`tsk-3t9`) is a real work item id, confirming it is genuinely
  id-keyed.
- `src/state/awaiting-context.mjs:49-104` — `computeAwaitingContext(view,
  id)`, called on `singleView` right after scoping (`bin/fgos.mjs:1584-
  1586`) when the item is `awaiting-human`. Reads `view.work[item.parent]`
  for the parent's live record — but `view.work` is ALREADY scoped to just
  `{[id]: item}` by the EXISTING (pre-this-item) code, so this lookup
  already returns `undefined` for any awaiting-human item with a parent,
  today, unrelated to this item's fix. Confirmed pre-existing, out of
  scope for tsk-2u9 — not touched here. `computeAwaitingContext` itself
  only reads `view.gates?.[id]` (single-id lookup), so scoping `gates` per
  D2 does not affect its correctness.
- Documented (contradicted) behavior:
  `plugins/fgOS/skills/pick/SKILL.md` step 3 ("filtered to just this item
  so the call never dumps the whole backlog"),
  `.claude/skills/fgos-coding-exploring/SKILL.md` step 1 (`fgos list surfaces
  view.discovery["<item-id>"]`).
- Impact-analysis capability gate (`fgos tool query --capability
  impact-analysis --status present`): GitNexus present → posture `full`.

## Canonical references

- `bin/fgos.mjs` (the `list` verb handler)
- `src/state/replay.mjs` (`rebuildView`/`foldEvents` — the view shape this
  handler scopes from)
- `src/state/awaiting-context.mjs` (the one existing consumer of
  `singleView` beyond the return value itself)
- `plugins/fgOS/skills/pick/SKILL.md`, `.claude/skills/fgos-coding-exploring/
  SKILL.md` — the documented (currently contradicted) behavior this fix
  makes true.

## Outstanding questions deferred to planning

- Exact code shape (a shared helper function vs. inline scoping at each
  key, whether to reuse `Object.fromEntries`/a small `pick`-style utility)
  — implementation detail, not material to what the fix does.
- Real `verify` command for this item — currently
  `"chưa xác định — P15 bổ sung"`; planning/validating sets the real one.
- Whether any other `fgos <verb>` besides `list` builds a similar
  single-item view via the same unscoped-spread pattern (a quick grep for
  other `{ ...rawView, work: ... }`-shaped constructions) — worth a scout
  pass at planning, but out of this item's own locked scope unless
  planning finds a second real call site.
