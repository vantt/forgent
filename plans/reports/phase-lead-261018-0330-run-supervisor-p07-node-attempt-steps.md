# Phase lead report: run-supervisor p07, Node attempt steps

Status: DONE_WITH_CONCERNS. Branch `run-supervisor/p07-attempt-steps` (ba55f17fc) merged `--no-ff` into integration (bd0432830).

## Delivered
- `src/run-supervisor/attempt-step.mjs`: entry exec'd by route `attempt-step`. Verifies envelope v3 + digest, step listed in envelope, required step env (`FGOS_STATE_ROOT`, `HOME`/`USERPROFILE`; missing -> exit 65 named), payload (own root == envelope `payloadRoot` == `components.legacyNode.root` of the manifest next to `hostBin`; never PATH/cwd/active-release vars; mismatch -> exit 66). Exit 0 done / 75 retry / 70 error.
- `src/run-supervisor/step-support.mjs` (exit codes, StepError, envelope + side-file readers), `steps/settle-attempt.mjs`, `steps/finalize-home.mjs`.
- `authority.mjs`: new `finalizeAttemptHome` + `AttemptHomeError`; `finalizeConfinementResources` untouched (P09 deletes its caller).
- `docs/architecture-manifest.json`: 4 new src rows (architecture guard requires them).

## Evidence
`node --test` (env -u CLAUDE_CODE_SESSION_ID/CODEX_THREAD_ID/FGOS_SESSION_ID): attempt-steps 9/9, dispatch-confinement-authority, dispatch-confinement-credential-hygiene, architecture (27), run-supervisor/contracts, provider-credential-renewal: 182 pass, 0 fail, on phase branch and again on integration. `test:ownership:lint` passes (one pre-existing warning). Five acceptance cases + side-file-gone (live/dead holder), timeout+outbox, missing env, payload mismatch covered through the real entry.

## Decisions
- Outbox claim present and outcome not `exited` (timeout/cancel/gate-lost/...) -> judged as exit 0, no timeout; `exited` keeps real exit code. No claim: gate-lost/abandoned/carrier-lost -> exit 1 + executionError; timeout -> 124/SIGTERM.
- Inputs mirror the old recovery path: `run.json`, `assignment.json` (assignmentDir), `controller/evaluator-baseline.json` (digest checked; may be absent only for `abandoned-not-started`), capture tails (<=64 MiB) from envelope paths. P09 must write these.
- Side file gone: `acquireRunControl` (reclaims only a dead holder); held -> retry `run-control-held`; control already `settled` with no side file and no result.json -> error (cannot be completed).
- finalize-home: all markers checked first (v2, creator, attemptId, runDir); any mismatch aborts with nothing removed. Stage failure with keepHome -> retry `credential-home-kept`.
- Review (Sonnet code-reviewer): no blocker; fixed descriptor-dir read errors (only ENOENT = no homes) and added creator/runDir marker checks.
- GitNexus: only new symbols added, no existing symbol edited; impact not applicable (index stale).

## Concerns
1. No v2 home-marker writer exists yet (v1 only in cleanup.mjs); finalize-home errors (70) on a v1 home. Whoever writes homes for the new attempt (P08/P09/P10) must write v2 before envelopes name this step.
2. kept-home retry is unbounded and does not write `credentialKept` (old removal counted to 5). Bound belongs to adopt retry budget or a follow-up.
3. Settled-without-token-and-result case is a permanent error.

## Unresolved questions
- Which phase owns the v2 marker writer?
- Should adopt or `finalizeAttemptHome` bound `credential-home-kept` retries?
