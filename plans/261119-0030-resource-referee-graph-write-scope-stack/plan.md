---
contract: plan-v1
title: "Three independent packages for resource contention and graph facts: write-scope, graph and resource-referee, with the addon bindings"
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
  - packages/git/contracts/ports.v1.json
  - packages/supervision/rust/Cargo.toml
  - Cargo.toml
  - domains/coding/slice-kinds.yaml
  
  - src/native/door.mjs
  - test/git/write-scope-parity.test.mjs
  - test/git/native-load.test.mjs
  - test/runner/write-scope.test.mjs
  - test/workflow/propose-classify.test.mjs
  - test/config/config-door.test.mjs
base: f3c32fb891d0237a4c5392b307a499ce8380a95c
source:
  - plans/reports/research-261118-1704-pkm-graph-algorithms-for-shared-overlap-core.md
created: 2026-11-19
---

# One door for resource contention and graph facts

## Outcome

This plan delivers the foundation of one door for resource contention and graph facts: three
independent packages and the native addon bindings and ABI clauses that let Node reach `graph` and the
path rule in process. It changes no consumer: nothing that runs today calls the new code, so the plan
can land alone and be reverted alone. When it is done, anything that can call the packages can ask
which scopes collide, which layers (waves) a set of units fits in, the critical path, independent
groups, any dependency cycle with its path, and a verdict with reasons under its own rules.

Every consumer is in the second plan, `plans/261119-0528-resource-check-door-and-adapters`: the planner door `fgos resource-check`, the supervisor
adapter, the plan-check script, plan-lint and the Work adapters (all admission rules switch together),
and discovery. That plan is blocked by this plan and by `owner-question-store`. Phases 7b, 8, 8b, 9 and
10 named anywhere in this plan's files live there. The dispatch gate can adopt the packages later and is in neither plan; merge readiness is changed through
the Work exports by the door plan (decision 8).

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
- The addon is accepted by `combinedAbiMatches` in `src/native/door.mjs:33-35`, which lists each
  namespace and version a payload needs, and by `versions()` in `packages/git/node-addon/src/lib.rs`;
  a new namespace needs a row in both. Work code layering is fixed by `docs/architecture-manifest.json`
  (`graph-metrics.mjs` is `domain`, `door.mjs` is `kernel`, `src/git/native.mjs` is `infra`).
- The mutation census covers about fourteen hundred files and its hook applies only to commits made
  in the main checkout or on the trunk (`.githooks/pre-commit:420-428`).

- A seventh overlap meaning exists: `globsMeet`, a segment-wise glob intersection in
  `src/runner/dispatch/write-scope.mjs:142` (built on `segmentsMeet` at 111), used by `src/workflow/propose-validate.mjs:17,83,172,216`. It is
  a recorded follow-up, not a target here.
- The supervisor's `admissible`, `overlaps` and `read_plan` have no production caller: only the crate's
  own tests use them (`rg "admissible\(|portfolio::"` over `apps` and `packages`). The design of that
  crate belongs to the draft P1 plan `261118-1045-project-supervisor`.
- `fgos-durable-file` already exports `open_beneath`
  (`packages/durable-file/rust/src/beneath.rs`): no symlink at any position, a regular file only, a byte
  cap and a sha256 revision; `apps/fgos` depends on it.
- No CI job and no hook runs `scripts/plan-contract-check.mjs` (`.github/workflows/ci.yml` ignores
  `plans/**`); only its own test does, on fixtures.
- The addon's `versions()` object is pinned whole by `test/git/native-load.test.mjs:25`.

- Both phase-table readers (the Rust one in `portfolio.rs:317` and the JS one in
  `scripts/plan-contract-check.mjs:42`) delete every backtick and every `*` from a footprint cell before
  paths are compared, so `apps/fgos/tests/questions_*.rs` reaches the overlap rule as
  `apps/fgos/tests/questions_.rs`. The Rust reader also turns a non-integer wave into `None`, keeps a
  duplicate id, and drops a non-string frontmatter entry, where the JS check refuses each.
- `scripts/plan-contract-check.mjs` cannot load the native addon from a checkout or a linked worktree
  (`src/native/door.mjs:22-29,38`): run plainly, every plan fails with `git-addon-unavailable`. Scripts such
  as `scripts/build-skill-wrappers.mjs:15,20` call `ensureAddonForScript()` first; this one does not.
- `mergeReadiness` (`src/state/graph-harness.mjs:21,144`, used by `src/verbs/merge/merge.mjs`) decides
  what `fgos merge` merges from the result of `footprintOverlapAmong`, and `rankImpact` orders it with
  `connectedComponents`. Swapping those exports changes merge readiness. Work footprints are optional
  and today an item without one never conflicts (`src/state/graph-metrics.mjs:598,603`); the current open
  Work items (13) have none.
