# Track: step-07-mvp

Document type: Verification
Design status: N/A
Implementation: Active
Last reviewed: 2026-08-31
Canonical for: step-07-mvp track status board

Plan: `plans/260831-1637-step07-inline-assignment-mvp/plan.md`
BRANCH: `step-07-mvp`
BASE_REF: `c425fe6e7dce8db683cbc92fd0bb61d6245fca6b` (main, 2026-08-31)
Test command: `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/**/*.test.mjs'`

## Known Baseline Failures (recorded before Cell 1)

Full run, 2026-08-31, exit 1. 9 failing tests total.

| Test | File | Cause |
|---|---|---|
| `import một chiều xuống: không file nào import ngược lên tầng trên` | `test/architecture.test.mjs:134` | G1 — `assignment-runner.mjs` imports `src/intake/plan.mjs`. Fixed by Phase 01 R1 (this plan's own target, not a pre-existing unrelated gap). |
| `resolvePlan skips the risk-heavy gate when the verdict cites a real locked decision...` | `test/intake/plan.test.mjs:953` | G2 — `resolvePlan` `.fgos` basename assumption. Separate item per plan.md, not in this plan's scope. |
| `resolvePlan skips requiring a verdict...mode "tiny"` | `test/intake/plan.test.mjs:1198` | G2, same cause. |
| `resolvePlan skips for mode "small" too...` | `test/intake/plan.test.mjs:1215` | G2, same cause. |
| `resolvePlan caller-supplied decompose verdict: an uncovered locked-decision path...` | `test/intake/plan.test.mjs:1588` | G2, same cause. |
| `ask/answer round-trip on a genuinely legacy durable-doing item...` | `test/cli/fgos-intake-4.test.mjs:318` | G7 — known flake, ask/answer round-trip. Not in this plan's scope. |
| `e2e pr-gate (a) runner item full loop...` | `test/e2e/pr-gate.test.mjs` | G4 — verify-skip via `branchHeadAtReturn` (security-relevant, separate item). |
| `e2e self-improve loop full contract (D1-D17)...` | `test/e2e/self-improve-loop.test.mjs:325` | G4, same cause (`verify skipped: the merged tree is identical...`). |
| `herdr-spawn adapter (LIVE): dispatch a real agy-herdr interactiveMode executor...` | `test/runner/herdr-spawn-adapter.test.mjs:562` | Environment — live test needs real herdr binaries, unavailable in this session. Unrelated to plan scope (herdr-spawn work is explicitly deferred until interactive+cli-spawn proofs close, per plan.md mechanism/driver priority). |

Baseline list may only shrink (G1's entry is expected to close once P01.1
lands; G2/G4/G7/herdr-live stay open, out of this plan's scope, and must not
grow).

## Unrelated Working-Tree State At Track Start

Noted, not touched by this track: `.agentkit/`, `.claude/agents/*.md`,
`.fgos/events/*.jsonl`, `plans/reports/reviewer-cell-6-6-...-report.md`
(untracked, pre-existing before branch creation).

Noted mid-track (during P03.3, 2026-09-01), also not touched by this
track: `.fgos/config.json` shows a modified working-tree state
(`executors.codex`/`.pi`/`.glm` renamed to `.codex-cli`/`.codex-pi`/
`.glm-cli`) that no cell in this track made — apparently concurrent work
from elsewhere in this shared checkout. Left alone; not staged by any of
this track's own commits.

## Phase / Requirement Matrix

| Phase | Req | Status | Cell | Evidence |
|---|---|---|---|---|
| P01 | R1 (G1) | done | P01.1 | `P01.1.md`, commit `07f2d943` |
| P01 | R2 (G6) | done | P01.1 | `P01.1.md`, commit `07f2d943` |
| P01 | R3 (G5) | done | P01.2 | `P01.2.md`, commit `d97837d3` |
| P01 | R4 | done | P01.2 | `P01.2.md`, commit `d97837d3` |
| P01 | R5 | done | P01.2 | `P01.2.md`, commit `d97837d3` |
| P02 | R1–R4 | done | P02.1 | `P02.1.md`, commit `0fdd61d9` |
| P02 | R5 | done | P02.2 | `P02.2.md`, commit `d2df76cc` |
| P02 | R6 (G3) | done | P02.3 | `P02.3.md`, commit `b262ced1` |
| P02 | R7 | done | P02.4 | `P02.4.md`, commit `cfe60bfb` |
| P02 | R8 | done | P02.5 | `P02.5.md`, commit `a77b95ef` |
| P03 | R1–R2 | done | P03.1 | `P03.1.md`, commit `2a22c93c` |
| P03 | R3 | done | P03.2 | `P03.2.md`, commit `7abe80c4` |
| P03 | R4–R6 | done | P03.3 | `P03.3.md`, commit (pending, this close) |

Cell split deviates from plan.md's suggested "P02.2 (R5+R6), P02.3
(R7+R8)" — Coordinator split R5/R6 into separate cells (P02.2, P02.3)
after reading `interpretAssignmentRunResult`/`findLatestAssignmentRunResult`
directly: ~420 and ~300 lines respectively, carrying explicit
tamper-detection/monotonic-re-derivation security invariants; bundling R5's
broad dispatch-key rewrite with R6's narrow dirty-before-persistence fix in
one cell risked one change masking a regression in the other. R7/R8 shift
to P02.4. Total cell count for Phase 02 rises from 3 to 4; this is a
tactical cell-sizing decision within Coordinator authority, not a scope
change to the plan's requirements.

## ADR Traceability

One row per ADR-006/ADR-007 Decision-section clause, pulled fresh from
each ADR's own numbered list (not from memory), cross-referenced against
this track's own closed cells for a unit-test home vs. proof-only
coverage (R6).

| ADR | Clause | Summary | Unit-test home | Live-proof confirmation |
|---|---|---|---|---|
| ADR-006 | §1 | Two provenance classes, one Assignment (`provenance.kind`, `contractPolicyVersion`, `normalizerVersion`, validator chain) | `test/runner/assignment-provenance.test.mjs` (P02.1) | P03.3 Proof 1/2: both `assignment.json`s carry `provenance.kind: "inline"`, `contractPolicyVersion`, `normalizerVersion`, `validators` |
| ADR-006 | §2 | Normalizer stamps `mutation`/`evidence.required` at build time; missing value is a build failure, never a default | `test/runner/assignment-normalizer.test.mjs` (P02.1) | P03.3 Proof 1/2: both contracts declared `mutation`/`evidence.required` explicitly; a contract omitting either is rejected before build (already covered negative-test territory, not re-exercised live here) |
| ADR-006 | §3 | Interpretation reads the Assignment (`resultKind`, `onAdvance`), not the operation id | `test/runner/operation-choice.test.mjs` (P02.2) | Follow-Ups (`loop.mjs`'s planning sweep still computes its own verdict directly rather than consuming `outcome.verdictPayload`) notes this is only fully realized on the declared path — inline Assignments carry no `resultKind`/`onAdvance` branch to begin with (non-driving, ADR-007 §3) |
| ADR-006 | §4 | Minimum inline contract field set; unknown fields rejected | `test/runner/execution-contract.test.mjs` (P02.1) | P03.3 Proof 1/2: both contract files hand-authored strictly from this field list; both accepted |
| ADR-006 | §5 | Same stores and governance for both provenance classes (`.fgos/assignments/`, `executeAssignment()`, `compileDispatchPlan`, same Run/RunResult normalization) | `test/runner/assignment.test.mjs`, `test/runner/assignment-runresult.test.mjs` (P02.1) | P03.3 Proof 1/2: both ran through the identical `execute --contract` -> `executeAssignment()` -> `compileDispatchPlan` path P03.2's declared-path callers also use; no separate code path exercised (satisfies Phase 03's own Risk stop-gate: no foundation-boundary mismatch found) |
| ADR-006 | §6 | First slice is read-only; a `mutation: 'mutating'` inline contract is rejected fail-closed; no session/coordination reference in this slice | `test/runner/execution-contract.test.mjs` (P02.1), `test/runner/assignment-dispatch.test.mjs` (P03.2, R3.2's mutating-contract-exits-non-zero tests) | P03.3 Proof 1/2: both contracts `mutation: "read-only"`, neither carries any of the forbidden session fields; both settled with `gitBefore === gitAfter`, `changedFiles: []` |
| ADR-006 | §7 | Retire the standalone `missionId \|\| workId === null` read-only heuristic once no declared caller passes `workId: null` | `test/runner/mission-lite.test.mjs`, `test/runner/assignment.test.mjs:229` ("isReadOnlyAssignment no longer infers read-only from missionId/workId:null", P02.4) | n/a — a removal, confirmed by the heuristic's absence from the current source (P02.4's own diff), not something a live proof re-demonstrates |
| ADR-007 | §1 | One pure seam per domain (`enrichAndValidateContract`); may add contextRefs/constraints/evidence rule/policy hints; may reject; may not dispatch, choose executor/provider/tier, or touch Work lifecycle | `test/runner/enrich-and-validate-contract.test.mjs` (P03.1, R1.1-R1.4) | P03.3 Proof 1's own objective is a fresh, independent live re-read of every one of these four guarantees against the current source (`verdict: "match"`, zero mismatch); P03.3 Proof 2: `assignment.json`'s harness-added `contextRefs`/`constraints`/`expectedOutputs` visible on a real run |
| ADR-007 | §2 | Standalone uses the generic validator only — the evidence the foundation boundary does not depend on any domain | `test/runner/assignment-provenance.test.mjs`: "buildAssignment (inline) skips the harness seam entirely when no domain is resolvable ... — ADR-007 §2" (P03.1, R1.5) | P03.3 Proof 1: real live run, `provenance.validators` is `["execution-contract-schema"]` only (no `"domain-harness-seam"`), zero `stage`/`domain`/`taskSpec`/`operation` field anywhere in the persisted `assignment.json` |
| ADR-007 | §3 | Inline-on-Work is supporting, never driving: `supports` must name a legal Stage Operation (harness rejects otherwise); a declared Stage Operation must use the declared path; the RunResult of an inline Assignment is non-driving evidence | `test/runner/enrich-and-validate-contract.test.mjs` (P03.1, R1.1, `supports` legality); `test/runner/operation-choice.test.mjs` (P03.1, R2.1, non-driving filter) | P03.3 Proof 2: real run against a real Work at `stage: planning`, `contract.supports: "shape-plan"` (a real legal operation) accepted; `provenance.validators` includes `"domain-harness-seam"`; Work's `stage`/`status` provably unchanged after the run; `dispatch.mjs decide --work` output byte-identical before/after the run, proving the driver's next-operation choice ignored the inline RunResult |
| ADR-007 | §4 | No registry or lifecycle hooks yet — additional seams require a second real consumer demonstrating the need | n/a — a design constraint (an absence), not a positive behavior a unit test asserts | n/a — confirmed by inspection: `domains/coding/harness/` contains exactly one seam file, no registry/plugin-loader module exists anywhere in `src/runner/dispatch/`; P03.3's own two proofs are themselves the "two unlike consumers" (standalone read-only reviewer vs. Work-attached planning advisor) this ADR's own Rejected Alternatives cites as the bar for ever building one |

Phase 01 (R1-R5, `plans/260831-1637-step07-inline-assignment-mvp/phase-01-execute-assignment-hardening-and-plan-verdict-derivation.md`)
is prerequisite groundwork (G1/G6 hardening, `planVerdictFromPlanMd`) for
Phase 02's `onAdvance` wiring — it does not itself implement an ADR-006/007
clause and has no row above.

## Follow-Ups (Out Of Scope, Logged For Later Phases)

- Run-attempt-dir allocation race (`assignment-runner.mjs:618-634`):
  `readdirSync`/`existsSync`/`mkdirSync({recursive:true})` is not atomic;
  two concurrent `executeAssignment()` calls could claim the same `runs/NN`
  dir and silently mix evidence. Pre-existing, found by P01.1 Red-Team
  (RT-2, LOW, deferred). Fix direction: `mkdirSync` without `recursive`,
  retry next number on `EEXIST`. Pick up whenever a future phase next
  touches this function.
- `loop.mjs`'s planning sweep still computes its own plan-verdict directly
  (`resolveContentRoot` + `readFileSync` + `planVerdictFromPlanMd`, from
  Cell P01.2) instead of consuming `executeDriverOperationChoice`'s new
  `outcome.verdictPayload` field (P02.2's `onAdvance` wiring, which is
  correct in isolation but currently dead output on the real end-to-end
  path). Found by P02.2 Review (MEDIUM-2, deferred). Consolidate once
  R6/R7/R8 have finished changing this same interpretation surface, so the
  consolidation isn't redone mid-phase.
- P02.1's `RESULT_KIND_BY_OPERATION`/`EVIDENCE_REQUIRED_BY_OPERATION`
  tables stamp the same `resultKind` for `scout-blast-radius`/
  `resolve-question` (`advisory`) and for `fix-verify-red`/`scoped-subtask`
  (`work-product`), forcing P02.2's `interpretAssignmentRunResult` to add
  `operation` as a compound secondary key for those four branches — R5's
  ADR-006 §3 intent ("replacing `operation === ...` branches") is only
  fully realized for 2 of 6. Found by P02.2 Review (MEDIUM-3, accepted as
  a design trade-off, not reopened since P02.1 is already closed/verified).
  Widen the tables for finer-grained `resultKind` values if a future phase
  wants full realization.
- `findLatestAssignmentRunResult`'s two cross-pass callers
  (`chooseStageOperation`) never receive the real, disk-persisted
  `resultKind`/`mutation`/`evidence` fields it already reads during its own
  filter step — `interpretAssignmentRunResult` re-derives them fresh via
  `fallbackResultKindForOperation` instead. Found by P02.2 Red-Team
  (MEDIUM-4). Currently zero live impact (deterministic re-derivation
  matches the persisted value under the one existing `normalizerVersion`);
  becomes a real staleness risk the first time `assignment-normalizer.mjs`'s
  tables gain a second version. Fix direction: have
  `findLatestAssignmentRunResult` attach a `{resultKind, mutation,
  evidence}` slice (never the whole raw `assignment.json`) onto its
  returned `runResult` as `.assignment`. Deferred rather than fixed now
  because it touches the return shape of the codebase's highest
  tamper-detection-sensitivity function for a presently zero-impact issue.
- Code comments and test titles in already-closed, already-committed
  cells P02.2 and P02.4 carry embedded cell/finding labels (`P02.2`,
  `P02.4`, `Red-Team HIGH fix`, `Review HIGH fix`) in violation of the
  master coordinator prompt's own "Stable Code Artifacts" rule (no cell/
  finding IDs in code comments or test names). Found by P02.5's own
  Fixer round flagging the same pattern about to be introduced fresh;
  fixed going forward in P02.5 (not yet committed at the time), but the
  already-committed instances were NOT retroactively touched (would mean
  amending closed cells, separately forbidden). Locations:
  `operation-choice.mjs:1609,1642`, `assignment-runner.mjs:32,603`,
  `mission-lite.mjs:359`, `assignment-runresult.test.mjs:155`,
  `operation-choice.test.mjs:5365`, and (found during P03.1's Coordinator
  Verification while grepping the diff for the same pattern)
  `assignment-provenance.test.mjs:76` (`"...untouched this cell"`, a
  pre-existing test title, not touched by P03.1's own diff). Comment/
  test-name wording only, zero behavior change — safe cleanup whenever
  convenient, does not block Phase 03.
- `--work <id>` lookup (`cli.mjs:621` in the pre-existing `decide --work`
  branch, and reused verbatim by P03.2's `--contract --work` branch) does
  unguarded bracket access (`listWork(fgosDir).work[workIdArg]`) against a
  plain object literal, so a `--work` value matching a JS built-in
  property name (`__proto__`, `constructor`, `toString`, etc.) silently
  resolves to that prototype value instead of erroring "no work item
  found". Found by P03.2 Red-Team (LOW — no privilege escalation or
  Work-lifecycle mutation found; the resolved "work" carries no
  `stage`/`domain`/`id`, so the practical effect is the same as omitting
  `--work` entirely, just without the honest error). Fix direction:
  `Object.prototype.hasOwnProperty.call(...)` guard at both call sites, or
  switch `state/store.mjs`'s `currentEffectiveView` `work` map to
  `Object.create(null)` at the source so every consumer gets it for free.
  Cross-cutting both call sites — pick up in a future cell that touches
  either one.
- `current-cell.md`'s Proof 1 instructions (P03.3) asked for a
  `preferExecutor: "claude-reviewer"` policy-hint contract field that does
  not exist in `execution-contract.mjs`'s `ACCEPTED_CONTRACT_FIELDS` — the
  Doer correctly omitted it (executor selection resolved via the existing
  `isReadOnlyAssignment` redirect instead) but this was undocumented until
  P03.3 Red-Team caught it. No fix needed — either add a real
  `preferExecutor`-style contract field in a future phase if inline
  callers need to hint an executor, or update the cell-authoring template
  to stop suggesting a field that doesn't exist.
- `renderAssignmentPrompt` (`src/runner/dispatch/assignment.mjs:612-670`)
  never states the `{status, summary}` minimum shape
  `validateAgentResultClaim` actually requires of `agent-result.json` for
  a standalone inline Assignment (one with no TaskSpec to document that
  schema) — a declared operation's TaskSpec markdown documents it, but an
  inline contract has none. Found live by P03.3 Proof 1: the executor did
  genuinely correct work but wrote its own reasonable, non-conforming JSON
  shape, and settled `status: "failed"` purely on the schema mismatch, not
  the underlying answer's quality. Coordinator accepted this as a real,
  non-blocking finding (Non-Goals forbade a source change in P03.3 itself)
  — see `P03.3.md`'s Gaps and `proof-1-standalone-inline-read-only.md`'s
  "Genuine finding" section for the full trace. Fix direction: render the
  `{status, summary}` minimum shape into `renderAssignmentPrompt`'s
  "Result artifact" block unconditionally, for every Assignment (declared
  or inline), not only TaskSpec-documented ones.

## Active Cell

None. P03.3 (R4-R6) is closed — see `P03.3.md`. Both live proofs ran for
real against the configured `claude-reviewer` executor and were
independently verified authentic by Coordinator, Reviewer, and Red-Team
against raw artifacts; ADR Traceability populated (11 rows); 2 MEDIUM
docs-citation defects found and fixed, 1 LOW documentation gap logged.
Phase 03 (R1-R6) is now fully done. **All three phases of this plan are
now done.**

## Next Action

Plan complete. Proceed to master-coordinator.md step J (COMPLETE): final
full-suite run (done, this close — 4643/4630/8-fail, matches baseline),
set `plan.md` Status: done, update ADR-006/ADR-007 `Implementation:`
metadata, add a pointer from the Step 07 checkpoint to this index, commit
`docs(step-07-mvp): close step-07-mvp`, emit the final report.
