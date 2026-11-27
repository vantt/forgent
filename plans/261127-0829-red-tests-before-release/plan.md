---
contract: plan-v1
title: "P0: fix the red tests on main so the release can run"
status: ready
priority: P0
blockedBy: []
base: 7490ea7e991afbadc0340ace2854bc2b261218fd
footprint:
  - plans/261127-0829-red-tests-before-release/**
  - src/runner/dispatch/provider-capacity.mjs
  - src/runner/dispatch/provider-credential-renewal.mjs
  - src/runner/dispatch/provider-credential-probe.mjs
  - src/runner/dispatch/confinement/drivers/bwrap.mjs
  - src/runner/dispatch/confinement/resources.mjs
  - test/runner/provider-per-cli-credential-sources.test.mjs
  - src/workflow/guide-schema.mjs
  - src/workflow/loader.mjs
  - src/workflow/definition.mjs
  - domains/coding/workflows/bugfix.yaml
  - test/workflow/guide-schema.test.mjs
source:
  - plans/discussions/ds-hfdlzko5kh-red-tests-before-release/DISCUSSION.md
  - p-4nmomwje7j
  - q-apqmci34ry
created: 2026-11-27
---

# P0: fix the red tests on main so the release can run

Priority P0 by the owner's answer to q-apqmci34ry ("Secretary opens a red-tests plan"). Every goal plan waits on
the next release, and the release recipe in `.fgos/config.yaml` (`release.checks`) runs both `npm test` and
`cargo test --workspace`. One plan fixes the listed reds; after it lands, the release reruns once.

## Facts at base (what already landed, and what is not proven)

The discussion lists the reds still open at `a4131c2bf8`. The planner checked each against the logs on fg-server2
(`.fgos/runtime/tmp/keeper-final-gate/`) and against main's history:

| Red (source run) | State at base | Evidence |
|---|---|---|
| `test/runner/provider-per-cli-credential-sources.test.mjs` (2 in `npm-test.log` at `1657a5b31c`; 6 in `npm-reds-recheck.log`) | Fixed by `410f9ab4af` (provisioning resolves the lease per invocation), **not proven** | The 6 recheck failures are 4 × `git-addon-unavailable: addon not shipped` plus `lock-busy` and a false unlock probe. The recheck ran the files without the addon and host that `scripts/run-tests.mjs` stages, so it proves nothing either way. |
| `test/workflow/guide-schema.test.mjs` (2) | Test updated by `410f9ab4af` (10 workflows, `coding/bugfix` in guide form), **not proven** | The recheck crashed at load with the same `git-addon-unavailable`. |
| `test/run-supervisor/terminal-cutover.test.mjs` (8), `terminal-crash-matrix.test.mjs` (1) | Fixed by `32467311ac` and `635a640a06`; backlog row p-ktsfyt24vw is `done` (10 of 10 pass on fg-server) | The recheck skipped them (`FGOS_HOST_BIN must name a host binary`), so they are not proven on fg-server2. |
| `test/skills/fgos-supervisor-idle-lead.test.mjs` (2) | Fixed by `5be73f9289` | p-4nmomwje7j update. |
| `cargo test --workspace`: `observe_query` declarations, the `scheduling-record.v1` contract row, the `watcher.schedulingSources` doc line, and `authoring_equivalence` (`runner.supervisorScope`) | Fixed by `09e2cfb206`, `67caaa7c88`, `5be73f9289` and `8ade321211` (fixture records `supervisorScope`), **not proven** | `cargo-test.log` at `1657a5b31c`, exit 101. The discussion did not list these, but the outcome (the release check passes) needs them, because `cargo test --workspace` is a release check. |

The other reds q-apqmci34ry named (git-spawn scan, instruction projections, convention, `.fgos` leak, the rul104/rul11
anchor body) did not appear in the later full run at `1657a5b31c`.

So no red is known to remain at base, but none is proven green by the real harness. The planner's confined session
cannot run the harness: `cargo build` fails on a read-only build directory. Phase 1 therefore proves the state first,
and the fix phases change code only where phase 1 shows a red.

## Outcome

On a clean worktree of main, an unconfined `npm test` and `cargo test --workspace`, the two release checks, exit 0.
The next `fgos release run` then passes its checks.

## Acceptance criteria

1. `node scripts/run-tests.mjs test/runner/provider-per-cli-credential-sources.test.mjs test/workflow/guide-schema.test.mjs test/run-supervisor/terminal-cutover.test.mjs test/run-supervisor/terminal-crash-matrix.test.mjs`
   exits 0 on a clean worktree of main, unconfined. Record it in `reports/phase-04/listed-files.log`.
2. `npm test` exits 0 on the same worktree, unconfined. Record it in `reports/phase-04/npm-test.log`.
3. `cargo test --workspace` exits 0 on the same worktree. Record it in `reports/phase-04/cargo-test.log`.
4. Each fix changes production code or its fixture. `git diff <base>..HEAD -- test/` deletes no assertion and adds no
   skip, `todo` or env switch (design-principles principle 8; L5 question 5).
5. `node scripts/plan-contract-check.mjs --plan plans/261127-0829-red-tests-before-release` passes.

## Non-goals

- Changing the release recipe, skipping a check or rolling back the active release. The owner's answer forbids all
  three.
- Reds that are not on the list above and not found by phase 1. A new red outside this plan's footprint is raised
  (phase 4, step 4), not fixed here.
- Running the release itself. The supervisor's next wake does that once this plan is `done`.
- Fixing the recheck procedure that ran test files without the staged addon. Phase 1 only records it as friction.

## Authority map

This plan adds no new decision, function, module, verb or contract. It repairs existing behaviour in two existing
owners.

| New thing | Model row | Note |
|---|---|---|
| None. Credential-source fixes, if phase 1 needs any | `runner` | existing per-CLI store resolution in `src/runner/dispatch/`; no new door |
| None. Guide model fixes, if phase 1 needs any | `workflow` | existing guide model in `src/workflow/`; no new door |

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Prove which reds remain at main](phase-01-prove-reds-at-main.md) | - | plans/261127-0829-red-tests-before-release/reports/phase-01/** | 1 | ready |
| 2 | [Per-CLI credential source reds](phase-02-credential-source-reds.md) | 1 | src/runner/dispatch/provider-capacity.mjs, src/runner/dispatch/provider-credential-renewal.mjs, src/runner/dispatch/provider-credential-probe.mjs, src/runner/dispatch/confinement/drivers/bwrap.mjs, src/runner/dispatch/confinement/resources.mjs, test/runner/provider-per-cli-credential-sources.test.mjs, plans/261127-0829-red-tests-before-release/reports/phase-02/** | 2 | ready |
| 3 | [Workflow guide schema reds](phase-03-guide-schema-reds.md) | 1 | src/workflow/guide-schema.mjs, src/workflow/loader.mjs, src/workflow/definition.mjs, domains/coding/workflows/bugfix.yaml, test/workflow/guide-schema.test.mjs, plans/261127-0829-red-tests-before-release/reports/phase-03/** | 2 | ready |
| 4 | [Full release checks on the combined tree](phase-04-full-release-checks.md) | 2, 3 | plans/261127-0829-red-tests-before-release/reports/phase-04/** | 3 | ready |

Phases 2 and 3 share no file and run in parallel. If phase 1 shows a phase's files green, that phase closes with no
code change and cites phase 1's log.

**Runner requirement.** Phases 1 and 4, and the verify step of phases 2 and 3, need an unconfined shell that can
build with cargo and stage the addon (`node scripts/run-tests.mjs`). A confined head fails at `cargo build`
(read-only file system). The lead hands these runs to `lead:SUPERVISOR` or to a worker unit allowed to run cargo and
npm test (p-ayxhxswso6). It does not run them confined and read the failure as a red.

## Owner questions

None. The owner's answer to q-apqmci34ry fixes the scope. Including the four `cargo test` reds follows from the
settled outcome ("the release check passes"), so the planner decided it and did not ask.

## Risks and rollback

- **A red that only shows under load or on fg-server2.** Phase 4 runs the full suite, not only the listed files, on
  fg-server2, where the release runs.
- **A red outside the footprint.** Phase 4 raises it with `fgos supervisor raise`, gives it its own backlog row, and
  leaves this plan not `done`. The secretary or the owner then decides whether this plan is extended or a new plan is
  written. The footprint is never widened silently.
- **Main moves while the plan runs.** Phase 4 runs at the current tip of main, not at `base`, so reds that later lands
  bring in are caught before the release.
- **Rollback:** revert each fix phase's commit. Phases 1 and 4 write only reports.
