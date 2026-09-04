# PRD — B6 Metrics Harness (knowledge registry sprawl-control proof)

**Status:** not started (zero code, zero design decisions locked). This
document is a brainstorming brief, not a plan — every "Open questions"
item below is genuinely undecided; do not treat any option mentioned as
a recommendation.

**Feature lineage:** `docs/history/compound-learn-artifact-registry/DISCUSSION.md`
§B6 (`{#task-harness-metrics}`), part of the same knowledge-registry
redesign whose other 11 phases (model, resolver, classifier, bootstrap,
enforcement gate, attest verb, read-surface resolver wiring, doctor
checks, registry-first writer, canary, real migration apply) are all
`retrospective` (delivered) as of 2026-09-04.

## 1. The problem, quantified

Before this registry existed, the end-user doc corpus grew at a measured
**+7.1 docs/day** (268 docs, tree-diffed over a real 7-day window,
2026-08-11→18: `git diff --diff-filter=A 7df2b894 HEAD`). At that rate
the corpus doubles in size roughly every 5 weeks. This was not a vague
complaint — it was a real, cited number the whole redesign exists to
bring down, and 50 of those 268 docs were created *during the very
discussion* that decided to fix it.

The redesign's own design doc states the reason this must be measured,
not asserted: *"a plan that fixes it with no success metric is
unverifiable — and this discussion already paid for trusting the
unmeasured seven times over"* (design doc's own words, paraphrased from
Vietnamese). Every other phase of this redesign shipped on the strength
of code review and unit tests. B6 is the one phase whose entire job is
proving the *system-level* claim — sprawl rate actually went down — which
no unit test can prove by construction.

## 2. Original intention (why this specific shape, not a generic dashboard)

Six metrics were named, each targeting one specific way the registry's
own safeguards could look correct on paper while silently failing in
practice:

