# Advisory M — review fixes, proof, and remaining blocker

## Status: BLOCKED for landing; requested review fixes implemented

The ordered review fixes are complete. Focused behavior and public-CLI smoke pass; the full suite is not green because the live Herdr fixture refused its prepared command. No push, merge, main edit, release activation, or native advisory acceptance run was performed. A second independent review remains required before landing; M's deadline remains end 2026-10-10.

## Frozen baseline and bounded changes

- Pre-M snapshot: `0e8433c0c`, tag `advisory-pre-m-snapshot`; never merge that branch wholesale.
- M: `feat/advisory-path-m`, `/home/vantt/projects/forgentX-worktrees/advisory-path-m`. The initial tree was already locally committed as `8a2373937`, `503da25bb`, `b44ad3085` and clean when this round began. Review-fix code/tests/config/skill are frozen locally in `fcfeafba7`.
- Original budget baseline: `a0226f02239e978dc93f328d336076d7fa68b6e2`. Source/bin: **102 added+deleted / 200**; documentation: **71/100**. Canonical skill: **142/200**; full generated renders:143; reopen YAML: **48/60**. Generated skill artifacts are counted separately.
- Exactly two dispatch exceptions remain: `dispatch/cli.mjs` narrow assignment-input read grant (17 changed lines), `dispatch/settlement.mjs` evidenced done/findings preservation on both branches (5). No other dispatch/herdr/confinement edit, new durable field, inline definition, branching, or continuation driver.
- Malformed/fenced/prose producer packets, missing/invalid expertise fields and absent producer evidence now park a clear recoverable close. Status and resume remain parked; an explicit owner answer completes after manual review with an acknowledged limitation. No expertise is inferred.
- Cross-repo launches reject plain context paths before run creation, including template-local refs and explicit worker overrides. State-root `unit-run:<id>/<role>` refs work; same-repo linked worktrees retain plain paths. One `contextRefs` field remains.
- Coding validation/implementation retain pass-only defaults: one revision, then fail if findings remain. Marketing draft-copy now accepts pass/findings and reaches human approval; **the owner may overrule this choice**. All eight registered reviewed units have explicit consumer coverage.
- Skill restores public `workflow status`/`workflow answer`, uses settled Unit refs for reopen, and contains no acceptance packet ids or stall policy. Spec describes report-gate interpolation as new and documents recoverable park semantics.

## Exact tests added in this review round

- `test/workflow/advisory-m-contracts.test.mjs`: `marketing/content-publish: bounded findings reach synthesis/gate; transport failure blocks`.
- Same file: `coding/feature validate-plan: done reviewer findings cause one revision then fail the step`.
- Same file: `coding/feature implement-item: done reviewer findings cause one revision then fail the step`.
- Same file: `registered advisory reopen preserves done reviewer findings through explanation and owner close`.
- `test/workflow/workflow-runner.test.mjs`: `cross-repo workflows reject plain context paths before recording a run, but consume state-root unit reports`.

Strengthened existing tests:
- `test/runner/assignment-runresult.test.mjs`: `done findings survive both settlement branches; verified mutating work still stops at operation-choice` (real read-only reviewer, mutating reviewer and mutating implementer claims; actual tracked-file mutation and verified evidence).
- `test/workflow/workflow-runner.test.mjs`: `producer expertise gate parks clearly on malformed packets and remains answerable across resume`; `an absent producer parks a recoverable expertise gate rather than wedging the run`.
- `test/workflow/advisory-m-contracts.test.mjs`: `architecture-advisory: bounded findings reach synthesis/gate; transport failure blocks`; `business-discussion: bounded findings reach synthesis/gate; transport failure blocks`; `group-cognition: bounded findings reach synthesis/gate; transport failure blocks`. Reviewer claims are now `status: done`, assessment findings, not failed.
- Coding tests exercise the real registered unit templates at their step boundary, not the whole coding pipeline. An incidental assertion about revision-objective wording was removed; actual round2, findings, step failure and blocked downstream gate remain asserted.

## Exercised verification

- `npm run build:skills` regenerated canonical render surfaces. Four focused suites (`workflow-runner`, `advisory-m-contracts`, `assignment-runresult`, `operation-choice`): **237/237 pass**, `artifact://1184`.
- Full `npm test`, normal queue: **6991 tests;6917pass;1fail;8skip;65todo**, `artifact://1188`. Failure: `herdr-reconciliation.test.mjs:1123`, `20. live Herdr gateway executes confined launch end-to-end when gateway is running`; `worker-spawn-fail/confinement-mismatch` at `herdr-round.mjs:496,1900`, pane `wS:p490`. No safety bypass, gateway stop, runtime patch, or green rerun is claimed.
- The suite also caught my throwaway smoke script changing during its store snapshot. Both owned smoke/config probe files were removed afterwards; that audit correction does not establish a green full-suite result.
- Standalone production API/public-CLI smoke with real Node workers and fixture confinement registry: malformed producer close parked; status/resume stayed parked; explicit owner API/CLI answers completed. Cross-repo reopen consumed two repeated settled Unit refs; plain paths were refused before launch. Throwaways removed. This is not native cognition/confinement proof.

