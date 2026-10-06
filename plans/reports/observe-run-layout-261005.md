# Assignment Run layout — phase 1 evidence (2026-10-05)

Scope: accepted observe-run-visibility plan phase 1 only. Phases 4–6 remain deferred. No recovery/apply operation, live-store write, test suite, build, formatter or lint was run by this worker. Read-only dry reads and the explicitly requested filesystem timing/audit were exercised. Parent owns doctor integration, manifest, changelog and final verification.

## Contract and ownership

The generic Node layout owner is `src/runner/dispatch/assignment-layout.mjs`: `listAssignmentRuns(fgosDir)` yields directory candidates, including unsettled/malformed/missing-metadata runs; `scanAssignmentLayout(fgosDir)` additionally returns `runDirsSeen` and counted `symlink`/`depth` barriers. The scan does not interpret RunResult JSON. `findRunDir(fgosDir, runId)` reads safe run metadata (result identity only when metadata has no run id). `assignmentDir` guards caller ids by real ancestor containment, including missing descendants. `.fgos` itself may be the legitimate shared-store symlink of a driver session; symlinks inside assignments are traversal barriers. This differs intentionally from an Observe settled-result admission filter.

`unit-run-history.mjs` remains the owner of latest numeric round/fallback/attempt and outcome semantics. No new index, store or writer was introduced. The immutable declarative fixture `test/fixtures/run-layout/expected.json` is materialized in temporary directories by the Node test; it contains no live report or credential content.

## Prior art and impact

Commands: `git log -S'runs/'` across the six Node walkers and doctor; `git log -S'unit-run-history' -- src docs/specs/runner.md`, followed by relevant `git show` reads.

- `4315692f1` introduced show-run's read-only Run door and flat two-level lookup.
- `f1c315d3f` removed the unenforceable actor lease and added read-only orphan classification; it introduced the flat assignments/legacy-dispatch-runs scan. Reused its unknown-versus-died policy and heartbeat freshness, not a second recovery policy.
- `819a61e55` hardened wrong-checkout evidence; no evidence/classification rule was relaxed by this layout change.
- `3945cda6e` created `unit-run-history.mjs` for report handoff, with round/fallback owner semantics; `3656ec1c3` extended one handoff mechanism between roles and workflow steps. Reused and retained this owner, not a competing latest-attempt algorithm.
- The nested writer and unit reader existed; generic flat readers had never been migrated. Evidence found no prior removed generic bounded lister to restore.

GitNexus repository binding: `forgent`, `/home/vantt/projects/forgentX`, same main checkout; initially indexed commit `7f7bec0` (2026-09-21), then parent refreshed the index successfully (58,449 nodes, 79,944 edges). Upstream impact was run before existing-symbol changes and again against the refreshed index. `findRunDir` directly affected show/watch/recovery; `resolveRunDir` affected recover observe/apply. Inspection affected result collection, repair projection, reconcile apply and inspect CLI; visibility affected stale reads. Manual risk is MEDIUM because nested active runs participate in existing fail-closed cwd guards. Several indexed zero-call LOW results were treated as UNKNOWN and reconciled with real imports/calls, never interpreted as unused.

`readRunSnapshot` impact returned CRITICAL (118 transitive hits / 28 processes, including unnamed cross-language edges); this was warned to Main before editing. Real direct consumers are show, watch, recovery snapshot/apply. The change is limited to rejecting a symlink/non-regular result before interpreting it; public snapshot shape and classification semantics remain unchanged. Initial impact queries during parent reindexing yielded inconsistent zero-call/exact results; tool QA was reported, and affected queries were rerun after refresh.

## Enumerator inventory

Searches covered `src` and `bin` for assignments/dispatch-runs path literals, directory enumerations (`readdir*`, `dirs`, list helpers), roots loops and id-derived paths; tests were inspected separately as fixture materializers, not runtime readers.

