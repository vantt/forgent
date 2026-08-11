# CONTEXT: list scopes side-logs to the ids actually returned

Item: `tsk-483`. Feature boundary: `fgos list`'s response (every call
shape except `--all --json` with no pagination flags) scopes
`decisions`/`discovery`/`gates`/`settlements`/`outcomes`/`frictions`/
`learnings`/`decisionsById` down to the ids present in the returned
`work` map — generalizing `list --id`'s own proven-safe `scopedById`
pattern (tsk-2u9) from one id to the set of ids actually being returned.

## Locked decisions

**D1 — Reopening D5/D35 (str46-io-contract), superseding it here, not
editing it in place.** Per RESEARCH.md: no original discussion doc for
this specific decision was locatable; the spec text
(`docs/specs/work-state.md:593-601`) is the only record. User confirmed
(asked directly) reopening it given this item's own new measured
evidence (~800K tokens for one default `list` call, larger than most
agents' context windows). `docs/specs/work-state.md`'s own pagination
prose gets updated to describe the new scoping behavior as part of this
item's own implementation — the D5/D35 label itself is never edited in
place; this item's own decision (recorded via `fgos decision`) is what
supersedes it.

**D2 — One protected combination stays byte-identical: `--all --json`
with no `--cursor`/`--limit`.** Per RESEARCH.md: `bin/fgos.mjs`'s own
header comment documents `herdr-plugin/src/fgos.rs` (external Rust
consumer, outside this repo's Node build/test surface) parses exactly
this call shape's `work` map. Every OTHER combination — the bare default
(no flags at all, the item's own measured 3.1MB case), `--id` (already
correctly scoped by tsk-2u9, untouched by this item), and any
`--cursor`/`--limit` combination including with `--all` — gains the new
scoping.

**D3 — Mechanism: generalize `scopedById(section)` to
`scopedByIds(section, idSet)`, applied AFTER the existing
child-visibility filter and AFTER pagination slicing, so it always
reflects the FINAL returned `work` id set.** Reuses the exact filtering
shapes tsk-2u9 already proved safe (dicts: `{[id]: v[id]}` per matching
id; the flat `decisions` array: filter by `d.id` membership in the set;
`tools` untouched, keyed by tool name not item id).

## Scout evidence

- `bin/fgos.mjs:1704-1838` (`case 'list'`, full handler) — read in full,
  cited in RESEARCH.md.
- `docs/specs/work-state.md:593-601` — the D5/D35 spec text.
- `docs/history/list-id-scope-view-sections/CONTEXT.md` (tsk-2u9) — the
  proven-safe single-id precedent this item generalizes.
- `bin/fgos.mjs:1704-1718` — herdr-plugin's own documented external
  contract, the one combination D2 protects.

## Canonical references

- `plans/reports/project-instability-scan-260809-1608-ship-faster-stability-report.md`
- `docs/specs/work-state.md` (D5/D35, str46-io-contract — the law this
  item supersedes for `list`'s own default/paginated paths, never
  `--all --json` bare)
- `docs/history/list-id-scope-view-sections/CONTEXT.md` (tsk-2u9)

## Outstanding questions

None
