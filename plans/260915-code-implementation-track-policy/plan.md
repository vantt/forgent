# Code Implementation Track Policy — Docs-Only Rollout

**Track:** `code-implementation-track-policy`

**Status:** done — P01 + P02 merged to track branch; track Acceptance verified; see [`reports/track-closeout.md`](reports/track-closeout.md)

**Date:** 2026-09-15 (rev 2)

**Mode:** docs-only

## Objective

Make Work-independent code implementation tracks (`fgos-plan-loop`) default to
targeted proof per cell and full proof at declared gates, by fixing the plan
**authoring** side and the coding-worker discipline — not by adding a policy
schema, a validator, a code-panel facade, or code-kind branching to the generic
loop.

## What changed since rev 1

Review: [`reports/review-260915-0944-critical-design-review.md`](reports/review-260915-0944-critical-design-review.md).
Accepted findings:

- Diagnosis corrected. `fgos-plan-loop` already contracts focused test per
  cell + full suite at `**Full-suite gate.**` phases
  (`core/skills/fgos-plan-loop/SKILL.md:564-576`; dogfooded in
  `plans/260910-1700-rust-host-r1-kernel/plan.md` Product Gates). The
  full-suite-every-cell behaviour comes from plan authoring (nine phase files
  writing `npm test` and Invariant #2 in
  `plans/260915-0455-test-suite-feedback-cost/`), not from the skill.
- Withdrawn: `trackKind`/`executionPolicy` YAML contract; plan-loop branching
  on a code kind; two-mode `fgos-code-panel` facade; YAML-presence validator;
  `trackToMain: finalOnly` / `sync.mainIntoTrack` defaults (merge cadence
  stays a per-plan Execution Input).
- Adopted as the core: S1 coding instruction fragment, S2 test baseline, S3
  escalation rule, S4 trace `Proof:` field.

### Reviewer 2 final accepted notes

- **Precedence and compatibility rule**: Explicit plan Product Gates and phase
  `## Verification` take precedence over generic skill defaults. Isolation-breaking
  diffs and Lead-accepted escalations override the targeted default for that cell.
  Work items running under fgOS Work use the item `verify` / lifecycle reverify
  contract; Work-independent tracks (`fgos-plan-loop`) use the plan's Execution Inputs
  and Product Gates. Backward compatibility is preserved for existing tracks lacking
  baseline/checkpoint blocks (no retroactive schema migration or forced validation).
- **Durable evidence schema**: Clearly distinguishes three operational states:
  1. `coordination-accepted`: Cell coordination loop reached quorum and targeted
     verification passed on cell worktree at `testedSha`.
  2. `merged-to-track`: Cell branch integrated into track branch, yielding `integratedSha`.
  3. `checkpoint-verified`: Gate full proof executed against `integratedSha`, compared
     against baseline, triaged, and passed.
- **Checkpoint identity**: Explicit record tuple: `phase/cell id`, `command`,
  `baseline`, `testedSha`, `integratedSha`, and `outcome`. Recorded in the cell trace.
- **Escalation authority and cell-only scope**: Reviewer and Red-Team dispatches
  have reporting authority only (`proof insufficient: targeted set does not cover <contract>`).
  Lead holds escalation authority to either `accepted` or provide an evidence-backed
  `rejected`. An accepted escalation upgrades the proof requirement for the **current
  cell only** (`Proof: escalated-to-full`), not necessarily creating a permanent
  Product Gate across future cells.
- **Non-inference across integration**: If `testedSha != integratedSha`,
  `checkpoint-verified` cannot be inferred from pre-merge proof. Full gate proof
  must be executed against `integratedSha` to certify the checkpoint.
- **Retained rev 2 choices**: No `trackKind` or `executionPolicy` YAML, no
  validator script, no `fgos-code-panel` facade, no engine changes.

## Authority

1. `docs/specs/reading-map.md`
2. `core/skills/fgos-plan-loop/SKILL.md` (§4 close, §5 unattended loop)
3. `docs/architect/agent-coordination/playbooks/prompts/master-coordinator.md`
   (TEST BASELINE `:255-260`; isolation-breaking path list `:241-243`)
4. `docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md`
   and `domains/coding/instructions/worktree-safety.md` (fragment shape)
5. `docs/architect/agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md`
   (one seam per domain; no second consumer, no registry)

## Design (settled)

Three layers stay as described in rev 1, but layer 3 has no new artefact:

```text
Coordination Engine        unchanged
Generic Track Orchestrator fgos-plan-loop; domain-neutral wording only
Domain discipline          (a) plan prose: Product Gates + per-phase Verification
                           (b) domains/coding/instructions/ procedure fragment
```

