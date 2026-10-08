# Advisory M — second-review fixes and acceptance protocol

## Status: DONE_WITH_CONCERNS; owner decides landing

Round2 review confirmed the seven preceding fixes. The earlier Herdr landing blocker was an agent-session/environment failure, not a regression: reviewer ran with `CLAUDE_CODE_SESSION_ID` unset, **6991 tests;6918pass;0fail;8skip;65todo**, including the real Herdr test20. No third review is required; owner checks and decides. No push, merge, main edit, activation or native advisory run. M deadline remains end2026-10-10.

## Frozen baseline and scope

- Pre-M snapshot: `0e8433c0c`, tag `advisory-pre-m-snapshot`, never merge wholesale. M: `feat/advisory-path-m`, `/home/vantt/projects/forgentX-worktrees/advisory-path-m`.
- Original budget baseline: `a0226f02239e978dc93f328d336076d7fa68b6e2`. Prior source102; round2 adds loop3 plus read-grant11 = **116/200**. Canonical skill142/200, generated full renders143, reopen48/60. Docs69/100 against that original baseline, not these new commits.
- Exactly two dispatch exceptions: `dispatch/cli.mjs` scoped run/input/report-directory access, now28 changed lines; `dispatch/settlement.mjs` both-branch done/findings preservation,5. No other dispatch/herdr/confinement change, second context field, new durable state, inline definition, branch or driver.
- Step commits: `883d2a2f3` loop route precedence; `d108f1857` eleven-line cross-repo report-directory grant; `895691a70` producer no-commit findings test. Earlier fixes: `fcfeafba7`; docs `8402b9441`.

## 1. Driver route regression — before/after

- Proven before by independent reviewer: the real review-item fixture with `status:done`, verdict REJECT and assessment findings passed on base, failed on prior HEAD with one dispatch instead of two. Accepted as ground truth; not rerun merely to confirm it.
- Cause: `loop.mjs:987` applied `!runOutcome.satisfied` even after operation-choice returned stop:false plus nextOperation fix-verify-red. Both-branch settlement now honestly returns findings, exposing that contradictory gate.
- Fix: explicit nextOperation/canProceed is honored before satisfied; `outcome.stop` still wins. No narrowing of settlement or inferred approval. Actual runOnce/Node-worker test now performs two dispatches, review → fix, ending awaiting-approval.
- NOT READY investigation: planning sweep handles `nextOperation === 'shape-plan'` separately (`loop.mjs:1654` after fix), not the executing dispatch gate. Added findings to the actual validation fixture; it passed BEFORE the loop edit and AFTER, retaining planning/todo and unchanged Work. No additional production fix needed.
- Exact strengthened tests, `test/runner/loop.test.mjs`: `driver loop routes done review findings with REJECT to fix-verify-red instead of blocking`; `validate-plan NOT READY with done findings returns to planning without advancing or blocking Work`.

## 2. Cross-repo reads — code evidence, minimal fix and limits

- `run.mjs:306` combines absolute resolved Unit inputs with settled role report refs. Non-blind refs stay absolute; blind refs are copied into assignment inputs at307-315. Workflow handoff includes upstream roles. `handoff-refs.mjs` resolves state-root Unit reports and verifies their settled hashes.
- Paths are role attempt reports such as `/home/vantt/projects/forgentX/.fgos/assignments/<unit>/<role>/<round>/runs/<NN>/agent-report.md` (settled refs may name another approved report filename), not files relative to target cwd. Critique needs earlier proposals; synthesis checker/red-team need producer of that round; explanation needs final packet and dissent; reopen needs supplied parent settled reports. These reads are semantically necessary.
- Existing Claude herdr `--add-dir` covered only its own run and copied inputs. Sibling reports lie outside those and mcp-skill-hub cwd: permission-prompt risk is real in the directory preparation, while actual Claude prompting is **UNPROVEN** (no native run).
- Applied only **11 added lines inside withRunDirReadAccess**: read immutable `assignment.json` already published before execution; add canonical parent directories of existing absolute file contextRefs, deduplicated. Do not grant the entire assignment/Unit/store root or unrelated sibling. Invalid assignment JSON fails rather than running with an incomplete grant. Existing blind refs point to copies, so peer access is not reintroduced. OS-level confinement is unchanged; add-dir is not OS permission or live isolation proof.
- Exact new test, `test/runner/execution/run-herdr.test.mjs`: `Claude cross-repo handoffs grant only referenced report parents, not sibling assignments or store roots`. Covers duplicate, missing, directory, opaque/relative refs and malformed metadata; existing blind-access test also passes.
- Standalone preparation smoke exercised real on-disk assignment/ref files, observed only current run + referenced report parent, read the intended report and excluded broad store grant; no Claude invoked. Parent-directory granularity also exposes neighboring files within that report's run directory to Claude's prompt policy (not a new OS grant). Owner should check prompt-free native reads; any broader copying/confinement change remains outside M.

