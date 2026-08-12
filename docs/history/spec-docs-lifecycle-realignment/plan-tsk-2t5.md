# plan-tsk-2t5.md — docs/specs/runner.md lifecycle rewrite (child of tsk-5eq)

Mode: standard

Flag count: 2 of 10 — **public contracts** (docs/specs/ is this repo's own
state layer; AGENTS.md's Definition-of-done question 1 sends every stranger
agent through docs/specs/reading-map.md into an area spec, and runner.md IS the
runner area's spec), **weak proof around the area** (nothing under test/ reads
this file's prose — see Proof surface below, which corrects the parent plan on
this point). No hard-gate flag applies (no auth, no data loss, no
audit/security, no external provider, no removed validation), so this is not
high-risk; it is not one yes/no question, so not a spike. It is above small
because the file is 1043 lines with 42 stale anchors across six sections, and
the two sweep sections describe a runner behavior that did not merely get
RENAMED — it was replaced (see D-local-1).

No CONTEXT.md exists for this feature: tsk-5eq reached planning on a clear
discovery verdict (discovery -> planning, skipping exploring), so no Socratic
lock ever ran. The locked source for this child is the parent's own plan.md
(the one rewrite rule) plus RESEARCH.md round 1, both in this same folder.
Every rewrite below cites one of them, or a path:line read directly at plan
time.

impact-analysis: **not applicable to this item's proof points** — the footprint
is one Markdown file with no code symbols, so nothing below leans on
blast-radius evidence. Not run.

## Scope

One file: docs/specs/runner.md. Siblings own work-state.md, the four small
specs, the non-spec end-user docs, docs/backlog.md, docs/distribution-vision.md
and CHANGELOG.md. No file outside this child's own footprint is touched, per
the parent's own "no child may edit another's file to keep them in sync" case.

## D-local-1 — the two sweep sections are a REWRITE, not a rename

The parent's vocabulary table maps stale names to correct names. Necessary, but
not sufficient here: src/runner/loop.mjs, src/intake/discovery.mjs and
src/intake/plan.mjs (all read directly at plan time) show the runner's
pre-dispatch behavior was **replaced**, not renamed.

| What the spec said | What the code does today | Evidence |
|---|---|---|
| The clarify sweep calls the discovery ENGINE inline for every stage-clarify + todo item, costing one real model call per item | There is no clarify sweep. A discovery-dispatch sweep gives every stage-discovery + todo item to a real worker — the same worktree/spawn pair executing uses, with a stage-specific prompt template — then gates the move on the worker's own clear/unclear block through resolveDiscovery | loop.mjs:1108-1216; dispatch.mjs:111,149,152; prompt-templates.mjs:36 |
| A clear verdict advances to decompose | Clear goes to planning directly, skipping exploring; unclear goes to exploring AND parks in awaiting-human with the question | discovery.mjs:159-162,455-470; workflow-stage-graphs.mjs:147,153 |
| The decompose sweep scans stage-decompose, calls resolveDecompose, and makes a real model call per item | The plan sweep scans stageForStep(domain,'Divide') (= planning) plus the legacy decompose alias, and calls resolvePlan — which, with no caller verdict, either advances a plan-declared tiny/small item straight through, or (role runner) safely does nothing. No model call happens in this sweep at all | loop.mjs:1232-1250; plan.mjs:476,586-615 |
| The retry-on-unreadable-verdict story (judge-executor.mjs, one retry with a stricter prompt) | src/intake/judge-executor.mjs no longer exists; judgeDiscovery/judgeDecompose are retired — an absent or malformed verdict hits the runner no-op fail-safe and the item is left exactly where it was | src/intake/ listing; discovery.mjs:228,296,388-395; plan.mjs:604-608 |

A pure find-and-replace of stage names would leave every one of those rows
wrong in a NEW way — a reader would still believe the runner burns a model call
per front-stage item every tick. So the two sweep sections were rewritten from
the code's real behavior, and their Business Rules (RUL14/RUL17) and Edge Cases
follow that rewrite rather than being renamed in place.

## D-local-2 — exploring gets a named absence, not silence

The runner sweeps discovery and planning and never exploring (loop.mjs has no
exploring branch at all). That is deliberate: exploring is the machine+human
decision-lock, so the autonomous loop must leave it to a live session. The
rewrite says this outright — a spec that lists two of the three front stages
leaves a stranger guessing whether the third was forgotten.

## D-local-3 — the entropy signal is described by intent, not by either literal

src/report/entropy.mjs on main still counts w.stage === 'clarify' under the
label stage-clarify. My first pass recorded that as an Open Gaps divergence,
since clarify is retired and the count is therefore always zero on this branch.
That was withdrawn: sibling item tsk-2t3 (awaiting-approval, unmerged, which is
the only reason this branch cannot see it) already replaces the literal with
`w.stage === domain.stages[0]` resolved per item's OWN domain and relabels the
signal stage-entry. Verified directly with
`git diff main..fgw/tsk-2t3 -- src/report/entropy.mjs`.

