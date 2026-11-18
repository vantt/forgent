---
contract: plan-v1
title: The planner door resource-check, the supervisor, plan-check, plan-lint and Work adapters, and discovery, on top of the three packages
status: draft
priority: P2
blockedBy:
  - 261119-0030-resource-referee-graph-write-scope-stack
  - 261118-1159-owner-question-store
footprint:
  - plans/261119-0528-resource-check-door-and-adapters
  - apps/fgos/Cargo.toml
  - apps/fgos/src
  - packages/host-runtime/contracts
  - packages/supervision/rust
  - src/cli/command-registry.mjs
  - src/state/graph-metrics.mjs
  - src/state/graph-harness.mjs
  - src/state/graph-adapter.mjs
  - src/state/store.mjs
  - src/intake/plan.mjs
  - src/report/capability-plan-lint.mjs
  - scripts/plan-contract-check.mjs
  - docs/architecture-manifest.json
  - docs/reading-map.md
  - test/rust-host
  - test/cli/unknown-flag-rejection.test.mjs
  - test/helpers/command-manifest.mjs
  - test/state
  - test/scripts
  - test/intake/plan.test.mjs
  - core/skills
  - plugins/fgOS/skills
  - .agents/skills
  - CHANGELOG.md
base: 49cc3885dc1515bce95f3d39a5ad3651846604f3
source:
  - plans/261119-0030-resource-referee-graph-write-scope-stack
created: 2026-11-19
---

# The planner door and every consumer of the packages

## Outcome

Any planner, in any project that has fgOS installed, can run one door, `fgos resource-check`, on a plan
or a units file and get back whether the plan can be activated in parallel: the colliding pairs and the
shared paths, the layers (waves), the critical path, independent groups, any dependency cycle with its
path, and a verdict with reasons. The supervisor, the plan-check script, plan-lint and Work call the same
packages and own no overlap rule of their own; they all switch in this one landing, so no two authorities
can answer the same pair differently. The plan contract and the planning skills tell a planner to run the
door before fixing the phase table.

This plan builds on the packages and the addon bindings of `plans/261119-0030-resource-referee-graph-write-scope-stack` (plan A), which it is blocked by.
Plan A's `plan.md` holds the facts, the prior art, decisions 1 to 29 and the review logs; decisions 7, 8,
10, 11, 13, 16 to 18, 20 to 25, 28 and 29 govern this plan. Phases 1 to 7 and 7c named in these files live
in plan A.

## Acceptance criteria

1. The overlap rule is no longer defined in `scripts/plan-contract-check.mjs` (`overlaps`),
   `src/report/capability-plan-lint.mjs` (`pathsOverlap`), `src/state/graph-metrics.mjs`
   (`footprintOverlapAmong`) or `packages/supervision/rust/src/portfolio.rs` (`overlaps`): each calls the
   packages. Proof: one owning test each (phases 8 and 8b), and a `door` entry in
   `docs/architecture-manifest.json` that fails a new copy (decision 29).
2. `fgos resource-check --plan <dir> --json` on a hand-built bad plan whose same-wave phases share a
   directory exits non-zero and names the pair, the shared paths and the rule; on a hand-built good plan
   it exits zero. Proof: the single wiring test in phase 7b (running the door on a real plan is a smoke
   check).
3. `fgos conflicts` reports a pair whose footprints are `src/state/` and `src/state/frontier.mjs`. Proof:
   one case in `test/state`, owned by the Work adapter.
4. `plan-contract.md` section 4 tells a planner to run the door before fixing the phase table and both
   generated skill surfaces carry it. Proof: `npm run build:skills` leaves no diff.
5. `fgos resource-check` rejects a plan with a phase that has no footprint and a footprint entry that
   does not canonicalize, refuses input beyond the contract `limits`, a symlinked or non-regular file, by
   name without quoting file content. Proof: plan A's phase 5 owns the rules, phase 7b one wiring case.
6. Every consumer fails closed on a truncated answer, and the supervisor's reporting function returns the
   named reasons `footprint-entry-invalid` and `footprint-empty`. Proof: one wiring case per consumer
   (phases 8 and 8b); no running door reads the supervisor's reasons yet.
7. Work adapters call the packages in process through the native addon. Proof: the adapter tests.
8. `cargo test --workspace`, `npm test` and `node scripts/plan-contract-check.mjs --all` are green, run
   one after the other, and the census matches the tree. Proof: phase 10.

