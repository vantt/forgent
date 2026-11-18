---
contract: plan-v1
title: One door for resource contention and graph facts, as three independent packages every planner and engine can use
status: draft
priority: P2
blockedBy:
  - 261118-0947-session-verb-for-agent-sessions
footprint:
  - plans/261119-0030-resource-referee-graph-write-scope-stack
  - docs/platform/write-scope
  - docs/platform/graph
  - docs/platform/resource-referee
  - docs/platform/component-boundary.md
  - docs/reading-map.md
  - packages/write-scope
  - packages/graph
  - packages/resource-referee
  - packages/git/write-scope
  - packages/git/rust/Cargo.toml
  - packages/git/node-addon
  - packages/git/contracts/mutation-census.v1.json
  - packages/supervision/rust
  - packages/supervision/contracts
  - packages/host-runtime/contracts
  - apps/fgos/src
  - Cargo.toml
  - Cargo.lock
  - src/state/graph-metrics.mjs
  - src/state/graph-harness.mjs
  - src/state/store.mjs
  - src/intake/plan.mjs
  - src/report/capability-plan-lint.mjs
  - src/cli/command-registry.mjs
  - scripts/plan-contract-check.mjs
  - test/state
  - test/scripts
  - test/git/write-scope-parity.test.mjs
  - test/runner/write-scope.test.mjs
  - test/workflow/propose-classify.test.mjs
  - test/e2e
  - core/skills
  - plugins/fgOS/skills
  - .agents/skills
  - CHANGELOG.md
base: b8181061dbbe4a336a4daffb491e65b2908cebe4
source:
  - plans/reports/research-261118-1704-pkm-graph-algorithms-for-shared-overlap-core.md
created: 2026-11-19
---

# One door for resource contention and graph facts

## Outcome

Any planner, in any project that has fgOS installed, can hand a list of phases (id, depends-on,
the files each will write) to one door and get back whether the plan can be activated in parallel:
which phases collide on files, the layers (waves) they fit in, the critical path, independent
groups, any dependency cycle with its path, and a verdict with reasons under the planner's own
rules. Work, the supervisor, the merge conductor and later the dispatch gate use the same three
packages through thin adapters; none of them owns a copy.

Three independent packages, each with one authority, none knowing the layer above it:

| Package | Authority | Exists today |
|---|---|---|
| `write-scope` | What a declared path scope means, and whether two scopes can touch the same path (sound: never "disjoint" when a file is shared); finding all colliding pairs in a set | Yes, as `packages/git/write-scope` (moves out of `git/`) |
| `graph` | Deterministic facts about a directed graph with typed edges and exclusion pairs: cycles with paths, topological layers, layering under exclusions, critical path, independent groups. No domain meaning, no policy | No (six ordering and cycle copies exist) |
| `resource-referee` | Applies a ruleset given as data to those facts and to node claims, and returns findings plus a verdict. Never acts | No (rules are hard-coded in each caller) |

The planner door is an application: it reads a plan's phase table, builds claims and edges,
calls the three packages, and prints the verdict. Policy content belongs to each application.

## Facts this plan rests on

- Path rule today has six copies with three meanings: `fgos-write-scope::overlaps` (Rust),
  `src/runner/dispatch/write-scope.mjs` `writeScopesOverlap` (JS port that does not call the
  addon), `scripts/plan-contract-check.mjs` `overlaps`, `packages/supervision/rust/src/portfolio.rs`
  `overlaps`, `src/state/graph-metrics.mjs` `footprintOverlapAmong` (equal paths only), and
  `src/report/capability-plan-lint.mjs` `pathsOverlap` (regex glob). The newest copy (`portfolio.rs`)
  was written next to code that already calls `fgos_write_scope`.
- `fgos-write-scope` is used by git, the node addon and the supervisor, yet it sits under
  `packages/git/`, has no spec, and is absent from `component-boundary.md`.
- Graph and ordering copies: `src/state/dep-graph.mjs`, `src/state/graph-metrics.mjs` (Tarjan returns
  vertex sets only, no ordered path), `capability-plan-lint.mjs:400`, `instruction-composition.mjs:428`,
  `src/workflow/steps.mjs:12`, `packages/event-store/rust/src/order.rs` (not a target here).
- A neutral record already exists: `Unit` (`src/runner/execution/unit.mjs`) has `id`, `writes`,
  `dependsOn`. The plan phase table's "footprint" and Work's `footprint` are the same idea.
- `fgos plan` is a Work verb and `fgos plan-lint` checks capability annotations, so the planner
  door needs its own name. `runner.parallel` is a limit on concurrent runs, so "parallel" is not a
  safe package name; `referee` has no hits in the repository.
