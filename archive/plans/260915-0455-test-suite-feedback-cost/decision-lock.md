# Test Suite Feedback Cost - Decision Lock

**Status:** locked for implementation planning

**Evidence inputs:**

- `plans/reports/advisory-260915-0413-test-suite-tiering-and-related-selection.md`
- `plans/reports/artifacts/260915-npm-test-baseline-224f0803/`
- `docs/history/tsk-25b-test-wallclock-split/`
- `docs/history/test-suite-dry-consolidation/`
- `docs/history/npm-test-cpu-real-claude-spawns/`

## Locked Decisions

| ID | Decision | Reason |
|---|---|---|
| TFC-D01 | `npm test` remains the full-suite Definition-of-Done proof. Related selection is an inner-loop aid only and never replaces item, post-merge, or CI gates. | Platform-foundations L5 and both reviewers agree that faster feedback must not weaken completion proof. |
| TFC-D02 | Fix test hermeticity and portable test discovery before collecting a green baseline or judging any optimization pilot. | The current harness changes behavior under agent-session env, while CI has not run the suite in its 12 most recent recorded runs. |
| TFC-D03 | Pin a valid test-only `FGOS_SESSION_ID` for CLI children, with explicit test overrides winning. Do not merely unset agent-session variables and do not change sequence expectations before identity is pinned. | `FGOS_SESSION_ID` has precedence over `CLAUDE_CODE_SESSION_ID`; pid-walk fallback can still collapse parent and child identities. |
| TFC-D04 | Keep Node `>=18`. Replace shell-dependent env assignment and quoted glob discovery with one Node runner that discovers files using `fs`, invokes `node --test` with an argument array, and sets test env in the child. | Ubuntu/macOS fail on the quoted glob under Node 20; Windows fails earlier on POSIX env syntax. Raising Node would evade rather than fix the portability defect. |
| TFC-D05 | A new green baseline uses an isolated immutable snapshot, records environment and load, runs three complete full-suite samples plus one separate profile, and rejects interrupted, dirty, or failing samples. | Historical timings and the 356-second exit-1 profile are useful orientation but are not a reproducible green baseline. |
| TFC-D06 | Optimize through independent pilots with separate before/after evidence: docs-index state fixture, external-Claude isolation, related-test selector, and CLI fixture initialization. No pilot's result may be attributed to another. | The two reviewers converged on independent measurement rather than a bundled “suite faster” claim. |
| TFC-D07 | Related selection is repository-local, manifest-first, conservative, and fail-safe. Every changed path must be explained; unknown, invalid, shared-core, test-infrastructure, or unsafe paths force full selection. Import analysis may only add tests. | Static imports cannot see subprocess, dynamic file, registry, generated projection, or configuration dependencies reliably. |
| TFC-D08 | The selector combines merge-base-to-working-tree tracked changes with untracked paths, preserves both sides of rename/delete information, explains every selection/escalation, and never returns a vacuous green result. | The inner-loop command must be auditable and must fail closed when its dependency knowledge is incomplete. |
| TFC-D09 | Test consolidation requires a proven common guard site and preserved boundary proofs. Parameterization alone is source cleanup, not a performance result. Coverage is supporting evidence only. | Similar exit codes or assertion text do not establish the same invariant or execution boundary. |
| TFC-D10 | Tier taxonomy, result cache, Node-24-only rerun features, broad mutation testing, CI timing thresholds, matrix consolidation, and `runCli(argv, ctx)` are outside this track. | None is required to evaluate the four pilots; several add compatibility or architecture risk before the measured foundations exist. |
| TFC-D11 | The final cell compares pilot value, confidence, maintenance cost, and fallback rate, then recommends explicit follow-up work. It does not implement unplanned broad expansion. | A code-panel-ready plan cannot pre-authorize a refactor whose hotspot and acceptance threshold depend on pilot evidence not yet produced. |
| TFC-D12 | This is repository-local dogfood infrastructure. Promotion into a general fgOS capability requires separate mission-1/mission-2 evidence and a new decision. | D-ADR0035 forbids treating convenience for fgOS self-development as sufficient product justification. |
| TFC-D13 | Before final close, audit the CLI harness's remaining `run()` population by proof responsibility and measured cost; produce bounded follow-up candidates instead of treating P00/P06 as a complete harness solution. | The harness is simultaneously a process boundary, behavior-test door, and fixture builder; the initial pilots address only part of its dominant subprocess cost. |

## Corrected Facts

- Agent-session failure in `fgos-intake-4` is a harness hermeticity defect, not a product regression and not load-driven flakiness.
- In each inspected CI run, Ubuntu and macOS miss the quoted test glob; Windows rejects the POSIX environment assignment. All three lanes therefore fail before running tests.
- The 356-second profile at `224f0803` exited 1 and is not the green baseline.
- Docs-index savings and most external-Claude savings remain pilot estimates until measured under this track.

## Outstanding Questions

None. `tmpCwd()` implementation choice is deliberately an experiment inside Phase 06, not an unresolved product decision.