| Owner / reader | Prior assumption | Decision |
|---|---|---|
| `runtime-inspection.mjs` allRuns | flat assignments and attempts | Migrated to lister; same output and verb-local cache. Full nested assignment id retained. |
| `show-run.mjs` findRunDir | local flat lookup | Removed local enumerator/export; show, watch and recovery import canonical lookup with `.fgos` argument. |
| `visibility-session.mjs` findRunningRuns | assignments and dispatch-runs both flat roots, ambiguous fallback | Assignments use lister; legacy dispatch-runs alone retains `<work>/<timestamp>`. Nested fresh heartbeat still excluded. |
| `setup/registrations.mjs` binding snapshot check | top-level assignment, hardcoded runs/01 | Parent migrated to lister, all attempts, nearest owning unit record and symlink-safe unit/result reads. Parent reports original HEAD function passed fixture while changed reader detects nested attempt02 stale binding. |
| `assignment.mjs` createAssignmentId | top-level flat allocator ids | Intentionally unchanged: sanitized flat generated prefix/sequence; nested Unit ids are not allocator collisions. Listing directories without runs is necessary for reserved ids. |
| `operation-choice.mjs` findLatestAssignmentRunResult | flat Work gate verdicts, dispatch marker membership, Work/stage/resultKind/inline filters | Intentionally unchanged owner semantics. A nested execution-core seat is not automatically a Work-stage gate. No observed nested Work-gate use justified altering this trust-sensitive selection. |
| `execution/unit-run-history.mjs` | known Unit role/round/fallback structure | Intentionally unchanged owner semantics; generic scanner must not replace fallback selection. |
| `assignment-runner.mjs` admitRunAttempt | explicitly named assignment's local runs allocator/staging cleanup | Intentionally unchanged writer/admission owner; not a global enumeration reader. |
| Reconciliation planner cwd view | reused allRuns-backed inspect result | No local enumerator to migrate. Existing apply no-active-run guard now includes nested runs via migrated inspection. |

Remaining local enumerations in dispatch scan command/control/admission generation ledgers, worker artifacts/outbox or `/proc`; they do not discover assignments. Setup also scans domains, task specs, docs, event journals and confinement temp directories; CLI scans docs/plans. They are not alternate run definitions.

Verification-policy deviation: the proposed lexical source-inventory test was removed before suite execution. Session engineering rules prohibit permanent source-text and wiring tests; a regex allow-list also cannot prove JavaScript data flow. The inventory above retains explicit ownership reasons, and behavioral shared-fixture, nested-reader, depth, containment and planted-run cases prove the changed paths. No claim is made that a source-enumerator ratchet is implemented or green.

## Direct path-builder audit

- `recover.mjs` claim unlink joined `run.assignmentId` without containment. Nested ids alone work, but a symlinked assignment ancestor can redirect the unlink. Migrated to realpath `assignmentDir` guard; tests cover a real nested recovery claim and an outside claim that must survive a forged symlinked id. No live claim was deleted.
- `operation-choice.mjs` caller-result provenance lookup (`assignment.json`) already joins nested ids correctly, but has no explicit realpath containment guard; `consumingRunDirFor` similarly derives a candidate from caller-result assignment id/attempt, with downstream manifest-pinned evidence handling. These are existing Work-gate trust boundaries, not regressions caused by adding nested discovery; retained in the audit/allow-list rather than changing gate behavior without its required nested-case proof.
- `worker-home.mjs` mkdtemp prefix receives `round.agentName`, not the raw slash-bearing run id. `herdr-round.mjs` normalizes the complete name first with `normalizeAgentName`. Synthetic audit using `run_unit-run-example/producer/1_01` yielded `fgos-run_unit-run-examplb9cdebd0`, created a provisioned home directly under the temporary base and stayed contained. Nested Claude-seat failure did not reproduce through the actual caller contract, so production code is unchanged; regression test records it. No real HOME/credential was read.
- `assignment-runner.mjs`, dispatch CLI and execution `run.mjs` write/load explicitly chosen assignment/unit ids and do not enumerate history. `handoff-refs.mjs` already requires the unit root to be the direct assignments child before resolving named handoffs. Their writer/unit-authority contracts are intentionally unchanged.

## Live reconciliation dry-run and policy

Before cutover: allRuns 1,073 candidates; findRunningRuns 51 stale running claims. Main-cwd inspection reported five result-less active ids: three `asgn_runtime_recovery_panel_coordinator_op_012` attempts and two `asgn_tsk_p003_glm_live_proof_validate_plan_001` attempts.

Four nested result-less running producer runs were independently found before migrating the behavior-changing reader:

