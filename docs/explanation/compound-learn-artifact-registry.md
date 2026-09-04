---
authoritative_for: fgOS's knowledge/document registry redesign (tsk-28x) — replacing the single Diataxis-quadrant axis with two orthogonal axes (identity: purpose/role/entity; writing: framework/mode), a registered topic/doc lifecycle with cardinality invariant activeDoc(topicId,role)<=1, and the compound->knowledge boundary rename this whole retro-loop session's own synthesis tooling (fgos-coding-knowledge, fgos topic/doc/knowledge verbs) runs on
---

# The registry this session's own retrospective synthesis runs on, decided here

`tsk-28x` is the design origin of the knowledge/document registry every
item in this retrospective-loop session has been synthesizing through —
`fgos topic register`, `fgos doc reserve/mark-rendered/promote`,
`fgos knowledge attest`, and the `fgos-coding-knowledge` skill itself.

Started 2026-08-07 as a scoped-out point ("point E") during `tsk-12m`'s
own coding-shape discussion, once the product owner named compound-learn
as a strategically important area needing to serve more audiences over
time — clearly bigger than `tsk-12m`'s narrow changelog ask, so split into
its own `DISCUSSION.md` per `fgos-coding-shaping`'s one-feature-one-doc
rule (`docs/history/compound-learn-artifact-registry/DISCUSSION.md`).

## The full spec lives elsewhere — this doc is the narrative, not a duplicate

`docs/architect/knowledge-registry-redesign.md` (743 lines) is the
complete design spec: problem statement, goals, non-goals, the full
`knowledge`/`topic`/`doc` command surface, lifecycle states, migration
plan, and harness requirements. This doc doesn't restate it — it's the
retrospective narrative of how 18 locked decisions (`D-tsk28x-1` through
`D-tsk28x-18`) got there and what shipped.

## The core reframe: two axes, not one

The old model classified every end-user doc by one axis — the Diataxis
quadrant — and that one axis did three jobs at once: how to write it,
where it lives, and what it's about. `D-tsk28x-1`/`D-tsk28x-4` split this
into two genuinely orthogonal axes:

- **Identity** (three coordinates: purpose — single-valued, slow-changing,
  becomes the directory; role — single-valued, closed vocabulary, becomes
  the filename; entity — multi-valued, fast-changing, becomes frontmatter
  tags, never a folder).
- **Writing framework/mode** (an open registry of writing frameworks —
  Diataxis is one specific closed 4-quadrant framework living on this
  axis, not the axis itself; other frameworks can join with their own
  vocabulary).

`D-tsk28x-5` locks the resulting layout: `docs/<purpose>/<role>.md` — the
path itself is the single-valued identity, so filesystem-enforced
deduplication is free, no anti-fork gate needed. `D-tsk28x-13` later
supersedes the specific dedup mechanism claim in D-tsk28x-5: the path is
only a physical backstop, not semantic anti-fork — that already exists via
`fgos authoritative-match` (`src/report/authoritative-match.mjs`, the same
find-before-create doctrine this retro-loop session used before every
topic registration this run). The real gap was surfaced discipline +
enforced declaration, not new machinery.

## The registry itself

`D-tsk28x-6`/`D-tsk28x-7`: the registry is event-sourced in `.fgos/` with
its own verbs (`fgos topic register/split/merge/rename/retire`), always
paired with two projections per audience — JSON (machine-read) and
Markdown (human-skim) — plus a doctor check for staleness. The structure/
schema/write-rules stay closed; the topic list stays open. Adding a new
*role* is a closed, event-logged decision, never an inline invention.

`D-tsk28x-8`: one engine, two separated registries — the end-user-doc
layer optimizes for clarity (accepts deliberate duplication across
audiences), the machine layer (`docs/specs/`) optimizes for compactness.
They share verbs, projections, and doctor checks, but never vocabulary or
thresholds.

`D-tsk28x-9`: an old `docPath` is historical fact, never rewritten; where a
topic lives *now* is the registry's current answer via lineage
(split/merge tracked explicitly), not a hand-edited value.

`D-tsk28x-14`: hard cardinality invariant — `activeDoc(topicId, role) <= 1`,
no write-time escape hatch. A second active document for the same topic+
role requires an explicit split/merge/role-change through the registry
verbs, always leaving a lineage trail. `docId` is a technical row identity,
never a semantic cardinality key.

`D-tsk28x-15`: two separate vocabularies for two lifecycle layers — raw
material stays "draft"-language (`material draft`/`extracted_material`);
rendered documents use their own set (`provisional` → `active`, ending in
`superseded` or `retired`). "Draft" never leaks into the document layer.

`D-tsk28x-17`: a rendered doc always lands `provisional` first, never
self-promotes to `active` even for an explicitly pre-registered topic.
`fgos doc promote` is the sole door to `active`, gated: only
provisional→active, refuses if an active doc already occupies that
topic+role, refuses a path missing from HEAD, refuses an alias path,
requires valid topic/role. Promote only moves registry state — it never
writes prose.

## Naming: compound → knowledge

`D-tsk28x-16`: the boundary vocabulary itself was renamed from `compound`
to `knowledge` mid-decision, folded directly into this same item —
`fgos-coding-compounding` → `fgos-coding-knowledge` (the exact skill this
retro-loop session has been invoking every iteration), and the CLI pipeline
became `fgos knowledge extract/route/author/attest/run`. `fgos compound`
is marked deprecated, pointing at `fgos knowledge attest`.

