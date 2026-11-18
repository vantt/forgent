# Phase 1: Specs, boundary rows, contracts and the recorded plan-check verdicts

A new area gets a spec before code (L5 question 2). This phase writes three area specs, the data
contracts, records the evidence later phases compare against, and settles the facts they depend on.
Step zero (decision 24) applies first.

## Inputs

- `plan.md` of this plan (decisions 1 to 31) and `plans/reports/research-261118-1704-pkm-graph-algorithms-for-shared-overlap-core.md`.
- `packages/git/write-scope/src/lib.rs` (the path authority today) and `src/runner/dispatch/write-scope.mjs` (the JS port, including `globsMeet`).
- `src/state/graph-metrics.mjs`, `dep-graph.mjs` (behaviour the graph package must match), `scripts/plan-contract-check.mjs`, `packages/supervision/rust/src/portfolio.rs`, `src/report/capability-plan-lint.mjs` (`pathsOverlap`).
- `src/workflow/case-admission.mjs` guards (to check what the rule catalog can express), `core/skills/_shared/plan-contract.md` section 4.
- `test/git/write-scope-parity.test.mjs`, `test/runner/write-scope.test.mjs`, `src/native/door.mjs` (ABI list).
- `docs/platform/governance.md#decision-scope-to-holder-table`, `docs/platform/component-boundary.md`, `packages/supervision/contracts/plan-vocabulary.v1.json` (shared-contract pattern), `packages/durable-file/rust/src/beneath.rs` (the file reader the door will reuse).

## Files it may write

`docs/platform/write-scope/`, `docs/platform/graph/`, `docs/platform/resource-referee/` (each a `spec.md`), `docs/platform/component-boundary.md`, `packages/graph/contracts/graph.v1.json`, `packages/resource-referee/contracts/resource-referee.v1.json`, and this plan's `reports/`.

## Steps

0. Refresh `base`, re-read the file and line facts this plan cites, re-run the plan check and the overlap measurement; stop if a cited fact moved.
1. Run the prior-art searches the repo requires (`git log -S` on `footprintOverlapAmong`, `computeSchedule`, `detectCycles`, `pathsOverlap`, `globsMeet`, `overlaps(` and the earlier names of each) and write what existed and why it moved into `reports/facts.md`. Search `test/` as well as `src`, `packages`, `apps`, `core` and `docs`.
2. Write the `write-scope` spec: grammar, the soundness contract of may-overlap stated as lexical (case folding, Unicode normalisation and symlinks are outside it, and a verdict carries that caveat), the set-level colliding-pairs function, why the package left `git/`, and the difference between the meanings found today (equal-only, containment with a character cut, containment with a segment cut, regex glob, `globsMeet`), choosing one. State the error policy for an entry that does not canonicalize and for an empty footprint (decision 17).
3. Write the `graph` spec and `graph.v1.json`: nodes, edge kinds with a registry (does the kind order or not), exclusion pairs, priority order, outputs (one canonical cycle per strongly connected component rooted at its smallest id with the component's members and induced edges and the bounded `cycle_through(id)` query, layers with deferral evidence, critical path, groups, dangling references), the tie-break rules, and the split between refusals (malformed input) and results. Say how the package `graph` differs from the Work verb `fgos graph`.
4. Write the `resource-referee` spec and `resource-referee.v1.json`: claims and the caller-asserted `readOnly` marker, the closed catalog (decision 12), the floor (its checks take no parameters and are always blocking), finding classes (blocking, advisory), stable finding codes, verdict derivation (`accept`, `accept-with-advice`, `reject`), policy replace semantics with the verdict echoing the policy identity, and the rule that the package holds no default policy (the default belongs to the door). A truncated fact set is a blocking finding. Check the five guards of `case-admission.mjs` and the rules of plan-contract section 4 against the catalog and list any it cannot express.
5. Measure the real maxima (the largest plan frontmatter, the folded Work view, the largest plan table, input file sizes) and fix the numeric `limits` of decision 7 in both contracts, with per-item limits as item-level findings and a `maxInputBytes`. Write the claim-space registry of decision 13 and the shape of the `--units` file (id, claims or `readOnly`, `dependsOn`, an optional declared layer) into `resource-referee.v1.json`; the door reads that one file.
6. Write the runnable invocation of the old plan-check script: `reports/run-plan-check.mjs`, a small runner that makes the addon loadable without a build (set `FGOS_ACTIVE_MANIFEST_PATH` to the activated release's manifest, as the test launcher does, and only if that fails call `ensureAddonForScript()` from `scripts/lib/git-addon-stage.mjs`) and then runs the script, and refuses to report anything if a result carries `git-addon-unavailable`. Copy the phase tables of the current plans into a snapshot under `reports/`. The door plan records the baseline of the old verdicts at its own base.
7. Record in `reports/facts.md` the names of decision 26 and re-confirm the door's name `fgos resource-check` against the verb tables, then add the three packages and the moved `write-scope` to `docs/platform/component-boundary.md`. The reading map is updated in the door plan.

## Verify

`fgos convention check` passes on the new files; every statement about current code cites a file and line that exists; the catalog gap list is empty or each gap names its resolution; the verdict snapshot exists and was produced by the old script.

## Rollback

Delete the files this phase created; nothing else reads them yet.