- `scripts/plan-contract-check.mjs --all` is red today for plans of other lanes; it is not a gate this work
  can turn green.

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

7. Limits and truncation, one mechanism per package. `graph` and `resource-referee` refuse oversize
   set-level input by name and never return a partial answer. Only the colliding-pairs function of
   `write-scope` can truncate (its emitted-pairs cap and its comparison cap): it returns what it has plus
   `truncated: {reason, limit}`, and its caller passes `truncated` to the referee as a fact, which
   emits the blocking `facts-truncated`; a consumer that does not use the referee refuses to treat the
   answer as complete (the plan check errors, a Work adapter throws a named error). Per-item limits
   (claims per node, entry length) give an item-level finding and the rest of the set is still evaluated.
   Cycle reporting is linear and needs no cap. The set-level values come from measured maxima (the
   largest plan frontmatter today has 95 entries; Work graphs walk every item regardless of status):
   phase 1 measures them and fixes the values, starting at 20000 nodes, 200000 edges, 512 claims per
   node, entries of at most 1024 bytes, 200 rules, 100000 emitted pairs, 50000000 pair comparisons and
   4 MiB of input bytes per file. A Work advisory whose `graph` call is refused fails with the named
   error; it does not degrade silently.
8. Work advisories (`fgos conflicts`, `fgos schedule`) become stricter because they adopt the
   `write-scope` rule; this is a visible change made in the door plan. Merge readiness changes with it:
   `mergeReadiness` and `rankImpact` call the same exports, so `fgos merge` stops auto-merging pairs it
   used to merge when their footprints contain one another. The door plan records before and after
   outcomes for conflicts, schedule, the decompose gate (stays advisory), merge readiness and the fan-out
   verifier's exit code, and the CHANGELOG names each. The merge conductor's own logic is not redesigned.
9. In `graph`, "layer" is the neutral word; the planner adapter maps layer to the plan's "wave".
10. The planner door is `fgos resource-check --plan <dir> | --units <file.json>`. The first working
    name, `fgos referee`, was dropped because `referee` is already a seat name in the execution
    catalog (decision 26); `fgos check` is a Work verb, and `resource-check` is not used anywhere.
11. The door takes `--policy <file>`; without it, the shipped default policy applies: the floor plus
    declared layers valid. The floor, which no policy can remove, is: no cycles, no dangling edges, claims
    declared, facts not truncated, and no exclusion pair (a footprint collision) in one declared layer. Floor checks take no parameters and are always blocking: a ruleset that names one with any parameter is refused by name.
    The default is data inside the door, and this repository ships no policy file of its own. A
    `--policy` file replaces the default; the verdict echoes the policy identity (path and sha256) in the
    human output as well as in `--json`. A missing or unreadable policy file is a refusal, never a fall
    back to the default. A policy file is operator input, named explicitly, never discovered from the plan
    directory. No new config key. The hot-file rule needs no policy: two phases that list the same file in
    one wave collide on the footprint overlap rule, and a project that wants more (a width cap) opts in
    through the policy.
12. Catalog v1: the floor; declared layers valid (every node later than its dependencies); and one
    optional check with no default, maximum layer width. A numeric attribute check (phase size, risk) and
    alone-in-layer are left out: no plan table carries an attribute for them to read.
13. Every node declares `claims` or `readOnly: true`; a node with neither, and a phase whose footprint
    cell is empty, is a blocking finding (`claims-declared`). An empty list means "unknown", not
    "disjoint": `portfolio.rs:200` treats empty lists as never overlapping, which would break the
    soundness contract of `write-scope`. `readOnly` is caller-asserted and the verdict says so, as it does
    for the lexical caveat. A real `Unit` treats empty `writes` as read-only because dispatch enforces it
    (`src/runner/execution/unit.mjs:125`), which is why the door's `--units` shape is a neutral shape and
    not the `Unit` file schema. The `claims` of decision 5 carry a `space` from a closed registry in the
    referee contract (`path`, compared by `write-scope`; any other space compared by equality); an unknown
    space is refused by name, so a misspelt space can never pass as "no collision".
14. The mutation census is regenerated by the lead as the last commit of each landing. The landing is a
    loop: merge `origin/main`, rebuild `Cargo.lock`, run `npm run build:skills`, regenerate the verb tables with
    `node scripts/export-command-selectors.mjs`, run `cargo build --workspace --locked` and the owning tests of every file the merge brought in,
    regenerate the census, run the two census tests, fast-forward; if the push is rejected, start again.
    The census hashes about fourteen hundred files, so a phase that edits any covered file would otherwise
    collide with every parallel phase on one generated file. This relies on
    `.githooks/pre-commit:420-428`: the census refusal applies only to a commit made in the main checkout
    or on the trunk, so every phase commits in its own linked worktree on its own branch. A phase branch
    expects exactly two reds, `test/git/one-door.test.mjs` and `test/setup/git-mutation-census.test.mjs`.
    The scanner has no diff mode, so each phase lists the census entries it changed with
    `git diff --name-only <wave-base>...HEAD` (the lead records `<wave-base>`, the integration-branch commit
    the phase branched from), intersected with the keys of the census `files` map; every one must lie
    inside that phase's footprint. After every wave the lead merges that wave's branches into the
    integration branch, and each later wave branches from it, so no phase builds on a tree that lacks its
    predecessors' work. The cargo gates of one wave run one after another on the machine, never together.