## Scope carved out on purpose

`D-tsk28x-2`: unlinked from `tsk-12m` early — two independent items, not a
dependency chain. `D-tsk28x-12`: the storytelling-material harvesting half
(per-item thresholds, draft = extracted material, item↔commit linkage) was
split out to its own future item; this item stops at identity + topic
registry + the authoring skill itself.

## What landed as code: 12 children, this root just decomposed and locked design

This root item (`tsk-28x`) carried the design-shaping work (`DISCUSSION.md`,
18 locked decisions, `RESEARCH.md`, `plan.md`) through to a `decompose`
verdict — 12 children implement the actual registry/CLI/skill surface,
each synthesized separately by this same retro-loop.

### Child 1 — the domain model itself (`tsk-28x-1`)

`src/state/knowledge-registry.mjs` is the first child, and the literal
machinery every `fgos topic register`/`fgos doc reserve`/`fgos doc
promote`/`fgos knowledge attest` call this same retro-loop session has
made runs on: the schema plus reducer for the `topic.*` and `doc.*` event
families, with lifecycle states `reserved → provisional → active`, ending
in `superseded` or `retired`. Written doc-first, per the plan's own
convention — the phase file (context, requirements, files, steps, tests,
risks) committed before any code — honoring `D-tsk28x-6`/`D-tsk28x-14`/
`D-tsk28x-15` above. The cardinality invariant
(`activeDoc(topicId, role) <= 1`) is enforced right at the write, inside
the reducer itself — never checked afterward as a separate validation
pass. This piece moved no files; it's pure domain model.

### Child 2 — the docPath resolver, aliases only (`tsk-28x-2`)

`src/report/knowledge-resolver.mjs` adds `resolveDocPath(path)`: exact
`currentPath` match → doc; an old, aliased path → the same doc; a path
neither current nor aliased → `null`. No consumer was switched over to it
at this step — that migration comes later. Honors `D-tsk28x-9` directly:
an old `docPath` is historical fact and is never rewritten; this resolver
is the mechanism that lets "where does topic X actually live now" be
answered without touching the historical record.

### Child 3 — the doc-only classifier over the existing 268-document corpus (`tsk-28x-3`)

`scripts/knowledge-classifier.mjs` reads-only scans all 268 existing
end-user documents and emits a classification table with confidence +
evidence per file. It edits no document and writes nothing to the
registry — its output is data, doubling as both the raw vocabulary source
and the bootstrap input for the next child. Honors `D-tsk28x-11` (the
per-file classification pass is itself the vocabulary-generation step, one
job not two) and `D-tsk28x-18` (this classifier runs at step 3, before
bootstrap at step 4, precisely because the classifier's own output IS the
bootstrap data).

### Child 4 — bootstrap the registry from the classifier's output (`tsk-28x-4`)

`scripts/knowledge-bootstrap.mjs` reads the classifier's output (child 3)
and creates a registry entry for the entire 268-document corpus, with
`currentPath = oldPath` — the bootstrap doesn't relocate anything, it just
gives every existing document a registry row. Idempotent by requirement:
safe to rerun. Refuses to run at all if the classifier hasn't finished —
this item depends on both `tsk-28x-1` (the domain model it writes into)
and `tsk-28x-3` (the data it bootstraps from).

### Child 5 — the `topic`/`doc` CLI verbs themselves (`tsk-28x-5`)

`bin/fgos.mjs` + `src/cli/command-registry.mjs` gain the `topic` and `doc`
verbs — the exact commands `fgos-coding-knowledge` (and this retro-loop
session's own synthesis, every iteration) calls: `fgos topic register`,
`fgos doc reserve`, `fgos doc mark-rendered`, `fgos doc promote`. `doc
promote` locks all five preconditions `D-tsk28x-17` named: only
provisional → active; refuses if an active doc already occupies that
`(topicId, role)`; refuses if `currentPath` is absent from HEAD; refuses
an alias path; requires a valid topic/role. `promote` only moves registry
state — it never writes prose itself.

### Child 6 — the `knowledge attest` gate (`tsk-28x-6`)

The `knowledge attest` verb this retro-loop session has called at the end
of every synthesis gained its enforcement gate here: four conditions —
committed at HEAD, enforcement currently on, path is the live doc slot's
own `currentPath`, and path is NOT merely an alias (this fourth condition
is what closes the loophole). The `doc-registry.enforce` config default
was registered into `fgos setup`'s config-merge AND `fgos doctor`'s check
registry (`src/setup/checks.mjs`) — never a standalone, undiscoverable
config knob. Any refusal message names the fix directly, pointing at
`fgos doc reserve`.

## Landing this item hit the same fgos-write-rejected block 3 times

Approving this item's merge hit `fgos-write-blocked` (ADR0020: staged
`.fgos/` changes on a worker branch) three times in a row
(`.fgos/changelog-nag-history.jsonl`, `.fgos/config.json`,
`.fgos/entropy-history.jsonl`, `.fgos/events.jsonl`) before landing —
the same class of merge-block this retro-loop session already documented
fixes for elsewhere (`tsk-4s6`, `tsk-198`). Not itself a new finding;
noted here only because it delayed this item's own landing three separate
times.
