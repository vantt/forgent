---
contract: plan-v1
title: "Three independent packages for resource contention and graph facts: write-scope, graph and resource-referee, with the supervisor adapter and the addon bindings"
status: ready
priority: P2
blockedBy:
  - 261118-0947-session-verb-for-agent-sessions
footprint:
  - plans/261119-0030-resource-referee-graph-write-scope-stack
  - docs/platform/write-scope
  - docs/platform/graph
  - docs/platform/resource-referee
  - docs/platform/component-boundary.md
  - docs/platform/git/spec.md
  - packages/write-scope
  - packages/graph
  - packages/resource-referee
  - packages/git/write-scope
  - packages/git/rust/Cargo.toml
  - packages/git/node-addon
  - packages/supervision/rust
  - Cargo.toml
  - src/native/door.mjs
  - test/git/write-scope-parity.test.mjs
  - test/runner/write-scope.test.mjs
  - test/workflow/propose-classify.test.mjs
  - test/config/config-door.test.mjs
base: cb03407aa33f9e35d6480c3f59584942b33ef397
source:
  - plans/reports/research-261118-1704-pkm-graph-algorithms-for-shared-overlap-core.md
created: 2026-11-19
---

# One door for resource contention and graph facts

## Outcome

This plan delivers the foundation of one door for resource contention and graph facts: three
independent packages, the supervisor adapter that replaces its private overlap copy, and the native
addon bindings and ABI clause that let Node reach the packages in process. When it is done, any
planner or engine that can call the packages can ask which phases collide on files, which layers
(waves) they fit in, the critical path, independent groups, any dependency cycle with its path, and
a verdict with reasons under its own rules.

The planner door (`fgos resource-check`), the Work, plan-check and plan-lint adapters and the discovery
text in the plan contract and the skills are in the second plan, `plans/261119-0528-resource-check-door-and-adapters`, which is blocked by this
plan and by `owner-question-store`. Phases 7b, 8, 9 and 10 named anywhere in this plan's files live
there. The merge conductor and the dispatch gate can adopt the packages later and are in neither plan.

Three independent packages, each with one authority, none knowing the layer above it:

| Package | Authority | Exists today |
|---|---|---|
| `write-scope` | What a declared path scope means, and whether two scopes can touch the same path (sound over lexical paths: never "disjoint" when the same spelling rules say a file is shared; case folding, Unicode normalisation and symlinks are outside the contract); finding all colliding pairs in a set | Yes, as `packages/git/write-scope` (moves out of `git/`) |
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
  safe package name. `referee` is not free: it is a seat name (`seat: 'referee', role: 'judge'`) in the
  debate pattern of `test/runner/execution/patterns/catalog.test.mjs:676,692,2135`; an earlier search
  skipped `test/` and wrongly reported no hits. `graph` is also the name of a Work verb
  (`src/cli/command-registry.mjs:1103`, `command-routes.json:622`). Both are settled in decision 26.
- `plan-vocabulary.v1.json` (read by the check script, the Rust portfolio reader and the Node
  resolver) is the working pattern for a data contract shared by JS and Rust.
- The addon is accepted by `combinedAbiMatches` in `src/native/door.mjs:36-38`, which lists each
  namespace and version a payload needs, and by `versions()` in `packages/git/node-addon/src/lib.rs`;
  a new namespace needs a row in both. Work code layering is fixed by `docs/architecture-manifest.json`
  (`graph-metrics.mjs` is `domain`, `door.mjs` is `kernel`, `src/git/native.mjs` is `infra`).
- The mutation census covers about fourteen hundred files and its hook applies only to commits made
  in the main checkout or on the trunk (`.githooks/pre-commit:420-428`).

## Prior art, reused and missing

Reused: `fgos-write-scope` as the path authority; the plan-side overlap meaning (it is also what
dispatch enforces); `computeSchedule` and `detectCycles` behaviour as the parity oracle; the
shared-contract-file pattern; the portfolio phase-table reader as the planner adapter; the
`suggestions` (sequence, hoist, re-slice) already attached to conflicts.
Missing: one canonical cycle path per strongly connected component (pkm's idea of pruning by
component and rooting at the smallest id, without enumerating every cycle); a catalog of rule checks;
a recording of the old plan-check verdicts to compare against.