- `plan-vocabulary.v1.json` (read by the check script, the Rust portfolio reader and the Node
  resolver) is the working pattern for a data contract shared by JS and Rust.

## Prior art, reused and missing

Reused: `fgos-write-scope` as the path authority; the plan-side overlap meaning (it is also what
dispatch enforces); `computeSchedule` and `detectCycles` behaviour as the parity oracle; the
shared-contract-file pattern; the portfolio phase-table reader as the planner adapter; the
`suggestions` (sequence, hoist, re-slice) already attached to conflicts.
Missing: a path-segment trie for set-level overlap; ordered cycle paths in canonical rotation
(taken from pkm's cycle enumerator, counted in steps and not in seconds so output stays
deterministic); a parity corpus; a documented catalog of rule checks.

## Decisions made in the owner discussion (provisional until they hold across rounds)

1. Three packages with the names above; `packages/write-scope` leaves `packages/git/`.
2. Claims to colliding pairs is not a layer of its own: it is a set-level function of `write-scope`.
3. `graph` returns deterministic results with no policy and no domain meaning; where several
   answers are valid (topological order, which of two colliding nodes waits) the tie-break rule
   is written in the contract and the priority order is data supplied by the caller.
4. `resource-referee` uses a closed catalog of checks with open parameters, not per-application
   code and not an expression language. It contains no default policy.
5. `claims` (`{space, ref}`) is the input vocabulary for what a unit wants.
6. Event store does not need to adopt `graph`. Dispatch keeps its JS `write-scope.mjs` for now; a
   conformance test pins it to the Rust rule until dispatch moves.

## Decisions made while writing this plan (override at approval)

7. Truncation is a result: when the step cap is hit the packages return what they have plus
   `truncated: {reason, limit}`; the caller decides whether that fails. Input size is bounded too:
   each contract carries `limits` (nodes, edges, claims per node, path length, ruleset size) and
   input beyond them is refused by name.
8. Work advisories (`fgos conflicts`, `fgos schedule`) become stricter because they adopt the
   `write-scope` rule; this is a visible change and goes in the CHANGELOG.
9. In `graph`, "layer" is the neutral word; the planner adapter maps layer to the plan's "wave".
10. Working name of the planner door: `fgos referee --plan <dir> | --units <file.json>`; phase 1
    confirms it against the existing verb names.
11. The door takes `--policy <file>`. The shipped default policy is structural only and needs no
    extra data. A hot-file list or any project rule is data in the policy file a project supplies;
    this repository's own policy file is `packages/supervision/contracts/plan-referee-policy.v1.json`.
    No new config key in this plan. Reason: the hot-file rule is prose only
    (`core/skills/_shared/plan-contract.md:91`) and the phase table has six fixed columns
    (`packages/supervision/contracts/plan-vocabulary.v1.json:5`), so other projects cannot rely on
    an fgOS-internal list.
12. Catalog v1 holds only checks with a data source in a plan: no cycles, no dangling edges,
    claims declared, declared layers valid, alone-in-layer, maximum layer width. A numeric
    attribute check (phase size, risk) is left out until a plan table carries such a column.
13. A node that writes files but declares no claims is a blocking finding (`claims-declared`). An
    empty list means "unknown", not "disjoint": `portfolio.rs:200` treats empty lists as never
    overlapping, which would break the soundness contract of `write-scope`.
14. The mutation census is regenerated once, in phase 10, by the lead. It hashes 1464 files
    (`packages/git/contracts/mutation-census.v1.json`, checked by `test/git/one-door.test.mjs`), so
    a phase that edits any covered file would otherwise collide with every parallel phase on one
    generated file. Earlier phases verify with crate-local tests (same practice as commit 73a1ebff8).
15. No new external crate. Property-style tests use a small seeded generator written in the test
    file: `proptest` is not in the workspace and adding one edits `Cargo.toml` and the cargo-deny
    policy, both hot. Phase 2 declares `serde` and `serde_json` (`workspace = true`) for the two new
    crates so `Cargo.lock` changes only there.
16. How Node code calls the Rust packages (host verb or the native addon) is decided in phase 1 by
    measured cost and is binding: phases 3 and 8 follow it. Nothing before that decision assumes
    the addon.

## Acceptance criteria

1. `packages/git/write-scope` no longer exists; `packages/write-scope`, `packages/graph` and
   `packages/resource-referee` build in the workspace. Proof: `cargo test --workspace` (phase 10).
