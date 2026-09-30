# Independent Review — Unit I14: Explicit DAG Close

## Verdict

**APPROVE** — no BLOCKER/HIGH. One MEDIUM (plan status wording) should be corrected at or right after merge; LOW items are non-blocking.

## Identity

| Field | Value |
|---|---|
| Candidate branch | `coordination-skill-harness-i14-explicit-dag-close` |
| Candidate worktree | `.claude/worktrees/coordination-skill-harness-i14-explicit-dag-close` |
| Candidate SHA | `f857eaeabad7843500684f166f29226e200ed293` (single commit on base) |
| Base (I13 merge) | `dc05f7586b78483d569bc25b929b988dc56a374c` — `merge-base --is-ancestor` exit 0 |
| Doer report | [phase-03d-i14-explicit-dag-close-implementation-report.md](phase-03d-i14-explicit-dag-close-implementation-report.md) |
| Dirty before review | clean (`git status --short` empty) |
| Dirty after review | clean except this report; HEAD unchanged `f857eaea` |

## Changed files (`git diff --name-status dc05f7586...HEAD`)

| Status | File |
|---|---|
| M | `CHANGELOG.md` (+1) |
| M | `plans/260919-coordination-skill-harness-simplification/plan.md` (+3/−3) |
| A | `plans/260919-coordination-skill-harness-simplification/reports/phase-03d-i14-explicit-dag-close-implementation-report.md` |
| M | `src/verbs/coordination/run.mjs` (+4/−3) |
| A | `test/runner/coordination-dag-explicit-close.test.mjs` (398 lines, 7 tests) |

No unrelated files. No new store, lifecycle, scheduler, daemon, or close authority.

## Impact analysis

- Capability posture: **Degraded**. `npx gitnexus impact runCoordinationUseCase --direction upstream --repo /home/vantt/projects/forgentX` → exit 1, `impactedCount: 0`, `risk: UNKNOWN`, `staleness: behind, commitsBehind: 259`. The zero is an index-staleness artifact, not evidence of no callers. Blast radius **not confirmed by GitNexus**.
- Actual modified symbol is `executeCoordinationRunKernel` (the kernel `runCoordinationUseCase` delegates to), not `runCoordinationUseCase` itself.
- Text cross-check (`grep`) of callers of `runCoordinationUseCase|executeCoordinationRunKernel`: `src/runner/coordination/headless-adapter.mjs`, `src/verbs/coordination/{run,group-thinking-pack,actions,launch-master-loop,start}.mjs`, `bin/fgos.mjs`, skills `fgos-plan-loop`, `fgos-group-thinking`, protocol `architecture-advisory-panel-v1.yaml`, 18 test files.
- No `src/`, `bin/`, or `core/skills` code builds a `dag: true` request, so no in-repo producer relied on implicit DAG close. DAG requests come from driver-authored JSON.
- Doer reported CRITICAL (48 symbols) from `node .gitnexus/run.cjs impact ... --summary-only`. Treat as CRITICAL-rated public kernel entry. The mitigation holds: the change only gates the close decision after scheduling finishes, and scheduling, quorum, CAS, and replay code are untouched.

## Semantic review

The diff (`run.mjs:916-919, 976`) adds `explicitCloseRequested = request.close === true || steps.some(type==='close')` and gates the DAG branch of `shouldAttemptClose`/`closeAttempted` on it. The non-DAG branch is the same expression as before, hoisted into a variable.

| Invariant | Result | Evidence |
|---|---|---|
| DAG requests no longer auto-close on settle | ✅ | test 1 (`closed:false`, `closeAttempted:false`, manifest `active`, no `session-closed`); mutation check below |
| Close only via explicit `close:true` / close step / close door | ✅ | test 2 (`close:true` → `completed`), test 3 (`closeCoordinationUseCase` after open run) |
| Non-DAG explicit-close unchanged | ✅ | non-DAG expression byte-equivalent; test 6 covers none / `close:true` / close step |
| Caveat refusal reason still reported | ✅ | `closeRefusalReason` assignment untouched; test 4 with and without `close:true` |
| Partial / caveated / in-flight visible, no silent close | ✅ | `hasPartialDagOutcome` (deferred/refused/blocked/materialized) still vetoes; test 5 deferred + `close:true` → no close; `dag.counts`/`inFlightOutsideInvocation` untouched |
| Legacy schema/session replay unchanged | ✅ | replay/store not touched; `coordination-replay` + `coordination-legacy-schema-compatibility` green |
| Corrupt/refused RunResult cannot settle descendants or close | ✅ | refused → partial → no close attempt; `coordination-dag-corrupt-evidence` green |
| No second close authority | ✅ | still single `closeSessionByQuorum` call site in kernel |
| No dispatch-boundary change | ✅ | no dispatch files in diff |
| Mutation-sensitive | ✅ | see below |

**Mutation check.** I temporarily reverted the DAG branch in `run.mjs` to the old `(!hasPartialDagOutcome && !hasDagCaveat)`. `node --test test/runner/coordination-dag-explicit-close.test.mjs` then gave rc=1 with 3/7 failing (no-auto-close, left-open-then-close-door, replay-stays-active). The file was restored with `git checkout --`; the worktree was clean at HEAD `f857eaea` afterwards.

