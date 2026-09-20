# Agent handoff prompt — Immediate Test Feedback Reduction

Copy the prompt below into a fresh implementation agent session.

---

You are implementing the detailed track in:

- `plans/260920-immediate-test-feedback-reduction/CONTEXT.md`
- `plans/260920-immediate-test-feedback-reduction/plan.md`

Work in `/home/vantt/projects/forgentX`, but **do not implement in the current dirty main checkout**. The checkout currently contains unrelated coordination work. Create/use a clean isolated worktree from a recorded execution-time SHA, preserve all unrelated work, and keep all benchmark/implementation evidence attributable to that clean snapshot.

## Mission

Reduce test feedback time immediately without weakening proof. The authoritative constraints are:

1. `npm test` remains the full-suite Definition-of-Done command and must continue discovering every `test/**/*.test.mjs` exactly once.
2. Do not delete tests in this track.
3. Do not replace `node:test`; add only narrow project-specific harness utilities.
4. Distinguish:
   - execution duplication;
   - surface duplication;
   - semantic duplication.
   Counts, names, matching assertions and coverage are not deletion evidence.
5. Fast fixtures are explicit opt-in. Never change global `tmpCwd()` behavior without a new decision.
6. Canary-first is additive: green canaries always continue to the unchanged full suite.
7. Related selection is manifest-first, explainable and fail-safe. Unknown/unsafe/shared-core/test-infra/config/schema/template/generated/packaging/Rust-host/CLI-entry changes force full selection.
8. Static graph/import analysis may add tests but never remove manifest or mandatory boundary tests.
9. Related selection begins in shadow mode and cannot be promoted without the P05 evidence thresholds.
10. Never sum savings measured on different snapshots or under incomparable load.

Read these first, in order:

1. `AGENTS.md`
2. `docs/specs/reading-map.md`
3. `docs/specs/runner.md`
4. `plans/260920-immediate-test-feedback-reduction/CONTEXT.md`
5. `plans/260920-immediate-test-feedback-reduction/plan.md`
6. The inherited reports linked from CONTEXT.md.

## Mandatory operating rules

- Before dispatching any work, run `node src/runner/dispatch.mjs decide` using the appropriate capability/purpose and obey its mechanism result.
- Before editing any existing function/class/method, run GitNexus upstream impact analysis. HIGH/CRITICAL must be reported and treated as a raised bar. UNKNOWN requires text-search confirmation.
- Before committing, run GitNexus `detect-changes`; partial/truncated is not a clean result.
- Do not overwrite or clean unrelated changes.
- After updating Markdown, preview it with MDView and retain/report the URL.
- Use Node >=18 APIs only.
- Do not run concurrent full-suite benchmarks on this machine. Record load and check for competing benchmark/full-suite processes.
- Build Rust release binaries and install Node dependencies before accepting test failures as product regressions.

## Execution model

Execute one phase/cell at a time, in the dependency order declared by the plan:

```text
P00 → P00A → {P01, P02} → P03 → P04 → P05 → P06
```

P01 and P02 may be separate branches/cells after P00A, but all benchmark runs must remain serialized. P03 and P04 are sequential because both touch the test execution seam.

Do **not** start by implementing all phases at once. For each phase:

1. inspect current-tree reality;
2. run required impact analysis;
3. collect before evidence;
4. implement only the phase scope;
5. run focused proof;
6. run the phase's required full proof;
7. record exact evidence and disposition;
8. run detect-changes;
9. commit the phase independently before moving on.

## Phase instructions

### P00 — current immutable baseline/profile

- Record SHA, branch, Node, OS, CPU count, load and clean status.
- Create clean worktree; run `npm ci` and `cargo build --release --workspace`.
- Ensure no competing full-suite/benchmark process.
- Capture three valid green samples and one separate JUnit profile using `scripts/test-timing.mjs`.
- Discard any dirty, failed, interrupted or overlapping sample.
- Produce:
  - `plans/260920-immediate-test-feedback-reduction/reports/current-baseline.md`
  - raw artifacts under the plan's reports/artifacts directory.
- Report top 30 tests/files, directory totals and candidate cost classes.
- If timing tooling is broken, fix it with focused tests before collecting samples.

Stop and report rather than proceeding if no trustworthy green baseline can be obtained.

### P00A — proof/duplication inventory; no deletion

- Build a machine-readable inventory for the scope defined in the plan.
- Give every entry exactly one primary execution responsibility or explicit `unknown`.
- Separate execution duplication, surface duplication and semantic duplication.
- Do not infer missing invariant/guard metadata; leave it null/unknown.
- Add a warning-only or baseline-ratcheted admission check for onboarded files:
  - new fixture-only `fgos init` without a boundary reason;
  - new real-provider/network call without provider-boundary reason;
  - new CLI subprocess test without process/Git responsibility or invariant reference.
