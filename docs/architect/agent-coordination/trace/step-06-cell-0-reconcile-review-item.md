# Cell 6.0 — Reconcile In-Flight Review-Item Verdict Routing

Status: done
Date: 2026-08-30
Cell brief: `current-cell.md` (Cell 6.0)

## Goal

Make `test/runner/loop.test.mjs` pass 84/84 by finishing the in-flight
`executing.review-item` verdict routing, without weakening assertions or
changing workflow YAML / FSM / store.

## Result

Green. One-line root-cause fix in `operation-choice.mjs`; loop.mjs untouched
(net).

## Root cause

`src/runner/dispatch/operation-choice.mjs` called `execFileSync` (lines 224,
307 — the `fgw/<id>` candidate-branch existence checks inside
`isResolvableDiffRef` / `isResolvableVerifyRef`) without importing it from
`node:child_process`. The bare `try { ... } catch {}` around each call
swallowed the ReferenceError, so both resolvers returned `false` whenever the
only evidence was an existing candidate branch. `deriveCandidateReviewRefs`
then reported `canProduce: false`, `chooseStageOperation` hit the
`review-item-missing-candidate-diff-and-verify-refs` pre-gate, and every
review-item with real refs stopped before any Assignment ran — REJECT never
routed to fix, APPROVED never reached the goal-check verify / awaiting-approval
settle.

The evidence-gate test (no refs) stayed green because it never reaches the
branch-existence fallback — the dead code only manifested when refs existed.

## Code paths touched

- `src/runner/dispatch/operation-choice.mjs:12` — added missing
  `import { execFileSync } from 'node:child_process';` (the sole production
  change; justification: the defect is provably in this module — the symbol is
  referenced at lines 224 and 307 but was never imported, so the
  branch-existence fallback was dead code).
- `src/runner/loop.mjs` — diagnostic-only edit during diagnosis, fully
  reverted; net diff for this cell is zero in loop.mjs.

## Commands run

- `node --test --test-name-pattern "REJECT verdict on existing candidate|APPROVED verdict and passing|APPROVED verdict but failing" test/runner/loop.test.mjs` — 3 fail (length 1≠2 / stopped≠awaiting-approval) → after fix 3 pass.
- Minimal git-fixture replication of `deriveCandidateReviewRefs` — before fix `canProduce: false` with `fgw/<id>` present; after fix `canProduce: true`.
- `node --test test/runner/loop.test.mjs` — 84 tests, 84 pass, 0 fail.
- `node --test test/runner/assignment-runresult.test.mjs` — 22/22 pass.
- `node --test test/runner/assignment-dispatch.test.mjs` — 12/12 pass.
- `node --test test/runner/operation-choice.test.mjs` — 93/93 pass.
- `node --test test/e2e/runner-loop.test.mjs` — 15/15 pass.
- `node --test test/cli/fgos-stage.test.mjs` — 19/19 pass.

## Classification

- `operation legality bypass` variant: the legality evidence gate (candidate
  refs resolvable) mis-reported "unresolvable" for valid refs, blocking a
  legal review-item dispatch — reverse direction of the usual bypass (legal
  op wrongly denied), not an authority leak.

## Gaps / notes

- Cell doc's regression list names `test/router/assignment-dispatch.test.mjs`;
  actual path is `test/runner/assignment-dispatch.test.mjs` (12 tests, green).
- No new modules, no workflow YAML change, no test edits, no commits.
- The in-flight dirty baseline (Step 05/06 work) is otherwise untouched.

## Fix round 2 (red-team gate exploits, tests first)

Evidence contract after this round: resolvers resolve to on-disk artifacts or
git refs only. Inline text in refs ("EXIT CODE: 0", `diff --git`), report-text
claims, and caller-declared booleans/content strings (`hasCandidateImplementation`,
`candidateDiffContent`, ...) are verdict-interpretation input, never evidence.

Findings -> test -> fix mapping (negative tests added first, all red, then fixed):

1. Unqualified ref check (:224/:307) — tag named `fgw/<id>` counted as branch.
   Test: `review evidence gate: a tag named fgw/<id> ...` (operation-choice.test.mjs).
   Fix: branch evidence is `git rev-list --count <trunk>..refs/heads/fgw/<id>`
   (trunk via `detectTrunk`) — >= 1 commit ahead closes findings 1+2 on the diff side.

2. Bare early-mint branch satisfied BOTH gates. Tests: `...zero-commit fgw/<id>
   branch produces no candidate evidence`, `...commits ahead of base resolve the
   diff gate but never the verify gate`. Fix: diff gate needs commits ahead of
   base; verify gate lost its branch fallback — resolves via verify artifacts on
   disk, or via the Work's configured `verify` check (what runGoalCheck re-executes
   at the approve edge) only when a candidate exists independently. One ref
   string can no longer satisfy both gates; a branch-with-commits plus a
   configured verify command still passes both (by design — the approve edge
   re-executes the verify, so this residual costs one review dispatch, never an
   approval). `work.verify` outcome is re-derived, never trusted.