2. Only `write-scope` (Rust) and `src/runner/dispatch/write-scope.mjs` (JS port, pinned by the
   existing parity test, extended) define the overlap rule: `rg "fn overlaps|function overlaps|pathsOverlap|footprintOverlapAmong"`
   finds only them and the adapters. Path matching copies are recorded follow-ups below. Proof: phase 8.
3. `fgos referee --plan plans/<dir> --json` on a plan whose same-wave phases share a directory
   exits non-zero and names the pair, the shared paths and the rule. Proof: the wiring test in phase 7.
4. `fgos conflicts` reports a pair whose footprints are `src/state/` and `src/state/frontier.mjs`.
   Proof: one case in `test/state`, owned by the Work adapter.
5. `graph` equals the JS behaviour on the parity corpus for cycles, layers, critical path and
   groups; every intended difference is listed by name. Proof: phase 4.
6. Each rule in the catalog has one owning test; every blocking finding code is produced by some
   test. Proof: phase 5.
7. `plan-contract.md` section 4 tells a planner to run the door before fixing the phase table and
   both generated skill surfaces carry it. Proof: `npm run build:skills` leaves no diff.
8. `cargo test --workspace` and `npm test` are green, run one after the other.
9. `fgos referee` rejects a plan with a writing phase that has no footprint (`claims-declared`), and
   refuses input beyond the contract's `limits` by name. Proof: phase 5 owns the rule, phase 7 one
   wiring case.

## Non-goals

- No change to Work's storage, status machine or `deps`/`parent` rules.
- No migration of dispatch's runtime enforcement, event store, instruction composition or the
  state-transition graphs in this plan; the packages are built so they can adopt later.
- No web UI, no MCP tool, no new always-loaded instruction (L8): the plan contract is the discovery
  point.
- No expression language for rules, no new config key, no new doctor row.

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Specs, boundary rows and contracts](phase-01-specs-and-contracts.md) | - | docs/platform/write-scope, docs/platform/graph, docs/platform/resource-referee, docs/platform/component-boundary.md, packages/graph/contracts, packages/resource-referee/contracts, plans/261119-0030-resource-referee-graph-write-scope-stack/reports | 1 | draft |
| 2 | [Workspace scaffold and write-scope move](phase-02-scaffold-and-move.md) | - | Cargo.toml, Cargo.lock, packages/write-scope, packages/git/write-scope, packages/git/rust/Cargo.toml, packages/git/node-addon/Cargo.toml, packages/supervision/rust/Cargo.toml, packages/graph/rust, packages/resource-referee/rust, test/workflow/propose-classify.test.mjs | 1 | draft |
| 3 | [write-scope: colliding pairs in a set](phase-03-write-scope-pairs.md) | 1, 2 | packages/write-scope, packages/git/node-addon/src, test/git/write-scope-parity.test.mjs, test/runner/write-scope.test.mjs | 2 | draft |
| 4 | [graph crate and parity corpus](phase-04-graph-crate.md) | 1, 2 | packages/graph/rust | 2 | draft |
| 5 | [resource-referee crate](phase-05-resource-referee-crate.md) | 1, 3, 4 | packages/resource-referee/rust | 3 | draft |
| 6 | [Supervisor adapter](phase-06-supervisor-adapter.md) | 3 | packages/supervision/rust | 3 | draft |
| 7 | [Planner door and plan policy](phase-07-planner-door.md) | 1, 5, 6 | apps/fgos/src, packages/host-runtime/contracts, packages/supervision/contracts | 4 | draft |
| 8 | [Work, plan-check and plan-lint adapters](phase-08-node-adapters.md) | 7 | src/state/graph-metrics.mjs, src/state/graph-harness.mjs, src/state/store.mjs, src/intake/plan.mjs, src/report/capability-plan-lint.mjs, src/cli/command-registry.mjs, scripts/plan-contract-check.mjs, test/state, test/scripts | 5 | draft |
| 9 | [Discovery in the contract and skills](phase-09-discovery.md) | 7 | core/skills, plugins/fgOS/skills, .agents/skills, CHANGELOG.md, docs/reading-map.md | 5 | draft |
| 10 | [Integration and full gate](phase-10-integration.md) | 8, 9 | packages/git/contracts/mutation-census.v1.json, test/e2e, plans/261119-0030-resource-referee-graph-write-scope-stack | 6 | draft |