15. No new external crate. `fgos-write-scope` stays dependency-free: its result types are plain and the
    addon builds JSON with `json!`, as `write_scope.rs` does, so neither `Cargo.lock` nor the gateway's own
    lock changes for it. Phase 2 declares `serde` and `serde_json` (`workspace = true`) for the two new
    crates, so `Cargo.lock` changes in phase 2 and, for the edges of `apps/fgos`, once more in the door
    plan. Tests use plain cases and, where a naive oracle helps, a small seeded generator in the test
    file (`proptest` is not in the workspace).
16. Node code reaches the packages through the native addon, in process (`src/util/yaml.mjs:3-5`: the
    addon is already a hard requirement of every script that reads YAML). The host verb is the door for
    planners only. The addon gets bindings for `graph` and for the new `write-scope` operations only; a
    `resource-referee` binding is added when a Node caller exists. Phase 7 adds a `versions()` field for
    `graph` and for `writeScope`, the matching clauses in `combinedAbiMatches` with an error that names
    the first missing or low field, the update of the test that pins `versions()` whole
    (`test/git/native-load.test.mjs:25`), the `graph` entry of `packages/git/contracts/ports.v1.json`, and
    and panic containment through the addon's existing shared guard, `marshal::guarded_as(panic_id, f)`
    (`packages/git/node-addon/src/marshal.rs:58,63`, used by `yaml.rs` and `config.rs`; it runs under a silent
    panic hook, so no input text reaches stderr): every new entry, the `write_scope.rs` additions of phase 3
    included, is wrapped once with its own id (`graph-internal-error`, `write-scope-internal-error`), and
    each id has one case in the existing guard tests. `checkout.rs` and `git/land.rs` keep their private
    wrappers: their result type and their state reset differ. A payload never falls back silently.
17. Error policy for a footprint entry that does not canonicalize (`.`, `..`, absolute, backslash,
    empty, `ab**`) and for an empty or missing footprint. The door refuses and names the node and the
    entry; the plan check refuses it at `ready`; the supervisor marks that one plan not admissible, through
    a small `footprint_problem(plan)` function that `admissible` itself calls, so the reasons
    (`footprint-entry-invalid`, `footprint-empty`) are reachable and tested; no output surface is added, and
    every other plan is unaffected. Work adapters differ on purpose: an entry that fails to canonicalize
    makes that one item conflict with everything (advisory), but a missing or empty footprint keeps meaning
    "no claim" in Work, because Work footprints are optional and today an item without one never
    conflicts. That is a named exception to the soundness contract, recorded in the door plan.
18. The export names of `src/state/graph-metrics.mjs` are the Work adapter surface and survive, and so do
    their importers: `src/state/graph-harness.mjs`, `src/state/store.mjs`, `src/state/impact.mjs`,
    `scripts/verify-fanout-overlap.mjs`, `src/intake/plan.mjs` and `src/runner/claim-liveness.mjs`
    (`STALE_DOING_DEFAULTS`). `goalScopedCriticalPath` goes through the adapter too and `longestChain` is
    deleted, so one critical-path rule remains. The new adapter file is `src/state/graph-adapter.mjs` in the
    `domain` layer; it imports only the kernel door `src/native/door.mjs`: a domain module may import a kernel module
    under the layer order of `docs/architecture-manifest.json`, and `src/util/yaml.mjs` (kernel) is the model
    for going through the door (`src/state/hot-lock.mjs` is `infra` and is not). The adapter has a row in the
    manifest and the Work spec records that `graph-metrics` now depends on the addon.
19. The set-level colliding-pairs function is a deterministic pairwise comparison of canonicalized
    scopes; no trie and no measurement gate. If the one timing recorded at the door plan's landing shows
    it is too slow, a trie becomes a separate item. It is proven by Rust tests against a naive pairwise
    oracle; the JS port has no set-level function and gets none.
20. Parity evidence: the existing cases of `test/state/graph-metrics.test.mjs` are ported as Rust
    cases. Phase 1 writes the runnable invocation of the old plan-check script (a small runner that makes
    the addon loadable) and snapshots real phase tables; the door plan records the baseline of the old
    verdicts with the pre-swap script at its own base, so differences caused by other plans are not
    reported as rule changes. There is no
    byte-for-byte regeneration test.