Proof model, mirroring the Work path (item `verify` ↔ cell Verification;
lifecycle verify/reverify ↔ gate/final full suite):

- **Precedence & compatibility**: Plan Product Gates and phase `## Verification`
  take precedence over generic skill defaults. Mechanical isolation-breaking triggers
  and Lead-accepted escalations override targeted defaults for that cell. Work-path
  items continue using Work `verify`; Work-independent tracks use plan inputs and
  Product Gates. Legacy tracks lacking baseline/checkpoint blocks remain fully
  compatible without forced schema migration.
- **Durable evidence schema**: Three distinct states must be tracked:
  - `coordination-accepted`: Coordination session quorum reached and cell-declared
    verification passed in cell worktree on `testedSha`.
  - `merged-to-track`: Cell branch merged into track branch, producing `integratedSha`.
  - `checkpoint-verified`: Full proof command executed against `integratedSha`,
    compared against baseline, triaged, and passed.
  - *Non-inference rule*: If `testedSha != integratedSha`, `checkpoint-verified`
    cannot be inferred from pre-merge proof; full gate verification must execute
    on `integratedSha`.
- **Checkpoint identity**: Every checkpoint record in the cell trace
  (`docs/architect/agent-coordination/verification/<track>/<cell>.md`) captures:
  `phase/cell id`, `command`, `baseline`, `testedSha`, `integratedSha`, and `outcome`.
- **Baseline** (S2): full proof command once before cell 1; known failures
  recorded in plan.md Execution Inputs; list may only shrink.
- **Per cell**: Doer/Fixer run exactly the phase file's `## Verification`;
  Lead re-runs it before disposition.
- **Gate** (Product Gates `**Full-suite gate.**`): full proof in the worktree
  (and on `integratedSha` if distinct), compared to baseline, every new failure triaged
  patch-related / pre-existing / environmental before close.
- **Escalation authority & scope** (S3): Reviewer/Red-Team report a coverage gap as a
  severity-tagged finding — never run or request the full suite themselves. Lead
  holds sole authority to `accepted` or provide an evidence-backed `rejected`.
  An accepted escalation upgrades proof requirement for the **current cell only**
  (`Proof: escalated-to-full`), not necessarily a permanent Product Gate for future cells.
  Mechanical trigger regardless of Product Gates: diff touches dispatch/self-host hooks,
  session/replay/schema core, shared invariants, migrations, test-harness foundations,
  or `package.json` scripts.
- **Trace** (S4): cell trace records
  `Proof: targeted | full-suite-gate | escalated-to-full` + complete checkpoint identity
  tuple (`phase/cell id`, `command`, `baseline`, `testedSha`, `integratedSha`, `outcome`).
- **Final close**: full proof on the integrated track branch before the last
  merge to main; missing proof blocks close.

## Phases

