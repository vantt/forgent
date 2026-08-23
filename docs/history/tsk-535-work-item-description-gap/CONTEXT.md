# tsk-535 — work items with no description at all

## Feature boundary

Three write paths let a work item land with `description` completely
missing: `fgos add` (no `--description` flag exists), decompose-child
creation (`normalizeChild`/`addWork` in `src/intake/plan.mjs` never
sets it), and the runner's discovered-work channel (`src/runner/
loop.mjs:626`, `block.description` is optional per the worker-prompt-
template's `fgos-discovered` schema — found mid-planning, D4). This item
fixes all three write paths AND backfills the items already broken by
them.

## Scout evidence

- **Live count (2026-08-06, this session)**: 112/398 items missing
  `description` entirely (92 decompose children, 20 `add`-created root
  items) — up from the 53/187 measured 2026-07-31 (tsk-4zg's own commit
  message), consistent with the item's own framing: this gets worse as the
  store grows via `add`/`decompose`.
- **`fgos add`'s param list has zero description-shaped flag**
  (`src/cli/command-registry.mjs`, `add` verb definition) — confirmed by
  reading its full parameter list.
- **`normalizeChild`/`addWork` in `src/intake/plan.mjs`** never set
  `description` on a decompose child — confirmed by reading the current
  (post-tsk-3xd-merge) source.
- **tsk-4zg already shipped and closed** (`status: done`, commit `5679d82`,
  2026-07-31): re-derived `title` from `description` for 110/187 items via
  `fgos edit --title` (the same mechanical door `submit` itself uses), and
  **deliberately skipped** the 53 items with no `description` at all —
  `deriveTitle` on empty input returns `'Untitled submission'`, which would
  have destroyed real titles rather than shortened them. tsk-4zg filed this
  item (tsk-535) as the explicit follow-up for that gap; its own `deps`
  field lists `tsk-535`, recording that relationship. **The feared title
  data-loss never happened — it was engineered around by tsk-4zg itself.**
  Confirmed via `git show 5679d82` and its own commit message.
- **tsk-3xd (merged just before this item's own clarify) does NOT close
  this gap.** It added a new `action` field to decompose children
  (directive prose for the worker) but deliberately did NOT touch
  `description` — `docs/history/tsk-3xd-decompose-child-directive-prose/
  CONTEXT.md` D1 chose new fields over reusing `description` specifically.
  Confirmed live: decompose children created after that merge still carry
  no `description`.
- Impact-analysis posture: GitNexus present but index stale (flagged this
  session) — degraded, not full. No proof point here leans on blast-radius
  evidence, so this is informational only.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | `fgos add` gets a REQUIRED `--description` flag — no default fallback (e.g. no silent `description = title`). Forces a caller to supply real content rather than perpetuating the same content-free duplication D2 explicitly avoids for the LLM path. |
| D2 | Decompose-child `description` = the child's own `title` (not `action`). Copying `action` (tsk-3xd's new directive-prose field) into `description` would just duplicate content with no added meaning — `action` is worker-facing prose, `description` is the item's own record of what it is. `title` = `description` is simple, mechanical, matches this item's own original proposal, and gives a future title re-derive (tsk-4zg's own pattern) a real, non-empty source. |
| D3 | Backfill is IN SCOPE. The 112 currently-broken items get `description = title` via `fgos edit --description`, the same one-door-write (`edit` verb, event-log append) tsk-4zg's own closure (commit `5679d82`) already used for its 110-item re-derive pass — no new mechanism, just applying `edit` per item. |
| D4 | Scope covers a third write path, found mid-planning: `src/runner/loop.mjs:626`'s discovered-work `addWork` call (`fgos-discovered` report channel), where `block.description` is optional per the worker-prompt-template schema. Fixing only `add` + decompose-child would leave this path able to reintroduce the same defect going forward. Fallback to `title` when a worker's discovery block omits `description`, same D2 pattern. |

## Pinned terms

- **Description gap**: an item whose `description` field is `undefined`,
  `null`, or an empty/whitespace-only string — the exact shape `fgos-535`'s
  own scout measured (92 decompose children + 20 root items, live).
- **Backfill**: a one-time pass writing `description = title` for every
  currently-affected item, through the existing `edit` verb — not a new
  migration mechanism, not a schema change.

## Canonical references

- `src/cli/command-registry.mjs` — `add`/`edit` verb parameter lists
  (`edit` already has `--description`, `add` does not).
- `src/intake/plan.mjs` — `normalizeChild`/`addWork`, the decompose
  write path this item's other half fixes.
- `src/runner/loop.mjs:626` — the discovered-work `addWork` call, D4's
  third write path.
- `docs/history/tsk-3xd-decompose-child-directive-prose/CONTEXT.md` — D1
  (why `action` is a separate field from `description`), D3 (scope
  boundary between the two items), D4 (ordering: tsk-3xd before tsk-535).
- `git show 5679d82` — tsk-4zg's own closure commit: 110/187 titles
  re-derived, 53 skipped, this item filed for the gap.
- `docs/history/work-item-title-contract/CONTEXT.md` — tsk-4zg's own
  locked decisions (D4: re-derive titles from description for all items).
- `docs/explanation/pure-fgos-state-items-cannot-close-through-return.md`
  — how a pure `.fgos/` state mutation (like this item's own backfill
  phase may be) closes without a source-code commit on its own branch;
  cited for context, not yet a locked implementation choice (planning's
  call).

## Outstanding questions deferred to planning

- Exact mechanics of the backfill phase (a loop over `fgos edit
  --description` calls vs. a small script; whether it closes the same way
  tsk-4zg's own state-only commit did, per the referenced explanation doc
  above) is an implementation choice, not a product decision.
- Whether `add`'s new required `--description` flag needs a migration note
  for any existing caller/script that invokes `add` without it (a scope
  question for `fgos-coding-planning` to size, not decided here).