## Verified directory and installed-host behavior

- CLI plumbing: `--dir` selects state/config root; caller cwd or explicit `--worktree` selects worker root. Isolated real workers observed the target cwd and read its distinct `README.md`; workflow state/reports existed only under the separate state root.
- Actual Git-root resolution confirms `/home/vantt/projects/mcp-skill-hub` and `/home/vantt/projects/forgentX` are separate repositories. **[INFERENCE]** with cwd/worktree pinned to mcp-skill-hub and `--dir` forgentX, workers target mcp-skill-hub while config, assignments and workflow state live under forgentX `.fgos/`. No actual native target worker was launched to certify that inference.
- Shell `fgos` resolves to the pnpm legacy-Node compatibility shim. The explicit installed Rust door is `/home/vantt/projects/forgentX/.fgos/installation/bin/fgos`; its activated entry was verified as ELF.
- `strace -f -e execve -s 4096` on that installed shim's read-only `workflow status __m_passthrough_probe__` proved both ordered `--context-ref unit-run:parent/producer --context-ref unit-run:parent/reviewer` pairs reached the activated Rust entry and child legacy-Node argv unchanged. Expected exit4: nonexistent run. No workflow launch or activation.

## One future live-run protocol — not executed

1. After independent review, the owner arranges reviewed M on main, its intended activated release, a real terminal and quiet machine. Do not substitute this worktree, a dev host or the currently activated older payload. Owner compares final advice with `bab4742a`; no self-certification.
2. Copy main `.fgos/config.json` into an owned mode0600 temporary file. Append `--strict-mcp-config` only to `runner.executors.claude-herdr.invocations[id=claude-herdr-bwrap].args`; assert every other value unchanged, especially all14 capability preferences. No tracked config edit or new environment/config API.
3. Use a temporary config mount for this one foreground invocation (trusted launcher overlay, not worker confinement proof):

```sh
bwrap --bind / / --ro-bind "$oneRunConfig" /home/vantt/projects/forgentX/.fgos/config.json --chdir /home/vantt/projects/mcp-skill-hub -- /home/vantt/projects/forgentX/.fgos/installation/bin/fgos workflow start architecture-advisory --request "$verbatimCase" --dir /home/vantt/projects/forgentX --worktree /home/vantt/projects/mcp-skill-hub --foreground --json
```

4. The config-only namespace probe was exercised against M: loader saw the strict flag, target cwd was mcp-skill-hub, all14 preferences remained, and on-disk tracked config stayed byte-equivalent to the original baseline. This did not invoke Claude or certify the future native run. Remove the owned temporary file after the foreground run parks/finishes; owner sees/answers close through public CLI.
5. Original live stop rules remain: outside-M stall records a dispatch bug and stops M; inside-M stall permits one bounded fix/rerun; two stalls stop. Native advisory acceptance attempts:0.

## Operation-choice and unresolved items

- **Verified mutating findings still hold.** `run-result.mjs:1194-1198` classifies findings as a verdict; `1363` makes satisfied true only for category ok. `operation-choice.mjs:1741-1751` recognizes verified confidence but `isSatisfied` is false, returning stop:true, canAdvanceEdge:false, `assignment-implement-item-insufficient-confidence`. The actual settled-result test pins this. No automatic advance is introduced; the confidence-labelled reason is misleading and remains a dispatch-policy concern.
- **Verdict laundering remains unchanged as ordered.** With usable evidence and `status:done`, `assessment.verdict` inconclusive/blocked/not-applicable collapses to pass at `settlement.mjs:313`, consumed at read-only `319` and mutating `336`. Distinguish claim `status:blocked`: that separate branch at `302-309` retains blocked. Resolve outside this patch.
- **Landing blocker:** the full-suite real Herdr prepared-argv/confinement mismatch above needs dispatch investigation; no cause or repair is certified here. Scope forbids adding a third dispatch/herdr/confinement patch.
- Parked dispatch order: Unit association/reconnect first (controller loss can rerun settled seats), then both HIGH isolated-session gaps (ambient session reaper; recovery loses original session/socket), then other runtime work. Owner decision remains due2026-10-12. Input byte capture, trust/home lifetime, startup dialogs/receipts and native repairs are excluded.
- Second independent review and later owner native acceptance/quality rating remain outstanding. Reopen reuses existing architecture capabilities; no new names or frozen cross-run evidence. GitNexus analysis used the stale predecessor index, not fresh certification.
