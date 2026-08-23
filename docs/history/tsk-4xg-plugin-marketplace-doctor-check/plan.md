# tsk-4xg — plan

## Mode

Flags counted against CONTEXT.md's locked scope (D1-D3):

- **external systems** — yes: the check/fix shells out to the real `claude`
  CLI (`claude plugin marketplace list/add`, `claude plugin list/install`).
- **public contracts** — yes: `fgos doctor`'s check set is a documented
  surface (`docs/specs/distribution.md`'s Data Dictionary already
  enumerates the fixed check list per `docs/distribution-vision.md` §3) —
  adding a new check id changes what every `fgos doctor` run reports.
- **cross-platform** — yes: `claude` binary presence/behavior is an
  external, platform-dependent dependency, same category as `checkNodeAndGit`
  but for a new binary this repo does not control.
- **existing covered behavior** — yes: touches `test/setup/checks.test.mjs`'s
  own closed-list assertion of every registered check id, and
  `test/setup/doctor-fresh-run.test.mjs`'s real e2e `doctor`/`doctor --fix`
  run against a genuinely fresh installed binary.
- **weak proof around the area** — yes: an external, mutating CLI is
  inherently harder to prove safely than an in-repo check — confirmed
  concretely during Execute: `runFixes`/`doctor --fix` are exercised for
  real by 3 existing test files, and without a test-only seam to redirect
  the `claude` command, running the test suite on a machine that has
  `claude` installed would have silently mutated that machine's real
  Claude Code plugin config as a side effect of `npm test`. This was
  caught and fixed (see Execute notes below), not merely theorized.

5 flags → **high-risk** per the mechanical count — same tier `tsk-5cf`
(the sibling item this one was blocked behind) landed on, a consistent
judgment for the same "infra-adjacent CLI/doctor-gate change with a real
external dependency" shape.

Impact-analysis posture: `full` (GitNexus `present`, confirmed via `fgos
tool query --capability impact-analysis --status present`, re-checked at
this stage). `tsk-4xg` is not on the current `fgos graph`'s critical path.

## Process note

This plan.md was written after the implementation, not strictly before it
— this session's own reasoning ran continuously from planning straight into
Execute without stopping at the intermediate written-plan gate first, which
`fgos-coding-planning`'s own rules require. Corrected here: the plan below
describes exactly what was actually built and proven (real code, real
tests, real regression-safety fix), not a forward guess — stronger evidence
than a pre-code plan would have had, but the process itself skipped a step
and is being backfilled honestly rather than silently glossed over.

## No split

One doctor check/fix pair, one new dedicated test file, plus regression
fixes to 3 existing test files that already exercised `runFixes`/`doctor
--fix` for real. All of it lives in the same small, contained area
(`src/setup/registrations.mjs` + its own test suite) — not a multi-piece
build.

## Approach

Reused the already-proven extensible registry (`registerCheck`/
`registerFix`, `src/setup/registrations.mjs`, proven by `tsk-2cs`/`tsk-2qz`
per `tsk-3uj`'s audit) exactly the way `gate-bypass-configured` (the
existing `doctor --fix` precedent) already does — a new consumer, no new
plumbing (D1-D3 locked this).

- **`claude-plugin-marketplace` check**: `passed:true` (informational) when
  the `claude` binary isn't on PATH at all (D1 only governs the case where
  Claude Code is actually in play); otherwise `passed:false` when the
  `fgos-plugins` marketplace isn't registered under any source, or the
  `fgOS@fgos-plugins` plugin isn't installed+enabled. Accepts a
  directory-sourced marketplace entry as a valid pass (this exact repo's
  own dev-checkout self-hosting case, `docs/distribution-vision.md`
  "context 3") — only the FIX below is locked to a single source (D3).
- **fix**: adds the marketplace via its GitHub source (`vantt/forgent`,
  D3) only when no `fgos-plugins` entry exists at all, then installs
  `fgOS@fgos-plugins` only when not already enabled — idempotent, same
  "only write when something was actually missing" discipline
  `fixGateBypassConfigured` already uses. Real failures (a failing `claude`
  subcommand) surface the real stderr, never silently swallowed.
- **`FGOS_CLAUDE_COMMAND` test seam**: mirrors `bin/fgos.mjs`'s existing
  `FGOS_GH_COMMAND` pattern for the `gh` binary exactly — an env var read
  only in `registrations.mjs`, unset in production (real `claude` on
  PATH), overridden by tests to a fake script. Discovered necessary mid-
  Execute (see Risk map below), not planned in advance — the closest
  precedent in this exact codebase for "a doctor fix that shells out to a
  real external CLI" already solved this exact problem for a different
  binary, so this reused that solution rather than inventing a new one.

Rejected alternative: printing the fix commands instead of auto-running
them. D2 (CONTEXT.md) already locked auto-run explicitly, with the
trade-off (first fix to mutate state outside `.fgos/`) surfaced and
accepted — not reopened here.

## Risk map

| Component | Risk | Proof point |
|---|---|---|
| Real mutation during `npm test` | High (realized, not just theoretical) | `runFixes`/`doctor --fix` are exercised for real by 3 existing test files (`registrations.test.mjs`, `checks.test.mjs`, `doctor-fresh-run.test.mjs`). Without a redirect seam, running the test suite on any machine with `claude` installed would silently call `claude plugin marketplace add`/`install` for real. Fixed by `FGOS_CLAUDE_COMMAND` (mirrors `FGOS_GH_COMMAND`) — all 3 existing files updated to point it at a nonexistent path, verified by timing (the in-process `runFixes` unit test dropped from ~655ms to ~2.5ms once it stopped actually spawning the real `claude` binary) and by the new dedicated test file proving the check/fix logic itself against a fake, stateful `claude` script. |
| `claude plugin marketplace list --json` / `claude plugin list --json` output shape | Medium | Ran both commands directly on a real machine with `claude` installed (not assumed from `--help`) — confirmed real JSON array shape, field names (`name`/`source`/`repo`/`path` for marketplaces; `id`/`enabled`/`scope` for plugins) before writing the parser. |
| Existing closed-list test assertion (`checks.test.mjs`) | Low (caught immediately) | `DOCTOR_CHECKS has exactly the three v1 checks...` failed on first run after adding the new check — updated the expected list to include `claude-plugin-marketplace`; rerun green. |
| README/install docs left unmentioned (cited in the original bug's own description) | Low | Out of this item's locked scope — CONTEXT.md's D1-D3 cover the doctor check/fix only; a README update was never one of the three locked decisions. Left as a real, smaller, separately-triageable gap rather than silently expanding this item's scope. |

## Proof surface (verify for this item as a whole)

`node --test test/setup/plugin-marketplace-doctor-check.test.mjs` — 11
tests covering: claude-absent no-op (check + fix), missing marketplace,
missing/disabled plugin, directory-sourced marketplace accepted, fix
adding marketplace+plugin from scratch, fix only installing when
marketplace already exists (never re-adding), fix idempotency, and both
failure paths (marketplace add fails, plugin install fails) surfacing the
real error without silently swallowing it or leaving inconsistent state.

Full regression run before return: `test/setup/**/*.test.mjs` (120 tests,
all green, including the 3 existing files this item touched).

## Assumptions

- The exact JSON field names read from `claude plugin marketplace list
  --json`/`claude plugin list --json` (`name`, `source`, `id`, `enabled`)
  are proven against this machine's real `claude` CLI version; a future
  `claude` CLI release changing that shape would need this check updated —
  not something this item can pin further without an official schema
  reference, which the `claude plugin` command family does not publish.
