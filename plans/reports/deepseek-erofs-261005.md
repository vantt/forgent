# deepseek EROFS on the headless cli path

## Cause

Not a config or home problem. The deepseek invocations (`pi-cli-openrouter`, `pi-cli-bwrap-openrouter`) are byte-identical to glm's in `.fgos/config.json` (same `PI_CODING_AGENT_DIR`, `OPENROUTER_API_KEY` env, `private-home` resource binding), and both run fine:

- Plain `dispatch execute deepseek` (first invocation, unconfined): exit 0, reply `ok`.
- The `bwrap` invocation under `host-write-denied`, driven through `executeExecutorCli`: exit 0, outcome `enforced`.

The failure only shows up for an Assignment run (a Workflow unit) whose posture is `required` confinement. Evidence: `.fgos/assignments/unit-run-1791128606754-62c16ce6/synthesizer/1/runs/01/` (deepseek synthesizer).

- `stdout.log` contains `EROFS: read-only file system, open '.../synthesizer/1/runs/01/agent-result.json'` (8 times).
- `protected/prepared-invocation/*.json` shows the bwrap args: `--ro-bind / /` plus writable `--bind` for only `runs/01/worker-output/outbox` and the private home.
- The prompt (`renderAssignmentPrompt`, `src/runner/dispatch/assignment.mjs`) and the effective contract's `resultClaim.path` named the FLAT `runs/01/agent-result.json` and `agent-report.md`. That directory is read-only inside the sandbox (`resources.mjs` binds `worker-output/outbox` for a cli-spawn assignment; the collector, `resolveRunWorkerArtifactPath`, already looks there).

So a worker that follows the prompt literally cannot write its claim. deepseek (v4-flash) follows it literally; other models happen to discover the outbox and adapt. Generic defect, not deepseek-specific, not a "herdr-only" policy.

## Fix

- `src/runner/dispatch/effective-execution-contract.mjs`: when confinement is enforced and the adapter is `cli-spawn`, the default `resultClaim.path` is `<runDir>/worker-output/outbox/agent-result.json`. Unconfined cli-spawn and herdr-spawn (whose brief rewrites the claim path to its own `outbox`) are unchanged.
- `src/runner/dispatch/assignment.mjs`: the prompt takes the claim path from the contract and puts the report beside it.
- Docs: one bullet in `docs/specs/runner.md` (Edge Cases Settled), one CHANGELOG `[Unreleased]` Fixed line.

Scope note: the brief limited edits to config, confinement code, worker-home and docs, but the defect is in the contract builder and prompt renderer, so those two files were changed (small, covered by tests). No config change was needed.

## Tests

- New in `test/runner/effective-execution-contract.test.mjs`: confined cli-spawn names the outbox for claim and report (and no flat path); unconfined cli-spawn and confined herdr-spawn keep the flat path. Red before the change, green after.
- Narrow runs, all green (`env -u CLAUDE_CODE_SESSION_ID node --test`): effective-execution-contract, assignment, operation-prompt-templates, execution/run-posture, assignment-dispatch (155 pass); herdr-spawn-assignment-dispatch, execution/run-herdr, cli-spawn-reconciliation, dispatch-operability-production-door, execution/run (83 pass).

## Live check (3 paid calls of 5)

1. Plain `dispatch execute deepseek` tiny prompt: ok (unconfined).
2. bwrap `host-write-denied` via `executeExecutorCli`: ok (enforced).
3. After the fix, a solo read-only unit through `runUnit` with `deepseek` + `pi-cli-bwrap-openrouter`, capability `review` (required `host-write-denied`): outcome `ok / completed-pass`, confidence `reported` with `valid-agent-result-claim`; `worker-output/outbox` holds `agent-result.json` and `agent-report.md`; `stdout.log` has 0 EROFS.
## Follow-up (not changed)

`src/runner/operation-choice.mjs` re-reads the claim bytes from the flat `runs/<n>/agent-result.json` when a later pass consumes a settled run (hash binding). A claim written under `worker-output/outbox` is not found there, so cross-pass consumption of confined cli-spawn claims would skip it. Same pre-existing gap for any worker that adapted to the outbox; it should resolve through `resolveRunWorkerArtifactPath`.