From the pkm survey (full detail in the source report): pkm has little graph logic better than
fgOS. The idea taken is component-pruned, smallest-id-rooted cycle reporting. All-cycles enumeration
and a wall-clock budget are not taken: the outcome needs a cycle with its path, not every cycle, and
fgOS output must hash the same on every rebuild.

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

7. Truncation is a result: when a cap is hit the packages return what they have plus
   `truncated: {reason, limit}`. The caps are the emitted-pairs cap and the comparison-count cap of the
   pair scan; cycle reporting is linear (one cycle per component) and needs no cap. The referee turns a
   truncated fact set into a blocking finding (`facts-truncated`), so an incomplete answer can never
   become `accept`. Each contract carries numeric `limits` and input beyond them is refused by name;
   phase 1 fixes the values (starting values: 2000 nodes, 20000 edges, 64 claims per node, entries of at
   most 512 bytes, 200 rules, 10000 emitted pairs, 5000000 pair comparisons).
8. Work advisories (`fgos conflicts`, `fgos schedule`) become stricter because they adopt the
   `write-scope` rule; this is a visible change. Phase 8 records before and after outcomes on real Work
   views and says whether the fan-out verifier's exit code can change; the CHANGELOG names the effect on
   the decompose gate (it stays advisory) and on the verifier.
9. In `graph`, "layer" is the neutral word; the planner adapter maps layer to the plan's "wave".
10. The planner door is `fgos resource-check --plan <dir> | --units <file.json>`. The first working
    name, `fgos referee`, was dropped because `referee` is already a seat name in the execution
    catalog (decision 26); `fgos check` is a Work verb, and `resource-check` is not used anywhere.
    Phase 1 re-confirms it against the verb tables.
11. The door takes `--policy <file>`. The shipped default policy is structural only and needs no
    extra data. A hot-file list or any project rule is data in the policy file a project supplies;
    this repository's own policy file is `packages/supervision/contracts/plan-referee-policy.v1.json`.
    No new config key in this plan. Reason: the hot-file rule is prose only
    (`core/skills/_shared/plan-contract.md:91`) and the phase table has six fixed columns
    (`packages/supervision/contracts/plan-vocabulary.v1.json:5`), so other projects cannot rely on an
    fgOS-internal list. A `--policy` file replaces the default policy; the referee always applies a floor
    (no cycles, no dangling edges, claims declared, facts not truncated) that no policy can remove, and
    the verdict echoes the policy path and its sha256 so a weaker policy cannot go unnoticed. A policy
    file is trusted input from the invoking operator, named explicitly, never discovered from the plan
    directory.
12. Catalog v1 holds only checks with a data source in a plan: no cycles, no dangling edges, claims
    declared, facts not truncated, declared layers valid, alone-in-layer, maximum layer width. A numeric
    attribute check (phase size, risk) is left out until a plan table carries such a column.
13. Every node declares `claims` or `readOnly: true`; a node with neither, and a phase whose footprint
    cell is empty, is a blocking finding (`claims-declared`). An empty list means "unknown", not
    "disjoint": `portfolio.rs:200` treats empty lists as never overlapping, which would break the
    soundness contract of `write-scope`. The plan table has no read-only column, so for a plan an empty
    footprint is always blocking, as the plan check already does.
14. The mutation census is regenerated once, by the lead, as the last commit of the integration landing
    and re-run immediately before the fast-forward, because it hashes about fourteen hundred files and
    a phase that edits any covered file would otherwise collide with every parallel phase on one generated
    file. This relies on `.githooks/pre-commit:420-428`: the census refusal applies only to a commit made
    in the main checkout or on the trunk, so every phase commits in its own linked worktree on its own
    branch. A phase branch expects `test/git/one-door.test.mjs` to be red, so each phase instead runs the
    scan without `--write-census` and lists the changed census entries; every one must lie inside that
    phase's footprint. The lead merges finished waves into one integration branch after waves 2, 3 and 4
    and runs the combined crate-level and owning tests there; phase 7c lands this plan and phase 10 of the
    door plan lands the rest, each with the census as its last commit.
