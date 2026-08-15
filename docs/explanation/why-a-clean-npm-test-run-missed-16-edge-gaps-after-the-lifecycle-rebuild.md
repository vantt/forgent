# Why a clean `npm test` run missed 16 edge gaps after the lifecycle rebuild

`tsk-5sr` is the umbrella item (9 children) that closed the edge gaps a
post-hoc audit found after `tsk-2mt`'s pre-planning lifecycle rebuild
(`clarify` → `discovery`/`exploring`/`planning`) had already shipped, all
six of its own children at `retrospective`, `npm test` green (2960
passing), and `git diff --stat main..HEAD` empty. The audit
(`docs/history/discover-stage-graph-and-skill-layering/FINDINGS.md`, §9)
found the *code* was correct — every real bug and doc drift sat at the
**edges**: stale prose, an uncovered Rust crate, a silent data-migration
race, and a metric counting a retired stage. This document is the general
lesson from that audit, not a restatement of `tsk-2mt`'s own design
(covered in `why-clarify-split-into-clarify-discovery-and-exploring.md`).

## Five real bugs nobody knew about yet

- **Three items were permanently stuck.** A one-shot data migration
  (`clarify` → `discovery`, 82 events) ran at 15:16, but the code default
  for a freshly-submitted item's stage didn't switch away from `clarify`
  until a merge landed at 16:33 — a 1h16m race window. Three items
  (`tsk-22c`, `tsk-61j`, `tsk-365`) were created inside that window and
  landed at a stage (`clarify`) that no longer existed in `skillMap`/
  `stepMap`. Worse: `discover-pool.mjs` hardcoded a `Set` that still
  accepted `clarify` as a candidate stage, while the domain-aware
  `discoverableStages()` the engine actually checks against had already
  dropped it — so the pool would offer the item, and the engine would
  refuse it, in a closed loop with no verb able to move it anywhere.
- **The driver reported that stuck state as a clean stop.** `null` from
  `skillForStage` is overloaded to mean two different things: "this
  position is mechanical by design" and "this stage no longer exists." A
  stuck `clarify` item hit the second case but was reported using the
  first case's success-shaped message — a silent failure with no visible
  symptom.
- **A settlement gate silently mis-recorded an `unclear` verdict as
  passed.** The new clear/unclear edge selection changed which stage
  transition fires on an `unclear` verdict (now also a `moveStage` call),
  but the settlement-logging gate that fires on any `discovery`-origin
  `moveStage` was never updated to distinguish the two verdicts — so an
  item correctly parked as unresolved got written to the compound-learning
  log as `clarify-pass`, sometimes carrying a literal placeholder string
  as its "verify."
- **The very skill every session reads first still taught the original
  bug.** `fgos-routing`'s own "route by stage" table — loaded before
  anything else, per its own stated contract — still pointed `discovery`
  at `fgos-researching` (the tool-wearing-the-owner's-hat mistake the
  whole redesign existed to fix) and had no row for `planning` at all. A
  cold session following the onboarding doc exactly as written would
  reproduce the original bug from scratch.
