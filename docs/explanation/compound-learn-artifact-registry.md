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

### Child 7 — switching real consumers to the resolver, a hard checkpoint (`tsk-28x-7`)

`findAllSourceCaptureIds`, `fgos doc-sources`, and `fgos docs-index` (all
in `src/report/enduser-index.mjs`/`bin/fgos.mjs`) switch from plain
string-matching to the resolver (child 2) for real. Required: an old
`oldPath` must still resolve to its capture after the switch, and
`currentPath` must gather both old and new captures. This is a hard
checkpoint — the item's own action names it explicitly: no other file may
change until this piece is done, since every downstream consumer depends
on the resolver actually being wired in correctly first.

### Child 8 — the two projections plus doctor checks (`tsk-28x-8`)

`src/report/knowledge-projection.mjs` generates `docs/doc-registry.json`
(machine-read) and `docs/doc-registry.md` (human-skim, the file this
retro-loop session has queried via `fgos authoritative-match` before
every topic registration) — the human projection must surface lineage,
topics with no doc yet, docs stuck `provisional` too long, topics over a
size threshold, and any role with more than one doc. 8 doctor checks were
registered (`src/setup/checks.mjs`); notably `doc-near-duplicate` finally
wired up the `--check-duplicates` backstop that had sat dead since it was
added — until this item, its only caller was its own unit test.

### Child 9 — the writer skill itself, renamed to `fgos-coding-knowledge` (`tsk-28x-9`)

This item is the direct origin of `fgos-coding-knowledge`
(`.agents/skills/fgos-coding-knowledge/`, `.claude/skills/fgos-coding-knowledge/`)
— the skill this whole retro-loop session has invoked on every single
iteration. Before this item, the writer skill picked its own quadrant and
made up its own path; after, the flow is: capture → classify → ask the
registry/resolver → a strong match grows the existing doc, a weak match
lands `provisional`, and wanting a genuinely new topic requires going
through `topic register` explicitly. The "write first, tag second" rule
was kept. A rendered doc always lands `provisional` first (`D-tsk28x-17`,
already covered above). The skill directory itself was renamed from its
old `compound`-era name to `fgos-coding-knowledge`, per `D-tsk28x-16`.

### Child 10 — the end-to-end writer canary, a gate on the migration itself (`tsk-28x-10`)

`test/e2e/knowledge-writer-canary.test.mjs`: a real item or fixture goes
all the way through the new writer path — `topic register`/`doc.reserve`
→ write a new doc in the new layout → `attest` succeeds because the
registry already has the matching `currentPath` → the doc becomes
`provisional` → `doc-sources` returns the capture → `docs-index` shows the
doc. This is a hard gate: the migration to the new corpus (later children)
is not allowed to run until this canary is green.

### Child 11 — the real 268-document migration, dry-run first (`tsk-28x-11`)

`scripts/knowledge-migration.mjs` is the migration that moved the existing
corpus into the new `docs/<purpose>/<role>.md` layout — the reason every
doc this retro-loop session has read or written already lives at its
current path. Dry-run runs first: build the `oldPath → target` inventory
and check a conservation gate (every file appears exactly once at its
target, or carries an explicit exclude reason; no target ends up with zero
sources yet stays active; no source gets folded in a way that loses its
lineage). Apply only runs once the dry-run is clean: commit the registry +
aliases, move/fold files to their targets, rebuild the index, then run the
duplicate/lineage harness. Parallelism is scoped strictly by target, never
by source file independently — two sources folding into the same target
can't race each other.

### Child 12 — deprecating `fgos compound`, the first real use of this repo's own deprecation path (`tsk-28x-12`)

