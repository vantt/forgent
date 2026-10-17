# Run supervisor P11: doctor, setup, specs, changelog

Status: DONE_WITH_CONCERNS. Branch `run-supervisor/p11-doctor-docs`, merged into `run-supervisor/integration`.

## What landed

**Doctor (`src/setup/run-supervisor-checks.mjs`, registered in `registrations.mjs`):**

| Check | Pass | Warn / info | Fail | Fix |
|---|---|---|---|---|
| `process-containment` | `kernel` | Linux `best-effort` warns (no bwrap user namespace); macOS `best-effort` is `info:` | no driver | none |
| `run-supervisor-route` | all four routes answer `--probe` at protocol 1 | none | a route missing, protocol mismatch, no host | none |
| `runtime-socket-dir` | exists, 0700, owner uid | missing warns | not a directory, other owner, loose mode | create / chmod 0700 (setup runs it) |
| `run-attempts-stuck` | none open, or only held locks | host cannot judge warns | unclosed v3 attempt with free lock, reason named | `sweepAttempts` |
| `gate-kill-grace` | default 10000 or valid, source named | none | below 1000, not an integer | none |

- `lock-holders` (N1): `attempt` lock files are scanned; a holder with no fgOS marker whose parent also holds the lock and has an fgOS origin is a member. A monitor left behind after its parent died is still named.
- Orphan check (`confinement-orphaned-resources-reaped`): skips marker-v2 attempt homes (big-lead late addition); the fix runs `sweepAttempts` per temp root and never removes a v2 home.
- `--probe` switch in `packages/run-supervisor/rust/src/route.rs` (not in the phase's file list; required by `run-supervisor-route` and `process-containment`, nothing else could report the driver).

**Carry-overs from the brief:**
- Reused-pgid escape added to the `linux-pgroup` and `macos-tree` guarantee, with test assertions.
- P04w: a supervisor that ends before binding writes `start-refused.json {attemptId, code, why}`; adopt skips the Windows start grace, shows `start-refused:<code>` as `reason` (probe-only and adopted), and `receipt.json` carries `reason`. Doctor prints it. Two Rust tests.
- P02 `kill_all` bound: **not done** (see concerns).

**Docs:** `docs/platform/run-supervisor/spec.md`, `docs/platform/agent-protocol/spec.md` (new); `process/spec.md` containment section; `component-boundary.md`; `runner.md` decision entry (supersedes the detached-run-supervisor part of 0043); `reading-map.md`; `distribution.md` rows 7c-7g and the two enumerations; `CHANGELOG.md` Unreleased (3 Added, 1 Changed).

## Decisions

1. `dispatch.gateKillGraceMs` has a reader (`src/run-supervisor/gate-kill-grace.mjs`, project over global, default 10000) and a doctor check, but **no `registerConfigDefault`**: a registered default is written by `fgos setup` into `~/.fgos/config.json`, which the 2026-10-13 rule forbids until every workspace has activated. Reader default stands in for it.
2. No new Node code reads the key into the envelope; that is the cutover phase.
3. New tests live in `test/setup/run-supervisor-checks.test.mjs` (holder-lock checks have their own file); registry lists in `checks.test.mjs` and `distribution.md` updated.
4. CHANGELOG line about the Windows lock driver dropped: the lock driver already landed on main, so `fgos run` no longer refuses there.
5. The phase asked for "controller dead no longer loses the result" in the changelog; that statement depends on the cutover phase merging before release.
6. Runner decision has no ADR number (placeholder `D-ADR-run-supervisor (id chưa cấp)`); no allocation convention found.

## Evidence

- `node --test test/setup/*.test.mjs`: 892 tests, 1 pre-existing failure (`skill-wrappers`: `.claude/skills/instruction-audit` absent, same on the integration worktree). After the registry-list fixes: `checks.test.mjs` + `registrations.test.mjs` 167/167.
- On the integration worktree after merge: `run-supervisor-checks`, `holder-lock-checks`, `confinement-doctor-checks`, `checks`, `registrations`, `architecture` = 251 pass, 0 fail (host binary built from this tree).
- `cargo test -p fgos-process -p fgos-run-supervisor -p fgos-agent-protocol`: all suites ok, exit 0.
- `cargo check --tests` for `x86_64-pc-windows-msvc` and `aarch64-apple-darwin` (`fgos-process`, `fgos-run-supervisor`): clean.
- `test/architecture.test.mjs`: 27/27 (two new manifest rows).
- Impact analysis: index stale; callers checked by grep. `route::main` has one caller (`apps/fgos/src/main.rs`), `fixConfinementOrphanedResourcesReaped` two (registration, tests). No HIGH/CRITICAL symbol edited.
- Not run: full `npm test`, Windows/macOS CI (leads never push).

## Review (Sonnet code-reviewer, 10 findings)

Fixed: socket-dir problems that `--fix` cannot repair no longer say "run --fix", and a path too long for a socket name now fails; only a process named `bwrap` counts as an attempt member (a leaked lock fd in an agent stays visible); `start-refused.json` is written only beside the envelope it names. Accepted, not changed: pid reuse race between holder list and `/proc` read, chmod symlink race on the user's own `/tmp` dir, a stale `start-refused.json` can name the wrong cause in a narrow duplicate-start case, probe/contract docs only partly in the contract JSON, host-less machines fail the two probe checks.

## Concerns

- `dispatch.gateKillGraceMs` has no runtime reader wired yet (the envelope builder in the cutover phase should call `readGateKillGraceMs`); doctor validates it already.
- Rust timing tests `gate_go::a_correct_go_runs_the_agent_and_reports_its_tuple` and `steps_runner::a_step_past_its_timeout_...` failed intermittently in some full runs and passed on rerun; code under them was not touched by this phase.

- **Windows `kill_all` bound** (carry-over 1) not implemented: the supervisor has no carrier for `lock.predecessorKillWaitMs` (the envelope has no such field; adding one changes the digest contract) and the trait passes only `grace_ms`, which Windows ignores. Documented as "open" in `process/spec.md`. Needs an owner decision on the carrier (envelope field or a route flag).
- `run-supervisor-route` and `process-containment` fail on a machine whose activated release predates the route (every workspace until activation). Intended, but doctor goes red there until activation.
- `run-attempts-stuck` fix has no positive end-to-end test in Node (building a valid digest envelope needs the cutover builder); adopt itself is covered by the Rust matrix.
- The spec notes `fgos internal lock-scan` is in the route contract but not in the crate.

## Unresolved questions

1. ADR id for the runner decision.
2. Carrier for the Windows kill-wait bound.
