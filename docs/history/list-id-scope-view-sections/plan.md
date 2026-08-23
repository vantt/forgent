# tsk-2u9 — plan

Mode: standard

Lane-gate: 2 flags apply — (1) public contract: this changes the JSON
response shape of `fgos list --id <id>` (a machine-readable CLI contract
multiple skills already parse, e.g. `plugins/fgOS/skills/pick/SKILL.md`,
`.claude/skills/fgos-coding-exploring/SKILL.md`); (2) existing covered behavior:
`test/cli/fgos.test.mjs` already carries an extensive `list`/`list --id`
test suite (~550 tests total in the file). No auth, no authorization, no
data model change, no audit/security, no external-system change, no
cross-platform, no weak-proof area, single domain.

Not `tiny`/`small` despite the small diff size — 2 flags apply per
`fgos-routing`'s own Mode-gate table (2-3 flags → standard), and the
"public contract" flag specifically warrants the extra scrutiny below
(checking for a real external consumer) even though the diff itself is a
handful of lines.

## Approach

Per D1/D2 (`docs/history/list-id-scope-view-sections/CONTEXT.md`), scope
`bin/fgos.mjs`'s `list --id` handler (around line 1577-1589) so every
id-keyed view section — `discovery`, `gates`, `settlements`, `outcomes`,
`frictions`, `learnings`, `decisionsById` — narrows to `{[id]: v[id]}`
when present, the flat `decisions` array filters to `d.id === id`, and
`tools` (name-keyed, not item-keyed) stays untouched. `work`'s existing
`--id` scoping is unchanged.

Files touched:
- `bin/fgos.mjs` — the `list --id` handler.
- `test/cli/fgos.test.mjs` — two new tests (see Proof surface), placed
  next to the existing `tsk-42m D2` `list --id` test block for locality.

No split — one honest piece of work: a scoping change confined to one
function, plus its tests.

### Risk map

| Component | Risk | Proof point |
|---|---|---|
| External consumer of `list --id`'s currently-unfiltered `decisions`/`discovery`/`gates`/etc. sections | Low | Scouted this session: `rg -l "list.*--id"` across `.claude/skills`, `plugins`, `herdr-plugin`, `scripts` finds only skill-doc PROSE (which already documents the scoped behavior as intended, e.g. pick/SKILL.md's "filtered to just this item"), no actual code consumer (JS or the Rust `herdr-plugin`) reading anything past `data.work` from a `list --id` call. `herdr-plugin/src/fgos.rs`'s own `run_fgos` calls (`fetch_triage`/`fetch_doing`) use plain `list`, never `--id`. |
| `computeAwaitingContext` (the one in-process consumer of `singleView` besides the return value) breaking from the new scoping | Low | Read `src/state/awaiting-context.mjs:49-104` directly (already cited in `CONTEXT.md`'s scout): it only reads `view.gates?.[id]` — a single-id lookup unaffected by scoping `gates` to exactly that id. |

Impact-analysis capability gate (`fgos tool query --capability
impact-analysis --status present`): GitNexus present → posture `full`.
Blast-radius risk assessed above via direct grep/read (matches this
posture — full evidence available and used) rather than a GitNexus MCP
query, since the question ("does anything besides `work` get read from
`list --id`'s response") is answerable by grepping call sites directly and
GitNexus's own code-graph tools do not index skill-doc prose or external
Rust source outside this repo's own indexed scope any more precisely than
a direct grep does here.

## Proof surface

Verify (already recorded on the item, D3 — vacuous-pass-safe per
`docs/how-to/avoid-vacuous-pass-with-node-test-test-name-pattern.md`,
confirmed by hand: fails pre-fix, passes post-fix):

```
out=$(node --test --test-name-pattern="tsk-2u9" test/cli/fgos.test.mjs 2>&1); fail=$(echo "$out" | grep -oE "^. fail [0-9]+" | grep -oE "[0-9]+$"); test "$fail" = "0" && echo "$out" | grep -qE "^. .*tsk-2u9 D1/D2"
```

Two named tests added to `test/cli/fgos.test.mjs`:

1. `list --id scopes every id-keyed view section to just the requested
   item, excluding another item's data (tsk-2u9 D1/D2)` — two items,
   decisions/gates populated for both plus one id-less global decision;
   asserts `list --id item-a`'s response excludes item-b's and the
   global entry, includes item-a's own.
2. `list --id leaves the tools registry untouched -- it is keyed by tool
   name, not by item id (tsk-2u9 D2)` — registers a tool, confirms it
   still surfaces under `list --id <any-item>`.

## Assumptions

- Exact code shape (inline scoping vs. a small local helper) — this
  session already wrote it as one inline `scopedById` closure plus the
  `decisions` filter, directly in the `list --id` branch; not material
  enough to lock as a separate `CONTEXT.md` decision.
- No second `{ ...rawView, work: ... }`-shaped call site exists elsewhere
  in `bin/fgos.mjs` that would need the same fix — a targeted grep for
  that exact spread pattern during this session found only the one site
  handled here.
