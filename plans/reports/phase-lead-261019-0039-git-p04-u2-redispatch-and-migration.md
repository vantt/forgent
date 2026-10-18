# Git phase 04, unit 2: custody callers and migration

Base `09526c055`, branch `git/p04-custody`. Impact-analysis: inactive (zero registered providers). No commit, activation, lifecycle operation or doctor check was added.

## Production caller audit (performed before edits)

`rg` across all `src/` and `bin/` found exactly one production invocation, in Assignment's non-supervisor branch. Imports, re-exports and comments were checked separately.

| Surface | Actual producer door / mutation posture | Can reach the generic custody refusal for mutation? |
| --- | --- | --- |
| `src/runner/work-dispatch.mjs` | `spawnWorker` calls `runUnit`; Work-derived `writes` determines mutation. | No generic call; writing seats use supervised Assignment. |
| `src/runner/work-compat.mjs` | Resolves Work hints; only mentions the executor function in documentation. | No call. |
| `src/runner/worktree.mjs` | Git/worktree helpers; stale comment described a former executor consumer. Removed that comment. | No call. |
| `src/runner/dispatch.mjs` | Re-exports the function; its CLI retains only routing/read doors. | No invocation or mutating CLI execute door. |
| `dispatch/assignment-runner.mjs` direct/terminal | `cli-spawn` and `herdr-spawn` use the supervisor and declared process domain. | No generic call. |
| `dispatch/assignment-runner.mjs` other adapters | The sole generic invocation explicitly passes `sharedCwd: true` for read-only Assignment. Mutation is already refused before this branch. | Read-only only; a mutating HTTP/tool adapter cannot establish custody and receives a named refusal before launch. |
| Other `src/runner/dispatch/*.mjs` | Resolution, transport and policy helpers; no other generic invocations. | No call. |
| `bin/` | Execution enters through `runUnit` / Workflow; no generic invocation, including aliased imports. | No call. |

No production caller needed migration: today's Work and Workflow writing callers already use the supervised door. The generic in-process branch returns external-harness metadata, not a producer launch; writing inline Unit seats remain refused.

## Changes and migration

- Custody refusals carry cwd, executor and capability context, including invalid handed leases. The Unit-level force-sharing refusal precedes binding and therefore explicitly carries `executorId: null`; Assignment refusals identify the resolved executor.
- Removed the generic executor's stray-write watcher, dirty-path scanning and HEAD capture. Removed the unused lost-path result-ladder argument. Assignment already owned stray-write observation; its settlement now persists a lost-uncommitted-path warning when dirt disappears without a HEAD change, including adoption.
- Migrated argv/model/outcome/governance fixtures to explicit read-only sharing. Read-only results assert absence of commit certification; pure normalization tests retain their supplied-SHA assertions.
- Deleted three generic cwd-exclusion tests: `assignment-cwd-mutex-concurrency` covers writer exclusion/read-only concurrency, while custody tests cover kernel release and successor admission. Migrated two lost-path tests into three supervised delete/keep/commit cases, checking persisted warnings. Migrated both writing stray-attribution cases to Assignment.
- Crash-matrix test 9 now requires the controller and attempt to hold the lease together, checks attempt membership, and verifies release after successful run exit. It no longer expects release before settlement.
- Workflow catches `custody-predecessor-unknown`, preserves the predecessor checkout/branch and creates a replacement through `createWorkflowWorktree`, using the recorded base SHA rather than the unproven predecessor's branch tip. It journals recovery paths, starts a new Unit run and integrates the recorded replacement branch. A second refusal fails normally; explicit `fgos run --worktree` still stops with its cause.
- Added real recovery/preservation and replacement-branch integration tests. Updated runner spec and CHANGELOG. `git-worktree-recovery` remains metadata only; its doctor implementation belongs to phase 03.

Prior art: `git log -S'custody-predecessor-unknown'` identifies unit 1's custody change; Workflow had no recovery consumer. Reused its worktree creation, event journal, Unit resume and integration doors; no new recovery service, configuration or environment switch.

## Verification

All commands used the checkout's `target/debug/fgos`, writable fixture/state directories under `/tmp/fgos-work/`, and the normal test environment. No script sets `CARGO_TARGET_DIR`.

- Targeted custody/stray/dirty-file group: **18 pass, 0 fail**, including real git hooks, controller death, 20 successor generations and migrated writing fixtures (`/tmp/fgos-work/p04-u2-custody-final.log`).
- Final architecture/custody/stray group: **36 pass, 0 fail** (`p04-u2-final-check.log`).
- Final refusal-context and Assignment concurrency group: **10 pass, 0 fail** (`p04-u2-context-final.log`).
- Migrated dispatch group: **387 pass, 1 fail, 1 skip** before removing its obsolete lost-path normalization test (`p04-u2-dispatch-final.log`). The failure is the existing writing `fgos run` effort fixture: required bwrap namespace probes cannot run in this sandbox.
- Assignment settlement plus Workflow units: **50 pass, 19 fail** (`p04-u2-settlement-workflow.log`). The new end-to-end redispatch fixture fails at its initial writing run's confinement probe, before recovery; full recovery acceptance still needs the real host. No assertion was relaxed for this restriction.
- Replacement-branch integration test: **1 pass, 0 fail** (`p04-u2-integration.log`); actual Git integration preserves predecessor work.
- The direct crash matrix reports its existing namespace skip here. The supplied host report proves the previous Rust/pidns vectors, but does not prove this changed controller-lifetime assertion or new Workflow recovery test.
- All changed test files: **442 pass, 45 fail, 14 skip** (`/tmp/fgos-work/p04-u2-all-changed.log`). Failures include the sandbox confinement and detached/terminal execution restrictions; they are not asserted to be a clean baseline comparison. Final context-only refinements are additionally covered by the 10-test rerun above.
- Full `npm test`: **7,608 pass, 396 fail, 133 skip, 65 todo**; 8,202 tests reported, about 331 seconds (`/tmp/fgos-work/p04-u2-npm.log`). This run overlapped the final diagnostic refinements, which the targeted reruns cover. It is not green and does not replace the supplied real-host baseline comparison.
- `git diff --check` is clean. MDView cannot render: its database is read-only.

The program board requires a lane update but is outside this Assignment's write scope; it was not edited and is listed in `needsWrites`.

Status: DONE_WITH_CONCERNS
Summary: Completed caller audit, custody diagnostics, dead-code removal, supervised fixture migration and Workflow fresh-worktree redispatch. Targeted custody and integration checks pass; namespace-dependent host acceptance remains outstanding.
Concerns/Blockers: Full suite is not green in this sandbox; new end-to-end Workflow recovery and changed crash-matrix lease lifetime need host execution. Program-board update requires coordinator scope.
Context refs:
- (none)