21. After every rebase or merge of `origin/main`, `Cargo.lock` is rebuilt, `npm run build:skills` is
    re-run, the verb tables are regenerated with `node scripts/export-command-selectors.mjs` and the census
    is regenerated; generated text is never hand-merged.
22. The `write-scope` contract is lexical: case folding, Unicode normalisation and repository symlinks
    are outside it, and the spec says so; a verdict carries that caveat.
23. Input hardening: the planner door reads its files with `fgos_durable_file::open_beneath` and its
    capped read (no symlink at any position, regular files only, a byte cap, the sha256 revision used as
    the policy identity) and adds no reader of its own. Roots: for `--plan <dir>` the root is that
    directory (a trailing slash is removed first, because Linux follows a symlink named with one), opened
    without following symlinks, and the files are read beneath it; for `--units <file>`
    and `--policy <file>` the root is the file's parent directory, so only the leaf is protected against a
    symlink and the parents are the operator's responsibility; an empty parent of a bare file name means the
    current directory. A missing file, a symlink, a non-regular file
    and an oversize file are refused by name. Errors and human output never quote file content raw: every value taken from an input file (entries, shared paths, ids, dependency ids, the policy path, the plan directory name, evidence) is printed escaped through one function (control characters escaped, length capped), and ids have a length limit next to the entry limit. The threat is
    narrow: no CI job or hook reads a plan directory, so the door is the one new reader of files an operator
    points it at.
24. Step zero: when a blocker lands before a plan starts, refresh `base`, re-read the file and line facts
    its phases cite, re-run the plan check (through the runner of decision 20) and the overlap measurement,
    then start.
25. The work is split in two plans along one line: this plan holds the foundation (the three packages
    and the addon bindings) and changes no consumer; `plans/261119-0528-resource-check-door-and-adapters` holds every consumer, so the
    admission rules that decide whether plans may run together (the supervisor, the plan-check script,
    plan-lint, Work, the door) switch to the same rule in one landing. Landing this plan alone cannot make
    two authorities disagree. The door plan stays `draft` until this plan is `done` and
    `owner-question-store` is `done`; the same instruction goes to the `project-supervisor` lane. Promoting it
    earlier makes `activeOverlaps`, which ignores `blockedBy`, report an overlap that no phase here can fix.
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
    All cycles are still not enumerated.
28. `Cargo.lock` and the mutation census are generated files that every plan changes as a side effect.
    They are owned by one phase per wave in the phase tables but are not claimed in any plan frontmatter,
    so two plans do not block each other over a file that cargo and the scan recreate. The check script
    reads frontmatter only, so a "disjoint" result says nothing about them; decisions 14 and 21 govern.
29. Guard against a new copy: the door plan adds a `door` entry for the overlap rule to
    `docs/architecture-manifest.json` (as the `hot-lock` door does at lines 268-284), with patterns that match definitions only (`export function pathsOverlap`, `footprintOverlapAmong`, and `fn overlaps(` in `.rs` files under `packages/`), the pinned JS port and `globsMeet` allow-listed as debt with a `retiredBy`, and the callers that legitimately use the packages listed under `allowed`.
    `domains/coding/slice-kinds.yaml` matches the crate by the glob `packages/*/write-scope/**`, which stops
    matching after the move; phase 2 fixes it (`compiled.json` is generated from workflows and the registry only and is not touched).
30. The plan-check gate is scoped to what these plans control: `node scripts/plan-contract-check.mjs --all`,
    run through the runner of decision 20 until the door plan makes the plain command load the addon,
    reports no error that names this plan and no overlap pair that involves it. Errors of other lanes' plans
    are recorded in `reports/close.md`, not fixed here.
31. The phase-table reader is shared and honest: the footprint-cell reader keeps every `*` (it strips only
    the backticks and the link syntax around a whole entry) and refuses, with a named code, a wave that is not an integer from 1, a duplicate id, a missing column, a non-string frontmatter entry, a plan with no table that has a footprint column, a table with no rows and more than one such table. A plan with zero phases is a blocking finding in the door, never `accept`. It is
    fixed in the supervisor's `read_phase_table` (door plan, phase 8b) and mirrored in the plan-check script
    (phase 8) before the door reads a table (phase 7b depends on 8b).

## Acceptance criteria

1. `packages/git/write-scope` no longer exists; `packages/write-scope`, `packages/graph` and
   `packages/resource-referee` build in the workspace. Proof: `cargo test --workspace` (phase 7c).
2. The JS port `src/runner/dispatch/write-scope.mjs` stays pinned to the Rust rule: the extended parity
   test compares JS and Rust on whole-scope `overlaps` and on canonicalisation through the addon; the
   colliding-pairs function is proven by Rust tests against a naive pairwise oracle. Proof: phase 3.
