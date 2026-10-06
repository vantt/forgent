# CONTEXT — immediate test feedback reduction

## Feature boundary

Reduce test feedback time immediately without weakening `npm test` as the full-suite Definition-of-Done proof. This track deliberately combines only bounded, independently measurable changes that can ship before the broader proof-architecture program:

1. establish a current-tree profile;
2. classify and measure test duplication without deleting tests;
3. remove newly visible large-state or accidental external-process costs;
4. expand the already-proven fast fixture pattern to the audited CLI batch;
5. add a canary-first local feedback door;
6. add a minimal conservative related-test selector for a small set of clearly owned areas, in shadow mode first.

The track does **not** delete tests, change product behavior, replace authoritative full-suite gates, introduce cross-commit test caching, build a general proof registry, create a global callable CLI core, or implement distributed test execution.

## Locked decisions

| ID | Decision | Reason |
|---|---|---|
| ITR-D01 | `npm test` remains the portable full-suite DoD command and continues discovering every `test/**/*.test.mjs` file exactly once. | Fast feedback must not create a weaker completion proof. |
| ITR-D02 | Reprofile the current immutable tree before choosing any new hotspot beyond the already-audited fast-fixture batch. | P02 is valuable orientation but the repository and suite have changed since that snapshot. |
| ITR-D03 | Immediate execution-cost work is limited to removing work that is not the invariant under test: fixture-only CLI initialization, accidental external provider/network calls, and oversized live-state fixtures. | These categories already produced measured wins without reducing coverage. |
| ITR-D04 | Fast fixtures are explicit opt-in. Do not change `tmpCwd()` globally. Keep real `fgos init` wherever init, process, cwd/subdir, idempotency, output, Git transport, conflict, rollback, lock, or durable-write behavior is the proof. | P06 proved the bounded pattern and also found three subdir cases that failed under over-broad replacement. |
| ITR-D05 | Canary-first is an additive local command: selected canaries run first; if green, the full suite still follows. It does not replace `npm test`, Work verify, post-merge reverify, or CI. | It improves time-to-first-failure with near-zero false-green risk. |
| ITR-D06 | The first related selector supports only explicitly registered, clearly owned source areas. Every changed path must be explained. Unknown, mixed, unsafe, test-infrastructure, shared-core, packaging, generated, config/schema/template, CLI-entry, Rust-host, rename/delete ambiguity, or ownership-validation failure forces full selection. | Static imports and file proximity are incomplete in this repository. |
| ITR-D07 | Static graph/import information may only add tests; it may never remove manifest-selected or mandatory boundary tests. | Dynamic subprocess/filesystem/registry/cross-language dependencies are not fully represented in static graphs. |
| ITR-D08 | Related selection begins in shadow mode: run related, then run full, compare outcomes, and retain evidence. It is promoted only to an explicit inner-loop command after zero unresolved patch-related misses over the defined sample. | P05 previously stopped without implementation or miss evidence. |
| ITR-D09 | Each optimization unit has separate before/after evidence; savings measured on different snapshots are not summed. | Prevents false aggregate speed claims. |
| ITR-D10 | Add anti-regression guards with each quick win: fixture-only subprocess lint/guard where mechanically expressible, external-provider fail-closed checks, and selector manifest validation. | A speed win that immediately regrows does not meet the anti-growth objective. |
| ITR-D11 | The dirty main checkout is not a valid benchmark source. Measurement and implementation occur in clean isolated worktrees from a recorded SHA, with Rust release artifacts and Node dependencies prepared before samples. | Current checkout contains unrelated coordination work and would invalidate attribution. |
| ITR-D12 | No full-suite run is started while another benchmark/full-suite run is active on the same machine. Record load, CPU count, Node version, SHA, dirty state, command, exit, wall, user/system CPU and RSS where available. | Prior measurements showed large ambient-load and OOM effects. |
| ITR-D13 | Test count alone is not a deletion signal. Distinguish execution duplication, surface duplication, and semantic duplication. The first two may be optimized without deleting assertions; semantic deletion requires invariant, guard, boundary, failure-mode, historical-fault, and mutation/fault-detection evidence. | Current evidence proves repeated work, not a safe deletion percentage. |
| ITR-D14 | Do not replace `node:test` in this track. Build only narrow project-specific harness utilities on top of it. A Vitest/Jest migration requires a separate measured pilot after fixture/process costs are reduced. | Current bottlenecks are subprocess, fixture, Git/Rust, live-state and external-process work, not assertion-framework overhead. |
| ITR-D15 | Add a proof-inventory/admission foundation in warning-only mode: inventory existing expensive tests and flag new fixture-only subprocess or unexplained boundary tests in onboarded areas. Do not require metadata migration for the whole suite in this track. | Immediate optimization must leave an anti-growth mechanism without blocking delivery on a repository-wide taxonomy migration. |

## Existing evidence inherited by the plan

- `plans/260915-0455-test-suite-feedback-cost/reports/green-baseline.md`
- `plans/260915-0455-test-suite-feedback-cost/reports/docs-index-pilot.md`
- `plans/260915-0455-test-suite-feedback-cost/reports/external-claude-pilot.md`
- `plans/260915-0455-test-suite-feedback-cost/reports/fixture-init-pilot.md`
- `plans/260915-0455-test-suite-feedback-cost/reports/cli-harness-responsibility-audit.md`
- `plans/260915-0455-test-suite-feedback-cost/reports/handoff-fast-fixture-expansion.md`
- `plans/reports/test-suite-cost-brainstorm-260920.md`

## Pinned terms

- **Canary:** a fast, explainable subset run before the unchanged full suite; a green canary is never completion proof.
- **Related selection:** a conservative test subset for an explicit inner-loop or shadow command; it is not a replacement for `npm test`.
- **Fixture-only initialization:** a CLI invocation whose only role is to construct precondition state and whose process/init behavior is not asserted by that test.
- **Patch-related miss:** related selection is green or omits a test, while the full suite exposes a failure causally attributable to the patch.
- **Fallback-full:** selector deliberately chooses the complete discovered test set because safe narrowing cannot be proven.

## Outstanding questions

None. Promotion thresholds and exact pilot sample size are specified in `plan.md`; implementation remains subject to the validating reality check.