| Metric | What it proves is or isn't happening |
|---|---|
| `docs/day` (before vs. after) | Did the enforcement gate + registry-first writer actually slow the creation rate, or did writers route around it? |
| `new topics/week` | Is topic creation genuinely rare (the design's own stated intent — "a topic grows slower than work items"), or is everyone still minting one per item? |
| `provisional age` | Are newly-registered/migrated docs getting reviewed and promoted to `active`, or piling up in `provisional` limbo forever? |
| `duplicate warnings/week` | Is the near-duplicate detector (built to catch semantic forks — three files about the same topic under different names, not just similar filenames) actually firing on real forks as they happen? |
| `average source captures per active doc` | Is content genuinely consolidating (multiple compound-learn captures feeding one doc, growing it) rather than each capture still spawning its own new doc? |
| `number of old paths still resolving` | Does the alias/resolver mechanism (the thing that lets `docs/how-to/old-name.md` keep working after a real migration moves the file) hold up over real time, or does it quietly rot? |

None of these is a "nice to have" analytics number — each is a specific
failure mode this system could fall into while every existing unit test
and doctor check still reports green.

## 3. Long-horizon vision

This is not a one-time report. The design frames it as an ongoing
property the system must keep proving, the same way `doc-source-conservation`
(one of the 8 already-shipped doctor checks) turned "conservation" from
a one-time migration gate into "a live invariant, not an event." B6's
long-horizon shape is almost certainly the same kind of thing: a
standing, re-checkable signal — not a single retrospective slide deck —
that anyone (a person, a future doctor check, a future dashboard) can
consult at any point to answer "is the registry still doing its job?"
without re-deriving the answer from scratch each time.

The baseline number (+7.1/day) was captured once, by hand, from a git
tree-diff. The real deliverable this PRD is scoping is: what does the
**repeatable, low-effort version of that same measurement** look like,
for all six metrics, indefinitely into the future — not just as a
one-time "prove B6 done" exercise.

## 4. What already exists to build on (facts, not design decisions)

- **Registry event log** (`.fgos/events.jsonl` + shards, replayed via
  `rebuild(fgosDir)` from `src/state/store.mjs`) is the source of truth
  for `view.topics`/`view.docs`. Every topic/doc row carries `createdAt`/
  `updatedAt` timestamps already (`src/setup/registrations.mjs`'s
  existing `checkDocProvisionalAged` reads exactly these fields as a
  precedent).
- **8 doctor checks already shipped** (`doc-registry-stale`,
  `doc-alias-broken`, `doc-active-duplicate`, `doc-near-duplicate`,
  `doc-provisional-aged`, `doc-topic-oversized`, `doc-role-underused`,
  `doc-source-conservation`) are all **point-in-time snapshot checks**
  (pass/fail *right now*), registered via a simple `registerCheck({id,
  description, check})` pattern in `src/setup/registrations.mjs`. None
  of them track a *rate* or a *trend over a week* — that gap is exactly
  what B6 needs to close, and the existing pattern may or may not be the
  right shape for a time-series metric (see Open questions).
- **The original baseline was computed ad hoc**, via a manual git
  tree-diff over a chosen commit range — not from any registry event.
  `docs/day` specifically may need to keep leaning on git history (file
  creation dates), since the registry only exists from its own bootstrap
  point forward and has no visibility into pre-registry doc history.
- **Real corpus is live now**: 442 registered topics/docs, 332 of which
  came from the real migration this session just ran (all currently
  `provisional`, per the design's own rule that migrated docs land
  provisional until explicitly promoted).

## 5. Constraints and non-negotiables (already locked elsewhere in this redesign, do not re-litigate)

- No topic may be created outside `fgos topic register` or the
  classifier/migration tooling — whatever measures `new topics/week`
  must read this from the registry's own events, never infer it from
  filesystem scanning.
- `activeDoc(topicId, role) <= 1` is an invariant already enforced at
  write time (D-tsk28x-14) — "duplicate" in `duplicate warnings/week`
  means *semantic* near-duplication across different topics, not a
  cardinality violation (that class is already structurally impossible).
- The registry's own doc lifecycle is `reserved → provisional → active
  → retired/superseded`; "provisional age" means time spent specifically
  in `provisional`, not total doc age.

## 6. Open questions for brainstorming (genuinely undecided — this is the actual ask)

1. **Storage shape.** Do these six metrics need a new persisted
   time-series store (e.g., a periodic snapshot file, a new event
   type), or can every one of them be computed retroactively on demand
   from the existing event log + git history, with no new persistent
   state at all?
2. **Trigger/cadence.** Snapshot-on-demand (a new `fgos` verb a person
   runs manually), a new doctor check family (fits the existing
   `registerCheck` pattern but that pattern has never carried a
   rate/trend before), a scheduled/cron job, or something else?
3. **Presentation.** A CLI report, a generated markdown/JSON artifact
   (matching the existing `doc-registry.md`/`.json` projection
   pattern), a doctor-check warning, or several of these?
4. **Historical continuity for `docs/day`.** The original baseline used
   a manually-chosen git commit range. Does the repeatable version need
   a fixed "since registry bootstrap" anchor point, a rolling window
   (e.g., trailing 7/30 days), or should the person choose the range
   each time?
5. **What counts as "old path still resolving."** Every alias the
   registry has ever recorded, or only aliases created by the real
   migration apply (the specific event this metric was meant to
   validate)? Do aliases ever get pruned, and if so, does a pruned alias
   count as "no longer resolving" or "no longer relevant"?
6. **Ownership boundary.** Is this squarely a `fgos doctor`-family
   feature (read-only, advisory), or does it belong closer to the
   `fgos-coding-knowledge`/writer-skill side (the producer that could
   act on a bad trend, e.g., refusing new topics when `new topics/week`
   spikes)? The original design explicitly separates "measure" from
   "enforce" everywhere else in this redesign — worth deciding
   deliberately here too, not by default.
7. **Scope of "done."** Is a single before/after comparison (proving
   the specific claim that motivated this whole redesign: did the rate
   actually drop from 7.1/day) sufficient to close this PRD, with the
   "standing, ongoing" version explicitly deferred as later work? Or is
   the ongoing/repeatable shape part of this same deliverable's own
   scope? (Section 3's "long-horizon vision" argues for the latter, but
   this has not been decided by anyone with product authority — flag it
   back rather than assuming.)

## 7. Explicitly out of scope for this brainstorm

- Redesigning any of the other 11 already-delivered phases (model,
  resolver, classifier, bootstrap, enforcement, attest, read-surface
  wiring, the 8 existing doctor checks, writer skill, canary, migration
  script) — B6 consumes their output, it does not revisit their design.
- The separate, unrelated "Lane B" storytelling/curation feature
  mentioned elsewhere in the same discussion document (draft-candidate
  ranking, async human curation of compound-learn's own artifact
  producers) — a different, not-yet-built feature; do not conflate the
  two.

## 8. Deliverable expected from this brainstorm

Not a plan, not code — a proposed architecture/approach for all seven
open questions above, with tradeoffs stated, ready to hand to
`fgos-coding-planning` once a person picks a direction.