So a gap row would be true today and false the moment both branches merge —
exactly the defect class this whole family exists to remove. The spec instead
describes the signal by what it is FOR ("item còn đọng ở stage đầu vòng của
domain của chính nó"), which is BA-grade, names neither retired nor incoming
literal, and stays true across the merge in either order.

## What changed, anchor by anchor

| Anchor | Change |
|---|---|
| frontmatter updated | 2026-07-28 to 2026-08-12 |
| frontmatter sources | appended spec-docs-lifecycle-realignment. Existing slugs left byte-for-byte: stage-clarify, stage-decompose-s1/s2, phase-3-compound-learning-* are feature slugs, not stage names (parent plan, "Never rewrite a sources frontmatter slug") |
| Entry points (2 bullets) | the two sweeps under their real names and order — the research sweep (stage discovery), then the plan sweep (stage planning plus legacy alias) |
| Data Dictionary #4b | claim-release phases to the live front-stage names, drain-only decompose kept visible |
| the old clarify-sweep section, now the research-dispatch section | rewritten per D-local-1, plus D-local-2's named absence and the two never-advance fail-safes (no commit / no readable verdict) |
| the plan-sweep section | rewritten per D-local-1: no model call, drain-only alias explained, claim-release wording widened |
| evolve --submit | the entry stage is the domain's own first stage (discovery for coding), matching bin/fgos.mjs:934-935; its lifecycle line renamed to the research sweep |
| entropy signal | described by intent per D-local-3 — the domain's own entry stage, naming neither the retired nor the incoming literal |
| P50 skill map | stage-to-skill map corrected to the registry's real rows, incl. fgos-coding-validating having no skillMap entry of its own |
| RUL14, RUL17 | rewritten to the two real sweeps |
| RUL15, RUL29, RUL45 | stage names only; the rules themselves unchanged |
| Edge Cases (6 rows) | the chain clarify -> decompose -> executing becomes discovery -> planning -> executing; the two "model returns garbage" rows replaced with what actually fails today (worker crash / no commit; and "no model call happens here at all") |
| Pointers | loop.mjs's sweep description, captureDiscoveredWork's stamped stage, discovery.mjs, plan.mjs (renamed from decompose.mjs); the judge-executor.mjs pointer is GONE — replaced by the discovery prompt template that took its place |
| Pointers (skills) | added fgos-coding-discovering; corrected the stage label on exploring/planning/validating |
| Open Gaps | unchanged — the row this item briefly added was withdrawn, see D-local-3 |

Left alone on purpose: the dated 2026-07-20 case-study paragraph (historical
narration of one real run), every sources slug, and every feature-slug decision
citation.

## Risk map

| Component | Risk | Proof point |
|---|---|---|
| Deleting a decompose mention that is legitimate drain-only-alias documentation | **medium** | The rewritten plan-sweep section still names decompose as a drain-only legacy alias, because loop.mjs:1244 and plan.mjs:518 really do still sweep it and live items still sit there. A rewrite that erased every decompose would be wrong even though it would pass a naive grep. Carried to fgos-coding-validating. |
| Rewriting a sources feature slug or the dated case-study | **medium** | Both on the do-not-touch list above; both re-read after the edit. Carried to fgos-coding-validating. |
| Describing the sweeps from the OLD spec instead of the code | **medium** | Every claim in the two rewritten sections traces to a loop.mjs/dispatch.mjs/discovery.mjs/plan.mjs line read at plan time (D-local-1 table). Carried to fgos-coding-validating. |
| An Edge Case claiming e2e proof that does not exist | **medium** | The e2e names were read directly (test/e2e/runner-loop.test.mjs): three "e2e stage-discovery" tests back the new rows, and the surviving stage-clarify tests assert --once now safely no-ops on such an item — so the "one --once takes it from clarify to awaiting-approval" claim was replaced, not renamed. |
| npm test regression | low | First clause of the verify. |

## Proof surface

The item's own verify, unchanged — every clause confirmed RED on this branch
before any edit (both headings present, the stage-planning phrase absent):

```
npm test && ! grep -q 'Quét làm-rõ trước dispatch (clarify sweep)' docs/specs/runner.md && ! grep -q 'Quét chia-việc trước dispatch (decompose sweep)' docs/specs/runner.md && grep -q 'stage `planning`' docs/specs/runner.md
```

**Correction to the parent plan.** The parent's risk map says npm test covers
this file via scripts/check-decision-citation-drift.mjs. It does not:
package.json:24 defines test as `node --test 'test/**/*.test.mjs'`, which never
runs that script, and no file under test/ reads docs/specs/runner.md's prose
(test/skills/fgos-mirror.test.mjs:7 only mentions the path inside a comment).
npm test is a regression guard here, never evidence that this item's own work is
right — the grep clauses are the only mechanical proof, and a human read of the
two rewritten sections is what actually judges them.

## Cases worth proving against

- **Boundary — legitimate legacy survives.** decompose still appears, described
  as a drain-only alias the plan sweep still drains.
- **Boundary — feature slugs survive.** stage-clarify / stage-decompose-s1 /
  stage-decompose-s2 stay in sources untouched.
- **Existing behavior must not regress.** npm test stays green (it cannot go
  red from prose, but a green run rules out an accidental non-Markdown edit).
- **Partial completion is acceptable.** Siblings merge independently; a briefly
  mixed spec tree is the point of the split.

## Assumptions

- **A1** — Vietnamese, BA-grade, tech-agnostic, matching this file's existing
  voice (AGENTS.md, "Before touching code"). Inherited from the parent's A1.
- **A2** — sources gains spec-docs-lifecycle-realignment; decisions is left
  alone (no new decision record for this item).
- **A3** — Section headings may change wording, since the item's own verify
  demands the two old headings be gone. A repo-wide grep at implementation time
  confirmed nothing links to either heading by anchor.

## Outstanding questions

None
