# P02 — Plan-Loop Wording, Baseline Step, And Routing

**Capability:** `code:implement` (skill sources + regenerated projections)

**Depends on:** P01 (the how-to this phase links to must exist)

## Context

- [plan.md](plan.md) Design section
- [reports/review-260915-0944-critical-design-review.md](reports/review-260915-0944-critical-design-review.md) §2 R2/R3, §5 wording
- `core/skills/fgos-plan-loop/SKILL.md` — §1 `open.json` (`produce`/`review`/`redTeam` objectives), §3 `fix-N.json` (`revise`/rechecks), §4 close, §5 unattended loop steps 1–6
- `domains/coding/skills/fgos-code-panel/SKILL.md` — front-matter description, Non-Goals "No design-doc ceremony"
- Boundaries that constrain the edit:
  - `test/architecture.test.mjs:10` D12: `core/` never couples to a named domain
  - `test/setup/skill-wrappers.test.mjs:429-451`: `core/skills/fgos-plan-loop/SKILL.md` and its projections must not **markdown-link** any `fgos-code-panel` path (plain-name mention is already present and allowed)
  - `.agents/`, `.claude/skills`, `plugins/fgOS/skills` are render targets — edit `core/`/`domains/` only, then `npm run build:skills`

## Requirements

R1. `fgos-plan-loop` §5 gains a step 0 before the loop: run the track's
    full proof command once, record the baseline in plan.md Execution Inputs
    (link `docs/how-to/author-a-plan-loop-track.md`); every later gate
    compares against it; the list may only shrink.
R2. `produce` and `revise` objective templates (§1, §3) carry the
    domain-neutral sentence: *"Run exactly the Verification commands the
    phase file declares for this cell and report each command's real
    outcome. Do not run the track's full proof command unless plan.md marks
    this phase a full-suite gate or this objective says so explicitly."*
R3. `review`/`redTeam` and both recheck objectives (§1, §3) carry: *"Judge
    proof sufficiency, not only correctness: if the declared verification
    does not exercise a contract this diff changes, report it as a finding
    (HIGH on a public or shared contract) naming the missing test or why a
    full-suite gate is needed. You cannot run or request the full suite; the
    Lead decides on your finding (accepting upgrades this cell only, or providing
    an evidence-backed rejection)."*
R4. §4 close and §5 step 5 state the close rule, evidence lifecycle, and
    checkpoint identity:
    - Precedence & compatibility: explicit phase `## Verification` and plan
      Product Gates govern over defaults; isolation-breaking diffs and
      Lead-accepted escalations override targeted mode; legacy tracks without
      baseline/checkpoint remain fully compatible.
    - Durable evidence schema: tracks progression through three states:
      1. `coordination-accepted`: cell coordination loop reached quorum and
         cell-declared verification passed on cell worktree at `testedSha`.
      2. `merged-to-track`: cell branch integrated into track branch at
         `integratedSha`.
      3. `checkpoint-verified`: gate full proof executed against `integratedSha`
         compared against recorded baseline, triaged, and passed.
    - Escalation authority & scope: Lead evaluates reviewer/red-team proof gap
      findings; Lead may `accepted` (upgrading current cell to
      `Proof: escalated-to-full`) or provide an evidence-backed `rejected`.
      An accepted escalation upgrades the proof requirement for the **current
      cell only**, not necessarily creating a permanent Product Gate in `plan.md`.
    - Non-inference rule: if `testedSha != integratedSha`, `checkpoint-verified`
      cannot be inferred from pre-merge proof; gate proof must execute on
      `integratedSha`.
    - Checkpoint identity: record `phase/cell id`, `command`, `baseline`,
      `testedSha`, `integratedSha`, and `outcome` in the cell trace before
      `close.json`.
    - Close rule wording: `Proof: targeted` only when no accepted coverage-gap
      finding and the diff touches none of the isolation-breaking paths;
      otherwise run the full proof command, compare against baseline, triage
      every new failure (patch-related / pre-existing / environmental), verify
      `integratedSha` when distinct from `testedSha`, and record
      `Proof: full-suite-gate | escalated-to-full` with complete checkpoint
      identity in the trace before `close.json`.
R5. `fgos-plan-loop` description gains the trigger phrases "run / execute
    this code implementation plan (track)" so the router sends multi-cell
    plans here.
R6. `fgos-code-panel` description and Non-Goals gain one line: a request that
    references a multi-cell `plan.md`/`phase-NN` track is a `fgos-plan-loop`
    track; this skill is one cell. No other body change, except R10 below
    (a user-approved bug fix landing in this same file this phase already
    touches).
R7. No domain name, `trackKind`, or `executionPolicy` in any new plan-loop
    sentence. No new markdown link from plan-loop to a code-panel path.
