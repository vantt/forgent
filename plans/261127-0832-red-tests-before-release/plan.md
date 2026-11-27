---
contract: plan-v1
title: "P0: fix the red tests on main so the release check can pass"
status: ready
priority: P0
blockedBy: []
base: 7490ea7e991afbadc0340ace2854bc2b261218fd
footprint:
  - plans/261127-0832-red-tests-before-release/**
  - src/runner/dispatch/provider-capacity.mjs
  - src/runner/dispatch/provider-credential-probe.mjs
  - src/runner/dispatch/provider-credential-renewal.mjs
  - src/runner/dispatch/confinement/drivers/bwrap.mjs
  - test/runner/provider-per-cli-credential-sources.test.mjs
  - test/workflow/guide-schema.test.mjs
  - test/rust-host/help-routes.test.mjs
  - scripts/run-rust-dev-host.mjs
source:
  - plans/discussions/ds-hfdlzko5kh-red-tests-before-release/DISCUSSION.md
  - p-4nmomwje7j
  - q-apqmci34ry
created: 2026-11-27
---

# P0: fix the red tests on main so the release check can pass

The release recipe (`.fgos/config.yaml` `release.checks`) runs `npm test` and `cargo test --workspace`; both
failed in the last unconfined run on fg-server2, so every release, and every goal plan behind one, waits. The
owner chose one plan for the reds, then one release rerun (q-apqmci34ry, recorded in the discussion hand-off).

## Facts found while planning

Evidence: `.fgos/runtime/tmp/keeper-final-gate/` on fg-server2 (`npm-test.log` and `cargo-test.log` at
`1657a5b31c`; `npm-reds-recheck.log` at `a4131c2bf8`), and `git log` on main.

1. **The recheck at `a4131c2bf8` did not test what it named.** It ran the files with plain `node --test`, outside
   `scripts/run-tests.mjs`, with no staged addon and no `FGOS_HOST_BIN`. Four credential cases and the
   guide-schema file died on `git-addon-unavailable: addon not shipped on this channel`. The terminal cases were
   skipped (`FGOS_HOST_BIN must name a host binary`). The remaining two credential cases fail on `lock-busy` and a
   false probe, and both go through the account lock. That lock is behind the native lock door, so these two
   failures may come from the same missing addon. So "6, worse after `410f9ab4af`" is not proven.
2. **The two listed files already have fixes on main.** `410f9ab4af` (06:29, 2026-11-27; an ancestor of
   `a4131c2bf8`) resolves the per-CLI lease inside provisioning and write-back. That fixes the `CLI "unknown"`
   refusals of the full run. The same commit counts `coding/bugfix` as the tenth guide-form workflow, which fixes
   the `10 vs 9` and `guide vs playbook` cases. Neither fix has been proven by a run through the real test runner.
3. **Other reds of the `1657a5b31c` run are already fixed on main:**
   - terminal-cutover (8) and crash-matrix (1): `32467311ac`, `635a640a06`, landed by `97b1217f4b`.
   - fgos-supervisor-idle-lead (2) and the cargo `registry_defaults` doc line: `5be73f9289`.
   - cargo `observe_query` declarations: `fgos-agent-start-context` is now in the list.
   - cargo `model_checks` scheduling-record row: now in `contracts.yaml`.
   - cargo `authoring_equivalence` `runner.supervisorScope`: the fixture now records it.
   - the duplicate test body in the rul104 and rul11 anchor tests: `79accc6c39`.

   Each is confirmed by reading the code; phase 3's full gate proves them.
4. **One red that no commit has fixed yet: the `.fgos` leak.** The `1657a5b31c` run ended with
   `run-tests: ERROR: test suite leaked ... Deleted: .fgos/runtime/dev-host/run-iPbSb7`. The likely writer is
   `test/rust-host/help-routes.test.mjs`. It spawns the real checkout's `scripts/run-rust-dev-host.mjs`, whose
   `main()` calls `pruneRunDirs` on `<checkout>/.fgos/runtime/dev-host`. When an earlier `npm run fgos:dev` left a
   staged directory older than 10 minutes, the test deletes it from the real store. The release check runs from
   the project root, where heads use `fgos:dev`, so this can fail any release. The cause is unproven until phase 2
   reproduces it.

## Outcome

On a clean worktree of main after this plan lands, an unconfined `npm test` and `cargo test --workspace` (the
two release checks) both exit 0, with none of the reds listed in the discussion or found above. The next
`fgos release run` is then not refused by its checks.

## Acceptance criteria

- `node scripts/run-tests.mjs test/runner/provider-per-cli-credential-sources.test.mjs test/workflow/guide-schema.test.mjs`
  run through the real test runner (addon staged, not plain `node --test`) exits 0. Output:
  `plans/261127-0832-red-tests-before-release/reports/phase-01-listed-reds.md`.
- With a stale `run-*` directory (mtime older than 10 minutes) placed under `.fgos/runtime/dev-host/` of the
  checkout under test, `node scripts/run-tests.mjs test/rust-host/help-routes.test.mjs` exits 0, reports no `.fgos`
  leak, and the directory still exists afterwards. Output:
  `plans/261127-0832-red-tests-before-release/reports/phase-02-dev-host-leak.md`.
- On a clean worktree of main at the plan's last land, unconfined `npm test` exits 0 and `cargo test --workspace`
  exits 0. Output: `plans/261127-0832-red-tests-before-release/reports/phase-03-full-gate.md`, with both exit codes
  and the tail of each log.
- No test is weakened, skipped or deleted, and the release recipe (`release.*`) is unchanged; `git diff <base>..HEAD`
  over the footprint shows it.

## Non-goals

- Changing the release recipe or skipping a release check (discussion constraint).
- Reds that the full gate shows inside a running plan's own footprint: they go to that plan's lead, not here.
- Making tests runnable inside a confined head (separate concern; see the open owner questions about unconfined runs).
- Running the release itself; the supervisor runs `fgos release run` after this plan lands, as its skill says.

## Authority map

No new decision, function, module, verb or contract. Each row below names the existing owner of the code a phase may
fix; no row is added or retired.

| New thing | Model row | Note |
|---|---|---|
| Per-CLI login store at provisioning, renewal and probe (phase 1, fix only if red) | `runner` | existing behaviour of `src/runner/dispatch/`; no new door |
| Workflow count and guide-form fixture (phase 1, fixture only if red) | `workflow` | existing guide model; no new workflow |
| `fgos:dev` door case that must not prune the real store (phase 2) | `packaging-distribution` | existing dev-host launcher and its test; no new mechanism |

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Listed reds through the real runner](phase-01-listed-reds.md) | - | src/runner/dispatch/provider-capacity.mjs, src/runner/dispatch/provider-credential-probe.mjs, src/runner/dispatch/provider-credential-renewal.mjs, src/runner/dispatch/confinement/drivers/bwrap.mjs, test/runner/provider-per-cli-credential-sources.test.mjs, test/workflow/guide-schema.test.mjs, plans/261127-0832-red-tests-before-release/reports/phase-01-listed-reds.md | 1 | ready |
| 2 | [The dev-host leak into the real store](phase-02-dev-host-leak.md) | - | test/rust-host/help-routes.test.mjs, scripts/run-rust-dev-host.mjs, plans/261127-0832-red-tests-before-release/reports/phase-02-dev-host-leak.md | 1 | ready |
| 3 | [Full release gate on main](phase-03-full-gate.md) | 1, 2 | plans/261127-0832-red-tests-before-release/reports/phase-03-full-gate.md | 2 | ready |

Every phase is `code:implement` except phase 3, which is `code:test`. Phases 1 and 2 own disjoint files and run
at once; phase 3 runs on the combined tree.

## Owner questions

None. The owner's answer q-apqmci34ry settles scope. The unconfined runs these phases need go through worker units,
which may run `npm test` and cargo (p-ayxhxswso6, done).

## Risks and rollback

- **A test cannot run in a confined lead.** All three phases need the real runner with a staged addon. The lead
  dispatches each run as a worker unit (`code:implement` / `code:test`), not in its own shell. If no unit can
  build the addon, the lead raises `coordination-help` once with the exact command, and never reruns with plain
  `node --test`, because that is the mistake that produced fact 1.
- **Phase 1 finds nothing red.** That is the expected result (fact 2). The phase then lands only its report; a
  green proof is its deliverable.
- **Phase 2 fix choice.** Fix the test fixture first: run the dev door from a copied checkout, the way
  `test/rust-host/dev-host.test.mjs` already does. Change `scripts/run-rust-dev-host.mjs` only if that cannot work.
  Never add an env switch or a test-only branch that skips the prune (definition of done, item 5).
- **The full gate shows a red not listed here.** If the red is inside this footprint, phase 3 hands it back to the
  owning phase. If it is in another running plan's footprint, phase 3 tells that plan's lead. Otherwise phase 3
  opens a backlog row and raises `coordination-help`, and the plan does not close as done.
- **Rollback:** each phase is one land commit; `git revert <land commit>` restores the previous code. The plan
  edits no config or contract.
