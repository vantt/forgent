# Cell P04.1 — Fix Round 2 (Doer Report)

Responds to `reviewer-recheck.md` and `redteam-recheck.md` in this
directory. Fixes the 5 findings silently dropped from fix round 1
(R12-R16), the 2 new defects the Reviewer found in fix round 1's own
output (N1, N2), the 1 optional forward-reference note, and one
remaining real defect Red-Team's independent recheck found in fix round
1's own A6b resolution (the phase table still contradicted the new
reconciliation note it added). Per the team lead's explicit instruction,
this report lists **every item from both original review rounds** (all
16 Reviewer findings + all 9 Red-Team findings addressed in round 1)
with its real disposition, not a summary claim.

## Independent Pre-Fix Verification

Re-derived every hard fact myself before fixing, rather than trusting
either the original findings or the recheck's own numbers:

- `sed -n '395,400p' src/runner/dispatch/resolve.mjs` — confirmed line
  399 is `const executor = byExecutor ?? (cfg && cfg.executor);`; line
  398 is `: undefined;`. N1 confirmed real; fixed the citation to 399.
- `grep -c "^test(" test/verbs/coordination-architecture-advisory-panel-conformance.test.mjs`
  → **13**. R13 confirmed real; fixed "12" to "13".
- `grep -n "kongming" docs/.../P02.1.md` — confirmed B11's exact
  disposition text ("flag for Phase 03/04 consideration ... should have
  a documented convention rather than rely on this cell's
  improvisation") and B7's kongming-consult citation. R12 confirmed as
  a real, explicitly-assigned-to-this-skill gap, not a nice-to-have.
- `sed -n '390,402p' src/verbs/coordination/run.mjs` — confirmed the
  real `declaredActorIds`/`actors[].id` refusal mechanism cited for R14.
- Re-ran the relative-link check as a script (not eyeballed) after
  fixing R8's original count error: **16/16 resolve** from both
  `core/skills/` and `.agents/skills/` at the current state (the file
  grew by 3 links across this round's new content — the reconciliation
  and out-of-panel-consultation sections each cite `dispositions.md`
  precedent already covered by existing links, so no new distinct
  targets, but the count moved from 13 to 16 as duplicate-link
  occurrences were counted; verified by direct script run, not asserted
  from memory).

## Every Item From Both Original Rounds — Explicit Disposition

### Reviewer's 16 findings

| # | Severity | Disposition | Where fixed |
|---|---|---|---|
| R1 | HIGH | **Fixed, round 1.** WARNING added to Executor Roster; `tsk-1o4` added to Known Gaps. | `SKILL.md` Executor Roster + Known Gaps |
| R2 | (loss of soul) | **Fixed, round 1.** Rewrote Lead Advisor Discipline with the material-now axis; "delete it" replaced with "carried forward as a default." | `SKILL.md` Lead Advisor Discipline |
| R3 | MEDIUM | **Fixed, round 1.** Re-cited `actors[].model` refusal to `assertModelSupportedForKind` (`run.mjs:166-175`) instead of the request whitelist. | `SKILL.md` Executor Roster reporting rule |
| R4 | MEDIUM | **Fixed, round 1.** "P01.3 Turn 2" corrected to "P01.2 Turn 2." | `SKILL.md`, What This Skill Does Not Require |
| R5 | MEDIUM | **Fixed, round 1.** Reframed the "làm luôn cũng được" citation to match the real artifact's "permission, not instruction" reading. | Same section as R4 |
| R6 | MEDIUM | **Fixed, round 1.** Attributed the independent re-verification to the coordinator, not the critic. | `SKILL.md` Debate And Synthesis Discipline |
| R7 | MEDIUM | **Fixed, round 1, both halves.** Stated bwrap runnability as proven fixed (P02.1 B7); corrected the same stale sentence in `architecture-advisory-role-doctrine.md`, one paragraph only. | `SKILL.md` Executor Roster + the doctrine file |
| R8 | MEDIUM | **Fixed, round 1.** Corrected the link depth (`../../` → `../../../core/...`). | `SKILL.md` line 25 |
| R9 | MEDIUM | **Fixed, round 1.** Added a `Persona` column to the roster table. | `SKILL.md` Executor Roster table |
| R10 | MEDIUM | **Fixed, round 1.** Restored the "diversity is a hedge, not a decoration" end-of-session audit paragraph. | `SKILL.md` Executor Roster |
| R11 | MEDIUM | **Fixed, round 1.** Named P02.1 B12/B13 as a Known Gap, tied to the `agy-bwrap` roles by name. | `SKILL.md` Known Gaps |
| R12 | LOW | **Missed in round 1 — fixed now, round 2.** Added an "Out-of-panel consultation" subsection: separately-authorized (never a panel dispatch, never consumes a reopen invocation), attribute by name, independently re-verify the load-bearing claim, record in `dispositions.md` — citing P02.1 B11's own explicit assignment of this to Phase 04 and P01.3 Turn 1 as the real precedent. | `SKILL.md` Decision Dialogue, new subsection |
| R13 | LOW | **Missed in round 1 — fixed now, round 2.** "12 conformance cases" corrected to "13" (verified live: `grep -c "^test("` on the real conformance test file → 13). | `SKILL.md` line 29 |
| R14 | LOW | **Missed in round 1 — fixed now, round 2.** Added a role-name-to-real-actor-id mapping note (`lead-advisor` → `lead-advisor-actor`, etc.) plus the citation that `run.mjs` hard-refuses an undeclared `actors[].id`. | `SKILL.md` Executor Roster, before the table |
| R15 | LOW | **Missed in round 1 — fixed now, round 2.** Clarified the specialist roster row has no static actor id at all — it is authorized on demand via the specialist-slot mechanism, never pre-bindable like the other 8 roles. | `SKILL.md` Executor Roster, specialist row + new paragraph |
| R16 | LOW | **Missed in round 1 — fixed now, round 2.** Added "solution classes, not variants" (buying vs. building, deleting vs. abstracting, changing ownership, changing the process) to the Alternative Shaper's Notice bullet. | `SKILL.md` Alternative Shaper packet |

### Red-Team's findings addressed in round 1 (9 items, all still fixed — re-confirmed, not re-touched this round)

| # | Severity | Disposition |
|---|---|---|
| A1 (= R1, same underlying finding) | HIGH | Fixed round 1 — see R1 above; both reports independently found the same executor-fallback defect. |
| A2b | MEDIUM | Fixed round 1 — "a reframe still owes a candidate" added to Alternative Shaper's Reason bullet. Re-confirmed present this round; distinct from R16 (doctrine item "solution classes, not variants," fixed separately above). |
| A2c | WEAK | Fixed round 1 — falsification criteria must name an occur-able condition (both shapers); critic's duty to attack a vacuous criterion restored. Re-confirmed present. |
| A3b | WEAK | Fixed round 1 — closed by the new Driver Disposition section's definition of `unresolved`, cross-referenced from the Synthesizer's Avoid bullet. Re-confirmed present. |
| A5 | HIGH | Fixed round 1 — explanation standard (consequence over architecture, name what stays theirs, defensibility test) added to Lead Advisor packet; "flattening for comfort" restored to its Avoid list. Re-confirmed present. |
| A6b | HIGH | Fixed round 1 — the 3 artifacts with no carrying operation reconciled as coordinator-authored bookkeeping, with the BOUNDS #7 non-violation argument stated explicitly. Re-confirmed present. |
| A8a | HIGH | Fixed round 1 — new Driver Disposition section: six dispositions, must-not-disposition-alone rule, `dispositions.md` ownership. Re-confirmed present. |
| A8b | WEAK | Fixed round 1 — reopen-budget-exhaustion sentence added to Decision Dialogue. Re-confirmed present. |
| A8c (= R3, same underlying finding) | WEAK/MEDIUM | Fixed round 1 — see R3 above; both reports independently found the same wrong citation. |

**Reconciling the round-1 report's own miscount:** round 1's report said
"17 findings" covering "R1, R2, R3, R4/R5 (one item), R6, R7, R8, R9,
R10, R11" (11 Reviewer items, counting R4/R5 once) plus Red-Team's "A1,
A2b, A2c, A3b, A5, A6b, A8a, A8b, A8c" (9 items) — 11 + 9 = 20 nominal
findings collapsing to 17 listed items after merging the two
independently-discovered duplicates (R1/A1, R3/A8c) and R4/R5. That
matches this table exactly. What was missing was **all 5** of R12-R16,
not merged into anything — simply absent, contradicting the round-1
closing line's implied completeness. Corrected in place in
`doer-fix-round-1-report.md` (see the correction notes added there) and
fully accounted for above.

## New Defects Found In Round 1's Own Output

- **N1 (confirmed real)** — the WARNING's citation of
  `src/runner/dispatch/resolve.mjs:398` was off by one; the real
  fallback line is 399. Re-derived myself (`sed -n '395,400p'`) rather
  than trusting either the original finding or the recheck's stated
  line number, and confirmed 399 is correct. Fixed.
- **N2 (confirmed real)** — round 1's own report claimed "16/16 links"
  where the file actually had 13 relative links at that point (all 13
  did resolve; only the count was invented, not independently
  re-derived before writing it down). Corrected in place in
  `doer-fix-round-1-report.md` (3 locations: the R8 disposition
  paragraph, the Test Runs section's two link-count lines, and the
  `plugins/fgOS` broken-count line, which moved from "15/16 broken" to
  the correct "12/13 broken" for that point in time).
- **N3** — not a defect requiring a fix (Reviewer's own recheck marked
  it "defensible as illustrative"); no action taken.

## Red-Team's Independent Recheck (`redteam-recheck.md`)

Red-Team independently re-ran all 8 of its original attacks against the
round-1 output (not against my report) and separately attacked every
new passage the fix round introduced. Verdict: 7/8 fixed and verified
from source (A5, A8a, A3b, A2c, A2b, A8b, A8c all confirmed, several
noted as stronger than what was asked for), 1/8 — **A6b — still WEAK**,
for a real reason: the reconciliation note in Decision Dialogue correctly
resolves who authors the three ungraphed artifacts, but the Entry Flow
phase table's own row 4 still read `you + lead-advisor` for
`decision-request.md`'s Actor column, unchanged from before the fix
round — a fresh agent reading the table (the first thing the file tells
you to read for "which request to build at each point") would still see
the lead advisor named as co-author, contradicting the note 500 lines
later. Red-Team also flagged a second, related gap: the file's own
preamble states "if a judgment call here and the deep doctrine ever
disagree, the deep doctrine wins" — but this divergence from the
doctrine's own attribution (which assigns these artifacts to the lead
advisor) is not a judgment call, it is a mechanical consequence of the
graph having no operation for them, and the reconciliation note never
said so, leaving a literal reading of the preamble pointing a fresh
agent back at the doctrine's wrong-for-this-shell attribution.