**Current docs.** No canonical spec, contract, or skill still claims implicit DAG close. `docs/platform/agent-coordination/proposals/dag-request-scheduler.md:457` ("`closeSessionByQuorum` runs only when every DAG node settled") is a Discussion-status proposal that states a necessary condition, not an auto-close claim. `verification/runtime-recovery/p02l.md` describes historical quorum auto-complete, which is not a DAG close path. Nothing is stale.

## Verification commands

All commands were run from the candidate worktree with `CLAUDE_CODE_SESSION_ID` unset.

| Command | Exit | Counts |
|---|---|---|
| `git merge-base --is-ancestor dc05f7586... HEAD` | 0 | — |
| `git diff --check dc05f7586...HEAD` | 0 | clean |
| `node --test <each of 12 focused files>` individually | 0 ×12 | — |
| `node --test` 12 focused files combined (explicit-close, dag-migration-matrix, dag-cold-resume, dag-concurrency, dag-corrupt-evidence, dag-deferred-probes, replay, legacy-schema-compatibility, run-driver-steps, chain, p07-migration-and-adversarial, skills/dag-driver-skill-contract) | 0 | 210 tests / 210 pass / 0 fail |
| Mutation: old DAG close logic + explicit-close test | 1 (expected) | 4 pass / 3 fail |
| `npm test` run 1 | 1 | 7757 tests, 27 suites, 7682 pass / **2 fail** / 8 skipped / 65 todo |
| Isolated rerun ×3 of both run-1 failures (`--test-name-pattern`) | 0 ×6 | 1/1 pass each |
| `npm test` run 2 | 0 | 7757 tests, 27 suites, **7684 pass / 0 fail** / 8 skipped / 65 todo (matches doer) |

Run-1 failures were both wall-clock overlap assertions under full-suite load:
- `test/runner/coordination-research-fan-out.test.mjs:462` "R5 concurrency … maxConcurrency: 2": `expected both branches to settle without a long retry/hang (elapsed 4784ms)`.
- `test/verbs/coordination-run-driver-steps.test.mjs:2149` "Phase 05: peer frontier overlaps…": `two-peer 7165ms; one-peer baseline 1397ms`.

I classify both as the known timing instability (plan.md, I08: "timing instability recorded as LOW debt"), not an I14 regression. The I14 change runs only after scheduling and dispatch complete, so it cannot affect dispatch overlap timing. Both tests passed 3/3 in isolation, and the same `run-driver-steps` file passed whole in the focused matrix.

## Findings

| ID | Sev | Finding | Recommendation |
|---|---|---|---|
| R-01 | MEDIUM | `plan.md` header and I14 unit status say "Phase 4 entry gate satisfied", but the gate (`plan.md` Phase 4 Entry gate) requires I14 to be **integrated**. The candidate is unmerged, and the status has no candidate SHA. The commit message also claims "Satisfy Phase 4 entry gate". | At merge, the Lead rewrites the status to `VERIFIED/integrated at main@<merge-sha>` (candidate `f857eaea`) and states that the gate is satisfied only then. Do not open Phase 4 off the branch. |
| R-02 | LOW | Test "Legacy session replay remains identical" builds a fresh schema-v3 DAG session, so it does not exercise legacy schema. Legacy coverage actually comes from `coordination-legacy-schema-compatibility.test.mjs` (green). | Rename it to describe what it asserts (replay of an unclosed DAG session stays active, with no `session-closed`). |
| R-03 | LOW | DAG + a `close` **step** (as opposed to `close:true`) has no test. `explicitCloseRequested` accepts it, and the DAG compiler admits the step as a node, but the DAG scheduling of a close-step node is unverified. | Add one test: DAG request with a trailing `{type:'close'}` step closes when all nodes settle. |
| R-04 | LOW | DAG + `close:true` + partial outcome skips close with no `closeRefusalReason`, so the caller asked to close and gets no reason. This predates I14, but it matters more now that close is always explicit. | Follow-up: set a reason like `partial-outcome: …` when explicit close is vetoed by a partial DAG outcome. |
| R-05 | LOW | Test names carry the plan label `Unit I14:`. Stable-code-artifacts rule: no plan IDs in test names. This is the only test file doing it. | Drop the `Unit I14:` prefix. |
| R-06 | LOW | The CHANGELOG line names `close: true` and the close door but omits the `close` step form. | Add "or a `close` step". |
| R-07 | LOW (pre-existing) | Non-DAG `closeAttempted` is `Boolean(request.close)`, which ignores a close step, while `shouldAttemptClose` honours one. Unchanged by I14. | Optional follow-up: use `explicitCloseRequested` for both branches. |

## Phase 4

Phase 4 **may open after this branch is merged to main** and the post-merge status records the integrated SHA (R-01). It must not open from the unmerged branch.

## Unresolved questions

- The GitNexus index is 259 commits behind. Should someone run `node .gitnexus/run.cjs analyze` before the next unit so its impact reports are trustworthy again?