15. No new external crate. Phase 2 declares `serde` and `serde_json` (`workspace = true`) for the new
    crates so `Cargo.lock` changes in phase 2 and, for the edges of `apps/fgos`, once more in phase 7b (a different wave). Tests use plain cases and, where a naive oracle helps, a
    small seeded generator in the test file (`proptest` is not in the workspace).
16. Node code reaches the packages through the native addon, in process; this is settled by evidence,
    not by a measurement (`src/util/yaml.mjs:3-5`: the addon is already a hard requirement of every
    script that reads YAML). The host verb is the door for planners only. Phase 2 declares the addon's
    edges; phase 7 writes the bindings, a `versions()` field per new namespace and the matching clause
    in `combinedAbiMatches`, with a test that an addon lacking the field is refused by name. A payload
    never falls back silently.
17. Error policy for a footprint entry that does not canonicalize (`.`, `..`, absolute, backslash,
    empty, `ab**`): the door refuses and names the node and the entry; the plan check refuses it at
    `ready`; Work adapters treat that one item as conflicting with everything (advisory); the
    supervisor marks that one plan not admissible with the named reason `footprint-entry-invalid` and
    reports it, and every other plan is unaffected. A reporting function is added next to `admissible`,
    whose signature does not change.
18. The export names of `src/state/graph-metrics.mjs` are the Work adapter surface and survive;
    `src/state/impact.mjs` and `scripts/verify-fanout-overlap.mjs` keep calling them unchanged. The new
    adapter file is `src/state/graph-adapter.mjs` in the `domain` layer; it imports only the kernel door
    `src/native/door.mjs` (as `src/state/hot-lock.mjs` does) and has a row in
    `docs/architecture-manifest.json`.
19. The set-level colliding-pairs function is a deterministic pairwise comparison of canonicalized
    scopes; no trie and no measurement gate. If the one timing recorded in phase 10 shows it is too
    slow, a trie becomes a separate item.
20. Parity evidence: the existing cases of `test/state/graph-metrics.test.mjs` are ported as Rust
    cases; a snapshot of real phase tables is copied into a fixture directory together with the verdicts
    of the old plan-check script recorded in phase 4 before any adapter swap; phase 8 compares against
    that recording. There is no byte-for-byte regeneration test.
21. After every rebase or merge of `origin/main`, `Cargo.lock` is rebuilt and `npm run build:skills`
    is re-run; generated text is never hand-merged.
22. The `write-scope` contract is lexical: case folding, Unicode normalisation and repository symlinks
    are outside it, and the spec says so; a verdict carries that caveat.
23. Threat model for input hardening: a plan directory can come from an untrusted branch (a CI run on
    a pull request); the units and policy files are operator input. One shared reader opens a file
    without following symlinks, requires a regular file, enforces the size cap and never quotes file
    content in an error; it is applied to the plan directory, `plan.md`, units and policy.
24. Step zero: when a blocker lands before this plan starts, refresh `base`, re-read the file and line
    facts cited in the phases, re-run the plan check and the overlap measurement, then start.
25. The work is split into two plans. This plan keeps the packages, the supervisor adapter, the addon
    bindings and ABI (phase 7) and its own integration and landing (phase 7c). The door (phase 7b), the
    Work, plan-check and plan-lint adapters (phase 8), discovery (phase 9) and their landing (phase 10) are
    in `plans/261119-0528-resource-check-door-and-adapters`, blocked by this plan and by `owner-question-store`.
26. Names (planner decision, reversible until phase 2 starts; the owner may object). The packages keep
    the names the owner chose: `write-scope`, `graph`, `resource-referee`. The compound names do not
    collide with the seat `referee` (role `judge`, `test/runner/execution/patterns/catalog.test.mjs:676`)
    or, for `graph`, with the Work verb `fgos graph` (`src/cli/command-registry.mjs:1103`): the specs and
    the reading map say how each differs. Only the planner verb changes, to `fgos resource-check`
    (decision 10), because the bare word `referee` is the one that collides.
27. A cycle report must help when the canonical cycle cannot be broken because the edge belongs to a
    plan the planner does not control. For each non-trivial strongly connected component `graph` returns
    its members and induced edges, one canonical shortest cycle (through the smallest id), and a bounded
    query `cycle_through(id)` that returns the shortest cycle through a chosen member; each is linear.
    The planner then sees every edge it may cut and can ask for a cycle through another node. All cycles
    are still not enumerated, so decision 7 stands (owner question of the validation interview,
    2026-11-19).

