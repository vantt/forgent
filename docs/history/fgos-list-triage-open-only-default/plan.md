# Plan: fgos-list-triage-open-only-default

Item: tsk-5oa · Decisions: `CONTEXT.md` (D1-D4)

## Mode

**Standard.** Flags counted: **public contracts** (changes the default
JSON shape of `fgos list --json` / `fgos triage --json`, a documented
machine-readable surface per `docs/io-contract.md`) and **existing covered
behavior** (55+ assertions in `test/cli/fgos.test.mjs` call the bare `list`
verb; `scripts/herdr-cockpit-notify.mjs`, an already-shipped RUL40
feature, depends on `list`'s current default). 2 flags → standard, no
hard-gate flag present (no auth, no data loss, no audit/security, no
external provider, no validation removed) so not high-risk.

`fgos graph --json` shows tsk-5oa on no critical path and unblocking
nothing (`topUnblock`/`criticalPath` don't mention it — it has no deps and
no children) — ordering among phases below is decided by dependency
between the phases themselves, not by graph metrics.

## Approach

One self-contained item, no split (D-decisions already fully scope it; no
piece here is independently valuable or separately verifiable from the
rest).

Chosen path: filter at the harness layer for both verbs (per D1), keep
`rankImpact`'s existing open-subgraph math untouched for the default case,
and append done items as flat, non-competing extra rows when `--all` is
passed to `triage` (rejected alternative: recomputing blocks/component
over the full graph including done items — rejected because a done item
structurally can never block anything RUL-consistent with `rankImpact`'s
own existing doc comment, so recomputing would just reproduce zeros by a
more expensive path).

Risk map:

| Component | Risk | Proof point (for fgos-coding-validating) |
|---|---|---|
| `bin/fgos.mjs` `list` case | low | new test: default excludes a `done` item; `--all` restores it |
| `bin/fgos.mjs` `triage` case + `rankImpact` | medium (existing ranking math must stay byte-identical for the default/no-flag path) | existing `impact.test.mjs` assertions must still pass unchanged; new test: `--all`'s done rows carry `blocks: 0`, `componentSize: 0`, `isIsolated: true`, sorted after all open rows |
| `scripts/herdr-cockpit-notify.mjs` | medium (silent breakage if missed — RUL40, no test spawns the real CLI here) | manual proof: run the script's `pollOnce` against a fixture store with a done item, confirm `done=N` still appears in the status line |
| `plugins/fgOS/skills/list/SKILL.md` / `triage/SKILL.md` | low | prose-only, no automated proof; visual read-through |
| `src/cli/command-registry.mjs` | low | `fgos-manifest.test.mjs`'s existing structural checks must keep passing with the new `all` property added |

Files touched, in phase order:

1. `bin/fgos.mjs` (`case 'list'`, ~line 1028) — read `flags.all` (boolean
   presence flag, same pattern as `flags.force`); when absent, filter
   `view.work` to `status !== 'done'` before the `awaitingContext`
   computation and pagination path both run on it (both currently key off
   `view.work` / `Object.values(view.work)` — filter once, upstream of
   both). When present, behave exactly as today (no filter at all).
2. `src/state/impact.mjs` — add a second, optional `{ includeDone }`
   param to `rankImpact(view, opts)`. Default (`includeDone` falsy):
   byte-identical to today's behavior, not touched. When true: after the
   existing `ranked` array is built and sorted, append one row per
   `status === 'done'` item, each with `blocks: 0`, `componentId: null`,
   `componentSize: 0`, `isIsolated: true`, sorted by `tierRank` then
   ascending id among themselves, always after every open row (open rows'
   relative order never changes).
3. `bin/fgos.mjs` (`case 'triage'`, ~line 2174) — thread `flags.all`
   through as `rankImpact(listWork(dir), { includeDone: Boolean(flags.all) })`.
4. `scripts/herdr-cockpit-notify.mjs` (`pollOnce`, line 45) — add `'--all'`
   to the `spawnSync` args array so the status line keeps counting every
   status including `done` (D4).
5. `src/cli/command-registry.mjs` — add an `all` boolean property to both
   the `list` and `triage` entries' `parameters.properties`, update each
   entry's `description` (mention the new default + `--all` escape
   hatch) and `examples` (add `'fgos list --all'` / `'fgos triage --all'`).
6. `plugins/fgOS/skills/list/SKILL.md` — update step 1 (currently "ignore
   $ARGUMENTS, takes no arguments") to check `$ARGUMENTS` for a literal
   `--all` token and pass `--all` through to the CLI call when present;
   update step 3's "no filtering by status" line to describe the new
   default + `--all` escape hatch.
7. `plugins/fgOS/skills/triage/SKILL.md` — same `$ARGUMENTS`/`--all`
   pass-through as (6); update step 2's "Done items never appear" line to
   note this is now the default, overridable with `--all`; extend step 3's
   column rules to describe how a done row renders (`blocks` always `0`,
   `component` renders `-` for a done row, since `componentSize: 0` doesn't
   fit the existing "isolated"/"cluster of N" wording).
8. `test/cli/fgos.test.mjs` — new tests: (a) `list` with a mix of open and
   `done` items excludes the `done` one by default; (b) `list --all`
   restores it; (c) `triage --all` includes a `done` row with `blocks: 0`.
9. `test/state/impact.test.mjs` — new tests for `rankImpact`'s
   `includeDone` option directly (done rows appended, sorted last,
   zeroed fields), plus a regression check that the existing (no-option)
   call signature still returns byte-identical output to before.

## Sketch: concrete cases to prove

- Empty store (`view.work` = `{}`) — `list` default and `--all` both
  return `{}`, no crash.
- A store with only `done` items — `list` default returns an empty
  `work` map (not an error); `--all` returns them all.
- `awaiting-human` items remain visible in `list`'s default (not excluded)
  — proves D2's exact boundary (`status !== 'done'` only).
- `list --all --limit 5 --cursor <token>` — `--all` and pagination
  compose without one flag disabling the other.
- `triage` default with a done item present in the store — done item
  never appears (existing behavior, must not regress).
- `triage --all` — done row's `blocks`/`componentSize` are always `0`,
  regardless of how many other open items depend on it (a done
  dependency is already satisfied, never blocking).

## Execution

Verify command for the whole item (all phases): `npm test` — the full
suite (state + cli + runner + e2e), matching this repo's existing
definition-of-done convention; no phase here is split into its own child
item, so there is one verify command, not several.
