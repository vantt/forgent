# Cell P04.1 — Production Skill (Doer Report)

Phase: `plans/260905-architecture-advisory-panel/phase-04-production-skill-and-dialogue.md`
Cell: P04.1 — Production skill and projections.
Doer mechanism: single-agent authoring (no coordination session opened
for this cell — phase-04's own Cells text scopes P04.1 to
`core/skills/fgos-architecture-panel/SKILL.md` plus its generated
projections, not a new dogfood session).

## Condensation Judgment Call

The Phase 01 doctrine (four playbooks, ~4700 lines combined) had to
become one skill file that a fresh agent could operate well from,
without becoming a second copy of the doctrine. What I kept inline vs.
linked out:

**Kept inline, in full prose (not bullet-stub):**
- The nine-phase-to-real-graph mapping table (this is genuinely new
  content — it exists nowhere else, since the graph is P03.2's and the
  phases are Phase 01's, and nobody had joined them before this cell).
- One task packet per of the 9 roles: Notice / Reason / Evidence it
  seeks / When it changes position / Communicate uncertainty / Avoid.
  This is the phase's own explicit bar ("expected outputs alone are
  insufficient") — I paraphrased the doctrine's Purpose/Posture/What To
  Notice/Judgment Heuristics/Anti-Patterns sections into this compact
  shape rather than copying sentences, so each packet is ~12-18 lines
  instead of the doctrine's ~120-150 lines per role.
- The executor roster table with a one-sentence cognitive rationale per
  binding (not just names) — required by the phase text explicitly.
- The Decision Dialogue verb table, the human-turn recording mechanism
  tied to the real `human-turn` request-step type, and the Bounded
  Reopen Scope subsection (see "Real design judgment" below).
- Known Gaps: `tsk-44p`, `tsk-3xk`, the doctrine-by-path failure (now a
  hard requirement per phase-04's own instruction, since it failed
  identically twice), the example-name-collision risk, and the bwrap
  runnability limitation.

**Linked out, not restated:**
- The full worked Good/Bad Example prose per role (the doctrine's own
  ~250-350 lines/role of good/bad examples) — I cited or paraphrased one
  concrete real-precedent sentence per role packet instead (e.g. the
  Lead Advisor packet cites P01.3's actual `interpretation.md` phrasing
  style rather than re-quoting the doctrine's synthetic vnflow example).
- The complete BOUNDS section (condensed to 7 one-line items, full text
  stays in the coordinator prompt).
- The full artifact-template shapes (18 templates) — cited by name and
  path; this skill reuses their filenames unchanged rather than
  reproducing their internal structure.
- The 12-dimension evaluation rubric — referenced, not reproduced; it is
  a review-time instrument, not an operating instruction.

Result: 411 lines (`core/skills/fgos-architecture-panel/SKILL.md`),
versus `fgos-code-panel`'s 287 lines for a 3-role panel with no dialogue
— proportionate given roughly 3x the roles and an entirely new Decision
Dialogue mechanism `fgos-code-panel` has no equivalent of, and far under
the "4000-line" ceiling phase-04 explicitly warned against.

## Real Design Judgment Found While Writing (not assumed up front)

Cross-referencing the manual playbook's Phase 9 (which can reopen Phase
3/5/6/7 with a fresh dispatch) against P03.2's actual shipped graph
(`architecture-advisory-panel-v1.yaml`'s `phase-dialogue-reopen` node)
surfaced a real gap between the two: the registered protocol has **no
backward edge** to `phase-shaping`/`phase-critique` at all — only
`revise-synthesis`/`revise-explanation`/`close-dialogue` exist as
reopen operations. A naive skill would either (a) silently promise the
manual playbook's full reopen power and fail when a person's turn
genuinely needs a fresh shaper dispatch, or (b) refuse to have an
opinion about what happens when that class of turn arrives.

I resolved it explicitly in the skill's own "Bounded Reopen Scope"
subsection: `revise-synthesis` is the mechanism for every reopen class
(new context, alternative request, composition request), integrating
from the existing ledger plus the human turn's own content; if that
integration genuinely cannot substitute for a fresh independent shaper
pass, the task prose says so in `dialogue/<n>-response.md` and opens a
**new cell** rather than fabricating a shaper's voice inside
`revise-synthesis`. This is named as a deliberate V1 boundary in Known
Gaps, not hidden.

## Requirement-By-Requirement Disposition

- **Raw intent entry, no problem brief, no protocol id from the
  person.** "What This Skill Does Not Require Of The Person" section,
  citing P01.3's real raw CASE string and P01.2/P01.3's real
  zero-question outcomes as evidence this already works, not aspiration.
- **Doctrine carried, not link-only.** "Per-Role Task Packets" (9 full
  packets), "Lead Advisor Discipline", "Debate And Synthesis
  Discipline", "Decision Dialogue" sections — all real operating
  content, not a table of contents pointing elsewhere.
- **Per-role packets beyond expected outputs.** Every packet has all 6
  required dimensions (notice/reason/evidence/change-position/
  uncertainty/avoid) — none reduced to only "produces X".
- **Executor roster with cognitive rationale, never one collapsed
  provider, never `actors[].model`.** "Executor Roster, With Cognitive
  Rationale" table + explicit "Reporting rule, not optional" paragraph
  citing P02.1's confirmation `ACTOR_FIELDS` has no `model` field.
- **Lead advisor discipline, evidenced not aspirational.** Cites
  `proofs/P01.3/decision-request.md` directly by path as the real
  worked precedent for "no question sent, here's why."
- **Debate/synthesis discipline, evidenced not aspirational.** Cites
  P01.2's and P01.3's real critique counts, conceded attacks, and
  independently-re-verified critic attacks (scheduler deadlock,
  alert-cap severity) by path.
- **Decision Dialogue verbs.** Table maps all 6 phase-04-named verbs
  (clarify/challenge/introduce-context/request-alternative/
  request-composition/decide) to concrete engine-authorized actions,
  plus the human-turn recording mechanism tied to the real
  `recordHumanTurn` door and the "explain impact before reopening"
  rule.
- **Fresh-session resume.** "Fresh-Session Resume" section names the
  orientation packet in reading order, starting with
  `fgos coordination show --json` as the hard, replay-derived source of
  truth (not just prose files), then the artifact-template tree.
- **Never reimplements kernel behavior.** "Never Reimplements The
  Kernel" section, up front, naming exactly which existing doors
  (`fgos-group-thinking`'s gate, `fgos coordination show`, `human-turn`
  step, `authorizeSpecialistSlot` for the one named gap) this skill's
  task prose invokes.
- **Known Gaps named with workarounds**, same discipline as
  `fgos-code-panel`'s `tsk-371` section: `tsk-44p`, `tsk-3xk`, the
  doctrine-by-path requirement, the example-name-collision check, the
  bounded-reopen-scope boundary, the bwrap-runnability limitation.
- **P04.2 scope not built here.** "Out Of Scope For This Skill" section
  names exactly what is deferred (example families, the how-to doc, the
  heterogeneous/homogeneous worked pair) and does not narrate any
  scenario end to end.

## Build:skills Output

```
assembled .agents/skills/fgos-architecture-panel
...
wrote .claude/skills/fgos-architecture-panel/SKILL.md
...
mirrored plugins/fgOS/skills/fgos-architecture-panel
...
19 skill wrapper(s) generated.
19 plugin dev-skill(s) mirrored.
```

Diffed all three projections against the `core/skills/` source directly
(not trusting the build log alone):

- `core/skills/fgos-architecture-panel/SKILL.md` vs
  `.agents/skills/fgos-architecture-panel/SKILL.md` — byte-identical.
- `.agents/skills/fgos-architecture-panel/SKILL.md` vs
  `plugins/fgOS/skills/fgos-architecture-panel/SKILL.md` —
  byte-identical.
- `.claude/skills/fgos-architecture-panel/SKILL.md` — confirmed a
  genuinely thin generated wrapper (frontmatter copied verbatim, body
  replaced with a 3-line read-and-follow redirect to
  `.agents/skills/fgos-architecture-panel/SKILL.md`), never a stale full
  copy.

No file under `.agents/`, `.claude/`, or `plugins/fgOS/skills/` was
hand-edited — only `core/skills/fgos-architecture-panel/SKILL.md` was
authored directly, then `npm run build:skills` produced the rest.

## Projection Tests

`node --test test/setup/skill-wrappers.test.mjs test/skills/fgos-mirror.test.mjs`:
**39/39 pass, 0 fail** — including the drift guard
("assembleSkills output matches the committed `.agents/skills`
byte-for-byte"), the wrapper-genuinely-thin check, the
`.agents`/`.claude` name-parity check, and the `.agents`/plugin
byte-identical mirror check, all now covering the new skill.

## Focused Coordination Suite (sanity check — this cell touches no kernel/protocol code)

```
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test \
  'test/runner/coordination-*.test.mjs' \
  'test/verbs/coordination-*.test.mjs' \
  'test/cli/coordination.test.mjs' \
  'test/architecture.test.mjs'
```

**757 tests, 757 pass, 0 fail** — exactly P03.2's own end state
(756 → 757 after its fix round). No regression, as expected: this cell
added one markdown file plus its generated projections, nothing under
`src/`, `core/coordination-protocols/`, or `test/`.

## Relative Links

Checked all 15 relative markdown links in
`core/skills/fgos-architecture-panel/SKILL.md` resolve to real files
(script-verified, not eyeballed) — all 15 OK (the four Phase 01
playbooks, P00.1/P01.2/P01.3/P02.1/P03.2 verification docs, the two real
P01.3 evidence files cited by path, and the sibling
`fgos-group-thinking`/protocol YAML sources).

## CHANGELOG

Added one `## [Unreleased]` bullet under `### Added`, matching the
`fgos-code-panel` entry's own level of detail (mechanism, roster
rationale, the two named request-schema gaps, the bounded-reopen-scope
boundary, explicit P04.2 scope pointer).

## Deliberately Left For P04.2

- Example families (clear start, unclear start, clarification/challenge,
  material-context reopen, alternative/composite reopen, final
  decision/defer) — none narrated here, only the mechanism each must
  demonstrate.
- `docs/how-to/use-fgos-architecture-panel.md`.
- The heterogeneous-vs-homogeneous-roster worked pair.
- Proving whether `fgos-group-thinking` + `fgos coordination run/show`
  already provides the required entry/resume path, or whether a new
  use-case/CLI verb is warranted — phase-04 assigns that investigation
  to P04.2 explicitly, not this cell.

## Commit

`11df9802` on `group-thinking-plan-loop` — one commit, 5 files
(`CHANGELOG.md`, `core/skills/fgos-architecture-panel/SKILL.md`, and its
three generated projections).

---

Status: DONE
Summary: Authored `core/skills/fgos-architecture-panel/SKILL.md` (411
lines) projecting Phase 01's 9-role advisory doctrine onto the real
`architecture-advisory-panel-v1` protocol, built and byte-diff-verified
all three projections, confirmed 39/39 projection tests and 757/757
focused coordination tests pass (no regression), verified all 15
relative links, added the CHANGELOG entry, and committed. Found and
documented a real, previously-undocumented scope gap (no backward graph
edge for Phase 5/6 reopen) as a named V1 boundary rather than either
overpromising or ignoring it.
Concerns/Blockers: none — the two upstream request-schema gaps
(`tsk-44p`, `tsk-3xk`) are pre-existing and already filed; this skill
documents concrete workarounds for both rather than blocking on them.