28. `Cargo.lock` and the mutation census are generated files that every plan changes as a side effect.
    They are owned by one phase per wave in the phase tables but are not claimed in any plan frontmatter,
    so two plans do not block each other over a file that cargo and the scan recreate; decision 21 governs
    rebases and the hook of decision 14 enforces the census on the trunk.

## Acceptance criteria

1. `packages/git/write-scope` no longer exists; `packages/write-scope`, `packages/graph` and
   `packages/resource-referee` build in the workspace. Proof: `cargo test --workspace` (phase 7c).
2. The supervisor no longer defines an overlap rule of its own: `overlaps` in
   `packages/supervision/rust/src/portfolio.rs` calls `fgos-write-scope`, and the JS port
   `src/runner/dispatch/write-scope.mjs` stays pinned to the Rust rule by the extended parity test. The
   other copies are replaced in the door plan. Proof: phases 3 and 6.
3. `graph` passes the ported cases of `test/state/graph-metrics.test.mjs` and matches the recorded
   verdicts on the snapshot; every intended difference is listed by name. Proof: phase 4.
4. Each rule in the catalog has one owning test; every blocking finding code is produced by some test; a
   truncated fact set never yields `accept`. Proof: phase 5.
5. An addon lacking the new namespaces is refused by name. Proof: the ABI test of phase 7.
6. The supervisor reports `footprint-entry-invalid` for a plan with a malformed footprint entry instead
   of excluding it silently. Proof: phase 6.
7. `cargo test --workspace`, `npm test` and `node scripts/plan-contract-check.mjs --all` are green, run
   one after the other, and the census matches the tree. Proof: phase 7c.

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
| 1 | [Specs, boundary rows and contracts](phase-01-specs-and-contracts.md) | - | docs/platform/write-scope, docs/platform/graph, docs/platform/resource-referee, docs/platform/component-boundary.md, packages/graph/contracts, packages/resource-referee/contracts, plans/261119-0030-resource-referee-graph-write-scope-stack/reports | 1 | ready |
| 2 | [Workspace scaffold and write-scope move](phase-02-scaffold-and-move.md) | - | Cargo.toml, Cargo.lock, packages/write-scope, packages/git/write-scope, packages/git/rust/Cargo.toml, packages/git/node-addon/Cargo.toml, packages/supervision/rust/Cargo.toml, packages/graph/rust, packages/resource-referee/rust, docs/platform/git/spec.md, test/workflow/propose-classify.test.mjs | 1 | ready |
| 3 | [write-scope: colliding pairs in a set](phase-03-write-scope-pairs.md) | 1, 2 | docs/platform/write-scope, packages/write-scope, test/git/write-scope-parity.test.mjs, test/runner/write-scope.test.mjs | 2 | ready |
| 4 | [graph crate and recorded evidence](phase-04-graph-crate.md) | 1, 2 | docs/platform/graph, packages/graph/rust | 2 | ready |
| 5 | [resource-referee crate](phase-05-resource-referee-crate.md) | 1, 3, 4 | docs/platform/resource-referee, packages/resource-referee/rust | 3 | ready |
| 6 | [Supervisor adapter](phase-06-supervisor-adapter.md) | 3 | packages/supervision/rust | 3 | ready |
| 7 | [Addon bindings and ABI](phase-07-addon-bindings.md) | 3, 4, 5 | packages/git/node-addon/src, src/native/door.mjs, test/config/config-door.test.mjs | 4 | ready |
| 7c | [Integration and landing of the packages](phase-07c-integration.md) | 5, 6, 7 | packages/git/contracts/mutation-census.v1.json, plans/261119-0030-resource-referee-graph-write-scope-stack/reports | 5 | ready |

Reading check (planner applied the contract by hand, then ran the script): every phase sits in a later
wave than everything it depends on; the longest chain is five waves; phases 1 and 2 share wave 1,
phases 3 and 4 wave 2, phases 5 and 6 wave 3, each pair with disjoint footprints. Phase 2 does not read
any phase 1 output, so it runs beside it. Hot and generated files have exactly one owner per wave:
`Cargo.toml`, `Cargo.lock` and the addon, supervisor and new-crate manifests phase 2 (it declares every
dependency edge among the new crates and the `serde` and `serde_json` entries up front; a phase that
must add an external crate stops and asks the lead), `src/native/door.mjs` and the addon sources phase 7,
the census phase 7c. Every phase commits in its own linked worktree on its own branch (decision 14), and
rebases follow decision 21.

