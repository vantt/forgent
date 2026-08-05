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
| D2 | `goalTier` is added to `EDITABLE_FIELDS` (`store.mjs`) so `fgos edit` can set/correct it after item creation, regardless of which door (`submit` or `add`) created the item. This directly fixes the tsk-3w3 incident (item created via `submit`, needed `goalTier: milestone`, had no path to add it) and is independent of D1 — even with D1 shipped, an item created without `--goal-tier` at intake time would otherwise stay permanently unable to become a goal. **Scope note (found while writing this item's own functional verify, `verify.sh`):** `EDITABLE_FIELDS` alone is not sufficient — `bin/fgos.mjs`'s `edit` case (~lines 1150-1290) plumbs flags into the patch object via a hardcoded field list (`title/description/kind/risk/verify/tier/urgent` + `refs/deps/footprint` + a few one-off kebab-case flags like `docs-ref/merge-after/superseded-by/parent`) and has **no `--goal-tier` entry**. D2 therefore requires BOTH: (a) `goalTier` added to `store.mjs`'s `EDITABLE_FIELDS`, and (b) `bin/fgos.mjs`'s `edit` case parses `--goal-tier` into `patch.goalTier`. Missing either half leaves `fgos edit <id> --goal-tier ...` a no-op ("edit requires at least one field to change") even though the Set-level guard would report success. |

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

## Verify

`docs/history/submit-add-field-parity-goaltier-editable/verify.sh` — a
self-contained functional check, real CLI end to end in an isolated temp
git repo/store (no source-text grepping, which a second-pass review during
this item's own clarify stage proved unreliable: flag names appear in
comments/error strings independent of whether the parser actually wires
them). Confirmed to run and fail at the expected point (`D1 FAIL: submit
field refs got [] want ["a","b"]`) against the pre-implementation
codebase. Checks, in order:

1. `fgos submit ... --refs a,b --parent zzz --footprint x.js,y.js
   --goal-tier milestone --targets t1,t2 --urgent high` produces a work
   item whose `refs`/`parent`/`footprint`/`goalTier`/`targets`/`urgent`
   fields match exactly what was passed (D1).
2. `fgos edit <id> --goal-tier mvp` on that same item actually changes
   `goalTier` to `mvp` when read back (D2, both halves — `EDITABLE_FIELDS`
   and the `edit` case's flag parsing, per the scope note above).

Item's `verify` field is set to `bash
docs/history/submit-add-field-parity-goaltier-editable/verify.sh`.

## Outstanding — deferred to planning

- Exact flag names/parsing for the new `submit` flags (mirror `add`'s
  `--refs`/`--parent`/`--footprint`/`--goal-tier`/`--targets`/`--urgent`
  verbatim, or adapt) — implementation detail, not a product decision.
- Whether `edit`'s hardcoded field-parsing list (see D2 scope note above)
  should gain a `--goal-tier` entry following the exact same pattern as
  its existing `urgent`/`tier` handling, or something else — mechanical
  implementation detail for planning to confirm against the real code.
