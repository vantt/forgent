---
item: tsk-2yog
docsRef: docs/history/fgos-routing-mode-gate-skip-load/
---

# plan.md — tsk-2yog: build the skip-load path the Mode gate names as missing

Mode: **standard**

Flags counted per `fgos-routing/SKILL.md`'s own Mode-gate table (no
CONTEXT.md exists — item reached `planning` via a `clear` discovery
verdict, so this Mode decision is this plan's own, per the same fallback
`references/bootstrap-and-lane.md` names for "nobody decided a lane yet"):
`weak proof around the area` (a prose/skill-doc fix has no automated way
to assert "fewer files got read" — see Verify below) is the only flag that
clearly applies. That alone would read as tiny/small (0-1 flags), but the
item touches 5 coupled files across 4 heavy skills plus the driving-loop's
own shared mechanics doc, all of which must land together for the skip to
actually take effect end to end (a partial landing leaves some call sites
skipping and others still loading full chains, an inconsistent half-fix
worse than the status quo) — story-sized breadth, not a couple of files →
**standard**, not tiny/small, honoring the mode-gate's own "say plainly
why a smaller lane would not honestly cover the item" instruction.

## Research this plan relies on

`docs/history/fgos-routing-mode-gate-skip-load/RESEARCH.md` (Round 1,
2026-08-23, from this same drive's discovery stage) — confirms the bug is
real and current, confirms no existing lane-conditional mechanism exists
in `src/state/workflow-stage-graphs.mjs` (the only per-item workflow axis
today is `kind`, never lane), and confirms no duplicate open work item
claims this fix.

## What "skip-load" actually costs today (re-scoped from the item's own framing)

The item's own text frames the missing piece as "an actual routing-table
change" in `fgos-routing`'s prose. Direct evidence gathered live in this
same planning pass corrects that framing on one point: an *engine-level*
skip-and-advance trust signal already exists —
`src/intake/plan.mjs` (`grep -n "skip-and-advance"`) lets `fgos plan` run
with no explicit verdict when `plan.md` already declares a tiny/small
`Mode:` line, and `bin/fgos.mjs`'s CLI registry documents this exact
short-circuit. What it skips is **one live judgment call inside
`fgos-coding-validating`'s own gate** — not the cost of *reaching* that
point. Every caller in the chain (`fgos-coding-driving`'s loop, `fgos-
coding-planning`'s own Handoff step) still unconditionally reads the full
SKILL.md + reference-file text of `fgos-coding-planning`, `fgos-coding-
validating`, and `fgos-coding-implement` before that trust signal is ever
consulted — this is the literal, reproducible source of the token/context
cost tsk-1uf's drive measured. The real fix is therefore not a new data
structure in `workflow-stage-graphs.mjs` (no engine call site there
currently decides "which skill to load" per-lane, and adding one there
without also touching every caller listed below would not save anything)
— it is teaching each skill's own Bootstrap step, and the driving loop
that invokes them, to check the lane BEFORE opening a reference file, not
after.

## Approach

**Chosen path:** add an explicit lane check at the top of each heavy
skill's own flow (before its own "Full mechanics: references/X.md"
pointer), so a `tiny`/`small` lane runs a short, self-contained inline
procedure already sketched in each SKILL.md's own body text instead of
opening the matching reference file. No engine/JS change, no new skill
file, no new item field — `Mode: <lane>` (already written into `plan.md`
today, already parsed by the engine's skip-and-advance heuristic) is the
single signal every hop reads; nothing new to invent, only new places
that read the signal that already exists.

**Alternatives rejected:**
- A new `workflows` entry (`domains/coding/workflows/lite.yaml`) selected
  by lane instead of `kind`, threaded through `resolveWorkflow`/
  `bundleForStage`. Rejected: `skillMap` only ever resolves ONE skill name
  per stage at the outer driving-loop level; `fgos-coding-planning` →
  `fgos-coding-validating` chaining happens inside `fgos-coding-planning`'s
  own Handoff prose, not through that table (confirmed reading
  `fgos-coding-planning/SKILL.md`'s own text: "Shaping and proving are a
  judgment split inside the one planning stage, never two separate stage
  values"). A workflow-table entry could rename which skill loads for
  `planning`, but not skip `fgos-coding-validating`'s own reference reads
  once inside it — would not close the actual gap, and adds a second,
  parallel workflow-selection axis (lane) beside the existing one (kind)
  for a saving it cannot fully deliver.
- A brand-new lightweight skill/reference set duplicating tiny/small logic
  outside the existing four skills. Rejected: doubles the maintenance
  surface (RUL11, `AGENTS.md` — "tùm lum" from duplication, not size) for
  content that already exists condensed inline in each skill's own Shape
  step ("a direct note for tiny... a fuller map for high-risk" — the
  scaling logic already exists, it just currently runs AFTER the full
  reference file is read, not instead of it).

**Files touched, in order** (`fgos graph --json` returned this item as an
isolated singleton component — `deps: []`, no other item depends on or
blocks it — so `criticalPath`/`topUnblock` carry no file-level ordering
signal here; order below follows the call chain itself, upstream to
downstream):

1. `.agents/skills/fgos-coding-planning/SKILL.md` Step 1 + `references/
   bootstrap-and-lane.md` — add: for `tiny`/`small` (read per the
   existing direct-entry-fallback order already documented), run the
   condensed Approach/Shape procedure inline (already described in
   SKILL.md's own Step 2/3 prose) and skip opening `references/
   approach-and-shape.md` and `references/split-and-child-specs.md`
   entirely for this lane. `references/verify-sync-and-gap.md` still
   applies (verify-sync is needed at every lane) — not skipped.
2. `.agents/skills/fgos-coding-validating/SKILL.md` + its own Bootstrap
   step — same shape: read `plan.md`'s `Mode:` line before opening any of
   its 3 reference files; for `tiny`/`small`, run a condensed inline
   reality check (a short concrete-case sanity list, not the full
   tier-A/B trigger walkthrough) and skip `references/gate-tier-a-b-
   triggers.md` — this is the file directly upstream of the engine's
   existing skip-and-advance call, so this is the highest-leverage single
   edit in the set.
3. `.agents/skills/fgos-coding-implement/SKILL.md` + its own Orient step —
   same shape, gated on `Mode:` tiny/small AND `plan.md`'s own recorded
   file list being small (skip `references/worker-contract-and-orient.md`'s
   full text, not `references/verify-commit-and-iron-law.md` or
   `references/return-mechanics.md` — verify/commit/return discipline
   applies at every lane, never skipped).
4. `.agents/skills/fgos-coding-driving/references/loop-mechanics.md` Step
   4/5 — no functional change needed (it already resolves and invokes
   whichever skill `skillForStage` names); add one line documenting that
   the skill it invokes may itself skip opening its own reference files
   per the lane, so a reader of this doc is not confused about where the
   skip actually happens.
5. `.agents/skills/fgos-routing/SKILL.md`'s Mode-gate section — correct
   the now-stale claim ("A genuine skip-load optimization... would need an
   actual routing-table change, which this decision does not make") to
   point at the mechanism actually landing in files 1-3 above, once they
   exist — avoids leaving a second copy of the same bug (an accurate
   description going stale the moment the fix lands) for a future
   discovery pass to re-find.

Each of these five docs is a `.claude/skills/**` *generated thin wrapper*
target — the real source lives under `.agents/skills/**` (confirmed
pattern seen live driving this same item: every skill loaded so far
prints "This is a generated thin wrapper... edit the source instead").
Edit the `.agents/skills/**` copies only; the `.claude/skills/**` mirrors
regenerate from them.

**Risk map:**

| Component | Risk | Proof point |
|---|---|---|
| Files 1-3 (skip logic added to 3 heavy skills) | standard | At validating: re-drive one real tiny-lane item end to end (a fresh `/fgOS:pick` on a genuinely tiny item, or a dry run against this same item's own eventual `executing` pass) and confirm the reference files named as skipped are in fact never Read in that session's tool-call log — a live behavioral check, not a `node --test` assertion, since the change is skill-prose, not code. This is the "weak proof around the area" flag named above, made concrete rather than left as a guess. |
| File 4 (driving-loop doc, doc-only) | light | No behavior change — read-through check that the added line is accurate is enough. |
| File 5 (fgos-routing prose correction) | light | Read-through check the corrected claim matches files 1-3's actual final shape once written — sequenced last on purpose so it can quote the real mechanism instead of a plan. |

Impact-analysis posture: **full** (`fgos tool query --capability
impact-analysis --status present` → GitNexus `present`, fresh this
session). Not leaned on for a blast-radius proof point here regardless —
every touched file is prose/markdown, outside GitNexus's code-graph
surface; noted per the capability gate's own instruction to record
posture next to any proof point that WOULD lean on it, even when, as
here, none does.

## Shape

No split — one coherent piece. The five files above are tightly coupled
(the skip only actually saves anything once every hop in the chain
applies it; landing 1-3 without 4-5 leaves the driving-loop doc and the
routing skill's own prose describing stale behavior) and none is
independently useful without the others, so materializing them as
separate work items would just recreate the "half-applied, no net saving"
failure mode named in the Approach section above.

Concrete cases worth proving against, at this mode's depth:
- A genuinely tiny item (mirrors tsk-1uf's own shape: 0 hard-gate flags,
  a couple of files, no gray areas) — the target case; confirm the
  skipped reference files are in fact not opened.
- A `standard`/`high-risk` item — confirm nothing regresses: the full
  reference chain must still load exactly as today, since the added
  check is lane-conditional, not a removal.
- An item that enters `fgos-coding-planning` directly (no prior lane in
  session context — the `fgos-coding-exploring`/`fgos-coding-validating`
  hand-back cases `bootstrap-and-lane.md`'s own "Direct-entry fallback"
  section names) — confirm the fallback derivation still runs in full
  (this path is never itself skipped, only the tiny/small reference-read
  it might conclude with).

## Verify

Every touched path is skill prose (`.agents/skills/**/SKILL.md` or its
`references/*.md`), so `docs/how-to/write-verify-for-a-skill-prose-change.md`
governs the shape here — read at this planning pass, per `fgos-coding-planning`'s
own `references/verify-sync-and-gap.md` pointer to it. `verify` proves the
deliverable exists and the stale claim is gone; it is never asked to prove
the prose gets interpreted correctly at runtime — that is `fgos-coding-
validating`'s reality check plus merge review, per the how-to doc's own
"Ranh giới" section. `npm run build:skills` is not part of this — no
skill's `name`/`description` frontmatter changes, the only thing that
generator regenerates.

```
npm test && \
grep -q 'skip opening references/approach-and-shape.md and references/split-and-child-specs.md' .agents/skills/fgos-coding-planning/SKILL.md && \
grep -q 'skip opening references/gate-tier-a-b-triggers.md' .agents/skills/fgos-coding-validating/SKILL.md && \
grep -q 'skip opening references/worker-contract-and-orient.md' .agents/skills/fgos-coding-implement/SKILL.md && \
grep -q 'invoked skill may itself skip opening its own reference files' .agents/skills/fgos-coding-driving/references/loop-mechanics.md && \
! grep -q 'which this decision does not make' .agents/skills/fgos-routing/SKILL.md && \
! git diff --name-only main...HEAD -- . | grep -q '^src/'
```

The four `grep -q` lines are the POSITIVE (each new deliverable pinned by
a long, distinctive phrase this plan itself commits to — pitfall #5 in
the how-to doc); the two `!`-prefixed lines are the NEGATIVE (the stale
`fgos-routing` claim is gone, and the diff never touched `src/`, proving
this landed as the prose-only fix this plan chose rather than an engine
change). The exact wording above is not a suggestion — whichever session
implements this should use these literal phrases (or edit this `plan.md`
first if a phrase turns out unworkable, before writing code around a
different one silently).

## Outstanding questions

None
