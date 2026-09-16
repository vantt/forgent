# Test Suite Feedback Cost - Implementation Track

**Track:** `test-suite-feedback-cost`

**Status:** P00-P04 complete on track; P05 next

**Date:** 2026-09-15

**Mode:** high-risk

## Objective

Restore trustworthy cross-environment test execution, establish a reproducible
green cost baseline, and evaluate four bounded ways to shorten the developer and
agent feedback loop without weakening fgOS's full-suite Definition of Done.

This track is high-risk because it edits the proof harness and CI door used to
judge all later changes. It does not change product runtime behavior.

## Authority

Read in this order:

1. `docs/specs/reading-map.md`
2. `docs/platform-foundations.md`, especially L5 and D-ADR0035
3. `docs/specs/runner.md`, especially tsk-25b D5 and RUL37
4. `decision-lock.md`
5. `plans/reports/advisory-260915-0413-test-suite-tiering-and-related-selection.md`
6. The active phase brief

The decision lock incorporates the accepted and corrected findings from both
reviewers. Raw profile and CI evidence lives under
`plans/reports/artifacts/260915-npm-test-baseline-224f0803/`.

## Execution Model

Use `core.coordination-protocol.standalone-master-coordination-loop` through
`fgos-plan-loop`. One phase is one cell. Every cell follows:

```text
Doer -> independent Reviewer + Red-Team -> Lead disposition
     -> Fixer + both rechecks when findings are accepted -> close
```

The Lead creates a private linked worktree per cell and is the only merge
authority. Executor/provider/model selection is intentionally deferred to each
execution-time `dispatch decide` result.

Execution inputs:

- Plan root: `plans/260915-0455-test-suite-feedback-cost/`
- Track: `test-suite-feedback-cost`
- Track branch: create `test-suite-feedback-cost` from the execution-time HEAD
  and record that immutable commit as `BASE_REF`
- Cell branch convention: `test-suite-feedback-cost--pNN`
- Cell coordination id convention: `test-suite-feedback-cost--pNN`
- Protocol: `core.coordination-protocol.standalone-master-coordination-loop`
- Verification state: `docs/architect/agent-coordination/verification/test-suite-feedback-cost/`

## Capability Units

- unit: P00 make CLI test spawning hermetic across agent and ordinary shells
  capability: code:implement
- unit: P01 restore portable full-suite discovery and CI execution on three OSes
  capability: code:implement
- unit: P02 establish the isolated green baseline and profiling evidence
  capability: code:test
- unit: P03 measure and optimize docs-index test state setup
  capability: code:implement
- unit: P04 isolate unintended external-Claude calls and measure the result
  capability: code:implement
- unit: P05 build and shadow-evaluate the conservative related-test selector
  capability: code:implement
- unit: P06 compare CLI fixture initialization strategies in a bounded pilot
  capability: code:refactor
- unit: P07 audit CLI harness responsibilities and identify implementation-ready hotspots
  capability: code:review
- unit: P08 synthesize pilot evidence and authorize only grounded follow-up work
  capability: code:review

## Dependency Order

```text
P00 -> P01 -> P02 -> P03 -> P04 -> P05 -> P06 -> P07 -> P08
```

P00 and P01 repair independent defects but remain sequential in this track so
their full-suite runs do not compete for machine resources. P02 locks the common
baseline. P03-P06 stay sequential for attributable timing. P07 audits the
remaining harness cost without mutating it. P08 is evidence-only.

## Phase Index

| Cell | Status | Brief | Outcome |
|---|---|---|---|
| P00 | complete on track | [phase-00-harness-writer-hermeticity.md](phase-00-harness-writer-hermeticity.md) | shell-independent writer behavior landed on track |
| P01 | complete on track | [phase-01-portable-test-runner-ci.md](phase-01-portable-test-runner-ci.md) | one Node >=18 test door landed on track; CI execution proof remains an external gate when remote CI is unavailable |
| P02 | complete on track | [phase-02-green-baseline-and-profile.md](phase-02-green-baseline-and-profile.md) | accepted baseline and hotspot report recorded in [reports/green-baseline.md](reports/green-baseline.md) |
| P03 | complete on track | [phase-03-docs-index-pilot.md](phase-03-docs-index-pilot.md) | docs-index state-fixture pilot recorded `expand` in [reports/docs-index-pilot.md](reports/docs-index-pilot.md) |
| P04 | complete on track | [phase-04-external-claude-isolation-pilot.md](phase-04-external-claude-isolation-pilot.md) | external-Claude isolation pilot recorded `expand` in [reports/external-claude-pilot.md](reports/external-claude-pilot.md) |
| P05 | planned | [phase-05-related-test-selector-pilot.md](phase-05-related-test-selector-pilot.md) | shadow-evaluated conservative selector |
| P06 | planned | [phase-06-cli-fixture-init-pilot.md](phase-06-cli-fixture-init-pilot.md) | measured fixture strategy verdict |
| P07 | planned | [phase-07-cli-harness-responsibility-audit.md](phase-07-cli-harness-responsibility-audit.md) | complete harness cost/responsibility map and two bounded candidates |
| P08 | planned | [phase-08-evidence-decision-and-handoff.md](phase-08-evidence-decision-and-handoff.md) | accepted/rejected/deferred follow-up map |