Reading check (planner applied the contract by hand, then ran the script): every phase sits in a
later wave than everything it depends on; the longest chain is six waves (1, 2, 3, 4, 5, 6);
phases 1 and 2 share wave 1, phases 3 and 4 wave 2, phases 5 and 6 wave 3, phases 8 and 9 wave 5,
each pair with disjoint footprints. Phase 2 does not read any phase 1 output, so it runs beside it.
Hot and generated files each have exactly one owner: `Cargo.toml` and `Cargo.lock` phase 2 (it
declares every dependency edge and the `serde` and `serde_json` entries for the new crates up front,
so later phases add none; a phase that must add an external crate stops and asks the lead),
`mutation-census.v1.json` phase 10 (regenerated once by the lead), `CHANGELOG.md` phase 9.

## Order against another active plan (owner decision 2026-11-19: hard order)

Measured with the plan check's own overlap rule against every `ready` or `running` plan, only
`261118-0947-session-verb-for-agent-sessions` overlaps. Its footprint is broad (`src/**`, `test/**`,
`core/skills/**`, `apps/fgos/src/main.rs`, `packages/host-runtime/contracts/**`,
`packages/git/node-addon/**`, the generated skill surfaces). Phases 2, 3, 7, 8, 9 and 10 write files
inside it; phases 1, 4, 5 and 6 do not.

The owner chose a hard order, so this plan has `blockedBy: [261118-0947-session-verb-for-agent-sessions]`
and stays `draft` as a whole. `blockedBy` is a plan-level field, so it also holds phases 1, 4, 5 and
6, which would otherwise have been free to start. If the owner later wants those four to start
first, split them into their own plan.

The check script does not honour `blockedBy` when it looks for overlaps: `activeOverlaps` in
`scripts/plan-contract-check.mjs:149-157` flags any two `ready` or `running` plans whose footprints
overlap, while the plan contract says to resolve an overlap by `blockedBy`. So this plan cannot be
set `ready` while the other plan is `ready` or `running`; once that plan is `done` the overlap
disappears and this plan can be set `ready`. The mismatch is recorded below as a follow-up.

## Recorded follow-ups (separate items, not in this plan)

Found while reviewing; each is a duplicate or a candidate of the same kind and is left out on purpose.
- Path matching copies (is this file in the declared scope): `src/runner/merge.mjs:163`
  (`buildOwnFileSet`) and `src/runner/frozen-judge.mjs:52` (`frozenJudgeHits`) compare by equality.
- "Is this path inside that directory" family, a different question from scope overlap:
  `src/workflow/dir-guard.mjs:31`, `src/runner/dispatch/assignment-layout.mjs:42`,
  `src/runner/dispatch/confinement/resources.mjs:352`, `src/state/hot-lock.mjs:211`,
  `packages/execution/rust/src/accounts.rs:36`.
- Ordering and cycle copies outside this plan: `src/setup/instruction-composition.mjs:428`,
  `src/workflow/steps.mjs:12`, `packages/event-store/rust/src/order.rs` (event store stability comes
  first), `src/workflow/case-admission.mjs:62`, `src/state/frontier.mjs:315`.
- The five guards of `src/workflow/case-admission.mjs` are candidate rules for a future ruleset.
- `activeOverlaps` in `scripts/plan-contract-check.mjs:149-157` ignores `blockedBy`, contradicting the
  plan contract section 5; either the script skips pairs where one plan is blocked by the other, or
  the contract text changes. Phase 8 touches this script for another reason and should not absorb it.

## Owner questions

None open. Two items are decided with evidence in phase 1, not by the owner: how Node code calls
the Rust packages (host verb or the existing native addon, by measured cost) and the final name of
the planner door.

## Risks and rollback

- Moving `write-scope` touches the workspace `Cargo.toml` and three consumers' manifests, hot
  files of other lanes. Announce before phase 2; the lane that lands second rebases (board rule).
- The census is a single generated file covering 1464 sources; two phases regenerating it in
  parallel would conflict. Only phase 10 regenerates it, and a phase branch is expected to fail
  `test/git/one-door.test.mjs` until then.
- Stricter Work advisories surface conflicts that were silently missed. The adapter can restore
  equality-only matching for one release; remove it in the same change if unused.
- Rollback: each phase is its own commit. Reverting 8, 7, 6, 5, 4, 3, 2 in that order restores
  the old crates and copies; the old copies are deleted only in phases 6 and 8 after parity holds.

## Validation Log

### Verification Results (Full tier, 10 phases)
- Claims checked: 32 | Verified: 32 | Failed: 0 | Unverified: 0
- Method: a script that tests each load-bearing claim (file, symbol, manifest line) against the tree.
  It covered crate and manifest locations, the six overlap copies, the ordering copies, the `Unit`
  shape, the contract files, and that the three new package directories do not exist yet.