## Order against other active plans

Measured with the plan check's own overlap rule against every `ready` or `running` plan.
- `261118-0947-session-verb-for-agent-sessions`: `done`; the `blockedBy` entry is the record of that
  order and is met.
- `261118-1159-owner-question-store`: `ready`, P1, phases 4, 6, 7, 8, 9 and 10 still draft. At the
  owner's request ("tách và thu hẹp", 2026-11-19) this plan was split and that plan's frontmatter was
  narrowed, in a separate commit (`cb03407aa`), to the files its remaining phases write. Measured per
  phase and with a glob match in both directions, phases 1 to 7 and 7c of this plan overlap none of its
  remaining work. The part that does overlap (the door, the adapters, discovery, the landing) is
  `plans/261119-0528-resource-check-door-and-adapters`, which has `blockedBy` on `owner-question-store` and on this plan.

`blockedBy` is a plan-level field and the check script does not honour it when it looks for overlaps
(`activeOverlaps` in `scripts/plan-contract-check.mjs:149-157`); recorded below as a follow-up. Step
zero (decision 24) applies whenever a blocker lands before start.

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
- The merge conductor and the dispatch gate are later adopters of the three packages.
- `activeOverlaps` in `scripts/plan-contract-check.mjs:149-157` ignores `blockedBy`, contradicting the
  plan contract section 5; either the script skips pairs where one plan is blocked by the other, or
  the contract text changes. Phase 8 touches this script for another reason and should not absorb it.

## Owner questions

