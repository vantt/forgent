# Cell P04.2 — Fix Round 1 (Doer Report)

Responds to `reviewer-report.md`/`reviewer-findings.json` and
`redteam-report.md`/`redteam-findings.json` in this directory. 11 items in
the team lead's priority order (10 Reviewer findings + Red-Team's 1
blocking finding), each independently re-verified live before fixing, not
taken on the reviewer's or red-team's word alone.

## Independent Pre-Fix Verification, Live

Before editing anything, built a fresh sandbox
(`docs/architect/agent-coordination/verification/architecture-advisory-panel/proofs/P04.2/fix-round-1-live-proof/`,
committed as evidence) and drove one real, continuous 12-round session
through the actual `fgos` CLI across 6 separate invocations — not a
restatement of the reviewer's or red-team's own repro, an independent one:

- Opened with `"aggregateBounds": {"maxRounds": 20, "maxAssignments": 30}`
  and a homogeneous, tier-differentiated `actors[]` roster (all 8 roles on
  one registered fake provider family, `lead-advisor-actor`/
  `synthesizer-actor`/`red-team-actor` at `critical`, the rest at
  `analytical`). Confirmed the RT-P04.2-08 blocker's own claim first:
  reading `src/verbs/coordination/schema.mjs` confirms
  `DEFAULT_AGGREGATE_BOUNDS.maxRounds` really is 10, and the protocol's
  own pre-dialogue path really is 10 operations.
- Ran interpret, investigate, 3 shapers, critique, assess-constraints,
  synthesize, red-team, explain (rounds 1-10), then a Phase-9
  `revise-synthesis` (round 11) and `close-dialogue` (round 12) — all real
  dispatches, real events, no simulation. Final `fgos coordination show`:
  `"status": "completed"`. This independently reproduces red-team's own
  `rt_aap_bounds_2` finding rather than trusting it.
- Read `runs/01/result.json`'s own `policy.provenance.model.value` for the
  `critical`-tier vs. `analytical`-tier roles on the identical executor:
  `model-a-critical` vs. `model-a-analytical` — confirms the corrected
  homogeneous-fallback fix (R3, below) really does produce tier
  differentiation, not just a differently-labelled single model.
- Read the session's own `events.jsonl` for the `synthesize-recommendation`
  Assignment's `assignment-created` event: `contextGrant.refs` carries all
  7 prior Assignment ids — confirms R1's fix produces a real, non-empty
  grant, not just schema-legal prose.

**One finding beyond the 11 assigned, surfaced by this same live run, not
by re-reading the reviewer/red-team reports:** `actors[]` is read fresh
from *each individual request*, never persisted on the session manifest.
A call that reused the opening call's `coordinationId` but omitted
`actors[]` silently dispatched that role through the global default
executor instead of the intended confined one — reproduced by first
getting this wrong myself (an early attempt showed `provider: "claude"`,
the ambient default, for a role I had explicitly routed to
`exec-family-a` in the OPENING call only), then correcting it and
re-verifying `provider: "family-a"` on the corrected re-run. This matters
more than any single reviewer finding: it means every published
reopen/close/authorize fragment in this cell's own files needed its
relevant `actors[]` entry repeated, not just the 4 files R1 named for
`grantedContextRefs`. Documented as its own section in the how-to guide
("`actors[]` is per-call — it does not persist across a resumed session")
and applied to every fragment below that dispatches an actor.

## Disposition, Item By Item