`fgos compound` is marked deprecated in `command-registry.mjs`, pointing
at `fgos knowledge attest` (matching the `fgos --help` output referenced
in this project's own `AGENTS.md`). Deprecate, never delete: the old verb
keeps running for at least one full release cycle. This item is notable
for a reason beyond its own scope: it's the first time this repo's
deprecation path has actually been exercised — every other verb's
`deprecated` field was still `null` before this item — so it had to
verify things nobody had verified yet: does a deprecated verb still run,
what does `--help --json` render for it, and does the `fgos-manifest` test
actually catch the new field. Spec, hard rule, and one `CHANGELOG.md`
`Unreleased` line were updated to match.

## Landing this item hit the same fgos-write-rejected block 3 times

Approving this item's merge hit `fgos-write-blocked` (ADR0020: staged
`.fgos/` changes on a worker branch) three times in a row
(`.fgos/changelog-nag-history.jsonl`, `.fgos/config.json`,
`.fgos/entropy-history.jsonl`, `.fgos/events.jsonl`) before landing —
the same class of merge-block this retro-loop session already documented
fixes for elsewhere (`tsk-4s6`, `tsk-198`). Not itself a new finding;
noted here only because it delayed this item's own landing three separate
times.

### Child 13 — a code-review follow-on found 4 real gaps in lifecycle enforcement (`tsk-3uc`)

A code review of the `tsk-28x` series found the registry's lifecycle
state machine had 4 real, still-open holes, each fixed here with a
regression test:

- **`doc.register` bypassed the lifecycle state machine.** Re-registering
  an existing `docId` let the call overwrite `docLifecycle` freely — a
  register without `--lifecycle` could silently demote `active` back to
  `provisional`, or resurrect a `retired`/`superseded` doc back to
  `active`, defeating `doc.promote` as the sole `provisional -> active`
  gate. Fixed: `doc.register` on an existing `docId` now preserves the
  current lifecycle and rejects any lifecycle transition it's handed,
  not just the `(topicId, role)` slot check `assertDocSlotAvailable`
  already did.
- **`attest` still resolved against a `superseded` doc.**
  `knowledge-resolver.mjs`'s live resolver excluded only `retired` docs,
  and the reducer's attest guard only rejected writes into `retired` —
  so `knowledge attest --doc-path <old-current-path>` could still resolve
  and write a capture linkage onto a doc that was no longer authoritative.
  Fixed: the resolver now excludes `superseded` too, and the reducer
  rejects `doc.attest` into a `superseded` doc, not just `retired`.
- **`topic.merge`/`topic.split` didn't check source/target status.**
  `topic.merge` only checked that `targetTopicId` existed — merging into
  an already-`retired` topic silently locked out all future writes.
  `topic.split` only checked the source existed — splitting an
  already-`retired` topic created a new `active` successor out of an
  ended lineage. Fixed: both now require `status === 'active'` on the
  relevant topic, with regression tests for each rejected case.
- **`topic.retire` on a nonexistent `topicId` was a silent no-op**
  instead of throwing — the CLI reported success with no actual state
  change. Fixed: fails closed, matching the already-correct behavior of
  `doc.retire`/`doc.supersede`.