None open. The split and the order were decided by the owner (see "Order against other active
plans"); the names were settled in decision 26.

## Risks and rollback

- Moving `write-scope` touches the workspace `Cargo.toml` and three consumers' manifests, hot
  files of other lanes. Announce before phase 2; the lane that lands second rebases (board rule).
- The census is one generated file covering about fourteen hundred sources; two phases regenerating it
  in parallel would conflict. Only the final landing regenerates it, and it is re-run right before the
  fast-forward. This is safe only while phases commit in linked worktrees (decision 14); every phase
  lists the changed census entries against its own footprint so the red `one-door` test hides nothing.
- Stricter Work advisories surface conflicts that were silently missed. There is no switch to restore
  equality-only matching; the CHANGELOG names the effect, and reverting phase 8 restores the old behaviour.
- An addon built before phase 7 is refused by name through the ABI clause; no payload falls back silently.
- Rollback: each phase is its own commit. Revert in the reverse order 7c, 7, 6, 5, 4, 3, 2, 1,
  regenerate the census once more and rebuild `Cargo.lock` at the end. If a release was activated,
  re-stage and re-activate the previous release and run `fgos doctor` through the shim, because the
  activated payload keeps calling the new addon functions until then; check that
  `apps/fgos-gateway` still builds from its own lock.

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

### Validation interview (2026-11-19)

The owner was asked the three decisions the planner had taken after the red-team rounds.

| Topic | Planner recommendation | Owner answer | Result |
|---|---|---|---|
| Cycle reporting: one canonical cycle per component or all cycles with a step cap | One canonical cycle per component | Asked: if the shortest cycle is stuck with another plan, is there a way around it | Kept, and extended with component members, induced edges and a bounded `cycle_through(id)` query (decision 27) |
| Work advisories become stricter with no switch back | Accept, CHANGELOG, no switch | Asked what is correct and most beneficial | Kept: one rule means a green plan is not refused at runtime, and the before and after outcomes are recorded in phase 8; a switch would recreate the second rule this plan removes |
| `--policy` with a floor and the policy hash | Keep | Keep (option A) | Kept (decision 11, phase 7b) |

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

### Session 2: independent reviewers (2026-11-19)

Four reviewers ran as separate Claude sessions through the project's own door
(`npm run fgos:dev -- run ... --capability advise --provider claude`, read-only, one per lens). They
were given a copy of the plan without the Validation Log and Red Team Review sections, so they did not
see the in-session findings. 33 raw findings (security 8, failure modes 9, assumptions 8, scope 8)
collapse into 22 clusters. The planner checked every cited line against the tree before adjudicating:
the `apps/fgos/Cargo.toml` gap, the two unowned consumers, the git spec hits, the four verb-table tests,
the addon source layout, the pre-commit census scope and the YAML door's addon requirement were all
confirmed.

| # | Cluster (reviewers) | Severity | Disposition | Applied to |
|---|---|---|---|---|
| 1 | `apps/fgos/Cargo.toml` owned by no phase (security, failure, assumption) | Critical | Accept | Phase 2, plan footprint |
| 2 | Node access to graph and referee has no owner (failure, assumption, scope) | High | Accept | Decision 16, phases 2, 7, 8 |
| 3 | Consumers outside the footprint: `impact.mjs`, `verify-fanout-overlap.mjs`; criterion 2 not provable (scope, assumption) | High | Accept | Decision 18, criterion 2, phase 8 |
| 4 | Phase 2 verify cannot pass: unanchored `git/write-scope` pattern; git spec names the crate home (scope, assumption) | Medium | Accept | Phase 2 |
| 5 | Census: hook refuses only trunk or main checkout commits, so phases must use linked worktrees (failure) | High | Accept as a stated precondition | Decision 14 |
| 6 | Census diff not reviewed before it is blessed (security) | Medium | Accept | Phase 10 |
| 7 | Entries that do not canonicalize: fail-open risk; supervisor behaviour change unproven (security, failure, assumption) | High | Accept | Decision 17, phases 1, 5, 6, 7, 8 |
| 8 | `truncated` can be ignored and yield `accept` (security) | High | Accept | Decision 7, phase 5 |
| 9 | `--policy` can weaken every rule; trust model undefined (security) | High | Accept | Decision 11, phases 1, 5, 7 |
| 10 | Input bounds without numbers; symlinks; error text quoting files (security) | Medium | Accept | Decision 7, phases 1, 7 |
| 11 | JS and Rust drift on Unicode whitespace and repeated `**` (security) | Medium | Accept | Phase 3 |
| 12 | Verb-table tests owned by no phase (failure) | High | Accept | Phase 7 |
| 13 | Rebase leaves generated files (lock, skills) to be hand-merged (failure) | High | Accept | Decision 21 |
| 14 | Door and check script may disagree; one parity case over a snapshot (failure) | Medium | Accept | Phase 8 |
| 15 | Rollback order incomplete; "equality-only switch" has no owner (failure) | Medium | Accept | Risks and rollback |
| 16 | Phase 9 verifies the plan check that phase 8 rewrites in the same wave (assumption) | High | Accept | Phases 9, 10 |
| 17 | Supervisor given unused dependency edges (scope) | Medium | Accept | Phase 2 |
| 18 | Trie and property tests unjustified for plan-sized inputs (scope) | Medium | Accept | Decision 19, phase 3 |
| 19 | Parity corpus reads `plans/*` live (scope) | Medium | Accept | Decision 20, phase 4 |
| 20 | Decision history and activation step crammed into phase 10 (scope) | Medium | Accept in part | Phases 3, 4, 5, 10 |
| 21 | Self-referential proof: door run on the plan it helped write (assumption) | Medium | Accept | Criterion 3, phase 7 |
| R1 | Plan-check script would depend on a built Rust binary (failure) | High | Reject | `src/util/yaml.mjs:3-5` already makes every script that reads YAML depend on the addon; decision 16 uses it |
| R2 | Cut the weighted critical path, exclusion layering, `--policy` as unrequested scope (scope) | High | Reject | Owner decision 3 includes layering under exclusions; `criticalPath` already has a consumer in Work; decision 11 is needed for projects outside this repository |
| R3 | Split phases 1, 4, 5, 6 into their own plan now (assumption) | Medium | Reject | The owner chose the hard order after being offered it; recorded in the order section |

Whole-Plan Consistency Sweep after session 2: all ten phase files were regenerated from the decisions
above and re-read against `plan.md`; the census owner, the Node access rule, the error policy, the
policy floor and the footprints agree everywhere. Unresolved contradictions: none.

### Session 3: independent reviewers, second round (2026-11-19)

The same four lenses ran again as separate sessions on the revised plan (again without the logs).
33 raw findings (security 8, failure modes 8, assumptions 7, scope 10) collapse into 28 clusters; the
planner checked every cited line before adjudicating (`door.mjs` ABI list, the `referee` seat in the
execution catalog, the census size 1468, the staging helper `test/helpers/git-addon.mjs`).

| # | Cluster (reviewers) | Severity | Disposition | Applied to |
|---|---|---|---|---|
| 1 | New namespaces need `versions()` and a `combinedAbiMatches` clause; `door.mjs` unowned (assumption, failure) | High | Accept | Decision 16, phase 7, criterion 10 |
| 2 | Work adapter had no file, layer or manifest row (failure) | High | Accept | Decision 18, phase 8 |
| 3 | No named way to build an addon for phase 8 tests (assumption) | High | Accept | Phases 7, 8 |
| 4 | One big-bang integration and a census race (failure, security) | High | Accept | Decision 14, phase 10 |
| 5 | Input hardening had no owner and no threat model (security) | High | Accept | Decision 23, phase 7b |
| 6 | "Tighten-only" policy claim was wrong; weaker policy goes unnoticed (security) | Medium | Accept | Decision 11 |
| 7 | "Writes files" has no classifier; need an explicit read-only marker (security) | High | Accept | Decision 13 |
| 8 | Soundness is lexical only (security) | Medium | Accept | Decision 22 |
| 9 | Work per input unbounded; limits had no numbers (security) | Medium | Accept | Decision 7 |
| 10 | Stricter advisories change a gate and a verifier silently (security) | Medium | Accept | Decision 8, phase 8 |
| 11 | `referee` is an existing seat name; earlier search skipped `test/` (security) | Medium | Accept | Facts, decision 26 |
| 12 | New package `graph` shares a name with the Work verb (scope) | Medium | Accept | Facts, decision 26 |
| 13 | One malformed footprint cell stalls the supervisor silently (assumption, failure) | Medium | Accept | Decision 17, phase 6 |
| 14 | Door-versus-script parity compares the packages with themselves (failure) | Medium | Accept | Decision 20, phases 4, 8 |
| 15 | A deliberately red census gate hides real failures (failure, assumption) | Medium | Accept | Decision 14 |
| 16 | Census size and layering test claims were stale or unnamed (assumption, scope) | Low | Accept | Decision 14, phase 2 |
| 17 | Existing plans may flip under the new rule (assumption) | Medium | Accept | Phase 1 |
| 18 | Phase 7 was a bottleneck with three jobs (scope, assumption) | Medium | Accept | Decision 25, table |
| 19 | `command-registry.mjs` edit in phase 8 breaks tests phase 7 owns (assumption) | Medium | Accept | Phase 7b |
| 20 | Stale base once a blocker lands (failure) | Medium | Accept | Decision 24 |
| 21 | Rollback ignores an activated release and the gateway lock (failure) | Medium | Accept | Risks and rollback |
| 22 | All-cycles enumeration forces the truncation apparatus (scope) | High | Accept | Decision 7, phase 4 |
| 23 | Measurement gates that cannot change a decision (scope) | Medium | Accept | Decisions 16, 19 |
| 24 | Parity corpus freezes old output; a regeneration test tests the generator (scope) | Medium | Accept in part | Decision 20, phase 4 |
| 25 | Outcome names adopters with no phase (scope) | Medium | Accept | Outcome |
| 26 | Malformed-entry behaviour has four owning proofs (scope) | Medium | Accept in part | Phases 3, 6, 7b, 8 |
| R1 | Drop hardening because the operator is trusted (scope) | Medium | Reject | Plan dirs can come from an untrusted branch (decision 23) |
| R2 | Drop `--policy` and the repo policy file as scope beyond the request (scope) | Medium | Reject | Needed for projects outside this repository (decision 11) |
| R3 | Regenerate the census in each phase (scope) | Medium | Reject | One generated file, parallel waves would conflict (decision 14) |

Whole-Plan Consistency Sweep after session 3: all phase files were regenerated from the decisions
above and re-read against `plan.md`; wave numbers, depends-on, owners of hot files, the Node access
rule, the error policy, the policy floor, limits and footprints agree. The only open items are the two
owner questions, which are stated as such. Unresolved contradictions: none.