## Non-goals

- The packages and the addon bindings (plan A).
- Any change to Work's storage, status machine or `deps`/`parent` rules.
- Wiring the supervisor's admission into a running door: nothing calls `admissible` today.
- A web UI, an MCP tool, a new always-loaded instruction, a new config key or a doctor row.
- The merge conductor and the dispatch gate adopting the packages, and `globsMeet`.

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 7b | [Planner door, default policy and verb tables](phase-07b-planner-door.md) | - | apps/fgos/Cargo.toml, Cargo.lock, apps/fgos/src, packages/host-runtime/contracts, src/cli/command-registry.mjs, test/rust-host, test/cli/unknown-flag-rejection.test.mjs, test/helpers/command-manifest.mjs | 1 | draft |
| 8 | [Work, plan-check and plan-lint adapters](phase-08-node-adapters.md) | - | src/state/graph-metrics.mjs, src/state/graph-harness.mjs, src/state/graph-adapter.mjs, src/state/store.mjs, src/intake/plan.mjs, src/report/capability-plan-lint.mjs, scripts/plan-contract-check.mjs, docs/architecture-manifest.json, test/state, test/scripts, test/intake/plan.test.mjs | 1 | draft |
| 8b | [Supervisor adapter](phase-08b-supervisor-adapter.md) | - | packages/supervision/rust | 1 | draft |
| 9 | [Discovery in the contract and skills](phase-09-discovery.md) | 7b, 8, 8b | core/skills, plugins/fgOS/skills, .agents/skills, CHANGELOG.md, docs/reading-map.md | 2 | draft |
| 10 | [Integration and full gate](phase-10-integration.md) | 8, 8b, 9 | packages/git/contracts/mutation-census.v1.json, plans/261119-0528-resource-check-door-and-adapters/reports | 3 | draft |

Reading check (planner applied the contract by hand, then ran the script, which reads frontmatter and
this table only): every phase sits in a later wave than everything it depends on; the longest chain is
three waves; phases 7b, 8 and 8b share wave 1 with disjoint footprints (phase 8 needs the addon bindings
and the recording of plan A, not the door). Hot and generated files have one owner per wave:
`apps/fgos/Cargo.toml` and one `Cargo.lock` regeneration, `command-registry.mjs` and the verb tables phase
7b; `docs/architecture-manifest.json` phase 8; `CHANGELOG.md` and the reading map phase 9; the census
phase 10. Every phase commits in its own linked worktree (plan A decision 14).

## Order against other active plans

- `261119-0030-resource-referee-graph-write-scope-stack` (plan A): blocked by it; this plan starts when
  plan A is `done`.
- `261118-1159-owner-question-store`: `ready`, P1; blocked by it at the owner's request. These phases
  overlap its remaining work (`apps/fgos/src`, `packages/host-runtime/contracts`,
  `src/cli/command-registry.mjs`, `scripts/plan-contract-check.mjs`, `docs/architecture-manifest.json`,
  the skill surfaces, `CHANGELOG.md`, `docs/reading-map.md`, the census).
- `261118-1045-project-supervisor`: `draft`, P1, owner of the design of `portfolio.rs` (footprint
  `packages/supervision/**`). Phase 8b changes that file; whichever plan lands second rebases, and the lane is
  told before phase 8b starts.

## Owner questions

None. The order was decided by the owner: this plan waits for plan A and for `owner-question-store`.

## Risks and rollback

- Stricter Work advisories surface conflicts that were silently missed (plan A, decision 8). Phase 8
  records before and after outcomes on real Work views and whether the fan-out verifier's exit code can
  change; the CHANGELOG names the effect; there is no switch back; reverting phase 8 restores the old
  behaviour.
- The supervisor and the plan-check script switch to the new rule in the same landing; if only one
  landed, they would cut a glob differently (a character cut versus a segment cut), which is why they
  are not split.
- A payload run against an addon from before plan A is refused by name, never silently.
- Rollback: each phase is its own commit. Revert in the reverse order 10, 9, 8b, 8, 7b, regenerate the
  census and rebuild `Cargo.lock` at the end. If a release was activated, re-stage and re-activate the
  previous release with `fgctl repair` and run `fgos doctor` through the shim.
