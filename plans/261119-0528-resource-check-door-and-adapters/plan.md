---
contract: plan-v1
title: The planner door resource-check, the supervisor, plan-check, plan-lint and Work adapters, and discovery, on top of the three packages
status: ready
priority: P2
blockedBy:
  - 261119-0030-resource-referee-graph-write-scope-stack
  - 261118-1159-owner-question-store
footprint:
  - plans/261119-0528-resource-check-door-and-adapters
  - apps/fgos/Cargo.toml
  - apps/fgos/src
  - packages/host-runtime/contracts
  - packages/host-runtime/rust/src/catalog.rs
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
  - test/cli/fgos-read-5.test.mjs
  - test/cli/fgos-intake-2.test.mjs
  - test/cli/fgos-intake-3.test.mjs
  - test/cli/fgos-intake-4.test.mjs
  - test/cli/fgos-intake-5.test.mjs
  - test/cli/fgos-intake-6.test.mjs
  - test/cli/fgos-intake-7.test.mjs
  - test/helpers/command-manifest.mjs
  - test/state
  - test/scripts
  - test/report/capability-plan-lint.test.mjs
  - test/cli/plan-lint.test.mjs
  - test/direct/fgos-merge.test.mjs
  - test/direct/fgos-read.test.mjs
  - test/parity/read-parity.test.mjs
  - test/intake/plan.test.mjs
  - core/skills
  - domains/coding/skills
  - plugins/fgOS/skills
  - .agents/skills
  - .claude/skills
  - CHANGELOG.md
base: e5ea2c754940704d6bc37bca1815d3340c6ce9bc
source:
  - plans/261119-0030-resource-referee-graph-write-scope-stack
created: 2026-11-19
---

# The planner door and every consumer of the packages

## Outcome

Any planner, in any project that has fgOS installed, can run one door, `fgos resource-check`, on a plan
or a units file and get back whether the plan can be activated in parallel: the colliding pairs and the
shared paths, the layers (waves), the critical path, independent groups, any dependency cycle with its
path, and a verdict with reasons. The supervisor, the plan-check script, plan-lint and Work (including
merge readiness) call the same packages and own no overlap rule of their own; they all switch in this one
landing, so no two authorities can answer the same pair differently. The phase-table readers keep every
glob and refuse a malformed table instead of dropping a cell. The plan contract and the planning skills tell
a planner to run the door before fixing the phase table.

This plan builds on the packages and the addon bindings of `plans/261119-0030-resource-referee-graph-write-scope-stack` (plan A), which it is blocked by.
Plan A's `plan.md` holds the facts, the prior art, decisions 1 to 31 and the review logs; decisions 7, 8,
10, 11, 13, 16 to 18, 20 to 25 and 28 to 31 govern this plan. Phases 1 to 7 and 7c named in these files live
in plan A.

## Acceptance criteria

1. The overlap rule is no longer defined in `scripts/plan-contract-check.mjs` (`overlaps`),
   `src/report/capability-plan-lint.mjs` (`pathsOverlap`), `src/state/graph-metrics.mjs`
   (`footprintOverlapAmong`) or `packages/supervision/rust/src/portfolio.rs` (`overlaps`): each calls the
   packages. Proof: one owning test each (phases 8 and 8b), and a `door` entry in
   `docs/architecture-manifest.json` that fails a new copy (plan A decision 29).
2. `fgos resource-check --plan <dir> --json` on a hand-built bad plan whose same-wave phases share a
   directory, or list `apps/fgos/tests/questions_*.rs` against `apps/fgos/tests/questions_a.rs`, exits
   non-zero and names the pair, the shared paths and the rule; on a hand-built good plan it exits zero.
   Proof: the single wiring test in phase 7b (running the door on a real plan is a smoke check).
3. `fgos conflicts` reports a pair whose footprints are `src/state/` and `src/state/frontier.mjs`. Proof:
   one case in `test/state`, owned by the Work adapter.
4. `plan-contract.md` section 4 tells a planner to run the door before fixing the phase table and both
   generated skill surfaces carry it. Proof: `npm run build:skills` leaves no diff beyond the listed files.
5. The door refuses by name, without quoting file content raw: a missing file, a symlinked root (also
   given with a trailing slash) or leaf, a FIFO, an oversize file, a footprint entry that does not
   canonicalize, a phase with no footprint, a plan with no phase table or no rows, an unknown claim space,
   and a missing or unreadable policy file (which never falls back to the default); a bare file name in the
   current directory works. Every echoed value is escaped. Proof: phase 7b owns the input-refusal cases; plan
   A's phase 5 owns the rules.
6. Every consumer fails closed on a `truncated` answer from the pair scan. The supervisor's
   `footprint_problem` returns `footprint-entry-invalid` and `footprint-empty` and `admissible` uses it. A
   Work item without a footprint keeps meaning "no claim". Proof: one wiring case per consumer (phases 8
   and 8b).
7. Both phase-table readers keep every `*` and refuse a wave that is not an integer from 1, a duplicate id,
   a missing column and a non-string entry. Proof: phases 8b and 8, one owning test each.
8. Work adapters call the packages in process through the native addon, and the before and after outcomes of
   `fgos conflicts`, `fgos schedule`, the decompose gate, merge readiness and the fan-out verifier are
   recorded. Proof: the adapter tests and the record in phase 8.
9. `cargo test --workspace`, `npm test` and the plan-contract check of plan A decision 30 are green, run one
   after the other, and the census matches the tree. Proof: phase 10.

## Non-goals

