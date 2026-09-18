# Cell P04.1 — Fix Round 1 (Doer Report)

Responds to `reviewer-report.md`/`reviewer-findings.json` and
`redteam-report.md`/`redteam-findings.json` in this directory. 17 items
in the team lead's priority order, each independently re-verified
against live source/config before fixing (not taken on the reviewer's
or red-team's word alone), per this repo's own Verified Decisions
discipline.

## Independent Pre-Fix Verification

Before editing anything, re-ran the two claims the team lead flagged as
independently confirmed, plus every citation-accuracy finding, myself:

- `node src/runner/dispatch.mjs decide claude-bwrap|agy-bwrap|codex-readonly --has-live-task-access` → `{"mechanism":"out-of-process","configured":false}` for all three, live registry (`.fgos/config.json`'s `executors` map) empty. Confirmed R1/A1 real.
- Read `src/runner/dispatch/resolve.mjs:398` (`const executor = byExecutor ?? (cfg && cfg.executor)`) and `.fgos/config.json`'s `runner.executor` — confirmed the fallback really is `claude -p ... --permission-mode acceptEdits --allowedTools Bash(git add:*),Bash(git commit:*),...`.
- `grep -n "ACTOR_ALLOWED_KEYS" src/verbs/coordination/schema.mjs` → line 133, includes `'model'`. Read `run.mjs:166-175` (`assertModelSupportedForKind`) — confirmed this, not the whitelist, is the real refusal, scoped to `kind:"declared-protocol"`. Confirmed R3/A8c real.
- `grep -rl "làm luôn" docs/.../proofs/` → only `P01.2/*` paths; `ls proofs/P01.3/human/ proofs/P01.3/dialogue/` → exactly one turn (`1-person.md`, `1-impact.md`, `1-response.md`). Confirmed R4 real.
- Read `proofs/P01.2/dialogue/2-impact.md:70` — confirmed the exact "permission, not instruction ... I don't want the panel recording this as 'the person decided to build'" quote. Confirmed R5 real.
- `grep -rn "tsk-1o4"` — confirmed filed at P02.1 as BL2, already a real, citable item id.
- Confirmed the dead-link mechanism (R8) and the `plugins/fgOS/` breakage's pre-existing status by reproducing it against `fgos-code-panel`'s own plugin projection (4/4 links also broken there — same pattern, not new).

All findings held under independent re-verification. No pushback needed
on any of the 17.

## Disposition, Item By Item

1. **R1/A1 (HIGH, executor fallback)** — `accepted`. Added a WARNING
   callout at the top of Executor Roster naming the exact live
   `configured:false` result, the exact fallback line and file, the
   exact live mutating-invocation string, and the required
   direct-process-invocation workaround until `tsk-1o4` lands. Added
   `tsk-1o4` to Known Gaps as its own entry, first in the list.
2. **A5 (HIGH, explanation standard absent)** — `accepted`. Added a
   dedicated bullet to the Lead Advisor packet naming the
   consequence-over-architecture contrast pair, "name the part that
   stays theirs" as an explicit decision (never a disclaimer), and the
   defensibility test. Restored "flattening for comfort" to that role's
   Avoid list, worded to match the doctrine's own severity ("the single
   most damaging thing this role can do").
3. **A6b (HIGH, 3 artifacts no operation carries)** — `accepted`,
   resolved by naming them explicitly as coordinator-authored
   bookkeeping (the team lead's option A), not by routing through
   `revise-explanation`. Reasoning for picking option A over B: only
   `dialogue/<n>-impact.md` is even topologically reachable via
   `revise-explanation` (Phase 4's `decision-request.md` occurs before
   `phase-shaping`, nowhere near `phase-dialogue-reopen`); and forcing a
   `clarify` turn's response through `revise-explanation` would silently
   break the Decision Dialogue table's own "clarify consumes no reopen
   cycle" rule. Added the full reconciliation paragraph to Decision
   Dialogue explaining why this is not a BOUNDS #7 violation (BOUNDS #7
   forbids fabricating a panel *role's* output; it does not forbid the
   driver's own authorization/interpretation trail, which
   `dispositions.md` already is), and added a Known Gaps entry pointing
   at it.
4. **A8a (HIGH, disposition rules never stated)** — `accepted`. Added a
   new "Driver Disposition — You Author This File" section: the six
   dispositions, the must-not-disposition-alone-on-a-technical-claim
   rule, that `deferred` is the one call the driver may make alone, that
   a finding about the driver's own conduct must never be
   self-dispositioned, and that `dispositions.md` itself is the driver's
   own file to create. This also supplies the missing definition of
   `unresolved` that A3b flagged (item 15), so both findings are closed
   by one section — cross-referenced from both the Synthesizer's Avoid
   bullet and the Red-Team's Notice bullet.
5. **A2b (MEDIUM, reframing owes no candidate)** — `accepted`. Added to
   the Alternative Shaper's Reason bullet: a reframe still owes a
   candidate, naming "reframing as evasion" explicitly.
6. **R2 (loss of soul, Scout-Before-Ask contradicts its own exemplar)**
   — `accepted`. Rewrote "Lead Advisor Discipline" to add the missing
   third axis (material *now*, not material in the abstract) and
   replaced "if not material, delete it" with "carried forward as an
   explicit named default" — cited directly against P01.3's real table
   (3 of 7 gaps genuinely user-exclusive, all 3 still answered "not
   asked now") and its own closing line ("a recorded decision, not a
   skipped step").
7. **R3/A8c (MEDIUM/WEAK, wrong `actors[].model` citation)** —
   `accepted`. Replaced the `ACTOR_FIELDS`/`src/runner/` citation with
   the correct one: `ACTOR_ALLOWED_KEYS` (`schema.mjs:133`) does accept
   `model`; the real refusal is `assertModelSupportedForKind`
   (`run.mjs:166-175`), scoped to `kind:"declared-protocol"`. Stated the
   behavioral rule is unchanged and correct — only the evidence pointer
   was wrong.
8. **R4/R5 (MEDIUM, turn-count and turn-framing errors)** — `accepted`.
   Fixed "P01.3 Turn 2" to "P01.2 Turn 2." Rewrote the citation to match
   what `dialogue/2-impact.md` actually says (permission, not
   instruction; explicit refusal to record it as a decision) instead of
   using it as evidence for the opposite framing.
9. **R6 (MEDIUM, misattributed verification)** — `accepted`. Rewrote the
   critic bullet in "Debate And Synthesis Discipline" to attribute the
   independent re-verification to the coordinator, and to state plainly
   that the critic's own artifact only names what would settle each
   attack.
10. **R7 (MEDIUM, stale bwrap-runnability framing, doctrine included)**
    — `accepted`, both halves. Rewrote the SKILL.md's Executor Roster
    framing to state the fix as proven (citing P02.1 B7's exact mount
    ordering, used live 13 times). Also made the one surgical correction
    to `architecture-advisory-role-doctrine.md`'s own "Carry-forward
    runnability limitation" paragraph (now "proven fixed, not an open
    limitation"), per the team lead's explicit authorization — no other
    change made to that file.
11. **R8 (MEDIUM, dead relative link)** — `accepted`. Fixed
    `../../coordination-protocols/...` to
    `../../../core/coordination-protocols/...`, matching
    `fgos-code-panel`'s own working depth convention (both `core/skills/`
    and `.agents/skills/` sit 3 levels deep, so a `../../../`-rooted link
    resolves identically from both). Re-verified: 13/13 links now
    resolve from `core/skills/`, 13/13 from `.agents/skills/`.
    **Correction (found by Reviewer's recheck, N2):** this report
    originally stated "16/16" here — the file had 13 relative links at
    this point, not 16 (the fix was correct, all 13 resolved; only the
    count was wrong, and it was not independently re-derived before
    writing it down). Corrected in place rather than left standing.
12. **R9 (MEDIUM, persona missing)** — `accepted`. Added a `Persona`
    column to the Executor Roster table, one persona per role, with the
    same "free-form prose, not a closed vocabulary" note
    `fgos-code-panel` already carries.
13. **R10 (MEDIUM, diversity-hedge audit dropped)** — `accepted`. Added
    the closing "diversity is a hedge, not a decoration — audit it at
    the end of every session" paragraph back into Executor Roster.
14. **R11 (MEDIUM, `agy` B12/B13 not named)** — `accepted`. Added a
    Known Gaps entry naming both gaps concretely, including the
    red-team-specific risk (B12 can manufacture a ceremonial `APPROVE`
    appearance for exactly the role whose own Avoid list warns against
    it).
15. **A3b (WEAK, dissent-laundering guard anchored on undefined term)**
    — `accepted`, closed by item 4's new Driver Disposition section
    (which defines `unresolved` precisely, including the
    conceded-vs-unresolved contrast) plus a forward cross-reference from
    the Synthesizer's Avoid bullet.
16. **A2c (WEAK, falsification theatre incomplete)** — `accepted`. Added
    "must name a condition that could actually occur" to both shapers'
    falsification-criteria bullets, and restored the critic's own duty
    to attack a vacuous criterion as a decision-relevant finding.
17. **A8b (WEAK, reopen-budget exhaustion undocumented)** — `accepted`.
    Added one paragraph to Decision Dialogue: when both `revise-*`
    invocations are spent and new material still arrives, the same
    "open a new cell" path applies, stated to the person plainly.

**Correction (found by Reviewer's recheck):** this line originally read
"No item was rejected or deferred — all 17 were real," which was
inaccurate and read as claiming complete coverage of both review rounds
when it was not: 5 of the Reviewer's 16 original findings (R12, R13,
R14, R15, R16 — all LOW) never entered the disposition list above at
all, silently, not accepted, rejected, or deferred. They are fixed in
fix round 2 (`doer-fix-round-2-report.md`), which also lists every item
from both original rounds explicitly, per the team lead's instruction
not to summarize into an "all N were real" claim again. Of the 17 items
this report's disposition list above DOES cover: none of THOSE 17 was
rejected or deferred, and none required
observation that every fix is prose-only).

## Process

- `npm run build:skills` re-run after all content changes; confirmed
  `core/skills/`, `.agents/skills/`, and `plugins/fgOS/skills/` are
  byte-identical (`md5sum` match on all three) and the `.claude/`
  wrapper is still the expected 24-line generated redirect.
- `node --test test/setup/skill-wrappers.test.mjs test/skills/fgos-mirror.test.mjs`:
  **39/39 pass, 0 fail.**
- `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/runner/coordination-*.test.mjs' 'test/verbs/coordination-*.test.mjs' 'test/cli/coordination.test.mjs' 'test/architecture.test.mjs'`:
  **757/757 pass, 0 fail** — unchanged from before this fix round, as
  expected (no kernel/protocol file touched).
- Relative-link check re-run from all three physical copies:
  `core/skills/fgos-architecture-panel/SKILL.md` — 13/13 resolve;
  `.agents/skills/fgos-architecture-panel/SKILL.md` — 13/13 resolve
  (this is the exact location R8's break was reported from — now
  clean); `plugins/fgOS/skills/fgos-architecture-panel/SKILL.md` —
  12/13 broken, confirmed to be the same pre-existing
  `../../../`-from-a-4-levels-deep-path pattern `fgos-code-panel`'s own
  plugin projection also has (4/4 broken there too) — not a regression
  introduced by this cell, matching the Reviewer's own explicit
  "not charged to this cell" note.
- Committed separately from the original 2 commits:
  `ba1c68d5` (SKILL.md + 3 projections + the one doctrine-file
  correction), on `group-thinking-plan-loop`, cwd/branch verified
  before committing.

## File-Level Diff Summary

- `core/skills/fgos-architecture-panel/SKILL.md` (source of truth):
  888 insertions / 223 deletions net across the whole file (per `git
  show --stat` on `ba1c68d5`), reflecting the new WARNING callout, the
  new Driver Disposition section, the Decision Dialogue reconciliation
  paragraph, the rewritten Lead Advisor Discipline section, the roster
  table's new Persona column, and every smaller prose fix above.
- `.agents/skills/fgos-architecture-panel/SKILL.md`,
  `plugins/fgOS/skills/fgos-architecture-panel/SKILL.md` — regenerated,
  byte-identical to the source (never hand-edited).
- `docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md`
  — exactly one paragraph corrected (the stale bwrap-runnability
  sentence), nothing else in that file touched.

---

Status: DONE
Summary: Fixed all 17 Reviewer/Red-Team findings (4 HIGH, 11 MEDIUM,
3 WEAK — the two HIGH-and-MEDIUM-both-flagged items counted once each),
re-verified every underlying claim independently before fixing rather
than trusting either report's prose, rebuilt and re-verified all
projections, confirmed 39/39 and 757/757 test suites unchanged, and
made the one small surgical correction to the role-doctrine playbook the
team lead explicitly authorized. Committed as `ba1c68d5`.
Concerns/Blockers: none. The `plugins/fgOS/skills/` relative-link
breakage remains, matching the pre-existing `fgos-code-panel` pattern —
flagging again for visibility in case a future cell wants to fix the
general pattern, but it is not new here and both reports agreed it is
out of this cell's scope.
