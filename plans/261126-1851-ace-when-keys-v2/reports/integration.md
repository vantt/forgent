# Integration of the when-key registry v2

Date: 2026-11-26. Tree: main at `259d8c84b` (phase 1 landed as `37c57401e`) plus two test fixes on branch `when-keys-v2/p02`.

## Verdict

Every command of the phase's Verify list passes, except that `cargo test --workspace` and `npm test` are not fully green:
the remaining red tests were measured on main and none belongs to this plan. One red test was this plan's (a Node fixture
that still used a removed key); it is fixed on the branch.

## Commands and results

| Command | Result |
|---|---|
| `cargo test --workspace --no-fail-fast` | 454 groups pass, 2 groups fail, 4 tests fail (below) |
| `npm test` | 6566 tests, 6511 pass, 28 fail before the fixture fix; 27 after it |
| `fgos authority render --check` | `drift: []` |
| `rg -n 'when-keys\.v1' packages docs core apps src` | no output |
| `node scripts/plan-contract-check.mjs --plan plans/261126-1851-ace-when-keys-v2` | `ok` |
| plan `261122-1946-agent-start-context` lists this plan in `blockedBy` | yes |

Phase 1 checks on its own branch: crate 112 tests (all features) and 86 (without pkm), agent-protocol 22, host reader 4,
door 5, rustfmt clean; the committed effective set records `whenKeysVersion: 2`.

## The failure this plan owned, and its fix

`materializeInstructionProjection leaves out a rule that carries a when restriction` (`test/setup/instruction-projections.test.mjs`)
wrote a unit with `when: role: [producer]`. In registry v2 the values of `role` come live from each domain's `registry.yaml`, and
the test's temporary project has no domain, so the context engine refused the unit (`rule-when-value-invalid`). Phase 1 missed this
reader. Fixed in two commits: the fixture uses `sessionType: [worker]` (static values), and the expected id list is in sorted order.
That test file is outside the plan's footprint: a reader of the removed key had to move in the same change.

## Red tests that were red on main without this plan (not touched)

Cargo (`cargo test --workspace`):
- `a_planner_mailing_a_head_outside_its_row_is_refused_recipient_not_allowed`, `a_ticket_verb_answers_at_once_while_its_detached_runner_outlives_the_route_child`,
  `only_the_head_request_handover_uses_the_active_payload_and_still_verifies_the_envelope`: all in the supervision crate (`fgos-run-supervisor`,
  `tests/head_request.rs`), which this plan does not touch; re-run alone on main, they fail.
- `every_top_level_package_contract_file_and_every_prose_contract_has_exactly_one_row`: `packages/supervision/contracts/scheduling-record.v1.json` has
  no authority row (added by another lane on 2026-11-26); fails on main.

Node (`npm test`), all measured on main or load-dependent:
- `assembleSkills output matches the committed .agents/skills byte-for-byte`: commit `5d01f9a79` (supervision) changed skill sources without regenerating `.agents/skills`.
- `admission lands status, lead role and trunk base together before starting the lead` and `each wake checks running plans even without an event…`: supervision wake and admission tests.
- 24 others, the set already known on main: herdr-spawn seat suites, fgctl upgrade, init and download, holder-lock gate, provisioning, workflow guide model.

## What happened during the gate

The disk of this machine filled to 100 percent while the gates ran (build outputs of the full workspace test: 46 GB in this worktree
and 15 GB added to the main checkout). Every test result taken while the disk was full was discarded and repeated after
space was freed. Build outputs of the delivered phase worktrees were cleaned with the build tool's own clean command; no other session's files were touched.