**Landing hit its own real infrastructure friction, not a code defect.**
`fgos return` got stuck mid-item on a `settleClaim` CAS mismatch (a
`fgos edit` call made while holding the claim had bumped the durable
revision out from under the claim's own captured `preClaimRevision`, and
no release-claim verb existed to recover) — the user explicitly approved
a manual `move --to awaiting-approval` bypass after being shown the
blocker, backed by 17 commits and a repeatedly green full `npm test` run.
Landing then hit `fgos approve`'s own merge/move state machine losing a
durably-written `awaiting-approval` event within seconds of being
confirmed present, then crashing on retry instead of returning a clean
structured block — reproduced 3 times with a fresh `fgos list` each time,
confirmed no other session was touching the item. The user again
explicitly chose to bypass `fgos approve` and land the branch with a
manual `git merge --no-commit --no-ff` plus manual conflict resolution
(a real `CHANGELOG.md` content conflict, plus `.fgos/` path noise resolved
by keeping main's own current `.fgos/` state per ADR0020), verified by a
full `npm test` pass (4238 tests, 4233 pass, 0 fail, 5 skipped) before
committing the merge. Both the CAS-mismatch dead-end and the vanishing
awaiting-approval event were logged as tool bugs to report separately —
this doc records them as landing friction for this item, not as a claim
they were fixed here.

## The gate went from built to live: `docRegistry.enforce: true` (`tsk-1uj`)

`tsk-28x-6` built the 4-condition `knowledge attest` gate, but
`.fgos/config.json`'s `docRegistry.enforce` stayed `false` — so the gate
ran soft-fail (`{attested:false, reason:...}`) on any unregistered path
instead of actually refusing. `tsk-1uj` is step 5 of the design doc's own
"Correct Implementation Order" (`docs/architect/knowledge-registry-redesign.md`
§11): flip that flag to `true`, closing the gap between "the gate exists"
and "the gate enforces."

Safe to flip because both preconditions were verified live first, not
assumed: bootstrap had registered 332/332 topics and 332/332 docs active
(`fgos knowledge status`), and the writer canary (`tsk-28x-10`) was green.
Per ADR0020, the branch itself carried only a stale-title touch-up in
`test/cli/knowledge-attest-gate.test.mjs`; the actual `.fgos/config.json`
flip landed as a separate, direct single-parent commit on main
(`6cce97ab`), never through the branch.

**Live proof, not the sandboxed canary.** `scripts/knowledge-canary.mjs`
always drives a disposable tmpdir per its own source comment — running it
again would have proven nothing about the real registry. Two real
`fgos knowledge attest` calls against the live repo did instead: an
unregistered path (`package.json`) now correctly refuses with exit 4
("is not registered in knowledge registry"), where it previously
soft-failed; a real registered `currentPath` still attests normally. One
side note logged for next time: the second smoke call wrote a real
`sourceCaptureIds` entry onto that doc's live history — harmless and
clearly labeled, but a read-only `fgos doc-sources` check would have
proven the same point without touching a real document.

This item is also the migration apply's own prerequisite: the design
doc's stated safety property is "enforcement is enabled before files are
moved into the new layout," so `tsk-28x-11`'s real-migration-apply item
was blocked-by this one.

## Two bugs the real migration dry-run surfaced before it could apply (`tsk-ozk`)

Running `tsk-5mh`'s real migration apply against the live registry hit
`ENAMETOOLONG` at target 181/332 — a `mkdir` path component over the
filesystem's 255-byte limit. Root cause: 247 of 332 topics (74%) had a
`purposeSlug` the classifier had set to the full explanatory doc title
verbatim (up to 420 bytes) instead of a short, directory-shaped slug —
confirmed live, not theoretical, the moment a real apply actually walked
the registry instead of a dry-run.

Separately, the user reviewing that same dry-run's output reacted to the
resulting flat `docs/<purposeSlug>/<role>.md` layout — `D-tsk28x-5`'s own
locked clause, cited above — dumping ~180 new single-purpose directories
directly under `docs/` as "too messy," and asked for a `docs/knowledge/`
prefix instead. Because this changes a locked layout clause rather than
just fixing a bug, it went through a proper decision
(`fgos decision --relation supersedes:D-tsk28x-5`), not an ad-hoc
mid-execution patch — the anti-duplication mechanism `D-tsk28x-5`
actually protects (path-as-identity-pair, per `D-tsk28x-13` above) stayed
untouched; only the literal path prefix changed to
`docs/knowledge/<purposeSlug>/<role>.md`.

`tsk-ozk` fixed both, as one pass-through item (heavy risk, confirmed by
the user rather than split — no `CONTEXT.md` existed to cite decision ids
for children, and both halves gate the same downstream item, `tsk-5mh`,
the same way): a length-bound + collision-safe-truncation rule applied to
all 247 affected topics via the existing `fgos topic rename` verb, plus
recording and implementing the `docs/knowledge/` prefix decision. Verify
proved it against the canonical store, not a sample: 0 active topics left
over 60 bytes. `tsk-5mh`'s real apply resumed only after this landed.