R8. `npm run build:skills`; commit the regenerated `.agents/`, `.claude/`,
    `plugins/` copies with the source edits.
R9. `CHANGELOG.md` `## [Unreleased]` line (user-visible skill behaviour).
R10. Bug fix (user-approved, observed live while driving this track's own
    P01 cell): `fgos-code-panel`'s "3. Fix round" `fix-1.json` template
    declares `authorize` steps for `reviewer-recheck`/`red-team-recheck`
    with no `grantedContextRefs`, while their paired `operation` steps
    declare `contextRefs: ["$ref:revise"]` -- the dispatch is refused
    (`dispatchDeclaredOperation: contextRefs entry ... is not granted by
    authorization ...`) the moment anyone copies the template verbatim.
    Add `"grantedContextRefs": ["$ref:revise"]` to both the
    `authReviewRecheck` and `authRedTeamRecheck` example steps so the
    template actually dispatches as written. Do not touch
    `src/runner/coordination/session-engine.mjs` or any other engine file
    for this -- the companion engine-level bug (a stale, wrongly-scoped
    authorization for the same binding permanently blocking a corrected
    retry, and a first-pass-actor-genuinely-failed session that can never
    close even after a clean recheck) is out of scope for this track and is
    tracked separately as `tsk-1bh`.

## Files

- Edit: `core/skills/fgos-plan-loop/SKILL.md`
- Edit: `domains/coding/skills/fgos-code-panel/SKILL.md`
- Regenerate: `.agents/skills/{fgos-plan-loop,fgos-code-panel}/**`,
  `.claude/skills/{fgos-plan-loop,fgos-code-panel}/SKILL.md`,
  `plugins/fgOS/skills/{fgos-plan-loop,fgos-code-panel}/**`
- Edit: `CHANGELOG.md`
- Must not edit: `core/coordination-protocols/*.yaml`,
  `src/verbs/coordination/**`, `src/runner/coordination/**`,
  `core/skills/_shared/private-cell-worktree.md`, any plan under
  `plans/260915-0455-test-suite-feedback-cost/`

## Adversarial checks

- A sentence that names `npm test` or `code`/`coding` inside plan-loop.
- Reviewer wording that could be read as permission to run the full suite.
- Baseline step written as optional.
- Inferring `checkpoint-verified` from pre-merge proof when `testedSha != integratedSha`.
- Lead rejecting a reviewer/red-team proof gap without evidence-backed rationale.
- Applying a cell escalation as a permanent Product Gate across future cells without explicit plan update.
- Breaking compatibility with existing running tracks lacking baseline/checkpoint blocks.
- Hand edit landing in `.agents/` or `plugins/` instead of the source
  (silently reverted by the next `assembleSkills`).
- Description edit that breaks the `>-` folded YAML front-matter.
- R10 fix landing in `.agents`/`plugins` only, or the source `authorize`
  step still missing `grantedContextRefs` after the edit.

## Verification

```sh
node --test test/setup/skill-wrappers.test.mjs test/skills/fgos-mirror.test.mjs test/architecture.test.mjs
npm run build:skills && git status --porcelain .agents .claude plugins   # expect empty after commit
grep -n "npm test\|trackKind\|executionPolicy\|coding\b" core/skills/fgos-plan-loop/SKILL.md && exit 1 || true
grep -c "full proof command" core/skills/fgos-plan-loop/SKILL.md          # >= 4 (produce, revise, close, baseline)
grep -c "grantedContextRefs" domains/coding/skills/fgos-code-panel/SKILL.md  # >= 2 (authReviewRecheck, authRedTeamRecheck)
npm test                                                                  # full-suite gate: this cell edits projected skills
```

## Acceptance

Objective templates in §1/§3 carry R2/R3 verbatim; §5 has the baseline step;
§4/§5 state the close rule with durable evidence schema (`coordination-accepted`,
`merged-to-track`, `checkpoint-verified`), checkpoint identity (`phase/cell id`,
`command`, `baseline`, `testedSha`, `integratedSha`, `outcome`), escalation authority
(Lead accept / evidence-backed reject, current cell only), non-inference rule
(`testedSha != integratedSha`), and precedence/compatibility; routing descriptions
updated on both skills; projections regenerated and byte-identical to source
render; all listed tests green; full `npm test` green once before merge; the
`fgos-code-panel` fix-round template's `authReviewRecheck`/`authRedTeamRecheck`
steps carry `grantedContextRefs: ["$ref:revise"]` (R10).

## Risks and rollback

Skill prose only; revert the two source files and re-run `build:skills`.
The wording reaches workers through the objective text the Lead composes —
if a Lead hand-writes objectives without the sentence, nothing enforces it;
that gap is the known limit until domain instruction rendering lands.
