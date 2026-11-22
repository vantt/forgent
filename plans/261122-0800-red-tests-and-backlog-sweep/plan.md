---
contract: plan-v1
title: "Turn main's landed-code reds green and finish the docs/backlog.md to plans/backlog.md sweep"
status: running
lead: head:lead-forgent-261122-0800-red-te-96f0f
priority: P1
blockedBy: []
base: 645d43a6a4dd30c752bc736b4df3476590d47f63
footprint:
  - plans/261122-0800-red-tests-and-backlog-sweep/**
  - test/runner/dispatch-confinement-backend-p03.test.mjs
  - test/runner/dispatch-confinement-policies.test.mjs
  - test/runner/dispatch-confinement-machine-private.test.mjs
  - packages/convention/contracts/convention.rules.v1.json
  - packages/convention/contracts/convention.golden.v1.json
  - packages/convention/rust/src/operations.rs
  - packages/convention/rust/tests/golden.rs
  - scripts/convention-conformance.mjs
  - test/scripts/convention-conformance.test.mjs
  - test/plugins/terminal-skill-attach.test.mjs
  - core/config-standard/sessionRotation.yaml
  - packages/config/rust/src/bundle.rs
  - test/scripts/check-decision-citation-drift.test.mjs
  - packages/durable-file/rust/tests/dir_replace.rs
  - apps/fgos/tests/session_write_publish.rs
source:
  - plans/discussions/ds-sovgvawfyv-red-tests-and-backlog-sweep/DISCUSSION.md
  - p-vnsigyw6h7
created: 2026-11-22
---

# Red tests on main and the backlog-path sweep

## Outcome

`npm test` and `cargo test --workspace` on main carry no red that landed code caused and this plan's footprint can
reach, so a lead's gate shows only its own reds. Each red traced in backlog row `p-vnsigyw6h7` now asserts the
behaviour that landed. References that still use `docs/backlog.md` or `docs/discussions` as the live portfolio
location now name `plans/backlog.md` and `plans/discussions`. The four reds the row marks "likely environmental" are
each proven environmental or traced to a code cause. Reds that sit in files owned by another active plan are handed to
that plan by name (see "Handed to other plans").

Prior art: the cause of each red comes from the triage notes in the row (lead:SUPERVISOR's full-suite run at
`ce1ef4d36`), checked again on base `645d43a6a`. No commit since `ce1ef4d36` touched any of the red test files.
Reused: the native Convention host and its per-rule `cutoff` field, the existing `bundle::SCHEMAS`/`STANDARD`
lists, and the scrub fixture `packages/config/contracts/fixtures/repo-differences.v1.json`. Not reused: the draft
patch in the abandoned worktree `261120-0625-work-data-model-p05k`, by the secretary's rule.

## Acceptance criteria

1. `node scripts/run-tests.mjs test/runner/dispatch-confinement-backend-p03.test.mjs test/runner/dispatch-confinement-policies.test.mjs test/runner/dispatch-confinement-machine-private.test.mjs`
   passes, and the secretary case asserts the `plans/` portfolio paths (phase 1).
2. `node scripts/run-tests.mjs test/scripts/convention-conformance.test.mjs` passes on the real repository, and
   `cargo test -p fgos-convention` (the convention crate) passes with a golden case for a valid new backlog id whose
   slug contains a plan-shaped stamp (phase 2).
3. `node scripts/run-tests.mjs test/plugins/terminal-skill-attach.test.mjs` passes and asserts the `: ` tab-label
   separator (phase 3).
4. `cargo test -p fgos-config` passes, including `authoring_equivalence` and `golden_schema` (phase 4).
5. `rg -n 'docs/backlog\.md|docs/discussions' --glob '!plans/**' --glob '!archive/**' --glob '!CHANGELOG.md'` lists only
   the kept legacy references in `plans/261122-0800-red-tests-and-backlog-sweep/reports/kept-legacy-references.md`
   (written by phase 5) and the files handed to other plans (phase 5).
6. `plans/261122-0800-red-tests-and-backlog-sweep/reports/environmental-reds.md` gives each of the four suspected
   environmental reds a verdict (environmental or code cause) with a reproduction (phase 6).
7. `npm test` and `cargo test --workspace --no-fail-fast` on the merged tree are green, except the reds named in
   "Non-goals" and "Handed to other plans". `plans/261122-0800-red-tests-and-backlog-sweep/reports/integration-gate.md`
   lists each remaining red with its owner (phase 7).

## Non-goals

- The execution door seam reds `test/runner/dispatch-reconciliation-import-graph.test.mjs:251,279`; plan S6a owns them.
- Fixing a suspected environmental red beyond the verdict, unless the proof shows a code cause inside this plan's footprint.
- No assertion is weakened. Where a behaviour moved, the test names its new owner (design principle 8).
- No CHANGELOG line: nothing a user of fgOS sees changes.

## Handed to other plans

The secretary set this plan's footprint disjoint from `261122-0118-heads-stable-and-able`. The plan check also refuses
any overlap with the running plan `261118-1341-s6a-execution-tier-rust`, whose footprint covers `test/workflow/**`,
`test/run-supervisor/**`, `test/golden-recorders/**` and several single test files. These reds and references sit in files those
plans own, so this plan does not touch them. The secretary routes each one to the owning lead.

| Red or reference | File | Owning plan | Fix the owner applies |
|---|---|---|---|
| head-start probe: `display.title` | `test/session-host/head-start.test.mjs` | heads-stable-and-able (phase 4 already edits it) | assert the title the landed `ds-<id>-<topic>` discussion naming gives |
| `docs/backlog.md` sample paths | `test/session-host/head-request.test.mjs`, `packages/run-supervisor/rust/src/head_request.rs`, `packages/run-supervisor/rust/tests/head_request.rs` | heads-stable-and-able | name `plans/backlog.md` where the path stands for the live backlog |
| ten registered workflows, `coding/bugfix` (d44b2fb19) with its playbook | `test/workflow/guide-schema.test.mjs` | S6a (owns `test/workflow/**`) | assert the ten registered ids by name, keep every per-step playbook check for `coding/bugfix` |
| tab-label separator `·` to `: ` (483193f2a) | `test/run-supervisor/terminal-groups.test.mjs` | S6a (owns `test/run-supervisor/**`) | assert the landed label form with full-string equality, as phase 3 does for the plugin test |
| `migrate` missing from the native verb list | `test/cli/subcommand-flag-drift.test.mjs` | S6a (phase 21 rewrites this list) | add `migrate` (landed in 109997fcf) to the expected `NATIVE` list |
| `docs/backlog.md` sample paths | `test/cli/session-verb.test.mjs` | S6a | as above |
| `docs/backlog.md` in the confinement golden | `test/golden-recorders/confinement-policy.recorder.mjs`, then `policy.v1.json` and `resources.v1.json` regenerated by it | S6a (owns `test/golden-recorders/**`) | change the recorder inputs, then regenerate with `node test/golden-recorders/confinement-policy.recorder.mjs`; never edit the goldens by hand |
| install-packaging and `cli_tests.rs` code fix, if phase 6 finds one | `test/install-packaging.test.mjs`, `apps/fgos/tests/cli_tests.rs` | S6a | per phase 6's report |
| one-door scan pages the whole live repository for a fixture subdirectory, so a concurrent land makes `inspect-cursor-stale` (phase 6: code cause) | `scripts/git-one-door-scan.mjs`, `scripts/lib/git-dir-layout.mjs` | none: needs a new backlog row (secretary) | `listFiles` walks the fixture tree directly unless the root is the repository root; see `reports/environmental-reds.md` section 1 |
| `snapshotDir` follows directory symlinks under the live `.fgos` (phase 6: code cause, deterministic while the main checkout holds them) | `test/install-packaging.test.mjs` | S6a | skip or recurse into directory symlinks and snapshot a temp tree, not the live `.fgos`; report section 2 |
| single unretried lock probe after the supervisor exits (phase 6: not reproduced, hardening candidate) | `packages/run-supervisor/rust/tests/supervise_portable.rs:274` | none: needs a new backlog row (secretary) | poll with `wait_until` like the sibling tests; report section 4 |
| since a1022572a the secretary and supervisor can write `plans/backlog.md` and `plans/backlog/*` directly through the read-write `plans` bind, around the `session write` door and its item validation; the supervisor comment at `src/session-host/head-grants.mjs:70` is stale (phase 1 review) | `src/session-host/head-grants.mjs` | none: owner decision (secretary) | decide whether the door must stay the only backlog writer |

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Confinement tests use the plans/ portfolio](phase-01-confinement-portfolio-paths.md) | - | test/runner/dispatch-confinement-backend-p03.test.mjs, test/runner/dispatch-confinement-policies.test.mjs, test/runner/dispatch-confinement-machine-private.test.mjs | 1 | done (f25ab4c9a) |
| 2 | [Convention accepts the migrated portfolio names](phase-02-convention-portfolio-names.md) | - | packages/convention/contracts/convention.rules.v1.json, packages/convention/contracts/convention.golden.v1.json, packages/convention/rust/src/operations.rs, packages/convention/rust/tests/golden.rs, scripts/convention-conformance.mjs, test/scripts/convention-conformance.test.mjs | 1 | done (eb3378b49) |
| 3 | [The terminal skill test asserts the colon tab label](phase-03-tab-label-separator.md) | - | test/plugins/terminal-skill-attach.test.mjs | 1 | done (c831999d4) |
| 4 | [Config bundle lists secretary and the rotation comment passes the scrub](phase-04-config-bundle.md) | - | core/config-standard/sessionRotation.yaml, packages/config/rust/src/bundle.rs | 1 | parked: needs packages/config/contracts/fixtures/repo-differences.v1.json in the footprint (owner question q-4qtu54bnxz) |
| 5 | [Remaining portfolio sample paths](phase-05-portfolio-sample-paths.md) | - | test/scripts/check-decision-citation-drift.test.mjs, packages/durable-file/rust/tests/dir_replace.rs, apps/fgos/tests/session_write_publish.rs, plans/261122-0800-red-tests-and-backlog-sweep/reports/kept-legacy-references.md | 1 | done (bb9675c8d) |
| 6 | [Prove or disprove the environmental four](phase-06-environmental-proof.md) | - | plans/261122-0800-red-tests-and-backlog-sweep/reports/environmental-reds.md | 1 | done (1fee82c55) |
| 7 | [Integration gate](phase-07-integration-gate.md) | 1, 2, 3, 4, 5, 6 | plans/261122-0800-red-tests-and-backlog-sweep/reports/integration-gate.md | 2 | waiting: depends on parked phase 4 (q-4qtu54bnxz) |

Phase 1 note: the read-only backlog-file probe of the secretary case was retired because a1022572a made `plans` a read-write bind; the positive `plans/backlog.md` probe in the same case now owns the backlog behaviour (fix commit 4aa0a7e81 carries no body saying so).

Each phase names its dispatch capability in its file: `code:implement` for phases 1 to 5, `code:debug` for phase 6
and `code:test` for phase 7. Wave 1 phases have disjoint footprints and run at once. No hot file is shared: no
phase writes CHANGELOG, a registry or a manifest. Phase 2 changes the rules file that the draft plan
`261121-2110-component-authority-doors` will also edit in its last phase. That plan is not active, so there is no
overlap today; whichever lands second rebases.

## Owner questions

- q-4qtu54bnxz (phase 4): widen the footprint by `packages/config/contracts/fixtures/repo-differences.v1.json` so `["secretary"]` can be recorded as standard-only; without it `authoring_equivalence` stays red.

At planning time the discussion left no open point. The footprint narrowing above follows two rules already in force (the
secretary's disjoint-footprint rule and the plan check's active-overlap error), so it needed no owner decision.

## Outstanding questions

None

## Risks and rollback

- Phase 2 changes how the conformance check picks a cutoff. If it is wrong, it could let a new misnamed backlog file
  through. Proof point: the conformance test keeps its post-cutoff failure case and gains one for a new misnamed file
  under `plans/backlog/`.
- Phase 4 adds `secretary` to the config bundle, which changes the snapshot digest key. The proof is the full
  `cargo test -p fgos-config` plus `npm test`'s config tests in phase 7.
- Phase 6 may find a code cause in a file outside this footprint. In that case the phase records it and does not fix
  it. The fix goes to the owning plan or to a new backlog row.
- Rollback: each phase is one commit; revert that commit. The plan writes no data and no migration.
