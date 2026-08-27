---
type: how-to
title: How to see done items in `fgos list` / `fgos triage`
tags: []
timestamp: 2026-07-29T00:00:00.000Z
source_capture_ids: [tsk-5oa]
framework: diataxis
mode: how-to
---
# How to see done items in `fgos list` / `fgos triage`

Use this when you run `/fgOS:list` or `/fgOS:triage` (or the bare `fgos
list`/`fgos triage` verbs) and a work item you know exists — one that's
already `done` — is missing from the output.

## Before you start

You need nothing special — this only matters if you're on a fgOS build
that ships the open-only default described below. If `fgos --help --json`
shows a `list.parameters.properties.all` entry, you have it.

## What changed

The original request that shipped this, quoted from its own work item:

> "nâng cấp skill và harness liên quan đến /fgOS:list và /fgOS:triage để
> chế độ default là chỉ tra tra các work-items (not done), thêm một thông
> số như --all mới liệt kê tất cả."
> — real work item title, id `tsk-5oa`

Both `fgos list` and `fgos triage` now default to **open-only**: items with
`status: 'done'` are excluded unless you ask for them. `triage` already
worked this way before this change (a done item can never block anything,
so it was always excluded from the ranking); `list` did not — it used to
return every item, done or not, every time.

## Steps

1. Run either verb exactly as before to get the open-only view (the new
   default, no flag needed):

   ```
   fgos list
   fgos triage
   ```

   Neither one prints a `done` item in this form anymore.

2. Add `--all` to see everything, including done items:

   ```
   fgos list --all
   fgos triage --all
   ```

   For `/fgOS:list` and `/fgOS:triage` inside a Claude Code session, pass
   `--all` as the slash command's argument: `/fgOS:list --all`, `/fgOS:triage
   --all`.

3. Read the result:
   - `fgos list --all`'s `data.work` map includes every item, done or not,
     exactly like `fgos list` used to before this change.
   - `fgos triage --all`'s `data` array keeps the same ranked open rows it
     always had, with done items **appended after them** — never
     interleaved. Every done row always carries `blocks: 0` and
     `componentSize: 0` (rendered as `-` for `component` in the
     `/fgOS:triage` table) — a finished item can't block anything or add
     leverage to a cluster, so there's nothing to rank it by.

4. `--all` composes with pagination (`--cursor`/`--limit`) — you can pass
   both together on either verb without one disabling the other.

## What "not done" means exactly

The default filter is exactly `status !== 'done'`. It does **not** hide
`todo`, `doing`, `proposed`, `blocked`, or `awaiting-human` items — only
`done`. This was a deliberate, locked boundary, not an accident:

> "D2: 'not done' = exactly `item.status !== 'done'`. All other statuses
> (`todo`, `doing`, `proposed`, `awaiting-human`, `blocked`) remain visible
> by default. Grounded ... by `scripts/herdr-cockpit-notify.mjs:26`, which
> depends on `awaiting-human` items still appearing in the unfiltered/
> default path to drive its notification bell — a filter any more
> aggressive than exactly `status === 'done'` would silently break that
> already-shipped feature (RUL40)."
> — real locked decision, `docs/history/fgos-list-triage-open-only-default/CONTEXT.md` D2

## Why the change touches the harness, not just the two skills

It would have been possible to filter only inside the `/fgOS:list` and
`/fgOS:triage` Claude Code skill wrappers, leaving the raw `fgos list
--json`/`fgos triage --json` CLI output untouched for any other script.
That path was considered and rejected, for a concrete, structural reason
specific to `triage`:

> "D1: `--all` filtering lives at the harness level (`bin/fgos.mjs`) for
> **both** `list` and `triage`, not skill-only. Forced by asymmetry:
> `triage`'s `rankImpact` (`src/state/impact.mjs:59`) filters `status !==
> 'done'` before the JSON envelope is built, so a skill has nothing to
> render for done items without a harness-side `--all`."
> — real locked decision, `docs/history/fgos-list-triage-open-only-default/CONTEXT.md` D1

In other words: `triage` never even computed anything about done items in
the first place, so no amount of clever rendering in the skill layer could
have shown them — the fix had to reach the actual ranking function. Once
that was true for `triage`, the same harness-level approach was used for
`list` too, for one consistent `--all` behavior across both verbs rather
than a fix that behaves differently depending which verb you're looking
at.

One existing script needed a matching update as a direct consequence of
`list`'s new default: `scripts/herdr-cockpit-notify.mjs` polls `fgos list
--json` to build an operator status line that counts every status,
including `done` — it now passes `--all` so that count keeps working
exactly as it did before this change.

## Related

- `fgos --help --json` — the machine-readable verb book; both `list` and
  `triage` entries document the `all` parameter directly.
- `docs/history/fgos-list-triage-open-only-default/CONTEXT.md` — the full
  locked-decision record (D1-D4) this doc quotes from.
- `docs/history/fgos-list-triage-open-only-default/plan.md` — the
  phased implementation shape, including the exact done-row field values
  (`blocks: 0`, `componentSize: 0`, `isIsolated: true`) quoted above.

## Document history (compound-learn capture linkage)

This doc's path (`docs/how-to/see-done-items-in-list-and-triage.md`) is
itself linked to a real compound-learn capture, gathered via `fgos
doc-sources docs/how-to/see-done-items-in-list-and-triage.md`:

> ```json
> {
>   "id": "tsk-5oa",
>   "predicted": {"tier": "standard", "deps": 0, "priorVisits": 0, "role": "session", "headAtTake": "222d1d3ffd01596f296a72478ebcb6b65977ade4"},
>   "actual": {"outcome": "proposed", "passed": true, "attempts": 1, "errorClass": null, "aheadCount": 3},
>   "docType": "how-to",
>   "docPath": "docs/how-to/see-done-items-in-list-and-triage.md"
> }
> ```
> — real `work.outcome` capture, id `tsk-5oa`

That capture's own work item shipped clean on its first attempt, verify
passed, no friction recorded against it. If a later capture links to this
same docPath, the export skill accumulates it here too, additively,
without losing this section or anything above it.
