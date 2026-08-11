# RESEARCH: reopening list's D5/D35 work-only pagination scope

## Round 1 (tsk-483, stage discovery)

**Checked:** `bin/fgos.mjs:1704-1838` (`case 'list'`, full handler),
`docs/specs/work-state.md:593-601` (the D5/D35 str46-io-contract
pagination spec text), `docs/history/list-id-scope-view-sections/
CONTEXT.md` (tsk-2u9, the precedent this item's own fix generalizes),
`docs/history/fgos-show-scoped-detail/CONTEXT.md` (tsk-2fw, a related but
distinct earlier item), `docs/journals/260728-2038-claim-port-str46-
parallel-merge.md` (str46-io-contract's own journal — covers the
`actor`→`role` rename, not the pagination decision specifically).

**Searched for D5/D35's own original discussion doc — not found.** Grepped
`docs/history/`, `docs/decisions/`, `docs/journals/` for "D35", "str46",
"biggest payload" — the only hits are the spec text itself
(`work-state.md`) and an unrelated str46 journal entry. `work-state.md`'s
own frontmatter lists `str46-io-contract-lat2`/`str46-io-contract-lat3` as
sources with no matching `docs/history/` directory — likely squashed or
recorded directly into the spec without a separate feature doc, common
for a large multi-part contract spec. This item's own design below
proceeds on the SPEC TEXT's own documented behavior plus the mechanical
evidence gathered directly (not on inferred original intent this session
could not locate).

**Confirms the item's own claim:** `docs/specs/work-state.md:598` states
plainly, for `list`: "chỉ khoá `work` đổi, các khoá khác của kết quả
`list` giữ nguyên" (only the `work` key changes; the other keys of
`list`'s result stay unchanged) — matching `bin/fgos.mjs:1825-1828`'s own
comment exactly. This is genuinely a locked, ID'd, cross-referenced
decision (D5/D35, str46-io-contract), not an oversight — reopening it
per AGENTS.md's "changing a locked law... supersedes its decision ID,
never edit in place" discipline, extended here by the same spirit even
though this specific law lives in a spec doc rather than
`platform-foundations.md` itself.

**The proven-safe precedent this item's own fix generalizes:** tsk-2u9
(`docs/history/list-id-scope-view-sections/CONTEXT.md`) already solved
the IDENTICAL problem for `list --id`'s single-item case — scoping
`decisions`/`discovery`/`gates`/`settlements`/`outcomes`/`frictions`/
`learnings`/`decisionsById` down to the requested id(s), leaving `tools`
untouched (keyed by tool NAME, never a work item id) and `work` handled
separately. `bin/fgos.mjs:1742-1754`'s `scopedById(section)` helper is
exactly this — this item's own fix is the SAME pattern generalized from
one id to the SET of ids actually present in the result's `work` map,
whichever path produced that set (open-default, `--all`, or a paginated
page).

**External contract that must stay untouched, found by reading the
handler's own header comment (`bin/fgos.mjs:1704-1718`):**
`herdr-plugin/src/fgos.rs` (a separate Rust crate outside this repo's own
Node build/test surface) parses `list --all --json`'s stdout, filtering
on `item.status`. It reads `work` only — nothing in the herdr-plugin
comment or code (not inspectable from this repo) suggests it reads
`decisions`/`gates`/etc. at all — but the comment is explicit that this
is "a public contract this external process reads," so `--all --json`
with NO pagination flags (herdr-plugin's own exact documented call shape)
must return byte-identical output to today, unconditionally. `--all`
combined with `--cursor`/`--limit` already changes `work`'s own shape
today (to `{items, nextCursor}`) — herdr-plugin's own documented call
never does this combination, so that combination is free to also gain
side-log scoping without touching the actual protected contract.

**Design:** generalize `scopedById(section)` to accept a Set of ids
(`scopedByIds(section, idSet)`), and apply it — after the existing
child-visibility/`childProgress` computation and the existing pagination
slicing, so it always scopes to the FINAL set of ids actually being
returned — to every path except the one protected combination
(`showAll && cursor === undefined && limit === undefined`). Measured
target: matches `--id`'s own already-proven 1300x reduction shape,
scaled to N ids instead of 1.

**Verdict:** `{clear: true, verify: "node --test test/cli/fgos.test.mjs test/cli/fgos-manifest.test.mjs && npm test"}`
