# fgos-list-triage-open-only-default

Item: tsk-5oa

## Feature boundary

`/fgOS:list` and `/fgOS:triage` (and their underlying `fgos list` / `fgos
triage` CLI verbs) default to showing only not-done work items. Passing
`--all` restores today's full-listing behavior (list) or adds done items
to the ranking output (triage). No other verb's default output changes.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | `--all` filtering lives at the harness level (`bin/fgos.mjs`) for **both** `list` and `triage`, not skill-only. Forced by asymmetry: `triage`'s `rankImpact` (`src/state/impact.mjs:59`) filters `status !== 'done'` before the JSON envelope is built, so a skill has nothing to render for done items without a harness-side `--all`. `list`'s verb (`bin/fgos.mjs:1028`) currently returns every item with no filter at all, so a skill-only change was technically possible there, but is rejected for consistency with D1's scope across both verbs. User confirmed (2026-07-29): harness-level for both, recommended option. |
| D2 | "not done" = exactly `item.status !== 'done'`. All other statuses (`todo`, `doing`, `proposed`, `awaiting-human`, `blocked`) remain visible by default. Grounded by the user's own parenthetical in the submit text ("(not done)") and by `scripts/herdr-cockpit-notify.mjs:26`, which depends on `awaiting-human` items still appearing in the unfiltered/default path to drive its notification bell — a filter any more aggressive than exactly `status === 'done'` would silently break that already-shipped feature (RUL40). |
| D3 | The new flag is spelled `--all` (per the user's own submit text), a boolean presence flag (no value), consistent with existing boolean flags in `bin/fgos.mjs` (e.g. `--force`). |
| D4 | `scripts/herdr-cockpit-notify.mjs` (its `fgos list --json` call, line 45) must be updated to pass `--all` as part of this item's scope — its status line counts every status including `done`, and would otherwise silently under-report once `list`'s CLI default changes. This is in-scope, not a follow-on item, because leaving it unfixed breaks a locked, already-built feature (RUL40) the moment D1 ships. |

## Scout evidence

- `bin/fgos.mjs:1028` (`case 'list'`) — returns `view.work` unfiltered today, no status filter, no `--all`.
- `bin/fgos.mjs:2174` (`case 'triage'`) — `return paginateVerbResult(rankImpact(listWork(dir)), flags, 'triage-v1', 'triage');` — no `--all` support today.
- `src/state/impact.mjs:57-59` — `rankImpact`'s `openIds` filters `work[id].status !== 'done'` before any ranking math runs; comment block above (lines 36-46) states done items "never count on either side" by design.
- `plugins/fgOS/skills/list/SKILL.md:40-42` — current skill instructions explicitly say "no filtering by status", must be updated once D1 ships.
- `plugins/fgOS/skills/triage/SKILL.md:39-42` — current skill instructions already document "Done items never appear" as triage's existing (harness-driven) behavior; only needs `--all` support added.
- `scripts/herdr-cockpit-notify.mjs:45,26,31-39` — spawns `fgos list --json` directly, builds a per-status count line and an `awaiting-human` diff set from the full response. Confirmed dependency: needs `--all` once `list`'s default changes, or its `done=N` counts silently vanish.
- No test in `test/cli/fgos.test.mjs` was found asserting a done item's presence via a bare `run(cwd, ['list'])` call (55+ occurrences checked) — most done-status assertions go through the `stateView`/`listWork` test helper, which reads state directly rather than through the CLI `list` verb, so they are unaffected by this change.
- `docs/io-contract.md:101-115` — the existing pagination contract for `list`/`triage`/`ready`/`evolve` is untouched by this change; `--all` is an orthogonal, additive flag, not a pagination shape change.

## Pinned terms

- **"not done"** = `item.status !== 'done'` (D2). Not a broader "closed/terminal" concept — `blocked` and `awaiting-human` items remain visible by default.
- **`--all`** = the escape-hatch flag name for both verbs (D3), restoring pre-change full-listing behavior.

## Deferred to planning

- Exact shape of `--all`'s done-item rows in `triage`'s output (e.g. what `blocks`/`component` render as for a done row, since `blocks` is trivially always 0 for a finished item) — implementer detail, not a product decision.
- How `plugins/fgOS/skills/list/SKILL.md` and `triage/SKILL.md` parse `$ARGUMENTS` for a literal `--all` token (both currently say "ignore $ARGUMENTS, takes no arguments").
- Whether `--all`'s boolean-flag parsing follows the exact same code path as `--force` or needs its own read helper — implementer's call.
- Updating `plugins/fgOS/skills/list/SKILL.md`'s own prose ("no filtering by status") and `triage/SKILL.md`'s markdown-table column list once `--all` rows exist.

## Outstanding questions

None — D1-D4 cover every product-level gray area found during scouting.