- Keep existing debt as baseline; do not mass-edit thousands of tests.
- Keep `node:test`.
- Expected default paths:
  - `scripts/test-proof-inventory.mjs`
  - `test/scripts/test-proof-inventory.test.mjs`
  - plan reports JSON/Markdown/baseline artifacts.

### P01 — current hotspot/leak removal

- Use only fresh P00 candidates.
- Select at most three independent candidates.
- Trace each cost to accidental external provider/network/process, oversized live-state/history, or obvious fixture-only subprocess.
- Register threshold before mutation: `max(10% focused median, 2 × focused run-to-run range)`.
- Preserve the invariant and real boundary under test.
- Add the narrowest anti-regression guard for every accepted candidate.
- Revert any candidate below threshold or with uncertain proof; record `stop` rather than rationalizing it.

### P02 — fast-fixture expansion

Initial lease is exactly the nine files named in the plan plus the shared CLI harness only if needed.

- Re-audit every init site and classify it:
  - fixture-only;
  - init/process-contract;
  - cwd/subdir;
  - Git/process-integration;
  - unknown.
- Replace only fixture-only sites using existing fast helpers.
- Preserve all listed init/cwd/Git/merge/rollback/lock/durable-write doors.
- Run the identical focused command three times before and after.
- Record replaced/retained site counts and reasons.
- Add a scoped anti-growth check for onboarded files.
- Do not change the global helper default.

### P03 — canary-first runner

Implement `npm run test:canary` so:

- explicit canary files are normalized, deduplicated and contained under test root;
- empty/invalid/outside/symlink-escape sets refuse;
- canary red exits immediately without full suite;
- canary green invokes the unchanged full suite exactly once;
- selection and full execution reuse the portable `run-tests.mjs` seam;
- no shell glob interpretation is introduced;
- structured output says canary is non-authoritative.

Prove all adversarial cases listed in P03 and keep `npm test` semantics unchanged.

### P04 — minimal conservative related selector

- Reality-validate each candidate pilot area; remove unsafe areas rather than widening assumptions.
- Add ownership manifest, selector, focused tests, `--explain`, and shadow command.
- Collect committed/staged/unstaged/untracked/rename/delete changes correctly.
- Preserve old/new rename paths and deleted old path.
- Validate manifest and path containment; unsafe conditions choose full.
- Every changed path must be explained or cause full fallback.
- Static graph/import additions are union-only.
- Zero selection refuses.
- Do not document `test:related` as adopted before P05 passes.

### P05 — shadow evaluation

Evaluate at least:

- 30 historical patches across pilot areas;
- 10 full-trigger/unknown cases;
- 10 synthetic adversarial cases;
- current track implementation commits where relevant.

For each case retain selector explanation, related result, full result and causal classification.

Promotion requires all plan thresholds, especially:

- zero unresolved patch-related misses;
- 100% fallback on unsafe cases;
- median overhead <500ms;
- selected ratio ≤25% for eligible cases;
- at least 4× faster median feedback;
- eligible-case fallback ≤40%.

Any unresolved patch-related miss means stop or fix and restart the affected evaluation sample from zero.

### P06 — final integration/disposition

Return `expand`, `revise` or `stop` separately for:

- hotspot removal;
- fast fixtures;
- canary-first;
- related selector.

Run the complete final proof from the plan. Add changelog/how-to/reading-map entries only for commands that actually pass their promotion gates. Do not authorize test deletion, framework migration, cross-commit caching or partial DoD.

## Required final report

At completion, report:

- integrated commit list per phase;
- exact before/after focused measurements;
- current full-suite samples/profile without falsely summing cross-snapshot savings;
- proof inventory totals by responsibility and duplication class;
- every preserved boundary;
- canary timing and semantics;
- selector sample, fallback rate, selected ratio, overhead and miss analysis;
- final disposition for each pilot;
- remaining risks and explicit deferred tracks;
- MDView URLs for long reports;
- GitNexus impact/detect-change results or exact degraded reason.

## Stop conditions

Stop and surface the evidence instead of improvising if:

- the clean isolated benchmark base cannot be established;
- current files/helpers differ materially from the plan;
- a required boundary cannot be distinguished from fixture-only setup;
- selector ownership is ambiguous;
- a patch-related selector miss remains unresolved;
- full suite semantics would need weakening;
- implementation would require replacing `node:test`, global `tmpCwd()`, or introducing global `runCli(argv, ctx)`;
- unrelated dirty work would be overwritten.

Do not ask the person routine implementation questions that the repository can answer. Batch only genuine product/authority decisions; continue all independent work while any such decision is pending.

---
