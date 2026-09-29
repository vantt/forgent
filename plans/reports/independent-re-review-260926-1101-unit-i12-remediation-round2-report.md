# Independent Re-Review Round 2 — Unit I12 (`8c025fa0f`)

```txt
Document type: Independent re-review (read-only against candidate)
Previous: independent-re-review-260926-0951-unit-i12-remediation-report.md (verdict REQUEST CHANGES @ 205d112e4)
Base: cfdaf4bc95d44a6132d03dfb635478b084e41b35 (main, unchanged)
Evaluated SHA: 8c025fa0fc35b2e5b8627b88f2978cf77bb66091 (code + docs + report in one commit)
Verdict: REQUEST CHANGES (minor — no remaining behavior, authority or result-truth defect; docs, one test seam and Track Manager sign-offs remain)
```

## 1. Git and verification

- HEAD before and after the review is `8c025fa0f`. The worktree is clean and has no operation markers.
- `205d112e4` is an ancestor of `8c025fa0f`. `git diff --check` is clean. The diff touches 15 files (+342 / −20).
- main is still at `cfdaf4bc`, so there is no drift.
- Full suite `env -u CLAUDE_CODE_SESSION_ID npm test`: 7750 tests, **7677 pass / 0 fail**, 8 skipped, 65 todo, exit 0. Matches the doer's figures.
- Brief probe with the herdr-harmonized contract: a single result path (`outbox/result-1.json`) in both the production and the real-contract case. The guardrail and the REQUIRED line are both kept.

Logs: `/tmp/claude-1000/-home-vantt-projects-forgentX/3308586f-0f33-4cd4-9c59-c15fbfbf52f6/scratchpad/i12/logs3/`

## 2. Mutation proof, round 4

Each mutation ran against 18 suites (394 tests) in a `git archive` sandbox, reset after every mutation.

| Result | Mutations |
|---|---|
| Killed (13) | M1c, M1d, M12, M13 (after-state in `cwd`), M13b, M14, M15 (swallow settled receipt), M17, M18 (swallow finalize), M20 (drop contract in `executeAssignment`), M21 (drop claim-path harmonization), M22, M23 (drop contract at authority) |
| Survived (1) | M4b: dynamic `import('../herdr-round.mjs')` in `authority.mjs` — LOW |

M22 (remove the `opts.effectiveCwd` override) is killed **only** by the new N1 test. That confirms the override exists solely for the test; see R2-1.

## 3. Status of previous findings

| Finding | Status |
|---|---|
| N1 HIGH | **Fixed + locked.** Before- and after-state are both captured in `effectiveCwd`, the comparison runs in `cwd`, as in base. The test goes through `executeAssignment`, and M13/M13b are killed. |
| N2 HIGH | **Code accepted as a documented exception; docs partly false.** See R2-2. The phase requirement R2 is not delivered and needs Track Manager sign-off. |
| N3 HIGH | **Fixed + locked.** `effectiveContract` flows `executeAssignment → executeExecutorCli → buildConfinementRequest.context → executeThroughConfinement → transport → runHerdrRound`. The claim path is harmonized to the polled outbox file. M20, M21 and M23 are killed. |
| N4 / M15 | Fixed + locked. |
| N5 `FGOS_BIN` | Removed; parity with base. |
| N6 / M18 | Fixed + locked. |
| M1c / M1d | Killed. M4b still survives (LOW). |
| Docstring / report metric | Fixed. |

## 4. Remaining findings

### MEDIUM
- **R2-1 — Production seam that only a test uses.** `executeAssignment` now accepts `opts.effectiveCwd` (`assignment-runner.mjs:1465`). It takes precedence over the compiled plan's `invocation.cwd`, so a caller can move the worker's execution cwd away from the dispatch plan. No production caller uses it; only the N1 test does, and M22 shows the test depends on it. This is unrequested API surface and weakens the plan-bound cwd invariant. Drive the test through a real compiled plan whose `invocation.cwd` is set, then remove the option.
- **R2-2 — Docs claim is false.** `dispatch-control-plane.md:285` says "no other dispatch core file imports `workflow-stage-graphs`". `assignment.mjs`, `cli.mjs` and `assignment-runner.mjs` also import it (pre-existing in base). The boundary test only covers an 11-file allowlist that leaves them out. Correct the wording, for example by listing every importer or saying "outside the listed modules".

### LOW
- M4b survives: the adapter-import lock does not catch a dynamic `import()`.
- The brief's harmonized claim path is `outbox/result-N.json`, but the persisted `effective-execution-contract.json` that the brief points to ("Persisted contract:") still says `agent-result.json`. A worker that reads that file sees a different path.
- F13 (cells can only be rolled back in reverse order; each remediation lands as one bundled commit) and F14 (probe-cache trust) are still open.

### Track Manager decisions required (the reviewer cannot accept these)
1. **R2** — Phase 09 requires the Work lookups to leave dispatch core. The candidate keeps them in `resolve.mjs` / `prepare.mjs` as a documented exception, to avoid the import cycle. Accept the deviation, or require a structural fix (break `operation-choice → assignment-runner`).
2. **R4** — Phase 09 requires deleting the argv/bwrap parser. The candidate keeps it as a fallback behind driver claims; this is disclosed in CHANGELOG. Accept, or require deletion.

## 5. Conditions for APPROVE
1. Remove `opts.effectiveCwd` and re-lock N1 through a real plan cwd (R2-1).
2. Correct the `dispatch-control-plane.md` statement (both copies) (R2-2).
3. Record the Track Manager's decisions on R2 and R4 in the plan.

Once these land, the reviewer expects to approve after a short delta review: no behavior, authority or settlement-truth defect remains at `8c025fa0f` in anything this reviewer tested.
