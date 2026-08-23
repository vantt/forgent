# plan: list --id filter (tsk-42m)

## Mode

Flags counted: auth(no) / authorization(no) / data model(no) /
audit-security(no) / external systems(no) / public contracts(no —
additive CLI flag, no existing caller breaks) / cross-platform(no) /
existing covered behavior(yes — `list` has real test coverage,
`test/cli/fgos.test.mjs`) / weak proof around the area(no) /
multi-domain(no).

1 flag → **small**: a few files, no gray areas left after D1-D4 in
`CONTEXT.md`. `fgos graph --what-if tsk-42m --json` confirms
`unblocksTransitive: 0` — nothing else in the backlog depends on this
landing, so there's no split/ordering decision to make either.

## Approach

Chosen path: add `--id <id>` as a new branch inside the existing `case
'list':` block (bin/fgos.mjs:1028), then rewire `/fgOS:pick`'s own call
site to use it. No new verb, no new file.

Rejected alternative: a dedicated `fgos show <id>` verb — rejected per
CONTEXT.md D1 (precedent is `graph --what-if`, a flag on an existing read
verb, not a new verb).

Risk map:

| component | risk | proof point |
|---|---|---|
| `list --id` lookup + not-found error | low | `fgos-coding-validating`/tests: unknown id throws `StoreError('validation', 'list: work "<id>" not found.')`, matching D2's cited precedent shape |
| `--id` bypassing open-only default | low | test: `--id` on a `status: done` item still returns it without `--all` |
| `pick/SKILL.md` rewiring | low | manual/e2e: `/fgOS:pick` no longer prints the full open-item dump, only the claimed item's title/description |

Files touched, in order:
1. `bin/fgos.mjs` — `case 'list':` (~line 1028-1065): read `flags.id`;
   when present, look up `listWork(dir).work[id]` directly (bypassing the
   `showAll`/open-only branch entirely per D2), throw
   `StoreError('validation', 'list: work "${id}" not found.')` on a miss,
   otherwise return the existing envelope shape with `work: { [id]: item
   }` — same `data.work["<id>"]` access pattern pick's own skill code
   already uses, so no downstream parsing changes needed beyond the CLI
   invocation itself. `--id` short-circuits before the pagination
   (`readPaginationFlags`) branch — pagination and single-id lookup are
   mutually irrelevant, per CONTEXT.md's deferred-to-planning note.
2. `test/cli/fgos.test.mjs` — new cases near the existing `list --all`
   (line 276) / `list --limit` (line 1618) tests:
   - `list --id <id>` returns only that item, `--all`/open-only ignored.
   - `list --id <id>` on a `done` item returns it without `--all`.
   - `list --id <unknown>` exits non-zero with the
     `work "<id>" not found.` message.
3. `plugins/fgOS/skills/pick/SKILL.md` — step 3: replace the bare `list
   --json` call with `list --id "<id>" --json`, substituting the same
   `<id>` already read from step 2's `data.id` (no new variable).

## Shape

One direct task, `small` mode — no phases, no split. Concrete cases to
prove (matches the test list above): unknown id, done item without
`--all`, and the pick call site actually shrinking to one item.

## Verify

`npm test` (adds the three new `test/cli/fgos.test.mjs` cases above,
full suite must stay green) plus a manual `/fgOS:pick <any-todo-id>` run
confirming the terminal-rename step's `list` call now returns a
single-item envelope instead of the full open backlog.
