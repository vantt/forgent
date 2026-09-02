# Track: step-09-group-thinking-mvp1-mvp2

Plan: `plans/260903-0004-step09-group-thinking-mvp1-mvp2/plan.md`
Branch: `step-09-group-thinking-mvp1-mvp2`
Base ref: `cd5ddeb9` (recorded after two preservation commits landed
pre-existing uncommitted prep work found in the working tree at track start —
see "Preservation Commits" below — not the literal commit the branch was cut
from, `cf63f28c`; this keeps every cell's `BASE_REF..HEAD` diff clean going
forward instead of always including the large pre-existing docs rewrite)
Test command: `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/**/*.test.mjs'`

## Preservation Commits

Before any cell work, `git status` on the inherited branch
(`step-08-standalone-coordination`, already closed) showed a dirty tree: a
prior architect-docs restructuring session had rewritten
`architecture-intent.md`, split the old step-09 proposal into
`step-09-group-thinking-substrate.md` (this track's own scope doc) and
`step-10-coding-domain-adoption.md`, added `component-authority-boundary-map.md`,
and updated cross-linking READMEs/AGENTS.md/CLAUDE.md/reading-map.md, plus this
plan's own `plan.md`/phase files — none of it committed yet. All of it is
directly this track's own prerequisite material (exactly the SCOPE_DOCS this
plan cites), not unrelated work, so it was preserved via two commits on the
new branch rather than discarded or left dangling:

- `b52e0165` — docs(architect): split step-09 into group-thinking substrate
  and step-10 coding-domain adoption
- `cd5ddeb9` — docs(plans): add step-09 group-thinking substrate MVP1/MVP2 plan

Left untouched (pre-existing, unrelated, not committed): `.agentkit/`,
`.claude/agents/*.md`, `.fgos/events/*.jsonl` (AgentKit installation/runtime
artifacts), `docs/architect/component-boundary/tmp/{CONTEXT,DISCUSSION}.md`
(scratch/working draft, not accepted content), leftover `plans/*/reports/*`
untracked report files from the already-closed step-07/step-08 plans.

## Baseline

`FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/**/*.test.mjs'` run at
BASE_REF, exit code 1. Full log: `proofs/baseline-full-test-run.log`. 8 known
baseline failures, none touching this track's surfaces
(`src/runner/coordination/**`, `src/runner/definitions/**`,
`core/coordination-protocols/**`, `src/verbs/coordination/**`):

| # | Test | File | Cause class |
|---|---|---|---|
| 1 | ask/answer round-trip on a genuinely legacy durable-doing item (no claim) | `test/cli/fgos-intake-4.test.mjs:318` | assertion, unrelated (fgos ask/answer) |
| 2 | e2e pr-gate (a) runner item full loop | `test/e2e/pr-gate.test.mjs:226` | assertion, unrelated (PR-gate e2e verify-skip wording) |
| 3 | e2e self-improve loop full contract (D1-D17) | `test/e2e/self-improve-loop.test.mjs:174` | assertion, unrelated (self-improve loop verify-skip wording) |
| 4 | resolvePlan skips the risk-heavy gate (tsk-wve D1) | `test/intake/plan.test.mjs:953` | assertion, unrelated (intake plan) |
| 5 | resolvePlan skips requiring a verdict, mode "tiny" | `test/intake/plan.test.mjs:1198` | assertion, unrelated (intake plan) |
| 6 | resolvePlan skips for mode "small" | `test/intake/plan.test.mjs:1215` | assertion, unrelated (intake plan) |
| 7 | resolvePlan caller-supplied decompose verdict (D1) | `test/intake/plan.test.mjs:1588` | assertion, unrelated (intake plan) |
| 8 | herdr-spawn adapter (LIVE) real agy-herdr binaries | `test/runner/herdr-spawn-adapter.test.mjs:562` | live-executor timeout (60s), environment-dependent |

This list may only shrink; any new failure beyond it blocks cell close.
5037 tests, 5024 pass, 8 fail, 5 skipped, duration ~184s.

## Phase / Requirement Matrix

| Phase | Requirements | Status |
|---|---|---|
| 00 | R1-R4 | done |
| 01 | R1-R6 | missing |
| 02 | R1-R8 | missing |
| 03 | R1-R7 | missing |

## Active Cell

None — Phase 00 closed.

## Next Action