## 3. Mutating producer findings — no commit

- `run.mjs:471` commits only pass. New real-worker test verifies findings + completed/verified execution, changed file retained, HEAD unchanged, dirty worktree and no result/binding commit record. Behavior intentionally remains unchanged; findings must not silently become a deliverable commit.
- Exact new test, `test/runner/execution/run.test.mjs`: `mutating producer findings preserve dirty work and never create a runner commit`. Existing pass-producer commit test remains the contrast. Fixture now accepts a verdict argument; no production test branch.

## Verification

- Per-step session-unset runs: review route + NOT READY2/2; scoped read grant + existing blind restriction2/2; producer findings + pass commit2/2.
- `env -u CLAUDE_CODE_SESSION_ID` verification: affected loop/run/run-herdr suites **181/181 pass**; complete `npm test` **6993 tests;6920pass;0fail;8skip;65todo**, including `20. live Herdr gateway executes confined launch end-to-end when gateway is running`. No scratch writers ran during the store audit; no safety checks disabled. Standalone runOnce smoke outside the test harness also observed two dispatches, fix-verify-red and awaiting-approval; scratch removed, no native advisory agent started. Raw suite evidence: affected `artifact://1212`, complete `artifact://1216`.
- Prior-round behavior remains: malformed expertise parks/resumes safely; owner answer completes; cross-repo plain refs refuse before run creation, unit-run refs work; coding default revision/stop remains, marketing findings reaches human approval (owner can overrule); skill exposes public status/answer, not raw run-state access. Original four focused suites passed237/237.

## Future native run protocol — not executed

1. Owner arranges M on main **AND an activated release containing M runtime code**, quiet machine and real terminal. `loadWorkflow(packageRoot: mainRoot)` reads YAML from forgentX checkout, while executable code comes from activated release: both must contain M. Do not substitute this worktree/dev host/old activation. Owner compares final advice with `bab4742a`; no self-certification.
2. `--dir /home/vantt/projects/forgentX` selects state/config; cwd and `--worktree /home/vantt/projects/mcp-skill-hub` select target worker. Prior isolated real Node workers proved this separation. **[INFERENCE]** the same roots target the actual mcp-skill-hub repository; native target execution is not certified. Installed workspace Rust shim previously traced both repeated context-ref pairs unchanged to child Node; shell PATH fgos was the legacy pnpm shim.
3. Copy main config to an owned mode0600 temp file. Append strict MCP only to claude-herdr-bwrap args; assert every other value identical, especially14 capability preferences. Preflight merged defaults before read-only mount: runtime defaults writing config would get EROFS; do not bypass setup or broaden the flag into a tracked default. Config-only overlay probe passed in the preceding round; no native Claude proof.

```sh
bwrap --bind / / --ro-bind "$oneRunConfig" /home/vantt/projects/forgentX/.fgos/config.json --chdir /home/vantt/projects/mcp-skill-hub -- /home/vantt/projects/forgentX/.fgos/installation/bin/fgos workflow start architecture-advisory --request "$verbatimCase" --dir /home/vantt/projects/forgentX --worktree /home/vantt/projects/mcp-skill-hub --foreground --json
```

4. Config is re-read per Unit (`run.mjs:240`); resume/answer do not persist worker location (`runner.mjs:966-977`). **EVERY resume/answer repeats cwd, --dir, --worktree and SAME temporary config overlay**, with --foreground for the entire advance. Replace only the workflow verb/args in that launcher with `workflow resume <id>` or `workflow answer <id> --step close --answer "$ownerWords"`; show status via public CLI. Keep mode0600 temp config until completion, then remove it. No detach that loses overlay.
5. Native advisory attempts0. Original stall rules: outside-M records dispatch bug and stops; inside-M permits one bounded fix/rerun; two stalls stop. Completion is not advice approval or implementation authorization.

## Unresolved / explicitly unchanged

- Native Claude prompt-free reading and owner advice quality remain unproven; directory preparation is tested, not live cognition/confinement. No further review round requested.
- Verified mutating work-product findings without a route still stop at operation-choice1741-1751: satisfied=false; misleading insufficient-confidence reason remains. The loop fix preserves that hold; explicit rejection repair routes now proceed.
- Done assessment inconclusive/blocked/not-applicable still collapses to pass at `settlement.mjs:313`, consumed319/336; claim status blocked retains its separate branch302-309. Unchanged as ordered.
- Findings seats are re-dispatched on resume; recheck/coordination consumers were not separately inspected. Unit association first, then both HIGH isolated-session gaps (ambient session reaper; recovery loses original session/socket), then other runtime work remain owner's separate dispatch scope, decision due2026-10-12. No frozen cross-run bytes or automatic specialists.
- GitNexus used the stale predecessor index: loop direct impact LOW, staged flows HIGH; scoped read-grant upstream CRITICAL (1 direct caller,42 flows). These are risk warnings, not fresh graph certification. Owner sees the bounded edits and actual runtime tests.
