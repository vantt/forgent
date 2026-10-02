# Phase 2 report: posture, one confinement path

Status: DONE_WITH_CONCERNS (9 tests outside owned paths now fail; fixture fix recipe below)

## Files changed
- `src/runner/dispatch/confinement/policies.mjs`: `resolvePosture` now only maps posture -> built-in policy and returns `requirement {mode:'required', policyId, policy}`; no `bwrapArgs`. `canApplyPosture` is real: executor/invocation must declare `confinement.backend`, machine registry (`loadMachineBackendRegistry`) must have it enabled with type bwrap, executable must exist/be X_OK (absolute or on PATH). Pure native agent (agentType only, no command/adapter/invocations) is exempt (in-process Lead, nothing to wrap; checkers never bind inline).
- `src/runner/dispatch/assignment-runner.mjs`: `confinementRequirement` taken from `assignment.binding.posture` via `resolvePosture`, passed to `buildConfinementRequest({requirement})` and to the prompt's confinement posture; unbound callers keep the old plan-derived requirement. For `workspace-write` the confinement context `repoRoot` is the Unit worktree (`effectiveCwd`), not the main checkout (previously the writable workspace would be the main root and overlap the attestation store -> refused).
- `src/runner/execution/run.mjs`: NOT edited; it already passes `binding: bound` into the assignment.
- Tests: new `test/runner/execution/run-posture.test.mjs` (6 tests); fixture updates in `test/runner/execution/bind.test.mjs` and `run.test.mjs` (confinement backend on cli invocations, file-local registry seed, fixtures under /var/tmp because bwrap mounts a tmpfs over /tmp, settling worker writes to the outbox when present). Note `run.test.mjs` was also being edited by the phase 3 agent; my edits were small string replaces (imports/FIXTURE_ROOT/two invocation lines/worker outbox).

## Test evidence (real bwrap at /usr/bin/bwrap, env -u CLAUDE_CODE_SESSION_ID)
- `node --test test/runner/execution/run-posture.test.mjs`: 6/6 pass. Real probe results from outbox files: read-only reviewer/producer-with-no-writes `{worktree:EROFS, main:EROFS, outbox:ok}`; workspace-write producer `{worktree:ok, main:EROFS, outbox:ok}`; bwrap executable missing -> `outcome policy-refusal`, `refused.reason posture-unavailable`, nothing launched.
- `test/runner/execution/*.test.mjs` + `patterns/*` + `test/runner/dispatch-confinement-*` + `assignment-*` + `dispatch-*`: 714 pass / 0 fail.

## Guards
- `rg bwrapArgs src/runner/dispatch/confinement/policies.mjs`: empty (also guard test).
- `canApplyPosture`: no unconditional `return true` (only the in-process native-agent exemption).
- Impact: GitNexus not used (index stale -> degraded). rg cross-check: `canApplyPosture` caller = `bind.mjs` only; `resolvePosture` caller = `assignment-runner.mjs` only; behavior change reaches only assignments carrying a binding (unit-run via run.mjs).

## Concerns (need controller action)
1. Failing outside my ownership (9): `test/cli/run-verb.test.mjs` (1), `test/workflow/{discussion-workflows,business-discussion-workflow,architecture-advisory-workflow,workflow-runner}.test.mjs` (8). Cause: their fixture executors have no confinement backend, so bind now refuses `posture-unavailable` (correct behavior), and their tmp fixtures/echo worker sit under /tmp. Fix recipe (identical to what worked in run.test.mjs): add `confinement: { backend: 'bwrap' }` to the cli-spawn invocation, `seedFileLocalBwrapRegistry()` (test/runner/confinement-registry-fixture.helper.mjs), create fixtures under /var/tmp instead of os.tmpdir(), make the echo worker write into `<claimDir>/worker-output/outbox` when it exists. `workflow-runner.test.mjs` is also touched by phase 3, so left alone.
2. Real `.fgos/config.json`: executors without a confined cli invocation (glm, gitnexus, herdr, `*-herdr-*` invocations, plain cli invocations when named in `prefer`) are now filtered for every posture; herdr-spawn invocations declare no confinement (phase 4 must add the posture to the pane path, or they cannot be chosen by name).
3. Observed (pre-existing, not changed): the prompt's claim path is `<runDir>/agent-result.json` while a confined cli-spawn worker can only write `worker-output/outbox`; settlement reads the outbox first.
4. CHANGELOG `[Unreleased]` line not added (not in my ownership): runs now refuse with `posture-unavailable` when no confinement backend is available.

Status: DONE_WITH_CONCERNS
Summary: Single confinement path in place and proven with real bwrap through runUnit (read-only blocks repo writes, outbox writable; workspace-write limited to worktree; missing bwrap refuses). 9 CLI/workflow tests outside owned paths need the fixture recipe above.
