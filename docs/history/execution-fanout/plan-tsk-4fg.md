# fgos list child-view gate — plan (`tsk-4fg`)

Mode: standard

Flags counted (per `fgos-routing`'s Mode gate): **public contracts**
(`herdr-plugin/src/fgos.rs` reads `fgos list --all --json`'s `work` map
shape literally — see D1) and **existing covered behavior**
(`test/cli/fgos.test.mjs` already tests `list`'s current two modes). 2
flags → **standard** lane. No auth/authorization/data-model/audit-security/
cross-platform/multi-domain flags apply.

`impact-analysis: degraded` — `fgos tool query --capability impact-analysis
--status present` reports gitnexus `present`, but this session's own Bash
hook repeatedly surfaced `GitNexus index is stale (last indexed: 251d0b5)`
against the current HEAD. Per `CLAUDE.md`'s three-way gate, `present` but
flagged stale is degraded, not full — corrected here from an earlier,
inaccurate `full` claim (`fgos-coding-validating`'s reality gate). No risk-map row
below leans on GitNexus blast-radius evidence (each proof point is a new
test, not an `impact()` call), so this correction does not invalidate any
row — it is recorded for honesty per the reality-gate dimension, not
because it gates anything in this item's own scope.

`CONTEXT.md` for this item: `docs/history/execution-fanout/CONTEXT-tsk-4fg.md`
(D1, D2).

## Approach

Extend `bin/fgos.mjs`'s `case 'list'` (lines 1575-1667) default-view branch
only — the block already guarded by `!showAll` (line 1638-1641) — with two
additions, done together as one change since the badge is meaningless
without the filter and the filter is unusable without the badge (D3's own
text: "loại con thì PHẢI thay bằng chỉ báo... không thì mất luôn khả năng
thấy tiến độ cụm"):

1. **Filter.** From the already-`isResolvedStatus`-filtered `view.work`,
   additionally drop any entry whose `parent` is set AND whose parent id is
   present as a key in that SAME filtered `view.work` (honors D2: a child
   whose parent got filtered out, or has no parent entry at all, is left
   in the map untouched — it falls back to a normal top-level row for
   free, no special-case code needed, since the filter only ever removes
   a child when its parent row still exists to carry the badge).
2. **Badge.** For every id that IS a parent of at least one child in the
   pre-filter `rawView.work` (not the filtered set — a parent's badge must
   count ALL its children, including any already resolved/hidden ones, to
   get an honest `doneCount/totalCount`), compute `{done, total}` the same
   way `collectRollupData` already does (`bin/fgos.mjs:729-737`: children
   = `Object.values(view.work).filter(w => w.parent === id)`, `done` =
   children with `status === 'done'`) and attach it to that parent's own
   entry in the filtered `view.work` before returning. Reuse the existing
   helper directly (call the same children-counting logic, or factor the
   two-line count out of `collectRollupData` into a shared function called
   by both `list` and `rollup` — implementer's call, not a product
   decision) rather than re-deriving the count a third way.

`--all` (line 1639 `showAll` branch) is untouched — D1. `--id` single-item
lookup (line 1597-1631) is untouched — it already commits to one item
regardless of status/parent, a separate contract this item's own decisions
never touched.

**Rejected alternative:** a third `list` mode (e.g. `--grouped`) instead of
changing the default view's shape. Rejected because the item's own
description and D3 are explicit the *default* view is the one with the
visibility problem (237 rows, 25% children, measured against default) —
adding a third mode alongside two already-confusing ones does not fix what
people actually see when they type `fgos list` bare.

## Risk map

| Component | Risk | Proof point (→ `fgos-coding-validating`) |
|---|---|---|
| Default-view filter shape change | medium — could hide a child that has no visible parent in ways D2 didn't anticipate | new test: item with `parent` pointing at a resolved (hidden) parent still appears as a top-level row in default `list --json` output |
| Badge honesty (counts all children, not just visible ones) | medium — a badge computed only from the filtered set would undercount when some children are already `done` (correctly hidden as individually-resolved) | new test: parent with 3 children (1 `done`, 1 `doing`, 1 `todo`) shows badge `1/3` in default `list --json`, and the 2 open children are absent from that same output |
| `--all` untouched | low — pure omission (new code only runs in the `!showAll` branch) but is the one flagged public-contract risk | new test: `list --all --json` output is byte-identical in shape (same `work` map keys) to a snapshot taken before this change — confirms herdr-plugin's contract holds |
| Regression on existing `list` tests | low | existing `test/cli/fgos.test.mjs` suite (part of item's own verify) |

## Files touched

- `bin/fgos.mjs` — `case 'list'` (~1575-1667), reusing/refactoring
  `collectRollupData` (~724-739)
- `test/cli/fgos.test.mjs` — new cases per risk map above

## Assumptions

- No recursive grandchild case exists in this repo's current `.fgos` (open
  question left to `fgos-coding-validating`/implementer if it surfaces — D3's own
  text and this item's scope only ever discuss one level of `parent`).
- Badge field name/shape in JSON output (e.g. `childProgress: {done,
  total}` on the parent's work entry) is an implementer choice — not
  pinned by `CONTEXT.md`, which deliberately left this to planning/
  execution (see CONTEXT-tsk-4fg.md's own "Câu để lại cho planning").
  Picking it here: `childProgress: { done, total }`, additive-only field,
  present only on parent rows that have at least one child — keeps
  `--all`'s shape (which never gains this field) and every existing
  default-view consumer's shape (an added key on some rows) both
  non-breaking under normal JSON-consumer tolerance.

## Split decision

No split. One cohesive change (filter + badge, `bin/fgos.mjs` + its test
file) — `fgos graph --json` shows this item as an isolated 1-node component
(no deps, no existing children), and the risk map above has no piece large
enough to warrant its own item.