| Full assignment id | Run id | Started at | cwd |
|---|---|---|---|
| `unit-run-1791169494102-2353b379/producer/1` | `run_unit-run-1791169494102-2353b379/producer/1_01` | 2026-10-05T03:04:54.114Z | main checkout |
| `unit-run-1791174736476-96579bab/producer/1` | `run_unit-run-1791174736476-96579bab/producer/1_01` | 2026-10-05T04:32:16.490Z | main checkout |
| `unit-run-1791192177634-107d7b10/producer/1` | `run_unit-run-1791192177634-107d7b10/producer/1_01` | 2026-10-05T09:22:57.647Z | main checkout |
| `unit-run-1791192481353-6cb2ff04/producer/1` | `run_unit-run-1791192481353-6cb2ff04/producer/1_01` | 2026-10-05T09:28:01.371Z | main checkout |

After cutover: allRuns 1,195 candidates; findRunningRuns 55 stale running claims. Exactly these four nested ids were added to main-cwd activeRunIds (5 → 9); old flat ids remained.

Command run before and after: `node bin/fgos.mjs dispatch reconcile plan --action clear-cwd-lock --cwd /home/vantt/projects/forgentX --json`. Both returned `planned`, the same proposed path and preconditions (`holder-dead-proven`, `no-active-run-for-holder`), and unchanged snapshot digest `sha256:f73170d7355b5519e538ad80b04c921781d0775b98002005abc651c3d96f28be`. Action keys/expiry differ because planning occurred at different times. Important: plan is a guard snapshot, not authorization to skip apply's runtime inspection. Apply was NOT run. [INFERENCE from inspected apply code] actual application remains blocked while any of those nine result-less runs binds the cwd.

Policy decision: nested orphans have the same conservative liveness/cwd authority as flat orphans. Keep fail-closed blocking; no layout-specific exemption, inferred success, automatic retry, claim cleanup or store rewrite. Inspection exposes incomplete ownership honestly and stale reads classify unknown unless actual liveness evidence proves otherwise. Parent was supplied this decision for plan-state open-question sync.

Live nested show acceptance: `node bin/fgos.mjs dispatch show-run 'run_unit-run-1790918559997-8757d4c9/producer/1_01' --json` returned `settled: true`, with the identical `result.runId`. Only identities/settlement were recorded, not live discussion content.

## Timing

Seven fresh `allRuns` calls in one Node process, no verb cache; milliseconds:

- Before: 87.232, 17.624, 16.481, 16.744, 17.864, 21.392, 17.267.
- After: 57.721, 34.570, 31.895, 30.425, 32.219, 33.590, 30.058.
- Warm median (calls 2–7): 17.446 ms → 32.057 ms. Correct enumeration now reads 122 additional candidates and checks bounded directory/metadata entries; this is not a speedup versus the incomplete flat reader.
- Independent filesystem inventory: unrestricted recursion encounters 13,205 directories, versus 4,985 bounded-layout directories (including runs containers and attempt directories). This is a measured reduction, not the plan's approximate 2,000 target. `scanAssignmentLayout` reports 1,195 directory candidates and no traversal barriers in this live snapshot.

No time-window-before-JSON optimization is claimed. Cache behavior remains per verb; fixtures test nested membership, stale cached views and explicit bypass.

## Verification handoff

Written/extended behavioral proofs: shared synthetic layout, flat/nested/fallback/missing metadata, planted outbox exclusion, symlink attempt/result exclusion, cap boundary/barrier accounting, real ancestor containment, nested inspect/show/watch, nested running versus settled and fresh driver, retained nested-home caller contract, nested standalone recovery and protected external claim. Tests were not executed here.

Parent verification targets:

- `test/runner/assignment-layout.test.mjs`
- `test/runner/dispatch-visibility-session.test.mjs`
- `test/runner/dispatch-runtime-inspect.test.mjs`
- `test/runner/dispatch-r9-performance-cache.test.mjs`
- `test/runner/dispatch-reconciliation.test.mjs`
- `test/runner/dispatch-reconciliation-import-graph.test.mjs`
- `test/runner/dispatch-worker-home.test.mjs`
- `test/verbs/dispatch-observe.test.mjs`
- `test/verbs/dispatch-recovery.test.mjs`
- parent-owned setup/doctor coverage and mutating binding-snapshot tests
- architecture manifest/import-layer test and the final authoritative `npm test` once after integration.

Parent integration requirements: architecture-manifest row for the new dispatch module, Unreleased changelog, Observe spec link, plan open-question/status sync. Behavioral suites remain pending parent execution; no green claim is made.