- Further evidence found during the pass (not claims of the plan, but facts it had missed): see the
  red team table, findings 1, 2, 5 and 6.

### Whole-Plan Consistency Sweep
- Old terms searched in every plan file: `shared-overlap`, `fgos overlap`, `parallel` package name,
  `L1`, "conformance test under test/runner/dispatch", "census ... phase 7", "proptest".
- Stale claims removed: census owned by phase 7; `test/runner/dispatch` as the conformance test
  location; waves 7 and 6 labels; phase 2 depending on phase 1; proptest in phases 3 and 4.
- Unresolved contradictions: none.

## Red Team Review

Method: the four hostile lenses (assumptions, failure modes, scope, security) were run in one
session by the planner, because the reviewer subagents could not be started: the dispatch gate
refuses with `config-schema ... runner.personas.secretary` (the installed `fgos` predates the
current `.fgos/config.yaml`). Every finding below cites a file and line; findings without one were
dropped by the evidence filter.

| # | Lens | Severity | Finding | Evidence | Disposition |
|---|---|---|---|---|---|
| 1 | Failure | Critical | The census was owned by phase 7, but it hashes 1464 files; any phase editing a covered file breaks `one-door.test.mjs`, and parallel phases would collide on one generated file | `packages/git/contracts/mutation-census.v1.json:546`, `test/git/one-door.test.mjs`, commit `73a1ebff8` | Accept: census owned by phase 10 only (decision 14) |
| 2 | Failure | High | Phase 2 moves a crate whose old path is hard-coded in a test that is not in its footprint | `test/workflow/propose-classify.test.mjs:48` | Accept: file added to phase 2, plus a repo-wide search step |
| 3 | Assumption | High | "Cargo.lock changes only in phase 2" was false unless phase 2 declares the new crates' external dependencies; `proptest` is not in the workspace | `packages/supervision/rust/Cargo.toml:17-18`, `Cargo.toml:58-62` | Accept: decision 15, phase 2 declares `serde` and `serde_json`; no new crate |
| 4 | Scope | High | The door was meant for "any project" but its policy and hot-file list lived in an fgOS-internal file, and the plan table cannot carry size or risk | `core/skills/_shared/plan-contract.md:91`, `packages/supervision/contracts/plan-vocabulary.v1.json:5` | Accept: decisions 11 and 12, `--policy` flag, catalog v1 trimmed |
| 5 | Assumption | High | An empty footprint reads as "no conflict", so the soundness claim of `write-scope` fails for an undeclared writer | `packages/supervision/rust/src/portfolio.rs:200-210` | Accept: decision 13, `claims-declared` check |
| 6 | Scope | Medium | Phase 3 adds a conformance test but an owning parity test already runs the JS golden suite against the native leaf | `test/git/write-scope-parity.test.mjs:1-30` | Accept: extend that test and `test/runner/write-scope.test.mjs` (design principle 8) |
| 7 | Assumption | Medium | Phase 3 assumed the node addon before phase 1 decides how Node calls the packages, and phases 4 and 5 expose nothing | `packages/git/node-addon/src/git/write_scope.rs:13-46` | Accept: decision 16 |
| 8 | Parallelism | Medium | Phase 2 reads nothing from phase 1, and phases 3 to 7 read phase 1 contracts without declaring it | phase files, "Inputs" | Accept: phase 2 in wave 1; depends-on columns complete; longest chain 6 waves instead of 7 |
| 9 | Scope | Medium | Acceptance 2 claimed one path rule, but matching copies remain elsewhere | `src/runner/merge.mjs:163`, `src/runner/frozen-judge.mjs:52` | Accept: criterion narrowed, follow-ups recorded |
| 10 | Security | Low | The door reads plan tables and JSON from untrusted paths with no input size bound | `packages/supervision/rust/src/portfolio.rs:342` | Accept: contract `limits` (decision 7), refusal by name |
| 11 | Failure | Low | `base` was a placeholder, not a real commit | `plan.md` frontmatter | Accept: fixed to the real commit |
| R | Scope | n/a | "Ten phases is too many for one door" | none | Reject: no file evidence; each phase has a distinct owner and footprint |
| R | Scope | n/a | "The referee has only one consumer, so it is speculative" | none | Reject: owner decision 4 settles it; the plan policy is the first real case |

### Whole-Plan Consistency Sweep
Re-read after applying the findings: `plan.md` and all ten phase files agree on wave numbers,
depends-on, the census owner, the Node access rule and the catalog. Unresolved contradictions: none.
