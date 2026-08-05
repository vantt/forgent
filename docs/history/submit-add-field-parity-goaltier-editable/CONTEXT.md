# submit/add field parity + goalTier editability (tsk-5fs)

## Feature boundary

`fgos submit` (the public intake door, classify()-driven) exposes fewer
flags than `fgos add` (the internal/scripted full-control door). This item
closes that gap for the field group with no documented rationale
(`--refs/--parent/--footprint/--goal-tier/--targets/--urgent`), and
separately makes `goalTier` editable after item creation via `fgos edit`.

Two independent fixes, one item:

1. `fgos submit` gains the same optional flags `fgos add` already exposes
   for this field group.
2. `goalTier` is added to `store.mjs`'s `EDITABLE_FIELDS`, so `fgos edit`
   can set or correct it on an existing item.

Both fixes apply to every domain, not just `coding` — `EDITABLE_FIELDS`
and the `submit`/`add` verbs are domain-agnostic in `store.mjs`/`bin/fgos.mjs`.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | `submit` gains full field parity with `add` for `--refs/--parent/--footprint/--goal-tier/--targets/--urgent`. This field group has no documented design rationale for being submit-exclusive (unlike goalTier's originally-intended add-time-only design, see D2) — the gap closes rather than staying intentional. |
| D2 | `goalTier` is added to `EDITABLE_FIELDS` (`store.mjs`) so `fgos edit` can set/correct it after item creation, regardless of which door (`submit` or `add`) created the item. This directly fixes the tsk-3w3 incident (item created via `submit`, needed `goalTier: milestone`, had no path to add it) and is independent of D1 — even with D1 shipped, an item created without `--goal-tier` at intake time would otherwise stay permanently unable to become a goal. |

Both decisions are user-confirmed (2026-08-05, this session) and logged via
`fgos decision --id tsk-5fs` (seq 5886, 5887).

## Pinned terms

- **public door** — `fgos submit`: classify()-driven human-facing intake,
  every item always starts at its domain's Clarify-mapped stage
  (`bin/fgos.mjs:728`, D8).
- **internal/scripted door** — `fgos add`: full manual field control, used
  by scripts/fixtures/lineage-aware creation (child ids, etc.), no forced
  classify() pass.
- **field parity** — submit exposing the same optional flag surface `add`
  already has for a given field, with identical validation semantics
  (delegated to `work.mjs`'s `validateWorkShape`, never duplicated in the
  CLI layer per both verbs' existing `--tier`/`--domain` precedent).

## Scout evidence

- `src/state/store.mjs:228` — `EDITABLE_FIELDS` set; `goalTier` absent.
  `store.mjs:260-263` — an edit touching a non-member key throws.
- `src/state/work.mjs:517-522` — code comment: goalTier is "OPTIONAL
  additive... A goal item is always created fresh with goalTier set at add
  time (see store.mjs's EDITABLE_FIELDS, which excludes it) -- never
  retrofitted onto an existing item." This is the originally-intended
  design (str67-goal-directed-planning D1) that D2 above supersedes.
- `bin/fgos.mjs:801-900` (`add` case) — exposes `--refs` (via
  `flags.refs`), `--parent`, `--footprint`, `--goal-tier`, `--targets`,
  `--urgent`, each with its own optional/lazy-default comment block citing
  a design decision (parent-flag-cli, work-graph-intelligence S9,
  str67-goal-directed-planning D1/D2, work-item-priority-matrix D2).
- `bin/fgos.mjs:924-956` (`submit` case) — exposes `async`, `domain`,
  `discoveredFrom`, `deps`, `acceptance`, `tier`/`kind`/`risk` overrides,
  `docsRef`. None of `refs`/`parent`/`footprint`/`goalTier`/`targets`/
  `urgent` are present; no comment in this block explains why this group in
  particular stays submit-exclusive, unlike goalTier's own explicit
  add-time-only rationale in `work.mjs`.
- `bin/fgos.mjs:728` — "Per D8: every item entering through the public
  door starts at its domain's Clarify-mapped stage" — the actual
  structural difference between the two doors (forced classify()+Clarify
  vs. direct full-control creation), which does not, on its own, require
  gating `refs`/`parent`/`footprint`/`targets`/`urgent` from submit.
- No dedicated design doc in `docs/decisions/` or `docs/history/` records
  a rationale for the submit/add field gap itself — searched via `rg` for
  "public door" and goalTier-related docs; only the two code comments
  above exist.

## Canonical references

- `src/state/store.mjs` — `EDITABLE_FIELDS` (line 228), edit validation
  (lines 260-299).
- `src/state/work.mjs` — `goalTier` validation (lines 517-527, `GOAL_TIERS`
  domain).
- `bin/fgos.mjs` — `add` case (801-921), `submit` case (924-956).
- Original item: `plans/reports/research-260730-0931-work-item-schema-multi-domain-upgrade-report.md`
  (round 11, open question #14) and tsk-38t (reconfirmed).
- Real-world incident this fixes: tsk-3w3 (created via submit, needed
  `goalTier: milestone`, no edit path existed).

## Capability posture (informational)

`fgos tool query --capability impact-analysis --status present` returned
GitNexus as `present` — impact-analysis: full for this item's planning/
implementation stages.

## Outstanding — deferred to planning

- Exact flag names/parsing for the new `submit` flags (mirror `add`'s
  `--refs`/`--parent`/`--footprint`/`--goal-tier`/`--targets`/`--urgent`
  verbatim, or adapt) — implementation detail, not a product decision.
- Whether adding `goalTier` to `EDITABLE_FIELDS` needs any additional
  guard in `store.mjs`'s edit path beyond the existing `GOAL_TIERS`
  validation `work.mjs`'s `validateWorkShape` already runs on every
  write (create and edit alike) — implementation detail for planning to
  verify against the real edit code path.
