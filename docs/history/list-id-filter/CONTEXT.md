# list --id filter (tsk-42m)

## Feature boundary

`fgos list` has no way to fetch a single work item by id. Every consumer
that wants one item today gets the entire open-item map (unbounded size),
which is exactly what produced the reported failure:
`/fgOS:pick`'s terminal-rename step calls raw `node bin/fgos.mjs list
--json` to read one just-claimed item's `title`/`description`, and on a
backlog this size the dump is too large to use (326.6KB observed in
session).

This item adds an `--id <id>` filter to the `list` verb, narrowing its
output to that single item, and rewires `/fgOS:pick`'s own call site to
use it — closing the reported bug end-to-end rather than adding an unused
capability.

Out of scope: `submit`'s and `cook`'s own `list --json` call sites (see D3
— they genuinely need the full open-item list, not a single item).

## Locked decisions

| ID | Decision | Evidence |
|----|----------|----------|
| D1 | `--id <id>` narrows `list` to a single item (`data.work["<id>"]`), following the existing `graph --what-if <id>` narrowing-flag pattern, rather than adding a new verb (e.g. `fgos show`/`fgos get`). | `bin/fgos.mjs:1085-1088` (`case 'graph'`, `--what-if` branch) is the only existing precedent for narrowing an already-registered read verb to one item via a flag. |
| D2 | `--id` bypasses `list`'s open-only default (tsk-5oa: hides `status==='done'` unless `--all`) entirely — the id is looked up directly, `--all`/status is irrelevant when a specific id is named — and throws `StoreError('validation', 'list: work "<id>" not found.')` on a miss. | Every other id-based verb already does exactly this: `take` (`bin/fgos.mjs:1328`), `pick` (`:1381`), `return` (`:1439`), `review` (`:1590`), `approve` (`:1692`), `reject` (`:2035`), `catchup` (`:2074`), `rollup` (`:517`), `compound` (`:854`) — all resolve `listWork(dir).work[id]` directly and throw the same `work "<id>" not found.` shape on a miss. `list --id` matching this is consistency, not a new pattern. |
| D3 | `submit`'s (`plugins/fgOS/skills/submit/SKILL.md:30`) and `cook`'s (`plugins/fgOS/skills/cook/SKILL.md:58`) own raw `list --json` call sites are out of scope for this item. | Scouted both: `submit` scans every open item's title for a textually-grounded dependency candidate (needs the whole open set, not one item); `cook` re-reads full state for orientation ("always fresh"). Neither is the "one item, full dump" antipattern this item fixes. |
| D4 | This item also updates `/fgOS:pick`'s own call site (`plugins/fgOS/skills/pick/SKILL.md:81`) to call `list --id <id>` instead of the bare `list --json`, so the exact reported failure is actually closed, not just made possible to avoid. | Human-confirmed scope call (AskUserQuestion, this session): leaving the new capability unwired at its own motivating call site would not resolve the reported symptom. |

## Pinned terms

- "the reported bug" = `/fgOS:pick`'s terminal-rename step dumping the
  entire open-item `list --json` output to read one claimed item's
  `title`/`description`, observed as a 326.6KB response in this session.

## Scout paths and evidence cited

- `bin/fgos.mjs:1028-1064` — `list` verb: open-only default (tsk-5oa) +
  `--cursor`/`--limit` pagination, no per-id filter.
- `bin/fgos.mjs:1085-1088` — `graph --what-if <id>` precedent for a
  narrowing flag on an existing read verb.
- `bin/fgos.mjs:1328,1381,1439,1590,1692,2035,2074` and
  `src/state/store.mjs:212,306,340,582` — every id-based verb's
  `work "<id>" not found.` error shape.
- `plugins/fgOS/skills/pick/SKILL.md:81` — the actual defective call site
  (step 3, pulling title/description after claim).
- `plugins/fgOS/skills/submit/SKILL.md:30` — full-list dependency-scan
  call site, verified out of scope.
- `plugins/fgOS/skills/cook/SKILL.md:58` — full-list orientation call
  site, verified out of scope.

## Canonical references

- `docs/decisions/` — tsk-5oa's open-only default decision (list's
  existing D1/D2, referenced in `bin/fgos.mjs:1030-1032`'s comment).

## Outstanding questions deferred to planning

- Exact output envelope shape for `list --id <id>` (e.g. whether
  `awaitingContext`/pagination keys are included, suppressed, or simply
  irrelevant when `--id` is passed) — implementation detail, not a
  product decision.
- Whether `--id` combined with `--cursor`/`--limit` should be a validation
  error or simply ignore the pagination flags — implementation detail.
- Exact diff shape for rewiring `pick/SKILL.md` step 3's two commands
  (rename + list) — implementation detail.