3. `graph` passes the ported cases of `test/state/graph-metrics.test.mjs` and its intended differences
   are listed by name. Proof: phase 4.
4. Each rule in the catalog has one owning test; every blocking finding code is produced by some test; a
   `truncated` fact never yields `accept`; an unknown claim space is refused by name; a per-item limit
   breach is an item-level finding. Proof: phase 5.
5. An addon lacking the `graph` or `writeScope` fields is refused by name; the test that pins
   `versions()` whole and `ports.v1.json` are updated; the shared panic helper is proven by a Rust unit
   test. Proof: phase 7.
6. `cargo test --workspace`, `npm test` and the plan-contract check of decision 30 are green, run one
   after the other, only the two named census tests may be red until the census is regenerated, and the
   census matches the tree afterwards. Proof: phase 7c.

## Non-goals

- Any consumer change (the supervisor, the plan-check script, plan-lint, Work including merge readiness,
  the door, the skills): all in the door plan.
- Any change to Work's storage, status machine or `deps`/`parent` rules.
- Dispatch's runtime enforcement, the event store, instruction composition, `globsMeet` and the
  state-transition graphs; the packages are built so they can adopt later. Merge readiness is a consumer of the Work exports and is handled in the door plan (decision 8).
- A web UI, an MCP tool, a new always-loaded instruction, a new config key or a doctor row.

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Specs, boundary rows, contracts and the recorded plan-check verdicts](phase-01-specs-and-contracts.md) | - | docs/platform/write-scope, docs/platform/graph, docs/platform/resource-referee, docs/platform/component-boundary.md, packages/graph/contracts, packages/resource-referee/contracts, plans/261119-0030-resource-referee-graph-write-scope-stack/reports | 1 | done |
| 2 | [Workspace scaffold and write-scope move](phase-02-scaffold-and-move.md) | - | Cargo.toml, Cargo.lock, packages/write-scope, packages/git/write-scope, packages/git/rust/Cargo.toml, packages/git/node-addon/Cargo.toml, packages/supervision/rust/Cargo.toml, packages/graph/rust, packages/resource-referee/rust, docs/platform/git/spec.md, test/workflow/propose-classify.test.mjs, domains/coding/slice-kinds.yaml | 1 | done |
| 3 | [write-scope: colliding pairs and the addon operations](phase-03-write-scope-pairs.md) | 1, 2 | docs/platform/write-scope, packages/write-scope, packages/git/node-addon/src/git/write_scope.rs, test/git/write-scope-parity.test.mjs, test/runner/write-scope.test.mjs | 2 | done |
| 4 | [graph crate](phase-04-graph-crate.md) | 1, 2 | docs/platform/graph, packages/graph/rust | 2 | ready |
| 5 | [resource-referee crate](phase-05-resource-referee-crate.md) | 1, 3, 4 | docs/platform/resource-referee, packages/resource-referee/rust | 3 | ready |
| 7 | [Addon bindings and ABI](phase-07-addon-bindings.md) | 3, 4 | packages/git/node-addon/src, packages/git/contracts/ports.v1.json, src/native/door.mjs, test/config/config-door.test.mjs, test/git/native-load.test.mjs | 3 | ready |
| 7c | [Integration and landing of the packages](phase-07c-integration.md) | 5, 7 | packages/git/contracts/mutation-census.v1.json, plans/261119-0030-resource-referee-graph-write-scope-stack/reports | 4 | ready |

Reading check (planner applied the contract by hand, then ran the script, which reads frontmatter and
this table only): every phase sits in a later wave than everything it depends on; the longest chain is
four waves; phases 1 and 2 share wave 1, phases 3 and 4 wave 2, phases 5 and 7 wave 3, each pair with
disjoint footprints. Phase 6 of the first draft moved to the door plan as phase 8b. Phase 2 does not read
any phase 1 output, so it runs beside it. Hot and generated files have one owner per wave: `Cargo.toml`,
`Cargo.lock` and the new-crate, addon and supervisor-path manifests phase 2 (it declares every dependency
edge among the new crates and the `serde` and `serde_json` entries up front; a phase that must add an
external crate stops and asks the lead), `write_scope.rs` phase 3, the rest of the addon sources and
`src/native/door.mjs` phase 7, the census phase 7c. Every phase commits in its own linked worktree on
its own branch (decision 14), and rebases follow decision 21.

## Order against other active plans

Measured with the plan check's own overlap rule against every `ready` or `running` plan. The check reads
frontmatter only, so it cannot see the "Files it may write" of the phase files; a clean result proves the
frontmatters are disjoint and nothing more.
- `261118-0947-session-verb-for-agent-sessions`: `done`; the `blockedBy` entry is the record of that order.
- `261118-1159-owner-question-store`: `ready`, P1. At the owner's request ("tách và thu hẹp",
  2026-11-19) the work was split and that plan's frontmatter was narrowed (commit `cb03407aa`). This plan
  overlaps none of its remaining phases, measured per phase with a glob match in both directions. Every
  consumer, which does overlap, is in `plans/261119-0528-resource-check-door-and-adapters`.