prepare P01.1 (Phase 01: MVP1 fixture skeleton)

## Cell Log

| Cell | Requirements | Status | Commit |
|---|---|---|---|
| P00.1 | Phase 00 R1, R2, R3, R4 (closes Phase 00) | done | (pending commit) |

## Phase 00 Status

**CLOSED.** R1-R4 via P00.1. Promoted the MVP1/MVP2 slice of the
discussion-status Step 09 substrate proposal into the two Accepted contracts
(`coordination-session.md`: `operation-authorized`/`driver-disposition-recorded`
events, `invocationKey` idempotency, context-grant enforcement, recheck-vs-
retry; `flow-definition.md`: binding-scoped `activation.mode`/
`maxInvocations`), plus a one-sentence prompt-boundary cross-reference in
`coordination-foundation-baseline.md` and a confirmed-correct (no-edit-needed)
read of `component-authority-boundary-map.md`.

Went through 1 Reviewer round (1 MEDIUM + 2 LOW — a self-contradictory MVP3+
scope disclaimer against the substrate's own MVP numbering, a silent
`targetArtifactRef`/`artifactRevision` naming divergence, a paraphrased
cross-reference — all fixed, re-confirmed resolved by the same Reviewer)
followed by 1 Red-Team round (1 HIGH + 3 MEDIUM + 2 LOW — most notably a
genuine recheck/taskKey-collision loophole: nothing required a recheck's
idempotent-claim key to differ from the original reviewing Assignment's own
key, so a future implementer faithfully reusing this contract's own cited
`wx`/taskKey precedent could have a "recheck" silently collapse into a retry
of the original Assignment — closed with a hard "MUST incorporate the new
revision/invocationKey" requirement; the 3 MEDIUMs were the same pattern,
outcome guarantees stated without the durability/scope qualifier already
modeled elsewhere in the same contracts, `invocationKey` scope,
`operation-authorized`-vs-terminal-transition atomicity, `maxInvocations`
resume counting — all fixed, re-confirmed resolved by the same Red-Team
re-attempting each named exploit against the post-fix text). No HIGH/MEDIUM
remains open. Docs-only cell throughout — `group-cognition-framework.yaml`
and `assignment-run-runresult.md` confirmed at zero diff by Doer, Reviewer,
Red-Team, and Coordinator independently.

Next: P01.1 (Phase 01 — `standalone-master-coordination-loop.yaml` fixture
skeleton, worker-only graph, required first-pass operations, declared
optional positions for revision/recheck, no Work fields).

## Phase 00 Audit Notes

- `coordination-session.md` and `flow-definition.md` are both `Design status:
  Accepted` today but contain zero MVP1/MVP2 vocabulary (`activation`,
  `operation-authorized`, `driver-disposition-recorded`, `invocationKey`,
  `grantedContextRefs`, recheck-vs-retry) — confirmed via full read, this is
  the real R1 gap.
- `architecture-intent.md` and `step-09-group-thinking-substrate.md` are both
  `Design status: Discussion` and already fully spell out the candidate MVP1/
  MVP2 shapes (substrate proposal §6-9). Phase 00's job is narrowing +
  promoting exactly the MVP1/MVP2 slice of that discussion text into the two
  accepted contracts above — not inventing new shape.
- `coordination-foundation-baseline.md` (Accepted) already points to Step 09
  for the group-thinking expansion (preservation commit `b52e0165`); no
  further edit required for R1 unless the Doer finds a gap.
- R2 (prompt boundary) is already satisfied by `master-coordinator.md`'s own
  pre-existing "Runtime Boundary" section (top of file) plus
  `architecture-intent.md` §18.4 — both state the playbook is manual-only and
  must not become runtime authority. No accepted-doc currently states this
  as canonical text; Doer should add one sentence to
  `coordination-foundation-baseline.md`'s "Deliberately Not Promoted" section
  cross-referencing the playbook's own boundary statement, rather than
  duplicating the prose.
- R3 (component authority) needs a read of `component-authority-boundary-map.md`
  against the placement claims in phase-00's R3 text; expected to already be
  correct (it was authored in the same prep session as this plan) — Doer
  confirms rather than assumes.
- R4 (no invariant reopening) is a negative constraint: Doer must not touch
  `group-cognition-framework.yaml`, `assignment-run-runresult.md`, or any
  budget/mutation-exclusivity language while writing R1-R3.