- **A Rust dashboard crate's own sort order silently collapsed.** A
  hand-rolled tier function in `herdr-plugin` (not touched by any of the
  six original children, and outside `npm test`'s reach entirely) matched
  literal stage names `"decompose"`/`"clarify"` for its sub-sort — after
  the rename, every live stage fell into the same fallback bucket, so the
  dashboard stopped distinguishing "researching" from "shaping" work at
  all. Not a reversal, a total loss of ordering.

## Seven structural instabilities — the reason this will recur

The audit's own framing: these seven aren't fixed by one commit each —
they're missing *mechanisms*, so the same shape of bug will reproduce on
the next graph-shaped refactor unless the mechanism itself changes.

- **B1 — no ordering constraint between a one-shot data migration and the
  code merge it depends on.** Any migration for a value the *old* code can
  still produce opens a race window exactly as long as the gap between
  running it and the code landing on `main`. Direction: attach migrations
  to a merge's own post-merge step instead of running them by hand in a
  worktree.
- **B2 — two independently-maintained sources of truth for the same
  question** ("which stages can be discovered"): a hardcoded `Set` in the
  pool vs. a domain-aware function in the engine. This is the exact
  mechanism that turned three stray items into a permanently-stuck class —
  the pool invites them in, the engine throws them out. Direction: the
  pool should call the engine's own function, never keep a literal copy.
- **B3 — no invariant that "every open item stands at a currently
  registered stage."** `fgos doctor` already checks the analogous
  invariant for `kind`/`risk` vocabulary; the same class of check for
  `stage` would have caught this the day it happened instead of letting
  it sit silent. Named as the cheapest, highest-leverage single fix in the
  whole list.
- **B4 — `.fgos/` is git-tracked, and the CLI resolves it strictly from
  cwd** — so a linked worktree that merges/checks out `main` reconstructs
  its own, stale copy of the store next to the real one. The audit hit
  this directly, live, while auditing: a `show` command run inside a
  worktree returned 14128-line-old state against a 14246-line real store.
  Every sanctioned code path already resolves through `--git-common-dir`
  and passes `--dir` explicitly, so this is a trap for ad hoc commands and
  agent improvisation, not a break in the primary path — but a *write*
  landing in the phantom copy would be silent data loss.
- **B5 — spec/prose is not treated as a required artifact of a stage-graph
  change.** All six original children were green, iron-law-evidenced, and
  gated — while `docs/specs/work-state.md` (`coverage: full`) still
  described a state machine that no longer existed. The repo's own DoD
  names this as a requirement in prose; no gate actually reads it.
- **B6 — the proof standard ("`npm test` green") is structurally blind to
  a same-repo Rust crate and to all prose.** `npm test` is `node --test`;
  it never touches `herdr-plugin` (a `cargo` crate) and cannot parse
  skill-file prose for factual accuracy. Every child passed its own DoD
  while the dashboard sort silently broke and five separate docs kept
  teaching a retired mapping — not a failure by whoever did the work; a
  gap in what "proof" is defined to cover.
- **B7 — the interactive and headless paths do not carry equal
  capability**, violating a stated repo-level law. The classification
  values (`tier`/`kind`/`risk`) discovery is supposed to re-derive after
  research travel through a checked data contract on the headless
  (runner) path, but only through prose ("the skill remembers to call
  `fgos edit`") on the interactive path — the CLI verb backing the
  interactive path has no `--tier`/`--kind`/`--risk` flags at all.

## The nine-child remediation, ranked by the audit's own leverage order

The audit ended with an explicit priority list (§11), and the nine
children map onto it directly: fix `fgos-routing`'s own route table first
(the entry-point skill teaching the original bug); re-run the migration
script to sweep the three stuck items; add the missing
`no-open-item-at-unregistered-stage` doctor invariant (B3); fix five
skills' frontmatter descriptions plus one factually-wrong sentence; fix
`AGENTS.md`/`CLAUDE.md`'s own stale skill names; fix the Rust dashboard's
sort function; close the settlement gate's false-pass on `unclear`; add
the three missing `CHANGELOG.md` entries and correct two
self-contradicting ones already sitting in `[Unreleased]`; and update
specs/tutorials/how-to filenames to match the current lifecycle. The
parent item itself (`tsk-5sr`) coordinated the batch and closes only once
every child reaches a terminal status — it authored no fix of its own.

## The general lesson

A rebuild's own test suite proving the *code* correct says nothing about
whether the *edges around* that code — the doc every session loads first,
a sibling-language crate outside the test runner's reach, a metric
counting the old vocabulary, a migration racing the merge that depends on
it — got carried along. "All tests green" and "nothing was left teaching
the old model" are different claims, and only a full audit against real
state (not a code read of any one piece) found the gap between them here.

## Confirmed: `tsk-2el` closed the entry-point prose gap (F1d/F1f/F1g/F3)

The audit's own #1-ranked fix — `fgos-routing`'s "route by stage" table,
the skill every session loads first, still teaching `discovery ->
fgos-researching` and missing a `planning` row entirely — landed as
`tsk-2el`, along with the sibling frontmatter/prose fixes (F1f, F1g) and
the stale skill names in `AGENTS.md`/`CLAUDE.md` (F3). Confirmed directly
in the current tree: `fgos-routing/SKILL.md` now names
`fgos-coding-discovering`, and neither `CLAUDE.md` nor `AGENTS.md` still
names a retired skill (`fgos-code-implement`, `fgos-exploring`). Its own
footprint touched 14 files across `.claude/skills/`, `plugins/fgOS/
skills/`, and both root docs, mirrored to `.agents/skills/` per this
repo's own three-way skill-mirror convention.

One real friction on the way: merging `fgw/tsk-2el` into the parent
branch `fgw/tsk-5sr` conflicted on the first attempt (aborted cleanly,
parent branch unchanged before retry) — the same structural cost
`tsk-30v`'s own capture (in the sibling document,
`why-clarify-split-into-clarify-discovery-and-exploring.md`) already
named for `tsk-2mt`: landing several sibling branches on one shared
parent branch concurrently costs real, repeatable merge friction, not a
defect in any one child's own fix.

## Confirmed: `tsk-3zi` fixed the Rust dashboard's blind spot (F1e)

The one finding `npm test` structurally could not have caught on its own
— `herdr-plugin`'s `doing_tier` function, matched against the retired
stage literals `"decompose"`/`"clarify"`, collapsing every live stage's
own sub-sort into one fallback bucket — landed as `tsk-3zi`. Confirmed
directly in the current tree: `doing_tier` (`herdr-plugin/src/fgos.rs`)
now matches `"planning" | "decompose" => 2` (`decompose` kept as the same
drain-only alias the six original children preserved for stage
transitions, D18), restoring the pipeline-order sub-sort the function's
own doc comment always claimed to provide. Verified by `cargo test
--manifest-path herdr-plugin/Cargo.toml` — the verify command this item's
own scope required, distinct from `npm test`, exactly because B6 named
that gap as the reason this bug went unnoticed by the original six
children's own green suites.

## Confirmed: `tsk-31lz` closed the false-pass settlement gate (F1c)

The settlement-logging bug — an `unclear` verdict's own `discovery ->
exploring` move (introduced by `tsk-30v`'s edge-selection change) tripping
the same gate that logs a genuine pass, because that gate gated only on
`from === 'discovery'` and never checked the verdict itself — landed as
`tsk-31lz`. Confirmed directly in the current tree: the gate
(`src/state/replay.mjs`) now reads `from === 'discovery' &&
drivingVerdict?.clear !== false` before logging a `clarify-pass`
settlement, so a park-on-unclear item no longer gets written to the
compound-learning log as resolved. One real friction on the way: the
first `sync-root` attempt into the parent branch `fgw/tsk-5sr` failed its
own goal-check (aborted cleanly, parent unchanged) before a clean retry
landed — the same class of merge-time friction the sibling children in
this batch also hit.

## Confirmed: `tsk-64h` closed B2 and B3 together

The dual-source-of-truth bug (B2) and the missing stage-registration
invariant (B3) — the two structural gaps behind F1's stuck-item class —
landed together as `tsk-64h`. Confirmed directly in the current tree:
`discover-pool.mjs`'s own candidate filter now calls the same
`discoverableStages(domain)` the engine verb itself checks against
(`return discoverableStages(domain).includes(item.stage)`), rather than
keeping a separately-maintained literal `Set` that could drift out of
sync with it — closing B2. A new `fgos doctor` check,
`work-stage-vocabulary` (`src/setup/registrations.mjs`), was registered
in the same shape as the pre-existing `work-classification-vocabulary`
check that already caught `kind`/`risk` drift, extending that same
invariant class to `stage` — closing B3, the audit's own named
highest-leverage, lowest-cost fix. A follow-up item (`tsk-1l9`, outside
this batch) later built on this by having `fgos discover`/`fgos plan`
each check whether the other would actually accept a stage-mismatched
item before referring to it, and pointing at this new doctor check
instead of the closed referral loop F1's own audit section described.
