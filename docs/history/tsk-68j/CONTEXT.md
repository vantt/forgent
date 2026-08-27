# Context: submit's dependency-candidate scan misses `delivered` items (tsk-68j)

## Feature boundary

`/fgOS:submit`'s step 2 dependency-candidate scan (and `/fgOS:cook`'s step 1,
which duplicates the same protocol verbatim) reads `fgos list --json` with
no `--all` flag. `list`'s default view excludes any item whose status is
`done`/`wontfix`/`delivered`/`retrospective`/`cleanup` (`isResolvedStatus`,
`src/state/frontier.mjs:266`). A `delivered`-but-not-yet-`cleanup` item is
therefore invisible to duplicate/dependency detection, letting a
near-duplicate item get submitted before anyone notices the earlier one
already merged. Live-reproduced case: tsk-17m delivered, then tsk-1dd
submitted ~90 minutes later duplicating the same work, undetected until
deep into discovery.

This item's scope is exactly the fix to that blind spot in the two
duplicate-scan call sites named above. It does not cover a broader
refactor of how `plugins/fgOS/skills/submit/SKILL.md` and
`plugins/fgOS/skills/cook/SKILL.md` share prose (both currently spell the
scan step out inline rather than pointing at a shared reference) — that
de-duplication is a separate concern, deferred, not part of this fix.

## Locked decisions

| D-ID | Quyết định |
|---|---|
| D1 | widen the dependency-candidate scan to `list --all --json` (bare --all, no dedicated narrower filter), applied to both duplicate call sites (plugins/fgOS/skills/submit/SKILL.md:70 and plugins/fgOS/skills/cook/SKILL.md:97) |

## Pinned terms

- **dependency-candidate scan** — the heuristic step (`/fgOS:submit` step
  2, `/fgOS:cook` step 1) that reads the current fgOS work-item view and
  looks for a textually-grounded duplicate/dependency match against the
  new item being submitted.
- **the blind spot** — `list`'s default (non-`--all`) view excluding
  `delivered`/`retrospective`/`cleanup`/`done` items, per
  `isResolvedStatus`.

## Scout evidence

- `bin/fgos.mjs:2647-2660` — `list`'s default view filter:
  `Object.entries(rawView.work).filter(([, item]) => !isResolvedStatus(item))`
  unless `--all` is passed.
- `src/state/frontier.mjs:244,266` — `TAIL_RESOLVED_STATUSES` =
  `{delivered, retrospective, cleanup, done}`; `isResolvedStatus` also
  folds in `wontfix`.
- `plugins/fgOS/skills/submit/SKILL.md:65-71` — step 2's own scan command
  is exactly `list --json`, no `--all`.
- `plugins/fgOS/skills/cook/SKILL.md:95-100` — step 1 duplicates the exact
  same protocol inline: "scan `fgos list --json` for a textually-grounded
  dependency candidate" — a fix to `submit/SKILL.md` alone does not reach
  this second, independent copy.
- `herdr-plugin/src/fgos.rs` (per `bin/fgos.mjs:2722-2726`'s own comment)
  — the one other consumer needing a complete cross-status picture in this
  repo already always uses `list --all --json`, at all 3 of its call
  sites — direct precedent for widening rather than a narrower bespoke
  filter.
- Grep swept every `list --json` occurrence under `plugins/fgOS/skills/`:
  besides the two scan sites above, all other hits (`list/SKILL.md`,
  `fgos-fanout/SKILL.md` and its `references/`, `approve/SKILL.md`'s
  unrelated `merge list --json`, `fgos-coding-implement/references/
  verify-commit-and-iron-law.md`) serve a different purpose (a generic
  list view, work-graph reads, a doc reference) and are out of this
  item's scope.
- Full research trail: `docs/history/tsk-68j/RESEARCH.md`.

## Impact-analysis posture

`fgos tool query --capability impact-analysis --status present` reports
GitNexus registered and `present` (`full` posture per `CLAUDE.md`'s gate).
Informational only here — this item edits skill prose (Markdown), not
indexed code symbols, so a code-graph blast-radius check does not apply to
the change itself.

## Skill-prose verify guidance

Both files this item touches are skill prose
(`plugins/fgOS/skills/{submit,cook}/SKILL.md`) — per
`docs/how-to/write-verify-for-a-skill-prose-change.md`, `verify` must be
`npm test && <POSITIVE> && <NEGATIVE>`, hidden-dir-aware (`rg --hidden`),
path-exclusion-aware (`--glob '!.claude/worktrees/**'`), pinned to a
distinctive-enough string (not a single generic word), and must not claim
to prove prose comprehension/coherence — that stays with merge review and
`fgos-coding-validating`. Left to `fgos-coding-planning` to write the
concrete command.

## Canonical references

- `AGENTS.md` product priority order (`Release con người`) — cited above
  as the reason a document-only fix (rejected Option 2) was not chosen:
  it still requires a human/agent to remember to widen the search by
  hand every time.

## Outstanding questions

None