- The packages and the addon bindings (plan A).
- Any change to Work's storage, status machine or `deps`/`parent` rules.
- Wiring the supervisor's admission into a running door: nothing calls `admissible` today.
- A web UI, an MCP tool, a new always-loaded instruction, a new config key or a doctor row.
- Redesigning the merge conductor's logic, the dispatch gate adopting the packages, and `globsMeet`.

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 8b | [Supervisor adapter and the honest phase-table reader](phase-08b-supervisor-adapter.md) | - | packages/supervision/rust | 1 | done |
| 8 | [Work, plan-check and plan-lint adapters](phase-08-node-adapters.md) | 8b | src/state/graph-metrics.mjs, src/state/graph-harness.mjs, src/state/graph-adapter.mjs, src/state/store.mjs, src/intake/plan.mjs, src/report/capability-plan-lint.mjs, scripts/plan-contract-check.mjs, docs/architecture-manifest.json, test/state, test/scripts, test/report/capability-plan-lint.test.mjs, test/cli/plan-lint.test.mjs, test/direct/fgos-merge.test.mjs, test/direct/fgos-read.test.mjs, test/parity/read-parity.test.mjs, test/cli/fgos-read-5.test.mjs, test/cli/fgos-intake-2.test.mjs, test/cli/fgos-intake-3.test.mjs, test/cli/fgos-intake-4.test.mjs, test/cli/fgos-intake-5.test.mjs, test/cli/fgos-intake-6.test.mjs, test/cli/fgos-intake-7.test.mjs, test/intake/plan.test.mjs | 2 | done |
| 7b | [Planner door, default policy and verb tables](phase-07b-planner-door.md) | 8b | apps/fgos/Cargo.toml, Cargo.lock, apps/fgos/src, packages/host-runtime/contracts, packages/host-runtime/rust/src/catalog.rs, src/cli/command-registry.mjs, test/rust-host, test/cli/unknown-flag-rejection.test.mjs, test/helpers/command-manifest.mjs | 2 | done |
| 9 | [Discovery in the contract and skills](phase-09-discovery.md) | 7b, 8, 8b | core/skills, domains/coding/skills, plugins/fgOS/skills, .agents/skills, .claude/skills, CHANGELOG.md, docs/reading-map.md | 3 | draft |
| 10 | [Integration and full gate](phase-10-integration.md) | 8, 8b, 9 | packages/git/contracts/mutation-census.v1.json, plans/261119-0528-resource-check-door-and-adapters/reports | 4 | draft |

Reading check (planner applied the contract by hand, then ran the script, which reads frontmatter and
this table only): every phase sits in a later wave than everything it depends on; the longest chain is
four waves; phase 8b is alone in wave 1, and phases 8 and 7b share wave 2 with disjoint footprints (phase 8
waits for 8b so that the `door` row of the manifest never sees the supervisor copy; the door waits for the
reader fixed in 8b). Hot and generated files have one owner per wave: `apps/fgos/Cargo.toml` and one
`Cargo.lock` regeneration, `command-registry.mjs` and the verb tables (regenerated with
`node scripts/export-command-selectors.mjs`) phase 7b; `docs/architecture-manifest.json` phase 8;
`CHANGELOG.md`, the reading map and the generated skill surfaces phase 9; the census phase 10. After every
wave the lead merges that wave's branches into the integration branch and each later wave branches from
it. Every phase commits in its own linked worktree (plan A decision 14).

## Order against other active plans

- `261119-0030-resource-referee-graph-write-scope-stack` (plan A): blocked by it. This plan stays `draft`
  until plan A is `done` and `owner-question-store` is `done` (plan A decision 25); promoting it earlier makes
  `activeOverlaps`, which ignores `blockedBy`, report an overlap no phase here can fix.
- `261118-1159-owner-question-store`: `ready`, P1; blocked by it at the owner's request. These phases
  overlap its remaining work (`apps/fgos/src`, `packages/host-runtime/contracts`,
  `src/cli/command-registry.mjs`, `scripts/plan-contract-check.mjs`, `docs/architecture-manifest.json`, the
  skill surfaces, `CHANGELOG.md`, `docs/reading-map.md`, the census).
- `261118-1045-project-supervisor`: `draft`, P1, owner of the design of `portfolio.rs` (footprint
  `packages/supervision/**`). Phase 8b changes that file; whichever plan lands second rebases, the lane is told
  before phase 8b starts and is also told not to promote that plan while this one is running.
- Step zero (plan A decision 24) applies before the first phase starts: refresh `base`, re-read the cited file
  and line facts, re-run the plan check through plan A's runner and record a second baseline of the old
  plan-check verdicts at this plan's own base, so differences caused by `owner-question-store` are not
  reported as rule changes.

## Owner questions

None. The order was decided by the owner: this plan waits for plan A and for `owner-question-store`. Merge
readiness is in scope through the Work exports (plan A decision 8); the owner can still ask to keep it on the
old rule as named debt.

## Risks and rollback

- Stricter Work advisories and merge readiness surface conflicts that were silently missed (plan A,
  decision 8). Phase 8 records before and after outcomes on real Work views and whether the fan-out
  verifier's exit code can change; the CHANGELOG names each effect; there is no switch back; reverting
  phase 8 restores the old behaviour.
- The supervisor and the plan-check script switch to the new rule in the same landing; if only one landed,
  they would cut a glob differently (a character cut versus a segment cut), which is why they are not split.
- A payload run against an addon from before plan A is refused by name, never silently.
- Rollback: each phase is its own commit. Revert in the reverse order 10, 9, 7b, 8, 8b, regenerate the census
  and rebuild `Cargo.lock` at the end. If a release was activated, re-activate the digest recorded before
  plan A's landing (`fgctl repair` steps back one activation only) and run `fgos doctor` through the shim.
