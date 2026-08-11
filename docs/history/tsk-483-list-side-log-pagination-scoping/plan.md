# Plan: scope list's side-logs to the returned work ids

Item: `tsk-483`. Mode: **standard** — reopens a locked spec decision
(D1), touches a well-tested public CLI verb with one protected external
contract (D2) — real risk, worked through carefully, no split (one
function's own return-shaping logic, changed at its two exit points).

## Approach

Per D3, in `bin/fgos.mjs`'s `case 'list'`:

1. Generalize the existing `scopedById(section)` (currently only defined
   inside the `--id` branch) into a shared `scopedByIds(section, idSet)`
   available to the whole case body:

```js
const scopedByIds = (section, idSet) =>
  section
    ? Object.fromEntries(Object.entries(section).filter(([id]) => idSet.has(id)))
    : {};
const scopedDecisions = (decisions, idSet) =>
  (decisions ?? []).filter((d) => idSet.has(d.id));
```

2. After `base` is computed (the existing open-default/`--all` +
   `childProgress` + `awaitingContext` logic, all UNCHANGED) and before
   the early `if (cursor === undefined && limit === undefined) return
   base;`, branch on the protected combination (D2):

```js
if (cursor === undefined && limit === undefined) {
  if (showAll) return base; // herdr-plugin's own protected contract, byte-identical
  return scopeSideLogsTo(base, new Set(Object.keys(base.work)));
}
```

   where `scopeSideLogsTo(view, idSet)` applies `scopedByIds`/
   `scopedDecisions` to `decisions`/`discovery`/`gates`/`settlements`/
   `outcomes`/`frictions`/`learnings`/`decisionsById`, leaving `work`,
   `tools`, and `awaitingContext` untouched (already correctly scoped or
   not id-keyed).

3. For the pagination branch (both `showAll` and not — D2 only protects
   the NO-pagination `--all` case), scope to the ids in `workPage` (the
   already-paginated slice) instead of the full `view.work`:

```js
const { cursor, limit } = readPaginationFlags(flags, 'list');
if (cursor === undefined && limit === undefined) {
  if (showAll) return base;
  return scopeSideLogsTo(base, new Set(Object.keys(base.work)));
}
const entries = Object.entries(view.work).map(([id, item]) => ({ id, item }));
const { items: pagedEntries, nextCursor } = paginate(entries, { cursor, limit, order: 'list-work-v1' });
const workPage = Object.fromEntries(pagedEntries.map(({ id, item }) => [id, item]));
const scoped = scopeSideLogsTo(base, new Set(pagedEntries.map(({ id }) => id)));
return { ...scoped, work: { items: workPage, nextCursor } };
```

4. Update `docs/specs/work-state.md:593-601`'s own pagination prose (D1)
   to describe the new scoping — the protected `--all`-bare exception
   named explicitly, so a future reader sees the current, real contract
   rather than the superseded one.

Impact-analysis posture: **degraded** (GitNexus present, index stale per
this session's own PostToolUse hook). Real risk is genuinely elevated
(touches `list`'s own well-tested return shape and one documented
external consumer) — mitigated by the exhaustive cases below, especially
the herdr-plugin protection case, rather than a lower posture claim.

## Cases

- **Boundary**: an item with no decisions/discovery/gates/etc. at all
  (a freshly-added item) — `scopedByIds` on an absent/lazy key returns
  `{}`, matching today's lazy-key convention exactly (per replay.mjs's
  own "lazy key" doc comments already read in tsk-2u9's own evidence).
- **Existing behavior unchanged — the ONE protected case**: `list --all
  --json` (no `--cursor`/`--limit`) must remain byte-for-byte identical
  to today, proven by a regression test that runs it before AND after
  this change (or, more precisely, snapshotting the current shape and
  asserting the post-fix output still contains ALL of a known
  closed/hidden item's own decisions/outcomes — something the new
  scoping would otherwise strip).
- **Existing behavior unchanged — `list --id`**: untouched by this item
  (already correctly scoped by tsk-2u9); a regression test confirms its
  own shape is unaffected.
- **New scoping, default (bare) call**: `fgos list` (no flags) — every
  side-log section now contains ONLY entries for ids present in the
  (open-only, non-done) `work` map — a done item's own decisions/outcomes
  must NOT appear.
- **New scoping, `--all --limit N`**: a combination herdr-plugin never
  uses — proves scoping now applies even with `--all`, once pagination
  flags are present.
- **New scoping, plain pagination (`--limit`/`--cursor`, no `--all`)**:
  side-logs scoped to exactly the ids in `workPage`, not the full
  pre-pagination open set — the core token-cost fix this item exists for.
- **Regression guard**: `awaitingContext` (computed from `view.work`
  before scoping) must still correctly reference items present in the
  FINAL scoped result — since `awaitingContext` is built from `view.work`
  (already the right set, computed before this item's own new scoping
  code runs) and never itself scoped by `scopedByIds`, it needs no change,
  but a test confirms it still appears correctly alongside the new
  scoping.

## Outstanding questions

None