3. Stale repoRoot convention files fabricated evidence. Test:
   `...convention artifacts older than the Work item are stale...`. Fix: name-
   implied convention artifacts (candidate-diff.patch/candidate.diff/patch.diff,
   verify.log/verify-result.json at repoRoot) require file mtime >= the Work
   item's createdAt/submittedAt (plan.md-style correlation, fail closed);
   ref-named explicit paths also get the same mtime correlation via
   `onDiskArtifactForWork` (the ref is the binding, mtime is the liveness check).

4. Self-attesting strings counted as evidence. Test: `...string-only refs and
   inline text claims are never evidence`. Fix: removed the inline-text regexes,
   report-text regex, and all `candidateDiffContent/candidateVerifyContent/
   hasCandidateDiff/hasDiffContent/hasCandidateVerify/hasVerifyOutput/
   verifyOutput/hasCandidateImplementation` paths from both resolvers.
   Operation SELECTION via `hasCandidateImplementation` (operation-choice.mjs:574)
   is untouched — only its evidentiary role is gone.

Baseline test repairs (14 tests, all in operation-choice.test.mjs; fixtures
re-grounded on real evidence):

- Group A (10): content-string signals were scaffold to reach a downstream
  gate (report-artifact / insufficient-evidence / binding). Each now plants
  real artifacts instead — convention files in tempDir (candidate-diff.patch +
  verify.log) or ref-named files (custom-candidate-diff / custom-verify-pass).
  No assertion changed. Covers: 'approval is not a Work lifecycle edge',
  'validate-plan and review-item require report artifact...',
  'evidenceRefs must be bound...', 'no agent-report.md', 'keyword-only report
  text', 'P2 fix ... missing report artifact', 'Positive tests: real valid
  reports...', 2x findings-tie negatives, 'Finding 4 negative test ... refs'.
- Group B (3): the positive case itself WAS the exploit (boolean signal alone =
  evidence in an empty repo): 'Finding 4: ...signal binds...contextRefs',
  'P1 fix: ...real bound diff/verify refs still passes', 'Finding 2 regression
  tests'. Re-grounded with a real candidate (initRepo + commits on fgw/<id> +
  work.verify); assertions hold. Assertion contract change of record: the
  'Finding 2 regression tests' positive block previously accepted
  `contextSignals.candidateDiffContent/candidateVerifyContent` strings as
  evidence — that contract encoded the finding-4 exploit.

Two `candidateDiffContent` pass-throughs remain in green executeDriverOperationChoice
tests ('Step 06 executing.review-item reject routes...', 'Step 06 Herdr and
visibility tracking...') — now inert scaffold, left to keep the diff minimal.

Commands run (one line each):

- negative tests before fix: 5/5 red; after fix: 5/5 green.
- `node --test test/runner/operation-choice.test.mjs` — 14 baseline red after fix -> repairs -> 98/98 (93 + 5 new).
- `node --test test/runner/loop.test.mjs` — 84/84, none weakened.
- regression: assignment-runresult 22/22, assignment-dispatch 12/12,
  e2e runner-loop 15/15, fgos-stage 19/19 (all green).

Status: done. Code touched: src/runner/dispatch/operation-choice.mjs (resolver
rewrite + helpers) and test/runner/operation-choice.test.mjs (5 negatives +
14 re-groundings). loop.mjs untouched this round.

Gaps: convention-file mtime correlation binds to the item's existence window,
not the specific producing run; ref-named paths keep plain existence (the ref
is the binding) — deeper run-dir binding is deferred hardening (same bucket as
the execFileSync timeout note).

## Close-out (coordinator, 2026-08-30)

Final status: **done**. Round-2 review verdict: safe to close (2 LOW trace
corrections applied above; no code finding). Coordinator re-ran the full
battery: loop 84/84, operation-choice 98/98, assignment-runresult 22/22,
assignment-dispatch 12/12, e2e runner-loop 15/15, fgos-stage 19/19 — all green.

Deferred-hardening candidates (not blockers, carry to later hardening pass):

1. Selection-level verify gate is intentionally looser (branch+commits plus
   configured work.verify passes both gates); hard gate remains runGoalCheck
   at the approve edge (loop.mjs:938).
2. runResult.evidence.artifacts path check keeps plain existence; bind to run dir.
3. Deeper run-dir binding for convention artifacts + clock-skew tolerance.
4. execFileSync timeout in resolvers (hung git blocks the loop).
5. rev-list-per-ref perf in candidateBranchAheadOfTrunk.
6. Trace/proof boundary: commit the in-flight baseline so cell-vs-baseline
   edits become git-verifiable (user decision).