1. **RT-P04.2-08 (CRITICAL, BLOCKING)** — `accepted`. Added
   `"aggregateBounds": {"maxRounds": 20, "maxAssignments": 30}` to every
   opening-request JSON fragment (`clear-start.md`, `unclear-start.md`,
   both rosters in `heterogeneous-and-homogeneous-roster.md`, and the new
   `.json` fixture). Added a new, prominent section near the top of the
   how-to guide ("The platform's default round cap is too low for this
   protocol — raise it") stating the exact mechanism (10 pre-dialogue
   operations, round 11+ needed for any Phase-9 dispatch, `close-dialogue`
   as the only route to `lead-advisor-actor`'s quorum) and citing the
   conformance suite's own prior `maxRounds: 20` choice. Verified live,
   independently, through `close-dialogue` and a completed session (see
   above) — not just "added the field and assumed."
2. **R1 (HIGH, empty `grantedContextRefs`)** — `accepted`. Fixed all 4
   named files (`material-context-reopen.md`,
   `alternative-and-composite-reopen.md`, `clarification-and-challenge.md`,
   `final-decision-and-defer.md`). Since these are illustrative
   continuations of a session with no single fixed real assignmentId,
   used the reviewer's own suggested fallback: explicitly-marked
   substitution tokens (e.g. `"<this session's real
   synthesize-recommendation assignmentId>"`) plus prose stating plainly
   that an empty grant is schema-legal but silently starves the reopen —
   verified live (see above) that the corrected shape produces a real,
   non-empty `contextGrant.refs`.
3. **R3 (HIGH, unconfined `claude` in the homogeneous roster)** —
   `accepted`. Replaced bare `"executor": "claude"` with
   `"executor": "claude-bwrap"` for all 8 roles, tier-differentiated
   (`critical` for lead-advisor/synthesizer/red-team, `analytical` for the
   rest) exactly as the team lead specified. Added an explicit paragraph:
   never bind an advisory role to a bare `claude`/`agy`/`codex-cli` name,
   citing the live `.fgos/config.json` shape that makes `claude` resolve
   to a real, git-write-capable, unconfined invocation, and BOUNDS #2.
   Also added the team lead's own named consequence: if no confined
   single-provider pair exists at all, homogeneous fallback is not
   currently safe to run — say so rather than substituting an unconfined
   name. Verified live that `claude-bwrap`-with-tier-differentiation
   really does resolve two different models on the identical registered
   executor (see above).
4. **R2 (HIGH, 0 of 8 files showed both protocol id and `actors[]`;
   CHANGELOG overclaimed)** — `accepted`, resolved by making all 8 files
   true rather than by weakening the CHANGELOG claim. Grep-counted before
   and after, same method the reviewer used:

   | File | Before (protocolRef / actors) | After |
   |---|---|---|
   | clear-start.md | 1 / 0 | 1 / 1 |
   | unclear-start.md | 1 / 0 | 1 / 1 |
   | decision-request-and-resume.md | 0 / 0 | 1 / 1 |
   | clarification-and-challenge.md | 0 / 0 | 2 / 1 |
   | material-context-reopen.md | 1 / 0 | 3 / 2 |
   | alternative-and-composite-reopen.md | 0 / 0 | 1 / 1 |
   | final-decision-and-defer.md | 0 / 0 | 2 / 1 |
   | heterogeneous-and-homogeneous-roster.md | 0 / 2 (bare `actors[]`, no request wrapper) | 2 / 2 (wrapped in full requests) |

   8 of 8 now show both, in a real JSON fragment, in their own file. No
   CHANGELOG correction was needed once this held.
5. **R4 (MEDIUM, "reproduced in full" but actually paraphrased)** —
   `accepted`. Changed the claim to "condensed from the source" and added
   a direct link to the real `decision-request.md` for the unabridged
   text, per the reviewer's own offered fix.
6. **R5 (MEDIUM, constructed challenge misattributes a declined
   recommendation)** — `accepted`. Re-read `critiques/architecture-critic.md`
   and `synthesis.md:83` directly rather than trusting my own prior
   summary. The real Attack 1 targets fixing the launcher bugs generally
   (explicitly including "handling cold-start races" in the critic's own
   words); the real recommendation narrows to 3 named deterministic bugs
   plus CI and explicitly declines the cold-start work. Rewrote the
   challenge to attack the part actually recommended ("fix the three
   launcher bugs and put the shell in CI") rather than the declined
   cold-start work, and rewrote the "defend" branch to quote
   `synthesis.md:83`'s own real, precise posture ("partially concessive,
   not resolving... removes the attack's near-term bite... does not
   settle the underlying claim") instead of a paraphrase.
7. **R6 (MEDIUM, ceremonial Decision Request: `[named default]`
   placeholders, generic questions)** — `accepted`. Replaced the generic
   data-residency/SLA boilerplate with a scenario layered on P01.3's real
   scout findings (`alert_dispatch_intraday.py`, the real 2026-06-22
   standing decision's 7-day window) plus a clearly-disclosed constructed
   compliance twist, and replaced both `[named default]` placeholders with
   real, substantive, reasoned defaults (a 1-year retention assumption
   with its own stated rationale; treating the existing window as
   compliant for all instrument classes).
8. **R7 (LOW, no `.json` fixture, so the doctor check can't catch this
   protocol's own regressions)** — `accepted`. Added
   `docs/how-to/coordination-examples/architecture-advisory-panel-v1-request.json`
   (byte-identical in content to `clear-start.md`'s own opening request).
   Verified directly against `validateCoordinationRequest` and
   `loadCoordinationProtocol` before running the suite, then confirmed via
   `test/setup/coordination-doctor-check.test.mjs` that it passes cleanly
   and the suite's one remaining failure is the pre-existing,
   already-baselined group-thinking-lite placeholder issue — not a new
   regression. Did not add a `-reopen-request.json` (the reviewer's own
   "ideally" case, not required) given time budget; noted as a real,
   named gap below.
9. **R8 (LOW, silently-fixed typo in an immutable human-turn quote)** —
   `accepted`. Restored the real byte "deskop" (not "desktop") at the one
   point it appears in the source, marked `[sic]` per the reviewer's own
   suggested option.
10. **R9 (LOW, reopen-budget table header implies a shared pool)** —
    `accepted`. Changed "Costs one of your two reopens?" to "Costs a
    reopen invocation?", matching the reviewer's exact suggested wording
    (this is the same defect Red-Team independently found as RT-P04.2-10;
    fixing it once resolves both).
11. **RT-P04.2-06 (the how-to's resume section undercounts
    `pendingDriverAuthorizations` as 8, and doesn't note the specialist's
    missing `actorId`)** — `accepted`, though not one of the 10 numbered
    Reviewer findings, this was Red-Team's own recommended action #2 and
    is a real, cheap correctness fix directly adjacent to R1-R10's own
    territory. Corrected "8" to "9," named `answer-specialist-question`
    as the ninth entry, and explained why it carries no `actorId` (no
    static actor for the specialist slot).

**Also fixed, adjacent to the assigned 11, because it shares a root cause
with R2:** RT-P04.2-07 (the `alternative-and-composite-reopen.md`
three-proposal rollup treats one shaper's two arms as two independent
proposals, and omits the constraint advocate's own distinct candidate
entirely). Corrected the "Real starting material" section to name the
real structure (system shaper's single proposal; alternative shaper's one
proposal with two named arms; constraint advocate's own distinct
proposal), and re-grounded the `request-composition` example to combine
the alternative shaper's reversibility trigger with the constraint
advocate's connection-health deliverable — a genuine cross-shaper
composition, not two arms of one proposal. RT-P04.2-09 (clear-start.md
models the provider collapse it forbids) is resolved as a side effect of
the R2 fix — the file now shows the real roster instead of omitting
`actors[]`, and states explicitly what omitting it would have cost.

## Not fixed / explicitly deferred

- **R7's "ideally a `-reopen-request.json`" half** — not shipped. A
  reopen fixture needs a resumed `coordinationId` naming real, prior
  assignmentIds, which is exactly the placeholder-shape problem the
  pre-existing group-thinking-lite failure already demonstrates is
  fragile against the schema's charset check. Shipping one opening-request
  fixture (done, item 8) already closes the "zero fixtures for this
  protocol" gap the finding named; a reopen fixture is real future work,
  not silently dropped.
- **R10 (commit the throwaway live-proof artifact)** — satisfied as a
  side effect of this round's own required live verification: the 6
  request files plus the final `show --json` output are committed under
  `proofs/P04.2/fix-round-1-live-proof/` (this round's proof), and cited
  from the how-to guide. The ORIGINAL `aap_entry_proof_1` session from the
  first doer pass was never separately committed — superseded by this
  round's more complete proof (it reaches `close-dialogue`; the original
  did not), so re-creating it was not worth the effort.

## Tests

1. **`test/setup/coordination-doctor-check.test.mjs`** (not part of the
   track's standard 3-command baseline, run specifically to verify the
   new `.json` fixture and the R1 fix don't introduce a new doctor-check
   regression): 4 pass, 1 fail — the pre-existing group-thinking-lite
   placeholder failure only (unchanged from before this round; confirmed
   by exact message match against the P04.2 doer-report's own prior
   citation of it).
2. **Focused coordination suite** —
   `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/runner/coordination-*.test.mjs' 'test/verbs/coordination-*.test.mjs' 'test/cli/coordination.test.mjs' 'test/architecture.test.mjs'`
   → **757/757 pass**, 0 fail.
3. **Skill wrapper / mirror suite** —
   `node --test test/setup/skill-wrappers.test.mjs test/skills/fgos-mirror.test.mjs`
   → **39/39 pass**, 0 fail.
4. **Full `npm test`** (single clean run, not concurrent with anything
   else) → **5695 tests, 5686 pass, 3 fail, 6 skipped, exit 1.** All 3
   failures are the pre-existing, already-baselined ones (work-item `seq`
   race under this shared multi-agent checkout's own concurrent activity;
   `docs/tutorials` real-directory race in `enduser-index.test.mjs`; the
   pre-existing group-thinking-lite placeholder-JSON gap) — the exact
   same 3-of-original-6 the independent Reviewer's own report already
   confirmed as a strict subset of the track's baseline. **Zero new
   failures from this round's edits.** The two real pre-existing bugs the
   original doer-report.md flagged (`flow-definition-protocol-loader.test.mjs`'s
   fixture list; `SKILL.md`'s stray `D1` citation) no longer appear in
   this run at all — confirmed already fixed elsewhere (the Reviewer's
   own report independently verifies both fixes: 14/14 and 31/31 passing).
5. **Relative-link check** — every link in the how-to guide and all 8
   example files, re-run after every edit in this round: all resolve.

## Status

Status: DONE
Summary: All 11 assigned findings (10 Reviewer + Red-Team's 1 blocking)
accepted and fixed, each independently re-verified live rather than
patched on report text alone; 2 adjacent findings (RT-P04.2-06, RT-07)
fixed too since they share root cause with assigned items; 1 new gap
(`actors[]` is per-call, not session-persisted) discovered mid-verification
and applied across every affected fragment plus documented as its own
how-to guide section. Live proof for this round committed under
`proofs/P04.2/fix-round-1-live-proof/`.
Concerns/Blockers: None blocking. R7's reopen-fixture half explicitly
deferred (see above) — real future work, not a hidden gap.
