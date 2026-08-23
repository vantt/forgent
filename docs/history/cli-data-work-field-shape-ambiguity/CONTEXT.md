# tsk-3gv: `data.work` has three different shapes under one field name

## Feature boundary

`fgos list`/`fgos show`'s JSON output all use the top-level field name
`data.work`, but the value's shape depends on which verb and flags were
used — a consumer must already know the exact call before it can parse the
result:

1. `fgos list --id <id> --json` → `data.work` is a **map keyed by id**:
   `data.work["<id>"]` (`bin/fgos.mjs:1766`, `1798` for the unpaginated
   multi-item case).
2. `fgos list --cursor|--limit --json` → `data.work` is a **paginated
   envelope** `{items, nextCursor}` (`bin/fgos.mjs:1869`).
3. `fgos show <id> --json` → `data.work` is the **bare item object itself**
   (`bin/fgos.mjs:1891`): `data.work.title`, not `data.work[id].title`.

This item's scope is exactly these three shapes of the `work` field across
`list`/`show`, per its own footprint (`bin/fgos.mjs`,
`src/cli/command-registry.mjs`, `test/cli/fgos.test.mjs`,
`docs/specs/cli.md`). It does **not** cover the structurally similar
"omit both flags → full array unchanged; pass either → `{items,
nextCursor}`" pagination pattern on `ready`/`triage` — those use different
field names (not `work`), so they carry no naming collision and are out of
scope here.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | A breaking rename (item's own "option a" — e.g. `show` returning `data.item` instead of `data.work`) **is an allowed candidate fix**, not restricted to non-breaking options only (item's "option b": add a `data.workShape` discriminator; or "option c": docs-only fix). Condition: `fgos-planning` must still run a real consumer survey before choosing, and must update `herdr-plugin/src/fgos.rs` if that survey finds it affected. The unpaginated `list`'s shape (case 1 above) stays locked unchanged regardless of which option is picked — this is the item's own pre-existing "PHAI GIU DUNG" constraint, not something this decision reopens. |

## Pinned terms

None beyond what the item's own description already pins (the three shapes
above, cases 1/2/3).

## Scout evidence

- **Three shapes confirmed in code** (not just in the registry's prose):
  `bin/fgos.mjs:1766` (`list --id`), `:1798` (`list`, no id/pagination),
  `:1869` (`list`, paginated), `:1891` (`show`). Registry descriptions
  (`src/cli/command-registry.mjs:392`, `:585`) already document each shape
  individually but never side by side.
- **`herdr-plugin` risk is narrower than the item's own description
  feared.** `herdr-plugin/src/fgos.rs` declares `work:
  BTreeMap<String, WorkItemRaw>` (its own doc comment: "One row from `fgos
  list --all --json`'s `data.work` map"). Its one entry point, `run_fgos`,
  is called only by `fetch_triage`, `fetch_doing`, `fetch_need_answer` (all
  plain unpaginated `list`, per GitNexus's `impact` trace on `run_fgos`) —
  it never calls `show` or paginated `list`. So a rename of shapes 2 or 3
  would not touch this consumer at all; only a change to shape 1 (already
  locked unchanged) would.
- **No other programmatic JSON consumer of `show`'s or paginated-`list`'s
  `work` field was found.** `rg` across `plugins/`, `.claude/`, `src/`,
  `scripts/` for `fgos show` only turns up skill-prose invocations
  (`plugins/fgOS/skills/show/SKILL.md`) meant for a person/agent to read,
  not JSON field parsing — and the registry entry itself
  (`src/cli/command-registry.mjs:584`).
- **The item's own footprint names a doc file that does not exist**:
  `docs/specs/cli.md` is not present anywhere in `docs/specs/`. Per
  `docs/specs/reading-map.md:21`, the actual spec for the CLI's
  machine-readable verb registry is `docs/specs/work-state.md` §"sổ verb"
  (`src/cli/command-registry.mjs` is the kernel; `work-state.md` is its
  spec). `fgos-planning` should target `docs/specs/work-state.md` (and/or
  the relevant `docs/how-to/*.md` files already citing `data.work`, e.g.
  `docs/how-to/poll-fgos-cli-data-from-a-rust-plugin.md:72`) instead of the
  nonexistent `docs/specs/cli.md` when it writes the real footprint.
- **Impact-analysis capability gate**: `fgos tool query --capability
  impact-analysis --status present` returned `gitnexus` as `present` —
  `impact-analysis: full` per `CLAUDE.md`'s gate. Used above for the
  `run_fgos` call-site trace; `fgos-planning`/`fgos-validating`/
  `fgos-code-implement` should re-run their own fresh check per the gate's
  own "check every time" rule rather than reusing this note.

## Canonical references

- `bin/fgos.mjs:1766,1798,1869,1891` — the four `work` assignment sites.
- `src/cli/command-registry.mjs:392,398,585` — the `list`/`show` verb
  descriptions, each documenting its own shape in isolation.
- `herdr-plugin/src/fgos.rs` — the one known external JSON consumer
  (`work: BTreeMap<String, WorkItemRaw>`, `run_fgos`, `fetch_triage`/
  `fetch_doing`/`fetch_need_answer`).
- `docs/specs/reading-map.md:21` — points the CLI verb registry's real spec
  at `docs/specs/work-state.md`, not `docs/specs/cli.md`.

## Outstanding questions

None