| Phase | File | Deliverable | Exit |
|---|---|---|---|
| 01 | [phase-01-authoring-template-and-coding-fragment.md](phase-01-authoring-template-and-coding-fragment.md) | `docs/how-to/author-a-plan-loop-track.md`; `domains/coding/instructions/verification-discipline.md` | A stranger Lead can author a track whose phases name targeted commands, mark gates, record baseline, precedence/compatibility, durable evidence schema (`coordination-accepted`, `merged-to-track`, `checkpoint-verified`), checkpoint identity (`testedSha`, `integratedSha`), escalation authority (accept / evidence-backed reject, current cell only), and non-inference rule; fragment passes `discoverInstructionSources` + composition with no conflict |
| 02 | [phase-02-plan-loop-wording-and-routing.md](phase-02-plan-loop-wording-and-routing.md) | `fgos-plan-loop` baseline step + generic verification/proof-sufficiency sentences + close wording (durable evidence states, checkpoint identity, escalation authority, non-inference when `testedSha != integratedSha`) + description routing; `fgos-code-panel` one routing line; rebuilt projections | No code-kind branch in `core/`; wrapper/projection tests green; close wording enforces evidence lifecycle and checkpoint identity; "run this code implementation plan" routes to plan-loop |
| 03 | (no `phase-NN.md` — mid-session real-time user redirection during P01/P02's own review, not a pre-authored phase: "mục tiêu thật của việc làm này là phải cải thiện hiệu suất của code panel") | `fgos-code-panel`'s focused/affected/full proof-tier contract (the actual goal); 4 fixed contract bugs in `fgos-plan-loop`/the how-to: tree-identity+environment-fingerprint exception, exact-names baseline with environmental-transient/precondition split, proof-gap-never-deferred, baseline-count correction (103→51) | Commits `4f1010a5` + `ba29344c` on this branch; reviewed+red-teamed clean (7 MEDIUM+6 LOW and 2 HIGH+2 MEDIUM found and fixed, 1 LOW attack failed); full suite 51/51 matches corrected baseline, 0 new; targeted 167/167 pass |

Dependency: 01 → 02 (02 links to the how-to). P03 has no phase file and depends
on P01+P02's shipped policy being live to review; it lands on its own cell.
Phases 01+02 both land in one cell on one
branch; `code:implement` capability for the skill edits, docs otherwise.

## Acceptance (track)

1. `grep -n "trackKind\|executionPolicy" core/ domains/ docs/` returns
   nothing.
2. `core/skills/fgos-plan-loop/SKILL.md` contains no domain name in its new
   sentences; §5 gains a baseline step.
3. `npm run build:skills` reproduces `.agents/` and `plugins/` copies byte-
   identical; `node --test test/skills* test/setup/*instruction*` green;
   full `npm test` once before merge (this track is itself a full-suite gate:
   it edits skill projections).
4. `CHANGELOG.md` `## [Unreleased]` line for the how-to and fragment.

## Not in scope

- Editing `plans/260915-0455-test-suite-feedback-cost/` (Invariant #2 stays
  until its owner decides — see below).
- Any runtime schema, validator script, CLI command, or persisted checkpoint
  state. Each waits for a second real consumer (ADR-007 §4 bar). Still firm
  through P03 — its focused/affected/full proof tiers and tree-identity
  reuse rule are Lead-discipline prose only, no schema/engine change.
- ~~Test selection, caching, tiering~~ — **superseded at P03** by explicit
  real-time user direction ("mục tiêu thật của việc làm này là phải cải
  thiện hiệu suất của code panel... nên tập trung vào tối ưu test"):
  `fgos-code-panel` now declares a focused/affected/full test-selection
  contract and a tree-identity proof-reuse rule. This narrows only that one
  bullet — the schema/validator/engine exclusion above is untouched and
  still governs.

## Execution Inputs

```text
TRACK_BRANCH: code-implementation-track-policy
FULL_TEST: npm test   (run with CLAUDE_CODE_*/CLAUDECODE env vars unset -- a known
  session-leak-into-spawned-CLI contamination otherwise adds ~10 spurious failures)
BASELINE: 51 unique known-failing tests (exact names, not a count/category
  summary -- an earlier recording here said "103" by double-counting each
  failure's inline report and its final-summary recap line; corrected at P03),
  recorded at commit f60cae1b (pre-P02 track HEAD), listed verbatim at
  docs/architect/agent-coordination/verification/code-implementation-track-policy/baseline-f60cae1b.txt.
  All 51 bucket as environmental-precondition: every one requires a compiled
  target/release/{fgctl,fgos} binary that no fresh worktree here has ever
  built (cargo build --release --workspace never run); confirmed identical
  on pristine main HEAD, so not new to this track. List may only shrink.
ROSTER: doer/fixer -> claude (agy-cli/gemini and codex-cli both hit transient
  external-resource failures during this track -- see cell traces; retry with
  claude when either misbehaves), reviewer -> claude-reviewer, red-team -> codex-cli
```

(Recorded retroactively at P02, closing the gap P01's own red-team flagged as
RT-09 -- this track authors the how-to that requires this section of every
future track and had not dogfooded it on itself until now.)

## Cell status

| Cell | Merge commit | Review / red-team | Deferred findings |
|---|---|---|---|
| P01 | `06e73303` | 1 fix round; reviewer: 2 MEDIUM+4 LOW; red-team: 1 HIGH+5 MEDIUM+6 LOW (4 LOW attacks already failed on their own report), all accepted items fixed and Lead-reverified against `testedSha` (independent recheck not dispatched — session hit `aggregateBounds.maxRounds`; known limit, see cell trace) | RT-09 (this plan lacks an Execution Inputs/baseline block — now added above), RT-12c (`docs/enduser-docs-index.json` not regenerated) — see [`docs/architect/agent-coordination/verification/code-implementation-track-policy/p01.md`](../../docs/architect/agent-coordination/verification/code-implementation-track-policy/p01.md) |
| P02 | `ddb9e78e` | 1 fix round; reviewer: 3 HIGH (1 root cause: projections not regenerated)+1 MEDIUM+2 LOW; red-team: 1 HIGH (same root cause); HIGH root cause + MEDIUM fixed by Lead (build:skills regen + npm test) and fixer respectively; full-suite gate: 51/51 unique failures match the newly-recorded baseline exactly (corrected at P03 from a "103" double-count — see plan.md's own BASELINE note), 0 new | LOW-1/LOW-2 (pre-existing, not regressions); how-to gap: no documented tree-equality shortcut for the non-inference rule (fixed at P03) — see [`docs/architect/agent-coordination/verification/code-implementation-track-policy/p02.md`](../../docs/architect/agent-coordination/verification/code-implementation-track-policy/p02.md) |
| P03 | `945e6026` | 1 fix round; reviewer: 7 MEDIUM+6 LOW (no HIGH); red-team: 2 HIGH+2 MEDIUM succeeded (env-fingerprint gap; precondition-mislabeling risk; FULL_TRIGGERS mismatch; unenforced close rationale)+1 MEDIUM failed, all accepted findings fixed in one commit; also caught and corrected a real baseline-count bug mid-cell (103→51, double-counted); full-suite gate: 51/51 unique failures match corrected baseline, 0 new; 167/167 targeted pass; `treeIdentical: true` certifies `integratedSha` | tsk-1bh (engine-level authorization/quorum bugs) and dogfooding-over-real-runs both explicitly deferred by the user — see [`docs/architect/agent-coordination/verification/code-implementation-track-policy/p03.md`](../../docs/architect/agent-coordination/verification/code-implementation-track-policy/p03.md) |
| P04 | `37248760` (cell branch `code-implementation-track-policy--p04`, `testedSha` `70eb4485` — trace originally mislabeled this as "no cell branch," corrected at P05) | 3 fix rounds (at this track's own cap): reviewer 1 HIGH+1 MEDIUM+4 LOW then 3 MEDIUM+2 LOW on recheck; red-team 2 HIGH+2 MEDIUM succeeded (unenforced-gate disclosure; TOCTOU cleanup race; gitignored-trace correctness bug, fixed via `git notes` at P04 then superseded by plain tracked commits at P05; residual once-wording) then 2 MEDIUM failed on final recheck; all fixed; reviewer independently re-executed targeted suite twice (167/167 both times); coordination session could not auto-close (`tsk-1bh` recurrence on the `fixer` driver-authorized position — new evidence, same engine bug; fixed directly at P05 per reversed scope decision) | dogfooding-over-real-runs still deferred by the user — see [`docs/architect/agent-coordination/verification/code-implementation-track-policy/p04.md`](../../docs/architect/agent-coordination/verification/code-implementation-track-policy/p04.md) |
| P05 | `99fb5632` (cell branch `code-implementation-track-policy--p05`, `testedSha` `7b0af304`; `treeIdentical: true` vs `trackIntegratedSha`) | 2 review rounds: round 1 reviewer 1 HIGH (proof gap)+1 MEDIUM (`resolveTaskKeyAuthorization` still oldest-wins)+1 MEDIUM (SKILL.md contradiction)+3 LOW, red-team 1 HIGH (same root cause as reviewer's MEDIUM, found independently), all fixed; round 1 recheck reviewer confirmed by real mutation-testing + filed 1 NEW MEDIUM (orphaned authorization never retired, deferred), red-team filed 1 NEW HIGH (raw `createSessionAssignment` door could launder an unrelated task via a copied `(nodeId, operationId)` payload, since the fallback trusted raw payload fields instead of the reserved contract stamp `assignmentServesOperation` already checks) — fixed; round 2 recheck could not dispatch live (session `aggregateBounds.wallTimeMs` exhausted, partly from a Lead-side wrong-binary mistake and a repeated missing-`grantedContextRefs` mistake, both documented) — mitigated by Lead mutation-testing the fix directly; coordination session could not auto-close (`doer`/`fixer` Bash-restricted, no retroactive `partialPolicy`) — merged on Lead's own re-verification, same precedent as P01/P04 | 1 MEDIUM (orphaned authorization never retired — pre-existing, not introduced here) explicitly deferred to a future engine cell — see [`docs/architect/agent-coordination/verification/code-implementation-track-policy/p05.md`](../../docs/architect/agent-coordination/verification/code-implementation-track-policy/p05.md) |

## Open decision (owner)

Test-suite track: keep full-per-cell for all phases (Invariant #2 as written)
or keep full for P00–P02, targeted for P03–P06 with escalation, full gate at
P08. Track state at 2026-09-15 09:54: P00 has one commit on
`test-suite-feedback-cost--p00`, P01 branch created at track HEAD, no
coordination cells opened — the change costs nothing yet. Recorded here, not
applied.
