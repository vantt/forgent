---
authoritative_for: post-tsk-2mt discover-stage-graph audit findings and fixes, clarify-stage-retired edge gaps, fgos-routing stale mapping, herdr dashboard sort break, spec/doc drift, entropy miscounting
---

# Closing the edge gaps a post-merge audit found after the clarify→discovery redesign

`tsk-5sr` (9 children, all delivered) closed every finding from a
thorough post-merge audit of `tsk-2mt`'s own discover-stage-graph
redesign (full narrative: `docs/history/discover-stage-graph-and-skill-
layering/FINDINGS.md`). The audit's own headline: `tsk-2mt`'s **code was
correct** (2960 tests passing, `main..HEAD` diff empty) — every gap it
found lived at the edges: stale data, broken measurement, and drifted
documentation, not the redesigned engine itself.

## What `tsk-2mt` had redesigned

A stage `clarify` (rewrite + domain classification) had been miscast as
an ordinary stage, while `discovery` (a machine-alone phase that can
self-judge) had been handed to a *tool* (`fgos-researching`) that always
threw the result to a person regardless of verdict. The redesign split
the flow into three zones: **Init** (pre-item, `fgos-clarifying` +
`fgos submit`, outside both the stage and status axes), the **stage
axis** (`discovery` — machine alone, self-judging, self-routing to
`planning` or `exploring` — then `exploring` → `planning` → `executing`),
and **helpers** (`fgos-researching`, never writes item state, callable
from any stage).

## Five real bugs the audit found, all fixed by this item's children

- **F1 — three items stuck at a retired `clarify` stage** (`tsk-2el`).
  A migration/code-merge race window (2026-08-11, ~76 minutes) let 3
  items get created carrying `stage: "clarify"` *after* the data
  migration had already run but *before* the item-creation code switched
  its own default away from it. `clarify` no longer existed in `stages`/
  `skillMap`/`stepMap` at all — these 3 items had no verb-based way out:
  `fgos discover` and `fgos plan` each pointed the user at the other,
  a closed loop. Fixed by re-running the (idempotent) migration script to
  sweep the stragglers.
- **F1b — the driver reported the stuck item as "mechanical," making F1
  silent** (folded into `tsk-2el`'s fix). `skillForStage(coding,
  'clarify')` returning `null` was read by the driver as "this position
  is intentionally skill-less," identical to how a genuinely mechanical
  position reads — collapsing two different meanings ("mechanical by
  design" vs. "this stage no longer exists") into one signal.
- **F1c — an `unclear` verdict silently wrote a fake `clarify-pass`
  settlement** (`tsk-31lz`). A stage-edge change (`discovery → exploring`
  on `unclear`, not just `clear`) didn't also update the settlement gate,
  which only checked `from === 'discovery'` — so an item that was *not*
  settled, with no real verify, got logged into the compound-learning
  channel as if it had passed with a real verify (actually the
  placeholder fallback string). Silent data corruption, no crash. Fixed
  by not recording that settlement for the `unclear` path.
- **F1d — `fgos-routing`, the skill every session loads first, still
  taught the exact wrong mapping that caused the original bug** (`tsk-2el`).
  Its own "Route by stage" table still pointed `discovery` at
  `fgos-researching` — the precise "tool wearing the owner's hat" `tsk-
  2mt` existed to fix — and had no row at all for `planning`, the stage's
  actual current name. A cold session following `AGENTS.md`'s own
  documented read-order would reproduce the original bug from prose
  alone.
- **F1e — the Rust `herdr-plugin` dashboard's stage sort order collapsed
  entirely** (`tsk-3zi`). `doing_tier()` matched literal `"executing"`/
  `"decompose"`/`"clarify"` for its pipeline sort, but all three
  currently-live stages (`discovery`, `exploring`, `planning`) fell
  through to the same catch-all bucket — not a reversed order, a
  *collapsed* one, indistinguishable research-phase from shaping-phase
  items in the dashboard. Notable structurally: `herdr-plugin` is a Rust
  crate `npm test` never touches, so all 6 of `tsk-2mt`'s own children
  had used a green `npm test` as their DoD evidence — a standard
  structurally blind to this bug.

## Documentation and spec drift (F2-F4), closed by the remaining children

- **F2 — `docs/specs/` still described the retired lifecycle**
  (`tsk-5eq`) — `reading-map.md`, `work-state.md` (216KB, marked
  `coverage: full`), and `runner.md` all still taught `clarify`/
  `compound-learn` as live stages; none of `tsk-2mt`'s 6 children had
  touched `docs/specs/` at all, a direct DoD-question-6 gap.
- **F3 — `AGENTS.md`/`CLAUDE.md`, loaded into every session, named
  skills that no longer exist** (`tsk-2el`, `tsk-2so`) — plus ~28 more
  repo-wide occurrences: an end-to-end tutorial, 7 how-to doc *filenames*
  themselves carrying retired stage/verb names (surfaced verbatim by the
  docs index), open backlog rows, and hardcoded ceiling examples in
  `fgos-coding-driving/SKILL.md` itself.
- **F4 — `CHANGELOG.md`'s `[Unreleased]` section missing 3 of 6
  children's entries, and self-contradicting** (`tsk-q88`) — two existing
  `[Unreleased]` lines described behavior the very same release had
  already changed (`clarify`-stage auto-launch, a submit-time
  tier/kind/risk re-judge that `tsk-2mt` itself had removed). The doctor
  check for this only verified "at least one entry exists," never "the
  entry is still accurate."

## A measurement bug (F5)

`src/report/entropy.mjs`'s `countStageClarify` still filtered on
`stage === 'clarify'` — after the retirement, this correctly counted the
3 F1 stragglers but **silently missed all 65 real open items actually
sitting at `discovery`**, the exact backlog-quality signal the metric
existed to measure. Fixed (`tsk-2t3`) to count the current stage name.

## Two more real gaps closed

- **`tsk-64h`** — established one source of truth for "what stage can
  `discover` accept," backed by a doctor invariant check (the audit had
  found `discover-pool.mjs`'s hardcoded stage set and
  `discoverableStages(domain)` disagreeing on whether `clarify` was
  still valid).
- **`tsk-19m`** — let the interactive path get classified through the
  `discover` verb the same way the headless path already did.

## Four things the audit re-checked and confirmed correct, unchanged

The legacy `decompose` alias still correctly drains open items (`plan-
pool.mjs` keeps both names in its candidate set); helpers never write
item state (a direct mechanical grep of `fgos-researching/SKILL.md`
confirms no `fgos <verb>` calls); the headless path reports tier/kind/
risk as real structured data through a verified three-point chain
(schema → parse → gated apply); and the `submit-assist-classify`
capacity retirement left no trace anywhere in the registry.
