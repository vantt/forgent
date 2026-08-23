# fgos-coding-validating Gate: missing case for already-created children

tsk-1x7

## Feature boundary

`fgos-coding-validating`'s Gate section (`.claude/skills/fgos-coding-validating/SKILL.md`)
names exactly two verdict commands for the `decompose`→`executing` edge:
`--verdict pass-through` ("one honest piece") and `--verdict decompose
--children [...]` ("plan.md listed real child pieces"). It gives no
guidance for the case where `plan.md`'s listed child pieces were already
created as real work items during `fgos-coding-planning`'s own step 4 (`fgos add
--parent --footprint`), rather than existing only as a JSON blob still to
be materialized.

Firing `--verdict decompose --children [...]` when those children already
exist creates duplicate positional-id children (`decompose.mjs`'s `addWork`
loop, ~line 929-945, writes unconditionally for every entry in
`verdict.children`, with no check for an existing item whose `parent`
already equals the id) while orphaning the real ones — their `parent` field
still points correctly, but the FSM's own decompose-verdict record never
references them.

This item's fix is scoped to `fgos-coding-validating/SKILL.md`'s Gate section
prose only: name the third case explicitly and point it at
`--verdict pass-through`, citing the already-existing children. No other
document repeats this Gate pattern (confirmed by grep across the worktree's
`.md` files — decompose.mjs's own code comment and the CLI test suite
reference the same two verdicts but are not guidance documents), and no
change to `decompose.mjs` is in scope (see D1).

## Locked decisions

| D-ID | Decision |
|------|----------|
| D1 | Fix is doc-only: edit `fgos-coding-validating/SKILL.md`'s Gate section to name a third case (children already created via `fgos-coding-planning`'s step 4 → use `--verdict pass-through`, citing the existing children, never `--verdict decompose --children`). No code-level idempotency check is added to `decompose.mjs`'s `addWork` loop. User confirmed this scope explicitly over the alternative (doc fix + defensive check in `decompose.mjs`), matching the item description's own "Fix" wording, which asked for Gate-section guidance only. |

## Pinned terms

- **"already-created children"** — work items with `parent == <root id>`
  that exist in the store (via `fgos add --parent --footprint`,
  `fgos-coding-planning` step 4) *before* `fgos-coding-validating`'s Gate fires, as
  opposed to a `--children` JSON array describing pieces not yet written
  as items.

## Scout evidence

- `.claude/skills/fgos-coding-validating/SKILL.md` (Gate section, lines 155-193 as
  read this session): only two verdict commands shown, no third case for
  pre-existing children.
- `.claude/skills/fgos-coding-planning/SKILL.md` (step 4, "Decide the split, if
  any", lines 157-191 as read this session): confirms real child items are
  created here via `fgos add --title ... --parent <id> --footprint ...`
  during planning, independent of whatever `fgos-coding-validating`'s Gate later
  does.
- `src/intake/plan.mjs` lines 929-945 (`verdict.children.forEach(...)
  addWork(dir, {...})`): confirmed unconditional — no read-before-write
  check against an item already carrying `parent == id`.
- `rg -n "decompose --children" --glob "*.md"` across the worktree: only
  hits are a plans report (historical artifact, not a live skill doc) and
  `decompose.mjs`'s own code comment — no second Gate-shaped doc needs the
  same fix.
- Precedent named in the item's own description (tsk-66o: children
  tsk-3c7/tsk-2ig created via `fgos add --parent` during planning, root
  fired `pass-through` not `decompose --children`) — tsk-66o's own item
  record (`status: delivered`) is consistent with this description; no
  matching event-log entry was found under `tsk-66o` in
  `.fgos/events.jsonl` to independently re-derive the exact verdict command
  fired (log may predate current retention, or record it under a different
  key) — treated as corroborating, not independently re-proven, and not
  material enough to block this item since the code-level confirmation
  (`decompose.mjs` behavior) already stands on its own.
- Impact-analysis posture: **full** — `fgos tool query --capability
  impact-analysis --status present` reports GitNexus registered and
  `present`. Informational only; this item is a documentation-only change,
  no code edit, so no blast-radius evidence is needed regardless of
  posture.

## Canonical references

- `.claude/skills/fgos-coding-validating/SKILL.md`
- `.claude/skills/fgos-coding-planning/SKILL.md`
- `src/intake/plan.mjs`

## Outstanding questions deferred to planning

None. The fix's shape, location, and acceptance criteria are already fully
specified by the item's own description and this session's confirmed D1;
`fgos-coding-planning` only needs to write the exact prose addition and a verify
command that proves it (e.g. that the Gate section names the third case
and points it at `pass-through`).