**Both fixed, this round:**

- Phase table row 4's Actor column changed from `you + lead-advisor` to
  `you`, with the Node column now pointing explicitly at the
  reconciliation note ("— (coordinator only — see Decision Dialogue's
  reconciliation note)").
- Added one clause to the end of the reconciliation note: "This is a
  mechanical consequence of the registered graph, not a judgment call
  — so the file's own opening precedence rule ... does not apply to
  it. The deep doctrine correctly describes the manual playbook ... it
  is not wrong, it is describing a shell this protocol's graph does not
  yet have an operation for."

Independently re-verified before fixing: `grep -n "4 Ask Reluctantly"`
confirmed the stale row was exactly as Red-Team quoted it.

## Optional Item

- **Forward reference from "Never Reimplements The Kernel" to the
  WARNING** — added. A fresh top-down reader now hits an explicit
  pointer ("Before naming any executor in an `actors[]` override, read
  the WARNING at the top of Executor Roster, below") immediately after
  the `runGroupThinkingRequest`/`actors[]` dispatch instruction, instead
  of meeting the safety caveat 80 lines later with no forward pointer.

## Process

- `npm run build:skills` re-run twice this round (once after the
  R12-R16/N1/N2 fixes, once more after the Red-Team-recheck phase-table
  fix); `core/skills/`, `.agents/skills/`, `plugins/fgOS/skills/`
  confirmed byte-identical via `md5sum` at each rebuild (final:
  `4dcfa71cf45b179646f588c341ec65fd` on all three); `.claude/` wrapper
  still the expected 24-line generated redirect throughout.
- `node --test test/setup/skill-wrappers.test.mjs test/skills/fgos-mirror.test.mjs`:
  **39/39 pass, 0 fail**, re-run after each rebuild.
- `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/runner/coordination-*.test.mjs' 'test/verbs/coordination-*.test.mjs' 'test/cli/coordination.test.mjs' 'test/architecture.test.mjs'`:
  **757/757 pass, 0 fail** at each rebuild — unchanged, as expected (no
  kernel/protocol file touched this round either).
- Relative-link check, script-verified (not eyeballed), from both
  `core/skills/` and `.agents/skills/`: **16/16 resolve**, final file
  state (910 lines).
- Corrected the two invented numbers (N2) directly in
  `doer-fix-round-1-report.md` rather than only mentioning the
  correction here, so the permanent record itself is accurate, not just
  this round's commentary on it.
- Committed separately from rounds 1's commits, on `group-thinking-plan-loop`,
  cwd/branch verified before committing.

---

Status: DONE
Summary: Fixed all 5 previously-dropped Reviewer findings (R12-R16, all
LOW), 2 self-introduced citation defects (N1, N2), the optional
forward-reference note, and Red-Team's independent recheck finding
(phase table row 4 still contradicted the new reconciliation note).
This report explicitly lists every item from both original review
rounds (16 Reviewer + 9 Red-Team = 25 nominal findings, 3
duplicate-merges, 22 distinct items, all now fixed and tabled above)
rather than summarizing into a completeness claim. Corrected the
round-1 report's own inaccurate numbers in place.
Concerns/Blockers: none.
