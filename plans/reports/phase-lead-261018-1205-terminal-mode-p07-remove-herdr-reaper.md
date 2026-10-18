# Phase 07 report: remove the herdr reaper (terminal mode)

Branch `terminal-mode/p07-reaper`, built on integration 961b24b1d. Host: debug build in a phase-private target dir.

## Done
- `cleanup.mjs`: removed `reapOrphanedConfinementResources`, `bindOwnershipMarker`, `markOwnershipLaunched`, `markResourceRetained`, pane check/close helpers, `paneOpenUnlessClosed`, `LAUNCH_GRACE_MS`, `OWNERSHIP_BINDING_FIELDS`, `EMPTY_SHELL_GRACE_MS`, `RUN_SETTLE_GRACE_MS`; the marker no longer records `timeoutMs`.
- `bwrap.mjs`: removed `bind`/`markLaunched`/`retain`. Writes v2 (attemptId) when the request has one.
- `authority.mjs`: removed `bindingForPrepared`, the retained-home path, binding-field filter in the finalizer digest (only `credentialKept` allowed), `FGOS_SESSION_ID: writerId`, and the herdr-launch-command branch (now throws `attempt-required`).
- `dispatch/cli.mjs`: probe-account has no post-probe sweep; probe runs through `executeAssignment`, so its home is an attempt home removed by adopt (conclusion for req. 3).
- `worker-session.mjs`: removed `herdrEndpointForEnv`, `envForEndpoint` (no caller left).
- `sweep.mjs`: `sweepAttempts` = adopt only, returns `{adopt, adoptError}`; callers (`run.mjs`, `loop.mjs`, `run-supervisor-checks.mjs`) updated; `registrations.mjs` doctor check reduced.
- Docs: CHANGELOG, `docs/specs/confinement-authority.md`, `docs/specs/runner.md`.

## Decisions
- bwrap still writes the v1 pid marker when a request has no `attemptId` (dispatches outside the assignment door; ~hundreds of covered tests). Their `finally` removes the home. A killed one is named by doctor check `confinement-orphaned-resources-reaped`; only an explicit `doctor --fix` removes it (pid proof). Reviewer flagged leaving it unremoved as a credential-leak risk; this fix is the answer.
- Doctor check keeps loose-root tightening and empty per-dispatch dir removal (own rule, rmdir only).
- S2 rewritten: fence file keeps the finalizer field contract (only `credentialKept` allowed) and marker guards; adopt cases live in `test/run-supervisor/sweep.test.mjs` (lock free + empty domain + receipt -> finalize-home; lock held by a live holder -> kept, next sweep cleans; two adopters -> one finalization; no host -> named error, nothing removed; grep guard that removed symbols are gone). Old cases (1)-(9) mapping in the fence file header. Removed: cases tied to binder/pane/retain/endpoint rules. 0 todo.
- Deleted 8 `dispatch-production-call-sites` tests and 2 authority tests that drove direct herdr execution / the launch-command file (direct herdr execution is refused since P06); replaced with one refusal test.
- Deleted `run.test` "reclaims a private home whose owning process is gone" (run start now only adopts; call site guarded in sweep test).

## Evidence
- Target set (`dispatch-confinement-*`, `sweep`, `production-call-sites`, doctor/credential/run-timeout/renewal): 339 pass, 0 fail, 0 skip, 0 todo.
- `architecture.test.mjs` + `test/setup/*` + `loop.test.mjs`: 1041 pass; 1 fail `skill-wrappers` projection (`.claude/skills/instruction-audit` missing in this worktree, unrelated).
- `test/run-supervisor/*`, `runner/dispatch*`, `runner/execution/*`, `herdr*`, `assignment*`, `provider*`: 1768 pass, 4 fail (before the test deletions): 2 `dispatch-governance-operability` herdr-spawn direct-exec tests (also red on integration 961b24b1d, P06 leftover), 1 `executeAssignment gitBefore` (flaky under load, passes alone 2x), 1 run.test reclaim (deleted). Full `npm test` not run (P09a).
- GitNexus `impact` not run (index stale); callers checked by grep. Risk areas: `authority.mjs` finalize/prepare (HIGH fan-in).
- Reviewer (Sonnet): no blocking defect; one credential-leak concern addressed above.

## Unresolved
- 2 `dispatch-governance-operability` tests still red (pre-existing, need rewrite for terminal mode): P09a.
- Landing runbook (req. 6): clean pane-bound v1 homes with the previous release before activate; this release does not reap them.
- Windows/macOS CI push to be requested from forgentx-95.