- `261118-1045-project-supervisor`: `draft`, P1; its footprint includes `packages/supervision/**`, which
  is where `portfolio.rs` lives. This plan touches only `packages/supervision/rust/Cargo.toml` (the path
  of one dependency). The door plan's supervisor adapter changes `portfolio.rs`; whichever plan lands
  second rebases, and the lane is told before that phase starts.

`blockedBy` is a plan-level field and the check script does not honour it when it looks for overlaps
(`activeOverlaps` in `scripts/plan-contract-check.mjs:149-157`); recorded below as a follow-up. Step zero
(decision 24) applies whenever a blocker lands before start.

The door plan stays `draft` until this plan is `done` and `owner-question-store` is `done` (decision 25).

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
- `globsMeet` (`src/runner/dispatch/write-scope.mjs:111-142`, used by `src/workflow/propose-validate.mjs`) is a seventh meaning of overlap: propose and classify would adopt the `write-scope` rule or stay as recorded debt.
- `activeOverlaps` in `scripts/plan-contract-check.mjs:149-157` ignores `blockedBy`, contradicting the
  plan contract section 5; either the script skips pairs where one plan is blocked by the other, or
  the contract text changes. Phase 8 touches this script for another reason and should not absorb it.

## Owner questions

None open. The split and the order were decided by the owner (see "Order against other active
plans"); the names were settled in decision 26.

## Risks and rollback

- Moving `write-scope` touches the workspace `Cargo.toml` and three consumers' manifests, hot files of
  other lanes. Announce before phase 2; the lane that lands second rebases (board rule).
- The census is one generated file covering about fourteen hundred sources; two phases regenerating it
  in parallel would conflict. Only the landing regenerates it, in the loop of decision 14. This is safe
  only while phases commit in linked worktrees.
- This plan changes no behaviour: nothing calls the packages until the door plan lands, so a landing here
  cannot make two authorities disagree. The cost is that the packages ship unused, and the reading-map
  rows (owned by the door plan because `owner-question-store` also claims that file) land with it.
- An addon built before phase 7 is refused by name through the ABI clauses; no payload falls back.
- Rollback: each phase is its own commit. Revert in the reverse order 7c, 7, 5, 4, 3, 2, 1, regenerate
  the census and rebuild `Cargo.lock` at the end. If the door plan has landed, revert it first
  (10, 9, 7b, 8, 8b). `fgctl repair` steps back one activation only, so phase 7c records the digest of
  the release that was active before this landing in `reports/close.md` and rollback re-activates that
  digest explicitly (`fgctl upgrade --from <tree of that release>`); check that `apps/fgos-gateway` still
  builds from its own lock.

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

### Session 4: independent reviewers through the skill's subagent workflow (2026-11-19)

The release was activated first, which reopened the Agent-tool gate. The four lenses then ran as
`code-reviewer` subagents on the pair of plans (again without the logs). 31 raw findings (scope 8,
security 8, assumptions 8, failure modes 7). The planner checked the load-bearing claims against the tree
before adjudicating: no production caller of `admissible`, `open_beneath` and its cap and revision,
`versions()` pinned whole by `native-load.test.mjs:25`, the scanner without a diff mode, CI ignoring
`plans/**` with no job or hook running the plan check, the stale `slice-kinds.yaml` glob, `globsMeet`.

| # | Cluster (reviewers) | Severity | Disposition | Applied to |
|---|---|---|---|---|
| 1 | Phase 3 cannot compare JS and Rust on overlap: the addon has no such operation and it was phase 7's (assumption, failure) | Critical | Accept | Phase 3 owns `write_scope.rs` |
| 2 | Landing the packages without the plan-check swap leaves two authorities with different overlap cuts (failure) | Critical | Accept | Decision 25: all consumers in one plan |
| 3 | Supervisor reporting surface does not exist; nothing calls `admissible` (scope, assumption, failure) | High | Accept | Decision 17; supervisor adapter moves to the door plan as function-level |
| 4 | `versions()` is pinned whole by a test outside any footprint (assumption) | High | Accept | Phase 7, decision 16 |
| 5 | Census safeguard used a scanner mode that does not exist; two tests go red (assumption, failure) | High | Accept | Decision 14 |
| 6 | Cargo.lock stop rule contradicts the merge; census landing races other plans (assumption, failure) | High | Accept | Decisions 14, 21, 28; phase 7c |
| 7 | Colliding pairs had no ABI gate and the door error could not name the field (failure) | High | Accept | Decision 16, phase 7 |
| 8 | Input limits would refuse existing plans and one oversize item sank the call (security) | High | Accept | Decision 7 |
| 9 | `truncated` was dropped by every caller except the referee (security) | High | Accept | Decision 7 |
| 10 | Hot-file rule never applied by default, redundant with overlap, and glob-versus-glob had no primitive (security, scope) | High | Accept | Decisions 11, 12 |
| 11 | A new input reader duplicates `open_beneath`; the CI threat model was wrong (scope, security) | High | Accept | Decision 23 |
| 12 | `resource-referee` addon binding has no Node caller (scope, failure) | High | Accept | Decision 16 |
| 13 | Phase 4 cannot reproduce plan-check verdicts without `write-scope` (scope) | High | Accept | Decision 20, phase 1 |
| 14 | Empty-footprint loophole in the supervisor (security) | Medium | Accept | Decision 17 |
| 15 | No panic containment in new addon entries (security) | Medium | Accept | Decision 16 |
| 16 | `readOnly` is an unchecked bypass and `--units` is not the `Unit` shape (security) | Medium | Accept | Decision 13 |
| 17 | Seventh overlap meaning `globsMeet`; no mechanical guard against a new copy (assumption) | Medium | Accept | Decision 29, follow-ups |
| 18 | Stale `slice-kinds.yaml` glob after the move; crate-move search incomplete (assumption, security) | Medium | Accept | Phase 2, decision 29 |
| 19 | Plan B hidden dependency, stale cross-references, rollback order (failure, scope) | Medium | Accept | Both plans |
| 20 | Reading-map rows and CHANGELOG lines landed late by the split (scope, assumption) | Medium | Accept in part | Risks: rows stay with the door plan because `owner-question-store` claims the file |
| 21 | Project-supervisor owns `portfolio.rs` and was not measured (failure) | High | Accept | Order section |
| 22 | Seventh and later contract facts off by lines (`door.mjs` 33-35) (all) | Low | Accept | Facts |
| R1 | Move the `graph` ABI clause to the door plan too (failure) | Medium | Reject | `graph` is consumed in process by Work in the door plan and by scripts; the clause belongs with the binding |

Whole-Plan Consistency Sweep after session 4: both plans and all phase files were regenerated from the
decisions above and re-read against each other; the owner of each hot file, the consumers, the Node
access rule, the error policy, the limits and the footprints agree. Unresolved contradictions: none.

### Session 5: independent reviewers, fifth round (2026-11-19)

Four `code-reviewer` subagents ran again on the pair of plans after the consumers moved to the door plan.
28 raw findings (scope 7, security 7, failure modes 7, assumptions 7). The planner verified the
load-bearing claims in the tree before adjudicating: both phase-table readers strip `*`
(`portfolio.rs:317`, `plan-contract-check.mjs:42`), `graph-harness.mjs:21,144` feeds `fgos merge`, the
script cannot load the addon from a checkout, `ports.v1.json:115` lists the addon functions, the JS port
has no set-level function, the addon has two private panic wrappers and no shared one, Work items carry
no footprint today.

| # | Cluster (reviewers) | Severity | Disposition | Applied to |
|---|---|---|---|---|
| 1 | Phase-table readers strip `*` and drop bad cells, so the door says accept on colliding phases (security, assumption) | Critical | Accept | Decision 31, door plan phases 8b, 8, 7b |
| 2 | The plan-check gate and the verdict recording cannot run from a checkout; `--all` is red for other lanes (failure, assumption) | Critical | Accept | Decisions 20, 30; phases 1, 7c |
| 3 | Phase 8 changes merge readiness and `rankImpact`; "merge conductor in neither plan" was false (assumption, security) | Critical | Accept | Decision 8; door plan phase 8 |
| 4 | Work items without a footprint would conflict with everything (assumption) | High | Accept | Decision 17 |
| 5 | A policy file can switch off the collision check (security) | High | Accept | Decision 11 |
| 6 | Limits: refuse versus truncate was contradictory; only pairs truncate (scope, security) | High | Accept | Decision 7 |
| 7 | Landing loop skipped lock, skills and tests after a merge (failure) | High | Accept | Decision 14 |
| 8 | Door plan promoted early blocks the foundation's gate (failure) | High | Accept | Decision 25 |
| 9 | Acceptance 2 needed a JS pairs function that does not exist (scope) | High | Accept | Criterion 2, decision 19 |
| 10 | Panic helper does not exist; test-only branch forbidden; double ownership of `write_scope.rs` (scope, assumption) | Medium | Accept | Decision 16, phases 3, 7 |
| 11 | Roots, byte cap and refusal mapping of `open_beneath` unspecified (security) | Medium | Accept | Decision 23, door plan 7b |
| 12 | Claim spaces undefined; an unknown space never collides (security) | Medium | Accept | Decision 13 |
| 13 | Control characters in printed entries (security) | Medium | Accept | Decision 23 |
| 14 | `ports.v1.json` and the `--units` contract unowned (scope) | Medium | Accept | Phases 1, 7 |
| 15 | Two critical-path rules remain (failure, assumption) | Medium | Accept | Decision 18 |
| 16 | Importers of the swapped exports incomplete; verify grep false (scope, assumption) | Medium | Accept | Decision 18, door plan 8 |
| 17 | Door plan had no step zero or second baseline after `owner-question-store` (failure) | Medium | Accept | Decisions 20, 24 |
| 18 | `fgctl repair` rolls back one activation only (failure) | Medium | Accept | Risks and rollback |
| 19 | A dependency on `fgos-write-scope` would drift two lock files (failure) | Medium | Accept | Decision 15 |
| 20 | Door plan footprints missed tests and generated skill wrappers (assumption) | Medium | Accept | Door plan 8, 9 |
| 21 | Supervisor reporting function and `facts-truncated` unreachable in a pairwise `admissible` (scope) | Medium | Accept | Decision 17, door plan 8b |
| 22 | Optional alone-in-layer cannot fire from `--plan` (scope) | Medium | Accept | Decision 12 |
| R1 | Drop `cycle_through` and `--policy` as unrequested (scope) | Medium | Reject | Owner asked for the cycle workaround and chose `--policy` (decisions 11, 27) |

Whole-Plan Consistency Sweep after session 5: both plans and all phase files were regenerated from the
decisions above and re-read against each other. Unresolved contradictions: none.

### Session 6: independent reviewers, sixth round (2026-11-19)

Four `code-reviewer` subagents ran on the pair after the fifth round was applied; the brief asked for
remaining flaws only and an honest rating. 22 raw findings (security 5, failure modes 6, assumptions 5,
scope 6) and **no Critical**. The planner verified the claims in the tree before adjudicating: the addon's
shared `marshal::guarded_as`, the supervisor reader returning an empty list when no table is found, the
skill paths under `domains/coding/skills`, the generators of the verb tables, `compiled.json` not being
generated from `slice-kinds.yaml`, the five test files outside phase 8's footprint.

| # | Cluster (reviewers) | Severity | Disposition | Applied to |
|---|---|---|---|---|
| 1 | No rule gives a later wave the earlier waves' work; census diff against `origin/main` lists predecessors' files (failure) | High | Accept | Decision 14, phase 7c, door phase 10 |
| 2 | Phase 8 footprint misses five test files and lists a directory without the needed tests (assumption, scope) | High | Accept | Door plan phase 8 |
| 3 | Phase 9 edits skill files at paths that do not exist and misses `domains/coding/skills` (assumption) | High | Accept | Door plan phase 9 |
| 4 | The overlap `door` row would fail on callers or on the parallel supervisor branch (failure, assumption) | High | Accept | Decision 29, door plan phase 8 moves after 8b |
| 5 | Reader returns an empty phase list for no table or no rows, so the door says accept (security) | High | Accept | Decision 31, door plan 8b, 7b |
| 6 | A second panic guard planned although `marshal::guarded_as` exists (security, scope) | High | Accept | Decision 16, phase 7 |
| 7 | Verb tables are generated; the generator was missing from the regeneration list; `compiled.json` is not generated from `slice-kinds.yaml` (failure) | Medium | Accept | Decisions 21, 14, 29; phase 2 |
| 8 | Symlinked root with a trailing slash passes; a bare file name has an empty parent (security) | Medium | Accept | Decision 23, door plan 7b |
| 9 | Only entries are escaped; ids, policy path and evidence are printed raw (security) | Medium | Accept | Decision 23 |
| 10 | A policy could set a floor check's class or parameters (security) | Medium | Accept | Decision 11, phase 5 |
| 11 | Phase 7c Verify demanded a green `--all` that decision 30 says cannot happen (failure, assumption, scope) | Medium | Accept | Phase 7c |
| 12 | Wave 1 runs several cold cargo builds at once (failure) | Medium | Accept | Decision 14, phase 1 |
| 13 | The adapter's layer precedent (`hot-lock`, infra) was wrong (assumption) | Medium | Accept | Decision 18 |
| 14 | A baseline recorded in phase 1 that the door plan never compares against (scope) | Medium | Accept | Decision 20, phase 1 |
| 15 | Optional node weights in the critical path have no consumer (scope) | Medium | Accept | Phase 4 |
| R1 | `cycle_through` and `--policy` have no consumer yet (scope, question) | Medium | Reject | The owner asked for the cycle workaround and chose `--policy` (decisions 11, 27); the first consumers are follow-ups |
| R2 | Move decisions 8, 18, 29, 31 into the door plan (scope) | Medium | Reject for now | They are cross-referenced from the door plan; moving them is bookkeeping |

Whole-Plan Consistency Sweep after session 6: both plans and all phase files were re-read against the
decisions above; unresolved contradictions: none.
