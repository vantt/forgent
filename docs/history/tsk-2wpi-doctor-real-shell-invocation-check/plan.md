# Plan: real shell-invocation probe for shell-integration-sourced

Item: `tsk-2wpi`. Mode: **small** — one new helper function, one call site
added to an existing check, tests. No split.

## Approach

1. `src/setup/shell-rc.mjs` (or `registrations.mjs` directly — see below):
   add `probeShellIntegrationInvocation(scriptPath)`: spawns `bash -c` with
   the diff/strip/invoke sequence from `CONTEXT.md` D2, returns
   `{ ok: boolean, strippedFunctions: string[] }`. Pure, side-effect-free
   beyond the disposable subshell (never touches the real rc file, never
   touches this repo's own state).
2. `checkShellIntegrationSourced` (`registrations.mjs:241-282`): after the
   existing missing/dead-line checks, when `scriptPath !== null` and at
   least one rc file actually sources it (`missing.length < rcFiles.length`
   — otherwise there's nothing real to invoke yet), call the new probe
   once against `scriptPath` itself (not per rc file — the failure mode
   lives in the shared script, not in which rc references it). On
   `ok: false`, add a problem line naming which function(s) it introduced
   that don't survive being stripped, distinct from the existing
   missing/dead-line messages.
3. Tests (`test/setup/checks.test.mjs`): a fixture integration script with
   a deliberately fragile underscore-prefixed helper (mirroring the real
   pre-fix `fgos-shell-integration.sh` shape) proves the probe catches it;
   a second fixture with no such dependency (mirroring the real post-`tsk-
   3k2` shape) proves the probe stays green. Both point `scriptPath` at a
   temp file via a test-only seam rather than depending on this repo's own
   `scripts/fgos-shell-integration.sh` current state (which will change
   once `tsk-3k2` merges) — the existing tests already do this via
   `integrationScriptPath()` for the text-based checks; the new tests need
   their own fixture scripts to independently prove both directions
   regardless of which fix has landed.

## Risk map

| Component | Risk | Proof |
|---|---|---|
| New probe's fidelity to the real bug | medium — this is the whole point of the item | Verified empirically already (`CONTEXT.md` D2): reproduces `exit 1` against this worktree's own still-unfixed script, would pass against the fixed one |
| Subshell probe cost/safety | low — one `bash -c`, no rc file executed, no side effects, single fast subprocess call (~tens of ms based on manual timing) | manual timing during investigation: comparable to the existing `execFileSync('git', ...)` calls already in this file (`checkNodeAndGit`) |
| Existing tests for this check | medium, resolved before implementation — the new probe only adds a THIRD problem category, but one existing test needed a fixture change | `test/setup/checks.test.mjs:240` ('...passes when every detected rc file already has the source line') sources THIS repo's real `scripts/fgos-shell-integration.sh` via `integrationScriptPath()` and asserts `passed: true`. Verified empirically: the new probe fails against this worktree's own current (pre-`tsk-3k2`) real script (`exit 1`, stripped `_fgos_repo_root`) — that test would break. Fix: point that one test at a small inline fixture script with no underscore-prefixed dependency instead of the real, mutable `integrationScriptPath()` — decouples the test from this repo's own changing state, which it should never have depended on for a passing-case assertion anyway |

Impact-analysis posture: `degraded` — GitNexus `present` (checked via
`fgos tool query --capability impact-analysis --status present`), index
stale (reported behind current HEAD throughout this session; earlier
`impact()` calls this session also failed on repo-name resolution).
`checkShellIntegrationSourced` is called from exactly one place
(`registerCheck({ id: 'shell-integration-sourced', ... })`, same file,
confirmed by direct grep — `grep -n checkShellIntegrationSourced
src/setup/registrations.mjs`), so the blast radius is fully covered by
that grep cross-check without needing a working `impact()` call.

## Outstanding questions

None