## Track-Wide Invariants

1. `npm test` remains the full suite and must select every
   `test/**/*.test.mjs` file exactly once.
2. Targeted tests may run repeatedly while editing; each implementation cell
   runs the full suite once on its stable candidate before close.
3. Related selection never replaces Work verify, post-merge reverify, or CI.
4. A benchmark run is invalid if it fails, is interrupted, changes tracked
   snapshot input, overlaps another benchmark, or cannot account for its runtime
   conditions.
5. No optimization may delete a boundary proof merely because a lower-level test
   has similar assertions.
6. Every estimate is labelled as such until replaced by a retained before/after
   artifact.
7. Preserve unrelated working-tree changes. In particular, do not edit files
   under `docs/platform/host-invocation-routing/` or
   `docs/platform/packaging-distribution/` in this track.
8. Any symbol edit requires the repository-mandated upstream impact analysis;
   HIGH or CRITICAL results stop the cell for Lead disposition.
9. Run `detect_changes` before each cell commit when GitNexus is available; if
   unavailable, record the degraded posture and inspect the scoped diff directly.
10. User-visible scripts or guidance receive an `Unreleased` changelog entry.

## Measurement Contract

Record commit SHA, dirty-state check, Node version, OS, CPU count, Node test
concurrency, machine load, command, exit status, wall time, and user/system CPU.
Call CPU “process-tree CPU” only when the selected measurement tool is shown to
include descendants. Subprocess counts are supporting evidence and must name the
instrumented surface. Baseline reports median plus min/max; pilot reports retain
raw before and after samples and compare against measured noise.

Thresholds for P03, P04, and P06 are registered after P02 and before each pilot's
mutation. A threshold must exceed observed noise and is written into that cell's
trace; it is never invented after seeing the result.

## File Ownership

Phases may edit only their explicit file leases. Shared paths such as
`package.json`, `CHANGELOG.md`, and documentation are edited sequentially.
Generated artifacts belong under this plan's `reports/` or the coordination
track's proof directory, never `/tmp` alone.

## Out Of Scope

- Changing `engines.node` or adopting Node-24-only test flags.
- Test tier taxonomy or moving/renaming test files.
- Test-result caching or coverage-derived skipping.
- Broad mutation testing or a CI timing failure threshold.
- Rewriting `bin/fgos.mjs` into `runCli(argv, ctx)`.
- Broad validation/merge matrix consolidation before P08.
- Changing Rust-host, install, release, Work verification, merge, or approval
  behavior.
- Promoting selector behavior into a reusable fgOS capability.

## Track Exit Gate

The track closes only when:

1. P00 proves identical relevant test behavior with and without inherited agent
   session variables.
2. P01 proves portable discovery on Node 18/20-compatible APIs, zero-selection
   refusal, full file coverage, and actual test execution in every available CI
   OS lane. If a PR/push is not authorized, the missing remote CI run remains an
   explicit external gate and the track cannot claim CI restoration complete.
3. P02 records three green isolated samples and a separate green profile.
4. Every pilot has retained before/after evidence and an explicit
   expand/revise/stop verdict.
5. P05 records fallback rate and related-vs-full misses; any patch-related miss
   prevents default recommendation until repaired and re-evaluated.
6. P07 accounts for the harness's remaining subprocess cost, names preserved
   boundary representatives, and produces two implementation-ready candidate
   clusters without mutating them.
7. P08 leaves no broad refactor implicitly authorized and names the exact next
   plan required for each accepted follow-up.
8. `npm test` is green on the integrated branch, CI proof is accounted for, and
   `git diff --check` passes.

## Outstanding Questions

None. Remote CI execution may require external PR/push authority at execution
time; that is an execution gate, not a missing product decision.
