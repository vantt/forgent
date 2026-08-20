# plan.md — tsk-4zr: lightweight projection for `fgos list --id`

Mode: standard

Lane decided directly (no `fgos-routing` Orient hand-off this session — item
was claimed straight via `/fgOS:pick`). Flags counted per `fgos-routing`'s
own Mode gate: **public contracts** (`list --id --json`'s shape is read by
every coding-domain stage-skill's own Orient step —
`view.discovery[id]`, `data.work[id].holder` — grep-confirmed against
`fgos-coding-discovering/SKILL.md:102/109`), **existing covered behavior**
(`test/cli/fgos-read.test.mjs` already covers `list --id`). 2 flags →
standard.

## Problem (from RESEARCH.md Round 1, discovery stage)

`fgos list --id <id> --json` correctly scopes every side-log section
(`decisions`/`discovery`/`gates`/`settlements`/`outcomes`/`frictions`/
`learnings`/`decisionsById`/`callThreads`) down to just the requested item
(`bin/fgos.mjs:2245-2258`), but still returns every one of those sections in
FULL — unbounded, full-text history that grows with the item's own age, not
its size at read time. A `fgos-coding-driving` loop iteration (and every
stage-skill's Orient step) pays this cost on every fresh re-read, which
compounds on a long-running or heavily-discussed item (confirmed live:
119.5KB after ~10 rounds on tsk-4gc, per the item's own description).

## Approach

Add an opt-in `--fields <comma,separated,list>` flag to `list --id`. When
passed, `singleView.work[id]` is filtered to just the named fields (still
validated against a known live-pointer set — `stage`, `status`, `holder`,
`title`, `docsRef`, `verify`, `parent`, `id`, `domain`, `kind`, `risk`,
`tier`), and every history-side-log section (`decisions`/`discovery`/
`gates`/`settlements`/`outcomes`/`frictions`/`learnings`/`decisionsById`/
`callThreads`) is OMITTED from the response entirely rather than scoped-but-
included. Omitting `--fields` keeps today's shape byte-identical — every
existing caller (every coding-domain stage-skill's `view.discovery[id]`/
`data.work[id].holder` access pattern, `fgos-coding-driving`'s own Step 1
read) keeps working unchanged; this flag is additive-only, never a breaking
default-shape change.

**Alternatives rejected:**
- A `--summary`/`--brief` boolean toggling one fixed field set instead of a
  named `--fields` list — rejected because the item's own suggested
  direction names both shapes as options and a caller-named field list is
  strictly more useful for the one consumer that actually needs this
  (`fgos-coding-driving`'s Step 1 fresh-read, which only ever needs
  `stage`/`status`/`holder`) without foreclosing a future caller that wants
  a different subset. A `--summary` boolean can still be layered on top
  later as sugar for a fixed `--fields` list if a second caller ever wants
  exactly that — not designed now, YAGNI.
- Migrating `fgos-coding-driving`'s Step 1 read to the `show` verb instead
  (already correctly scoped, per tsk-5dnt's own description) — rejected,
  same reasoning tsk-5dnt already recorded: `show`'s JSON shape is
  de-keyed (`data.work` IS the item, `data.discovery` IS the array
  directly) versus `list --id`'s id-keyed shape every stage-skill's Orient
  step already reads (`view.discovery[id]`, `data.work[id].holder`) —
  migrating every call site is a much larger, riskier change than adding a
  flag to the command already in use, out of this item's own scope.

**Risk map:**

| Component | Risk | Proof point |
|---|---|---|
| `bin/fgos.mjs` `list --id` handler (`:2229-2264`) | Standard (additive-only, opt-in flag; default path untouched) | New `test/cli/fgos-read.test.mjs` cases: `--fields` present → only named fields + no side-log keys; `--fields` absent → byte-identical to today (regression guard against breaking `herdr-plugin`'s own `list --all --json` contract, confirmed at `bin/fgos.mjs:2340-2345` to be the ONE combination that must stay byte-identical — `--fields` is a distinct flag from that combination, so this only needs a same-shape assertion, not a change) |
| Every coding-domain stage-skill's Orient read (`view.discovery[id]`, `data.work[id].holder`) | None — these never pass `--fields`, so their shape is unaffected | Existing test suite green (no call site changes needed in `.agents/skills/**`) |

Impact-analysis posture: **full** (GitNexus `present`, freshly queried via
`fgos tool query --capability impact-analysis --status present`).

## Files touched

- `bin/fgos.mjs` — the `list --id` handler (~`:2229-2264`): parse `--fields`,
  validate against the live-pointer field set, apply the filter/omission.
- `test/cli/fgos-read.test.mjs` — new cases for `--fields` present/absent.
- `CHANGELOG.md` — `## [Unreleased]` line (AGENTS.md install/setup gate:
  this is a user-visible new CLI flag).

Order: handler change first (it is what the tests assert against), tests
second, changelog last (documents the now-verified behavior).

## Outstanding questions

None — the exact live-pointer field set above is a labeled assumption
(implementation-only: the field NAMES are not a product decision, they are
literally the same field names every existing skill's Orient step already
reads off the unfiltered response today), not a material CONTEXT.md gap.
No `CONTEXT.md` exists for this item (discovery verdict was `clear`, so
`exploring` — and therefore `CONTEXT.md` — was skipped entirely; this is
the expected shape, not a gap).
