# fgos list child-view gate — CONTEXT (`tsk-4fg`)

`tsk-4fg` · tier `light` · risk `light` · kind `docs` · stage `clarify` ·
`docsRef` = `docs/history/execution-fanout/` (shared with `tsk-umc`, its own
sibling item per D3 below — this file scopes `tsk-4fg`'s own decisions only;
`tsk-umc`'s remain in `CONTEXT.md` in this same directory) · `refs` =
`docs/history/execution-fanout/DISCUSSION.md#design` · `verify` = `node
--test test/cli/fgos.test.mjs && npm test`

Sourced from `tsk-umc`'s own D3 (`fgos decision --id tsk-umc`, seq 8898,
`DISCUSSION.md` §3 row 24, §5 round 3/round 8 §"(3) — view lever"): the
messy-task-list problem gets solved by a **view gate** (list/view drops
children from the list), not a model change — and is its own item because
fan-out (`tsk-umc`) multiplies this pain N× (`tsk-umc` `mergeAfter` =
`tsk-4fg`, `fgos edit tsk-umc --merge-after tsk-4fg`, seq 8946).

## Ranh giới tính năng

**Trong phạm vi:** `fgos list`'s **default** (non-`--all`) view: drop rows
for items that have a `parent` AND whose parent item is itself present and
visible in that same default view; replace them with a progress badge on
the parent row (e.g. `tsk-38t (3/8)`), reusing `collectRollupData`'s
existing `doneCount`/`totalCount` logic (`bin/fgos.mjs:724-739` — counts
only `status === 'done'`), lifted from the `rollup` verb to the `list`
layer.

**Ngoài phạm vi:**
- `--all` mode — stays byte-identical/raw (D1 below).
- TTL-aware cleanup-queue trimming — separate item (`tsk-59x`, next in this
  sequence).
- `rollup` understanding `targets` (milestone/epic clusters) — separate
  item (`tsk-1ug`).
- Any change to the underlying work-item model (`parent`, `deps`, decompose)
  — D3's own text is explicit this is a view fix, not a model fix.

## Quyết định đã khoá

| D-ID | Quyết định | seq |
|---|---|---|
| **D1** | Child-filter + progress badge applies only to `fgos list`'s default (open) view. `--all` stays byte-identical/raw. | 9059 |
| **D2** | A child whose parent is resolved/hidden (`done`/`wontfix`) but is itself still open falls back to showing as a normal top-level row (not hidden, no badge home for it). | 9060 |

## Thuật ngữ đã ghim

| Từ | Nghĩa trong item này |
|---|---|
| **children shown normally (orphan)** | an item with `parent` set, where the parent is *not* present/visible in the current default view (resolved and filtered out, or otherwise absent) — per D2, rendered as an ordinary top-level row, exactly as if it had no `parent` |
| **progress badge** | the `doneCount`/`totalCount` pair `collectRollupData` already computes for a given parent id (`bin/fgos.mjs:729-737`), rendered inline on that parent's list row |

## Bằng chứng scout

`impact-analysis: full` — `fgos tool query --capability impact-analysis
--status present` returns gitnexus `status: present`, freshly checked this
session (no stale-index warning surfaced).

- `bin/fgos.mjs:1575-1667` (`case 'list'`) — today's only two modes: `--id`
  (single-item), and open-default (`isResolvedStatus` filter) vs `--all`
  (raw). Neither mode groups children under parents or emits a progress
  indicator.
- `bin/fgos.mjs:1576-1589` (comment) — `herdr-plugin/src/fgos.rs` parses
  `fgos list --all --json` and reads `item.status` literally per row
  (confirmed live: `herdr-plugin/src/fgos.rs:318-333` calls `run_fgos(root,
  &["list", "--all", "--json"])` for its in-process pane and NEED-ANSWER
  box). This is the concrete reason D1 keeps `--all` untouched — changing
  its `work` map shape would silently break that external, separately-built
  Rust consumer.
- `bin/fgos.mjs:724-739` (`collectRollupData`) — existing `doneCount`/
  `totalCount` computation this item's badge reuses verbatim, per D3's own
  "dùng cái `fgos rollup` đang làm, chỉ đưa lên tầng list" text.
- Live orphan-case proof in this repo's own `.fgos` (checked this session,
  2026-08-07): `tsk-19y` is `done`; its children `tsk-5lr` (`doing`),
  `tsk-3v2` (`doing`), `tsk-4n7` (`todo`) are still open. Without D2's
  fallback, these three would vanish from `fgos list` entirely — no parent
  row left in the filtered view to host their badge. This is exactly the
  kind of silent-visibility-loss the item exists to fix, not reintroduce.
- `test/cli/fgos.test.mjs:527-530` — existing precedent for a domain-
  agnostic-consumer-aware `list --json` test (`parkReason` exposure test);
  same shape this item's new tests should follow for the child-filter/badge
  behavior.

## Tham chiếu chuẩn

- `docs/history/execution-fanout/DISCUSSION.md` — §3 row 24, §5 round 3 /
  round 8 "(3) — view lever, đã chốt thành D3", §4 D3 row (seq 8898)
- `docs/history/execution-fanout/CONTEXT.md` — sibling item `tsk-umc`'s own
  decision doc; row 23 there names this item and the `mergeAfter` ordering
- `bin/fgos.mjs:1575-1667` (`list`), `:724-739` (`collectRollupData`)
- `herdr-plugin/src/fgos.rs:46,187,224,318-333` — the external `--all`
  consumer D1 protects

## Câu để lại cho planning

- Exact badge rendering shape in both `--json` (a new field on the parent's
  work entry, e.g. `childProgress: {done, total}`) and any human-readable
  output — this item's own concern is the two product decisions above, not
  the field name/format, which is an implementer choice.
- Whether the child-filter also needs to recurse (a child that is itself a
  parent of further children) — no such case currently exists in this
  repo's `.fgos`, so this is speculative; planning should scout for it
  fresh rather than trust this snapshot.
